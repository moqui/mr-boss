// Commons › Vault's rules on the server (mr-moqui plans/Vault-Instances.md V3; the screens are screen/Commons/Vault.xml and
// Vault.qvue, which call org.moqui.security.VaultServices over REST): a single-secret vault refuses a member and a recovery key,
// with the same parameters that make one when they are left out; and a private contact, a contact item in the user's vault, never
// reaches CardDAV: the user's address book over the DAV server (Mantle's contact adapter) lists the same cards, with the same
// collection tag, after the item is stored as before it. The item's body is stored here as the hex of its bytes, so a server that
// read vault items would find the name; the browser stores it sealed. These are the server's half of the plan's V3 rules (its
// regression row names them for mr-boss); the client's half, that Contacts merges a private contact with no request carrying it,
// is test/client/Commons/VaultLock.spec.js. Who holds a recovery key is told only to a holder of VAULT_RECOVERY or a member of a
// vault that lists the key.
// Run: ./moq test mr-boss --spec VaultCommons
const RUN = String(Date.now()).slice(-9)
const USERNAME = "vc.ana." + RUN
const PASSWORD = "Vault-commons-9!"
const SERVICES = "org.moqui.security.VaultServices."
const DAV = "org.moqui.resource.DavServices.serve#DavRequest"
// the shape of a password wrap at the Argon2id floor (the vault crate's JSON); the server keeps it and never opens it
const WRAP = {m_kib: 65536, t: 3, p: 1, salt: "00".repeat(16), sealed: "ab".repeat(60)}
const PRIVATE = {v: 1, type: "contact", name: "Quillon Privatesson", fields: {fullName: "Quillon Privatesson", email: "quillon@private.example"}}
const s = {}

const hexOf = (text) => Array.from(unescape(encodeURIComponent(text))).map((ch) => ch.charCodeAt(0).toString(16).padStart(2, "0")).join("")
// a vault service as its caller: its answer, or its errors as text
function attempt(name, parameters) {
    let out = {}
    let thrown = ""
    try {
        out = ec.service.sync().name(SERVICES + name).parameters(parameters).call() || {}
    } catch (err) {
        thrown = String(err.message || err)
    }
    const errors = thrown + (ec.message.hasError() ? ec.message.errorsString : "")
    ec.message.clearErrors()
    return Object.assign({errors}, out)
}
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
function base64(text) {
    const bytes = Array.from(unescape(encodeURIComponent(text))).map((ch) => ch.charCodeAt(0))
    let out = ""
    for (let i = 0; i < bytes.length; i += 3) {
        const [a, b, c] = [bytes[i], bytes[i + 1], bytes[i + 2]]
        const n = (a << 16) | ((b ?? 0) << 8) | (c ?? 0)
        out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + (b == null ? "=" : B64[(n >> 6) & 63]) + (c == null ? "=" : B64[n & 63])
    }
    return out
}
function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try {
        return run()
    } finally {
        if (!wasDisabled) ec.artifactExecution.enableAuthz()
    }
}
// one request as a phone sends it, with the user's app password; it runs in a context of its own, with authorization on
const dav = (method, path, body, headers) => sys(() => call(DAV, {method, path, body: body ?? null,
    headers: Object.assign({Authorization: `Basic ${base64(`${USERNAME}:${s.appPassword}`)}`}, headers || {})}))
const PROPFIND = `<?xml version="1.0"?><D:propfind xmlns:D="DAV:" xmlns:CS="http://calendarserver.org/ns/"><D:prop>
    <D:resourcetype/><D:getetag/><CS:getctag/></D:prop></D:propfind>`
// the book as a phone sees it: its collection tag and the cards in it
function book() {
    const listed = dav("PROPFIND", `/dav/addressbooks/${USERNAME}/${s.bookId}/`, PROPFIND, {Depth: "1"})
    const body = String(listed.body || "")
    const ctag = (body.match(/<CS:getctag>([^<]*)<\/CS:getctag>/) || [])[1] || ""
    const cards = (body.match(/<D:href>[^<]*\.vcf<\/D:href>/g) || []).sort()
    return {status: listed.status, ctag, cards, body}
}

spec({
    setupSpec() {
        login("john.doe")
        sys(() => {
            const partyId = call("mantle.party.PartyServices.create#Person", {firstName: "Ana", lastName: "Vaultcommons"}).partyId
            call("mantle.party.PartyServices.create#PartyUserAccount", {partyId, emailAddress: USERNAME + "@example.com", username: USERNAME,
                newPassword: PASSWORD, newPasswordVerify: PASSWORD, timeZone: "America/Chicago"})
        })
    },
    // a password sign-in: recent, as changing a member list needs
    setup() { login(USERNAME, PASSWORD) },
    cleanupSpec() { login("john.doe") }
})

feature("a single-secret vault refuses a member and a recovery key; left out, the same parameters make one", {
    when() {
        const single = {vaultKindEnumId: "VkPersonal", lockEnumId: "VlSingleSecret", secretKindEnumId: "VsPassword", secretWrap: WRAP}
        const withRecovery = attempt("create#Vault", Object.assign({vaultId: "vc-rec-" + RUN, recoveryOn: "Y"}, single))
        const withMembers = attempt("create#Vault", Object.assign({vaultId: "vc-mem-" + RUN, entry: {vault_id: "vc-mem-" + RUN, version: 1, revision: 1},
            memberWraps: [{vault_id: "vc-mem-" + RUN, key_version: 1}]}, single))
        const made = attempt("create#Vault", Object.assign({vaultId: "vc-ok-" + RUN}, single))
        const member = attempt("add#VaultMember", {vaultId: "vc-ok-" + RUN, expectedRevision: 1, entry: {vault_id: "vc-ok-" + RUN, version: 1, revision: 2},
            wrap: {vault_id: "vc-ok-" + RUN, key_version: 1}})
        const vault = attempt("get#Vault", {vaultId: "vc-ok-" + RUN})
        return {withRecovery, withMembers, made, member, vault}
    },
    then({withRecovery, withMembers, made, member, vault}) {
        withRecovery.errors.includes("single-secret vault has no recovery")
        withMembers.errors.includes("single-secret vault has no members")
        made.errors == ""
        made.vaultId == "vc-ok-" + RUN
        member.errors.includes("single-secret vault has no members")
        vault.vault.recoveryOn == "N"
        vault.memberList.length == 0
        vault.entries.length == 0
    }
})

feature("a private contact in the user's vault never reaches their address book over CardDAV", {
    when() {
        // as Mantle's Dav spec makes them: the user's app password and default book, with authorization off
        sys(() => {
            s.appPassword = call("org.moqui.impl.UserServices.create#UserAppPassword", {name: "Ana's phone", scope: "dav"}).password
            s.bookId = call("mantle.party.ContactBookServices.ensure#UserDefaultContactBook", {}).contactBookId
        })
        // a contact the phone put in the book, which it lists
        const card = ["BEGIN:VCARD", "VERSION:3.0", "UID:vc-card-1", "FN:Pat Control", "N:Control;Pat;;;", "EMAIL:pat@control.example", "END:VCARD", ""].join("\r\n")
        const put = dav("PUT", `/dav/addressbooks/${USERNAME}/${s.bookId}/vc-card-1.vcf`, card)
        const before = book()
        const vaultId = "vc-dav-" + RUN
        const made = attempt("create#Vault", {vaultId, vaultKindEnumId: "VkPersonal", lockEnumId: "VlSingleSecret", secretKindEnumId: "VsPassword", secretWrap: WRAP})
        const item = attempt("create#VaultItem", {vaultId, vaultItemId: "vc-dav-item-" + RUN, keyVersion: 1, wrappedItemKey: "aa".repeat(60),
            bodyCipher: hexOf(JSON.stringify(PRIVATE)).padEnd(512, "0")})
        const after = book()
        const query = dav("REPORT", `/dav/addressbooks/${USERNAME}/${s.bookId}/`, `<?xml version="1.0"?><CR:addressbook-multiget xmlns:D="DAV:"
            xmlns:CR="urn:ietf:params:xml:ns:carddav"><D:prop><D:getetag/><CR:address-data/></D:prop>${after.cards.join("")}</CR:addressbook-multiget>`, {Depth: "1"})
        const home = dav("PROPFIND", `/dav/addressbooks/${USERNAME}/`, PROPFIND, {Depth: "1"})
        return {put, before, made, item, after, query, home}
    },
    then({put, before, made, item, after, query, home}) {
        put.status == 201
        before.status == 207
        before.cards.length == 1
        made.errors == ""
        item.revision == 1
        // the same cards and the same collection tag: the vault item made no card and changed nothing a phone syncs
        after.cards == before.cards
        after.ctag == before.ctag
        query.status == 207
        String(query.body).includes("FN:Pat Control")
        !String(query.body).includes("Privatesson")
        !String(after.body).includes("Privatesson")
        !String(home.body).includes("Privatesson")
        !String(home.body).includes("vc-dav-")
    }
})

// Who holds a recovery key, and which groups may keep one, are told only to a holder of VAULT_RECOVERY (who alone makes a
// recovery key) or, for a key's holders, to a member of a vault that lists that key; a recovery key's maker, whose key a
// manager checks to turn recovery on, is named while the key lasts. Ana holds no VAULT_RECOVERY and is in no such vault.
feature("a recovery key's holders and the recovery groups are not told to a user without VAULT_RECOVERY", {
    when() {
        const PEOPLE = "ironstone.commons.VaultPeopleServices."
        const ids = sys(() => {
            const me = ec.user.userId
            const maker = ec.entity.find("moqui.security.UserAccount").condition("username", "john.doe").one().userId
            const holder = Array.from(ec.entity.find("moqui.security.UserAccount").condition("userId", "not-in", [me, maker])
                .orderBy("userId").limit(1).list())[0].userId
            const now = ec.user.nowTimestamp
            ec.entity.makeValue("moqui.security.vault.VaultRecoveryKey").setAll({recoveryKeyId: "vc-rk-" + RUN, makerUserId: maker,
                sharesNeeded: 2, sharesTotal: 3, fromDate: now}).create()
            ec.entity.makeValue("moqui.security.vault.VaultRecoveryHolder").setAll({recoveryKeyId: "vc-rk-" + RUN, userId: holder,
                shareIndex: 1, fromDate: now}).create()
            // an ended key whose maker is the holder: not named for having made it
            ec.entity.makeValue("moqui.security.vault.VaultRecoveryKey").setAll({recoveryKeyId: "vc-rk-old-" + RUN, makerUserId: holder,
                sharesNeeded: 2, sharesTotal: 3, fromDate: now, thruDate: new Date(Date.now() - 1000)}).create()
            return {maker, holder}
        })
        const run = (name, parameters) => sys(() => ec.service.sync().name(PEOPLE + name).parameters(parameters).call() || {})
        return Object.assign({
            hasRecovery: ec.user.hasPermission("VAULT_RECOVERY"),
            names: run("get#VaultUserNames", {userIds: [ids.maker, ids.holder].join(",")}).names || {},
            holders: run("search#VaultPeople", {term: "", recoveryHolders: true}).optionList || [],
            groups: run("search#RecoveryGroups", {term: ""}).optionList || []
        }, ids)
    },
    then({hasRecovery, names, holders, groups, maker, holder}) {
        hasRecovery == false
        names[holder] == null
        names[maker] != null
        holders.length == 0
        groups.length == 0
    }
})
