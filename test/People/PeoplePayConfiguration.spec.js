// People's payroll configuration screens under Payroll (impl-people P22 and its review; design-people §8 PayComponentDetail,
// PayStructureDetail): the payroll approver's one html render of PayComponentDetail with a draft waiting for their approval (its
// terms, its example passing, values tried, the Approval box and Approve), the payroll operator's one html render of
// PayStructureDetail with a preview run (each component's amount, the totals, the demonstration localization's items and the
// calculation order), and the choices P22 adds (an employer's pay components, pay groups and accounts, and the localizations), each
// with a selected value that is not on the page. Mantle's rules (formulas, dependencies, overlaps, totals, groups, approval) are
// Mantle's PayConfiguration; the access case is PeopleAccessLater's. The usable-when walk is the acceptance
// PeoplePayConfigurationUsable.
// Run: ./moq test mr-boss --spec PeoplePayConfiguration
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const P = "mantle.humanres.PayrollSetupServices."
const choices = "ironstone.people.ContextServices.get#Choices"
const labels = (user, parameters) => asUser(user, () => invoke(choices, parameters)).options.map(option => option.label)
const values = (user, parameters) => asUser(user, () => invoke(choices, parameters)).options.map(option => option.value)
// a Mantle call as the People administrator (who also configures payroll and reads both employers), for the spec's own data
const asAdmin = (service, parameters) => asUser(users.admin, () => system(() => invoke(service, parameters)))
// publishing approved by Retail's payroll approver (the P22 review's call: it takes effect on approval)
const approve = parameters =>
    asUser(users.payApprover, () =>
        system(() => invoke(P + "decide#Publication", Object.assign({decision: "approve"}, parameters)))
    )
const state = {}

spec({
    setupSpec() {
        login("john.doe")
        // two of Retail's accounts, for a component's mapping and the choice
        state.accounts = system(() =>
            Array.from(
                ec.entity
                    .find("mantle.ledger.account.GlAccountOrganization")
                    .condition("organizationPartyId", ids.organizationId)
                    .orderBy("glAccountId")
                    .limit(40)
                    .list()
            ).map(row => row.glAccountId)
        )
        const revision = payrollComponentId => asAdmin(P + "find#Components", {payrollComponentId}).component.revision
        const base = asAdmin(P + "store#Component", {
            organizationPartyId: ids.organizationId,
            componentCode: "PCS_BASE",
            componentName: "Spec hourly pay",
            componentKindEnumId: "PckEarning",
            basisEnumId: "PcbFormula",
            formula: "round(hours * rate, 2)",
            inputNames: "hours, rate",
            currencyUomId: "USD",
            expenseGlAccountId: state.accounts[0]
        }).payrollComponentId
        asAdmin(P + "store#ComponentExample", {
            payrollComponentId: base,
            expectedRevision: revision(base),
            exampleName: "Ten hours",
            inputValues: "hours = 10, rate = 20",
            expectedAmount: "200.00"
        })
        asAdmin(P + "publish#Component", {payrollComponentId: base, expectedRevision: revision(base), reason: "Spec"})
        approve({payrollComponentId: base})
        state.deduction = asAdmin(P + "store#Component", {
            organizationPartyId: ids.organizationId,
            componentCode: "PCS_DED",
            componentName: "Spec saving plan",
            componentKindEnumId: "PckDeduction",
            basisEnumId: "PcbFormula",
            formula: "round(PCS_BASE * pct, 2)",
            inputNames: "pct",
            currencyUomId: "USD",
            liabilityGlAccountId: state.accounts[1]
        }).payrollComponentId
        asAdmin(P + "store#ComponentExample", {
            payrollComponentId: state.deduction,
            expectedRevision: revision(state.deduction),
            exampleName: "A tenth",
            inputValues: "PCS_BASE = 200, pct = 0.1",
            expectedAmount: "20"
        })
        // asked to publish: it waits for the payroll approver
        asAdmin(P + "publish#Component", {
            payrollComponentId: state.deduction,
            expectedRevision: revision(state.deduction),
            reason: "Spec saving plan starts"
        })
        state.structure = asAdmin(P + "store#Structure", {
            organizationPartyId: ids.organizationId,
            structureName: "Pay config spec staff",
            currencyUomId: "USD",
            payBasisEnumId: "PpbHourly"
        }).payrollStructureId
        const structureRevision = () => asAdmin(P + "find#Structures", {payrollStructureId: state.structure}).structure.revision
        asAdmin(P + "store#StructureComponent", {
            payrollStructureId: state.structure,
            expectedRevision: structureRevision(),
            payrollComponentId: base,
            sequenceNum: "10"
        })
        asAdmin(P + "store#StructureComponent", {
            payrollStructureId: state.structure,
            expectedRevision: structureRevision(),
            payrollComponentId: state.deduction,
            sequenceNum: "20",
            parameterValues: "pct = 0.1"
        })
        state.group = asAdmin(P + "store#Group", {
            organizationPartyId: ids.organizationId,
            groupName: "Pay config spec monthly",
            currencyUomId: "USD",
            timePeriodTypeId: "PayrollMonth",
            firstPeriodFromDate: "2027-01-01",
            periodsPerYear: "12",
            payDateOffsetDays: "3",
            prorationEnumId: "PprWorkingDays",
            timeBasisEnumId: "PtbTimesheets",
            payrollLocalizationId: "PlzDemonstration"
        }).payrollGroupId
        state.otherGroup = asAdmin(P + "store#Group", {
            organizationPartyId: ids.otherOrganizationId,
            groupName: "Pay config spec Services",
            currencyUomId: "USD",
            timePeriodTypeId: "PayrollWeek",
            firstPeriodFromDate: "2027-01-04",
            periodsPerYear: "52",
            payDateOffsetDays: "2",
            prorationEnumId: "PprHours",
            timeBasisEnumId: "PtbAttendance"
        }).payrollGroupId
        login("john.doe")
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "PayComponentDetail shows the payroll approver a draft waiting for their approval: its terms, its example passing, values tried and Approve",
    {
        when() {
            return {
                rendered: asUser(users.payApprover, () =>
                    page(
                        "Payroll/PayComponentDetail",
                        {payrollComponentId: state.deduction, sampleValues: "PCS_BASE = 150, pct = 0.1"},
                        "html"
                    )
                )
            }
        },
        then({rendered}) {
            rendered.status == 200
            rendered.errors.length == 0
            rendered.output.includes("PCS_DED")
            rendered.output.includes("Spec saving plan")
            rendered.output.includes("Draft terms")
            rendered.output.includes("round(PCS_BASE * pct, 2)")
            !rendered.output.includes("Edit calculation")
            rendered.output.includes("A tenth")
            rendered.output.includes("Passed")
            rendered.output.includes("Waiting for approval")
            rendered.output.includes("Spec saving plan starts")
            rendered.output.includes("Approve")
            rendered.output.includes("Refuse")
            !rendered.output.includes("Ask to publish")
            rendered.output.includes("Gives 15.00")
            rendered.output.includes("Not mapped")
        }
    }
)

feature("PayStructureDetail previews gross to net with the group's demonstration localization, in calculation order", {
    when() {
        return {
            rendered: asUser(users.payroll, () =>
                page(
                    "Payroll/PayStructureDetail",
                    {
                        payrollStructureId: state.structure,
                        runPreview: "true",
                        sampleValues: "hours = 10, rate = 20",
                        payrollGroupId: state.group
                    },
                    "html"
                )
            )
        }
    },
    then({rendered}) {
        rendered.status == 200
        rendered.errors.length == 0
        rendered.output.includes("Pay config spec staff")
        rendered.output.includes("Calculated in the order PCS_BASE → PCS_DED")
        rendered.output.includes("Gross earnings")
        rendered.output.includes("Demonstration levy, employee")
        rendered.output.includes("not any jurisdiction")
        rendered.output.includes("Computed")
        rendered.output.includes("2 draft lines")
    }
})

feature("the choices give an employer's pay components, pay groups and accounts to payroll, and the localizations", {
    when() {
        return {
            components: labels(users.payroll, {
                choice: "payComponents",
                organizationPartyId: ids.organizationId,
                term: "pcs_b",
                selected: state.deduction
            }),
            hrComponents: labels(users.hr, {choice: "payComponents", organizationPartyId: ids.organizationId}),
            groups: labels(users.payroll, {
                choice: "payGroups",
                organizationPartyId: ids.organizationId,
                term: "nothing like it",
                selected: state.group
            }),
            otherGroups: labels(users.payroll, {
                choice: "payGroups",
                organizationPartyId: ids.otherOrganizationId,
                selected: state.otherGroup
            }),
            accounts: values(users.payroll, {
                choice: "glAccounts",
                organizationPartyId: ids.organizationId,
                term: "zz-no-such-account",
                selected: state.accounts[1]
            }),
            localizations: labels(users.payroll, {choice: "payrollLocalizations", term: "demo"}),
            hrLocalizations: labels(users.hr, {choice: "payrollLocalizations"})
        }
    },
    then({components, hrComponents, groups, otherGroups, accounts, localizations, hrLocalizations}) {
        components == ["PCS_BASE · Spec hourly pay", "PCS_DED · Spec saving plan"]
        hrComponents == []
        groups == ["Pay config spec monthly"]
        otherGroups == []
        accounts == [state.accounts[1]]
        localizations == ["Demonstration (synthetic, not statutory)"]
        hrLocalizations == []
    }
})
