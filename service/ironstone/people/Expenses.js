// People's expense claim documents (impl-people P15; design-people §15 "Expense claim and receipts"): the claim's printed page
// (ExpenseClaimPrint, html-print and its PDF) and its evidence bundle (ExpenseClaimDetail's evidence transition: the PDF and the
// receipts in one zip). The claim and its receipts are Mantle's (mantle.humanres.ExpenseServices get#Claim and get#ClaimEvidence,
// which check the reader), called as the user; nothing here reads a claim another way.
const L = text => ec.l10n.localize(text)
const enc = text =>
    String(text == null ? "" : text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")

// The claim's page as html-print renders it, from get#Claim's answer: the claimant, employer, purpose, state and route, the lines
// with their receipts, the approval's decisions and the settlement; every value escaped.
function printHtml(found) {
    const claim = found?.claim
    if (!claim) return "<p>" + enc(L("This expense claim is not available")) + "</p>"
    const row = (label, value) =>
        value ? '<tr><td class="field-title">' + enc(L(label)) + '</td><td class="field-value">' + enc(value) + "</td></tr>" : ""
    const table = (heads, rows) =>
        rows.length
            ? '<table class="list"><tr>' +
              heads.map(head => "<th>" + enc(L(head)) + "</th>").join("") +
              "</tr>" +
              rows.map(cells => "<tr>" + cells.map(cell => "<td>" + enc(cell) + "</td>").join("") + "</tr>").join("") +
              "</table>"
            : '<p style="color:#555">' + enc(L("None")) + "</p>"
    const title = text => '<div class="group-title" style="margin-top:8pt">' + enc(L(text)) + "</div>"
    const lines = Array.from(found.lines || []).map(line => [
        line.itemDateText,
        line.itemTypeText,
        line.description,
        line.merchantName,
        line.taxText,
        line.lineTotalText,
        line.receiptName || L("No receipt")
    ])
    const decisions = Array.from(found.approval?.decisions || []).map(decision => [
        decision.decisionText,
        decision.decidedByName,
        decision.decisionDateText,
        decision.reason
    ])
    const payments = Array.from(found.payments || []).map(payment => [
        payment.kindText,
        payment.appliedDateText,
        payment.amountText
    ])
    return (
        '<div class="box-header">' +
        enc(L("Expense claim") + " " + claim.invoiceId + " · " + claim.personName) +
        "</div>" +
        '<p style="color:#555">' +
        enc([claim.organizationName, ec.l10n.format(ec.user.nowTimestamp, "MMMM d, yyyy")].join(" · ")) +
        "</p>" +
        '<table class="field">' +
        row("Purpose", claim.purpose) +
        row("Department", claim.departmentName) +
        row("Project", claim.projectName) +
        row("Dated", claim.invoiceDateText) +
        row("State", claim.stageText) +
        row("Finance", claim.financeStatusText) +
        row("Settlement", claim.reservedRouteText || claim.routeText) +
        row("Total", claim.totalText) +
        row("Applied", claim.appliedText) +
        row("Unpaid", claim.unpaidText) +
        "</table>" +
        title("Expenses") +
        table(["Day", "Type", "Description", "Merchant", "Tax", "Amount", "Receipt"], lines) +
        title("Approval") +
        table(["Decision", "By", "When", "Why"], decisions) +
        title("Payments applied") +
        table(["Kind", "Day", "Amount"], payments)
    )
}

// The bundles are written under the runtime's tmp folder (served by no URL), each in a folder of a random name, and a bundle
// older than an hour is deleted when the next one is made; the printed page is deleted once it is in the zip.
const evidenceRoot = "runtime://tmp/people-claims/"
const evidenceKeepMs = 60 * 60 * 1000
function pruneEvidence() {
    try {
        const root = ec.resource.getLocationReference(evidenceRoot)
        if (!root.getExists()) return
        const cutoff = Date.now() - evidenceKeepMs
        for (const folder of Array.from(root.getDirectoryEntries() || [])) {
            if (!folder.isDirectory()) continue
            // a bundle's age is its newest file's; one whose age is not known (or one being written) is left
            const files = Array.from(folder.getDirectoryEntries() || [])
            const newest = Math.max(0, ...files.map(file => Number(file.getLastModified() || 0)))
            if (!newest || newest > cutoff) continue
            for (const file of files) file.delete()
            folder.delete()
        }
    } catch (error) {
        ec.logger.warn("Expense claim evidence: old bundles not cleaned up: " + error.message)
    }
}
// The claim's evidence bundle: a zip of its printed PDF (the page as html when this server has no PDF engine) and its receipts;
// answers its location and file name for the transition to send.
function evidence(invoiceId) {
    const found = ec.service.sync().name("mantle.humanres.ExpenseServices.get#Claim").parameters({invoiceId}).call()
    if (ec.message.hasError() || !found?.claim) return null
    const receipts = ec.service.sync().name("mantle.humanres.ExpenseServices.get#ClaimEvidence").parameters({invoiceId}).call()
    if (ec.message.hasError()) return null
    pruneEvidence()
    const folder = evidenceRoot + ec.user.randomString(24) + "/"
    const document =
        '<html><head><meta charset="utf-8"/><title>' +
        enc(L("Expense claim") + " " + invoiceId) +
        "</title></head><body>" +
        printHtml(found) +
        "</body></html>"
    const entries = []
    try {
        const pdf = ec.resource.xslFoTransform(document, null, null, "application/pdf")
        ec.resource.getLocationReference(folder + "claim.pdf").putBytes(pdf)
        entries.push({path: "claim-" + invoiceId + ".pdf", location: folder + "claim.pdf"})
    } catch (error) {
        ec.logger.warn("Expense claim " + invoiceId + ": no PDF in its evidence, the page as html: " + error.message)
        ec.resource.getLocationReference(folder + "claim.html").putText(document)
        entries.push({path: "claim-" + invoiceId + ".html", location: folder + "claim.html"})
    }
    for (const entry of Array.from(receipts?.entries || [])) entries.push({path: entry.path, location: entry.location})
    const written = ec.resource.writeZip(folder + "evidence.zip", entries)
    for (const failure of Array.from(written?.failures || []))
        ec.logger.error("Expense claim " + invoiceId + " evidence: " + failure.path + " left out: " + failure.error)
    // the printed page is in the zip now; the zip itself goes with the next bundle made after an hour
    for (const entry of entries)
        if (entry.location.startsWith(folder))
            try {
                ec.resource.getLocationReference(entry.location).delete()
            } catch (error) {
                ec.logger.warn("Expense claim " + invoiceId + " evidence: " + entry.location + " not deleted: " + error.message)
            }
    return {location: folder + "evidence.zip", fileName: "Claim-" + invoiceId + "-evidence.zip"}
}

;({printHtml, evidence})
