// The users of the acceptance walk VaultPersonal (test/acceptance/client/Commons): vault.ana, vault.ben and vault.cal, each with a
// password and one single-use code as a second factor, so that a REST sign-in with the code is a strong one, which a personal vault
// key needs (mr-moqui plans/Vault-Instances.md §9; made as mr-moqui's framework test/ClientFixtures.spec.js makes sec.vault.*). The
// code is consumed by each sign-in, so it and the account are set again on every run. Not demo data: no production load reaches
// them. Run with the acceptance client suite (./moq accept mr-boss).
const USERS = [
    ["vault.ana", "VaultAna1!!", "BOSS_VAULT_ANA", "70319001"],
    ["vault.ben", "VaultBen1!!", "BOSS_VAULT_BEN", "70319002"],
    ["vault.cal", "VaultCal1!!", "BOSS_VAULT_CAL", "70319003"]
]

const one = (entity, fields) => ec.entity.find(entity).condition(fields).one()
function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try {
        return run()
    } finally {
        if (!wasDisabled) ec.artifactExecution.enableAuthz()
    }
}

spec({
    setupSpec() {
        sys(() => {
            for (const [username, password, factorId, code] of USERS) {
                const existing = one("moqui.security.UserAccount", {username})
                const userId = existing != null ? existing.userId : call("org.moqui.impl.UserServices.create#UserAccount",
                    {username, newPassword: password, newPasswordVerify: password, userFullName: username}).userId
                const account = one("moqui.security.UserAccount", {userId})
                account.setFields({currentPassword: ec.user.hashPassword(password), passwordHashType: "argon2", passwordSalt: "", passwordBase64: "N",
                    requirePasswordChange: "N", disabled: "N", successiveFailedLogins: 0, disabledDateTime: null}, true, null, null)
                account.update()
                const factor = one("moqui.security.UserAuthcFactor", {factorId}) || ec.entity.makeValue("moqui.security.UserAuthcFactor")
                factor.setFields({factorId, userId, factorTypeEnumId: "UafSingleUse", factorOption: ec.user.singleUseCodeHash(code), fromDate: ec.user.nowTimestamp,
                    thruDate: null, needsValidation: "N"}, true, null, null)
                factor.createOrUpdate()
            }
        })
    }
})

feature("the vault walk's users sign in with a password and a code", {
    when() {
        const rows = sys(() => USERS.map(([username, , factorId]) => {
            const account = one("moqui.security.UserAccount", {username})
            return {account, factor: one("moqui.security.UserAuthcFactor", {factorId})}
        }))
        return {rows}
    },
    then({rows}) {
        rows.length == 3
        rows.every((row) => row.account != null && row.account.disabled == "N")
        rows.every((row) => row.factor != null && row.factor.thruDate == null && row.factor.userId == row.account.userId)
    }
})
