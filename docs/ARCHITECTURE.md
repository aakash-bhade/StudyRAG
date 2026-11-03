# StudyRAG Architecture (Phase 1)

## Goals

- Deliver a responsive multi-role learning and knowledge assistant using the requested MERN stack.
- Keep AI providers replaceable and make non-AI workflows usable without provider credentials.
- Enforce ownership and workspace permissions in the API before reading or retrieving user content.
- Target a ₹0 operating cost without assuming free tiers provide production-grade uptime or unlimited usage.

## Repository layout

```text
client/                 React + Vite application
  src/components/       Shared controls and display components
  src/features/         Feature-specific pages and UI
  src/layouts/           Public and authenticated shells
  src/routes/            Route definitions and route guards
  src/services/          API client and feature API modules
  src/context/           Session and app-wide state
server/                 Express API
  src/config/            Environment and database setup
  src/controllers/       HTTP request/response handling
  src/middleware/        Authentication, validation, rate limits, errors
  src/models/            Mongoose schemas
  src/routes/            Versioned REST route registration
  src/services/          Domain, document, retrieval, and AI services
  src/validators/        Zod request schemas
docs/                    Architecture and operational documentation
```

## Runtime boundaries

- The React client calls a versioned Express REST API. It never connects directly to MongoDB or an AI provider.
- Controllers validate and normalize HTTP input, call domain services, and return consistent responses.
- Services enforce ownership and membership constraints. Authorization is not delegated to UI route guards.
- File parsing, chunking, embedding, retrieval, and generation are independent services behind provider interfaces.
- Local development may use local file storage and Ollama. Production storage/provider choices require a verified free-tier review and deployment smoke tests.

## RAG request flow

1. Accept only permitted formats and bounded upload sizes; store binaries outside MongoDB.
2. Extract text with parser-specific adapters, preserving page/source metadata when possible.
3. Normalize text and split it into bounded, overlapping chunks.
4. Create embeddings through a configured adapter; record processing failures instead of marking a source ready.
5. At query time, derive the authenticated user and workspace from the session, never from caller-supplied ownership fields.
6. Retrieve only chunks belonging to accessible, active sources. Use a local cosine-similarity fallback initially; keep the retrieval interface compatible with later MongoDB vector search evaluation.
7. Pass retrieved text as untrusted reference material to the configured LLM. Require citations to retrieved source IDs and page metadata.
8. Return a clear unavailable/quota response if embedding or generation is not configured. Never invent a grounded answer.

## Initial technology choices

- Client: React, Vite, Tailwind CSS, React Router DOM, Axios, Context API, Lucide React, React Hook Form, Zod.
- Server: Node.js, Express, Mongoose, Zod, Helmet, rate limiting, bcrypt or Argon2, JWT/session cookies.
- Database: MongoDB, with Atlas Free as an evaluation candidate; use owner/workspace compound indexes.
- Vector retrieval: provider-neutral retrieval interface; local similarity is the initial free development fallback. Atlas Vector Search compatibility and free-tier constraints must be validated before adoption.
- AI: provider-neutral generation and embedding interfaces; Ollama is an optional local development adapter. Hosted providers are opt-in and quota-aware.

## UI direction

The supplied screenshot is the landing page reference: pale sky-blue background, cloud edges, glass-like navigation, bold centered headline with blue emphasis, pill CTAs, and a polished assistant preview. Authenticated pages use a calmer blue-and-white dashboard system with a shared responsive sidebar/top bar and dedicated feature routes. Cloud imagery stays on the public marketing experience to keep work screens legible.

## Deployment boundary

Free tiers are suitable for a prototype or constrained personal project, not automatically a reliable public SaaS. Render documents free-service spin-down and ephemeral filesystems; therefore uploads cannot persist on its local disk. Hosting, AI, and object-storage decisions stay provisional until limits, signup requirements, data persistence, and no-billing conditions are checked together.
