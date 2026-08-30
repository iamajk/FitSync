# 🏋️ FitSync — Smart Fitness Tracking & Workout Management System

<div align="center">

<img src="https://img.shields.io/badge/version-1.0.0-8b5cf6?style=for-the-badge" />
<img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" />
<img src="https://img.shields.io/badge/MongoDB-Atlas%20%7C%20Local-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
<img src="https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white" />
<img src="https://img.shields.io/badge/Socket.IO-Realtime-010101?style=for-the-badge&logo=socket.io&logoColor=white" />
<img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" />

<br /><br />

> **A full-stack fitness tracking platform.**
> Log workouts, track nutrition, set goals, and monitor progress — powered by MongoDB, Express, and real-time Socket.IO.

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **JWT Authentication** | Secure register/login with bcrypt password hashing |
| 📊 **Analytics Dashboard** | Real-time stats, Chart.js charts, BMI tracker, water intake |
| 🏋️ **Workout Tracker** | Log exercises with sets, reps, weight, duration per session |
| 🍽️ **Nutrition Tracker** | Daily meal logging with full macro breakdown (protein/carbs/fats) |
| 🎯 **Goal Management** | Set weight/muscle goals, log progress, track completion % |
| 👤 **User Profiles** | Edit info, body stats, avatar upload, password change |
| ⭐ **Admin Panel** | Manage users, exercise library, and view platform analytics |
| ⚡ **Real-Time** | Socket.IO live notifications and active-user counter |
| 🌙 **Dark / Light Mode** | Theme toggle persisted to localStorage |
| 📱 **Responsive Design** | Mobile-first with animated sidebar navigation |

---

## 🛠 Tech Stack

```
Frontend   →  HTML5 · CSS3 · Vanilla JavaScript · Chart.js (CDN) · Socket.IO client (CDN)
Backend    →  Node.js · Express.js · Socket.IO · Multer (file uploads)
Database   →  MongoDB (Atlas or local) · Mongoose ODM
Auth       →  JWT (jsonwebtoken) · bcryptjs
Dev Tools  →  Nodemon · dotenv · npm
```

---

## 📁 Project Structure

```
FitSync/
├── client/                     # Frontend — plain static site (no build step)
│   ├── assets/
│   │   └── default-avatar.svg
│   ├── css/style.css           # Full design system with CSS variables
│   ├── js/
│   │   ├── config.js           # Runtime config (API origin for split deploys)
│   │   ├── api.js              # All API calls + shared utilities
│   │   └── layout.js          # Sidebar, header, theme, Socket.IO
│   ├── pages/
│   │   ├── login.html          register.html
│   │   ├── dashboard.html      workouts.html
│   │   ├── nutrition.html      progress.html
│   │   ├── profile.html        admin.html
│   └── index.html              # Public landing page
│
├── server/
│   ├── config/db.js            # MongoDB connection
│   ├── models/                 # Mongoose schemas (User, Workout, Meal, Goal, Exercise)
│   ├── controllers/            # Business logic for all routes
│   ├── routes/                 # Express route definitions
│   ├── middleware/
│   │   ├── authMiddleware.js   # JWT protect + adminOnly guards
│   │   └── errorMiddleware.js  # Global error handler
│   ├── utils/
│   │   ├── tokenUtils.js       # JWT helpers
│   │   └── seedData.js         # Seeds exercises + admin + demo account
│   ├── uploads/                # Uploaded avatars (git-ignored, .gitkeep tracked)
│   └── server.js               # App entry point
│
├── .env.example                # Copy to .env and fill in
├── .gitignore
├── netlify.toml                # Frontend deploy config
├── render.yaml                 # Backend deploy blueprint
├── package.json
└── README.md
```

---

## 🚀 Getting Started (local)

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) **or** a free [MongoDB Atlas](https://cloud.mongodb.com) cluster

### 1. Install dependencies

```bash
npm install
```

### 2. Create your `.env`

```bash
cp .env.example .env
```

Then edit the values (at minimum `MONGO_URI` and `JWT_SECRET`). See `.env.example` for the full list.

### 3. Seed the database (once)

```bash
npm run seed
```

Expected output:

```
✅ MongoDB Connected: localhost
✅ Seeded 15 exercises
✅ Admin account created: admin@fitsync.com / Admin@123
✅ Demo account created: demo@fitsync.com / Demo@123
🎉 Database seed complete.
```

### 4. Start the server

```bash
npm run dev     # auto-restart on changes (nodemon)
# or
npm start       # plain node
```

### 5. Open the app

```
http://localhost:5000
```

---

## 🔑 Default Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | admin@fitsync.com | Admin@123 |
| **Demo** | demo@fitsync.com | Demo@123 |

New users can register at `/pages/register.html`.

---

## ☁️ Deployment

> **Important:** Netlify hosts static sites only — it cannot run the Express /
> Socket.IO / MongoDB backend. You have two options.

### Option A — Everything on Render (simplest)

The Node server already serves the frontend from `client/`, so one service runs the whole app.

1. Create a free **MongoDB Atlas** cluster and copy its connection string.
2. Push this repo to GitHub.
3. In **Render** → *New* → *Blueprint* → pick this repo (it reads `render.yaml`).
4. Set the env vars Render asks for:
   - `MONGO_URI` → your Atlas string
   - `CLIENT_URL` → your Render URL (e.g. `https://fitsync.onrender.com`)
   - `SEED_ON_START` → `true` for the first deploy (seeds admin + demo + exercises), then remove it.
5. Visit the Render URL. Done.

### Option B — Frontend on Netlify + Backend on Render (what you asked for)

1. Deploy the backend to Render as in **Option A** (steps 1–4). Note its URL,
   e.g. `https://fitsync-api.onrender.com`.
2. Point the frontend at that API — edit **`client/js/config.js`**:
   ```js
   window.FITSYNC_API_ORIGIN = "https://fitsync-api.onrender.com";
   ```
   (Or set `window.FITSYNC_API_ORIGIN` via a Netlify snippet injection.)
3. On Render, set `CLIENT_URL` to your Netlify origin (e.g. `https://fitsync.netlify.app`)
   so CORS allows it.
4. In **Netlify** → *Add new site* → *Import from Git* → pick this repo.
   `netlify.toml` already sets `publish = "client"` and needs no build command.
5. Deploy. The frontend loads from Netlify and talks to the Render API.

> **Note on avatar uploads:** Render's free tier has an ephemeral filesystem, so
> uploaded avatars are cleared on redeploy/restart. Fine for a portfolio demo; use
> an object store (S3/Cloudinary) if you need persistence.

---

## 📡 API Reference

All routes are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/profile` | 🔐 | Get current user |
| PUT | `/api/auth/profile` | 🔐 | Update profile / avatar (multipart) |
| PUT | `/api/auth/password` | 🔐 | Change password |

### Workouts
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/workouts` | 🔐 | List (paginated + filtered) |
| POST | `/api/workouts` | 🔐 | Create |
| GET | `/api/workouts/stats` | 🔐 | Weekly + all-time stats |
| GET | `/api/workouts/:id` | 🔐 | Get one |
| PUT | `/api/workouts/:id` | 🔐 | Update |
| DELETE | `/api/workouts/:id` | 🔐 | Delete |

### Nutrition
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/meals` | 🔐 | Meals (filter by date/type) + daily totals |
| POST | `/api/meals` | 🔐 | Log a meal |
| GET | `/api/meals/weekly` | 🔐 | 7-day nutrition aggregate |
| PUT | `/api/meals/:id` | 🔐 | Update |
| DELETE | `/api/meals/:id` | 🔐 | Delete |

### Goals
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/goals` | 🔐 | All goals |
| POST | `/api/goals` | 🔐 | Create |
| PUT | `/api/goals/:id` | 🔐 | Update |
| POST | `/api/goals/:id/progress` | 🔐 | Log weight entry |
| DELETE | `/api/goals/:id` | 🔐 | Delete |

### Admin

The Admin Panel is **viewable by any logged-in user** (read-only), so recruiters can
explore it from the demo account. Write actions require the `admin` role — the UI
shows a "read-only view" banner and blocks them, and the API returns `403` as a backstop.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/admin/dashboard` | 🔐 any | Platform stats + user growth |
| GET | `/api/admin/users` | 🔐 any | All users (search / role / paginate) |
| GET | `/api/admin/exercises` | 🔐 any | Exercise library |
| DELETE | `/api/admin/user/:id` | ⭐ admin | Delete user + cascade data |
| PUT | `/api/admin/user/:id/toggle` | ⭐ admin | Suspend / activate user |
| POST | `/api/admin/exercises` | ⭐ admin | Add exercise |
| DELETE | `/api/admin/exercises/:id` | ⭐ admin | Delete exercise |

### Health
`GET /api/health` → `{ success: true, ... }`

---

## 📜 Scripts

| Command | Description |
|---|---|
| `npm install` | Install dependencies |
| `npm run seed` | Seed DB with exercises + admin + demo (run once) |
| `npm run dev` | Start with nodemon |
| `npm start` | Start with node |

---

## 📝 License

MIT — see [LICENSE](LICENSE).

<div align="center">

**FitSync — Train Smart. Track Everything.**

</div>
