---
name: maintenance-equipment-history
title: Summarizing an equipment's maintenance history
description: Use when the user asks for the maintenance or repair history of equipment or a machine, what was done to it, how often it fails or when it was last serviced.
kind: procedure
aliases: [equipment history, maintenance history, repair history, service history, what was done, last serviced, how often does it break, failures, past work orders, asset history]
screens: [/qapps/Maintenance/Equipment/EquipmentDetail]
risk: reversible
---
An equipment's history is read from Maintenance's EquipmentDetail as the signed-in user: only what their Maintenance scope
shows (a technician sees the work assigned to them). It only reads. Costs, supplier prices and rates are left out of the
summary even when the user may see them; the Book tab is Accounting's and is not read.

## Steps
1. Open the equipment: `screen go=/qapps/Maintenance/Equipment/EquipmentDetail?assetId=<the equipment>`.
2. Read the header (name, model, facility, custodian, whether it is out of service), the Maintenance tab (its work orders,
   newest first, with kind, status and dates; its maintenance records; its preventive plans with the next due), the Meters
   tab (the last readings) and Equipment's Downtime list for it (outages with their cause and restoration).
3. Write the summary in four parts: what the equipment is and where; corrective work and outages in order, with dates and
   the failure where recorded; preventive work and what is due next; what is open now.
4. Name only what the pages show; say "not recorded" rather than guess, and give counts only from the rows read.

## After
Offer to open the newest open work order, or to report a new problem on the equipment (Report a problem), which the user
sends themselves.
