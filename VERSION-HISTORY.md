# 📘 NGAT Version History

> Internal developer-facing version history for the NGAT codebase.
>
> Use this file to document major releases, functional scope, architectural shifts, and important implementation notes over time.

---

## 🚀 NGAT 3.0 — Kubernetes / OpenShift Generation

**Release baseline:** October 2026  
**Change window covered:** June 26, 2026 documentation baseline through October 1, 2026  
**Hosting:** OpenShift / Kubernetes  
**Frontend:** React 19 + Vite  
**Backend:** Express + MSSQL in the application container  
**Authentication:** Entra ID through OAuth2 Proxy with delegated Microsoft Graph identity validation  
**Environment model:** `NGAT_ENV` explicitly selects `dev`, `stag`, or `dbo` audit/FOE schemas

### 🌟 Release Summary

NGAT 3.0 is the Kubernetes/OpenShift generation of NGAT. It moves the deployed application away from the IIS/Kerberos-centered 2.0 runtime and into a containerized React/Express deployment protected by OAuth2 Proxy and Entra ID. The existing audit workflow was preserved while the backend, identity model, environment safety, database migration tooling, resilience behavior, Conduct Audit data model, reporting, FOE tooling, and operational deployment model were substantially expanded.

This entry covers the complete functional change set since the previous documentation update on June 26, 2026: 236 commits on the `kubernetes` branch.

---

## ☸️ OpenShift / Kubernetes Migration

### Containerized application runtime

- Added a UBI 9 / Node 20 Docker image.
- The container builds the Vite frontend, prunes development dependencies, and runs `mssqlserver.js` on port 8080.
- In production mode, Express serves the compiled React SPA directly from `dist/`.
- The old deployed IIS model is no longer required for the Kubernetes runtime.
- Removed the obsolete standalone `server.js` implementation.
- Added OpenShift manifests for:
  - the NGAT application Deployment
  - internal NGAT Service
  - OAuth2 Proxy Deployment and Service
  - BuildConfig
  - corporate Route
  - SMTP environment wiring
- Added `OPENSHIFT-NGAT.md` with migration, rollout, validation, authentication, environment, and rollback notes.
- Added startup, readiness, and liveness probes suitable for OpenShift.
- Fatal Node process failures now terminate the application process so Kubernetes can restart it.

### Application availability and recovery

- Added a browser-facing backend availability layer.
- Database dependency health is checked separately from process health so a SQL outage does not create Kubernetes restart loops.
- The frontend shows a recovery-aware outage experience when the backend is temporarily unavailable.
- Persistent error handling was improved so entry forms remain visible while errors are shown.

---

## 🔐 Entra ID Authentication and Identity

NGAT 3.0 replaces IIS/Windows-auth identity as the deployed authentication source.

### OAuth2 Proxy

- Added a dedicated OAuth2 Proxy deployment in front of the application.
- Public Routes terminate at the auth proxy rather than exposing the application Service directly.
- OAuth uses the Northrop Entra application registration and the U.S. Government Entra endpoints.
- OAuth2 Proxy forwards a delegated Microsoft Graph access token to NGAT.
- PKCE S256, secure HTTP-only cookies, SameSite handling, cookie refresh, and reverse-proxy settings are configured for the deployed flow.

### Graph-validated current-user identity

- Added `entraIdentity.js`.
- Express calls Microsoft Graph `/me` using delegated `User.Read`.
- Graph identity can resolve against the roster through:
  - on-premises SAM account name
  - employee/MyID
  - mail / UPN
- Once the roster match is established, existing NGAT authorization rules remain authoritative:
  - auditor identity
  - division
  - program permissions
  - admin access
  - CUI approval
- Browser-supplied identity headers and old IIS identity headers are no longer trusted as authentication.
- Added identity tests and diagnostics for the new flow.

### Local-only development identity fallback

- Added `NGAT_DEV_EMPLOYEE_ID` for localhost development when Entra is unavailable.
- The fallback is allowed only when both:
  - Node is not running in production mode
  - `NGAT_ENV` is development
- The hardcoded MyID still has to resolve through the roster and normal auditor permissions.
- The fallback cannot activate in OpenShift production mode.
- When the local hardcoded identity fallback is actually in use, **all outgoing email is suppressed** so local testing cannot accidentally notify real users.

---

## 🧪 Environment and Schema Safety

Environment handling was rewritten around one authoritative runtime setting.

### `NGAT_ENV`

- `NGAT_ENV=dev` → `[dev]`
- `NGAT_ENV=stg` / staging → `[stag]`
- `NGAT_ENV=prod` / production → `[dbo]`
- Hostname, Vite build mode, and `NODE_ENV` no longer select the audit schema.
- OpenShift must explicitly supply the environment; unsafe or unknown runtime configuration fails instead of silently selecting production data.
- The React environment banner reads the same runtime environment selection used by the backend.

### Development banner = development database

- The non-production banner and backend schema are now driven from the same `NGAT_ENV` value.
- A development banner therefore corresponds to the `dev` audit schema.
- Startup validation rejects an environment/schema mismatch.
- FOE tables now follow the exact same environment schema rules as the normal audit tables.
- A non-production process blocks any FOE query that somehow retains an explicit `dbo.Fode*` target after SQL rewriting.

### Local configuration behavior

- Local dotenv precedence was corrected so repository-local environment values can override inherited Windows variables.
- OpenShift Secret values retain precedence in Kubernetes.
- SMTP configuration now loads after local environment files.
- SMTP and HTTP port handling were separated so an SMTP `PORT=25` value cannot accidentally move the NGAT API listener.
- Local development returned to API port 3001.

---

## 📅 Audit Schedule and Organizational Hierarchy

- Removed the obsolete legacy **Status** field from the active scheduling/reporting experience while preserving underlying compatibility where needed.
- Standards and Functions selectors were widened for easier use.
- Audit creation now reliably populates `createdAt`.
- New and resubmitted schedules require a Division.
- Added admin-maintained parent assignments for Programs and Operating Units.
- Added guarded database changes for the new hierarchy data.
- Schedule Entry now validates Program / Operating Unit hierarchy relationships for new or resubmitted data while allowing older historical audits to remain viewable.
- Schedule hierarchy fields are ordered parent-first to make valid selections clearer.
- Existing historical data is not silently rewritten solely because newer hierarchy rules exist.
- Multi-select controls across the application now stay open while users make consecutive selections.

---

## 🚦 Audit Lifecycle: Cancel, Reactivate, and Archive

NGAT 3.0 adds an explicit lifecycle outside the normal active audit stages.

### Cancel

- Active audits can be cancelled before Pending Approval / Approved.
- Cancelled audits are removed from actionable to-do workflows.
- Cancelled audits are excluded from metrics and normal report selections by default.
- Report pages include an **Include cancelled audits** option where historical cancelled data is relevant.
- Cancellation sends a dedicated notification to assigned auditors.
- Email-delivery failure is surfaced without undoing the lifecycle change.

### Reactivate

- Cancelled audits retain their prior active stage.
- Eligible cancelled audits can be reactivated back to that stage.

### Archive

- Archived audits are removed from the normal NGAT application experience while remaining in the database.
- Guarded restoration tooling exists for administrator/database recovery scenarios.
- Lifecycle writes were hardened for migrated records whose copied `locked` value may be null.

---

## 🔎 Conduct Audit: Multi-Response Question Model

The largest application/data-model change in 3.0 is the normalization of Conduct Audit questions and findings.

### Multiple responses per question

- A single audit question can now contain multiple independent responses/findings.
- This behavior applies across:
  - standard questions
  - Every Time Questions
  - PEQs
- Each response can independently carry its finding classification and related details.
- Reusable response-card UI was introduced for repeatable findings.
- Question expansion is based on whether any saved response exists.
- Unanswered individual questions remain collapsed by default; answered questions reopen automatically.
- Response controls remain usable on narrow layouts.

### Normalized question/finding schema

- Added a normalized database model separating audit questions from their findings/responses.
- Added migration logic to convert legacy Conduct Audit records into the normalized structure.
- Legacy records are represented as a question plus one or more findings rather than being discarded.
- Duplicate legacy ETQ behavior is preserved safely.
- Deleted questions are only removed when deletion is explicitly requested; migration logic does not resurrect deleted records.
- Primary keys, timestamp defaults, and normalized table defaults are restored after schema-copy operations.
- Migration verification checks that every expected legacy finding is represented.

### Safer saves

- Conduct Audit question/finding saves are transactional and atomic.
- Nonconformity-specific response details are saved inside the same transaction.
- The frontend fails the save if any response fails rather than partially reporting success.
- Legacy save paths were made non-destructive to normalized multi-response data.
- Finding IDs refresh after save so subsequent edits target the persisted rows correctly.
- Nonconformity-only metadata is cleared when a response changes to a type where those fields no longer apply.
- Response type, CUI access, and NC detail ownership are validated server-side.

### Finding semantics

- Multiple findings under one question no longer inflate audited-clause counts.
- Finding-level metrics remain finding-based where appropriate.
- Flattened compatibility APIs expose both question identity and response number.
- Findings summaries distinguish multiple responses to the same question.

---

## 📎 Objective Evidence

- Added per-question evidence display on the Individual Audit Report.
- Each question can show its linked evidence filenames.
- Added per-question ZIP download actions.
- Added support for normalized finding-level evidence downloads.
- Overall Objective Evidence download was moved into the grouped audit action/download toolbar.
- Duplicate filenames are retained safely in ZIP exports.
- Evidence metadata is exposed on nested question/finding report data.
- Download logging and response/evidence relationships were clarified and hardened.
- Earlier post-2.0 work also improved shared-location evidence handling, multi-file uploads, and collapse behavior around ETQ/standard-question evidence entry.

---

## 📄 Individual Audit Reports, PDF, and Exports

- Individual reports now group findings/responses beneath their source question.
- Nested standard/PEQ/ETQ questions load directly with their saved response groups.
- Nonconformity responses are labeled distinctly when more than one exists for a question.
- PDF output groups multiple responses underneath the corresponding question.
- Fixed recursive PDF question grouping issues.
- Removed obsolete revision wording from the audit PDF.
- Multi-audit and audit exports now include question identity and response identity.
- Stage / cancelled state is represented where needed in reporting/export flows.
- Cancelled audits are excluded from normal individual-report selection by default.
- Dynamic finding data refreshes rather than relying on stale cached response information.

---

## 📊 Reporting, Metrics, Calendar, and To-Do UX

### Report filtering

- Added **Include cancelled audits** across the report surfaces where cancelled records may need to be reviewed.
- The cancelled filter was repositioned beside report titles for cleaner layout.
- Cancelled entries are visually distinguished where they are intentionally included.
- Normal report views exclude cancelled data unless the user explicitly asks for it.

### Metrics

- Cancelled audits are excluded from metrics.
- Existing finding/function/clause metrics were adapted to the normalized multi-response model.

### Risk Analysis

- Risk ratings now support persisted comments.
- Risk Analysis view displays those comments with improved hierarchy.
- Historical audit migration support was added for risk data.
- Risk Analysis headers were simplified.
- Year display formatting was cleaned up.

### Calendar and navigation

- Calendar audit labels were tightened for compact display.
- Added direct navbar shortcuts for:
  - My Audit To-Do List
  - Calendar
  - Metrics
- Renamed the old Audit Stages surface to **My Audit To-Do List** throughout navigation/page titles.
- Removed several duplicate page headings across Tools/Admin/Risk/Metrics views.

---

## 📬 Email System Changes

### Audit notifications

- New normal audits notify the lead auditor and additional assigned auditors.
- Edits can notify the assigned auditors.
- Audit cancellation has its own notification email.
- Approval and approval-reminder workflows remain supported.
- Email failures are treated as warnings after the underlying audit action succeeds.

### Development safety

All outgoing mail now passes through one environment-aware send path.

When NGAT is running outside production:

- the subject is prefixed with the environment, such as **`[NGAT DEV]`**
- a large high-visibility banner is inserted at the top of the email
- the banner explicitly states that the action occurred in a non-production environment

When the local hardcoded employee-ID identity fallback is being used:

- outbound email is completely disabled
- the suppression is logged as intentional rather than treated as an SMTP failure

---

## 🧠 FOE: From Linked Legacy App to Native NGAT Functionality

FOE received two major waves of work after the previous documentation baseline.

### Native FOE administration

- Added a native FOE Admin Menu in React.
- Added maintenance screens for:
  - FOE Auditors
  - Sites
  - Audit Areas
  - Customers
  - Divisions
  - Shifts
- Added assignment/editing behavior and archive-aware maintenance.
- FOE auditor records retain MyID, approved-site, lead-site, admin, and archive information.
- FOE data-copy/schema scripts were added and organized with the rest of the database tooling.

### Native FOE audit entry

The old FOE **Audits** iframe has been replaced with a native NGAT page modeled on Audit Schedule while preserving the legacy Python/Streamlit business rules.

Preserved behavior includes:

- New Audit
- Edit Drafts
- Review Audits
- lead-auditor Review and/or Edit Audits
- approved-site and lead-site permissions
- archived areas excluded from new audits while historical records remain usable
- Division derived from Site
- Manager derived from Audit Area
- current FOE auditor ownership
- required final-submit fields
- incomplete drafts
- 350-character Audit Note limit
- legacy FOE categories
- customer / shift / effectivity fields
- discrepancy groups and legacy “Other / Undefined” behavior
- integer non-negative discrepancy quantities
- comments for nonzero discrepancies
- persistence of nonzero discrepancy rows only
- legacy Finding Summary behavior
- legacy title-hash generation
- draft deletion and authorized completed-audit deletion

### Native FOE reporting

The old **Download Audit Info** iframe has been replaced with a native NGAT report patterned after All My Audits.

It includes:

- Include Drafts
- Auditor
- Audit Date range
- Site
- Division
- Program
- Audit Area
- Title
- empty-state behavior matching the legacy tool
- Excel export with separate **Audits** and **Findings** sheets
- legacy report fields including Sector
- stable historical Program lookup behavior

### FOE environment and email behavior

- Every `Fode*` query now follows the same `NGAT_ENV` schema selection as normal audit data.
- Development FOE reads/writes therefore stay in `[dev]`.
- Completed FOE audit creation/submission sends an email to the assigned FOE auditor.
- Editing an existing completed FOE audit notifies the originally assigned auditor.
- FOE resolves the auditor's MyID from `FodeAuditors`, then resolves the email through the roster.
- Draft saves do not send email.
- FOE email failures are surfaced as warnings without rolling back the audit save.
- FOE emails use the same non-production banner and hardcoded-identity suppression rules as the rest of NGAT.

---

## 🗃️ Database Migration and Production-Data Protections

NGAT 3.0 substantially expands the SQL migration tooling.

### Guarded Kubernetes migration

- Added `sql/kubernetes-script.sql` as the consolidated migration path for the Kubernetes-era data-model changes.
- The script defaults to development-oriented operation and contains explicit protections around `dbo`.
- Added / consolidated migrations for:
  - audit lifecycle state
  - Program / Operating Unit hierarchy
  - legacy standard-question types
  - normalized Conduct Audit questions/findings
  - migrated historical findings
  - timestamp/default restoration
  - primary-key restoration
  - migration markers and verification
- ISO 9001 legacy question mapping is explicitly handled in the standard-type migration.

### Schema copy/backup utilities

Since the prior documentation baseline, SQL tooling was also added or reorganized for:

- copying `*_r` and FOE tables between schemas
- copying dbo data to dev
- full schema backup/copy workflows
- identifying tables missing expected suffixes
- deleting/rebuilding development copies safely
- restoring archived audits
- ensuring `createdAt` defaults
- protecting production `dbo` data during development migrations

The central application SQL adapter now applies environment schema routing consistently to both normal audit tables and FOE tables.

---

## 🛠️ UI and Workflow Quality-of-Life Changes

- Multi-select dropdowns remain open while multiple values are chosen.
- Question/response boundaries were visually clarified for the new nested response model.
- The Individual Audit Report toolbar was reorganized into clearer grouped actions/downloads/lifecycle controls.
- Evidence actions were moved into more logical locations.
- Responsive styling was added for grouped actions, evidence panels, FOE pages, and multi-response controls.
- “Time to complete audit” was moved from Nonconformities into the Conduct Audit PE introduction.
- Several tool-page headings and navigation labels were simplified to remove duplication.
- FOE responsive CSS was isolated so it does not bleed into unrelated NGAT pages.

---

## 🧾 Earlier Post-2.0 Changes Included in This Release Window

The June/July work after the last documentation update is also part of the 3.0 change set:

- stronger `dbo` protection and schema-copy/delete utilities
- evidence ZIP fixes and shared-location handling improvements
- multi-file objective evidence upload improvements
- ETQ / standard-question collapsing refinements
- nonconformity response/comment fixes
- environment-variable and deployed configuration fixes
- native FOE Admin development
- FOE filtering/editing improvements
- SQL organization and FOE/schema copy tooling
- Conduct Audit question fixes
- expanded CUI guidance/handling
- admin-access and network-ID diagnostics that informed the later Entra migration

---

## 🏗️ 3.0 Architecture at a Glance

The deployed request path is now:

```text
Browser
  ↓
OpenShift Route / TLS
  ↓
OAuth2 Proxy
  ↓
Entra ID / delegated Microsoft Graph token
  ↓
NGAT Express application
  ├─ React SPA
  ├─ Audit SQL connection
  ├─ Roster SQL connection
  └─ SMTP
```

The application container and auth proxy are separate workloads. The application Service is intended to remain internal; authenticated public traffic reaches NGAT through OAuth2 Proxy.

---

## 🔄 Upgrade Perspective

NGAT 3.0 is not just a hosting change. The Kubernetes migration coincides with significant changes to:

- identity and authentication
- deployment/runtime recovery
- environment/schema safety
- audit lifecycle
- organizational hierarchy
- Conduct Audit persistence
- multi-response findings
- objective evidence handling
- reports and exports
- Risk Analysis
- FOE administration, audit entry, and reporting
- email safety and notification behavior
- guarded database migrations

The core React audit workflow remains recognizable from NGAT 2.0, but the deployed architecture and several major data/workflow models are new enough to treat the Kubernetes generation as a distinct major release.


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
