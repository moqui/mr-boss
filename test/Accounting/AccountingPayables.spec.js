// Payables in the Accounting app: the bills, bill detail, expense posting, supplier, order, shipment and approvals screens
// render what each user may do, and a held bill goes from AP's request to an approver's release and approval.
const lib = () => ec.resource.script("component://mr-boss/test/Accounting/AccountingSpecLib.js")
const org = "BOSS_ACCT_ORG"
const supplier = "BOSS_ACCT_SUPPLIER"
let billId, holdId

spec({
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        login("john.doe")
    }
})

feature("the payables screens render in #mode for AP", {
    where: [{mode: "qvt"}, {mode: "tui"}],
    when({mode}) {
        const rows = lib().asUser("finance.ap", () =>
            [
                ["Payables/Bills", {}, "SUPP-1001"],
                ["Payables/Bills", {queue: "held"}, "Supplier dispute"],
                ["Payables/BillDetail", {recordId: "BOSS_ACCT_BILL_HELD"}, "On hold"],
                ["Payables/BillDetail/Holds", {recordId: "BOSS_ACCT_BILL_HELD", lastStandalone: "true"}, "Quantity short"],
                ["Payables/BillDetail/Overview", {recordId: "BOSS_ACCT_BILL_REVIEW", lastStandalone: "true"}, "SUPP-1001"],
                ["Payables/ExpensePosting", {}, "Expense posting"],
                ["Payables/Supplier360", {supplierPartyId: supplier}, "Accounting Demo Supplier"],
                ["Payables/Supplier360/Terms", {supplierPartyId: supplier, lastStandalone: "true"}, "Net 30 days"],
                ["Records/ShipmentDetail", {shipmentId: "BOSS_ACCT_NO_SHIPMENT"}, "Shipment not available"],
                ["Records/ShipmentDetail", {shipmentId: lib().receivedShipmentId()}, "Bill accepted receipts"],
                ["Approvals", {}, "Approvals"]
            ]
                // OrderDetail (its purchase order's Bill from order too) is rendered by AccountingCollections
                .map(([path, parameters, text]) => {
                    const page = lib().page(path, parameters, mode)
                    return {path, status: page.status, errors: page.errors, found: page.output.includes(text)}
                })
        )
        return {rows}
    },
    then({rows}) {
        rows.filter(row => row.status != 200 || row.errors.length || !row.found).map(row => row.path) == []
    }
})

// BillDetail's Approve over budget (a budget Stop's override) is for an approver who holds BUDGET_OVERRIDE only.
feature("a reader sees the bills and a bill without its actions; AP sees Upload bill and Place hold; the approver approves", {
    when() {
        const read = lib().asUser("finance.read", () => ({
            bills: lib().page("Payables/Bills", {}, "qvt"),
            bill: lib().page("Payables/BillDetail", {recordId: "BOSS_ACCT_BILL_REVIEW"}, "qvt")
        }))
        const ap = lib().asUser("finance.ap", () => ({
            bills: lib().page("Payables/Bills", {}, "qvt"),
            bill: lib().page("Payables/BillDetail", {recordId: "BOSS_ACCT_BILL_REVIEW"}, "qvt")
        }))
        const approver = lib().asUser("finance.approve", () =>
            lib().page("Payables/BillDetail", {recordId: "BOSS_ACCT_BILL_REVIEW"})
        )
        return {read, ap, approver}
    },
    then({read, ap, approver}) {
        read.bills.output.includes("SUPP-1001")
        !read.bills.output.includes("Upload bill")
        !read.bill.output.includes("Place hold")
        !read.bill.output.includes("Approve bill")
        ap.bills.output.includes("Upload bill")
        ap.bill.output.includes("Place hold")
        !ap.bill.output.includes("Approve bill")
        !ap.bill.output.includes("Approve over budget")
        approver.errors == []
        approver.output.includes("Approve bill")
        approver.output.includes("Approve over budget")
    }
})

feature("an AR user cannot read the bills queue, the bill exceptions or a supplier", {
    when() {
        const parameters = {organizationPartyId: org}
        return lib().asUser("finance.ar", () => ({
            bills: lib().refusal("ironstone.accounting.PayableScreenServices.find#Bills", parameters),
            exceptions: lib().refusal("ironstone.accounting.MatchServices.find#BillExceptions", parameters),
            supplier: lib().refusal("mantle.party.SupplierServices.get#SupplierFinance", {
                organizationPartyId: org,
                supplierPartyId: supplier
            }),
            positive: lib().asUser("finance.ap", () =>
                lib().call("ironstone.accounting.MatchServices.find#BillExceptions", parameters)
            )
        }))
    },
    then({bills, exceptions, supplier, positive}) {
        bills.includes("PERMISSION_DENIED")
        exceptions.includes("PERMISSION_DENIED")
        supplier.includes("PERMISSION_DENIED")
        positive.exceptions.some(row => row.invoiceId == "BOSS_ACCT_BILL_HELD" && row.reasonText == "Supplier dispute")
    }
})

feature("a held bill: AP asks for a release, the approver sees it in Approvals, releases it and approves the bill", {
    when() {
        const made = lib().asUser("finance.ap", () => {
            const bill = lib().call("mantle.account.InvoiceServices.import#Bill", {
                organizationPartyId: org,
                supplierPartyId: supplier,
                referenceNumber: "SUPP-SPEC-" + Date.now(),
                amount: "45"
            })
            const hold = lib().call("mantle.account.InvoiceServices.hold#Invoice", {
                invoiceId: bill.invoiceId,
                organizationPartyId: org,
                holdReasonEnumId: "IhrApReview"
            })
            const stamp = ec.entity
                .find("mantle.account.invoice.Invoice")
                .condition("invoiceId", bill.invoiceId)
                .disableAuthz()
                .one()
            lib().call("mantle.account.InvoiceServices.request#PayableApproval", {
                invoiceId: bill.invoiceId,
                organizationPartyId: org,
                lastUpdatedStamp: stamp.lastUpdatedStamp
            })
            lib().call("mantle.account.InvoiceServices.request#HoldRelease", {
                invoiceHoldId: hold.invoiceHoldId,
                organizationPartyId: org,
                releaseRequestNote: "Reviewed the delivery"
            })
            return {invoiceId: bill.invoiceId, invoiceHoldId: hold.invoiceHoldId}
        })
        billId = made.invoiceId
        holdId = made.invoiceHoldId
        return lib().asUser("finance.approve", () => {
            const stamp = () =>
                ec.entity.find("mantle.account.invoice.Invoice").condition("invoiceId", billId).disableAuthz().one()
            const heldApproval = lib().refusal("mantle.account.InvoiceServices.approve#Payable", {
                invoiceId: billId,
                organizationPartyId: org,
                lastUpdatedStamp: stamp().lastUpdatedStamp
            })
            // the approver's unread notifications of the bill, by topic
            const unread = () =>
                Array.from(
                    ec.entity
                        .find("moqui.security.user.NotificationMessageUser")
                        .condition("userId", "BOSS_ACCT_APPROVE")
                        .condition("viewedDate", "is-null", null)
                        .disableAuthz()
                        .list()
                )
                    .map(row =>
                        ec.entity
                            .find("moqui.security.user.NotificationMessage")
                            .condition("notificationMessageId", row.notificationMessageId)
                            .disableAuthz()
                            .one()
                    )
                    .filter(message => message.recordId == billId)
                    .map(message => message.topic)
                    .sort()
            const waiting = unread()
            const page = lib().page("Approvals", {}, "qvt")
            lib().call("mantle.account.InvoiceServices.release#InvoiceHold", {
                invoiceHoldId: holdId,
                organizationPartyId: org,
                releaseComment: "Delivery confirmed"
            })
            const approved = lib().call("mantle.account.InvoiceServices.approve#Payable", {
                invoiceId: billId,
                organizationPartyId: org,
                lastUpdatedStamp: stamp().lastUpdatedStamp
            })
            return {heldApproval, waiting, page, approved, left: unread()}
        })
    },
    then({heldApproval, waiting, page, approved, left}) {
        heldApproval.includes("INVOICE_HELD")
        waiting == ["BillApproval", "BillHoldRelease"]
        page.output.includes(billId)
        left == []
        approved.statusId == "InvoiceApproved"
    }
})

// The bill's term from the supplier and the refusal of a second bill are mr-mantle's AccountingPayables.
feature("AP bills an approved purchase order; the order lists the bill and offers no second one", {
    when() {
        return lib().asUser("finance.ap", () => {
            const made = lib().call("mantle.account.InvoiceServices.create#InvoiceFromSource", {
                orderId: "BOSS_ACCT_PO",
                organizationPartyId: org
            })
            const order = lib().call("ironstone.accounting.PayableScreenServices.get#OrderContext", {
                orderId: "BOSS_ACCT_PO",
                organizationPartyId: org
            }).orderDetail
            return {made, order}
        })
    },
    then({made, order}) {
        order.invoices.some(row => row.invoiceId == made.invoiceId)
        order.canInvoice == false
    }
})

feature("with a Supplier site for the organization, AP gets an approved order's bill link and a reader does not", {
    when() {
        login("john.doe")
        ec.artifactExecution.disableAuthz()
        const siteId = "BOSS_ACCT_SUPPLIER_SITE"
        const c = (name, p) => ec.service.sync().name(name).parameters(p).disableAuthz().call()
        if (!ec.entity.find("mantle.public.PublicSite").condition("siteId", siteId).disableAuthz().one()) {
            c("create#mantle.public.PublicSite", {
                siteId,
                name: "Accounting supplier site",
                state: "published",
                registrationMode: "invitation",
                policyRevision: 1,
                generation: 1
            })
            c("create#mantle.public.PublicSiteParty", {siteId, partyId: ec.user.userAccount.partyId, state: "active", role: "owner", revision: 1})
            c("mantle.public.SiteServices.store#Mounts", {
                input: {
                    siteId,
                    expectedRevision: 1,
                    mounts: [{app: "supplier", pathPrefix: "/supplier", targetId: org}],
                    hosts: [{hostname: "suppliers.accounting.example", canonical: true}]
                }
            })
        }
        ec.artifactExecution.enableAuthz()
        // the order's context, which OrderDetail's Supplier bill link shows on (its qvt render is AccountingCollections')
        const order = () =>
            lib().call("ironstone.accounting.PayableScreenServices.get#OrderContext", {
                orderId: "BOSS_ACCT_PO",
                organizationPartyId: org
            }).orderDetail
        const ap = lib().asUser("finance.ap", order)
        const reader = lib().asUser("finance.read", order)
        const link = lib().asUser("finance.ap", () =>
            lib().call("mantle.party.ExternalAccessServices.create#AccessCapability", {
                recordType: "Order",
                recordId: "BOSS_ACCT_PO",
                scopes: "BillUpload"
            })
        )
        return {ap, reader, link}
    },
    then({ap, reader, link}) {
        ap.canIssueSupplierLink == true
        reader.canIssueSupplierLink == false
        link.url.startsWith("https://suppliers.accounting.example/supplier/BillUpload?token=")
    }
})

feature("the portal demo: ORG_ZIZI_RETAIL's Billing, Supplier and Support site, its links and two invited contacts with no user group", {
    when() {
        login("john.doe")
        const list = (entity, fields) => Array.from(ec.entity.find(entity).condition(fields).disableAuthz().list())
        const links = list("mantle.party.ExternalAccessCapability", {organizationPartyId: "ORG_ZIZI_RETAIL"})
        const invoice = list("mantle.account.invoice.Invoice", {invoiceId: links.find(c => c.recordType == "Invoice")?.recordId})[0]
        const grants = partyId => list("mantle.party.ExternalAccessContact", {partyId}).map(g => g.app + ":" + g.outsidePartyId)
        return {
            mounts: list("mantle.public.PublicSiteApp", {siteId: "ZIZI_PORTAL"}).map(m => m.app + ":" + (m.targetId || "")),
            invoice,
            gateway: list("mantle.ledger.config.PartyAcctgPreference", {organizationPartyId: "ORG_ZIZI_CORP"})[0],
            links: links.map(c => c.scopes),
            payer: grants("ZIZI_PORTAL_PAYER"),
            supplier: grants("ZIZI_PORTAL_SUPPLIER"),
            groups: list("moqui.security.UserGroupMember", {userId: "ZIZI_PORTAL_PAYER"}).concat(
                list("moqui.security.UserGroupMember", {userId: "ZIZI_PORTAL_SUPPLIER"})
            )
        }
    },
    then({mounts, invoice, gateway, links, payer, supplier, groups}) {
        // with Customer Service's Support app demo (P13) on the same site
        mounts.sort().join() == "account:,billing:ORG_ZIZI_RETAIL,supplier:ORG_ZIZI_RETAIL,support:ORG_ZIZI_RETAIL"
        invoice.statusId == "InvoiceFinalized"
        gateway.invoicePayGatewayConfigId == "ZIZI_PORTAL_HOSTED"
        // with Purchasing's Supplier app demo (P16): Ziddleman's quote link and the order's acknowledgement link; with
        // Customer Service's feedback demo (P13): the answered invitation's link; with its Support app demo (P15): the
        // Support queue's public form token
        links.sort().join() == "BillUpload,CaseFeedback,CaseIntake,InvoicePay,OrderAcknowledgement,BillUpload,QuoteResponse"
        payer.join() == "billing:JoeDist"
        supplier.join() == "supplier:ZiddlemanInc"
        groups.length == 0
    }
})
