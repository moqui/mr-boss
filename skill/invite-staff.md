---
name: invite-staff
title: Inviting staff
description: Use when an administrator asks to add a staff user, give someone a login or account, or invite or re-invite a person to IronStone BOSS.
kind: procedure
aliases: [add user, new user, create user account, add a login, new staff, invite user, invite staff, onboard, resend invitation, revoke invitation]
screens: [/qapps/Admin/Users/Invitations, /qapps/Admin/Users/InviteStaff]
risk: confirm
---
In IronStone BOSS staff are invited, not created with a password: the person gets a link that works once, signs in with
the account of that address or creates their own, and receives the organization and the access the invitation names.
Do not use System › Security's Create User Account for staff; it skips the organization, the grant checks and the
invitation. Every step checks the administrator's own permissions: `ADMIN_IDENTITY_MANAGE` and an organization they
administer. Never write a password or an invitation link into chat, a view or a tool call.

## Steps
1. Ask for the person's email address, name, organization and what they need to do (the app and role); IronStone BOSS
   users is always included.
2. Check the address is not already invited: `screen go=/qapps/Admin/Users/Invitations?text=<address>`. A pending one:
   offer Resend on its row instead (the earlier link stops working). An accepted one: the person has access; changes are
   on their UserDetail. An address of another organization's staff or of a customer's site account needs
   identity-global authority (`ADMIN_IDENTITY_GLOBAL`); without it the invitation is refused with that reason.
3. `screen go=/qapps/Admin/Users/InviteStaff`, `set` Email, First name, Last name, Organization and Access (only the
   bundles offered there; privileged and sealed access is never offered), and an optional note.
4. Do not press Send invitation. Tell the administrator the form is filled and that they check the access and send it.
5. With no mail server, Invitations shows the acceptance link once after sending, as text with a copy button: the
   administrator copies it and passes it to the person themselves; you never read it out. A lost link is replaced by
   Resend.

## After
Say who was invited, to which organization and access, and when the link expires (7 days by default). Revoke on the row
withdraws an invitation; an exceptional direct account without an invitation is Users' New staff account.
