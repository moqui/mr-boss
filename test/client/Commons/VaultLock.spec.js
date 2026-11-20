// Commons › Vault in the browser (mr-moqui plans/Vault-Instances.md V3, §3.6, §3.9): the real Vault.qvue and VaultContacts.qvue
// with the real vault module (webroot js/vault: VaultClient.js, its worker and moqui_vault.wasm, each loaded with its integrity
// hash), over an in-page stand-in for the vault REST services that keeps what a server keeps (test/client/pages/VaultStandIn.js).
// A private contact shows under Contacts while the vault is open, and no request carries it. An encrypted export opens only as
// an export. A removal the server refuses leaves no key version behind, so the same removal works next; a manager's changed key
// is given access with the wraps the server names to remake; the first write after a rotation makes a new item key. A masked
// value is not on the page until Show asks the worker for it, and the vault locks by itself after the idle time (a short one
// here, boss/vault@idle-minutes in a deployment), dropping the value and every key.
// Run: ./moq test-client mr-boss --offline --spec VaultLock (an offline spec: it needs no server)
const PASSWORD = "Tr0ub4dor-and-3-more!"
const SECRET = "s3cret-Value-shown-only-on-ask"
const PAGE = `<!doctype html><html><head><link rel="stylesheet" href="/libs/quasar/quasar.prod.css">
    <link rel="stylesheet" href="/css/WebrootVue.qvt.css"></head>
    <body><div id="app"></div><script src="/libs/vue/vue.global.prod.js"></script>
    <script src="/libs/quasar/quasar.umd.prod.js"></script><script src="/js/MoquiLib.js"></script>
    <script src="/js/WebrootVue.qvt.js"></script><script src="/files/component/mr-boss/test/client/pages/VaultStandIn.js"></script></body></html>`
let page

// the page with the component mounted, the setup transition's answer giving the integrity hashes and this idle time
function open(idleMinutes) {
    page.setContent(PAGE)
    page.waitFor(() => !!window.mountVault)
    page.evaluate(async (idle) => {
        await mountVault({userId: "U1", username: "vault.spec", idleMinutes: idle, clipboardSeconds: 30, recoveryHolder: false,
            integrity: {client: await sri("/js/vault/VaultClient.js"), worker: await sri("/js/vault/VaultWorker.js"), wasm: await sri("/js/vault/moqui_vault.wasm")},
            itemTypes: [{id: "login", label: "Login", fields: [{name: "username", label: "Username", kind: "text", masked: false},
                {name: "password", label: "Password", kind: "secret", masked: true}]},
                {id: "contact", label: "Private contact", fields: [{name: "fullName", label: "Name", kind: "text", masked: false},
                    {name: "email", label: "Email", kind: "text", masked: false}]}]})
        return true
    }, idleMinutes)
    page.waitFor(() => !!(window.BossVaultSession && BossVaultSession.S.personal && BossVaultSession.S.config), {timeout: 10})
}

spec({
    server: false,
    stepwise: true,
    timeout: 60,
    setupSpec() {
        page = browser.newPage({viewport: {width: 1280, height: 900}})
    }
})

feature("a private contact in an open vault shows under Contacts, marked, and no request carries it", {
    when() {
        open(1)
        page.evaluate(async (password) => {
            const s = window.BossVaultSession
            const vaultId = await s.makeVault("Home", "VlSingleSecret", "VsPassword", password)
            await s.saveItem(vaultId, null, {v: 1, type: "contact", name: "Quillon Privatesson", fields: {fullName: "Quillon Privatesson", email: "quillon@private.example"}})
            await s.loadItems(s.vault(vaultId))
            window.homeId = vaultId
            vm.contactsQuery.parameters = {text: "quillon", scope: "all"}
            return true
        }, PASSWORD)
        page.waitFor(() => !!document.querySelector(".boss-vault-contact"))
        return page.evaluate(() => ({
            row: document.querySelector(".boss-vault-contact").innerText,
            sent: store.sent.join("\n"),
            name: BossVaultSession.vault(homeId).name,
            stored: JSON.stringify(store.vaults) + JSON.stringify(store.items)
        }))
    },
    then({row, sent, name, stored}) {
        row.includes("Quillon Privatesson")
        row.includes("In your vault")
        !sent.includes("Quillon")
        !sent.includes("quillon@")
        // the vault's name is in its sealed header, never in the clear
        name == "Home"
        !stored.includes("Home")
    }
})

feature("an encrypted export opens with its password, and a file naming a vault's id or no export id is refused", {
    when() {
        return page.evaluate(async () => {
            const s = window.BossVaultSession
            const text = await s.exportVault(homeId, "Export pass phrase 77!")
            const json = JSON.parse(text)
            const tryRead = async (file) => { try { return (await s.readExport(file, "Export pass phrase 77!")).map((body) => body.name) } catch (err) { return "refused: " + err.message } }
            return {
                clear: text.includes("Quillon") || text.includes("Home"),
                asVault: await tryRead(Object.assign({}, json, {export_id: homeId})),
                noId: await tryRead(Object.assign({}, json, {export_id: "export-zz"})),
                read: await tryRead(json),
                again: await tryRead(json)
            }
        })
    },
    then({clear, asVault, noId, read, again}) {
        clear == false
        asVault.startsWith("refused")
        noId.startsWith("refused")
        read == ["Quillon Privatesson"]
        // the export's key is forgotten after each read, so the same file reads again
        again == ["Quillon Privatesson"]
    }
})

feature("a removal the server refuses leaves no key version behind; a manager's changed key gets access with the stranded wraps remade; a write after the rotation makes a new item key", {
    when() {
        return page.evaluate(async () => {
            const s = window.BossVaultSession
            const config = s.S.config
            await s.makeKey("the first user's long pass phrase")
            await s.saveKey()
            // a second user, with a client of their own
            const other = new MoquiVaultClient({idleMinutes: 0, workerIntegrity: config.integrity.worker, wasmIntegrity: config.integrity.wasm})
            await other.start()
            const keyOf = async (id) => {
                const made = await other.personalMake({personal_key_id: id, user_id: "U2", passphrase: "the other user's pass phrase"})
                store.keys.U2 = {personalKeyId: id, public: made.public}
                const key = await s.publicKeyOf("U2")
                await s.storeCheck(key, await s.fingerprintOf(key.public))
                return key
            }
            const first = await keyOf("pk-u2-1")
            const vaultId = await s.makeVault("Team", "VlSharedKey")
            await s.setMember(vaultId, first, "manage")
            const itemId = await s.saveItem(vaultId, null, {v: 1, type: "login", name: "Shared login", fields: {username: "team", password: "p1"}})
            await s.loadItems(s.vault(vaultId))
            // U2's key changes; the server says U1's wrap was signed by it and must be remade with the change
            const changed = await keyOf("pk-u2-2")
            store.fail.stranded = ["U1"]
            const rewrapped = await s.setMember(vaultId, changed, "manage")
            // the removal refused once: its key version is forgotten, so the same removal works next
            store.fail.removeOnce = true
            let refused = ""
            try { await s.removeMember(vaultId, "U2", false) } catch (err) { refused = err.message }
            await s.removeMember(vaultId, "U2", false)
            const v = s.vault(vaultId)
            const item = v.items.find((entry) => entry.id === itemId)
            await s.saveItem(vaultId, item, {v: 1, type: "login", name: "Shared login", fields: {username: "team", password: "p2"}})
            await s.loadItems(v)
            const body = await s.itemBody(vaultId, itemId)
            other.terminate()
            return {rewrapped, sent: store.membersSent, refused, keyVersion: v.keyVersion, name: v.name, password: body.fields.password,
                itemKeyVersion: store.items[itemId].itemKeyVersion, members: v.memberList.map((m) => m.userId)}
        })
    },
    then({rewrapped, sent, refused, keyVersion, name, password, itemKeyVersion, members}) {
        rewrapped == ["U1"]
        sent[sent.length - 1].rewraps == ["U1"]
        refused.includes("changed since")
        keyVersion == 2
        members == ["U1"]
        // the header was sealed again under the new key version, and the item key made new at its first write after it
        name == "Team"
        password == "p2"
        itemKeyVersion == 2
    }
})

feature("a masked value shows only when asked for, and the vault locks after the idle time, forgetting it", {
    when() {
        open(0.05)
        const made = page.evaluate(async ([password, secret]) => {
            const s = window.BossVaultSession
            const vaultId = await s.makeVault("Bank", "VlSingleSecret", "VsPassword", password)
            const itemId = await s.saveItem(vaultId, null, {v: 1, type: "login", name: "Bank of Example", fields: {username: "ada", password: secret}})
            await s.loadItems(s.vault(vaultId))
            vm.setUrl("/qapps/Commons/Vault?vaultId=" + encodeURIComponent(vaultId) + "&itemId=" + encodeURIComponent(itemId))
            return {vaultId, itemId}
        }, [PASSWORD, SECRET])
        page.waitFor(() => !!document.querySelector(".boss-vault-field[data-field=password]"))
        const before = page.evaluate((secret) => ({
            onPage: document.body.innerText.includes(secret),
            username: document.querySelector(".boss-vault-field[data-field=username]").innerText,
            kept: JSON.stringify(BossVaultSession.S.vaults.map((v) => v.items.map((item) => ({name: item.name, shown: item.shown})))).includes(secret),
            stored: JSON.stringify(store.items).includes(secret) || JSON.stringify(store.items).includes("Bank of Example")
        }), SECRET)
        // Show, from the keyboard (the test page has no icon font, so an icon's ligature text lies over its neighbour)
        page.locator(".boss-vault-show").focus()
        page.press("Enter")
        page.waitFor((secret) => document.body.innerText.includes(secret), {arg: SECRET})
        const shown = page.evaluate(() => document.querySelector(".boss-vault-field[data-field=password] .boss-vault-value").innerText)
        // no use of the page from here: the idle time passes and the vault locks by itself
        page.waitFor(() => !!document.querySelector(".boss-vault-locked"), {timeout: 15})
        const after = page.evaluate(async ({secret, made}) => {
            const session = window.BossVaultSession
            const row = store.items[made.itemId]
            let worker = ""
            try { await session.openRow(made.vaultId, row) } catch (err) { worker = String(err.message || err) }
            return {onPage: document.body.innerText.includes(secret), idleBanner: !!document.querySelector(".boss-vault-idle"),
                open: session.S.vaults.some((v) => v.open), items: session.S.vaults.reduce((n, v) => n + v.items.length, 0), worker}
        }, {secret: SECRET, made})
        return {before, shown, after}
    },
    then({before, shown, after}) {
        // before Show: the username, not the password; the page keeps no masked value, and the server holds neither
        before.username.includes("ada")
        before.onPage == false
        before.kept == false
        before.stored == false
        // Show asks the worker for that one value
        shown == SECRET
        // the idle time locks it: the value is off the page, nothing is kept open, and the worker holds no vault key
        after.onPage == false
        after.idleBanner == true
        after.open == false
        after.items == 0
        after.worker.includes("locked")
    }
})
