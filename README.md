# 🏋️ FitSync — Smart Fitness Tracking & Workout Management System

<div align="center">

<img src="https://img.shields.io/badge/version-1.0.0-8b5cf6?style=for-the-badge" />
<img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" />
<img src="https://img.shields.io/badge/MongoDB-Local%20%7C%20Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
<img src="https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white" />
<img src="https://img.shields.io/badge/Socket.IO-Realtime-010101?style=for-the-badge&logo=socket.io&logoColor=white" />
<img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" />

<br /><br />

> **A full-stack fitness tracking platform built as a DBMS university project.**
> Log workouts, track nutrition, set goals, and monitor progress — all powered by MongoDB, Express, and real-time Socket.IO.

<br />

[Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [API Docs](#-api-reference) · [Screenshots](#-screenshots)

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
| ⚡ **Real-Time** | Socket.IO live notifications and active user counter |
| 🌙 **Dark / Light Mode** | Theme toggle persisted to localStorage |
| 📱 **Responsive Design** | Mobile-first with animated sidebar navigation |

---

## 🛠 Tech Stack

```
Frontend   →  HTML5 · CSS3 · Vanilla JavaScript · Chart.js · Socket.IO Client
Backend    →  Node.js · Express.js · Socket.IO · Multer (file uploads)
Database   →  MongoDB (local or Atlas) · Mongoose ODM
Auth       →  JWT (jsonwebtoken) · bcryptjs
Dev Tools  →  Nodemon · dotenv · npm
```

---

## 📁 Project Structure

```
FitSync/
├── client/                        # Frontend (served statically by Express)
│   ├── css/style.css              # Full design system with CSS variables
│   ├── js/
│   │   ├── api.js                 # All API calls + utility functions
│   │   └── layout.js              # Sidebar, header, theme, Socket.IO
│   ├── pages/
│   │   ├── login.html
│   │   ├── register.html          # 3-step registration with live BMI preview
│   │   ├── dashboard.html         # Stats, charts, water tracker, goals
│   │   ├── workouts.html          # CRUD workouts with exercise builder
│   │   ├── nutrition.html         # Meal tracker with macro doughnut chart
│   │   ├── progress.html          # Goals + weight progress charts
│   │   ├── profile.html           # Tabbed profile management
│   │   └── admin.html             # Admin-only panel
│   └── index.html                 # Public landing page
│
├── server/
│   ├── config/db.js               # MongoDB connection
│   ├── models/                    # Mongoose schemas (User, Workout, Meal, Goal, Exercise)
│   ├── controllers/               # Business logic for all routes
│   ├── routes/                    # Express route definitions
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT protect + adminOnly guards
│   │   └── errorMiddleware.js     # Global error handler
│   └── utils/
│       ├── tokenUtils.js          # JWT helpers
│       └── seedData.js            # Seeds 15 exercises + admin account
│
├── .env                           # ⚠️ Create this yourself (see setup below)
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) (local) **or** a [MongoDB Atlas](https://cloud.mongodb.com) account (cloud)

---

### 1. Clone the repository

```bash
git clone https://github.com/your-username/FitSync.git
cd FitSync
```

---

### 2. Install dependencies

```bash
npm install
```

---

### 3. Create the `.env` file

Create a file named `.env` in the root of the project:

```env
# Local MongoDB
MONGO_URI=mongodb://localhost:27017/fitsync

# OR MongoDB Atlas
# MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/fitsync?retryWrites=true&w=majority

JWT_SECRET=fitsync_super_secret_key_change_in_production
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5000
```

> **Windows PowerShell tip:** If you can't see the `.env` file, create it with:
> ```powershell
> @"
> MONGO_URI=mongodb://localhost:27017/fitsync
> JWT_SECRET=fitsync_super_secret_key_2024
> JWT_EXPIRE=7d
> PORT=5000
> NODE_ENV=development
> CLIENT_URL=http://localhost:5000
> "@ | Out-File -FilePath ".env" -Encoding utf8
> ```

---

### 4. Seed the database

Run this once to populate the exercise library and create the admin account:

```bash
npm run seed
```

Expected output:
```
✅ MongoDB Connected: localhost
✅ 15 exercises seeded
✅ Admin user created: admin@fitsync.com
🎉 Database seeded successfully!
```

---

### 5. Start the server

```bash
# Development (auto-restart on file changes)
npm run dev

# Production
npm start
```

---

### 6. Open the app

```
http://localhost:5000
```

---

## 🔑 Default Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | admin@fitsync.com | Admin@123 |
| **User** | Register on `/pages/register.html` | Your choice |

---

## 📡 API Reference

All routes are prefixed with `/api`. Protected routes require:
```
Authorization: Bearer <your_jwt_token>
```

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/profile` | 🔐 JWT | Get current user |
| PUT | `/api/auth/profile` | 🔐 JWT | Update profile / avatar |
| PUT | `/api/auth/password` | 🔐 JWT | Change password |

### Workouts

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/workouts` | 🔐 JWT | List workouts (paginated + filtered) |
| POST | `/api/workouts` | 🔐 JWT | Create workout |
| GET | `/api/workouts/stats` | 🔐 JWT | Weekly aggregated stats |
| GET | `/api/workouts/:id` | 🔐 JWT | Get single workout |
| PUT | `/api/workouts/:id` | 🔐 JWT | Update workout |
| DELETE | `/api/workouts/:id` | 🔐 JWT | Delete workout |

### Nutrition

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/meals` | 🔐 JWT | Get meals (filter by date/type) |
| POST | `/api/meals` | 🔐 JWT | Log a meal |
| GET | `/api/meals/weekly` | 🔐 JWT | 7-day nutrition aggregate |
| PUT | `/api/meals/:id` | 🔐 JWT | Update meal |
| DELETE | `/api/meals/:id` | 🔐 JWT | Delete meal |

### Goals

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/goals` | 🔐 JWT | Get all goals |
| POST | `/api/goals` | 🔐 JWT | Create a goal |
| PUT | `/api/goals/:id` | 🔐 JWT | Update goal |
| POST | `/api/goals/:id/progress` | 🔐 JWT | Log weight entry |
| DELETE | `/api/goals/:id` | 🔐 JWT | Delete goal |

### Admin

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/admin/dashboard` | ⭐ Admin | Platform stats + user growth |
| GET | `/api/admin/users` | ⭐ Admin | All users (search + paginate) |
| DELETE | `/api/admin/user/:id` | ⭐ Admin | Delete user + cascade data |
| PUT | `/api/admin/user/:id/toggle` | ⭐ Admin | Suspend / activate user |
| GET | `/api/admin/exercises` | ⭐ Admin | Exercise library |
| POST | `/api/admin/exercises` | ⭐ Admin | Add exercise |
| DELETE | `/api/admin/exercises/:id` | ⭐ Admin | Delete exercise |

---

## 🗄️ DBMS Concepts Demonstrated

| Concept | Implementation |
|---|---|
| Schema Design | 5 Mongoose schemas with types, validation, and defaults |
| Relationships | User → Workouts / Meals / Goals via ObjectId refs |
| Embedded Documents | Exercises array in Workout; progressLog in Goal |
| CRUD Operations | Full Create/Read/Update/Delete on all entities |
| Aggregation Pipeline | Weekly nutrition totals, workout stats, admin analytics |
| Indexing | Text index on Exercise; compound index on user + date |
| Pagination | `skip` / `limit` pattern with `totalPages` in response |
| Filtering & Sorting | Date range, type, search query filters across all lists |
| Cascade Delete | Deleting a user removes all their workouts, meals, goals |
| Virtual Fields | BMI (User), progressPercentage, daysRemaining (Goal) |
| Pre-save Hooks | Auto-hash password; auto-total calories/duration in Workout |
| Static Methods | `getDailyTotals()` on Meal, `getWeeklyStats()` on Workout |
| Error Handling | Centralized middleware for CastError, duplicate key, validation |
| Data Seeding | Script seeds exercise library + admin account |

---

## 📸 Screenshots

> Add screenshots to a `/screenshots` folder and update the paths below.

| Dashboard | Workouts | Nutrition |
|---|---|---|
| ![Dashboard](screenshots/dashboard.png) | ![Workouts](screenshots/workouts.png) | ![Nutrition](screenshots/nutrition.png) |

| Progress | Profile | Admin |
|---|---|---|
| ![Progress](screenshots/progress.png) | ![Profile](screenshots/profile.png) | ![Admin](screenshots/admin.png) |

---

## 📜 Scripts

| Command | Description |
|---|---|
| `npm install` | Install all dependencies |
| `npm run seed` | Seed DB with exercises + admin account (run once) |
| `npm run dev` | Start with nodemon (auto-restart on save) |
| `npm start` | Start with plain node |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ❤️ for DBMS University Project

**FitSync — Train Smart. Track Everything.**

</div>
