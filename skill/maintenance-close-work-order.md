---
name: maintenance-close-work-order
title: Completing and closing a work order
description: Use when the user asks what blocks a maintenance work order from completing or closing, what is left to do on it, or how to finish, complete or close it.
kind: procedure
aliases: [what blocks completion, blockers, finish the work order, complete the work order, close the work order, what is left, open steps, required steps, cannot complete, why can't I close]
screens: [/qapps/Maintenance/WorkOrders/WorkOrderDetail]
risk: confirm
---
A work order's completion is read from Maintenance's WorkOrderDetail as the signed-in user: the Lifecycle dialog lists each
action open from its status, each allowed or with why not, and Complete's blockers. Only the lifecycle moves a work order;
never change its status, steps or assignments any other way, and never press Complete or Close for the user.

## Steps
1. Open the work order: `screen go=/qapps/Maintenance/WorkOrders/WorkOrderDetail?workEffortId=<the work order>`.
2. Read the header (status, target, planned window, a hold's reason, whether the target is out of service) and the
   Lifecycle dialog's Complete and Close: allowed, or the reason it is not (a running timer, the user's authority, an
   approval waiting).
3. Read the tabs that hold blockers: Procedure (the required steps not done, a failed check waiting for a correction or a
   waiver), Parts (parts planned and not issued or returned), Purchasing (outside service not accepted) and Downtime (an
   open outage that Complete asks the equipment's state for).
4. Say each blocker in one line with the tab that clears it and who may clear it (the technician responds to a step, a
   supervisor waives one that allows it). Name only what the page shows; say "not recorded" rather than guess.

## After
Offer to open the tab of the first blocker; the user acts there and then presses Complete, which asks for the outcome and
the equipment's state. Costs are never part of the answer, even when the user may see them.
