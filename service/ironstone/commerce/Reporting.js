// Commerce's reports (impl-commerce P11, COM-REPORTS; design-commerce §1.2 Home's period strip, §3 the Reports area;
// ReportingServices.xml): the report catalogue, OnlineSales, CartRecovery and PromotionUse, and Home's PeriodStrip. No
// Commerce analytics engine (F22): each reads its owner's query, filtered to the user's stores, and adds nothing to it.
//
// - The scope: the user's stores (Commerce.js; one asked for must be in it, RECORD_UNAVAILABLE otherwise), at most
//   storeLimit of them (the rest named as left out); the Reports area's grant for the reports (Home's strip is every
//   Commerce user's); the Mantle services check COMMERCE_VIEW and the store scope again.
// - The period: a calendar period (day, week, month, quarter, year) holding the chosen date (today by default), in the
//   user's time zone, against the one before; OnlineSales shows the last count periods. The as-of time is now: an order or
//   invoice is counted once the sales index has it.
// - Currency: amounts are never summed across currencies. Each store's rows, the totals and the top products are read per
//   currency (the stores' default currencies and those of their orders and invoices in the window), a row per currency; a
//   currency asked for narrows them.
// - Orders and net sales are the owners' metrics (X11): Sales' orders.placed is get#SalesOrderSummary (placed orders by
//   placed date; an open cart is never an order, and RecurringTemplate bases once Shop P7 marks them, F112) and
//   Accounting's revenue.invoicedNet is get#SalesInvoiceSummary's net sales (invoiced product lines less discounts); the
//   top products are get#SalesTopProduct's, each with productStoreIds (F21). Home's strip and OnlineSales' totals are one
//   function (totalsOf), so they agree.
// - CartRecovery and PromotionUse are Mantle's get#CartRecoverySummary and get#PromotionUseSummary for the period.
// - Each answer carries its as-of time, period, time zone, filters and what it left out; with output csv it is the same
//   rows, formula-like text guarded, and the export audited (org.moqui.report.ReportServices.audit#Export).
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const commerce = ec.resource.script("component://mr-boss/service/ironstone/commerce/Commerce.js")
const {find, one, denied, call, ms} = lib

const storeLimit = 25
const dayMs = 86400000
const placedStatuses = ["OrderPlaced", "OrderProcessing", "OrderApproved", "OrderSent", "OrderCompleted", "OrderHold"]
const issuedStatuses = ["InvoiceFinalized", "InvoiceSent", "InvoiceAcked", "InvoicePmtRecvd"]
const intervals = {
    d: {period: "day", label: "Day", previous: "the day before"},
    w: {period: "week", label: "Week", previous: "the week before"},
    M: {period: "month", label: "Month", previous: "the month before"},
    q: {period: "quarter", label: "Quarter", previous: "the quarter before"},
    y: {period: "year", label: "Year", previous: "the year before"}
}
const blank = value => value == null || String(value).trim() === ""
const L = text => ec.l10n.localize(text)
const unique = list => Array.from(new Set(list.filter(Boolean)))
const now = () => Number(ms(ec.user.nowTimestamp))
// a number from a decimal or number (a decimal refuses valueOf, so never Number() or + of one)
const num = value =>
    value == null || value === "" ? 0 : typeof value?.toNumber === "function" ? value.toNumber() : Number(value)
const dayOf = millis => ec.l10n.format(new Date(millis), "yyyy-MM-dd")
const dateText = millis => ec.l10n.format(new Date(millis), "d MMM yyyy")
const stampText = millis => ec.l10n.format(new Date(millis), "d MMM yyyy HH:mm")
const money = (value, currencyUomId) =>
    value == null ? "" : ec.l10n.formatCurrency(lib.money(String(value), currencyUomId), currencyUomId)
const plain = value => (value == null ? "" : String(Math.round(num(value) * 100) / 100))
const percentText = value => (value == null ? "" : ec.l10n.format(toDecimal(String(value)), "0.#") + "%")
const changeOf = (current, previous) => (previous ? Math.round((1000 * (current - previous)) / Math.abs(previous)) / 10 : null)
const storeName = productStoreId => one("mantle.product.store.ProductStore", {productStoreId})?.storeName || productStoreId || ""

// ===== scope and period =====
function scopeOf(p, options = {}) {
    const userScope = commerce.required()
    const can = userScope.capabilities
    if (options.reports && !can.reports) denied("PERMISSION_DENIED", "Commerce reports are not available to you")
    const omitted = []
    let stores
    if (!blank(p.productStoreId)) {
        const store = commerce.storeIn(userScope, String(p.productStoreId))
        if (!store) denied("RECORD_UNAVAILABLE", "Store " + p.productStoreId + " is not available")
        stores = [store]
    } else {
        stores = Array.from(
            commerce
                .storeFind(userScope)
                .orderBy("storeName")
                .orderBy("productStoreId")
                .limit(storeLimit + 1)
                .list()
        )
        if (stores.length > storeLimit) {
            stores = stores.slice(0, storeLimit)
            omitted.push(L("More than") + " " + storeLimit + " " + L("stores: choose one to read the others."))
        }
    }
    return {userScope, can, stores, storeIds: stores.map(store => store.productStoreId), omitted}
}
// The calendar period holding the chosen date and the ones before it: each {from, thru, key, text}, newest first.
function periodsOf(p, count) {
    const interval = Object.hasOwn(intervals, p.interval) ? p.interval : "M"
    let at = now()
    if (!blank(p.periodDate)) {
        const text = String(p.periodDate).trim()
        at = /^\d{4}-\d{2}-\d{2}/.test(text)
            ? Number(ms(ec.l10n.parseTimestamp(text.slice(0, 10), "yyyy-MM-dd"))) + 12 * 3600000
            : Number(ms(p.periodDate))
        if (!Number.isFinite(at)) denied("PERIOD_INVALID", "Choose a valid date")
        if (at > now()) at = now()
    }
    const periods = []
    for (let offset = 0; offset > -count - 1; offset--) {
        const range = ec.user.getPeriodRange(intervals[interval].period, String(offset), String(at))
        const from = Number(ms(range[0])),
            thru = Number(ms(range[1]))
        const text = interval === "d" ? dateText(from) : dateText(from) + " – " + dateText(Math.max(from, thru - dayMs))
        periods.push({from, thru, key: dayOf(from), text})
    }
    return {interval, label: intervals[interval].label, at, periods}
}
// The currencies of the stores' sales in [from, thru): their default currencies, their placed orders' and their issued
// invoices'; one asked for alone. No store, no currency: Mantle's summaries without productStoreIds would read the
// organizations' sales (or refuse a reader without ACCOUNTING_VIEW), not the stores'.
function currenciesOf(scope, p, from, thru) {
    if (!scope.storeIds.length) return []
    if (!blank(p.currencyUomId)) {
        const currencyUomId = String(p.currencyUomId)
        if (!one("moqui.basic.Uom", {uomId: currencyUomId})) denied("VALUE_INVALID", "Choose a valid currency")
        return [currencyUomId]
    }
    const found = scope.stores.map(store => store.defaultCurrencyUomId)
    const distinct = (entity, dateField, statuses) =>
        Array.from(
            find(entity)
                .condition("productStoreId", "in", scope.storeIds)
                .condition("statusId", "in", statuses)
                .condition(dateField, ">=", new Date(from))
                .condition(dateField, "<", new Date(thru))
                .selectField("currencyUomId")
                .distinct(true)
                .limit(20)
                .list()
        ).map(row => row.currencyUomId)
    found.push(...distinct("mantle.order.OrderHeader", "placedDate", placedStatuses))
    found.push(...distinct("mantle.account.invoice.Invoice", "invoiceDate", issuedStatuses))
    return unique(found).sort()
}
function frame(scope, periodInfo, filters, omitted) {
    const newest = periodInfo.periods[0]
    return {
        asOf: new Date(now()),
        asOfText: stampText(now()),
        periodText: newest.text + " " + L("against") + " " + intervals[periodInfo.interval].previous,
        timeZoneText: String(ec.user.timeZone?.getID?.() || ec.user.timeZone || ""),
        filtersText: [
            L("Stores") +
                ": " +
                (scope.stores.length ? scope.stores.map(store => store.storeName || store.productStoreId).join(", ") : L("none")),
            ...filters.filter(Boolean)
        ].join(" · "),
        omittedText: unique(omitted).join(" "),
        complete: !omitted.length
    }
}

// ===== the owners' metrics =====
// The summaries of one currency over the periods (newest first), for the stores: Sales' orders and Accounting's invoices
// by the period's key; a period without sales is zero. A summary that cannot be read (no search backend) is named.
function summariesOf(storeIds, currencyUomId, periodInfo, omitted) {
    const count = periodInfo.periods.length - 1
    const common = {
        interval: periodInfo.interval,
        intervalCount: count,
        thruDate: new Date(periodInfo.periods[0].thru - 1),
        dateFormat: "yyyy-MM-dd",
        productStoreIds: storeIds,
        currencyUomIds: [currencyUomId]
    }
    const orders = call("mantle.sales.SalesReportServices.get#SalesOrderSummary", common)
    const invoices = call("mantle.sales.SalesReportServices.get#SalesInvoiceSummary", common)
    if (orders.salesOrderSummaryList == null || invoices.salesInvoiceSummaryList == null)
        omitted.push(L("Sales are not indexed here (no search backend): orders and net sales are not shown."))
    const byKey = list =>
        Object.fromEntries(
            Array.from(list || [])
                .filter(line => /^\d{4}-\d{2}-\d{2}$/.test(line.dateKey))
                .map(line => [line.dateKey, line])
        )
    const orderLines = byKey(orders.salesOrderSummaryList)
    const invoiceLines = byKey(invoices.salesInvoiceSummaryList)
    return periodInfo.periods.map(period => {
        const order = orderLines[period.key] || {}
        const invoice = invoiceLines[period.key] || {}
        const orderCount = num(order.orderCount)
        const netSales = num(order.netSales)
        return {
            periodKey: period.key,
            periodText: period.text,
            currencyUomId,
            orderCount,
            itemCount: num(order.productQuantityTotal),
            grossSales: num(order.productSaleTotal),
            discountTotal: num(order.discountTotal),
            netSales,
            invoicedNet: num(invoice.netSales),
            averageOrder: orderCount ? netSales / orderCount : null
        }
    })
}
function topProductsOf(storeIds, currencyUomId, periodInfo) {
    const found = call("mantle.sales.SalesReportServices.get#SalesTopProduct", {
        interval: periodInfo.interval,
        poffset: 0,
        thruDate: new Date(periodInfo.periods[0].thru - 1),
        productStoreIds: storeIds,
        currencyUomIds: [currencyUomId],
        topLimit: 5
    })
    return Array.from(found.topProductList || []).map(line => {
        const product = one("mantle.product.Product", {productId: line.productId})
        return {
            currencyUomId,
            productId: line.productId,
            productName: product?.productName || line.productId,
            pseudoId: product?.pseudoId || line.productId,
            quantity: num(line.totalQuantity),
            sales: num(line.totalSales),
            salesText: money(num(line.totalSales), currencyUomId)
        }
    })
}
const shaped = row =>
    Object.assign(row, {
        grossText: money(row.grossSales, row.currencyUomId),
        discountText: money(row.discountTotal, row.currencyUomId),
        netText: money(row.netSales, row.currencyUomId),
        invoicedText: money(row.invoicedNet, row.currencyUomId),
        averageText: row.averageOrder == null ? "" : money(row.averageOrder, row.currencyUomId)
    })
// The totals of the stores in scope per currency over the periods: Home's strip and OnlineSales' totals both read it.
function totalsOf(scope, currencies, periodInfo, omitted) {
    const out = {}
    for (const currencyUomId of currencies) out[currencyUomId] = summariesOf(scope.storeIds, currencyUomId, periodInfo, omitted)
    return out
}

// ===== get#OnlineSales (design §3 OnlineSales) =====
const salesColumns = [
    {field: "storeName", title: "Store"},
    {field: "periodText", title: "Period"},
    {field: "currencyUomId", title: "Currency"},
    {field: "orderCount", title: "Orders", number: true},
    {field: "itemCount", title: "Items", number: true},
    {field: "grossCsv", title: "Gross", number: true},
    {field: "discountCsv", title: "Discounts", number: true},
    {field: "netCsv", title: "Net sales", number: true},
    {field: "invoicedCsv", title: "Net invoiced", number: true},
    {field: "averageCsv", title: "Average order", number: true}
]
const productColumns = [
    {field: "currencyUomId", title: "Currency"},
    {field: "pseudoId", title: "Product"},
    {field: "productName", title: "Name"},
    {field: "quantity", title: "Quantity", number: true},
    {field: "salesCsv", title: "Sales", number: true}
]
function onlineSales(p) {
    const scope = scopeOf(p, {reports: true})
    const count = Math.min(24, Math.max(1, Math.round(num(p.periodCount) || 6)))
    const periodInfo = periodsOf(p, count)
    const omitted = scope.omitted.slice()
    const oldest = periodInfo.periods[periodInfo.periods.length - 1]
    const currencies = currenciesOf(scope, p, oldest.from, periodInfo.periods[0].thru)
    const shown = periodInfo.periods.slice(0, count)
    const storeRows = []
    for (const store of scope.stores)
        for (const currencyUomId of currencies) {
            const lines =
                scope.stores.length === 1 ? null : summariesOf([store.productStoreId], currencyUomId, periodInfo, omitted)
            if (lines)
                for (const line of lines.slice(0, count))
                    if (line.orderCount || line.invoicedNet)
                        storeRows.push(
                            shaped(
                                Object.assign(line, {
                                    productStoreId: store.productStoreId,
                                    storeName: store.storeName || store.productStoreId
                                })
                            )
                        )
        }
    const totals = totalsOf(scope, currencies, periodInfo, omitted)
    const totalRows = []
    for (const currencyUomId of currencies) {
        const lines = totals[currencyUomId]
        lines.slice(0, count).forEach((line, index) => {
            const previous = lines[index + 1]
            totalRows.push(
                shaped(
                    Object.assign(line, {
                        productStoreId: null,
                        storeName:
                            scope.stores.length === 1
                                ? scope.stores[0].storeName || scope.stores[0].productStoreId
                                : L("All these stores"),
                        orderChange: changeOf(line.orderCount, previous.orderCount),
                        netChange: changeOf(line.invoicedNet, previous.invoicedNet)
                    })
                )
            )
        })
    }
    // one store: its totals are its rows
    const rows = scope.stores.length === 1 ? totalRows : storeRows
    const topProducts = currencies.flatMap(currencyUomId => topProductsOf(scope.storeIds, currencyUomId, periodInfo))
    const answer = Object.assign(
        frame(scope, periodInfo, [!blank(p.currencyUomId) ? L("Currency") + ": " + p.currencyUomId : null], omitted),
        {
            intervalLabel: periodInfo.label,
            periodCount: count,
            periodsText: shown[shown.length - 1].text.split(" – ")[0] + " – " + shown[0].text.split(" – ").pop(),
            currencies,
            severalStores: scope.stores.length > 1,
            rows,
            totalRows,
            topProducts
        }
    )
    for (const row of rows.concat(totalRows))
        Object.assign(row, {
            grossCsv: plain(row.grossSales),
            discountCsv: plain(row.discountTotal),
            netCsv: plain(row.netSales),
            invoicedCsv: plain(row.invoicedNet),
            averageCsv: row.averageOrder == null ? "" : plain(row.averageOrder),
            orderChangeText: row.orderChange == null ? "" : percentText(row.orderChange),
            netChangeText: row.netChange == null ? "" : percentText(row.netChange)
        })
    for (const row of topProducts) row.salesCsv = plain(row.sales)
    const tables = [
        {columns: salesColumns, list: scope.stores.length === 1 ? totalRows : storeRows.concat(totalRows)},
        {columns: productColumns, list: topProducts}
    ]
    return exported(p, "OnlineSales", "Online sales", answer, tables)
}

// ===== Home's PeriodStrip (design §1.2, §3 Home) =====
// The chosen period's orders and net sales of the stores in scope against the one before, per currency, and its top
// product: the totals OnlineSales shows for the same stores and period (totalsOf).
function homePeriod(p) {
    const scope = scopeOf(p)
    const periodInfo = periodsOf(p, 1)
    const omitted = scope.omitted.slice()
    const current = periodInfo.periods[0]
    const currencies = currenciesOf(scope, p, periodInfo.periods[1].from, current.thru)
    const totals = totalsOf(scope, currencies, periodInfo, omitted)
    const cards = currencies.map(currencyUomId => {
        const [line, previous] = totals[currencyUomId]
        const top = topProductsOf(scope.storeIds, currencyUomId, periodInfo)[0] || null
        const orderChange = changeOf(line.orderCount, previous.orderCount)
        const netChange = changeOf(line.invoicedNet, previous.invoicedNet)
        return {
            currencyUomId,
            orderCount: line.orderCount,
            previousOrderCount: previous.orderCount,
            invoicedNet: line.invoicedNet,
            previousInvoicedNet: previous.invoicedNet,
            ordersText: String(line.orderCount),
            ordersDelta: orderChange == null ? "" : (orderChange >= 0 ? "+" : "") + percentText(orderChange),
            netText: money(line.invoicedNet, currencyUomId),
            netDelta: netChange == null ? "" : (netChange >= 0 ? "+" : "") + percentText(netChange),
            previousText:
                L("Before") +
                " (" +
                periodInfo.periods[1].text +
                "): " +
                previous.orderCount +
                " " +
                L("orders") +
                ", " +
                money(previous.invoicedNet, currencyUomId) +
                " " +
                L("net sales"),
            topProductText: top ? top.productName : L("None yet"),
            topProductDetail: top ? top.salesText : ""
        }
    })
    return {
        periodText: current.text,
        previousText: periodInfo.periods[1].text,
        intervalLabel: periodInfo.label,
        currencies,
        cards,
        omittedText: unique(omitted).join(" "),
        canReports: !!scope.can.reports
    }
}

// ===== get#CartRecovery and get#PromotionUse (design §3) =====
const recoveryColumns = [
    {field: "storeName", title: "Store"},
    {field: "currencyUomId", title: "Currency"},
    {field: "opened", title: "Carts opened", number: true},
    {field: "abandoned", title: "Abandoned", number: true},
    {field: "signedIn", title: "Signed in (could be reminded)", number: true},
    {field: "sends", title: "Recovery sends", number: true},
    {field: "delivered", title: "Delivered", number: true},
    {field: "recovered", title: "Recovered orders", number: true},
    {field: "recoveredCsv", title: "Recovered value", number: true},
    {field: "placed", title: "Placed", number: true}
]
function singlePeriod(p) {
    const periodInfo = periodsOf(p, 1)
    return {periodInfo, current: periodInfo.periods[0]}
}
function cartRecovery(p) {
    const scope = scopeOf(p, {reports: true})
    const {periodInfo, current} = singlePeriod(p)
    const omitted = scope.omitted.slice()
    const found = scope.storeIds.length
        ? call("mantle.order.StoreOperationsServices.get#CartRecoverySummary", {
              productStoreIds: scope.storeIds,
              fromDate: new Date(current.from),
              thruDate: new Date(current.thru)
          })
        : {rows: [], totals: []}
    if (found.truncated) omitted.push(L("More than 5000 carts in this period; the newest 5000 are counted."))
    const keep = row => blank(p.currencyUomId) || row.currencyUomId === String(p.currencyUomId)
    const shape = (row, name) =>
        Object.assign({}, row, {
            storeName: name,
            recoveredText: money(row.recoveredValue, row.currencyUomId),
            recoveredCsv: plain(row.recoveredValue)
        })
    const rows = Array.from(found.rows || [])
        .filter(keep)
        .map(row => shape(row, row.storeName))
    const totalRows = Array.from(found.totals || [])
        .filter(keep)
        .map(row => shape(row, L("All these stores")))
    const answer = Object.assign(
        frame(scope, periodInfo, [!blank(p.currencyUomId) ? L("Currency") + ": " + p.currencyUomId : null], omitted),
        {
            periodText: current.text,
            rows,
            totalRows
        }
    )
    return exported(p, "CartRecovery", "Cart recovery", answer, [{columns: recoveryColumns, list: rows.concat(totalRows)}])
}
const promotionColumns = [
    {field: "storeName", title: "Store"},
    {field: "promotionName", title: "Promotion"},
    {field: "promoCode", title: "Code"},
    {field: "currencyUomId", title: "Currency"},
    {field: "orderCount", title: "Orders", number: true},
    {field: "useCount", title: "Uses", number: true},
    {field: "discountCsv", title: "Discount", number: true},
    {field: "netCsv", title: "Net sales of those orders", number: true},
    {field: "usesLeftText", title: "Uses left"}
]
function promotionUse(p) {
    const scope = scopeOf(p, {reports: true})
    const {periodInfo, current} = singlePeriod(p)
    const omitted = scope.omitted.slice()
    const found = scope.storeIds.length
        ? call("mantle.product.StorePromotionServices.get#PromotionUseSummary", {
              productStoreIds: scope.storeIds,
              storePromotionId: blank(p.storePromotionId) ? null : String(p.storePromotionId),
              fromDate: new Date(current.from),
              thruDate: new Date(current.thru)
          })
        : {rows: [], totals: []}
    if (found.truncated) omitted.push(L("More than 5000 promotion uses in this period; the first 5000 are counted."))
    const keep = row => blank(p.currencyUomId) || row.currencyUomId === String(p.currencyUomId)
    const left = row =>
        [
            row.promotionUsesLeft == null ? null : L("promotion") + " " + row.promotionUsesLeft,
            row.codeUsesLeft == null ? null : L("code") + " " + row.codeUsesLeft
        ]
            .filter(Boolean)
            .join(", ") || L("No limit")
    const shape = row =>
        Object.assign({}, row, {
            storeName: row.productStoreId ? storeName(row.productStoreId) : L("All these stores"),
            promoCode: row.promoCode || (row.productStoreId ? L("Automatic") : ""),
            discountText: money(row.discount, row.currencyUomId),
            netText: money(row.netSales, row.currencyUomId),
            discountCsv: plain(row.discount),
            netCsv: plain(row.netSales),
            usesLeftText: row.productStoreId ? left(row) : ""
        })
    const rows = Array.from(found.rows || [])
        .filter(keep)
        .map(shape)
    const totalRows = Array.from(found.totals || [])
        .filter(keep)
        .map(shape)
    const filters = [
        !blank(p.storePromotionId) ? L("Promotion") + ": " + p.storePromotionId : null,
        !blank(p.currencyUomId) ? L("Currency") + ": " + p.currencyUomId : null
    ]
    const answer = Object.assign(frame(scope, periodInfo, filters, omitted), {periodText: current.text, rows, totalRows})
    return exported(p, "PromotionUse", "Promotion use", answer, [{columns: promotionColumns, list: rows.concat(totalRows)}])
}

// ===== the export =====
// A cell for a spreadsheet: a number column's value as a plain number; other text a spreadsheet would read as a formula
// (starting =, +, -, @, a tab or a carriage return) behind an apostrophe; quoted when it holds a comma, quote or line break.
function csvCell(value, numeric) {
    let text = value == null ? "" : String(value)
    if (!(numeric && /^-?\d+(\.\d+)?$/.test(text)) && /^[=+\-@\t\r]/.test(text)) text = "'" + text
    return /[",\n\r]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text
}
function csvOf(title, answer, tables) {
    const lines = [
        [title],
        [L("Period"), answer.periodText + " (" + answer.timeZoneText + ")"],
        [L("Filters"), answer.filtersText],
        [L("As of"), answer.asOfText],
        [L("Left out"), answer.omittedText || L("Nothing")]
    ].map(cells => cells.map(cell => csvCell(cell, false)).join(","))
    for (const {columns, list} of tables) {
        lines.push("")
        lines.push(columns.map(column => csvCell(L(column.title), false)).join(","))
        for (const row of list) lines.push(columns.map(column => csvCell(row[column.field], !!column.number)).join(","))
    }
    return lines.join("\r\n") + "\r\n"
}
// With output csv: the report's CSV and file name, the export audited with its row count.
function exported(p, reportId, title, answer, tables) {
    if (p.output !== "csv") return answer
    const rowCount = tables.reduce((sum, table) => sum + table.list.length, 0)
    ec.service
        .sync()
        .name("org.moqui.report.ReportServices.audit#Export")
        .parameters({kind: "commerce", format: "csv", definitionId: "Commerce." + reportId, rowCount})
        .call()
    return Object.assign(answer, {csvText: csvOf(L(title), answer, tables), fileName: reportId + "-" + dayOf(now()) + ".csv"})
}

// ===== get#ReportCatalogue (design §3; Insights' registration later, Z10) =====
// The reports Commerce owns, each in Insights' catalog contract (an entry id, its owner, title, description, route,
// parameters, export) for a user of the Reports area; ChannelHealth comes with P14. The registered definitions of report/
// (the store operations dashboard and the alert templates) are the framework's, opened from Insights.
const catalogueEntries = [
    {
        entryId: "Commerce.OnlineSales",
        title: "Online sales",
        description:
            "Orders, items, gross, discounts, net sales, net invoiced and average order by store, period and currency; top products.",
        path: "Reports/OnlineSales",
        parameters: "store, period, periods shown, currency"
    },
    {
        entryId: "Commerce.CartRecovery",
        title: "Cart recovery",
        description:
            "Carts opened, abandoned, signed in, recovery sends, delivered, recovered orders and their value, per currency.",
        path: "Reports/CartRecovery",
        parameters: "store, period, currency"
    },
    {
        entryId: "Commerce.PromotionUse",
        title: "Promotion use",
        description: "Orders, uses, discount and the net sales of those orders by promotion and code, with the uses left.",
        path: "Reports/PromotionUse",
        parameters: "store, promotion, period, currency"
    }
]
function catalogue() {
    const userScope = commerce.required()
    if (!userScope.capabilities.reports) return {reports: []}
    return {
        reports: catalogueEntries.map(entry => ({
            entryId: entry.entryId,
            ownerApp: "Commerce",
            title: L(entry.title),
            description: L(entry.description),
            path: entry.path,
            url: "/qapps/Commerce/" + entry.path,
            parameters: entry.parameters,
            exports: true,
            exportText: L("CSV")
        }))
    }
}

const operations = {catalogue, onlineSales, homePeriod, cartRecovery, promotionUse}
;({
    intervals,
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Commerce report operation " + op)
        return operations[op](parameters || {})
    }
})
