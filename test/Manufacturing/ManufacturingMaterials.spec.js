// Manufacturing's materials and stock (impl-manufacturing P5b's "usable when"; design-manufacturing Components,
// MaterialIssueReceipt, InventoryAvailability, Home): two components are issued at two operations through the Manufacturing
// mount (WorkOrderDetail's Materials tab, Shared/MaterialIssueReceipt) and an operator without STOCK_ISSUE for the facility
// is refused the same posting; a backflush preview shows its lots and issues once; a short line's issue stays blocked
// after a supervisor's staged release, which notices the planners; a planner adds a manual line on Components; the
// Planning area's InventoryAvailability shows held stock by status apart; Home counts the open, late and short work orders.
// The screens and their transitions run as the demo users with artifact authorization enabled; the setup's verbs as the
// screens run them (artifact authorization off, F-P3-2).
// Run: ./moq test mr-boss --spec ManufacturingMaterials
const lib = ec.resource.script("component://mr-boss/test/Manufacturing/ManufacturingSpecLib.js")
const {ids, users, asUser, system, invoke} = lib
const P = "mantle.work.ProductionServices."
const asService = (user, action) => asUser(user, action, false)
const state = {}
let keySeq = 0
const key = () => "spec-mat-" + Date.now() + "-" + ++keySeq
const runOf = workEffortId => system(() => ec.entity.find("mantle.work.effort.WorkEffort").condition({workEffortId}).one())
const revisionOf = workEffortId => Number(runOf(workEffortId).productionRevision || 0)
const linesOf = workEffortId =>
    system(() => Array.from(ec.entity.find("mantle.work.production.ProductionRunLine").condition({workEffortId}).list()))
const lineOf = (workEffortId, productId) => linesOf(workEffortId).find(row => row.productId === productId)
const issuancesOf = workEffortId =>
    system(() => Array.from(ec.entity.find("mantle.product.issuance.AssetIssuance").condition({workEffortId}).list()))
function draft(quantity, facilityId = ids.lineId) {
    return asService(users.plan, () =>
        invoke(P + "create#ProductionOrder", {
            operationKey: key(),
            organizationPartyId: "ORG_ZIZI_RETAIL",
            productId: ids.productId,
            productBomId: ids.methodId,
            quantity,
            facilityId
        })
    ).workEffortId
}
const act = (user, workEffortId, action) =>
    asService(user, () =>
        lib.refusal(P + "transition#ProductionOrder", {
            operationKey: key(),
            workEffortId,
            action,
            expectedRevision: revisionOf(workEffortId)
        })
    )
// a transition of a Manufacturing screen posted as the user, with artifact authorization enabled: its errors, "" when none
function post(user, path, parameters) {
    return asUser(user, () => {
        const result = ec.screen
            .makeTest()
            .rootScreen("component://mr-boss/screen/Manufacturing.xml")
            .render(path, parameters, "post")
        const errors = Array.from(result.errorMessages || []).join(" | ")
        ec.message.clearErrors()
        return errors
    })
}
const materials = "WorkOrders/WorkOrderDetail/MaterialIssueReceipt"

spec({
    setupSpec() {
        // stock of the demo method's components at Retail's plant, and a held lot of DEMO_RM_1
        system(() => {
            const receive = (productId, quantity, statusId = "AstAvailable") =>
                ec.service
                    .sync()
                    .name("mantle.product.AssetServices.receive#Asset")
                    .parameters({
                        productId,
                        quantity,
                        facilityId: ids.plantId,
                        ownerPartyId: "ORG_ZIZI_RETAIL",
                        assetTypeEnumId: "AstTpInventory",
                        statusId,
                        acquireCost: 1
                    })
                    .call().assetId
            for (const productId of ["DEMO_SA_1", "DEMO_SA_2", "DEMO_RM_1"]) state[productId] = receive(productId, 40)
            state.held = receive("DEMO_RM_1", 3, "AstQuarantine")
        })
        // line B backflushes the run lines (its own policy override)
        const policy = asService(users.resource, () =>
            lib.refusal(P + "store#ProductionPolicy", {
                facilityId: ids.lineBId,
                consumptionMethodEnumId: "PcmBackflush",
                issuePointEnumId: "PipOperationComplete",
                changeReason: "Spec backflush line"
            })
        )
        if (policy) throw new Error("Policy failed: " + policy)
        const until = Date.now() + 25
        while (Date.now() < until) {}
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "two components are issued at two operations through the Manufacturing mount; an operator without STOCK_ISSUE is refused",
    {
        when() {
            const workEffortId = draft(1)
            const released = act(users.plan, workEffortId, "release")
            const page = asUser(users.material, () => lib.page(materials, {workEffortId, lastStandalone: "true"}, "html"))
            const readerPage = asUser(users.read, () => lib.page(materials, {workEffortId, lastStandalone: "true"}, "html"))
            const issue = (user, productId, quantity) =>
                post(user, materials + "/materialAction", {
                    workEffortId,
                    sourceId: workEffortId,
                    lineKey: lineOf(workEffortId, productId).productionRunLineId,
                    assetId: state[productId],
                    quantity,
                    operationKey: key()
                })
            // the operator holds PRODUCTION_OPERATE but not Warehouse's STOCK_ISSUE: the same posting is refused
            const refused = issue(users.operate, "DEMO_SA_1", 1)
            const first = issue(users.material, "DEMO_SA_1", 1)
            const second = issue(users.material, "DEMO_RM_1", 4)
            const issued = issuancesOf(workEffortId)
            const after = asUser(users.material, () => lib.page(materials, {workEffortId, lastStandalone: "true"}, "html"))
            return {workEffortId, released, page, readerPage, refused, first, second, issued, after}
        },
        then({released, page, readerPage, refused, first, second, issued, after}) {
            released == ""
            page.errors.length == 0
            page.output.includes("Issue component")
            page.output.includes("Manual issue")
            readerPage.errors.length == 0
            !readerPage.output.includes("Issue component")
            refused.includes("PERMISSION_DENIED")
            first == ""
            second == ""
            issued.length == 2
            new Set(issued.map(row => row.operationWorkEffortId)).size == 2
            issued.every(row => !!row.productionMaterialLineId)
            after.output.includes("Posted issues and receipts")
        }
    }
)

feature("a backflush preview shows its lots and issues once", {
    when() {
        const workEffortId = draft(1, ids.lineBId)
        const released = act(users.plan, workEffortId, "release")
        const page = asUser(users.material, () => lib.page(materials, {workEffortId, lastStandalone: "true"}, "html"))
        const preview = asService(users.material, () => invoke(P + "preview#ProductionBackflush", {workEffortId}))
        const request = {workEffortId, actionKind: "backflush", previewKey: preview.previewKey, operationKey: key()}
        const confirmed = post(users.material, materials + "/materialAction", request)
        const once = issuancesOf(workEffortId).length
        const again = post(users.material, materials + "/materialAction", request)
        const twice = issuancesOf(workEffortId).length
        return {released, page, preview, confirmed, once, again, twice}
    },
    then({released, page, preview, confirmed, once, again, twice}) {
        released == ""
        page.errors.length == 0
        page.output.includes("Backflush")
        page.output.includes("Confirm backflush")
        preview.canConfirm == true
        preview.lineRows.length == 3
        preview.lineRows.every(row => row.picks.length > 0 && row.pickText.includes(" from "))
        confirmed == ""
        once == 3
        again == ""
        twice == 3
    }
})

feature("a short line's issue stays blocked after a supervisor's staged release, which notices the planners", {
    when() {
        const workEffortId = draft(5000)
        const refused = act(users.plan, workEffortId, "release")
        const approved = act(users.supervise, workEffortId, "approveStaged")
        const released = act(users.plan, workEffortId, "release")
        const shortLine = linesOf(workEffortId).find(row => Number(String(row.stagedShortQuantity ?? 0)) > 0)
        const blocked = post(users.material, materials + "/materialAction", {
            workEffortId,
            lineKey: shortLine.productionRunLineId,
            assetId: state[shortLine.productId],
            quantity: 1,
            operationKey: key()
        })
        const components = asUser(users.plan, () =>
            lib.page("WorkOrders/WorkOrderDetail/Components", {workEffortId, lastStandalone: "true"}, "html")
        )
        const notices = system(() =>
            Array.from(
                ec.entity
                    .find("moqui.security.user.NotificationMessage")
                    .condition({topic: "ProductionShortage", recordId: workEffortId})
                    .list()
            )
        )
        const home = asUser(users.read, () => lib.page("Home", {}, "html"))
        const homeData = asUser(users.read, () => invoke("ironstone.manufacturing.HomeServices.get#Home", {}))
        return {workEffortId, refused, approved, released, blocked, components, notices, home, homeData}
    },
    then({workEffortId, refused, approved, released, blocked, components, notices, home, homeData}) {
        refused.includes("SHORTAGE")
        approved == ""
        released == ""
        blocked.includes("LINE_STAGED_SHORT")
        issuancesOf(workEffortId).length == 0
        components.errors.length == 0
        components.output.includes("Released short")
        notices.length == 1
        home.errors.length == 0
        homeData.summary.openCount > 0
        homeData.summary.shortCount > 0
        homeData.summary.lateCount != null
        homeData.queueRows.some(row => row.url.includes("Components?workEffortId=" + workEffortId))
    }
})

feature("a planner adds a manual line to a draft on Components; a reader sees no Add material", {
    when() {
        const workEffortId = draft(1)
        const path = "WorkOrders/WorkOrderDetail/Components"
        const plannerPage = asUser(users.plan, () => lib.page(path, {workEffortId, lastStandalone: "true"}, "html"))
        const readerPage = asUser(users.read, () => lib.page(path, {workEffortId, lastStandalone: "true"}, "html"))
        const added = post(users.plan, path + "/storeMaterial", {
            workEffortId,
            expectedRevision: revisionOf(workEffortId),
            operationKey: key(),
            productId: "DEMO_SA_1",
            quantity: "2",
            routingOperationWorkEffortId: ids.routingOperationIds[1],
            sourceFacilityId: ids.plantId
        })
        const readerAdd = post(users.read, path + "/storeMaterial", {
            workEffortId,
            expectedRevision: revisionOf(workEffortId),
            operationKey: key(),
            productId: "DEMO_SA_1",
            quantity: "1"
        })
        const manual = linesOf(workEffortId).filter(row => row.manualLine === "Y")
        // the Edit dialog posts every field with clearEmpty, so an emptied source facility clears (F-P5b-1)
        const edited = post(users.plan, path + "/storeMaterial", {
            workEffortId,
            expectedRevision: revisionOf(workEffortId),
            operationKey: key(),
            productionRunLineId: manual[0]?.productionRunLineId,
            quantity: "3",
            routingOperationWorkEffortId: ids.routingOperationIds[1],
            sourceFacilityId: "",
            instructionText: "",
            clearEmpty: "true"
        })
        const editedLine = linesOf(workEffortId).find(row => row.manualLine === "Y")
        const after = asUser(users.plan, () => lib.page(path, {workEffortId, lastStandalone: "true"}, "html"))
        return {plannerPage, readerPage, added, readerAdd, manual, edited, editedLine, after}
    },
    then({plannerPage, readerPage, added, readerAdd, manual, edited, editedLine, after}) {
        plannerPage.errors.length == 0
        plannerPage.output.includes("Add material")
        readerPage.errors.length == 0
        !readerPage.output.includes("Add material")
        added == ""
        readerAdd.includes("PERMISSION_DENIED")
        manual.length == 1
        manual[0].routingOperationWorkEffortId == ids.routingOperationIds[1]
        manual[0].sourceFacilityId == ids.plantId
        edited == ""
        Number(String(editedLine.stockQuantity)) == 3
        editedLine.sourceFacilityId == null
        editedLine.routingOperationWorkEffortId == ids.routingOperationIds[1]
        after.output.includes("Remove")
    }
})

feature("Planning's InventoryAvailability shows held stock by status apart for a planner, and not for a reader", {
    when() {
        const parameters = {productId: "DEMO_RM_1", facilityId: ids.plantId}
        const planner = asUser(users.plan, () => lib.page("Planning/InventoryAvailability/Summary", parameters, "html"))
        const reader = asUser(users.read, () => lib.page("Planning/InventoryAvailability/Summary", parameters, "html"))
        return {planner, reader}
    },
    then({planner, reader}) {
        planner.status == 200
        planner.errors.length == 0
        planner.output.includes("Quarantine")
        planner.output.includes("Held is quarantined, on-hold and defective stock")
        !planner.output.includes("Show policy")
        reader.status != 200 || !reader.output.includes("Quarantine")
    }
})
