// The terminal twins of the IronStone screens (style-guide §4.8, §8.1): every screen under the Commons, Comms and Insights
// roots and in screen/Shared renders in the tui render mode as a document of the TUI model (v 1) with no error node, on the
// demo records AppStructure uses; the twins of the custom screens show their data (a list's rows, the Inbox's threads).
// A .qvue screen's twin is its Name.tui.json, mostly a dynamicContainer of a hidden plain-XML twin screen beside it.
// Run: ./moq test mr-boss --spec TuiRender
const base = "component://mr-boss/screen"
const webroot = "component://webroot/screen/webroot.xml"
let screens, accountingFixtures, warehouseFixtures

// [root screen location, path under it] of every screen file under the roots and in screen/Shared, as AppStructure finds them
function findScreenFiles(appList) {
    const found = []
    for (const app of appList) {
        const files = []
        ec.resource.getLocationReference(`${base}/${app}.xml`).walkChildTree(files, null)
        for (const file of files) if (file.path !== app && file.location.endsWith(".xml")) found.push([`${base}/${app}.xml`, file.path.substring(app.length + 1)])
    }
    for (const fileRef of ec.resource.getLocationReference(`${base}/Shared`).getDirectoryEntries())
        if (fileRef.location.endsWith(".xml")) found.push([fileRef.location, ""])
    return found
}

// the id parameters of the screens that open on one demo record (AppStructure's demoRecords)
const demoParameters = {
    "Products/Categories/CategoryDetail/Content": {productCategoryId:"BOSS_PRD_CAT"},
    "CategoryContent": {productCategoryId:"BOSS_PRD_CAT"},
    "DocumentDetail": {productId:"BOSS_PRD_OWN",productContentId:"BOSS_CONTENT_SAMPLE"},
    "InventoryValuation": {productId:"BOSS_PRD_OWN",productStandardCostId:"BOSS_COST_SAMPLE"},
    "BillOfMaterialsDetail": {productId:"DEMO_1_1",organizationPartyId:"ORG_ZIZI_RETAIL"},
    "BillOfMaterialsExplosion": {productId:"DEMO_1_1",organizationPartyId:"ORG_ZIZI_RETAIL"},
    "BillOfMaterialsCompare": {productId:"DEMO_1_1",organizationPartyId:"ORG_ZIZI_RETAIL"},
    "WhereUsed": {productId:"DEMO_1_1",organizationPartyId:"ORG_ZIZI_RETAIL"},
    "RoutingDetail": {productId:"DEMO_1_1",organizationPartyId:"ORG_ZIZI_RETAIL"},

    "InventoryAvailability": {productId:"BOSS_PRD_OWN",facilityId:"BOSS_PRD_WH"},
    "PriceListDetail": {priceListId:"BOSS_PRICE_LIST"},
    "Supplier360": {vendorPartyId:"BOSS_PRD_SUPPLIER",organizationPartyId:"ORG_ZIZI_SERVICES"},
    "ShipmentDetail": {shipmentId:"BOSS_ACCT_NO_SHIPMENT"},
    "EquipmentDetail": {assetId:"BOSS_ACCT_FA_VAN"},
    "FacilityDetail": {facilityId:"ZIRET_WH"},
    "QualityInspection": {qualityInspectionId:"BOSS_WH_INSP"},
    "ReturnDetail": {returnId:"BOSS_ACCT_RETURN"},
    "SupplierPrices": {organizationPartyId:"ORG_ZIZI_SERVICES"},
    "PriceExplain": {productId:"BOSS_PRD_OWN",organizationPartyId:"ORG_ZIZI_SERVICES"},
    "Products/Prices/PriceLists/PriceListDetail": {priceListId:"BOSS_PRICE_LIST"},
    "Products/Prices/PriceExplain": {productId:"BOSS_PRD_OWN",organizationPartyId:"ORG_ZIZI_SERVICES"},
    "Products/Settings/PricingSettings": {organizationPartyId:"ORG_ZIZI_SERVICES"},
    "Products/Products/VariantBuilder": {productId: "BOSS_PRD_VIRT"},
    "Products/Products/VariantBuilderTui": {productId: "BOSS_PRD_VIRT"},
    "Products/Settings/VariantSettings": {organizationPartyId: "ORG_ZIZI_SERVICES"},
    "Products/Prices/List": {productId: "BOSS_PRD_OWN"},
    "Products/Prices/PriceHistory": {productId: "BOSS_PRD_OWN"},
    "Products/Products/BulkPrice": {productIds: "BOSS_PRD_OWN"},
    "Product360": {productId: "BOSS_PRD_OWN"},
    "Products/Categories/CategoryDetail": {productCategoryId: "BOSS_PRD_CAT"},
    "Insights/Dashboard": {definitionId: "mantle-sales", from: "now-1y", thru: "now"},
    "Commons/QuickCreate": { kind: "task" },
    "Commons/Calendar/EventDetail": { workEffortId: "BOSS_DEMO_EVENT" },
    "Commons/Calendar/Schedules/ResourceDetail": { resourceType: "room", resourceId: "BOSS_DEMO_ROOM_MAPLE" },
    "Commons/Requests/RequestDetail": { requestId: "BOSS_DEMO_REQUEST" },
    // the shared work item detail, which Commons mounts at Tasks/TaskDetail (Projects' context: WorkItemDetail.spec.js)
    "WorkItemDetail": { workEffortId: "BOSS_DEMO_TASK_PLAN" },
    // the shared request detail, which Commons and Projects mount at Requests/RequestDetail
    "RequestDetail": { requestId: "BOSS_DEMO_REQUEST" },
    "Commons/Contacts/ContactDetail": { partyId: "ORG_ACME_BA" },
    "Commons/Contacts/Compare": { partyId: "BOSS_DEMO_DUP_A", otherPartyId: "BOSS_DEMO_DUP_B" },
    "Commons/Knowledge/SpaceDetail": { wikiSpaceId: "BOSSKB" },
    "Commons/Files/DriveSettings": { driveId: "BOSS_DEMO_TEAM" },
    "Comms/Inbox/MessageDetail": { emailMessageId: "BOSS_DEMO_MAIL_INVOICE" },
    "Comms/Settings/MailAccounts/Account": { emailAccountId: "BOSS_DEMO_MAIL_SUPPORT" },
    "Comms/Consent/Contact": { partyId: "BOSS_DEMO_CON_ALEX" },
    "Insights/ReportBuilder/DatasetDetail": { dataDocumentId: "BOSS_DEMO_PRODUCTS" },
    "Insights/ReportBuilder/DatasetDetail/FieldList": { dataDocumentId: "BOSS_DEMO_PRODUCTS" },
    "Insights/ReportBuilder/DatasetView": { dataDocumentId: "BOSS_DEMO_PRODUCTS" },
    "Insights/ScheduledReports/ScheduledReportDetail": { screenScheduledId: "BOSS_DEMO_MY_TASKS" },
    "Chatter": { recordEntity: "mantle.request.Request", recordId: "BOSS_DEMO_REQUEST" },
    "RecordFiles": { recordEntity: "mantle.request.Request", recordId: "BOSS_DEMO_REQUEST" },
}

// the error nodes of a TUI document, and every text it shows, walking its nodes
function walk(nodes, errors, texts) {
    for (const node of nodes || []) {
        if (!node || typeof node !== "object") continue
        if (node.t === "error") errors.push(node.text || node.message || JSON.stringify(node).substring(0, 200))
        for (const key of ["text", "title", "value"]) if (typeof node[key] === "string") texts.push(node[key])
        // a formList's rows (flattened on the node): a cell is text, one node, or a stack of cells
        if (node.t === "formList") for (const row of node.rows || []) for (const cell of row.cells || []) cellWalk(cell, errors, texts)
        walk(node.c, errors, texts)
    }
}
function cellWalk(cell, errors, texts) {
    if (typeof cell === "string") texts.push(cell)
    else if (Array.isArray(cell)) for (const part of cell) cellWalk(part, errors, texts)
    else if (cell) walk([cell], errors, texts)
}
// a screen in the tui render mode: {status, errors, doc, nodeErrors, texts}
function tui(root, path, parameters) {
    const str = ec.screen.makeTest().rootScreen(root).renderMode("tui").render(path, Object.assign({ lastStandalone: "-2" }, parameters || {}), null)
    let doc = null
    try { doc = JSON.parse(str.output) } catch (err) { doc = null }
    const nodeErrors = [], texts = []
    if (doc) walk(doc.c, nodeErrors, texts)
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), doc, nodeErrors, texts, output: String(str.output || "") }
}

spec({
    setupSpec() {
        login("john.doe")
        screens = findScreenFiles(["Commons", "Comms", "Insights", "Products", "Accounting", "Warehouse"])
        accountingFixtures = ec.resource.script("component://mr-boss/test/AccountingSpecLib.js").routeFixtures()
        for (const [root, path] of screens)
            if (root.endsWith("/Accounting.xml")) demoParameters["Accounting/" + path] = {organizationPartyId: "BOSS_ACCT_ORG"}
        for (const [path, fixture] of Object.entries(accountingFixtures)) {
            demoParameters["Accounting/" + path] = fixture.parameters
            if (path.startsWith("Receivables/Customer360")) screens.push([`${base}/Accounting.xml`, path])
            // the Accounting context of the shared order and shipment screens, mounted under Records
            if (/^Records\/(OrderDetail|ShipmentDetail|ReturnDetail|Product360)$/.test(path)) screens.push([`${base}/Accounting.xml`, path])
            if (path === "Inventory/InventoryValuation") screens.push([`${base}/Accounting.xml`, path])
            // the shared equipment screen, mounted under Fixed assets
            if (path === "FixedAssets/EquipmentDetail") screens.push([`${base}/Accounting.xml`, path])
            // BillDetail's Match tab, the shared InvoiceMatch screen
            if (path === "Payables/BillDetail/Match") screens.push([`${base}/Accounting.xml`, path])
        }
        demoParameters["Customer360"] = accountingFixtures["Receivables/Customer360"].parameters
        // Warehouse (P18): every route on its demo record, with the shared screens and Handheld mounts under the root
        warehouseFixtures = ec.resource.script("component://mr-boss/test/WarehouseSpecLib.js").routeFixtures()
        for (const [path, fixture] of Object.entries(warehouseFixtures.routes))
            demoParameters["Warehouse/" + path] = fixture.parameters || {}
        for (const [path] of warehouseFixtures.mounts)
            if (!screens.some(([root, found]) => found === path && root.endsWith("/Warehouse.xml"))) screens.push([`${base}/Warehouse.xml`, path])
        for (const tab of ["Summary", "Features", "Categories", "Identifiers", "Dimensions", "Documents", "Associations", "Parties", "Connections", "History", "KitComponents", "Equipment"]) {
            const path = 'Products/Product360/' + tab
            screens.push([`${base}/Products.xml`, path])
            demoParameters['Products/' + path] = {productId: tab === 'KitComponents' ? 'DEMO_PA' : tab === 'Equipment' ? 'EQUIP_1' : 'BOSS_PRD_OWN'}
        }
        demoParameters['Products/Categories/CategoryDetail']={productCategoryId:'BOSS_PRD_CAT'}
        demoParameters['Products/Categories/CategoryDetail/Summary']={productCategoryId:'BOSS_PRD_CAT'}
        demoParameters['Products/Categories/CategoryDetail/Parents']={productCategoryId:'BOSS_PRD_CAT'}
        demoParameters['Products/Categories/CategoryDetail/Products']={productCategoryId:'BOSS_PRD_CAT'}
        demoParameters['Products/Categories/CategoryDetail/FeatureDefaults']={productCategoryId:'BOSS_PRD_CAT'}
        demoParameters['Products/Categories/CategoryDetail/Identifiers']={productCategoryId:'BOSS_PRD_CAT'}
        demoParameters['Products/Features/FeatureDetail']={productFeatureId:'BOSS_PRD_FEATURE'}
        demoParameters['Products/Features/FeatureDetail/Summary']={productFeatureId:'BOSS_PRD_FEATURE'}
        demoParameters['Products/Features/FeatureDetail/Groups']={productFeatureId:'BOSS_PRD_FEATURE'}
        demoParameters['Products/Features/FeatureDetail/Products']={productFeatureId:'BOSS_PRD_FEATURE'}
        demoParameters['Products/Features/FeatureDetail/Interactions']={productFeatureId:'BOSS_PRD_FEATURE'}
        demoParameters['Products/Features/FeatureGroups/FeatureGroupDetail']={productFeatureGroupId:'BOSS_PRD_GROUP'}
        demoParameters['Products/Features/FeatureGroups/FeatureGroupDetail/Summary']={productFeatureGroupId:'BOSS_PRD_GROUP'}
        demoParameters['Products/Features/FeatureGroups/FeatureGroupDetail/Features']={productFeatureGroupId:'BOSS_PRD_GROUP'}
        demoParameters['Products/Features/FeatureGroups/FeatureGroupDetail/Categories']={productFeatureGroupId:'BOSS_PRD_GROUP'}
    },
    setup() { ec.artifactExecution.disableAuthz() },
    cleanup() { ec.artifactExecution.enableAuthz() },
})

feature("every Commons, Comms, Insights, Products, Accounting, Warehouse and Shared screen renders in tui as a model document with no error node", {
    when() {
        const failures = []
        for (const [root, path] of screens) {
            const app = root.substring(base.length + 1).replace(/\.xml$/, "").replace(/^Shared\//, "")
            const key = path ? `${app}/${path}` : app
            const got = tui(root, path, demoParameters[key])
            if (got.status != 200 || got.errors) failures.push(`${key}: status ${got.status}, ${got.errors}`)
            else if (!got.doc || got.doc.v != 1) failures.push(`${key}: not a TUI document: ${got.output.substring(0, 160)}`)
            else if (got.nodeErrors.length) failures.push(`${key}: ${got.nodeErrors.join(" | ")}`)
            const fixture = key.startsWith("Accounting/") ? accountingFixtures[key.substring("Accounting/".length)] : null
            if (fixture && !got.output.includes(fixture.text)) failures.push(`${key}: no ${JSON.stringify(fixture.text)}`)
            if (fixture && /(?:Invoice|Customer) (?:not available|is unavailable)/.test(got.output))
                failures.push(`${key}: fixture record is unavailable`)
            // a Warehouse twin shows its demo record's text, as the html render does (AppStructure)
            const warehouse = key.startsWith("Warehouse/") ? warehouseFixtures.routes[key.substring("Warehouse/".length)] : null
            const warehouseText = warehouse ? warehouse.tuiText || warehouse.text : null
            if (warehouseText && !got.output.includes(warehouseText)) failures.push(`${key}: no ${JSON.stringify(warehouseText)}`)
        }
        // every Warehouse route fixture is a screen rendered here
        for (const path of Object.keys(warehouseFixtures.routes))
            if (!screens.some(([root, found]) => root.endsWith("/Warehouse.xml") && found === path))
                failures.push(`Warehouse/${path}: a route fixture with no screen rendered`)
        if (failures.length) log.warn(`TUI failures:\n${failures.join("\n")}`)
        return { failures }
    },
    then({ failures }) {
        screens.length > 15
        failures.join("\n") == ""
    },
})

feature("the twins show their screens' data: the Tasks list's rows, a request's facts and tabs, the Today panel's groups", {
    when() {
        const commons = `${base}/Commons.xml`
        return { tasks: tui(commons, "Tasks/List", { list: "all" }), request: tui(commons, "Requests/RequestDetail", { requestId: "BOSS_DEMO_REQUEST" }),
            today: tui(commons, "Panel/Today", {}) }
    },
    then({ tasks, request, today }) {
        tasks.nodeErrors.length == 0
        tasks.texts.some((text) => text.includes("Plan the office move"))
        tasks.texts.includes("New task")
        request.texts.some((text) => text.includes("Set up the shared team calendar"))
        request.texts.includes("[Overview]")
        today.nodeErrors.length == 0
    },
})

// F375 (P18): a box, list or container whose display depends on a value is wrapped in a section with the condition, which
// every render mode honors (a condition on container-box, container, form-list or display is not in the XSD and only some
// renderers read it), so each stays out of the terminal twin and of the browser's page when the condition does not hold
feature("Warehouse's conditioned boxes stay out of the twin and the page when their condition does not hold (F375)", {
    when() {
        const warehouse = `${base}/Warehouse.xml`
        const lib = ec.resource.script("component://mr-boss/test/WarehouseSpecLib.js")
        const cases = [
            ["Transfers/Transfers", {}, "Stock at suppliers"],
            ["Handheld/PickFace", {facilityId: "ZIRET_WH"}, "Reserved outside pick locations"],
            ["Transfers/Repack", {}, "Stock of "],
            // server-static qvt: its page is a template with the section's v-if, so only the twin is checked here
            ["Counts/CountSheet", {physicalInventoryId: "BOSS_WH_COUNT"}, "Snapshot", true]
        ]
        const shown = []
        for (const [path, parameters, text, serverStatic] of cases) {
            const twin = tui(warehouse, path, parameters)
            if (twin.status != 200 || twin.output.includes(text)) shown.push(`${path} (tui): ${twin.status} ${text}`)
            if (serverStatic) continue
            const page = lib.page(path, parameters)
            if (page.status != 200 || page.output.includes(text)) shown.push(`${path} (qvt): ${page.status} ${text}`)
        }
        return {shown}
    },
    then({shown}) {
        shown.join("\n") == ""
    }
})
