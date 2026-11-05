// Customer Service warranty claims (impl-customer-service P11): WarrantyAssessment's one qvt render of a claim on the delivered
// thermostat for the agent (its coverage from the ship date plus the 12-month term with the source, and Decide as the primary
// action), WarrantyClaims' one qvt render listing it, Customer360's Delivered items' one html render (a tab alone) showing the serial with its
// warranty end and the claim, and NewCase's template step taking the warranty claim type's template before the queue's. The
// rules are Mantle's SupportWarranty spec; the access rule is CustomerServiceAccess's; the usable-when is the acceptance
// CustomerServiceWarrantyWalk. RequestDetail's unlink of the claim's order moves its revision (F185, through WarrantyServices).
// The claim is the spec's own, closed at the end.
// Run: ./moq test mr-boss --spec CustomerServiceWarranty
const lib = ec.resource.script("component://mr-boss/test/CustomerService/CustomerServiceSpecLib.js")
const {ids, users, asUser, invoke} = lib
const state = {}

spec({
    cleanupSpec() {
        lib.closeWarrantyClaim(state.requestId)
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "WarrantyAssessment shows a claim's coverage and Decide; WarrantyClaims and Delivered items list it; NewCase takes its template",
    {
        when() {
            const thermostat = lib.deliveredThermostat()
            const made = lib.warrantyClaim(users.agent, {
                requestName: "Screen spec: the thermostat reads high",
                assetId: thermostat.assetId,
                assigneePartyId: "BOSS_CS_AGENT"
            })
            state.requestId = made.requestId
            const issued = String(thermostat.issuedDate)
            const ship = /^-?\d+$/.test(issued) ? Number(issued) : Date.parse(issued)
            const end = new Date(ship)
            end.setUTCMonth(end.getUTCMonth() + 12)
            const endText = ec.l10n.format(end, "yyyy-MM-dd")
            const assessment = asUser(users.agent, () => lib.page("Returns/WarrantyAssessment", {requestId: made.requestId}))
            const list = asUser(users.agent, () => lib.page("Returns/WarrantyClaims", {customerPartyId: ids.customerId}))
            const delivered = asUser(users.agent, () =>
                lib.page("Customers/Customer360/ServiceDeliveredItems", {customerPartyId: ids.customerId}, "html")
            )
            const choice = typeId =>
                asUser(users.agent, () =>
                    invoke("ironstone.customerservice.TemplateServices.get#CaseTemplateChoice", {
                        appRoot: "CustomerService",
                        organizationPartyId: ids.organizationId,
                        requestCategoryId: ids.supportQueueId,
                        requestTypeEnumId: typeId
                    })
                ).templateFormId
            const profile = ec.entity
                .find("mantle.request.support.CaseProfile")
                .condition("requestId", made.requestId)
                .disableAuthz()
                .one()
            // F185: RequestDetail's unlink of the claim's order goes through WarrantyServices, which moves its revision
            const unlinked = asUser(users.agent, () => {
                const posted = ec.screen
                    .makeTest()
                    .rootScreen("component://webroot/screen/webroot.xml")
                    .render(
                        "apps/CustomerService/Cases/CaseDetail/unlinkRecord",
                        {requestId: made.requestId, recordEntityName: "mantle.order.OrderHeader", recordId: ids.deliveredOrderId},
                        "post"
                    )
                const result = {status: posted.status, errors: Array.from(posted.errorMessages || []).join(" | ")}
                ec.message.clearErrors()
                return result
            })
            const revision = Number(
                ec.entity.find("mantle.request.Request").condition("requestId", made.requestId).disableAuthz().one().claimRevision
            )
            return {
                unlinked,
                revision,
                thermostat,
                made,
                endText,
                assessment,
                list,
                delivered,
                warrantyTemplate: choice("RqtWarranty"),
                supportTemplate: choice("RqtSupport"),
                profile
            }
        },
        then({
            unlinked,
            revision,
            thermostat,
            made,
            endText,
            assessment,
            list,
            delivered,
            warrantyTemplate,
            supportTemplate,
            profile
        }) {
            thermostat.assetId != null
            made.error == ""
            unlinked.errors == ""
            revision == made.claimRevision + 1
            profile.templateFormId == ids.warrantyTemplateFormId
            assessment.errors == []
            assessment.output.includes("Warranty claim " + made.requestId)
            assessment.output.includes("Product warranty at sale")
            assessment.output.includes("Coverage until " + endText)
            assessment.output.includes(ids.warrantyFeatureId)
            assessment.output.includes("Decide")
            !assessment.output.includes("Warranty claim not available")
            list.errors == []
            list.output.includes(made.requestId)
            delivered.errors == []
            delivered.output.includes(thermostat.serialNumber)
            delivered.output.includes(endText)
            delivered.output.includes("Claim " + made.requestId)
            warrantyTemplate == ids.warrantyTemplateFormId
            supportTemplate == ids.templateFormId
        }
    }
)
