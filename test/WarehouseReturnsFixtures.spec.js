// The returns walk's fixture (impl-warehouse P14, F321): Retail settles its returns through Accounting, so the demo RMA is
// received through receive#ReturnItems. The demo leaves the flag off, since Mantle's own return flows run on Retail; the
// client suite loads this spec before its walks.
const lib = ec.resource.script("component://mr-boss/test/WarehouseSpecLib.js")

feature("Retail settles returns through Accounting for the returns walk", {
    when() {
        lib.returnSettlement("Y")
        return {after: lib.returnSettlement("Y")}
    },
    then({after}) {
        after == "Y"
    }
})
