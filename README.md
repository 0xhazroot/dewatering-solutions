<div align="center">

# 💧 Dewatering Solutions Platform

### Enterprise-Grade Industrial Services Management System

[![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Google Cloud](https://img.shields.io/badge/Google_Cloud-Deploy-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)](https://cloud.google.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)](#license)

**A full-stack web platform built for an industrial dewatering company specializing in solid-liquid separation solutions for the mining and industrial sectors.**

[Features](#-features) • [Architecture](#-architecture) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Deployment](#-deployment) • [Project Structure](#-project-structure)

</div>

---

## 🎯 Overview

Dewatering Solutions Platform is a comprehensive business management system designed for an industrial engineering company based in Lima, Perú. The platform integrates a **public-facing corporate website**, an **internal CRM/ERP dashboard**, and an **AI-powered technical assistant** — all within a single, unified application.

The system supports the complete business lifecycle: from lead acquisition and quotation management to project tracking and technical document distribution.

---

## ✨ Features

### 🌐 Public Website
- **Modern landing page** with animated hero section and corporate branding
- **Service catalog** organized by category (filtration, thickening, flotation, leaching, and more)
- **Product showcase** for industrial equipment with technical specifications
- **Project portfolio** displaying completed works and case studies
- **Contact forms** that automatically generate leads in the CRM pipeline

### 📊 Admin Dashboard & CRM
- **Executive dashboard** with real-time KPIs (leads, quotations, revenue metrics)
- **Lead management** with full CRM pipeline (New → Contacted → Evaluating → Proposal → Won/Lost)
- **Quotation engine** — create, version, and track professional quotations with PDF generation
- **Project management** — post-sale project tracking with status workflows
- **Inventory & product management** — CRUD for industrial equipment catalog
- **Store/branch management** — multi-location support with geographic data

### 🔐 Security & Access Control
- **JWT authentication** with configurable token expiration
- **Multi-Factor Authentication (MFA/TOTP)** — compatible with Google Authenticator
- **Role-Based Access Control (RBAC)** — `SUPER_ADMIN` · `OPERATOR` · `CLIENT`
- **Attribute-Based Access Control (ABAC)** — fine-grained policies based on user attributes
- **Comprehensive audit trail** — every critical action is logged with IP, timestamp, and diff

### 🤖 AI-Powered Features
- **RAG-based technical chatbot** — powered by Google Gemini with vector similarity search
- **Document intelligence** — upload PDFs/DOCX, automatic chunking and embedding generation
- **AI training dashboard** — manage knowledge base ingestion with real-time progress tracking
- **pgvector integration** — 768-dimensional embeddings for semantic document search

### 👤 Client Portal (B2B)
- **Self-service dashboard** — clients view their own quotations, projects, and documents
- **Document center** — download technical datasheets, reports, and certificates
- **Project tracking** — real-time visibility into project status and milestones

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    NGINX (Reverse Proxy)                 │
│                    Static Asset Cache                    │
└─────────────┬───────────────────────────┬───────────────┘
              │                           │
    ┌─────────▼─────────┐     ┌───────────▼───────────┐
    │   React 19 (SPA)  │     │   Express 5 (REST)    │
    │   Vite · Router 7 │     │   JWT · RBAC · ABAC   │
    │   Recharts · Lucide│     │   Helmet · CORS       │
    └─────────┬─────────┘     └───────────┬───────────┘
              │                           │
              │              ┌────────────▼────────────┐
              │              │     PostgreSQL 16        │
              │              │  ┌──────────────────┐   │
              │              │  │   pgvector        │   │
              │              │  │   (768-dim)       │   │
              │              │  └──────────────────┘   │
              │              └────────────┬────────────┘
              │                           │
              │              ┌────────────▼────────────┐
              │              │    Google Gemini AI      │
              │              │  Embeddings + Chat       │
              │              └─────────────────────────┘
              │
    ┌─────────▼─────────┐
    │   Docker Multi-    │
    │   Stage Builds     │
    │   → Cloud Run      │
    └───────────────────┘
```

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Node.js 22** | Runtime environment (ES Modules) |
| **Express 5** | Web framework with async error handling |
| **PostgreSQL** | Primary database with JSONB support |
| **pgvector** | Vector similarity search for RAG |
| **JWT + bcrypt** | Authentication and password hashing |
| **Helmet + CORS** | Security headers and cross-origin policies |
| **Multer** | File upload handling (PDF, DOCX) |
| **PDFKit + QRCode** | PDF generation with embedded QR codes |
| **Google Gemini SDK** | AI embeddings and conversational AI |
| **WebSocket (ws)** | Real-time communication layer |

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework with latest concurrent features |
| **Vite 8** | Build tool with HMR and optimized bundling |
| **React Router 7** | Client-side routing with protected routes |
| **Recharts** | Data visualization for dashboards |
| **Lucide React** | Icon system (consistent design language) |
| **SweetAlert2** | Elegant notification and confirmation dialogs |
| **Axios** | HTTP client with interceptors |
| **CSS Variables** | Custom design system (no CSS frameworks) |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Docker** | Multi-stage containerization |
| **Nginx** | Static file serving and SPA routing |
| **Google Cloud Run** | Serverless container deployment |
| **Google Artifact Registry** | Private container image storage |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) `>= 22.0.0`
- [PostgreSQL](https://www.postgresql.org/) `>= 15` (or a managed instance)
- [Docker](https://www.docker.com/) (optional, for containerized deployment)
- [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) (optional, for cloud deployment)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/0xhazroot/dewatering-solutions.git
cd dewatering-solutions
```

**2. Configure environment variables**
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials and API keys
```

**3. Install dependencies**
```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

**4. Initialize the database**
```bash
# Execute the SQL schema against your PostgreSQL instance
psql -U your_user -d your_database -f database/database.sql

# (Optional) Seed with demo data
cd backend && node seedProducts.js
```

**5. Start development servers**
```bash
# Terminal 1 — Backend (port 3000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

### Environment Variables

Create a `backend/.env` file with the following structure:

```env
# Database
DB_HOST=your_database_host
DB_PORT=5432
DB_USER=your_database_user
DB_PASSWORD=your_secure_password
DB_NAME=your_database_name

# Authentication
JWT_SECRET=your_jwt_secret_here

# Server
PORT=3000
NODE_ENV=development

# AI (Google Gemini)
GEMINI_API_KEY=your_gemini_api_key
```

> [!WARNING]
> Never commit your `.env` file to version control. The `.gitignore` is already configured to exclude it.

---

## 🐳 Deployment

### Docker (Local)

```bash
cd docker
docker compose up --build
```

This starts both the backend (port `3000`) and frontend (port `8080`) containers in an isolated network.

### Google Cloud Run (Production)

```bash
# Authenticate
gcloud auth login
gcloud config set project your-project-id

# Enable required services
gcloud services enable artifactregistry.googleapis.com run.googleapis.com cloudbuild.googleapis.com

# Build and deploy backend
gcloud builds submit --tag gcr.io/your-project-id/dewatering-backend ./backend
gcloud run deploy dewatering-backend --image gcr.io/your-project-id/dewatering-backend --platform managed --region us-central1 --allow-unauthenticated

# Build and deploy frontend
gcloud builds submit --tag gcr.io/your-project-id/dewatering-frontend ./frontend
gcloud run deploy dewatering-frontend --image gcr.io/your-project-id/dewatering-frontend --platform managed --region us-central1 --allow-unauthenticated
```

---

## 📁 Project Structure

```
dewatering-solutions/
├── backend/
│   ├── src/
│   │   ├── app.js                 # Express application setup
│   │   ├── server.js              # Server entry point
│   │   ├── config/                # Database and service configuration
│   │   ├── controllers/           # Request handlers (12 controllers)
│   │   │   ├── aiController.js    # RAG chatbot & document intelligence
│   │   │   ├── authController.js  # Authentication & registration
│   │   │   ├── leadController.js  # CRM lead management
│   │   │   ├── quotationController.js
│   │   │   └── ...
│   │   ├── middlewares/           # Auth, RBAC, ABAC, error handling
│   │   ├── models/                # Database access layer (8 models)
│   │   ├── routes/                # API route definitions (11 routers)
│   │   ├── services/              # Business logic (auth, audit)
│   │   └── utils/                 # Shared utilities (MFA, helpers)
│   ├── Dockerfile                 # Production container image
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Root component with routing
│   │   ├── main.jsx               # Application entry point
│   │   ├── index.css              # Design system (CSS custom properties)
│   │   ├── components/            # Reusable UI components
│   │   │   ├── DashboardLayout.jsx
│   │   │   ├── DewateringChatbot.jsx
│   │   │   └── ...
│   │   ├── context/               # React context (Auth state)
│   │   ├── pages/                 # Page components (22 pages)
│   │   │   ├── public/            # Landing, services, products, about
│   │   │   ├── crm/               # Leads, quotations, requests
│   │   │   ├── client/            # Client portal (B2B)
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   └── ...
│   │   └── services/              # API client layer
│   ├── Dockerfile                 # Multi-stage build (Node → Nginx)
│   ├── nginx.conf                 # SPA-ready Nginx configuration
│   └── package.json
│
├── database/
│   └── database.sql               # Complete schema (13 tables + pgvector)
│
├── docker/
│   ├── docker-compose.yml         # Production orchestration
│   └── docker-compose.dev.yml     # Development orchestration
│
└── docs/
    ├── API_DOCUMENTATION.md       # REST API reference
    └── PROJECT_CONTEXT.md         # Architecture decisions & context
```

---

## 📡 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/register` | User registration | Public |
| `POST` | `/api/auth/login` | Authentication | Public |
| `GET` | `/api/leads` | List all leads | RBAC |
| `POST` | `/api/leads` | Create a new lead | Public |
| `GET` | `/api/quotations` | List quotations | RBAC |
| `POST` | `/api/quotations` | Create quotation | RBAC |
| `GET` | `/api/products` | List products | Public |
| `GET` | `/api/services` | List services | Public |
| `GET` | `/api/projects` | List projects | RBAC |
| `POST` | `/api/ai/chat` | AI chatbot query | Auth |
| `POST` | `/api/ai/train` | Ingest document for RAG | RBAC |
| `GET` | `/api/audit` | Audit trail logs | Admin |

> For the complete API reference, see [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md).

---

## 🔒 Security

This platform implements a **defense-in-depth** security model:

- **Authentication:** JWT tokens with bcrypt password hashing (12 salt rounds)
- **MFA:** TOTP-based two-factor authentication (RFC 6238)
- **Authorization:** Dual-layer RBAC + ABAC middleware pipeline
- **HTTP Security:** Helmet.js security headers, CORS policy enforcement
- **Audit:** Immutable audit log capturing all mutations with user context
- **Input Validation:** Server-side validation on all endpoints
- **Secrets Management:** Environment-based configuration, no hardcoded credentials

---

## 🤝 Contributing

This is a proprietary project developed as a **university pre-thesis** in partnership with a real-world industrial client. Contributions are not currently accepted from external collaborators.

---

## 📄 License

This project is **proprietary software**. All rights reserved.  
Unauthorized copying, modification, or distribution of this software is strictly prohibited.

---

<div align="center">

**Built with ❤️ for the industrial sector**

*Dewatering Solutions — Solid-Liquid Separation Specialists*

</div>
