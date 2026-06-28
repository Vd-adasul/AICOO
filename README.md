# TwinOS: AI-Powered Organizational Memory & Digital Twin Network

TwinOS is a next-generation collaboration network built for team scaling and context preservation. Built on top of the AICOO agentic philosophy, TwinOS creates a **Digital Twin** for every employee to capture their skills, expertise, and collaboration preferences. These twins continuously index project activities (decisions, document context, meeting summaries) to compile an **Organizational Memory** database.

This project is built using:
* **Frontend**: React + TypeScript + Tailwind CSS (Vite SPA) following premium industrial design aesthetics.
* **Backend**: Node.js + Express + Mongoose (ES Module architecture)
* **Databases**: MongoDB Atlas
* **AI Engine**: Gemini 1.5 Flash (for semantic search, A2A negotiation, and intelligence extraction)
* **Coordination Protocol**: AICOO Pulse Protocol

---

## Core Product Features

1. **Digital Twin Profile**: Spawns an active agent twin for every employee containing customized expertise fields, skills, and project involvement.
2. **Expertise Discovery**: Query the team using natural language (e.g. *"Who knows Kubernetes?"*). Returns ranked experts and qualitative reasons.
3. **Reviewer Recommendation**: Suggests architecture and code reviewers, evaluating technical skills, current workloads, and availability records.
4. **Decision Memory**: Logs critical architectural decisions (reasons, context, impacts). Search justification semantically (e.g. *"Why did we reject Redis?"*).
5. **Organizational Search**: Cross-indexes workspaces, logs, and profiles to resolve complex queries.
6. **Project Workspace**: Centralized team hubs managing documents, action items, decisions, and meetings.
7. **Meeting Notes Intelligence**: Pastes transcripts, utilizing Gemini to auto-extract summaries, risks, action items, and store decisions.
8. **AICOO Coordination Monitor**: Simulates Agent-to-Agent (A2A) negotiations, showing dialogue exchanges.
9. **Human Approval Layer**: Recommended reviewer assignments or decisions require explicit human signatures.
10. **Organizational Graph**: Renders nodes mapping connections (People -> Skills, Projects -> Decisions).

---

## Getting Started

### Prerequisites
* Node.js (v18+)
* MongoDB connection URI
* Google Gemini API Key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Vd-adasul/AICOO.git
   cd AICOO
   ```

2. Configure environment variables in `.env` (at root):
   ```env
   MONGODB_URI=your_mongodb_connection_uri
   JWT_SECRET=your_jwt_secret_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. Setup the Backend:
   ```bash
   cd backend
   npm install
   # Run the seeder to populate the 10 synthetic profiles
   npm run seed
   # Start the Express server
   npm run dev
   ```

4. Setup the Frontend:
   ```bash
   cd ../frontend
   npm install
   # Start the Vite development server
   npm run dev
   ```
   Open `http://localhost:3000` to access the console.

5. Quick Hackathon Access:
   * Select any of the employee badges on the login page (Vidhyadhar, Sarika, Anjeet...)
   * Standard demo passcode is: `twinos123`

---

## Verification Pipeline

Verify backend API operations using:
```bash
cd backend
npm run verify
```
This runs the Mongoose test suite to confirm auth tokens, expert discovery, and approvals.
