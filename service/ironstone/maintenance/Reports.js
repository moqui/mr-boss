// Maintenance's reports catalogue (impl-maintenance P17; design-maintenance §8 Reports, design-insights §6.1): the reports Maintenance
// owns that the user may read, in Insights' catalog contract (entry id, the owner app, title, description, route, export), for
// Insights' catalog (ReportCatalogEntry.catalogueService) and Maintenance's Reports landing alike. Work status and PM compliance
// are a maintenance reader's (MAINTENANCE_VIEW); the cost report (impl-maintenance P11) the cost reader's alone
// (MAINTENANCE_COST_VIEW), as its screen is (BOSS_MNT_COSTS) and Mantle's get#MaintenanceCosts. A user who reads no maintenance work is refused (PERMISSION_DENIED), which Insights takes as a
// user without the app and hides its entries. Mantle's report services check the permission and the scope again.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const maintenanceAccess = ec.resource.script("component://mr-mantle/service/mantle/work/MaintenanceAccess.js")
const {denied} = lib

const entries = [
    {
        entryId: "Maintenance.WorkStatus",
        title: "Work status",
        description:
            "Work orders opened, completed and cancelled in a period, and the backlog, overdue and unassigned at its end.",
        path: "Reports/WorkStatusReport",
        read: can => can.view,
        exports: true
    },
    {
        entryId: "Maintenance.PreventiveCompliance",
        title: "PM compliance",
        description: "Preventive obligations due in a period, each on time, late, outstanding, skipped or unknown.",
        path: "Reports/PreventiveComplianceReport",
        read: can => can.view,
        exports: true
    },
    {
        entryId: "Maintenance.Cost",
        title: "Maintenance costs",
        description: "Parts, labor and outside service of the work orders, each source once, by currency; unpriced hours apart.",
        path: "Reports/MaintenanceCostReport",
        read: can => can.view && can.costView,
        exports: true
    }
]

function catalogue(p) {
    if (p.appRoot && p.appRoot !== "Maintenance") denied("MAINTENANCE_CONTEXT", "Maintenance context is not available")
    if (!ec.user.userId) denied("PERMISSION_DENIED", "Sign in to read maintenance reports")
    const can = maintenanceAccess.capabilities()
    if (!can.view) denied("PERMISSION_DENIED", "Maintenance view is required")
    return {
        reports: entries
            .filter(entry => entry.read(can))
            .map(entry => ({
                entryId: entry.entryId,
                ownerApp: "Maintenance",
                title: entry.title,
                description: entry.description,
                path: entry.path,
                url: "/qapps/Maintenance/" + entry.path,
                exports: entry.exports,
                exportText: entry.exports ? "CSV" : ""
            }))
    }
}

const operations = {catalogue}
;({
    execute: (op, parameters) => {
        if (!Object.hasOwn(operations, op)) throw new Error("Unknown Maintenance report operation " + op)
        return operations[op](parameters || {})
    }
})
