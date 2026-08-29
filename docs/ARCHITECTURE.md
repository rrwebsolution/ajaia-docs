# Architecture

## Overview

Ajaia Docs is a single Next.js (App Router) application that talks directly to Supabase — there is no separate backend service. Server Components and Route Handlers use a cookie-scoped Supabase client (`@supabase/ssr`) so every read and write runs as the authenticated user and is subject to Postgres Row Level Security (RLS). The browser never receives more access than RLS grants, regardless of what the UI shows or hides.

The core product loop this build was built around, in priority order, is:

```
Create → Edit → Persist → Reopen → Share
```

Everything else (search, import, viewer permissions) was layered on only after that loop was solid, per the assignment's stated priority order.

## Frontend Architecture

- **App Router, mostly Server Components.** The dashboard (`/documents`) and editor (`/documents/[id]`) pages are server components that fetch data directly via the Supabase server client and pass it down as props. This avoids a client-side loading waterfall for the initial view and lets Next.js's `loading.tsx` file convention provide real Suspense-driven skeleton states for free.
- **Client components own interaction, not data-fetching.** `DocumentsDashboard`, `DocumentEditor`, `ShareDialog`, and `ImportDialog` are client components because they need state (search text, editor content, dialog open/closed) and browser APIs (drag/drop, `FileReader`). They receive their initial data as props from the server component parent and talk to Route Handlers for mutations.
- **shadcn/ui primitives** (`components/ui/*`) are the only UI layer with no business logic — everything else composes them.
- **`lib/permissions.ts` is the single source of truth for "who can see/edit this document"** on the client side. Its `resolveAccess()` function mirrors the RLS policies exactly (see below) so the UI's rendering decisions (show Share button, make editor read-only, etc.) agree with what the database actually allows.

## Database Design

Three tables, all under Supabase Postgres (see `supabase/migrations/0001_init.sql` for the full DDL):

```
profiles          — id (= auth.users.id), name, email, created_at
documents         — id, owner_id → profiles, title, content (jsonb), created_at, updated_at
document_shares   — id, document_id → documents, user_id → profiles, permission ('editor'|'viewer'), created_at
                     unique (document_id, user_id)
```

`profiles` exists (rather than querying `auth.users` directly) so the app can look up "who does this email belong to" and display names under RLS, without exposing the `auth` schema. A Postgres trigger (`handle_new_user`) inserts a profile row automatically whenever a new `auth.users` row is created, using `raw_user_meta_data->>'name'` if present or the email's local part as a fallback.

## Rich-Text Storage Decision

TipTap's document model is already JSON (a `ProseMirror` document tree), so `documents.content` is stored as `jsonb` rather than serialized HTML or Markdown. This was chosen over the alternatives because:

- **No lossy round-trip.** HTML-string storage requires re-parsing on load and can silently drop or reorder marks; storing the JSON tree TipTap already produces means `setContent()` on load is a direct, lossless assignment.
- **Queryable if needed later.** `jsonb` supports indexing and partial queries, which a plain HTML string would not.
- **Matches the assignment's explicit recommendation** to store TipTap content as JSON/JSONB.

## Authentication

Supabase Auth (email/password only, per the assignment's scope). `@supabase/ssr`'s cookie-based session storage is used end-to-end:

- `lib/supabase/client.ts` — browser client, used by the login page and any client component that needs to call `auth.signInWithPassword` / `auth.signOut`.
- `lib/supabase/server.ts` — server client for Server Components and Route Handlers, reading/writing the session via Next.js's `cookies()`.
- `proxy.ts` (Next.js 16 renamed `middleware.ts` to `proxy.ts`) — refreshes the session on every request and redirects unauthenticated users to `/login`, and authenticated users away from `/login`/`/` to `/documents`.

Registration, password reset, and email verification were intentionally not built — the assignment explicitly scopes auth down to a login flow against two pre-seeded demo accounts (`scripts/seed.ts`), created via the Supabase Admin API with `email_confirm: true` so there's no confirmation-email step to work around during review.

## Authorization

Authorization is enforced **at the database layer**, not just in the UI. Every table has RLS enabled with policies that check, per-row:

- `documents`: visible/updatable if `owner_id = auth.uid()` **or** the current user has a row in `document_shares` for that document (update additionally requires `permission = 'editor'`). Only the owner can insert or delete.
- `document_shares`: visible to the share's recipient or the document's owner. Only the document's owner can insert, update, or delete a share row.

**Why the policies call helper functions instead of querying the other table directly.** The first version of these policies had `documents`' policy check `document_shares` via a direct `EXISTS (...)` subquery, and `document_shares`' policy check `documents` the same way (to find the owner). Postgres detected the circular dependency between the two RLS-protected tables and refused to evaluate either — every query against `documents` failed with `infinite recursion detected in policy`, silently, since the error wasn't obviously connected to "the dashboard shows no documents." The fix (`supabase/migrations/0001_init.sql`) is two `SECURITY DEFINER` SQL functions, `is_document_owner(document_id)` and `document_share_permission(document_id)`, that run with the privileges of the role that owns the tables — which is exempt from RLS on them. A policy calling one of these functions gets a direct, non-recursive lookup instead of re-triggering the other table's policy. This is Supabase's documented fix for exactly this class of bug, and it's why the policies read as function calls rather than inline subqueries.

Route Handlers (`app/api/documents/**`) run these operations through the same cookie-scoped client a browser request would use — so even if a request is crafted directly against the API (bypassing the UI entirely), RLS still applies. A Route Handler never uses the service-role key. The one place the service-role key is used at all is `scripts/seed.ts`, a one-off local script for creating the two demo auth users — never imported by any code path that runs as part of a request.

When a `PATCH`/`DELETE` matches zero rows because RLS silently filtered it out, the Route Handler returns `403` with "You don't have access to this document," rather than a generic 500 — the client can't tell the difference between "doesn't exist" and "exists but you can't see it," which is deliberate (see below).

`lib/permissions.ts` re-implements the same access decision in plain TypeScript so client components can decide what to render (hide the Share button, make the editor read-only) without an extra round-trip — but it is a UX convenience, not the security boundary. The security boundary is RLS.

## Sharing Model

A share is a row in `document_shares` keyed by `(document_id, user_id)` with a `permission` of `editor` or `viewer`. Sharing by email (rather than by user ID) requires a lookup step: `POST /api/documents/[id]/share` looks up `profiles` by email, and returns one of four outcomes the assignment specifies exactly — no profile found, already shared, owner sharing with themselves, or success — before inserting the row. Only the document owner can reach this endpoint (checked before the email lookup runs, not just hidden in the UI).

## File Import Flow

Import is deliberately client-driven and reuses the same "create document" Route Handler rather than adding a separate one:

1. The `ImportDialog` component validates the file's extension (`.txt`/`.md` only) and size (≤2MB) — `lib/validators.ts`.
2. The file's text is read in the browser (`file.text()`) and converted to a TipTap JSON document by `lib/markdown.ts` — a small, dependency-free converter (headings, bullet/numbered lists, bold/italic, paragraphs) rather than a full CommonMark implementation, since the goal is preserving structure for a notes-style import, not round-tripping arbitrary Markdown. `.txt` files skip Markdown parsing entirely and become blank-line-separated paragraphs.
3. The resulting `{ title, content }` is POSTed to `POST /api/documents` — the same endpoint "New Document" uses, just with a non-empty payload — which creates the row with the current user as owner and redirects to the editor.

## Autosave Strategy

`hooks/use-autosave.ts` debounces title and content changes together (~900ms, matching the assignment's stated range) rather than firing a request per keystroke. On every change it sets status to `saving`, waits out the debounce window, then sends both fields in one `PATCH /api/documents/[id]` call. Status becomes `saved` on success or `error` on failure (with a toast, since silent autosave failures are worse than a per-keystroke request would be). The first render is explicitly skipped (via a ref) so loading a document doesn't immediately show "Saving..." for content that hasn't changed.

## Deployment Strategy

Designed for Vercel: no custom server, no filesystem writes, and the only secret (`SUPABASE_SERVICE_ROLE_KEY`) is never read outside `scripts/seed.ts`, which doesn't run as part of the deployed app. Environment variables are documented in `.env.example`; the database schema is a single idempotent migration file (`supabase/migrations/0001_init.sql`) intended to be run once via the Supabase SQL editor or `supabase db push` before first deploy.

## Important Tradeoffs

- **No real-time multiplayer editing.** This is the single biggest scope cut, and it's intentional: real-time co-editing needs a CRDT/OT layer (e.g. Yjs) plus a presence/broadcast channel, which is a different engineering problem from "does the core document loop work end-to-end." Given a 4–6 hour scope, building that layer would have meant a shakier create/edit/persist/share loop in exchange for a feature the assignment doesn't require. Autosave plus reopening the document already demonstrates persistence works correctly; adding concurrent editing would be the natural next milestone, not a foundational one.
- **Unified "access denied" messaging for both "not found" and "unauthorized."** The editor page shows the same message whether a document ID doesn't exist or exists but isn't shared with you — deliberately, so an unauthorized user can't distinguish "this document doesn't exist" from "this document exists but isn't yours," which would otherwise leak information about what IDs are valid.
- **Two-query dashboard fetch instead of one.** `lib/documents.ts` runs separate queries for owned vs. shared documents (in parallel) rather than one combined query, trading a slightly larger request count for code that's easy to reason about — each query maps directly to one of the two dashboard tabs.
