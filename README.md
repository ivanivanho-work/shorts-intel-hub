# Shorts Intel Hub (Project Animaniacs)

> **APAC Shorts Intel Hub** - Centralized intelligence platform for trending topics aggregation, AI-powered analysis, and automated campaign brief generation.

## Project Overview

**Target Launch:** Late January 2026 (SLC - Simple, Lovable, Complete)

The Shorts Intel Hub is a centralized, automated pipeline that aggregates, standardizes, and ranks topical content from multiple sources to drive incremental YouTube Shorts viewership in APAC markets.

### Purpose

- **For Human Strategists:** Country Shorts Marketing Managers can curate and approve trending topics via intuitive UI
- **For AI Agents:** Automated feed to [Agent Collective](https://v3-creative-engine.web.app/agent-collective.html) for rapid creative brief generation
- **Business Goal:** Reduce topic sourcing time from days to minutes, increase CTR and View Incrementality

## Markets & Demographics

### Target Markets
- 🇯🇵 Japan (JP)
- 🇰🇷 Korea (KR)
- 🇮🇳 India (IN)
- 🇮🇩 Indonesia (ID)
- 🇦🇺🇳🇿 Australia/New Zealand (AUNZ)

### Target Demographics (6 per market)
- **Male:** 18-24, 25-34, 35-44 years
- **Female:** 18-24, 25-34, 35-44 years

## Architecture

### Tech Stack

**Frontend:**
- Firebase Hosting
- React/TypeScript
- Material-UI / Tailwind CSS

**Backend:**
- Google Cloud Platform (GCP)
- Cloud Functions (Node.js)
- Cloud SQL (PostgreSQL with pgvector)
- Cloud Scheduler (for weekly refresh)

**AI/ML:**
- Gemini 3.0 (via Google AI APIs)
- Vector embeddings for deduplication

**Authentication:**
- Firebase Auth with Google SSO (internal users)
- No auth for agency upload interface

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     DATA SOURCES (4 Streams)                     │
├─────────────────────────────────────────────────────────────────┤
│  1. YouTube Search API (TBC)     │  2. Nyan Cat Pipeline (TBC)  │
│  3. Agency Upload (Manual)       │  4. Music Team Data (Manual)  │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              AI PROCESSING ENGINE (Gemini 3.0)                   │
├─────────────────────────────────────────────────────────────────┤
│  • Normalize disparate data formats                              │
│  • Deduplicate similar trends (vector similarity)                │
│  • Clean & validate content                                      │
│  • Extract metadata (hashtags, audio, references)                │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              RANKING & SCORING SYSTEM                            │
├─────────────────────────────────────────────────────────────────┤
│  • Metrics: Velocity, Creation Rate, Watchtime                   │
│  • Per-demo segmentation (6 demos × 5 markets)                   │
│  • Configurable weighting (test phase tuning)                    │
│  • Expiry logic: >3 weeks or negative velocity                   │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CLOUD SQL DATABASE                             │
├─────────────────────────────────────────────────────────────────┤
│  • Active topics (ranked, scored, segmented)                     │
│  • Archived topics (expired: >3 weeks)                           │
│  • Historical data (auto-delete: >2 years with approval)         │
│  • Vector embeddings (pgvector for deduplication)                │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ├──────────────────────────┐
                 ▼                          ▼
┌────────────────────────────┐   ┌──────────────────────────────┐
│   MANAGER UI (Internal)    │   │  AGENCY UPLOAD UI (External) │
├────────────────────────────┤   ├──────────────────────────────┤
│ • Market selector          │   │ • Drag-drop file upload      │
│ • Top 10 shortlist view    │   │ • MD template reference      │
│ • Long tail expandable     │   │ • Upload log/history         │
│ • One-click approval       │   │ • No authentication          │
│ • Demo filtering           │   │ • Public access              │
│ • SSO auth (Google)        │   └──────────────────────────────┘
└────────────────┬───────────┘
                 │
                 ▼ (On Approval)
┌─────────────────────────────────────────────────────────────────┐
│              MCP BRIDGE → AGENT COLLECTIVE                       │
├─────────────────────────────────────────────────────────────────┤
│  • Structured JSON push                                          │
│  • Topic schema (6 mandatory fields)                             │
│  • Triggers automated creative brief generation                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Model

### Topic Schema

| Field Name       | Type   | Requirement  | Description                                      |
|------------------|--------|--------------|--------------------------------------------------|
| **Topic Name**   | String | **Mandatory**| The headline of the trend                        |
| **Description**  | Text   | **Mandatory**| Context on why it's trending                     |
| **Target Demo**  | String | **Mandatory**| Specific audience segment (e.g., "Females 18-24")|
| **Reference Link**| URL   | **Mandatory**| Link to representative video or source           |
| **Hashtags**     | List   | Optional     | Relevant tags for metadata                       |
| **Audio**        | String | Optional     | Specific song or audio ID                        |

### Additional Metadata (Internal)

| Field Name          | Type      | Description                                    |
|---------------------|-----------|------------------------------------------------|
| **topic_id**        | UUID      | Primary key                                    |
| **market**          | String    | JP/KR/IN/ID/AUNZ                               |
| **source**          | String    | search/nyan/agency/music                       |
| **created_at**      | Timestamp | First ingestion time                           |
| **updated_at**      | Timestamp | Last update time                               |
| **expires_at**      | Timestamp | Auto-calculated (created + 3 weeks)            |
| **rank_score**      | Float     | Weighted importance score                      |
| **velocity**        | Float     | View/creation growth rate                      |
| **status**          | String    | active/expired/approved/archived               |
| **approved_by**     | String    | User email who approved                        |
| **approved_at**     | Timestamp | Approval timestamp                             |
| **embedding**       | Vector    | pgvector embedding for deduplication           |

## Features

### Phase 1: SLC v1 (Target: Late January 2026)

**Data Ingestion:**
- ✅ Agency manual upload UI (drag-drop, MD template)
- ✅ Music team manual upload UI
- ⏳ YouTube Search API (TBC later)
- ⏳ Nyan Cat MCP integration (TBC later)

**Processing:**
- ✅ Gemini 3.0 data normalization
- ✅ Vector-based deduplication
- ✅ Basic ranking algorithm (configurable weights)
- ✅ Expiry logic (>3 weeks, negative velocity)

**UI - Manager Dashboard:**
- ✅ Market selector (5 markets)
- ✅ Demo filter (6 demos per market)
- ✅ Top 10 shortlist view
- ✅ Long tail expandable view
- ✅ One-click approval button
- ✅ Weekly refresh scheduler (Mondays 6:00 AM, per market, user-adjustable)

**UI - Agency Upload:**
- ✅ Public upload interface (no auth)
- ✅ Drag-drop file upload
- ✅ MD template download
- ✅ Upload history log

**Integration:**
- ✅ MCP Bridge push to Agent Collective (existing)
- ✅ JSON API for approved topics

**Database:**
- ✅ Cloud SQL (PostgreSQL + pgvector)
- ✅ Topic archival (>3 weeks)
- ✅ Deletion with approval (>2 years)

**Authentication:**
- ⏰ Firebase Auth + Google SSO (build LAST, after core functionality)

### Phase 2: Enhancements (Post-Launch)

- Advanced analytics dashboard
- Historical trend visualization
- A/B testing framework for ranking weights
- Automated performance tracking (CTR, view incrementality)
- API rate limiting and quotas
- Advanced vector search for similar topics

## Development Timeline

**Week 1-2: Foundation**
- Database schema design
- Cloud SQL setup with pgvector
- Basic frontend scaffold (Manager + Agency UIs)
- Manual upload functionality

**Week 3-4: AI Processing**
- Gemini 3.0 integration
- Normalization pipeline
- Deduplication with vectors
- Ranking algorithm (v1)

**Week 5-6: UI Development**
- Manager dashboard (Dice)
- Market/demo filtering
- Top 10 + long tail views
- Approval workflow

**Week 7-8: Integration & Testing**
- MCP Bridge connection
- Weekly scheduler setup
- Expiry/archival logic
- End-to-end testing

**Week 9: Polish & Launch Prep**
- Performance optimization
- Bug fixes
- Documentation
- User training materials

**Week 10: Auth & Hardening (Post-Core)**
- Firebase Auth implementation
- SSO setup
- Security review

## Project Structure

```
shorts-intel-hub/
├── frontend/                 # React app (Manager + Agency UIs)
│   ├── public/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Manager & Agency pages
│   │   ├── services/        # API clients
│   │   └── utils/           # Helper functions
│   └── package.json
│
├── backend/                  # Cloud Functions
│   ├── functions/
│   │   ├── src/
│   │   │   ├── ingestion/   # Data intake handlers
│   │   │   ├── processing/  # Gemini AI processing
│   │   │   ├── ranking/     # Scoring & ranking logic
│   │   │   ├── scheduler/   # Weekly refresh jobs
│   │   │   ├── api/         # REST API endpoints
│   │   │   └── mcp/         # MCP Bridge integration
│   │   └── package.json
│   └── database/
│       └── schema.sql       # Database schema
│
├── docs/                     # Documentation
│   ├── BRD.md               # Business Requirements (this file)
│   ├── API.md               # API documentation
│   ├── ARCHITECTURE.md      # Technical architecture
│   └── DEPLOYMENT.md        # Deployment guide
│
├── scripts/                  # Utility scripts
│   ├── setup-db.sh          # Database initialization
│   └── deploy.sh            # Deployment script
│
├── .gus-status/             # Gus auto-backup status (gitignored)
├── .gitignore
├── README.md                # This file
└── package.json             # Root package management
```

## Getting Started

### Prerequisites

- Node.js 18+
- GCP account with billing enabled
- Firebase project
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/ivanivanho-work/shorts-intel-hub.git
cd shorts-intel-hub

# Install dependencies
cd frontend && npm install && cd ..
cd backend/functions && npm install && cd ../..

# Set up environment variables
cp .env.example .env
# Edit .env with your GCP/Firebase credentials

# Initialize database
npm run setup-db

# Start local development
npm run dev
```

## Agent Team

This project is built with the **My Team** agent framework:

- **Gus (Coordinator):** Plans features and delegates work
- **Dice (Frontend):** Builds React UIs and components
- **Marco (Backend):** Develops Cloud Functions and database

### Auto-Backup

Gus automatically backs up project progress to Git:
- **Daily backup:** Every day at 10 PM
- **Status tracking:** See `.gus-status/latest.json`
- **Manual backup:** `npm run backup`

## Glossary

- **SLC:** Simple, Lovable, Complete (development target state)
- **Nyan Cat:** Internal pipeline for filtering YouTube video content
- **MCP Bridge:** Model Context Protocol connection to AI agents
- **GTM:** Go-to-Market
- **Demo:** Demographic segment (age + gender)

## Contributing

This is an internal Google project. For questions or contributions, contact:
- Ivan Ho (ivho@google.com)
- Darren Ngatimin (dngatimin@google.com)

## License

Internal use only - Google confidential

---

**Built with Gus, Dice & Marco** 🤖
**Auto-backed up daily at 10 PM** 💾
