# Free Services Evaluation

Cost target: ₹0. A free plan can impose sleep, storage, bandwidth, quota, eligibility, or uptime restrictions. No billing upgrade is assumed. Verify plan terms again immediately before deployment; this snapshot is dated 2026-11-18.

| Service | Current evaluation | StudyRAG use / caveat |
|---|---|---|
| MongoDB Atlas Free | Candidate: free clusters (formerly M0) are available and do not expire, with limited capacity/features. [Official docs](https://www.mongodb.com/docs/atlas/tutorial/deploy-free-tier-cluster/) | Primary MongoDB candidate. Free tier constraints make it appropriate for development and a small pilot; do not promise production availability. |
| Vercel Hobby | Free plan is positioned for personal projects and small-scale apps. [Official docs](https://vercel.com/docs/plans/hobby) | Candidate for static React client. Check current account eligibility and limits; avoid depending on server functions for persistent workloads. |
| Render Docker Web Service (Free) | Render supports building a Dockerfile on a free web-service instance. It has limited RAM, sleeps after inactivity, may restart, and cannot attach a persistent disk. [Official docs](https://render.com/docs/free) | Suitable for a small demo. Uploaded files persist in hosted MongoDB through GridFS, not on Render's disk. |
| Cloudflare Pages | Free Pages limits currently include build concurrency and monthly build quotas. [Official docs](https://developers.cloudflare.com/pages/platform/limits/) | Static client candidate; does not alone provide the Express API, MongoDB, or durable file storage. |
| Groq API | Hosted model inference with a free tier and account-level rate limits. [Official model and limits docs](https://console.groq.com/docs/models) | Used for chat, quiz, and flashcard generation. Store the API key only in the deployed server's secret settings; free quota and uptime are not guaranteed. |

## Provisional direction

For a small demo, use Render's free Docker web service, a hosted MongoDB Atlas cluster with GridFS, and Groq within account quotas. Render sleeps after inactivity; Atlas storage/compute and Groq quotas are limited. Groq is the sole AI provider in the app; quota exhaustion is surfaced as an error and there is no paid fallback.

## User setup requirements

Groq chat/quiz/flashcard generation requires `GROQ_API_KEY` in the server environment. Never put it in client code or source control. Never ask users to provide card details as a hidden prerequisite; document if a chosen provider's signup flow requests billing information.
