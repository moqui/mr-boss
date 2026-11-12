# mr-boss
IronStone Business OS Suite - ERP, CRM, Commons, and Comms

Commerce (`screen/Commerce/`) is built: store operations, merchandising, website authoring, orders and carts, promotions,
checkout settings, integrations, feeds and store reports ([design](plan/design-commerce.md),
[impl-commerce](plan/impl-commerce.md), which builds it in one order with its public companion,
[IronStone Shop](../mr-pass/plan/design-shop.md) in IronStone PASS).

Admin (`screen/Admin/`) is built: users, sessions and invitations (`AcceptInvitation`, the `i` route), lifecycle and
offboarding, groups, grants, capabilities and row rules, sign-in policy, identity providers and shared devices,
organizations, the Constitution and instance settings, connections, mail relays, protocols and the mail queue, system
messages and recovery, jobs and topics, imports, exports and backups, audit and access evidence, Health with its support
summary, and the settings index ([design](plan/design-admin.md), [impl-admin](plan/impl-admin.md)). Its rules are tested in
`test/Admin/`; its scenario walks, the access review walk and its screen sweeps are in `acceptance/Admin/`. The screens
with no business model in them (groups, sign-in policy, settings, connections, mail, jobs, health, data transfer, audit)
are the framework's System screens, shown under Admin's root with what Admin adds for an organization
([design-admin §1.4](plan/design-admin.md#14-screens-that-are-the-frameworks); mr-moqui
[plans/Admin-Screens-Down.md](../../../plans/Admin-Screens-Down.md)).

Insights (`screen/Insights/`) is built:
dashboards and Explore over admitted datasets, the report catalog and metrics, Home's attention board, analysis and drill with
read-only record contexts, scheduled reports and digests delivered to recipients who read the same data, business alerts told
to them the same way, business flow maps an organization copies from the suite's templates, its settings, data readiness and
Assist, and wall displays on registered shared devices; its specs are `test/Insights/` and `acceptance/Insights/` (the screen
sweeps InsightsTui and InsightsServerStatic, the review walk InsightsReviewWalk)
([design](plan/design-insights.md), [impl-insights](plan/impl-insights.md)). Its dataset, delivery, alert, playlist,
wall display, drill and analysis screens are the framework's Dashboards screens, shown under Insights' root with its
links and policy ([design-insights §4.2](plan/design-insights.md#42-framework-screens-shown-under-insights)). Both were
built in one order ([impl-admin §1](plan/impl-admin.md#1-scope-and-order)).

UI review and refinement plans use `plan/ui-review-*.md`, starting with
[drawers, Commons and Comms](plan/ui-review-drawers-commons.md): screen coverage, complete user processes,
refinement criteria, findings and verification. The [document guide](plan/design-doc-guide.md#ui-review-and-refinement-phase)
defines the convention.

Tests are in two suites ([Build-Test](../../../docs/Build-Test.md)). The regression suite, `test/` and `test/client/`,
checks rules and one golden-path client walk per app, within the budget in `test/budget`: run the specs you touch with
`./moq test mr-boss --spec <name>` while working, and `./moq test-apps` before a commit. The acceptance suite,
`acceptance/` and `acceptance/client/`, holds the scenario, access and isolation walks and one screen sweep per app
per mode: `./moq accept mr-boss`, run on a schedule, before a release, or when asked. In both, specs are grouped in
subdirectories named for the `screen/` directory of the app they cover (`Accounting`, `Products`, `Projects`, ...);
specs that cover the whole suite stay at the top.

## License and Contributing

[CC0 1.0 Universal with a Grant of Patent License](LICENSE.md). To contribute code, sign
[AUTHORS.md](AUTHORS.md) in a commit from the account that submits the pull request; its Contributing
section has the details.
