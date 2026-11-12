// Maintenance P10's "usable when" (impl-maintenance P10; design-maintenance §3 PurchaseLinks and CompleteWork, design-purchasing
// "Maintenance purchases"), as an acceptance walk through the screens' transitions with artifact authorization on: maint.planner
// requests a motor rewind from a work order's Purchasing tab; Purchasing approves it and sources it to a purchase order (a buyer
// and approver of Ziziwork Services made here, as the demo has none); the work order's Purchasing tab and OrderDetail under
// Maintenance show the purchase order line, and Purchasing's RequestDetail the originating work order; the technician adds a
// photo of the rewound motor; at completion the supervisor accepts the service with the technician's photo, recorded once, under
// Purchasing's own check (accept#ServiceItem), which the demo's maint.supervisor passes as a member of Warehouse's receiving group
// (STOCK_RECEIVE alone, no Warehouse screen: the lead's decision, Nov 12, P10 review R1); no order line is completed by the work's
// status. The rules are Mantle's MaintenancePurchases and BOSS's MaintenancePurchasing and MaintenanceAccess.
// Run: ./moq accept mr-boss --spec MaintenancePurchaseWalk
const lib = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const state = {}
const prefix = "MNT_PUR_WALK"
const since = "2000-01-01T00:00:00Z"
let keySeq = 0
const key = name => name + "-" + Date.now() + "-" + ++keySeq

// A transition posted as the user under an app root: its status, its errors and where it sent the user.
function post(user, root, path, parameters) {
    return asUser(user, () => {
        const result = ec.screen
            .makeTest()
            .rootScreen("component://mr-boss/screen/" + root + ".xml")
            .render(path, parameters, "post")
        const errors = Array.from(result.errorMessages || [])
        ec.message.clearErrors()
        return {status: result.status, errors, output: String(result.output || "")}
    })
}
// a Mantle service as the user, with the artifact check aside (Purchasing's own steps, which are not this walk's screens)
const as = (user, service, parameters) =>
    asUser(user, () => {
        ec.artifactExecution.disableAuthz()
        return invoke(service, parameters)
    })
const rows = (entity, conditions) => system(() => Array.from(ec.entity.find(entity).condition(conditions).list()))
// a user of a walk-local group with the permissions, an agent of Ziziwork Services
function buyingUser(kind, permissions) {
    const id = prefix + "_" + kind
    system(() => {
        invoke("create#moqui.security.UserGroup", {userGroupId: id, description: "Purchase walk " + kind})
        for (const permission of permissions)
            invoke("create#moqui.security.UserGroupPermission", {userGroupId: id, userPermissionId: permission, fromDate: since})
        invoke("create#mantle.party.Party", {partyId: id, partyTypeEnumId: "PtyPerson"})
        invoke("create#mantle.party.Person", {partyId: id, firstName: "Purchase walk", lastName: kind})
        invoke("create#mantle.party.PartyRelationship", {
            relationshipTypeEnumId: "PrtAgent",
            fromPartyId: id,
            toPartyId: ids.organizationId,
            toRoleTypeId: "OrgInternal",
            fromDate: since
        })
        invoke("create#moqui.security.UserAccount", {
            userId: id,
            username: id,
            partyId: id,
            currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
            passwordHashType: "SHA"
        })
        invoke("create#moqui.security.UserGroupMember", {userId: id, userGroupId: id, fromDate: since})
    })
    return id
}

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        state.buyer = buyingUser("BUYER", ["PURCHASE_ORDER_EDIT", "SUPPLIER_PRICE_VIEW"])
        state.approver = buyingUser("APPROVER", ["PURCHASE_APPROVE"])
        // a corrective work order on the compressor's motor, started by maint.tech
        const created = as(users.planner, "mantle.work.MaintenanceServices.create#MaintenanceWorkOrder", {
            assetId: ids.motorId,
            workEffortName: "Motor windings burnt (walk)",
            estimatedCompletionDate: new Date(Date.now() + 7 * 864e5)
        })
        state.work = created.workEffortId
        as(users.planner, "mantle.work.MaintenanceServices.schedule#MaintenanceWorkOrder", {
            workEffortId: state.work,
            assigneePartyIds: [ids.techPartyId]
        })
        as(users.tech, "mantle.work.MaintenanceServices.transition#MaintenanceWorkOrder", {
            workEffortId: state.work,
            action: "start"
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("the planner requests a motor rewind from the work order's Purchasing tab", {
    when() {
        const requested = post(users.planner, "Maintenance", "WorkOrders/WorkOrderDetail/Purchasing/requestPurchase", {
            workEffortId: state.work,
            operationKey: key("walk-rewind"),
            requestName: "Rewind the motor",
            productId: "BOSS_MNT_PRD_REWIND",
            quantity: "1"
        })
        const links = rows("mantle.request.RequestWorkEffort", {workEffortId: state.work})
        state.requestId = links[0]?.requestId
        return {requested, links}
    },
    then({requested, links}) {
        requested.errors.length == 0
        links.length == 1
        rows("mantle.request.Request", {requestId: state.requestId})[0].requestTypeEnumId == "RqtPurchase"
        rows("mantle.request.Request", {requestId: state.requestId})[0].statusId == "ReqSubmitted"
    }
})

feature(
    "Purchasing approves and sources it; the work order, OrderDetail under Maintenance and Purchasing's RequestDetail show it",
    {
        when() {
            const R = "mantle.request.RequestServices."
            as(state.approver, R + "decide#PurchaseRequestApproval", {requestId: state.requestId})
            as(state.buyer, R + "store#PurchaseRequestItem", {
                requestId: state.requestId,
                requestItemSeqId: "01",
                supplierPartyId: "BOSS_MNT_SUP_REWIND"
            })
            const sourced = as(state.buyer, R + "convert#PurchaseSourcing", {
                requestItemKeys: [state.requestId + ":01"],
                operationKey: key("walk-src")
            })
            const line = rows("mantle.request.RequestItemOrder", {requestId: state.requestId})[0] || {}
            state.orderId = line.orderId
            state.orderItemSeqId = line.orderItemSeqId
            const tab = asUser(users.planner, () =>
                page("WorkOrders/WorkOrderDetail/Purchasing", {workEffortId: state.work, lastStandalone: "true"})
            )
            const order = asUser(users.planner, () => page("WorkOrders/OrderDetail", {orderId: state.orderId}))
            const purchasing = asUser("purchasing.services", () =>
                page("Requests/RequestDetail", {requestId: state.requestId}, "qvt", "Purchasing")
            )
            return {sourced, tab, order, purchasing}
        },
        then({sourced, tab, order, purchasing}) {
            sourced.createdCount == 1
            !!state.orderId
            tab.errors.length == 0
            tab.output.includes(state.orderId + ":" + state.orderItemSeqId)
            tab.output.includes("Delta Motor Rewinds")
            order.errors.length == 0
            order.output.includes(state.work)
            purchasing.output.includes("From work order")
            purchasing.output.includes(state.work)
            rows("mantle.order.OrderItemWorkEffort", {orderId: state.orderId}).length == 0
        }
    }
)

feature("at completion the supervisor accepts the service with the technician's photo, once; no order line completes", {
    when() {
        state.photo = system(
            () =>
                invoke("create#mantle.work.effort.WorkEffortContent", {
                    workEffortId: state.work,
                    contentLocation: "dbresource://mantle/work/" + state.work + "/rewound-motor.jpg",
                    description: "Rewound motor back on its base",
                    userId: "BOSS_MNT_TECH"
                }).workEffortContentId
        )
        const revision = system(
            () =>
                ec.entity.find("mantle.work.maintenance.MaintenanceWorkOrder").condition("workEffortId", state.work).one()
                    .revision
        )
        const operationKey = key("walk-accept")
        const completed = post(users.supervisor, "Maintenance", "WorkOrders/WorkOrderDetail/lifecycleAction", {
            workEffortId: state.work,
            lifecycleAction: "complete",
            expectedRevision: revision,
            outcomeEnumId: "MoutRepaired",
            dispositionEnumId: "MdispAvailable",
            serviceLine: state.orderId + ":" + state.orderItemSeqId,
            serviceAcceptedQuantity: "1",
            serviceEvidenceContentId: state.photo,
            serviceOperationKey: operationKey
        })
        const again = as(users.supervisor, "mantle.work.MaintenanceServices.accept#MaintenanceService", {
            workEffortId: state.work,
            orderId: state.orderId,
            orderItemSeqId: state.orderItemSeqId,
            acceptedQuantity: 1,
            workEffortContentId: state.photo,
            operationKey
        })
        return {completed, again}
    },
    then({completed, again}) {
        completed.errors.length == 0
        rows("mantle.work.effort.WorkEffort", {workEffortId: state.work})[0].statusId != "WeInProgress"
        again.alreadyApplied == true
        const acceptances = rows("mantle.order.purchase.ServiceAcceptance", {orderId: state.orderId})
        acceptances.length == 1
        acceptances[0].workEffortId == state.work
        rows("mantle.order.OrderContent", {orderContentId: acceptances[0].orderContentId})[0].contentLocation.includes(
            "rewound-motor"
        )
        rows("mantle.order.OrderItem", {orderId: state.orderId, orderItemSeqId: state.orderItemSeqId})[0].statusId !=
            "ItemCompleted"
    }
})
