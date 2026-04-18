# Georgian B/B1 Driving Theory Exam Preparation

A Next.js application for practicing Georgian driving theory exam questions, deployed on Cloudflare Pages with D1 database.

## Features

- 📚 **921 Official Questions** - All questions from the official Georgian driving theory exam
- 🌍 **3 Languages** - Georgian, English, and Russian
- 📝 **Practice Mode** - Study questions one by one with instant feedback
- 🎯 **Exam Simulation** - 30 questions, 30 minutes, realistic test conditions
- 📊 **Progress Tracking** - Track your correct/incorrect answers
- ⭐ **Favorites** - Bookmark questions for later review
- 🚫 **Exclusions** - Hide easy questions from random selection
- 🧠 **Smart Random** - Prioritize weak questions you've answered incorrectly

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Runtime**: Cloudflare Pages (Edge)
- **Database**: Cloudflare D1 (SQLite)
- **Styling**: Tailwind CSS
- **Auth**: Custom JWT with PBKDF2 password hashing

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Cloudflare account with D1 database

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd driving-theory-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up your D1 database in `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "driving-theory-db"
database_id = "your-database-id"
```

4. Run database migrations:
```bash
# For production. (wrangler login first)
npm run db:migrate:remote

# For local development
npm run db:migrate:local
```

5. Add your questions to `src/lib/data/questions.json` (see format below)

6. Set the JWT secret:
```bash
# For production, use wrangler secret
wrangler secret put JWT_SECRET

# For local development, create .dev.vars file
echo "JWT_SECRET=your-secret-key-here" > .dev.vars
```

### Development

```bash
# Run Next.js dev server
npm run dev

# Or run with Cloudflare Pages locally
npm run preview
```

### Deployment

```bash
# Build and deploy to Cloudflare Pages
npm run pages:deploy
```

Or connect your GitHub repository to Cloudflare Pages for automatic deployments.

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, signup pages
│   ├── (main)/          # Main app pages (practice, exam, stats, etc.)
│   └── api/             # API routes
├── components/          # React components
├── hooks/               # Custom React hooks
└── lib/
    ├── data/            # Static questions JSON
    ├── auth.ts          # Authentication utilities
    ├── db.ts            # Database operations
    ├── questions.ts     # Question fetching logic
    └── types.ts         # TypeScript definitions
```

## API Routes

### Questions (No Auth Required)
- `GET /api/questions/[id]` - Get single question
- `GET /api/questions/random` - Get random question
- `GET /api/questions/range?start=1&end=50` - Get question range
- `GET /api/questions/exam-set` - Get 30 random questions for exam

### Auth
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Progress (Auth Required)
- `POST /api/progress` - Record answer
- `GET /api/progress/stats` - Get user statistics
- `GET/POST /api/progress/favorites` - Manage favorites
- `GET/POST /api/progress/exclusions` - Manage exclusions

### Exam (Auth Required)
- `POST /api/exam/submit` - Submit exam results
- `GET /api/exam/history` - Get exam history

## License

MIT
