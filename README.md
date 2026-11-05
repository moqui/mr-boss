# mr-boss
IronStone Business OS Suite - ERP, CRM, Commons, and Comms

[Commerce](plan/design-commerce.md) designs store operations, merchandising and website authoring;
its public companion is [IronStone Shop](../mr-pass/plan/design-shop.md) in IronStone PASS.
[impl-commerce](plan/impl-commerce.md) plans the build of both apps in one order.

[Admin](plan/design-admin.md) covers identity, settings and operations;
[Insights](plan/design-insights.md) brings together the suite's reports, dashboards and business flow maps.

Tests are in two suites ([Build-Test](../../../docs/Build-Test.md)). The regression suite, `test/` and `test/client/`,
checks rules and one golden-path client walk per app, within the budget in `test/budget`: run the specs you touch with
`./moq test mr-boss --spec <name>` while working, and `./moq test-apps` before a commit. The acceptance suite,
`acceptance/` and `acceptance/client/`, holds the scenario, access and isolation walks and one screen sweep per app
per mode: `./moq accept mr-boss`, run on a schedule, before a release, or when asked. In both, specs are grouped in
subdirectories named for the `screen/` directory of the app they cover (`Accounting`, `Products`, `Projects`, ...);
specs that cover the whole suite stay at the top.
