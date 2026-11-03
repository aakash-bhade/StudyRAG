# StudyRAG

StudyRAG is planned as a multi-source AI learning and productivity platform built with the MERN stack. The product roadmap includes private document and website sources, grounded AI chat, notes, quizzes, assignments, and role-aware workspaces.

## Project phase

Private documents and websites, cited study chat, notes and folders, quizzes, flashcards, assignments, tasks, saved passages, live workspace overview, editable account profile, private JSON data export, password security settings, and in-app deadline reminders are implemented. Chat supports keyword retrieval by default and optional hybrid semantic retrieval through a configured local Ollama embedding model. See [PROJECT_STATUS.md](PROJECT_STATUS.md) for current progress and limitations.

## Project documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Database schema plan](docs/DATABASE_SCHEMA.md)
- [REST API plan](docs/API.md)
- [Security plan](SECURITY.md)
- [Free services evaluation](FREE_SERVICES.md)
- [Architecture decisions](DECISIONS.md)

GitHub Actions runs a client production build, server JavaScript syntax check, and server runtime import smoke check for pushes and pull requests targeting `main`.

## Intended stack

- Client: React, Vite, Tailwind CSS
- API: Node.js and Express
- Database: MongoDB with Mongoose
- AI/RAG: provider-neutral services with optional local Ollama development

No paid service is assumed. Free-tier limitations and setup requirements must be checked before deployment.

## Run locally

Requirements: Node.js 20.19+ and MongoDB Community locally, or a MongoDB Atlas connection string.

1. In one terminal, start MongoDB or create a free Atlas database.
2. Copy `server/.env.example` to `server/.env`; set `MONGODB_URI` and replace both JWT secrets with separate random strings of at least 32 characters. Keep this file private.
3. From `server/`, run `npm install` once and then `npm run dev`.
4. In another terminal, from `client/`, run `npm install` once and then `npm run dev`.
5. Open the Vite URL (usually `http://localhost:5173`). The client forwards `/api` requests to the local Express API.

With MongoDB, Ollama, `qwen2.5:3b`, and `embeddinggemma` running/configured, run `npm run check:integration` from `server/` to exercise registration, notes, file/web ingestion, semantic indexing, grounded chat, quizzes, flashcards, tasks, assignments, and reminders. The smoke flow creates a temporary account and removes its records and uploaded files afterward.

Registration, login, and document metadata need a reachable MongoDB instance. Document binaries currently use private local disk storage for development; production needs durable private object storage. The API fails closed when the database is unavailable; it does not create a fake account or session.

Email verification and password recovery use optional SMTP settings in `server/.env` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, and optionally `SMTP_USER`/`SMTP_PASS`). Configure all required SMTP values together to enable verification and reset links. Without SMTP configured, local registration remains available without email verification and email recovery reports that delivery is unavailable. Never commit SMTP credentials.

To generate answers from uploaded sources, run [Ollama](https://ollama.com/) locally, pull a chat model (for example `ollama pull qwen2.5:3b`), then set `OLLAMA_BASE_URL=http://127.0.0.1:11434` and `OLLAMA_MODEL=qwen2.5:3b` in `server/.env`. For semantic retrieval, also run `ollama pull embeddinggemma`, set `OLLAMA_EMBEDDING_MODEL=embeddinggemma`, restart the API, and use the sparkle action in Documents or Website sources to build private passage vectors. Chat combines keyword scores with cosine similarity; without indexed vectors it continues to use keyword retrieval. Ollama's documented `/api/embed` route supports batched strings and cosine similarity ([Ollama embeddings docs](https://docs.ollama.com/capabilities/embeddings)). Recent conversations and citations are saved in MongoDB and remain private to the owner.
