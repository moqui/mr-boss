// Customer Service feedback (impl-customer-service P13, CS-FEEDBACK): the demo feedback (load#FeedbackDemo: Retail's form,
// its delivery policy and Joe's answered damaged-filter case); FeedbackFormDetail's one render (qvt): the questions, the
// options with their scores, the rules and the preview; ServiceDefaults' one render (qvt) with the feedback delivery;
// SatisfactionResults' read and one render (qvt): one form and its current period, the demo answer with its comment and the
// counts; ResponseDetail's read with the form as of the answer; Home's CSAT measure. The rules are Mantle's CaseFeedback spec;
// the access rules CustomerServiceAccess's; the walks CustomerServiceFeedbackWalk (acceptance).
// Run: ./moq test mr-boss --spec CustomerService/CustomerServiceFeedback
const lib = ec.resource.script("component://mr-boss/test/CustomerService/CustomerServiceSpecLib.js")
const {ids, users, asUser, system, invoke} = lib
const B = "ironstone.customerservice.FeedbackServices."
const demoForm = () =>
    system(
        () =>
            Array.from(
                ec.entity
                    .find("moqui.screen.form.DbForm")
                    .condition({
                        purposeEnumId: "DbfpCaseFeedback",
                        ownerPartyId: ids.organizationId,
                        description: "Retail case feedback"
                    })
                    .list()
            )[0]
    )

spec({
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("the demo form is published and sent; FeedbackFormDetail and ServiceDefaults show it (qvt)", {
    when() {
        const form = demoForm()
        const listed = asUser(users.admin, () =>
            invoke(B + "find#FeedbackForms", {appRoot: "CustomerService", organizationPartyId: ids.organizationId})
        )
        const detail = asUser(users.admin, () => lib.page("Settings/FeedbackFormDetail", {formId: form.formId}))
        const defaults = asUser(users.admin, () =>
            lib.page("Settings/ServiceDefaults", {organizationPartyId: ids.organizationId})
        )
        return {form, listed, detail, defaults}
    },
    then({form, listed, detail, defaults}) {
        form != null
        listed.forms.find(row => row.formId == form.formId).published == true
        listed.forms.find(row => row.formId == form.formId).policyText == "Sent for resolved cases"
        detail.errors.length == 0
        detail.output.includes("Retail case feedback")
        detail.output.includes("How satisfied are you with how we handled your request?")
        detail.output.includes("Options and scores")
        detail.output.includes("5 - Very satisfied")
        detail.output.includes("Preview: what the customer answers")
        !detail.output.includes("Publish the drafts")
        defaults.errors.length == 0
        defaults.output.includes("Feedback delivery")
        defaults.output.includes("In effect since")
        defaults.output.includes("Follow up a score of at most")
    }
})

feature(
    "SatisfactionResults shows the demo answer and its counts (qvt); ResponseDetail reads it as answered; Home measures CSAT",
    {
        when() {
            const found = asUser(users.manager, () => invoke(B + "find#CaseResponses", {appRoot: "CustomerService"}))
            const answered = found.rows.find(row => row.scoreText == "4 / 5")
            const page = asUser(users.manager, () => lib.page("Reports/SatisfactionResults", {}))
            const detail = asUser(users.manager, () =>
                invoke(B + "get#CaseResponse", {appRoot: "CustomerService", formResponseId: answered.formResponseId})
            )
            const dashboard = asUser(users.manager, () =>
                invoke("ironstone.customerservice.ReportingServices.get#ServiceDashboard", {appRoot: "CustomerService"})
            )
            return {found, answered, page, detail, csat: dashboard.measures.find(measure => measure.key == "csat")}
        },
        then({found, answered, page, detail, csat}) {
            found.formId == demoForm().formId
            found.periodOptions.length >= 1
            answered.commentText.includes("The new filter came the next day")
            answered.caseText.includes("Replacement filter arrived damaged")
            found.stats.answered >= 1
            found.stats.distribution.find(row => row.score == "4").count >= 1
            found.stats.scaleText.startsWith("1–5")
            page.errors.length == 0
            page.output.includes("Satisfaction results")
            page.output.includes("Response rate")
            detail.response.scoreText == "4 of 5"
            detail.response.answers.find(row => row.fieldName == "rating").valueText == "4 - Satisfied"
            detail.response.answers.find(row => row.fieldName == "comment").valueText.includes("next day")
            detail.followUp == null
            csat.configured == true
            csat.denominatorText.endsWith("answers")
        }
    }
)
