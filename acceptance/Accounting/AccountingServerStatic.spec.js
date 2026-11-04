// Server-static qvt for the Accounting screens (impl-accounting P21; README "Significant redesigns" 3): ServerStaticLib's full
// check of each plain XML Accounting screen with the demo organization and its route fixture's records (AccountingSpecLib), as
// john.doe. A screen marked server-static="qvt" must come back clean; the others and why are logged. Apart from ServerStatic so
// each stays well under 30 s.
// Run: ./moq test mr-boss --spec AccountingServerStatic
const lib = ec.resource.script("component://mr-boss/test/ServerStaticLib.js")
let screens, fixtures

spec({
    setupSpec() {
        login("john.doe")
        screens = lib.screens(["Accounting"])
        fixtures = ec.resource.script("component://mr-boss/test/Accounting/AccountingSpecLib.js").routeFixtures()
    }
})

feature("the full check of every Accounting XML screen; each one marked server-static is clean", {
    when() {
        const parametersOf = (app, path) =>
            Object.assign({organizationPartyId: "BOSS_ACCT_ORG"}, fixtures[path] ? fixtures[path].parameters : {})
        return {rows: lib.check(screens, parametersOf)}
    },
    then({rows}) {
        rows.length > 40
        lib.unclean(rows) == ""
    }
})
