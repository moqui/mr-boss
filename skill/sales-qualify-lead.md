---
name: sales-qualify-lead
title: Qualifying a sales lead
description: Use when the user wants to qualify, convert or promote a sales lead into an opportunity, or asks whether a lead is ready to qualify.
kind: procedure
aliases: [qualify lead, qualify this lead, convert lead, promote lead, turn the lead into an opportunity, lead to deal, is this lead qualified]
screens: [/qapps/Sales/Pipeline/OpportunityDetail, /qapps/Sales/Pipeline/Leads]
risk: confirm
---
A lead is qualified on Sales' OpportunityDetail, as the signed-in user: Qualify keeps the same record, with its inquiries,
activities, files and conversation, and makes it an opportunity of an account. Only a user who edits opportunities is offered
Qualify, and Sales checks the account, contact, stage and owner again. Never press Qualify for the user: it is the step they
approve.

## Steps
1. Open the lead: `screen go=/qapps/Sales/Pipeline/OpportunityDetail?salesOpportunityId=<the lead>`, or find it on Leads
   (`screen go=/qapps/Sales/Pipeline/Leads`) by its name. Read its Inquiries box: what the inquirer gave (name, organization,
   email, phone), until it is purged.
2. Open the Qualify dialog. If the inquirer's organization is already an account, `set` Existing account from its drop-down
   (only accounts of the user's organizations are offered); otherwise `set` Or a new prospect to the organization's name. For the
   person, `set` Existing contact when the account has them, otherwise the new contact's first and last name and email from the
   inquiry.
3. `set` the Stage the conversation has reached, and the Amount, Currency and Expected close when the user has said them; leave
   the owner as it is unless the user names another.
4. Do not press Qualify. Tell the user what you filled and that Qualify asks them to confirm.

## After
Say that the deal now shows on Opportunities and the board, with the same activities and files; the next step is usually an
activity (Schedule activity) or, once quotes are set up, a quote.
