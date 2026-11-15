---
name: marketing-audience-check
title: Explaining a segment or an audience
description: Use when the user asks who a segment finds and why, or who a send to a list would reach and why people are left out.
kind: procedure
aliases: [explain this segment, who is in this segment, why is this person not in the segment, audience preview, who will receive this, why were recipients excluded, how many people can we email, who on this list can we email, how many on the list can we reach]
screens: [/qapps/Marketing/Audiences/SegmentDetail, /qapps/Marketing/Audiences/AudiencePreview, /qapps/Marketing/Audiences/Segments]
risk: reversible
---
A segment finds people; it never subscribes anyone, and a send still needs each person's accepted membership of its topic list,
an evidenced consent and an address that is not suppressed. Read the pages as the signed-in user: they show only the people and
the sources that user may see. Never add or remove a member, change a rule or subscribe anyone for the user, and never repeat a
whole address unless the page shows it to the user.

## Steps
1. Open the segment: `screen go=/qapps/Marketing/Audiences/SegmentDetail?marketSegmentId=<the segment>`, or find it on
   `/qapps/Marketing/Audiences/Segments` by its name.
2. Read how it is defined: Rules (classifications and geographies, any of each; dimension bounds, all of them, inclusive),
   Filter (conditions, all or any of them; a person whose value is unknown never matches), the parent it is inside, and the
   Explicit members (an exclusion always wins).
3. Read Evaluation: how many it matches and by what, who it leaves out and why (excluded by hand, outside the parent). When it
   says it was not evaluated because a source cannot be read, say so: give no count.
4. For who a send would reach, open AudiencePreview with the topic list and the segment (Preview audience on the segment), and
   explain the buckets in their order: not available, no valid address, suppressed, withdrawn or not subscribed, needs evidence,
   duplicate address, eligible (and how many eligible are untracked). The buckets add up to the people matched.
5. Say in three to five lines who the segment is, how many a send would reach, and the largest reasons people are left out,
   with what would change it (their confirmation for pending requests, evidence for legacy members).

## After
Offer "Log as note" on the segment's campaign when there is one. A preview is no approval: a send is still prepared, approved
and released on its own.
