// Marketing's campaign screens (impl-marketing P2; design-marketing §3 CampaignDetail, §14.3): CampaignDetail's one qvt render, with
// all of its checks on that render: the record header of the running demo campaign (its organization, revision, budget, status and
// the one primary action of its status, Complete, for its author), its people, its decisions (the approval of revision 1 by the
// approver) and its conversation and files as a Chatter and RecordFiles host; and another organization's campaign shown "Not
// available" to the author. The campaign rules are Mantle's (test/marketing/Campaigns, MarketingApprovals); the access rules
// MarketingAccess's. The planning scenario is the acceptance MarketingCampaignsWalk.
// Run: ./moq test mr-boss --spec MarketingCampaigns
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const {ids, users, asUser, page} = lib

spec({})

feature(
    "CampaignDetail renders a campaign's header, people, decisions and its conversation and files for its author; another organization's is not available",
    {
        when() {
            return {
                detail: asUser(users.author, () =>
                    page("Campaigns/CampaignDetail", {marketingCampaignId: ids.runningCampaignId})
                ),
                other: asUser(users.author, () =>
                    page("Campaigns/CampaignDetail", {marketingCampaignId: ids.servicesCampaignId}, "html")
                )
            }
        },
        then({detail, other}) {
            detail.status == 200 && detail.errors.length == 0
            detail.output.includes("Spring garden launch")
            detail.output.includes("Ziziwork Retail")
            detail.output.includes("revision 1")
            detail.output.includes("In progress")
            // the one primary action of a campaign in progress, for its author
            detail.output.includes("Complete")
            !detail.output.includes("Request approval")
            detail.output.includes("Spring launch evening")
            detail.output.includes("Marketing Author")
            detail.output.includes("Within the season's budget")
            detail.output.includes("CampaignChatter") && detail.output.includes("CampaignFiles")
            other.output.includes("is not available") && !other.output.includes("Service plan renewals")
        }
    }
)
