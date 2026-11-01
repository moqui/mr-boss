// Warehouse inspections (impl-warehouse P8; design-warehouse §5, design-crosscut §3.19): through QualityInspection's
// transitions an inspector records readings and submits, cannot verify, and a quality manager verifies, releases part and
// scraps the rest; Inspections lists the open ones; Today and Home show the inspections assigned to the inspector; a change
// to a published characteristic on InspectionTemplates starts a new row. The Mantle rules are mr-mantle's WarehouseQuality
// spec. Fixture stock of BOSS_WH_P8_ITEM quarantined at ZIRET_WH's 0901, made on the fresh database moqui test gives; its
// inspection and stock ledger stay (dispositions post once).
const lib = ec.resource.script("component://mr-boss/test/WarehouseSpecLib.js")
const {asUser, invoke, page} = lib
const productId = "BOSS_WH_P8_ITEM"
const one = (entity, conditions) => ec.entity.find(entity).condition(conditions).disableAuthz().one()
const rows = (entity, conditions) => Array.from(ec.entity.find(entity).condition(conditions).disableAuthz().list())
const n = value => (value == null ? 0 : Number(String(value)))
const state = {}

function withAuthzOff(action) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try {
        return action()
    } finally {
        if (!wasDisabled) ec.artifactExecution.enableAuthz()
    }
}
function call(name, parameters) {
    return ec.service.sync().name(name).parameters(parameters).call() || {}
}
// a screen transition as the client posts it, with its errors
function post(path, parameters) {
    return page(path, parameters, "qvt").errors.join(" | ")
}
const detail = "QualityInspection"
const inspection = () => one("mantle.product.quality.QualityInspection", {qualityInspectionId: state.inspectionId})

spec({
    setupSpec() {
        withAuthzOff(() => {
            call("create#mantle.product.Product", {
                productId,
                productName: "P8 inspection fixture",
                productTypeEnumId: "PtAsset",
                assetTypeEnumId: "AstTpInventory",
                ownerPartyId: "ORG_ZIZI_RETAIL",
                amountUomId: "OTH_ea"
            })
            const received = call("mantle.product.AssetServices.receive#Asset", {
                productId,
                facilityId: "ZIRET_WH",
                locationSeqId: "0901",
                quantity: 6,
                ownerPartyId: "ORG_ZIZI_RETAIL",
                statusId: "AstQuarantine"
            })
            state.assetId = received.assetId
        })
        // the inspector's own Mantle call (a Warehouse group reaches no Mantle service directly with authorization on, F3)
        state.inspectionId = asUser(
            "warehouse.inspect",
            () =>
                invoke("mantle.product.QualityServices.create#Inspection", {
                    assetId: state.assetId,
                    inspectionTemplateId: "BOSS_WH_TMPL",
                    inspectorPartyId: "BOSS_WH_INSPECT"
                }),
            false
        ).qualityInspectionId
    }
})

feature("an inspector records readings and submits through QualityInspection, and Inspections lists it", {
    when() {
        return asUser("warehouse.inspect", () => {
            const listed = page("Inspection/Inspections", {}, "html")
            const early = post(detail + "/submitInspection", {
                qualityInspectionId: state.inspectionId,
                quantityAccepted: 4,
                quantityRejected: 2,
                resultReason: "Too thick"
            })
            const readings = [
                post(detail + "/saveReading", {
                    qualityInspectionId: state.inspectionId,
                    inspectionTemplateItemId: "BOSS_WH_TMPL_1",
                    sampleNumber: 1,
                    numericValue: 50
                }),
                post(detail + "/saveReading", {
                    qualityInspectionId: state.inspectionId,
                    inspectionTemplateItemId: "BOSS_WH_TMPL_1",
                    sampleNumber: 2,
                    numericValue: 72
                }),
                post(detail + "/saveReading", {
                    qualityInspectionId: state.inspectionId,
                    inspectionTemplateItemId: "BOSS_WH_TMPL_2",
                    sampleNumber: 1,
                    passIndicator: "Y"
                })
            ]
            const submitted = post(detail + "/submitInspection", {
                qualityInspectionId: state.inspectionId,
                quantityAccepted: 4,
                quantityRejected: 2,
                resultReason: "Too thick"
            })
            const shown = page(detail, {qualityInspectionId: state.inspectionId}, "html")
            return {listed, early, readings, submitted, shown}
        })
    },
    then({listed, early, readings, submitted, shown}) {
        listed.errors == []
        listed.output.includes(state.inspectionId)
        early.includes("READINGS_REQUIRED")
        readings == ["", "", ""]
        submitted == ""
        inspection().statusId == "QiSubmitted"
        inspection().resultEnumId == "QirPartial"
        rows("mantle.product.quality.InspectionReading", {qualityInspectionId: state.inspectionId}).some(
            row => row.passIndicator == "N"
        )
        shown.output.includes("Partly accepted")
        !shown.output.includes("Record reading")
    }
})

feature("an inspector cannot verify; the quality manager verifies, releases part and scraps the rest", {
    when() {
        const inspectorVerify = asUser("warehouse.inspect", () =>
            post(detail + "/verifyInspection", {qualityInspectionId: state.inspectionId})
        )
        return asUser("warehouse.quality", () => {
            const verified = post(detail + "/verifyInspection", {qualityInspectionId: state.inspectionId, approve: "true"})
            const released = post(detail + "/disposeInspection", {
                qualityInspectionId: state.inspectionId,
                operationKey: "p8-spec-release",
                dispositionEnumId: "QdRelease",
                quantity: 4
            })
            const scrapped = post(detail + "/disposeInspection", {
                qualityInspectionId: state.inspectionId,
                operationKey: "p8-spec-scrap",
                dispositionEnumId: "QdScrap",
                quantity: 2,
                toLocationSeqId: "0991"
            })
            const certificate = page("InspectionCertificate", {qualityInspectionId: state.inspectionId}, "html")
            return {inspectorVerify, verified, released, scrapped, certificate}
        })
    },
    then({inspectorVerify, verified, released, scrapped, certificate}) {
        inspectorVerify.includes("PERMISSION_DENIED")
        verified == ""
        released == ""
        scrapped == ""
        inspection().statusId == "QiDisposed"
        n(inspection().heldQuantity) == 0
        rows("mantle.product.asset.Asset", {productId, statusId: "AstAvailable"}).reduce(
            (sum, row) => sum + n(row.quantityOnHandTotal),
            0
        ) == 4
        rows("mantle.product.quality.QualityInspectionDisposition", {qualityInspectionId: state.inspectionId}).length == 2
        certificate.errors == []
        certificate.output.includes("Release")
        certificate.output.includes("Scrap")
    }
})

feature("Today and Home show the inspections assigned to the inspector", {
    when() {
        return asUser("warehouse.inspect", () => ({
            today: Array.from(invoke("ironstone.warehouse.HomeServices.get#TodayItems", {}).items || []),
            home: invoke("ironstone.warehouse.HomeServices.get#Home", {appRoot: "Warehouse", facilityId: "ZIRET_WH"})
        }))
    },
    then({today, home}) {
        today.some(item => item.kind == "warehouseInspection" && String(item.url).includes("BOSS_WH_INSP"))
        Array.from(home.queueRows).some(row => row.operation == "inspection" && row.readyCount >= 1)
        Array.from(home.workRows).some(row => String(row.url).includes("BOSS_WH_INSP"))
    }
})

feature("a change to a published characteristic on InspectionTemplates starts a new row", {
    when() {
        return asUser("warehouse.quality", () => {
            const created = post("Inspection/InspectionTemplates/storeTemplate", {
                templateName: "P8 spec template",
                organizationPartyId: "ORG_ZIZI_RETAIL",
                inspectionContextEnumId: "QicOutgoing",
                productId,
                samplePolicyEnumId: "QspAll"
            })
            const templateId = rows("mantle.product.quality.InspectionTemplate", {templateName: "P8 spec template"})[0]
                ?.inspectionTemplateId
            const added = post("Inspection/InspectionTemplates/storeTemplate", {
                inspectionTemplateId: templateId,
                characteristicName: "Weight",
                readingTypeEnumId: "QrtNumeric",
                lowerLimit: 1,
                upperLimit: 2
            })
            const published = post("Inspection/InspectionTemplates/storeTemplate", {
                inspectionTemplateId: templateId,
                templateAction: "publish"
            })
            const item = rows("mantle.product.quality.InspectionTemplateItem", {inspectionTemplateId: templateId})[0]
            const changed = post("Inspection/InspectionTemplates/storeTemplate", {
                inspectionTemplateId: templateId,
                inspectionTemplateItemId: item.inspectionTemplateItemId,
                characteristicName: "Weight",
                readingTypeEnumId: "QrtNumeric",
                lowerLimit: 1,
                upperLimit: 3,
                changeReason: "Heavier packaging"
            })
            const shown = page("Inspection/InspectionTemplates", {inspectionTemplateId: templateId}, "html")
            // the user works for Retail and its Returns Center child: New template's organization offers both
            const organizations = Array.from(
                invoke("ironstone.warehouse.InspectionServices.get#InspectionChoices", {choice: "organizations"}).options
            ).map(option => option.value)
            return {created, added, published, changed, templateId, shown, organizations}
        })
    },
    then({created, added, published, changed, templateId, shown, organizations}) {
        organizations.includes("ORG_ZIZI_RETAIL") && organizations.includes("BOSS_WH_RETURNS")
        created == ""
        added == ""
        published == ""
        changed == ""
        rows("mantle.product.quality.InspectionTemplateItem", {inspectionTemplateId: templateId}).length == 2
        rows("mantle.product.quality.InspectionTemplateItem", {inspectionTemplateId: templateId}).filter(row => row.thruDate)
            .length == 1
        shown.errors == []
        shown.output.includes("Heavier packaging")
    }
})
