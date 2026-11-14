/* The tasks a user never sees in BOSS whatever the project role (mr-pass plan/design-smithy.md §8.3, N-BOSS-ISSUE): the tasks of
 * confidential issues of a public tracker (Smithy) that the user is no Owner of. Mantle keeps such a task in a companion
 * project whose members are the tracker's Owners, so BOSS's ordinary rule (the tasks of the projects one is on) hides it; this
 * is the second layer, for a read that does not go by project membership: Mantle's list of them
 * (mantle.work.ProjectServices.get#VisibleProjectInfo hiddenItemIds; none for an administrator) is left out of the finds of
 * tasks BOSS makes itself. BOSS adds no rule. It fails closed: when the list cannot be read, no task is shown. vis is
 * get#VisibleProjectInfo's answer when the caller has it; one read of it serves every call on one instance of this script.
 * mayName is BOSS's own visibility rule for one work effort by id (a task: get#TaskAccess; a project, or what is in one: a
 * project the user sees), for the reads and writes that take an id from a request. CC0 plus patent grant. */
let own = null
function read() {
    if (own) return own
    let answer = null
    ec.message.pushErrors()
    try {
        answer = ec.service.sync().name("mantle.work.ProjectServices.get#VisibleProjectInfo").call()
        if (ec.message.hasError()) answer = null
    } catch (error) {
        answer = null
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
    own = answer || {}
    return own
}
/* What is hidden: {closed} when the list is not known (everything is hidden), else {set}. */
function state(vis) {
    const info = vis || read()
    return info && info.hiddenItemIds != null ? {closed: false, set: new Set(Array.from(info.hiddenItemIds).map(String))} : {closed: true, set: null}
}
/* The hidden tasks' ids as a set to ask with has(); every id when the list is not known. */
function ids(vis) {
    const hidden = state(vis)
    return hidden.closed ? {has: () => true, size: 1, closed: true} : hidden.set
}
/* A condition that leaves them out of a find (field: its work effort id field), or null when the user has none hidden. */
function condition(vis, field) {
    const hidden = state(vis)
    const cf = ec.entity.conditionFactory
    if (hidden.closed) return cf.makeCondition(field || "workEffortId", "equals", "_NONE_")
    return hidden.set.size ? cf.makeCondition(field || "workEffortId", "not-in", Array.from(hidden.set)) : null
}
/* A find without them. */
function without(find, vis, field) {
    const left = condition(vis, field)
    return left ? find.condition(left) : find
}
/* Rows (or ids, with a null field) without them. */
function rows(list, vis, field) {
    const hidden = ids(vis)
    const of = field === undefined ? "workEffortId" : field
    return Array.from(list || []).filter(row => !hidden.has(String(of ? row[of] : row)))
}
/* Whether one task is shown to the user, by Mantle's check of that one task; not shown when the check gives no answer. */
function shown(workEffortId) {
    if (!workEffortId) return true
    ec.message.pushErrors()
    try {
        const out = ec.service
            .sync()
            .name("mantle.smithy.SmithyIssueServices.check#TaskHidden")
            .parameters({workEffortId: String(workEffortId)})
            .call()
        return !ec.message.hasError() && !!out && out.hidden === false
    } catch (error) {
        return false
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}
/* Whether the user may be told of a work effort by its id: a task the user may see (get#TaskAccess, in Projects for a
 * project's task), a project the user sees, or anything else of such a project. */
function mayName(workEffortId) {
    if (!workEffortId) return false
    const effort = ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortId", String(workEffortId)).disableAuthz().one()
    if (!effort) return false
    if (effort.workEffortTypeEnumId === "WetTask") {
        ec.message.pushErrors()
        try {
            return !!ec.service
                .sync()
                .name("ironstone.commons.TaskServices.get#TaskAccess")
                .parameters({workEffortId: effort.workEffortId, need: "check", app: effort.rootWorkEffortId ? "projects" : "commons"})
                .call()?.visible
        } catch (error) {
            return false
        } finally {
            ec.message.clearErrors()
            ec.message.popErrors()
        }
    }
    const projectId = effort.workEffortTypeEnumId === "WetProject" ? effort.workEffortId : effort.rootWorkEffortId
    if (!projectId) return true
    const info = read()
    return !!info.allProjects || Array.from(info.visibleProjectIds || []).includes(projectId)
}
;({ids, condition, without, rows, shown, mayName})
