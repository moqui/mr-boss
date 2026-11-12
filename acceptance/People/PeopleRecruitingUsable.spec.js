// People P16's "usable when" (impl-people P16; design-people §5 Openings, ApplicantPipeline, ApplicantDetail, §13 Forms and
// InterviewsCalendar), as an acceptance walk through the screens' transitions with artifact authorization on: people.admin builds
// an interview scorecard under People's Forms (the survey builder with People's registration) while Customer Service's feedback
// forms work as before; the recruiter opens Retail's vacant approved seat with a mail tag and the scorecard, an application
// arrives by mail with its resume (the createApplication rule action of the recruiter's rule), the recruiter schedules a video
// interview with two panel members (Hannah, people.manager, and Ines, given a People account here), and each submits their own
// scorecard, reading neither the other's scorecard nor another candidate. The rules are Mantle's Recruiting and FormDefinitions
// and mr-boss's PeopleRecruiting.
// Run: ./moq accept mr-boss --spec PeopleRecruitingUsable
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const csUsers = ec.resource.script("component://mr-boss/test/CustomerService/CustomerServiceSpecLib.js").users
const R = "mantle.humanres.RecruitingServices."
const webroot = "component://webroot/screen/webroot.xml"
const inesUser = "people.spec.ines"
const state = {}
// a transition's post under the web root as the user
function post(user, path, parameters) {
    return asUser(user, () => {
        const result = ec.screen
            .makeTest()
            .rootScreen(webroot)
            .render("apps/People/" + path, parameters || {}, "post")
        const errors = Array.from(result.errorMessages || []).join(" | ")
        ec.message.clearAll()
        return {status: result.status, errors}
    })
}
const read = (user, service, parameters) => asUser(user, () => system(() => invoke(service, parameters)))

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        // Ines, a Retail employee, gets a People account to interview with (the demo gives her none)
        system(() => {
            if (!ec.entity.find("moqui.security.UserAccount").condition("userId", "PPL_SPEC_INES").one()) {
                invoke("create#moqui.security.UserAccount", {
                    userId: "PPL_SPEC_INES",
                    username: inesUser,
                    partyId: "BOSS_PPL_INES",
                    currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
                    passwordHashType: "SHA"
                })
                for (const userGroupId of ["BOSS_USERS", "BOSS_PEOPLE", "BOSS_PEOPLE_SELF"])
                    invoke("create#moqui.security.UserGroupMember", {
                        userId: "PPL_SPEC_INES",
                        userGroupId,
                        fromDate: ec.user.nowTimestamp
                    })
            }
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("people.admin builds a scorecard under People's Forms; Customer Service's feedback forms work as before", {
    when() {
        const created = post(users.admin, "Settings/Forms/createForm", {
            purposeEnumId: "DbfpInterviewScorecard",
            organizationPartyId: ids.organizationId,
            description: "Store interview scorecard"
        })
        state.formId = system(
            () =>
                Array.from(
                    ec.entity
                        .find("moqui.screen.form.DbForm")
                        .condition({description: "Store interview scorecard", ownerPartyId: ids.organizationId})
                        .list()
                )[0]?.formId
        )
        const fields = [
            post(users.admin, "Settings/FormDetail/saveField", {
                formId: state.formId,
                title: "Overall recommendation",
                fieldTypeEnumId: "DBFFT_radio",
                isRequired: "Y",
                optionText: "1 | No hire\n2 | Lean no\n3 | Lean yes\n4 | Hire"
            }),
            post(users.admin, "Settings/FormDetail/saveField", {
                formId: state.formId,
                title: "Evidence",
                fieldTypeEnumId: "DBFFT_text-area"
            })
        ]
        const published = post(users.admin, "Settings/FormDetail/publishForm", {formId: state.formId})
        const detail = asUser(users.admin, () => page("Settings/FormDetail", {formId: state.formId}))
        const feedback = asUser(csUsers.admin, () => page("Settings/FeedbackForms", {}, "qvt", "CustomerService"))
        return {created, fields, published, detail, feedback}
    },
    then({created, fields, published, detail, feedback}) {
        created.errors == ""
        state.formId != null
        fields.every(field => field.errors == "")
        published.errors == ""
        detail.output.includes("Overall recommendation")
        detail.output.includes("Preview: what the respondent answers")
        feedback.errors.length == 0
        feedback.output.includes("Feedback forms")
        feedback.output.includes("Retail case feedback")
        !feedback.output.includes("Store interview scorecard")
    }
})

feature("the recruiter opens a seat; an application arrives by mail with its resume", {
    when() {
        const opened = post(users.recruiter, "Staffing/Openings/storeOpening", {
            organizationPartyId: ids.organizationId,
            title: "Sales associate (spring)",
            emplPositionIds: ids.openingSeatId,
            intakePlusTag: "spring-associate",
            scorecardFormId: state.formId,
            action: "open"
        })
        state.openingId = read(users.recruiter, R + "find#Openings", {term: "Sales associate (spring)"}).openings[0]?.jobOpeningId
        const resume = "dbresource://spec/recruiting-usable/resume.txt"
        const received = system(() => {
            ec.resource.getLocationReference(resume).putText("Lena Mailer: four years on a shop floor")
            const emailMessageId = invoke("create#moqui.basic.email.EmailMessage", {
                statusId: "ES_RECEIVED",
                subject: "Applying for the spring sales associate role",
                fromAddress: "lena.mailer@example.test",
                fromName: "Lena Mailer",
                toAddresses: "jobs+spring-associate@example.test",
                receivedDate: ec.user.nowTimestamp
            }).emailMessageId
            invoke("create#moqui.basic.email.EmailMessageAttachment", {
                emailMessageId,
                fileName: "resume.txt",
                attachmentLocation: resume,
                isInline: "N"
            })
            return invoke(R + "create#ApplicationFromEmail", {emailMessageId, ruleOwnerUserId: "BOSS_PPL_RECRUITER"})
        })
        state.applicationId = received.employmentApplicationId
        const board = asUser(users.recruiter, () => page("Staffing/ApplicantPipeline", {jobOpeningId: state.openingId}))
        return {opened, received, board}
    },
    then({opened, received, board}) {
        opened.errors == ""
        state.openingId != null
        received.created == true
        board.output.includes("Lena Mailer")
        system(() =>
            ec.entity
                .find("mantle.humanres.employment.EmploymentApplicationContent")
                .condition("employmentApplicationId", state.applicationId)
                .count()
        ) == 1
    }
})

feature("a video interview with two panel members, who each score it without seeing the other's or another opening's candidate", {
    when() {
        const day = ec.l10n.format(new Date(Date.now() + 3 * 86400000), "yyyy-MM-dd")
        const scheduled = post(users.recruiter, "Staffing/ApplicantDetail/scheduleInterview", {
            employmentApplicationId: state.applicationId,
            startDate: day + " 10:00",
            durationMinutes: "45",
            panelPartyIds: [ids.managerPartyId, ids.reportPartyId].join(","),
            videoCall: "Y",
            inviteCandidate: "Y"
        })
        const cardOf = user =>
            read(user, R + "get#Application", {employmentApplicationId: state.applicationId}).application.myScorecards[0]
        const hannahCard = cardOf(users.manager)
        const inesCard = cardOf(inesUser)
        const hannah = post(users.manager, "Staffing/ApplicantDetail/submitScorecard", {
            employmentApplicationId: state.applicationId,
            invitationId: hannahCard.invitationId,
            overallRecommendation: "4",
            evidence: "Calm with a difficult customer"
        })
        const ines = post(inesUser, "Staffing/ApplicantDetail/submitScorecard", {
            employmentApplicationId: state.applicationId,
            invitationId: inesCard.invitationId,
            overallRecommendation: "3",
            evidence: "Knows the stock system"
        })
        const inesView = read(inesUser, R + "get#Application", {employmentApplicationId: state.applicationId}).application
        const recruiterView = read(users.recruiter, R + "get#Application", {
            employmentApplicationId: state.applicationId
        }).application
        // another opening's candidate stays the recruiter's alone
        const other = read(users.recruiter, R + "create#Application", {
            jobOpeningId: state.openingId,
            firstName: "Other",
            lastName: "Candidate"
        })
        const otherPage = asUser(inesUser, () =>
            page("Staffing/ApplicantDetail", {employmentApplicationId: other.employmentApplicationId})
        )
        const event = system(() =>
            ec.entity
                .find("mantle.humanres.recruitment.ApplicationInterview")
                .condition("employmentApplicationId", state.applicationId)
                .one()
        )
        return {scheduled, hannah, ines, inesView, recruiterView, otherPage, event}
    },
    then({scheduled, hannah, ines, inesView, recruiterView, otherPage, event}) {
        scheduled.errors == ""
        event.callLinkId != null
        hannah.errors == ""
        ines.errors == ""
        inesView.interviews[0].scorecards.length == 1
        !JSON.stringify(inesView).includes("Calm with a difficult customer")
        recruiterView.interviews[0].scorecards.length == 2
        recruiterView.stageText == "Interview"
        otherPage.output.includes("not available")
    }
})
