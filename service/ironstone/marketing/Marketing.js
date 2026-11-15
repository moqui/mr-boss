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
    leadRules: "Leads/LeadRules"
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
    leadRules: "leadRuleRead"
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
    "Events/RegistrationDetail"
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
    },
    // P8: a send (CampaignSend), by its organization: SendDetail
    send: {
        name: "Send",
        icon: "sym_o_forward_to_inbox",
        destination: {path: "Sends/SendDetail", parameter: "campaignSendId"},
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
    }
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
    // P8: the topics a send may take: the organization's Marketing lists of email, not archived, by name
    sendTopics: (userScope, term, selected, p) => {
        const ids = choiceOrganizations(userScope, p)
        if (!ids.length) return []
        const factory = ec.entity.conditionFactory
        let query = find("mantle.marketing.contact.ContactList")
            .condition("ownerPartyId", "in", ids)
            .condition("contactListTypeEnumId", "in", ["MARKETING", "NEWSLETTER", "ANNOUNCEMENT"])
            .condition(factory.makeCondition("contactMechTypeEnumId", "not-equals", "CmtTelecomNumber", true))
            .condition(factory.makeCondition("archivedDate", "greater", ec.user.nowTimestamp, true))
            .orderBy("^contactListName")
            .limit(choiceLimit)
        if (term) query = query.condition(textCondition(["contactListId", "contactListName"], term))
        const options = Array.from(query.list()).map(row => ({
            value: row.contactListId,
            label: row.contactListName || row.contactListId
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
            label: row.profileName || row.sendingProfileId
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
    // P8: the sends of the scope by id, name or subject, for a reader of sends
    {
        kind: "send",
        rows: (userScope, text, limit) => {
            if (!userScope.capabilities.sendRead) return []
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
