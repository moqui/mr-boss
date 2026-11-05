// The paths around a case (impl-customer-service P2, CX-REQUEST, F8, F64): Projects' triage, bulk and edit, Commons' status
// and edit, raise#Request and the client's cancel change a request's status, due date or resolution; on a support case
// (a CaseProfile) these are Customer Service's. A resolve, cancel or reopen is routed through Mantle's transition#Case for a
// user holding SUPPORT_CASE_EDIT (its workflow, resolution and reason rules apply) and refused for anyone else, naming the
// case (CASE_IN_CUSTOMER_SERVICE); a due date is refused (CASE_DUE_DATE: SlaServices' from P4). A request that is not a
// case is left as it was. Mantle's update#Request refuses the same on every other path (CASE_MANAGED).
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")

const isCase = requestId =>
    !!requestId &&
    ec.entity.find("mantle.request.support.CaseProfile").condition("requestId", requestId).disableAuthz().count() > 0
// Whether a request with these fields would be a case once made (raise#Request's due date).
const wouldBeCase = fields => !!lib.call("mantle.request.SupportCaseServices.get#CaseState", fields).wouldBeCase
const caseText = requestId => "Request " + requestId + " is a support case"

// A resolve, cancel or reopen of a case: through transition#Case, or refused; null for a request that is not a case.
function resolve(requestId, toStatusId, resolutionEnumId, reason) {
    if (!isCase(requestId)) return null
    if (!ec.user.hasPermission("SUPPORT_CASE_EDIT"))
        lib.denied(
            "CASE_IN_CUSTOMER_SERVICE",
            caseText(requestId) + ": it is resolved, cancelled or reopened in Customer Service"
        )
    const out = ec.service
        .sync()
        .name("mantle.request.SupportCaseServices.transition#Case")
        .parameters({
            requestId,
            toStatusId,
            resolutionEnumId:
                toStatusId === "ReqCompleted" || toStatusId === "ReqCancelled"
                    ? resolutionEnumId || (toStatusId === "ReqCancelled" ? "RrRejected" : "RrCompleted")
                    : null,
            reason: reason || null
        })
        .call()
    if (ec.message.hasError()) return {message: null}
    return {message: "Case " + requestId + ": " + (out?.statusLabel || toStatusId)}
}
// A due date on a case is refused (SlaServices writes it, P4).
function refuseDue(requestId) {
    if (isCase(requestId)) lib.denied("CASE_DUE_DATE", caseText(requestId) + ": its due date comes from its service level")
}
;({isCase, wouldBeCase, resolve, refuseDue})
