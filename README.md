# mr-boss
IronStone Business OS Suite - ERP, CRM, Commons, and Comms

[Commerce](plan/design-commerce.md) designs store operations, merchandising and website authoring;
its public companion is [IronStone Shop](../mr-pass/plan/design-shop.md) in IronStone PASS.

[Admin](plan/design-admin.md) covers identity, settings and operations;
[Insights](plan/design-insights.md) brings together the suite's reports, dashboards and business flow maps.

The specs in `test/` and `test/client/` are grouped in subdirectories named for the `screen/` directory of the app they
cover (`Accounting`, `Products`, `Projects`, ...); specs that cover the whole suite stay in `test/`. Run them with
`moqui test mr-boss` and `moqui test-client mr-boss` ([Build-Test](../../../docs/Build-Test.md)).
