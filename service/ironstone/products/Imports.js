// Each exported screen operation receives a fresh routing scope.
function scopeFor(parameters) {
    const requestedRoot = parameters.appRoot || "Products"
    // The catalog import's result notice. The wizard's mapping and read projections are ironstone.shared.DataImportServices'
    // (impl-admin P15); import work is performed by the native domain services.
    const S = "mantle.product.ProductImportServices.",
        call = (n, p = {}) => {
            const r =
                ec.service
                    .sync()
                    .name(n)
                    .parameters(Object.assign({appRoot: requestedRoot}, p))
                    .disableAuthz()
                    .call() || {}
            if (ec.message.hasError()) throw new Error(ec.message.getErrorsString())
            return r
        }
    function access(p) {
        const a = call("ironstone.products.CatalogServices.get#SharedContext", {appRoot: p.appRoot})
        if (!a.capabilities.read) throw new Error("Catalog read access is required")
        return a
    }
    function notice(p) {
        access(p)
        if (!p.attemptedCount) return {sent: false}
        const imported = call(S + "get#CatalogImport", {operationKey: p.operationKey}),
            key =
                "import-notice-" +
                ec.user
                    .singleUseCodeHash(
                        p.operationKey +
                            "|" +
                            p.inputFingerprint +
                            "|" +
                            imported.appliedCount +
                            "|" +
                            imported.errorCount +
                            "|" +
                            p.changedRows
                    )
                    .slice(0, 24)
        if (ec.entity.find("mantle.product.ProductCatalogOperation").condition("operationKey", key).disableAuthz().one())
            return {sent: false}
        const title = imported.errorCount ? "Catalog import needs attention" : "Catalog import completed",
            nm = ec
                .makeNotificationMessage()
                .topic("CatalogImportResult")
                .userId(ec.user.userId)
                .message({
                    title,
                    operationKey: p.operationKey,
                    filename: imported.filename,
                    appliedCount: imported.appliedCount,
                    errorCount: imported.errorCount
                })
                .link("/qapps/Products/ProductImport?operationKey=" + encodeURIComponent(p.operationKey))
        if (nm.appName) nm.appName("Products")
        if (nm.actorUserId) nm.actorUserId(ec.user.userId)
        nm.send()
        call("create#mantle.product.ProductCatalogOperation", {
            operationKey: key,
            operationType: "import-notice",
            ownerPartyId: imported.organizationPartyId,
            submittedByUserId: ec.user.userId,
            submittedDate: ec.user.nowTimestamp,
            requestJson: JSON.stringify({
                operationKey: p.operationKey,
                appliedCount: imported.appliedCount,
                errorCount: imported.errorCount
            })
        })
        return {sent: true}
    }
    return {notice}
}
;({notice: p => scopeFor(p).notice(p)})
