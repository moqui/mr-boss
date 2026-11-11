// Admin P1's "usable when" (impl-admin P1), as an acceptance walk with artifact authorization on: the menu renders for each
// group, and each area of it opens while the others are refused; the delegated access administrator, holding
// ADMIN_ACCESS_MANAGE but not in BOSS_ADMIN_ACCESS, cannot add anyone to it through Tools (Admin › System's group screens and
// the Tools System root) or a direct entity call, and no one without ADMIN_BACKUP_DOWNLOAD can grant it; admin.reader opens Home
// but not System; a Projects client and a PASS public account are refused the root and every ironstone.admin service. The rules
// themselves are AdminAccess's.
// Run: ./moq accept mr-boss --spec AdminFoundationWalk
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {ids, users, asUser, system, refusal, shell} = lib
const areas = ["Home", "Operations", "Agents", "System"]
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
// every ironstone.admin service a screen calls, with parameters it accepts from a user who has Admin
const adminServices = [
    ["ironstone.admin.ContextServices.get#SharedContext", {}],
    ["ironstone.admin.ContextServices.check#Record", {recordType: "organization", recordId: ids.organizationId}],
    ["ironstone.admin.ContextServices.get#Choices", {choice: "organizations"}]
]
// A direct entity create's refusal as the current user: "" when it is stored, else its message.
function entityRefusal(entityName, fields) {
    ec.message.pushErrors()
    try {
        const value = ec.entity.makeValue(entityName)
        value.setFields(fields, true, null, null)
        value.create()
        return ec.message.hasError() ? ec.message.getErrorsString() : ""
    } catch (error) {
        return String(error.message)
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}

spec({
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        system(() =>
            ec.entity
                .find("moqui.security.UserGroupMember")
                .condition({userGroupId: ids.accessGroupId, userId: ids.sharedUserId})
                .deleteAll()
        )
        ec.artifactExecution.enableAuthz()
    }
})

feature("the menu renders for each group, its areas open and the others are refused", {
    when() {
        const problems = []
        for (const user of Object.values(users).filter(user => user !== users.shared)) {
            const found = shell(user, user === users.system)
            if (found.status != 200 || !found.names.includes("Home"))
                problems.push(`${user}'s menu: ${found.status} ${found.names}`)
            for (const area of areas) {
                const expected = found.names.includes(area)
                const rendered = asUser(user, () => lib.page(area, {}, "html"))
                if (opened(rendered) !== expected)
                    problems.push(`${user} ${area}: ${expected ? "refused" : "opened"} ${rendered.status} ${rendered.errors}`)
            }
        }
        // the shared identity holds no Admin group: no menu, Home refused
        if (opened(asUser(users.shared, () => lib.page("Home", {}, "html")))) problems.push("shared.staff opens Admin")
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("the delegated access administrator cannot add anyone to BOSS_ADMIN_ACCESS, nor anyone grant ADMIN_BACKUP_DOWNLOAD", {
    when() {
        const problems = []
        const member = {userGroupId: ids.accessGroupId, userId: ids.sharedUserId, fromDate: ec.user.nowTimestamp}
        asUser(users.delegate, () => {
            // through Tools: Admin › System's group screens and the Tools System root are refused to them
            for (const path of ["System/Access/GroupDetail"]) {
                const rendered = lib.page(path, {userGroupId: ids.accessGroupId}, "html")
                if (opened(rendered)) problems.push(`the delegate opens ${path}`)
            }
            const tools = ec.screen
                .makeTest()
                .rootScreen("component://tools/screen/System.xml")
                .render("Access/GroupDetail", {userGroupId: ids.accessGroupId}, null)
            if (tools.status === 200 && !tools.errorMessages.length)
                problems.push("the delegate opens Tools System's group screen")
            ec.message.clearErrors()
            // through the entity-auto service and a direct entity call
            const service = refusal("create#moqui.security.UserGroupMember", member)
            if (service === "") problems.push("the delegate adds through create#UserGroupMember")
            const direct = entityRefusal("moqui.security.UserGroupMember", member)
            if (direct === "") problems.push("the delegate adds by a direct entity call")
        })
        // no Admin user without ADMIN_BACKUP_DOWNLOAD grants it, the Admin administrator included
        for (const user of [users.delegate, users.access, users.backup, users.admin]) {
            const message = asUser(user, () =>
                refusal("create#moqui.security.UserGroupPermission", {
                    userGroupId: ids.backupGroupId,
                    userPermissionId: "ADMIN_BACKUP_DOWNLOAD",
                    fromDate: ec.user.nowTimestamp
                })
            )
            if (message === "") problems.push(`${user} grants ADMIN_BACKUP_DOWNLOAD`)
        }
        const stored = system(() => ({
            members: ec.entity.find("moqui.security.UserGroupMember").condition(member).count(),
            downloads: ec.entity
                .find("moqui.security.UserGroupPermission")
                .condition({userGroupId: ids.backupGroupId, userPermissionId: "ADMIN_BACKUP_DOWNLOAD"})
                .count()
        }))
        if (stored.members || stored.downloads) problems.push(`stored: ${JSON.stringify(stored)}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature(
    "admin.reader opens Home, not System; a Projects client and a PASS public account are refused the root and every service",
    {
        when() {
            const problems = []
            if (!opened(asUser(users.reader, () => lib.page("Home", {}, "html")))) problems.push("the reader is refused Home")
            if (opened(asUser(users.reader, () => lib.page("System", {}, "html")))) problems.push("the reader opens System")
            for (const user of ["sheldon.acme", "dana@joesdist.example.com"]) {
                if (opened(asUser(user, () => lib.page("Home", {}, "html")))) problems.push(`${user} opens Admin`)
                for (const [service, parameters] of adminServices) {
                    const message = asUser(user, () => refusal(service, parameters))
                    if (!/ADMIN_UNAVAILABLE|is not authorized/.test(message))
                        problems.push(`${user} gets ${service}: ${message || "accepted"}`)
                }
                // the palette source is refused outright (the root's services are not granted to them) or answers no rows
                const rows = asUser(user, () => {
                    try {
                        return lib.invoke("ironstone.admin.ContextServices.search#Records", {text: "Ziziwork"}).rows || []
                    } catch (error) {
                        if (/ADMIN_UNAVAILABLE|is not authorized/.test(String(error.message))) return []
                        throw error
                    }
                })
                if (rows.length) problems.push(`${user}'s palette has Admin rows`)
            }
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)
