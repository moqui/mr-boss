// Marketing's sends and their composer (impl-marketing P8; design-marketing §5 SendDetail, Compose): SendDetail's one qvt render of the
// approved November newsletter for its author, with all of its checks on that render (the header and its state, the preparation and
// its count, the prepared content rendered with sample values, the audience's buckets, the approver's decision, no decision offered to
// its author); and Compose's one qvt render of the draft spring invitation (its content in the editor with its declared variable, the
// test list of Campaign defaults, the preview with sample values); P10: ExperimentDetail's one qvt render of the draft subject test for
// its author (its setup, its variants with the parts each changes, the results' denominators and clicks not available, the author's
// Edit and no winner's choice). The send rules are Mantle's (test/marketing/Sends, Experiments); the access
// rules MarketingAccess's. The compose-to-approval scenario is the acceptance MarketingComposeWalk.
// Run: ./moq test mr-boss --spec MarketingSends
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const {ids, users, asUser, page} = lib

spec({})

feature("SendDetail shows an approved send's preparation, prepared content, audience and decision to its author", {
    when() {
        return {detail: asUser(users.author, () => page("Sends/SendDetail", {campaignSendId: ids.approvedSendId}))}
    },
    then({detail}) {
        detail.status == 200 && detail.errors.length == 0
        detail.output.includes("Garden newsletter, November") && detail.output.includes("Approved")
        detail.output.includes("Spring garden launch") && detail.output.includes("topic Garden newsletter")
        // the preparation and its count; the prepared content with the sample's first name
        detail.output.includes("1 eligible, 1 untracked")
        detail.output.includes("Prepared content")
        detail.output.includes("Garden news for Alex") && detail.output.includes("Hello Alex")
        // the audience's buckets at the preparation, the AudiencePreview link
        detail.output.includes("All the topic members") && detail.output.includes("Needs evidence")
        detail.output.includes("Preview the audience")
        // the approver's decision; the author decides nothing of their own and the approved send needs no preparation
        detail.output.includes("Content and audience as planned")
        !detail.output.includes("SendDecisionDialog") && !detail.output.includes("PrepareDialog")
        detail.output.includes("Edit content")
        // not released: no Delivery box (follow-up 7: a container-box condition is not read, so it showed "Released undefined")
        !detail.output.includes("handed off:") && !detail.output.includes("Released undefined")
    }
})

feature("Compose shows a draft's content, its test list and its preview with sample values", {
    when() {
        return {compose: asUser(users.author, () => page("Sends/Compose", {campaignSendId: ids.draftSendId}))}
    },
    then({compose}) {
        compose.status == 200 && compose.errors.length == 0
        compose.output.includes("Compose Spring preview invitation")
        // the editor with the subject and the declared variable
        compose.output.includes("You are invited, ${firstName}")
        compose.output.includes("firstName | First name | friend")
        // the test dialog with the organization's test list
        compose.output.includes("Send a test") && compose.output.includes("marketing.review@retail.example")
        // the preview with sample values, and what to check
        compose.output.includes("You are invited, Alex") && compose.output.includes("Dear Alex")
        compose.output.includes("No text alternative")
        compose.output.includes("Attach a file")
    }
})

feature("ExperimentDetail shows a draft's A/B test: its setup, its variants and results not yet counted", {
    when() {
        return {detail: asUser(users.author, () => page("Sends/ExperimentDetail", {campaignSendId: ids.experimentSendId}))}
    },
    then({detail}) {
        detail.status == 200 && detail.errors.length == 0
        detail.output.includes("A/B test of Spring sale subject test") && detail.output.includes("Not sent yet")
        detail.output.includes("20% sample, split equally") && detail.output.includes("measure: Unique click rate")
        detail.output.includes("Counted when the send is prepared")
        // the variants: A the send's content, B its own subject
        detail.output.includes("Variant B: Urgent") && detail.output.includes("Last days of the spring sale")
        detail.output.includes("none: the send's content")
        // the results: no click yet (P15 counts them), no conversion (P20), the decision undecided with no accepted recipient
        detail.output.includes("Unique clicks") && detail.output.includes("Conversions")
        detail.output.includes("No accepted, tracking-enabled recipient in a variant yet")
        // the author edits the variants and the setup; no winner is chosen or released before the sample
        detail.output.includes("EditVariant_BOSS_MKT_EXPT_SPRING_B") && detail.output.includes("Edit the setup")
        !detail.output.includes("ChooseWinnerDialog") && !detail.output.includes("ReleaseWinnerDialog")
    }
})
