// Organizations in Admin (impl-admin P7; design-admin §7 Organizations and OrganizationDetail): OrganizationDetail's one qvt render
// as Ziziwork Retail's configuration administrator (its profile and child organization, contacts, members counted for a user who
// is not an identity operator, registered defaults and its Constitution's source), and the organization scope of the screens and
// the palette: the configuration administrator lists and finds Retail, never Ziziwork Services, whose detail is not available;
// the administrative reader, without ADMIN_SETTINGS_VIEW, opens neither; a contact change is checked against the organization first
// (Retail's child organization changed, Services' refused). Mantle's rules (parents, defaults, scope) are Mantle's
// InternalOrganizations spec.
// Run: ./moq test mr-boss --spec AdminOrganizations
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {ids, users, asUser, invoke, page} = lib
// Retail's child organization (the returns center), in the configuration administrator's scope through its parent
const childId = "BOSS_WH_RETURNS"
const emailOf = partyId =>
    lib.system(
        () =>
            invoke("mantle.party.ContactServices.get#PartyContactInfo", {partyId, emailContactMechPurposeId: "EmailPrimary"})
                .emailAddress || ""
    )
const palette = text =>
    Array.from(invoke("ironstone.admin.ContextServices.search#Records", {text, limit: 10}).rows || []).map(row => row.recordId)

spec({
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "OrganizationDetail shows Retail's profile, contacts, members, defaults and Constitution to its configuration administrator",
    {
        when() {
            return asUser(users.configure, () => page("Settings/OrganizationDetail", {organizationPartyId: ids.organizationId}))
        },
        then({status, output, errors}) {
            status == 200
            errors.length == 0
            output.includes("Ziziwork Retail") && output.includes("Ziziwork Returns Center")
            output.includes("Contacts") && output.includes("Edit contacts")
            // members are counted, not named, for a user who is not an identity operator
            output.includes("current member(s)") && !output.includes("Add member")
            output.includes("Default Invoice Product Store ID") && output.includes("Where it is used")
            output.includes("Constitution") && output.includes("Setup")
        }
    }
)

feature("the configuration administrator's organizations are Retail's, never Services'; the reader opens none", {
    when() {
        return {
            list: asUser(users.configure, () => page("Settings/Organizations", {}, "html")),
            other: asUser(users.configure, () =>
                page("Settings/OrganizationDetail", {organizationPartyId: ids.otherOrganizationId}, "html")
            ),
            found: asUser(users.configure, () => palette("Ziziwork")),
            reader: asUser(users.reader, () => page("Settings/Organizations", {}, "html")),
            readerFound: asUser(users.reader, () => palette("Ziziwork")),
            contacts: asUser(users.configure, () =>
                page(
                    "Settings/OrganizationDetail/storeContacts",
                    {organizationPartyId: childId, emailAddress: "returns.p7@example.com"},
                    "html"
                )
            ),
            otherContacts: asUser(users.configure, () =>
                page(
                    "Settings/OrganizationDetail/storeContacts",
                    {organizationPartyId: ids.otherOrganizationId, emailAddress: "services.p7@example.com"},
                    "html"
                )
            )
        }
    },
    then({list, other, found, reader, readerFound, contacts, otherContacts}) {
        list.errors.length == 0 && list.output.includes("Ziziwork Retail") && !list.output.includes("Ziziwork Services")
        other.output.includes("Organization not available") && !other.output.includes("Edit contacts")
        found.includes(ids.organizationId) && !found.includes(ids.otherOrganizationId)
        reader.status != 200 || reader.errors.length > 0
        !readerFound.includes(ids.organizationId)
        contacts.errors.length == 0 && emailOf(childId) == "returns.p7@example.com"
        otherContacts.errors.join(" ").includes("RECORD_UNAVAILABLE") &&
            emailOf(ids.otherOrganizationId) != "services.p7@example.com"
    }
})
