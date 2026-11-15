// Helpers the Marketing specs share: the demo ids (data/BossZZMarketingDemoData.xml and the other apps' demo organizations), the
// demo users by group, a block run as a user with artifact authorization on, a call's refusal message, a Marketing page render and
// the shell's menu and providers. Later phases add their ids and users here.
const ids = {
    // the Marketing users' organization (Retail) and the second demo organization, which marketing.author2 works alone
    organizationId: "ORG_ZIZI_RETAIL",
    otherOrganizationId: "ORG_ZIZI_SERVICES",
    // the menu of design §1.2 built so far: every Marketing user's, and with Settings the administrator's; P14: Content every
    // Marketing reader's; P16: Events every Marketing reader's
    staffMenu: ["Home", "Campaigns", "Content", "Events"],
    // P20: Reports for the report readers (the reader, the analyst and the administrator)
    readerMenu: ["Home", "Campaigns", "Content", "Events", "Reports"],
    reportsMenu: ["Catalog", "CampaignPerformance", "DeliveryAnalysis", "AudienceGrowth", "Attribution"],
    // P8: Sends for the approvers and dispatchers too (its Sends tab; the templates stay their readers'); P11 Automations too
    sendsStaffMenu: ["Home", "Campaigns", "Sends", "Automations", "Content", "Events"],
    approverSendsMenu: ["Sends"],
    // P3: Audiences for the audience managers and the administrator; Leads for a user who reads Sales (the instance administrator)
    // P11: Automations for the authors, approvers, dispatchers, audience managers and the administrator
    // P12: Surveys for the authors, audience managers, analysts and the administrator
    audienceMenu: ["Home", "Campaigns", "Audiences", "Automations", "Content", "Events", "Surveys"],
    // P13: Leads (its lead rules) for the authors and the administrator too
    adminMenu: [
        "Home",
        "Campaigns",
        "Audiences",
        "Sends",
        "Automations",
        "Content",
        "Events",
        "Surveys",
        "Leads",
        "Reports",
        "Settings"
    ],
    // P19: Promotions for a holder of Commerce's promotion read when a store of their organizations is configured (ADMIN)
    systemMenu: [
        "Home",
        "Campaigns",
        "Audiences",
        "Sends",
        "Automations",
        "Promotions",
        "Content",
        "Events",
        "Surveys",
        "Leads",
        "Reports",
        "Settings"
    ],
    analystMenu: ["Home", "Campaigns", "Content", "Events", "Surveys", "Reports"],
    // P6: Sends (Comms' templates) for the authors and the administrator
    authorMenu: ["Home", "Campaigns", "Sends", "Automations", "Content", "Events", "Surveys", "Leads"],
    // P13: the Leads tabs of an author who reads no Sales
    authorLeadsMenu: ["LeadRules"],
    // P14: Content's tabs
    contentMenu: ["Content", "BlogPosts", "LandingPages", "Knowledge", "TrackingLinks"],
    sendsMenu: ["Sends", "MessageTemplates"],
    // P5: Segments and AudiencePreview join the Audiences tabs
    audiencesMenu: ["Lists", "Segments", "Consent", "Suppressions", "AudiencePreview"],
    settingsMenu: ["Index", "Adoption", "CampaignDefaults", "Vocabularies", "SendingProfiles"],
    // Campaigns' tabs: Approvals the approvers'
    campaignsMenu: ["Campaigns"],
    approverCampaignsMenu: ["Campaigns", "Approvals"],
    // the keys of the screens a user may open: Lists' (g l, P3) an audience manager's
    keys: ["g m", "g c"],
    // P6: an author opens the templates (g t); P8 the sends (g n); P11 the automations (g a)
    // P12: and the surveys (g v); P14 the content (g o); P16 the events (g e, every Marketing reader's); P21 the calendar (g k, every
    // Marketing reader's)
    authorKeys: ["g m", "g c", "g t", "g n", "g a", "g v", "g o", "g e", "g k"],
    // P2's demo campaigns (data/BossZZMarketingDemoData.xml): Retail's running one (approved at revision 1, with a planned child),
    // Retail's planned one, and Services' own
    runningCampaignId: "BOSS_MKT_CMP_SPRING",
    plannedCampaignId: "BOSS_MKT_CMP_HOLIDAY",
    servicesCampaignId: "BOSS_MKT_CMP_SERVICES",
    // P3's demo lists, members and suppressions: Retail's garden newsletter (Maya accepted, Noah pending, Olive unsubscribed and
    // suppressed by her complaint, Pete a legacy member), its announcements and single-use VIP list; Sales' Wingtip Traders with its
    // contact Dana Morales
    gardenListId: "BOSS_MKT_LIST_GARDEN",
    vipListId: "BOSS_MKT_LIST_VIP",
    pendingPartyId: "BOSS_MKT_CON_NOAH",
    acceptedPartyId: "BOSS_MKT_CON_MAYA",
    salesAccountId: "BOSS_SAL_ACC_WINGTIP",
    salesContactId: "BOSS_SAL_CON_DANA",
    // P4's demo import: Retail's fall fair sign-ups into its store announcements (two pending, one invalid row)
    fairImportId: "BOSS_MKT_IMP_FAIR",
    storeListId: "BOSS_MKT_LIST_STORE",
    // P5's demo segments: Retail's garden newsletter readers (a rule segment: the list's accepted members, Maya and the legacy Pete,
    // with Noah included by hand) and its spring preview guests (explicit: Maya included, Olive excluded)
    gardenSegmentId: "BOSS_MKT_SEG_GARDEN",
    vipSegmentId: "BOSS_MKT_SEG_VIP",
    legacyPartyId: "BOSS_MKT_CON_PETE",
    // P6's demo templates and sending profiles: Retail's published garden newsletter and subscription confirmation and its draft
    // spring invitation; Retail's ready profile and Services' not ready one (no bounce account)
    newsletterTemplateId: "BOSS_MKT_TPL_NEWS",
    draftTemplateId: "BOSS_MKT_TPL_SPRING",
    retailProfileId: "BOSS_MKT_PROFILE_RETAIL",
    servicesProfileId: "BOSS_MKT_PROFILE_SERVICES",
    // P8's demo sends of the running campaign: a draft from the spring invitation, the November newsletter prepared and approved
    // (Maya its one recipient), and the December one approved for 08:00 Chicago time 16 days after the load (1 December for a load
    // on Nov 15, 2026; follow-up 6), its campaigns' windows dated from the load too
    draftSendId: "BOSS_MKT_SEND_PREVIEW",
    approvedSendId: "BOSS_MKT_SEND_NOV",
    scheduledSendId: "BOSS_MKT_SEND_DEC",
    // P10: the draft subject test (an A/B experiment, not prepared)
    experimentSendId: "BOSS_MKT_SEND_ABTEST",
    // P11's demo automation: Retail's garden newsletter welcome (active; Maya in its wait, Olive stopped at her request)
    welcomeAutomationId: "BOSS_MKT_AUTO_WELCOME",
    waitingEnrollmentId: "BOSS_MKT_ENR_MAYA",
    stoppedEnrollmentId: "BOSS_MKT_ENR_OLIVE",
    // P12's demo survey: Retail's garden centre visit survey (its "good" option relabelled on 5 November), published to anyone on
    // ZIZI_SHOP and by invitation to the garden newsletter, with an anonymous response before the change and Maya's invited one after
    surveyFormId: "BOSS_MKT_FORM_VISIT",
    surveyPublicationId: "BOSS_MKT_PUB_VISIT",
    invitedPublicationId: "BOSS_MKT_PUB_VISIT_INVITED",
    surveySendId: "BOSS_MKT_SEND_SURVEY",
    anonymousResponseId: "BOSS_MKT_FR_VISIT_1",
    invitedResponseId: "BOSS_MKT_FR_VISIT_2",
    // P13's demo lead form: Retail's garden plan request on ZIZI_SHOP, its rule to Retail East and one answer whose handoff failed
    leadFormId: "BOSS_MKT_FORM_QUOTE",
    leadPublicationId: "BOSS_MKT_PUB_QUOTE",
    leadRuleId: "BOSS_MKT_LRULE_QUOTE",
    failedCaptureId: "BOSS_MKT_LCAP_QUOTE_1",
    eastTeamId: "BOSS_SAL_TEAM_EAST",
    // P14's demo content: Retail's garden blog space with three posts in its garden news category (two published), the first linked to
    // the running campaign, and the spring landing page on ZIZI_SHOP's Marketing mount with an embedded subscribe box
    blogSpaceId: "MKTBLOG",
    blogCategoryId: "BOSS_MKT_BLOGCAT_GARDEN",
    blogPostId: "BOSS_MKT_BLOG_ROSES",
    landingPageId: "BOSS_MKT_PAGE_SPRING",
    contentLinkId: "BOSS_MKT_CC_ROSES",
    // P15's demo links of the running campaign on ZIZI_SHOP: the poster's QR code to the spring landing page, the newsletter's link
    trackingLinkId: "BOSS_MKT_TRK_POSTER",
    newsLinkId: "BOSS_MKT_TRK_NEWS",
    // P16's demo events of the running campaign, offered on ZIZI_SHOP: the free online webinar and the paid workshop (twelve seats, two
    // ticket types priced by their products)
    webinarEventId: "BOSS_MKT_EV_WEBINAR",
    workshopEventId: "BOSS_MKT_EV_WORKSHOP",
    workshopOfferId: "BOSS_MKT_OFFER_WORKSHOP",
    // P17: the webinar's offer and its free ticket, for a staff registration
    webinarOfferId: "BOSS_MKT_OFFER_WEBINAR",
    webinarTicketId: "BOSS_MKT_TT_WEBINAR"
}
// The demo users of each group (each but the administrator also in BOSS_MARKETING), agents of Ziziwork Retail but
// marketing.author2 (Ziziwork Services only), none in ADMIN; a Projects client contact, a PASS public account and another app's
// user; and an instance administrator (ADMIN).
const users = {
    author: "marketing.author",
    audience: "marketing.audience",
    approver: "marketing.approver",
    dispatch: "marketing.dispatch",
    events: "marketing.events",
    analyst: "marketing.analyst",
    reader: "marketing.reader",
    admin: "marketing.admin",
    otherAuthor: "marketing.author2",
    // P3: a Retail salesperson who manages audiences too, and a salesperson who does not
    salesAudience: "marketing.sales",
    salesRep: "sales.rep",
    client: "sheldon.acme",
    pass: "dana@joesdist.example.com",
    otherApp: "customerservice.read",
    system: "john.doe"
}

// Run action as username with artifact authorization enabled, then sign in again as the user before.
function asUser(username, action) {
    const previousUsername = ec.user.username || "john.doe"
    login(username)
    const disabled = ec.artifactExecution.authzDisabled()
    try {
        ec.artifactExecution.enableAuthz()
        return action()
    } finally {
        ec.message.clearErrors()
        if (disabled) ec.artifactExecution.disableAuthz()
        else ec.artifactExecution.enableAuthz()
        login(previousUsername)
    }
}
// Run action with artifact authorization disabled (a spec's own setup and reads).
function system(action) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try {
        return action()
    } finally {
        if (!wasDisabled) ec.artifactExecution.enableAuthz()
    }
}
// The message a call is refused with, or "" when it succeeds: a negative case checks the message names the refusal, and a
// positive case with the same parameters gets "", so a validation error is not taken for a refusal.
function refusal(service, parameters = {}) {
    ec.message.pushErrors()
    try {
        ec.service.sync().name(service).parameters(parameters).requireNewTransaction(true).call()
        return ec.message.hasError() ? ec.message.getErrorsString() : ""
    } catch (error) {
        return String(error.message)
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}
function invoke(service, parameters = {}) {
    return ec.service.sync().name(service).parameters(parameters).call() || {}
}
// A Marketing screen as the shell fetches it (qvt, a fragment of the last standalone screen, with its lists' data), with a widget's
// render error counted among the errors; root names another app's root for a shared screen's mount.
function page(path, parameters = {}, mode = "qvt", root = "Marketing") {
    const renderer = ec.screen
        .makeTest()
        .rootScreen("component://mr-boss/screen/" + root + ".xml")
        .renderMode(mode)
    if (mode === "qvt") renderer.withStaticData()
    const result = renderer.render(path, Object.assign({lastStandalone: "-2"}, parameters), null)
    const output = String(result.output || "")
    const failed = output.match(/(Error rendering|Exception in render)[^\n<]*/g) || []
    const errors = Array.from(result.errorMessages || []).concat(failed)
    ec.message.clearErrors()
    return {status: result.status, output, errors}
}
// A screen render's refusal as the user, nothing of its content: "" when it opens, else its status and errors, which for a refusal
// name the authorization.
function screenRefusal(user, path, parameters = {}) {
    const rendered = asUser(user, () => page(path, parameters, "html"))
    return rendered.status === 200 && rendered.errors.length === 0 ? "" : rendered.status + " " + rendered.errors.join(" | ")
}
// A path under the web root as the user (the REST APIs, menu and shell data): its status, output and whether it was refused.
function hit(path, parameters = {}) {
    const result = ec.screen.makeTest().rootScreen("component://webroot/screen/webroot.xml").render(path, parameters, null)
    const errors = Array.from(result.errorMessages || []).join(" | ")
    ec.message.clearErrors()
    return {
        status: result.status,
        output: String(result.output || ""),
        refused: result.status == 401 || result.status == 403 || /not authorized/i.test(errors)
    }
}
// The shell's menu of Marketing and the launcher's apps for the user, as the shell fetches them; menuOnly leaves out the shell data (the
// launcher and providers). path and group give another level of the menu (Settings' tabs).
function shell(user, menuOnly = false, path = "Home", group = "Marketing") {
    const root = "component://webroot/screen/webroot.xml"
    return asUser(user, () => {
        const menu = ec.screen
            .makeTest()
            .rootScreen(root)
            .render("menuData/apps/Marketing/" + path, {}, null)
        const apps = menuOnly ? [] : JSON.parse(ec.screen.makeTest().rootScreen(root).render("shellData", {}, null).output).apps
        const level = menu.status == 200 ? JSON.parse(menu.output).find(level => level.name === group) : null
        return {
            status: menu.status,
            names: level ? level.subscreens.filter(item => item.menuInclude).map(item => item.name) : [],
            apps: apps.map(app => app.name),
            providers: apps.find(app => app.name === "Marketing")?.providers
        }
    })
}

// P19: a Retail Marketing author who also holds Commerce's promotion read and edit through a spec group (not Commerce's root), made once:
// its username. MarketingPromotions and the acceptance MarketingPromotionsWalk use it.
function promotionsAuthor() {
    const make = (entity, values) =>
        ec.service
            .sync()
            .name("create#" + entity)
            .parameters(values)
            .disableAuthz()
            .call()
    system(() => {
        if (ec.entity.find("moqui.security.UserAccount").condition("userId", "MKPROMO_AUTHOR").one()) return
        make("mantle.party.Party", {partyId: "MKPROMO_AUTHOR", partyTypeEnumId: "PtyPerson"})
        make("mantle.party.Person", {partyId: "MKPROMO_AUTHOR", firstName: "Promotions", lastName: "Author"})
        make("mantle.party.PartyRelationship", {
            fromPartyId: "MKPROMO_AUTHOR",
            toPartyId: ids.organizationId,
            relationshipTypeEnumId: "PrtAgent",
            toRoleTypeId: "OrgInternal",
            fromDate: 0
        })
        make("moqui.security.UserGroup", {userGroupId: "MKPROMO_COMMERCE", description: "Marketing promotions spec"})
        for (const userPermissionId of ["COMMERCE_VIEW", "COMMERCE_PROMOTION_EDIT"])
            make("moqui.security.UserGroupPermission", {userGroupId: "MKPROMO_COMMERCE", userPermissionId, fromDate: 0})
        make("moqui.security.UserAccount", {
            userId: "MKPROMO_AUTHOR",
            username: "mkpromo.author",
            partyId: "MKPROMO_AUTHOR",
            currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
            passwordHashType: "SHA"
        })
        for (const userGroupId of ["BOSS_USERS", "BOSS_MARKETING", "BOSS_MARKETING_AUTHOR", "MKPROMO_COMMERCE"])
            make("moqui.security.UserGroupMember", {userId: "MKPROMO_AUTHOR", userGroupId, fromDate: 0})
    })
    return "mkpromo.author"
}

// ===== P23 sweeps =====
// The screen sweeps (acceptance MarketingTui and MarketingServerStatic, impl-marketing P23), as SalesSpecLib's: the screens Marketing
// mounts from elsewhere (Shared, Commons, Comms and Sales screens), as [path under the root, location], read from each Marketing screen
// file's subscreens-items (walkChildTree follows files, not mounts). The redirects kept for the old placeholders' routes (Newsletters,
// Segments) are listed apart (redirectScreens), since a redirect is not a document.
const MARKETING_ROOT = "component://mr-boss/screen/Marketing.xml"
function marketingFiles() {
    const files = []
    ec.resource.getLocationReference(MARKETING_ROOT).walkChildTree(files, null)
    return files.filter(file => file.location.endsWith(".xml"))
}
function mountedScreens() {
    const found = []
    for (const file of marketingFiles()) {
        const parent = file.path === "Marketing" ? "" : file.path.substring("Marketing/".length) + "/"
        const text = String(ec.resource.getLocationReference(file.location).getText())
        const item = /<subscreens-item name="([^"]+)"\s+location="(component:\/\/mr-boss\/screen\/(?!Marketing\/)[^"]+\.xml)"/g
        for (let match = item.exec(text); match; match = item.exec(text)) found.push([parent + match[1], match[2]])
    }
    return found
}
// The paths under the root of the screen files that only redirect (sri.sendRedirectAndStopRender in their always-actions)
function redirectScreens() {
    return marketingFiles()
        .filter(file => file.path !== "Marketing")
        .filter(file => String(ec.resource.getLocationReference(file.location).getText()).includes("sendRedirectAndStopRender"))
        .map(file => file.path.substring("Marketing/".length))
}
// The tabs of a mounted screen that the current user's menu shows under Marketing, as paths under the root; none when its menu names
// none
function mountTabs(path, parameters = {}) {
    const name = path.substring(path.lastIndexOf("/") + 1)
    const query = Object.entries(parameters)
        .map(([key, value]) => key + "=" + encodeURIComponent(value))
        .join("&")
    const menu = ec.screen
        .makeTest()
        .rootScreen("component://webroot/screen/webroot.xml")
        .render("menuData/apps/Marketing/" + path + (query ? "?" + query : ""), {}, null)
    ec.message.clearErrors()
    if (menu.status != 200) return []
    const level = JSON.parse(menu.output)
        .filter(level => level.name === name)
        .pop()
    return (level?.subscreens || []).filter(item => item.menuInclude).map(item => path + "/" + item.name)
}
// The records the demo has no row of, made for the sweeps: a confirmed staff registration of the webinar's free place (as
// MarketingRegistrations makes it), by the events manager with the service's own rule. {registrationId}
function sweepMade() {
    const E = "mantle.work.EventRegistrationServices."
    const made = asUser(users.events, () =>
        system(() => {
            const reserved = invoke(E + "reserve#Registration", {
                registrationPolicyId: ids.webinarOfferId,
                ticketTypeId: ids.webinarTicketId,
                quantity: 1,
                buyerName: "Sweep Attendee",
                buyerEmail: "sweep.attendee@registrations.example.test",
                requestKey: "mktsweep" + Math.floor(Math.random() * 1e9)
            })
            return invoke(E + "complete#Registration", {
                reservationId: reserved.reservationId,
                attendees: [{name: "Sweep Attendee"}],
                acceptTerms: true
            })
        })
    )
    ec.message.clearErrors()
    const blog = system(() => ec.entity.find("moqui.resource.wiki.WikiBlog").condition("wikiBlogId", ids.blogPostId).one())
    return {registrationId: (made.registrationIds || [])[0] || "", blogPageId: blog ? blog.wikiPageId : ""}
}
// The demo record a swept screen opens on: the entry of the screen or its nearest parent (a tab takes its record's); made is
// sweepMade's records
const campaignRecord = {recordEntity: "mantle.marketing.campaign.MarketingCampaign", recordId: ids.runningCampaignId}
const organizationOnly = {organizationPartyId: ids.organizationId}
const sweepRecords = (made = {}) => ({
    Home: organizationOnly,
    Chatter: campaignRecord,
    RecordFiles: campaignRecord,
    LogNote: {entityName: campaignRecord.recordEntity, recordId: ids.runningCampaignId},
    SendMessage: {entityName: campaignRecord.recordEntity, recordId: ids.runningCampaignId},
    "QuickCreate/NewSend": campaignRecord,
    "Campaigns/CampaignDetail": {marketingCampaignId: ids.runningCampaignId},
    "Campaigns/CampaignPlan": {marketingCampaignId: ids.runningCampaignId},
    "Audiences/ListDetail": {contactListId: ids.gardenListId},
    "Audiences/MemberDetail": {contactListId: ids.gardenListId, partyId: ids.acceptedPartyId},
    "Audiences/SegmentDetail": {marketSegmentId: ids.gardenSegmentId},
    "Audiences/AudienceImport": {audienceImportId: ids.fairImportId},
    "Audiences/AudienceMerge": {contactListId: ids.storeListId},
    "Audiences/AudiencePreview": {topicListId: ids.gardenListId, listIds: ids.gardenListId},
    "Audiences/Consent/Contact": {partyId: ids.acceptedPartyId},
    "Sends/SendDetail": {campaignSendId: ids.approvedSendId},
    "Sends/Compose": {campaignSendId: ids.draftSendId},
    "Sends/ExperimentDetail": {campaignSendId: ids.experimentSendId},
    "Sends/RecipientDetail": {campaignRecipientId: "BOSS_MKT_RCPT_NOV_MAYA"},
    "Sends/CampaignDelivery": {campaignSendId: ids.approvedSendId},
    "Sends/MessageTemplateDetail": {messageTemplateId: ids.newsletterTemplateId},
    "Automations/AutomationDetail": {marketingAutomationId: ids.welcomeAutomationId},
    "Automations/EnrollmentDetail": {automationEnrollmentId: ids.waitingEnrollmentId},
    "Promotions/PromotionDetail": {storePromotionId: "PopcBuyGet"},
    "Promotions/PromoCodeDetail": {promoCodeId: "TEST2"},
    "Content/ContentDetail": {campaignContentId: ids.contentLinkId},
    "Content/BlogPostDetail": {wikiBlogId: ids.blogPostId},
    "Content/PageDetail": {sitePageId: ids.landingPageId},
    "Content/Knowledge": made.blogPageId ? {wikiPageId: made.blogPageId} : {wikiSpaceId: ids.blogSpaceId},
    "Content/KnowledgeTui": made.blogPageId ? {wikiPageId: made.blogPageId} : {wikiSpaceId: ids.blogSpaceId},
    "Content/TrackingLinkDetail": {trackingCodeId: ids.trackingLinkId},
    "Events/EventDetail": {workEffortId: ids.webinarEventId},
    "Events/RegistrationSetup": {workEffortId: ids.webinarEventId, registrationPolicyId: ids.webinarOfferId},
    "Events/Registrations": {workEffortId: ids.webinarEventId, registrationPolicyId: ids.webinarOfferId},
    "Events/RegistrationDetail": {registrationId: made.registrationId || ""},
    "Events/CheckIn": {registrationPolicyId: ids.webinarOfferId},
    "Surveys/SurveyDetail": {formId: ids.surveyFormId},
    "Surveys/SurveyDistribution": {publicationId: ids.surveyPublicationId},
    "Surveys/Responses": {formId: ids.surveyFormId},
    "Surveys/ResponseDetail": {formResponseId: ids.anonymousResponseId},
    "Leads/LeadRuleDetail": {leadRuleId: ids.leadRuleId},
    "Customers/Customer360": {customerPartyId: ids.acceptedPartyId, organizationPartyId: ids.organizationId},
    "Contacts/ContactDetail": {partyId: ids.acceptedPartyId},
    Reports: organizationOnly,
    Settings: organizationOnly
})
function sweepParameters(path, made = {}) {
    const records = sweepRecords(made)
    const key = Object.keys(records)
        .filter(key => path === key || path.startsWith(key + "/"))
        .sort((a, b) => b.length - a.length)[0]
    return key ? records[key] : {}
}
// The second records of a screen the tui sweep renders again (each path's own record is sweepParameters'), as [path, parameters]:
// SendDetail on the draft, the scheduled send and the A/B test; the explicit segment and the single-use list; the stopped
// enrollment; the paid workshop's setup; the invited response; the invited and lead publications
function sweepExtras() {
    return [
        ["Sends/SendDetail", {campaignSendId: ids.draftSendId}],
        ["Sends/SendDetail", {campaignSendId: ids.scheduledSendId}],
        ["Sends/SendDetail", {campaignSendId: ids.experimentSendId}],
        ["Audiences/SegmentDetail", {marketSegmentId: ids.vipSegmentId}],
        ["Audiences/ListDetail", {contactListId: ids.vipListId}],
        ["Automations/EnrollmentDetail", {automationEnrollmentId: ids.stoppedEnrollmentId}],
        ["Events/RegistrationSetup", {workEffortId: ids.workshopEventId, registrationPolicyId: ids.workshopOfferId}],
        ["Surveys/ResponseDetail", {formResponseId: ids.invitedResponseId}],
        ["Surveys/SurveyDistribution", {publicationId: ids.invitedPublicationId}],
        ["Surveys/SurveyDistribution", {publicationId: ids.leadPublicationId}],
        ["Campaigns/CampaignDetail", {marketingCampaignId: ids.plannedCampaignId}]
    ]
}

;({
    ids,
    users,
    asUser,
    system,
    refusal,
    invoke,
    page,
    screenRefusal,
    hit,
    shell,
    promotionsAuthor,
    mountedScreens,
    redirectScreens,
    mountTabs,
    sweepMade,
    sweepRecords,
    sweepParameters,
    sweepExtras
})
