// The Marketing app's access and context (impl-marketing §2, P1; design-marketing §1.1, §1.2, §14.2): who may open Marketing,
// their capabilities and organizations, the record check every Marketing screen and shared mount runs before a Mantle service,
// the drop-downs, the palette and the canonical links. The scope itself is Mantle's (mantle/marketing/MarketingAccess.js: the
// MARKETING_* and MESSAGE_* permissions and the user's organizations), read once per call here; the Mantle services check it
// again, and nothing here grants what Mantle refuses.
//
// Opening Marketing needs the root grant of one of the user's groups (BOSS_MARKETING, the root user group, or
// BOSS_MARKETING_ADMIN), read directly so an inherited or disabled authorization cannot widen it (impl-admin F35, as Sales.js);
// the root grant opens navigation only. A system administrator (ADMIN) opens everything. A Projects client contact
// (PROJECT_CLIENT) never opens Marketing, and a PASS public account holds no BOSS group.
//
// Later phases extend the tables below rather than the functions: mountRoots (the app roots that mount Marketing's shared
// screens), areas (menu areas whose authorization is a capability), recordKinds (a kind of record: its check and, once built, its
// screen), searchFinds (the palette), choiceSources (the drop-downs) and linkPaths (sharedLinks).
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const marketingAccess = ec.resource.script("component://mr-mantle/service/mantle/marketing/MarketingAccess.js")
const {find, one, denied} = lib
const access = lib.access

const rootLocation = "component://mr-boss/screen/Marketing.xml"
const areaLocation = area => "component://mr-boss/screen/Marketing/" + area + ".xml"
const choiceLimit = 30
const organizationOptionLimit = 100

// The app roots whose screens take Marketing's context, each with its link base: Marketing's own. Comms' mounts of the shared
// templates, sending profiles, suppressions and delivery screens come later, with a Comms settings area (impl-marketing §4, F16).
const mountRoots = {
    Marketing: "//Marketing"
}
// The menu areas whose authorization is a capability (data/BossSetupMarketingData.xml BOSS_MKT_<Area>): Settings the
// administrator's (P1). Home is every Marketing user's; later phases add theirs.
const areas = {
    settings: "Settings",
    // P2: Approvals, the approvers' (BOSS_MKT_APPROVALS)
    approvals: "Campaigns/Approvals"
}
// The capability an area's screens' services also ask, so a custom group given Marketing in Admin, which is no member of
// BOSS_MARKETING and not reached by the area's deny, is shown no area its services refuse (impl-maintenance F346's lesson).
const areaReads = {settings: "configure", approvals: "approve"}

// ===== scope =====
// The user's screen authorizations, read directly (as Sales.js): screenAuthz reads the groups' rows once, and screenGrants picks
// a screen's from them (ALWAYS over DENY over ALLOW).
function screenAuthz(groupIds) {
    return Array.from(
        find("moqui.security.ArtifactAuthzCheckView")
            .condition("userGroupId", "in", groupIds)
            .condition("artifactTypeEnumId", "AT_XML_SCREEN")
            .condition("authzActionEnumId", "in", ["AUTHZA_ALL", "AUTHZA_VIEW"])
            .list()
    )
}
function screenGrants(location, authzRows) {
    const grants = authzRows.filter(row =>
        row.nameIsPattern === "Y" ? new RegExp("^(?:" + row.artifactName + ")$").test(location) : row.artifactName === location
    )
    const always = grants.filter(row => row.authzTypeEnumId === "AUTHZT_ALWAYS")
    const allowed = always.length
        ? always
        : grants.some(row => row.authzTypeEnumId === "AUTHZT_DENY")
          ? []
          : grants.filter(row => row.authzTypeEnumId === "AUTHZT_ALLOW")
    return {found: grants.length > 0, allowed, always: always.length > 0}
}
function rootGrants() {
    const none = {read: false, authzRows: []}
    if (!ec.user.userId || ec.user.hasPermission("PROJECT_CLIENT")) return none
    if (access.systemAdmin()) return {read: true, authzRows: [], systemAdmin: true}
    const groupIds = Array.from(ec.user.getUserGroupIdSet() || [])
    if (!groupIds.length) return none
    const authzRows = screenAuthz(groupIds)
    const root = screenGrants(rootLocation, authzRows)
    return {read: root.allowed.length > 0, rootAlways: root.always, authzRows}
}
// An area's grant: the root's ALWAYS (the Marketing administrator's, ADMIN's) passes every area below it; otherwise the area's own
// rows decide when it has any, else the root's.
function areaGrant(grants, area) {
    if (!grants.read) return false
    if (grants.systemAdmin || grants.rootAlways) return true
    const found = screenGrants(areaLocation(area), grants.authzRows)
    return found.found ? found.allowed.length > 0 : true
}

// The scope of the current user: the root grant, Mantle's marketing scope and the areas. Without the root grant nothing of
// Mantle's scope is read.
function scope() {
    const grants = rootGrants()
    const mantle = grants.read ? marketingAccess.scope() : null
    const capabilities = Object.assign({read: grants.read}, mantle?.capabilities || {})
    for (const [name, area] of Object.entries(areas))
        capabilities[name] = areaGrant(grants, area) && (!areaReads[name] || !!capabilities[areaReads[name]])
    return {read: grants.read, mantle: mantle || {organizationPartyIds: [], capabilities: {}}, capabilities}
}
function required(userScope = scope()) {
    if (!userScope.read) denied("MARKETING_UNAVAILABLE", "Marketing is not available")
    return userScope
}
const likeText = text => "%" + String(text).replace(/[\\%_]/g, character => "\\" + character) + "%"
function organizationName(partyId) {
    const organization = partyId ? one("mantle.party.Organization", {partyId}) : null
    return organization?.organizationName || partyId || ""
}
// The organizations of the scope: its list, or every internal organization when it is every one (null).
const organizationIds = userScope => marketingAccess.organizationIds(userScope.mantle)
const covers = (userScope, partyId) => marketingAccess.covers(userScope.mantle, partyId)
// Organizations as options, by name, searched in the query ignoring case.
function organizationOptions(partyIds, term, limit) {
    if (!partyIds.length) return []
    let query = find("mantle.party.Organization").condition("partyId", "in", partyIds).orderBy("^organizationName").limit(limit)
    if (term) {
        const factory = ec.entity.conditionFactory
        query = query.condition(
            factory.makeCondition(
                ["partyId", "organizationName"].map(field => factory.makeCondition(field, "like", likeText(term)).ignoreCase()),
                "or"
            )
        )
    }
    return Array.from(query.list()).map(row => ({value: row.partyId, label: row.organizationName || row.partyId}))
}

// ===== shared context =====
// The Marketing routes other screens link to (sharedLinks), by path under the root; each phase adds its screens.
const linkPaths = [
    // P1: Home and Settings (design §1.2, §3, §12)
    "Home",
    "Settings",
    "Settings/Index",
    "Settings/Adoption",
    // P2: campaigns, approvals and the campaign settings (design §3, §12)
    "Campaigns",
    "Campaigns/Campaigns",
    "Campaigns/CampaignDetail",
    "Campaigns/CampaignPlan",
    "Campaigns/Approvals",
    "Settings/CampaignDefaults",
    "Settings/Vocabularies"
]
function sharedContext(p) {
    const appRoot = p.appRoot || "Marketing"
    if (!Object.hasOwn(mountRoots, appRoot)) denied("MARKETING_CONTEXT", "Marketing context is not available")
    const userScope = required()
    const mantle = userScope.mantle
    const ids = organizationIds(userScope)
    const linkBase = mountRoots[appRoot]
    return {
        capabilities: userScope.capabilities,
        organizationPartyIds: ids,
        activeOrganizationPartyId: mantle.activeOrganizationPartyId || null,
        allOrganizations: !!mantle.allOrganizations,
        organizationOptions: organizationOptions(ids, null, organizationOptionLimit),
        partyId: mantle.partyId || null,
        appRoot,
        linkBase,
        webBase: "/qapps/" + appRoot,
        sharedLinks: Object.fromEntries(linkPaths.map(path => [path, linkBase + "/" + path]))
    }
}

// ===== record kinds =====
// Each kind a Marketing screen or mount may be given: its name, icon, screen (once built) and its check, which refuses a record
// that does not exist, one outside the scope and an unowned one alike (RECORD_UNAVAILABLE). P1: an organization, a campaign, a
// list (not a mailbox) and a segment, each by its organization; later phases add theirs (a send P8, an event P16) and the screens
// (CampaignDetail P2, ListDetail P3, SegmentDetail P5).
const statusName = statusId => (statusId ? one("moqui.basic.StatusItem", {statusId})?.description || statusId : "")
const recordKinds = {
    organization: {
        name: "Organization",
        icon: "sym_o_corporate_fare",
        destination: null,
        read: (userScope, partyId) => {
            if (!userScope.capabilities.anyRead || !covers(userScope, partyId)) return null
            return {organizationPartyId: partyId, label: organizationName(partyId), detail: "Organization"}
        }
    },
    campaign: {
        name: "Campaign",
        icon: "sym_o_campaign",
        // P2: CampaignDetail
        destination: {path: "Campaigns/CampaignDetail", parameter: "marketingCampaignId"},
        read: (userScope, marketingCampaignId) => {
            if (!userScope.capabilities.anyRead) return null
            const row = one("mantle.marketing.campaign.MarketingCampaign", {marketingCampaignId})
            if (!row || !covers(userScope, row.organizationPartyId)) return null
            return {
                organizationPartyId: row.organizationPartyId,
                label: row.campaignName || marketingCampaignId,
                detail: statusName(row.statusId)
            }
        }
    },
    list: {
        name: "List",
        icon: "sym_o_contact_mail",
        destination: null,
        read: (userScope, contactListId) => {
            if (!userScope.capabilities.anyRead) return null
            const row = one("mantle.marketing.contact.ContactList", {contactListId})
            // a mailbox is the Inbox's, never a Marketing list
            if (!row || row.contactListTypeEnumId === "MAILBOX" || !covers(userScope, row.ownerPartyId)) return null
            return {organizationPartyId: row.ownerPartyId, label: row.contactListName || contactListId, detail: "List"}
        }
    },
    segment: {
        name: "Segment",
        icon: "sym_o_group_work",
        destination: null,
        read: (userScope, marketSegmentId) => {
            if (!userScope.capabilities.anyRead) return null
            const row = one("mantle.marketing.segment.MarketSegment", {marketSegmentId})
            if (!row || !covers(userScope, row.ownerPartyId)) return null
            return {organizationPartyId: row.ownerPartyId, label: row.description || marketSegmentId, detail: "Segment"}
        }
    }
}
function recordOf(userScope, kind, recordId) {
    const definition = Object.hasOwn(recordKinds, kind) ? recordKinds[kind] : null
    const unavailable = () => denied("RECORD_UNAVAILABLE", (definition?.name || "Record") + " " + recordId + " is not available")
    if (!recordId || !definition) unavailable()
    let found
    try {
        found = definition.read(userScope, recordId)
    } catch (error) {
        // Mantle's refusals of a record (missing, outside the scope, no read) are one answer here
        if (["RECORD_UNAVAILABLE", "PERMISSION_DENIED", "ORGANIZATION_DENIED"].includes(lib.reasonCode(error))) unavailable()
        throw error
    }
    if (!found) unavailable()
    return {
        recordType: kind,
        recordId,
        kindName: definition.name,
        organizationPartyId: found.organizationPartyId,
        label: found.label,
        detail: found.detail
    }
}
// check#Record: a record a Marketing screen or mount was given, refused unless the user may see it and, when a capability is
// named, holds it.
function checkRecord(p) {
    const userScope = required()
    if (p.capability) {
        if (!Object.hasOwn(userScope.capabilities, p.capability)) throw new Error("Unknown Marketing capability " + p.capability)
        if (!userScope.capabilities[p.capability]) denied("PERMISSION_DENIED", "Marketing " + p.capability + " is required")
    }
    return recordOf(userScope, p.recordType, p.recordId)
}

// ===== choices =====
// Each Marketing drop-down: its options for the user, searched in the query ignoring case, with the selected value's label when
// it is in scope but not on the page. An unknown choice throws. Later phases add sources (campaigns, lists, segments, templates).
function withSelected(options, selected, admits, label) {
    if (selected && !options.some(option => option.value === selected) && admits(selected))
        options.push({value: selected, label: label(selected)})
    return options
}
const CAMPAIGN = "mantle.marketing.campaign.MarketingCampaign"
const openCampaignStatuses = ["MKTG_CAMP_PLANNED", "MKTG_CAMP_APPROVED", "MKTG_CAMP_INPROGRESS"]
// A text condition over fields, ignoring case, in the query.
function textCondition(fields, term) {
    const factory = ec.entity.conditionFactory
    return factory.makeCondition(
        fields.map(field => factory.makeCondition(field, "like", likeText(term)).ignoreCase()),
        "or"
    )
}
// The organization a choice is narrowed to: one of the scope's, else every one of them.
const choiceOrganizations = (userScope, p) =>
    p.organizationPartyId && covers(userScope, p.organizationPartyId) ? [p.organizationPartyId] : organizationIds(userScope)
const choiceSources = {
    // the organizations of the user's marketing scope
    organizations: (userScope, term, selected) =>
        withSelected(
            organizationOptions(organizationIds(userScope), term, choiceLimit),
            selected,
            partyId => userScope.capabilities.anyRead && covers(userScope, partyId),
            organizationName
        ),
    // P2: the open campaigns of the scope (a parent), by name, of the organization named
    campaigns: (userScope, term, selected, p) => {
        const ids = choiceOrganizations(userScope, p)
        if (!ids.length) return []
        let query = find(CAMPAIGN)
            .condition("organizationPartyId", "in", ids)
            .condition("statusId", "in", openCampaignStatuses)
            .orderBy("^campaignName")
            .limit(choiceLimit)
        if (term) query = query.condition(textCondition(["marketingCampaignId", "campaignName"], term))
        if (p.excludeId) query = query.condition("marketingCampaignId", "not-equals", p.excludeId)
        const options = Array.from(query.list()).map(row => ({
            value: row.marketingCampaignId,
            label: row.campaignName || row.marketingCampaignId
        }))
        return withSelected(
            options,
            selected,
            id => !!recordKinds.campaign.read(userScope, id),
            id => one(CAMPAIGN, {marketingCampaignId: id})?.campaignName || id
        )
    },
    // P2: the people who work for the organization named (a manager or contributor), by name
    people: (userScope, term, selected, p) => {
        const ids = choiceOrganizations(userScope, p)
        if (!ids.length) return []
        const partyIds = Array.from(
            find("mantle.party.PartyRelationship")
                .condition("toPartyId", "in", ids)
                .condition("relationshipTypeEnumId", "in", ["PrtAgent", "PrtEmployee"])
                .condition(ec.entity.conditionFactory.makeConditionDate("fromDate", "thruDate", null))
                .selectField("fromPartyId")
                .distinct(true)
                .list()
        ).map(row => row.fromPartyId)
        if (!partyIds.length) return []
        let query = find("mantle.party.PersonAndUserAccount")
            .condition("partyId", "in", partyIds)
            .orderBy("^firstName")
            .orderBy("^lastName")
            .limit(choiceLimit)
        if (term) query = query.condition(textCondition(["firstName", "lastName", "username"], term))
        const options = []
        for (const row of Array.from(query.list()))
            if (!options.some(option => option.value === row.partyId))
                options.push({value: row.partyId, label: [row.firstName, row.lastName].filter(Boolean).join(" ") || row.partyId})
        return withSelected(
            options,
            selected,
            partyId => partyIds.includes(partyId),
            partyId => lib.partyNames([partyId])[partyId] || partyId
        )
    },
    // P2: the currencies, a closed list
    currencies: (userScope, term, selected) => {
        let query = find("moqui.basic.Uom", {uomTypeEnumId: "UT_CURRENCY_MEASURE"}).orderBy("uomId").limit(choiceLimit)
        if (term) query = query.condition(textCondition(["uomId", "description"], term))
        const options = Array.from(query.list()).map(row => ({
            value: row.uomId,
            label: row.uomId + " · " + (row.description || "")
        }))
        return withSelected(
            options,
            selected,
            uomId => !!one("moqui.basic.Uom", {uomId}),
            uomId => uomId
        )
    },
    // P2: the lists and segments of the organization named, for a campaign's links
    lists: (userScope, term, selected, p) => {
        const ids = choiceOrganizations(userScope, p)
        if (!ids.length) return []
        let query = find("mantle.marketing.contact.ContactList")
            .condition("ownerPartyId", "in", ids)
            .condition("contactListTypeEnumId", "not-equals", "MAILBOX")
            .orderBy("^contactListName")
            .limit(choiceLimit)
        if (term) query = query.condition(textCondition(["contactListId", "contactListName"], term))
        return Array.from(query.list()).map(row => ({value: row.contactListId, label: row.contactListName || row.contactListId}))
    },
    segments: (userScope, term, selected, p) => {
        const ids = choiceOrganizations(userScope, p)
        if (!ids.length) return []
        let query = find("mantle.marketing.segment.MarketSegment")
            .condition("ownerPartyId", "in", ids)
            .orderBy("^description")
            .limit(choiceLimit)
        if (term) query = query.condition(textCondition(["marketSegmentId", "description"], term))
        return Array.from(query.list()).map(row => ({value: row.marketSegmentId, label: row.description || row.marketSegmentId}))
    }
}
function choices(p) {
    const userScope = required()
    if (!Object.hasOwn(choiceSources, p.choice)) throw new Error("Unknown Marketing choice " + p.choice)
    if (!userScope.capabilities.anyRead) return {options: []}
    return {options: choiceSources[p.choice](userScope, String(p.term || "").trim(), p.selected || null, p)}
}

// ===== palette =====
// The palette's Marketing records, each opening its Marketing screen, with recordEntity and recordId for Assist's search. None
// yet, and the root registers no palette source: campaigns join with their screens (P2), lists (P3), segments (P5), sends (P8),
// events (P16).
const searchFinds = [
    // P2: the campaigns of the scope by id or name
    {
        kind: "campaign",
        rows: (userScope, text, limit) => {
            if (!userScope.capabilities.anyRead) return []
            const ids = organizationIds(userScope)
            if (!ids.length) return []
            const path = sharedPath("Marketing", "Campaigns/CampaignDetail")
            return Array.from(
                find(CAMPAIGN)
                    .condition("organizationPartyId", "in", ids)
                    .condition(textCondition(["marketingCampaignId", "campaignName"], text))
                    .orderBy("-fromDate")
                    .limit(limit)
                    .list()
            ).map(row => ({
                title: row.campaignName || row.marketingCampaignId,
                subtitle: "Campaign · " + organizationName(row.organizationPartyId),
                icon: recordKinds.campaign.icon,
                url: path + "?marketingCampaignId=" + encodeURIComponent(row.marketingCampaignId),
                recordEntity: CAMPAIGN,
                recordId: row.marketingCampaignId
            }))
        }
    }
]
// The web path of a Marketing screen under a root.
const sharedPath = (appRoot, path) => "/qapps/" + appRoot + "/" + path
// A record's link (the palette's get#RecordLink): its kind's screen under Marketing, with its icon, for a Marketing user who may see
// it; else none.
function recordLink(kind, recordId) {
    const definition = Object.hasOwn(recordKinds, kind) ? recordKinds[kind] : null
    if (!definition?.destination || !recordId) return null
    const userScope = scope()
    if (!userScope.read || !definition.read(userScope, recordId)) return null
    return {
        url:
            sharedPath("Marketing", definition.destination.path) +
            "?" +
            definition.destination.parameter +
            "=" +
            encodeURIComponent(recordId),
        icon: definition.icon
    }
}
function search(p) {
    const userScope = scope()
    if (!userScope.read || !String(p.text || "").trim()) return {rows: []}
    const text = String(p.text).trim()
    const limit = Math.max(1, Math.min(20, Number(p.limit || 5)))
    const found = new Map()
    for (const definition of searchFinds) {
        let rowsFound = []
        try {
            rowsFound = definition.rows(userScope, text, limit)
        } catch (error) {
            ec.logger.error("Marketing palette " + definition.kind + " search failed: " + error.message)
        }
        for (const row of rowsFound) if (!found.has(row.url)) found.set(row.url, row)
    }
    return {rows: Array.from(found.values()).slice(0, limit)}
}

const operations = {sharedContext, checkRecord, choices, search}
function run(op, p) {
    if (!Object.hasOwn(operations, op)) throw new Error("Unknown Marketing operation " + op)
    return operations[op](p || {})
}
;({execute: run, recordLink})
