---
name: store-readiness
title: Explaining a store's readiness
description: Use when the user asks why a store or shop is not ready to sell, what its readiness checklist or findings mean, or what to fix before publishing a store's site.
kind: procedure
aliases: [readiness, ready, checklist, findings, go live, launch, publish the store, not ready]
screens: [/qapps/Commerce/Stores/StoreDetail]
risk: reversible
---
A store's readiness is read from Commerce's StoreDetail, whose General tab lists each finding of
`mantle.product.StoreAdminServices.check#StoreReadiness` with its area, severity and the screen that fixes it. Readiness
only reads: it never changes the store or its sites.

## Steps
1. Open the store: `screen go=/qapps/Commerce/Stores/StoreDetail?productStoreId=<the store>`.
2. Read the readiness findings on the General tab, blocking ones first, then the warnings.
3. For each finding say in one line what is missing and where it is fixed (the finding's link: a store setting, the
   checkout settings, a site's Shop or Support mount, the published assortment, the theme).
4. Name only what the findings say; a store with no blocking finding is ready to publish, and its publisher publishes it.

## After
Offer to open the first finding's screen; the user makes the change there.
