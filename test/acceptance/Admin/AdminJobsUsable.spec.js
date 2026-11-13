// Admin P14's "usable when" (impl-admin P14; design-admin §10 Jobs, JobDetail, JobRuns and JobRunDetail, §15.3 "Monitor
// reuse"), as an acceptance walk with artifact authorization on, through the screens and their transitions, on the demo:
// - Ziziwork Retail's operations operator pauses and resumes a registered job (the framework's send of produced system
//   messages) in JobDetail, and the job then shows its next run in the machine's time zone, the zone its schedule is read in;
//   a job nobody registered stays as its owner deployed it;
// - a run's trace opens in Monitor only by System's own grant (Monitor is a section of System): the operator, who holds
//   none, is shown the trace id and no link, and is refused Monitor's trace screen itself; an instance administrator's
//   JobRunDetail links system/Monitor/TraceDetail;
// - the shipped alert template "Failing job runs" (report/admin-job-runs.json) is a template with no state and no contact
//   point: the operator, who does not open Dashboards, copies nothing; an owner who does copies it, and the copy, evaluated
//   as its owner over job-run telemetry, fires for a job whose run failed.
// The rules are the framework's AdminJobs and BOSS's AdminJobRuns. The third part needs the telemetry store (otel_spans): a
// spec's process exports no spans, so the failed run's root span is written there as the telemetry exporter writes one, with
// the run's own trace id; that a real run's span reaches the index is the framework's telemetry tests.
// Run: ./moq accept mr-boss --spec AdminJobsUsable
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {users, asUser, system, invoke, refusal, page} = lib
const O = "org.moqui.admin.OperationServices."
const R = "org.moqui.report.ReportServices."
const JOB = "moqui.service.job.ServiceJob"
const RUN = "moqui.service.job.ServiceJobRun"
const SEND_JOB = "send_AllProducedSystemMessages_frequent"
const stamp = String(Date.now()).slice(-6)
const failingJob = "AcceptAdmFailing" + stamp
const plainJob = "AcceptAdmPlain" + stamp
const copyId = "accept-admin-job-runs-" + stamp
const walk = {}
const spanId = "acceptadm" + stamp.padStart(7, "0")
const find = (entityName, conditions) => ec.entity.find(entityName).condition(conditions).disableAuthz()
const row = (entityName, conditions) => system(() => find(entityName, conditions).useCache(false).one()?.getMap() || null)
const post = (user, path, parameters) => asUser(user, () => page(path, parameters, "html"))
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
const job = (user, jobName) => asUser(user, () => invoke(O + "get#Job", {jobName}).job)
// a screen of another app, as the shell fetches it
const appPage = (user, path, parameters = {}) =>
    asUser(user, () => {
        const result = ec.screen
            .makeTest()
            .rootScreen("component://webroot/screen/webroot.xml")
            .renderMode("qvt")
            .render(path, Object.assign({lastStandalone: "-2"}, parameters), null)
        ec.message.clearErrors()
        return {status: result.status, output: String(result.output || "")}
    })

spec({
    setupSpec() {
        login("john.doe")
        system(() => {
            const make = (entityName, fields) => {
                const value = ec.entity.makeValue(entityName)
                value.setFields(fields, true, null, null)
                value.create()
            }
            walk.pausedBefore = find(JOB, {jobName: SEND_JOB}).one().paused
            // a job whose service always fails, run by hand below so its run leaves a root span; and one nobody registered
            make(JOB, {
                jobName: failingJob,
                description: "Accept admin failing job",
                serviceName: "org.moqui.impl.SystemMessageServices.send#ProducedSystemMessage"
            })
            make(JOB, {
                jobName: plainJob,
                description: "Accept admin deployed job",
                serviceName: "org.moqui.impl.BasicServices.noop",
                cronExpression: "0 0 3 1 1 ?",
                paused: "N"
            })
            make("moqui.service.job.ServiceJobRunLock", {jobName: plainJob, lastRunTime: Date.now()})
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.disableAuthz()
        const jobRow = ec.entity.find(JOB).condition("jobName", SEND_JOB).one()
        jobRow.set("paused", walk.pausedBefore)
        jobRow.update()
        try {
            ec.service
                .sync()
                .name(R + "delete#Definition")
                .parameters({definitionId: copyId})
                .call()
        } catch (error) {
            ec.logger.warn("AdminJobsUsable: the copied alert rule was not deleted: " + error)
        }
        ec.message.clearErrors()
        if (walk.spanWritten) ec.search.deleteDocument("otel_spans", spanId)
        ec.entity.find("moqui.service.job.ServiceJobRunLock").condition("jobName", "in", [failingJob, plainJob]).deleteAll()
        ec.entity.find(RUN).condition("jobName", "in", [failingJob, plainJob]).deleteAll()
        ec.entity.find(JOB).condition("jobName", "in", [failingJob, plainJob]).deleteAll()
        ec.artifactExecution.enableAuthz()
    }
})

feature("the operator pauses and resumes a registered job, whose next run is shown in the machine's time zone", {
    when() {
        const out = {}
        const save = (jobName, paused) =>
            post(users.operations, "Operations/JobDetail/saveJob", {
                jobName,
                expectedRevision: job(users.operations, jobName).revision,
                paused,
                reason: "Accept: maintenance window"
            })
        save(SEND_JOB, "Y")
        out.paused = job(users.operations, SEND_JOB)
        save(SEND_JOB, "N")
        out.resumed = job(users.operations, SEND_JOB)
        out.detail = asUser(users.operations, () => page("Operations/JobDetail", {jobName: SEND_JOB}))
        out.list = asUser(users.operations, () => page("Operations/Jobs", {term: SEND_JOB}))
        // a job nobody registered is read only
        save(plainJob, "Y")
        out.plain = job(users.operations, plainJob)
        return out
    },
    then(out) {
        out.paused.state == "paused" && !out.paused.nextRunText
        row(JOB, {jobName: SEND_JOB}).paused == "N"
        out.resumed.paused === false && /^\d{4}-\d\d-\d\d \d\d:\d\d$/.test(out.resumed.nextRunText)
        out.resumed.timeZone == ec.user.machineTimeZone
        // the next run is the schedule's next occurrence, as the scheduler reads it
        Date.parse(out.resumed.nextRun) == ec.service.nextCronExecution(out.resumed.cronExpression, Date.now())
        opened(out.detail) && out.detail.output.includes(out.resumed.nextRunText + " (" + out.resumed.timeZone + ")")
        opened(out.list) && out.list.output.includes(out.resumed.nextRunText)
        out.plain.registered === false && row(JOB, {jobName: plainJob}).paused == "N"
    }
})

feature("a run's trace opens in Monitor only by System's own grant", {
    when() {
        const out = {}
        // a run by hand as an instance administrator: its service fails (no such message), and the run keeps its trace id
        system(() => ec.service.job(failingJob).run())
        const deadline = Date.now() + 20000
        const ended = () =>
            system(() => Array.from(find(RUN, {jobName: failingJob}).useCache(false).list()).find(run => run.endTime))
        while (!ended() && Date.now() < deadline) ec.factory.waitWorkerPoolEmpty(50)
        walk.run = ended()?.getMap() || null
        out.run = walk.run
        if (!walk.run) return out
        out.operator = asUser(users.operations, () => page("Operations/JobRunDetail", {jobRunId: walk.run.jobRunId}))
        out.administrator = asUser(users.system, () => page("Operations/JobRunDetail", {jobRunId: walk.run.jobRunId}))
        // the trace link is a screen path of System's (//apps/system/...), which resolves under the web root, as a
        // browser asks for the page, and not under Admin as a spec's root
        const underWebroot = user =>
            asUser(user, () => {
                const result = ec.screen
                    .makeTest()
                    .rootScreen("component://webroot/screen/webroot.xml")
                    .renderMode("html")
                    .render("apps/Admin/Operations/JobRunDetail", {jobRunId: walk.run.jobRunId}, null)
                ec.message.clearErrors()
                return {status: result.status, output: String(result.output || "")}
            })
        out.operatorWeb = underWebroot(users.operations)
        out.administratorWeb = underWebroot(users.system)
        // the page grants nothing: Monitor's own screen refuses the operator
        out.operatorMonitor = appPage(users.operations, "apps/system/Monitor/TraceDetail", {traceId: walk.run.traceId})
        out.administratorMonitor = appPage(users.system, "apps/system/Monitor/TraceDetail", {traceId: walk.run.traceId})
        return out
    },
    then(out) {
        out.run != null && out.run.hasError == "Y" && /^[0-9a-f]{32}$/.test(out.run.traceId)
        opened(out.operator) && out.operator.output.includes("Failed")
        out.operator.output.includes(out.run.traceId) && !out.operator.output.includes("Monitor/TraceDetail")
        opened(out.administrator)
        out.operatorWeb.output.includes(out.run.traceId) && !out.operatorWeb.output.includes("Monitor/TraceDetail")
        out.administratorWeb.output.includes("system/Monitor/TraceDetail")
        out.operatorMonitor.status != 200
        out.administratorMonitor.status == 200
    }
})

feature("the failing job runs alert is a template until an owner copies it; the copy fires for a job whose run failed", {
    when() {
        const out = {}
        out.template = asUser(users.system, () =>
            invoke("org.moqui.report.ReportServices.get#AlertState", {definitionId: "admin-job-runs"})
        )
        out.definition = asUser(users.system, () => invoke(R + "get#Definition", {definitionId: "admin-job-runs"}).definition)
        // the operator opens Jobs, which names the template, and no Dashboards: nothing is copied by them
        out.jobs = asUser(users.operations, () => page("Operations/Jobs", {term: failingJob}))
        out.operatorCopy = asUser(users.operations, () =>
            refusal(R + "copy#Definition", {definitionId: "admin-job-runs", newDefinitionId: copyId})
        )
        // the failed run's root span, as the exporter writes it (the second feature's run, its trace id)
        system(() => {
            const start = Number(String(walk.run.startTime))
            ec.search.indexDocuments([
                {
                    _type: "otel_spans",
                    _id: spanId,
                    trace_id: walk.run.traceId,
                    span_id: spanId.slice(0, 16),
                    parent_span_id: "",
                    name: "job " + failingJob,
                    kind: "INTERNAL",
                    start,
                    duration_nano: 1000000,
                    status_code: "ERROR",
                    sampled: true,
                    "moqui.job.root": true,
                    "moqui.job.name": failingJob,
                    "moqui.job.run.id": walk.run.jobRunId,
                    events: []
                }
            ])
            walk.spanWritten = true
        })
        // an owner who opens Dashboards copies it; the copy is evaluated as its owner over the spans of the last hour
        asUser(users.system, () => {
            out.copy = invoke(R + "copy#Definition", {
                definitionId: "admin-job-runs",
                newDefinitionId: copyId,
                title: "Accept failing job runs"
            })
            out.evaluated = invoke(R + "evaluate#Alerts", {definitionId: copyId})
            out.state = invoke("org.moqui.report.ReportServices.get#AlertState", {definitionId: copyId})
        })
        // the series as plain rows: in then, Array.from of the instances get#AlertState answered gives [] (seen Nov 11)
        out.templateInstances = JSON.parse(JSON.stringify(out.template.instances || []))
        out.instances = JSON.parse(JSON.stringify(out.state.instances || []))
        return out
    },
    then(out) {
        out.template.template === true && out.templateInstances.length == 0
        // shipped read only, on job-run telemetry, with no contact point
        out.definition.body.query.datasetId == "otel_spans" && out.definition.body.contactPoints == null
        opened(out.jobs) && out.jobs.output.includes("Failing job runs") && !out.jobs.output.includes("dashboards/Alerts")
        out.operatorCopy != ""
        out.copy.definition != null && out.state.own === true && out.state.template !== true
        out.evaluated.failed == 0
        // the failed run of the second feature: its job is a firing series of the copy
        out.instances.some(
            instance =>
                JSON.stringify(instance.labels || {}).includes(failingJob) &&
                /firing|alerting|pending/i.test(String(instance.state))
        )
    }
})
