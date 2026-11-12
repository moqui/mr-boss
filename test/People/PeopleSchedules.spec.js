// People's working schedules and holidays screens (impl-people P9; design-people §6 WorkingScheduleDetail, §7 HolidayCalendars):
// WorkingScheduleDetail's one html render as the HR officer (Retail's store week, its week, who follows it and a follower's
// capacity preview), HolidayCalendars' one html render (Retail's calendar and its holidays of 2027), the P9 choices each called once
// with a selected value off the page, and Projects' PersonDetail naming the People schedule as where a follower's hours come from
// (owner contract, design-projects §15). The rules are Mantle's PeopleSchedules; access is PeopleAccess's P9 feature.
// Run: ./moq test mr-boss --spec PeopleSchedules
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const choices = "ironstone.people.ContextServices.get#Choices"
// a spec-local employee of Retail who follows the store week from today
const follower = "PPL_SPEC_WS_PAT"
const state = {}

spec({
    setupSpec() {
        login("john.doe")
        system(() => {
            call("create#mantle.party.Party", {partyId: follower, partyTypeEnumId: "PtyPerson"})
            call("create#mantle.party.Person", {partyId: follower, firstName: "Pat", lastName: "Schedule"})
            state.employmentId = call("mantle.humanres.EmploymentServices.create#Employment", {
                fromPartyId: follower,
                toPartyId: ids.organizationId,
                fromDate: "2020-01-01 00:00:00"
            }).partyRelationshipId
        })
        state.assigned = asUser(users.hr, () =>
            system(() =>
                invoke("mantle.humanres.ScheduleServices.assign#Schedule", {
                    partyRelationshipId: state.employmentId,
                    workingScheduleId: ids.scheduleId,
                    fromDate: ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
                })
            )
        )
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("WorkingScheduleDetail shows the HR officer the store week, who follows it and a follower's capacity preview", {
    when() {
        const rendered = asUser(users.hr, () =>
            page("Time/WorkingScheduleDetail", {workingScheduleId: ids.scheduleId, previewPartyId: follower}, "html")
        )
        const problems = []
        if (rendered.status != 200 || rendered.errors.length) problems.push(`render: ${rendered.status} ${rendered.errors}`)
        for (const text of [
            "Store week",
            "America/Chicago",
            "Retail holidays",
            "Saturday",
            "Pat Schedule",
            "Assign",
            "Add working hours",
            "The working schedule"
        ])
            if (!rendered.output.includes(text)) problems.push(`no ${text}`)
        if (rendered.output.includes("Nobody follows this schedule")) problems.push("the follower is not listed")
        return {applied: state.assigned.applied, problems}
    },
    then({applied, problems}) {
        applied === true
        problems.join("\n") == ""
    }
})

feature("HolidayCalendars shows the HR officer Retail's calendar and its holidays of a year", {
    when() {
        const rendered = asUser(users.hr, () =>
            page("Time/HolidayCalendars", {holidayCategoryId: ids.holidayCalendarId, year: "2027"}, "html")
        )
        const problems = []
        if (rendered.status != 200 || rendered.errors.length) problems.push(`render: ${rendered.status} ${rendered.errors}`)
        for (const text of ["Retail holidays", "Stocktake closure", "Founders", "New calendar", "Add holiday"])
            if (!rendered.output.includes(text)) problems.push(`no ${text}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("the schedule choices answer the HR officer's employer, each with a selected value off the page; employments are HR's", {
    when() {
        const options = (user, choice, parameters) =>
            asUser(user, () => invoke(choices, Object.assign({appRoot: "People", choice}, parameters)).options || [])
        const labelOf = (list, value) => list.find(option => option.value === value)?.label || ""
        return {
            schedule: labelOf(
                options(users.hr, "workingSchedules", {
                    organizationPartyId: ids.organizationId,
                    term: "zzz",
                    selected: ids.scheduleId
                }),
                ids.scheduleId
            ),
            otherSchedules: options(users.hr, "workingSchedules", {organizationPartyId: ids.otherOrganizationId}).length,
            calendar: labelOf(
                options(users.hr, "holidayCalendars", {
                    organizationPartyId: ids.organizationId,
                    term: "zzz",
                    selected: ids.holidayCalendarId
                }),
                ids.holidayCalendarId
            ),
            zones: options(users.hr, "timeZones", {term: "chicago", selected: "Asia/Tokyo"})
                .map(option => option.value)
                .join(","),
            employment: labelOf(
                options(users.hr, "employments", {
                    organizationPartyId: ids.organizationId,
                    term: "zzz",
                    selected: state.employmentId
                }),
                state.employmentId
            ),
            readerEmployments: options(users.reader, "employments", {organizationPartyId: ids.organizationId}).length
        }
    },
    then(out) {
        out.schedule === "Store week (America/Chicago)"
        out.otherSchedules === 0
        out.calendar === "Retail holidays"
        out.zones === "America/Chicago,Asia/Tokyo"
        out.employment === "Pat Schedule"
        out.readerEmployments === 0
    }
})

feature("Projects' PersonDetail says a follower's hours come from their People working schedule", {
    when() {
        const overview = system(() =>
            invoke("ironstone.projects.ResourceServices.get#PersonOverview", {partyId: follower, weeks: 2})
        ).overview
        return {sourceText: overview?.sourceText}
    },
    then({sourceText}) {
        sourceText === "Their working schedule (People)"
    }
})
