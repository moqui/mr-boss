// People P7's "usable when" (impl-people P7; design-people §4 checklists, equipment and provisioning, §12 ChecklistTemplates and
// EmployeeImport, §14.3 "Separation and equipment" and "Pay rates and phones", its phone half; design-admin §15.3 "Hire and
// invitation", its People half), as an acceptance walk with artifact authorization on: people.hr hires a new person into Retail
// with an account asked, which starts the New starter checklist and one provisioning operation; Admin's identity operator
// (admin.identity) sends its invitation from the waiting step, and the IT task shows Admin's outcome; the new employee accepts it,
// their phone lists their onboarding task, which they complete, and lists no offboarding task once they are separated; Ines
// Varga's separation raises the return of her laptop, and ending the holding from EquipmentDetail completes it; a CSV of five
// employees, one a repeat, hires four and names the one, and Admin's Imports lists the run for a data operator who also holds
// PEOPLE_HR_VIEW. The calls are the Mantle and framework services the screens call, as each user; the screens are rendered for what
// they show. The rules are Mantle's WorkProcess, UserProvisioning and PeopleChecklists and mr-boss's PeopleLifecycle and
// PeopleAccess. Run: ./moq accept mr-boss --spec PeopleLifecycleUsable
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, system, invoke, page} = lib
const P = "mantle.humanres.PeopleServices."
const S = "mantle.party.IdentityServices."
const T = "org.moqui.admin.DataTransferServices."
const run = String(Date.now()).slice(-6)
const state = {}
// the new employee's own password, chosen when they accept the invitation (the demo users' is the test login's default)
const NEW_PASSWORD = "Moqui1!!usable"
const passwords = {}
// lib.asUser, and for the new employee a sign-in with their own password
function asUser(username, action) {
    if (!passwords[username]) return lib.asUser(username, action)
    login(username, passwords[username])
    const disabled = ec.artifactExecution.authzDisabled()
    try {
        ec.artifactExecution.enableAuthz()
        return action()
    } finally {
        ec.message.clearErrors()
        if (disabled) ec.artifactExecution.disableAuthz()
        login("john.doe")
    }
}
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
const codeOf = message => /[A-Z][A-Z0-9_]{3,}(?=:)/.exec(message)?.[0] || message
// a service call as the user (the screen's grant opens it; the service checks the user), with its refusal's code
function as(user, service, parameters, open = true) {
    return asUser(user, () => {
        const body = () => {
            ec.message.pushErrors()
            try {
                const out = ec.service.sync().name(service).parameters(parameters).requireNewTransaction(true).call() || {}
                return Object.assign({}, out, {code: ec.message.hasError() ? codeOf(ec.message.getErrorsString()) : ""})
            } catch (error) {
                return {code: codeOf(String(error.message))}
            } finally {
                ec.message.clearErrors()
                ec.message.popErrors()
            }
        }
        return open ? system(body) : body()
    })
}
const rows = (entity, conditions) => system(() => Array.from(ec.entity.find(entity).condition(conditions).disableAuthz().list()))
const one = (entity, conditions) => rows(entity, conditions)[0] || null
function waitFor(read, millis = 8000) {
    const end = Date.now() + millis
    let value = read()
    while (!value && Date.now() < end) value = read()
    return value
}
const revisionOf = partyRelationshipId =>
    system(() =>
        ec.resource.script("component://mr-mantle/service/mantle/humanres/People.js").employmentRevision(partyRelationshipId)
    )
// the tasks on a user's phone: CalDAV's Tasks collection
const phoneTasks = username =>
    asUser(username, () =>
        system(() =>
            Array.from(invoke("mantle.work.CalendarDavServices.get#TaskObjectTags").objectList || []).map(row => row.workEffortId)
        )
    )

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature(
    "people.hr hires a new person with an account asked: the New starter checklist starts and one provisioning operation waits for an identity operator, who sends the invitation; the IT task shows Admin's outcome",
    {
        when() {
            const out = {}
            const hired = as(users.hr, P + "hire#Employee", {
                organizationPartyId: ids.organizationId,
                firstName: "Una",
                lastName: "Usable" + run,
                workEmail: "una.usable." + run + "@ziziwork.example",
                confirmNewPerson: true,
                departmentPartyId: ids.departmentId,
                managerPartyId: ids.managerPartyId,
                requestAccount: true,
                operationKey: "PPL-USABLE-HIRE-" + run
            })
            Object.assign(state, {hired})
            out.hired = hired.code
            const checklist = waitFor(() =>
                rows("mantle.humanres.checklist.EmploymentChecklist", {employmentChangeId: hired.employmentChangeId}).find(
                    row => row.templateWorkEffortId === ids.onboardingId
                )
            )
            state.tasks = checklist ? rows("mantle.work.effort.WorkEffort", {rootWorkEffortId: checklist.workEffortId}) : []
            out.tasks = state.tasks
                .map(task => task.workEffortName)
                .sort()
                .join(", ")
            const change = waitFor(
                () =>
                    one("mantle.humanres.employment.EmploymentChange", {employmentChangeId: hired.employmentChangeId})
                        ?.accessOperationId
            )
            state.operationId = change
            out.operations = rows("mantle.party.UserLifecycleOperation", {
                sourceReference: "EmploymentChange:" + hired.employmentChangeId
            }).length
            const invite = one("mantle.party.UserLifecycleOperationStep", {operationId: state.operationId, stepKind: "invite"})
            out.waiting = invite?.reasonCode
            // the identity operator sends the invitation from LifecycleDetail's Retry, as themselves
            const sent = as(
                "admin.identity",
                S + "retry#LifecycleStep",
                {operationId: state.operationId, stepSeqId: invite?.stepSeqId},
                false
            )
            out.sent = [sent.code, sent.applied]
            state.invitation = one("mantle.party.UserInvitation", {partyId: hired.partyId})
            out.invitations = rows("mantle.party.UserInvitation", {partyId: hired.partyId}).length
            // the IT task shows Admin's outcome to the HR officer who does it
            const itTask = state.tasks.find(task => task.workEffortName === "Request the account and laptop")
            const detail = asUser(users.hr, () => page("Tasks/WorkItemDetail", {workEffortId: itTask?.workEffortId}))
            out.detail = [opened(detail), detail.output.includes("Account request"), detail.output.includes("Invitation: done")]
            out.lifecycle = asUser("admin.identity", () =>
                page("Users/LifecycleDetail", {operationId: state.operationId}, "qvt", "Admin")
            )
            return out
        },
        then(out) {
            out.hired == ""
            out.tasks == "Introduce the team, Request the account and laptop, Sign the staff handbook"
            out.operations == 1
            out.waiting == "OPERATOR_REQUIRED"
            out.sent.join("|") == "|true"
            out.invitations == 1
            out.detail.join("|") == "true|true|true"
            opened(out.lifecycle)
            out.lifecycle.output.includes("Provisioning")
        }
    }
)

feature(
    "the new employee accepts the invitation; their phone lists their onboarding task, which they complete from it, and after their separation lists no offboarding task",
    {
        when() {
            const out = {}
            const shown = as("admin.identity", S + "reveal#InvitationLink", {invitationId: state.invitation.invitationId}, false)
            const token = String(shown.acceptUrl || "").split("/i/")[1] || ""
            logout()
            const accepted = system(() =>
                invoke(S + "accept#Invitation", {
                    token,
                    username: "una.usable." + run,
                    newPassword: NEW_PASSWORD,
                    newPasswordVerify: NEW_PASSWORD
                })
            )
            login("john.doe")
            out.accepted = [accepted.applied, accepted.accountCreated]
            const username = "una.usable." + run
            passwords[username] = NEW_PASSWORD
            const handbook = state.tasks.find(task => task.workEffortName === "Sign the staff handbook")
            out.listed = phoneTasks(username).includes(handbook?.workEffortId)
            out.completed = as(username, "mantle.work.TaskServices.set#TaskStatus", {
                workEffortId: handbook?.workEffortId,
                statusId: "WeComplete"
            }).code
            // separated (Hannah approves): the Leaver checklist's tasks are protected, off the phone
            const employment = state.hired.partyRelationshipId
            const asked = as(users.hr, P + "apply#EmploymentChange", {
                partyRelationshipId: employment,
                changeKind: "separation",
                reason: "Changed her mind",
                expectedRevision: revisionOf(employment)
            })
            const decided = as(users.manager, P + "decide#EmploymentChange", {employmentChangeId: asked.employmentChangeId})
            out.separated = [asked.code, decided.code, decided.applied]
            const leaver = waitFor(() =>
                rows("mantle.humanres.checklist.EmploymentChecklist", {employmentChangeId: asked.employmentChangeId}).find(
                    row => row.templateWorkEffortId === ids.offboardingId
                )
            )
            const keys = leaver
                ? rows("mantle.work.effort.WorkEffort", {rootWorkEffortId: leaver.workEffortId}).find(
                      task => task.workEffortName === "Hand back keys and badge"
                  )
                : null
            out.offPhone = !!keys && !phoneTasks(username).includes(keys.workEffortId)
            return out
        },
        then(out) {
            out.accepted.join("|") == "true|true"
            out.listed == true
            out.completed == ""
            out.separated.join("|") == "||true"
            out.offPhone == true
        }
    }
)

feature(
    "Ines Varga's separation raises the return of her laptop; ending the holding from EquipmentDetail to the HR officer completes the return task",
    {
        when() {
            const out = {}
            const employment = rows("mantle.party.PartyRelationship", {
                relationshipTypeEnumId: "PrtEmployee",
                fromPartyId: ids.reportPartyId,
                toPartyId: ids.organizationId
            }).find(row => row.thruDate == null)
            // her last day a year from now: the separation applies when decided (the Leaver checklist and the laptop's return start
            // then) and she stays employed for the walks that run after this one in a whole run (her transfer, her leave, a manager
            // change to her)
            const lastDay = ec.l10n.format(new Date(ec.user.timestampMillis(ec.user.nowTimestamp) + 365 * 86400000), "yyyy-MM-dd")
            const asked = as(users.hr, P + "apply#EmploymentChange", {
                partyRelationshipId: employment.partyRelationshipId,
                changeKind: "separation",
                effectiveDate: lastDay,
                reason: "Moving abroad",
                expectedRevision: revisionOf(employment.partyRelationshipId)
            })
            const decided = as(users.manager, P + "decide#EmploymentChange", {employmentChangeId: asked.employmentChangeId})
            out.separated = [asked.code, decided.code, decided.applied]
            const task = waitFor(() =>
                rows("mantle.work.effort.WorkEffortAssetAssign", {assetId: ids.laptopAssetId})
                    .map(row => row.workEffortId)
                    .find(
                        id =>
                            one("mantle.humanres.checklist.ChecklistStep", {workEffortId: id})?.sourceLinkEnumId ===
                            "ClsEquipmentReturn"
                    )
            )
            out.task = !!task
            const equipment = asUser(users.hr, () => page("Employees/EquipmentDetail", {assetId: ids.laptopAssetId}))
            out.equipment = [opened(equipment), equipment.output.includes("End assignment")]
            const returned = asUser(users.hr, () =>
                page(
                    "Employees/EquipmentDetail/returnEquipment",
                    {
                        assetId: ids.laptopAssetId,
                        holderPartyId: ids.reportPartyId,
                        roleTypeId: "Custodian",
                        newPartyId: ids.managerPartyId
                    },
                    "html"
                )
            )
            // the transition answers with its redirect back to the equipment, and no error
            out.returned = returned.status === 302 && returned.errors.length === 0
            out.done = task ? one("mantle.work.effort.WorkEffort", {workEffortId: task}).statusId : ""
            return out
        },
        then(out) {
            out.separated.join("|") == "||true"
            out.task == true
            out.equipment.join("|") == "true|true"
            out.returned == true
            out.done == "WeComplete"
        }
    }
)

feature(
    "a CSV of five employees, one a repeat, hires four and names the one; Admin's Imports lists the run for a data operator who also holds PEOPLE_HR_VIEW",
    {
        when() {
            const out = {}
            const email = name => name + "." + run + "@usable-import.example"
            const csv = ["First name,Last name,Work email,Start"]
                .concat(
                    ["Abe", "Bea", "Cal", "Dee"].map(
                        name => name + ",Usable" + run + "," + email(name.toLowerCase()) + ",2026-11-16"
                    )
                )
                .concat(["Abe,Usable" + run + "," + email("abe") + ",2026-11-16"])
                .join("\n")
            const post = (path, parameters) =>
                asUser(users.hr, () => page("Employees/EmployeeImport/Index/" + path, parameters, "html"))
            // the wizard's transition answers with its redirect to the next step, and no error
            const staged = post("stage", {organizationPartyId: ids.organizationId, sourceText: csv})
            out.staged = staged.status === 302 && staged.errors.length === 0
            const key = rows("moqui.server.TransferBatch", {targetId: "employees", userId: "BOSS_PPL_HR"}).sort((a, b) =>
                String(b.transferId).localeCompare(String(a.transferId))
            )[0]?.transferId
            const get = () =>
                asUser(users.hr, () => system(() => invoke(T + "get#Transfer", {targetId: "employees", operationKey: key})))
            const validated = asUser(users.hr, () =>
                system(() =>
                    invoke(T + "validate#Import", {
                        targetId: "employees",
                        operationKey: key,
                        mappingRevision: get().mappingRevision
                    })
                )
            )
            post("apply", {operationKey: key, inputFingerprint: validated.inputFingerprint})
            const applied = get()
            out.applied = [applied.appliedCount, applied.errorCount]
            out.named = Array.from(applied.importRows || [])
                .filter(row => row.result === "invalid")
                .map(row => String(row.errorMessage))
                .join("; ")
            // a data operator of Retail with PEOPLE_HR_VIEW reads the run in Admin's Imports
            system(() => {
                call("create#moqui.security.UserGroup", {userGroupId: "PPL_USABLE_HRVIEW", description: "People usable: HR view"})
                call("create#moqui.security.UserGroupPermission", {
                    userGroupId: "PPL_USABLE_HRVIEW",
                    userPermissionId: "PEOPLE_HR_VIEW",
                    fromDate: 0
                })
                const data = ec.entity.find("moqui.security.UserAccount").condition("username", "admin.data").one()
                if (data)
                    call("create#moqui.security.UserGroupMember", {
                        userId: data.userId,
                        userGroupId: "PPL_USABLE_HRVIEW",
                        fromDate: 0
                    })
            })
            const imports = asUser("admin.data", () => page("Data/Imports", {targetId: "employees"}, "qvt", "Admin"))
            out.imports = [opened(imports), imports.output.includes("Employees")]
            return out
        },
        then(out) {
            out.staged == true
            out.applied.join("|") == "4|1"
            out.named.includes("Repeats row")
            out.imports.join("|") == "true|true"
        }
    }
)
