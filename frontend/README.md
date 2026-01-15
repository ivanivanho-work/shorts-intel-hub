# Shorts Intel Hub - Frontend

React + TypeScript frontend application for the Shorts Intel Hub APAC marketing intelligence platform.

## 🎯 Overview

This is the frontend UI for the Shorts Intel Hub, providing:

- **Marketing Dashboard** - Full-featured country manager view with 4 tabs
- **Agency Upload Portal** - Public form for external data submission
- **Dark Theme** - YouTube-inspired design with red accent colors
- **Responsive Layout** - Works on desktop and tablet
- **Type-Safe** - Full TypeScript support with shared interfaces

## 📋 Prerequisites

- Node.js 18+
- npm 8+
- Access to the backend API (see backend/README.md)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and set your API URL:

```bash
VITE_API_BASE_URL=http://localhost:3000/api
```

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3001`

### 4. Build for Production

```bash
npm run build
```

Build output will be in the `dist/` directory.

## 📂 Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── App.tsx                     # Main app component
│   │   └── components/
│   │       ├── MarketingDashboard.tsx  # Country manager dashboard
│   │       ├── AgencyUpload.tsx        # Agency upload form
│   │       ├── TrendCard.tsx           # Individual trend card
│   │       ├── StatsDashboard.tsx      # Summary statistics
│   │       ├── DeepDiveView.tsx        # Comprehensive data table
│   │       ├── ScoringSettings.tsx     # Weighted scoring config
│   │       ├── ArchiveView.tsx         # Historical data view
│   │       └── ui/                     # Radix UI components
│   ├── services/
│   │   └── api.ts                      # API service layer
│   ├── types/
│   │   └── index.ts                    # TypeScript type definitions
│   ├── styles/
│   │   ├── theme.css                   # Dark theme variables
│   │   ├── tailwind.css                # Tailwind imports
│   │   └── index.css                   # Global styles
│   └── main.tsx                        # Application entry point
│
├── index.html                          # HTML template
├── vite.config.ts                      # Vite configuration
├── tsconfig.json                       # TypeScript configuration
└── package.json                        # Dependencies

```

## 🎨 Features

### Marketing Dashboard (Authenticated Users)

**Tab 1: Top Topics & Trends**
- Summary statistics (Total Active Trends, Approved This Week)
- Top 10 ranked trends for selected market
- Long tail ideas (collapsible)
- Trend approval functionality
- Filtering by market and target demographic

**Tab 2: Deep Dive**
- Comprehensive data table from all sources
- Filter by data source (Search, Nyan Cat, Agency, Music)
- Performance metrics (views, watchtime, velocity)
- Age tracking with auto-expire warnings

**Tab 3: Scoring Settings**
- Adjust weighted ranking algorithm
- Six configurable weights (must sum to 100%)
- Real-time weight total calculation
- Save settings per market

**Tab 4: Archive**
- Historical trend data
- Filter by date range and source
- Export capabilities

### Agency Upload Portal (Public Access)

- No authentication required
- Simple form for competitive intelligence
- Real-time validation
- Success confirmation with submission ID
- Upload template download

## 🔧 Available Scripts

```bash
# Start development server on port 3001
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check without building
npm run type-check
```

## 🌐 API Integration

The frontend connects to Marco's backend API endpoints:

```
GET  /api/trends                    # Fetch trends
POST /api/trends/:id/approve        # Approve trend
GET  /api/trends/archive            # Get archived trends
GET  /api/scoring-settings          # Get scoring weights
POST /api/scoring-settings          # Update scoring weights
POST /api/agency-upload             # Submit agency data
GET  /api/stats                     # Get dashboard statistics
```

See `src/services/api.ts` for complete API integration.

## 🎨 Design System

### Colors

- Background: `#0f0f0f` (Dark charcoal)
- Cards: `#1a1a1a`
- Primary (YouTube Red): `#FF0000`
- Borders: `#3a3a3a`

### Yellow Glow Panel

The navigation controls are housed in a semi-transparent yellow-tinted panel for visual hierarchy.

### Typography

- System font stack for performance
- Consistent spacing and hierarchy
- Medium weight (500) for headings and labels

## 📦 Key Dependencies

- **React 18.3.1** - UI framework
- **TypeScript 5.x** - Type safety
- **Vite 6.3.5** - Build tool
- **Tailwind CSS v4.1.12** - Styling
- **Lucide React 0.487.0** - Icons
- **Radix UI** - Accessible component primitives

## 🔐 Authentication

Currently, the app is set up for:
- **Country Marketing Managers** - Will use Firebase Auth with Google SSO (to be implemented)
- **Agency/External Users** - No authentication required for upload portal

Authentication will be implemented in Phase 3 (per BRD).

## 🚢 Deployment

### Firebase Hosting (Recommended)

```bash
# Build the app
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

### Cloud Storage + Cloud CDN

```bash
# Build the app
npm run build

# Upload to Cloud Storage
gsutil -m cp -r dist/* gs://your-bucket-name/

# Configure as static website
```

## 🧪 Testing Recommendations

```bash
# Component tests (to be added)
- MarketingDashboard renders correctly
- Filters update trend list
- Approval button updates state
- Tabs switch correctly

# Integration tests (to be added)
- API calls succeed/fail gracefully
- Error states display properly
- Loading states show/hide correctly
```

## 🐛 Known Issues

- None currently - fresh build from UX design export

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:3000/api` |

## 🤝 Integration with Backend

This frontend is designed to work with Marco's backend:

1. Start the backend server (see `backend/README.md`)
2. Ensure the backend is running on `http://localhost:3000`
3. Start the frontend dev server
4. The frontend will proxy `/api` requests to the backend

## 📊 Markets Supported

- 🇯🇵 **JP** - Japan
- 🇰🇷 **KR** - South Korea
- 🇮🇳 **IN** - India
- 🇮🇩 **ID** - Indonesia
- 🇦🇺🇳🇿 **AUNZ** - Australia & New Zealand

## 🎯 Demographics Supported

- Males / Females
- Age groups: 18-24, 25-34, 35-44

## 📖 Additional Documentation

- [Main Project README](../README.md)
- [Backend Documentation](../backend/README.md)
- [Database Setup](../backend/database/README.md)
- [API Documentation](../backend/functions/README.md)

## 🆘 Troubleshooting

### Port 3001 already in use

```bash
# Kill the process using port 3001
lsof -ti:3001 | xargs kill -9

# Or specify a different port
npm run dev -- --port 3002
```

### API connection errors

1. Check that backend is running on port 3000
2. Verify `VITE_API_BASE_URL` in `.env.local`
3. Check browser console for CORS errors

### Build errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf dist .vite
npm run build
```

## 🚀 Next Steps

1. ✅ Frontend UI complete with mock data
2. ✅ API service layer ready
3. ⏳ Connect to Marco's live backend APIs
4. ⏳ Replace mock data with real API calls
5. ⏳ Implement Firebase Authentication (Phase 3)
6. ⏳ Add error boundaries and loading states
7. ⏳ Implement real-time updates
8. ⏳ Add unit and integration tests

## 📞 Support

For issues or questions:
- Check the main [PROJECT_PLAN.md](../PROJECT_PLAN.md)
- Review [GETTING_STARTED.md](../GETTING_STARTED.md)
- Contact the development team

---

**Built with ❤️ by Dice (Frontend Agent) for the Shorts Intel Hub project**
