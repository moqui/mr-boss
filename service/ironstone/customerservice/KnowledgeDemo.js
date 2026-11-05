// Customer Service's demo knowledge (impl-customer-service P12, F34; DemoServices.load#KnowledgeDemo, run from
// BossZCustomerServiceDemoData.xml after the cases): ORG_ZIZI_RETAIL's service articles through the wiki's own services, in
// ZZW_RETAIL, the retail space the POPC store publishes (html pages under help/: the thermostat reading wrong and the
// replacement filters, published; a battery article left a draft; the thermostat article in Spanish under help/es/), and in
// a new internal space ZZW_SVC (md: the thermostat calibration offset, published, for agents only; and drafts/, where
// articles drafted from cases go); then the knowledge sources through Mantle's save#ServiceKnowledgeSource (help/ for
// customers in English and help/es/ in Spanish, both reviewed by the Retail support team with drafts in ZZW_SVC; ZZW_SVC for
// agents), and two agents' feedback on the thermostat article from Joe's case. Each step on its own (one that fails is
// named and the others are made); idempotent by the pages' paths and the sources' spaces.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const {find, one, rows, call} = lib

const organizationPartyId = "ORG_ZIZI_RETAIL"
const retailSpace = "ZZW_RETAIL"
const serviceSpace = "ZZW_SVC"
const team = "BOSS_CS_TEAM_SUPPORT"
const W = "org.moqui.impl.WikiServices."
const K = "mantle.request.KnowledgeServices."

function asDemoAdministrator(operation) {
    if (ec.user.userId && !lib.access.systemAdmin()) throw new Error("Demo loading requires system administration")
    const loggedIn = !!ec.user.username
    if (!loggedIn) ec.user.internalLoginUser("john.doe")
    const authzDisabled = ec.artifactExecution.disableAuthz()
    try {
        return operation()
    } finally {
        if (!authzDisabled) ec.artifactExecution.enableAuthz()
        if (!loggedIn) ec.user.logoutUser()
    }
}

// the articles: space, parent path, name, text, published
const articles = [
    [
        retailSpace,
        "help",
        "Thermostat reads the wrong temperature",
        "<h1>Thermostat reads the wrong temperature</h1>\n<p>A new thermostat can read up to three degrees high for its first day while it settles.</p>\n" +
            "<p>If it still reads wrong after a day, open Settings, choose Calibrate and enter the temperature of a room thermometer.</p>",
        true
    ],
    [
        retailSpace,
        "help",
        "Replacement filter schedule",
        "<h1>Replacement filter schedule</h1>\n<p>Replace the filter every three months. Replacement filters ship within two working days when in stock.</p>",
        true
    ],
    [
        retailSpace,
        "help",
        "Thermostat battery replacement",
        "<h1>Thermostat battery replacement</h1>\n<p>Draft: the battery steps are being checked.</p>",
        false
    ],
    [
        retailSpace,
        "help/es",
        "Thermostat temperatura incorrecta",
        "<h1>El termostato marca una temperatura incorrecta</h1>\n<p>Un termostato nuevo puede marcar hasta tres grados de más el primer día.</p>\n" +
            "<p>Si sigue igual, abra Ajustes, elija Calibrar e introduzca la temperatura de un termómetro.</p>",
        true
    ],
    [
        serviceSpace,
        "",
        "Thermostat calibration offset",
        "# Thermostat calibration offset\n\nInternal: units from the October batch read 3 degrees high. Offer a calibration first; " +
            "replace under warranty when the offset is over 5 degrees.\n",
        true
    ]
]
const sources = [
    {wikiSpaceId: retailSpace, pagePathPrefix: "help", audienceEnumId: "SkaCustomer", localeLanguage: "en", sequenceNum: 1},
    {wikiSpaceId: retailSpace, pagePathPrefix: "help/es", audienceEnumId: "SkaCustomer", localeLanguage: "es", sequenceNum: 2},
    {wikiSpaceId: serviceSpace, pagePathPrefix: null, audienceEnumId: "SkaInternal", localeLanguage: "en", sequenceNum: 5}
]

function ensureServiceSpace() {
    if (one("moqui.resource.wiki.WikiSpace", {wikiSpaceId: serviceSpace})) return
    call(W + "create#WikiSpace", {
        wikiSpaceId: serviceSpace,
        description: "Ziziwork Retail service desk notes",
        restrictView: "N",
        restrictUpdate: "N"
    })
}
function ensureArticle([wikiSpaceId, parentPath, pageName, pageText, publish]) {
    const pagePath = (parentPath ? parentPath + "/" : "") + pageName
    let page = find("moqui.resource.wiki.WikiPage", {wikiSpaceId, pagePath}).one()
    if (!page) {
        const out = call(W + "update#WikiPage", {
            wikiSpaceId,
            parentPath,
            pageName,
            wikiType: wikiSpaceId === retailSpace ? "html" : "md",
            pageText,
            versionNote: "Customer Service demo"
        })
        page = one("moqui.resource.wiki.WikiPage", {wikiPageId: out.wikiPageId})
        if (publish) call(W + "set#PublishedVersion", {wikiPageId: out.wikiPageId, publishedVersionName: out.versionName})
    }
    return page
}
function ensureSource(source) {
    const current = rows("mantle.request.support.ServiceKnowledgeSource", {
        organizationPartyId,
        wikiSpaceId: source.wikiSpaceId
    }).filter(row => (row.pagePathPrefix || null) === source.pagePathPrefix && !row.thruDate)
    if (current.length) return
    call(
        K + "save#ServiceKnowledgeSource",
        Object.assign(
            {organizationPartyId, reviewTeamPartyId: team, draftWikiSpaceId: serviceSpace, draftParentPath: "drafts"},
            source
        )
    )
}
function ensureFeedback() {
    const page = find("moqui.resource.wiki.WikiPage", {
        wikiSpaceId: retailSpace,
        pagePath: "help/Thermostat reads the wrong temperature"
    }).one()
    if (!page || rows("mantle.request.support.ArticleFeedback", {wikiPageId: page.wikiPageId}).length) return
    for (const [helpful, comment] of [
        ["N", "Joe's reads three degrees high after a week: the article should say what to do then."],
        ["Y", "Calibrating fixed it."]
    ])
        call(K + "record#ArticleFeedback", {wikiPageId: page.wikiPageId, helpful, comment, requestId: "BOSS_CS_CASE_THERMO"})
}

function load() {
    return asDemoAdministrator(() => {
        const errors = []
        const step = name => {
            try {
                lib.probe("ironstone.customerservice.DemoServices.run#KnowledgeDemoStep", {step: name})
            } catch (error) {
                ec.logger.error("Customer Service demo knowledge " + name + " was not made: " + error.message)
                errors.push(name + ": " + error.message)
            }
        }
        step("space")
        articles.forEach((article, index) => step("article" + index))
        sources.forEach((source, index) => step("source" + index))
        step("feedback")
        if (errors.length) ec.logger.error("Customer Service demo knowledge: " + errors.join("; "))
        return {complete: errors.length === 0, errors}
    })
}
// one step in its own transaction (DemoServices.run#KnowledgeDemoStep)
function runStep(p) {
    const name = String(p.step || "")
    if (name === "space") return ensureServiceSpace()
    if (name === "feedback") return ensureFeedback()
    const article = /^article(\d+)$/.exec(name)
    if (article && articles[Number(article[1])]) return ensureArticle(articles[Number(article[1])])
    const source = /^source(\d+)$/.exec(name)
    if (source && sources[Number(source[1])]) return ensureSource(sources[Number(source[1])])
    throw new Error("Unknown knowledge demo step " + name)
}

const operations = {load, runStep}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Customer Service knowledge demonstration operation " + op)
        return asDemoAdministrator(() => operations[op](parameters))
    }
})
