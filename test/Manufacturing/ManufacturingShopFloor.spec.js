// Manufacturing's shop floor and production time (impl-manufacturing P10, its "usable when"), through the Shop floor screens'
// transitions and pages with artifact authorization enabled: on a running work order of line A (ManufacturingSpecLib
// shopFloorFixture), the material handler (an operator who issues stock) finds Assemble on the station's board and by a scan,
// acknowledges its instruction, starts it with the person timer, switching from another timer only after confirming, and
// records machine runtime apart from labor; the operator's completion of Test and pack before Assemble is refused, naming
// it, and the coupled receipt is refused to an operator without the stock issue permission (F96); Assemble's evidence is
// recorded and it completes with its pieces on the time entry, then Test and pack completes 5 good and 1 scrap with the
// coupled output receipt, and a retry answers the first; the work order's supervisor approves the handler's week on
// ProductionTime, which writes the labor event, and reopening it writes the reversal; Today lists the handler's due
// operation from the Manufacturing source and not as a task; the terminal twins render the same board and forms. The
// refusals of each verb and the other organization are ManufacturingAccess's P10 section.
// Run: ./moq test mr-boss --spec ManufacturingShopFloor
const lib = ec.resource.script("component://mr-boss/test/Manufacturing/ManufacturingSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const production = "mantle.work.ProductionServices."
const root = "component://mr-boss/screen/Manufacturing.xml"
const WORK = "mantle.work.effort.WorkEffort",
    TIME = "mantle.work.time.TimeEntry",
    EVENT = "mantle.work.production.ProductionCostEvent"
let keySeq = 0
const key = () => "spec-p10-" + Date.now() + "-" + ++keySeq
const one = (entity, conditions) => system(() => ec.entity.find(entity).condition(conditions).one())
const rows = (entity, conditions) => system(() => Array.from(ec.entity.find(entity).condition(conditions).list()))
// a transition of a Manufacturing screen as the user, with artifact authorization on: its errors ("" when none), messages
// and, for a JSON answer, the JSON
function post(user, path, parameters, method = "post") {
    return asUser(user, () => {
        const result = ec.screen
            .makeTest()
            .rootScreen(root)
            .render(path, parameters || {}, method === "post" ? "post" : null)
        const output = String(result.output || "")
        let json = null
        try {
            json = JSON.parse(output)
        } catch (error) {
            json = null
        }
        const errors = Array.from(result.errorMessages || []).join(" | ")
        const messages = Array.from(result.messages || []).join(" | ")
        ec.message.clearErrors()
        return {status: result.status, json, output, errors, messages}
    })
}
// the user's running timer entry moved back some minutes, so its stop counts time (a timer under a minute is discarded)
function backdate(partyId, minutes) {
    const entry = rows(TIME, {partyId, thruDate: null}).find(row => row.fromDate != null)
    if (entry)
        system(() => invoke("update#" + TIME, {timeEntryId: entry.timeEntryId, fromDate: new Date(Date.now() - minutes * 60000)}))
    return entry?.timeEntryId || null
}
const state = {}
// the running work order, with the material handler and the operator assigned to it
function fixture() {
    if (state.f) return state.f
    const f = lib.shopFloorFixture("Shop floor spec")
    for (const partyId of ["BOSS_MFG_MATERIAL", "BOSS_MFG_OPERATE"])
        asUser(
            users.plan,
            () =>
                invoke(production + "store#ProductionParty", {
                    operationKey: key(),
                    workEffortId: f.runId,
                    expectedRevision: Number(one(WORK, {workEffortId: f.runId}).productionRevision || 0),
                    partyId,
                    roleTypeId: "Assignee"
                }),
            false
        )
    state.f = f
    return f
}

spec({
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("the handler finds Assemble on the board and by a scan, acknowledges its instruction and starts it, switching timers", {
    when() {
        const f = fixture()
        const board = post(users.material, "ShopFloor/Station/queueRows", {facilityId: ids.plantId}, "get")
        const mine = post(users.material, "ShopFloor/Station/queueRows", {facilityId: ids.plantId, mine: "true"}, "get")
        const scanned = post(users.material, "ShopFloor/Station/scanOperation", {scanText: f.runId}, "get")
        const executionBefore = asUser(users.material, () =>
            page("ShopFloor/OperationExecution", {operationWorkEffortId: f.assemble}, "html")
        )
        const unread = post(users.material, "ShopFloor/Station/startOperation", {
            operationWorkEffortId: f.assemble,
            operationKey: key()
        })
        const instructionsPage = asUser(users.material, () =>
            page("ShopFloor/Instructions", {operationWorkEffortId: f.assemble}, "html")
        )
        const instructions = asUser(
            users.material,
            () => invoke(production + "get#ProductionInstructions", {operationWorkEffortId: f.assemble}).productionInstructions,
            false
        )
        const acknowledged = post(users.material, "ShopFloor/Instructions/recordStep", {
            operationKey: key(),
            operationWorkEffortId: f.assemble,
            stepTypeEnumId: "IstAcknowledge",
            workEffortContentId: instructions.instructionRows[0].workEffortContentId
        })
        // a timer of the handler's on other work: the start asks first, then switches
        asUser(users.material, () => invoke("mantle.work.TimesheetServices.start#Timer", {comments: "Sweeping"}), false)
        const asked = post(users.material, "ShopFloor/Station/startOperation", {
            operationWorkEffortId: f.assemble,
            operationKey: key()
        })
        const started = post(users.material, "ShopFloor/Station/startOperation", {
            operationWorkEffortId: f.assemble,
            operationKey: key(),
            confirmSwitch: "true"
        })
        const executionAfter = asUser(users.material, () =>
            page("ShopFloor/OperationExecution", {operationWorkEffortId: f.assemble}, "html")
        )
        return {
            f,
            board,
            mine,
            scanned,
            executionBefore,
            unread,
            instructionsPage,
            instructions,
            acknowledged,
            asked,
            started,
            executionAfter
        }
    },
    then(x) {
        x.board.json.rows.some(row => row.id == x.f.assemble && row.state == "ready")
        x.board.json.rows.some(row => row.id == x.f.test && row.state == "blocked")
        x.board.json.groups.some(group => group.id == "running")
        x.mine.json.rows.some(row => row.id == x.f.assemble)
        x.scanned.json.matches.some(match => match.id == x.f.assemble)
        x.executionBefore.errors.length == 0
        x.executionBefore.output.includes("Start checks")
        x.executionBefore.output.includes("Read and acknowledge the instructions first")
        x.unread.json.failed == true
        x.unread.json.reasonCode == "ACKNOWLEDGMENT_REQUIRED"
        x.instructionsPage.errors.length == 0
        x.instructionsPage.output.includes("fasten the four screws")
        x.instructionsPage.output.includes("Acknowledge")
        x.acknowledged.errors == ""
        x.asked.json.reasonCode == "TIMER_SWITCH_REQUIRED"
        x.asked.json.message.includes("Sweeping") || x.asked.json.message.includes("other work")
        x.started.json.result.resultCode == "STARTED"
        x.started.json.result.switched == true
        one(WORK, {workEffortId: x.f.assemble}).statusId == "WeInProgress"
        x.executionAfter.output.includes("Your timer runs on this operation")
        x.executionAfter.output.includes("Complete")
    }
})

feature("machine runtime is recorded apart from labor, valued at line A's machine rate", {
    when() {
        const f = fixture()
        const parameters = {operationWorkEffortId: f.assemble}
        const started = post(
            users.material,
            "ShopFloor/OperationExecution/machineRuntime",
            Object.assign({operationKey: key(), runtimeAction: "start"}, parameters)
        )
        const open = rows("mantle.work.production.MachineRuntimeEvent", {operationWorkEffortId: f.assemble, thruDate: null})[0]
        system(() =>
            invoke("update#mantle.work.production.MachineRuntimeEvent", {
                machineRuntimeEventId: open.machineRuntimeEventId,
                fromDate: new Date(Date.now() - 30 * 60000)
            })
        )
        const stopped = post(
            users.material,
            "ShopFloor/OperationExecution/machineRuntime",
            Object.assign(
                {operationKey: key(), runtimeAction: "stop", machineRuntimeEventId: open.machineRuntimeEventId},
                parameters
            )
        )
        const event = rows(EVENT, {
            sourceEntityName: "mantle.work.production.MachineRuntimeEvent",
            sourceId: open.machineRuntimeEventId
        })[0]
        return {f, started, stopped, event, entries: rows(TIME, {workEffortId: f.assemble})}
    },
    then(x) {
        x.started.errors == ""
        x.stopped.errors == ""
        x.event.costComponentEnumId == "PrcMachine"
        x.event.rateId == ids.lineRateId
        Math.abs(Number(String(x.event.amount)) - 20) < 0.5
        x.entries.length == 1
    }
})

feature("completion waits for its predecessor, naming it; the output operation completes 5 good and 1 scrap with its receipt", {
    when() {
        const f = fixture()
        const testStart = post(users.operate, "ShopFloor/Station/startOperation", {
            operationWorkEffortId: f.test,
            operationKey: key()
        })
        const quantities = {operationWorkEffortId: f.test, good: "5", scrap: "1", reason: "Dropped", stopTimer: "true"}
        const early = post(
            users.operate,
            "ShopFloor/OperationExecution/completeOperation",
            Object.assign({operationKey: key()}, quantities)
        )
        const evidence = post(users.material, "ShopFloor/Instructions/recordStep", {
            operationKey: key(),
            operationWorkEffortId: f.assemble,
            stepTypeEnumId: "IstEvidence",
            valueText: "Photo 1123"
        })
        const entryId = backdate("BOSS_MFG_MATERIAL", 12)
        const assembled = post(users.material, "ShopFloor/OperationExecution/completeOperation", {
            operationKey: key(),
            operationWorkEffortId: f.assemble,
            good: "6",
            stopTimer: "true"
        })
        const testEvidence = post(users.operate, "ShopFloor/Instructions/recordStep", {
            operationKey: key(),
            operationWorkEffortId: f.test,
            stepTypeEnumId: "IstEvidence",
            valueText: "Passed"
        })
        const noStock = post(
            users.operate,
            "ShopFloor/OperationExecution/completeOperation",
            Object.assign({operationKey: key()}, quantities)
        )
        const completeKey = key()
        const packed = post(
            users.material,
            "ShopFloor/OperationExecution/completeOperation",
            Object.assign({operationKey: completeKey}, quantities)
        )
        const receipts = rows("mantle.product.receipt.AssetReceipt", {workEffortId: f.runId}).length
        // a retry after a timeout: the same operation key answers the first completion and receives nothing again
        const retried = asUser(
            users.material,
            () =>
                invoke(
                    production + "complete#ProductionOperation",
                    Object.assign({operationKey: completeKey}, quantities, {good: 5, scrap: 1, stopTimer: true})
                ),
            false
        )
        state.entryId = entryId
        return {
            f,
            testStart,
            early,
            evidence,
            assembled,
            testEvidence,
            noStock,
            packed,
            receipts,
            retried,
            entry: one(TIME, {timeEntryId: entryId}),
            receiptsAfter: rows("mantle.product.receipt.AssetReceipt", {workEffortId: f.runId}).length,
            losses: rows("mantle.work.production.ProductionLoss", {workEffortId: f.runId})
        }
    },
    then(x) {
        x.testStart.json.result.resultCode == "STARTED"
        x.early.errors.includes("PREDECESSOR_OPEN")
        x.early.errors.includes("Assemble")
        x.evidence.errors == ""
        x.assembled.errors == ""
        one(WORK, {workEffortId: x.f.assemble}).statusId == "WeComplete"
        Number(String(x.entry.pieceCount)) == 6
        x.testEvidence.errors == ""
        x.noStock.errors.includes("STOCK_ISSUE_REQUIRED")
        x.packed.errors == ""
        one(WORK, {workEffortId: x.f.test}).statusId == "WeComplete"
        x.receipts == 1
        x.retried.result.alreadyApplied == true
        x.receiptsAfter == 1
        x.losses.length == 1
        x.losses[0].lossTypeEnumId == "PltOutputScrap"
    }
})

feature("the supervisor approves the handler's week on ProductionTime, writing the labor event; reopening writes the reversal", {
    when() {
        const f = fixture()
        const entry = one(TIME, {timeEntryId: state.entryId})
        const timesheetId = entry.timesheetId
        const timePage = asUser(users.supervise, () => page("ShopFloor/ProductionTime", {workEffortId: f.runId}, "html"))
        const submitted = post(users.material, "ShopFloor/ProductionTime/submitWeek", {workEffortId: f.runId, timesheetId})
        const approved = post(users.supervise, "ShopFloor/ProductionTime/approveWeek", {workEffortId: f.runId, timesheetId})
        const afterApproval = rows(EVENT, {sourceEntityName: TIME, sourceId: entry.timeEntryId})
        const reopened = post(users.supervise, "ShopFloor/ProductionTime/reopenWeek", {
            workEffortId: f.runId,
            timesheetId,
            reason: "Wrong operation"
        })
        const afterReopen = rows(EVENT, {sourceEntityName: TIME, sourceId: entry.timeEntryId})
        return {timePage, submitted, approved, afterApproval, reopened, afterReopen, entry}
    },
    then(x) {
        x.timePage.errors.length == 0
        x.timePage.output.includes("Manufacturing Material handler")
        x.submitted.errors == ""
        x.approved.errors == ""
        x.afterApproval.length == 1
        x.afterApproval[0].costComponentEnumId == "PrcLabor"
        x.afterApproval[0].rateId == "BOSS_MFG_RATE_RUN"
        Math.abs(Number(String(x.afterApproval[0].amount)) - Number(String(x.entry.hours)) * 25) < 0.01
        x.reopened.errors == ""
        x.afterReopen.length == 2
        Number(String(x.afterReopen[1].quantity)) == -Number(String(x.entry.hours))
    }
})

feature("Today lists the handler's due operation from the Manufacturing source, not as a task with Mark done", {
    when() {
        fixture()
        // a fresh operation of the work order due now: the second fixture run's Assemble, assigned to the handler
        const g = lib.shopFloorFixture("Shop floor today")
        asUser(
            users.plan,
            () =>
                invoke(production + "store#ProductionParty", {
                    operationKey: key(),
                    workEffortId: g.runId,
                    expectedRevision: Number(one(WORK, {workEffortId: g.runId}).productionRevision || 0),
                    partyId: "BOSS_MFG_MATERIAL",
                    roleTypeId: "Assignee"
                }),
            false
        )
        const source = asUser(
            users.material,
            () =>
                invoke("ironstone.manufacturing.HomeServices.get#TodayItems", {
                    thruDate: new Date(Date.now() + 2 * 86400000)
                }),
            false
        )
        const today = asUser(
            users.material,
            () =>
                invoke("mantle.work.WorkEffortServices.get#UserTodayItems", {
                    sourceServiceNames: [{service: "ironstone.manufacturing.HomeServices.get#TodayItems", label: "Manufacturing"}]
                }),
            false
        )
        const builtIn = (today.overdue || []).concat(today.dueToday || [], today.laterToday || [])
        return {g, source, builtIn}
    },
    then(x) {
        x.source.items.some(item => item.workEffortId == x.g.assemble && item.kind == "productionOperation")
        x.source.items.every(item => item.canUpdate == false)
        x.source.items.find(item => item.workEffortId == x.g.assemble).url.includes("ShopFloor/OperationExecution")
        x.builtIn.every(item => item.workEffortId != x.g.assemble && item.workEffortId != x.g.runId)
    }
})

feature("the terminal twins: the station's board and the operation's forms render in tui", {
    when() {
        const f = fixture()
        return {
            station: asUser(users.material, () => page("ShopFloor/Station", {}, "tui")),
            execution: asUser(users.material, () => page("ShopFloor/OperationExecution", {operationWorkEffortId: f.test}, "tui")),
            instructions: asUser(users.material, () =>
                page("ShopFloor/Instructions", {operationWorkEffortId: f.assemble}, "tui")
            ),
            time: asUser(users.supervise, () => page("ShopFloor/ProductionTime", {workEffortId: f.runId}, "tui"))
        }
    },
    then(x) {
        x.station.errors.length == 0
        x.station.output.includes("queueRows")
        x.execution.errors.length == 0
        x.execution.output.includes("Start checks")
        x.execution.output.includes("Machine runtime")
        x.instructions.errors.length == 0
        x.instructions.output.includes("Photo of the fastened assembly")
        x.time.errors.length == 0
        x.time.output.includes("Time entries")
    }
})
