# Payment Transaction Security Audit

**Repository:** defa-nugraha/indotix.monolith  
**Branch audited:** develop  
**Audited commit:** 3abd50e403198af0d93630b34a13fb21d90d687e  
**Audit date:** 2026-09-15  
**Mode:** Read-only / non-destructive  
**Primary active payment scope:** Wisata ticketing + Midtrans Snap  
**Technical verdict:** **HIGH RISK**

> This report is a source-code/configuration security assessment, not an ISO/IEC 27001 certification, PCI DSS attestation, penetration-test certificate, or assurance over Midtrans infrastructure. Controls that cannot be proven from repository/config/test evidence are marked NOT VERIFIED or NOT TESTED.

---

## 1. Executive Summary

The active Wisata payment flow has several strong controls: ticket prices are recalculated from trusted database records, quantity is bounded, voucher calculations are performed server-side, quota/voucher creation uses database transactions and row locks, booking ownership is checked on user endpoints, the Midtrans callback validates the documented SHA-512 signature using a timing-safe comparison, callback gross amount is checked against the stored transaction amount, paid ticket download/use is gated, and existing Midtrans security tests pass.

No evidence was found in the audited active flow that an unauthenticated attacker can simply submit status=paid, alter a client-side amount to Rp1, or forge a Midtrans callback without the server key and obtain a paid ticket.

However, **HIGH-risk transaction-integrity and financial-consistency issues remain**:

1. payment creation is not concurrency-safe/idempotent, so one booking can create more than one live Midtrans Snap payment attempt;
2. local cancellation/expiry does not cancel/expire the provider-side transaction, creating a late-payment state where money can settle while the booking remains cancelled/expired;
3. the admin refund endpoint marks refunds "processed" internally without calling Midtrans, does not require a settled payment, and does not cap the refund amount to the amount paid;
4. partner payout calculation does not subtract processed refunds, and affiliate commissions are not revoked by the refund handler;
5. expired pending bookings continue to consume ticket quota until some later code path explicitly changes their status; there is no scheduled booking-expiry/reconciliation job in the repository, and booking/payment endpoints have no explicit anti-automation throttle;
6. KTP, selfie KTP, and legal documents are stored on a public filesystem exposed under /storage;
7. payout request/generation operations lack idempotency/locking and can create duplicate payable records.

The current CI run for the audited commit did **not** pass overall. Quality checks, dependency audits, syntax, build, type checks, the newly added auth security tests, Wisata tests, and Midtrans callback tests passed, but one legacy email-verification test still expects the old insecure re-registration behavior and fails. Result: 327 passed, 1 failed, 1 skipped. Because the test job failed, the audited commit was not deployed to staging by CI.

### Direct answers to the requested executive questions

| Question | Result |
|---|---|
| Can a forged unsigned/incorrectly signed callback make a booking paid? | **No evidence; PASS for tested active mechanism.** Invalid signature is rejected. |
| Can a client directly manipulate payment amount/price? | **No evidence; PASS.** Active Wisata total is recalculated from DB ticket prices. |
| Can the webhook be forged? | **No evidence under server-key secrecy; PASS.** SHA-512 signature is verified with hash_equals. |
| Is replay/idempotency adequate? | **PARTIAL.** Per-order cache lock + sequential duplicate tests exist; DB atomicity and long-running/concurrent edge cases remain. |
| Can client-supplied payment status mark an order paid? | **No active path found. PASS.** Paid state comes from internal free-voucher logic or signed callback. |
| Is transaction ownership enforced? | **PASS in inspected active web/API booking endpoints.** |
| Are production payment secrets exposed? | **No secret found in inspected tracked high-risk config files; full history scan NOT TESTED.** |
| Is sensitive payment/card data stored? | **No PAN/CVV storage found in active flow; hosted Snap is used. NOT VERIFIED repository-wide.** |
| Can race conditions cause financial side effects? | **YES. FAIL.** Payment creation and payout requests are vulnerable to races. |
| Is refund handling safe? | **NO. FAIL.** It is an internal status mutation, not a verified gateway refund. |
| Does integration align with Midtrans security mechanism? | **PARTIAL.** Signature and amount checks align; cancel/expire/refund/reconciliation lifecycle is incomplete. |
| How close is the implementation to PCI/OWASP/ISO technical controls? | **PARTIAL.** Strong baseline controls exist, but transaction atomicity, lifecycle integrity, data protection and monitoring gaps prevent a passing technical verdict. |

---

## 2. Scope

Included:

- active Wisata public/web/API booking and payment routes;
- Midtrans Snap transaction creation;
- Midtrans notification/callback processing;
- cancellation, expiration, refund, ticket issuance, ticket use;
- voucher and quota integrity;
- affiliate commission and payout paths;
- destination/partner payout calculation;
- authentication and authorization relevant to payment;
- session/CSRF/security headers;
- payment and identity-document data storage;
- database migrations for active payment entities;
- CI/CD, dependency audit, deployment safeguards;
- legacy payment callback branches that remain reachable through the common callback endpoint;
- tests relevant to payment, booking, ownership, ticket use and security.

Reviewed as legacy/retired surface:

- Hotel, Event, Academy, Special Program, Souvenir code remains in the repository and in the shared payment callback;
- BlockRetiredProductFeatures blocks the corresponding public/admin/API product routes, so findings are prioritized based on current reachability.

Not included as tested facts:

- Midtrans merchant dashboard configuration;
- production/staging .env values;
- actual Cloudflare/TLS/WAF settings;
- production database contents;
- actual bank payout operations outside this source tree;
- destructive or real-money transactions;
- full Git-history secret scanning;
- external infrastructure penetration testing.

---

## 3. Methodology

Method: **CLAIM → EVIDENCE → VERIFICATION → RESULT**.

Evidence priority used:

1. source code;
2. configuration;
3. database migrations/schema;
4. dependency lockfiles;
5. automated test result;
6. CI result;
7. official Midtrans/OWASP/PCI/ISO references;
8. project documentation.

No production business logic was modified during this audit. Existing automated tests and CI were treated as non-destructive verification evidence.

Severity considers exploitability, financial impact, data exposure, authorization required, attack complexity, and transaction-integrity consequences.

---

## 4. Application Architecture

| Component | Verified implementation |
|---|---|
| Backend | Laravel Framework v12.62.0 |
| PHP requirement | composer.json: PHP ^8.2 |
| CI PHP | 8.4 |
| Docker PHP | php:8.2-fpm-bookworm |
| Frontend | React 19.2.4 + Inertia 2.3.12 + TypeScript/Vite |
| HTTP client | Laravel HTTP client / Guzzle stack |
| Database | CI MySQL 8.0; Docker MariaDB 11.4 |
| Cache | Redis configuration available; actual deployed CACHE_STORE NOT VERIFIED |
| Session | Redis default in config/session.php |
| Queue | Redis queue worker in docker-compose |
| Scheduler | schedule:run container exists, but no payment expiry/reconciliation schedule is defined in routes/console.php |
| Mobile auth | Laravel Sanctum |
| Web auth | Laravel session auth |
| Authorization | auth/verified/user/mitra/admin middleware + AdminPermissionRegistry/AdminDataScope |
| Payment provider | Midtrans |
| Midtrans SDK | **No official Midtrans PHP SDK dependency found**; custom HTTP integration |
| Integration | Midtrans Snap hosted checkout |
| Callback | POST /payments/midtrans/callback |
| Callback CSRF | Exempt by design; authenticated by Midtrans signature |
| Refund | Internal booking field update only; provider refund API not implemented |
| Reconciliation | MidtransService::status exists but no active scheduled reconciliation caller found |

### Runtime drift

CI tests on PHP 8.4 + MySQL 8.0 while the repository Docker runtime is PHP 8.2 + MariaDB 11.4. The SSH deployment pipeline does not itself prove the production PHP/database versions. Therefore production runtime parity is **NOT VERIFIED**.

---

## 5. Payment Gateway Integration

### Provider discovery

**Provider:** Midtrans  
**Integration type:** Snap hosted checkout, created server-side  
**Server credential:** services.midtrans.server_key from environment  
**Client credential:** services.midtrans.client_key, intentionally supplied to payment frontend  
**Production switch:** services.midtrans.is_production  
**Network:** HTTPS fixed Midtrans API/Snap URLs  
**Connect timeout:** 5 seconds default  
**Request timeout:** 20 seconds default  
**Automatic retry:** none in MidtransService  
**Get Status method:** implemented but not used in active callback/reconciliation flow  
**Cancel/Expire method:** not implemented in MidtransService  
**Refund method:** not implemented in MidtransService

Evidence:

- app/Services/MidtransService.php:11-42 — charge/status/snap
- app/Services/MidtransService.php:44-50 — signature verification
- app/Services/MidtransService.php:52-60 — authenticated HTTP client/timeouts
- app/Services/MidtransService.php:63-78 — fixed production/sandbox HTTPS endpoints

Official provider references used:

- Midtrans Receiving Notifications — signature is SHA512(order_id + status_code + gross_amount + server key)
- Midtrans Handle Notifications — webhook handlers should be idempotent because duplicate notifications may occur
- Midtrans Get Transaction Status — status API is available for Snap/Core transaction verification
- Midtrans Cancel Transaction / Expire Transaction — pending transactions can be invalidated provider-side
- Midtrans Refund Transactions — settlement refunds should use the refund API and a refund_key for retry/idempotency

---

## 6. Payment Data Flow

### Actual active Wisata flow

User / Mobile Client  
↓  
Wisata booking request  
↓  
Server validates destination/ticket/date/quantity  
↓  
Server loads ticket price from DB  
↓  
DB transaction + ticket row lock + quota calculation  
↓  
Optional voucher resolved/locked and discount calculated server-side  
↓  
WisataBooking created as pending_payment with payment_deadline  
↓  
User/API invokes payment creation  
↓  
Application checks for existing pending WisataPayment  
↓  
**NON-ATOMIC GAP: no booking/payment row lock around check → Midtrans request → insert**  
↓  
MidtransService::snap creates hosted Snap transaction  
↓  
WisataPayment stored + booking.midtrans_order_id updated  
↓  
Client opens Midtrans Snap UI  
↓  
Midtrans POST /payments/midtrans/callback  
↓  
SHA-512 signature verification  
↓  
Per-order cache lock  
↓  
Internal payment/booking lookup  
↓  
Gross amount check  
↓  
Status/fraud-status evaluation  
↓  
Terminal-state guard  
↓  
Payment record update  
↓  
Booking set paid  
↓  
User notification / push / ticket email  
↓  
Affiliate commission approved  
↓  
Paid/completed ticket may be downloaded and consumed using locked ticket-use flow

### Cancellation flow

Authenticated owner/admin  
→ booking set cancelled internally  
→ **no Midtrans cancel/expire request**  
→ existing provider payment can remain payable until provider expiry

### Refund flow

Authorized admin  
→ POST admin/wisata/bookings/{booking}/refund  
→ refund_status=processed + refund_amount stored  
→ **no Midtrans refund request or provider confirmation**

---

## 7. Trust Boundaries

| Source | Trust classification | Controls observed |
|---|---|---|
| Browser request | Untrusted | Laravel validation, authenticated web middleware, server-side pricing |
| Mobile/API request | Untrusted | Sanctum + verified, validation, ownership checks |
| Authenticated user IDs | Still untrusted | Booking ownership queries/checks |
| Admin request | Privileged but not trusted blindly | admin middleware, permission registry, AdminDataScope, validation, audit log |
| Midtrans callback | External/untrusted until authenticated | SHA-512 signature, amount/status checks |
| Midtrans API response | External trusted provider response | HTTPS; success/error handling; no schema validation observed |
| Environment | Deployment trust boundary | keys/config from env; actual production values NOT VERIFIED |
| Database | Trusted source of product price/state | row locks in booking creation and ticket usage |
| Filesystem public disk | Public trust boundary | currently used incorrectly for identity/legal documents |

---

## 8. Security Testing Environment

### Automated/CI evidence

Audited CI run: GitHub Actions run for commit 3abd50e403198af0d93630b34a13fb21d90d687e.

**Quality Checks: PASS**

Verified workflow stages include:

- composer validate
- composer install
- npm ci
- composer audit --locked
- npm audit --audit-level=high
- PHP syntax check
- frontend build
- TypeScript type check

**Test job: FAIL overall**

Result:

- **327 passed**
- **1 failed**
- **1 skipped**
- **2138 assertions**

Payment/security tests that passed include:

- Tests/Feature/Api/AuthSecurityTest
- Tests/Feature/Api/ProfileUpdateTest
- Tests/Feature/Api/WisataVisibilityTest
- Tests/Feature/Payments/MidtransCallbackTest
- Tests/Feature/Payments/MidtransNotificationProbeTest
- Tests/Feature/Payments/PartnerBalanceAfterPaymentTest
- Tests/Feature/WisataMultiTicketBookingTest
- Tests/Feature/WisataTicketScanAndPackageTest

Failure:

- Tests/Feature/Auth/EmailVerificationLinkDeliveryTest
- Legacy test still expects API re-registration of an existing unverified email to return 201 and mutate the account.
- Current hardened implementation correctly returns 422, so the test expectation is stale relative to the security control.

Because the test job failed, the develop commit was **not deployed to staging** by CI. Therefore the audited commit was **NOT runtime-tested on staging**.

---

## 9. Security Test Matrix

| ID | Test | Endpoint/Surface | Expected | Actual | Status | Evidence |
|---|---|---|---|---|---|---|
| T-01 | Payment amount tampering | Wisata booking/payment | Ignore client price; compute trusted total | DB price used; client does not submit authoritative total | PASS | API controller 369-447; multi-ticket tests |
| T-02 | Price/product tampering | booking quote/store/confirm | Ticket belongs to destination and active | Destination ownership + status checked | PASS | API 390-395; Web 550-560 |
| T-03 | Quantity abuse | booking | Positive bounded quantity | min/max enforced | PASS | validation + ticket order limits |
| T-04 | Voucher over-discount | web booking | Discount cannot exceed subtotal | percentage/fixed capped to subtotal | PASS | server-side voucher logic + tests |
| T-05 | Order ownership | API pay/cancel/ticket | User cannot operate another user's booking | user_id checked | PASS | API 229-230, 314-315, 352-353 |
| T-06 | Forged webhook: wrong signature | callback | Reject | HTTP 400 | PASS | MidtransCallbackTest |
| T-07 | Webhook amount mismatch | callback | Reject | HTTP 422, booking unchanged | PASS | MidtransCallbackTest |
| T-08 | Replay webhook sequential | callback | No duplicate fulfillment | Existing duplicate callback test passes | PASS/PARTIAL | sequential test only |
| T-09 | Replay webhook concurrent | callback | Atomic single fulfillment | No concurrent runtime test | NOT TESTED | cache lock exists; DB atomicity absent |
| T-10 | Payment creation duplicate | API/web pay | One provider transaction per booking | check-then-create is non-atomic | FAIL | API 256-298; Web 406-434 |
| T-11 | Payment status spoofing by client | booking/payment | Client cannot submit paid status | no active user field controls paid state | PASS | controller tracing |
| T-12 | Cancel provider transaction | API/admin cancel | Provider payment invalidated | only local state changes | FAIL | API 322-327; Admin 102-108 |
| T-13 | Expired booking release | quota | Deadline releases quota | stale pending status remains counted without scheduler | FAIL | availableTickets + routes/console.php |
| T-14 | Refund authorization | admin refund | privileged/scoped admin only | admin middleware/scope applies | PASS | routes + AdminDataScope |
| T-15 | Refund amount integrity | admin refund | <= actual refundable amount | nullable integer min:0 only | FAIL | WisataExceptionController 119-129 |
| T-16 | Actual gateway refund | admin refund | refund confirmed by provider | no Midtrans refund call | FAIL | refund controller + MidtransService |
| T-17 | Duplicate refund | admin refund | idempotent refund attempt | repeated request overwrites fields; no refund key | FAIL | refund controller/schema |
| T-18 | Partner payout after refund | finance | refunded amounts excluded | paid/completed gross total still included | FAIL | WisataFinanceController 127-144 |
| T-19 | Affiliate commission after refund | refund/affiliate | refunded commission cancelled | refund handler does not touch commission item | FAIL | callback 283-303 vs refund 113-131 |
| T-20 | Ticket download before payment | ticket endpoint | deny | denied unless paid/completed | PASS | API 356-357; web equivalent |
| T-21 | Ticket double-use | scan | atomic single-use | DB transaction + lockForUpdate | PASS | WisataTicketUsageService 94-155 |
| T-22 | CSRF on web state changes | web | protection active | default active; only callback exempt | PASS | bootstrap/app.php 34-36 |
| T-23 | CORS policy | API | explicit safe policy | effective deployed policy not proven | NOT VERIFIED | no project cors config found |
| T-24 | XSS in active payment surfaces | payment/review/ticket | safe rendering | no unsafe sink identified in inspected payment views | PASS (scope-limited) | React + escaped Blade review |
| T-25 | SQL/command injection | active payment controllers | parameterized queries/no shell | no unsafe sink found in active payment path | PASS (scope-limited) | Eloquent/query builder tracing |
| T-26 | Mass assignment | payment/booking | sensitive fields not client mass-assigned | active controllers construct trusted arrays | PASS |
| T-27 | Current tracked payment secret exposure | config/workflow | no server key committed | env references only in inspected files | PASS (scope-limited) |
| T-28 | Git history secret scan | repository history | no secrets in history | scanner not executed | NOT TESTED |
| T-29 | TLS verification outbound | Midtrans HTTP | certificate verification on | no verify=false override | PASS | MidtransService 52-60 |
| T-30 | Production inbound TLS/cookies | deployed runtime | HTTPS + Secure cookies | production env/proxy not available in repository | NOT VERIFIED |
| T-31 | Open redirect | active payment | no user-controlled arbitrary redirect | no server-side user return URL found | PASS (scope-limited) |
| T-32 | SSRF | active payment | no client-controlled backend fetch | Midtrans endpoints are fixed | NOT APPLICABLE / no sink found |
| T-33 | Dependency audit | CI | no high audit failure | quality job passed | PASS |
| T-34 | Full SAST/CodeQL/Semgrep | repository | automated code security scan | not configured/executed in audited run | NOT TESTED |
| T-35 | Identity document confidentiality | partner onboarding | private authorized storage | stored on public disk | FAIL |

---

## 10. Critical Findings

**No CRITICAL finding was proven in the current audited active payment flow.**

Specifically, this audit did not prove:

- forged unsigned payment success;
- arbitrary client amount manipulation into a paid transaction;
- exposed production Midtrans server key;
- unauthenticated refund;
- PAN/CVV storage;
- direct client-side payment status override.

This does not justify PASS because multiple HIGH findings directly affect transaction integrity, refunds, payouts and sensitive data.

---

## 11. High Findings

### SEC-PAY-001 — Payment creation is not atomic or idempotent

**Severity:** HIGH  
**Status:** OPEN  
**Affected component:** Wisata Snap payment creation  
**Files:**  
- app/Http/Controllers/Api/WisataBookingController.php:225-308  
- app/Http/Controllers/WisataBookingController.php:381-436, createSnapPayment around 861+  
- database/migrations/2026_02_01_171000_create_wisata_payments_table.php:10-20  
**Functions:** pay(), createSnapPayment()  
**Endpoints:** POST /api/wisata/bookings/{booking}/pay; POST /wisata/booking/{booking}/pay  
**Confidence:** HIGH for race existence; MEDIUM for provider accepting two live attempts because no concurrent sandbox test was run.

**Evidence**

The flow is:

1. query whether a pending payment exists;
2. if none, generate order ID;
3. call Midtrans remotely;
4. insert WisataPayment;
5. update booking.

There is no transaction/row lock covering this sequence. order_id is generated with second-resolution timestamp. Database uniqueness exists only on order_id, not on a single active payment attempt per booking.

**Attack/failure scenario**

Two concurrent pay requests can both observe "no pending payment". If their generated order IDs differ, both can create Midtrans Snap transactions for the same booking. A gateway timeout after a successful remote create but before local insert has the same effect when the user retries.

**Impact**

- duplicate customer payment opportunities;
- orphan provider transaction;
- ambiguous reconciliation;
- refund/support burden;
- booking.midtrans_order_id may reference only the later attempt.

**Reproduction / verification**

Static race proven by source ordering. **Concurrent provider test NOT TESTED** to avoid creating external transactions.

**Expected**

A booking should have at most one active payment attempt, with a stable idempotency identity and atomic local state transition.

**Actual**

Check-then-call-then-insert is non-atomic.

**Recommended remediation**

- introduce a payment-attempt state machine;
- lock booking row with lockForUpdate before creating/resolving the attempt;
- persist a stable UUID/ULID order ID before remote call;
- make retry reuse the same active attempt/order ID;
- on network timeout query Midtrans status before creating another attempt;
- add database constraints appropriate to the state model;
- add concurrent tests.

**Relevant standards**

- OWASP ASVS v5.0.0 V2.3.3 transaction atomicity
- OWASP ASVS v5.0.0 V2.3.4 business-logic locking
- PCI DSS Requirement 6 secure software principles

---

### SEC-PAY-002 — Local cancellation/expiry does not invalidate the Midtrans transaction

**Severity:** HIGH  
**Status:** OPEN  
**Affected component:** cancellation/payment lifecycle  
**Files:**  
- app/Http/Controllers/Api/WisataBookingController.php:310-345  
- app/Http/Controllers/Admin/WisataExceptionController.php:86-110  
- app/Http/Controllers/MidtransCallbackController.php:136-200  
- app/Services/MidtransService.php:11-79  
**Confidence:** HIGH

**Evidence**

User/admin cancellation only updates local booking fields. MidtransService has charge/status/snap but no cancel/expire/refund method.

The callback updates WisataPayment from a valid successful provider notification before the terminal booking guard. A cancelled/expired booking is intentionally not reactivated, so a real settlement can coexist with a cancelled booking.

**Attack/failure scenario**

1. user creates payment and receives a valid Snap token;
2. booking is cancelled locally while provider transaction is still pending;
3. customer completes payment using the still-valid provider transaction;
4. Midtrans sends valid settlement;
5. local payment becomes settlement;
6. terminal guard leaves booking cancelled;
7. no ticket is fulfilled and no automatic refund is started.

**Impact**

Customer money can be captured without service fulfillment, creating a financial reconciliation/refund incident.

**Expected**

Cancellation should invalidate a pending provider transaction; if settlement already occurred, initiate/queue a verified refund.

**Actual**

Only local state changes.

**Recommended remediation**

- implement Midtrans cancel/expire API;
- make cancellation state transition atomic and provider-aware;
- handle race "cancel vs settlement" by status inquiry;
- if already settled, create an idempotent refund workflow instead of marking local cancellation complete;
- record provider cancellation/refund identifiers and results.

**Provider evidence**

Midtrans documents Cancel for pending transactions and Refund for settled transactions.

**Relevant standards**

- ASVS v5.0.0 V2.3.1/V2.3.3
- PCI DSS Requirement 6
- ISO/IEC 27001:2022 technical alignment: secure application/process integrity

---

### SEC-PAY-003 — Refund endpoint records a refund as processed without executing/verifying a gateway refund

**Severity:** HIGH  
**Status:** OPEN  
**Affected component:** Admin Wisata refund  
**File:** app/Http/Controllers/Admin/WisataExceptionController.php:113-131  
**Endpoint:** POST admin/wisata/bookings/{booking}/refund  
**Confidence:** HIGH

**Evidence**

Validation only requires:

- reason;
- nullable integer amount with min:0.

The code then sets refund_status=processed directly.

There is no check that:

- booking is paid/settled;
- provider status is settlement;
- amount <= amount actually paid;
- amount > 0;
- cumulative refund <= paid amount;
- payment method supports provider refund;
- the refund has a unique idempotency key;
- Midtrans refund succeeded;
- a refund webhook/status inquiry confirmed success.

**Attack scenario**

A privileged admin or accidental request can mark an unpaid booking refunded, record refund_amount greater than total payment, or repeatedly overwrite the refund record. Operations/accounting may treat it as a real completed refund although no provider money movement happened.

**Impact**

- false refund records;
- customer-support/accounting errors;
- impossible reconciliation;
- potential over-refund if a later manual provider refund is also made.

**Expected**

Refund state must reflect a provider-confirmed refund workflow.

**Actual**

"processed" means local database mutation only.

**Recommended remediation**

Implement a Refund entity/state machine with pending/submitted/processed/failed, validate remaining refundable amount, require settled payment, use Midtrans refund API/refund_key where supported, use cancel for eligible non-settled transactions, verify result/status, and make retries idempotent.

**Provider evidence**

Midtrans documents refund for settlement and refund_key as the merchant retry/idempotency identifier.

**Relevant standards**

- ASVS V2.2.1, V2.3.3
- PCI DSS Requirement 6
- financial transaction integrity controls

---

### SEC-PAY-004 — Refunded sales remain eligible for partner payout and affiliate commission

**Severity:** HIGH  
**Status:** OPEN  
**Affected components:** destination payout, affiliate commission  
**Files:**  
- app/Http/Controllers/Admin/WisataFinanceController.php:111-162  
- app/Http/Controllers/MidtransCallbackController.php:237-303  
- app/Http/Controllers/Admin/WisataExceptionController.php:113-131  
- app/Http/Controllers/Affiliate/PayoutController.php:54-88  
**Confidence:** HIGH

**Evidence**

Destination payout generation sums total_price for all bookings with status paid/completed and does not subtract/refuse bookings whose refund_status is processed.

Affiliate commission is set approved after successful payment. The refund handler does not cancel or reverse the associated WisataAffiliateCommissionItem.

Affiliate payout availability sums all approved commission items.

**Attack/failure scenario**

A sale is paid, then refunded. The internal booking may remain paid/completed while refund_status=processed. Later destination payout includes the original gross amount, and affiliate balance can still include the approved commission.

**Impact**

- merchant overpayment;
- affiliate overpayment;
- platform bears the refund while still paying commission;
- finance reports/payout records diverge from net settled value.

**Recommended remediation**

Use ledger-style financial records. Refund completion must atomically create negative adjustments/reversals for destination payable and affiliate commission. Payout generation should use immutable net ledger entries, not recompute gross booking totals without refund state.

**Relevant standards**

- ASVS V2.3.3
- transaction/accounting integrity

---

### SEC-PAY-005 — Expired pending bookings can reserve ticket quota indefinitely

**Severity:** HIGH  
**Status:** OPEN  
**Affected component:** inventory/quota lifecycle  
**Files:**  
- app/Http/Controllers/Api/WisataBookingController.php:548-575  
- app/Http/Controllers/WisataBookingController.php:721-745  
- app/Models/WisataBooking.php:97-102  
- routes/console.php:1-211  
- app/Jobs: only CompressPromoVideoJob and SendPushNotificationJob present  
**Confidence:** HIGH

**Evidence**

availableTickets counts every booking with status pending_payment, paid or completed. It does not exclude pending bookings whose payment_deadline is already in the past.

WisataBooking::isExpired only reports expiry; controllers mutate status when a user later visits/pays.

The repository has a scheduler service, but routes/console.php defines no payment expiry/reconciliation schedule and there is no payment expiry job.

No explicit throttle is attached to active booking creation/pay routes.

**Attack scenario**

A verified account repeatedly creates pending bookings up to per-order quantity limits and abandons payment. After the deadline, records remain pending_payment and continue to reduce available quota. The process can be repeated to exhaust inventory.

**Impact**

- denial of inventory / lost sales;
- false sold-out state;
- merchant operational disruption.

**Expected**

Expired reservations should be released automatically and queries should never count an already-expired pending hold.

**Recommended remediation**

- schedule a frequent expiry job with row locking and bounded batches;
- mark pending bookings expired after deadline;
- if Midtrans payment exists, expire/cancel provider transaction safely;
- additionally make availability queries ignore pending records whose deadline has passed;
- add rate limiting/anti-automation per user/IP/device.

**Relevant standards**

- ASVS v5.0.0 V2.3.4
- ASVS v5.0.0 V2.4.1 anti-automation

---

### SEC-PAY-006 — KTP, selfie KTP and legal documents are stored on publicly served storage

**Severity:** HIGH  
**Status:** OPEN  
**Affected component:** Mitra identity verification documents  
**Files:**  
- app/Http/Controllers/Mitra/Wisata/DestinationController.php:78-155  
- config/filesystems.php:41-47  
- docker/nginx/default.conf:12-16  
**Confidence:** HIGH

**Evidence**

The upload map includes ktp_file, selfie_ktp_file and legal_doc_file. Every upload uses MediaCompressionService::store(..., 'public').

The public disk maps to storage/app/public with public visibility and /storage URL. Nginx directly serves /storage from that directory.

**Attack scenario**

Anyone who obtains/guesses/leaks a document URL can request the document without an authorization check. URL entropy is not an authorization control.

**Impact**

Identity theft/privacy breach, legal/compliance exposure, disclosure of government ID/legal documents.

**Recommended remediation**

Move sensitive files to a private disk. Serve them only through an authenticated/authorized controller using short-lived signed download responses where appropriate, log sensitive-document access, and migrate/delete existing public copies.

**Relevant standards**

- ASVS V14 Data Protection
- ISO/IEC 27001 confidentiality/access-control alignment
- PCI-style least-privilege principles (although KTP is not cardholder data)

---

## 12. Medium Findings

### SEC-PAY-007 — Affiliate and destination payout creation lacks idempotency/locking

**Severity:** MEDIUM  
**Status:** OPEN  
**Files:**  
- app/Http/Controllers/Affiliate/PayoutController.php:54-88  
- app/Http/Controllers/Admin/WisataFinanceController.php:111-146  
- database migration for wisata_affiliate_payouts: no uniqueness preventing duplicate active requests  
**Confidence:** HIGH

Affiliate payout performs approvedTotal → reserved → available → create without a transaction/lock. Two concurrent requests can calculate the same available value and create duplicate pending payouts.

Destination generatePayout allows overlapping/same periods repeatedly and has no uniqueness/idempotency constraint.

No automated bank transfer was found in source, so direct double disbursement was not proven; however duplicate payable records are a material operational risk.

**Remediation:** transaction + row/advisory lock, stable payout request key, unique constraints/state model, prevent overlapping periods, require controlled approval.

---

### SEC-PAY-008 — Callback fulfillment is not a single database transaction

**Severity:** MEDIUM  
**Status:** OPEN  
**File:** app/Http/Controllers/MidtransCallbackController.php  
**Confidence:** MEDIUM-HIGH

A per-order cache lock reduces concurrent processing, but payment update, booking update, notification creation, email sending and commission updates are not committed as one database state transition.

A crash after status=paid but before all side effects can produce partial fulfillment. A retry may see the booking already paid and skip some first-payment actions.

The lock has a 30-second TTL; long downstream operations can outlive it. The effective deployed cache backend is NOT VERIFIED.

**Remediation:** keep the transaction-critical state change small and atomic with row locks/compare-and-swap; enqueue side effects using an outbox/after-commit event with idempotency keys.

---

### SEC-PAY-009 — No scheduled payment reconciliation / timeout recovery

**Severity:** MEDIUM  
**Status:** OPEN  
**Files:** app/Services/MidtransService.php:22-30; routes/console.php  
**Confidence:** HIGH

MidtransService::status exists, but no active scheduled reconciliation was found. There is no job that resolves cases such as:

- Snap create succeeded remotely but local request timed out;
- webhook delivery repeatedly failed;
- local payment status differs from provider;
- terminal local booking has provider settlement.

**Remediation:** scheduled reconciliation using status API for non-final/recent anomalous transactions; alert on mismatches; never create a fresh attempt after ambiguous timeout without status inquiry.

---

### SEC-PAY-010 — Payment endpoints lack explicit anti-automation/rate limiting

**Severity:** MEDIUM  
**Status:** OPEN  
**Affected endpoints:** booking create/confirm/pay and affiliate payout  
**Confidence:** HIGH

Authentication limits exist for auth endpoints, but no explicit throttle middleware was found on active Wisata booking/pay routes.

This amplifies quota exhaustion and payment-attempt abuse.

**Remediation:** use risk-based per-user/IP/device rate limits for create booking/payment and payout request. Do not naively throttle provider webhook delivery.

---

### SEC-PAY-011 — Payment page lacks Content-Security-Policy in application security headers

**Severity:** MEDIUM  
**Status:** OPEN / defense-in-depth  
**File:** app/Http/Middleware/AddSecurityHeaders.php:15-27  
**Confidence:** HIGH for absence in this middleware; deployed proxy headers NOT VERIFIED.

X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy and conditional HSTS exist. No CSP header is set by application code.

Payment pages load Midtrans Snap script from an external origin. No exploitable XSS was demonstrated, but CSP/script governance is important defense-in-depth for payment surfaces.

**Remediation:** deploy a tested CSP that allows only required self/Midtrans/script/frame/connect sources, preferably nonce/hash-based for first-party scripts. Document payment-page script inventory and change control.

---

### SEC-PAY-012 — CI/runtime parity is not established

**Severity:** MEDIUM  
**Status:** OPEN  
**Files:** .github/workflows/pipeline.yml; Dockerfile; docker-compose.prod.yml  
**Confidence:** HIGH for repository mismatch; LOW for actual production mismatch.

CI: PHP 8.4 + MySQL 8.0.  
Docker: PHP 8.2 + MariaDB 11.4.  
Actual SSH-deployed production runtime versions are NOT VERIFIED.

**Remediation:** test against the actual production PHP/database combination, or add a compatibility matrix.

---

## 13. Low Findings

### SEC-PAY-013 — Non-documented transaction status "success" is accepted as provider success

**Severity:** LOW  
**Status:** OPEN  
**File:** app/Http/Controllers/MidtransCallbackController.php:92-100  
**Confidence:** HIGH

The code considers settlement, success, and capture acceptable. Midtrans's documented transaction status set includes settlement/capture but the reviewed status documentation does not identify generic success as a standard transaction_status.

Signature verification greatly reduces exploitability, but accepting undocumented states increases state-machine ambiguity.

**Remediation:** allow-list only provider-documented statuses required by the configured integration.

---

### SEC-PAY-014 — Callback monetary equality uses float + round

**Severity:** LOW  
**Status:** OPEN  
**File:** app/Http/Controllers/MidtransCallbackController.php:664-695  
**Confidence:** HIGH

gross_amount string is converted to float and rounded before integer comparison. For IDR, application amounts are integer, but strict canonical decimal parsing would be more robust and avoid floating-point/rounding ambiguity.

Because a valid provider signature is required, no practical external amount-bypass was demonstrated.

**Remediation:** parse provider decimal amount using decimal/string arithmetic and require exact expected currency/amount format.

---

## 14. Informational Findings

### SEC-PAY-INFO-001 — Current CI failure is a stale security expectation

The only failing test expects an existing unverified account to be re-registered and mutated. This conflicts with the current account-takeover hardening. Security tests for the new behavior pass.

Update the obsolete test before release; do not revert the hardened behavior to make CI green.

### SEC-PAY-INFO-002 — Full repository/history secret scan not performed

Current tree inspection found .env ignored and payment keys referenced through environment variables. No private-key/database-dump/production-env filenames were present in the current Git tree except .env.example.

However, gitleaks/trufflehog was not run against full history, so historical credential exposure is **NOT VERIFIED**.

### SEC-PAY-INFO-003 — No PAN/CVV processing found in active app

The active application uses Midtrans Snap hosted UI. No active application field/database column for PAN/CVV was identified in the inspected payment path. Full historical/repository verification is limited by lack of a full SAST/secret scan.

---

## 15. Payment Flow Security Matrix

| Stage | Trust Boundary | Security Control | Evidence | Result |
|---|---|---|---|---|
| Checkout | Browser/mobile → app | validation; authenticated confirm | controllers/routes | PASS |
| Create booking | Client → DB | server price, quota lock, transaction | build summary/store/confirm | PASS |
| Voucher | Client code → DB | server lookup, limits, row lock | controller/tests | PASS |
| Create transaction | App → Midtrans | HTTPS/basic auth | MidtransService | PASS |
| Create transaction idempotency | App/parallel requests | pending check only | pay methods | **FAIL** |
| Payment | Card/e-wallet user → Midtrans | hosted Snap | frontend config | provider-controlled |
| Callback | Midtrans → app | signature + amount + status + cache lock | callback/service/tests | PASS/PARTIAL |
| Verification | callback data → state | no synchronous status inquiry | MidtransService status unused | PARTIAL |
| DB update | callback → payment/booking | sequential updates, no DB transaction | callback | PARTIAL |
| Fulfillment | paid booking → ticket | paid/completed gate; ticket locks | ticket endpoints/service | PASS |
| Cancel | app → provider | local only | cancel controllers | **FAIL** |
| Expire | app → provider | Snap expiry set at creation but no local expiry job/provider expire on local terminalization | controllers/console | **FAIL/PARTIAL** |
| Refund | admin → provider | internal DB flag only | refund controller | **FAIL** |
| Partner payout | booking/refund → payable | gross paid/completed sum; refund ignored | finance controller | **FAIL** |
| Affiliate payout | commission → payout | balance calculation, no lock/idempotency | payout controller | **FAIL/PARTIAL** |
| Reconciliation | DB ↔ Midtrans | status method exists, no schedule | service/console | **FAIL/PARTIAL** |

---

## 16. Webhook Security Assessment

### Positive controls

**PASS — Signature verification**

app/Services/MidtransService.php:44-50 computes SHA-512 over the Midtrans documented fields and compares with hash_equals.

**PASS — Gross amount validation**

The callback compares notification gross amount with the stored payment/booking amount and the automated mismatch test passes.

**PASS — Fraud-status handling improved**

capture with fraud_status=challenge does not mark booking paid in the existing automated test.

**PASS — Terminal booking reactivation blocked**

A successful callback does not reactivate cancelled/expired/completed/no_show booking state.

**PASS/PARTIAL — Replay control**

Per-order cache lock exists and sequential duplicate notification behavior is tested. Concurrent multi-process runtime testing was not performed.

### Gaps

- no provider merchant_id/currency validation in fulfillment logic;
- no status inquiry before high-risk anomalous transition;
- no atomic DB state transition/outbox;
- local terminal state can conflict with real provider settlement;
- no reconciliation worker.

**Overall webhook verdict:** **PASS WITH MATERIAL LIFECYCLE FINDINGS**, not forged-webhook vulnerable based on current evidence.

---

## 17. Transaction Integrity Assessment

### Strong controls

- price comes from WisataTicket DB object;
- ticket belongs to selected destination;
- active/closed/date validity enforced;
- quantity bounded;
- ticket quota is checked while ticket rows are locked during create;
- voucher calculation is server-side and bounded to subtotal;
- payment callback amount must match internal amount;
- ticket consumption uses DB transaction and lockForUpdate.

### Weak controls

- remote payment creation is not part of an idempotent state machine;
- provider and internal cancel/refund states are not synchronized;
- refund/payout/commission do not form an auditable financial ledger;
- stale pending reservations are not auto-released;
- callback updates/side effects are not transactionally atomic.

**Result:** **FAIL — HIGH RISK** for end-to-end transaction integrity despite strong checkout validation.

---

## 18. Authentication & Authorization Assessment

### Positive

- API Wisata booking routes require auth:sanctum + verified.
- Web payment routes require auth + verified + user + user.activity.
- API pay/cancel/ticket compares booking.user_id with authenticated user.
- Web payment/show/ticket performs equivalent user ownership checks.
- Admin routes require auth + verified + admin + admin.log.
- AdminDataScope limits custom-admin access to relevant destination ownership.
- Existing custom-role security tests pass.
- unverified-account registration takeover path has been hardened and AuthSecurityTest passes.

### Gaps / limitations

- MFA for privileged admin accounts was not verified from the repository.
- Admin refund is mapped to general feature/update authorization rather than a clearly separate high-risk refund permission.
- production identity/session policy values are not available.

**Result:** PASS/PARTIAL.

---

## 19. Secret Management Assessment

### Verified positive controls

- .env, .env.production and .env.backup are gitignored.
- current .env.example does not contain populated Midtrans server/client key values.
- GitHub deployment credentials are referenced as environment secrets.
- deploy action enforces StrictHostKeyChecking and refuses root SSH user.
- no obvious key/dump/backup credential files were present in the current Git tree based on filename inspection.

### NOT VERIFIED

- full Git history secret scan;
- organization/repository secret permissions;
- rotation history;
- production Midtrans key values;
- whether any past commit contained a credential.

**Status:** PARTIAL / NOT VERIFIED.

---

## 20. Data Protection Assessment

### Cardholder data

No application-owned PAN/CVV/PIN field or storage was identified in the active Wisata Snap flow. Hosted Midtrans Snap reduces direct cardholder-data handling by the application.

**PCI scope cannot be determined from source alone.**

### Identity/financial PII

**FAIL:** KTP/selfie/legal documents use public storage.

Bank account numbers for Mitra/Affiliate are stored as plain string attributes; no encrypted cast was observed. Database/disk encryption at infrastructure level is NOT VERIFIED.

### Logging

Admin audit middleware explicitly redacts keys containing token, secret, password, otp, pin, authorization, signature, bank_account_number and account_number — positive control.

Midtrans error exceptions can include provider response body in exception text, and API payment controller logs the exception message. Exact sensitive data returned in error responses is NOT VERIFIED; consider structured/redacted provider logging.

---

## 21. Dependency Security Assessment

CI quality workflow executes:

- composer audit --locked --no-interaction
- npm audit --audit-level=high

The Quality Checks job passed on the audited commit, so no dependency issue severe enough to fail those configured commands was reported by CI.

Key versions verified:

- Laravel Framework v12.62.0
- Sanctum v4.3.1
- Fortify v1.36.2
- Guzzle v7.15.2
- React 19.2.4
- Inertia React 2.3.12
- Axios 1.18.1
- Vite 7.3.5

**Limitations:** No SBOM review, CodeQL, Semgrep, container image scan or PHP runtime CVE scan was executed as part of this audit.

**Status:** PASS for configured dependency audits; PARTIAL overall vulnerability-management coverage.

---

## 22. PCI DSS v4.0.1 Gap Analysis

> This is a repository-level technical gap mapping only. It is not a PCI DSS assessment/attestation and does not determine the organization's SAQ/ROC scope.

| PCI DSS area | Evidence | Status | Gap |
|---|---|---|---|
| Req. 3 — Protect stored account data | No PAN/CVV storage found in active flow | NOT VERIFIABLE / likely reduced scope | Provider/payment scope and production data not assessed |
| Req. 4 — Protect data over public networks | Midtrans endpoints fixed HTTPS; no TLS verify disable | PARTIAL/PASS | inbound production TLS NOT VERIFIED |
| Req. 6 — Develop/maintain secure systems/software | CI audit, tests, validation, secure coding controls | PARTIAL | high transaction lifecycle findings; no SAST |
| Req. 6 payment-page script security | external Midtrans Snap script; no app CSP | PARTIAL | CSP/script inventory/integrity governance not verified |
| Req. 7 — Restrict access | role/permission/ownership controls | PARTIAL/PASS | organizational access reviews not verified |
| Req. 8 — Authentication | verified-user gates, hardened registration | PARTIAL | privileged MFA/runtime policy not verified |
| Req. 10 — Log/monitor access | admin audit log + redaction | PARTIAL | retention, SIEM/review/alerting not verified; payment anomaly logging limited |
| Req. 11 — Regularly test security | automated tests/dependency audit | PARTIAL | no SAST/DAST/concurrency/security scanner evidence |
| Req. 12 — Security program | outside source scope | NOT VERIFIABLE | policies, IR, risk governance, training not audited |

PCI DSS v4.0.1 is the current limited revision of PCI DSS v4 and did not add/delete requirements relative to v4.0; formal applicability must be determined through the actual cardholder-data/payment architecture.

---

## 23. ISO/IEC 27001:2022 Technical Alignment

> **Do not interpret this table as ISO/IEC 27001 compliance or certification.** ISO/IEC 27001 is an ISMS standard requiring organization-wide governance, risk management, policy, people and operational processes in addition to technical controls.

| Technical area | Repository evidence | Status |
|---|---|---|
| Access control / least privilege | auth/verified/admin/custom permissions/ownership | Aligned / Partially aligned |
| Secure authentication | Sanctum/session, verified email, re-auth for email change | Partially aligned |
| Information confidentiality | server secrets in env; private storage exists | Partially aligned |
| Sensitive identity documents | KTP/legal stored public | **Not aligned** |
| Logging | admin audit log with redaction | Partially aligned |
| Monitoring/reconciliation | no payment reconciliation scheduler | **Not aligned / partial** |
| Secure configuration | production APP_DEBUG guard, SSH strict host checking | Aligned in repository controls |
| Secure development lifecycle | CI tests, dependency audits, reviewable immutable releases | Partially aligned |
| Secure coding/business integrity | server validation/locking strong in booking creation | Partially aligned |
| Change management | staged develop/main CI/CD with controlled prod trigger | Aligned technically |
| Backup | production deployment runs restrictive-permission DB backup | Aligned technically |
| Incident/organizational governance | not present in source scope | NOT VERIFIABLE |

ISO states that ISO/IEC 27001 defines requirements for an Information Security Management System and takes a holistic people/process/technology approach. Therefore source code alone cannot establish conformity.

---

## 24. OWASP ASVS 5.0.0 Mapping

OWASP ASVS 5.0.0 is the current stable version used for this mapping.

| ASVS area | Result | Evidence / gap |
|---|---|---|
| v5.0.0-V2.2.1 input validation | PASS/PARTIAL | request validation and business bounds strong; refund amount bound incomplete |
| v5.0.0-V2.2.2 trusted service-layer validation | PASS | server-side ticket price/total |
| v5.0.0-V2.3.1 business flow sequence | PARTIAL | cancel/refund/provider state mismatch |
| v5.0.0-V2.3.2 business limits | PARTIAL | ticket limits good; refund/payout limits incomplete |
| v5.0.0-V2.3.3 transaction atomicity | **FAIL** | payment create, refund/payout/callback side effects |
| v5.0.0-V2.3.4 limited resource locking | PASS/PARTIAL | booking quota lock good; expired reservations not released |
| v5.0.0-V2.4.1 anti-automation | **FAIL/PARTIAL** | no explicit booking/pay throttles |
| V14 Data Protection | **FAIL/PARTIAL** | public KTP/legal documents |
| V16 Security Logging & Error Handling | PARTIAL | admin audit/redaction good; security monitoring/reconciliation incomplete |

---

## 25. Attack Path Analysis

### AP-01 — Duplicate provider payment attempt

Authenticated verified user  
→ create valid pending booking  
→ send concurrent pay requests / retry after ambiguous timeout  
→ both requests pass "no pending payment" check  
→ distinct Midtrans order IDs can be created  
→ multiple live provider payment attempts for one booking  
→ duplicate charge/reconciliation incident

**Finding:** SEC-PAY-001

### AP-02 — Paid money with cancelled ticket

Authenticated owner creates booking/payment  
→ receives valid Snap transaction  
→ cancels booking locally  
→ provider transaction is not cancelled/expired  
→ customer completes payment  
→ valid Midtrans settlement callback arrives  
→ payment record becomes settlement  
→ terminal guard keeps booking cancelled  
→ no ticket fulfillment / no automatic refund

**Finding:** SEC-PAY-002

### AP-03 — Inventory denial via abandoned reservations

Verified account  
→ create pending bookings repeatedly  
→ each pending booking consumes quota  
→ do not pay  
→ payment_deadline passes  
→ no scheduled expiry changes status  
→ availableTickets continues counting pending_payment  
→ destination appears sold out

**Finding:** SEC-PAY-005

### AP-04 — Refund/accounting/payout inconsistency

Paid booking  
→ admin marks refund processed internally  
→ no Midtrans refund occurs  
→ destination payout calculation still includes original total  
→ affiliate commission stays approved  
→ payout records can be generated on gross/refunded sale

**Findings:** SEC-PAY-003 / 004

### AP-05 — Duplicate affiliate payout request

Affiliate has approved available commission  
→ sends concurrent POST /affiliate/payouts  
→ both requests calculate the same approved/reserved balance before insert  
→ both create pending payout for same balance  
→ operator can see/process duplicated payable records

**Finding:** SEC-PAY-007

---

## 26. Risk Register

| ID | Severity | Business risk | Exploit/trigger | Confidence | Priority |
|---|---|---|---|---|---|
| SEC-PAY-001 | HIGH | double/orphan payment | concurrent/retry | HIGH/MEDIUM provider | P0 |
| SEC-PAY-002 | HIGH | money paid, service cancelled | normal cancel + late pay | HIGH | P0 |
| SEC-PAY-003 | HIGH | false/unsafe refund accounting | privileged admin/refund | HIGH | P0 |
| SEC-PAY-004 | HIGH | merchant/affiliate overpayment | refund + payout | HIGH | P0 |
| SEC-PAY-005 | HIGH | ticket inventory DoS/lost sales | repeated abandoned bookings | HIGH | P0 |
| SEC-PAY-006 | HIGH | KTP/legal-document exposure | URL disclosure/access | HIGH | P0 |
| SEC-PAY-007 | MEDIUM | duplicate payable record | concurrent payout request | HIGH | P1 |
| SEC-PAY-008 | MEDIUM | partial fulfillment state | crash/lock expiry | MEDIUM-HIGH | P1 |
| SEC-PAY-009 | MEDIUM | stale/ambiguous transactions | webhook/network failure | HIGH | P1 |
| SEC-PAY-010 | MEDIUM | automation abuse | authenticated automation | HIGH | P1 |
| SEC-PAY-011 | MEDIUM | reduced XSS/payment-page defense | client-side compromise precondition | HIGH absence | P2 |
| SEC-PAY-012 | MEDIUM | environment-only regressions | version differences | MEDIUM | P2 |
| SEC-PAY-013 | LOW | ambiguous state acceptance | valid signed undocumented status | HIGH | P3 |
| SEC-PAY-014 | LOW | amount parsing ambiguity | valid signed fractional amount | HIGH | P3 |

---

## 27. Recommended Remediation

### Payment state machine

Define explicit local states such as:

- booking: pending_payment → paid → completed
- pending_payment → cancelled/expired
- paid → refund_pending → refunded / partially_refunded
- failed refund → refund_failed

Do not allow terminal transitions by scattered controller updates.

### PaymentAttempt entity

Persist before provider call:

- immutable attempt UUID/order_id;
- booking_id;
- provider;
- expected amount/currency;
- state;
- provider transaction ID;
- timestamps;
- retry/reconciliation metadata.

Use row locks and stable idempotency identity.

### Provider lifecycle synchronization

Implement:

- status inquiry;
- cancel;
- expire;
- refund;
- reconciliation worker.

### Financial ledger

Replace recomputed gross payout with immutable ledger entries:

- sale credit;
- platform commission debit;
- refund debit/reversal;
- affiliate commission credit/reversal;
- payout reservation;
- payout settlement.

### Reservation expiry

Schedule an expiry worker and make availability robust against stale pending records.

### Sensitive files

Migrate KTP/legal/selfie to private disk and authorized delivery.

### Anti-automation

Add rate limits to expensive transaction creation and payout requests.

---

## 28. Remediation Priority

### P0 — Immediate, before production payment release

1. SEC-PAY-001 — idempotent/locked payment creation.
2. SEC-PAY-002 — provider-aware cancellation/expiry + late-settlement compensation.
3. SEC-PAY-003 — real verified refund workflow.
4. SEC-PAY-004 — refund-aware partner/affiliate financial ledger.
5. SEC-PAY-005 — automatic reservation expiry + quota release.
6. SEC-PAY-006 — private identity/legal document storage.
7. Fix the stale CI test so the hardened branch can pass the release gate.

### P1 — High Priority

- payout request/generation idempotency;
- callback atomic state/outbox;
- scheduled reconciliation/status inquiry;
- transaction endpoint anti-automation;
- concurrent security regression tests.

### P2 — Medium

- CSP/payment-page script governance;
- CI/runtime parity matrix;
- structured/redacted provider error logging;
- explicit currency/merchant validation where applicable.

### P3 — Hardening

- remove undocumented "success" callback status;
- exact decimal amount parser;
- full repository/history secret scan;
- CodeQL/Semgrep/SAST;
- remove retired payment handlers after safe data/schema retirement.

---

## 29. Tests Performed

### Source/config verification

- route tracing;
- payment entry-point tracing;
- server-side amount calculation tracing;
- ownership tracing;
- callback signature/amount/state tracing;
- cancellation/refund/payout tracing;
- database constraint inspection;
- storage exposure inspection;
- CI/deployment inspection;
- dependency/version inspection.

### Existing automated tests verified from CI

Passed relevant tests include:

- forged/invalid Midtrans signature rejection;
- gross amount mismatch rejection;
- successful settlement;
- non-success callback after paid booking;
- provider expiry behavior;
- sequential duplicate callback side-effect control;
- challenged fraud capture does not mark paid;
- cancelled booking is not reactivated;
- multi-ticket server price calculation;
- voucher calculation;
- free-voucher payment path;
- ticket scan single-use/ownership;
- Wisata visibility/quota behavior;
- auth account-takeover regressions.

### CI

- dependency audits: PASS;
- PHP syntax: PASS;
- frontend build/type: PASS;
- test suite: **FAIL overall due one stale email-verification test**.

---

## 30. Tests Not Performed

**NOT TESTED / NOT VERIFIED:**

- real-money transaction;
- destructive refund/cancel against production;
- concurrent live Midtrans Snap creation;
- concurrent webhook multi-worker runtime test;
- concurrent affiliate payout runtime test;
- staging test of audited commit (CI prevented deployment);
- production environment values;
- Midtrans dashboard configuration;
- Cloudflare/WAF/TLS runtime policy;
- full git-history secret scan with gitleaks/trufflehog;
- full SAST/CodeQL/Semgrep;
- container image CVE scan;
- DAST;
- production log retention/SIEM;
- organizational PCI/ISO policy/process controls;
- external banking/payout process.

---

## 31. Evidence

### Key source evidence

- app/Services/MidtransService.php:44-50 — SHA-512 signature + hash_equals
- app/Services/MidtransService.php:52-60 — HTTPS HTTP client/timeouts
- app/Http/Controllers/MidtransCallbackController.php:30-122 — callback auth/lookup/amount checks
- app/Http/Controllers/MidtransCallbackController.php:136-200 — payment update + terminal guard
- app/Http/Controllers/MidtransCallbackController.php:237-303 — Wisata paid fulfillment/commission
- app/Http/Controllers/Api/WisataBookingController.php:225-308 — non-atomic payment creation
- app/Http/Controllers/Api/WisataBookingController.php:310-345 — local-only cancel
- app/Http/Controllers/Api/WisataBookingController.php:369-447 — trusted server-side ticket pricing
- app/Http/Controllers/Api/WisataBookingController.php:548-575 — pending booking quota count
- app/Http/Controllers/WisataBookingController.php:529-633 — server-side pricing/row lock
- app/Http/Controllers/WisataBookingController.php:721-745 — quota count
- app/Models/WisataBooking.php:97-102 — expiry is a predicate only
- routes/console.php — no payment expiry/reconciliation schedule
- database/migrations/2026_02_01_171000_create_wisata_payments_table.php:10-20 — unique order_id but no active-attempt uniqueness
- app/Http/Controllers/Admin/WisataExceptionController.php:113-131 — internal-only refund
- app/Http/Controllers/Admin/WisataFinanceController.php:127-144 — payout includes paid/completed gross bookings
- app/Http/Controllers/Affiliate/PayoutController.php:54-88 — non-atomic payout request
- app/Services/WisataTicketUsageService.php:94-155 — atomic ticket use
- app/Http/Controllers/Mitra/Wisata/DestinationController.php:78-155 — public KTP/legal upload
- config/filesystems.php:41-47 — public disk
- docker/nginx/default.conf:12-16 — public /storage alias
- bootstrap/app.php:34-36 — CSRF callback exception
- app/Http/Middleware/AddSecurityHeaders.php:15-27 — security headers
- .github/workflows/pipeline.yml:43-52 — dependency/syntax/build/type quality checks
- .github/workflows/pipeline.yml:54-86 — MySQL/Pest tests
- deploy/release-deploy.sh:47-55 — environment/host/APP_DEBUG guards
- .github/actions/deploy-release/action.yml — non-root SSH + StrictHostKeyChecking
- deploy/backup-database.sh — umask 077 backup control

### Official external references

- Midtrans — Receiving Notifications: https://docs.midtrans.com/reference/receiving-notifications
- Midtrans — Handle Notifications: https://docs.midtrans.com/reference/handle-notifications
- Midtrans — Get Transaction Status: https://docs.midtrans.com/reference/get-transaction-status
- Midtrans — Cancel Transaction: https://docs.midtrans.com/reference/cancel-transaction
- Midtrans — Expire Transaction: https://docs.midtrans.com/reference/expire-transaction
- Midtrans — Refund Transactions: https://docs.midtrans.com/reference/refund-transaction
- OWASP ASVS 5.0.0: https://owasp.org/projects/asvs/
- PCI DSS: https://www.pcisecuritystandards.org/standards/pci-dss/
- ISO/IEC 27001:2022: https://www.iso.org/standard/27001

### Audit Coverage

Reviewed:

- repository architecture and dependency manifests;
- active and retired payment-related routes;
- payment service;
- callback;
- booking controllers web/API;
- voucher/quota logic;
- ticket fulfillment/use;
- admin refund/cancel;
- destination finance/payout;
- affiliate commission/payout;
- authentication/authorization middleware;
- storage/filesystem;
- migrations/models;
- session/security headers;
- CI/CD/deployment;
- relevant existing automated tests.

A second repository tree sweep confirmed that there is no app/Console command directory and the only app Jobs are promo compression and push notification; routes/console.php contains database cleanup commands but no payment expiry or reconciliation task.

### Audit Limitations

This assessment does not claim that every runtime/environment control is safe. Production configuration and external systems were not available for direct verification. GitHub connector access supports source inspection but a complete local clone/history scanner/SAST was not executed. Runtime concurrency and real provider lifecycle tests were intentionally not performed because the audit is non-destructive and the audited commit was not deployed to staging due CI failure.

---

## 32. Final Security Verdict

# **HIGH RISK**

The current application **does not meet a release-ready payment-integrity standard** for the active Wisata transaction flow.

This verdict is **not** based on a forged webhook or client amount manipulation. Those controls are comparatively strong.

The HIGH RISK verdict is based on verified source-level weaknesses that can materially affect money, inventory, refunds, payouts, or sensitive identity data:

- non-idempotent payment creation;
- provider/local cancellation divergence;
- internal-only unsafe refund implementation;
- refund-unaware partner/affiliate payouts;
- indefinitely reserved expired booking quota;
- public identity/legal document storage.

### Release recommendation

**Do not treat the current develop commit as payment-production-ready until P0 items are remediated and the full CI suite is green.**

After remediation, rerun:

1. payment creation concurrency tests;
2. cancel-vs-settlement race tests;
3. provider refund/idempotency tests using sandbox;
4. automatic expiry/quota-release tests;
5. duplicate affiliate/destination payout tests;
6. callback concurrent replay tests;
7. full CI;
8. SAST + secret/history scan;
9. staging smoke/security tests.

A subsequent audit should compare the remediated commit against this evidence baseline.
