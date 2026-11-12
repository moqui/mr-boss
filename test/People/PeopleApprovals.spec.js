// People's approvals (impl-people P5; design-people §12 ApprovalPolicies and Lookups, §13 Approvals): Approvals, the Commons
// Notifications list mounted with People's approval topics, listing a position's activation for its department head
// (people.manager, Hannah, the lead of Store Operations) and not another app's approval sent to her; Approval rules' one qvt render
// for the People administrator with the route of an example explained (no rule yet: the department head); Lookups' one qvt render
// with the termination reasons. The rules themselves are Mantle's PeopleApprovals; the usable walk is the acceptance
// PeopleApprovalsUsable. The request this spec makes is refused at its end and the other app's notice read, so the demo keeps no
// waiting decision.
// Run: ./moq test mr-boss --spec PeopleApprovals
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const S = "mantle.humanres.PositionServices."
const made = {}

spec({
    setupSpec() {
        login("john.doe")
        // a planned seat of Store Operations asked to be activated by the HR officer, and a purchase approval sent to Hannah
        const position = asUser(users.hr, () =>
            system(() =>
                invoke(S + "store#Position", {
                    organizationPartyId: ids.organizationId,
                    departmentPartyId: ids.departmentId,
                    emplPositionClassId: ids.jobClassId,
                    description: "Approvals spec greeter"
                })
            )
        )
        made.emplPositionId = position.emplPositionId
        made.request = asUser(users.hr, () =>
            system(() =>
                invoke(S + "request#PositionApproval", {
                    emplPositionId: position.emplPositionId,
                    expectedRevision: position.revision,
                    justification: "Weekend greeter"
                })
            )
        )
        made.managerUserId = system(() =>
            ec.entity.find("moqui.security.UserAccount").condition("username", users.manager).one()
        ).userId
        made.otherNotice = system(() =>
            ec
                .makeNotificationMessage()
                .topic("PurchaseOrderApproval")
                .message({
                    orderId: "PPL_APR_SPEC_PO",
                    sourceRevision: 1,
                    supplierName: "Spec supplier",
                    amountText: "1",
                    stepText: "one approval"
                })
                .record("mantle.order.OrderHeader", "PPL_APR_SPEC_PO")
                .userIds([made.managerUserId])
                .send()
                .getNotificationMessageId()
        )
    },
    cleanupSpec() {
        // the request refused and the other notice read, so no decision waits in the demo
        asUser(users.manager, () =>
            system(() =>
                invoke(S + "decide#PositionApproval", {
                    emplPositionId: made.emplPositionId,
                    decision: "refuse",
                    reason: "Spec done"
                })
            )
        )
        system(() =>
            ec.service
                .sync()
                .name("update#moqui.security.user.NotificationMessageUser")
                .parameters({
                    notificationMessageId: made.otherNotice,
                    userId: made.managerUserId,
                    viewedDate: ec.user.nowTimestamp
                })
                .call()
        )
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("Approvals lists the department head's position activation and not another app's approval sent to them", {
    when() {
        return {request: made.request, rendered: asUser(users.manager, () => page("Approvals"))}
    },
    then({request, rendered}) {
        request.statusId == "PapPending"
        request.waitingText == "Waiting for Hannah Okafor"
        rendered.status == 200
        rendered.errors == []
        rendered.output.includes("Approvals")
        rendered.output.includes("Approve the activation of position Approvals spec greeter")
        !rendered.output.includes("Spec supplier")
    }
})

feature("Approval rules explain the route of an example request: with no rule, the head of the seat's department decides", {
    when() {
        return asUser(users.admin, () =>
            page("Settings/ApprovalPolicies", {
                organizationPartyId: ids.organizationId,
                approvalKindEnumId: "PakPosition",
                departmentPartyId: ids.departmentId,
                preview: "Y"
            })
        )
    },
    then({status, errors, output}) {
        status == 200
        errors == []
        output.includes("Approval rules")
        output.includes("New rule")
        output.includes("No rule yet")
        output.includes("No rule: the head of the department decides")
        output.includes("Department head of Store Operations: Hannah Okafor")
    }
})

feature("Lookups lists a vocabulary's values with their use for the People administrator", {
    when() {
        return asUser(users.admin, () => page("Settings/Lookups", {enumTypeId: "SkillLevel"}))
    },
    then({status, errors, output}) {
        status == 200
        errors == []
        output.includes("Skill levels")
        output.includes("Proficient")
        output.includes("Add value")
    }
})
