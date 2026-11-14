// Marketing P11's "usable when" (impl-marketing P11; design-marketing §16.3 scenario 9, automation), as an acceptance scenario through
// the screens' transitions with artifact authorization on: marketing.author writes a welcome sequence on the garden newsletter's
// confirmed subscription (a welcome, a wait of a day, the tips) and asks for approval; marketing.approver approves it and may not
// activate it; marketing.dispatch activates it. A new subscriber gets the welcome once though the admission event is read twice; a
// pause holds the due tips and the resume sends them once; a subscriber who unsubscribes is stopped before the tips; and Retail's store,
// its recovery sender set to an active cart automation, sends one cart recovery for an abandoned cart, not two (built-in recovery sends
// nothing). The rules are Mantle's Automations and CartRecovery, the renders MarketingAutomations.
// Run: ./moq accept mr-boss --spec MarketingAutomationScenario
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const {ids, users, asUser, system} = lib
const entityLib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const A = "mantle.marketing.AutomationServices."
const AUTOMATION = "mantle.marketing.automation.MarketingAutomation"
const ENROLLMENT = "mantle.marketing.automation.AutomationEnrollment"
const EXECUTION = "mantle.marketing.automation.AutomationStepExecution"
const capture = ec.factory.getTool("MailCapture")
const prefix = "MKT_AUTO_SCN"
const store = "POPC_DEFAULT"
const dayMs = 86400000
const addressOf = name => name.toLowerCase() + "@automation-scenario.example"
const ago = days => new Date(Date.now() - days * dayMs)
const settle = () => ec.factory.waitWorkerPoolEmpty(50)

function post(path, parameters) {
    const result = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Marketing.xml").render(path, parameters, "post")
    const errors = Array.from(result.errorMessages || []).join(" | ")
    ec.message.clearErrors()
    return {status: result.status, errors}
}
const one = (entity, fields) => system(() => ec.entity.find(entity).condition(fields).one())
const all = (entity, fields) => system(() => Array.from(ec.entity.find(entity).condition(fields).list()))
const revision = id => entityLib.ms(one(AUTOMATION, {marketingAutomationId: id}).lastUpdatedStamp)
const automationRevision = id => Number(one(AUTOMATION, {marketingAutomationId: id}).automationRevision)
const mailTo = name => Array.from(capture.getMessages()).filter(m => Array.from(m.toList || []).includes(addressOf(name)))
const detail = "Automations/AutomationDetail/"
// the jobs, as the scheduler runs them
const admit = id =>
    system(() =>
        ec.service
            .sync()
            .name(A + "run#AutomationAdmission")
            .parameters({marketingAutomationId: id})
            .call()
    )
const steps = id => {
    settle()
    return system(() =>
        ec.service
            .sync()
            .name(A + "run#AutomationSteps")
            .parameters({marketingAutomationId: id})
            .call()
    )
}
// a person of Retail with an address, not yet on the list
function person(name, extra = {}) {
    const partyId = prefix + "_" + name.toUpperCase()
    call("create#mantle.party.Party", {partyId, partyTypeEnumId: "PtyPerson", ownerPartyId: ids.organizationId})
    call("create#mantle.party.Person", {partyId, firstName: name, lastName: "Scenario"})
    call("create#mantle.party.contact.ContactMech", {
        contactMechId: partyId + "_EM",
        contactMechTypeEnumId: "CmtEmailAddress",
        infoString: addressOf(name)
    })
    call("create#mantle.party.contact.PartyContactMech", {
        partyId,
        contactMechId: partyId + "_EM",
        contactMechPurposeId: "EmailPrimary",
        fromDate: ago(30)
    })
    if (extra.account) {
        call("create#moqui.security.UserAccount", {
            userId: partyId,
            username: partyId,
            partyId,
            emailAddress: addressOf(name),
            currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
            passwordHashType: "SHA"
        })
        call("create#moqui.security.public.VerifiedAddress", {
            userId: partyId,
            emailAddress: addressOf(name),
            verifiedAt: ago(10)
        })
    }
    return partyId
}
// accepted on the garden newsletter with evidence, by the audience manager
function subscribe(partyId) {
    return asUser(users.audience, () =>
        ec.service
            .sync()
            .name("mantle.marketing.AudienceServices.request#Subscriptions")
            .parameters({
                contactListId: ids.gardenListId,
                partyIdList: [partyId],
                evidenceText: "Asked at the counter",
                accept: true
            })
            .call()
    )
}
// an automation written by the author, approved by the approver and activated by the dispatcher: its id and each refusal on the way
function automation(fields, stepList) {
    const out = {}
    out.created = asUser(users.author, () =>
        post(
            "Automations/Automations/createAutomation",
            Object.assign(
                {
                    marketingCampaignId: ids.runningCampaignId,
                    contactListId: ids.gardenListId,
                    sendingProfileId: ids.retailProfileId
                },
                fields
            )
        )
    )
    const id = all(AUTOMATION, {automationName: fields.automationName})[0].marketingAutomationId
    stepList.forEach((step, index) => {
        out["step" + index] = asUser(users.author, () =>
            post(
                detail + "changeSteps",
                Object.assign(
                    {marketingAutomationId: id, expectedRevision: revision(id), stepAction: "add", position: index},
                    step
                )
            )
        )
    })
    out.asked = asUser(users.author, () =>
        post(detail + "requestAutomationApproval", {marketingAutomationId: id, targetRevision: automationRevision(id)})
    )
    out.approved = asUser(users.approver, () =>
        post(detail + "decideAutomationApproval", {
            marketingAutomationId: id,
            targetRevision: automationRevision(id),
            decision: "approve"
        })
    )
    out.byApprover = asUser(users.approver, () =>
        post(detail + "activateAutomation", {marketingAutomationId: id, expectedRevision: revision(id)})
    )
    out.activated = asUser(users.dispatch, () =>
        post(detail + "activateAutomation", {marketingAutomationId: id, expectedRevision: revision(id)})
    )
    out.statusId = one(AUTOMATION, {marketingAutomationId: id}).statusId
    return Object.assign(out, {id})
}
const state = {}

spec({
    setupSpec() {
        login("john.doe")
        capture.enable()
        system(() => {
            state.quinn = person("Quinn")
            state.ruth = person("Ruth")
            state.sam = person("Sam", {account: true})
        })
    },
    cleanupSpec() {
        settle()
        capture.reset()
    }
})

feature(
    "the welcome sequence is approved apart and activated; a new subscriber gets the welcome once though the event is read twice",
    {
        when() {
            const made = automation(
                {automationName: "Scenario welcome", triggerEnumId: "AtrSubscription", timeZone: "America/Chicago"},
                [
                    {kind: "send", stepName: "Welcome", messageTemplateId: ids.newsletterTemplateId},
                    {kind: "wait", waitAmount: 1, waitUnitEnumId: "AwuDays"},
                    {kind: "send", stepName: "Tips", messageTemplateId: ids.newsletterTemplateId}
                ]
            )
            state.welcome = made.id
            subscribe(state.quinn)
            const first = admit(made.id)
            const second = admit(made.id)
            capture.clear()
            steps(made.id)
            return {
                made,
                first,
                second,
                enrollments: all(ENROLLMENT, {marketingAutomationId: made.id, partyId: state.quinn}),
                mail: mailTo("Quinn")
            }
        },
        then({made, first, second, enrollments, mail}) {
            made.created.errors == "" && made.step0.errors == "" && made.step2.errors == ""
            made.asked.errors == "" && made.approved.errors == ""
            made.byApprover.errors.includes("SELF_DISPATCH") || made.byApprover.errors.includes("PERMISSION_DENIED")
            made.activated.errors == "" && made.statusId == "MaActive"
            first.admitted == 1 && second.admitted == 0
            enrollments.length == 1 && Number(enrollments[0].nextSequenceNum) == 20
            mail.length == 1
            String((mail[0].headers || {})["List-Unsubscribe"] || "").length > 0
        }
    }
)

feature("a pause holds the due tips; the resume sends them once, within the cap", {
    when() {
        const id = state.welcome
        const enrollment = all(ENROLLMENT, {marketingAutomationId: id, partyId: state.quinn})[0]
        const wait = all(EXECUTION, {automationEnrollmentId: enrollment.automationEnrollmentId}).find(
            row => row.outcomeEnumId === "AsoWaiting"
        )
        const paused = asUser(users.dispatch, () =>
            post(detail + "pauseAutomation", {marketingAutomationId: id, reason: "Checking the tips"})
        )
        system(() => {
            call("update#" + EXECUTION, {automationStepExecutionId: wait.automationStepExecutionId, dueDate: ago(0.01)})
            call("update#" + ENROLLMENT, {automationEnrollmentId: enrollment.automationEnrollmentId, nextDueDate: ago(0.01)})
        })
        capture.clear()
        steps(id)
        const whilePaused = mailTo("Quinn").length
        const resumed = asUser(users.dispatch, () =>
            post(detail + "activateAutomation", {marketingAutomationId: id, expectedRevision: revision(id)})
        )
        steps(id)
        steps(id)
        return {
            paused,
            whilePaused,
            resumed,
            tips: mailTo("Quinn").length,
            after: one(ENROLLMENT, {automationEnrollmentId: enrollment.automationEnrollmentId})
        }
    },
    then({paused, whilePaused, resumed, tips, after}) {
        paused.errors == "" && whilePaused == 0
        resumed.errors == ""
        tips == 1
        after.statusId == "AenCompleted"
    }
})

feature("a subscriber who unsubscribes is stopped before the tips", {
    when() {
        const id = state.welcome
        subscribe(state.ruth)
        admit(id)
        capture.clear()
        steps(id)
        const welcomed = mailTo("Ruth").length
        // Ruth unsubscribes (the list's consent withdrawn, as the unsubscribe link records it); her wait ends
        system(() => {
            call("mantle.party.ConsentServices.record#PartyConsent", {
                partyId: state.ruth,
                contactListId: ids.gardenListId,
                purposeEnumId: "PcpMarketingEmail",
                statusId: "PconWithdrawn",
                sourceEnumId: "PcsEmailLink",
                evidenceText: "Unsubscribe link of the welcome"
            })
            const enrollment = Array.from(
                ec.entity.find(ENROLLMENT).condition({marketingAutomationId: id, partyId: state.ruth}).list()
            )[0]
            call("update#" + ENROLLMENT, {automationEnrollmentId: enrollment.automationEnrollmentId, nextDueDate: ago(0.01)})
        })
        steps(id)
        return {
            welcomed,
            total: mailTo("Ruth").length,
            enrollment: all(ENROLLMENT, {marketingAutomationId: id, partyId: state.ruth})[0]
        }
    },
    then({welcomed, total, enrollment}) {
        welcomed == 1 && total == 1
        enrollment.statusId == "AenStopped"
    }
})

feature("a store whose recovery sender is the cart automation sends one recovery for an abandoned cart, not two", {
    when() {
        const made = automation(
            {automationName: "Scenario cart reminder", triggerEnumId: "AtrCartAbandoned", productStoreId: store},
            [{kind: "send", stepName: "Your cart", messageTemplateId: ids.newsletterTemplateId}]
        )
        subscribe(state.sam)
        // Sam turns cart reminders on, and leaves a cart idle for three hours; the store sends recovery by the automation
        const policy = system(() => {
            call("mantle.public.AccountHubServices.apply#CheckoutOptIn", {
                optInId: "cartReminders",
                mode: "grant",
                partyId: state.sam,
                productStoreId: store,
                sourceEnumId: "PcsForm",
                evidenceText: "Scenario checkout"
            })
            const orderId = prefix + "_CART"
            call("create#mantle.order.OrderHeader", {
                orderId,
                productStoreId: store,
                statusId: "OrderOpen",
                currencyUomId: "USD",
                entryDate: ago(1),
                grandTotal: "16.00"
            })
            call("create#mantle.order.OrderPart", {
                orderId,
                orderPartSeqId: "01",
                vendorPartyId: ids.organizationId,
                customerPartyId: state.sam,
                statusId: "OrderOpen"
            })
            call("create#mantle.order.OrderItem", {
                orderId,
                orderItemSeqId: "01",
                orderPartSeqId: "01",
                itemTypeEnumId: "ItemProduct",
                itemDescription: "Scenario seeds",
                quantity: 2,
                unitAmount: "8.00"
            })
            call("create#mantle.order.StoreCartAccess", {
                cartAccessId: orderId,
                orderId,
                appMountId: "shop",
                productStoreId: store,
                currencyUomId: "USD",
                customerPartyId: state.sam,
                capabilityDigest: ec.user.singleUseCodeHash(orderId + "-capability"),
                lastActivityDate: new Date(Date.now() - 180 * 60000),
                expireDate: new Date(Date.now() + 30 * dayMs),
                createdDate: ec.user.nowTimestamp
            })
            state.cart = orderId
            return ec.service
                .sync()
                .name("mantle.product.StoreAdminServices.store#CartRecoveryPolicy")
                .parameters({
                    productStoreId: store,
                    enabled: "true",
                    delayMinutes: "60",
                    sender: "automation",
                    changeReason: "Marketing sends it"
                })
                .call()
        })
        capture.clear()
        const builtin = system(() =>
            ec.service
                .sync()
                .name("mantle.order.StoreOperationsServices.run#CartRecovery")
                .parameters({productStoreIds: [store]})
                .call()
        )
        admit(made.id)
        admit(made.id)
        steps(made.id)
        return {
            made,
            policy,
            builtin,
            enrollments: all(ENROLLMENT, {marketingAutomationId: made.id, partyId: state.sam}),
            mail: mailTo("Sam")
        }
    },
    then({made, policy, builtin, enrollments, mail}) {
        made.activated.errors == "" && made.statusId == "MaActive"
        policy.changed.includes("sender")
        builtin.queued == 0
        enrollments.length == 1 && enrollments[0].sourceKey.startsWith("cart:" + state.cart + ":")
        mail.length == 1
    }
})
