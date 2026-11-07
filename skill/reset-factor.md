---
name: reset-factor
title: Resetting a user's sign-in
description: Use when an administrator asks why a staff user cannot sign in, or to reset a user's password, factor or sign-in lock, or sign out a lost device.
kind: procedure
aliases: [cannot sign in, locked out, lost phone, reset factor, reset two-factor, reset password, sign-in lock, sign out everywhere]
screens: [/qapps/Admin/Users/UserDetail]
risk: reversible
---
A staff user's sign-in is administered on Admin's UserDetail, for the identities of the organizations the administrator
administers. Every action checks the administrator's own permissions: `ADMIN_IDENTITY_MANAGE`, and `ADMIN_IDENTITY_GLOBAL`
for an account-wide change of an identity that also works for an organization the administrator does not administer.
Admin never sets or shows a password, factor secret or recovery code.

## Steps
1. Open the user: `screen go=/qapps/Admin/Users/UserDetail?userId=<the user>`; if the user is not there, they are not in
   the administrator's organizations: say so and stop.
2. Read the header's state (Locked, Disabled, Ended, Password change required, IP limited, Shared identity) and the
   Sessions and history box's latest sign-ins to name the cause.
3. Offer the one action that fixes it, on the Credentials box, and let the administrator confirm it there:
   - a forgotten password: Send password reset (the user gets a reset password that only sets a new one; the current
     password stays valid);
   - a lost or replaced authenticator: Reset on that factor (the user enrols a new one at the next sign-in);
   - too many failed sign-ins: Release sign-in lock;
   - a lost device: Sign out on its session, or Revoke all access (sessions, keys, app passwords, SSH keys and phones;
     the account stays enabled).
4. A disabled or ended account is restored through its lifecycle, not here; allowed IPs are on the Account box.

## After
Say what was done and what the user does next (check their mail, enrol a factor, sign in again). Offer "Log as note" to
file the explanation on the account.
