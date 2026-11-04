// Server-static qvt for the Commons, Comms and Products screens (README "Significant redesigns" 3, mr-moqui plans/archive/QvtServerStatic.md):
// ServerStaticLib's full check of each plain XML screen with the demo record AppStructure uses, as john.doe. A screen marked
// server-static="qvt" must come back clean; the list of the others and why is logged, for impl-drawers-commons.md §8. Projects,
// Accounting, Warehouse and Manufacturing have their own (ProjectsServerStatic, AccountingServerStatic, WarehouseServerStatic,
// ManufacturingServerStatic), so each spec stays well under 30 s.
// Run: ./moq test mr-boss --spec ServerStatic
const lib = ec.resource.script("component://mr-boss/test/ServerStaticLib.js")
let screens

// the id parameters of the screens that open on one demo record (as AppStructure's demoRecords)
const demoParameters = {
    "Products/Products/VariantBuilder": {productId:"BOSS_PRD_VIRT"},
    "Products/Products/VariantBuilderTui": {productId:"BOSS_PRD_VIRT"},
    "Products/Products/BulkPrice": {productIds:"BOSS_PRD_OWN"},
    "Products/Categories/CategoryDetail": {productCategoryId:"BOSS_PRD_CAT"},
    "Products/Features/FeatureDetail": {productFeatureId:"BOSS_PRD_FEATURE"},
    "Products/Features/FeatureGroups/FeatureGroupDetail": {productFeatureGroupId:"BOSS_PRD_GROUP"},
    "Products/Prices/PriceLists/PriceListDetail": {priceListId:"BOSS_PRICE_LIST"},
    "Products/Prices/PriceExplain": {productId:"BOSS_PRD_OWN",organizationPartyId:"ORG_ZIZI_SERVICES"},
    "Products/Settings/PricingSettings": {organizationPartyId:"ORG_ZIZI_SERVICES"},

    "Commons/QuickCreate": { kind: "task" },
    "Commons/Calendar/EventDetail": { workEffortId: "BOSS_DEMO_EVENT" },
    "Commons/Calendar/Schedules/ResourceDetail": { resourceType: "room", resourceId: "BOSS_DEMO_ROOM_MAPLE" },
    "Commons/Requests/RequestDetail": { requestId: "BOSS_DEMO_REQUEST" },
    "Commons/Tasks/TaskDetail": { workEffortId: "BOSS_DEMO_TASK_PLAN" },
    "Commons/Contacts/ContactDetail": { partyId: "ORG_ACME_BA" },
    "Commons/Contacts/Compare": { partyId: "BOSS_DEMO_DUP_A", otherPartyId: "BOSS_DEMO_DUP_B" },
    "Commons/Knowledge/SpaceDetail": { wikiSpaceId: "BOSSKB" },
    "Commons/Files/DriveSettings": { driveId: "BOSS_DEMO_TEAM" },
    "Comms/Inbox/MessageDetail": { emailMessageId: "BOSS_DEMO_MAIL_INVOICE" },
    "Comms/Settings/MailAccounts/Account": { emailAccountId: "BOSS_DEMO_MAIL_SUPPORT" },
    "Comms/Consent/Contact": { partyId: "BOSS_DEMO_CON_ALEX" },
}

// a Products screen without its own entry takes its parent's, else the demo product and organization
function parametersOf(app, path) {
    const key = `${app}/${path}`
    if (demoParameters[key] || app !== "Products") return demoParameters[key]
    const parent = Object.entries(demoParameters).filter(([prefix]) => key.startsWith(prefix + "/")).sort((a, b) => b[0].length - a[0].length)[0]
    return parent ? parent[1] : Object.assign({productId: "BOSS_PRD_OWN", organizationPartyId: "ORG_ZIZI_SERVICES"},
        path.includes("InventoryValuation") ? {productStandardCostId: "BOSS_COST_SAMPLE"} : {})
}

spec({
    setupSpec() {
        login("john.doe")
        screens = lib.screens(["Commons", "Comms", "Products"])
    },
})

feature("the full check of every Commons, Comms and Products XML screen; each one marked server-static is clean", {
    when() {
        return { rows: lib.check(screens, parametersOf) }
    },
    then({ rows }) {
        rows.length > 40
        lib.unclean(rows) == ""
    },
})
