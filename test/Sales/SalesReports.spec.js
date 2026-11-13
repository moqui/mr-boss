// Sales reports (screen/Sales/Reports): the order analysis's average, margin and margin percent are decimal arithmetic in its
// form-list fields, evaluated on each row; one html render over the demo orders of every date shows them, to a holder of report
// read (ADMIN), who is shown the cost and margin columns a Sales report reader without PRODUCT_COST_VIEW is not (impl-sales P1;
// the reader's side is SalesAccess's render of SalesSummary).
// Run: ./moq test mr-boss --spec SalesReports
const webroot = "component://webroot/screen/webroot.xml"

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
