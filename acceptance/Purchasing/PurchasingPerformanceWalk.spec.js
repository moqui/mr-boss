// Purchasing P15's "usable when" (impl-purchasing P15, §4; design §11 Scorecards, ScorecardDetail, Spend, Commitments,
// ProcurementTracker), through the screens' transitions with artifact authorization on: an evaluation of Brightline's five
// receipts scores on-time delivery against each line's first acknowledged date, else its required date, and quality from the
// rejected quantity, while Common Fasteners' two receipts are Insufficient data and blocked from nothing; a recalculation
// makes a new evaluation and keeps the earlier one, and under a response rule the supplier check warns about Brightline only;
// a purchase request followed through its approval, sourcing, purchase order, receipt and bill shows in the procurement
// tracker with the bill's payment withheld from the buyer and shown to a payables reader; Commitments counts the request's
// reservation, its order and its actual once; Spend shows committed and billed as separate measures, withheld from a reader;
// and Supplier360's Performance tab, Product360's Purchase history tab and the supplier statement render. (P17) Each report prints
// as html-print.
// Run: ./moq accept mr-boss --spec PurchasingPerformanceWalk
const lib = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const webroot = "component://webroot/screen/webroot.xml"
const rows = (entity, key) => system(() => Array.from(ec.entity.find(entity).condition(key).list()))
const one = (entity, key) => rows(entity, key)[0]
const R = "mantle.request.RequestServices.",
    P = "mantle.order.PurchaseServices.",
    B = "mantle.other.BudgetServices.",
    RS = "ironstone.purchasing.ReportServices."
const dayMs = 86400000
const at = days => new Date(Number(ec.user.nowTimestamp) + days * dayMs)
const state = {name: "Walk performance supplies " + Date.now()}
// Brightline's billed spend as Spend shows it to the buyer
const billedSpend = () =>
    asUser(
        users.buyer,
        () => invoke(RS + "get#PurchaseSpend", {supplierPartyId: ids.supplierId, groupBy: "supplier"}).answer.spendRows[0]?.billed
    ) ?? "0"
// a transition of a Purchasing screen as the user posts it: its status and errors
function post(user, path, parameters) {
    return asUser(user, () => {
        const rendered = ec.screen
            .makeTest()
            .rootScreen(webroot)
            .render("apps/Purchasing/" + path, parameters, "post")
        const result = {status: rendered.status, errors: Array.from(rendered.errorMessages || []).join(" | ")}
        ec.message.clearErrors()
        return result
    })
}
// an approved purchase order of Retail's from the supplier for ten of DEMO_1_1 at 10.00 required on a day, received now
// (accepted and rejected as given), as billFixture makes one
function receivedOrder(vendorPartyId, requiredDays, rejected = 0, firstPromiseDays = null, laterPromiseDays = null) {
    return system(() => {
        login("john.doe")
        ec.artifactExecution.disableAuthz()
        const order = invoke("mantle.order.OrderServices.create#Order", {
            customerPartyId: ids.organizationId,
            vendorPartyId,
            currencyUomId: "USD",
            facilityId: ids.facilityId,
            orderName: "Performance walk"
        })
        const orderItemSeqId = invoke("mantle.order.OrderServices.add#OrderProductQuantity", {
            orderId: order.orderId,
            orderPartSeqId: order.orderPartSeqId,
            productId: "DEMO_1_1",
            quantity: 10,
            unitAmount: 10,
            itemTypeEnumId: "ItemInventory"
        }).orderItemSeqId
        invoke("update#mantle.order.OrderItem", {orderId: order.orderId, orderItemSeqId, requiredByDate: at(requiredDays)})
        invoke("mantle.order.OrderServices.place#Order", {orderId: order.orderId})
        invoke("mantle.order.OrderServices.approve#Order", {orderId: order.orderId})
        // the supplier's acknowledged date, as record#Acknowledgement writes it (OrderItem.promisedDate is audit-logged), and a
        // later promise
        if (firstPromiseDays != null)
            invoke("update#mantle.order.OrderItem", {orderId: order.orderId, orderItemSeqId, promisedDate: at(firstPromiseDays)})
        if (laterPromiseDays != null)
            invoke("update#mantle.order.OrderItem", {orderId: order.orderId, orderItemSeqId, promisedDate: at(laterPromiseDays)})
        receive(order.orderId, order.orderPartSeqId, 10 - rejected, rejected)
        return order.orderId
    })
}
function receive(orderId, orderPartSeqId, accepted, rejected = 0) {
    const shipment = invoke("mantle.shipment.ShipmentServices.create#OrderPartShipment", {
        orderId,
        orderPartSeqId,
        destinationFacilityId: ids.facilityId
    })
    invoke("mantle.shipment.ShipmentServices.receive#ShipmentProduct", {
        shipmentId: shipment.shipmentId,
        productId: "DEMO_1_1",
        quantityAccepted: accepted,
        quantityRejected: rejected,
        facilityId: ids.facilityId
    })
    return shipment.shipmentId
}
const latestScorecard = supplierPartyId =>
    system(
        () =>
            Array.from(
                ec.entity
                    .find("mantle.party.supplier.SupplierScorecard")
                    .condition({organizationPartyId: ids.organizationId, supplierPartyId})
                    .orderBy("-evaluatedDate")
                    .limit(1)
                    .list()
            )[0]
    )
const check = supplierPartyId =>
    asUser(
        users.buyer,
        () => invoke(P + "check#SupplierUsable", {organizationPartyId: ids.organizationId, supplierPartyId}),
        false
    )

spec({
    stepwise: true,
    setupSpec() {
        // an approved budget of Retail's on DEMO_1_1's account, and john.doe a financial reader, as the requests walk
        login("john.doe")
        system(() => {
            if (!one("moqui.security.UserGroup", {userGroupId: "BOSS_PUR_WALK_BUDGET"})) {
                invoke("create#moqui.security.UserGroup", {userGroupId: "BOSS_PUR_WALK_BUDGET", description: "Walk budget"})
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
            if (!one("mantle.product.ProductPrice", {productPriceId: "BOSS_PUR_WALK_PERF_PRICE"}))
                invoke("create#mantle.product.ProductPrice", {
                    productPriceId: "BOSS_PUR_WALK_PERF_PRICE",
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
            state.budgetId = invoke(B + "create#Budget", {timePeriodId: yearId, description: "Performance walk budget"}).budgetId
            invoke(B + "store#BudgetItem", {budgetId: state.budgetId, glAccountId: state.account, amount: 1000000})
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

feature(
    "an evaluation scores on-time delivery from the first acknowledged date, else the required date, and quality from rejections; two receipts are Insufficient data and blocked from nothing",
    {
        when() {
            // Brightline: late against the required date; on time; on time against the required date but late against the
            // first acknowledged date (a later promise does not move it); late against the required date but on time
            // against the acknowledged one; on time with one of ten rejected
            receivedOrder(ids.supplierId, -1)
            receivedOrder(ids.supplierId, 2)
            receivedOrder(ids.supplierId, 2, 0, -1, 7)
            receivedOrder(ids.supplierId, -1, 0, 2)
            receivedOrder(ids.supplierId, 2, 1)
            // Common Fasteners: two on time
            receivedOrder(ids.commonSupplierId, 2)
            receivedOrder(ids.commonSupplierId, 2)
            const evaluate = supplierPartyId =>
                post(users.buyer, "Performance/Scorecards/evaluateSuppliers", {
                    evaluateOrganizationPartyId: ids.organizationId,
                    evaluateSupplierPartyId: supplierPartyId
                })
            const scored = evaluate(ids.supplierId)
            const insufficient = evaluate(ids.commonSupplierId)
            const reader = post(users.read, "Performance/Scorecards/evaluateSuppliers", {
                evaluateOrganizationPartyId: ids.organizationId,
                evaluateSupplierPartyId: ids.supplierId
            })
            state.scorecard = latestScorecard(ids.supplierId)
            const measure = metricEnumId =>
                one("mantle.party.supplier.SupplierScorecardMeasure", {
                    supplierScorecardId: state.scorecard.supplierScorecardId,
                    metricEnumId
                })
            const detail = asUser(users.read, () =>
                page("Performance/ScorecardDetail", {supplierScorecardId: state.scorecard.supplierScorecardId}, "html")
            )
            const list = asUser(users.read, () => page("Performance/Scorecards", {}, "html"))
            return {
                scored,
                insufficient,
                reader,
                onTime: measure("SsmOnTime"),
                quality: measure("SsmQuality"),
                common: latestScorecard(ids.commonSupplierId),
                detail,
                list,
                commonCheck: check(ids.commonSupplierId)
            }
        },
        then(r) {
            r.scored.errors == ""
            r.insufficient.errors == ""
            r.reader.errors != ""
            state.scorecard.resultEnumId == "SsrScored"
            state.scorecard.eligibleCount == 5
            // on time: the second, fourth and fifth: 30 of 50
            r.onTime.numerator.compare(30) == 0
            r.onTime.denominator.compare(50) == 0
            // one of fifty rejected
            r.quality.numerator.compare(49) == 0
            r.quality.denominator.compare(50) == 0
            r.common.resultEnumId == "SsrInsufficient"
            r.common.effectEnumId == null
            // no response from its evaluation (any other warning is the buying policy's approval rule)
            r.commonCheck.result != "STOP"
            !String(r.commonCheck.message || "").includes("scored")
            r.detail.errors == []
            r.detail.output.includes("First acknowledged")
            r.detail.output.includes("Late: received")
            r.list.errors == []
            r.list.output.includes("Insufficient data")
        }
    }
)

feature(
    "a recalculation makes a new evaluation and keeps the earlier one; under a response rule only the scored supplier is warned",
    {
        when() {
            const rule = post(users.admin, "Settings/ScorecardPolicies/storeAction", {
                organizationPartyId: ids.organizationId,
                scoreBelow: "100",
                effectEnumId: "SseWarn",
                changeReason: "Walk: warn on every scored supplier"
            })
            const recalculated = post(users.buyer, "Performance/ScorecardDetail/recalculate", {
                supplierScorecardId: state.scorecard.supplierScorecardId
            })
            const latest = latestScorecard(ids.supplierId)
            const warned = check(ids.supplierId)
            const insufficient = check(ids.commonSupplierId)
            // the rule ends, so the walk's later orders are not warned
            const actionId = rows("mantle.party.supplier.SupplierScorecardAction", {
                organizationPartyId: ids.organizationId
            }).find(row => row.thruDate == null)?.scorecardActionId
            const ended = post(users.admin, "Settings/ScorecardPolicies/storeAction", {
                organizationPartyId: ids.organizationId,
                scorecardActionId: actionId,
                end: "Y",
                changeReason: "Walk done"
            })
            return {
                rule,
                recalculated,
                latest,
                earlier: one("mantle.party.supplier.SupplierScorecard", {
                    supplierScorecardId: state.scorecard.supplierScorecardId
                }),
                warned,
                insufficient,
                ended,
                after: check(ids.supplierId)
            }
        },
        then(r) {
            r.rule.errors == ""
            r.recalculated.errors == ""
            r.latest.supplierScorecardId != state.scorecard.supplierScorecardId
            r.latest.previousScorecardId == state.scorecard.supplierScorecardId
            r.latest.effectEnumId == "SseWarn"
            r.earlier != null
            r.warned.result == "WARN"
            r.warned.message.includes("scored")
            !String(r.insufficient.message || "").includes("scored")
            r.ended.errors == ""
            !String(r.after.message || "").includes("scored")
        }
    }
)

feature("a purchase request followed to its order, receipt and bill shows in the tracker, the payment withheld from a buyer", {
    when() {
        post(users.requester, "NewPurchaseRequest/createRequest", {
            organizationPartyId: ids.organizationId,
            requestName: state.name,
            facilityId: ids.facilityId,
            responseRequiredDate: "2026-12-15"
        })
        state.requestId = rows("mantle.request.Request", {requestName: state.name})[0]?.requestId
        post(users.requester, "Requests/RequestDetail/storePurchaseRequestItem", {
            requestId: state.requestId,
            productId: "DEMO_1_1",
            supplierPartyId: ids.supplierId,
            quantity: "10",
            maximumAmount: "150"
        })
        post(users.requester, "Requests/RequestDetail/submitPurchaseRequest", {requestId: state.requestId})
        post(users.approve, "Requests/RequestDetail/decidePurchaseRequest", {requestId: state.requestId, decision: "approve"})
        asUser(
            users.buyer,
            () => invoke(R + "convert#PurchaseSourcing", {requestId: state.requestId, operationKey: "perf-walk-" + Date.now()}),
            false
        )
        state.orderId = rows("mantle.request.RequestItemOrder", {requestId: state.requestId})[0]?.orderId
        asUser(users.buyer, () => invoke(P + "place#PurchaseOrder", {orderId: state.orderId}), false)
        const revision = Number(one("mantle.order.OrderHeader", {orderId: state.orderId}).orderRevision)
        asUser(
            users.approve,
            () =>
                invoke(P + "decide#PurchaseApproval", {
                    orderId: state.orderId,
                    orderRevision: revision,
                    operationKey: "perf-walk-po-" + Date.now()
                }),
            false
        )
        system(() => {
            login("john.doe")
            ec.artifactExecution.disableAuthz()
            receive(state.orderId, one("mantle.order.OrderPart", {orderId: state.orderId}).orderPartSeqId, 10)
        })
        // Brightline's billed spend before the walk's bill: the earlier specs in a shared database bill it too
        state.billedBefore = billedSpend()
        state.invoiceId = asUser(
            users.buyer,
            () =>
                invoke("mantle.account.InvoiceServices.import#Bill", {
                    organizationPartyId: ids.organizationId,
                    supplierPartyId: ids.supplierId,
                    referenceNumber: "PERF-WALK-" + Date.now(),
                    orderId: state.orderId
                }).invoiceId,
            false
        )
        system(() =>
            invoke("mantle.account.InvoiceServices.create#InvoiceItem", {
                invoiceId: state.invoiceId,
                itemTypeEnumId: "ItemInventory",
                productId: "DEMO_1_1",
                quantity: 10,
                amount: "11"
            })
        )
        const lineSeq = one("mantle.order.OrderItem", {orderId: state.orderId}).orderItemSeqId
        system(() =>
            invoke("create#mantle.order.OrderItemBilling", {
                orderId: state.orderId,
                orderItemSeqId: lineSeq,
                invoiceId: state.invoiceId,
                invoiceItemSeqId: rows("mantle.account.invoice.InvoiceItem", {invoiceId: state.invoiceId}).find(
                    row => row.productId == "DEMO_1_1"
                ).invoiceItemSeqId,
                quantity: 10,
                amount: 110
            })
        )
        const buyer = post(users.buyer, "Performance/ProcurementTracker", {requestId: state.requestId})
        const buyerAnswer = asUser(users.buyer, () => invoke(RS + "get#ProcurementTracker", {requestId: state.requestId}).answer)
        const matchAnswer = asUser(
            users.buyMatch,
            () => invoke(RS + "get#ProcurementTracker", {requestId: state.requestId}).answer
        )
        const view = asUser(users.buyer, () => page("Performance/ProcurementTracker", {requestId: state.requestId}, "html"))
        return {buyer, buyerAnswer, matchAnswer, view}
    },
    then(r) {
        !!state.requestId
        !!state.orderId
        !!state.invoiceId
        r.buyerAnswer.trackerRows.length == 1
        r.buyerAnswer.trackerRows[0].requestText.includes(state.requestId)
        r.buyerAnswer.trackerRows[0].orderText.includes(state.orderId)
        r.buyerAnswer.trackerRows[0].receiptText.startsWith("10 in 1 receipt")
        r.buyerAnswer.trackerRows[0].billText.includes(state.invoiceId)
        r.buyerAnswer.trackerRows[0].paymentText == "Withheld"
        r.matchAnswer.trackerRows[0].paymentText.startsWith(state.invoiceId + ": Not paid")
        r.view.errors == []
        r.view.output.includes("Withheld")
    }
})

feature("Commitments counts the request's reservation, its order and its actual once; a buyer sees them withheld", {
    when() {
        // the bill's actual, as Accounting's approval converts the order line's commitment
        const orderCommitment = rows("mantle.other.budget.BudgetCommitment", {
            sourceId: state.orderId,
            stageEnumId: "BcsOrder"
        })[0]
        system(() =>
            invoke(B + "convert#Commitment", {
                organizationPartyId: ids.organizationId,
                fromCommitmentId: orderCommitment.budgetCommitmentId,
                sourceEntityName: "mantle.account.invoice.Invoice",
                sourceId: state.invoiceId,
                sourceItemId: "01",
                sourceRevision: "1",
                stageEnumId: "BcsExpense",
                amount: 110,
                currencyUomId: "USD"
            })
        )
        const options = {organizationPartyId: ids.organizationId, supplierPartyId: ids.supplierId, view: "all"}
        const finance = asUser("john.doe", () => invoke(RS + "get#PurchaseCommitments", options).answer)
        const buyer = asUser(users.buyer, () => invoke(RS + "get#PurchaseCommitments", options).answer)
        const mine = row => [state.requestId, state.orderId, state.invoiceId].some(id => row.sourceText.includes(id))
        return {orderCommitment, finance, buyer, rowsOfWalk: finance.commitmentRows.filter(mine)}
    },
    then(r) {
        r.orderCommitment != null
        // the request reserved 150, its order converted 110 and the bill's actual took the order's: 40 still reserved, nothing
        // open on the order and 110 actual, 150 in all, counted once
        r.rowsOfWalk.length == 3
        r.rowsOfWalk.find(row => row.stageEnumId == "BcsRequest").openAmount == "40.00"
        r.rowsOfWalk.find(row => row.stageEnumId == "BcsOrder").openAmount == "0.00"
        r.rowsOfWalk.find(row => row.stageEnumId == "BcsExpense").actualAmount == "110.00"
        r.buyer.commitmentRows.every(row => row.openText == "Withheld")
    }
})

feature("Spend shows committed and billed as separate measures, withheld from a reader", {
    when() {
        const options = {supplierPartyId: ids.supplierId, groupBy: "supplier"}
        const buyer = asUser(users.buyer, () => invoke(RS + "get#PurchaseSpend", options).answer)
        const reader = asUser(users.read, () => invoke(RS + "get#PurchaseSpend", options).answer)
        const view = asUser(users.buyer, () => page("Performance/Spend", options, "html"))
        const home = asUser(users.buyer, () => page("Home", {}, "html"))
        return {buyer, reader, view, home}
    },
    then(r) {
        r.buyer.spendRows.length == 1
        // the walk's five orders of 100.00 and the request's 110.00 committed (with any other order of the period); the one
        // bill of 110.00 billed (over what was billed before it): two measures, never one total
        toDecimal(r.buyer.spendRows[0].committed).compare(toDecimal("610.00")) >= 0
        toDecimal(r.buyer.spendRows[0].billed).subtract(toDecimal(state.billedBefore)).compare(toDecimal("110.00")) == 0
        r.buyer.spendRows[0].total == null
        r.reader.spendRows[0].committedText == "Withheld"
        r.reader.spendRows[0].billedText == "Withheld"
        r.view.errors == []
        r.view.output.includes("Committed")
        r.view.output.includes("Billed")
        r.home.errors == []
        r.home.output.includes("Committed and billed, last three months")
    }
})

feature("Supplier360's Performance tab, Product360's Purchase history tab, the statement and the scorecard policies render", {
    when() {
        const supplier = asUser(users.read, () =>
            page("Suppliers/Supplier360/PurchasingPerformance", {vendorPartyId: ids.supplierId}, "html")
        )
        const product = asUser(users.buyer, () => page("Products/Product360/PurchaseHistory", {productId: "DEMO_1_1"}, "html"))
        const statement = asUser(users.buyMatch, () =>
            page("Performance/SupplierStatement", {supplierPartyId: ids.supplierId}, "html")
        )
        const buyerStatement = asUser(users.buyer, () =>
            page("Performance/SupplierStatement", {supplierPartyId: ids.supplierId}, "html")
        )
        const history = asUser(users.read, () => page("Performance/PurchaseHistory", {productId: "DEMO_1_1"}, "html"))
        const policies = asUser(users.admin, () => page("Settings/ScorecardPolicies", {}, "html"))
        return {supplier, product, statement, buyerStatement, history, policies}
    },
    then(r) {
        r.supplier.errors == []
        r.supplier.output.includes("Latest evaluation")
        r.supplier.output.includes("On-time delivery")
        r.product.errors == []
        r.product.output.includes("Ordered")
        r.statement.errors == []
        r.statement.output.includes("Closing")
        r.buyerStatement.output.includes("needs finance read")
        r.history.errors == []
        r.history.output.includes("Withheld")
        r.policies.errors == []
        r.policies.output.includes("Response rules")
    }
})

// P17 (design §15): each report has a Print link, and prints as html-print with its snapshot and filters
feature("each report prints as html-print with its snapshot and filters", {
    when() {
        const reports = [
            ["Performance/Scorecards", {}],
            ["Performance/Spend", {}],
            ["Performance/Commitments", {}],
            ["Performance/ProcurementTracker", {requestId: ids.requestId}],
            ["Performance/PurchaseHistory", {productId: "DEMO_1_1"}],
            ["Performance/SupplierStatement", {supplierPartyId: ids.supplierId}]
        ]
        const problems = []
        for (const [path, parameters] of reports) {
            const screen = asUser(users.buyMatch, () => page(path, parameters, "html"))
            if (!screen.output.includes(">Print<") && !screen.output.includes("Print</")) problems.push(`${path}: no Print link`)
            const printed = asUser(users.buyMatch, () =>
                page(path, Object.assign({lastStandalone: "true", pageNoLimit: "true"}, parameters), "html-print")
            )
            if (printed.status != 200 || printed.errors.length || !printed.output.includes("As of "))
                problems.push(`${path}: ${printed.status} ${printed.errors}`)
        }
        if (problems.length) log.warn("Report prints:\n" + problems.join("\n"))
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})
