// Sales access (impl-sales §2, P1; design-sales §1.1, §1.2): the app's one access spec. Who may open Sales and the context they get
// (another root, another app's user, a client and a PASS account refused), the menu, keys and launcher per group, each group's
// capabilities from its permissions (an edit permission alone reading nothing), a representative of Retail refused Ziziwork Sales'
// organization and Ziziwork Sales' representative Retail's with the same parameters, the ironstone.sales services refused without
// the root grant and a write verb of the package denied a client (the client deny pattern), the record panels served for Sales'
// own record hosts only (P3: an account or a contact of the scope), Home's one qvt render and SalesSummary's one html render (the
// reader's; a representative is refused Reports), and Sales' rows in Admin's capability registry (each bundle carrying exactly its
// group's grants, SALES_OWNER_CHANGE the identity operator's alone). One feature per rule, each case of it a line of its problems,
// with artifact authorization enabled. Mantle's scope rules (the organization filters, the report reader's organizations) are Mantle's
// SalesOrganizationScope and SalesReports. The access and isolation walk is the acceptance SalesFoundationWalk. A later phase adds
// a case only for an access rule it adds: P3 the account and contact record kinds and MergeAccounts; P4 the opportunity record kind,
// its panels and Marketing's mount.
// Run: ./moq test mr-boss --spec SalesAccess
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page, screenRefusal, shell, recurringBase} = lib
const contextServices = "ironstone.sales.ContextServices."
const context = contextServices + "get#SharedContext"
const checkRecord = contextServices + "check#Record"
const choices = contextServices + "get#Choices"
// a refusal of a user without Sales: the service is not authorized for them, or it refuses them
const refused = message => /SALES_UNAVAILABLE|is not authorized/.test(message)
const unauthorized = message => /^40[13] |is not authorized/.test(message)
// a spec-local user of a custom group given the Sales root in Admin, not in BOSS_SALES, holding SALES_OPPORTUNITY_EDIT alone
const editOnly = "SAL_SPEC_EDIT_ONLY"

spec({
    setupSpec() {
        login("john.doe")
        system(() => {
            call("create#moqui.security.UserGroup", {userGroupId: editOnly, description: "Sales spec: opportunity edit alone"})
            call("create#moqui.security.UserGroupPermission", {
                userGroupId: editOnly,
                userPermissionId: "SALES_OPPORTUNITY_EDIT",
                fromDate: 0
            })
            call("create#moqui.security.ArtifactAuthz", {
                artifactAuthzId: editOnly,
                userGroupId: editOnly,
                artifactGroupId: "BOSS_SALES",
                authzTypeEnumId: "AUTHZT_ALLOW",
                authzActionEnumId: "AUTHZA_ALL"
            })
            call("create#mantle.party.Party", {partyId: editOnly, partyTypeEnumId: "PtyPerson"})
            call("create#mantle.party.Person", {partyId: editOnly, firstName: "Sales spec", lastName: "Edit only"})
            call("create#mantle.party.PartyRelationship", {
                relationshipTypeEnumId: "PrtAgent",
                fromPartyId: editOnly,
                toPartyId: ids.organizationId,
                toRoleTypeId: "OrgInternal",
                fromDate: 0
            })
            call("create#moqui.security.UserAccount", {
                userId: editOnly,
                username: "sales.spec.editonly",
                partyId: editOnly,
                currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
                passwordHashType: "SHA"
            })
            for (const userGroupId of ["BOSS_USERS", editOnly])
                call("create#moqui.security.UserGroupMember", {userId: editOnly, userGroupId, fromDate: 0})
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        // the spec user's memberships end and its grant goes, so no later spec meets a Sales user it does not know
        system(() => {
            ec.entity
                .find("moqui.security.UserGroupMember")
                .condition("userId", editOnly)
                .updateAll({thruDate: ec.user.nowTimestamp})
            ec.entity.find("moqui.security.ArtifactAuthz").condition("artifactAuthzId", editOnly).deleteAll()
        })
        ec.artifactExecution.enableAuthz()
    }
})

feature("a Sales user gets their context; another root, another app's user, a client and a PASS account are refused", {
    when() {
        const problems = []
        const rep = asUser(users.rep, () => invoke(context, {}))
        if (!rep.organizationPartyIds.includes(ids.organizationId) || rep.organizationPartyIds.includes(ids.otherOrganizationId))
            problems.push(`the representative's organizations: ${rep.organizationPartyIds}`)
        if (rep.appRoot !== "Sales" || rep.sharedLinks?.Home !== "//Sales/Home" || rep.allOrganizations)
            problems.push(`the representative's context: ${JSON.stringify(rep)}`)
        const both = asUser(users.bothManager, () => invoke(context, {}))
        if (
            !both.organizationPartyIds.includes(ids.organizationId) ||
            !both.organizationPartyIds.includes(ids.otherOrganizationId)
        )
            problems.push(`the manager of both's organizations: ${both.organizationPartyIds}`)
        if (both.allOrganizations) problems.push("the manager of both reads every organization")
        // the administrator (SALES_ALL_ORGANIZATIONS, the user's call of Nov 13): every internal organization, one they do not
        // work for (Accounting's demo company) among them
        const admin = asUser(users.admin, () => invoke(context, {}))
        if (!admin.allOrganizations || !admin.organizationPartyIds.includes("BOSS_ACCT_ORG"))
            problems.push(`the administrator's organizations: ${admin.allOrganizations} ${admin.organizationPartyIds}`)
        const adminRecord = asUser(users.admin, () =>
            refusal(checkRecord, {recordType: "organization", recordId: "BOSS_ACCT_ORG"})
        )
        if (adminRecord) problems.push(`the administrator is refused another organization: ${adminRecord}`)
        const repRecord = asUser(users.rep, () => refusal(checkRecord, {recordType: "organization", recordId: "BOSS_ACCT_ORG"}))
        if (!repRecord.includes("RECORD_UNAVAILABLE"))
            problems.push(`the representative reads another organization: ${repRecord || "given"}`)
        const otherRoot = asUser(users.rep, () => refusal(context, {appRoot: "Warehouse"}))
        if (!otherRoot.includes("SALES_CONTEXT")) problems.push(`another root's context is given: ${otherRoot}`)
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

feature("the Sales menu and keys follow the groups; the launcher shows Sales to its users only", {
    when() {
        const problems = []
        const rep = shell(users.rep)
        if (rep.status != 200 || JSON.stringify(rep.names) !== JSON.stringify(ids.staffMenu))
            problems.push(`the representative's menu: ${rep.status} ${rep.names}`)
        const keymap = (rep.providers?.keymaps || []).find(keymap => keymap.scope === "sales")
        const keys = (keymap?.keys || []).map(key => key.keys)
        if (JSON.stringify(keys) !== JSON.stringify(ids.keys)) problems.push(`the representative's sales keys: ${keys}`)
        if (!rep.apps.includes("Sales")) problems.push(`the representative's launcher has no Sales: ${rep.apps}`)
        for (const user of [users.approver, users.change, users.agreement]) {
            const names = shell(user, true).names
            if (JSON.stringify(names) !== JSON.stringify(ids.staffMenu)) problems.push(`${user}'s menu: ${names}`)
        }
        for (const user of [users.reader]) {
            const names = shell(user, true).names
            if (JSON.stringify(names) !== JSON.stringify(ids.reportMenu)) problems.push(`${user}'s menu: ${names}`)
        }
        // P2: Settings for the administrator and, for Teams, the manager
        for (const user of [users.manager, users.admin, users.system]) {
            const names = shell(user, true).names
            if (JSON.stringify(names) !== JSON.stringify(ids.managerMenu)) problems.push(`${user}'s menu: ${names}`)
        }
        const reports = shell(users.reader, true, "Reports/SalesSummary", "Reports")
        if (JSON.stringify(reports.names) !== JSON.stringify(ids.reportsMenu))
            problems.push(`the reader's Reports tabs: ${reports.status} ${reports.names}`)
        if (shell(users.otherApp).apps.includes("Sales")) problems.push(`${users.otherApp} has Sales`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

const capabilityNames = [
    "view",
    "teamView",
    "teamManage",
    "opportunityEdit",
    "accountEdit",
    "quoteEdit",
    "quoteSend",
    "orderEdit",
    "orderApprove",
    "orderChange",
    "approve",
    "agreementEdit",
    "recurrenceManage",
    "forecastEdit",
    "reportView",
    "customerInvite",
    "import",
    "configure",
    "ownerChange",
    // every organization's scope (SALES_ALL_ORGANIZATIONS, the administrator's by the user's call; no read by itself)
    "allOrganizations",
    // the reads, from view permissions only
    "anyRead",
    "teamRead",
    "reportRead",
    // the Reports area, a report reader's
    "reports",
    // P2: the Settings area, the administrator's and (Teams) the manager's
    "settings",
    // the sales reports answer costs (report read or PRODUCT_COST_VIEW, borrowed; no Sales group holds either)
    "reportCosts",
    // P3: the merge of accounts (MergeAccounts' grant with SALES_ACCOUNT_EDIT and SALES_TEAM_MANAGE or SALES_CONFIGURE), and an
    // account's invoices (ACCOUNTING_VIEW or RECEIVABLE_VIEW, borrowed; no Sales group holds either)
    "mergeAccounts",
    "financeRead"
]
const edits = ["opportunityEdit", "accountEdit", "quoteEdit", "quoteSend", "orderEdit"]
// design §1.1's table as P1 grants it (F43: approve and orderChange come with P9 and P14); every user in BOSS_SALES holds view
const capabilityUsers = [
    // P18: the representative enters their own forecast (SALES_FORECAST_EDIT)
    {user: users.rep, granted: ["view", ...edits, "forecastEdit", "anyRead"]},
    {
        user: users.manager,
        granted: ["view", "teamView", "teamManage", ...edits, "forecastEdit", "reportView", "customerInvite", "import"].concat([
            "anyRead",
            "teamRead",
            "reportRead",
            "reports",
            "mergeAccounts",
            "settings"
        ])
    },
    // P9: the approver holds SALES_APPROVE (F43)
    {user: users.approver, granted: ["view", "orderApprove", "approve", "anyRead"]},
    // P14: the change operator holds SALES_ORDER_CHANGE (F43)
    {user: users.change, granted: ["view", "orderChange", "anyRead"]},
    {user: users.agreement, granted: ["view", "agreementEdit", "recurrenceManage", "anyRead"]},
    {user: users.reader, granted: ["view", "teamView", "reportView", "anyRead", "teamRead", "reportRead", "reports"]},
    {
        user: users.admin,
        granted: capabilityNames.filter(
            name => !["orderApprove", "orderChange", "approve", "ownerChange", "reportCosts", "financeRead"].includes(name)
        )
    },
    {user: "sales.spec.editonly", granted: ["opportunityEdit"]},
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
            if (found.read !== true) problems.push(`${user} does not open Sales`)
        }
        // the edit-only user reads no organization, no record and no choice, and Home tells them so
        const editor = asUser("sales.spec.editonly", () => ({
            context: invoke(context, {}),
            organization: refusal(checkRecord, {recordType: "organization", recordId: ids.organizationId}),
            organizations: invoke(choices, {choice: "organizations"}).options,
            home: page("Home", {}, "html")
        }))
        if (editor.context.organizationPartyIds.length)
            problems.push(`the editor's organizations: ${editor.context.organizationPartyIds}`)
        if (!editor.organization.includes("RECORD_UNAVAILABLE"))
            problems.push(`the editor reads an organization: ${editor.organization || "given"}`)
        if (editor.organizations.length) problems.push(`the editor's choices: ${JSON.stringify(editor.organizations)}`)
        if (!editor.home.output.includes("Nothing of it is open to you.")) problems.push("the editor's Home does not say so")
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature(
    "a representative of Retail is refused Ziziwork Sales' organization, and its representative Retail's, with the same parameters",
    {
        when() {
            const problems = []
            const expect = (label, message, refusalText) => {
                if (refusalText ? !message.includes(refusalText) : message !== "")
                    problems.push(`${label}: ${message || "accepted"}`)
            }
            asUser(users.rep, () => {
                expect("Retail", refusal(checkRecord, {recordType: "organization", recordId: ids.organizationId}))
                expect(
                    "Ziziwork Sales",
                    refusal(checkRecord, {recordType: "organization", recordId: ids.otherOrganizationId}),
                    "RECORD_UNAVAILABLE"
                )
                // a capability named: refused the one the representative lacks, with the same record
                expect(
                    "an edit capability",
                    refusal(checkRecord, {
                        recordType: "organization",
                        recordId: ids.organizationId,
                        capability: "opportunityEdit"
                    })
                )
                expect(
                    "a report capability",
                    refusal(checkRecord, {recordType: "organization", recordId: ids.organizationId, capability: "reportRead"}),
                    "PERMISSION_DENIED"
                )
                const organizations = invoke(choices, {choice: "organizations"}).options.map(option => option.value)
                if (!organizations.includes(ids.organizationId) || organizations.includes(ids.otherOrganizationId))
                    problems.push(`the representative's organizations: ${organizations}`)
            })
            asUser(users.otherRep, () => {
                expect(
                    "Ziziwork Sales (its representative)",
                    refusal(checkRecord, {recordType: "organization", recordId: ids.otherOrganizationId})
                )
                expect(
                    "Retail (Ziziwork Sales' representative)",
                    refusal(checkRecord, {recordType: "organization", recordId: ids.organizationId}),
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

feature("the ironstone.sales services are refused without the root grant, and a write verb of the package is denied a client", {
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
        // P1 has no write service: the client deny pattern (BOSS_PROJECTS_INTERNAL) names the package for those to come, and the
        // root grant's service pattern admits a representative's
        const write = "ironstone.sales.SpecServices.store#Opportunity"
        const permitted = user => asUser(user, () => ec.artifactExecution.isPermitted(write, "AT_SERVICE", "AUTHZA_ALL"))
        if (permitted(users.client)) problems.push("a client may call a Sales write")
        if (!permitted(users.rep)) problems.push("a representative may not call a Sales write")
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

// The record panels under the Sales root serve Sales' own record hosts only (P3: an account or a contact of the user's scope; P4
// adds the opportunity), and a panel request naming no record (as a person search does)
function panelRequest(path, parameters = {}) {
    const out = ec.screen.makeTest().rootScreen("component://webroot/screen/webroot.xml").render(path, parameters, "get")
    ec.message.clearErrors()
    return {status: out.status, errors: Array.from(out.errorMessages || []).join("\n")}
}
feature(
    "Home renders for a representative; SalesSummary for the reader, Reports refused a representative; panels of no other app's record",
    {
        when() {
            const repHome = asUser(users.rep, () => page("Home", {organizationPartyId: ids.organizationId}))
            const otherHome = asUser(users.rep, () => page("Home", {organizationPartyId: ids.otherOrganizationId}, "html"))
            const panels = asUser(users.rep, () => ({
                files: panelRequest("apps/Sales/RecordFiles/filesData", {
                    recordEntity: "mantle.party.Party",
                    recordId: ids.organizationId
                }),
                // P3: the representative's account's files, and not another organization's
                account: panelRequest("apps/Sales/RecordFiles/filesData", {
                    recordEntity: "mantle.party.Party",
                    recordId: ids.accounts.wingtip
                }),
                otherAccount: panelRequest("apps/Sales/RecordFiles/filesData", {
                    recordEntity: "mantle.party.Party",
                    recordId: ids.accounts.fabrikam
                }),
                chatter: panelRequest("apps/Sales/Chatter/chatterData")
            }))
            // PRD-UI-039: a product's notes are Products', which Sales' Chatter refuses, so its Product360 has none; Products' has it
            const productParameters = {productId: "DEMO_1_1", organizationPartyId: ids.organizationId, lastStandalone: "true"}
            const repProduct = asUser(users.rep, () => page("Products/Product360/Summary", productParameters))
            const catalogProduct = page("Products/Product360/Summary", productParameters, "qvt", "Products")
            return {
                repHome,
                otherHome,
                panels,
                repProduct,
                catalogProduct,
                readerSummary: asUser(users.reader, () => page("Reports/SalesSummary", {}, "html")),
                repReports: screenRefusal(users.rep, "Reports/SalesSummary")
            }
        },
        then({repHome, otherHome, panels, repProduct, catalogProduct, readerSummary, repReports}) {
            repHome.errors.length == 0
            repHome.output.includes("Sales work")
            repHome.output.includes("RFQs awaiting response")
            repHome.output.includes("Orders blocked")
            repHome.output.includes("Ziziwork Retail")
            !repHome.output.includes("Nothing of it is open to you.")
            // the representative has no Reports shortcut
            !repHome.output.includes("Shortcuts")
            otherHome.output.includes("This organization is not available to you.")
            // the reader's summaries of their organization, the costs the services withhold left out (not shown as zero); a
            // holder of report read keeps them (SalesReports' render of SalesAnalysis, its margin columns)
            readerSummary.status == 200 && readerSummary.errors.length == 0
            readerSummary.output.includes("Sales Orders by Placed Date")
            !readerSummary.output.includes("Total Cost")
            !readerSummary.output.includes("Cost %")
            // the framework's own Chart.js, no CDN script, and Chart.js 4 options (SEC-BAP-137)
            readerSummary.output.includes("/libs/chartjs/chart.umd.min.js")
            !readerSummary.output.includes("cdnjs.cloudflare.com")
            !readerSummary.output.includes("yAxes")
            unauthorized(repReports)
            panels.files.errors.includes("RECORD_PANEL_UNAVAILABLE")
            !panels.chatter.errors.includes("RECORD_PANEL_UNAVAILABLE")
            panels.account.errors == ""
            panels.otherAccount.errors.includes("RECORD_PANEL_UNAVAILABLE")
            repProduct.errors.length == 0
            repProduct.output.includes("DEMO_1_1")
            !repProduct.output.includes("ProductChatter")
            catalogProduct.errors.length == 0
            catalogProduct.output.includes("ProductChatter")
        }
    }
)

// P3 (design §4): an account is its organization's (or shared), a contact seen through an account; MergeAccounts is a manager's
feature(
    "an account and a contact are the representative's organization's, refused another's; MergeAccounts opens to a manager only",
    {
        when() {
            const problems = []
            const expect = (label, message, refusalText) => {
                if (refusalText ? !message.includes(refusalText) : message !== "")
                    problems.push(`${label}: ${message || "accepted"}`)
            }
            const record = (recordType, recordId) => refusal(checkRecord, {recordType, recordId})
            asUser(users.rep, () => {
                expect("Wingtip Traders", record("account", ids.accounts.wingtip))
                expect("Fabrikam Industrial", record("account", ids.accounts.fabrikam), "RECORD_UNAVAILABLE")
                expect("Dana Morales", record("contact", ids.contacts.dana))
                expect("Lee Chen", record("contact", ids.contacts.lee), "RECORD_UNAVAILABLE")
                // an internal organization is no account
                expect("Ziziwork Retail as an account", record("account", ids.organizationId), "RECORD_UNAVAILABLE")
            })
            asUser(users.otherRep, () => {
                expect("Fabrikam Industrial (its representative)", record("account", ids.accounts.fabrikam))
                expect(
                    "Wingtip Traders (Ziziwork Sales' representative)",
                    record("account", ids.accounts.wingtip),
                    "RECORD_UNAVAILABLE"
                )
            })
            const repMerge = screenRefusal(users.rep, "Accounts/MergeAccounts")
            if (!unauthorized(repMerge)) problems.push(`a representative opens MergeAccounts: ${repMerge || "opened"}`)
            const managerMerge = screenRefusal(users.manager, "Accounts/MergeAccounts")
            if (managerMerge !== "") problems.push(`the manager is refused MergeAccounts: ${managerMerge}`)
            const accountsMenu = shell(users.rep, true, "Accounts/Accounts", "Accounts").names
            if (JSON.stringify(accountsMenu) !== JSON.stringify(ids.accountsMenu))
                problems.push(`the Accounts menu: ${accountsMenu}`)
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

// P4 (design §1.1, §3): a deal is its owner's and its team's, the organization's for a manager, never another organization's; its
// notes and files under Sales follow it; Marketing's root mounts Leads, Accounts (impl-marketing P3) and LeadSources alone
feature(
    "a deal is the rep's and their team's, the organization's for a manager, refused another's; Marketing's root mounts Leads",
    {
        when() {
            const problems = []
            const expect = (label, message, refusalText) => {
                if (refusalText ? !message.includes(refusalText) : message !== "")
                    problems.push(`${label}: ${message || "accepted"}`)
            }
            const record = recordId => refusal(checkRecord, {recordType: "opportunity", recordId})
            asUser(users.rep, () => {
                expect("Wingtip's refit (own)", record(ids.deals.wingtip))
                expect("the trade fair lead (East's queue)", record(ids.deals.fairLead))
                expect("Contoso's pilot (West's)", record(ids.deals.contoso), "RECORD_UNAVAILABLE")
                expect("Fabrikam's upgrade (Ziziwork Sales')", record(ids.deals.fabrikam), "RECORD_UNAVAILABLE")
            })
            asUser(users.manager, () => expect("Contoso's pilot (the manager's organization)", record(ids.deals.contoso)))
            asUser(users.otherRep, () => expect("Wingtip's refit (Retail's)", record(ids.deals.wingtip), "RECORD_UNAVAILABLE"))
            const panels = asUser(users.rep, () => ({
                own: panelRequest("apps/Sales/RecordFiles/filesData", {
                    recordEntity: "mantle.sales.opportunity.SalesOpportunity",
                    recordId: ids.deals.wingtip
                }),
                other: panelRequest("apps/Sales/RecordFiles/filesData", {
                    recordEntity: "mantle.sales.opportunity.SalesOpportunity",
                    recordId: ids.deals.contoso
                })
            }))
            if (panels.own.errors) problems.push(`the rep's deal's files: ${panels.own.errors}`)
            if (!panels.other.errors.includes("RECORD_PANEL_UNAVAILABLE"))
                problems.push(`West's deal's files: ${panels.other.errors || "served"}`)
            // a second root's context: Marketing's links are the Sales screens it mounts, under its own root
            const marketing = asUser(users.rep, () => invoke(context, {appRoot: "Marketing"}))
            if (
                JSON.stringify(Object.keys(marketing.sharedLinks || {}).sort()) !==
                    '["Accounts/Accounts","Pipeline/Leads","Settings/LeadSources"]' ||
                marketing.sharedLinks["Pipeline/Leads"] !== "//Marketing/Leads" ||
                // impl-marketing P3: Accounts at Marketing/Leads/Accounts, for its bulk action
                marketing.sharedLinks["Accounts/Accounts"] !== "//Marketing/Leads/Accounts"
            )
                problems.push(`Marketing's links: ${JSON.stringify(marketing.sharedLinks)}`)
            // impl-marketing P19 (review): an account opens Marketing's Customer360 and a contact its ContactDetail for a Marketing
            // audience reader only (the administrator here); the rep above, who holds no audience read, sees them unlinked
            const audienceLinks = asUser("john.doe", () => invoke(context, {appRoot: "Marketing"})).sharedLinks || {}
            if (
                audienceLinks["Accounts/Customer360"] !== "//Marketing/Customers/Customer360" ||
                audienceLinks["Accounts/ContactDetail"] !== "//Marketing/Contacts/ContactDetail"
            )
                problems.push(`Marketing's links for an audience reader: ${JSON.stringify(audienceLinks)}`)
            const pipelineMenu = shell(users.rep, true, "Pipeline/Opportunities", "Pipeline").names
            if (JSON.stringify(pipelineMenu) !== JSON.stringify(ids.pipelineMenu))
                problems.push(`the Pipeline menu: ${pipelineMenu}`)
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

feature(
    "Admin's registry holds each Sales bundle with exactly its group's grants; SALES_OWNER_CHANGE is the identity operator's and Admin's administrator's",
    {
        when() {
            const problems = []
            system(() => {
                const bundles = Array.from(
                    ec.entity.find("moqui.security.CapabilityBundle").condition("appName", "Sales").list()
                ).map(row => row.userGroupId)
                const expected = ["REP", "MANAGER", "APPROVE", "CHANGE", "AGREEMENT", "READ", "ADMIN"]
                    .map(name => "BOSS_SALES_" + name)
                    .concat(["BOSS_SALES"])
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
                    .condition("userGroupId", "BOSS_SALES")
                    .list()
                if (launcher.size() !== 1 || launcher.get(0).artifactGroupId !== "BOSS_SALES")
                    problems.push("the launcher's artifact")
                // the shipped groups that hold it: not ADMIN, nor a group another spec made in the same database
                // (mr-mantle's SalesWorkspace grants SALES_OWNER_CHANGE to its SWS_ groups and keeps them)
                const holders = (entity, userPermissionId) =>
                    Array.from(ec.entity.find(entity).condition({userPermissionId}).list())
                        .map(row => row.userGroupId)
                        .filter(id => id.startsWith("BOSS_"))
                        .sort()
                const importers = holders("moqui.security.CapabilityBundlePermission", "SALES_IMPORT")
                if (JSON.stringify(importers) !== '["BOSS_SALES_ADMIN","BOSS_SALES_MANAGER"]')
                    problems.push(`SALES_IMPORT's bundles: ${importers}`)
                for (const entity of ["moqui.security.UserGroupPermission", "moqui.security.CapabilityBundlePermission"]) {
                    const owners = holders(entity, "SALES_OWNER_CHANGE")
                    // P6 (the user's call of Nov 13, F80): Admin's administrator holds it too, as every other owner change
                    if (JSON.stringify(owners) !== '["BOSS_ADMIN_ADMIN","BOSS_ADMIN_IDENTITY"]')
                        problems.push(`SALES_OWNER_CHANGE's ${entity}: ${owners}`)
                }
            })
            // the identity operator holds it, and opens no Sales
            const identity = asUser(users.identity, () => ({
                holds: ec.user.hasPermission("SALES_OWNER_CHANGE"),
                context: refusal(context, {})
            }))
            if (!identity.holds) problems.push("the identity operator lacks SALES_OWNER_CHANGE")
            if (!refused(identity.context))
                problems.push(`the identity operator gets Sales' context: ${identity.context || "accepted"}`)
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

// P9 (impl-sales P9, F43): Approvals is the sales approver's, and deciding a quote needs SALES_APPROVE and a quote of the approver's
// organization; the approver's own decision of a quote is SalesApprovals'
feature("Approvals and a quote's decision are a sales approver's, of their organization", {
    when() {
        const problems = []
        const tabs = user => shell(user, true, "Quotes/Quotes", "Quotes").names
        if (JSON.stringify(tabs(users.approver)) !== JSON.stringify(ids.approverQuotesMenu))
            problems.push(`the approver's Quotes tabs: ${tabs(users.approver)}`)
        if (JSON.stringify(tabs(users.rep)) !== JSON.stringify(ids.quotesMenu))
            problems.push(`the rep's Quotes tabs: ${tabs(users.rep)}`)
        const approverList = screenRefusal(users.approver, "Quotes/Approvals")
        if (approverList) problems.push(`the approver's Approvals: ${approverList}`)
        const repList = screenRefusal(users.rep, "Quotes/Approvals")
        if (!/^40[13] |is not authorized|PERMISSION_DENIED/.test(repList))
            problems.push(`the rep opens Approvals: ${repList || "opened"}`)
        // the same parameters: a stale revision, so neither call could write; the rep is refused for the permission first. The
        // service as the user through no screen, authorization off as the root's grant lets its screens call it
        const decide = (user, orderId) =>
            asUser(user, () =>
                system(() =>
                    refusal("mantle.order.SalesApprovalServices.decide#Quote", {orderId, orderRevision: "0", reason: "Spec"})
                )
            )
        const repDecide = decide(users.rep, ids.quotes.wingtip)
        if (!repDecide.includes("PERMISSION_DENIED")) problems.push(`the rep decides: ${repDecide || "decided"}`)
        const approverDecide = decide(users.approver, ids.quotes.wingtip)
        if (!/REVISION_CHANGED|RECORD_UNAVAILABLE/.test(approverDecide))
            problems.push(`the approver's stale decision: ${approverDecide || "decided"}`)
        const otherDecide = decide(users.approver, ids.quotes.fabrikam)
        if (!otherDecide.includes("RECORD_UNAVAILABLE"))
            problems.push(`the approver decides Ziziwork Sales' quote: ${otherDecide || "decided"}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

// P10 (impl-sales P10): sending a quote is its rep's, of their organization: with the same parameters (a preview, so nothing is
// written), the rep reaches the quote's own state check and Ziziwork Sales' rep is refused it as missing; a holder of
// SALES_QUOTE_EDIT without SALES_QUOTE_SEND is refused in Mantle's SalesQuoteIssue (no demo group holds one without the other)
feature("a quote's send is its rep's, of their organization", {
    when() {
        const send = user =>
            asUser(user, () =>
                system(() =>
                    refusal("mantle.order.SalesQuoteIssueServices.send#Quote", {
                        orderId: ids.quotes.wingtip,
                        orderRevision: "1",
                        previewOnly: "Y"
                    })
                )
            )
        return {rep: send(users.rep), other: send(users.otherRep)}
    },
    then({rep, other}) {
        rep.includes("QUOTE_NOT_PROPOSED")
        other.includes("RECORD_UNAVAILABLE")
    }
})

// P11 (impl-sales P11): approving a sales order is an order approver's, of their organization: with the same parameters (a stale
// revision, so nothing is written) the rep who placed it is refused for the permission, the approver reaches the revision check, and
// Ziziwork Sales' rep is refused it as missing
feature("approving a sales order is an order approver's, of their organization", {
    when() {
        const O = "mantle.order.SalesOrderServices."
        const revisionOf = id =>
            Number(ec.entity.find("mantle.order.OrderHeader").condition("orderId", id).disableAuthz().one().orderRevision)
        const orderId = asUser(users.rep, () =>
            system(() => {
                const id = invoke(O + "create#SalesOrder", {
                    organizationPartyId: ids.organizationId,
                    customerPartyId: ids.accounts.wingtip
                }).orderId
                invoke(O + "store#SalesOrderLine", {
                    orderId: id,
                    orderRevision: revisionOf(id),
                    productId: "DEMO_1_1",
                    quantity: 1
                })
                invoke(O + "place#SalesOrder", {orderId: id, orderRevision: revisionOf(id)})
                return id
            })
        )
        const approve = user => asUser(user, () => system(() => refusal(O + "approve#SalesOrder", {orderId, orderRevision: "0"})))
        return {rep: approve(users.rep), approver: approve(users.approver), other: approve(users.otherRep)}
    },
    then({rep, approver, other}) {
        rep.includes("PERMISSION_DENIED")
        approver.includes("REVISION_CHANGED")
        other.includes("RECORD_UNAVAILABLE")
    }
})

// P12 (impl-sales P12): a quote template is maintained by a Sales manager or administrator and read, once published, by the
// organization's Sales users: with the same parameters (a stale revision, so nothing is written) the rep is refused the draft's change
// for the permission and the manager reaches the revision check; the rep sees Retail's published template and Ziziwork Sales' rep does
// not (another organization's answers as missing)
feature("a quote template is a manager's to keep and its organization's to read", {
    when() {
        const Q = "mantle.order.SalesQuoteServices."
        const store = user =>
            asUser(user, () =>
                system(() =>
                    refusal(Q + "store#QuoteTemplate", {
                        orderId: ids.templates.service,
                        orderRevision: "0",
                        orderName: "Yearly service visit"
                    })
                )
            )
        const seen = user =>
            asUser(user, () => system(() => !!invoke(Q + "get#QuoteTemplate", {orderId: ids.templates.refit}).templateFound))
        return {rep: store(users.rep), manager: store(users.manager), repSees: seen(users.rep), otherSees: seen(users.otherRep)}
    },
    then({rep, manager, repSees, otherSees}) {
        rep.includes("PERMISSION_DENIED")
        manager.includes("REVISION_CHANGED")
        repSees == true
        otherSees == false
    }
})

// P15 (impl-sales P15): a customer agreement is the agreement keeper's to change and its organization's to read: with the same
// parameters (a stale revision, so nothing is written) the rep is refused the change for the permission and the keeper reaches the
// revision check; the rep reads Retail's agreement and Ziziwork Sales' rep does not (another organization's answers as missing)
feature("a customer agreement is the keeper's to change and its organization's to read", {
    when() {
        const G = "mantle.party.SalesAgreementServices."
        const store = user =>
            asUser(user, () =>
                system(() =>
                    refusal(G + "store#SalesAgreement", {
                        agreementId: ids.agreements.contoso,
                        agreementRevision: "0",
                        description: "Contoso supply terms"
                    })
                )
            )
        const seen = user =>
            asUser(user, () =>
                system(() => !!invoke(G + "get#SalesAgreement", {agreementId: ids.agreements.contoso}).agreementFound)
            )
        return {rep: store(users.rep), keeper: store(users.agreement), repSees: seen(users.rep), otherSees: seen(users.otherRep)}
    },
    then({rep, keeper, repSees, otherSees}) {
        rep.includes("PERMISSION_DENIED")
        keeper.includes("REVISION_CHANGED")
        repSees == true
        otherSees == false
    }
})

// P13 (impl-sales P13): inviting a customer's contact to PASS Sales is a holder of SALES_CUSTOMER_INVITE's, for an account of their
// organization: with the same parameters (an address that is not the contact's, so nothing is written), the manager reaches the
// address check, the rep is refused for the permission, and the manager is refused Ziziwork Sales' account as missing
feature("inviting a customer's contact to PASS Sales is an inviter's, for an account of their organization", {
    when() {
        const invite = (user, accountPartyId, contactPartyId) =>
            asUser(user, () =>
                system(() =>
                    refusal("mantle.sales.AccountServices.invite#SalesContact", {
                        accountPartyId,
                        contactPartyId,
                        emailAddress: "nobody@invite.example.test"
                    })
                )
            )
        return {
            manager: invite(users.manager, ids.accounts.wingtip, ids.contacts.dana),
            rep: invite(users.rep, ids.accounts.wingtip, ids.contacts.dana),
            other: invite(users.manager, ids.accounts.fabrikam, ids.contacts.lee)
        }
    },
    then({manager, rep, other}) {
        manager.includes("EMAIL_INVALID")
        rep.includes("PERMISSION_DENIED")
        other.includes("RECORD_UNAVAILABLE")
    }
})
// P16: keeping a recurring base is SALES_RECURRENCE_MANAGE's in its organization (a manager reads it; Ziziwork Sales' rep does not see it)
feature("a recurring base is its keeper's to change, in its organization", {
    when() {
        const base = recurringBase().baseOrderId
        const pause = user =>
            asUser(user, () =>
                system(() =>
                    refusal("mantle.order.SalesRecurrenceServices.change#SalesRecurrence", {
                        baseOrderId: base,
                        recurRevision: "99",
                        operation: "pause",
                        reason: "Spec"
                    })
                )
            )
        return {keeper: pause(users.agreement), manager: pause(users.manager), other: pause(users.otherRep)}
    },
    then({keeper, manager, other}) {
        keeper.includes("REVISION_CHANGED")
        manager.includes("PERMISSION_DENIED")
        other.includes("RECORD_UNAVAILABLE")
    }
})

// P18 (impl-sales P18): a target is a sales manager's to set and a forecast its key's readers' to read: with the same parameters (a
// stale revision, so nothing is written) the rep is refused the target for the permission and the manager reaches the revision check;
// the rep reads their own forecast and Ziziwork Sales' rep does not (another organization's answers as missing)
feature("a target is a sales manager's to set; a forecast is read by its key's readers, not another organization's", {
    when() {
        const F = "mantle.sales.ForecastServices."
        const store = user =>
            asUser(user, () =>
                system(() =>
                    refusal(F + "store#Target", {salesForecastId: ids.forecasts.rep, quotaAmount: "30000", expectedRevision: "0"})
                )
            )
        const seen = user => asUser(user, () => system(() => refusal(F + "get#Forecast", {salesForecastId: ids.forecasts.rep})))
        return {rep: store(users.rep), manager: store(users.manager), repSees: seen(users.rep), otherSees: seen(users.otherRep)}
    },
    then({rep, manager, repSees, otherSees}) {
        rep.includes("PERMISSION_DENIED")
        manager.includes("REVISION_CHANGED")
        repSees == ""
        otherSees.includes("RECORD_UNAVAILABLE")
    }
})
