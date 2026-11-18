# Free Services Evaluation

Cost target: ₹0. A free plan can impose sleep, storage, bandwidth, quota, eligibility, or uptime restrictions. No billing upgrade is assumed. Verify plan terms again immediately before deployment; this snapshot is dated 2026-11-18.

| Service | Current evaluation | StudyRAG use / caveat |
|---|---|---|
| MongoDB Atlas Free | Candidate: free clusters (formerly M0) are available and do not expire, with limited capacity/features. [Official docs](https://www.mongodb.com/docs/atlas/tutorial/deploy-free-tier-cluster/) | Primary MongoDB candidate. Free tier constraints make it appropriate for development and a small pilot; do not promise production availability. |
| Vercel Hobby | Free plan is positioned for personal projects and small-scale apps. [Official docs](https://vercel.com/docs/plans/hobby) | Candidate for static React client. Check current account eligibility and limits; avoid depending on server functions for persistent workloads. |
| Render Docker Web Service (Free) | Render supports building a Dockerfile on a free web-service instance. It has 512 MB RAM and up to 750 included instance-hours per workspace per month; it sleeps after 15 idle minutes, may restart, and cannot attach a persistent disk. [Official docs](https://render.com/docs/free) | Best current zero-compute-cost container option for a small demo. Use hosted MongoDB and private R2 storage; not appropriate to promise always-on or production-grade availability. Monitor included bandwidth/build usage. |
| Cloudflare R2 | Standard storage currently includes 10 GB-month, one million Class A operations, and ten million Class B operations monthly; overages are billed, and account setup requires an R2 subscription checkout. [Official docs](https://developers.cloudflare.com/r2/pricing/) | Private S3-compatible document storage candidate. Keep the bucket private and create scoped credentials; monitor usage and set billing controls. |
| Cloudflare Pages | Free Pages limits currently include build concurrency and monthly build quotas. [Official docs](https://developers.cloudflare.com/pages/platform/limits/) | Static client candidate; does not alone provide the Express API, MongoDB, or durable file storage. |
| Groq API | Hosted model inference with a free tier and account-level rate limits. [Official model and limits docs](https://console.groq.com/docs/models) | Used for chat, quiz, and flashcard generation. Store the API key only in the deployed server's secret settings; free quota and uptime are not guaranteed. |

## Provisional direction

For a no-compute-charge demo, the current candidate is Render's free Docker web service plus an Atlas Free cluster, Cloudflare R2 within its monthly free allowance, and Groq within account quotas. Render sleeps after inactivity and is not a dependable always-on production host; Atlas and R2 also have capacity/usage limits. This combination can exceed included bandwidth or provider allowances and incur charges if usage grows. Groq is the sole AI provider in the app; quota exhaustion is surfaced as an error and there is no paid fallback.

## User setup requirements

Groq chat/quiz/flashcard generation requires `GROQ_API_KEY` in the server environment. Never put it in client code or source control. Never ask users to provide card details as a hidden prerequisite; document if a chosen provider's signup flow requests billing information.
