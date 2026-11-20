/* This software is in the public domain under CC0 1.0 Universal plus a Grant of Patent License. */
// A stand-in for the vault REST services (/rest/s1/vault) in an offline test page, for test/client/Commons/VaultLock.spec.js:
// it keeps what the server keeps (public keys, signed records and ciphertext, in window.store) and answers in the services'
// shapes, with the refusals a spec turns on (store.fail). It checks no signature: the page's worker does, and the framework's
// own tests check the server. Every request the page sends is kept in store.sent, to look for what must never be sent.
// Then it mounts screen/Commons/Vault.qvue (window.vm.$refs.screen) with the setup a spec passes (window.mountVault).
"use strict";
(function () {
    const store = (window.store = { user: "U1", keys: {}, checks: [], vaults: {}, items: {}, sent: [], fail: {}, served: [] });
    const answer = (body, status) => new Response(JSON.stringify(body), { status: status || 200, headers: { "Content-Type": "application/json" } });
    const refuse = (text) => answer({ errors: text }, 400);
    const realFetch = window.fetch.bind(window);
    window.realFetch = realFetch;
    const latest = (v) => v.entries[v.entries.length - 1];
    const vaultJson = (v) => ({ vaultId: v.vaultId, vaultKindEnumId: "VkPersonal", lockEnumId: v.lockEnumId, roleEnumId: "VrManage", ownerUserId: store.user,
        keyVersion: v.keyVersion, revision: v.revision, secretKindEnumId: v.secretKindEnumId || null, headerCipher: v.headerCipher || null, recoveryOn: "N",
        createdDate: v.createdDate, itemCount: Object.values(store.items).filter((i) => i.vaultId === v.vaultId).length });
    const members = (v) => (v.entries.length ? latest(v).members : []).map((m) => ({ userId: m.user_id, personalKeyId: m.key_id,
        roleEnumId: { manage: "VrManage", write: "VrWrite", read: "VrRead" }[m.role], keyVersion: v.keyVersion }));

    function route(method, path, query, body) {
        const parts = path.split("/").filter((p) => p).map(decodeURIComponent);
        const me = store.keys[store.user];
        if (path === "/personalKey" && method === "GET") return me ? Object.assign({ hasKey: true, userId: store.user, fetchAllowed: true }, me) : { hasKey: false, userId: store.user, fetchAllowed: true };
        if (path === "/personalKey" && method === "POST") {
            store.keys[store.user] = { personalKeyId: body.personalKeyId, public: body.public, passphraseWrap: body.passphraseWrap, recoveryWrap: body.recoveryWrap };
            return { personalKeyId: body.personalKeyId };
        }
        if (path === "/personalKey/wrapped") return Object.assign({ hasKey: !!me, userId: store.user }, me || {});
        if (path === "/publicKey") {
            const key = store.keys[query.get("userId")];
            return key ? { hasKey: true, userId: query.get("userId"), personalKeyId: key.personalKeyId, public: key.public } : { hasKey: false, userId: query.get("userId") };
        }
        if (path === "/keyChecks" && method === "GET") return { keyCheckList: store.checks };
        if (path === "/keyChecks" && method === "POST") { store.checks.push(body.check); return { keyCheckId: "kc" + store.checks.length }; }
        if (path === "/deliveries") return { deliveryList: [] };
        if (path === "/recoveryKeys") return { recoveryKeyList: [] };
        if (path === "/vaults" && method === "GET") return { vaultList: Object.values(store.vaults).map(vaultJson) };
        if (path === "/vaults" && method === "POST") {
            const v = { vaultId: body.vaultId, lockEnumId: body.lockEnumId, secretKindEnumId: body.secretKindEnumId, secretWrap: body.secretWrap || null,
                headerCipher: body.headerCipher || null, keyVersion: 1, revision: 1, createdDate: Date.now(), entries: body.entry ? [body.entry] : [], wraps: body.memberWraps || [] };
            store.vaults[v.vaultId] = v;
            return { vaultId: v.vaultId, revision: 1 };
        }
        const v = parts[0] === "vaults" ? store.vaults[parts[1]] : null;
        if (parts[0] === "vaults" && !v) return refuse("No vault " + parts[1]);
        if (v && parts.length === 2) return { vault: vaultJson(v), entries: v.entries, memberList: members(v), secretWrap: v.secretWrap,
            wraps: v.wraps.filter((w) => w.member_user_id === store.user) };
        if (v && parts[2] === "items" && method === "GET") return { keyVersion: v.keyVersion, itemList: Object.values(store.items).filter((i) => i.vaultId === v.vaultId) };
        if (v && parts[2] === "items" && method === "POST") {
            store.items[body.vaultItemId] = Object.assign({}, body, { vaultId: v.vaultId, revision: 1, itemKeyVersion: body.keyVersion, createdDate: Date.now() });
            v.revision++;
            return { vaultItemId: body.vaultItemId, revision: 1 };
        }
        if (v && parts[2] === "members") {
            if (body.expectedRevision !== v.revision) return refuse("The vault changed since this change was made from it");
            // a stranded wrap the spec names (as the server finds the wraps a changed manager's key had signed)
            const stranded = store.fail.stranded || [];
            if (stranded.some((userId) => !(body.rewraps || []).some((w) => w.member_user_id === userId)))
                return refuse("Remake " + stranded[0] + "'s wrap: the manager who signed it no longer manages this vault with that key");
            store.membersSent = (store.membersSent || []).concat([{ rewraps: (body.rewraps || []).map((w) => w.member_user_id) }]);
            v.entries.push(body.entry);
            v.wraps = v.wraps.filter((w) => w.member_user_id !== body.wrap.member_user_id && !(body.rewraps || []).some((r) => r.member_user_id === w.member_user_id))
                .concat([body.wrap], body.rewraps || []);
            v.revision++;
            store.fail.stranded = null;
            return { revision: v.revision };
        }
        if (v && parts[2] === "removeMember") {
            if (store.fail.removeOnce) { store.fail.removeOnce = false; return refuse("The vault changed since this change was made from it"); }
            if (body.expectedRevision !== v.revision) return refuse("The vault changed since this change was made from it");
            v.entries.push(body.entry);
            v.keyVersion = body.entry.version;
            v.wraps = body.memberWraps;
            if (body.headerCipher) v.headerCipher = body.headerCipher;
            for (const k of body.itemKeys || []) Object.assign(store.items[k.item_id], { wrappedItemKey: k.wrapped_item_key, keyVersion: v.keyVersion });
            v.revision++;
            return { keyVersion: v.keyVersion, revision: v.revision };
        }
        if (parts[0] === "items" && method === "PUT") {
            const item = store.items[parts[1]];
            if (body.expectedRevision !== item.revision) return refuse("The item changed since");
            const made = store.vaults[item.vaultId];
            // decision (c): a write after a rotation needs a new item key
            if (item.itemKeyVersion < made.keyVersion && !body.newItemKey) return refuse("Make a new item key at this write (newItemKey)");
            Object.assign(item, { wrappedItemKey: body.wrappedItemKey, bodyCipher: body.bodyCipher, keyVersion: body.keyVersion, revision: item.revision + 1,
                itemKeyVersion: body.newItemKey ? body.keyVersion : item.itemKeyVersion });
            made.revision++;
            return { revision: item.revision };
        }
        return answer({ errors: "no such path " + path }, 404);
    }

    window.fetch = async (url, init) => {
        const text = String(url);
        const method = (init && init.method) || "GET";
        store.sent.push(method + " " + text + " " + ((init && init.body) || ""));
        if (!text.startsWith("/rest/s1/vault")) return realFetch(url, init);
        const [path, search] = text.replace("/rest/s1/vault", "").split("?");
        const out = route(method, path, new URLSearchParams(search || ""), init && init.body ? JSON.parse(init.body) : {});
        if (out instanceof Response) return out;
        store.served.push(JSON.stringify(out));
        return answer(out);
    };

    moqui.notifyMessages = () => {};
    moqui.handleAjaxError = () => {};
    window.sri = async (url) => "sha256-" + btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest("SHA-256", await (await realFetch(url)).arrayBuffer()))));
    // the component mounted with the setup transition's answer (config) and the screen's names transition
    window.mountVault = async (config) => {
        moqui.request = (url) => {
            store.sent.push("GET " + url);
            return Promise.resolve({ json: url.endsWith("/setup") ? config : { names: {} } });
        };
        const load = async (location) => {
            const text = await (await realFetch(location)).text();
            const part = (tag) => text.slice(text.indexOf("<" + tag + ">") + tag.length + 2, text.lastIndexOf("<" + "/" + tag + ">"));
            const module = {};
            new Function("module", part("script"))(module);
            return Object.assign(module.exports, { template: part("template") });
        };
        const vault = await load("/files/component/mr-boss/screen/Commons/Vault.qvue");
        const contacts = await load("/files/component/mr-boss/screen/Commons/Contacts/VaultContacts.qvue");
        window.app = Vue.createApp({
            data() { return { basePath: "/apps", linkBasePath: "/qapps", currentPathList: ["Commons", "Vault"], currentParameters: {}, contactsQuery: { parameters: {} } }; },
            methods: { setUrl(url) { const query = url.split("?")[1] || ""; this.currentParameters = Object.fromEntries(new URLSearchParams(query)); } },
            template: '<vault-screen ref="screen"></vault-screen><vault-contacts ref="contacts"></vault-contacts>',
        });
        app.use(Quasar);
        Object.entries(moqui.qvt.components).forEach(([name, component]) => app.component(name, component));
        app.component("vault-screen", vault);
        // the Contacts list's container gives it its find as mScreen's parameters
        app.component("vault-contacts", Object.assign({}, contacts, { inject: {}, computed: Object.assign({}, contacts.computed, {
            query() { return this.$root.contactsQuery.parameters; } }) }));
        window.vm = app.mount("#app");
    };
})();
