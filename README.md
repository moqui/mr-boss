# mr-boss
IronStone Business OS Suite - ERP, CRM, Commons, and Comms

Commerce (`screen/Commerce/`) is built: store operations, merchandising, website authoring, orders and carts, promotions,
checkout settings, integrations, feeds and store reports ([design](plan/design-commerce.md),
[impl-commerce](plan/impl-commerce.md), which builds it in one order with its public companion,
[IronStone Shop](../mr-pass/plan/design-shop.md) in IronStone PASS).

[Admin](plan/design-admin.md) covers identity, settings and operations;
[Insights](plan/design-insights.md) brings together the suite's reports, dashboards and business flow maps. They are
built next, in one order ([impl-admin](plan/impl-admin.md), [impl-insights](plan/impl-insights.md)).

Tests are in two suites ([Build-Test](../../../docs/Build-Test.md)). The regression suite, `test/` and `test/client/`,
checks rules and one golden-path client walk per app, within the budget in `test/budget`: run the specs you touch with
`./moq test mr-boss --spec <name>` while working, and `./moq test-apps` before a commit. The acceptance suite,
`acceptance/` and `acceptance/client/`, holds the scenario, access and isolation walks and one screen sweep per app
per mode: `./moq accept mr-boss`, run on a schedule, before a release, or when asked. In both, specs are grouped in
subdirectories named for the `screen/` directory of the app they cover (`Accounting`, `Products`, `Projects`, ...);
specs that cover the whole suite stay at the top.
