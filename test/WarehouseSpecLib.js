// Helpers the Warehouse specs share: the demo ids, a block run as a user with artifact authorization on or off, a call's
// refusal message, and a Warehouse page render.
const ids = {
    facilityId: "ZIRET_WH",
    eastFacilityId: "BOSS_WH_EAST",
    otherFacilityId: "BOSS_PRD_WH",
    assetId: "BOSS_WH_SER_1",
    eastAssetId: "BOSS_WH_SER_3",
    otherAssetId: "BOSS_PRD_STOCK",
    lotId: "BOSS_WH_LOT_A",
    containerId: "BOSS_WH_TOTE_E1",
    shipmentId: "BOSS_WH_SHIP_OUT",
    transferShipmentId: "BOSS_WH_SHIP_TRANSFER",
    otherShipmentId: "BOSS_WH_SHIP_OTHER",
    returnId: "BOSS_WH_RETURN",
    countId: "BOSS_WH_COUNT"
}

// Run action as username, with artifact authorization enabled or not, then sign in again as the user before.
function asUser(username, action, enabled = true) {
    const previousUsername = ec.user.username || "john.doe"
    login(username)
    const disabled = ec.artifactExecution.authzDisabled()
    try {
        if (enabled) ec.artifactExecution.enableAuthz()
        else ec.artifactExecution.disableAuthz()
        return action()
    } finally {
        ec.message.clearErrors()
        if (disabled) ec.artifactExecution.disableAuthz()
        else ec.artifactExecution.enableAuthz()
        login(previousUsername)
    }
}

// The message a call is refused with, or "" when it succeeds: a negative case checks the message names the refusal, and a
// positive case with the same parameters gets "", so a validation error is not taken for a refusal.
function refusal(service, parameters = {}) {
    ec.message.pushErrors()
    try {
        ec.service.sync().name(service).parameters(parameters).requireNewTransaction(true).call()
        return ec.message.hasError() ? ec.message.getErrorsString() : ""
    } catch (error) {
        return String(error.message)
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}
function invoke(service, parameters = {}) {
    return ec.service.sync().name(service).parameters(parameters).call() || {}
}

// A Warehouse screen as the shell fetches it (qvt, a fragment of the last standalone screen, with its lists' data), with
// a widget's render error counted among the errors.
function page(path, parameters = {}, mode = "qvt") {
    const renderer = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Warehouse.xml").renderMode(mode)
    if (mode === "qvt") renderer.withStaticData()
    const result = renderer.render(path, Object.assign({lastStandalone: "-2"}, parameters), null)
    const output = String(result.output || "")
    const failed = output.match(/(Error rendering|Exception in render)[^\n<]*/g) || []
    const errors = Array.from(result.errorMessages || []).concat(failed)
    ec.message.clearErrors()
    return {status: result.status, output, errors}
}

;({ids, asUser, refusal, invoke, page})
