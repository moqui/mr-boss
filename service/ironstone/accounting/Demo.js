// The Accounting demo records for BOSS_ACCT_ORG (BossZAccountingDemoData.xml), made once by fixed ID: a draft invoice,
// bill and payment, a draft and a posted journal entry, the payables demo (a supplier on terms, a bill awaiting approval,
// a bill on hold, an approved purchase order), the matching demo (a match policy and two bills against a received order),
// the organization's adoption of the posting guard, dimensions, forward adjustments, receipt billing for self-billing
// suppliers only and project cost posting, and last month's period with the two blockers the close walk resolves. It is
// not a Ziziwork organization, so the adoption does not reach Mantle's demo
// flows, which post for ORG_ZIZI_RETAIL (rolled up to ORG_ZIZI_CORP) directly.
const policy = ec.resource.script("component://mr-mantle/service/mantle/ledger/AccountingPolicy.js")
const organizationPartyId = "BOSS_ACCT_ORG"

function createOnce(entity, key, values) {
    if (!policy.one(entity, key)) policy.call("create#" + entity, Object.assign({}, key, values))
}

function documents(currency) {
    const common = {
        statusId: "InvoiceInProcess",
        currencyUomId: currency,
        invoiceDate: ec.user.nowTimestamp,
        accountingDate: ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
    }
    createOnce(
        "mantle.account.invoice.Invoice",
        {invoiceId: "BOSS_ACCT_INVOICE"},
        Object.assign({invoiceTypeEnumId: "InvoiceSales", fromPartyId: organizationPartyId, toPartyId: "ORG_ACME"}, common, {
            description: "Accounting demo customer invoice"
        })
    )
    createOnce(
        "mantle.account.invoice.Invoice",
        {invoiceId: "BOSS_ACCT_BILL"},
        Object.assign({invoiceTypeEnumId: "InvoiceSales", fromPartyId: "ORG_ACME", toPartyId: organizationPartyId}, common, {
            description: "Accounting demo supplier bill"
        })
    )
    createOnce("mantle.party.PartyRole", {partyId: "ORG_ACME", roleTypeId: "Customer"}, {})
    for (const invoiceId of ["BOSS_ACCT_INVOICE", "BOSS_ACCT_BILL"]) {
        if (policy.one("mantle.account.invoice.InvoiceItem", {invoiceId, invoiceItemSeqId: "00001"})) continue
        policy.call("mantle.account.InvoiceServices.create#InvoiceItem", {
            invoiceId,
            invoiceItemSeqId: "00001",
            itemTypeEnumId: "ItemTimeEntry",
            description: "Accounting demo services",
            quantity: "1",
            amount: ec.l10n.roundCurrency(toDecimal("125"), currency)
        })
    }
    createOnce(
        "mantle.account.payment.Payment",
        {paymentId: "BOSS_ACCT_PAYMENT"},
        {
            paymentTypeEnumId: "PtDisbursement",
            paymentInstrumentEnumId: "PiOther",
            statusId: "PmntProposed",
            fromPartyId: organizationPartyId,
            toPartyId: "ORG_ACME",
            amountUomId: currency,
            amount: 125,
            comments: "Accounting demo proposed payment"
        }
    )
}

// An expense account to debit and an asset account to credit, by account code, so the demo is the same on every load.
function entryAccounts() {
    const conditions = ec.entity.conditionFactory
    const postable = conditions.makeCondition(
        [
            conditions.makeCondition("disallowPosting", "is-null", null),
            conditions.makeCondition("disallowPosting", "not-equals", "Y")
        ],
        "or"
    )
    const accounts = Array.from(
        policy
            .find("mantle.ledger.account.GlAccountAndOrganization", {organizationPartyId})
            .condition(postable)
            .orderBy("accountCode,glAccountId")
            .list()
    )
    const code = account => String(account.accountCode || account.glAccountId)
    const expense = accounts.find(account => code(account).startsWith("6"))
    const asset = accounts.find(account => code(account).startsWith("1"))
    if (!expense || !asset) throw new Error("The Accounting demo needs an expense and an asset posting account")
    return [expense.glAccountId, asset.glAccountId]
}

function journalEntries(currency) {
    const [debitAccountId, creditAccountId] = entryAccounts()
    for (const [acctgTransId, description] of [
        ["BOSS_ACCT_ENTRY", "Office expense review"],
        ["BOSS_ACCT_POSTED", "Posted office expense"]
    ]) {
        if (policy.one("mantle.ledger.transaction.AcctgTrans", {acctgTransId})) continue
        policy.call("create#mantle.ledger.transaction.AcctgTrans", {
            acctgTransId,
            organizationPartyId,
            acctgTransTypeEnumId: "AttInternal",
            amountUomId: currency,
            transactionDate: ec.user.nowTimestamp,
            isPosted: "N",
            glFiscalTypeEnumId: "GLFT_ACTUAL",
            description
        })
        for (const [glAccountId, debitCreditFlag] of [
            [debitAccountId, "D"],
            [creditAccountId, "C"]
        ])
            policy.call("mantle.ledger.LedgerServices.create#AcctgTransEntry", {
                acctgTransId,
                glAccountId,
                debitCreditFlag,
                amount: 125
            })
        if (acctgTransId === "BOSS_ACCT_POSTED") {
            const reviewed = policy.call("mantle.ledger.JournalServices.preview#Entry", {acctgTransId})
            policy.call(
                "mantle.ledger.JournalServices.post#Entry",
                Object.assign({}, reviewed, {
                    acctgTransId,
                    operationKey: "BOSS_ACCT_DEMO_POST",
                    changeReason: "Accounting demo posting"
                })
            )
        }
    }
}

function configuration() {
    policy.call("update#mantle.ledger.config.PartyAcctgPreference", {
        organizationPartyId,
        postingGuardEnabled: "Y",
        requiredLedgerDimensionsEnabled: "Y",
        forwardIssuanceRepostEnabled: "Y",
        singleCurrencyDocumentsOnly: "Y"
    })
    createOnce("mantle.ledger.account.GlAccountOrganization", {organizationPartyId, glAccountId: "258300000"}, {fromDate: 0})
    for (const isPayable of ["Y", "N"])
        createOnce(
            "mantle.ledger.config.PaymentTypeGlAccount",
            {
                organizationPartyId,
                paymentTypeEnumId: "PtInternalTransfer",
                isApplied: "N",
                isPayable
            },
            {glAccountId: "258300000"}
        )
    createOnce(
        "mantle.ledger.account.GlAccountOrganization",
        {organizationPartyId, glAccountId: "BOSS_INVENTORY_REVALUATION"},
        {fromDate: 0}
    )
    const offset = policy.call("mantle.ledger.LedgerServices.get#DefaultGlAccountByType", {
        organizationPartyId,
        glAccountTypeEnumId: "GatInventoryRevaluation"
    })
    if (!offset.glAccountId)
        policy.call("create#mantle.ledger.config.GlAccountTypeDefault", {
            organizationPartyId,
            glAccountTypeEnumId: "GatInventoryRevaluation",
            glAccountId: "BOSS_INVENTORY_REVALUATION"
        })
    for (const paymentGatewayConfigId of ["TEST_APPROVE", "TEST_DECLINE"])
        createOnce(
            "mantle.account.method.PaymentGatewayOrganization",
            {organizationPartyId, paymentGatewayConfigId},
            {fromDate: 0, isEnabled: "Y"}
        )
}

function finalizedReceivable(currency) {
    const invoiceId = "BOSS_ACCT_AR_FINALIZED"
    createOnce(
        "mantle.account.invoice.Invoice",
        {invoiceId},
        {
            invoiceTypeEnumId: "InvoiceSales",
            statusId: "InvoiceInProcess",
            fromPartyId: organizationPartyId,
            toPartyId: "ORG_ACME",
            invoiceDate: ec.user.nowTimestamp,
            accountingDate: ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd"),
            currencyUomId: currency,
            description: "Customer services invoice",
            draftedByUserId: ec.user.userId
        }
    )
    if (!policy.one("mantle.account.invoice.InvoiceItem", {invoiceId, invoiceItemSeqId: "00001"}))
        policy.call("mantle.account.InvoiceServices.create#InvoiceItem", {
            invoiceId,
            invoiceItemSeqId: "00001",
            itemTypeEnumId: "ItemTimeEntry",
            quantity: "1",
            amount: ec.l10n.roundCurrency(toDecimal("125"), currency),
            description: "Customer services"
        })
    const invoice = policy.one("mantle.account.invoice.Invoice", {invoiceId})
    if (invoice.statusId === "InvoiceInProcess")
        policy.call("mantle.account.InvoiceServices.change#InvoiceState", {
            invoiceId,
            organizationPartyId,
            action: "finalize",
            lastUpdatedStamp: invoice.lastUpdatedStamp,
            operationKey: "BOSS_ACCT_DEMO_AR_FINAL",
            changeReason: "Accounting demo invoice posting"
        })
}

function storeReceivable(currency) {
    const productStoreId = "BOSS_ACCT_STORE"
    const invoiceId = "BOSS_ACCT_STORE_DRAFT"
    createOnce(
        "mantle.product.store.ProductStore",
        {productStoreId},
        {
            storeName: "Accounting consulting store",
            organizationPartyId
        }
    )
    createOnce(
        "moqui.basic.email.EmailTemplate",
        {emailTemplateId: "BOSS_ACCT_STORE_NOTICE"},
        {
            emailServerId: "BOSS_ACCOUNTING_DEMO",
            fromAddress: "accounting@example.test",
            subject: "Store invoice finalized",
            bodyScreenLocation: "component://framework/screen/ScreenRenderEmail.xml"
        }
    )
    createOnce(
        "mantle.product.store.ProductStoreEmail",
        {productStoreId, emailTypeEnumId: "PsetInvoiceFinalized", fromDate: "1970-01-01T00:00:00Z"},
        {
            emailTemplateId: "BOSS_ACCT_STORE_NOTICE"
        }
    )
    if (
        !policy
            .find("mantle.party.contact.PartyContactMechInfo", {partyId: "ORG_ACME", contactMechPurposeId: "EmailBilling"})
            .conditionDate("fromDate", "thruDate", null)
            .count()
    )
        policy.call("mantle.party.ContactServices.create#EmailAddress", {
            partyId: "ORG_ACME",
            emailAddress: "accounting.customer@example.test",
            contactMechPurposeId: "EmailBilling"
        })
    createOnce(
        "mantle.account.invoice.Invoice",
        {invoiceId},
        {
            invoiceTypeEnumId: "InvoiceSales",
            statusId: "InvoiceInProcess",
            fromPartyId: organizationPartyId,
            toPartyId: "ORG_ACME",
            invoiceDate: ec.user.nowTimestamp,
            accountingDate: ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd"),
            currencyUomId: currency,
            productStoreId,
            description: "Store customer services",
            draftedByUserId: ec.user.userId
        }
    )
    if (!policy.one("mantle.account.invoice.InvoiceItem", {invoiceId, invoiceItemSeqId: "00001"}))
        policy.call("mantle.account.InvoiceServices.create#InvoiceItem", {
            invoiceId,
            invoiceItemSeqId: "00001",
            itemTypeEnumId: "ItemTimeEntry",
            quantity: "1",
            amount: ec.l10n.roundCurrency(toDecimal("35"), currency),
            description: "Store consulting"
        })
}

function receivableSupport() {
    const invoiceId = "BOSS_ACCT_AR_FINALIZED"
    const invoiceContentId = "BOSS_ACCT_AR_SUPPORT"
    const contentLocation = "dbresource://mantle/content/invoice/" + invoiceId + "/content_" + invoiceContentId + "/Scope.txt"
    if (policy.one("mantle.account.invoice.InvoiceContent", {invoiceContentId})) return
    ec.resource
        .getLocationReference(contentLocation)
        .putText("Approved customer service scope and terms. Accounting supporting document.")
    policy.call("create#mantle.account.invoice.InvoiceContent", {
        invoiceContentId,
        invoiceId,
        contentLocation,
        contentTypeEnumId: "IctInvoiceDocument",
        contentDate: ec.user.nowTimestamp,
        description: "Approved service scope"
    })
}

// Approved work belongs to the finance organization and needs no Projects launcher grant to bill it.
function approvedWork() {
    const workEffortId = "BOSS_ACCT_PROJECT"
    const timesheetId = "BOSS_ACCT_TIMESHEET"
    const fromDate = Number(ec.user.nowTimestamp) - 86400000
    const thruDate = fromDate + 3600000
    createOnce(
        "mantle.work.effort.WorkEffort",
        {workEffortId},
        {
            workEffortTypeEnumId: "WetProject",
            ownerPartyId: organizationPartyId,
            workEffortName: "Accounting customer consulting"
        }
    )
    for (const [partyId, roleTypeId] of [
        [organizationPartyId, "Vendor"],
        ["ORG_ACME", "Customer"]
    ])
        createOnce(
            "mantle.work.effort.WorkEffortParty",
            {workEffortId, partyId, roleTypeId, fromDate: "1970-01-01T00:00:00Z"},
            {}
        )
    createOnce(
        "mantle.work.time.Timesheet",
        {timesheetId},
        {
            partyId: "EX_JOHN_DOE",
            statusId: "TmshApproved",
            fromDate,
            thruDate
        }
    )
    createOnce(
        "mantle.work.time.TimeEntry",
        {timeEntryId: "BOSS_ACCT_APPROVED_TIME"},
        {
            timesheetId,
            partyId: "EX_JOHN_DOE",
            vendorPartyId: organizationPartyId,
            clientPartyId: "ORG_ACME",
            workEffortId,
            fromDate,
            thruDate,
            hours: "1",
            clientHourRate: "85",
            vendorHourRate: "40",
            hasModifiedRates: "Y"
        }
    )
}

// Run by data loading (no user) or a system administrator.
// Separate issued settlement examples leave the receivables/Projects fixtures unchanged.
function settlementDocuments(currency) {
    const partyId = "BOSS_ACCT_STL_CUSTOMER"
    createOnce("mantle.party.Party", {partyId}, {partyTypeEnumId: "PtyOrganization"})
    createOnce("mantle.party.Organization", {partyId}, {organizationName: "Settlement customer"})
    createOnce("mantle.party.PartyRole", {partyId, roleTypeId: "Customer"}, {})
    const day = ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
    const at = ec.user.nowTimestamp
    const sourceAccount = policy.call("mantle.ledger.InvoiceAutoPostServices.get#InvoiceItemGlAccount", {
        organizationPartyId,
        otherPartyId: partyId,
        itemTypeEnumId: "ItemTimeEntry",
        direction: "O"
    }).glAccountId
    if (!sourceAccount) throw new Error("The settlement demo needs a services revenue account")
    for (const [invoiceId, amount, description, creditForInvoiceId] of [
        ["BOSS_ACCT_STL_INV100", "100", "Settlement services invoice", null],
        ["BOSS_ACCT_STL_SPLIT100", "100", "Split receipt services invoice", null],
        ["BOSS_ACCT_STL_INV40", "40", "Split receipt second invoice", null],
        ["BOSS_ACCT_STL_ADJUST50", "50", "Settlement adjustment invoice", null],
        ["BOSS_ACCT_STL_CREDIT25", "25", "Available settlement credit", "BOSS_ACCT_STL_INV100"]
    ]) {
        if (policy.one("mantle.account.invoice.Invoice", {invoiceId})) continue
        policy.call("create#mantle.account.invoice.Invoice", {
            invoiceId,
            invoiceTypeEnumId: creditForInvoiceId ? "InvoiceCreditMemo" : "InvoiceSales",
            fromPartyId: creditForInvoiceId ? partyId : organizationPartyId,
            toPartyId: creditForInvoiceId ? organizationPartyId : partyId,
            financeOrganizationPartyId: organizationPartyId,
            financeDirection: "receivable",
            creditForInvoiceId,
            draftedByUserId: ec.user.userId,
            statusId: "InvoiceInProcess",
            invoiceDate: at,
            accountingDate: day,
            currencyUomId: currency,
            description
        })
        policy.call("mantle.account.InvoiceServices.create#InvoiceItem", {
            invoiceId,
            quantity: "1",
            amount,
            description,
            itemTypeEnumId: "ItemTimeEntry",
            overrideGlAccountId: sourceAccount
        })
        const invoice = policy.one("mantle.account.invoice.Invoice", {invoiceId})
        policy.call("mantle.account.InvoiceServices.change#InvoiceState", {
            invoiceId,
            organizationPartyId,
            action: "finalize",
            lastUpdatedStamp: invoice.lastUpdatedStamp,
            operationKey: "demo-final-" + invoiceId
        })
    }
    const [, cashGlAccountId] = entryAccounts()
    createOnce(
        "mantle.account.method.PaymentMethod",
        {paymentMethodId: "BOSS_ACCT_STL_CASH"},
        {
            paymentMethodTypeEnumId: "PmtOther",
            ownerPartyId: organizationPartyId,
            currencyUomId: currency,
            fromDate: "1970-01-01T00:00:00Z",
            description: "Settlement demonstration cash",
            glAccountId: cashGlAccountId
        }
    )
    for (const [paymentId, amount] of [
        ["BOSS_ACCT_STL_RECEIPT60", "60"],
        ["BOSS_ACCT_STL_RECEIPT70", "70"]
    ]) {
        if (policy.one("mantle.account.payment.Payment", {paymentId})) continue
        policy.call("create#mantle.account.payment.Payment", {
            paymentId,
            fromPartyId: partyId,
            toPartyId: organizationPartyId,
            paymentTypeEnumId: "PtInvoicePayment",
            paymentInstrumentEnumId: "PiCash",
            toPaymentMethodId: "BOSS_ACCT_STL_CASH",
            amount,
            amountUomId: currency,
            statusId: "PmntPromised",
            effectiveDate: at,
            comments: "Available settlement receipt " + amount
        })
        policy.call("update#mantle.account.payment.Payment", {paymentId, statusId: "PmntDelivered"})
        const posted = policy
            .find("mantle.ledger.transaction.AcctgTrans", {paymentId, organizationPartyId, isPosted: "Y"})
            .count()
        if (!posted) throw new Error("The settlement receipt " + paymentId + " did not post")
    }
}

function paymentDocuments(currency) {
    const partyId = "BOSS_ACCT_PAY_CUSTOMER",
        methodId = "BOSS_ACCT_PAY_CASH",
        bankMethodId = "BOSS_ACCT_PAY_BANK",
        native = "mantle.account.PaymentServices.",
        day = ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd"),
        at = ec.user.nowTimestamp
    createOnce("mantle.party.Party", {partyId}, {partyTypeEnumId: "PtyOrganization"})
    createOnce("mantle.party.Organization", {partyId}, {organizationName: "Payment customer"})
    createOnce("mantle.party.PartyRole", {partyId, roleTypeId: "Customer"}, {})
    const [, glAccountId] = entryAccounts()
    createOnce(
        "mantle.account.method.PaymentMethod",
        {paymentMethodId: methodId},
        {
            paymentMethodTypeEnumId: "PmtOther",
            ownerPartyId: organizationPartyId,
            currencyUomId: currency,
            fromDate: "1970-01-01T00:00:00Z",
            description: "Accounting payment cash",
            glAccountId
        }
    )
    createOnce(
        "mantle.account.method.PaymentMethod",
        {paymentMethodId: bankMethodId},
        {
            paymentMethodTypeEnumId: "PmtBankAccount",
            ownerPartyId: organizationPartyId,
            currencyUomId: currency,
            fromDate: "1970-01-01T00:00:00Z",
            description: "Accounting demonstration bank",
            glAccountId
        }
    )
    createOnce(
        "mantle.account.method.BankAccount",
        {paymentMethodId: bankMethodId},
        {
            bankName: "Demonstration bank",
            typeEnumId: "BatChecking",
            routingNumber: "000000000",
            accountNumber: "000123456789",
            lastCheckNumber: 100
        }
    )
    const key = (action, id) => "demo-pay-" + action + "-" + policy.hash(id).slice(0, 20)
    for (const [paymentId, amount, deliver, outgoing, validate, cashOnly] of [
        ["BOSS_ACCT_PAY_DRAFT", "35", false],
        ["BOSS_ACCT_PAY_VALIDATED", "40", false, false, true],
        ["BOSS_ACCT_PAY_EVIDENCE_DRAFT", "45", false],
        ["BOSS_ACCT_PAY_DELIVERED", "55", true],
        ["BOSS_ACCT_PAY_APPLIED", "65", true],
        ["BOSS_ACCT_PAY_CHECK", "75", true, true],
        ["BOSS_ACCT_REFUND_RECEIPT", "100", true],
        ["BOSS_ACCT_REFUND_SUPPLIER", "90", true, true, false, true],
        ["BOSS_ACCT_REFUND_DRAFT", "20", false, true, false, true]
    ]) {
        const selectedMethodId = outgoing && !cashOnly ? bankMethodId : methodId,
            instrument = outgoing && !cashOnly ? "PiCompanyCheck" : "PiCash"
        // Fixed fixture IDs start as ordinary drafts, then store#PaymentDraft adopts them with their methods.
        createOnce(
            "mantle.account.payment.Payment",
            {paymentId},
            {
                paymentTypeEnumId: "PtInvoicePayment",
                paymentInstrumentEnumId: instrument,
                statusId: "PmntProposed",
                fromPartyId: outgoing ? organizationPartyId : partyId,
                toPartyId: outgoing ? partyId : organizationPartyId,
                paymentMethodId: outgoing ? selectedMethodId : null,
                toPaymentMethodId: outgoing ? null : selectedMethodId,
                amount,
                amountUomId: currency,
                effectiveDate: at,
                comments: "Payment customer receipt"
            }
        )
        let detail = policy.call(native + "get#PaymentFinanceDetail", {organizationPartyId, paymentId})
        const row = policy.one("mantle.account.payment.Payment", {paymentId})
        // A draft is adopted once store#PaymentDraft has given it its reference.
        if (row.paymentRefNum !== paymentId) {
            const method = policy
                .call(native + "find#PaymentMethods", {
                    organizationPartyId,
                    methodRole: "organization",
                    currencyUomId: currency,
                    effectiveDate: at,
                    selectedPaymentMethodIdList: [selectedMethodId],
                    pageSize: 1
                })
                .selectedRows.find(row => row.paymentMethodId === selectedMethodId)
            if (!method) throw new Error("The payment demo cash method is unavailable")
            policy.call(native + "store#PaymentDraft", {
                organizationPartyId,
                paymentId,
                sourceVersion: detail.sourceVersion,
                cashDirection: outgoing ? "outgoing" : "incoming",
                partyId,
                amount,
                currencyUomId: currency,
                effectiveDate: day,
                paymentInstrumentEnumId: instrument,
                organizationPaymentMethodId: selectedMethodId,
                organizationMethodVersion: method.version,
                referenceNumber: paymentId,
                comments: "Payment customer receipt",
                operationKey: key("adopt", paymentId)
            })
            detail = policy.call(native + "get#PaymentFinanceDetail", {organizationPartyId, paymentId})
        }
        if (
            (deliver || validate) &&
            ["PmntProposed", "PmntPromised"].includes(detail.payment.statusId) &&
            (deliver || detail.payment.statusId === "PmntProposed")
        ) {
            const preview = policy.call(native + "preview#PaymentState", {
                organizationPartyId,
                paymentId,
                sourceVersion: detail.sourceVersion,
                action: deliver ? "deliver" : "validate",
                referenceNumber: paymentId,
                reason: "Demonstration payment verified",
                settlementDate: day
            })
            policy.call(native + "change#PaymentState", {
                previewId: preview.previewId,
                inputFingerprint: preview.inputFingerprint,
                operationKey: key(deliver ? "deliver" : "validate", paymentId)
            })
        }
    }
    const evidenceId = "BOSS_ACCT_PAY_EVIDENCE",
        evidencePaymentId = "BOSS_ACCT_PAY_EVIDENCE_DRAFT",
        location = "dbresource://mantle/content/payment/" + evidencePaymentId + "/content_" + evidenceId + "/Receipt.txt"
    if (!policy.one("mantle.account.payment.PaymentContent", {paymentContentId: evidenceId})) {
        ec.resource.getLocationReference(location).putText("Payment customer receipt: demonstration supporting evidence.\n")
        createOnce(
            "mantle.account.payment.PaymentContent",
            {paymentContentId: evidenceId},
            {
                paymentId: evidencePaymentId,
                contentLocation: location,
                contentDate: at,
                userId: ec.user.userId,
                description: "Receipt identity and amount"
            }
        )
    }
    const invoiceId = "BOSS_ACCT_PAY_INVOICE",
        paymentId = "BOSS_ACCT_PAY_APPLIED"
    if (!policy.one("mantle.account.invoice.Invoice", {invoiceId})) {
        policy.call("create#mantle.account.invoice.Invoice", {
            invoiceId,
            invoiceTypeEnumId: "InvoiceSales",
            fromPartyId: organizationPartyId,
            toPartyId: partyId,
            financeOrganizationPartyId: organizationPartyId,
            financeDirection: "receivable",
            draftedByUserId: ec.user.userId,
            statusId: "InvoiceInProcess",
            invoiceDate: at,
            accountingDate: day,
            currencyUomId: currency,
            description: "Payment application example"
        })
        policy.call("mantle.account.InvoiceServices.create#InvoiceItem", {
            invoiceId,
            quantity: "1",
            amount: "100",
            itemTypeEnumId: "ItemTimeEntry",
            description: "Payment application example"
        })
        policy.call("mantle.account.InvoiceServices.change#InvoiceState", {
            invoiceId,
            organizationPartyId,
            action: "finalize",
            lastUpdatedStamp: policy.one("mantle.account.invoice.Invoice", {invoiceId}).lastUpdatedStamp,
            operationKey: key("invoice", invoiceId)
        })
    }
    if (!policy.find("mantle.account.payment.PaymentApplication", {paymentId, invoiceId}).count()) {
        const sourceKey = "payment:" + paymentId,
            targetKey = "invoice:" + invoiceId,
            open = policy.call(native + "find#OpenItems", {
                organizationPartyId,
                partyId,
                direction: "receivable",
                currencyUomId: currency,
                selectedKeyList: [sourceKey, targetKey],
                pageSize: 1
            }),
            versions = Object.fromEntries(Array.from(open.selectedRows || []).map(row => [row.sourceKey, row.version]))
        const preview = policy.call(native + "preview#Settlement", {
            organizationPartyId,
            partyId,
            direction: "receivable",
            currencyUomId: currency,
            effectiveDate: day,
            allocations: [{sourceKey, targetKey, amount: "25"}],
            adjustments: [],
            sourceVersions: versions
        })
        policy.call(native + "apply#Settlement", {
            previewId: preview.previewId,
            inputFingerprint: preview.inputFingerprint,
            operationKey: key("apply", paymentId)
        })
    }
}

function gatewaySetup(currency) {
    const partyId = "BOSS_ACCT_PAY_CUSTOMER",
        gatewayId = "BOSS_ACCT_GW_TEST",
        orgMethodId = "BOSS_ACCT_GW_BANK",
        customerMethodId = "BOSS_ACCT_GW_CUSTOMER_BANK",
        [, glAccountId] = entryAccounts()
    // Mantle's test gateway services, which always approve and answer lookups
    const testServices = "mantle.account.PaymentTestServices."
    createOnce(
        "mantle.account.method.PaymentGatewayConfig",
        {paymentGatewayConfigId: gatewayId},
        {
            description: "Demonstration test gateway",
            paymentGatewayTypeEnumId: "PgtTest",
            authorizeServiceName: testServices + "alwaysApprove#PaymentAuthorization",
            captureServiceName: testServices + "alwaysApprove#PaymentCapture",
            releaseServiceName: testServices + "alwaysApprove#PaymentRelease",
            refundServiceName: testServices + "alwaysApprove#PaymentRefund",
            detailsServiceName: testServices + "alwaysApprove#PaymentDetails"
        }
    )
    createOnce(
        "mantle.account.method.PaymentGatewayOrganization",
        {organizationPartyId, paymentGatewayConfigId: gatewayId},
        {
            fromDate: "1970-01-01T00:00:00Z",
            isEnabled: "Y"
        }
    )
    for (const [paymentMethodId, ownerPartyId, accountNumber] of [
        [orgMethodId, organizationPartyId, "000123456781"],
        [customerMethodId, partyId, "000123456782"]
    ]) {
        createOnce(
            "mantle.account.method.PaymentMethod",
            {paymentMethodId},
            {
                ownerPartyId,
                paymentMethodTypeEnumId: "PmtBankAccount",
                currencyUomId: currency,
                fromDate: "1970-01-01T00:00:00Z",
                glAccountId,
                description:
                    ownerPartyId === organizationPartyId ? "Demonstration gateway bank" : "Demonstration gateway customer bank",
                paymentGatewayConfigId: ownerPartyId === partyId ? gatewayId : null
            }
        )
        createOnce(
            "mantle.account.method.BankAccount",
            {paymentMethodId},
            {
                bankName: "Demonstration gateway bank",
                typeEnumId: "BatChecking",
                routingNumber: "000000000",
                accountNumber
            }
        )
    }
    return {complete: true}
}

function gatewayDrafts(currency) {
    policy.probe("ironstone.accounting.DemoServices.load#AccountingGatewaySetup", {})
    const errors = []
    for (const suffix of ["DRAFT", "AUTHORIZED", "PARTIAL", "PENDING", "UNCERTAIN", "RECOVER"]) {
        const paymentId = "BOSS_ACCT_GW_" + suffix
        try {
            policy.probe("ironstone.accounting.DemoServices.load#AccountingGatewayDraft", {paymentId, currencyUomId: currency})
        } catch (error) {
            ec.logger.error("Accounting gateway demonstration " + paymentId + ": " + error.message)
            errors.push({paymentId, message: error.message})
        }
    }
    return {complete: errors.length === 0, errors}
}

function gatewayDraft(parameters) {
    const paymentId = parameters.paymentId,
        currency = parameters.currencyUomId,
        native = "mantle.account.PaymentServices.",
        partyId = "BOSS_ACCT_PAY_CUSTOMER",
        orgMethodId = "BOSS_ACCT_GW_BANK",
        customerMethodId = "BOSS_ACCT_GW_CUSTOMER_BANK",
        day = ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd"),
        at = ec.user.nowTimestamp
    if (
        !["DRAFT", "AUTHORIZED", "PARTIAL", "PENDING", "UNCERTAIN", "RECOVER"].some(
            suffix => paymentId === "BOSS_ACCT_GW_" + suffix
        )
    )
        throw new Error("Unknown gateway demonstration record")
    // A fixed-ID clean manual draft is explicitly adopted through the same native service as the editor.
    // Provider calls occur only after load commits, from normal user actions or server test fixtures.
    createOnce(
        "mantle.account.payment.Payment",
        {paymentId},
        {
            fromPartyId: partyId,
            toPartyId: organizationPartyId,
            paymentTypeEnumId: "PtInvoicePayment",
            paymentInstrumentEnumId: "PiCash",
            amount: "60",
            amountUomId: currency,
            statusId: "PmntProposed",
            effectiveDate: at,
            toPaymentMethodId: orgMethodId,
            comments: "Demonstration provider instruction"
        }
    )
    // Adopted once store#PaymentDraft has given the draft its reference.
    if (policy.one("mantle.account.payment.Payment", {paymentId}).paymentRefNum === paymentId) return {complete: true}
    const versions = {}
    for (const [role, id] of [
        ["organization", orgMethodId],
        ["counterparty", customerMethodId]
    ]) {
        const result = policy.call(native + "find#PaymentMethods", {
                organizationPartyId,
                partyId,
                cashDirection: "incoming",
                currencyUomId: currency,
                effectiveDate: at,
                methodRole: role,
                selectedPaymentMethodIdList: [id],
                pageSize: 1
            }),
            method = Array.from(result.selectedRows || []).find(row => row.paymentMethodId === id)
        if (!method) throw new Error("The demonstration gateway method is unavailable: " + id)
        versions[role + "MethodVersion"] = method.version
    }
    const detail = policy.call(native + "get#PaymentFinanceDetail", {organizationPartyId, paymentId})
    policy.call(
        native + "store#PaymentDraft",
        Object.assign({}, versions, {
            organizationPartyId,
            paymentId,
            sourceVersion: detail.sourceVersion,
            cashDirection: "incoming",
            partyId,
            amount: "60",
            currencyUomId: currency,
            effectiveDate: at,
            paymentInstrumentEnumId: "PiAch",
            organizationPaymentMethodId: orgMethodId,
            counterpartyPaymentMethodId: customerMethodId,
            referenceNumber: paymentId,
            comments: "Demonstration provider instruction",
            operationKey: "demo-gw-draft-" + policy.hash(paymentId).slice(0, 20)
        })
    )
    return {complete: true}
}

// The payables demo: a supplier on 30-day terms, a bill it sent that awaits approval, a bill on hold, and an approved
// purchase order the payables walk bills from its order.
const supplierPartyId = "BOSS_ACCT_SUPPLIER"
function supplierBill(currency, invoiceId, referenceNumber, amount) {
    createOnce(
        "mantle.account.invoice.Invoice",
        {invoiceId},
        {
            invoiceTypeEnumId: "InvoiceSales",
            statusId: "InvoiceIncoming",
            fromPartyId: supplierPartyId,
            toPartyId: organizationPartyId,
            invoiceDate: ec.user.nowTimestamp,
            accountingDate: ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd"),
            currencyUomId: currency,
            referenceNumber,
            description: "Supplies " + referenceNumber,
            draftedByUserId: "BOSS_ACCT_AP"
        }
    )
    if (!policy.one("mantle.account.invoice.InvoiceItem", {invoiceId, invoiceItemSeqId: "00001"}))
        policy.call("mantle.account.InvoiceServices.create#InvoiceItem", {
            invoiceId,
            invoiceItemSeqId: "00001",
            itemTypeEnumId: "ItemExpense",
            quantity: "1",
            amount: ec.l10n.roundCurrency(toDecimal(amount), currency),
            description: "Office supplies"
        })
    return policy.one("mantle.account.invoice.Invoice", {invoiceId})
}
function payables(currency) {
    // receipts bill themselves only for self-billing suppliers, set as finance administration sets it
    const preference = policy.one("mantle.ledger.config.PartyAcctgPreference", {organizationPartyId})
    if (preference && preference.receiptInvoiceSelfBilledOnly !== "Y")
        policy.call("mantle.ledger.SetupServices.store#Preferences", {
            organizationPartyId,
            settings: {receiptInvoiceSelfBilledOnly: "Y"},
            changeReason: "Accounting demo: self-billing receipts only",
            lastUpdatedStamp: preference.lastUpdatedStamp
        })
    createOnce("mantle.party.Party", {partyId: supplierPartyId}, {partyTypeEnumId: "PtyOrganization"})
    createOnce("mantle.party.Organization", {partyId: supplierPartyId}, {organizationName: "Accounting Demo Supplier"})
    createOnce("mantle.party.PartyRole", {partyId: supplierPartyId, roleTypeId: "Supplier"}, {})
    if (!policy.rows("mantle.party.supplier.SupplierProfile", {organizationPartyId, supplierPartyId}).length)
        policy.call("mantle.party.SupplierServices.store#SupplierProfile", {
            organizationPartyId,
            supplierPartyId,
            settlementTermId: "BOSS_ACCT_NET30",
            selfBillingIndicator: "N",
            fromDate: new Date(Number(ec.user.nowTimestamp) - 86400000),
            changeReason: "Agreed on onboarding"
        })
    const review = supplierBill(currency, "BOSS_ACCT_BILL_REVIEW", "SUPP-1001", "240")
    if (review.statusId === "InvoiceIncoming")
        policy.call("mantle.account.InvoiceServices.change#InvoiceState", {
            invoiceId: review.invoiceId,
            organizationPartyId,
            action: "receive",
            lastUpdatedStamp: review.lastUpdatedStamp,
            changeReason: "Sent for approval"
        })
    supplierBill(currency, "BOSS_ACCT_BILL_HELD", "SUPP-1002", "90")
    if (!policy.rows("mantle.account.invoice.InvoiceHold", {invoiceId: "BOSS_ACCT_BILL_HELD"}).length)
        policy.call("mantle.account.InvoiceServices.hold#Invoice", {
            invoiceId: "BOSS_ACCT_BILL_HELD",
            organizationPartyId,
            holdReasonEnumId: "IhrSupplierDispute",
            holdComment: "Quantity short against the delivery note"
        })
    const orderId = "BOSS_ACCT_PO"
    createOnce(
        "mantle.order.OrderHeader",
        {orderId},
        {statusId: "OrderOpen", currencyUomId: currency, entryDate: ec.user.nowTimestamp}
    )
    createOnce(
        "mantle.order.OrderPart",
        {orderId, orderPartSeqId: "01"},
        {customerPartyId: organizationPartyId, vendorPartyId: supplierPartyId, statusId: "OrderOpen"}
    )
    if (!policy.rows("mantle.order.OrderItem", {orderId}).length) {
        policy.call("mantle.order.OrderServices.add#OrderProductQuantity", {
            orderId,
            orderPartSeqId: "01",
            productId: "BOSS_ACCT_SUPPLY",
            quantity: 5,
            unitAmount: 12,
            itemTypeEnumId: "ItemInventory"
        })
        policy.call("mantle.order.OrderServices.place#Order", {orderId})
        policy.call("mantle.order.OrderServices.approve#Order", {orderId})
    }
    deliveredReceipt(currency)
}
// A purchase order received into the demo warehouse, four accepted and one rejected, and delivered: with receipts billed
// for self-billing suppliers only, it waits for its bill (ShipmentDetail's Bill accepted receipts).
function deliveredReceipt(currency) {
    const orderId = "BOSS_ACCT_PO_RECEIVED"
    const facilityId = "BOSS_ACCT_WH"
    createOnce(
        "mantle.facility.Facility",
        {facilityId},
        {facilityTypeEnumId: "FcTpWarehouse", ownerPartyId: organizationPartyId, facilityName: "Accounting demo warehouse"}
    )
    createOnce(
        "mantle.order.OrderHeader",
        {orderId},
        {statusId: "OrderOpen", currencyUomId: currency, entryDate: ec.user.nowTimestamp}
    )
    createOnce(
        "mantle.order.OrderPart",
        {orderId, orderPartSeqId: "01"},
        {customerPartyId: organizationPartyId, vendorPartyId: supplierPartyId, statusId: "OrderOpen", facilityId}
    )
    if (policy.rows("mantle.order.OrderItem", {orderId}).length) return
    policy.call("mantle.order.OrderServices.add#OrderProductQuantity", {
        orderId,
        orderPartSeqId: "01",
        productId: "BOSS_ACCT_SUPPLY",
        quantity: 5,
        unitAmount: 12,
        itemTypeEnumId: "ItemInventory"
    })
    policy.call("mantle.order.OrderServices.place#Order", {orderId})
    policy.call("mantle.order.OrderServices.approve#Order", {orderId})
    const shipment = policy.call("mantle.shipment.ShipmentServices.create#OrderPartShipment", {
        orderId,
        orderPartSeqId: "01",
        destinationFacilityId: facilityId
    })
    policy.call("mantle.shipment.ShipmentServices.ship#Shipment", {shipmentId: shipment.shipmentId})
    policy.call("mantle.shipment.ShipmentServices.receive#ShipmentProduct", {
        shipmentId: shipment.shipmentId,
        productId: "BOSS_ACCT_SUPPLY",
        quantityAccepted: 4,
        quantityRejected: 1,
        facilityId
    })
    policy.call("mantle.shipment.ShipmentServices.deliver#Shipment", {shipmentId: shipment.shipmentId})
}
// Banking: an operating bank account with three receipts into it (two for a deposit slip, one its bank line matches),
// two open bank lines (the receipt and a bank fee) and a rule that suggests the payment customer's receipts.
function banking(currency) {
    const bankId = "BOSS_ACCT_BANK",
        partyId = "BOSS_ACCT_PAY_CUSTOMER",
        at = ec.user.nowTimestamp
    const [, glAccountId] = entryAccounts()
    createOnce(
        "mantle.account.method.PaymentMethod",
        {paymentMethodId: bankId},
        {
            paymentMethodTypeEnumId: "PmtBankAccount",
            ownerPartyId: organizationPartyId,
            currencyUomId: currency,
            fromDate: "1970-01-01T00:00:00Z",
            description: "Operating account",
            glAccountId
        }
    )
    createOnce(
        "mantle.account.method.BankAccount",
        {paymentMethodId: bankId},
        {
            bankName: "Demonstration bank",
            typeEnumId: "BatChecking",
            routingNumber: "021000021",
            accountNumber: "000987654321"
        }
    )
    for (const [paymentId, amount, reference] of [
        ["BOSS_ACCT_BANK_RCPT1", "120", "CHK-501"],
        ["BOSS_ACCT_BANK_RCPT2", "80", "CHK-502"],
        ["BOSS_ACCT_BANK_RCPT3", "250", "WIRE-77"]
    ]) {
        if (policy.one("mantle.account.payment.Payment", {paymentId})) continue
        policy.call("create#mantle.account.payment.Payment", {
            paymentId,
            fromPartyId: partyId,
            toPartyId: organizationPartyId,
            paymentTypeEnumId: "PtInvoicePayment",
            paymentInstrumentEnumId: "PiPersonalCheck",
            toPaymentMethodId: bankId,
            paymentRefNum: reference,
            amount,
            amountUomId: currency,
            statusId: "PmntPromised",
            effectiveDate: at,
            comments: "Banking demonstration receipt " + reference
        })
        policy.call("update#mantle.account.payment.Payment", {paymentId, statusId: "PmntDelivered"})
    }
    for (const [fitId, amount, transName, transType] of [
        ["BOSS-DEMO-WIRE", "250", "PAYMENT CUSTOMER WIRE", "PMTT_CREDIT"],
        ["BOSS-DEMO-FEE", "-15", "MONTHLY SERVICE FEE", "PMTT_SRVCHG"]
    ])
        createOnce(
            "mantle.account.method.PaymentMethodTrans",
            {paymentMethodId: bankId, fitId},
            {postedDate: at, transAmount: amount, transName, transType, transCode: transType}
        )
    // stored-value accounts post to their type's liability and their reason's clearing account (FinancialAccountTypeGlAccount,
    // FinancialAccountReasonGlAccount), which the posting guard needs assigned to the organization
    for (const glAccountId of ["251100000", "251200000", "251500000", "258100000", "258200000"])
        if (policy.one("mantle.ledger.account.GlAccount", {glAccountId}))
            createOnce("mantle.ledger.account.GlAccountOrganization", {organizationPartyId, glAccountId}, {fromDate: 0})
    createOnce(
        "mantle.account.method.BankMatchRule",
        {bankMatchRuleId: "BOSS_ACCT_RULE_CUSTOMER"},
        {
            organizationPartyId,
            description: "Payment customer receipts",
            sequenceNum: 10,
            matchText: "payment customer",
            directionEnumId: "BmdIncoming",
            partyId,
            autoApply: "N",
            fromDate: at
        }
    )
}

// Period close (P11): last month's fiscal period with an invoice still in draft and a bank account whose line no finished
// statement cleared, the two blockers the close walk resolves; and project cost posting turned on as finance
// administration turns it on.
function periodClose(currency) {
    const preference = policy.one("mantle.ledger.config.PartyAcctgPreference", {organizationPartyId})
    if (preference && preference.projectCostPostingEnabled !== "Y")
        policy.call("mantle.ledger.SetupServices.store#Preferences", {
            organizationPartyId,
            settings: {projectCostPostingEnabled: "Y"},
            changeReason: "Accounting demo: project cost posting",
            lastUpdatedStamp: preference.lastUpdatedStamp
        })
    const [year, month] = ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd").split("-").map(Number)
    const day = date =>
        [date.getUTCFullYear(), String(date.getUTCMonth() + 1).padStart(2, "0"), String(date.getUTCDate()).padStart(2, "0")].join(
            "-"
        )
    const fromDay = day(new Date(Date.UTC(year, month - 2, 1))),
        thruDay = day(new Date(Date.UTC(year, month - 1, 0)))
    const mid = ec.l10n.parseTimestamp(fromDay.slice(0, 8) + "15 12:00:00", "yyyy-MM-dd HH:mm:ss")
    const overlapping = policy
        .rows("mantle.party.time.TimePeriod", {partyId: organizationPartyId, timePeriodTypeId: "FiscalMonth"})
        .filter(row => policy.calendarDateText(row.fromDate) <= thruDay && policy.calendarDateText(row.thruDate) >= fromDay)
    if (!overlapping.length)
        createOnce(
            "mantle.party.time.TimePeriod",
            {timePeriodId: "BOSS_ACCT_CLOSE_PERIOD"},
            {
                partyId: organizationPartyId,
                timePeriodTypeId: "FiscalMonth",
                periodName: "Last month",
                fromDate: fromDay,
                thruDate: thruDay,
                isClosed: "N"
            }
        )
    createOnce(
        "mantle.account.invoice.Invoice",
        {invoiceId: "BOSS_ACCT_CLOSE_INVOICE"},
        {
            invoiceTypeEnumId: "InvoiceSales",
            fromPartyId: organizationPartyId,
            toPartyId: "ORG_ACME",
            statusId: "InvoiceInProcess",
            currencyUomId: currency,
            invoiceDate: mid,
            accountingDate: fromDay.slice(0, 8) + "15",
            description: "Last month's services, not yet finalized"
        }
    )
    if (!policy.one("mantle.account.invoice.InvoiceItem", {invoiceId: "BOSS_ACCT_CLOSE_INVOICE", invoiceItemSeqId: "00001"}))
        policy.call("mantle.account.InvoiceServices.create#InvoiceItem", {
            invoiceId: "BOSS_ACCT_CLOSE_INVOICE",
            invoiceItemSeqId: "00001",
            itemTypeEnumId: "ItemTimeEntry",
            description: "Accounting demo services",
            quantity: "1",
            amount: ec.l10n.roundCurrency(toDecimal("125"), currency)
        })
    const [, glAccountId] = entryAccounts()
    createOnce(
        "mantle.account.method.PaymentMethod",
        {paymentMethodId: "BOSS_ACCT_CLOSE_BANK"},
        {
            paymentMethodTypeEnumId: "PmtBankAccount",
            ownerPartyId: organizationPartyId,
            currencyUomId: currency,
            fromDate: "1970-01-01T00:00:00Z",
            description: "Payroll account",
            glAccountId
        }
    )
    createOnce(
        "mantle.account.method.BankAccount",
        {paymentMethodId: "BOSS_ACCT_CLOSE_BANK"},
        {bankName: "Demonstration bank", typeEnumId: "BatChecking", routingNumber: "021000021", accountNumber: "000555777999"}
    )
    createOnce(
        "mantle.account.method.PaymentMethodTrans",
        {paymentMethodId: "BOSS_ACCT_CLOSE_BANK", fitId: "BOSS-CLOSE-FEE"},
        {postedDate: mid, transAmount: "-12", transName: "ACCOUNT FEE", transType: "PMTT_SRVCHG", transCode: "PMTT_SRVCHG"}
    )
}

// The tax demo: Utah sales tax at 6.1% collected under the organization's registration and posted to Sales Tax
// Collected, the local gateway for its invoices without a store, a customer in Utah with a finalized product invoice
// taxed by that gateway, and two IRS-registered suppliers paid this year, one without a taxpayer number, for the 1099
// run. It runs before the gateway demo starts (AccountingDemo.secas.xml), which waits for this transaction.
function taxSetup() {
    const taxAuthorityId = "BOSS_ACCT_UT"
    createOnce("mantle.party.Party", {partyId: "BOSS_ACCT_UT_TAX"}, {partyTypeEnumId: "PtyOrganization"})
    createOnce("mantle.party.Organization", {partyId: "BOSS_ACCT_UT_TAX"}, {organizationName: "Utah State Tax Commission"})
    createOnce(
        "mantle.other.tax.TaxAuthority",
        {taxAuthorityId},
        {
            description: "Utah sales tax",
            taxAuthorityTypeEnumId: "TatState",
            taxAuthGeoId: "USA_UT",
            taxAuthPartyId: "BOSS_ACCT_UT_TAX"
        }
    )
    if (!policy.rows("mantle.other.tax.TaxAuthorityParty", {partyId: organizationPartyId, taxAuthorityId}).length)
        policy.call("create#mantle.other.tax.TaxAuthorityParty", {
            partyId: organizationPartyId,
            taxAuthorityId,
            fromDate: "1970-01-01T00:00:00Z",
            isNexus: "Y",
            partyTaxId: "12345678-002-STC"
        })
    createOnce("mantle.ledger.config.TaxAuthorityGlAccount", {taxAuthorityId, organizationPartyId}, {glAccountId: "224000000"})
    createOnce(
        "mantle.other.tax.TaxAuthorityRate",
        {taxAuthorityRateId: "BOSS_ACCT_UT_2020"},
        {
            taxAuthorityId,
            rateTypeEnumId: "TarSalesTax",
            organizationPartyId,
            taxPercentage: "6.1",
            taxShipping: "Y",
            fromDate: "2020-01-01T00:00:00Z",
            description: "Utah combined sales tax"
        }
    )
    if (policy.preference(organizationPartyId).taxGatewayConfigId !== "LOCAL")
        policy.call("mantle.ledger.SetupServices.store#Preferences", {
            organizationPartyId,
            settings: {taxGatewayConfigId: "LOCAL"},
            changeReason: "Accounting demo sales tax",
            lastUpdatedStamp: policy.one("mantle.ledger.config.PartyAcctgPreference", {organizationPartyId})?.lastUpdatedStamp
        })
}
function taxDocuments(currency) {
    taxSetup()
    const customerPartyId = "BOSS_ACCT_TAX_CUSTOMER"
    createOnce("mantle.party.Party", {partyId: customerPartyId}, {partyTypeEnumId: "PtyOrganization"})
    createOnce("mantle.party.Organization", {partyId: customerPartyId}, {organizationName: "Wasatch Outfitters"})
    createOnce("mantle.party.PartyRole", {partyId: customerPartyId, roleTypeId: "Customer"}, {})
    if (!policy.rows("mantle.party.contact.PartyContactMech", {partyId: customerPartyId}).length)
        policy.call("mantle.party.ContactServices.store#PartyContactInfo", {
            partyId: customerPartyId,
            postalContactMechPurposeId: "PostalShippingDest",
            address1: "200 Canyon Rd",
            city: "Provo",
            stateProvinceGeoId: "USA_UT",
            postalCode: "84601",
            countryGeoId: "USA"
        })
    const invoiceId = "BOSS_ACCT_TAXED"
    createOnce(
        "mantle.account.invoice.Invoice",
        {invoiceId},
        {
            invoiceTypeEnumId: "InvoiceSales",
            statusId: "InvoiceInProcess",
            fromPartyId: organizationPartyId,
            toPartyId: customerPartyId,
            invoiceDate: ec.user.nowTimestamp,
            accountingDate: ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd"),
            currencyUomId: currency,
            description: "Taxed equipment sale",
            draftedByUserId: ec.user.userId
        }
    )
    if (!policy.one("mantle.account.invoice.InvoiceItem", {invoiceId, invoiceItemSeqId: "00001"}))
        policy.call("mantle.account.InvoiceServices.create#InvoiceItem", {
            invoiceId,
            invoiceItemSeqId: "00001",
            itemTypeEnumId: "ItemProduct",
            quantity: "2",
            amount: ec.l10n.roundCurrency(toDecimal("150"), currency),
            description: "Trail equipment"
        })
    const invoice = policy.one("mantle.account.invoice.Invoice", {invoiceId})
    if (invoice.statusId === "InvoiceInProcess")
        policy.call("mantle.account.InvoiceServices.change#InvoiceState", {
            invoiceId,
            organizationPartyId,
            action: "finalize",
            lastUpdatedStamp: invoice.lastUpdatedStamp,
            operationKey: "BOSS_ACCT_DEMO_TAXED_FINAL",
            changeReason: "Accounting demo taxed invoice"
        })
    for (const [partyId, lastName, ssn, amount] of [
        ["BOSS_ACCT_1099_VENDOR", "Contractor", "123-45-6789", "750"],
        ["BOSS_ACCT_1099_NOTIN", "Consultant", null, "650"]
    ]) {
        createOnce("mantle.party.Party", {partyId}, {partyTypeEnumId: "PtyPerson"})
        createOnce("mantle.party.Person", {partyId}, {firstName: "Demo", lastName})
        createOnce("mantle.party.PartyRole", {partyId, roleTypeId: "Supplier"}, {})
        if (!policy.rows("mantle.other.tax.TaxAuthorityParty", {partyId, taxAuthorityId: "UsaIrs"}).length)
            policy.call("create#mantle.other.tax.TaxAuthorityParty", {
                partyId,
                taxAuthorityId: "UsaIrs",
                fromDate: "1970-01-01T00:00:00Z"
            })
        if (ssn && !policy.rows("mantle.party.PartyIdentification", {partyId}).length) {
            policy.call("create#mantle.party.PartyIdentification", {partyId, partyIdTypeEnumId: "PtidSsn", idValue: ssn})
            policy.call("mantle.party.ContactServices.store#PartyContactInfo", {
                partyId,
                postalContactMechPurposeId: "PostalPayment",
                address1: "9 Vendor Rd",
                city: "Orem",
                stateProvinceGeoId: "USA_UT",
                postalCode: "84057",
                countryGeoId: "USA"
            })
        }
        const billId = partyId + "_BILL"
        createOnce(
            "mantle.account.invoice.Invoice",
            {invoiceId: billId},
            {
                invoiceTypeEnumId: "InvoiceSales",
                statusId: "InvoiceReceived",
                fromPartyId: partyId,
                toPartyId: organizationPartyId,
                invoiceDate: ec.user.nowTimestamp,
                currencyUomId: currency,
                description: "Contract services"
            }
        )
        if (!policy.one("mantle.account.invoice.InvoiceItem", {invoiceId: billId, invoiceItemSeqId: "00001"}))
            policy.call("mantle.account.InvoiceServices.create#InvoiceItem", {
                invoiceId: billId,
                invoiceItemSeqId: "00001",
                itemTypeEnumId: "ItemExpServLabor",
                quantity: "1",
                amount: ec.l10n.roundCurrency(toDecimal(amount), currency),
                description: "Contract services"
            })
        if (!policy.rows("mantle.account.payment.Payment", {forInvoiceId: billId}).length)
            policy.call("mantle.account.PaymentServices.create#InvoicePayment", {
                invoiceId: billId,
                effectiveDate: ec.user.nowTimestamp,
                comments: "Contract services payment"
            })
    }
}

// The matching demo: the organization's match policy (three-way, 2% on price, a variance holds the bill), a purchase
// order received in full, and two bills from the supplier against it that wait for their match: six at the order price,
// and four at a price outside the tolerance.
function matching(currency) {
    if (!policy.rows("mantle.account.invoice.InvoiceMatchPolicy", {organizationPartyId}).length)
        policy.call("mantle.account.InvoiceMatchServices.store#MatchPolicy", {
            organizationPartyId,
            billBasisEnumId: "ImbReceived",
            receiptRequired: "Y",
            priceTolerancePercent: 2,
            varianceActionEnumId: "ImaHold",
            fromDate: new Date(Number(ec.user.nowTimestamp) - 86400000),
            changeReason: "Accounting demo: three-way, 2% on price"
        })
    const orderId = "BOSS_ACCT_PO_MATCH"
    const facilityId = "BOSS_ACCT_WH"
    createOnce(
        "mantle.order.OrderHeader",
        {orderId},
        {statusId: "OrderOpen", currencyUomId: currency, entryDate: ec.user.nowTimestamp}
    )
    createOnce(
        "mantle.order.OrderPart",
        {orderId, orderPartSeqId: "01"},
        {customerPartyId: organizationPartyId, vendorPartyId: supplierPartyId, statusId: "OrderOpen", facilityId}
    )
    if (!policy.rows("mantle.order.OrderItem", {orderId}).length) {
        policy.call("mantle.order.OrderServices.add#OrderProductQuantity", {
            orderId,
            orderPartSeqId: "01",
            productId: "BOSS_ACCT_SUPPLY",
            quantity: 10,
            unitAmount: 8,
            itemTypeEnumId: "ItemInventory"
        })
        policy.call("mantle.order.OrderServices.place#Order", {orderId})
        policy.call("mantle.order.OrderServices.approve#Order", {orderId})
        const shipment = policy.call("mantle.shipment.ShipmentServices.create#OrderPartShipment", {
            orderId,
            orderPartSeqId: "01",
            destinationFacilityId: facilityId
        })
        policy.call("mantle.shipment.ShipmentServices.ship#Shipment", {shipmentId: shipment.shipmentId})
        policy.call("mantle.shipment.ShipmentServices.receive#ShipmentProduct", {
            shipmentId: shipment.shipmentId,
            productId: "BOSS_ACCT_SUPPLY",
            quantityAccepted: 10,
            quantityRejected: 0,
            facilityId
        })
        policy.call("mantle.shipment.ShipmentServices.deliver#Shipment", {shipmentId: shipment.shipmentId})
    }
    for (const [invoiceId, referenceNumber, quantity, amount] of [
        ["BOSS_ACCT_BILL_MATCH", "SUPP-1101", 6, "8"],
        ["BOSS_ACCT_BILL_PRICE", "SUPP-1102", 4, "9"]
    ]) {
        createOnce(
            "mantle.account.invoice.Invoice",
            {invoiceId},
            {
                invoiceTypeEnumId: "InvoiceSales",
                statusId: "InvoiceIncoming",
                fromPartyId: supplierPartyId,
                toPartyId: organizationPartyId,
                invoiceDate: ec.user.nowTimestamp,
                accountingDate: ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd"),
                currencyUomId: currency,
                referenceNumber,
                description: "Supplies " + referenceNumber,
                draftedByUserId: "BOSS_ACCT_AP"
            }
        )
        if (!policy.one("mantle.account.invoice.InvoiceItem", {invoiceId, invoiceItemSeqId: "00001"}))
            policy.call("mantle.account.InvoiceServices.create#InvoiceItem", {
                invoiceId,
                invoiceItemSeqId: "00001",
                itemTypeEnumId: "ItemInventory",
                productId: "BOSS_ACCT_SUPPLY",
                quantity: String(quantity),
                amount: ec.l10n.roundCurrency(toDecimal(amount), currency),
                description: "Supplies"
            })
    }
}

// Valuation (P13): revaluation turned on as finance administration turns it on, the scrap reasons' accounts, a unit of
// the delivered receipt scrapped, and a carrier's approved freight bill the valuation walk allocates to the two receipts.
function valuation(currency) {
    // the general cost of goods sold account the organization's inventory issue mapping names (from DefaultSettings)
    createOnce("mantle.ledger.account.GlAccountOrganization", {organizationPartyId, glAccountId: "512000000"}, {fromDate: 0})
    const preference = policy.one("mantle.ledger.config.PartyAcctgPreference", {organizationPartyId})
    if (preference && preference.inventoryRevaluationEnabled !== "Y")
        policy.call("mantle.ledger.SetupServices.store#Preferences", {
            organizationPartyId,
            settings: {inventoryRevaluationEnabled: "Y"},
            changeReason: "Accounting demo: inventory revaluation",
            lastUpdatedStamp: preference.lastUpdatedStamp
        })
    for (const [varianceReasonEnumId, glAccountId] of [
        ["InVrScrap", "527000000"],
        ["InVrExpired", "525000000"]
    ])
        createOnce("mantle.ledger.config.VarianceReasonGlAccount", {organizationPartyId, varianceReasonEnumId}, {glAccountId})
    if (!policy.rows("mantle.product.asset.PhysicalInventory", {comments: "Accounting demo scrap"}).length)
        policy.call("mantle.product.AssetServices.record#PhysicalInventoryChange", {
            productId: "BOSS_ACCT_SUPPLY",
            facilityId: "BOSS_ACCT_WH",
            ownerPartyId: organizationPartyId,
            quantityChange: -1,
            varianceReasonEnumId: "InVrScrap",
            comments: "Accounting demo scrap"
        })
    const carrierPartyId = "BOSS_ACCT_CARRIER"
    createOnce("mantle.party.Party", {partyId: carrierPartyId}, {partyTypeEnumId: "PtyOrganization"})
    createOnce("mantle.party.Organization", {partyId: carrierPartyId}, {organizationName: "Accounting Demo Freight"})
    createOnce("mantle.party.PartyRole", {partyId: carrierPartyId, roleTypeId: "Supplier"}, {})
    const invoiceId = "BOSS_ACCT_BILL_FREIGHT"
    createOnce(
        "mantle.account.invoice.Invoice",
        {invoiceId},
        {
            invoiceTypeEnumId: "InvoiceSales",
            statusId: "InvoiceIncoming",
            fromPartyId: carrierPartyId,
            toPartyId: organizationPartyId,
            invoiceDate: ec.user.nowTimestamp,
            accountingDate: ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd"),
            currencyUomId: currency,
            referenceNumber: "FRT-2001",
            description: "Freight in on supplies",
            draftedByUserId: "BOSS_ACCT_AP"
        }
    )
    if (!policy.rows("mantle.account.invoice.InvoiceItem", {invoiceId}).length)
        policy.call("mantle.account.InvoiceServices.create#InvoiceItem", {
            invoiceId,
            itemTypeEnumId: "ItemShipping",
            quantity: "1",
            amount: ec.l10n.roundCurrency(toDecimal("28"), currency),
            description: "Freight in"
        })
    let bill = policy.one("mantle.account.invoice.Invoice", {invoiceId})
    if (bill.statusId === "InvoiceIncoming") {
        policy.call("mantle.account.InvoiceServices.change#InvoiceState", {
            invoiceId,
            organizationPartyId,
            action: "receive",
            lastUpdatedStamp: bill.lastUpdatedStamp,
            changeReason: "Carrier invoice received"
        })
        bill = policy.one("mantle.account.invoice.Invoice", {invoiceId})
    }
    if (bill.statusId === "InvoiceReceived")
        policy.call("mantle.account.InvoiceServices.approve#Payable", {
            invoiceId,
            organizationPartyId,
            lastUpdatedStamp: bill.lastUpdatedStamp,
            changeReason: "Freight agreed with the carrier"
        })
}

function asDemoAdministrator(operation) {
    if (ec.user.userId && !policy.capabilities().systemAdmin) throw new Error("Demo loading requires system administration")
    const loggedIn = !!ec.user.username
    if (!loggedIn) ec.user.internalLoginUser("john.doe")
    const authzDisabled = ec.artifactExecution.disableAuthz()
    try {
        return operation()
    } finally {
        if (!authzDisabled) ec.artifactExecution.enableAuthz()
        if (!loggedIn) ec.user.logoutUser()
    }
}

function load() {
    return asDemoAdministrator(() => {
        const currency = policy.preference(organizationPartyId).baseCurrencyUomId
        documents(currency)
        journalEntries(currency)
        configuration()
        finalizedReceivable(currency)
        receivableSupport()
        approvedWork()
        storeReceivable(currency)
        settlementDocuments(currency)
        paymentDocuments(currency)
        payables(currency)
        matching(currency)
        valuation(currency)
        banking(currency)
        periodClose(currency)

        taxDocuments(currency)
        return {complete: true}
    })
}
function loadGateway() {
    return asDemoAdministrator(() => gatewayDrafts(policy.preference(organizationPartyId).baseCurrencyUomId))
}
function loadGatewaySetup() {
    return asDemoAdministrator(() => gatewaySetup(policy.preference(organizationPartyId).baseCurrencyUomId))
}
function loadGatewayDraft(parameters) {
    return asDemoAdministrator(() => gatewayDraft(parameters))
}

const operations = {load, loadGateway, loadGatewaySetup, loadGatewayDraft}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown accounting demonstration operation " + op)
        return operations[op](parameters)
    }
})
