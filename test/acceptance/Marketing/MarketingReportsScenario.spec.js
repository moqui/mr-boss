// Marketing P20's "usable when" (impl-marketing P20; design-marketing §11, §16.3 scenarios 15 and 18), as an acceptance scenario with
// artifact authorization on: the demo running campaign gets a released send with its deliveries and a tracked click, a Shop order
// placed from the click's visit and a Sales order from a lead of the campaign; each order is attributed once through the placement's
// handler (a second call answers the first); a partial refund reduces the attributed net once; the four reports reconcile to the
// recipients, the events and the orders; a visit through a remote PASS counts through its visitor key, and an order placed through
// it is attributed by the key's digest its checkout kept (follow-up 4); an Insights reader with Marketing's report permission opens
// Campaign performance from the catalog and a user without it does not see it.
// Run: ./moq accept mr-boss --spec MarketingReportsScenario
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const R = "mantle.marketing.MarketingReportServices."
const K = "mantle.marketing.TrackingServices."
const tracking = () => ec.resource.script("component://mr-mantle/service/mantle/marketing/MarketingTracking.js")
// the remote PASS visitor's first-party key (its mkt_vk cookie); the authority keeps only its digest
const VISITOR_KEY = "BossMktP20Visitor_0123456789"
const prefix = "BOSS_MKT_P20"
const dayMs = 86400000
const ago = days => new Date(Date.now() - days * dayMs)
const make = (entity, values) =>
    system(() =>
        ec.service
            .sync()
            .name("create#" + entity)
            .parameters(values)
            .call()
    )
const as = (user, service, parameters) =>
    asUser(user, () => system(() => ec.service.sync().name(service).parameters(parameters).call() || {}))
const period = {organizationPartyId: ids.organizationId, fromDate: ago(30), thruDate: new Date(Date.now() + dayMs)}

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        // a released send of the running campaign: three recipients handed off, two accepted (one delivered), one failed
        make("mantle.marketing.campaign.CampaignSend", {
            campaignSendId: prefix + "_SEND",
            marketingCampaignId: ids.runningCampaignId,
            organizationPartyId: ids.organizationId,
            sendName: "Spring results check",
            channelEnumId: "MdcEmail",
            statusId: "CsCompleted",
            releasedDate: ago(3),
            preparedRevision: 1
        })
        for (const [n, state, receipt, tracked] of [
            ["1", "MdsSent", "MdrDelivered", "Y"],
            ["2", "MdsSent", null, "N"],
            ["3", "MdsFailed", null, "N"]
        ]) {
            make("mantle.party.MessageDelivery", {
                deliveryId: prefix + "_DLV" + n,
                eventKey: "CampaignSend:" + prefix + "_SEND:" + n,
                sourceEnumId: "MdsrcCampaignSend",
                recipientPartyId: n === "1" ? ids.acceptedPartyId : ids.legacyPartyId,
                channelEnumId: "MdcEmail",
                organizationPartyId: ids.organizationId,
                stateEnumId: state,
                receiptEnumId: receipt,
                createdDate: ago(3),
                sentDate: state === "MdsSent" ? ago(3) : null
            })
            make("mantle.marketing.campaign.CampaignRecipient", {
                campaignRecipientId: prefix + "_R" + n,
                campaignSendId: prefix + "_SEND",
                preparedRevision: 1,
                partyId: n === "1" ? ids.acceptedPartyId : ids.legacyPartyId,
                channelEnumId: "MdcEmail",
                tracked,
                executionKey: prefix + "_EXEC" + n,
                statusId: "CrsHandedOff",
                messageDeliveryId: prefix + "_DLV" + n
            })
        }
        // the poster link's visit: a click by key K (through a remote PASS: no local visit), then the landing page in a local visit
        make("moqui.server.Visit", {visitId: prefix + "_VISIT", fromDate: ago(2)})
        for (const [n, fields] of [
            ["CLICK", {eventKindEnumId: "MteClick", visitorKeyHash: tracking().visitorKeyHash(VISITOR_KEY), eventDate: ago(2)}],
            [
                "PAGE",
                {
                    eventKindEnumId: "MteVisit",
                    visitorKeyHash: tracking().visitorKeyHash(VISITOR_KEY),
                    visitId: prefix + "_VISIT",
                    eventDate: ago(2)
                }
            ]
        ])
            make(
                "mantle.marketing.tracking.MarketingTrackingEvent",
                Object.assign(
                    {
                        trackingEventId: prefix + "_EV_" + n,
                        trackingCodeId: ids.trackingLinkId,
                        organizationPartyId: ids.organizationId,
                        marketingCampaignId: ids.runningCampaignId,
                        siteId: "ZIZI_SHOP"
                    },
                    fields
                )
            )
    }
})

feature("an order from the campaign's link and one from its lead are each attributed once at placement", {
    when() {
        for (const [suffix, visitId] of [
            ["SHOP", prefix + "_VISIT"],
            ["SALES", null]
        ]) {
            make("mantle.order.OrderHeader", {
                orderId: prefix + "_" + suffix,
                statusId: "OrderPlaced",
                placedDate: ago(1),
                currencyUomId: "USD",
                grandTotal: 120,
                orderPurposeEnumId: "OrpSalesOrder",
                visitId
            })
            make("mantle.order.OrderPart", {
                orderId: prefix + "_" + suffix,
                orderPartSeqId: "01",
                vendorPartyId: ids.organizationId,
                customerPartyId: ids.salesContactId
            })
        }
        make("mantle.sales.opportunity.SalesOpportunity", {
            salesOpportunityId: prefix + "_OPP",
            organizationPartyId: ids.organizationId,
            opportunityName: "Garden plan",
            marketingCampaignId: ids.runningCampaignId,
            createdDate: ago(10)
        })
        make("mantle.sales.opportunity.SalesOpportunityOrder", {salesOpportunityId: prefix + "_OPP", orderId: prefix + "_SALES"})
        const first = system(() => invoke(K + "handle#OrderPlaced", {orderId: prefix + "_SHOP"}))
        const again = system(() => invoke(K + "handle#OrderPlaced", {orderId: prefix + "_SHOP"}))
        const sales = system(() => invoke(K + "handle#OrderPlaced", {orderId: prefix + "_SALES"}))
        const decisions = orderId =>
            system(() => Array.from(ec.entity.find("mantle.marketing.tracking.MarketingOutcomeLink").condition({orderId}).list()))
        return {first, again, sales, shop: decisions(prefix + "_SHOP"), salesDecisions: decisions(prefix + "_SALES")}
    },
    then({first, again, sales, shop, salesDecisions}) {
        first.outcomeLinkId == again.outcomeLinkId
        shop.length == 1 && shop[0].marketingCampaignId == ids.runningCampaignId && shop[0].basisEnumId == "MobTrackingEvent"
        salesDecisions.length == 1 && salesDecisions[0].basisEnumId == "MobOpportunity"
        sales.outcomeLinkId == salesDecisions[0].outcomeLinkId
    }
})

feature("a partial refund reduces the attributed net once; the four reports reconcile to the recipients, events and orders", {
    when() {
        make("mantle.order.OrderItemBilling", {
            orderItemBillingId: prefix + "_BILL",
            orderId: prefix + "_SHOP",
            quantity: 1,
            amount: 120
        })
        make("mantle.order.return.ReturnHeader", {
            returnId: prefix + "_RET",
            statusId: "ReturnCompleted",
            vendorPartyId: ids.organizationId
        })
        make("mantle.order.return.ReturnItem", {
            returnId: prefix + "_RET",
            returnItemSeqId: "01",
            orderId: prefix + "_SHOP",
            statusId: "ReturnCompleted",
            returnQuantity: 1,
            returnPrice: 20
        })
        const analyst = name => as(users.analyst, R + name, period)
        return {
            performance: as(
                users.analyst,
                R + "get#CampaignPerformance",
                Object.assign({marketingCampaignId: ids.runningCampaignId}, period)
            ),
            delivery: as(users.analyst, R + "get#DeliveryAnalysis", Object.assign({campaignSendId: prefix + "_SEND"}, period)),
            growth: analyst("get#AudienceGrowth"),
            attribution: as(
                users.analyst,
                R + "get#Attribution",
                Object.assign({marketingCampaignId: ids.runningCampaignId}, period)
            )
        }
    },
    then({performance, delivery, growth, attribution}) {
        const campaign = performance.campaignRows[0]
        campaign.acceptedCount == 2 && campaign.reachCount == 2
        // the click and the page by one key: one visit
        campaign.visitCount >= 1
        campaign.orderCount == 2
        const send = delivery.sendRows[0]
        send.attemptedCount == 3 && send.acceptedCount == 2 && send.deliveredCount == 1 && send.failedCount == 1
        // the summary's orders are the decisions'; the refund taken once from the invoiced net
        attribution.summaryRows.find(row => row.marketingCampaignId == ids.runningCampaignId).orderCount == campaign.orderCount
        attribution.summaryRows.find(row => row.marketingCampaignId == ids.runningCampaignId).amounts[0].net == 100
        growth.listRows.some(row => row.contactListId == ids.gardenListId)
    }
})

feature("an order placed through a remote PASS (no local visit) is attributed by the visitor key's digest its checkout kept", {
    when() {
        // the remote frontend's checkout sent the visitor's key; the authority kept its digest where Retail's policy keeps visitor
        // keys (ShopCheckout.js freeze over MarketingTracking.js orderVisitorKeyHash), never the key itself
        const kept = system(() => tracking().orderVisitorKeyHash(VISITOR_KEY, ids.salesContactId, ids.organizationId))
        make("mantle.order.OrderHeader", {
            orderId: prefix + "_REMOTE",
            statusId: "OrderPlaced",
            placedDate: ago(1),
            currencyUomId: "USD",
            grandTotal: 80,
            orderPurposeEnumId: "OrpSalesOrder",
            marketingVisitorKeyHash: kept
        })
        make("mantle.order.OrderPart", {
            orderId: prefix + "_REMOTE",
            orderPartSeqId: "01",
            vendorPartyId: ids.organizationId,
            customerPartyId: ids.salesContactId
        })
        const decided = system(() => invoke(K + "handle#OrderPlaced", {orderId: prefix + "_REMOTE"}))
        const decisions = system(() =>
            Array.from(
                ec.entity
                    .find("mantle.marketing.tracking.MarketingOutcomeLink")
                    .condition({orderId: prefix + "_REMOTE"})
                    .list()
            )
        )
        return {kept, decided, decisions}
    },
    then({kept, decided, decisions}) {
        kept == tracking().visitorKeyHash(VISITOR_KEY) && kept != VISITOR_KEY
        decisions.length == 1 && decisions[0].outcomeLinkId == decided.outcomeLinkId
        decisions[0].basisEnumId == "MobTrackingEvent" && decisions[0].marketingCampaignId == ids.runningCampaignId
        decisions[0].trackingEventId == prefix + "_EV_CLICK" || decisions[0].trackingEventId == prefix + "_EV_PAGE"
    }
})

feature(
    "an Insights reader with the report permission opens Campaign performance from the catalog; one without it does not see it",
    {
        when() {
            const entriesOf = user =>
                asUser(user, () =>
                    Array.from(invoke("ironstone.insights.RegistryServices.find#Reports", {}).reports || []).map(
                        row => row.entryId
                    )
                )
            return {
                system: entriesOf(users.system),
                insightsReader: entriesOf("insights.reader"),
                page: asUser(users.analyst, () => page("Reports/CampaignPerformance", {organizationPartyId: ids.organizationId}))
            }
        },
        then({system, insightsReader, page}) {
            system.includes("Marketing.CampaignPerformance")
            !insightsReader.includes("Marketing.CampaignPerformance")
            page.status == 200 && page.errors.length == 0
            page.output.includes("Spring garden launch")
        }
    }
)
