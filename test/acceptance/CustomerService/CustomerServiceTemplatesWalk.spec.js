// Customer Service P7's "usable when" (impl-customer-service P7, CS-TEMPLATES), as an acceptance walk through the screens'
// transitions with artifact authorization on: the "Defective product" template on the Support queue requires a serial when
// the product is equipment (the demo thermostat), and the server refuses NewCase's submit without it, then keeps the values,
// which CaseDetail's Overview shows as submitted; an internal field never reaches the customer-visible variant (the template's
// and the case's customer projections, and a customer's value for it refused); a template the administrator builds in
// CaseTemplates and changes from a date leaves an earlier case's values readable as submitted, with the form as it was then;
// a dependency cycle is refused; TemplatePreview renders for the desktop and phone (qvt) and the terminal (tui). The rules are
// Mantle's SupportTemplates spec. Run: ./moq accept mr-boss --spec CustomerServiceTemplatesWalk
const lib = ec.resource.script("component://mr-boss/test/CustomerService/CustomerServiceSpecLib.js")
const {ids, users, asUser, system, invoke} = lib
const webroot = "component://webroot/screen/webroot.xml"
const S = "mantle.request.SupportCaseServices."
const state = {}
const one = (entity, conditions) => system(() => ec.entity.find(entity).condition(conditions).one())
const rows = (entity, conditions) => system(() => Array.from(ec.entity.find(entity).condition(conditions).list()))
// a transition of a Customer Service screen as the user posts it
function post(user, path, parameters) {
    return asUser(user, () => {
        const rendered = ec.screen
            .makeTest()
            .rootScreen(webroot)
            .render("apps/CustomerService/" + path, parameters, "post")
        const result = {status: rendered.status, errors: Array.from(rendered.errorMessages || []).join(" | ")}
        ec.message.clearErrors()
        return result
    })
}
const newCase = (requestName, fields) =>
    post(
        users.agent,
        "Cases/NewCase/createCase",
        Object.assign(
            {
                organizationPartyId: ids.organizationId,
                customerPartyId: ids.customerId,
                requestTypeEnumId: "RqtSupport",
                requestCategoryId: ids.supportQueueId,
                requestName,
                priority: "5"
            },
            fields
        )
    )
const templates = "Settings/CaseTemplates/"
const edit = (transition, fields) => post(users.admin, templates + transition, Object.assign({formId: state.formId}, fields))
// a template's rows started a day ago, as if published yesterday (a response reads the form as of its date)
function startedYesterday(formId) {
    system(() => {
        const day = new Date(Date.now() - 86400000)
        for (const entity of [
            "moqui.screen.form.DbFormField",
            "moqui.screen.form.DbFormFieldOption",
            "moqui.screen.form.DbFormFieldDependency"
        ])
            for (const row of Array.from(ec.entity.find(entity).condition({formId}).list()))
                if (row.fromDate != null && !row.thruDate) {
                    row.set("fromDate", day)
                    row.update()
                }
    })
}

feature(
    "a Defective product case of equipment needs its serial: NewCase's submit without it is refused, then the case keeps its values",
    {
        when() {
            const step = asUser(users.agent, () => lib.page("Cases/NewCase", {customerPartyId: ids.customerId}))
            // the step made for a queue with no template, the queue changed to Support in step 2: refused, not asked for
            // fields never shown
            const switched = newCase("Queue switched in step two", {templateQueueId: ids.privacyQueueId, templateFormId: ""})
            const switchedRequest = one("mantle.request.Request", {requestName: "Queue switched in step two"})
            const refused = newCase("Thermostat dead after a week", {productKind: "equipment", problemStarted: "2026-11-01"})
            const refusedRequest = one("mantle.request.Request", {requestName: "Thermostat dead after a week"})
            const made = newCase("Thermostat dead after a week", {
                productKind: "equipment",
                serialNumber: "CS-THERMO-1001",
                problemStarted: "2026-11-01",
                agentAssessment: "Likely the sensor board"
            })
            const request = one("mantle.request.Request", {requestName: "Thermostat dead after a week"})
            state.defectiveCaseId = request?.requestId
            const profile = one("mantle.request.support.CaseProfile", {requestId: state.defectiveCaseId})
            const overview = asUser(users.agent, () =>
                lib.page("Cases/CaseDetail", {requestId: state.defectiveCaseId, tab: "overview"})
            )
            // a supply needs no serial, and one typed in anyway is hidden, so not kept
            const supply = newCase("Filter does not fit", {productKind: "supply", serialNumber: "NOT-KEPT"})
            const supplyCase = one("mantle.request.Request", {requestName: "Filter does not fit"})
            const supplyValues = asUser(
                users.agent,
                () => invoke(S + "get#CaseTemplateValues", {requestId: supplyCase?.requestId}),
                false
            )
            return {step, switched, switchedRequest, refused, refusedRequest, made, profile, overview, supply, supplyValues}
        },
        then({step, switched, switchedRequest, refused, refusedRequest, made, profile, overview, supply, supplyValues}) {
            switched.errors.includes("asks for the fields of its template Defective product")
            switchedRequest == null
            step.errors == []
            step.output.includes("What kind of product is it?")
            step.output.includes("Serial number")
            refused.errors.includes("TEMPLATE_VALUES_INVALID")
            refused.errors.includes("Serial number is required")
            refusedRequest == null
            made.errors == ""
            profile.templateFormId == ids.templateFormId
            profile.formResponseId != null
            overview.errors == []
            overview.output.includes("Defective product · as submitted")
            overview.output.includes("Equipment (a thermostat or controller)")
            overview.output.includes("CS-THERMO-1001")
            overview.output.includes("Likely the sensor board")
            supply.errors == ""
            supplyValues.values.map(value => value.fieldName) == ["productKind"]
        }
    }
)

feature("an internal field never reaches the customer-visible variant of the template or of the case's values", {
    when() {
        // the Support app's reads (P15 calls them through PASS); here as the agent, the customer's audience asked for
        const customerForm = asUser(
            users.agent,
            () => invoke(S + "get#CaseTemplate", {formId: ids.templateFormId, audience: "customer"}).template,
            false
        )
        const customerValues = asUser(
            users.agent,
            () => invoke(S + "get#CaseTemplateValues", {requestId: state.defectiveCaseId, audience: "customer"}),
            false
        )
        const fromCustomer = asUser(
            users.agent,
            () =>
                invoke(S + "validate#TemplateValues", {
                    formId: ids.templateFormId,
                    audience: "customer",
                    values: {productKind: "other", agentAssessment: "typed by a customer"}
                }),
            false
        )
        return {customerForm, customerValues, fromCustomer}
    },
    then({customerForm, customerValues, fromCustomer}) {
        customerForm.fields.map(field => field.fieldName) == ["productKind", "serialNumber", "problemStarted"]
        !JSON.stringify(customerForm).includes("agentAssessment")
        !JSON.stringify(customerForm).includes("First assessment")
        customerValues.values.map(value => value.fieldName) == ["productKind", "serialNumber", "problemStarted"]
        !JSON.stringify(customerValues).includes("Likely the sensor board")
        fromCustomer.valid == false
        fromCustomer.errors[0].code == "FIELD_NOT_OFFERED"
        fromCustomer.values == {productKind: "other"}
    }
})

feature("the administrator builds a template in CaseTemplates; a dependency cycle is refused", {
    when() {
        const created = post(users.admin, templates + "createTemplate", {
            organizationPartyId: ids.organizationId,
            description: "Late delivery"
        })
        state.formId = rows("moqui.screen.form.DbForm", {
            ownerPartyId: ids.organizationId,
            description: "Late delivery"
        })[0]?.formId
        const fields = [
            edit("saveField", {
                title: "Where is it",
                fieldTypeEnumId: "DBFFT_drop-down",
                audienceEnumId: "CfaCustomer",
                optionText: "never | It never arrived\nlate | It came late",
                isRequired: "Y"
            }),
            edit("saveField", {title: "Tracking number", fieldTypeEnumId: "DBFFT_text-line", audienceEnumId: "CfaCustomer"}),
            edit("saveField", {title: "Carrier claim", fieldTypeEnumId: "DBFFT_text-line", audienceEnumId: "CfaInternal"})
        ]
        const require = edit("saveCondition", {
            effect: "require",
            targetFieldName: "trackingNumber",
            sourceFieldName: "whereIsIt",
            operator: "equals",
            value: "never"
        })
        const cycle = edit("saveCondition", {
            effect: "show",
            targetFieldName: "whereIsIt",
            sourceFieldName: "trackingNumber",
            operator: "not-empty"
        })
        const published = edit("publishTemplate", {})
        const page = asUser(users.admin, () =>
            lib.page("Settings/CaseTemplates", {organizationPartyId: ids.organizationId, formId: state.formId})
        )
        return {created, fields, require, cycle, published, page}
    },
    then({created, fields, require, cycle, published, page}) {
        created.errors == ""
        state.formId != null
        fields.map(out => out.errors) == ["", "", ""]
        require.errors == ""
        cycle.errors.includes("CONDITION_CYCLE")
        published.errors == ""
        page.errors == []
        page.output.includes("Late delivery")
        page.output.includes("Published")
        page.output.includes("Tracking number")
        page.output.includes("Carrier claim")
    }
})

feature("a template changed from a date leaves an earlier case's values readable as submitted, with the form as it was", {
    when() {
        startedYesterday(state.formId)
        const made = newCase("Parcel never came", {
            templateFormId: state.formId,
            whereIsIt: "never",
            trackingNumber: "1Z999",
            carrierClaim: "Claim 77"
        })
        const request = one("mantle.request.Request", {requestName: "Parcel never came"})
        // the case was made a minute before the change
        system(() => {
            const profile = ec.entity.find("mantle.request.support.CaseProfile").condition({requestId: request.requestId}).one()
            const response = ec.entity
                .find("moqui.screen.form.FormResponse")
                .condition({formResponseId: profile.formResponseId})
                .one()
            response.set("responseDate", new Date(Date.now() - 60000))
            response.update()
        })
        const changed = edit("saveField", {
            fieldName: "whereIsIt",
            title: "What happened to the parcel",
            fieldTypeEnumId: "DBFFT_drop-down",
            audienceEnumId: "CfaCustomer",
            optionText: "never | Not delivered\nlate | Delivered late\ndamaged | Delivered damaged",
            isRequired: "Y",
            // now, in the administrator's time zone, as the dialog's date-time sends it
            fromDate: asUser(users.admin, () => ec.l10n.format(new Date(), "yyyy-MM-dd HH:mm:ss"), false)
        })
        const earlier = asUser(users.agent, () => lib.page("Cases/CaseDetail", {requestId: request.requestId, tab: "overview"}))
        const now = asUser(users.admin, () =>
            lib.page("Settings/CaseTemplates", {organizationPartyId: ids.organizationId, formId: state.formId})
        )
        return {made, changed, earlier, now}
    },
    then({made, changed, earlier, now}) {
        made.errors == ""
        changed.errors == ""
        earlier.errors == []
        earlier.output.includes("Where is it")
        earlier.output.includes("It never arrived")
        !earlier.output.includes("What happened to the parcel")
        now.output.includes("What happened to the parcel")
        now.output.includes("Delivered damaged")
    }
})

feature("TemplatePreview renders for the desktop and phone (qvt) and the terminal (tui)", {
    when() {
        const parameters = {
            organizationPartyId: ids.organizationId,
            formId: ids.templateFormId,
            preview: "Y",
            productKind: "equipment"
        }
        return {
            desktop: asUser(users.admin, () => lib.page("Settings/CaseTemplates", parameters)),
            terminal: asUser(users.admin, () => lib.page("Settings/CaseTemplates", parameters, "tui"))
        }
    },
    then({desktop, terminal}) {
        desktop.errors == []
        desktop.output.includes("Preview: the agent's form")
        desktop.output.includes("Check of these values")
        terminal.status == 200
        terminal.errors == []
        terminal.output.includes("Preview: the agent")
        terminal.output.includes("What kind of product is it?")
        // the check's box (its rows are the list's data in the terminal)
        terminal.output.includes("Check of these values")
    }
})
