# Project Status

Last updated: 2026-11-17

## Current phase

Phase 33 — Role-aware personal dashboards.

Estimated completion: 90% of the planned feature implementation. Production readiness is lower while live-service verification, team sharing, and deployment remain outstanding.

## Completed

- Inspected the repository, current Git status, initial commit, and configured `origin` remote.
- Reviewed the supplied StudyRAG landing-page visual reference and master requirements.
- Drafted application architecture, feature sequence, database schema plan, REST API map, security baseline, and free-service evaluation.
- Implemented the first responsive landing-page pass with reference-inspired sky palette, cloud shapes, assistant preview, feature/workflow sections, FAQ accordion, and explainer dialog.
- Added React Router routes and responsive registration, login, and authenticated dashboard screens.
- Added Express/Mongoose API foundation with validated registration/login, bcrypt password hashing, short-lived access JWTs, rotating HTTP-only refresh-cookie sessions, logout revocation, auth rate limiting, CORS, Helmet, request validation, and ownership-ready auth middleware.
- Added server environment template and Vite `/api` development proxy.
- Added authenticated, owner-scoped PDF, DOCX, and UTF-8 TXT upload, listing/search, rename, download/preview, and delete flows. Development uses private local disk; deployment supports private S3-compatible object storage (including R2 endpoints), with startup checks that reject local disk in production.
- Added upload limits, document parser validation, private storage keys, document cleanup, and a shared workspace navigation shell.
- Added authenticated document Q&A with owner-scoped chunk retrieval, lightweight keyword ranking, source excerpts, question rate limiting, and Groq-hosted answer generation with grounded prompts and explicit provider errors.
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
- Uses owner-scoped keyword retrieval for documents, webpages, and notes; no local embedding model or vector-index step is required.
- Added a private notifications center that reconciles reminders from overdue and next-7-day task/assignment due dates, removes stale reminders, and tracks read state.
- Added private notes folders with create, rename, delete, note assignment, and folder filtering; deleting a folder unfiles its notes without removing their content.
- Added authenticated profile display-name editing with server validation and immediate account-context updates across the workspace.
- Added an authenticated JSON data export for the account profile and owner-scoped study records, including extracted document/webpage text; excludes passwords, sessions, original file binaries, internal storage identifiers, and content hashes.
- Replaced the generic post-login placeholder with owner-scoped live counts, upcoming task/assignment deadlines, and quick links; partial API failures are surfaced without hiding available sections.
- Corrected the password-length hint so it appears on account creation only, not on sign-in.
- Added optional SMTP email verification and password recovery using hashed, expiring one-time tokens; password resets revoke active sessions. Local auth preserves its existing behavior when SMTP is not configured.
- Added a GitHub Actions workflow for the client production build and server JavaScript syntax checks on pushes and pull requests to `main`.
- Added owner-scoped flashcard deck generation from private documents and websites, saved decks, flip-through review, and deck deletion; flashcard deck content is included in personal data exports.
- Replaced the crowded small-screen sidebar with a compact mobile navigation bar and a More menu for the remaining workspace sections.
- Added owner-scoped saved conversation renaming with validated titles and inline rename, save, and cancel controls in chat.
- Added a two-step conversation delete control that removes its messages and clears the active chat when applicable.
- Added one-click copying for generated study chat answers with transient copied feedback.
- Extended grounded chat to search private notes alongside documents and webpages, preserve note filters in conversations, and cite note sections.
- Fixed the flashcard API route's validator import, which passed syntax checks but prevented the Express app from loading at runtime.
- Added a server runtime import smoke check to CI so missing ESM exports across registered routes are caught before merge.
- Configured ignored local `server/.env` with development JWT secrets and MongoDB connection settings.
- Replaced deprecated Mongoose `new: true` update options with `returnDocument: 'after'` for the installed Mongoose 9 runtime.
- Added a local integration smoke command covering registration, notes/folders, TXT upload, webpage add/refresh, cited chat, saved passages, quiz attempts, flashcards, tasks, assignments, and notification read state. It cleans up its synthetic account and files.
- Extended the integration smoke to use two temporary accounts and verify cross-user document downloads, source retrieval, and conversation reads are denied.
- Added role-aware dashboard summaries and quick actions for students, teachers, employees, and business professionals; each keeps personal-data access clear and links only to implemented features.
- Added an owner-only admin dashboard with account search/pagination, role and status, join/last-login times, active-session and workspace totals, recent sign-ins, broad successful-action events, and database/storage health. The server rechecks the database role for every admin API request; `npm run admin:promote -- owner@example.com` grants access outside public signup.
- Added privacy-minimized workspace activity events (action type and user only; no prompts, note text, filenames, or document content).
- Added an S3-compatible private object-store adapter with SigV4 support, local-only development storage, production startup enforcement, private streamed downloads, and `npm run storage:migrate` for document binaries already referenced by the connected MongoDB database.

## In progress

- Implement secure teacher/class and business/team workspaces with explicit membership and sharing permissions.
- Review AI generation quality and browser experience against representative study materials.
- Review auth, workspace, source, chat, notes, and quiz screens at desktop and mobile widths.

## Pending

- Team features, remaining hardening, and deployment verification remain pending.

## Verification and Git

- Frontend and server dependencies installed with lockfiles; npm install audits reported zero vulnerabilities for both packages.
- Current `client`: production build passes with notes-grounded chat, answer copying, source-grounded flashcards, and mobile navigation.
- Current `server`: Node syntax checks and full Express app runtime import smoke check pass; the current Groq integration is syntax-checked but needs a Groq API key for live provider verification.
- Integration coverage includes registration/profile, cross-user privacy, folders/notes, TXT upload, webpage add/refresh, cited chat, saved passages, quiz/attempt, flashcards, task updates, assignment submission, and notification read-state.
- Client production build passes. `git diff --check` passes. Both npm dependency audits report zero vulnerabilities.
- Email verification and recovery have not been exercised against configured SMTP credentials.
- Browser visual review and deployment verification are pending. Local browser automation could not reach the temporary Vite preview; API and end-to-end service checks passed. SMTP email actions remain untested because SMTP credentials are not configured.
- Current branch: `main`; role-aware dashboard commit is pushed, while the expanded two-account privacy regression check is pending commit and push.

## Known constraints

- Free hosting options may not meet dependable public SaaS requirements; validate persistent storage, availability, quota, and billing requirements before deployment.
- Production deployment still requires a hosted MongoDB database and private S3-compatible bucket credentials to be configured in the hosting provider, plus a database and object-store backup/retention plan. Browser profile photos remain local to each browser.
- AI functionality requires `GROQ_API_KEY`; no local model runtime is used. Missing keys and provider quota errors are surfaced without fabricated responses.
- Passage retrieval uses keyword ranking. Semantic vector search is not currently included.
- Deadline reminders refresh when the signed-in user opens Notifications; scheduled background, email, and push delivery are not implemented.
- Website ingestion currently handles public HTML pages up to 2 MiB with a bounded redirect count and pinned public IPv4 DNS result. JavaScript-rendered pages, authentication-required pages, PDFs, and IPv6-only hosts are not supported; the live example.com add/refresh/index flow passes.
- Quiz and flashcard generation require Groq access; quality review across diverse study materials remains pending.
