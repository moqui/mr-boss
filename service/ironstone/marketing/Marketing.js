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
const segments = () => ec.resource.script("component://mr-mantle/service/mantle/marketing/MarketingSegments.js")
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
    // P6: Sends (Comms' templates; P8 the sends), the authors', approvers' and dispatchers' (BOSS_MKT_SENDS)
    sends: "Sends",
    // P11: Automations, the authors', approvers', dispatchers' and audience managers' (BOSS_MKT_AUTOMATIONS)
    automations: "Automations",
    // P12: Surveys (the builder, distribution and responses), the authors', audience managers' and analysts' (BOSS_MKT_SURVEYS)
    surveys: "Surveys",
    // P13: LeadRules (the lead forms' routing to Sales and their handoffs), the authors' (BOSS_MKT_LEAD_RULES)
    leadRules: "Leads/LeadRules",
    // P20: Reports (the catalog and the four reports), the report readers' (BOSS_MKT_REPORTS)
    reports: "Reports"
}
// The capability an area's screens' services also ask, so a custom group given Marketing in Admin, which is no member of
// BOSS_MARKETING and not reached by the area's deny, is shown no area its services refuse (impl-maintenance F346's lesson).
const areaReads = {
    settings: "configure",
    approvals: "approve",
    audiences: "audienceRead",
    audiencePreview: "previewRead",
    sends: "sendsRead",
    automations: "automationRead",
    surveys: "surveyRead",
    leadRules: "leadRuleRead",
    // P20
    reports: "reportRead"
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
    // P8: the sends are read by a Marketing reader who writes, approves or dispatches them (design §2: authors, approvers and
    // dispatchers work there; Mantle's get#Send reads for any Marketing reader of the organization), the templates by their readers
    capabilities.sendRead = !!capabilities.anyRead && !!(capabilities.sendEdit || capabilities.approve || capabilities.dispatch)
    capabilities.sendsRead = capabilities.templateRead || capabilities.sendRead
    // P11: the automations and their enrollments are read by a Marketing reader who writes, approves or dispatches sends or reads
    // audiences (design §2: AutomationDetail A, V, D; EnrollmentDetail D, U), as Mantle's AutomationServices ask
    capabilities.automationRead =
        !!capabilities.anyRead &&
        !!(capabilities.sendEdit || capabilities.approve || capabilities.dispatch || capabilities.audienceRead)
    // P12: the surveys are read by a Marketing reader who edits content or reads audiences or reports (design §2: Surveys and
    // SurveyDetail the survey readers and editors, SurveyDistribution A, Responses U and R), as Marketing's form purposes admit
    capabilities.surveyRead =
        !!capabilities.anyRead && !!(capabilities.contentEdit || capabilities.audienceRead || capabilities.reportRead)
    // P13: the lead rules are read by a content author or the administrator (design §2 LeadRules: A, S), as Mantle's find#LeadRules
    // asks; a lead's own pipeline stays Sales' (the user's Sales read, Leads' mount)
    capabilities.leadRuleRead = !!capabilities.anyRead && !!(capabilities.contentEdit || capabilities.configure)
    // P14: the content (campaign content, blog posts, landing pages, Knowledge) is every Marketing reader's (design §2: Content,
    // BlogPosts and LandingPages the app's), edited with MARKETING_CONTENT_EDIT; the wiki's own rules decide each page
    capabilities.contentRead = !!capabilities.anyRead
    // P16: the events are every Marketing reader's (design §2 Events: the app's); their registration setup the events managers'
    // (design §2 RegistrationSetup: E), MARKETING_EVENT_MANAGE, as Mantle's EventRegistrationServices ask; the event itself stays the
    // calendar's (its organizer and its calendars' editors)
    capabilities.eventRead = !!capabilities.anyRead
    capabilities.eventSetupRead = !!capabilities.anyRead && !!capabilities.eventManage
    // P17: the registrations and their attendees are the events managers' (design §2 Registrations, RegistrationDetail: E), as Mantle's
    // EventRegistrationServices ask
    capabilities.registrationRead = !!capabilities.anyRead && !!capabilities.eventManage
    // P18: check-in under a staff sign-in is the events managers' (design §2 CheckIn: E), as Mantle's preview#CheckIn and
    // checkIn#Registration ask; a door tablet's display account is no Marketing user and gets no context (screen/Marketing.xml)
    capabilities.checkInRead = !!capabilities.anyRead && !!capabilities.eventManage
    // P19: the store promotions (Commerce's shared promotion screens in Marketing's registration) are read with Commerce's COMMERCE_VIEW
    // and changed with its COMMERCE_PROMOTION_EDIT, as Mantle's StorePromotionServices ask (design §7: the Commerce promotion
    // permissions decide every read and write); the menu entry shows only when a store of the user's Marketing organizations is
    // within Commerce's store scope (promotions). Customer360 and ContactDetail are the audience readers' (design §2: U), each
    // engagement source answering with its own permission (get#Engagement)
    capabilities.promotionRead = !!capabilities.anyRead && access.has("COMMERCE_VIEW")
    capabilities.promotionEdit = capabilities.promotionRead && access.has("COMMERCE_PROMOTION_EDIT")
    capabilities.promotions = capabilities.promotionRead && promotionStoreIds(mantle, null, 1).length > 0
    capabilities.customerRead = !!capabilities.anyRead && !!capabilities.audienceRead
    for (const [name, area] of Object.entries(areas))
        capabilities[name] = areaGrant(grants, area) && (!areaReads[name] || !!capabilities[areaReads[name]])
    // Follow-up 9: a send's places (SendDetail, CampaignDelivery) are linked only for a user who may open them: the Sends area's
    // screen grant (sends, as SendDetail's own authorization) and a reader of sends (sendRead, as the palette and the sends ask); anyone
    // else (the events manager, an analyst) sees a send it shows unlinked
    capabilities.sendLink = !!capabilities.sends && !!capabilities.sendRead
    return {read: grants.read, mantle: mantle || {organizationPartyIds: [], capabilities: {}}, capabilities}
}
// P19: the stores a Marketing user works promotions of: Commerce's store scope (StoreAdmin.js: COMMERCE_VIEW, the user's organizations, a
// store-limited staff member's own stores) within the organizations of the user's Marketing scope; none without COMMERCE_VIEW.
function promotionStoreIds(mantle, term, limit) {
    if (!mantle || !access.has("COMMERCE_VIEW")) return []
    const stores = ec.resource.script("component://mr-mantle/service/mantle/product/StoreAdmin.js")
    let storeScope
    try {
        storeScope = stores.storeQuery(stores.scope("view"))
    } catch (error) {
        if (lib.reasonCode(error) === "PERMISSION_DENIED") return []
        throw error
    }
    const ids = marketingAccess.organizationIds(mantle)
    if (!ids.length) return []
    let query = storeScope.condition("organizationPartyId", "in", ids).orderBy("^storeName")
    if (term) query = query.condition(textCondition(["productStoreId", "storeName"], term))
    if (limit) query = query.limit(limit)
    return Array.from(query.list()).map(row => ({
        value: row.productStoreId,
        label: row.storeName || row.productStoreId,
        organizationPartyId: row.organizationPartyId
    }))
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
    "Settings/SendingProfiles",
    // P8: the sends and the composer (design §5)
    "Sends/Sends",
    "Sends/SendDetail",
    "Sends/Compose",
    // P9: a send's delivery and one recipient (design §5 CampaignDelivery, RecipientDetail)
    "Sends/CampaignDelivery",
    "Sends/RecipientDetail",
    // P10: a send's experiment (design §5 ExperimentDetail)
    "Sends/ExperimentDetail",
    // P11: the automations, one automation and one enrollment (design §6)
    "Automations",
    "Automations/Automations",
    "Automations/AutomationDetail",
    "Automations/EnrollmentDetail",
    // P12: the surveys, one survey, its distribution, the responses and one response (design §10)
    "Surveys",
    "Surveys/Surveys",
    "Surveys/SurveyDetail",
    "Surveys/SurveyDistribution",
    "Surveys/Responses",
    "Surveys/ResponseDetail",
    // P13: the lead rules and one rule (design §10 LeadRules), and Sales' LeadSources mounted in Settings (design §12)
    "Leads/LeadRules",
    "Leads/LeadRuleDetail",
    "Settings/LeadSources",
    // P14: the content, one content link, the blog posts, one post, the landing pages (Shared/Pages), one page (Shared/PageDetail) and
    // Commons Knowledge (design §8)
    "Content",
    "Content/Content",
    "Content/ContentDetail",
    "Content/BlogPosts",
    "Content/BlogPostDetail",
    "Content/LandingPages",
    "Content/PageDetail",
    "Content/Knowledge",
    // P15: the tracking links
    "Content/TrackingLinks",
    "Content/TrackingLinkDetail",
    // P16: the events, one event (Commons' EventDetail), its registration setup and quick create's event (design §9)
    "Events",
    "Events/Events",
    "Events/EventDetail",
    "Events/RegistrationSetup",
    "QuickCreate/NewEvent",
    // P17: the registrations of an offer or event and one registration (design §9 Registrations, RegistrationDetail)
    "Events/Registrations",
    "Events/RegistrationDetail",
    // P18: an offer's check-in (design §9 CheckIn)
    "Events/CheckIn",
    // P20: the reports (design §11)
    "Reports",
    "Reports/Catalog",
    "Reports/CampaignPerformance",
    "Reports/DeliveryAnalysis",
    "Reports/AudienceGrowth",
    "Reports/Attribution",
    // P19: Commerce's shared promotion screens in Marketing's registration (design §7; PromoCodeDetail a sibling, as Commerce mounts it),
    // the shared Customer360 with Marketing's Engagement tab and the Commons contact record (design §10)
    "Promotions",
    "Promotions/Promotions",
    "Promotions/PromotionDetail",
    "Promotions/PromoCodes",
    "Promotions/PromoCodeDetail",
    "Customers",
    "Customers/Customer360",
    "Contacts/ContactDetail",
    // P21: the campaign calendar, quick create's send and Assist's answer actions (design §3 Calendar, §14.3 QuickCreate, §1.3)
    "Calendar",
    "QuickCreate/NewSend",
    "LogNote",
    "SendMessage"
]
// Follow-up 9: the places of a send, linked only for a user who may open them (capabilities.sendLink)
const sendPaths = ["Sends/SendDetail", "Sends/CampaignDelivery"]
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
        // follow-up 9: a send's places only for a user who may open them (sendLink); null for anyone else, who sees the send unlinked
        sharedLinks: Object.fromEntries(
            linkPaths.map(path => [
                path,
                sendPaths.includes(path) && !userScope.capabilities.sendLink ? null : linkBase + "/" + path
            ])
        )
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
    },
    // P8: a send (CampaignSend), by its organization: SendDetail
    send: {
        name: "Send",
        icon: "sym_o_forward_to_inbox",
        destination: {path: "Sends/SendDetail", parameter: "campaignSendId", capability: "sendLink"},
        read: (userScope, campaignSendId) => {
            if (!userScope.capabilities.anyRead) return null
            const row = one(SEND, {campaignSendId})
            if (!row || !covers(userScope, row.organizationPartyId)) return null
            return {
                organizationPartyId: row.organizationPartyId,
                label: row.sendName || campaignSendId,
                detail: statusName(row.statusId)
            }
        }
    },
    // P11: an automation and an enrollment, by their organization, for a reader of automations: AutomationDetail, EnrollmentDetail
    automation: {
        name: "Automation",
        icon: "sym_o_route",
        destination: {path: "Automations/AutomationDetail", parameter: "marketingAutomationId"},
        read: (userScope, marketingAutomationId) => {
            if (!userScope.capabilities.automationRead) return null
            const row = one(AUTOMATION, {marketingAutomationId})
            if (!row || !covers(userScope, row.organizationPartyId)) return null
            return {
                organizationPartyId: row.organizationPartyId,
                label: row.automationName || marketingAutomationId,
                detail: statusName(row.statusId)
            }
        }
    },
    enrollment: {
        name: "Enrollment",
        icon: "sym_o_person_play",
        destination: {path: "Automations/EnrollmentDetail", parameter: "automationEnrollmentId"},
        read: (userScope, automationEnrollmentId) => {
            if (!userScope.capabilities.automationRead) return null
            const row = one("mantle.marketing.automation.AutomationEnrollment", {automationEnrollmentId})
            if (!row || !covers(userScope, row.organizationPartyId)) return null
            const automation = one(AUTOMATION, {marketingAutomationId: row.marketingAutomationId})
            return {
                organizationPartyId: row.organizationPartyId,
                label: "Enrollment " + automationEnrollmentId + " · " + (automation?.automationName || row.marketingAutomationId),
                detail: statusName(row.statusId)
            }
        }
    },
    // P15: a tracking link (TrackingCode), by its organization (a legacy code's campaign's): TrackingLinkDetail
    trackingLink: {
        name: "Tracking link",
        icon: "sym_o_link",
        destination: {path: "Content/TrackingLinkDetail", parameter: "trackingCodeId"},
        read: (userScope, trackingCodeId) => {
            if (!userScope.capabilities.anyRead) return null
            const row = one("mantle.marketing.tracking.TrackingCode", {trackingCodeId})
            const organizationPartyId =
                row?.organizationPartyId ||
                (row?.marketingCampaignId
                    ? one(CAMPAIGN, {marketingCampaignId: row.marketingCampaignId})?.organizationPartyId
                    : null)
            if (!row || !covers(userScope, organizationPartyId)) return null
            return {
                organizationPartyId,
                label: "Tracking link " + trackingCodeId + " · " + (row.description || row.publicCode || ""),
                detail: row.redirectUrl || ""
            }
        }
    },
    // P17: an attendee's registration (mantle.work.registration.EventRegistration), by its offer's organization, for an events manager
    registration: {
        name: "Registration",
        icon: "sym_o_how_to_reg",
        destination: {path: "Events/RegistrationDetail", parameter: "registrationId"},
        read: (userScope, registrationId) => {
            if (!userScope.capabilities.eventManage) return null
            const row = one("mantle.work.registration.EventRegistration", {registrationId})
            const policy = row
                ? one("mantle.work.registration.EventRegistrationPolicy", {registrationPolicyId: row.registrationPolicyId})
                : null
            if (!policy || !covers(userScope, policy.organizationPartyId)) return null
            return {
                organizationPartyId: policy.organizationPartyId,
                label: "Registration " + registrationId + " · " + (policy.publicTitle || ""),
                detail: row.statusId || ""
            }
        }
    },
    // P16: a registration event (mantle.work.registration.RegistrationEvent), by the organization that offers it: RegistrationSetup
    event: {
        name: "Event",
        icon: "sym_o_event",
        destination: {path: "Events/RegistrationSetup", parameter: "workEffortId"},
        read: (userScope, workEffortId) => {
            if (!userScope.capabilities.anyRead) return null
            const row = one("mantle.work.registration.RegistrationEvent", {workEffortId})
            const event = row ? one("mantle.work.effort.WorkEffort", {workEffortId}) : null
            if (!event || !covers(userScope, row.organizationPartyId)) return null
            return {
                organizationPartyId: row.organizationPartyId,
                label: "Event " + workEffortId + " · " + (event.workEffortName || ""),
                detail: event.location || ""
            }
        }
    },
    // P14: a campaign's content link (CampaignContent), by its organization: ContentDetail
    content: {
        name: "Content",
        icon: "sym_o_article",
        destination: {path: "Content/ContentDetail", parameter: "campaignContentId"},
        read: (userScope, campaignContentId) => {
            if (!userScope.capabilities.anyRead) return null
            const row = one("mantle.marketing.campaign.CampaignContent", {campaignContentId})
            if (!row || !covers(userScope, row.organizationPartyId)) return null
            const campaign = one(CAMPAIGN, {marketingCampaignId: row.marketingCampaignId})
            return {
                organizationPartyId: row.organizationPartyId,
                label: "Content " + campaignContentId + " · " + (campaign?.campaignName || row.marketingCampaignId),
                detail: row.useText || ""
            }
        }
    },
    // P19: a person or organization of the scope's audiences (Customer360 and ContactDetail, design §10): an audience reader's, a
    // directory party (never another user's personal contact, an internal organization or a disabled one) shared or owned by an
    // organization of the scope, and (P19 review) one Marketing of the scope already knows: a list member, a subscription request,
    // a segment member, a recipient, a registrant or a form submitter of an organization of the scope (audienceParty). The record's
    // notes and files open under this root on this check, so it is no wider than the audiences, as Sales' are its accounts and
    // their contacts; each engagement source and the contact record check their own rights again
    contact: {
        name: "Contact",
        icon: "sym_o_person",
        destination: {path: "Customers/Customer360", parameter: "customerPartyId"},
        read: (userScope, partyId) => {
            if (!userScope.capabilities.customerRead) return null
            const party = directoryParty(userScope, partyId) && audienceParty(userScope, partyId)
            return party
                ? {organizationPartyId: null, label: lib.partyNames([partyId])[partyId] || partyId, detail: "Contact"}
                : null
        }
    },
    // P19: a customer a promotion code may be limited to (PromoCodeDetail's Customers in Marketing's registration): a Customer-role
    // directory party of the scope, for a holder of Commerce's promotion permission (Commerce's own customer rule, Marketing's
    // organizations); Mantle's store#PromoCodeParty checks the party again
    promotionCustomer: {
        name: "Customer",
        icon: "sym_o_person",
        destination: null,
        read: (userScope, partyId) => {
            if (!userScope.capabilities.promotionEdit) return null
            const party = directoryParty(userScope, partyId)
            if (!party || !one("mantle.party.PartyRole", {partyId, roleTypeId: "Customer"})) return null
            return {organizationPartyId: null, label: lib.partyNames([partyId])[partyId] || partyId, detail: "Customer"}
        }
    }
}
// P19: a directory party the scope reaches: found, not disabled, not another user's personal contact, not an internal organization,
// shared (_NA_ or no owner) or owned by an organization of the scope.
function directoryParty(userScope, partyId) {
    const party = partyId ? one("mantle.party.Party", {partyId}) : null
    if (!party || party.disabled === "Y") return null
    if (party.privateOwnerUserId && party.privateOwnerUserId !== ec.user.userId) return null
    if (one("mantle.party.PartyRole", {partyId, roleTypeId: "OrgInternal"})) return null
    if (party.ownerPartyId && party.ownerPartyId !== "_NA_" && !covers(userScope, party.ownerPartyId)) return null
    return party
}
// P19 review: whether a party is in the scope's audiences: a member (any state) of a list of an organization of the scope that is not
// a mailbox, a subscription request, explicit segment member, recipient, registrant (attendee or buyer) or submitter to a Marketing
// form of one.
function audienceParty(userScope, partyId) {
    const idsOf = (entityName, conditions, field) =>
        Array.from(find(entityName, conditions).selectField(field).distinct(true).list())
            .map(row => row[field])
            .filter(Boolean)
    const ownedIn = (entityName, keyField, keys, ownerField, also = () => true) =>
        keys.length > 0 &&
        Array.from(find(entityName).condition(keyField, "in", keys).list()).some(
            row => also(row) && covers(userScope, row[ownerField])
        )
    const P = "mantle.marketing."
    if (
        ownedIn(
            P + "contact.ContactList",
            "contactListId",
            idsOf(P + "contact.ContactListParty", {partyId}, "contactListId"),
            "ownerPartyId",
            row => row.contactListTypeEnumId !== "MAILBOX"
        )
    )
        return true
    if (idsOf(P + "contact.SubscriptionRequest", {partyId}, "organizationPartyId").some(id => covers(userScope, id))) return true
    if (
        ownedIn(
            P + "segment.MarketSegment",
            "marketSegmentId",
            idsOf(P + "segment.MarketSegmentParty", {partyId}, "marketSegmentId"),
            "ownerPartyId"
        )
    )
        return true
    if (
        ownedIn(
            SEND,
            "campaignSendId",
            idsOf(P + "campaign.CampaignRecipient", {partyId}, "campaignSendId"),
            "organizationPartyId"
        )
    )
        return true
    const policyIds = idsOf(
        "mantle.work.registration.EventRegistration",
        {attendeePartyId: partyId},
        "registrationPolicyId"
    ).concat(idsOf("mantle.work.registration.EventRegistration", {buyerPartyId: partyId}, "registrationPolicyId"))
    if (ownedIn("mantle.work.registration.EventRegistrationPolicy", "registrationPolicyId", policyIds, "organizationPartyId"))
        return true
    return ownedIn(
        "mantle.party.FormPublication",
        "publicationId",
        idsOf("mantle.party.FormSubmission", {partyId}, "publicationId"),
        "organizationPartyId",
        row => ["FppSurvey", "FppLead", "FppRegistration"].includes(row.purposeEnumId)
    )
}
const SEND = "mantle.marketing.campaign.CampaignSend"
const AUTOMATION = "mantle.marketing.automation.MarketingAutomation"
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

// check#Contacts: of a page of parties (Accounts under Marketing), those check#Record contact admits, with one scope: the rows that
// link to Marketing's Customer360. A user who reads no Marketing contact gets none.
function checkContacts(p) {
    const userScope = scope()
    if (!userScope.read || !userScope.capabilities.customerRead) return []
    return Array.from(new Set(p.partyIds || [])).filter(partyId => partyId && !!recordKinds.contact.read(userScope, partyId))
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
// The people on a topic (a send's or an automation's, whose organization the caller checked) to preview or enroll, by name: never
// another user's personal contact, a disabled or a merged party (Mantle's preview#Send and enroll#Party refuse them too; P8 review).
// The topic is never taken from the request (P11 review).
function topicMembers(contactListId, term, selected) {
    let partyIds = Array.from(
        find("mantle.marketing.contact.ContactListParty", {contactListId})
            .condition(ec.entity.conditionFactory.makeConditionDate("fromDate", "thruDate", null))
            .selectField("partyId")
            .distinct(true)
            .limit(500)
            .list()
    ).map(row => row.partyId)
    const inScope = segments().inScopeParties(partyIds)
    partyIds = partyIds.filter(partyId => inScope.has(partyId))
    if (!partyIds.length) return []
    let query = find("mantle.party.Person").condition("partyId", "in", partyIds).orderBy("^firstName").limit(choiceLimit)
    if (term) query = query.condition(textCondition(["firstName", "lastName"], term))
    const options = Array.from(query.list()).map(row => ({
        value: row.partyId,
        label: [row.firstName, row.lastName].filter(Boolean).join(" ") || row.partyId
    }))
    return withSelected(
        options,
        selected,
        partyId => partyIds.includes(partyId),
        partyId => lib.partyNames([partyId])[partyId] || partyId
    )
}
// ===== Marketing P22: text messages =====
// The organizations among ids with an SMS sending profile in effect, promotional or for both, that is ready (MessageSendingProfiles.js).
function smsReadyOrganizations(ids) {
    const profiles = ec.resource.script("component://mr-mantle/service/mantle/party/MessageSendingProfiles.js")
    const factory = ec.entity.conditionFactory
    const ready = new Set()
    for (const row of Array.from(
        find("mantle.party.MessageSendingProfile")
            .condition("organizationPartyId", "in", ids)
            .condition("channelEnumId", "MdcSms")
            .condition(factory.makeCondition("purposeEnumId", "not-equals", "MtpTransactional", true))
            .condition(factory.makeCondition("thruDate", "greater", ec.user.nowTimestamp, true))
            .limit(50)
            .list()
    ))
        if (!ready.has(row.organizationPartyId) && profiles.readinessOf(row).ready) ready.add(row.organizationPartyId)
    return Array.from(ready)
}
// ===== end of P22 =====
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
    // P8: the topics a send may take: the organization's Marketing lists of email, not archived, by name; P22: its lists of phone
    // numbers too (a text message send) once one of its SMS sending profiles is ready (design §5 NewSend)
    sendTopics: (userScope, term, selected, p) => {
        const ids = choiceOrganizations(userScope, p)
        if (!ids.length) return []
        const factory = ec.entity.conditionFactory
        const smsReady = smsReadyOrganizations(ids)
        let query = find("mantle.marketing.contact.ContactList")
            .condition("ownerPartyId", "in", ids)
            .condition("contactListTypeEnumId", "in", ["MARKETING", "NEWSLETTER", "ANNOUNCEMENT"])
            .condition(factory.makeCondition("archivedDate", "greater", ec.user.nowTimestamp, true))
            .orderBy("^contactListName")
            .limit(choiceLimit)
        if (!smsReady.length)
            query = query.condition(factory.makeCondition("contactMechTypeEnumId", "not-equals", "CmtTelecomNumber", true))
        if (term) query = query.condition(textCondition(["contactListId", "contactListName"], term))
        const options = Array.from(query.list())
            .filter(row => row.contactMechTypeEnumId !== "CmtTelecomNumber" || smsReady.includes(row.ownerPartyId))
            .map(row => ({
                value: row.contactListId,
                label:
                    (row.contactListName || row.contactListId) +
                    (row.contactMechTypeEnumId === "CmtTelecomNumber" ? " · text messages" : "")
            }))
        return withSelected(
            options,
            selected,
            id => !!recordKinds.list.read(userScope, id),
            id => one("mantle.marketing.contact.ContactList", {contactListId: id})?.contactListName || id
        )
    },
    // P8: the sending profiles a promotional send may name: the organization's, in effect, promotional or for both, by name
    sendProfiles: (userScope, term, selected, p) => {
        if (!userScope.capabilities.profileRead) return []
        const ids = choiceOrganizations(userScope, p)
        if (!ids.length) return []
        const factory = ec.entity.conditionFactory
        let query = find("mantle.party.MessageSendingProfile")
            .condition("organizationPartyId", "in", ids)
            .condition(factory.makeCondition("purposeEnumId", "not-equals", "MtpTransactional", true))
            .condition(factory.makeCondition("thruDate", "greater", ec.user.nowTimestamp, true))
            .orderBy("^profileName")
            .limit(choiceLimit)
        if (term) query = query.condition(textCondition(["sendingProfileId", "profileName"], term))
        return Array.from(query.list()).map(row => ({
            value: row.sendingProfileId,
            // P22: an SMS profile named as one
            label: (row.profileName || row.sendingProfileId) + (row.channelEnumId === "MdcSms" ? " · text messages" : "")
        }))
    },
    // P8: the files a send's message may attach: the send's own and its campaign's, by name (each the caller sees through the send)
    sendFiles: (userScope, term, selected, p) => {
        const send = p.campaignSendId ? one(SEND, {campaignSendId: p.campaignSendId}) : null
        if (!send || !userScope.capabilities.sendEdit || !covers(userScope, send.organizationPartyId)) return []
        const files = Array.from(
            find("mantle.marketing.campaign.CampaignSendContent", {campaignSendId: send.campaignSendId}).list()
        )
            .concat(
                Array.from(
                    find("mantle.marketing.campaign.CampaignAsset", {marketingCampaignId: send.marketingCampaignId}).list()
                )
            )
            .filter(row => row.contentLocation && row.thruDate == null)
        const seen = new Set()
        const options = []
        for (const row of files) {
            if (seen.has(row.contentLocation)) continue
            seen.add(row.contentLocation)
            const name = String(row.contentLocation).split("/").pop()
            if (term && !name.toLowerCase().includes(term.toLowerCase())) continue
            options.push({value: row.contentLocation, label: name + (row.campaignAssetId ? " · campaign" : "")})
        }
        return options.slice(0, choiceLimit)
    },
    // P8: a person on a send's topic to preview it as, by name, for an audience reader (MARKETING_AUDIENCE_VIEW; Mantle's preview#Send
    // checks it and the topic again)
    sendMembers: (userScope, term, selected, p) => {
        const send = p.campaignSendId ? one(SEND, {campaignSendId: p.campaignSendId}) : null
        if (!send || !userScope.capabilities.audienceRead || !covers(userScope, send.organizationPartyId)) return []
        return topicMembers(send.contactListId, term, selected)
    },
    // P11: the stores of the organization named an order or cart trigger may read, by name
    automationStores: (userScope, term, selected, p) => {
        if (!userScope.capabilities.automationRead) return []
        const ids = choiceOrganizations(userScope, p)
        if (!ids.length) return []
        let query = find("mantle.product.store.ProductStore")
            .condition("organizationPartyId", "in", ids)
            .orderBy("^storeName")
            .limit(choiceLimit)
        if (term) query = query.condition(textCondition(["productStoreId", "storeName"], term))
        return Array.from(query.list()).map(row => ({value: row.productStoreId, label: row.storeName || row.productStoreId}))
    },
    // P11: a person on an automation's topic to enroll or simulate, by name, for an audience reader (Mantle's enroll#Party and
    // preview#Automation check it and the person again)
    automationMembers: (userScope, term, selected, p) => {
        const automation = p.marketingAutomationId ? one(AUTOMATION, {marketingAutomationId: p.marketingAutomationId}) : null
        if (!automation || !userScope.capabilities.audienceRead || !covers(userScope, automation.organizationPartyId)) return []
        return topicMembers(automation.contactListId, term, selected)
    },
    // P14: the sites whose Marketing mount serves an organization of the scope (Shared/Pages' site choice), by name
    sites: (userScope, term, selected) => {
        const ids = organizationIds(userScope)
        if (!ids.length) return []
        const siteIds = Array.from(
            find("mantle.public.PublicSiteApp")
                .condition("app", "marketing")
                .condition("targetId", "in", ids)
                .selectField("siteId")
                .list()
        ).map(row => row.siteId)
        if (!siteIds.length) return []
        let query = find("mantle.public.PublicSite").condition("siteId", "in", siteIds).orderBy("^name").limit(choiceLimit)
        if (term) query = query.condition(textCondition(["siteId", "name"], term))
        const options = Array.from(query.list()).map(row => ({value: row.siteId, label: row.name || row.siteId}))
        return withSelected(
            options,
            selected,
            siteId => siteIds.includes(siteId),
            siteId => one("mantle.public.PublicSite", {siteId})?.name || siteId
        )
    },
    // P14: the wiki spaces the user may write a post in (the wiki's update right), by description
    blogSpaces: (userScope, term, selected) => {
        const spaces = Array.from(
            ec.service
                .sync()
                .name("org.moqui.resource.WikiServices.get#UserWikiSpaces")
                .parameters({userId: ec.user.userId})
                .call()?.wikiSpaceAndUserList || []
        )
        const writable = spaces.filter(
            space =>
                ec.service
                    .sync()
                    .name("org.moqui.resource.WikiServices.get#WikiPageAccess")
                    .parameters({wikiSpaceId: space.wikiSpaceId})
                    .call()?.canUpdate
        )
        const options = writable
            .map(space => ({value: space.wikiSpaceId, label: space.description || space.wikiSpaceId}))
            .filter(option => !term || option.label.toLowerCase().includes(term.toLowerCase()) || option.value.includes(term))
            .sort((a, b) => a.label.localeCompare(b.label))
            .slice(0, choiceLimit)
        return withSelected(
            options,
            selected,
            id => writable.some(space => space.wikiSpaceId === id),
            id => id
        )
    },
    // P14: the blog categories (WikiPageCategory), by name
    blogCategories: (userScope, term, selected) => {
        let query = find("moqui.resource.wiki.WikiPageCategory").orderBy("^categoryName").limit(choiceLimit)
        if (term) query = query.condition(textCondition(["wikiPageCategoryId", "categoryName"], term))
        const options = Array.from(query.list()).map(row => ({
            value: row.wikiPageCategoryId,
            label: row.categoryName || row.wikiPageCategoryId
        }))
        return withSelected(
            options,
            selected,
            id => !!one("moqui.resource.wiki.WikiPageCategory", {wikiPageCategoryId: id}),
            id => one("moqui.resource.wiki.WikiPageCategory", {wikiPageCategoryId: id})?.categoryName || id
        )
    },
    // P14: the pages of a space the user may view (a post from a page), by path
    spacePages: (userScope, term, selected, p) => {
        if (!p.wikiSpaceId) return []
        const access = ec.service
            .sync()
            .name("org.moqui.resource.WikiServices.get#WikiPageAccess")
            .parameters({wikiSpaceId: p.wikiSpaceId})
            .call()
        if (!access?.canView) return []
        let query = find("moqui.resource.wiki.WikiPage", {wikiSpaceId: p.wikiSpaceId}).orderBy("pagePath").limit(choiceLimit)
        if (term) query = query.condition(textCondition(["pagePath"], term))
        return Array.from(query.list())
            .filter(row => row.restrictView !== "Y")
            .map(row => ({value: row.wikiPageId, label: row.pagePath || row.wikiPageId}))
    },
    // P14: the content a campaign may link, of a kind (Mantle's store#CampaignContent checks each again): the blog posts the user may
    // view, the landing pages of the campaign's organization, the campaign's files
    contentSources: (userScope, term, selected, p) => {
        const kind = p.contentKindEnumId
        const campaign = p.marketingCampaignId ? one(CAMPAIGN, {marketingCampaignId: p.marketingCampaignId}) : null
        if (kind === "CckBlogPost") {
            const out = ec.service
                .sync()
                .name("mantle.marketing.MarketingContentServices.find#BlogPosts")
                .parameters({term: term || null, pageSize: choiceLimit})
                .call()
            return Array.from(out?.posts || []).map(post => ({
                value: post.wikiBlogId,
                label: post.title + " · " + post.spaceName
            }))
        }
        if (!campaign || !covers(userScope, campaign.organizationPartyId)) return []
        if (kind === "CckSitePage") {
            const mounts = Array.from(
                find("mantle.public.PublicSiteApp", {app: "marketing", targetId: campaign.organizationPartyId}).list()
            )
            if (!mounts.length) return []
            const factory = ec.entity.conditionFactory
            let query = find("mantle.public.PublicSitePage")
                .condition(
                    factory.makeCondition(
                        mounts.map(mount =>
                            factory.makeCondition(
                                [
                                    factory.makeCondition("siteId", "equals", mount.siteId),
                                    factory.makeCondition("appMountId", "equals", mount.appMountId)
                                ],
                                "and"
                            )
                        ),
                        "or"
                    )
                )
                .orderBy("^title")
                .limit(choiceLimit)
            if (term) query = query.condition(textCondition(["title", "routePath"], term))
            return Array.from(query.list()).map(row => ({
                value: row.sitePageId,
                label: (row.title || row.routePath) + " · /pages/" + row.routePath
            }))
        }
        if (kind === "CckFile")
            return Array.from(
                find("mantle.marketing.campaign.CampaignAsset", {marketingCampaignId: campaign.marketingCampaignId}).list()
            )
                .map(row => ({
                    value: row.campaignAssetId,
                    label:
                        row.description ||
                        String(row.contentLocation || "")
                            .split("/")
                            .pop()
                }))
                .filter(option => !term || option.label.toLowerCase().includes(term.toLowerCase()))
                .slice(0, choiceLimit)
        return []
    },
    // P15: an organization's current vocabulary of a kind (a UTM source, medium or content code, a tracking code type), of the named
    // campaign's organization or the scope's (Mantle's store#TrackingLink checks the value against the link's organization again)
    vocabulary: (userScope, term, selected, p) => {
        const kind = String(p.vocabularyKindEnumId || "")
        if (!["MvkUtmSource", "MvkUtmMedium", "MvkUtmContent", "MvkTrackingCodeType"].includes(kind)) return []
        const campaign = p.marketingCampaignId ? one(CAMPAIGN, {marketingCampaignId: p.marketingCampaignId}) : null
        const ids = campaign ? [campaign.organizationPartyId].filter(id => covers(userScope, id)) : organizationIds(userScope)
        if (!ids.length) return []
        const seen = new Set()
        const options = []
        for (const row of Array.from(
            find("mantle.marketing.campaign.MarketingVocabulary", {vocabularyKindEnumId: kind})
                .condition("organizationPartyId", "in", ids)
                .orderBy("sequenceNum")
                .orderBy("label")
                .limit(200)
                .list()
        )) {
            if (!lib.active(row)) continue
            const value = kind === "MvkTrackingCodeType" ? row.enumId : row.vocabularyCode
            if (!value || seen.has(value)) continue
            const label = (row.label || value) + (kind === "MvkTrackingCodeType" ? "" : " (" + value + ")")
            if (term && !label.toLowerCase().includes(term.toLowerCase())) continue
            seen.add(value)
            options.push({value, label})
        }
        return withSelected(
            options.slice(0, choiceLimit),
            selected,
            value => seen.has(value),
            value => value
        )
    },
    // P3: the email templates a list's policy or binding may name (Comms' templates arrive in P6), by id or description
    // P16 review: the registration events of the organization named, by name, for a campaign author's "Link an event" (the link is
    // C.store#CampaignAssociation's, which checks the campaign's edit and the event's organization again)
    registrationEvents: (userScope, term, selected, p) => {
        if (!userScope.capabilities.campaignEdit) return []
        const ids = choiceOrganizations(userScope, p)
        if (!ids.length) return []
        const eventIds = Array.from(
            find("mantle.work.registration.RegistrationEvent")
                .condition("organizationPartyId", "in", ids)
                .orderBy("-createdDate")
                .limit(500)
                .list()
        ).map(row => row.workEffortId)
        if (!eventIds.length) return []
        let query = find("mantle.work.effort.WorkEffort")
            .condition("workEffortId", "in", eventIds)
            .condition("statusId", "not-equals", "WeCancelled")
            .orderBy("-estimatedStartDate")
            .limit(choiceLimit)
        if (term) query = query.condition(textCondition(["workEffortId", "workEffortName"], term))
        return Array.from(query.list()).map(row => ({
            value: row.workEffortId,
            label:
                (row.workEffortName || row.workEffortId) +
                (row.estimatedStartDate ? " · " + lib.dateText(row.estimatedStartDate) : "")
        }))
    },
    // P18: the event registration offers (one occurrence each) of the organization named, by title, for an automation's and a lead
    // rule's registration and attendance triggers (AutomationServices and MarketingFormServices check the offer's organization again)
    registrationOffers: (userScope, term, selected, p) => {
        if (!userScope.capabilities.anyRead) return []
        const ids = choiceOrganizations(userScope, p)
        if (!ids.length) return []
        const label = row =>
            (row.publicTitle || row.registrationPolicyId) + (row.occurrenceStart ? " · " + lib.dateText(row.occurrenceStart) : "")
        let query = find("mantle.work.registration.EventRegistrationPolicy")
            .condition("organizationPartyId", "in", ids)
            .condition("statusId", "in", ["ErpPublished", "ErpClosed"])
            .orderBy("-occurrenceStart")
            .limit(choiceLimit)
        if (term) query = query.condition(textCondition(["registrationPolicyId", "publicTitle"], term))
        const options = Array.from(query.list()).map(row => ({value: row.registrationPolicyId, label: label(row)}))
        return withSelected(
            options,
            selected,
            id =>
                ids.includes(
                    one("mantle.work.registration.EventRegistrationPolicy", {registrationPolicyId: id})?.organizationPartyId
                ),
            id =>
                label(
                    one("mantle.work.registration.EventRegistrationPolicy", {registrationPolicyId: id}) || {
                        registrationPolicyId: id
                    }
                )
        )
    },
    // P16: the ticket products an event's organization sells (not kept in inventory), by name
    ticketProducts: (userScope, term, selected, p) => {
        if (!userScope.capabilities.eventManage) return []
        const ids = choiceOrganizations(userScope, p)
        if (!ids.length) return []
        const factory = ec.entity.conditionFactory
        let query = find("mantle.product.Product")
            .condition("ownerPartyId", "in", ids)
            .condition(factory.makeCondition("salesAllowed", "not-equals", "N", true))
            .condition(factory.makeCondition("requireInventory", "not-equals", "Y", true))
            .orderBy("^productName")
            .limit(choiceLimit)
        if (term) query = query.condition(textCondition(["productId", "pseudoId", "productName"], term))
        const label = row => (row.productName || row.productId) + " (" + (row.pseudoId || row.productId) + ")"
        const options = Array.from(query.list()).map(row => ({value: row.productId, label: label(row)}))
        return withSelected(
            options,
            selected,
            id => ids.includes(one("mantle.product.Product", {productId: id})?.ownerPartyId),
            id => label(one("mantle.product.Product", {productId: id}) || {productId: id})
        )
    },
    // P16: the registration questions (forms of purpose registration) of an event's organization, by name
    registrationForms: (userScope, term, selected, p) => {
        if (!userScope.capabilities.eventManage) return []
        const ids = choiceOrganizations(userScope, p)
        if (!ids.length) return []
        let query = find("moqui.screen.form.DbForm")
            .condition("purposeEnumId", "DbfpRegistration")
            .condition("ownerPartyId", "in", ids)
            .orderBy("^description")
            .limit(choiceLimit)
        if (term) query = query.condition(textCondition(["formId", "description"], term))
        return Array.from(query.list()).map(row => ({value: row.formId, label: row.description || row.formId}))
    },
    // P16: the stores of an event's organization (a store order), by name
    eventStores: (userScope, term, selected, p) => {
        if (!userScope.capabilities.eventManage) return []
        const ids = choiceOrganizations(userScope, p)
        if (!ids.length) return []
        let query = find("mantle.product.store.ProductStore")
            .condition("organizationPartyId", "in", ids)
            .orderBy("^storeName")
            .limit(choiceLimit)
        if (term) query = query.condition(textCondition(["productStoreId", "storeName"], term))
        return Array.from(query.list()).map(row => ({value: row.productStoreId, label: row.storeName || row.productStoreId}))
    },
    // P16: the email templates of an event's organization in use, for its notices, by name
    eventTemplates: (userScope, term, selected, p) => {
        if (!userScope.capabilities.eventManage) return []
        const ids = choiceOrganizations(userScope, p)
        if (!ids.length) return []
        const factory = ec.entity.conditionFactory
        let query = find("mantle.party.MessageTemplate")
            .condition("organizationPartyId", "in", ids)
            .condition("channelEnumId", "MdcEmail")
            .condition(factory.makeCondition("thruDate", "greater", ec.user.nowTimestamp, true))
            .orderBy("^templateName")
            .limit(choiceLimit)
        if (term) query = query.condition(textCondition(["messageTemplateId", "templateName"], term))
        return Array.from(query.list()).map(row => ({
            value: row.messageTemplateId,
            label: row.templateName || row.messageTemplateId
        }))
    },
    // P16: the transactional sending profiles of an event's organization, for its notices, by name
    eventProfiles: (userScope, term, selected, p) => {
        if (!userScope.capabilities.eventManage) return []
        const ids = choiceOrganizations(userScope, p)
        if (!ids.length) return []
        const factory = ec.entity.conditionFactory
        let query = find("mantle.party.MessageSendingProfile")
            .condition("organizationPartyId", "in", ids)
            .condition("channelEnumId", "MdcEmail")
            .condition(factory.makeCondition("purposeEnumId", "not-equals", "MtpPromotional", true))
            .condition(factory.makeCondition("thruDate", "greater", ec.user.nowTimestamp, true))
            .orderBy("^profileName")
            .limit(choiceLimit)
        if (term) query = query.condition(textCondition(["sendingProfileId", "profileName"], term))
        return Array.from(query.list()).map(row => ({
            value: row.sendingProfileId,
            label: row.profileName || row.sendingProfileId
        }))
    },
    // P16: the calendars the user may add an event to (edit or manage, not a subscription), by name
    eventCalendars: (userScope, term, selected) => {
        let query = find("mantle.work.calendar.Calendar")
            .condition(ec.entity.conditionFactory.makeCondition("calendarKindEnumId", "not-equals", "CalkSubscription", true))
            .orderBy("^calendarName")
            .limit(200)
        if (term) query = query.condition(textCondition(["calendarId", "calendarName"], term))
        const calendars = Array.from(query.list())
        if (!calendars.length) return []
        const access = ec.service
            .sync()
            .name("mantle.work.CalendarServices.check#CalendarAccess")
            .parameters({calendarIdList: calendars.map(row => row.calendarId)})
            .call()
        return calendars
            .filter(row => ["CalpEdit", "CalpManage"].includes(access?.permissionMap?.[row.calendarId]))
            .slice(0, choiceLimit)
            .map(row => ({value: row.calendarId, label: row.calendarName || row.calendarId}))
    },
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
    },
    // P20: a report's campaigns: every campaign of the organization named (or of the scope) but a cancelled one, by name; the selected
    // one's label when the user reads it
    reportCampaigns: (userScope, term, selected, p) => {
        const ids = choiceOrganizations(userScope, p)
        if (!ids.length) return []
        let query = find(CAMPAIGN)
            .condition("organizationPartyId", "in", ids)
            .condition("statusId", "not-equals", "MKTG_CAMP_CANCELLED")
            .orderBy("^campaignName")
            .limit(choiceLimit)
        if (term) query = query.condition(textCondition(["marketingCampaignId", "campaignName"], term))
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
    // P20: a report's sends: the released sends of the organization named (of one campaign when named), the latest first, by name
    reportSends: (userScope, term, selected, p) => {
        const ids = choiceOrganizations(userScope, p)
        if (!ids.length) return []
        let query = find(SEND)
            .condition("organizationPartyId", "in", ids)
            .condition("releasedDate", "is-not-null", null)
            .orderBy("-releasedDate")
            .limit(choiceLimit)
        if (p.marketingCampaignId) query = query.condition("marketingCampaignId", String(p.marketingCampaignId))
        if (term) query = query.condition(textCondition(["campaignSendId", "sendName", "subject"], term))
        const options = Array.from(query.list()).map(row => ({
            value: row.campaignSendId,
            label:
                (row.sendName || row.subject || row.campaignSendId) +
                (row.releasedDate ? " · " + lib.dateText(row.releasedDate) : "")
        }))
        return withSelected(
            options,
            selected,
            id => {
                const send = one(SEND, {campaignSendId: id})
                return !!send && covers(userScope, send.organizationPartyId)
            },
            id => one(SEND, {campaignSendId: id})?.sendName || id
        )
    },
    // P19: the stores a promotion may take in Marketing's registration of the shared promotion screens (Commerce's store scope within the
    // Marketing organizations), by name
    promotionStores: (userScope, term, selected) => {
        if (!userScope.capabilities.promotionRead) return []
        const all = promotionStoreIds(userScope.mantle, null, null)
        const options = promotionStoreIds(userScope.mantle, term, choiceLimit).map(row => ({value: row.value, label: row.label}))
        return withSelected(
            options,
            selected,
            id => all.some(row => row.value === id),
            id => all.find(row => row.value === id)?.label || id
        )
    },
    // P19: the customers a promotion code may be limited to (promotionCustomer's rule), by name or id
    promotionCustomers: (userScope, term, selected) => {
        if (!userScope.capabilities.promotionEdit) return []
        let query = find("mantle.party.PartyDetailAndRole", {roleTypeId: "Customer"})
            .condition("ownerPartyId", "in", ["_NA_"].concat(organizationIds(userScope)))
            .selectField("partyId")
            .orderBy("partyId")
            .limit(choiceLimit * 2)
        if (term)
            query = query.condition(textCondition(["partyId", "pseudoId", "organizationName", "firstName", "lastName"], term))
        const ids = Array.from(query.list()).map(row => row.partyId)
        const ordered = selected ? [selected].concat(ids.filter(id => id !== selected)) : ids
        const admitted = ordered
            .filter(partyId => !!recordKinds.promotionCustomer.read(userScope, partyId))
            .slice(0, choiceLimit + 1)
        const names = lib.partyNames(admitted)
        return admitted.map(partyId => ({value: partyId, label: names[partyId] || partyId}))
    },
    // P19: the products a promotion may name (Mantle's rule: a product of a Marketing organization or the shared catalog), by name or
    // id, for a holder of Commerce's promotion permission
    promotionProducts: (userScope, term, selected) => {
        if (!userScope.capabilities.promotionEdit) return []
        let query = find("mantle.product.Product")
            .condition("ownerPartyId", "in", ["_NA_"].concat(organizationIds(userScope)))
            .orderBy("^productName")
            .limit(choiceLimit)
        if (term) query = query.condition(textCondition(["productId", "pseudoId", "productName"], term))
        const label = row => (row.productName ? row.productName + " (" + (row.pseudoId || row.productId) + ")" : row.productId)
        const options = Array.from(query.list()).map(row => ({value: row.productId, label: label(row)}))
        return withSelected(
            options,
            selected,
            id => {
                const product = one("mantle.product.Product", {productId: id})
                return !!product && (product.ownerPartyId === "_NA_" || covers(userScope, product.ownerPartyId))
            },
            id => label(one("mantle.product.Product", {productId: id}))
        )
    },
    // P19: the open campaigns of a promotion's store organization (PromotionDetail's Link to a campaign), by name
    promotionCampaigns: (userScope, term, selected, p) => {
        const store = p.productStoreId ? one("mantle.product.store.ProductStore", {productStoreId: p.productStoreId}) : null
        if (!store || !userScope.capabilities.campaignEdit || !covers(userScope, store.organizationPartyId)) return []
        return choiceSources.campaigns(userScope, term, selected, {organizationPartyId: store.organizationPartyId})
    },
    // P19: the store promotions of a campaign's organization (CampaignDetail's Link a promotion), by description or id, for a campaign
    // editor who holds Commerce's promotion permission (Mantle's store#CampaignAssociation asks both again)
    promotions: (userScope, term, selected, p) => {
        if (!userScope.capabilities.promotionEdit || !userScope.capabilities.campaignEdit) return []
        const storeIds = promotionStoreIds(userScope.mantle, null, null)
            .filter(row => !p.organizationPartyId || row.organizationPartyId === p.organizationPartyId)
            .map(row => row.value)
        if (!storeIds.length) return []
        let query = find("mantle.product.store.ProductStorePromotion")
            .condition("productStoreId", "in", storeIds)
            .orderBy("^itemDescription")
            .limit(choiceLimit)
        if (term) query = query.condition(textCondition(["storePromotionId", "itemDescription"], term))
        const options = Array.from(query.list()).map(row => ({
            value: row.storePromotionId,
            label: row.itemDescription || row.storePromotionId
        }))
        return withSelected(
            options,
            selected,
            id => storeIds.includes(one("mantle.product.store.ProductStorePromotion", {storePromotionId: id})?.productStoreId),
            id => one("mantle.product.store.ProductStorePromotion", {storePromotionId: id})?.itemDescription || id
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
    },
    // P8: the sends of the scope by id, name or subject, for a reader of sends (follow-up 9: who may open SendDetail, sendLink)
    {
        kind: "send",
        rows: (userScope, text, limit) => {
            if (!userScope.capabilities.sendLink) return []
            const ids = organizationIds(userScope)
            if (!ids.length) return []
            const path = sharedPath("Marketing", "Sends/SendDetail")
            return Array.from(
                find(SEND)
                    .condition("organizationPartyId", "in", ids)
                    // P11: a send step's content is its automation's, found as the automation
                    .condition("statusId", "not-equals", "CsAutomation")
                    .condition(textCondition(["campaignSendId", "sendName", "subject"], text))
                    .orderBy("-createdDate")
                    .limit(limit)
                    .list()
            ).map(row => ({
                title: row.sendName || row.campaignSendId,
                subtitle: "Send · " + statusName(row.statusId) + " · " + organizationName(row.organizationPartyId),
                icon: recordKinds.send.icon,
                url: path + "?campaignSendId=" + encodeURIComponent(row.campaignSendId),
                recordEntity: SEND,
                recordId: row.campaignSendId
            }))
        }
    },
    // P11: the automations of the scope by id or name, for a reader of automations
    {
        kind: "automation",
        rows: (userScope, text, limit) => {
            if (!userScope.capabilities.automationRead) return []
            const ids = organizationIds(userScope)
            if (!ids.length) return []
            const path = sharedPath("Marketing", "Automations/AutomationDetail")
            return Array.from(
                find(AUTOMATION)
                    .condition("organizationPartyId", "in", ids)
                    .condition(textCondition(["marketingAutomationId", "automationName"], text))
                    .orderBy("-createdDate")
                    .limit(limit)
                    .list()
            ).map(row => ({
                title: row.automationName || row.marketingAutomationId,
                subtitle: "Automation · " + statusName(row.statusId) + " · " + organizationName(row.organizationPartyId),
                icon: recordKinds.automation.icon,
                url: path + "?marketingAutomationId=" + encodeURIComponent(row.marketingAutomationId),
                recordEntity: AUTOMATION,
                recordId: row.marketingAutomationId
            }))
        }
    },
    // P21: the registration events of the scope by id or name, every Marketing reader's (their RegistrationSetup)
    {
        kind: "event",
        rows: (userScope, text, limit) => {
            if (!userScope.capabilities.anyRead) return []
            const ids = organizationIds(userScope)
            if (!ids.length) return []
            const offered = Array.from(
                find("mantle.work.registration.RegistrationEvent")
                    .condition("organizationPartyId", "in", ids)
                    .selectField("workEffortId")
                    .limit(1000)
                    .list()
            ).map(row => row.workEffortId)
            if (!offered.length) return []
            const path = sharedPath("Marketing", "Events/RegistrationSetup")
            return Array.from(
                find("mantle.work.effort.WorkEffort")
                    .condition("workEffortId", "in", offered)
                    .condition(textCondition(["workEffortId", "workEffortName"], text))
                    .orderBy("-estimatedStartDate")
                    .limit(limit)
                    .list()
            ).map(row => ({
                title: row.workEffortName || row.workEffortId,
                subtitle: "Event" + (row.estimatedStartDate ? " · " + ec.l10n.format(row.estimatedStartDate, "yyyy-MM-dd") : ""),
                icon: recordKinds.event.icon,
                url: path + "?workEffortId=" + encodeURIComponent(row.workEffortId),
                recordEntity: "mantle.work.effort.WorkEffort",
                recordId: row.workEffortId
            }))
        }
    },
    // P21: a registration by its id, for an events manager of its offer's organization (never by an attendee's name)
    {
        kind: "registration",
        rows: (userScope, text, limit) => {
            if (!userScope.capabilities.eventManage || !/^[A-Za-z0-9_.-]{3,}$/.test(text)) return []
            const found = recordKinds.registration.read(userScope, text)
            if (!found) return []
            return [
                {
                    title: found.label,
                    subtitle: "Registration · " + organizationName(found.organizationPartyId),
                    icon: recordKinds.registration.icon,
                    url: sharedPath("Marketing", "Events/RegistrationDetail") + "?registrationId=" + encodeURIComponent(text),
                    recordEntity: REGISTRATION,
                    recordId: text
                }
            ].slice(0, limit)
        }
    }
]
// The web path of a Marketing screen under a root.
const sharedPath = (appRoot, path) => "/qapps/" + appRoot + "/" + path
// Follow-up 9: whether a kind's destination is one the user may open (a send's: capabilities.sendLink)
const linked = (userScope, definition) =>
    !!definition.destination &&
    (!definition.destination.capability || !!userScope.capabilities[definition.destination.capability])
// A record's link (the palette's get#RecordLink): its kind's screen under Marketing, with its icon, for a Marketing user who may see
// it and open it; else none.
function recordLink(kind, recordId) {
    const definition = Object.hasOwn(recordKinds, kind) ? recordKinds[kind] : null
    if (!definition?.destination || !recordId) return null
    const userScope = scope()
    if (!userScope.read || !linked(userScope, definition) || !definition.read(userScope, recordId)) return null
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

// ===== Marketing P21: Today, the Comms hooks and their links (design §1.3 Comms hooks, §14.3 Today; impl-marketing P21) =====
const REGISTRATION = "mantle.work.registration.EventRegistration"
const L = value => ec.l10n.localize(value)
// The places of the route keys Mantle's workspace rows name (MarketingWorkspaceServices get#TodayItems, get#CalendarItems), as paths
// under Marketing with the record's parameter.
const routePaths = {
    marketingCampaign: "Campaigns/CampaignDetail",
    marketingSend: "Sends/SendDetail",
    marketingAutomation: "Automations/AutomationDetail",
    marketingContent: "Content/ContentDetail",
    marketingEvent: "Events/EventDetail",
    marketingApprovals: "Campaigns/Approvals",
    marketingDelivery: "Sends/CampaignDelivery",
    marketingRegistrations: "Events/Registrations"
}
// Follow-up 9: the capability a route's place asks before it is linked (a send's: the Sends area and a reader of sends; its review:
// Approvals' and Automations' their areas, as each area's own check asks)
const routeCapabilities = {
    marketingSend: "sendLink",
    marketingDelivery: "sendLink",
    marketingApprovals: "approvals",
    marketingAutomation: "automations"
}
// A route's place for a user of these capabilities (scope().capabilities), or null when there is none or they may not open it.
function placeOf(appRoot, route, recordParameter, recordId, capabilities) {
    const path = route && Object.hasOwn(routePaths, route) ? routePaths[route] : null
    if (!path) return null
    if (Object.hasOwn(routeCapabilities, route) && !capabilities?.[routeCapabilities[route]]) return null
    return (
        sharedPath(appRoot || "Marketing", path) +
        (recordParameter && recordId ? "?" + recordParameter + "=" + encodeURIComponent(recordId) : "")
    )
}
// The record kinds the Comms hooks answer, by entity: a campaign, a send and an event registration (design §1.3 Comms hooks).
const lookupKinds = {
    "mantle.marketing.campaign.MarketingCampaign": "campaign",
    "mantle.marketing.campaign.CampaignSend": "send",
    [REGISTRATION]: "registration"
}
const lookupKindOf = entityName => {
    const name = String(entityName || "")
    if (Object.hasOwn(lookupKinds, name)) return lookupKinds[name]
    return Object.entries(lookupKinds).find(([entity]) => entity.endsWith("." + name))?.[1] || null
}
// A record's card for the user, or null when Marketing does not show it to them (left to the other providers).
function lookupCard(userScope, kind, recordId) {
    const definition = recordKinds[kind]
    let found = null
    try {
        found = definition.read(userScope, recordId)
    } catch (error) {
        if (!["RECORD_UNAVAILABLE", "PERMISSION_DENIED", "ORGANIZATION_DENIED"].includes(lib.reasonCode(error))) throw error
    }
    if (!found) return null
    const status =
        kind === "registration" ? statusName(one(REGISTRATION, {registrationId: recordId})?.statusId) : found.detail || ""
    return {
        entity: Object.entries(lookupKinds).find(([, value]) => value === kind)[0],
        title: found.label,
        typeLabel: L(definition.name),
        status,
        icon: definition.icon,
        // follow-up 9: the card unlinked for a user who may not open its record (a send's for a non-reader of sends)
        url: linked(userScope, definition)
            ? sharedPath("Marketing", definition.destination.path) +
              "?" +
              definition.destination.parameter +
              "=" +
              encodeURIComponent(recordId)
            : null,
        lines: [organizationName(found.organizationPartyId)].filter(Boolean)
    }
}
// record-lookup (lookup#Records, org.moqui.comms.ProviderInterfaces.record#Lookup): a campaign's, a send's or a registration's card,
// search and links for a user Marketing shows it to; never an address, a token or an attendee's name.
function lookup(p) {
    const empty = {recordList: [], card: null, optionList: []}
    const userScope = scope()
    if (!userScope.read || !userScope.capabilities.anyRead) return empty
    if (p.operation === "info") {
        const recordList = []
        for (const wanted of Array.from(p.records || [])) {
            const kind = lookupKindOf(wanted.recordEntityName)
            const card = kind && wanted.recordId ? lookupCard(userScope, kind, String(wanted.recordId)) : null
            if (!card) continue
            recordList.push({
                recordEntityName: wanted.recordEntityName,
                recordId: wanted.recordId,
                entity: card.entity,
                visible: true,
                title: card.title,
                typeLabel: card.typeLabel,
                url: card.url,
                icon: card.icon
            })
        }
        return Object.assign(empty, {recordList})
    }
    if (p.operation === "card") {
        const kind = lookupKindOf(p.recordEntityName)
        const card = kind && p.recordId ? lookupCard(userScope, kind, String(p.recordId)) : null
        return card
            ? Object.assign(empty, {
                  card: {
                      entityName: card.entity,
                      id: p.recordId,
                      title: card.title,
                      status: card.status,
                      url: card.url,
                      lines: card.lines
                  }
              })
            : empty
    }
    if (p.operation === "search") {
        const term = String(p.text || "").trim()
        if (term.length < 2) return empty
        const limit = Math.max(1, Math.min(20, Number(p.limit || 10)))
        const optionList = []
        for (const definition of searchFinds.filter(find => ["campaign", "send", "registration"].includes(find.kind))) {
            let found = []
            try {
                found = definition.rows(userScope, term, limit)
            } catch (error) {
                ec.logger.error("Marketing record lookup " + definition.kind + " search failed: " + error.message)
            }
            for (const row of found)
                optionList.push({value: row.recordEntity + "|" + row.recordId, label: row.title + " (" + row.subtitle + ")"})
        }
        return Object.assign(empty, {optionList: optionList.slice(0, limit)})
    }
    if (p.operation === "links") {
        const patterns = [
            [
                /\/qapps\/[A-Za-z]+\/Campaigns\/CampaignDetail\?marketingCampaignId=([A-Za-z0-9_.%-]+)/g,
                "mantle.marketing.campaign.MarketingCampaign"
            ],
            [
                /\/qapps\/[A-Za-z]+\/Sends\/SendDetail\?campaignSendId=([A-Za-z0-9_.%-]+)/g,
                "mantle.marketing.campaign.CampaignSend"
            ],
            [/\/qapps\/[A-Za-z]+\/Events\/RegistrationDetail\?registrationId=([A-Za-z0-9_.%-]+)/g, REGISTRATION]
        ]
        const seen = new Set()
        const recordList = []
        for (const [pattern, entity] of patterns)
            for (const match of String(p.body || "").matchAll(pattern)) {
                const id = decodeURIComponent(match[1])
                if (seen.has(entity + "|" + id) || recordList.length >= 5) continue
                seen.add(entity + "|" + id)
                recordList.push({entity, id})
            }
        return Object.assign(empty, {recordList})
    }
    throw new Error("Unknown record lookup " + p.operation)
}
// The parties with a phone number like the one ringing (its last seven digits in the stored number, checked against the whole number
// when it has a country code), as Sales' and Maintenance's call contexts read them.
function partiesOfNumber(number) {
    const wanted = String(number || "").replace(/[^0-9+]/g, "")
    const digits = wanted.replace(/\D/g, "")
    if (digits.length < 7) return []
    const factory = ec.entity.conditionFactory
    const last7 = digits.slice(-7)
    const written = [last7, ...["-", " ", "."].map(separator => last7.slice(0, 3) + separator + last7.slice(3))]
    const partyIds = new Set()
    for (const row of Array.from(
        find("mantle.party.contact.PartyContactMechTelecomNumber")
            .condition(
                factory.makeCondition(
                    written.map(form => factory.makeCondition("contactNumber", "like", "%" + form + "%")),
                    "or"
                )
            )
            .conditionDate("fromDate", "thruDate", ec.user.nowTimestamp)
            .limit(60)
            .list()
    )) {
        const local = String(row.areaCode || "") + String(row.contactNumber || "")
        const countryCode = String(row.countryCode || "").replace(/\D/g, "")
        const e164 = countryCode ? "+" + countryCode + local.replace(/\D/g, "") : null
        if (!e164 || e164 === wanted || e164.replace(/\D/g, "").endsWith(digits.slice(-10))) partyIds.add(row.partyId)
    }
    return Array.from(partyIds)
}
// call-context (get#CallContext, org.moqui.comms.ProviderInterfaces.call#Context): the caller's upcoming registrations (as attendee or
// buyer) of the offers of the user's organizations, for an events manager, each with its RegistrationDetail link, at most 20; Comms' own
// provider answers who the caller is. No address, token or payment.
function callContext(p) {
    const empty = {contactList: [], recordList: []}
    const userScope = scope()
    if (!userScope.read || !userScope.capabilities.eventManage) return empty
    const ids = organizationIds(userScope)
    const partyIds = partiesOfNumber(p.number)
    if (!ids.length || !partyIds.length) return empty
    const factory = ec.entity.conditionFactory
    const registrations = Array.from(
        find(REGISTRATION)
            .condition(
                factory.makeCondition(
                    [
                        factory.makeCondition("attendeePartyId", "in", partyIds),
                        factory.makeCondition("buyerPartyId", "in", partyIds)
                    ],
                    "or"
                )
            )
            .condition("statusId", "not-in", ["EvrCancelled", "EvrExpired"])
            .orderBy("-createdDate")
            .limit(100)
            .list()
    )
    const policyIds = Array.from(new Set(registrations.map(row => row.registrationPolicyId).filter(Boolean)))
    const policies = {}
    if (policyIds.length)
        for (const row of Array.from(
            find("mantle.work.registration.EventRegistrationPolicy")
                .condition("registrationPolicyId", "in", policyIds)
                .condition("organizationPartyId", "in", ids)
                .condition("occurrenceEnd", "greater-than", ec.user.nowTimestamp)
                .list()
        ))
            policies[row.registrationPolicyId] = row
    const recordList = []
    for (const row of registrations) {
        const policy = policies[row.registrationPolicyId]
        if (!policy || recordList.length >= 20) continue
        recordList.push({
            title:
                L("Registration") +
                " " +
                row.registrationId +
                ": " +
                (policy.publicTitle || policy.registrationPolicyId) +
                (policy.occurrenceStart ? " · " + ec.l10n.format(policy.occurrenceStart, "yyyy-MM-dd HH:mm") : ""),
            status: statusName(row.statusId),
            url:
                sharedPath("Marketing", "Events/RegistrationDetail") + "?registrationId=" + encodeURIComponent(row.registrationId)
        })
    }
    return {contactList: [], recordList}
}
// The Marketing today-source (get#TodayItems; Commons' get#UserTodayItems calls it): Mantle's sources (MarketingWorkspaceServices
// get#TodayItems) as Today's items, each opening its Marketing screen; a source of Mantle's that could not be read is an item that says so
// by name, so the others still show. Another user's Today, and a user who reads nothing of Marketing, get none.
function today(p) {
    const label = "Marketing"
    if (p.userId && p.userId !== ec.user.userId) return {items: [], label}
    const userScope = scope()
    if (!userScope.read || !userScope.capabilities.anyRead) return {items: [], label}
    const found =
        ec.service
            .sync()
            .name("mantle.marketing.MarketingWorkspaceServices.get#TodayItems")
            .parameters({thruDate: p.thruDate || null})
            .call() || {}
    if (ec.message.hasError()) throw new Error(ec.message.getErrorsString())
    const item = (fields, url, record) =>
        Object.assign(
            {
                workEffortId: null,
                requestId: null,
                startDate: null,
                endDate: null,
                allDay: true,
                priority: null,
                statusId: null,
                assignees: [],
                canUpdate: false,
                hasCallLink: false
            },
            fields,
            {url, record}
        )
    const items = Array.from(found.items || []).map(row =>
        item(
            {kind: row.kind, title: row.title, dueDate: row.dueDate || null},
            placeOf("Marketing", row.route, row.recordParameter, row.recordId, userScope.capabilities),
            row.recordEntity ? {recordEntityName: row.recordEntity, recordId: row.recordId, recordName: row.recordName} : null
        )
    )
    for (const title of Array.from(found.failedSources || []))
        items.push(
            item({kind: "marketingUnavailable", title: title + ": " + L("could not be read just now"), dueDate: null}, null, null)
        )
    return {items, label}
}
// ===== end of Marketing P21 =====

const operations = {sharedContext, checkRecord, checkContacts, choices, search, today, lookup, callContext}
function run(op, p) {
    if (!Object.hasOwn(operations, op)) throw new Error("Unknown Marketing operation " + op)
    return operations[op](p || {})
}
// P19: whether the Promotions menu entry shows (the root's menu-include, which reads no screen context): a Marketing reader with
// Commerce's promotion read, when a store of their Marketing organizations is within Commerce's store scope.
function promotionsShown() {
    if (!ec.user.userId || !access.has("COMMERCE_VIEW")) return false
    const userScope = scope()
    return !!userScope.read && !!userScope.capabilities.promotions
}
// The places of the current user's routes (follow-up 9: their capabilities read once): place(route, recordParameter, recordId).
function placesFor(appRoot) {
    const capabilities = scope().capabilities
    return (route, recordParameter, recordId) => placeOf(appRoot, route, recordParameter, recordId, capabilities)
}
;({execute: run, recordLink, promotionsShown, placeOf, placesFor})
