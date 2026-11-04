// Manufacturing P2's methods (impl-manufacturing P2 "usable when"), as the demo method engineer and approver of Ziziwork
// Retail with artifact authorization enabled, through the calls the Manufacturing screens make: the access check, then the
// Mantle verb or the shared method screens' layer with the Manufacturing context. A routing from two operation templates, one
// with a published instruction; a BOM of DEMO_1_1 consuming at the second operation; the engineer's release refused and
// requested, the approver's release from Approvals; released lines kept and a change staged as a draft; where used with the
// kit read only; a CSV import of two versions with one bad unit; and the pages that show them.
// Run: ./moq test mr-boss --spec ManufacturingMethods
const lib = ec.resource.script("component://mr-boss/test/Manufacturing/ManufacturingSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page} = lib
const access = "ironstone.manufacturing.AccessServices.",
    methods = "ironstone.products.MethodServices.",
    S = "mantle.product.BomServices.",
    R = "mantle.work.RoutingServices."
const org = "ORG_ZIZI_RETAIL"
const find = (entity, conditions) =>
    Array.from(ec.entity.find(entity).condition(conditions).disableAuthz().list()).map(row => row.getMap())
// the shared method screens' calls, in the Manufacturing context
const shared = (service, parameters) => invoke(methods + service, Object.assign({appRoot: "Manufacturing"}, parameters))
// the screens' service calls inherit their screen's authorization: here artifact authorization is off and each service's own
// permission check refuses; the pages are rendered with it on
const as = (user, action) => asUser(user, action, false)
let built = {}
spec({
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "the engineer builds a routing from two templates, one with a published instruction, and a BOM consuming at its second operation",
    {
        when() {
            return as(users.method, () => {
                invoke(access + "check#Record", {recordType: "routing", recordId: ids.templateIds[0], capability: "methodEdit"})
                const published = invoke(R + "store#OperationInstruction", {
                    workEffortId: ids.templateIds[0],
                    contentText: "1. Seat the subassemblies.\n2. Fasten to torque.",
                    filename: "assemble.md",
                    changeReason: "Spec instruction"
                })
                const routing = invoke(R + "store#Routing", {
                    organizationPartyId: org,
                    workEffortName: "Spec line routing",
                    changeReason: "Spec routing"
                }).routing
                // Copy operations offers the templates (no parent) and other routings' operations, not this routing's own
                const sources = invoke(access + "get#Choices", {
                    choice: "operationSources",
                    workEffortId: routing.workEffortId
                }).options.map(row => row.value)
                const copied = shared("copy#RoutingOperations", {
                    workEffortId: routing.workEffortId,
                    sourceWorkEffortIds: ids.templateIds,
                    changeReason: "From the catalogue"
                })
                const engineerRelease = refusal(methods + "release#RoutingDraft", {
                    appRoot: "Manufacturing",
                    workEffortId: routing.workEffortId,
                    expectedRevision: copied.expectedRevision,
                    changeReason: "Refused"
                })
                const requested = shared("request#RoutingRelease", {workEffortId: routing.workEffortId, changeReason: "Ready"})
                built.routingId = routing.workEffortId
                built.operationIds = copied.copiedOperationIds
                return {published, sources, copied, engineerRelease, requested}
            })
        },
        then({published, sources, copied, engineerRelease, requested}) {
            ids.templateIds.every(id => sources.includes(id))
            // other specs publish on the demo template too (the shop floor fixture's), so this one's is the one in effect
            published.instructionRows.filter(row => !row.thruDate).length == 1
            published.instructionRows[0].workEffortContentId == published.workEffortContentId
            published.instructionRows[0].thruDate == null
            published.instructionRows[0].contentChecksum.length == 64
            copied.copiedOperationIds.length == 2
            copied.operationRows.length == 2
            engineerRelease.includes("approve authority")
            requested.notified == true
        }
    }
)
feature("the approver finds the request in Approvals and releases the routing, which reads it; then the engineer's BOM", {
    when() {
        const approvals = asUser(users.methodApprove, () => page("Approvals", {}, "html"))
        const releasedRouting = as(users.methodApprove, () => {
            const detail = shared("get#RoutingDetail", {workEffortId: built.routingId})
            return shared("release#RoutingDraft", {
                workEffortId: built.routingId,
                expectedRevision: detail.routingExpectedRevision,
                changeReason: "Spec routing released"
            })
        })
        const notices = find("moqui.security.user.NotificationMessage", {topic: "RoutingRelease", recordId: built.routingId})
        const unread = notices
            .flatMap(notice =>
                find("moqui.security.user.NotificationMessageUser", {notificationMessageId: notice.notificationMessageId})
            )
            .filter(row => !row.viewedDate)
        const bom = as(users.method, () => {
            const created = invoke(S + "store#Bom", {
                productId: ids.productId,
                organizationPartyId: org,
                methodCode: "SPEC_P2",
                bomName: "Spec line method",
                quantityUomId: "OTH_ea",
                routingWorkEffortId: built.routingId,
                changeReason: "Spec method"
            }).productBom
            const second = releasedRouting.releasedOperationRows[1].workEffortId
            shared("store#BomItem", {
                productBomId: created.productBomId,
                componentProductId: ids.componentId,
                quantity: 3,
                quantityUomId: "OTH_ea",
                operationWorkEffortId: second,
                changeReason: "Consumed at test and pack"
            })
            const requested = shared("request#BomRelease", {productBomId: created.productBomId, changeReason: "Ready"})
            return {productBomId: created.productBomId, second, requested}
        })
        built.productBomId = bom.productBomId
        const released = as(users.methodApprove, () => {
            const context = shared("get#MethodContext", {productBomId: bom.productBomId})
            return shared("release#BomDraft", {
                productBomId: bom.productBomId,
                expectedRevision: context.bomExpectedRevision,
                changeReason: "Spec method released"
            })
        })
        const line = find("mantle.product.bom.ProductBomItem", {productBomId: bom.productBomId})[0]
        return {approvals, releasedRouting, notices, unread, bom, released, line}
    },
    then({approvals, releasedRouting, notices, unread, bom, line}) {
        approvals.status == 200
        approvals.errors.length == 0
        approvals.output.includes("Spec line routing")
        releasedRouting.releasedOperationRows.length == 2
        notices.length == 1
        unread.length == 0
        bom.requested.notified == true
        line.state == "released"
        line.operationWorkEffortId == bom.second
    }
})
feature("released lines are kept: a change is a draft replacement that the next release stamps", {
    when() {
        const released = find("mantle.product.bom.ProductBomItem", {productBomId: built.productBomId, state: "released"})[0]
        const staged = as(users.method, () =>
            shared("store#BomItem", {
                productBomId: built.productBomId,
                bomItemId: released.bomItemId,
                componentProductId: ids.componentId,
                quantity: 5,
                quantityUomId: "OTH_ea",
                changeReason: "More material"
            })
        )
        const kept = find("mantle.product.bom.ProductBomItem", {bomItemId: released.bomItemId})[0]
        const approved = as(users.methodApprove, () => {
            const context = shared("get#MethodContext", {productBomId: built.productBomId})
            return shared("release#BomDraft", {
                productBomId: built.productBomId,
                expectedRevision: context.bomExpectedRevision,
                changeReason: "Second release"
            })
        })
        const ended = find("mantle.product.bom.ProductBomItem", {bomItemId: released.bomItemId})[0]
        return {released, staged, kept, ended}
    },
    then({released, staged, kept, ended}) {
        staged.bomItemId != released.bomItemId
        kept.quantity == 3
        kept.thruDate == null
        ended.thruDate != null
        find("mantle.product.bom.ProductBomItem", {bomItemId: staged.bomItemId})[0].replacesBomItemId == released.bomItemId
    }
})
feature("where used shows a component's methods, and DEMO_PA's kit read only with its Kit components link", {
    when() {
        return as(users.read, () => ({
            component: shared("get#BomWhereUsed", {productId: ids.componentId, organizationPartyId: org}),
            kit: shared("get#BomWhereUsed", {productId: ids.productId, organizationPartyId: org}),
            page: page("BillsOfMaterials/WhereUsed", {productId: ids.productId}, "html")
        }))
    },
    then({component, kit, page}) {
        component.whereUsedRows.some(row => row.productBomId === ids.methodId && !row.readOnly)
        kit.whereUsedRows.some(row => row.productId === ids.kitId && row.readOnly && row.kind === "Kit components")
        page.errors.length == 0
        // the kit's row is a link (to its Kit components pane, a "//Manufacturing" path this root-only render cannot resolve)
        page.output.includes(">" + ids.kitId + "</a>")
    }
})
feature("a CSV import of two versions with one bad unit applies the good one and names the other", {
    when() {
        const csv = [
            "productId,methodCode,baseUomId,componentProductId,quantity,quantityUomId",
            ids.productId + ",SPEC_CSV,OTH_ea,DEMO_SA_1,1,OTH_ea",
            ids.productId + ",SPEC_CSV,OTH_ea,DEMO_RM_1,2,OTH_ea",
            "DEMO_3_1,SPEC_CSV,OTH_ea,DEMO_RM_1,2,NOT_A_UNIT",
            ids.kitId + ",SPEC_CSV,OTH_ea,DEMO_1_1,1,OTH_ea"
        ].join("\n")
        return as(users.method, () =>
            invoke(S + "import#BomCsv", {organizationPartyId: org, csvText: csv, preview: false, changeReason: "Spec import"})
        )
    },
    then(out) {
        out.importedCount == 1
        out.failedCount == 1
        out.skippedCount == 1
        out.versionRows.find(row => row.productId === "DEMO_3_1").messages[0].includes("Line 4")
        find("mantle.product.bom.ProductBom", {productId: ids.productId, methodCode: "SPEC_CSV"}).length == 1
        find("mantle.product.bom.ProductBom", {productId: "DEMO_3_1", methodCode: "SPEC_CSV"}).length == 0
        find("mantle.product.bom.ProductBom", {productId: ids.kitId}).length == 0
    }
})
feature("the method pages render the demo method for the engineer with their actions, and for the reader without", {
    when() {
        const render = user =>
            asUser(user, () => ({
                list: page("BillsOfMaterials", {}, "qvt"),
                detail: page("BillsOfMaterials/BillOfMaterialsDetail", {productBomId: ids.methodId}, "qvt"),
                routing: page("Routings/RoutingDetail", {workEffortId: ids.routingId}, "qvt"),
                templates: page("Routings/OperationTemplates", {workEffortId: ids.templateIds[0]}, "qvt"),
                print: page("BillsOfMaterials/BillOfMaterialsDetail", {productBomId: ids.methodId}, "html-print")
            }))
        return {engineer: render(users.method), reader: render(users.read)}
    },
    then({engineer, reader}) {
        ;[engineer, reader].every(pages => Object.values(pages).every(found => found.status == 200 && !found.errors.length))
        engineer.list.output.includes("New BOM")
        !reader.list.output.includes("New BOM")
        engineer.detail.output.includes("Request release")
        !reader.detail.output.includes("Request release")
        engineer.routing.output.includes("Copy operations")
        !reader.routing.output.includes("Copy operations")
        engineer.templates.output.includes("Publish instruction")
        !reader.templates.output.includes("Publish instruction")
        reader.list.output.includes("Line A pilot assembly")
        reader.print.output.includes("Line A pilot assembly")
    }
})
