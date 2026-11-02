// IronStone Projects billing, P8a (impl-projects.md P8a; design-projects.md §10 Unbilled, Invoices, InvoiceDetail, Rates, §12
// BillingSettings, §3 Home's Unbilled), with authorization on: the billing demo (data/BossProjectsDemoDataTimeBilling.xml: SUPP billed to
// Brightwater Dental Group, its rates, a draft invoice of Joe's approved week) in Unbilled, Invoices, InvoiceDetail and on Home and SUPP's header; then in a
// project of its own (BIL, john.doe its manager, joe.developer a programmer, in the week of July 5, 2027): the invoice dialog's
// refusals (nothing selected, a project with no client), a draft's header edited (the terms move the due date), a line removed and the
// invoice cancelled (each frees its time), a rate edited and ended, the billing settings saved; and joe.developer, who does not manage
// money, refused an invoice (the one check of every money service, BillingServices check#Money).
// Run: ./moq test mr-boss --spec Billing
const webroot = "component://webroot/screen/webroot.xml"
const PROJECT = "BIL"
const at = (day, hour) => Number(String(ec.l10n.parseTimestamp(`2027-07-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:00:00.000`, "yyyy-MM-dd HH:mm:ss.SSS")))
const NOW = at(14, 10)
const made = {}

function render(path, parameters, mode) {
    const str = ec.screen.makeTest().rootScreen(webroot).renderMode(mode || "qvt").withStaticData().render(path,
            Object.assign({ lastStandalone: "true" }, parameters || {}), null)
    const output = String(str.output || "")
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), output, broken: /Error rendering|Exception in render/.test(output) }
}
function post(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(webroot).render("apps/Projects/" + path, parameters || {}, "post")
    const output = String(str.output || "")
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), output }
}
function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
function as(username, run) {
    login(username)
    if (made.now) ec.user.setEffectiveTime(made.now)
    try { return run() } finally { login("john.doe"); if (made.now) ec.user.setEffectiveTime(made.now) }
}
function errorOf(name, params) {
    try { call(name, params) } catch (err) { const thrown = String(err.message); ec.message.clearErrors(); return thrown }
    const errors = ec.message.hasError() ? ec.message.getErrorsString() : ""
    ec.message.clearErrors()
    return errors
}
const one = (entityName, fields) => sys(() => ec.entity.find(entityName).condition(fields).one())
const dec = (value) => value == null ? null : String(toDecimal(value).setScale(2, "HALF_UP"))
const entries = () => sys(() => Array.from(ec.entity.find("mantle.work.time.TimeEntry").condition("workEffortId", PROJECT).orderBy("fromDate").list()))

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        ec.artifactExecution.enableAuthz()
        made.settings = one("mantle.party.PartySetting", { partyId: "ORG_ZIZI_SERVICES", partySettingTypeId: "ProjBillingDefaults" })?.settingValue ?? null
    },
    cleanupSpec() {
        sys(() => {
            for (const link of ec.entity.find("mantle.work.effort.WorkEffortInvoice").condition("workEffortId", PROJECT).list()) {
                const invoice = ec.entity.find("mantle.account.invoice.Invoice").condition("invoiceId", link.invoiceId).one()
                if (invoice && invoice.statusId !== "InvoiceCancelled") call("update#mantle.account.invoice.Invoice", { invoiceId: invoice.invoiceId, statusId: "InvoiceCancelled" })
            }
            for (const rate of ec.entity.find("mantle.humanres.rate.RateAmount").condition("workEffortId", PROJECT).list()) { rate.thruDate = rate.fromDate; rate.update() }
            const project = ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortId", PROJECT).one()
            if (project) { project.statusId = "WeCancelled"; project.update() }
            const setting = ec.entity.find("mantle.party.PartySetting").condition({ partyId: "ORG_ZIZI_SERVICES", partySettingTypeId: "ProjBillingDefaults" }).one()
            if (setting && made.settings != null) { setting.settingValue = made.settings; setting.update() }
        })
        ec.user.setEffectiveTime(null)
    },
})

feature("the demo: SUPP is unbilled for Brightwater, on Home and SUPP's header too; its draft invoice bills Joe's approved week, 40 h at 140 in a line, with the 10 entries behind it", {
    when() {
        made.demoInvoiceId = sys(() => Array.from(ec.entity.find("mantle.work.effort.WorkEffortInvoice").condition("workEffortId", "SUPP").list())[0]?.invoiceId)
        return {
            unbilled: render("apps/Projects/Billing/Unbilled", {}),
            home: render("apps/Projects/Home", {}),
            header: sys(() => call("ironstone.projects.ProjectServices.get#ProjectHeader", { workEffortId: "SUPP" }).header),
            invoices: render("apps/Projects/Billing/Invoices", {}),
            detail: render("apps/Projects/Billing/InvoiceDetail", { invoiceId: made.demoInvoiceId }),
            invoice: one("mantle.account.invoice.Invoice", { invoiceId: made.demoInvoiceId }),
            time: sys(() => call("mantle.account.InvoiceServices.get#InvoiceTimeDetail", { invoiceId: made.demoInvoiceId })),
            joeHome: as("joe.developer", () => render("apps/Projects/Home", {})),
        }
    },
    then({ unbilled, home, header, invoices, detail, invoice, time, joeHome }) {
        made.demoInvoiceId != null
        unbilled.status == 200 && !unbilled.broken
        unbilled.output.includes("IronStone support desk")
        unbilled.output.includes("Brightwater Dental Group")
        home.output.includes("Unbilled")
        /^\$[0-9,]+\.\d\d$/.test(header.unbilledText)
        invoices.output.includes(made.demoInvoiceId)
        invoices.output.includes("Drafts · ")
        detail.status == 200 && !detail.broken
        detail.output.includes("$5,600.00")
        detail.output.includes("accounts@brightwater.example")
        invoice.statusId == "InvoiceInProcess" && invoice.toPartyId == "BOSS_DEMO_BRIGHTWATER" && invoice.settlementTermId == "Net30"
        dec(invoice.invoiceTotal) == "5600.00"
        time.entryList.length == 10
        time.entryList.every((entry) => entry.personName === "Joe Developer" && dec(entry.rate) === "140.00")
        !joeHome.output.includes("$5,600.00") && !/title="Unbilled"/.test(joeHome.output)
    },
})

feature("the invoice dialog refuses nothing selected, and a project with no client; joe.developer may not invoice or see what is unbilled", {
    when() {
        made.now = NOW
        ec.user.setEffectiveTime(NOW)
        sys(() => {
            call("mantle.work.ProjectServices.create#Project", { workEffortId: PROJECT, workEffortName: "Billing settings walk", visibilityEnumId: "WevWorkGroup" })
            call("update#mantle.work.effort.WorkEffort", { workEffortId: PROJECT, statusId: "WeInProgress", ownerPartyId: "ORG_ZIZI_SERVICES" })
            for (const [partyId, roleTypeId] of [["EX_JOHN_DOE", "ProjectManager"], ["ORG_ZIZI_JD", "Programmer"], ["ORG_ZIZI_SERVICES", "Vendor"]])
                call("create#mantle.work.effort.WorkEffortParty", { workEffortId: PROJECT, partyId, roleTypeId, fromDate: "2027-01-01 00:00:00", statusId: "WeptAssigned" })
            call("mantle.humanres.RateServices.create#RateAmount", { workEffortId: PROJECT, ratePurposeEnumId: "RaprClient", rateTypeEnumId: "RatpStandard", rateAmount: 120,
                rateCurrencyUomId: "USD", fromDate: "2027-07-01 00:00:00" })
        })
        as("joe.developer", () => sys(() => {
            for (const [day, hours, comments] of [[5, 4, "Ledger"], [6, 2.5, "Tax lines"], [7, 3, "Statements"]])
                call("mantle.work.TimeServices.store#TimeEntry", { partyId: "ORG_ZIZI_JD", workEffortId: PROJECT, fromDate: at(day, 9), thruDate: at(day, 9) + hours * 3600000,
                    hours, comments, rateTypeEnumId: "RatpStandard" })
            call("mantle.work.TimesheetServices.submit#Timesheet", { timesheetId: entries()[0].timesheetId })
        }))
        sys(() => call("mantle.work.TimesheetServices.approve#Timesheet", { timesheetId: entries()[0].timesheetId }))
        const noClient = post("Billing/Unbilled/CreateInvoice/createInvoice", { workEffortId: PROJECT, timeEntryIds: entries().map((row) => row.timeEntryId), entryGrouping: "entry" })
        const unbilled = render("apps/Projects/Billing/Unbilled", { rootWorkEffortId: PROJECT })
        sys(() => {
            if (!ec.entity.find("mantle.party.Party").condition("partyId", "BIL_CLIENT").count()) {
                call("create#mantle.party.Party", { partyId: "BIL_CLIENT", partyTypeEnumId: "PtyOrganization" })
                call("create#mantle.party.Organization", { partyId: "BIL_CLIENT", organizationName: "Billing Spec Client" })
                call("create#mantle.party.PartyRole", { partyId: "BIL_CLIENT", roleTypeId: "Customer" })
            }
            call("create#mantle.work.effort.WorkEffortParty", { workEffortId: PROJECT, partyId: "BIL_CLIENT", roleTypeId: "Customer", fromDate: "2027-01-01 00:00:00" })
        })
        const noneSelected = post("Billing/Unbilled/CreateInvoice/createInvoice", { workEffortId: PROJECT, entryGrouping: "entry" })
        const joeSummary = as("joe.developer", () => sys(() => errorOf("ironstone.projects.BillingServices.create#ProjectInvoice", { workEffortId: PROJECT })))
        return { noClient, unbilled, noneSelected, joeSummary, invoiced: entries().filter((row) => row.invoiceId).length }
    },
    then({ noClient, unbilled, noneSelected, joeSummary, invoiced }) {
        noClient.errors.includes("The project has no client")
        unbilled.output.includes("No client")
        unbilled.output.includes("The project has no client")
        noneSelected.errors.includes("Select the time or the milestones to invoice")
        joeSummary.includes("Only those who manage money")
        invoiced == 0
    },
})

feature("a draft's header edited: Net 15 moves the due date; a line removed frees its time; the invoice cancelled frees the rest", {
    when() {
        const created = post("Billing/Unbilled/CreateInvoice/createInvoice", { workEffortId: PROJECT, timeEntryIds: entries().map((row) => row.timeEntryId), entryGrouping: "entry",
            settlementTermId: "Net30", invoiceDate: "2027-07-14" })
        made.invoiceId = sys(() => Array.from(ec.entity.find("mantle.work.effort.WorkEffortInvoice").condition("workEffortId", PROJECT).list())[0]?.invoiceId)
        const before = one("mantle.account.invoice.Invoice", { invoiceId: made.invoiceId })
        const edited = post("Billing/InvoiceDetail/updateHeader", { invoiceId: made.invoiceId, invoiceDate: "2027-07-14", settlementTermId: "Net15", referenceNumber: "PO-778",
            description: "July work", invoiceMessage: "Thank you." })
        const after = one("mantle.account.invoice.Invoice", { invoiceId: made.invoiceId })
        const seqId = entries().find((row) => row.comments === "Tax lines").invoiceItemSeqId
        const removed = post("Billing/InvoiceDetail/removeLine", { invoiceId: made.invoiceId, invoiceItemSeqId: seqId })
        const afterRemove = { invoice: one("mantle.account.invoice.Invoice", { invoiceId: made.invoiceId }), rows: entries() }
        const detail = render("apps/Projects/Billing/InvoiceDetail", { invoiceId: made.invoiceId })
        const cancelled = post("Billing/InvoiceDetail/changeStatus", { invoiceId: made.invoiceId, action: "cancel" })
        return { created, before, edited, after, removed, afterRemove, detail, cancelled, final: one("mantle.account.invoice.Invoice", { invoiceId: made.invoiceId }), rows: entries() }
    },
    then({ created, before, edited, after, removed, afterRemove, detail, cancelled, final, rows }) {
        created.errors == ""
        dec(before.invoiceTotal) == "1140.00"
        Math.round((Number(String(before.dueDate)) - Number(String(before.invoiceDate))) / 86400000) == 30
        edited.errors == ""
        after.settlementTermId == "Net15" && after.referenceNumber == "PO-778" && after.description == "July work"
        Math.round((Number(String(after.dueDate)) - Number(String(after.invoiceDate))) / 86400000) == 15
        removed.errors == ""
        dec(afterRemove.invoice.invoiceTotal) == "840.00"
        afterRemove.rows.find((row) => row.comments === "Tax lines").invoiceId == null
        detail.output.includes("PO-778")
        detail.output.includes("Thank you.")
        cancelled.errors == ""
        final.statusId == "InvoiceCancelled"
        rows.every((row) => row.invoiceId == null)
    },
})

feature("a rate edited (amount and thru) and ended; ended rates are listed on asking", {
    when() {
        const rate = sys(() => Array.from(ec.entity.find("mantle.humanres.rate.RateAmount").condition("workEffortId", PROJECT).list())[0])
        const edited = post("Billing/Rates/saveRate", { rateAmountId: rate.rateAmountId, fromDate: "2027-07-01", thruDate: "2027-12-31", rateAmount: "125.50" })
        const afterEdit = one("mantle.humanres.rate.RateAmount", { rateAmountId: rate.rateAmountId })
        const ended = post("Billing/Rates/endRate", { rateAmountId: rate.rateAmountId })
        const list = render("apps/Projects/Billing/Rates", { rootWorkEffortId: PROJECT })
        const withEnded = render("apps/Projects/Billing/Rates", { rootWorkEffortId: PROJECT, showEnded: "Y" })
        return { edited, afterEdit, ended, list, withEnded, endedRate: one("mantle.humanres.rate.RateAmount", { rateAmountId: rate.rateAmountId }) }
    },
    then({ edited, afterEdit, ended, list, withEnded, endedRate }) {
        edited.errors == ""
        dec(afterEdit.rateAmount) == "125.50"
        afterEdit.thruDate != null
        ended.errors == ""
        Number(String(endedRate.thruDate)) <= NOW
        !list.output.includes("125.50")
        withEnded.output.includes("125.50")
        withEnded.output.includes("Ended")
    },
})

feature("the billing settings saved and shown again", {
    when() {
        const saved = post("Settings/Billing/saveDefaults", { billingBasis: "Milestones", invoiceGrouping: "OneLine", timeDetail: "N", shareHours: "Y", settlementTermId: "Net15",
            workerInvoicing: "ByProject" })
        const page = render("apps/Projects/Settings/Billing", {})
        const stored = JSON.parse(one("mantle.party.PartySetting", { partyId: "ORG_ZIZI_SERVICES", partySettingTypeId: "ProjBillingDefaults" }).settingValue)
        const grouping = sys(() => call("ironstone.projects.BillingServices.get#InvoiceDraft", { workEffortId: PROJECT }).draft.entryGrouping)
        return { saved, page, stored, grouping }
    },
    then({ saved, page, stored, grouping }) {
        saved.errors == ""
        page.status == 200 && !page.broken
        page.output.includes("Billing defaults")
        stored.billingBasis == "Milestones" && stored.invoiceGrouping == "OneLine" && stored.timeDetail == false && stored.shareHours == true
        stored.settlementTermId == "Net15" && stored.workerInvoicing == "ByProject"
        // the project's grouping follows the organization's when it has none of its own
        grouping == "all"
    },
})
