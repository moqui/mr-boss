// Calendar dates selected for a project invoice survive a different viewer's zone. Service-only bug regression;
// printing consumes the same detail projection, so this adds no screen render or billing journey.
const project = "INV_CAL_REVIEW"
const made = {}

spec({
    setupSpec() {
        login("john.doe")
        ec.artifactExecution.disableAuthz()
        made.zone = ec.user.timeZone
        call("create#mantle.work.effort.WorkEffort", {
            workEffortId: project,
            workEffortTypeEnumId: "WetProject",
            workEffortName: "Invoice calendar date regression",
            ownerPartyId: "ORG_ZIZI_SERVICES",
            statusId: "WeInProgress"
        })
        for (const [partyId, roleTypeId] of [
            ["ORG_ZIZI_SERVICES", "Vendor"],
            ["ORG_ACME", "Customer"],
            ["EX_JOHN_DOE", "ProjectManager"]
        ])
            call("create#mantle.work.effort.WorkEffortParty", {
                workEffortId: project,
                partyId,
                roleTypeId,
                fromDate: "2020-01-01 00:00:00",
                statusId: "WeptAssigned"
            })
        ec.user.setTimeZone("Europe/Berlin")
        made.id = call("mantle.account.InvoiceServices.create#Invoice", {
            invoiceTypeEnumId: "InvoiceSales",
            fromPartyId: "ORG_ZIZI_SERVICES",
            toPartyId: "ORG_ACME",
            currencyUomId: "USD",
            statusId: "InvoiceInProcess",
            invoiceDate: Date.UTC(2026, 10, 8, 23),
            dueDate: Date.UTC(2026, 11, 8, 23),
            accountingDate: "2026-11-09"
        }).invoiceId
        call("create#mantle.work.effort.WorkEffortInvoice", {workEffortId: project, invoiceId: made.id})
        // The issued single portion is a SQL DATE, independent of the historical timestamp's author zone.
        call("create#mantle.account.invoice.InvoiceDueSchedule", {
            invoiceId: made.id,
            scheduleSeqId: "01",
            dueDate: "2026-12-09",
            amount: 0,
            settlementTermId: "Net30"
        })
    },
    cleanupSpec() {
        ec.user.setTimeZone(made.zone)
        call("update#mantle.account.invoice.Invoice", {invoiceId: made.id, statusId: "InvoiceCancelled"})
        call("update#mantle.work.effort.WorkEffort", {workEffortId: project, statusId: "WeCancelled"})
        ec.artifactExecution.enableAuthz()
    }
})

feature("project invoice detail and list use their canonical book day and single issued due day in both zones", {
    when() {
        const results = []
        for (const zone of ["Europe/Berlin", "America/Chicago"]) {
            ec.user.setTimeZone(zone)
            const detail = call("ironstone.projects.BillingServices.get#InvoiceDetail", {invoiceId: made.id}).detail
            const list = call("ironstone.projects.BillingServices.find#InvoiceRows", {
                rootWorkEffortId: project,
                list: "all"
            }).rowList
            const dated = call("ironstone.projects.BillingServices.find#InvoiceRows", {
                rootWorkEffortId: project,
                list: "all",
                fromDate: ec.l10n.parseTimestamp("2026-11-09 00:00:00.000", "yyyy-MM-dd HH:mm:ss.SSS"),
                thruDate: ec.l10n.parseTimestamp("2026-11-10 00:00:00.000", "yyyy-MM-dd HH:mm:ss.SSS")
            }).rowList
            results.push({
                detail,
                row: Array.from(list || []).find(row => row.invoiceId === made.id),
                dated: Array.from(dated || []).some(row => row.invoiceId === made.id)
            })
        }
        return {results}
    },
    // Mantle's invoiceCalendarDays cases (single, multiple, legacy, missing) are in mr-mantle ProjectInvoiceOutput.
    then({results}) {
        results.length == 2
        results.every(row => row.dated)
        results.every(row => row.detail.invoiceDateText === "2026-11-09" && row.detail.invoiceDateValue === "2026-11-09")
        results.every(row => row.detail.dueDateText === "2026-12-09")
        results.every(row => row.row && row.row.dateText === "2026-11-09" && row.row.dueText === "2026-12-09")
    }
})
