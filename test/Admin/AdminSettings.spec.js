// Instance settings, localization and reference data in Admin (impl-admin P8; design-admin §7 InstanceSettings, Localization and
// ReferenceData): InstanceSettings' one qvt render as Ziziwork Retail's configuration administrator (the instance preferences
// with their values and sources, the deployment values with their restart effect); a preference and a translation changed
// through the screens' transitions by the configuration administrator, who is not an instance administrator, an unregistered
// key and a dropped placeholder refused with their reasons; the administrative reader, without ADMIN_SETTINGS_VIEW, opens
// neither screen; ReferenceData links a kind's owner only for a viewer the owner's screen opens to. The framework's rules
// (types, limits, revisions, secrets, label targets) are the framework's AdminConfiguration spec.
// Run: ./moq test mr-boss --spec AdminSettings
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {users, asUser, invoke, page} = lib
const C = "org.moqui.admin.ConfigurationServices."
const original = "Spec settings ${count} open"
const preference = key => lib.system(() => invoke(C + "get#InstancePreference", {settingKey: key}))
const translation = () =>
    lib.system(() => ec.entity.find("moqui.basic.LocalizedMessage").condition({original, locale: "es"}).disableAuthz().one())

spec({
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.disableAuthz()
        ec.entity.find("moqui.server.InstancePreference").condition({settingKey: "instance.displayName"}).deleteAll()
        ec.entity.find("moqui.basic.LocalizedMessage").condition({original}).deleteAll()
        ec.artifactExecution.enableAuthz()
    }
})

feature("InstanceSettings shows the configuration administrator the preferences and where each value comes from", {
    when() {
        return asUser(users.configure, () => page("Settings/InstanceSettings"))
    },
    then({status, output, errors}) {
        status == 200
        errors.length == 0
        output.includes("Instance name") && output.includes("Default time zone")
        output.includes("New-device sign-in window") && output.includes("Group recipient ceiling")
        // the ceiling's default, and a deployment value with its key and restart effect
        output.includes("200") && output.includes("Default")
        output.includes("default_time_zone") && output.includes("After a restart") && output.includes("In the deployment")
        // the conf itself is an instance administrator's
        !output.includes("Open the conf")
    }
})

feature("the configuration administrator changes a preference and a translation; the reader opens neither screen", {
    when() {
        return {
            stored: asUser(users.configure, () =>
                page(
                    "Settings/InstanceSettings/storePreference",
                    {settingKey: "instance.displayName", value: "Ziziwork", reason: "Spec"},
                    "html"
                )
            ),
            name: preference("instance.displayName").value,
            unregistered: asUser(users.configure, () =>
                page("Settings/InstanceSettings/storePreference", {settingKey: "instance.unknown", value: "x"}, "html")
            ),
            unknownRows: lib.system(
                () =>
                    ec.entity
                        .find("moqui.server.InstancePreference")
                        .condition({settingKey: "instance.unknown"})
                        .disableAuthz()
                        .list().length
            ),
            dropped: asUser(users.configure, () =>
                page(
                    "Settings/Localization/storeMessage",
                    {original, translationLocale: "es", localized: "Ajustes abiertos"},
                    "html"
                )
            ),
            droppedRow: translation(),
            translated: asUser(users.configure, () =>
                page(
                    "Settings/Localization/storeMessage",
                    {original, translationLocale: "es", localized: "${count} ajustes abiertos"},
                    "html"
                )
            ),
            row: translation(),
            list: asUser(users.configure, () => page("Settings/Localization", {locale: "es", text: "spec settings"}, "html")),
            reader: asUser(users.reader, () => page("Settings/InstanceSettings", {}, "html")),
            readerStore: asUser(users.reader, () =>
                page("Settings/InstanceSettings/storePreference", {settingKey: "instance.displayName", value: "Reader"}, "html")
            ),
            readerLocalization: asUser(users.reader, () => page("Settings/Localization", {}, "html")),
            after: preference("instance.displayName").value
        }
    },
    then({
        stored,
        name,
        unregistered,
        unknownRows,
        dropped,
        droppedRow,
        translated,
        row,
        list,
        reader,
        readerStore,
        readerLocalization,
        after
    }) {
        stored.errors.length == 0 && name == "Ziziwork"
        // refused with its reason, nothing written
        unregistered.errors.length == 0 && unknownRows == 0
        droppedRow == null
        translated.errors.length == 0 && row.localized == "${count} ajustes abiertos"
        list.errors.length == 0 && list.output.includes("ajustes abiertos") && list.output.includes("Change")
        reader.status != 200 || reader.errors.length > 0
        readerLocalization.status != 200 || readerLocalization.errors.length > 0
        after == "Ziziwork"
    }
})

feature("ReferenceData links a kind to its owner only for a viewer the owner's screen opens to", {
    when() {
        return {
            system: asUser(users.system, () => page("Settings/ReferenceData", {}, "html")),
            configure: asUser(users.configure, () => page("Settings/ReferenceData", {}, "html"))
        }
    },
    then({system, configure}) {
        system.errors.length == 0 && system.output.includes("Units of measure") && system.output.includes("/qapps/Products/Units")
        system.output.includes("Currencies") && system.output.includes("Status flows")
        // an Admin user in no Products or Accounting group opens the screen and is linked to neither
        configure.status == 200 && configure.errors.length == 0
        !configure.output.includes("/qapps/Products/Units") && !configure.output.includes("Status flows")
    }
})
