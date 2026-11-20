// Commons › Vault in the browser (mr-moqui plans/Vault-Instances.md V3, §3.6): the real Vault.qvue with the real vault module
// (webroot js/vault, moqui_vault.wasm in its worker, loaded with the integrity hashes the page is given), over an in-page
// stand-in for the vault REST services that keeps what a server keeps: ciphertext. A masked value is not on the page, nor in what
// the page keeps of the item, until Show asks the worker for it; and the vault locks by itself after the idle time (a short one
// here, boss/vault@idle-minutes in a deployment), dropping the value from the page and every key from the worker.
// Run: ./moq test-client mr-boss --serve --spec VaultLock (an offline spec: it needs no server)
const PASSWORD = "Tr0ub4dor-and-3-more!"
const SECRET = "s3cret-Value-shown-only-on-ask"
let page

spec({
    server: false,
    timeout: 30,
    setupSpec() {
        page = browser.newPage({viewport: {width: 1280, height: 900}})
    }
})

feature("a masked value shows only when asked for, and the vault locks after the idle time, forgetting it", {
    when() {
        page.setContent(`<!doctype html><html><head><link rel="stylesheet" href="/libs/quasar/quasar.prod.css">
            <link rel="stylesheet" href="/css/WebrootVue.qvt.css"></head>
            <body><div id="app"></div><script src="/libs/vue/vue.global.prod.js"></script>
            <script src="/libs/quasar/quasar.umd.prod.js"></script><script src="/js/MoquiLib.js"></script>
            <script src="/js/WebrootVue.qvt.js"></script><script>
            moqui.notifyMessages = () => {};
            moqui.handleAjaxError = () => {};
            // the server's part: personal key, vaults and items as the vault services keep them, ciphertext only
            window.store = {vaults: {}, items: {}, served: []};
            const answer = (body, status) => new Response(JSON.stringify(body), {status: status || 200, headers: {'Content-Type': 'application/json'}});
            const realFetch = window.fetch.bind(window);
            window.fetch = async (url, init) => {
                const path = String(url);
                if (!path.startsWith('/rest/s1/vault')) return realFetch(url, init);
                const method = (init && init.method) || 'GET';
                const body = init && init.body ? JSON.parse(init.body) : {};
                const route = path.replace('/rest/s1/vault', '').split('?')[0];
                let out;
                if (route === '/personalKey') out = {hasKey: false, userId: 'U1', fetchAllowed: false};
                else if (route === '/deliveries') out = {deliveryList: []};
                else if (route === '/keyChecks') out = {keyCheckList: []};
                else if (route === '/vaults' && method === 'POST') {
                    store.vaults[body.vaultId] = Object.assign({}, body, {keyVersion: 1, revision: 1, roleEnumId: 'VrManage', ownerUserId: 'U1', createdDate: Date.now()});
                    out = {vaultId: body.vaultId, revision: 1};
                } else if (route === '/vaults') out = {vaultList: Object.values(store.vaults).map((v) => Object.assign({}, v, {itemCount: Object.values(store.items).filter((i) => i.vaultId === v.vaultId).length}))};
                else if (/^\\/vaults\\/[^/]+\\/items$/.test(route) && method === 'POST') {
                    const vaultId = decodeURIComponent(route.split('/')[2]);
                    store.items[body.vaultItemId] = Object.assign({}, body, {vaultId, revision: 1, createdDate: Date.now()});
                    out = {vaultItemId: body.vaultItemId, revision: 1};
                } else if (/^\\/vaults\\/[^/]+\\/items$/.test(route)) {
                    const vaultId = decodeURIComponent(route.split('/')[2]);
                    out = {keyVersion: 1, itemList: Object.values(store.items).filter((i) => i.vaultId === vaultId)};
                } else if (/^\\/vaults\\/[^/]+$/.test(route)) {
                    const v = store.vaults[decodeURIComponent(route.split('/')[2])];
                    out = {vault: v, entries: [], memberList: [], wraps: [], secretWrap: v.secretWrap};
                } else return answer({errors: 'no such path ' + route}, 404);
                store.served.push(JSON.stringify(out));
                return answer(out);
            };
            fetch('/files/component/mr-boss/screen/Commons/Vault.qvue').then((response) => response.text()).then(async (text) => {
                // the integrity hashes the setup transition gives: sha256 of each file, base64
                const sri = async (url) => 'sha256-' + btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest('SHA-256', await (await realFetch(url)).arrayBuffer()))));
                const config = {userId: 'U1', username: 'vault.spec', idleMinutes: 0.05, clipboardSeconds: 30,
                    wasmIntegrity: await sri('/js/vault/moqui_vault.wasm'), workerIntegrity: await sri('/js/vault/VaultWorker.js'),
                    itemTypes: [{id: 'login', label: 'Login', fields: [{name: 'username', label: 'Username', kind: 'text', masked: false},
                        {name: 'password', label: 'Password', kind: 'secret', masked: true}]}]};
                moqui.request = (url) => Promise.resolve({json: url.endsWith('/setup') ? config : {names: {}}});
                const part = (tag) => text.slice(text.indexOf('<' + tag + '>') + tag.length + 2, text.lastIndexOf('<' + '/' + tag + '>'));
                const module = {}; new Function('module', part('script'))(module);
                window.app = Vue.createApp({data() { return {basePath: '/apps', linkBasePath: '/qapps', currentPathList: ['Commons', 'Vault'], currentParameters: {}}; },
                    methods: {setUrl(url) { const query = url.split('?')[1] || ''; this.currentParameters = Object.fromEntries(new URLSearchParams(query)); }},
                    template: '<vault-screen ref="screen"></vault-screen>'});
                app.use(Quasar); Object.entries(moqui.qvt.components).forEach(([name, component]) => app.component(name, component));
                app.component('vault-screen', Object.assign(module.exports, {template: part('template')})); window.vm = app.mount('#app');
            });
            </script></body></html>`)
        page.waitFor(() => !!(window.vm && window.BossVaultSession && BossVaultSession.S.personal && BossVaultSession.S.config), {timeout: 10})
        // a single-secret vault with one login, made in the worker as New vault and New item make them
        const made = page.evaluate(async ([password, secret]) => {
            const session = window.BossVaultSession
            const vaultId = await session.makeVault("Home", "VlSingleSecret", "VsPassword", password)
            const itemId = await session.saveItem(vaultId, null, {v: 1, type: "login", name: "Bank", fields: {username: "ada", password: secret}})
            await session.loadItems(session.vault(vaultId))
            vm.setUrl("/qapps/Commons/Vault?vaultId=" + encodeURIComponent(vaultId) + "&itemId=" + encodeURIComponent(itemId))
            return {vaultId, itemId}
        }, [PASSWORD, SECRET])
        page.waitFor(() => !!document.querySelector(".boss-vault-field[data-field=password]"))
        const before = page.evaluate((secret) => ({
            onPage: document.body.innerText.includes(secret),
            username: document.querySelector(".boss-vault-field[data-field=username]").innerText,
            kept: JSON.stringify(BossVaultSession.S.vaults.map((v) => v.items.map((item) => ({name: item.name, shown: item.shown})))).includes(secret),
            stored: JSON.stringify(window.store).includes(secret) || JSON.stringify(window.store).includes("Bank")
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
            const row = Object.values(window.store.items).find((item) => item.vaultItemId === made.itemId)
            let worker = ""
            try { await session.openRow(made.vaultId, row) } catch (err) { worker = String(err.message || err) }
            return {onPage: document.body.innerText.includes(secret), idleBanner: !!document.querySelector(".boss-vault-idle"),
                open: session.S.vaults.some((v) => v.open), items: session.S.vaults.reduce((n, v) => n + v.items.length, 0), worker}
        }, {secret: SECRET, made})
        return {made, before, shown, after}
    },
    then({made, before, shown, after}) {
        made.vaultId.startsWith("v-")
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
