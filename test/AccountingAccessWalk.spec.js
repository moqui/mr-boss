// The Accounting access walk (design-accounting §16.3 Access, impl-accounting P21): an Accounting user of one group, with no
// other launcher, is refused the other groups' sections and actions and other organizations' records, through URLs, the
// shared mounts (Records, Chatter, RecordFiles, also under Commons), imports, exports, search, choices and REST. Each group's
// demo user (finance.ar ... finance.admin, BossAccountingUsersDemoData.xml) works in BOSS_ACCT_ORG only. A second internal
// organization, BOSS_P21_OTHER, holds one record of each kind, each with "P21 secret" in a text the screens show; no render,
// export, search or choice of any of these users may show it.
// Run: ./moq test mr-boss --spec AccountingAccessWalk
const lib = ec.resource.script("component://mr-boss/test/AccountingSpecLib.js")
const ORG = "BOSS_ACCT_ORG",
    OTHER = "BOSS_P21_OTHER",
    CUSTOMER = "BOSS_P21_CUSTOMER",
    SUPPLIER = "BOSS_P21_SUPPLIER"
const SECRET = /P21 secret/i
const groups = ["ar", "ap", "match", "treasury", "gl", "tax", "read", "approve", "admin"]
const userOf = group => "finance." + group
const store = (entity, fields) =>
    ec.service.sync().name("store#" + entity).parameters(fields).disableAuthz().call()
// the foreign records, by kind
const other = {
    invoice: "BOSS_P21_INVOICE",
    bill: "BOSS_P21_BILL",
    payment: "BOSS_P21_PAYMENT",
    entry: "BOSS_P21_ENTRY",
    order: "BOSS_P21_PO",
    shipment: "BOSS_P21_SHIPMENT",
    returnId: "BOSS_P21_RETURN",
    asset: "BOSS_P21_ASSET",
    bank: "BOSS_P21_BANK",
    finAccount: "BOSS_P21_STORED"
}
// The sections each group opens (BossAccountingSetupData.xml's screen authorizations), by one screen of each with a text
// that screen shows (AccountingSpecLib's route fixtures)
const sections = {
    Home: groups,
    "Receivables/Invoices": ["ar", "gl", "read", "approve", "admin"],
    "Receivables/ReceivablesWorkbench": ["ar", "treasury", "gl", "read", "approve", "admin"],
    "Payables/Bills": ["ap", "match", "treasury", "gl", "read", "approve", "admin"],
    "Payments/Payments": ["ar", "ap", "treasury", "gl", "read", "approve", "admin"],
    "Banking/BankAccounts": ["treasury", "read", "admin"],
    "GeneralLedger/JournalEntries": ["gl", "read", "approve", "admin"],
    "PeriodClose/Periods": ["gl", "approve", "admin"],
    "FixedAssets/FixedAssets": ["gl", "read", "approve", "admin"],
    "Inventory/InventoryValuation": ["gl", "read", "admin"],
    "Tax/TaxStatements": ["tax", "admin"],
    "Budgets/Budgets": ["gl", "read", "approve", "admin"],
    "Reports/TrialBalance": ["gl", "read", "approve", "admin"],
    "Settings/AccountingPreferences": ["admin"],
    Approvals: ["ap", "approve", "admin"],
    "QuickCreate/NewPayment": ["treasury", "admin"],
    // the shared screens under Records, which every Accounting user reaches: the record shows to its readers only
    "Records/OrderDetail": ["ap", "match", "treasury", "gl", "read", "approve", "admin"],
    "Records/ReturnDetail": ["ar", "gl", "read", "approve", "admin"]
}
// The detail screens and shared mounts, each opened on a record of the other organization
const foreignRoutes = [
    ["Receivables/InvoiceDetail", {recordId: other.invoice}],
    ["Receivables/InvoiceDetail/Overview", {recordId: other.invoice, lastStandalone: "true"}],
    ["Receivables/InvoicePrint", {invoiceId: other.invoice}],
    ["Receivables/InvoiceBatch", {invoiceIdList: [other.invoice]}],
    ["Receivables/Customer360", {customerPartyId: CUSTOMER}],
    ["Receivables/Customer360/Money", {customerPartyId: CUSTOMER, lastStandalone: "true"}],
    ["Receivables/StatementPrint", {customerPartyId: CUSTOMER, includeZeroBalance: "Y", showStatements: "Y"}],
    ["Receivables/ReceivablesWorkbench", {partyId: CUSTOMER}],
    ["Payables/BillDetail", {recordId: other.bill}],
    ["Payables/BillDetail/Match", {recordId: other.bill, lastStandalone: "true"}],
    ["Payables/LandedCosts", {invoiceId: other.bill}],
    ["Payables/Supplier360", {supplierPartyId: SUPPLIER}],
    ["Payables/Supplier360/Bills", {supplierPartyId: SUPPLIER, lastStandalone: "true"}],
    ["Payables/PayablesWorkbench", {partyId: SUPPLIER}],
    ["Payments/PaymentDetail", {recordId: other.payment}],
    ["Payments/PaymentPrint", {paymentId: other.payment, outputType: "receipt"}],
    ["Payments/GatewayTransactions", {paymentId: other.payment}],
    ["GeneralLedger/JournalEntryDetail", {recordId: other.entry}],
    ["Records/OrderDetail", {orderId: other.order}],
    ["Records/ShipmentDetail", {shipmentId: other.shipment}],
    ["Records/ReturnDetail", {returnId: other.returnId}],
    ["FixedAssets/EquipmentDetail", {assetId: other.asset}],
    ["Banking/BankAccountDetail", {paymentMethodId: other.bank}],
    ["Banking/FinancialAccountDetail", {finAccountId: other.finAccount}],
    ["Reports/PartnerLedger", {partyId: CUSTOMER}]
]
// Chatter and RecordFiles (their terminal twins, which render the record's title, notes and files) on each foreign record
const recordMounts = [
    ["mantle.account.invoice.Invoice", other.invoice],
    ["mantle.account.invoice.Invoice", other.bill],
    ["mantle.account.payment.Payment", other.payment],
    ["mantle.ledger.transaction.AcctgTrans", other.entry],
    ["mantle.account.method.PaymentMethod", other.bank]
]
// The Accounting drop-downs (the choice names the screens use)
const choiceNames = ("accountCategories accountGroups accountParents accounts allOrganizations assetClasses assets bankAccountTypes " +
    "bankAccounts bankLineCandidates batches budgetPeriods budgetRevisions budgets categories collectionInvoices collectors " +
    "costCenters currencies depositReceipts drafts facilities financialTypes fixedAssets groups internalTransferFeeAccounts " +
    "internalTransferMethods invoices bills journals organizations parties paymentGatewayProviders paymentParties payments periods " +
    "products projects purchaseOrders receivableCredits reviewedCounterpartyPaymentMethods reviewedInvoiceAttachments " +
    "reviewedOrganizationPaymentMethods reviewedPaymentApplications reviewedPaymentEvidence roles runBankAccounts " +
    "settlementAdjustmentAccounts settlementAdjustmentInvoices settlementSources settlementTargets stores taxAuthorities taxGateways " +
    "taxPeriods templateInvoices terms unassignedAccounts users").split(" ")

let fixtures, gatewayPaymentId
function as(group, run, enabled = true) {
    return lib.asUser(userOf(group), run, enabled)
}
function render(root, path, parameters, mode = "html") {
    let result
    try {
        result = ec.screen
            .makeTest()
            .rootScreen(`component://mr-boss/screen/${root}.xml`)
            .renderMode(mode)
            .render(path, Object.assign({lastStandalone: "-2"}, parameters), null)
    } catch (error) {
        result = {status: 0, output: "", errorMessages: [String(error.message)]}
    }
    ec.message.clearErrors()
    const output = String(result.output || "")
    return {status: result.status, output, errors: Array.from(result.errorMessages || []).join(" | ")}
}
function accounting(path, parameters, mode = "html") {
    return render("Accounting", path, Object.assign({organizationPartyId: ORG}, parameters), mode)
}
// A call with artifact authorization disabled, as an import, another mount or a scheduled job makes it, in its own
// transaction: the refusal's message, or "" when it is not refused. Only calls expected to be refused are made, and the
// non-mutating ones of the permitted users, so nothing stays.
function attempt(service, parameters) {
    ec.message.pushErrors()
    try {
        ec.service.sync().name(service).parameters(parameters).disableAuthz().requireNewTransaction(true).call()
        return ec.message.hasError() ? ec.message.getErrorsString() : ""
    } catch (error) {
        return String(error.message)
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}
// a service the user may call with authorization disabled, as the palette and the screens call it
const read = (service, parameters) => ec.service.sync().name(service).parameters(parameters).disableAuthz().call() || {}
// refused for want of the permission, not for a bad request
const permissionRefusal = message => /PERMISSION_DENIED|ACCESS_DENIED|authority is required/.test(message)
// refused for the organization or the record
const recordRefusal = message =>
    /ORGANIZATION_DENIED|ORGANIZATION_REQUIRED|UNAVAILABLE|not available|PERMISSION_DENIED|ACCESS_DENIED|authority is required/.test(
        message
    )

spec({
    setupSpec() {
        login("john.doe")
        ec.artifactExecution.disableAuthz()
        fixtures = lib.routeFixtures()
        const now = ec.user.nowTimestamp
        for (const [partyId, name, role] of [
            [OTHER, "P21 Other Company", "OrgInternal"],
            [CUSTOMER, "P21 Other Customer", "Customer"],
            [SUPPLIER, "P21 Other Supplier", "Supplier"]
        ]) {
            store("mantle.party.Party", {partyId, partyTypeEnumId: "PtyOrganization"})
            store("mantle.party.Organization", {partyId, organizationName: name})
            store("mantle.party.PartyRole", {partyId, roleTypeId: role})
        }
        store("mantle.account.invoice.Invoice", {invoiceId: other.invoice, invoiceTypeEnumId: "InvoiceSales",
            statusId: "InvoiceFinalized", fromPartyId: OTHER, toPartyId: CUSTOMER, currencyUomId: "USD", invoiceDate: now,
            description: "P21 secret invoice"})
        store("mantle.account.invoice.InvoiceItem", {invoiceId: other.invoice, invoiceItemSeqId: "01",
            itemTypeEnumId: "ItemProduct", quantity: 1, amount: 77.77, description: "P21 secret invoice line"})
        store("mantle.account.invoice.InvoiceContent", {invoiceContentId: "BOSS_P21_INVOICE_FILE", invoiceId: other.invoice,
            contentLocation: "dbresource://p21/secret-invoice.txt", description: "P21 secret invoice file"})
        store("mantle.account.invoice.Invoice", {invoiceId: other.bill, invoiceTypeEnumId: "InvoiceSales",
            statusId: "InvoiceReceived", fromPartyId: SUPPLIER, toPartyId: OTHER, currencyUomId: "USD", invoiceDate: now,
            referenceNumber: "P21 secret bill ref", description: "P21 secret bill"})
        store("mantle.account.payment.Payment", {paymentId: other.payment, paymentTypeEnumId: "PtInvoicePayment",
            paymentInstrumentEnumId: "PiCompanyCheck", statusId: "PmntDelivered", fromPartyId: CUSTOMER, toPartyId: OTHER,
            amount: 77.77, amountUomId: "USD", effectiveDate: now, paymentRefNum: "P21SECRET", comments: "P21 secret payment"})
        store("mantle.ledger.transaction.AcctgTrans", {acctgTransId: other.entry, organizationPartyId: OTHER,
            acctgTransTypeEnumId: "AttInternal", isPosted: "N", amountUomId: "USD", transactionDate: now,
            description: "P21 secret entry"})
        store("mantle.order.OrderHeader", {orderId: other.order, orderName: "P21 secret order", statusId: "OrderApproved",
            currencyUomId: "USD", entryDate: now})
        store("mantle.order.OrderPart", {orderId: other.order, orderPartSeqId: "01", vendorPartyId: SUPPLIER,
            customerPartyId: OTHER, statusId: "OrderApproved", partName: "P21 secret order part"})
        store("mantle.shipment.Shipment", {shipmentId: other.shipment, shipmentTypeEnumId: "ShpTpPurchase",
            statusId: "ShipDelivered", fromPartyId: SUPPLIER, toPartyId: OTHER, handlingInstructions: "P21 secret shipment"})
        store("mantle.order.return.ReturnHeader", {returnId: other.returnId, statusId: "ReturnRequested",
            customerPartyId: CUSTOMER, vendorPartyId: OTHER, entryDate: now, supplierRmaId: "P21 secret return"})
        store("mantle.product.asset.Asset", {assetId: other.asset, assetTypeEnumId: "AstTpEquipment", ownerPartyId: OTHER,
            statusId: "AstAvailable", assetName: "P21 secret asset"})
        store("mantle.account.method.PaymentMethod", {paymentMethodId: other.bank, paymentMethodTypeEnumId: "PmtBankAccount",
            ownerPartyId: OTHER, description: "P21 secret bank"})
        store("mantle.account.method.BankAccount", {paymentMethodId: other.bank, bankName: "P21 secret bank name",
            routingNumber: "011000015", accountNumber: "98765432123"})
        store("mantle.account.financial.FinancialAccount", {finAccountId: other.finAccount, finAccountTypeId: "GiftCard",
            statusId: "FaActive", organizationPartyId: OTHER, ownerPartyId: CUSTOMER, finAccountName: "P21 secret stored value",
            currencyUomId: "USD"})
        // a promised customer payment through the demo gateway (AccountingPaymentGateway's), to authorize and capture
        gatewayPaymentId = ec.service.sync().name("mantle.account.PaymentServices.create#Payment").disableAuthz().parameters({
            fromPartyId: lib.ids.paymentPartyId, toPartyId: ORG, paymentTypeEnumId: "PtInvoicePayment",
            paymentInstrumentEnumId: "PiAch", paymentMethodId: "BOSS_ACCT_GW_CUSTOMER_BANK", toPaymentMethodId: "BOSS_ACCT_GW_BANK",
            paymentGatewayConfigId: "BOSS_ACCT_GW_TEST", amount: "12", amountUomId: "USD", statusId: "PmntPromised",
            effectiveDate: now}).call().paymentId
        for (const [document, key] of [
            ["MantleInvoice", {invoiceId: other.invoice}],
            ["MantleInvoice", {invoiceId: other.bill}],
            ["MantleInvoice", {invoiceId: "BOSS_ACCT_BILL"}],
            ["MantlePayment", {paymentId: other.payment}],
            ["MantleAcctgTrans", {acctgTransId: other.entry}],
            ["MantleAcctgTrans", {acctgTransId: "BOSS_ACCT_ENTRY"}]
        ])
            ec.search.indexDocuments(ec.entity.getDataDocuments(document, key))
        // a file on each own-organization record kind, for the record mounts of the groups that may not read it
        store("mantle.account.invoice.InvoiceContent", {invoiceContentId: "BOSS_P21_OWN_BILL_FILE", invoiceId: "BOSS_ACCT_BILL",
            contentLocation: "dbresource://p21/own-bill.txt", description: "P21 group file bill"})
        store("mantle.account.invoice.InvoiceContent", {invoiceContentId: "BOSS_P21_OWN_INVOICE_FILE",
            invoiceId: "BOSS_ACCT_INVOICE", contentLocation: "dbresource://p21/own-invoice.txt", description: "P21 group file invoice"})
        store("mantle.account.payment.PaymentContent", {paymentContentId: "BOSS_P21_OWN_PAY_FILE", paymentId: "BOSS_ACCT_PAY_DRAFT",
            contentLocation: "dbresource://p21/own-payment.txt", description: "P21 group file payment"})
        store("mantle.account.method.PaymentMethodContent", {paymentMethodContentId: "BOSS_P21_OWN_BANK_FILE",
            paymentMethodId: "BOSS_ACCT_BANK", contentLocation: "dbresource://p21/own-bank.txt", description: "P21 group file bank"})
        store("mantle.ledger.transaction.AcctgTransContent", {acctgTransContentId: "BOSS_P21_OWN_ENTRY_FILE",
            acctgTransId: "BOSS_ACCT_ENTRY", contentLocation: "dbresource://p21/own-entry.txt", description: "P21 group file entry"})
    },
    cleanupSpec() {
        ec.message.clearErrors()
        ec.artifactExecution.enableAuthz()
    }
})

feature("each group opens only its own sections by URL, and other app roots not at all", {
    when() {
        const problems = []
        const roots = ["Products", "Projects", "Sales", "Purchasing", "Warehouse", "CustomerService", "Manufacturing", "Admin"]
        for (const group of groups)
            as(group, () => {
                for (const [path, allowed] of Object.entries(sections)) {
                    const fixture = fixtures[path]
                    const page = accounting(path, fixture ? fixture.parameters : {})
                    const shown = page.status == 200 && !page.errors && (!fixture || page.output.includes(fixture.text))
                    if (allowed.includes(group) && !shown) problems.push(`${group} cannot open ${path}: ${page.status} ${page.errors}`)
                    if (!allowed.includes(group) && shown) problems.push(`${group} opens ${path}`)
                    if (!allowed.includes(group) && fixture && page.output.includes(fixture.text))
                        problems.push(`${group} sees ${path}'s ${fixture.text}`)
                }
                for (const root of roots) {
                    const page = render(root, "", {})
                    if (page.status == 200 && !page.errors) problems.push(`${group} opens the ${root} app`)
                }
            })
        if (problems.length) log.warn("Access walk problems:\n" + problems.join("\n"))
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("another organization chosen in the URL is refused on every screen for each group but finance administration", {
    when() {
        // a fixture text the screen shows whatever the organization: a heading or its not-available state
        const fixedText = path => ["Home", "Receivables/StatementPrint"].includes(path) || /not available/.test(fixtures[path].text)
        const problems = []
        const paths = Object.keys(fixtures).filter(path => !/\/(?:Overview|Items|Payments|Orders|Shipments|Budget|GeneralLedger|Files|Conversation|History|Contact|Money|Credit|Agreements|Activities|FinanceDetails|Holds|Bills|Terms|Applications|Gateway|Refunds|Review|Basis|OpeningBalances|OpenItems|Readiness|Activate)$/.test(path))
        for (const group of groups)
            as(group, () => {
                // finance administration works in every internal organization (AccountingPolicy): it is refused a party that is not one
                const organizationPartyId = group === "admin" ? CUSTOMER : OTHER
                for (const path of paths) {
                    const page = accounting(path, Object.assign({}, fixtures[path].parameters, {organizationPartyId}))
                    if (SECRET.test(page.output)) problems.push(`${group} sees the other organization on ${path}`)
                    else if (page.status == 200 && !page.errors && page.output.includes(fixtures[path].text) && !fixedText(path))
                        problems.push(`${group} opens ${path} for ${organizationPartyId}`)
                }
            })
        if (problems.length) log.warn("Access walk problems:\n" + problems.join("\n"))
        return {problems, count: paths.length}
    },
    then({problems, count}) {
        count > 60
        problems.join("\n") == ""
    }
})

feature("another organization's records stay hidden on the detail screens and shared mounts, as html and in the terminal", {
    when() {
        const problems = []
        for (const group of groups)
            as(group, () => {
                for (const [path, parameters] of foreignRoutes)
                    for (const mode of ["html", "tui"]) {
                        const page = accounting(path, parameters, mode)
                        if (SECRET.test(page.output)) problems.push(`${group} sees ${path} (${mode}) of the other organization`)
                    }
                for (const [root, base] of [["Accounting", "Accounting"], ["Commons", "Commons"], ["Comms", "Comms"]])
                    for (const [recordEntity, recordId] of recordMounts)
                        for (const twin of ["RecordFiles/RecordFilesTui", "Chatter/ChatterTui"]) {
                            const page = render(root, twin, {recordEntity, recordId}, "tui")
                            if (SECRET.test(page.output) || page.output.includes("P21 Other"))
                                problems.push(`${group} sees ${base}/${twin} of ${recordEntity} ${recordId}`)
                        }
            })
        if (problems.length) log.warn("Access walk problems:\n" + problems.join("\n"))
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("the Chatter and files of an own-organization record show only to the groups that read the record (F430)", {
    when() {
        // the groups that read each record: the invoice's and payment's own reads by their side, the journal's
        // (AccountingPolicy) and the bank's (check#BankAccess)
        const readers = {
            "mantle.account.invoice.Invoice BOSS_ACCT_BILL": ["ap", "match", "treasury", "gl", "read", "approve", "admin"],
            "mantle.account.invoice.Invoice BOSS_ACCT_INVOICE": ["ar", "gl", "read", "approve", "admin"],
            // a customer's receipt: the payment readers and AR; AP-side match reads only payable payments (paymentScope)
            "mantle.account.payment.Payment BOSS_ACCT_PAY_DRAFT": ["ar", "ap", "treasury", "gl", "read", "approve", "admin"],
            "mantle.account.method.PaymentMethod BOSS_ACCT_BANK": ["treasury", "gl", "read", "approve", "admin"],
            "mantle.ledger.transaction.AcctgTrans BOSS_ACCT_ENTRY": ["gl", "read", "approve", "admin"]
        }
        const problems = []
        const check = (who, allowed) => {
            for (const [record, groupList] of Object.entries(readers)) {
                const [recordEntity, recordId] = record.split(" ")
                for (const root of ["Commons", "Accounting"]) {
                    if (root === "Accounting" && who === "catalog.reader") continue
                    const files = render(root, "RecordFiles/RecordFilesTui", {recordEntity, recordId}, "tui")
                    const chatter = render(root, "Chatter/ChatterTui", {recordEntity, recordId}, "tui")
                    const sees = files.output.includes("P21 group file")
                    const title = !chatter.output.includes("This record is not available") && chatter.status == 200 && !chatter.errors
                    const may = allowed(groupList)
                    if (sees !== may) problems.push(`${who} ${may ? "does not see" : "sees"} the files of ${record} under ${root}`)
                    if (!may && title) problems.push(`${who} opens the Chatter of ${record} under ${root}`)
                }
            }
        }
        for (const group of groups) as(group, () => check(group, list => list.includes(group)))
        // a user of another app, in the demo organization's group of BOSS users, reads none of them
        lib.asUser("catalog.reader", () => check("catalog.reader", () => false), true, null)
        if (problems.length) log.warn("Access walk problems:\n" + problems.join("\n"))
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("exports and prints of each group hold only its organization's rows", {
    when() {
        const problems = []
        const exported = Object.keys(fixtures).filter(path => {
            const text = ec.resource.getLocationReference(`component://mr-boss/screen/Accounting/${path}.xml`)
            return text.getExists() && /show-csv-button="true"|html-print/.test(text.getText())
        })
        for (const group of groups)
            as(group, () => {
                for (const path of exported) {
                    const parameters = fixtures[path].parameters
                    for (const [mode, organizationPartyId] of [["csv", ORG], ["csv", OTHER], ["html-print", OTHER]]) {
                        const page = accounting(path, Object.assign({}, parameters, {organizationPartyId}), mode)
                        if (SECRET.test(page.output)) problems.push(`${group} exports the other organization from ${path} (${mode})`)
                    }
                }
            })
        if (problems.length) log.warn("Access walk problems:\n" + problems.join("\n"))
        return {problems, count: exported.length}
    },
    then({problems, count}) {
        count > 20
        problems.join("\n") == ""
    }
})

feature("search, the palette, record links and every drop-down keep each group to its records", {
    when() {
        const problems = []
        const partyIds = [CUSTOMER, SUPPLIER, OTHER]
        const selectedIds = Object.values(other).concat(partyIds)
        for (const group of groups)
            as(group, () => {
                const palette = read("ironstone.accounting.AccessServices.search#Records", {text: "P21 secret", limit: 20})
                if (JSON.stringify(palette.rows).match(SECRET)) problems.push(`${group} finds the other organization in the palette`)
                for (const [docType, id] of [
                    ["MantleInvoice", other.invoice],
                    ["MantleInvoice", other.bill],
                    ["MantlePayment", other.payment],
                    ["MantleAcctgTrans", other.entry]
                ]) {
                    const link = read("ironstone.commons.PaletteServices.get#RecordLink", {docType, id})
                    if (link.url) problems.push(`${group} has a link to ${id}`)
                    const found = read("mantle.search.UniversalSearchServices.search#Universal", {q: id, entityType: docType})
                    if (Array.from(found.results || []).length) problems.push(`${group} finds ${id} in search`)
                }
                // own-organization records of the other groups: AR does not find the bill, AP not the journal entry
                for (const [docType, id, readers] of [
                    ["MantleInvoice", "BOSS_ACCT_BILL", ["ap", "match", "treasury", "gl", "read", "approve", "admin"]],
                    ["MantleAcctgTrans", "BOSS_ACCT_ENTRY", ["gl", "read", "approve", "admin"]]
                ]) {
                    const link = read("ironstone.commons.PaletteServices.get#RecordLink", {docType, id})
                    if (link.url && !readers.includes(group)) problems.push(`${group} has a link to ${id}`)
                    const found = read("mantle.search.UniversalSearchServices.search#Universal", {q: id, entityType: docType})
                    if (Array.from(found.results || []).length && !readers.includes(group)) problems.push(`${group} finds ${id}`)
                }
                for (const choice of choiceNames) {
                    const calls = [{term: "P21"}].concat(["ar", "treasury", "read"].includes(group)
                        ? selectedIds.map(selected => ({selected})) : [])
                    for (const extra of calls) {
                        let options = []
                        try {
                            options = ec.service.sync().name("ironstone.accounting.AccessServices.get#Choices")
                                .parameters(Object.assign({choice, organizationPartyId: ORG}, extra)).call()?.options || []
                        } catch (error) {
                            options = []
                        }
                        ec.message.clearErrors()
                        const text = JSON.stringify(Array.from(options))
                        // parties are shared by the organizations (Mantle): a party's name is no record of the other one
                        const record = extra.selected && !partyIds.includes(extra.selected)
                        if (SECRET.test(text) || (record && text.includes(`"${extra.selected}"`)))
                            problems.push(`${group} gets ${choice} ${JSON.stringify(extra)}: ${text.substring(0, 160)}`)
                    }
                }
            })
        if (problems.length) log.warn("Access walk problems:\n" + problems.join("\n"))
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("imports into the other organization, or without their permission, are refused for each group", {
    when() {
        const problems = []
        const day = ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
        const statement = {formatEnumId: "SifCsv", statementText: "Date,Description,Amount\n" + day + ",Walk check,-1.00"}
        for (const group of groups)
            as(group, () => {
                const imports = [
                    // the other organization's bank account and organization: refused to everyone working only in the demo one
                    ["review#StatementImport", "mantle.account.ReconciliationServices.review#StatementImport",
                        Object.assign({paymentMethodId: other.bank}, statement), group !== "admin"],
                    ["import#Bill other", "mantle.account.InvoiceServices.import#Bill", {organizationPartyId: OTHER,
                        supplierPartyId: SUPPLIER, referenceNumber: "P21-WALK", amount: "1"}, group !== "admin"],
                    // the demo organization, without the permission
                    ["review#StatementImport own", "mantle.account.ReconciliationServices.review#StatementImport",
                        Object.assign({paymentMethodId: "BOSS_ACCT_BANK"}, statement), !["treasury", "admin"].includes(group)],
                    ["import#Bill own", "mantle.account.InvoiceServices.import#Bill", {organizationPartyId: ORG,
                        supplierPartyId: "BOSS_ACCT_SUPPLIER", referenceNumber: "P21-WALK", amount: "1"}, !["ap", "admin"].includes(group)],
                    ["import#OpenItems", "mantle.ledger.SetupServices.import#OpenItems", {organizationPartyId: ORG, verifyOnly: true,
                        csvText: "direction,partyId,documentNumber,documentDate,dueDate,openAmount\nreceivable,ORG_ACME,P21-1," + day
                            + "," + day + ",1"}, group !== "admin"],
                    ["import#Rates", "mantle.ledger.CurrencyServices.import#Rates", {organizationPartyId: ORG, changeReason: "Walk",
                        csvText: "uomId,toUomId,fromDate,thruDate,conversionFactor,rateSource\nEUR,USD," + day + ",,1.1,Walk"},
                        group !== "admin"]
                ]
                for (const [name, service, parameters, refused] of imports) {
                    // a permitted user's import would make a bill, a statement review or rates: only the check-only one runs
                    if (!refused && name !== "import#OpenItems") continue
                    const message = attempt(service, parameters)
                    if (refused && !recordRefusal(message)) problems.push(`${group} is not refused ${name}: ${message || "made"}`)
                    if (!refused && permissionRefusal(message)) problems.push(`${group} is refused ${name}: ${message}`)
                }
            })
        if (problems.length) log.warn("Access walk problems:\n" + problems.join("\n"))
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("each group is refused the other groups' actions for their permission, with artifact authorization off", {
    when() {
        const problems = []
        const day = ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
        // [the permission the Mantle service checks, service, parameters on the demo organization's records]
        const actions = [
            ["RECEIVABLE_EDIT", "mantle.ledger.AccountingServices.create#DraftDocument",
                {kind: "invoices", organizationPartyId: ORG, otherPartyId: "ORG_ACME", description: "P21 walk"}],
            ["PAYABLE_EDIT", "mantle.ledger.AccountingServices.create#DraftDocument",
                {kind: "bills", organizationPartyId: ORG, otherPartyId: "BOSS_ACCT_SUPPLIER", description: "P21 walk"}],
            ["PAYMENT_EDIT", "mantle.ledger.AccountingServices.create#DraftDocument",
                {kind: "payments", organizationPartyId: ORG, otherPartyId: "BOSS_ACCT_SUPPLIER", amount: 1, currencyUomId: "USD"}],
            ["ACCOUNTING_GL_POST", "mantle.ledger.JournalServices.store#DraftEntry", {organizationPartyId: ORG, description: "P21 walk"}],
            ["BANK_RECONCILE", "mantle.account.ReconciliationServices.review#StatementImport", {paymentMethodId: "BOSS_ACCT_BANK",
                formatEnumId: "SifCsv", statementText: "Date,Description,Amount\n" + day + ",Walk,-1.00"}],
            ["TAX_STATEMENT_EDIT", "mantle.other.TaxServices.create#SalesTaxStatement",
                {organizationPartyId: ORG, taxAuthorityId: "BOSS_ACCT_UT", timePeriodId: lib.ids.closePeriodId}],
            ["FISCAL_CLOSE", "mantle.ledger.CloseServices.close#Period", {organizationPartyId: ORG, timePeriodId: lib.ids.closePeriodId}],
            ["ACCOUNTING_ADMIN", "mantle.ledger.SetupServices.store#Preferences",
                {organizationPartyId: ORG, settings: {invoiceIdPrefix: "P21"}, changeReason: "Walk"}],
            ["INVOICE_HOLD", "mantle.account.InvoiceServices.hold#Invoice",
                {invoiceId: "BOSS_ACCT_BILL", organizationPartyId: ORG, holdReasonEnumId: "IhrApReview"}],
            ["INVOICE_MATCH", "mantle.account.InvoiceMatchServices.apply#InvoiceMatch",
                {invoiceId: "BOSS_ACCT_BILL_MATCH", organizationPartyId: ORG, allocationList: [{invoiceItemSeqId: "01", quantity: 1}]}],
            ["PAYABLE_IMPORT", "mantle.account.InvoiceServices.import#Bill",
                {organizationPartyId: ORG, supplierPartyId: "BOSS_ACCT_SUPPLIER", referenceNumber: "P21-ACTION", amount: "1"}]
        ]
        for (const group of groups)
            as(group, () => {
                for (const [permission, service, parameters] of actions) {
                    if (ec.user.hasPermission(permission)) continue
                    const message = attempt(service, parameters)
                    if (!permissionRefusal(message)) problems.push(`${group} without ${permission}: ${service} ${message || "made"}`)
                }
                // design §16.3: only treasury and finance administration may send a gateway payment to authorize or capture;
                // the others are offered no action, for want of the permission, and the preview is refused
                const gatewayPayment = {organizationPartyId: ORG, paymentId: gatewayPaymentId}
                // a reader of another side is refused the payment itself; a reader of it is offered no action
                const unreadable = attempt("mantle.account.PaymentServices.get#PaymentGatewayActions", gatewayPayment)
                const gateway = unreadable ? {reasonCode: unreadable}
                    : read("mantle.account.PaymentServices.get#PaymentGatewayActions", gatewayPayment)
                const offered = Array.from(gateway.actionList || [])
                if (ec.user.hasPermission("PAYMENT_EDIT")) {
                    if (!offered.includes("authorize")) problems.push(`${group} is not offered the gateway authorization`)
                } else {
                    if (offered.length || !/PERMISSION_DENIED|PAYMENT_UNAVAILABLE/.test(gateway.reasonCode))
                        problems.push(`${group} is offered gateway actions: ${offered} ${gateway.reasonCode}`)
                    for (const action of ["authorize", "capture"]) {
                        const message = attempt("mantle.account.PaymentServices.preview#PaymentGatewayAction",
                            Object.assign({action, reason: "Walk"}, gatewayPayment))
                        if (!message) problems.push(`${group} previews a gateway ${action}`)
                    }
                }
            })
        if (problems.length) log.warn("Access walk problems:\n" + problems.join("\n"))
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("bank credentials stay masked for the groups that read the bank, and REST reaches no finance record", {
    when() {
        const problems = []
        const number = ec.entity.find("mantle.account.method.BankAccount").condition("paymentMethodId", lib.ids.bankPaymentMethodId)
            .disableAuthz().one()?.accountNumber
        for (const group of groups)
            as(group, () => {
                for (const path of ["Banking/BankAccounts", "Banking/BankAccountDetail"]) {
                    const page = accounting(path, {paymentMethodId: lib.ids.bankPaymentMethodId})
                    if (number && page.output.includes(number)) problems.push(`${group} sees the bank account number on ${path}`)
                }
                for (const [path, method] of [
                    ["s1/mantle/invoices/" + other.invoice, "get"],
                    ["s1/mantle/invoices/BOSS_ACCT_BILL", "get"],
                    ["s1/mantle/payments/" + other.payment, "get"],
                    ["s1/mantle/gl/trans", "get"],
                    ["e1/mantle.account.invoice.Invoice/" + other.invoice, "get"],
                    ["e1/mantle.account.method.BankAccount", "get"],
                    ["e1/mantle.ledger.transaction.AcctgTrans", "get"],
                    ["s1/mantle/invoices", "post"],
                    ["s1/mantle/payments", "post"]
                ]) {
                    let status
                    try {
                        status = ec.screen.makeTest().rootScreen("component://webroot/screen/webroot/rest.xml")
                            .render(path, {}, method).status
                    } catch (error) {
                        status = 403
                    }
                    ec.message.clearErrors()
                    if (![401, 403].includes(status)) problems.push(`${group} REST ${method} ${path}: ${status}`)
                }
            })
        if (problems.length) log.warn("Access walk problems:\n" + problems.join("\n"))
        return {problems, number}
    },
    then({problems, number}) {
        number != null
        problems.join("\n") == ""
    }
})
