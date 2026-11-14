// Marketing's lists (impl-marketing P3; design-marketing §4 ListDetail, §10 the bulk "Add to list (evidenced)"): ListDetail's one qvt
// render, with all of its checks on that render (the garden newsletter's header, policy, members with their states and masked
// addresses, Add members for its audience manager, its templates box); and the Sales bulk action on Marketing's context service and
// Mantle's request (called as each user under the service's own rule), with no render of Sales' lists: the list choice refused to a salesperson without Marketing and answered to an
// audience manager, a request of an account's contacts filed pending for a salesperson who manages audiences, refused as missing for
// an audience manager who reads no Sales and refused for a salesperson without the audience permission, with the same parameters.
// The audience rules are Mantle's (test/marketing/Audiences, test/party/Suppressions); the access rules MarketingAccess's. The
// audience scenario is the acceptance MarketingAudienceWalk.
// Run: ./moq test mr-boss --spec MarketingLists
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const {ids, users, asUser, system, page, refusal, invoke} = lib
const choices = "ironstone.marketing.ContextServices.get#Choices"
const request = "mantle.marketing.AudienceServices.request#Subscriptions"

spec({})

feature(
    "ListDetail renders a list's header, policy, members by state with masked addresses, and Add members for its audience manager",
    {
        when() {
            return {detail: asUser(users.audience, () => page("Audiences/ListDetail", {contactListId: ids.gardenListId}))}
        },
        then({detail}) {
            detail.status == 200 && detail.errors.length == 0
            detail.output.includes("Garden newsletter")
            detail.output.includes("Ziziwork Retail")
            detail.output.includes("Spring garden launch")
            detail.output.includes("confirmation required")
            detail.output.includes("Yes, send me the garden newsletter")
            detail.output.includes("Add members")
            // the current members: Maya subscribed, Noah pending, Pete legacy; addresses masked
            detail.output.includes("Maya Lindqvist") &&
                detail.output.includes("Noah Brandt") &&
                detail.output.includes("Pete Okafor")
            detail.output.includes("Pending") && detail.output.includes("Subscribed")
            detail.output.includes("m***@zizi-customers.example") &&
                !detail.output.includes("maya.lindqvist@zizi-customers.example")
            detail.output.includes("Templates")
        }
    }
)

feature(
    "the Sales bulk action files an account's contacts pending for a salesperson who manages audiences, and is refused otherwise",
    {
        when() {
            const parameters = {
                contactListId: ids.gardenListId,
                salesAccountPartyIdList: [ids.salesAccountId],
                evidenceText: "Asked for the newsletter on the October call"
            }
            return {
                repChoice: asUser(users.salesRep, () =>
                    system(() => refusal(choices, {appRoot: "Marketing", choice: "audienceLists"}))
                ),
                audienceChoice: asUser(users.audience, () =>
                    system(() => invoke(choices, {appRoot: "Marketing", choice: "audienceLists"}).options)
                ),
                rep: asUser(users.salesRep, () => system(() => refusal(request, parameters))),
                audience: asUser(users.audience, () => system(() => invoke(request, parameters))),
                filed: asUser(users.salesAudience, () => system(() => invoke(request, parameters)))
            }
        },
        then({repChoice, audienceChoice, rep, audience, filed}) {
            repChoice.includes("MARKETING_UNAVAILABLE")
            audienceChoice.some(option => option.value == ids.gardenListId)
            rep.includes("PERMISSION_DENIED")
            // an audience manager without Sales does not see the account: its item refused as missing, nothing filed
            audience.refusedCount == 1 && Array.from(audience.results)[0].reasonCode == "RECORD_UNAVAILABLE"
            filed.pendingCount == 1
            Array.from(filed.results)[0].partyId == ids.salesContactId
            Array.from(filed.results)[0].kind == "account"
        }
    }
)
