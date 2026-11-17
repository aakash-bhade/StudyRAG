# StudyRAG

StudyRAG is planned as a multi-source AI learning and productivity platform built with the MERN stack. The product roadmap includes private document and website sources, grounded AI chat, notes, quizzes, assignments, and role-aware workspaces.

## Project phase

Private documents and websites, cited study chat, notes and folders, quizzes, flashcards, assignments, tasks, saved passages, live workspace overview, editable account profile, private JSON data export, password security settings, and in-app deadline reminders are implemented. Chat retrieves owned passages with keyword ranking and uses Groq-hosted inference for answers, quizzes, and flashcards. See [PROJECT_STATUS.md](PROJECT_STATUS.md) for current progress and limitations.

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
- AI/RAG: Groq-hosted generation with server-side keyword retrieval

No paid service is assumed. Free-tier limitations and setup requirements must be checked before deployment.

## Run locally

Requirements: Node.js 20.19+ and MongoDB Community locally, or a MongoDB Atlas connection string.

1. In one terminal, start MongoDB or create a free Atlas database.
2. Copy `server/.env.example` to `server/.env`; set `MONGODB_URI` and replace both JWT secrets with separate random strings of at least 32 characters. Keep this file private.
3. From `server/`, run `npm install` once and then `npm run dev`.
4. In another terminal, from `client/`, run `npm install` once and then `npm run dev`.
5. Open the Vite URL (usually `http://localhost:5173`). The client forwards `/api` requests to the local Express API.

With MongoDB and a Groq API key configured, run `npm run check:integration` from `server/` to exercise registration, notes, file/web ingestion, grounded chat, quizzes, flashcards, tasks, assignments, and reminders. The smoke flow creates a temporary account and removes its records and uploaded files afterward.

Registration, login, and document metadata need a reachable MongoDB instance. Document binaries currently use private local disk storage for development; production needs durable private object storage. The API fails closed when the database is unavailable; it does not create a fake account or session.

## Deployment data and admin panel

The server does not use the developer laptop after deployment. Put MongoDB on a hosted MongoDB service (for example, Atlas) and set the deployed server's `MONGODB_URI` to that database. Notes, accounts, document metadata, quizzes, chats, and other workspace records are stored in MongoDB. Uploaded PDF/DOCX/TXT files are stored separately in a private S3-compatible bucket; this code supports Cloudflare R2 and AWS S3 endpoints. Production startup intentionally fails unless that object storage is configured, because common app hosts erase local disk on restart/redeploy.

Set these secrets in the API host's environment (never in client/Vite variables):

```env
NODE_ENV=production
MONGODB_URI=<hosted MongoDB connection string>
STORAGE_PROVIDER=s3
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=<private bucket name>
S3_ACCESS_KEY_ID=<bucket access key>
S3_SECRET_ACCESS_KEY=<bucket secret>
```

Create the bucket as private and issue a bucket-scoped key with object read/write/delete permissions. R2 uses `auto` for the region; for AWS S3, set the bucket's region and its endpoint URL. Keep the existing JWT, Groq, CORS, and optional email environment settings configured on the server too.

To enable the owner dashboard, first create your account through the website, point the server command at the same hosted MongoDB database, then run from `server/`:

```powershell
npm run admin:promote -- your-email@example.com
```

Sign out and back in. The **Admin panel** link appears only for an account with the `admin` role; the API checks the role from MongoDB on every request, and public signup cannot grant admin access. The panel shows account details, last sign-ins, aggregate feature counts, and database/storage status. It intentionally excludes private chat, note, and document contents.

If migrating existing local files, configure the new private bucket and set `DOCUMENT_STORAGE_DIR` to the folder containing local files. Run `npm run storage:migrate` against the MongoDB database that contains those document records before removing the old disk files. This copies binaries and preserves their existing storage keys; it does not migrate a local MongoDB database into hosted MongoDB. For a new hosted database, users can upload documents again after deployment.

Browser profile photos are currently stored in that browser's local storage and are not part of server backups. The user can still see the same browser photo after deploying on that device, but it does not sync across devices.

Email verification and password recovery use optional SMTP settings in `server/.env` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, and optionally `SMTP_USER`/`SMTP_PASS`). Configure all required SMTP values together to enable verification and reset links. Without SMTP configured, local registration remains available without email verification and email recovery reports that delivery is unavailable. Never commit SMTP credentials.

Set `GROQ_API_KEY` and optionally `GROQ_MODEL` in the server environment. The default model is `openai/gpt-oss-20b`; check [Groq's current model catalog and limits](https://console.groq.com/docs/models) before deployment. Keep the API key out of client code and source control. Free tier usage is rate-limited and may return HTTP 429 when its quota is reached. The backend retrieves relevant passages using keyword ranking; no local AI model or embedding runtime is required. Recent conversations and citations are saved in MongoDB.
