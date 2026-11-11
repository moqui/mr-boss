---
name: insights-analyst
title: Answering a business number
description: Use when the user asks what a dashboard number means, for a count or total by some grouping, a comparison with last period, or which data source is stale.
kind: procedure
aliases: [kpi, metric, how many, how much, total, by currency, compare, last period, last month, trend, dashboard number, stale, data readiness, source lag]
screens: [/qapps/Insights/Dashboard, /qapps/Insights/ReportBuilder/Explore, /qapps/Insights/Reports]
risk: reversible
---
Insights answers a number from an admitted business dataset, as the signed-in user: the report engine applies the
dataset's admission, its row filter (the user's own organizations) and its guards, so the answer is the one their
dashboard shows. Every tool here only reads. Costs and margins are answered only to a user who may see them; a refusal
is the answer to give, never something to work around.

## Tools
- `insights_find_reports`: the catalog reports the user reads, with each one's owner, basis and route.
- `insights_get_metric`: what a registered measure means (owner, grain, basis, unit policy, exclusions, comparison
  rules), by `metricId`, or by the dashboard `definitionId` and `panelId` of the number on the page.
- `insights_panel`: a dashboard panel's own numbers, by the dashboard's `definitionId` and the panel's `panelId`, with
  `from`, `thru` and `organizationPartyId`. It runs the panel's saved query, so the answer is the dashboard's.
- `insights_datasets`: the datasets that can be asked and, with a `datasetId`, its measures, groups and filters.
- `insights_query`: one aggregate from typed choices: `datasetId`, `aggregate` (count, sum, avg, min, max,
  cardinality), `measureField`, `groupBy`, `groupBy2`, `timeGrain` (day, week, month, quarter, year), `filterField`
  with `filterValue`, `from` and `thru` (relative, as `now-30d`, `now-1M/M`, `now/M`, or ISO dates), and
  `organizationPartyId` for one of the user's organizations.
- `admin_get_readiness` with `ownerApp: "Insights"`: each source's state, last rebuild and lag.

## Steps
1. **Explain this number.** Call `insights_get_metric` for the panel on the page (the page's `definitionId` and the
   panel). Say what it measures, its basis and scope, its unit policy and what it leaves out, in the owner's words. A
   panel without a registered measure has no stated meaning: say so and describe only its query.
2. **A number that is on a dashboard** (orders, order value, open cases, checkouts on Suite overview, `insights-suite`;
   the page's own dashboard when one is open). Call `insights_panel` for that panel and range. Its saved filters and
   exclusions apply (orders leave out recurring base orders), which a new query would miss.
3. **Any other count or total.** Call `insights_datasets` to find the dataset and its fields, then `insights_query`.
   - An amount is never added across currencies: group by the currency field (`groupBy: "currencyUomId"`) or filter to
     one. `UNIT_MIXED` means this was missed; ask again grouped, do not convert.
   - Never average a ratio or add a balance across its dates; the engine refuses (`RATIO_AGGREGATE`, `NONADDITIVE`).
   - "Last month" is `from: "now-1M/M"`, `thru: "now/M"`; "this month" `from: "now/M"`, `thru: "now"`.
4. **Compare with last period.** Run the same panel or query twice, changing only `from` and `thru` (the period before
   has the same length). Give both values and the difference for each currency or unit apart. An empty period is "no
   records", not zero growth.
5. **Which source is stale?** Call `admin_get_readiness` with `ownerApp: "Insights"`. Name each source that is not
   ready with its lag, and say that its dataset steward can request a rebuild on Insights › Settings › Data readiness.
   Unavailable is not the same as stale, and neither is zero.
6. Give the result as a short table with its range, its scope (the organizations) and the number of source records
   (`sourceCount`). End an answer that came from `insights_query` with that result's `panel` line, unchanged, on a line
   of its own: it is what "Add to my dashboard" saves.

## Refusals
- `DATASET_UNAVAILABLE`: the dataset is not admitted, not the user's to read, or not open to Assist. Say so.
- `DATASET_RESTRICTED`, `FIELD_RESTRICTED`: costs and margins need a permission the user does not hold. Say so; do not
  derive a cost another way.
- `ORGANIZATION_UNAVAILABLE`: the organization is not one of the user's.

## After
Offer "Add to my dashboard" for a number worth keeping (it needs Insights authoring), or the dashboard or catalog report
that already shows it.
