// Insights' read-only record contexts (ironstone.insights.DrillServices get#Record; design-insights §10; design-crosscut §3.2 to §3.16, the
// Insights rows; impl-insights P6, F16): the record behind a value of a report, under Insights/Records on the shared record
// screens. Insights holds no domain permission, so what it shows of a record is what the admitted datasets the viewer reads say
// of it: each source below is read through the report engine as the viewer (query#Documents), so the dataset's admission and
// its row filter (the viewer's organizations) decide, and only the named columns are shown, never a cost or the whole
// document. Beside them are the owning apps' own screens of the record, each only where its route opens to the viewer (the
// owner's authorization, read as Admin's destinationOpens reads it): every operational action is there, never here, and a
// link adds no right. A record no source describes for the viewer answers as not available, whether or not it exists.
// The mount itself (screen/Insights/Records.xml) serves nothing below a record screen but this context: no transition of the
// shared screen and no owner's tab.
//
// The return to the report (design §10: permitted definition and filters, never frames or authority) is the drill's own
// parameters, kept only when they name a definition.
const insights = ec.resource.script("component://mr-boss/service/ironstone/insights/Insights.js")
const admin = ec.resource.script("component://mr-boss/service/ironstone/admin/Admin.js")
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const {denied} = lib

const ENGINE = "org.moqui.report.ReportServices."
// the widest range the engine reads in one query, so a record of any date is found
const everything = {from: "now-3650d", thru: "now+1d"}
const pageSize = 50

// Each record screen: its label, the request parameter that holds the record's key, the admitted sources that describe the
// record (the dataset, the field that holds the key, the columns shown, a unit field for amounts) and the owners' screens of
// it (a route under the owner's app and the parameter it takes).
const amount = (field, label, unitField) => ({field, label, unitField, align: "right"})
const orderParts = {
    datasetId: "mantle-sales-orders",
    title: "Order parts",
    columns: [
        {field: "orderPartSeqId", label: "Part"},
        {field: "placedDate", label: "Placed", date: true},
        {field: "statusId", label: "Order status"},
        {field: "partStatusId", label: "Part status"},
        {field: "productStoreId", label: "Store"},
        {field: "salesChannelEnumId", label: "Channel"},
        amount("partTotal", "Part total", "currencyUomId")
    ]
}
const orderItems = {
    datasetId: "mantle-sales-items",
    title: "Items",
    columns: [
        {field: "orderItemSeqId", label: "Item"},
        {field: "pseudoId", label: "Product"},
        {field: "itemTypeEnumId", label: "Type"},
        {field: "orderQuantity", label: "Quantity", align: "right"},
        amount("unitAmount", "Unit price", "currencyUomId"),
        amount("itemSaleTotal", "Total", "currencyUomId")
    ]
}
const stock = {
    datasetId: "mantle-inventory",
    title: "Stock",
    columns: [
        {field: "productId", label: "Product"},
        {field: "facilityId", label: "Facility"},
        {field: "statusId", label: "Status"},
        {field: "receivedDate", label: "Received", date: true},
        {field: "quantityOnHandTotal", label: "On hand", align: "right"},
        {field: "availableToPromiseTotal", label: "Available", align: "right"}
    ]
}
const clocks = {
    datasetId: "boss-service-clocks",
    title: "Service clocks",
    columns: [
        {field: "clockEnumId", label: "Clock"},
        {field: "stateEnumId", label: "State"},
        {field: "priorityBandEnumId", label: "Priority"},
        {field: "startDate", label: "Started", date: true},
        {field: "dueDate", label: "Due", date: true},
        {field: "actualDate", label: "Met", date: true},
        {field: "breachedDate", label: "Breached", date: true}
    ]
}
const source = (base, keyField, title) => Object.assign({}, base, {keyField}, title ? {title} : {})
const recordTypes = {
    OrderDetail: {
        label: "Order",
        parameter: "orderId",
        sources: [source(orderParts, "orderId"), source(orderItems, "orderId")],
        owners: [
            {label: "Commerce", path: "Commerce/Orders/OrderDetail", parameter: "orderId"},
            {label: "Customer Service", path: "CustomerService/Orders/OrderDetail", parameter: "orderId"},
            {label: "Accounting", path: "Accounting/Records/OrderDetail", parameter: "orderId"},
            {label: "Warehouse", path: "Warehouse/Orders/OrderDetail", parameter: "orderId"},
            {label: "Purchasing", path: "Purchasing/Orders/OrderDetail", parameter: "orderId"}
        ]
    },
    Customer360: {
        label: "Customer",
        parameter: "customerPartyId",
        sources: [source(orderParts, "customerPartyId", "Orders")],
        owners: [
            {label: "Customer Service", path: "CustomerService/Customers/Customer360", parameter: "customerPartyId"},
            {label: "Commerce", path: "Commerce/Customers/Customer360", parameter: "customerPartyId"},
            {label: "Accounting", path: "Accounting/Receivables/Customer360", parameter: "customerPartyId"}
        ]
    },
    Supplier360: {
        label: "Supplier",
        parameter: "vendorPartyId",
        sources: [],
        owners: [
            {label: "Purchasing", path: "Purchasing/Suppliers/Supplier360", parameter: "vendorPartyId"},
            {label: "Products", path: "Products/SupplierPrices/Supplier360", parameter: "vendorPartyId"}
        ]
    },
    Product360: {
        label: "Product",
        parameter: "productId",
        sources: [source(stock, "productId"), source(orderItems, "productId", "Order items")],
        owners: [
            {label: "Products", path: "Products/Products/Product360", parameter: "productId"},
            {label: "Commerce", path: "Commerce/Merchandising/Product360", parameter: "productId"},
            {label: "Warehouse", path: "Warehouse/Inventory/Product360", parameter: "productId"}
        ]
    },
    RequestDetail: {
        label: "Request",
        parameter: "requestId",
        sources: [source(clocks, "requestId")],
        owners: [
            {label: "Customer Service", path: "CustomerService/Cases/CaseDetail", parameter: "requestId"},
            {label: "Projects", path: "Projects/Requests/RequestDetail", parameter: "requestId"}
        ]
    },
    WorkItemDetail: {
        label: "Work item",
        parameter: "workEffortId",
        sources: [],
        owners: [{label: "Projects", path: "Projects/WorkItems/WorkItemDetail", parameter: "workEffortId"}]
    },
    ShipmentDetail: {
        label: "Shipment",
        parameter: "shipmentId",
        sources: [],
        owners: [
            {label: "Warehouse", path: "Warehouse/Shipping/ShipmentDetail", parameter: "shipmentId"},
            {label: "Accounting", path: "Accounting/Records/ShipmentDetail", parameter: "shipmentId"}
        ]
    },
    FacilityDetail: {
        label: "Facility",
        parameter: "facilityId",
        sources: [source(stock, "facilityId"), source(orderParts, "facilityId", "Order parts shipping from here")],
        owners: [
            {label: "Warehouse", path: "Warehouse/Locations/FacilityDetail", parameter: "facilityId"},
            {label: "Manufacturing", path: "Manufacturing/WorkCenters/FacilityDetail", parameter: "facilityId"}
        ]
    },
    EquipmentDetail: {
        label: "Equipment",
        parameter: "assetId",
        sources: [],
        owners: [
            {label: "Accounting", path: "Accounting/FixedAssets/EquipmentDetail", parameter: "assetId"},
            {label: "Manufacturing", path: "Manufacturing/WorkCenters/EquipmentDetail", parameter: "assetId"},
            {label: "Warehouse", path: "Warehouse/Locations/EquipmentDetail", parameter: "assetId"}
        ]
    },
    InvoiceDetail: {
        label: "Invoice",
        parameter: "invoiceId",
        sources: [],
        owners: [
            {label: "Accounting", path: "Accounting/Receivables/InvoiceDetail", parameter: "invoiceId"},
            {label: "Projects", path: "Projects/Billing/InvoiceDetail", parameter: "invoiceId"}
        ]
    }
}

function cell(column, body) {
    const value = body[column.field]
    if (value == null || value === "") return ""
    if (column.date) {
        const millis = /^-?\d+$/.test(String(value)) ? Number(value) : Date.parse(String(value))
        return Number.isNaN(millis) ? String(value) : ec.l10n.format(new Date(millis), "yyyy-MM-dd")
    }
    if (column.unitField) return String(value) + (body[column.unitField] ? " " + body[column.unitField] : "")
    return Array.isArray(value) ? value.join(", ") : String(value)
}
// One source read as the viewer: its rows of the record, or null when the viewer does not read the dataset (omitted, never
// named). Any other failure is the source's own notice; the others go on.
function readSource(definition, recordId) {
    ec.message.pushErrors()
    try {
        const found = insights.asViewerApart(
            ENGINE + "query#Documents",
            Object.assign(
                {
                    datasetId: definition.datasetId,
                    query: {field: {name: definition.keyField, op: "eq", value: recordId}},
                    pageSize
                },
                everything
            )
        )
        const hits = Array.from(found.hits || [])
        return {
            title: definition.title,
            total: Number(found.total || hits.length),
            bounded: Number(found.total || 0) > hits.length,
            rows: hits.map(hit => ({
                title: hit.documentTitle || hit.id,
                cells: definition.columns.map(column => ({label: column.label, text: cell(column, hit.body || {})})),
                text: definition.columns
                    .map(column => [column.label, cell(column, hit.body || {})])
                    .filter(([, text]) => text !== "")
                    .map(([label, text]) => label + " " + text)
                    .join(" · ")
            }))
        }
    } catch (error) {
        const message = String(error.message || error)
        if (/not authorized|may not read|is not admitted|ROWS_RESTRICTED/i.test(message)) return null
        ec.logger.error("Insights record source " + definition.datasetId + " failed: " + message)
        return {title: definition.title, failed: true, total: 0, rows: []}
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}

// The return to the report (design §10): the drill's own parameters, each bounded; a return names a definition. People's
// Employee360 under Insights/Records reads it too (impl-people P2), as it shows the person without a dataset of its own.
function returnOf(p) {
    const returnParameters = {}
    for (const name of [
        "definitionId",
        "panelId",
        "queryReference",
        "organizationPartyId",
        "from",
        "thru",
        "breakdownDimension",
        "bucketsJson",
        "variablesJson"
    ])
        if (p[name] != null && String(p[name]) !== "") returnParameters[name] = String(p[name]).slice(0, 4000)
    return returnParameters
}

// get#Record: the record as its admitted sources show it to the viewer, the owners' screens of it they may open, and the
// return to the report.
function record(p) {
    const userScope = insights.required()
    if (!userScope.capabilities.view) denied("INSIGHTS_VIEW_REQUIRED", "A record behind a report needs Insights read")
    const type = recordTypes[p.recordType]
    if (!type) denied("RECORD_UNAVAILABLE", "This record is not available")
    const recordId = String(p.recordId || "")
    if (!recordId || recordId.length > 80) denied("RECORD_UNAVAILABLE", "This record is not available")
    const sources = []
    for (const definition of type.sources) {
        const read = readSource(definition, recordId)
        if (read && (read.rows.length || read.failed)) sources.push(read)
    }
    const grants = insights.grants()
    // the owners' screens open by the owner's own authorization; they are offered only for a record a source showed, so a
    // key the viewer cannot read is not confirmed by a link
    const found = sources.some(read => read.rows.length > 0)
    const owners = found
        ? type.owners
              .filter(owner => admin.destinationOpens(grants, owner.path))
              .map(owner => ({
                  label: "Open in " + owner.label,
                  url: "/qapps/" + owner.path + "?" + owner.parameter + "=" + encodeURIComponent(recordId)
              }))
        : []
    const returnParameters = returnOf(p)
    return {
        recordFound: found,
        recordLabel: type.label,
        recordId,
        sources,
        owners,
        hasReturn: !!returnParameters.definitionId,
        returnParameters
    }
}

// get#RecordPanelAccess (P12, the P6 mount lesson): whether the viewer's own grants open Commons. The Chatter and RecordFiles
// panels every app root mounts are served under the Insights root only to such a user (Insights.xml's always-actions), who
// reaches the same transitions in Commons under the same filters; no Insights screen offers a note, message or file, so the
// Insights root's inheritable grant opens none of their writes to a user given Insights without Commons. False for a caller
// without Insights read.
function recordPanelAccess() {
    try {
        insights.required()
        return {opens: admin.destinationOpens(insights.grants(), "Commons")}
    } catch (error) {
        return {opens: false}
    }
}

const operations = {record, recordPanelAccess}
;({
    recordTypes,
    returnOf,
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Insights record operation " + op)
        return operations[op](parameters)
    }
})
