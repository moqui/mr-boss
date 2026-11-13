// Sales P3's "usable when" (impl-sales P3), as an acceptance walk through the screens' transitions with artifact authorization on:
// sales.rep creates an account and a contact and finds a shared account of the organization; a contact of two accounts (Dana
// Morales, of Wingtip Traders and Contoso Labs) shows under each account, and one account's page shows nothing of the other's;
// sales.manager merges the duplicate pair (Adatum Corporation and Adatum Corp) from MergeAccounts' Compare and the survivor keeps
// both histories (roles, contact details, relationships); a finance tab (Invoices) shows only for a finance reader. The rules
// themselves are Mantle's SalesAccounts and the BOSS SalesAccess and SalesAccounts.
// Run: ./moq accept mr-boss --spec SalesAccountsUsable
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const {ids, users, asUser, system, page} = lib
const {accounts, contacts} = ids
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
// a transition of a Sales screen posted as the current user: its status and errors
function post(path, parameters) {
    const result = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Sales.xml").render(path, parameters, "post")
    const errors = Array.from(result.errorMessages || [])
    ec.message.clearErrors()
    return {status: result.status, errors}
}
const stamp = String(Date.now()).slice(-6)

spec({
    setupSpec() {
        login("john.doe")
    }
})

feature("sales.rep creates an account and a contact and finds a shared account of the organization", {
    when() {
        const name = "Usable Account " + stamp
        return asUser(users.rep, () => {
            const created = post("Accounts/Accounts/createAccount", {
                organizationPartyId: ids.organizationId,
                organizationName: name,
                roleTypeId: "Customer",
                partyTypeEnumId: "PtyOrganization"
            })
            const accountId = system(
                () => ec.entity.find("mantle.party.Organization").condition("organizationName", name).one()?.partyId
            )
            const contact = post("Accounts/Contacts/createContact", {
                accountPartyId: accountId,
                firstName: "Usable",
                lastName: "Contact " + stamp,
                relationshipName: "Buyer"
            })
            return {
                created,
                accountId,
                contact,
                own: page("Accounts/Accounts", {text: name}, "html"),
                contacts: page("Accounts/Contacts", {accountPartyId: accountId}, "html"),
                shared: page("Accounts/Accounts", {text: "Another Company"}, "html")
            }
        })
    },
    then({created, accountId, contact, own, contacts, shared}) {
        created.errors.length == 0
        accountId != null
        contact.errors.length == 0
        opened(own) && own.output.includes("Usable Account " + stamp)
        opened(contacts) && contacts.output.includes("Contact " + stamp)
        opened(shared) && shared.output.includes("Another Company Making Everything") && shared.output.includes("Shared")
    }
})

feature("a contact of two accounts shows under each, and one account's page shows nothing of the other's", {
    when() {
        return asUser(users.rep, () => ({
            contact: page("Accounts/ContactDetail", {partyId: contacts.dana}, "html"),
            wingtip: page("Accounts/Customer360/SalesContacts", {customerPartyId: accounts.wingtip}, "html"),
            contoso: page("Accounts/Customer360/SalesContacts", {customerPartyId: accounts.contoso}, "html")
        }))
    },
    then({contact, wingtip, contoso}) {
        opened(contact) && contact.output.includes("Wingtip Traders") && contact.output.includes("Contoso Labs")
        opened(wingtip) && wingtip.output.includes("Dana Morales") && wingtip.output.includes("Purchasing manager")
        !wingtip.output.includes("Contoso Labs") && !wingtip.output.includes("Advisor")
        opened(contoso) && contoso.output.includes("Dana Morales") && contoso.output.includes("Advisor")
        !contoso.output.includes("Wingtip Traders") && !contoso.output.includes("Purchasing manager")
    }
})

feature("sales.manager merges the duplicate pair from MergeAccounts' Compare and the survivor keeps both histories", {
    when() {
        const pair = {partyId: accounts.adatum, otherPartyId: accounts.adatum2}
        return asUser(users.manager, () => {
            const duplicates = page("Accounts/MergeAccounts", {}, "html")
            const compare = page("Accounts/MergeCompare", pair, "html")
            const merged = post("Accounts/MergeCompare/mergeAccounts", Object.assign({keepPartyId: accounts.adatum}, pair))
            return {
                duplicates,
                compare,
                merged,
                gone: system(() => ec.entity.find("mantle.party.Party").condition("partyId", accounts.adatum2).one()),
                roles: system(() =>
                    Array.from(ec.entity.find("mantle.party.PartyRole").condition("partyId", accounts.adatum).list()).map(
                        row => row.roleTypeId
                    )
                ),
                survivor: page("Accounts/Customer360/SalesOverview", {customerPartyId: accounts.adatum}, "html")
            }
        })
    },
    then({duplicates, compare, merged, gone, roles, survivor}) {
        opened(duplicates) && duplicates.output.includes("Adatum Corp")
        opened(compare) && compare.output.includes("Keep Adatum Corporation")
        merged.errors.length == 0
        gone.mergedToPartyId == accounts.adatum
        gone.disabled == "Y"
        roles.includes("Customer") && roles.includes("Prospect")
        opened(survivor) && survivor.output.includes("Adatum Corporation") && survivor.output.includes("orders@adatum.example")
    }
})

feature("an account's Invoices tab shows only for a finance reader", {
    when() {
        return {
            rep: asUser(users.rep, () => page("Accounts/Customer360/SalesInvoices", {customerPartyId: accounts.wingtip}, "html")),
            finance: asUser(users.system, () =>
                page("Accounts/Customer360/SalesInvoices", {customerPartyId: accounts.wingtip}, "html")
            )
        }
    },
    then({rep, finance}) {
        !rep.output.includes("No invoices from your organizations")
        !rep.output.includes("Unpaid")
        opened(finance) && (finance.output.includes("No invoices from your organizations") || finance.output.includes("Unpaid"))
    }
})
