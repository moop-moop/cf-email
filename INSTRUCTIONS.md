# Maintainer Instructions

## Purpose

This repository implements a Cloudflare Email Worker that forwards inbound messages for a domain alias space to multiple verified destination inboxes.

## Default behavior

- Any routed inbound email enters `src/index.ts`.
- The worker evaluates recipient and sender restrictions.
- The worker rejects obvious forwarding loops.
- The worker optionally prefixes the subject.
- The worker forwards the message to all configured recipients.
- If every forward attempt fails, the message is rejected.

## Operational guidance

- Keep forwarding destinations in `wrangler.toml` under `FORWARD_TO`.
- Use `ALLOW_RECIPIENTS` for exact-address whitelisting when testing.
- Use `DENY_RECIPIENTS` to block known bad aliases such as `abuse@` or `postmaster@`.
- Prefer additive headers and subject tagging over body mutation.
- Test every routing change with live messages.

## Deployment

```bash
npm install
npx wrangler login
npm run check
npm run deploy
npm run tail
```

## Cloudflare setup sequence

1. Deploy the worker.
2. Open the domain in Cloudflare.
3. Open Email Routing.
4. Create or edit the route that should feed this worker.
5. Select the deployed worker as the route destination.
6. Save.
7. Send test messages.
8. Inspect logs with `npm run tail`.

## Change policy

Prefer small, reviewable changes.

Good changes:
- alias filtering,
- better logging,
- additional validation,
- configuration cleanup.

Changes requiring deliberate review:
- outbound sending,
- persistence layers,
- third-party dependencies,
- content rewriting,
- spam scoring beyond lightweight heuristics.
