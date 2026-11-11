// Admin P15's "usable when" (impl-admin P15; design-admin §15.3 "Import preview/retry", "Independent failure" and
// "Delegated administration", their import half), as an acceptance walk with artifact authorization on and no mail server:
// a user of the data operator's and the identity operator's groups stages a CSV of five staff invitations for Ziziwork
// Retail in Admin › Data › Import, one a repeat of another row's address and one naming a bundle that is not registered;
// the preview names the two and the three others are sent as invitations of that user, each with IronStone BOSS users; the
// same apply posted again sends nothing more; Imports lists the run and ImportDetail shows its rows and its error file, in
// which a cell beginning with = is written as text. A catalog price import through Admin gives the result Products' mount
// gives. Accounting's statement imports appear in Imports for a finance reader of that organization with a link to
// Banking, and not for a data operator who may not read a bank; a file with a password column is refused at the upload.
// Every step goes through the screens' own transitions. The rules are the framework's AdminDataTransfer, Mantle's
// StaffInvitationImport and BOSS's AdminImports.
// Run: ./moq accept mr-boss --spec AdminImportsUsable
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {ids, users, asUser, system, page} = lib
const T = "org.moqui.admin.DataTransferServices."
const INVITATION = "mantle.party.UserInvitation"
const run = String(Date.now()).slice(-7)
const email = key => "usable.import." + key + "." + run + "@example.com"
const find = (entityName, conditions) => ec.entity.find(entityName).condition(conditions).disableAuthz()
const rows = (entityName, conditions) => system(() => Array.from(find(entityName, conditions).list()).map(row => row.getMap()))
const importer = {userId: "USABLE_IMPORTER_" + run, username: "usable.importer." + run}
const pricer = {userId: "USABLE_PRICER_" + run, username: "usable.pricer." + run}
const priceProductId = "USABLE_IMPORT_PRICE_" + run
// a screen under a root as its user, in html (a transition's redirect or a download) or qvt (a page)
function screen(root, username, path, parameters, mode = "html") {
    return asUser(username, () => {
        const renderer = ec.screen
            .makeTest()
            .rootScreen("component://mr-boss/screen/" + root + ".xml")
            .renderMode(mode)
        if (mode === "qvt") renderer.withStaticData()
        const result = renderer.render(path, Object.assign(mode === "qvt" ? {lastStandalone: "-2"} : {}, parameters), null)
        const errors = Array.from(result.errorMessages || [])
        ec.message.clearErrors()
        return {status: result.status, output: String(result.output || ""), errors}
    })
}
const transfer = (username, targetId, operationKey) =>
    asUser(username, () =>
        ec.service
            .sync()
            .name(T + "get#Transfer")
            .parameters({targetId, operationKey})
            .call()
    )
const batchOf = (targetId, userId) => rows("moqui.server.TransferBatch", {targetId, userId})[0]?.transferId

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
            const demo = find("moqui.security.UserAccount", {userId: "BOSS_ADM_DATA"}).one()
            const person = (user, lastName, organizationId, groups) => {
                make("mantle.party.Party", {partyId: user.userId, partyTypeEnumId: "PtyPerson"})
                make("mantle.party.Person", {partyId: user.userId, firstName: "Usable", lastName})
                make("mantle.party.PartyRelationship", {
                    partyRelationshipId: user.userId + "_ORG",
                    relationshipTypeEnumId: "PrtAgent",
                    fromPartyId: user.userId,
                    toPartyId: organizationId,
                    toRoleTypeId: "OrgInternal",
                    fromDate: 0
                })
                make("moqui.security.UserAccount", {
                    userId: user.userId,
                    username: user.username,
                    userFullName: "Usable " + lastName,
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
            // a data operator who is also a price editor of Ziziwork Services, as Products' catalog.price.edit is
            const priceGroups = Array.from(find("moqui.security.UserGroupMember", {userId: "BOSS_PRD_PRICE_EDIT"}).list()).map(
                row => row.userGroupId
            )
            person(
                pricer,
                "Pricer",
                ids.otherOrganizationId,
                Array.from(new Set(["BOSS_USERS", "BOSS_ADMIN", "BOSS_ADMIN_DATA"].concat(priceGroups)))
            )
            make("mantle.product.Product", {
                productId: priceProductId,
                productName: "Usable price import target",
                ownerPartyId: ids.otherOrganizationId,
                productTypeEnumId: "PtAsset",
                amountUomId: "OTH_ea"
            })
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "five staff invitations from a file: a repeated address and an unknown bundle are named, and the three others are sent once",
    {
        when() {
            const out = {}
            const file = [
                "Email,Name,Access bundles",
                email("ana") + ",Ana Usable,BOSS_PURCHASING",
                email("ben") + ",Ben Usable,BOSS_PURCHASING",
                email("ana") + ",Ana Again,BOSS_PURCHASING",
                email("cal") + ",=Cal Usable,",
                email("dee") + ",Dee Usable,USABLE_NOT_A_BUNDLE"
            ].join("\n")
            const base = "Data/DataImport"
            const target = {targetId: "staffInvitations"}
            out.landing = screen("Admin", importer.username, base, target, "qvt")
            out.password = screen(
                "Admin",
                importer.username,
                base + "/stage",
                Object.assign(
                    {
                        organizationPartyId: ids.organizationId,
                        sourceText: "Email,Access bundles,Password\n" + email("pw") + ",BOSS_PURCHASING,hunter2\n"
                    },
                    target
                )
            )
            out.refusedBatch = batchOf("staffInvitations", importer.userId)
            out.staged = screen(
                "Admin",
                importer.username,
                base + "/stage",
                Object.assign({organizationPartyId: ids.organizationId, sourceText: file}, target)
            )
            const operationKey = (out.operationKey = batchOf("staffInvitations", importer.userId))
            const current = () => transfer(importer.username, "staffInvitations", operationKey)
            screen(
                "Admin",
                importer.username,
                base + "/validate",
                Object.assign({operationKey, mappingRevision: current().mappingRevision}, target)
            )
            out.preview = screen("Admin", importer.username, base, Object.assign({operationKey}, target), "qvt")
            out.validated = current()
            out.sentByPreview = rows(INVITATION, {emailAddress: email("ana")}).length
            const apply = Object.assign({operationKey, inputFingerprint: out.validated.inputFingerprint}, target)
            screen("Admin", importer.username, base + "/apply", apply)
            out.applied = current()
            // the same apply posted again, and a retry of an applied row
            screen("Admin", importer.username, base + "/apply", apply)
            screen("Admin", importer.username, "Data/ImportDetail/retry", Object.assign({operationKey, retryRowIds: "1"}, target))
            out.again = current()
            out.imports = screen("Admin", importer.username, "Data/Imports", {}, "qvt")
            out.detail = screen("Admin", importer.username, "Data/ImportDetail", Object.assign({operationKey}, target), "qvt")
            out.errors = screen(
                "Admin",
                importer.username,
                base + "/results",
                Object.assign({operationKey, errorsOnly: "true"}, target)
            )
            out.all = screen("Admin", importer.username, base + "/results", Object.assign({operationKey}, target))
            // the Retail identity operator, who does not open the Data area, and the Retail data operator, who lacks the
            // identity permission, read nothing of the import
            out.identity = screen("Admin", users.identity, "Data/ImportDetail", Object.assign({operationKey}, target), "qvt")
            out.data = screen("Admin", users.data, "Data/ImportDetail", Object.assign({operationKey}, target), "qvt")
            return out
        },
        then(out) {
            out.landing.status == 200 && out.landing.errors.length == 0
            out.landing.output.includes("Staff invitations") && out.landing.output.includes("ImportUpload")
            // a password column: refused at the upload, nothing kept
            out.refusedBatch == null
            rows(INVITATION, {emailAddress: email("pw")}).length == 0
            !!out.operationKey
            // the preview: three ready, the repeat and the unknown bundle named, nothing sent
            out.validated.validCount == 3
            out.validated.errorCount == 2
            out.sentByPreview == 0
            out.preview.output.includes("3 ready")
            out.preview.output.includes("Repeats row 2")
            const byRow = Object.fromEntries(Array.from(out.applied.importRows).map(row => [Number(row.itemSeqId), row]))
            byRow[3].result == "invalid"
            byRow[5].result == "invalid" && !!byRow[5].errorMessage
            // three invitations, the importer's, for Ziziwork Retail, each with IronStone BOSS users
            out.applied.appliedCount == 3
            out.applied.state == "partial"
            const sent = ["ana", "ben", "cal"].map(key => rows(INVITATION, {emailAddress: email(key)}))
            sent.every(
                found =>
                    found.length === 1 &&
                    found[0].inviterUserId === importer.userId &&
                    found[0].organizationPartyId === ids.organizationId
            )
            sent[0][0].bundleGroupIds == "BOSS_USERS,BOSS_PURCHASING"
            sent[2][0].bundleGroupIds == "BOSS_USERS"
            rows(INVITATION, {emailAddress: email("dee")}).length == 0
            // nothing is sent twice
            out.again.appliedCount == 3
            ;["ana", "ben", "cal"].every(key => rows(INVITATION, {emailAddress: email(key)}).length === 1)
            // Imports and ImportDetail
            out.imports.status == 200 && out.imports.errors.length == 0
            out.imports.output.includes("Staff invitations") && out.imports.output.includes("Partly applied")
            out.detail.status == 200 && out.detail.errors.length == 0
            out.detail.output.includes(sent[0][0].invitationId)
            out.detail.output.includes("Repeats row 2")
            // the error file: the two rows, and no applied one; the results file writes a formula cell as text
            out.errors.output.includes(email("dee")) && out.errors.output.includes("Ana Again")
            !out.errors.output.includes("Ben Usable")
            out.all.output.includes('"\'=Cal Usable"')
            out.identity.status != 200 || out.identity.errors.length > 0
            out.data.output.includes("This import is not available to you")
            !out.data.output.includes(email("ana"))
        }
    }
)

feature("a catalog price import through Admin gives the result Products' mount gives", {
    when() {
        const out = {}
        const walk = (root, username, userId, price) => {
            const base = root === "Admin" ? "Data/DataImport" : "ProductImport/Index"
            const target = {targetId: "catalog"}
            const before = new Set(
                rows("mantle.product.ProductCatalogOperation", {operationType: "import", submittedByUserId: userId}).map(
                    row => row.operationKey
                )
            )
            const staged = screen(
                root,
                username,
                base + "/stage",
                Object.assign(
                    {
                        organizationPartyId: ids.otherOrganizationId,
                        kindId: "prices",
                        delimiter: ",",
                        updateMode: "upsert",
                        sourceText:
                            "productId,price,priceUomId,minQuantity\n" +
                            priceProductId +
                            "," +
                            price +
                            ",USD," +
                            (root === "Admin" ? 5 : 50) +
                            "\nUSABLE_NO_SUCH_PRODUCT," +
                            price +
                            ",USD,1\n"
                    },
                    target
                )
            )
            const operationKey = rows("mantle.product.ProductCatalogOperation", {
                operationType: "import",
                submittedByUserId: userId
            })
                .map(row => row.operationKey)
                .find(key => !before.has(key))
            const current = () => transfer(username, "catalog", operationKey)
            screen(
                root,
                username,
                base + "/validate",
                Object.assign({operationKey, mappingRevision: current().mappingRevision}, target)
            )
            const validated = current()
            screen(
                root,
                username,
                base + "/apply",
                Object.assign({operationKey, inputFingerprint: validated.inputFingerprint}, target)
            )
            const applied = current()
            return {
                staged,
                operationKey,
                validated,
                applied,
                pageOutput: screen(
                    root,
                    username,
                    root === "Admin" ? base : "ProductImport",
                    Object.assign({operationKey}, target),
                    "qvt"
                )
            }
        }
        out.admin = walk("Admin", pricer.username, pricer.userId, "17.50")
        out.products = walk("Products", "catalog.price.edit", "BOSS_PRD_PRICE_EDIT", "18.50")
        out.prices = rows("mantle.product.ProductPrice", {productId: priceProductId})
        // the Retail data operator, who holds no price permission, stages no price through Admin
        out.operator = screen("Admin", users.data, "Data/DataImport/stage", {
            targetId: "catalog",
            organizationPartyId: ids.organizationId,
            kindId: "prices",
            sourceText: "productId,price,priceUomId\n" + priceProductId + ",1,USD\n"
        })
        out.operatorImports = rows("mantle.product.ProductCatalogOperation", {
            operationType: "import",
            submittedByUserId: "BOSS_ADM_DATA"
        }).length
        return out
    },
    then(out) {
        const result = side =>
            [
                side.validated.validCount,
                side.validated.errorCount,
                side.applied.appliedCount,
                side.applied.errorCount,
                side.applied.state
            ].join("|")
        !!out.admin.operationKey && !!out.products.operationKey
        result(out.admin) == "1|1|1|1|partial"
        result(out.admin) == result(out.products)
        out.prices.some(price => toDecimal(price.price).eq("17.5") && toDecimal(price.minQuantity).eq("5"))
        out.prices.some(price => toDecimal(price.price).eq("18.5") && toDecimal(price.minQuantity).eq("50"))
        // one wizard, the catalog's own words in both mounts
        out.admin.pageOutput.status == 200 && out.admin.pageOutput.errors.length == 0
        out.products.pageOutput.status == 200 && out.products.pageOutput.errors.length == 0
        ;[out.admin.pageOutput, out.products.pageOutput].every(
            found => found.output.includes("Product import") && found.output.includes("1 applied")
        )
        out.operatorImports == 0
    }
})

feature("Accounting's statement imports appear in Imports with a link to their owner, as far as the reader may read them there", {
    when() {
        const out = {}
        const statementImportId = "USABLE_STATEMENT_" + run
        system(() => {
            const method = Array.from(
                find("mantle.account.method.PaymentMethod", {ownerPartyId: ids.accountingOrganizationId}).limit(1).list()
            )[0]
            const statement = ec.entity.makeValue("mantle.account.method.StatementImport")
            statement.setFields(
                {
                    statementImportId,
                    paymentMethodId: method?.paymentMethodId || null,
                    organizationPartyId: ids.accountingOrganizationId,
                    formatEnumId: "SifCsv",
                    statusId: "SimCommitted",
                    fileName: "usable-statement-" + run + ".csv",
                    totalCount: 3,
                    committedCount: 2,
                    rejectedCount: 1,
                    duplicateCount: 0,
                    rowsJson: '[{"description":"USABLE PRIVATE BANK LINE"}]',
                    createdByUserId: "EX_JOHN_DOE",
                    createdDate: Date.now() - 60000
                },
                true,
                null,
                null
            )
            statement.create()
        })
        out.statementImportId = statementImportId
        // an instance administrator (who reads Accounting) and the Retail data operator (who may not read a bank)
        out.system = screen("Admin", users.system, "Data/Imports", {targetId: "statementImports"}, "qvt")
        out.data = screen("Admin", users.data, "Data/Imports", {}, "qvt")
        // the link is the owner's own place, which the owner opens by its own rules
        out.owner = screen(
            "Accounting",
            users.system,
            "Banking/StatementImport",
            {statementImportId, organizationPartyId: ids.accountingOrganizationId},
            "qvt"
        )
        out.detail = screen(
            "Admin",
            users.system,
            "Data/ImportDetail",
            {targetId: "statementImports", operationKey: statementImportId},
            "qvt"
        )
        return out
    },
    then(out) {
        out.system.status == 200 && out.system.errors.length == 0
        out.system.output.includes("usable-statement-" + run + ".csv")
        out.system.output.includes("Open in Accounting")
        out.system.output.includes("/qapps/Accounting/Banking/StatementImport?")
        out.system.output.includes("statementImportId=" + out.statementImportId)
        !out.system.output.includes("USABLE PRIVATE BANK LINE")
        // the targets that keep no runs yet are listed with their place
        out.data.status == 200 && out.data.errors.length == 0
        out.data.output.includes("Keeps no runs yet")
        out.data.output.includes("/qapps/Commons/Contacts/Import")
        out.data.output.includes("/qapps/Projects/WorkItems/Import")
        !out.data.output.includes("usable-statement-" + run + ".csv")
        out.owner.status == 200
        // an owner's run has no detail in Admin
        out.detail.output.includes("This import is not available to you")
    }
})
