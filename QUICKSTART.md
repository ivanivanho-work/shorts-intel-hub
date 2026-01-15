# 🚀 Quick Start Guide - Shorts Intel Hub

Get the Shorts Intel Hub running locally in under 5 minutes!

---

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 15+ installed
- Git repository cloned

---

## Step 1: Start the Backend (30 seconds)

```bash
# Navigate to backend
cd backend/functions

# Install dependencies
npm install

# Start the development server
npm run dev
```

✅ Backend will start on `http://localhost:3000`

---

## Step 2: Start the Frontend (30 seconds)

Open a **new terminal window**:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

✅ Frontend will start on `http://localhost:3001`

---

## Step 3: Open in Browser

Visit: **http://localhost:3001**

You should see:
- 🎨 Dark theme with YouTube red accents
- 📊 Marketing Dashboard (default view)
- 📤 Agency Upload button in header

---

## What You're Seeing

### Currently Working (with Mock Data)

- ✅ **Marketing Dashboard** - All 4 tabs functional
  - Top Topics & Trends
  - Deep Dive
  - Scoring Settings
  - Archive

- ✅ **Agency Upload Portal** - File upload interface

- ✅ **Filters** - Market and demographic selection

- ✅ **Trend Cards** - Display with approve button

### Not Yet Connected

- ⏳ Backend API (routes are placeholder)
- ⏳ Database (schema ready, not populated)
- ⏳ Real data (currently using mock data)

---

## Database Setup (Optional for Phase 1)

If you want to set up the database:

```bash
# Navigate to database directory
cd backend/database

# Run setup script
./setup.sh

# Or manually:
psql -U postgres -f schema.sql
```

---

## Troubleshooting

### Port Already in Use

**Backend (port 3000):**
```bash
lsof -ti:3000 | xargs kill -9
```

**Frontend (port 3001):**
```bash
lsof -ti:3001 | xargs kill -9
```

### Dependencies Won't Install

```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install
```

### Build Errors

```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend/functions
npm run build
```

---

## Next Steps

1. **Phase 1 Complete** ✅
   - Backend structure ready
   - Frontend UI complete
   - Both servers running

2. **Phase 2 Coming Soon**
   - Connect frontend to backend APIs
   - Implement data ingestion
   - Add Gemini 3.0 integration
   - Set up ranking algorithm

3. **Phase 3 Later**
   - Firebase Authentication
   - MCP Bridge to Agent Collective
   - Weekly automation
   - Production deployment

---

## Useful Commands

### Backend
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm test             # Run tests (Phase 2)
```

### Frontend
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run type-check   # Check TypeScript
```

---

## Project Structure Overview

```
shorts-intel-hub/
├── backend/
│   ├── database/           # PostgreSQL schema
│   └── functions/          # Express API + Cloud Functions
│       └── src/
│           ├── api/        # Routes
│           └── db/         # Services
│
├── frontend/
│   └── src/
│       ├── app/            # React components
│       ├── services/       # API client
│       ├── types/          # TypeScript types
│       └── styles/         # CSS + Tailwind
│
└── Documentation
    ├── README.md           # Main project README
    ├── PROJECT_PLAN.md     # Complete project plan
    ├── GETTING_STARTED.md  # Detailed setup guide
    ├── PHASE_1_COMPLETE.md # Phase 1 summary
    └── QUICKSTART.md       # This file
```

---

## Support

- 📖 Full documentation: [GETTING_STARTED.md](./GETTING_STARTED.md)
- 📋 Project plan: [PROJECT_PLAN.md](./PROJECT_PLAN.md)
- ✅ Phase 1 status: [PHASE_1_COMPLETE.md](./PHASE_1_COMPLETE.md)

---

**That's it! You're up and running! 🎉**

The frontend is showing mock data right now. Once Phase 2 begins, we'll connect it to real backend APIs and populate the database with actual trend data.
