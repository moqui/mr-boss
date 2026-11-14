---
name: sales-issue-quote
title: Issuing and sending a sales quote
description: Use when the user checks, proposes or sends a sales quote, resends it, or records the customer's acceptance or decline of it.
kind: procedure
aliases: [send the quote, issue the quote, propose the quote, resend the quote, email the quote to the customer, check this quote, record the acceptance, customer accepted the quote, customer declined the quote, quote cover note]
screens: [/qapps/Sales/Orders/OrderDetail, /qapps/Sales/Quotes/Quotes]
risk: confirm
---
A quote is offered in two steps on Sales' OrderDetail, read as the signed-in user: Propose fixes its lines (they then change only
through Revise), and Send issues it at its revision, stores its PDF and mails it. A quote whose seller does not count commercial
changes only cannot be sent; the page says so. Never send, accept or decline for the user: they press the button.

## Steps
1. Open the quote: `screen go=/qapps/Sales/Orders/OrderDetail?orderId=<the quote>`, or find it with the `sales_find_quotes` tool.
2. Check it before sending, in a few lines: the customer and contact, each line's price and its source (an entered price shows its
   reason), the totals and the tax note (a storeless quote with no address is taxed at the customer's address when it is
   proposed), the validity (a quote needs an end date in the future), and the Approval box (the `sales_preview_quote` tool):
   every rule must be approved before it can be proposed. Say what is missing; never guess a cost or margin, which is not shown.
3. A draft with lines shows Propose as its primary action; a proposed quote shows Send. Send opens a preview: who it goes to
   (the customer and its contacts, each with an email or "no email address"), from whose mail, and the PDF's name. A contact with no
   email fails; after the user adds one, Send again reaches that contact alone and keeps the same issue.
4. To draft the cover note: two or three sentences to the contact in the user's words, naming the quote, what it covers and its
   validity; the user pastes it into Send's Message.
5. When the customer answers, the user records it: Record acceptance (who, when, their purchase order, a file of the quote as
   evidence) places the order through the usual rules; Record decline needs the customer's reason and cancels the quote.

## After
A delivered mail is not the customer's acceptance. To change a sent quote use Revise (its issue ends and the sent PDF stays
in Files), then Propose and Send again; Withdraw cancels it.
