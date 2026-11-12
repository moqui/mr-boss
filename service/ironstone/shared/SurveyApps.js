// The survey builder's per-app registrations (crosscut §2, §8; design-drawers-commons §19; impl-people P16, F51): the four
// shared screens (Shared/SurveyForms, SurveyFormDetail, SurveyResponses, SurveyResponseDetail) take their context from the
// registration of the app that mounts them, never from a branch on one app: the purposes the app offers, the services that
// list its forms, make one, read one and change it, and the ones that read its responses, the context map whose capability
// shows the edit actions, the routes of the four screens under the app (its sharedLinks keys) and the app's words. Customer
// Service's is the first (its case feedback, with the rating; its behavior and specs as built in its P13), People's the second
// (its private purposes over mantle.party.FormDefinitionServices, no responses screens: a People response is read through the
// People service of the record it belongs to). Marketing adds its own (impl-marketing P12).
//
// A registration is data, never authority: the services it names check the user's permissions and organization themselves,
// and the capability only shows or hides an action. An app with no registration sees "not available".
const D = "mantle.party.FormDefinitionServices."
const apps = {
    CustomerService: {
        purposes: ["DbfpCaseFeedback"],
        rating: true,
        services: {
            list: "ironstone.customerservice.FeedbackServices.find#FeedbackForms",
            create: "mantle.request.CaseFeedbackServices.create#FeedbackForm",
            get: "mantle.request.CaseFeedbackServices.get#FeedbackForm",
            publish: "mantle.request.CaseFeedbackServices.publish#FeedbackForm",
            rename: "mantle.request.CaseFeedbackServices.rename#FeedbackForm",
            saveField: "mantle.request.CaseFeedbackServices.save#FeedbackFormField",
            endPart: "mantle.request.CaseFeedbackServices.end#FeedbackFormPart",
            saveCondition: "mantle.request.CaseFeedbackServices.save#FeedbackFormCondition",
            conditionValues: "ironstone.customerservice.TemplateServices.get#ConditionValues",
            responses: "ironstone.customerservice.FeedbackServices.find#CaseResponses",
            response: "ironstone.customerservice.FeedbackServices.get#CaseResponse",
            followUp: "mantle.request.CaseFeedbackServices.record#FeedbackFollowUp"
        },
        capabilities: {context: "customerService", edit: "policyEdit"},
        links: {
            forms: "Settings/FeedbackForms",
            formDetail: "Settings/FeedbackFormDetail",
            responses: "Reports/SatisfactionResults",
            response: "Reports/ResponseDetail"
        },
        words: {
            listTitle: "Feedback forms",
            listCaption:
                "The questions a customer answers once a case is resolved. A form changes by dated questions and options, so earlier answers keep the questions they answered.",
            newButton: "New feedback form",
            empty: "No feedback form yet: resolved cases ask nothing. Make one with New feedback form, publish it, then choose it in Service defaults.",
            formLabel: "Feedback form",
            formsLink: "All feedback forms",
            backLink: "Back to feedback forms",
            unavailable: "it does not exist or is not one of your organization's feedback forms.",
            previewTitle: "Preview: what the customer answers",
            previewCaption:
                "The customer's page (the Support app's Feedback) asks the published questions with these rules, and the server checks the answer again.",
            firstQuestion: "No question yet. Add the rating first: a choice whose values are its scores."
        },
        accessRows: [
            {
                who: "Service administrators of its organization",
                what: "Change and publish the form",
                how: "Support policy edit (SUPPORT_POLICY_EDIT)"
            },
            {
                who: "Service managers",
                what: "Read the answers and their comments, follow up low scores",
                how: "Support case manage (SUPPORT_CASE_MANAGE)"
            },
            {
                who: "The follow-up team",
                what: "Read the answers of the follow-ups it is given; comments only when the customer agreed to be contacted",
                how: "Its team membership"
            },
            {
                who: "The customer",
                what: "Answer once, from the invitation link",
                how: "The invitation link (Support app, Feedback)"
            }
        ]
    },
    People: {
        purposes: ["DbfpInterviewScorecard", "DbfpReview", "DbfpTrainingAssessment", "DbfpExitInterview"],
        rating: false,
        services: {
            list: D + "find#Forms",
            create: D + "create#Form",
            get: D + "get#Form",
            publish: D + "publish#Form",
            rename: D + "rename#Form",
            saveField: D + "save#FormField",
            endPart: D + "end#FormPart",
            saveCondition: D + "save#FormCondition",
            conditionValues: null,
            responses: null,
            response: null,
            followUp: null
        },
        capabilities: {context: "people", edit: "configure"},
        links: {forms: "Settings/Forms", formDetail: "Settings/FormDetail", responses: null, response: null},
        words: {
            listTitle: "Forms",
            listCaption:
                "The private questionnaires People asks: interview scorecards, reviews, training assessments and exit interviews. Only the people a People record assigns answer one, never from a public or invitation link; a form changes by dated questions, so earlier answers keep the questions they answered.",
            newButton: "New form",
            empty: "No form yet. Make one with New form, add its questions and publish it; an opening's interviews then ask its scorecard.",
            formLabel: "Form",
            formsLink: "All forms",
            backLink: "Back to forms",
            unavailable: "it does not exist or is not one of your employers' People forms.",
            previewTitle: "Preview: what the respondent answers",
            previewCaption:
                "An assigned respondent answers the published questions with these rules in People (an interviewer on the application), and the server checks the answer again.",
            firstQuestion: "No question yet. Add the questions the respondent answers."
        },
        accessRows: [
            {
                who: "The People administrator of its employer",
                what: "Change and publish the form",
                how: "People configure (PEOPLE_CONFIGURE)"
            },
            {
                who: "Recruiters, development and HR readers of the employer",
                what: "Read the form; recruiters read every scorecard of their applications",
                how: "The form's purpose (PEOPLE_RECRUIT_VIEW, PEOPLE_DEVELOP_VIEW, PEOPLE_HR_VIEW)"
            },
            {
                who: "The assigned respondent",
                what: "Answer once and read their own answer, never another's",
                how: "Their assignment on the record (an interview's panel)"
            }
        ]
    }
}
// The registration of an app root, or null.
const app = appRoot => (appRoot && Object.hasOwn(apps, appRoot) ? apps[appRoot] : null)
// The app's survey context for a screen: its registration and whether the user may change forms (the edit capability of the
// app's shared context, which the app's root put in the screen's context under the registration's name).
function context(appRoot) {
    const registration = app(appRoot)
    if (!registration) return null
    const appContext = ec.context.get(registration.capabilities.context)
    const capabilities = appContext?.capabilities || {}
    return Object.assign({}, registration, {canEdit: !!capabilities[registration.capabilities.edit]})
}
;({app, context})
