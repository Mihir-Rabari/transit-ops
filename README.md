# TransitOps - Smart Transport Operations Platform

TransitOps is a centralized logistics management system designed for transport organizations to orchestrate vehicles, drivers, trips, maintenance logs, fuel logs, and financial expenses.

## Core Services
1. **PostgreSQL 16**: Persistence layer for transactional operations.
2. **Redis 7**: Cache store for KPI dashboard, session tracking (refresh tokens), and brute-force rate limiter.
3. **Backend (Node.js + Express + Prisma + TypeScript)**: Exposes a role-based REST API.
4. **Frontend (Next.js App Router + TailwindCSS + Recharts)**: Premium, responsive dashboard with dark mode and analytics.

---

## Quick Start (Docker Compose)

Ensure you have Docker and Docker Compose installed.

1. **Clone the repository** (if not already inside).
2. **Copy the environment file**:
   ```bash
   cp .env.example .env
   ```
3. **Run the services**:
   ```bash
   docker-compose up --build
   ```
4. **Access the application**:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:4000](http://localhost:4000)

*Note: On first startup, the database is automatically migrated and begins completely empty (no mock or placeholder data). You must register a new user in the web application or using the register API endpoint to start using the system.*
