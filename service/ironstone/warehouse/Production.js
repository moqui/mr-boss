// MaterialIssueReceipt's production run source (impl-warehouse P16, design-manufacturing MaterialIssueReceipt, crosscut
// §3.9): the run as Mantle's mantle.work.ProductionServices.get#ProductionOrder reads it (PRODUCTION_VIEW or STOCK_ISSUE;
// a run of the user's Warehouse facilities, check#Record's run kind), shaped for the shared screen: the source (title,
// caption, state, links, words), the material lines with the stock to issue from, the output lines, the issuances with
// what is left to return, the output's tracking (serials, lots, status, inspection) and the movements; values only with
// financial read. The postings are Mantle's guards (issue#ProductionMaterial, return#UnusedMaterial,
// receive#ProductionOutput), which runAction names for the screen's materialAction transition after check#Record of the
// run with issue. This module is Packing.js sources' productionRun entry.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const warehouse = ec.resource.script("component://mr-boss/service/ironstone/warehouse/Warehouse.js")
const {find, one, rows, call, denied} = lib

const released = ["WeApproved", "WeInProgress"]
const closed = ["WeClosed", "WeCancelled"]
const number = value => (value == null || value === "" ? 0 : Number(String(value)))
const quantityText = value => ec.l10n.format(number(value), "#,##0.###")
const optionLimit = 20

function namesOf(entity, field, nameField, values) {
    const ids = [...new Set(values.filter(Boolean))]
    if (!ids.length) return new Map()
    return new Map(Array.from(find(entity).condition(field, "in", ids).list()).map(row => [row[field], row[nameField]]))
}
// The stock a material line may be issued from: the run owner's available stock of the product in the user's facilities.
function stockOptions(userScope, productId, ownerPartyId) {
    let query = find("mantle.product.asset.Asset", {productId, ownerPartyId, statusId: "AstAvailable"}).condition(
        "availableToPromiseTotal",
        "greater",
        0
    )
    const facilityIds = warehouse.facilityIds(userScope)
    if (facilityIds) query = query.condition("facilityId", "in", facilityIds.length ? facilityIds : ["_NA_"])
    return Array.from(query.orderBy("receivedDate").orderBy("assetId").limit(optionLimit).list()).map(asset => ({
        value: asset.assetId,
        label:
            [asset.assetId, asset.facilityId + (asset.locationSeqId ? " " + asset.locationSeqId : ""), asset.lotId]
                .filter(Boolean)
                .join(" · ") +
            " — free " +
            quantityText(asset.availableToPromiseTotal)
    }))
}

function runSource(p) {
    const userScope = warehouse.required(warehouse.scope())
    warehouse.recordOf(userScope, "run", p.sourceId)
    const order = call("mantle.work.ProductionServices.get#ProductionOrder", {workEffortId: p.sourceId})
    const run = order.run
    const lines = Array.from(order.lines || [])
    const financial = !!userScope.capabilities.financialRead && !!order.financialRead
    const canIssue = !!userScope.capabilities.issue
    const isReleased = released.includes(run.statusId)
    const operations = new Map(
        Array.from(order.operations || []).map(op => [op.workEffortId, op.workEffortName || op.workEffortId])
    )
    const names = namesOf(
        "mantle.product.Product",
        "productId",
        "productName",
        Array.from(order.issuances || [])
            .map(row => row.productId)
            .concat(Array.from(order.receipts || []).map(row => row.productId))
    )
    const statuses = namesOf(
        "moqui.basic.StatusItem",
        "statusId",
        "description",
        [run.statusId].concat(Array.from(order.receipts || []).map(row => row.statusId))
    )
    const money = (value, currency) =>
        financial && value != null ? ec.l10n.formatCurrency(number(value), currency || null) : null
    const facility = run.facilityId ? one("mantle.facility.Facility", {facilityId: run.facilityId}) : null
    const materialRows = lines
        .filter(line => line.lineRoleEnumId === "PrlrMaterial")
        .map(line => {
            const left = number(line.remaining)
            const canAct = canIssue && isReleased && left > 0
            return {
                lineKey: line.productionRunLineId,
                lineTitle: line.productName,
                productName: line.productName,
                assemblyName: operations.get(line.operationWorkEffortId) || "",
                required: number(line.stockQuantity),
                issued: number(line.issued),
                returned: number(line.returned),
                left,
                canAct,
                assetOptions: canAct ? stockOptions(userScope, line.productId, run.ownerPartyId) : []
            }
        })
    const outputRows = lines
        .filter(line => line.lineRoleEnumId !== "PrlrMaterial")
        .map(line => ({
            lineKey: line.productionRunLineId,
            productName: line.productName,
            roleText: line.lineRoleEnumId === "PrlrOutput" ? "Output" : "By-product",
            required: number(line.stockQuantity),
            received: number(line.received),
            left: number(line.remaining),
            canReceive: canIssue && isReleased && number(line.remaining) > 0
        }))
    const returnRows = Array.from(order.issuances || [])
        .filter(row => number(row.returnable) > 0)
        .map(row => ({
            assetIssuanceId: row.assetIssuanceId,
            productName: names.get(row.productId) || row.productId,
            assetId: row.assetId,
            lotId: row.lotId || "",
            operationName: operations.get(row.operationWorkEffortId) || "",
            issued: number(row.quantity),
            returnable: number(row.returnable),
            canReturn: canIssue && !closed.includes(run.statusId)
        }))
    const outputs = Array.from(order.receipts || []).filter(row => row.kind === "output")
    const inspections = new Map(
        outputs.map(row => {
            const inspection = Array.from(
                find("mantle.product.quality.QualityInspection", {assetReceiptId: row.assetReceiptId}).limit(1).list()
            )[0]
            return [row.assetReceiptId, inspection?.qualityInspectionId || null]
        })
    )
    const trackingRows = outputs.map(row => ({
        assetId: row.assetId,
        productName: names.get(row.productId) || row.productId,
        serialNumber: row.serialNumber || "",
        lotId: row.lotId || "",
        quantity: number(row.quantity),
        statusText: statuses.get(row.statusId) || row.statusId || "",
        qualityInspectionId: inspections.get(row.assetReceiptId),
        costText: row.costProvisional ? "Provisional" : "Standard"
    }))
    const movementRows = Array.from(order.issuances || [])
        .map(row => ({
            kind: "Issue",
            productName: names.get(row.productId) || row.productId,
            assetId: row.assetId,
            lotId: row.lotId || "",
            quantity: number(row.quantity),
            dateText: row.issuedDate ? lib.bookDay(null, row.issuedDate) : "",
            valueText: money(row.value)
        }))
        .concat(
            Array.from(order.receipts || []).map(row => ({
                kind: row.kind === "output" ? (row.costProvisional ? "Output (provisional cost)" : "Output") : "Unused return",
                productName: names.get(row.productId) || row.productId,
                assetId: row.assetId,
                lotId: row.lotId || "",
                quantity: number(row.quantity),
                dateText: row.receivedDate ? lib.bookDay(null, row.receivedDate) : "",
                valueText: money(row.value)
            }))
        )
    // the subcontract dispatches of the run or its operations (P15) link to their SubcontractShipmentDetail
    const workIds = [run.workEffortId].concat(Array.from(order.operations || []).map(op => op.workEffortId))
    const dispatches = Array.from(
        find("mantle.shipment.Shipment").condition("subcontractWorkEffortId", "in", workIds).limit(5).list()
    ).map(row => row.shipmentId)
    const links = [
        {
            text: "Stage stock",
            path: "Transfers/Move",
            icon: "sym_o_move_down",
            primary: false,
            parameters: {workEffortId: run.workEffortId}
        }
    ].concat(
        dispatches.map(shipmentId => ({
            text: "Subcontract " + shipmentId,
            path: "Transfers/SubcontractShipmentDetail",
            icon: "sym_o_local_shipping",
            primary: false,
            parameters: {shipmentId}
        }))
    )
    const standardText =
        run.productStandardCostId == null
            ? "No approved standard: output is received at the issued cost, provisional"
            : financial && run.standardUnitCost != null
              ? "Frozen standard " +
                run.productStandardCostId +
                ": " +
                money(run.standardUnitCost, run.standardCurrencyUomId) +
                " a unit"
              : "Frozen standard " + run.productStandardCostId
    return {
        found: true,
        sourceType: "productionRun",
        source: {
            sourceId: run.workEffortId,
            title: "Production run " + run.workEffortId,
            caption:
                [
                    run.workEffortName,
                    facility?.facilityName || run.facilityId,
                    run.revision == null ? null : "revision " + run.revision
                ]
                    .filter(Boolean)
                    .join(" · ") + (run.releaseDate ? " · released " + lib.dateText(run.releaseDate) : ""),
            statusText: statuses.get(run.statusId) || run.statusId,
            detailText: standardText,
            emptyText: "This run has no material lines.",
            actionText: "Issue",
            submitText: "Issue component",
            actionField: "asset",
            words: {
                groupTitle: "Operation",
                doneTitle: "Issued",
                historyTitle: "Posted issues and receipts",
                historyEmpty: "Nothing is issued to this run yet."
            },
            links
        },
        materialRows,
        outputRows,
        returnRows,
        trackingRows,
        movementRows,
        filesRecordId: run.workEffortId,
        financialRead: financial,
        canPack: false,
        packageOptions: [],
        activePackageSeqId: null
    }
}
// A posting of the run: issue a component to its line, return part of an issuance, or receive output, each through its
// Mantle guard after check#Record of the run with issue; the guard checks everything again.
function runAction(p) {
    const kind = p.actionKind || "issue"
    const base = {recordType: "run", recordId: p.sourceId, capability: "issue"}
    if (kind === "return")
        return Object.assign(base, {
            serviceName: "mantle.work.ProductionServices.return#UnusedMaterial",
            parameters: {
                operationKey: p.operationKey,
                assetIssuanceId: p.lineKey,
                quantity: p.quantity,
                toLocationSeqId: p.toLocationSeqId || null,
                toFacilityId: p.toFacilityId || null
            },
            doneText: "Returned " + p.quantity + " of issuance " + p.lineKey
        })
    if (kind === "receive")
        return Object.assign(base, {
            serviceName: "mantle.work.ProductionServices.receive#ProductionOutput",
            parameters: {
                operationKey: p.operationKey,
                workEffortId: p.sourceId,
                productionRunLineId: p.lineKey,
                quantity: p.quantity,
                toLocationSeqId: p.toLocationSeqId || null,
                firstSerialNumber: p.firstSerialNumber || null,
                lotNumber: p.lotNumber || null
            },
            doneText: "Received " + p.quantity + " of output"
        })
    if (kind !== "issue") denied("ACTION_INVALID", "Choose issue, return or receive")
    return Object.assign(base, {
        serviceName: "mantle.work.ProductionServices.issue#ProductionMaterial",
        parameters: {
            operationKey: p.operationKey,
            workEffortId: p.sourceId,
            productionRunLineId: p.lineKey,
            assetId: p.assetId,
            quantity: p.quantity
        },
        doneText: "Issued " + p.quantity + " from " + p.assetId
    })
}

// SubcontractShipmentDetail's Output receipt pane (P16): the dispatch's run and its output line, what the vendor sent
// back and the service accepted, the stock of the run's components still at the vendor facility, and whether this user
// may receive the output (issue, the run released, something left). No cost is shown.
function subcontractOutput(userScope, shipment, run, vendorFacilityId) {
    if (!run) return null
    const lines = rows("mantle.work.production.ProductionRunLine", {workEffortId: run.workEffortId})
    const output = lines.find(line => line.lineRoleEnumId === "PrlrOutput")
    if (!output) return {hasLines: false, runId: run.workEffortId}
    const received = rows("mantle.product.receipt.AssetReceipt", {productionOutputLineId: output.productionRunLineId}).reduce(
        (sum, row) => sum + number(row.quantityAccepted),
        0
    )
    const accepted = shipment.subcontractOrderId
        ? rows("mantle.order.purchase.ServiceAcceptance", {
              orderId: shipment.subcontractOrderId,
              orderItemSeqId: shipment.subcontractOrderItemSeqId
          }).reduce((sum, row) => sum + number(row.acceptedQuantity), 0)
        : 0
    const item = shipment.subcontractOrderId
        ? one("mantle.order.OrderItem", {
              orderId: shipment.subcontractOrderId,
              orderItemSeqId: shipment.subcontractOrderItemSeqId
          })
        : null
    const product = one("mantle.product.Product", {productId: output.productId})
    const materials = lines.filter(line => line.lineRoleEnumId === "PrlrMaterial")
    const atVendor = materials.map(line => {
        const held = Array.from(
            find("mantle.product.asset.Asset", {
                facilityId: vendorFacilityId,
                productId: line.productId,
                ownerPartyId: run.ownerPartyId,
                statusId: "AstAvailable"
            }).list()
        ).reduce((sum, asset) => sum + number(asset.availableToPromiseTotal), 0)
        const name = one("mantle.product.Product", {productId: line.productId})?.productName || line.productId
        return name + " " + quantityText(held) + " of " + quantityText(line.stockQuantity)
    })
    const left = Math.max(0, number(output.stockQuantity) - received)
    const facility = run.facilityId ? one("mantle.facility.Facility", {facilityId: run.facilityId}) : null
    return {
        hasLines: true,
        runId: run.workEffortId,
        productName: product?.productName || output.productId,
        planned: number(output.stockQuantity),
        received,
        left,
        acceptedText: item ? quantityText(accepted) + " of " + quantityText(item.quantity) + " accepted" : "",
        materialText: atVendor.length ? "At the vendor: " + atVendor.join("; ") : "",
        destinationName: facility?.facilityName || run.facilityId || "",
        canReceive:
            !!userScope.capabilities.issue &&
            released.includes(run.statusId) &&
            left > 0 &&
            warehouse.inScope(userScope, facility),
        locations: facility
            ? Array.from(
                  find("mantle.facility.FacilityLocation", {facilityId: facility.facilityId}).orderBy("locationSeqId").list()
              )
                  .filter(row => row.thruDate == null || lib.ms(row.thruDate) > lib.ms(ec.user.nowTimestamp))
                  .slice(0, 100)
                  .map(row => ({
                      key: row.locationSeqId,
                      text: row.locationSeqId + (row.description ? " · " + row.description : "")
                  }))
            : []
    }
}

;({runSource, runAction, subcontractOutput})
