// Marketing P18's check-in in the live client at phone width (impl-marketing P18 "usable when", scenario 14; design-marketing §9 CheckIn),
// an acceptance walk: marketing.events opens the open evening's door on a 390 px phone, types Nora's entry code into the scan and checks
// her in after the decision shows; scanning it again shows the first time; Owen's cancelled ticket is refused; Pia is found by name and
// checked in with a reason; nothing scrolls sideways. The data is MarketingCheckInFixtures' (which also checks that cancelling an event
// stops its pending reminders); the rules are mr-mantle's EventCheckIn.
// Run: ./moq accept mr-boss --spec MarketingCheckInWalk
const door = "/qapps/Marketing/Events/CheckIn?registrationPolicyId=MKT_DOOR_SPEC_OFFER_OPEN"
let page = null
const codes = {}
spec({
    setupSpec() {
        // the codes the fixture kept (a code is never stored by the app; the fixture keeps the walk's)
        const admin = session({user: "john.doe"})
        for (const name of ["NORA", "OWEN"]) {
            const found = admin.get("/rest/e1/moqui.basic.Enumeration/MKT_DOOR_SPEC_CODE_" + name, {accept: "json"})
            if (!found.ok) skip("run the fixture first: ./moq accept mr-boss --spec MarketingCheckInFixtures")
            codes[name] = found.json().description
        }
        page = browser.newPage({user: "marketing.events", viewport: {width: 390, height: 844}, timeout: 30})
        page.allowProblems(/userPhoto\?userId=/)
        // a refused code (Owen's cancelled ticket) answers the scan with its refusal, a 400, which the page shows
        page.allowProblems(/\/CheckIn\/scanResolve/)
    }
})
function waitForText(text) {
    page.waitFor(text => (document.body.innerText || "").includes(text), {arg: text})
}
const noSideScroll = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
// a code typed into the scan input, as a wedge scanner types it (ending in Enter)
function scan(code) {
    const input = page.getByLabel("Entry code")
    input.click()
    input.fill("")
    page.keyboard.type(code)
    page.keyboard.press("Enter")
}

feature(
    "a code shows its attendee before Confirm checks her in; a second scan shows the first time; a cancelled ticket is refused",
    {
        expect() {
            page.goto(door).status == 200
            waitForText("Door spec open evening")
            noSideScroll()
            scan(codes.NORA)
            waitForText("Nora Gardener")
            page.getByRole("button", {name: "Confirm"}).click()
            waitForText("checked in")
            scan(codes.NORA)
            waitForText("Already checked in")
            scan(codes.OWEN)
            waitForText("Cancelled")
            noSideScroll()
            !/Error rendering|Exception in render/.test(page.text())
        }
    }
)

feature("Pia is found by name and checked in with a reason on the phone", {
    expect() {
        page.goto(door).status == 200
        waitForText("Door spec open evening")
        page.getByLabel("Find an attendee").fill("Pia")
        page.getByRole("button", {name: "Find"}).click()
        waitForText("Pia Gardener")
        noSideScroll()
        page.getByRole("button", {name: "Check in"}).last().click()
        const dialog = page.getByRole("dialog")
        dialog.getByLabel("Why").fill("Her phone is flat")
        dialog.getByRole("button", {name: "Check in"}).click()
        // the framework's confirmation of the action
        page.getByRole("button", {name: "Confirm"}).click()
        waitForText("Pia Gardener: checked in")
        noSideScroll()
    }
})
