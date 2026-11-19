// OWASP ASVS 5.0.0 V6 Authentication: BOSS's proofs, each feature filed under the requirement its name starts with
// (docs/ASVS-Matrix.md, V6). Staff sign in at the framework's /Login, whose own proofs are the framework's; these go
// through what BOSS adds: Commons › Settings › Account's Change password form, the password prompts of a shared file link
// (/s/<token>) and of a published calendar (/cal/<token>), and the accounts BOSS's demo data makes.

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
const restLogin = (username, password) => session().post("/rest/login", { form: { username, password }, accept: "json", csrf: false })
const loggedIn = (res) => res.status == 200 && res.text.replace(/\s/g, "").toLowerCase().includes('"loggedin":true')

// ProofFixtures' boss.pw.proof: its password is set again on every run.
const PW_USER = "boss.pw.proof"
const PW = "BossPwProof1!!"

// Commons › Settings › Account's Change password (changePassword: the framework's update#Password for the signed-in user,
// with the current password).
// Does not prove: a change by an administrator (Admin's Send password reset), nor a deployment's own accounts, whose
// passwords a proof does not change.
feature("v5.0.0-6.2.2: a BOSS user changes their password on Commons Account; only the new one signs in", {
    given() { needsFixtures(`the user ${PW_USER}`) },
    when() {
        const fresh = `BossPw${Date.now() % 1000000}!a`
        const s = signIn(PW_USER, PW)
        const page = s.get("/apps/Commons/Settings/Account")
        const res = s.post("/apps/Commons/Settings/Account/changePassword", {
            form: { oldPassword: PW, newPassword: fresh, newPasswordVerify: fresh },
        })
        return { page, res, withNew: restLogin(PW_USER, fresh), withOld: restLogin(PW_USER, PW) }
    },
    then({ page, res, withNew, withOld }) {
        // the control: the signed-in user is offered the form
        page.status == 200
        page.text.includes('action="/apps/Commons/Settings/Account/changePassword"')
        res.status == 302
        (res.location ?? "").endsWith("/apps/Commons/Settings/Account")
        loggedIn(withNew)
        withOld.status == 401
    },
})

// The password fields of BOSS's own pages, as a browser shows them: Commons Account's Change password form (signed in), a
// shared file link's password prompt (the demo's link with a password, or a deployment's --param shareToken=TOKEN) and a
// published calendar's (ProofFixtures' link, or --param calendarToken=TOKEN). Each input that takes a password, by its type
// or its name, read once for the two proofs below; a paste is dispatched on each and whether a handler cancelled it kept.
const CALENDAR_TOKEN = "BossProofCalendarLink000000000000000"
let passwordFields = null
const readPasswordFields = () => {
    if (passwordFields) return passwordFields
    const fixtures = profile == "fixtures"
    const pages = []
    if (params.user || fixtures) {
        const { username, password } = account()
        pages.push({ name: "Commons Account", user: username, password, path: "/qapps/Commons/Settings/Account", fields: 3 })
    }
    const share = params.shareToken ?? (fixtures ? "BossDemoPhotosLink2026" : null)
    if (share) pages.push({ name: "shared file link", path: `/s/${share}`, fields: 1 })
    const calendar = params.calendarToken ?? (fixtures ? CALENDAR_TOKEN : null)
    if (calendar) pages.push({ name: "published calendar", path: `/cal/${calendar}`, fields: 1 })
    if (!pages.length) skip("no BOSS page with a password field to open: pass --param user=NAME, --param shareToken or --param calendarToken")
    passwordFields = pages.map(({ name, user, password, path, fields }) => {
        const page = browser.newPage(user ? { user, password } : {})
        page.goto(path)
        page.waitFor((count) => document.querySelectorAll('input[type="password"]').length >= count, { arg: fields, timeout: 20 })
        const inputs = page.evaluate(() =>
            Array.from(document.querySelectorAll("input"))
                .filter((input) => input.type == "password" || /pass(word)?|\bpin\b/i.test(`${input.name} ${input.id}`))
                .map((input) => {
                    const paste = new ClipboardEvent("paste", { bubbles: true, cancelable: true })
                    input.dispatchEvent(paste)
                    return {
                        name: input.name || input.id,
                        type: input.type,
                        // the field's own autocomplete, else its form's (the HTML autofill rule)
                        autofill: input.getAttribute("autocomplete") || (input.form ? input.form.getAttribute("autocomplete") : null),
                        handlers: Array.from(input.attributes).filter((a) => /^on(paste|copy|cut|drop)$/i.test(a.name)).length,
                        pasteBlocked: paste.defaultPrevented,
                        readOnly: input.readOnly,
                    }
                }))
        page.close()
        return { name, fields, inputs }
    })
    return passwordFields
}

// Does not prove: the kiosk's PIN (People › Time › ClockingKiosk, behind a device credential), the share dialog's link
// password in Commons Files and the invitation's account form (/i/<token>, behind a live invitation), each a
// type="password" field in its template; nor the framework's /Login (the framework's proof).
feature("v5.0.0-6.2.6: BOSS's password fields are masked: Account, a shared link and a published calendar", {
    when() { return { pages: readPasswordFields() } },
    then({ pages }) {
        // the control: each page shows its password fields
        pages.every((page) => page.inputs.length >= page.fields)
        pages.every((page) => page.inputs.every((input) => input.type == "password"))
    },
})

// A field marked autocomplete="off" (its own, else its form's) asks browsers and password managers not to fill or keep it,
// which many ignore for a password field, but which is the page closing itself to them.
// Does not prove: that a given password manager fills them (each decides by the field's type and autocomplete), nor the
// pages named under 6.2.6 that the proof does not open.
feature("v5.0.0-6.2.7: BOSS's password fields take a paste and are not closed to password managers", {
    when() {
        const pages = readPasswordFields()
        const fields = pages.flatMap((page) => page.inputs.map((input) => Object.assign({ page: page.name }, input)))
        return { pages, closedToPaste: fields.filter((input) => input.pasteBlocked || input.handlers > 0 || input.readOnly),
            closedToManagers: fields.filter((input) => input.autofill == "off").map((input) => `${input.page}: ${input.name}`) }
    },
    then({ pages, closedToPaste, closedToManagers }) {
        // the control: each page shows its password fields
        pages.every((page) => page.inputs.length >= page.fields)
        closedToPaste.length == 0
        closedToManagers.length == 0
    },
})

// The demo data's role accounts with the demo password (mr-boss data/BossUsersDemoData.xml, type demo: one password for
// all 144). A deployment's proof: the project's test server loads every data type, the demo data with it, so in the
// fixtures profile it skips. Each name is tried once; a refused sign-in counts toward that account's lock and this client's
// sign-in limits, so four are tried. The control: the deployment's own account, when the run names one, signs in at the
// same route.
// Does not prove: that no other account of the deployment has a guessable password, nor that no demo data was loaded
// (Mantle's own demo accounts and the portal demo's links are other data); BOSS's seed and install data make no account.
feature("v5.0.0-6.3.2: BOSS's demo role accounts do not sign in with the demo password", {
    given() {
        if (profile == "fixtures") skip("the project's test server loads the demo data and its accounts: this proof is for a deployment")
    },
    when() {
        const tried = ["admin.admin", "sales.rep", "finance.ar", "maint.tech"].map((username) => ({ username, res: restLogin(username, "moqui") }))
        return { tried, signedIn: tried.filter(({ res }) => loggedIn(res)).map(({ username }) => username),
            own: params.user ? restLogin(params.user, params.password ?? "") : null }
    },
    then({ tried, signedIn, own }) {
        signedIn.length == 0
        tried.every(({ res }) => res.status == 401)
        // the control: the deployment's own account signs in at the same route
        own == null || loggedIn(own)
    },
})
