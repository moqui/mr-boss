// Customer Service knowledge (impl-customer-service P12, CS-KNOWLEDGE): the demo articles and sources (load#KnowledgeDemo);
// a case's Knowledge tab read (the published English article for Joe's thermostat case first, the internal one flagged);
// the Knowledge mount's spaces; Send to customer's Compose address and its refusal of a draft and an internal article;
// ArticleFeedback's one render (qvt) with the demo feedback and its review; CaseToArticle's one render (qvt): the outward
// reply offered, the internal note left out, Joe's data taken out. The rules are Mantle's SupportKnowledge spec; the access
// rules CustomerServiceAccess's. Run: ./moq test mr-boss --spec CustomerService/CustomerServiceKnowledge
const lib = ec.resource.script("component://mr-boss/test/CustomerService/CustomerServiceSpecLib.js")
const {ids, users, asUser, system, refusal, invoke} = lib
const K = "ironstone.customerservice.KnowledgeServices."
const page = path =>
    system(() =>
        ec.entity.find("moqui.resource.wiki.WikiPage").condition({wikiSpaceId: path[0], pagePath: path[1]}).disableAuthz().one()
    )

spec({
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "the case's Knowledge tab suggests the published customer article first, the internal one flagged; the mount lists the sources' spaces",
    {
        when() {
            // a restricted page linked to the case is not listed to an agent the wiki does not let view it
            const restricted = system(() => {
                const out = ec.service
                    .sync()
                    .name("org.moqui.impl.WikiServices.update#WikiPage")
                    .parameters({wikiSpaceId: "ZZW_SVC", parentPath: "", pageName: "Knowledge spec restricted", pageText: "x"})
                    .call()
                ec.service
                    .sync()
                    .name("update#moqui.resource.wiki.WikiPage")
                    .parameters({wikiPageId: out.wikiPageId, restrictView: "Y"})
                    .call()
                ec.service
                    .sync()
                    .name("create#mantle.request.WikiPageRequest")
                    .parameters({wikiPageId: out.wikiPageId, requestId: ids.thermostatCaseId})
                    .call()
                return out.wikiPageId
            })
            const knowledge = asUser(
                users.agent,
                () => invoke(K + "get#CaseKnowledge", {appRoot: "CustomerService", requestId: ids.thermostatCaseId}).knowledge
            )
            const context = asUser(
                users.agent,
                () =>
                    invoke(K + "get#KnowledgeContext", {appRoot: "CustomerService", requestId: ids.thermostatCaseId})
                        .knowledgeContext
            )
            const readerContext = asUser(
                users.read,
                () =>
                    invoke(K + "get#KnowledgeContext", {appRoot: "CustomerService", requestId: ids.thermostatCaseId})
                        .knowledgeContext
            )
            return {
                restricted,
                knowledge,
                context,
                readerContext,
                english: page(ids.articlePaths.english),
                internal: page(ids.articlePaths.internal)
            }
        },
        then({restricted, knowledge, context, readerContext, english, internal}) {
            knowledge.configured == true
            !knowledge.linked.some(row => row.wikiPageId == restricted)
            knowledge.suggestions[0].wikiPageId == english.wikiPageId
            knowledge.suggestions.find(row => row.wikiPageId == internal.wikiPageId).internal == true
            knowledge.canLink == true
            knowledge.caseToArticleUrl == null
            context.spaceIds.includes("ZZW_RETAIL")
            context.spaceIds.includes("ZZW_SVC")
            context.requestId == ids.thermostatCaseId
            context.canSend == true
            readerContext.requestId == null
            readerContext.canSend == false
        }
    }
)

feature("Send to customer: Compose for Joe with the published address; a draft and an internal article are refused", {
    when() {
        const send = wikiPageId =>
            asUser(users.agent, () =>
                refusal(K + "prepare#ArticleSend", {appRoot: "CustomerService", requestId: ids.thermostatCaseId, wikiPageId})
            )
        const english = page(ids.articlePaths.english)
        const prepared = asUser(
            users.agent,
            () =>
                invoke(K + "prepare#ArticleSend", {
                    appRoot: "CustomerService",
                    requestId: ids.thermostatCaseId,
                    wikiPageId: english.wikiPageId
                }).send
        )
        return {
            prepared,
            published: send(english.wikiPageId),
            draft: send(page(ids.articlePaths.draft).wikiPageId),
            internal: send(page(ids.articlePaths.internal).wikiPageId),
            reader: asUser(users.read, () =>
                refusal(K + "prepare#ArticleSend", {
                    appRoot: "CustomerService",
                    requestId: ids.thermostatCaseId,
                    wikiPageId: english.wikiPageId
                })
            )
        }
    },
    then({prepared, published, draft, internal, reader}) {
        published == ""
        prepared.to == "joe@public.com"
        // the Support app's article page on the demo Shop site (impl-shop P3, F56)
        prepared.url.includes("/support/CustomerArticle?wikiPageId=")
        prepared.composeUrl.startsWith("/qapps/Comms/Inbox/Compose?to=joe%40public.com")
        prepared.composeUrl.includes("recordId=" + ids.thermostatCaseId)
        draft.includes("ARTICLE_NOT_PUBLISHED")
        internal.includes("ARTICLE_INTERNAL")
        reader.includes("PERMISSION_DENIED")
    }
})

feature("ArticleFeedback renders the demo feedback for the knowledge author (qvt), and its review makes the task", {
    when() {
        const rendered = asUser(users.knowledge, () => lib.page("Knowledge/ArticleFeedback", {}))
        const found = asUser(users.knowledge, () => invoke(K + "find#ArticleFeedback", {appRoot: "CustomerService"}))
        const ids0 = Array.from(found.feedbackList || []).map(row => row.articleFeedbackId)
        return {rendered, found, ids0}
    },
    then({rendered, found, ids0}) {
        rendered.status == 200
        rendered.errors == []
        rendered.output.includes("Article feedback")
        rendered.output.includes("Thermostat reads the wrong temperature")
        rendered.output.includes("the article should say what to do then")
        found.canReview == true
        ids0.length >= 2
        found.feedbackList.every(row => row.caseText == ids.thermostatCaseId)
    }
})

feature("CaseToArticle offers the outward reply, leaves out the internal note and takes Joe's data out (qvt)", {
    when() {
        const rendered = asUser(users.knowledge, () => lib.page("Knowledge/CaseToArticle", {requestId: ids.thermostatCaseId}))
        const prepared = asUser(
            users.knowledge,
            () => invoke(K + "prepare#ArticleFromCase", {appRoot: "CustomerService", requestId: ids.thermostatCaseId}).prepared
        )
        return {rendered, prepared}
    },
    then({rendered, prepared}) {
        rendered.status == 200
        rendered.errors == []
        rendered.output.includes("Article from case " + ids.thermostatCaseId)
        rendered.output.includes("Our reply (customer-visible)")
        rendered.output.includes("1 internal note(s)")
        prepared.answers.length == 1
        prepared.selectedIds == ["BOSS_CS_CE_THERMO_REPLY"]
        prepared.wikiSpaceId == "ZZW_SVC"
        prepared.body.includes("[customer]")
        prepared.body.includes("[order]")
        !prepared.body.includes("Joe Public")
        !prepared.body.includes("October batch")
    }
})
