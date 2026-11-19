// OWASP ASVS 5.0.0 V7 Session Management: BOSS's proofs, each feature filed under the requirement its name starts with
// (docs/ASVS-Matrix.md, V7). They go through Commons › Settings › Account as its user does. Signing out everywhere ends
// every session of the account, so this file runs last in the suite.

// ProofFixtures' boss.factor.proof: its password is set again, and its second factors removed, on every run.
const FACTOR_USER = "boss.factor.proof"
const FACTOR_PASSWORD = "BossFactorProof1!!"
const ACCOUNT = "/apps/Commons/Settings/Account"
// A session signed in through the sign-in form, with the session token its pages carry.
const signIn = (username, password) => {
    const s = session()
    const res = s.formLogin(username, password)
    assert(res.status == 302 && !(res.location ?? "").includes("/Login"), `the sign-in of ${username} did not succeed: HTTP ${res.status}`)
    s.get("/apps/Commons/Notes/notes", { accept: "json" })
    return s
}
// Account as its signed-in user sees it, else the redirect to /Login.
const accountPage = (s) => s.get(ACCOUNT)
const signedIn = (res) => res.status == 200 && res.text.includes("Where you are signed in")
// The ids of the factors Account lists with their Remove form.
const factorIds = (html) => Array.from(html.matchAll(/action="[^"]*\/removeFactor"><input type="hidden" name="moquiSessionToken" value="[^"]*"><input type="hidden" name="factorId" value="([^"]+)"/g))
    .map((match) => match[1])
const offersSignOut = (html) => html.includes(`action="${ACCOUNT}/signOutEverywhere"`)

// A factor change on Account (single use codes added, createUserAuthcFactorSingleUse, then each removed, removeFactor)
// returns to Account, which offers to sign out everywhere (signOutEverywhere: every session of the account, its login keys
// and app passwords, after a sign-in in the last five minutes); taking it ends the other session. The factor change itself
// leaves the other session signed in: the choice is the user's.
// The control: the other session was signed in before, and after the factor change.
// Does not prove: the per-session Sign out beside each session in "Where you are signed in", which lists another session
// as live once its server has written it (the framework's session flush, eventual by default, on the scheduler's pass),
// later than this proof runs; nor a factor added through the sign-in's own enrolment.
feature("v5.0.0-7.4.3: after a factor change Account offers to sign out the account's other sessions", {
    given() { needsFixtures(`the user ${FACTOR_USER}, whose second factors this proof changes`) },
    when() {
        const changer = signIn(FACTOR_USER, FACTOR_PASSWORD)
        const other = signIn(FACTOR_USER, FACTOR_PASSWORD)
        const before = signedIn(accountPage(other))
        const added = changer.post(`${ACCOUNT}/createUserAuthcFactorSingleUse`, { form: { numberOfCodes: "2" } })
        const afterAdd = accountPage(changer)
        const ids = factorIds(afterAdd.text)
        const removed = ids.map((factorId) => changer.post(`${ACCOUNT}/removeFactor`, { form: { factorId } }))
        const afterRemove = accountPage(changer)
        const otherAfterChange = signedIn(accountPage(other))
        const everywhere = changer.post(`${ACCOUNT}/signOutEverywhere`, {})
        return { before, added, afterAdd, ids, removed, afterRemove, otherAfterChange, everywhere, otherAfter: accountPage(other) }
    },
    then({ before, added, afterAdd, ids, removed, afterRemove, otherAfterChange, everywhere, otherAfter }) {
        // the control: the other session was signed in, and the factor change left it so
        before
        otherAfterChange
        added.status == 302
        (added.location ?? "").endsWith(ACCOUNT)
        afterAdd.text.includes("Write down these codes")
        ids.length == 2
        offersSignOut(afterAdd.text)
        removed.every((res) => res.status == 302 && (res.location ?? "").endsWith(ACCOUNT))
        factorIds(afterRemove.text).length == 0
        offersSignOut(afterRemove.text)
        everywhere.status == 302
        otherAfter.status == 302
        (otherAfter.location ?? "").includes("/Login")
    },
})
