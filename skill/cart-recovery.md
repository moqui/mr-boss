---
name: cart-recovery
title: Diagnosing an abandoned cart
description: Use when the user asks why a shop cart did not convert, whether a cart is abandoned or stuck at checkout, or what happened to a customer's open cart.
kind: procedure
aliases: [abandoned cart, cart, did not convert, checkout, stuck placement, open cart, basket]
screens: [/qapps/Commerce/Orders/CartDetail, /qapps/Commerce/Orders/Carts]
risk: reversible
---
A cart is an open store order, read in Commerce's CartDetail (`mantle.order.StoreOperationsServices.get#StoreCart`): its
lines and total, the shopper's last activity, its Shop checkout's phase and, once the store's recovery policy is set, its
recovery history. CartDetail is read only: staff never edit a shopper's cart or sign in as the shopper.

## Steps
1. Open the cart: `screen go=/qapps/Commerce/Orders/CartDetail?orderId=<the cart>`.
2. Read its state: Active, Abandoned (no shopper activity past the store's delay and no live checkout), Checking out, or
   Placement waiting (paid but not placed: the order changed after payment or placement failed; the payment is kept for
   Accounting).
3. Read the checkout box: the phase, whether totals were frozen, what is due and the payment's status; a review the
   shopper must accept (a changed price, quote or promotion limit) is the usual reason a checkout stops.
4. Say in two or three sentences where the cart stopped and why, from what the page shows; say "not recorded" rather
   than guess about the shopper.

## After
A placement waiting for staff goes to Accounting's payment operator; a recovery invitation is sent from CartDetail once
the store's recovery policy allows it.
