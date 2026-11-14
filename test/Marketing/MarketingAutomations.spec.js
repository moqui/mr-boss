// Marketing's automations (impl-marketing P11; design-marketing §6 AutomationDetail, EnrollmentDetail): AutomationDetail's one qvt
// render of Retail's active garden newsletter welcome for its dispatcher, with all of its checks on that render (the header, its state
// and counts, the enrollment rule, the three steps in order with the wait's zone, the simulation's due times with their offset, the
// enrollments masked for a reader without the audience permission, the approver's decision, no activation offered while it is active,
// Pause and End offered); and EnrollmentDetail's one html render of Maya's enrollment for the audience manager (named, her step
// history, Stop offered). The automation rules are Mantle's (test/marketing/Automations); the access rules MarketingAccess's. The
// welcome sequence's scenario is the acceptance MarketingAutomationScenario.
// Run: ./moq test mr-boss --spec MarketingAutomations
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const {ids, users, asUser, page} = lib

spec({})

feature(
    "AutomationDetail shows an active automation's rule, steps, simulation, masked enrollments and decision to its dispatcher",
    {
        when() {
            return {
                detail: asUser(users.dispatch, () =>
                    page("Automations/AutomationDetail", {marketingAutomationId: ids.welcomeAutomationId})
                )
            }
        },
        then({detail}) {
            detail.status == 200 && detail.errors.length == 0
            detail.output.includes("Garden newsletter welcome") && detail.output.includes("Active")
            detail.output.includes("Confirmed subscription") && detail.output.includes("topic Garden newsletter")
            detail.output.includes("1 active · 0 completed · 1 stopped")
            // the steps in order, the wait in the rule's zone
            detail.output.includes("Welcome to the garden newsletter") && detail.output.includes("Wait 3 days (America/Chicago)")
            detail.output.includes("Garden tips")
            // the dry run's due times carry their offset; nothing is sent
            detail.output.includes("A dry run from") &&
                /\d{4}-\d\d-\d\d \d\d:\d\d [+-]\d\d:\d\d America\/Chicago/.test(detail.output)
            // the dispatcher reads no audience: the participants are masked addresses
            detail.output.includes("m***@zizi-customers.example") && !detail.output.includes("Maya Lindqvist")
            // the approver's decision; an active automation offers Pause and End, not Activate
            detail.output.includes("The welcome and the tips as written")
            detail.output.includes("PauseAutomationDialog") && detail.output.includes("EndAutomationDialog")
            !detail.output.includes("ActivateAutomationDialog") && !detail.output.includes("AddStepDialog")
        }
    }
)

feature("EnrollmentDetail shows a participant's step history to the audience manager, who may stop it", {
    when() {
        return {
            enrollment: asUser(users.audience, () =>
                page("Automations/EnrollmentDetail", {automationEnrollmentId: ids.waitingEnrollmentId}, "html")
            )
        }
    },
    then({enrollment}) {
        enrollment.status == 200 && enrollment.errors.length == 0
        enrollment.output.includes("Maya") && enrollment.output.includes("Garden newsletter welcome")
        enrollment.output.includes("Handed off") && enrollment.output.includes("Waiting")
        enrollment.output.includes("Next: step 20")
        enrollment.output.includes("Stop")
    }
})
