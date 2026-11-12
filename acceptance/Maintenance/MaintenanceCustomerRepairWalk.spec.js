// Maintenance P12's "usable when" (impl-maintenance P12; design-maintenance §11.2 "Request and customer repair", its repair half),
// as an acceptance walk through the screens' transitions with artifact authorization on, in a spec-local organization whose policy
// manages warranty repairs (MaintenanceSpecLib customerRepair: Customer Service's specs read the demo organizations' cases exactly):
// its Customer Service agent records the customer's consent to the chargeable repair on WarrantyAssessment and adds the repair,
// which makes it a work order assigned to its technician; WorkOrderDetail shows the technician the customer repair; the technician
// starts it, issues a gasket from the organization's stock and completes it; the agent is told it finished and the case stays open;
// the technician stores the intervention report on Maintenance/WorkOrders/InterventionReport, and the agent sends it from the
// claim's RepairLinks to the customer's address and closes the case herself. The rules are Mantle's WarrantyManagedRepair and BOSS's
// MaintenanceAccess; Customer Service's own walk is CustomerServiceWarrantyWalk.
// Run: ./moq accept mr-boss --spec MaintenanceCustomerRepairWalk
const lib = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
const {ids, asUser, system, invoke, page} = lib
const state = {}

// A transition of a screen posted as the user: its status, its errors and where it sent the user.
function post(user, path, parameters, root = "Maintenance") {
    return asUser(user, () => {
        const result = ec.screen
            .makeTest()
            .rootScreen("component://mr-boss/screen/" + root + ".xml")
            .render(path, parameters, "post")
        const errors = Array.from(result.errorMessages || [])
        ec.message.clearErrors()
        return {status: result.status, errors, location: String(result.header("Location") || "")}
    })
}
// A Mantle call as the user under the root's inheritable grant (the artifact check aside; the service's own checks decide).
function as(user, service, parameters) {
    return asUser(user, () => {
        ec.artifactExecution.disableAuthz()
        return invoke(service, parameters)
    })
}
const rows = (entity, conditions) => Array.from(ec.entity.find(entity).condition(conditions).disableAuthz().list())
const one = (entity, conditions) => ec.entity.find(entity).condition(conditions).disableAuthz().one()
// as the form posts it, a string: the screen reads a missing revision as claimRevision || null, so a number 0 would be missing
const revisionOf = requestId => String(one("mantle.request.Request", {requestId}).claimRevision ?? 0)
const notices = requestId =>
    rows("moqui.security.user.NotificationMessage", {topic: "WarrantyRepairFinished", recordId: requestId}).length

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        // the organization, its customer, the sold unit, the technician, the agent and the decided claim; the repair not linked yet
        state.repair = lib.customerRepair("WALK", false)
        // the organization's workshop with gaskets in stock, which its technician issues; the agent's mailbox
        system(() => {
            const facilityId = "MNT_SPEC_WALK_SHOP"
            if (one("mantle.facility.Facility", {facilityId})) return
            call("create#mantle.facility.Facility", {
                facilityId,
                facilityName: "Repair walk workshop",
                facilityTypeEnumId: "FcTpWarehouse",
                ownerPartyId: state.repair.organizationPartyId
            })
            call("create#mantle.product.asset.Asset", {
                assetId: "MNT_SPEC_WALK_GASKETS",
                productId: ids.gasketId,
                assetTypeEnumId: "AstTpInventory",
                statusId: "AstAvailable",
                facilityId,
                ownerPartyId: state.repair.organizationPartyId,
                quantityOnHandTotal: 10,
                availableToPromiseTotal: 10,
                acquireCost: 4,
                acquireCostUomId: "USD"
            })
            call("create#moqui.basic.email.EmailAccount", {
                emailAccountId: "MNT_SPEC_WALK_MAIL",
                ownerPartyId: state.repair.organizationPartyId,
                accountKindEnumId: "EakShared",
                emailServerId: "BOSS_CS_DEMO_MAIL",
                emailAddress: "service@repair-walk.example",
                accountName: "Repair walk service",
                statusId: "EasActive",
                recordFilingEnumId: "ErfLinkedOnly"
            })
            call("create#moqui.basic.email.EmailAccountUser", {
                emailAccountId: "MNT_SPEC_WALK_MAIL",
                userId: state.repair.agentPartyId,
                fromDate: "2000-01-01T00:00:00Z",
                permissionEnumId: "EapSend"
            })
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature(
    "the agent records the customer's consent and adds the repair: it is a work order the technician sees as a customer repair",
    {
        when() {
            const {requestId, agent, tech, techPartyId} = state.repair
            const consented = post(
                agent,
                "Returns/WarrantyAssessment/decideClaim",
                {
                    requestId,
                    claimRevision: revisionOf(requestId),
                    decisionEnumId: "WdRejected",
                    reason: "Out of warranty: repaired at the customer's cost",
                    chargeEstimate: "120",
                    chargeCurrencyUomId: "USD",
                    customerConsentRef: "Email of the front desk",
                    operationKey: "repair-walk-consent"
                },
                "CustomerService"
            )
            const linked = post(
                agent,
                "Returns/WarrantyAssessment/linkWork",
                {
                    requestId,
                    comments: "Replace the fan mount gasket",
                    assigneePartyId: techPartyId,
                    operationKey: "repair-walk-link"
                },
                "CustomerService"
            )
            const link = rows("mantle.request.RequestRecord", {
                requestId,
                recordEntityName: "mantle.product.maintenance.AssetMaintenance"
            })[0]
            state.assetMaintenanceId = link?.recordId
            state.workEffortId = rows("mantle.work.maintenance.MaintenanceWorkOrder", {
                assetMaintenanceId: state.assetMaintenanceId
            })[0]?.workEffortId
            const detail = asUser(tech, () => page("WorkOrders/WorkOrderDetail", {workEffortId: state.workEffortId}))
            // the charge and its consent are on the Overview tab, which the shell loads on its own
            const overview = asUser(tech, () =>
                page("WorkOrders/WorkOrderDetail/Overview", {workEffortId: state.workEffortId, lastStandalone: "true"})
            )
            return {consented, linked, detail, overview}
        },
        then({consented, linked, detail, overview}) {
            consented.errors.length == 0
            linked.errors.length == 0
            state.workEffortId != null
            one("mantle.product.asset.Asset", {assetId: state.repair.assetId}).ownerPartyId == state.repair.customerPartyId
            detail.errors.length == 0
            detail.output.includes("Customer repair for Repair spec customer WALK")
            overview.errors.length == 0
            overview.output.includes("The customer agreed")
            detail.output.includes("Start")
        }
    }
)

feature("the technician starts it, issues a gasket and completes it; the agent is told and the case stays open", {
    when() {
        const {requestId, tech} = state.repair
        const before = notices(requestId)
        const started = as(tech, "mantle.work.MaintenanceServices.transition#MaintenanceWorkOrder", {
            workEffortId: state.workEffortId,
            action: "start"
        })
        const issued = as(tech, "mantle.work.MaintenanceExecutionServices.issue#MaintenanceMaterial", {
            workEffortId: state.workEffortId,
            productId: ids.gasketId,
            assetId: "MNT_SPEC_WALK_GASKETS",
            quantity: 1,
            operationKey: "repair-walk-issue"
        }).result
        const completed = as(tech, "mantle.work.MaintenanceServices.transition#MaintenanceWorkOrder", {
            workEffortId: state.workEffortId,
            action: "complete",
            outcomeEnumId: "MoutRepaired",
            dispositionEnumId: "MdispAvailable"
        })
        return {before, started, issued, completed, after: notices(requestId)}
    },
    then({before, started, issued, completed, after}) {
        started.statusId == "WeInProgress"
        issued.resultCode == "ISSUED"
        completed.statusId == "WeComplete"
        one("mantle.product.maintenance.AssetMaintenance", {assetMaintenanceId: state.assetMaintenanceId}).statusId ==
            "AsMntCompleted"
        after == before + 1
        !["ReqCompleted", "ReqCancelled"].includes(one("mantle.request.Request", {requestId: state.repair.requestId}).statusId)
    }
})

feature("the technician stores the intervention report; the agent sends it to the customer and closes the case herself", {
    when() {
        const {requestId, agent, tech, address} = state.repair
        const report = asUser(tech, () => page("WorkOrders/InterventionReport", {workEffortId: state.workEffortId}))
        const stored = post(tech, "WorkOrders/InterventionReport/storeReport", {
            workEffortId: state.workEffortId,
            acknowledgmentText: "Front desk",
            operationKey: "repair-walk-store"
        })
        const assessment = asUser(agent, () =>
            ec.screen
                .makeTest()
                .rootScreen("component://mr-boss/screen/CustomerService.xml")
                .renderMode("html")
                .render("Returns/WarrantyAssessment", {requestId}, null)
        )
        const sent = post(
            agent,
            "Returns/WarrantyAssessment/sendReport",
            {
                requestId,
                assetMaintenanceId: state.assetMaintenanceId,
                toAddress: address,
                emailAccountId: "MNT_SPEC_WALK_MAIL",
                operationKey: "repair-walk-send"
            },
            "CustomerService"
        )
        const closed = post(
            agent,
            "Cases/CaseDetail/transitionCase",
            {
                requestId,
                toStatusId: "ReqCompleted",
                resolutionEnumId: "RrFixed",
                reason: "Repaired; the report is sent"
            },
            "CustomerService"
        ).errors.join(" | ")
        return {report, stored, assessmentOutput: String(assessment.output || ""), sent, closed}
    },
    then({report, stored, assessmentOutput, sent, closed}) {
        report.errors.length == 0
        report.output.includes("Repair spec customer WALK")
        stored.errors.length == 0
        rows("mantle.work.effort.WorkEffortContent", {
            workEffortId: state.workEffortId,
            contentTypeEnumId: "WectInterventionReport"
        }).length == 1
        assessmentOutput.includes("Send intervention report")
        assessmentOutput.includes("report stored")
        sent.errors.length == 0
        closed == ""
        one("mantle.request.Request", {requestId: state.repair.requestId}).statusId == "ReqCompleted"
    }
})
