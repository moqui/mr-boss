// Capabilities and the access review in Admin, ironstone.admin.CapabilityServices (impl-admin P9; design-admin §5 Capabilities,
// §16 the access and grant review). The framework's org.moqui.admin.AccessServices holds the registry, the projections and
// every rule (get#Capabilities, get#GrantReview, preview#Grants, apply#Grants: ADMIN_ACCESS_VIEW and ADMIN_ACCESS_MANAGE,
// registered bundles only, sealed permissions and privileged groups, revisions, the administration path). This module is the
// screens' context over them:
// - matrixContext: the matrix rows and their list twin with each cell's text and its next proposal, the proposal read from the
//   screen's changes parameter, and the effect of the proposal on each group it names (preview#Grants per group);
// - applyMatrixChanges: the proposal applied group by group, each group's change as one at its previewed revision, in its own
//   transaction, so a refused or failed group is named and the others still apply;
// - accessReview: the review's one list for print and CSV, with a group's members shown only when they work for an organization
//   the user administers (the others counted, never named, as GroupDetail).
// A proposal is a list of tokens group~a|e~p:permission or group~a|e~a:artifactGroup (add or end): what the screen carries
// between requests; nothing is stored until it is applied.
const admin = ec.resource.script("component://mr-boss/service/ironstone/admin/Admin.js")
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const {denied} = lib
const access = "org.moqui.admin.AccessServices."
const tokenPattern = /^([A-Za-z0-9_.-]+)~([ae])~([pa]):([A-Za-z0-9_.-]+)$/
const maxProposed = 40
// the framework's bounds (get#Capabilities, get#GrantReview), answered here as a reason the screen shows
const maxGroups = 8
const maxReviewGroups = 60

const text = value => String(value ?? "").trim()
// a date as text in the user's zone; a grant or membership from the epoch (seed data's "always") shows no start
const dateText = (value, pattern = "yyyy-MM-dd") =>
    value == null || Number(value) <= 0 ? "" : ec.l10n.format(Number(value), pattern)
const call = (name, parameters) => ec.service.sync().name(name).parameters(parameters).call() || {}
// A comma separated or repeated parameter as its distinct values.
const listOf = value =>
    Array.from(new Set((typeof value === "string" ? value.split(",") : Array.from(value || [])).map(text).filter(Boolean)))
function requireAccess(capability) {
    const userScope = admin.required()
    if (!userScope.capabilities[capability])
        denied(
            "PERMISSION_DENIED",
            (capability === "accessManage" ? "ADMIN_ACCESS_MANAGE" : "ADMIN_ACCESS_VIEW") + " is required"
        )
    return userScope
}

// ===== the proposal =====
const proposalTokens = value => listOf(value).filter(token => tokenPattern.test(token))
const tooManyText = "Apply or clear the proposed changes before adding more than " + maxProposed
function parseChanges(value) {
    const tokens = proposalTokens(value)
    if (tokens.length > maxProposed) denied("TOO_MANY_CHANGES", tooManyText)
    return tokens.map(token => {
        const [, userGroupId, action, type, id] = token.match(tokenPattern)
        return {
            token,
            userGroupId,
            action: action === "e" ? "end" : "add",
            capabilityKey: type + ":" + id,
            userPermissionId: type === "p" ? id : null,
            artifactGroupId: type === "a" ? id : null
        }
    })
}
// The proposal by group, each with the grant list preview#Grants and apply#Grants take.
function byGroup(changes) {
    const groups = new Map()
    for (const change of changes) {
        if (!groups.has(change.userGroupId)) groups.set(change.userGroupId, [])
        groups.get(change.userGroupId).push(change)
    }
    return Array.from(groups.entries()).map(([userGroupId, list]) => ({
        userGroupId,
        tokens: list.map(change => change.token),
        grantList: list.map(change => ({
            action: change.action,
            userPermissionId: change.userPermissionId,
            artifactGroupId: change.artifactGroupId
        }))
    }))
}
// A service in its own transaction and error frame: its failure is a message for this item, not a rollback of the others.
function itemCall(name, parameters) {
    ec.message.pushErrors()
    try {
        const result = ec.service.sync().name(name).parameters(parameters).requireNewTransaction(true).call() || {}
        if (ec.message.hasError()) return {failure: ec.message.getErrorsString()}
        return result
    } catch (error) {
        return {failure: String(error.message || error)}
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}

// ===== the matrix =====
function cellView(row, cell, tokens) {
    const withToken = action => tokens.concat([cell.userGroupId + "~" + action + "~" + row.capabilityKey]).join(",")
    const proposedToken = cell.proposed
        ? cell.userGroupId + "~" + (cell.proposed === "end" ? "e" : "a") + "~" + row.capabilityKey
        : null
    const stateText =
        cell.state === "granted"
            ? "Granted" + (cell.thruDate ? " until " + dateText(cell.thruDate) : "")
            : cell.state === "scheduled"
              ? "From " + dateText(cell.fromDate)
              : cell.state === "advanced"
                ? cell.advancedType + " (advanced rule)"
                : "Not granted"
    const view = Object.assign({}, cell, {
        stateText,
        scopeText:
            cell.filterSetIds.join(", ") +
            (cell.unscoped ? (cell.filterSetIds.length ? "; " : "") + "a registered row rule is missing" : ""),
        proposedText: cell.proposed === "add" ? "Grant proposed" : cell.proposed === "end" ? "End proposed" : "",
        actionText: "",
        nextChanges: ""
    })
    if (proposedToken) {
        view.actionText = "Withdraw"
        view.nextChanges = tokens.filter(token => token !== proposedToken).join(",")
    } else if (cell.canAdd) {
        view.actionText = "Grant"
        view.nextChanges = withToken("a")
    } else if (cell.canEnd) {
        view.actionText = "End"
        view.nextChanges = withToken("e")
    }
    // why there is no control, shown only where one would be expected: on something held or offered
    view.refusedText =
        !view.actionText && cell.reason && (cell.state !== "none" || cell.reasonCode !== "NOT_DELEGABLE") ? cell.reason : ""
    return view
}
// The effect of the proposal on each group it names, from preview#Grants, and whether all of it may be applied.
function previews(changes, canManage) {
    const groups = byGroup(changes).map(group => {
        const preview = itemCall(access + "preview#Grants", {userGroupId: group.userGroupId, grantList: group.grantList})
        const changeList = Array.from(preview.changeList || [])
        return Object.assign(group, {
            failure: preview.failure || null,
            allowed: !preview.failure && !!preview.allowed,
            reason: preview.failure || preview.reason || null,
            summary: preview.summary || "",
            revision: preview.revision || null,
            memberCount: preview.memberCount ?? null,
            effective: changeList.filter(change => change.allowed && !change.noChange).length,
            changeList
        })
    })
    const rows = groups.flatMap(group =>
        group.changeList.length
            ? group.changeList.map(change => ({
                  userGroupId: group.userGroupId,
                  actionText: change.action === "end" ? "End" : "Grant",
                  kindText: change.kind === "artifact" ? "Launcher" : "Permission",
                  id: change.id,
                  label: change.label && change.label !== change.id ? change.label : "",
                  allowed: !!change.allowed,
                  resultText: !change.allowed
                      ? change.reason
                      : change.noChange
                        ? "No change"
                        : change.before + " → " + change.after
              }))
            : [
                  {
                      userGroupId: group.userGroupId,
                      actionText: "",
                      kindText: "",
                      id: "",
                      label: "",
                      allowed: false,
                      resultText: group.reason || ""
                  }
              ]
    )
    return {
        groups: groups.map(group => ({
            userGroupId: group.userGroupId,
            allowed: group.allowed,
            reason: group.reason,
            summary: group.summary,
            revision: group.revision,
            memberCount: group.memberCount
        })),
        rows,
        canApply:
            canManage && groups.length > 0 && groups.every(group => group.allowed) && groups.some(group => group.effective > 0),
        revisions: JSON.stringify(
            Object.fromEntries(groups.filter(group => group.revision).map(group => [group.userGroupId, group.revision]))
        )
    }
}
// get#MatrixContext
function matrixContext(p) {
    const userScope = requireAccess("accessView")
    const groupIds = listOf(p.groups)
    // a request over a bound is answered with its reason and nothing else (a screen's read that fails shows none), the
    // proposal kept so it can be cleared
    const proposed = proposalTokens(p.changes)
    const failure =
        proposed.length > maxProposed
            ? tooManyText
            : groupIds.length > maxGroups
              ? "Compare at most " + maxGroups + " groups at a time"
              : null
    if (failure)
        return {
            failure,
            columns: [],
            matrixRows: [],
            listRows: [],
            unsupportedRows: [],
            appOptions: [],
            kindOptions: [],
            groupOptions: [],
            groups: groupIds.join(","),
            moreGroupCount: 0,
            maxGroups,
            changes: proposed.join(","),
            changeCount: proposed.length,
            proposal: null,
            canManage: false
        }
    const changes = parseChanges(p.changes)
    const tokens = changes.map(change => change.token)
    const found = call(access + "get#Capabilities", {
        appName: text(p.appName) || null,
        userGroupIdList: groupIds,
        kind: text(p.kind) || null,
        text: text(p.text) || null,
        proposedList: changes
    })
    const columns = Array.from(found.groupList || []).map(group => ({
        userGroupId: group.userGroupId,
        title: group.description || group.userGroupId,
        markerText: [
            group.privileged ? "Privileged" : "",
            group.hasSealed ? "Sealed grants" : "",
            group.kind === "custom" ? "Custom" : ""
        ]
            .filter(Boolean)
            .join(" · "),
        canManage: !!group.canManage,
        manageReason: group.manageReason || ""
    }))
    const rowView = row => ({
        appName: row.appName,
        capabilityKey: row.capabilityKey,
        kind: row.kind,
        kindLabel: row.kindLabel,
        id: row.id,
        label: row.label,
        sealed: !!row.sealed,
        capabilityText: row.label && row.label !== row.id ? row.label : row.id,
        scopeDependency: row.scopeDependency || ""
    })
    const matrixRows = Array.from(found.capabilityList || []).map(row =>
        Object.assign(rowView(row), {cells: Array.from(row.cells || []).map(cell => cellView(row, cell, tokens))})
    )
    const listRows = Array.from(found.cellList || []).map(item =>
        Object.assign(rowView(item), cellView(item, item, tokens), {groupDescription: item.groupDescription})
    )
    const groupOptions = Array.from(call(access + "find#Groups", {kind: "supported"}).groupList || []).map(group => ({
        value: group.userGroupId,
        label: (group.appName ? group.appName + ": " : "") + (group.description || group.userGroupId)
    }))
    return {
        columns,
        matrixRows,
        listRows,
        unsupportedRows: Array.from(found.unsupportedList || []).map(row =>
            Object.assign({}, row, {
                ruleText: row.ruleType === "artifact" ? "App gate" : "Permission",
                scopeText: Array.from(row.filterSetIds || []).join(", ")
            })
        ),
        appOptions: Array.from(found.appNames || []).map(name => ({value: name, label: name})),
        kindOptions: Array.from(found.kindOptions || []),
        groupOptions,
        groups: columns.map(column => column.userGroupId).join(","),
        failure: null,
        moreGroupCount: found.moreGroupCount || 0,
        maxGroups: found.maxGroups || maxGroups,
        changes: tokens.join(","),
        changeCount: tokens.length,
        proposal: tokens.length ? previews(changes, !!userScope.capabilities.accessManage) : null,
        canManage: !!found.canManage
    }
}

// apply#MatrixChanges
function applyMatrixChanges(p) {
    requireAccess("accessManage")
    const changes = parseChanges(p.changes)
    if (!changes.length) denied("NO_CHANGES", "There is no proposed change to apply")
    let revisions = {}
    try {
        revisions = JSON.parse(text(p.revisions) || "{}") || {}
    } catch (error) {
        revisions = {}
    }
    const reason = text(p.reason) || null
    const resultList = []
    let remaining = []
    for (const group of byGroup(changes)) {
        const applied = itemCall(access + "apply#Grants", {
            userGroupId: group.userGroupId,
            grantList: group.grantList,
            expectedRevision: String(revisions[group.userGroupId] || "none"),
            reason
        })
        const done = !applied.failure && applied.applied === true
        if (!done) {
            remaining = remaining.concat(group.tokens)
            ec.logger.warn(
                "Capability changes of " + group.userGroupId + " not applied: " + (applied.failure || applied.reasonCode)
            )
        }
        resultList.push({
            userGroupId: group.userGroupId,
            applied: done,
            added: applied.added || 0,
            ended: applied.ended || 0,
            reasonCode: done ? null : applied.reasonCode || "FAILED",
            reason: done ? null : applied.failure || applied.reason || "Not applied"
        })
    }
    return {
        resultList,
        appliedCount: resultList.filter(row => row.applied).length,
        refusedCount: resultList.filter(row => !row.applied).length,
        remainingChanges: remaining.join(",")
    }
}

// ===== the access and grant review =====
// get#AccessReview
function accessReview(p) {
    requireAccess("accessView")
    const groupIds = listOf(p.groups)
    if (groupIds.length > maxReviewGroups)
        return {
            failure: "Review at most " + maxReviewGroups + " groups at a time",
            reviewRows: [],
            groupRows: [],
            asOfText: "",
            groups: groupIds.join(","),
            sealedOmittedCount: 0,
            outsideCount: 0
        }
    const found = call(access + "get#GrantReview", {
        userGroupIdList: groupIds,
        appName: text(p.appName) || null,
        asOfDate: p.asOfDate || null
    })
    const members = Array.from(found.memberList || [])
    const inScope = new Set(
        members.length ? admin.execute("memberScope", {userIds: members.map(row => row.userId)}).inScopeUserIds : []
    )
    const reviewRows = []
    const groupRows = []
    for (const group of Array.from(found.groupList || [])) {
        const base = {userGroupId: group.userGroupId, groupDescription: group.groupDescription}
        for (const entry of Array.from(found.entryList || []).filter(row => row.userGroupId === group.userGroupId))
            reviewRows.push(
                Object.assign({}, base, {
                    entryText: entry.entryType === "appGate" ? "App gate" : "Permission",
                    name: entry.id,
                    detail: entry.label && entry.label !== entry.id ? entry.label : "",
                    kindLabel: entry.kindLabel || "",
                    fromText: dateText(entry.fromDate, "yyyy-MM-dd HH:mm"),
                    thruText: dateText(entry.thruDate, "yyyy-MM-dd HH:mm"),
                    scope: entry.scope || ""
                })
            )
        const groupMembers = members.filter(row => row.userGroupId === group.userGroupId)
        for (const member of groupMembers.filter(row => inScope.has(row.userId)))
            reviewRows.push(
                Object.assign({}, base, {
                    entryText: "Member",
                    name: member.userFullName || member.username,
                    detail: member.username || "",
                    kindLabel: "",
                    fromText: dateText(member.fromDate, "yyyy-MM-dd HH:mm"),
                    thruText: dateText(member.thruDate, "yyyy-MM-dd HH:mm"),
                    scope: ""
                })
            )
        const outsideCount = groupMembers.filter(row => !inScope.has(row.userId)).length
        groupRows.push(
            Object.assign({}, base, {
                appName: group.appName || "",
                privileged: !!group.privileged,
                memberCount: group.memberCount,
                outsideCount,
                sealedOmitted: group.sealedOmitted || 0,
                noteText: [
                    group.privileged ? "Privileged group" : "",
                    group.sealedOmitted ? group.sealedOmitted + " sealed grant(s) not listed" : "",
                    outsideCount ? outsideCount + " member(s) of organizations you do not administer not listed" : ""
                ]
                    .filter(Boolean)
                    .join("; ")
            })
        )
    }
    return {
        failure: null,
        reviewRows,
        groupRows,
        asOfText: dateText(found.asOfDate, "yyyy-MM-dd HH:mm"),
        groups: groupRows.map(row => row.userGroupId).join(","),
        sealedOmittedCount: found.sealedOmittedCount || 0,
        outsideCount: groupRows.reduce((sum, row) => sum + row.outsideCount, 0)
    }
}

const operations = {matrixContext, applyMatrixChanges, accessReview}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown capability operation " + op)
        return operations[op](parameters)
    }
})
