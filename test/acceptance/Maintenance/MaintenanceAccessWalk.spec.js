// The Maintenance access and isolation walk (design-maintenance §11.2 "Device/access paths" and "Privacy and policy", §1.1;
// impl-maintenance P20), an acceptance test with artifact authorization on, on CustomerServiceAccessWalk's pattern. Each side,
// Ziziwork Services (the demo's Maintenance organization) and Ziziwork Retail (maint.retail's alone), gets a work order and a
// reported problem with a secret name on its equipment (Services' compressor, Retail's forklift); the Services work order is
// assigned to maint.tech for tomorrow. Then, for a user of each Maintenance group, none of whom has another app's launcher:
// - each opens Maintenance and none of the other app roots, and the launcher lists none of them;
// - the other organization's work, equipment and requests never show to them: not on the Maintenance routes with the record's id
//   (each tab of WorkOrderDetail, EquipmentDetail and FacilityDetail, the shared mounts RequestDetail and MaterialIssueReceipt, the
//   lists with the secret as their text, Home and the reports for the other organization), not in the work order print, the asset
//   tags print or the lists' and reports' CSV, the palette, the drop-downs (searched and as the selected value), the Chatter and
//   RecordFiles panels, Assist's Log as note and Send as message, the projected CalDAV collections or the Mantle services the
//   screens call; and a transition on another organization's record (a lifecycle action, a triage, a meter reading, a note) is
//   refused and changes nothing. Within Services, a work order is not shown to a technician it is not assigned to, a procedure
//   author or approver, a booking approver or a resource administrator;
// - costs are the cost reader's: the Costs tab, the cost report and the cost service are refused to every other group, and no
//   route shows a priced amount of the demo's belt repair; no one, the cost reader included, sees a person's own rate (the belt
//   time entry's vendorHourRate, set by the walk);
// - a booking of Room 101 is Busy, with no title, to everyone but its organizer (the planner's vendor walkthrough, the technician's
//   shift handover), in the calendar read and in Maintenance's resource calendar;
// - a procedure is authored by its author only: every other group, and Retail's planner, is refused the procedure, step and
//   approval services and ProcedureDetail's transitions, and the draft is unchanged.
// - Teams (P8) is read by a planner and a supervisor (BOSS_MNT_TEAMS) and the administrator only, Retail's planner reads no Services
//   team on it, in the team choice or by the service, and no one but the administrator writes a team's defaults;
// - a customer repair (P12, MaintenanceSpecLib.customerRepair: a spec-local organization's claim made a work order assigned to its
//   technician) shows to no Maintenance group user of Services or Retail: not its WorkOrderDetail, its intervention report (html
//   and print) or the customer's unit, nor through the services; its technician reads the report, which carries no amount (the
//   user's call of Nov 12).
// maint.admin works every organization (MAINTENANCE_ALL_ORGANIZATIONS) and is left out of the isolation. The rules are
// MaintenanceAccess's (one case each) and Mantle's; the menus per group are MaintenanceFoundationWalk's.
// Run: ./moq accept mr-boss --spec MaintenanceAccessWalk
const lib = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
const {ids, users, asUser, system, shell} = lib
const stamp = ec.l10n.format(ec.user.nowTimestamp, "HHmmssSSS")
const M = "mantle.work.MaintenanceServices."
const WORK = "mantle.work.effort.WorkEffort"
const webroot = "component://webroot/screen/webroot.xml"
const otherRoots = [
    "Products",
    "Accounting",
    "Sales",
    "Warehouse",
    "Manufacturing",
    "Purchasing",
    "Projects",
    "CustomerService",
    "People",
    "Insights",
    "Admin",
    "Commerce",
    "Marketing"
]
// every Maintenance group's demo user; maint.admin works every organization
const groupUsers = [
    users.reader,
    users.planner,
    users.tech,
    users.tech2,
    users.supervisor,
    users.author,
    users.approver,
    users.booking,
    users.resources,
    users.cost,
    users.retailPlanner,
    users.admin
]
const servicesUsers = groupUsers.filter(user => user !== users.retailPlanner && user !== users.admin)
// within Services, the users a work order is not shown to: a technician not assigned to it, the procedure author and approver, the
// booking approver and the resource administrator (no work read)
const notWorkReaders = [users.tech2, users.author, users.approver, users.booking, users.resources]
const state = {}

// the two sides: the organization, its equipment, its owner planner, the walk's secrets and its viewers from the other side
const sides = {
    retail: {
        org: ids.otherOrganizationId,
        assetId: ids.otherAssetId,
        facilityId: ids.otherFacilityId,
        serial: "FL-2026-002",
        owner: users.retailPlanner,
        workName: "P20 Retail work " + stamp,
        reportName: "P20 Retail report " + stamp,
        viewers: servicesUsers
    },
    services: {
        org: ids.organizationId,
        assetId: ids.compressorId,
        facilityId: ids.buildingId,
        serial: "AC200-0042",
        owner: users.planner,
        workName: "P20 Services work " + stamp,
        reportName: "P20 Services report " + stamp,
        viewers: [users.retailPlanner]
    }
}
const pattern = s => new RegExp(`${s.workName}|${s.reportName}|${s.serial}`)
// a list's search text: the secret without its "P20 " head (a serial without its first character), so the list's own echo of the
// query (its find field, its saved finds' links) is not taken for a row, while a row showing the record still has the whole secret
const query = secret => secret.replace(/^P20 /, "")

// a Maintenance (or another root's) screen as the user, in a render mode: its status, output and errors
function render(user, path, parameters = {}, mode = "html", root = "Maintenance") {
    return asUser(user, () => {
        let result
        try {
            const test = ec.screen.makeTest().rootScreen(`component://mr-boss/screen/${root}.xml`).renderMode(mode)
            if (mode === "qvt") test.withStaticData()
            result = test.render(path, Object.assign({lastStandalone: "-2"}, parameters), null)
        } catch (error) {
            result = {status: 0, output: "", errorMessages: [String(error.message)]}
        }
        ec.message.clearErrors()
        return {
            status: result.status,
            output: String(result.output || ""),
            errors: Array.from(result.errorMessages || []).join(" | ")
        }
    })
}
const opens = got => got.status == 200 && !got.errors
// a transition posted as the user: its errors, or its status when it is refused with none ("" when it is accepted)
function post(user, path, parameters) {
    return asUser(user, () => {
        let errors
        try {
            const result = ec.screen
                .makeTest()
                .rootScreen("component://mr-boss/screen/Maintenance.xml")
                .render(path, parameters, "post")
            errors = Array.from(result.errorMessages || []).join(" | ") || (result.status >= 400 ? "status " + result.status : "")
        } catch (error) {
            errors = String(error.message)
        }
        ec.message.clearErrors()
        return errors
    })
}
// a path under the web root as the user (the record panels' data): status, output and errors
function hit(user, path, parameters = {}) {
    return asUser(user, () => {
        const result = ec.screen.makeTest().rootScreen(webroot).render(path, parameters, "get")
        const errors = Array.from(result.errorMessages || []).join(" | ")
        ec.message.clearErrors()
        return {status: result.status, output: String(result.output || ""), errors}
    })
}
// a Mantle or BOSS service as the screens call it (the root's grant aside, its own checks deciding): its result and its error
function as(user, service, parameters = {}) {
    return asUser(user, () => {
        ec.artifactExecution.disableAuthz()
        ec.message.pushErrors()
        try {
            const out = ec.service.sync().name(service).parameters(parameters).requireNewTransaction(true).call() || {}
            return Object.assign({}, out, {error: ec.message.hasError() ? ec.message.getErrorsString() : ""})
        } catch (error) {
            return {error: String(error.message || error)}
        } finally {
            ec.message.clearErrors()
            ec.message.popErrors()
        }
    })
}
const one = (entity, conditions) => system(() => ec.entity.find(entity).condition(conditions).one())

// the Maintenance routes that show a side's records, with the record ids the walk made
function routes(s) {
    const work = {workEffortId: s.workId}
    const asset = {assetId: s.assetId}
    const tabs = (path, names, parameters) => names.map(name => [path + "/" + name, parameters])
    return [
        ["WorkOrders/WorkOrderDetail", work],
        ...tabs(
            "WorkOrders/WorkOrderDetail",
            ["Overview", "Procedure", "Time", "Parts", "Purchasing", "Downtime", "Files", "Conversation", "History", "Costs"],
            work
        ),
        ["WorkOrders/WorkOrderDetail/Instructions", Object.assign({lastStandalone: "true"}, work), "html-print"],
        ["WorkOrders/MaterialIssueReceipt", work],
        ["WorkOrders/Find", {text: query(s.workName)}],
        ["WorkOrders/Find", {text: query(s.workName), pageNoLimit: "true", lastStandalone: "true"}, "csv"],
        ["Requests/RequestDetail", {requestId: s.requestId}],
        ["Requests/Find", {text: query(s.reportName)}],
        ["Equipment/EquipmentDetail", asset],
        ...tabs(
            "Equipment/EquipmentDetail",
            ["Identity", "Hierarchy", "Assignments", "Meters", "Maintenance", "Files", "Schedule"],
            asset
        ),
        ["Equipment/Find", {text: s.serial.substring(1)}],
        ["Equipment/AssetTags", {assetIds: s.assetId, lastStandalone: "true"}, "html-print"],
        ["Equipment/Downtime", asset],
        ["Facilities/FacilityDetail", {facilityId: s.facilityId}],
        ...tabs("Facilities/FacilityDetail", ["Overview", "Equipment", "WorkOrders"], {facilityId: s.facilityId}),
        ["Home", {organizationPartyId: s.org}],
        ["Reports/WorkStatusReport", {organizationPartyId: s.org}],
        ["Reports/WorkStatusReport", {organizationPartyId: s.org, pageNoLimit: "true", lastStandalone: "true"}, "csv"],
        ["Preventive/DueMaintenance", {organizationPartyId: s.org}],
        ["LogNote", {entityName: WORK, recordId: s.workId}],
        ["SendMessage", {entityName: WORK, recordId: s.workId}]
    ].map(([path, parameters, mode]) => ({path, parameters, mode: mode || "html"}))
}
const routeName = route => `${route.path} ${route.mode} ${JSON.stringify(route.parameters)}`
// the routes that show a side's records to its own planner (the positive control: a refusal above is not a broken route)
const requiredShown = ["WorkOrders/WorkOrderDetail", "Requests/RequestDetail", "Equipment/EquipmentDetail/Identity"]

spec({
    setupSpec() {
        login("john.doe")
        // each side's work order and report on its equipment, made by its own users
        const key = name => "p20-access-" + name + "-" + stamp
        for (const [name, s] of Object.entries(sides)) {
            const made = as(s.owner, M + "create#MaintenanceWorkOrder", {
                assetId: s.assetId,
                workEffortName: s.workName,
                operationKey: key(name + "-work")
            })
            s.workId = made.workEffortId
            const reporter = name === "services" ? users.requester : s.owner
            s.requestId = as(reporter, M + "report#MaintenanceProblem", {
                assetId: s.assetId,
                summary: s.reportName,
                operationKey: key(name + "-report")
            }).requestId
        }
        // Services' work assigned to maint.tech for tomorrow, so it is in the technician's projected calendar
        const tomorrow = new Date(Date.now() + 864e5)
        as(users.planner, M + "schedule#MaintenanceWorkOrder", {
            workEffortId: sides.services.workId,
            assigneePartyIds: [ids.techPartyId],
            estimatedStartDate: tomorrow,
            estimatedCompletionDate: new Date(tomorrow.getTime() + 2 * 3600e3)
        })
        // a person's own rate on the belt repair's time entry, which no Maintenance route may show
        system(() => {
            const entry = ec.entity.find("mantle.work.time.TimeEntry").condition("timeEntryId", "BOSS_MNT_TE_BELT1").one()
            state.vendorHourRate = entry ? entry.vendorHourRate : null
            if (entry) call("update#mantle.work.time.TimeEntry", {timeEntryId: "BOSS_MNT_TE_BELT1", vendorHourRate: "77.77"})
        })
        // P12: a customer repair of a spec-local organization, linked and assigned to its own technician
        state.repair = lib.customerRepair("P20WALK")
        const draft = one("mantle.work.effort.WorkEffort", {workEffortId: ids.draftProcedureId})
        state.draftDescription = draft?.description
        state.draftStatusId = draft?.statusId
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        system(() =>
            call("update#mantle.work.time.TimeEntry", {timeEntryId: "BOSS_MNT_TE_BELT1", vendorHourRate: state.vendorHourRate})
        )
        ec.artifactExecution.enableAuthz()
    }
})

feature("each Maintenance group's user opens Maintenance and none of the other app roots, and the launcher lists none of them", {
    when() {
        const problems = []
        if (!sides.retail.workId || !sides.services.workId || !sides.retail.requestId || !sides.services.requestId)
            problems.push(`the walk's records: ${JSON.stringify(sides)}`)
        for (const user of groupUsers) {
            const apps = shell(user).apps
            if (!apps.includes("Maintenance")) problems.push(`${user}'s launcher has no Maintenance`)
            const launched = apps.filter(app => otherRoots.includes(app))
            if (launched.length) problems.push(`${user}'s launcher has ${launched}`)
            if (!opens(render(user, "Home"))) problems.push(`${user} does not open Maintenance`)
            for (const root of otherRoots) if (opens(render(user, "", {}, "html", root))) problems.push(`${user} opens ${root}`)
        }
        // the roots open for a user granted them, so a refusal above is not a broken render
        const closed = otherRoots.filter(root => !opens(render(users.system, "", {}, "html", root)))
        return {problems, closed}
    },
    then({problems, closed}) {
        problems.join("\n") == ""
        closed == []
    }
})

feature(
    "another organization's work, equipment and requests show on no Maintenance route, print or export; its own planner sees them",
    {
        when() {
            const problems = []
            for (const s of Object.values(sides)) {
                const leaks = pattern(s)
                for (const route of routes(s)) {
                    for (const viewer of s.viewers) {
                        const got = render(viewer, route.path, route.parameters, route.mode)
                        if (leaks.test(got.output)) problems.push(`${viewer} sees ${s.org}'s record on ${routeName(route)}`)
                    }
                    if (requiredShown.includes(route.path) && route.mode === "html") {
                        const own = render(s.owner, route.path, route.parameters)
                        if (!leaks.test(own.output))
                            problems.push(`${s.owner} does not see their own record on ${routeName(route)}: ${own.errors}`)
                    }
                }
            }
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

feature(
    "within Services a work order shows only to its readers: not another technician, an author, approver, booking approver or resource administrator",
    {
        when() {
            const problems = []
            const s = sides.services
            const work = new RegExp(s.workName)
            const workRoutes = routes(s).filter(route => route.path.startsWith("WorkOrders/"))
            for (const user of notWorkReaders)
                for (const route of workRoutes)
                    if (work.test(render(user, route.path, route.parameters, route.mode).output))
                        problems.push(`${user} sees the Services work order on ${routeName(route)}`)
            for (const user of [users.reader, users.tech, users.supervisor, users.cost])
                if (!work.test(render(user, "WorkOrders/WorkOrderDetail", {workEffortId: s.workId}).output))
                    problems.push(`${user}, a reader of it, does not see the Services work order`)
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

feature("the palette, the drop-downs, the record panels, Assist and CalDAV give nothing of another organization's records", {
    when() {
        const problems = []
        const C = "ironstone.maintenance.ContextServices."
        for (const [name, s] of Object.entries(sides)) {
            const leaks = pattern(s)
            const records = [
                ["mantle.work.effort.WorkEffort", s.workId],
                ["mantle.request.Request", s.requestId],
                ["mantle.product.asset.Asset", s.assetId]
            ]
            for (const viewer of s.viewers) {
                // the palette, by the secrets and the serial
                for (const text of [s.workName, s.reportName, s.serial]) {
                    const found = as(viewer, C + "search#Records", {text})
                    if (leaks.test(JSON.stringify(found.rows || []))) problems.push(`${viewer}'s palette finds ${name}'s ${text}`)
                }
                // the drop-downs, searched by the secrets and with the other side's record as the selected value
                for (const [choice, parameters] of [
                    ["organizations", {selected: s.org}],
                    ["facilities", {organizationPartyId: s.org, selected: s.facilityId}],
                    ["equipment", {term: s.serial, selected: s.assetId}],
                    ["workFacilities", {selected: s.facilityId}],
                    ["parentFacilities", {selected: s.facilityId}],
                    ["openWorkOrders", {term: s.workName, selected: s.workId}]
                ]) {
                    const options = as(viewer, C + "get#Choices", Object.assign({choice}, parameters)).options || []
                    const offered = options.filter(
                        option =>
                            [s.org, s.facilityId, s.assetId, s.workId].includes(option.value) || leaks.test(option.label || "")
                    )
                    if (offered.length) problems.push(`${viewer}'s ${choice} offers ${name}'s ${JSON.stringify(offered)}`)
                }
                // the Chatter and RecordFiles panels of each record
                for (const [recordEntity, recordId] of records)
                    for (const panel of ["RecordFiles/filesData", "Chatter/chatterData"]) {
                        const got = hit(viewer, "apps/Maintenance/" + panel, {recordEntity, recordId})
                        if (!got.errors.includes("RECORD_PANEL_UNAVAILABLE") || leaks.test(got.output))
                            problems.push(`${viewer} opens ${panel} of ${name}'s ${recordEntity} ${recordId}: ${got.errors}`)
                    }
                // Assist's answer actions: Log as note and Send as message refused on the other side's work
                const noted = post(viewer, "LogNote/logNote", {entityName: WORK, recordId: s.workId, noteText: "P20 walk note"})
                if (!noted) problems.push(`${viewer} logs a note on ${name}'s work order`)
                const sent = post(viewer, "SendMessage/sendMessage", {
                    entityName: WORK,
                    recordId: s.workId,
                    toValue: "party:" + ids.techPartyId,
                    subject: "P20 walk",
                    messageText: "P20 walk message",
                    messageRecordEntity: WORK,
                    messageRecordId: s.workId
                })
                if (!sent) problems.push(`${viewer} files a message on ${name}'s work order`)
                // the projected CalDAV collections and their objects
                const collections = Array.from(
                    as(viewer, "mantle.work.CalendarDavServices.get#DavCollections").collectionList || []
                )
                for (const collection of collections.filter(row =>
                    String(row.collectionId).startsWith("projected-Maintenance")
                )) {
                    const objects = as(viewer, "mantle.work.CalendarDavServices.get#DavObjects", {
                        collectionId: collection.collectionId,
                        withData: true
                    }).objectList
                    if (leaks.test(JSON.stringify(objects || [])))
                        problems.push(`${viewer}'s ${collection.collectionId} holds ${name}'s work`)
                }
            }
        }
        // the notes and messages were refused: none is linked to either side's work order
        const linked = system(() =>
            ec.entity
                .find("mantle.work.effort.WorkEffortCommEvent")
                .condition("workEffortId", "in", [sides.retail.workId, sides.services.workId])
                .count()
        )
        // the technician's own projected calendar is there (its contents are Mantle's MaintenanceStack)
        const techCollections = Array.from(
            as(users.tech, "mantle.work.CalendarDavServices.get#DavCollections").collectionList || []
        )
        return {problems, linked, techCollections: techCollections.map(row => row.collectionId)}
    },
    then({problems, linked, techCollections}) {
        problems.join("\n") == ""
        linked == 0
        techCollections.includes("projected-MaintenanceMyWork")
    }
})

feature("another organization's records are refused by the Mantle services and the transitions, and nothing changes", {
    when() {
        const problems = []
        const refusedText = /RECORD_UNAVAILABLE|ORGANIZATION_DENIED|PERMISSION_DENIED|NOT_ASSIGNED|not available|not authorized/
        for (const [name, s] of Object.entries(sides)) {
            const before = one("mantle.work.effort.WorkEffort", {workEffortId: s.workId})?.statusId
            const requestBefore = one("mantle.request.Request", {requestId: s.requestId})?.statusId
            for (const viewer of s.viewers) {
                const calls = [
                    [M + "get#MaintenanceWorkOrder", {workEffortId: s.workId}],
                    [
                        M + "transition#MaintenanceWorkOrder",
                        {workEffortId: s.workId, action: "hold", holdReasonEnumId: "MhrParts"}
                    ],
                    [M + "schedule#MaintenanceWorkOrder", {workEffortId: s.workId, assigneePartyIds: [ids.tech2PartyId]}],
                    [M + "record#MaintenanceTime", {workEffortId: s.workId, hours: 1}],
                    [
                        M + "triage#MaintenanceRequest",
                        {requestId: s.requestId, decision: "reject", requestResolutionEnumId: "RrRejected"}
                    ],
                    ["mantle.work.ProcessServices.get#ProcessExecution", {workEffortId: s.workId}],
                    ["mantle.work.MaintenanceReportServices.get#MaintenanceCosts", {workEffortId: s.workId}],
                    ["mantle.product.MaintenanceResourceServices.record#MaintenanceMeter", {assetId: s.assetId, meterValue: 1}],
                    [
                        "ironstone.maintenance.AccessServices.check#Record",
                        {appRoot: "Maintenance", recordType: "workOrder", recordId: s.workId}
                    ],
                    [
                        "ironstone.maintenance.AccessServices.check#Record",
                        {appRoot: "Maintenance", recordType: "asset", recordId: s.assetId}
                    ],
                    [
                        "ironstone.maintenance.AccessServices.check#Record",
                        {appRoot: "Maintenance", recordType: "request", recordId: s.requestId}
                    ]
                ]
                for (const [service, parameters] of calls) {
                    const got = as(viewer, service, parameters)
                    if (!refusedText.test(got.error))
                        problems.push(`${viewer} calls ${service} on ${name}'s record: ${got.error || "accepted"}`)
                }
                // the lists asked for the other organization by name
                const listed = as(viewer, M + "find#MaintenanceWorkOrders", {organizationPartyId: s.org, text: s.workName})
                if (Array.from(listed.workOrderList || []).length) problems.push(`${viewer} lists ${name}'s work orders`)
                const requests = as(viewer, M + "find#MaintenanceRequests", {requestId: s.requestId, statusId: "all"})
                if (Array.from(requests.requestList || []).length) problems.push(`${viewer} lists ${name}'s request`)
                // the screens' transitions
                for (const [path, parameters] of [
                    [
                        "WorkOrders/WorkOrderDetail/lifecycleAction",
                        {workEffortId: s.workId, lifecycleAction: "hold", holdReasonEnumId: "MhrParts"}
                    ],
                    [
                        "Requests/RequestDetail/triageRequest",
                        {requestId: s.requestId, decision: "reject", requestResolutionEnumId: "RrRejected"}
                    ],
                    ["Equipment/EquipmentDetail/Meters/recordMeter", {assetId: s.assetId, meterValue: "1"}]
                ]) {
                    if (!post(viewer, path, parameters)) problems.push(`${viewer} posts ${path} on ${name}'s record`)
                }
            }
            const after = one("mantle.work.effort.WorkEffort", {workEffortId: s.workId})?.statusId
            const requestAfter = one("mantle.request.Request", {requestId: s.requestId})?.statusId
            if (after !== before) problems.push(`${name}'s work order moved from ${before} to ${after}`)
            if (requestAfter !== requestBefore) problems.push(`${name}'s request moved from ${requestBefore} to ${requestAfter}`)
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("costs are the cost reader's alone, and no one sees a person's own rate", {
    when() {
        const problems = []
        const belt = {workEffortId: ids.beltOrderId}
        // the belt repair's priced amounts: two hours at 48 USD; and the technician's own rate, set by the walk
        const priced = /\$48\.00|\$96\.00/
        const ownRate = /77\.77/
        const readers = [users.reader, users.planner, users.tech, users.supervisor]
        for (const user of groupUsers.filter(user => user !== users.cost && user !== users.admin)) {
            if (opens(render(user, "WorkOrders/WorkOrderDetail/Costs", belt))) problems.push(`${user} opens the Costs tab`)
            if (opens(render(user, "Reports/MaintenanceCostReport"))) problems.push(`${user} opens the cost report`)
            const costs = as(user, "mantle.work.MaintenanceReportServices.get#MaintenanceCosts", belt)
            if (!/PERMISSION_DENIED|RECORD_UNAVAILABLE|ORGANIZATION_DENIED/.test(costs.error))
                problems.push(`${user} reads the belt's costs: ${costs.error || "accepted"}`)
            const shown = user =>
                ["Overview", "Time"].map(tab => render(user, "WorkOrders/WorkOrderDetail/" + tab, belt).output).join("\n")
            if (readers.includes(user)) {
                const text = shown(user)
                if (priced.test(text)) problems.push(`${user} sees a priced amount of the belt repair`)
                if (ownRate.test(text)) problems.push(`${user} sees the technician's own rate`)
            }
        }
        // the cost reader: the Costs tab and the report price the labor at the costing rate, never the person's own
        const tab = render(users.cost, "WorkOrders/WorkOrderDetail/Costs", Object.assign({lastStandalone: "true"}, belt))
        const time = render(users.cost, "WorkOrders/WorkOrderDetail/Time", belt)
        const report = render(users.cost, "Reports/MaintenanceCostReport", {assetId: ids.compressorId})
        const csv = asUser(users.cost, () =>
            String(
                ec.screen
                    .makeTest()
                    .rootScreen("component://mr-boss/screen/Maintenance.xml")
                    .render("Reports/MaintenanceCostReport/exportCsv", {assetId: ids.compressorId}, null).output || ""
            )
        )
        for (const [name, text] of [
            ["tab", tab.output],
            ["time", time.output],
            ["report", report.output],
            ["csv", csv]
        ])
            if (ownRate.test(text)) problems.push(`the cost reader's ${name} shows the technician's own rate`)
        return {problems, tab}
    },
    then({problems, tab}) {
        problems.join("\n") == ""
        tab.errors == ""
        tab.output.includes("$48.00/h")
    }
})

feature("a booking of Room 101 is Busy with no title to all but its organizer, in the calendar read and the resource calendar", {
    when() {
        const problems = []
        const titles = {[users.planner]: "HVAC vendor walkthrough", [users.tech]: "Shift handover"}
        const window = {facilityId: ids.managedRoomId, start: "2026-11-16", end: "2026-11-20"}
        for (const user of groupUsers.filter(user => user !== users.admin)) {
            const events = Array.from(as(user, "mantle.work.EventServices.get#FullCalendarData", window).eventList || [])
            const seen = events.map(event => String(event.title))
            for (const [organizer, title] of Object.entries(titles)) {
                // the organizer's event is titled with its id after the name ("HVAC vendor walkthrough [BOSS_MNT_EV_VENDOR]")
                const shown = seen.some(seenTitle => seenTitle.startsWith(title))
                if (organizer === user && !shown) problems.push(`${user}, its organizer, does not see ${title}: ${seen}`)
                if (organizer !== user && shown) problems.push(`${user} sees ${title}`)
            }
            // Maintenance's resource calendar (its terminal twin), for a user who opens Scheduling
            const calendar = render(user, "Scheduling/ResourceCalendarTui", {date: "2026-11-17"}, "tui")
            if (opens(calendar) && user !== users.planner && calendar.output.includes(titles[users.planner]))
                problems.push(`${user}'s resource calendar shows the vendor walkthrough`)
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature(
    "a procedure is authored by its author only: every other group and Retail's planner is refused, and the draft is unchanged",
    {
        when() {
            const problems = []
            const P = "mantle.work.ProcessServices."
            const draft = ids.draftProcedureId
            const description = "P20 walk " + stamp
            for (const user of groupUsers.filter(user => user !== users.author && user !== users.admin)) {
                for (const [service, parameters] of [
                    [P + "store#WorkProcess", {workEffortId: draft, description}],
                    [P + "store#ProcessStep", {rootWorkEffortId: draft, workEffortName: description}]
                ]) {
                    const got = as(user, service, parameters)
                    if (!/PERMISSION_DENIED|RECORD_UNAVAILABLE/.test(got.error))
                        problems.push(`${user} calls ${service}: ${got.error || "accepted"}`)
                }
                // approval and retirement are the approver's (WORK_PROCESS_APPROVE), not asked of them here: a retirement would stand
                if (user !== users.approver)
                    for (const service of ["approve#WorkProcess", "retire#WorkProcess"]) {
                        const got = as(user, P + service, {workEffortId: draft})
                        if (!/PERMISSION_DENIED|RECORD_UNAVAILABLE/.test(got.error))
                            problems.push(`${user} calls ${service}: ${got.error || "accepted"}`)
                    }
                for (const [path, parameters] of [
                    [
                        "Procedures/ProcedureDetail/storeProcedure",
                        {workEffortId: draft, workEffortName: description, description}
                    ],
                    [
                        "Procedures/ProcedureDetail/Steps/storeStep",
                        {workEffortId: draft, rootWorkEffortId: draft, workEffortName: description}
                    ]
                ])
                    if (!post(user, path, parameters)) problems.push(`${user} posts ${path}`)
            }
            const after = one("mantle.work.effort.WorkEffort", {workEffortId: draft})
            const steps = system(() =>
                ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortName", description).count()
            )
            return {problems, description: after?.description, statusId: after?.statusId, steps}
        },
        then({problems, description, statusId, steps}) {
            problems.join("\n") == ""
            description == state.draftDescription
            statusId == state.draftStatusId
            steps == 0
        }
    }
)

feature(
    "Teams is read by a planner, a supervisor and the administrator only; Retail's planner reads no Services team; defaults are the administrator's",
    {
        when() {
            const problems = []
            const team = {organizationPartyId: ids.organizationId, teamPartyId: ids.fieldTeamId}
            const teamName = "Compressor and field service"
            const readers = [users.planner, users.supervisor, users.admin]
            for (const user of groupUsers) {
                const got = render(user, "Settings/Teams", team)
                if (readers.includes(user) && !(opens(got) && got.output.includes(teamName)))
                    problems.push(`${user}, a reader of Teams, does not see the field team: ${got.errors}`)
                if (!readers.includes(user) && got.output.includes(teamName))
                    problems.push(`${user} sees the field team on Teams`)
                if (user !== users.admin) {
                    const stored = as(user, "mantle.work.MaintenanceSettingsServices.store#MaintenanceTeamDefaults", {
                        teamPartyId: ids.fieldTeamId,
                        intakeTag: "p20-walk"
                    })
                    if (!/PERMISSION_DENIED|RECORD_UNAVAILABLE/.test(stored.error))
                        problems.push(`${user} stores the team's defaults: ${stored.error || "accepted"}`)
                }
            }
            const retail = users.retailPlanner
            const found = as(retail, "mantle.work.MaintenanceSettingsServices.find#MaintenanceTeams", {
                teamPartyId: ids.fieldTeamId
            })
            if (!/RECORD_UNAVAILABLE|ORGANIZATION_DENIED/.test(found.error))
                problems.push(`Retail's planner finds the field team: ${found.error || "accepted"}`)
            const options =
                as(retail, "ironstone.maintenance.ContextServices.get#Choices", {choice: "teams", selected: ids.fieldTeamId})
                    .options || []
            if (options.some(option => [ids.teamId, ids.fieldTeamId].includes(option.value)))
                problems.push(`Retail's planner's team choice offers Services' teams: ${JSON.stringify(options)}`)
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

feature("a customer repair shows to no Maintenance user of Services or Retail; its technician reads the report, with no amount", {
    when() {
        const problems = []
        const repair = state.repair
        const customer = /Repair spec customer P20WALK/
        const work = {workEffortId: repair.workEffortId}
        const repairRoutes = [
            ["WorkOrders/WorkOrderDetail", work, "html"],
            ["WorkOrders/WorkOrderDetail/Overview", work, "html"],
            ["WorkOrders/InterventionReport", work, "html"],
            ["WorkOrders/InterventionReport", Object.assign({lastStandalone: "true"}, work), "html-print"],
            ["Equipment/EquipmentDetail", {assetId: repair.assetId}, "html"],
            ["WorkOrders/Find", {text: "spec customer P20WALK"}, "html"]
        ]
        for (const viewer of servicesUsers.concat([users.retailPlanner])) {
            for (const [path, parameters, mode] of repairRoutes)
                if (customer.test(render(viewer, path, parameters, mode).output))
                    problems.push(`${viewer} sees the repair on ${path} ${mode}`)
            for (const [service, parameters] of [
                [M + "get#MaintenanceWorkOrder", work],
                [M + "get#InterventionReport", work],
                [M + "store#InterventionReport", work],
                [
                    "ironstone.maintenance.AccessServices.check#Record",
                    {appRoot: "Maintenance", recordType: "workOrder", recordId: repair.workEffortId}
                ]
            ]) {
                const got = as(viewer, service, parameters)
                if (!/RECORD_UNAVAILABLE|ORGANIZATION_DENIED|PERMISSION_DENIED|NOT_ASSIGNED/.test(got.error))
                    problems.push(`${viewer} calls ${service} on the repair: ${got.error || "accepted"}`)
            }
        }
        const report = render(repair.tech, "WorkOrders/InterventionReport", work, "html")
        const print = render(
            repair.tech,
            "WorkOrders/InterventionReport",
            Object.assign({lastStandalone: "true"}, work),
            "html-print"
        )
        const amount = /\$\s?\d|USD/
        return {
            problems,
            report,
            print,
            reportNamesCustomer: customer.test(report.output),
            reportAmount: amount.test(report.output),
            printAmount: amount.test(print.output)
        }
    },
    then({problems, report, print, reportNamesCustomer, reportAmount, printAmount}) {
        problems.join("\n") == ""
        report.errors == ""
        report.output.includes("Intervention report")
        reportNamesCustomer == true
        reportAmount == false
        print.errors == ""
        printAmount == false
    }
})
