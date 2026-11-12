// Maintenance P19's "usable when" (impl-maintenance P19; design-maintenance §1.4 Assist, Comms hooks, Sync and Meetings, §12), as an
// acceptance walk through the shell's data, the screens (the terminal client's tui renders and the transitions it posts) and the
// services, with artifact authorization on and no model: Assist offers "Summarize history" on the compressor's page, the
// equipment-history skill is retrieved for it, the compressor's Maintenance tab gives the terminal client its history and Log as
// note files a summary on it; Report a problem is driven through the terminal client from Commons and from a chat message (the
// Comms action, the message's text prefilled, the message filed on the request); the second technician's phone calendar shows next
// week's oil service in My work orders, read only, and a PUT is refused with the work order unchanged, and its .ics is offered; a
// vendor's expert invited to a video call about the work order joins the call from the invitation's link as a guest; Admin's
// Exports lists the work order and booking lists in their owner's place. The rules are Mantle's and BOSS's MaintenanceStack and
// MaintenanceAccess; the skills' retrieval is test/skill-retrieval.json.
// Run: ./moq accept mr-boss --spec MaintenanceStackWalk
const lib = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
const {ids, users, asUser, system, invoke, page, shell} = lib
const state = {}
const M = "mantle.work.MaintenanceServices."
const ASSET = "mantle.product.asset.Asset"
const MEDIA_NODE = "boss-maintenance-stack-walk"
let keySeq = 0
const key = prefix => prefix + "-" + Date.now() + "-" + ++keySeq

// A transition posted as the user under an app root: its status, errors, redirect and output.
function post(user, root, path, parameters) {
    return asUser(user, () => {
        const result = ec.screen
            .makeTest()
            .rootScreen("component://mr-boss/screen/" + root + ".xml")
            .render(path, parameters, "post")
        const errors = Array.from(result.errorMessages || [])
        ec.message.clearErrors()
        return {
            status: result.status,
            errors,
            location: String(result.header("Location") || ""),
            output: String(result.output || "")
        }
    })
}
const workOrder = workEffortId =>
    system(() => ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortId", workEffortId).one())

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        system(() => {
            // the vendor's expert: a contact of Delta Motor Rewinds with an email address and no account
            const partyId = "BOSS_MNT_WALK_VENDOR"
            if (!ec.entity.find("mantle.party.Party").condition("partyId", partyId).one()) {
                call("create#mantle.party.Party", {partyId, partyTypeEnumId: "PtyPerson"})
                call("create#mantle.party.Person", {partyId, firstName: "Dana", lastName: "Rewinds"})
                call("mantle.party.ContactServices.create#EmailAddress", {
                    partyId,
                    emailAddress: "dana.expert@deltarewinds.example",
                    contactMechPurposeId: "EmailPrimary"
                })
            }
            state.vendorPartyId = partyId
            // a CallMediaNode row stands in for a media node (as Comms' CallTarget spec), so the guest's join opens a session; no
            // media flows
            call("org.moqui.call.CallServices.register#MediaNode", {instanceId: MEDIA_NODE, mediaAddress: "127.0.0.1:10000"})
            // the planner invites by email from their own address, which the demo's planner has none of: one for the walk, put
            // back at the end
            const account = ec.entity.find("moqui.security.UserAccount").condition("userId", "BOSS_MNT_PLANNER").one()
            state.plannerEmail = account.emailAddress || null
            if (!state.plannerEmail) {
                account.emailAddress = "maint.planner@ziziwork.example"
                account.update()
            }
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        system(() => {
            for (const session of Array.from(
                ec.entity
                    .find("moqui.call.CallSession")
                    .condition("mediaNodeId", MEDIA_NODE)
                    .condition("statusId", "!=", "CssEnded")
                    .list()
            )) {
                session.statusId = "CssEnded"
                session.update()
            }
            ec.entity.find("moqui.call.CallMediaNode").condition("instanceId", MEDIA_NODE).deleteAll()
            const account = ec.entity.find("moqui.security.UserAccount").condition("userId", "BOSS_MNT_PLANNER").one()
            if (account && !state.plannerEmail) {
                account.emailAddress = null
                account.update()
            }
        })
    }
})

feature("Assist offers the compressor's history from its page, and its summary is logged as a note on the compressor", {
    when() {
        const providers = shell(users.planner).providers || {}
        // what the assist reads through the terminal client: the compressor's Maintenance tab
        const history = asUser(users.planner, () =>
            page("Equipment/EquipmentDetail/Maintenance", {assetId: ids.compressorId, lastStandalone: "true"}, "tui")
        )
        const logged = post(users.planner, "Maintenance", "LogNote/logNote", {
            entityName: ASSET,
            recordId: ids.compressorId,
            noteText: "Assist summary: oil service planned next week; a belt failure restored in October."
        })
        const notes = system(() =>
            ec.entity
                .find("mantle.party.communication.CommunicationEventRecord")
                .condition({recordEntityName: ASSET, recordId: ids.compressorId})
                .count()
        )
        // the chip on the compressor's page and the answer actions, read off the shell's lists here (Array.from and JSON.parse in a
        // then block's condition answered [] and {})
        const historyPrompt = Array.from(providers.assistPrompts || []).some(
            prompt => String(prompt.url || "").includes("Equipment/EquipmentDetail") && /history/i.test(prompt.label)
        )
        const actionLabels = Array.from(providers.responseActions || []).map(action => String(action.label))
        return {historyPrompt, actionLabels, history, logged, notes}
    },
    then({historyPrompt, actionLabels, history, logged, notes}) {
        historyPrompt == true
        actionLabels.includes("Log as note")
        actionLabels.includes("Send as message")
        history.errors.length == 0
        history.output.includes(ids.plannedOrderId)
        !history.output.includes("$")
        logged.errors.length == 0
        notes > 0
    }
})

feature("Report a problem is driven through the terminal client, from Commons and from a chat message", {
    when() {
        // from the compressor's page: the terminal client renders the form with the equipment, then submits it
        const form = asUser(users.requester, () =>
            page("ReportProblem", {recordEntity: ASSET, recordId: ids.compressorId}, "tui", "Commons")
        )
        const reported = post(users.requester, "Commons", "ReportProblem/reportProblem", {
            targetKey: "asset:" + ids.compressorId,
            summary: "Compressor C-1 rattles at start",
            priority: "5",
            operationKey: key("stack-walk")
        })
        // from a chat message: the Comms action opens Report a problem with the message's text
        const room = asUser(users.requester, () => {
            ec.artifactExecution.disableAuthz()
            const made = invoke("org.moqui.chat.ChatServices.create#Room", {
                roomTypeEnumId: "CrtPrivate",
                roomName: "Plant floor"
            })
            const sent = invoke("org.moqui.chat.ChatServices.send#Message", {
                chatRoomId: made.chatRoomId,
                body: "<p>Room 101's projector will not turn on</p><p>Tried the remote and the wall switch</p>"
            })
            return {chatRoomId: made.chatRoomId, eventSeq: sent.eventSeq}
        })
        const actions = asUser(users.requester, () => {
            const result = ec.screen
                .makeTest()
                .rootScreen("component://webroot/screen/webroot.xml")
                .render("extItems/apps/Comms/Chat", {}, null)
            ec.message.clearErrors()
            return result.status == 200 ? Array.from(JSON.parse(String(result.output)).actions || []) : []
        })
        const prefilled = asUser(users.requester, () => page("Chat/ReportProblem", room, "tui", "Comms"))
        const fromChat = post(users.requester, "Comms", "Chat/ReportProblem/reportProblem", {
            targetKey: "facility:" + ids.managedRoomId,
            summary: "Room 101's projector will not turn on",
            description: "Tried the remote and the wall switch",
            priority: "5",
            operationKey: key("stack-walk-chat"),
            sourceChatRoomId: room.chatRoomId,
            sourceEventSeq: room.eventSeq
        })
        const chatRequestId = JSON.parse(fromChat.output || "{}").requestId
        const filed = system(() =>
            ec.entity
                .find("mantle.request.RequestCommEvent")
                .condition("requestId", chatRequestId || "_NA_")
                .count()
        )
        const reportedRequestId = JSON.parse(reported.output || "{}").requestId
        return {form, reported, reportedRequestId, actions, prefilled, fromChat, chatRequestId, filed}
    },
    then({form, reported, reportedRequestId, actions, prefilled, fromChat, chatRequestId, filed}) {
        form.errors.length == 0
        form.output.includes("What is wrong")
        reported.errors.length == 0
        !!reportedRequestId
        actions.some(action => action.name == "maintenance.reportProblem" && action.kind == "screen")
        prefilled.errors.length == 0
        prefilled.output.includes("Room 101's projector will not turn on")
        prefilled.output.includes("Plant floor")
        fromChat.errors.length == 0
        !!chatRequestId
        filed == 1
    }
})

feature("the technician's phone calendar shows next week's work order read only; a change is refused and its .ics is offered", {
    when() {
        const start = Date.parse("2026-11-16T00:00:00Z"),
            end = Date.parse("2026-11-23T00:00:00Z")
        const phone = asUser(users.tech2, () => {
            ec.artifactExecution.disableAuthz()
            const collection = Array.from(invoke("mantle.work.CalendarDavServices.get#DavCollections").collectionList || []).find(
                row => row.collectionId === "projected-MaintenanceMyWork"
            )
            const objects = Array.from(
                invoke("mantle.work.CalendarDavServices.get#DavObjects", {
                    collectionId: "projected-MaintenanceMyWork",
                    withData: true,
                    start,
                    end
                }).objectList || []
            )
            const put = invoke("mantle.work.CalendarDavServices.put#DavObject", {
                collectionId: "projected-MaintenanceMyWork",
                objectName: "maintenance-work-" + ids.plannedOrderId + ".ics",
                data: "BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:maintenance-work-x\r\nSUMMARY:Moved\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n"
            })
            return {collection, objects, put}
        })
        const ics = asUser(users.tech2, () => {
            const result = ec.screen
                .makeTest()
                .rootScreen("component://mr-boss/screen/Maintenance.xml")
                .render("WorkOrders/WorkOrderDetail/calendarFile", {workEffortId: ids.plannedOrderId}, null)
            ec.message.clearErrors()
            return String(result.output || "")
        })
        return {phone, ics, order: workOrder(ids.plannedOrderId)}
    },
    then({phone, ics, order}) {
        phone.collection.readOnly == true
        phone.objects.some(object =>
            object.data.includes("Work order " + ids.plannedOrderId + ": Compressor 500-hour oil service")
        )
        phone.put.status == 403
        order.statusId == "WeApproved"
        order.workEffortName == "Compressor 500-hour oil service"
        ics.includes("BEGIN:VCALENDAR")
        ics.includes("SUMMARY:Work order " + ids.plannedOrderId)
    }
})

feature("a vendor's expert invited to a video call about the work order joins it from the invitation's link", {
    when() {
        const added = post(users.planner, "Maintenance", "WorkOrders/WorkOrderDetail/addVideoCall", {
            workEffortId: ids.plannedOrderId,
            attendeePartyId: state.vendorPartyId,
            startDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
            durationMinutes: "30",
            note: "Please look at the oil pump's seal with us",
            operationKey: key("stack-walk-call")
        })
        const event = system(() =>
            Array.from(
                ec.entity
                    .find("mantle.work.effort.WorkEffortAssoc")
                    .condition({workEffortId: ids.plannedOrderId, workEffortAssocTypeEnumId: "WeatRelatesTo"})
                    .orderBy("-fromDate")
                    .list()
            )
                .map(row => ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortId", row.toWorkEffortId).one())
                .find(row => row && row.workEffortTypeEnumId === "WetEvent")
        )
        const invited = system(() =>
            ec.entity
                .find("mantle.work.effort.WorkEffortParty")
                .condition({workEffortId: event?.workEffortId || "_NA_", partyId: state.vendorPartyId})
                .one()
        )
        // the guest follows the link of the invitation: /call/<token>
        const token = String(event?.infoUrl || "").split("/call/")[1] || ""
        const checked = system(() => invoke("org.moqui.call.CallServices.check#CallLinkToken", {token}))
        const joined = system(() => invoke("org.moqui.call.CallServices.join#AsGuest", {token, displayName: "Dana Rewinds"}))
        return {added, event, invited, checked, joined}
    },
    then({added, event, invited, checked, joined}) {
        added.errors.length == 0
        event.infoUrl.includes("/call/")
        event.workEffortName.includes(ids.plannedOrderId)
        invited.statusId == "WeptOffered"
        invited.invitationSentDate != null
        checked.valid == true
        !!joined.callSessionId
        joined.reasonCode == null
    }
})

feature("Admin's Exports lists the work order and booking lists in Maintenance's own place", {
    when() {
        const targets = Array.from(
            asUser("admin.data", () => invoke("org.moqui.admin.DataTransferServices.find#ExportRuns").targetList || [])
        )
        // each target's id and owner route, as then reads them (a block's value reaches then only as an object)
        return {routes: targets.map(target => target.targetId + " " + target.ownerRoute)}
    },
    then({routes}) {
        routes.includes("maintenanceWorkOrderList maintenanceWorkOrders")
        routes.includes("maintenanceBookingList maintenanceBookingRequests")
    }
})
