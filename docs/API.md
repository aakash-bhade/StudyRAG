# REST API Plan (Phase 1)

Base path: `/api/v1`. JSON errors use a stable `{ error: { code, message, details? }, requestId }` envelope. List endpoints use bounded cursor or page pagination. Mutations validate with Zod and return explicit status codes.

| Area | Planned endpoints |
|---|---|
| Health | `GET /health` |
| Auth | `POST /auth/register`, `/auth/login`, `/auth/logout`, `/auth/refresh`; `GET /auth/me`. Password reset and email verification remain planned. |
| Profile | `GET/PATCH /users/me`, `PATCH /users/me/password`, `DELETE /users/me` |
| Workspaces | CRUD `/workspaces`; membership listing and invitation/removal under `/workspaces/:id/members` |
| Documents | `GET/POST /documents`, `PATCH/DELETE /documents/:id`, `GET /documents/:id/download` (implemented; owner-scoped; PDF, DOCX, UTF-8 TXT; 10 MiB upload cap) |
| Website sources | `GET/POST /sources`, `DELETE /sources/:id` (implemented; public HTML only, 2 MiB cap, bounded redirects, owner-scoped chunks; refresh pending) |
| Notes/folders | CRUD `/notes`, `/folders`; `POST /notes/generate` only after generation is implemented |
| Chat | `GET /chat/conversations`, `GET/DELETE /chat/conversations/:id`, `POST /chat/ask` (creates or appends to an optional `conversationId`) |
| Saved items | `GET/POST /saved-items`, `DELETE /saved-items/:id` |
| Quizzes | `GET /quizzes`, `POST /quizzes/generate`, `GET /quizzes/:id`, `POST /quizzes/:id/attempts` (implemented; Ollama required for generation; owner-scoped server scoring) |
| Assignments/tasks | CRUD `/assignments`, `/tasks`; assignment guidance routes only when implemented |
| Notifications | `GET /notifications`, `PATCH /notifications/:id` |

Every private route requires authentication. Every record route checks owner or explicit workspace membership/permission before access. Teacher, employee, and business UI distinctions do not grant cross-user access by themselves. The current auth API exposes `/auth/me`. Document listing accepts `page`, `limit` (max 50), and `q`; upload uses multipart field `file`. `GET /notes` accepts `q`, `POST /notes` creates a note, and `PATCH/DELETE /notes/:id` update or remove one. Note titles are limited to 120 characters, bodies to 10,000 characters, and each note supports up to ten tags. `POST /sources` accepts `{ "url": "https://…" }`; only public HTML pages are fetched, with DNS/IP validation, redirect revalidation, an 8-second timeout, and 2 MiB response cap. Chat accepts optional `websiteSourceIds`; when either source list is selected, retrieval is restricted to the selected documents and websites. Passages from both kinds of sources are cited. `POST /quizzes/generate` accepts optional `documentIds`, `websiteSourceIds`, `difficulty` (`easy`, `medium`, `hard`), and `questionCount` (3–10); source lists left empty include all the user's ready sources. Generation requires `OLLAMA_BASE_URL` and `OLLAMA_MODEL`. Quiz reads hide correct answers; `POST /quizzes/:id/attempts` submits one option index per question and returns a server-scored result with explanations. Embedding-based retrieval remains pending.
