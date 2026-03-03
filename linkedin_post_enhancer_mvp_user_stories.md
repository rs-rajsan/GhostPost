# LinkedIn Post Enhancer --- MVP User Stories

## Epic 1: Core Post Enhancement

### US-001: Paste Raw Thoughts

**As a** LinkedIn user\
**I want to** paste my messy thoughts into a large input box\
**So that** I can quickly start improving my post

**Acceptance Criteria** - Large text input field is visible on landing -
User can paste or type freely - Supports at least 5,000 characters - No
formatting errors on paste

### US-002: Enhance Post with One Click

**As a** LinkedIn user\
**I want to** click a single "Enhance Post" button\
**So that** my raw thoughts become a polished LinkedIn post

**Acceptance Criteria** - Primary CTA button is clearly visible -
Processing starts within 1 second - Enhanced post is returned within
acceptable time (\<10 seconds typical) - Output includes: hook,
structured body, engagement question

### US-003: Tone Selection

**As a** LinkedIn user\
**I want to** choose the tone of my post\
**So that** the output matches my voice

**Supported Tones** - Professional - Conversational - Storytelling -
Bold/Contrarian

**Acceptance Criteria** - Tone selector visible before generation -
Selected tone influences output style - Default tone is Professional

------------------------------------------------------------------------

## Epic 2: Output Quality & Feedback

### US-004: Hook Strength Score

**As a** LinkedIn creator\
**I want to** see a hook strength score\
**So that** I know how engaging my opening is

**Acceptance Criteria** - Score displayed from 1--10 - One short
improvement tip shown - Score updates on regenerate - Score appears with
output

### US-005: Hashtag Suggestions

**As a** LinkedIn user\
**I want to** receive relevant hashtags\
**So that** my post has better discoverability

**Acceptance Criteria** - System suggests up to 5 hashtags - Hashtags
are relevant to post topic - Hashtags are copyable - No duplicate
hashtags

------------------------------------------------------------------------

## Epic 3: Editing & Iteration

### US-006: Regenerate Output

**As a** LinkedIn user\
**I want to** regenerate the post\
**So that** I can explore better variations

**Acceptance Criteria** - Regenerate button is visible after first
output - New output differs meaningfully from previous - Tone selection
persists on regenerate - Hook score refreshes

### US-007: Copy Enhanced Post

**As a** LinkedIn user\
**I want to** copy the enhanced post with one click\
**So that** I can quickly paste it into LinkedIn

**Acceptance Criteria** - One-click copy button - Success confirmation
shown - Copies full formatted post - Works on desktop browsers

------------------------------------------------------------------------

## Epic 4: Basic Access (Optional but Recommended)

### US-008: Lightweight Authentication

**As a** returning user\
**I want to** sign in quickly\
**So that** I can reuse the tool easily

**Acceptance Criteria** - Support Google login OR magic link email -
Login completes in under 10 seconds - User session persists - Anonymous
usage allowed (if enabled)

------------------------------------------------------------------------

# MVP Definition of Done

The MVP is complete when:

-   Users can paste messy thoughts
-   Users can enhance with one click
-   Users can select tone
-   Users receive structured post + hook + question + hashtags
-   Users see hook score
-   Users can regenerate
-   Users can copy output
-   Page loads under 3 seconds
-   End-to-end flow works on desktop

------------------------------------------------------------------------

# Post-MVP (Explicitly Out of Scope)

The following are **intentionally excluded** from MVP:

-   LinkedIn direct integration
-   Scheduling
-   Analytics dashboard
-   Multiple post variants
-   Style learning engine
-   Content calendar
-   Team features
-   Chrome extension
-   Mobile app
-   Carousel generator

These belong to later phases.

# Tech Stack

Good choice — **React + Node + Express** is perfect for a fast AI micro-SaaS. It’s mature, cheap to host, and easy to extend later.

I’ll give you a **production-sane stack** that optimizes for:

* ⚡ speed to MVP
* 🧩 easy extensibility
* 💰 low infra cost
* 🚀 scale later without rewrite

---

# 🧠 High-Level Architecture

**Frontend (React)**
⬇
**API Layer (Node + Express)**
⬇
**LLM Service Layer**
⬇
**Database (lightweight initially)**

Design rule:

> Keep AI logic server-side so you can iterate prompts without redeploying frontend.

---

# ✅ Recommended Tech Stack (MVP-Friendly)

## 🎨 Frontend

**Framework:** React (with Vite or Next.js — see recommendation below)

### Core

* React 18+
* TypeScript (strongly recommended)
* Vite (fastest for MVP) 
* Tailwind CSS
* React Query (TanStack Query)

### UI

* shadcn/ui (excellent for SaaS feel)
* Lucide icons

---

## ⭐ My Brutal Recommendation

Since this is an app (not content site):

👉 **Use Vite + React for MVP**

Why:

* faster setup
* less complexity
* faster builds
* cheaper hosting
* no SSR needed initially

You can migrate later if needed.

---

# ⚙️ Backend

**Runtime:** Node.js 18+
**Framework:** Express.js
**Language:** TypeScript (recommended)

---

## Backend Core Libraries

* express
* cors
* dotenv
* zod (validation — very important)
* pino (logging)
* express-rate-limit
* helmet (security)

---

## 🧠 AI Layer

You have two good approaches.

### Option A (Fastest MVP)

Direct API calls to LLM provider:

* OpenAI SDK (most common)
* or other LLM providers

Pros:

* fastest to ship
* minimal infra
* cheap

Cons:

* less abstraction

👉 **For MVP: choose this.**

---

### Option B (Later)

Create abstraction layer:

* prompt templates
* model router
* scoring engine

But don’t overbuild yet.

---

# 🗄️ Database

## MVP Recommendation: Start Simple

You likely only need:

* user (optional)
* usage logs (optional)
* tone preference (later)

### Best choices

**Option 1 (fastest):**

* PostgreSQL + Prisma

**Option 2 (ultra simple early):**

* Supabase Postgres

---

## My recommendation

👉 **PostgreSQL + Prisma**

Why:

* type-safe
* scalable
* widely supported
* easy migrations

---

# 🔐 Authentication

For MVP speed:

### Best options

* Clerk (fastest)
* Supabase Auth
* Auth.js (NextAuth) — if using Next

---

## My pick for your stack

👉 **Clerk or Supabase Auth**

Fastest time to value.

---

# 🚀 Deployment

## Frontend

Best options:

* Vercel
* Netlify
* Cloudflare Pages

👉 **Pick: Vercel**

---

## Backend

Best options:

* Railway (VERY good for MVP)
* Render
* Fly.io

👉 **Pick: Railway** (sweet spot for Node apps)

---

## Database hosting

* Supabase (easy)
* Neon (excellent)
* Railway Postgres

👉 **Pick: Neon or Supabase**

---

# 🧩 Suggested Folder Structure

## Frontend

```
/src
  /components
  /features
  /hooks
  /lib
  /pages
  /services
```

---

## Backend

```
/src
  /routes
  /controllers
  /services
      llm.service.ts
      scoring.service.ts
  /middleware
  /utils
  /config
```

Keep AI logic in `/services`.

---

# 🔌 Key API Endpoints (MVP)

You only need **one main endpoint**.

### POST /api/enhance

Request:

```json
{
  "text": "raw thought dump",
  "tone": "professional"
}
```

Response:

```json
{
  "enhancedPost": "...",
  "hookScore": 7,
  "hookTip": "...",
  "hashtags": ["#ai", "#linkedin"]
}
```

Keep it dead simple.

---

# ⚡ Performance Considerations (Do This Early)

These matter more than people think.

### Add immediately

* request timeout handling
* loading skeleton in UI
* streaming response (Phase 2)
* basic rate limiting
* prompt caching (later)

---

# 🧪 Observability (Lightweight MVP)

Don’t skip completely.

Add:

* basic request logging (pino)
* error tracking (Sentry later)
* simple usage counter

---

# 🚀 Phase 2 Tech Additions

Only after traction.

* Redis (caching, rate limiting)
* Queue (BullMQ)
* Vector DB (for style memory)
* Feature flags
* A/B testing

---

# 🧭 Phase 3 (If You Scale)

* Microservices (maybe)
* Model routing
* Fine-tuning pipeline
* Real analytics pipeline
* Multi-tenant architecture

---

# 🧠 Final Recommended Stack (Copy-Paste Ready)

**Frontend**

* React + TypeScript
* Vite
* Tailwind
* shadcn/ui
* React Query

**Backend**

* Node.js
* Express
* TypeScript
* Zod
* Pino
* Helmet
* Rate limiter

**AI**

* OpenAI SDK (direct)

**Database**

* PostgreSQL
* Prisma

**Auth**

No Auth for MVP.

**Hosting**

I want to run it local Docker container.

---

Make sure the plan using best practices, design patterns,  SOLID and DRY Principles as applicable. Make sure the plan uses existing logic as possible. 
Always use centralized logging framework with request tracing. Do not change the port numbers at any cost instead let the user know of any conflicts.
