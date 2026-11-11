// Admin P2's "usable when" (impl-admin P2), as an acceptance walk with artifact authorization on: on the demo instance Home names
// the SMTP and backup warnings with their fix links for an instance administrator; a finance reader with no Admin group sees
// Accounting's readiness only through Accounting; a Commerce store's readiness findings appear on Health for admin.reader, who
// opens no store; and the settings index opens Warehouse's settings for a warehouse manager without the Admin launcher's other
// areas. The rules themselves are AdminRegistries' and AdminAccess'.
// Run: ./moq accept mr-boss --spec AdminRegistriesWalk
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {users, outsiders, asUser, refusal} = lib
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
const appPage = (root, path, parameters = {}) => {
    const result = ec.screen
        .makeTest()
        .rootScreen("component://mr-boss/screen/" + root + ".xml")
        .renderMode("html")
        .render(path, parameters, null)
    const output = String(result.output || "")
    ec.message.clearErrors()
    return {
        status: result.status,
        output,
        errors: Array.from(result.errorMessages || []).concat(output.match(/(Error rendering|Exception in render)[^\n<]*/g) || [])
    }
}

feature("Home names the mail and backup warnings with their fix links for an instance administrator", {
    when() {
        return {home: asUser(users.system, () => lib.page("Home"))}
    },
    then({home}) {
        home.status == 200
        home.errors == []
        home.output.includes("The SYSTEM mail server has no SMTP host, so the instance sends no mail")
        home.output.includes("The nightly database backup is paused")
        home.output.includes("Backups are not mirrored off the server")
        home.output.includes("/qapps/tools/Data/Grid?entityName=moqui.basic.email.EmailServer")
        home.output.includes("/qapps/Admin/System/ServiceJob/Jobs/ServiceJobDetail?jobName=backup_EmbeddedDatabase_daily")
        home.output.includes(
            "/qapps/Admin/System/SystemMessage/Remote/MessageRemoteDetail?systemMessageRemoteId=EmbeddedDbBackup"
        )
    }
})

feature("a finance reader without an Admin group reads Accounting's readiness in Accounting only", {
    when() {
        const user = outsiders.financeReader
        return {
            readiness: asUser(user, () => refusal("ironstone.admin.RegistryServices.get#Readiness", {})),
            adminHome: asUser(user, () => lib.page("Home", {}, "html")),
            health: asUser(user, () => lib.page("Operations/Health", {}, "html")),
            accountingHome: asUser(user, () => appPage("Accounting", "Home"))
        }
    },
    then({readiness, adminHome, health, accountingHome}) {
        ;/is not authorized|ADMIN_UNAVAILABLE/.test(readiness)
        !opened(adminHome)
        !opened(health)
        opened(accountingHome)
    }
})

feature("a Commerce store's readiness appears on Health for the administrative reader, who opens no store", {
    when() {
        return {
            health: asUser(users.reader, () => lib.page("Operations/Health", {ownerApp: "Commerce"}, "html")),
            store: asUser(users.reader, () => appPage("Commerce", "Stores/StoreDetail", {productStoreId: "POPC_DEFAULT"}))
        }
    },
    then({health, store}) {
        opened(health)
        health.output.includes("Store readiness")
        health.output.includes("Ziziwork Retail Store")
        !health.output.includes("/qapps/Commerce/Stores/StoreDetail")
        !opened(store)
    }
})

feature("the settings index opens Warehouse's settings for a warehouse manager, and no other Admin area", {
    when() {
        const user = outsiders.warehouseManager
        return {
            index: asUser(user, () => lib.page("Settings/SettingsHome", {}, "html")),
            areas: ["Home", "Operations", "Agents", "System"].filter(area =>
                opened(asUser(user, () => lib.page(area, {}, "html")))
            ),
            warehouseSettings: asUser(user, () => appPage("Warehouse", "Settings/Index")),
            launcher: lib.shell(user).apps
        }
    },
    then({index, areas, warehouseSettings, launcher}) {
        opened(index)
        index.output.includes("/qapps/Warehouse/Settings/Index")
        areas == []
        opened(warehouseSettings)
        !launcher.includes("Admin")
    }
})
