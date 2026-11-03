# Free Services Evaluation

Cost target: ₹0. A free plan can impose sleep, storage, bandwidth, quota, eligibility, or uptime restrictions. No billing upgrade is assumed. Verify plan terms again immediately before deployment; this snapshot is dated 2026-11-03.

| Service | Current evaluation | StudyRAG use / caveat |
|---|---|---|
| MongoDB Atlas Free | Candidate: free clusters (formerly M0) are available and do not expire, with limited capacity/features. [Official docs](https://www.mongodb.com/docs/atlas/tutorial/deploy-free-tier-cluster/) | Primary MongoDB candidate. Free tier constraints make it appropriate for development and a small pilot; do not promise production availability. |
| Vercel Hobby | Free plan is positioned for personal projects and small-scale apps. [Official docs](https://vercel.com/docs/plans/hobby) | Candidate for static React client. Check current account eligibility and limits; avoid depending on server functions for persistent workloads. |
| Render Free | Free web services are available, but spin down after 15 idle minutes and have ephemeral filesystem; Render says not to use them for production. [Official docs](https://render.com/docs/free) | Candidate only for prototype/API evaluation. Cannot store durable uploads locally; wake-up latency and service restrictions conflict with dependable SaaS expectations. |
| Cloudflare Pages | Free Pages limits currently include build concurrency and monthly build quotas. [Official docs](https://developers.cloudflare.com/pages/platform/limits/) | Static client candidate; does not alone provide the Express API, MongoDB, or durable file storage. |
| Ollama | Local model runtime candidate; no hosted quota, but requires the user's local compute and model download. | Development adapter only; never treat missing hosted AI as a generated answer. Verify supported model/API behavior when implementing. |

## Provisional direction

Use Atlas Free and static hosting for a constrained demo only after confirming region and account conditions. Keep the backend and file-storage hosting decision open: Render Free does not provide durable local files and has cold starts. Evaluate a free persistent object-storage/API option and its no-billing conditions before allowing user uploads in a public deployment. AI providers remain optional, with configured quotas, clear errors, and no paid fallback.

## User setup requirements

No external credentials are required for local non-AI development. Later `.env.example` files will identify optional MongoDB, session/JWT, storage, and AI settings without containing real values. Never ask users to provide card details as a hidden prerequisite; document if a chosen provider's signup flow requests billing information.
