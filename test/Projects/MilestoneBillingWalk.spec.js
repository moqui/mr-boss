// The usable-when walk of IronStone Projects P8b (impl-projects.md P8; design-projects.md §4 ProjectMoney and MilestoneDetail, §10 OrderDetail,
// Unbilled's Milestones due and InvoiceDetail, §14 the estimate) through the screens' transitions, with authorization on: in a project of its
// own (MBW, john.doe its manager, joe.developer a programmer, a client of its own whose manager has no user, Ziziwork Services its vendor), in
// July 2027: john.doe links the client's order line on the Money tab, prints the estimate and sends it for approval (the Estimate milestone
// and its gate, the order a quote, the Roadmap's Awaiting approval); he records the client's approval on the milestone, and the project and
// its order are approved. Two milestones share the order line (Design 25%, Delivery 75%); Design's gate goes to the client, joe asks for its
// approval, john.doe records it and Design is reached; joe's approved week and Design's share become one client invoice with its time
// detail (Unbilled's Milestones due, the invoice dialog, InvoiceDetail's milestone line, the print); the Money tab shows it all, the
// OrderDetail the share billed; joe may not see the money. The project and its invoices are cancelled after.
// Run: ./moq test mr-boss --spec MilestoneBillingWalk
const webroot = "component://webroot/screen/webroot.xml"
const PROJECT = "MBW"
const CLIENT = "MBW_CLIENT"
const CONTACT = "MBW_CONTACT"
const at = (day, hour, minute) => Number(String(ec.l10n.parseTimestamp(`2027-07-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:${String(minute || 0).padStart(2, "0")}:00.000`,
        "yyyy-MM-dd HH:mm:ss.SSS")))
const NOW = at(16, 10)
const made = {}

function render(path, parameters, mode) {
    const str = ec.screen.makeTest().rootScreen(webroot).renderMode(mode || "qvt").withStaticData().render(path,
            Object.assign({ lastStandalone: "true" }, parameters || {}), null)
    const output = String(str.output || "")
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), output, broken: /Error rendering|Exception in render/.test(output) }
}
function post(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(webroot).render("apps/Projects/" + path, parameters || {}, "post")
    const output = String(str.output || "")
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), output }
}
function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
function as(username, run) {
    login(username)
    ec.user.setEffectiveTime(NOW)
    try { return run() } finally { login("john.doe"); ec.user.setEffectiveTime(NOW) }
}
const one = (entityName, fields) => sys(() => ec.entity.find(entityName).condition(fields).one())
const statusOf = (workEffortId) => one("mantle.work.effort.WorkEffort", { workEffortId }).statusId
const dec = (value) => value == null ? null : String(toDecimal(value).setScale(2, "HALF_UP"))

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        ec.artifactExecution.enableAuthz()
        ec.user.setEffectiveTime(NOW)
        sys(() => {
            call("mantle.work.ProjectServices.create#Project", { workEffortId: PROJECT, workEffortName: "Milestone billing walk", visibilityEnumId: "WevWorkGroup" })
            call("update#mantle.work.effort.WorkEffort", { workEffortId: PROJECT, statusId: "WeInPlanning", ownerPartyId: "ORG_ZIZI_SERVICES", costUomId: "USD",
                totalTimeAllowed: 100, totalClientCostAllowed: 12000 })
            if (!ec.entity.find("mantle.party.Party").condition("partyId", CLIENT).count()) {
                call("create#mantle.party.Party", { partyId: CLIENT, partyTypeEnumId: "PtyOrganization" })
                call("create#mantle.party.Organization", { partyId: CLIENT, organizationName: "Walk Milestone Florist" })
                call("create#mantle.party.PartyRole", { partyId: CLIENT, roleTypeId: "Customer" })
                call("create#mantle.party.Party", { partyId: CONTACT, partyTypeEnumId: "PtyPerson" })
                call("create#mantle.party.Person", { partyId: CONTACT, firstName: "Flora", lastName: "Bloom" })
            }
            for (const [partyId, roleTypeId] of [["EX_JOHN_DOE", "ProjectManager"], ["ORG_ZIZI_JD", "Programmer"], ["ORG_ZIZI_SERVICES", "Vendor"], [CLIENT, "Customer"],
                    [CONTACT, "ClientManager"]])
                call("create#mantle.work.effort.WorkEffortParty", { workEffortId: PROJECT, partyId, roleTypeId, fromDate: "2027-06-01 00:00:00", statusId: "WeptAssigned" })
            const task = (name, hours, parent) => call("mantle.work.TaskServices.create#Task", { rootWorkEffortId: PROJECT, parentWorkEffortId: parent || null,
                workEffortName: name, estimatedWorkTime: hours }).workEffortId
            made.design = task("Shop design", null)
            made.pages = task("Product pages", 16, made.design)
            made.cart = task("Checkout", 24)
            call("mantle.humanres.RateServices.create#RateAmount", { workEffortId: PROJECT, ratePurposeEnumId: "RaprClient", rateTypeEnumId: "RatpStandard",
                timePeriodUomId: "TF_hr", rateCurrencyUomId: "USD", rateAmount: 150, fromDate: "2027-06-01 00:00:00" })
            made.orderId = call("mantle.order.OrderServices.create#Order", { customerPartyId: CLIENT, vendorPartyId: "ORG_ZIZI_SERVICES", currencyUomId: "USD",
                orderName: "Florist web shop" }).orderId
            const partSeq = ec.entity.find("mantle.order.OrderPart").condition("orderId", made.orderId).one().orderPartSeqId
            made.lineSeq = call("mantle.order.OrderServices.create#OrderItem", { orderId: made.orderId, orderPartSeqId: partSeq, itemTypeEnumId: "ItemServiceProduct",
                itemDescription: "Web shop, fixed fee", quantity: 1, unitAmount: 12000 }).orderItemSeqId
        })
    },
    cleanupSpec() {
        sys(() => {
            for (const link of ec.entity.find("mantle.work.effort.WorkEffortInvoice").condition("workEffortId", PROJECT).list()) {
                const invoice = ec.entity.find("mantle.account.invoice.Invoice").condition("invoiceId", link.invoiceId).one()
                if (invoice && invoice.statusId !== "InvoiceCancelled") call("update#mantle.account.invoice.Invoice", { invoiceId: invoice.invoiceId, statusId: "InvoiceCancelled" })
            }
            for (const rate of ec.entity.find("mantle.humanres.rate.RateAmount").condition("workEffortId", PROJECT).list()) { rate.thruDate = rate.fromDate; rate.update() }
            const project = ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortId", PROJECT).one()
            if (project) { project.statusId = "WeCancelled"; project.update() }
        })
        ec.user.setEffectiveTime(null)
    },
})

feature("john.doe links the client's order line on the Money tab; the tab shows the budget, the line and no milestone shares yet", {
    when() {
        const search = sys(() => call("ironstone.projects.BillingServices.search#OrderLines", { workEffortId: PROJECT, term: "" }))
        const linked = post("Projects/ProjectDetail/Money/linkOrderLine", { workEffortId: PROJECT, orderLine: made.orderId + ":" + made.lineSeq })
        const money = render("apps/Projects/Projects/ProjectDetail/Money", { workEffortId: PROJECT })
        return { search, linked, money, link: one("mantle.order.OrderItemWorkEffort", { orderId: made.orderId, orderItemSeqId: made.lineSeq, workEffortId: PROJECT }) }
    },
    then({ search, linked, money, link }) {
        search.optionList.some((option) => option.label.includes("Web shop, fixed fee"))
        linked.errors == ""
        link != null
        money.status == 200 && !money.broken
        money.output.includes("Budget and actuals")
        money.output.includes("Web shop, fixed fee")
        money.output.includes("$12,000.00")
        money.output.includes("No milestone releases a share")
        money.output.includes("Send estimate for approval")
    },
})

feature("the estimate printed and sent for approval: the Estimate milestone waits for the client's manager, the order is a quote, the Roadmap shows it awaiting", {
    when() {
        const print = render("apps/Projects/Projects/EstimatePrint", { workEffortId: PROJECT }, "html-print")
        const sent = post("Projects/ProjectDetail/Money/sendEstimate", { workEffortId: PROJECT, depth: "2", comments: "Our estimate for the shop" })
        made.estimateId = one("mantle.work.effort.WorkEffortSetting", { workEffortId: PROJECT, settingTypeEnumId: "WstEstimateMilestone" })?.settingValue
        const milestone = render("apps/Projects/Projects/MilestoneDetail", { workEffortId: made.estimateId })
        const roadmap = render("apps/Projects/Projects/Roadmap", { list: "awaiting", rootWorkEffortId: PROJECT })
        const order = render("apps/Projects/Billing/OrderDetail", { orderId: made.orderId })
        return { print, sent, milestone, roadmap, order, orderStatus: one("mantle.order.OrderHeader", { orderId: made.orderId }).statusId }
    },
    then({ print, sent, milestone, roadmap, order, orderStatus }) {
        print.output.includes("Product pages") && print.output.includes("Checkout")
        // 16 + 24 h at 150
        print.output.includes("$6,000.00")
        sent.errors == ""
        made.estimateId != null
        milestone.status == 200 && !milestone.broken
        milestone.output.includes("Waiting for approval")
        milestone.output.includes("Flora Bloom")
        milestone.output.includes("Our estimate for the shop")
        roadmap.output.includes("Awaiting approval")
        roadmap.output.includes("Estimate")
        orderStatus == "OrderProposed"
        order.status == 200 && !order.broken
        order.output.includes("Web shop, fixed fee")
        order.output.includes("The estimate waits for the client")
    },
})

feature("john.doe records the client's approval of the estimate: the Estimate is reached, the project and its order are approved", {
    when() {
        const approved = post("Projects/MilestoneDetail/decideGate", { workEffortId: made.estimateId, action: "approve", comments: "Flora said yes on the phone" })
        const request = sys(() => Array.from(ec.entity.find("mantle.work.effort.WorkEffortApproval").condition("workEffortId", made.estimateId).list())[0])
        return { approved, request, estimate: statusOf(made.estimateId), project: statusOf(PROJECT), order: one("mantle.order.OrderHeader", { orderId: made.orderId }).statusId }
    },
    then({ approved, request, estimate, project, order }) {
        approved.errors == ""
        request.statusId == "WeaApproved" && request.recordedFor == "Y"
        estimate == "WeComplete"
        project == "WeApproved"
        order == "OrderApproved"
    },
})

feature("two milestones share the order line on MilestoneDetail (Design 25%, Delivery 75%); Design's gate goes to the client's manager", {
    when() {
        sys(() => {
            call("update#mantle.work.effort.WorkEffort", { workEffortId: PROJECT, statusId: "WeInProgress" })
            made.msDesign = call("mantle.work.ProjectServices.create#Milestone", { rootWorkEffortId: PROJECT, workEffortName: "Design approved", statusId: "WeInProgress",
                estimatedCompletionDate: at(14, 17) }).workEffortId
            made.msDelivery = call("mantle.work.ProjectServices.create#Milestone", { rootWorkEffortId: PROJECT, workEffortName: "Shop delivered", statusId: "WeInProgress",
                estimatedCompletionDate: at(30, 17) }).workEffortId
        })
        const line = made.orderId + ":" + made.lineSeq
        const design = post("Projects/MilestoneDetail/saveShare", { workEffortId: made.msDesign, orderLine: line, shareKind: "percent", shareValue: "25" })
        const delivery = post("Projects/MilestoneDetail/saveShare", { workEffortId: made.msDelivery, orderLine: line, shareKind: "percent", shareValue: "75" })
        const over = post("Projects/MilestoneDetail/saveShare", { workEffortId: made.estimateId, orderLine: line, shareKind: "amount", shareValue: "100" })
        const gate = post("Projects/MilestoneDetail/decideGate", { workEffortId: made.msDesign, action: "gate", approvalRequired: "Y", approverPartyId: CONTACT })
        const deliverable = post("Projects/MilestoneDetail/saveDeliverable", { workEffortId: made.msDesign, deliverableName: "Shop designs", deliverableTypeEnumId: "DlvtDesign" })
        const reach = post("Projects/MilestoneDetail/changeStatus", { workEffortId: made.msDesign, statusId: "WeComplete" })
        const detail = render("apps/Projects/Projects/MilestoneDetail", { workEffortId: made.msDesign })
        return { design, delivery, over, gate, deliverable, reach, detail, status: statusOf(made.msDesign) }
    },
    then({ design, delivery, over, gate, deliverable, reach, detail, status }) {
        design.errors == "" && delivery.errors == "" && gate.errors == "" && deliverable.errors == ""
        over.errors.includes("pass its total")
        reach.errors.includes("needs approval before it is reached")
        status == "WeInProgress"
        detail.status == 200 && !detail.broken
        detail.output.includes("$3,000.00")
        detail.output.includes("Web shop, fixed fee")
        detail.output.includes("Needs approval to be reached")
        detail.output.includes("Shop designs")
        detail.output.includes("Ask for approval")
    },
})

feature("joe asks for Design's approval; he may not decide it; john.doe records the client's approval and Design is reached, its share due", {
    when() {
        const asked = as("joe.developer", () => post("Projects/MilestoneDetail/decideGate", { workEffortId: made.msDesign, action: "request", comments: "Designs on the drive" }))
        const joeDecides = as("joe.developer", () => post("Projects/MilestoneDetail/decideGate", { workEffortId: made.msDesign, action: "approve" }))
        const awaiting = render("apps/Projects/Projects/Roadmap", { list: "awaiting", rootWorkEffortId: PROJECT })
        const accepted = post("Projects/MilestoneDetail/deliverableState", { workEffortId: made.msDesign, action: "accept",
            deliverableId: sys(() => Array.from(ec.entity.find("mantle.work.effort.WorkEffortDeliverableProd").condition("workEffortId", made.msDesign).list())[0].deliverableId) })
        const approved = post("Projects/MilestoneDetail/decideGate", { workEffortId: made.msDesign, action: "approve" })
        const due = render("apps/Projects/Billing/Unbilled", { list: "milestones", rootWorkEffortId: PROJECT })
        return { asked, joeDecides, awaiting, accepted, approved, due, status: statusOf(made.msDesign) }
    },
    then({ asked, joeDecides, awaiting, accepted, approved, due, status }) {
        asked.errors == ""
        joeDecides.errors.includes("Only the approver")
        awaiting.output.includes("Design approved")
        accepted.errors == ""
        approved.errors == ""
        status == "WeComplete"
        due.status == 200 && !due.broken
        due.output.includes("Design approved")
        due.output.includes("$3,000.00")
        due.output.includes("Milestones due · 1")
    },
})

feature("joe's approved week and Design's share become one client invoice: the dialog offers both, InvoiceDetail shows the milestone line and the time", {
    when() {
        as("joe.developer", () => sys(() => {
            for (const [day, hours, comments] of [[12, 6, "Product page layout"], [13, 4, "Checkout form"]])
                call("mantle.work.TimeServices.store#TimeEntry", { partyId: "ORG_ZIZI_JD", workEffortId: made.cart, fromDate: at(day, 9), thruDate: at(day, 9) + hours * 3600000,
                    hours, comments, rateTypeEnumId: "RatpStandard", workTypeEnumId: "WktpDevelopment" })
            made.sheet = Array.from(ec.entity.find("mantle.work.time.TimeEntry").condition("workEffortId", made.cart).list())[0].timesheetId
            call("mantle.work.TimesheetServices.submit#Timesheet", { timesheetId: made.sheet })
        }))
        sys(() => call("mantle.work.TimesheetServices.approve#Timesheet", { timesheetId: made.sheet }))
        const dialog = render("apps/Projects/Billing/Unbilled/CreateInvoice", { workEffortId: PROJECT })
        const draft = sys(() => call("ironstone.projects.BillingServices.get#InvoiceDraft", { workEffortId: PROJECT }).draft)
        const created = post("Billing/Unbilled/CreateInvoice/createInvoice", { workEffortId: PROJECT, timeEntryIds: draft.selectedIds, milestoneIds: draft.selectedMilestoneIds,
            entryGrouping: "entry", settlementTermId: "Net30", invoiceDate: "2027-07-16" })
        made.invoiceId = sys(() => Array.from(ec.entity.find("mantle.work.effort.WorkEffortInvoice").condition("workEffortId", PROJECT).list())[0]?.invoiceId)
        const invoice = one("mantle.account.invoice.Invoice", { invoiceId: made.invoiceId })
        const detail = render("apps/Projects/Billing/InvoiceDetail", { invoiceId: made.invoiceId })
        const print = render("apps/Projects/Billing/InvoicePrint", { invoiceId: made.invoiceId }, "html-print")
        return { dialog, draft, created, invoice, detail, print }
    },
    then({ dialog, draft, created, invoice, detail, print }) {
        dialog.status == 200 && !dialog.broken
        dialog.output.includes("Milestones due")
        dialog.output.includes("Design approved")
        draft.selectedIds.length == 2 && draft.selectedMilestoneIds.length == 1
        created.errors == ""
        made.invoiceId != null
        invoice.toPartyId == CLIENT && invoice.fromPartyId == "ORG_ZIZI_SERVICES"
        // Design's 25% of 12,000 and 10 h at 150
        dec(invoice.invoiceTotal) == "4500.00"
        detail.status == 200 && !detail.broken
        detail.output.includes("Milestones · 1")
        detail.output.includes("Design approved: 25% of Web shop, fixed fee")
        detail.output.includes("Checkout form")
        print.output.includes("Time detail")
        print.output.includes("Design approved: 25% of Web shop, fixed fee")
        print.output.includes("$4,500.00")
    },
})

feature("the Money tab shows the invoice, the share billed and the one still to reach; OrderDetail shows the share billed; joe may not see the money", {
    when() {
        const money = render("apps/Projects/Projects/ProjectDetail/Money", { workEffortId: PROJECT })
        const order = render("apps/Projects/Billing/OrderDetail", { orderId: made.orderId })
        const joeMoney = as("joe.developer", () => render("apps/Projects/Projects/ProjectDetail/Money", { workEffortId: PROJECT }))
        const joeOrder = as("joe.developer", () => render("apps/Projects/Billing/OrderDetail", { orderId: made.orderId }))
        return { money, order, joeMoney, joeOrder }
    },
    then({ money, order, joeMoney, joeOrder }) {
        money.status == 200 && !money.broken
        money.output.includes(made.invoiceId)
        money.output.includes("$4,500.00")
        money.output.includes("Billed on " + made.invoiceId)
        money.output.includes("Shop delivered")
        money.output.includes("$9,000.00")
        order.output.includes("Billed on " + made.invoiceId)
        order.output.includes("Design approved")
        joeMoney.status != 200 || (joeMoney.output.includes("for those who manage money") && !joeMoney.output.includes("$4,500.00"))
        joeOrder.status != 200 || !joeOrder.output.includes("Web shop, fixed fee")
    },
})

feature("Delivery reached without a gate is due; Unbilled's Invoice adds it to the open draft; the estimate file opens from its milestone", {
    when() {
        const reached = post("Projects/MilestoneDetail/changeStatus", { workEffortId: made.msDelivery, statusId: "WeComplete" })
        const due = render("apps/Projects/Billing/Unbilled", { list: "milestones", rootWorkEffortId: PROJECT })
        const invoiced = post("Billing/Unbilled/invoiceMilestone", { milestoneId: made.msDelivery, invoiceId: made.invoiceId })
        const contentId = sys(() => Array.from(ec.entity.find("mantle.work.effort.WorkEffortApproval").condition("workEffortId", made.estimateId).list())[0].workEffortContentId)
        const file = render("apps/Projects/Projects/MilestoneDetail/estimateFile", { workEffortId: made.estimateId, workEffortContentId: contentId })
        const newProjectMoney = render("apps/Projects/Projects/NewProject/Money", { workEffortId: PROJECT })
        return { reached, due, invoiced, file, newProjectMoney, invoice: one("mantle.account.invoice.Invoice", { invoiceId: made.invoiceId }) }
    },
    then({ reached, due, invoiced, file, newProjectMoney, invoice }) {
        reached.errors == ""
        due.output.includes("Shop delivered") && due.output.includes("$9,000.00")
        due.output.includes("It is added to the draft " + made.invoiceId)
        invoiced.errors == ""
        dec(invoice.invoiceTotal) == "13500.00"
        file.output.includes("Product pages")
        newProjectMoney.status == 200 && !newProjectMoney.broken
        newProjectMoney.output.includes("The order line it fulfils")
        newProjectMoney.output.includes("Web shop, fixed fee")
    },
})
