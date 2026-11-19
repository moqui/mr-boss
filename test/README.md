# mr-boss tests

The specs are JavaScript, run by `moqui test` (on the server) and `moqui test-client` (against a running server, with
a browser), with no Node. They are in two suites, described in mr-moqui's
[Build-Test, The two suites](https://github.com/moqui/mr-moqui/blob/master/docs/Build-Test.md#the-two-suites).

| Suite | Where | What it holds | When it runs |
|---|---|---|---|
| Regression | `test/`, `test/client/` | Rules and fixed bugs, and one golden-path client walk for each app, within the budget in `test/budget` | The specs you touch while working; all of it before a commit |
| Acceptance | `test/acceptance/`, `test/acceptance/client/` | Scenario walks, access and isolation walks, phone walks, and one screen sweep for each app in each mode | On a schedule, before a release, or when asked; and a test you added or changed |

The security proofs run with the regression suite: `test/proofs/` holds client specs filed by OWASP ASVS requirement, one
file a chapter, for the rows of [docs/ASVS-Matrix.md](../docs/ASVS-Matrix.md) that BOSS meets, and `InProcessProofs` the
proofs only the server can show. They run alone against any server, a certifier's deployment included
([security proofs](https://github.com/moqui/mr-moqui/blob/master/docs/security/proofs/README.md)).

```sh
./moq test mr-boss --spec SalesOpportunities,SalesQuotes   # regression specs by name
./moq test-apps                                            # every app component's regression suite
./moq accept mr-boss                                       # the acceptance suite
./moq accept mr-boss --spec SalesTui                       # one acceptance spec
./moq test-client --nobuild -- --serve --proofs mr-boss    # the security proofs, with proofs.md by requirement
```

A regression spec over 15 seconds fails the run: move it to acceptance or delete it. Do not raise `test/budget`
without the user's agreement; its comments record each change. Render a screen at most once in each mode across the
regression suite; a screen sweep belongs only in `test/acceptance/`
([Rendering screens in tests](https://github.com/moqui/mr-moqui/blob/master/docs/Build-Test.md#rendering-screens-in-tests)).

## Layout

In each of the four directories the specs are in a subdirectory named for the `screen/` directory of the app they
cover. Specs that cover the whole suite stay at the top: `AppOrganizationFilters` and the public pages (`PublicShare`,
`PublishedCalendar`, `Unsubscribe`) in `test/`, `Shared/` for the conversation and files on a record, and
`AppStructure`, `ServerStatic` and `TuiRender` in `test/acceptance/`. `client/suite.js`,
`acceptance/client/suite.js` and `proofs/suite.js` list the client specs in order and declare the server and fixtures
each suite starts with `--serve`; the proofs' fixtures are `ProofFixtures`, which sets again on every run the password and
factors the proofs change.

| App | Regression | Golden-path client walk (`test/client/`) | Acceptance sweeps and named walks |
|---|---|---|---|
| Accounting | `Accounting/` | `AccountingReceivablesWalk` | `AccountingServerStatic`, `AccountingAccessWalk`; the area walks in `acceptance/client/Accounting/` |
| Admin | `Admin/` | `AdminUsersWalk` | `AdminTui`, `AdminServerStatic`, the access review walk `AdminReviewWalk`, scenario walks in `acceptance/Admin/` |
| Commerce | `Commerce/` | `CommerceThemesWalk` | `CommerceTui`, `CommerceServerStatic`, `CommerceIsolationWalk`; `ThemeEditorWalk` in `acceptance/client/Commerce/` |
| Commons, Comms | `Commons/`, `Comms/` | `NotesResponses` (a client regression) | `acceptance/Commons/` |
| Customer Service | `CustomerService/` | `CustomerServiceCasesWalk` | `CustomerServiceServerStatic`, `CustomerServiceAccessWalk`, scenario walks in `acceptance/CustomerService/` |
| Insights | `Insights/` | `InsightsDashboardsWalk` | `InsightsTui`, `InsightsServerStatic`, the review walk `InsightsReviewWalk`; `InsightsDashboardsUsable` in `acceptance/client/Insights/` |
| Maintenance | `Maintenance/` | `MaintenanceWorkOrdersWalk` | `MaintenanceTui`, `MaintenanceServerStatic`, `MaintenanceAccessWalk`, scenario walks in `acceptance/Maintenance/`; the phone walk `MaintenancePhoneWalk` in `acceptance/client/Maintenance/` |
| Manufacturing | `Manufacturing/` | `ManufacturingWorkOrdersWalk` | `ManufacturingServerStatic`, `ManufacturingAccessWalk`; the area walks in `acceptance/client/Manufacturing/` |
| Marketing | `Marketing/`, with mr-mantle's `test/marketing/`, `test/party/` and `test/work/` | `MarketingSendWalk` | `MarketingTui`, `MarketingServerStatic`, `MarketingAccessWalk`, scenario walks in `acceptance/Marketing/`; the calendar and door check-in walks `MarketingCalendarWalk` and `MarketingCheckInWalk` in `acceptance/client/Marketing/` |
| People | `People/` | `PeopleHireWalk` | `PeopleTui`, `PeopleServerStatic`, the review walks `PeopleReviewWalk` and `PeopleNavigationWalk`, scenario walks in `acceptance/People/`; the phone walk `PeoplePhoneWalk` in `acceptance/client/People/` |
| Products | `Products/` | `ProductsWalk` (and the client regression `ProductsVariantResponses`) | The screen specs in `acceptance/Products/`; the area walks in `acceptance/client/Products/` |
| Projects | `Projects/` | Client regressions: `ProjectsPlanningResponses`, `ProjectsDiffState`, `ProjectsTimeAsync`, `ProjectsResourcesAsync` | `ProjectsTui`, `ProjectsServerStatic`, scenario walks in `acceptance/Projects/` |
| Purchasing | `Purchasing/` | `PurchasingOrdersWalk` | `PurchasingServerStatic`, `PurchasingAccessWalk`, scenario walks in `acceptance/Purchasing/` |
| Sales | `Sales/`, with mr-mantle's `test/sales/` and `test/order/` | `SalesPipelineWalk` | `SalesTui`, `SalesServerStatic`, the review walks `SalesLeadToInvoiceWalk` and `SalesAccessWalk`, scenario walks in `acceptance/Sales/`; the board walk `SalesBoardWalk` in `acceptance/client/Sales/` |
| Warehouse | `Warehouse/` | `WarehouseReceivingWalk` | `WarehouseServerStatic`, `WarehouseAccessWalk`; the area walks in `acceptance/client/Warehouse/` |

What each app's specs prove, phase by phase, is in its `plan/impl-<app>.md`.

## Other files

- `ServerStaticLib.js` is shared by the server-static sweeps.
- `screens/` and `files/` hold screens and files the specs mount and read.
- `skill-retrieval.json` has the cases for the Assist skill retrieval check (`moqui test mr-boss --skills`).

A database kept from before an entity's key changed needs the table rebuilt, as mr-mantle's
[Upgrading](https://github.com/moqui/mr-mantle/blob/master/docs/Upgrading.md) says. Until 0.1.0 the simpler way is to
empty the database and load it again (`./moq clean-db`, `./moq load`).
