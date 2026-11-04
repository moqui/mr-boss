// Manufacturing's downtime and maintenance (impl-manufacturing P11, its "usable when"), through the calls the Downtime screens
// make after the Manufacturing access check and the pages they show: an operator reports a robot fault on line A with a
// maintenance request that the supervisor opens in Manufacturing's RequestDetail, and the robot is out of service in
// Manufacturing; a no-material stop offers no maintenance on Downtime; a supervisor's correction shows the original stop in
// the history; a long stop waits for the supervisor's Approve stop; a follow-up task of the request opens in Manufacturing's
// WorkItemDetail. The Mantle calls run with artifact authorization disabled, as a screen's transition inherits it: they
// check their own permissions (F53). The rules of the stops (the maintenance and request made, the one outage a second
// fault links, closing, correction, approval) are mr-mantle's ProductionDowntime spec. Refusals and the other organization
// are ManufacturingAccess's P11 section.
// Run: ./moq test mr-boss --spec ManufacturingDowntime
const lib = ec.resource.script("component://mr-boss/test/Manufacturing/ManufacturingSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page} = lib
const access = "ironstone.manufacturing.AccessServices."
const production = "mantle.work.ProductionServices."
// the second demo robot, so the first stays available for the other specs' pages
const robotId = "EQUIP_AB4_2"
let keySeq = 0
const key = () => "spec-p11-" + Date.now() + "-" + ++keySeq
// as the screen's transition: the record check, then the Mantle verb (its result map)
function report(user, parameters) {
    asUser(user, () => invoke(access + "check#Record", {recordType: "workCenter", recordId: parameters.facilityId}))
    return asUser(
        user,
        () =>
            invoke(production + "store#ProductionDowntime", Object.assign({operationKey: key(), action: "open"}, parameters))
                .result,
        false
    )
}
const store = (user, parameters) =>
    asUser(
        user,
        () => invoke(production + "store#ProductionDowntime", Object.assign({operationKey: key()}, parameters)).result,
        false
    )
const requestMaintenance = (user, parameters) =>
    asUser(
        user,
        () => invoke(production + "request#ProductionMaintenance", Object.assign({operationKey: key()}, parameters)).result,
        false
    )
// the state the features share: the robot fault and its request
const state = {}
function robotFault() {
    if (state.fault) return state.fault
    const opened = report(users.operate, {
        facilityId: ids.lineId,
        assetId: robotId,
        reasonCode: "ROBOT_FAULT",
        description: "Gripper jams"
    })
    const requested = requestMaintenance(users.operate, {
        productionDowntimeId: opened.productionDowntimeId,
        problem: "Gripper jams on every third part",
        priority: 2,
        createRequest: true
    })
    state.fault = {opened, requested}
    return state.fault
}

spec({
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("an operator reports a robot fault on line A with a maintenance request; the supervisor opens it in Manufacturing", {
    when() {
        const {requested} = robotFault()
        return {
            downtimePage: asUser(users.operate, () => page("WorkCenters/Downtime", {facilityId: ids.lineId})),
            requestPage: asUser(users.supervise, () => page("WorkCenters/RequestDetail", {requestId: requested.requestId})),
            // EquipmentDetail's availability (its render is ManufacturingWorkCenters')
            equipment: asUser(users.operate, () =>
                invoke("ironstone.manufacturing.WorkCenterServices.get#Equipment", {assetId: robotId})
            )
        }
    },
    then({downtimePage, requestPage, equipment}) {
        downtimePage.errors.length == 0
        downtimePage.output.includes("Assembly robot fault")
        downtimePage.output.includes("Report stop")
        requestPage.errors.length == 0
        requestPage.output.includes("Production")
        requestPage.output.includes("Assembly line A")
        requestPage.output.includes("Corrective Maintenance")
        requestPage.output.includes("Assembly Bot 4 2345")
        equipment.availabilityText == "Out of service"
        equipment.blocked == true
    }
})
feature("a no-material stop's row offers no maintenance; a robot fault's row offers it", {
    when() {
        const hold = report(users.operate, {facilityId: ids.lineBId, reasonCode: "MATERIAL_HOLD"})
        const fault = report(users.operate, {facilityId: ids.lineBId, assetId: robotId, reasonCode: "ROBOT_FAULT"})
        const holdPage = asUser(users.operate, () =>
            page("WorkCenters/Downtime", {productionDowntimeId: hold.productionDowntimeId})
        )
        const faultPage = asUser(users.operate, () =>
            page("WorkCenters/Downtime", {productionDowntimeId: fault.productionDowntimeId})
        )
        return {holdPage, faultPage}
    },
    then({holdPage, faultPage}) {
        holdPage.errors.length == 0
        holdPage.output.includes("Waiting for material")
        !holdPage.output.includes("Request maintenance")
        faultPage.output.includes("Request maintenance")
    }
})
feature("a supervisor's correction shows the original stop in the history", {
    when() {
        const from = new Date(Date.now() - 50 * 60000)
        const stop = report(users.operate, {
            facilityId: ids.lineId,
            reasonCode: "CHANGEOVER",
            fromDate: from,
            thruDate: new Date()
        })
        const check = asUser(users.supervise, () =>
            refusal(access + "check#Record", {
                recordType: "downtime",
                recordId: stop.productionDowntimeId,
                capability: "supervise"
            })
        )
        const corrected = store(users.supervise, {
            action: "correct",
            productionDowntimeId: stop.productionDowntimeId,
            expectedRevision: 1,
            fromDate: new Date(Date.now() - 40 * 60000),
            changeReason: "Changeover started later"
        })
        const historyPage = asUser(users.read, () =>
            page("WorkCenters/Downtime", {productionDowntimeId: corrected.productionDowntimeId})
        )
        return {stop, check, corrected, historyPage}
    },
    then({stop, check, corrected, historyPage}) {
        check == ""
        corrected.resultCode == "CORRECTED"
        historyPage.errors.length == 0
        historyPage.output.includes("Correction history")
        historyPage.output.includes(stop.productionDowntimeId)
        historyPage.output.includes("Changeover started later")
    }
})
feature("a stop longer than its reason's threshold waits for the supervisor's approval on Downtime", {
    when() {
        // the robot fault reason's threshold is 60 minutes; no equipment, so no outage
        const stop = report(users.operate, {
            facilityId: ids.lineId,
            reasonCode: "ROBOT_FAULT",
            fromDate: new Date(Date.now() - 90 * 60000),
            thruDate: new Date(Date.now() - 5 * 60000)
        })
        const parameters = {productionDowntimeId: stop.productionDowntimeId}
        const operatorPage = asUser(users.operate, () => page("WorkCenters/Downtime", parameters))
        const supervisorPage = asUser(users.supervise, () =>
            page("WorkCenters/Downtime", {needsApproval: "true", facilityId: ids.lineId})
        )
        const check = asUser(users.supervise, () =>
            refusal(access + "check#Record", {
                recordType: "downtime",
                recordId: stop.productionDowntimeId,
                capability: "supervise"
            })
        )
        return {stop, operatorPage, supervisorPage, check}
    },
    then({stop, operatorPage, supervisorPage, check}) {
        operatorPage.errors.length == 0
        operatorPage.output.includes("Needs approval")
        !operatorPage.output.includes("Approve stop")
        supervisorPage.errors.length == 0
        supervisorPage.output.includes(stop.productionDowntimeId)
        supervisorPage.output.includes("Approve stop")
        check == ""
    }
})
feature("a follow-up task of the maintenance request opens in Manufacturing's WorkItemDetail; a run's operation does not", {
    when() {
        const {requested} = robotFault()
        // as the request's Tasks tab adds one for its reporter, inheriting the screen's authorization
        const task = asUser(
            users.operate,
            () =>
                invoke("ironstone.commons.RequestServices.add#RequestTask", {
                    requestId: requested.requestId,
                    workEffortName: "Replace gripper pads"
                }),
            false
        )
        const taskId = system(
            () =>
                Array.from(ec.entity.find("mantle.request.RequestWorkEffort").condition({requestId: requested.requestId}).list())
                    .map(link =>
                        ec.entity.find("mantle.work.effort.WorkEffort").condition({workEffortId: link.workEffortId}).one()
                    )
                    .find(work => work && work.workEffortName === "Replace gripper pads")?.workEffortId
        )
        return {
            task,
            taskId,
            taskPage: asUser(users.operate, () => page("WorkCenters/WorkItemDetail", {workEffortId: taskId})),
            operationPage: asUser(users.supervise, () => page("WorkCenters/WorkItemDetail", {workEffortId: ids.operationId}))
        }
    },
    then({taskId, taskPage, operationPage}) {
        taskId != null
        taskPage.errors.length == 0
        taskPage.output.includes("Replace gripper pads")
        taskPage.output.includes("Maintenance request")
        taskPage.output.includes("Maintenance of Assembly Bot 4 2345")
        operationPage.output.includes("not available in Manufacturing") || operationPage.output.includes("not a follow-up task")
    }
})
