---
name: maintenance-report-problem
title: Reporting a maintenance problem
description: Use when the user wants to report a problem, fault, breakdown or leak on equipment, a vehicle, a room or a building, or asks for something to be fixed.
kind: procedure
aliases: [report a problem, something is broken, broken, not working, fault, breakdown, leak, leaking, repair, fix, out of order, maintenance request]
screens: [/qapps/Maintenance/Home, /qapps/Commons/ReportProblem, /qapps/Maintenance/Equipment/EquipmentDetail, /qapps/Maintenance/Facilities/FacilityDetail]
risk: confirm
---
A problem is reported in Commons' Report a problem, as the signed-in user: it becomes a maintenance request of their
organization with exactly one piece of equipment or one facility, which a maintenance planner triages into a work order.
Only a user with Report a problem is offered the screen; Maintenance checks again when it is sent. A report is not a work
order: never open New work order for it.

## Steps
1. Ask what is wrong, on which equipment or in which room or building, and how urgent it is, if the user has not said.
2. On an equipment's or a facility's page, open the form for that record: `screen go=/qapps/Commons/ReportProblem?recordEntity=<the
   page's entity>&recordId=<its id>`; otherwise `screen go=/qapps/Commons/ReportProblem` and `set` Equipment or facility from
   its drop-down (only what the user's organizations have is offered; a tag the user scans fills it too).
3. `set` What is wrong (one short line), Details (what was seen, where, since when) and Urgency: Urgent only when it stops
   work or is unsafe, Normal otherwise, Low when it can wait.
4. Do not press Report problem. Tell the user the form is filled and that they check it, add a photo if they have one, and
   send it.

## After
Say that the request is followed in Commons' Requests, where its state and the work order it was linked to show; the user
is not told the work order's time or cost. Something unsafe is also said to a person at once: a report is not an alarm.
