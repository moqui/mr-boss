# Shared catalog screens

`ironstone.products.CatalogServices.get#SharedContext` is the app boundary for catalog mounts. It derives capabilities and organization scope from the actual user and supplies route aliases, raw-output bases, and Product360 tabs. Request-supplied capability maps and tab lists do not grant access. Unsupported roots fail closed.

The implemented contexts are Products, Warehouse, Manufacturing, Purchasing, Customer Service (`CustomerService`) and Commerce. Products provides catalog editing and separately authorized pricing, costing and engineering surfaces. Warehouse exposes physical master data and stock within its facilities; Manufacturing adds its method/routing context; Purchasing uses supplier prices; Customer Service uses its sales and serving-facility context. Commerce uses its assigned stores, assortments and facilities. Each context keeps its own launcher and domain permissions.

Accounting's Product360 is a separate presentation in the same shared source: its Accounting root, template and native financial services supply the context, with no catalog tab set. It does not use an Accounting branch of `get#SharedContext`. Products displays digital paid-access terms read-only; Commerce owns their edits.

To add an app context:

1. Add its authorized branch in `service/ironstone/products/SharedContext.js`, using the app's actual access policy and native permissions. Return its supported Product360 tab names and override route aliases where its screen paths differ.
2. Mount the needed Shared screens under that app and pass `appRoot` through its links and forms. Shared controllers preserve the route through nested catalog calls with a scope local to each invocation.
3. Grant the owning Mantle permissions to that app's groups. Mantle services independently check permissions, organization membership, and record ownership; the routing branch cannot replace those checks.
4. Extend `test/Products/ProductsSharedContext.spec.js` with focused holder/non-holder and foreign-owner assertions for the new context, plus a representative mounted consumer. Business-rule checks stay in Mantle; do not add a role-by-route-by-mode matrix.

Product360 derives its tab list on the server. Physical tabs and separately mounted Stock, Prices, Suppliers, BOM, Costs, and Packaging screens use the same list when nested under Product360. Type and context conditions decide which tab screens render; as in Moqui Java, the menu itself does not evaluate them. Relative navigation stays within the mount; cross-screen catalog links use `sharedLinks`. Downloads use `printBase` rather than a launcher literal. Server-derived store and facility scopes constrain relevant rows, pickers and outputs, not just their visible controls.

Connections checks actual root authorizations directly, independently of inherited screen authorization and disabled artifact authorization. It then checks entity and native parent-record visibility. It does not infer access from another app's group name. An app whose root has no grant contributes no transaction identifiers.
