// Maintenance parts and stock in BOSS (impl-maintenance P9; design-maintenance §3 PlannedParts, PartsUsed, the MaterialIssueReceipt
// and InventoryAvailability mount rows, "Charging a project"): WorkOrderDetail's Parts tab rendered once in qvt (the air handler's
// planned gasket, what was issued, used and returned, Add part for the planner), Shared/MaterialIssueReceipt in Maintenance's
// context rendered once (the work order's lines with Issue for the assigned technician with the stock grant, Return unused and
// History), Shared/InventoryAvailability under Maintenance rendered once (the part's stock in Services' warehouse only), the model's
// suggested part and the charge's choices. The rules are Mantle's MaintenanceMaterials and MaintenanceExpenseRouting; the access case
// is MaintenanceAccess's; the "usable when" is the acceptance MaintenancePartsWalk.
// Run: ./moq test mr-boss --spec MaintenanceParts
const lib = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
const {ids, users, asUser, invoke, page} = lib

spec({
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("the Parts tab shows the planner the planned gasket with what was issued, used and returned", {
    when() {
        return asUser(users.planner, () =>
            page("WorkOrders/WorkOrderDetail/Parts", {workEffortId: ids.inProgressOrderId, lastStandalone: "true"})
        )
    },
    then(rendered) {
        rendered.errors.length == 0
        rendered.output.includes("Planned parts · 1")
        rendered.output.includes("AHU-2 coil gasket")
        rendered.output.includes("Add part")
        rendered.output.includes("Returned")
        rendered.output.includes("Used, net of returns")
        // the planner holds no stock grant: issuing is not offered, and no value without cost read
        !rendered.output.includes("Issue and return")
        !rendered.output.includes("19.50")
    }
})

feature("MaterialIssueReceipt in Maintenance gives the assigned technician Issue, Return unused and History", {
    when() {
        return asUser(users.tech, () =>
            page("WorkOrders/MaterialIssueReceipt", {workEffortId: ids.inProgressOrderId, lastStandalone: "true"})
        )
    },
    then(rendered) {
        rendered.errors.length == 0
        rendered.output.includes("Parts of work order " + ids.inProgressOrderId)
        rendered.output.includes("Issue part")
        rendered.output.includes("Services stock warehouse")
        rendered.output.includes("Unused returns ·")
        rendered.output.includes("Return unused")
        rendered.output.includes("Issues and returns")
        rendered.output.includes("One gasket left over")
        // no production output or tracking in Maintenance
        !rendered.output.includes("Tracking ·")
    }
})

feature("a part's stock under Maintenance lists the facilities of the user's organizations that hold stock", {
    when() {
        return asUser(users.planner, () =>
            page("WorkOrders/InventoryAvailability", {productId: ids.gasketId, lastStandalone: "true"})
        )
    },
    then(rendered) {
        rendered.errors.length == 0
        // the Summary tab: Services' warehouse, not Retail's
        rendered.output.includes("Services stock warehouse")
        !rendered.output.includes("Retail East Warehouse")
    }
})

feature("the compressor's work suggests its model's other spare part; the charge's choices are the organization's", {
    when() {
        return asUser(users.planner, () => {
            ec.artifactExecution.disableAuthz()
            const parts = invoke("mantle.work.MaintenanceExecutionServices.get#MaintenanceMaterials", {
                workEffortId: ids.plannedOrderId
            })
            const choices = choice =>
                Array.from(
                    invoke("ironstone.maintenance.ContextServices.get#Choices", {choice, organizationPartyId: ids.organizationId})
                        .options || []
                ).map(row => row.value)
            const otherChoices = Array.from(
                invoke("ironstone.maintenance.ContextServices.get#Choices", {
                    choice: "costCenters",
                    organizationPartyId: ids.otherOrganizationId
                }).options || []
            )
            return {parts, costCenters: choices("costCenters"), otherChoices}
        })
    },
    then({parts, costCenters, otherChoices}) {
        parts.plannedList.length == 1 && parts.plannedList[0].productId == "BOSS_MNT_PART_FILTER"
        parts.suggestedList.map(row => row.productId).join() == "BOSS_MNT_PART_BELT"
        parts.canPlan === true && parts.canIssue === false
        costCenters.includes(ids.organizationId)
        otherChoices.length == 0
    }
})
