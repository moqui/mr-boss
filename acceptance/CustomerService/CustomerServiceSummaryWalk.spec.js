// The case summary print (design-customer-service §11 "Case summary PDF/text", impl-customer-service P16), an acceptance walk
// through Cases/CaseSummary and its transition with artifact authorization on: on Joe Q Public's thermostat case with an agent's
// internal note and internal file added, the customer copy (qvt, and html-print with no controls) holds the case's outward
// messages and none of the note or file, the internal summary holds them, each labeled; CaseDetail's More menu links the
// summary; Send to the customer stores the customer copy as the case's RequestContent and mails it to Joe, a retry of the same
// operation answers the first, an address that is not the customer's is refused, and a reader may not send. The rules are
// Mantle's SupportPortal spec (the variants). Run: ./moq accept mr-boss --spec CustomerServiceSummaryWalk
const lib = ec.resource.script("component://mr-boss/test/CustomerService/CustomerServiceSpecLib.js")
const {ids, users, asUser, system, invoke} = lib
const webroot = "component://webroot/screen/webroot.xml"
const capture = ec.factory.getTool("MailCapture")
const rows = (entity, conditions) => system(() => Array.from(ec.entity.find(entity).condition(conditions).list()))
const requestId = ids.thermostatCaseId
const stamp = ec.l10n.format(ec.user.nowTimestamp, "HHmmssSSS")
const NOTE = "P16 summary walk internal note " + stamp
const FILE = "p16-internal-" + stamp + ".pdf"
const state = {}

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
const page = (user, parameters, mode = "qvt") => asUser(user, () => lib.page("Cases/CaseSummary", parameters, mode))

spec({
    setupSpec() {
        capture.enable()
        system(() => {
            state.noteId = invoke("create#mantle.party.communication.CommunicationEvent", {
                communicationEventTypeId: "Comment",
                statusId: "CeReceived",
                fromPartyId: "BOSS_CS_AGENT",
                body: NOTE,
                entryDate: ec.user.nowTimestamp
            }).communicationEventId
            invoke("create#mantle.request.RequestCommEvent", {requestId, communicationEventId: state.noteId})
            state.fileId = invoke("create#mantle.request.RequestContent", {
                requestId,
                contentTypeEnumId: "RqCntInternal",
                contentLocation: "dbresource://boss/p16/" + FILE,
                contentDate: ec.user.nowTimestamp
            }).requestContentId
        })
    },
    cleanupSpec() {
        // the note, the internal file and the stored summaries go, so other specs read Joe's case as before
        system(() => {
            const remove = (entity, conditions) => ec.entity.find(entity).condition(conditions).deleteAll()
            remove("mantle.request.RequestCommEvent", {requestId, communicationEventId: state.noteId})
            remove("mantle.party.communication.CommunicationEvent", {communicationEventId: state.noteId})
            remove("mantle.request.RequestContent", {requestContentId: state.fileId})
            remove("mantle.request.RequestContent", {requestId, contentTypeEnumId: "RqCntCaseSummary"})
        })
        capture.reset()
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "the customer copy holds no note or internal file; the internal summary holds both; each is labeled and linked from the case",
    {
        when() {
            return {
                customer: page(users.agent, {requestId}),
                printed: page(users.agent, {requestId, renderMode: "html-print"}, "html-print"),
                internal: page(users.agent, {requestId, audience: "internal"}),
                detail: asUser(users.agent, () => lib.page("Cases/CaseDetail", {requestId}, "html")),
                twin: page(users.agent, {requestId}, "tui"),
                other: page(users.services, {requestId})
            }
        },
        then({customer, printed, internal, detail, twin, other}) {
            customer.errors == []
            customer.output.includes("Customer copy")
            customer.output.includes("Thermostat shows the wrong temperature")
            !customer.output.includes(NOTE)
            !customer.output.includes(FILE)
            customer.output.includes("Send to the customer")
            printed.errors == []
            printed.output.includes("Customer copy")
            !printed.output.includes("Send to the customer")
            !printed.output.includes(NOTE)
            internal.errors == []
            internal.output.includes("Internal: not for the customer")
            internal.output.includes(NOTE)
            internal.output.includes(FILE)
            detail.output.includes("Case summary")
            twin.output.includes("Customer copy of case " + requestId)
            other.output.includes("is not available")
            !other.output.includes("Thermostat shows the wrong temperature")
        }
    }
)

feature(
    "Send to the customer stores the customer copy on the case and mails Joe once; another address and a reader are refused",
    {
        when() {
            capture.clear()
            const key = "p16-summary-" + stamp
            const send = (user, toAddress, operationKey = key) =>
                post(user, "Cases/CaseSummary/sendSummary", {
                    requestId,
                    toAddress,
                    emailAccountId: ids.serviceMailAccountId,
                    note: "The summary of your case.",
                    operationKey
                })
            const first = send(users.agent, "joe@public.com")
            const retry = send(users.agent, "joe@public.com")
            const stranger = send(users.agent, "someone@example.com", key + "-stranger")
            const reader = send(users.read, "joe@public.com", key + "-reader")
            const stored = rows("mantle.request.RequestContent", {requestId, contentTypeEnumId: "RqCntCaseSummary"})
            const mails = rows("moqui.basic.email.EmailMessage", {toAddresses: "joe@public.com"}).filter(row =>
                String(row.subject || "").includes("Case summary " + requestId)
            )
            return {first, retry, stranger, reader, stored, mails}
        },
        then({first, retry, stranger, reader, stored, mails}) {
            first.errors == ""
            retry.errors == ""
            stored.length == 1
            stored[0].contentLocation.endsWith("Case-" + requestId + ".pdf")
            mails.length == 1
            stranger.errors.includes("RECIPIENT_UNCHECKED")
            reader.errors.includes("PERMISSION_DENIED") || reader.errors.includes("not available")
        }
    }
)
