# Getting Started - Shorts Intel Hub

Welcome to the **Shorts Intel Hub** (Project Animaniacs)! This guide will help you get started with the project.

## ✅ Project Setup Complete

The project has been initialized with:
- ✅ GitHub repository connected
- ✅ Project structure created
- ✅ Complete documentation
- ✅ Development plan (10 phases)
- ✅ Agent team ready (Gus, Dice, Marco)
- ✅ Auto-backup configured (10 PM daily)

## 📋 What We're Building

**APAC Shorts Intel Hub** - A centralized platform that:

1. **Aggregates** trending topics from 4 sources (YouTube Search, Nyan Cat, Agency uploads, Music team)
2. **Processes** with Gemini 3.0 AI (normalize, deduplicate, clean)
3. **Ranks** by velocity, creation rate, watchtime (per demo/market)
4. **Presents** via Manager Dashboard (Top 10 + long tail)
5. **Delivers** to Agent Collective for automated campaign creation

## 🎯 Key Facts

**Launch Target:** Late January 2026 (SLC)
**Markets:** JP, KR, IN, ID, AUNZ (5 markets)
**Demographics:** M/F 18-24, 25-34, 35-44 (6 per market = 30 total segments)
**Weekly Refresh:** Mondays 6:00 AM (per market local time, user-adjustable)

## 🏗️ Tech Stack

- **Frontend:** Firebase + React/TypeScript + Tailwind CSS
- **Backend:** GCP Cloud Functions + Cloud SQL (PostgreSQL + pgvector)
- **AI:** Gemini 3.0
- **Auth:** Firebase Auth with Google SSO (build LAST)
- **Integration:** MCP Bridge to Agent Collective (already built)

## 📁 Repository Structure

```
shorts-intel-hub/
├── frontend/                 # React app (Manager + Agency UIs)
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Manager & Agency pages
│   │   ├── services/        # API clients
│   │   └── utils/           # Helper functions
│
├── backend/                  # Cloud Functions
│   ├── functions/src/
│   │   ├── ingestion/       # Data intake handlers
│   │   ├── processing/      # Gemini AI processing
│   │   ├── ranking/         # Scoring & ranking logic
│   │   ├── scheduler/       # Weekly refresh jobs
│   │   ├── api/             # REST API endpoints
│   │   └── mcp/             # MCP Bridge integration
│   └── database/
│       └── schema.sql       # Database schema
│
├── docs/                     # Documentation
│   ├── BRD.md               # Business Requirements
│   ├── BRD_ORIGINAL.md      # Original stakeholder BRD
│   ├── PROJECT_PLAN.md      # 10-phase development plan
│   └── GETTING_STARTED.md   # This file
│
├── scripts/                  # Utility scripts
├── .gus-status/             # Auto-backup status (gitignored)
├── .gitignore
└── README.md                # Project overview
```

## 🚀 Development Phases (10 Weeks)

### Phase 1-2: Foundation (Week 1-2)
- Database setup (Cloud SQL + pgvector)
- Project scaffolding (frontend + backend)
- Manual upload functionality

### Phase 3-4: AI Processing (Week 3-4)
- Gemini 3.0 integration
- Normalization & deduplication
- Data cleaning pipeline

### Phase 5-6: Ranking & UI (Week 5-6)
- Ranking algorithm with configurable weights
- Manager dashboard (market selector, demo filter)
- Approval workflow

### Phase 7-8: Automation (Week 7-8)
- Weekly scheduler (Monday 6 AM per market)
- MCP Bridge integration
- End-to-end testing

### Phase 9: Documentation (Week 9)
- User guides
- API documentation
- Training materials

### Phase 10: Auth (Week 10 - POST-CORE)
- Firebase Auth with Google SSO
- Security hardening

## 🤖 Agent Team

**Gus (Coordinator)**
- Plans features and breaks down work
- Delegates to Dice and Marco
- Tracks progress and integration
- Auto-backs up to GitHub (10 PM daily)

**Dice (Frontend Specialist)**
- Builds React components and UIs
- Manager Dashboard
- Agency Upload Portal
- Responsive design

**Marco (Backend Specialist)**
- Cloud Functions development
- Database schema and queries
- API endpoints
- Gemini 3.0 integration
- MCP Bridge connection

## 📊 Data Flow

```
[4 Data Sources]
    → [Gemini 3.0 Processing]
    → [Ranking System]
    → [Cloud SQL Database]
    → [Manager UI]
    → [One-Click Approval]
    → [MCP Bridge]
    → [Agent Collective]
```

## 🔑 Key Requirements

### Data Sources (4)
1. **YouTube Search API** - Automated query trends (TBC later)
2. **Nyan Cat Pipeline** - Internal video filter (TBC later)
3. **Agency Upload** - Manual competitive intel (drag-drop, no auth)
4. **Music Team** - Artist/song lists (manual upload)

### Two User Interfaces
1. **Manager Dashboard** (Internal, SSO)
   - Market selector (5 markets)
   - Demo filter (6 demos)
   - Top 10 shortlist
   - Long tail view
   - One-click approval

2. **Agency Upload Portal** (External, no auth)
   - Drag-drop file upload
   - MD template download
   - Upload history
   - Fully open access

### Topic Schema (6 Fields)
- **Topic Name** (mandatory)
- **Description** (mandatory)
- **Target Demo** (mandatory)
- **Reference Link** (mandatory)
- **Hashtags** (optional)
- **Audio** (optional)

## 📝 Next Steps

1. **Review Documentation**
   - Read `docs/BRD.md` for business requirements
   - Read `docs/PROJECT_PLAN.md` for detailed phase breakdown

2. **Set Up Development Environment**
   - Install Node.js 18+
   - Set up GCP account
   - Create Firebase project
   - Configure environment variables

3. **Phase 1 Tasks** (Week 1-2)
   - Database schema design
   - Cloud SQL setup with pgvector
   - Frontend scaffolding
   - Manual upload UI

## 🔧 Configuration

### Auto-Backup (Gus)
- **Frequency:** Daily at 10 PM
- **Destination:** https://github.com/ivanivanho-work/shorts-intel-hub.git
- **Includes:** Code changes, project status, activity logs

### Weekly Data Refresh
- **Default:** Mondays 6:00 AM (per market local time)
- **Adjustable:** Yes (user-configurable per market)
- **Trigger:** Cloud Scheduler

## 📖 Documentation

- **README.md** - Project overview and architecture
- **docs/BRD.md** - Business requirements (refined)
- **docs/PROJECT_PLAN.md** - Detailed development plan
- **docs/BRD_ORIGINAL.md** - Original stakeholder BRD
- **GETTING_STARTED.md** - This file

## ⚠️ Important Notes

1. **YouTube Search API & Nyan Cat** - TBC later, proceed with manual sources first
2. **Auth** - Build LAST to not block development and testing
3. **Ranking Weights** - Define during test phase, make configurable
4. **MCP Bridge** - Already built, may need refinement in test phase
5. **Expiry Logic** - Topics >3 weeks archived, >2 years deleted with approval

## 🎯 Success Criteria

**Operational:**
- Reduce topic sourcing time from days → minutes
- Weekly data refresh on schedule
- Manager approval <30 seconds per topic

**Business:**
- Increase CTR (track post-launch)
- Increase View Incrementality (track post-launch)
- Manager satisfaction >4/5

**Technical:**
- API response time <2 seconds
- Database uptime 99.9%
- Data accuracy >95%

## 📞 Contacts

- **Ivan Ho** - ivho@google.com
- **Darren Ngatimin** - dngatimin@google.com

## 🚦 Current Status

✅ Project initialized
✅ Repository created and pushed to GitHub
✅ Documentation complete
✅ Agent team ready
✅ Structure in place

**Next:** Phase 1 - Foundation & Database Setup (Week 1-2)

---

**Ready to build! Let's go! 🚀**
