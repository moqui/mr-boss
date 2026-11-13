// Focused regressions for the actual Projects diff component: deferred responses acknowledge their submitted draft and
// merge request, and line comments remain available without pointer hover. This is an offline component fixture, not a walk.
let page
spec({
    server: false,
    setupSpec() {
        page = browser.newPage({viewport: {width: 1280, height: 900}})
        page.setContent(`<!doctype html><html><head><link rel="stylesheet" href="/libs/quasar/quasar.prod.css"></head>
            <body><div id="app"></div><script src="/libs/vue/vue.global.prod.js"></script>
            <script src="/libs/quasar/quasar.umd.prod.js"></script><script src="/js/MoquiLib.js"></script>
            <script src="/js/WebrootVue.qvt.js"></script><script>
            window.calls = []; window.pending = []; window.navigation = []; window.notified = [];
            window.deferLoads = false;
            window.fixtureChanges = (id, review = true) => ({mergeRequestId: id, repositoryId: 'fixture', isOpen: true,
                headCommitId: 'head-' + id, insertions: 1, deletions: 0, canComment: review, canReview: review, canApprove: review,
                threadList: [], fileList: [{path: 'src/main.js', changeLabel: 'Modified', insertions: 1, deletions: 0,
                    hunkList: [{oldStart: 1, oldLines: 1, newStart: 1, newLines: 1,
                        lineList: [{tag: 'insert', oldNo: null, newNo: 1, text: 'export const value = 1'}]}]}]});
            moqui.request = (url, options) => {
                const name = url.split('/').pop(), params = Object.assign({}, options && options.params);
                calls.push({url, name, params, method: options && options.method || 'GET'});
                if (name === 'changes' && !deferLoads) return Promise.resolve({json: {changes: fixtureChanges(params.mergeRequestId)}});
                return new Promise((resolve, reject) => pending.push({name, params, resolve, reject}));
            };
            moqui.notifyMessages = (messages) => notified.push(messages);
            moqui.handleAjaxError = (error) => notified.push(String(error));
            window.settle = () => new Promise(resolve => setTimeout(resolve, 0)).then(() => Vue.nextTick());
            fetch('/files/component/mr-boss/screen/Projects/Code/MergeRequestDetail/Changes.qvue')
                .then(response => response.text()).then(text => {
                    const module = {};
                    const part = tag => text.slice(text.indexOf('<' + tag + '>') + tag.length + 2, text.lastIndexOf('<' + '/' + tag + '>'));
                    new Function('module', part('script'))(module);
                    const component = Object.assign(module.exports, {template: part('template')});
                    const app = Vue.createApp({data() {return {basePath: '/apps', linkBasePath: '/qapps',
                        currentPathList: ['Projects', 'Code', 'MergeRequestDetail', 'Changes'], currentParameters: {mergeRequestId: 'A'}, show: true}},
                        methods: {setUrl(url) {navigation.push(url)}}, template: '<diff-screen v-if="show" ref="screen"></diff-screen>'});
                    app.use(Quasar);
                    Object.entries(moqui.qvt.components).forEach(([name, definition]) => app.component(name, definition));
                    app.component('diff-screen', component);
                    window.vm = app.mount('#app');
                });
            </script></body></html>`)
        page.waitFor(() => !!(window.vm && vm.$refs.screen && vm.$refs.screen.changes))
    }
})

feature("diff submissions retain newer drafts and ignore completions for a different merge request", {
    expect() {
        // A successful comment acknowledges only the body that was sent, retaining text typed during the request.
        page.evaluate(() => {
            const screen = vm.$refs.screen
            screen.startComment(screen.changes.fileList[0], screen.changes.fileList[0].hunkList[0].lineList[0])
            return true
        })
        page.getByLabel("Comment (markdown)", {exact: true}).fill("Submitted comment")
        page.getByRole("button", {name: "Comment", exact: true}).click()
        page.getByLabel("Comment (markdown)", {exact: true}).fill("A later comment")
        page.evaluate(async () => {
            pending.shift().resolve({json: {communicationEventId: "C1"}})
            await settle()
            return true
        })
        assert.equal(
            page.evaluate(() => vm.$refs.screen.composer.body),
            "A later comment"
        )
        assert.equal(
            page.getByLabel("Comment (markdown)", {exact: true}).evaluate(element => element.value),
            "A later comment"
        )
        page.getByRole("button", {name: "Comment", exact: true}).click()
        page.evaluate(async () => {
            pending.shift().resolve({json: {communicationEventId: "C1-next"}})
            await settle()
            return true
        })
        assert.equal(
            page.evaluate(() => vm.$refs.screen.composer.body),
            ""
        )

        // Replies use the same submitted-snapshot rule, including a validation refusal.
        page.evaluate(() => {
            const screen = vm.$refs.screen
            screen.startReply({communicationEventId: "T1"})
            screen.replyBody = "Sent reply"
            screen.sendReply({communicationEventId: "T1"})
            screen.replyBody = "Later reply"
            return true
        })
        page.evaluate(async () => {
            pending.shift().resolve({json: {communicationEventId: "C2"}})
            await settle()
            return true
        })
        assert.equal(
            page.evaluate(() => vm.$refs.screen.replyBody),
            "Later reply"
        )
        page.evaluate(() => {
            vm.$refs.screen.sendReply({communicationEventId: "T1"})
            return true
        })
        page.evaluate(async () => {
            pending.shift().resolve({json: {}})
            await settle()
            return true
        })
        assert.equal(
            page.evaluate(() => vm.$refs.screen.replyBody),
            "Later reply"
        )

        // A review response must not close a revised draft or navigate away from it.
        page.evaluate(() => {
            const screen = vm.$refs.screen
            screen.replyTo = null
            screen.openReview()
            screen.review.note = "Sent review"
            screen.submitReview()
            screen.review.note = "Later review"
            return true
        })
        page.evaluate(async () => {
            pending.shift().resolve({json: {statusId: "GmrrCommented"}})
            await settle()
            return true
        })
        assert.equal(
            page.evaluate(() => vm.$refs.screen.review.note),
            "Later review"
        )
        assert.equal(
            page.evaluate(() => vm.$refs.screen.review.open),
            true
        )
        assert.equal(
            page.evaluate(() => navigation.length),
            0
        )

        // Navigation invalidates both pending mutations and diff reads, including failures.
        page.evaluate(async () => {
            const screen = vm.$refs.screen
            screen.review.note = "Old merge request review"
            screen.submitReview()
            vm.currentParameters = {mergeRequestId: "B"}
            await settle()
            return true
        })
        page.evaluate(async () => {
            const screen = vm.$refs.screen
            screen.openReview()
            screen.review.note = "B draft"
            pending.shift().resolve({json: {statusId: "GmrrCommented", messageInfos: [{message: "Old review saved"}]}})
            await settle()
            return true
        })
        assert.equal(
            page.evaluate(() => vm.$refs.screen.changes.mergeRequestId),
            "B"
        )
        assert.equal(
            page.evaluate(() => vm.$refs.screen.review.note),
            "B draft"
        )
        assert.equal(
            page.evaluate(() => navigation.length),
            0
        )
        assert.equal(
            page.evaluate(() => notified.length),
            0
        )
        page.evaluate(async () => {
            vm.$refs.screen.review.open = false
            deferLoads = true
            vm.currentParameters = {mergeRequestId: "C"}
            await settle()
            vm.currentParameters = {}
            await settle()
            pending.shift().resolve({json: {changes: fixtureChanges("C")}})
            await settle()
            return true
        })
        assert.equal(
            page.evaluate(() => vm.$refs.screen.changes),
            null
        )
        assert.equal(
            page.evaluate(() => vm.$refs.screen.notFound),
            true
        )
        page.evaluate(async () => {
            vm.currentParameters = {mergeRequestId: "D"}
            await settle()
            vm.currentParameters = {mergeRequestId: "E"}
            await settle()
            pending.shift().reject(new Error("obsolete diff failure"))
            pending.shift().resolve({json: {changes: fixtureChanges("E")}})
            await settle()
            return true
        })
        assert.equal(
            page.evaluate(() => vm.$refs.screen.changes.mergeRequestId),
            "E"
        )
        assert.equal(
            page.evaluate(() => vm.$refs.screen.notFound),
            false
        )

        // Canceling a submitted review does not reopen or redirect the current view; an unchanged success still does.
        page.evaluate(async () => {
            const screen = vm.$refs.screen
            screen.openReview()
            screen.submitReview()
            screen.review.open = false
            pending.shift().resolve({json: {statusId: "GmrrCommented"}})
            await settle()
            return true
        })
        assert.equal(
            page.evaluate(() => navigation.length),
            0
        )
        page.evaluate(async () => {
            const screen = vm.$refs.screen
            screen.openReview()
            screen.submitReview()
            pending.shift().resolve({json: {statusId: "GmrrCommented"}})
            await settle()
            return true
        })
        assert.equal(
            page.evaluate(() => navigation.pop()),
            "/qapps/Projects/Code/MergeRequestDetail?mergeRequestId=E"
        )

        // Unmounting invalidates a successful review before its redirect and success notification.
        page.evaluate(async () => {
            const screen = vm.$refs.screen
            screen.openReview()
            screen.submitReview()
            vm.show = false
            await settle()
            pending.shift().resolve({json: {statusId: "GmrrCommented", messageInfos: [{message: "Saved after leaving"}]}})
            await settle()
            return true
        })
        assert.equal(
            page.evaluate(() => navigation.length),
            0
        )
        assert.equal(
            page.evaluate(() => notified.length),
            0
        )
    }
})

feature("an open read-only diff tells the truth and line comments have a keyboard entry point", {
    expect() {
        page.evaluate(async () => {
            deferLoads = false
            vm.currentParameters = {mergeRequestId: "K"}
            vm.show = true
            await settle()
            return true
        })
        page.waitFor(() => !!vm.$refs.screen.changes)
        page.evaluate(async () => {
            vm.$refs.screen.changes = fixtureChanges("K", false)
            await settle()
            return true
        })
        assert.ok(page.text().includes("Read only"))
        assert.ok(!page.text().includes("merged or closed"))
        page.evaluate(async () => {
            vm.$refs.screen.changes = fixtureChanges("K")
            await settle()
            return true
        })
        page.getByRole("button", {name: "Comment on this line", exact: true}).focus()
        page.keyboard.press("Enter")
        assert.equal(
            page.getByLabel("Comment (markdown)", {exact: true}).evaluate(element => element === document.activeElement),
            true
        )
        assert.equal(
            page.evaluate(() => vm.$refs.screen.composer.newLine),
            1
        )
    }
})
