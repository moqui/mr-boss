---
name: marketing-campaign-summary
title: Summarizing a marketing campaign
description: Use when the user asks to summarize a campaign, its plan, budget and actual cost, its approval or what is next on it.
kind: procedure
aliases: [summarize this campaign, campaign summary, campaign results, how is the campaign going, campaign budget, is the campaign approved, campaign status, campaign schedule, what is planned for the campaign, campaign calendar]
screens: [/qapps/Marketing/Campaigns/CampaignDetail, /qapps/Marketing/Campaigns/Campaigns, /qapps/Marketing/Home, /qapps/Marketing/Calendar]
risk: reversible
---
A campaign's summary starts from Marketing's CampaignDetail, read as the signed-in user: its plan, status, organization,
dates, people, budget and costs, links, decisions, sends and, for a report reader, Results; the campaign calendar
(`/qapps/Marketing/Calendar`) shows its window, scheduled sends, automation milestones, publication dates and events. Say "not
available" for what the pages do not show the user. Never approve, start, cancel or change the campaign
for the user, and never name a recipient or an address.

## Steps
1. Open the campaign: `screen go=/qapps/Marketing/Campaigns/CampaignDetail?marketingCampaignId=<the campaign>`, or find it
   on `/qapps/Marketing/Campaigns/Campaigns` by its name.
2. Read the header (status, organization, dates, revision, budget, actual cost, manager), Summary, People, Budget and costs
   (what is left, whether it is over), Links (the lists and segments it plans with) and Decisions (who approved which revision,
   a self-approval, an approval a later change ended).
3. Say in three to five lines where the campaign stands: its status and dates, the budget against the actual cost, the
   approval of its current revision or what approval still needs ("Before approval" in the header), and the open related
   campaigns. Costs from Accounting the user may not read show as "An Accounting line": say so, never guess an amount.
4. For what is coming, read the campaign calendar's agenda (`screen go=/qapps/Marketing/Calendar`; the terminal's agenda lists the
   next four weeks): its sends by their schedule, its events and its publication dates. A send's time changes only through a new
   approval on SendDetail; never move or reschedule anything for the user.
5. Say what is next by its status: request approval of a planned campaign, start an approved one, complete one in progress
   (refused while related work is open).

## After
Offer "Log as note" to keep the summary on the campaign's conversation. A plan print as of a date is in the More menu
(Print the plan).
