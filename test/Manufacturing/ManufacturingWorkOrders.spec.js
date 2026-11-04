// Manufacturing's work orders (impl-manufacturing P5a's "usable when"; design-manufacturing WorkOrders, NewWorkOrder,
// WorkOrderDetail): a planner reviews a draft of DEMO_1_1 from the released demo BOM with what is producible now, creates and
// releases it; a short run waits for a supervisor's staged release, a board move runs the same guard and a bulk release names
// the blocked run; a released run held before start resumes as released, an unrelease after an issue is refused and an
// unposted draft is cancelled; Product360's Open runs link, the palette and record links open the work order. The screens
// render as the demo users with artifact authorization enabled; the Mantle verbs run as the screens run them, after the
// record check, with the screens' inherited authorization (artifact authorization off, F-P3-2).
// Run: ./moq test mr-boss --spec ManufacturingWorkOrders
const lib = ec.resource.script("component://mr-boss/test/Manufacturing/ManufacturingSpecLib.js")
const {ids, users, asUser, system, refusal, invoke} = lib
const P = "mantle.work.ProductionServices."
const asService = (user, action) => asUser(user, action, false)
const state = {}
let keySeq = 0
const key = () => "spec-wo-" + Date.now() + "-" + ++keySeq
const runOf = workEffortId => system(() => ec.entity.find("mantle.work.effort.WorkEffort").condition({workEffortId}).one())
const revisionOf = workEffortId => Number(runOf(workEffortId).productionRevision || 0)
function draft(quantity) {
    return asService(users.plan, () =>
        invoke(P + "create#ProductionOrder", {
            operationKey: key(),
            organizationPartyId: "ORG_ZIZI_RETAIL",
            productId: ids.productId,
            // the demo method (other specs may release more methods of DEMO_1_1)
            productBomId: ids.methodId,
            quantity,
            facilityId: ids.lineId
        })
    ).workEffortId
}
// an action as the Lifecycle dialog posts it; "" when it succeeds, else the refusal
const act = (user, workEffortId, action, extra = {}) =>
    asService(user, () =>
        refusal(
            P + "transition#ProductionOrder",
            Object.assign({operationKey: key(), workEffortId, action, expectedRevision: revisionOf(workEffortId)}, extra)
        )
    )
// a board move as the WorkOrders board's moveCard posts it, after the run's record check
const move = (user, workEffortId, toStatusId) =>
    asService(user, () => {
        const checked = refusal("ironstone.manufacturing.AccessServices.check#Record", {
            recordType: "run",
            recordId: workEffortId
        })
        if (checked) return checked
        return refusal(P + "transition#ProductionOrder", {
            operationKey: key(),
            workEffortId,
            toStatusId,
            expectedRevision: revisionOf(workEffortId)
        })
    })

spec({
    setupSpec() {
        // stock of the demo method's components at Retail's plant, so a small run is covered and a large one short
        system(() => {
            for (const productId of ["DEMO_SA_1", "DEMO_SA_2", "DEMO_RM_1"])
                state[productId] = ec.service
                    .sync()
                    .name("mantle.product.AssetServices.receive#Asset")
                    .parameters({
                        productId,
                        quantity: 40,
                        facilityId: ids.plantId,
                        ownerPartyId: "ORG_ZIZI_RETAIL",
                        assetTypeEnumId: "AstTpInventory",
                        statusId: "AstAvailable",
                        acquireCost: 1
                    })
                    .call().assetId
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("a planner reviews a draft of DEMO_1_1 with what is producible now, creates it and releases it", {
    when() {
        const review = asUser(users.plan, () =>
            lib.page(
                "WorkOrders/NewWorkOrder",
                {step: "review", productId: ids.productId, productBomId: ids.methodId, quantity: "2", facilityId: ids.lineId},
                "html"
            )
        )
        const workEffortId = draft(2)
        const detail = asUser(users.plan, () => lib.page("WorkOrders/WorkOrderDetail", {workEffortId}, "html"))
        const released = act(users.plan, workEffortId, "release")
        const operations = asUser(users.read, () =>
            lib.page("WorkOrders/WorkOrderDetail/Operations", {workEffortId, lastStandalone: "true"}, "html")
        )
        const list = asUser(users.read, () => lib.page("WorkOrders/Find", {ready: "Y"}, "html"))
        const traveler = asUser(users.read, () =>
            lib.page("WorkOrders/WorkOrderDetail/Traveler", {workEffortId, lastStandalone: "true"}, "html")
        )
        const picks = asUser(users.read, () =>
            lib.page("WorkOrders/WorkOrderDetail/PickSheet", {workEffortId, lastStandalone: "true"}, "html")
        )
        const notices = system(() =>
            Array.from(
                ec.entity
                    .find("moqui.security.user.NotificationMessage")
                    .condition({topic: "ProductionRelease", recordId: workEffortId})
                    .list()
            )
        )
        return {review, workEffortId, detail, released, operations, list, traveler, picks, notices}
    },
    then({review, workEffortId, detail, released, operations, list, traveler, picks, notices}) {
        review.errors.length == 0
        review.output.includes("Producible now")
        review.output.includes("BOSS_MFG_BOM_PILOT")
        review.output.includes("Create draft")
        !!workEffortId
        detail.errors.length == 0
        detail.output.includes("Release")
        detail.output.includes("Lifecycle")
        released == ""
        runOf(workEffortId).statusId == "WeApproved"
        operations.errors.length == 0
        operations.output.includes("Ready")
        operations.output.includes("Waiting for")
        list.output.includes(workEffortId)
        traveler.output.includes("Traveler: work order " + workEffortId)
        traveler.output.includes("<svg")
        picks.output.includes("Pick sheet: work order " + workEffortId)
        notices.length == 1
    }
})

feature(
    "a short run waits for a supervisor's staged release; a board move runs the same guard; a bulk release names the blocked run",
    {
        when() {
            const short = draft(5000)
            const boardRefused = move(users.plan, short, "WeApproved")
            const generic = move(users.plan, short, "WeComplete")
            const approved = act(users.supervise, short, "approveStaged")
            const boardReleased = move(users.plan, short, "WeApproved")
            const runs = [draft(1), draft(5000), draft(1)]
            const bulk = asService(users.plan, () =>
                invoke(P + "batch#ProductionAction", {operationKey: key(), action: "release", workEffortIds: runs})
            )
            return {short, boardRefused, generic, approved, boardReleased, runs, bulk}
        },
        then({short, boardRefused, generic, approved, boardReleased, runs, bulk}) {
            boardRefused.includes("SHORTAGE")
            generic.includes("TRANSITION_INVALID")
            approved == ""
            boardReleased == ""
            runOf(short).statusId == "WeApproved"
            bulk.successCount == 2
            bulk.blockedCount == 1
            bulk.results.find(row => row.workEffortId === runs[1]).reasonCode == "SHORTAGE"
        }
    }
)

feature("a released run held before start resumes as released; an unrelease after an issue is refused; a draft is cancelled", {
    when() {
        const workEffortId = draft(1)
        act(users.plan, workEffortId, "release")
        const held = act(users.supervise, workEffortId, "hold", {reasonCode: "MATERIAL_HOLD"})
        const heldStatus = runOf(workEffortId).statusId
        const resumed = act(users.supervise, workEffortId, "resume")
        const resumedStatus = runOf(workEffortId).statusId
        // an issue is a fact of the run (the stock guards are MaterialIssueReceipt's; the fact alone is enough here)
        system(() =>
            ec.service
                .sync()
                .name("create#mantle.product.issuance.AssetIssuance")
                .parameters({
                    workEffortId,
                    assetId: state[ids.componentId],
                    productId: ids.componentId,
                    quantity: 1,
                    issuedDate: ec.user.nowTimestamp
                })
                .call()
        )
        const unrelease = act(users.plan, workEffortId, "unrelease")
        const cancelled = draft(1)
        const cancel = act(users.supervise, cancelled, "cancel", {reason: "Demand withdrawn"})
        return {held, heldStatus, resumed, resumedStatus, unrelease, cancelled, cancel}
    },
    then({held, heldStatus, resumed, resumedStatus, unrelease, cancelled, cancel}) {
        held == ""
        heldStatus == "WeOnHold"
        resumed == ""
        resumedStatus == "WeApproved"
        unrelease.includes("RUN_HAS_FACTS")
        cancel == ""
        runOf(cancelled).statusId == "WeCancelled"
    }
})

feature("Product360's Open runs link, the palette and record links open the work orders", {
    when() {
        const workEffortId = draft(1)
        // as the administrator: Product360 needs Products' catalog read, which the Manufacturing groups lack (F-P5a-3)
        const product = asUser("john.doe", () => lib.page("BillsOfMaterials/Product360", {productId: ids.productId}))
        const byProduct = asService(users.read, () => invoke(P + "find#ProductionOrders", {productId: ids.productId}))
        const search = asUser(users.read, () =>
            invoke("ironstone.manufacturing.AccessServices.search#Records", {text: workEffortId, limit: 5}).rows.map(
                row => row.url
            )
        )
        const link = asUser(users.read, () =>
            invoke("ironstone.commons.PaletteServices.get#RecordLink", {
                recordEntityName: "mantle.work.effort.WorkEffort",
                id: workEffortId
            })
        ).url
        return {workEffortId, product, byProduct, search, link}
    },
    then({workEffortId, product, byProduct, search, link}) {
        product.errors.length == 0
        product.output.includes("Open runs")
        byProduct.orderRows.some(row => row.workEffortId === workEffortId)
        byProduct.orderRows.every(row => row.productId === ids.productId)
        search.includes("/qapps/Manufacturing/WorkOrders/WorkOrderDetail?workEffortId=" + workEffortId)
        link == "/qapps/Manufacturing/WorkOrders/WorkOrderDetail?workEffortId=" + workEffortId
    }
})
