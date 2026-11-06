// Customer Service's demo feedback (impl-customer-service P13; DemoServices.load#FeedbackDemo, run from
// BossZZCustomerServiceFeedbackDemoData.xml after Accounting's portal demo, whose ZIZI_PORTAL site now mounts the Support
// app for ORG_ZIZI_RETAIL): Retail's feedback form (the default rating 1 to 5 with a reason, comment and consent; Mantle's
// create#FeedbackForm and publish#FeedbackForm), its delivery policy (an hour after resolving, once per case, a reminder
// after three days, a score of 2 or less followed up by the Support team), and one answered invitation: Joe Q Public's
// damaged-filter case, resolved, invited and rated 4 through the Feedback page's operation. Each step on its own (one that
// fails is named and the others are made); idempotent by the form's name and the case's name.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const {find, one, rows, call} = lib

const organizationPartyId = "ORG_ZIZI_RETAIL"
const formName = "Retail case feedback"
const caseName = "Replacement filter arrived damaged"
const F = "mantle.request.CaseFeedbackServices."
const S = "mantle.request.SupportCaseServices."

function asDemoAdministrator(operation) {
    if (ec.user.userId && !lib.access.systemAdmin()) throw new Error("Demo loading requires system administration")
    const loggedIn = !!ec.user.username
    if (!loggedIn) ec.user.internalLoginUser("john.doe")
    const authzDisabled = ec.artifactExecution.disableAuthz()
    try {
        return operation()
    } finally {
        if (!authzDisabled) ec.artifactExecution.enableAuthz()
        if (!loggedIn) ec.user.logoutUser()
    }
}
const formOf = () =>
    rows("moqui.screen.form.DbForm", {purposeEnumId: "DbfpCaseFeedback", ownerPartyId: organizationPartyId}).find(
        row => row.description === formName
    ) || null
const demoCase = () =>
    rows("mantle.request.Request", {requestName: caseName}).find(
        row => !!one("mantle.request.support.CaseProfile", {requestId: row.requestId})
    ) || null
// the form, published
function ensureForm() {
    if (formOf()) return
    const formId = call(F + "create#FeedbackForm", {
        organizationPartyId,
        description: formName,
        comments: "Asked an hour after a case is resolved"
    }).formId
    call(F + "publish#FeedbackForm", {formId})
}
// the delivery policy, once
function ensurePolicy() {
    const form = formOf()
    if (!form) throw new Error("Retail's feedback form is not made")
    const feedback = ec.resource.script("component://mr-mantle/service/mantle/request/CaseFeedback.js")
    if (feedback.policyAt(organizationPartyId)) return
    call(F + "save#InvitationPolicy", {
        organizationPartyId,
        formId: form.formId,
        delayMinutes: 60,
        frequencyEnumId: "FdfPerCase",
        tokenDays: 14,
        reminderCount: 1,
        reminderDays: 3,
        lowScoreThreshold: 2,
        followUpTeamPartyId: "BOSS_CS_TEAM_SUPPORT",
        followUpDays: 2,
        changeReason: "Demo"
    })
}
// Joe Q Public's damaged-filter case, made and resolved
function ensureCase() {
    if (demoCase()) return
    const requestId = call(S + "create#Case", {
        organizationPartyId,
        customerPartyId: "CustJqp",
        requestCategoryId: "BOSS_CS_Q_SUPPORT",
        requestName: caseName,
        description: "The replacement filter's frame was cracked in the box."
    }).requestId
    call(S + "transition#Case", {requestId, toStatusId: "ReqCompleted", resolutionEnumId: "RrCompleted"})
}
// its invitation, answered with a 4 through the Feedback page's operation on ZIZI_PORTAL
function ensureAnswer() {
    const request = demoCase()
    if (!request) throw new Error("The demo case is not made")
    const made = call(F + "create#Invitation", {requestId: request.requestId})
    const invitationId = made.invitationId
    if (!invitationId) throw new Error("No invitation: " + made.reason)
    if (one("mantle.party.FormInvitation", {invitationId})?.formResponseId) return
    const link = ec.resource
        .script("component://mr-mantle/service/mantle/party/ExternalAccess.js")
        .create({recordType: "FormInvitation", recordId: invitationId, scopes: "CaseFeedback", validDays: 14})
    ec.resource.script("component://mr-mantle/service/mantle/request/CaseFeedback.js").execute("submitCaseFeedback", {
        siteId: "ZIZI_PORTAL",
        token: link.token,
        values: {rating: "4", reason: "solved", comment: "The new filter came the next day. Thanks."}
    })
}

const steps = {form: ensureForm, policy: ensurePolicy, case: ensureCase, answer: ensureAnswer}
function load() {
    const errors = []
    for (const name of Object.keys(steps)) {
        try {
            lib.probe("ironstone.customerservice.DemoServices.run#FeedbackDemoStep", {step: name})
        } catch (error) {
            ec.logger.error("Customer Service demo feedback " + name + " was not made: " + error.message)
            errors.push(name + ": " + error.message)
        }
    }
    return {complete: errors.length === 0, errors}
}
function runStep(p) {
    const step = steps[String(p.step || "")]
    if (!step) throw new Error("Unknown feedback demo step " + p.step)
    return step()
}
const operations = {load, runStep}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Customer Service feedback demonstration operation " + op)
        if (op !== "load") return asDemoAdministrator(() => operations[op](parameters || {}))
        // load logs in no one: a login or logout inside the data file's transaction holds john.doe's UserAccount row until
        // the file commits, and each step's own login (a new transaction) would wait on it until its deadline
        if (ec.user.userId && !lib.access.systemAdmin()) throw new Error("Demo loading requires system administration")
        return operations.load()
    }
})
