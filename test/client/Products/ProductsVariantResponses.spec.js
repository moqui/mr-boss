// Focused regressions for the real variant component's asynchronous ownership. Deferred responses exercise the bug
// without a database, a second Products walk or acceptance fixtures.
let page
spec({
    server: false,
    timeout: 15,
    setupSpec() {
        page = browser.newPage({viewport: {width: 1280, height: 900}})
    }
})

function variantPage() {
    page.setContent(`<!doctype html><html><head><link rel="stylesheet" href="/libs/quasar/quasar.prod.css">
        <link rel="stylesheet" href="/css/WebrootVue.qvt.css"></head>
        <body><div id="app"></div><script src="/libs/vue/vue.global.prod.js"></script>
        <script src="/libs/quasar/quasar.umd.prod.js"></script><script src="/js/MoquiLib.js"></script>
        <script src="/js/WebrootVue.qvt.js"></script><script>
        window.pending = []; window.confirmations = []; window.calls = [];
        window.settle = () => new Promise(resolve => setTimeout(resolve, 0)).then(() => Vue.nextTick());
        window.preview = id => ({product:{productId:id,productName:'Source '+id},previewRevision:'revision-'+id,
            rows:[{featureKey:JSON.stringify([id+'-F']),productFeatureIds:[id+'-F'],combination:id+' feature',
                proposedProductId:id+'-SKU',allowed:true}],featureTypeInfoList:[],copyFields:[],batchLimit:1000,totalCount:1});
        window.take = name => {const index=pending.findIndex(request=>request.name===name);return pending.splice(index,1)[0]};
        moqui.confirmAction = () => new Promise(resolve => confirmations.push(resolve));
        moqui.request = (url, options) => {
            const name=url.split('/').pop(),params=Object.assign({},options&&options.params);
            if(name==='choices')return Promise.resolve({json:[]});
            calls.push({name,params});
            return new Promise((resolve,reject)=>pending.push({name,params,resolve,reject}));
        };
        fetch('/files/component/mr-boss/screen/Products/Products/VariantBuilder.qvue').then(response=>response.text()).then(text=>{
            const part=tag=>text.slice(text.indexOf('<'+tag+'>')+tag.length+2,text.lastIndexOf('</'+tag+'>'));
            const module={};new Function('module',part('script'))(module);
            window.app=Vue.createApp({data(){return{basePath:'/apps',linkBasePath:'/qapps',
                currentPathList:['Products','Products','VariantBuilder'],currentParameters:{},show:true}},
                methods:{setUrl(){}},template:'<variant-screen v-if="show" ref="screen"></variant-screen>'});
            app.use(Quasar);Object.entries(moqui.qvt.components).forEach(([name,component])=>app.component(name,component));
            app.component('variant-screen',Object.assign(module.exports,{template:part('template')}));window.vm=app.mount('#app');
        });
        </script></body></html>`)
    page.waitFor(() => !!(window.vm && vm.$refs.screen))
}

function readyPreview() {
    variantPage()
    page.evaluate(async () => {
        const screen = vm.$refs.screen
        screen.form.productId = "A"
        screen.sourceChanged()
        screen.load(0)
        take("preview").resolve({json: preview("A")})
        await settle()
        screen.selected = ['["A-F"]']
        return true
    })
}

feature("structured HTTP failures name the refusal and preserve the current operation results", {
    expect() {
        readyPreview()
        page.evaluate(async () => {
            const screen = vm.$refs.screen
            screen.operationKey = "operation-held"
            screen.results = [{result: "pending", featureKey: '["A-F"]'}]
            screen.summary = "0 created · 0 existing · 0 failed"
            screen.pendingCount = 1
            screen.runBatch(false)
            take("run").reject({status: 403, json: {errors: "Catalog edit access was revoked"}, text: ""})
            await settle()
            return true
        })
        assert.equal(page.getByRole("alert").text(), "Catalog edit access was revoked")
        assert.equal(page.evaluate(() => vm.$refs.screen.operationKey), "operation-held")
        assert.equal(page.evaluate(() => vm.$refs.screen.results[0].result), "pending")
        assert.equal(page.evaluate(() => vm.$refs.screen.pendingCount), 1)
        assert.equal(page.evaluate(() => vm.$refs.screen.busy), false)
    }
})

feature("late preview success and failure cannot overwrite a different source or release its pending preview", {
    expect() {
        variantPage()
        page.evaluate(async () => {
            const screen = vm.$refs.screen
            for (const id of ["A", "B", "C"]) {
                screen.form.productId = id
                screen.sourceChanged()
                screen.load(0)
            }
            pending[1].reject(new Error("Old B request failed"))
            await settle()
            return true
        })
        assert.equal(page.evaluate(() => vm.$refs.screen.busy), true, "C is still loading")
        assert.equal(page.evaluate(() => vm.$refs.screen.error), "", "an obsolete error belongs to its old preview")
        page.evaluate(async () => {
            pending[2].resolve({json: preview("C")})
            await settle()
            pending[0].resolve({json: preview("A")})
            await settle()
            return true
        })
        assert.equal(page.evaluate(() => vm.$refs.screen.revision), "revision-C")
        assert.equal(page.evaluate(() => vm.$refs.screen.rows[0].proposedProductId), "C-SKU")
        assert.equal(page.evaluate(() => vm.$refs.screen.form.productId), "C")
    }
})

feature("confirmation belongs to the displayed selection and cannot submit a replacement source", {
    expect() {
        readyPreview()
        page.getByRole("button", {name: "Generate selected", exact: true}).click()
        page.evaluate(async () => {
            const screen = vm.$refs.screen
            screen.form.productId = "B"
            screen.sourceChanged()
            screen.revision = "revision-B"
            screen.selected = ['["B-F"]']
            confirmations.shift()(true)
            await settle()
            return true
        })
        assert.equal(page.evaluate(() => calls.filter(call => call.name === "generate").length), 0)
        assert.equal(page.evaluate(() => vm.$refs.screen.revision), "revision-B")
        assert.equal(page.evaluate(() => vm.$refs.screen.selected[0]), '["B-F"]')
    }
})

feature("operation changes discard old results and prevent a delayed operation answer from replacing the new one", {
    expect() {
        readyPreview()
        page.fill("input[name=operationKey]", "operation-A")
        page.getByRole("button", {name: "Load operation", exact: true}).click()
        page.fill("input[name=operationKey]", "operation-B")
        page.getByRole("button", {name: "Load operation", exact: true}).click()
        page.evaluate(async () => {
            take("batch").resolve({json: {createdCount: 8, results: [{result: "created", productId: "A-SKU"}]}})
            await settle()
            return true
        })
        assert.equal(page.evaluate(() => vm.$refs.screen.busy), true)
        assert.equal(page.evaluate(() => vm.$refs.screen.summary), "")
        assert.equal(page.evaluate(() => vm.$refs.screen.results.length), 0)
        page.evaluate(async () => {
            take("batch").resolve({json: {createdCount: 1, results: [{result: "created", productId: "B-SKU"}]}})
            await settle()
            return true
        })
        assert.equal(page.evaluate(() => vm.$refs.screen.results[0].productId), "B-SKU")
        page.evaluate(async () => {
            const screen = vm.$refs.screen
            screen.form.productId = "C"
            screen.sourceChanged()
            await Vue.nextTick()
            return true
        })
        assert.equal(page.evaluate(() => vm.$refs.screen.operationKey), "")
        assert.equal(page.evaluate(() => vm.$refs.screen.results.length), 0)
        assert.equal(page.evaluate(() => vm.$refs.screen.summary), "")
    }
})

feature("typing an operation key while variants generate keeps the generate result", {
    expect() {
        readyPreview()
        page.getByRole("button", {name: "Generate selected", exact: true}).click()
        page.evaluate(async () => {
            confirmations.shift()(true)
            await settle()
            return true
        })
        page.fill("input[name=operationKey]", "operation-typed")
        page.evaluate(async () => {
            take("generate").resolve({json: {createdCount: 1, results: [{result: "created", productId: "A-SKU"}]}})
            await settle()
            return true
        })
        assert.equal(page.evaluate(() => vm.$refs.screen.results[0].productId), "A-SKU")
        assert.equal(page.evaluate(() => vm.$refs.screen.summary.startsWith("1 created")), true)
    }
})

feature("leaving the component invalidates callbacks instead of refreshing a different page", {
    expect() {
        readyPreview()
        page.fill("input[name=operationKey]", "operation-A")
        page.getByRole("button", {name: "Process next batch", exact: true}).click()
        page.evaluate(async () => {
            window.departed = vm.$refs.screen
            vm.show = false
            await Vue.nextTick()
            vm.currentPathList = ["Products", "Home"]
            take("run").resolve({json: {createdCount: 1}})
            await settle()
            return true
        })
        assert.equal(page.evaluate(() => calls.filter(call => call.name === "preview").length), 1)
        assert.equal(page.evaluate(() => departed.summary), "")
    }
})

feature("long complete feature keys stay within the phone-width combination list", {
    expect() {
        page.setViewport(390, 844)
        readyPreview()
        page.evaluate(async () => {
            vm.$refs.screen.rows[0].featureKey = JSON.stringify([
                "REVIEW_COLOR_WITH_A_LONG_IDENTIFIER",
                "REVIEW_SIZE_WITH_A_LONG_IDENTIFIER",
                "REVIEW_FABRIC_WITH_A_LONG_IDENTIFIER"
            ])
            await Vue.nextTick()
            return true
        })
        assert.equal(page.locator("[data-variant-list]").count(), 1)
        const geometry = page.evaluate(() => ({
            client: document.documentElement.clientWidth,
            scroll: document.documentElement.scrollWidth,
            key: Array.from(document.querySelectorAll('[data-variant-list] .text-mono')).map(node => ({
                client: node.clientWidth, scroll: node.scrollWidth, wrap: getComputedStyle(node).overflowWrap
            }))
        }))
        assert.ok(geometry.key.length > 0 && geometry.key.every(key => key.scroll <= key.client), JSON.stringify(geometry))
    }
})

feature("destination parameters cannot start requests while the departing variant component is still mounted", {
    expect() {
        readyPreview()
        page.evaluate(async () => {
            vm.currentPathList = ["Products", "Products", "Product360"]
            vm.currentParameters = {productId: "CREATED_VARIANT"}
            await settle()
            return true
        })
        assert.equal(page.evaluate(() => calls.filter(call => call.name === "preview").length), 1)
    }
})
