// Customer Service saved replies (impl-customer-service P5, CS-REPLIES, D24, F3; design-customer-service §9 SavedReplies
// ReplyList, ReplyEdit, §3 CaseDetail CaseReplyAction, Cases BulkCaseAction; ReplyServices.xml). A saved reply is a Comms
// text block (moqui.basic.email.EmailTextBlock): personal (its owner's only), a team's (shared with the team's user group
// SVT_<team>, which Mantle keeps in step with the members) or global (shared with the root user group BOSS_CUSTOMER_SERVICE);
// Mantle's SavedReply and SavedReplyAction rows hold its organization, language, subject and case actions. find lists the
// service replies the user may use (Comms' own rule: theirs and those shared with a group they are in), save stores the
// text through Comms' org.moqui.comms.MailSettingsServices.store#TextBlock (which checks the owner and the group) and then the
// service facts and actions (the block's owner only), and the bulk preview runs Mantle's preview#SavedReply on each selected
// case, a case that fails named and the rest shown. Preview and apply on a case are Mantle's (SupportCaseServices).
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const cs = ec.resource.script("component://mr-boss/service/ironstone/customerservice/CustomerService.js")
const {find, one, rows, call, denied} = lib

const BLOCK = "moqui.basic.email.EmailTextBlock",
    REPLY = "mantle.request.support.SavedReply",
    ACTION = "mantle.request.support.SavedReplyAction"
const globalGroupId = "BOSS_CUSTOMER_SERVICE"
const teamGroupPrefix = "SVT_"
const blank = value => value == null || String(value).trim() === ""
const text = value => (blank(value) ? null : String(value).trim())
const L = value => ec.l10n.localize(value)
const listOf = value =>
    value == null
        ? []
        : (typeof value === "string" ? value.split(",") : Array.from(value))
              .map(String)
              .map(s => s.trim())
              .filter(Boolean)
const textOf = html =>
    String(html || "")
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
        .trim()
const replies = () => ec.resource.script("component://mr-mantle/service/mantle/request/SavedReplies.js")

// The groups the user is in now.
const myGroupIds = () =>
    Array.from(
        find("moqui.security.UserGroupMember", {userId: ec.user.userId})
            .conditionDate("fromDate", "thruDate", ec.user.nowTimestamp)
            .list()
    ).map(row => row.userGroupId)
const isServiceGroup = userGroupId => userGroupId === globalGroupId || String(userGroupId || "").startsWith(teamGroupPrefix)
function scopeOf(block) {
    if (!block.userGroupId) return {scope: "personal", scopeText: L("Personal")}
    if (block.userGroupId === globalGroupId) return {scope: "global", scopeText: L("Every service agent")}
    if (String(block.userGroupId).startsWith(teamGroupPrefix)) {
        const teamPartyId = String(block.userGroupId).substring(teamGroupPrefix.length)
        return {scope: "team", scopeText: cs.partyName(teamPartyId), teamPartyId}
    }
    return {
        scope: "other",
        scopeText: one("moqui.security.UserGroup", {userGroupId: block.userGroupId})?.description || block.userGroupId
    }
}
// The groups the user may share a reply with: their teams' groups (they are in them) and the root group when they are in it.
function shareOptions() {
    const groupIds = myGroupIds()
    const options = [{value: "", label: L("Just me")}]
    for (const userGroupId of groupIds.filter(id => String(id).startsWith(teamGroupPrefix)).sort())
        options.push({value: userGroupId, label: cs.partyName(userGroupId.substring(teamGroupPrefix.length))})
    if (groupIds.includes(globalGroupId)) options.push({value: globalGroupId, label: L("Every service agent")})
    return options
}

// ===== find#SavedReplies =====
// The service replies the user may use (design ReplyList): their own blocks with service facts, and the blocks shared with a
// service group they are in, of their organizations; with text, those whose title, shortcut or body has it (ignoring case,
// in the query); each with its scope, language, subject, actions as text, whether it is offered, and whether the user owns it.
function findReplies(p) {
    const userScope = cs.required()
    const factory = ec.entity.conditionFactory
    const groupIds = myGroupIds().filter(isServiceGroup)
    const reach = [factory.makeCondition("ownerUserId", "equals", ec.user.userId)]
    if (groupIds.length) reach.push(factory.makeCondition("userGroupId", "in", groupIds))
    let query = find(BLOCK).condition(factory.makeCondition(reach, "or")).orderBy("title").limit(200)
    const term = text(p.text)
    if (term)
        query = query.condition(
            factory.makeCondition(
                ["title", "shortcut", "bodyHtml"].map(field =>
                    factory.makeCondition(field, "like", cs.likeText(term)).ignoreCase()
                ),
                "or"
            )
        )
    const organizationIds = cs.vendorIds(userScope)
    const list = []
    for (const block of Array.from(query.list())) {
        const facts = one(REPLY, {emailTextBlockId: block.emailTextBlockId})
        // a personal block is a saved reply once it has its service facts; a shared one by its group
        if (!facts && !isServiceGroup(block.userGroupId)) continue
        if (facts?.organizationPartyId && !organizationIds.includes(facts.organizationPartyId)) continue
        if (p.organizationPartyId && facts?.organizationPartyId && facts.organizationPartyId !== p.organizationPartyId) continue
        if (p.forCase && facts?.disabled === "Y") continue
        const actions = rows(ACTION, {emailTextBlockId: block.emailTextBlockId}).sort(
            (a, b) => (a.sequenceNum ?? 0) - (b.sequenceNum ?? 0)
        )
        list.push(
            Object.assign(
                {
                    emailTextBlockId: block.emailTextBlockId,
                    title: block.title || block.emailTextBlockId,
                    shortcut: block.shortcut || "",
                    shortcutText: block.shortcut ? "/" + block.shortcut : "",
                    bodyHtml: block.bodyHtml || "",
                    bodyText: textOf(block.bodyHtml).substring(0, 160),
                    userGroupId: block.userGroupId || "",
                    organizationPartyId: facts?.organizationPartyId || "",
                    organizationName: facts?.organizationPartyId
                        ? cs.partyName(facts.organizationPartyId)
                        : L("Every organization"),
                    localeId: facts?.localeId || "",
                    subject: facts?.subject || "",
                    disabled: facts?.disabled === "Y" ? "Y" : "N",
                    activeText: facts?.disabled === "Y" ? L("Not offered") : L("Offered"),
                    variables: replies().usedIn((block.bodyHtml || "") + " " + (facts?.subject || "")),
                    actions: actions.map(action =>
                        Object.assign(lib.map(action), {
                            text: replies().actionText(action),
                            emailTextBlockId: block.emailTextBlockId
                        })
                    ),
                    actionsText: actions.length ? actions.map(action => replies().actionText(action)).join("; ") : L("No action"),
                    isOwner: block.ownerUserId === ec.user.userId,
                    ownerName: block.ownerUserId
                        ? one("moqui.security.UserAccount", {userId: block.ownerUserId})?.userFullName || block.ownerUserId
                        : ""
                },
                scopeOf(block)
            )
        )
    }
    return {
        replies: list,
        shareOptions: shareOptions(),
        variableNames: replies().variableNames,
        organizationOptions: organizationIds.map(partyId => ({value: partyId, label: cs.partyName(partyId)}))
    }
}

// ===== save#SavedReplyAction =====
// The checks of an action row: a known operation and the field it sets.
const actionKinds = ["SraSetStatus", "SraAddTag", "SraAssign", "SraAssignSelf", "SraSetPriority", "SraAddNote"]
function checkAction(action, organizationPartyId) {
    const actionEnumId = text(action.actionEnumId)
    if (!actionKinds.includes(actionEnumId)) denied("ACTION_UNKNOWN", (actionEnumId || "") + " is not a saved reply action")
    const fields = {
        actionEnumId,
        statusId: null,
        resolutionEnumId: null,
        tagEnumId: null,
        assigneePartyId: null,
        priority: null,
        noteText: text(action.noteText)
    }
    if (actionEnumId === "SraSetStatus") {
        if (one("moqui.basic.StatusItem", {statusId: action.statusId})?.statusTypeId !== "Request")
            denied("STATUS_UNKNOWN", (action.statusId || "") + " is not a case status")
        fields.statusId = action.statusId
        fields.resolutionEnumId = text(action.resolutionEnumId)
    } else if (actionEnumId === "SraAddTag") {
        if (one("moqui.basic.Enumeration", {enumId: action.tagEnumId})?.enumTypeId !== "RequestTag")
            denied("TAG_UNKNOWN", (action.tagEnumId || "") + " is not a case tag")
        fields.tagEnumId = action.tagEnumId
    } else if (actionEnumId === "SraAssign") {
        const person = action.assigneePartyId ? one("mantle.party.Party", {partyId: action.assigneePartyId}) : null
        const works = person
            ? rows("mantle.party.PartyRelationship", {fromPartyId: action.assigneePartyId})
                  .filter(row => lib.active(row))
                  .some(row => !organizationPartyId || row.toPartyId === organizationPartyId || cs.isInternal(row.toPartyId))
            : false
        if (!person || person.partyTypeEnumId !== "PtyPerson" || !works)
            denied("ASSIGNEE_UNAVAILABLE", (action.assigneePartyId || "") + " is not an agent")
        fields.assigneePartyId = action.assigneePartyId
    } else if (actionEnumId === "SraSetPriority") {
        if (!/^[1-9]$/.test(String(action.priority || ""))) denied("PRIORITY_INVALID", "A priority is 1 (highest) to 9 (lowest)")
        fields.priority = Number(action.priority)
    } else if (actionEnumId === "SraAddNote" && !fields.noteText) denied("NOTE_REQUIRED", "The note needs its text")
    return fields
}
// A saved reply (design ReplyEdit): its text through Comms' store#TextBlock (a new one is the user's; a change only its
// owner's; shared only with a group the user is in), then its service facts (organization, one of the user's; language;
// subject; offered) and, when given, one action added, changed or removed (actionAction add, update or remove with
// savedReplyActionId), or the whole list (actions). The owner only changes the facts and actions (REPLY_UNAVAILABLE).
function saveReply(p) {
    const userScope = cs.required()
    if (!userScope.capabilities.caseEdit) denied("PERMISSION_DENIED", "SUPPORT_CASE_EDIT is required")
    const existing = p.emailTextBlockId ? one(BLOCK, {emailTextBlockId: p.emailTextBlockId}) : null
    if (p.emailTextBlockId && (!existing || existing.ownerUserId !== ec.user.userId))
        denied("REPLY_UNAVAILABLE", "Saved reply " + p.emailTextBlockId + " is not yours to change")
    const organizationPartyId = text(p.organizationPartyId)
    if (organizationPartyId && !cs.vendorIds(userScope).includes(organizationPartyId))
        denied("RECORD_UNAVAILABLE", "Organization " + organizationPartyId + " is not available")
    if (p.userGroupId && !shareOptions().some(option => option.value === p.userGroupId))
        denied("GROUP_UNAVAILABLE", "You may not share a reply with " + p.userGroupId)
    let emailTextBlockId = existing?.emailTextBlockId || null
    const textGiven = p.title != null || p.bodyHtml != null || !existing
    if (textGiven) {
        const out = call("org.moqui.comms.MailSettingsServices.store#TextBlock", {
            emailTextBlockId,
            title: p.title != null ? p.title : existing?.title,
            shortcut: p.shortcut != null ? p.shortcut : existing?.shortcut,
            bodyHtml: p.bodyHtml != null ? p.bodyHtml : existing?.bodyHtml,
            userGroupId: p.userGroupId != null ? p.userGroupId : existing?.userGroupId
        })
        emailTextBlockId = emailTextBlockId || out.emailTextBlockId
    }
    if (!emailTextBlockId) denied("REPLY_UNAVAILABLE", "The reply was not saved")
    const facts = one(REPLY, {emailTextBlockId})
    const values = {
        organizationPartyId: p.organizationPartyId != null ? organizationPartyId : facts?.organizationPartyId || null,
        localeId: p.localeId != null ? text(p.localeId) : facts?.localeId || null,
        subject: p.subject != null ? text(p.subject) : facts?.subject || null,
        disabled: p.disabled != null ? (p.disabled === "Y" || p.disabled === true ? "Y" : "N") : facts?.disabled || "N"
    }
    const block = one(BLOCK, {emailTextBlockId})
    values.variableNames =
        replies()
            .usedIn((block?.bodyHtml || "") + " " + (values.subject || ""))
            .join(",") || null
    if (facts) call("update#" + REPLY, Object.assign({emailTextBlockId}, values))
    else call("create#" + REPLY, Object.assign({emailTextBlockId}, values))
    const current = rows(ACTION, {emailTextBlockId}).sort((a, b) => (a.sequenceNum ?? 0) - (b.sequenceNum ?? 0))
    if (p.actions != null) {
        for (const row of current) row.delete()
        Array.from(p.actions).forEach((action, index) =>
            call(
                "create#" + ACTION,
                Object.assign({emailTextBlockId, sequenceNum: index + 1}, checkAction(action, values.organizationPartyId))
            )
        )
    } else if (text(p.actionAction)) {
        const row = p.savedReplyActionId ? current.find(action => action.savedReplyActionId === p.savedReplyActionId) : null
        if (p.actionAction === "remove") {
            if (!row) denied("ACTION_UNKNOWN", "The reply has no action " + (p.savedReplyActionId || ""))
            row.delete()
        } else if (p.actionAction === "update") {
            if (!row) denied("ACTION_UNKNOWN", "The reply has no action " + (p.savedReplyActionId || ""))
            call(
                "update#" + ACTION,
                Object.assign({savedReplyActionId: row.savedReplyActionId}, checkAction(p, values.organizationPartyId), {
                    sequenceNum: blank(p.sequenceNum) ? row.sequenceNum : Number(p.sequenceNum)
                })
            )
        } else if (p.actionAction === "add")
            call(
                "create#" + ACTION,
                Object.assign(
                    {emailTextBlockId, sequenceNum: blank(p.sequenceNum) ? current.length + 1 : Number(p.sequenceNum)},
                    checkAction(p, values.organizationPartyId)
                )
            )
        else denied("ACTION_UNKNOWN", p.actionAction + " is not add, update or remove")
    }
    return {emailTextBlockId}
}

// ===== preview#BulkReply =====
// A saved reply on each selected case (design BulkCaseAction's reply): each case checked and previewed on its own (Mantle's
// preview#SavedReply), with its recipient (its own, never another case's), its subject, variable errors and actions; a case
// not available to the user or one that fails is named and the rest go on. At most 50 cases.
function previewBulk(p) {
    const userScope = cs.required()
    const ids = Array.from(new Set(listOf(p.requestIds))).slice(0, 50)
    if (!ids.length) denied("SELECTION_REQUIRED", "Select the cases first")
    const cases = []
    for (const requestId of ids) {
        try {
            cs.recordOf(userScope, "case", requestId)
        } catch (error) {
            cases.push({requestId, canApply: false, outcome: "Forbidden", message: L("Not available to you"), recipientsText: ""})
            continue
        }
        // a case the batch's key already applied: its reply's own state, kept by its message ID
        const done = p.operationKey ? one(lib.operationEntity, {operationKey: p.operationKey + "-" + requestId}) : null
        if (done) {
            const first = lib.json(done.resultJson, {})
            const delivery = replies().deliveryOf(first.emailMessageId)
            const request = one("mantle.request.Request", {requestId})
            cases.push({
                requestId,
                requestName: request?.requestName || "",
                recipientsText: (first.recipients || []).map(row => row.name + " <" + row.address + ">").join(", "),
                actionsText: (first.actionsApplied || []).join("; ") || L("No action"),
                canApply: false,
                applied: true,
                emailMessageId: first.emailMessageId || null,
                deliveryStatus: delivery.deliveryStatus,
                outcome:
                    delivery.deliveryStatus === "sent"
                        ? "Sent"
                        : delivery.deliveryStatus === "failed"
                          ? "ReplyDeliveryFailed"
                          : "ReplyDeliveryPending",
                message: delivery.sendError || ""
            })
            continue
        }
        ec.message.pushErrors()
        try {
            const out = ec.service
                .sync()
                .name("mantle.request.SupportCaseServices.preview#SavedReply")
                .parameters({requestId, emailTextBlockId: p.emailTextBlockId})
                .call()
            if (ec.message.hasError()) throw new Error(ec.message.getErrorsString())
            const preview = out.preview
            const request = one("mantle.request.Request", {requestId})
            const problems = preview.errors
                .map(error => error.message)
                .concat(preview.actions.filter(action => !action.allowed).map(action => action.text + ": " + action.message))
            cases.push({
                requestId,
                requestName: request?.requestName || "",
                caseRevision: preview.caseRevision,
                recipientsText:
                    preview.recipients.map(row => row.name + " <" + row.address + ">").join(", ") || L("No recipient"),
                subject: preview.subject,
                bodyText: preview.bodyText.substring(0, 200),
                actionsText: preview.actions.map(action => action.text).join("; ") || L("No action"),
                canApply: preview.canApply,
                outcome: preview.canApply ? "Ready" : "Refused",
                message: problems.join("; ")
            })
        } catch (error) {
            cases.push({
                requestId,
                canApply: false,
                outcome: lib.reasonCode(error) === "REPLY_UNAVAILABLE" ? "Forbidden" : "Refused",
                message: String(error.message || error).split("\n")[0],
                recipientsText: ""
            })
        } finally {
            ec.message.clearErrors()
            ec.message.popErrors()
        }
    }
    const block = one(BLOCK, {emailTextBlockId: p.emailTextBlockId})
    return {
        title: block?.title || "",
        cases,
        readyCount: cases.filter(row => row.canApply).length,
        failedCount: cases.filter(row => row.outcome === "ReplyDeliveryFailed").length,
        revisions: Object.fromEntries(cases.filter(row => row.canApply).map(row => [row.requestId, row.caseRevision]))
    }
}

const operations = {findReplies, saveReply, previewBulk}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Customer Service saved reply operation " + op)
        return operations[op](parameters || {})
    }
})
