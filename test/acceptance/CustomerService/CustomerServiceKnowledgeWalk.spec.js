// Customer Service P12's "usable when" (impl-customer-service P12), as an acceptance walk through the screens' transitions with
// artifact authorization on: a case's subject suggests a published article in the requester's language first (a contact of
// Joe's Distributing who reads Spanish gets the Spanish thermostat article before the English one in CaseDetail's Knowledge
// tab); the agent links the English article and sends it (Compose with its published address), and sending the draft is
// refused; CaseToArticle makes a redacted draft of Joe's case in the service space, unpublished and linked to the case; a
// reviewed feedback makes a task and leaves the article unchanged, a forged feedback named among the results; and an internal
// article is never suggested, read or linked on a customer-visible surface. The rules are Mantle's SupportKnowledge spec and
// CustomerServiceKnowledge's. Run: ./moq accept mr-boss --spec CustomerServiceKnowledgeWalk
const lib = ec.resource.script("component://mr-boss/test/CustomerService/CustomerServiceSpecLib.js")
const {ids, users, asUser, system, invoke, refusal} = lib
const webroot = "component://webroot/screen/webroot.xml"
const K = "mantle.request.KnowledgeServices."
const state = {}
const one = (entity, conditions) => system(() => ec.entity.find(entity).condition(conditions).one())
const rows = (entity, conditions) => system(() => Array.from(ec.entity.find(entity).condition(conditions).list()))
const article = key =>
    one("moqui.resource.wiki.WikiPage", {wikiSpaceId: ids.articlePaths[key][0], pagePath: ids.articlePaths[key][1]})
const pageText = wikiPageId =>
    system(() =>
        String(
            ec.service
                .sync()
                .name("org.moqui.resource.WikiServices.get#WikiPageReference")
                .parameters({wikiPageId})
                .call()
                .pageReference.getText() || ""
        )
    )
// a transition of a Customer Service screen as the user posts it
function post(user, path, parameters) {
    return asUser(user, () => {
        const rendered = ec.screen
            .makeTest()
            .rootScreen(webroot)
            .render("apps/CustomerService/" + path, parameters, "post")
        const result = {status: rendered.status, errors: Array.from(rendered.errorMessages || []).join(" | ")}
        ec.message.clearErrors()
        return result
    })
}

spec({
    setupSpec() {
        // a contact of Joe's Distributing who reads Spanish
        system(() => {
            const call = (name, parameters) => ec.service.sync().name(name).parameters(parameters).call()
            call("create#mantle.party.Party", {
                partyId: "BOSS_CS_KW_LUCIA",
                partyTypeEnumId: "PtyPerson",
                ownerPartyId: ids.organizationId
            })
            call("create#mantle.party.Person", {partyId: "BOSS_CS_KW_LUCIA", firstName: "Lucia", lastName: "Herrera"})
            call("create#mantle.party.PartyRelationship", {
                relationshipTypeEnumId: "PrtContact",
                fromPartyId: "BOSS_CS_KW_LUCIA",
                toPartyId: ids.companyCustomerId,
                fromDate: ec.user.nowTimestamp
            })
            call("create#moqui.security.UserAccount", {
                userId: "BOSS_CS_KW_LUCIA",
                username: "lucia@joesdist.example.com",
                partyId: "BOSS_CS_KW_LUCIA",
                locale: "es_ES",
                currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
                passwordHashType: "SHA"
            })
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "a Spanish reader's case suggests the Spanish article first; the agent links the English one and sends it; a draft is refused",
    {
        when() {
            const created = post(users.agent, "Cases/NewCase/createCase", {
                organizationPartyId: ids.organizationId,
                customerPartyId: ids.companyCustomerId,
                contactPartyId: "BOSS_CS_KW_LUCIA",
                requestTypeEnumId: "RqtSupport",
                requestCategoryId: ids.supportQueueId,
                requestName: "Thermostat reads the wrong temperature in the warehouse",
                priority: "5",
                salesChannelEnumId: "ScPhone"
            })
            state.caseId = one("mantle.request.Request", {
                requestName: "Thermostat reads the wrong temperature in the warehouse"
            })?.requestId
            const tab = asUser(users.agent, () => lib.page("Cases/CaseDetail", {requestId: state.caseId, tab: "knowledge"}))
            const english = article("english")
            const linked = post(users.agent, "Cases/CaseDetail/linkArticle", {
                requestId: state.caseId,
                wikiPageId: english.wikiPageId
            })
            const send = asUser(
                users.agent,
                () =>
                    invoke("ironstone.customerservice.KnowledgeServices.prepare#ArticleSend", {
                        appRoot: "CustomerService",
                        requestId: state.caseId,
                        wikiPageId: english.wikiPageId
                    }).send
            )
            const sendPost = post(users.agent, "Cases/CaseDetail/sendArticle", {
                requestId: state.caseId,
                wikiPageId: english.wikiPageId
            })
            const draftPost = post(users.agent, "Cases/CaseDetail/sendArticle", {
                requestId: state.caseId,
                wikiPageId: article("draft").wikiPageId
            })
            return {created, tab, english, linked, send, sendPost, draftPost, spanish: article("spanish")}
        },
        then({created, tab, english, linked, send, sendPost, draftPost, spanish}) {
            created.errors == ""
            tab.errors == []
            tab.output.includes("Suggested articles (ES first)")
            tab.output.indexOf("wikiPageId=" + spanish.wikiPageId) < tab.output.indexOf("wikiPageId=" + english.wikiPageId)
            tab.output.includes("Thermostat calibration offset")
            linked.errors == ""
            one("mantle.request.WikiPageRequest", {requestId: state.caseId, wikiPageId: english.wikiPageId}) != null
            // the Support app's article page on the demo Shop site (Shop P3, F56)
            send.url.includes("/support/CustomerArticle?wikiPageId=" + english.wikiPageId)
            send.composeUrl.includes("recordId=" + state.caseId)
            sendPost.errors == ""
            draftPost.errors.includes("ARTICLE_NOT_PUBLISHED")
            spanish.publishedVersionName != null
        }
    }
)

feature("CaseToArticle makes a redacted draft of Joe's case in the service space, unpublished and linked to the case", {
    when() {
        const step = asUser(users.knowledge, () => lib.page("Knowledge/CaseToArticle", {requestId: ids.thermostatCaseId}))
        const prepared = asUser(
            users.knowledge,
            () =>
                invoke("ironstone.customerservice.KnowledgeServices.prepare#ArticleFromCase", {
                    appRoot: "CustomerService",
                    requestId: ids.thermostatCaseId
                }).prepared
        )
        const saved = post(users.knowledge, "Knowledge/CaseToArticle/createArticle", {
            requestId: ids.thermostatCaseId,
            wikiSpaceId: prepared.wikiSpaceId,
            title: "Calibrating a thermostat that reads high",
            body: prepared.body
        })
        const draft = one("moqui.resource.wiki.WikiPage", {
            wikiSpaceId: "ZZW_SVC",
            pagePath: "drafts/Calibrating a thermostat that reads high"
        })
        return {step, prepared, saved, draft, text: draft ? pageText(draft.wikiPageId) : ""}
    },
    then({step, prepared, saved, draft, text}) {
        step.errors == []
        prepared.internalCount == 1
        saved.errors == ""
        draft != null
        draft.publishedVersionName == null
        one("mantle.request.WikiPageRequest", {requestId: ids.thermostatCaseId, wikiPageId: draft.wikiPageId}) != null
        text.includes("Calibrate")
        !text.includes("Joe Public")
        !text.includes(ids.deliveredOrderId)
        !text.includes("October batch")
    }
})

feature("a reviewed feedback makes a task and leaves the article unchanged; a forged feedback is named and the others reviewed", {
    when() {
        const english = article("english")
        const before = pageText(english.wikiPageId)
        const feedback = rows("mantle.request.support.ArticleFeedback", {
            wikiPageId: english.wikiPageId,
            statusId: "AfbSubmitted"
        })
        // FeedbackReview on the selected feedback and a forged id: the forged one is named, the others reviewed
        const reviewed = post(users.knowledge, "Knowledge/ArticleFeedback/reviewFeedback", {
            selectedIds: feedback
                .map(row => row.articleFeedbackId)
                .concat(["BOSS_CS_NO_FEEDBACK"])
                .join(","),
            decisionEnumId: "AfdImprove",
            reviewNote: "Say what to do when calibrating does not help"
        })
        const stored = feedback.map(row =>
            one("mantle.request.support.ArticleFeedback", {articleFeedbackId: row.articleFeedbackId})
        )
        const taskId = stored[0]?.workEffortId
        return {
            feedback,
            reviewed,
            stored,
            task: taskId ? one("mantle.work.effort.WorkEffort", {workEffortId: taskId}) : null,
            pageTask: taskId
                ? one("mantle.work.effort.WikiPageWorkEffort", {wikiPageId: english.wikiPageId, workEffortId: taskId})
                : null,
            before,
            after: pageText(english.wikiPageId),
            english,
            englishAfter: article("english")
        }
    },
    then({feedback, reviewed, stored, task, pageTask, before, after, english, englishAfter}) {
        feedback.length >= 2
        reviewed.errors == ""
        stored.every(row => row.statusId == "AfbReviewed" && row.workEffortId == stored[0].workEffortId)
        task != null
        pageTask != null
        after == before
        englishAfter.publishedVersionName == english.publishedVersionName
    }
})

feature("an internal article is never suggested, read or sent on a customer-visible surface", {
    when() {
        const internal = article("internal")
        // the Support app's surface (P15) calls these Mantle services: with no screen yet, as the agent with the services'
        // own rules (artifact authorization off)
        const suggested = asUser(
            users.agent,
            () =>
                invoke(K + "find#ArticleSuggestions", {
                    organizationPartyId: ids.organizationId,
                    text: "thermostat calibration temperature",
                    customerVisible: true
                }),
            false
        )
        return {
            internal,
            articleIds: Array.from(suggested.articleList || []).map(row => row.wikiPageId),
            read: asUser(users.agent, () => refusal(K + "get#PublishedArticle", {wikiPageId: internal.wikiPageId}), false),
            sent: asUser(users.agent, () => refusal(K + "get#ArticlePublicLink", {wikiPageId: internal.wikiPageId}), false),
            english: article("english")
        }
    },
    then({internal, articleIds, read, sent, english}) {
        articleIds.includes(english.wikiPageId)
        !articleIds.includes(internal.wikiPageId)
        read.includes("ARTICLE_UNAVAILABLE")
        sent.includes("ARTICLE_INTERNAL")
    }
})
