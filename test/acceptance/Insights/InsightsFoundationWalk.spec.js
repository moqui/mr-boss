// Insights P1's "usable when" (impl-insights P1), as an acceptance walk with artifact authorization on: the menu renders for each
// group and each entry of it opens (P7 replaced the last copied screen, so every entry is every user's); insights.reader opens Insights but not the
// report builder; a Projects client and a PASS public account are refused the root and every ironstone.insights service. The
// rules themselves are InsightsAccess's.
// Run: ./moq accept mr-boss --spec InsightsFoundationWalk
const lib = ec.resource.script("component://mr-boss/test/Insights/InsightsSpecLib.js")
const {ids, users, asUser, refusal, shell} = lib
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
// every ironstone.insights service a screen calls, with parameters it accepts from a user who has Insights
const insightsServices = [["ironstone.insights.ContextServices.get#Context", {}]]
const groupUsers = [
    users.reader,
    users.author,
    users.steward,
    users.distributor,
    users.flow,
    users.admin,
    users.services,
    users.finance
]

feature("the menu renders for each group and each of its entries opens", {
    when() {
        const problems = []
        for (const user of groupUsers.concat([users.system])) {
            const found = shell(user, user === users.system)
            if (found.status != 200 || !found.names.includes("Home"))
                problems.push(`${user}'s menu: ${found.status} ${found.names}`)
            for (const entry of ids.readerMenu) {
                const expected = found.names.includes(entry)
                const rendered = asUser(user, () => lib.page(entry, {}, "html"))
                if (opened(rendered) !== expected)
                    problems.push(`${user} ${expected ? "is refused" : "opens"} ${entry}: ${rendered.status} ${rendered.errors}`)
            }
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("insights.reader opens Home but not the report builder, its dataset screens or its transitions", {
    when() {
        const problems = []
        const home = asUser(users.reader, () => lib.page("Home", {}, "html"))
        // P5's Home: the reader reads it (not the "shown to Insights readers" notice), with no dashboard of their own yet
        if (
            !opened(home) ||
            home.output.includes("Dashboards and reports are shown to Insights readers.") ||
            !home.output.includes("Dashboards you star or open show here.")
        )
            problems.push(`the reader's Home: ${home.status} ${home.errors}`)
        // Report builder › Explore is every Insights user's since P2; the dataset screens (P3) the author's and steward's
        for (const path of [
            "ReportBuilder/Datasets",
            "ReportBuilder/DatasetDetail",
            "ReportBuilder/DatasetFields",
            "ReportBuilder/DatasetView",
            "ReportBuilder/Datasets/createDataset",
            "ReportBuilder/DatasetDetail/admitDataset"
        ]) {
            const rendered = asUser(users.reader, () => lib.page(path, {datasetId: "boss-service-clocks"}, "html"))
            if (opened(rendered)) problems.push(`the reader opens ${path}`)
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("a Projects client and a PASS public account are refused the root and every ironstone.insights service", {
    when() {
        const problems = []
        for (const user of [users.client, users.pass]) {
            for (const path of ["Home", "ReportBuilder/Datasets"]) {
                const rendered = asUser(user, () => lib.page(path, {}, "html"))
                if (opened(rendered)) problems.push(`${user} opens ${path}`)
            }
            for (const [service, parameters] of insightsServices) {
                const message = asUser(user, () => refusal(service, parameters))
                if (!/INSIGHTS_UNAVAILABLE|is not authorized/.test(message))
                    problems.push(`${user} gets ${service}: ${message || "accepted"}`)
            }
            if (shell(user).apps.includes("Insights")) problems.push(`${user}'s launcher has Insights`)
        }
        // the same services answer an Insights reader, so the refusals above are for the user
        for (const [service, parameters] of insightsServices) {
            const message = asUser(users.reader, () => refusal(service, parameters))
            if (message !== "") problems.push(`the reader is refused ${service}: ${message}`)
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})
