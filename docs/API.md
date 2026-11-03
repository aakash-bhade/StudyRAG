# REST API Plan (Phase 1)

Base path: `/api/v1`. JSON errors use a stable `{ error: { code, message, details? }, requestId }` envelope. List endpoints use bounded cursor or page pagination. Mutations validate with Zod and return explicit status codes.

| Area | Planned endpoints |
|---|---|
| Health | `GET /health` |
| Auth | `POST /auth/register`, `/auth/login`, `/auth/logout`, `/auth/refresh`; `GET /auth/me`. Password reset and email verification remain planned. |
| Profile | `GET/PATCH /users/me`, `PATCH /users/me/password`, `DELETE /users/me` |
| Workspaces | CRUD `/workspaces`; membership listing and invitation/removal under `/workspaces/:id/members` |
| Documents | `GET/POST /documents`, `PATCH/DELETE /documents/:id`, `GET /documents/:id/download` (implemented; owner-scoped; PDF, DOCX, UTF-8 TXT; 10 MiB upload cap) |
| Website sources | `GET/POST /sources`, `GET/DELETE /sources/:id`, `POST /sources/:id/refresh` |
| Notes/folders | CRUD `/notes`, `/folders`; `POST /notes/generate` only after generation is implemented |
| Chat | CRUD `/conversations`, `GET/POST /conversations/:id/messages`, `POST /chat/answer` |
| Saved items | `GET/POST /saved-items`, `DELETE /saved-items/:id` |
| Quizzes | CRUD `/quizzes`, `POST /quizzes/generate`, `POST /quizzes/:id/attempts`, `GET /attempts/:id` |
| Assignments/tasks | CRUD `/assignments`, `/tasks`; assignment guidance routes only when implemented |
| Notifications | `GET /notifications`, `PATCH /notifications/:id` |

Every private route requires authentication. Every record route checks owner or explicit workspace membership/permission before access. Teacher, employee, and business UI distinctions do not grant cross-user access by themselves. The current auth API exposes `/auth/me`. Document listing accepts `page`, `limit` (max 50), and `q`; upload uses multipart field `file`. Document text is extracted and stored as owner-scoped chunks; embeddings, RAG retrieval, and website sources remain pending.
