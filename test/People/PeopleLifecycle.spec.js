// People's lifecycle reaching Admin and the employee import (impl-people P7; design-people §4 provisioning, §12 EmployeeImport;
// design-admin §4.1 Provisioning from People, §11): a hire with an account asked requests its provisioning after commit through the
// mr-boss tx-commit rule (ironstone.admin.LifecycleServices.request#Provisioning), one operation per key with the grant proposal
// BOSS_USERS and BOSS_PEOPLE_SELF, waiting for an identity operator, its IT checklist task carrying the operation; a failed request
// is noted on the hire, which stands, and asked again by its key from Employee360; the employees import refuses a password column
// and an HR editor without PEOPLE_IMPORT, and hires each valid row, naming the repeated one. The rules are Mantle's
// (UserProvisioning, WorkProcess, PeopleChecklists); the scenario is the acceptance PeopleLifecycleUsable.
// Run: ./moq test mr-boss --spec PeopleLifecycle
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page} = lib
const P = "mantle.humanres.PeopleServices."
const T = "org.moqui.admin.DataTransferServices."
const run = String(Date.now()).slice(-7)
const noImport = "PEOPLE_SPEC_NOIMPORT"
const rows = (entity, conditions) => system(() => Array.from(ec.entity.find(entity).condition(conditions).list()))
const one = (entity, conditions) => rows(entity, conditions)[0] || null
function waitFor(read, millis = 5000) {
    const end = Date.now() + millis
    let value = read()
    while (!value && Date.now() < end) value = read()
    return value
}
// as the HR officer through Mantle's own checks (the wizard's screen grant is PeopleHire's and the walk's)
const hire = (firstName, extra = {}) =>
    asUser(users.hr, () =>
        system(() =>
            invoke(
                P + "hire#Employee",
                Object.assign(
                    {
                        organizationPartyId: ids.organizationId,
                        firstName,
                        lastName: "Lifecycle" + run,
                        workEmail: firstName.toLowerCase() + "." + run + "@lifecycle.example",
                        confirmNewPerson: true,
                        departmentPartyId: ids.departmentId,
                        managerPartyId: ids.managerPartyId,
                        operationKey: "PPL-LIFE-" + firstName + "-" + run
                    },
                    extra
                )
            )
        )
    )
const changeOf = employmentChangeId => one("mantle.humanres.employment.EmploymentChange", {employmentChangeId})

spec({
    setupSpec() {
        login("john.doe")
        ec.artifactExecution.enableAuthz()
        // an HR editor of Retail without the import permission
        system(() => {
            call("create#moqui.security.UserGroup", {userGroupId: noImport, description: "People spec: HR without import"})
            for (const userPermissionId of ["PEOPLE_HR_VIEW", "PEOPLE_HR_EDIT"])
                call("create#moqui.security.UserGroupPermission", {userGroupId: noImport, userPermissionId, fromDate: 0})
            call("create#mantle.party.Party", {partyId: noImport, partyTypeEnumId: "PtyPerson"})
            call("create#mantle.party.Person", {partyId: noImport, firstName: "People spec", lastName: "No import"})
            call("create#mantle.party.PartyRelationship", {
                relationshipTypeEnumId: "PrtAgent",
                fromPartyId: noImport,
                toPartyId: ids.organizationId,
                toRoleTypeId: "OrgInternal",
                fromDate: 0
            })
            call("create#moqui.security.UserAccount", {
                userId: noImport,
                username: "people.spec.noimport",
                partyId: noImport,
                currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
                passwordHashType: "SHA"
            })
            for (const userGroupId of ["BOSS_USERS", "BOSS_PEOPLE", noImport])
                call("create#moqui.security.UserGroupMember", {userId: noImport, userGroupId, fromDate: 0})
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        system(() =>
            ec.entity
                .find("moqui.security.UserGroupMember")
                .condition("userId", noImport)
                .updateAll({thruDate: ec.user.nowTimestamp})
        )
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "a hire with an account asked requests its provisioning after commit: one operation of the employer with BOSS's proposal, waiting for an identity operator, its IT task carrying it; a failed request is noted on the hire, which stands, and asked again from Employee360",
    {
        when() {
            const out = {}
            const hired = hire("Ada", {requestAccount: true})
            out.hired = [hired.error || "", hired.accessRequested]
            const change = waitFor(() =>
                changeOf(hired.employmentChangeId)?.accessOperationId ? changeOf(hired.employmentChangeId) : null
            )
            const operation = change ? one("mantle.party.UserLifecycleOperation", {operationId: change.accessOperationId}) : null
            out.operation = operation ? [operation.kindEnumId, operation.organizationPartyId, operation.statusId] : []
            const steps = operation ? rows("mantle.party.UserLifecycleOperationStep", {operationId: operation.operationId}) : []
            out.proposal = steps.find(step => step.stepKind === "grants")?.resourceId || ""
            out.invite = [
                steps.find(step => step.stepKind === "invite")?.statusId,
                steps.find(step => step.stepKind === "invite")?.reasonCode
            ].join("|")
            // the onboarding checklist's IT task shows Admin's operation
            const checklist = waitFor(() =>
                rows("mantle.humanres.checklist.EmploymentChecklist", {employmentChangeId: hired.employmentChangeId}).find(
                    row => row.templateWorkEffortId === ids.onboardingId
                )
            )
            const tasks = checklist
                ? rows("mantle.work.effort.WorkEffort", {rootWorkEffortId: checklist.workEffortId}).map(row => row.workEffortId)
                : []
            const itTask = waitFor(() =>
                tasks
                    .map(workEffortId => one("mantle.humanres.checklist.ChecklistStep", {workEffortId}))
                    .find(step => step?.sourceLinkEnumId === "ClsItAccess" && step.operationId)
            )
            out.itTask = itTask?.operationId === change?.accessOperationId
            // a hire with no account asked requests nothing
            const plain = hire("Bo")
            out.plain =
                waitFor(
                    () =>
                        !!rows("mantle.humanres.checklist.EmploymentChecklist", {employmentChangeId: plain.employmentChangeId})
                            .length
                ) && !changeOf(plain.employmentChangeId).accessOperationId
            // the proposal's bundle unregistered meanwhile: the request fails, is noted, and the hire stands
            system(() => call("update#moqui.security.CapabilityBundle", {userGroupId: "BOSS_PEOPLE_SELF", disabled: "Y"}))
            let failed
            try {
                failed = hire("Cy", {requestAccount: true})
                out.noted = !!waitFor(() => changeOf(failed.employmentChangeId)?.accessRequestFailure)
            } finally {
                system(() => call("update#moqui.security.CapabilityBundle", {userGroupId: "BOSS_PEOPLE_SELF", disabled: "N"}))
            }
            out.stands = rows("mantle.party.PartyRelationship", {partyRelationshipId: failed.partyRelationshipId}).length
            out.failure = changeOf(failed.employmentChangeId).accessOperationId || ""
            // HR asks again from Employee360, with the same key
            const again = asUser(users.hr, () =>
                page(
                    "Employees/Employee360/requestAccess",
                    {
                        partyId: failed.partyId,
                        employmentChangeId: failed.employmentChangeId,
                        changeKindEnumId: "EckHire"
                    },
                    "html"
                )
            )
            const after = changeOf(failed.employmentChangeId)
            out.again = [again.errors.length, !!after.accessOperationId, after.accessRequestFailure || ""]
            // a directory reader is no one of the hire's: Mantle refuses the request as for a missing change
            out.reader = asUser(users.reader, () =>
                system(() =>
                    invoke("ironstone.admin.LifecycleServices.request#Provisioning", {
                        employmentChangeId: failed.employmentChangeId
                    })
                )
            ).reasonCode
            return out
        },
        then(out) {
            out.hired.join("|") == "|true"
            out.operation.join("|") == "UlkProvision|" + ids.organizationId + "|UlopAttention"
            out.proposal == "BOSS_USERS,BOSS_PEOPLE_SELF"
            out.invite == "UlstWaiting|OPERATOR_REQUIRED"
            out.itTask == true
            out.plain == true
            out.noted == true
            out.stands == 1
            out.failure == ""
            out.again.join("|") == "0|true|"
            out.reader == "RECORD_UNAVAILABLE"
        }
    }
)

feature(
    "the employees import refuses a file with a password column and an HR editor without PEOPLE_IMPORT, and hires each valid row of Retail, naming the repeated one",
    {
        when() {
            const out = {}
            const email = name => name + "." + run + "@import.example"
            const good = [
                "First name,Last name,Work email,Start,Department ID",
                "Imogen,Import" + run + "," + email("imogen") + ",2026-11-02," + ids.departmentId,
                "Ivo,Import" + run + "," + email("ivo") + ",2026-11-02,",
                "Imogen,Import" + run + "," + email("imogen") + ",2026-11-02,"
            ].join("\n")
            const stage = (user, sourceText) =>
                asUser(user, () =>
                    invoke(T + "stage#Import", {targetId: "employees", organizationPartyId: ids.organizationId, sourceText})
                )
            out.password = stage(
                users.hr,
                "First name,Last name,Work email,Start,Password\nPat,Pw,pat." + run + "@import.example,2026-11-02,hunter2\n"
            )
            out.noImport = asUser("people.spec.noimport", () =>
                refusal(T + "stage#Import", {targetId: "employees", organizationPartyId: ids.organizationId, sourceText: good})
            )
            // the directory reader stages nothing: refused, by an error or a refusal answer
            out.reader = asUser(users.reader, () => {
                ec.message.pushErrors()
                try {
                    const staged = invoke(T + "stage#Import", {
                        targetId: "employees",
                        organizationPartyId: ids.organizationId,
                        sourceText: good
                    })
                    return staged.refused ? staged.reasonCode : ec.message.hasError() ? ec.message.getErrorsString() : "staged"
                } catch (error) {
                    return String(error.message)
                } finally {
                    ec.message.clearErrors()
                    ec.message.popErrors()
                }
            })
            out.readerBatches = rows("moqui.server.TransferBatch", {targetId: "employees", userId: "BOSS_PPL_READER"}).length
            // through the wizard's transitions under People/Employees/EmployeeImport
            const post = (path, parameters) =>
                asUser(users.hr, () => page("Employees/EmployeeImport/Index/" + path, parameters, "html"))
            out.staged = post("stage", {organizationPartyId: ids.organizationId, sourceText: good})
            const key = rows("moqui.server.TransferBatch", {targetId: "employees", userId: "BOSS_PPL_HR"}).sort((a, b) =>
                String(b.transferId).localeCompare(String(a.transferId))
            )[0]?.transferId
            const get = () => asUser(users.hr, () => invoke(T + "get#Transfer", {targetId: "employees", operationKey: key}))
            const validated = asUser(users.hr, () =>
                invoke(T + "validate#Import", {targetId: "employees", operationKey: key, mappingRevision: get().mappingRevision})
            )
            out.validCount = validated.validCount
            post("apply", {operationKey: key, inputFingerprint: validated.inputFingerprint})
            const applied = get()
            out.applied = [applied.appliedCount, applied.state]
            const repeated = Array.from(applied.importRows || []).find(row => Number(row.itemSeqId) === 3)
            out.repeated = [repeated?.result, String(repeated?.errorMessage || "")]
            out.hired = ["Imogen", "Ivo"].map(name =>
                rows("mantle.party.Person", {firstName: name, lastName: "Import" + run})
                    .map(
                        person =>
                            rows("mantle.party.PartyRelationship", {
                                relationshipTypeEnumId: "PrtEmployee",
                                fromPartyId: person.partyId,
                                toPartyId: ids.organizationId
                            }).length
                    )
                    .join(",")
            )
            // the wizard mounted under People is the employees target, an HR reader's
            out.context = asUser(users.hr, () =>
                system(() =>
                    invoke("ironstone.shared.DataImportServices.get#ImportContext", {
                        appRoot: "People",
                        targetId: "staffInvitations"
                    })
                )
            )
            return out
        },
        then(out) {
            out.password.reasonCode == "COLUMN_REFUSED"
            out.noImport.includes("PEOPLE_IMPORT")
            out.reader != "staged"
            out.readerBatches == 0
            out.staged.errors.length == 0
            out.validCount == 2
            out.applied.join("|") == "2|partial"
            out.repeated[0] == "invalid"
            out.repeated[1].includes("Repeats row ")
            out.hired.join("|") == "1|1"
            out.context.targetId == "employees"
            out.context.canStage == true
        }
    }
)

feature(
    "ChecklistTemplates shows the HR officer Retail's checklists and the steps of one; EquipmentDetail under People Ines's laptop with End assignment; WorkItemDetail under People a checklist task with its People box",
    {
        when() {
            const checklists = asUser(users.hr, () => page("Employees/ChecklistTemplates", {workEffortId: ids.onboardingId}))
            const equipment = asUser(users.hr, () => page("Employees/EquipmentDetail", {assetId: ids.laptopAssetId}))
            // a task of a checklist an HR hire started (the first feature's), opened by the HR officer who does it
            const task = system(
                () =>
                    Array.from(
                        ec.entity
                            .find("mantle.humanres.checklist.ChecklistStep")
                            .condition("sourceLinkEnumId", "ClsItAccess")
                            .condition("operationId", "is-not-null", null)
                            .list()
                    )[0]
            )
            const workItem = asUser(users.hr, () => page("Tasks/WorkItemDetail", {workEffortId: task?.workEffortId}))
            return {checklists, equipment, workItem}
        },
        then({checklists, equipment, workItem}) {
            checklists.errors.length == 0
            checklists.output.includes("New starter")
            checklists.output.includes("Leaver")
            checklists.output.includes("Steps of New starter")
            checklists.output.includes("Sign the staff handbook")
            checklists.output.includes("Add step")
            equipment.errors.length == 0
            equipment.output.includes("Laptop LT-204")
            equipment.output.includes("Ines Varga")
            equipment.output.includes("End assignment")
            workItem.errors.length == 0
            workItem.output.includes("Request the account and laptop")
            workItem.output.includes("Account request")
            workItem.output.includes("Onboarding")
        }
    }
)
