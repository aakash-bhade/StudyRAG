# Security Plan

This document records the baseline controls planned for StudyRAG. A control is not considered implemented until its code path and relevant checks exist.

## Authentication and sessions

- Hash passwords using a maintained password-hashing library and safe work factors.
- Keep signing keys and provider credentials in environment variables; commit only `.env.example` with placeholders.
- Use short-lived access credentials and hashed, rotating, revocable refresh tokens. The current refresh cookie is HTTP-only, SameSite-configurable, and Secure in production. Cookie-authenticated mutations must pass the exact configured Origin check; deployment must use HTTPS and a same-site app/API domain or set `COOKIE_SAME_SITE=none` with Secure cookies.
- Rate-limit registration, login, password reset, and verification; avoid account-enumeration responses.
- Enforce role and membership from database state, never from user-submitted role fields.

## API and browser security

- Use Helmet, explicit CORS origins, body size limits, centralized error handling, request IDs, and rate limits.
- Validate route params, queries, and bodies with Zod; reject unexpected fields and sanitize query operators.
- Encode untrusted output in the client; render rich text with a strict allowlist.
- Use authorization checks in service queries for every owner/workspace resource and return non-revealing errors for inaccessible IDs.

## Files and external URLs

- Bound file sizes, allow only implemented formats, verify MIME/signature when practical, and generate opaque storage names.
- Keep binaries outside MongoDB and private from public static paths; authorize every preview/download.
- For URL ingestion, reject credentials and non-HTTP(S) schemes, resolve and block loopback/private/link-local/reserved addresses, pin the validated IPv4 address for each request, revalidate every redirect and DNS resolution, cap redirects/timeouts/response bytes, and restrict content types. The current fetcher accepts public HTML only, caps pages at 2 MiB, and does not execute webpage scripts.
- Do not fetch or index content in violation of applicable site policies; URL ingestion must not expose server-side network access.

## AI and tenant isolation

- Authorize sources before retrieval; include owner/workspace filters in the retrieval operation itself.
- Treat document and webpage text as untrusted quoted context, never instructions. Do not expose secrets or internal system prompts to retrieved content.
- Restrict provider credentials to server-side adapters, enforce request/token quotas, and redact credentials/content from logs.
- Clearly distinguish grounded responses with citations from general answers; report provider/quota failures honestly.

## Operations and account lifecycle

- Keep `.env`, uploads, database dumps, and generated runtime data out of Git. Review staged changes for secrets before commits/pushes.
- Use HTTPS in deployment and configure trusted proxy/cookie settings explicitly.
- Revoke sessions on logout, password change, and account deletion. Define deletion behavior for files and shared workspace data before release.
- Revisit this plan during implementation and record actual controls and known limitations here.
