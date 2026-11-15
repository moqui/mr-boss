// Marketing P15's "usable when" (impl-marketing P15; design-marketing §8 TrackingLinks, TrackingLinkDetail, "Capture on the
// authority", §18), as an acceptance scenario through the screens' transitions with artifact authorization on and PASS's own tracking
// web script: marketing.author makes a campaign link to the spring landing page with New link and reads its address and QR code; a
// visitor scans it (the redirect, called as the servlet container calls it) and lands on the page, counted as one visitor by its key
// whatever page visits follow; a consenting recipient's personalized link names them on the send and a refusing recipient's direct link
// names no one; Commerce's Home shows the store's visits. The remote half is mr-pass's acceptance MarketingTrackingHttp.
// Run: ./moq accept mr-boss --spec MarketingTrackingScenario
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const {ids, users, asUser, system} = lib
const K = "mantle.marketing.TrackingServices."
const tracking = () => ec.resource.script("component://mr-mantle/service/mantle/marketing/MarketingTracking.js")
const site = "ZIZI_SHOP"
const state = {}

function post(path, parameters) {
    const result = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Marketing.xml").render(path, parameters, "post")
    const errors = Array.from(result.errorMessages || []).join(" | ")
    ec.message.clearErrors()
    return {status: result.status, errors}
}
const as = (user, service, parameters) =>
    asUser(user, () => system(() => ec.service.sync().name(service).parameters(parameters).call() || {}))
const one = (entity, fields) => system(() => ec.entity.find(entity).condition(fields).one())
const all = (entity, fields) => system(() => Array.from(ec.entity.find(entity).condition(fields).list()))
// PASS's redirect as the servlet container calls it, for a browser with the cookies given: its status, Location and new cookie
function scan(path, cookies = [], parameters = {}) {
    const request = {
        method: "GET",
        pathInfo: path,
        secure: true,
        remoteAddr: "203.0.113.20",
        getParameter: name => parameters[name] ?? null,
        getHeader: name =>
            String(name).toLowerCase() === "user-agent" ? "Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Mobile Safari" : null,
        getCookies: () => cookies
    }
    const response = {
        status: 200,
        location: null,
        cookies: [],
        setStatus(code) {
            this.status = code
        },
        setHeader() {},
        addHeader(name, value) {
            if (String(name).toLowerCase() === "set-cookie") this.cookies.push(value)
        },
        setContentType() {},
        write() {},
        sendRedirect(url) {
            this.status = 302
            this.location = url
        }
    }
    logout()
    try {
        ec.resource.script("component://mr-pass/script/TrackingRedirect.js").doGet(request, response)
    } finally {
        login("john.doe")
    }
    const key = (/mkt_vk=([A-Za-z0-9_-]+)/.exec(response.cookies[0] || "") || [])[1] || null
    return {status: response.status, location: response.location, key}
}

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        // the shop's site is published for the scenario (the demo leaves it to be published)
        system(() =>
            ec.service.sync().name("update#mantle.public.PublicSite").parameters({siteId: site, state: "published"}).call()
        )
    },
    cleanupSpec() {
        login("john.doe")
    }
})

feature("the author makes a campaign link to the landing page and reads its address and QR code", {
    when() {
        const made = asUser(users.author, () =>
            post("Content/TrackingLinks/storeTrackingLink", {
                marketingCampaignId: ids.runningCampaignId,
                description: "Spring window sticker",
                siteId: site,
                destinationKindEnumId: "TdkSitePage",
                sitePageId: ids.landingPageId,
                utmSource: "poster",
                utmMedium: "qr"
            })
        )
        const link = all("mantle.marketing.tracking.TrackingCode", {description: "Spring window sticker"})[0]
        state.link = link
        const detail = as(users.author, K + "get#TrackingLink", {trackingCodeId: link?.trackingCodeId})
        const outside = asUser(users.author, () =>
            post("Content/TrackingLinks/storeTrackingLink", {
                marketingCampaignId: ids.runningCampaignId,
                description: "Somewhere else",
                destinationKindEnumId: "TdkUrl",
                redirectUrl: "https://elsewhere.example.test/"
            })
        )
        return {made, link, detail, outside}
    },
    then(r) {
        r.made.errors == "" && r.link != null
        r.detail.trackingLink.publicUrl == "https://shop.zizi.localhost/trk/" + site + "/" + r.link.publicCode
        String(r.detail.qrSvg).includes("<svg")
        r.outside.errors.includes("DESTINATION_NOT_REGISTERED")
    }
})

feature("a visitor scans it and lands on the page, counted once by visitor key whatever page visits follow", {
    when() {
        const code = state.link.publicCode
        const first = scan("/" + site + "/" + code)
        const again = scan("/" + site + "/" + code, [{name: "mkt_vk", value: first.key}])
        // the landing page carrying the code, read by the same browser (the page records a visit with its held key)
        logout()
        try {
            ec.screen
                .makeTest()
                .rootScreen("component://mr-pass/screen/Pass.xml")
                .render("Marketing/Page", {resolvedSiteId: site, routePath: "spring-garden", tc: code}, null)
        } finally {
            login("john.doe")
        }
        const observed = as(users.author, K + "get#TrackingLink", {trackingCodeId: state.link.trackingCodeId})
        return {first, again, observed}
    },
    then(r) {
        r.first.status == 302 &&
            r.first.location.startsWith("https://shop.zizi.localhost/marketing/pages/spring-garden?utm_source=poster")
        r.first.key != null && r.again.status == 302 && r.again.key == null
        r.observed.observations.period.clicks == 2
        r.observed.observations.period.keyedVisitors == 1
    }
})

feature("a consenting recipient's click shows on the send; a refusing recipient's direct link names no one", {
    when() {
        // two recipients of the running campaign's November newsletter: one who allows tracking, one who does not (the demo prepared
        // it for Maya alone: Pete, the legacy member, is its second here)
        const send = one("mantle.marketing.campaign.CampaignSend", {campaignSendId: ids.approvedSendId})
        const demoRecipient = all("mantle.marketing.campaign.CampaignRecipient", {campaignSendId: ids.approvedSendId})[0]
        system(() =>
            ec.service
                .sync()
                .name("create#mantle.marketing.campaign.CampaignRecipient")
                .parameters({
                    campaignRecipientId: "MKT_TRK_SCN_R2",
                    campaignSendId: ids.approvedSendId,
                    preparedRevision: demoRecipient.preparedRevision,
                    partyId: ids.legacyPartyId,
                    channelEnumId: "MdcEmail",
                    tracked: "N",
                    executionKey: "MKT_TRK_SCN_EXEC2",
                    statusId: demoRecipient.statusId
                })
                .call()
        )
        const recipients = [
            demoRecipient,
            one("mantle.marketing.campaign.CampaignRecipient", {campaignRecipientId: "MKT_TRK_SCN_R2"})
        ]
        system(() => {
            ec.service
                .sync()
                .name("create#mantle.party.PartyConsent")
                .parameters({
                    partyId: recipients[0].partyId,
                    purposeEnumId: "PcpTracking",
                    statusId: "PconGranted",
                    organizationPartyId: send.organizationPartyId,
                    sourceEnumId: "PcsForm",
                    consentDate: new Date(Date.now() - 60000)
                })
                .call()
            ec.service
                .sync()
                .name("update#mantle.marketing.campaign.CampaignRecipient")
                .parameters({campaignRecipientId: recipients[0].campaignRecipientId, tracked: "Y"})
                .call()
            ec.service
                .sync()
                .name("update#mantle.marketing.campaign.CampaignRecipient")
                .parameters({campaignRecipientId: recipients[1].campaignRecipientId, tracked: "N"})
                .call()
        })
        const linkUrl = "https://shop.zizi.localhost/trk/" + site + "/" + state.link.publicCode
        const body = '<p><a href="' + linkUrl + '">See the spring garden</a></p>'
        const profile = {trackingPolicyEnumId: "MtrConsented"}
        const fresh = id => one("mantle.marketing.campaign.CampaignRecipient", {campaignRecipientId: id})
        const consenting = system(() =>
            tracking().messageTracking(send, fresh(recipients[0].campaignRecipientId), profile, body, "")
        )
        const refusing = system(() =>
            tracking().messageTracking(send, fresh(recipients[1].campaignRecipientId), profile, body, "")
        )
        const token = (/\?token=([A-Za-z0-9_-]+)/.exec(consenting.body) || [])[1]
        const clicked = scan("/" + site + "/" + state.link.publicCode, [], {token})
        const shown = as(users.dispatch, "mantle.marketing.CampaignSendServices.get#Recipient", {
            campaignRecipientId: recipients[0].campaignRecipientId
        })
        const other = as(users.dispatch, "mantle.marketing.CampaignSendServices.get#Recipient", {
            campaignRecipientId: recipients[1].campaignRecipientId
        })
        return {consenting, refusing, clicked, shown, other}
    },
    then(r) {
        r.consenting.tracked == true && r.consenting.body.includes("/trk-o/" + site + "?token=")
        r.refusing.tracked == false && !r.refusing.body.includes("/trk") && r.refusing.body.includes("utm_source=poster")
        r.clicked.status == 302
        r.shown.recipient.clicksText.startsWith("Clicked 1 time")
        r.other.recipient.clicksText == ""
    }
})

feature("Commerce's Home shows the store's visits", {
    when() {
        const home = asUser("commerce.manager", () =>
            system(
                () =>
                    ec.service
                        .sync()
                        .name("ironstone.commerce.ReportingServices.get#HomePeriod")
                        .parameters({appRoot: "Commerce", productStoreId: "POPC_DEFAULT", interval: "M"})
                        .call().period
            )
        )
        return {home}
    },
    then(r) {
        r.home.visits != null && r.home.visits.visitCount >= 1
    }
})
