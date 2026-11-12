// People P22's "usable when" (impl-people P22; design-people §8, §14.3 "Localization readiness", its configuration half), as an
// acceptance walk with artifact authorization on, through the Settings screens' transitions: a payroll configuration holder
// (PAYROLL_EDIT and PEOPLE_CONFIGURE; in BOSS's groups the People administrator, people.admin, who holds both and the payroll
// grants) builds a salary, an hourly and a deduction component with examples through PayComponents and PayComponentDetail and
// publishes each; composes a structure through PayStructures and PayStructureDetail, previews gross to net (the demonstration
// localization's items among them) and publishes it; and sets up a monthly group through PayGroups, prepares its periods and reads
// its readiness: preview only. The payroll operator (people.payroll, no PEOPLE_CONFIGURE) is refused publishing and the screens.
// The rules themselves are Mantle's PayConfiguration and mr-boss's PeoplePayConfiguration and PeopleAccess.
// Run: ./moq accept mr-boss --spec PeoplePayConfigurationUsable
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page, screenRefusal} = lib
const P = "mantle.humanres.PayrollSetupServices."
const webroot = "component://webroot/screen/webroot.xml"
const configurer = users.admin
// a request under the web root as the user (a transition's post), with its errors
function request(user, path, parameters, method) {
    return asUser(user, () => {
        const result = ec.screen.makeTest().rootScreen(webroot).render(path, parameters, method)
        const errors = Array.from(result.errorMessages || []).join(" | ")
        ec.message.clearErrors()
        return {status: result.status, output: String(result.output || ""), errors}
    })
}
// a Mantle read as the user, for the walk's checks (the screens show the same answer)
const read = (user, service, parameters) => asUser(user, () => system(() => invoke(service, parameters)))
const componentRevision = payrollComponentId => read(configurer, P + "find#Components", {payrollComponentId}).component.revision
const structureRevision = payrollStructureId => read(configurer, P + "find#Structures", {payrollStructureId}).structure.revision
const state = {}

spec({
    setupSpec() {
        login("john.doe")
        // Retail's accounts: the first two for the earnings' expense and the deduction's liability
        state.accounts = system(() =>
            Array.from(
                ec.entity
                    .find("mantle.ledger.account.GlAccountOrganization")
                    .condition("organizationPartyId", ids.organizationId)
                    .orderBy("glAccountId")
                    .limit(2)
                    .list()
            ).map(row => row.glAccountId)
        )
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("the configurer builds a salary, an hourly and a deduction component with examples and publishes each", {
    when() {
        const problems = []
        const post = (path, parameters, user = configurer) => {
            const out = request(user, "apps/People/Settings/" + path, parameters, "post")
            if (out.errors) problems.push(`${path}: ${out.errors}`)
            return out
        }
        const build = (code, name, kind, term, example) => {
            post("PayComponents/storeComponent", {
                organizationPartyId: ids.organizationId,
                componentCode: code,
                componentName: name,
                componentKindEnumId: kind
            })
            const id = read(configurer, P + "find#Components", {term: code}).components.find(
                row => row.componentCode === code
            )?.payrollComponentId
            if (!id) {
                problems.push(`${code} was not created`)
                return null
            }
            post(
                "PayComponentDetail/storeTerm",
                Object.assign({payrollComponentId: id, expectedRevision: componentRevision(id), payslipVisible: "Y"}, term)
            )
            post(
                "PayComponentDetail/storeExample",
                Object.assign({payrollComponentId: id, expectedRevision: componentRevision(id)}, example)
            )
            return id
        }
        state.salary = build(
            "WALK_SALARY",
            "Salary",
            "PckEarning",
            {
                basisEnumId: "PcbFormula",
                formula: "round(annualSalary / periodsPerYear, 2)",
                inputNames: "annualSalary, periodsPerYear",
                currencyUomId: "USD",
                expenseGlAccountId: state.accounts[0]
            },
            {exampleName: "Monthly", inputValues: "annualSalary = 48000, periodsPerYear = 12", expectedAmount: "4000.00"}
        )
        state.hourly = build(
            "WALK_HOURLY",
            "Hourly pay",
            "PckEarning",
            {
                basisEnumId: "PcbFormula",
                formula: "hours * hourlyRate",
                inputNames: "hours, hourlyRate",
                currencyUomId: "USD",
                roundingPlaces: "2",
                roundingEnumId: "PrdNearest",
                expenseGlAccountId: state.accounts[0]
            },
            {exampleName: "Twelve and a half hours", inputValues: "hours = 12.5, hourlyRate = 18.25", expectedAmount: "228.13"}
        )
        state.pension = build(
            "WALK_PENSION",
            "Pension",
            "PckDeduction",
            {
                basisEnumId: "PcbFormula",
                formula: "round((WALK_SALARY + WALK_HOURLY) * pensionRate, 2)",
                inputNames: "pensionRate",
                currencyUomId: "USD",
                liabilityGlAccountId: state.accounts[1]
            },
            {
                exampleName: "Five percent",
                inputValues: "WALK_SALARY = 4000, WALK_HOURLY = 228.13, pensionRate = 0.05",
                expectedAmount: "211.41"
            }
        )
        // the detail shows each example passing before publishing
        const detail = asUser(configurer, () => page("Settings/PayComponentDetail", {payrollComponentId: state.hourly}, "html"))
        if (detail.errors.length || !detail.output.includes("Passed") || !detail.output.includes("228.13"))
            problems.push(`the hourly pay's detail: ${detail.errors.join(" | ")}`)
        // the deduction reads the earnings: published after them; the payroll operator is refused publishing
        const operator = request(
            users.payroll,
            "apps/People/Settings/PayComponentDetail/publishComponent",
            {payrollComponentId: state.salary, expectedRevision: componentRevision(state.salary), reason: "Walk"},
            "post"
        )
        if (!/PERMISSION_DENIED|not authorized/.test(operator.errors))
            problems.push(`the payroll operator publishes: ${operator.errors || "published"}`)
        for (const id of [state.salary, state.hourly, state.pension])
            post("PayComponentDetail/publishComponent", {
                payrollComponentId: id,
                expectedRevision: componentRevision(id),
                reason: "Walk"
            })
        state.states = [state.salary, state.hourly, state.pension].map(
            id => read(configurer, P + "find#Components", {payrollComponentId: id}).component.state
        )
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
        state.states.join() == "current,current,current"
    }
})

feature("the configurer composes a structure, previews gross to net with the demonstration localization and publishes it", {
    when() {
        const problems = []
        const post = (path, parameters) => {
            const out = request(configurer, "apps/People/Settings/" + path, parameters, "post")
            if (out.errors) problems.push(`${path}: ${out.errors}`)
            return out
        }
        post("PayStructures/storeStructure", {
            organizationPartyId: ids.organizationId,
            structureName: "Walk store staff",
            currencyUomId: "USD",
            payBasisEnumId: "PpbMixed"
        })
        state.structure = read(configurer, P + "find#Structures", {term: "Walk store staff"}).structures[0]?.payrollStructureId
        for (const [id, sequenceNum, parameterValues] of [
            [state.salary, "10", ""],
            [state.hourly, "20", ""],
            [state.pension, "30", "pensionRate = 0.05"]
        ])
            post("PayStructureDetail/storeLine", {
                payrollStructureId: state.structure,
                expectedRevision: structureRevision(state.structure),
                payrollComponentId: id,
                sequenceNum,
                parameterValues
            })
        const preview = asUser(configurer, () =>
            page(
                "Settings/PayStructureDetail",
                {
                    payrollStructureId: state.structure,
                    runPreview: "true",
                    sampleValues: "annualSalary = 48000, periodsPerYear = 12, hours = 12.5, hourlyRate = 18.25",
                    payrollLocalizationId: "PlzDemonstration"
                },
                "html"
            )
        )
        if (preview.errors.length) problems.push(`the preview: ${preview.errors.join(" | ")}`)
        for (const text of [
            "4,228.13",
            "211.41",
            "Demonstration levy, employee",
            "not any jurisdiction",
            "WALK_SALARY → WALK_HOURLY → WALK_PENSION"
        ])
            if (!preview.output.includes(text)) problems.push(`the preview lacks ${text}`)
        state.totals = read(configurer, P + "preview#Structure", {
            payrollStructureId: state.structure,
            inputValues: "annualSalary = 48000, periodsPerYear = 12, hours = 12.5, hourlyRate = 18.25",
            payrollLocalizationId: "PlzDemonstration"
        }).totals
        post("PayStructureDetail/publishStructure", {
            payrollStructureId: state.structure,
            expectedRevision: structureRevision(state.structure),
            reason: "Walk"
        })
        state.structureState = read(configurer, P + "find#Structures", {payrollStructureId: state.structure}).structure.state
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
        // gross 4,228.13; net after the pension and the demonstration levy (2% of the earnings: 84.56): 3,932.16
        String(state.totals.gross) == "4228.13"
        state.totals.net.compare(toDecimal("3932.16")) == 0
        state.structureState == "current"
    }
})

feature(
    "the configurer sets up a monthly group whose readiness says it is preview only; the payroll operator opens none of the screens",
    {
        when() {
            const problems = []
            const post = (path, parameters) => {
                const out = request(configurer, "apps/People/Settings/" + path, parameters, "post")
                if (out.errors) problems.push(`${path}: ${out.errors}`)
                return out
            }
            post("PayGroups/storeGroup", {
                organizationPartyId: ids.organizationId,
                groupName: "Walk monthly",
                currencyUomId: "USD",
                timePeriodTypeId: "PayrollMonth",
                firstPeriodFromDate: "2027-01-01",
                periodsPerYear: "12",
                payDateOffsetDays: "0",
                prorationEnumId: "PprWorkingDays",
                timeBasisEnumId: "PtbTimesheets",
                payrollLocalizationId: "PlzDemonstration"
            })
            const group = read(configurer, P + "find#Groups", {term: "Walk monthly"}).groups[0]
            post("PayGroups/preparePeriods", {payrollGroupId: group.payrollGroupId, periodCount: "3"})
            const shown = asUser(configurer, () => page("Settings/PayGroups", {payrollGroupId: group.payrollGroupId}, "html"))
            if (shown.errors.length) problems.push(`PayGroups: ${shown.errors.join(" | ")}`)
            for (const text of ["Preview only", "2027-01-31", "2027-03-31"])
                if (!shown.output.includes(text)) problems.push(`PayGroups lacks ${text}`)
            for (const path of ["Settings/PayComponents", "Settings/PayStructures", "Settings/PayGroups"])
                if (!screenRefusal(users.payroll, path)) problems.push(`the payroll operator opens ${path}`)
            state.readiness = group.readiness
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
            state.readiness.reasonCode == "PREVIEW_ONLY"
            state.readiness.liveAllowed == false
        }
    }
)
