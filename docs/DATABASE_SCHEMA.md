# Database Schema Plan (Phase 1)

All user-owned records carry `ownerId`; workspace data also carries `workspaceId`. References are validated and access-filtered in service queries. Schemas use timestamps, explicit validators, and indexes for common owner-scoped lists. Large file binaries and embedding arrays are not stored in general-purpose user documents.

| Collection | Main fields | Access and indexes |
|---|---|---|
| `users` | email, passwordHash, displayName, role, status, preferences | Unique normalized email; role is set/validated server-side |
| `sessions` | userId, refreshTokenHash, expiresAt, revokedAt, rotation metadata | User + expiry indexes; never store raw refresh token |
| `workspaces` | name, type, createdBy, settings | Creator and type indexes |
| `workspaceMembers` | workspaceId, userId, membershipRole, permissions, status | Unique workspace/user pair; membership checked on every shared-resource request |
| `folders` | ownerId, workspaceId?, name, parentId? | Owner/workspace + parent indexes |
| `documents` | ownerId, displayName, originalName, private storageKey, mimeType, byteSize, ready status, pageCount, chunkCount, contentHash | Implemented with owner + createdAt and owner + displayName indexes; storage key and content hash excluded from default queries |
| `documentChunks` | ownerId, documentId, ordinal, text, page, embedding?, embeddingModel? | Implemented with unique document/ordinal and owner/document indexes; vectors are private and excluded from default queries |
| `websiteSources` | ownerId, url, title, canonicalHost, ready status, fetchedAt, contentHash, chunkCount | Implemented with owner + createdAt index; safe-fetch policy runs on add and refresh; short-lived refresh lock serializes re-index and deletion |
| `websiteChunks` | ownerId, sourceId, ordinal, text, embedding?, embeddingModel? | Implemented with unique owner/source/ordinal index; refresh restores old chunks if re-indexing fails; vectors are private |
| `quizzes` | ownerId, title, difficulty, sourceNames, questions with private answer key | Implemented with owner + createdAt index; list and get responses omit correct answer and explanation until an attempt is graded |
| `quizAttempts` | ownerId, quizId, answers, score, total, completedAt | Implemented with owner + quiz + completion index; score is computed on the server |
| `tasks` | ownerId, title, details, status, dueAt | Implemented with owner + status + due date and owner + updated indexes; personal task planner |
| `assignments` | ownerId, title, instructions, status, response, dueAt, submittedAt | Implemented with owner + status + due date and owner + updated indexes; submitted state is internal to StudyRAG |
| `conversations` | ownerId, workspaceId?, title, sourceFilters, archivedAt | Implemented with owner + updatedAt index; only the owner can list, read, or delete |
| `messages` | ownerId, conversationId, role, content, citations, provider metadata | Implemented with owner + conversation + createdAt index; citations retain authorized document excerpts |
| `notes` | ownerId, workspaceId?, folderId?, title, body, tags, deletedAt | Implemented with owner + updatedAt and owner + title indexes; private CRUD and owner-scoped title/body/tag search |
| `quizzes` | ownerId, workspaceId?, title, origin, difficulty, questions | Owner/workspace + createdAt |
| `quizAttempts` | ownerId, quizId, answers, score, completedAt | Owner + quiz + completedAt |
| `assignments` | ownerId, workspaceId?, title, instructions, status, dueAt | Owner/workspace + status + dueAt |
| `assignmentSubmissions` | ownerId, assignmentId, content, status, submittedAt | Assignment + owner; app status does not imply institutional submission |
| `tasks` | ownerId, workspaceId?, title, status, dueAt, sourceRef | Owner/workspace + status + dueAt |
| `notifications` | ownerId, key, sourceType, sourceId, title, body, href, dueAt, readAt | Implemented; unique owner/key index, reconciled from active task/assignment deadlines when opened |
| `savedItems` | ownerId, sourceType, sourceId, ordinal, sourceName, excerpt, citation snapshot | Implemented with owner + createdAt and unique owner/source/ordinal indexes; source ownership and excerpt are checked on save |
| `activityLogs` | actorId, workspaceId?, action, targetType, targetId, createdAt | Actor/workspace + createdAt; exclude secrets and content bodies |

## Data lifecycle rules

- Deleting a user revokes sessions and schedules deletion of owned records and external file objects; shared workspace assets follow explicit ownership/retention rules.
- Reprocessing a source replaces or versions its chunks atomically enough that failed processing does not falsely present stale content as current.
- List APIs paginate and select only fields needed by the view.
- Do not trust `ownerId`, role, or workspace membership sent in request bodies.
- Define indexes alongside each model and review query plans when actual list/search endpoints are implemented.
