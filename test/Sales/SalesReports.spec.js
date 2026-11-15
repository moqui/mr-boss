// Sales reports (screen/Sales/Reports; impl-sales P19): each rebuilt screen's one html render over Mantle's services, with all its
// checks on that render. Sales analysis over run#SalesAnalysis for every date of the demo orders, as a holder of report read (ADMIN),
// who is shown the finance columns (cost of shipped, margin) Mantle answers them; the Sales administrator's csv export of it (no cost
// rights) carries no cost or margin column and no cost search (P1 review R1: the ported screen read OrderItemSalesSummary itself and
// took totalCost from the request; the rebuilt one reads no entity and passes no cost parameter). Pipeline analysis and Win/loss as
// the report reader, with their options and lists. Mantle's rules are tested in mr-mantle (SalesPipelineReports, SalesReports).
// Run: ./moq test mr-boss --spec SalesReports
const {ids, asUser, page} = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const allDates = {organizationPartyId: ids.organizationId, fromDate: "2000-01-01", thruDate: "2100-01-01"}

spec({
    setupSpec() {
        login("john.doe")
    }
})

feature("SalesAnalysis renders run#SalesAnalysis's rows with the finance columns for a report reader", {
    when() {
        return page("Reports/SalesAnalysis", allDates, "html")
    },
    then({errors, output}) {
        errors.length == 0
        output.includes("Net invoiced")
        output.includes("Shipped value")
        output.includes("Cost of shipped")
        output.includes("Margin %")
        !output.includes("Show SQL")
    }
})

feature("the Sales administrator without cost rights exports the analysis with no cost or margin column", {
    when() {
        return asUser("sales.admin", () =>
            page(
                "Reports/SalesAnalysis",
                Object.assign({totalCost_from: "999999999", orderByField: "-totalCost"}, allDates),
                "csv"
            )
        )
    },
    then({status, output, errors}) {
        status == 200
        errors.length == 0
        output.includes("Ordered value")
        !output.includes("Cost of shipped")
        !output.includes("Margin")
    }
})

feature("Pipeline analysis and Win/loss render for the report reader with their measures and lists", {
    when() {
        return asUser("sales.reader", () => ({
            pipeline: page("Reports/PipelineAnalysis", {organizationPartyId: ids.organizationId, groupBy: "source"}, "html"),
            winLoss: page(
                "Reports/WinLoss",
                {organizationPartyId: ids.organizationId, fromDate: "2000-01-01", thruDate: "2100-01-01"},
                "html"
            )
        }))
    },
    then({pipeline, winLoss}) {
        pipeline.errors.length == 0
        pipeline.output.includes("Pipeline by source")
        pipeline.output.includes("Time in each stage")
        pipeline.output.includes("Funnel of the lead cohort")
        // the funnel's visit step is Marketing's visits (impl-marketing P20): a count, no longer "Not available"
        pipeline.output.includes("Visits")
        winLoss.errors.length == 0
        winLoss.output.includes("Final outcome as of the report time")
        winLoss.output.includes("Win rate")
        winLoss.output.includes("Loss reasons")
    }
})
