# 📘 NGAT Version History

> Internal developer-facing version history for the NGAT codebase.
>
> Use this file to document major releases, functional scope, architectural shifts, and important implementation notes over time.

---

## 🚀 NGAT 2.0

**Status:** Current repo baseline  
**Frontend:** React 19 + Vite  
**Backend:** Express + MSSQL  
**Routing:** Hash-based SPA routing  
**Authentication model:** IIS / Windows-auth-aware with backend user-resolution fallbacks

### 🌟 Release Summary

NGAT 2.0 is the modernized Northrop Grumman Audit Tool platform. It replaces the older audit experience with a single React application and a Node/Express backend that supports the full audit lifecycle: scheduling, planning, conducting audits, recording nonconformities, generating reports, approvals, metrics, admin maintenance, and supporting audit utilities.

This version also includes the IIS-aware deployment model, Windows-auth-friendly identity handling, report/export tooling, environment-aware behavior for production vs non-production, and a broader set of admin-managed reference data.

---

## 🧭 Core User Experience

### 🏠 Home Dashboard

- Welcome experience with current-user resolution
- Upcoming audits 30-day lookahead panel
- Quick links into the 4-step audit workflow
- Quick links to audit and approval status views

### 🧱 Main Navigation

NGAT 2.0 is organized around five primary navigation groups:

- **Auditing Steps**
  - Audit Schedule
  - Audit Plan
  - Conduct Audit
  - Nonconformities
- **Audit Reports**
  - Individual Audit Reports
  - All My Audits
  - Rollup and report utilities
- **FOE**
  - FOE-linked tools and download/admin entry points
- **Tools**
  - Admin Menu
  - Audit Statuses
  - Calendar
  - Metrics
  - Risk Analysis
- **Help**
  - Info/Support
  - Request Auditor Access

---

## ✅ End-to-End Audit Workflow

### 1. 📅 Audit Schedule

- Create and edit audits
- Assign lead/additional auditors
- Set schedule metadata, timing, scope, type, location, and ownership data
- Supports access-aware audit selection and editing

### 2. 📝 Audit Planning

- Plan audit execution details
- Capture planning-specific inputs
- Prepare the audit before field execution begins

### 3. 🔎 Conduct Audit

- Enter audit responses during execution
- Supports standard questions, PEQs, ETQs, and evidence capture
- Objective evidence repository with upload, download, and archive/restore behavior
- Supports saved progress and save/proceed workflow
- Preserves data on save rather than clearing visible state
- Standard clauses default collapsed for easier navigation

### 4. ⚠️ Nonconformities

- Create and maintain findings after audit execution
- Supports nonconformities, conformities, OFIs, and observations
- Step 4 submission flow with lock/approval handoff
- Undo submission behavior for allowed users
- Redirect to the individual audit report after final submission
- Current UI language favors **Corrective Action Record Number** over older AIN wording

### 5. 📄 Audit Report Generation

- Individual audit report view
- All My Audits report surface
- Additional audit report rollups and summary pages
- Printable/report-friendly layouts
- Pending approval workflows and post-submission actions

---

## 📊 Reporting & Analytics

### 📘 Individual Audit Reports

- Full audit detail view
- Findings summaries
- Approval state visibility
- Nudge Approvers action for reminder emails
- Undo Submission button for eligible listed auditors on submitted audits

### 📚 All My Audits / Report Pages

- Consolidated audit listings
- Individual and aggregate report views
- Rollup-style reporting pages
- Export-friendly formatting

### 📈 Metrics Dashboard

Includes interactive visualizations and filtering for:

- Audits by stage / business dimension
- Delay causes
- Audits over time
- Finding severities over time
- Findings by function
- Findings by clause

Notable metrics capabilities:

- Tabbed metric groupings
- Compact vs expanded layouts
- Timeline granularity options including quarterly
- Multiselect filtering across key dimensions
- Excel export of currently displayed metric data
- Internal / external filtering support

### 🗓️ Calendar

- Calendar-style audit visibility for schedule planning and status review

### 📌 Audit Statuses

- Audit and approval status tracking surface

---

## 🔐 Authentication, Access, and Security

### 🪪 Windows / IIS-Aware Identity Handling

- Designed for IIS-hosted deployment
- Supports backend user resolution for current-user behavior
- Includes IIS auth fallback client flow for environments where direct identity forwarding is inconsistent
- `/api/current-user`-driven user bootstrap model

### 🛡️ Access Controls

- Audit access restricted by assignment and role context
- CUI-controlled audits are visible in listings but blocked at detail access when the user lacks CUI approval
- Entry pages protect against access to audits a user is not allowed to edit
- Request Auditor Access flow for roster users who are not yet configured as auditors

### 🧪 Non-Production Awareness

- Environment banner in non-production
- Production-link shortcut from dev/staging/unknown host environments

---

## 📬 Email & Approval Workflow

### ✉️ Approval Emails

- Audit approval request emails
- Approval reminder / nudge emails
- Email link generation aligned with the deployed application URL structure
- Approval deep links into the SPA

### 📤 Email Outbox

- UI route for email outbox visibility / related workflow support

### 👥 Approver Handling

- Approval routing for primary and additional approvers
- Reminder behavior only for pending approvers
- Correct handling of approver identifiers in the current backend flow

---

## 🗂️ Files & Evidence Management

### 📎 Objective Evidence

- Upload and save auditor files
- Download existing files
- Archive / restore file status support
- Archived files hidden from normal selection by default
- Archived files still preserved for findings already linked to them

### 🧾 Evidence Selection Safety

- Archived files that are already linked to an audit finding can still appear in that finding’s dropdown so saved evidence is not lost when revisiting old audits

---

## 🧰 Admin Features

NGAT 2.0 includes a large admin surface for maintaining reference data and user mappings.

### Admin-managed areas include:

- Auditors
- Audit Types
- Business Units
- Delay Causes
- Divisions
- Every Time Questions
- Functions
- Operating Units
- Programs
- PrOP
- Safety Equipment
- Severity
- Sites
- Training Requirements

### Admin capabilities include:

- New vs Edit flows
- Active/archive-aware maintenance patterns
- Program/division relationships
- CUI approval flag management for auditors
- Modernized selection tables for edit mode

---

## 🧠 Risk & FOE Tooling

### Risk Analysis

- Risk analysis landing page
- Edit risk analysis
- View risk analysis
- Supporting utilities and dedicated styling/views

### FOE Integration Surface

- FOE audits
- FOE download utilities
- FOE admin entry points
- External and internal FOE-linked navigation support

---

## 🏗️ Technical / Architectural Notes

### Frontend

- React SPA using `HashRouter`
- Route-aware page titles and favicon handling
- React Select used heavily for filter-heavy forms
- Toast-based user feedback throughout workflow actions
- MUI Data Grid and Charts used for admin tables and metrics

### Backend

- Express server with MSSQL-backed primary data access
- Runtime SQL query adaptation for SQL Server compatibility
- SQL-server-backed audit and roster connections
- Route-level health endpoint
- Request-context-aware database schema selection for host-based environment behavior

### Deployment Model

- IIS-hosted frontend
- Node backend launched separately on port `3001`
- IIS rewrite/proxy model for `/api/*` and related backend routes
- Scheduled-task-based backend startup in current deployment flow

---

## 🧪 Quality-of-Life Improvements Included in 2.0

- Hash-router support to avoid first-load route/auth issues in IIS
- Development-environment banner for safety
- Cleaner auth diagnostics and test routes
- Multiselect metrics filters
- Better conduct-audit save behavior
- Better report redirects after submission
- Better reminder/nudge workflow for approvers
- More explicit report labels and terminology updates
- Collapsible sections for large audit entry screens

---

## 📌 Notes for Future Entries

When adding the next version:

1. Add the new version section **above** NGAT 2.0.
2. Keep the summary focused on shipped functionality, not just tickets.
3. Call out:
   - user-visible features
   - architecture/deployment changes
   - security/auth changes
   - reporting/metrics changes
   - admin/data-model impacts

---

**Maintainer note:** This file is intentionally written for developers and technical maintainers, not end users. It should describe what the application can do at a release level, and how the repo’s current implementation is organized.  

## NGAT 1.0
Flask 1.0 was a dogshit combination of flask and streamlits. It did not work.
