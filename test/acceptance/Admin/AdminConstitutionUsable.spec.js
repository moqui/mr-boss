// Admin P7's "usable when" (impl-admin P7; design-admin §15.3 "Constitution reading, customization and reset"), as an acceptance
// walk with artifact authorization on: Ziziwork Retail's delegate (admin.configure) customizes Retail's Constitution in Spanish
// through Admin › Settings › Constitution, adds a rule and moves it without changing its id, then resets Retail to the instance
// document; after each step the Constitution a Retail member's next agent run gets (get#Constitution for the member's active
// organization, which the run's snapshot resolves the same way, and its prompt section) is that step's. The member, in no Admin
// group, reads the document as the Assist drawer's Rules pane does and is refused the Admin screen. The rules are Mantle's
// Constitution spec and BOSS's AdminConstitution.
// Run: ./moq accept mr-boss --spec AdminConstitutionUsable
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const MANTLE = "mantle.party.ConstitutionServices."
const ADMIN = "org.moqui.admin.ConstitutionServices."
// a Retail member in no Admin group (Commerce's manager), working in Retail
const member = "commerce.manager"
const memberUserId = ids.retailUserId
const state = {}
const removeDocuments = () =>
    system(() =>
        ec.entity
            .find("mantle.party.PartyContent")
            .condition({partyId: ids.organizationId, partyContentTypeEnumId: "PcntConstitution"})
            .deleteAll()
    )
const hash = () =>
    system(() => invoke(MANTLE + "get#OrganizationConstitution", {organizationPartyId: ids.organizationId}).contentHash)
const apply = parameters =>
    asUser(users.configure, () =>
        page(
            "Settings/Constitution/applyEdit",
            Object.assign({scope: ids.organizationId, expectedHash: hash()}, parameters),
            "html"
        )
    )
// what the member's next agent run gets: the document of its active organization, and the prompt section in a language
const nextRun = locale =>
    asUser(member, () => ({
        read: invoke(ADMIN + "get#Constitution", {locale}),
        prompt: invoke(ADMIN + "preview#ConstitutionPrompt", {locale}).promptText || ""
    }))
const preference = value =>
    system(() => {
        const found = ec.entity
            .find("moqui.security.UserPreference")
            .condition({userId: memberUserId, preferenceKey: "ACTIVE_ORGANIZATION"})
            .one()
        if (found) found.delete()
        if (value)
            ec.service
                .sync()
                .name("create#moqui.security.UserPreference")
                .parameters({userId: memberUserId, preferenceKey: "ACTIVE_ORGANIZATION", preferenceValue: value})
                .call()
        return found?.preferenceValue || null
    })

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        removeDocuments()
        state.previousActive = preference(ids.organizationId)
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        removeDocuments()
        preference(state.previousActive)
        ec.artifactExecution.enableAuthz()
    }
})

feature("the delegate customizes Retail's Constitution in Spanish, and the member's next run uses it", {
    when() {
        const before = nextRun("es")
        const saved = apply({operation: "setDocumentText", locale: "es", title: "Reglas de Ziziwork Retail"})
        return {before, saved, after: nextRun("es"), english: nextRun("en")}
    },
    then({before, saved, after, english}) {
        before.read.source != "organization"
        saved.errors.length == 0
        after.read.source == "organization" && after.read.title == "Reglas de Ziziwork Retail"
        after.prompt.includes("Reglas de Ziziwork Retail")
        // the other languages are kept: English still reads the English title
        english.read.title != "Reglas de Ziziwork Retail"
    }
})

feature("the delegate adds a rule and moves it up without changing its id, and the member's next run has it there", {
    when() {
        const added = apply({
            operation: "addRule",
            locale: "en",
            title: "Retail returns",
            description: "Returns are accepted within thirty days.",
            instructions: "Do not promise a return after thirty days."
        })
        const rules = () => Array.from(nextRun("en").read.ruleList || []).map(rule => rule.ruleId)
        const afterAdd = rules()
        state.newRuleId = afterAdd[afterAdd.length - 1]
        const moved = apply({operation: "moveRule", direction: "up", ruleId: state.newRuleId, locale: "en"})
        return {added, afterAdd, moved, afterMove: rules(), prompt: nextRun("en").prompt}
    },
    then({added, afterAdd, moved, afterMove, prompt}) {
        added.errors.length == 0 && moved.errors.length == 0
        afterMove.length == afterAdd.length
        afterMove.indexOf(state.newRuleId) == afterAdd.length - 2
        prompt.includes(state.newRuleId + " — Retail returns")
    }
})

feature(
    "the delegate resets Retail to the instance Constitution, and the member's next run uses that; the member reads without Admin",
    {
        when() {
            const reset = asUser(users.configure, () =>
                page("Settings/Constitution/reset", {scope: ids.organizationId, expectedHash: hash()}, "html")
            )
            return {
                reset,
                after: nextRun("en"),
                pane: asUser(member, () => invoke(ADMIN + "get#Constitution", {organizationPartyId: ids.organizationId})),
                screen: asUser(member, () => page("Settings/Constitution", {scope: ids.organizationId}, "html"))
            }
        },
        then({reset, after, pane, screen}) {
            reset.errors.length == 0
            after.read.source != "organization"
            !Array.from(after.read.ruleList || []).some(rule => rule.ruleId == state.newRuleId)
            pane.available == "Y" && pane.instructions == null
            screen.status != 200 || screen.errors.length > 0
        }
    }
)
