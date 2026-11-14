// Marketing's delivery (impl-marketing P9; design-marketing §5 CampaignDelivery): CampaignDelivery's one qvt render, for the dispatcher
// who released the December newsletter for its schedule (Mantle's release#Send, as the dispatcher): the send's state and counts, its
// one recipient waiting to be handed off with the address masked (the dispatcher holds no audience permission) and no name, the
// report's CSV and PDF buttons. The release, dispatch and recovery rules are Mantle's (test/marketing/Dispatch); the golden path in
// the browser is the client MarketingSendWalk; the "usable when" scenario the acceptance MarketingDispatchScenario.
// Run: ./moq test mr-boss --spec MarketingDelivery
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const {ids, users, asUser, page, system, invoke} = lib

spec({})

feature("CampaignDelivery shows a released send's recipients to its dispatcher, the address masked", {
    when() {
        // its schedule a week from now whatever the day the spec runs (the demo's is 1 December), so the release waits for it
        system(() =>
            invoke("update#mantle.marketing.campaign.CampaignSend", {
                campaignSendId: ids.scheduledSendId,
                scheduledDate: new Date(Date.now() + 7 * 86400000)
            })
        )
        // the dispatcher releases the approved December newsletter for its schedule (the service's own rule, as the dispatcher)
        login(users.dispatch)
        let released
        try {
            released = system(() =>
                invoke("mantle.marketing.CampaignSendServices.release#Send", {
                    campaignSendId: ids.scheduledSendId,
                    expectedRevision: ec.entity
                        .find("mantle.marketing.campaign.CampaignSend")
                        .condition("campaignSendId", ids.scheduledSendId)
                        .disableAuthz()
                        .one().lastUpdatedStamp
                })
            )
        } finally {
            ec.message.clearErrors()
            login(users.system)
        }
        const delivery = asUser(users.dispatch, () => page("Sends/CampaignDelivery", {campaignSendId: ids.scheduledSendId}))
        return {released, delivery}
    },
    then({released, delivery}) {
        released.statusId == "CsScheduled"
        delivery.status == 200 && delivery.errors.length == 0
        delivery.output.includes("Delivery of Garden newsletter, December")
        delivery.output.includes("Scheduled") && delivery.output.includes("1 waiting")
        // the one recipient, waiting, with the address masked and no name for a dispatcher without the audience permission
        delivery.output.includes("Waiting to be handed off")
        delivery.output.includes("@zizi-customers.example")
        !delivery.output.includes("maya.lindqvist") && !delivery.output.includes("Lindqvist")
        delivery.output.includes("Addresses are masked")
        // the report: the list's CSV and PDF
        delivery.output.includes("Open the send")
    }
})
