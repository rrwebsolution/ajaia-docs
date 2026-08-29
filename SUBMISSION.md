# Submission — Ajaia Docs

| | |
| --- | --- |
| **Candidate** | `Ryan Jay Reyes` |
| **Project** | Ajaia Docs |
| **Live Application** | `https://ajaia-docs-theta-nine.vercel.app/login` |
| **GitHub Repository** | `https://github.com/rrwebsolution/ajaia-docs.git` |
| **Google Drive Folder** | `https://drive.google.com/drive/folders/1MuDFzbnUNHpnjfDInAT15mZrpkv_imOi?usp=sharing` |
| **Walkthrough Video** | see [`walkthrough-url.txt`](walkthrough-url.txt) |

## Demo Credentials

Password for both accounts: `demo1234`

- **Owner** — `owner@ajaia-demo.com`
- **Collaborator** — `collaborator@ajaia-demo.com`

The seed script (`npm run seed`) creates both accounts and shares one sample document from Owner to Collaborator, so the sharing workflow is visible immediately after setup — no manual setup steps required to see it working.

## Implemented Functionality

- [x] Email/password login via Supabase Auth, with invalid-credentials and loading states
- [x] Document dashboard — My Documents / Shared With Me tabs, search, skeleton/empty/error states
- [x] Create document → redirects into the editor
- [x] Rich-text editing (TipTap): undo/redo, bold, italic, underline, H1/H2, paragraph, bulleted/numbered lists
- [x] Content persisted as JSONB; formatting survives refresh
- [x] Debounced autosave (~900ms) with Saving/Saved/Failed indicator
- [x] Sharing dialog with editor/viewer permission, full validation (user not found / already shared / self-share / success), and revoke access
- [x] Server-enforced authorization via Postgres RLS (not just hidden UI) + polished access-denied state
- [x] Shared documents appear under "Shared With Me" with owner, permission, and last-updated
- [x] Viewer permission renders the editor read-only
- [x] File import (.txt / .md, 2MB max) with filename → title conversion and inline error states
- [x] Title search on the dashboard
- [x] Profile dropdown with avatar initials and logout
- [x] Toast notifications throughout (no `alert()` anywhere)
- [x] Fully responsive layout, verified with no horizontal scroll on desktop/tablet/mobile

## Automated Tests

```bash
npm run test
```

- `tests/permissions.test.ts` — the assignment's priority scenario: owner creates a document, collaborator has no access, owner shares it, collaborator gains access (plus a companion "rejects unauthorized access" case and a viewer-permission case).
- `tests/validators.test.ts` — file-import validation (extension, 2MB limit) and email validation.

All 12 tests pass. `npm run build`, `npx tsc --noEmit`, and `npx eslint .` all complete with zero errors.

## Known Limitations

- No real-time multiplayer editing, collaborative cursors, comments, or version history — intentionally out of scope (see `docs/ARCHITECTURE.md` → *Intentional Scope Cuts*).
- DOCX import is not supported — only `.txt` and `.md`, per the assignment's explicit priority.
- The Markdown importer supports headings, paragraphs, bullet/numbered lists, and bold/italic — not full CommonMark (tables, footnotes, nested blockquotes are out of scope).
- No email invitation flow for sharing — sharing requires the recipient to already have an account (matches the assignment's two-demo-account scope).

## What I Would Build With Another 2–4 Hours

1. Playwright end-to-end coverage of the full owner → collaborator flow through the actual UI, against a seeded test Supabase project.
2. Optimistic UI updates for sharing and deleting documents.
3. A persistent "Viewing" banner in read-only (viewer) mode, beyond just disabling the toolbar.
4. Rename-from-dashboard via the card's context menu (currently only available inside the editor).
5. Lightweight full-text search across document content, not just titles.
