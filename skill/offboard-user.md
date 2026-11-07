---
name: offboard-user
title: Offboarding a staff user
description: Use when a staff user leaves: disable or restore them, end access at a date, remove them from one organization, or give their drives to a new owner.
kind: procedure
aliases: [offboard, leaver, deactivate user, disable account, remove from organization, end access, terminate access, restore account, transfer ownership, new owner]
screens: [/qapps/Admin/Users/UserDetail, /qapps/Admin/Users/LifecycleDetail, /qapps/Admin/Users/LifecycleOperations]
risk: confirm
---
A staff user's lifecycle is administered on Admin's UserDetail, in its Lifecycle box, for the identities of the organizations
the administrator administers. Every operation checks the administrator's own permissions: `ADMIN_IDENTITY_MANAGE`, and
`ADMIN_IDENTITY_GLOBAL` to disable or restore an identity that also works for an organization the administrator does not
administer. An account holding a privileged group or a sealed permission the administrator lacks is refused, as is the
administrator's own account. Nothing is deleted: memberships, history and records stay.

## Choose the operation
- **Remove from organization**: the user leaves one organization but still works for another. Only that organization's
  relationships end; their account, other access and owned resources stay. When no organization is left, their group
  memberships end too and owned shared resources wait for a new owner.
- **Disable**: the user leaves. With no date it acts at once: signed out everywhere, keys, app passwords, SSH keys and
  phones revoked, agent triggers paused and the account disabled. With a date, sign-in stops then (the account's end date).
  Owned shared drives, calendars, contact books and mail accounts wait for a new owner; open assignments wait to be
  reassigned.
- **Restore**: enables a disabled account and clears its end date. Nothing revoked comes back: the user makes new keys and
  app passwords, and ended memberships and paused schedules stay as they are.

## Steps
1. Open the user: `screen go=/qapps/Admin/Users/UserDetail?userId=<the user>`; if the user is not there, they are not in
   the administrator's organizations: say so and stop.
2. In the Lifecycle box choose Disable, Remove from organization or Restore, with the date and the reason, and Review.
3. Read the review with the administrator: what ends, the live sessions and credentials, what waits for a new owner, or why
   it is refused. The administrator confirms it there; never confirm for them.
4. The operation opens on LifecycleDetail. For each resource waiting for a new owner, offer Transfer with a colleague of the
   same organization who can sign in; the owner app checks they may own it. Retry a failed step once its cause is fixed; a
   failed step never undoes the access already revoked.
5. Several leavers at once: Users' Disable users reviews each one, and each is its own operation.

## After
Say what was done, what still waits (LifecycleOperations lists every operation that needs attention) and who acts next.
Offer "Log as note" to file the reason on the account.
