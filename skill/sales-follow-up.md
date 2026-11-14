---
name: sales-follow-up
title: Following up on a sales deal
description: Use when the user asks to draft a follow-up on a deal or lead, what changed on a deal since its last activity, or its next step.
kind: procedure
aliases: [follow up, follow-up, draft a follow-up, next step on the deal, what changed on this deal, chase the customer, nudge the prospect, schedule a follow-up]
screens: [/qapps/Sales/Pipeline/OpportunityDetail, /qapps/Sales/Accounts/Customer360, /qapps/Sales/Home]
risk: reversible
---
A deal's follow-up starts from Sales' OpportunityDetail, read as the signed-in user: its stage, amount, expected close, people,
activities and conversation. A message to the customer is sent from the user's own mail (Comms Compose) and an activity is a
task on the deal; never send mail or change the deal for the user.

## Steps
1. Open the deal: `screen go=/qapps/Sales/Pipeline/OpportunityDetail?salesOpportunityId=<the deal>`, or on an account's
   Customer360 read its Sales summary's open deals.
2. Read the header (stage, amount, expected close, owner), People (the contacts), Activities (the last one done and the next
   open one) and Conversation (the last messages and notes). Say what changed since the last activity in two or three lines;
   say "not recorded" rather than guess.
3. To draft a follow-up: write a short message to the deal's contact about the next step, in the user's words and language,
   naming only what the page shows (never an internal note, a discount or another customer). Offer "Send as message" for a
   colleague, or for the customer copy it into Compose from the contact's email.
4. To schedule the next step: `screen go=/qapps/Sales/QuickCreate/NewActivity?salesOpportunityId=<the deal>` and `set`
   Activity and Due; the user presses Schedule.

## After
Offer "Log as note" to keep the summary on the deal's conversation. An expected close in the past is worth moving with the
user, from Edit on the deal.
