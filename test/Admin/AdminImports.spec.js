// Imports in Admin (impl-admin P15; design-admin §11 Imports, DataImport and ImportDetail, §4 Invitations' bulk invite, §15.3
// "Import preview/retry" and "Delegated administration"): the catalog target through Shared/DataImport under Admin gives what
// Products' mount gives, by the catalog's own permissions (the data operator, who holds none of them, stages nothing there;
// a catalog editor without Admin opens no Admin import); a bulk invite with a password column is refused whole and its
// accepted rows are invite#User's, as the importer, with IronStone BOSS users always included and Admin's own groups never;
// the data operator alone and the identity operator alone import no invitation; Imports lists a run kept here and an owner's
// run with the owner's place and nothing of its rows (the Data area's two groups are AdminAccess's rows, and a user outside
// them posts nothing to its wizard here). One qvt render each of Imports and ImportDetail; Shared/DataImport's renders are Products' ProductsImport spec's. The framework's rules are the framework's
// AdminDataTransfer spec, the invitation rows' Mantle's StaffInvitationImport, the catalog's own Products' ProductsImport.
// Run: ./moq test mr-boss --spec AdminImports
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {ids, users, asUser, system, page} = lib
const T = "org.moqui.admin.DataTransferServices."
const INVITATION = "mantle.party.UserInvitation"
const run = String(Date.now()).slice(-7)
const email = key => "adm.import." + key + "." + run + "@example.com"
const has = (value, pattern) => pattern.test(String(value ?? ""))
const find = (entityName, conditions) => ec.entity.find(entityName).condition(conditions).disableAuthz()
const rows = (entityName, conditions) => system(() => Array.from(find(entityName, conditions).list()).map(row => row.getMap()))
const post = (user, path, parameters) => asUser(user, () => page(path, parameters, "html"))
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
function invoke(name, parameters = {}) {
    try {
        const result = ec.service.sync().name(name).parameters(parameters).call() || {}
        const error = ec.message.hasError() ? ec.message.getErrorsString() : ""
        ec.message.clearErrors()
        return Object.assign({}, result, {error})
    } catch (e) {
        ec.message.clearErrors()
        return {error: String(e.message || e)}
    }
}
// Imports' list as its screen reads it: the screens' grant covers the services below it, each of which checks the user's own
// permission and scope (the spec calls the screen's service with authorization off for the same reach)
const listAs = (username, parameters = {}) =>
    asUser(
        username,
        () => invoke("ironstone.shared.DataImportServices.find#ImportRuns", Object.assign({appRoot: "Admin"}, parameters)),
        false
    )
const batches = (targetId, userId) => rows("moqui.server.TransferBatch", {targetId, userId})
// a user of both the data operator's and the identity operator's groups, and one who is also a catalog editor
const importer = {userId: "SPEC_ADM_IMPORTER", username: "spec.adm.importer"}
const cataloger = {userId: "SPEC_ADM_CATALOGER", username: "spec.adm.cataloger"}

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        system(() => {
            const make = (entityName, fields) => {
                const value = ec.entity.makeValue(entityName)
                value.setFields(fields, true, null, null)
                value.create()
            }
            const person = (user, lastName, organizationId, groups) => {
                make("mantle.party.Party", {partyId: user.userId, partyTypeEnumId: "PtyPerson"})
                make("mantle.party.Person", {partyId: user.userId, firstName: "Spec", lastName})
                make("mantle.party.PartyRelationship", {
                    partyRelationshipId: user.userId + "_ORG",
                    relationshipTypeEnumId: "PrtAgent",
                    fromPartyId: user.userId,
                    toPartyId: organizationId,
                    toRoleTypeId: "OrgInternal",
                    fromDate: 0
                })
                // the demo users' own password, so the spec signs in as it does for them
                const demo = find("moqui.security.UserAccount", {userId: "BOSS_ADM_DATA"}).one()
                make("moqui.security.UserAccount", {
                    userId: user.userId,
                    username: user.username,
                    userFullName: "Spec " + lastName,
                    partyId: user.userId,
                    currentPassword: demo.currentPassword,
                    passwordHashType: demo.passwordHashType,
                    passwordSalt: demo.passwordSalt,
                    passwordBase64: demo.passwordBase64,
                    passwordSetDate: demo.passwordSetDate
                })
                for (const userGroupId of groups)
                    make("moqui.security.UserGroupMember", {userGroupId, userId: user.userId, fromDate: 0})
            }
            person(importer, "Importer", ids.organizationId, [
                "BOSS_USERS",
                "BOSS_ADMIN",
                "BOSS_ADMIN_DATA",
                "BOSS_ADMIN_IDENTITY"
            ])
            const editorGroups = Array.from(find("moqui.security.UserGroupMember", {userId: "BOSS_PRD_CATALOG_EDIT"}).list()).map(
                row => row.userGroupId
            )
            person(
                cataloger,
                "Cataloger",
                ids.otherOrganizationId,
                Array.from(new Set(["BOSS_USERS", "BOSS_ADMIN", "BOSS_ADMIN_DATA"].concat(editorGroups)))
            )
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
    }
})

feature("the catalog target through Admin's DataImport gives what Products' mount gives, by the catalog's own permissions", {
    when() {
        const out = {}
        const csv = code => "productId,productName\n" + code + ",Admin import product\n" + code + "_BAD,\n"
        // stage and apply through the mount's own transitions; the validation between them is the same service either way
        const walk = (root, username, code) =>
            asUser(username, () => {
                const render = (path, parameters) => {
                    const result = ec.screen
                        .makeTest()
                        .rootScreen("component://mr-boss/screen/" + root + ".xml")
                        .renderMode("html")
                        .render(path, parameters, null)
                    ec.message.clearErrors()
                    return result
                }
                const base = root === "Admin" ? "Data/DataImport/" : "ProductImport/Index/"
                render(base + "stage", {
                    targetId: "catalog",
                    organizationPartyId: ids.otherOrganizationId,
                    kindId: "products",
                    sourceText: csv(code),
                    delimiter: ",",
                    updateMode: "upsert"
                })
                const key = system(
                    () =>
                        Array.from(
                            find("mantle.product.ProductCatalogOperation", {
                                operationType: "import",
                                submittedByUserId: ec.user.userId
                            })
                                .orderBy("-submittedDate")
                                .list()
                        )[0]?.operationKey
                )
                const staged = invoke(T + "get#Transfer", {targetId: "catalog", operationKey: key})
                const validated = invoke(T + "validate#Import", {
                    targetId: "catalog",
                    operationKey: key,
                    mappingRevision: staged.mappingRevision
                })
                render(base + "apply", {targetId: "catalog", operationKey: key, inputFingerprint: validated.inputFingerprint})
                const applied = invoke(T + "get#Transfer", {targetId: "catalog", operationKey: key})
                return {
                    key,
                    validated,
                    applied,
                    report:
                        root === "Admin"
                            ? render(base + "results", {targetId: "catalog", operationKey: key, errorsOnly: "true"})
                            : null
                }
            })
        out.admin = walk("Admin", cataloger.username, "ADM_IMPORT_VIA_ADMIN_" + run)
        out.products = walk("Products", "catalog.edit", "ADM_IMPORT_VIA_PRODUCTS_" + run)
        // the Products mount is the catalog whatever the request names
        out.forced = asUser("catalog.edit", () => {
            const result = ec.screen
                .makeTest()
                .rootScreen("component://mr-boss/screen/Products.xml")
                .renderMode("html")
                .render(
                    "ProductImport/Index/stage",
                    {
                        targetId: "staffInvitations",
                        organizationPartyId: ids.organizationId,
                        sourceText: "Email,Access bundles\n" + email("forced") + ",BOSS_USERS\n"
                    },
                    null
                )
            ec.message.clearErrors()
            return result
        })
        // the data operator holds the transfer permissions and no catalog permission; the editor has no Admin
        out.operator = asUser(users.data, () =>
            invoke(T + "stage#Import", {
                targetId: "catalog",
                organizationPartyId: ids.organizationId,
                kindId: "products",
                sourceText: "productId,productName\nADM_IMPORT_DENIED_" + run + ",Denied\n"
            })
        )
        out.operatorContext = asUser(
            users.data,
            () => invoke("ironstone.shared.DataImportServices.get#ImportContext", {appRoot: "Admin", targetId: "catalog"}),
            false
        )
        out.outsider = post("catalog.edit", "Data/DataImport/stage", {
            targetId: "catalog",
            organizationPartyId: ids.otherOrganizationId,
            kindId: "products",
            sourceText: "productId,productName\nADM_IMPORT_OUTSIDE_" + run + ",Outside\n"
        })
        out.products.made = rows("mantle.product.Product", {productId: "ADM_IMPORT_VIA_PRODUCTS_" + run}).length
        out.admin.made = rows("mantle.product.Product", {productId: "ADM_IMPORT_VIA_ADMIN_" + run}).length
        out.denied =
            rows("mantle.product.Product", {productId: "ADM_IMPORT_DENIED_" + run}).length +
            rows("mantle.product.Product", {productId: "ADM_IMPORT_OUTSIDE_" + run}).length
        // the catalog's runs in Imports: the importer's own, opening ImportDetail
        out.list = listAs(cataloger.username, {targetId: "catalog"})
        return out
    },
    then(out) {
        const same = side =>
            [
                side.validated.validCount,
                side.validated.errorCount,
                side.applied.appliedCount,
                side.applied.errorCount,
                side.applied.state,
                side.made
            ].join("|")
        !!out.admin.key && !!out.products.key
        same(out.admin) == "1|1|1|1|partial|1"
        same(out.admin) == same(out.products)
        String(out.admin.report.output).includes("ADM_IMPORT_VIA_ADMIN_" + run + "_BAD")
        !String(out.admin.report.output).includes("Admin import product")
        // nothing of the invitations target was staged from the Products mount
        batches("staffInvitations", "BOSS_PRD_CATALOG_EDIT").length == 0
        rows(INVITATION, {emailAddress: email("forced")}).length == 0
        out.denied == 0
        out.operator.error.length > 0
        out.outsider.status != 200 || out.outsider.errors.length > 0
        out.operatorContext.hasTarget == true
        out.operatorContext.canStage == false
        out.operatorContext.ownerOptions.length == 0
        const listed = Array.from(out.list.transferList || []).find(found => found.runId === out.admin.key)
        listed.detail == true
        listed.ownerApp == "Products"
        listed.appliedCount == 1
    }
})

feature("a bulk invite with a password column is refused, and its accepted rows are invite#User's as the importer", {
    when() {
        const out = {}
        const good = [
            "Email,Name,Access bundles",
            email("one") + ",Olga One,BOSS_PURCHASING",
            email("two") + ",Tom Two,",
            email("priv") + ",Pia Privileged,BOSS_ADMIN_ACCESS",
            email("adm") + ",Ada Admin,ADMIN"
        ].join("\n")
        const refusedStage = (user, sourceText, organizationPartyId = ids.organizationId) =>
            asUser(user, () => invoke(T + "stage#Import", {targetId: "staffInvitations", organizationPartyId, sourceText}))
        out.password = refusedStage(
            importer.username,
            "Email,Name,Access bundles,Password\n" + email("pw") + ",Pat Password,BOSS_PURCHASING,hunter2\n"
        )
        // the data operator alone and the identity operator alone import no invitation; nor does another organization's scope
        out.dataOnly = refusedStage(users.data, good)
        out.identityOnly = refusedStage(users.identity, good)
        out.otherOrganization = refusedStage(importer.username, good, ids.otherOrganizationId)
        out.refusedBatches =
            batches("staffInvitations", importer.userId).length +
            batches("staffInvitations", "BOSS_ADM_DATA").length +
            batches("staffInvitations", "BOSS_ADM_IDENTITY").length
        // the import itself through the wizard's transitions under Admin
        out.staged = post(importer.username, "Data/DataImport/stage", {
            targetId: "staffInvitations",
            organizationPartyId: ids.organizationId,
            sourceText: good
        })
        const key = batches("staffInvitations", importer.userId)[0]?.transferId
        const get = () =>
            asUser(importer.username, () => invoke(T + "get#Transfer", {targetId: "staffInvitations", operationKey: key}))
        post(importer.username, "Data/DataImport/mapping", {
            targetId: "staffInvitations",
            operationKey: key,
            mappingRevision: get().mappingRevision,
            mappingAction: "option",
            optionName: "expireDays",
            optionValue: "14"
        })
        out.validated = asUser(importer.username, () =>
            invoke(T + "validate#Import", {
                targetId: "staffInvitations",
                operationKey: key,
                mappingRevision: get().mappingRevision
            })
        )
        // what the wizard shows under Admin for a batch kept by the framework (Shared/DataImport's renders are Products' spec's),
        // read by the instance administrator: a batch is read within its scope, which for the importer is the organization
        // filters of the area's grant (none with authorization off, so the importer's own read is ImportDetail's below)
        out.wizard = asUser(
            users.system,
            () =>
                invoke("ironstone.shared.DataImportServices.get#ImportContext", {
                    appRoot: "Admin",
                    targetId: "staffInvitations",
                    operationKey: key
                }),
            false
        )
        post(importer.username, "Data/DataImport/apply", {
            targetId: "staffInvitations",
            operationKey: key,
            inputFingerprint: out.validated.inputFingerprint
        })
        out.applied = get()
        out.detail = asUser(importer.username, () => page("Data/ImportDetail", {targetId: "staffInvitations", operationKey: key}))
        out.retry = asUser(importer.username, () =>
            invoke(T + "retry#ImportItems", {targetId: "staffInvitations", operationKey: key, itemSeqIdList: [1]})
        )
        out.key = key
        // who reads it: the data operator of the same organization lacks the identity permission its target asks of a reader
        out.dataRead = asUser(users.data, () => invoke(T + "get#Transfer", {targetId: "staffInvitations", operationKey: key}))
        out.one = rows(INVITATION, {emailAddress: email("one")})
        out.two = rows(INVITATION, {emailAddress: email("two")})
        return out
    },
    then(out) {
        const text = rendered => String(rendered.output)
        // refused whole: nothing staged, no invitation
        out.password.reasonCode == "COLUMN_REFUSED"
        has(out.dataOnly.error, /ADMIN_IDENTITY_MANAGE is required/)
        has(out.identityOnly.error, /ADMIN_TRANSFER_RUN is required/)
        has(out.otherOrganization.error, /you may import into/)
        out.refusedBatches == 0
        rows(INVITATION, {emailAddress: email("pw")}).length == 0
        !!out.key
        out.validated.batchOptions.expireDays == "14"
        out.validated.validCount == 2
        const row = itemSeqId => Array.from(out.applied.importRows).find(found => Number(found.itemSeqId) === itemSeqId)
        // a privileged group and ADMIN are never in an invitation, by a file as by the form
        row(3).result == "invalid"
        has(row(3).errorMessage, /privileged group/)
        row(4).result == "invalid"
        has(row(4).errorMessage, /privileged group/)
        out.applied.appliedCount == 2
        out.applied.state == "partial"
        // the invitations are the importer's, in the batch's organization, with IronStone BOSS users always
        out.one.length == 1
        out.one[0].inviterUserId == importer.userId
        out.one[0].organizationPartyId == ids.organizationId
        out.one[0].bundleGroupIds == "BOSS_USERS,BOSS_PURCHASING"
        out.two.length == 1
        out.two[0].bundleGroupIds == "BOSS_USERS"
        rows(INVITATION, {emailAddress: email("priv")}).length == 0
        // an applied row named for a retry is not invited again
        out.retry.resultList[0].reasonCode == "NOT_FAILED"
        rows(INVITATION, {emailAddress: email("one")}).length == 1
        // the wizard under Admin: the target's own words, fields and options, the valid and invalid rows, no service name
        out.wizard.importTarget.title == "Staff invitations"
        out.wizard.importTarget.fieldLabel == "Invitation field"
        out.wizard.features.formats == false
        Array.from(out.wizard.optionRows)
            .map(option => option.optionLabel + "=" + option.optionValue)
            .includes("Link expires after (days)=14")
        Array.from(out.wizard.targetOptions)
            .map(option => option.value)
            .join(",") == "emailAddress,partyId,displayName,organizationPartyId,bundleGroupIds"
        Array.from(out.wizard.previewRows).some(found => /privileged group/.test(found.errorMessage))
        // (an organization's name may hold the word: a service's name is the word and a dot)
        !JSON.stringify(out.wizard).includes("Services.")
        opened(out.detail)
        out.detail.output.includes("Partly applied")
        out.detail.output.includes(out.one[0].invitationId)
        out.detail.output.includes("Error CSV")
        // a file's rows are read by its importer and those the target admits: the data operator lacks the identity permission
        has(out.dataRead.error, /not available/)
    }
})

feature("Imports lists every target's runs with the owner's place and no row, as far as the reader may read them there", {
    when() {
        const out = {}
        system(() => {
            const method = Array.from(
                find("mantle.account.method.PaymentMethod", {ownerPartyId: ids.accountingOrganizationId}).limit(1).list()
            )[0]
            const statement = ec.entity.makeValue("mantle.account.method.StatementImport")
            statement.setFields(
                {
                    statementImportId: "SPEC_ADM_STATEMENT_" + run,
                    paymentMethodId: method?.paymentMethodId || null,
                    organizationPartyId: ids.accountingOrganizationId,
                    formatEnumId: "SifCsv",
                    statusId: "SimCommitted",
                    fileName: "spec-admin-statement.csv",
                    totalCount: 4,
                    committedCount: 3,
                    rejectedCount: 1,
                    duplicateCount: 0,
                    rowsJson: '[{"description":"SPEC PRIVATE BANK LINE"}]',
                    createdByUserId: "EX_JOHN_DOE",
                    createdDate: Date.now() - 60000
                },
                true,
                null,
                null
            )
            statement.create()
        })
        // an instance administrator reads Accounting's imports; the data operator, who may not read a bank, is shown none
        out.system = asUser(users.system, () => page("Data/Imports", {}))
        out.systemList = listAs(users.system)
        out.dataList = listAs(users.data)
        out.wizardTarget = asUser(
            users.data,
            () =>
                invoke("ironstone.shared.DataImportServices.get#ImportContext", {appRoot: "Admin", targetId: "statementImports"}),
            false
        )
        // without ADMIN_TRANSFER_VIEW nothing is listed, whoever asks and from wherever
        out.identity = listAs(users.identity)
        return out
    },
    then(out) {
        opened(out.system)
        const statement = Array.from(out.systemList.transferList).find(found => found.runId === "SPEC_ADM_STATEMENT_" + run)
        statement.targetId == "statementImports"
        statement.ownerApp == "Accounting"
        statement.detail == false
        statement.appliedCount == 3
        statement.errorCount == 1
        statement.ownerUrl.startsWith("/qapps/Accounting/Banking/StatementImport?")
        statement.ownerUrl.includes("statementImportId=SPEC_ADM_STATEMENT_" + run)
        out.system.output.includes("spec-admin-statement.csv")
        out.system.output.includes("Open in Accounting")
        !JSON.stringify(out.systemList).includes("SPEC PRIVATE BANK LINE")
        !out.system.output.includes("SPEC PRIVATE BANK LINE")
        // the targets: the shared wizard's and the owners' own, the two that keep no runs saying so
        const targets = Object.fromEntries(Array.from(out.systemList.targetList).map(target => [target.targetId, target]))
        ;[
            "catalog",
            "staffInvitations",
            "channelOrders",
            "statementImports",
            "openingOpenItems",
            "commonsContacts",
            "projectsWorkItems",
            "messageTranslations"
        ].every(id => !!targets[id])
        targets.commonsContacts.runsKept == false
        targets.projectsWorkItems.runsKept == false
        targets.statementImports.wizardHere == false
        targets.commonsContacts.ownerUrl == "/qapps/Commons/Contacts/Import"
        out.system.output.includes("Keeps no runs yet")
        !JSON.stringify(out.systemList.targetList).includes("Services.")
        // the data operator: the same list, without what Accounting does not show them
        Array.isArray(Array.from(out.dataList.transferList))
        !Array.from(out.dataList.transferList).some(found => found.targetId === "statementImports")
        !JSON.stringify(out.dataList).includes("spec-admin-statement.csv")
        // an owner's wizard is not run from the shared one
        out.wizardTarget.wizardElsewhere == true
        out.wizardTarget.hasTarget == false
        out.wizardTarget.ownerUrl == "/qapps/Accounting/Banking/StatementImport"
        has(out.identity.error, /ADMIN_TRANSFER_VIEW is required/)
    }
})
