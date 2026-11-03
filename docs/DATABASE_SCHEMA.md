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
| `documentChunks` | ownerId, documentId, ordinal, text, page | Implemented with unique document/ordinal and owner/document indexes; embedding metadata remains pending |
| `websiteSources` | ownerId, workspaceId?, url, canonicalHost, status, fetchedAt, contentHash, error | Owner/workspace + status indexes; safe-fetch policy enforced before indexing |
| `conversations` | ownerId, workspaceId?, title, sourceFilters, archivedAt | Owner/workspace + updatedAt indexes |
| `messages` | ownerId, conversationId, role, content, citations, provider metadata | Conversation + createdAt; citation records refer to authorized sources |
| `notes` | ownerId, workspaceId?, folderId?, title, body, tags, deletedAt | Owner/workspace + updatedAt; text search where appropriate |
| `quizzes` | ownerId, workspaceId?, title, origin, difficulty, questions | Owner/workspace + createdAt |
| `quizAttempts` | ownerId, quizId, answers, score, completedAt | Owner + quiz + completedAt |
| `assignments` | ownerId, workspaceId?, title, instructions, status, dueAt | Owner/workspace + status + dueAt |
| `assignmentSubmissions` | ownerId, assignmentId, content, status, submittedAt | Assignment + owner; app status does not imply institutional submission |
| `tasks` | ownerId, workspaceId?, title, status, dueAt, sourceRef | Owner/workspace + status + dueAt |
| `notifications` | ownerId, type, payload, readAt | Owner + createdAt + readAt |
| `savedItems` | ownerId, kind, sourceId, excerpt, citation | Owner + createdAt; source access checked when displaying details |
| `activityLogs` | actorId, workspaceId?, action, targetType, targetId, createdAt | Actor/workspace + createdAt; exclude secrets and content bodies |

## Data lifecycle rules

- Deleting a user revokes sessions and schedules deletion of owned records and external file objects; shared workspace assets follow explicit ownership/retention rules.
- Reprocessing a source replaces or versions its chunks atomically enough that failed processing does not falsely present stale content as current.
- List APIs paginate and select only fields needed by the view.
- Do not trust `ownerId`, role, or workspace membership sent in request bodies.
- Define indexes alongside each model and review query plans when actual list/search endpoints are implemented.
