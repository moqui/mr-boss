---
name: people-leave-balance
title: Explaining a leave balance
description: Use when the user asks how much leave they have, why their balance is what it is, what a leave request charges or reserves, or what is left after it.
kind: procedure
aliases: [leave balance, time off left, holiday left, vacation days, annual leave, days off, pto, how much leave, what is left, reserved, pending leave, leave taken, accrual]
screens: [/qapps/People/Time/LeaveRequestDetail, /qapps/People/Time/LeaveRequests, /qapps/People/Time/LeaveBalances, /qapps/People/SelfService, /qapps/Commons/People/SelfService]
risk: reversible
---
A leave balance is read from People's ledger, as the signed-in user: the `people_my_leave_balances` tool answers their own
balances alone (each employment and leave type: what was granted, accrued, taken, expired and adjusted, the balance, what the
requests waiting for approval reserve, and what is available). It only reads. Never guess a number the tool did not give, and
never read or repeat a leave reason: it is the person's, their approvers' and HR's, and it is not shared with AI.

## Explain a balance
1. Call `people_my_leave_balances` (a `leaveTypeEnumId` narrows it; `asOfDate` reads a past or a future date).
2. Say the balance as movements: granted and accrued, less taken and expired, plus or minus adjustments. Then what is
   reserved: requests waiting for approval hold their days until they are decided. Available is the balance less that.
3. A policy may let a balance go below zero by its negative limit; a policy that needs no entitlement keeps no balance.

## Explain a request
1. On a request's page (LeaveRequestDetail) read its balance statement and days from the page: each day charges what the
   person's working schedule plans for it (a whole day, or half for a morning or an afternoon), a weekend day or a holiday
   nothing.
2. Waiting: its days are reserved; approved: they are taken; cancelled: they were given back once.
3. Another person's balance (an approver or HR on their request) is on the page only; the tool answers the user's own.

## After
Say what is available now and what the next request would leave. To ask for time off, the user opens Leave requests and
Request leave; the preview shows the days, the balance and who approves before anything is asked.
