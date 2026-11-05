// Helpers the Customer Service specs share: the demo ids (data/BossCustomerServiceDemoData.xml, BossUsersDemoData.xml), the
// demo users by group, a block run as a user with artifact authorization on or off, a call's refusal message, a Customer
// Service page render, the shell's menu and providers, and the route fixtures the acceptance AppStructure renders. Later
// phases add their ids, users and routes here.
const ids = {
    // Retail's sales orders (load#CustomerServiceDemo): delivered to Joe Q Public, awaiting pick and packed for Joe's
    // Distributing
    deliveredOrderId: "BOSS_CS_SO_DELIVERED",
    pickOrderId: "BOSS_CS_SO_PICK",
    packedOrderId: "BOSS_CS_SO_PACKED",
    // Ziziwork Services' customer and order
    otherOrderId: "BOSS_CS_SO_OTHER",
    otherCustomerId: "BOSS_CS_CUST_OTHER",
    // Retail's customers (Mantle's), and a shared one (ORG_ACME, whose owner is the Party default _NA_)
    customerId: "CustJqp",
    companyCustomerId: "JoeDist",
    sharedCustomerId: "ORG_ACME",
    // Retail's purchase order (Purchasing's demo), no sales order
    purchaseOrderId: "BOSS_PUR_PO_A",
    serializedProductId: "BOSS_CS_THERMOSTAT",
    organizationId: "ORG_ZIZI_RETAIL",
    otherOrganizationId: "ORG_ZIZI_SERVICES"
}
// The demo users of each group (each also in BOSS_CUSTOMER_SERVICE but the administrator), and the other organization's agent.
const users = {
    agent: "customerservice.agent",
    manager: "customerservice.manager",
    orderDesk: "customerservice.orderdesk",
    returns: "customerservice.returns",
    knowledge: "customerservice.knowledge",
    admin: "customerservice.admin",
    agentWarehouse: "customerservice.agentwh",
    returnsReceivables: "customerservice.returnsar",
    read: "customerservice.read",
    services: "customerservice.services"
}

// Run action as username, with artifact authorization enabled or not, then sign in again as the user before.
function asUser(username, action, enabled = true) {
    const previousUsername = ec.user.username || "john.doe"
    login(username)
    const disabled = ec.artifactExecution.authzDisabled()
    try {
        if (enabled) ec.artifactExecution.enableAuthz()
        else ec.artifactExecution.disableAuthz()
        return action()
    } finally {
        ec.message.clearErrors()
        if (disabled) ec.artifactExecution.disableAuthz()
        else ec.artifactExecution.enableAuthz()
        login(previousUsername)
    }
}
// Run action with artifact authorization disabled (a spec's own setup and reads).
function system(action) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try {
        return action()
    } finally {
        if (!wasDisabled) ec.artifactExecution.enableAuthz()
    }
}
// The message a call is refused with, or "" when it succeeds: a negative case checks the message names the refusal, and a
// positive case with the same parameters gets "", so a validation error is not taken for a refusal.
function refusal(service, parameters = {}) {
    ec.message.pushErrors()
    try {
        ec.service.sync().name(service).parameters(parameters).requireNewTransaction(true).call()
        return ec.message.hasError() ? ec.message.getErrorsString() : ""
    } catch (error) {
        return String(error.message)
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}
function invoke(service, parameters = {}) {
    return ec.service.sync().name(service).parameters(parameters).call() || {}
}
// A Customer Service screen as the shell fetches it (qvt, a fragment of the last standalone screen, with its lists' data), with
// a widget's render error counted among the errors.
function page(path, parameters = {}, mode = "qvt") {
    const renderer = ec.screen.makeTest().rootScreen("component://mr-boss/screen/CustomerService.xml").renderMode(mode)
    if (mode === "qvt") renderer.withStaticData()
    const result = renderer.render(path, Object.assign({lastStandalone: "-2"}, parameters), null)
    const output = String(result.output || "")
    const failed = output.match(/(Error rendering|Exception in render)[^\n<]*/g) || []
    const errors = Array.from(result.errorMessages || []).concat(failed)
    ec.message.clearErrors()
    return {status: result.status, output, errors}
}
// The shell's menu of Customer Service and the launcher's apps for the user, as the shell fetches them.
function shell(user) {
    const root = "component://webroot/screen/webroot.xml"
    return asUser(user, () => {
        const menu = ec.screen.makeTest().rootScreen(root).render("menuData/apps/CustomerService/Home", {}, null)
        const data = ec.screen.makeTest().rootScreen(root).render("shellData", {}, null)
        const apps = JSON.parse(data.output).apps
        const level = menu.status == 200 ? JSON.parse(menu.output).find(level => level.name === "CustomerService") : null
        return {
            status: menu.status,
            names: level ? level.subscreens.filter(item => item.menuInclude).map(item => item.name) : [],
            apps: apps.map(app => app.name),
            providers: apps.find(app => app.name === "CustomerService")?.providers
        }
    })
}

// The route fixtures of the Customer Service screens that are not placeholders, for the acceptance AppStructure: by path under
// the root, the demo record's parameters and a text the screen shows in every data state; and the shared screens mounted
// under the root that the screen file walk does not find, as [path, screen location]. Each phase adds its routes.
function routeFixtures() {
    const routes = {
        // P1: Home's measures (measured by later phases) and the lookup of the delivered demo order
        Home: {parameters: {lookupType: "order", lookupId: ids.deliveredOrderId}, text: "Thermostat and filters"}
    }
    const mounts = []
    return {routes, mounts}
}

;({ids, users, asUser, system, refusal, invoke, page, shell, routeFixtures})
