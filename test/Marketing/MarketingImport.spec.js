// Marketing's audience import and export (impl-marketing P4; design-marketing §4 AudienceImport, §18): AudienceImport's one qvt render
// of the demo's fall fair import, with all of its checks on that render (its header, evidence, counts and rows, each with its outcome,
// masked address and reason, and no address in full); the target marketingAudience listed in Admin's Imports with its run for a data
// operator who also holds MARKETING_AUDIENCE_VIEW and not for one without it, as a summary pointing at Marketing's place; and the
// membership export through the framework's run#Export for the audience manager, refused to an author without the export permission.
// The import and merge rules are Mantle's (test/marketing/AudienceImport, ListMerge); the import scenario is the acceptance
// MarketingImportWalk.
// Run: ./moq test mr-boss --spec MarketingImport
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const {ids, users, asUser, system, page, invoke} = lib
const T = "org.moqui.admin.DataTransferServices."
const prefix = "SPEC_MKT_IMP"
const call = (name, parameters) => ec.service.sync().name(name).parameters(parameters).disableAuthz().call()
// a data operator of Retail: Admin's data group, with Marketing's audience view or without it
function dataOperator(kind, withView) {
    const userId = prefix + "_" + kind
    const username = userId.toLowerCase()
    if (ec.entity.find("moqui.security.UserAccount").condition("userId", userId).disableAuthz().one()) return username
    call("create#mantle.party.Party", {partyId: userId, partyTypeEnumId: "PtyPerson"})
    call("create#mantle.party.Person", {partyId: userId, firstName: "Marketing import", lastName: "Data " + kind})
    call("create#mantle.party.PartyRelationship", {
        relationshipTypeEnumId: "PrtAgent",
        fromPartyId: userId,
        toPartyId: ids.organizationId,
        toRoleTypeId: "OrgInternal",
        fromDate: 0
    })
    call("create#moqui.security.UserAccount", {
        userId,
        username,
        partyId: userId,
        currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
        passwordHashType: "SHA"
    })
    const groups = ["BOSS_USERS", "BOSS_ADMIN_DATA"]
    if (withView) {
        call("create#moqui.security.UserGroup", {userGroupId: userId, description: "Marketing import spec: audience view"})
        call("create#moqui.security.UserGroupPermission", {
            userGroupId: userId,
            userPermissionId: "MARKETING_AUDIENCE_VIEW",
            fromDate: 0
        })
        groups.push(userId)
    }
    for (const userGroupId of groups) call("create#moqui.security.UserGroupMember", {userId, userGroupId, fromDate: 0})
    return username
}
const operators = {}

spec({
    setupSpec() {
        login("john.doe")
        system(() => {
            operators.withView = dataOperator("VIEW", true)
            operators.without = dataOperator("PLAIN", false)
        })
    }
})

feature("AudienceImport renders an import's header, evidence, counts and rows with outcomes, masked addresses and reasons", {
    when() {
        return {detail: asUser(users.audience, () => page("Audiences/AudienceImport", {audienceImportId: ids.fairImportId}))}
    },
    then({detail}) {
        detail.status == 200 && detail.errors.length == 0
        detail.output.includes("fall-fair-signups.csv")
        detail.output.includes("Store announcements")
        detail.output.includes("Fall fair sign-up sheet: store news by email")
        detail.output.includes("Complete")
        detail.output.includes("2 pending")
        detail.output.includes("Noah Brandt") && detail.output.includes("Pending confirmation")
        detail.output.includes("n***@zizi-customers.example") && !detail.output.includes("noah.brandt@zizi-customers.example")
        detail.output.includes("The address is suppressed and stays so")
        detail.output.includes("Invalid row") && detail.output.includes("The address is not valid")
        // a completed import offers no apply, and the demo's file is not staged: no error rows' download
        !detail.output.includes("Apply 2 rows")
        !detail.output.includes("Download error rows")
    }
})

feature("Admin's Imports lists Marketing's import for a data operator who also holds the audience view, not for one without it", {
    when() {
        const listed = user =>
            asUser(user, () => Array.from(invoke(T + "find#ImportRuns", {targetId: "marketingAudience"}).transferList || []))
        return {withView: listed(operators.withView), without: listed(operators.without)}
    },
    then({withView, without}) {
        const run = withView.find(found => found.runId == ids.fairImportId)
        !!run
        run.ownerRoute == "marketingAudienceImport"
        run.ownerParameters.audienceImportId == ids.fairImportId
        !JSON.stringify(withView).includes("zizi-customers.example")
        !without.some(found => found.runId == ids.fairImportId)
    }
})

feature(
    "the membership export gives the audience manager a list's members with addresses, and refuses an author without the permission",
    {
        when() {
            const parameters = {
                targetId: "marketingAudienceMembers",
                scopeKey: ids.gardenListId,
                selection: {memberStatus: "current"}
            }
            return {
                audience: asUser(users.audience, () => invoke(T + "run#Export", parameters)),
                author: asUser(users.author, () => system(() => lib.refusal(T + "run#Export", parameters)))
            }
        },
        then({audience, author}) {
            audience.exported == true
            audience.fileText.includes("Maya Lindqvist") && audience.fileText.includes("maya.lindqvist@zizi-customers.example")
            !audience.fileText.includes("Olive Harper")
            author.includes("MARKETING_AUDIENCE_EXPORT")
        }
    }
)
