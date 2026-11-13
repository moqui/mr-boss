// People's pay assignments screen and Employee360's Compensation (impl-people P23; design-people §8 PayAssignments, §4 Employee360's
// Compensation): the payroll operator's one html render of PayAssignments with an employment opened (its pay assignment, salary
// and readiness in the list, its assignments, the demonstration localization's declared tax fields and a benefit, and the bank
// accounts' note), the Compensation the context answers the payroll operator under People and no other app (Commons shows none,
// whatever the user may read), and the choices P23 adds (an employer's employments, structures and a structure's elective lines,
// and the benefit types), each with a selected value that is not on the page. Mantle's rules (one primary per employment and date,
// salary dates, the pay change, the profile's fields, readiness) are Mantle's PayAssignments; the access case (Compensation absent
// for HR with the same parameters) is PeopleAccessLater's. Pay opted out of AI (the user's call of Nov 12, 2026): an agent's render of
// Employee360 shows Compensation's placeholder, and the pay fields' definitions answer aiOptOut, which the data tool reads by.
// The usable-when walk is the acceptance PeoplePayAssignmentsUsable.
// Run: ./moq test mr-boss --spec PeoplePayAssignments
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const P = "mantle.humanres.PayrollSetupServices."
const choices = "ironstone.people.ContextServices.get#Choices"
const options = (user, parameters) => asUser(user, () => invoke(choices, parameters)).options
const prefix = "PPL_SPEC_PAS"
const employmentId = "BOSS_PPL_RAFAEL_EMP"
const state = {}

spec({
    setupSpec() {
        login("john.doe")
        // Retail's published structure (a base line for everyone, a pension line when elected) and pay group, made as data: the
        // configuration and its approval are P22's
        system(() => {
            const component = (code, extra) => {
                const payrollComponentId = prefix + "_C_" + code
                call("create#mantle.humanres.payroll.PayrollComponent", {
                    payrollComponentId,
                    organizationPartyId: ids.organizationId,
                    componentCode: prefix + "_" + code,
                    componentName: "Spec " + code.toLowerCase(),
                    componentKindEnumId: "PckEarning"
                })
                call(
                    "create#mantle.humanres.payroll.PayrollComponentTerm",
                    Object.assign({payrollComponentId, statusId: "PtsPublished", fromDate: 0, currencyUomId: "USD"}, extra)
                )
                return payrollComponentId
            }
            state.base = component("BASE", {basisEnumId: "PcbAmount", amount: "100"})
            state.pension = component("PENSION", {
                basisEnumId: "PcbFormula",
                formula: "pensionRate * 100",
                inputNames: "pensionRate"
            })
            state.structure = prefix + "_S"
            call("create#mantle.humanres.payroll.PayrollStructure", {
                payrollStructureId: state.structure,
                organizationPartyId: ids.organizationId,
                structureName: "Spec salaried staff",
                currencyUomId: "USD",
                payBasisEnumId: "PpbSalaried",
                statusId: "PtsPublished",
                fromDate: 0
            })
            for (const [payrollComponentId, eligibilityEnumId] of [
                [state.base, "PleAll"],
                [state.pension, "PleElected"]
            ])
                call("create#mantle.humanres.payroll.PayrollStructureComponent", {
                    payrollStructureId: state.structure,
                    payrollComponentId,
                    statusId: "PtsPublished",
                    fromDate: 0,
                    eligibilityEnumId
                })
            state.group = prefix + "_G"
            call("create#mantle.humanres.payroll.PayrollGroup", {
                payrollGroupId: state.group,
                organizationPartyId: ids.organizationId,
                groupName: "Spec monthly",
                currencyUomId: "USD",
                timePeriodTypeId: "PayrollMonth",
                firstPeriodFromDate: "2026-01-01",
                periodsPerYear: 12,
                payDateOffsetDays: 0,
                prorationEnumId: "PprCalendarDays",
                timeBasisEnumId: "PtbSchedule",
                payrollLocalizationId: "PlzDemonstration",
                liveEnabled: "N",
                fromDate: 0
            })
        })
        // Rafael's first salary set at once by ADMIN (PAYROLL_REPAIR: a payroll editor's would wait for approval as a pay change,
        // the user's call of Nov 12, 2026); the payroll operator assigns him and adds a benefit
        const asPayroll = (service, parameters) => asUser(users.payroll, () => system(() => invoke(service, parameters)))
        state.salary = asUser("john.doe", () =>
            system(() =>
                invoke("mantle.humanres.EmploymentServices.create#EmploymentSalary", {
                    partyRelationshipId: employmentId,
                    amount: "3600",
                    currencyUomId: "USD",
                    timePeriodTypeId: "PayrollMonth"
                })
            )
        )
        state.assigned = asPayroll(P + "assign#PayStructure", {
            partyRelationshipIds: employmentId,
            payrollStructureId: state.structure,
            payrollGroupId: state.group,
            electedComponentIds: state.pension,
            inputValues: "pensionRate = 0.04"
        })
        asPayroll(P + "store#PayrollProfile", {
            partyRelationshipId: employmentId,
            expectedRevision: asPayroll(P + "get#Compensation", {partyId: "BOSS_PPL_RAFAEL", partyRelationshipId: employmentId})
                .benefitRevision,
            benefitTypeId: "Health",
            cost: "90",
            employerPaidPercent: "80"
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature(
    "PayAssignments' one html render as the payroll operator: the employment's assignment, salary and readiness, its tax fields and benefit",
    {
        when() {
            const rendered = asUser(users.payroll, () =>
                page(
                    "Payroll/PayAssignments",
                    {organizationPartyId: ids.organizationId, partyRelationshipId: employmentId},
                    "html"
                )
            )
            return {assigned: state.assigned.assignedCount, rendered}
        },
        then({assigned, rendered}) {
            assigned == 1
            rendered.status == 200
            rendered.errors.length == 0
            // the list and the opened employment
            rendered.output.includes("Pay assignments")
            rendered.output.includes("Spec salaried staff")
            rendered.output.includes("Spec monthly")
            rendered.output.includes("$3,600.00 a month")
            // no tax profile yet: the demonstration localization's own fields, and what is missing
            rendered.output.includes("No tax profile for Demonstration")
            rendered.output.includes("Demonstration levy region")
            rendered.output.includes("Exempt from the demonstration levy")
            rendered.output.includes("pensionRate = 0.04")
            rendered.output.includes("Health Insurance")
            rendered.output.includes("80%")
            rendered.output.includes("Bank accounts change in Accounting")
            !rendered.output.includes("filingStatus")
        }
    }
)

feature("the Compensation of Employee360's context is People's alone: the payroll operator's under People, none under Commons", {
    when() {
        const context = appRoot =>
            asUser(users.payroll, () =>
                invoke("ironstone.people.ContextServices.get#Employee360Context", {
                    appRoot,
                    partyId: ids.associatePartyId,
                    partyRelationshipId: employmentId
                })
            )
        const people = context("People")
        // the payroll operator under Commons: the Overview at most, never Compensation
        const commons = system(() => {
            ec.message.pushErrors()
            try {
                return context("Commons")
            } catch (error) {
                return {regions: [], record: {}}
            } finally {
                ec.message.clearErrors()
                ec.message.popErrors()
            }
        })
        return {people, commons}
    },
    then({people, commons}) {
        Array.from(people.regions).includes("compensation")
        people.record.compensation.currentSalary.salaryText == "$3,600.00 a month"
        people.record.compensation.primary.structureName == "Spec salaried staff"
        people.canChangePay
        !Array.from(commons.regions || []).includes("compensation")
        !Object.hasOwn(commons.record || {}, "compensation")
    }
})

// the user's call of Nov 12, 2026 (PE-21): pay is opted out of AI. An agent's render (what Assist's screen and data tools read) of
// Employee360 shows Compensation's placeholder and none of the salary the payroll operator's context answers; and the data tool's
// entity reads, which leave out every field the definition answers aiOptOut for (moqui-llm tools::data read_entity), read no pay
feature(
    "Employee360's Compensation and the pay fields are opted out of AI: an agent's render shows the placeholder, the data tool reads no amount",
    {
        when() {
            const agent = asUser(users.payroll, () => {
                const out = ec.screen
                    .makeTest()
                    .rootScreen("component://mr-boss/screen/People.xml")
                    .renderMode("tui")
                    .agent()
                    .render(
                        "Employees/Employee360",
                        {partyId: ids.associatePartyId, partyRelationshipId: employmentId, lastStandalone: "-2"},
                        null
                    )
                ec.message.clearErrors()
                return {status: out.status, output: String(out.output || "")}
            })
            const optedOut = (entityName, fieldName) =>
                !!ec.entity.getEntityDefinition(entityName)?.getFieldInfo(fieldName)?.aiOptOut
            const fields = {
                "mantle.humanres.employment.EmploymentSalary": ["amount"],
                "mantle.humanres.rate.RateAmount": ["rateAmount"],
                "mantle.humanres.rate.PayGradeSalary": ["amount", "minAmount", "maxAmount"],
                "mantle.humanres.employment.EmploymentBenefit": ["cost"],
                "mantle.humanres.employment.EmploymentChange": ["salaryAmount"],
                "mantle.humanres.recruitment.EmploymentOffer": ["payAmount"],
                "mantle.humanres.payroll.PayrollAssignment": ["inputValues"],
                "mantle.humanres.payroll.PayrollComponentTerm": ["amount"],
                "mantle.humanres.payroll.PayrollComponentExample": ["inputValues", "expectedAmount"],
                "mantle.humanres.payroll.PayrollInput": ["amount", "rateAmount"],
                // the worker rates copied on a time entry (the user's call of Nov 12, 2026)
                "mantle.work.time.TimeEntry": ["vendorHourRate", "vendorPieceRate"],
                // P25's pay run amounts and explanations
                "mantle.humanres.payroll.PayrollRunEmployment": [
                    "grossAmount",
                    "deductionAmount",
                    "contributionAmount",
                    "localEmployeeAmount",
                    "localEmployerAmount",
                    "netAmount",
                    "employerCostAmount",
                    "splitText"
                ],
                "mantle.humanres.payroll.PayrollRunResult": ["amount", "explanation"]
            }
            const shared = Object.entries(fields).flatMap(([entityName, names]) =>
                names.filter(name => !optedOut(entityName, name)).map(name => entityName + "." + name)
            )
            return {agent, shared, currency: optedOut("mantle.humanres.employment.EmploymentSalary", "currencyUomId")}
        },
        then({agent, shared, currency}) {
            agent.status == 200
            // the salary set in setup ($3,600.00 a month, which the context answers the payroll operator) is not in the agent's render
            !agent.output.includes("3,600") && agent.output.includes("Not shared with AI")
            shared == []
            // a field of the same rows that is not an amount stays readable
            !currency
        }
    }
)

feature(
    "P23's choices: an employer's employments and structures, a structure's elective lines and the benefit types, a selected value off the page",
    {
        when() {
            const pick = (choice, extra) => options(users.payroll, Object.assign({choice}, extra))
            return {
                employments: pick("payEmployments", {organizationPartyId: ids.organizationId, term: "Rafael"}).map(
                    row => row.value
                ),
                employmentSelected: pick("payEmployments", {
                    organizationPartyId: ids.organizationId,
                    term: "zzz",
                    selected: employmentId
                }).map(row => row.value),
                otherEmployer: pick("payEmployments", {organizationPartyId: ids.otherOrganizationId}).length,
                structures: pick("payStructures", {organizationPartyId: ids.organizationId, term: "Spec salaried"}).map(
                    row => row.label
                ),
                structureSelected: pick("payStructures", {
                    organizationPartyId: ids.organizationId,
                    term: "zzz",
                    selected: state.structure
                }).map(row => row.value),
                elections: pick("payElections", {payrollStructureId: state.structure}).map(row => row.value),
                benefits: pick("benefitTypes", {term: "zzz", selected: "Health"}).map(row => row.value),
                hrStructures: options(users.hr, {choice: "payStructures", organizationPartyId: ids.organizationId}).length
            }
        },
        then(found) {
            found.employments.includes(employmentId)
            found.employmentSelected == [employmentId]
            found.otherEmployer == 0
            found.structures == ["Spec salaried staff · USD"]
            found.structureSelected == [state.structure]
            found.elections == [state.pension]
            found.benefits == ["Health"]
            found.hrStructures == 0
        }
    }
)
