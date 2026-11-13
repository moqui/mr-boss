// Sales reports (screen/Sales/Reports): the order analysis's average, margin and margin percent are decimal arithmetic in its
// form-list fields, evaluated on each row; one html render over the demo orders of every date shows them, to a holder of report
// read (ADMIN), who is shown the cost and margin columns a Sales report reader without PRODUCT_COST_VIEW is not (impl-sales P1;
// the reader's side is SalesAccess's render of SalesSummary). The Sales administrator's one csv export of it (no cost rights;
// SALES_ALL_ORGANIZATIONS and the root's MANTLE_ACTIVE_ORG, every organization while none is active) searches and sorts by the
// hidden cost and gets every organization's rows of no cost search, without the cost columns (Sales P1 review: the ported find
// took totalCost_from as a having condition, a test of the hidden costs).
// Run: ./moq test mr-boss --spec SalesReports
const webroot = "component://webroot/screen/webroot.xml"
const {asUser, page} = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")

spec({
    setupSpec() {
        login("john.doe")
    }
})

feature("SalesAnalysis renders its rows with the average, margin and margin percent", {
    when() {
        const str = ec.screen
            .makeTest()
            .rootScreen(webroot)
            .renderMode("html")
            .render("apps/Sales/Reports/SalesAnalysis", {placedDate_from: "2000-01-01", placedDate_thru: "2100-01-01"}, null)
        const output = String(str.output || "")
        const errors = str.errorMessages.join(" | ")
        ec.message.clearErrors()
        return {output, errors}
    },
    then({output, errors}) {
        errors == ""
        !/Error rendering|Exception in render/.test(output)
        output.includes("Margin Percent")
    }
})

feature("the Sales administrator without cost rights reads every organization's analysis, neither seeing nor searching cost", {
    when() {
        return asUser("sales.admin", () =>
            page(
                "Reports/SalesAnalysis",
                {
                    placedDate_from: "2000-01-01",
                    placedDate_thru: "2100-01-01",
                    totalCost_from: "999999999",
                    orderByField: "-totalCost"
                },
                "csv"
            )
        )
    },
    then({status, output, errors}) {
        status == 200
        errors.length == 0
        output.startsWith("Prod ID,")
        !output.includes("Total Cost")
        !output.includes("Margin")
        // every organization's rows, of one the administrator does not work for too (Accounting's demo company), which a cost
        // search over a billion would have left out
        output.includes("ZIRET")
        output.includes("ACCTDEMO")
    }
})
