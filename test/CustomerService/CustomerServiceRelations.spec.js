// Customer Service merge and split (impl-customer-service P8; the merge, split, follow-up and closing rules are Mantle's, tested
// in mr-mantle test/request/SupportRelations): CaseDetail's actions by capability (Merge cases for the service manager, Split
// for a case editor), and the one render (qvt) of MergeCases with the kept case and a duplicate
// previewed, and of SplitCase with its messages offered. Nothing is merged or split here (the demo cases stay as they are;
// the acceptance CustomerServiceRelationsWalk does it). Run: ./moq test mr-boss --spec CustomerService/CustomerServiceRelations
const lib = ec.resource.script("component://mr-boss/test/CustomerService/CustomerServiceSpecLib.js")
const {ids, users, asUser, invoke} = lib

spec({
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("CaseDetail offers merge to the service manager and split to a case editor", {
    when() {
        const detail = user =>
            asUser(user, () =>
                invoke("ironstone.customerservice.CaseServices.get#CaseDetail", {
                    appRoot: "CustomerService",
                    requestId: ids.filtersCaseId
                })
            ).detail
        return {manager: detail(users.manager), agent: detail(users.agent)}
    },
    then({manager, agent}) {
        manager.canMerge == true
        manager.canSplit == true
        manager.lineage.actionable == true
        agent.canMerge == false
        agent.canSplit == true
        agent.canFollowUp == false
    }
})

feature("MergeCases previews the kept case and its duplicate; SplitCase offers the case's messages (qvt)", {
    when() {
        const merge = asUser(users.manager, () =>
            lib.page("Cases/MergeCases", {requestId: ids.thermostatCaseId, sourceRequestIds: ids.filtersCaseId})
        )
        const split = asUser(users.agent, () => lib.page("Cases/SplitCase", {requestId: ids.thermostatCaseId}))
        return {merge, split}
    },
    then({merge, split}) {
        merge.status == 200
        merge.errors.length == 0
        merge.output.includes("The case to keep and its duplicates")
        merge.output.includes("What the merge does")
        merge.output.includes(ids.filtersCaseId)
        merge.output.includes("Merge 1 case(s)")
        split.status == 200
        split.errors.length == 0
        split.output.includes("What the new case takes")
        split.output.includes("Customer-visible")
        split.output.includes("Make the new case")
    }
})
