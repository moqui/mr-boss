// Marketing P5's "usable when" (impl-marketing P5, gate 1; design-marketing §16.3 scenario 3), as an acceptance walk through the
// screens and their transitions with artifact authorization on: marketing.audience makes a segment on Segments and includes two
// people on SegmentDetail, then previews a topic list over two lists and the segment; the people have a missing address, a duplicate
// address, a pending and an unsubscribed membership, a suppressed address and a tracking refusal; the bucket totals sum exactly to the
// people matched, each person in one bucket; marketing.author previews the same audience past the area's deny and sees the same
// totals with every address masked and no name; and a change of the segment subscribes no one. The rules themselves are Mantle's
// Segments and Eligibility, the access MarketingAccess.
// Run: ./moq accept mr-boss --spec MarketingAudiencePreviewWalk
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const {ids, users, asUser, system, page} = lib
const prefix = "MKT_PRV_WALK"
const topic = prefix + "_TOPIC",
    second = prefix + "_SECOND"
const CLP = "mantle.marketing.contact.ContactListParty"
const ago = days => new Date(Date.now() - days * 86400000)
// each person: the email (none for a missing address; a shared one for the duplicate), the topic membership, the evidence, tracking
const people = {
    ALMA: {
        email: "alma.previewwalk@example.com",
        status: "CLPT_ACCEPTED",
        grant: true,
        tracking: "PconGranted",
        bucket: "eligible"
    },
    BRUNO: {
        email: "family.previewwalk@example.com",
        status: "CLPT_ACCEPTED",
        grant: true,
        tracking: "PconWithdrawn",
        bucket: "eligible"
    },
    CLARA: {email: "family.previewwalk@example.com", status: "CLPT_ACCEPTED", grant: true, bucket: "duplicate"},
    DARIO: {status: "CLPT_ACCEPTED", grant: true, bucket: "destination"},
    ELENA: {email: "elena.previewwalk@example.com", status: "CLPT_PENDING", bucket: "withdrawn"},
    FABIO: {email: "fabio.previewwalk@example.com", status: "CLPT_UNSUBSCRIBED", bucket: "withdrawn"},
    GRETA: {email: "greta.previewwalk@example.com", status: "CLPT_ACCEPTED", grant: true, bucket: "suppressed"},
    HUGO: {email: "hugo.previewwalk@example.com", secondOnly: true, bucket: "withdrawn"}
}
const partyOf = key => prefix + "_" + key
let segmentId

// A transition posted as the user's browser does, under the Marketing root
function post(path, parameters) {
    const result = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Marketing.xml").render(path, parameters, "post")
    const errors = Array.from(result.errorMessages || []).join(" | ")
    ec.message.clearErrors()
    return {status: result.status, errors}
}
// Mantle's preview as the user with the artifact check off, as AudiencePreview's grant lets it call Mantle: the service's own checks
// decide what the user sees (names and whole addresses an audience reader's only)
const preview = user =>
    asUser(user, () =>
        system(() =>
            ec.service
                .sync()
                .name("mantle.marketing.SegmentServices.preview#Audience")
                .parameters({topicListId: topic, listIds: [topic, second], segmentIds: [segmentId], pageSize: 50})
                .call()
        )
    )
const memberships = () => system(() => ec.entity.find(CLP).condition("contactListId", "in", [topic, second]).count())

spec({
    setupSpec() {
        login("john.doe")
        system(() => {
            for (const [id, name] of [
                [topic, "Preview walk topic"],
                [second, "Preview walk second list"]
            ])
                call("create#mantle.marketing.contact.ContactList", {
                    contactListId: id,
                    contactListName: name,
                    contactListTypeEnumId: "NEWSLETTER",
                    contactMechTypeEnumId: "CmtEmailAddress",
                    ownerPartyId: ids.organizationId
                })
            for (const [key, person] of Object.entries(people)) {
                const partyId = partyOf(key)
                call("create#mantle.party.Party", {partyId, partyTypeEnumId: "PtyPerson", ownerPartyId: ids.organizationId})
                call("create#mantle.party.Person", {
                    partyId,
                    firstName: key[0] + key.slice(1).toLowerCase(),
                    lastName: "Previewwalk"
                })
                if (person.email) {
                    call("create#mantle.party.contact.ContactMech", {
                        contactMechId: partyId + "_EM",
                        contactMechTypeEnumId: "CmtEmailAddress",
                        infoString: person.email
                    })
                    call("create#mantle.party.contact.PartyContactMech", {
                        partyId,
                        contactMechId: partyId + "_EM",
                        contactMechPurposeId: "EmailPrimary",
                        fromDate: ago(30)
                    })
                }
                call("create#" + CLP, {
                    contactListId: person.secondOnly ? second : topic,
                    partyId,
                    fromDate: ago(20),
                    statusId: person.status || "CLPT_ACCEPTED",
                    preferredContactMechId: person.email ? partyId + "_EM" : null
                })
                if (person.grant)
                    call("create#mantle.party.PartyConsent", {
                        partyId,
                        contactMechId: person.email ? partyId + "_EM" : null,
                        contactListId: topic,
                        purposeEnumId: "PcpMarketingEmail",
                        statusId: "PconGranted",
                        consentDate: ago(19),
                        sourceEnumId: "PcsForm",
                        evidenceText: "Preview walk sign-up"
                    })
                if (person.tracking)
                    call("create#mantle.party.PartyConsent", {
                        partyId,
                        purposeEnumId: "PcpTracking",
                        statusId: person.tracking,
                        consentDate: ago(18),
                        sourceEnumId: "PcsForm",
                        evidenceText: "Preview walk tracking choice"
                    })
            }
            call("create#mantle.party.MessageSuppression", {
                channelEnumId: "MdcEmail",
                destinationKey: "greta.previewwalk@example.com",
                organizationPartyId: ids.organizationId,
                reasonEnumId: "MsrComplaint",
                sourceEnumId: "MssStaff",
                evidenceText: "Preview walk complaint",
                fromDate: ago(2)
            })
        })
    }
})

feature("the audience manager makes a segment on Segments and includes two people on SegmentDetail", {
    when() {
        const created = asUser(users.audience, () =>
            post("Audiences/Segments/createSegment", {
                organizationPartyId: ids.organizationId,
                segmentName: "Preview walk segment",
                segmentKindEnumId: "MskExplicit"
            })
        )
        segmentId = system(
            () =>
                ec.entity.find("mantle.marketing.segment.MarketSegment").condition("segmentName", "Preview walk segment").one()
                    ?.marketSegmentId
        )
        const included = ["ALMA", "HUGO"].map(key =>
            asUser(users.audience, () =>
                post("Audiences/SegmentDetail/storeSegmentMember", {
                    marketSegmentId: segmentId,
                    partyId: partyOf(key),
                    memberKindEnumId: "MspInclude"
                })
            )
        )
        return {
            created,
            included,
            detail: asUser(users.audience, () => page("Audiences/SegmentDetail", {marketSegmentId: segmentId}, "html"))
        }
    },
    then({created, included, detail}) {
        created.errors == "" && !!segmentId
        included.every(result => result.errors == "")
        detail.errors.length == 0
        detail.output.includes("Explicit members · 2")
        detail.output.includes("2 matched")
    }
})

feature("a preview over two lists and the segment puts each person in one bucket, and the totals sum to the people matched", {
    when() {
        return {
            found: preview(users.audience),
            screen: asUser(users.audience, () =>
                page(
                    "Audiences/AudiencePreview",
                    {topicListId: topic, listIds: topic + "," + second, segmentIds: segmentId, bucket: "eligible"},
                    "html"
                )
            )
        }
    },
    then({found, screen}) {
        found.matchedCount == Object.keys(people).length
        Array.from(found.bucketList).reduce((sum, entry) => sum + entry.count, 0) == found.matchedCount
        Object.fromEntries(Array.from(found.bucketList).map(entry => [entry.bucket, entry.count])) ==
            {unavailable: 0, destination: 1, suppressed: 1, withdrawn: 3, evidence: 0, duplicate: 1, eligible: 2}
        // Bruno refused tracking and is still eligible, untracked
        found.eligibleCount == 2 && found.untrackedEligibleCount == 1
        Object.entries(people).every(
            ([key, person]) => Array.from(found.recipientList).find(row => row.partyId == partyOf(key))?.bucket == person.bucket
        )
        screen.errors.length == 0
        screen.output.includes("8 people matched")
        screen.output.includes("Alma Previewwalk") && screen.output.includes("alma.previewwalk@example.com")
        screen.output.includes("Untracked")
    }
})

feature("the author sees the same totals with every address masked and no name, and a segment change subscribes no one", {
    when() {
        const before = memberships()
        const audience = preview(users.audience)
        const author = preview(users.author)
        const screen = asUser(users.author, () =>
            page("Audiences/AudiencePreview", {topicListId: topic, listIds: topic + "," + second, segmentIds: segmentId}, "html")
        )
        const excluded = asUser(users.audience, () =>
            post("Audiences/SegmentDetail/storeSegmentMember", {
                marketSegmentId: segmentId,
                partyId: partyOf("FABIO"),
                memberKindEnumId: "MspExclude"
            })
        )
        return {before, after: memberships(), audience, author, screen, excluded}
    },
    then({before, after, audience, author, screen, excluded}) {
        JSON.stringify(Array.from(author.bucketList)) == JSON.stringify(Array.from(audience.bucketList))
        author.addressesShown == false
        Array.from(author.recipientList).every(row => !row.partyId && !row.partyName && !row.addressText.includes("previewwalk@"))
        screen.errors.length == 0
        screen.output.includes("a***@example.com")
        !screen.output.includes("alma.previewwalk@example.com") && !screen.output.includes("Alma Previewwalk")
        excluded.errors == ""
        after == before
    }
})
