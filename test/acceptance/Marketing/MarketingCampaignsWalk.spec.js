// Marketing P2's "usable when" (impl-marketing P2), as an acceptance walk through the screens' transitions with artifact authorization
// on: marketing.author plans a campaign with a budget and a manager on Campaigns and asks for its approval on CampaignDetail;
// marketing.approver approves it from Approvals (Commons' Notifications with the campaign's notice); the author's later budget change
// returns it to review (Planned, the approval ended by the change); a cost linked to an Accounting line shows in the actual cost
// once (a second link of the same line refused); and the Ziziwork Services author can open none of it, by detail, list, palette or
// direct service. The rules themselves are Mantle's Campaigns and MarketingApprovals, the access MarketingAccess.
// Run: ./moq accept mr-boss --spec MarketingCampaignsWalk
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page} = lib
const C = "mantle.marketing.CampaignServices."
const CAMPAIGN = "mantle.marketing.campaign.MarketingCampaign"
const ledger = {acctgTransId: "MKT_ACC_AT", acctgTransEntrySeqId: "01"}
// the author reads ledger lines to link one (an Accounting read beside the Marketing grant)
const financeGroup = "MKT_ACC_FINANCE"

// A Marketing transition posted as the user's browser does
function post(path, parameters) {
    const result = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Marketing.xml").render(path, parameters, "post")
    const errors = Array.from(result.errorMessages || []).join(" | ")
    ec.message.clearErrors()
    return {status: result.status, errors}
}
const campaignRow = id => system(() => ec.entity.find(CAMPAIGN).condition("marketingCampaignId", id).one())
const entityLib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const revision = id => entityLib.ms(campaignRow(id).lastUpdatedStamp)

spec({
    setupSpec() {
        login("john.doe")
        system(() => {
            call("create#moqui.security.UserGroup", {userGroupId: financeGroup, description: "Marketing walk: ledger read"})
            call("create#moqui.security.UserGroupPermission", {
                userGroupId: financeGroup,
                userPermissionId: "ACCOUNTING_VIEW",
                fromDate: 0
            })
            call("create#moqui.security.UserGroupMember", {userId: "BOSS_MKT_AUTHOR", userGroupId: financeGroup, fromDate: 0})
            call("create#mantle.ledger.transaction.AcctgTrans", {
                acctgTransId: ledger.acctgTransId,
                organizationPartyId: ids.organizationId,
                isPosted: "Y",
                amountUomId: "USD",
                transactionDate: ec.user.nowTimestamp
            })
            call("create#mantle.ledger.transaction.AcctgTransEntry", {
                acctgTransId: ledger.acctgTransId,
                acctgTransEntrySeqId: ledger.acctgTransEntrySeqId,
                debitCreditFlag: "D",
                amount: 750,
                description: "Radio spots"
            })
        })
    },
    cleanupSpec() {
        login("john.doe")
        system(() =>
            ec.entity
                .find("moqui.security.UserGroupMember")
                .condition("userGroupId", financeGroup)
                .updateAll({thruDate: ec.user.nowTimestamp})
        )
    }
})

let campaignId = null
feature("the author plans a campaign with a budget and a manager, and asks for its approval", {
    when() {
        const created = asUser(users.author, () =>
            post("Campaigns/Campaigns/createCampaign", {
                campaignName: "Walk autumn push",
                organizationPartyId: ids.organizationId,
                managerPartyId: "BOSS_MKT_AUTHOR",
                fromDate: "2027-03-01",
                thruDate: "2027-03-31",
                costUomId: "USD",
                budgetedCost: "5000"
            })
        )
        campaignId = system(
            () => ec.entity.find(CAMPAIGN).condition("campaignName", "Walk autumn push").one()?.marketingCampaignId
        )
        const asked = asUser(users.author, () =>
            post("Campaigns/CampaignDetail/requestApproval", {marketingCampaignId: campaignId, targetRevision: 1})
        )
        return {created, asked, row: campaignRow(campaignId)}
    },
    then({created, asked, row}) {
        created.errors == "" && row.budgetedCost.toNumber() == 5000 && row.statusId == "MKTG_CAMP_PLANNED"
        asked.errors == ""
    }
})

feature("the approver approves it from Approvals", {
    when() {
        const notice = system(() =>
            ec.entity
                .find("moqui.security.user.NotificationMessage")
                .condition({topic: "MarketingCampaignApproval", recordId: campaignId})
                .one()
        )
        const list = asUser(users.approver, () => page("Campaigns/Approvals", {}, "html"))
        const approved = asUser(users.approver, () =>
            post("Campaigns/Approvals/Notifications/approve", {notificationMessageId: notice?.notificationMessageId})
        )
        return {notice, list, approved, row: campaignRow(campaignId)}
    },
    then({notice, list, approved, row}) {
        !!notice
        list.output.includes("Walk autumn push")
        approved.errors == "" && row.statusId == "MKTG_CAMP_APPROVED"
    }
})

feature("the author's later budget change returns it to review", {
    when() {
        const changed = asUser(users.author, () =>
            post("Campaigns/CampaignDetail/storeBudget", {
                marketingCampaignId: campaignId,
                expectedRevision: revision(campaignId),
                budgetedCost: "6500",
                explanation: "Radio added"
            })
        )
        const detail = asUser(users.author, () => page("Campaigns/CampaignDetail", {marketingCampaignId: campaignId}, "html"))
        return {changed, detail, row: campaignRow(campaignId)}
    },
    then({changed, detail, row}) {
        changed.errors == "" && row.statusId == "MKTG_CAMP_PLANNED" && row.campaignRevision == 2
        detail.output.includes("Ended by a later change")
        detail.output.includes("Request approval")
    }
})

feature("a cost linked to an Accounting line shows in the actual cost once", {
    when() {
        const linked = asUser(users.author, () =>
            post("Campaigns/CampaignDetail/storeCost", Object.assign({marketingCampaignId: campaignId, amount: "750"}, ledger))
        )
        const again = asUser(users.author, () =>
            refusal(C + "store#CampaignCost", Object.assign({marketingCampaignId: campaignId, amount: "750"}, ledger))
        )
        return {linked, again, row: campaignRow(campaignId)}
    },
    then({linked, again, row}) {
        linked.errors == "" && row.actualCost.toNumber() == 750
        again.includes("SOURCE_ALREADY_COUNTED")
    }
})

feature("the Ziziwork Services author can open none of it", {
    when() {
        return asUser(users.otherAuthor, () => ({
            detail: page("Campaigns/CampaignDetail", {marketingCampaignId: campaignId}, "html"),
            list: page("Campaigns/Campaigns", {text: "Walk autumn"}, "html"),
            palette: invoke("ironstone.marketing.ContextServices.search#Records", {text: "Walk autumn"}).rows,
            direct: refusal(C + "get#Campaign", {marketingCampaignId: campaignId}),
            costs: refusal(C + "find#CampaignCosts", {marketingCampaignId: campaignId})
        }))
    },
    then({detail, list, palette, direct, costs}) {
        detail.output.includes("is not available") && !detail.output.includes("Radio added")
        !list.output.includes("Walk autumn push")
        palette.length == 0
        direct.includes("RECORD_UNAVAILABLE") && costs.includes("RECORD_UNAVAILABLE")
    }
})
