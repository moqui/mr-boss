// Payables in the Accounting app: the bills, bill detail, expense posting, supplier, order, shipment and approvals screens
// render what each user may do, and a held bill goes from AP's request to an approver's release and approval.
const lib = () => ec.resource.script("component://mr-boss/test/AccountingSpecLib.js")
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
                ["Records/OrderDetail", {orderId: "BOSS_ACCT_PO"}, "Bill from order"],
                ["Records/ShipmentDetail", {shipmentId: "BOSS_ACCT_NO_SHIPMENT"}, "Shipment not available"],
                ["Records/ShipmentDetail", {shipmentId: lib().receivedShipmentId()}, "Bill accepted receipts"],
                ["Approvals", {}, "Approvals"]
            ].map(([path, parameters, text]) => {
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

feature("a reader sees the bills and a bill without its actions; AP sees Upload bill and Place hold", {
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
        approver.output.includes("Approve bill")
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

feature("the bill from an approved purchase order takes the supplier's 30-day term", {
    when() {
        return lib().asUser("finance.ap", () => {
            const made = lib().call("mantle.account.InvoiceServices.create#InvoiceFromSource", {
                orderId: "BOSS_ACCT_PO",
                organizationPartyId: org
            })
            const again = lib().refusal("mantle.account.InvoiceServices.create#InvoiceFromSource", {
                orderId: "BOSS_ACCT_PO",
                organizationPartyId: org
            })
            const bill = ec.entity
                .find("mantle.account.invoice.Invoice")
                .condition("invoiceId", made.invoiceId)
                .disableAuthz()
                .one()
            const order = lib().page("Records/OrderDetail", {orderId: "BOSS_ACCT_PO"}, "qvt")
            return {made, again, bill, order}
        })
    },
    then({made, again, bill, order}) {
        bill.settlementTermId == "BOSS_ACCT_NET30"
        bill.statusId == "InvoiceIncoming"
        again.includes("SOURCE_ALREADY_INVOICED")
        order.output.includes(made.invoiceId)
        !order.output.includes("Bill from order")
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
        const ap = lib().asUser("finance.ap", () => lib().page("Records/OrderDetail", {orderId: "BOSS_ACCT_PO"}, "qvt"))
        const reader = lib().asUser("finance.read", () => lib().page("Records/OrderDetail", {orderId: "BOSS_ACCT_PO"}, "qvt"))
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
        ap.errors == []
        ap.output.includes("Supplier bill link")
        !reader.output.includes("Supplier bill link")
        link.url.startsWith("https://suppliers.accounting.example/supplier/BillUpload?token=")
    }
})

feature("the portal demo: ORG_ZIZI_RETAIL's Billing and Supplier site, its links and two invited contacts with no user group", {
    when() {
        login("john.doe")
        const one = (entity, fields) => ec.entity.find(entity).condition(fields).disableAuthz().one()
        const list = (entity, fields) => Array.from(ec.entity.find(entity).condition(fields).disableAuthz().list())
        return {
            mounts: list("mantle.public.PublicSiteApp", {siteId: "ZIZI_PORTAL"}).map(m => m.app + ":" + (m.targetId || "")),
            invoice: one("mantle.account.invoice.Invoice", {invoiceId: "ZIZI_PORTAL_INVOICE"}),
            links: list("mantle.party.ExternalAccessCapability", {organizationPartyId: "ORG_ZIZI_RETAIL"}).map(c => c.scopes),
            payer: list("mantle.party.PartyRelationship", {fromPartyId: "ZIZI_PORTAL_PAYER", relationshipTypeEnumId: "PrtContact"}),
            supplier: list("mantle.party.PartyRelationship", {fromPartyId: "ZIZI_PORTAL_SUPPLIER", relationshipTypeEnumId: "PrtContact"}),
            groups: list("moqui.security.UserGroupMember", {userId: "ZIZI_PORTAL_PAYER"}).concat(
                list("moqui.security.UserGroupMember", {userId: "ZIZI_PORTAL_SUPPLIER"})
            )
        }
    },
    then({mounts, invoice, links, payer, supplier, groups}) {
        mounts.sort().join() == "account:,billing:ORG_ZIZI_RETAIL,supplier:ORG_ZIZI_RETAIL"
        invoice.statusId == "InvoiceFinalized"
        links.sort().join() == "BillUpload,InvoicePay"
        payer.map(r => r.toPartyId).join() == "JoeDist"
        supplier.map(r => r.toPartyId).join() == "ZiddlemanInc"
        groups.length == 0
    }
})
