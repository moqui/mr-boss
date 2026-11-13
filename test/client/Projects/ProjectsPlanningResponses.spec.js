// Focused client regressions for Projects UI review: delayed planning responses acknowledge their own dialog/input,
// and leaving a timeline releases dependency-drag listeners. Real QVue components mount on the vendored client;
// deferred fixture responses keep these bug checks offline, without a project walk or database fixtures.
let page
spec({
    server: false,
    timeout: 15,
    setupSpec() {
        page = browser.newPage()
    }
})

// The spec's one page, loaded again with a fresh planning screen of this kind.
function planningPage(kind) {
    page.setContent(`<!doctype html><html><head><link rel="stylesheet" href="/libs/quasar/quasar.prod.css"></head>
        <body><div id="app"></div><script src="/libs/vue/vue.global.prod.js"></script>
        <script src="/libs/quasar/quasar.umd.prod.js"></script><script src="/js/MoquiLib.js"></script>
        <script src="/js/WebrootVue.qvt.js"></script><script>
        window.pending = []; window.calls = [];
        // settle: past every promise hop of a response (a macrotask), then Vue's update.
        window.settle = () => new Promise(resolve => setTimeout(resolve, 0)).then(() => Vue.nextTick());
        window.answer = (name, json, index = 0) => {
            const request = pending.filter(one => one.name === name)[index];
            pending.splice(pending.indexOf(request), 1); request.resolve({json});
        };
        moqui.notifyMessages = () => {};
        moqui.handleAjaxError = error => { throw error; };
        const sprint = id => ({workEffortId:id,workEffortName:id,state:'active',stateLabel:'In progress',rowList:[],itemCount:0});
        const backlog = {project:{workEffortId:'IRON',canUpdate:true,canManage:true,isOpen:true,sprintsOn:true,unitLabel:'hours'},
            filters:{typeOptions:[{value:'WepTask',label:'Task'}],assigneeOptions:[],labelOptions:[],componentOptions:[],epicOptions:[]},
            sprintList:[sprint('IRON-SP-1'),sprint('IRON-SP-2')],backlogList:[],newSprint:{}};
        const timeline = {project:{workEffortId:'IRON',canUpdate:true},todayText:'2026-11-09',filters:{typeOptions:[],
            assigneeOptions:[],sprintOptions:[],milestoneOptions:[]},rowList:[{rowKind:'item',workEffortId:'IRON-1',
            workEffortName:'First item',startDay:'2026-11-09',dueDay:'2026-11-10',canMove:true,url:'#first',statusColor:'primary'}],
            planItemList:[],dependencyList:[],holidayList:[]};
        moqui.request = (url, options) => {
            const name = url.split('/').pop(); calls.push({name,params:options.params});
            if (name === 'backlog') return Promise.resolve({json:{backlog}});
            if (name === 'timeline') return Promise.resolve({json:{timeline}});
            if (name === 'schedule') return Promise.resolve({json:{resource:{moveTransition:'moveOperation',decideTransition:'decideOverride'}}});
            return new Promise((resolve,reject) => pending.push({name,params:options.params,resolve,reject}));
        };
        fetch('/files/component/mr-boss/screen/Projects/WorkItems/${kind}.qvue').then(response => response.text()).then(text => {
            const part = tag => text.slice(text.indexOf('<' + tag + '>') + tag.length + 2,text.lastIndexOf('<' + '/' + tag + '>'));
            const module = {}; new Function('module',part('script'))(module);
            const style = document.createElement('style'); style.textContent = part('style');
            if (text.includes('<style>')) document.head.appendChild(style);
            window.app = Vue.createApp({data(){return {basePath:'/apps',appRootPath:'/apps',linkBasePath:'/qapps',
                currentPathList:['Projects','WorkItems','${kind}'],currentParameters:{rootWorkEffortId:'IRON'},show:true};},
                template:'<planning-screen v-if="show" ref="screen"></planning-screen>'});
            app.use(Quasar);
            Object.keys(moqui.qvt.components).forEach(name => app.component(name,moqui.qvt.components[name]));
            app.component('planning-screen',Object.assign(module.exports,{template:part('template')}));
            window.vm = app.mount('#app');
        });
        </script></body></html>`)
    page.waitFor(() => !!(window.vm && vm.$refs.screen && !vm.$refs.screen.loading))
    return page
}

feature("a late sprint summary cannot replace the sprint opened afterward", {
    expect() {
        planningPage("Backlog")
        page.evaluate(() => {
            const screen = vm.$refs.screen
            screen.openComplete(screen.backlog.sprintList[0])
            screen.complete.open = false
            screen.openComplete(screen.backlog.sprintList[1])
            answer("sprintSummary", {summary: {doneCount: 1, openCount: 0, nextSprintId: "IRON-SP-3"}})
            return true
        })
        page.waitFor(() => pending.filter(one => one.name === "sprintSummary").length === 1)
        assert.equal(
            page.evaluate(() => vm.$refs.screen.complete.summary),
            null
        )
        page.evaluate(() => {
            answer("sprintSummary", {summary: {doneCount: 2, openCount: 0, nextSprintId: "IRON-SP-4"}})
            return true
        })
        page.waitFor(() => !!vm.$refs.screen.complete.summary)
        assert.equal(
            page.evaluate(() => vm.$refs.screen.complete.initial.sprintWorkEffortId),
            "IRON-SP-2"
        )
        assert.equal(
            page.evaluate(() => vm.$refs.screen.complete.summary.doneCount),
            2
        )
    }
})

feature("quick add preserves a newer title and clears an acknowledged unchanged title", {
    expect() {
        planningPage("Backlog")
        page.getByLabel("Add a work item", {exact: true}).fill("First title")
        page.getByRole("button", {name: "Add", exact: true}).click()
        page.getByLabel("Add a work item", {exact: true}).fill("Next title")
        page.evaluate(() => {
            answer("quickAdd", {workEffortId: "IRON-20"})
            return true
        })
        page.waitFor(() => !vm.$refs.screen.quick.busy)
        assert.equal(
            page.evaluate(() => document.getElementById("boss-backlog-add").value),
            "Next title"
        )
        page.getByRole("button", {name: "Add", exact: true}).click()
        page.evaluate(() => {
            answer("quickAdd", {workEffortId: "IRON-21"})
            return true
        })
        page.waitFor(() => !vm.$refs.screen.quick.busy)
        assert.equal(
            page.evaluate(() => vm.$refs.screen.quick.name),
            ""
        )
    }
})

feature("a dependency save does not close a different dependency dialog or discard newer lag input", {
    expect() {
        planningPage("Timeline")
        page.evaluate(() => {
            const screen = vm.$refs.screen
            screen.openDependency({workEffortId: "IRON-2", toWorkEffortId: "IRON-1", canChange: true})
            screen.saveDependency()
            screen.openDependency({workEffortId: "IRON-4", toWorkEffortId: "IRON-3", canChange: true})
            answer("saveDependency", {saved: true})
            return true
        })
        page.evaluate(async () => { await settle(); return true })
        assert.equal(
            page.evaluate(() => vm.$refs.screen.dep.open),
            true
        )
        assert.equal(
            page.evaluate(() => vm.$refs.screen.dep.dependentId),
            "IRON-4"
        )
        page.evaluate(() => {
            const screen = vm.$refs.screen
            screen.saveDependency()
            screen.dep.lagDays = "3"
            answer("saveDependency", {saved: true})
            return true
        })
        page.waitFor(() => !vm.$refs.screen.dep.busy)
        assert.equal(
            page.evaluate(() => vm.$refs.screen.dep.open),
            true
        )
        assert.equal(
            page.evaluate(() => vm.$refs.screen.dep.lagDays),
            "3"
        )
    }
})

feature("Manufacturing previews remain attached to their operation and submitted target", {
    expect() {
        planningPage("Timeline")
        page.evaluate(() => {
            const screen = vm.$refs.screen
            vm.currentPathList = ["Manufacturing", "Planning", "ProductionSchedule"]
            // the mount names its transitions in its schedule answer's resource (impl-people P14, F68)
            screen.rMeta = {resource: {moveTransition: "moveOperation", decideTransition: "decideOverride"}}
            screen.sched = {
                fromText: "2026-11-09 00:00",
                thruText: "2026-11-11 00:00",
                nowText: "2026-11-09 08:00",
                laneList: [
                    {laneId: "WC-A", laneName: "Center A"},
                    {laneId: "WC-B", laneName: "Center B"}
                ],
                barList: []
            }
            screen.rOpenMove({
                barId: "OP-A",
                title: "Operation A",
                laneId: "WC-A",
                startText: "2026-11-09 08:00",
                moveParameters: {operationWorkEffortId: "OP-A", expectedRevision: "1", expectedRunRevision: "1"}
            })
            screen.rOpenMove({
                barId: "OP-B",
                title: "Operation B",
                laneId: "WC-B",
                startText: "2026-11-09 09:00",
                moveParameters: {operationWorkEffortId: "OP-B", expectedRevision: "2", expectedRunRevision: "2"}
            })
            answer("moveOperation", {preview: {facilityName: "Wrong old target", refusals: [], conflicts: []}})
            return true
        })
        page.waitFor(() => pending.filter(one => one.name === "moveOperation").length === 1)
        assert.equal(
            page.evaluate(() => vm.$refs.screen.move.preview),
            null
        )
        assert.equal(
            page.evaluate(() => vm.$refs.screen.move.busy),
            true
        )
        page.evaluate(() => {
            const screen = vm.$refs.screen
            screen.move.startText = "2026-11-10 10:00"
            screen.rStale()
            answer("moveOperation", {preview: {facilityName: "Outdated target", refusals: [], conflicts: []}})
            return true
        })
        page.evaluate(async () => { await settle(); return true })
        assert.equal(
            page.evaluate(() => vm.$refs.screen.move.preview),
            null
        )
        assert.equal(
            page.evaluate(() => vm.$refs.screen.move.startText),
            "2026-11-10 10:00"
        )
        page.evaluate(() => {
            vm.$refs.screen.rPreview()
            answer("moveOperation", {preview: {facilityName: "Current target", refusals: [], conflicts: []}})
            return true
        })
        page.waitFor(() => !!vm.$refs.screen.move.preview)
        assert.equal(
            page.evaluate(() => vm.$refs.screen.move.preview.facilityName),
            "Current target"
        )
    }
})

feature("leaving a dependency drag releases its pointer handlers", {
    expect() {
        planningPage("Timeline")
        page.waitFor(() => !!document.querySelector(".boss-tl-handle"))
        page.evaluate(() => {
            window.departed = vm.$refs.screen
            document.querySelector(".boss-tl-handle").dispatchEvent(new PointerEvent("pointerdown", {button: 0, bubbles: true}))
            vm.show = false
            return true
        })
        page.waitFor(() => !vm.$refs.screen)
        assert.equal(
            page.evaluate(() => departed.linkDrag),
            null
        )
        page.evaluate(() => {
            window.dispatchEvent(new PointerEvent("pointermove", {clientX: 60, clientY: 60}))
            return true
        })
        assert.equal(
            page.evaluate(() => departed.linkDrag),
            null
        )
    }
})

feature("leaving and returning cannot revive an old planning write", {
    expect() {
        const backlog = planningPage("Backlog")
        backlog.evaluate(async () => {
            const screen = vm.$refs.screen
            screen.quick.name = "Same title"
            screen.quickAdd()
            vm.currentParameters = {rootWorkEffortId: "ACME"}
            await Vue.nextTick()
            vm.currentParameters = {rootWorkEffortId: "IRON"}
            await Vue.nextTick()
            return true
        })
        backlog.waitFor(() => !vm.$refs.screen.loading)
        const reads = backlog.evaluate(() => calls.filter(one => one.name === "backlog").length)
        backlog.evaluate(() => {
            answer("quickAdd", {workEffortId: "IRON-22"})
            return true
        })
        backlog.waitFor(() => !vm.$refs.screen.quick.busy)
        assert.equal(
            backlog.evaluate(() => vm.$refs.screen.quick.name),
            "Same title"
        )
        assert.equal(
            backlog.evaluate(() => calls.filter(one => one.name === "backlog").length),
            reads
        )

        const timeline = planningPage("Timeline")
        timeline.evaluate(() => {
            const screen = vm.$refs.screen
            screen.openDependency({workEffortId: "IRON-2", toWorkEffortId: "IRON-1", canChange: true})
            screen.saveDependency()
            vm.show = false
            return true
        })
        timeline.waitFor(() => !vm.$refs.screen)
        const timelineReads = timeline.evaluate(() => calls.filter(one => one.name === "timeline").length)
        timeline.evaluate(() => {
            answer("saveDependency", {saved: true})
            return true
        })
        timeline.evaluate(async () => { await settle(); return true })
        assert.equal(
            timeline.evaluate(() => calls.filter(one => one.name === "timeline").length),
            timelineReads
        )
    }
})

feature("Manufacturing writes preserve target and decision text edited after submission", {
    expect() {
        planningPage("Timeline")
        page.evaluate(() => {
            const screen = vm.$refs.screen
            vm.currentPathList = ["Manufacturing", "Planning", "ProductionSchedule"]
            // the mount names its transitions in its schedule answer's resource (impl-people P14, F68)
            screen.rMeta = {resource: {moveTransition: "moveOperation", decideTransition: "decideOverride"}}
            screen.sched = {
                fromText: "2026-11-09 00:00",
                thruText: "2026-11-11 00:00",
                nowText: "2026-11-09 08:00",
                laneList: [{laneId: "WC-A", laneName: "Center A"}],
                barList: []
            }
            screen.rOpenMove({
                barId: "OP-A",
                title: "Operation A",
                laneId: "WC-A",
                startText: "2026-11-09 08:00",
                moveParameters: {operationWorkEffortId: "OP-A", expectedRevision: "1", expectedRunRevision: "1"}
            })
            answer("moveOperation", {preview: {facilityName: "Center A", refusals: [], conflicts: []}})
            return true
        })
        page.waitFor(() => !!vm.$refs.screen.move.preview)
        page.evaluate(() => {
            const screen = vm.$refs.screen
            window.submittedMoveKey = screen.move.key
            screen.rCommit("apply")
            screen.move.startText = "2026-11-10 10:00"
            screen.rStale()
            answer("moveOperation", {})
            return true
        })
        page.waitFor(() => !vm.$refs.screen.move.busy)
        assert.equal(
            page.evaluate(() => vm.$refs.screen.move.open),
            true
        )
        assert.equal(
            page.evaluate(() => vm.$refs.screen.move.startText),
            "2026-11-10 10:00"
        )
        assert.equal(
            page.evaluate(() => vm.$refs.screen.move.preview),
            null
        )
        page.evaluate(() => {
            const screen = vm.$refs.screen
            screen.rOpenDecide({noticeId: "CHANGE-A", decideParameters: {scheduleChangeId: "CHANGE-A"}}, "refuse")
            screen.decide.reason = "Submitted reason"
            window.submittedDecisionKey = screen.decide.key
            screen.rDecide()
            screen.decide.reason = "Newer reason"
            answer("decideOverride", {})
            return true
        })
        page.waitFor(() => !vm.$refs.screen.decide.busy)
        assert.equal(
            page.evaluate(() => vm.$refs.screen.decide.open),
            true
        )
        assert.equal(
            page.evaluate(() => vm.$refs.screen.decide.reason),
            "Newer reason"
        )
        assert.ok(
            page.evaluate(() => vm.$refs.screen.move.key !== submittedMoveKey),
            "a changed move needs a fresh operation key"
        )
        assert.ok(
            page.evaluate(() => vm.$refs.screen.decide.key !== submittedDecisionKey),
            "a changed decision needs a fresh operation key"
        )
    }
})
