// The Warehouse Today source (design-warehouse §1 shell providers, impl-warehouse F42): the work assigned to the user in
// their facilities, as items of the shell's Today. Each source of the table answers its items; one that fails is logged and
// the others are shown. P10 built this (P8, which the plan gave it to, was not built yet) with the assigned counts; P8 added
// the inspections whose inspector the user is, and P11 the loads still open from an earlier day, each a source here. The
// same items are Home's Your work (workRows, P17), so a source added here shows in both.
const warehouse = ec.resource.script("component://mr-boss/service/ironstone/warehouse/Warehouse.js")
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const {ms} = lib

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
// Home's Your work (design §3 MyWork): every Today item as a row with its document, step, due day and exception (overdue
// when due before today in the user's zone).
const steps = {warehouseCount: "Count", warehouseInspection: "Inspect", warehousePick: "Pick"}
function workRows() {
    const today = ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
    return todayItems({}).items.map(item => {
        const dueDay = item.dueDate ? lib.bookDay(null, item.dueDate) : ""
        return {
            title: item.title,
            url: item.url,
            step: item.step || steps[item.kind] || "",
            dueText: dueDay,
            exceptionText: dueDay && dueDay < today ? "Overdue" : ""
        }
    })
}
const operations = {todayItems, workRows}
;({
    execute(op, parameters) {
        if (!operations[op]) throw new Error("Unknown Warehouse today operation " + op)
        return operations[op](parameters)
    }
})
