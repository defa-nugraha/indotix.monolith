# Payment Security Remediation Status

**Repository:** defa-nugraha/indotix.monolith  
**Branch:** develop  
**Baseline audit:** docs/security/PAYMENT_SECURITY_AUDIT.md  
**Baseline audited commit:** 3abd50e403198af0d93630b34a13fb21d90d687e  
**Current remediation head:** 679224f464312fc45f88dc137c0a58b65809c197  
**Status date:** 2026-09-19

> This document tracks source-level remediation against the historical payment audit. It does not replace runtime, sandbox, staging, CI, PCI DSS, ISO/IEC 27001, or penetration-test verification.

## Executive status

The original HIGH RISK audit identified six immediate P0 weaknesses in the active Wisata payment flow. Source inspection of the current develop branch shows that those original P0 design gaps have been materially remediated:

- payment creation now uses database locking plus a unique active payment key;
- cancel/expire now synchronizes with Midtrans before finalizing local terminal state;
- late settlement on cancelled/expired bookings queues compensating refund handling;
- refund processing now uses Midtrans provider APIs and refund idempotency keys;
- refund confirmation is bound to the exact refund key and exact IDR amount parsing;
- partner payout calculation and affiliate commission handling account for processed refunds;
- overdue reservations are excluded from quota and scheduled expiry/reconciliation is present;
- sensitive Mitra Wisata identity/legal documents are stored on private storage with a migration path;
- transaction endpoints have explicit throttling;
- payout generation/request paths use locking/idempotency controls;
- paid-payment side effects now use a durable database outbox with per-effect claims and scheduled retry;
- callbacks validate signed amount, optional configured merchant identity, and currency when provided.

The historical audit should therefore be treated as a baseline finding report, not as a statement of the current develop branch.

## Remediation matrix

| Audit ID | Original severity | Current source status | Current control |
|---|---:|---|---|
| SEC-PAY-001 | HIGH | REMEDIATED IN SOURCE | booking row lock, persisted payment attempt before provider request, unique active_key |
| SEC-PAY-002 | HIGH | REMEDIATED IN SOURCE | Midtrans status inquiry + cancel/expire + late-settlement compensation |
| SEC-PAY-003 | HIGH | REMEDIATED IN SOURCE | provider-aware full refund workflow, refund key, paid-state and amount validation |
| SEC-PAY-004 | HIGH | REMEDIATED IN SOURCE | refund-aware finance calculation, payout adjustment/clawback, affiliate reversal |
| SEC-PAY-005 | HIGH | REMEDIATED IN SOURCE | deadline-aware quota, scheduled expiry worker |
| SEC-PAY-006 | HIGH | REMEDIATED IN SOURCE | private local disk + authorized document delivery + legacy migration command |
| SEC-PAY-007 | MEDIUM | REMEDIATED IN SOURCE | affiliate/destination payout locking and idempotency keys |
| SEC-PAY-008 | MEDIUM | MATERIAL IMPROVEMENT | durable paid-payment side-effect outbox, per-effect DB claim, stale-claim retry |
| SEC-PAY-009 | MEDIUM | REMEDIATED IN SOURCE | scheduled Midtrans reconciliation and status inquiry |
| SEC-PAY-010 | MEDIUM | REMEDIATED IN SOURCE | explicit throttles on booking/payment/refund transaction routes |
| SEC-PAY-011 | MEDIUM | REMEDIATED/PARTIAL | payment CSP added; runtime header verification still required |
| SEC-PAY-012 | MEDIUM | REMEDIATED/PARTIAL | CI now uses PHP 8.2 + MariaDB 11.4; production runtime still requires verification |
| SEC-PAY-013 | LOW | REMEDIATED IN ACTIVE WISATA FLOW | success restricted to settlement or accepted capture |
| SEC-PAY-014 | LOW | REMEDIATED IN SOURCE | strict decimal callback amount parser and strict refund IDR parser |

## Latest remediation in this continuation

### Durable paid-payment side effects

A new `wisata_payment_side_effects` table provides a unique outbox record per:

- payment;
- effect type: `in_app`, `push`, or `email`.

Controls:

- unique database constraint on `wisata_payment_id + effect_type`;
- row-level locking for effect claims;
- short-lived processing claim;
- stale-claim recovery;
- per-effect attempt counter;
- failure state and redacted error storage;
- scheduled retry command;
- overall `notification_dispatched_at` is only set after all required effects complete.

This prevents callback/reconciliation races from independently creating the same logical side effect.

### Refund identity hardening

Refund confirmation no longer trusts the first item in the provider refund history. It now:

- matches the exact application-generated `refund_key`;
- requires bank confirmation for that same refund item;
- parses IDR amounts without floating-point rounding;
- rejects fractional/non-canonical values;
- binds direct refund responses to the exact key submitted by Indotix when the provider omits that key in the immediate response.

### Callback identity hardening

When present:

- callback `currency` must match `MIDTRANS_CURRENCY` (default `IDR`);
- callback `merchant_id` must match `MIDTRANS_MERCHANT_ID` when configured.

These checks occur after signature validation and before booking lookup.

## Automated regression coverage added

Coverage now includes:

- one payment attempt for repeated creation;
- unique active payment key;
- provider-synchronized cancellation;
- paid transaction cancellation rejection;
- expiry and quota release;
- provider-confirmed refund;
- refund amount bounds;
- provider refund failure handling;
- refund-key matching;
- fractional refund amount rejection;
- missing-webhook reconciliation;
- refund payout clawback;
- signed webhook replay;
- late settlement compensation;
- durable outbox uniqueness;
- active claim duplicate suppression;
- stale side-effect claim recovery;
- callback currency mismatch rejection;
- callback merchant mismatch rejection.

## Remaining verification before payment-production sign-off

The following are still required before replacing the historical HIGH RISK verdict with a release-readiness conclusion:

1. Full CI must pass on the current remediation head.
2. Database migration must be executed successfully on staging.
3. Scheduler/queue worker operation must be verified on staging.
4. Midtrans sandbox tests should cover:
   - Snap creation;
   - cancel;
   - expire;
   - settlement callback;
   - delayed callback;
   - refund;
   - refund reconciliation.
5. Concurrency testing should be run against MySQL/MariaDB with separate processes/workers, not only sequential regression tests.
6. Staging should verify no duplicate in-app notification, push, or ticket email during callback/reconciliation overlap.
7. Production values for `MIDTRANS_MERCHANT_ID` and `MIDTRANS_CURRENCY=IDR` should be confirmed before production deployment.
8. SAST, repository/history secret scanning, and DAST remain recommended release controls.

## Branch note

At the time of this update, `develop` and `main` are diverged. The payment remediation should not be promoted by blindly overwriting either branch. Reconcile the branches through a reviewed merge/rebase strategy and rerun the complete release pipeline afterward.
