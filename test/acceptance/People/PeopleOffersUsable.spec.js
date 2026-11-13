// People P17's "usable when" (impl-people P17; design-people §5 OfferDetail, §4 HireEmployee, §15 the offer letter), as an
// acceptance walk through the screens' transitions with artifact authorization on: the recruiter drafts an offer of an interviewed
// applicant from ApplicantDetail, payroll sets its pay on OfferDetail, the recruiter submits it and cannot approve it, the HR officer
// approves it, the recruiter issues it (its letter stored, the one with pay payroll's to read) and records the candidate's
// acceptance, and the HR officer hires from it through the hire wizard (Start from the offer, then Hire); a second hire from the
// same offer is refused, and the hire made no account; the offer's approved pay is its first salary (P23 review). The offer is on a spec-local approved seat of Retail's
// Store Operations, so Retail's vacant seat stays the other walks'. The rules are Mantle's Offers and mr-boss's PeopleOffers.
// Run: ./moq accept mr-boss --spec PeopleOffersUsable
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, refusal} = lib
const R = "mantle.humanres.RecruitingServices."
const P = "mantle.humanres.PeopleServices."
const webroot = "component://webroot/screen/webroot.xml"
const seatId = "BOSS_PPL_SPEC_OFFER_SEAT"
const state = {}
const day = days => ec.l10n.format(new Date(Date.now() + days * 24 * 60 * 60 * 1000), "yyyy-MM-dd")
const code = message => /[A-Z][A-Z0-9_]{3,}(?=:)/.exec(message)?.[0] || message || "accepted"
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
const offerRow = () =>
    system(() =>
        ec.entity.find("mantle.humanres.recruitment.EmploymentOffer").condition("employmentOfferId", state.offerId).one()
    )

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        // an approved, vacant seat of Retail's Store Operations for the offer, and an interviewed application to an opening of it
        system(() => {
            if (!ec.entity.find("mantle.humanres.position.EmplPosition").condition("emplPositionId", seatId).one())
                invoke("create#mantle.humanres.position.EmplPosition", {
                    emplPositionId: seatId,
                    organizationPartyId: ids.organizationId,
                    departmentPartyId: ids.departmentId,
                    emplPositionClassId: ids.jobClassId,
                    statusId: "EmpsActive",
                    description: "Sales associate (offer walk)",
                    fromDate: "2020-01-01 00:00:00"
                })
        })
        const made = read(users.recruiter, R + "store#Opening", {
            organizationPartyId: ids.organizationId,
            title: "Store associate (offer walk)",
            emplPositionIds: seatId,
            action: "open"
        })
        const application = read(users.recruiter, R + "create#Application", {
            jobOpeningId: made.jobOpeningId,
            firstName: "Maya",
            lastName: "Offerwalk",
            emailAddress: "maya.offerwalk@example.test"
        })
        state.applicationId = application.employmentApplicationId
        state.applicantPartyId = application.applicantPartyId
        system(() => {
            for (const statusId of ["EaScreening", "EaInterview"])
                invoke("update#mantle.humanres.employment.EmploymentApplication", {
                    employmentApplicationId: application.employmentApplicationId,
                    statusId
                })
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "the recruiter drafts the offer from ApplicantDetail; payroll sets its pay; submitted, it waits for HR, never the recruiter",
    {
        when() {
            const created = post(users.recruiter, "Staffing/ApplicantDetail/createOffer", {
                employmentApplicationId: state.applicationId,
                emplPositionId: seatId,
                fromDate: day(30),
                expireDate: day(14),
                note: "We look forward to having you on the store team."
            })
            state.offerId = read(users.recruiter, R + "find#Offers", {
                employmentApplicationId: state.applicationId
            }).offers[0]?.employmentOfferId
            const revision = () => read(users.recruiter, R + "get#Offer", {employmentOfferId: state.offerId}).offer.revision
            const paid = post(users.payroll, "Staffing/OfferDetail/storePay", {
                employmentOfferId: state.offerId,
                revision: revision(),
                payAmount: "39500",
                currencyUomId: "USD",
                timePeriodTypeId: "PayrollYear"
            })
            const recruiterView = read(users.recruiter, R + "get#Offer", {employmentOfferId: state.offerId}).offer
            const submitted = post(users.recruiter, "Staffing/OfferDetail/changeState", {
                employmentOfferId: state.offerId,
                action: "submit",
                revision: revision()
            })
            const own = asUser(users.recruiter, () =>
                system(() => code(refusal(R + "change#OfferState", {employmentOfferId: state.offerId, action: "approve"})))
            )
            return {created, paid, recruiterView, submitted, own, offer: offerRow()}
        },
        then({created, paid, recruiterView, submitted, own, offer}) {
            created.errors == ""
            state.offerId != null
            paid.errors == ""
            recruiterView.hasPayTerms == true
            recruiterView.payAmount == null
            !JSON.stringify(recruiterView).includes("39,500")
            submitted.errors == ""
            // the recruiter decides no approval at all (PEOPLE_REQUEST_APPROVE is the managers' and HR's; P5 review), so the
            // refusal comes before the self-approval rule's
            own == "PERMISSION_DENIED"
            offer.statusId == "OfrSubmitted"
        }
    }
)

feature("HR approves; the recruiter issues it (the letter with pay is payroll's) and records the candidate's acceptance", {
    when() {
        const view = read(users.hr, R + "get#Offer", {employmentOfferId: state.offerId}).offer
        const approved = post(users.hr, "Staffing/OfferDetail/changeState", {
            employmentOfferId: state.offerId,
            action: "approve",
            sourceRevision: view.approval?.sourceRevision
        })
        const revision = () => read(users.recruiter, R + "get#Offer", {employmentOfferId: state.offerId}).offer.revision
        const issued = post(users.recruiter, "Staffing/OfferDetail/changeState", {
            employmentOfferId: state.offerId,
            action: "issue",
            revision: revision()
        })
        const recruiterLetter = asUser(users.recruiter, () =>
            system(() => code(refusal(R + "get#OfferLetter", {employmentOfferId: state.offerId})))
        )
        const payrollLetter = read(users.payroll, R + "get#OfferLetter", {employmentOfferId: state.offerId})
        const accepted = post(users.recruiter, "Staffing/OfferDetail/changeState", {
            employmentOfferId: state.offerId,
            action: "accept",
            revision: revision(),
            responseNote: "Signed and returned"
        })
        // the stored letter's text, read as the walk's own check (the letter's location is payroll's to open, not the spec's user's)
        const letterText = system(() => String(ec.resource.extractText(payrollLetter.letter.location, "people-offer-walk") || ""))
        return {view, approved, issued, recruiterLetter, payrollLetter, letterText, accepted, offer: offerRow()}
    },
    then({view, approved, issued, recruiterLetter, payrollLetter, letterText, accepted, offer}) {
        view.canDecide == true
        approved.errors == ""
        issued.errors == ""
        recruiterLetter == "PERMISSION_DENIED"
        payrollLetter.issued == true
        payrollLetter.letter.includesPay == true
        letterText.includes("39,500")
        accepted.errors == ""
        offer.statusId == "OfrAccepted"
    }
})

feature(
    "HR hires from the accepted offer through the hire wizard, once; the hire makes no account, and the offer's approved pay is the first salary",
    {
        when() {
            const started = post(users.hr, "Employees/HireEmployee/Identity/startFromOffer", {employmentOfferId: state.offerId})
            const hired = post(users.hr, "Employees/HireEmployee/ConfirmHire/hireEmployee", {reason: "From the offer walk"})
            const offer = offerRow()
            const second = asUser(users.hr, () =>
                system(() =>
                    code(refusal(P + "hire#Employee", {employmentOfferId: state.offerId, operationKey: "PPL-OFFER-WALK-SECOND"}))
                )
            )
            const restart = post(users.hr, "Employees/HireEmployee/Identity/startFromOffer", {employmentOfferId: state.offerId})
            const accounts = system(() =>
                ec.entity.find("moqui.security.UserAccount").condition("partyId", state.applicantPartyId).count()
            )
            const salaries = system(() =>
                ec.entity
                    .find("mantle.humanres.employment.EmploymentSalary")
                    .condition("partyRelationshipId", offer.partyRelationshipId || "_NA_")
                    .count()
            )
            const application = system(() =>
                ec.entity
                    .find("mantle.humanres.employment.EmploymentApplication")
                    .condition("employmentApplicationId", state.applicationId)
                    .one()
            )
            return {started, hired, offer, second, restart, accounts, salaries, application}
        },
        then({started, hired, offer, second, restart, accounts, salaries, application}) {
            started.errors == ""
            hired.errors == ""
            offer.statusId == "OfrHired"
            offer.partyRelationshipId != null
            second == "OFFER_USED"
            restart.errors.includes("accepted offer")
            accounts == 0
            // P23 review (the user's call of Nov 12, 2026): the offer's approved pay is the employment's first salary
            salaries == 1
            application.statusId == "EaHired"
        }
    }
)
