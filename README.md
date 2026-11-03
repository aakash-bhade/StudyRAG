# StudyRAG

StudyRAG is planned as a multi-source AI learning and productivity platform built with the MERN stack. The product roadmap includes private document and website sources, grounded AI chat, notes, quizzes, assignments, and role-aware workspaces.

## Project phase

Authentication foundation and the first private document library are implemented. See [PROJECT_STATUS.md](PROJECT_STATUS.md) for current progress and limitations.

## Project documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Database schema plan](docs/DATABASE_SCHEMA.md)
- [REST API plan](docs/API.md)
- [Security plan](SECURITY.md)
- [Free services evaluation](FREE_SERVICES.md)
- [Architecture decisions](DECISIONS.md)

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

Registration, login, and document metadata need a reachable MongoDB instance. Document binaries currently use private local disk storage for development; production needs durable private object storage. The API fails closed when the database is unavailable; it does not create a fake account or session.

To generate answers from uploaded sources, run [Ollama](https://ollama.com/) locally, pull a model (for example `ollama pull qwen2.5:3b`), then set `OLLAMA_BASE_URL=http://127.0.0.1:11434` and `OLLAMA_MODEL=qwen2.5:3b` in `server/.env`. Restart the API after changing environment settings. The chat searches only the signed-in user's document chunks, shows retrieved passages, and reports a setup message instead of inventing an answer when Ollama is not configured. Recent conversations and citations are saved in MongoDB and remain private to the owner.
