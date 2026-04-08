# NekoNest — Expense Tracker with Cat Companion

A single-page expense tracking application where a virtual cat reacts to your spending habits. Built with React, Node.js/Express, and MongoDB.

## Problem Statement

Managing personal finances is often tedious and easy to neglect. NekoNest makes expense tracking engaging by pairing it with an animated cat companion whose mood changes based on your financial health — overspend and the cat gets angry, save well and it shows love. This emotional feedback loop encourages healthier spending habits.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 (Vite) |
| Styling | CSS-in-JS (inline styles) + global CSS, custom design tokens |
| Routing | Client-side tab navigation (no external router needed for SPA) |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas (cloud) via `mongodb` driver |
| Build Tool | Vite |
| Linting | ESLint with React and Node.js configs |

## Features

- **Full CRUD** — Create, read, update, and delete expense/income entries with title, category, amount, date, and description
- **Animated Cat Companion** — 5 video states (Welcome, Relaxed, Happy, Shocked, Angry) that react to your financial status in real-time
- **Inline Budget Editing** — Click the weekly budget in the cat card to edit it directly
- **Monthly Expenditure Trends** — Pie chart visualization of spending over the past 6 months
- **Category Breakdown** — Card grid showing spending per category with icons and percentages
- **Top 3 Spending Categories** — Horizontal bar chart highlighting biggest expense areas
- **Split Bill** — Split expenses equally or manually among participants, with a shareable receipt-style preview card and unique Pay ID
- **Search Records** — Search transactions by amount, title, category, or description
- **Responsive Layout** — Mobile-friendly design with max-width constraint and flexible components
- **Interactive Buttons** — All buttons have hover and active press feedback (color change + scale animation)
- **Delete Confirmation** — Prevents accidental deletion with a confirmation dialog
- **Welcome Onboarding** — First-time users see an animated welcome modal with the cat walking

## Folder Structure

```
neko-nest/
├── server/                  # Backend (Node.js + Express)
│   ├── index.js             # Express server entry point, middleware, MongoDB connection
│   ├── db.js                # MongoDB connection utility (connectDB, getDB)
│   └── routes/
│       ├── transactions.js  # CRUD + monthly trends aggregation endpoints
│       └── settings.js      # Weekly budget read/update endpoints
├── src/                     # Frontend (React)
│   ├── main.jsx             # App entry point
│   ├── App.jsx              # Root component, state management, API orchestration
│   ├── index.css            # Global styles, button classes (.btn-action, .btn-edit, etc.)
│   ├── App.css              # Additional app-level styles
│   ├── assets/              # Cat video files (mp4) and static images
│   ├── components/          # Reusable UI components
│   │   ├── CatCard.jsx      # Cat video + mood + budget stats card
│   │   ├── TabBar.jsx       # Bottom navigation bar
│   │   ├── CharacterOnboarding.jsx  # Welcome modal with cat video
│   │   └── characterIntroState.js   # localStorage helper for onboarding state
│   ├── views/               # Page-level view components
│   │   ├── HomeView.jsx     # Transaction form, recent records with search
│   │   ├── InsightsView.jsx # Summary, pie chart, category cards, top 3 bar chart
│   │   └── SplitView.jsx    # Bill splitting form + receipt preview
│   ├── domain/              # Business logic (pure functions, no UI)
│   │   ├── catState.js      # Cat mood evaluation with priority-based state machine
│   │   ├── summary.js       # Weekly/monthly income, expense, balance computation
│   │   └── split.js         # Bill split calculation (auto/manual modes)
│   ├── theme/
│   │   └── tokens.js        # Design system tokens (colors, radii, shadows, spacing)
│   └── utils/
│       ├── api.js           # Frontend API client (fetch wrappers for all endpoints)
│       ├── finance.js       # Finance utility compatibility layer
│       └── storage.js       # localStorage fallback utilities
├── .env                     # Environment variables (MongoDB URI, port) — git-ignored
├── vite.config.js           # Vite config with API proxy to backend
├── package.json             # Dependencies and scripts
└── eslint.config.js         # ESLint config for both React and Node.js files
```

## Challenges Overcome

**MongoDB Atlas TLS Compatibility** — Node.js v24 introduced OpenSSL changes that caused `tlsv1 alert internal error` when connecting to MongoDB Atlas. The root cause was that the Atlas cluster's IP Access List did not include the development machine's IP. Diagnosing this required testing DNS resolution, direct TLS handshakes, and ultimately adding the IP to the Atlas Network Access whitelist.

**Cat State Priority Logic** — Designing the cat mood system required careful thought about overlapping conditions (e.g., a user can be both over-budget and overall in deficit). A priority-based evaluation order was implemented: ANGRY (severe deficit) takes precedence over SHOCKED (over budget), which takes precedence over HAPPY (surplus), ensuring the cat always shows the most relevant mood.

**Consistent Form Layout** — Aligning form inputs across different field types (text, select, date, textarea) in a mobile-friendly layout required careful use of `flex` properties and `box-sizing: border-box`. Multiple iterations were needed to prevent select elements from overflowing their containers.

**Real-time Video Switching** — Swapping `<video>` sources based on React state required using the `key` prop to force remounting the video element, since simply changing `src` does not reliably restart playback in all browsers.

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB Atlas account (or local MongoDB instance)

### Setup

```bash
# 1. Install dependencies
cd neko-nest
npm install

# 2. Create .env file with your MongoDB connection string
echo 'MONGODB_URI=your_mongodb_connection_string' > .env
echo 'PORT=3001' >> .env

# 3. Start the backend server
npm run server

# 4. In a separate terminal, start the frontend
npm run dev
```

Then open `http://localhost:5173` in your browser.
