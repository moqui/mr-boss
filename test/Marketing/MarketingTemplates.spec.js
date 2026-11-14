// Comms' templates and sending profiles under Marketing's mount (impl-marketing P6; design-marketing §5 MessageTemplateDetail, §12
// SendingProfiles): MessageTemplateDetail's one qvt render for an author, with all of its checks on that render (the garden newsletter's
// header, its content in effect in the editor with its declared variable, the preview through the locked renderer with the fallback,
// Publish offered only with a draft, the published contents); and SendingProfiles' one html render for the administrator, Services'
// profile not ready with its reason and the place that fixes it. The template, profile and intake rules are Mantle's
// (test/party/MessageTemplates, SendingProfiles, DeliveryReports); the access rules MarketingAccess's. The readiness scenario is the
// acceptance MarketingReadinessWalk.
// Run: ./moq test mr-boss --spec MarketingTemplates
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const {ids, users, asUser, page} = lib

spec({})

feature("MessageTemplateDetail renders a published template's header, content, preview and history for an author", {
    when() {
        return {
            detail: asUser(users.author, () =>
                page("Sends/MessageTemplateDetail", {messageTemplateId: ids.newsletterTemplateId, sampleText: "firstName ="})
            )
        }
    },
    then({detail}) {
        detail.status == 200 && detail.errors.length == 0
        detail.output.includes("Garden newsletter")
        detail.output.includes("Ziziwork Retail") && detail.output.includes("Published")
        // the content in effect in the editor, its subject and declared variable
        detail.output.includes("Content in effect")
        detail.output.includes("Garden news for ${firstName}")
        detail.output.includes("firstName | First name | gardener")
        // the preview: the fallback fills the empty sample
        detail.output.includes("Garden news for gardener")
        detail.output.includes("Hello gardener")
        // no draft: nothing to publish; the history names the publication
        !detail.output.includes("Publish the draft")
        detail.output.includes("Published contents") && detail.output.includes("The autumn newsletter")
    }
})

feature("SendingProfiles shows the administrator a profile not ready, with its reason and where it is fixed", {
    when() {
        return {
            profiles: asUser(users.admin, () =>
                page("Settings/SendingProfiles", {sendingProfileId: ids.servicesProfileId}, "html")
            )
        }
    },
    then({profiles}) {
        profiles.status == 200 && profiles.errors.length == 0
        profiles.output.includes("Retail news") && profiles.output.includes("Services notices")
        profiles.output.includes("Not ready: nothing goes out from this profile")
        profiles.output.includes("No bounce account bounces@bounce.services.example")
        profiles.output.includes("Comms: mail accounts")
        // a relay by its id; never its host
        profiles.output.includes("BOSS_COM_DEMO_MAIL") && !profiles.output.includes("127.0.0.1")
    }
})
