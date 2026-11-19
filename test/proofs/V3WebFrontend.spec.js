// OWASP ASVS 5.0.0 V3 Web Frontend Security: BOSS's proofs, each feature filed under the requirement its name starts
// with (docs/ASVS-Matrix.md, V3). They go through the Commons app as a staff member does: its record screens' Chatter
// panel, signed in at the framework's /Login.

// The request whose Chatter the proof writes on: the demo's BOSS_DEMO_REQUEST, or a deployment's --param requestId=ID (a
// request the account may log notes and plan activities on; the proof removes the two it adds).
const REQUEST = params.requestId ?? (profile == "fixtures" ? "BOSS_DEMO_REQUEST" : null)
// The account a proof signs in with: the run's (--param user=NAME, its password in MOQUI_TEST_PASSWORD), else in the
// fixtures profile the demo's john.doe.
const account = () => {
    if (params.user) return { username: params.user, password: params.password ?? "" }
    needsFixtures("an account to sign in with (or --param user=NAME and MOQUI_TEST_PASSWORD)")
    return { username: "john.doe", password: "moqui" }
}
// A session signed in through the sign-in form, with the session token its pages carry.
const signIn = (username, password) => {
    const s = session()
    const res = s.formLogin(username, password)
    assert(res.status == 302 && !(res.location ?? "").includes("/Login"), `the sign-in of ${username} did not succeed: HTTP ${res.status}`)
    s.get("/apps/Commons/Notes/notes", { accept: "json" })
    return s
}

// What the proof added, removed after it whatever happened.
let added = null

// Vue's text interpolation and the one rich-text sink of Chatter (Shared/Chatter.qvue): a planned activity's summary is
// shown with {{ }}, a note's body with v-html after the server cleans it (ironstone.shared.ChatterServices clean#Html). The
// proof plans an activity whose summary holds escaped markup and a template expression, and logs a note whose body holds a
// script, an image with an event handler and a javascript: link, then reads the request's Chatter in a browser.
// The control: the note's paragraph is markup in the panel, as rich text is meant to be, and both are on the page.
// Does not prove: the other v-html sites (merge request comments through DOMPurify, the version diffs), nor a raw `<` in a
// summary, which the service's input filter refuses before any page shows it.
feature("v5.0.0-3.2.2: Chatter shows a summary as text and a note's markup without its scripts", {
    when() {
        if (!REQUEST) skip("no request to write on: pass --param requestId=ID, a request the account may log notes on")
        const { username, password } = account()
        const s = signIn(username, password)
        const stamp = String(Date.now())
        const record = { recordEntity: "mantle.request.Request", recordId: REQUEST }
        const summary = `Proof ${stamp} &lt;i id="boss-probe-${stamp}"&gt;x&lt;/i&gt; {{7*191}}`
        const body = `<p>Proof ${stamp} note</p><img src="/boss-probe-${stamp}.png" onerror="window.bossProbe=1">` +
            `<script>window.bossProbe=2</script><p><a href="javascript:window.bossProbe=3">probe link</a></p>`
        const planned = s.post("/apps/Commons/Chatter/scheduleActivity", {
            form: Object.assign({ activityType: "todo", workEffortName: summary, dueDate: `${new Date().toISOString().slice(0, 10)} 12:00` }, record),
            accept: "json" })
        const logged = s.post("/apps/Commons/Chatter/logNote", { form: Object.assign({ body }, record), accept: "json" })
        added = { s, record, workEffortId: planned.json().workEffortId, communicationEventId: logged.json().communicationEventId }
        assert(added.workEffortId && added.communicationEventId,
            `the activity or the note was not saved: ${planned.text.slice(0, 200)} ${logged.text.slice(0, 200)}`)

        const page = browser.newPage({ user: username, password })
        // the image the cleaned body may keep has no file, nor has a person without a photo (the avatar shows initials)
        page.allowProblems(`boss-probe-${stamp}`)
        page.allowProblems(/userPhoto\?userId=/)
        page.goto(`/qapps/Commons/Requests/RequestDetail?requestId=${encodeURIComponent(REQUEST)}`)
        page.waitFor((stamp) => document.body.innerText.includes(`Proof ${stamp} note`) && document.body.innerText.includes(`Proof ${stamp} &lt;i`),
            { arg: stamp, timeout: 20 })
        const seen = page.evaluate((stamp) => {
            const note = Array.from(document.querySelectorAll(".m-chatter-body")).find((el) => el.innerText.includes(`Proof ${stamp} note`))
            return {
                text: document.body.innerText,
                element: !!document.getElementById(`boss-probe-${stamp}`),
                ran: window.bossProbe ?? null,
                paragraphs: note ? note.querySelectorAll("p").length : 0,
                scripts: note ? note.querySelectorAll("script").length : -1,
                handlers: note ? Array.from(note.querySelectorAll("*")).filter((el) => Array.from(el.attributes).some((a) => /^on/i.test(a.name))).length : -1,
                scriptLinks: note ? Array.from(note.querySelectorAll("a")).filter((a) => /^\s*javascript:/i.test(a.getAttribute("href") ?? "")).length : -1,
            }
        }, stamp)
        return { stamp, summary, seen }
    },
    then({ stamp, summary, seen }) {
        // the control: the note's body is rich text in the panel
        seen.paragraphs >= 1
        seen.text.includes(summary)
        !seen.text.includes(`Proof ${stamp} <i`)
        !seen.element
        !seen.text.includes("1337")
        seen.scripts == 0
        seen.handlers == 0
        seen.scriptLinks == 0
        seen.ran == null
    },
    cleanup() {
        if (!added) return
        const { s, record, workEffortId, communicationEventId } = added
        added = null
        if (communicationEventId) s.post("/apps/Commons/Chatter/deleteEntry", { form: Object.assign({ communicationEventId }, record), accept: "json" })
        if (workEffortId) s.post("/apps/Commons/Chatter/cancelActivity", { form: Object.assign({ workEffortId }, record), accept: "json" })
    },
})
