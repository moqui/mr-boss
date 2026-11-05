---
name: case-summary
title: Summarizing a case
description: Use when the user asks for a summary, recap or handover of a support case or ticket and what happened on it.
kind: procedure
aliases: [summary, summarize, recap, handover, what happened, case history, ticket summary]
screens: [/qapps/CustomerService/Cases/CaseDetail]
risk: reversible
---
A case's summary is read from Customer Service's CaseDetail: its facts, conversation, work and linked records. It is
written in chat (or as an internal note when the user asks for one), never sent to the customer.

## Steps
1. Open the case: `screen go=/qapps/CustomerService/Cases/CaseDetail?requestId=<the case>`.
2. Read the header (customer, queue, priority, assignee, status and the label the customer sees), the Overview (the
   description, contact, linked orders and other records, tags), the Work tab (each work item's status) and the
   Conversation, oldest first.
3. Write the summary in four parts: the customer's problem in one sentence; what was done and said, in order, with dates;
   where it stands now (status, who has it, what is waited for); and the next step.
4. Name only what the case shows; say "not recorded" rather than guess.

## After
To keep it on the case, offer to post it as a note on the Conversation (Note, internal); the user presses Save.
