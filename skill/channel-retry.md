---
name: channel-retry
title: Resolving failed channel messages
description: Use when channel or marketplace orders failed to import, to group an integration's failures by cause, or to explain conflicts and retry failed messages.
kind: procedure
aliases: [integration, channel, marketplace, failed message, intake error, import failed, retry, conflict, duplicate, quarantined, EDI exception]
screens: [/qapps/Commerce/Integrations/IntegrationDetail, /qapps/Commerce/Integrations/Integrations, /qapps/Commerce/Integrations/ChannelImport]
risk: reversible
---
An integration is a store's binding to a registered connector, read in Commerce's IntegrationDetail
(`mantle.product.StoreChannelServices.get#StoreIntegration` and `find#StoreMessages`). Each channel order is its own
message, kept by the store, the integration, the kind and the external ID: a replay with the same content is a
Duplicate that answers the original order; one with other content is a Conflict, quarantined with what differs; a
Failed one names its first error. Message text, credentials and the endpoint's secrets are never shown and never asked
for.

## Steps
1. Open the integration: `screen go=/qapps/Commerce/Integrations/IntegrationDetail?systemMessageRemoteId=<integration>&state=failed`.
2. Group the failed messages by the code at the start of their error (ITEM_UNAVAILABLE, ITEM_UNKNOWN, CURRENCY_MISMATCH,
   MAPPING_INCOMPLETE, LINE_QUANTITY_INVALID, ...), with the count and two or three external IDs of each.
3. For each group say what fixes it, from what the page shows: publish the product in the store (Merchandising), set the
   integration's customer in Mapping, or ask the channel to resend a corrected order under a new external ID.
4. Conflicts are not retried: say which original each conflicts with and what differs, for the user to take up with the
   channel. Duplicates need nothing: they already answer their original.
5. Only once the cause is fixed, the user retries the failed messages from RetryMessages with a reason; each keeps its
   message and external ID, and an order already made is never made again.

## After
An EDI partner's rejected and quarantined transactions are listed on the same page and retried the same way; its
connection and profile are the EDI administrator's. A file import's failed orders are retried from the integration
too (ChannelImport's result links it).
