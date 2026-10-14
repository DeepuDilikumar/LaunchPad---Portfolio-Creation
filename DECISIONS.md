# Decisions

The plan says to confirm every decision before Phase 2. The build went ahead with the plan's
recommendations (which also match the approved mockups) so nothing is blocked. Each one is a
single value in `config/site.ts` and can be changed without code changes. **Confirm or change
each row**, then run `pnpm preflight`, which fails while any `PENDING:` value remains.

| Decision                   | Assumed for the build                                                  | Where it lives                                     | Status                                                                             |
| -------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Brand name and domain      | `secondquestion`, `secondquestion.in` (working name from the mockups)  | `site.name`, `site.domain`, `NEXT_PUBLIC_SITE_URL` | **Confirm** (check domain + Instagram handle)                                      |
| Named author or brand only | Named: Deepu                                                           | `site.author.named`, `site.author.*`               | **Confirm after the employment-clause check**; set `named: false` to go brand-only |
| First guide                | Backend                                                                | `products[0]`, `content/guides/backend`            | Assumed                                                                            |
| Checkout                   | Razorpay                                                               | `lib/razorpay.ts`                                  | Assumed                                                                            |
| Launch price               | ₹349 for 7 days (8–15 Nov 2026, end date shown), then ₹499             | `site.launch`, `products[].launchPrice`            | **Confirm dates**                                                                  |
| Refund policy              | 7-day "didn't help" refund on first purchase, delivery problems always | `site.refund`, `/refund`                           | Assumed                                                                            |
| 1:1 mock interviews        | Not in v1                                                              | —                                                  | Assumed                                                                            |
| Ad test budget             | Not in code; type spend in with `pnpm ad-spend add`                    | `ad_spend` table                                   | Your call (₹10,000–14,000 recommended)                                             |
| Follow-up channel          | Email (Resend)                                                         | `lib/sequence.ts`                                  | Assumed                                                                            |
| Phone edition              | Yes                                                                    | `pdf/html.ts` editions                             | Assumed                                                                            |

Business details still needed (all `PENDING:` in `config/site.ts`): registered business name,
address, grievance officer, LinkedIn URL, Instagram URL. Also talk to a CA about GST before
launch (`site.business.gstin`).
