// Personal vaults end to end (mr-moqui plans/Vault-Instances.md V3, §3.1 to §3.11): what Commons › Vault does in the browser's
// worker, done here by the test client's vault member (the vault crate's session run natively, as the worker runs it) over the
// vault REST services, with three users who sign in with a password and a second factor (VaultClientFixtures). Both locks: a
// single-secret vault opens on another device with its password only; a shared-key vault opens only through its signed member
// list. A share: a member added after the fingerprints are compared both ways reads and writes, and an item sent to someone is
// filed into their own vault. A removal: the vault key is rotated, the removed member gets nothing, a write at the old key version
// is refused, and the remaining member opens the new version. A recovery: a forgotten passphrase is replaced with the recovery
// code; a member who lost both makes a new key, which opens nothing until another member compares it and gives it access again.
// Organization recovery (§3.10, phase V4): two holders recover the vault to a member's new key, which opens it.
// Run: ./moq accept mr-boss --spec VaultPersonal
const RUN = String(Date.now())
const USERS = [
    ["ana", "vault.ana", "VaultAna1!!", "70319001"],
    ["ben", "vault.ben", "VaultBen1!!", "70319002"],
    ["cal", "vault.cal", "VaultCal1!!", "70319003"]
]
const LOGIN = {v: 1, type: "login", name: "Bank of Example", fields: {username: "ana-at-bank", password: "hunter2-very-secret"}}
const u = {}
const s = {}

const api = (user, method, path, body) => {
    const opts = method === "GET" ? {params: body || {}, accept: "json"} : {json: body || {}, accept: "json"}
    const res = user.s.request(method, "/rest/s1/vault" + path, opts)
    let value = {}
    try { value = JSON.parse(res.text) || {} } catch (e) { value = {text: res.text} }
    return Object.assign({status: res.status}, value)
}
const refused = (answer, text) => (answer.status >= 400 || !!answer.errors) && JSON.stringify(answer).includes(text)
const checks = (user) => api(user, "GET", "/keyChecks").keyCheckList || []
// `from` compares `to`'s fingerprint (computed in from's own client from the key the server gave), then stores the check
const check = (from, to) => {
    const key = api(from, "GET", "/publicKey", {userId: to.userId})
    const words = from.c.call("fingerprint", {public: key.public}).fingerprint
    const made = from.c.call("key_check_make", {checked_key_id: key.personalKeyId, checked_user_id: key.userId, checked_public: key.public,
        fingerprint: words, checked_at: Date.now()})
    const stored = api(from, "POST", "/keyChecks", {check: made})
    if (stored.status >= 400 || stored.errors) throw new Error("store#KeyCheck: " + JSON.stringify(stored))
}
const member = (user, role) => ({user_id: user.userId, role, key_id: user.keyId, public: user.public})
const seal = (user, vaultId, keyVersion, itemId, body) => user.c.call("item_seal", {vault_id: vaultId, item_id: itemId, key_version: keyVersion, body: JSON.stringify(body)})
const store = (user, vaultId, keyVersion, itemId, body) => {
    const sealed = seal(user, vaultId, keyVersion, itemId, body)
    return api(user, "POST", `/vaults/${vaultId}/items`, {vaultItemId: itemId, keyVersion, wrappedItemKey: sealed.wrapped_item_key, bodyCipher: sealed.sealed_body})
}
// a user's client, or another vault client (a second device), opens one item
const openItem = (who, vaultId, row) => JSON.parse((who.c || who).call("item_open", {vault_id: vaultId, item_id: row.vaultItemId, key_version: row.keyVersion,
    wrapped_item_key: row.wrappedItemKey, sealed_body: row.bodyCipher}).body)
// a member opens a shared vault's current key through its member list, as Commons › Vault does
const openShared = (user, vaultId, recoveryKeys) => {
    const vault = api(user, "GET", `/vaults/${vaultId}`)
    if (!vault.wraps) return {ok: false, error: JSON.stringify(vault).slice(0, 300)}
    const wrap = vault.wraps.find((w) => w.key_version === vault.vault.keyVersion)
    if (!wrap) return {ok: false, error: "no wrap of the current key version"}
    const opened = user.c.try("vault_key_open", {entries: vault.entries, key_checks: checks(user), recovery_keys: recoveryKeys || [], wrap,
        remembered: user.remembered[vaultId] || null})
    if (opened.ok) user.remembered[vaultId] = opened.result.remembered
    return Object.assign(opened, {vault})
}
const signIn = (username, password, code) => {
    const signed = session()
    const res = signed.post("/rest/login", {json: {username, password, code}, accept: "json", csrf: false})
    if (res.status >= 400 || !JSON.parse(res.text).loggedIn) throw new Error(`login of ${username}: ${res.status} ${res.text.slice(0, 200)}`)
    return signed
}

spec({
    timeout: 120,
    stepwise: true,
    setupSpec() {
        needsFixtures("the vault walk's users (VaultClientFixtures)")
        for (const [name, username, password, code] of USERS) {
            const user = {s: signIn(username, password, code), remembered: {}}
            const key = api(user, "GET", "/personalKey")
            if (key.hasKey) skip("the walk's users have vault keys from an earlier run: run it on a fresh database (--serve)")
            u[name] = Object.assign(user, {c: vault.client(), userId: key.userId, username, password})
        }
    }
})

feature("each user sets up a vault key, with its recovery code, after a strong sign-in", {
    when() {
        const out = {}
        for (const name of Object.keys(u)) {
            const user = u[name]
            user.keyId = `vp-${name}-${RUN}`
            const made = user.c.call("personal_make", {personal_key_id: user.keyId, user_id: user.userId, passphrase: `${name} long pass phrase ${RUN}`})
            user.public = made.public
            user.recoveryCode = made.recovery_code
            out[name] = api(user, "POST", "/personalKey", {personalKeyId: user.keyId, public: made.public, passphraseWrap: made.passphrase_wrap,
                recoveryWrap: made.recovery_wrap})
        }
        return out
    },
    then(out) {
        out.ana.personalKeyId == u.ana.keyId
        out.ben.personalKeyId == u.ben.keyId
        out.cal.personalKeyId == u.cal.keyId
        out.ana.fingerprint.split("-").length == 6
    }
})

feature("both locks: a single-secret vault opens elsewhere with its password only, and refuses members; a shared-key vault holds an item", {
    when() {
        const {ana} = u
        // single secret, as New vault makes it after §3.11's steps
        s.single = `vp-single-${RUN}`
        ana.c.call("vault_key_new", {vault_id: s.single, key_version: 1})
        const secretWrap = ana.c.call("vault_key_password_wrap", {vault_id: s.single, key_version: 1, password: "Single-secret password 2026!"})
        const madeSingle = api(ana, "POST", "/vaults", {vaultId: s.single, vaultKindEnumId: "VkPersonal", lockEnumId: "VlSingleSecret",
            secretKindEnumId: "VsPassword", secretWrap})
        store(ana, s.single, 1, `vp-single-item-${RUN}`, LOGIN)
        // another device of Ana's: only the password opens it
        const device = vault.client()
        const got = api(ana, "GET", `/vaults/${s.single}`)
        const wrong = device.try("vault_key_password_open", {vault_id: s.single, key_version: 1, wrap: got.secretWrap, password: "not the password at all"})
        const right = device.try("vault_key_password_open", {vault_id: s.single, key_version: 1, wrap: got.secretWrap, password: "Single-secret password 2026!"})
        const row = api(ana, "GET", `/vaults/${s.single}/items`).itemList[0]
        const body = openItem(device, s.single, row)
        device.close()
        const noMember = api(ana, "POST", `/vaults/${s.single}/members`, {expectedRevision: got.vault.revision, entry: {vault_id: s.single, version: 1, revision: 2},
            wrap: {vault_id: s.single, key_version: 1}})
        // shared key, Ana its only member yet
        s.shared = `vp-shared-${RUN}`
        const entry = ana.c.call("key_version_first", {vault_id: s.shared, members: [member(ana, "manage")], key_checks: checks(ana)})
        ana.c.call("vault_key_new", {vault_id: s.shared, key_version: 1})
        const wrap = ana.c.call("vault_key_wrap_member", {vault_id: s.shared, key_version: 1, member_user_id: ana.userId, member_key_id: ana.keyId,
            member_public: ana.public, key_checks: checks(ana)})
        const madeShared = api(ana, "POST", "/vaults", {vaultId: s.shared, vaultKindEnumId: "VkPersonal", lockEnumId: "VlSharedKey", recoveryOn: "N",
            entry, memberWraps: [wrap]})
        s.item = `vp-shared-item-${RUN}`
        const item = store(ana, s.shared, 1, s.item, LOGIN)
        const served = JSON.stringify([api(ana, "GET", `/vaults/${s.shared}`), api(ana, "GET", `/vaults/${s.shared}/items`), api(ana, "GET", "/vaults")])
        return {madeSingle, wrong, right, body, noMember, madeShared, item, served}
    },
    then({madeSingle, wrong, right, body, noMember, madeShared, item, served}) {
        madeSingle.vaultId == s.single
        wrong.ok == false
        right.ok == true
        body.fields.password == "hunter2-very-secret"
        refused(noMember, "no members")
        madeShared.vaultId == s.shared
        item.revision == 1
        !served.includes("Bank of Example")
        !served.includes("hunter2")
    }
})

feature("a share: Ben, added after both compared fingerprints, opens the vault through its member list, reads and writes; an item sent to Cal is filed in Cal's vault", {
    when() {
        const {ana, ben, cal} = u
        // Ben's client refuses the vault before he has compared Ana's key, and Ana cannot add Ben before she compared his
        const vault0 = api(ana, "GET", `/vaults/${s.shared}`)
        const members = [member(ana, "manage"), member(ben, "write")]
        const unchecked = ana.c.try("key_version_next", {entries: vault0.entries, key_checks: checks(ana), members, version: 1, revision: 2})
        check(ana, ben)
        const entry = ana.c.call("key_version_next", {entries: vault0.entries, key_checks: checks(ana), members, version: 1, revision: 2})
        const wrap = ana.c.call("vault_key_wrap_member", {vault_id: s.shared, key_version: 1, member_user_id: ben.userId, member_key_id: ben.keyId,
            member_public: ben.public, key_checks: checks(ana)})
        const added = api(ana, "POST", `/vaults/${s.shared}/members`, {expectedRevision: vault0.vault.revision, entry, wrap})
        const beforeCheck = openShared(ben, s.shared)
        check(ben, ana)
        const opened = openShared(ben, s.shared)
        const row = api(ben, "GET", `/vaults/${s.shared}/items`).itemList.find((i) => i.vaultItemId === s.item)
        const read = openItem(ben, s.shared, row)
        const written = store(ben, s.shared, 1, `vp-ben-item-${RUN}`, {v: 1, type: "note", name: "Ben's note", fields: {text: "from Ben"}})
        // a copy sent to Cal, who files it into a single-secret vault of her own
        check(ana, cal)
        check(cal, ana)
        const sent = ana.c.call("delivery_send", {delivery_id: `vp-dlv-${RUN}`, to_user_id: cal.userId, to_key_id: cal.keyId, to_public: cal.public,
            purpose: "item", value: JSON.stringify(LOGIN), key_checks: checks(ana)})
        api(ana, "POST", "/deliveries", {delivery: sent})
        s.calVault = `vp-cal-${RUN}`
        cal.c.call("vault_key_new", {vault_id: s.calVault, key_version: 1})
        api(cal, "POST", "/vaults", {vaultId: s.calVault, vaultKindEnumId: "VkPersonal", lockEnumId: "VlSingleSecret", secretKindEnumId: "VsPassword",
            secretWrap: cal.c.call("vault_key_password_wrap", {vault_id: s.calVault, key_version: 1, password: "Cal's own vault password 9!"})})
        const incoming = api(cal, "GET", "/deliveries").deliveryList.find((d) => d.deliveryId === `vp-dlv-${RUN}`)
        const value = cal.c.call("delivery_open", {delivery: incoming.delivery, sender_public: incoming.senderPublic, key_checks: checks(cal)}).value
        store(cal, s.calVault, 1, `vp-cal-item-${RUN}`, JSON.parse(value))
        const filed = api(cal, "POST", `/deliveries/${incoming.deliveryId}/file`, {})
        const calRow = api(cal, "GET", `/vaults/${s.calVault}/items`).itemList[0]
        return {unchecked, added, beforeCheck, opened, read, written, filed, calItem: openItem(cal, s.calVault, calRow), left: api(cal, "GET", "/deliveries").deliveryList}
    },
    then({unchecked, added, beforeCheck, opened, read, written, filed, calItem, left}) {
        unchecked.ok == false
        unchecked.error.includes("has not been checked")
        added.revision > 1
        beforeCheck.ok == false
        opened.ok == true
        read.fields.password == "hunter2-very-secret"
        written.revision == 1
        filed.deliveryId == `vp-dlv-${RUN}`
        calItem.name == "Bank of Example"
        left.length == 0
    }
})

feature("a removal: Cal joins, Ben is removed with the vault key rotated; Ben gets nothing, the old key version is refused, Cal opens the new one", {
    when() {
        const {ana, ben, cal} = u
        const vault0 = api(ana, "GET", `/vaults/${s.shared}`)
        const latest = vault0.entries[vault0.entries.length - 1]
        const members = latest.members.concat([member(cal, "read")])
        const entry = ana.c.call("key_version_next", {entries: vault0.entries, key_checks: checks(ana), members, version: latest.version,
            revision: latest.revision + 1, remembered: null})
        const wrap = ana.c.call("vault_key_wrap_member", {vault_id: s.shared, key_version: 1, member_user_id: cal.userId, member_key_id: cal.keyId,
            member_public: cal.public, key_checks: checks(ana)})
        api(ana, "POST", `/vaults/${s.shared}/members`, {expectedRevision: vault0.vault.revision, entry, wrap})
        const calBefore = openShared(cal, s.shared)
        // the removal, as Members › Remove makes it: one change from the revision it read
        const vault1 = api(ana, "GET", `/vaults/${s.shared}`)
        const items = api(ana, "GET", `/vaults/${s.shared}/items`).itemList
        const latest1 = vault1.entries[vault1.entries.length - 1]
        const rotated = ana.c.call("vault_rotate", {entries: vault1.entries, key_checks: checks(ana), members: latest1.members.filter((m) => m.user_id !== ben.userId),
            items: items.map((row) => ({item_id: row.vaultItemId, wrapped_item_key: row.wrappedItemKey}))})
        const removed = api(ana, "POST", `/vaults/${s.shared}/removeMember`, {userId: ben.userId, expectedRevision: vault1.vault.revision, entry: rotated.entry,
            itemKeys: rotated.item_keys, memberWraps: rotated.member_wraps})
        const benVault = api(ben, "GET", `/vaults/${s.shared}`)
        const benItems = api(ben, "GET", `/vaults/${s.shared}/items`)
        const old = seal(ana, s.shared, 1, s.item, LOGIN)
        const row = api(ana, "GET", `/vaults/${s.shared}/items`).itemList.find((i) => i.vaultItemId === s.item)
        const oldWrite = api(ana, "PUT", `/items/${s.item}`, {expectedRevision: row.revision, keyVersion: 1, wrappedItemKey: old.wrapped_item_key, bodyCipher: old.sealed_body})
        const calAfter = openShared(cal, s.shared)
        const calRow = api(cal, "GET", `/vaults/${s.shared}/items`).itemList.find((i) => i.vaultItemId === s.item)
        const events = api(ana, "GET", `/vaults/${s.shared}/events`).eventList.map((e) => e.eventTypeEnumId)
        return {calBefore, removed, benVault, benItems, oldWrite, calAfter, calRead: openItem(cal, s.shared, calRow), events}
    },
    then({calBefore, removed, benVault, benItems, oldWrite, calAfter, calRead, events}) {
        calBefore.ok == true
        removed.keyVersion == 2
        refused(benVault, "No vault")
        benVault.wraps == null
        refused(benItems, "No vault")
        refused(oldWrite, "key changed")
        calAfter.ok == true
        calAfter.result.key_version == 2
        calRead.fields.password == "hunter2-very-secret"
        events.includes("VeMemberAdded")
        events.includes("VeMemberRemoved")
        events.includes("VeKeyRotated")
    }
})

feature("a recovery: Ben's forgotten passphrase is replaced with his recovery code; Cal's new key, after she lost both, opens the vault once Ana compared it and gave it access", {
    when() {
        const {ana, ben, cal} = u
        // Ben, on a new device, without his passphrase
        const benDevice = vault.client()
        const wrapped = api(ben, "GET", "/personalKey/wrapped")
        const wrongCode = benDevice.try("personal_open_recovery", {personal_key_id: wrapped.personalKeyId, user_id: ben.userId, public: wrapped.public,
            recovery_wrap: wrapped.recoveryWrap, recovery_code: u.cal.recoveryCode})
        benDevice.call("personal_open_recovery", {personal_key_id: wrapped.personalKeyId, user_id: ben.userId, public: wrapped.public,
            recovery_wrap: wrapped.recoveryWrap, recovery_code: ben.recoveryCode})
        const rewrap = benDevice.call("personal_rewrap", {passphrase: `ben's new pass phrase ${RUN}`})
        const rewrapped = api(ben, "POST", "/personalKey/rewrap", {personalKeyId: rewrap.personal_key_id, passphraseWrap: rewrap.passphrase_wrap})
        benDevice.close()
        const again = vault.client()
        const fetched = api(ben, "GET", "/personalKey/wrapped")
        const withNew = again.try("personal_open", {personal_key_id: fetched.personalKeyId, user_id: ben.userId, public: fetched.public,
            passphrase_wrap: fetched.passphraseWrap, passphrase: `ben's new pass phrase ${RUN}`})
        again.close()

        // Cal lost her passphrase and her recovery code: a new key, which nothing is wrapped to yet
        cal.c.close()
        cal.c = vault.client()
        cal.remembered = {}
        cal.keyId = `vp-cal-2-${RUN}`
        const made = cal.c.call("personal_make", {personal_key_id: cal.keyId, user_id: cal.userId, passphrase: `cal's second pass phrase ${RUN}`})
        cal.public = made.public
        const replaced = api(cal, "POST", "/personalKey/replace", {personalKeyId: cal.keyId, public: made.public, passphraseWrap: made.passphrase_wrap,
            recoveryWrap: made.recovery_wrap})
        const vault2 = api(ana, "GET", `/vaults/${s.shared}`)
        const latest = vault2.entries[vault2.entries.length - 1]
        const members = latest.members.filter((m) => m.user_id !== cal.userId).concat([member(cal, "read")])
        // Ana's client wraps nothing to the changed key before she compares it again
        const beforeCheck = ana.c.try("vault_key_wrap_member", {vault_id: s.shared, key_version: latest.version, member_user_id: cal.userId, member_key_id: cal.keyId,
            member_public: cal.public, key_checks: checks(ana)})
        check(ana, cal)
        check(cal, ana)
        const entry = ana.c.call("key_version_next", {entries: vault2.entries, key_checks: checks(ana), members, version: latest.version, revision: latest.revision + 1})
        const wrap = ana.c.call("vault_key_wrap_member", {vault_id: s.shared, key_version: latest.version, member_user_id: cal.userId, member_key_id: cal.keyId,
            member_public: cal.public, key_checks: checks(ana)})
        const regranted = api(ana, "POST", `/vaults/${s.shared}/members`, {expectedRevision: vault2.vault.revision, entry, wrap})
        const calOpened = openShared(cal, s.shared)
        const calRow = api(cal, "GET", `/vaults/${s.shared}/items`).itemList.find((i) => i.vaultItemId === s.item)
        const calEvents = api(cal, "GET", "/events").eventList.map((e) => e.eventTypeEnumId)
        return {wrongCode, rewrapped, withNew, replaced, beforeCheck, regranted, calOpened, calRead: openItem(cal, s.shared, calRow), calEvents}
    },
    then({wrongCode, rewrapped, withNew, replaced, beforeCheck, regranted, calOpened, calRead, calEvents}) {
        wrongCode.ok == false
        rewrapped.personalKeyId == u.ben.keyId
        withNew.ok == true
        replaced.personalKeyId == u.cal.keyId
        beforeCheck.ok == false
        beforeCheck.error.includes("has not been checked")
        regranted.revision > 1
        calOpened.ok == true
        calRead.fields.password == "hunter2-very-secret"
        calEvents.includes("VePersonalKeyReplaced")
    }
})

// Organization recovery (§3.10, phase V4), as Admin › Security › Recovery keys and Commons › Vault's Members do it: Cal makes a
// recovery key split 2 of 2 between Ben and herself (each key compared), Ana turns recovery on for the shared vault after
// comparing the key's maker, then loses her key and makes a new one; Cal starts the recovery after comparing Ana's new key, Ben
// compares Cal's and Ana's new keys and seals his share to it, and Cal finishes it: the shares combined in her client, the vault
// key opened through the recovery key's wrap and given to Ana's new key (and, Ana having been a manager whose wraps no longer
// carry a manager's signature, Cal's wrap remade). Ana's new client opens the vault through the recovery key's signed member
// list and reads the item; the recovery is an event, and the key is marked used.
feature("organization recovery: two holders recover the shared vault to Ana's new key, which opens it", {
    when() {
        const {ana, ben, cal} = u
        const held = (user, id) => api(user, "GET", "/recoveryKeys").recoveryKeyList.find((k) => k.recoveryKeyId === id).holders.find((h) => h.userId === user.userId).held
        const ok = (answer, what) => {
            if (answer.status >= 400 || answer.errors) throw new Error(`${what}: ${JSON.stringify(answer).slice(0, 400)}`)
            return answer
        }
        // Cal makes the recovery key, after comparing Ben's key
        check(cal, ben)
        const recoveryKeyId = `vp-rk-${RUN}`
        const made = cal.c.call("recovery_make", {recovery_key_id: recoveryKeyId, k: 2, key_checks: checks(cal),
            holders: [ben, cal].map((h) => ({user_id: h.userId, key_id: h.keyId, public: h.public}))})
        ok(api(cal, "POST", "/recoveryKeys", {record: made.record, shares: made.shares}), "create#VaultRecoveryKey")
        const keyRow = api(ana, "GET", "/recoveryKeys").recoveryKeyList.find((k) => k.recoveryKeyId === recoveryKeyId)
        const recoveryKeys = [{record: keyRow.record, maker_public: keyRow.makerPublic}]

        // Ana turns recovery on (Cal's key compared before, in the recovery step)
        const vault0 = api(ana, "GET", `/vaults/${s.shared}`)
        const latest = vault0.entries[vault0.entries.length - 1]
        const recoveryMember = ana.c.call("recovery_member", {record: keyRow.record, maker_public: keyRow.makerPublic, key_checks: checks(ana)})
        const entry = ana.c.call("key_version_next", {entries: vault0.entries, key_checks: checks(ana), recovery_keys: recoveryKeys,
            members: latest.members.concat([recoveryMember]), version: latest.version, revision: latest.revision + 1})
        const wrap = ana.c.call("vault_key_wrap_member", {vault_id: s.shared, key_version: latest.version, member_user_id: recoveryMember.user_id,
            member_key_id: recoveryMember.key_id, member_public: recoveryMember.public, key_checks: checks(ana), recovery_keys: recoveryKeys})
        ok(api(ana, "POST", `/vaults/${s.shared}/members`, {expectedRevision: vault0.vault.revision, entry, wrap}), "add#VaultMember (recovery on)")
        const recoveryOn = api(ana, "GET", `/vaults/${s.shared}`).vault.recoveryOn

        // Ana loses her passphrase and recovery code: a new key
        ana.c.close()
        ana.c = vault.client()
        ana.remembered = {}
        ana.keyId = `vp-ana-2-${RUN}`
        const remade = ana.c.call("personal_make", {personal_key_id: ana.keyId, user_id: ana.userId, passphrase: `ana's second pass phrase ${RUN}`})
        ana.public = remade.public
        ok(api(ana, "POST", "/personalKey/replace", {personalKeyId: ana.keyId, public: remade.public, passphraseWrap: remade.passphrase_wrap,
            recoveryWrap: remade.recovery_wrap}), "replace#PersonalKey")

        // Cal compares Ana's new key and starts the recovery; Ben compares Cal's and Ana's new keys and seals his share
        check(cal, ana)
        const sessionId = `vp-rs-${RUN}`
        const session = cal.c.call("recovery_session_start", {session_id: sessionId, record: keyRow.record, maker_public: keyRow.makerPublic,
            held: held(cal, recoveryKeyId), vault_id: s.shared, subject_user_id: ana.userId, subject_key_id: ana.keyId, subject_public: ana.public,
            key_checks: checks(cal)})
        ok(api(cal, "POST", "/recoveries", {session}), "start#VaultRecovery")
        check(ben, cal)
        check(ben, ana)
        const row = api(ben, "GET", "/recoveries").sessionList.find((r) => r.recoverySessionId === sessionId)
        const share = ben.c.call("recovery_share_deliver", {record: keyRow.record, maker_public: keyRow.makerPublic, held: held(ben, recoveryKeyId),
            session: row.session, session_holder_public: row.holderPublic, session_holder: row.holderShare, key_checks: checks(ben)})
        ok(api(ben, "POST", `/recoveries/${sessionId}/shares`, {share}), "deliver#VaultRecoveryShare")

        // Cal finishes it in her client
        const open = api(cal, "GET", `/recoveries/${sessionId}`)
        // Cal is a member too, with that key version open: forgotten before the combine, as Admin › Security › Recovery keys does
        cal.c.call("vault_key_forget", {vault_id: s.shared, key_version: open.recoveryWrap.key_version})
        cal.c.call("recovery_combine", {session_id: sessionId, record: open.record, maker_public: open.makerPublic, held: open.held,
            deliveries: open.deliveries, key_checks: checks(cal)})
        const calChecks = checks(cal)
        cal.c.call("recovery_open_vault", {entries: open.entries, key_checks: calChecks, recovery_keys: recoveryKeys, session_id: sessionId, wrap: open.recoveryWrap})
        const rekeyed = cal.c.call("recovery_rekey", {session_id: sessionId, entries: open.entries, key_checks: calChecks, recovery_keys: recoveryKeys})
        const completed = api(cal, "POST", `/recoveries/${sessionId}/complete`, {expectedRevision: open.revision, entry: rekeyed.entry, wrap: rekeyed.wrap,
            rewraps: rekeyed.rewraps})

        // Ana's new client compares the recovery key's maker, opens the vault and reads the item
        check(ana, cal)
        const anaOpened = openShared(ana, s.shared, recoveryKeys)
        const anaRow = api(ana, "GET", `/vaults/${s.shared}/items`).itemList.find((i) => i.vaultItemId === s.item)
        const calOpened = openShared(cal, s.shared, recoveryKeys)
        const events = api(ana, "GET", `/vaults/${s.shared}/events`).eventList.map((e) => e.eventTypeEnumId)
        const used = api(ana, "GET", "/recoveryKeys").recoveryKeyList.find((k) => k.recoveryKeyId === recoveryKeyId).used
        return {recoveryOn, completed, anaOpened, anaRead: openItem(ana, s.shared, anaRow), calOpened, events, used, rewraps: (rekeyed.rewraps || []).map((w) => w.member_user_id)}
    },
    then({recoveryOn, completed, anaOpened, anaRead, calOpened, events, used, rewraps}) {
        recoveryOn == "Y"
        completed.revision > 0
        anaOpened.ok == true
        anaRead.fields.password == "hunter2-very-secret"
        // Ana's old key had signed Cal's wrap: the recovery remade it, and Cal still opens the vault
        rewraps.includes(u.cal.userId)
        calOpened.ok == true
        events.includes("VeRecoveryStarted")
        events.includes("VeRecoveryShared")
        events.includes("VeRecovery")
        used == true
    }
})
