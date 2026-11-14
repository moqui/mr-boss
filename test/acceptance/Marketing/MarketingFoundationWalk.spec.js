// Marketing P1's "usable when" (impl-marketing P1), as an acceptance walk with artifact authorization on: the menu renders for each
// group with only its areas (Home for every Marketing user, Settings for the administrator), each entry opening and the others
// refused; marketing.reader opens Home and no settings; the Ziziwork Services author sees none of Ziziwork Retail's campaigns, lists
// or segments by record, choice, palette or direct service; the administrator adopts a legacy list on Settings › Adoption and it
// becomes the Retail author's to edit; a Projects client and a PASS public account are refused the root and every
// ironstone.marketing service, which an author calls with the same parameters. The rules themselves are MarketingAccess's and
// Mantle's MarketingScope.
// Run: ./moq accept mr-boss --spec MarketingFoundationWalk
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, shell, page} = lib
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
const refused = message => /MARKETING_UNAVAILABLE|is not authorized/.test(message)
// each group's menu (design §1.2 as built, Marketing.xml's menu-include): Settings for the administrator
const menus = {
    [users.author]: ids.staffMenu,
    [users.audience]: ids.staffMenu,
    [users.approver]: ids.staffMenu,
    [users.dispatch]: ids.staffMenu,
    [users.events]: ids.staffMenu,
    [users.analyst]: ids.staffMenu,
    [users.reader]: ids.staffMenu,
    [users.otherAuthor]: ids.staffMenu,
    [users.admin]: ids.adminMenu,
    [users.system]: ids.adminMenu
}
// every ironstone.marketing service a screen calls, with parameters it accepts from a Marketing user of Retail
const marketingServices = [
    ["ironstone.marketing.ContextServices.get#SharedContext", {}],
    ["ironstone.marketing.ContextServices.check#Record", {recordType: "organization", recordId: ids.organizationId}],
    ["ironstone.marketing.ContextServices.get#Choices", {choice: "organizations"}],
    ["ironstone.marketing.ContextServices.search#Records", {text: "zizi"}]
]
// Retail's campaign, list and segment, and a legacy list of no organization
const record = (kind, suffix) => "MKT_ACC_" + kind + "_" + suffix
const legacyList = record("LST", "LEGACY")

// A Marketing transition posted as the user's browser does
function post(path, parameters) {
    const result = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Marketing.xml").render(path, parameters, "post")
    const errors = Array.from(result.errorMessages || []).join(" | ")
    const messages = Array.from(ec.message.getMessages() || []).join(" | ")
    ec.message.clearErrors()
    return {status: result.status, errors, messages}
}
// The list services' answer for a list, as the user (their own rule; authorization off)
function listAccess(user, contactListId) {
    login(user)
    try {
        return system(() => invoke("mantle.marketing.ContactListServices.get#ContactListAccess", {contactListId}))
    } finally {
        login("john.doe")
    }
}

spec({
    setupSpec() {
        login("john.doe")
        system(() => {
            call("create#mantle.marketing.campaign.MarketingCampaign", {
                marketingCampaignId: record("CMP", "RETAIL"),
                campaignName: "Acceptance spring campaign",
                statusId: "MKTG_CAMP_PLANNED",
                organizationPartyId: ids.organizationId
            })
            call("create#mantle.marketing.contact.ContactList", {
                contactListId: record("LST", "RETAIL"),
                contactListName: "Acceptance Retail newsletter",
                contactListTypeEnumId: "NEWSLETTER",
                ownerPartyId: ids.organizationId
            })
            call("create#mantle.marketing.segment.MarketSegment", {
                marketSegmentId: record("SEG", "RETAIL"),
                description: "Acceptance Retail segment",
                marketSegmentTypeEnumId: "MARKET_SEGMENT",
                ownerPartyId: ids.organizationId
            })
            call("create#mantle.marketing.contact.ContactList", {
                contactListId: legacyList,
                contactListName: "Acceptance legacy newsletter",
                contactListTypeEnumId: "NEWSLETTER"
            })
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("the menu renders for each group with only its areas; each entry opens and Settings is refused the others", {
    when() {
        const problems = []
        for (const [user, expected] of Object.entries(menus)) {
            const found = shell(user, user === users.system)
            if (found.status != 200 || JSON.stringify(found.names) !== JSON.stringify(expected))
                problems.push(`${user}'s menu: ${found.status} ${found.names}`)
            for (const entry of ids.adminMenu) {
                const rendered = asUser(user, () => page(entry, {}, "html"))
                if (expected.includes(entry) !== opened(rendered))
                    problems.push(`${user} ${opened(rendered) ? "opens" : "is refused"} ${entry}: ${rendered.errors.join(" | ")}`)
            }
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("marketing.reader opens Home and no settings", {
    when() {
        return asUser(users.reader, () => ({
            home: page("Home", {organizationPartyId: ids.organizationId}, "html"),
            settings: page("Settings/Index", {}, "html"),
            adoption: page("Settings/Adoption", {}, "html"),
            readiness: refusal("mantle.marketing.MarketingWorkspaceServices.get#Readiness", {providerKey: "marketing.setup"})
        }))
    },
    then({home, settings, adoption, readiness}) {
        opened(home)
        home.output.includes("Marketing at a glance")
        !opened(settings)
        !opened(adoption)
        readiness.includes("PERMISSION_DENIED")
    }
})

feature(
    "the Ziziwork Services author sees none of Ziziwork Retail's campaigns, lists or segments by record, choice, palette or service",
    {
        when() {
            const problems = []
            asUser(users.otherAuthor, () => {
                for (const [recordType, code] of [
                    ["campaign", "CMP"],
                    ["list", "LST"],
                    ["segment", "SEG"],
                    ["organization", null]
                ]) {
                    const recordId = code ? record(code, "RETAIL") : ids.organizationId
                    const message = refusal("ironstone.marketing.ContextServices.check#Record", {recordType, recordId})
                    if (!message.includes("RECORD_UNAVAILABLE")) problems.push(`Retail's ${recordType}: ${message || "given"}`)
                }
                const options = invoke("ironstone.marketing.ContextServices.get#Choices", {choice: "organizations"}).options
                if (options.some(option => option.value === ids.organizationId)) problems.push("Retail among the choices")
                const rows = invoke("ironstone.marketing.ContextServices.search#Records", {text: "Acceptance"}).rows
                if (rows.length) problems.push(`the palette: ${JSON.stringify(rows)}`)
                const home = refusal("mantle.marketing.MarketingWorkspaceServices.get#Home", {
                    organizationPartyId: ids.organizationId
                })
                if (!/ORGANIZATION_DENIED|is not authorized/.test(home)) problems.push(`Retail's Home: ${home || "given"}`)
                const rendered = page("Home", {organizationPartyId: ids.organizationId}, "html")
                if (!rendered.output.includes("This organization is not available to you.")) problems.push("Retail's Home opens")
            })
            const list = listAccess(users.otherAuthor, record("LST", "RETAIL"))
            if (list.exists || list.canSeeHeader) problems.push(`the list services give Retail's list: ${JSON.stringify(list)}`)
            // Retail's author is given each with the same parameters
            asUser(users.author, () => {
                const message = refusal("ironstone.marketing.ContextServices.check#Record", {
                    recordType: "campaign",
                    recordId: record("CMP", "RETAIL")
                })
                if (message) problems.push(`Retail's author: ${message}`)
            })
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

feature("the administrator adopts a legacy list on Settings › Adoption and it becomes the Retail author's to edit", {
    when() {
        const before = listAccess(users.author, legacyList)
        const shown = asUser(users.admin, () => page("Settings/Adoption", {}, "html"))
        // the revision the page posts back (the row's lastUpdatedStamp as millis)
        const revision = system(() =>
            String(
                Number(
                    String(
                        ec.entity.find("mantle.marketing.contact.ContactList").condition("contactListId", legacyList).one()
                            .lastUpdatedStamp
                    )
                )
            )
        )
        const adoption = {recordKind: "list", recordId: legacyList, organizationPartyId: ids.organizationId, revision}
        const adopted = asUser(users.admin, () => post("Settings/Adoption/adopt", adoption))
        const again = asUser(users.admin, () => post("Settings/Adoption/adopt", adoption))
        const after = listAccess(users.author, legacyList)
        const otherAfter = listAccess(users.otherAuthor, legacyList)
        const owner = system(
            () => ec.entity.find("mantle.marketing.contact.ContactList").condition("contactListId", legacyList).one().ownerPartyId
        )
        return {before, shown, adopted, again, after, otherAfter, owner}
    },
    then({before, shown, adopted, again, after, otherAfter, owner}) {
        before.exists == false
        opened(shown)
        shown.output.includes("Acceptance legacy newsletter")
        adopted.errors == ""
        adopted.messages.includes("Adopted")
        again.messages.includes("already belongs to an organization")
        owner == ids.organizationId
        after.canSeeHeader == true && after.canPost == true
        otherAfter.exists == false
    }
})

feature("a Projects client and a PASS public account are refused the root and every ironstone.marketing service", {
    when() {
        const problems = []
        for (const user of [users.client, users.pass]) {
            const home = asUser(user, () => page("Home", {}, "html"))
            if (opened(home)) problems.push(`${user} opens Home`)
            if (shell(user).apps.includes("Marketing")) problems.push(`${user}'s launcher has Marketing`)
            for (const [service, parameters] of marketingServices) {
                const message = asUser(user, () => refusal(service, parameters))
                if (!refused(message)) problems.push(`${user} calls ${service}: ${message || "accepted"}`)
            }
        }
        // an author calls each with the same parameters
        for (const [service, parameters] of marketingServices) {
            const message = asUser(users.author, () => refusal(service, parameters))
            if (message) problems.push(`the author's ${service}: ${message}`)
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})
