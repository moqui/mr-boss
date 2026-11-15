// Purchasing record access (impl-purchasing §2, §4, P5 on): each later phase's access rules on its records, one feature per
// rule, each case of it a line of its problems, with artifact authorization enabled. Split from PurchasingAccess in Sales
// follow-up 4 (it ran 13.6 s of feature time in a loaded serial run), every feature kept and unchanged; PurchasingAccess keeps
// the app's own access (context, menu and providers, Home, capabilities, supplier scope, the record check, the purchase
// order's link and detail, guarded areas, the supplier settings, the Mantle REST paths); the two share PurchasingSpecLib and no
// state. A later phase adds a case here for an access rule it adds on a record. The rules: P14a a replenishment facility and
// the approval policies; P5 a purchase receipt's scope and the receive permission on it; P6 a supplier bill's scope, the match
// for the match group only (the shared InvoiceMatch's one render) and its re-evaluation; P7 a supplier's drop-ship setup for
// the purchase administrator; P8 a supplier return's scope, its authorization for RETURN_AUTHORIZE only and its record link to
// ReturnDetail; P9 a purchase order's revisions and acknowledgement for its organization, and starting a change for the buyer
// only; P10 the quick create of a purchase request (requestCreate), a request's detail for its requester and organization,
// and its sourcing for the buyer only; P13 an agreement's scope, its change and release for the buyer only and its record
// link to AgreementDetail; P11 the quick create of an RFQ (rfqCreate), an RFQ's scope, its writes for the buyer only, its
// record link to QuoteRequestDetail and the RFQ left out of Commons and Projects; P12 an RFQ's comparison for its buyers and
// approvers, its award and close for the buyer only; P16 the supplier-response topic, and Supplier360's Invite to the
// Supplier app for the buyer only, on a supplier in scope; P15 evaluating suppliers for the buyer only, an evaluation read in
// its organization only, and the supplier statement for a finance reader only.
// Run: ./moq test mr-boss --spec PurchasingRecordAccess
const lib = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page, billFixture, returnFixture} = lib
const access = "ironstone.purchasing.AccessServices."
// a refusal of a user without Purchasing: the service is not authorized for them, or it refuses them
const refused = message => /PURCHASING_UNAVAILABLE|is not authorized/.test(message)
const values = result => Array.from(result.options || []).map(row => row.value)

spec({
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

// P14a: Replenishment's facility (the record its SupplyPlanning, ReorderRules and their transitions check): the plan and
// stock-policy capabilities for the planner, the buy capability for the buyer, each refused to the other on the same
// facility; another organization's facility refused like a missing one, and not among the planning facilities; the
// replenishment reads refused to a group without the area
feature("a replenishment facility is the organization's; plan and buy on it need their permissions", {
    when() {
        const problems = []
        const check = (user, capability, recordId = ids.facilityId) =>
            asUser(user, () => refusal(access + "check#Record", {recordType: "facility", recordId, capability}))
        for (const [capability, holder, without] of [
            ["plan", users.planner, users.buyer],
            ["stockPolicy", users.planner, users.buyer],
            ["buy", users.buyer, users.planner]
        ]) {
            const held = check(holder, capability)
            if (held !== "") problems.push(`${holder} is refused ${capability} on ${ids.facilityId}: ${held}`)
            const refusedMessage = check(without, capability)
            if (!refusedMessage.includes("PERMISSION_DENIED"))
                problems.push(`${without} is not refused ${capability}: ${refusedMessage || "accepted"}`)
        }
        const other = check(users.planner, "plan", "BOSS_PRD_WH")
        if (!other.includes("RECORD_UNAVAILABLE")) problems.push(`another organization's facility: ${other || "accepted"}`)
        const facilities = asUser(users.planner, () => values(invoke(access + "get#Choices", {choice: "planFacilities"})))
        if (!facilities.includes(ids.facilityId) || facilities.includes("BOSS_PRD_WH"))
            problems.push(`the planner's planning facilities: ${facilities}`)
        const requester = asUser(users.requester, () =>
            refusal("ironstone.purchasing.ReplenishmentServices.find#ReorderRules", {})
        )
        if (!requester.includes("PERMISSION_DENIED") && !refused(requester))
            problems.push(`the requester reads the reorder rules: ${requester || "accepted"}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature(
    "the approval policies are the Settings area's to list and PURCHASE_POLICY_EDIT's to change, in the user's organizations",
    {
        when() {
            const problems = []
            const approvalService = "ironstone.purchasing.ApprovalServices.",
                store = "mantle.order.PurchaseServices.store#PurchaseApprovalPolicy"
            const listed = asUser(users.admin, () =>
                Array.from(
                    invoke(approvalService + "find#PurchaseApprovalPolicies", {
                        appRoot: "Purchasing",
                        organizationPartyId: ids.organizationId
                    }).policyRows || []
                )
            ).map(row => row.purchaseApprovalPolicyId)
            if (!ids.approvalPolicyIds.every(id => listed.includes(id))) problems.push(`the administrator lists ${listed}`)
            const buyerList = asUser(users.buyer, () =>
                refusal(approvalService + "find#PurchaseApprovalPolicies", {appRoot: "Purchasing"})
            )
            if (!buyerList.includes("PERMISSION_DENIED"))
                problems.push(`the buyer lists the policies: ${buyerList || "accepted"}`)
            // one step of awards (no award is approved before P12), the same request for each user, through the Mantle service as
            // the screen's transition calls it (its own permission and organization checks; artifact authorization off); the
            // administrator's is ended
            const step = organizationPartyId => ({
                organizationPartyId,
                sourceTypeEnumId: "PasAward",
                sequenceNum: 1,
                changeReason: "Access spec"
            })
            const approver = asUser(users.approve, () => refusal(store, step(ids.organizationId)), false)
            if (!approver.includes("PERMISSION_DENIED")) problems.push(`the approver stores a policy: ${approver || "accepted"}`)
            const other = asUser(users.admin, () => refusal(store, step(ids.otherOrganizationId)), false)
            if (!other.includes("RECORD_UNAVAILABLE")) problems.push(`the other organization's policy: ${other || "accepted"}`)
            const stored = asUser(users.admin, () => invoke(store, step(ids.organizationId)), false)
            if (!stored.purchaseApprovalPolicyId) problems.push("the administrator is refused the policy")
            else
                asUser(
                    users.admin,
                    () =>
                        invoke(store, {
                            purchaseApprovalPolicyId: stored.purchaseApprovalPolicyId,
                            endPolicy: "Y",
                            changeReason: "Access spec"
                        }),
                    false
                )
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

// P5: a purchase receipt is its orders' organization's; receiving on it is Warehouse's receive permission (STOCK_RECEIVE), which
// purchasing.buyreceive holds and the buyer does not
feature("a purchase receipt is its organization's, and receiving on it needs Warehouse's receive permission", {
    when() {
        const check = user =>
            asUser(user, () =>
                refusal(access + "check#Record", {recordType: "receipt", recordId: ids.receiptId, capability: "receive"})
            )
        return {
            holder: check(users.buyReceive),
            buyer: check(users.buyer),
            other: asUser(users.services, () =>
                refusal(access + "check#Record", {recordType: "receipt", recordId: ids.receiptId})
            ),
            forged: asUser(users.buyer, () => refusal(access + "check#Record", {recordType: "inspection", recordId: "NO_SUCH"}))
        }
    },
    then({holder, buyer, other, forged}) {
        holder == ""
        buyer.includes("PERMISSION_DENIED")
        other.includes("RECORD_UNAVAILABLE")
        forged.includes("RECORD_UNAVAILABLE")
    }
})

// P6: a supplier bill is the buying organization's: another organization's bill is refused like a missing one; the shared
// InvoiceMatch (its one html render) evaluates the bill for a buyer who holds the match group and is not available to a buyer
// without it; the re-evaluation is the match group's, refused to the buyer on the same bill
feature("a supplier bill is its organization's; its match and re-evaluation are the match group's", {
    when() {
        const problems = []
        const fixture = billFixture("Spec access bill")
        const otherBill = system(
            () =>
                invoke("mantle.account.InvoiceServices.create#Invoice", {
                    fromPartyId: ids.otherSupplierId,
                    toPartyId: ids.otherOrganizationId,
                    invoiceTypeEnumId: "InvoiceSales",
                    currencyUomId: "USD",
                    referenceNumber: "SPEC-OTHER-" + Date.now()
                }).invoiceId
        )
        const detail = (user, invoiceId) =>
            asUser(user, () => refusal("ironstone.purchasing.BillServices.get#BillDetail", {appRoot: "Purchasing", invoiceId}))
        const own = detail(users.buyer, fixture.invoiceId)
        if (own !== "") problems.push(`the buyer is refused the bill: ${own}`)
        const other = detail(users.buyer, otherBill)
        if (!other.includes("RECORD_UNAVAILABLE")) problems.push(`another organization's bill: ${other || "accepted"}`)
        const services = detail(users.services, otherBill)
        if (services !== "") problems.push(`Ziziwork Services' reader is refused its bill: ${services}`)
        const matchPage = user => asUser(user, () => page("Bills/InvoiceMatch", {invoiceId: fixture.invoiceId}, "html"))
        const matcher = matchPage(users.buyMatch)
        if (matcher.errors.length || !matcher.output.includes("Bill lines") || !matcher.output.includes("Unapply match"))
            problems.push(`the match operator's InvoiceMatch: ${matcher.errors}`)
        const buyer = matchPage(users.buyer)
        if (buyer.errors.length || !buyer.output.includes("is not available") || buyer.output.includes("Bill lines"))
            problems.push(`the buyer's InvoiceMatch: ${buyer.errors}`)
        const reevaluate = user =>
            asUser(user, () =>
                refusal("ironstone.purchasing.BillServices.reevaluate#Matches", {
                    appRoot: "Purchasing",
                    invoiceIds: [fixture.invoiceId]
                })
            )
        const held = reevaluate(users.buyMatch)
        if (held !== "") problems.push(`the match operator's re-evaluation: ${held}`)
        const without = reevaluate(users.buyer)
        if (!without.includes("PERMISSION_DENIED")) problems.push(`the buyer's re-evaluation: ${without || "accepted"}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

// P7: a supplier's drop-ship setup (Supplier360's Drop-ship tab) is the purchase administrator's (policyEdit) on a supplier in
// scope: the buyer is refused on the same supplier, and another organization's supplier is refused to the administrator
feature("a supplier's drop-ship setup is the purchase administrator's, on a supplier of the organization", {
    when() {
        const check = user =>
            asUser(user, () =>
                refusal(access + "check#Record", {
                    recordType: "supplier",
                    recordId: ids.sharedSupplierId,
                    capability: "policyEdit"
                })
            )
        // the Mantle service as the screen's transition calls it (no artifact authorization of its own)
        const other = asUser(
            users.admin,
            () =>
                refusal("mantle.order.DropShipServices.store#DropShipFacility", {
                    organizationPartyId: ids.organizationId,
                    supplierPartyId: ids.otherSupplierId,
                    facilityName: "Spec drop-ship"
                }),
            false
        )
        return {admin: check(users.admin), buyer: check(users.buyer), other}
    },
    then({admin, buyer, other}) {
        admin == ""
        buyer.includes("PERMISSION_DENIED")
        other.includes("SUPPLIER_UNAVAILABLE")
    }
})

// P8: a supplier return is the buying organization's: another organization's return is refused like a missing one; authorizing
// it needs RETURN_AUTHORIZE (the buyer holds it, the reader does not) on the same return; its record link opens Purchasing's
// ReturnDetail for a Purchasing user and stays Warehouse's for a Warehouse user without Purchasing
feature("a supplier return is its organization's; authorizing it needs RETURN_AUTHORIZE; its link opens under Purchasing", {
    when() {
        const problems = []
        const fixture = returnFixture("Spec access return")
        const returnId = system(
            () =>
                invoke("mantle.order.ReturnServices.create#ReturnFromOrder", {orderId: fixture.orderId, orderPartSeqId: "01"})
                    .returnId
        )
        const otherReturn = system(
            () =>
                invoke("mantle.order.ReturnServices.create#Return", {
                    customerPartyId: ids.otherOrganizationId,
                    vendorPartyId: ids.otherSupplierId,
                    currencyUomId: "USD"
                }).returnId
        )
        const check = (user, recordId, capability) =>
            asUser(user, () => refusal(access + "check#Record", {recordType: "supplierReturn", recordId, capability}))
        const holder = check(users.buyer, returnId, "returnAuthorize")
        if (holder !== "") problems.push(`the buyer is refused the authorization: ${holder}`)
        const reader = check(users.read, returnId, "returnAuthorize")
        if (!reader.includes("PERMISSION_DENIED")) problems.push(`the reader's authorization: ${reader || "accepted"}`)
        const readerRead = check(users.read, returnId, null)
        if (readerRead !== "") problems.push(`the reader is refused the return: ${readerRead}`)
        const other = check(users.buyer, otherReturn, null)
        if (!other.includes("RECORD_UNAVAILABLE")) problems.push(`another organization's return: ${other || "accepted"}`)
        const services = check(users.services, otherReturn, null)
        if (services !== "") problems.push(`Ziziwork Services' reader is refused its return: ${services}`)
        const link = (user, enabled = true) =>
            asUser(
                user,
                () =>
                    invoke("ironstone.commons.PaletteServices.get#RecordLink", {
                        recordEntityName: "mantle.order.return.ReturnHeader",
                        id: returnId
                    }).url || null,
                enabled
            )
        const own = link(users.read)
        if (own !== "/qapps/Purchasing/Returns/ReturnDetail?returnId=" + returnId) problems.push(`the reader's link: ${own}`)
        const warehouse = link("warehouse.read", false)
        if (warehouse && warehouse.includes("/Purchasing/")) problems.push(`a Warehouse user's link: ${warehouse}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

// P9: a purchase order's revisions and acknowledgement are its organization's: another organization's reader is refused them;
// starting a change and recording the supplier's response are the buyer's (PURCHASE_ORDER_EDIT), offered to the buyer and not
// to a reader on the same order, and the list is refused a requester
feature("an order's revisions and acknowledgement are its organization's, and changing or acknowledging it is the buyer's", {
    when() {
        const problems = []
        const read = user =>
            asUser(
                user,
                () =>
                    invoke("ironstone.purchasing.RevisionServices.get#OrderRevisions", {
                        appRoot: "Purchasing",
                        orderId: ids.ackOrderId
                    }).orderRevisions
            )
        const buyer = read(users.buyer)
        if (!buyer.actions.change || !buyer.actions.acknowledge) problems.push("the buyer is not offered the change and response")
        const reader = read(users.read)
        if (reader.actions.change || reader.actions.acknowledge) problems.push("the reader is offered the change or response")
        const other = asUser(users.services, () =>
            refusal("ironstone.purchasing.RevisionServices.get#OrderRevisions", {appRoot: "Purchasing", orderId: ids.ackOrderId})
        )
        if (!other.includes("RECORD_UNAVAILABLE")) problems.push(`another organization's reader: ${other || "accepted"}`)
        const capability = user =>
            asUser(user, () =>
                refusal(access + "check#Record", {recordType: "order", recordId: ids.ackOrderId, capability: "buy"})
            )
        const holder = capability(users.buyer)
        if (holder !== "") problems.push(`the buyer's change check: ${holder}`)
        const without = capability(users.read)
        if (!without.includes("PERMISSION_DENIED")) problems.push(`the reader's change check: ${without || "accepted"}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

// P10: a purchase request's detail is its requester's and its organization's (another organization's reader is refused it);
// sourcing it is the buyer's (PURCHASE_ORDER_EDIT), refused to the requester on the same request
feature("a purchase request's detail is its requester's and organization's, and sourcing it is the buyer's", {
    when() {
        const problems = []
        const detail = user =>
            asUser(user, () =>
                refusal("ironstone.purchasing.RequestServices.get#RequestDetail", {
                    appRoot: "Purchasing",
                    requestId: ids.requestId
                })
            )
        const requester = detail(users.requester)
        if (requester !== "") problems.push(`the requester is refused their request: ${requester}`)
        const other = detail(users.services)
        if (!other.includes("RECORD_UNAVAILABLE")) problems.push(`another organization's reader: ${other || "accepted"}`)
        const source = user =>
            asUser(
                user,
                () => refusal("mantle.request.RequestServices.preview#PurchaseSourcing", {requestId: ids.requestId}),
                false
            )
        const holder = source(users.buyer)
        if (holder !== "") problems.push(`the buyer's sourcing preview: ${holder}`)
        const without = source(users.requester)
        if (!without.includes("PERMISSION_DENIED")) problems.push(`the requester's sourcing preview: ${without || "accepted"}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

// P13: an agreement is its organization's: AgreementDetail's read for its reader and refused for another organization's; its
// writes (change, release) the buyer's; its record link opens AgreementDetail; its approved PDF withheld from the reader and
// never uploaded (review)
feature("an agreement is its organization's; changing or releasing it is the buyer's; its link opens AgreementDetail", {
    when() {
        const problems = []
        const detail = user =>
            asUser(user, () =>
                refusal("ironstone.purchasing.AgreementServices.get#AgreementDetail", {
                    appRoot: "Purchasing",
                    agreementId: ids.agreementId
                })
            )
        const reader = detail(users.read)
        if (reader !== "") problems.push(`the reader's detail: ${reader}`)
        const other = detail(users.services)
        if (!other.includes("RECORD_UNAVAILABLE")) problems.push(`another organization's reader: ${other || "accepted"}`)
        const capability = (user, agreementId) =>
            asUser(user, () =>
                refusal(access + "check#Record", {recordType: "agreement", recordId: agreementId, capability: "buy"})
            )
        const holder = capability(users.buyer, ids.agreementId)
        if (holder !== "") problems.push(`the buyer's release check: ${holder}`)
        const without = capability(users.read, ids.agreementId)
        if (!without.includes("PERMISSION_DENIED")) problems.push(`the reader's release check: ${without || "accepted"}`)
        const otherOrganization = capability(users.buyer, ids.otherAgreementId)
        if (!otherOrganization.includes("RECORD_UNAVAILABLE"))
            problems.push(`another organization's agreement: ${otherOrganization || "accepted"}`)
        const link = asUser(
            users.read,
            () =>
                invoke("ironstone.commons.PaletteServices.get#RecordLink", {
                    recordEntityName: "mantle.party.agreement.Agreement",
                    id: ids.agreementId
                }).url || null
        )
        if (link !== "/qapps/Purchasing/Agreements/AgreementDetail?agreementId=" + ids.agreementId)
            problems.push(`the agreement's link: ${link}`)
        // P13 review: the approved PDF is withheld from a reader who does not see amounts, another organization's refused;
        // an upload is not taken for the approved agreement
        const content = system(() =>
            ec.service
                .sync()
                .name("create#mantle.party.agreement.AgreementContent")
                .parameters({
                    agreementId: ids.agreementId,
                    contentLocation: "dbresource://mantle/content/agreement/spec/approved.pdf",
                    contentTypeEnumId: "AcntApprovedVersion"
                })
                .call()
        )
        const transition = (user, name, parameters, method = "get") =>
            asUser(user, () => {
                const result = ec.screen
                    .makeTest()
                    .rootScreen("component://webroot/screen/webroot.xml")
                    .render("apps/Purchasing/Agreements/AgreementDetail/" + name, parameters, method)
                const errors = Array.from(result.errorMessages || []).join(" | ")
                ec.message.clearErrors()
                return errors
            })
        try {
            const download = {agreementId: ids.agreementId, agreementContentId: content.agreementContentId}
            const readerFile = transition(users.read, "agreementContent", download)
            if (!readerFile.includes("withheld from you")) problems.push(`the reader's approved PDF: ${readerFile || "sent"}`)
            const otherFile = transition(users.services, "agreementContent", download)
            if (!otherFile.includes("RECORD_UNAVAILABLE")) problems.push(`another organization's file: ${otherFile || "sent"}`)
            const spoofed = transition(
                users.buyer,
                "uploadFile",
                {agreementId: ids.agreementId, contentTypeEnumId: "AcntApprovedVersion"},
                "post"
            )
            if (!spoofed.includes("Choose an agreement document"))
                problems.push(`an uploaded approved version: ${spoofed || "taken"}`)
        } finally {
            system(() =>
                ec.service
                    .sync()
                    .name("delete#mantle.party.agreement.AgreementContent")
                    .parameters({agreementContentId: content.agreementContentId})
                    .call()
            )
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

// P11: an RFQ is its organization's: QuoteRequestDetail's read for its reader and refused for another organization's; its
// writes the buyer's; its record link opens QuoteRequestDetail (never another app's RequestDetail); Commons and Projects
// neither list it nor show it, though the buyer filed it (R-PUR-13)
feature(
    "an RFQ is its organization's; changing it is the buyer's; it opens only QuoteRequestDetail, in no Commons or Projects list",
    {
        when() {
            const problems = []
            const rfqId = asUser(
                users.buyer,
                () =>
                    invoke("mantle.order.SourcingServices.create#QuoteRequest", {
                        organizationPartyId: ids.organizationId,
                        requestName: "Access spec RFQ"
                    }).requestId,
                false
            )
            const detail = user =>
                asUser(user, () =>
                    refusal("ironstone.purchasing.SourcingServices.get#QuoteRequest", {appRoot: "Purchasing", requestId: rfqId})
                )
            const reader = detail(users.read)
            if (reader !== "") problems.push(`the reader's detail: ${reader}`)
            const other = detail(users.services)
            if (!other.includes("RECORD_UNAVAILABLE")) problems.push(`another organization's reader: ${other || "accepted"}`)
            const capability = user =>
                asUser(user, () => refusal(access + "check#Record", {recordType: "rfq", recordId: rfqId, capability: "buy"}))
            const holder = capability(users.buyer)
            if (holder !== "") problems.push(`the buyer's check: ${holder}`)
            const without = capability(users.read)
            if (!without.includes("PERMISSION_DENIED")) problems.push(`the reader's check: ${without || "accepted"}`)
            const link = user =>
                asUser(
                    user,
                    () =>
                        invoke("ironstone.commons.PaletteServices.get#RecordLink", {
                            recordEntityName: "mantle.request.Request",
                            id: rfqId
                        }).url || null
                )
            if (link(users.read) !== "/qapps/Purchasing/Sourcing/QuoteRequestDetail?requestId=" + rfqId)
                problems.push(`the RFQ's link: ${link(users.read)}`)
            const otherLink = link(users.services)
            if (otherLink) problems.push(`another organization's reader has a link: ${otherLink}`)
            // the buyer filed it, so Commons' own visibility would show it (the Commons services, which a Purchasing group is
            // not authorized for, called as a Commons user would)
            const commons = asUser(
                users.buyer,
                () => invoke("ironstone.commons.RequestServices.get#RequestAccess", {requestId: rfqId, need: "check"}),
                false
            )
            if (commons.visible) problems.push("Commons shows the RFQ to the buyer who filed it")
            const listed = asUser(
                users.buyer,
                () =>
                    Array.from(
                        invoke("ironstone.commons.RequestServices.find#RequestRows", {list: "all", pageSize: 100}).rowList || []
                    ),
                false
            )
            if (listed.some(row => row.requestId == rfqId)) problems.push("Commons lists the RFQ")
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

// P16: Supplier360's Invite to the Supplier app is the buyer's (PURCHASE_ORDER_EDIT), on a supplier in scope: the reader is
// refused, and another organization's supplier is refused like a missing one; the buyer's invitation is bound to the
// Supplier app and the supplier on Retail's site (the Accounting portal demo's ZIZI_PORTAL)
feature("inviting a supplier's contact to the Supplier app is the buyer's, on a supplier in scope", {
    when() {
        const check = (user, supplierPartyId) =>
            asUser(user, () =>
                refusal(access + "check#Record", {recordType: "supplier", recordId: supplierPartyId, capability: "buy"})
            )
        const invite = user =>
            asUser(
                user,
                () =>
                    refusal("mantle.party.ExternalAccessServices.invite#Contact", {
                        organizationPartyId: ids.organizationId,
                        app: "supplier",
                        partyId: ids.sharedSupplierId,
                        emailAddress: "spec.contact@ziddleman.example"
                    }),
                false
            )
        return {
            buyer: check(users.buyer, ids.sharedSupplierId),
            reader: check(users.read, ids.sharedSupplierId),
            other: check(users.buyer, ids.otherSupplierId),
            buyerInvite: invite(users.buyer),
            readerInvite: invite(users.read)
        }
    },
    then({buyer, reader, other, buyerInvite, readerInvite}) {
        buyer == ""
        reader.includes("PERMISSION_DENIED")
        other.includes("RECORD_UNAVAILABLE")
        buyerInvite == ""
        readerInvite.includes("PERMISSION_DENIED")
    }
})

feature("an RFQ's comparison is its buyers' and approvers'; its award and close are the buyer's", {
    when() {
        const problems = []
        const S = "mantle.order.SourcingServices."
        const rfqId = asUser(
            users.buyer,
            () => {
                const requestId = invoke(S + "create#QuoteRequest", {
                    organizationPartyId: ids.organizationId,
                    requestName: "Access spec award"
                }).requestId
                invoke(S + "store#QuoteRequestItem", {requestId, productId: "DEMO_1_1", quantity: 2})
                return requestId
            },
            false
        )
        const compare = user => asUser(user, () => refusal(S + "compare#SupplierQuotes", {requestId: rfqId}), false)
        for (const user of [users.buyer, users.approve]) {
            const message = compare(user)
            if (message !== "") problems.push(`${user}'s comparison: ${message}`)
        }
        const reader = compare(users.read)
        if (!reader.includes("PERMISSION_DENIED")) problems.push(`the reader's comparison: ${reader || "accepted"}`)
        const close = user => asUser(user, () => refusal(S + "close#QuoteRequest", {requestId: rfqId, preview: true}), false)
        const buyerClose = close(users.buyer)
        if (buyerClose !== "") problems.push(`the buyer's close preview: ${buyerClose}`)
        const approverClose = close(users.approve)
        if (!approverClose.includes("PERMISSION_DENIED")) problems.push(`the approver's close: ${approverClose || "accepted"}`)
        const award = user =>
            asUser(user, () => refusal(access + "check#Record", {recordType: "rfq", recordId: rfqId, capability: "buy"}))
        const otherAward = asUser(users.services, () => refusal(access + "check#Record", {recordType: "rfq", recordId: rfqId}))
        if (!otherAward.includes("RECORD_UNAVAILABLE"))
            problems.push(`another organization's reader: ${otherAward || "accepted"}`)
        if (award(users.buyer) !== "") problems.push("the buyer may not award")
        if (!award(users.approve).includes("PERMISSION_DENIED")) problems.push("the approver may award")
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature(
    "P15: evaluating suppliers is the buyer's, an evaluation is its organization's, and the supplier statement a finance reader's",
    {
        when() {
            const S = "mantle.party.SupplierServices."
            const R = "ironstone.purchasing.ReportServices."
            const evaluate = user =>
                asUser(
                    user,
                    () =>
                        refusal(S + "evaluate#SupplierScorecard", {
                            organizationPartyId: ids.organizationId,
                            supplierPartyId: ids.supplierId
                        }),
                    false
                )
            const buyerEvaluate = evaluate(users.buyer)
            const readerEvaluate = evaluate(users.read)
            const scorecardId = system(
                () =>
                    Array.from(
                        ec.entity
                            .find("mantle.party.supplier.SupplierScorecard")
                            .condition({organizationPartyId: ids.organizationId, supplierPartyId: ids.supplierId})
                            .orderBy("-evaluatedDate")
                            .list()
                    )[0]?.supplierScorecardId
            )
            const read = user =>
                asUser(user, () => refusal(R + "get#SupplierScorecard", {supplierScorecardId: scorecardId || "_NA_"}))
            const statement = user =>
                asUser(user, () => refusal(R + "get#SupplierStatement", {supplierPartyId: ids.sharedSupplierId}))
            return {
                buyerEvaluate,
                readerEvaluate,
                scorecardId,
                readerRead: read(users.read),
                otherRead: read(users.services),
                matchStatement: statement(users.buyMatch),
                buyerStatement: statement(users.buyer)
            }
        },
        then({buyerEvaluate, readerEvaluate, scorecardId, readerRead, otherRead, matchStatement, buyerStatement}) {
            buyerEvaluate == ""
            readerEvaluate.includes("PERMISSION_DENIED")
            scorecardId != null
            readerRead == ""
            otherRead.includes("RECORD_UNAVAILABLE")
            matchStatement == ""
            buyerStatement.includes("PERMISSION_DENIED")
        }
    }
)
