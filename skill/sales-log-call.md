---
name: sales-log-call
title: Logging a call on a sales deal
description: Use when the user wants to log, record or note a phone call with a customer or prospect on a lead or opportunity.
kind: procedure
aliases: [log a call, log call, record a call, I just called, call notes, note the call, called the customer, spoke to the prospect]
screens: [/qapps/Sales/Pipeline/OpportunityDetail, /qapps/Comms/Calls/Call, /qapps/Comms/Calls/Voicemail]
risk: reversible
---
A call is logged on a lead or opportunity the user sees and edits: a phone communication filed on the deal's conversation, with
when it was, how long, which contact and what it was about. From a call or a voicemail in Comms, Log call on opportunity
opens the same dialog. Logging changes no field of the deal.

## Steps
1. From a call or voicemail, use its Log call on opportunity action; otherwise open the deal:
   `screen go=/qapps/Sales/Pipeline/OpportunityDetail?salesOpportunityId=<the deal>` and use Log call there if offered, or
   `screen go=/qapps/Sales/Pipeline/LogCall?salesOpportunityId=<the deal>`.
2. `set` Direction (in or out), the contact when the deal has one, when the call was (not ahead of now) and its length in
   minutes, and a summary of what was said and agreed, in the user's words.
3. Do not press Log call for the user. Tell them what you filled.

## After
If the call agreed a next step, offer to schedule it as an activity on the deal; if it moved the deal, the user changes its
stage with Change stage.
