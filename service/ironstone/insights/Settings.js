// Insights' Settings and data readiness (impl-insights P10; design-insights §11 Settings, DataReadiness; INS-01, INS-06,
// INS-09), ironstone.insights.ContextServices get#Settings and store#Settings and RegistryServices find#SourceReadiness.
//
// Settings. An organization's analytics defaults are registered PartySetting types mr-boss seeds for the OrgInternal role
// (impl-insights §4; Insights.js settingTypes and its readers, which every module that applies a default uses): the default
// dashboard, flow map and digest, the display time zone and week start of Insights' own queries, the freshness policy of
// DataReadiness and the recipient cap of group delivery. A holder of INSIGHTS_SETTINGS_EDIT changes them for an organization
// in their scope at the revision read; each choice is checked as it will be read (a definition of its kind the saver reads,
// a zone the server knows, a value of its enumeration), and the cap is refused above Admin's instance ceiling
// (report.groupRecipientCeiling), which an app form never raises. Fiscal periods stay Accounting's organization calendar,
// export and delivery limits the instance's: get#Settings explains them (ScopeAndDelivery) to every reader and changes
// none. A setting grants nothing: a default dashboard a viewer does not read is not shown to them.
//
// Data readiness. There is no registry here (design §11, review Z9): the sources are the readiness providers Insights
// registered in Admin's registry, read through ironstone.admin.RegistryServices.get#Readiness as the viewer, so a source the
// viewer may not read is left out and one that fails is named. This module adds what Insights knows of each source (its
// domain owner and class, ironstone.insights.DatasetClass) and the organization's freshness policy: a ready source whose
// last rebuild is older than the policy allows is stale, with its lag. A refresh is Admin's request#Refresh of the
// registered operation, checked by the registration's own permission; nothing here names a service or an index.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const insights = ec.resource.script("component://mr-boss/service/ironstone/insights/Insights.js")
const admin = ec.resource.script("component://mr-boss/service/ironstone/admin/Admin.js")
const {find, one, rows, denied, reasonCode} = lib

const R = "org.moqui.report.ReportServices."
const READINESS = "ironstone.admin.RegistryServices.get#Readiness"
const providerPrefix = "insights.dataset."
const freshnessType = "InsightsFreshnessPolicy"
const weekStartType = "InsightsWeekStart"
const classType = "InsightsDatasetClass"
// a source with no rebuild yet has no lag; one never classified is shown as such
const dayMinutes = 24 * 60
const names = Object.keys(insights.settingTypes)

const text = value => String(value ?? "").trim()
const blank = value => value == null || text(value) === ""
const enumOptions = enumTypeId =>
    rows("moqui.basic.Enumeration", {enumTypeId})
        .sort((a, b) => Number(a.sequenceNum ?? 99) - Number(b.sequenceNum ?? 99))
        .map(row => ({value: row.enumId, label: row.description, code: row.enumCode}))
// a policy's lag allowed, in words: whole days or hours where it is one
function frequencyText(minutes) {
    const value = Number(minutes)
    const counted = (count, unit) => count + " " + unit + (count === 1 ? "" : "s")
    if (value % dayMinutes === 0) return counted(value / dayMinutes, "day")
    if (value % 60 === 0) return counted(value / 60, "hour")
    return counted(value, "minute")
}
// The freshness policy's lag allowed, in minutes (its enumCode); a day when none is chosen or it does not read as a number.
function policyOf(freshnessPolicyId) {
    const policy = freshnessPolicyId
        ? one("moqui.basic.Enumeration", {enumId: freshnessPolicyId, enumTypeId: freshnessType})
        : null
    const minutes = Number(policy?.enumCode)
    return {
        freshnessPolicyId: policy?.enumId || null,
        label: policy?.description || "",
        maxLagMinutes: Number.isInteger(minutes) && minutes > 0 ? minutes : dayMinutes
    }
}
// A refusal the user can act on is the answer (applied false with its code and reason), so a screen shows it; anything else
// is logged and answered as the fallback, without its diagnostics.
function attempt(action, fallback) {
    try {
        return Object.assign({applied: true, reasonCode: null, reason: null}, action())
    } catch (error) {
        const code = reasonCode(error)
        if (!code) ec.logger.error("Insights settings: " + fallback + ": " + error.message)
        return {
            applied: false,
            reasonCode: code || "SETTINGS_FAILED",
            reason: code ? String(error.message).replace(/^[A-Z][A-Z0-9_]+: /, "") : fallback
        }
    }
}
// The revision of an organization's analytics defaults: its own values of the registered types, whoever stored them (this
// form or Admin's OrganizationDefaults), so a change made elsewhere since the read is seen.
function revisionOf(partyId) {
    const own = Array.from(
        find("mantle.party.PartySetting", {partyId})
            .condition("partySettingTypeId", "in", Object.values(insights.settingTypes))
            .list()
    )
        .map(row => [row.partySettingTypeId, row.settingValue])
        .sort((a, b) => a[0].localeCompare(b[0]))
    return lib.hash(own)
}

// ===== the choices =====
// The definitions the saver reads, by kind, as the engine lists them for the saver: a default is chosen among what its
// chooser reads, and each viewer's own read decides whether it is shown to them.
function definitionsOf(definitionType) {
    return Array.from(insights.asViewer(R + "list#Definitions", {definitionType}).definitions || [])
}
const option = definition => ({value: definition.id, label: definition.title || definition.id})
const byLabel = (a, b) => a.label.localeCompare(b.label)
function choices(organizationPartyId) {
    const reports = definitionsOf("report")
    return {
        // Tools' telemetry dashboards are not Insights' (design §4 Dashboards)
        dashboards: definitionsOf("dashboard")
            .filter(definition => definition.component !== "tools")
            .map(option)
            .sort(byLabel),
        // the suite templates and this organization's own maps
        maps: reports
            .filter(
                definition =>
                    definition.body?.kind === "flowmap" &&
                    (definition.readOnly || definition.body.organizationPartyId === organizationPartyId)
            )
            .map(option)
            .sort(byLabel),
        digests: reports
            .filter(definition => definition.body?.kind === "digest")
            .map(option)
            .sort(byLabel),
        timeZones: Array.from(ec.l10n.getAvailableTimeZones() || [])
            .map(zone => String(zone?.getID?.() || zone))
            .filter(Boolean)
            .sort()
            .map(zone => ({value: zone, label: zone})),
        weekStarts: enumOptions(weekStartType),
        freshnessPolicies: enumOptions(freshnessType)
    }
}

// ===== get#Settings =====
// Whether report mail is ready to send, from Admin's readiness registry as the viewer: its state for one who may read that
// check (an administrative reader), else where it is shown. One failure here is this row's, not the page's.
function sending() {
    ec.message.pushErrors()
    try {
        const check = Array.from(insights.asViewerApart(READINESS, {providerKey: "admin.reportMail"}).checks || [])[0]
        if (check) return check.stateName + (check.message ? ": " + check.message : "")
    } catch (error) {
        ec.logger.warn("Insights settings: report mail readiness was not read: " + error.message)
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
    return "Checked by the instance's administrators"
}
// ScopeAndDelivery (design §11): the controls in effect for the organization, in words, with where each is set and its
// owner's screen when the viewer's own groups open it. Read by every Insights reader; it changes nothing and names no
// person.
function controls(organizationPartyId, values, ceiling) {
    const grants = insights.grants()
    const link = path => {
        try {
            return admin.destinationOpens(grants, path) ? "/qapps/" + path : null
        } catch (error) {
            ec.logger.error("Insights settings: " + path + " was not checked: " + error.message)
            return null
        }
    }
    const cap = Math.min(Number(values.groupRecipientCap) || 50, ceiling)
    const policy = policyOf(values.freshnessPolicyId)
    const groups = permission =>
        Array.from(
            new Set(
                rows("moqui.security.UserGroupPermission", {userPermissionId: permission})
                    .filter(row => lib.active(row) && String(row.userGroupId).startsWith("BOSS_INSIGHTS"))
                    .map(row => row.userGroupId)
            )
        )
            .map(userGroupId => one("moqui.security.UserGroup", {userGroupId})?.description || userGroupId)
            .sort()
            .join(", ")
    return [
        {
            control: "Fiscal calendar",
            value: "Accounting's fiscal periods of " + insights.partyName(organizationPartyId),
            note: "Fiscal ranges follow the organization's calendar in Accounting; it is not set here.",
            url: link("Accounting/Settings/Settings")
        },
        {
            control: "Display time zone and week",
            value:
                (values.displayTimeZone || "Each viewer's own time zone") +
                "; " +
                (values.weekStart
                    ? "weeks start on " +
                      (one("moqui.basic.Enumeration", {enumId: values.weekStart})?.description || values.weekStart)
                    : "the instance's week start"),
            note: "Applied to the time grains of Analysis and Assist. Saved dashboards group by each viewer's own zone."
        },
        {
            control: "Delivery",
            value: "To oneself, or to people and groups who may see exactly what the owner sees",
            note:
                "Each recipient gets a message of their own; one whose access differs is skipped. Scheduling for oneself: " +
                (groups("INSIGHTS_SCHEDULE") || "no group") +
                ". Delivering to others: " +
                (groups("INSIGHTS_DISTRIBUTE") || "no group") +
                "."
        },
        {
            control: "Group recipients",
            value: "At most " + cap + " for a schedule or an alert rule",
            note:
                "The instance allows up to " +
                ceiling +
                ". The cap in effect when a schedule or rule is saved is kept with it until it is saved again.",
            url: lib.access.has("ADMIN_SETTINGS_VIEW") ? link("Admin/Settings/InstanceSettings") : null
        },
        {
            control: "Report mail",
            value: sending(),
            note: "Outgoing mail and the report template are the instance's, set up in Admin.",
            url: link("Admin/Operations/Health")
        },
        {
            control: "Exports",
            value: "At most 10,000 rows for a dataset export; every export is audited",
            note: "The limit is the instance's, not an organization's choice."
        },
        {
            control: "Reports kept",
            value: "None: a delivered report is rendered when it is sent and when its recipient opens it",
            note: "Delivery outcomes are kept as the instance's retention sets."
        },
        {
            control: "Freshness",
            value: "A source is stale " + frequencyText(policy.maxLagMinutes) + " after its last rebuild",
            note: "Data readiness shows each source's lag.",
            url: "/qapps/Insights/Settings/DataReadiness"
        }
    ].map(row => Object.assign({url: null}, row))
}
// SourceOwners (design §11): the sources Insights registered, each with its domain owner, class, state and steward, for one
// who reads the settings. It reads the registrations and each dataset's admission, never a row of data.
function sourceOwners() {
    const classNames = Object.fromEntries(enumOptions(classType).map(row => [row.value, row.label]))
    const classes = Object.fromEntries(rows("ironstone.insights.DatasetClass", {}).map(row => [row.datasetId, row]))
    const stewards = new Map()
    const stewardName = userId => {
        if (!userId) return ""
        if (!stewards.has(userId)) {
            const account = one("moqui.security.UserAccount", {userId})
            stewards.set(userId, account?.userFullName || account?.username || "")
        }
        return stewards.get(userId)
    }
    return rows("ironstone.admin.ReadinessProvider", {ownerApp: "Insights"})
        .filter(row => row.disabled !== "Y" && String(row.providerKey).startsWith(providerPrefix))
        .map(row => {
            const datasetId = String(row.providerKey).slice(providerPrefix.length)
            const admission = one("moqui.report.BusinessDataset", {datasetId})
            const registered = classes[datasetId]
            const state = !admission
                ? "Not set up"
                : admission.retiredDate != null
                  ? "Retired"
                  : admission.admittedDate != null
                    ? "Admitted"
                    : "Needs review"
            return {
                datasetId,
                source: String(row.title || datasetId).replace(/ index$/, ""),
                domainOwner: registered?.domainOwner || "",
                className:
                    registered && registered.disabled !== "Y" ? classNames[registered.classEnumId] || "" : "Not classified",
                state,
                stateColor: state === "Admitted" ? "positive" : state === "Needs review" ? "warning" : "grey-7",
                stewardName: stewardName(admission?.stewardUserId),
                readinessUrl: "/qapps/Insights/Settings/DataReadiness?source=" + encodeURIComponent(datasetId)
            }
        })
        .sort((a, b) => a.domainOwner.localeCompare(b.domainOwner) || a.source.localeCompare(b.source))
}
// get#Settings: the organization in scope (a requested one only when it is the user's), the controls in effect for every
// reader, and for a holder of INSIGHTS_SETTINGS_VIEW the organization's defaults with their revision, the choices and the
// source owners.
function getSettings(p) {
    const userScope = insights.required()
    if (!userScope.capabilities.view) denied("INSIGHTS_VIEW_REQUIRED", "Insights settings need Insights read")
    const context = insights.context({appRoot: "Insights", organizationPartyId: p.organizationPartyId || null})
    const organizationPartyId = context.organizationPartyId || null
    const canView = !!userScope.capabilities.settingsView
    const ceiling = insights.recipientCeiling()
    const found = insights.organizationSettings(organizationPartyId)
    const out = {
        organizationPartyId,
        organizationName: organizationPartyId ? insights.partyName(organizationPartyId) : "",
        organizations: context.organizations,
        canView,
        canEdit: canView && !!userScope.capabilities.settingsEdit && !!organizationPartyId,
        recipientCeiling: ceiling,
        controls: organizationPartyId ? controls(organizationPartyId, found.values, ceiling) : [],
        settings: null,
        revision: null,
        options: null,
        sources: []
    }
    if (!canView) return out
    out.sources = sourceOwners()
    if (!organizationPartyId) return out
    out.settings = Object.assign({}, found.values, {
        groupRecipientCap: Math.min(Number(found.values.groupRecipientCap) || 50, ceiling)
    })
    out.revision = revisionOf(organizationPartyId)
    out.options = choices(organizationPartyId)
    // a stored choice the saver no longer reads stays shown as its id, so saving the form does not silently drop it
    for (const [name, list] of [
        ["defaultDashboardId", out.options.dashboards],
        ["defaultMapId", out.options.maps],
        ["defaultDigestDefinitionId", out.options.digests]
    ]) {
        const value = out.settings[name]
        if (value && !list.some(row => row.value === value)) list.push({value, label: value + " (not available to you)"})
    }
    return out
}

// ===== store#Settings =====
// Each value as it will be read: a definition of its kind among the saver's choices (or the one already stored), a zone the
// server knows, a value of its enumeration, a whole cap from 1 to the instance ceiling. An empty choice is empty.
function checked(p, organizationPartyId, current, ceiling) {
    const options = choices(organizationPartyId)
    const values = {}
    const among = (name, list, what) => {
        const value = text(p[name])
        if (value && value !== current[name] && !list.some(row => row.value === value))
            denied("VALUE_INVALID", "Choose " + what + " you may read")
        values[name] = value || null
    }
    among("defaultDashboardId", options.dashboards, "a dashboard")
    among("defaultMapId", options.maps, "a suite flow map or one of this organization's")
    among("defaultDigestDefinitionId", options.digests, "a digest")
    const listed = (name, list, what) => {
        const value = text(p[name])
        if (value && !list.some(row => row.value === value)) denied("VALUE_INVALID", "Choose " + what)
        values[name] = value || null
    }
    listed("displayTimeZone", options.timeZones, "a time zone from the list")
    listed("weekStart", options.weekStarts, "the day weeks start on")
    listed("freshnessPolicyId", options.freshnessPolicies, "a freshness policy")
    if (blank(p.groupRecipientCap)) values.groupRecipientCap = null
    else {
        const cap = Number(text(p.groupRecipientCap))
        if (!Number.isInteger(cap) || cap < 1) denied("VALUE_INVALID", "The recipient cap is a whole number of 1 or more")
        if (cap > ceiling)
            denied(
                "RECIPIENT_CAP_CEILING",
                "The recipient cap can be at most " + ceiling + ", the instance's ceiling, which is set in Admin"
            )
        values.groupRecipientCap = String(cap)
    }
    return values
}
// store#Settings: the organization's analytics defaults, by a holder of INSIGHTS_SETTINGS_EDIT, for an organization in
// their scope (ORGANIZATION_UNAVAILABLE otherwise, forged or not), at the revision read (SETTINGS_CHANGED). Only a value
// that differs is written (Mantle's store#PartySetting, which validates a typed one); an emptied one removes the
// organization's own, so its type's default applies again.
function storeSettings(p) {
    const userScope = insights.required()
    return attempt(() => {
        if (!userScope.capabilities.settingsEdit)
            denied("INSIGHTS_SETTINGS_REQUIRED", "Changing Insights settings needs INSIGHTS_SETTINGS_EDIT")
        const organizationPartyId = text(p.organizationPartyId)
        if (!organizationPartyId) denied("ORGANIZATION_REQUIRED", "Choose the organization these settings are for")
        insights.context({appRoot: "Insights", organizationPartyId})
        const revision = revisionOf(organizationPartyId)
        if (blank(p.expectedRevision) || text(p.expectedRevision) !== revision)
            denied("SETTINGS_CHANGED", "These settings changed since you read them; reload and try again")
        const ceiling = insights.recipientCeiling()
        const current = insights.organizationSettings(organizationPartyId)
        const values = checked(p, organizationPartyId, current.values, ceiling)
        let changed = 0
        for (const name of names) {
            const partySettingTypeId = insights.settingTypes[name]
            // an untouched value that is only the type's default is not copied onto the organization
            if (values[name] === current.values[name]) continue
            if (values[name] == null) {
                // emptied: the organization's own value goes; a type's default cannot be emptied here
                if (current.sources[name] !== "organization") continue
                find("mantle.party.PartySetting", {partyId: organizationPartyId, partySettingTypeId}).deleteAll()
            } else
                lib.call("mantle.party.PartyServices.store#PartySetting", {
                    partyId: organizationPartyId,
                    partySettingTypeId,
                    settingValue: values[name]
                })
            changed++
        }
        return {
            organizationPartyId,
            changedCount: changed,
            revision: revisionOf(organizationPartyId),
            settings: insights.organizationSettings(organizationPartyId).values
        }
    }, "The settings could not be saved")
}

// ===== find#SourceReadiness =====
const stateNames = {
    ready: "Ready",
    stale: "Stale",
    warning: "Needs review",
    failed: "Failed",
    unavailable: "Unavailable"
}
const stateColors = {ready: "positive", stale: "warning", warning: "warning", failed: "negative", unavailable: "grey-8"}
const stateOrder = ["failed", "unavailable", "stale", "warning", "ready"]
// find#SourceReadiness: the sources of Insights the viewer may read, from Admin's readiness registry (its freshness facet:
// watermark, expected frequency, lag, coverage), each with its domain owner and class and the freshness policy of the
// organization in scope applied (the strictest of the viewer's organizations when none is chosen): ready and older than the
// policy allows is stale, with its lag. Delayed (stale), waiting
// for review, failed and unknown (unavailable) stay apart; a provider that could not be checked is named. Filtered by
// domain owner, source and state.
function sourceReadiness(p) {
    const userScope = insights.required()
    if (!userScope.capabilities.view) denied("INSIGHTS_VIEW_REQUIRED", "Data readiness needs Insights read")
    const context = insights.context({appRoot: "Insights", organizationPartyId: p.organizationPartyId || null})
    // the policy of the organization in scope; with several in scope and none chosen, the strictest of theirs
    const scoped = context.organizationPartyId
        ? [context.organizationPartyId]
        : context.allOrganizations
          ? []
          : Array.from(context.organizationPartyIds || []).slice(0, 50)
    const policy = (scoped.length ? scoped : [null])
        .map(partyId => policyOf(insights.organizationSettings(partyId).values.freshnessPolicyId))
        .reduce((strictest, next) => (next.maxLagMinutes < strictest.maxLagMinutes ? next : strictest))
    // Admin's registry as the viewer: its own grant, each provider's permission and each owner's check decide what answers
    const found = insights.asViewerApart(READINESS, {ownerApp: "Insights"})
    const classNames = Object.fromEntries(enumOptions(classType).map(row => [row.value, row.label]))
    const classes = Object.fromEntries(rows("ironstone.insights.DatasetClass", {}).map(row => [row.datasetId, row]))
    const all = Array.from(found.checks || []).map(check => {
        const datasetId = String(check.providerKey || "").startsWith(providerPrefix)
            ? String(check.providerKey).slice(providerPrefix.length)
            : null
        const registered = datasetId ? classes[datasetId] : null
        const lag = check.lagMinutes == null ? null : Number(check.lagMinutes)
        const stale = check.state === "ready" && lag != null && lag > policy.maxLagMinutes
        const state = stale ? "stale" : Object.hasOwn(stateNames, check.state) ? check.state : "unavailable"
        return {
            providerKey: check.providerKey,
            datasetId,
            source: String(check.title || "").replace(/ index$/, ""),
            domainOwner: registered?.domainOwner || check.ownerApp || "",
            className: registered && registered.disabled !== "Y" ? classNames[registered.classEnumId] || "" : "",
            state,
            stateName: stateNames[state],
            stateColor: stateColors[state],
            message: stale
                ? "Last rebuilt " + check.lagText + " ago; " + frequencyText(policy.maxLagMinutes) + " is allowed"
                : check.message || "",
            watermarkText: check.watermarkText || "",
            lagText: check.lagText || "",
            lagMinutes: lag,
            expectedFrequencyText: check.expectedFrequencyText || "",
            coverage: check.coverage || "",
            checkedText: check.checkedText || "",
            // the registered refresh, only where Admin's registry says the viewer may run it
            refreshKey: check.refreshKey || null,
            refreshTitle: check.refreshTitle || null,
            // the steward's own screen for the source
            detailUrl:
                datasetId && userScope.capabilities.stewardship
                    ? "/qapps/Insights/ReportBuilder/DatasetDetail?datasetId=" + encodeURIComponent(datasetId)
                    : null
        }
    })
    const wanted = text(p.source).toLowerCase()
    const sources = all
        .filter(row => blank(p.domainOwner) || row.domainOwner === p.domainOwner)
        .filter(row => blank(p.state) || row.state === p.state)
        .filter(row => !wanted || row.source.toLowerCase().includes(wanted) || row.datasetId === text(p.source))
        .sort(
            (a, b) =>
                stateOrder.indexOf(a.state) - stateOrder.indexOf(b.state) ||
                a.domainOwner.localeCompare(b.domainOwner) ||
                a.source.localeCompare(b.source)
        )
    return {
        sources,
        failedProviders: Array.from(found.failedProviders || []),
        checkedText: found.checkedText || "",
        organizationPartyId: context.organizationPartyId || null,
        organizations: context.organizations,
        freshnessText: "A source is stale " + frequencyText(policy.maxLagMinutes) + " after its last rebuild",
        ownerOptions: Array.from(new Set(all.map(row => row.domainOwner).filter(Boolean))).sort(),
        stateOptions: stateOrder.map(state => ({value: state, label: stateNames[state]}))
    }
}

const operations = {getSettings, storeSettings, sourceReadiness}
;({
    execute: (op, parameters) => {
        if (!Object.hasOwn(operations, op)) throw new Error("Unknown Insights settings operation " + op)
        return operations[op](parameters)
    }
})
