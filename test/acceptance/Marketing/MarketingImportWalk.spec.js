// Marketing P4's "usable when" (impl-marketing P4; design-marketing §16.3 scenario 4), as an acceptance walk through the screens'
// transitions with artifact authorization on: marketing.audience imports a CSV of six contacts, one malformed and one already
// unsubscribed from the list, on AudienceImport (staged, previewed, then applied): four filed pending by their evidence, the two
// named (invalid, withdrawn); the run shows in Admin's Imports for a data operator who also holds MARKETING_AUDIENCE_VIEW, as a
// summary with no row or address; and two lists merge on AudienceMerge with their histories kept (the source rows and the target's
// requests naming their source list). The rules themselves are Mantle's AudienceImport and ListMerge, the BOSS render and Admin
// listing MarketingImport.
// Run: ./moq accept mr-boss --spec MarketingImportWalk
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const {ids, users, asUser, system, page} = lib
const LIST = "mantle.marketing.contact.ContactList"
const CLP = "mantle.marketing.contact.ContactListParty"
const IMPORT = "mantle.marketing.contact.AudienceImport"
const ITEM = "mantle.marketing.contact.AudienceImportItem"
const prefix = "MKT_IMP_WALK"
let listId, mergeTargetId, importId

function post(root, path, parameters) {
    const result = ec.screen
        .makeTest()
        .rootScreen("component://mr-boss/screen/" + root + ".xml")
        .render(path, parameters, "post")
    const errors = Array.from(result.errorMessages || []).join(" | ")
    const messages = Array.from(result.messages || []).join(" | ")
    ec.message.clearErrors()
    return {status: result.status, errors, messages}
}
const statusOf = (contactListId, partyId) =>
    system(
        () =>
            Array.from(ec.entity.find(CLP).condition({contactListId, partyId}).orderBy("-fromDate").list()).map(
                row => row.statusId
            )[0] || null
    )
// six contacts: four new or matched, one malformed address, Olive unsubscribed from the list (her withdrawal later than the evidence)
const csv = [
    "First Name,Last Name,Email",
    "Ivy,Importwalk,ivy.importwalk@example.com",
    "Jon,Importwalk,jon.importwalk@example.com",
    "Kai,Importwalk,kai.importwalk@example.com",
    "Lea,Importwalk,lea.importwalk@example.com",
    "Mal,Formed,mal-formed-at-example",
    "Olive,Harper,olive.harper@zizi-customers.example"
].join("\n")

spec({
    setupSpec() {
        login("john.doe")
        system(() => {
            listId = prefix + "_LIST"
            call("create#" + LIST, {
                contactListId: listId,
                contactListName: "Import walk news",
                contactListTypeEnumId: "NEWSLETTER",
                contactMechTypeEnumId: "CmtEmailAddress",
                ownerPartyId: ids.organizationId
            })
            // Olive was on the list and unsubscribed yesterday
            call("create#" + CLP, {
                contactListId: listId,
                partyId: "BOSS_MKT_CON_OLIVE",
                fromDate: new Date(Date.now() - 20 * 86400000),
                statusId: "CLPT_UNSUBSCRIBED",
                preferredContactMechId: "BOSS_MKT_CON_OLIVE_EM",
                revision: 2
            })
            call("create#mantle.party.PartyConsent", {
                partyConsentId: prefix + "_OLIVE_OUT",
                partyId: "BOSS_MKT_CON_OLIVE",
                contactMechId: "BOSS_MKT_CON_OLIVE_EM",
                contactListId: listId,
                purposeEnumId: "PcpMarketingEmail",
                statusId: "PconWithdrawn",
                consentDate: new Date(Date.now() - 86400000),
                sourceEnumId: "PcsEmailLink"
            })
            mergeTargetId = prefix + "_TARGET"
            call("create#" + LIST, {
                contactListId: mergeTargetId,
                contactListName: "Import walk merged",
                contactListTypeEnumId: "NEWSLETTER",
                contactMechTypeEnumId: "CmtEmailAddress",
                ownerPartyId: ids.organizationId
            })
            // a data operator of Retail who also reads audiences
            const userId = prefix + "_DATA"
            call("create#mantle.party.Party", {partyId: userId, partyTypeEnumId: "PtyPerson"})
            call("create#mantle.party.Person", {partyId: userId, firstName: "Import walk", lastName: "Data"})
            call("create#mantle.party.PartyRelationship", {
                relationshipTypeEnumId: "PrtAgent",
                fromPartyId: userId,
                toPartyId: ids.organizationId,
                toRoleTypeId: "OrgInternal",
                fromDate: 0
            })
            call("create#moqui.security.UserAccount", {
                userId,
                username: userId.toLowerCase(),
                partyId: userId,
                currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
                passwordHashType: "SHA"
            })
            call("create#moqui.security.UserGroup", {userGroupId: userId, description: "Import walk: audience view"})
            call("create#moqui.security.UserGroupPermission", {
                userGroupId: userId,
                userPermissionId: "MARKETING_AUDIENCE_VIEW",
                fromDate: 0
            })
            for (const userGroupId of ["BOSS_USERS", "BOSS_ADMIN_DATA", userId])
                call("create#moqui.security.UserGroupMember", {userId, userGroupId, fromDate: 0})
        })
    }
})

feature("a CSV of six contacts imports four pending by their evidence and names the malformed and the unsubscribed rows", {
    when() {
        const staged = asUser(users.audience, () =>
            post("Marketing", "Audiences/AudienceImport/previewImport", {
                contactListId: listId,
                fileText: csv,
                fileName: "import-walk.csv",
                sourceEnumId: "PcsForm",
                evidenceDate: new Date(Date.now() - 3 * 86400000),
                evidenceText: "Workshop sign-up sheet"
            })
        )
        const imported = system(() => ec.entity.find(IMPORT).condition("contactListId", listId).one())
        importId = imported?.audienceImportId
        const preview = asUser(users.audience, () => page("Audiences/AudienceImport", {audienceImportId: importId}))
        const applied = asUser(users.audience, () =>
            post("Marketing", "Audiences/AudienceImport/applyImport", {
                audienceImportId: importId,
                expectedRevision: Number(imported.lastUpdatedStamp)
            })
        )
        const results = asUser(users.audience, () =>
            page("Audiences/AudienceImport", {audienceImportId: importId, outcome: "errors"})
        )
        const outcomes = system(() =>
            Object.fromEntries(
                Array.from(ec.entity.find(ITEM).condition("audienceImportId", importId).list()).map(item => [
                    Number(item.rowNumber),
                    item
                ])
            )
        )
        return {staged, preview, applied, results, outcomes}
    },
    then({staged, preview, applied, results, outcomes}) {
        staged.errors == "" && !!importId
        preview.output.includes("6 rows") && preview.output.includes("1 excluded")
        applied.errors == ""
        Object.values(outcomes).filter(item => item.outcome == "pending").length == 4
        outcomes[5].outcome == "invalid" && outcomes[5].reasonCode == "INVALID_ADDRESS"
        outcomes[6].outcome == "refused" && outcomes[6].reasonCode == "WITHDRAWN"
        statusOf(listId, "BOSS_MKT_CON_OLIVE") == "CLPT_UNSUBSCRIBED"
        results.output.includes("The address is not valid") && results.output.includes("Withdrawn after the evidence")
    }
})

feature("the run shows in Admin's Imports for a data operator who also holds the audience view, as a summary", {
    when() {
        return {
            listed: asUser(prefix.toLowerCase() + "_data", () =>
                Array.from(
                    ec.service
                        .sync()
                        .name("org.moqui.admin.DataTransferServices.find#ImportRuns")
                        .parameters({targetId: "marketingAudience"})
                        .call()?.transferList || []
                )
            )
        }
    },
    then({listed}) {
        listed.some(run => run.runId == importId && run.ownerRoute == "marketingAudienceImport")
        !JSON.stringify(listed).includes("importwalk@example.com")
    }
})

feature("two lists merge into a third with their histories kept", {
    when() {
        const preview = asUser(users.audience, () =>
            system(() =>
                ec.service
                    .sync()
                    .name("mantle.marketing.AudienceServices.preview#ListMerge")
                    .parameters({contactListId: mergeTargetId, sourceListIdList: [listId, ids.gardenListId]})
                    .call()
            )
        )
        const shown = asUser(users.audience, () =>
            page("Audiences/AudienceMerge", {contactListId: mergeTargetId, sourceListIds: listId + "," + ids.gardenListId})
        )
        const merged = asUser(users.audience, () =>
            post("Marketing", "Audiences/AudienceMerge/mergeLists", {
                contactListId: mergeTargetId,
                sourceListIds: listId + "," + ids.gardenListId,
                previewKey: preview.previewKey,
                reasonText: "One workshop list"
            })
        )
        return {preview, shown, merged}
    },
    then({preview, shown, merged}) {
        shown.output.includes("Import walk merged") && shown.output.includes("Garden newsletter")
        merged.errors == ""
        // Maya accepted with her garden evidence, the imported pending, Olive withdrawn from both sources is not carried
        statusOf(mergeTargetId, ids.acceptedPartyId) == "CLPT_ACCEPTED"
        statusOf(mergeTargetId, "BOSS_MKT_CON_OLIVE") == null
        statusOf(ids.gardenListId, ids.acceptedPartyId) == "CLPT_ACCEPTED"
        system(() =>
            ec.entity
                .find("mantle.marketing.contact.SubscriptionRequest")
                .condition({contactListId: mergeTargetId, requestKindEnumId: "SrkMerge"})
                .count()
        ) == preview.carriedCount
    }
})
