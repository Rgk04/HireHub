# HireHub — MERN Job Portal

HireHub is a complete job portal built with the MERN stack. Job seekers can build a profile, upload a resume, search and filter jobs, save favourites and track every application. Employers can publish and manage their own job listings, review applicants and move candidates through a hiring pipeline. Administrators get a protected dashboard for platform statistics, user management and job moderation.

The application ships with a production-quality REST API, cookie-based JWT authentication, role-based authorization enforced on the server, validated file uploads and a responsive React interface.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Folder structure](#folder-structure)
- [Prerequisites](#prerequisites)
- [Environment variables](#environment-variables)
- [Installation](#installation)
- [Running locally](#running-locally)
- [Demo accounts](#demo-accounts)
- [Local URLs](#local-urls)
- [Available scripts](#available-scripts)
- [Security notes](#security-notes)
- [Production build](#production-build)
- [Troubleshooting](#troubleshooting)

---

## Features

### Job seekers

- Register and log in with role-aware authentication.
- Editable profile: photo, headline, bio, phone, location, address, skills, education and work experience.
- Resume upload with PDF, DOC and DOCX support (5 MB limit) and secure download.
- Browse jobs with keyword search, category, employment type, experience level, location, salary and company filters, plus sorting and pagination.
- Job details with related/recommended openings, saved-job bookmarking and recently posted roles.
- Apply with the saved resume and a cover letter. Each application stores the exact `jobId`.
- Duplicate applications to the same job are rejected by a database-level unique index.
- Application tracker with status history (Pending, Shortlisted, Rejected, Hired, Withdrawn).
- Withdraw an application while it is still Pending or Shortlisted.
- Personal dashboard with application statistics and monthly activity, saved jobs and notifications.

### Employers

- Register and log in as an employer.
- Company/employer profile management.
- Create, edit and delete **only your own** job listings.
- Active/expired listing tabs, search, applicant counts and per-job application statistics.
- Applicant pipeline with search, job filter, status tabs and pagination.
- Review applications: cover letter, resume download and candidate profile modal.
- Shortlist, reject or hire candidates with optional notes; full status history is recorded.
- Dashboard with hiring statistics, recent activity and recent applications.
- Download resumes only for applications belonging to your own listings.
- Notification feed for new applications and withdrawals.

### Administrators

- Dedicated admin dashboard with real MongoDB statistics.
- View all users, job seekers, employers and admins with search, role and status filters.
- Block/unblock accounts and permanently delete abusive or spam accounts.
- Review all job listings; remove inappropriate listings together with their applications.
- Platform-wide application funnel and latest listings.
- Admin-only routes on both the client and the server. Public registration cannot create an admin.

### Platform-wide

- Server-side validation and sanitisation for every write operation.
- HttpOnly cookie authentication (`token`) with configurable expiry and SameSite policy.
- Role-based access control plus per-resource ownership checks on the server.
- Rate limiting for authentication and general API traffic.
- Helmet security headers, CORS restricted to configured frontend origins.
- Cloudinary uploads when configured, with automatic local-disk fallback.
- Loading, empty, success and error states throughout the UI.
- Confirmation dialogs for destructive actions and toast notifications for results.
- Responsive layouts for desktop, tablet and mobile.
- Clean white/light-grey design system with navy text, blue/indigo accents and subtle shadows.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, React Router 6, Axios, Context API |
| Styling | Hand-written responsive CSS design system, React Icons, react-hot-toast |
| Charts | Lightweight custom SVG donut and bar charts (no external chart dependency) |
| Backend | Node.js, Express 4 (ES modules) |
| Database | MongoDB with Mongoose 8 |
| Authentication | JSON Web Tokens in an HttpOnly cookie, bcrypt password hashing |
| Uploads | express-fileupload + Cloudinary (optional) or local disk storage |
| Security | Helmet, CORS with credentials, request sanitisation, rate limiting, server-side RBAC |

---

## Folder structure

```text
HireHub/
├── README.md
├── .gitignore
│
├── backend/
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── server.js
│   ├── app.js
│   ├── config/
│   │   └── env.js
│   ├── database/
│   │   └── dbConnection.js
│   ├── models/
│   │   ├── userSchema.js
│   │   ├── jobSchema.js
│   │   ├── applicationSchema.js
│   │   └── notificationSchema.js
│   ├── controllers/
│   │   ├── userController.js
│   │   ├── jobController.js
│   │   ├── applicationController.js
│   │   ├── adminController.js
│   │   └── notificationController.js
│   ├── routes/
│   │   ├── userRoutes.js
│   │   ├── jobRoutes.js
│   │   ├── applicationRoutes.js
│   │   ├── adminRoutes.js
│   │   └── notificationRoutes.js
│   ├── middlewares/
│   │   ├── auth.js
│   │   ├── error.js
│   │   ├── catchAsyncError.js
│   │   ├── rateLimit.js
│   │   └── sanitize.js
│   ├── utils/
│   │   ├── constants.js
│   │   ├── jwtToken.js
│   │   ├── notify.js
│   │   ├── upload.js
│   │   └── validate.js
│   ├── scripts/
│   │   ├── seedAdmin.js
│   │   └── seedDemo.js
│   └── uploads/
│       ├── avatars/.gitkeep
│       ├── jobs/.gitkeep
│       └── resumes/.gitkeep
│
└── frontend/
    ├── .env.example
    ├── .eslintrc.cjs
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── public/
    │   ├── hirehub-logo.svg
    │   └── hirehub-favicon.svg
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api/
        ├── components/
        │   ├── Application/
        │   ├── Auth/
        │   ├── Job/
        │   ├── Layout/
        │   └── UI/
        ├── context/
        ├── pages/
        ├── styles/
        └── utils/
```

---

## Prerequisites

Install the following before running HireHub on Windows:

1. **Node.js 18 or newer** (tested with Node 24) — <https://nodejs.org/>
   Verify with:
   ```powershell
   node --version
   npm --version
   ```
2. **MongoDB** — either:
   - **Local MongoDB Community Server 6+** — <https://www.mongodb.com/try/download/community>
     Start the MongoDB service, or run `mongod` on port `27017`.
   - **MongoDB Atlas** (free tier works) — create a cluster and copy the connection string.
3. **Cloudinary account (optional)** — <https://cloudinary.com/>
   Without Cloudinary credentials, HireHub automatically stores uploads in `backend/uploads` and serves them from `http://localhost:4000/uploads`.

> Windows note: if `mongod` is not on your PATH, use the full install path or add `C:\Program Files\MongoDB\Server\<version>\bin` to PATH.

---

## Environment variables

Real credentials are **not** included in this project. Create local `.env` files from the provided examples.

### Backend — `backend/.env`

```powershell
cd backend
Copy-Item .env.example .env
```

Then edit `backend/.env`:

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | API port, default `4000`. |
| `NODE_ENV` | No | `development` or `production`. |
| `FRONTEND_URL` | No | Allowed frontend origin(s), comma-separated. Default `http://localhost:5173`. |
| `BACKEND_URL` | No | Public backend URL used for stored file URLs. Default `http://localhost:4000`. |
| `DB_URL` | **Yes** | MongoDB connection string. |
| `DB_NAME` | No | Database name, default `hirehub`. |
| `JWT_SECRET_KEY` | **Yes** | Long random string used to sign JWTs (32+ characters). |
| `JWT_EXPIRE` | No | Token lifetime, default `7d`. |
| `COOKIE_EXPIRE` | No | Cookie lifetime in days, default `7`. |
| `COOKIE_SAME_SITE` | No | `lax` (default), `strict` or `none` (use `none` only with HTTPS). |
| `CLOUDINARY_CLOUD_NAME` | No | Cloudinary cloud name; leave blank for local storage. |
| `CLOUDINARY_API_KEY` | No | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | No | Cloudinary API secret. |
| `ADMIN_NAME` | No | Name used by `npm run seed:admin`. |
| `ADMIN_EMAIL` | No | Admin login email used by the seed script. |
| `ADMIN_PASSWORD` | No | Admin password used by the seed script; change it before seeding. |

Generate a strong JWT secret (PowerShell or Git Bash):

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Local MongoDB example:

```env
DB_URL=mongodb://127.0.0.1:27017
DB_NAME=hirehub
```

MongoDB Atlas example:

```env
DB_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
DB_NAME=hirehub
```

### Frontend — `frontend/.env`

```powershell
cd frontend
Copy-Item .env.example .env
```

Default value:

```env
VITE_API_URL=http://localhost:4000/api/v1
```

Only `VITE_*` variables are exposed to the browser. Never put secrets in the frontend `.env`.

---

## Installation

From the extracted `HireHub` folder:

```powershell
# Backend
cd backend
npm install

# Frontend (in a second terminal or after the backend install)
cd ..\frontend
npm install
```

---

## Running locally

You need two terminals (plus MongoDB running).

### Terminal 1 — API

```powershell
cd HireHub\backend
npm run dev
```

The API starts on <http://localhost:4000>. Health check:

```text
GET http://localhost:4000/api/health
```

### Terminal 2 — React app

```powershell
cd HireHub\frontend
npm run dev
```

Vite starts on <http://localhost:5173>.

### Seed data (optional but recommended for a demo)

With MongoDB running and `backend/.env` configured:

```powershell
cd HireHub\backend

# Creates the admin account from ADMIN_EMAIL / ADMIN_PASSWORD
npm run seed:admin

# Creates demo employers, seekers, jobs and applications
npm run seed:demo
```

The scripts are idempotent: existing accounts are reused and demo jobs are only created once.

---

## Demo accounts

After running both seed scripts:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@hirehub.com` | `Admin@12345` (or the `ADMIN_PASSWORD` you configured) |
| Employer | `employer@hirehub.com` | `Employer@123` |
| Employer | `employer2@hirehub.com` | `Employer@123` |
| Job seeker | `seeker@hirehub.com` | `Seeker@123` |
| Job seeker | `seeker2@hirehub.com` | `Seeker@123` |
| Job seeker | `seeker3@hirehub.com` | `Seeker@123` |

> These are demo credentials only. Change `ADMIN_PASSWORD` in `backend/.env` before seeding a real deployment, and do not reuse demo passwords in production.

Both the login page and the register page only offer **Job Seeker** and **Employer** roles. Administrator accounts can only be created through the server-side seed script, never through public registration.

---

## Local URLs

| Page | URL |
|---|---|
| Landing page | <http://localhost:5173/> |
| Browse jobs | <http://localhost:5173/jobs> |
| Login / Register | <http://localhost:5173/login> · <http://localhost:5173/register> |
| Seeker/Employer dashboard | <http://localhost:5173/dashboard> |
| Seeker applications | <http://localhost:5173/applications> |
| Saved jobs | <http://localhost:5173/saved-jobs> |
| Employer listings | <http://localhost:5173/employer/jobs> |
| Applicants | <http://localhost:5173/employer/applicants> |
| Admin dashboard | <http://localhost:5173/admin> |
| API health | <http://localhost:4000/api/health> |
| Uploaded files | <http://localhost:4000/uploads/...> |

---

## Available scripts

### Backend (`backend/package.json`)

| Command | Description |
|---|---|
| `npm start` | Start the API with Node. |
| `npm run dev` | Start the API with nodemon and auto-reload. |
| `npm run seed:admin` | Create or verify the admin account. |
| `npm run seed:demo` | Create demo employers, seekers, jobs and applications. |

### Frontend (`frontend/package.json`)

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Create an optimized production build in `frontend/dist`. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint over the frontend source. |

---

## Security notes

- Database URLs, JWT secrets and Cloudinary credentials are read only from environment variables. No real credentials are committed or included in the delivered archive.
- `.env` files are ignored at the repository root, in `backend/.gitignore` and in `frontend/.gitignore`. Only `.env.example` files are shipped.
- Passwords are hashed with bcrypt and never returned by the API.
- Authentication uses an HttpOnly cookie. Authorization is enforced on the server for every protected route, not only in the React UI.
- Employers can only read or modify their own listings and applications; ownership is checked in the controller layer.
- Job seekers can only view their own applications; duplicate applications are blocked by a compound unique index.
- Uploads are validated by extension, MIME type and size. Resume downloads require the owning employer, the applicant or an admin.
- In production, serve the app over HTTPS, set `COOKIE_SAME_SITE` appropriately, restrict `FRONTEND_URL` to your real origin and replace every demo password.

> **Credential rotation:** if the original source archive contained any real database, Cloudinary, JWT or account credentials, do not reuse them. This project intentionally excludes them. Rotate or revoke those credentials in the respective dashboards before deploying.

---

## Production build

```powershell
cd HireHub\frontend
npm run build
```

The static files are written to `frontend/dist`. Serve them with any static host or reverse proxy (Nginx, IIS, Vercel, Netlify), and run the backend with:

```powershell
cd HireHub\backend
npm start
```

For a single-origin deployment, put the frontend and API behind the same domain or set `FRONTEND_URL` to the deployed frontend origin and `VITE_API_URL` to the deployed API URL before building.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `Missing required environment variables: DB_URL, JWT_SECRET_KEY` | Copy `backend/.env.example` to `backend/.env` and fill in both values. Restart the API. |
| `MongooseServerSelectionError` / cannot connect to MongoDB | Make sure MongoDB is running locally (`mongod` service on port 27017) or that the Atlas connection string is correct and your IP is allow-listed. |
| `EADDRINUSE: address already in use :::4000` | Another process uses port 4000. Stop it or change `PORT` in `backend/.env`. |
| Frontend requests fail with CORS errors | Confirm `FRONTEND_URL` matches the URL in the browser, including the port, and restart the API. |
| Logged-in session disappears after refresh | Cookies require the API and UI to be reachable and `withCredentials` enabled. Use `localhost` consistently instead of mixing `localhost` and `127.0.0.1`. |
| Uploads fail and Cloudinary is configured | Check `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET`. Leave them blank to use local disk storage. |
| `429 Too many requests` | Rate limits protect the API. Wait a few minutes or restart the API to reset in-memory counters during development. |
| Resume/photo upload rejected | Allowed resumes: PDF, DOC, DOCX up to 5 MB. Allowed photos: JPG, PNG, WEBP up to 2 MB. |
| Admin login fails after seeding | Use exactly the `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `backend/.env`, and make sure `npm run seed:admin` completed successfully. |
| Port 5173 already in use | Stop the other Vite process, or run `npm run dev -- --port 5174` and add that origin to `FRONTEND_URL`. |

---

Built with the MERN stack. Happy hiring!
