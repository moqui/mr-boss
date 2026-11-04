// IronStone Projects P6b (impl-projects.md P6; design-projects.md §8 TimeEntries and ImportTime, §4 ProjectTime, §1.4 Today, §12
// TimeSettings, time in Chatter) through the screens' transitions, with authorization on: in a project of its own (TEW, john.doe its
// manager, joe.developer a programmer, bob.developer a quality analyst), in the weeks of January 4 and 11, 2027. joe logs time in
// TimeEntries' dialog and finds it; bob does not see it; john.doe sees it with the rates, joe not even in the column chooser
// (impl-manufacturing F141), and the team timesheet's print link. The bulk changes keep the lock: joe's
// submitted week is changed only in its money, by john.doe; an open week's entry is moved and retyped. joe imports a Time entries
// CSV through the wizard: the bad rows are named with their reasons and the others imported; the same file again skips them.
// The Today source gives joe's running timer (stopped from the Today panel) and his week to submit. ProjectDetail's Time tab
// renders with its totals (impl-projects.md F52: AppStructure walks files only); a work item's All time shows the time logged on
// it (the record timeline's time is mr-mantle's WorkTimeEntries). TimeSettings keeps the policy and the work types offered, which MyTime offers.
// The project is cancelled after, and the organization's time settings put back.
// Run: ./moq test mr-boss --spec TimeEntries
const webroot = "component://webroot/screen/webroot.xml"
const PROJECT = "TEW"
// a moment of a day of January 2027 in the session's time zone
const at = (day, hour, minute) => Number(String(ec.l10n.parseTimestamp(`2027-01-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:${String(minute || 0).padStart(2, "0")}:00.000`,
        "yyyy-MM-dd HH:mm:ss.SSS")))
let now = null
const made = {}

function render(path, parameters, mode) {
    const str = ec.screen.makeTest().rootScreen(webroot).renderMode(mode || "qvt").withStaticData().render(path,
            Object.assign({ lastStandalone: "true" }, parameters || {}), null)
    const output = String(str.output || "")
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), output, broken: /Error rendering|Exception in render/.test(output) }
}
function post(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(webroot).render("apps/" + path, parameters || {}, "post")
    const output = String(str.output || "")
    ec.message.clearErrors()
    let parsed = null
    try { parsed = JSON.parse(output) } catch (err) { parsed = null }
    return { status: str.status, errors: str.errorMessages.join(" | "), output, json: parsed }
}
function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
function as(username, run, password) {
    login(username, password)
    if (now) ec.user.setEffectiveTime(now)
    try { return run() } finally { login("john.doe"); if (now) ec.user.setEffectiveTime(now) }
}
const setNow = (millis) => { now = millis; ec.user.setEffectiveTime(millis) }
// the rows of TimeEntries as the screen finds them (the service the screen calls, as the user: what they may see)
const rowsOf = (who, parameters) => as(who, () => sys(() => call("ironstone.projects.TimeServices.find#TimeEntryRows",
        Object.assign({ list: "all", rootWorkEffortId: PROJECT, pageNoLimit: true }, parameters || {}))))
const entry = (id) => sys(() => ec.entity.find("mantle.work.time.TimeEntry").condition("timeEntryId", id).one())
const entryBy = (comments) => sys(() => Array.from(ec.entity.find("mantle.work.time.TimeEntry").condition("comments", comments).list())[0])
// the user's imports (an import id is the time it started, the spec's fixed clock here, and a random number)
const importIds = (userId) => sys(() => Array.from(ec.resource.getLocationReference(`dbresource://ironstone/TimeImport/${userId}`).getDirectoryEntries() || [])
        .map((one) => one.getFileName())).filter((name) => /^\d+-\d+$/.test(name))
// the import made by run(): the id that was not there before
function newImport(userId, run) {
    const before = new Set(importIds(userId))
    run()
    return importIds(userId).find((id) => !before.has(id)) || null
}
const draftOf = (userId, importId) => JSON.parse(sys(() => ec.resource.getLocationReference(`dbresource://ironstone/TimeImport/${userId}/${importId}/draft.json`).getText()) || "{}")
const CSV = "date,person,work item,hours,start,end,work type,billable,comment\n"
    + "2027-01-12,joe.developer,TEW-1,1.5,,,Development,yes,Imported ledger work\n"
    + "2027-01-12,joe.developer,TEW-2,,13:00,14:30,Testing,no,Imported bulk tests\n"
    + "2027-01-12,joe.developer,NOPE-99,2,,,,,A key that is not there\n"
    + "2027-01-05,joe.developer,TEW-1,1,,,,,In the submitted week\n"
    + "2027-01-13,bob.developer,TEW-1,1,,,,,Not joe's to log\n"

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        sys(() => {
            call("mantle.work.ProjectServices.create#Project", { workEffortId: PROJECT, workEffortName: "Time entries walk" })
            call("update#mantle.work.effort.WorkEffort", { workEffortId: PROJECT, statusId: "WeInProgress", visibilityEnumId: "WevWorkGroup" })
            for (const [partyId, roleTypeId] of [["EX_JOHN_DOE", "ProjectManager"], ["ORG_ZIZI_JD", "Programmer"], ["ORG_ZIZI_BD", "QualityAnalyst"]]) {
                if (!ec.entity.find("mantle.work.effort.WorkEffortParty").condition({ workEffortId: PROJECT, partyId, roleTypeId }).count())
                    call("create#mantle.work.effort.WorkEffortParty", { workEffortId: PROJECT, partyId, roleTypeId, fromDate: "2026-10-01 00:00:00", statusId: "WeptAssigned" })
            }
            const task = (name, hours) => call("mantle.work.TaskServices.create#Task", { rootWorkEffortId: PROJECT, workEffortName: name, estimatedWorkTime: hours,
                remainingWorkTime: hours, assignToPartyId: "ORG_ZIZI_JD", assignRoleTypeId: "Assignee" }).workEffortId
            task("Ledger rows", 4)
            task("Bulk changes", 20)
            // the organization's time settings as they were, put back after
            const org = call("ironstone.projects.ProjectServices.get#SettingsOrganization", {}).organizationPartyId
            made.org = org
            for (const type of ["ProjTimesheetPolicy", "ProjWorkTypes"]) made[type] = org ? ec.entity.find("mantle.party.PartySetting").condition({ partyId: org, partySettingTypeId: type }).one()?.settingValue ?? null : null
        })
        setNow(at(13, 10))
    },
    cleanupSpec() {
        // joe's submitted week decided, so its approval does not wait in john.doe's tray for the specs after (TodayPanel counts one)
        sys(() => {
            const sheet = ec.entity.find("mantle.work.time.Timesheet").condition({ partyId: "ORG_ZIZI_JD", statusId: "TmshCompleted" })
                    .condition("fromDate", "less-equals", new Date(at(6, 12))).condition("thruDate", "greater-than", new Date(at(6, 12))).one()
            if (sheet) { try { call("mantle.work.TimesheetServices.approve#Timesheet", { timesheetId: sheet.timesheetId }) } catch (err) { ec.message.clearErrors() } }
            ec.message.clearErrors()
        })
        ec.user.setEffectiveTime(null)
        sys(() => {
            const project = ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortId", PROJECT).one()
            if (project) { project.statusId = "WeCancelled"; project.update() }
            for (const timer of ec.entity.find("mantle.work.time.TimeEntry").condition("partyId", "ORG_ZIZI_JD").condition("thruDate", "is-null", null)
                    .condition("fromDate", "greater-equals", new Date(at(1, 0))).list()) timer.delete()
            if (made.org) for (const type of ["ProjTimesheetPolicy", "ProjWorkTypes"]) {
                const row = ec.entity.find("mantle.party.PartySetting").condition({ partyId: made.org, partySettingTypeId: type }).one()
                if (made[type] == null) { if (row) row.delete() } else if (row) { row.settingValue = made[type]; row.update() }
            }
        })
    },
})

feature("joe logs time in TimeEntries' dialog and finds it; bob, his line manager, sees it read only; john.doe sees it with the rates and the print link", {
    when() {
        const dialog = as("joe.developer", () => render("apps/Projects/Time/TimeEntries/EditEntry", {}))
        const logged = as("joe.developer", () => post("Projects/Time/TimeEntries/EditEntry/saveEntry", { entryItemId: "TEW-1", day: "2027-01-11", hours: "2",
            billable: "Y", workTypeEnumId: "WktpDevelopment", comments: "Ledger rows first cut" }))
        const lastWeek = as("joe.developer", () => post("Projects/Time/TimeEntries/EditEntry/saveEntry", { entryItemId: "TEW-1", day: "2027-01-04",
            fromTime: "09:00", thruTime: "12:00", billable: "Y", workTypeEnumId: "WktpDevelopment", comments: "Ledger rows last week" }))
        const bobLogged = as("bob.developer", () => post("Projects/Time/TimeEntries/EditEntry/saveEntry", { entryItemId: "TEW-2", day: "2027-01-12", hours: "1",
            billable: "N", comments: "Bob's review of the bulk changes" }))
        made.open = entryBy("Ledger rows first cut")?.timeEntryId
        made.locked = entryBy("Ledger rows last week")?.timeEntryId
        const page = as("joe.developer", () => render("apps/Projects/Time/TimeEntries", { list: "all", itemId: "TEW-1" }))
        const thisWeek = as("joe.developer", () => render("apps/Projects/Time/TimeEntries", {}))
        const edit = as("joe.developer", () => render("apps/Projects/Time/TimeEntries/EditEntry", { timeEntryId: made.open }))
        return { dialog, logged, lastWeek, bobLogged, page, thisWeek, edit, joe: rowsOf("joe.developer"), bob: rowsOf("bob.developer"), john: rowsOf("john.doe"),
            johnPage: render("apps/Projects/Time/TimeEntries", { list: "all", itemId: "TEW-1" }), bobEdit: as("bob.developer", () => render("apps/Projects/Time/TimeEntries/EditEntry", { timeEntryId: made.open })) }
    },
    then({ dialog, logged, lastWeek, bobLogged, page, thisWeek, edit, joe, bob, john, johnPage, bobEdit }) {
        dialog.status == 200 && !dialog.broken && dialog.output.includes("Log time")
        logged.errors == "" && made.open != null
        lastWeek.errors == "" && made.locked != null
        Number(String(entry(made.locked).hours)) == 3
        !page.broken && page.output.includes("Ledger rows first cut") && page.output.includes("Ledger rows last week")
        // This week, the default list, has the week's entry only
        thisWeek.output.includes("Ledger rows first cut") && !thisWeek.output.includes("Ledger rows last week")
        // a column its hide condition hides (hide="!ratesShown") is not offered in the column chooser either (477f9e89, the qvt
        // template ScreenQvt.js): not to joe, who reads no rates; to john.doe
        !page.output.includes("Worker rate") && !thisWeek.output.includes("Worker rate")
        edit.output.includes("Ledger rows first cut")
        bobLogged.errors == ""
        // joe sees his own; bob, his line manager in the demo, sees joe's too but may not change it; john.doe, the project's manager, all
        joe.rowCount == 2 && joe.ratesShown == false && !joe.rowList.some((row) => row.partyId === "ORG_ZIZI_BD")
        bob.rowCount == 3 && bob.rowList.filter((row) => row.partyId === "ORG_ZIZI_JD").every((row) => row.canEdit == false)
        john.rowCount == 3 && john.ratesShown == true
        john.rowList.find((row) => row.timeEntryId == made.open).canEdit == true
        // no rate reaches one who does not manage money
        joe.rowList.every((row) => !("clientHourRate" in row) && row.clientAmountText === "") && john.rowList.every((row) => "clientHourRate" in row)
        !johnPage.broken && johnPage.output.includes("Ledger rows first cut") && johnPage.output.includes("Worker rate")
        // the team timesheet print of the same find
        johnPage.output.includes("TeamTimesheet?renderMode=html-print")
        bobEdit.output.includes("not yours to change") && !bobEdit.output.includes("EntryForm")
    },
})

feature("the bulk changes keep the lock: a submitted week's entry changes only in its money, by john.doe; an open week's is moved and retyped", {
    when() {
        const submitted = as("joe.developer", () => post("Projects/Time/MyTime/decide", { action: "submit", weekDate: "2027-01-04" }))
        // the screen's bulk transition once, then the service it calls (as the user: the user decides) for the counts and reasons
        const keep = JSON.stringify({ list: "all" })
        const retypeScreen = as("joe.developer", () => post("Projects/Time/TimeEntries/bulkAction", { bulk: "workType", value: "WktpTesting", selectedIds: made.open, keep }))
        const bulk = (who, action, ids, value) => as(who, () => sys(() => {
            try {
                const out = call("ironstone.projects.TimeServices.bulk#TimeEntries", { action, selectedIds: ids, value: value ?? null })
                if (ec.message.hasError()) { const error = ec.message.getErrorsString(); ec.message.clearErrors(); return { error } }
                return out
            } catch (err) { const error = String(err.message) + " " + (ec.message.hasError() ? ec.message.getErrorsString() : ""); ec.message.clearErrors(); return { error } }
        }))
        const retype = bulk("joe.developer", "workType", `${made.locked},${made.open}`, "WktpTesting")
        const remove = bulk("joe.developer", "delete", made.locked)
        const joeMoney = bulk("joe.developer", "billable", made.locked, "N")
        const johnMoney = bulk("john.doe", "billable", made.locked, "N")
        const move = bulk("john.doe", "move", made.open, "TEW-2")
        const rates = bulk("joe.developer", "rates", made.open)
        const bobMove = bulk("bob.developer", "move", made.open, "TEW-1")
        return { submitted, retypeScreen, retype, remove, joeMoney, johnMoney, move, rates, bobMove, rows: rowsOf("john.doe") }
    },
    then({ submitted, retypeScreen, retype, remove, joeMoney, johnMoney, move, rates, bobMove, rows }) {
        submitted.errors == ""
        retypeScreen.errors == ""
        // the open week's entry is retyped, the submitted week's is not
        retype.doneCount == 1 && retype.failedCount == 1 && retype.message.includes("its week is submitted")
        entry(made.open).workTypeEnumId == "WktpTesting"
        entry(made.locked).workTypeEnumId == "WktpDevelopment"
        remove.failedCount == 1 && entry(made.locked) != null
        // billable is money: john.doe changes it on the submitted week, joe does not
        joeMoney.failedCount == 1 && joeMoney.message.includes("its week is submitted")
        johnMoney.doneCount == 1
        entry(made.locked).rateTypeEnumId == "RatpNoCharge"
        move.doneCount == 1 && entry(made.open).workEffortId == "TEW-2"
        rates.error.includes("Only those who manage money")
        // bob sees joe's entry (his line manager) but does not approve his weeks
        bobMove.failedCount == 1 && bobMove.message.includes("not yours to change")
        rows.rowList.find((row) => row.timeEntryId == made.locked).statusLabel == "Submitted"
        rows.rowList.find((row) => row.timeEntryId == made.locked).canEdit == false
        rows.rowList.find((row) => row.timeEntryId == made.open).statusLabel == "Open"
    },
})

feature("joe imports a Time entries CSV through the wizard: the bad rows are named and the others imported; the same file again skips them", {
    when() {
        const source = as("joe.developer", () => render("apps/Projects/Time/Import/Source", {}))
        const noFile = as("joe.developer", () => post("Projects/Time/Import/Source/saveSource", { characterSet: "UTF-8" }))
        let saved = null
        const importId = newImport("ORG_ZIZI_JD", () => { saved = as("joe.developer", () => post("Projects/Time/Import/Source/saveSource",
            { timeEntryFile: uploadedFile("time.csv", CSV, "text/csv"), characterSet: "UTF-8" })) })
        const preview = as("joe.developer", () => render("apps/Projects/Time/Import/Preview", { importId }))
        as("joe.developer", () => post("Projects/Time/Import/Preview/confirmPreview", { importId }))
        const ran = as("joe.developer", () => post("Projects/Time/Import/Result/runImport", { importId }))
        const result = as("joe.developer", () => render("apps/Projects/Time/Import/Result", { importId }))
        const draft = draftOf("ORG_ZIZI_JD", importId)
        // the same file again, a new import: the rows logged already are skipped
        const againId = newImport("ORG_ZIZI_JD", () => as("joe.developer", () => post("Projects/Time/Import/Source/saveSource",
            { timeEntryFile: uploadedFile("time.csv", CSV, "text/csv"), characterSet: "UTF-8" })))
        as("joe.developer", () => post("Projects/Time/Import/Result/runImport", { importId: againId }))
        return { source, noFile, saved, importId, preview, ran, result, draft, again: draftOf("ORG_ZIZI_JD", againId), againId }
    },
    then({ source, noFile, saved, importId, preview, ran, result, draft, again, againId }) {
        source.output.includes("Download the template")
        noFile.errors.includes("Choose a CSV file")
        saved.errors == "" && importId != null
        !preview.broken && preview.output.includes("5 rows: 2 to create") && preview.output.includes("No work item or project NOPE-99")
        ran.errors == ""
        draft.status == "done"
        draft.result.createdCount == 2 && draft.result.failedCount == 3
        draft.result.hoursImported == 3
        draft.result.failureList.map((failure) => failure.rowNumber).join(",") == "4,5,6"
        draft.result.failureList[0].error.includes("NOPE-99")
        draft.result.failureList[1].error.includes("submitted")
        draft.result.failureList[2].error.includes("may not log time for Bob Developer")
        entryBy("Imported ledger work").workTypeEnumId == "WktpDevelopment" && Number(String(entryBy("Imported ledger work").hours)) == 1.5
        entryBy("Imported bulk tests").rateTypeEnumId == "RatpNoCharge" && Number(String(entryBy("Imported bulk tests").hours)) == 1.5
        result.output.includes("Rows that failed") && result.output.includes("A key that is not there")
        againId != importId
        again.result.createdCount == 0 && again.result.skippedCount == 2 && again.result.failedCount == 3
    },
})

feature("the Today source gives joe's running timer and his week to submit; Stop in the Today panel stops the timer", {
    when() {
        setNow(at(15, 9))
        as("joe.developer", () => sys(() => call("mantle.work.TimesheetServices.start#Timer", { workEffortId: "TEW-1", comments: "Friday ledger" })))
        setNow(at(15, 10, 30))
        const projects = { service: "mantle.work.ProjectServices.get#ProjectTodayItems", label: "Projects" }
        const joeView = as("joe.developer", () => sys(() => call("ironstone.commons.CommonsServices.get#TodayView", { sourceServiceNames: [projects] })))
        const group = (joeView.groups || []).find((one) => one.label === "Projects") || { items: [] }
        const timer = group.items.find((item) => item.kind === "timer") || {}
        const week = group.items.find((item) => item.kind === "timesheet") || {}
        const panel = as("joe.developer", () => render("apps/Commons/Panel/Today", {}))
        const stopped = as("joe.developer", () => {
            const str = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Commons.xml").render("Panel/Today/stopTimer", { timeEntryId: timer.timeEntryId }, "post")
            ec.message.clearErrors()
            return JSON.parse(String(str.output || "{}"))
        })
        // authorization is on again after a Commons render (mr-moqui e29d336f, impl-projects.md F77), so the features after check it
        if (ec.artifactExecution.authzDisabled()) throw new Error("authorization left off after the Today panel")
        return { group, timer, week, panel, stopped, timerAfter: as("joe.developer", () => sys(() => call("mantle.work.TimesheetServices.get#Timer", {}).timer)) }
    },
    then({ group, timer, week, panel, stopped, timerAfter }) {
        timer.title.includes("TEW-1") && timer.canStopTimer == true && timer.timeText.includes("Running since")
        week.url.includes("/Projects/Time/MyTime?weekDate=2027-01-11")
        week.title.includes("Submit your week")
        // the submitted week of January 4 is not one to submit
        group.items.filter((item) => item.kind === "timesheet").length == 1
        !panel.broken && panel.output.includes("Stop the timer")
        stopped.messageInfos[0].message.includes("Timer stopped")
        timerAfter == null
    },
})

feature("ProjectDetail's Time tab renders the project's time with its totals; a work item's All time shows the time logged on it", {
    when() {
        const tab = render("apps/Projects/Projects/ProjectDetail/Time", { workEffortId: PROJECT })
        const joeTab = as("joe.developer", () => render("apps/Projects/Projects/ProjectDetail/Time", { workEffortId: PROJECT }))
        const tui = render("apps/Projects/Projects/ProjectDetail/Time", { workEffortId: PROJECT }, "tui")
        const totals = sys(() => call("ironstone.projects.TimeServices.get#ProjectTime", { workEffortId: PROJECT, findParameters: { list: "all" } }).projectTime)
        const rates = post("Projects/Projects/ProjectDetail/Time/updateRates", { workEffortId: PROJECT })
        const joeRates = as("joe.developer", () => post("Projects/Projects/ProjectDetail/Time/updateRates", { workEffortId: PROJECT }))
        // WorkItemDetail's All time box, by the service it calls (WorkItemDetail.spec.js renders the screen)
        const itemTime = as("bob.developer", () => sys(() => call("ironstone.projects.TimeServices.get#ItemTime", { workEffortId: "TEW-1" }).itemTime))
        // the entry dialog in the tab, with the project, and its save back to the tab
        const tabDialog = render("apps/Projects/Projects/ProjectDetail/Time/EditEntry", { workEffortId: PROJECT, timeEntryId: made.open })
        const tabSave = post("Projects/Projects/ProjectDetail/Time/EditEntry/saveEntry", { workEffortId: PROJECT, timeEntryId: made.open, entryItemId: "TEW-2",
            day: "2027-01-11", hours: "2.5", billable: "Y", workTypeEnumId: "WktpTesting", comments: "Ledger rows first cut" })
        return { tab, joeTab, tui, totals, rates, joeRates, itemTime, tabDialog, tabSave }
    },
    then({ tab, joeTab, tui, totals, rates, joeRates, itemTime, tabDialog, tabSave }) {
        !tabDialog.broken && tabDialog.output.includes("Ledger rows first cut") && tabDialog.output.includes("Rates")
        tabSave.errors == "" && Number(String(entry(made.open).hours)) == 2.5
        tab.status == 200 && !tab.broken && tab.errors == ""
        tab.output.includes("Time on the project") && tab.output.includes("By person") && tab.output.includes("Joe Developer")
        tab.output.includes("Imported ledger work") && tab.output.includes("Update rates")
        !joeTab.broken && joeTab.output.includes("Time on the project") && !joeTab.output.includes("Update rates")
        tui.status == 200 && tui.output.includes("Time on the project")
        // joe's 2 + 3 + 1.5 + 1.5 + the 1.5 h timer of the Friday, and bob's 1
        totals.hours == 10.5 && totals.byPerson.length == 2 && totals.estimateText == "24"
        totals.byItem.some((item) => item.workEffortId === "TEW-1")
        rates.errors == ""
        joeRates.errors.includes("Only a manager of the project")
        itemTime != null && itemTime.rowList.some((row) => row.comments === "Imported ledger work")
    },
})

feature("TimeSettings keeps the policy and the work types offered; MyTime and the entry dialog offer them", {
    when() {
        const page = render("apps/Projects/Settings/Time", {})
        const saved = post("Projects/Settings/Time/savePolicy", { weekStart: "1", approvers: "project", lock: "Y", minHours: "0.5", future: "Y", dayHours: "7.5",
            workDays: ["1", "2", "3", "4", "5"], remindDay: "1", remindHour: "9" })
        const stopped = post("Projects/Settings/Time/changeType", { enumId: "WktpTravel", change: "stop" })
        const added = post("Projects/Settings/Time/createType", { label: "Walk review" })
        // the Settings screens are the managers' (ProjectsSettings checks the screens); the services refuse the team too
        const teamSave = as("joe.developer", () => sys(() => {
            try { call("ironstone.projects.TimeServices.store#TimeSettings", { weekStart: 1, workDays: "12345" }) } catch (err) { /* the error is in the messages */ }
            const error = ec.message.hasError() ? ec.message.getErrorsString() : ""
            ec.message.clearErrors()
            return error
        }))
        const settings = sys(() => call("ironstone.projects.TimeServices.get#TimeSettings", {}))
        const myWeek = sys(() => call("ironstone.projects.TimeServices.get#MyWeek", { weekDate: "2027-01-13" }).myWeek)
        const dialog = render("apps/Projects/Time/TimeEntries/EditEntry", {})
        return { page, saved, stopped, added, teamSave, settings, myWeek, dialog }
    },
    then({ page, saved, stopped, added, teamSave, settings, myWeek, dialog }) {
        !page.broken && page.output.includes("Timesheet policy") && page.output.includes("Work types")
        saved.errors == "" && settings.policy.minHours == "0.5" && settings.policy.dayHours == "7.5"
        stopped.errors == "" && added.errors == ""
        !settings.typeList.find((type) => type.enumId === "WktpTravel").offered
        settings.typeList.some((type) => type.label === "Walk review" && type.offered && type.isOwn)
        !myWeek.workTypeOptions.some((option) => option.value === "WktpTravel")
        myWeek.workTypeOptions.some((option) => option.label === "Walk review")
        dialog.output.includes("Walk review") && !dialog.output.includes(">Travel<")
        teamSave.includes("Only project managers")
    },
})

// an employee's pay (Mantle's PAYROLL_VIEW and PAYROLL_EDIT): a Projects manager who is not payroll sees and sets the client rate of
// joe's time, not his worker rate, which is his pay; john.doe (ADMIN) sees and sets both
feature("a Projects manager who is not payroll: joe's worker rate is left out of his row and the dialog, and saving one is refused", {
    when() {
        const password = "moqui1!!"
        sys(() => {
            const partyId = call("mantle.party.PartyServices.create#Person", { firstName: "Tess", lastName: "Manager" }).partyId
            const userId = call("mantle.party.PartyServices.create#PartyUserAccount", { partyId, emailAddress: "tew.manager@example.com", username: "tew.manager",
                    newPassword: password, newPasswordVerify: password, timeZone: "America/Chicago" }).userId
            call("create#moqui.security.UserGroupMember", { userGroupId: "BOSS_PROJECT_MANAGER", userId, fromDate: "2026-10-01 00:00:00" })
            call("create#mantle.work.effort.WorkEffortParty", { workEffortId: PROJECT, partyId, roleTypeId: "ProjectManager", fromDate: "2026-10-01 00:00:00", statusId: "WeptAssigned" })
            call("update#mantle.work.time.TimeEntry", { timeEntryId: made.open, clientHourRate: 120, vendorHourRate: 42, hasModifiedRates: "Y" })
        })
        const manager = (run) => as("tew.manager", run, password)
        const row = manager(() => sys(() => call("ironstone.projects.TimeServices.find#TimeEntryRows", { list: "all", rootWorkEffortId: PROJECT,
                timeEntryIds: [made.open] }))).rowList[0]
        const dialog = manager(() => render("apps/Projects/Time/TimeEntries/EditEntry", { timeEntryId: made.open }))
        const refused = manager(() => post("Projects/Time/TimeEntries/EditEntry/saveRates", { timeEntryId: made.open, clientHourRate: "125", vendorHourRate: "99" }))
        const afterRefused = entry(made.open)
        const saved = manager(() => post("Projects/Time/TimeEntries/EditEntry/saveRates", { timeEntryId: made.open, clientHourRate: "125" }))
        const afterSaved = entry(made.open)
        const johnDialog = render("apps/Projects/Time/TimeEntries/EditEntry", { timeEntryId: made.open })
        const johnSaved = post("Projects/Time/TimeEntries/EditEntry/saveRates", { timeEntryId: made.open, clientHourRate: "125", vendorHourRate: "44" })
        return { row, dialog, refused, afterRefused, saved, afterSaved, johnDialog, johnSaved, afterJohn: entry(made.open) }
    },
    then({ row, dialog, refused, afterRefused, saved, afterSaved, johnDialog, johnSaved, afterJohn }) {
        row.clientRateText == "120.00" && row.vendorRateText == "" && row.vendorAmountText == ""
        !dialog.broken && dialog.output.includes("Client rate (an hour)") && !dialog.output.includes("Worker rate (an hour)")
        dialog.output.includes("set by payroll")
        refused.errors.includes("only payroll sets it")
        Number(String(afterRefused.vendorHourRate)) == 42 && Number(String(afterRefused.clientHourRate)) == 120
        saved.errors == ""
        Number(String(afterSaved.clientHourRate)) == 125 && Number(String(afterSaved.vendorHourRate)) == 42
        !johnDialog.broken && johnDialog.output.includes("Worker rate (an hour)") && !johnDialog.output.includes("set by payroll")
        johnSaved.errors == "" && Number(String(afterJohn.vendorHourRate)) == 44
    },
})
