// Customer Service's case template reads (impl-customer-service P7, CS-TEMPLATES; design-customer-service §3 NewCase, §9
// CaseTemplates; TemplateServices.xml): CaseTemplates' list of one of the user's settings organizations and its edit form's
// options, NewCase's choice of template, and the source-field options of a condition row. The templates, their rules and
// saves are Mantle's mantle.request.SupportCaseServices (CaseTemplates.js), which checks its own permission and organization;
// the screens call it after these reads.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const cs = ec.resource.script("component://mr-boss/service/ironstone/customerservice/CustomerService.js")
const configuration = ec.resource.script("component://mr-boss/service/ironstone/customerservice/Configuration.js")
const mantleTemplates = ec.resource.script("component://mr-mantle/service/mantle/request/CaseTemplates.js")
const {one, rows} = lib

const blank = value => value == null || String(value).trim() === ""
// The organization's service queues now (a category it owns with a current ServiceQueue row), with the template each uses.
function serviceQueues(organizationPartyId) {
    const categories = new Map(
        rows("mantle.request.RequestCategory", {ownerPartyId: organizationPartyId}).map(row => [row.requestCategoryId, row])
    )
    return cs
        .currentQueues()
        .filter(row => categories.has(row.requestCategoryId))
        .map(row => ({
            value: row.requestCategoryId,
            label: categories.get(row.requestCategoryId).description || row.requestCategoryId,
            templateFormId: row.templateFormId || null
        }))
        .sort((a, b) => a.label.localeCompare(b.label))
}

// find#Templates: the templates of one of the user's settings organizations (design TemplateList): name, state, the queues
// using each, its fields by audience, first published and last change; with the organization choice and the queues.
function findTemplates(p) {
    const userScope = cs.required()
    const organizationPartyId = configuration.organizationOf(userScope, p.organizationPartyId)
    const queues = serviceQueues(organizationPartyId)
    const templates = mantleTemplates.templatesOf(organizationPartyId).map(template =>
        Object.assign({}, template, {
            queueText: template.queues.map(queue => queue.queueName).join(", "),
            fieldText:
                template.customerFieldCount +
                " " +
                ec.l10n.localize("customer-visible") +
                ", " +
                template.internalFieldCount +
                " " +
                ec.l10n.localize("internal")
        })
    )
    return {
        organizationPartyId,
        organizations: configuration.organizationOptions(userScope),
        templates,
        queueOptions: queues.map(queue => ({value: queue.value, label: queue.label}))
    }
}

// get#CaseTemplateChoice: NewCase's template step: the organization's published templates and the one a case takes (the one
// chosen, else its type's, else the queue's), when the organization is one the user serves for; none otherwise. P11: a type's
// template is its current ServiceRequestType row's (the warranty claim's), when published.
function caseTemplateChoice(p) {
    const userScope = cs.required()
    const none = {templateOptions: [], templateFormId: null, queueTemplateFormId: null, templateName: null}
    if (blank(p.organizationPartyId) || !cs.vendorIds(userScope).includes(p.organizationPartyId)) return none
    const published = mantleTemplates.templatesOf(p.organizationPartyId).filter(template => template.published)
    const queueTemplateFormId = mantleTemplates.queueTemplate(p.requestCategoryId)
    const typeRow = blank(p.requestTypeEnumId)
        ? null
        : ec.resource
              .script("component://mr-mantle/service/mantle/request/SupportCases.js")
              .typeOf(p.organizationPartyId, p.requestTypeEnumId)
    const typeTemplateFormId = published.some(template => template.formId === typeRow?.templateFormId)
        ? typeRow.templateFormId
        : null
    const chosen = published.some(template => template.formId === p.templateFormId)
        ? p.templateFormId
        : typeTemplateFormId || queueTemplateFormId
    return {
        templateOptions: published.map(template => ({value: template.formId, label: template.description})),
        templateFormId: chosen || null,
        queueTemplateFormId,
        templateName: chosen ? published.find(template => template.formId === chosen)?.description || null : null
    }
}

// The options of a template's source field as of now with its drafts (a condition row's values), for an editor of the
// template's organization.
function conditionValues(p) {
    const userScope = cs.required()
    const form = blank(p.formId) ? null : one("moqui.screen.form.DbForm", {formId: p.formId})
    if (!form || !cs.vendorIds(userScope).includes(form.ownerPartyId) || blank(p.sourceFieldName)) return {options: []}
    const options = rows("moqui.screen.form.DbFormFieldOption", {formId: p.formId, fieldName: p.sourceFieldName})
        .filter(option => option.thruDate == null || lib.ms(option.thruDate) > lib.ms(ec.user.nowTimestamp))
        .sort((a, b) => Number(a.sequenceNum) - Number(b.sequenceNum))
        .map(option => ({value: option.keyValue, label: option.text || option.keyValue}))
    return {options}
}

const operations = {findTemplates, caseTemplateChoice, conditionValues}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Customer Service template operation " + op)
        return operations[op](parameters || {})
    }
})
