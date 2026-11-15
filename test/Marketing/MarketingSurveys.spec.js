// Marketing's surveys (impl-marketing P12; design-marketing §10 Surveys, SurveyDistribution, Responses): SurveyDistribution's one qvt
// render of Retail's public visit survey for its author, with all of its checks on that render (the header and its state, the public
// link with its QR, the readiness, the subscription choice, the respondent's questions, Close offered and no invitation send for a
// public one); and the survey builder's Marketing context, checked on the context services with no second render of the shared screens:
// Marketing's registration (its purposes, services, routes and the edit capability of Marketing's context), the author editing the
// demo survey and the analyst reading it, and the registration's response service answering the demo's two responses to the analyst
// unnamed. The rules are Mantle's (test/party/FormPublications, test/marketing/MarketingForms); the access rules MarketingAccess's. The
// survey scenario is the acceptance MarketingSurveyWalk.
// Run: ./moq test mr-boss --spec MarketingSurveys
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const {ids, users, asUser, invoke, page, system} = lib

spec({})

feature("SurveyDistribution shows a public survey's state, link and QR, readiness, choice and questions to its author", {
    when() {
        return {
            detail: asUser(users.author, () => page("Surveys/SurveyDistribution", {publicationId: ids.surveyPublicationId}))
        }
    },
    then({detail}) {
        detail.status == 200 && detail.errors.length == 0
        detail.output.includes("Visit survey on the shop") && detail.output.includes("Garden centre visit")
        detail.output.includes("Open") && detail.output.includes("Anyone with the link")
        detail.output.includes("Spring garden launch")
        // the public page on the shop's Marketing mount, with its QR
        detail.output.includes("/marketing/SubmitForm?publication=" + ids.surveyPublicationId)
        detail.output.includes("<svg")
        detail.output.includes("The form's questions are published") && detail.output.includes("Ready")
        // the subscription choice and the respondent's questions as the preview shows them
        detail.output.includes("Garden newsletter")
        detail.output.includes("How was your visit?") && detail.output.includes("Anything we could do better?")
        detail.output.includes("Thank you: your answer helps us plan the spring.")
        // an open public publication: Close offered; no Publish and no invitation send
        detail.output.includes("ClosePublication")
        !detail.output.includes("PublishFormForm") && !detail.output.includes("NewInvitationSendForm")
    }
})

feature(
    "the survey builder's Marketing context: the registration, the author editing, the analyst reading the responses unnamed",
    {
        when() {
            const apps = ec.resource.script("component://mr-boss/service/ironstone/shared/SurveyApps.js")
            const registration = apps.app("Marketing")
            const context = user =>
                asUser(user, () => invoke("ironstone.marketing.ContextServices.get#SharedContext", {appRoot: "Marketing"}))
            const author = context(users.author)
            // the services as the user, their own checks deciding (as the shared screens call them below the area's grant)
            const as = (user, service, parameters) => asUser(user, () => system(() => invoke(service, parameters)))
            const forms = user =>
                as(user, registration.services.list, {
                    purposeEnumIds: registration.purposes,
                    organizationPartyId: ids.organizationId
                })
            const authorForms = forms(users.author)
            const analystForms = forms(users.analyst)
            const responses = as(users.analyst, registration.services.responses, {formId: ids.surveyFormId})
            const response = as(users.analyst, registration.services.response, {formResponseId: ids.anonymousResponseId})
            return {registration, author, authorForms, analystForms, responses, response}
        },
        then({registration, author, authorForms, analystForms, responses, response}) {
            registration.purposes.join() === "DbfpSurvey,DbfpLead,DbfpRegistration"
            registration.publicationScope === true && registration.scores === true
            registration.capabilities.context === "marketing" && registration.capabilities.edit === "contentEdit"
            Object.values(registration.links).every(path => !!author.sharedLinks[path])
            author.capabilities.contentEdit === true && author.capabilities.surveys === true
            authorForms.forms.find(f => f.formId === ids.surveyFormId).canEdit === true
            analystForms.forms.find(f => f.formId === ids.surveyFormId).canEdit === false
            // the two responses of the demo, the invited one named for no analyst; each reads its own date's option text
            responses.rows.length === 2
            responses.rows.every(r => r.respondentText !== "Maya Lindqvist")
            responses.stats.invited === 1 && responses.stats.answeredInvitations === 1
            response.response.answers.find(a => a.title === "How was your visit?").valueText === "Good"
        }
    }
)
