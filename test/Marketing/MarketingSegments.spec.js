// Marketing's segments and audience preview (impl-marketing P5; design-marketing §4 SegmentDetail, AudiencePreview): SegmentDetail's
// one qvt render, with all of its checks on that render (the garden newsletter readers' header, rules, filter in words, explicit
// members, the evaluation with its count, who it matched and by what, Preview audience for its audience manager); and AudiencePreview's
// one html render for an author, who reaches it past the area's deny: the bucket counts of the garden newsletter and its rows with
// masked addresses and no names. The segment and eligibility rules are Mantle's (test/marketing/Segments, Eligibility); the access
// rules MarketingAccess's. The audience scenario is the acceptance MarketingAudiencePreviewWalk.
// Run: ./moq test mr-boss --spec MarketingSegments
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const {ids, users, asUser, page} = lib

spec({})

feature("SegmentDetail renders a segment's header, rules, filter, explicit members and its evaluation for its audience manager", {
    when() {
        return {detail: asUser(users.audience, () => page("Audiences/SegmentDetail", {marketSegmentId: ids.gardenSegmentId}))}
    },
    then({detail}) {
        detail.status == 200 && detail.errors.length == 0
        detail.output.includes("Garden newsletter readers")
        detail.output.includes("Ziziwork Retail")
        detail.output.includes("Preview audience")
        // the filter in words, over the engagement source
        detail.output.includes("Engagement · Subscribed list includes BOSS_MKT_LIST_GARDEN")
        detail.output.includes("Add a condition") && detail.output.includes("Add a rule")
        // Noah included by hand; the evaluation finds Maya and Pete by the filter and Noah by his inclusion
        detail.output.includes("Explicit members · 1")
        detail.output.includes("Noah Brandt")
        detail.output.includes("3 matched, 0 left out")
        detail.output.includes("Maya Lindqvist") && detail.output.includes("Pete Okafor")
        detail.output.includes("Rules: filter")
        !detail.output.includes("Olive Harper")
    }
})

feature("AudiencePreview shows an author the garden newsletter's buckets with masked addresses and no names", {
    when() {
        return {
            preview: asUser(users.author, () =>
                page(
                    "Audiences/AudiencePreview",
                    {topicListId: ids.gardenListId, listIds: ids.gardenListId, segmentIds: ids.gardenSegmentId},
                    "html"
                )
            )
        }
    },
    then({preview}) {
        preview.status == 200 && preview.errors.length == 0
        // Maya, Noah, Olive and Pete matched (and whoever another spec filed pending): Maya eligible, Noah pending, Olive suppressed
        // (her complaint) and Pete needing evidence
        /\d+ people matched/.test(preview.output)
        preview.output.includes("1 eligible")
        preview.output.includes("Waiting for confirmation") && preview.output.includes("Legacy member with no evidence")
        preview.output.includes("Address suppressed")
        preview.output.includes("m***@zizi-customers.example")
        !preview.output.includes("maya.lindqvist@zizi-customers.example")
        !preview.output.includes("Maya Lindqvist")
    }
})
