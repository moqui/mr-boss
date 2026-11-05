// Customer Service case templates (impl-customer-service P7, CS-TEMPLATES): the demo "Defective product" template on the
// Support queue (BossCustomerServiceDemoData.xml) in TemplateList's read and NewCase's template step; CaseTemplates' one render
// (qvt) of TemplateEdit with its fields and their audience, the condition rows, the customer's preview without the internal
// field, and the check of sample values that asks for the serial of equipment. The rules are Mantle's SupportTemplates spec;
// the access rule CustomerServiceAccess's; NewCase's fields are on CustomerServiceCases' one render of it.
// Run: ./moq test mr-boss --spec CustomerService/CustomerServiceTemplates
const lib = ec.resource.script("component://mr-boss/test/CustomerService/CustomerServiceSpecLib.js")
const {ids, users, asUser, invoke} = lib
const templates = "ironstone.customerservice.TemplateServices."

spec({
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("the demo template is the Support queue's: TemplateList's read and NewCase's template step", {
    when() {
        const found = asUser(users.admin, () =>
            invoke(templates + "find#Templates", {appRoot: "CustomerService", organizationPartyId: ids.organizationId})
        )
        const choice = asUser(users.agent, () =>
            invoke(templates + "get#CaseTemplateChoice", {
                appRoot: "CustomerService",
                organizationPartyId: ids.organizationId,
                requestCategoryId: ids.supportQueueId
            })
        )
        const otherQueue = asUser(users.agent, () =>
            invoke(templates + "get#CaseTemplateChoice", {
                appRoot: "CustomerService",
                organizationPartyId: ids.organizationId,
                requestCategoryId: ids.privacyQueueId
            })
        )
        return {template: Array.from(found.templates || []).find(row => row.formId == ids.templateFormId), choice, otherQueue}
    },
    then({template, choice, otherQueue}) {
        template.description == "Defective product"
        template.stateText == "Published"
        template.queueText == "Support"
        template.fieldText == "3 customer-visible, 1 internal"
        choice.templateFormId == ids.templateFormId
        choice.templateName == "Defective product"
        choice.templateOptions.some(row => row.value == ids.templateFormId)
        // a queue without a template takes none unless one is chosen
        otherQueue.templateFormId == null
    }
})

feature("TemplateEdit renders its fields, conditions and both previews, and the check asks for the serial of equipment (qvt)", {
    when() {
        return asUser(users.admin, () =>
            lib.page("Settings/CaseTemplates", {
                organizationPartyId: ids.organizationId,
                formId: ids.templateFormId,
                preview: "Y",
                productKind: "equipment"
            })
        )
    },
    then(rendered) {
        rendered.status == 200
        rendered.errors == []
        rendered.output.includes("Defective product")
        rendered.output.includes("Serial number")
        rendered.output.includes("First assessment")
        rendered.output.includes("Customer-visible")
        rendered.output.includes("TemplateConditions")
        rendered.output.includes("Preview: the customer's form")
        rendered.output.includes("1 internal field(s) are never shown or sent to the customer")
        rendered.output.includes("Serial number is required")
        rendered.output.includes("Use for a queue")
    }
})
