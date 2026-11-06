// Customer Service P9's "usable when" (impl-customer-service P9; design §10 case to RMA to credit), as an acceptance walk through
// the Customer Service screens' transitions with artifact authorization on: from Joe Q Public's thermostat case an agent
// requests an RMA for three filters of a delivered sale (NewReturn under Retail's policy); the return authorizer authorizes it,
// which makes the return shipment and no credit or replacement; Issue return label returns the test carrier's label and a retry
// answers the same label; the agent who borrows Warehouse's receive and inspect groups (W) receives one unit with a second
// rejected at the dock, then the last unit in a second box; inspection releases one unit and scraps another; the return
// authorizer who borrows Accounting's receivables group (F) credits only what was received, and a second credit beyond it is
// refused; a receiptless credit needs RETURN_CREDIT_APPROVE; two drafts cannot together return more than was shipped; the
// agent alone reads the receipt, disposition and settlement with no action. Retail settles its returns through settle#Return
// for this walk (Accounting's flag, restored after). The rules are Mantle's ReturnPolicies, WarehouseReturns and
// AccountingReturns specs. Run: ./moq accept mr-boss --spec CustomerServiceReturnsWalk
const lib = ec.resource.script("component://mr-boss/test/CustomerService/CustomerServiceSpecLib.js")
const {ids, users, asUser, system, invoke, refusal} = lib
const webroot = "component://webroot/screen/webroot.xml"
const R = "ironstone.customerservice.ReturnServices."
const P = "mantle.order.ReturnPolicyServices."
const Q = "mantle.product.QualityServices."
const rows = (entity, conditions) => system(() => Array.from(ec.entity.find(entity).condition(conditions).list()))
const one = (entity, conditions) => rows(entity, conditions)[0] || null
const state = {returnIds: []}
let keySeq = 0
const key = () => "CSRW-" + ec.user.randomString(8) + "-" + ++keySeq
// a transition of a Customer Service screen as the user posts it
function post(user, path, parameters) {
    return asUser(user, () => {
        const rendered = ec.screen
            .makeTest()
            .rootScreen(webroot)
            .render("apps/CustomerService/" + path, parameters, "post")
        const result = {status: rendered.status, errors: Array.from(rendered.errorMessages || []).join(" | ")}
        ec.message.clearErrors()
        return result
    })
}
const detail = (user, returnId) =>
    asUser(user, () => invoke(R + "get#ReturnDetail", {appRoot: "CustomerService", returnId}), false)
const header = returnId => one("mantle.order.return.ReturnHeader", {returnId})
const itemOf = returnId => rows("mantle.order.return.ReturnItem", {returnId}).find(row => !row.parentItemSeqId)

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        system(() => {
            // Retail settles its returns through settle#Return for the walk (restored in cleanupSpec)
            const preference = ec.entity
                .find("mantle.ledger.config.PartyAcctgPreference")
                .condition("organizationPartyId", ids.organizationId)
                .one()
            state.flagBefore = preference?.returnSettlementRequired || "N"
            // Retail inherits its preferences from Corporate: a row made here is removed in cleanupSpec, so Retail inherits
            // again (the walks after this one, Purchasing's, read its currency and Corporate's flags through it)
            state.preferenceMade = !preference
            if (state.flagBefore !== "Y")
                invoke("mantle.ledger.SetupServices.store#Preferences", {
                    organizationPartyId: ids.organizationId,
                    settings: {returnSettlementRequired: "Y"},
                    changeReason: "Customer Service returns walk",
                    lastUpdatedStamp: preference?.lastUpdatedStamp || null
                })
            // a delivered sale of three filters to Joe Q Public
            const order = invoke("mantle.order.OrderServices.create#Order", {
                vendorPartyId: ids.organizationId,
                customerPartyId: ids.customerId,
                facilityId: "ZIRET_WH",
                productStoreId: "POPC_DEFAULT",
                currencyUomId: "USD"
            })
            invoke("mantle.order.OrderServices.add#OrderProductQuantity", {
                orderId: order.orderId,
                orderPartSeqId: order.orderPartSeqId,
                productId: ids.filterProductId,
                quantity: 3,
                unitAmount: 15
            })
            invoke("mantle.order.OrderServices.place#Order", {orderId: order.orderId})
            invoke("mantle.order.OrderServices.approve#Order", {orderId: order.orderId})
            const shipped = invoke("mantle.shipment.ShipmentServices.ship#OrderPart", {
                orderId: order.orderId,
                orderPartSeqId: "01"
            })
            invoke("mantle.shipment.ShipmentServices.deliver#Shipment", {shipmentId: shipped.shipmentId})
            state.orderId = order.orderId
            state.filterLine = ec.entity
                .find("mantle.order.OrderItem")
                .condition({orderId: order.orderId, productId: ids.filterProductId})
                .one().orderItemSeqId
            // the W agent disposes too, for this walk (Warehouse's quality-manager grant)
            invoke("create#moqui.security.UserGroupMember", {
                userGroupId: "BOSS_WAREHOUSE_QUALITY_MANAGER",
                userId: "BOSS_CS_AGENT_WH",
                fromDate: ec.user.nowTimestamp
            })
        })
    },
    cleanupSpec() {
        login("john.doe")
        // each step on its own, Retail's flag first: a failure in one leaves the others done
        const step = (name, action) => {
            try {
                system(action)
            } catch (error) {
                ec.logger.error("Returns walk cleanup, " + name + ": " + error.message)
            }
            ec.message.clearErrors()
        }
        step("Retail's returnSettlementRequired", () => {
            if (state.preferenceMade) {
                invoke("delete#mantle.ledger.config.PartyAcctgPreference", {organizationPartyId: ids.organizationId})
                return
            }
            if (!state.flagBefore || state.flagBefore === "Y") return
            const preference = ec.entity
                .find("mantle.ledger.config.PartyAcctgPreference")
                .condition("organizationPartyId", ids.organizationId)
                .one()
            if ((preference?.returnSettlementRequired || "N") === state.flagBefore) return
            invoke("mantle.ledger.SetupServices.store#Preferences", {
                organizationPartyId: ids.organizationId,
                settings: {returnSettlementRequired: state.flagBefore},
                changeReason: "Customer Service returns walk done",
                lastUpdatedStamp: preference?.lastUpdatedStamp || null
            })
        })
        // the walk's returns that have no effect yet (a received or credited one stays, refused quietly)
        step("the returns", () => {
            for (const returnId of state.returnIds) refusal(P + "cancel#CustomerReturn", {returnId, reason: "Walk cleanup"})
        })
        step("the quality-manager grant", () => {
            for (const row of Array.from(
                ec.entity
                    .find("moqui.security.UserGroupMember")
                    .condition({userGroupId: "BOSS_WAREHOUSE_QUALITY_MANAGER", userId: "BOSS_CS_AGENT_WH"})
                    .list()
            ))
                if (!row.thruDate) {
                    row.set("thruDate", ec.user.nowTimestamp)
                    row.update()
                }
        })
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("from the case the agent requests an RMA for the three filters under Retail's policy", {
    when() {
        const linesText = JSON.stringify([
            {
                orderItemSeqId: state.filterLine,
                quantity: "3",
                returnReasonEnumId: "RrsnDefective",
                returnResponseEnumId: "RrspCredit"
            }
        ])
        const before = new Set(rows("mantle.order.return.ReturnItem", {orderId: state.orderId}).map(row => row.returnId))
        const submitted = post(users.agent, "Returns/NewReturn/submitReturn", {
            orderId: state.orderId,
            requestId: ids.thermostatCaseId,
            linesText,
            operationKey: key(),
            customerReference: "JQP-WALK-RMA",
            carrierPartyId: "TEST_CARRIER",
            shipmentMethodEnumId: "ShMthGround"
        })
        const made = rows("mantle.order.return.ReturnItem", {orderId: state.orderId}).find(row => !before.has(row.returnId))
        state.returnId = made?.returnId
        if (state.returnId) state.returnIds.push(state.returnId)
        const link = rows("mantle.request.RequestRecord", {
            requestId: ids.thermostatCaseId,
            recordEntityName: "mantle.order.return.ReturnHeader",
            recordId: state.returnId || "_NA_"
        })
        return {submitted, returnHeader: header(state.returnId), link}
    },
    then({submitted, returnHeader, link}) {
        submitted.errors == ""
        returnHeader.statusId == "ReturnRequested"
        returnHeader.returnPolicyId == ids.returnPolicyId
        returnHeader.customerReference == "JQP-WALK-RMA"
        link.length == 1
    }
})

feature("authorizing it makes the return shipment and no credit or replacement; the label, and a retry answers it", {
    when() {
        const revision = detail(users.returns, state.returnId).rh.sourceRevision
        const agent = post(users.agent, "Returns/ReturnDetail/csAuthorizeReturn", {returnId: state.returnId, operationKey: key()})
        const authorized = post(users.returns, "Returns/ReturnDetail/csAuthorizeReturn", {
            returnId: state.returnId,
            sourceRevision: revision,
            operationKey: key()
        })
        // the test carrier's gateway on the return shipment's route segment (a customer return shipment has no store and comes
        // from the customer, so no store or organization gateway applies to it: F-P9-4)
        system(() => {
            const shipmentId = rows("mantle.shipment.ShipmentItemSource", {returnId: state.returnId})[0]?.shipmentId
            for (const segment of rows("mantle.shipment.ShipmentRouteSegment", {shipmentId: shipmentId || "_NA_"}))
                invoke("update#mantle.shipment.ShipmentRouteSegment", {
                    shipmentId,
                    shipmentRouteSegmentSeqId: segment.shipmentRouteSegmentSeqId,
                    shippingGatewayConfigId: "TEST_SHIPPING"
                })
        })
        const labelKey = "label-" + state.returnId
        const label = post(users.returns, "Returns/ReturnDetail/csIssueLabel", {
            returnId: state.returnId,
            operationKey: labelKey,
            weight: "2",
            weightUomId: "WT_lb"
        })
        const labelled = rows("mantle.shipment.ShipmentPackageRouteSeg", {
            shipmentId: detail(users.returns, state.returnId).rh.openShipmentId
        })
        const labels = () => rows("mantle.shipment.carrier.TestCarrierLabel", {}).length
        const labelCount = labels()
        // a retry with the operation key answers the same label and buys no second one
        const retry = post(users.returns, "Returns/ReturnDetail/csIssueLabel", {
            returnId: state.returnId,
            operationKey: labelKey,
            weight: "2",
            weightUomId: "WT_lb"
        })
        const relabelled = rows("mantle.shipment.ShipmentPackageRouteSeg", {shipmentId: labelled[0]?.shipmentId || "_NA_"})
        const retryLabels = labels() - labelCount
        return {
            agent,
            authorized,
            label,
            labelled,
            retry,
            relabelled,
            retryLabels,
            returnHeader: header(state.returnId),
            item: itemOf(state.returnId),
            billings: rows("mantle.order.return.ReturnItemBilling", {returnId: state.returnId}).length,
            rma: rows("mantle.order.return.ReturnContent", {returnId: state.returnId, contentTypeEnumId: "RtcntAuthorization"})
                .length
        }
    },
    then({agent, authorized, label, labelled, retry, relabelled, retryLabels, returnHeader, item, billings, rma}) {
        agent.errors.includes("PERMISSION_DENIED")
        authorized.errors == ""
        returnHeader.statusId == "ReturnApproved"
        item.responseImmediate == "N"
        !item.replacementOrderId
        billings == 0
        rma == 1
        label.errors == ""
        labelled.some(row => row.trackingCode)
        retry.errors == ""
        retryLabels == 0
        relabelled.find(row => row.trackingCode).trackingCode == labelled.find(row => row.trackingCode).trackingCode
    }
})

feature("the W agent receives one unit and a second rejected at the dock, then the last unit in a second box", {
    when() {
        const shipmentId = detail(users.agentWarehouse, state.returnId).rh.openShipmentId
        const seq = itemOf(state.returnId).returnItemSeqId
        const agentOnly = post(users.agent, "Returns/ReturnDetail/csReceiveReturn", {
            returnId: state.returnId,
            returnItemSeqId: seq,
            shipmentId,
            operationKey: key(),
            quantityAccepted: 1
        })
        const box1 = post(users.agentWarehouse, "Returns/ReturnDetail/csReceiveReturn", {
            returnId: state.returnId,
            returnItemSeqId: seq,
            shipmentId,
            operationKey: key(),
            quantityAccepted: 1,
            quantityRejected: 1,
            rejectionReasonEnumId: "ArjDamaged"
        })
        const afterBox1 = itemOf(state.returnId)
        // F credits only what was received so far, and no more
        const finance = detail(users.returnsReceivables, state.returnId)
        const settled = post(users.returnsReceivables, "Returns/ReturnDetail/csSettleReturn", {
            returnId: state.returnId,
            previewVersion: finance.settlement.previewVersion,
            operationKey: key()
        })
        const beyond = asUser(
            users.returnsReceivables,
            () =>
                refusal("mantle.order.ReturnServices.preview#ReturnSettlement", {
                    returnId: state.returnId,
                    lineList: [{returnItemSeqId: seq, quantity: 1}]
                }),
            false
        )
        const box2 = post(users.agentWarehouse, "Returns/ReturnDetail/csReceiveReturn", {
            returnId: state.returnId,
            returnItemSeqId: seq,
            shipmentId,
            operationKey: key(),
            quantityAccepted: 1
        })
        state.inspections = rows("mantle.product.quality.QualityInspection", {returnId: state.returnId}).map(
            row => row.qualityInspectionId
        )
        return {
            agentOnly,
            box1,
            afterBox1,
            settled,
            beyond,
            box2,
            billed: rows("mantle.order.return.ReturnItemBilling", {returnId: state.returnId}).reduce(
                (total, row) => total + Number(String(row.quantity ?? 0)),
                0
            ),
            afterBox2: itemOf(state.returnId)
        }
    },
    then({agentOnly, box1, afterBox1, settled, beyond, box2, billed, afterBox2}) {
        agentOnly.errors.includes("PERMISSION_DENIED")
        box1.errors == ""
        Number(String(afterBox1.receivedQuantity)) == 2
        settled.errors == ""
        billed == 2
        beyond.includes("CREDIT_CAP_EXCEEDED")
        box2.errors == ""
        Number(String(afterBox2.receivedQuantity)) == 3
        state.inspections.length == 2
    }
})

feature("inspection releases one unit and scraps the other; the agent alone reads them with no action", {
    when() {
        const [first, second] = state.inspections
        const submit = (qualityInspectionId, accepted, rejected) =>
            post(users.agentWarehouse, "Returns/QualityInspection/submitInspection", {
                qualityInspectionId,
                quantityAccepted: accepted,
                quantityRejected: rejected,
                resultReason: rejected ? "Cracked housing" : null
            })
        const verify = qualityInspectionId =>
            asUser("warehouse.quality", () => refusal(Q + "verify#Inspection", {qualityInspectionId}), false)
        const submitted = [submit(first, 1, 0), submit(second, 0, 1)]
        const verified = [verify(first), verify(second)]
        const released = post(users.agentWarehouse, "Returns/QualityInspection/disposeInspection", {
            qualityInspectionId: first,
            operationKey: key(),
            dispositionEnumId: "QdRelease",
            quantity: 1
        })
        const scrapped = post(users.agentWarehouse, "Returns/QualityInspection/disposeInspection", {
            qualityInspectionId: second,
            operationKey: key(),
            dispositionEnumId: "QdScrap",
            quantity: 1,
            toLocationSeqId: "0991"
        })
        const agentView = asUser(
            users.agent,
            () => invoke(R + "get#InspectionDetail", {appRoot: "CustomerService", qualityInspectionId: first}),
            false
        )
        const agentDetail = detail(users.agent, state.returnId)
        return {
            submitted,
            verified,
            released,
            scrapped,
            agentView,
            agentDetail,
            dispositions: rows("mantle.product.quality.QualityInspectionDisposition", {qualityInspectionId: first})
        }
    },
    then({submitted, verified, released, scrapped, agentView, agentDetail, dispositions}) {
        submitted.every(row => row.errors == "")
        verified.every(message => message == "")
        released.errors == ""
        scrapped.errors == ""
        dispositions.some(row => row.dispositionEnumId == "QdRelease")
        agentView.recordFound
        !agentView.actions.canDispose && !agentView.actions.canSubmit
        !agentDetail.rh.canReceive && !agentDetail.rh.canSettle
        !agentDetail.settlement.reader
        agentDetail.inspectionRows.length == 2
    }
})

feature(
    "two drafts cannot together return more than was shipped; with no policy manual review; a receiptless credit needs RETURN_CREDIT_APPROVE",
    {
        when() {
            const thermostatLine = rows("mantle.order.OrderItem", {orderId: ids.deliveredOrderId}).find(
                row => row.productId === ids.serializedProductId
            ).orderItemSeqId
            const line = {
                orderItemSeqId: thermostatLine,
                quantity: 1,
                returnReasonEnumId: "RrsnDefective",
                returnResponseEnumId: "RrspCredit"
            }
            const first = asUser(
                users.agent,
                () =>
                    invoke(P + "submit#CustomerReturn", {
                        operationKey: key(),
                        orderId: ids.deliveredOrderId,
                        lineList: [line],
                        draft: true
                    }),
                false
            )
            state.returnIds.push(first.returnId)
            const second = asUser(
                users.agent,
                () =>
                    refusal(P + "submit#CustomerReturn", {
                        operationKey: key(),
                        orderId: ids.deliveredOrderId,
                        lineList: [line],
                        draft: true
                    }),
                false
            )
            asUser(users.agent, () => invoke(P + "submit#CustomerReturn", {operationKey: key(), returnId: first.returnId}), false)
            asUser(users.returns, () => invoke(P + "authorize#Return", {operationKey: key(), returnId: first.returnId}), false)
            const preview = asUser(
                users.returnsReceivables,
                () =>
                    refusal("mantle.order.ReturnServices.preview#ReturnSettlement", {
                        returnId: first.returnId,
                        receiptless: true,
                        reason: "Lost by the carrier"
                    }),
                false
            )
            const settle = asUser(
                users.returnsReceivables,
                () => {
                    const previewed =
                        ec.service
                            .sync()
                            .name("mantle.order.ReturnServices.preview#ReturnSettlement")
                            .parameters({returnId: first.returnId, receiptless: true, reason: "Lost by the carrier"})
                            .call() || {}
                    ec.message.clearErrors()
                    return refusal("mantle.order.ReturnServices.settle#Return", {
                        returnId: first.returnId,
                        receiptless: true,
                        reason: "Lost by the carrier",
                        previewVersion: previewed.previewVersion || "none",
                        operationKey: key()
                    })
                },
                false
            )
            // with no policy in effect (before Retail's took effect) the return is a person's review
            const unpoliced = asUser(
                users.agent,
                () => invoke(P + "evaluate#ReturnPolicy", {orderId: ids.deliveredOrderId, evaluateDate: "2025-06-01 00:00:00"}),
                false
            )
            return {first, second, preview, settle, unpoliced, refused: [preview, settle].join(" ")}
        },
        then({first, second, unpoliced, refused}) {
            first.statusId == "ReturnCreated"
            second.includes("QUANTITY_EXCEEDS_ELIGIBLE")
            unpoliced.outcome == "ManualReview"
            refused.includes("FORBIDDEN") || refused.includes("RETURN_CREDIT_APPROVE")
        }
    }
)
