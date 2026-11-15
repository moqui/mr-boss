// The data of the Marketing golden walk (test/client/Marketing/MarketingSendWalk), set on the --serve server before the walk: Retail's
// promotional sending profile (BOSS_MKT_PROFILE_RETAIL) without its demo quiet hours (21:00 to 07:00 Chicago time), so the walk's send
// is delivered at whatever hour the suite runs. Under the quiet hours a delivery waits, untried, for their end (Mantle's
// SendingProfiles spec): the walk's "1 sent" would hold by day only (follow-up 7).
// Run: ./moq test mr-boss --spec MarketingClientFixtures
const PROFILE = "BOSS_MKT_PROFILE_RETAIL"

feature("the walk's Retail sending profile has no quiet hours, so its send is delivered at any hour", {
    when() {
        const wasDisabled = ec.artifactExecution.disableAuthz()
        try {
            const profile = ec.entity.find("mantle.party.MessageSendingProfile").condition("sendingProfileId", PROFILE).one()
            if (profile && (profile.quietFrom || profile.quietThru)) {
                profile.set("quietFrom", null)
                profile.set("quietThru", null)
                profile.update()
            }
            const after = ec.entity.find("mantle.party.MessageSendingProfile").condition("sendingProfileId", PROFILE).one()
            return {found: !!after, quietFrom: after?.quietFrom ?? null, quietThru: after?.quietThru ?? null}
        } finally {
            if (!wasDisabled) ec.artifactExecution.enableAuthz()
        }
    },
    then({found, quietFrom, quietThru}) {
        found
        quietFrom == null
        quietThru == null
    }
})
