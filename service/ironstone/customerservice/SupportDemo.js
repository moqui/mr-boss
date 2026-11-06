// Customer Service's demo of the Support app (impl-customer-service P15; DemoServices.load#SupportDemo, run from
// BossZZZCustomerServiceSupportDemoData.xml after the feedback demo, on Accounting's ZIZI_PORTAL site whose /support mount
// targets ORG_ZIZI_RETAIL): the Support mount's settings (the Support queue, the help of ZZW_RETAIL); Joe's Distributing's
// contact and its customer administrator as PASS public accounts (demo password moqui), invited through invite#Contact and
// redeemed; Joe Q Public's own account (CustJqp, a person: invite#Contact is for a contact, his own account reaches his
// cases through the self relationship once its email is verified); a case the JoeDist contact filed through the Support
// app's operation; and the Support queue's public form token (SUPPORT_TOKENS, for trying the anonymous form). Each step on its
// own (one that fails is named and the others are made); idempotent.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const {one, rows, call} = lib

const organizationPartyId = "ORG_ZIZI_RETAIL",
    siteId = "ZIZI_PORTAL",
    queueId = "BOSS_CS_Q_SUPPORT"
const SUPPORT_TOKENS = {intake: "ZiziSupportDemoIntakeFormLink00000000000000001"}
const contacts = [
    {partyId: "BOSS_CS_JOEDIST_CONTACT", firstName: "Dana", username: "dana@joesdist.example.com", administrator: false},
    {partyId: "BOSS_CS_JOEDIST_ADMIN", firstName: "Morgan", username: "morgan@joesdist.example.com", administrator: true}
]
const caseName = "Order of filters short by one box"

function asDemoAdministrator(operation) {
    if (ec.user.userId && !lib.access.systemAdmin()) throw new Error("Demo loading requires system administration")
    const loggedIn = !!ec.user.username
    if (!loggedIn) ec.user.internalLoginUser("john.doe")
    const authzDisabled = ec.artifactExecution.disableAuthz()
    try {
        return operation()
    } finally {
        if (!authzDisabled) ec.artifactExecution.enableAuthz()
        if (!loggedIn) ec.user.logoutUser()
    }
}
function ensureSetting() {
    const current = rows("mantle.request.support.SupportAppSetting", {organizationPartyId}).find(
        row => row.fromDate && !row.thruDate
    )
    if (current) return
    call("mantle.request.SupportCaseServices.save#SupportAppSetting", {
        organizationPartyId,
        queueIds: queueId,
        wikiSpaceIds: one("moqui.resource.wiki.WikiSpace", {wikiSpaceId: "ZZW_RETAIL"}) ? "ZZW_RETAIL" : null,
        changeReason: "Demo"
    })
}
// a PASS public account (only ALL_USERS) with a verified address, invited for JoeDist and redeemed as itself
function ensureContacts() {
    for (const c of contacts) {
        if (one("moqui.security.UserAccount", {userId: c.partyId})) continue
        call("create#mantle.party.Party", {partyId: c.partyId, partyTypeEnumId: "PtyPerson"})
        call("create#mantle.party.Person", {partyId: c.partyId, firstName: c.firstName, lastName: "of Joe's Distributing"})
        call("mantle.party.ContactServices.create#EmailAddress", {
            partyId: c.partyId,
            emailAddress: c.username,
            contactMechPurposeId: "EmailPrimary"
        })
        call("create#mantle.party.PartyRelationship", {
            fromPartyId: c.partyId,
            toPartyId: "JoeDist",
            relationshipTypeEnumId: "PrtContact",
            fromDate: ec.user.nowTimestamp
        })
        call("create#moqui.security.UserAccount", {
            userId: c.partyId,
            username: c.username,
            partyId: c.partyId,
            emailAddress: c.username,
            currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
            passwordHashType: "SHA"
        })
        call("create#moqui.security.public.VerifiedAddress", {
            userId: c.partyId,
            emailAddress: c.username,
            verifiedAt: ec.user.nowTimestamp
        })
        const invited = call("mantle.party.ExternalAccessServices.invite#Contact", {
            organizationPartyId,
            app: "support",
            partyId: "JoeDist",
            emailAddress: c.username,
            administrator: c.administrator ? "Y" : null
        })
        const administrator = ec.user.username
        ec.user.internalLoginUser(c.username)
        try {
            call("mantle.public.SiteServices.redeem#Invitation", {input: {siteId, token: invited.token}})
        } finally {
            ec.user.internalLoginUser(administrator)
        }
    }
}
// Joe Q Public's own account reaches his own cases and returns once its address is verified (the self relationship)
function ensureSelf() {
    const account = one("moqui.security.UserAccount", {userId: "CustJqp"})
    if (!account) throw new Error("CustJqp has no account")
    const email = account.emailAddress || "joe@public.com"
    if (!one("moqui.security.public.VerifiedAddress", {userId: "CustJqp", emailAddress: email}))
        call("create#moqui.security.public.VerifiedAddress", {
            userId: "CustJqp",
            emailAddress: email,
            verifiedAt: ec.user.nowTimestamp
        })
}
// the JoeDist contact's own case, filed through the Support app's operation
function ensureCase() {
    if (rows("mantle.request.Request", {requestName: caseName}).length) return
    const administrator = ec.user.username
    ec.user.internalLoginUser(contacts[0].username)
    try {
        ec.resource.script("component://mr-mantle/service/mantle/request/SupportPortal.js").execute("createCustomerCase", {
            siteId,
            requestName: caseName,
            description: "We ordered six boxes of furnace filters and five arrived.",
            operationId: "SupportDemoCase000001"
        })
    } finally {
        ec.user.internalLoginUser(administrator)
    }
}
// the Support queue's public form token (the party-less RequestCategory kind)
function ensureIntakeToken() {
    const digest = ec.user.singleUseCodeHash(SUPPORT_TOKENS.intake)
    if (one("mantle.party.ExternalAccessCapability", {tokenDigest: digest})) return
    call("create#mantle.party.ExternalAccessCapability", {
        organizationPartyId,
        partyId: null,
        recordType: "RequestCategory",
        recordId: queueId,
        scopes: "CaseIntake",
        tokenDigest: digest,
        issuerKind: "organization",
        fromDate: ec.user.nowTimestamp,
        thruDate: new Date(Date.now() + 366 * 86400000),
        createdByUserId: ec.user.userId
    })
}

const steps = {setting: ensureSetting, contacts: ensureContacts, self: ensureSelf, case: ensureCase, intake: ensureIntakeToken}
function load() {
    const errors = []
    for (const name of Object.keys(steps)) {
        try {
            lib.probe("ironstone.customerservice.DemoServices.run#SupportDemoStep", {step: name})
        } catch (error) {
            ec.logger.error("Customer Service demo Support app " + name + " was not made: " + error.message)
            errors.push(name + ": " + error.message)
        }
    }
    return {complete: errors.length === 0, errors}
}
function runStep(p) {
    const step = steps[String(p.step || "")]
    if (!step) throw new Error("Unknown Support demo step " + p.step)
    return step()
}
const operations = {load, runStep}
;({
    SUPPORT_TOKENS,
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Customer Service Support demonstration operation " + op)
        if (op !== "load") return asDemoAdministrator(() => operations[op](parameters || {}))
        // load logs in no one: a login or logout inside the data file's transaction holds john.doe's UserAccount row until
        // the file commits, and each step's own login (a new transaction) would wait on it until its deadline
        if (ec.user.userId && !lib.access.systemAdmin()) throw new Error("Demo loading requires system administration")
        return operations.load()
    }
})
