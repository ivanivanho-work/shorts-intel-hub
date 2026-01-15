# Phase 2: Alpha Launch Preparation

**Goal:** Deploy a working Alpha MVP for partner demonstrations and early testing

**Timeline:** ASAP - Minimum Viable Product for partner discussions

---

## 🎯 Alpha Launch Objectives

### What Alpha Needs to Demonstrate

1. **Live Web Application** - Accessible URL for partner demos
2. **Functional Data Flow** - Show how data moves through the system
3. **Agency Upload Working** - Accept and process real agency submissions
4. **Nyan Cat Integration** - Ingest and display Nyan Cat pipeline data
5. **Scoring Mechanics Visible** - Demonstrate configurable ranking algorithm
6. **Mock Data Simulation** - Pre-populated trends for all 5 markets
7. **Partner Readiness** - Ready to discuss API integrations with:
   - Search team (API pending)
   - Nyan Cat team (data sharing ready)
   - Agency partners (upload portal ready)
   - Music team (submission process ready)

---

## 📋 Phase 2 Task Breakdown

### 2.1 Mock Data Population (Quick Win)

**Goal:** Populate database with realistic mock data for all 5 markets

**Tasks:**
- [ ] Create seed data script with 50+ trends per market
- [ ] Include all 4 sources: Search, Nyan Cat, Agency, Music
- [ ] Cover all 6 demographics per market
- [ ] Set realistic performance metrics (views, velocity, etc.)
- [ ] Include trends at different lifecycle stages (new, active, expiring)
- [ ] Populate ranking configs with default weights

**Files to Create:**
- `backend/database/seed-data.sql` - Mock trend data
- `backend/database/seed.sh` - Seed script runner

**Time Estimate:** 2-3 hours

---

### 2.2 API Endpoint Implementation (Connect Frontend to Backend)

**Goal:** Replace frontend mock data with real backend API calls

**Tasks:**
- [ ] Implement `/api/trends` GET endpoint
- [ ] Implement `/api/trends/:id/approve` POST endpoint
- [ ] Implement `/api/scoring-settings` GET/POST endpoints
- [ ] Implement `/api/stats` GET endpoint
- [ ] Implement `/api/agency-upload` POST endpoint (file processing)
- [ ] Add CORS configuration for frontend
- [ ] Add error handling and validation
- [ ] Test all endpoints with Postman/curl

**Files to Update:**
- `backend/functions/src/api/routes.js` - Implement placeholder routes
- `backend/functions/src/index.js` - Ensure Cloud Functions setup

**Time Estimate:** 4-6 hours

---

### 2.3 Frontend API Integration (Remove Mock Data)

**Goal:** Connect frontend components to live backend APIs

**Tasks:**
- [ ] Update `MarketingDashboard.tsx` to use `fetchTrends()`
- [ ] Add loading states for all API calls
- [ ] Add error handling and user feedback
- [ ] Implement trend approval flow with API
- [ ] Connect scoring settings to backend
- [ ] Add success/error toast notifications
- [ ] Test all user flows end-to-end

**Files to Update:**
- `frontend/src/app/components/MarketingDashboard.tsx`
- `frontend/src/app/components/ScoringSettings.tsx`
- `frontend/src/app/components/ArchiveView.tsx`

**Time Estimate:** 3-4 hours

---

### 2.4 Agency Upload Processing (Real File Handling)

**Goal:** Accept and process actual agency data files

**Tasks:**
- [ ] Implement file upload to Cloud Storage
- [ ] Create JSON/CSV parser for agency data
- [ ] Validate uploaded data structure
- [ ] Insert parsed data into `topics` table
- [ ] Mark source as 'Agency'
- [ ] Return submission confirmation
- [ ] Add upload history tracking

**Files to Create/Update:**
- `backend/functions/src/services/upload-processor.js`
- `backend/functions/src/api/routes.js` (agency-upload endpoint)

**Time Estimate:** 3-4 hours

---

### 2.5 Nyan Cat Data Integration (Test Data Ingestion)

**Goal:** Accept and process Nyan Cat pipeline data

**Tasks:**
- [ ] Create Nyan Cat data ingestion endpoint
- [ ] Parse Nyan Cat data format (TBD - get sample from team)
- [ ] Map Nyan Cat fields to our schema
- [ ] Insert with source = 'Nyan Cat'
- [ ] Test with sample data from Nyan Cat team

**Files to Create:**
- `backend/functions/src/services/nyan-cat-ingestion.js`
- `backend/functions/src/api/routes.js` (nyan-cat endpoint)

**Time Estimate:** 2-3 hours
**Blocker:** Need sample data format from Nyan Cat team

---

### 2.6 Gemini 3.0 Integration (CRITICAL - Topic Normalization & Deduplication)

**Goal:** Use Gemini 3.0 to normalize and deduplicate incoming trends

**Tasks:**
- [ ] Set up Gemini API credentials (Google AI Studio)
- [ ] Create Gemini service module
- [ ] Implement topic normalization:
  - Standardize topic names
  - Clean up descriptions
  - Extract/normalize hashtags
  - Identify target demographics
- [ ] Generate 768-dim embeddings for vector search
- [ ] Implement duplicate detection (0.85 similarity threshold)
- [ ] Auto-merge duplicates or flag for review
- [ ] Test with sample data from all 4 sources

**Files to Create:**
- `backend/functions/src/services/gemini-service.js` - Gemini API integration
- `backend/functions/src/services/deduplication.js` - Duplicate detection logic
- `backend/functions/.env.example` - Add GEMINI_API_KEY

**API Integration:**
```javascript
// Gemini API for normalization
POST https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent

// Gemini API for embeddings
POST https://generativelanguage.googleapis.com/v1/models/embedding-001:embedContent
```

**Time Estimate:** 6-8 hours

**Priority:** 🔴 **CRITICAL FOR ALPHA MVP**

---

### 2.7 Scoring Algorithm Implementation (Functional Ranking)

**Goal:** Implement the weighted ranking algorithm

**Tasks:**
- [ ] Implement score calculation with configurable weights
- [ ] Apply weights from `ranking_configs` table
- [ ] Calculate rank positions (1-N per market/demo)
- [ ] Update trend scores on data changes
- [ ] Add recalculation trigger
- [ ] Test scoring with different weight configurations

**Files to Update:**
- `backend/functions/src/db/ranking.js` - Complete implementation
- `backend/functions/src/api/routes.js` - Recalculation endpoint

**Time Estimate:** 4-5 hours

---

### 2.8 Deployment to Alpha Environment (Web App Live)

**Goal:** Deploy frontend and backend to accessible URLs

**Deployment Options:**

**Option A: Firebase (Recommended - Fastest)**
- [ ] Set up Firebase Hosting for frontend
- [ ] Deploy Cloud Functions for backend
- [ ] Configure environment variables
- [ ] Set up Cloud SQL connection
- [ ] Test deployed URLs

**Option B: GCP Cloud Run**
- [ ] Containerize backend with Docker
- [ ] Deploy to Cloud Run
- [ ] Deploy frontend to Cloud Storage + CDN
- [ ] Configure custom domain (optional)

**Files to Create:**
- `firebase.json` - Firebase config
- `backend/functions/Dockerfile` - Container (if using Cloud Run)
- `.firebaserc` - Firebase project config

**Time Estimate:** 2-3 hours

---

### 2.9 Basic Authentication (Optional for Alpha)

**Goal:** Simple auth to prevent public access during testing

**Tasks:**
- [ ] Implement simple email/password auth OR
- [ ] Use Firebase Auth with Google SSO (lightweight setup)
- [ ] Protect Marketing Dashboard routes
- [ ] Keep Agency Upload public
- [ ] Add login/logout UI

**Time Estimate:** 3-4 hours
**Priority:** Medium (can defer if time-constrained)

---

## 🚀 Alpha Launch Checklist

### Pre-Launch
- [ ] Database seeded with mock data (250+ trends)
- [ ] All API endpoints functional
- [ ] Frontend connected to backend
- [ ] Agency upload processing files
- [ ] Nyan Cat integration ready
- [ ] Scoring algorithm working
- [ ] Deployed to accessible URL
- [ ] Tested on multiple browsers
- [ ] Basic auth in place (optional)

### Launch Day
- [ ] Share URL with stakeholders
- [ ] Prepare demo script
- [ ] Monitor logs for errors
- [ ] Collect partner feedback

### Partner Discussions
- [ ] **Search Team** - Discuss API integration requirements
- [ ] **Nyan Cat Team** - Test data flow and format
- [ ] **Agency Partners** - Demo upload process
- [ ] **Music Team** - Discuss submission workflow

---

## 📊 Alpha Feature Matrix

| Feature | Status | Alpha Requirement |
|---------|--------|-------------------|
| Marketing Dashboard | ✅ Complete | Required |
| Agency Upload Portal | ✅ UI Ready | Required (backend needed) |
| Top 10 Trends Display | ✅ Complete | Required |
| Deep Dive Table | ✅ Complete | Required |
| Scoring Settings | ✅ UI Ready | Required (backend needed) |
| Archive View | ✅ Complete | Optional |
| Trend Approval | ✅ UI Ready | Required (backend needed) |
| Mock Data | ⏳ Needed | **CRITICAL** |
| Agency File Processing | ⏳ Needed | **CRITICAL** |
| Nyan Cat Integration | ⏳ Needed | **CRITICAL** |
| Ranking Algorithm | ⏳ Needed | **CRITICAL** |
| Web Deployment | ⏳ Needed | **CRITICAL** |
| **Gemini 3.0 Integration** | ⏳ Needed | **CRITICAL** |
| Search API | 🔴 Blocked | Defer to Post-Alpha |
| Music Team Upload | ⏳ Needed | Required |
| Firebase Auth | ⏳ Optional | Nice-to-Have |
| MCP Bridge | 🔴 Defer | Post-Alpha |
| Auto-Archiving | 🔴 Defer | Post-Alpha |

---

## ⚡ Critical Path to Alpha (Priority Order)

1. **Mock Data Seeding** ← Do this first (quick win)
2. **API Implementation** ← Connect everything
3. **Frontend Integration** ← Remove mock data
4. **Gemini 3.0 Integration** ← **CRITICAL** for normalization & deduplication
5. **Scoring Algorithm** ← Show the magic
6. **Agency Upload Processing** ← Partner demo feature
7. **Deployment** ← Make it accessible
8. **Nyan Cat Integration** ← Test with real data
9. **Polish & Testing** ← Make it demo-ready

---

## 🎯 Success Criteria for Alpha Launch

### Must Have
✅ Live web app accessible via URL
✅ Database with 250+ mock trends (50 per market)
✅ All 4 dashboard tabs functional with real data
✅ **Gemini 3.0 normalization and deduplication working**
✅ Agency upload accepts and processes files
✅ Scoring algorithm visible and adjustable
✅ Nyan Cat data can be ingested
✅ Partner demo script prepared

### Nice to Have
⏳ Basic authentication
⏳ Music team upload flow
⏳ Error monitoring/logging
⏳ Custom domain name

### Defer to Post-Alpha
🔴 Search API integration (pending partner discussion)
🔴 MCP Bridge to Agent Collective
🔴 Auto-archiving logic
🔴 Weekly refresh scheduler

---

## 📅 Estimated Timeline

**Total Time to Alpha:** 28-38 hours of development

**Suggested Sprint:**
- **Days 1-2:** Mock data + API implementation
- **Days 3-4:** Gemini 3.0 integration (normalization + deduplication)
- **Days 5-6:** Frontend integration + scoring algorithm
- **Day 7:** Agency upload + Nyan Cat integration
- **Day 8:** Deployment + final testing

**Fast-Track (if needed):** Could launch in 4-5 days with focused effort

**Critical Addition:** Gemini integration adds 6-8 hours to timeline but is essential for demo

---

## 🔄 Post-Alpha (After Partner Discussions)

Based on partner feedback:
1. Integrate Search API (when ready)
2. Finalize Nyan Cat data format
3. Refine Gemini 3.0 prompts based on real data
4. Implement MCP Bridge
5. Add automation (weekly refresh, auto-archive)
6. Production hardening
7. Scale testing

---

## 📞 Decision Points / Blockers

### Need from User:
1. **Nyan Cat Data Format** - Sample data file for testing
2. **Deployment Preference** - Firebase vs Cloud Run?
3. **Auth Required?** - Password-protect Alpha or keep open?
4. **Custom Domain?** - Use Firebase domain or custom URL?
5. **Music Team Format** - How do they want to submit?

### Waiting On:
- Search API connection details (will update post-Alpha)
- Nyan Cat team coordination
- Agency partner data samples

---

## 🚀 Ready to Start Phase 2?

When you're ready, we can:
1. Start with mock data seeding (quick 2-hour win)
2. Implement core API endpoints
3. Connect frontend to backend
4. Get to Alpha launch ASAP

**Question for you:**
- Do you want to proceed with Phase 2 now?
- Any preference on Firebase vs Cloud Run for deployment?
- Should we add basic auth for Alpha or keep it open?

---

**Let's get to Alpha! 🚀**
