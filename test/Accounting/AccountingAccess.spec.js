// The Accounting access rules, each feature with artifact authorization on: who opens the app, the organization scope,
// another organization's records, and each permission's refused write paired with its holder's success on the same
// request (or a refusal after the permission, named by its reason code). The walk over every route and group is the
// acceptance AccountingAccessWalk; the screens' content is rendered by the specs that own their logic.
const lib = ec.resource.script("component://mr-boss/test/Accounting/AccountingSpecLib.js")
const ids = lib.ids
const org = ids.organizationPartyId
const as = (user, run, organizationPartyId) => lib.asUser(user, run, true, organizationPartyId)
const T = "mantle.ledger.transaction.AcctgTrans",
    INVOICE = "mantle.account.invoice.Invoice",
    PAYMENT = "mantle.account.payment.Payment"
const invoke = (name, p = {}) => ec.service.sync().name(name).parameters(p).disableAuthz().call() || {}

spec({
    setupSpec() {
        // another internal organization with an invoice, a payment and an entry with a file, none of them Corp's
        login("john.doe")
        ec.artifactExecution.disableAuthz()
        invoke("create#mantle.party.Party", {partyId: "BOSS_FIN_OUTSIDE", partyTypeEnumId: "PtyOrganization"})
        invoke("create#mantle.party.Organization", {
            partyId: "BOSS_FIN_OUTSIDE",
            organizationName: "Unrelated financial organization"
        })
        invoke("create#mantle.party.PartyRole", {partyId: "BOSS_FIN_OUTSIDE", roleTypeId: "OrgInternal"})
        invoke("create#" + INVOICE, {
            invoiceId: "BOSS_ISO_INVOICE",
            invoiceTypeEnumId: "InvoiceSales",
            statusId: "InvoiceInProcess",
            fromPartyId: "BOSS_FIN_OUTSIDE",
            toPartyId: "_NA_",
            currencyUomId: "USD",
            description: "Secret finance isolation"
        })
        invoke("create#" + PAYMENT, {
            paymentId: "BOSS_ISO_PAYMENT",
            paymentTypeEnumId: "PtDisbursement",
            paymentInstrumentEnumId: "PiOther",
            statusId: "PmntProposed",
            fromPartyId: "BOSS_FIN_OUTSIDE",
            toPartyId: "_NA_",
            amount: 42,
            amountUomId: "USD"
        })
        invoke("create#" + T, {
            acctgTransId: "BOSS_ISO_ENTRY",
            organizationPartyId: "BOSS_FIN_OUTSIDE",
            acctgTransTypeEnumId: "AttInternal",
            isPosted: "N",
            amountUomId: "USD",
            transactionDate: ec.user.nowTimestamp,
            description: "Secret finance isolation"
        })
        invoke("create#mantle.ledger.transaction.AcctgTransContent", {
            acctgTransContentId: "BOSS_ISO_FILE",
            acctgTransId: "BOSS_ISO_ENTRY",
            contentLocation: "dbresource://finance-isolation.txt",
            contentTypeEnumId: "AtctEvidence"
        })
        for (const [document, key] of [
            ["MantleInvoice", {invoiceId: "BOSS_ISO_INVOICE"}],
            ["MantlePayment", {paymentId: "BOSS_ISO_PAYMENT"}],
            ["MantleAcctgTrans", {acctgTransId: "BOSS_ISO_ENTRY"}],
            ["MantleGlAccount", {glAccountId: "111100000"}]
        ])
            ec.search.indexDocuments(ec.entity.getDataDocuments(document, key))
    }
})

// The message a call is refused with, or "" when it succeeds (artifact authz off for the call itself, so the service's
// own permission check is what refuses).
function refusal(service, p) {
    ec.message.pushErrors()
    try {
        ec.service.sync().name(service).parameters(p).disableAuthz().requireNewTransaction(true).call()
        return ec.message.hasError() ? ec.message.getErrorsString() : ""
    } catch (error) {
        return String(error.message)
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}
// The rows that do not hold, one line each: [name, actual, expected], where expected "" is a success (an empty
// refusal), true a condition, a RegExp a pattern and any other text a text the refusal must contain.
function mismatches(rows) {
    const holds = (actual, expected) =>
        expected === ""
            ? actual === ""
            : expected === true
              ? actual === true
              : expected instanceof RegExp
                ? expected.test(String(actual))
                : String(actual).includes(expected)
    return rows
        .filter(([, actual, expected]) => !holds(actual, expected))
        .map(
            ([name, actual, expected]) =>
                name + ": expected " + (expected === "" ? "success" : String(expected)) + ", got " + actual
        )
        .join("\n")
}
const denied = "PERMISSION_DENIED"
const admin = "admin authority is required"
// a render refused for the user's grants, not one that opened with less on it
const refusedRender = page => page.status != 200 && page.errors.some(error => /not authorized/.test(error))

feature("who opens Accounting: its launcher for a finance reader, its reads by the view permissions, no Mantle REST writes", {
    when() {
        const shell = () => {
            const rendered = ec.screen
                .makeTest()
                .rootScreen("component://webroot/screen/webroot.xml")
                .render("shellData", {}, null)
            return {status: rendered.status, apps: rendered.status == 200 ? JSON.parse(rendered.output).apps : []}
        }
        const reader = as("finance.read", () => ({
            shell: shell(),
            access: invoke("mantle.ledger.AccountingServices.get#Access")
        }))
        // the GL operator's Accounting grants do not reach the Mantle REST mutators
        const rest = as("finance.gl", () =>
            ["s1/mantle/gl/trans", "s1/mantle/invoices", "s1/mantle/payments"].map(path => {
                const rendered = ec.screen
                    .makeTest()
                    .rootScreen("component://webroot/screen/webroot/rest.xml")
                    .render(path, {organizationPartyId: org}, "post")
                ec.message.clearErrors()
                return path + " " + rendered.status
            })
        )
        // the same products reader, first in a group named for projects, then with RECEIVABLE_VIEW alone
        const groupId = "BOSS_SPEC_RECEIVABLE_VIEW"
        const readerId = "BOSS_PRD_READER"
        const make = (entity, fields) =>
            ec.service
                .sync()
                .name("create#" + entity)
                .parameters(fields)
                .disableAuthz()
                .call()
        const remove = (entity, conditions) => ec.entity.find(entity).condition(conditions).disableAuthz().deleteAll()
        const reach = () => ({
            read: ec.resource.script("component://mr-mantle/service/mantle/ledger/AccountingPolicy.js").capabilities().read,
            link:
                invoke("ironstone.commons.PaletteServices.get#RecordLink", {docType: "MantleInvoice", id: ids.invoiceId}).url ||
                "",
            list: refusal("mantle.ledger.AccountingServices.find#Records", {kind: "invoices"}),
            shell: shell()
        })
        make("mantle.party.PartyRelationship", {
            partyRelationshipId: "BOSS_SPEC_READER_CORP",
            relationshipTypeEnumId: "PrtAgent",
            fromPartyId: readerId,
            toPartyId: org,
            toRoleTypeId: "OrgInternal",
            fromDate: 0
        })
        make("moqui.security.UserGroup", {userGroupId: groupId, description: "Receivables view by permission alone"})
        try {
            make("moqui.security.UserGroupMember", {userGroupId: "BOSS_PROJECT_MANAGER", userId: readerId, fromDate: 0})
            const manager = as("catalog.reader", reach)
            remove("moqui.security.UserGroupMember", {userGroupId: "BOSS_PROJECT_MANAGER", userId: readerId})
            make("moqui.security.UserGroupPermission", {userGroupId: groupId, userPermissionId: "RECEIVABLE_VIEW", fromDate: 0})
            make("moqui.security.UserGroupMember", {userGroupId: groupId, userId: readerId, fromDate: 0})
            const viewer = as("catalog.reader", reach)
            return {reader, rest, manager, viewer}
        } finally {
            remove("moqui.security.UserGroupMember", {userId: readerId, userGroupId: groupId})
            remove("moqui.security.UserGroupMember", {userId: readerId, userGroupId: "BOSS_PROJECT_MANAGER"})
            remove("moqui.security.UserGroupPermission", {userGroupId: groupId})
            remove("moqui.security.UserGroup", {userGroupId: groupId})
            remove("mantle.party.PartyRelationship", {partyRelationshipId: "BOSS_SPEC_READER_CORP"})
        }
    },
    then({reader, rest, manager, viewer}) {
        reader.shell.status == 200
        const app = reader.shell.apps.find(app => app.name === "Accounting")
        !!app
        app.providers.quickCreate.length == 0
        !reader.shell.apps.some(app => ["Products", "Projects", "Warehouse", "Purchasing"].includes(app.name))
        reader.access.capabilities.reportRead == true
        reader.access.capabilities.glPost == false
        rest.filter(row => !/ 40[13]$/.test(row)) == []
        manager.read == false
        manager.link == ""
        manager.list != ""
        !manager.shell.apps.some(app => app.name === "Accounting")
        viewer.read == true
        viewer.link.includes("Accounting/Receivables/InvoiceDetail")
        viewer.list == ""
    }
})

feature("the organization scope: AR's reads of the selected organization pass, of another are refused, and AP has none", {
    when() {
        const reads = [
            ["mantle.account.InvoiceServices.get#InvoiceFinanceDetail", {invoiceId: ids.invoiceId}],
            ["mantle.account.InvoiceServices.find#Receivables", {}],
            ["mantle.account.InvoiceServices.get#ReceivableSummary", {}],
            ["mantle.account.InvoiceServices.get#InvoiceOutput", {invoiceId: ids.finalizedInvoiceId}],
            ["mantle.account.InvoiceServices.find#ApprovedTimeBilling", {}],
            ["mantle.account.CustomerFinanceServices.get#CustomerFinance", {customerPartyId: ids.customerPartyId}],
            ["ironstone.accounting.ReceivableServices.get#InvoiceContext", {invoiceId: ids.invoiceId}],
            ["ironstone.accounting.ReceivableServices.find#Invoices", {}],
            ["ironstone.accounting.ReceivableServices.get#BillingQueue", {}],
            ["ironstone.accounting.ReceivableServices.get#CustomerContext", {customerPartyId: ids.customerPartyId}],
            [
                "mantle.account.InvoiceServices.get#InvoiceDeliveryAttachments",
                {invoiceId: ids.finalizedInvoiceId, attachmentContentIdList: ["BOSS_ACCT_AR_SUPPORT"]}
            ]
        ]
        const rows = as("finance.ar", () =>
            reads.flatMap(([service, p]) => [
                [service + " own", refusal(service, {...p, organizationPartyId: org}), ""],
                [
                    service + " other",
                    refusal(service, {...p, organizationPartyId: ids.foreignOrganizationPartyId}),
                    /organization/i
                ]
            ])
        )
        // the same valid requests, refused to AP for its permissions (the attachments are the next feature's)
        const ap = as("finance.ap", () =>
            reads
                .slice(0, -1)
                .map(([service, p]) => [service + " as AP", refusal(service, {...p, organizationPartyId: org}), denied])
        )
        // the reader's own records through the calls that refuse another organization's
        const own = as("finance.read", () =>
            [
                ["invoices", "BOSS_ACCT_INVOICE", "MantleInvoice"],
                ["payments", "BOSS_ACCT_PAYMENT", "MantlePayment"],
                ["journals", "BOSS_ACCT_ENTRY", "MantleAcctgTrans"]
            ].flatMap(([kind, id, type]) => [
                [
                    kind + " list",
                    invoke("mantle.ledger.AccountingServices.find#Records", {kind, text: id}).records.some(row =>
                        Object.values(row).includes(id)
                    ),
                    true
                ],
                [kind + " link", !!invoke("ironstone.commons.PaletteServices.get#RecordLink", {docType: type, id}).url, true],
                [kind + " record", refusal("mantle.ledger.AccountingServices.get#Record", {kind, recordId: id}), ""]
            ])
        )
        return {problems: mismatches(rows.concat(ap, own))}
    },
    then({problems}) {
        problems == ""
    }
})

feature("another organization's records are refused in lists, exports, search, links, files, reports and record reads", {
    when() {
        const content = ec.entity
            .find("mantle.ledger.transaction.AcctgTransContent")
            .condition("acctgTransContentId", "BOSS_ISO_FILE")
            .disableAuthz()
            .one()
        const fileInfo = () =>
            refusal("mantle.party.CommunicationServices.get#RecordLinkInfo", {
                recordEntityName: "mantle.ledger.transaction.AcctgTransContent",
                recordId: "BOSS_ISO_FILE"
            })
        // the administrator with the file's own organization selected sees it; the reader is scoped to Corp
        const owner = lib.asUser("john.doe", fileInfo, true, "BOSS_FIN_OUTSIDE")
        const access = /not available|authority is required|not permitted|not authorized/i
        const rows = as("finance.read", () => {
            const rows = [
                ["the other organization's file", fileInfo(), /not found|not available/],
                [
                    "the other organization's general ledger",
                    refusal("mantle.ledger.FinanceReportServices.run#GeneralLedger", {organizationPartyId: "BOSS_FIN_OUTSIDE"}),
                    access
                ],
                [
                    "an account read of another organization",
                    refusal("mantle.ledger.AccountingServices.get#Record", {
                        kind: "accounts",
                        recordId: "110000",
                        organizationPartyId: ids.foreignOrganizationPartyId
                    }),
                    "not available"
                ]
            ]
            for (const [kind, id, type, path] of [
                ["invoices", "BOSS_ISO_INVOICE", "MantleInvoice", "Receivables/Invoices"],
                ["payments", "BOSS_ISO_PAYMENT", "MantlePayment", "Payments/Payments"],
                ["journals", "BOSS_ISO_ENTRY", "MantleAcctgTrans", "GeneralLedger/JournalEntries"]
            ]) {
                const csv = ec.screen
                    .makeTest()
                    .rootScreen("component://mr-boss/screen/Accounting.xml")
                    .renderMode("csv")
                    .withStaticData()
                    .render(path, {organizationPartyId: org, text: "BOSS_ISO", lastStandalone: "-2"}, null)
                rows.push(
                    [
                        kind + " list",
                        invoke("mantle.ledger.AccountingServices.find#Records", {kind, text: "BOSS_ISO"}).records.length === 0,
                        true
                    ],
                    [kind + " link", !invoke("ironstone.commons.PaletteServices.get#RecordLink", {docType: type, id}).url, true],
                    [
                        kind + " search",
                        invoke("mantle.search.UniversalSearchServices.search#Universal", {q: "BOSS_ISO", entityType: type})
                            .results.length === 0,
                        true
                    ],
                    [kind + " csv", csv.status == 200 && !String(csv.output).includes(id), true],
                    [kind + " record", refusal("mantle.ledger.AccountingServices.get#Record", {kind, recordId: id}), access]
                )
            }
            return rows
        })
        return {
            problems: mismatches(
                rows.concat([
                    ["the file exists", content?.acctgTransId === "BOSS_ISO_ENTRY", true],
                    ["its owner sees it", owner, ""]
                ])
            )
        }
    },
    then({problems}) {
        problems == ""
    }
})

feature(
    "ledger, close, tax, budget, asset, setup and report writes: each refused for the permission, the same request passes it for the holder",
    {
        when() {
            const draft = {organizationPartyId: org, description: "Access spec draft"}
            const preferences = {organizationPartyId: org}
            const rate = {
                organizationPartyId: org,
                uomId: "USD",
                toUomId: "EUR",
                conversionFactor: 1,
                fromDate: ec.user.nowTimestamp,
                rateSource: "test",
                changeReason: "Access spec"
            }
            const term = {
                organizationPartyId: org,
                description: "Access spec term",
                termValue: 30,
                termValueUomId: "TF_day",
                changeReason: "Access spec"
            }
            // a copy of the European Central Bank's daily file, so the provider reads it instead of the network
            const providerRates = {
                organizationPartyId: org,
                uomIdList: ["EUR"],
                sourceText: "<Cube><Cube time='2026-01-05'><Cube currency='USD' rate='1.04'/></Cube></Cube>"
            }
            const period = {organizationPartyId: org, timePeriodId: ids.closePeriodId}
            const reopen = {...period, changeReason: "Access check"}
            const periodRun = {...period, runKindEnumId: "PrkProjectCost"}
            const taxRate = {
                organizationPartyId: org,
                taxAuthorityRateId: "BOSS_ACCT_UT_2020",
                thruDate: "2019-06-01 00:00:00",
                changeReason: "Access spec"
            }
            const vendor1099 = {organizationPartyId: org, timePeriodId: "_NA_"}
            const landed = {
                organizationPartyId: org,
                invoiceId: "BOSS_ACCT_BILL_FREIGHT",
                invoiceItemSeqId: "01",
                assetReceiptIds: "_NA_",
                inputFingerprint: "stale",
                operationKey: "ACCESS-P13",
                changeReason: "Access spec"
            }
            const productRepair = {
                organizationPartyId: org,
                productId: "_NA_",
                acquireCost: 1,
                changeReason: "Access spec",
                operationKey: "ACCESS-P13-R"
            }
            const budget = {budgetId: "BOSS_ACCT_BUDGET"}
            const revision = {...budget, lines: [{glAccountId: "_NA_", amount: 1}], changeReason: "Access spec"}
            const budgetRule = {
                organizationPartyId: org,
                actionEnumId: "BcaStop",
                thresholdPercent: 0,
                changeReason: "Access spec"
            }
            const capitalize = {assetId: "BOSS_ACCT_FA_VAN", acquireCostUomId: "EUR", operationKey: "access-fa-cap"}
            const assetClass = {organizationPartyId: org, classEnumId: "AsClsLaptop", usefulLifeYears: 0, changeReason: "Access"}
            const assetRepair = {
                assetId: "BOSS_ACCT_FA_VAN",
                acquireCost: "-1",
                changeReason: "Access",
                operationKey: "access-fa-fix"
            }
            const newco = "BOSS_ACCT_NEWCO"
            const setupRead = {organizationPartyId: newco}
            const setupStore = {organizationPartyId: newco, runVersion: -1, openingDate: "2026-01-01"}
            const setupItems = {organizationPartyId: newco, rows: [], verifyOnly: true}
            const activate = {organizationPartyId: newco, runVersion: -1, operationKey: "SETUP-ACCESS"}
            const reports = [
                ["ironstone.accounting.ReportServices.get#Statement", {organizationPartyId: org, statement: "balanceSheet"}],
                ["ironstone.accounting.ReportServices.get#Statement", {organizationPartyId: org, statement: "accountBalance"}],
                ["mantle.ledger.LedgerReportServices.run#PartnerLedger", {organizationPartyId: org}],
                ["mantle.ledger.LedgerReportServices.run#PostedAmountSummary", {organizationPartyId: org}],
                ["mantle.sales.SalesReportServices.run#SalesAnalysis", {organizationPartyId: org}]
            ]
            const ledger = "mantle.ledger."
            const books = "mantle.ledger.AssetBookServices."
            const setup = "mantle.ledger.SetupServices."
            // [name, user, service, parameters, expected]: a holder's "" or reason code after the permission, else the refusal
            const cases = [
                [
                    "draft entry",
                    "finance.read",
                    ledger + "JournalServices.store#DraftEntry",
                    draft,
                    "glPost authority is required"
                ],
                ["draft entry", "finance.gl", ledger + "JournalServices.store#DraftEntry", draft, ""],
                ["preferences read", "finance.read", setup + "get#Preferences", preferences, admin],
                ["preferences read", "finance.admin", setup + "get#Preferences", preferences, ""],
                [
                    "preferences store",
                    "finance.gl",
                    setup + "store#Preferences",
                    {organizationPartyId: org, settings: {invoiceIdPrefix: "BAD"}, changeReason: "Denied"},
                    admin
                ],
                ["rate", "finance.gl", ledger + "CurrencyServices.store#Rate", rate, admin],
                ["rate", "finance.admin", ledger + "CurrencyServices.store#Rate", rate, ""],
                ["term", "finance.gl", setup + "store#SettlementTerm", term, admin],
                ["term", "finance.admin", setup + "store#SettlementTerm", term, ""],
                ["rate refresh", "finance.gl", ledger + "CurrencyServices.refresh#Rates", providerRates, admin],
                ["rate refresh", "finance.admin", ledger + "CurrencyServices.refresh#Rates", providerRates, ""],
                [
                    "rate proposals",
                    "finance.gl",
                    ledger + "CurrencyServices.get#RateProposals",
                    {organizationPartyId: org},
                    admin
                ],
                [
                    "rate proposals",
                    "finance.admin",
                    ledger + "CurrencyServices.get#RateProposals",
                    {organizationPartyId: org},
                    ""
                ],
                [
                    "rate accept",
                    "finance.gl",
                    ledger + "CurrencyServices.accept#RateProposals",
                    {organizationPartyId: org, rateProposalIdList: ["ACCESS_SPEC_NONE"]},
                    admin
                ],
                // the close stops at the demo period's blockers, the reopen at the open period
                ["period close", "finance.gl", ledger + "CloseServices.close#Period", period, denied],
                ["period close", "finance.approve", ledger + "CloseServices.close#Period", period, "CLOSE_BLOCKED"],
                ["period reopen", "finance.approve", ledger + "CloseServices.reopen#Period", reopen, denied],
                ["period reopen", "finance.admin", ledger + "CloseServices.reopen#Period", reopen, "PERIOD_OPEN"],
                ["period run", "finance.read", ledger + "PeriodRunServices.preview#Run", periodRun, denied],
                ["period run", "finance.gl", ledger + "PeriodRunServices.preview#Run", periodRun, ""],
                [
                    "close checklist",
                    "finance.ar",
                    ledger + "CloseServices.get#Checklist",
                    period,
                    /RECORD_UNAVAILABLE|ACCESS_DENIED/
                ],
                // the tax rate's end date is refused for its dates, not its authority, for the administrator
                ["tax rate", "finance.tax", "mantle.other.TaxServices.store#Rate", taxRate, admin],
                ["tax rate", "finance.admin", "mantle.other.TaxServices.store#Rate", taxRate, "RATE_DATES_INVALID"],
                [
                    "tax statements",
                    "finance.ar",
                    "ironstone.accounting.TaxServices.find#Statements",
                    {organizationPartyId: org},
                    "Tax authority is required"
                ],
                [
                    "tax statements",
                    "finance.tax",
                    "ironstone.accounting.TaxServices.find#Statements",
                    {organizationPartyId: org},
                    ""
                ],
                [
                    "1099 run",
                    "finance.ar",
                    "mantle.other.TaxServices.run#Vendor1099Statements",
                    vendor1099,
                    "taxEdit authority is required"
                ],
                [
                    "1099 run",
                    "finance.tax",
                    "mantle.other.TaxServices.run#Vendor1099Statements",
                    vendor1099,
                    "PERIOD_UNAVAILABLE"
                ],
                [
                    "valuation",
                    "finance.ar",
                    "mantle.product.InventoryReportServices.run#InventoryValuation",
                    {organizationPartyId: org},
                    denied
                ],
                [
                    "valuation",
                    "finance.read",
                    "mantle.product.InventoryReportServices.run#InventoryValuation",
                    {organizationPartyId: org},
                    ""
                ],
                [
                    "stock transactions",
                    "finance.ar",
                    "mantle.product.InventoryReportServices.run#StockTransactions",
                    {organizationPartyId: org},
                    denied
                ],
                ["landed cost", "finance.ap", books + "post#LandedCost", landed, denied],
                ["landed cost", "finance.gl", books + "post#LandedCost", landed, /STALE_PREVIEW|ALREADY_ALLOCATED/],
                ["product cost repair", "finance.gl", books + "repair#ProductAcquireCost", productRepair, denied],
                ["product cost repair", "finance.admin", books + "repair#ProductAcquireCost", productRepair, "ASSETS_NONE"],
                [
                    "budgets",
                    "finance.ar",
                    "ironstone.accounting.BudgetServices.find#Budgets",
                    {organizationPartyId: org},
                    "Budget read authority is required"
                ],
                ["budgets", "finance.read", "ironstone.accounting.BudgetServices.find#Budgets", {organizationPartyId: org}, ""],
                [
                    "budget variance",
                    "finance.ar",
                    "mantle.other.BudgetReportServices.run#BudgetVariance",
                    {organizationPartyId: org, ...budget},
                    "reportRead authority is required"
                ],
                [
                    "budget variance",
                    "finance.read",
                    "mantle.other.BudgetReportServices.run#BudgetVariance",
                    {organizationPartyId: org, ...budget},
                    ""
                ],
                ["budget revise", "finance.read", "mantle.other.BudgetServices.revise#Budget", revision, denied],
                ["budget revise", "finance.gl", "mantle.other.BudgetServices.revise#Budget", revision, "ACCOUNT_UNAVAILABLE"],
                [
                    "budget approve",
                    "finance.gl",
                    "mantle.other.BudgetServices.change#BudgetState",
                    {...budget, action: "approve"},
                    denied
                ],
                [
                    "budget approve",
                    "finance.approve",
                    "mantle.other.BudgetServices.change#BudgetState",
                    {...budget, action: "approve"},
                    "STATE_TRANSITION_INVALID"
                ],
                ["budget policy", "finance.gl", "mantle.other.BudgetServices.store#Policy", budgetRule, admin],
                ["budget policy", "finance.admin", "mantle.other.BudgetServices.store#Policy", budgetRule, "THRESHOLD_INVALID"],
                [
                    "budget check",
                    "finance.ar",
                    "mantle.other.BudgetServices.check#Budget",
                    {organizationPartyId: org, glAccountId: "_NA_", amount: 1},
                    denied
                ],
                ["capitalize", "finance.read", books + "capitalize#Asset", capitalize, denied],
                ["capitalize", "finance.gl", books + "capitalize#Asset", capitalize, "CURRENCY_UNSUPPORTED"],
                ["asset class", "finance.gl", books + "store#Class", assetClass, denied],
                ["asset class", "finance.admin", books + "store#Class", assetClass, "LIFE_INVALID"],
                ["asset cost repair", "finance.gl", books + "repair#AcquireCost", assetRepair, denied],
                ["asset cost repair", "finance.admin", books + "repair#AcquireCost", assetRepair, "AMOUNT_INVALID"],
                ["asset book", "finance.ar", books + "get#AssetBook", {assetId: "BOSS_ACCT_FA_VAN"}, denied],
                [
                    "assets",
                    "finance.ar",
                    "ironstone.accounting.AssetBookServices.find#Assets",
                    {organizationPartyId: org},
                    "read authority is required"
                ],
                ["assets", "finance.read", "ironstone.accounting.AssetBookServices.find#Assets", {organizationPartyId: org}, ""],
                // the setup of BOSS_ACCT_NEWCO, refused for the administrator only after the permission (a stale version)
                ["opening preview", "finance.read", setup + "preview#OpeningBalances", setupRead, denied],
                ["opening preview", "finance.admin", setup + "preview#OpeningBalances", setupRead, "", newco],
                ["readiness", "finance.gl", setup + "check#Readiness", setupRead, denied],
                ["readiness", "finance.admin", setup + "check#Readiness", setupRead, "", newco],
                ["setup store", "finance.ar", setup + "store#SetupRun", setupStore, denied],
                ["setup store", "finance.admin", setup + "store#SetupRun", setupStore, "STALE_REVISION", newco],
                ["open items", "finance.ap", setup + "import#OpenItems", setupItems, denied],
                ["open items", "finance.admin", setup + "import#OpenItems", setupItems, "", newco],
                ["activate", "finance.gl", setup + "activate#Accounting", activate, denied],
                ["activate", "finance.admin", setup + "activate#Accounting", activate, "STALE_REVISION", newco],
                ...reports.flatMap(([service, p]) => [
                    ["report " + service, "finance.ar", service, p, /PERMISSION_DENIED|authority is required/],
                    ["report " + service, "finance.read", service, p, ""]
                ])
            ]
            // one sign-in for each user and organization
            const rows = []
            for (const scope of new Set(cases.map(row => row[1] + " " + (row[5] || org)))) {
                const [user, organizationPartyId] = scope.split(" ")
                const mine = cases.filter(row => row[1] === user && (row[5] || org) === organizationPartyId)
                as(
                    user,
                    () =>
                        mine.forEach(([name, , service, p, expected]) =>
                            rows.push([name + " as " + user, refusal(service, p), expected])
                        ),
                    organizationPartyId
                )
            }
            return {problems: mismatches(rows)}
        },
        then({problems}) {
            problems == ""
        }
    }
)

feature("receivables and treasury: each AR permission refuses the other roles where the same request passes for AR", {
    when() {
        const rows = []
        const add = (name, user, run, expected) => rows.push([name + " as " + user, as(user, run), expected])
        const attempt = (name, service, p, holders, others, expected = denied) => {
            for (const user of holders) add(name, user, () => refusal(service, p), "")
            for (const user of others) add(name, user, () => refusal(service, p), expected)
        }
        const receivable = {organizationPartyId: org}
        // supporting attachments need AR edit, and the archive location is not given out
        const attachments = {...receivable, invoiceId: ids.finalizedInvoiceId, attachmentContentIdList: ["BOSS_ACCT_AR_SUPPORT"]}
        const attachmentService = "mantle.account.InvoiceServices.get#InvoiceDeliveryAttachments"
        const attachmentRows = as("finance.ar", () => lib.call(attachmentService, attachments).attachmentRows || [])
        rows.push([
            "the AR attachment row",
            attachmentRows.length == 1 &&
                attachmentRows[0].invoiceContentId == "BOSS_ACCT_AR_SUPPORT" &&
                attachmentRows[0].fileName == "Scope.txt" &&
                !!attachmentRows[0].attachmentVersion &&
                attachmentRows[0].contentLocation == null,
            true
        ])
        for (const user of ["finance.ap", "finance.read"])
            add("attachments", user, () => refusal(attachmentService, attachments), "RECEIVABLE_EDIT")
        // statements need AR edit though the reader reads the same invoices
        attempt(
            "statements",
            "mantle.account.CollectionServices.get#Statements",
            {...receivable, customerPartyIdList: [ids.customerPartyId], includeZeroBalance: true},
            ["finance.ar"],
            ["finance.read"],
            "RECEIVABLE_EDIT"
        )
        // a batch review gives AP the selected rows without their values
        const review = () =>
            lib.call("ironstone.accounting.ReceivableServices.get#InvoiceBatchContext", {
                ...receivable,
                invoiceIdList: [ids.invoiceId, ids.finalizedInvoiceId]
            }).batchRows
        const arBatch = as("finance.ar", review)
        const apBatch = as("finance.ap", review)
        rows.push(
            [
                "AR batch rows",
                arBatch.length == 2 && arBatch.every(row => row.available && row.totalText && row.customerName),
                true
            ],
            [
                "AP batch rows",
                apBatch.length == 2 && apBatch.every(row => !row.available && !row.totalText && !row.customerName),
                true
            ]
        )
        // only AR edits a draft, only the approver approves another author's invoice
        const invoices = "mantle.account.InvoiceServices."
        const invoiceId = as("finance.ar", () => {
            const made = lib.call(invoices + "create#Receivable", {
                ...receivable,
                customerPartyId: ids.customerPartyId,
                description: "Approval access fixture"
            })
            lib.call(invoices + "store#InvoiceDraftItem", {
                ...receivable,
                invoiceId: made.invoiceId,
                itemTypeEnumId: "ItemTimeEntry",
                quantity: 1,
                amount: 10,
                description: "Approval access services"
            })
            return made.invoiceId
        })
        const stamp = () => ec.entity.find(INVOICE).condition("invoiceId", invoiceId).disableAuthz().one().lastUpdatedStamp
        const edit = {...receivable, invoiceId, lastUpdatedStamp: stamp(), description: "Edited by AR"}
        for (const user of ["finance.read", "finance.approve"])
            add("draft edit", user, () => refusal(invoices + "store#InvoiceDraft", edit), "RECEIVABLE_EDIT")
        add("draft edit", "finance.ar", () => refusal(invoices + "store#InvoiceDraft", edit), "")
        const approval = {
            ...receivable,
            invoiceId,
            action: "approve",
            lastUpdatedStamp: stamp(),
            operationKey: "access-approve-" + ec.user.randomString(20),
            changeReason: "Separate finance approval"
        }
        add("invoice approve", "finance.ar", () => refusal(invoices + "change#InvoiceState", approval), "INVOICE_APPROVE")
        rows.push([
            "approved by the approver",
            as("finance.approve", () => lib.call(invoices + "change#InvoiceState", approval)).statusId,
            "InvoiceFinalized"
        ])
        const capabilities = () =>
            lib.call(invoices + "get#InvoiceFinanceDetail", {...receivable, invoiceId: ids.invoiceId}).capabilities
        const editor = as("finance.ar", capabilities)
        const approver = as("finance.approve", capabilities)
        rows.push(
            ["the editor's controls", editor.canDraftEdit === true && editor.canApprove === false, true],
            ["the approver's controls", approver.canDraftEdit === false && approver.canApprove === true, true]
        )
        // a linked customer credit is an AR record and never an AP bill
        const creditId = as(
            "finance.ar",
            () =>
                lib.call("ironstone.accounting.ReceivableServices.create#InvoiceCredit", {
                    ...receivable,
                    originalInvoiceId: ids.finalizedInvoiceId,
                    amount: 5,
                    description: "Credit access fixture",
                    operationKey: "access-credit-" + ec.user.randomString(20)
                }).invoiceId
        )
        const record = {...receivable, recordId: creditId}
        const records = kind => lib.call("mantle.ledger.AccountingServices.find#Records", {...record, kind}).records
        rows.push(
            [
                "the credit as an AR record",
                as(
                    "finance.ar",
                    () => lib.call("mantle.ledger.AccountingServices.get#Record", {...record, kind: "invoices"}).record.invoiceId
                ),
                creditId
            ],
            [
                "the credit in AR's list",
                as("finance.ar", () => records("invoices").some(row => row.invoiceId === creditId)),
                true
            ],
            ["the credit in AP's bills", as("finance.ap", () => !records("bills").some(row => row.invoiceId === creditId)), true]
        )
        add(
            "the credit as a bill",
            "finance.ap",
            () => refusal("mantle.ledger.AccountingServices.get#Record", {...record, kind: "bills"}),
            "not available"
        )
        // treasury reads the settlement workbench's open items but AR alone previews a settlement
        const settlement = {...receivable, partyId: ids.settlementPartyId, currencyUomId: "USD"}
        const treasury = as("finance.treasury", () => {
            const items = lib.call("mantle.account.PaymentServices.find#OpenItems", {...settlement, direction: "receivable"})
            return {items, page: lib.page("Receivables/ReceivablesWorkbench", settlement, "qvt")}
        })
        const source = treasury.items.paymentRows.find(row => row.sourceId === ids.settlementPaymentId)
        const target = treasury.items.invoiceRows.find(row => row.sourceId === ids.settlementInvoiceId)
        rows.push(
            [
                "treasury's open items",
                treasury.items.capabilities.canRead === true &&
                    treasury.items.capabilities.canApply === false &&
                    !!source &&
                    !!target,
                true
            ],
            [
                "treasury's workbench",
                treasury.page.status == 200 &&
                    treasury.page.errors.length == 0 &&
                    treasury.page.output.includes("Allocate receipts and credits") &&
                    !treasury.page.output.includes("Add allocation"),
                true
            ]
        )
        const preview = {
            ...settlement,
            direction: "receivable",
            effectiveDate: ec.user.nowTimestamp,
            allocations: [{sourceKey: source?.sourceKey, targetKey: target?.sourceKey, amount: "1"}],
            sourceVersions: {[source?.sourceKey]: source?.version, [target?.sourceKey]: target?.version}
        }
        attempt(
            "settlement preview",
            "mantle.account.PaymentServices.preview#Settlement",
            preview,
            ["finance.ar"],
            ["finance.treasury"]
        )
        add(
            "invoice detail",
            "finance.treasury",
            () => refusal(invoices + "get#InvoiceFinanceDetail", {...receivable, invoiceId: ids.finalizedInvoiceId}),
            denied
        )
        // AR issues an invoice's pay link and invites no supplier contact
        const capability = "mantle.party.ExternalAccessServices.create#AccessCapability"
        attempt(
            "pay link",
            capability,
            {recordType: "Invoice", recordId: ids.finalizedInvoiceId, scopes: "InvoicePay", validDays: 1},
            ["finance.ar"],
            ["finance.ap", "finance.read"]
        )
        add(
            "supplier invite",
            "finance.ar",
            () =>
                refusal("mantle.party.ExternalAccessServices.invite#Contact", {
                    ...receivable,
                    app: "supplier",
                    partyId: "BOSS_ACCT_SUPPLIER",
                    emailAddress: "ap@supplier.example"
                }),
            denied
        )
        // collections, credit and recurring invoices
        const customer = {...receivable, customerPartyId: "BOSS_ACCT_COLLECT"}
        const level = {...receivable, description: "Access spec level", daysOverdueFrom: 75, changeReason: "Access"}
        const schedule = {
            ...receivable,
            templateInvoiceId: "BOSS_ACCT_RENT_TEMPLATE",
            intervalUomId: "TF_yr",
            description: "Access spec schedule"
        }
        attempt(
            "collection work",
            "ironstone.accounting.CollectionServices.find#Work",
            receivable,
            ["finance.ar"],
            ["finance.tax"]
        )
        attempt(
            "collection policies",
            "ironstone.accounting.CollectionServices.get#CollectionPolicies",
            receivable,
            ["finance.admin"],
            ["finance.ar"]
        )
        add("reminder level", "finance.ar", () => refusal("mantle.account.CollectionServices.store#Level", level), denied)
        attempt(
            "credit status",
            "mantle.account.CreditServices.get#CustomerCreditStatus",
            customer,
            ["finance.ar"],
            ["finance.ap"]
        )
        attempt(
            "credit policy",
            "mantle.account.CreditServices.store#Policy",
            {...customer, creditLimit: 5000, changeReason: "Access spec"},
            ["finance.approve"],
            ["finance.ar"]
        )
        attempt(
            "collection activity",
            "mantle.account.CollectionServices.record#Activity",
            {...customer, outcomeEnumId: "CaoNoAnswer", note: "Access spec"},
            ["finance.ar"],
            ["finance.read"]
        )
        add(
            "recurring schedule",
            "finance.ap",
            () => refusal("mantle.account.RecurringInvoiceServices.store#Schedule", schedule),
            denied
        )
        attempt("aging", "mantle.ledger.LedgerReportServices.run#Aging", receivable, ["finance.read"], ["finance.tax"])
        // the level, policy and schedule the holders store are ended, so the demo and the other specs keep theirs
        const levelId = as("finance.admin", () => lib.call("mantle.account.CollectionServices.store#Level", level).dunningLevelId)
        const scheduleId = as(
            "finance.ar",
            () => lib.call("mantle.account.RecurringInvoiceServices.store#Schedule", schedule).invoiceScheduleId
        )
        rows.push(["the admin's reminder level", !!levelId, true], ["AR's recurring schedule", !!scheduleId, true])
        as("finance.admin", () =>
            lib.call("mantle.account.CollectionServices.store#Level", {...receivable, dunningLevelId: levelId, ended: "Y"})
        )
        as("finance.admin", () =>
            lib.call("mantle.account.CreditServices.store#Policy", {...customer, ended: "Y", changeReason: "Access spec end"})
        )
        as("finance.ar", () =>
            lib.call("mantle.account.RecurringInvoiceServices.store#Schedule", {
                invoiceScheduleId: scheduleId,
                statusId: "IschEnded"
            })
        )
        // returns: AR settles, a reader previews, receipt is Warehouse's, order changes need their permissions; nothing
        // here settles the demo return the walk settles
        const returnId = "BOSS_ACCT_RETURN"
        const returnPreview = "mantle.order.ReturnServices.preview#ReturnSettlement"
        const settle = {returnId, previewVersion: "stale", operationKey: "RETURN-ACCESS-" + Date.now()}
        const sourceOf = condition =>
            ec.entity.find("mantle.shipment.ShipmentItemSource").condition(condition).disableAuthz().list()[0]
        const shipmentId = sourceOf({orderId: "BOSS_ACCT_SO_RETURN"}).shipmentId
        const paymentId = ec.entity.find(PAYMENT).condition("orderId", "BOSS_ACCT_SO_RETURN").disableAuthz().list()[0].paymentId
        const readPreview = as("finance.read", () => lib.call(returnPreview, {returnId}))
        rows.push(
            ["the reader's return preview", readPreview.lineRows.length == 1 && readPreview.reasonCode == "FORBIDDEN", true],
            ["AR's return preview", as("finance.ar", () => lib.call(returnPreview, {returnId}).canSettle), true]
        )
        add("return preview", "finance.ap", () => refusal(returnPreview, {returnId}), "FORBIDDEN")
        add("return settle", "finance.read", () => refusal("mantle.order.ReturnServices.settle#Return", settle), "FORBIDDEN")
        // AR passes the authority and is refused for the stale preview only
        add("return settle", "finance.ar", () => refusal("mantle.order.ReturnServices.settle#Return", settle), "RECEIPT_CHANGED")
        add(
            "return receipt",
            "finance.ar",
            () =>
                refusal("mantle.shipment.WarehouseTaskServices.receive#ReturnItems", {
                    shipmentId: sourceOf({returnId}).shipmentId,
                    itemList: [{returnId, returnItemSeqId: "01", quantityAccepted: 5}]
                }),
            /PERMISSION_DENIED|not authorized/
        )
        const release = {shipmentId, reason: "Access spec"}
        add("draft release", "finance.treasury", () => refusal(invoices + "release#ShipmentDraftInvoice", release), denied)
        add("draft release", "finance.ar", () => refusal(invoices + "release#ShipmentDraftInvoice", release), "SHIPMENT_SHIPPED")
        const refund = {paymentId, amount: 1, reason: "Access spec", operationKey: settle.operationKey + "-R"}
        add("order refund", "finance.ar", () => refusal("mantle.account.PaymentServices.refund#OrderPayment", refund), denied)
        // treasury passes the permission and stops at the refund's own validation
        add(
            "order refund",
            "finance.treasury",
            () => refusal("mantle.account.PaymentServices.refund#OrderPayment", refund),
            /^(?![\s\S]*PERMISSION_DENIED)[\s\S]+/
        )
        return {problems: mismatches(rows)}
    },
    then({problems}) {
        problems == ""
    }
})

feature(
    "payables, matching, payment runs and banking: each permission refuses the other roles where the same request passes for its holder",
    {
        when() {
            const rows = []
            const add = (name, user, run, expected) => rows.push([name + " as " + user, as(user, run), expected])
            const attempt = (name, service, p, holders, others) => {
                for (const user of holders) add(name, user, () => refusal(service, p), "")
                for (const user of others) add(name, user, () => refusal(service, p), denied)
            }
            const invoices = "mantle.account.InvoiceServices."
            const match = "mantle.account.InvoiceMatchServices."
            // a bill: imported by AP, held by AP, released by the approver
            const upload = {
                organizationPartyId: org,
                supplierPartyId: "BOSS_ACCT_SUPPLIER",
                referenceNumber: "ACCESS-" + Date.now(),
                amount: "10"
            }
            add("bill import", "finance.approve", () => refusal(invoices + "import#Bill", upload), denied)
            const imported = as("finance.ap", () => lib.call(invoices + "import#Bill", upload))
            const hold = {invoiceId: imported.invoiceId, organizationPartyId: org, holdReasonEnumId: "IhrApReview"}
            add("bill hold", "finance.read", () => refusal(invoices + "hold#Invoice", hold), denied)
            const held = as("finance.ap", () => lib.call(invoices + "hold#Invoice", hold))
            attempt(
                "hold release",
                invoices + "release#InvoiceHold",
                {invoiceHoldId: held.invoiceHoldId, organizationPartyId: org, releaseComment: "Checked"},
                ["finance.approve"],
                ["finance.ap"]
            )
            attempt(
                "supplier profile",
                "mantle.party.SupplierServices.store#SupplierProfile",
                {organizationPartyId: org, supplierPartyId: "BOSS_ACCT_SUPPLIER", selfBillingIndicator: "Y"},
                ["finance.ap"],
                ["finance.ar"]
            )
            attempt(
                "bill link",
                "mantle.party.ExternalAccessServices.create#AccessCapability",
                {recordType: "Order", recordId: "BOSS_ACCT_PO", scopes: "BillUpload", validDays: 1},
                ["finance.ap"],
                ["finance.ar", "finance.treasury"]
            )
            // a bill of one unit against the demo's received order, matched and then unapplied, so the demo stays as it was
            const invoiceId = as("finance.ap", () =>
                lib.call(invoices + "import#Bill", {
                    organizationPartyId: org,
                    supplierPartyId: "BOSS_ACCT_SUPPLIER",
                    referenceNumber: "MATCH-ACCESS-" + Date.now()
                })
            ).invoiceId
            invoke(invoices + "create#InvoiceItem", {
                invoiceId,
                itemTypeEnumId: "ItemInventory",
                productId: "BOSS_ACCT_SUPPLY",
                quantity: 1,
                amount: 8
            })
            const bill = {invoiceId, organizationPartyId: org}
            add("match evaluate", "finance.ar", () => refusal(match + "evaluate#InvoiceMatch", bill), denied)
            const evaluated = as("finance.read", () => lib.call(match + "evaluate#InvoiceMatch", bill))
            rows.push(["the reader's evaluation", evaluated.sourceRows.length == 1, true])
            const apply = {
                ...bill,
                allocationList: evaluated.sourceRows.map(row => ({
                    invoiceItemSeqId: row.invoiceItemSeqId,
                    orderId: row.orderId,
                    orderItemSeqId: row.orderItemSeqId,
                    assetReceiptId: row.assetReceiptId,
                    quantity: String(row.quantity)
                }))
            }
            attempt("match apply", match + "apply#InvoiceMatch", apply, ["finance.match"], ["finance.read"])
            add("match unapply", "finance.approve", () => refusal(match + "unapply#InvoiceMatch", bill), denied)
            add("match unapply", "finance.ap", () => refusal(match + "unapply#InvoiceMatch", bill), "")
            attempt(
                "match policy",
                match + "store#MatchPolicy",
                {
                    organizationPartyId: org,
                    billBasisEnumId: "ImbReceived",
                    receiptRequired: "Y",
                    priceTolerancePercent: 2,
                    varianceActionEnumId: "ImaHold"
                },
                ["finance.admin"],
                ["finance.ap"]
            )
            attempt(
                "legacy matches",
                match + "preview#LegacyMatches",
                {organizationPartyId: org, supplierPartyId: "BOSS_ACCT_SUPPLIER"},
                ["finance.match"],
                ["finance.read"]
            )
            // a payment run: AP creates, the approver approves, AP may not execute; it is cancelled so its bills stay free
            // the pay date is today in the finance users' zone (the server's), not the spec user's
            const runs = "mantle.account.PaymentRunServices."
            const day = as("finance.ap", () => ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd"))
            const request = {
                organizationPartyId: org,
                paymentMethodId: "BOSS_ACCT_RUN_BANK",
                paymentInstrumentEnumId: "PiCompanyCheck",
                dueThroughDate: day,
                payDate: day,
                description: "Access spec run"
            }
            add("run create", "finance.treasury", () => refusal(runs + "create#Run", request), denied)
            const made = as("finance.ap", () => lib.call(runs + "create#Run", request))
            const run = {organizationPartyId: org, paymentRunId: made.paymentRunId}
            const runStamp = () =>
                ec.entity.find("mantle.account.payment.PaymentRun").condition(run).disableAuthz().one().lastUpdatedStamp
            add("run approve", "finance.ap", () => refusal(runs + "approve#Run", {...run, lastUpdatedStamp: runStamp()}), denied)
            add("run approve", "finance.approve", () => refusal(runs + "approve#Run", {...run, lastUpdatedStamp: runStamp()}), "")
            add(
                "run execute",
                "finance.ap",
                () => refusal(runs + "execute#Run", {...run, operationKey: "ACCESS-RUN-" + made.paymentRunId}),
                denied
            )
            // payment view reads runs as it reads their payments; a tax user has no payables or payment read
            attempt("run read", runs + "get#Run", run, ["finance.read"], ["finance.tax"])
            add(
                "run list",
                "finance.tax",
                () => refusal("ironstone.accounting.PaymentRunServices.find#Runs", {organizationPartyId: org}),
                denied
            )
            add("run cancel", "finance.ap", () => refusal(runs + "cancel#Run", run), "")
            // banking: statement review needs BANK_RECONCILE, bank lines a payment read, deposits payment edit
            const bank = {paymentMethodId: ids.bankPaymentMethodId}
            const reconcile = "mantle.account.ReconciliationServices."
            attempt(
                "statement review",
                reconcile + "review#StatementImport",
                {...bank, formatEnumId: "SifCsv", statementText: "Date,Description,Amount\n" + day + ",Access check,-1.00"},
                ["finance.treasury"],
                ["finance.ar", "finance.read"]
            )
            add(
                "bank rule",
                "finance.read",
                () => refusal(reconcile + "store#Rule", {organizationPartyId: org, matchText: "access check"}),
                denied
            )
            attempt("bank lines", reconcile + "find#BankLines", bank, ["finance.read"], ["finance.ar"])
            add(
                "deposit slip",
                "finance.read",
                () =>
                    refusal("mantle.account.PaymentServices.create#DepositSlip", {
                        ...bank,
                        paymentIdList: ["BOSS_ACCT_BANK_RCPT1"],
                        operationKey: "access-deposit"
                    }),
                denied
            )
            return {problems: mismatches(rows)}
        },
        then({problems}) {
            problems == ""
        }
    }
)

feature("a section a role lacks does not open, and the screens with no logic spec offer each role its own controls", {
    when() {
        // refused renders: their status, not their content (the holders' renders are in the specs of each screen)
        const refused = [
            ["finance.ar", "Banking/BankAccounts", {}],
            ["finance.ar", "PeriodClose/PeriodCloseDetail", {timePeriodId: ids.closePeriodId}],
            ["finance.ar", "Budgets/Budgets", {}],
            ["finance.ar", "Reports/BalanceSheet", {}],
            ["finance.ar", "Settings/CollectionPolicies", {}],
            ["finance.ar", "Approvals", {}],
            ["finance.ar", "Payables/BillDetail/Match", {recordId: "BOSS_ACCT_BILL_MATCH", lastStandalone: "true"}],
            ["finance.tax", "Receivables/Collections", {}],
            ["finance.read", "Settings/Setup/Readiness", {lastStandalone: "true"}]
        ].map(([user, path, p]) => {
            const page = as(user, () => lib.page(path, p))
            return [path + " as " + user, refusedRender(page) ? true : page.status + " " + page.errors.join(" | "), true]
        })
        const shows = (page, present, absent = []) =>
            page.status == 200 &&
            page.errors.length == 0 &&
            present.every(text => page.output.includes(text)) &&
            !absent.some(text => page.output.includes(text))
        const returnId = "BOSS_ACCT_RETURN"
        const newco = "BOSS_ACCT_NEWCO"
        const pages = [
            [
                "budgets as a reader",
                as("finance.read", () => shows(lib.page("Budgets/Budgets"), ["Operating budget"], ["New budget"]))
            ],
            ["budgets as GL", as("finance.gl", () => shows(lib.page("Budgets/Budgets"), ["Operating budget", "New budget"]))],
            [
                "budget controls as a reader",
                as("finance.read", () => shows(lib.page("Budgets/BudgetControls"), ["Policies"], ["Add policy"]))
            ],
            [
                "budget controls as the admin",
                as("finance.admin", () => shows(lib.page("Budgets/BudgetControls"), ["Add policy"]))
            ],
            ["balance sheet as a reader", as("finance.read", () => shows(lib.page("Reports/BalanceSheet"), ["Total assets"]))],
            [
                "setup readiness as the admin",
                as(
                    "finance.admin",
                    () =>
                        shows(lib.page("Settings/Setup/Readiness", {organizationPartyId: newco, lastStandalone: "true"}), [
                            "Posting guard"
                        ]),
                    newco
                )
            ],
            ["the return as AR", as("finance.ar", () => shows(lib.page("Records/ReturnDetail", {returnId}), ["Settle return"]))],
            [
                "the return as a reader",
                as("finance.read", () =>
                    shows(lib.page("Records/ReturnDetail", {returnId}), ["Customer return BOSS_ACCT_RETURN"], ["Settle return"])
                )
            ],
            [
                "the return as AP",
                as("finance.ap", () => lib.page("Records/ReturnDetail", {returnId}).output.includes("Return not available"))
            ]
        ].map(([name, ok]) => [name, ok, true])
        return {problems: mismatches(refused.concat(pages))}
    },
    then({problems}) {
        problems == ""
    }
})

feature("server choices keep a selected label outside the search page", {
    when() {
        // the fixtures are made with artifact authz off, the choices are read with it on
        return lib.asUser(
            "finance.admin",
            () => {
                const service = "mantle.account.InvoiceServices."
                // own the source and credit used by the picker; shared demo invoices keep their balances
                const target = lib.call(service + "create#Receivable", {
                    organizationPartyId: org,
                    customerPartyId: ids.customerPartyId,
                    description: "Choice source invoice"
                })
                lib.call(service + "store#InvoiceDraftItem", {
                    organizationPartyId: org,
                    invoiceId: target.invoiceId,
                    itemTypeEnumId: "ItemTimeEntry",
                    quantity: 1,
                    amount: 25,
                    description: "Choice source services"
                })
                const finalize = invoiceId =>
                    lib.call(service + "change#InvoiceState", {
                        organizationPartyId: org,
                        invoiceId,
                        action: "finalize",
                        lastUpdatedStamp: ec.entity.find(INVOICE).condition("invoiceId", invoiceId).disableAuthz().one()
                            .lastUpdatedStamp,
                        operationKey: "choice-finalize-" + ec.user.randomString(20),
                        changeReason: "Prepare a valid selected choice"
                    })
                finalize(target.invoiceId)
                const credit = lib.call("ironstone.accounting.ReceivableServices.create#InvoiceCredit", {
                    organizationPartyId: org,
                    originalInvoiceId: target.invoiceId,
                    amount: 5,
                    description: "Choice customer credit",
                    operationKey: "choice-credit-" + ec.user.randomString(20)
                })
                finalize(credit.invoiceId)
                const bill = lib.call("mantle.ledger.AccountingServices.create#DraftDocument", {
                    kind: "bills",
                    organizationPartyId: org,
                    otherPartyId: ids.customerPartyId,
                    description: "Choice supplier bill"
                })
                const reviewedContentId = "CHOICE_ATTACH_" + ec.user.randomString(20)
                const reviewedLocation =
                    "dbresource://mantle/content/invoice/" + target.invoiceId + "/content_" + reviewedContentId + "/Reviewed.txt"
                const reviewedFile = ec.resource.getLocationReference(reviewedLocation)
                reviewedFile.putText("The supporting scope reviewed by this test")
                invoke("create#mantle.account.invoice.InvoiceContent", {
                    invoiceContentId: reviewedContentId,
                    invoiceId: target.invoiceId,
                    contentLocation: reviewedLocation,
                    contentTypeEnumId: "IctInvoiceDocument",
                    description: "Reviewed customer attachment"
                })
                const attachments = {
                    organizationPartyId: org,
                    invoiceId: target.invoiceId,
                    attachmentContentIdList: [reviewedContentId]
                }
                const reviewedRow = lib.call(service + "get#InvoiceDeliveryAttachments", attachments).attachmentRows[0]
                const reviewedToken = reviewedContentId + "~" + reviewedRow.attachmentVersion
                ec.artifactExecution.enableAuthz()
                const choices = p => lib.call("ironstone.accounting.AccessServices.get#Choices", p).options || []
                const term = "no-matching-accounting-fixture-92831"
                const cases = [
                    ...[
                        "parties",
                        "invoices",
                        "products",
                        "projects",
                        "terms",
                        "currencies",
                        "enum:ItemType",
                        "enum:InvoiceType"
                    ].map(choice => ({choice})),
                    {choice: "bills", selected: bill.recordId},
                    {choice: "receivableCredits", invoiceId: target.invoiceId, selected: credit.invoiceId},
                    {choice: "invoiceTypes", selected: "InvoiceSales"},
                    {choice: "invoiceStatuses", selected: "InvoiceFinalized"},
                    {choice: "invoiceAttachments", invoiceId: ids.finalizedInvoiceId, selected: "BOSS_ACCT_AR_SUPPORT"},
                    {choice: "reviewedInvoiceAttachments", invoiceId: target.invoiceId, selected: reviewedToken},
                    {choice: "invoiceItemTypes", selected: "ItemTimeEntry"},
                    {choice: "identificationTypes", selected: "PtidPassport"},
                    {choice: "bankAccountTypes", selected: "BatChecking"},
                    {choice: "taxAuthorities", selected: "UsaIrs"}
                ]
                const failures = []
                for (const entry of cases) {
                    // projects are chosen in the organization that has them
                    const projectScope = entry.choice === "projects"
                    if (projectScope) lib.selectOrganization(ids.foreignOrganizationPartyId)
                    try {
                        const parameters = {organizationPartyId: projectScope ? ids.foreignOrganizationPartyId : org, ...entry}
                        const initial = choices(parameters)
                        const selected = entry.selected ? initial.find(row => row.value === entry.selected) : initial[0]
                        if (!selected) {
                            failures.push(entry.choice + ": required fixture option is absent")
                            continue
                        }
                        if (choices({...parameters, term, selected: null}).length)
                            failures.push(entry.choice + ": search did not exclude the selected fixture")
                        if (
                            !choices({...parameters, term, selected: selected.value}).some(
                                row => row.value === selected.value && row.label === selected.label
                            )
                        )
                            failures.push(entry.choice + ": selected label was lost")
                    } finally {
                        if (projectScope) lib.selectOrganization(org)
                    }
                }
                ec.artifactExecution.disableAuthz()
                reviewedFile.putText("This source changed after its supporting bytes were reviewed")
                ec.artifactExecution.enableAuthz()
                const currentRow = lib.call(service + "get#InvoiceDeliveryAttachments", attachments).attachmentRows[0]
                if (currentRow.attachmentVersion === reviewedRow.attachmentVersion)
                    failures.push("reviewedInvoiceAttachments: source byte change did not change its version")
                const retained = choices({
                    organizationPartyId: org,
                    invoiceId: target.invoiceId,
                    choice: "reviewedInvoiceAttachments",
                    term,
                    selected: reviewedToken
                })
                if (!retained.some(row => row.value === reviewedToken && row.label.includes("Reviewed.txt")))
                    failures.push("reviewedInvoiceAttachments: original reviewed token was lost after source change")
                if (retained.some(row => row.value === reviewedContentId + "~" + currentRow.attachmentVersion))
                    failures.push("reviewedInvoiceAttachments: selection silently adopted the changed source version")
                if (JSON.stringify(retained).includes("dbresource://"))
                    failures.push("reviewedInvoiceAttachments: choice exposed an archive location")
                return {failures}
            },
            false
        )
    },
    then({failures}) {
        failures == []
    }
})
