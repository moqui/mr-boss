// Maintenance P9's "usable when" (impl-maintenance P9; design-maintenance §11.2 "Time and stock" and "Financial routing"), as an
// acceptance walk through the screens' transitions with artifact authorization on: maint.planner creates a corrective work order on
// the compressor with New work order, charges it to Services as its cost centre (Overview's Edit) and adds the model's suggested parts
// on the Parts tab; maint.tech, assigned with the stock grant, starts it and issues two filters and returns one on
// Maintenance/WorkOrders/MaterialIssueReceipt; the work order shows one filter used; Accounting's journal holds the issue as
// maintenance expense (the mapped Repairs and maintenance account, not WIP) with the compressor's room and the cost centre, and the
// return credited the same way; with Services' maintenance expense mapping ended in Accounting's Posting defaults the next issue
// stops with the named exception, and a new mapping lets it go again. The rules are Mantle's MaintenanceMaterials and
// MaintenanceExpenseRouting and BOSS's MaintenanceParts and MaintenanceAccess.
// Run: ./moq accept mr-boss --spec MaintenancePartsWalk
const lib = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
const {ids, users, asUser, invoke, page} = lib
const state = {}
const filterStock = "BOSS_MNT_STOCK_FILTER"
const filterId = "BOSS_MNT_PART_FILTER"
const expenseAccount = "613200000"
const hour = 3600000

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
const n = value => (value == null ? null : Number(String(value)))
const revision = workEffortId => n(one("mantle.work.maintenance.MaintenanceWorkOrder", {workEffortId}).revision) || 0
const postingOf = (field, id) => {
    const trans = rows("mantle.ledger.transaction.AcctgTrans", {[field]: id}).filter(row => row.reversedByAcctgTransId == null)[0]
    return trans ? {trans, entries: rows("mantle.ledger.transaction.AcctgTransEntry", {acctgTransId: trans.acctgTransId})} : null
}
const material = path => "WorkOrders/MaterialIssueReceipt/" + path

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("the planner creates the compressor's work order, charges it to Services and adds the suggested parts", {
    when() {
        const created = post(users.planner, "WorkOrders/NewWorkOrder/createWorkOrder", {
            targetKind: "equipment",
            assetId: ids.compressorId,
            workEffortName: "Parts walk: intake filter clogged",
            maintenanceKindEnumId: "MkCorrective",
            operationKey: "parts-walk-create"
        })
        state.work = rows("mantle.work.effort.WorkEffort", {workEffortName: "Parts walk: intake filter clogged"})[0]?.workEffortId
        const charged = post(users.planner, "WorkOrders/WorkOrderDetail/Overview/storeWorkOrder", {
            workEffortId: state.work,
            expectedRevision: revision(state.work),
            costCenterId: ids.organizationId
        })
        const suggested = post(users.planner, "WorkOrders/WorkOrderDetail/Parts/storeMaterial", {
            workEffortId: state.work,
            addSuggested: "Y"
        })
        const tab = asUser(users.planner, () =>
            page("WorkOrders/WorkOrderDetail/Parts", {workEffortId: state.work, lastStandalone: "true"})
        )
        return {created, charged, suggested, tab}
    },
    then({created, charged, suggested, tab}) {
        created.errors.length == 0 && state.work != null
        charged.errors.length == 0
        one("mantle.work.maintenance.MaintenanceWorkOrder", {workEffortId: state.work}).costCenterId == ids.organizationId
        suggested.errors.length == 0
        tab.output.includes("AC-200 intake filter")
        tab.output.includes("AC-200 drive belt")
        !tab.output.includes("Add suggested parts")
    }
})

feature("the technician with the stock grant issues two filters and returns one; the work order shows one used", {
    when() {
        as(users.planner, "mantle.work.MaintenanceServices.schedule#MaintenanceWorkOrder", {
            workEffortId: state.work,
            expectedRevision: revision(state.work),
            assigneePartyIds: [ids.techPartyId],
            estimatedStartDate: new Date(Date.now() - hour),
            estimatedCompletionDate: new Date(Date.now() + 4 * hour)
        })
        const started = as(users.tech, "mantle.work.MaintenanceServices.transition#MaintenanceWorkOrder", {
            workEffortId: state.work,
            action: "start",
            expectedRevision: revision(state.work)
        })
        const issued = post(users.tech, material("materialAction"), {
            workEffortId: state.work,
            lineKey: state.work + "__" + filterId,
            assetId: filterStock,
            quantity: 2,
            operationKey: "parts-walk-issue"
        })
        state.issuance = rows("mantle.product.issuance.AssetIssuance", {workEffortId: state.work})[0]?.assetIssuanceId
        const returned = post(users.tech, material("materialAction"), {
            workEffortId: state.work,
            actionKind: "return",
            lineKey: state.issuance,
            quantity: 1,
            operationKey: "parts-walk-return"
        })
        const parts = as(users.planner, "mantle.work.MaintenanceExecutionServices.get#MaintenanceMaterials", {
            workEffortId: state.work
        })
        const screen = asUser(users.tech, () =>
            page("WorkOrders/MaterialIssueReceipt", {workEffortId: state.work, lastStandalone: "true"})
        )
        return {started, issued, returned, parts, screen}
    },
    then({started, issued, returned, parts, screen}) {
        started.statusId == "WeInProgress"
        issued.errors.length == 0
        returned.errors.length == 0
        parts.usedList.find(row => row.productId == filterId).used == "1"
        parts.plannedList.find(row => row.productId == filterId).used == "1"
        screen.errors.length == 0
        screen.output.includes("Unused return")
    }
})

feature(
    "Accounting's journal shows the issue as maintenance expense with the facility and cost centre, the return the same way",
    {
        when() {
            const receipt = rows("mantle.product.receipt.AssetReceipt", {sourceAssetIssuanceId: state.issuance})[0]
            return {
                issue: postingOf("assetIssuanceId", state.issuance),
                back: postingOf("assetReceiptId", receipt?.assetReceiptId)
            }
        },
        then({issue, back}) {
            const debit = issue.entries.find(row => row.debitCreditFlag == "D")
            issue.trans.isPosted == "Y"
            debit.glAccountId == expenseAccount
            debit.facilityId == ids.mechanicalRoomId
            debit.costCenterId == ids.organizationId
            const credit = back.entries.find(row => row.debitCreditFlag == "C")
            credit.glAccountId == expenseAccount
            credit.facilityId == ids.mechanicalRoomId
            n(credit.amount) * 2 == n(debit.amount)
        }
    }
)

feature("with the mapping ended in Posting defaults the next issue stops with the named exception; a new mapping lets it go", {
    when() {
        const policy = one("mantle.ledger.config.MaintenanceCostPolicy", {maintenanceCostPolicyId: "BOSS_MNT_COST_SVC"})
        const save = parameters =>
            post(
                users.system,
                "Settings/PostingDefaults/save",
                Object.assign(
                    {organizationPartyId: ids.organizationId, mappingKind: "maintenance", changeReason: "Parts walk"},
                    parameters
                ),
                "Accounting"
            )
        // a mapping ends no earlier than now (P9 review R3): end it a moment ahead, and issue once that moment has passed
        const endsAt = Date.now() + 500
        const ended = save({
            maintenanceCostPolicyId: policy.maintenanceCostPolicyId,
            glAccountId: policy.glAccountId,
            fromDate: policy.fromDate,
            thruDate: new Date(endsAt),
            lastUpdatedStamp: policy.lastUpdatedStamp
        })
        while (Date.now() <= endsAt + 50) {}
        const refused = post(users.tech, material("materialAction"), {
            workEffortId: state.work,
            lineKey: state.work + "__" + filterId,
            assetId: filterStock,
            quantity: 1,
            operationKey: "parts-walk-unmapped"
        })
        const mapped = save({glAccountId: expenseAccount})
        const again = post(users.tech, material("materialAction"), {
            workEffortId: state.work,
            lineKey: state.work + "__" + filterId,
            assetId: filterStock,
            quantity: 1,
            operationKey: "parts-walk-mapped"
        })
        return {ended, refused, mapped, again}
    },
    then({ended, refused, mapped, again}) {
        ended.errors.length == 0
        refused.errors.join(" ").includes("COST_POLICY_MISSING")
        refused.errors.join(" ").includes("Posting defaults")
        mapped.errors.length == 0
        again.errors.length == 0
    }
})
