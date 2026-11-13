// Focused TeamPlanner response identity regressions; the actual component runs with deferred local answers.
let page
spec({
    server: false,
    timeout: 15,
    setupSpec() {
        page = browser.newPage({viewport: {width: 1280, height: 900}})
    }
})

feature("staffing and people answers belong to the dialog that requested them; pending changes stop at navigation", {
    expect() {
        page.setContent(`<!doctype html><html><head><link rel="stylesheet" href="/libs/quasar/quasar.prod.css"></head><body><div id="app"></div>
            <script src="/libs/vue/vue.global.prod.js"></script><script src="/libs/quasar/quasar.umd.prod.js"></script>
            <script src="/js/MoquiLib.js"></script><script src="/js/WebrootVue.qvt.js"></script><script>
            // settle: past every promise hop of a response (a macrotask), then Vue's update.
            window.settle = () => new Promise(resolve => setTimeout(resolve, 0)).then(() => Vue.nextTick());
            window.pending = []; window.calls = []; window.notices = [];
            moqui.notifyMessages = messages => notices.push(messages); moqui.handleAjaxError = error => notices.push(error);
            moqui.request = (url, options) => {
                const name = url.split('/').pop(), params = Object.assign({}, options && options.params); calls.push({url, name, params});
                if (name === 'plan') return Promise.resolve({json: {planner: {fromDate: '2026-11-09', thruDate: '2026-11-15', today: '2026-11-09',
                    canRequest: true, isApprover: true, personList: [], placeholderList: [], projectList: [], weekList: [],
                    roleOptions: [{value: 'Programmer', label: 'Developer'}],
                    options: {projectOptions: [], skillOptions: [{value: 'JS', label: 'JavaScript'}], requestProjectOptions: [{value: 'P', label: 'Project P'}]}}}});
                return new Promise((resolve, reject) => pending.push({name, params, resolve, reject}));
            };
            window.allocation = id => ({workEffortAllocationId: id, rootWorkEffortId: 'P', projectName: 'Project ' + id, roleText: 'Developer',
                fromDay: '2026-11-09', thruDay: '2026-11-15', hoursPerWeek: 8, statusId: 'WealRequested'});
            fetch('/files/component/mr-boss/screen/Projects/Resources/TeamPlanner.qvue').then(response => response.text()).then(text => {
                const part = tag => text.slice(text.indexOf('<' + tag + '>') + tag.length + 2, text.lastIndexOf('<' + '/' + tag + '>'));
                const module = {}; new Function('module', part('script'))(module);
                const app = Vue.createApp({data() { return {basePath: '/apps', linkBasePath: '/qapps', appRootPath: '/apps', currentPathList: ['Projects', 'Resources', 'TeamPlanner'], currentParameters: {}, show: true}; },
                    methods: {setUrl() {}, getLinkPath(path) {return path;}}, template: '<planner-screen v-if="show" ref="screen"></planner-screen>'});
                app.use(Quasar); Object.keys(moqui.qvt.components).forEach(name => app.component(name, moqui.qvt.components[name]));
                app.component('planner-screen', Object.assign(module.exports, {template: part('template')})); window.vm = app.mount('#app');
            });
            </script></body></html>`)
        page.waitFor(() => !!(window.vm && vm.$refs.screen && vm.$refs.screen.planner))
        page.evaluate(async () => {
            const s = vm.$refs.screen
            s.openStaff(allocation("A"))
            s.openStaff(allocation("B"))
            const answer = (id, name) =>
                pending
                    .find(one => one.name === "candidates" && one.params.workEffortAllocationId === id)
                    .resolve({
                        json: {canStaff: true, candidateList: [{partyId: id, name, fitText: "Available", fitColor: "positive"}]}
                    })
            answer("B", "Bob current")
            await settle()
            answer("A", "Alice stale")
            await settle()
            return true
        })
        assert.deepEqual(
            page.evaluate(() => vm.$refs.screen.staff.candidates.map(one => one.name)),
            ["Bob current"]
        )
        assert.ok(page.text().includes("Bob current") && !page.text().includes("Alice stale"))
        page.evaluate(async () => {
            const s = vm.$refs.screen
            s.staff.open = false
            s.openNew({partyId: "A", name: "Alice"}, "2026-11-09")
            s.openNew({partyId: "B", name: "Bob"}, "2026-11-16")
            const answers = pending.filter(one => one.name === "people")
            answers[1].resolve({json: [{value: "B", label: "Bob current"}]})
            await settle()
            answers[0].resolve({json: [{value: "A", label: "Alice stale"}]})
            await settle()
            return true
        })
        assert.deepEqual(
            page.evaluate(() => vm.$refs.screen.peopleOptions.map(one => one.value)),
            ["B"]
        )
        const before = page.evaluate(async () => {
            const s = vm.$refs.screen
            s.form.open = false
            s.decide(allocation("A"), "approve")
            vm.currentPathList = ["Commons", "Home"]
            vm.show = false
            await Vue.nextTick()
            return calls.length
        })
        page.evaluate(async () => {
            pending
                .find(one => one.name === "decideAllocation")
                .resolve({json: {decided: true, messageInfos: [{message: "Approved"}]}})
            await settle()
            return true
        })
        assert.equal(
            page.evaluate(() => calls.length),
            before,
            "a late allocation decision cannot reload the destination"
        )
        assert.deepEqual(
            page.evaluate(() => notices),
            [],
            "a departed view does not publish its old success"
        )
    }
})
