// Customer Service's knowledge reads (impl-customer-service P12, CS-KNOWLEDGE; design-customer-service §3 CaseDetail
// Knowledge, §6 Knowledge, ArticleFeedback, CaseToArticle, §9 KnowledgeSources; KnowledgeServices.xml): what the Knowledge
// mount, a case's Knowledge tab, NewCase's suggestions, ArticleFeedback, CaseToArticle and KnowledgeSources show, each
// limited by CustomerService.js's scope (the user's organizations, and the cases of their queues or assigned to them). The
// rules and the writes are Mantle's mantle.request.KnowledgeServices (suggestions, the public link, feedback, the review,
// a suggested edit, the article from a case, the sources), which check their own permission, organization and the wiki's
// access; the screens call them after these checks.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const cs = ec.resource.script("component://mr-boss/service/ironstone/customerservice/CustomerService.js")
const mantleKnowledge = ec.resource.script("component://mr-mantle/service/mantle/request/Knowledge.js")
const {find, one, rows, denied, ms} = lib

const SOURCE = "mantle.request.support.ServiceKnowledgeSource",
    FEEDBACK = "mantle.request.support.ArticleFeedback",
    PAGE = "moqui.resource.wiki.WikiPage",
    SPACE = "moqui.resource.wiki.WikiSpace"
const K = "mantle.request.KnowledgeServices."
const L = text => ec.l10n.localize(text)
const textOf = value => (value == null ? "" : ec.l10n.format(new Date(ms(value)), "d MMM yyyy HH:mm"))
const dayText = value => (value == null ? "" : ec.l10n.format(new Date(ms(value)), "d MMM yyyy"))
const blank = value => value == null || String(value).trim() === ""
const enumText = enumId => cs.enumText(enumId)
const spaceName = wikiSpaceId => (wikiSpaceId ? one(SPACE, {wikiSpaceId})?.description || wikiSpaceId : "")
const pageTitle = page => {
    const path = String(page?.pagePath || "")
    return path ? path.slice(path.lastIndexOf("/") + 1) : spaceName(page?.wikiSpaceId)
}
const knowledgeUrl = (wikiPageId, requestId) =>
    "/qapps/CustomerService/Knowledge/Knowledge?" +
    ["wikiPageId=" + encodeURIComponent(wikiPageId), requestId ? "requestId=" + encodeURIComponent(requestId) : null]
        .filter(Boolean)
        .join("&")
// a Mantle service called as the user, its refusal thrown with its code
function mantle(name, parameters) {
    const out =
        ec.service
            .sync()
            .name(K + name)
            .parameters(parameters)
            .call() || {}
    if (ec.message.hasError()) {
        const message = ec.message.getErrorsString()
        ec.message.clearErrors()
        throw new Error(message)
    }
    return out
}
// The organizations the user's knowledge is of (null: every one, for the administrator with none active).
const organizationsOf = userScope => (userScope.ownerIds ? cs.vendorIds(userScope) : null)
// A case the user sees, else null.
function visibleCase(userScope, requestId) {
    if (blank(requestId)) return null
    try {
        cs.recordOf(userScope, "case", requestId)
        return one("mantle.request.Request", {requestId})
    } catch (error) {
        return null
    }
}

// ===== get#KnowledgeContext: the Customer Service row of Commons Knowledge =====
// The spaces of the user's organizations' sources (and their draft spaces), the case worked on when one is given and seen,
// and what the user may do from it: link and send (SUPPORT_CASE_EDIT), suggest an edit, author (SUPPORT_KNOWLEDGE_EDIT).
function knowledgeContext(p) {
    const userScope = cs.required()
    const sources = mantleKnowledge.currentSources(organizationsOf(userScope))
    const spaceIds = Array.from(new Set(sources.flatMap(source => [source.wikiSpaceId, source.draftWikiSpaceId]).filter(Boolean)))
    const theCase = visibleCase(userScope, p.requestId)
    const can = userScope.capabilities
    return {
        knowledgeContext: {
            spaceIds,
            configured: sources.length > 0,
            requestId: theCase?.requestId || null,
            caseName: theCase ? theCase.requestName || theCase.requestId : null,
            caseUrl: theCase
                ? "/qapps/CustomerService/Cases/CaseDetail?requestId=" + encodeURIComponent(theCase.requestId) + "&tab=knowledge"
                : null,
            canLink: !!theCase && !!can.caseEdit,
            canSend: !!theCase && !!can.caseEdit,
            canSuggest: !!can.caseEdit,
            canAuthor: !!can.knowledgeEdit,
            feedbackUrl: can.knowledgeEdit || can.caseManage ? "/qapps/CustomerService/Knowledge/ArticleFeedback" : null
        }
    }
}

// ===== get#CaseKnowledge: a case's Knowledge tab =====
// The articles linked to the case (WikiPageRequest), each with its space, state and audience, and the suggestions for its
// subject or the text searched (Mantle's find#ArticleSuggestions, the requester's language first), linked ones marked.
function caseKnowledge(p) {
    const userScope = cs.required()
    cs.recordOf(userScope, "case", p.requestId)
    const theCase = one("mantle.request.Request", {requestId: p.requestId})
    const parties = rows("mantle.request.RequestParty", {requestId: p.requestId}).filter(row => lib.active(row))
    const organizationPartyId = parties.find(row => row.roleTypeId === "OrgInternal")?.partyId || null
    const sources = mantleKnowledge.currentSources(organizationPartyId ? [organizationPartyId] : [])
    // a linked page only when the wiki lets the user view it (a link never widens who reads a page)
    const scope = ec.service.sync().name("org.moqui.impl.WikiServices.get#WikiViewScope").call() || {}
    const viewSpaceIds = new Set(Array.from(scope.viewSpaceIdList || []))
    const hiddenPageIds = new Set(Array.from(scope.hiddenPageIdList || []))
    const linked = []
    for (const link of rows("mantle.request.WikiPageRequest", {requestId: p.requestId})) {
        const page = one(PAGE, {wikiPageId: link.wikiPageId})
        if (!page || !viewSpaceIds.has(page.wikiSpaceId) || hiddenPageIds.has(page.wikiPageId)) continue
        const source = mantleKnowledge.sourceOfPage(sources, page)
        linked.push(
            articleRow(page, source, {
                linked: true,
                url: knowledgeUrl(page.wikiPageId, p.requestId)
            })
        )
    }
    let suggestions = {articleList: [], requesterLanguage: null, configured: sources.length > 0}
    try {
        suggestions = mantle("find#ArticleSuggestions", {requestId: p.requestId, text: p.text || null, limit: 10})
    } catch (error) {
        ec.logger.warn("Case " + p.requestId + ": no article suggestions: " + error.message)
    }
    const can = userScope.capabilities
    return {
        knowledge: {
            requestId: p.requestId,
            caseName: theCase?.requestName || p.requestId,
            text: p.text || theCase?.requestName || "",
            linked,
            suggestions: Array.from(suggestions.articleList || []).map(row =>
                Object.assign({}, row, {
                    stateText: row.published ? L("Published") : L("Draft"),
                    stateColor: row.published ? "positive" : "grey-7",
                    languageText: row.localeLanguage ? String(row.localeLanguage).toUpperCase() : "",
                    url: knowledgeUrl(row.wikiPageId, p.requestId)
                })
            ),
            requesterLanguage: suggestions.requesterLanguage || null,
            configured: !!suggestions.configured,
            canLink: !!can.caseEdit,
            canSend: !!can.caseEdit,
            canSuggest: !!can.caseEdit,
            canAuthor: !!can.knowledgeEdit,
            knowledgeUrl: "/qapps/CustomerService/Knowledge/Knowledge?requestId=" + encodeURIComponent(p.requestId),
            caseToArticleUrl: can.knowledgeEdit
                ? "/qapps/CustomerService/Knowledge/CaseToArticle?requestId=" + encodeURIComponent(p.requestId)
                : null
        }
    }
}
function articleRow(page, source, extra = {}) {
    const internal = !source || source.audienceEnumId === "SkaInternal"
    return Object.assign(
        {
            wikiPageId: page.wikiPageId,
            wikiSpaceId: page.wikiSpaceId,
            pagePath: page.pagePath,
            title: pageTitle(page),
            spaceName: spaceName(page.wikiSpaceId),
            published: !!page.publishedVersionName,
            stateText: page.publishedVersionName ? L("Published") : L("Draft"),
            stateColor: page.publishedVersionName ? "positive" : "grey-7",
            internal,
            audienceText: source ? enumText(source.audienceEnumId) : L("Not a knowledge source"),
            languageText: source?.localeLanguage ? String(source.localeLanguage).toUpperCase() : ""
        },
        extra
    )
}

// ===== prepare#ArticleSend: Send to customer =====
// Compose for the case's contact (else its customer) with the article's published address in the body and the case as
// its record; Mantle's get#ArticlePublicLink refuses a draft and an internal article.
function prepareSend(p) {
    const userScope = cs.required()
    if (!userScope.capabilities.caseEdit) denied("PERMISSION_DENIED", "SUPPORT_CASE_EDIT is required")
    cs.recordOf(userScope, "case", p.requestId)
    const link = mantle("get#ArticlePublicLink", {wikiPageId: p.wikiPageId, requestId: p.requestId})
    const parties = rows("mantle.request.RequestParty", {requestId: p.requestId}).filter(row => lib.active(row))
    // the contact, else the customer; never an agent who filed the case (its Reporter, F-P12-6)
    const to = ["Reporter", "Customer"]
        .map(roleTypeId => parties.find(row => row.roleTypeId === roleTypeId)?.partyId)
        .filter(partyId => partyId && !mantleKnowledge.isStaff(partyId))
        .map(emailOf)
        .find(Boolean)
    const encode = value =>
        String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    const body =
        "<p>" +
        encode(L("This article answers your question:")) +
        ' <a href="' +
        encode(link.url) +
        '">' +
        encode(link.title) +
        "</a></p>"
    const query = {to: to || "", subject: link.title, body, recordEntity: "mantle.request.Request", recordId: p.requestId}
    const composeUrl =
        "/qapps/Comms/Inbox/Compose?" +
        Object.entries(query)
            .map(([key, value]) => key + "=" + encodeURIComponent(value))
            .join("&")
    return {send: {composeUrl, url: link.url, title: link.title, to: to || null}}
}
// A party's current email address, the primary one first.
function emailOf(partyId) {
    const mechs = rows("mantle.party.contact.PartyContactMechInfo", {partyId, contactMechTypeEnumId: "CmtEmailAddress"}).filter(
        row => lib.active(row)
    )
    mechs.sort((a, b) => (b.contactMechPurposeId === "EmailPrimary") - (a.contactMechPurposeId === "EmailPrimary"))
    return mechs[0]?.infoString || null
}

// ===== find#ArticleFeedback =====
// The feedback on the articles of the user's organizations (design ArticleFeedback FeedbackFind, FeedbackList): by space,
// article, helpful, review state and period, newest first, paged; each with its article and version, the case when the user
// sees it (else only that there is one), the number of cases on the article, who gave it (a customer's name only to a
// knowledge author or manager) and the review. For a knowledge author or service manager (SUPPORT_KNOWLEDGE_EDIT,
// SUPPORT_CASE_MANAGE).
function findFeedback(p) {
    const userScope = cs.required()
    const can = userScope.capabilities
    if (!can.knowledgeEdit && !can.caseManage) denied("PERMISSION_DENIED", "SUPPORT_KNOWLEDGE_EDIT is required")
    const factory = ec.entity.conditionFactory
    const organizations = organizationsOf(userScope)
    const query = () => {
        let q = find(FEEDBACK)
        if (organizations) q = q.condition("organizationPartyId", "in", organizations.length ? organizations : ["_NONE_"])
        if (p.wikiPageId) q = q.condition("wikiPageId", p.wikiPageId)
        if (p.wikiSpaceId) {
            const pageIds = Array.from(find(PAGE, {wikiSpaceId: p.wikiSpaceId}).selectField("wikiPageId").limit(5000).list()).map(
                row => row.wikiPageId
            )
            q = q.condition("wikiPageId", "in", pageIds.length ? pageIds : ["_NONE_"])
        }
        if (p.helpful === "Y" || p.helpful === "N") q = q.condition("helpful", p.helpful)
        if (p.statusId) q = q.condition("statusId", p.statusId)
        if (p.fromDate) q = q.condition(factory.makeCondition("submittedDate", "greater-equals", p.fromDate))
        if (p.thruDate) q = q.condition(factory.makeCondition("submittedDate", "less", p.thruDate))
        return q
    }
    const count = query().count()
    const found = lib.page(query().orderBy("-submittedDate,-articleFeedbackId"), p, "feedback", count)
    const pageIds = Array.from(new Set(found.rows.map(row => row.wikiPageId)))
    const pages = new Map(
        pageIds.length
            ? Array.from(find(PAGE).condition("wikiPageId", "in", pageIds).list()).map(row => [row.wikiPageId, row])
            : []
    )
    const caseCounts = new Map()
    for (const wikiPageId of pageIds)
        caseCounts.set(
            wikiPageId,
            new Set(
                rows(FEEDBACK, {wikiPageId})
                    .map(row => row.requestId)
                    .filter(Boolean)
            ).size
        )
    const userName = userId => {
        const account = userId ? one("moqui.security.UserAccount", {userId}) : null
        return account ? cs.partyName(account.partyId) || account.username : ""
    }
    const showContact = can.knowledgeEdit || can.caseManage
    const list = found.rows.map(row => {
        const page = pages.get(row.wikiPageId)
        const seen = row.requestId ? !!visibleCase(userScope, row.requestId) : false
        const customer = row.sourceEnumId === "AfsCustomer"
        return {
            articleFeedbackId: row.articleFeedbackId,
            wikiPageId: row.wikiPageId,
            title: page ? pageTitle(page) : row.wikiPageId,
            spaceName: page ? spaceName(page.wikiSpaceId) : "",
            articleUrl: knowledgeUrl(row.wikiPageId, null),
            versionText: row.versionName ? String(row.versionName).substring(0, 10) : "",
            helpful: row.helpful,
            helpfulText: row.helpful === "Y" ? L("Helpful") : L("Not helpful"),
            helpfulColor: row.helpful === "Y" ? "positive" : "negative",
            comment: row.comment || "",
            requestId: seen ? row.requestId : null,
            caseText: seen ? row.requestId : row.requestId ? L("A case not yours") : "",
            caseUrl: seen ? "/qapps/CustomerService/Cases/CaseDetail?requestId=" + encodeURIComponent(row.requestId) : null,
            caseCount: caseCounts.get(row.wikiPageId) || 0,
            fromText: customer
                ? showContact
                    ? cs.partyName(row.submittedByPartyId) || L("A customer")
                    : L("A customer")
                : userName(row.submittedByUserId) || L("An agent"),
            submittedText: textOf(row.submittedDate),
            statusId: row.statusId,
            statusText: cs.statusText(row.statusId),
            reviewed: row.statusId === "AfbReviewed",
            decisionText: enumText(row.decisionEnumId),
            reviewerName: userName(row.reviewedByUserId),
            reviewedText: textOf(row.reviewedDate),
            workEffortId: row.workEffortId || null,
            taskUrl: row.workEffortId
                ? "/qapps/Commons/Tasks/TaskDetail?workEffortId=" + encodeURIComponent(row.workEffortId)
                : null
        }
    })
    const spaceOptions = Array.from(new Set(mantleKnowledge.currentSources(organizations).map(source => source.wikiSpaceId))).map(
        wikiSpaceId => ({value: wikiSpaceId, label: spaceName(wikiSpaceId)})
    )
    return Object.assign(
        {
            feedbackList: list,
            spaceOptions,
            canReview: !!can.knowledgeEdit
        },
        Object.fromEntries(
            ["Count", "PageIndex", "PageSize", "PageMaxIndex", "PageRangeLow", "PageRangeHigh"].map(key => [
                "feedbackList" + key,
                found["feedback" + key]
            ])
        )
    )
}

// ===== prepare#ArticleFromCase: CaseToArticle =====
// The case's answers for an article (design CaseToArticle AnswerSelection): its outward and customer emails with their
// audience, the internal notes left out (counted, never offered), the personal data found for the author to check, the draft
// spaces of the organization's sources, and the redacted preview of the chosen answers (Mantle's create#ArticleFromCase with
// preview). For a knowledge author (SUPPORT_KNOWLEDGE_EDIT) on a case they see.
function prepareArticle(p) {
    const userScope = cs.required()
    if (!userScope.capabilities.knowledgeEdit) denied("PERMISSION_DENIED", "SUPPORT_KNOWLEDGE_EDIT is required")
    cs.recordOf(userScope, "case", p.requestId)
    const theCase = one("mantle.request.Request", {requestId: p.requestId})
    const parties = rows("mantle.request.RequestParty", {requestId: p.requestId}).filter(row => lib.active(row))
    const organizationPartyId = parties.find(row => row.roleTypeId === "OrgInternal")?.partyId || null
    const messages = mantleKnowledge.caseMessages(p.requestId)
    const kindText = {outward: L("Our reply (customer-visible)"), customer: L("From the customer (customer-visible)")}
    const answers = messages
        .filter(row => row.kind !== "internal")
        .map(({event, kind}) => ({
            communicationEventId: event.communicationEventId,
            kind,
            kindText: kindText[kind],
            fromName: cs.partyName(event.fromPartyId),
            dateText: textOf(event.entryDate),
            subject: event.subject || "",
            text: String(event.body || "")
                .replace(/<[^>]*>/g, " ")
                .replace(/&nbsp;/g, " ")
                .replace(/\s+/g, " ")
                .trim()
                .substring(0, 600)
        }))
    const chosen = Array.from(p.communicationEventIds || []).map(String)
    const selected = chosen.length
        ? chosen.filter(id => answers.some(row => row.communicationEventId === id))
        : answers.filter(row => row.kind === "outward").map(row => row.communicationEventId)
    const sources = mantleKnowledge
        .currentSources(organizationPartyId ? [organizationPartyId] : [])
        .filter(source => source.draftWikiSpaceId)
    const spaceOptions = Array.from(new Set(sources.map(source => source.draftWikiSpaceId))).map(wikiSpaceId => ({
        value: wikiSpaceId,
        label: spaceName(wikiSpaceId)
    }))
    let preview = null
    if (spaceOptions.length && (selected.length || !blank(theCase?.description)))
        try {
            preview = mantle("create#ArticleFromCase", {
                requestId: p.requestId,
                title: theCase?.requestName || null,
                communicationEventIds: selected,
                body: selected.length ? null : theCase.description,
                preview: true
            })
        } catch (error) {
            ec.logger.warn("Case " + p.requestId + ": no article preview: " + error.message)
        }
    const kindNames = {
        name: L("Names"),
        email: L("Email addresses"),
        contact: L("Contact details"),
        phone: L("Phone numbers"),
        address: L("Addresses"),
        order: L("Orders and returns")
    }
    return {
        prepared: {
            requestId: p.requestId,
            caseName: theCase?.requestName || p.requestId,
            resolutionText: enumText(theCase?.requestResolutionEnumId),
            answers,
            selectedIds: selected,
            internalCount: messages.filter(row => row.kind === "internal").length,
            personalData: mantleKnowledge
                .personalTerms(p.requestId)
                .map(row => ({kind: row.kind, kindText: kindNames[row.kind] || row.kind, term: row.term})),
            spaceOptions,
            wikiSpaceId: spaceOptions[0]?.value || null,
            title: preview?.pageName || theCase?.requestName || "",
            body: preview?.text || "",
            removedText: (preview?.removedList || [])
                .map(row => (kindNames[row.kind] || row.kind) + " (" + row.count + ")")
                .join(", ")
        }
    }
}

// ===== find#KnowledgeSources: KnowledgeSources =====
// The organization's sources (design KnowledgeSources ServiceKnowledgeSources), current and drafts, with their display text,
// and the options of the edit form: the wiki spaces the user may read, the organization's teams and queues, the audiences.
function findSources(p) {
    const userScope = cs.required()
    const ids = cs.vendorIds(userScope)
    const organizationPartyId = p.organizationPartyId || userScope.activeOrganizationPartyId || ids[0] || null
    if (!organizationPartyId || !ids.includes(organizationPartyId))
        denied("RECORD_UNAVAILABLE", "Organization " + (organizationPartyId || "") + " is not available")
    const all = rows(SOURCE, {organizationPartyId})
    const sources = all
        .filter(row => !row.thruDate || ms(row.thruDate) > ms(ec.user.nowTimestamp))
        .sort((a, b) => (a.sequenceNum ?? 99) - (b.sequenceNum ?? 99))
        .map(row => ({
            serviceKnowledgeSourceId: row.serviceKnowledgeSourceId,
            wikiSpaceId: row.wikiSpaceId,
            spaceName: spaceName(row.wikiSpaceId),
            pagePathPrefix: row.pagePathPrefix || "",
            partText: row.pagePathPrefix ? row.pagePathPrefix : L("The whole space"),
            audienceEnumId: row.audienceEnumId,
            audienceText: enumText(row.audienceEnumId),
            audienceColor: row.audienceEnumId === "SkaInternal" ? "warning" : "positive",
            localeLanguage: row.localeLanguage || "",
            languageText: row.localeLanguage ? String(row.localeLanguage).toUpperCase() : "",
            requestCategoryId: row.requestCategoryId || "",
            queueText: cs.queueName(row.requestCategoryId),
            productCategoryId: row.productCategoryId || "",
            sequenceNum: row.sequenceNum ?? "",
            allowSuggestions: row.allowSuggestions || "Y",
            reviewTeamPartyId: row.reviewTeamPartyId || "",
            reviewTeamText: cs.partyName(row.reviewTeamPartyId),
            draftWikiSpaceId: row.draftWikiSpaceId || "",
            draftText: row.draftWikiSpaceId
                ? spaceName(row.draftWikiSpaceId) + (row.draftParentPath ? " / " + row.draftParentPath : "")
                : "",
            draftParentPath: row.draftParentPath || "",
            draft: !row.fromDate,
            fromText: row.fromDate ? dayText(row.fromDate) : L("Draft")
        }))
    const scope = ec.service.sync().name("org.moqui.impl.WikiServices.get#WikiViewScope").call() || {}
    const spaceOptions = Array.from(scope.viewSpaceIdList || [])
        .map(wikiSpaceId => ({value: wikiSpaceId, label: spaceName(wikiSpaceId)}))
        .sort((a, b) => a.label.localeCompare(b.label))
    const teamOptions = Array.from(
        find("mantle.party.PartyDetailAndRole", {roleTypeId: "OrgTeam", ownerPartyId: organizationPartyId}).limit(100).list()
    ).map(row => ({value: row.partyId, label: cs.partyName(row.partyId)}))
    const queueOptions = userScope.queueIds
        .filter(requestCategoryId => cs.queueOwner(requestCategoryId) === organizationPartyId)
        .map(requestCategoryId => ({value: requestCategoryId, label: cs.queueName(requestCategoryId)}))
    return {
        organizationPartyId,
        organizations: ids.map(partyId => ({value: partyId, label: cs.partyName(partyId)})),
        sources,
        spaceOptions,
        teamOptions,
        queueOptions
    }
}

const operations = {knowledgeContext, caseKnowledge, prepareSend, findFeedback, prepareArticle, findSources}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Customer Service knowledge operation " + op)
        return operations[op](parameters)
    }
})
