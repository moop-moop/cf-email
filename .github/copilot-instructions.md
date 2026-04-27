# GitHub Copilot Instructions

This repository contains a TypeScript Cloudflare Email Worker for inbound email fan-out forwarding.

## Project intent

- Keep the worker small, deterministic, and auditable.
- Optimize for reliability and explicit behavior over clever abstractions.
- Preserve original message context through added headers and optional subject tagging.
- Assume destinations must already be verified in Cloudflare Email Routing.

## Technical constraints

- Runtime target is Cloudflare Workers Email Routing, not Node.js.
- Main entrypoint is `src/index.ts`.
- Use TypeScript with strict settings.
- Prefer zero external runtime dependencies.
- Avoid filesystem, local storage, or Node-only APIs.
- Keep environment configuration in `wrangler.toml` variables unless secrets are truly required.

## Code style

- Prefer small pure helper functions.
- Use explicit naming; avoid magic behavior.
- Normalize email addresses to lowercase before comparison.
- Reject invalid or unsafe mail early.
- Log structured JSON only.
- Do not add frameworks, ORMs, or unnecessary packages.

## When modifying forwarding logic

- Keep multi-recipient forwarding intact.
- Preserve `X-Original-Rcpt-To` and `X-Original-Mail-From` headers.
- Do not assume all mail clients display original recipient details the same way.
- Preserve subject prefixing as configurable behavior.
- Avoid any reply-as or outbound-send scope unless explicitly requested.

## Safe enhancements

Copilot may suggest these if asked:

- Regex-based alias allow/deny filtering.
- Per-alias configuration maps.
- Additional loop detection.
- Structured config parsing.
- Optional lightweight spam heuristics.

## Avoid by default

- HTML dashboards.
- Databases.
- KV, D1, R2, or Durable Objects unless explicitly requested.
- External APIs in the mail path.
- Silent failure handling.

## Testing expectations

- Preserve `npm run check` compatibility.
- Prefer changes that can be validated with real routed test messages.
- Keep logs useful for `wrangler tail`.
