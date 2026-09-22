# NGAT OpenShift migration — two deployments

The source branch changes hosting from IIS/Kerberos to React/Express
in one app container plus a separate OAuth2 Proxy Deployment, like the
standalone QMI proxy pattern. All existing audit API routes, React screens,
CSS and SQL-backed workflows are retained; no tables are recreated.

## Runtime secrets — exact names and keys

In the namespace, configure four key/value Secrets:

- `audit`: `auditserver`, `auditdb`, `audituser`, `auditpassword`.
- `roster`: `server`, `database`, `user`, `password`.
- `entra`: `ENTRA_APPLICATION_ID`, `ENTRA_OBJECT_ID`,
  `ENTRA_DIRECTORY_ID`, `ENTRA_CLIENT_SECRET_VALUE`,
  `ENTRA_CLIENT_SECRET_ID`, `OAUTH2_PROXY_COOKIE_SECRET`.
- `smtp`: `from`, `host`, `port`, `secure`, `tls`.

The application can receive the Secrets as environment variables; your existing
Deployment uses individual secretKeyRef entries instead, which is equally valid.
The SMTP patch in this repo adds only the five `smtp` references and leaves the
existing image, audit, roster and Entra references alone. The OAuth2 Proxy reads
`ENTRA_CLIENT_SECRET_VALUE` into `OAUTH2_PROXY_CLIENT_SECRET`.
`ENTRA_CLIENT_SECRET_ID` is optional inventory metadata; it is NOT a credential.
No real credentials belong in Git.

## Before building

1. Set the Route host in BOTH locations in `openshift/ngat-auth.yaml`.
   Register `https://YOUR_ROUTE/oauth2/callback` as a Web redirect URI
   in Entra US Government, with delegated Microsoft Graph `User.Read`.
2. Your live app is already deployed as `deployment/ngat`, container `ngat`,
   port `8080`. Do NOT replace it with a newly created `ngat-app` Deployment.
   The auth manifest creates a Service called `ngat-internal` selecting
   `app: ngat` and forwarding to port 8080. Verify that pod label first.
   Check the target registry in the BuildConfig and any *new* app Deployment;
   change both image names together if the `wosborne` repository is unavailable.
   The BuildConfig reads the internal `EnterpriseKubernetes/ngat-ops`
   repository's `main` branch, matching the working OpenShift configuration. Supply sourceSecret if needed.
3. Set `NGAT_ENV` explicitly in the running Deployment. `dev` selects SQL
   schema `dev`, `prod` selects `dbo`, and legacy `stg` selects `stag`.
   The hostname, `NODE_ENV`, `AUDIT_SCHEMA`, and Vite build mode cannot
   change the database schema. Check the CURRENT schema before changing
   NGAT_ENV: this changes which audit data the app reads/writes.
4. Set `APP_BASE_URL` to the public NGAT origin for approval and audit
   emails. The app Deployment reads secret `smtp` containing EXACT keys
   `from`, `host`, `port`, `secure`, `tls`. Keep `secure=false` if that
   matches your working SMTP service; `tls` may be `true`, `false`, or
   a JSON object of Node TLS options. Ensure appropriate CA trust and
   network access to Graph, SQL and SMTP.
5. Include the original `src/assets/NG.png` and `src/assets/placeholder.jpg`
   in the INTERNAL `ngat-ops` Git source: a file only on a workstation will
   NOT be available to an OpenShift Git build. The app again imports NG.png,
   not the temporary SVG. Restore private FOE links configuration or populate
   VITE_FOE_* at build time, then rebuild; runtime Secret values cannot
   change a Vite browser bundle.

## Current running NGAT: add SMTP without changing its image

Your OpenShift console shows `deployment/ngat` in `ngat-dev`, container
`ngat`, port `8080`, and `app: ngat` on the pod template. This is a
running app; the repository's full `ngat-app.yaml` is only a fresh-install
example and **must not be applied over the working live Deployment**.

```bash
oc -n ngat-dev get deployment ngat -o jsonpath='{.spec.template.metadata.labels}{"\\n"}'
oc -n ngat-dev patch deployment/ngat --type=strategic --patch-file openshift/ngat-smtp-env-patch.yaml
oc -n ngat-dev rollout status deployment/ngat
```

Do not paste secret VALUES into any YAML or chat. SMTP `secure=false` is
correct when matching your existing configuration; `tls` is separate and
may be `true`, `false`, or a JSON object, depending on the existing setting.

## Later: authentication and Route cutover

The proxy's `OAUTH2_PROXY_CLIENT_SECRET` must reference Secret `entra`,
key `ENTRA_CLIENT_SECRET_VALUE`. The `ENTRA_CLIENT_SECRET_ID` is not
used for OAuth login. The proxy separately reads `ENTRA_APPLICATION_ID`,
`ENTRA_DIRECTORY_ID`, and `OAUTH2_PROXY_COOKIE_SECRET`.

Before applying `openshift/ngat-auth.yaml`, replace
`REPLACE_WITH_NGAT_ROUTE` with the chosen public hostname, register its
`https://HOST/oauth2/callback` redirect URI with your Entra administrator,
and verify the client app has delegated Microsoft Graph `User.Read`.
That manifest creates `ngat-internal` Service -> existing `ngat` pods,
`ngat-auth` Deployment/Service, and an `ngat-auth` Route.
Only switch the public hostname to the proxy-facing Route when authentication
is tested; do not expose the internal app Service as the public entry point.

```bash
oc -n ngat-dev get svc
oc -n ngat-dev get route
# Once callback URI and hostname have been confirmed:
oc -n ngat-dev apply -f openshift/ngat-auth.yaml
oc -n ngat-dev rollout status deployment/ngat-auth
```

Only `ngat-auth` Service port 4180 may be exposed by the authenticated
public Route. The internal `ngat-internal` Service port 8080 MUST NOT
remain a direct public bypass once the authentication Route is active.
Restrict pod-to-app access with a namespace-appropriate NetworkPolicy so
other in-cluster workloads cannot inject headers or tokens.

OAuth2 Proxy forwards the delegated Graph access token to the Express app.
Express calls `https://graph.microsoft.us/v1.0/me`, resolves the on-prem
SAM, employee ID, or exact mail/UPN against `roster_r`, and then retains
the established `auditors_r` / MyID / CUI / program / admin permissions.
The app never authenticates from X-Client-Auth-User, IIS identity or a
hardcoded production Network ID.

## Validation gate / rollback

```bash
npm ci
npm run test:identity
npm run build
oc logs deployment/ngat -c ngat --tail=100
oc logs deployment/ngat-auth -c oauth2-proxy --tail=100
```

Check unauthenticated browser redirect; real auditor and non-auditor
`/api/current-user`; `/api/healthz`; `/api/testheaders?format=json`
without token/cookie leaks; admin and CUI permission boundaries;
create/edit/submit audits; approval; evidence upload/download/archive;
nonconformities; metrics/Excel export; FOE embedded links; SMTP; and
generated mail URLs, on a CONTROLLED TEST DATABASE/schema first.
Keep IIS available for rollback until live parity is verified.
This commit cannot establish corporate image-pull access, actual
SQL/Graph/SMTP connectivity, consent, certificate trust, or visual
parity for private untracked assets.

## Current build-source note

The OpenShift BuildConfig clones
`https://github.northgrum.com/EnterpriseKubernetes/ngat-ops.git`,
branch `main`. Updating public `walterosborne/my-app` branch
`kubernetes` **does not** modify that internal Git repository or cause
a rebuild. Copy/cherry-pick these changes into the internal build source
(including its Dockerfile and aligned package.json/package-lock.json)
before running `oc start-build ngat --follow`. The previous `npm ci`
failure was the unused `concurrently` devDependency appearing only in
package.json; it is removed to match the existing lockfile. The Dockerfile
installs Vite before setting NODE_ENV=production.

## Entra registration confirmed: corporate callback; dev Route is different

Confirmed registration: `https://ngat.northgrum.com/oauth2/callback`,
delegated Graph `User.Read`. The current frontend Route is
`https://ngat-ngat-dev.apps.ocpshareddev.gc1.myngc.com/`. These URLs
are NOT interchangeable in OIDC. The corporate callback will only work
if the custom hostname is configured in DNS/TLS to reach the auth proxy.
Do not redirect the dev hostname to the corporate callback and expect
the same origin's session cookie to work.

The auth manifest has been split into:
- `openshift/ngat-auth.yaml`: proxy Deployment, `ngat-internal` app
  Service, and `ngat-auth` Service, NO Route. OAuth2 Proxy references
  `entra.ENTRA_CLIENT_SECRET_VALUE`, not the secret ID.
- `openshift/ngat-corporate-route.yaml`: corporate Route pointing at
  the auth Service, applied only after DNS, TLS and enterprise routing
  are confirmed.

Pre-stage (does not replace or alter the currently working app Route):

```bash
oc -n ngat-dev apply -f openshift/ngat-auth.yaml
oc -n ngat-dev rollout status deployment/ngat-auth
oc -n ngat-dev get endpoints ngat-internal ngat-auth
oc -n ngat-dev logs deployment/ngat-auth -c oauth2-proxy --tail=100
```

Proxy liveness/readiness may work without a live callback; **this does
not establish that login works**. To test authentication immediately on
the existing dev hostname, request one ADDITIONAL web redirect URI:
`https://ngat-ngat-dev.apps.ocpshareddev.gc1.myngc.com/oauth2/callback`.
Then point the dev Route to `ngat-auth` and set the proxy's redirect
URL to that exact dev callback (and reload its Deployment). Alternatively,
set up `ngat.northgrum.com` DNS/TLS to reach this OpenShift router,
then apply the corporate Route separately. Don't remove the working
dev Route until the new path is verified; don't leave an unauthenticated
Route to the app as a bypass after cutover.

## One runtime environment variable for dev/prod

`NGAT_ENV=dev` selects audit schema `dev`; `NGAT_ENV=prod` selects `dbo`.
Legacy `NGAT_ENV=stg` selects `stag`. There is no hostname fallback or
AUDIT_SCHEMA override. An OpenShift container missing NGAT_ENV fails at
startup instead of silently selecting an audit database schema; local
non-production development without NGAT_ENV defaults to dev.

Keep `NODE_ENV=production` in both OpenShift environments to serve the
compiled React app. Remove the old NGAT_ENV default from the Docker image:
the Deployment explicitly chooses it. The frontend fetches
`/api/environment` from the backend at runtime for its banner; no
VITE_NGAT_ENV or separate Vite build is needed.

The checked-in fresh-install Deployment currently specifies NGAT_ENV=production
(which is accepted as `prod`), to preserve its previous default. Do NOT
apply it over your live `deployment/ngat`. First confirm which audit schema
the running app uses; setting dev selects a DIFFERENT schema from dbo.

Use Workloads > Deployments > ngat > Environment, or, if you have confirmed
that your target is the development schema:

```bash
oc -n ngat-dev set env deployment/ngat NGAT_ENV=dev
oc -n ngat-dev rollout status deployment/ngat
```

For a deliberate dbo target use NGAT_ENV=prod instead. Changes to a Kubernetes
environment variable require a pod rollout; don't change the proxy Deployment.

## Local-only employee ID fallback

For local Vite + Express development, place the following in the IGNORED
`.env.local` alongside your own audit/roster DB connection settings:

```dotenv
NODE_ENV=development
NGAT_ENV=dev
NGAT_DEV_EMPLOYEE_ID=YOUR_MYID
```

Then run `npm run server` and `npm run dev` in separate terminals.
The backend tries the forwarded Entra Graph token first. Only when
Entra fails or no token is available, it looks up `NGAT_DEV_EMPLOYEE_ID`
against `roster_r.myid`, then derives division, admin, program, CUI
and auditor permissions normally from `auditors_r`. A missing roster
match does NOT grant access. This fallback is automatically disabled
when `NODE_ENV=production` or `NGAT_ENV` is not dev and the local
backend binds to 127.0.0.1 rather than accepting external connections
when an employee ID is set. Do not set this variable in OpenShift or
commit a real ID; don't use a production-mode container for local fallback.
Neither the legacy NGAT_DEV_NETWORK_ID nor
ALLOW_HARDCODED_IDENTITY_FALLBACK is needed.

## Local .env precedence fix

The local `mssqlserver.js` server loads the repository-root `.env` after
other local dotenv files, and **overrides inherited Windows/system environment
variables for keys defined in .env**. The backend uses
`loadRuntimeEnv({mode:'development'})` on a workstation, not the previous
hard-coded `mode:'production'`. It logs only which files were loaded and
whether the local fallback is enabled, never the database password or the
employee ID. Existing OS env values for keys NOT defined in .env still apply.

Put `NODE_ENV=development`, `NGAT_ENV=dev`,
`NGAT_DEV_EMPLOYEE_ID=YOUR_MYID`, and both SQL connection groups in
the repository-root `.env` and restart the backend with `npm run server`.
Run the browser separately with `npm run dev` (Vite proxies /api to 3001).

OpenShift is identified by `KUBERNETES_SERVICE_HOST`; the backend does
not load any .env files there and does NOT override Deployment or Secret
variables. NODE_ENV=production still disallows the fallback even if the
employee variable were accidentally configured.
