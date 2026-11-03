# Project Status

Last updated: 2026-11-03

## Current phase

Phase 6 — Document-grounded chat MVP.

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

## In progress

- Connect a local or Atlas MongoDB URI and exercise registration, login, refresh rotation, logout, document ownership, and grounded chat flows end to end.
- Review landing, auth, and dashboard pages in a browser at desktop and mobile widths.
- Confirm repository visibility and remote destination before pushing project work.

## Pending

- Email verification and password recovery are not implemented yet.
- Persistent conversation history, website sources, notes, quizzes, assignments, team features, hardening, and deployment verification remain pending.

## Verification and Git

- Frontend and server dependencies installed with lockfiles; npm install audits reported zero vulnerabilities for both packages.
- Previous `client`: `npm run build` passed before document-grounded chat was added.
- Previous `server`: Node syntax check passed for all JavaScript source files; PDF, DOCX, and ZIP parser modules loaded successfully.
- `git diff --check` passes.
- Browser review and live API integration are pending. No MongoDB URI is configured, so auth and document flows have not been exercised against a database.
- Current branch: `main`; document-grounded chat changes are in progress and not yet pushed.

## Known constraints

- Free hosting options may not meet dependable public SaaS requirements; validate persistent storage, availability, quota, and billing requirements before deployment.
- Local document disk storage is suitable for development only. Production needs a durable private object store and retention/backup policy; ephemeral free hosting may lose uploaded files.
- AI functionality requires a configured provider or local Ollama runtime; no fabricated fallback responses are allowed.
