// The Warehouse Today source (design-warehouse §1 shell providers, impl-warehouse F42): the work assigned to the user in
// their facilities, as items of the shell's Today. Each source of the table answers its items; one that fails is logged and
// the others are shown. P10 built this (P8, which the plan gave it to, was not built yet) with the assigned counts; P8 added
// the inspections whose inspector the user is, and P11 the loads still open from an earlier day, each a source here.
const warehouse = ec.resource.script("component://mr-boss/service/ironstone/warehouse/Warehouse.js")
const {ms} = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")

const sources = {
    counts: () => ec.resource.script("component://mr-boss/service/ironstone/warehouse/Counts.js").execute("todayCounts", {}),
    // P11: the user's loads still open from an earlier day (F42)
    loads: () => ec.resource.script("component://mr-boss/service/ironstone/warehouse/Picking.js").execute("todayLoads", {}),
    // P8: the open inspections whose inspector the user is
    inspections: () =>
        ec.resource.script("component://mr-boss/service/ironstone/warehouse/Inspections.js").execute("todayInspections", {})
}
// the fields every Today item carries (get#UserTodayItems)
const base = {
    workEffortId: null,
    requestId: null,
    dueDate: null,
    startDate: null,
    endDate: null,
    allDay: false,
    priority: null,
    statusId: null,
    assignees: [],
    canUpdate: false,
    hasCallLink: false
}
// The items for the current user (Today asks for its own user; another userId gets none), due by thruDate when given; an
// item with no date, or one due before fromDate (overdue), still shows.
function todayItems(p) {
    if (!warehouse.scope().read || (p.userId && p.userId !== ec.user.userId)) return {items: [], label: "Warehouse"}
    const thru = p.thruDate ? ms(p.thruDate) : null
    const items = []
    for (const [name, source] of Object.entries(sources)) {
        try {
            for (const item of source()) {
                const due = item.dueDate ? ms(item.dueDate) : null
                if (thru != null && due != null && due > thru) continue
                items.push(Object.assign({}, base, item))
            }
        } catch (error) {
            ec.logger.error("Warehouse Today source " + name + ": " + error.message)
        }
    }
    return {items, label: "Warehouse"}
}
;({
    execute(op, parameters) {
        if (op !== "todayItems") throw new Error("Unknown Warehouse today operation " + op)
        return todayItems(parameters)
    }
})
