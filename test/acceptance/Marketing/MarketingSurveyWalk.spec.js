// Marketing P12's "usable when" (impl-marketing P12; design-marketing §16.3 scenarios 11, its form half, and 12, historical responses),
// as an acceptance walk through the screens' transitions with artifact authorization on: marketing.author builds a survey, publishes
// its questions, publishes it by invitation to the running campaign's garden newsletter and makes the invitation send, which
// marketing.approver approves and marketing.dispatch releases; Maya, the newsletter's consenting member, answers from her invitation
// once (a second answer from the same link keeps nothing); an anonymous visitor answers its public publication; a later change of an
// option leaves both responses reading as submitted; and a case's feedback on the same form stays out of Marketing. The rules are
// Mantle's FormPublications and MarketingForms, the renders MarketingSurveys, the public page mr-pass's SubmitForm.
// Run: ./moq accept mr-boss --spec MarketingSurveyWalk
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const {ids, users, asUser, system} = lib
const entityLib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const F = "mantle.party.FormDefinitionServices."
const M = "mantle.marketing.MarketingFormServices."
const D = "mantle.marketing.CampaignSendServices."
const C = "mantle.marketing.CampaignServices."
const PORTAL = "mantle.marketing.MarketingPortalServices."
const capture = ec.factory.getTool("MailCapture")
const settle = () => ec.factory.waitWorkerPoolEmpty(50)
const site = "ZIZI_SHOP"
const maya = "maya.lindqvist@zizi-customers.example"
const state = {}
const key = () => "msw" + ec.user.randomString(12).replace(/[^A-Za-z0-9]/g, "x")

function post(path, parameters) {
    const result = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Marketing.xml").render(path, parameters, "post")
    const errors = Array.from(result.errorMessages || []).join(" | ")
    ec.message.clearErrors()
    return {status: result.status, errors}
}
// a service as the user, its own checks deciding
const as = (user, service, parameters) =>
    asUser(user, () => system(() => ec.service.sync().name(service).parameters(parameters).call() || {}))
const one = (entity, fields) => system(() => ec.entity.find(entity).condition(fields).one())
const all = (entity, fields) => system(() => Array.from(ec.entity.find(entity).condition(fields).list()))
const sendRevision = campaignSendId =>
    entityLib.ms(one("mantle.marketing.campaign.CampaignSend", {campaignSendId}).lastUpdatedStamp)
// a PASS operation's service as an anonymous visitor
function visitor(service, input) {
    logout()
    try {
        return ec.service
            .sync()
            .throwOnError(true)
            .name(PORTAL + service)
            .parameters({input})
            .requireNewTransaction(true)
            .call().result
    } catch (error) {
        return {kind: error.moquiErrorKind || "Error", error: String(error.message).split("\n")[0]}
    } finally {
        ec.message.clearErrors()
        login("john.doe")
    }
}

spec({
    stepwise: true,
    setupSpec() {
        capture.enable()
        login("john.doe")
        // the shop's site is published for the walk (the demo leaves it to be published)
        system(() =>
            ec.service.sync().name("update#mantle.public.PublicSite").parameters({siteId: site, state: "published"}).call()
        )
    },
    cleanupSpec() {
        settle()
        capture.reset()
    }
})

feature("an author builds a survey, publishes its questions, and publishes it by invitation and on the shop", {
    when() {
        const formId = (state.formId = as(users.author, F + "create#Form", {
            purposeEnumId: "DbfpSurvey",
            organizationPartyId: ids.organizationId,
            description: "Planting day survey"
        }).formId)
        asUser(users.author, () =>
            post("Surveys/SurveyDetail/saveField", {
                formId,
                title: "Would you come again?",
                fieldTypeEnumId: "DBFFT_radio",
                isRequired: "Y",
                optionText: "yes | Yes | 1\nno | No | 0"
            })
        )
        const published = asUser(users.author, () => post("Surveys/SurveyDetail/publishForm", {formId}))
        const stored = asUser(users.author, () =>
            post("Surveys/SurveyDistribution/storePublication", {
                formId,
                accessEnumId: "FpaInvited",
                repeatEnumId: "FprOnce",
                siteId: site,
                marketingCampaignId: ids.runningCampaignId,
                description: "Planting day, newsletter readers"
            })
        )
        state.invited = all("mantle.party.FormPublication", {formId}).find(p => p.accessEnumId === "FpaInvited")?.publicationId
        const opened = asUser(users.author, () =>
            post("Surveys/SurveyDistribution/publishPublication", {publicationId: state.invited})
        )
        const storedPublic = asUser(users.author, () =>
            post("Surveys/SurveyDistribution/storePublication", {
                formId,
                accessEnumId: "FpaAnonymous",
                repeatEnumId: "FprMany",
                siteId: site,
                marketingCampaignId: ids.runningCampaignId,
                description: "Planting day on the shop"
            })
        )
        state.anonymous = all("mantle.party.FormPublication", {formId}).find(
            p => p.accessEnumId === "FpaAnonymous"
        )?.publicationId
        const openedPublic = asUser(users.author, () =>
            post("Surveys/SurveyDistribution/publishPublication", {publicationId: state.anonymous})
        )
        return {published, stored, opened, storedPublic, openedPublic}
    },
    then(r) {
        r.published.errors === "" && r.stored.errors === "" && r.opened.errors === ""
        r.storedPublic.errors === "" && r.openedPublic.errors === ""
        state.invited != null && state.anonymous != null
        one("mantle.party.FormPublication", {publicationId: state.invited}).fromDate != null
    }
})

feature("the invitation send is approved and released apart; Maya answers from her own link once", {
    when() {
        const made = asUser(users.author, () =>
            post("Surveys/SurveyDistribution/createInvitations", {
                publicationId: state.invited,
                contactListId: ids.gardenListId,
                sendName: "Planting day survey invitation"
            })
        )
        const campaignSendId = all("mantle.marketing.campaign.CampaignSend", {formPublicationId: state.invited})[0]
            ?.campaignSendId
        as(users.author, D + "store#Send", {
            campaignSendId,
            expectedRevision: sendRevision(campaignSendId),
            sendingProfileId: ids.retailProfileId
        })
        as(users.author, D + "store#SendContent", {
            campaignSendId,
            expectedRevision: sendRevision(campaignSendId),
            subject: "Tell us about the planting day, ${firstName}",
            body: "<p>Hello ${firstName}, one question about the planting day.</p>",
            bodyText: "Hello ${firstName}, one question about the planting day.",
            variables: [{name: "firstName", label: "First name", fallback: "gardener"}]
        })
        as(users.author, D + "prepare#Send", {campaignSendId, expectedRevision: sendRevision(campaignSendId)})
        const targetRevision = Number(one("mantle.marketing.campaign.CampaignSend", {campaignSendId}).sendRevision)
        as(users.author, C + "request#MarketingApproval", {targetKind: "send", targetId: campaignSendId, targetRevision})
        as(users.approver, C + "decide#MarketingApproval", {
            targetKind: "send",
            targetId: campaignSendId,
            targetRevision,
            decision: "approve"
        })
        capture.clear()
        as(users.dispatch, D + "release#Send", {campaignSendId, expectedRevision: sendRevision(campaignSendId)})
        settle()
        system(() =>
            ec.service
                .sync()
                .name(D + "dispatch#Send")
                .parameters({campaignSendId})
                .call()
        )
        const mail = Array.from(capture.getMessages()).find(m => Array.from(m.toList || []).includes(maya)) || {}
        const token = decodeURIComponent(/SubmitForm\?token=([A-Za-z0-9_%-]+)/.exec(String(mail.body || ""))?.[1] || "")
        const scanned = visitor("get#Form", {siteId: site, token})
        const fieldName = one("moqui.screen.form.DbFormField", {formId: state.formId})?.fieldName
        const answered = visitor("submit#Form", {siteId: site, token, values: {[fieldName]: "yes"}, operationId: key()})
        const again = visitor("submit#Form", {siteId: site, token, values: {[fieldName]: "no"}, operationId: key()})
        state.invitedSubmissions = all("mantle.party.FormSubmission", {publicationId: state.invited})
        return {made, token, scanned, answered, again, submissions: state.invitedSubmissions}
    },
    then(r) {
        r.made.errors === ""
        r.token.length > 0
        r.scanned.form.access === "invited"
        // a second answer from the same link answers the same receipt and keeps nothing
        r.answered.receipt != null && r.again.receipt?.message === r.answered.receipt.message
        r.submissions.length === 1 && r.submissions[0].partyId === ids.acceptedPartyId
    }
})

feature(
    "an anonymous visitor answers the public form; a later option change leaves both responses as submitted; no case feedback",
    {
        when() {
            const fieldName = one("moqui.screen.form.DbFormField", {formId: state.formId}).fieldName
            const anonymous = visitor("submit#Form", {
                siteId: site,
                publicationId: state.anonymous,
                values: {[fieldName]: "yes"},
                operationId: key()
            })
            // later: "Yes" becomes "Yes, gladly", scored 2
            asUser(users.author, () =>
                post("Surveys/SurveyDetail/saveField", {
                    formId: state.formId,
                    fieldName,
                    title: "Would you come again?",
                    fieldTypeEnumId: "DBFFT_radio",
                    isRequired: "Y",
                    optionText: "yes | Yes, gladly | 2\nno | No | 0"
                })
            )
            // a case's feedback on the same form, outside every Marketing publication
            const caseResponse = system(() => {
                const formResponseId = ec.service
                    .sync()
                    .name("org.moqui.impl.ScreenServices.create#FormResponse")
                    .parameters({formId: state.formId, responseMap: {[fieldName]: "no"}})
                    .call().formResponseId
                ec.service
                    .sync()
                    .name("create#mantle.party.FormInvitation")
                    .parameters({
                        formId: state.formId,
                        organizationPartyId: ids.organizationId,
                        partyId: ids.pendingPartyId,
                        recordEntityName: "mantle.request.Request",
                        recordId: "MKT_SURVEY_WALK_CASE",
                        invitationKey: "msw:case",
                        statusEnumId: "FinResponded",
                        formResponseId
                    })
                    .call()
                return formResponseId
            })
            const responses = as(users.audience, M + "find#Responses", {formId: state.formId})
            const answers = responses.rows.map(
                row => as(users.audience, M + "get#Response", {formResponseId: row.formResponseId}).response
            )
            const caseRead = asUser(users.audience, () => lib.refusal(M + "get#Response", {formResponseId: caseResponse}))
            return {anonymous, responses, answers, caseResponse, caseRead}
        },
        then(r) {
            r.anonymous.receipt != null
            r.responses.rows.length === 2
            !r.responses.rows.some(row => row.formResponseId === r.caseResponse)
            r.answers.every(a => a.answers[0].valueText === "Yes" && a.scoreText === "1 of 1")
            r.caseRead.includes("RECORD_UNAVAILABLE")
        }
    }
)
