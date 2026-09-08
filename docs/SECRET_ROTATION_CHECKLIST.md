# Secret rotation checklist

Rotate every item in the **Rotate now** section because the local `.env` contained live-looking credentials. Do not paste replacement values into Git or chat.

## Rotate now

### Supabase project `jbobkdpzqpoevifyvxzn`

- [ ] Supabase service-role key (`SUPABASE_SERVICE_ROLE_KEY`)
- [ ] Supabase publishable/anon key (`SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `VITE_SUPABASE_ANON_KEY`)
- [ ] Update the replacement values in the local `.env`
- [ ] Update the same values in every deployment/CI secret store
- [ ] Restart/redeploy all services after updating them

### AI providers

- [ ] Anthropic API key (`ANTHROPIC_API_KEY`)
- [ ] OpenAI API key (`OPENAI_API_KEY`)
- [ ] OpenRouter API key (`OPENROUTER_API_KEY`)
- [ ] Continue API key (`CONTINUE_API_KEY`)
- [ ] Remove any unused provider keys rather than replacing them

### Stripe test account

- [ ] Stripe secret key (`STRIPE_SECRET_KEY`)
- [ ] Stripe publishable key (`STRIPE_PUBLISHABLE_KEY`) if the account/key pair is being replaced
- [ ] Stripe webhook signing secret (`STRIPE_WEBHOOK_SECRET`)
- [ ] Recreate webhook endpoint signing secrets in every environment
- [ ] Confirm test-mode keys are not being used in production

## Replace if the environment or domain changed

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_JWKS_URL`
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `WEB_APP_URL`
- [ ] `API_URL`
- [ ] `NEXT_PUBLIC_API_URL`
- [ ] `VITE_API_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_COOKIE_DOMAIN`
- [ ] `VITE_SUPABASE_COOKIE_DOMAIN`

## Not secrets; do not rotate

- Stripe price IDs: `STRIPE_PRICE_STARTER_MONTHLY`, `STRIPE_PRICE_STARTER_ANNUAL`, `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_ANNUAL`, `STRIPE_PRICE_BUSINESS_MONTHLY`, `STRIPE_PRICE_BUSINESS_ANNUAL`
- `APP_ENV`
- `APP_NAME`

## After rotation

- [ ] Run a billing test checkout and webhook delivery test in Stripe test mode
- [ ] Test sign-in, callback, dashboard access, and server-side Supabase operations
- [ ] Check provider usage dashboards for unexpected activity
- [ ] Delete the old local `.env` and recreate it from `.env.example` if any old values remain
- [ ] Keep `.env` ignored; never commit it

