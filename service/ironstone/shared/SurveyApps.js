// The survey builder's per-app registrations (crosscut §2, §8; design-drawers-commons §19; impl-people P16, F51): the four
// shared screens (Shared/SurveyForms, SurveyFormDetail, SurveyResponses, SurveyResponseDetail) take their context from the
// registration of the app that mounts them, never from a branch on one app: the purposes the app offers, the services that
// list its forms, make one, read one and change it, and the ones that read its responses, the context map whose capability
// shows the edit actions, the routes of the four screens under the app (its sharedLinks keys) and the app's words. Customer
// Service's is the first (its case feedback, with the rating; its behavior and specs as built in its P13), People's the second
// (its private purposes over mantle.party.FormDefinitionServices, no responses screens: a People response is read through the
// People service of the record it belongs to). Marketing's is the third (impl-marketing P12): its public purposes (the survey, the
// lead form and the registration questions) over mantle.party.FormDefinitionServices, its responses read through
// mantle.marketing.MarketingFormServices with publication scope (publicationScope: the response screens' publication branch, never a
// case's), option scores (scores: the builder's Score column, "value | label | score") and the distribution screen (links.distribution).
//
// A registration is data, never authority: the services it names check the user's permissions and organization themselves,
// and the capability only shows or hides an action. An app with no registration sees "not available". A registration may
// name mounts: the builder mounted again under one of the app's areas (the mounting screen's always-actions set surveyMount
// to the mount's name), with its own purposes, edit capabilities (any one of which shows the edit actions), routes and words over the
// app's (People's Development: the learning administrator's training assessments, impl-people P19 review).
const L = text => ec.l10n.localize(text)
const D = "mantle.party.FormDefinitionServices."
// impl-marketing P12: Marketing's registration
const M = "mantle.marketing.MarketingFormServices."
const marketingApp = {
    purposes: ["DbfpSurvey", "DbfpLead", "DbfpRegistration"],
    rating: false,
    scores: true,
    publicationScope: true,
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
        responses: M + "find#Responses",
        response: M + "get#Response",
        followUp: null
    },
    capabilities: {context: "marketing", edit: "contentEdit"},
    links: {
        forms: "Surveys/Surveys",
        formDetail: "Surveys/SurveyDetail",
        distribution: "Surveys/SurveyDistribution",
        responses: "Surveys/Responses",
        response: "Surveys/ResponseDetail"
    },
    words: {
        listTitle: L("Surveys and forms"),
        listCaption:
            "Marketing's surveys, lead forms and registration questions. A form changes by dated questions and options, so earlier answers keep the questions they answered; publish it to a site or to a campaign's list from Distribution.",
        newButton: L("New survey or form"),
        empty: L("No survey or form yet. Make one with New survey or form, add its questions and publish them, then open Distribution to share it."),
        formLabel: L("Survey"),
        formsLink: L("All surveys and forms"),
        backLink: "Back to surveys and forms",
        unavailable: "it does not exist or is not one of your organization's Marketing forms.",
        previewTitle: L("Preview: what a respondent answers"),
        previewCaption:
            L("The public page (PASS Marketing's SubmitForm) asks the published questions with these rules, and the server checks the answer again."),
        firstQuestion:
            "No question yet. Add the questions a respondent answers; a choice's options may carry scores (value | label | score).",
        distributionLink: L("Distribution: publish and share")
    },
    accessRows: [
        {
            who: L("Content authors of its organization"),
            what: L("Change and publish the form, and publish it to a site or a campaign"),
            how: L("Marketing content edit (MARKETING_CONTENT_EDIT)")
        },
        {
            who: L("Send authors"),
            what: L("Make an invitation send to a campaign's list, approved and released as every send"),
            how: L("Marketing send edit (MARKETING_SEND_EDIT)")
        },
        {
            who: L("Audience and report readers"),
            what: "Read the responses and their summary; respondents are named for audience readers only",
            how: L("MARKETING_AUDIENCE_VIEW or MARKETING_REPORT_VIEW")
        },
        {
            who: "A respondent",
            what: L("Answer on the public page, or once from their invitation link"),
            how: L("The publication's site and access (PASS Marketing)")
        }
    ]
}
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
            listTitle: L("Feedback forms"),
            listCaption:
                L("The questions a customer answers once a case is resolved. A form changes by dated questions and options, so earlier answers keep the questions they answered."),
            newButton: L("New feedback form"),
            empty: L("No feedback form yet: resolved cases ask nothing. Make one with New feedback form, publish it, then choose it in Service defaults."),
            formLabel: L("Feedback form"),
            formsLink: L("All feedback forms"),
            backLink: L("Back to feedback forms"),
            unavailable: "it does not exist or is not one of your organization's feedback forms.",
            previewTitle: L("Preview: what the customer answers"),
            previewCaption:
                L("The customer's page (the Support app's Feedback) asks the published questions with these rules, and the server checks the answer again."),
            firstQuestion: L("No question yet. Add the rating first: a choice whose values are its scores.")
        },
        accessRows: [
            {
                who: L("Service administrators of its organization"),
                what: L("Change and publish the form"),
                how: L("Support policy edit (SUPPORT_POLICY_EDIT)")
            },
            {
                who: L("Service managers"),
                what: L("Read the answers and their comments, follow up low scores"),
                how: L("Support case manage (SUPPORT_CASE_MANAGE)")
            },
            {
                who: L("The follow-up team"),
                what: "Read the answers of the follow-ups it is given; comments only when the customer agreed to be contacted",
                how: L("Its team membership")
            },
            {
                who: L("The customer"),
                what: L("Answer once, from the invitation link"),
                how: L("The invitation link (Support app, Feedback)")
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
            listTitle: L("Forms"),
            listCaption:
                "The private questionnaires People asks: interview scorecards, reviews, training assessments and exit interviews. Only the people a People record assigns answer one, never from a public or invitation link; a form changes by dated questions, so earlier answers keep the questions they answered.",
            newButton: L("New form"),
            empty: "No form yet. Make one with New form, add its questions and publish it; an opening's interviews then ask its scorecard.",
            formLabel: L("Form"),
            formsLink: L("All forms"),
            backLink: L("Back to forms"),
            unavailable: "it does not exist or is not one of your employers' People forms.",
            previewTitle: L("Preview: what the respondent answers"),
            previewCaption:
                L("An assigned respondent answers the published questions with these rules in People (an interviewer on the application), and the server checks the answer again."),
            firstQuestion: L("No question yet. Add the questions the respondent answers.")
        },
        accessRows: [
            {
                who: L("The People administrator of its employer"),
                what: "Change and publish the form; a training assessment also the learning administrator",
                how: "People configure (PEOPLE_CONFIGURE); a training assessment and a review form also People develop edit (PEOPLE_DEVELOP_EDIT)"
            },
            {
                who: L("Recruiters, development and HR readers of the employer"),
                what: "Read the form; recruiters read every scorecard of their applications",
                how: L("The form's purpose (PEOPLE_RECRUIT_VIEW, PEOPLE_DEVELOP_VIEW, PEOPLE_HR_VIEW)")
            },
            {
                who: L("The assigned respondent"),
                what: L("Answer once and read their own answer, never another's"),
                how: L("Their assignment on the record (an interview's panel)")
            }
        ],
        mounts: {
            // impl-people P19 review: the training assessments under Skills & training (Development/AssessmentForms), built by the
            // learning administrator (PEOPLE_DEVELOP_EDIT) or the People administrator, whom Mantle's training assessment purpose
            // admits (its FormPurpose editPermission)
            Development: {
                purposes: ["DbfpTrainingAssessment"],
                capabilities: {context: "people", edit: ["developEdit", "configure"]},
                links: {
                    forms: "Development/AssessmentForms/List",
                    formDetail: "Development/AssessmentForms/FormDetail",
                    responses: null,
                    response: null
                },
                words: {
                    listTitle: "Assessment forms",
                    listCaption:
                        "The training assessments a trainer answers for each person they assess. A course or session names its form; the answers are read by development and the session's trainer, never by the person assessed, and a form changes by dated questions, so earlier answers keep the questions they answered.",
                    empty: "No assessment form yet. Make one with New form, add its questions and publish it; a course or session then names it.",
                    formsLink: L("All assessment forms"),
                    backLink: L("Back to assessment forms"),
                    previewCaption:
                        L("The trainer answers the published questions with these rules in People (assessing a person enrolled), and the server checks the answer again.")
                },
                accessRows: [
                    {
                        who: L("The learning administrator or the People administrator of its employer"),
                        what: L("Change and publish the form"),
                        how: L("People develop edit (PEOPLE_DEVELOP_EDIT) or People configure (PEOPLE_CONFIGURE)")
                    },
                    {
                        who: L("Development readers of the employer"),
                        what: L("Read the form and every assessment's answers on the session"),
                        how: L("People develop view (PEOPLE_DEVELOP_VIEW)")
                    },
                    {
                        who: L("The session's trainer"),
                        what: L("Answer it for each person they assess, and read their session's answers"),
                        how: L("The session's trainer, while they work for its employer")
                    }
                ]
            },
            // impl-people P20: the review forms under Reviews & goals (Performance/ReviewForms), built by the review administrator
            // (PEOPLE_DEVELOP_EDIT) or the People administrator, whom Mantle's review purpose admits (its FormPurpose editPermission)
            Performance: {
                purposes: ["DbfpReview"],
                capabilities: {context: "people", edit: ["developEdit", "configure"]},
                links: {
                    forms: "Performance/ReviewForms/List",
                    formDetail: "Performance/ReviewForms/FormDetail",
                    responses: null,
                    response: null
                },
                words: {
                    listTitle: "Review forms",
                    listCaption:
                        "The questions of a review's self assessment, reviewer's assessment and feedback. A review template names its forms; the answers are read through the review (the person their own self assessment and, once released, the reviewer's), and a form changes by dated questions, so earlier answers keep the questions they answered.",
                    empty: "No review form yet. Make one with New form, add its questions and publish it; a review template then names it.",
                    formsLink: L("All review forms"),
                    backLink: L("Back to review forms"),
                    previewCaption:
                        L("The person, the reviewer or a colleague asked for feedback answers the published questions with these rules in People (on the review), and the server checks the answer again.")
                },
                accessRows: [
                    {
                        who: L("The review administrator or the People administrator of its employer"),
                        what: L("Change and publish the form"),
                        how: L("People develop edit (PEOPLE_DEVELOP_EDIT) or People configure (PEOPLE_CONFIGURE)")
                    },
                    {
                        who: L("Development readers of the employer"),
                        what: L("Read the form and every review's answers"),
                        how: L("People develop view (PEOPLE_DEVELOP_VIEW)")
                    },
                    {
                        who: L("The review's person, reviewer and the colleagues asked for feedback"),
                        what: "Answer their own step once; the person reads the reviewer's answers once released",
                        how: L("Their step on the review")
                    }
                ]
            }
        }
    },
    Marketing: marketingApp
}
// The registration of an app root, or null.
const app = appRoot => (appRoot && Object.hasOwn(apps, appRoot) ? apps[appRoot] : null)
// The app's survey context for a screen: its registration and whether the user may change forms (the edit capability of the
// app's shared context, which the app's root put in the screen's context under the registration's name).
function context(appRoot) {
    const base = app(appRoot)
    if (!base) return null
    const mountName = ec.context.get("surveyMount")
    const mount = mountName && base.mounts && Object.hasOwn(base.mounts, mountName) ? base.mounts[mountName] : null
    const registration = mount ? Object.assign({}, base, mount, {words: Object.assign({}, base.words, mount.words || {})}) : base
    const appContext = ec.context.get(registration.capabilities.context)
    const capabilities = appContext?.capabilities || {}
    const edits = [].concat(registration.capabilities.edit)
    return Object.assign({}, registration, {canEdit: edits.some(name => !!capabilities[name])})
}
;({app, context})
