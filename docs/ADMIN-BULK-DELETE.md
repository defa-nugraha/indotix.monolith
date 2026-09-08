# Admin Bulk Delete

Checkbox selection is scoped to the currently rendered table/page. Selection
clears when filters or pagination change the URL. Select-all never fetches or
selects records on other pages. Buttons disable while confirmation/deletion is
in progress; navigating or leaving the table stops any further requests.

## Covered Active Tables

- Public banners, partners, promo items, FAQs, and Home Part Of logos
- Blog posts and tags
- Users and Mitra Wisata
- Wisata destinations and tickets
- Marketing vouchers and Wisata vouchers (shared page)
- Finance commission rules
- Review moderation
- Notification templates

## Existing Rules Remain Authoritative

Bulk selection uses the same individual Inertia DELETE requests as each
feature's existing delete button, one at a time. Middleware, CSRF, route
binding, ownership scope, deletion services, file cleanup and audit logging
remain unchanged. No unscoped bulk database operation or new endpoint exists.
Ticket deletion still requires a reason. User/Mitra confirmation warns about
cascading related data deletion. Destination dependency guards still apply.

This is not an all-or-nothing transaction: confirmed deletions are retained.
The first validation, permission, redirect, network or cancellation failure
stops the queue. The result reports confirmed successes, not presumed success
for unprocessed records. Refresh the table before retrying an uncertain result.

## Deliberate Exclusions

Booking/payment/transaction tables without an existing DELETE action are not
given one. Cancellation is a separate business operation, not deletion.
Retired event/academy/retail/special-program routes and disabled role,
special-admin and blog-category CRUD remain disabled. Standalone edit-form
image removal is not a table operation. Partner terms currently presents a
single document slot for Wisata rather than a multi-record table.

## Verification

`node tests/frontend/bulk-delete.test.mjs` exercises the real React widgets and
SweetAlert dialogs in headless Chromium; only the Inertia transport is mocked.
It covers selection, page changes, cancellation, protected rows, sequential
requests, failure stopping, mandatory reasons, duplicate clicks and unmount.
Screenshots are written to `/tmp/indotix-bulk-delete-evidence`.

`php artisan test --filter=BulkDeleteSafetyTest` verifies the existing backend
deletion endpoints with a test database. Existing user/mitra deletion, admin
ownership, ticket management and audit tests remain applicable.
