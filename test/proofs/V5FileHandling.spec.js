// OWASP ASVS 5.0.0 V5 File Handling: BOSS's proofs, each feature filed under the requirement its name starts with
// (docs/ASVS-Matrix.md, V5). They go through the record files panel every BOSS app mounts (Shared/RecordFiles.xml, here
// under the Commons root), on a request, as a staff member uploads and downloads a record's files.

// The request whose files the proof adds to: the demo's BOSS_DEMO_REQUEST, or a deployment's --param requestId=ID (a
// request the account may add files to; the proof removes the file it adds).
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
const FILES = "/apps/Commons/RecordFiles"

// The file the proof added, removed after it whatever happened.
let added = null

// Two names are uploaded: one with a quote, semicolons, an equals sign, spaces and a letter outside ASCII, which the upload
// keeps, and one with a line break before a header of its own, which the upload does not keep whole (the framework makes
// an uploaded name's control characters `_`). Each is served under one Content-Disposition whose quoted name holds no
// quote, semicolon, backslash, space or line break (the framework's sendResourceResponse, which every BOSS file download
// goes through, makes each `_`), with filename* carrying the stored name percent-encoded, and no header of the name's own.
// The control: the first download is the file, under the name the upload stored.
// Does not prove: the four print transitions of Purchasing and the price list (QuoteComparison, QuoteRequestDetail,
// AgreementDetail, PriceListDetail), which write their own quoted name of a record id the server made, no uploaded text;
// nor the files of the other record types, which go through the same transition.
const DISPOSITION = /^attachment; filename="[!#-:<-\[\]-~]*"; filename\*=utf-8''[A-Za-z0-9%._~-]*$/
feature("v5.0.0-5.4.2: a record file's uploaded name cannot add a header or a parameter to its download", {
    when() {
        if (!REQUEST) skip("no request to add a file to: pass --param requestId=ID, a request the account may add files to")
        const { username, password } = account()
        const s = signIn(username, password)
        const stamp = String(Date.now())
        const record = { recordEntity: "mantle.request.Request", recordId: REQUEST }
        added = { s, record, contentKeys: [] }
        const download = (fileName, text) => {
            const up = s.post(`${FILES}/upload`, {
                multipart: Object.assign({ contentFile: { fileName, text, contentType: "text/plain" } }, record),
                accept: "json",
            })
            const created = (up.status == 200 ? up.json().createdList ?? [] : [])[0]
            const file = created && (s.get(`${FILES}/filesData`, { params: record, accept: "json" }).json().fileList ?? [])
                .find((row) => String(row.contentKey).includes(`"${created.contentId}"`))
            assert(file, `${JSON.stringify(fileName)} was not added: HTTP ${up.status} ${up.text.slice(0, 300)}`)
            added.contentKeys.push(file.contentKey)
            return { stored: file.fileName, res: s.get(`${FILES}/download`, { params: Object.assign({ contentKey: file.contentKey }, record) }) }
        }
        const quoted = download(`proof${stamp} "q"; x=y; caf\u00e9.txt`, "A file a proof uploaded.")
        const broken = download(`proof${stamp}.txt\r\nX-Proof: 1\r\n.txt`, "Another file a proof uploaded.")
        return { stamp, quoted, broken }
    },
    then({ stamp, quoted, broken }) {
        // the control: the file itself, under the name the upload stored, its quote and semicolons kept
        quoted.res.status == 200
        quoted.res.text == "A file a proof uploaded."
        quoted.stored == `proof${stamp} "q"; x=y; caf\u00e9.txt`
        broken.res.status == 200
        !/[\r\n]/.test(broken.stored)
        const both = [quoted, broken]
        both.every(({ res }) => res.headers("content-disposition").length == 1 && res.header("x-proof") == null)
        both.every(({ stored, res }) => DISPOSITION.test(res.header("content-disposition") ?? "")
            && decodeURIComponent((res.header("content-disposition") ?? "").split("filename*=utf-8''")[1] ?? "") == stored)
    },
    cleanup() {
        if (!added) return
        const { s, record, contentKeys } = added
        added = null
        for (const contentKey of contentKeys) s.post(`${FILES}/remove`, { form: Object.assign({ contentKey }, record), accept: "json" })
    },
})
