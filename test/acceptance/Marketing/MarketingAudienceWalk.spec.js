// Marketing P3's "usable when" (impl-marketing P3; design-marketing §16.3 scenario 2), as an acceptance walk through the screens'
// transitions with artifact authorization on: marketing.audience makes a list on Lists, adds three contacts with evidence and two
// without an address, and sees three pending on ListDetail; a salesperson without the audience permission sees no bulk action on
// Sales' Accounts, and one with it files requests that arrive pending, from Sales' own Accounts and from Marketing's mount of it; a
// complaint suppression stays after the contact resubscribes (accepted with evidence, the address still suppressed); and a mailbox
// of the Inbox behaves as before (its creator its owner, its members accepted). The rules themselves are Mantle's Audiences,
// Suppressions and Consent, the access MarketingAccess.
// Run: ./moq accept mr-boss --spec MarketingAudienceWalk
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const {ids, users, asUser, system, page} = lib
const LIST = "mantle.marketing.contact.ContactList"
const CLP = "mantle.marketing.contact.ContactListParty"
const prefix = "MKT_AUD_WALK"
const people = ["ADA", "BO", "CY", "DEV", "EM"]
let listId

// A transition posted as the user's browser does, under a root
// (a render's result carries its errors only; the transition's messages stay on ec.message)
function post(root, path, parameters) {
    ec.message.clearAll()
    const result = ec.screen
        .makeTest()
        .rootScreen("component://mr-boss/screen/" + root + ".xml")
        .render(path, parameters, "post")
    const errors = Array.from(result.errorMessages || []).join(" | ")
    const messages = Array.from(ec.message.messages || []).join(" | ")
    ec.message.clearAll()
    return {status: result.status, errors, messages}
}
const statusOf = (contactListId, partyId) =>
    system(
        () =>
            Array.from(ec.entity.find(CLP).condition({contactListId, partyId}).orderBy("-fromDate").list()).map(
                row => row.statusId
            )[0] || null
    )

spec({
    setupSpec() {
        login("john.doe")
        system(() => {
            for (const [index, key] of people.entries()) {
                const partyId = prefix + "_" + key
                call("create#mantle.party.Party", {partyId, partyTypeEnumId: "PtyPerson"})
                call("create#mantle.party.Person", {partyId, firstName: key, lastName: "Audience walk"})
                // the last two have no email address
                if (index >= 3) continue
                call("create#mantle.party.contact.ContactMech", {
                    contactMechId: partyId + "_EM",
                    contactMechTypeEnumId: "CmtEmailAddress",
                    infoString: key.toLowerCase() + ".audiencewalk@example.com"
                })
                call("create#mantle.party.contact.PartyContactMech", {
                    partyId,
                    contactMechId: partyId + "_EM",
                    contactMechPurposeId: "EmailPrimary",
                    fromDate: new Date(Date.now() - 86400000)
                })
            }
        })
    }
})

feature(
    "the audience manager makes a list and files five requests with evidence: three pending, two without an address refused",
    {
        when() {
            const created = asUser(users.audience, () =>
                post("Marketing", "Audiences/Lists/createList", {
                    organizationPartyId: ids.organizationId,
                    contactListName: "Audience walk news",
                    contactListTypeEnumId: "NEWSLETTER"
                })
            )
            listId = system(() => ec.entity.find(LIST).condition("contactListName", "Audience walk news").one()?.contactListId)
            const filed = asUser(users.audience, () =>
                post("Marketing", "Audiences/ListDetail/requestSubscriptions", {
                    contactListId: listId,
                    partyIdList: people.map(key => prefix + "_" + key).join(","),
                    sourceEnumId: "PcsForm",
                    evidenceText: "Signed the workshop sheet"
                })
            )
            const detail = asUser(users.audience, () =>
                page("Audiences/ListDetail", {contactListId: listId, memberStatus: "pending"}, "html")
            )
            return {created, filed, detail, members: system(() => ec.entity.find(CLP).condition("contactListId", listId).count())}
        },
        then({created, filed, detail, members}) {
            created.errors == "" && !!listId
            filed.errors == ""
            filed.messages.includes("3 pending") && filed.messages.includes("2 refused")
            members == 3
            detail.errors.length == 0
            detail.output.includes("ADA Audience walk") && detail.output.includes("Pending")
        }
    }
)

feature("a salesperson without the audience permission sees no bulk action; one with it files requests that arrive pending", {
    when() {
        return {
            rep: asUser(users.salesRep, () => page("Accounts/Accounts", {}, "qvt", "Sales")),
            sales: asUser(users.salesAudience, () => page("Accounts/Accounts", {}, "qvt", "Sales")),
            mounted: asUser(users.salesAudience, () => page("Leads/Accounts", {}, "qvt", "Marketing")),
            filed: asUser(users.salesAudience, () =>
                post("Sales", "Accounts/Accounts/addToList", {
                    selectedPartyIds: ids.salesAccountId,
                    addToListId: listId,
                    sourceEnumId: "PcsStaff",
                    evidenceText: "Asked for the newsletter on the call"
                })
            ),
            refused: asUser(users.salesRep, () =>
                post("Sales", "Accounts/Accounts/addToList", {
                    selectedPartyIds: ids.salesAccountId,
                    addToListId: listId,
                    evidenceText: "Asked for the newsletter on the call"
                })
            )
        }
    },
    then({rep, sales, mounted, filed, refused}) {
        !rep.output.includes("Add to list (evidenced)")
        sales.output.includes("Add to list (evidenced)")
        mounted.errors.length == 0 && mounted.output.includes("Add to list (evidenced)")
        filed.errors == ""
        statusOf(listId, ids.salesContactId) == "CLPT_PENDING"
        refused.errors.includes("PERMISSION_DENIED")
    }
})

feature("a complaint suppression stays after the contact resubscribes; a mailbox behaves as before", {
    when() {
        const partyId = prefix + "_ADA"
        system(() =>
            call("mantle.party.MessageServices.store#Suppression", {
                destination: "ada.audiencewalk@example.com",
                organizationPartyId: ids.organizationId,
                reasonEnumId: "MsrComplaint",
                sourceEnumId: "MssProvider",
                evidenceText: "Marked the newsletter as spam"
            })
        )
        const resubscribed = asUser(users.audience, () =>
            post("Marketing", "Audiences/MemberDetail/requestSubscriptions", {
                contactListId: listId,
                partyIdList: partyId,
                accept: "Y",
                evidenceText: "Asked again at the counter, signed form"
            })
        )
        const blocked = system(() =>
            call("mantle.party.MessageServices.check#Suppressions", {
                destinationList: ["ada.audiencewalk@example.com"],
                organizationPartyId: ids.organizationId
            })
        )
        // the Inbox's create, as its screen's grant calls Mantle: as the user, the artifact check off
        const mailbox = asUser(users.audience, () =>
            system(() =>
                call("mantle.marketing.ContactListServices.create#ContactList", {
                    contactListTypeEnumId: "MAILBOX",
                    contactListName: "Audience walk room",
                    memberPartyIdList: [prefix + "_BO"]
                })
            )
        )
        return {resubscribed, status: statusOf(listId, partyId), blocked, mailbox}
    },
    then({resubscribed, status, blocked, mailbox}) {
        resubscribed.errors == ""
        resubscribed.messages.includes("1 accepted") && resubscribed.messages.includes("suppressed")
        status == "CLPT_ACCEPTED"
        Array.from(blocked.suppressed).length == 1
        statusOf(mailbox.contactListId, prefix + "_BO") == "CLPT_ACCEPTED"
        statusOf(mailbox.contactListId, "BOSS_MKT_AUDIENCE") == "CLPT_ACCEPTED"
    }
})
