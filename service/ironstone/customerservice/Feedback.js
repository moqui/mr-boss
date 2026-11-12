// Customer Service's feedback reads (impl-customer-service P13, CS-FEEDBACK; design-customer-service §7 SatisfactionResults,
// ResponseDetail, §9 FeedbackForms, FeedbackFormDetail, FeedbackDeliveryPolicy; FeedbackServices.xml): the survey builder's
// list in the Customer Service context (the feedback forms of one of the user's settings organizations), ServiceDefaults'
// delivery policy with its choices, SatisfactionResults (find#CaseResponses: one form and one of its effective periods at a
// time, the responses with their cases, and the counts: invited, delivered, answered, the rate, the score distribution and
// the comments), ResponseDetail (the answers with the form as of the response, the case, the episode and the follow-up), and
// Home's CSAT measure. The forms, the policy, the invitations and the follow-up are Mantle's
// mantle.request.CaseFeedbackServices (CaseFeedback.js), which checks its own permission and organization; the screens call it
// after these reads. Comments are service management's (SUPPORT_CASE_MANAGE): an agent of the follow-up team reads them only
// when the customer agreed to be contacted.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const cs = ec.resource.script("component://mr-boss/service/ironstone/customerservice/CustomerService.js")
const configuration = ec.resource.script("component://mr-boss/service/ironstone/customerservice/Configuration.js")
const feedback = ec.resource.script("component://mr-mantle/service/mantle/request/CaseFeedback.js")
const {find, one, rows, denied, ms} = lib

const FORM = "moqui.screen.form.DbForm",
    FIELD = "moqui.screen.form.DbFormField",
    INVITATION = "mantle.party.FormInvitation",
    POLICY = "mantle.request.support.FeedbackDeliveryPolicy",
    FOLLOW_UP = "mantle.request.support.FeedbackFollowUp",
    REQUEST = "mantle.request.Request",
    EPISODE = "mantle.request.support.CaseSlaEpisode"
const PURPOSE = feedback.PURPOSE
const dayMs = 86400000
const MAX_SCAN = 5000
const LIST_LIMIT = 200
const answeredStates = ["FinResponded"]
const deliveredStates = ["FinSent", "FinResponded", "FinExpired"]

const blank = value => value == null || String(value).trim() === ""
const L = words => ec.l10n.localize(words)
const nowMs = () => Number(ms(ec.user.nowTimestamp))
const dateText = value => (value == null ? "" : ec.l10n.format(new Date(Number(ms(value))), "d MMM yyyy"))
const dateTimeText = value => (value == null ? "" : ec.l10n.format(new Date(Number(ms(value))), "d MMM yyyy HH:mm"))
const percent = (part, whole) => (whole ? Math.round((100 * part) / whole) + "%" : "")
const enumText = enumId => cs.enumText(enumId)
// the organizations of the user's scope a query keeps to (null: every one)
const ownerCondition = (query, userScope, field = "organizationPartyId") =>
    userScope.ownerIds ? query.condition(field, "in", userScope.ownerIds) : query

// The case's CaseDetail link when the user may open it (the scope read once for a list), else null.
function caseLink(userScope, requestId) {
    try {
        cs.recordOf(userScope, "case", requestId)
        return cs.recordUrl("case", requestId)
    } catch (error) {
        ec.message.clearErrors()
        return null
    }
}

// ===== the forms (the survey builder's Customer Service list) =====
// A form's published periods: each date a field or option of it started, oldest first, with the date the next one started.
function periodsOf(formId) {
    const starts = new Set()
    for (const entity of [FIELD, "moqui.screen.form.DbFormFieldOption", "moqui.screen.form.DbFormFieldDependency"])
        for (const row of rows(entity, {formId}))
            for (const value of [row.fromDate, row.thruDate])
                if (value != null && Number(ms(value)) <= nowMs()) starts.add(Number(ms(value)))
    const sorted = Array.from(starts).sort((a, b) => a - b)
    return sorted.map((fromMs, index) => ({
        periodId: String(fromMs),
        fromMs,
        thruMs: sorted[index + 1] ?? null,
        label:
            L("Version") +
            " " +
            (index + 1) +
            ": " +
            dateText(fromMs) +
            (sorted[index + 1] ? " – " + dateText(sorted[index + 1]) : " " + L("to now"))
    }))
}
function formSummary(form, currentPolicy) {
    const fields = rows(FIELD, {formId: form.formId}).filter(row => row.thruDate == null || Number(ms(row.thruDate)) > nowMs())
    const drafts = fields.filter(row => row.fromDate == null).length
    const rating = feedback.ratingOf(feedback.formFields(form.formId))
    const published = !!rating
    const periods = periodsOf(form.formId)
    const answered = find(INVITATION, {formId: form.formId, statusEnumId: "FinResponded"}).count()
    return {
        formId: form.formId,
        description: form.description || form.formId,
        comments: form.comments || "",
        purposeText: L("Case feedback"),
        stateText: !published ? L("Draft") : drafts ? L("Changes to publish") : L("Published"),
        stateColor: !published ? "warning" : drafts ? "info" : "positive",
        published,
        versionText: periods.length
            ? L("Version") + " " + periods.length + " · " + L("since") + " " + dateText(periods.at(-1).fromMs)
            : "",
        scaleText: rating ? rating.low + "–" + rating.high : "",
        policyText: currentPolicy?.formId === form.formId ? L("Sent for resolved cases") : "",
        answeredText: String(answered)
    }
}
// find#FeedbackForms: the feedback forms of one of the user's settings organizations, with the forms a new one may copy.
function findFeedbackForms(p) {
    const userScope = cs.required()
    const organizationPartyId = configuration.organizationOf(userScope, p.organizationPartyId)
    const currentPolicy = feedback.policyAt(organizationPartyId)
    const forms = rows(FORM, {purposeEnumId: PURPOSE, ownerPartyId: organizationPartyId})
        .map(form => formSummary(form, currentPolicy))
        .sort((a, b) => a.description.localeCompare(b.description))
    return {
        organizationPartyId,
        organizations: configuration.organizationOptions(userScope),
        forms,
        sourceOptions: forms.filter(form => form.published).map(form => ({value: form.formId, label: form.description}))
    }
}

// ===== ServiceDefaults' FeedbackDeliveryPolicy =====
const teamsOf = organizationPartyId =>
    rows("mantle.party.Party", {ownerPartyId: organizationPartyId})
        .filter(row => one("mantle.party.PartyRole", {partyId: row.partyId, roleTypeId: "OrgTeam"}))
        .map(row => ({value: row.partyId, label: cs.partyName(row.partyId)}))
        .sort((a, b) => a.label.localeCompare(b.label))
function policyView(row) {
    if (!row) return null
    const names = (ids, name) =>
        String(ids || "")
            .split(",")
            .filter(Boolean)
            .map(name)
            .join(", ")
    return {
        feedbackPolicyId: row.feedbackPolicyId,
        formId: row.formId,
        formText: one(FORM, {formId: row.formId})?.description || row.formId,
        requestTypeEnumIds: row.requestTypeEnumIds || "",
        requestCategoryIds: row.requestCategoryIds || "",
        typesText: names(row.requestTypeEnumIds, enumText) || L("Every type"),
        queuesText: names(row.requestCategoryIds, cs.queueName) || L("Every queue"),
        delayMinutes: row.delayMinutes,
        frequencyEnumId: row.frequencyEnumId,
        frequencyText: enumText(row.frequencyEnumId),
        channelText: enumText(row.channelEnumId),
        tokenDays: row.tokenDays,
        reminderCount: row.reminderCount,
        reminderDays: row.reminderDays,
        lowScoreThreshold: row.lowScoreThreshold,
        followUpTeamPartyId: row.followUpTeamPartyId || "",
        followUpTeamText: row.followUpTeamPartyId ? cs.partyName(row.followUpTeamPartyId) : L("The case's queue team"),
        followUpDays: row.followUpDays,
        fromText: row.fromDate ? dateTimeText(row.fromDate) : L("Draft"),
        thruText: row.thruDate ? dateTimeText(row.thruDate) : "",
        changeReason: row.changeReason || ""
    }
}
// get#FeedbackPolicy: the organization's delivery policy now and its earlier rows, with the forms, types, queues and teams
// to choose from.
function getFeedbackPolicy(p) {
    const userScope = cs.required()
    const organizationPartyId = configuration.organizationOf(userScope, p.organizationPartyId)
    const current = feedback.policyAt(organizationPartyId)
    const history = Array.from(find(POLICY, {organizationPartyId}).orderBy("-fromDate").limit(6).list()).filter(
        row => row.feedbackPolicyId !== current?.feedbackPolicyId
    )
    const forms = rows(FORM, {purposeEnumId: PURPOSE, ownerPartyId: organizationPartyId}).filter(form =>
        feedback.ratingOf(feedback.formFields(form.formId))
    )
    const categories = new Map(
        rows("mantle.request.RequestCategory", {ownerPartyId: organizationPartyId}).map(row => [row.requestCategoryId, row])
    )
    return {
        organizationPartyId,
        organizations: configuration.organizationOptions(userScope),
        policy: policyView(current),
        history: history.map(policyView),
        formOptions: forms.map(form => ({value: form.formId, label: form.description || form.formId})),
        typeOptions: rows("mantle.request.support.ServiceRequestType", {organizationPartyId})
            .map(row => row.requestTypeEnumId)
            .filter((value, index, all) => all.indexOf(value) === index)
            .map(value => ({value, label: enumText(value)})),
        queueOptions: cs
            .currentQueues()
            .filter(row => categories.has(row.requestCategoryId))
            .map(row => ({
                value: row.requestCategoryId,
                label: categories.get(row.requestCategoryId).description || row.requestCategoryId
            })),
        teamOptions: teamsOf(organizationPartyId)
    }
}

// ===== SatisfactionResults =====
function requireManager(userScope) {
    if (!userScope.capabilities.caseManage) denied("PERMISSION_DENIED", "SUPPORT_CASE_MANAGE is required")
}
// The forms the user's organizations ask with (newest policy first), for the find's form choice.
function formChoices(userScope) {
    let query = find(FORM, {purposeEnumId: PURPOSE})
    query = ownerCondition(query, userScope, "ownerPartyId")
    return Array.from(query.list())
        .map(form => ({value: form.formId, label: (form.description || form.formId) + " · " + cs.partyName(form.ownerPartyId)}))
        .sort((a, b) => a.label.localeCompare(b.label))
}
const textFieldsOf = (formId, asOf) =>
    feedback
        .formFields(formId, asOf)
        .filter(field => ["DBFFT_text-area", "DBFFT_text-line"].includes(field.fieldTypeEnumId))
        .map(field => field.fieldName)
// find#CaseResponses: the invitations of one feedback form of the user's organizations in one of its effective periods (the
// current one by default), so a changed scale or question is never compared with the earlier one, filtered by queue, team,
// customer, score and state; at most 200 listed, the counts over at most 5000.
function findCaseResponses(p) {
    const userScope = cs.required()
    requireManager(userScope)
    const forms = formChoices(userScope)
    const formId = forms.some(form => form.value === p.formId)
        ? p.formId
        : forms.find(form => {
              const row = one(FORM, {formId: form.value})
              return feedback.policyAt(row.ownerPartyId)?.formId === row.formId
          })?.value ||
          forms[0]?.value ||
          null
    const periods = formId ? periodsOf(formId) : []
    const period = periods.find(row => row.periodId === p.periodId) || periods.at(-1) || null
    const empty = {
        formId,
        formOptions: forms,
        periodId: period?.periodId || null,
        periodOptions: periods.map(row => ({value: row.periodId, label: row.label})).reverse(),
        rows: [],
        stats: null,
        scale: null
    }
    if (!formId || !period) return empty
    const rating = feedback.ratingOf(feedback.formFields(formId, period.fromMs + 1000))
    let query = find(INVITATION, {formId}).condition("createdDate", "greater-equals", new Date(period.fromMs))
    if (period.thruMs) query = query.condition("createdDate", "less", new Date(period.thruMs))
    query = ownerCondition(query, userScope)
    if (!blank(p.customerPartyId)) query = query.condition("partyId", p.customerPartyId)
    if (!blank(p.statusEnumId)) query = query.condition("statusEnumId", p.statusEnumId)
    if (!blank(p.score)) query = query.condition("score", Number(p.score))
    const scanned = Array.from(query.orderBy("-createdDate").limit(MAX_SCAN).list())
    // the queue and team are the case's: read once per case
    const requests = new Map()
    const requestOf = requestId => {
        if (!requests.has(requestId)) requests.set(requestId, one(REQUEST, {requestId}))
        return requests.get(requestId)
    }
    const teamQueues = blank(p.teamPartyId)
        ? null
        : cs
              .currentQueues()
              .filter(row => row.responsibleTeamPartyId === p.teamPartyId)
              .map(row => row.requestCategoryId)
    const kept = scanned.filter(row => {
        const request = requestOf(row.recordId)
        if (!blank(p.requestCategoryId) && request?.requestCategoryId !== p.requestCategoryId) return false
        if (teamQueues && !teamQueues.includes(request?.requestCategoryId)) return false
        return true
    })
    const answered = kept.filter(row => answeredStates.includes(row.statusEnumId))
    const delivered = kept.filter(row => deliveredStates.includes(row.statusEnumId))
    const distribution = []
    if (rating)
        for (let score = rating.high; score >= rating.low; score--) {
            const count = answered.filter(row => Number(row.score) === score).length
            distribution.push({score: String(score), count, shareText: percent(count, answered.length)})
        }
    const textNames = textFieldsOf(formId, period.fromMs + 1000)
    const comments = new Map()
    for (const row of answered.slice(0, MAX_SCAN)) {
        const texts = rows("moqui.screen.form.FormResponseAnswer", {formResponseId: row.formResponseId})
            .filter(answer => textNames.includes(answer.fieldName) && !blank(answer.valueText))
            .map(answer => String(answer.valueText))
        if (texts.length) comments.set(row.invitationId, texts.join(" · "))
    }
    const scores = answered.map(row => Number(row.score)).filter(score => Number.isFinite(score))
    const followUps = new Map(
        kept.length
            ? Array.from(
                  find(FOLLOW_UP)
                      .condition(
                          "invitationId",
                          "in",
                          kept.slice(0, LIST_LIMIT).map(row => row.invitationId)
                      )
                      .list()
              ).map(row => [row.invitationId, row])
            : []
    )
    const listed = kept.slice(0, LIST_LIMIT).map(row => {
        const request = requestOf(row.recordId)
        const caseUrl = caseLink(userScope, row.recordId)
        const followUp = followUps.get(row.invitationId)
        return {
            invitationId: row.invitationId,
            formResponseId: row.formResponseId || "",
            requestId: row.recordId,
            caseText: caseUrl ? (request?.requestName || row.recordId) + " (" + row.recordId + ")" : L("A case you cannot open"),
            caseUrl: caseUrl || "",
            customerText: cs.partyName(row.partyId),
            episodeText: episodeText(row),
            stateText: enumText(row.statusEnumId),
            sentText: dateText(row.sentDate),
            respondedText: dateText(row.responseDate),
            scoreText: row.score == null ? "" : row.score + (rating ? " / " + rating.high : ""),
            commentText: comments.get(row.invitationId) || "",
            followUpText: followUp ? enumText(followUp.statusEnumId) : row.score != null ? L("None") : ""
        }
    })
    return Object.assign(empty, {
        rows: listed,
        scale: rating ? {low: rating.low, high: rating.high, title: rating.title} : null,
        stats: {
            invited: kept.length,
            delivered: delivered.length,
            answered: answered.length,
            responseRateText: percent(answered.length, delivered.length),
            averageText: scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : "",
            satisfiedText: rating ? percent(scores.filter(score => score >= rating.high - 1).length, scores.length) : "",
            commentCount: comments.size,
            scaleText: rating ? rating.low + "–" + rating.high + " (" + L("raw scale, not normalized") + ")" : "",
            truncated: scanned.length >= MAX_SCAN,
            listedText: kept.length > LIST_LIMIT ? L("The first") + " " + LIST_LIMIT + " " + L("of") + " " + kept.length : "",
            distribution
        }
    })
}
function episodeText(invitation) {
    if (invitation.contextEntityName !== EPISODE) return L("The case")
    const episode = one(EPISODE, {caseSlaEpisodeId: invitation.contextId})
    return episode
        ? L("Resolution") + " " + (episode.sequenceNum || 1) + " · " + enumText(episode.stateEnumId)
        : invitation.contextId
}

// ===== ResponseDetail =====
// get#CaseResponse: one invited response of the user's organizations: the form as of its date with each answer (a choice
// as its label), the score, the case (a link when the user may open it), the episode, the invitation's dates and the
// follow-up. A service manager reads it all; an agent of the follow-up team reads it without its text answers unless the
// customer agreed to be contacted.
function getCaseResponse(p) {
    const userScope = cs.required()
    const invitation = blank(p.formResponseId) ? null : one(INVITATION, {formResponseId: p.formResponseId})
    const unavailable = () => denied("RECORD_UNAVAILABLE", "Response " + (p.formResponseId || "") + " is not available")
    if (!invitation || !cs.owns(userScope, invitation.organizationPartyId)) unavailable()
    // a case feedback response alone: another app's assigned answer (People's scorecard, exit interview) of an organization the
    // user serves is read only through its own app's service (impl-people P16 review)
    if (one(FORM, {formId: invitation.formId})?.purposeEnumId !== PURPOSE) unavailable()
    const followUp = Array.from(find(FOLLOW_UP, {invitationId: invitation.invitationId}).list())[0] || null
    const manager = !!userScope.capabilities.caseManage
    const teamMember = !!followUp?.teamPartyId && !!userScope.partyId && (userScope.teamIds || []).includes(followUp.teamPartyId)
    if (!manager && !teamMember) unavailable()
    const response = lib.call("org.moqui.impl.ScreenServices.get#FormResponse", {formResponseId: p.formResponseId})
    const asOf = response.responseDate
    const fields = feedback.formFields(invitation.formId, asOf)
    const answers = response.responseMap || {}
    const consent = fields.some(
        field =>
            field.fieldTypeEnumId === "DBFFT_check" &&
            String(answers[field.fieldName] || "")
                .split(",")
                .includes("Y")
    )
    const showText = manager || consent
    const answerRows = fields.map(field => {
        const raw = answers[field.fieldName]
        const parts = String(raw ?? "")
            .split(",")
            .filter(part => part !== "")
        const isText = ["DBFFT_text-area", "DBFFT_text-line"].includes(field.fieldTypeEnumId)
        const valueText = !parts.length
            ? ""
            : isText
              ? showText
                  ? String(raw)
                  : L("Withheld: for service management")
              : parts.map(part => field.options.find(option => option.key === part)?.text || part).join(", ")
        return {fieldName: field.fieldName, title: field.title, valueText}
    })
    const request = one(REQUEST, {requestId: invitation.recordId})
    const caseUrl = caseLink(userScope, invitation.recordId)
    const rating = feedback.ratingOf(fields)
    const teamOptions = followUp?.teamPartyId
        ? lib
              .rows("mantle.party.PartyRelationship", {toPartyId: followUp.teamPartyId, relationshipTypeEnumId: "PrtServiceTeam"})
              .filter(row => lib.active(row))
              .map(row => ({value: row.fromPartyId, label: cs.partyName(row.fromPartyId)}))
        : []
    return {
        response: {
            formResponseId: p.formResponseId,
            formId: invitation.formId,
            formText: one(FORM, {formId: invitation.formId})?.description || invitation.formId,
            versionText: L("As of") + " " + dateTimeText(asOf),
            requestId: invitation.recordId,
            caseText: caseUrl
                ? (request?.requestName || invitation.recordId) + " (" + invitation.recordId + ")"
                : L("A case you cannot open"),
            caseUrl: caseUrl || "",
            customerText: cs.partyName(invitation.partyId),
            respondentText: cs.partyName(invitation.contactPartyId || invitation.partyId),
            episodeText: episodeText(invitation),
            invitedText: dateTimeText(invitation.createdDate),
            sentText: dateTimeText(invitation.sentDate),
            respondedText: dateTimeText(invitation.responseDate),
            scoreText: invitation.score == null ? "" : invitation.score + (rating ? " " + L("of") + " " + rating.high : ""),
            consentText: consent ? L("Agreed to be contacted") : L("Not asked to be contacted"),
            textsShown: showText,
            answers: answerRows
        },
        followUp: followUp
            ? {
                  followUpId: followUp.followUpId,
                  statusEnumId: followUp.statusEnumId,
                  stateText: enumText(followUp.statusEnumId),
                  teamText: followUp.teamPartyId ? cs.partyName(followUp.teamPartyId) : "",
                  assigneePartyId: followUp.assigneePartyId || "",
                  assigneeText: followUp.assigneePartyId ? cs.partyName(followUp.assigneePartyId) : L("Unassigned"),
                  dueText: dateText(followUp.dueDate),
                  actionEnumId: followUp.actionEnumId || "",
                  actionText: followUp.actionEnumId ? enumText(followUp.actionEnumId) : "",
                  note: followUp.note || "",
                  canRecord: manager || teamMember,
                  canAssign: manager,
                  teamOptions
              }
            : null
    }
}

// ===== Home's CSAT =====
// The share of answered invitations of the user's organizations in the period whose score is in the top two of the form's
// scale, with the count and the change against the previous period; not configured until one of them has a feedback policy.
function csatMeasure(p) {
    const userScope = cs.required()
    const days = Math.max(1, Math.min(366, Number(p.periodDays) || 30))
    let policies = find(POLICY).condition("fromDate", "is-not-null", null)
    policies = ownerCondition(policies, userScope)
    if (!policies.count()) return {configured: false}
    const highOf = new Map()
    const satisfied = row => {
        if (!highOf.has(row.formId))
            highOf.set(row.formId, feedback.ratingOf(feedback.formFields(row.formId, row.responseDate))?.high ?? null)
        const high = highOf.get(row.formId)
        return high != null && Number(row.score) >= high - 1
    }
    const window = (fromMs, thruMs) => {
        let query = find(INVITATION, {statusEnumId: "FinResponded"})
            .condition("responseDate", "greater-equals", new Date(fromMs))
            .condition("responseDate", "less", new Date(thruMs))
            .condition("score", "is-not-null", null)
        query = ownerCondition(query, userScope)
        const answered = Array.from(query.limit(MAX_SCAN).list())
        return {count: answered.length, satisfied: answered.filter(satisfied).length}
    }
    const now = nowMs()
    const current = window(now - days * dayMs, now + 1000)
    const previous = window(now - 2 * days * dayMs, now - days * dayMs)
    const share = window => (window.count ? Math.round((100 * window.satisfied) / window.count) : null)
    const change =
        share(current) != null && share(previous) != null
            ? (share(current) - share(previous) >= 0 ? "+" : "") + (share(current) - share(previous)) + " " + L("points")
            : null
    return {
        configured: true,
        csat: {
            configured: true,
            valueText: current.count ? share(current) + "%" : L("No answers yet"),
            denominatorText: current.count + " " + L("answers"),
            changeText: change
        }
    }
}

const operations = {findFeedbackForms, getFeedbackPolicy, findCaseResponses, getCaseResponse, csatMeasure}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Customer Service feedback operation " + op)
        const wasDisabled = ec.artifactExecution.disableAuthz()
        try {
            return operations[op](parameters || {})
        } finally {
            if (!wasDisabled) ec.artifactExecution.enableAuthz()
        }
    }
})
