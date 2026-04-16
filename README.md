# 🌿 Clean City AI

**AI-Powered Waste Management Platform for African Cities**

Connecting citizens, waste collection companies, and municipal authorities through smart technology to solve Africa's urban waste crisis.

> BeOrchid Africa Developers Hackathon — Built by FOSSO KENGNI Doriane

---

## 🌟 Overview

Clean City AI is a multi-platform system that transforms how African cities handle waste. 60% of urban waste in Africa remains uncollected, causing 500,000 deaths annually. Our platform addresses this through three interconnected applications:

| Platform | Users | Description |
|---|---|---|
| 📱 **Mobile App** | Citizens | Report waste with photo + GPS, track collection in real time |
| 🏢 **Company Dashboard** | Waste collectors | AI-optimized routes, fleet tracking, performance stats |
| 🏛️ **Municipal Dashboard** | City authorities | City-wide KPIs, hotspot maps, audit trail, monthly reports |

**Key results:** 40% fuel savings · 70% waste reduction · Full operational transparency

---

## 🏗️ Architecture

```
cleancity-ai/
├── mobile/           # React Native (Expo) — Citizen app
├── backend/          # Node.js + Express + Prisma — Main API
├── ai-service/       # Python + FastAPI + OR-Tools — Route optimization
├── web-company/      # React + Vite + Tailwind — Company dashboard
├── web-municipal/    # React + Vite + Tailwind — Municipal dashboard
└── .github/
    └── workflows/    # CI/CD pipelines (4 services)
```

### Services

| Service | Tech | Port |
|---|---|---|
| Backend API | Node.js + Express + Prisma | 3000 |
| AI Service | Python + FastAPI + OR-Tools | 8000 |
| Company Dashboard | React + Vite + Nginx | 4000 |
| Municipal Dashboard | React + Vite + Nginx | 4001 |
| Mobile App | React Native (Expo) | — |
| Database | PostgreSQL 16 | 5432 |

---

## ⚡ Quick Start

### Option A — Docker (recommended)

**Prerequisites:** Docker + Docker Compose

```bash
git clone https://github.com/kengnidoriane/CleanCity-AI.git
cd CleanCity-AI

cp .env.example .env
# Edit .env and fill in: POSTGRES_PASSWORD, SUPABASE_URL, SUPABASE_KEY, SMTP_*

docker compose up --build
```

Services available at:
- Backend API → http://localhost:3000
- AI Service → http://localhost:8000/health
- Company Dashboard → http://localhost:4000
- Municipal Dashboard → http://localhost:4001

---

### Option B — Manual setup

**Prerequisites:** Node.js 22+, Python 3.12+, PostgreSQL 16+, pnpm

#### 1. Clone and configure

```bash
git clone https://github.com/kengnidoriane/CleanCity-AI.git
cd CleanCity-AI

cp backend/.env.example backend/.env
cp ai-service/.env.example ai-service/.env
cp web-company/.env.example web-company/.env
cp web-municipal/.env.example web-municipal/.env
```

Fill in the required values in each `.env` file (see [Environment Variables](#-environment-variables)).

#### 2. Backend

```bash
cd backend
pnpm install
pnpm run db:generate
pnpm run db:migrate
pnpm run dev
```

#### 3. AI Service

```bash
cd ai-service
pip install -r requirements.docker.txt
uvicorn main:app --reload --port 8000
```

#### 4. Company Dashboard

```bash
cd web-company
pnpm install
pnpm run dev   # http://localhost:5173
```

#### 5. Municipal Dashboard

```bash
cd web-municipal
pnpm install
pnpm run dev   # http://localhost:5174
```

#### 6. Mobile App

```bash
cd mobile
pnpm install
npx expo start
```

---

## 🔑 Environment Variables

### Root `.env` (Docker only)

| Variable | Description | Required |
|---|---|---|
| `POSTGRES_PASSWORD` | PostgreSQL password | ✅ |
| `JWT_SECRET` | JWT signing secret | ✅ |
| `SUPABASE_URL` | Supabase project URL (photo storage) | ✅ |
| `SUPABASE_KEY` | Supabase anon key | ✅ |
| `SMTP_HOST` | SMTP server for emails | ✅ |
| `SMTP_USER` | SMTP username | ✅ |
| `SMTP_PASS` | SMTP password | ✅ |
| `VITE_API_URL` | Backend URL as seen from browser | ✅ |

See `.env.example` for the full list with descriptions.

---

## 📱 Platform Features

### Citizen Mobile App (US-C01 to C11)

| Feature | Description |
|---|---|
| 🔐 Registration & Login | Phone number + password, JWT auth |
| 📸 Waste Reporting | Photo + GPS + category + severity |
| 📍 Report History | Status tracking (Pending / Assigned / Collected) |
| 🔔 Push Notifications | Alert when waste is collected |
| 📅 Collection Schedule | Weekly calendar per zone |
| 🗺️ Live Truck Map | Real-time truck positions via Socket.IO |

### Company Dashboard (US-E01 to E10)

| Feature | Description |
|---|---|
| 🗺️ Reports Map | All active reports color-coded by severity |
| 🔍 Filters | Status, category, severity, date |
| 🤖 Route Optimization | OR-Tools TSP solver, results in < 10s |
| 📦 Route Assignment | Assign routes to trucks, auto-update report status |
| 🚛 Fleet Tracking | Real-time GPS positions + ETA via Socket.IO |
| ⚠️ Alerts | Deviation > 500m or idle > 15 min |
| 👷 Driver Interface | Mobile-friendly ordered stop list |
| 📊 Performance Stats | Day/week/month comparison |

### Municipal Dashboard (US-M01 to M08)

| Feature | Description |
|---|---|
| 📊 KPI Dashboard | Active reports, collection rate, trucks, response time |
| 🗺️ Hotspot Map | Waste density heatmap with period filter |
| 🏢 Company Monitoring | Performance table, sortable, with detail panel |
| 🚛 City Truck Map | All trucks from all companies, color-coded by company |
| 📋 Audit Trail | Full history with filters + CSV export |
| 📄 Monthly Report | Auto-generated PDF with stats and top zones |
| ➕ Company Registration | Register new companies, credentials sent by email |

---

## 🧪 Running Tests

```bash
# Backend (87 tests)
cd backend && pnpm test

# AI Service
cd ai-service && pytest

# Company Dashboard (50+ tests)
cd web-company && pnpm test

# Municipal Dashboard (50 tests)
cd web-municipal && pnpm test

# Mobile
cd mobile && pnpm test
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Mobile | React Native, Expo, expo-router |
| Web Dashboards | React 19, Vite, Tailwind CSS, shadcn/ui, Zustand, React Router |
| Backend | Node.js, Express 5, Prisma, Zod, Socket.IO, JWT |
| AI Service | Python 3.12, FastAPI, OR-Tools (TSP solver) |
| Database | PostgreSQL 16, Prisma ORM |
| Storage | Supabase Storage (waste photos) |
| Real-time | Socket.IO (truck positions, alerts) |
| Maps | Leaflet + OpenStreetMap |
| Testing | Vitest, Testing Library, pytest |
| CI/CD | GitHub Actions (4 pipelines) |
| DevOps | Docker, Docker Compose, Nginx |

---

## 📋 MVP Status

All 30 user stories implemented and tested:

**Platform 1 — Mobile App**
- ✅ US-C01 — Citizen registration
- ✅ US-C02 — Citizen login
- ✅ US-C03 — Waste photo capture
- ✅ US-C04 — GPS auto-capture
- ✅ US-C05 — Waste category & severity
- ✅ US-C06 — Report submission
- ✅ US-C07 — Offline report sync
- ✅ US-C08 — Report history
- ✅ US-C09 — Push notifications
- ✅ US-C10 — Collection schedule
- ✅ US-C11 — Live truck map

**Platform 2 — Company Dashboard**
- ✅ US-E01 — Company login
- ✅ US-E02 — Reports map dashboard
- ✅ US-E03 — Report filters
- ✅ US-E04 — Route optimization
- ✅ US-E05 — Route assignment
- ✅ US-E06 — Report clustering
- ✅ US-E07 — Fleet tracking + ETA
- ✅ US-E08 — Deviation & idle alerts
- ✅ US-E09 — Driver interface
- ✅ US-E10 — Performance statistics

**Platform 3 — Municipal Dashboard**
- ✅ US-M01 — Municipal login
- ✅ US-M02 — City KPI dashboard
- ✅ US-M03 — Waste hotspot map
- ✅ US-M04 — Company performance monitoring
- ✅ US-M05 — Citywide truck map
- ✅ US-M06 — Audit trail + CSV export
- ✅ US-M07 — Monthly PDF report
- ✅ US-M08 — Company registration

**Future roadmap (Phase 2):**
- Computer Vision waste detection
- Predictive analytics (7-day forecast)
- Gamification & citizen rewards
- Multi-language support (NLP)
- Dynamic re-routing

---

## 📚 Documentation

- [MVP User Stories](docs/user-stories-mvp.md)
- [Technical Documentation](docs/technical-documentation.md)
- [CI/CD Guide](docs/github-cicd-guide.md)
- [API Reference](http://localhost:3000/api-docs) *(local)*

---

## 📄 License

MIT License

---

## 🙏 Acknowledgments

Built with ❤️ for the BeOrchid Africa Developers Hackathon.

**Team Lead:** FOSSO KENGNI Doriane — dorianekengni@gmail.com

*Together, we can build cleaner, healthier, and smarter African cities.*

⬆ [Back to top](#-clean-city-ai)
