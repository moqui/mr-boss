# mr-boss
IronStone Business OS Suite - ERP, CRM, Commons, and Comms

Commerce (`screen/Commerce/`) is built: store operations, merchandising, website authoring, orders and carts, promotions,
checkout settings, integrations, feeds and store reports ([design](plan/design-commerce.md),
[impl-commerce](plan/impl-commerce.md), which builds it in one order with its public companion,
[IronStone Shop](../mr-pass/plan/design-shop.md) in IronStone PASS).

Admin (`screen/Admin/`) has its first release: groups and grants, users and sessions, invitations
(`AcceptInvitation`, the `i` route), lifecycle and offboarding, organizations and the Constitution, Health and the settings
index ([design](plan/design-admin.md), [impl-admin](plan/impl-admin.md)). Insights (`screen/Insights/`) is browsable:
dashboards and Explore, admitted datasets, the report catalog and metrics, Home's attention board, analysis and drill, and
scheduled reports and digests delivered to recipients who read the same data, and business alerts told to them the same way
([design](plan/design-insights.md), [impl-insights](plan/impl-insights.md)). They are built in one order, and the
rest of each is next.

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
