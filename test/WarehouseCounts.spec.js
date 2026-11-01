// Warehouse counts (impl-warehouse P10; design-warehouse §7, §13 HandheldCount, §14 CountVariance, StockPolicies'
// CountSchedule): a counter plans, starts and enters a blind count through the screens' transitions and never sees an
// expected quantity, a reviewer reviews it, an adjuster posts it, and CountVariance shows it to the reviewer only; the Due
// find lists the demo schedule's pick bins; Request a count on Assets plans a count of the selected stock; Home counts
// the queue and the assignee's work, which Today lists too; a manager adds a count schedule row. The Mantle rules are
// mr-mantle's WarehouseCounts spec. Fixture stock of BOSS_WH_P10_ITEM at ZIRET_WH's bin 01020303, made on the fresh
// database moqui test gives; its counts and stock ledger stay (they are immutable once posted).
const lib = ec.resource.script("component://mr-boss/test/WarehouseSpecLib.js")
const {asUser, invoke, page} = lib
const productId = "BOSS_WH_P10_ITEM"
const bin = "01020303"
const one = (entity, conditions) => ec.entity.find(entity).condition(conditions).disableAuthz().one()
const rows = (entity, conditions) => Array.from(ec.entity.find(entity).condition(conditions).disableAuthz().list())
const n = value => (value == null ? 0 : Number(String(value)))
// the count the scenario's features share, in order
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
const counts = () => rows("mantle.product.asset.PhysicalInventory", {facilityId: "ZIRET_WH", scopeLocationSeqId: bin})

spec({
    setupSpec() {
        withAuthzOff(() => {
            call("create#mantle.product.Product", {
                productId,
                productName: "P10 count fixture",
                productTypeEnumId: "PtAsset",
                assetTypeEnumId: "AstTpInventory",
                ownerPartyId: "ORG_ZIZI_RETAIL",
                amountUomId: "OTH_ea"
            })
            call("create#mantle.facility.FacilityLocation", {
                facilityId: "ZIRET_WH",
                locationSeqId: bin,
                locationTypeEnumId: "FltBulk"
            })
            call("create#mantle.product.asset.Asset", {
                assetId: "BOSS_WH_P10_A",
                assetTypeEnumId: "AstTpInventory",
                statusId: "AstAvailable",
                productId,
                facilityId: "ZIRET_WH",
                locationSeqId: bin,
                ownerPartyId: "ORG_ZIZI_RETAIL",
                hasQuantity: "Y",
                quantityOnHandTotal: 0,
                availableToPromiseTotal: 0,
                acquireCost: 4,
                acquireCostUomId: "USD",
                receivedDate: "2026-09-01 00:00:00"
            })
            call("create#mantle.product.asset.AssetDetail", {
                assetId: "BOSS_WH_P10_A",
                productId,
                effectiveDate: "2026-09-01 00:00:00",
                quantityOnHandDiff: 12,
                availableToPromiseDiff: 12
            })
        })
    }
})

feature("a counter plans and starts a blind count of a bin and enters it without an expected quantity", {
    when() {
        return asUser("warehouse.count", () => {
            const created = post("Counts/Counts/createCount", {
                facilityId: "ZIRET_WH",
                scopeLocationSeqId: bin,
                countModeEnumId: "CntModeSpot",
                blindIndicator: "Y",
                assigneePartyId: "BOSS_WH_COUNT"
            })
            state.count = counts()[0]?.physicalInventoryId
            const started = post("Counts/CountDetail/startCount", {physicalInventoryId: state.count})
            const entry = page("Counts/CountEntry", {physicalInventoryId: state.count}, "html")
            const handheld = page("Handheld/Count", {physicalInventoryId: state.count}, "html")
            state.line = one("mantle.product.asset.PhysicalInventoryCount", {physicalInventoryId: state.count})
            const recorded = post("Counts/CountEntry/recordCount", {
                physicalInventoryId: state.count,
                physicalInventoryCountId: state.line.physicalInventoryCountId,
                quantity: "11",
                operationKey: "p10-spec-record-1"
            })
            const detail = page("Counts/CountDetail", {physicalInventoryId: state.count}, "html")
            const submitted = post("Counts/CountDetail/submitCount", {physicalInventoryId: state.count})
            return {created, started, entry, handheld, recorded, detail, submitted}
        })
    },
    then({created, started, entry, handheld, recorded, detail, submitted}) {
        created == ""
        state.count != null
        started == ""
        entry.errors == []
        entry.output.includes("P10 count fixture")
        !entry.output.includes("Expected")
        handheld.errors == []
        handheld.output.includes("Save and next")
        recorded == ""
        n(
            one("mantle.product.asset.PhysicalInventoryCount", {physicalInventoryCountId: state.line.physicalInventoryCountId})
                .quantityOnHand
        ) == 11
        detail.output.includes("1 of 1 lines counted")
        !detail.output.includes("Expected")
        submitted == ""
        // entering a count changed no stock
        n(one("mantle.product.asset.Asset", {assetId: "BOSS_WH_P10_A"}).quantityOnHandTotal) == 12
    }
})

feature("a reviewer reviews the count and sees its variance; an adjuster posts it; CountVariance is the reviewer's", {
    when() {
        const reviewed = asUser("warehouse.countreview", () =>
            post("Counts/CountReview/reviewCount", {physicalInventoryId: state.count})
        )
        const review = asUser("warehouse.countreview", () =>
            page("Counts/CountReview", {physicalInventoryId: state.count}, "html")
        )
        const reviewVersion = one("mantle.product.asset.PhysicalInventory", {physicalInventoryId: state.count}).reviewVersion
        const counterReview = asUser("warehouse.count", () =>
            post("Counts/CountReview/reviewCount", {physicalInventoryId: state.count})
        )
        const postParameters = {physicalInventoryId: state.count, operationKey: "p10-spec-post-1", reviewVersion}
        const posted = asUser("warehouse.adjust", () => post("Counts/CountReview/postCount", postParameters))
        const again = asUser("warehouse.adjust", () => post("Counts/CountReview/postCount", postParameters))
        return {
            reviewed,
            review,
            counterReview,
            posted,
            again,
            variance: asUser("warehouse.countreview", () =>
                page("Reports/CountVariance", {physicalInventoryId: state.count}, "html")
            ),
            counterVariance: asUser("warehouse.count", () => page("Reports/CountVariance", {}, "html")),
            details: rows("mantle.product.asset.AssetDetail", {assetId: "BOSS_WH_P10_A", physicalInventoryId: state.count}),
            count: one("mantle.product.asset.PhysicalInventory", {physicalInventoryId: state.count}),
            location: one("mantle.facility.FacilityLocation", {facilityId: "ZIRET_WH", locationSeqId: bin})
        }
    },
    then({reviewed, review, counterReview, posted, again, variance, counterVariance, details, count, location}) {
        reviewed == ""
        review.errors == []
        review.output.includes("Approved")
        // the reviewer of a submitted blind count gets its snapshot, which the counter never did
        review.output.includes("Snapshot")
        counterReview.includes("PERMISSION_DENIED")
        posted == ""
        again == ""
        // the retry posted nothing more: one variance of -1
        details.length == 1
        n(details[0].quantityOnHandDiff) == -1
        n(one("mantle.product.asset.Asset", {assetId: "BOSS_WH_P10_A"}).quantityOnHandTotal) == 11
        count.statusId == "PIComplete"
        location.lastCountDate != null
        variance.output.includes(state.count)
        counterVariance.output.includes("for count reviewers and adjusters")
    }
})

feature("the Due find lists the demo schedule's pick bins, and Home counts the queue and the assignee's work", {
    when() {
        return asUser("warehouse.count", () => ({
            due: page("Counts/Counts", {view: "due", facilityId: "ZIRET_WH"}, "html"),
            dueRows: Array.from(
                invoke("ironstone.warehouse.CountServices.get#CountList", {facilityId: "ZIRET_WH", view: "due"}).dueRows
            ),
            home: invoke("ironstone.warehouse.HomeServices.get#Home", {facilityId: "ZIRET_WH"}),
            today: invoke("ironstone.warehouse.HomeServices.get#TodayItems", {}).items
        }))
    },
    then({due, dueRows, home, today}) {
        due.errors == []
        due.output.includes("Count every few days")
        dueRows.some(row => row.kind == "periodic" && row.locationSeqId == "01020301")
        home.queueRows.find(row => row.operation == "counts").readyCount >= 1
        home.workRows.some(row => row.title.includes("BOSS_WH_COUNT"))
        today.some(item => item.kind == "warehouseCount" && item.url.includes("BOSS_WH_COUNT"))
    }
})

feature("Request a count on Assets plans a count of the selected stock; a manager adds a count schedule row", {
    when() {
        const before = rows("mantle.product.asset.PhysicalInventory", {countSourceEnumId: "CntSrcRequest"}).length
        const requested = asUser("warehouse.count", () =>
            post("Inventory/Assets/requestCount", {assetIdList: ["BOSS_WH_P10_A"], plannedDate: "2026-12-01"})
        )
        const readerRequest = asUser("warehouse.read", () => {
            const message = post("Inventory/Assets/requestCount", {assetIdList: ["BOSS_WH_P10_A"]})
            return message
        })
        const after = rows("mantle.product.asset.PhysicalInventory", {countSourceEnumId: "CntSrcRequest"}).length
        const stored = asUser("warehouse.manager", () =>
            post("Settings/StockPolicies/CountSchedule/storeCountSchedule", {
                facilityId: "BOSS_WH_EAST",
                scheduleKindEnumId: "CskPeriodic",
                frequencyDays: "14",
                locationTypeEnumId: "FltPick",
                countModeEnumId: "CntModeCycle",
                changeReason: "P10 spec"
            })
        )
        const counterStore = asUser("warehouse.count", () =>
            post("Settings/StockPolicies/CountSchedule/storeCountSchedule", {
                facilityId: "BOSS_WH_EAST",
                scheduleKindEnumId: "CskPeriodic",
                frequencyDays: "7",
                changeReason: "P10 spec"
            })
        )
        const tab = asUser("warehouse.manager", () =>
            page("Settings/StockPolicies/CountSchedule", {facilityId: "BOSS_WH_EAST", lastStandalone: "true"}, "html")
        )
        return {before, after, requested, readerRequest, stored, counterStore, tab}
    },
    then({before, after, requested, readerRequest, stored, counterStore, tab}) {
        requested == ""
        after == before + 1
        // a reader's selection is not requested: each asset is named, and no count is made
        readerRequest == ""
        stored == ""
        counterStore.includes("PERMISSION_DENIED")
        tab.errors == []
        tab.output.includes("Every 14 days")
    }
})

feature("a post dated in ORG_ZIZI_RETAIL's closed June 2024 is refused whole, and posts when dated now", {
    when() {
        const asCounter = action => asUser("warehouse.count", action)
        const physicalInventoryId = asCounter(() => {
            post("Counts/Counts/createCount", {facilityId: "ZIRET_WH", scopeLocationSeqId: bin, countModeEnumId: "CntModeSpot"})
            return counts()
                .filter(row => row.statusId === "PIInPlanning")
                .map(row => row.physicalInventoryId)[0]
        })
        asCounter(() => post("Counts/CountDetail/startCount", {physicalInventoryId}))
        const line = one("mantle.product.asset.PhysicalInventoryCount", {physicalInventoryId})
        asCounter(() =>
            post("Counts/CountEntry/recordCount", {
                physicalInventoryId,
                physicalInventoryCountId: line.physicalInventoryCountId,
                quantity: "10",
                operationKey: "p10-spec-record-period"
            })
        )
        asCounter(() => post("Counts/CountDetail/submitCount", {physicalInventoryId}))
        asUser("warehouse.countreview", () => post("Counts/CountReview/reviewCount", {physicalInventoryId}))
        const before = one("mantle.product.asset.PhysicalInventory", {physicalInventoryId})
        const reviewVersion = before.reviewVersion
        const closed = asUser("warehouse.adjust", () =>
            post("Counts/CountReview/postCount", {
                physicalInventoryId,
                reviewVersion,
                operationKey: "p10-spec-post-closed",
                effectiveDate: "2024-06-15 12:00:00"
            })
        )
        const afterClosed = {
            dateKept: String(one("mantle.product.asset.PhysicalInventory", {physicalInventoryId}).physicalInventoryDate) ===
                String(before.physicalInventoryDate),
            line: one("mantle.product.asset.PhysicalInventoryCount", {physicalInventoryCountId: line.physicalInventoryCountId}),
            quantity: n(one("mantle.product.asset.Asset", {assetId: "BOSS_WH_P10_A"}).quantityOnHandTotal),
            details: rows("mantle.product.asset.AssetDetail", {assetId: "BOSS_WH_P10_A", physicalInventoryId}).length
        }
        const open = asUser("warehouse.adjust", () =>
            post("Counts/CountReview/postCount", {physicalInventoryId, reviewVersion, operationKey: "p10-spec-post-open"})
        )
        return {
            closed,
            afterClosed,
            open,
            count: one("mantle.product.asset.PhysicalInventory", {physicalInventoryId}),
            quantity: n(one("mantle.product.asset.Asset", {assetId: "BOSS_WH_P10_A"}).quantityOnHandTotal)
        }
    },
    then({closed, afterClosed, open, count, quantity}) {
        // the whole post is refused before anything is written: the count keeps its date, the line stays approved
        closed.includes("PERIOD_CLOSED")
        afterClosed.dateKept
        afterClosed.line.statusId == "PicApproved"
        afterClosed.quantity == 11
        afterClosed.details == 0
        open == ""
        count.statusId == "PIComplete"
        quantity == 10
    }
})

feature("the count scan names no quantity, and an immediate posting is not a count", {
    when() {
        const immediate = withAuthzOff(
            () =>
                call("create#mantle.product.asset.PhysicalInventory", {statusId: "PIComplete", facilityId: "ZIRET_WH"})
                    .physicalInventoryId
        )
        return asUser("warehouse.count", () => ({
            countScan: Array.from(
                invoke("ironstone.warehouse.CountServices.resolve#CountScan", {
                    facilityId: "ZIRET_WH",
                    scanText: "BOSS_WH_P10_A",
                    allowedTypes: ["asset"]
                }).matches
            ),
            scan: Array.from(
                invoke("ironstone.warehouse.AccessServices.resolve#Scan", {
                    facilityId: "ZIRET_WH",
                    scanText: "BOSS_WH_P10_A",
                    allowedTypes: ["asset"]
                }).matches
            ),
            immediate: lib.refusal("ironstone.warehouse.AccessServices.check#Record", {recordType: "count", recordId: immediate})
        }))
    },
    then({countScan, scan, immediate}) {
        countScan.length == 1
        !countScan[0].detail.includes("On hand")
        countScan[0].detail.includes("at 01020303")
        // the general scan names the quantity, which the count screen's leaves out
        scan[0].detail.includes("On hand")
        immediate.includes("RECORD_UNAVAILABLE")
    }
})

feature("the count quick create plans a count for the count group, and the reader and count reviewer cannot open it (P18)", {
    when() {
        const before = rows("mantle.product.asset.PhysicalInventory", {facilityId: "ZIRET_WH", scopeLocationSeqId: "0901"})
        const counter = asUser("warehouse.count", () => page("NewCount", {}, "html"))
        const created = asUser("warehouse.count", () =>
            post("NewCount/createCount", {facilityId: "ZIRET_WH", countModeEnumId: "CntModeSpot",
                scopeLocationSeqId: "0901"}))
        const after = rows("mantle.product.asset.PhysicalInventory", {facilityId: "ZIRET_WH", scopeLocationSeqId: "0901"})
        return {
            counter,
            created,
            planned: after.length - before.length,
            reader: asUser("warehouse.read", () => page("NewCount", {}, "html")),
            reviewer: asUser("warehouse.countreview", () => page("NewCount", {}, "html"))
        }
    },
    then({counter, created, planned, reader, reviewer}) {
        counter.errors == []
        counter.output.includes("Plan a count")
        counter.output.includes("Plan count")
        created == ""
        planned == 1
        !reader.output.includes("Plan count")
        !reviewer.output.includes("Plan count")
    }
})
