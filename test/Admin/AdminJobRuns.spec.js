// Jobs, job runs and notification topics in Admin (impl-admin P14; design-admin §10 Jobs, JobDetail, JobRuns, JobRunDetail,
// Topics and TopicDetail, §15.3 "Monitor reuse"): JobRunDetail's one qvt render, as Ziziwork Retail's operations operator,
// shows a run of the framework's send job that ended without an error as ended with failed items, with the failed message as
// an item that opens its own page, the run's trace id with no link into Monitor (the operator holds no System grant) and no
// message text; Jobs', JobDetail's, JobRuns', Topics' and TopicDetail's one qvt render each tell a registered job and topic
// from an owner's deployment and offer only what was registered. The actions go through the screens' transitions: the
// operator pauses and resumes a registered job and asks for a run, which marks the job due under its lock and starts
// nothing here; the reader and the configuration administrator change no job; the configuration administrator changes a
// topic's registered default and subscribes nobody; the operator subscribes an account of the topic's audience. The area
// opens to the configuration administrator for the two topic screens only. The framework's rules are the framework's
// AdminJobs spec.
// Run: ./moq test mr-boss --spec AdminJobRuns
const lib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {users, asUser, system, page} = lib
const JOB = "moqui.service.job.ServiceJob"
const LOCK = "moqui.service.job.ServiceJobRunLock"
const RUN = "moqui.service.job.ServiceJobRun"
const MESSAGE = "moqui.service.message.SystemMessage"
const TOPIC = "moqui.security.user.NotificationTopic"
const TOPIC_USER = "moqui.security.user.NotificationTopicUser"
const NOOP = "org.moqui.impl.BasicServices.noop"
const SEND_JOB = "send_AllProducedSystemMessages_frequent"
const jobs = {registered: "SpecAdmJobRegistered", plain: "SpecAdmJobPlain"}
const runs = {send: "SPEC_ADM_JR_SEND", failed: "SPEC_ADM_JR_FAILED"}
const messageId = "SPEC_ADM_JR_MESSAGE"
const topicId = "SpecAdmJobTopic"
const traceId = "0123456789abcdef0123456789abcdef"
const operatorUserId = "BOSS_ADM_OPERATIONS"
const hour = 3600000
const find = (entityName, conditions) => ec.entity.find(entityName).condition(conditions).disableAuthz()
const row = (entityName, conditions) => system(() => find(entityName, conditions).one()?.getMap() || null)
const post = (user, path, parameters) => asUser(user, () => page(path, parameters, "html"))
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
const jobRevision = jobName =>
    asUser(
        users.operations,
        () => ec.service.sync().name("org.moqui.admin.OperationServices.get#Job").parameters({jobName}).call().job
    )

spec({
    setupSpec() {
        login("john.doe")
        system(() => {
            const make = (entityName, fields) => {
                const value = ec.entity.makeValue(entityName)
                value.setFields(fields, true, null, null)
                value.create()
            }
            make(JOB, {
                jobName: jobs.registered,
                description: "Spec admin registered job",
                serviceName: NOOP,
                cronExpression: "0 0 3 1 1 ?",
                paused: "N"
            })
            make(LOCK, {jobName: jobs.registered, lastRunTime: Date.now() - hour})
            make("moqui.server.JobRegistration", {
                jobName: jobs.registered,
                ownerApp: "Spec owner",
                title: "Spec admin nightly work",
                scheduleEditable: "Y",
                pauseEditable: "Y"
            })
            make("moqui.server.RecoveryDescriptor", {
                descriptorKey: "specAdmJobRun",
                targetKind: "ServiceJob",
                targetKey: jobs.registered,
                ownerApp: "Spec owner",
                title: "Spec admin nightly work",
                retryMode: "native",
                idempotencyNote: "A second run does nothing new."
            })
            make(JOB, {
                jobName: jobs.plain,
                description: "Spec admin deployed job",
                serviceName: NOOP,
                cronExpression: "0 0 3 1 1 ?",
                paused: "N"
            })
            make(LOCK, {jobName: jobs.plain, lastRunTime: Date.now() - hour})
            make(RUN, {
                jobRunId: runs.failed,
                jobName: jobs.plain,
                startTime: Date.now() - 2 * hour,
                endTime: Date.now() - 2 * hour + 2000,
                hasError: "Y",
                errors: "Could not connect to https://files.example.test/spec/private/path for bob@example.test"
            })
            // a run of the framework's send job that ended without an error, and a message it tried that failed
            make(RUN, {
                jobRunId: runs.send,
                jobName: SEND_JOB,
                startTime: Date.now() - 5 * hour,
                endTime: Date.now() - 5 * hour + 60000,
                hasError: "N",
                traceId,
                results: JSON.stringify({note: "spec admin private result"}),
                messages: "spec admin private message"
            })
            make(MESSAGE, {
                systemMessageId: messageId,
                statusId: "SmsgError",
                isOutgoing: "Y",
                initDate: Date.now() - 6 * hour,
                lastAttemptDate: Date.now() - 5 * hour + 30000,
                failCount: 3,
                messageText: "spec admin private payload"
            })
            make(TOPIC, {
                topic: topicId,
                description: "Spec admin topic",
                titleTemplate: "spec admin private title",
                showAlert: "N",
                isPrivate: "Y"
            })
            make("moqui.server.TopicRegistration", {
                topic: topicId,
                ownerApp: "Spec owner",
                purpose: "Spec admin purpose",
                editableFields: "showAlert",
                subscriptionPermission: "ADMIN_OPERATION_MANAGE"
            })
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.disableAuthz()
        const jobNames = Object.values(jobs)
        ec.entity.find(MESSAGE).condition("systemMessageId", messageId).deleteAll()
        ec.entity.find(LOCK).condition("jobName", "in", jobNames).deleteAll()
        ec.entity.find(RUN).condition("jobRunId", "in", Object.values(runs)).deleteAll()
        ec.entity.find(RUN).condition("jobName", "in", jobNames).deleteAll()
        ec.entity.find("moqui.server.RecoveryDescriptor").condition("descriptorKey", "specAdmJobRun").deleteAll()
        ec.entity.find("moqui.server.JobRegistration").condition("jobName", "in", jobNames).deleteAll()
        ec.entity.find("moqui.server.OperationResult").condition("operationKey", "like", "recovery:spec-adm-job%").deleteAll()
        ec.entity.find(JOB).condition("jobName", "in", jobNames).deleteAll()
        ec.entity.find(TOPIC_USER).condition("topic", topicId).deleteAll()
        ec.entity.find("moqui.server.TopicRegistration").condition("topic", topicId).deleteAll()
        ec.entity.find(TOPIC).condition("topic", topicId).deleteAll()
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "JobRunDetail shows failed items, not a success, and links no trace without System's grant; the job and topic screens tell what is registered",
    {
        when() {
            return {
                // the six screens' one render each
                runDetail: asUser(users.operations, () => page("Operations/JobRunDetail", {jobRunId: runs.send})),
                jobList: asUser(users.operations, () => page("Operations/Jobs", {term: "Spec admin"})),
                jobDetail: asUser(users.operations, () => page("Operations/JobDetail", {jobName: jobs.registered})),
                runList: asUser(users.operations, () => page("Operations/JobRuns", {jobName: jobs.plain})),
                topicList: asUser(users.configure, () => page("Operations/Topics", {term: "Spec admin"})),
                topicDetail: asUser(users.operations, () => page("Operations/TopicDetail", {topic: topicId}))
            }
        },
        then({runDetail, jobList, jobDetail, runList, topicList, topicDetail}) {
            opened(runDetail)
            runDetail.output.includes("RunEvidence") && runDetail.output.includes("RunItems")
            // without an error, and not a success: its owner's items say a message failed
            runDetail.output.includes("Ended with 1 failed item") && !runDetail.output.includes("Succeeded")
            runDetail.output.includes("Message " + messageId) && runDetail.output.includes("SystemMessageDetail")
            // the trace is Monitor's: its id, and no link for a user System's grant does not open
            runDetail.output.includes(traceId) && !runDetail.output.includes("Monitor/TraceDetail")
            !/spec admin private/.test(runDetail.output)
            opened(jobList)
            jobList.output.includes("JobList") && jobList.output.includes(jobs.registered) && jobList.output.includes(jobs.plain)
            jobList.output.includes("Spec owner") && jobList.output.includes("Not registered")
            jobList.output.includes("Failing job runs") && !jobList.output.includes("dashboards/Alerts")
            opened(jobDetail)
            jobDetail.output.includes("JobConfiguration") && jobDetail.output.includes("JobExecution")
            jobDetail.output.includes("JobParameters") && jobDetail.output.includes("JobNotifications")
            jobDetail.output.includes("as the scheduler runs it and not as you")
            jobDetail.output.includes("A second run does nothing new.")
            // its owner registered no recipient audience: none is added here
            jobDetail.output.includes("registered nobody as its recipients") && !jobDetail.output.includes("AddRecipientDialog")
            opened(runList)
            runList.output.includes("RunList") && runList.output.includes(runs.failed)
            runList.output.includes("Connection") && runList.output.includes("https://files.example.test for (address)")
            !/spec\/private|bob@/.test(runList.output)
            opened(topicList)
            topicList.output.includes("TopicList") && topicList.output.includes("Spec admin topic")
            topicList.output.includes("Private") && !topicList.output.includes("spec admin private title")
            opened(topicDetail)
            topicDetail.output.includes("TopicSubscriptions") && topicDetail.output.includes("SubscribeDialog")
            // the defaults are the configuration administrator's: the operator reads them
            topicDetail.output.includes("ADMIN_SETTINGS_MANAGE is required") &&
                !topicDetail.output.includes('name="TopicDefaults"')
        }
    }
)

feature("the operator pauses, resumes and asks for a run; a topic's default and its audience hold through the transitions", {
    when() {
        const out = {}
        const save = (user, values) =>
            post(
                user,
                "Operations/JobDetail/saveJob",
                Object.assign({jobName: jobs.registered, expectedRevision: jobRevision(jobs.registered).revision}, values)
            )
        // the reader opens the area and the configuration administrator its topics: neither changes a job
        save(users.reader, {paused: "Y"})
        save(users.configure, {paused: "Y"})
        out.untouched = row(JOB, {jobName: jobs.registered}).paused
        save(users.operations, {paused: "Y", reason: "Spec: maintenance"})
        out.paused = row(JOB, {jobName: jobs.registered}).paused
        save(users.operations, {paused: "N"})
        out.resumed = row(JOB, {jobName: jobs.registered}).paused
        // an unregistered job takes nothing
        post(users.operations, "Operations/JobDetail/saveJob", {
            jobName: jobs.plain,
            expectedRevision: jobRevision(jobs.plain).revision,
            paused: "Y"
        })
        // the System screen's own transitions for an instance administrator (a job's record changed directly) are not taken
        // in here, so they do not exist on Admin's route: for the operator, whose area grant is an inheritable always-allow,
        // and for ADMIN
        for (const user of [users.operations, users.system])
            post(user, "Operations/JobDetail/updateJob", {jobName: jobs.plain, paused: "Y", description: "Spec: changed directly"})
        out.direct = row(JOB, {jobName: jobs.plain})
        // a run outside the schedule: the job is marked due; nothing runs here
        const before = row(LOCK, {jobName: jobs.registered})
        post(users.operations, "Operations/JobDetail/runJob", {
            jobName: jobs.registered,
            expectedRevision: jobRevision(jobs.registered).runRevision,
            reason: "Spec: run it now",
            operationKey: "spec-adm-job-run"
        })
        out.lockMoved = Number(row(LOCK, {jobName: jobs.registered}).lastRunTime) < Number(before.lastRunTime)
        out.state = jobRevision(jobs.registered).state
        // a topic: the configuration administrator's default, the operator's subscription
        const topicRevision = () => String(Number(row(TOPIC, {topic: topicId}).lastUpdatedStamp))
        post(users.operations, "Operations/TopicDetail/saveDefaults", {
            topic: topicId,
            expectedRevision: topicRevision(),
            showAlert: "Y"
        })
        out.operatorDefault = row(TOPIC, {topic: topicId}).showAlert
        post(users.configure, "Operations/TopicDetail/saveDefaults", {
            topic: topicId,
            expectedRevision: topicRevision(),
            showAlert: "Y"
        })
        const subscribe = (user, username) =>
            post(user, "Operations/TopicDetail/saveSubscription", {
                topic: topicId,
                username,
                expectedRevision: "",
                receiveNotifications: "Y"
            })
        subscribe(users.configure, users.operations)
        out.configureSubscribed = row(TOPIC_USER, {topic: topicId, userId: operatorUserId})
        // outside the audience: not the configuration administrator, by the operator either
        subscribe(users.operations, users.configure)
        subscribe(users.operations, users.operations)
        // the area's other screens stay refused to the configuration administrator
        out.configureJobs = post(users.configure, "Operations/Jobs", {})
        out.configureHealth = post(users.configure, "Operations/Health", {})
        out.readerJobs = post(users.reader, "Operations/Jobs", {})
        return out
    },
    then(out) {
        out.untouched == "N"
        out.paused == "Y" && out.resumed == "N"
        row(JOB, {jobName: jobs.plain}).paused == "N"
        out.direct.paused == "N" && out.direct.description != "Spec: changed directly"
        out.lockMoved && row(LOCK, {jobName: jobs.registered}).jobRunId == null && out.state == "requested"
        system(() => find(RUN, {jobName: jobs.registered}).count()) == 0
        out.operatorDefault == "N" && row(TOPIC, {topic: topicId}).showAlert == "Y"
        row(TOPIC, {topic: topicId}).isPrivate == "Y"
        out.configureSubscribed == null
        row(TOPIC_USER, {topic: topicId, userId: "BOSS_ADM_CONFIGURE"}) == null
        row(TOPIC_USER, {topic: topicId, userId: operatorUserId}).receiveNotifications == "Y"
        row(TOPIC_USER, {topic: topicId, userId: operatorUserId}).allNotifications != "Y"
        !opened(out.configureJobs) && !out.configureJobs.output.includes("JobList")
        !opened(out.configureHealth)
        // the reader opens the area, and is told the jobs are not his
        out.readerJobs.output.includes("Jobs are not available to you") && !out.readerJobs.output.includes("JobList")
    }
})
