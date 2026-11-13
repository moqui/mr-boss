// People P20's "usable when" (impl-people P20; design-people §11 ReviewCycles, Reviews, ReviewDetail and Goals, §15 the review
// release, §14.3 "Qualifications and reviews", its second half), as an acceptance walk with artifact authorization on, through the
// screens' transitions: the review administrator (people.develop) adds a review template that asks for approval and starts a cycle
// for Store Operations (Tomas, Ines and Rafael, reviewed by Hannah) from Review cycles; Tomas (people.employee) opens Reviews by the
// area's own grant and submits his self assessment; Hannah (people.manager) keeps a private note, assesses Tomas with a rating and
// finalizes; the HR officer (people.hr) approves it on ReviewDetail; Hannah releases it; Tomas reads the released review, prints it
// and acknowledges it with a comment, and agrees a goal from it. Hannah's private note appears in none of what Tomas reads (the
// detail, the release, its print), in no export (Reviews' CSV), in no Chatter (the review's panel, Tomas's own timeline), in no
// notice and in no search, nor in an agent's render of the detail. The rules themselves are Mantle's Reviews and mr-boss's
// PeopleReviews.
// Run: ./moq accept mr-boss --spec PeopleReviewsUsable
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const webroot = "component://webroot/screen/webroot.xml"
const cyclesPath = "apps/People/Performance/ReviewCycles/"
const detailPath = "apps/People/Performance/ReviewDetail/"
const goalsPath = "apps/People/Performance/Goals/"
const R = "mantle.humanres.ReviewServices."
const REVIEW = "mantle.humanres.ability.PerformanceReview"
const NOTE = "Tomas mentioned a family move next spring"
// a request under the web root as the user (a transition's post), its status and errors
function request(user, path, parameters) {
    return asUser(user, () => {
        const result = ec.screen
            .makeTest()
            .rootScreen(webroot)
            .render(path, parameters || {}, "post")
        const errors = Array.from(result.errorMessages || []).join(" | ")
        ec.message.clearAll()
        return {status: result.status, errors}
    })
}
const read = (user, service, parameters) => asUser(user, () => system(() => invoke(service, parameters)))
const state = {}
// Store Operations' members in the demo data: Tomas, Ines and Rafael
const demoMembers = [ids.employeePartyId, ids.reportPartyId, "BOSS_PPL_RAFAEL"]

spec({stepwise: true})

feature("the review administrator adds a template asking for approval and starts a cycle for Store Operations", {
    when() {
        const template = request(users.develop, cyclesPath + "storeTemplate", {
            organizationPartyId: ids.organizationId,
            templateName: "Store year-end review",
            selfAssessment: "Y",
            feedbackAllowed: "Y",
            approvalRequired: "Y"
        })
        const templates = read(users.develop, R + "find#Cycles", {}).templates
        state.templateId = templates.find(row => row.templateName === "Store year-end review")?.reviewTemplateId
        const cycle = request(users.develop, cyclesPath + "storeCycle", {
            organizationPartyId: ids.organizationId,
            departmentPartyId: ids.departmentId,
            cycleName: "Store Operations 2026",
            reviewTemplateId: state.templateId,
            periodFromDate: "2026-01-01",
            periodThruDate: "2026-12-31",
            selfDueDate: "2027-01-15",
            managerDueDate: "2027-01-31"
        })
        const cycles = read(users.develop, R + "find#Cycles", {}).cycles
        const found = cycles.find(row => row.cycleName === "Store Operations 2026")
        state.cycleId = found?.reviewCycleId
        const preview = asUser(users.develop, () => page("Performance/ReviewCycles", {previewCycleId: state.cycleId}))
        const started = request(users.develop, cyclesPath + "startCycle", {
            reviewCycleId: state.cycleId,
            expectedRevision: found?.revision
        })
        state.reviewId = system(() =>
            ec.entity.find(REVIEW).condition({reviewCycleId: state.cycleId, partyId: ids.employeePartyId}).one()
        )?.performanceReviewId
        const reviews = system(() => Array.from(ec.entity.find(REVIEW).condition({reviewCycleId: state.cycleId}).list()))
        return {template, cycle, preview, started, reviews}
    },
    then({template, cycle, preview, started, reviews}) {
        template.status == 302 && template.errors == "" && state.templateId
        cycle.status == 302 && cycle.errors == "" && state.cycleId
        preview.status == 200 && preview.output.includes("Tomas Lindqvist") && preview.output.includes("Hannah Okafor")
        started.status == 302 && started.errors == ""
        // the demo's Store Operations, each reviewed by Hannah (in a whole run the hire, offer and lifecycle walks have hired more
        // into the department, each with a review of their own)
        state.reviewId
        demoMembers.every(partyId => reviews.some(row => row.partyId == partyId && row.managerPartyId == ids.managerPartyId))
    }
})

feature("Tomas submits his self assessment from his reviews; Hannah keeps a private note, assesses him and finalizes", {
    when() {
        const todo = asUser(users.employee, () => page("Performance/Reviews", {}))
        const self = request(users.employee, detailPath + "assess", {
            performanceReviewId: state.reviewId,
            summary: "I opened the store alone on Sundays and trained Rafael"
        })
        const note = request(users.manager, detailPath + "storeNote", {performanceReviewId: state.reviewId, noteText: NOTE})
        const managerDetail = asUser(users.manager, () => page("Performance/ReviewDetail", {performanceReviewId: state.reviewId}))
        const assessed = request(users.manager, detailPath + "assess", {
            performanceReviewId: state.reviewId,
            summary: "Reliable and calm; ready to lead a shift",
            ratingEnumId: "PrfRtFreqExceed"
        })
        const revision = read(users.manager, R + "get#Review", {performanceReviewId: state.reviewId}).review.revision
        const finalized = request(users.manager, detailPath + "changeState", {
            performanceReviewId: state.reviewId,
            action: "finalize",
            expectedRevision: revision
        })
        const review = read(users.manager, R + "get#Review", {performanceReviewId: state.reviewId}).review
        return {todo, self, note, managerDetail, assessed, finalized, review}
    },
    then({todo, self, note, managerDetail, assessed, finalized, review}) {
        todo.status == 200 && todo.output.includes("Store Operations 2026") && todo.output.includes("Your self assessment")
        self.status == 302 && self.errors == "" && note.status == 302 && note.errors == ""
        managerDetail.output.includes("I opened the store alone on Sundays") && managerDetail.output.includes(NOTE)
        assessed.status == 302 && assessed.errors == "" && finalized.status == 302 && finalized.errors == ""
        review.statusEnumId == "PrvApproval"
    }
})

feature("the HR officer approves it; Hannah releases it; Tomas reads and prints it, acknowledges it and agrees a goal from it", {
    when() {
        const hrDetail = asUser(users.hr, () => page("Performance/ReviewDetail", {performanceReviewId: state.reviewId}))
        const approval = read(users.hr, R + "get#Review", {performanceReviewId: state.reviewId}).approval
        const approved = request(users.hr, detailPath + "changeState", {
            performanceReviewId: state.reviewId,
            action: "approve",
            peopleApprovalId: approval?.peopleApprovalId,
            sourceRevision: approval?.sourceRevision
        })
        const revision = read(users.manager, R + "get#Review", {performanceReviewId: state.reviewId}).review.revision
        const released = request(users.manager, detailPath + "changeState", {
            performanceReviewId: state.reviewId,
            action: "release",
            expectedRevision: revision
        })
        const tomasDetail = asUser(users.employee, () => page("Performance/ReviewDetail", {performanceReviewId: state.reviewId}))
        const print = asUser(users.employee, () =>
            page("Performance/ReviewRelease", {performanceReviewId: state.reviewId}, "html-print")
        )
        const tomasRevision = read(users.employee, R + "get#Review", {performanceReviewId: state.reviewId}).review.revision
        const acknowledged = request(users.employee, detailPath + "changeState", {
            performanceReviewId: state.reviewId,
            action: "acknowledge",
            comment: "Thank you; I would like to lead the Sunday shift",
            expectedRevision: tomasRevision
        })
        const goal = request(users.employee, goalsPath + "storeGoal", {
            goalReviewId: state.reviewId,
            title: "Lead the Sunday shift",
            measureText: "Sundays led",
            targetValue: "10",
            unitText: "Sundays"
        })
        const goals = read(users.employee, R + "find#Goals", {performanceReviewId: state.reviewId}).goals
        const review = read(users.employee, R + "get#Review", {performanceReviewId: state.reviewId}).review
        return {hrDetail, approved, released, tomasDetail, print, acknowledged, goal, goals, review}
    },
    then({hrDetail, approved, released, tomasDetail, print, acknowledged, goal, goals, review}) {
        hrDetail.status == 200 && hrDetail.output.includes("Reliable and calm") && !hrDetail.output.includes(NOTE)
        approved.status == 302 && approved.errors == "" && released.status == 302 && released.errors == ""
        tomasDetail.output.includes("Reliable and calm; ready to lead a shift") &&
            tomasDetail.output.includes("Frequently exceeds")
        !tomasDetail.output.includes(NOTE)
        print.status == 200 && print.output.includes("Reliable and calm") && !print.output.includes(NOTE)
        acknowledged.status == 302 && acknowledged.errors == "" && review.statusEnumId == "PrvAcknowledged"
        goal.status == 302 && goal.errors == "" && goals.some(row => row.title == "Lead the Sunday shift")
    }
})

feature("Hannah's private note is in no export, Chatter, notice or search, nor in an agent's render", {
    when() {
        const csv = asUser(users.manager, () => page("Performance/Reviews", {show: "team"}, "csv"))
        const chatter = asUser(users.employee, () => page("Chatter", {recordEntity: REVIEW, recordId: state.reviewId}, "html"))
        const timeline = asUser(users.employee, () =>
            system(() =>
                invoke("mantle.party.CommunicationServices.find#PartyCommunicationEvents", {partyId: ids.employeePartyId})
            )
        )
        const notices = system(() =>
            Array.from(
                ec.entity
                    .find("moqui.security.user.NotificationMessage")
                    .condition("topic", "in", ["PeopleReviewUpdate", "PeopleReviewStep"])
                    .condition("recordId", state.reviewId)
                    .list()
            ).map(row => String(row.messageJson || "") + " " + String(row.titleText || ""))
        )
        const search = [users.manager, users.employee, users.hr].map(
            // the note's words as a phrase (lexical search otherwise matches either word alone, in any of the demo's records)
            user => read(user, "mantle.search.UniversalSearchServices.search#Universal", {q: '"family move"'}).results || []
        )
        const agent = asUser(users.manager, () =>
            ec.screen
                .makeTest()
                .rootScreen("component://mr-boss/screen/People.xml")
                .agent()
                .renderMode("tui")
                .render("Performance/ReviewDetail", {performanceReviewId: state.reviewId, lastStandalone: "-2"}, null)
        )
        return {
            csv: csv.output,
            chatter: chatter.output,
            timeline: JSON.stringify(timeline),
            notices: notices.join(" | "),
            searchHits: search.flat().length,
            agentOutput: String(agent.output || "")
        }
    },
    then({csv, chatter, timeline, notices, searchHits, agentOutput}) {
        !csv.includes(NOTE) && !chatter.includes(NOTE) && !timeline.includes(NOTE)
        notices.length > 0 && !notices.includes(NOTE)
        searchHits == 0
        !agentOutput.includes(NOTE)
    }
})
