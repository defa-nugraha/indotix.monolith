# iPaymu Deployment and Rollback Runbook

## Pre-deployment

1. Keep `PAYMENT_GATEWAY=midtrans` while deploying the expand migration and code.
2. Back up the database and verify there are no duplicate non-null
   `(provider, transaction_id)` pairs in `wisata_payments`.
3. Configure sandbox secrets through runtime secret injection. Do not put values
   in source control, build arguments, Flutter, JavaScript, or deployment logs.
4. Run migrations, queue workers, and the existing scheduler. Confirm the
   Midtrans callback remains reachable.
5. Configure iPaymu callback content type as JSON or form-urlencoded; both are
   accepted. Set callback to `/payments/ipaymu/callback` and use the generated
   signed return URL supplied per payment.

## Sandbox gate

1. Set `IPAYMU_ENVIRONMENT=sandbox` and `PAYMENT_GATEWAY=ipaymu` only in staging.
2. Complete a real low-value sandbox payment from web and mobile.
3. Verify one payment row, one processed webhook event, one transition to paid,
   and one completed row per paid side effect.
4. Replay the callback and verify no duplicate ticket, notification, email,
   voucher use, affiliate commission, or inventory mutation.
5. Test timeout, failed payment, expired payment, unknown reference, amount
   mismatch, and a historical pending Midtrans callback.

## Production cutover

1. Register the production static origin IP and production domains with iPaymu.
2. Inject production VA/API key and set `IPAYMU_ENVIRONMENT=production` and
   `IPAYMU_ALLOW_PRODUCTION=true` only in the production runtime.
3. Clear/rebuild Laravel config cache, then verify environment and callback URL.
4. Switch `PAYMENT_GATEWAY=ipaymu` for new transactions. Do not alter provider on
   existing rows.
5. Monitor callback rejection, unknown/retryable events, amount mismatch, late
   successful payment, provider latency, and side-effect backlog.

## Rollback

1. Set `PAYMENT_GATEWAY=midtrans` and rebuild config cache. This changes only new
   payment creation.
2. Keep both callbacks, both credentials, reconciliation, and queue workers live.
3. Existing `provider=ipaymu` payments continue through iPaymu inquiry/callback;
   existing `provider=midtrans` payments continue through Midtrans.
4. Do not roll back the expand migration during incident response.

## Midtrans removal gate

Remove Midtrans only after the maximum payment/refund/callback retention period,
zero non-terminal Midtrans payments and refunds, successful reconciliation, no
rollback requirement, exported audit evidence, and an approved separate contract
migration. This implementation intentionally does not remove Midtrans.
