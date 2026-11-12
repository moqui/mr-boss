// People P18's "usable when" (impl-people P18; design-people §10 SkillsMatrix and Qualifications, §14.3 "Qualifications and
// reviews", its first half), as an acceptance walk with artifact authorization on: Tomas (people.employee), a sales associate whose
// job class needs first aid proved by a first aid certificate, submits his certificate through Qualifications (as a self-service
// employee opens it, by the area's own grant), attaching nothing it does not need; it waits, and the skills matrix still shows his
// gap; the learning administrator (people.develop) verifies it from Qualifications, and the matrix shows the gap closed; then a
// staffing reader sees valid or expiring and nothing else: his manager (people.manager) reads the certificate's kind and validity
// without its number or issuer, and the staffing check (check#Qualifications, as the directory reader asks it) answers qualified
// for the class with no number, issuer, title or file. The rules themselves are Mantle's Qualifications and mr-boss's PeopleSkills.
// Run: ./moq accept mr-boss --spec PeopleSkillsUsable
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const webroot = "component://webroot/screen/webroot.xml"
const qualificationsPath = "apps/People/Development/Qualifications/"
const matrixPath = "apps/People/Development/SkillsMatrix/"
// a request under the web root as the user (a transition's post, a page), its JSON when it answers one
function request(user, path, parameters, method) {
    return asUser(user, () => {
        const result = ec.screen
            .makeTest()
            .rootScreen(webroot)
            .render(path, parameters || {}, method || null)
        const errors = Array.from(result.errorMessages || []).join(" | ")
        ec.message.clearAll()
        let json = null
        try {
            json = JSON.parse(String(result.output || ""))
        } catch (error) {
            json = null
        }
        return {status: result.status, output: String(result.output || ""), json, errors}
    })
}
const read = (user, service, parameters) => asUser(user, () => system(() => invoke(service, parameters)))
const matrixCell = user => {
    const matrix = request(user, matrixPath + "matrix", {
        organizationPartyId: ids.organizationId,
        emplPositionClassId: ids.jobClassId
    }).json?.matrix
    return matrix?.rows
        ?.find(row => row.partyId === ids.employeePartyId)
        ?.cells.find(cell => cell.skillTypeEnumId === ids.firstAidSkillId)
}
const state = {}

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        state.expiry = ec.l10n.format(new Date(Date.now() + 2 * 365 * 86400000), "yyyy-MM-dd", null, "America/Chicago")
    }
})

feature("Tomas submits his first aid certificate from Qualifications; it waits and his gap stays", {
    when() {
        const opened = asUser(users.employee, () => page("Development/Qualifications", {show: "mine"}))
        const submitted = request(
            users.employee,
            qualificationsPath + "storeQualification",
            {
                qualificationTypeEnumId: ids.firstAidTypeId,
                title: "Emergency first aid at work",
                issuerName: "St John Ambulance",
                referenceNumber: "SJA-77031",
                fromDate: ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd", null, "America/Chicago"),
                thruDate: state.expiry
            },
            "post"
        )
        const mine = read(users.employee, "mantle.humanres.DevelopmentServices.find#Qualifications", {mine: true}).qualifications
        state.certificate = mine.find(row => row.qualificationTypeEnumId === ids.firstAidTypeId)
        return {opened, submitted, certificate: state.certificate, cell: matrixCell(users.develop)}
    },
    then({opened, submitted, certificate, cell}) {
        opened.status == 200 && opened.errors.length == 0 && opened.output.includes("Add qualification")
        submitted.status == 302 && submitted.errors == ""
        certificate.verificationStatusId == "QlVerPending" &&
            certificate.referenceNumber == "SJA-77031" &&
            certificate.canReadFiles
        cell.state == "gap" && cell.stateText == "Gap · Waiting for verification"
    }
})

feature("the learning administrator verifies it from Qualifications, and the matrix shows the gap closed", {
    when() {
        const waiting = asUser(users.develop, () => page("Development/Qualifications", {show: "all", state: "waiting"}))
        const own = request(
            users.employee,
            qualificationsPath + "verifyQualification",
            {
                partyQualificationId: state.certificate.partyQualificationId,
                decision: "verify",
                expectedRevision: state.certificate.revision
            },
            "post"
        )
        const verified = request(
            users.develop,
            qualificationsPath + "verifyQualification",
            {
                partyQualificationId: state.certificate.partyQualificationId,
                decision: "verify",
                expectedRevision: state.certificate.revision
            },
            "post"
        )
        return {waiting, own, verified, cell: matrixCell(users.develop)}
    },
    then({waiting, own, verified, cell}) {
        waiting.status == 200 && waiting.output.includes("Tomas Lindqvist") && waiting.output.includes("Verify")
        own.errors.includes("SELF_APPROVAL")
        verified.status == 302 && verified.errors == ""
        cell.state == "met" && cell.qualificationState == "qualified"
    }
})

feature("a staffing reader sees valid or expiring and nothing else", {
    when() {
        const managerRows = read(users.manager, "mantle.humanres.DevelopmentServices.find#Qualifications", {
            partyId: ids.employeePartyId
        }).qualifications
        const check = read(users.reader, "mantle.humanres.DevelopmentServices.check#Qualifications", {
            partyId: ids.employeePartyId,
            emplPositionClassId: ids.jobClassId
        })
        const managerPage = asUser(users.manager, () => page("Development/Qualifications", {show: "all"}, "html"))
        return {managerRows, check, managerPage}
    },
    then({managerRows, check, managerPage}) {
        const row = managerRows.find(found => found.partyQualificationId === state.certificate.partyQualificationId)
        row.validity == "valid" && row.verificationText == "Verified"
        row.referenceNumber === undefined && row.issuerName === undefined && row.title === undefined
        managerPage.status == 200 && managerPage.output.includes("First aid certificate")
        !managerPage.output.includes("SJA-77031") && !managerPage.output.includes("St John Ambulance")
        const firstAid = check.results[0].requirements.find(requirement => requirement.skillTypeEnumId === ids.firstAidSkillId)
        firstAid.state == "qualified" && firstAid.validThruText.length >= 10
        const answer = JSON.stringify(check)
        !answer.includes("SJA-77031") && !answer.includes("St John Ambulance") && !answer.includes("Emergency first aid")
    }
})
