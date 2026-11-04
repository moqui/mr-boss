// Accounting's production cost close on the BOSS screens (impl-manufacturing P15; design-accounting ProductionCostClose,
// CostingPolicies and §16.3 production-to-GL): a completed run of Retail's whose cost review Manufacturing requested is in the
// queue of Accounting Home, the close checklist and the ProductionCostClose screen; the finance approver previews and posts
// it from the Accounting mount, which closes the run; the GL poster previews it without the post; CostingPolicies opens for
// the finance administrator with its change and read only for the reader. The run is this spec's: its own product, method
// and plant, with the demo Manufacturing users and a labor event as the shop floor writes it.
// Run: ./moq test mr-boss --spec AccountingProductionCostClose
const mfg = ec.resource.script("component://mr-boss/test/Manufacturing/ManufacturingSpecLib.js")
const {users, asUser, system, refusal} = mfg
const P = "mantle.work.ProductionServices.",
    C = "mantle.ledger.ProductionCostServices.",
    B = "mantle.product.BomServices.",
    R = "mantle.work.RoutingServices."
const org = "ORG_ZIZI_RETAIL",
    plant = "BOSS_PCC_PLANT"
// Retail's finance users (the Accounting demo users work in the Accounting demo organization): spec-local, each in the
// Accounting launcher and one finance group
const approver = "boss_pcc_approve",
    gl = "boss_pcc_gl",
    reader = "boss_pcc_read",
    financeAdmin = "boss_pcc_admin"
const financeUsers = {
    BOSS_PCC_APPROVE: "BOSS_ACCOUNTING_APPROVE",
    BOSS_PCC_GL: "BOSS_ACCOUNTING_GL",
    BOSS_PCC_READ: "BOSS_ACCOUNTING_READ",
    BOSS_PCC_ADMIN: "BOSS_ACCOUNTING_ADMIN"
}
const state = {}
let keySeq = 0
const key = () => "boss-pcc-" + ++keySeq
const one = (entity, conditions) => ec.entity.find(entity).condition(conditions).disableAuthz().one()
const rows = (entity, conditions) => Array.from(ec.entity.find(entity).condition(conditions).disableAuthz().list())
const call = (name, parameters) => {
    const out = ec.service.sync().name(name).parameters(parameters).call() || {}
    if (ec.message.hasError()) throw new Error(name + ": " + ec.message.getErrorsString())
    return out
}
const revision = workEffortId => Number(one("mantle.work.effort.WorkEffort", {workEffortId}).productionRevision || 0)
const transition = (user, workEffortId, action) =>
    asUser(
        user,
        () =>
            call(P + "transition#ProductionOrder", {
                operationKey: key(),
                workEffortId,
                action,
                expectedRevision: revision(workEffortId)
            }),
        false
    )
function accounting(user, path, parameters = {}, method = null) {
    return asUser(user, () => {
        const renderer = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Accounting.xml").renderMode("html")
        const result = renderer.render(path, Object.assign({lastStandalone: "-2"}, parameters), method)
        const output = String(result.output || "")
        const errors = Array.from(result.errorMessages || []).concat(
            output.match(/(Error rendering|Exception in render)[^\n<]*/g) || []
        )
        ec.message.clearErrors()
        return {status: result.status, output, errors}
    })
}

spec({
    setupSpec() {
        system(() => {
            for (const [partyId, userGroupId] of Object.entries(financeUsers)) {
                call("create#mantle.party.Party", {partyId, partyTypeEnumId: "PtyPerson"})
                call("create#mantle.party.Person", {partyId, firstName: "Cost close", lastName: partyId})
                call("create#moqui.security.UserAccount", {
                    userId: partyId,
                    username: partyId.toLowerCase(),
                    partyId,
                    currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
                    passwordHashType: "SHA"
                })
                for (const group of ["BOSS_ACCOUNTING", userGroupId])
                    call("create#moqui.security.UserGroupMember", {
                        userId: partyId,
                        userGroupId: group,
                        fromDate: "2000-01-01 00:00:00"
                    })
                call("create#mantle.party.PartyRelationship", {
                    fromPartyId: partyId,
                    toPartyId: org,
                    relationshipTypeEnumId: "PrtAgent",
                    toRoleTypeId: "OrgInternal",
                    fromDate: "2000-01-01 00:00:00"
                })
            }
            call("store#mantle.facility.Facility", {
                facilityId: plant,
                facilityTypeEnumId: "FcTpWarehouse",
                facilityName: "Cost close plant",
                ownerPartyId: org
            })
            call("store#mantle.facility.FacilityLocation", {
                facilityId: plant,
                locationSeqId: "PICK1",
                locationTypeEnumId: "FltPick"
            })
            for (const productId of ["BOSS_PCC_FIN", "BOSS_PCC_RM"])
                call("store#mantle.product.Product", {
                    productId,
                    productName: productId === "BOSS_PCC_FIN" ? "Cost close assembly" : "Cost close part",
                    productTypeEnumId: "PtAsset",
                    assetTypeEnumId: "AstTpInventory",
                    amountUomId: "OTH_ea",
                    ownerPartyId: org
                })
            call("store#mantle.product.cost.ProductStandardCost", {
                productStandardCostId: "BOSS_PCC_STD",
                productId: "BOSS_PCC_FIN",
                organizationPartyId: org,
                state: "approved",
                fromDate: "2000-01-01 00:00:00",
                quantity: 1,
                quantityUomId: "OTH_ea",
                priceUomId: "USD",
                unitCost: 5,
                totalCost: 5,
                materialCost: 2,
                laborCost: 3,
                complete: "Y"
            })
            const received = call("mantle.product.AssetServices.receive#Asset", {
                productId: "BOSS_PCC_RM",
                quantity: 50,
                facilityId: plant,
                locationSeqId: "PICK1",
                ownerPartyId: org,
                assetTypeEnumId: "AstTpInventory",
                statusId: "AstAvailable",
                acquireCost: 2
            })
            call("update#mantle.product.asset.Asset", {assetId: received.assetId, acquireCostUomId: "USD"})
            state.assetId = received.assetId
        })
        // the method: one operation consuming one part per assembly
        asUser(
            users.admin,
            () => {
                call(R + "store#WorkCenter", {organizationPartyId: org, facilityId: plant, changeReason: "Spec work center"})
                const routeId = call(R + "store#Routing", {
                    organizationPartyId: org,
                    workEffortName: "Cost close routing",
                    changeReason: "Spec"
                }).routing.workEffortId
                const operationId = call(R + "store#RoutingOperation", {
                    workEffortId: routeId,
                    workEffortName: "Assemble",
                    sequenceNum: 10,
                    estimatedWorkTime: 6,
                    timeUomId: "TF_min",
                    methodBatchQuantity: 1,
                    methodQuantityUomId: "OTH_ea",
                    methodWorkCenterId: plant,
                    changeReason: "Spec operation"
                }).operationWorkEffortId
                const routing = call(R + "get#RoutingDetail", {workEffortId: routeId})
                call(R + "release#RoutingDraft", {
                    workEffortId: routeId,
                    expectedRevision: routing.expectedRevision,
                    changeReason: "Spec"
                })
                const productBomId = call(B + "store#Bom", {
                    productId: "BOSS_PCC_FIN",
                    organizationPartyId: org,
                    routingWorkEffortId: routeId,
                    changeReason: "Spec method"
                }).productBom.productBomId
                call(B + "store#BomItem", {
                    productBomId,
                    productId: "BOSS_PCC_RM",
                    quantity: 1,
                    quantityUomId: "OTH_ea",
                    operationWorkEffortId: operationId,
                    changeReason: "Spec line"
                })
                const detail = call(B + "get#BomDetail", {productBomId})
                call(B + "release#BomDraft", {
                    productBomId,
                    expectedRevision: detail.expectedRevision,
                    changeReason: "Spec release"
                })
                state.runId = call(P + "create#ProductionOrder", {
                    operationKey: key(),
                    organizationPartyId: org,
                    productId: "BOSS_PCC_FIN",
                    quantity: 10,
                    facilityId: plant
                }).workEffortId
            },
            false
        )
        transition(users.admin, state.runId, "release")
        transition(users.admin, state.runId, "start")
        const materialLine = rows("mantle.work.production.ProductionRunLine", {workEffortId: state.runId}).find(
            row => row.lineRoleEnumId === "PrlrMaterial"
        )
        asUser(
            users.material,
            () => {
                call(P + "issue#ProductionMaterial", {
                    operationKey: key(),
                    workEffortId: state.runId,
                    productionRunLineId: materialLine.productionRunLineId,
                    assetId: state.assetId,
                    quantity: 10
                })
                call(P + "receive#ProductionOutput", {operationKey: key(), workEffortId: state.runId, quantity: 10})
            },
            false
        )
        // the labor of the run as the shop floor writes it, awaiting the close
        system(() =>
            call("create#mantle.work.production.ProductionCostEvent", {
                organizationPartyId: org,
                workEffortId: state.runId,
                costComponentEnumId: "PrcLabor",
                sourceEntityName: "BossPccSpec",
                sourceId: state.runId,
                sourceRevision: 1,
                quantity: 2,
                quantityUomId: "TF_hr",
                amount: 24,
                amountUomId: "USD",
                valuationStatusEnumId: "PcvValued",
                ledgerStatusEnumId: "PclAwaitingClose",
                eventDate: ec.user.nowTimestamp,
                afterClose: "N"
            })
        )
        transition(users.admin, state.runId, "complete")
        asUser(
            users.cost,
            () =>
                call(P + "review#ProductionCosts", {
                    operationKey: key(),
                    workEffortId: state.runId,
                    expectedRevision: revision(state.runId)
                }),
            false
        )
    }
})

feature("the reviewed run waits in the queue, Accounting Home's work and the close checklist", {
    when() {
        const queue = asUser(approver, () =>
            call("ironstone.accounting.ProductionCostServices.find#CostCloseQueue", {organizationPartyId: org})
        )
        const home = accounting(approver, "Home", {organizationPartyId: org})
        const queuePage = accounting(approver, "Inventory/ProductionCostClose", {organizationPartyId: org})
        const day = ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
        const month = rows("mantle.party.time.TimePeriod", {partyId: org, timePeriodTypeId: "FiscalMonth"}).find(
            row => ec.l10n.format(row.fromDate, "yyyy-MM-dd") <= day && ec.l10n.format(row.thruDate, "yyyy-MM-dd") >= day
        )
        const check = month
            ? asUser(approver, () =>
                  call(C + "check#ProductionClose", {
                      organizationPartyId: org,
                      timePeriodId: month.timePeriodId,
                      checkEnumId: "PccProductionCostClose"
                  })
              )
            : {items: []}
        return {queue, home, queuePage, check}
    },
    then({queue, home, queuePage, check}) {
        queue.queueRows.some(row => row.workEffortId == state.runId && row.kind == "review")
        home.errors.length == 0
        home.output.includes("Production runs awaiting cost close")
        queuePage.errors.length == 0
        queuePage.output.includes(state.runId)
        check.items.some(item => item.recordId == state.runId)
    }
})

feature("the finance approver previews and posts the close from Accounting, which closes the run; the GL poster cannot post", {
    when() {
        const page = accounting(approver, "Inventory/ProductionCostClose", {workEffortId: state.runId})
        const glPage = accounting(gl, "Inventory/ProductionCostClose", {workEffortId: state.runId})
        const previewed = asUser(approver, () => call(C + "preview#CostClose", {workEffortId: state.runId}))
        const glPost = asUser(gl, () =>
            refusal(C + "post#CostClose", {
                operationKey: key(),
                workEffortId: state.runId,
                inputFingerprint: previewed.inputFingerprint
            })
        )
        const posted = accounting(
            approver,
            "Inventory/ProductionCostClose/postClose",
            {
                operationKey: key(),
                workEffortId: state.runId,
                accountingDate: previewed.accountingDate,
                inputFingerprint: previewed.inputFingerprint,
                changeReason: "Month end"
            },
            "post"
        )
        const after = one("mantle.work.effort.WorkEffort", {workEffortId: state.runId})
        const closedPage = accounting(approver, "Inventory/ProductionCostClose", {workEffortId: state.runId})
        return {page, glPage, previewed, glPost, posted, after, closedPage}
    },
    then({page, glPage, previewed, glPost, posted, after, closedPage}) {
        page.errors.length == 0
        page.output.includes("Post cost close")
        page.output.includes("Proposed journal entry")
        glPage.errors.length == 0
        glPage.output.includes("Proposed journal entry")
        !glPage.output.includes("Post cost close")
        previewed.blocked == false
        previewed.ledgerRows.length > 0
        glPost.includes("PERMISSION_DENIED")
        posted.errors.length == 0
        after.statusId == "WeClosed"
        after.productionCostCloseTransId != null
        after.productionCostReviewStatusId == "PcrClosed"
        closedPage.output.includes("Posted allocations")
    }
})

feature("CostingPolicies opens with its change for the finance administrator, and Manufacturing reads the policy in effect", {
    when() {
        return {
            admin: accounting(financeAdmin, "Settings/CostingPolicies", {organizationPartyId: org}),
            reader: accounting(reader, "Settings/CostingPolicies", {organizationPartyId: org}),
            production: asUser(users.admin, () => mfg.page("Settings/ProductionSettings", {}, "html"))
        }
    },
    then({admin, reader, production}) {
        admin.errors.length == 0
        admin.output.includes("Change policy")
        admin.output.includes("Rate per work-center hour")
        // the settings are the finance administrator's
        reader.status != 200 || !reader.output.includes("Change policy")
        production.errors.length == 0
        production.output.includes("Costing policy: Overhead Rate per work-center hour")
        !production.output.includes("/qapps/Accounting/Settings/CostingPolicies")
    }
})
