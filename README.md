# EduSim

EduSim is an interactive physics learning simulation platform designed for students and educators. It combines an AI-powered Physics Tutor, semantic RAG search over textbook PDFs, dynamic formula extraction, and a high-fidelity 2D physics sandbox. By coupling conversational AI with a real-time reactive simulation canvas, EduSim helps learners explore scientific concepts intuitively and test physics scenarios dynamically.

---

## Architecture

The repository is structured into two main components:
*   **[EduSim_API](file:///c:/Users/Mythri%20Banda/Desktop/github%20projects/EduSim/EduSim_API)**: The FastAPI backend engine. It manages the AI tutor socratic conversation, LLM formula extraction with persistent disk caching, FAISS RAG vector retrieval, and physics scene payload synthesis.
*   **[EduSim_frontend](file:///c:/Users/Mythri%20Banda/Desktop/github%20projects/EduSim/EduSim_frontend)**: The client application built using React and TanStack Start, configured to deploy to Cloudflare Workers via Wrangler (`wrangler.jsonc`) using the `nodejs_compat` compatibility flag.

---

## Prerequisites

*   **Python**: Version `3.10` or higher recommended.
*   **Node/Bun**: **Bun** (version `1.0` or higher) is the default package manager for the frontend workspace.
*   **Database**: SQLite by default (automatically initializes `edusim.db` locally). Can be configured to use PostgreSQL or other databases in production via the `DATABASE_URL` environment variable.

---

## Setup & Running Locally

### Backend Setup (`EduSim_API`)

1.  Navigate to the backend directory:
    ```bash
    cd EduSim_API
    ```
2.  Create and activate a Python virtual environment:
    ```bash
    python -m venv venv
    # On Windows:
    .\venv\Scripts\activate
    # On macOS/Linux:
    source venv/bin/activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Configure environment variables:
    *   Copy `.env.example` to `.env`.
    *   Set `JWT_SECRET_KEY` (generate one with `python -c "import secrets; print(secrets.token_hex(32))"`).
    *   Configure `ALLOWED_ORIGINS` (comma-separated list of origins, defaults to `http://localhost:5173`).
    *   Set `OPENROUTER_API_KEY` for LLM operations.
5.  Run the server:
    ```bash
    uvicorn main:app --reload --port 8000
    # Or run the main entry point:
    python main.py
    ```

### Frontend Setup (`EduSim_frontend`)

1.  Navigate to the frontend directory:
    ```bash
    cd EduSim_frontend
    ```
2.  Install dependencies using Bun:
    ```bash
    bun install
    ```
3.  Start the local development server:
    ```bash
    bun run dev
    ```
4.  **Cloudflare Workers Deployment**: The frontend is built on TanStack Start. Production builds are optimized for serverless environments. Deploying to Cloudflare Workers can be done via:
    ```bash
    bun run build
    npx wrangler deploy
    ```

---

## Key API Routes at a Glance

All main API routes are prefixed by `/api`. The following routes are configured in the FastAPI engine:

*   **`/api/auth`**: User registration, JWT logins, email/mobile verification, and OTP/brute-force rate-limiting.
*   **`/api/simulations`**: Controls for listing, exporting, and generating AI synthesized physics scenes.
*   **`/api/rag`**: Semantic search queries over chunked textbook PDFs.
*   **`/api/tutor`**: Socratic chat tutor interface grounded in local RAG context.
*   **`/api/formula`**: Hybrid LLM and formula parser extraction with persistent disk caching.
*   **`/api/questions`**: Dynamic, custom learning check question generation via LLMs.
*   **`/api/persistence`**: User session histories, sandbox replay timelines, and settings persistence.
*   **`/api` (Curriculum)**: Access to multi-class, multi-subject curriculum pathways.
*   **`/api` (Generation / Sandbox)**: Entry point for Matter.js simulation payload synthesis and sandbox ticks.

---

## Project Status & Known Limitations

*   **Heavier ML Dependencies**: The backend requires libraries like `torch`, `sentence-transformers` (`all-MiniLM-L6-v2`), and `faiss-cpu` to serve RAG search and AI tutor completions. Consequently, the initial dependency install size is relatively heavy.
*   **Database Migrations**: Database schema modifications are managed via Alembic. Run `alembic upgrade head` in the backend directory to apply the latest schema changes (such as password reset and OTP lockout columns) before starting the server.

---

## License

This project is licensed under the [MIT License](file:///c:/Users/Mythri%20Banda/Desktop/github%20projects/EduSim/EduSim_API/README.md#L86-L88).
