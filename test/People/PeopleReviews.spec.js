// People's reviews and goals screens (impl-people P20; design-people §11 ReviewCycles, Reviews, ReviewDetail and Goals, §15 the
// review release, PE-21): ReviewCycles' one qvt render as the learning and review administrator (Store Operations' cycle with its
// preview: Tomas, Ines and Rafael reviewed by Hannah) with the choices reviewForms and reviewColleagues, each with a selected value
// off the page; Reviews' one qvt render as Tomas (his self assessment to do); ReviewDetail's one qvt render as Hannah (his self
// assessment read, Your assessment of him over the review form's own field and the rating, her private note, behind the AI opt-out)
// and its one agent render (tui) as Hannah (neither the note nor the assessments reach the model), then her assessment posted
// through its transition with authorization on; Goals' one qvt render as Tomas (his goal, never a task); ReviewRelease's one
// html-print render as Tomas (the stored review, the assessment and rating, never the note). P20 review: People's Today source (the
// review steps due: Tomas's self assessment, Hannah's assessments) and Employee360's reviews (find#Reviews by person: the state and,
// once released, the result, to the person, the reviewer and development, none to a colleague). MyTeam's Reviews due box is checked
// on PeopleSelfService's render of MyTeam. The rules are Mantle's Reviews; access is PeopleAccess's.
// Run: ./moq test mr-boss --spec PeopleReviews
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const webroot = "component://webroot/screen/webroot.xml"
const R = "mantle.humanres.ReviewServices."
const NOTE = "Tomas covered three late shifts unasked"
const state = {}

// a screen transition as the client posts it, as the user with artifact authorization on
function post(user, path, parameters) {
    return asUser(user, () => {
        const result = ec.screen
            .makeTest()
            .rootScreen(webroot)
            .render(path, parameters || {}, "post")
        return {status: result.status, errors: Array.from(result.errorMessages || []).join(" | ")}
    })
}

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        // Retail's published review form and a template naming it for the reviewer's assessment, built by the review administrator
        asUser(users.develop, () => {
            const F = "mantle.party.FormDefinitionServices."
            state.formId = system(() =>
                invoke(F + "create#Form", {
                    purposeEnumId: "DbfpReview",
                    organizationPartyId: ids.organizationId,
                    description: "Spec store review"
                })
            ).formId
            system(() =>
                invoke(F + "save#FormField", {
                    formId: state.formId,
                    newFieldName: "serviceLevel",
                    title: "Customer service",
                    fieldTypeEnumId: "DBFFT_radio",
                    isRequired: "Y",
                    optionText: "1 | Growing\n2 | Strong"
                })
            )
            system(() => invoke(F + "publish#Form", {formId: state.formId}))
            state.templateId = system(() =>
                invoke(R + "store#ReviewTemplate", {
                    organizationPartyId: ids.organizationId,
                    templateName: "Spec store review",
                    selfAssessment: "Y",
                    managerFormId: state.formId
                })
            ).reviewTemplateId
            state.cycleId = system(() =>
                invoke(R + "store#Cycle", {
                    organizationPartyId: ids.organizationId,
                    departmentPartyId: ids.departmentId,
                    cycleName: "Spec store year",
                    reviewTemplateId: state.templateId,
                    periodFromDate: "2026-01-01",
                    periodThruDate: "2026-12-31",
                    selfDueDate: "2027-01-15",
                    managerDueDate: "2027-01-31"
                })
            ).reviewCycleId
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("ReviewCycles as the review administrator: the cycle, its preview and Templates; the choices", {
    when() {
        const rendered = asUser(users.develop, () => page("Performance/ReviewCycles", {previewCycleId: state.cycleId}))
        const choose = (name, selected) =>
            asUser(users.develop, () =>
                invoke("ironstone.people.ContextServices.get#Choices", {
                    appRoot: "People",
                    choice: name,
                    term: "zzz",
                    selected,
                    organizationPartyId: ids.organizationId
                })
            ).options.map(option => option.value)
        const forms = choose("reviewForms", state.formId)
        const colleagues = choose("reviewColleagues", ids.managerPartyId)
        // the reviews started, one per person of Store Operations (each on its own; Hannah reviews them)
        const started = asUser(users.develop, () => system(() => invoke(R + "start#Cycle", {reviewCycleId: state.cycleId})))
        state.reviewId = system(() =>
            ec.entity
                .find("mantle.humanres.ability.PerformanceReview")
                .condition({reviewCycleId: state.cycleId, partyId: ids.employeePartyId})
                .one()
        )?.performanceReviewId
        return {rendered, forms, colleagues, started}
    },
    then({rendered, forms, colleagues, started}) {
        rendered.status == 200 && rendered.errors.length == 0
        rendered.output.includes("Spec store year") && rendered.output.includes("Store Operations")
        rendered.output.includes("New cycle") &&
            rendered.output.includes("New template") &&
            rendered.output.includes("Annual review")
        rendered.output.includes("Who Spec store year reviews") && rendered.output.includes("Tomas Lindqvist")
        rendered.output.includes("Hannah Okafor") && rendered.output.includes("Start reviews")
        forms == [state.formId] && colleagues.includes(ids.managerPartyId)
        started.startedCount >= 3 && !!state.reviewId
    }
})

feature(
    "Reviews as Tomas: his self assessment to do; ReviewDetail as Hannah: his assessment read, hers to give over the form, her note, behind the AI opt-out",
    {
        when() {
            // People's Today source: the review steps due, before Tomas submits
            const today = user =>
                asUser(user, () => system(() => invoke("ironstone.people.ContextServices.get#TodayItems", {})))
                    .items.filter(item => item.kind == "review")
                    .map(item => item.title)
            const todayTomas = today(users.employee)
            const todayHannah = today(users.manager)
            const reviews = asUser(users.employee, () => page("Performance/Reviews", {}))
            asUser(users.employee, () =>
                system(() =>
                    invoke(R + "store#Assessment", {performanceReviewId: state.reviewId, summary: "I trained two new starters"})
                )
            )
            asUser(users.manager, () =>
                system(() => invoke(R + "store#ReviewNote", {performanceReviewId: state.reviewId, noteText: NOTE}))
            )
            const detail = asUser(users.manager, () => page("Performance/ReviewDetail", {performanceReviewId: state.reviewId}))
            const agent = asUser(users.manager, () => {
                const out = ec.screen
                    .makeTest()
                    .rootScreen("component://mr-boss/screen/People.xml")
                    .renderMode("tui")
                    .agent()
                    .render("Performance/ReviewDetail", {performanceReviewId: state.reviewId, lastStandalone: "-2"}, null)
                ec.message.clearErrors()
                return {status: out.status, output: String(out.output || "")}
            })
            const posted = post(users.manager, "apps/People/Performance/ReviewDetail/assess", {
                performanceReviewId: state.reviewId,
                serviceLevel: "2",
                ratingEnumId: "PrfRtFulfill",
                summary: "Steady and kind with customers"
            })
            const step = system(() =>
                ec.entity
                    .find("mantle.humanres.ability.PerformanceReviewStep")
                    .condition({performanceReviewId: state.reviewId, stepKindEnumId: "RskManager"})
                    .one()
            )
            return {reviews, detail, agent, posted, step, todayTomas, todayHannah}
        },
        then({reviews, detail, agent, posted, step, todayTomas, todayHannah}) {
            todayTomas == ["Your self assessment for Spec store year, due 2027-01-15"]
            todayHannah.includes("Assess Tomas Lindqvist · Spec store year, due 2027-01-15")
            reviews.status == 200 && reviews.errors.length == 0
            reviews.output.includes("Spec store year") && reviews.output.includes("Your self assessment")
            detail.status == 200 && detail.errors.length == 0
            detail.output.includes("Review of Tomas Lindqvist") && detail.output.includes("I trained two new starters")
            detail.output.includes("Your assessment of Tomas Lindqvist") && detail.output.includes("Customer service")
            detail.output.includes("Overall rating") &&
                detail.output.includes("Your private notes") &&
                detail.output.includes(NOTE)
            detail.output.includes('data-ai-opt-out="section"')
            agent.status == 200 && !agent.output.includes(NOTE) && !agent.output.includes("I trained two new starters")
            agent.output.includes("Not shared with AI") || !agent.output.includes("Your private notes")
            posted.status == 302 && posted.errors == ""
            step.statusEnumId == "RssSubmitted" && step.ratingEnumId == "PrfRtFulfill" && !!step.formResponseId
        }
    }
)

feature("Goals as Tomas: his goal, never a task; ReviewRelease as Tomas: the review as released, never the note", {
    when() {
        asUser(users.employee, () =>
            system(() =>
                invoke(R + "store#Goal", {
                    title: "Spec goal: run a till audit",
                    measureText: "Audits run",
                    targetValue: "4",
                    unitText: "audits",
                    performanceReviewId: state.reviewId
                })
            )
        )
        const goals = asUser(users.employee, () => page("Performance/Goals", {}))
        asUser(users.manager, () => {
            system(() => invoke(R + "change#ReviewState", {performanceReviewId: state.reviewId, action: "finalize"}))
            system(() => invoke(R + "change#ReviewState", {performanceReviewId: state.reviewId, action: "release"}))
        })
        const release = asUser(users.employee, () =>
            page("Performance/ReviewRelease", {performanceReviewId: state.reviewId}, "html-print")
        )
        // Employee360's reviews: Tomas's reviews as each reads them, the state and the released result
        const byPerson = user =>
            asUser(user, () => system(() => invoke(R + "find#Reviews", {partyId: ids.employeePartyId}))).reviews.filter(
                row => row.performanceReviewId == state.reviewId
            )
        const person = {own: byPerson(users.employee), reviewer: byPerson(users.manager), hr: byPerson(users.hr)}
        return {goals, release, person}
    },
    then({goals, release, person}) {
        person.own.length == 1 && person.own[0].resultText == "Fulfills expectations" && person.own[0].statusText == "Released"
        person.reviewer.length == 1 && person.reviewer[0].resultText == "Fulfills expectations"
        // the HR officer (no development reading) reads none of them
        person.hr.length == 0
        goals.status == 200 && goals.errors.length == 0
        goals.output.includes("Spec goal: run a till audit") &&
            goals.output.includes("0 of 4 audits") &&
            goals.output.includes("Add goal")
        release.status == 200 && release.errors.length == 0
        release.output.includes("Review of") && release.output.includes("Tomas Lindqvist")
        release.output.includes("Steady and kind with customers") && release.output.includes("Fulfills expectations")
        !release.output.includes(NOTE)
    }
})
