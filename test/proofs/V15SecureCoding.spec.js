// OWASP ASVS 5.0.0 V15 Secure Coding and Architecture: BOSS's proofs, each feature filed under the requirement its name
// starts with (docs/ASVS-Matrix.md, V15). They call BOSS's screen transitions as its pages do: the apps' drop-down
// choices and Commons Notes.

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
const isList = (res) => {
    try {
        return res.status == 200 && Array.isArray(res.json())
    } catch (error) {
        return false
    }
}

// Each app's drop-downs ask its Home screen's choices transition for a named list (ironstone.<app> get#Choices over the
// app script's choiceSources), and the name is the request's. The script checks the name is an own key of its sources
// (Object.hasOwn) before it calls it, so a name that Object.prototype holds is answered as any unknown name is, with no
// options; unchecked, `constructor` would answer the user's scope object, `toString` a text and `__proto__` an error. Each
// app the account opens is asked; one it does not open (its choices refused or not a list) is left out.
// The control: a choice the app has answers its list (it may be empty for an account of no organization).
// Does not prove: the other lookups by a request's name (the matrix row names two that fail or fall back on a prototype
// name, insights/Records.js and purchasing/Requests.js), nor that no script writes a request's key into a shared object,
// which a client cannot see (a reading of the code found none).
const CHOICE_APPS = [
    { app: "Sales", known: "organizations" },
    { app: "Commerce", known: "organizations" },
    { app: "Marketing", known: "organizations" },
    { app: "Maintenance", known: "organizations" },
    { app: "Manufacturing", known: "organizations" },
    { app: "People", known: "employers" },
]
const PROTOTYPE_NAMES = ["__proto__", "constructor", "toString", "hasOwnProperty", "valueOf"]
feature("v5.0.0-15.3.6: an app's choices take a prototype name as unknown, never as a source", {
    when() {
        const { username, password } = account()
        const s = signIn(username, password)
        const ask = (app, choice) => s.get(`/apps/${app}/Home/choices`, { params: { choice }, accept: "json" })
        const apps = []
        for (const { app, known } of CHOICE_APPS) {
            const control = ask(app, known)
            if (!isList(control)) continue
            const unknown = ask(app, `proofNoSuchChoice${Date.now()}`)
            apps.push({ app, control, unknown, prototype: PROTOTYPE_NAMES.map((name) => ({ name, res: ask(app, name) })) })
        }
        if (!apps.length) skip(`${username} opens none of ${CHOICE_APPS.map(({ app }) => app).join(", ")}`)
        return { apps }
    },
    then({ apps }) {
        // the control: each app answered its known choice with a list
        apps.every(({ control }) => isList(control))
        apps.every(({ unknown, prototype }) =>
            prototype.every(({ res }) => !isList(res) && res.status == unknown.status && res.text == unknown.text))
    },
})

// BOSS writes are screen transitions that are not read-only, which take their fields from the request's body: a field in
// the URL is refused (the framework's rule for a writing transition) before the service runs, so a value in the query
// cannot stand in for or beside the body's; a field repeated in the body reaches the service as one value holding both,
// not either one alone. Commons Notes stands for the writes: the account's own notes, the one the control makes deleted
// after.
// The control: the same body with no URL field makes the note, found by its title.
// Does not prove: BOSS's read-only transitions (finds, exports, previews), which take the query by design and change
// nothing; nor cookies and headers, which the framework never makes parameters (its own proofs).
feature("v5.0.0-15.3.7: a BOSS write takes its fields from the body; a URL field is refused", {
    when() {
        const { username, password } = account()
        const s = signIn(username, password)
        const stamp = String(Date.now())
        const titles = () => (s.get("/apps/Commons/Notes/notes", { params: { text: stamp }, accept: "json" }).json().noteList ?? [])
            .map((note) => ({ wikiPageId: note.wikiPageId, title: note.title }))
        const queried = s.post("/apps/Commons/Notes/createNote", {
            params: { title: `Proof ${stamp} query` }, form: { title: `Proof ${stamp} body` }, accept: "json" })
        const afterQuery = titles()
        const repeated = s.post("/apps/Commons/Notes/createNote", { body: `title=Proof+${stamp}+first&title=Proof+${stamp}+second`,
            headers: { "Content-Type": "application/x-www-form-urlencoded" }, accept: "json" })
        const plain = s.post("/apps/Commons/Notes/createNote", { form: { title: `Proof ${stamp} plain` }, accept: "json" })
        const after = titles()
        for (const { wikiPageId } of after) s.post("/apps/Commons/Notes/deleteNote", { form: { wikiPageId }, accept: "json" })
        return { stamp, queried, afterQuery, repeated, plain, after, left: titles() }
    },
    then({ stamp, queried, afterQuery, repeated, plain, after, left }) {
        queried.status == 400
        queried.text.includes("with URL parameters")
        afterQuery.length == 0
        repeated.status == 200
        after.some(({ title }) => title == `Proof ${stamp} first,Proof ${stamp} second`)
        !after.some(({ title }) => title == `Proof ${stamp} first` || title == `Proof ${stamp} second`)
        // the control: the body alone makes the note
        plain.status == 200
        after.some(({ title }) => title == `Proof ${stamp} plain`)
        left.length == 0
    },
})
