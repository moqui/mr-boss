// People P4's "usable when" (impl-people P4; design-people §5), as an acceptance walk with artifact authorization on: people.hr
// defines a job class through JobClasses and gives it a skill through JobClassDetail, plans two seats of it in Merchandising
// through Positions and sees them vacant (the list's vacancy filter and each seat's record); people.payroll sets a grade band
// through PayGrades (a new grade of Retail with its band, then a raise from next month that ends it) and reads the amounts; people.hr puts the
// grade on a seat through PositionDetail and sees the grade's name and no amounts, on PayGrades, PositionDetail and the choices,
// and a forged band is refused. The rules themselves are Mantle's PeoplePositions and mr-boss's PeoplePositions and PeopleAccess.
// Run: ./moq accept mr-boss --spec PeoplePositionsUsable
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const S = "mantle.humanres.PositionServices."
const G = "mantle.humanres.PayrollSetupServices."
const webroot = "component://webroot/screen/webroot.xml"
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
const day = 24 * 60 * 60 * 1000
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
const state = {}

spec({
    setupSpec() {
        login("john.doe")
        state.nextMonth = ec.l10n.format(new Date(ec.user.timestampMillis(ec.user.nowTimestamp) + 31 * day), "yyyy-MM-dd")
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("people.hr defines a job class, plans two seats of it in a department and sees them vacant", {
    when() {
        const problems = []
        const created = request(
            users.hr,
            "apps/People/Staffing/JobClasses/storeJobClass",
            {title: "Visual merchandiser", description: "Dresses the windows and the floor for each season."},
            "post"
        )
        if (created.errors) problems.push(`the job class: ${created.errors}`)
        const jobClass = read(users.hr, S + "find#JobClasses", {term: "Visual merchandiser"}).jobClasses[0]
        state.classId = jobClass?.emplPositionClassId
        const skill = request(
            users.hr,
            "apps/People/Staffing/JobClassDetail/storeRequirement",
            {emplPositionClassId: state.classId, skillTypeEnumId: "BOSS_PPL_SK_SERVICE"},
            "post"
        )
        if (skill.errors) problems.push(`the skill: ${skill.errors}`)
        for (const name of ["Visual merchandiser 1", "Visual merchandiser 2"]) {
            const planned = request(
                users.hr,
                "apps/People/Staffing/Positions/storePosition",
                {
                    organizationPartyId: ids.organizationId,
                    departmentPartyId: "BOSS_PPL_D_MERCH",
                    emplPositionClassId: state.classId,
                    description: name,
                    standardHoursPerWeek: "32"
                },
                "post"
            )
            if (planned.errors) problems.push(`${name}: ${planned.errors}`)
        }
        const seats = read(users.hr, S + "find#Positions", {emplPositionClassId: state.classId, vacancy: "vacant"}).positions
        state.seatId = seats[0]?.emplPositionId
        if (seats.length !== 2 || !seats.every(row => row.state === "planned" && row.departmentName === "Merchandising"))
            problems.push(`the seats: ${JSON.stringify(seats.map(row => [row.positionName, row.state, row.vacancy]))}`)
        const list = asUser(users.hr, () =>
            page("Staffing/Positions", {emplPositionClassId: state.classId, vacancy: "vacant"}, "html")
        )
        if (!opened(list)) problems.push(`Positions: ${list.status} ${list.errors}`)
        for (const text of ["Visual merchandiser 1", "Visual merchandiser 2", "Vacant", "Planned"])
            if (!list.output.includes(text)) problems.push(`Positions does not show ${text}`)
        const detail = asUser(users.hr, () => page("Staffing/PositionDetail", {emplPositionId: state.seatId}, "tui"))
        if (!opened(detail) || !detail.output.includes("No one holds this position"))
            problems.push(`PositionDetail in the terminal: ${detail.status} ${detail.errors}`)
        const classPage = asUser(users.hr, () => page("Staffing/JobClassDetail", {emplPositionClassId: state.classId}, "html"))
        for (const text of ["Visual merchandiser", "Customer service", "Positions of this class"])
            if (!classPage.output.includes(text)) problems.push(`JobClassDetail does not show ${text}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("people.payroll sets a grade band and a raise from next month, and reads the amounts", {
    when() {
        const problems = []
        const store = parameters => request(users.payroll, "apps/People/Staffing/PayGrades/storePayGrade", parameters, "post")
        const band = {
            currencyUomId: "USD",
            timePeriodTypeId: "PayrollMonth",
            minAmount: "3200",
            amount: "3700",
            maxAmount: "4300"
        }
        const created = store(Object.assign({gradeName: "Visual", organizationPartyId: ids.organizationId}, band))
        if (created.errors) problems.push(`the grade: ${created.errors}`)
        const grade = read(users.payroll, G + "find#PayGrades", {term: "Visual"}).payGrades[0]
        state.gradeId = grade?.payGradeId
        const raised = store(
            Object.assign({payGradeId: state.gradeId, expectedRevision: grade?.revision, fromDate: state.nextMonth}, band, {
                amount: "3900",
                maxAmount: "4500"
            })
        )
        if (raised.errors) problems.push(`the raise: ${raised.errors}`)
        const bands = read(users.payroll, G + "find#PayGrades", {payGradeId: state.gradeId}).bands
        if (bands.map(row => [String(row.amount), row.state].join(" ")).join(", ") !== "3900 future, 3700 current")
            problems.push(`the bands: ${JSON.stringify(bands)}`)
        const shown = asUser(users.payroll, () => page("Staffing/PayGrades", {payGradeId: state.gradeId}, "html"))
        if (!opened(shown)) problems.push(`PayGrades: ${shown.status} ${shown.errors}`)
        for (const text of ["Visual", "Bands of Visual", "3,700", "3,900"])
            if (!shown.output.includes(text)) problems.push(`payroll's PayGrades does not show ${text}`)
        // a band out of order is refused
        const backwards = store(
            Object.assign({gradeName: "Backwards", organizationPartyId: ids.organizationId}, band, {minAmount: "5000"})
        )
        if (!backwards.errors.includes("BAND_ORDER")) problems.push(`a band out of order: ${backwards.errors || "accepted"}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("people.hr puts the grade on a seat and sees the grade's name and no amounts; a forged band is refused", {
    when() {
        const problems = []
        const seat = read(users.hr, S + "get#Position", {emplPositionId: state.seatId}).position
        const graded = request(
            users.hr,
            "apps/People/Staffing/PositionDetail/storePosition",
            {
                emplPositionId: state.seatId,
                expectedRevision: seat?.revision,
                description: seat?.description,
                departmentPartyId: seat?.departmentPartyId,
                emplPositionClassId: seat?.emplPositionClassId,
                payGradeId: state.gradeId,
                standardHoursPerWeek: "32",
                changeReason: "Graded"
            },
            "post"
        )
        if (graded.errors) problems.push(`the grade on the seat: ${graded.errors}`)
        const amounts = /3,?700|3,?900|4,?300|4,?500|USD/
        for (const [path, parameters] of [
            ["Staffing/PayGrades", {}],
            ["Staffing/PayGrades", {payGradeId: state.gradeId}],
            ["Staffing/PositionDetail", {emplPositionId: state.seatId}]
        ]) {
            const rendered = asUser(users.hr, () => page(path, parameters, "html"))
            if (!opened(rendered)) problems.push(`${path}: ${rendered.status} ${rendered.errors}`)
            if (!rendered.output.includes("Visual")) problems.push(`${path} does not show the grade's name`)
            if (amounts.test(rendered.output)) problems.push(`${path} shows an amount to HR`)
            if (rendered.output.includes("Bands of")) problems.push(`${path} shows HR the bands`)
        }
        const answer = read(users.hr, G + "find#PayGrades", {payGradeId: state.gradeId})
        if (answer.amountsShown || answer.bands.length || amounts.test(JSON.stringify(answer.payGrades)))
            problems.push(`HR's answer: ${JSON.stringify(answer.payGrades)}`)
        const choice = asUser(users.hr, () =>
            invoke("ironstone.people.ContextServices.get#Choices", {choice: "payGrades", term: "Visual"})
        )
        if (amounts.test(JSON.stringify(choice.options))) problems.push(`the choice: ${JSON.stringify(choice.options)}`)
        const forged = request(
            users.hr,
            "apps/People/Staffing/PayGrades/storePayGrade",
            {
                gradeName: "Forged",
                organizationPartyId: ids.organizationId,
                currencyUomId: "USD",
                timePeriodTypeId: "PayrollMonth",
                minAmount: "1",
                amount: "2",
                maxAmount: "3"
            },
            "post"
        )
        if (!forged.errors.includes("PERMISSION_DENIED")) problems.push(`HR's forged grade: ${forged.errors || "accepted"}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})
