# Business Requirements Document - Shorts Intel Hub

**Project Name:** APAC Shorts Intel Hub (Project Animaniacs)

**Target Launch:** Late January 2026 (SLC - Simple, Lovable, Complete)

**Author & Contributors:** Ivan Ho (ivho@google.com), Darren Ngatimin (dngatimin@google.com)

**Last updated:** Dec 12, 2025

---

## 1. Executive Summary

We know the formula that works for shorts in APAC: serving audience relevant content drives engagement. As YouTube APAC shifts its 2026 operational model to "1-week GTM" (via Animaniacs & Nitrate Express), the current manual and fragmented intelligence gathering process needs to evolve. The Shorts Intel Hub will solve this by creating a centralized, automated pipeline that aggregates, standardizes, and ranks topical content from multiple sources.

This Hub serves two masters: Human Strategists (Country Shorts Marketing Managers) for curation, and AI Agents (Agent Collective) for execution. The goal is to drive incremental Shorts viewership by reducing the time-to-insight and ensuring creative briefs are built on validated, high-velocity topics.

---

## 2. Project Overview

### 2.1 Background & Problem Statement

Currently, teams gather intelligence via various sources ("LEGOs" Data, ad-hoc Agency reports, Music team shared data). This process is non-standardized, and creates friction for the new automated content creation workstreams. To capitalize on the speed of Animaniacs & Nitrate Express, we require a systematic feed of "Ready-to-Brief" topics that are relevant weekly to target demos. Trend GTM formats and LEGO categories are too broad categories and we need more nuanced topic details to feed into the automation process.

### 2.2 Business Objectives

* **Primary Goal:** Establish a "One-Stop Shop" for demo-split trending topical content that is accessible via UI (for humans) and API (for machines).
* **Operational Success:** Reduce topics sourcing time from days to minutes.
* **Business Success:** Increase CTR and View Incrementality of campaigns generated via Hub insights.

### 2.3 Scope

* **In-Scope:** Data ingestion (Search, Nyan Cat, Agency, Music team), AI-powered data standardization (Gemini 3.0), Ranking Logic, Manager Approval UI, and JSON push to Agent Collective.
* **Out-of-Scope:** Creative asset generation (this happens downstream in Agent Collective/Nitrate)

---

## 3. Functional Requirements

**All below proposed metrics are hypothetical & unvalidated, plan for topic test runs in v1 for metric fine tuning.**

### 3.1 Data Ingestion (The Sources)

The system must ingest data from four primary streams:

1. **YouTube Search Data:** Automated pipeline pulling query trends. (Intake from API) - **TBC later**
2. **"Nyan Cat" Pipeline:** Internal feed filtering weekly YouTube videos for relevance. (Intake from MCP) - **TBC later**
3. **Competitive Intel (Agency):** Weekly consolidated topics from TikTok & Instagram. (Intake from manual entry)
   * *Mechanism:* External-facing upload UI OR a dedicated email alias for parsing.
4. **Music Partnership:** Artist and song lists provided by the internal music team. (Intake from manual entry)

### 3.2 Data Processing & Standardization (The Engine)

Raw data from the above sources is unstructured. The system must use **Gemini 3.0** to:

* **Normalize:** Convert disparate inputs into a standard Schema (see Section 4).
* **Deduplicate:** Merge similar trends appearing across multiple sources.
* **Clean:** Remove irrelevant noise or non-compliant content.

### 3.3 Ranking & Scoring Logic

The system must rank topics based on a weighted importance score.

* **Metrics:** Velocity of Views, Creation Rate, and Watchtime.
* **Segmentation:** Ranking must be calculated per **Target Demo** (6 demos per country: Male 18-24, 25-34, 35-44 / Female 18-24, 25-34, 35-44).
* **Weighting:** Define during test run phase for v1 of the app (configurable).
* **Platform Normalization:** Metrics may come from different platforms, system must adjust and weight to compare.

### 3.4 Expiry Logic (The Lifecycle)

To ensure freshness for the 1-week GTM cycle, topics must automatically expire based on two conditions:

1. **Inception Age:** Any topic >3 weeks from its first appearance is expired and archived.
2. **Velocity Peak:** Topics where the growth rate (1st derivative of views/creation) has turned negative (diminishing returns) are flagged or deprecated.

**Archival & Deletion:**
- Expired topics (>3 weeks): **Archived**
- Topics >2 years: **Delete with user approval notification**

### 3.5 User Interface (The Agency & Human Layer)

**3.5.1 Target Users:** Country Managers (JP, KR, IN, ID, AUNZ)

This is the primary audience for using the finalized analyzed data. They will be the decision makers to use the data for creating campaigns.

* **Market Selector:** Dropdown to switch views between countries (Open visibility; anyone can view any market).
* **The List View:**
  * **Top 10 Shortlist:** The default view showing the highest-ranked trends per Target Demo.
  * **The Long Tail:** An expandable section showing lower-ranked ideas for reference/comparison.
* **Actionability:**
  * **"One-Click" Approval:** A specific button to "Select" a trend.
  * **Trigger:** selection immediately queues the trend for the **Agent Collective**.
* **Weekly Refresh:** Data refreshes every **Monday at 6:00 AM per market local time** (user-adjustable).

**3.5.2 Target Users:** Agency teams (APAC, JP, KR, IN, ID, AUNZ)

This web app needs to service the agency teams who will be supporting the weekly data input for manual data sources as defined in 3.1.

* MD files with template example available as resource to guide agency
* Easy drag and drop option and ability to see log of what has been loaded for ease of tracking
* **Does not require login auth**, so external agency can manage this support work for data input (fully open)

### 3.6 Integration (The Machine Layer)

* **Destination:** Agent Collective (Application/Tool).
* **Mechanism:** MCP Bridge (Model Context Protocol) via Push (already built).
* **Format:** Structured JSON/API feed containing the approved Topic Schema.
* **Note:** May need refinement during test run phase.

---

## 4. Data Model (The Schema)

Every trend passed to the Agent Collective must adhere to this structure:

| Field Name       | Type   | Requirement  | Description                                      |
|------------------|--------|--------------|--------------------------------------------------|
| **Topic Name**   | String | **Mandatory**| The headline of the trend.                       |
| **Description**  | Text   | **Mandatory**| Context on *why* it is trending and what the content entails. |
| **Target Demo**  | String | **Mandatory**| Specific audience segment (e.g., "Females 18-24"). |
| **Reference Link**| URL   | **Mandatory**| Link to a representative video or source.        |
| **Hashtags**     | List   | Optional     | Relevant tags for metadata.                      |
| **Audio**        | String | Optional     | Specific song or audio ID associated with the trend. |

---

## 5. Non-Functional Requirements

### 5.1 Technology Stack (Mandatory)

* **Frontend/Hosting:** Firebase.
* **Backend/Data:** Google Cloud Platform (GCP).
* **Database:** Cloud SQL (PostgreSQL with pgvector for vector database support).
* **AI/LLM:** Gemini 3.0 (via Google AI APIs).

### 5.2 Performance & Availability

* **Refresh Rate:** Data must refresh weekly, specifically **Mondays at 06:00 AM** per market local time (user-adjustable).
* **Latency:** UI must load Top 10 lists in under 2 seconds.

### 5.3 Security & Access Control

* **Internal Users:** SSO (Single Sign-On) via Firebase Auth with Google for all Google employees.
* **Build Strategy:** Build auth LAST - do not let auth hinder build phase and test phase for rest of app work.
* **External (Agency):** **Fully open access** - no authentication required. They can input data (via upload) but cannot view the dashboard or internal rankings.

---

## 6. Glossary

* **SLC:** Simple, Lovable, Complete (The development target state, distinct from a bare-bones MVP).
* **Nyan Cat:** Internal pipeline for filtering YouTube video content.
* **MCP Bridge:** The Model Context Protocol connection used to feed data to AI agents.
* **GTM:** Go-to-Market.
* **Demo:** Demographic segment (age + gender combination).

---

## 7. Target Markets & Demographics

### Markets (5)
- 🇯🇵 Japan (JP)
- 🇰🇷 Korea (KR)
- 🇮🇳 India (IN)
- 🇮🇩 Indonesia (ID)
- 🇦🇺🇳🇿 Australia/New Zealand (AUNZ)

### Demographics (6 per market)
- **Male:** 18-24, 25-34, 35-44 years
- **Female:** 18-24, 25-34, 35-44 years

**Total segments:** 30 (5 markets × 6 demos)

---

## 8. Development Priorities

1. **Manual data ingestion** (Agency + Music upload) - Week 1-2
2. **AI processing** (Gemini 3.0 normalization) - Week 3-4
3. **Ranking system** (configurable weights) - Week 5-6
4. **Manager dashboard** (UI for approval) - Week 6-7
5. **Weekly scheduler** (Monday 6 AM refresh) - Week 7-8
6. **MCP Bridge integration** (push to Agent Collective) - Week 8
7. **Testing & refinement** - Week 8-9
8. **Documentation & training** - Week 9
9. **Authentication** (Firebase SSO) - Week 10 (POST-CORE)

---

## 9. Success Criteria

**Operational:**
- Reduce topic sourcing time from days to minutes ✅
- Weekly data refresh on schedule ✅
- Manager approval <30 seconds per topic ✅

**Business:**
- Increase CTR (track post-launch, baseline TBD)
- Increase View Incrementality (track post-launch, baseline TBD)
- Manager satisfaction score >4/5

**Technical:**
- API response time <2 seconds for Top 10 list
- Database uptime 99.9%
- Data accuracy >95% (validated by managers)

---

**Built with Gus, Dice & Marco** 🤖
