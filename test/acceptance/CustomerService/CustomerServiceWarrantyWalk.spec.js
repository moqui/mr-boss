// Customer Service P11's "usable when" (impl-customer-service P11, design §5 WarrantyClaims and WarrantyAssessment), as an
// acceptance walk through the screens' transitions with artifact authorization on: Customer360's Delivered items offers a
// claim on the delivered thermostat's serial, NewCase makes it with the warranty claim template, and WarrantyAssessment shows
// its coverage from the ship date plus the product's 12-month term with the source; a claim past its coverage is refused as
// covered, rejected by the agent, and approved as goodwill by the manager, who is shown as the approver; the covered claim's
// repair is linked as an AssetMaintenance with its task, and finishing it tells the agent and leaves the case open; a
// replacement goes through a return on the claim (P9). The rules are Mantle's SupportWarranty spec. The walk's claims are
// closed and its return cancelled at the end; the repair stays finished on the customer's serial.
// Run: ./moq accept mr-boss --spec CustomerServiceWarrantyWalk
const lib = ec.resource.script("component://mr-boss/test/CustomerService/CustomerServiceSpecLib.js")
const {ids, users, asUser, system, invoke, refusal} = lib
const webroot = "component://webroot/screen/webroot.xml"
const W = "mantle.request.WarrantyServices."
const one = (entity, conditions) => system(() => ec.entity.find(entity).condition(conditions).one())
const rows = (entity, conditions) => system(() => Array.from(ec.entity.find(entity).condition(conditions).list()))
const msOf = value => (/^-?\d+$/.test(String(value)) ? Number(String(value)) : Date.parse(String(value)))
// the coverage end as the agent's pages show it: the ship day in the agent's time zone (Retail's calendar has none), plus the
// term in calendar months, the month's last day when it is shorter
const coverageEnd = (millis, months) => {
    const [y, m, d] = asUser(users.agent, () => ec.l10n.format(new Date(millis), "yyyy-MM-dd"))
        .split("-")
        .map(Number)
    const lastDay = new Date(Date.UTC(y, m - 1 + months + 1, 0)).getUTCDate()
    return new Date(Date.UTC(y, m - 1 + months, Math.min(d, lastDay))).toISOString().slice(0, 10)
}
const plusMonths = (millis, months) => {
    const date = new Date(millis)
    date.setUTCMonth(date.getUTCMonth() + months)
    return date.getTime()
}
const state = {claims: [], returns: []}
let keySeq = 0
const key = () => "wtw-" + Date.now() + "-" + ++keySeq
// a transition of a Customer Service screen as the user posts it: its status and errors
function post(user, path, parameters) {
    return asUser(user, () => {
        const rendered = ec.screen
            .makeTest()
            .rootScreen(webroot)
            .render("apps/CustomerService/" + path, parameters, "post")
        const result = {status: rendered.status, errors: Array.from(rendered.errorMessages || []).join(" | ")}
        ec.message.clearErrors()
        return result
    })
}
const html = (user, path, parameters) => asUser(user, () => lib.page(path, parameters, "html"))
const claimOf = (user, requestId) => asUser(user, () => invoke(W + "get#WarrantyClaim", {requestId}), false)
// the newest warranty claim on the serial
const latestClaim = assetId =>
    rows("mantle.request.RequestRecord", {recordEntityName: "mantle.product.asset.Asset", recordId: assetId})
        .map(row => one("mantle.request.Request", {requestId: row.requestId}))
        .filter(request => request?.requestTypeEnumId === "RqtWarranty")
        .sort((a, b) => String(b.requestId).localeCompare(String(a.requestId), undefined, {numeric: true}))[0]

spec({
    setupSpec() {
        login("john.doe")
        state.thermostat = lib.deliveredThermostat()
        state.shipMs = msOf(state.thermostat.issuedDate)
    },
    cleanupSpec() {
        for (const returnId of state.returns)
            asUser(
                users.returns,
                () => refusal("mantle.order.ReturnPolicyServices.cancel#CustomerReturn", {returnId, reason: "Walk cleanup"}),
                false
            )
        for (const requestId of state.claims) lib.closeWarrantyClaim(requestId)
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("a claim from Delivered items shows coverage from the ship date plus the 12-month term, with its source", {
    when() {
        const delivered = html(users.agent, "Customers/Customer360/ServiceDeliveredItems", {customerPartyId: ids.customerId})
        const made = post(users.agent, "Cases/NewCase/createCase", {
            organizationPartyId: ids.organizationId,
            customerPartyId: ids.customerId,
            requestTypeEnumId: "RqtWarranty",
            requestCategoryId: ids.supportQueueId,
            templateFormId: ids.warrantyTemplateFormId,
            templateQueueId: ids.supportQueueId,
            requestName: "Walk: the thermostat reads high",
            assetId: state.thermostat.assetId,
            orderId: ids.deliveredOrderId,
            assigneePartyId: "BOSS_CS_AGENT",
            faultDetail: "Reads three degrees high since it was installed",
            usageCondition: "normal"
        })
        const claim = latestClaim(state.thermostat.assetId)
        if (claim) state.claims.push((state.covered = claim.requestId))
        const assessment = claim ? html(users.agent, "Returns/WarrantyAssessment", {requestId: claim.requestId}) : {output: ""}
        const read = claim ? claimOf(users.agent, claim.requestId) : {}
        return {delivered, made, claim, assessment, read}
    },
    then({delivered, made, claim, assessment, read}) {
        delivered.output.includes(state.thermostat.serialNumber)
        delivered.output.includes("New claim")
        delivered.output.includes(coverageEnd(state.shipMs, 12))
        made.errors == ""
        claim != null
        read.claim.orderId == ids.deliveredOrderId
        read.claim.faultText == "Reads three degrees high since it was installed"
        read.coverage.basisEnumId == "WcbProductWarranty"
        read.coverage.covered == true
        assessment.output.includes("Coverage until " + coverageEnd(state.shipMs, 12))
        assessment.output.includes("plus 12 months of 12-month warranty")
        assessment.output.includes(ids.warrantyFeatureId)
    }
})

feature("a claim past its coverage is refused as covered, rejected by the agent, and approved as goodwill by the manager", {
    when() {
        const made = lib.warrantyClaim(users.agent, {
            requestName: "Walk: the thermostat failed after its warranty",
            assetId: state.thermostat.assetId
        })
        state.claims.push(made.requestId)
        // the claim is made thirteen months after the ship date
        system(() =>
            ec.service
                .sync()
                .name("update#mantle.request.Request")
                .parameters({requestId: made.requestId, requestDate: new Date(plusMonths(state.shipMs, 13))})
                .call()
        )
        const before = claimOf(users.agent, made.requestId)
        const decide = (user, values) =>
            post(
                user,
                "Returns/WarrantyAssessment/decideClaim",
                Object.assign({requestId: made.requestId, claimRevision: before.claim.claimRevision, operationKey: key()}, values)
            )
        const covered = decide(users.agent, {decisionEnumId: "WdCovered"})
        const agentGoodwill = decide(users.agent, {decisionEnumId: "WdGoodwill", reason: "A loyal customer"})
        const rejected = decide(users.agent, {decisionEnumId: "WdRejected", reason: "The warranty ended a month ago"})
        const afterReject = claimOf(users.agent, made.requestId)
        const goodwill = decide(users.manager, {decisionEnumId: "WdGoodwill", reason: "A loyal customer, one-off"})
        const after = claimOf(users.agent, made.requestId)
        const page = html(users.agent, "Returns/WarrantyAssessment", {requestId: made.requestId})
        return {before, covered, agentGoodwill, rejected, afterReject, goodwill, after, page}
    },
    then({before, covered, agentGoodwill, rejected, afterReject, goodwill, after, page}) {
        before.coverage.covered == false
        before.coverage.coverageEndText == coverageEnd(state.shipMs, 12)
        covered.errors.includes("NOT_COVERED")
        agentGoodwill.errors.includes("PERMISSION_DENIED")
        rejected.errors == ""
        afterReject.claim.state == "rejected"
        goodwill.errors == ""
        after.claim.state == "approved"
        after.currentDecision.decisionEnumId == "WdGoodwill"
        after.currentDecision.approverName != ""
        page.output.includes("Goodwill")
        page.output.includes("approved by " + after.currentDecision.approverName)
    }
})

feature("the covered claim's repair finishing tells the agent and leaves the case open; a replacement goes through a return", {
    when() {
        const requestId = state.covered
        const before = claimOf(users.agent, requestId)
        const decided = post(users.agent, "Returns/WarrantyAssessment/decideClaim", {
            requestId,
            claimRevision: before.claim.claimRevision,
            decisionEnumId: "WdCovered",
            operationKey: key()
        })
        const linked = post(users.agent, "Returns/WarrantyAssessment/linkWork", {
            requestId,
            comments: "Replace the temperature sensor",
            operationKey: key()
        })
        const repair = claimOf(users.agent, requestId).repairs[0]
        const statusBefore = one("mantle.request.Request", {requestId}).statusId
        const finished = post(users.agent, "Returns/WarrantyAssessment/updateWork", {
            requestId,
            assetMaintenanceId: repair?.assetMaintenanceId,
            statusId: "AsMntCompleted",
            comments: "Sensor replaced and calibrated"
        })
        const notices = rows("moqui.security.user.NotificationMessage", {topic: "WarrantyRepairFinished", recordId: requestId})
        const noticeUsers = notices.length
            ? rows("moqui.security.user.NotificationMessageUser", {notificationMessageId: notices[0].notificationMessageId}).map(
                  row => row.userId
              )
            : []
        const statusAfter = one("mantle.request.Request", {requestId}).statusId
        const maintenance = repair
            ? one("mantle.product.maintenance.AssetMaintenance", {assetMaintenanceId: repair.assetMaintenanceId})
            : null
        // a replacement: a return of the serial's order line for a replacement, on the claim
        const line = rows("mantle.order.OrderItem", {orderId: ids.deliveredOrderId, productId: ids.serializedProductId})[0]
        const returned = asUser(
            users.agent,
            () =>
                invoke("mantle.order.ReturnPolicyServices.submit#CustomerReturn", {
                    operationKey: key(),
                    orderId: ids.deliveredOrderId,
                    requestId,
                    lineList: [
                        {
                            orderItemSeqId: line.orderItemSeqId,
                            quantity: 1,
                            returnReasonEnumId: "RrsnDefective",
                            returnResponseEnumId: "RrspReplace"
                        }
                    ],
                    draft: true
                }),
            false
        )
        if (returned.returnId) state.returns.push(returned.returnId)
        const after = claimOf(users.agent, requestId)
        const page = html(users.agent, "Returns/WarrantyAssessment", {requestId})
        return {decided, linked, repair, statusBefore, finished, noticeUsers, statusAfter, maintenance, returned, after, page}
    },
    then({decided, linked, repair, statusBefore, finished, noticeUsers, statusAfter, maintenance, returned, after, page}) {
        decided.errors == ""
        linked.errors == ""
        repair != null
        finished.errors == ""
        maintenance.statusId == "AsMntCompleted"
        maintenance.maintenanceTypeEnumId == "MntTpWarranty"
        noticeUsers.includes("BOSS_CS_AGENT")
        statusAfter == statusBefore
        returned.returnId != null
        after.returns.some(row => row.returnId === returned.returnId)
        page.output.includes("Repair " + repair.assetMaintenanceId)
        page.output.includes("Return ")
    }
})
