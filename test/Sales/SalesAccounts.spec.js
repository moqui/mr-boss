// Sales' accounts and contacts screens (impl-sales P3; design-sales §4): Customer360's one html render in the Sales context, with
// its Overview tab (the representative's account, none of Accounting's tabs, no order or invoice number for a user without those
// reads; another organization's account is SalesAccess' check#Record and Mantle's SalesAccounts); Accounts' one html render (the representative's own
// accounts, not another representative's or organization's); ContactDetail's one html render (a contact of two
// accounts with both); and Commons' Compare admitting the Sales manager Mantle's merge guards admit (an owner contract, F45), with
// MergeAccounts' and MergeCompare's html renders for the manager. Mantle's rules (the account scope, the writes, the merge guards)
// are Mantle's SalesAccounts; the access rules of the record kinds and of MergeAccounts are SalesAccess'.
// Run: ./moq test mr-boss --spec SalesAccounts
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page} = lib
const {accounts, contacts} = ids

spec({
    setupSpec() {
        login("john.doe")
    }
})

feature("Customer360 shows the representative's account in Sales' context with its Overview", {
    when() {
        return {
            own: asUser(users.rep, () => page("Accounts/Customer360/SalesOverview", {customerPartyId: accounts.wingtip}, "html"))
        }
    },
    then({own}) {
        own.errors.length == 0
        own.output.includes("Wingtip Traders")
        own.output.includes("Customer · WINGTIP · Ziziwork Retail")
        own.output.includes("New contact")
        // Sales' Overview: the manager, the parent account
        own.output.includes("Account managers")
        own.output.includes("Sales Representative")
        own.output.includes("Wingtip Group")
        // no orders or invoices for a user without those reads
        !own.output.includes("Open orders")
        !own.output.includes("Open invoices")
    }
})

feature(
    "Accounts lists the representative's own accounts (Mine) of their organization, not another representative's or organization's",
    {
        when() {
            return {list: asUser(users.rep, () => page("Accounts/Accounts", {mine: "Y"}, "html"))}
        },
        then({list}) {
            list.errors.length == 0
            list.output.includes("Wingtip Traders")
            list.output.includes("Wingtip Group")
            list.output.includes("Sales Representative")
            list.output.includes("Dana Morales")
            list.output.includes("New account")
            !list.output.includes("Contoso Labs")
            !list.output.includes("Fabrikam Industrial")
            // a representative has no merge
            !list.output.includes("Duplicates")
        }
    }
)

feature(
    "ContactDetail shows a contact of two accounts with both; the representative edits its identity, not its organizations or another organization's or a shared contact",
    {
        when() {
            const detail = asUser(users.rep, () => page("Accounts/ContactDetail", {partyId: contacts.dana}, "html"))
            // Commons' check#ContactAccess admits an account editor for a contact of an account of their scope (owner contract, the
            // user's call of Nov 13, 2026); the rule, not the artifact grant, is what is tested, so the calls run without it
            const edit = partyId =>
                asUser(users.rep, () =>
                    system(() =>
                        refusal("ironstone.commons.ContactServices.update#Contact", {partyId, nickname: "Spec nickname"})
                    )
                )
            const own = edit(contacts.dana)
            const other = edit(contacts.lee)
            // P4 (F98, the user's call): the identity and channels only; the organizations (and relationships, notes, photo) stay the
            // contact admin's (canEdit), and a shared person (_NA_) a contact of a Retail account is not the representative's
            const organization = asUser(users.rep, () =>
                system(() =>
                    refusal("ironstone.commons.ContactServices.store#ContactOrganization", {
                        partyId: contacts.dana,
                        organizationPartyId: accounts.contoso,
                        jobTitle: "Spec title"
                    })
                )
            )
            const shared = system(() => {
                call("create#mantle.party.Party", {
                    partyId: "SAL_SPEC_SHARED_PERSON",
                    partyTypeEnumId: "PtyPerson",
                    ownerPartyId: "_NA_"
                })
                call("create#mantle.party.Person", {partyId: "SAL_SPEC_SHARED_PERSON", firstName: "Shared", lastName: "Shopper"})
                call("create#mantle.party.PartyRelationship", {
                    relationshipTypeEnumId: "PrtContact",
                    fromPartyId: "SAL_SPEC_SHARED_PERSON",
                    toPartyId: accounts.wingtip,
                    fromDate: ec.user.nowTimestamp
                })
                return "SAL_SPEC_SHARED_PERSON"
            })
            const sharedEdit = edit(shared)
            const access = asUser(users.rep, () =>
                system(() => invoke("ironstone.commons.ContactServices.check#ContactAccess", {partyId: contacts.dana}))
            )
            const nicknames = system(() => {
                const read = partyId =>
                    ec.entity.find("mantle.party.Person").condition("partyId", partyId).one()?.nickname || null
                const found = {dana: read(contacts.dana), lee: read(contacts.lee)}
                ec.service.sync().name("update#mantle.party.Person").parameters({partyId: contacts.dana, nickname: null}).call()
                return found
            })
            return {detail, own, other, nicknames, organization, sharedEdit, access}
        },
        then({detail, own, other, nicknames, organization, sharedEdit, access}) {
            own == ""
            access.canEditIdentity == true
            access.canEdit == false
            organization.includes("You may not change contact")
            sharedEdit.includes("You may not change contact")
            !detail.output.includes("ContactOrgAddDialog")
            nicknames.dana == "Spec nickname"
            other.includes("You may not change contact")
            nicknames.lee != "Spec nickname"
            detail.output.includes("ContactEditDialog")
            detail.errors.length == 0
            detail.output.includes("Dana Morales")
            detail.output.includes("Wingtip Traders")
            detail.output.includes("Contoso Labs")
            detail.output.includes("Purchasing manager")
            detail.output.includes("Add to an account")
        }
    }
)

feature(
    "Commons' Compare admits the Sales manager for two accounts of their organization; MergeAccounts and Compare show the pair",
    {
        when() {
            const pair = {partyId: accounts.adatum, otherPartyId: accounts.adatum2}
            return {
                duplicates: asUser(users.manager, () => page("Accounts/MergeAccounts", {}, "html")),
                compared: asUser(users.manager, () => page("Accounts/MergeCompare", pair, "html"))
            }
        },
        then({duplicates, compared}) {
            duplicates.errors.length == 0
            duplicates.output.includes("Adatum Corporation")
            duplicates.output.includes("Adatum Corp")
            // get#ComparePair offers the merge Mantle's guards admit the manager for, though the manager is no contact admin
            compared.errors.length == 0
            compared.output.includes("Opportunities")
            compared.output.includes("Agreements")
            compared.output.includes("Keep Adatum Corporation")
            compared.output.includes("Keep Adatum Corp (ADATUM2)")
        }
    }
)
