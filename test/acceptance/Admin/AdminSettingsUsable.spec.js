// Admin P8's "usable when" (impl-admin P8; design-admin §7 InstanceSettings, Localization and ReferenceData), as an acceptance
// walk with artifact authorization on: Ziziwork Retail's configuration administrator (admin.configure, not an instance
// administrator) sets the instance name and the default time zone through Admin › Settings › Instance and sees which values are
// instance preferences and which come from the deployment's configuration and wait for a restart; translates a message into
// Spanish with its placeholder kept (a translation that drops it is refused with the reason) and finds it in Localization;
// and ReferenceData sends a unit change to Products: the unit kind links Products' Units for a user Products opens to, which
// opens, and is not linked for the configuration administrator, who changes no unit in Admin. The rules are the framework's
// AdminConfiguration spec and BOSS's AdminSettings.
// Run: ./moq accept mr-boss --spec AdminSettingsUsable
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {users, asUser, system, invoke, page} = lib
const C = "org.moqui.admin.ConfigurationServices."
const original = "Acceptance settings: ${count} checks to do"
const keys = ["instance.displayName", "instance.defaultTimeZone"]
const setting = key => system(() => Array.from(invoke(C + "get#EffectiveSettings", {settingKey: key}).settingList)[0])
const store = parameters => asUser(users.configure, () => page("Settings/InstanceSettings/storePreference", parameters, "html"))
const translate = localized =>
    asUser(users.configure, () =>
        page("Settings/Localization/storeMessage", {original, translationLocale: "es", localized}, "html")
    )
const translation = () =>
    system(() => ec.entity.find("moqui.basic.LocalizedMessage").condition({original, locale: "es"}).disableAuthz().one())
const clean = () =>
    system(() => {
        ec.entity.find("moqui.server.InstancePreference").condition("settingKey", "in", keys).deleteAll()
        ec.entity.find("moqui.basic.LocalizedMessage").condition({original}).deleteAll()
    })

spec({
    setupSpec() {
        login("john.doe")
        clean()
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        clean()
        ec.artifactExecution.enableAuthz()
    }
})

feature("the configuration administrator names the instance and sets its time zone, and sees what the deployment sets", {
    when() {
        const before = setting("instance.defaultTimeZone")
        const named = store({settingKey: "instance.displayName", value: "Ziziwork", reason: "Acceptance: the company's name"})
        const zoned = store({
            settingKey: "instance.defaultTimeZone",
            value: "America/Chicago",
            expectedRevision: before.revision,
            reason: "Acceptance: head office"
        })
        const wrong = store({settingKey: "instance.defaultTimeZone", value: "Mars/Olympus", expectedRevision: ""})
        return {
            before,
            named,
            zoned,
            wrong,
            name: setting("instance.displayName"),
            zone: setting("instance.defaultTimeZone"),
            screen: asUser(users.configure, () => page("Settings/InstanceSettings")),
            home: asUser(users.configure, () => page("Home", {}, "html")),
            read: asUser(users.reader, () => invoke(C + "get#InstancePreference", {settingKey: "instance.displayName"}))
        }
    },
    then({before, named, zoned, wrong, name, zone, screen, home, read}) {
        before.source != "preference"
        named.errors.length == 0 && zoned.errors.length == 0 && wrong.errors.length == 0
        name.value == "Ziziwork" && name.source == "preference" && name.changeReason == "Acceptance: the company's name"
        // the time zone that is not one, and at a stale revision, changed nothing
        zone.value == "America/Chicago" && zone.source == "preference"
        screen.status == 200 && screen.errors.length == 0
        screen.output.includes("Ziziwork") &&
            screen.output.includes("America/Chicago") &&
            screen.output.includes("Instance preference")
        // the deployment's values: their keys, where they come from and that a change waits for a restart
        screen.output.includes("default_time_zone") && screen.output.includes("webapp_http_host")
        screen.output.includes("In the deployment") && screen.output.includes("After a restart")
        screen.output.includes("Set default_time_zone in the environment or the runtime conf and restart")
        // the name is shown where the instance is named, and code reads it without an Admin permission
        home.output.includes("Ziziwork")
        read.value == "Ziziwork"
    }
})

feature("a message is translated with its placeholder kept", {
    when() {
        const dropped = translate("Ajustes de aceptación: comprobaciones pendientes")
        const droppedRow = translation()
        const kept = translate("Ajustes de aceptación: ${count} comprobaciones pendientes")
        return {
            dropped,
            droppedRow,
            kept,
            row: translation(),
            list: asUser(users.configure, () => page("Settings/Localization", {locale: "es", text: "acceptance settings"})),
            missing: asUser(users.configure, () =>
                page("Settings/Localization", {locale: "fr", text: "acceptance settings", missing: "true"}, "html")
            ),
            audit: system(() =>
                ec.entity
                    .find("moqui.entity.EntityAuditLog")
                    .condition({changedEntityName: "moqui.basic.LocalizedMessage", pkPrimaryValue: original})
                    .disableAuthz()
                    .list()
            )
        }
    },
    then({dropped, droppedRow, kept, row, list, missing, audit}) {
        dropped.errors.length == 0 && droppedRow == null
        kept.errors.length == 0 && row.localized == "Ajustes de aceptación: ${count} comprobaciones pendientes"
        list.status == 200 && list.errors.length == 0 && list.output.includes("comprobaciones pendientes")
        // the same message is still to translate in French
        missing.output.includes("Acceptance settings") && missing.output.includes("Translate")
        audit.length == 1 && audit[0].pkSecondaryValue == "es"
    }
})

feature("ReferenceData sends a unit change to Products", {
    when() {
        return {
            owner: asUser(users.system, () => page("Settings/ReferenceData", {text: "unit"})),
            units: asUser(users.system, () => {
                const result = ec.screen
                    .makeTest()
                    .rootScreen("component://mr-boss/screen/Products.xml")
                    .renderMode("html")
                    .render("Units", {lastStandalone: "-2"}, null)
                ec.message.clearErrors()
                return {status: result.status, output: String(result.output || "")}
            }),
            configure: asUser(users.configure, () => page("Settings/ReferenceData", {}, "html")),
            index: asUser(users.configure, () => page("Settings/SettingsHome", {text: "reference"}, "html"))
        }
    },
    then({owner, units, configure, index}) {
        owner.status == 200 && owner.errors.length == 0
        owner.output.includes("Units of measure") &&
            owner.output.includes("/qapps/Products/Units") &&
            owner.output.includes("Products")
        units.status == 200 && units.output.includes("Unit")
        // the configuration administrator is in no Products group: Admin links no unit screen to them and edits none itself
        configure.status == 200 && !configure.output.includes("/qapps/Products/Units")
        index.output.includes("Reference data")
    }
})
