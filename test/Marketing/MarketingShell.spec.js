// Marketing's calendar and shell providers (impl-marketing P21; design-marketing §3 Calendar, §1.3 CX-ASSIST and the Comms hooks, §14.3
// Today, palette and QuickCreate): Calendar's one qvue render and its events transition (the demo running campaign's window, its
// scheduled send opening SendDetail, its webinar an event), a send refused by the calendar's drag; the root's providers (quick create's
// send, Today, record-lookup, call-context, the answer actions); Today with a failing provider named and Marketing's answered; the
// palette, record-lookup and call-context answering a Marketing user with no address or token in any row, another organization's user
// shown nothing; follow-up 9: the events manager, who may not open SendDetail, sees the send unlinked in the calendar, the links of Home
// (sharedLinks) and the Comms card, and the palette finds no send for them. The schedule's rules are Mantle's (test/marketing/MarketingCalendar); the walk is the acceptance
// MarketingCalendarWalk.
// Run: ./moq test mr-boss --spec MarketingShell
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const {ids, users, asUser, invoke, page, system, shell} = lib
const C = "ironstone.marketing.ContextServices."
const CAMPAIGN = "mantle.marketing.campaign.MarketingCampaign"
const SEND = "mantle.marketing.campaign.CampaignSend"
const REGISTRATION = "mantle.work.registration.EventRegistration"
const prefix = "MKSHELL"
const callerNumber = {countryCode: "1", areaCode: "801", contactNumber: "555-0142"}
const day = millis => ec.l10n.format(new Date(millis), "yyyy-MM-dd")
const dayMs = 24 * 60 * 60 * 1000
// a range of days around a record's own date (the demo's campaign, send and event dates are relative to the load)
const around = millis => ({start: day(millis - dayMs), end: day(millis + dayMs)})
const entityLib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const stamp = (entity, fields, field) => system(() => entityLib.ms(ec.entity.find(entity).condition(fields).one()[field]))
// JSON of a transition's answer as the user (the calendar's transitions answer JSON)
const transition = (user, path, parameters) => asUser(user, () => page(path, parameters, "qvt"))
const json = result => {
    try {
        return JSON.parse(result.output)
    } catch (error) {
        return {unreadable: result.output.substring(0, 200)}
    }
}
const make = (entity, values) =>
    ec.service
        .sync()
        .name("create#" + entity)
        .parameters(values)
        .call()

spec({
    setupSpec() {
        // a caller with a phone number and an upcoming registration for the demo webinar (call-context)
        system(() => {
            make("mantle.party.Party", {partyId: prefix + "_CALLER", partyTypeEnumId: "PtyPerson"})
            make("mantle.party.Person", {partyId: prefix + "_CALLER", firstName: "Shell", lastName: "Caller"})
            make("mantle.party.contact.ContactMech", {
                contactMechId: prefix + "_PHONE",
                contactMechTypeEnumId: "CmtTelecomNumber"
            })
            make("mantle.party.contact.TelecomNumber", Object.assign({contactMechId: prefix + "_PHONE"}, callerNumber))
            make("mantle.party.contact.PartyContactMech", {
                partyId: prefix + "_CALLER",
                contactMechId: prefix + "_PHONE",
                contactMechPurposeId: "PhonePrimary",
                fromDate: new Date(Date.now() - 60000)
            })
            make(REGISTRATION, {
                registrationId: prefix + "_REG",
                registrationPolicyId: ids.webinarOfferId,
                ticketTypeId: ids.webinarTicketId,
                attendeePartyId: prefix + "_CALLER",
                statusId: "EvrConfirmed",
                createdDate: new Date()
            })
        })
    },
    cleanupSpec() {
        system(() => {
            for (const [entity, fields] of [
                [REGISTRATION, {registrationId: prefix + "_REG"}],
                ["mantle.party.contact.PartyContactMech", {partyId: prefix + "_CALLER"}],
                ["mantle.party.contact.TelecomNumber", {contactMechId: prefix + "_PHONE"}],
                ["mantle.party.contact.ContactMech", {contactMechId: prefix + "_PHONE"}],
                ["mantle.party.Person", {partyId: prefix + "_CALLER"}],
                ["mantle.party.Party", {partyId: prefix + "_CALLER"}]
            ])
                ec.entity.find(entity).condition(fields).deleteAll()
        })
    }
})

feature("Calendar renders its component and shows the campaign's window, its scheduled send and its event; a send never moves", {
    when() {
        const qvue = asUser(users.author, () => page("Calendar", {}, "qvue"))
        const campaignFrom = stamp(CAMPAIGN, {marketingCampaignId: ids.runningCampaignId}, "fromDate")
        // the running campaign's window as loaded (follow-up 6: load#CampaignDatesDemo, 14 days before the load day to 77 after)
        const campaignThru = stamp(CAMPAIGN, {marketingCampaignId: ids.runningCampaignId}, "thruDate")
        const campaignWindow = {fromDays: (Date.now() - campaignFrom) / dayMs, thruDays: (campaignThru - Date.now()) / dayMs}
        const sendAt = stamp(SEND, {campaignSendId: ids.scheduledSendId}, "scheduledDate")
        const eventAt = stamp("mantle.work.effort.WorkEffort", {workEffortId: ids.webinarEventId}, "estimatedStartDate")
        const events = range => json(transition(users.author, "Calendar/calendarEvents", range)).eventList || []
        const all = [].concat(events(around(campaignFrom)), events(around(sendAt)), events(around(eventAt)))
        // another organization's author (Services) over the same days: none of Retail's items (P21 review)
        const otherEvents = range => json(transition(users.otherAuthor, "Calendar/calendarEvents", range)).eventList || []
        const other = [].concat(otherEvents(around(sendAt)), otherEvents(around(eventAt)))
        // follow-up 9: the events manager, who may not open SendDetail, sees the send unlinked
        const eventsSend = (json(transition(users.events, "Calendar/calendarEvents", around(sendAt))).eventList || []).find(
            item => item.key === "send|" + ids.scheduledSendId
        )
        const moved = transition(users.author, "Calendar/moveEvent", {
            workEffortId: ids.scheduledSendId,
            start: day(sendAt + 2 * dayMs),
            allDay: "true"
        })
        const agenda = asUser(users.author, () => page("CalendarTui", {date: day(sendAt - dayMs)}, "html"))
        return {
            qvue,
            campaign: all.find(item => item.key === "campaign|" + ids.runningCampaignId),
            send: all.find(item => item.key === "send|" + ids.scheduledSendId),
            event: all.find(item => item.kind === "event" && item.workEffortId === ids.webinarEventId),
            otherCampaign: all.some(item => item.key === "campaign|" + ids.servicesCampaignId),
            otherSees: other.filter(
                item =>
                    item.key === "send|" + ids.scheduledSendId ||
                    item.key === "campaign|" + ids.runningCampaignId ||
                    item.workEffortId === ids.webinarEventId
            ).length,
            moved,
            agenda,
            campaignWindow,
            eventsSend
        }
    },
    then({qvue, campaign, send, event, otherCampaign, otherSees, moved, agenda, campaignWindow, eventsSend}) {
        campaignWindow.fromDays > 13.5 &&
            campaignWindow.fromDays < 16 &&
            campaignWindow.thruDays > 75 &&
            campaignWindow.thruDays < 78
        qvue.status == 200 && qvue.output.includes("module.exports")
        campaign.allDay == true && campaign.canEdit == false
        campaign.url == "/qapps/Marketing/Campaigns/CampaignDetail?marketingCampaignId=" + ids.runningCampaignId
        send.canEdit == false
        send.url == "/qapps/Marketing/Sends/SendDetail?campaignSendId=" + ids.scheduledSendId
        eventsSend.title.includes("Garden newsletter, December") && eventsSend.url == null
        event.url == "/qapps/Marketing/Events/EventDetail?workEffortId=" + ids.webinarEventId
        !otherCampaign
        otherSees == 0
        // the drag of a send is refused before any event service runs
        moved.errors.join(" ").includes("RECORD_UNAVAILABLE")
        agenda.status == 200 && agenda.errors.length == 0
        agenda.output.includes("Campaign calendar:") && agenda.output.includes("Garden newsletter, December")
    }
})

feature("the root's providers: quick create's send, Today, the Comms hooks and the answer actions", {
    when() {
        const author = shell(users.author)
        const text = JSON.stringify(author.providers || {})
        const quickSend = asUser(users.author, () =>
            page("QuickCreate/NewSend", {recordEntity: CAMPAIGN, recordId: ids.runningCampaignId}, "html")
        )
        const readerSend = asUser(users.reader, () => page("QuickCreate/NewSend", {}, "html"))
        return {text, keys: author.providers, quickSend, readerSend}
    },
    then({text, quickSend, readerSend}) {
        text.includes("marketingSend") && text.includes("Marketing/QuickCreate/NewSend")
        text.includes("ironstone.marketing.ContextServices.get#TodayItems")
        text.includes("Log as note") && text.includes("Marketing/LogNote") && text.includes("Send as message")
        text.includes("g k")
        quickSend.status == 200 && quickSend.errors.length == 0
        quickSend.output.includes("A send of the campaign Spring garden launch")
        readerSend.output.includes("You do not write sends in Marketing.")
    }
})

feature("Today: a failing provider is named and Marketing's is answered; no address or token in its items", {
    when() {
        // Commons' Today as the shell calls it for the dispatcher (its own grant aside: the providers are what is checked)
        const today = asUser(users.dispatch, () =>
            system(() =>
                invoke("mantle.work.WorkEffortServices.get#UserTodayItems", {
                    sourceServiceNames: [
                        {service: C + "get#TodayItems", label: "Marketing"},
                        {service: "ironstone.marketing.ContextServices.get#NoSuchTodayItems", label: "Broken"}
                    ]
                })
            )
        )
        const own = asUser(users.dispatch, () => invoke(C + "get#TodayItems", {}))
        // another app's user, the grant aside: the service's own rule answers nothing
        const other = asUser(users.otherApp, () => system(() => invoke(C + "get#TodayItems", {})))
        return {today, own, other}
    },
    then({today, own, other}) {
        Array.from(today.sourceGroups).some(group => group.label === "Marketing" && Array.isArray(Array.from(group.items)))
        Array.from(today.failedSources).map(failure => failure.label) == ["Broken"]
        own.label == "Marketing"
        !JSON.stringify(own.items).includes("@") && !/token/i.test(JSON.stringify(own.items))
        Array.from(own.items).every(item => !item.url || item.url.startsWith("/qapps/Marketing/"))
        Array.from(other.items).length == 0
    }
})

feature(
    "the palette, record-lookup and call-context answer a Marketing user, no address or token; another organization's user nothing",
    {
        when() {
            const palette = asUser(users.author, () => invoke(C + "search#Records", {text: "Garden newsletter", limit: 10}).rows)
            const otherPalette = asUser(
                users.otherAuthor,
                () => invoke(C + "search#Records", {text: "Garden newsletter", limit: 10}).rows
            )
            const info = user =>
                asUser(user, () =>
                    invoke(C + "lookup#Records", {
                        operation: "info",
                        records: [
                            {recordEntityName: CAMPAIGN, recordId: ids.runningCampaignId},
                            {recordEntityName: SEND, recordId: ids.scheduledSendId}
                        ]
                    })
                )
            const links = asUser(users.author, () =>
                invoke(C + "lookup#Records", {
                    operation: "links",
                    body: "See /qapps/Marketing/Sends/SendDetail?campaignSendId=" + ids.scheduledSendId + " today"
                })
            )
            const registrationCard = asUser(users.events, () =>
                invoke(C + "lookup#Records", {operation: "card", recordEntityName: REGISTRATION, recordId: prefix + "_REG"})
            )
            // follow-up 9: a send is linked (Home's Upcoming by sharedLinks, the palette, the Comms card) only for who may open SendDetail
            const sendLinks = user =>
                asUser(
                    user,
                    () => invoke(C + "get#SharedContext", {appRoot: "Marketing"}).sharedLinks["Sends/SendDetail"] || null
                )
            const eventsPalette = asUser(
                users.events,
                () => invoke(C + "search#Records", {text: "Garden newsletter", limit: 10}).rows
            )
            // the review: Approvals' and Automations' places only for their areas' users (the events manager neither, the author Automations)
            const places = user =>
                asUser(user, () => {
                    const place = ec.resource.script("component://mr-boss/service/ironstone/marketing/Marketing.js").placesFor("Marketing")
                    return {
                        approvals: place("marketingApprovals"),
                        automation: place("marketingAutomation", "marketingAutomationId", "X"),
                        campaign: place("marketingCampaign", "marketingCampaignId", "X")
                    }
                })
            const number = "+1801" + callerNumber.contactNumber.replace(/\D/g, "")
            const call = user => asUser(user, () => invoke(C + "get#CallContext", {number}))
            return {
                palette: Array.from(palette || []),
                otherPalette: Array.from(otherPalette || []),
                author: info(users.author),
                otherAuthor: info(users.otherAuthor),
                links,
                registrationCard,
                events: call(users.events),
                reader: call(users.reader),
                eventsInfo: info(users.events),
                eventsPalette: Array.from(eventsPalette || []),
                authorSendLink: sendLinks(users.author),
                eventsSendLink: sendLinks(users.events),
                eventsPlaces: places(users.events),
                authorPlaces: places(users.author)
            }
        },
        then({
            palette,
            otherPalette,
            author,
            otherAuthor,
            links,
            registrationCard,
            events,
            reader,
            eventsInfo,
            eventsPalette,
            authorSendLink,
            eventsSendLink,
            eventsPlaces,
            authorPlaces
        }) {
            eventsPlaces.approvals == null && eventsPlaces.automation == null && eventsPlaces.campaign != null
            authorPlaces.approvals == null && authorPlaces.automation == "/qapps/Marketing/Automations/AutomationDetail?marketingAutomationId=X"
            authorSendLink == "//Marketing/Sends/SendDetail" && eventsSendLink == null
            !eventsPalette.some(row => row.recordEntity === SEND)
            const eventsCard = Array.from(eventsInfo.recordList).find(row => row.recordId === ids.scheduledSendId)
            eventsCard.visible && eventsCard.url == null
            palette.some(row => row.recordEntity === SEND && row.recordId === ids.scheduledSendId)
            !otherPalette.some(row => row.recordId === ids.scheduledSendId)
            !JSON.stringify(palette).includes("@") && !/token/i.test(JSON.stringify(palette))
            Array.from(author.recordList)
                .map(row => row.recordId)
                .sort() == [ids.runningCampaignId, ids.scheduledSendId].sort()
            Array.from(author.recordList).every(row => row.visible && row.url.startsWith("/qapps/Marketing/"))
            Array.from(otherAuthor.recordList).length == 0
            Array.from(links.recordList).map(row => row.id) == [ids.scheduledSendId]
            registrationCard.card.title.includes(prefix + "_REG") && !registrationCard.card.title.includes("Caller")
            Array.from(events.recordList).length == 1
            events.recordList[0].url == "/qapps/Marketing/Events/RegistrationDetail?registrationId=" + prefix + "_REG"
            !JSON.stringify(events.recordList).includes("Caller") && !JSON.stringify(events.recordList).includes("@")
            Array.from(reader.recordList).length == 0
        }
    }
)
