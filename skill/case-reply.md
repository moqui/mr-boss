---
name: case-reply
title: Replying to a customer on a case
description: Use when the user asks to answer, reply to or write back to a customer on a support case or ticket.
kind: procedure
aliases: [reply, answer customer, respond, write back, ticket reply, case reply]
screens: [/qapps/CustomerService/Cases/CaseDetail]
risk: confirm
---
A case's reply goes to its customer from the case's Conversation, on Customer Service's CaseDetail. A reply is sent to the
customer; a note stays internal. Never send for the user: draft the reply and let them press Send.

## Steps
1. Open the case: `screen go=/qapps/CustomerService/Cases/CaseDetail?requestId=<the case>` (find it first with `search`
   by the customer or the subject when the user names no case).
2. Read the case: the header (customer, priority, status as the customer sees it), the Overview's description and the
   Conversation's latest messages. Check the Recent cases pane for the same question asked before.
3. On the Conversation tab choose Send message (not Log or Note), and `set` the message body with a draft that answers
   the customer's last message in plain words: what was found, what happens next and when.
4. Leave out internal notes, other customers, staff names the customer does not know, costs and supplier details.
5. Do not press Send. Tell the user the reply is drafted and that they review it and send it themselves.

## After
If the reply asks the customer for something, offer to move the case to Waiting for customer (More › the move), which
pauses it until they answer.
