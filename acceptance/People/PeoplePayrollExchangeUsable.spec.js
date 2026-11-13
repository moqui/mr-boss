// People P28's "usable when" (impl-people P28; design-people §8.4, PayrollExchange, §14.3 "History and provider exchange"), as an
// acceptance walk with artifact authorization on, through PayrollExchange's transitions: people.payroll exports a period's approved
// inputs of a Retail group in external processing (preview, reconcile, export: the file and its manifest stored and downloaded),
// imports last year's payroll history with one unknown worker named (the rest recorded as historical pay records, no invoice), and
// Admin's Exports and Imports list both with People's place. The rules themselves are Mantle's PayrollExchange; the access case is
// PeopleAccessLater's. Run: ./moq accept mr-boss --spec PeoplePayrollExchangeUsable
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const webroot = "component://webroot/screen/webroot.xml"
const base = "apps/People/Payroll/PayrollExchange/"
const prefix = "WALK28"
const ines = {partyId: ids.reportPartyId, employmentId: "BOSS_PPL_INES_EMP"}
const state = {}
// a request under the web root as the user (a transition's post), with its errors
function request(user, path, parameters, method) {
    return asUser(user, () => {
        const result = ec.screen.makeTest().rootScreen(webroot).render(path, parameters, method)
        const errors = Array.from(result.errorMessages || []).join(" | ")
        ec.message.clearErrors()
        return {status: result.status, output: String(result.output || ""), errors}
    })
}
const today = () => ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
const latestBatch = exchangeKindEnumId =>
    system(
        () =>
            ec.entity
                .find("mantle.humanres.payroll.PayrollExchangeBatch")
                .condition({organizationPartyId: ids.organizationId, exchangeKindEnumId})
                .orderBy("-createdDate")
                .list()[0]
    )

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        system(() => {
            // a Retail group whose pay an external processor calculates, this month paid today, with Ines in it and her approved
            // hours of the month
            const from = today().slice(0, 8) + "01"
            const [year, month] = from.split("-").map(Number)
            const thru = from.slice(0, 8) + String(new Date(Date.UTC(year, month, 0)).getUTCDate()).padStart(2, "0")
            state.group = prefix + "_EXT"
            call("create#mantle.humanres.payroll.PayrollGroup", {
                payrollGroupId: state.group,
                organizationPartyId: ids.organizationId,
                groupName: "Walk external processing",
                currencyUomId: "USD",
                timePeriodTypeId: "PayrollMonth",
                firstPeriodFromDate: from,
                periodsPerYear: 12,
                payDateOffsetDays: 0,
                prorationEnumId: "PprCalendarDays",
                timeBasisEnumId: "PtbTimesheets",
                externalProcessing: "Y",
                liveEnabled: "N",
                fromDate: 0
            })
            const existing = ec.entity
                .find("mantle.party.time.TimePeriod")
                .condition({partyId: ids.organizationId, timePeriodTypeId: "PayrollMonth", fromDate: from})
                .one()
            state.period = existing
                ? existing.timePeriodId
                : call("mantle.party.TimeServices.create#TimePeriod", {
                      partyId: ids.organizationId,
                      timePeriodTypeId: "PayrollMonth",
                      fromDate: from,
                      thruDate: thru
                  }).timePeriodId
            call("create#mantle.humanres.payroll.PayrollGroupPeriod", {
                payrollGroupId: state.group,
                timePeriodId: state.period,
                payDate: today()
            })
            call("create#mantle.humanres.payroll.PayrollStructure", {
                payrollStructureId: prefix + "_STRUCT",
                organizationPartyId: ids.organizationId,
                structureName: "Walk external",
                currencyUomId: "USD",
                payBasisEnumId: "PpbSalaried",
                statusId: "PtsPublished",
                fromDate: 0
            })
            call("create#mantle.humanres.payroll.PayrollAssignment", {
                partyRelationshipId: ines.employmentId,
                partyId: ines.partyId,
                organizationPartyId: ids.organizationId,
                payrollStructureId: prefix + "_STRUCT",
                payrollGroupId: state.group,
                isPrimary: "Y",
                fromDate: 0
            })
            call("create#mantle.humanres.payroll.PayrollInput", {
                partyRelationshipId: ines.employmentId,
                partyId: ines.partyId,
                organizationPartyId: ids.organizationId,
                payrollGroupId: state.group,
                timePeriodId: state.period,
                inputTypeEnumId: "PitWorked",
                inputName: "workedHours",
                inputDate: from,
                quantity: "7.5",
                quantityUomId: "TF_hr",
                statusId: "PinApproved",
                entitlementKey: prefix + ":HOURS:INES",
                activeEntitlementKey: prefix + ":HOURS:INES",
                isAdjustment: "N"
            })
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("people.payroll exports a period's approved inputs with its manifest", {
    when() {
        const previewed = request(
            users.payroll,
            base + "previewBatch",
            {exchangeKind: "export", payrollGroupId: state.group, timePeriodId: state.period, sourceSystem: "Walk processor"},
            "post"
        )
        state.exportId = latestBatch("PxkExport")?.payrollExchangeBatchId
        const reconciled = request(users.payroll, base + "reconcileBatch", {payrollExchangeBatchId: state.exportId}, "post")
        const executed = request(users.payroll, base + "executeBatch", {payrollExchangeBatchId: state.exportId}, "post")
        const shown = asUser(users.payroll, () =>
            page("Payroll/PayrollExchange", {payrollExchangeBatchId: state.exportId}, "html")
        )
        const file = request(users.payroll, base + "exchangeFile", {payrollExchangeBatchId: state.exportId, part: "file"}, "get")
        const manifest = request(
            users.payroll,
            base + "exchangeFile",
            {payrollExchangeBatchId: state.exportId, part: "manifest"},
            "get"
        )
        return {
            errors: [previewed.errors, reconciled.errors, executed.errors].join(""),
            batch: latestBatch("PxkExport"),
            shown: shown.output,
            file: file.output,
            manifest: manifest.output
        }
    },
    then({errors, batch, shown, file, manifest}) {
        errors == ""
        batch.statusId == "PxbExecuted"
        batch.transferId != null
        shown.includes("Export of approved inputs") && shown.includes("Download manifest")
        file.includes(prefix + ":HOURS:INES") && file.includes("Worked hours")
        JSON.parse(manifest).sourceKeys.includes(prefix + ":HOURS:INES")
    }
})

feature("people.payroll imports last year's history with one unknown worker named, the rest recorded with no invoice", {
    when() {
        const lastYear = String(Number(today().slice(0, 4)) - 1)
        const file = [
            "worker,payDate,gross,net",
            ines.partyId + "," + lastYear + "-11-30,3200.00,2500.00",
            ines.partyId + "," + lastYear + "-12-31,3200.00,2500.00",
            "WALK28_NOBODY," + lastYear + "-12-31,1000.00,800.00"
        ].join("\n")
        const invoicesBefore = system(() =>
            ec.entity.find("mantle.account.invoice.Invoice").condition({fromPartyId: ines.partyId}).count()
        )
        const previewed = request(
            users.payroll,
            base + "previewBatch",
            {
                exchangeKind: "history",
                organizationPartyId: ids.organizationId,
                cutoverDate: today().slice(0, 4) + "-01-01",
                currencyUomId: "USD",
                sourceSystem: "Former payroll",
                importText: file,
                expectedCount: "2",
                expectedGross: "6400",
                expectedNet: "5000"
            },
            "post"
        )
        state.historyId = latestBatch("PxkHistory")?.payrollExchangeBatchId
        const reconciled = request(users.payroll, base + "reconcileBatch", {payrollExchangeBatchId: state.historyId}, "post")
        const executed = request(users.payroll, base + "executeBatch", {payrollExchangeBatchId: state.historyId}, "post")
        const problems = asUser(users.payroll, () =>
            page("Payroll/PayrollExchange", {payrollExchangeBatchId: state.historyId, outcome: "problems"}, "html")
        )
        return {
            errors: [previewed.errors, reconciled.errors, executed.errors].join(""),
            batch: latestBatch("PxkHistory"),
            problems: problems.output,
            records: system(() =>
                ec.entity
                    .find("mantle.humanres.employment.EmploymentPayHistory")
                    .condition({partyRelationshipId: ines.employmentId})
                    .count()
            ),
            invoicesAdded:
                system(() => ec.entity.find("mantle.account.invoice.Invoice").condition({fromPartyId: ines.partyId}).count()) -
                invoicesBefore
        }
    },
    then({errors, batch, problems, records, invoicesAdded}) {
        errors == ""
        batch.statusId == "PxbExecuted"
        batch.appliedCount == 2 && batch.errorCount == 1
        problems.includes("No person is WALK28_NOBODY")
        records >= 2
        invoicesAdded == 0
    }
})

feature("Admin's Exports and Imports list both, each with People's place", {
    when() {
        const exports = system(() =>
            invoke("org.moqui.admin.DataTransferServices.find#ExportRuns", {targetId: "payrollExchangeInputs"})
        )
        const imports = system(() => invoke("org.moqui.admin.DataTransferServices.find#ImportRuns", {}))
        const batch = system(() =>
            ec.entity
                .find("mantle.humanres.payroll.PayrollExchangeBatch")
                .condition({payrollExchangeBatchId: state.exportId})
                .one()
        )
        return {
            exported: Array.from(exports.transferList || []).find(row => row.runId === batch.transferId) || null,
            imported: Array.from(imports.transferList || []).find(row => row.runId === state.historyId) || null
        }
    },
    then({exported, imported}) {
        exported.targetId == "payrollExchangeInputs" && exported.ownerApp == "People"
        imported.targetId == "payrollExchange" && imported.ownerRoute == "peoplePayrollExchange"
        imported.appliedCount == 2 && imported.errorCount == 1
    }
})
