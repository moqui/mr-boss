// Purchasing P10's "usable when" (impl-purchasing P10; design §4 Requests, RequestDetail and RequestSourcing, §14.4 #1),
// through the screens' transitions with artifact authorization on: a requester files a request for ORG_ZIZI_RETAIL with
// three lines, two with suppliers and one without, and submits it; the approver's approval makes three requirements with
// the organization's role and reserves the lines' maximum against Retail's budget; RequestSourcing makes a draft purchase
// order for each supplier and names the line with no supplier (MISSING_SUPPLIER); once its supplier is chosen the retry
// makes only that order; a second conversion of the same lines is refused as already sourced; approving a sourced order
// converts the request's reservation, so the amount is not counted twice; a Projects work item linked to the request
// completes and the request stays In Progress; the Items tab shows in the Commons and Projects contexts, with Create
// purchase order for a buyer only; and (P17) the buyer completes the sourced request from RequestDetail with a reason.
// Run: ./moq accept mr-boss --spec PurchasingRequestsWalk
const lib = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const webroot = "component://webroot/screen/webroot.xml"
const rows = (entity, key) => system(() => Array.from(ec.entity.find(entity).condition(key).list()))
const one = (entity, key) => rows(entity, key)[0]
const R = "mantle.request.RequestServices.",
    P = "mantle.order.PurchaseServices.",
    B = "mantle.other.BudgetServices."
const detailPath = "Requests/RequestDetail/"
const sourcingPath = "Requests/RequestSourcing/"
const state = {name: "Walk workshop supplies " + Date.now()}
// a transition of a screen as the user posts it: its status and errors
function post(user, path, parameters, app = "Purchasing") {
    return asUser(user, () => {
        const rendered = ec.screen
            .makeTest()
            .rootScreen(webroot)
            .render("apps/" + app + "/" + path, parameters, "post")
        const result = {status: rendered.status, errors: Array.from(rendered.errorMessages || []).join(" | ")}
        ec.message.clearErrors()
        return result
    })
}
// a screen of another app as the user sees it (html)
function render(user, path, parameters) {
    return asUser(user, () => {
        const rendered = ec.screen
            .makeTest()
            .rootScreen(webroot)
            .renderMode("html")
            .render("apps/" + path, parameters, null)
        const output = String(rendered.output || "")
        ec.message.clearErrors()
        return {
            status: rendered.status,
            output,
            errors: (output.match(/(Error rendering|Exception in render)[^\n<]*/g) || []).join(" | ")
        }
    })
}
const statusOf = requestId => one("mantle.request.Request", {requestId}).statusId
const keysOf = requestId =>
    rows("mantle.request.RequestItem", {requestId})
        .map(row => requestId + ":" + row.requestItemSeqId)
        .sort()

spec({
    stepwise: true,
    setupSpec() {
        // an approved budget of Retail's on DEMO_1_1's account, so the request's maximum is reserved at its approval: entered
        // and approved by john.doe with the walk's budget group
        login("john.doe")
        system(() => {
            if (!one("moqui.security.UserGroup", {userGroupId: "BOSS_PUR_WALK_BUDGET"})) {
                invoke("create#moqui.security.UserGroup", {
                    userGroupId: "BOSS_PUR_WALK_BUDGET",
                    description: "Request walk budget"
                })
                for (const userPermissionId of ["BUDGET_EDIT", "BUDGET_APPROVE", "ACCOUNTING_VIEW"])
                    invoke("create#moqui.security.UserGroupPermission", {
                        userGroupId: "BOSS_PUR_WALK_BUDGET",
                        userPermissionId,
                        fromDate: "2000-01-01 00:00:00"
                    })
                invoke("create#moqui.security.UserGroupMember", {
                    userGroupId: "BOSS_PUR_WALK_BUDGET",
                    userId: "EX_JOHN_DOE",
                    fromDate: "2000-01-01 00:00:00"
                })
            }
        })
        login("john.doe")
        system(() => {
            // Brightline's purchase price of DEMO_1_1 (the demo has Ziddleman's only), so its group is priced
            if (!one("mantle.product.ProductPrice", {productPriceId: "BOSS_PUR_WALK_REQ_PRICE"}))
                invoke("create#mantle.product.ProductPrice", {
                    productPriceId: "BOSS_PUR_WALK_REQ_PRICE",
                    productId: "DEMO_1_1",
                    vendorPartyId: ids.supplierId,
                    pricePurposeEnumId: "PppPurchase",
                    priceTypeEnumId: "PptCurrent",
                    fromDate: "2026-01-01 00:00:00",
                    minQuantity: 1,
                    price: 11,
                    priceUomId: "USD"
                })
            state.account = invoke("mantle.ledger.InvoiceAutoPostServices.get#InvoiceItemGlAccount", {
                organizationPartyId: ids.organizationId,
                itemTypeEnumId: "ItemProduct",
                productId: "DEMO_1_1",
                direction: "I"
            }).glAccountId
            const yearId = invoke("mantle.ledger.LedgerServices.get#OrganizationFiscalTimePeriods", {
                organizationPartyId: ids.organizationId,
                filterDate: ec.user.nowTimestamp,
                timePeriodTypeId: "FiscalYear"
            }).timePeriodList[0].timePeriodId
            state.budgetId = invoke(B + "create#Budget", {timePeriodId: yearId, description: "Request walk budget"}).budgetId
            invoke(B + "store#BudgetItem", {budgetId: state.budgetId, glAccountId: state.account, amount: 1000000})
            // entered by the purchasing administrator, so john.doe approves it as another finance approver
            invoke("update#mantle.other.budget.Budget", {budgetId: state.budgetId, createdByUserId: "BOSS_PUR_ADMIN"})
            invoke(B + "change#BudgetState", {budgetId: state.budgetId, action: "approve"})
            if (ec.message.hasError()) throw new Error("The walk's budget: " + ec.message.getErrorsString())
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("a requester files a request for Retail with three lines, two with suppliers, and submits it for approval", {
    when() {
        const created = post(users.requester, "NewPurchaseRequest/createRequest", {
            organizationPartyId: ids.organizationId,
            requestName: state.name,
            facilityId: ids.facilityId,
            responseRequiredDate: "2026-12-15"
        })
        state.requestId = rows("mantle.request.Request", {requestName: state.name})[0]?.requestId
        const lines = [
            {supplierPartyId: ids.supplierId, quantity: "10", maximumAmount: "150"},
            {supplierPartyId: ids.sharedSupplierId, quantity: "4", maximumAmount: "60"},
            {quantity: "2", maximumAmount: "30"}
        ].map(line =>
            post(
                users.requester,
                detailPath + "storePurchaseRequestItem",
                Object.assign({requestId: state.requestId, productId: "DEMO_1_1"}, line)
            )
        )
        const submitted = post(users.requester, detailPath + "submitPurchaseRequest", {requestId: state.requestId})
        return {created, lines, submitted, status: statusOf(state.requestId)}
    },
    then(r) {
        r.created.errors == ""
        !!state.requestId
        r.lines.every(line => line.errors == "")
        r.submitted.errors == ""
        r.status == "ReqSubmitted"
    }
})

feature("the approval makes three requirements with the organization's role and reserves the commitment", {
    when() {
        const requester = post(users.requester, detailPath + "decidePurchaseRequest", {requestId: state.requestId})
        const approved = post(users.approve, detailPath + "decidePurchaseRequest", {
            requestId: state.requestId,
            decision: "approve"
        })
        const links = rows("mantle.request.requirement.RequirementRequestItem", {requestId: state.requestId})
        const roles = links.map(link =>
            rows("mantle.request.requirement.RequirementParty", {requirementId: link.requirementId}).some(
                row => row.partyId == ids.organizationId && row.roleTypeId == "OrgInternal"
            )
        )
        const reserved = rows("mantle.other.budget.BudgetCommitment", {sourceId: state.requestId, stageEnumId: "BcsRequest"})
        return {requester, approved, links, roles, reserved, status: statusOf(state.requestId)}
    },
    then(r) {
        r.requester.errors.includes("not authorized") || r.requester.errors.includes("PERMISSION_DENIED")
        r.approved.errors == ""
        r.links.length == 3
        r.roles.every(Boolean)
        r.reserved.length == 3
        r.reserved.every(row => row.statusId == "BcReserved")
        r.status == "ReqInProgress"
    }
})

feature(
    "RequestSourcing makes a draft order for each supplier and names the line with no supplier; after its supplier is chosen the retry makes only that order",
    {
        when() {
            state.operationKey = "walk-src-" + Date.now()
            const keys = keysOf(state.requestId)
            const view = asUser(users.buyer, () => page("Requests/RequestSourcing", {requestId: state.requestId}, "html"))
            const first = post(users.buyer, sourcingPath + "convertSourcing", {
                requestItemKeys: keys.join(","),
                operationKey: state.operationKey
            })
            const afterFirst = rows("mantle.request.RequestItemOrder", {requestId: state.requestId})
            const missing = asUser(users.buyer, () =>
                page(
                    "Requests/RequestSourcing",
                    {
                        requestId: state.requestId,
                        operationKey: state.operationKey
                    },
                    "html"
                )
            )
            const chosen = post(users.buyer, sourcingPath + "chooseSupplier", {lineKey: keys[2], supplierPartyId: ids.supplierId})
            const retry = post(users.buyer, sourcingPath + "convertSourcing", {
                requestItemKeys: keys.join(","),
                operationKey: state.operationKey
            })
            const afterRetry = rows("mantle.request.RequestItemOrder", {requestId: state.requestId})
            state.orderIds = [...new Set(afterRetry.map(row => row.orderId))]
            const statuses = state.orderIds.map(orderId => one("mantle.order.OrderHeader", {orderId}).statusId)
            return {view, first, afterFirst, missing, chosen, retry, afterRetry, statuses}
        },
        then(r) {
            r.view.errors.join(" | ") == ""
            r.view.output.includes("Create purchase orders")
            r.first.errors == ""
            r.afterFirst.length == 2
            new Set(r.afterFirst.map(row => row.orderId)).size == 2
            r.missing.output.toLowerCase().includes("missing supplier")
            r.chosen.errors == ""
            r.retry.errors == ""
            r.afterRetry.length == 3
            state.orderIds.length == 3
            r.statuses.every(statusId => statusId == "OrderOpen")
        }
    }
)

feature("a second conversion of the same lines is refused as already sourced", {
    when() {
        const again = asUser(
            users.buyer,
            () =>
                invoke(R + "convert#PurchaseSourcing", {
                    requestId: state.requestId,
                    operationKey: "walk-src-again-" + Date.now()
                }),
            false
        )
        return {again, links: rows("mantle.request.RequestItemOrder", {requestId: state.requestId}).length}
    },
    then(r) {
        r.again.createdCount == 0
        r.again.results.every(row => row.errorCode == "ALREADY_SOURCED")
        r.links == 3
    }
})

feature("approving a sourced order converts the request's reservation, so the amount is not counted twice", {
    when() {
        const link = rows("mantle.request.RequestItemOrder", {requestId: state.requestId, requestItemSeqId: "01"})[0]
        const orderId = link.orderId
        asUser(users.buyer, () => invoke(P + "place#PurchaseOrder", {orderId}), false)
        const revision = Number(one("mantle.order.OrderHeader", {orderId}).orderRevision)
        const decided = asUser(
            users.approve,
            () =>
                invoke(P + "decide#PurchaseApproval", {orderId, orderRevision: revision, operationKey: "walk-po-" + Date.now()}),
            false
        )
        const parent = rows("mantle.other.budget.BudgetCommitment", {
            sourceId: state.requestId,
            sourceItemId: "01",
            stageEnumId: "BcsRequest"
        })[0]
        const child = rows("mantle.other.budget.BudgetCommitment", {sourceId: orderId, stageEnumId: "BcsOrder"})
        return {decided, parent, child, status: one("mantle.order.OrderHeader", {orderId}).statusId}
    },
    then(r) {
        r.status == "OrderApproved"
        r.child.length == 1
        r.child[0].convertedFromId == r.parent.budgetCommitmentId
    }
})

feature("a Projects work item linked to the request completes and the request stays In Progress", {
    when() {
        const task = system(() => {
            invoke("update#mantle.request.Request", {requestId: state.requestId, rootWorkEffortId: "IRON"})
            const workEffortId = invoke(R + "make#RequestWorkItem", {
                requestId: state.requestId,
                workEffortName: "Fit the walk's supplies"
            }).workEffortId
            invoke("mantle.work.TaskServices.set#TaskStatus", {workEffortId, statusId: "WeInProgress"})
            invoke("mantle.work.TaskServices.set#TaskStatus", {workEffortId, statusId: "WeComplete"})
            return workEffortId
        })
        return {task, status: statusOf(state.requestId)}
    },
    then(r) {
        !!r.task
        r.status == "ReqInProgress"
    }
})

feature("the Items tab shows in the Commons and Projects contexts, with Create purchase order for a buyer only", {
    when() {
        const parameters = {requestId: state.requestId, tab: "items"}
        const requester = render(users.requester, "Commons/Requests/RequestDetail", parameters)
        const buyerCommons = render("john.doe", "Commons/Requests/RequestDetail", parameters)
        const projects = render("john.doe", "Projects/Requests/RequestDetail", parameters)
        return {requester, buyerCommons, projects}
    },
    then(r) {
        r.requester.errors == ""
        r.requester.output.includes("Items")
        r.requester.output.includes("Demo Product One-One")
        !r.requester.output.includes("Create purchase order")
        r.buyerCommons.errors == ""
        r.buyerCommons.output.includes("Create purchase order")
        r.projects.errors == ""
        r.projects.output.includes("Demo Product One-One")
        r.projects.output.includes("Create purchase order")
    }
})

// P17 (F127): the request, its lines sourced in full and not yet received, is completed from RequestDetail by the buyer
// with a reason (without one it is refused, naming the lines not received); a second complete is refused as closed
feature("the buyer completes the sourced request from RequestDetail with a reason; a second complete is refused", {
    when() {
        const detail = render(users.buyer, "Purchasing/Requests/RequestDetail", {requestId: state.requestId})
        const noReason = post(users.buyer, detailPath + "completePurchaseRequest", {requestId: state.requestId})
        const completed = post(users.buyer, detailPath + "completePurchaseRequest", {
            requestId: state.requestId,
            reason: "Sourced in full; the purchase orders follow"
        })
        const again = post(users.buyer, detailPath + "completePurchaseRequest", {requestId: state.requestId, reason: "Again"})
        return {detail, noReason, completed, again, status: statusOf(state.requestId)}
    },
    then(r) {
        r.detail.errors == ""
        r.detail.output.includes("Complete request")
        r.noReason.errors.includes("REASON_REQUIRED")
        r.completed.errors == ""
        r.status == "ReqCompleted"
        r.again.errors.includes("REQUEST_CLOSED")
    }
})
