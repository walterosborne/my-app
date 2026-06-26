# 📘 NGAT 2.0 README

> Internal developer-facing application guide for the Northrop Grumman Audit Tool.
>
> This README covers what NGAT is, how it is structured, how to run it locally, how configuration works, and the minimum test flow expected before shipping changes.

---

## 📚 Table of Contents

- [Overview](#overview)
- [Key Capabilities](#key-capabilities)
- [Tech Stack](#tech-stack)
- [Project Layout](#project-layout)
- [Prerequisites](#prerequisites)
- [Configuration](#configuration)
- [Local Development/Getting Started](#local-development)
- [Database Notes](#database-notes)
- [Available Scripts](#available-scripts)
- [IIS / Deployed Runtime Notes](#iis--deployed-runtime-notes)
- [Testing Guide](#testing-guide)
- [Troubleshooting](#troubleshooting)
- [Related Documentation](#related-documentation)
- [Maintenance Notes](#maintenance-notes)

---

<a id="overview"></a>
## 🚀 Overview

NGAT 2.0 is a React + Node audit-management application that supports the full audit lifecycle:

- Scheduling audits
- Planning audits
- Conducting audits
- Recording findings and nonconformities
- Routing approvals
- Generating reports
- Managing evidence and files
- Viewing metrics and admin-maintained reference data

The application is designed around a Windows-hosted backend model:

- **Developer / validation use**
  Uses the React dev server plus `mssqlserver.js` against SQL Server-backed data sources.
- **Deployed / IIS-hosted use**
  Uses the built SPA plus `mssqlserver.js` behind IIS rewrite and proxy rules.

---

<a id="key-capabilities"></a>
## 🌟 Key Capabilities

- End-to-end audit workflow across schedule, planning, conduct, and findings
- Windows-auth-aware user resolution for IIS-hosted environments
- Access-aware audit viewing and editing, including CUI restrictions
- Approval routing, reminder emails, and audit notification emails
- Individual audit reports and rollup reporting surfaces
- Metrics dashboards with filtering and Excel export
- Objective evidence upload, archive, download, and reuse behavior
- Admin-managed lookup/reference data across core audit entities

For feature-by-feature release notes, see [VERSION-HISTORY.md](./VERSION-HISTORY.md).

---

<a id="tech-stack"></a>
## 🧱 Tech Stack

### Frontend

- **React 19**
- **Vite**
- **React Router**
- **MUI / MUI X**
- **react-select**
- **react-toastify**
- **xlsx**

### Backend

- **Node.js**
- **Express**
- **Nodemailer**
- **Multer**
- **MSSQL** client for deployed SQL Server access

### Hosting / Infrastructure

- **IIS** for deployed hosting
- **URL Rewrite + ARR proxying** for `/api/*` backend forwarding
- **Windows / IIS auth forwarding** for current-user resolution

---

<a id="project-layout"></a>
## 🗂️ Project Layout

```text
my-app/
├── src/                     # React frontend
├── mssqlserver.js           # IIS/deployed SQL Server-backed API
├── runtime-env.js           # Runtime env file loader
├── environment-config.js    # Host-based environment/schema behavior
├── web.config               # IIS rewrite / hosting config
├── scripts/                 # Deployment and backend helper scripts
├── VERSION-HISTORY.md       # Release history
├── DATABASE-ARCHITECTURE.md # Database structure notes
└── .env.example             # Example config values
```

---

<a id="prerequisites"></a>
## ⚙️ Prerequisites

- **Node.js 20.19+ recommended**
  The app can build with warnings on older 20.x versions, but Vite currently prefers `20.19+` or `22.12+`.
- **npm**
- **Windows** for the intended backend-hosting workflow
- **SQL Server access** for `mssqlserver.js`
- **IIS with URL Rewrite / ARR** for deployed reverse-proxy hosting

---

<a id="configuration"></a>
## 🔐 Configuration

NGAT loads environment values from env files at runtime rather than relying only on machine-level environment variables.

### Env file load order

The app checks these files in order when booting a backend:

- `.env`
- `.env.local`
- `.env.<mode>`
- `.env.<mode>.local`

### Common env files

- `.env.local`
  Local developer overrides
- `.env.production.local`
  Deployed server-specific production values

### Example variables

See [`.env.example`](./.env.example) for the current template. The SQL Server-focused values documented here are:

- `auditserver`
- `auditdb`
- `server`
- `database`
- `user`
- `password`
- `APP_BASE_URL`
- `NODE_ENV`

### Environment behavior

- `mssqlserver.js` is the backend entrypoint used for the Windows / IIS / SQL Server deployment model.
- `environment-config.js` contains host-based environment behavior, including production vs non-production handling and schema selection.

---

<a id="local-development"></a>
## 💻 Local Development/Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Create local env config

Copy `.env.example` into a local env file and fill in the values you need.

```bash
cp .env.example .env.local
```

### 3. Start the backend

```bash
node mssqlserver.js
```

### 4. Start the frontend

```bash
npm run dev
```

### 5. Open the app

By default, Vite serves the frontend at:

```text
http://localhost:5173
```

---

<a id="database-notes"></a>
## 🗄️ Database Notes

NGAT is documented around the SQL Server-backed runtime used by `mssqlserver.js`.

### SQL Server runtime

- `mssqlserver.js` reads its connection details from the env files documented above.
- The backend supports the IIS-hosted production flow and the Windows-based validation flow.
- Host-based environment and schema behavior is controlled in [environment-config.js](./environment-config.js).

### Expected configuration areas

Important backend configuration values include:

- `auditserver`
- `auditdb`
- `server`
- `database`
- `user`
- `password`
- `APP_BASE_URL`

### Operational data areas

The SQL Server-backed app stores and serves:

- Audit schedules and planning data
- Conduct-audit responses and findings
- Objective evidence and file metadata
- Approval workflow data
- Admin-maintained lookup tables
- User/roster-linked authorization data

### Common validation endpoints

These are useful when validating the backend wiring:

- `GET /api/nonconformances`
- `GET /api/nonconformances/:scheduleId`
- `POST /api/save-nonconformances`
- `GET /api/audits`
- `GET /api/current-user`
- `GET /api/testheaders`

### Database structure reference

Use [DATABASE-ARCHITECTURE.md](./DATABASE-ARCHITECTURE.md) for the deeper Windows / IIS / SQL Server architecture summary.

---

<a id="available-scripts"></a>
## 🧭 Available Scripts

Run these from `my-app/`.

### Frontend

- `npm run dev`
  Starts the Vite frontend dev server.
- `npm run build`
  Builds the production frontend bundle into `dist/`.
- `npm run preview`
  Serves the built frontend locally for previewing.

### Deployment / backend helpers

- `npm run start:mssqlserver:bg`
  Starts the deployed-style backend helper in the background.
- `npm run stop:mssqlserver`
  Stops the background `mssqlserver` helper.
- `npm run prod`
  Runs the production lifecycle debug entrypoint used for deployment troubleshooting.

---

<a id="iis--deployed-runtime-notes"></a>
## 🏢 IIS / Deployed Runtime Notes

NGAT’s deployed model depends on IIS being configured correctly, not just the frontend files existing on disk.

### Required deployment behavior

- The React app must serve the built SPA from `dist/`
- IIS must rewrite SPA routes back to `index.html`
- IIS must proxy `/api/*` traffic to the Node backend
- ARR proxying must be enabled
- IIS auth headers / forwarded identity values must be allowed through when required

### Important files

- [web.config](./web.config)
- [mssqlserver.js](./mssqlserver.js)
- [iis-auth.asp](./iis-auth.asp)
- [iis-auth.aspx](./iis-auth.aspx)

### Common deployed checks

- `https://<host>/api/testheaders`
- `https://<host>/api/audits`
- `https://<host>/api/current-user`

If `/api/*` routes 404 while the SPA loads, the issue is usually IIS rewrite / proxy configuration rather than React routing.

---

<a id="testing-guide"></a>
## 🧪 Testing Guide

Keep this lightweight. The goal is quick confidence, not a giant manual test matrix.

### Minimum smoke test

1. Start the backend with `node mssqlserver.js`
2. Start the frontend with `npm run dev`
3. Verify the home page loads
4. Verify one audit entry page loads
5. Verify the metrics page loads
6. Verify one save or submit path related to your change
7. Run `npm run build`

### Minimum API smoke test

Use a few direct endpoint checks:

```bash
curl http://localhost:3001/api/audits
curl http://localhost:3001/api/current-user
curl http://localhost:3001/api/testheaders
```

### Minimum deployed smoke test

After deployment, verify:

1. The app loads without a blank screen
2. `/api/testheaders` responds
3. A page that needs user identity resolves the current user correctly
4. The specific workflow you changed still works in the hosted environment

---

<a id="troubleshooting"></a>
## 🧰 Troubleshooting

### App loads but backend routes 404

Most likely causes:

- IIS proxying is not enabled
- URL Rewrite rules are missing or not inheriting
- `/api/*` is not being forwarded to the Node backend

### App loads but authentication is blank or prompts unexpectedly

Most likely causes:

- IIS auth forwarding is incomplete
- Required forwarded headers / server variables are missing
- The IIS auth fallback endpoint is not reachable

### Backend works locally but not in deployed hosting

Check:

- `web.config`
- IIS URL Rewrite rules
- ARR proxy enablement
- backend startup task / process state
- deployed env file contents
- `mssqlserver.js` startup errors or binding failures

### Local build warns about Node version

Vite currently prefers Node `20.19+` or `22.12+`. If you are on an older `20.x`, upgrade before spending time debugging build oddities.

---

<a id="related-documentation"></a>
## 📚 Related Documentation

- [VERSION-HISTORY.md](./VERSION-HISTORY.md)
- [DATABASE-ARCHITECTURE.md](./DATABASE-ARCHITECTURE.md)

---

<a id="maintenance-notes"></a>
## 📝 Maintenance Notes

- Keep this README focused on how the app is used and maintained.
- Put feature evolution in [VERSION-HISTORY.md](./VERSION-HISTORY.md).
- Put database-specific deep dives in [DATABASE-ARCHITECTURE.md](./DATABASE-ARCHITECTURE.md).
- Keep operational database setup/runtime notes here rather than splitting them into a second README.
- Keep the testing section short unless the project gains formal automated test suites later.
