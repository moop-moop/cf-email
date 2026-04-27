# cf-email-fanout-ts

TypeScript Cloudflare Email Worker that forwards inbound email for your domain to multiple verified Cloudflare destination addresses.

## What it does

- Accepts inbound mail routed to a Cloudflare Email Worker.
- Fans the message out to multiple verified destination mailboxes.
- Optionally prefixes the subject with the alias used.
- Adds `X-Original-Rcpt-To` and `X-Original-Mail-From` headers for downstream filtering.
- Supports basic allow/deny recipient and sender-domain controls.
- Rejects suspicious mail loops.

## Repo layout

```text
cf-email-fanout-ts/
├─ .github/
│  └─ copilot-instructions.md
├─ src/
│  └─ index.ts
├─ INSTRUCTIONS.md
├─ package.json
├─ README.md
├─ tsconfig.json
└─ wrangler.toml
```

## Requirements

- Cloudflare account with your domain already using Email Routing.
- Three verified Cloudflare destination addresses already configured.
- Node.js 20+ recommended.
- npm.

## Quick start

```bash
npm install
npx wrangler login
npx wrangler deploy
```

## Configure destinations

Edit `wrangler.toml`:

```toml
[vars]
FORWARD_TO = "you1@example.com,you2@example.com,you3@example.com"
ADD_SUBJECT_PREFIX = "true"
SUBJECT_PREFIX_MODE = "alias"
ALLOW_RECIPIENTS = ""
DENY_RECIPIENTS = "abuse@yourdomain.com,postmaster@yourdomain.com"
ALLOWED_SENDER_DOMAINS = ""
DENIED_SENDER_DOMAINS = ""
MAX_MESSAGE_SIZE_BYTES = "20971520"
```

### Variable meanings

- `FORWARD_TO`: comma-separated verified destination inboxes.
- `ADD_SUBJECT_PREFIX`: `true` or `false`.
- `SUBJECT_PREFIX_MODE`: `alias` gives `[shopping]`, `full` gives `[shopping@yourdomain.com]`.
- `ALLOW_RECIPIENTS`: optional comma-separated exact destination aliases to allow.
- `DENY_RECIPIENTS`: optional comma-separated exact aliases to reject.
- `ALLOWED_SENDER_DOMAINS`: optional sender domain allow-list.
- `DENIED_SENDER_DOMAINS`: optional sender domain deny-list.
- `MAX_MESSAGE_SIZE_BYTES`: optional size cap.

## Cloudflare dashboard steps

1. Deploy the worker with `npx wrangler deploy`.
2. Open Cloudflare Dashboard.
3. Select your domain.
4. Go to **Email** or **Email Routing**.
5. Open **Email Workers** or the route creation flow.
6. Create a route.
7. Set the custom address or broader route pattern you want routed into the worker.
8. Choose your deployed worker `cf-email-fanout-ts` as the destination.
9. Save the route.
10. Send test mail to one or more aliases on your domain.

## Suggested first tests

Send messages to:

- `shopping@yourdomain.com`
- `banking@yourdomain.com`
- `random-test-123@yourdomain.com`

Then verify:

- all three destination inboxes received the message,
- the subject prefix is present if enabled,
- `X-Original-Rcpt-To` is visible in headers,
- loop detection is not firing unexpectedly.

## Useful commands

```bash
npm run check
npm run deploy
npm run tail
```

## Notes

- Email Worker behavior is best tested by sending real mail through Cloudflare Email Routing.
- Downstream mail clients vary in how visibly they surface original recipient headers.
- Catch-all style routing is powerful, but also excellent at inviting spam to dinner.
