// The data BOSS's security proofs (test/proofs, moqui test-client mr-boss --proofs) need beyond the demo data, made on the
// --serve server before them: two BOSS users of Commons whose state the proofs change, and a published calendar link with a
// password. boss.pw.proof's password (V6Authentication 6.2.2 changes it) and boss.factor.proof's password and second
// factors (V7SessionManagement 7.4.3 adds and removes one) are set again on every run, their failed sign-ins cleared, so a
// database kept between runs takes the proofs again. These users are not demo data, so no production load reaches them.
// For a server it did not start, run it on that server's database: moqui test mr-boss --spec ProofFixtures --db existing
const USERS = [
    { userId: "BOSS_PW_PROOF", username: "boss.pw.proof", password: "BossPwProof1!!", firstName: "Password", lastName: "Proof" },
    { userId: "BOSS_FACTOR_PROOF", username: "boss.factor.proof", password: "BossFactorProof1!!", firstName: "Factor", lastName: "Proof" },
]
// the published calendar link the masking proofs open (V6Authentication 6.2.6, 6.2.7): john.doe's demo Family calendar,
// published view-only with a password, under a token the proofs know
const CALENDAR = "BOSS_DEMO_CAL_FAMILY"
const CALENDAR_TOKEN = "BossProofCalendarLink000000000000000"

const find = (entityName, conditions) => ec.entity.find(entityName).condition(conditions).disableAuthz()
const make = (entityName, fields) => {
    const row = ec.entity.makeValue(entityName)
    row.setFields(fields, true, null, null)
    row.create()
}
// in a transaction of its own, as the framework's ClientFixtures resets an account: it commits whatever the caller does
const updateAccount = (parameters) => {
    ec.message.clearErrors()
    const out = ec.service.sync().name("update#moqui.security.UserAccount").parameters(parameters)
        .disableAuthz().requireNewTransaction(true).call()
    if (ec.message.hasError() || out == null) throw new Error(`update#UserAccount failed: ${ec.message.getErrorsString()}`)
}

spec({
    setupSpec() {
        login("john.doe")
        ec.artifactExecution.disableAuthz()
    },
    cleanupSpec() {
        ec.artifactExecution.enableAuthz()
    },
})

feature("the proofs' Commons users have their passwords and no second factor; the Family calendar has a password link", {
    when() {
        for (const user of USERS) {
            if (!find("mantle.party.Party", { partyId: user.userId }).one()) {
                make("mantle.party.Party", { partyId: user.userId, partyTypeEnumId: "PtyPerson" })
                make("mantle.party.Person", { partyId: user.userId, firstName: user.firstName, lastName: user.lastName })
            }
            if (!find("moqui.security.UserAccount", { userId: user.userId }).one()) {
                make("moqui.security.UserAccount", { userId: user.userId, username: user.username, partyId: user.userId,
                    userFullName: `${user.firstName} ${user.lastName}`, emailAddress: `${user.username}@example.com` })
            }
            if (!find("moqui.security.UserGroupMember", { userGroupId: "BOSS_USERS", userId: user.userId }).one())
                make("moqui.security.UserGroupMember", { userGroupId: "BOSS_USERS", userId: user.userId, fromDate: 0 })
            updateAccount({ userId: user.userId, currentPassword: ec.user.hashPassword(user.password), passwordSalt: "",
                passwordHashType: "argon2", passwordBase64: "N", requirePasswordChange: "N", disabled: "N",
                successiveFailedLogins: 0, disabledDateTime: null })
            // the codes sent from a factor first, then the factors
            const factors = find("moqui.security.UserAuthcFactor", { userId: user.userId })
            for (const row of Array.from(factors.list()).filter((row) => row.fromFactorId)) row.delete()
            factors.deleteAll()
        }
        call("mantle.work.CalendarServices.share#Calendar", { calendarId: CALENDAR, publish: true, permissionEnumId: "CalpView", password: "family" })
        const link = Array.from(find("mantle.work.calendar.CalendarShare", { calendarId: CALENDAR }).list())
            .find((row) => row.publishToken && row.thruDate == null)
        if (link && link.publishToken !== CALENDAR_TOKEN) {
            find("mantle.work.calendar.CalendarShare", { publishToken: CALENDAR_TOKEN }).deleteAll()
            link.publishToken = CALENDAR_TOKEN
            link.update()
        }
        return {
            users: USERS.map((user) => find("moqui.security.UserAccount", { userId: user.userId }).one()),
            factors: USERS.map((user) => Array.from(find("moqui.security.UserAuthcFactor", { userId: user.userId }).list()).length),
            calendar: call("ironstone.commons.CalendarServices.check#PublishedCalendarToken", { token: CALENDAR_TOKEN, routeName: "cal" }),
        }
    },
    then({ users, factors, calendar }) {
        users.every((user) => user != null && user.disabled == "N" && user.successiveFailedLogins == 0)
        factors.every((count) => count == 0)
        calendar.valid
        calendar.routeContext.needsPassword
    },
})
