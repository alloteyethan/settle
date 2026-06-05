# SETTLE

A peer-to-peer escrow platform for informal commerce in West Africa. Sellers generate secure payment links, buyers pay via MoMo/card, and funds are only released after delivery confirmation.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/settle run dev` — run the frontend (port 18674)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, Wouter routing, TanStack Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — DB schema (sellers, deals, disputes, activity)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/settle/src/` — React frontend
- Generated hooks: `lib/api-client-react/src/generated/`
- Generated Zod schemas: `lib/api-zod/src/generated/`

## Architecture decisions

- **Simple token auth**: tokens are `seller-{id}-{timestamp}`, verified by DB lookup. Good enough for MVP; replace with JWT for production.
- **2% platform fee**: taken from seller payout automatically on deal creation.
- **48-hour escrow window**: default delivery window; auto-settles if no dispute raised.
- **5-state machine**: created → locked → dispatched → delivered → settled (+ disputed as a frozen state).
- **Public buyer portal** (`/pay/:code`, `/confirm/:code`): zero-login pages accessed from WhatsApp links.

## Product

- **Seller dashboard**: create deals, track transaction status, view earnings and activity feed
- **Deal generator**: one-tap creation with auto-generated WhatsApp copy-paste message
- **Buyer portal**: clean receipt-style checkout, no app required
- **Dispute system**: 3-category dispute flow with evidence upload + seller counter-proof
- **Admin panel**: manual dispute resolution for escalated cases

## Demo credentials

- Email: `kwame@example.com` / Password: `password123`
- Email: `abena@example.com` / Password: `password123`

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After each OpenAPI spec change, re-run `pnpm --filter @workspace/api-spec run codegen`
- The `@workspace/api-client-react/src/custom-fetch` deep import path is exported explicitly in `package.json`
- Token format must match regex `/^seller-(\d+)-/` in auth middleware

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
