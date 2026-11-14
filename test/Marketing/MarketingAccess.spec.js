// Marketing access (impl-marketing §2, P1; design-marketing §1.1, §1.2, §12, §14.3): the app's one access spec. Who may open
// Marketing and the context they get (another root, another app's user, a client and a PASS account refused), the menu, keys and
// launcher per group, each group's capabilities from its permissions (an edit permission alone reading nothing), a campaign, list
// and segment of another organization and an unowned one refused through the context service with the same parameters, the
// ironstone.marketing services refused without the root grant, a write verb of the package denied a client and the raw Mantle
// marketing mutators refused a Marketing user, the record panels served for Marketing's own record hosts only (none yet), Home's
// one qvt render and the settings landing's one html render (the administrator's; an author is refused Settings), and Marketing's
// rows in Admin's registries (each bundle carrying exactly its group's grants, the readiness provider and the settings entry).
// One feature per rule, each case of it a line of its problems, with artifact authorization enabled. Mantle's scope rules (the
// organization filters, the list services' organization check, adoption) are Mantle's MarketingScope. The access and isolation
// walk is the acceptance MarketingFoundationWalk. A later phase adds a case only for an access rule it adds.
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
        if (author.status != 200 || JSON.stringify(author.names) !== JSON.stringify(ids.staffMenu))
            problems.push(`the author's menu: ${author.status} ${author.names}`)
        const keymap = (author.providers?.keymaps || []).find(keymap => keymap.scope === "marketing")
        const keys = (keymap?.keys || []).map(key => key.keys)
        if (JSON.stringify(keys) !== JSON.stringify(ids.keys)) problems.push(`the author's marketing keys: ${keys}`)
        if (!author.apps.includes("Marketing")) problems.push(`the author's launcher has no Marketing: ${author.apps}`)
        for (const user of [users.audience, users.approver, users.dispatch, users.events, users.analyst, users.reader]) {
            const names = shell(user, true).names
            if (JSON.stringify(names) !== JSON.stringify(ids.staffMenu)) problems.push(`${user}'s menu: ${names}`)
        }
        for (const user of [users.admin, users.system]) {
            const names = shell(user, true).names
            if (JSON.stringify(names) !== JSON.stringify(ids.adminMenu)) problems.push(`${user}'s menu: ${names}`)
        }
        const settings = shell(users.admin, true, "Settings/Index", "Settings")
        if (JSON.stringify(settings.names) !== JSON.stringify(ids.settingsMenu))
            problems.push(`the administrator's Settings tabs: ${settings.status} ${settings.names}`)
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
    "settings"
]
const audienceGrants = ["audienceView", "audienceEdit", "audienceImport", "audienceExport", "consentEdit"]
// design §1.1's table; every user in BOSS_MARKETING holds view
const capabilityUsers = [
    {user: users.author, granted: ["view", "campaignEdit", "sendEdit", "contentEdit", "templateView", "anyRead"]},
    {user: users.audience, granted: ["view", ...audienceGrants, "anyRead", "audienceRead"]},
    {user: users.approver, granted: ["view", "approve", "anyRead"]},
    {user: users.dispatch, granted: ["view", "dispatch", "anyRead"]},
    {user: users.events, granted: ["view", "eventManage", "anyRead"]},
    {user: users.analyst, granted: ["view", "reportView", "anyRead", "reportRead"]},
    {user: users.reader, granted: ["view", "reportView", "anyRead", "reportRead"]},
    {
        // no approval, dispatch, template edit, sending configuration or suppression review (design §1.1)
        user: users.admin,
        granted: capabilityNames.filter(
            name => !["approve", "dispatch", "templateEdit", "sendingConfigure", "suppressionReview"].includes(name)
        )
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
    "Home renders for an author; the settings landing and adoption for the administrator, Settings refused an author; panels of no other app's record",
    {
        when() {
            const authorHome = asUser(users.author, () => page("Home", {organizationPartyId: ids.organizationId}))
            const otherHome = asUser(users.author, () => page("Home", {organizationPartyId: ids.otherOrganizationId}, "html"))
            const panels = asUser(users.author, () => ({
                files: panelRequest("apps/Marketing/RecordFiles/filesData", {
                    recordEntity: "mantle.party.Party",
                    recordId: ids.organizationId
                }),
                chatter: panelRequest("apps/Marketing/Chatter/chatterData")
            }))
            return {
                authorHome,
                otherHome,
                panels,
                adminSettings: asUser(users.admin, () => page("Settings/Index", {}, "html")),
                adminAdoption: asUser(users.admin, () => page("Settings/Adoption", {}, "html")),
                authorSettings: screenRefusal(users.author, "Settings/Index")
            }
        },
        then({authorHome, otherHome, panels, adminSettings, adminAdoption, authorSettings}) {
            authorHome.errors.length == 0
            authorHome.output.includes("Marketing at a glance")
            authorHome.output.includes("Running campaigns")
            authorHome.output.includes("Not available")
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
                const expected = ["AUTHOR", "AUDIENCE", "APPROVER", "DISPATCH", "EVENTS", "ANALYST", "READ", "ADMIN"]
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
                const holders = userPermissionId =>
                    Array.from(ec.entity.find("moqui.security.UserGroupPermission").condition({userPermissionId}).list())
                        .map(row => row.userGroupId)
                        .filter(id => id !== "ADMIN")
                        .sort()
                const expectHolders = (userPermissionId, groups) => {
                    const found = holders(userPermissionId)
                    if (JSON.stringify(found) !== JSON.stringify(groups)) problems.push(`${userPermissionId}'s groups: ${found}`)
                }
                expectHolders("MARKETING_AUDIENCE_IMPORT", ["BOSS_MARKETING_ADMIN", "BOSS_MARKETING_AUDIENCE"])
                expectHolders("MARKETING_ALL_ORGANIZATIONS", ["BOSS_MARKETING_ADMIN"])
                // approval and dispatch apart; Comms' explicit grants held by no Marketing group
                expectHolders("MARKETING_APPROVE", ["BOSS_MARKETING_APPROVER"])
                expectHolders("MARKETING_DISPATCH", ["BOSS_MARKETING_DISPATCH"])
                for (const userPermissionId of [
                    "MESSAGE_TEMPLATE_EDIT",
                    "MESSAGE_SENDING_CONFIGURE",
                    "MESSAGE_SUPPRESSION_REVIEW"
                ])
                    expectHolders(userPermissionId, [])
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
