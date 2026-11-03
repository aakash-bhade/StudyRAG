# Project Status

Last updated: 2026-11-03

## Current phase

Phase 28 — Saved conversation management.

## Completed

- Inspected the repository, current Git status, initial commit, and configured `origin` remote.
- Reviewed the supplied StudyRAG landing-page visual reference and master requirements.
- Drafted application architecture, feature sequence, database schema plan, REST API map, security baseline, and free-service evaluation.
- Implemented the first responsive landing-page pass with reference-inspired sky palette, cloud shapes, assistant preview, feature/workflow sections, FAQ accordion, and explainer dialog.
- Added React Router routes and responsive registration, login, and authenticated dashboard screens.
- Added Express/Mongoose API foundation with validated registration/login, bcrypt password hashing, short-lived access JWTs, rotating HTTP-only refresh-cookie sessions, logout revocation, auth rate limiting, CORS, Helmet, request validation, and ownership-ready auth middleware.
- Added server environment template and Vite `/api` development proxy.
- Added authenticated, owner-scoped PDF, DOCX, and UTF-8 TXT upload, listing/search, rename, download/preview, and delete flows. Original files use private local disk storage; extracted text is split into owner-scoped MongoDB chunks for the upcoming RAG pipeline.
- Added upload limits, document parser validation, private storage keys, document cleanup, and a shared workspace navigation shell.
- Added authenticated document Q&A with owner-scoped chunk retrieval, lightweight keyword ranking, source excerpts, question rate limiting, and optional locally hosted Ollama answer generation with grounded prompts and explicit provider errors.
- Added the responsive “Ask materials” chat screen, document selection, inline source references, and a no-provider retrieval-only state.
- Added owner-scoped conversation and message records, recent conversation listing, reopen and delete APIs, persisted source filters and citations, and a recent-conversations panel in chat.
- Added private note create, edit, delete, and title/body/tag search flows with owner-scoped MongoDB records and a responsive workspace editor.
- Added owner-scoped public webpage sources with bounded HTML fetching, redirect and DNS/IP checks, text extraction/chunking, source management UI, and cited retrieval in study chat.
- Added owner-scoped source-grounded MCQ generation from documents/websites, private saved quizzes and attempts, server-side scoring, and a responsive quiz builder/review UI.
- Added private task planning with due dates and to-do, in-progress, and done states; tasks have owner-scoped CRUD APIs and a responsive board UI.
- Added account settings with profile details and authenticated password changes; current-password verification and global session revocation require a fresh sign-in after changing credentials.
- Added a private assignment tracker for instructions, due dates, response drafts, and an internal StudyRAG submitted status; no external school or LMS submission is performed.
- Added private saved study passages: cited chat snippets can be bookmarked, reviewed later, and removed; the save API verifies the source belongs to the user and the excerpt matches the cited chunk.
- Added website source refresh/re-index from the source library, with SSRF-safe redirect/DNS checks, per-source refresh locking, rate limiting, and rollback to old chunks if indexing or metadata update fails.
- Added optional Ollama semantic embeddings for documents and webpages, per-source embedding index actions, private stored vectors, and hybrid cosine/keyword chat ranking; keyword retrieval remains the fallback.
- Added a private notifications center that reconciles reminders from overdue and next-7-day task/assignment due dates, removes stale reminders, and tracks read state.
- Added private notes folders with create, rename, delete, note assignment, and folder filtering; deleting a folder unfiles its notes without removing their content.
- Added authenticated profile display-name editing with server validation and immediate account-context updates across the workspace.
- Added an authenticated JSON data export for the account profile and owner-scoped study records, including extracted document/webpage text; excludes passwords, sessions, original file binaries, internal storage identifiers, content hashes, and embedding vectors.
- Replaced the generic post-login placeholder with owner-scoped live counts, upcoming task/assignment deadlines, and quick links; partial API failures are surfaced without hiding available sections.
- Corrected the password-length hint so it appears on account creation only, not on sign-in.
- Added optional SMTP email verification and password recovery using hashed, expiring one-time tokens; password resets revoke active sessions. Local auth preserves its existing behavior when SMTP is not configured.
- Added a GitHub Actions workflow for the client production build and server JavaScript syntax checks on pushes and pull requests to `main`.
- Added owner-scoped flashcard deck generation from private documents and websites, saved decks, flip-through review, and deck deletion; flashcard deck content is included in personal data exports.
- Replaced the crowded small-screen sidebar with a compact mobile navigation bar and a More menu for the remaining workspace sections.
- Added owner-scoped saved conversation renaming with validated titles and inline rename, save, and cancel controls in chat.
- Added a two-step conversation delete control that removes its messages and clears the active chat when applicable.
- Added one-click copying for generated study chat answers with transient copied feedback.

## In progress

- Connect a local or Atlas MongoDB URI and exercise authentication, source ingestion, quiz generation, attempts, ownership, and grounded chat flows end to end.
- Configure a local Ollama model and review generation quality against representative study material.
- Review auth, workspace, source, chat, notes, and quiz screens at desktop and mobile widths.

## Pending

- Team features, remaining hardening, and deployment verification remain pending.

## Verification and Git

- Frontend and server dependencies installed with lockfiles; npm install audits reported zero vulnerabilities for both packages.
- Current `client`: production build passes with source-grounded flashcards and mobile navigation.
- Current `server`: Node syntax checks pass across all server JavaScript files.
- `git diff --check` passes. Live API integration is pending because MongoDB is not configured.
- Email verification and recovery have not been exercised against configured SMTP credentials.
- Browser review and live API integration are pending. No MongoDB URI is configured, so auth and document flows have not been exercised against a database.
- Current branch: `main`; answer-copy controls are in progress locally.

## Known constraints

- Free hosting options may not meet dependable public SaaS requirements; validate persistent storage, availability, quota, and billing requirements before deployment.
- Local document disk storage is suitable for development only. Production needs a durable private object store and retention/backup policy; ephemeral free hosting may lose uploaded files.
- AI functionality requires a configured provider or local Ollama runtime; no fabricated fallback responses are allowed.
- Semantic search requires an installed Ollama embedding model configured with `OLLAMA_EMBEDDING_MODEL`; existing sources must be explicitly indexed, and chat falls back to keyword retrieval when embeddings are unavailable.
- Deadline reminders refresh when the signed-in user opens Notifications; scheduled background, email, and push delivery are not implemented.
- Website ingestion currently handles public HTML pages up to 2 MiB with a bounded redirect count and pinned public IPv4 DNS result. JavaScript-rendered pages, authentication-required pages, PDFs, and IPv6-only hosts are not supported; browser review and live fetching against the configured runtime remain pending.
- Quiz creation requires a configured Ollama-compatible chat model; quiz generation and attempt persistence still need live database/provider verification.
