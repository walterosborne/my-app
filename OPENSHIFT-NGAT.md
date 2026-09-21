# NGAT OpenShift migration — two deployments

The `kubernetes` branch changes hosting from IIS/Kerberos to React/Express
in one app container plus a separate OAuth2 Proxy Deployment, like the
standalone QMI proxy pattern. All existing audit API routes, React screens,
CSS and SQL-backed workflows are retained; no tables are recreated.

## Runtime secrets — exact names and keys

In the namespace, configure three key/value Secrets:

- `audit`: `auditserver`, `auditdb`, `audituser`, `auditpassword`.
- `roster`: `server`, `database`, `user`, `password`.
- `entra`: `ENTRA_APPLICATION_ID`, `ENTRA_OBJECT_ID`,
  `ENTRA_DIRECTORY_ID`, `ENTRA_CLIENT_SECRET`, `OAUTH2_PROXY_COOKIE_SECRET`.

The app uses `envFrom` for all three. The proxy references the required
Entra keys individually, using the client secret VALUE and a separate cookie
secret. No real credentials belong in Git.

## Before building

1. Set the Route host in BOTH locations in `openshift/ngat-auth.yaml`.
   Register `https://YOUR_ROUTE/oauth2/callback` as a Web redirect URI
   in Entra US Government, with delegated Microsoft Graph `User.Read`.
2. Check the target registry in the BuildConfig and app Deployment; change
   both image names together if the `wosborne` repository is unavailable.
   The BuildConfig reads `kubernetes`. Supply sourceSecret if needed.
3. `NGAT_ENV=production` selects `dbo`. Set `AUDIT_SCHEMA` only when
   deploying a deliberate alternate schema. Never derive the target audit
   schema from an inbound Host/Origin header.
4. Set `APP_BASE_URL` to the public NGAT origin for approval and audit
   emails. Configure SMTP values `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`,
   and corporate CA trust/egress to Graph and the database as needed.
5. **Restore the original ignored `src/assets/NG.png` and private
   `src/config/foeLinks.js`** from your IIS/source workspace to guarantee
   visual and FOE parity. A temporary NG.svg placeholder and empty FOE
   link defaults exist solely because those files are not in GitHub.
   Switch the two NG.svg imports back to NG.png after restoring it.
   To use the FOE defaults instead, populate VITE_FOE_* at build time,
   then rebuild the image; runtime Secret values cannot change a Vite
   browser bundle.

## Apply

```bash
oc apply -f openshift/ngat-buildconfig.yaml
oc start-build ngat --follow
oc apply -f openshift/ngat-app.yaml
oc apply -f openshift/ngat-auth.yaml
oc rollout status deployment/ngat-app
oc rollout status deployment/ngat-auth
oc get route ngat
```

Only `ngat-auth` Service port 4180 may be exposed by the public Route.
The internal `ngat-app` port 8080 MUST NOT receive its own public Route.
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
oc logs deployment/ngat-app -c ngat-app --tail=100
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
