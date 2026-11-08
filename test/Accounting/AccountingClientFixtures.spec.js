// Browser fixtures persist in the disposable --serve database after server specs finish.
// The browser walks need no external DNS: every style sheet of the default theme is served from this server.
spec({
    setupSpec() {
        login("john.doe")
    }
})
feature("Accounting browser fixtures use local theme resources without an external font dependency", {
    when() {
        const disabled = ec.artifactExecution.disableAuthz()
        try {
            const styles = Array.from(
                ec.entity
                    .find("moqui.screen.ScreenThemeResource")
                    .condition({screenThemeId: "DEFAULT_QUASAR", resourceTypeEnumId: "STRT_STYLESHEET"})
                    .list()
            )
                .map(item => String(item.resourceValue || ""))
                .filter(value => value)
            return {styles, remote: styles.filter(value => /^(https?:)?\/\//.test(value))}
        } finally {
            if (!disabled) ec.artifactExecution.enableAuthz()
        }
    },
    then({styles, remote}) {
        remote.length === 0
        styles.includes("/libs/quasar/quasar.prod.css")
        styles.includes("/libs/material-symbols/outlined.css")
        styles.includes("/libs/material-icons/material-icons.css")
    }
})
