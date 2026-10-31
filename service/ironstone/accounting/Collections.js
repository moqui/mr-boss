// Screen context for collections, credit and recurring invoices: the Collections work list, the reminder runs, the
// collection policies, the recurring schedules with the recurring orders and their job, the Accounting Today items and the
// drop-downs these screens use. Mantle's CollectionServices, CreditServices and RecurringInvoiceServices own every change
// and its authorization; this reads after the Accounting access check and shapes rows for the screens.
const lib = ec.resource.script("component://mr-boss/service/ironstone/accounting/AccountingLib.js")
const {policy, array, money} = lib
const OPEN_INVOICE_STATUSES = ["InvoiceFinalized", "InvoiceSent", "InvoiceAcked"]
const GROUP_LIMIT = 1000
const today = () => ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
const startOf = day => ec.l10n.parseTimestamp(day + " 00:00:00", "yyyy-MM-dd HH:mm:ss")
const dayNumber = day => {
    const [year, month, date] = String(day).split("-").map(Number)
    return Date.UTC(year, month - 1, date) / 86400000
}
const stampDay = value => (value == null || value === "" ? "" : policy.lib.bookDay(null, value))
const calendarDay = value => (value == null || value === "" ? "" : policy.calendarDateText(value))
const inIds = (entity, field, ids, conditions = {}) =>
    ids.length ? array(policy.find(entity, conditions).condition(field, "in", ids).list()) : []
const readsReceivables = scope => ["arRead", "reportRead", "admin", "systemAdmin"].some(name => scope.capabilities[name])
const bucketLabels = {current: "Not yet due", d30: "1–30 days", d60: "31–60 days", d90: "61–90 days", over: "Over 90 days"}
const bucketOf = days => (days <= 0 ? "current" : days <= 30 ? "d30" : days <= 60 ? "d60" : days <= 90 ? "d90" : "over")
const promiseColors = {open: "primary", kept: "positive", broken: "negative", cancelled: "grey-7"}

function receivableScope(parameters) {
    const scope = lib.access(parameters)
    if (!readsReceivables(scope)) throw new Error("PERMISSION_DENIED: Receivables read authority is required")
    return Object.assign(scope, {organizationPartyId: policy.organization(parameters).organizationPartyId})
}

// The overdue customers of the organization, each with its amount, oldest due day, disputes, last contact, next action
// and collector, and its latest promise; filtered by customer, collector, bucket, dispute and promise state, a page at a
// time. More overdue customers than one list reads are named (incomplete).
function work(parameters) {
    const scope = receivableScope(parameters)
    const org = scope.organizationPartyId
    let query = policy
        .find("mantle.account.invoice.CollectionOverdueSummary", {fromPartyId: org})
        .condition("statusId", "in", OPEN_INVOICE_STATUSES)
        .condition("unpaidTotal", "greater", toDecimal(0))
        .condition("dueDate", "less", startOf(today()))
    if (parameters.customerPartyId) query = query.condition("toPartyId", parameters.customerPartyId)
    const groups = array(
        query
            .selectField("toPartyId")
            .selectField("currencyUomId")
            .selectField("overdueTotal")
            .selectField("oldestDueDate")
            .selectField("invoiceCount")
            .limit(GROUP_LIMIT + 1)
            .list()
    )
    const incomplete = groups.length > GROUP_LIMIT
    const list = groups.slice(0, GROUP_LIMIT)
    const customerIds = [...new Set(list.map(row => row.toPartyId))]
    const names = policy.lib.partyNames(customerIds)
    const disputed = {}
    for (const row of inIds("mantle.account.invoice.Invoice", "toPartyId", customerIds, {fromPartyId: org}).filter(
        row => row.disputedDate && OPEN_INVOICE_STATUSES.includes(row.statusId)
    ))
        disputed[row.toPartyId] = (disputed[row.toPartyId] || 0) + 1
    const links = inIds("mantle.account.invoice.CollectionActivity", "customerPartyId", customerIds, {organizationPartyId: org})
    const efforts = {}
    const effortIds = links.map(row => row.workEffortId)
    for (let start = 0; start < effortIds.length; start += 500)
        for (const row of inIds("mantle.work.effort.WorkEffort", "workEffortId", effortIds.slice(start, start + 500)))
            efforts[row.workEffortId] = row
    const assignees = {}
    for (let start = 0; start < effortIds.length; start += 500)
        for (const row of inIds("mantle.work.effort.WorkEffortParty", "workEffortId", effortIds.slice(start, start + 500), {
            roleTypeId: "Assignee"
        }))
            assignees[row.workEffortId] = row.partyId
    const collectorNames = policy.lib.partyNames(Object.values(assignees))
    const promiseRows = ec.resource
        .script("component://mr-mantle/service/mantle/account/Collections.js")
        .promiseStates(
            inIds("mantle.account.invoice.CollectionPromise", "customerPartyId", customerIds, {organizationPartyId: org})
        )
    const now = today()
    let rows = list
        .filter(row => names[row.toPartyId])
        .map(row => {
            const customerPartyId = row.toPartyId
            const mine = links.filter(link => link.customerPartyId === customerPartyId && efforts[link.workEffortId])
            const done = mine
                .filter(link => ["WeComplete", "WeClosed"].includes(efforts[link.workEffortId].statusId))
                .map(link => efforts[link.workEffortId])
                .sort((a, b) => policy.ms(b.actualCompletionDate) - policy.ms(a.actualCompletionDate))
            const open = mine
                .filter(link => !["WeComplete", "WeClosed", "WeCancelled"].includes(efforts[link.workEffortId].statusId))
                .map(link => efforts[link.workEffortId])
                .sort((a, b) => policy.ms(a.estimatedCompletionDate) - policy.ms(b.estimatedCompletionDate))
            const next = open[0] || null
            const collectorPartyId = next ? assignees[next.workEffortId] || null : null
            const promise = promiseRows
                .filter(promise => promise.customerPartyId === customerPartyId && promise.currencyUomId === row.currencyUomId)
                .sort((a, b) => policy.ms(b.createdDate) - policy.ms(a.createdDate))[0]
            const oldest = stampDay(row.oldestDueDate)
            const daysOverdue = oldest ? dayNumber(now) - dayNumber(oldest) : 0
            const bucket = bucketOf(daysOverdue)
            return {
                customerPartyId,
                customerName: names[customerPartyId],
                currencyUomId: row.currencyUomId,
                overdueTotal: row.overdueTotal,
                invoiceCount: row.invoiceCount,
                oldestDueDateText: oldest,
                daysOverdue,
                bucket,
                bucketText: bucketLabels[bucket],
                disputedCount: disputed[customerPartyId] || 0,
                lastContactText: done.length ? policy.dateText(done[0].actualCompletionDate) : "",
                nextActionText: next ? next.workEffortName + " · " + stampDay(next.estimatedCompletionDate) : "",
                nextActionOverdue: !!next && stampDay(next.estimatedCompletionDate) < now,
                collectorPartyId,
                collectorName: collectorNames[collectorPartyId] || "",
                promiseState: promise?.state || "none",
                promiseText: promise
                    ? promise.stateText + " · " + money(promise.amount, promise.currencyUomId) + " by " + promise.promisedDateText
                    : "",
                promiseColor: promiseColors[promise?.state] || "grey-7",
                customerParameters: {organizationPartyId: org, customerPartyId},
                dialogKey: customerPartyId + "_" + row.currencyUomId
            }
        })
    if (parameters.collectorPartyId) rows = rows.filter(row => row.collectorPartyId === parameters.collectorPartyId)
    if (parameters.bucket) rows = rows.filter(row => row.bucket === parameters.bucket)
    if (parameters.disputed === "Y") rows = rows.filter(row => row.disputedCount > 0)
    if (parameters.promiseState) rows = rows.filter(row => row.promiseState === parameters.promiseState)
    rows.sort((a, b) => b.daysOverdue - a.daysOverdue || toDecimal(b.overdueTotal).compare(a.overdueTotal))
    const pageSize = Math.min(100, Math.max(1, Number(parameters.pageSize) || 20))
    const pageMaxIndex = Math.max(0, Math.ceil(rows.length / pageSize) - 1)
    const pageIndex = Math.min(pageMaxIndex, Math.max(0, Number(parameters.pageIndex) || 0))
    const page = {
        recordCount: rows.length,
        pageSize,
        pageIndex,
        pageMaxIndex,
        pageRangeLow: rows.length ? pageIndex * pageSize + 1 : 0,
        pageRangeHigh: Math.min(rows.length, (pageIndex + 1) * pageSize)
    }
    return Object.assign(lib.paging(page, "workRows"), {
        workRows: rows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
        incomplete,
        workCapabilities: {canEdit: !!(scope.capabilities.arEdit || scope.capabilities.admin)}
    })
}

// The organization's reminder runs, newest first, with their counts.
function dunningRuns(parameters) {
    const scope = receivableScope(parameters)
    const org = scope.organizationPartyId
    const query = () => policy.find("mantle.account.invoice.DunningRun", {organizationPartyId: org})
    const page = policy.lib.page(query().orderBy("-createdDate,-dunningRunId"), parameters, "runs", query().count())
    const runs = array(page.rows)
    const notices = inIds(
        "mantle.account.invoice.DunningNotice",
        "dunningRunId",
        runs.map(row => row.dunningRunId)
    )
    const count = (run, statusId) => notices.filter(row => row.dunningRunId === run && row.statusId === statusId).length
    const colors = {DrnPreview: "primary", DrnPartial: "warning", DrnSent: "positive"}
    const levels = array(
        policy
            .find("mantle.account.invoice.DunningLevel", {organizationPartyId: org})
            .condition(ec.entity.conditionFactory.makeConditionDate("fromDate", "thruDate", ec.user.nowTimestamp))
            .list()
    )
    return Object.assign(lib.paging(page, "runs"), {
        runs: runs.map(row =>
            Object.assign(policy.display(row), {
                asOfDateText: calendarDay(row.asOfDate),
                statusText: lib.statusText(row.statusId),
                statusColor: colors[row.statusId] || "grey-7",
                countsText:
                    count(row.dunningRunId, "DntSent") +
                    " sent, " +
                    count(row.dunningRunId, "DntPending") +
                    " to send, " +
                    count(row.dunningRunId, "DntFailed") +
                    " failed, " +
                    count(row.dunningRunId, "DntExcluded") +
                    " left out",
                runParameters: {organizationPartyId: org, dunningRunId: row.dunningRunId}
            })
        ),
        hasLevels: levels.length > 0,
        dunningCapabilities: {
            canSend: !!(scope.capabilities.arEdit || scope.capabilities.admin),
            admin: !!scope.capabilities.admin
        }
    })
}

// The organization's dunning levels in effect and its default credit policy, for the finance admin.
function policies(parameters) {
    const scope = lib.access(parameters)
    if (!scope.capabilities.admin && !scope.capabilities.systemAdmin)
        throw new Error("PERMISSION_DENIED: Finance administration is required")
    const org = policy.organization(parameters).organizationPartyId
    const dated = ec.entity.conditionFactory.makeConditionDate("fromDate", "thruDate", ec.user.nowTimestamp)
    const templates = Object.fromEntries(
        array(policy.find("moqui.basic.email.EmailTemplate").list()).map(row => [row.emailTemplateId, row.description])
    )
    const levels = array(
        policy
            .find("mantle.account.invoice.DunningLevel", {organizationPartyId: org})
            .condition(dated)
            .orderBy("daysOverdueFrom")
            .list()
    ).map(row =>
        Object.assign(policy.display(row), {
            templateText: templates[row.emailTemplateId] || row.emailTemplateId,
            excludeDisputedText: row.excludeDisputed === "N" ? "Included" : "Left out",
            dialogKey: row.dunningLevelId
        })
    )
    const defaults = array(
        policy
            .find("mantle.account.billing.CustomerCreditPolicy", {organizationPartyId: org})
            .condition("customerPartyId", "is-null", null)
            .condition(dated)
            .orderBy("-fromDate")
            .limit(1)
            .list()
    ).map(row => policy.display(row))
    const preference = policy.preference(org)
    return {
        levels,
        creditDefaults: defaults[0] || {currencyUomId: preference.baseCurrencyUomId || null, actionEnumId: "CpaHold"},
        hasCreditDefaults: defaults.length > 0
    }
}

// The organization's invoice schedules with their next day, last invoice and failure; the recurring sales orders with
// their last copy and invoice; and the last run of the create_RecurringOrders job.
function schedules(parameters) {
    const scope = receivableScope(parameters)
    const org = scope.organizationPartyId
    const query = () => {
        let found = policy.find("mantle.account.invoice.InvoiceSchedule", {organizationPartyId: org})
        if (parameters.statusId) found = found.condition("statusId", parameters.statusId)
        return found
    }
    const page = policy.lib.page(query().orderBy("nextDate,invoiceScheduleId"), parameters, "schedules", query().count())
    const list = array(page.rows)
    const ids = list.map(row => row.invoiceScheduleId)
    const occurrences = inIds("mantle.account.invoice.InvoiceScheduleOccurrence", "invoiceScheduleId", ids)
    const names = policy.lib.partyNames(list.map(row => row.partyId))
    const templates = Object.fromEntries(
        inIds(
            "mantle.account.invoice.Invoice",
            "invoiceId",
            list.map(row => row.templateInvoiceId)
        ).map(row => [row.invoiceId, row])
    )
    const intervals = {TF_wk: ["week", "weeks"], TF_mon: ["month", "months"], TF_yr: ["year", "years"]}
    const colors = {IschActive: "positive", IschPaused: "warning", IschEnded: "grey-7"}
    const scheduleRows = list.map(row => {
        const own = occurrences
            .filter(item => item.invoiceScheduleId === row.invoiceScheduleId)
            .sort((a, b) => calendarDay(b.occurrenceDate).localeCompare(calendarDay(a.occurrenceDate)))
        const last = own.find(item => item.statusId === "IsoGenerated")
        const failed = own.find(item => item.statusId === "IsoFailed")
        const template = templates[row.templateInvoiceId]
        const receivable = template?.fromPartyId === org
        const quantity = Number(row.intervalQuantity || 1)
        const unit = intervals[row.intervalUomId] || [row.intervalUomId, row.intervalUomId]
        return Object.assign(policy.display(row), {
            partyName: names[row.partyId] || row.partyId,
            directionText: receivable ? "Customer invoice" : "Supplier bill",
            cadenceText: "Every " + (quantity === 1 ? unit[0] : quantity + " " + unit[1]),
            nextDateText: row.statusId === "IschEnded" ? "" : calendarDay(row.nextDate),
            lastInvoiceId: last?.invoiceId || null,
            lastInvoiceText: last ? last.invoiceId + " · " + calendarDay(last.occurrenceDate) : "",
            lastInvoiceParameters: last ? {organizationPartyId: org, recordId: last.invoiceId} : {},
            lastInvoicePath: receivable ? "Receivables/InvoiceDetail" : "Payables/BillDetail",
            failureText: failed ? calendarDay(failed.occurrenceDate) + ": " + (failed.errorMessage || "") : "",
            statusText: lib.statusText(row.statusId),
            statusColor: colors[row.statusId] || "grey-7",
            amountText: template ? money(template.invoiceTotal, template.currencyUomId) : "",
            canPause: row.statusId === "IschActive",
            canResume: row.statusId === "IschPaused",
            dialogKey: row.invoiceScheduleId
        })
    })
    const orders = array(
        policy
            .find("mantle.order.OrderHeaderAndPart", {vendorPartyId: org})
            .condition("recurCronExpression", "is-not-null", null)
            .selectField("orderId")
            .selectField("customerPartyId")
            .selectField("recurCronExpression")
            .selectField("recurAutoInvoice")
            .selectField("lastOrderedDate")
            .selectField("grandTotal")
            .selectField("currencyUomId")
            .selectField("statusId")
            .orderBy("orderId")
            .limit(100)
            .list()
    )
    const orderNames = policy.lib.partyNames(orders.map(row => row.customerPartyId))
    const clones = inIds(
        "mantle.order.OrderHeader",
        "parentOrderId",
        orders.map(row => row.orderId)
    )
    const billings = inIds(
        "mantle.order.OrderItemBilling",
        "orderId",
        clones.map(row => row.orderId)
    )
    const orderRows = orders.map(row => {
        const copy = clones
            .filter(clone => clone.parentOrderId === row.orderId)
            .sort((a, b) => policy.ms(b.entryDate || b.orderDate) - policy.ms(a.entryDate || a.orderDate))[0]
        const billing = copy ? billings.find(item => item.orderId === copy.orderId) : null
        return {
            orderId: row.orderId,
            customerName: orderNames[row.customerPartyId] || row.customerPartyId,
            recurrenceText: row.recurCronExpression,
            autoInvoiceText: row.recurAutoInvoice === "Y" ? "Invoiced on approval" : "Not invoiced",
            lastOrderedText: row.lastOrderedDate ? policy.dateText(row.lastOrderedDate) : "",
            lastCopyId: copy?.orderId || "",
            lastInvoiceId: billing?.invoiceId || "",
            statusText: lib.statusText(row.statusId),
            total: row.grandTotal,
            currencyUomId: row.currencyUomId,
            orderParameters: {organizationPartyId: org, orderId: row.orderId}
        }
    })
    const runs = array(
        policy.find("moqui.service.job.ServiceJobRun", {jobName: "create_RecurringOrders"}).orderBy("-startTime").limit(1).list()
    )
    const run = runs[0]
    const jobResult = run
        ? {
              startText: policy.dateText(run.startTime),
              endText: run.endTime ? policy.dateText(run.endTime) : "",
              resultText: run.hasError === "Y" ? "Failed: " + String(run.errors || "").slice(0, 200) : "Finished",
              failed: run.hasError === "Y"
          }
        : {startText: "", endText: "", resultText: "The job has not run yet", failed: false}
    return Object.assign(lib.paging(page, "schedules"), {
        scheduleRows,
        orderRows,
        jobResult,
        recurringCapabilities: {canEdit: !!(scope.capabilities.arEdit || scope.capabilities.admin)}
    })
}

// The Accounting part of a user's Today: orders held for credit for a credit manager, and recurring invoices that could
// not be made for a biller, in the organizations they work in. Collection follow-ups are the user's own activities,
// which reach Today as assigned tasks.
function todayItems() {
    const items = []
    let scope
    try {
        scope = policy.access()
    } catch (error) {
        return {items, label: "Accounting"}
    }
    const orgs = scope.allowedOrganizationPartyIds
    if (!orgs.length) return {items, label: "Accounting"}
    const base = {
        workEffortId: null,
        requestId: null,
        dueDate: null,
        startDate: null,
        endDate: null,
        allDay: false,
        priority: null,
        statusId: null,
        assignees: [],
        canUpdate: false,
        hasCallLink: false
    }
    if (scope.capabilities.creditRelease) {
        const held = array(
            policy
                .find("mantle.order.OrderHeaderAndPart", {statusId: "OrderHold"})
                .condition("vendorPartyId", "in", orgs)
                .selectField("orderId")
                .selectField("vendorPartyId")
                .selectField("customerPartyId")
                .limit(200)
                .list()
        )
        const reasons = inIds("mantle.order.OrderHoldReason", "orderId", [...new Set(held.map(row => row.orderId))], {
            holdTypeEnumId: "OhtCredit"
        }).filter(row => !row.releasedDate)
        const names = policy.lib.partyNames(held.map(row => row.customerPartyId))
        for (const reason of reasons.slice(0, 20)) {
            const order = held.find(row => row.orderId === reason.orderId)
            items.push(
                Object.assign({}, base, {
                    kind: "creditHold",
                    title:
                        "Order " +
                        reason.orderId +
                        " of " +
                        (names[order.customerPartyId] || order.customerPartyId) +
                        " is held for credit",
                    url:
                        "/qapps/Accounting/Records/OrderDetail?orderId=" +
                        encodeURIComponent(reason.orderId) +
                        "&organizationPartyId=" +
                        encodeURIComponent(order.vendorPartyId)
                })
            )
        }
    }
    if (scope.capabilities.arEdit || scope.capabilities.admin) {
        const schedules = array(
            policy.find("mantle.account.invoice.InvoiceSchedule").condition("organizationPartyId", "in", orgs).limit(500).list()
        )
        const failed = inIds(
            "mantle.account.invoice.InvoiceScheduleOccurrence",
            "invoiceScheduleId",
            schedules.map(row => row.invoiceScheduleId),
            {statusId: "IsoFailed"}
        )
        for (const occurrence of failed.slice(0, 20)) {
            const schedule = schedules.find(row => row.invoiceScheduleId === occurrence.invoiceScheduleId)
            items.push(
                Object.assign({}, base, {
                    kind: "recurringFailure",
                    title:
                        "Recurring invoice " +
                        (schedule.description || schedule.invoiceScheduleId) +
                        " for " +
                        calendarDay(occurrence.occurrenceDate) +
                        " was not made",
                    url:
                        "/qapps/Accounting/Receivables/RecurringInvoices?organizationPartyId=" +
                        encodeURIComponent(schedule.organizationPartyId)
                })
            )
        }
    }
    return {items, label: "Accounting"}
}

// The drop-downs of these screens: a customer's open invoices, the organization's invoices that can be templates, the
// people who can be collectors, and the email templates.
const sources = {
    collectionInvoices: parameters => {
        const org = policy.organization(parameters).organizationPartyId
        if (!parameters.partyId) return []
        let query = policy
            .find("mantle.account.invoice.Invoice", {fromPartyId: org, toPartyId: parameters.partyId})
            .condition("statusId", "in", OPEN_INVOICE_STATUSES)
            .condition("unpaidTotal", "greater", toDecimal(0))
        const term = String(parameters.term || "").trim()
        if (term)
            query = query.condition(ec.entity.conditionFactory.makeCondition("invoiceId", "like", "%" + term + "%").ignoreCase())
        return array(query.orderBy("dueDate").limit(50).list()).map(row => ({
            value: row.invoiceId,
            label: row.invoiceId + " · " + stampDay(row.dueDate) + " · " + money(row.unpaidTotal, row.currencyUomId)
        }))
    },
    templateInvoices: parameters => {
        const org = policy.organization(parameters).organizationPartyId
        const cf = ec.entity.conditionFactory
        let query = policy
            .find("mantle.account.invoice.Invoice")
            .condition(cf.makeCondition([cf.makeCondition("fromPartyId", org), cf.makeCondition("toPartyId", org)], "or"))
            .condition("statusId", "not-equals", "InvoiceCancelled")
        const term = String(parameters.term || "").trim()
        if (term)
            query = query.condition(
                cf.makeCondition(
                    [
                        cf.makeCondition("invoiceId", "like", "%" + term + "%").ignoreCase(),
                        cf.makeCondition("description", "like", "%" + term + "%").ignoreCase()
                    ],
                    "or"
                )
            )
        const rows = array(query.orderBy("-invoiceDate").limit(30).list())
        if (parameters.selected && !rows.some(row => row.invoiceId === parameters.selected)) {
            const chosen = policy.one("mantle.account.invoice.Invoice", {invoiceId: parameters.selected})
            if (chosen && [chosen.fromPartyId, chosen.toPartyId].includes(org)) rows.push(chosen)
        }
        const names = policy.lib.partyNames(rows.map(row => (row.fromPartyId === org ? row.toPartyId : row.fromPartyId)))
        return rows
            .filter(row => names[row.fromPartyId === org ? row.toPartyId : row.fromPartyId])
            .map(row => ({
                value: row.invoiceId,
                label:
                    row.invoiceId +
                    " · " +
                    names[row.fromPartyId === org ? row.toPartyId : row.fromPartyId] +
                    (row.description ? " · " + row.description : "") +
                    " · " +
                    money(row.invoiceTotal, row.currencyUomId)
            }))
    },
    collectors: parameters => {
        const org = policy.organization(parameters).organizationPartyId
        const people = array(
            policy
                .find("mantle.party.PartyRelationship", {toPartyId: org})
                .condition("relationshipTypeEnumId", "in", ["PrtAgent", "PrtEmployee", "PrtMember"])
                .condition(ec.entity.conditionFactory.makeConditionDate("fromDate", "thruDate", ec.user.nowTimestamp))
                .list()
        ).map(row => row.fromPartyId)
        const withUsers = new Set(inIds("moqui.security.UserAccount", "partyId", [...new Set(people)]).map(row => row.partyId))
        const names = policy.lib.partyNames([...withUsers])
        const term = String(parameters.term || "")
            .trim()
            .toLocaleLowerCase()
        const options = Object.entries(names)
            .filter(([id, name]) => !term || name.toLocaleLowerCase().includes(term) || id === parameters.selected)
            .sort((a, b) => a[1].localeCompare(b[1]))
            .slice(0, 30)
            .map(([value, label]) => ({value, label}))
        return options
    },
    emailTemplates: parameters => {
        policy.organization(parameters, "admin")
        const term = String(parameters.term || "").trim()
        let query = policy.find("moqui.basic.email.EmailTemplate")
        if (term)
            query = query.condition(
                ec.entity.conditionFactory.makeCondition("description", "like", "%" + term + "%").ignoreCase()
            )
        const rows = array(query.orderBy("description").limit(30).list())
        if (parameters.selected && !rows.some(row => row.emailTemplateId === parameters.selected)) {
            const chosen = policy.one("moqui.basic.email.EmailTemplate", {emailTemplateId: parameters.selected})
            if (chosen) rows.push(chosen)
        }
        return rows.map(row => ({value: row.emailTemplateId, label: row.description || row.emailTemplateId}))
    }
}

const operations = {work, dunningRuns, policies, schedules, todayItems}
;({
    choiceNames: Object.keys(sources),
    choices: parameters => {
        if (!sources[parameters.choice]) throw new Error("Unknown collections choice " + parameters.choice)
        return {options: sources[parameters.choice](parameters)}
    },
    execute(op, parameters) {
        if (!operations[op]) throw new Error("Unknown collections screen operation " + op)
        return operations[op](parameters)
    }
})
