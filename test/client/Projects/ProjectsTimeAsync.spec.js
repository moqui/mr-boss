// Focused regressions for MyTime's submitted snapshots and pending responses; no server or workflow fixtures.
let page
spec({
    server: false,
    timeout: 15,
    setupSpec() {
        page = browser.newPage({viewport: {width: 1280, height: 900}})
    }
})

feature("a cell save preserves newer drafts, failed cells remain retryable, and leaving time discards pending callbacks", {
    expect() {
        page.setContent(`<!doctype html><html><head><link rel="stylesheet" href="/libs/quasar/quasar.prod.css"></head><body><div id="app"></div>
            <script src="/libs/vue/vue.global.prod.js"></script><script src="/libs/quasar/quasar.umd.prod.js"></script>
            <script src="/js/MoquiLib.js"></script><script src="/js/WebrootVue.qvt.js"></script><script>
            // settle: past every promise hop of a response (a macrotask), then Vue's update.
            window.settle = () => new Promise(resolve => setTimeout(resolve, 0)).then(() => Vue.nextTick());
            window.runningTimer = null; window.saved = {A: 1, B: 0}; window.pending = []; window.calls = []; window.notices = [];
            const day = '2026-11-09';
            window.weekAnswer = () => ({week: {partyId: 'WORKER', isMine: true, isThisWeek: true, weekStart: day, label: 'Nov 9–15',
                personOptions: [], expectedTotal: 8, total: saved.A + saved.B, billableTotal: saved.A + saved.B,
                serverNow: Date.now(), timer: runningTimer && Object.assign({}, runningTimer), timesheet: {statusId: 'TmshInProcess', returned: false},
                access: {canEdit: true}, dayList: [{day, label: 'Monday', dateLabel: 'Nov 9', expected: 8, total: saved.A + saved.B, isWorkday: true}],
                rowList: ['A', 'B'].map(id => ({workEffortId: id, workEffortName: 'Item ' + id, isOpen: true, total: saved[id],
                    cells: {[day]: {hours: saved[id], entryIds: saved[id] ? [id + '-ENTRY'] : []}}})),
                entryList: ['A', 'B'].filter(id => saved[id]).map(id => ({timeEntryId: id + '-ENTRY', workEffortId: id, day, hours: saved[id], billable: true})),
                workTypeOptions: []}});
            moqui.notifyMessages = messages => notices.push(messages);
            moqui.handleAjaxError = error => notices.push(error.text || String(error));
            moqui.request = (url, options) => {
                const name = url.split('/').pop(), params = Object.assign({}, options && options.params);
                calls.push({url, name, params});
                if (name === 'week') return Promise.resolve({json: weekAnswer()});
                return new Promise((resolve, reject) => pending.push({name, params, resolve, reject}));
            };
            window.answer = (name, fail) => {
                const request = pending.find(one => one.name === name && !one.done); request.done = true;
                if (fail) request.reject({status: 500, text: 'Fixture refused the write'});
                else if (name === 'decide') request.resolve({json: {messageInfos: [{message: 'Week returned'}]}});
                else if (name === 'updateTimer') { runningTimer.comments = request.params.comments; request.resolve({json: {updated: true}}); }
                else { saved[request.params.workEffortId] = Number(request.params.hours); request.resolve({json: {timeEntryId: request.params.workEffortId + '-ENTRY', hours: Number(request.params.hours)}}); }
            };
            fetch('/files/component/mr-boss/screen/Projects/Time/MyTime.qvue').then(response => response.text()).then(text => {
                const part = tag => text.slice(text.indexOf('<' + tag + '>') + tag.length + 2, text.lastIndexOf('<' + '/' + tag + '>'));
                const module = {}; new Function('module', part('script'))(module);
                const app = Vue.createApp({data() { return {basePath: '/apps', linkBasePath: '/qapps', currentPathList: ['Projects', 'Time', 'MyTime'], currentParameters: {}, show: true}; },
                    methods: {setUrl() {}}, template: '<time-screen v-if="show" ref="screen"></time-screen>'});
                app.use(Quasar); Object.keys(moqui.qvt.components).forEach(name => app.component(name, moqui.qvt.components[name]));
                app.component('time-screen', Object.assign(module.exports, {template: part('template')})); window.vm = app.mount('#app');
            });
            </script></body></html>`)
        page.waitFor(() => !!(window.vm && vm.$refs.screen && vm.$refs.screen.week))
        page.getByLabel("A Monday").fill("2")
        page.getByLabel("B Monday").fill("4")
        page.waitFor(() => pending.some(one => one.name === "saveCell"))
        page.evaluate(() => {
            answer("saveCell", false)
            return true
        })
        page.waitFor(() => saved.A === 2 && !vm.$refs.screen.loading)
        assert.equal(
            page.getByLabel("B Monday").evaluate(input => input.value),
            "4",
            "an earlier save must retain another cell's newer edit"
        )
        page.getByLabel("A Monday").click()
        page.evaluate(() => {
            answer("saveCell", false)
            return true
        })
        page.waitFor(() => saved.B === 4 && !vm.$refs.screen.loading)
        // The same cell changed again while its previous write is pending: both blurs must eventually persist in order.
        page.getByLabel("A Monday").fill("3")
        page.getByLabel("B Monday").click()
        page.getByLabel("A Monday").fill("5")
        page.getByLabel("B Monday").click()
        page.evaluate(() => {
            answer("saveCell", false)
            return true
        })
        page.waitFor(() =>
            pending.some(
                one => !one.done && one.name === "saveCell" && one.params.workEffortId === "A" && one.params.hours === "5"
            )
        )
        assert.equal(
            page.getByLabel("A Monday").evaluate(input => input.value),
            "5"
        )
        page.evaluate(() => {
            const request = pending.find(one => !one.done && one.name === "saveCell" && one.params.workEffortId === "A")
            request.done = true
            saved.A = Number(request.params.hours)
            request.resolve({json: {timeEntryId: "A-ENTRY", hours: saved.A}})
            return true
        })
        page.waitFor(() => saved.A === 5 && !vm.$refs.screen.loading)
        page.getByLabel("A Monday").fill("7")
        page.getByLabel("B Monday").click()
        page.evaluate(() => {
            answer("saveCell", true)
            return true
        })
        page.waitFor(() => notices.length > 0)
        assert.equal(
            page.getByLabel("A Monday").evaluate(input => input.value),
            "7",
            "a failed write must retain the submitted hours"
        )
        page.evaluate(async () => {
            runningTimer = {timeEntryId: "TIMER", comments: "Original", fromDate: Date.now(), startedText: "now"}
            await vm.$refs.screen.load()
            return true
        })
        page.getByRole("textbox", {name: "What are you working on?"}).fill("Comment to retry")
        page.getByLabel("B Monday").click()
        page.evaluate(async () => {
            answer("updateTimer", true)
            await settle()
            return true
        })
        assert.equal(
            page.evaluate(() => vm.$refs.screen.timer.comments),
            "Original",
            "a failed comment is not acknowledged"
        )
        page.getByRole("textbox", {name: "What are you working on?"}).click()
        page.getByLabel("B Monday").click()
        page.waitFor(() => pending.filter(one => one.name === "updateTimer").length === 2)
        page.evaluate(async () => {
            answer("updateTimer", false)
            await settle()
            return true
        })
        assert.equal(
            page.evaluate(() => vm.$refs.screen.timer.comments),
            "Comment to retry",
            "a saved comment is acknowledged"
        )
        page.evaluate(async () => {
            const s = vm.$refs.screen
            s.openDecide("return")
            s.decision.reason = "Submitted reason"
            s.decide("return", s.decision.reason)
            s.decision.reason = "A newer reason"
            answer("decide", false)
            await settle()
            return true
        })
        assert.equal(
            page.evaluate(() => vm.$refs.screen.decision.open),
            true,
            "a decision response acknowledges only its submitted reason"
        )
        assert.equal(
            page.evaluate(() => vm.$refs.screen.decision.reason),
            "A newer reason"
        )
        // Leave with two writes pending: B's succeeds and A's (the retained failed hours) fails.
        page.evaluate(async () => {
            vm.$refs.screen.decision.open = false
            await settle()
            return true
        })
        page.getByLabel("B Monday").fill("6")
        page.getByLabel("A Monday").click()
        page.waitFor(() => pending.some(one => !one.done && one.name === "saveCell" && one.params.workEffortId === "B"))
        const before = page.evaluate(async () => {
            const s = vm.$refs.screen
            s.commitCell(s.week.rowList[0], s.week.dayList[0])
            await Vue.nextTick()
            vm.show = false
            vm.currentPathList = ["Commons", "Home"]
            await Vue.nextTick()
            return {calls: calls.length, notices: notices.length}
        })
        page.evaluate(async () => {
            answer("saveCell", false)
            await settle()
            answer("saveCell", true)
            await settle()
            return true
        })
        assert.equal(
            page.evaluate(() => calls.length),
            before.calls,
            "a finished write cannot reload against the destination screen"
        )
        assert.deepEqual(
            page.evaluate(from => notices.slice(from), before.notices),
            ["Fixture refused the write"],
            "a write that fails after leaving still reports"
        )
    }
})
