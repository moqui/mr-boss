// Marketing P17's "usable when" (impl-marketing P17; design-marketing §9 RegistrationSetup's order rules, Registrations,
// RegistrationDetail, §13 Register and Registration; scenario 13), as an acceptance scenario through PASS's operations and the BOSS
// screens' transitions: a visitor registers free for the demo webinar and its ticket carries the video link; two visitors race for an
// offer's last seat and one is waitlisted; a paid registration of a storeless seller is confirmed on the gateway's verified result
// with tax from the organization's gateway and no store; an events manager cancels it from RegistrationDetail, its refund shows pending
// from Accounting and the waitlisted attendee is offered the place; and for an organization whose Sales approval setting is on, a paid
// registration shows pending with its place held until the order is approved, and then shows its ticket. The demo webinar is
// Retail's (ZIZI_SHOP, published here for the walk); the paid offers are of scenario organizations with a hosted test gateway, since
// Retail keeps no accounting preference of its own to name a tax gateway on (impl-marketing P17's Built note). The rules are Mantle's
// EventRegistrations, the renders MarketingRegistrations and mr-pass's MarketingRegistration.
// Run: ./moq accept mr-boss --spec MarketingRegistrationScenario
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const mantle = ec.resource.script("component://mr-mantle/test/marketing/MarketingSpecLib.js")
const {ids, users, asUser, system} = lib
const entityLib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const PORTAL = "mantle.marketing.MarketingPortalServices."
const prefix = "MKRS"
const dayMs = 86400000
const start = Date.now() + 6 * dayMs
const state = {}
const capture = ec.factory.getTool("MailCapture")
let keys = 0
const key = () => prefix + "k" + ++keys + "x" + Math.floor(Math.random() * 1e9)
const one = (entity, fields) => system(() => ec.entity.find(entity).condition(fields).one())
const all = (entity, fields) => system(() => Array.from(ec.entity.find(entity).condition(fields).list()))
function visitor(service, input) {
    logout()
    try {
        return ec.service
            .sync()
            .throwOnError(true)
            .name(PORTAL + service)
            .parameters({input})
            .call().result
    } catch (error) {
        ec.message.clearErrors()
        return {kind: error.moquiErrorKind || "error", message: String(error.message)}
    } finally {
        login("john.doe")
    }
}
const reserve = (siteId, registrationPolicyId, ticketTypeId, email) =>
    visitor("reserve#Registration", {
        siteId,
        registrationPolicyId,
        lines: JSON.stringify([{ticketTypeId, quantity: 1}]),
        buyerName: "Scenario buyer",
        buyerEmail: email,
        operationId: key()
    })
const complete = (siteId, token, name) =>
    visitor("complete#Registration", {siteId, token, attendees: JSON.stringify([{name}]), acceptTerms: "Y", operationId: key()})
// Pay as the page does: with the key of the amount the payment step showed (getRegistration's priceKey)
const pay = (siteId, token) =>
    visitor("start#RegistrationPayment", {
        siteId,
        token,
        priceKey: visitor("get#Registration", {siteId, token}).registration?.priceKey,
        operationId: key()
    })
const result = (siteId, token) => visitor("get#Registration", {siteId, token, returned: "true"})
function post(path, parameters) {
    const out = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Marketing.xml").render(path, parameters, "post")
    const errors = Array.from(out.errorMessages || []).join(" | ")
    ec.message.clearErrors()
    return {status: out.status, errors}
}
// a scenario organization: its site and Marketing mount, a ready notice profile, the hosted gateway, a ticket product at 40.00 and a
// published offer of one seat with a waitlist
function seller(key, approvalOn) {
    const org = prefix + "_ORG_" + key,
        site = prefix + "_SITE_" + key,
        host = key.toLowerCase() + ".mkrs.example.test"
    mantle.system(() => {
        mantle.organization(org, "Scenario " + key)
        mantle.make("mantle.ledger.config.PartyAcctgPreference", {
            organizationPartyId: org,
            baseCurrencyUomId: "USD",
            taxGatewayConfigId: "LOCAL"
        })
        ec.service
            .sync()
            .name("mantle.party.ContactServices.store#PartyContactInfo")
            .parameters({
                partyId: org,
                postalContactMechPurposeId: "PostalShippingOrigin",
                address1: "1 Garden Way",
                city: "Orem",
                stateProvinceGeoId: "USA_UT",
                postalCode: "84057",
                countryGeoId: "USA"
            })
            .disableAuthz()
            .call()
        mantle.make("mantle.other.tax.TaxAuthorityParty", {
            taxAuthorityId: prefix + "_UT",
            partyId: org,
            fromDate: 0,
            isNexus: "Y"
        })
        if (approvalOn)
            mantle.make("mantle.sales.policy.SalesPolicy", {
                salesPolicyId: prefix + "_SP_" + key,
                organizationPartyId: org,
                fromDate: new Date(Date.now() - dayMs),
                orderApprovalRequired: "Y"
            })
        mantle.make("mantle.public.PublicSite", {
            siteId: site,
            name: "Scenario " + key,
            state: "published",
            registrationMode: "closed",
            locale: "en",
            timeZone: "UTC",
            policyRevision: 1,
            generation: 1
        })
        mantle.make("mantle.public.PublicSiteHost", {hostname: host, siteId: site, canonical: "Y"})
        mantle.make("mantle.public.PublicSiteApp", {
            siteId: site,
            appMountId: "marketing",
            app: "marketing",
            pathPrefix: "/marketing",
            enabled: "Y",
            targetId: org
        })
        mantle.make("moqui.basic.email.EmailAccount", {
            emailAccountId: site + "_B",
            accountKindEnumId: "EakHosted",
            emailAddress: "bounces@bounce." + host,
            statusId: "EasActive"
        })
        mantle.make("mantle.party.MessageSendingProfile", {
            sendingProfileId: site + "_P",
            organizationPartyId: org,
            profileName: "Notices",
            channelEnumId: "MdcEmail",
            emailServerId: prefix + "_RELAY",
            fromAddress: "events@" + host,
            purposeEnumId: "MtpTransactional",
            trackingPolicyEnumId: "MtrNone",
            bounceDomain: "bounce." + host,
            fromDate: new Date(Date.now() - dayMs)
        })
        mantle.make("mantle.account.method.PaymentGatewayOrganization", {
            organizationPartyId: org,
            paymentGatewayConfigId: prefix + "_HOSTED",
            fromDate: 0,
            isEnabled: "Y"
        })
        mantle.make("mantle.product.Product", {
            productId: prefix + "_SEAT_" + key,
            productName: "Scenario seat",
            productTypeEnumId: "PtService",
            ownerPartyId: org
        })
        mantle.make("mantle.product.ProductPrice", {
            productId: prefix + "_SEAT_" + key,
            pricePurposeEnumId: "PppPurchase",
            priceTypeEnumId: "PptCurrent",
            fromDate: 0,
            minQuantity: 1,
            price: "40.00",
            priceUomId: "USD"
        })
        const workEffortId = prefix + "_EV_" + key
        mantle.make("mantle.work.effort.WorkEffort", {
            workEffortId,
            workEffortTypeEnumId: "WetEvent",
            workEffortName: "Scenario event " + key,
            statusId: "WeInPlanning",
            estimatedStartDate: new Date(start),
            estimatedCompletionDate: new Date(start + 3 * 3600000),
            location: "Scenario hall"
        })
        mantle.make("mantle.work.registration.RegistrationEvent", {
            workEffortId,
            organizationPartyId: org,
            createdDate: new Date()
        })
        mantle.make("mantle.work.registration.EventRegistrationPolicy", {
            registrationPolicyId: prefix + "_OFFER_" + key,
            workEffortId,
            occurrenceStart: new Date(start),
            occurrenceEnd: new Date(start + 3 * 3600000),
            organizationPartyId: org,
            statusId: "ErpPublished",
            publicTitle: "Scenario workshop " + key,
            timeZone: "UTC",
            siteId: site,
            totalSeats: 1,
            holdMinutes: 15,
            waitlistEnabled: "Y",
            termsText: "Scenario terms",
            questionScopeEnumId: "ErqAttendee",
            policyRevision: 1,
            termsRevision: 0,
            publishedDate: new Date()
        })
        mantle.make("mantle.work.registration.EventTicketType", {
            ticketTypeId: prefix + "_TT_" + key,
            registrationPolicyId: prefix + "_OFFER_" + key,
            ticketName: "Seat",
            priceSourceEnumId: "EtpProduct",
            productId: prefix + "_SEAT_" + key,
            perOrderLimit: 2,
            sequenceNum: 1,
            fromDate: new Date(Date.now() - dayMs)
        })
    })
    return {org, site, offer: prefix + "_OFFER_" + key, ticket: prefix + "_TT_" + key}
}

spec({
    stepwise: true,
    setupSpec() {
        capture.enable()
        mantle.system(() => {
            mantle.make("moqui.basic.email.EmailServer", {
                emailServerId: prefix + "_RELAY",
                smtpHost: "relay.mkrs.example.test",
                smtpPort: "9"
            })
            const T = "mantle.account.PaymentTestServices."
            mantle.make("mantle.account.method.PaymentGatewayConfig", {
                paymentGatewayConfigId: prefix + "_HOSTED",
                paymentGatewayTypeEnumId: "PgtTest",
                description: "Scenario hosted gateway",
                authorizeServiceName: T + "hostedPending#PaymentAuthorization",
                captureServiceName: T + "alwaysApprove#PaymentCapture",
                releaseServiceName: T + "alwaysApprove#PaymentRelease",
                refundServiceName: T + "alwaysApprove#PaymentRefund",
                detailsServiceName: T + "alwaysApprove#PaymentDetails"
            })
            mantle.make("mantle.other.tax.TaxAuthority", {
                taxAuthorityId: prefix + "_UT",
                taxAuthorityTypeEnumId: "TatState",
                taxAuthGeoId: "USA_UT",
                description: "Scenario Utah"
            })
            mantle.make("mantle.other.tax.TaxAuthorityRate", {
                taxAuthorityRateId: prefix + "_RATE",
                taxAuthorityId: prefix + "_UT",
                rateTypeEnumId: "TarSalesTax",
                taxPercentage: "6",
                fromDate: 0
            })
            // the demo site opened for the walk, as P7's and P16's walks do
            ec.service
                .sync()
                .name("update#mantle.public.PublicSite")
                .parameters({siteId: "ZIZI_SHOP", state: "published"})
                .disableAuthz()
                .call()
        })
        state.paid = seller("PAID", false)
        state.approval = seller("APPROVAL", true)
    },
    cleanupSpec() {
        capture.disable()
        login("john.doe")
    }
})

feature("a visitor registers free for the demo webinar and its ticket carries the video link", {
    when() {
        const reserved = reserve("ZIZI_SHOP", ids.webinarOfferId, ids.webinarTicketId, "webinar.mkrs@example.test")
        const done = complete("ZIZI_SHOP", reserved.token, "Scenario buyer")
        ec.factory.waitWorkerPoolEmpty(50)
        const ticket = Array.from(capture.getMessages()).find(
            m => Array.from(m.toList || []).includes("webinar.mkrs@example.test") && /Entry code/.test(String(m.body || ""))
        )
        const webinar = one("mantle.work.effort.WorkEffort", {workEffortId: ids.webinarEventId})
        return {done, ticket, webinar}
    },
    then(r) {
        r.done.registration.state == "confirmed"
        !!r.ticket && !!r.webinar.infoUrl && String(r.ticket.body).includes(r.webinar.infoUrl)
    }
})
feature("two visitors race for the last seat: one is held, the other waitlisted", {
    when() {
        state.first = reserve(state.paid.site, state.paid.offer, state.paid.ticket, "first.mkrs@example.test")
        state.second = reserve(state.paid.site, state.paid.offer, state.paid.ticket, "second.mkrs@example.test")
        return {first: state.first.registration.state, second: state.second.registration.state}
    },
    then({first, second}) {
        first == "held" && second == "waitlisted"
    }
})
feature("the paid registration confirms on the gateway's verified result, taxed by the organization's gateway with no store", {
    when() {
        complete(state.paid.site, state.first.token, "First attendee")
        const started = pay(state.paid.site, state.first.token)
        const confirmed = result(state.paid.site, state.first.token)
        const reservation = one("mantle.work.registration.EventReservation", {reservationId: state.first.registration.reference})
        const order = one("mantle.order.OrderHeader", {orderId: reservation.orderId})
        const tax = all("mantle.order.OrderItem", {orderId: reservation.orderId, itemTypeEnumId: "ItemSalesTax"})
        state.registrationId = all("mantle.work.registration.EventRegistration", {
            reservationId: reservation.reservationId
        })[0].registrationId
        return {started, confirmed, order, tax}
    },
    then(r) {
        r.started.payment.paymentState == "pending"
        r.confirmed.registration.state == "confirmed"
        !r.order.productStoreId && r.order.statusId == "OrderApproved" && r.tax.length == 1
    }
})
feature(
    "an events manager cancels it from RegistrationDetail: the refund shows pending from Accounting and the waitlisted place is offered",
    {
        when() {
            const before = one("mantle.work.registration.EventRegistration", {registrationId: state.registrationId})
            // RegistrationDetail's cancel as the instance administrator (ADMIN: every organization; the scenario organization has no
            // demo events manager)
            const cancelled = asUser("john.doe", () =>
                post("Events/RegistrationDetail/cancelRegistration", {
                    registrationId: state.registrationId,
                    expectedRevision: entityLib.ms(before.lastUpdatedStamp),
                    reason: "Cannot come"
                })
            )
            const after = one("mantle.work.registration.EventRegistration", {registrationId: state.registrationId})
            system(() => ec.service.sync().name("mantle.work.EventRegistrationServices.run#RegistrationHolds").call())
            const offered = all("mantle.work.registration.EventRegistration", {
                reservationId: state.second.registration.reference
            })[0]
            const page = visitor("get#Registration", {siteId: state.paid.site, token: state.first.token})
            return {cancelled, after, offered, page}
        },
        then(r) {
            r.cancelled.errors == ""
            r.after.statusId == "EvrCancelled" && ["ErfRequested", "ErfRefunded"].includes(r.after.refundStatusEnumId)
            r.offered.statusId == "EvrHeld"
            r.page.registration.state == "cancelled" && r.page.registration.places[0].refundText != ""
        }
    }
)
feature("with the Sales approval setting on, a paid registration shows pending with its place held until the order is approved", {
    when() {
        const reserved = reserve(state.approval.site, state.approval.offer, state.approval.ticket, "waiting.mkrs@example.test")
        complete(state.approval.site, reserved.token, "Waiting attendee")
        pay(state.approval.site, reserved.token)
        const pending = result(state.approval.site, reserved.token)
        const reservation = one("mantle.work.registration.EventReservation", {reservationId: reserved.registration.reference})
        const placed = one("mantle.order.OrderHeader", {orderId: reservation.orderId}).statusId
        // a holder of SALES_ORDER_APPROVE approves it from Sales' Awaiting approval list (approve#Order, as Sales' list does)
        const approved = asUser("john.doe", () =>
            system(() => lib.refusal("mantle.order.OrderServices.approve#Order", {orderId: reservation.orderId}))
        )
        const after = visitor("get#Registration", {siteId: state.approval.site, token: reserved.token})
        return {pending, placed, approved, after}
    },
    then(r) {
        r.placed == "OrderPlaced"
        r.pending.registration.state == "pending" &&
            !r.pending.registration.joinUrl &&
            !r.pending.registration.places[0].canShowCode
        r.approved == ""
        r.after.registration.state == "confirmed" && r.after.registration.places[0].canShowCode
    }
})
