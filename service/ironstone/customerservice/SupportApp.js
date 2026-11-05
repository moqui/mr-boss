// The Support app's internal side in BOSS (impl-customer-service P15; design-customer-service §4 ContactDetail, §9
// ServiceDefaults): ContactDetail's Invite to support and ServiceDefaults' Support mount settings. Each checks Customer Service's
// scope here, then calls Mantle's service (mantle.party.ExternalAccessServices.invite#Contact, which checks
// SUPPORT_CONTACT_INVITE in the organization; mantle.request.SupportCaseServices save#SupportAppSetting, SUPPORT_POLICY_EDIT).
// An invitation goes only to an address of the contact itself, for a customer the user serves, on an organization of theirs
// whose published site has the Support app; an email seen on a case is no authority to invite it.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const cs = ec.resource.script("component://mr-boss/service/ironstone/customerservice/CustomerService.js")
const configuration = ec.resource.script("component://mr-boss/service/ironstone/customerservice/Configuration.js")
const customers = ec.resource.script("component://mr-boss/service/ironstone/customerservice/Customers.js")
const apps = ec.resource.script("component://mr-mantle/service/mantle/public/PublicApps.js")
const {find, one, rows, call, denied} = lib

const blank = value => value == null || String(value).trim() === ""
const enumText = enumId => (enumId ? one("moqui.basic.Enumeration", {enumId})?.description || enumId : "")
// The contact's own email addresses (current, of the email type).
function emailsOf(partyId) {
    const out = []
    for (const row of rows("mantle.party.contact.PartyContactMech", {partyId}).filter(row => lib.active(row))) {
        const mech = one("mantle.party.contact.ContactMech", {contactMechId: row.contactMechId})
        if (mech?.contactMechTypeEnumId === "CmtEmailAddress" && mech.infoString && !out.includes(mech.infoString.toLowerCase()))
            out.push(mech.infoString.toLowerCase())
    }
    return out
}
// The user's organizations that serve the customer (its owner, or any for a shared customer) and have a published site with
// the Support app.
function organizationsFor(userScope, customerPartyId) {
    const owner = one("mantle.party.Party", {partyId: customerPartyId})?.ownerPartyId
    return Array.from(userScope.organizationPartyIds || []).filter(
        partyId => (!owner || owner === "_NA_" || owner === partyId) && apps.sitesFor("support", partyId).length > 0
    )
}
// get#SupportInvite: what ContactDetail's Invite to support offers for a contact (check#ServiceContact's rule): whether the user
// may invite (SUPPORT_CONTACT_INVITE), the customer, the organizations and the contact's addresses.
function supportInvite(p) {
    const userScope = cs.required()
    const contact = customers.execute("serviceContact", {partyId: p.partyId})
    const organizations = organizationsFor(userScope, contact.customerPartyId)
    return {
        canInvite: !!userScope.capabilities.contactInvite && organizations.length > 0 && emailsOf(p.partyId).length > 0,
        customerPartyId: contact.customerPartyId,
        customerName: contact.customerName,
        organizationOptions: organizations.map(partyId => ({value: partyId, label: cs.partyName(partyId)})),
        emailOptions: emailsOf(p.partyId).map(value => ({value, label: value})),
        reason: !userScope.capabilities.contactInvite
            ? "Inviting a contact to the Support app needs SUPPORT_CONTACT_INVITE"
            : !organizations.length
              ? "No organization of yours has a published site with the Support app"
              : !emailsOf(p.partyId).length
                ? "Add the contact's email address first"
                : null
    }
}
// create#SupportInvitation: the invitation for one of the contact's addresses, through Mantle's invite#Contact (which checks
// SUPPORT_CONTACT_INVITE in the organization), for the customer the contact belongs to; administrator makes the contact a
// customer administrator (the customer's cases, not only their own).
function inviteContact(p) {
    const userScope = cs.required()
    const contact = customers.execute("serviceContact", {partyId: p.partyId})
    const email = String(p.emailAddress || "")
        .trim()
        .toLowerCase()
    if (!emailsOf(p.partyId).includes(email)) denied("EMAIL_INVALID", "Choose one of the contact's own email addresses")
    const organizationPartyId = blank(p.organizationPartyId)
        ? organizationsFor(userScope, contact.customerPartyId)[0]
        : p.organizationPartyId
    if (!organizationPartyId || !organizationsFor(userScope, contact.customerPartyId).includes(organizationPartyId))
        denied("SITE_UNAVAILABLE", "Choose an organization with a published site with the Support app")
    return call("mantle.party.ExternalAccessServices.invite#Contact", {
        organizationPartyId,
        app: "support",
        partyId: contact.customerPartyId,
        emailAddress: email,
        administrator: p.administrator === "Y" || p.administrator === true ? "Y" : null
    })
}
// get#SupportMountSettings: ServiceDefaults' Support mount settings of an organization: its current setting, the queues, case
// types and knowledge spaces to choose from (spaces of its customer and public sources), and its sites with the app.
function supportMountSettings(p) {
    const userScope = cs.required()
    const organizationPartyId = configuration.organizationOf(userScope, p.organizationPartyId)
    const setting =
        Array.from(
            find("mantle.request.support.SupportAppSetting", {organizationPartyId})
                .condition(ec.entity.conditionFactory.makeCondition("fromDate", "is-not-null", null))
                .conditionDate("fromDate", "thruDate", ec.user.nowTimestamp)
                .orderBy("-fromDate")
                .limit(1)
                .list()
        )[0] || null
    const categories = new Map(
        rows("mantle.request.RequestCategory", {ownerPartyId: organizationPartyId}).map(row => [row.requestCategoryId, row])
    )
    const knowledge = ec.resource.script("component://mr-mantle/service/mantle/request/Knowledge.js")
    const spaceIds = Array.from(
        new Set(
            knowledge
                .currentSources([organizationPartyId])
                .filter(source => knowledge.customerAudiences.includes(source.audienceEnumId))
                .map(source => source.wikiSpaceId)
        )
    )
    const list = value =>
        String(value || "")
            .split(",")
            .filter(Boolean)
    return {
        organizationPartyId,
        setting: setting
            ? {
                  queueIds: list(setting.queueIds),
                  typeEnumIds: list(setting.typeEnumIds),
                  wikiSpaceIds: list(setting.wikiSpaceIds),
                  fromText: lib.dateText(setting.fromDate)
              }
            : null,
        queueOptions: cs
            .currentQueues()
            .filter(row => categories.has(row.requestCategoryId))
            .map(row => ({
                value: row.requestCategoryId,
                label: categories.get(row.requestCategoryId).description || row.requestCategoryId
            })),
        typeOptions: rows("mantle.request.support.ServiceRequestType", {organizationPartyId})
            .map(row => row.requestTypeEnumId)
            .filter((value, index, all) => all.indexOf(value) === index)
            .map(value => ({value, label: enumText(value)})),
        spaceOptions: spaceIds.map(value => ({
            value,
            label: one("moqui.resource.wiki.WikiSpace", {wikiSpaceId: value})?.description || value
        })),
        sites: apps
            .sitesFor("support", organizationPartyId)
            .map(siteId => ({siteId, url: apps.pageUrl(siteId, "support", "/SupportHome")}))
    }
}

const operations = {supportInvite, inviteContact, supportMountSettings}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Support app operation " + op)
        const wasDisabled = ec.artifactExecution.disableAuthz()
        try {
            return operations[op](parameters || {})
        } finally {
            if (!wasDisabled) ec.artifactExecution.enableAuthz()
        }
    }
})
