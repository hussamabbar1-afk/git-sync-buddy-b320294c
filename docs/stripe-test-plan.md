# Stripe test plan

ZunftEcho is intentionally restricted to Stripe test mode until the business and tax setup is
complete. The checkout function rejects every secret that does not start with `sk_test_`.

## Required test configuration

1. Set `STRIPE_SECRET_KEY` to a restricted Stripe test secret.
2. Set `STRIPE_WEBHOOK_SECRET` to the signing secret of the test webhook endpoint.
3. Configure the endpoint as `/functions/v1/stripe-webhook` and subscribe to:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.created`
   - `invoice.finalized`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `invoice.voided`
4. Enable Card, SEPA Direct Debit and PayPal in Stripe test mode where the test account is eligible.
   Klarna is deliberately excluded because this product is sold B2B.

## Checkout scenarios

| Scenario        | Test data/action                                    | Expected result                                                  |
| --------------- | --------------------------------------------------- | ---------------------------------------------------------------- |
| Successful card | `4242 4242 4242 4242`, any future expiry/CVC        | Checkout success; subscription or pilot becomes active           |
| 3-D Secure      | `4000 0025 0000 3155`                               | Authentication step appears; successful completion updates state |
| Declined card   | `4000 0000 0000 9995`                               | Checkout stays unpaid; no active entitlement                     |
| Successful SEPA | IBAN `AT321904300235473204`                         | Async success event activates or confirms payment                |
| Failed SEPA     | IBAN `AT861904300235473202`                         | Async failure/payment-failed state is stored                     |
| PayPal success  | Choose PayPal and approve in Stripe's test redirect | Checkout and webhook complete once                               |
| PayPal cancel   | Cancel in the test redirect                         | Return to cancelled state; no charge                             |

Use only Stripe-published test values. Never enter real card or bank data in test mode.

## Webhook and lifecycle scenarios

- Send each event twice; the second delivery must return `duplicate: true` and make no second write.
- Alter one byte in a signed payload; the endpoint must return HTTP 400.
- Replay a valid signature after more than five minutes; the endpoint must return HTTP 400.
- Complete a pilot payment; store a 30-day `pilot` entitlement and its Stripe invoice.
- Start a monthly subscription; store its period, amount, cancellation flag and invoice URLs.
- Trigger `invoice.payment_failed`; keep the invoice and reflect the failed Stripe status.
- Cancel at period end; keep access metadata until the recorded period end.
- Delete/cancel the subscription; normalize Stripe `canceled` to database `cancelled`.

## Database assertions

- `billing_accounts`, `company_subscriptions`, and `subscription_invoices` are readable only inside
  the authenticated user's company through RLS.
- Browser clients cannot insert or update billing rows.
- Raw webhook events are stored only in the private schema.
- Live-mode events must not be accepted during the pre-launch test phase.

## Before live activation

- Complete Gewerbe and tax setup and replace draft legal texts after professional review.
- Create final Stripe Products/Prices instead of inline test price data.
- Confirm VAT/tax treatment and invoice numbering with the accounting system.
- Rotate to restricted live keys, configure a separate live webhook, and run a low-value live smoke
  test before enabling public checkout.
