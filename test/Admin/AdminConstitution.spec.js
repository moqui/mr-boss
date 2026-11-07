// The Constitution in Admin (impl-admin P7; design-admin §7 Constitution, §15.3): Ziziwork Retail's delegate (admin.configure, the
// configuration administrator, with ADMIN_SETTINGS_MANAGE and ORG_CONSTITUTION_EDIT, an agent of Retail) changes Retail's document
// through Admin › Settings › Constitution, which saves Retail's own copy, and a second change made with the hash read before the
// first is refused with the first kept; the delegate is refused Ziziwork Services' document and the instance's (the sealed
// ADMIN_CONSTITUTION_GLOBAL). A Retail member in no Admin group reads Retail's document as the Assist drawer's Rules pane does
// (get#Constitution for the organization, impl-admin F46) and is refused the Admin screen. The screen's one qvt render, as the
// delegate in Retail's scope. Mantle's rules are Mantle's Constitution spec; the "usable when" is the acceptance
// AdminConstitutionUsable.
// Run: ./moq test mr-boss --spec AdminConstitution
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page} = lib
const MANTLE = "mantle.party.ConstitutionServices."
const ADMIN = "org.moqui.admin.ConstitutionServices."
// a Retail member in no Admin group (Commerce's manager)
const member = "commerce.manager"
// Mantle's services as the current user, outside a screen's grant (they check the user's access themselves)
const mantle = (verb, parameters) => system(() => invoke(MANTLE + verb, parameters))
const hashOf = organizationPartyId => mantle("get#OrganizationConstitution", {organizationPartyId}).contentHash
const removeDocuments = () =>
    system(() =>
        ec.entity
            .find("mantle.party.PartyContent")
            .condition({partyId: ids.organizationId, partyContentTypeEnumId: "PcntConstitution"})
            .deleteAll()
    )
const edit = (scope, title, expectedHash) =>
    page("Settings/Constitution/applyEdit", {scope, operation: "setDocumentText", locale: "en", title, expectedHash}, "html")

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        removeDocuments()
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        removeDocuments()
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "Retail's delegate changes Retail's Constitution, a stale hash is refused, and Services' and the instance's are refused",
    {
        when() {
            return asUser(users.configure, () => {
                const inherited = hashOf(ids.organizationId)
                const saved = edit(ids.organizationId, "Retail rules", inherited)
                const stale = edit(ids.organizationId, "Stale rules", inherited)
                const after = mantle("get#OrganizationConstitution", {organizationPartyId: ids.organizationId})
                return {
                    inherited,
                    saved,
                    stale,
                    after,
                    servicesPage: edit(ids.otherOrganizationId, "Services rules", "x"),
                    services: system(() =>
                        refusal(MANTLE + "store#OrganizationConstitution", {
                            organizationPartyId: ids.otherOrganizationId,
                            documentText: after.documentText,
                            expectedHash: "x"
                        })
                    ),
                    globalPage: edit(
                        "global",
                        "Instance rules",
                        invoke(ADMIN + "get#Constitution", {scope: "global"}).globalHash
                    ),
                    global: refusal(ADMIN + "store#Constitution", {documentText: after.documentText, expectedHash: "x"})
                }
            })
        },
        then({inherited, saved, stale, after, servicesPage, services, globalPage, global}) {
            saved.errors.length == 0
            after.customized == true && after.contentHash != inherited
            JSON.parse(after.documentText).title.en == "Retail rules"
            stale.errors.join(" ").includes("changed since it was read")
            servicesPage.errors.join(" ").includes("RECORD_UNAVAILABLE")
            services.includes("ORG_CONSTITUTION_EDIT")
            globalPage.errors.join(" ").includes("ADMIN_CONSTITUTION_GLOBAL") && global.includes("ADMIN_CONSTITUTION_GLOBAL")
        }
    }
)

feature("a Retail member without Admin reads Retail's document as the Rules pane does, and is refused the Admin screen", {
    when() {
        return asUser(member, () => ({
            read: invoke(ADMIN + "get#Constitution", {organizationPartyId: ids.organizationId}),
            screen: page("Settings/Constitution", {scope: ids.organizationId}, "html")
        }))
    },
    then({read, screen}) {
        read.source == "organization" && read.organizationPartyId == ids.organizationId && read.title == "Retail rules"
        // a reader never gets the agent instructions
        read.instructions == null
        screen.status != 200 || screen.errors.length > 0
    }
})

feature("the Constitution screen shows the delegate Retail's own document, its editor and preview, and not Services", {
    when() {
        return asUser(users.configure, () => page("Settings/Constitution", {scope: ids.organizationId}))
    },
    then({status, output, errors}) {
        status == 200
        errors.length == 0
        output.includes("Retail rules") && output.includes("has its own Constitution")
        output.includes("Add rule") && output.includes("Agent prompt section") && output.includes("Use the instance Constitution")
        !output.includes("Ziziwork Services")
    }
})
