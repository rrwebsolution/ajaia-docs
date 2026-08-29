# Ajaia Docs

A fast, minimal collaborative document workspace — create rich-text documents, share them with editor or viewer permissions, and pick up exactly where you left off. Built as a scoped technical assignment demonstrating a complete, production-quality core product loop: **create → edit → persist → reopen → share**.

## Live Demo

`[DEPLOYED_VERCEL_URL_HERE]`

## Demo Accounts

Both accounts use the same password: `demo1234`

| Role         | Email                          |
| ------------ | ------------------------------- |
| Owner        | `owner@ajaia-demo.com`          |
| Collaborator | `collaborator@ajaia-demo.com`   |

The seed script (see [Local Setup](#local-setup)) creates both accounts and shares one document between them so the sharing workflow can be demonstrated immediately.

## Features

- **Authentication** — email/password sign-in via Supabase Auth, with a clear invalid-credentials error state and loading state.
- **Document dashboard** — "My Documents" / "Shared With Me" tabs, live title search, skeleton loading state, empty states, and an error boundary.
- **Rich-text editor** — TipTap-powered editor (undo/redo, bold, italic, underline, H1/H2, paragraph, bulleted/numbered lists) rendered as a centered document sheet.
- **Autosave** — title and content changes are debounced (~900ms) and persisted automatically, with **Saving… / Saved / Failed to save** status in the header.
- **Sharing** — owners share documents by email with **editor** or **viewer** permission, with full inline validation (user not found, already shared, self-share) and the ability to revoke access.
- **Server-enforced authorization** — access is checked on every read/write against `documents.owner_id` and `document_shares`, backed by Postgres Row Level Security. A polished "Access denied" state is shown for anything a user can't see.
- **File import** — drag-and-drop `.txt` / `.md` import (2MB max) that converts headings/lists/emphasis into the same TipTap document structure as the editor, using the filename as the document title.
- **Responsive, no-horizontal-scroll layout** — verified on desktop, tablet, and mobile.

## Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js (App Router) + React + TypeScript |
| Styling / UI | Tailwind CSS, shadcn/ui, Lucide icons |
| Editor | TipTap (content stored as JSONB) |
| Data & Auth | Supabase (Postgres + Auth, accessed via `@supabase/ssr`) |
| Testing | Vitest |
| Deployment | Vercel |

## Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env.local
# then fill in your Supabase project's URL / anon key / service role key

# 3. Set up the database
# Open your Supabase project's SQL editor and run the contents of:
#   supabase/migrations/0001_init.sql

# 4. Seed the two demo accounts + a sample shared document
npm run seed

# 5. Start the dev server
npm run dev
```

The app runs at `http://localhost:3000`.

## Environment Variables

See [`.env.example`](.env.example).

| Variable | Where it's used | Exposed to browser? |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key (RLS-governed) | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | `scripts/seed.ts` only, to create demo users via the Admin API | **No — server-only** |

## Running Tests

```bash
npm run test
```

The priority test (`tests/permissions.test.ts`) verifies the exact scenario required by the assignment: an owner creates a document, a collaborator initially has no access, the owner shares it, and the collaborator gains access — plus a companion case confirming unauthorized access is rejected. `tests/validators.test.ts` covers file-import and email validation.

## Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full write-up (database design, authorization model, sharing model, import flow, autosave strategy, deployment, and tradeoffs).

## Intentional Scope Cuts

The following were deliberately left out of this build to keep the 4–6 hour core loop reliable and polished rather than spreading effort thin:

- **Real-time multiplayer editing / collaborative cursors** — would require a CRDT or OT layer (e.g. Yjs) and a presence channel; the assignment's core loop is create → edit → persist → reopen → share, which doesn't need concurrent co-editing to be demonstrated.
- **Comments** — a meaningfully useful comments feature needs anchoring to text ranges, threading, and notifications — a separate feature surface from document editing itself.
- **Version history** — needs a snapshot/diff storage strategy and its own UI; not required to prove the core loop works.
- **DOCX import** — explicitly deferred by the assignment brief in favor of finishing `.txt`/`.md` import correctly first.
- **Advanced workspace/organization management** — this app is single-tenant-per-user by design; teams/orgs are a distinct data-modeling problem.

## What I Would Build Next

Given another 2–4 hours, in priority order:

1. **Viewer-mode polish** — a persistent "Viewing" banner and read-only toolbar affordances beyond hiding the toolbar.
2. **Optimistic UI for sharing/deleting** — currently these await the network response before updating the list; optimistic updates with rollback would feel snappier.
3. **Rename from the dashboard context menu** (currently renaming only happens inside the editor).
4. **E2E coverage with Playwright** against a seeded Supabase test project, covering the full owner→collaborator flow through the actual UI rather than just the permission logic.
5. **Basic full-text search** across document content, not just titles.
