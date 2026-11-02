// The Warehouse transfer and stock request reads (impl-warehouse P15): Transfers lists the demo transfer and subcontract
// dispatch with their kinds and two-leg progress, the custody at supplier filter keeps the vendor-custody dispatch and the
// stock its supplier holds; a transfer's detail offers each end's actions only to the capability that may take them; a stock
// request's detail shows Mantle's progress and approval only for the stock policy capability; Home counts the transfers to
// send. The postings are mr-mantle's WarehouseTransfers spec; scope and forged records are WarehouseAccess's.
const lib = ec.resource.script("component://mr-boss/test/Warehouse/WarehouseSpecLib.js")
const {ids, asUser, invoke} = lib
const transfers = "ironstone.warehouse.TransferServices."

feature("Transfers lists the transfer and the subcontract dispatch, and custody at supplier keeps the dispatch and its stock", {
    when() {
        return asUser("warehouse.read", () => ({
            all: Array.from(invoke(transfers + "get#Transfers", {pageSize: 100}).transferRows),
            custody: invoke(transfers + "get#Transfers", {custody: "Y", pageSize: 100})
        }))
    },
    then({all, custody}) {
        all.find(row => row.shipmentId === ids.transferShipmentId).kind == "transfer"
        all.find(row => row.shipmentId === ids.transferShipmentId).detailScreen == "TransferShipmentDetail"
        all.find(row => row.shipmentId === "BOSS_WH_SHIP_SUB").kind == "dispatch"
        all.find(row => row.shipmentId === "BOSS_WH_SHIP_SUB").detailScreen == "SubcontractShipmentDetail"
        all.find(row => row.shipmentId === ids.transferShipmentId).shipText == "Sent 0 of 6"
        Array.from(custody.transferRows).map(row => row.shipmentId) == ["BOSS_WH_SHIP_SUB"]
        Array.from(custody.custodyRows).some(row => row.assetId === "BOSS_WH_VENDOR_STOCK" && row.custodianName.includes("Ziddleman"))
    }
})
feature("a transfer's detail offers sending to the issue group and the move by dispatch to the move group only", {
    when() {
        const detail = user => asUser(user, () => invoke(transfers + "get#TransferDetail", {shipmentId: ids.transferShipmentId}))
        return {
            reader: detail("warehouse.read").transfer,
            issuer: detail("warehouse.issue"),
            subcontract: asUser("warehouse.move", () => invoke(transfers + "get#TransferDetail", {shipmentId: "BOSS_WH_SHIP_SUB"})),
            outbound: asUser("warehouse.read", () => invoke(transfers + "get#TransferDetail", {shipmentId: ids.shipmentId}))
        }
    },
    then({reader, issuer, subcontract, outbound}) {
        !reader.canIssue && !reader.canShip && !reader.canReceive && !reader.canDispatch
        // the value at the transfer account only with financial read, which no Warehouse group holds
        !reader.financialRead && reader.transferAccountText == null
        issuer.transfer.canIssue && !issuer.transfer.canReceive
        issuer.lineRows[0].stockOptions.some(option => option.key === "BOSS_WH_TRF_STOCK")
        !issuer.transfer.canDispatch
        subcontract.transfer.canDispatch && subcontract.transfer.subcontract
        subcontract.transfer.serviceText == "BOSS_WH_SUB_PO:01"
        subcontract.destinationLocations.some(option => option.key === "V0101")
        outbound.transferFound == false
    }
})
feature("a stock request's detail shows its progress, approval for the stock policy capability only, and Home its transfers", {
    when() {
        const detail = user => asUser(user, () => invoke(transfers + "get#StockRequestDetail", {requestId: "BOSS_WH_REQ"}))
        return {
            mover: detail("warehouse.move"),
            planner: detail("warehouse.planner"),
            home: asUser("warehouse.read", () => Array.from(invoke("ironstone.warehouse.HomeServices.get#Home",
                {facilityId: ids.facilityId}).queueRows).find(row => row.operation === "transfers"))
        }
    },
    then({mover, planner, home}) {
        mover.requestFound
        mover.itemRows[0].requested == "4" && mover.itemRows[0].approved == "0"
        !mover.stockRequest.canApprove && !mover.stockRequest.canAllocate
        planner.stockRequest.canApprove
        mover.fromFacilities.some(option => option.key === ids.facilityId)
        home.readyCount >= 2
        home.waitingCount == 0
    }
})
