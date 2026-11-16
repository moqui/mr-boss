// Focused regression for the real Notes component's saves while another note opens (DC-UI-040): held responses exercise
// the race without a database.
let page
spec({
    server: false,
    timeout: 15,
    setupSpec() {
        page = browser.newPage({viewport: {width: 1280, height: 900}})
    }
})

feature("a note opened while a save is on its way keeps the earlier note's later typing and its own saved state", {
    when() {
        page.setContent(`<!doctype html><html><head><link rel="stylesheet" href="/libs/quasar/quasar.prod.css">
            <link rel="stylesheet" href="/css/WebrootVue.qvt.css"></head>
            <body><div id="app"></div><script src="/libs/vue/vue.global.prod.js"></script>
            <script src="/libs/quasar/quasar.umd.prod.js"></script><script src="/js/MoquiLib.js"></script>
            <script src="/js/WebrootVue.qvt.js"></script><script>
            window.pending = []; window.calls = [];
            window.settle = () => new Promise(resolve => setTimeout(resolve, 0)).then(() => Vue.nextTick());
            window.pages = {N1: {wikiPageId: 'N1', pageName: 'First', text: '# First', currentVersionName: 'n1-v1', tags: [], records: []},
                N2: {wikiPageId: 'N2', pageName: 'Second', text: '# Second', currentVersionName: 'n2-v1', tags: [], records: []}};
            window.take = name => {const index = pending.findIndex(request => request.name === name); return pending.splice(index, 1)[0]};
            moqui.notifyMessages = () => {};
            moqui.handleAjaxError = () => {};
            moqui.request = (url, options) => {
                const name = url.split('/').pop(), params = Object.assign({}, options && options.params);
                calls.push({name, params});
                if (name === 'notes') return Promise.resolve({json: {noteList: [{wikiPageId: 'N1', title: 'First'}, {wikiPageId: 'N2', title: 'Second'}],
                    tagList: [], totalCount: 2}});
                if (name === 'note') return Promise.resolve({json: {page: Object.assign({}, pages[params.wikiPageId])}});
                return new Promise((resolve, reject) => pending.push({name, params, resolve, reject}));
            };
            fetch('/files/component/mr-boss/screen/Commons/Notes.qvue').then(response => response.text()).then(text => {
                const part = tag => text.slice(text.indexOf('<' + tag + '>') + tag.length + 2, text.lastIndexOf('<' + '/' + tag + '>'));
                const module = {}; new Function('module', part('script'))(module);
                window.app = Vue.createApp({data() { return {basePath: '/apps', linkBasePath: '/qapps', currentPathList: ['Commons', 'Notes'],
                        currentParameters: {wikiPageId: 'N1'}, show: true}; },
                    methods: {setUrl(url) { const match = /wikiPageId=([^&]+)/.exec(url); this.currentParameters = match ? {wikiPageId: decodeURIComponent(match[1])} : {}; }},
                    template: '<notes-screen v-if="show" ref="screen"></notes-screen>'});
                app.use(Quasar); Object.entries(moqui.qvt.components).forEach(([name, component]) => app.component(name, component));
                app.component('notes-screen', Object.assign(module.exports, {template: part('template')})); window.vm = app.mount('#app');
            });
            </script></body></html>`)
        page.waitFor(() => !!(window.vm && vm.$refs.screen && vm.$refs.screen.note && vm.$refs.screen.note.wikiPageId === "N1"))
        // the first edit's save is held; more is typed, then the second note is opened from the list
        page.evaluate(async () => {
            const screen = vm.$refs.screen
            screen.text = "# First\nline1"
            screen.saveNow(null, false)
            await settle()
            screen.text = "# First\nline1\nline2"
            await settle()
            return true
        })
        page.getByText("Second", {exact: true}).click()
        page.evaluate(async () => {
            await settle()
            return true
        })
        const beforeRelease = page.evaluate(() => ({
            saves: calls.filter(call => call.name === "saveNote").length,
            noteLoads: calls.filter(call => call.name === "note").length
        }))
        page.evaluate(async () => {
            take("saveNote").resolve({json: {currentVersionName: "n1-v2", savedText: "now"}})
            await settle()
            return true
        })
        page.waitFor(() => pending.some(request => request.name === "saveNote"))
        const second = page.evaluate(() => pending.find(request => request.name === "saveNote").params)
        page.evaluate(async () => {
            take("saveNote").resolve({json: {currentVersionName: "n1-v3", savedText: "now"}})
            await settle()
            return true
        })
        page.waitFor(() => vm.$refs.screen.note && vm.$refs.screen.note.wikiPageId === "N2")
        const opened = page.evaluate(() => {
            const screen = vm.$refs.screen
            return {savedText: screen.savedText, baseVersion: screen.baseVersion, dirty: screen.dirty, savedAt: screen.savedAt}
        })
        return {beforeRelease, second, opened}
    },
    then({beforeRelease, second, opened}) {
        // the second note waits for the first's save: nothing more is sent or loaded before it answers
        beforeRelease.saves == 1
        beforeRelease.noteLoads == 1
        // then what was typed after it is saved on the version it made
        second.wikiPageId == "N1"
        second.pageText == "# First\nline1\nline2"
        second.baseVersionName == "n1-v2"
        // and the second note opens with its own saved state
        opened.savedText == "# Second"
        opened.baseVersion == "n2-v1"
        opened.dirty == false
        opened.savedAt == ""
    }
})
