// The Marketing access and isolation walk (impl-marketing P23, §2 "Scope through services", "Secrets stay on the server"; design-marketing
// §1.1, §14.3, §16.3 scenario 1, organization and private contacts), an acceptance test with artifact authorization on, on SalesAccessWalk's
// pattern. Two sides, Ziziwork Retail and Ziziwork Services, each with a user of every Marketing group but the administrator and no
// other launcher: Retail's are the demo users (marketing.author, .audience, .approver, .dispatch, .events, .analyst, .reader), Services'
// are made here in the same groups (mkaw.author and the rest) beside the demo's marketing.author2. Each side gets a campaign, a list
// with one member (a person of that side alone, with an address of their own), a segment and a draft send, each with a secret name;
// Retail also a confirmed staff registration of the demo webinar. Then:
// - another organization's records: no user of one side gets a record of the other through the Marketing routes with its id
//   (CampaignDetail, the campaign plan print, ListDetail, MemberDetail, SegmentDetail, SendDetail, Compose, CampaignDelivery,
//   RecipientDetail, RegistrationDetail, Customer360 and ContactDetail of the other side's member), the lists searched by the secret and
//   their CSV, Home and the reports for the other organization, the screens' transitions (storeCampaign, storeList, both refused and
//   changing nothing), the audience import into and the members' export of the other side's list, the survey results' CSV (P23), the
//   palette, the drop-downs (searched and as the selected value), check#Record, the record panels, Assist's tools (the registered
//   AgentToolExposure services, run as the user) and the Mantle services the screens call (reads and writes, called directly with the
//   service's own rule); the PASS operations answer another organization's list, unpublished on the demo site, as one that does not
//   exist;
// - addresses: on the November newsletter's delivery (CampaignDelivery, its CSV, RecipientDetail) Maya's address shows to the Marketing
//   administrator and to no Retail user without MARKETING_AUDIENCE_VIEW: the author, approver and dispatcher open the three masked
//   (m***@ and the domain), the events manager, analyst and reader are refused Sends (the audience manager, who holds the audience read,
//   is refused Sends too).
// The Marketing administrator (MARKETING_ALL_ORGANIZATIONS) sees each side's records on every route but Home, Attribution and Log as
// note (which name none of them), finds them in the palette and the choices and is admitted by check#Record, and each side's own author
// sees its campaign and send, so a refusal is not a broken route. The demo site ZIZI_SHOP is published for the walk, as the other
// Marketing walks do, so the PASS answers are the offer's and not a closed site's. No date of a demo send is read (follow-up 6 makes
// them relative to the load). The rules are MarketingAccess's (one case each) and Mantle's MarketingScope; menus per group are
// MarketingFoundationWalk's.
// Run: ./moq accept mr-boss --spec MarketingAccessWalk
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const {ids, users, asUser, system} = lib
const stamp = ec.l10n.format(ec.user.nowTimestamp, "HHmmssSSS")
const CAMPAIGN = "mantle.marketing.campaign.MarketingCampaign"
const C = "ironstone.marketing.ContextServices."
const PORTAL = "mantle.marketing.MarketingPortalServices."
const webroot = "component://webroot/screen/webroot.xml"
const mayaAddress = "maya.lindqvist@zizi-customers.example"
const mayaMasked = "m***@zizi-customers.example"
const groups = {
    author: "BOSS_MARKETING_AUTHOR",
    audience: "BOSS_MARKETING_AUDIENCE",
    approver: "BOSS_MARKETING_APPROVER",
    dispatch: "BOSS_MARKETING_DISPATCH",
    events: "BOSS_MARKETING_EVENTS",
    analyst: "BOSS_MARKETING_ANALYST",
    reader: "BOSS_MARKETING_READ"
}
const retailUsers = Object.keys(groups).map(role => users[role])
const servicesUsers = Object.keys(groups)
    .map(role => "mkaw." + role)
    .concat([users.otherAuthor])
// the Retail users without MARKETING_AUDIENCE_VIEW, to whom an address is masked
const maskedUsers = [users.author, users.approver, users.dispatch, users.events, users.analyst, users.reader]
const state = {setupErrors: []}

// the two sides: the organization, its own author (the control) and the users of the other side, who must not see its records
const sides = {
    retail: {org: ids.organizationId, author: users.author, others: servicesUsers},
    services: {org: ids.otherOrganizationId, author: users.otherAuthor, others: retailUsers}
}
for (const [name, s] of Object.entries(sides)) {
    const code = name === "retail" ? "R" : "S"
    s.name = name
    s.campaignId = "MKAW_CMP_" + code
    s.listId = "MKAW_LST_" + code
    s.segmentId = "MKAW_SEG_" + code
    s.sendId = "MKAW_SEND_" + code
    s.memberId = "MKAW_MEMBER_" + code
    s.address = `mkaw.member.${name}.${stamp}@isolation.example.test`
    s.secrets = {}
    for (const kind of ["campaign", "list", "segment", "send", "member"]) s.secrets[kind] = `P23A ${kind} ${name} ${stamp}`
}
// a list's search text: the secret without its "P23A " head, so the list's echo of the query is not taken for a row
const query = secret => secret.replace(/^P23A /, "")
const leaks = (s, text) =>
    Object.values(s.secrets)
        .concat([s.address])
        .filter(secret => String(text || "").includes(secret))

// a Marketing (or another root's) screen as the user, in a render mode: its status, output and errors
function render(user, path, parameters = {}, mode = "html", root = "Marketing") {
    return asUser(user, () => {
        let result
        try {
            const test = ec.screen.makeTest().rootScreen(`component://mr-boss/screen/${root}.xml`).renderMode(mode)
            if (mode === "qvt") test.withStaticData()
            result = test.render(path, Object.assign({lastStandalone: "-2"}, parameters), null)
        } catch (error) {
            result = {status: 0, output: "", errorMessages: [String(error.message)]}
        }
        ec.message.clearErrors()
        return {
            status: result.status,
            output: String(result.output || ""),
            errors: Array.from(result.errorMessages || []).join(" | ")
        }
    })
}
const opens = got => got.status == 200 && !got.errors
// a transition posted as the user: its errors, or its status when it is refused with none ("" when it is accepted)
function post(user, path, parameters) {
    return asUser(user, () => {
        let errors
        try {
            const result = ec.screen
                .makeTest()
                .rootScreen("component://mr-boss/screen/Marketing.xml")
                .render(path, parameters, "post")
            errors = Array.from(result.errorMessages || []).join(" | ") || (result.status >= 400 ? "status " + result.status : "")
        } catch (error) {
            errors = String(error.message)
        }
        ec.message.clearErrors()
        return errors
    })
}
// a path under the web root as the user (the record panels' data): status, output and errors
function hit(user, path, parameters = {}) {
    return asUser(user, () => {
        const result = ec.screen.makeTest().rootScreen(webroot).render(path, parameters, "get")
        const errors = Array.from(result.errorMessages || []).join(" | ")
        ec.message.clearErrors()
        return {status: result.status, output: String(result.output || ""), errors}
    })
}
// a service called as the user: with artifact authorization on (the palette, the choices, Assist's tools) or, withoutAuthz (direct),
// off as a screen's grant lets it call Mantle (the service's own checks deciding)
function ask(user, service, parameters = {}, withoutAuthz = false) {
    return asUser(user, () => {
        if (withoutAuthz) ec.artifactExecution.disableAuthz()
        ec.message.pushErrors()
        try {
            const out = ec.service.sync().name(service).parameters(parameters).requireNewTransaction(true).call() || {}
            return Object.assign({}, out, {error: ec.message.hasError() ? ec.message.getErrorsString() : ""})
        } catch (error) {
            return {error: String(error.message || error)}
        } finally {
            ec.message.clearErrors()
            ec.message.popErrors()
        }
    })
}
const direct = (user, service, parameters) => ask(user, service, parameters, true)
const one = (entity, values) => system(() => ec.entity.find(entity).condition(values).one())
const plain = value => JSON.stringify(value ?? null)
// a PASS operation's service as an anonymous visitor: its result, or the kind of its refusal
function visitor(service, input) {
    logout()
    try {
        return ec.service
            .sync()
            .throwOnError(true)
            .name(PORTAL + service)
            .parameters({input})
            .call().result
    } catch (error) {
        ec.message.clearErrors()
        return {kind: error.moquiErrorKind || "error"}
    } finally {
        login("john.doe")
    }
}

// the users of Services' side: one in each Marketing group but the administrator, agents of Ziziwork Services alone
function makeServicesUsers() {
    const make = (entity, values) =>
        ec.service
            .sync()
            .name("create#" + entity)
            .parameters(values)
            .disableAuthz()
            .call()
    system(() => {
        for (const [role, userGroupId] of Object.entries(groups)) {
            const partyId = "MKAW_USER_" + role.toUpperCase()
            if (one("moqui.security.UserAccount", {userId: partyId})) continue
            make("mantle.party.Party", {partyId, partyTypeEnumId: "PtyPerson"})
            make("mantle.party.Person", {partyId, firstName: "Services", lastName: role})
            make("mantle.party.PartyRelationship", {
                fromPartyId: partyId,
                toPartyId: ids.otherOrganizationId,
                relationshipTypeEnumId: "PrtAgent",
                toRoleTypeId: "OrgInternal",
                fromDate: 0
            })
            make("moqui.security.UserAccount", {
                userId: partyId,
                username: "mkaw." + role,
                partyId,
                currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
                passwordHashType: "SHA"
            })
            for (const group of ["BOSS_USERS", "BOSS_MARKETING", userGroupId])
                make("moqui.security.UserGroupMember", {userId: partyId, userGroupId: group, fromDate: 0})
        }
    })
}
// a side's records, with their secret names: a campaign, a list with one accepted member, a segment of that list and a draft send
function makeRecords(s) {
    const make = (entity, values) =>
        ec.service
            .sync()
            .name("create#" + entity)
            .parameters(values)
            .disableAuthz()
            .call()
    system(() => {
        if (one(CAMPAIGN, {marketingCampaignId: s.campaignId})) {
            // a second run: the names take this run's secrets
            ec.entity.find(CAMPAIGN).condition("marketingCampaignId", s.campaignId).updateAll({campaignName: s.secrets.campaign})
            ec.entity
                .find("mantle.marketing.contact.ContactList")
                .condition("contactListId", s.listId)
                .updateAll({contactListName: s.secrets.list})
            ec.entity
                .find("mantle.marketing.segment.MarketSegment")
                .condition("marketSegmentId", s.segmentId)
                .updateAll({segmentName: s.secrets.segment})
            ec.entity
                .find("mantle.marketing.campaign.CampaignSend")
                .condition("campaignSendId", s.sendId)
                .updateAll({sendName: s.secrets.send})
            ec.entity.find("mantle.party.Person").condition("partyId", s.memberId).updateAll({lastName: s.secrets.member})
            ec.entity
                .find("mantle.party.contact.ContactMech")
                .condition("contactMechId", s.memberId + "_EM")
                .updateAll({infoString: s.address})
            ec.entity
                .find("mantle.marketing.contact.ContactListParty")
                .condition({contactListId: s.listId, partyId: s.memberId})
                .updateAll({preferredContactMechId: s.memberId + "_EM"})
            return
        }
        make(CAMPAIGN, {
            marketingCampaignId: s.campaignId,
            campaignName: s.secrets.campaign,
            organizationPartyId: s.org,
            statusId: "MKTG_CAMP_PLANNED",
            campaignRevision: 1,
            createdByUserId: one("moqui.security.UserAccount", {username: s.author})?.userId
        })
        make("mantle.marketing.contact.ContactList", {
            contactListId: s.listId,
            contactListName: s.secrets.list,
            contactListTypeEnumId: "NEWSLETTER",
            contactMechTypeEnumId: "CmtEmailAddress",
            ownerPartyId: s.org,
            marketingCampaignId: s.campaignId
        })
        make("mantle.party.Party", {partyId: s.memberId, partyTypeEnumId: "PtyPerson", ownerPartyId: s.org})
        make("mantle.party.Person", {partyId: s.memberId, firstName: "Isolated", lastName: s.secrets.member})
        make("mantle.party.contact.ContactMech", {
            contactMechId: s.memberId + "_EM",
            contactMechTypeEnumId: "CmtEmailAddress",
            infoString: s.address
        })
        make("mantle.party.contact.PartyContactMech", {
            partyId: s.memberId,
            contactMechId: s.memberId + "_EM",
            contactMechPurposeId: "EmailPrimary",
            fromDate: ec.user.nowTimestamp
        })
        make("mantle.marketing.contact.ContactListParty", {
            contactListId: s.listId,
            partyId: s.memberId,
            fromDate: ec.user.nowTimestamp,
            statusId: "CLPT_ACCEPTED",
            preferredContactMechId: s.memberId + "_EM"
        })
        make("mantle.marketing.segment.MarketSegment", {
            marketSegmentId: s.segmentId,
            marketSegmentTypeEnumId: "MARKET_SEGMENT",
            segmentName: s.secrets.segment,
            segmentKindEnumId: "MskExplicit",
            ownerPartyId: s.org,
            definitionRevision: 1
        })
        make("mantle.marketing.campaign.CampaignSend", {
            campaignSendId: s.sendId,
            marketingCampaignId: s.campaignId,
            organizationPartyId: s.org,
            sendName: s.secrets.send,
            channelEnumId: "MdcEmail",
            contactListId: s.listId,
            purposeEnumId: "PcpMarketingEmail",
            audienceJson: "{}",
            subject: s.secrets.send,
            localeId: "en",
            statusId: "CsDraft",
            sendRevision: 1,
            createdDate: ec.user.nowTimestamp
        })
    })
}
// Retail's confirmed staff registration of the demo webinar's free place, by its events manager (the attendee named by the secret)
function makeRegistration(s) {
    const E = "mantle.work.EventRegistrationServices."
    const made = asUser(users.events, () =>
        system(() => {
            const reserved = ec.service
                .sync()
                .name(E + "reserve#Registration")
                .parameters({
                    registrationPolicyId: ids.webinarOfferId,
                    ticketTypeId: ids.webinarTicketId,
                    quantity: 1,
                    buyerName: s.secrets.member,
                    buyerEmail: s.address,
                    requestKey: "mkaw" + Math.floor(Math.random() * 1e9)
                })
                .call()
            return ec.service
                .sync()
                .name(E + "complete#Registration")
                .parameters({reservationId: reserved.reservationId, attendees: [{name: s.secrets.member}], acceptTerms: true})
                .call()
        })
    )
    ec.message.clearErrors()
    s.registrationId = (made?.registrationIds || [])[0] || null
}

// the Marketing routes that show a side's records, with the ids the walk made
function routes(s) {
    const list = [
        ["Campaigns/CampaignDetail", {marketingCampaignId: s.campaignId}],
        ["Campaigns/CampaignPlan", {marketingCampaignId: s.campaignId}],
        ["Campaigns/Campaigns", {text: query(s.secrets.campaign)}],
        ["Campaigns/Campaigns", {text: query(s.secrets.campaign), pageNoLimit: "true", lastStandalone: "true"}, "csv"],
        ["Audiences/ListDetail", {contactListId: s.listId}],
        ["Audiences/MemberDetail", {contactListId: s.listId, partyId: s.memberId}],
        ["Audiences/Lists", {text: query(s.secrets.list)}],
        ["Audiences/Lists", {text: query(s.secrets.list), pageNoLimit: "true", lastStandalone: "true"}, "csv"],
        ["Audiences/SegmentDetail", {marketSegmentId: s.segmentId}],
        ["Audiences/Segments", {text: query(s.secrets.segment)}],
        ["Audiences/AudienceImport", {contactListId: s.listId}],
        ["Audiences/AudiencePreview", {topicListId: s.listId, listIds: s.listId}],
        ["Sends/SendDetail", {campaignSendId: s.sendId}],
        ["Sends/Compose", {campaignSendId: s.sendId}],
        ["Sends/Sends", {text: query(s.secrets.send)}],
        ["Sends/Sends", {text: query(s.secrets.send), pageNoLimit: "true", lastStandalone: "true"}, "csv"],
        ["Sends/CampaignDelivery", {campaignSendId: s.sendId}],
        ["Customers/Customer360", {customerPartyId: s.memberId, organizationPartyId: s.org}],
        ["Contacts/ContactDetail", {partyId: s.memberId}],
        ["Home", {organizationPartyId: s.org}],
        ["Reports/CampaignPerformance", {organizationPartyId: s.org}],
        ["Reports/AudienceGrowth", {organizationPartyId: s.org}],
        ["Reports/Attribution", {organizationPartyId: s.org}],
        ["LogNote", {entityName: CAMPAIGN, recordId: s.campaignId}],
        ["SendMessage", {entityName: CAMPAIGN, recordId: s.campaignId}]
    ]
    if (s.registrationId) list.push(["Events/RegistrationDetail", {registrationId: s.registrationId}])
    if (s.registrationId) list.push(["Events/Registrations", {workEffortId: ids.webinarEventId, term: query(s.secrets.member)}])
    return list.map(([path, parameters, mode]) => ({path, parameters, mode: mode || "html"}))
}
const routeName = route => `${route.path} ${route.mode} ${JSON.stringify(route.parameters)}`
// the routes that name none of a side's records even to the administrator (Home's counts, Attribution's orders, Log as note's id)
const quietRoutes = ["Home", "Reports/Attribution", "LogNote"]
// a refusal's message: the record answering as missing, a permission or the screen's authorization; never a stale revision or a
// validation error, which would mean the call reached the record
const refusedText = text =>
    /RECORD_UNAVAILABLE|ORGANIZATION_DENIED|PERMISSION_DENIED|not authorized|not available/i.test(String(text || ""))

spec({
    setupSpec() {
        login("john.doe")
        try {
            makeServicesUsers()
            for (const s of Object.values(sides)) makeRecords(s)
            makeRegistration(sides.retail)
            // the demo site opened for the walk, as P7's and P16's walks do (a closed site answers every PASS operation NotFound)
            system(() =>
                ec.service
                    .sync()
                    .name("update#mantle.public.PublicSite")
                    .parameters({siteId: "ZIZI_SHOP", state: "published"})
                    .disableAuthz()
                    .call()
            )
        } catch (error) {
            state.setupErrors.push(String(error.message))
        }
        login("john.doe")
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        // the spec users' memberships end, so no later spec meets a Marketing user it does not know
        system(() =>
            ec.entity
                .find("moqui.security.UserGroupMember")
                .condition("userId", "like", "MKAW_USER_%")
                .updateAll({thruDate: ec.user.nowTimestamp})
        )
        ec.artifactExecution.enableAuthz()
    }
})

feature("each side's records are made; its own author and the Marketing administrator see them", {
    when() {
        const problems = state.setupErrors.slice()
        for (const s of Object.values(sides)) {
            for (const viewer of [s.author, users.admin]) {
                for (const [path, parameters, secret] of [
                    ["Campaigns/CampaignDetail", {marketingCampaignId: s.campaignId}, s.secrets.campaign],
                    ["Sends/SendDetail", {campaignSendId: s.sendId}, s.secrets.send]
                ]) {
                    const got = render(viewer, path, parameters)
                    if (!got.output.includes(secret)) problems.push(`${viewer} does not see ${secret} on ${path}: ${got.errors}`)
                }
            }
            for (const [path, parameters, secret] of [
                ["Audiences/ListDetail", {contactListId: s.listId}, s.secrets.list],
                ["Audiences/SegmentDetail", {marketSegmentId: s.segmentId}, s.secrets.segment]
            ]) {
                const got = render(users.admin, path, parameters)
                if (!got.output.includes(secret))
                    problems.push(`the administrator does not see ${secret} on ${path}: ${got.errors}`)
            }
        }
        // the administrator sees each side's records on every route that names them, finds them and is admitted to them
        for (const s of Object.values(sides)) {
            for (const route of routes(s)) {
                if (quietRoutes.includes(route.path)) continue
                const got = render(users.admin, route.path, route.parameters, route.mode)
                if (!leaks(s, got.output).length)
                    problems.push(`the administrator sees nothing of ${s.name} on ${routeName(route)}: ${got.errors}`)
            }
            const palette = ask(users.admin, C + "search#Records", {text: query(s.secrets.campaign)})
            if (!leaks(s, plain(palette.rows)).length) problems.push(`the administrator's palette misses ${s.name}'s campaign`)
            for (const [choice, term] of [
                ["campaigns", query(s.secrets.campaign)],
                ["lists", query(s.secrets.list)],
                ["segments", query(s.secrets.segment)],
                ["reportCampaigns", query(s.secrets.campaign)]
            ]) {
                const searched = ask(users.admin, C + "get#Choices", {choice, term})
                if (!leaks(s, plain(searched.options)).length)
                    problems.push(`the administrator's ${choice} miss ${s.name}'s record`)
            }
            for (const [recordType, recordId] of [
                ["campaign", s.campaignId],
                ["list", s.listId],
                ["segment", s.segmentId],
                ["send", s.sendId],
                ["contact", s.memberId],
                ["organization", s.org]
            ]) {
                const checked = ask(users.admin, C + "check#Record", {recordType, recordId})
                if (checked.error) problems.push(`the administrator's check#Record ${recordType} of ${s.name}: ${checked.error}`)
            }
        }
        // Retail's audience manager sees Retail's list, and the events manager the registration
        const list = render(users.audience, "Audiences/ListDetail", {contactListId: sides.retail.listId})
        if (!list.output.includes(sides.retail.secrets.list))
            problems.push(`the audience manager does not see Retail's list: ${list.errors}`)
        if (!sides.retail.registrationId) problems.push("Retail's registration was not made")
        else {
            const registration = render(users.events, "Events/RegistrationDetail", {registrationId: sides.retail.registrationId})
            if (!registration.output.includes(sides.retail.secrets.member))
                problems.push(`the events manager does not see the registration: ${registration.errors}`)
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("another organization's records show on no Marketing route, list, export, print or report", {
    when() {
        const problems = []
        for (const s of Object.values(sides)) {
            for (const viewer of s.others) {
                for (const route of routes(s)) {
                    const got = render(viewer, route.path, route.parameters, route.mode)
                    const seen = leaks(s, got.output)
                    if (seen.length) problems.push(`${viewer} sees ${seen} on ${routeName(route)}`)
                }
            }
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("the transitions, the audience import and the members' export refuse another organization's records and change nothing", {
    when() {
        const problems = []
        for (const s of Object.values(sides)) {
            for (const viewer of s.others) {
                const campaign = post(viewer, "Campaigns/CampaignDetail/storeCampaign", {
                    marketingCampaignId: s.campaignId,
                    expectedRevision: "1",
                    campaignName: "Taken over by " + viewer
                })
                if (!refusedText(campaign)) problems.push(`${viewer} saved ${s.name}'s campaign: ${campaign || "accepted"}`)
                const list = post(viewer, "Audiences/ListDetail/storeList", {
                    contactListId: s.listId,
                    contactListName: "Taken over by " + viewer
                })
                if (!refusedText(list)) problems.push(`${viewer} saved ${s.name}'s list: ${list || "accepted"}`)
                // the members' export answers no file of the other side's list
                const exported = render(viewer, "Audiences/ListDetail/exportMembers", {contactListId: s.listId})
                if (exported.output.includes(s.address)) problems.push(`${viewer} exports ${s.name}'s members`)
                // the import stages nothing for the other side's list
                const staged = direct(viewer, "mantle.marketing.AudienceServices.preview#AudienceImport", {
                    contactListId: s.listId,
                    fileText: "email,first name\nmkaw.import@isolation.example.test,Import\n",
                    fileName: "isolation.csv",
                    evidenceText: "Isolation walk",
                    evidenceDate: new Date(Date.now() - 2 * 86400000)
                })
                if (!refusedText(staged.error) || staged.audienceImportId)
                    problems.push(`${viewer} stages an import into ${s.name}'s list: ${staged.error || "staged"}`)
            }
            if (one(CAMPAIGN, {marketingCampaignId: s.campaignId})?.campaignName !== s.secrets.campaign)
                problems.push(`${s.name}'s campaign was renamed`)
            if (one("mantle.marketing.contact.ContactList", {contactListId: s.listId})?.contactListName !== s.secrets.list)
                problems.push(`${s.name}'s list was renamed`)
        }
        // the controls: Retail's audience manager exports Retail's list, and the analyst downloads the demo survey's results (P23)
        const exported = render(users.audience, "Audiences/ListDetail/exportMembers", {contactListId: sides.retail.listId})
        const results = render(
            users.analyst,
            "Surveys/Responses",
            {formId: ids.surveyFormId, pageNoLimit: "true", lastStandalone: "true"},
            "csv"
        )
        const otherResults = render(
            users.otherAuthor,
            "Surveys/Responses",
            {formId: ids.surveyFormId, pageNoLimit: "true", lastStandalone: "true"},
            "csv"
        )
        return {problems, exported, results, otherResults}
    },
    then({problems, exported, results, otherResults}) {
        problems.join("\n") == ""
        exported.output.includes(sides.retail.address)
        // the results' CSV: Retail's analyst gets the demo survey's response rows; Services' author none of them
        results.output.includes("Answered") && results.output.includes("Respondent")
        !otherResults.output.includes("Respondent")
    }
})

feature("the palette, the drop-downs, check#Record and the record panels give nothing of another organization's records", {
    when() {
        const problems = []
        for (const s of Object.values(sides)) {
            for (const viewer of s.others) {
                const palette = ask(viewer, C + "search#Records", {text: query(s.secrets.campaign)})
                const paletteSends = ask(viewer, C + "search#Records", {text: query(s.secrets.send)})
                for (const found of [palette, paletteSends])
                    if (leaks(s, plain(found.rows)).length) problems.push(`${viewer}'s palette finds ${s.name}'s records`)
                for (const [choice, term, selected] of [
                    ["campaigns", query(s.secrets.campaign), s.campaignId],
                    ["lists", query(s.secrets.list), s.listId],
                    ["segments", query(s.secrets.segment), s.segmentId],
                    ["reportCampaigns", query(s.secrets.campaign), s.campaignId]
                ]) {
                    const searched = ask(viewer, C + "get#Choices", {choice, term})
                    const chosen = ask(viewer, C + "get#Choices", {choice, selected})
                    if (leaks(s, plain(searched.options)).length || leaks(s, plain(chosen.options)).length)
                        problems.push(`${viewer}'s ${choice} offer ${s.name}'s record`)
                }
                for (const [recordType, recordId] of [
                    ["campaign", s.campaignId],
                    ["list", s.listId],
                    ["segment", s.segmentId],
                    ["send", s.sendId],
                    ["contact", s.memberId],
                    ["organization", s.org]
                ]) {
                    const checked = ask(viewer, C + "check#Record", {recordType, recordId})
                    if (!/RECORD_UNAVAILABLE|PERMISSION_DENIED|not authorized/.test(checked.error))
                        problems.push(`${viewer}: check#Record ${recordType} of ${s.name}: ${checked.error || "given"}`)
                }
                if (s.registrationId) {
                    const checked = ask(viewer, C + "check#Record", {recordType: "registration", recordId: s.registrationId})
                    if (!/RECORD_UNAVAILABLE|PERMISSION_DENIED|not authorized/.test(checked.error))
                        problems.push(`${viewer}: check#Record of ${s.name}'s registration: ${checked.error || "given"}`)
                }
                const panel = hit(viewer, "apps/Marketing/RecordFiles/filesData", {
                    recordEntity: CAMPAIGN,
                    recordId: s.campaignId
                })
                if (!/RECORD_PANEL_UNAVAILABLE|not authorized/.test(panel.errors) && panel.status == 200)
                    problems.push(`${viewer} opens the files panel of ${s.name}'s campaign`)
            }
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("Assist's Marketing tools, run as the user, give nothing of another organization's records", {
    when() {
        const problems = []
        const tools = system(() =>
            Array.from(ec.entity.find("moqui.agent.AgentToolExposure").condition("toolName", "like", "marketing_%").list()).map(
                row => ({name: row.toolName, service: row.serviceName})
            )
        )
        // each tool's parameters naming the other side's organization, campaign or list
        const parametersOf = (tool, s) =>
            /count#Audience/.test(tool.service)
                ? {topicListId: s.listId, listIds: [s.listId]}
                : {organizationPartyId: s.org, marketingCampaignId: s.campaignId}
        for (const s of Object.values(sides)) {
            for (const viewer of s.others) {
                for (const tool of tools) {
                    const out = ask(viewer, tool.service, parametersOf(tool, s))
                    const seen = leaks(s, plain(out))
                    if (seen.length) problems.push(`${viewer}'s ${tool.name} gives ${seen}`)
                    // the audience counts: no count of a list the user does not read
                    if (/count#Audience/.test(tool.service) && !out.error && out.total > 0)
                        problems.push(`${viewer}'s ${tool.name} counts ${s.name}'s list: ${plain(out)}`)
                }
            }
        }
        return {problems, tools}
    },
    then({problems, tools}) {
        tools.length >= 2
        problems.join("\n") == ""
    }
})

feature("Mantle's Marketing services, called as the user, read and change nothing of another organization's records", {
    when() {
        const problems = []
        const refused = out =>
            /RECORD_UNAVAILABLE|ORGANIZATION_DENIED|PERMISSION_DENIED|not authorized|not available/i.test(out.error)
        for (const s of Object.values(sides)) {
            for (const viewer of s.others) {
                const reads = [
                    ["mantle.marketing.CampaignServices.get#Campaign", {marketingCampaignId: s.campaignId}],
                    ["mantle.marketing.AudienceServices.get#List", {contactListId: s.listId}],
                    ["mantle.marketing.AudienceServices.find#Members", {contactListId: s.listId}],
                    ["mantle.marketing.SegmentServices.get#Segment", {marketSegmentId: s.segmentId}],
                    ["mantle.marketing.CampaignSendServices.get#Send", {campaignSendId: s.sendId}],
                    ["mantle.marketing.CampaignSendServices.find#Recipients", {campaignSendId: s.sendId}]
                ]
                if (s.registrationId)
                    reads.push(["mantle.work.EventRegistrationServices.get#Registration", {registrationId: s.registrationId}])
                for (const [service, parameters] of reads) {
                    const out = direct(viewer, service, parameters)
                    if (!refused(out) || leaks(s, plain(out)).length)
                        problems.push(`${viewer} reads ${s.name}'s record through ${service}: ${out.error || "given"}`)
                }
                // the finders answer no row of the other side, by its secret
                for (const [service, parameters] of [
                    ["mantle.marketing.CampaignServices.find#Campaigns", {text: query(s.secrets.campaign)}],
                    ["mantle.marketing.AudienceServices.find#Lists", {text: query(s.secrets.list)}],
                    ["mantle.marketing.SegmentServices.find#Segments", {text: query(s.secrets.segment)}],
                    ["mantle.marketing.CampaignSendServices.find#Sends", {text: query(s.secrets.send)}],
                    ["mantle.marketing.MarketingReportServices.get#CampaignPerformance", {organizationPartyId: s.org}]
                ]) {
                    const out = direct(viewer, service, parameters)
                    const seen = leaks(s, plain(out))
                    if (seen.length) problems.push(`${viewer}'s ${service} answers ${seen}`)
                }
                // the writes are refused and change nothing
                for (const [service, parameters] of [
                    [
                        "mantle.marketing.CampaignServices.store#Campaign",
                        {marketingCampaignId: s.campaignId, expectedRevision: 1, campaignName: "Direct " + viewer}
                    ],
                    [
                        "mantle.marketing.AudienceServices.store#List",
                        {contactListId: s.listId, contactListName: "Direct " + viewer}
                    ],
                    [
                        "mantle.marketing.CampaignSendServices.store#Send",
                        {campaignSendId: s.sendId, expectedRevision: 1, sendName: "Direct " + viewer}
                    ]
                ]) {
                    const out = direct(viewer, service, parameters)
                    if (!refused(out))
                        problems.push(`${viewer} writes ${s.name}'s record through ${service}: ${out.error || "accepted"}`)
                }
            }
            if (one(CAMPAIGN, {marketingCampaignId: s.campaignId})?.campaignName !== s.secrets.campaign)
                problems.push(`${s.name}'s campaign was renamed`)
            if (one("mantle.marketing.campaign.CampaignSend", {campaignSendId: s.sendId})?.sendName !== s.secrets.send)
                problems.push(`${s.name}'s send was renamed`)
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature(
    "the PASS operations answer another organization's list as one that does not exist, and a forged registration link alike",
    {
        when() {
            return {
                services: visitor("get#Publication", {siteId: "ZIZI_SHOP", contactListId: sides.services.listId}),
                unoffered: visitor("get#Publication", {siteId: "ZIZI_SHOP", contactListId: sides.retail.listId}),
                missing: visitor("get#Publication", {siteId: "ZIZI_SHOP", contactListId: "MKAW_NO_SUCH_LIST"}),
                offered: visitor("get#Publication", {siteId: "ZIZI_SHOP", contactListId: ids.gardenListId}),
                forged: visitor("get#Registration", {siteId: "ZIZI_SHOP", token: "x".repeat(48)}),
                forgedOther: visitor("get#Registration", {siteId: "ZIZI_SHOP", token: "y".repeat(48)})
            }
        },
        then({services, unoffered, missing, offered, forged, forgedOther}) {
            // the demo's garden newsletter is offered on the shop (the control); the rest answer the same refusal, naming nothing
            offered.topics.length == 1
            !!missing.kind
            services.kind == missing.kind && unoffered.kind == missing.kind
            !plain(services).includes("P23A") && !plain(unoffered).includes("P23A")
            !!forged.kind && forged.kind == forgedOther.kind
        }
    }
)

feature(
    "Maya's address on the November newsletter's delivery shows to the administrator and to no Retail user without the audience read",
    {
        when() {
            const problems = []
            const delivery = [
                ["Sends/CampaignDelivery", {campaignSendId: ids.approvedSendId}, "html"],
                [
                    "Sends/CampaignDelivery",
                    {campaignSendId: ids.approvedSendId, pageNoLimit: "true", lastStandalone: "true"},
                    "csv"
                ],
                ["Sends/RecipientDetail", {campaignRecipientId: "BOSS_MKT_RCPT_NOV_MAYA"}, "html"]
            ]
            // the author, approver and dispatcher open each of them with the address masked; the others are refused Sends
            const opening = [users.author, users.approver, users.dispatch]
            for (const viewer of maskedUsers)
                for (const [path, parameters, mode] of delivery) {
                    const got = render(viewer, path, parameters, mode)
                    if (got.output.includes(mayaAddress)) problems.push(`${viewer} sees Maya's address on ${path} ${mode}`)
                    if (opening.includes(viewer) && !(opens(got) && got.output.includes(mayaMasked)))
                        problems.push(`${viewer} does not open ${path} ${mode} with the address masked: ${got.errors}`)
                    if (!opening.includes(viewer) && opens(got)) problems.push(`${viewer} opens ${path} ${mode}`)
                }
            // the services too, as the user: no address without the audience read
            for (const viewer of [users.dispatch, users.approver]) {
                const out = direct(viewer, "mantle.marketing.CampaignSendServices.get#Recipient", {
                    campaignRecipientId: "BOSS_MKT_RCPT_NOV_MAYA"
                })
                if (plain(out).includes(mayaAddress)) problems.push(`${viewer} reads Maya's address through get#Recipient`)
            }
            // the control: the administrator (every Marketing permission) reads the address on the three
            const shown = delivery.map(([path, parameters, mode]) =>
                render(users.admin, path, parameters, mode).output.includes(mayaAddress)
            )
            return {problems, shown}
        },
        then({problems, shown}) {
            problems.join("\n") == ""
            shown.every(Boolean)
        }
    }
)
