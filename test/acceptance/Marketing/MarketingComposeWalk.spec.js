// Marketing P8's "usable when" (impl-marketing P8; design-marketing §16.3 scenario 10), as an acceptance walk through the screens'
// transitions with artifact authorization on: marketing.author uses the garden newsletter template (a draft send of the running
// campaign to the garden newsletter), is refused a script and a file that is not the send's or its campaign's, sends a test to an
// address of Retail's test list (marked TEST), prepares the send and asks for approval; marketing.approver sees the count on SendDetail
// and approves; the author's edit of the subject returns the send to review (Draft, the approval ended by the change). The rules
// themselves are Mantle's Sends, the access MarketingAccess.
// Run: ./moq accept mr-boss --spec MarketingComposeWalk
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const {ids, users, asUser, system, page} = lib
const entityLib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const SEND = "mantle.marketing.campaign.CampaignSend"
const capture = ec.factory.getTool("MailCapture")
const testAddress = "marketing.author@retail.example"

// A Marketing transition posted as the user's browser does
function post(path, parameters) {
    const result = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Marketing.xml").render(path, parameters, "post")
    const errors = Array.from(result.errorMessages || []).join(" | ")
    ec.message.clearErrors()
    return {status: result.status, errors}
}
const sendRow = id => system(() => ec.entity.find(SEND).condition("campaignSendId", id).one())
const revision = id => entityLib.ms(sendRow(id).lastUpdatedStamp)
const decisions = id =>
    system(() =>
        Array.from(
            ec.entity
                .find("mantle.marketing.campaign.MarketingDecision")
                .condition({targetKindEnumId: "MdtSend", targetId: id})
                .list()
        )
    )

spec({
    setupSpec() {
        capture.enable()
        login("john.doe")
    },
    cleanupSpec() {
        capture.reset()
        login("john.doe")
    }
})

let sendId = null
feature("the author uses a template for a draft send; a script and another record's file are refused", {
    when() {
        const created = asUser(users.author, () =>
            post("Sends/Sends/createSend", {
                marketingCampaignId: ids.runningCampaignId,
                sendName: "Walk newsletter",
                contactListId: ids.gardenListId,
                messageTemplateId: ids.newsletterTemplateId,
                sendingProfileId: ids.retailProfileId
            })
        )
        sendId = system(() => ec.entity.find(SEND).condition("sendName", "Walk newsletter").one()?.campaignSendId)
        const script = asUser(users.author, () =>
            post("Sends/Compose/storeSendContent", {
                campaignSendId: sendId,
                expectedRevision: revision(sendId),
                subject: "Garden news for ${firstName}",
                body: "<p>Hello ${firstName}</p><script>alert(1)</script>",
                variablesText: "firstName | First name | gardener"
            })
        )
        const privateFile = asUser(users.author, () =>
            post("Sends/Compose/storeSendAssets", {
                campaignSendId: sendId,
                expectedRevision: revision(sendId),
                action: "add",
                contentLocation: "dbresource://mantle/content/party/" + ids.acceptedPartyId + "/private.pdf"
            })
        )
        const saved = asUser(users.author, () =>
            post("Sends/Compose/storeSendContent", {
                campaignSendId: sendId,
                expectedRevision: revision(sendId),
                subject: "Garden news for ${firstName}",
                preheader: "Winter planting",
                body: "<p>Hello ${firstName},</p><p>The winter planting guide is out.</p>",
                bodyText: "Hello ${firstName}, the winter planting guide is out.",
                variablesText: "firstName | First name | gardener"
            })
        )
        return {created, script, privateFile, saved, row: sendRow(sendId)}
    },
    then({created, script, privateFile, saved, row}) {
        created.errors == ""
        sendId != null
        row.statusId == "CsDraft" && row.messageTemplateId == ids.newsletterTemplateId
        script.errors.includes("UNSAFE_HTML")
        privateFile.errors.includes("ASSET_UNAVAILABLE")
        saved.errors == ""
    }
})

feature("the author tests the send to an allowed address, prepares it and asks for approval", {
    when() {
        capture.clear()
        const outside = asUser(users.author, () =>
            post("Sends/Compose/testSend", {campaignSendId: sendId, toAddress: "maya.lindqvist@zizi-customers.example"})
        )
        const tested = asUser(users.author, () =>
            post("Sends/Compose/testSend", {campaignSendId: sendId, toAddress: testAddress})
        )
        const message = Array.from(capture.getMessages()).find(m => Array.from(m.toList || []).includes(testAddress)) || {}
        const prepared = asUser(users.author, () =>
            post("Sends/SendDetail/prepareSend", {campaignSendId: sendId, expectedRevision: revision(sendId), resultDigest: ""})
        )
        const asked = asUser(users.author, () =>
            post("Sends/SendDetail/requestSendApproval", {campaignSendId: sendId, targetRevision: sendRow(sendId).sendRevision})
        )
        return {outside, tested, message, prepared, asked, row: sendRow(sendId)}
    },
    then({outside, tested, message, prepared, asked, row}) {
        outside.errors.includes("TEST_ADDRESS_NOT_ALLOWED")
        tested.errors == ""
        String(message.subject).startsWith("[TEST] Garden news for Alex")
        String(message.body).includes("TEST: not sent to the audience")
        prepared.errors == ""
        row.eligibleCount == 1
        asked.errors == ""
        row.statusId == "CsAwaitingApproval"
    }
})

feature("the approver sees the count on SendDetail and approves", {
    when() {
        const detail = asUser(users.approver, () => page("Sends/SendDetail", {campaignSendId: sendId}, "html"))
        const decided = asUser(users.approver, () =>
            post("Sends/SendDetail/decideSendApproval", {
                campaignSendId: sendId,
                targetRevision: sendRow(sendId).sendRevision,
                decision: "approve"
            })
        )
        return {detail, decided, row: sendRow(sendId)}
    },
    then({detail, decided, row}) {
        detail.errors.length == 0
        detail.output.includes("Walk newsletter") && detail.output.includes("1 eligible")
        detail.output.includes("Approve")
        decided.errors == ""
        row.statusId == "CsApproved"
    }
})

feature("the author's edit of the subject returns the send to review", {
    when() {
        const edited = asUser(users.author, () =>
            post("Sends/Compose/storeSendContent", {
                campaignSendId: sendId,
                expectedRevision: revision(sendId),
                subject: "Winter garden news for ${firstName}",
                preheader: "Winter planting",
                body: "<p>Hello ${firstName},</p><p>The winter planting guide is out.</p>",
                bodyText: "Hello ${firstName}, the winter planting guide is out.",
                variablesText: "firstName | First name | gardener"
            })
        )
        const approval = decisions(sendId).find(row => row.decisionEnumId == "MddApproved")
        return {edited, row: sendRow(sendId), approval}
    },
    then({edited, row, approval}) {
        edited.errors == ""
        row.statusId == "CsDraft"
        row.sendRevision == approval.targetRevision + 1
        approval.supersededDate != null
    }
})
