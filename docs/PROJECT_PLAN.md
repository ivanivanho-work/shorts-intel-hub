# Shorts Intel Hub - Development Plan

**Project:** APAC Shorts Intel Hub (Project Animaniacs)
**Target Launch:** Late January 2026
**Development Approach:** SLC (Simple, Lovable, Complete)
**Agent Team:** Gus (Coordinator), Dice (Frontend), Marco (Backend)

---

## Phase Breakdown

### Phase 1: Foundation & Setup (Week 1-2)

**Goal:** Establish project infrastructure, database, and basic scaffolding

#### Gus Coordinates:
- Project initialization
- Repository structure
- Development environment setup
- Daily backup to GitHub (10 PM)

#### Marco (Backend) Tasks:
1. **Database Design & Setup**
   - Design Cloud SQL PostgreSQL schema
   - Set up pgvector extension for vector embeddings
   - Create tables: topics, archives, metadata, users
   - Implement indexes for performance
   - Create database migration scripts

2. **GCP Infrastructure**
   - Set up Cloud Functions project
   - Configure Cloud SQL instance
   - Set up Cloud Scheduler
   - Configure service accounts and IAM
   - Set up Cloud Storage for uploads

3. **API Foundation**
   - Create REST API structure
   - Health check endpoints
   - Basic CRUD for topics
   - Error handling middleware
   - Logging and monitoring setup

#### Dice (Frontend) Tasks:
1. **Project Scaffolding**
   - Initialize React app with TypeScript
   - Set up Firebase Hosting
   - Configure routing (React Router)
   - Set up Tailwind CSS / Material-UI
   - Create base layout components

2. **Design System**
   - Define color palette and typography
   - Create reusable UI components (buttons, cards, etc.)
   - Build responsive layouts
   - Create navigation components

3. **Two Main Interfaces**
   - Manager Dashboard shell
   - Agency Upload Portal shell
   - Market selector component
   - Demo filter component

**Deliverables:**
- ✅ Git repository with structure
- ✅ Cloud SQL database live
- ✅ Frontend scaffolding deployed
- ✅ Basic API endpoints working

---

### Phase 2: Manual Data Ingestion (Week 3-4)

**Goal:** Enable agencies and music team to manually upload data

#### Marco (Backend) Tasks:
1. **File Upload System**
   - Cloud Storage upload endpoint
   - File validation (MD, JSON, CSV)
   - Parse uploaded files
   - Store raw data in database
   - Upload history tracking

2. **Data Validation**
   - Schema validation for incoming data
   - Duplicate detection (basic)
   - Error reporting to users
   - Data quality metrics

3. **Manual Entry API**
   - POST endpoint for topic creation
   - Bulk upload support
   - Field validation
   - Response with upload status

#### Dice (Frontend) Tasks:
1. **Agency Upload UI**
   - Drag-and-drop file upload interface
   - MD template download button
   - Upload progress indicator
   - Upload history table
   - Success/error notifications

2. **File Upload UX**
   - File preview before upload
   - Validation feedback
   - Upload queue management
   - Error handling and retry

3. **MD Template Generator**
   - Downloadable MD template with examples
   - Field descriptions and guidelines
   - Sample data for reference

**Deliverables:**
- ✅ Agency upload portal functional
- ✅ File parsing working
- ✅ MD template available
- ✅ Upload history visible

---

### Phase 3: AI Processing Engine (Week 4-5)

**Goal:** Implement Gemini 3.0 for data normalization, deduplication, cleaning

#### Marco (Backend) Tasks:
1. **Gemini 3.0 Integration**
   - Set up Google AI API client
   - Create prompt templates for normalization
   - Implement data standardization pipeline
   - Handle API rate limits and retries
   - Cost tracking and optimization

2. **Vector Embeddings**
   - Generate embeddings for each topic
   - Store in pgvector
   - Implement similarity search
   - Deduplication logic (cosine similarity threshold)
   - Merge similar topics

3. **Data Cleaning**
   - Content policy checks
   - Remove irrelevant noise
   - Extract metadata (hashtags, audio)
   - Validate URLs
   - Language detection per market

4. **Processing Pipeline**
   - Queue system for batch processing
   - Progress tracking
   - Error recovery
   - Audit logging

**Deliverables:**
- ✅ Gemini 3.0 normalizing data
- ✅ Deduplication working
- ✅ Clean topics in database

---

### Phase 4: Ranking & Scoring System (Week 5-6)

**Goal:** Implement ranking algorithm with configurable weights

#### Marco (Backend) Tasks:
1. **Ranking Algorithm**
   - Calculate velocity score (views growth rate)
   - Calculate creation rate score
   - Calculate watchtime score
   - Weighted scoring formula (configurable)
   - Per-demo ranking (6 demos × 5 markets)

2. **Metrics Normalization**
   - Handle missing metrics
   - Platform-specific adjustments
   - Percentile-based scoring
   - Time-decay for freshness

3. **Configuration System**
   - Admin API for weight tuning
   - A/B testing support (future)
   - Store weight configurations
   - Apply weights per market/demo

4. **Expiry Logic**
   - Auto-expire topics >3 weeks old
   - Detect negative velocity trends
   - Archive expired topics
   - Deletion scheduler (>2 years, with approval)

#### Dice (Frontend) Tasks:
1. **Weight Configuration UI** (Admin Panel)
   - Sliders for weight adjustment
   - Real-time preview of ranking changes
   - Save/load configurations
   - Reset to defaults

**Deliverables:**
- ✅ Ranked topics per demo/market
- ✅ Configurable weights
- ✅ Expiry logic working

---

### Phase 5: Manager Dashboard (Week 6-7)

**Goal:** Build main UI for country managers to view and approve topics

#### Dice (Frontend) Tasks:
1. **Market Selector**
   - Dropdown for 5 markets (JP, KR, IN, ID, AUNZ)
   - Persist selection in URL/localStorage
   - Load market-specific data
   - Market switching UX

2. **Demo Filter**
   - 6 demographic checkboxes (Male/Female 18-24, 25-34, 35-44)
   - Multi-select support
   - Filter topics by selected demos
   - Show counts per demo

3. **Top 10 Shortlist View**
   - Card-based layout for top 10 topics
   - Display: Topic name, description, demo, score
   - Reference link (YouTube embed preview)
   - Hashtags and audio metadata
   - Sort by rank

4. **Long Tail View**
   - Expandable section for lower-ranked topics
   - Pagination or infinite scroll
   - Same card layout as Top 10
   - Filter and search

5. **One-Click Approval**
   - "Approve & Send to Agent Collective" button
   - Confirmation dialog
   - Visual feedback (animation, checkmark)
   - Approval history

6. **Topic Detail Modal**
   - Detailed view of topic
   - All metadata displayed
   - Reference video player
   - Edit capability (minor tweaks)
   - Approval history

#### Marco (Backend) Tasks:
1. **Dashboard API**
   - GET /api/topics (with filters: market, demo, status)
   - GET /api/topics/:id (single topic detail)
   - POST /api/topics/:id/approve (approval endpoint)
   - GET /api/markets (list of markets)
   - GET /api/demos (list of demographics)

2. **Approval Workflow**
   - Record approval in database
   - Trigger MCP Bridge push
   - Update topic status
   - Send notification to Agent Collective

**Deliverables:**
- ✅ Manager dashboard fully functional
- ✅ Approval workflow working
- ✅ Topics pushed to Agent Collective

---

### Phase 6: Weekly Scheduler (Week 7-8)

**Goal:** Automate weekly data refresh on Mondays 6:00 AM per market

#### Marco (Backend) Tasks:
1. **Cloud Scheduler Setup**
   - Create cron jobs for each market (5 jobs)
   - Monday 6:00 AM per market local time
   - Trigger data refresh function
   - Error handling and retries

2. **Refresh Pipeline**
   - Re-process all active topics
   - Recalculate ranks
   - Update expiry status
   - Archive expired topics
   - Send summary email to managers

3. **User-Configurable Scheduler**
   - Admin API to adjust refresh time per market
   - Update Cloud Scheduler dynamically
   - Store preferences in database
   - Validate cron expressions

#### Dice (Frontend) Tasks:
1. **Scheduler Configuration UI**
   - Per-market time selector
   - Timezone display
   - Save settings button
   - Next refresh countdown

**Deliverables:**
- ✅ Weekly refresh automated
- ✅ User can adjust timing
- ✅ Expiry/archival working

---

### Phase 7: MCP Bridge Integration (Week 8)

**Goal:** Connect to Agent Collective via MCP Bridge

#### Marco (Backend) Tasks:
1. **MCP Bridge Connection**
   - Understand existing MCP Bridge API
   - Implement JSON push on approval
   - Format topic data per schema
   - Handle push failures (retry logic)
   - Log all pushes

2. **JSON Schema Mapping**
   - Map internal fields to MCP schema
   - Include all 6 mandatory fields
   - Add optional metadata
   - Validate before push

3. **Webhook/Callback**
   - Receive confirmation from Agent Collective
   - Update topic status (sent/acknowledged)
   - Track campaign creation downstream

**Deliverables:**
- ✅ Topics pushed to Agent Collective
- ✅ End-to-end flow working

---

### Phase 8: Testing & Refinement (Week 8-9)

**Goal:** End-to-end testing, bug fixes, performance optimization

#### Gus Coordinates:
- Test plan creation
- Bug tracking
- Performance benchmarking
- Documentation review

#### Marco (Backend) Tasks:
1. **Performance Optimization**
   - Database query optimization
   - Add caching (Redis if needed)
   - API response time improvement
   - Batch processing optimization

2. **Error Handling**
   - Comprehensive error logging
   - User-friendly error messages
   - Retry mechanisms
   - Monitoring and alerts

3. **Testing**
   - Unit tests for all functions
   - Integration tests for API
   - Load testing
   - Security review

#### Dice (Frontend) Tasks:
1. **UI/UX Refinement**
   - Responsive design fixes
   - Loading states and spinners
   - Empty states
   - Error message displays

2. **Testing**
   - Component tests
   - E2E tests (Cypress/Playwright)
   - Cross-browser testing
   - Mobile responsiveness

3. **Accessibility**
   - ARIA labels
   - Keyboard navigation
   - Screen reader support
   - Contrast and readability

**Deliverables:**
- ✅ All tests passing
- ✅ Performance targets met
- ✅ No critical bugs

---

### Phase 9: Documentation & Training (Week 9)

**Goal:** Prepare for launch with complete documentation

#### Gus Coordinates:
1. **User Documentation**
   - Manager dashboard guide
   - Agency upload instructions
   - MD template explanation
   - Troubleshooting FAQ

2. **Technical Documentation**
   - API documentation (Swagger/OpenAPI)
   - Architecture diagrams
   - Database schema docs
   - Deployment guide

3. **Training Materials**
   - Video tutorials
   - Screenshot guides
   - Sample data for demo
   - Onboarding checklist

**Deliverables:**
- ✅ Complete documentation
- ✅ Training materials ready
- ✅ Demo environment live

---

### Phase 10: Authentication & Security (Week 10 - POST-CORE)

**Goal:** Add Firebase Auth with Google SSO (build LAST to not block testing)

#### Marco (Backend) Tasks:
1. **Firebase Auth Setup**
   - Configure Firebase Auth
   - Set up Google SSO
   - Middleware for protected routes
   - User session management

2. **Access Control**
   - Role-based permissions (admin, manager, viewer)
   - Market-based access control
   - Audit logging for sensitive actions

3. **Security Hardening**
   - API rate limiting
   - CORS configuration
   - SQL injection prevention
   - XSS protection

#### Dice (Frontend) Tasks:
1. **Auth UI**
   - Google sign-in button
   - Login page
   - Session persistence
   - Logout functionality

2. **Protected Routes**
   - Auth guards on manager dashboard
   - Redirect to login if unauthenticated
   - Handle token expiry

**Deliverables:**
- ✅ SSO working for internal users
- ✅ Agency upload still public
- ✅ Security review passed

---

## Launch Checklist

**Pre-Launch (Late January 2026):**
- [ ] All features tested and working
- [ ] Documentation complete
- [ ] Training sessions scheduled
- [ ] Monitoring and alerts configured
- [ ] Backup and disaster recovery plan
- [ ] Performance benchmarks met
- [ ] Security review completed
- [ ] User acceptance testing passed

**Launch Day:**
- [ ] Deploy to production
- [ ] Enable Cloud Scheduler
- [ ] Send launch announcement
- [ ] Monitor for issues
- [ ] On-call support ready

**Post-Launch (Week 1-2):**
- [ ] Gather user feedback
- [ ] Monitor metrics (CTR, view incrementality)
- [ ] Tune ranking weights based on test results
- [ ] Address bug reports
- [ ] Plan Phase 2 enhancements

---

## Risk Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Gemini 3.0 API rate limits | High | Medium | Implement queue, batch processing, caching |
| YouTube Search API access delayed | Medium | High | Proceed with manual sources, add API later |
| Nyan Cat integration delayed | Medium | High | Proceed with manual sources, add later |
| Database performance issues | High | Low | Index optimization, read replicas if needed |
| Auth blocking development | Medium | Medium | Build auth LAST, use mock auth in testing |
| Ranking weights not optimal | Medium | High | Plan for test phase tuning, make configurable |
| MCP Bridge format mismatch | High | Low | Validate early with Agent Collective team |

---

## Success Metrics

**Operational:**
- Topic sourcing time: Days → Minutes ✅
- Data refresh: Weekly on schedule ✅
- Manager approval: <30 seconds per topic ✅

**Business:**
- CTR increase: Track post-launch (baseline TBD)
- View incrementality: Track post-launch (baseline TBD)
- Manager satisfaction: Survey post-launch

**Technical:**
- API response time: <2 seconds for Top 10 list
- Database uptime: 99.9%
- Data accuracy: >95% (validated by managers)

---

## Daily Workflow (Gus Auto-Backup)

Gus automatically backs up project progress:
- **Time:** 10 PM daily
- **Destination:** https://github.com/ivanivanho-work/shorts-intel-hub.git
- **Includes:** Code changes, status summaries, activity logs
- **Format:** Git commits with detailed messages

---

**Let's build this! 🚀**
