# Quick Start Guide

Get the Product Data Explorer running in 5 minutes.

## Prerequisites

- Node.js 18+ ([download](https://nodejs.org/))
- Git
- A terminal/command prompt

## Installation

### 1. Clone & Install

```bash
git clone <repository-url>
cd Full-Stack-Assignment
npm install
```

### 2. Setup Backend

```bash
cd backend
npm install
npx playwright install --with-deps  # Install browser for scraping
npx prisma migrate dev              # Setup database
cd ..
```

### 3. Setup Frontend

```bash
cd frontend
npm install
cd ..
```

## Running

Open **3 terminal windows**:

**Terminal 1 - Backend**:
```bash
cd backend
npm run dev
```
✓ Running on `http://localhost:3001`

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```
✓ Running on `http://localhost:3000`

**Terminal 3 - Background Worker** (optional):
```bash
cd backend
npm run worker
```
✓ Processing scraping jobs

## Verify

Open browser:
- **App**: http://localhost:3000
- **API Docs**: http://localhost:3001/api/docs

**Test API**:
```bash
curl http://localhost:3001/api/navigation
```

## Key URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| API Docs | http://localhost:3001/api/docs |
| Database | `backend/dev.db` |

## Common Commands

```bash
# Backend
cd backend
npm run dev              # Start API
npm run worker          # Start background scraper
npm run build           # Build for production
npm run lint            # Check code quality

# Frontend
cd frontend
npm run dev             # Start dev server
npm run build           # Build for production
npm run lint            # Check code quality

# Database
cd backend
npx prisma studio      # Open database browser
npx prisma migrate dev # Create migration
npx prisma db push     # Apply changes
npx prisma db seed     # Seed sample data
```

## Troubleshooting

### Port 3001 already in use
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3001
kill -9 <PID>
```

### Browser not found (Playwright)
```bash
cd backend
npx playwright install --with-deps
```

### Database issues
```bash
cd backend
npx prisma migrate reset  # Reset database (WARNING: deletes data)
```

## Next Steps

- Check [README.md](README.md) for full documentation
- View API docs at http://localhost:3001/api/docs
- Explore code in `backend/src/` and `frontend/app/`
- Read [.github/copilot-instructions.md](.github/copilot-instructions.md) for development guidelines

---

**Happy coding!** 🚀
