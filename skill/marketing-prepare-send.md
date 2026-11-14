---
name: marketing-prepare-send
title: Preparing a send for approval
description: Use when the user wants a campaign email written, tested, prepared or put up for approval, or asks what a send still needs before it can go out.
kind: procedure
aliases: [prepare this send, get this send ready, ask for approval of this send, send a test, test this email, what does this send still need, why can't this send be approved, use this template for a send, write a newsletter]
screens: [/qapps/Marketing/Sends/SendDetail, /qapps/Marketing/Sends/Compose, /qapps/Marketing/Sends/Sends, /qapps/Marketing/Sends/MessageTemplates]
risk: reversible
---
A send reaches no one until it is prepared, approved by another person and released by a dispatcher. Work as the signed-in user:
the pages show only their organizations' sends. Never approve, release or send anything for the user, never add a recipient by
hand, and never put a link to a staff page or a stored file in a body: attach the file instead. A test goes only to an address
of the organization's test list.

## Steps
1. Find the send on `/qapps/Marketing/Sends/Sends`, or start one: New send (its campaign, a name, its topic list, a template and
   the sending profile), or Use on a published template in `/qapps/Marketing/Sends/MessageTemplates`.
2. Open Compose (`screen go=/qapps/Marketing/Sends/Compose?campaignSendId=<the send>`): the subject, preheader, body, text
   alternative and variables. firstName, lastName and fullName are each recipient's own; any other variable needs a fallback, and a
   required one with no fallback stops the preparation. Offer the editor's inline text actions for a rewrite; a draft is the
   user's to save.
3. Read the preview and its findings (an empty subject, no text alternative, a variable with no value). Offer Send a test to an
   address of the test list; the test is marked TEST and counts nowhere.
4. On SendDetail read Summary's "Before approval" list: a preparation at the current revision, an eligible recipient, an approved
   campaign and a ready promotional sending profile. Prepare selects the recipients now; explain the Audience buckets (see the
   audience check skill) and the eligible count.
5. When nothing is missing, the user asks for approval with Request approval; an approver decides. Any later change of the
   subject, body, sender, audience or schedule ends the approval: prepare and ask again.

## After
Say in three to five lines what the send is, how many it would reach, what it still needs and who acts next. Offer "Log as note"
on the send.
