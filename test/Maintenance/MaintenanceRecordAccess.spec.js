// Maintenance record access (impl-maintenance §2; design-maintenance §1.1, §1.2): who reads and changes each Maintenance record,
// split from MaintenanceAccess (the app's own access: context, menu, groups, root grant, shared device, Home, Settings, teams,
// registries) in Sales follow-up 3. P2's equipment write (the resource administrator's, the planner refused, another
// organization's equipment refused), P3's work order record (its organization's work reader and its technician, not a resource
// administrator, another technician or Retail), P4's maintenance request record (its organization's planner, not a technician or
// Retail) and its panels, Commons' Report a problem (every Maintenance group's, not another app's user's), P6's procedure record (a
// reader of its organization's procedures; an author's change), the supervisor's outage record and restore, P9's part issue (the
// assigned technician with the stock grant; another technician without it and another owner's stock refused), P13's preventive
// plan (a maintenance reader of its organization; a planner's create), P15's booking policy and blackout (the resource
// administrator's, the planner refused, Retail's facility refused; a booking approver reads the policy of the room they approve
// only) and booking requests (their approver's), P14's generation and compliance (a planner generates, a reader does not, Retail's
// planner gets Services' plan refused; the compliance a reader's, not a technician's or Retail's), P7's checklist (its technician
// reads it, not another or Retail; a waiver is a supervisor's), P10's purchases of a work order (its planner reads them, a resource
// administrator and Retail's planner do not; a technician asks for nothing, a planner links no order line the work did not request
// and Retail's planner asks for nothing on Services' work; the supervisor, Warehouse's receiver for accept#ServiceItem, gets no
// Warehouse app or receipt quick create: the lead's decision, P10 review R1), P19's stack providers (a work order's record card and
// a caller's work for its organization's planner, not a resource administrator, Retail's planner or a requester without the root;
// Comms' Report a problem on a chat message for a user who may report, not another app's user; the message read under Comms' room
// check with the user's own filters, a record room of Retail's forklift refused: review R1), P18's equipment import (run by the
// resource administrator, read by the planner, the importer's organizations only) and setup readiness (the administrator's), P12's
// customer repair (its intervention report stored by its technician, not its agent or another organization's technician; the
// customer's unit read through the repair, not by Maintenance's equipment scope; the report sent by the claim's agent, not the
// technician or another organization's agent), a work order's costs (the cost reader's) and P17's work status and report catalogue (a
// reader's, not a technician's; Retail's planner refused Services' organization). One feature per rule, each case of it a line of
// its problems, with artifact authorization enabled, on the demo data (MaintenanceSpecLib); no spec state. A later phase adds a
// case only for a record access rule it adds.
// Run: ./moq test mr-boss --spec MaintenanceRecordAccess
const lib = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page, screenRefusal, shell} = lib
const access = "ironstone.maintenance.AccessServices."
const checkRecord = access + "check#Record"
// a refusal of a user without Maintenance: the service is not authorized for them, or it refuses them
const refused = message => /MAINTENANCE_UNAVAILABLE|is not authorized/.test(message)
// a Commons screen's refusal as the user (P4's Report a problem): "" when it opens
function screenRefusalIn(user, path) {
    const rendered = asUser(user, () => page(path, {}, "html", "Commons"))
    return rendered.status === 200 && rendered.errors.length === 0 ? "" : rendered.status + " " + rendered.errors.join(" | ")
}
// the shell's data of the user (the launcher's apps, the + menu's quick creates), rendered once a user in the spec: no feature
// changes a demo user's groups
const shellDataCache = new Map()
const shellData = user => {
    if (!shellDataCache.has(user))
        shellDataCache.set(
            user,
            asUser(user, () =>
                JSON.parse(
                    ec.screen.makeTest().rootScreen("component://webroot/screen/webroot.xml").render("shellData", {}, null).output
                )
            )
        )
    return shellDataCache.get(user)
}
// the quick create kinds of the user's + menu
const quickCreates = user => JSON.stringify(shellData(user))
// a screen request as the current user (the record panels' data), with no device
function deviceRequest(path, cookie, parameters = {}) {
    let test = ec.screen.makeTest().rootScreen("component://webroot/screen/webroot.xml")
    if (cookie) test = test.header("cookie", "moqui.device=" + cookie)
    const out = test.render(path, parameters, "get")
    ec.message.clearErrors()
    return {status: out.status, output: String(out.output || ""), errors: Array.from(out.errorMessages || []).join("\n")}
}

spec({
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

// P2: equipment writes need MAINTENANCE_RESOURCE_EDIT and the equipment's organization (the Mantle writer checks them; the screens'
// transitions check check#Record with resourceEdit first)
feature("an equipment write is the resource administrator's: the planner is refused, and Retail's forklift is refused to both", {
    when() {
        const store = "mantle.product.MaintenanceResourceServices.store#MaintenanceEquipment"
        const original = system(
            () => ec.entity.find("mantle.product.asset.Asset").condition("assetId", ids.compressorId).one().comments
        )
        const parameters = assetId => ({assetId, comments: "Checked by the Maintenance access spec"})
        // the Mantle writer as the screens call it under the root's inheritable grant: the artifact check aside, its own
        // permission and scope checks decide
        const write = (user, assetId) =>
            asUser(user, () => {
                ec.artifactExecution.disableAuthz()
                return refusal(store, parameters(assetId))
            })
        const resources = write(users.resources, ids.compressorId)
        const planner = write(users.planner, ids.compressorId)
        const otherAsset = write(users.resources, ids.otherAssetId)
        const checkEdit = asUser(users.planner, () =>
            refusal(checkRecord, {recordType: "asset", recordId: ids.compressorId, capability: "resourceEdit"})
        )
        const saved = system(
            () => ec.entity.find("mantle.product.asset.Asset").condition("assetId", ids.compressorId).one().comments
        )
        system(() => call("update#mantle.product.asset.Asset", {assetId: ids.compressorId, comments: original}))
        return {resources, planner, otherAsset, checkEdit, saved}
    },
    then({resources, planner, otherAsset, checkEdit, saved}) {
        resources == ""
        saved == "Checked by the Maintenance access spec"
        planner.includes("PERMISSION_DENIED")
        otherAsset.includes("RECORD_UNAVAILABLE")
        checkEdit.includes("PERMISSION_DENIED")
    }
})

feature(
    "a work order is read by a work reader of its organization and the technician assigned to it, not a resource administrator, another technician or Retail (P3)",
    {
        when() {
            const check = (user, workEffortId = ids.inProgressOrderId) =>
                asUser(user, () =>
                    refusal(checkRecord, {appRoot: "Maintenance", recordType: "workOrder", recordId: workEffortId})
                )
            return {
                planner: check(users.planner),
                tech: check(users.tech),
                tech2: check(users.tech2),
                resources: check(users.resources),
                retail: check(users.retailPlanner),
                // the same check of Retail's planner is not a missing record: Services' planner reads it with the same parameters
                missing: check(users.planner, "BOSS_MNT_WO_NONE")
            }
        },
        then(out) {
            out.planner == ""
            out.tech == ""
            // another technician of the organization: in scope but not theirs (Mantle's NOT_ASSIGNED)
            out.tech2.includes("NOT_ASSIGNED")
            out.resources.includes("RECORD_UNAVAILABLE")
            out.retail.includes("RECORD_UNAVAILABLE")
            out.missing.includes("RECORD_UNAVAILABLE")
        }
    }
)

feature(
    "a maintenance request is a planner's of its organization, not a technician's or Retail's; a requester reports in Commons only (P4)",
    {
        when() {
            const check = (user, requestId = ids.openRequestId) =>
                asUser(user, () => refusal(checkRecord, {appRoot: "Maintenance", recordType: "request", recordId: requestId}))
            const panel = user =>
                asUser(
                    user,
                    () =>
                        deviceRequest("apps/Maintenance/RecordFiles/filesData", null, {
                            recordEntity: "mantle.request.Request",
                            recordId: ids.openRequestId
                        }).errors
                )
            return {
                planner: check(users.planner),
                tech: check(users.tech),
                retail: check(users.retailPlanner),
                missing: check(users.planner, "BOSS_MNT_REQ_NONE"),
                plannerPanel: panel(users.planner),
                retailPanel: panel(users.retailPlanner),
                // Report a problem: the requester's screen in Commons (BOSS_MNT_REPORT_PROBLEM), not another Commons user's
                requesterReport: screenRefusalIn(users.requester, "ReportProblem"),
                // the user's call (Nov 12, P4 review): every Maintenance group has Report a problem in its + menu, another
                // app's user neither the item nor the screen
                withoutReport: [
                    users.reader,
                    users.planner,
                    users.tech,
                    users.supervisor,
                    users.author,
                    users.approver,
                    users.booking,
                    users.resources,
                    users.cost,
                    users.admin,
                    users.requester
                ].filter(user => !quickCreates(user).includes("maintenanceReportProblem")),
                otherQuickCreate: quickCreates(users.otherApp).includes("maintenanceReportProblem"),
                // a technician reports a problem and follows their own report (the Commons Maintenance box's
                // find#MaintenanceRequests), not the requester's
                techFollows: asUser(users.tech, () =>
                    system(() => {
                        const reported = invoke("mantle.work.MaintenanceServices.report#MaintenanceProblem", {
                            assetId: ids.compressorId,
                            summary: "Compressor guard loose",
                            operationKey: "spec-mnt-tech-report"
                        })
                        const own = id =>
                            Array.from(
                                invoke("mantle.work.MaintenanceServices.find#MaintenanceRequests", {
                                    requestId: id,
                                    statusId: "all"
                                }).requestList || []
                            ).length
                        return {own: own(reported.requestId), colleague: own(ids.openRequestId)}
                    })
                ),
                otherReport: screenRefusalIn(users.otherApp, "ReportProblem"),
                // P4 review: the Requests area is the planner's and supervisor's (BOSS_MNT_REQUESTS); the planner's render is
                // MaintenanceRequests'
                techRequests: screenRefusal(users.tech, "Requests"),
                readerRequests: screenRefusal(users.reader, "Requests"),
                // P4 review: a reported problem by its id in Commons is its reporter's and Maintenance's, not every member's of its
                // organization (Mantle's MaintenanceAccess.requestHidden in get#RecordLinkInfo): the technician, an agent of Services
                // not on its work, does not see the requester's untriaged report
                // (Commons' files panel of the request, which asks get#RecordLinkInfo)
                seen: Object.fromEntries(
                    [users.requester, users.planner, users.tech].map(user => {
                        const files = asUser(user, () =>
                            deviceRequest("apps/Commons/RecordFiles/filesData", null, {
                                recordEntity: "mantle.request.Request",
                                recordId: ids.openRequestId
                            })
                        )
                        return [user, files.status === 200 && JSON.parse(files.output || "{}").visible === true]
                    })
                )
            }
        },
        then(out) {
            out.planner == ""
            out.tech.includes("RECORD_UNAVAILABLE")
            out.retail.includes("RECORD_UNAVAILABLE")
            out.missing.includes("RECORD_UNAVAILABLE")
            !out.plannerPanel.includes("RECORD_PANEL_UNAVAILABLE")
            out.retailPanel.includes("RECORD_PANEL_UNAVAILABLE")
            out.requesterReport == ""
            out.withoutReport.length == 0
            out.otherQuickCreate == false
            out.techFollows.own == 1
            out.techFollows.colleague == 0
            out.otherReport != ""
            out.techRequests != ""
            out.readerRequests != ""
            out.seen[users.requester] == true
            out.seen[users.planner] == true
            out.seen[users.tech] == false
        }
    }
)

feature(
    "a procedure is read by a reader of its organization's procedures, not a resource administrator, a technician with no work of it or Retail; it is changed by an author only (P6)",
    {
        when() {
            const check = (user, workEffortId = ids.compressorProcedureId) =>
                asUser(user, () =>
                    refusal(checkRecord, {appRoot: "Maintenance", recordType: "procedure", recordId: workEffortId})
                )
            // a change as each user (the Mantle service's own check, the root's grant aside)
            const change = user =>
                asUser(user, () =>
                    system(() =>
                        refusal("mantle.work.ProcessServices.store#WorkProcess", {
                            workEffortId: ids.draftProcedureId,
                            description: "Before each trip"
                        })
                    )
                )
            return {
                author: check(users.author),
                approver: check(users.approver),
                planner: check(users.planner),
                resources: check(users.resources),
                tech: check(users.tech),
                retail: check(users.retailPlanner),
                workOrder: check(users.author, ids.inProgressOrderId),
                authorChanges: change(users.author),
                plannerChanges: change(users.planner),
                retailChanges: change(users.retailPlanner)
            }
        },
        then(out) {
            out.author == "" && out.approver == "" && out.planner == ""
            out.resources.includes("RECORD_UNAVAILABLE")
            out.tech.includes("RECORD_UNAVAILABLE")
            out.retail.includes("RECORD_UNAVAILABLE")
            // a work order is no procedure
            out.workOrder.includes("RECORD_UNAVAILABLE")
            out.authorChanges == ""
            out.plannerChanges.includes("PERMISSION_DENIED")
            out.retailChanges.includes("PERMISSION_DENIED") || out.retailChanges.includes("RECORD_UNAVAILABLE")
        }
    }
)

// P5: recording an outage is a supervisor's, a resource administrator's or an assigned technician's (Mantle's
// record#ResourceUnavailability): the supervisor links Room 201's open outage, the planner is refused, and Retail's forklift is
// refused to the supervisor as a missing one; restoring is the supervisor's, not the technician's
feature(
    "recording and restoring an outage is the supervisor's: the planner is refused, and Retail's forklift is refused to both",
    {
        when() {
            const record = "mantle.work.ResourceBookingServices.record#ResourceUnavailability"
            const write = (user, service, parameters) =>
                asUser(user, () => {
                    ec.artifactExecution.disableAuthz()
                    return refusal(service, parameters)
                })
            const room = {facilityId: ids.roomOutageFacilityId, unavailabilityReasonEnumId: "RurSafety"}
            return {
                supervisor: write(users.supervisor, record, room),
                planner: write(users.planner, record, room),
                otherAsset: write(users.supervisor, record, {
                    assetId: ids.otherAssetId,
                    unavailabilityReasonEnumId: "RurEquipmentFault"
                }),
                techRestores: write(users.tech, "mantle.work.ResourceBookingServices.end#ResourceUnavailability", {
                    resourceUnavailabilityId: ids.roomOutageId,
                    expectedRevision: 1,
                    dispositionEnumId: "MdispAvailable"
                }),
                rows: system(() =>
                    ec.entity
                        .find("mantle.work.effort.ResourceUnavailability")
                        .condition("facilityId", ids.roomOutageFacilityId)
                        .count()
                )
            }
        },
        then({supervisor, planner, otherAsset, techRestores, rows}) {
            supervisor == ""
            rows == 1
            planner.includes("PERMISSION_DENIED")
            otherAsset.includes("RECORD_UNAVAILABLE")
            techRestores.includes("PERMISSION_DENIED")
        }
    }
)
feature(
    "issuing a part is the assigned technician's with the stock grant: one without it is refused, and another owner's stock is",
    {
        when() {
            const issue = "mantle.work.MaintenanceExecutionServices.issue#MaintenanceMaterial"
            const write = (user, parameters) =>
                asUser(user, () => {
                    ec.artifactExecution.disableAuthz()
                    return refusal(issue, parameters)
                })
            const part = {workEffortId: ids.inProgressOrderId, productId: ids.gasketId, quantity: 1}
            return {
                tech: write(users.tech, Object.assign({operationKey: "access-p9-1", assetId: ids.gasketStockId}, part)),
                tech2: write(users.tech2, Object.assign({operationKey: "access-p9-2", assetId: ids.gasketStockId}, part)),
                planner: write(users.planner, Object.assign({operationKey: "access-p9-3", assetId: ids.gasketStockId}, part)),
                otherOwner: write(users.tech, {
                    operationKey: "access-p9-4",
                    workEffortId: ids.inProgressOrderId,
                    assetId: ids.otherOwnerStockId,
                    quantity: 1
                })
            }
        },
        then({tech, tech2, planner, otherOwner}) {
            tech == ""
            tech2.includes("PERMISSION_DENIED")
            planner.includes("PERMISSION_DENIED")
            otherOwner.includes("OWNER_MISMATCH")
        }
    }
)

// P13: a preventive plan is read by a maintenance reader of its organization (MAINTENANCE_VIEW), not a resource administrator, a
// technician or Retail; a plan is made by a planner or supervisor (Mantle's store#MaintenanceSchedule), not a reader, and not by
// Retail's planner for Services' equipment (the same parameters)
feature(
    "a preventive plan is read by a maintenance reader of its organization, not a resource administrator, a technician or Retail; it is made by a planner only (P13)",
    {
        when() {
            const check = user =>
                asUser(user, () =>
                    refusal(checkRecord, {appRoot: "Maintenance", recordType: "plan", recordId: ids.compressorPlanId})
                )
            const make = (user, operationKey) =>
                asUser(user, () =>
                    system(() =>
                        refusal("mantle.work.MaintenancePlanServices.store#MaintenanceSchedule", {
                            operationKey,
                            assetId: ids.vanId,
                            scheduleName: "Van spec plan",
                            intervalQuantity: 6,
                            intervalUomId: "TF_mon",
                            firstDueLocal: "2027-01-15 08:00"
                        })
                    )
                )
            return {
                reader: check(users.reader),
                planner: check(users.planner),
                resources: check(users.resources),
                tech: check(users.tech),
                retail: check(users.retailPlanner),
                plannerMakes: make(users.planner, "mnt-access-plan-1"),
                readerMakes: make(users.reader, "mnt-access-plan-2"),
                retailMakes: make(users.retailPlanner, "mnt-access-plan-3")
            }
        },
        then(out) {
            out.reader == "" && out.planner == ""
            out.resources.includes("RECORD_UNAVAILABLE")
            out.tech.includes("RECORD_UNAVAILABLE")
            out.retail.includes("RECORD_UNAVAILABLE")
            out.plannerMakes == ""
            out.readerMakes.includes("PERMISSION_DENIED")
            out.retailMakes.includes("RECORD_UNAVAILABLE")
        }
    }
)

feature(
    "a booking policy and a blackout are the resource administrator's: the planner is refused, and Retail's facility is refused to both",
    {
        when() {
            const R = "mantle.work.ResourceBookingServices."
            const write = (user, service, parameters) =>
                asUser(user, () => {
                    ec.artifactExecution.disableAuthz()
                    return refusal(service, parameters)
                })
            // preview# writes nothing: the holder's case is its answer
            const unmanaged = {facilityId: ids.unmanagedRoomId, approvalModeEnumId: "RbamAutomatic"}
            const blackout = {
                facilityId: ids.otherFacilityId,
                unavailabilityKindEnumId: "RukPlanned",
                fromDate: new Date(Date.now() + 864e5),
                thruDate: new Date(Date.now() + 2 * 864e5)
            }
            return {
                holder: write(users.resources, R + "preview#ResourceBookingPolicy", unmanaged),
                planner: write(users.planner, R + "preview#ResourceBookingPolicy", unmanaged),
                otherOrganization: write(users.resources, R + "preview#ResourceBookingPolicy", {facilityId: ids.otherFacilityId}),
                plannerBlackout: write(
                    users.planner,
                    R + "record#ResourceUnavailability",
                    Object.assign({}, blackout, {facilityId: ids.unmanagedRoomId})
                ),
                otherBlackout: write(users.resources, R + "record#ResourceUnavailability", blackout),
                approverReads: write(users.booking, R + "get#ResourceBookingPolicy", {facilityId: ids.managedRoomId}),
                approverOther: write(users.booking, R + "get#ResourceBookingPolicy", {facilityId: ids.unmanagedRoomId})
            }
        },
        then({holder, planner, otherOrganization, plannerBlackout, otherBlackout, approverReads, approverOther}) {
            holder == ""
            planner.includes("PERMISSION_DENIED")
            otherOrganization.includes("RECORD_UNAVAILABLE")
            plannerBlackout.includes("PERMISSION_DENIED")
            otherBlackout.includes("RECORD_UNAVAILABLE") || otherBlackout.includes("PERMISSION_DENIED")
            // a booking approver reads the policy of the room they approve, not another's
            approverReads == ""
            approverOther.includes("RECORD_UNAVAILABLE")
        }
    }
)

// P14: a plan's work is generated by a planner or supervisor of its organization (Mantle's generate#MaintenanceWorkOrders), not a
// reader, and Retail's planner gets Services' plan refused with the same parameters; PM compliance is a maintenance reader's of
// their organizations, not a technician's (no MAINTENANCE_VIEW), and Retail's planner reads none of Services' plans
feature(
    "a plan's work is generated by a planner of its organization, not a reader or Retail; PM compliance is a reader's of their organizations (P14)",
    {
        when() {
            const P = "mantle.work.MaintenancePlanServices."
            const preview = user =>
                asUser(user, () =>
                    system(() => {
                        ec.message.pushErrors()
                        try {
                            const out = invoke(P + "generate#MaintenanceWorkOrders", {
                                maintenanceScheduleId: ids.filterPlanId,
                                preview: true
                            })
                            return ec.message.hasError()
                                ? ec.message.getErrorsString()
                                : out.results?.[0]?.code || out.results?.[0]?.outcome
                        } catch (error) {
                            return String(error.message)
                        } finally {
                            ec.message.clearErrors()
                            ec.message.popErrors()
                        }
                    })
                )
            const compliance = user =>
                asUser(user, () =>
                    system(() => {
                        ec.message.pushErrors()
                        try {
                            const out = invoke("mantle.work.MaintenanceReportServices.get#MaintenanceCompliance", {
                                maintenanceScheduleId: ids.filterPlanId,
                                fromDate: new Date(Date.parse("2026-08-01T00:00:00Z"))
                            })
                            return ec.message.hasError() ? ec.message.getErrorsString() : String(out.summary?.dueCount)
                        } catch (error) {
                            return String(error.message)
                        } finally {
                            ec.message.clearErrors()
                            ec.message.popErrors()
                        }
                    })
                )
            return {
                planner: preview(users.planner),
                reader: preview(users.reader),
                retail: preview(users.retailPlanner),
                readerCompliance: compliance(users.reader),
                techCompliance: compliance(users.tech),
                retailCompliance: compliance(users.retailPlanner)
            }
        },
        then(out) {
            out.planner == "ready"
            out.reader.includes("PERMISSION_DENIED")
            out.retail == "RECORD_UNAVAILABLE"
            Number(out.readerCompliance) >= 3
            out.techCompliance.includes("PERMISSION_DENIED")
            out.retailCompliance == "0"
        }
    }
)

feature(
    "booking requests are their approver's: a planner is refused the list and the decision, and a room the approver does not approve is refused",
    {
        when() {
            const R = "mantle.work.ResourceBookingServices."
            const as = (user, service, parameters) =>
                asUser(user, () => {
                    ec.artifactExecution.disableAuthz()
                    return refusal(service, parameters)
                })
            const listed = asUser(users.booking, () => {
                ec.artifactExecution.disableAuthz()
                // from the demo's week, so the handover (Nov 18, 2026) is listed after its day has passed too
                return invoke(R + "find#ResourceBookingRequests", {fromDate: "2026-11-12"}).requestList || []
            })
            // another organization's facility asked by name lists nothing
            const otherListed = asUser(users.booking, () => {
                ec.artifactExecution.disableAuthz()
                return (
                    invoke(R + "find#ResourceBookingRequests", {facilityId: ids.otherFacilityId, fromDate: "2026-11-12"})
                        .requestList || []
                )
            })
            const deny = {workEffortId: ids.requestedEventId, facilityId: ids.managedRoomId, decision: "deny", reason: "Spec"}
            return {
                listed,
                otherListed,
                planner: as(users.planner, R + "find#ResourceBookingRequests", {}),
                plannerDecides: as(users.planner, R + "decide#ResourceBooking", deny),
                otherRoom: as(
                    users.booking,
                    R + "decide#ResourceBooking",
                    Object.assign({}, deny, {facilityId: ids.otherFacilityId})
                )
            }
        },
        then({listed, otherListed, planner, plannerDecides, otherRoom}) {
            listed.some(row => row.workEffortId == ids.requestedEventId && row.canDecide)
            otherListed.length == 0
            planner.includes("PERMISSION_DENIED")
            plannerDecides.includes("PERMISSION_DENIED")
            otherRoom.includes("NOT_APPROVER")
        }
    }
)

// P7: a work order's checklist is read by its readers (Mantle's get#ProcessExecution: the technician it is assigned to, not another
// technician, and not Retail's planner), and a waiver is a supervisor's (waive#ProcessStep: the technician refused before anything
// else; the supervisor passes the permission and is refused only for naming the work order, not a step)
feature("a work order's checklist is read by its technician, not another or Retail's planner; a waiver is a supervisor's", {
    when() {
        const call = (user, service, parameters) =>
            asUser(user, () => {
                ec.artifactExecution.disableAuthz()
                return refusal(service, parameters)
            })
        const read = user => call(user, "mantle.work.ProcessServices.get#ProcessExecution", {workEffortId: ids.inProgressOrderId})
        const waive = user =>
            call(user, "mantle.work.ProcessServices.waive#ProcessStep", {workEffortId: ids.inProgressOrderId, reason: "Spec"})
        const problems = []
        if (read(users.tech) !== "") problems.push("the technician cannot read: " + read(users.tech))
        if (!read(users.tech2).includes("NOT_ASSIGNED")) problems.push("another technician reads: " + read(users.tech2))
        if (!read(users.retailPlanner).includes("RECORD_UNAVAILABLE")) problems.push("Retail reads: " + read(users.retailPlanner))
        if (!waive(users.tech).includes("PERMISSION_DENIED")) problems.push("the technician waives: " + waive(users.tech))
        if (!waive(users.supervisor).includes("STEP_REQUIRED")) problems.push("the supervisor: " + waive(users.supervisor))
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature(
    "a work order's purchases are its planner's: a resource administrator and Retail are refused; a technician asks for nothing and a planner links no unrequested line; the receiving supervisor opens no Warehouse",
    {
        when() {
            const S = "mantle.work.MaintenanceServices."
            const as = (user, service, parameters) =>
                asUser(user, () => {
                    ec.artifactExecution.disableAuthz()
                    return refusal(service, parameters)
                })
            const work = {workEffortId: ids.heldOrderId}
            return {
                holder: as(users.planner, S + "get#MaintenancePurchases", work),
                resources: as(users.resources, S + "get#MaintenancePurchases", work),
                otherOrganization: as(users.retailPlanner, S + "get#MaintenancePurchases", work),
                techAsks: as(users.tech2, S + "link#MaintenancePurchase", Object.assign({requestName: "Bearings"}, work)),
                plannerLinks: as(
                    users.planner,
                    S + "link#MaintenancePurchase",
                    Object.assign({orderId: "BOSS_PUR_PO_SVC", orderItemSeqId: "01"}, work)
                ),
                otherAsks: as(
                    users.retailPlanner,
                    S + "link#MaintenancePurchase",
                    Object.assign({requestName: "Bearings"}, work)
                ),
                // the supervisor holds STOCK_RECEIVE through Warehouse's receiving group (R1), which opens no Warehouse screen
                supervisorApps: shellData(users.supervisor).apps.map(app => app.name),
                supervisorQuickCreates: quickCreates(users.supervisor)
            }
        },
        then({holder, resources, otherOrganization, techAsks, plannerLinks, otherAsks, supervisorApps, supervisorQuickCreates}) {
            holder == ""
            resources.includes("PERMISSION_DENIED")
            otherOrganization.includes("RECORD_UNAVAILABLE")
            techAsks.includes("PERMISSION_DENIED")
            plannerLinks.includes("PERMISSION_DENIED")
            otherAsks.includes("RECORD_UNAVAILABLE")
            supervisorApps.includes("Maintenance")
            !supervisorApps.includes("Warehouse")
            !supervisorQuickCreates.includes("warehouseNewReceipt")
        }
    }
)

feature(
    "the stack providers answer a work order's card and a caller's work to its planner, not a resource administrator, Retail or a requester; Comms offers Report a problem to a reporter only",
    {
        when() {
            const S = "ironstone.maintenance.StackServices."
            const card = user =>
                asUser(user, () => {
                    try {
                        const out = invoke(S + "lookup#Records", {
                            operation: "card",
                            recordEntityName: "mantle.work.effort.WorkEffort",
                            recordId: ids.inProgressOrderId
                        })
                        if (ec.message.hasError()) return "refused " + ec.message.getErrorsString()
                        return out.card ? "card" : "none"
                    } catch (error) {
                        return "refused " + error.message
                    }
                })
            // the requester's spec-local work number: a colleague, whose call names the work order of the request they filed (R4)
            system(() =>
                call("mantle.party.ContactServices.create#TelecomNumber", {
                    partyId: "BOSS_MNT_REQUESTER",
                    countryCode: "1",
                    areaCode: "801",
                    contactNumber: "777-0194",
                    contactMechPurposeId: "PhoneWork"
                })
            )
            const callWork = user =>
                asUser(user, () => {
                    try {
                        const out = invoke(S + "get#CallContext", {number: "+18017770194"})
                        if (ec.message.hasError()) return "refused " + ec.message.getErrorsString()
                        return Array.from(out.recordList || []).some(row => row.url.includes(ids.inProgressOrderId))
                            ? "work"
                            : "none"
                    } catch (error) {
                        return "refused " + error.message
                    }
                })
            // Comms' Chat message actions (the screen-extend's ext-action, shown by Report a problem's grant)
            const chatActions = user =>
                asUser(user, () => {
                    const result = ec.screen
                        .makeTest()
                        .rootScreen("component://webroot/screen/webroot.xml")
                        .render("extItems/apps/Comms/Chat", {}, null)
                    ec.message.clearErrors()
                    if (result.status != 200) return []
                    return Array.from(JSON.parse(String(result.output)).actions || []).map(action => action.name)
                })
            return {
                holderCard: card(users.planner),
                resourcesCard: card(users.resources),
                otherCard: card(users.retailPlanner),
                requesterCard: card(users.requester),
                holderCall: callWork(users.planner),
                otherCall: callWork(users.retailPlanner),
                requesterCall: callWork(users.requester),
                requesterActions: chatActions(users.requester),
                otherAppActions: chatActions(users.otherApp)
            }
        },
        then(out) {
            out.holderCard == "card"
            out.resourcesCard == "none"
            out.otherCard == "none"
            refused(out.requesterCard)
            out.holderCall == "work"
            out.otherCall == "none"
            refused(out.requesterCall)
            out.requesterActions.includes("maintenance.reportProblem")
            !out.otherAppActions.includes("maintenance.reportProblem")
        }
    }
)

// P18: the equipment import is run by a holder of MAINTENANCE_IMPORT with the resource edit permission (the resource administrator),
// read by a reader of equipment, and its organizations are the importer's own; the setup readiness is the Maintenance
// administrator's
feature(
    "the equipment import is the resource administrator's: the planner reads it and runs none, Retail's planner gets no Services import; readiness is the administrator's",
    {
        when() {
            const mount = user =>
                asUser(user, () => {
                    ec.message.pushErrors()
                    try {
                        // the screen's grant aside (EquipmentImport carries the Equipment area's): the mount's own checks decide
                        const found = system(() =>
                            invoke("ironstone.shared.DataImportServices.get#ImportMount", {appRoot: "Maintenance"})
                        )
                        return ec.message.hasError() ? {refused: ec.message.getErrorsString()} : found.importMount
                    } catch (error) {
                        return {refused: String(error.message)}
                    } finally {
                        ec.message.clearErrors()
                        ec.message.popErrors()
                    }
                })
            const scopes = user =>
                asUser(user, () =>
                    Array.from(
                        invoke("mantle.product.MaintenanceImportServices.find#EquipmentImportScopes", {targetId: "equipment"})
                            .scopeList || []
                    ).map(scope => scope.scopeKey)
                )
            const readiness = user =>
                asUser(user, () =>
                    refusal("mantle.work.MaintenanceSettingsServices.check#MaintenanceReadiness", {
                        organizationPartyId: ids.organizationId
                    })
                )
            return {
                holder: mount(users.resources),
                planner: mount(users.planner),
                requester: mount(users.requester),
                holderScopes: scopes(users.resources),
                retailScopes: scopes(users.retailPlanner),
                adminReadiness: readiness(users.admin),
                resourcesReadiness: readiness(users.resources)
            }
        },
        then(out) {
            out.holder.targetId == "equipment" && out.holder.canRun === true
            out.planner.targetId == "equipment" && out.planner.canRun === false
            !!out.requester.refused
            out.holderScopes.includes(ids.organizationId)
            !out.retailScopes.includes(ids.organizationId)
            out.adminReadiness == ""
            out.resourcesReadiness.includes("PERMISSION_DENIED")
        }
    }
)

// P12: a customer repair (a spec-local organization's, lib.customerRepair) has its report stored by its assigned technician
// (store#InterventionReport: past the permission and scope to WORK_NOT_DONE on the work not yet complete, so nothing is rendered
// or stored here; WarrantyManagedRepair stores it), not its organization's Customer Service agent (no maintenance permission) or
// Services' technician; the customer's unit is read through the repair (the work order and its report screen open to the
// technician, the asset's own record does not); Customer Service's send#InterventionReport is its organization's agent's (past
// the scope to REPORT_REQUIRED), not the technician's or Services' agent, with the same parameters
feature(
    "a customer repair's report is stored by its technician and sent by the claim's agent; the customer's unit is read through it (P12)",
    {
        when() {
            const repair = lib.customerRepair("ACCESS")
            const as = (user, service, parameters) =>
                asUser(user, () => {
                    ec.artifactExecution.disableAuthz()
                    return refusal(service, parameters)
                })
            const store = user =>
                as(user, "mantle.work.MaintenanceServices.store#InterventionReport", {workEffortId: repair.workEffortId})
            const send = user =>
                as(user, "mantle.request.WarrantyServices.send#InterventionReport", {
                    operationKey: "access-p12-" + user,
                    requestId: repair.requestId,
                    assetMaintenanceId: repair.assetMaintenanceId,
                    toAddress: "nobody@example.com"
                })
            const check = (recordType, recordId) =>
                asUser(repair.tech, () => refusal(access + "check#Record", {appRoot: "Maintenance", recordType, recordId}))
            const holder = store(repair.tech)
            const agentStores = store(repair.agent)
            const otherOrganization = store(users.tech)
            const agent = send(repair.agent)
            // completed, the report screen offers the store to its technician (its one qvt render)
            system(() =>
                call("update#mantle.work.effort.WorkEffort", {workEffortId: repair.workEffortId, statusId: "WeComplete"})
            )
            return {
                holder,
                agentStores,
                otherOrganization,
                agent,
                report: asUser(repair.tech, () => page("WorkOrders/InterventionReport", {workEffortId: repair.workEffortId})),
                workOrder: check("workOrder", repair.workEffortId),
                asset: check("asset", repair.assetId),
                techSends: send(repair.tech),
                otherAgent: send("customerservice.services")
            }
        },
        then(r) {
            r.holder.includes("WORK_NOT_DONE")
            r.agentStores.includes("PERMISSION_DENIED")
            r.otherOrganization.includes("RECORD_UNAVAILABLE")
            r.report.errors.length == 0
            r.report.output.includes("Intervention report")
            r.report.output.includes("Repair spec customer ACCESS")
            r.report.output.includes("Store for the customer")
            r.workOrder == ""
            r.asset.includes("RECORD_UNAVAILABLE")
            r.agent.includes("REPORT_REQUIRED")
            r.techSends.includes("PERMISSION_DENIED")
            r.otherAgent.includes("RECORD_UNAVAILABLE")
        }
    }
)

feature(
    "Report a problem from a chat message reads it under Comms' room check with the user's own filters: a room of Retail's record is refused, a public room's message filed",
    {
        when() {
            // a record room of Retail's forklift (read by those who may see the forklift) and a public room, made by the system
            const made = system(() => {
                const room = (fields, body) => {
                    const chatRoomId = call("org.moqui.chat.ChatServices.create#Room", fields).chatRoomId
                    const eventSeq = call("org.moqui.chat.ChatServices.send#Message", {chatRoomId, body}).eventSeq
                    return {chatRoomId, eventSeq}
                }
                return {
                    retail: room(
                        {
                            roomTypeEnumId: "CrtRecord",
                            visibilityEnumId: "CrvRecord",
                            recordEntityName: "mantle.product.asset.Asset",
                            recordId: ids.otherAssetId,
                            roomName: "Spec forklift room"
                        },
                        "<p>Forklift mast chain is frayed</p>"
                    ),
                    open: room(
                        {roomTypeEnumId: "CrtPublic", visibilityEnumId: "CrvUsers", roomName: "Spec maintenance chat"},
                        "<p>Compressor belt squeals at start</p>"
                    )
                }
            })
            // the requester's Report a problem from each (ReportProblem's transition, as the Comms action's dialog posts it)
            const report = (source, summary) =>
                asUser(users.requester, () =>
                    page(
                        "ReportProblem/reportProblem",
                        {
                            targetKey: "asset:" + ids.compressorId,
                            summary,
                            priority: "5",
                            operationKey: "spec-mnt-chat-" + source.chatRoomId,
                            sourceChatRoomId: source.chatRoomId,
                            sourceEventSeq: String(source.eventSeq)
                        },
                        "json",
                        "Commons"
                    )
                )
            const retail = report(made.retail, "Spec forklift chain")
            const open = report(made.open, "Spec compressor belt")
            const filed = summary =>
                system(() => {
                    const request = ec.entity.find("mantle.request.Request").condition("requestName", summary).one()
                    return request
                        ? ec.entity.find("mantle.request.RequestCommEvent").condition("requestId", request.requestId).count()
                        : -1
                })
            return {retail, open, retailFiled: filed("Spec forklift chain"), openFiled: filed("Spec compressor belt")}
        },
        then({retail, open, retailFiled, openFiled}) {
            !retail.output.includes("Problem reported as request")
            retailFiled == -1
            open.output.includes("Problem reported as request")
            openFiled == 1
        }
    }
)

// P11: costs are the cost reader's (MAINTENANCE_COST_VIEW): Mantle's get#MaintenanceCosts answers maint.cost and refuses the planner
// and the supervisor, and another organization; the Costs tab and the cost report (BOSS_MNT_COSTS) are in the cost reader's menu and
// no one else's (the report in the Reports area beside PM compliance), and refused to the planner
feature(
    "a work order's costs are the cost reader's: the planner and the supervisor are refused, Retail is refused, and only the cost reader has the tab and the report",
    {
        when() {
            const as = (user, parameters) =>
                asUser(user, () => {
                    ec.artifactExecution.disableAuthz()
                    return refusal("mantle.work.MaintenanceReportServices.get#MaintenanceCosts", parameters)
                })
            const work = {workEffortId: ids.heldOrderId}
            const tabs = user =>
                shell(user, true, "WorkOrders/WorkOrderDetail/Overview?workEffortId=" + ids.heldOrderId, "WorkOrderDetail").names
            const areas = user => shell(user, true, "Reports/PreventiveComplianceReport", "Reports").names
            return {
                holder: as(users.cost, work),
                planner: as(users.planner, work),
                supervisor: as(users.supervisor, work),
                otherOrganization: as(users.cost, {organizationPartyId: ids.otherOrganizationId}),
                costTabs: tabs(users.cost),
                plannerTabs: tabs(users.planner),
                costAreas: areas(users.cost),
                plannerAreas: areas(users.planner),
                plannerTab: screenRefusal(users.planner, "WorkOrders/WorkOrderDetail/Costs", work),
                plannerReport: screenRefusal(users.planner, "Reports/MaintenanceCostReport")
            }
        },
        then(r) {
            r.holder == ""
            r.planner.includes("PERMISSION_DENIED")
            r.supervisor.includes("PERMISSION_DENIED")
            r.otherOrganization.includes("ORGANIZATION_DENIED")
            r.costTabs.includes("Costs")
            r.plannerTabs.includes("Overview")
            !r.plannerTabs.includes("Costs")
            r.costAreas.includes("MaintenanceCostReport")
            !r.plannerAreas.includes("MaintenanceCostReport")
            r.plannerTab != ""
            r.plannerReport != ""
        }
    }
)

// P17: the work status report and the reports catalogue are a maintenance reader's (MAINTENANCE_VIEW), not a technician's; Retail's
// planner asking for Services' organization is refused
feature(
    "work status and the reports catalogue are a reader's, not a technician's; Retail's planner gets no Services report (P17)",
    {
        when() {
            const status = (user, parameters = {}) =>
                asUser(user, () =>
                    system(() => refusal("mantle.work.MaintenanceReportServices.get#MaintenanceStatusReport", parameters))
                )
            const catalogue = user =>
                asUser(user, () => refusal("ironstone.maintenance.ReportServices.get#ReportCatalogue", {appRoot: "Maintenance"}))
            return {
                reader: status(users.reader),
                tech: status(users.tech),
                retail: status(users.retailPlanner, {organizationPartyId: ids.organizationId}),
                readerCatalogue: catalogue(users.reader),
                techCatalogue: catalogue(users.tech)
            }
        },
        then(out) {
            out.reader == ""
            out.tech.includes("PERMISSION_DENIED")
            out.retail.includes("ORGANIZATION_DENIED")
            out.readerCatalogue == ""
            out.techCatalogue.includes("PERMISSION_DENIED")
        }
    }
)
