// A form-list's column chooser (select-columns) leaves out a field its hide condition hides, as the list does: TimeEntries'
// rate columns (hide="!ratesShown") are not offered to joe.developer, who reads no rates, and are to john.doe
// (impl-manufacturing F141). Run: ./moq test mr-boss --spec ColumnChooser
const webroot = "component://webroot/screen/webroot.xml"
function render(path, mode) {
    const str = ec.screen
        .makeTest()
        .rootScreen(webroot)
        .renderMode(mode)
        .withStaticData()
        .render(path, {lastStandalone: "true", list: "all"}, null)
    ec.message.clearErrors()
    return String(str.output || "")
}
function as(user, fn) {
    ec.user.internalLoginUser(user)
    try {
        return fn()
    } finally {
        ec.user.logoutUser()
    }
}
feature("the column chooser in #mode offers no column its hide hides", {
    where: [{mode: "html"}, {mode: "qvt"}, {mode: "tui"}],
    when({mode}) {
        return {
            joe: as("joe.developer", () => render("apps/Projects/Time/TimeEntries", mode)),
            john: as("john.doe", () => render("apps/Projects/Time/TimeEntries", mode))
        }
    },
    then({joe, john}) {
        joe.length > 0
        !joe.includes("Worker rate")
        john.includes("Worker rate")
    }
})
