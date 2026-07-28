# A-One Barbeque --- Production Website Final Plan

> **Purpose:** This document is the implementation blueprint for the
> full production Food Ordering System (FOS). It consolidates the
> planned notebook design and only adds the production
> safeguards/structural improvements discussed during review.

------------------------------------------------------------------------

## 1. Project Goal

Build a production restaurant ordering and management system for **A-One
Barbeque** using Django and Django REST Framework.

The system has two primary ways to create an order:

1.  **Customer self-ordering** --- customer scans the restaurant QR
    code, opens the menu, selects items, and places the order.
2.  **Owner/Staff ordering** --- owner or staff manually creates an
    order for a customer from the management interface.

Both flows create the **same Order and OrderItem records**. There must
not be separate customer-order and owner-order database models.

The owner/staff system must also support menu management, order
management, staff management, bill printing, and daily/weekly/monthly
analytics.

------------------------------------------------------------------------

# 2. Technology Stack

## Backend

-   Python
-   Django
-   Django REST Framework
-   PostgreSQL for production
-   SQLite allowed for local development/demo only
-   Gunicorn for production application server
-   Nginx as reverse proxy/static-file server

## Frontend

The frontend consumes the DRF API.

Core interfaces:

-   Customer ordering interface
-   Owner dashboard
-   Menu management
-   Order management
-   Staff management
-   Analytics/reporting

## Architecture Style

Use a Django monolith with domain-based apps.

Do **not** introduce microservices, Kafka, Elasticsearch, Kubernetes, a
separate analytics database, or other infrastructure unless a real
requirement appears later.

------------------------------------------------------------------------

# 3. Backend Layering

The backend follows this structure:

``` text
HTTP Request
     |
     v
APIView
     |
     +-----------> Selector --------> Database
     |
     +-----------> Service ---------> Database
     |
Serializer handles request/response validation
```

The layers are **not** a mandatory linear pipeline.

## APIViews

Responsibilities:

-   Receive HTTP requests
-   Check authentication/permissions
-   Pass request data to serializers
-   Call selectors for reads
-   Call services for business operations
-   Return HTTP responses

Keep APIViews thin.

## Serializers

Responsibilities:

-   Validate API input
-   Normalize API data
-   Serialize response data

Do not place major business logic inside serializers.

## Services

Services handle writes and business operations.

Examples:

``` text
create_order()
update_order()
add_order_item()
remove_order_item()
assign_staff()
change_order_status()
record_payment()
create_menu_item()
update_menu_item()
```

## Selectors

Selectors handle database reads and reporting queries.

Examples:

``` text
get_order()
get_orders()
get_live_orders()
get_menu()
get_staff()
get_daily_summary()
get_weekly_summary()
get_monthly_summary()
get_best_selling_items()
get_least_selling_items()
```

------------------------------------------------------------------------

# 4. Django Project Structure

``` text
FOS/
|
├── manage.py
|
├── config/
|   ├── settings.py
|   ├── urls.py
|   ├── asgi.py
|   └── wsgi.py
|
├── apps/
|   |
|   ├── orders/
|   |   ├── models.py
|   |   ├── selectors.py
|   |   ├── serializers.py
|   |   ├── services.py
|   |   ├── views.py
|   |   ├── urls.py
|   |   ├── admin.py
|   |   └── tests/
|   |
|   ├── menu/
|   |   ├── models.py
|   |   ├── selectors.py
|   |   ├── serializers.py
|   |   ├── services.py
|   |   ├── views.py
|   |   ├── urls.py
|   |   ├── admin.py
|   |   └── tests/
|   |
|   ├── staff/
|   |   ├── models.py
|   |   ├── selectors.py
|   |   ├── serializers.py
|   |   ├── services.py
|   |   ├── views.py
|   |   ├── urls.py
|   |   ├── admin.py
|   |   └── tests/
|   |
|   └── analytics/
|       ├── selectors.py
|       ├── serializers.py
|       ├── views.py
|       ├── urls.py
|       └── tests/
|
└── common/
```

`analytics` does **not** need an Analytics model initially. Reports are
derived from orders and order items.

------------------------------------------------------------------------

# 5. Core Database Design

Initial production domain:

``` text
MenuItem
    |
    | selected into
    v
OrderItem ---------> Order
                       |
                       +------ assigned/created by ------> Staff
```

Core models:

1.  MenuItem
2.  Order
3.  OrderItem
4.  Staff

Payment may be separated into its own model when proper payment
history/split payments are required.

------------------------------------------------------------------------

# 6. Menu Model

The menu is intentionally kept simple because the restaurant menu is not
very large and the owner manages it.

A separate category table is **not required for V1**.

Suggested fields:

``` text
MenuItem
--------------------------------
id
item_name
item_category
item_quantity / size
item_price
is_available
is_active
created_at
updated_at
```

Example:

``` text
BBQ Chicken | Special Items | Half | ₹340
BBQ Chicken | Special Items | Full | ₹600
```

This deliberately allows Half and Full to exist as separate menu rows
because it keeps owner-side management simple.

## Planned Categories

The menu interface should support the categories shown in the design,
including:

-   Special Items
-   Tandoori Items
-   Non-Veg Snacks
-   Non-Veg Main Course
-   Kabab/Kebab
-   Fish Special
-   Veg Snacks
-   Veg Main Course
-   Roti / Prantha
-   Pasta
-   Beverages
-   Salad

Categories may be implemented using Django choices initially.

If the owner later needs to create arbitrary categories without a
deployment, migrate categories into their own model.

## Menu Management

Owner must be able to:

-   View categories
-   Expand/collapse category sections
-   Add item
-   Edit item
-   Change price
-   Change Half/Full/other size
-   Mark item unavailable
-   Deactivate item

Prefer **deactivation** over physical deletion for menu records that
have already appeared in orders.

------------------------------------------------------------------------

# 7. Order Model

The Order is the central business entity.

Suggested fields:

``` text
Order
--------------------------------
id
order_number

customer_name           nullable
customer_phone          nullable

table_no                nullable
car_no                  nullable

source
created_by              nullable
assigned_staff          nullable

status
payment_status
payment_type            if simple V1 payment handling is used

subtotal
discount
tax
total

created_at
updated_at
completed_at            nullable
```

## Order Source

Store how the order entered the system:

``` text
CUSTOMER
OWNER
STAFF
```

This allows all actors to use the same order system while preserving
useful reporting information.

## Customer Details

Customer name and phone should not be mandatory for every order.

A staff member must be able to quickly create something such as:

``` text
Table 4
2 × BBQ Chicken Half
1 × Kali Mirch Chicken Full
```

without unnecessary customer-data entry.

## Table and Car Details

The planned system supports table/car information.

For V1, retain:

``` text
table_no
car_no
```

as nullable fields.

Do not force both.

------------------------------------------------------------------------

# 8. OrderItem Model

Do not store the complete order as an `items` JSON field.

Use a relational Order → OrderItem structure.

``` text
OrderItem
--------------------------------
id
order_id                  FK
menu_item_id              FK / nullable if required later

item_name_snapshot
item_quantity_snapshot
unit_price
quantity
line_total

created_at
```

## Historical Snapshot Rule

OrderItem must preserve what was actually sold.

Example:

``` text
Monday:
BBQ Chicken Half = ₹340

Tuesday:
Owner changes menu price to ₹380
```

Monday's order and printed bill must still show ₹340.

Therefore historical bills must **not** calculate their price from the
current MenuItem price.

Store the sold price in `OrderItem.unit_price`.

Also preserve the item name/size snapshot so historical bills remain
meaningful if a menu item is renamed or deactivated.

------------------------------------------------------------------------

# 9. Price Calculation Rule

The frontend must never be trusted for authoritative prices or totals.

Customer/frontend sends identifiers and quantities.

Example request concept:

``` json
{
  "menu_item_id": 12,
  "quantity": 2
}
```

Backend retrieves the actual MenuItem price and calculates:

``` text
unit_price × quantity
        |
        v
line_total
        |
        v
subtotal
        |
        +-- discount
        +-- tax
        |
        v
total
```

All monetary totals are calculated by the backend.

------------------------------------------------------------------------

# 10. Order Status Lifecycle

Define controlled states instead of accepting arbitrary status strings.

Initial lifecycle:

``` text
PLACED
   |
   v
CONFIRMED
   |
   v
PREPARING
   |
   v
READY
   |
   v
SERVED
   |
   v
BILLED
   |
   v
PAID
   |
   v
COMPLETED
```

Cancellation is allowed where business rules permit.

``` text
PLACED ------> CANCELLED
CONFIRMED ---> CANCELLED
```

Customer-created orders can immediately become real orders with `PLACED`
status. Owner/staff approval is not required unless the restaurant later
requests it.

Status transitions should be implemented through services rather than
allowing arbitrary client values.

Examples:

``` text
confirm_order()
start_preparing()
mark_ready()
mark_served()
mark_billed()
mark_paid()
complete_order()
cancel_order()
```

------------------------------------------------------------------------

# 11. Editing and Billing Rules

The design includes:

-   Edit order
-   Delete/cancel order
-   Print bill

These need production rules.

Before billing, authorized owner/staff may modify order items according
to the restaurant workflow.

After an order becomes `BILLED` or `PAID`, normal staff should not
freely modify totals/items.

Reason:

``` text
Order total ₹1,850
        |
        v
Bill printed
        |
        v
Payment received
        |
        X
Do not silently change order to ₹1,350
```

Future owner overrides should be auditable.

Use `CANCELLED` rather than physically deleting
completed/business-critical orders.

------------------------------------------------------------------------

# 12. Customer Ordering Flow

The planned customer flow:

``` text
Customer scans QR
        |
        v
Restaurant Menu
        |
        v
Browse/Search Items
        |
        v
Select Half / Full / quantity
        |
        v
Your Order
        |
        v
Place Order
        |
        v
Order created
        |
        v
Order appears in owner/staff system
```

## Customer Menu Page

The page should contain:

-   Restaurant name
-   Menu
-   Search bar
-   Categories
-   Menu items
-   Half/Full or relevant quantity/size
-   Price
-   Plus/minus quantity controls
-   Your Order section/cart
-   Order status/payment information where relevant
-   Place Order button

The notebook design's menu + your-order layout remains the base.

## Customer Cart / Your Order

Show:

``` text
Item
Size
Unit price
Quantity controls
Line total
```

Then:

``` text
Subtotal
Discount if applicable
Tax if applicable
Total

[ Place Order ]
```

------------------------------------------------------------------------

# 13. Owner Login and Navigation

Owner flow:

``` text
Owner Login
     |
     v
Owner Dashboard
```

Main owner navigation planned in the notebook:

``` text
A-One Barbeque
Menu
Orders
Staff
Analytics
Profile/User
```

Use the same navigation consistently across management pages.

------------------------------------------------------------------------

# 14. Owner Dashboard

The notebook planned a card-based dashboard with live orders.

Keep that, but prioritize operational information.

## Top Operational Summary

Suggested cards:

``` text
New Orders
Preparing
Ready
Unpaid
```

## Live Orders

Display live order cards/list containing relevant information such as:

``` text
Order number
Customer/table/car
Status
Amount
Staff
Order age/time
```

Owner should be able to quickly enter the order detail view.

## Today's Summary

Also show:

``` text
Today's total orders
Today's revenue
Today's best seller
Maximum/order-related useful metric
```

The notebook's dashboard-card concept remains, but operational status
comes before decorative analytics.

------------------------------------------------------------------------

# 15. Owner Orders Page

The planned Order Card should include:

``` text
Order No.
Customer Name
Table No. / Car No.
Status
Amount
```

## Full Order View

When opened:

``` text
Order number
Customer name
Table number / Car number
Staff assigned
Status
Payment status

Items
--------------------------------
BBQ Chicken
Kali Mirch BBQ Chicken
...

quantity controls where editing is allowed

[Cancel] [Print Bill] [Edit]
```

Buttons/actions must respect status and permissions.

------------------------------------------------------------------------

# 16. Owner/Staff Add Order Flow

Owner and staff must be able to create orders themselves.

The manual-order page should contain:

``` text
Customer Name          optional
Phone                  optional

Table No.              optional
Car No.                optional

Assigned Staff         where applicable
Payment Status
Payment Type

Menu Selection
```

The menu selection area can reuse the menu UI used elsewhere.

At the bottom:

``` text
[Cancel]
[Save Order]
```

A `Save + Print` action may also be added where it improves the
restaurant workflow.

Speed matters: manual order creation should require as few steps as
possible.

------------------------------------------------------------------------

# 17. One Order-Creation Business Service

Customer, owner and staff must not implement independent order-creation
business logic.

Architecture:

``` text
Customer API --------\
                      \
Owner API -------------> OrderService.create_order()
                      /
Staff API -----------/
                         |
                         v
                       Order
                         |
                         v
                    OrderItems
```

The service is responsible for:

-   Validating menu items
-   Checking availability
-   Reading authoritative prices
-   Creating Order
-   Creating OrderItems
-   Calculating line totals
-   Calculating order totals
-   Recording source
-   Using a database transaction

------------------------------------------------------------------------

# 18. Staff Page

The notebook includes an owner Staff page and staff cards.

Keep it.

## Staff Card

Display information such as:

``` text
Staff Name
Current Order
Today's Orders
Role where relevant
```

Owner can view staff workload/current assignments.

## Staff Management

Owner should be able to:

-   View staff
-   Add staff
-   Update staff
-   Activate/deactivate staff
-   Assign staff to an order

Avoid permanently deleting staff records that are referenced by
historical orders.

------------------------------------------------------------------------

# 19. Staff Assignment

For V1, keep one assigned staff member per order:

``` text
Order.assigned_staff
```

Do not create a complex multi-staff assignment model unless the real
restaurant workflow later requires multiple staff members/roles per
order.

------------------------------------------------------------------------

# 20. Bill / Invoice Printing

Bill printing is a core feature.

Flow:

``` text
Order
  |
  v
OrderItems
  |
  v
Stored historical prices
  |
  v
Bill template
  |
  v
Printable HTML
  |
  v
Browser / thermal printer
```

The bill should contain appropriate restaurant/order information,
including:

``` text
A-One Barbeque
Order/Bill number
Date/time
Table/Car information where applicable
Customer information where applicable

Item
Size
Qty
Rate
Amount

Subtotal
Discount
Tax
Grand Total

Payment status/type where applicable
```

The exact print CSS must be designed for the actual bill/thermal-paper
dimensions used by the restaurant.

The bill should be generated from stored Order and OrderItem data.

A separate Invoice model is not required for V1 unless invoice-specific
persistence becomes necessary.

------------------------------------------------------------------------

# 21. Menu Search

The notebook includes a search-bar addition.

Implement menu search for:

``` text
Item name
```

Also support category filtering through the menu sections.

Because the menu is small, frontend filtering after fetching the menu is
acceptable.

Do not introduce a dedicated search engine.

------------------------------------------------------------------------

# 22. Analytics Page

Analytics is derived from transactional data.

Do **not** create an Analytics database model simply because there is an
Analytics page.

Data comes from:

``` text
Order
OrderItem
payment fields / Payment model
```

using selectors and database aggregation.

## Time Filters

The notebook includes:

``` text
Today
Weekly
Monthly
```

Support:

-   Today
-   Weekly
-   Monthly
-   Custom range later if needed

------------------------------------------------------------------------

# 23. Daily Analytics

Owner analytics page should include useful daily information such as:

``` text
Today's Orders
Today's Revenue
Today's Best Seller
Maximum/highest useful order metric
Least-selling item where meaningful
```

Also show operational information where useful:

``` text
Cancelled orders
Unpaid orders
```

------------------------------------------------------------------------

# 24. Weekly Report

The notebook planned a dedicated weekly report.

Include:

``` text
A-One Barbeque
Weekly Report

Total Orders
Total Revenue
Least-Selling Items
Best-Selling Items
```

Charts can show:

-   Revenue by day
-   Orders by day
-   Item/category performance

The weekly report should be calculated from Order/OrderItem queries, not
stored as duplicate analytics rows.

------------------------------------------------------------------------

# 25. Monthly Report

The notebook planned:

``` text
A-One Barbeque
Monthly Report

Total Orders This Month
Revenue
Least-Selling Items
```

Also include:

-   Best-selling items
-   Average order value
-   Revenue trend through the month
-   Category performance if useful

For item comparisons, prefer a bar chart when it communicates the data
more clearly than a pie chart.

The notebook's pie/revenue-chart concept can still be used where
appropriate.

------------------------------------------------------------------------

# 26. Analytics Query Design

Conceptually:

``` text
GET analytics request
        |
        v
AnalyticsAPIView
        |
        v
analytics_selectors.py
        |
        +------ Order
        |
        +------ OrderItem
        |
        +------ Payment data
        |
        v
Database aggregate queries
        |
        v
Serializer / JSON
        |
        v
Frontend cards/charts
```

Examples:

``` text
get_today_order_count()
get_today_revenue()
get_weekly_revenue()
get_monthly_revenue()
get_best_selling_items()
get_least_selling_items()
get_average_order_value()
get_orders_by_day()
get_revenue_by_day()
```

No separate analytics table for V1.

------------------------------------------------------------------------

# 27. Suggested API Areas

Exact URL naming may change during implementation, but keep the API
grouped by domain.

## Menu

``` text
GET    /api/menu/
POST   /api/menu/items/
GET    /api/menu/items/{id}/
PATCH  /api/menu/items/{id}/
DELETE /api/menu/items/{id}/
```

`DELETE` should normally perform deactivation for menu records with
history.

## Orders

``` text
POST   /api/orders/
GET    /api/orders/
GET    /api/orders/{id}/
PATCH  /api/orders/{id}/

POST   /api/orders/{id}/items/
PATCH  /api/orders/{id}/items/{item_id}/
DELETE /api/orders/{id}/items/{item_id}/

POST   /api/orders/{id}/assign/
POST   /api/orders/{id}/cancel/
POST   /api/orders/{id}/status/
```

## Customer Ordering

Customer-facing endpoints may have a separate URL namespace while still
calling the same services:

``` text
GET    /api/customer/menu/
POST   /api/customer/orders/
GET    /api/customer/orders/{reference}/
```

## Staff

``` text
GET    /api/staff/
POST   /api/staff/
GET    /api/staff/{id}/
PATCH  /api/staff/{id}/
```

## Analytics

``` text
GET /api/analytics/summary/
GET /api/analytics/daily/
GET /api/analytics/weekly/
GET /api/analytics/monthly/
GET /api/analytics/items/
GET /api/analytics/revenue/
```

## Bill

``` text
GET /orders/{id}/invoice/
```

or an equivalent protected bill-print route.

------------------------------------------------------------------------

# 28. Permissions

The production API must enforce permissions on the server.

A hidden frontend button is not authorization.

Initial permission matrix:

  Action                       Customer                 Staff   Owner
  ------------------------ ------------ --------------------- -------
  View public menu                  Yes                   Yes     Yes
  Place customer order              Yes                   Yes     Yes
  Create manual order                No                   Yes     Yes
  View management orders             No                   Yes     Yes
  Edit active order             Limited                   Yes     Yes
  Cancel order               Limited/No   According to policy     Yes
  Print bill                         No                   Yes     Yes
  Manage menu                        No            No/limited     Yes
  Change menu price                  No                    No     Yes
  Manage staff                       No                    No     Yes
  View analytics                     No           Optional/No     Yes

Finalize any staff exceptions based on the actual restaurant workflow.

------------------------------------------------------------------------

# 29. Data Deletion Rules

Do not physically delete business history casually.

Prefer:

``` text
Menu Item -> deactivate
Staff    -> deactivate
Order    -> cancel
```

Completed orders should remain available for:

-   Bill history
-   Revenue analytics
-   Item analytics
-   Staff history
-   Business records

------------------------------------------------------------------------

# 30. Transactions and Concurrency

Critical order mutations should use database transactions.

Order creation must be atomic:

``` text
Create Order
    +
Create OrderItems
    +
Calculate/store totals

Either all succeed
or all fail
```

Use Django `transaction.atomic()` around these operations.

Use row locking such as `select_for_update()` only where concurrent
modification creates a real correctness problem.

Do not add locking everywhere.

------------------------------------------------------------------------

# 31. Auditability Add-On

For production, important destructive/financial actions should
eventually be auditable.

Useful actions include:

``` text
Menu price changed
Order cancelled
Billed order overridden
Payment changed
Staff assignment changed
```

An `AuditLog` can be introduced when needed:

``` text
actor
action
object_type
object_id
old_values
new_values
created_at
```

This does not need to block the first implementation, but the
architecture should not make it difficult to add.

------------------------------------------------------------------------

# 32. Production Database and Deployment Direction

## Development

``` text
Django
  |
  v
SQLite
```

is acceptable locally.

## Production

Use:

``` text
Internet
   |
   v
Nginx
   |
   v
Gunicorn
   |
   v
Django + DRF
   |
   v
PostgreSQL
```

Do not use SQLite as the long-term production database for concurrent
restaurant operations.

------------------------------------------------------------------------

# 33. Features Explicitly Out of Scope for V1

Do not add these without a real requirement:

-   Microservices
-   Kafka
-   Kubernetes
-   Elasticsearch
-   Separate analytics database
-   Complex caching infrastructure
-   AI recommendations
-   Event sourcing
-   Multiple databases
-   Complex multi-staff assignment system
-   Complex menu-category model if fixed category choices remain
    sufficient

The target is a maintainable Django monolith.

------------------------------------------------------------------------

# 34. Recommended Implementation Order

Follow this sequence rather than jumping between apps.

## Phase 1 --- Foundation

-   Create Django project
-   Configure DRF
-   Configure environment settings
-   Configure PostgreSQL-ready settings
-   Create domain app structure
-   Configure authentication/permissions foundation

## Phase 2 --- Menu

-   Create MenuItem model
-   Add category choices
-   Add Half/Full/other quantity/size handling
-   Add availability/deactivation
-   Menu selectors
-   Menu serializers
-   Menu services
-   Menu APIs
-   Owner menu CRUD
-   Customer menu read API
-   Search/filter behavior

## Phase 3 --- Staff

-   Create Staff model/profile structure
-   Staff CRUD
-   Activation/deactivation
-   Staff cards/query data
-   Permissions

## Phase 4 --- Orders

-   Create Order model
-   Create OrderItem model
-   Implement historical price snapshots
-   Implement backend price calculations
-   Implement order source
-   Implement status lifecycle
-   Implement atomic `create_order()`
-   Implement order selectors
-   Implement owner/staff manual ordering
-   Implement customer self-ordering
-   Implement editing rules
-   Implement cancellation
-   Implement staff assignment

## Phase 5 --- Owner Order UI

-   Live order dashboard
-   Order cards
-   Full order detail
-   Edit active order
-   Cancel order
-   Status updates
-   Payment status/type
-   Staff assignment

## Phase 6 --- Customer UI

-   QR entry
-   Menu
-   Categories
-   Search
-   Item quantity controls
-   Your Order/cart
-   Place order
-   Order status view

## Phase 7 --- Billing

-   Printable bill template
-   Actual thermal-paper dimensions
-   Order/OrderItem snapshot-based bill
-   Print Bill action
-   Restrict editing after billing/payment

## Phase 8 --- Analytics

-   Daily selectors
-   Weekly selectors
-   Monthly selectors
-   Total orders
-   Revenue
-   Best seller
-   Least seller
-   Average order value
-   Orders/revenue trend
-   Charts
-   Weekly report
-   Monthly report

## Phase 9 --- Production Hardening

-   PostgreSQL
-   Permission tests
-   Service tests
-   Selector tests
-   API tests
-   Order transaction tests
-   Price-tampering tests
-   Invalid-status-transition tests
-   Security settings
-   Logging
-   Backups
-   Static/media handling
-   Nginx
-   Gunicorn
-   HTTPS
-   Production deployment

------------------------------------------------------------------------

# 35. Critical Tests Before Production

At minimum verify:

``` text
Customer cannot change item price through request payload
Customer cannot access owner APIs
Staff cannot access owner-only operations
Unavailable item cannot be newly ordered
Menu price change does not alter historical OrderItem price
Deactivated menu item does not destroy old bills
Order total equals server-calculated item totals
Order creation rolls back completely on failure
Invalid status transitions are rejected
Billed/paid order cannot be silently modified
Cancelled orders remain in history
Analytics excludes/includes cancelled orders according to defined policy
Daily/weekly/monthly date boundaries are correct
Bill displays stored historical prices
```

------------------------------------------------------------------------

# 36. Final System Flow

``` text
                         A-ONE BARBEQUE FOS

                 +---------------------------+
                 |                           |
                 v                           v
          CUSTOMER QR                  OWNER / STAFF
                 |                           |
                 v                           v
              MENU                    MANAGEMENT UI
                 |                           |
                 v                           |
           SELECT ITEMS                     |
                 |                           |
                 +------------+--------------+
                              |
                              v
                       CREATE ORDER
                              |
                              v
                    OrderService.create_order()
                              |
                    +---------+---------+
                    |                   |
                    v                   v
                  ORDER             ORDER ITEMS
                    |                   |
                    +---------+---------+
                              |
                              v
                       LIVE ORDER VIEW
                              |
                   +----------+----------+
                   |          |          |
                   v          v          v
                STAFF      STATUS      PAYMENT
              ASSIGNMENT   UPDATES      STATUS
                   \          |          /
                    +---------+---------+
                              |
                              v
                            BILL
                              |
                              v
                           PRINT
                              |
                              v
                         COMPLETED
                              |
                              v
                         ANALYTICS
                    /         |         \
                   v          v          v
                 DAILY      WEEKLY     MONTHLY
```

------------------------------------------------------------------------

# 37. Core Architecture Decisions --- Do Not Change Casually

These are the baseline decisions for implementation:

1.  Django + Django REST Framework backend.
2.  Django monolith, not microservices.
3.  APIViews are acceptable for this project.
4.  Use serializers for API validation/representation.
5.  Use services for writes/business operations.
6.  Use selectors for reads/reporting.
7.  Customer, owner and staff create the **same Order model**.
8.  Store `source` to distinguish CUSTOMER / OWNER / STAFF.
9.  Use separate Order and OrderItem tables.
10. Do not store the order primarily as JSON.
11. Store historical item name/size/price snapshots in OrderItem.
12. Backend owns all price and total calculations.
13. Keep menu categories in MenuItem for V1 because the menu is small.
14. Half/Full may remain separate MenuItem rows for simplicity.
15. Analytics is query-derived; no Analytics model for V1.
16. Owner can manage menu, orders, staff and analytics.
17. Customer can independently place orders.
18. Owner/staff can independently create orders.
19. Bill printing is a core feature.
20. Use controlled order-status transitions.
21. Do not freely modify billed/paid orders.
22. Prefer deactivate/cancel over destroying historical business
    records.
23. SQLite is for development/demo; PostgreSQL is the production target.
24. Use database transactions for critical order creation/mutation.
25. Keep V1 operationally simple and add complexity only when
    requirements justify it.

------------------------------------------------------------------------

# 38. Definition of V1 Complete

The first production version is complete when:

-   Owner can log in.
-   Owner can manage the menu.
-   Owner can see category-grouped menu items.
-   Owner can add/edit/deactivate menu items.
-   Customer can scan/open the QR ordering interface.
-   Customer can search/browse the menu.
-   Customer can add/remove quantities and place an order.
-   Customer-created order appears in the management order system.
-   Owner/staff can manually create an order.
-   Both creation paths use the same backend order service.
-   Owner/staff can view live orders.
-   Owner/staff can view full order details.
-   Staff can be assigned where required.
-   Valid order status changes work.
-   Payment status/type can be recorded for the V1 workflow.
-   Owner/staff can print a correctly sized bill.
-   Historical bills remain correct after menu-price changes.
-   Owner can view daily analytics.
-   Owner can view weekly report.
-   Owner can view monthly report.
-   Revenue and best/least-selling metrics come from real
    Order/OrderItem data.
-   Authorization is enforced by the backend.
-   Production runs on PostgreSQL behind the chosen production server
    stack.

------------------------------------------------------------------------

## Start Point

Do **not** begin with analytics or frontend charts.

Start with the domain foundation:

``` text
MenuItem
   |
   v
Order + OrderItem
   |
   v
OrderService.create_order()
```

Once this is correct, customer ordering, owner ordering, billing and
analytics all build on the same reliable data.
