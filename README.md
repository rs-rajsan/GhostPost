# LinkEnhance AI 🚀

LinkEnhance AI is a premium SaaS tool designed to turn your raw, messy thoughts into high-performing LinkedIn posts.

## 🌟 Features
- **One-Click Enhancement**: Transform rough drafts into polished content.
- **Tone Selection**: Choose from Professional, Conversational, Storytelling, or Bold.
- **Hook Scoring**: Get feedback on your opening line from 1-10.
- **Engagement Optimized**: Structured for readability with whitespace and bullet points.
- **Hashtag Suggestions**: Relevant tags automatically selected.

## 🛠️ Stack
- **Frontend**: React, Vite, TypeScript, Tailwind CSS, shadcn/ui.
- **Backend**: Node.js, Express, TypeScript, Zod, Pino.
- **AI**: OpenAI GPT-4o Integration.
- **DevOps**: Docker & Docker Compose (Ready for local scaling).

## 🚀 Getting Started

### 1. Prerequisite Fix (Windows PowerShell)
If you see an error about `npm.ps1` not being loaded, run this in your terminal:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 2. Set Up Environment Variables
Update the `backend/.env` with your OpenAI API Key:
```env
OPENAI_API_KEY=your_key_here
```

### 3. Run Locally (Option A: Direct)
**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### 4. Run Locally (Option B: Docker)
If you have Docker installed:
```bash
docker compose up --build
```

## 🏗️ Folder Structure
- `/frontend`: React application.
- `/backend`: Node.js API and AI logic.
- `/docker`: Infrastructure orchestration.

## 🤝 Project Status
LinkEnhance AI is currently in **MVP Phase**.
- [x] Core Enhancement Logic
- [x] Premium Dashboard UI
- [x] Hook Strength Engine
- [x] Multi-tone support
