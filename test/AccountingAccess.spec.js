const native = (service, p = {}) =>
    ec.service
        .sync()
        .name("mantle.ledger." + service)
        .parameters(p)
        .call() || {}
function asFinance(user, enabled, run) {
    return ec.resource.script("component://mr-boss/test/AccountingSpecLib.js").asUser(user, run, enabled)
}
feature("Treasury can read the scoped settlement workbench without gaining AR editing with authz #enabled", {
    where: [{enabled: true}, {enabled: false}],
    when({enabled}) {
        return asFinance("finance.treasury", enabled, () => {
            const helper = ec.resource.script("component://mr-boss/test/AccountingSpecLib.js")
            const parameters = {
                organizationPartyId: helper.ids.organizationPartyId,
                partyId: helper.ids.settlementPartyId,
                currencyUomId: "USD"
            }
            const items = helper.call("mantle.account.PaymentServices.find#OpenItems", {...parameters, direction: "receivable"})
            const source = items.paymentRows.find(row => row.sourceId === "BOSS_ACCT_STL_RECEIPT60")
            const target = items.invoiceRows.find(row => row.sourceId === "BOSS_ACCT_STL_INV100")
            assert(source && target, "Treasury's negative needs the same real settlement that AR may preview")
            const preview = {
                ...parameters,
                direction: "receivable",
                effectiveDate: ec.user.nowTimestamp,
                allocations: [{sourceKey: source.sourceKey, targetKey: target.sourceKey, amount: "1"}],
                sourceVersions: {[source.sourceKey]: source.version, [target.sourceKey]: target.version}
            }
            return {
                page: helper.page("Receivables/ReceivablesWorkbench", parameters, "qvt"),
                items,
                edit: refusal("mantle.account.PaymentServices.preview#Settlement", preview),
                arEdit: helper.asUser(
                    "finance.ar",
                    () => refusal("mantle.account.PaymentServices.preview#Settlement", preview),
                    enabled
                ),
                invoice: refusal("mantle.account.InvoiceServices.get#InvoiceFinanceDetail", {
                    organizationPartyId: helper.ids.organizationPartyId,
                    invoiceId: helper.ids.finalizedInvoiceId
                })
            }
        })
    },
    then({page, items, edit, arEdit, invoice}) {
        page.status == 200
        page.errors == []
        page.output.includes("Allocate receipts and credits")
        !page.output.includes("Add allocation")
        items.capabilities.canRead == true
        items.capabilities.canApply == false
        items.invoiceRows.some(row => row.sourceId === "BOSS_ACCT_STL_INV100")
        edit.includes("PERMISSION_DENIED")
        arEdit == ""
        invoice.includes("PERMISSION_DENIED")
    }
})
// The message a call is refused with, or "" when it succeeds. A negative case checks the message names the missing
// authority, and a positive case with the same parameters gets "", so a validation error is not taken for a refusal.
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
const readerDraft = {organizationPartyId: "BOSS_ACCT_ORG", description: "Access spec draft"}
feature("Accounting reader sees own organization documents with authz enabled or disabled", {
    where: [{enabled: true}, {enabled: false}],
    when({enabled}) {
        return asFinance("finance.read", enabled, () => ({
            access: native("AccountingServices.get#Access"),
            own: native("AccountingServices.get#Record", {
                kind: "invoices",
                recordId: "BOSS_ACCT_INVOICE"
            }),
            other: refusal("mantle.ledger.AccountingServices.get#Record", {
                kind: "accounts",
                recordId: "110000",
                organizationPartyId: "ORG_ZIZI_SERVICES"
            }),
            settings: refusal("mantle.ledger.SetupServices.get#Preferences", {organizationPartyId: "BOSS_ACCT_ORG"}),
            create: refusal("mantle.ledger.JournalServices.store#DraftEntry", readerDraft),
            // the same draft is made for a GL user
            glCreate: asFinance("finance.gl", enabled, () =>
                refusal("mantle.ledger.JournalServices.store#DraftEntry", readerDraft)
            ),
            glSettings: asFinance("finance.admin", enabled, () =>
                refusal("mantle.ledger.SetupServices.get#Preferences", {organizationPartyId: "BOSS_ACCT_ORG"})
            )
        }))
    },
    then({access, own, other, settings, create, glCreate, glSettings}) {
        access.capabilities.reportRead == true
        access.capabilities.glPost == false
        own.record.invoiceId == "BOSS_ACCT_INVOICE"
        other.includes("not available")
        settings.includes("admin authority is required")
        create.includes("glPost authority is required")
        glCreate == ""
        glSettings == ""
    }
})
feature("a reader has only the Accounting business launcher and no finance quick create", {
    when() {
        return asFinance("finance.read", true, () => {
            const rendered = ec.screen
                .makeTest()
                .rootScreen("component://webroot/screen/webroot.xml")
                .render("shellData", {}, null)
            return {
                status: rendered.status,
                data: JSON.parse(rendered.output)
            }
        })
    },
    then({status, data}) {
        status == 200
        data.apps.some(app => app.name === "Accounting")
        !data.apps.some(app => ["Products", "Projects", "Warehouse", "Purchasing"].includes(app.name))
        data.apps.find(app => app.name === "Accounting").providers.quickCreate.length == 0
    }
})
feature("the GL operator cannot change preferences, rates or terms even with artifact authz disabled", {
    when() {
        return asFinance("finance.gl", false, () => ({
            preferences: refusal("mantle.ledger.SetupServices.store#Preferences", {
                organizationPartyId: "BOSS_ACCT_ORG",
                settings: {invoiceIdPrefix: "BAD"},
                changeReason: "Denied"
            }),
            rates: refusal("mantle.ledger.CurrencyServices.store#Rate", {
                organizationPartyId: "BOSS_ACCT_ORG",
                uomId: "USD",
                toUomId: "EUR",
                conversionFactor: 1,
                fromDate: ec.user.nowTimestamp,
                rateSource: "test",
                changeReason: "Denied"
            }),
            terms: refusal("mantle.ledger.SetupServices.store#SettlementTerm", {
                organizationPartyId: "BOSS_ACCT_ORG",
                description: "Denied",
                termValue: 30,
                termValueUomId: "TF_day",
                changeReason: "Denied"
            })
        }))
    },
    then({preferences, rates, terms}) {
        preferences.includes("admin authority is required")
        rates.includes("admin authority is required")
        terms.includes("admin authority is required")
    }
})
feature("a finance admin can change the rates and terms the GL operator cannot, with the same parameters", {
    when() {
        return asFinance("finance.admin", false, () => ({
            rates: refusal("mantle.ledger.CurrencyServices.store#Rate", {
                organizationPartyId: "BOSS_ACCT_ORG",
                uomId: "USD",
                toUomId: "EUR",
                conversionFactor: 1,
                fromDate: ec.user.nowTimestamp,
                rateSource: "test",
                changeReason: "Allowed"
            }),
            terms: refusal("mantle.ledger.SetupServices.store#SettlementTerm", {
                organizationPartyId: "BOSS_ACCT_ORG",
                description: "Access spec term",
                termValue: 30,
                termValueUomId: "TF_day",
                changeReason: "Allowed"
            })
        }))
    },
    then({rates, terms}) {
        rates == ""
        terms == ""
    }
})
feature("Accounting root grants do not authorize Mantle REST financial mutators", {
    when() {
        return asFinance("finance.gl", true, () => {
            const failures = []
            for (const path of ["s1/mantle/gl/trans", "s1/mantle/invoices", "s1/mantle/payments"]) {
                const rendered = ec.screen
                    .makeTest()
                    .rootScreen("component://webroot/screen/webroot/rest.xml")
                    .render(path, {organizationPartyId: "BOSS_ACCT_ORG"}, "post")
                if (![401, 403].includes(rendered.status)) failures.push(path + ": " + rendered.status)
                ec.message.clearErrors()
            }
            return {failures}
        })
    },
    then({failures}) {
        failures == []
    }
})

feature("finance reads follow the view permissions, not group names or another app's edit permission", {
    when() {
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
        const reach = () => {
            const capabilities = ec.resource
                .script("component://mr-mantle/service/mantle/ledger/AccountingPolicy.js")
                .capabilities()
            const link = ec.service
                .sync()
                .name("ironstone.commons.PaletteServices.get#RecordLink")
                .parameters({docType: "MantleInvoice", id: "BOSS_ACCT_INVOICE"})
                .disableAuthz()
                .call().url
            return {
                read: capabilities.read,
                link: link || null,
                list: !refusal("mantle.ledger.AccountingServices.find#Records", {kind: "invoices"})
            }
        }
        make("mantle.party.PartyRelationship", {
            partyRelationshipId: "BOSS_SPEC_READER_CORP",
            relationshipTypeEnumId: "PrtAgent",
            fromPartyId: readerId,
            toPartyId: "BOSS_ACCT_ORG",
            toRoleTypeId: "OrgInternal",
            fromDate: 0
        })
        make("moqui.security.UserGroup", {userGroupId: groupId, description: "Receivables view by permission alone"})
        try {
            make("moqui.security.UserGroupMember", {userGroupId: "BOSS_PROJECT_MANAGER", userId: readerId, fromDate: 0})
            const manager = asFinance("catalog.reader", false, reach)
            remove("moqui.security.UserGroupMember", {userGroupId: "BOSS_PROJECT_MANAGER", userId: readerId})
            make("moqui.security.UserGroupPermission", {userGroupId: groupId, userPermissionId: "RECEIVABLE_VIEW", fromDate: 0})
            make("moqui.security.UserGroupMember", {userGroupId: groupId, userId: readerId, fromDate: 0})
            const viewer = asFinance("catalog.reader", false, reach)
            return {manager, viewer}
        } finally {
            remove("moqui.security.UserGroupMember", {userId: readerId, userGroupId: groupId})
            remove("moqui.security.UserGroupMember", {userId: readerId, userGroupId: "BOSS_PROJECT_MANAGER"})
            remove("moqui.security.UserGroupPermission", {userGroupId: groupId})
            remove("moqui.security.UserGroup", {userGroupId: groupId})
            remove("mantle.party.PartyRelationship", {partyRelationshipId: "BOSS_SPEC_READER_CORP"})
        }
    },
    then({manager, viewer}) {
        manager.read == false
        manager.link == null
        manager.list == false
        viewer.read == true
        viewer.link.includes("Accounting/Receivables/InvoiceDetail")
        viewer.list == true
    }
})

const receivablesHelper = ec.resource.script("component://mr-boss/test/AccountingSpecLib.js")
const receivablesIds = receivablesHelper.ids
const receivablesReadCases = [
    ["mantle.account.InvoiceServices.get#InvoiceFinanceDetail", {invoiceId: receivablesIds.invoiceId}],
    ["mantle.account.InvoiceServices.find#Receivables", {}],
    ["mantle.account.InvoiceServices.get#ReceivableSummary", {}],
    ["mantle.account.InvoiceServices.get#InvoiceOutput", {invoiceId: receivablesIds.finalizedInvoiceId}],
    ["mantle.account.InvoiceServices.find#ApprovedTimeBilling", {}],
    ["mantle.account.CustomerFinanceServices.get#CustomerFinance", {customerPartyId: receivablesIds.customerPartyId}],
    ["ironstone.accounting.ReceivableServices.get#InvoiceContext", {invoiceId: receivablesIds.invoiceId}],
    ["ironstone.accounting.ReceivableServices.find#Invoices", {}],
    ["ironstone.accounting.ReceivableServices.get#BillingQueue", {}],
    ["ironstone.accounting.ReceivableServices.get#CustomerContext", {customerPartyId: receivablesIds.customerPartyId}]
].map(([service, parameters]) => ({
    service,
    parameters: Object.assign({organizationPartyId: receivablesIds.organizationPartyId}, parameters)
}))

feature("P4 read #service accepts AR and refuses AP for the same valid request with artifact authz disabled", {
    where: receivablesReadCases,
    when({service, parameters}) {
        const allowed = receivablesHelper.asUser("finance.ar", () => receivablesHelper.refusal(service, parameters), false)
        const denied = receivablesHelper.asUser("finance.ap", () => receivablesHelper.refusal(service, parameters), false)
        return {allowed, denied}
    },
    then({allowed, denied}) {
        allowed == ""
        denied.includes("PERMISSION_DENIED")
    }
})

feature("P4 read #service refuses a supplied organization outside the active selection with artifact authz disabled", {
    where: receivablesReadCases,
    when({service, parameters}) {
        return receivablesHelper.asUser(
            "finance.ar",
            () => ({
                allowed: receivablesHelper.refusal(service, parameters),
                denied: receivablesHelper.refusal(
                    service,
                    Object.assign({}, parameters, {
                        organizationPartyId: receivablesIds.foreignOrganizationPartyId
                    })
                )
            }),
            false
        )
    },
    then({allowed, denied}) {
        allowed == ""
        denied.toLowerCase().includes("organization")
    }
})

feature("supporting attachment discovery requires AR edit for the same real invoice file", {
    when() {
        const service = "mantle.account.InvoiceServices.get#InvoiceDeliveryAttachments"
        const parameters = {
            organizationPartyId: receivablesIds.organizationPartyId,
            invoiceId: receivablesIds.finalizedInvoiceId,
            attachmentContentIdList: ["BOSS_ACCT_AR_SUPPORT"]
        }
        return {
            allowed: receivablesHelper.asUser("finance.ar", () => receivablesHelper.call(service, parameters), false),
            ap: receivablesHelper.asUser("finance.ap", () => receivablesHelper.refusal(service, parameters), false),
            reader: receivablesHelper.asUser("finance.read", () => receivablesHelper.refusal(service, parameters), false),
            outside: receivablesHelper.asUser(
                "finance.ar",
                () =>
                    receivablesHelper.refusal(
                        service,
                        Object.assign({}, parameters, {organizationPartyId: receivablesIds.foreignOrganizationPartyId})
                    ),
                false
            )
        }
    },
    then({allowed, ap, reader, outside}) {
        allowed.attachmentRows.length == 1
        allowed.attachmentRows[0].invoiceContentId == "BOSS_ACCT_AR_SUPPORT"
        allowed.attachmentRows[0].fileName == "Scope.txt"
        !!allowed.attachmentRows[0].attachmentVersion
        allowed.attachmentRows[0].contentLocation == null
        ap.includes("PERMISSION_DENIED")
        ap.includes("RECEIVABLE_EDIT")
        reader.includes("PERMISSION_DENIED")
        reader.includes("RECEIVABLE_EDIT")
        outside.includes("ORGANIZATION_DENIED")
    }
})

feature("P4 batch review omits unavailable invoice values for AP while AR sees the same selected records", {
    when() {
        const parameters = {
            organizationPartyId: receivablesIds.organizationPartyId,
            invoiceIdList: [receivablesIds.invoiceId, receivablesIds.finalizedInvoiceId]
        }
        const review = () => receivablesHelper.call("ironstone.accounting.ReceivableServices.get#InvoiceBatchContext", parameters)
        return {
            ar: receivablesHelper.asUser("finance.ar", review, false),
            ap: receivablesHelper.asUser("finance.ap", review, false)
        }
    },
    then({ar, ap}) {
        ar.batchRows.length == 2
        ar.batchRows.every(row => row.available && row.totalText && row.customerName)
        ap.batchRows.length == 2
        ap.batchRows.every(row => !row.available && !row.totalText && !row.customerName)
    }
})

feature("customer statements require AR edit even when the reader can read the same invoices", {
    when() {
        const parameters = {
            organizationPartyId: receivablesIds.organizationPartyId,
            customerPartyIdList: [receivablesIds.customerPartyId],
            includeZeroBalance: true
        }
        const service = "mantle.account.CollectionServices.get#Statements"
        return {
            allowed: receivablesHelper.asUser("finance.ar", () => receivablesHelper.refusal(service, parameters), false),
            denied: receivablesHelper.asUser("finance.read", () => receivablesHelper.refusal(service, parameters), false)
        }
    },
    then({allowed, denied}) {
        allowed == ""
        denied.includes("PERMISSION_DENIED")
        denied.includes("RECEIVABLE_EDIT")
    }
})

feature("the finance approver approves another author's invoice while only AR may edit the draft", {
    when() {
        const service = "mantle.account.InvoiceServices."
        const invoiceId = receivablesHelper.asUser(
            "finance.ar",
            () => {
                const made = receivablesHelper.call(service + "create#Receivable", {
                    organizationPartyId: receivablesIds.organizationPartyId,
                    customerPartyId: receivablesIds.customerPartyId,
                    description: "Approval access fixture"
                })
                receivablesHelper.call(service + "store#InvoiceDraftItem", {
                    organizationPartyId: receivablesIds.organizationPartyId,
                    invoiceId: made.invoiceId,
                    itemTypeEnumId: "ItemTimeEntry",
                    quantity: 1,
                    amount: 10,
                    description: "Approval access services"
                })
                return made.invoiceId
            },
            false
        )
        const record = ec.entity.find("mantle.account.invoice.Invoice").condition("invoiceId", invoiceId).disableAuthz().one()
        const parameters = {
            organizationPartyId: receivablesIds.organizationPartyId,
            invoiceId,
            lastUpdatedStamp: record.lastUpdatedStamp,
            description: "Edited by AR"
        }
        const deniedReader = receivablesHelper.asUser(
            "finance.read",
            () => receivablesHelper.refusal(service + "store#InvoiceDraft", parameters),
            false
        )
        const deniedApprover = receivablesHelper.asUser(
            "finance.approve",
            () => receivablesHelper.refusal(service + "store#InvoiceDraft", parameters),
            false
        )
        const allowedEditor = receivablesHelper.asUser(
            "finance.ar",
            () => receivablesHelper.refusal(service + "store#InvoiceDraft", parameters),
            false
        )
        const current = ec.entity.find("mantle.account.invoice.Invoice").condition("invoiceId", invoiceId).disableAuthz().one()
        const approval = {
            organizationPartyId: receivablesIds.organizationPartyId,
            invoiceId,
            action: "approve",
            lastUpdatedStamp: current.lastUpdatedStamp,
            operationKey: "access-approve-" + ec.user.randomString(20),
            changeReason: "Separate finance approval"
        }
        const deniedEditor = receivablesHelper.asUser(
            "finance.ar",
            () => receivablesHelper.refusal(service + "change#InvoiceState", approval),
            false
        )
        const approved = receivablesHelper.asUser(
            "finance.approve",
            () => receivablesHelper.call(service + "change#InvoiceState", approval),
            false
        )
        const detail = () =>
            receivablesHelper.call(service + "get#InvoiceFinanceDetail", {
                organizationPartyId: receivablesIds.organizationPartyId,
                invoiceId: receivablesIds.invoiceId
            })
        return {
            deniedReader,
            deniedApprover,
            allowedEditor,
            deniedEditor,
            approved,
            editor: receivablesHelper.asUser("finance.ar", detail, false),
            approver: receivablesHelper.asUser("finance.approve", detail, false)
        }
    },
    then({deniedReader, deniedApprover, allowedEditor, deniedEditor, approved, editor, approver}) {
        deniedReader.includes("RECEIVABLE_EDIT")
        deniedApprover.includes("RECEIVABLE_EDIT")
        allowedEditor == ""
        deniedEditor.includes("INVOICE_APPROVE")
        approved.statusId == "InvoiceFinalized"
        editor.capabilities.canDraftEdit == true
        editor.capabilities.canApprove == false
        approver.capabilities.canDraftEdit == false
        approver.capabilities.canApprove == true
    }
})

feature("P4 server choices preserve selected labels outside the search page", {
    when() {
        return receivablesHelper.asUser(
            "finance.admin",
            () => {
                const service = "mantle.account.InvoiceServices."
                const organizationPartyId = receivablesIds.organizationPartyId
                // Own the source and credit used by the picker; shared demo invoices retain their original balances.
                const target = receivablesHelper.call(service + "create#Receivable", {
                    organizationPartyId,
                    customerPartyId: receivablesIds.customerPartyId,
                    description: "Choice source invoice"
                })
                receivablesHelper.call(service + "store#InvoiceDraftItem", {
                    organizationPartyId,
                    invoiceId: target.invoiceId,
                    itemTypeEnumId: "ItemTimeEntry",
                    quantity: 1,
                    amount: 25,
                    description: "Choice source services"
                })
                const finalize = invoiceId => {
                    const record = ec.entity
                        .find("mantle.account.invoice.Invoice")
                        .condition("invoiceId", invoiceId)
                        .disableAuthz()
                        .one()
                    return receivablesHelper.call(service + "change#InvoiceState", {
                        organizationPartyId,
                        invoiceId,
                        action: "finalize",
                        lastUpdatedStamp: record.lastUpdatedStamp,
                        operationKey: "choice-finalize-" + ec.user.randomString(20),
                        changeReason: "Prepare a valid selected choice"
                    })
                }
                finalize(target.invoiceId)
                const credit = receivablesHelper.call(service + "create#InvoiceCreditMemo", {
                    organizationPartyId,
                    originalInvoiceId: target.invoiceId,
                    amount: 5,
                    description: "Choice customer credit",
                    linkToOriginal: true,
                    allocateToLines: true,
                    operationKey: "choice-credit-" + ec.user.randomString(20)
                })
                finalize(credit.invoiceId)
                const bill = receivablesHelper.call("mantle.ledger.AccountingServices.create#DraftDocument", {
                    kind: "bills",
                    organizationPartyId,
                    otherPartyId: receivablesIds.customerPartyId,
                    description: "Choice supplier bill"
                })
                const reviewedContentId = "CHOICE_ATTACH_" + ec.user.randomString(20)
                const reviewedLocation =
                    "dbresource://mantle/content/invoice/" + target.invoiceId + "/content_" + reviewedContentId + "/Reviewed.txt"
                const reviewedFile = ec.resource.getLocationReference(reviewedLocation)
                reviewedFile.putText("The supporting scope reviewed by this test")
                receivablesHelper.call("create#mantle.account.invoice.InvoiceContent", {
                    invoiceContentId: reviewedContentId,
                    invoiceId: target.invoiceId,
                    contentLocation: reviewedLocation,
                    contentTypeEnumId: "IctInvoiceDocument",
                    description: "Reviewed customer attachment"
                })
                const nativeAttachmentParameters = {
                    organizationPartyId,
                    invoiceId: target.invoiceId,
                    attachmentContentIdList: [reviewedContentId]
                }
                const reviewedRow = receivablesHelper.call(service + "get#InvoiceDeliveryAttachments", nativeAttachmentParameters)
                    .attachmentRows[0]
                const reviewedToken = reviewedContentId + "~" + reviewedRow.attachmentVersion
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
                    {
                        choice: "invoiceAttachments",
                        invoiceId: receivablesIds.finalizedInvoiceId,
                        selected: "BOSS_ACCT_AR_SUPPORT"
                    },
                    {choice: "reviewedInvoiceAttachments", invoiceId: target.invoiceId, selected: reviewedToken},
                    {choice: "invoiceItemTypes", selected: "ItemTimeEntry"},
                    {choice: "identificationTypes", selected: "PtidPassport"},
                    {choice: "bankAccountTypes", selected: "BatChecking"},
                    {choice: "taxAuthorities", selected: "UsaIrs"}
                ]
                const failures = []
                for (const entry of cases) {
                    const projectScope = entry.choice === "projects"
                    if (projectScope) receivablesHelper.selectOrganization(receivablesIds.foreignOrganizationPartyId)
                    try {
                        const parameters = Object.assign(
                            {
                                organizationPartyId:
                                    entry.choice === "projects" ? receivablesIds.foreignOrganizationPartyId : organizationPartyId
                            },
                            entry
                        )
                        const initial =
                            receivablesHelper.call("ironstone.accounting.AccessServices.get#Choices", parameters).options || []
                        const selected = entry.selected ? initial.find(row => row.value === entry.selected) : initial[0]
                        if (!selected) {
                            failures.push(entry.choice + ": required fixture option is absent")
                            continue
                        }
                        const term = "no-matching-accounting-fixture-92831"
                        const outside =
                            receivablesHelper.call(
                                "ironstone.accounting.AccessServices.get#Choices",
                                Object.assign({}, parameters, {term, selected: null})
                            ).options || []
                        if (outside.length) failures.push(entry.choice + ": search did not exclude the selected fixture")
                        const filtered =
                            receivablesHelper.call(
                                "ironstone.accounting.AccessServices.get#Choices",
                                Object.assign({}, parameters, {term, selected: selected.value})
                            ).options || []
                        if (!filtered.some(row => row.value === selected.value && row.label === selected.label))
                            failures.push(entry.choice + ": selected label was lost")
                    } finally {
                        if (projectScope) receivablesHelper.selectOrganization(organizationPartyId)
                    }
                }
                reviewedFile.putText("This source changed after its supporting bytes were reviewed")
                const currentRow = receivablesHelper.call(service + "get#InvoiceDeliveryAttachments", nativeAttachmentParameters)
                    .attachmentRows[0]
                if (currentRow.attachmentVersion === reviewedRow.attachmentVersion)
                    failures.push("reviewedInvoiceAttachments: source byte change did not change its version")
                const retained =
                    receivablesHelper.call("ironstone.accounting.AccessServices.get#Choices", {
                        organizationPartyId,
                        invoiceId: target.invoiceId,
                        choice: "reviewedInvoiceAttachments",
                        term: "no-matching-accounting-fixture-92831",
                        selected: reviewedToken
                    }).options || []
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

feature("a linked customer credit remains an AR record in the common reads and never appears as an AP bill", {
    when() {
        const credit = receivablesHelper.asUser(
            "finance.ar",
            () =>
                receivablesHelper.call("mantle.account.InvoiceServices.create#InvoiceCreditMemo", {
                    organizationPartyId: receivablesIds.organizationPartyId,
                    originalInvoiceId: receivablesIds.finalizedInvoiceId,
                    amount: 5,
                    description: "Credit access fixture",
                    linkToOriginal: true,
                    allocateToLines: true,
                    operationKey: "access-credit-" + ec.user.randomString(20)
                }),
            false
        )
        const invoiceId = credit.invoiceId
        const parameters = {organizationPartyId: receivablesIds.organizationPartyId, recordId: invoiceId}
        const list = kind =>
            receivablesHelper.call("mantle.ledger.AccountingServices.find#Records", Object.assign({}, parameters, {kind}))
        return {
            invoiceId,
            ar: receivablesHelper.asUser(
                "finance.ar",
                () => ({
                    record: receivablesHelper.call(
                        "mantle.ledger.AccountingServices.get#Record",
                        Object.assign({}, parameters, {kind: "invoices"})
                    ).record,
                    records: list("invoices").records
                }),
                false
            ),
            ap: receivablesHelper.asUser(
                "finance.ap",
                () => ({
                    denied: receivablesHelper.refusal(
                        "mantle.ledger.AccountingServices.get#Record",
                        Object.assign({}, parameters, {kind: "bills"})
                    ),
                    records: list("bills").records
                }),
                false
            )
        }
    },
    then({invoiceId, ar, ap}) {
        !!invoiceId
        ar.record.invoiceId == invoiceId
        ar.records.some(row => row.invoiceId === invoiceId)
        ap.denied.includes("not available")
        !ap.records.some(row => row.invoiceId === invoiceId)
    }
})

feature("invoice header controls pair the approver, editor and reader capabilities", {
    when() {
        const render = () => receivablesHelper.page("Receivables/InvoiceDetail", {recordId: receivablesIds.invoiceId}, "html")
        return {
            approver: receivablesHelper.asUser("finance.approve", render),
            editor: receivablesHelper.asUser("finance.ar", render),
            reader: receivablesHelper.asUser("finance.read", render)
        }
    },
    then({approver, editor, reader}) {
        approver.status == 200
        editor.status == 200
        reader.status == 200
        approver.errors == []
        editor.errors == []
        reader.errors == []
        approver.output.includes("Approve invoice")
        !approver.output.includes("Edit invoice")
        editor.output.includes("Edit invoice")
        editor.output.includes("Finalize invoice")
        !editor.output.includes("Approve invoice")
        !reader.output.includes("Approve invoice")
        !reader.output.includes("Finalize invoice")
        !reader.output.includes("Edit invoice")
    }
})

// P6 payables: each service refuses a user without its permission, and a user who has it succeeds with the same parameters.
feature("payables services pair a refusal with the permitted user's success, with artifact authz #enabled", {
    where: [{enabled: true}, {enabled: false}],
    when({enabled}) {
        const helper = ec.resource.script("component://mr-boss/test/AccountingSpecLib.js")
        const as = (user, run) => helper.asUser(user, run, enabled)
        const org = helper.ids.organizationPartyId
        const reference = "ACCESS-" + Date.now() + (enabled ? "-A" : "-D")
        const upload = {organizationPartyId: org, supplierPartyId: "BOSS_ACCT_SUPPLIER", referenceNumber: reference, amount: "10"}
        const importDenied = as("finance.approve", () => refusal("mantle.account.InvoiceServices.import#Bill", upload))
        const imported = as("finance.ap", () => helper.call("mantle.account.InvoiceServices.import#Bill", upload))
        const hold = {invoiceId: imported.invoiceId, organizationPartyId: org, holdReasonEnumId: "IhrApReview"}
        const holdDenied = as("finance.read", () => refusal("mantle.account.InvoiceServices.hold#Invoice", hold))
        const held = as("finance.ap", () => helper.call("mantle.account.InvoiceServices.hold#Invoice", hold))
        const release = {invoiceHoldId: held.invoiceHoldId, organizationPartyId: org, releaseComment: "Checked"}
        const releaseDenied = as("finance.ap", () => refusal("mantle.account.InvoiceServices.release#InvoiceHold", release))
        const released = as("finance.approve", () => refusal("mantle.account.InvoiceServices.release#InvoiceHold", release))
        const terms = {organizationPartyId: org, supplierPartyId: "BOSS_ACCT_SUPPLIER", selfBillingIndicator: enabled ? "Y" : "N"}
        const termsDenied = as("finance.ar", () => refusal("mantle.party.SupplierServices.store#SupplierProfile", terms))
        const termsSaved = as("finance.ap", () => refusal("mantle.party.SupplierServices.store#SupplierProfile", terms))
        const approvals = user => as(user, () => helper.page("Approvals", {}, "qvt"))
        return {
            enabled,
            importDenied,
            holdDenied,
            releaseDenied,
            released,
            termsDenied,
            termsSaved,
            arApprovals: approvals("finance.ar"),
            approverApprovals: approvals("finance.approve")
        }
    },
    then({enabled, importDenied, holdDenied, releaseDenied, released, termsDenied, termsSaved, arApprovals, approverApprovals}) {
        importDenied.includes("PERMISSION_DENIED")
        holdDenied.includes("PERMISSION_DENIED")
        releaseDenied.includes("PERMISSION_DENIED")
        released == ""
        termsDenied.includes("PERMISSION_DENIED")
        termsSaved == ""
        approverApprovals.status == 200
        approverApprovals.output.includes("Inboxes")
        // the Approvals area is the approvers' and AP's: with artifact authz on, AR does not reach it
        !enabled || !arApprovals.output.includes("Inboxes")
    }
})

feature("matching services pair a refusal with the permitted user's success, with artifact authz #enabled", {
    where: [{enabled: true}, {enabled: false}],
    when({enabled}) {
        const helper = ec.resource.script("component://mr-boss/test/AccountingSpecLib.js")
        const as = (user, run) => helper.asUser(user, run, enabled)
        const org = helper.ids.organizationPartyId
        // a bill of one unit against the demo's received order, matched and then unapplied, so the demo stays as it was
        const reference = "MATCH-ACCESS-" + Date.now() + (enabled ? "-A" : "-D")
        const invoiceId = as("finance.ap", () =>
            helper.call("mantle.account.InvoiceServices.import#Bill", {
                organizationPartyId: org,
                supplierPartyId: "BOSS_ACCT_SUPPLIER",
                referenceNumber: reference
            })
        ).invoiceId
        ec.service
            .sync()
            .name("mantle.account.InvoiceServices.create#InvoiceItem")
            .parameters({invoiceId, itemTypeEnumId: "ItemInventory", productId: "BOSS_ACCT_SUPPLY", quantity: 1, amount: 8})
            .disableAuthz()
            .call()
        const bill = {invoiceId, organizationPartyId: org}
        const evaluateDenied = as("finance.ar", () => refusal("mantle.account.InvoiceMatchServices.evaluate#InvoiceMatch", bill))
        const evaluated = as("finance.read", () => helper.call("mantle.account.InvoiceMatchServices.evaluate#InvoiceMatch", bill))
        const apply = Object.assign({}, bill, {
            allocationList: evaluated.sourceRows.map(row => ({
                invoiceItemSeqId: row.invoiceItemSeqId,
                orderId: row.orderId,
                orderItemSeqId: row.orderItemSeqId,
                assetReceiptId: row.assetReceiptId,
                quantity: String(row.quantity)
            }))
        })
        const applyDenied = as("finance.read", () => refusal("mantle.account.InvoiceMatchServices.apply#InvoiceMatch", apply))
        const applied = as("finance.match", () => refusal("mantle.account.InvoiceMatchServices.apply#InvoiceMatch", apply))
        const unapplyDenied = as("finance.approve", () =>
            refusal("mantle.account.InvoiceMatchServices.unapply#InvoiceMatch", bill)
        )
        const unapplied = as("finance.ap", () => refusal("mantle.account.InvoiceMatchServices.unapply#InvoiceMatch", bill))
        const policy = {
            organizationPartyId: org,
            billBasisEnumId: "ImbReceived",
            receiptRequired: "Y",
            priceTolerancePercent: 2,
            varianceActionEnumId: "ImaHold"
        }
        const policyDenied = as("finance.ap", () => refusal("mantle.account.InvoiceMatchServices.store#MatchPolicy", policy))
        const policySaved = as("finance.admin", () => refusal("mantle.account.InvoiceMatchServices.store#MatchPolicy", policy))
        const legacy = {organizationPartyId: org, supplierPartyId: "BOSS_ACCT_SUPPLIER"}
        const legacyDenied = as("finance.read", () =>
            refusal("mantle.account.InvoiceMatchServices.preview#LegacyMatches", legacy)
        )
        const legacyPreview = as("finance.match", () =>
            refusal("mantle.account.InvoiceMatchServices.preview#LegacyMatches", legacy)
        )
        const matchTab = as("finance.match", () =>
            helper.page("Payables/BillDetail/Match", {recordId: invoiceId, lastStandalone: "true"}, "qvt")
        )
        const arTab = as("finance.ar", () =>
            helper.page("Payables/BillDetail/Match", {recordId: invoiceId, lastStandalone: "true"})
        )
        return {
            enabled,
            evaluated,
            evaluateDenied,
            applyDenied,
            applied,
            unapplyDenied,
            unapplied,
            policyDenied,
            policySaved,
            legacyDenied,
            legacyPreview,
            matchTab,
            arTab
        }
    },
    then(result) {
        result.evaluated.sourceRows.length == 1
        result.evaluateDenied.includes("PERMISSION_DENIED")
        result.applyDenied.includes("PERMISSION_DENIED")
        result.applied == ""
        result.unapplyDenied.includes("PERMISSION_DENIED")
        result.unapplied == ""
        result.policyDenied.includes("PERMISSION_DENIED")
        result.policySaved == ""
        result.legacyDenied.includes("PERMISSION_DENIED")
        result.legacyPreview == ""
        result.matchTab.status == 200
        result.matchTab.output.includes("Apply match")
        // a match operator reaches Payables; with artifact authz on, AR does not, and AR's tab shows no match either way
        !result.arTab.output.includes("Apply match")
    }
})

// Banking (P9): the same statement review, deposit and bank read, refused for the role that lacks the permission and
// accepted for the one that holds it; the Banking section opens for treasury and the reader, not for AR.
feature("banking needs BANK_RECONCILE, deposits need payment edit, and AR does not open Banking", {
    when() {
        const helper = ec.resource.script("component://mr-boss/test/AccountingSpecLib.js")
        const bank = {paymentMethodId: helper.ids.bankPaymentMethodId}
        const day = ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
        const review = Object.assign({}, bank, {
            formatEnumId: "SifCsv",
            statementText: "Date,Description,Amount\n" + day + ",Access check,-1.00"
        })
        const rule = {organizationPartyId: helper.ids.organizationPartyId, matchText: "access check"}
        const deposit = Object.assign({}, bank, {paymentIdList: ["BOSS_ACCT_BANK_RCPT1"], operationKey: "access-deposit"})
        const asRole = (user, run) => asFinance(user, true, run)
        return {
            arReview: asRole("finance.ar", () => refusal("mantle.account.ReconciliationServices.review#StatementImport", review)),
            readerReview: asRole("finance.read", () =>
                refusal("mantle.account.ReconciliationServices.review#StatementImport", review)
            ),
            treasuryReview: asRole("finance.treasury", () =>
                refusal("mantle.account.ReconciliationServices.review#StatementImport", review)
            ),
            readerRule: asRole("finance.read", () => refusal("mantle.account.ReconciliationServices.store#Rule", rule)),
            readerLines: asRole("finance.read", () => refusal("mantle.account.ReconciliationServices.find#BankLines", bank)),
            arLines: asRole("finance.ar", () => refusal("mantle.account.ReconciliationServices.find#BankLines", bank)),
            readerDeposit: asRole("finance.read", () => refusal("mantle.account.PaymentServices.create#DepositSlip", deposit)),
            arPage: asRole("finance.ar", () => helper.page("Banking/BankAccounts")),
            readerPage: asRole("finance.read", () => helper.page("Banking/BankAccountDetail", bank)),
            treasuryPage: asRole("finance.treasury", () => helper.page("Banking/BankAccountDetail", bank))
        }
    },
    then({
        arReview,
        readerReview,
        treasuryReview,
        readerRule,
        readerLines,
        arLines,
        readerDeposit,
        arPage,
        readerPage,
        treasuryPage
    }) {
        arReview.includes("PERMISSION_DENIED")
        readerReview.includes("PERMISSION_DENIED")
        treasuryReview == ""
        readerRule.includes("PERMISSION_DENIED")
        readerLines == ""
        arLines.includes("PERMISSION_DENIED")
        readerDeposit.includes("PERMISSION_DENIED")
        arPage.status != 200 || !arPage.output.includes("Operating account")
        readerPage.output.includes("Operating account") && readerPage.errors.length == 0
        !readerPage.output.includes("Import statement") && !readerPage.output.includes("Deposit slip")
        treasuryPage.output.includes("Import statement") && treasuryPage.output.includes("Deposit slip")
    }
})

// Period close (P11): the same close, reopen and period run requests, refused for the role without the permission and
// passing the permission check for the one that holds it (the close then stops at the demo period's blockers, the reopen
// at the open period); the Period close section opens for the approver and not for AR.
feature("closing needs FISCAL_CLOSE, reopening FISCAL_REOPEN and a period run GL posting, and AR does not open Period close", {
    when() {
        const helper = ec.resource.script("component://mr-boss/test/AccountingSpecLib.js")
        const p = {organizationPartyId: helper.ids.organizationPartyId, timePeriodId: helper.ids.closePeriodId}
        const reopen = Object.assign({changeReason: "Access check"}, p)
        const run = Object.assign({runKindEnumId: "PrkProjectCost"}, p)
        const asRole = (user, action) => asFinance(user, true, action)
        return {
            glClose: asRole("finance.gl", () => refusal("mantle.ledger.CloseServices.close#Period", p)),
            approverClose: asRole("finance.approve", () => refusal("mantle.ledger.CloseServices.close#Period", p)),
            approverReopen: asRole("finance.approve", () => refusal("mantle.ledger.CloseServices.reopen#Period", reopen)),
            adminReopen: asRole("finance.admin", () => refusal("mantle.ledger.CloseServices.reopen#Period", reopen)),
            readerRun: asRole("finance.read", () => refusal("mantle.ledger.PeriodRunServices.preview#Run", run)),
            glRun: asRole("finance.gl", () => refusal("mantle.ledger.PeriodRunServices.preview#Run", run)),
            arChecklist: asRole("finance.ar", () => refusal("mantle.ledger.CloseServices.get#Checklist", p)),
            arPage: asRole("finance.ar", () => helper.page("PeriodClose/PeriodCloseDetail", p)),
            approverPage: asRole("finance.approve", () => helper.page("PeriodClose/PeriodCloseDetail", p))
        }
    },
    then({glClose, approverClose, approverReopen, adminReopen, readerRun, glRun, arChecklist, arPage, approverPage}) {
        glClose.includes("PERMISSION_DENIED")
        approverClose.includes("CLOSE_BLOCKED")
        approverReopen.includes("PERMISSION_DENIED")
        adminReopen.includes("PERIOD_OPEN")
        readerRun.includes("PERMISSION_DENIED")
        glRun == ""
        arChecklist.includes("RECORD_UNAVAILABLE") || arChecklist.includes("ACCESS_DENIED")
        arPage.status != 200 || !arPage.output.includes("BOSS_ACCT_CLOSE_INVOICE")
        approverPage.output.includes("BOSS_ACCT_CLOSE_INVOICE") && approverPage.errors.length == 0
    }
})

feature("tax: rates and authorities for finance administrators, statements for tax users, neither for AR #enabled", {
    where: [{enabled: true}, {enabled: false}],
    when({enabled}) {
        const rate = {
            organizationPartyId: "BOSS_ACCT_ORG",
            taxAuthorityRateId: "BOSS_ACCT_UT_2020",
            thruDate: "2019-06-01 00:00:00",
            changeReason: "Access spec"
        }
        const statements = {organizationPartyId: "BOSS_ACCT_ORG"}
        return {
            // the same end date is refused for its dates, not its authority, for an administrator
            adminRate: asFinance("finance.admin", enabled, () => refusal("mantle.other.TaxServices.store#Rate", rate)),
            taxRate: asFinance("finance.tax", enabled, () => refusal("mantle.other.TaxServices.store#Rate", rate)),
            taxList: asFinance("finance.tax", enabled, () =>
                refusal("ironstone.accounting.TaxServices.find#Statements", statements)
            ),
            arList: asFinance("finance.ar", enabled, () =>
                refusal("ironstone.accounting.TaxServices.find#Statements", statements)
            ),
            arRun: asFinance("finance.ar", enabled, () =>
                refusal("mantle.other.TaxServices.run#Vendor1099Statements", {
                    organizationPartyId: "BOSS_ACCT_ORG",
                    timePeriodId: "_NA_"
                })
            ),
            taxRun: asFinance("finance.tax", enabled, () =>
                refusal("mantle.other.TaxServices.run#Vendor1099Statements", {
                    organizationPartyId: "BOSS_ACCT_ORG",
                    timePeriodId: "_NA_"
                })
            )
        }
    },
    then({adminRate, taxRate, taxList, arList, arRun, taxRun}) {
        adminRate.includes("RATE_DATES_INVALID")
        taxRate.includes("admin authority is required")
        taxList == ""
        arList.includes("Tax authority is required")
        arRun.includes("taxEdit authority is required")
        taxRun.includes("PERIOD_UNAVAILABLE")
    }
})

// Fixed assets (P12): the same book requests refused for the role without the permission and passing the permission check
// for the one that holds it (each then stops at its own validation, so nothing changes); AR does not open Fixed assets.
feature("fixed assets: book events need GL posting, classes and cost repair finance administration, and AR has no list", {
    when() {
        const helper = ec.resource.script("component://mr-boss/test/AccountingSpecLib.js")
        const org = helper.ids.organizationPartyId
        const capitalize = {assetId: "BOSS_ACCT_FA_VAN", acquireCostUomId: "EUR", operationKey: "access-fa-cap"}
        const storeClass = {organizationPartyId: org, classEnumId: "AsClsLaptop", usefulLifeYears: 0, changeReason: "Access"}
        const repair = {assetId: "BOSS_ACCT_FA_VAN", acquireCost: "-1", changeReason: "Access", operationKey: "access-fa-fix"}
        const asRole = (user, action) => asFinance(user, true, action)
        const books = "mantle.ledger.AssetBookServices."
        return {
            readCapitalize: asRole("finance.read", () => refusal(books + "capitalize#Asset", capitalize)),
            glCapitalize: asRole("finance.gl", () => refusal(books + "capitalize#Asset", capitalize)),
            glClass: asRole("finance.gl", () => refusal(books + "store#Class", storeClass)),
            adminClass: asRole("finance.admin", () => refusal(books + "store#Class", storeClass)),
            glRepair: asRole("finance.gl", () => refusal(books + "repair#AcquireCost", repair)),
            adminRepair: asRole("finance.admin", () => refusal(books + "repair#AcquireCost", repair)),
            arBook: asRole("finance.ar", () => refusal(books + "get#AssetBook", {assetId: "BOSS_ACCT_FA_VAN"})),
            arList: asRole("finance.ar", () =>
                refusal("ironstone.accounting.AssetBookServices.find#Assets", {organizationPartyId: org})
            ),
            readList: asRole("finance.read", () =>
                refusal("ironstone.accounting.AssetBookServices.find#Assets", {organizationPartyId: org})
            )
        }
    },
    then({readCapitalize, glCapitalize, glClass, adminClass, glRepair, adminRepair, arBook, arList, readList}) {
        readCapitalize.includes("PERMISSION_DENIED")
        glCapitalize.includes("CURRENCY_UNSUPPORTED")
        glClass.includes("PERMISSION_DENIED")
        adminClass.includes("LIFE_INVALID")
        glRepair.includes("PERMISSION_DENIED")
        adminRepair.includes("AMOUNT_INVALID")
        arBook.includes("PERMISSION_DENIED")
        arList.includes("read authority is required")
        readList == ""
    }
})

feature("payment run services pair a refusal with the permitted user's success, with artifact authz #enabled", {
    where: [{enabled: true}, {enabled: false}],
    when({enabled}) {
        const helper = ec.resource.script("component://mr-boss/test/AccountingSpecLib.js")
        const as = (user, run) => helper.asUser(user, run, enabled)
        const org = helper.ids.organizationPartyId
        const day = ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
        const request = {
            organizationPartyId: org,
            paymentMethodId: "BOSS_ACCT_RUN_BANK",
            paymentInstrumentEnumId: "PiCompanyCheck",
            dueThroughDate: day,
            payDate: day,
            description: "Access spec run"
        }
        const createDenied = as("finance.treasury", () => refusal("mantle.account.PaymentRunServices.create#Run", request))
        const made = as("finance.ap", () => helper.call("mantle.account.PaymentRunServices.create#Run", request))
        const run = {organizationPartyId: org, paymentRunId: made.paymentRunId}
        const stamp = () =>
            ec.entity.find("mantle.account.payment.PaymentRun").condition(run).disableAuthz().one().lastUpdatedStamp
        const approveDenied = as("finance.ap", () =>
            refusal("mantle.account.PaymentRunServices.approve#Run", Object.assign({lastUpdatedStamp: stamp()}, run))
        )
        const approved = as("finance.approve", () =>
            refusal("mantle.account.PaymentRunServices.approve#Run", Object.assign({lastUpdatedStamp: stamp()}, run))
        )
        const execute = Object.assign({operationKey: "ACCESS-RUN-" + made.paymentRunId}, run)
        const executeDenied = as("finance.ap", () => refusal("mantle.account.PaymentRunServices.execute#Run", execute))
        // payment view reads runs as it reads their payments; a tax user has no payables or payment read
        const readDenied = as("finance.tax", () => refusal("mantle.account.PaymentRunServices.get#Run", run))
        const listDenied = as("finance.tax", () =>
            refusal("ironstone.accounting.PaymentRunServices.find#Runs", {organizationPartyId: org})
        )
        const read = as("finance.read", () => refusal("mantle.account.PaymentRunServices.get#Run", run))
        // the run is cancelled so its bills stay free for the other specs' runs
        const cancelled = as("finance.ap", () => refusal("mantle.account.PaymentRunServices.cancel#Run", run))
        return {createDenied, approveDenied, approved, executeDenied, readDenied, listDenied, read, cancelled}
    },
    then({createDenied, approveDenied, approved, executeDenied, readDenied, listDenied, read, cancelled}) {
        createDenied.includes("PERMISSION_DENIED")
        approveDenied.includes("PERMISSION_DENIED")
        approved == ""
        executeDenied.includes("PERMISSION_DENIED")
        readDenied.includes("PERMISSION_DENIED")
        listDenied.includes("PERMISSION_DENIED")
        read == ""
        cancelled == ""
    }
})
