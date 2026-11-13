// Purchasing P6's "usable when" (impl-purchasing P6), through the screens' transitions with artifact authorization on: a
// supplier bill for 8 at a higher price, uploaded by a buyer from Bills, finds only the 7 accepted units eligible and holds on
// its price, naming the rule, and the buyers are told; the buyer who holds the match group applies the 7 and asks for the
// hold's release, and finance releases it and approves the bill; a buyer without that group cannot apply, and no buyer can
// release a hold; a second upload with the same supplier reference is refused, naming the first; a service line's bill
// matches only after its acceptance (F30); and the legacy backfill run from Purchasing links a bill line with one
// unambiguous receipt and names one with two. Finance (AP and an approver of Retail's) are the walk's own users.
// Run: ./moq accept mr-boss --spec PurchasingBillsWalk
const lib = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, billFixture} = lib
const webroot = "component://webroot/screen/webroot.xml"
const one = (entity, key) => system(() => ec.entity.find(entity).condition(key).one())
const rows = (entity, key) => system(() => Array.from(ec.entity.find(entity).condition(key).list()))
const prefix = "BOSS_PUR_WALK_BILL"
const finance = {ap: prefix + "_AP", approver: prefix + "_FIN"}
const legacySupplier = prefix + "_LEGACY"
const serviceProduct = prefix + "_SERVICE"
const state = {}
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
function financeUser(userId, permissions) {
    invoke("create#moqui.security.UserGroup", {userGroupId: userId, description: "Purchasing bills walk " + userId})
    for (const permission of permissions)
        invoke("create#moqui.security.UserGroupPermission", {userGroupId: userId, userPermissionId: permission, fromDate: 0})
    invoke("create#mantle.party.Party", {partyId: userId, partyTypeEnumId: "PtyPerson"})
    invoke("create#mantle.party.Person", {partyId: userId, firstName: "Walk", lastName: userId})
    invoke("create#mantle.party.PartyRelationship", {
        partyRelationshipId: userId,
        relationshipTypeEnumId: "PrtAgent",
        fromPartyId: userId,
        toPartyId: ids.organizationId,
        toRoleTypeId: "OrgInternal",
        fromDate: 0
    })
    invoke("create#moqui.security.UserAccount", {
        userId,
        username: userId,
        partyId: userId,
        currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
        passwordHashType: "SHA"
    })
    invoke("create#moqui.security.UserGroupMember", {userId, userGroupId: userId, fromDate: 0})
}
// an approved purchase order of Retail's from the supplier for the product, made directly (the walk's own setup)
function approvedOrder(vendorPartyId, productId, quantity, unitAmount, itemTypeEnumId = "ItemInventory") {
    return system(() => {
        const order = invoke("mantle.order.OrderServices.create#Order", {
            customerPartyId: ids.organizationId,
            vendorPartyId,
            currencyUomId: "USD",
            facilityId: ids.facilityId
        })
        const item = invoke("mantle.order.OrderServices.add#OrderProductQuantity", {
            orderId: order.orderId,
            orderPartSeqId: order.orderPartSeqId,
            productId,
            quantity,
            unitAmount,
            itemTypeEnumId
        })
        invoke("mantle.order.OrderServices.place#Order", {orderId: order.orderId})
        invoke("mantle.order.OrderServices.approve#Order", {orderId: order.orderId})
        return {orderId: order.orderId, orderItemSeqId: item.orderItemSeqId}
    })
}
// the order's quantity received and accepted (not delivered, so no receipt bill), and its receipt
function received(orderId, productId, quantity) {
    return system(() => {
        const shipment = invoke("mantle.shipment.ShipmentServices.create#OrderPartShipment", {
            orderId,
            orderPartSeqId: "01",
            destinationFacilityId: ids.facilityId
        })
        invoke("mantle.shipment.ShipmentServices.receive#ShipmentProduct", {
            shipmentId: shipment.shipmentId,
            productId,
            quantityAccepted: quantity,
            facilityId: ids.facilityId
        })
        return Array.from(
            ec.entity.find("mantle.product.receipt.AssetReceipt").condition("shipmentId", shipment.shipmentId).list()
        )[0]
    })
}
// a supplier's bill taken in by AP with one product line
function keyedBill(supplierPartyId, reference, productId, quantity, amount, itemTypeEnumId = "ItemInventory") {
    const invoiceId = asUser(
        finance.ap,
        () =>
            invoke("mantle.account.InvoiceServices.import#Bill", {
                organizationPartyId: ids.organizationId,
                supplierPartyId,
                referenceNumber: reference
            }).invoiceId,
        false
    )
    system(() =>
        invoke("mantle.account.InvoiceServices.create#InvoiceItem", {
            invoiceId,
            itemTypeEnumId,
            productId,
            quantity,
            amount
        })
    )
    return invoiceId
}
const lineOf = invoiceId => rows("mantle.account.invoice.InvoiceItem", {invoiceId})[0].invoiceItemSeqId
const openHolds = invoiceId => rows("mantle.account.invoice.InvoiceHold", {invoiceId}).filter(row => !row.releasedDate)
const evaluate = (user, invoiceId) =>
    asUser(
        user,
        () =>
            invoke("mantle.account.InvoiceMatchServices.evaluate#InvoiceMatch", {
                invoiceId,
                organizationPartyId: ids.organizationId
            }),
        false
    )

spec({
    stepwise: true,
    setupSpec() {
        system(() => {
            financeUser(finance.ap, ["PAYABLE_EDIT", "PAYABLE_VIEW", "PAYABLE_IMPORT"])
            financeUser(finance.approver, ["ACCOUNTING_VIEW", "INVOICE_APPROVE", "INVOICE_HOLD_RELEASE"])
            invoke("create#mantle.party.Party", {
                partyId: legacySupplier,
                partyTypeEnumId: "PtyOrganization",
                ownerPartyId: ids.organizationId
            })
            invoke("create#mantle.party.Organization", {partyId: legacySupplier, organizationName: "Walk legacy supplier"})
            invoke("create#mantle.party.PartyRole", {partyId: legacySupplier, roleTypeId: "Supplier"})
            invoke("store#mantle.product.Product", {
                productId: serviceProduct,
                pseudoId: serviceProduct,
                productName: "Walk calibration service",
                productTypeEnumId: "PtService",
                amountUomId: "OTH_ea",
                ownerPartyId: ids.organizationId,
                statusId: "PrdActive"
            })
        })
        // Retail's order from Ziddleman: ten ordered at 9.00, eight received, seven accepted and one rejected
        const fixture = billFixture("Walk bills", false)
        state.orderId = fixture.orderId
        state.orderItemSeqId = fixture.orderItemSeqId
        state.assetReceiptId = fixture.assetReceiptId
        // the fixture's own bill is set aside: the walk uploads the supplier's bill from Bills
        system(() =>
            invoke("update#mantle.account.invoice.Invoice", {invoiceId: fixture.invoiceId, statusId: "InvoiceCancelled"})
        )
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("a buyer uploads a bill for 8 at a higher price; only the 7 accepted are eligible, and the match holds it on its price", {
    when() {
        state.reference = "WALK-" + Date.now()
        const upload = post(users.buyer, "Bills/BillList/uploadBill", {
            organizationPartyId: ids.organizationId,
            supplierPartyId: ids.sharedSupplierId,
            orderId: state.orderId,
            referenceNumber: state.reference,
            operationKey: "walk-bill-" + Date.now()
        })
        const bill = rows("mantle.account.invoice.Invoice", {referenceNumber: state.reference})[0]
        state.invoiceId = bill?.invoiceId
        // AP keys in the bill's line from the supplier's document
        system(() =>
            invoke("mantle.account.InvoiceServices.create#InvoiceItem", {
                invoiceId: state.invoiceId,
                itemTypeEnumId: "ItemInventory",
                productId: "DEMO_1_1",
                quantity: 8,
                amount: "9.50"
            })
        )
        const proposal = evaluate(users.buyMatch, state.invoiceId)
        return {upload, bill, proposal}
    },
    then({upload, bill, proposal}) {
        upload.errors == ""
        bill.statusId == "InvoiceIncoming"
        bill.fromPartyId == ids.sharedSupplierId
        proposal.sourceRows.length == 1
        proposal.sourceRows[0].assetReceiptId == state.assetReceiptId
        proposal.sourceRows[0].acceptedQuantity == 7
        proposal.sourceRows[0].quantity == 7
        proposal.exceptionRows.some(row => row.exceptionEnumId == "MePriceVariance" && row.holds)
    }
})

feature("a buyer without the match group cannot apply; the buyer who holds it applies the 7 and the bill is held", {
    when() {
        const allocation = {
            invoiceId: state.invoiceId,
            organizationPartyId: ids.organizationId,
            sourceKey_0: [lineOf(state.invoiceId), state.orderId, state.orderItemSeqId, state.assetReceiptId].join("|"),
            quantity_0: "7"
        }
        const buyer = post(users.buyer, "Bills/InvoiceMatch/applyMatch", allocation)
        const buyerHolds = openHolds(state.invoiceId).length
        const matcher = post(users.buyMatch, "Bills/InvoiceMatch/applyMatch", allocation)
        const holds = openHolds(state.invoiceId)
        const notices = rows("moqui.security.user.NotificationMessage", {
            topic: "PurchaseMatchException",
            recordId: state.invoiceId
        })
        const recipients = notices.flatMap(notice =>
            rows("moqui.security.user.NotificationMessageUser", {notificationMessageId: notice.notificationMessageId}).map(
                row => row.userId
            )
        )
        return {buyer, buyerHolds, matcher, holds, recipients}
    },
    then({buyer, buyerHolds, matcher, holds, recipients}) {
        buyer.errors.includes("PERMISSION_DENIED")
        buyerHolds == 0
        matcher.errors == ""
        holds.length == 1
        holds[0].holdReasonEnumId == "IhrMatchException"
        holds[0].holdComment.includes("policy")
        rows("mantle.order.OrderItemBilling", {invoiceId: state.invoiceId})[0].quantity == 7
        recipients.includes("BOSS_PUR_BUYER")
        !recipients.includes("BOSS_PUR_MATCH")
    }
})

feature("the buyer asks for the hold's release; no buyer releases it; finance releases it and approves the bill", {
    when() {
        const hold = openHolds(state.invoiceId)[0]
        const asked = post(users.buyMatch, "Bills/InvoiceDetail/billRequestRelease", {
            invoiceId: state.invoiceId,
            invoiceHoldId: hold.invoiceHoldId,
            releaseRequestNote: "The supplier credits the price difference"
        })
        const release = {invoiceHoldId: hold.invoiceHoldId, releaseComment: "Credit agreed"}
        // the release is the service's own permission (INVOICE_HOLD_RELEASE), so each call runs with artifact authorization
        // off: the buyers, the match operator and the purchase approver are refused it, finance is not
        const buyerRelease = [users.buyer, users.buyMatch, users.approve].map(user =>
            asUser(user, () => refusal("mantle.account.InvoiceServices.release#InvoiceHold", release), false)
        )
        const released = asUser(
            finance.approver,
            () => refusal("mantle.account.InvoiceServices.release#InvoiceHold", release),
            false
        )
        const approved = asUser(
            finance.approver,
            () =>
                refusal("mantle.account.InvoiceServices.approve#Payable", {
                    invoiceId: state.invoiceId,
                    lastUpdatedStamp: one("mantle.account.invoice.Invoice", {invoiceId: state.invoiceId}).lastUpdatedStamp
                }),
            false
        )
        return {
            asked,
            requested: one("mantle.account.invoice.InvoiceHold", {invoiceHoldId: hold.invoiceHoldId}),
            buyerRelease,
            released,
            approved,
            bill: one("mantle.account.invoice.Invoice", {invoiceId: state.invoiceId})
        }
    },
    then({asked, requested, buyerRelease, released, approved, bill}) {
        asked.errors == ""
        requested.releaseRequestedByUserId == "BOSS_PUR_MATCH"
        buyerRelease.every(message => message.includes("PERMISSION_DENIED"))
        released == ""
        approved == ""
        bill.statusId == "InvoiceApproved"
        openHolds(state.invoiceId).length == 0
    }
})

feature("a second upload with the same supplier reference is refused, naming the first", {
    when() {
        return {
            second: post(users.buyer, "Bills/BillList/uploadBill", {
                organizationPartyId: ids.organizationId,
                supplierPartyId: ids.sharedSupplierId,
                referenceNumber: state.reference,
                operationKey: "walk-bill-again-" + Date.now()
            })
        }
    },
    then({second}) {
        second.errors.includes("BILL_DUPLICATE")
        second.errors.includes(state.invoiceId)
        rows("mantle.account.invoice.Invoice", {referenceNumber: state.reference}).length == 1
    }
})

feature("a service line's bill matches only after its acceptance", {
    when() {
        const order = approvedOrder(ids.sharedSupplierId, serviceProduct, 5, 100, "ItemServiceProduct")
        const invoiceId = keyedBill(ids.sharedSupplierId, "WALK-SVC-" + Date.now(), serviceProduct, 5, 100, "ItemServiceProduct")
        const before = evaluate(users.buyMatch, invoiceId)
        const accepted = post(users.buyer, "Orders/OrderDetail/acceptService", {
            orderId: order.orderId,
            orderItemSeqId: order.orderItemSeqId,
            acceptedQuantity: "5",
            operationKey: "walk-accept-" + Date.now()
        })
        const after = evaluate(users.buyMatch, invoiceId)
        return {before, accepted, after}
    },
    then({before, accepted, after}) {
        before.resultEnumId != "ImrMatched"
        accepted.errors == ""
        after.resultEnumId == "ImrMatched"
        after.sourceRows[0].acceptedQuantity == 5
    }
})

feature("the legacy backfill from Purchasing links a bill line with one receipt and names one with two", {
    when() {
        const first = approvedOrder(legacySupplier, "DEMO_1_1", 4, 5)
        const second = approvedOrder(legacySupplier, "DEMO_1_1", 4, 5)
        const third = approvedOrder(legacySupplier, "DEMO_1_1", 4, 5)
        const firstReceipt = received(first.orderId, "DEMO_1_1", 4)
        const secondReceipt = received(second.orderId, "DEMO_1_1", 4)
        const thirdReceipt = received(third.orderId, "DEMO_1_1", 4)
        const linked = keyedBill(legacySupplier, "WALK-LEGACY-1-" + Date.now(), "DEMO_1_1", 4, 5)
        const ambiguous = keyedBill(legacySupplier, "WALK-LEGACY-2-" + Date.now(), "DEMO_1_1", 8, 5)
        system(() => {
            invoke("update#mantle.product.receipt.AssetReceipt", {
                assetReceiptId: firstReceipt.assetReceiptId,
                invoiceId: linked,
                invoiceItemSeqId: lineOf(linked)
            })
            for (const receipt of [secondReceipt, thirdReceipt])
                invoke("update#mantle.product.receipt.AssetReceipt", {
                    assetReceiptId: receipt.assetReceiptId,
                    invoiceId: ambiguous,
                    invoiceItemSeqId: lineOf(ambiguous)
                })
        })
        const buyer = post(users.buyer, "Bills/MatchExceptions/linkLegacyBills", {
            organizationPartyId: ids.organizationId,
            vendorPartyId: legacySupplier
        })
        const run = post(users.buyMatch, "Bills/MatchExceptions/linkLegacyBills", {
            organizationPartyId: ids.organizationId,
            vendorPartyId: legacySupplier
        })
        const matchOf = invoiceId => one("mantle.account.invoice.InvoiceMatch", {invoiceId, statusId: "ImApplied"})
        return {buyer, run, linkedMatch: matchOf(linked), ambiguousMatch: matchOf(ambiguous)}
    },
    then({buyer, run, linkedMatch, ambiguousMatch}) {
        buyer.errors.includes("PERMISSION_DENIED")
        run.errors == ""
        linkedMatch.isLegacy == "Y"
        linkedMatch.resultEnumId == "ImrMatched"
        ambiguousMatch.resultEnumId == "ImrException"
        rows("mantle.account.invoice.InvoiceMatchLine", {invoiceMatchId: ambiguousMatch.invoiceMatchId})[0].exceptionEnumId ==
            "MeAmbiguous"
    }
})
