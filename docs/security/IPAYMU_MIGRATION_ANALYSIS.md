# iPaymu Payment Migration Analysis

Accessed: 2026-09-28 (Asia/Jakarta)

This document records the evidence and migration design completed before product
code was changed. The scope is active wisata ticket payments only. Historical
Midtrans payments remain owned by the Midtrans integration.

## 1. Repository reconnaissance

- Laravel: 12.x (`laravel/framework ^12.0`), PHP requirement `^8.2`; local CLI
  is PHP 8.5.0.
- Flutter: 3.44.8, Dart 3.12.2; project constraint is Dart `^3.7.0`.
- HTTP clients: Laravel HTTP client/Guzzle 7; Flutter `http ^1.2.1`.
- Midtrans SDK: none. The project uses a local `MidtransService` over Laravel's
  HTTP client.
- Database: Laravel supports SQLite locally and MySQL in CI/production. Payment
  concurrency controls therefore must use database constraints and transactions,
  not cache locks alone.
- API authentication: Laravel Sanctum bearer tokens plus verified-user middleware.
- Queue/cache/session: Redis defaults. Scheduled reconciliation runs every five
  minutes with `onOneServer()` and `withoutOverlapping()`.
- Active payment tables: `wisata_bookings`, `wisata_payments`,
  `wisata_payment_side_effects`, and `wisata_refunds`.
- Existing integrity controls: server-side price/voucher calculation, booking and
  payment row locks, one active payment key per booking, amount validation,
  provider reconciliation, and unique paid-side-effect outbox rows.

## 2. Existing Midtrans flow

### Web

`WisataBookingController` creates a booking from server-owned ticket/voucher data,
then `WisataPaymentLifecycleService::createOrGetSnapPayment()` reserves a unique
payment row and calls `MidtransService::snap()`. The web payment page loads the
Midtrans Snap script. The browser return page only reads server state and cannot
mark a booking paid.

### Flutter

Flutter creates a booking through authenticated `/api/wisata/bookings`, requests
payment creation from Laravel, receives only a payment URL/token, and opens a
WebView. Flutter does not receive Midtrans credentials and cannot set paid state.

### Confirmation and fulfillment

Midtrans posts to `/payments/midtrans/callback`. The handler verifies the Midtrans
signature, merchant/currency when present, expected amount, and the payment
reference. Active wisata payments are delegated to
`WisataPaymentLifecycleService`, which locks payment and booking rows before a
valid transition. Successful payment approves affiliate commission and creates
unique outbox rows for in-app notification, push notification, and ticket email.
Those rows prevent duplicate logical fulfillment.

### Reconciliation and refund

The scheduler reconciles recent non-terminal Midtrans payments, retries paid
side effects, expires overdue bookings, and reconciles Midtrans refunds. Existing
admin refund is a real Midtrans API operation and must remain available for
historical Midtrans payments.

## 3. Official iPaymu documentation

Authoritative sources:

- https://docs.ipaymu.com/id/docs
- https://docs.ipaymu.com/id/docs/signature
- https://docs.ipaymu.com/id/docs/payment/redirect-payment
- https://docs.ipaymu.com/id/docs/payment/direct-payment
- https://docs.ipaymu.com/id/docs/payment/payment-channels
- https://docs.ipaymu.com/id/docs/callback
- https://docs.ipaymu.com/id/docs/transaction/check-transaction
- https://docs.ipaymu.com/id/docs/transaction/history-transaction
- https://docs.ipaymu.com/id/docs/ip-domain-validation
- https://github.com/ipaymu/docs-ipaymu-api-v2 (official source, inspected at
  commit `4d5c1840d6cf11d93694413e7ef346630d52c175`)

Verified behavior:

- API v2 base URLs are `https://sandbox.ipaymu.com` and
  `https://my.ipaymu.com`.
- API requests use `va`, `signature`, and `timestamp` headers.
- POST signature is HMAC-SHA256 over
  `METHOD:VA:lowercase_sha256(exact_json_body):API_KEY`, keyed by API key.
- Redirect payment is `POST /api/v2/payment`; it returns a hosted payment URL and
  does not expose card data to Indotix.
- Callback uses `X-Signature`, `X-Timestamp`, and `X-External-ID`. The callback
  body is type-normalized, case-sensitive key sorted, JSON encoded, then signed
  using HMAC-SHA256 keyed by merchant VA.
- Callback delivery is retried when iPaymu does not receive HTTP 200.
- Transaction inquiry is `POST /api/v2/transaction` by iPaymu transaction ID.
- Provider status codes are: `0` pending, `1` success, `2` cancelled, `3`
  refunded, `4` error, `5` failed, `6` success-unsettled, `7` escrow, and `-2`
  expired.
- Payment channels are discoverable at `GET /api/v2/payment-channels`, including
  feature and health status.
- Production requires a registered static origin IP and approved callback/return
  domains.

Officially undocumented financial behavior:

- The public API v2 collection has no cancel endpoint.
- The public API v2 collection has no merchant refund endpoint.
- No create-payment idempotency header/key is documented.
- No rate-limit contract is documented.
- Redirect expiration is expressed in hours and individual channels may impose
  different limits/defaults.

`feeDirection` is fixed to `MERCHANT` for cutover. The official inquiry schema
does not state a sufficiently precise invariant for comparing an order amount
when buyer-paid fees are added, so `BUYER` is rejected rather than weakening the
exact-amount check.

These gaps are not filled by assumptions. iPaymu refunds will require a manual,
audited provider action until iPaymu supplies an official API contract. An
ambiguous create timeout remains `unknown`; the server must not issue another
provider create request automatically.

## 4. Target flow and provider selection

Hosted Redirect Payment is selected because it preserves the current hosted
checkout UX across web and Flutter, keeps PAN/CVV outside Indotix, allows iPaymu
to present currently available channels, and minimizes PCI DSS scope. Direct
Payment is not selected because it would require new trusted channel-selection
contracts in both clients without improving financial integrity.

New transaction flow:

Client -> authenticated Laravel booking API/web action -> server recalculates
price/voucher/availability -> locked payment reservation -> configured provider
gateway -> iPaymu hosted URL -> user payment -> signed iPaymu callback ->
signature/timestamp/replay/reference/merchant/amount checks -> signed transaction
inquiry -> locked state transition -> unique side-effect outbox -> fulfillment.

Provider ownership is immutable per payment row:

- New transactions use `PAYMENT_GATEWAY` (`ipaymu` after cutover).
- Existing `provider=midtrans` rows always use Midtrans status/cancel/refund and
  remain accepted by the Midtrans callback.
- Existing `provider=ipaymu` rows always use iPaymu inquiry/callback even if the
  feature flag is rolled back for new payments.

## 5. Feature mapping

| Existing use | Midtrans | iPaymu equivalent | Decision |
| --- | --- | --- | --- |
| Hosted checkout | Snap | Redirect Payment | Use iPaymu hosted URL |
| Request auth | Basic server key | VA + timestamp + HMAC request signature | Backend only |
| Success notification | SHA-512 callback body signature | X-Signature HMAC-SHA256 | Separate callback route |
| Status lookup | order-id status | transaction ID inquiry | Store unique provider transaction ID |
| Dynamic methods | Snap UI | Hosted page / channel API | Hosted page; backend can cache channels later |
| Expiration | minute expiry | redirect expiry in hours/channel constraints | Align local deadline to requested provider window |
| Cancellation | API cancel/expire | no public API contract | No simulated provider cancel; fail closed/manual handling |
| Refund | API refund | no public API contract | Midtrans automatic; iPaymu manual audited workflow |
| Idempotent create | internal active key | no provider idempotency contract | One local attempt; timeout becomes unknown and blocks retry |

## 6. Provider-independent states

Internal payment states are `initiating`, `pending`, `paid`, `failed`, `expired`,
`cancelled`, `refunded`, and `unknown`. Raw provider status/code is stored
separately. Allowed terminal-state rules prevent `paid` from regressing to
pending/expired and prevent one provider transaction from being attached to two
payments.

iPaymu mapping:

- `0` -> pending
- `1` -> paid
- `2` -> cancelled
- `3` -> refunded
- `4`, `5` -> failed
- `6` -> paid (successful but not yet settled according to official docs)
- `7` -> unknown/manual review. Indotix does not request escrow, and the official
  status list does not establish escrow as permission to fulfill this product.
- `-2` -> expired
- missing/unknown -> unknown, never paid

## 7. Threat model and required controls

| Threat / attack path | Impact | Existing control | Required implementation/test | Residual risk |
| --- | --- | --- | --- | --- |
| Client tampers amount/discount | Underpayment | Server quote and booking calculation | Payment amount comes only from locked booking; callback and inquiry amount match | Business rule defects |
| Fake callback | Free ticket | Midtrans signature | iPaymu HMAC callback + merchant + timestamp + inquiry | Provider credential compromise |
| Replay/duplicate callback | Double fulfillment | Row locks and unique side-effect rows | Unique webhook event ID/hash and terminal transition rules | Provider reuses external ID; payload hash fallback |
| Parallel create/double click | Two payable sessions | Unique active key | Locked reservation and no retry after ambiguous timeout | Provider accepts request but response lost |
| Reference swapping/IDOR | Pay cheap order for expensive order | Ownership checks | Immutable server reference, provider/transaction unique indexes | Auth token theft |
| Late pending/expired after paid | Paid regression | Partial guard | Explicit state machine | Manual database tampering |
| Return/deep-link forgery | Fake paid UI/state | Finish page reads DB | Flutter/web return only trigger status refresh | Temporary stale UI |
| WebView arbitrary navigation | Phishing/custom scheme abuse | None; unrestricted JS and navigation | Gateway/initial-host allowlist; unknown HTTPS and custom schemes leave the WebView; insecure/script schemes blocked | Provider may add new legitimate hosts |
| Secret exposure | Gateway takeover | Server env config | No client secrets, redacted logs/errors, config validation | Host/secret-manager compromise |
| Timeout then retry | Duplicate provider transactions | Local active key | Mark unknown and reconcile; do not blindly repeat POST | No reference lookup/idempotency documented |
| Refund replay/abuse | Double refund | Admin auth and refund key | Provider-specific dispatch, row lock, unique refund, manual iPaymu evidence | Manual operator error |
| Voucher consumed but payment fails | Lost voucher quota | Existing booking-time reservation | Preserve policy; report as business residual risk | Existing behavior |

## 8. Expand/rollback/contract plan

1. Expand schema with provider-neutral fields and webhook event audit table.
2. Add gateway abstraction, iPaymu client, canonical status mapper, callback
   verifier, and provider dispatch while retaining Midtrans.
3. Add iPaymu route and narrowly scoped CSRF exclusion.
4. Keep API response keys `snap_token` and `redirect_url` for old mobile clients,
   while adding provider-neutral `payment_url` and `provider`.
5. Update web and Flutter to consume `payment_url`; do not trust return URL.
6. Deploy with `PAYMENT_GATEWAY=midtrans`, migrate, verify callbacks, then enable
   iPaymu in sandbox/staging and finally production.
7. Roll back new transactions by setting `PAYMENT_GATEWAY=midtrans`; never route
   existing iPaymu rows through Midtrans.
8. Contract/remove Midtrans only after all Midtrans payments/refunds are terminal,
   callback retention has elapsed, reconciliation shows zero actionable rows, and
   rollback is no longer required. This task performs no contraction.

## 9. Verification blockers

- Live sandbox proof requires valid sandbox VA/API key and an internet-reachable
  approved callback URL. Automated tests will use deterministic HTTP fakes and
  official signature vectors, but this is not equivalent to a live sandbox
  payment/callback.
- Automated iPaymu refund/cancel cannot be implemented until an official endpoint,
  authentication contract, status semantics, and idempotency behavior are supplied.
