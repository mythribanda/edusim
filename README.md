# EduSim-Hub: Intelligent Adaptive STEM Education & Simulation Ecosystem

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14.2+-000000.svg?logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Ollama](https://img.shields.io/badge/Ollama-Local_Gemma_3-white.svg?logo=ollama&logoColor=black)](https://ollama.ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📌 Executive Summary

**EduSim-Hub** is an end-to-end, intelligent STEM education ecosystem engineered to bridge theoretical physics and active student mastery through interactive simulation sandboxes and context-aware pedagogical AI. The platform unifies a high-performance **FastAPI** backend with a **Vite/React** Student Portal and a **Next.js 14** Teacher Operations Portal. Powered by a hybrid AI router that prioritizes edge inference via local **Ollama (Gemma 3 4B)** with zero API cost before gracefully failing over to cloud LLMs (**OpenRouter**), EduSim-Hub features Socratic dialogue scaffolding, deterministic multi-dimensional student topic mastery tracking (NCERT/CBSE aligned), live classroom activity telemetry, and end-to-end assignment lifecycle management with pure SQL real-time analytics.

---

## 🏛️ System Architecture

```text
+===================================================================================================+
|                                      CLIENT APPLICATION LAYER                                     |
+================================================+==================================================+
|  STUDENT PORTAL (Port 8080)                    |  TEACHER & ADMIN PORTAL (Port 3000)              |
|  - React 18 + Vite SPA                         |  - Next.js 14 App Router                         |
|  - TanStack Router & State Management          |  - Live Class Telemetry (15s Polling)            |
|  - Matter.js 2D Physics Canvas Sandbox         |  - Pure SVG Analytics Engine (Zero Dependencies) |
|  - Socratic AI Chat Interface & MathJax/KaTeX  |  - Assignment Builder & Multi-Student Grading UI |
+------------------------------------------------+--------------------------------------------------+
                                        │                                  │
                                        ▼ (RESTful JSON / Bearer JWT)       ▼
+===================================================================================================+
|                              FASTAPI GATEWAY & BUSINESS LAYER (Port 8001)                         |
+===================================================================================================+
|  SECURITY & ACCESS CONTROL:                                                                       |
|  - JWT Authentication (>=32-byte cryptographic secret) & Google OAuth2                            |
|  - Role-Based Access Control (Admin, Educator, Student) & In-Memory/DB IDOR Protection            |
+---------------------------------------------------------------------------------------------------+
|  CORE APPLICATION MODULES:                                                                        |
|  ┌─────────────────────────┐  ┌──────────────────────────┐  ┌──────────────────────────────────┐  |
|  │ Context-Aware Tutor     │  │ Pure SQL Analytics       │  │ Assignment Management            │  |
|  │ - Socratic system prompt│  │ - Deterministic metrics  │  │ - Topic linking & due dates      │  |
|  │ - Dynamic mastery inject│  │ - Topic breakdown bars   │  │ - Multi-student submissions      │  |
|  │ - FAISS textbook RAG    │  │ - At-risk identification │  │ - Feedback & scoring pipeline    │  |
|  └────────────┬────────────┘  └─────────────┬────────────┘  └─────────────────┬────────────────┘  |
|               │                             │                                 │                   |
|  ┌────────────▼────────────┐  ┌─────────────▼────────────┐  ┌─────────────────▼────────────────┐  |
|  │ Cached Question Engine  │  │ Sandbox Simulation State │  │ Live Activity Stream             │  |
|  │ - DB exact-match cache  │  │ - AST Math Expression    │  │ - Session events capture         │  |
|  │ - Shortfall AI fallback │  │   Evaluator (Safe No-Eval│  │ - Formatted IST timestamp feed   │  |
|  └────────────┬────────────┘  └──────────────────────────┘  └──────────────────────────────────┘  |
+===============│===================================================================================+
                ▼
+===================================================================================================+
|                                    HYBRID AI INFERENCE ROUTER                                     |
+===================================================================================================+
|                                    Is USE_CLOUD_AI=true ?                                         |
|                                       /              \                                            |
|                          (Yes / Bypass)              (No - Default)                               |
|                                     /                  \                                         |
|                                    │             1. Try Local Ollama                              |
|                                    │                (http://localhost:11434 / Gemma 3 4B)         |
|                                    │                [10s Timeout / 0 API Cost]                    |
|                                    │                         │                                    |
|                                    │                 (Timeout or Error)                           |
|                                    │                         │                                    |
|                                    ▼                         ▼                                    |
|                         2. Cloud Fallback: OpenRouter Provider API                                |
|                            (DeepSeek-R1 / Claude / GPT-4o-Mini via HTTPS)                         |
+===================================================================================================+
                │                                                          │
                ▼                                                          ▼
+==============================================+ +==================================================+
|  DATA STORAGE & PERSISTENCE LAYER            | |  SEMANTIC KNOWLEDGE BASE                         |
+==============================================+ +==================================================+
|  - PostgreSQL 15 / Supabase                  | |  - FAISS Dense Vector Index                      |
|  - SQLAlchemy 2.0 ORM + Alembic Migrations   | |  - High-School Physics NCERT Textbook Chunks     |
|  - Tables: Users, Assignments, Submissions,  | |  - Strict < 800 Token Context Injection Window   |
|    Mastery, SessionEvents, CachedQuestions  | |                                                  |
+----------------------------------------------+ +--------------------------------------------------+
```

---

## 🛠️ Tech Stack Overview

| Domain | Technology / Library | Purpose & Architectural Justification |
|---|---|---|
| **Backend Framework** | **FastAPI** (Python 3.11+) | Asynchronous, high-throughput REST API with native Pydantic data validation and OpenAPI auto-docs. |
| **Database & ORM** | **PostgreSQL 15** / **SQLAlchemy 2.0** / **Alembic** | ACID-compliant relational data modeling, type-safe query generation, and declarative schema migrations. |
| **Authentication** | **PyJWT** (HMAC-SHA256) / **Google OAuth2** | Stateless Bearer token verification, strict role-based access control, and IDOR session verification. |
| **Local LLM Engine** | **Ollama** (`gemma3:4b`) | Edge inference running locally for low-latency Socratic responses and question generation at $0 operating cost. |
| **Cloud LLM Gateway** | **OpenRouter API** (`httpx`) | Resilient cloud fallback handling LLM requests if local Ollama reaches timeout or is offline. |
| **Vector Search / RAG** | **FAISS** + HuggingFace Embeddings | In-memory semantic similarity search retrieving physics textbook passages within strict token budgets. |
| **Student Web App** | **React 18** + **Vite** + **TanStack Router** | Blazing-fast SPA for student interactive sandboxes, chat sessions, and assignment submissions. |
| **Teacher Web App** | **Next.js 14** (App Router) + **Tailwind CSS** | Server and client-rendered portal with live telemetry, assignment workflows, and zero-dependency SVG analytics. |
| **Physics Simulation** | **Matter.js** + Safe AST Evaluator | 2D rigid-body kinematics engine paired with a sandbox AST expression evaluator preventing RCE vulnerabilities. |

---

## 🌐 Network Ports & Service Map

| Service | Port | URL | Role / Functionality |
|---|:---:|---|---|
| **FastAPI Backend** | `8001` | [http://localhost:8001](http://localhost:8001) | Primary REST API, WebSocket/SSE endpoints, AI router |
| **Swagger Interactive Docs** | `8001` | [http://localhost:8001/docs](http://localhost:8001/docs) | Interactive OpenAPI testing console |
| **Teacher Portal** | `3000` | [http://localhost:3000](http://localhost:3000) | Teacher dashboard, live telemetry, grading & analytics |
| **Student Portal** | `8080` | [http://localhost:8080](http://localhost:8080) | Student learning hub, simulations, tutor & assignments |
| **Local Ollama Server** | `11434` | [http://localhost:11434](http://localhost:11434) | Local LLM inference server (Gemma 3 4B) |
| **PostgreSQL Database** | `5432` | `postgresql://localhost:5432` | Primary relational database storage |

---

## ⚙️ Environment Variables Reference

### 1. Backend Service (`services/api/.env` and root `.env`)

| Variable | Type | Default / Required | Description |
|---|:---:|:---:|---|
| `DATABASE_URL` | String | **Required** | PostgreSQL connection string (`postgresql://user:pass@host:5432/dbname`). |
| `JWT_SECRET` / `JWT_SECRET_KEY` | String | **Required ($\ge 32$ chars)** | Cryptographic key used to sign and verify user authentication tokens. |
| `USE_CLOUD_AI` | Boolean | `false` | When set to `true`, forces the AI Router to bypass local Ollama and directly use OpenRouter. |
| `OLLAMA_BASE_URL` | URL | `http://localhost:11434` | Endpoint where the local Ollama instance is hosted. |
| `OLLAMA_MODEL` | String | `gemma3:4b` | Default local LLM model tag executed by Ollama. |
| `OPENROUTER_API_KEY` | String | Optional (Required if fallback/cloud used) | API key for OpenRouter cloud LLMs. |
| `SUPABASE_URL` | URL | Optional | Supabase project URL (if utilizing Supabase Auth / Storage). |
| `SUPABASE_KEY` | String | Optional | Supabase service / public API key. |
| `FRONTEND_URL` | URL | `http://localhost:8080` | Allowed CORS origin for the Student Web App. |
| `TEACHER_PORTAL_URL` | URL | `http://localhost:3000` | Allowed CORS origin for the Teacher Portal. |

### 2. Student Portal (`apps/web/.env`)

| Variable | Type | Default | Description |
|---|:---:|:---:|---|
| `VITE_API_URL` | URL | `http://localhost:8001` | Backend API gateway base URL. |

### 3. Teacher Portal (`apps/teacher-portal/.env`)

| Variable | Type | Default | Description |
|---|:---:|:---:|---|
| `NEXT_PUBLIC_API_URL` | URL | `http://localhost:8001` | Backend API gateway base URL. |

---

## 🚀 Complete Setup & Installation Guide

### Prerequisites
- **Python**: Version 3.10 or 3.11+ installed
- **Node.js**: Version 18.0+ or 20.0+ with `npm`
- **PostgreSQL**: Version 14+ (Local service or cloud Supabase)
- **Ollama**: (Optional for local AI) [https://ollama.ai](https://ollama.ai)

---

### Step 1: Clone the Monorepo
```bash
git clone https://github.com/mythribanda/edusim-hub.git
cd edusim-hub
```

---

### Step 2: Configure Ollama (Local AI Engine)
1. Download and start the Ollama daemon:
   ```bash
   ollama serve
   ```
2. In a separate terminal, pull the recommended lightweight physics reasoning model:
   ```bash
   ollama run gemma3:4b
   ```
   *(To run without Ollama, refer to the [Running Without Ollama](#-running-without-ollama-cloud-only-mode) section below).*

---

### Step 3: Backend Setup (`services/api`)
1. Navigate to the backend directory and create a Python virtual environment:
   ```bash
   cd services/api
   python -m venv venv
   ```
2. Activate the virtual environment:
   - **Windows (PowerShell/CMD):**
     ```powershell
     .\venv\Scripts\activate
     ```
   - **macOS / Linux:**
     ```bash
     source venv/bin/activate
     ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure your `.env` file:
   ```bash
   cp .env.example .env
   ```
   *Ensure `DATABASE_URL` is set to your PostgreSQL database and `JWT_SECRET` has at least 32 characters.*
5. Run database migrations and seed curriculum:
   ```bash
   alembic upgrade head
   ```
6. Start the FastAPI backend server:
   ```bash
   uvicorn main:app --reload --port 8001 --host 0.0.0.0
   ```
   *Verify backend is live at: [http://localhost:8001/docs](http://localhost:8001/docs)*

---

### Step 4: Student Portal Setup (`apps/web`)
1. In a new terminal window:
   ```bash
   cd apps/web
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev -- --port 8080
   ```
   *Access the Student Portal at: [http://localhost:8080](http://localhost:8080)*

---

### Step 5: Teacher Portal Setup (`apps/teacher-portal`)
1. In a new terminal window:
   ```bash
   cd apps/teacher-portal
   npm install
   ```
2. Start the Next.js development server:
   ```bash
   npm run dev -- -p 3000
   ```
   *Access the Teacher Portal at: [http://localhost:3000](http://localhost:3000)*

---

## ☁️ Running Without Ollama (Cloud-Only Mode)

If you are presenting or running on a machine without a local GPU/Ollama setup, you can switch the entire platform to cloud AI inference in seconds:

1. Open your backend environment file (`services/api/.env`).
2. Add or toggle the following flags:
   ```dotenv
   USE_CLOUD_AI=true
   OPENROUTER_API_KEY=sk-or-v1-your-actual-openrouter-api-key-here
   ```
3. Restart the FastAPI backend.

**What happens behind the scenes:**
- The AI router detects `USE_CLOUD_AI=true` and instantly bypasses local HTTP attempts to `http://localhost:11434`.
- All Socratic tutor queries, dynamic MCQs, and concept explanations route directly to cloud LLMs via OpenRouter with zero startup delay.

---

## ⏱️ 5-Minute Evaluator Demo Walkthrough

Follow this step-by-step sequence to demonstrate the platform's core closed-loop feedback cycle to evaluators in 5 minutes:

### 🔹 Step 1: Student Explores Simulation & Asks Socratic Tutor (1 min)
1. Open the **Student Portal** at [http://localhost:8080](http://localhost:8080) and log in as a student (e.g. `arjun@edusim.com`).
2. Navigate to the **Physics Sandbox** -> Select **"Projectile Motion & Newton's Laws"**.
3. Launch the simulation, modify the launch angle/velocity sliders, and observe real-time kinematics.
4. Click **"Ask AI Tutor"** and enter:
   > *"Why does the projectile travel farthest at a 45 degree angle?"*
5. **Key Observation:** The Socratic AI Tutor does **not** give away the direct answer; it responds with a guiding question calibrated to the student's mastery level and references textbook theory chunks.

---

### 🔹 Step 2: Teacher Monitors Live Classroom Telemetry (1 min)
1. Open the **Teacher Portal** at [http://localhost:3000](http://localhost:3000) and log in as an educator (e.g. `teacher@edusim.com`).
2. Open **Class 10 Physics** -> Observe the **Live Activity Stream** right sidebar.
3. **Key Observation:** The sidebar automatically polls (`GET /classes/{classId}/recent-activity` every 15s) and displays the student's live action:
   - *"Arjun asked AI tutor about projectile motion (12s ago)"*
4. Click on the **Analytics Tab** ([/classes/[classId]/analytics](http://localhost:3000/dashboard/classes/1/analytics)).
5. **Key Observation:** View the deterministic pure SQL stat cards, topic breakdown charts (rendered in custom zero-dependency SVG), and the real-time **At-Risk Students Table** with a **"Send Reminder"** notification trigger.

---

### 🔹 Step 3: Teacher Creates a Class Assignment (1 min)
1. In the Teacher Portal, navigate to **Assignments** tab -> Click **"Create Assignment"**.
2. Fill in the modal:
   - **Title:** *Newton's Laws & Momentum Quiz*
   - **Topic:** *Newton's Laws of Motion (Class 10)*
   - **Due Date:** *Select next week's date*
   - **Max Score:** `100`
3. Click **"Publish Assignment"** (`POST /assignments`).

---

### 🔹 Step 4: Student Completes & Submits Assignment (1 min)
1. Switch back to the **Student Portal** ([http://localhost:8080/assignments](http://localhost:8080/assignments)).
2. Observe the newly assigned *Newton's Laws & Momentum Quiz* under **Pending Tasks**.
3. Click **"Start Assignment"** -> The AI Question Generator serves questions instantly from DB cache (or generates shortfalls on the fly).
4. Answer the questions and click **"Submit"** (`POST /assignments/{id}/submit`).

---

### 🔹 Step 5: Teacher Grades and Returns Feedback (1 min)
1. In the **Teacher Portal**, click the assignment -> view the **Submissions Table**.
2. Click **"Grade"** next to Arjun's submission.
3. Enter score: `95` and feedback: *"Excellent grasp of action-reaction pairs. Review centripetal force."*
4. Click **"Save Grade"** (`PATCH /assignments/{id}/submissions/{id}/grade`).
5. **Outcome:** Student profile mastery recalculates automatically, and the student receives graded feedback instantly.

---

## 🔒 Security & Defense-in-Depth Highlights

During recent security audits, the backend architecture was hardened against major OWASP categories:
1. **Zero Unsafe `eval()` Executions:** Replaced arbitrary Python expression evaluation in physics states with a sandboxed, recursive Abstract Syntax Tree (`ast.parse`) mathematical parser whitelist.
2. **Strict Cryptographic JWT Entropy:** System enforces minimum 32-character high-entropy secret keys during startup with automatic termination on placeholder detection.
3. **IDOR Defense on Sandbox & Sessions:** In-memory tracking and database ownership validation on all sandbox runtimes and historical sessions.
4. **Non-Blocking Async Event Loop:** Replaced synchronous thread locks with `asyncio.Lock()` across all stateful controllers, eliminating API stalls under concurrent loads.
5. **Role-Based Access Control (RBAC):** Admin and Educator token verification for all curriculum mutations and administrative database operations.

---

## 📄 License & Attribution

Distributed under the **MIT License**. Created by Mythri Banda as an advanced, adaptive STEM learning ecosystem.
