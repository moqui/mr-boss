// People's offer screens (impl-people P17; design-people §5 OfferDetail, §4 HireEmployee, §15): OfferDetail's one qvt render as the
// recruiter of a drafted offer (the applicant, the position, Submit the one primary, the pay set by payroll and its amount absent),
// and the hire wizard's ConfirmHire one qvt render as the HR officer, its draft started from the accepted offer (the applicant, the
// seat and the offer's note that the hire consumes it once; no pay). The offer is drafted on Retail's vacant seat and is not hired
// from here, so the seat stays vacant for the other specs. The rules are Mantle's Offers; access is PeopleAccess's; the scenario is
// the acceptance PeopleOffersUsable.
// Run: ./moq test mr-boss --spec PeopleOffers
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const R = "mantle.humanres.RecruitingServices."
const P = "mantle.humanres.PeopleServices."
const state = {}
const day = days => ec.l10n.format(new Date(Date.now() + days * 24 * 60 * 60 * 1000), "yyyy-MM-dd")

spec({
    stepwise: true,
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("OfferDetail's one render (qvt): the recruiter's draft with Submit, the pay set by payroll and not shown", {
    when() {
        const drafted = asUser(users.recruiter, () =>
            system(() => {
                const opening = invoke(R + "store#Opening", {
                    organizationPartyId: ids.organizationId,
                    title: "Spec offer associate",
                    emplPositionIds: ids.openingSeatId,
                    action: "open"
                })
                const made = invoke(R + "create#Application", {
                    jobOpeningId: opening.jobOpeningId,
                    firstName: "Spec",
                    lastName: "Offeree"
                })
                // interviewed (the interview is Recruiting's)
                for (const statusId of ["EaScreening", "EaInterview"])
                    invoke("update#mantle.humanres.employment.EmploymentApplication", {
                        employmentApplicationId: made.employmentApplicationId,
                        statusId
                    })
                return invoke(R + "store#Offer", {
                    employmentApplicationId: made.employmentApplicationId,
                    emplPositionId: ids.openingSeatId,
                    fromDate: day(30),
                    expireDate: day(14),
                    note: "Welcome to the store team."
                })
            })
        )
        state.offerId = drafted.employmentOfferId
        asUser(users.payroll, () =>
            system(() =>
                invoke(R + "store#Offer", {
                    employmentOfferId: state.offerId,
                    payAmount: "41000",
                    currencyUomId: "USD",
                    timePeriodTypeId: "PayrollYear"
                })
            )
        )
        const rendered = asUser(users.recruiter, () => page("Staffing/OfferDetail", {employmentOfferId: state.offerId}))
        return {drafted, rendered}
    },
    then({drafted, rendered}) {
        drafted.statusId == "OfrDraft"
        rendered.errors.length == 0
        rendered.output.includes("Spec Offeree")
        rendered.output.includes("Submit")
        rendered.output.includes("Set by payroll")
        rendered.output.includes("Welcome to the store team.")
        rendered.output.includes("Not submitted for approval yet")
        !rendered.output.includes("41,000")
        !rendered.output.includes("41000")
    }
})

feature(
    "the hire wizard starts from the accepted offer (ConfirmHire's one render, qvt): the applicant and the seat, consumed once",
    {
        when() {
            const move = (user, action, extra = {}) =>
                asUser(user, () =>
                    system(() =>
                        invoke(R + "change#OfferState", Object.assign({employmentOfferId: state.offerId, action}, extra))
                    )
                )
            move(users.recruiter, "submit")
            const approved = move(users.hr, "approve")
            move(users.recruiter, "issue")
            const accepted = move(users.recruiter, "accept", {responseNote: "Signed"})
            return asUser(users.hr, () => {
                const terms = system(() => invoke(R + "get#Offer", {employmentOfferId: state.offerId})).offer.hireTerms
                const draft = system(() => invoke(P + "store#EmploymentDraft", {draftKind: "hire", draft: terms}))
                const rendered = page("Employees/HireEmployee/ConfirmHire", {lastStandalone: "true"})
                // the draft is HR's own: discarded so no other spec resumes it
                system(() => invoke(P + "delete#EmploymentDraft", {employmentDraftId: draft.employmentDraftId}))
                return {approved, accepted, terms, rendered}
            })
        },
        then({approved, accepted, terms, rendered}) {
            approved.statusId == "OfrApproved"
            accepted.statusId == "OfrAccepted"
            terms.emplPositionId == ids.openingSeatId
            terms.payAmount == null
            rendered.errors.length == 0
            rendered.output.includes("Spec Offeree")
            rendered.output.includes("From the accepted offer")
            rendered.output.includes("Hire")
            !rendered.output.includes("41,000")
        }
    }
)
