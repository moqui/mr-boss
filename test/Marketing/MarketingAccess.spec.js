// Marketing access (impl-marketing §2, P1; design-marketing §1.1, §1.2, §12, §14.3): the app's one access spec. Who may open
// Marketing and the context they get (another root, another app's user, a client and a PASS account refused), the menu, keys and
// launcher per group, each group's capabilities from its permissions (an edit permission alone reading nothing), a campaign, list
// and segment of another organization and an unowned one refused through the context service with the same parameters, the
// ironstone.marketing services refused without the root grant, a write verb of the package denied a client and the raw Mantle
// marketing mutators refused a Marketing user, the record panels served for Marketing's own record hosts only (P2: the campaign of
// the user's organization), Approvals for the approvers alone (P2), Home's
// one qvt render and the settings landing's one html render (the administrator's; an author is refused Settings), and Marketing's
// rows in Admin's registries (each bundle carrying exactly its group's grants, the readiness provider and the settings entry).
// One feature per rule, each case of it a line of its problems, with artifact authorization enabled. Mantle's scope rules (the
// organization filters, the list services' organization check, adoption) are Mantle's MarketingScope. The access and isolation
// walk is the acceptance MarketingFoundationWalk. A later phase adds a case only for an access rule it adds. P18: a door tablet of the
// MARKETING_CHECKIN route group, its display account in the door group alone, opens CheckIn (its bare page, the one html render, and
// its island, the one qvt render) for its offer, and every other Marketing screen and the shell are refused.
// Run: ./moq test mr-boss --spec MarketingAccess
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page, screenRefusal, shell} = lib
const contextServices = "ironstone.marketing.ContextServices."
const context = contextServices + "get#SharedContext"
const checkRecord = contextServices + "check#Record"
const choices = contextServices + "get#Choices"
// a refusal of a user without Marketing: the service is not authorized for them, or it refuses them
const refused = message => /MARKETING_UNAVAILABLE|is not authorized/.test(message)
const unauthorized = message => /^40[13] |is not authorized/.test(message)
// a spec-local user of a custom group given the Marketing root in Admin, not in BOSS_MARKETING, holding MARKETING_CAMPAIGN_EDIT
// alone
const editOnly = "MKT_SPEC_EDIT_ONLY"
// the spec's records: a campaign, a list and a segment of each demo organization and one of none (awaiting adoption)
const record = (kind, suffix) => "MKT_SPEC_" + kind + "_" + suffix

spec({
    setupSpec() {
        login("john.doe")
        system(() => {
            call("create#moqui.security.UserGroup", {userGroupId: editOnly, description: "Marketing spec: campaign edit alone"})
            call("create#moqui.security.UserGroupPermission", {
                userGroupId: editOnly,
                userPermissionId: "MARKETING_CAMPAIGN_EDIT",
                fromDate: 0
            })
            call("create#moqui.security.ArtifactAuthz", {
                artifactAuthzId: editOnly,
                userGroupId: editOnly,
                artifactGroupId: "BOSS_MARKETING",
                authzTypeEnumId: "AUTHZT_ALLOW",
                authzActionEnumId: "AUTHZA_ALL"
            })
            call("create#mantle.party.Party", {partyId: editOnly, partyTypeEnumId: "PtyPerson"})
            call("create#mantle.party.Person", {partyId: editOnly, firstName: "Marketing spec", lastName: "Edit only"})
            call("create#mantle.party.PartyRelationship", {
                relationshipTypeEnumId: "PrtAgent",
                fromPartyId: editOnly,
                toPartyId: ids.organizationId,
                toRoleTypeId: "OrgInternal",
                fromDate: 0
            })
            call("create#moqui.security.UserAccount", {
                userId: editOnly,
                username: "marketing.spec.editonly",
                partyId: editOnly,
                currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
                passwordHashType: "SHA"
            })
            for (const userGroupId of ["BOSS_USERS", editOnly])
                call("create#moqui.security.UserGroupMember", {userId: editOnly, userGroupId, fromDate: 0})
            for (const [suffix, owner] of [
                ["RETAIL", ids.organizationId],
                ["SERVICES", ids.otherOrganizationId],
                ["NONE", null]
            ]) {
                call("create#mantle.marketing.campaign.MarketingCampaign", {
                    marketingCampaignId: record("CMP", suffix),
                    campaignName: "Spec campaign " + suffix,
                    statusId: "MKTG_CAMP_PLANNED",
                    organizationPartyId: owner
                })
                call("create#mantle.marketing.contact.ContactList", {
                    contactListId: record("LST", suffix),
                    contactListName: "Spec list " + suffix,
                    contactListTypeEnumId: "NEWSLETTER",
                    ownerPartyId: owner
                })
                call("create#mantle.marketing.segment.MarketSegment", {
                    marketSegmentId: record("SEG", suffix),
                    description: "Spec segment " + suffix,
                    marketSegmentTypeEnumId: "MARKET_SEGMENT",
                    ownerPartyId: owner || "_NA_"
                })
            }
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        // the spec user's memberships end and its grant goes, and the unowned records are given an owner, so no later spec meets
        // a Marketing user or a record awaiting adoption it does not know
        system(() => {
            ec.entity
                .find("moqui.security.UserGroupMember")
                .condition("userId", editOnly)
                .updateAll({thruDate: ec.user.nowTimestamp})
            ec.entity.find("moqui.security.ArtifactAuthz").condition("artifactAuthzId", editOnly).deleteAll()
            ec.entity
                .find("mantle.marketing.campaign.MarketingCampaign")
                .condition("marketingCampaignId", record("CMP", "NONE"))
                .updateAll({organizationPartyId: ids.organizationId})
            ec.entity
                .find("mantle.marketing.contact.ContactList")
                .condition("contactListId", record("LST", "NONE"))
                .updateAll({ownerPartyId: ids.organizationId})
            ec.entity
                .find("mantle.marketing.segment.MarketSegment")
                .condition("marketSegmentId", record("SEG", "NONE"))
                .updateAll({ownerPartyId: ids.organizationId})
        })
        ec.artifactExecution.enableAuthz()
    }
})

feature("a Marketing user gets their context; another root, another app's user, a client and a PASS account are refused", {
    when() {
        const problems = []
        const author = asUser(users.author, () => invoke(context, {}))
        if (
            !author.organizationPartyIds.includes(ids.organizationId) ||
            author.organizationPartyIds.includes(ids.otherOrganizationId) ||
            author.allOrganizations
        )
            problems.push(`the author's organizations: ${author.organizationPartyIds}`)
        if (author.appRoot !== "Marketing" || author.sharedLinks?.Home !== "//Marketing/Home")
            problems.push(`the author's context: ${JSON.stringify(author)}`)
        const other = asUser(users.otherAuthor, () => invoke(context, {}))
        if (
            !other.organizationPartyIds.includes(ids.otherOrganizationId) ||
            other.organizationPartyIds.includes(ids.organizationId)
        )
            problems.push(`the Services author's organizations: ${other.organizationPartyIds}`)
        // the administrator's scope is every internal organization (MARKETING_ALL_ORGANIZATIONS)
        const admin = asUser(users.admin, () => invoke(context, {}))
        if (!admin.allOrganizations || !admin.organizationPartyIds.includes(ids.otherOrganizationId))
            problems.push(`the administrator's organizations: ${admin.allOrganizations} ${admin.organizationPartyIds}`)
        const otherRoot = asUser(users.author, () => refusal(context, {appRoot: "Warehouse"}))
        if (!otherRoot.includes("MARKETING_CONTEXT")) problems.push(`another root's context is given: ${otherRoot}`)
        for (const user of [users.otherApp, users.client, users.pass]) {
            const message = asUser(user, () => refusal(context, {}))
            if (!refused(message)) problems.push(`${user} gets the context: ${message || "accepted"}`)
            const home = screenRefusal(user, "Home")
            if (!unauthorized(home)) problems.push(`${user} opens Home: ${home || "opened"}`)
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("the Marketing menu and keys follow the groups; the launcher shows Marketing to its users only", {
    when() {
        const problems = []
        const author = shell(users.author)
        // P6: the author opens Sends (Comms' templates) and its key
        if (author.status != 200 || JSON.stringify(author.names) !== JSON.stringify(ids.authorMenu))
            problems.push(`the author's menu: ${author.status} ${author.names}`)
        const keymap = (author.providers?.keymaps || []).find(keymap => keymap.scope === "marketing")
        const keys = (keymap?.keys || []).map(key => key.keys)
        if (JSON.stringify(keys) !== JSON.stringify(ids.authorKeys)) problems.push(`the author's marketing keys: ${keys}`)
        const sendsTabs = shell(users.author, true, "Sends/MessageTemplates", "Sends")
        if (JSON.stringify(sendsTabs.names) !== JSON.stringify(ids.sendsMenu))
            problems.push(`the author's Sends tabs: ${sendsTabs.status} ${sendsTabs.names}`)
        if (!author.apps.includes("Marketing")) problems.push(`the author's launcher has no Marketing: ${author.apps}`)
        // P20: the reader opens Reports, the events manager does not
        for (const [user, menu] of [
            [users.events, ids.staffMenu],
            [users.reader, ids.readerMenu]
        ]) {
            const names = shell(user, true).names
            if (JSON.stringify(names) !== JSON.stringify(menu)) problems.push(`${user}'s menu: ${names}`)
        }
        // P12: the analyst opens Surveys (the responses)
        const analystNames = shell(users.analyst, true).names
        if (JSON.stringify(analystNames) !== JSON.stringify(ids.analystMenu)) problems.push(`the analyst's menu: ${analystNames}`)
        // P8: the approver and the dispatcher open Sends, its Sends tab and not the templates
        for (const user of [users.approver, users.dispatch]) {
            const names = shell(user, true).names
            if (JSON.stringify(names) !== JSON.stringify(ids.sendsStaffMenu)) problems.push(`${user}'s menu: ${names}`)
        }
        const approverSends = shell(users.approver, true, "Sends/Sends", "Sends")
        if (JSON.stringify(approverSends.names) !== JSON.stringify(ids.approverSendsMenu))
            problems.push(`the approver's Sends tabs: ${approverSends.status} ${approverSends.names}`)
        // P3: Audiences for the audience manager and the administrator, Leads for a Sales reader
        for (const [user, menu] of [
            [users.audience, ids.audienceMenu],
            [users.admin, ids.adminMenu],
            [users.system, ids.systemMenu]
        ]) {
            const names = shell(user, true).names
            if (JSON.stringify(names) !== JSON.stringify(menu)) problems.push(`${user}'s menu: ${names}`)
        }
        const audienceTabs = shell(users.audience, true, "Audiences/Lists", "Audiences")
        if (JSON.stringify(audienceTabs.names) !== JSON.stringify(ids.audiencesMenu))
            problems.push(`the audience manager's Audiences tabs: ${audienceTabs.status} ${audienceTabs.names}`)
        const settings = shell(users.admin, true, "Settings/Index", "Settings")
        if (JSON.stringify(settings.names) !== JSON.stringify(ids.settingsMenu))
            problems.push(`the administrator's Settings tabs: ${settings.status} ${settings.names}`)
        // P2: Campaigns' Approvals tab for the approver alone
        const approverTabs = shell(users.approver, true, "Campaigns/Campaigns", "Campaigns")
        if (JSON.stringify(approverTabs.names) !== JSON.stringify(ids.approverCampaignsMenu))
            problems.push(`the approver's Campaigns tabs: ${approverTabs.status} ${approverTabs.names}`)
        const authorTabs = shell(users.author, true, "Campaigns/Campaigns", "Campaigns")
        if (JSON.stringify(authorTabs.names) !== JSON.stringify(ids.campaignsMenu))
            problems.push(`the author's Campaigns tabs: ${authorTabs.status} ${authorTabs.names}`)
        if (shell(users.otherApp).apps.includes("Marketing")) problems.push(`${users.otherApp} has Marketing`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

const capabilityNames = [
    "view",
    "campaignEdit",
    "sendEdit",
    "contentEdit",
    "audienceView",
    "audienceEdit",
    "audienceImport",
    "audienceExport",
    "consentEdit",
    "approve",
    "dispatch",
    "eventManage",
    "reportView",
    "configure",
    "templateView",
    "templateEdit",
    "sendingConfigure",
    "suppressionReview",
    "allOrganizations",
    // the reads, from view permissions only
    "anyRead",
    "audienceRead",
    "reportRead",
    // the Settings area, the administrator's
    "settings",
    // P2: the Approvals area, the approvers'
    "approvals",
    // P3: the Audiences area, the audience managers'
    "audiences",
    // P5: the audience preview's read (an audience reader, an author or a dispatcher) and its screen
    "previewRead",
    "audiencePreview",
    // P6: Comms' templates and sending profiles read, and the Sends area (the template readers' until P8)
    "templateRead",
    "profileRead",
    "sendsRead",
    "sends",
    // P8: the sends' read (a Marketing reader who writes, approves or dispatches sends)
    "sendRead",
    // P11: the automations' read (a Marketing reader who writes, approves or dispatches sends or reads audiences) and their area
    "automationRead",
    "automations",
    // P12: the surveys' read (a Marketing reader who edits content or reads audiences or reports) and their area
    "surveyRead",
    "surveys",
    // P13: the lead rules' read (a content author or the administrator) and their area
    "leadRuleRead",
    "leadRules",
    // P14: the content's read (every Marketing reader)
    "contentRead"
]
const audienceGrants = ["audienceView", "audienceEdit", "audienceImport", "audienceExport", "consentEdit"]
// design §1.1's table; every user in BOSS_MARKETING holds view
const capabilityUsers = [
    {
        user: users.author,
        granted: [
            "view",
            "campaignEdit",
            "sendEdit",
            "contentEdit",
            "templateView",
            "templateEdit",
            "anyRead",
            "previewRead",
            "audiencePreview",
            "templateRead",
            "profileRead",
            "sendsRead",
            "sends",
            "sendRead",
            "automationRead",
            "automations",
            "surveyRead",
            "surveys",
            "leadRuleRead",
            "leadRules",
            "contentRead"
        ]
    },
    {
        user: users.audience,
        granted: [
            "view",
            ...audienceGrants,
            "anyRead",
            "audienceRead",
            "audiences",
            "previewRead",
            "audiencePreview",
            "automationRead",
            "automations",
            "surveyRead",
            "surveys",
            "contentRead"
        ]
    },
    {
        user: users.approver,
        granted: [
            "view",
            "approve",
            "anyRead",
            "approvals",
            "sendsRead",
            "sends",
            "sendRead",
            "automationRead",
            "automations",
            "contentRead"
        ]
    },
    {
        user: users.dispatch,
        granted: [
            "view",
            "dispatch",
            "anyRead",
            "previewRead",
            "audiencePreview",
            "profileRead",
            "sendsRead",
            "sends",
            "sendRead",
            "automationRead",
            "automations",
            "contentRead"
        ]
    },
    {user: users.events, granted: ["view", "eventManage", "anyRead", "contentRead"]},
    // P12: the analyst reads surveys and opens their area; the reader reads them by permission but the area denies its groups
    {user: users.analyst, granted: ["view", "reportView", "anyRead", "reportRead", "surveyRead", "surveys", "contentRead"]},
    {user: users.reader, granted: ["view", "reportView", "anyRead", "reportRead", "surveyRead", "contentRead"]},
    {
        // no approval, dispatch or template edit (design §1.1); suppression review since P3 and sending configuration since P6 (the
        // user's call of Nov 13)
        user: users.admin,
        granted: capabilityNames.filter(name => !["approve", "dispatch", "templateEdit", "approvals"].includes(name))
    },
    {user: "marketing.spec.editonly", granted: ["campaignEdit"]},
    {user: users.system, granted: capabilityNames}
]
feature("each group holds exactly the capabilities of its permissions; an edit permission alone reads nothing", {
    when() {
        const problems = []
        for (const {user, granted} of capabilityUsers) {
            const found = asUser(user, () => invoke(context, {}).capabilities || {})
            const held = capabilityNames.filter(name => found[name])
            const expected = capabilityNames.filter(name => granted.includes(name))
            if (JSON.stringify(held) !== JSON.stringify(expected)) problems.push(`${user} holds ${held}, not ${expected}`)
            if (found.read !== true) problems.push(`${user} does not open Marketing`)
        }
        // the edit-only user reads no organization, no record and no choice, and Home tells them so
        const editor = asUser("marketing.spec.editonly", () => ({
            context: invoke(context, {}),
            organization: refusal(checkRecord, {recordType: "organization", recordId: ids.organizationId}),
            campaign: refusal(checkRecord, {recordType: "campaign", recordId: record("CMP", "RETAIL")}),
            organizations: invoke(choices, {choice: "organizations"}).options,
            home: page("Home", {}, "html")
        }))
        if (editor.context.organizationPartyIds.length)
            problems.push(`the editor's organizations: ${editor.context.organizationPartyIds}`)
        if (!editor.organization.includes("RECORD_UNAVAILABLE"))
            problems.push(`the editor reads an organization: ${editor.organization || "given"}`)
        if (!editor.campaign.includes("RECORD_UNAVAILABLE"))
            problems.push(`the editor reads a campaign: ${editor.campaign || "given"}`)
        if (editor.organizations.length) problems.push(`the editor's choices: ${JSON.stringify(editor.organizations)}`)
        if (!editor.home.output.includes("Nothing of it is open to you.")) problems.push("the editor's Home does not say so")
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature(
    "an author is refused the other organization's campaign, list and segment, and its author theirs, with the same parameters; an unowned one is no one's",
    {
        when() {
            const problems = []
            const expect = (label, message, refusalText) => {
                if (refusalText ? !message.includes(refusalText) : message !== "")
                    problems.push(`${label}: ${message || "accepted"}`)
            }
            const kinds = {campaign: "CMP", list: "LST", segment: "SEG"}
            const own = {[users.author]: "RETAIL", [users.otherAuthor]: "SERVICES"}
            for (const [user, mine] of Object.entries(own)) {
                const theirs = mine === "RETAIL" ? "SERVICES" : "RETAIL"
                asUser(user, () => {
                    for (const [recordType, code] of Object.entries(kinds)) {
                        expect(`${user}'s own ${recordType}`, refusal(checkRecord, {recordType, recordId: record(code, mine)}))
                        expect(
                            `${user}: the other organization's ${recordType}`,
                            refusal(checkRecord, {recordType, recordId: record(code, theirs)}),
                            "RECORD_UNAVAILABLE"
                        )
                    }
                })
            }
            // a capability named: refused the one the author lacks, with the same record
            asUser(users.author, () => {
                expect(
                    "an edit capability",
                    refusal(checkRecord, {recordType: "campaign", recordId: record("CMP", "RETAIL"), capability: "campaignEdit"})
                )
                expect(
                    "an audience capability",
                    refusal(checkRecord, {recordType: "list", recordId: record("LST", "RETAIL"), capability: "audienceRead"}),
                    "PERMISSION_DENIED"
                )
                const organizations = invoke(choices, {choice: "organizations"}).options.map(option => option.value)
                if (!organizations.includes(ids.organizationId) || organizations.includes(ids.otherOrganizationId))
                    problems.push(`the author's organizations: ${organizations}`)
            })
            // the administrator reads every organization's, and no unowned record until it is adopted
            asUser(users.admin, () => {
                expect(
                    "the administrator: Services' campaign",
                    refusal(checkRecord, {recordType: "campaign", recordId: record("CMP", "SERVICES")})
                )
                for (const [recordType, code] of Object.entries(kinds))
                    expect(
                        `the administrator: an unowned ${recordType}`,
                        refusal(checkRecord, {recordType, recordId: record(code, "NONE")}),
                        "RECORD_UNAVAILABLE"
                    )
            })
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

feature(
    "the ironstone.marketing services are refused without the root grant; a write verb is denied a client; the raw marketing mutators a Marketing user",
    {
        when() {
            const problems = []
            for (const user of [users.otherApp, users.client]) {
                const found = asUser(user, () => ({
                    check: refusal(checkRecord, {recordType: "organization", recordId: ids.organizationId}),
                    choices: refusal(choices, {choice: "organizations"}),
                    search: refusal(contextServices + "search#Records", {text: "a"})
                }))
                for (const [name, message] of Object.entries(found))
                    if (!refused(message)) problems.push(`${user}'s ${name}: ${message || "accepted"}`)
            }
            // P1 has no write service: the client deny pattern (BOSS_PROJECTS_INTERNAL) names the package for those to come, and
            // the root grant's service pattern admits an author's
            const write = "ironstone.marketing.SpecServices.store#Campaign"
            const permitted = (user, name) =>
                asUser(user, () => ec.artifactExecution.isPermitted(name, "AT_SERVICE", "AUTHZA_ALL"))
            if (permitted(users.client, write)) problems.push("a client may call a Marketing write")
            if (!permitted(users.author, write)) problems.push("an author may not call a Marketing write")
            // no Marketing group is granted the raw Mantle mutators of campaigns, lists, segments and consent outside a screen
            for (const raw of [
                "create#mantle.marketing.campaign.MarketingCampaign",
                "update#mantle.marketing.contact.ContactList",
                "update#mantle.marketing.segment.MarketSegment",
                "mantle.marketing.CampaignServices.apply#Adoption"
            ])
                for (const user of [users.author, users.audience, users.admin])
                    if (permitted(user, raw)) problems.push(`${user} may call ${raw}`)
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

// The record panels under the Marketing root serve Marketing's own record hosts only (none yet; P2 adds the campaign), and a
// panel request naming no record (as a person search does)
function panelRequest(path, parameters = {}) {
    const out = ec.screen.makeTest().rootScreen("component://webroot/screen/webroot.xml").render(path, parameters, "get")
    ec.message.clearErrors()
    return {status: out.status, errors: Array.from(out.errorMessages || []).join("\n")}
}
feature(
    "Home renders for an author; the settings landing and adoption for the administrator, Settings refused an author; AudiencePreview opens for an author, not the rest of Audiences; panels of no other app's record",
    {
        when() {
            const authorHome = asUser(users.author, () => page("Home", {organizationPartyId: ids.organizationId}))
            const otherHome = asUser(users.author, () => page("Home", {organizationPartyId: ids.otherOrganizationId}, "html"))
            const panels = asUser(users.author, () => ({
                files: panelRequest("apps/Marketing/RecordFiles/filesData", {
                    recordEntity: "mantle.party.Party",
                    recordId: ids.organizationId
                }),
                chatter: panelRequest("apps/Marketing/Chatter/chatterData"),
                // P2: the campaign is Marketing's host: its own organization's admitted, another's refused, the same request
                ownCampaign: panelRequest("apps/Marketing/RecordFiles/filesData", {
                    recordEntity: "mantle.marketing.campaign.MarketingCampaign",
                    recordId: ids.runningCampaignId
                }),
                otherCampaign: panelRequest("apps/Marketing/RecordFiles/filesData", {
                    recordEntity: "mantle.marketing.campaign.MarketingCampaign",
                    recordId: ids.servicesCampaignId
                }),
                // P8: the send is a host too
                ownSend: panelRequest("apps/Marketing/RecordFiles/filesData", {
                    recordEntity: "mantle.marketing.campaign.CampaignSend",
                    recordId: ids.draftSendId
                })
            }))
            // P2: Approvals for the approver alone (the area's grant or its own check)
            const approvals = {
                approver: screenRefusal(users.approver, "Campaigns/Approvals"),
                author: screenRefusal(users.author, "Campaigns/Approvals"),
                admin: screenRefusal(users.admin, "Campaigns/Approvals")
            }
            // P5: AudiencePreview for an author past the Audiences area's deny, the area's other screens still refused; a reader neither
            const preview = {
                author: screenRefusal(users.author, "Audiences/AudiencePreview"),
                authorLists: screenRefusal(users.author, "Audiences/Lists"),
                reader: screenRefusal(users.reader, "Audiences/AudiencePreview")
            }
            // P6: Sends (Comms' templates) for an author, not a reader; the sending profiles the administrator's (Settings)
            const sends = {
                author: screenRefusal(users.author, "Sends/MessageTemplates"),
                reader: screenRefusal(users.reader, "Sends/MessageTemplates"),
                admin: screenRefusal(users.admin, "Settings/SendingProfiles"),
                authorProfiles: screenRefusal(users.author, "Settings/SendingProfiles"),
                // P8: the sends for an approver (and an author), not a reader; another organization's send is no one else's
                approver: screenRefusal(users.approver, "Sends/Sends"),
                readerSends: screenRefusal(users.reader, "Sends/Sends"),
                // P9: a recipient's delivery for a dispatcher, not a reader
                dispatchRecipient: screenRefusal(users.dispatch, "Sends/RecipientDetail", {
                    campaignRecipientId: "BOSS_MKT_RCPT_NOV_MAYA"
                }),
                readerRecipient: screenRefusal(users.reader, "Sends/RecipientDetail", {
                    campaignRecipientId: "BOSS_MKT_RCPT_NOV_MAYA"
                }),
                otherSend: asUser(users.otherAuthor, () =>
                    refusal(checkRecord, {recordType: "send", recordId: ids.approvedSendId})
                ),
                ownSend: asUser(users.approver, () => refusal(checkRecord, {recordType: "send", recordId: ids.approvedSendId})),
                // P11: an enrollment for an audience manager, not a reader; another organization's automation is no one else's
                audienceEnrollment: screenRefusal(users.audience, "Automations/EnrollmentDetail", {
                    automationEnrollmentId: ids.waitingEnrollmentId
                }),
                readerAutomations: screenRefusal(users.reader, "Automations/Automations"),
                otherAutomation: asUser(users.otherAuthor, () =>
                    refusal(checkRecord, {recordType: "automation", recordId: ids.welcomeAutomationId})
                ),
                ownAutomation: asUser(users.author, () =>
                    refusal(checkRecord, {recordType: "automation", recordId: ids.welcomeAutomationId})
                )
            }
            return {
                authorHome,
                otherHome,
                panels,
                approvals,
                preview,
                sends,
                adminSettings: asUser(users.admin, () => page("Settings/Index", {}, "html")),
                adminAdoption: asUser(users.admin, () => page("Settings/Adoption", {}, "html")),
                authorSettings: screenRefusal(users.author, "Settings/Index")
            }
        },
        then({authorHome, otherHome, panels, approvals, preview, sends, adminSettings, adminAdoption, authorSettings}) {
            authorHome.errors.length == 0
            authorHome.output.includes("Marketing at a glance")
            authorHome.output.includes("Running campaigns")
            // every Home source answers since the P21 review (Upcoming's events and publication dates are the calendar's)
            !authorHome.output.includes("Not available")
            authorHome.output.includes("Ziziwork Retail")
            !authorHome.output.includes("Nothing of it is open to you.")
            // an author holds no configure: the adoption source is the administrator's
            !authorHome.output.includes("Records awaiting adoption")
            otherHome.output.includes("This organization is not available to you.")
            adminSettings.status == 200 && adminSettings.errors.length == 0
            adminSettings.output.includes("Adoption of existing records")
            adminSettings.output.includes("Records awaiting adoption")
            adminSettings.output.includes("await adoption")
            // the records awaiting adoption, each with its organization to choose and Adopt
            adminAdoption.status == 200 && adminAdoption.errors.length == 0
            adminAdoption.output.includes("Spec list NONE") && adminAdoption.output.includes("Spec campaign NONE")
            !adminAdoption.output.includes("Spec list RETAIL")
            adminAdoption.output.includes("Adopt")
            // refused by the area's grant or its own check, whichever the render meets first
            unauthorized(authorSettings) || authorSettings.includes("PERMISSION_DENIED")
            panels.files.errors.includes("RECORD_PANEL_UNAVAILABLE")
            !panels.chatter.errors.includes("RECORD_PANEL_UNAVAILABLE")
            !panels.ownCampaign.errors.includes("RECORD_PANEL_UNAVAILABLE") && panels.ownCampaign.status == 200
            panels.otherCampaign.errors.includes("RECORD_PANEL_UNAVAILABLE")
            approvals.approver == ""
            unauthorized(approvals.author) || approvals.author.includes("PERMISSION_DENIED")
            approvals.admin.includes("PERMISSION_DENIED")
            preview.author == ""
            unauthorized(preview.authorLists)
            unauthorized(preview.reader)
            sends.author == ""
            sends.admin == ""
            unauthorized(sends.reader) || sends.reader.includes("PERMISSION_DENIED")
            unauthorized(sends.authorProfiles) || sends.authorProfiles.includes("PERMISSION_DENIED")
            sends.approver == ""
            unauthorized(sends.readerSends) || sends.readerSends.includes("PERMISSION_DENIED")
            sends.dispatchRecipient == ""
            unauthorized(sends.readerRecipient) || sends.readerRecipient.includes("PERMISSION_DENIED")
            sends.otherSend.includes("RECORD_UNAVAILABLE")
            sends.ownSend == ""
            sends.audienceEnrollment == ""
            unauthorized(sends.readerAutomations) || sends.readerAutomations.includes("PERMISSION_DENIED")
            sends.otherAutomation.includes("RECORD_UNAVAILABLE")
            sends.ownAutomation == ""
            !panels.ownSend.errors.includes("RECORD_PANEL_UNAVAILABLE") && panels.ownSend.status == 200
            // P6: the settings index links the sending profiles, templates, consent and suppressions
            adminSettings.output.includes("Sending profiles") && adminSettings.output.includes("Message templates")
            adminSettings.output.includes("Suppressions")
        }
    }
)

feature(
    "Admin's registries hold each Marketing bundle with exactly its group's grants, the readiness provider and the settings entry",
    {
        when() {
            const problems = []
            system(() => {
                const bundles = Array.from(
                    ec.entity.find("moqui.security.CapabilityBundle").condition("appName", "Marketing").list()
                ).map(row => row.userGroupId)
                // P18: the door tablet's display group (CHECKIN_DEVICE)
                const expected = [
                    "AUTHOR",
                    "AUDIENCE",
                    "APPROVER",
                    "DISPATCH",
                    "EVENTS",
                    "ANALYST",
                    "READ",
                    "ADMIN",
                    "CHECKIN_DEVICE"
                ]
                    .map(name => "BOSS_MARKETING_" + name)
                    .concat(["BOSS_MARKETING"])
                if (JSON.stringify(bundles.slice().sort()) !== JSON.stringify(expected.slice().sort()))
                    problems.push(`the bundles: ${bundles}`)
                for (const userGroupId of bundles) {
                    const carried = Array.from(
                        ec.entity.find("moqui.security.CapabilityBundlePermission").condition("userGroupId", userGroupId).list()
                    )
                        .map(row => row.userPermissionId)
                        .sort()
                    const granted = Array.from(
                        ec.entity.find("moqui.security.UserGroupPermission").condition("userGroupId", userGroupId).list()
                    )
                        .map(row => row.userPermissionId)
                        .sort()
                    if (JSON.stringify(carried) !== JSON.stringify(granted))
                        problems.push(`${userGroupId} carries ${carried}, granted ${granted}`)
                }
                const launcher = ec.entity
                    .find("moqui.security.CapabilityBundleArtifact")
                    .condition("userGroupId", "BOSS_MARKETING")
                    .list()
                if (launcher.size() !== 1 || launcher.get(0).artifactGroupId !== "BOSS_MARKETING")
                    problems.push("the launcher's artifact")
                // the holders among the registered bundles of every app: a spec's own user groups (Mantle's Campaigns, Sends, Dispatch
                // and the rest grant MARKETING_APPROVE and the like to spec-local groups and leave them) are not Admin's registry, and a
                // worker that ran one of them before this spec found them here (follow-up 7 review)
                const bundleGroups = new Set(
                    Array.from(ec.entity.find("moqui.security.CapabilityBundle").list()).map(row => row.userGroupId)
                )
                const holders = userPermissionId =>
                    Array.from(ec.entity.find("moqui.security.UserGroupPermission").condition({userPermissionId}).list())
                        .map(row => row.userGroupId)
                        .filter(id => id !== "ADMIN" && bundleGroups.has(id))
                        .sort()
                const expectHolders = (userPermissionId, groups) => {
                    const found = holders(userPermissionId)
                    if (JSON.stringify(found) !== JSON.stringify(groups)) problems.push(`${userPermissionId}'s groups: ${found}`)
                }
                expectHolders("MARKETING_AUDIENCE_IMPORT", ["BOSS_MARKETING_ADMIN", "BOSS_MARKETING_AUDIENCE"])
                expectHolders("MARKETING_ALL_ORGANIZATIONS", ["BOSS_MARKETING_ADMIN"])
                // approval and dispatch apart; Comms' explicit grants by Marketing role (the user's call of Nov 13): suppression review the
                // administrator's since P3, template edit the author's and sending configuration the administrator's since P6
                expectHolders("MARKETING_APPROVE", ["BOSS_MARKETING_APPROVER"])
                expectHolders("MARKETING_DISPATCH", ["BOSS_MARKETING_DISPATCH"])
                expectHolders("MESSAGE_SUPPRESSION_REVIEW", ["BOSS_MARKETING_ADMIN"])
                expectHolders("MESSAGE_TEMPLATE_EDIT", ["BOSS_MARKETING_AUTHOR"])
                expectHolders("MESSAGE_SENDING_CONFIGURE", ["BOSS_MARKETING_ADMIN"])
                // P18: a door tablet's permission, its display group's alone
                expectHolders("MARKETING_CHECKIN", ["BOSS_MARKETING_CHECKIN_DEVICE"])
                const provider = ec.entity
                    .find("moqui.server.ReadinessProvider")
                    .condition("providerKey", "marketing.setup")
                    .one()
                if (
                    provider?.serviceName !== "mantle.marketing.MarketingWorkspaceServices.get#Readiness" ||
                    provider?.requiredPermission !== "MARKETING_CONFIGURE" ||
                    provider?.fixRoute !== "marketingSettings"
                )
                    problems.push(`the readiness provider: ${JSON.stringify(provider)}`)
                const entry = ec.entity.find("moqui.server.SettingsEntry").condition("settingsKey", "marketing.settings").one()
                if (entry?.viewPermission !== "MARKETING_CONFIGURE" || entry?.providerKey !== "marketing.setup")
                    problems.push(`the settings entry: ${JSON.stringify(entry)}`)
            })
            // Admin's index lists the entry to the administrator, whose readiness the provider answers as them
            const adminEntries = asUser(users.admin, () =>
                Array.from(invoke("org.moqui.admin.ReadinessServices.find#Settings", {}).entries || []).map(
                    row => row.settingsKey
                )
            )
            if (!adminEntries.includes("marketing.settings")) problems.push(`the administrator's index: ${adminEntries}`)
            const authorEntries = asUser(users.author, () =>
                Array.from(invoke("org.moqui.admin.ReadinessServices.find#Settings", {}).entries || []).map(
                    row => row.settingsKey
                )
            )
            if (authorEntries.includes("marketing.settings")) problems.push("the author's index lists Marketing's settings")
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

// P18 (design §9 CheckIn, F83): the shared door tablet. A display account of Retail holding the door bundle alone and a tablet registered
// for the MARKETING_CHECKIN route group, fixed to the demo webinar's offer, and redeemed; as the tablet, CheckIn's bare page and its
// island (the desk and the scan, no attendee search), a scan naming no ticket refused with its reason; Marketing's other screens, the
// shell and another offer's door refused.
feature("a door tablet opens CheckIn for its offer alone; every other Marketing screen and the shell are refused", {
    when() {
        const webroot = "component://webroot/screen/webroot.xml"
        const door = "apps/Marketing/Events/CheckIn"
        const state = {}
        const request = (path, parameters, mode, method) => {
            let test = ec.screen
                .makeTest()
                .rootScreen(webroot)
                .header("cookie", "moqui.device=" + state.cookie)
            if (mode) test = test.renderMode(mode)
            const out = test.render(path, parameters || {}, method || "get")
            ec.message.clearAll()
            return {status: out.status, output: String(out.output || ""), errors: Array.from(out.errorMessages || []).join("\n")}
        }
        let display = system(() => ec.entity.find("moqui.security.UserAccount").condition("username", "display.spec.door").one())
        if (!display) {
            invoke("mantle.party.IdentityServices.create#DisplayAccount", {
                displayName: "Spec door",
                organizationPartyId: ids.organizationId,
                bundleGroupIdList: ["BOSS_MARKETING_CHECKIN_DEVICE"]
            })
            display = system(() => ec.entity.find("moqui.security.UserAccount").condition("username", "display.spec.door").one())
        }
        const registered = invoke("mantle.party.IdentityServices.register#SharedDevice", {
            deviceName: "Spec door webinar",
            routeGroupId: "MARKETING_CHECKIN",
            displayUserId: display?.userId,
            parameterValue: "BOSS_MKT_OFFER_WEBINAR",
            issueCode: false
        })
        const code = invoke("mantle.party.IdentityServices.reveal#SharedDeviceCode", {
            deviceId: registered.deviceId
        }).registrationCode
        const redeemed = ec.screen.makeTest().rootScreen(webroot).render("Device/redeem", {code}, "post")
        state.cookie = String(redeemed.header("Set-Cookie") || "")
            .split(";")[0]
            .replace("moqui.device=", "")
        login("john.doe")
        const out = {
            registered,
            html: request(door, {}),
            island: request(door, {}, "qvt"),
            // the framework puts the registered offer under registrationPolicyId whatever the browser sends
            otherOffer: request(door, {registrationPolicyId: "BOSS_MKT_OFFER_WORKSHOP"}, "qvt"),
            scan: request(door + "/scanResolve", {
                scanForm: "EntryLookup",
                scanField: "entryCode",
                scanText: "EVNOSUCHTICKET000000000"
            }),
            refused: {
                home: request("apps/Marketing/Home", {}),
                events: request("apps/Marketing/Events/Events", {}),
                registrations: request("apps/Marketing/Events/Registrations", {}),
                setup: request("apps/Marketing/Events/RegistrationSetup", {workEffortId: "BOSS_MKT_EV_WEBINAR"}),
                choices: request("apps/Marketing/Events/Registrations/choices", {}),
                shell: request("qapps/Marketing/Events/CheckIn", {})
            }
        }
        system(() => ec.entity.find("moqui.security.DeviceCredential").condition("deviceName", "Spec door webinar").deleteAll())
        return out
    },
    then({registered, html, island, otherOffer, scan, refused}) {
        registered.applied === true && registered.deviceId != null
        html.status == 200 && html.errors == "" && html.output.includes('data-moqui-island="event-check-in"')
        html.output.includes("/js/WebrootPublic.qvt.js") && !html.output.includes("header-menu")
        island.status == 200 &&
            island.errors == "" &&
            island.output.includes("EntryLookup") &&
            island.output.includes("m-scan-input")
        !/Error rendering|Exception in render/.test(html.output + island.output)
        island.output.includes("Spring planting webinar") && !island.output.includes("FindAttendee")
        otherOffer.output.includes("Spring planting webinar") && !otherOffer.output.includes("Rose pruning")
        scan.status == 400 && scan.output.includes("Not a current ticket")
        // the route gate's refusal of a page outside the route group
        Object.entries(refused)
            .filter(([, out]) => !out.errors.includes("This device opens only MARKETING_CHECKIN"))
            .map(([name, out]) => name + " " + out.status)
            .join() == ""
    }
})
