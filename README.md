# 🏋️ Gym & Fitness Platform

A full-stack Gym & Fitness Management System built for a 3-week internship project.

**Team:** Asim & Tayyab

## 📁 Project Structure

```
gym-fitness-platform/
├── backend/          # Node.js + Express REST API
├── frontend/         # Next.js + Tailwind CSS SPA
└── README.md         # You are here
```

Each of `backend/` and `frontend/` is a fully independent app with its own
`package.json`, `.env` file, and can be deployed separately.

---

## 🧩 Tech Stack

| Layer      | Technology |
|------------|------------|
| Frontend   | Next.js (Pages Router) + React + Tailwind CSS + Recharts |
| Backend    | Node.js + Express.js |
| Database   | PostgreSQL |
| Auth       | JWT + bcrypt + RBAC middleware |
| Validation | express-validator |
| Docs       | OpenAPI 3.0 (Swagger) |

## 👥 Roles

1. **Admin** — full system control, member/trainer CRUD, financial & system analytics
2. **Trainer** — workout plan builder, exercise management, class scheduling, member progress monitoring
3. **Member** — view workouts, log attendance, track BMI/metrics, book classes, set goals

---

##  Quick Start (Local Development)

### Prerequisites
- Node.js ≥ 18
- PostgreSQL ≥ 14
- npm

### 1. Clone & install

```bash
git clone <your-repo-url> gym-fitness-platform
cd gym-fitness-platform
```

### 2. Database setup

```bash
# create the database
createdb gym_fitness_db

# load schema (creates tables, FKs, indexes)
psql -d gym_fitness_db -f backend/database/schema.sql
```

> For a separate MySQL setup guide, see `MYSQL_SETUP.md`.

### 3. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env with your DB credentials + JWT secret
npm run dev        # starts on http://localhost:5000
```

### 4. Frontend setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
# edit .env.local -> NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm run dev         # starts on http://localhost:3000
```



## 🔐 Authentication Flow

1. `POST /api/auth/register` → creates user (bcrypt-hashed password), returns JWT.
2. `POST /api/auth/login` → verifies credentials, returns JWT (7-day expiry).
3. Frontend stores JWT in an httpOnly-style approach via `localStorage` +
   `AuthContext`, attaches `Authorization: Bearer <token>` to every API call.
4. Backend `middleware/auth.js` verifies the token; `middleware/rbac.js`
   (`allowRoles(...roles)`) restricts routes by role.
5. Next.js `middleware.js` blocks unauthenticated users from `/admin`,
   `/trainer`, `/member` routes client-side; backend is the real source of
   truth for authorization.

---

## 📊 Core Modules Implemented

- Auth & RBAC (JWT, bcrypt, protected routes both sides)
- User/Member/Trainer CRUD (Admin) with pagination, search, filtering, sorting
- Membership plans + status tracking (active/expired/pending)
- Exercise library CRUD (Trainer/Admin)
- Workout plan builder (plans ↔ exercises, sets/reps/duration)
- Class scheduling + enrollment + attendance check-in
- BMI calculator + progress metrics log (weight, body fat %, goals)
- Admin analytics dashboard (Recharts: revenue, active vs expired, attendance trend)
- Trainer dashboard (assigned members, upcoming classes, recent plans)
- Member dashboard (goals, today's workout, membership status, progress chart)
- Activity logging (`activity_logs` table, written by `activityLogger` middleware)

---

## 📚 API Documentation

OpenAPI spec: `backend/swagger/openapi.yaml`

Once the backend is running, you can:
- Paste the YAML into [editor.swagger.io](https://editor.swagger.io), or
- Import it into Postman: **Import → File → openapi.yaml**

---

## ☁️ Deployment Guide

### Backend → Render / Railway

1. Push the repo to GitHub.
2. Create a new **Web Service** on Render (or Railway), root directory = `backend/`.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables (from `backend/.env.example`):
   - `PORT` (Render sets this automatically — leave `process.env.PORT` fallback)
   - `DATABASE_URL` (use Render/Railway's managed PostgreSQL connection string)
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN`
   - `CLIENT_URL` (your deployed frontend URL, for CORS)
6. Provision a PostgreSQL instance on the same platform, then run
   `psql "$DATABASE_URL" -f backend/database/schema.sql` (via the platform's
   shell/console, or locally pointed at the remote DB) to create tables.

### Frontend → Vercel / Netlify

1. Import the repo, set **root directory** = `frontend/`.
2. Framework preset: Next.js (auto-detected).
3. Build command: `npm run build` — output: `.next`
4. Environment variable:
   - `NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com/api`
5. Deploy. Vercel/Netlify will redeploy on every push to `main`.

### Post-deploy checklist
- [ ] Update `CLIENT_URL` in backend env to the live frontend domain (CORS).
- [ ] Confirm `NEXT_PUBLIC_API_URL` points at the live backend `/api` prefix.
- [ ] Re-run `schema.sql` against the production database.
- [ ] Create the first Admin user (see step 5 above).
- [ ] Test the full auth → dashboard flow on the live URLs.

---

## 📄 License
Internal internship project — not licensed for external distribution.
