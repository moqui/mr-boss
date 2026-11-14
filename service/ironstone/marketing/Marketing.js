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
    approvals: "Campaigns/Approvals",
    // P3: Audiences (lists, consent, suppressions), the audience managers' (BOSS_MKT_AUDIENCES)
    audiences: "Audiences",
    // P5: AudiencePreview, the audience managers' and, past the area's deny, the authors' and dispatchers'
    // (BOSS_MKT_AUDIENCE_PREVIEW)
    audiencePreview: "Audiences/AudiencePreview",
    // P6: Sends (Comms' templates; P8 adds the sends), the authors' (BOSS_MKT_SENDS)
    sends: "Sends"
}
// The capability an area's screens' services also ask, so a custom group given Marketing in Admin, which is no member of
// BOSS_MARKETING and not reached by the area's deny, is shown no area its services refuse (impl-maintenance F346's lesson).
const areaReads = {
    settings: "configure",
    approvals: "approve",
    audiences: "audienceRead",
    audiencePreview: "previewRead",
    sends: "sendsRead"
}

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
    // P5: an audience preview is read by an audience reader, a send author or a dispatcher (design §2 AudiencePreview: A, U, D), as
    // Mantle's preview#Audience asks
    capabilities.previewRead =
        !!capabilities.anyRead && !!(capabilities.audienceRead || capabilities.sendEdit || capabilities.dispatch)
    // P6: Comms' templates are read with MESSAGE_TEMPLATE_VIEW or _EDIT, the sending profiles with MESSAGE_SENDING_CONFIGURE or
    // Marketing's configure, send edit or dispatch (as Mantle's MessageTemplates.js and MessageSendingProfiles.js ask); the Sends
    // area is the template readers' until P8 adds the sends
    capabilities.templateRead = !!(capabilities.templateView || capabilities.templateEdit)
    capabilities.profileRead = !!(
        capabilities.sendingConfigure ||
        capabilities.configure ||
        capabilities.sendEdit ||
        capabilities.dispatch
    )
    capabilities.sendsRead = capabilities.templateRead
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
    "Settings/Vocabularies",
    // P3: audiences (design §4: lists, members, Comms' Consent and the shared Suppressions), Sales' Leads and Accounts mounted for the
    // bulk action (design §10, F64), and quick create's list
    "Audiences",
    "Audiences/Lists",
    "Audiences/ListDetail",
    "Audiences/MemberDetail",
    "Audiences/Consent",
    "Audiences/Consent/Contact",
    "Audiences/Suppressions",
    "Leads",
    "Leads/Accounts",
    "QuickCreate/NewList",
    // P4: the audience import (Admin's Imports opens a run there) and the list merge (design §4)
    "Audiences/AudienceImport",
    "Audiences/AudienceMerge",
    // P5: segments and the audience preview (design §4)
    "Audiences/Segments",
    "Audiences/SegmentDetail",
    "Audiences/AudiencePreview",
    // P6: Comms' templates and sending profiles (design §5, §12)
    "Sends",
    "Sends/MessageTemplates",
    "Sends/MessageTemplateDetail",
    "Settings/SendingProfiles"
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
const segmentLabel = row => row.segmentName || row.description || row.marketSegmentId
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
        // P3: ListDetail
        destination: {path: "Audiences/ListDetail", parameter: "contactListId"},
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
        // P5: SegmentDetail
        destination: {path: "Audiences/SegmentDetail", parameter: "marketSegmentId"},
        read: (userScope, marketSegmentId) => {
            if (!userScope.capabilities.anyRead) return null
            const row = one("mantle.marketing.segment.MarketSegment", {marketSegmentId})
            if (!row || !covers(userScope, row.ownerPartyId)) return null
            return {organizationPartyId: row.ownerPartyId, label: segmentLabel(row), detail: "Segment"}
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
    // P5: the segments are not archived (a parent, a preview's source), excludeId left out, by name; the selected one's label
    segments: (userScope, term, selected, p) => {
        const ids = choiceOrganizations(userScope, p)
        if (!ids.length) return []
        const factory = ec.entity.conditionFactory
        let query = find("mantle.marketing.segment.MarketSegment")
            .condition("ownerPartyId", "in", ids)
            .condition(factory.makeCondition("archivedDate", "greater", ec.user.nowTimestamp, true))
            .orderBy("^segmentName")
            .orderBy("^description")
            .limit(choiceLimit)
        if (term) query = query.condition(textCondition(["marketSegmentId", "segmentName", "description"], term))
        if (p.excludeId) query = query.condition("marketSegmentId", "not-equals", p.excludeId)
        const options = Array.from(query.list()).map(row => ({value: row.marketSegmentId, label: segmentLabel(row)}))
        return withSelected(
            options,
            selected,
            id => !!recordKinds.segment.read(userScope, id),
            id => segmentLabel(one("mantle.marketing.segment.MarketSegment", {marketSegmentId: id}))
        )
    },
    // P5: a segment's native rule values, closed or searched lists: party classifications, geographies (countries, states and
    // groups), dimension kinds and units
    classifications: (userScope, term, selected) => {
        let query = find("mantle.party.PartyClassification").orderBy("^description").limit(choiceLimit)
        if (term) query = query.condition(textCondition(["partyClassificationId", "description"], term))
        return Array.from(query.list()).map(row => ({
            value: row.partyClassificationId,
            label: row.description || row.partyClassificationId
        }))
    },
    geos: (userScope, term, selected) => {
        let query = find("moqui.basic.Geo")
            .condition("geoTypeEnumId", "in", [
                "GEOT_COUNTRY",
                "GEOT_STATE",
                "GEOT_PROVINCE",
                "GEOT_TERRITORY",
                "GEOT_REGION",
                "GEOT_GROUP"
            ])
            .orderBy("^geoName")
            .limit(choiceLimit)
        if (term) query = query.condition(textCondition(["geoId", "geoName"], term))
        return Array.from(query.list()).map(row => ({value: row.geoId, label: row.geoName || row.geoId}))
    },
    dimensionTypes: (userScope, term, selected) => {
        let query = find("moqui.basic.UomDimensionType").orderBy("^description").limit(choiceLimit)
        if (term) query = query.condition(textCondition(["uomDimensionTypeId", "description"], term))
        return Array.from(query.list()).map(row => ({
            value: row.uomDimensionTypeId,
            label: row.description || row.uomDimensionTypeId
        }))
    },
    units: (userScope, term, selected) => {
        let query = find("moqui.basic.Uom")
            .condition("uomTypeEnumId", "not-equals", "UT_CURRENCY_MEASURE")
            .orderBy("^description")
            .limit(choiceLimit)
        if (term) query = query.condition(textCondition(["uomId", "description", "abbreviation"], term))
        return Array.from(query.list()).map(row => ({
            value: row.uomId,
            label: (row.description || row.uomId) + (row.abbreviation ? " (" + row.abbreviation + ")" : "")
        }))
    },
    // P3: the lists a request may file to (the Sales bulk action, AddMembers): an audience editor's lists of the scope, not archived,
    // never a mailbox, with each one's organization; the selected one's label when it is one of them
    audienceLists: (userScope, term, selected, p) => {
        if (!userScope.capabilities.audienceEdit) return []
        const ids = choiceOrganizations(userScope, p)
        if (!ids.length) return []
        const factory = ec.entity.conditionFactory
        let query = find("mantle.marketing.contact.ContactList")
            .condition("ownerPartyId", "in", ids)
            .condition("contactListTypeEnumId", "in", ["MARKETING", "NEWSLETTER", "ANNOUNCEMENT"])
            .condition(factory.makeCondition("archivedDate", "greater", ec.user.nowTimestamp, true))
            .orderBy("^contactListName")
            .limit(choiceLimit)
        if (term) query = query.condition(textCondition(["contactListId", "contactListName"], term))
        const many = ids.length > 1
        const label = row => (row.contactListName || row.contactListId) + (many ? " · " + organizationName(row.ownerPartyId) : "")
        const options = Array.from(query.list()).map(row => ({value: row.contactListId, label: label(row)}))
        return withSelected(
            options,
            selected,
            id => {
                const row = one("mantle.marketing.contact.ContactList", {contactListId: id})
                return !!row && row.contactListTypeEnumId !== "MAILBOX" && covers(userScope, row.ownerPartyId)
            },
            id => label(one("mantle.marketing.contact.ContactList", {contactListId: id}))
        )
    },
    // P6: Comms' templates of the organization named that are in use and have content in effect (a send's starting point, P8), by
    // name, for a template reader
    messageTemplates: (userScope, term, selected, p) => {
        if (!userScope.capabilities.templateRead) return []
        const ids = choiceOrganizations(userScope, p)
        if (!ids.length) return []
        const factory = ec.entity.conditionFactory
        let query = find("mantle.party.MessageTemplate")
            .condition("organizationPartyId", "in", ids)
            .condition(factory.makeCondition("thruDate", "greater", ec.user.nowTimestamp, true))
            .orderBy("^templateName")
            .limit(choiceLimit)
        if (term) query = query.condition(textCondition(["messageTemplateId", "templateName"], term))
        if (p.purposeEnumId) query = query.condition("purposeEnumId", p.purposeEnumId)
        return Array.from(query.list()).map(row => ({
            value: row.messageTemplateId,
            label: row.templateName || row.messageTemplateId
        }))
    },
    // P3: the email templates a list's policy or binding may name (Comms' templates arrive in P6), by id or description
    emailTemplates: (userScope, term, selected) => {
        let query = find("moqui.basic.email.EmailTemplate").orderBy("^description").limit(choiceLimit)
        if (term) query = query.condition(textCondition(["emailTemplateId", "description"], term))
        const options = Array.from(query.list()).map(row => ({
            value: row.emailTemplateId,
            label: row.description || row.emailTemplateId
        }))
        return withSelected(
            options,
            selected,
            id => !!one("moqui.basic.email.EmailTemplate", {emailTemplateId: id}),
            id => one("moqui.basic.email.EmailTemplate", {emailTemplateId: id})?.description || id
        )
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
    },
    // P5: the segments of the scope by id or name, for an audience reader
    {
        kind: "segment",
        rows: (userScope, text, limit) => {
            if (!userScope.capabilities.audienceRead) return []
            const ids = organizationIds(userScope)
            if (!ids.length) return []
            const path = sharedPath("Marketing", "Audiences/SegmentDetail")
            return Array.from(
                find("mantle.marketing.segment.MarketSegment")
                    .condition("ownerPartyId", "in", ids)
                    .condition(textCondition(["marketSegmentId", "segmentName", "description"], text))
                    .orderBy("^segmentName")
                    .limit(limit)
                    .list()
            ).map(row => ({
                title: segmentLabel(row),
                subtitle: "Segment · " + organizationName(row.ownerPartyId),
                icon: recordKinds.segment.icon,
                url: path + "?marketSegmentId=" + encodeURIComponent(row.marketSegmentId),
                recordEntity: "mantle.marketing.segment.MarketSegment",
                recordId: row.marketSegmentId
            }))
        }
    },
    // P3: the lists of the scope by id or name, for an audience reader
    {
        kind: "list",
        rows: (userScope, text, limit) => {
            if (!userScope.capabilities.audienceRead) return []
            const ids = organizationIds(userScope)
            if (!ids.length) return []
            const path = sharedPath("Marketing", "Audiences/ListDetail")
            return Array.from(
                find("mantle.marketing.contact.ContactList")
                    .condition("ownerPartyId", "in", ids)
                    .condition("contactListTypeEnumId", "in", ["MARKETING", "NEWSLETTER", "ANNOUNCEMENT"])
                    .condition(textCondition(["contactListId", "contactListName"], text))
                    .orderBy("^contactListName")
                    .limit(limit)
                    .list()
            ).map(row => ({
                title: row.contactListName || row.contactListId,
                subtitle: "List · " + organizationName(row.ownerPartyId),
                icon: recordKinds.list.icon,
                url: path + "?contactListId=" + encodeURIComponent(row.contactListId),
                recordEntity: "mantle.marketing.contact.ContactList",
                recordId: row.contactListId
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
