# 📘 NGAT Database Architecture

> Internal developer-facing architecture summary for the NGAT Windows / IIS / SQL Server backend model.
>
> This file is intentionally aligned to `mssqlserver.js` and the deployed runtime.

---

## 🏗️ Overview

NGAT uses a React frontend, an Express backend in [mssqlserver.js](./mssqlserver.js), IIS reverse-proxy hosting, and SQL Server-backed data sources.

At a high level:

- The browser loads the React SPA
- IIS serves the static frontend and proxies `/api/*`
- `mssqlserver.js` handles API requests
- SQL Server stores audit, lookup, file, and workflow data
- Windows-auth-aware request handling resolves the current user

---

## 🧱 Architecture Layers

### Frontend

- React + Vite SPA
- Hash-based client routing
- Fetches API data from proxied `/api/*` routes
- Uses current-user resolution for access-aware behavior

### Web Host

- IIS serves the built frontend
- URL Rewrite returns SPA routes to `index.html`
- ARR proxying forwards `/api/*` to the Node backend
- IIS auth forwarding and fallback endpoints support Windows identity resolution

### Backend

- `mssqlserver.js` is the backend entrypoint
- Express handles API routing
- MSSQL connections serve the application data layer
- Nodemailer handles approval, notification, and workflow email sending

### Data Layer

- SQL Server stores audit workflow data
- Lookup/reference tables support admin-managed selections
- Roster and auditor data drive role and identity mapping
- File metadata supports evidence download, archive, and assignment workflows

---

## 🔐 Authentication Flow

NGAT is designed for Windows-auth-aware hosting.

Typical request flow:

1. The browser requests the SPA or an API route
2. IIS authenticates the user
3. IIS forwards or exposes usable identity information
4. `mssqlserver.js` resolves the effective user from request headers / fallback sources
5. The app applies role, assignment, and CUI access rules

Important supporting pieces:

- [web.config](./web.config)
- [iis-auth.asp](./iis-auth.asp)
- [iis-auth.aspx](./iis-auth.aspx)

---

## 🗄️ Core Data Domains

NGAT’s SQL Server-backed backend works across these primary data areas:

### Audit workflow

- Audit schedule records
- Planning data
- Conduct-audit responses
- Submission and approval state

### Findings and reports

- Nonconformities
- Conformities
- OFIs
- Observations
- Individual and aggregate reporting views

### Reference data

- Divisions
- Programs
- Functions
- Sites
- Standards
- Delay causes
- Severity values
- Other admin-managed lookup entities

### Identity and authorization

- Roster records
- Auditor records
- Division/program relationships
- CUI approval state

### Files and evidence

- Objective evidence metadata
- Active/archive state
- Finding-to-file associations

---

## 🌐 Request / Response Model

```text
Browser / React SPA
        |
        | HTTPS requests
        v
IIS (static hosting + rewrite + ARR proxy)
        |
        | /api/*
        v
mssqlserver.js
        |
        | MSSQL queries
        v
SQL Server
```

Common validation endpoints:

- `/api/current-user`
- `/api/testheaders`
- `/api/audits`
- `/api/nonconformances`

---

## ⚙️ Configuration Model

`mssqlserver.js` is configured through env files loaded at runtime.

Common values include:

- `auditserver`
- `auditdb`
- `server`
- `database`
- `user`
- `password`
- `APP_BASE_URL`
- `NODE_ENV`

Environment and schema behavior is coordinated through [environment-config.js](./environment-config.js).

---

## 🧪 Operational Checks

When validating the architecture in a Windows-hosted environment, confirm:

1. The frontend loads through IIS
2. `/api/testheaders` responds
3. `/api/current-user` resolves the expected user
4. `/api/audits` returns data
5. A protected page respects assignment and CUI access rules
6. `mssqlserver.js` remains running after startup

---

## 🧰 Failure Points To Check

### IIS routing issues

- Missing or broken rewrite rules
- ARR proxy not enabled
- `/api/*` not forwarded correctly

### Auth issues

- Missing forwarded identity values
- Fallback auth endpoint unavailable
- IIS auth configuration mismatch

### Backend issues

- `mssqlserver.js` failed to start
- SQL Server connection settings are wrong
- Runtime env files are missing or stale

### Data issues

- Wrong schema selected for the host
- Missing lookup/reference data
- Permissions mismatch on SQL Server or file paths

---

## 📝 Notes

- Keep this document focused on the deployed Windows / IIS / SQL Server architecture.
- Keep feature history in [VERSION-HISTORY.md](./VERSION-HISTORY.md).
- Keep operational run/setup guidance in [README.md](./README.md).
