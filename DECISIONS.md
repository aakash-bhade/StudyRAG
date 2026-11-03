# Architecture Decisions

## 2026-11-03 — Keep the application as a MERN monorepo

**Decision:** Separate React/Vite client and Express/Mongoose server under `client/` and `server/` in one repository.

**Reason:** This matches the requested stack and keeps API and UI changes reviewable together while maintaining a clear runtime boundary.

## 2026-11-03 — Enforce privacy in server-side data access

**Decision:** Derive identity from authenticated session state and scope every resource/retrieval query by owner or explicit workspace membership.

**Reason:** Client route guards are usability controls, not authorization. This is necessary to prevent cross-user and cross-tenant access.

## 2026-11-03 — Keep AI and vector retrieval provider-neutral

**Decision:** Define embedding, generation, and retrieval service interfaces; do not couple core feature flows to one paid or hosted provider.

**Reason:** The budget target and provider quotas may change. Unavailable services should disable dependent AI actions clearly while leaving CRUD features usable.

## 2026-11-03 — Treat free deployment as a constrained pilot until verified

**Decision:** Do not claim that free-tier hosting meets production SaaS requirements; evaluate persistence, cold starts, service limits, and billing conditions before selecting final deployment.

**Reason:** Current free backend options include material availability and filesystem limitations. Durable uploads need separate verified storage.
