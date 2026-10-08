import { StrictMode, Suspense, lazy, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route, useLocation, useParams } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './index.css'
import './App.css'
import './Entry.css'
import ngFavicon from './assets/NG.png'
import Navbar from './Navbar.jsx'
import BackendAvailability from './BackendAvailability.jsx'
import { getCurrentUser, getHeaderDiagnostics } from './assets/data/apiData'
import { getProductionAppUrlForPath } from '../environment-config.js'

// Keep the shell tiny. Each page is downloaded only when the user opens it,
// which avoids making Home wait for XLSX, charts, DataGrid, markdown and the
// rest of the feature-specific bundles used elsewhere in NGAT. App.css and
// Entry.css stay in the shell because they define the shared page geometry;
// loading them lazily caused visible width/alignment shifts between routes.
const Home = lazy(() => import('./Home.jsx'))
const Audit = lazy(() => import('./Audit.jsx'))
const AllReports = lazy(() => import('./AllReports.jsx'))
const ThirtySixtyNinety = lazy(() => import('./ThirtySixtyNinety.jsx'))
const Entry = lazy(() => import('./Entry.jsx'))
const Approval = lazy(() => import('./Approval.jsx'))
const EmailOutbox = lazy(() => import('./EmailOutbox.jsx'))
const Schedule = lazy(() => import('./Schedule.jsx'))
const Planning = lazy(() => import('./Planning.jsx'))
const Results = lazy(() => import('./Results.jsx'))
const Nonconformities = lazy(() => import('./Nonconformaties.jsx'))
const Calendar = lazy(() => import('./Calendar.jsx'))
const AdminMenu = lazy(() => import('./AdminMenu.jsx'))
const FOE = lazy(() => import('./FOE.jsx'))
const FoeAdminMenu = lazy(() => import('./FoeAdminMenu.jsx'))
const InfoSupport = lazy(() => import('./InfoSupport.jsx'))
const VersionHistory = lazy(() => import('./VersionHistory.jsx'))
const AuditStatuses = lazy(() => import('./AuditStatuses.jsx'))
const AuditReports = lazy(() => import('./AuditReports.jsx'))
const RequestAuditorAccess = lazy(() => import('./RequestAuditorAccess.jsx'))
const ImprovementRequest = lazy(() => import('./ImprovementRequest.jsx'))
const TableTest = lazy(() => import('./TableTest.jsx'))
const Metrics = lazy(() => import('./Metrics.jsx'))
const RiskAnalysis = lazy(() => import('./RiskAnalysis.jsx'))
const RiskAnalysisEdit = lazy(() => import('./RiskAnalysisEdit.jsx'))
const RiskAnalysisView = lazy(() => import('./RiskAnalysisView.jsx'))

const LoadingPage = ({ message = 'Loading page...' }) => (
  <div className="entry-page">
    <div className="entry-container">
      <div className="entry-message">{message}</div>
    </div>
  </div>
)

const AppBootstrapGate = ({ children }) => {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    // Diagnostics are useful for troubleshooting, but they are not required to
    // render NGAT. Warm them in the background instead of putting them in the
    // critical path before every first page load.
    getHeaderDiagnostics().catch((error) => {
      console.warn('NGAT failed to warm auth diagnostics at app bootstrap:', error)
    })

    ;(async () => {
      try {
        await getCurrentUser()
      } catch (error) {
        console.warn('NGAT failed to warm current user at app bootstrap:', error)
      }

      if (!cancelled) {
        setIsReady(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  if (!isReady) {
    return <LoadingPage message="Loading NGAT..." />
  }

  return children
}

const getEntryTitle = (searchParams) => {
  const type = searchParams.get('type');
  if (type === 'schedule') return 'Schedule Entry';
  if (type === 'planning') return 'Audit Planning';
  if (type === 'results') return 'Conduct Audit';
  if (type === 'nonconformaties' || type === 'nonconformities') return 'Nonconformities';
  return 'Audit Entry';
};

const getReportTitle = (searchParams) => {
  const type = searchParams.get('type');
  if (type === 'planned-vs-completed') return 'Planned vs Completed';
  if (type === 'rollup-results') return 'Rollup Audit Results';
  if (type === 'rollup-schedule') return 'Rollup Audit Schedule';
  if (type === 'clauses-audited') return 'Clauses Audited';
  if (type === 'processes-audited') return 'Processes Audited';
  if (type === 'schedule-comments') return 'Schedule Comments';
  return '30/60/90 Report';
};

const getFoeTitle = (searchParams) => {
  const type = searchParams.get('type');
  if (type === 'audits') return 'FOE Audits';
  if (type === 'download') return 'FOE Download Audit Info';
  if (type === 'admin') return 'FOE Admin Menu';
  return 'FOE';
};

const getPageTitle = (location) => {
  const searchParams = new URLSearchParams(location.search);
  switch (location.pathname) {
    case '/':
      return 'Home';
    case '/audit':
      return 'Individual Audit Report';
    case '/myaudits':
      return 'All My Audits';
    case '/audit-reports':
      return 'Audit Reports';
    case '/reports':
      return getReportTitle(searchParams);
    case '/entry':
      return getEntryTitle(searchParams);
    case '/approve':
      return 'Audit Approval';
    case '/email-outbox':
      return 'Email Outbox';
    case '/schedule':
      return 'Schedule Entry';
    case '/planning':
      return 'Audit Planning';
    case '/results':
      return 'Conduct Audit';
    case '/nonconformaties':
    case '/nonconformities':
      return 'Nonconformities';
    case '/calendar':
      return 'Calendar';
    case '/metrics':
      return 'Metrics';
    case '/risk-analysis':
      return 'Risk Analysis';
    case '/risk-analysis/edit':
      return 'Edit Risk Analysis';
    case '/risk-analysis/view':
      return 'View Risk Analysis';
    case '/foe':
      return getFoeTitle(searchParams);
    case '/foe/admin':
      return 'FOE Admin Menu';
    case '/info-support':
      return 'Info and Support';
    case '/version-history':
      return 'Version History';
    case '/request-auditor-access':
      return 'Request Auditor Access';
    case '/submit-improvement':
      return 'Submit Improvement';
    case '/audit-statuses':
      return 'My Audit To-Do List';
    case '/admin':
      return 'Admin Menu';
    case '/tabletest':
      return 'Table Test';
    default:
      if (location.pathname.startsWith('/audit/')) {
        const auditId = location.pathname.split('/')[2];
        return auditId ? `Audit ${auditId}` : 'Audit';
      }
      if (location.pathname.startsWith('/approve/')) return 'Audit Approval';
      return 'NGAT';
  }
};

const AppMetadata = () => {
  const location = useLocation();

  useEffect(() => {
    const pageTitle = getPageTitle(location);
    document.title = `NGAT - ${pageTitle}`;

    let favicon = document.querySelector("link[rel='icon']");
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.setAttribute('rel', 'icon');
      document.head.appendChild(favicon);
    }
    favicon.setAttribute('type', 'image/png');
    favicon.setAttribute('href', ngFavicon);
  }, [location]);

  return null;
};

const AppEnvironmentBanner = () => {
  const location = useLocation()
  const [mode, setMode] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/environment', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error(`Environment request failed: HTTP ${response.status}`)
        return response.json()
      })
      .then((data) => {
        if (!cancelled) setMode(data.mode)
      })
      .catch((error) => {
        console.warn('NGAT could not verify its environment:', error)
        if (!cancelled) setMode('unknown')
      })
    return () => { cancelled = true }
  }, [])

  if (mode === null || mode === 'prod') return null
  if (mode === 'unknown') {
    return <div className="environment-banner">Unable to verify NGAT environment.</div>
  }

  const productionHref = getProductionAppUrlForPath(location.pathname || '/', location.search || '')
  return (
    <div className="environment-banner">
      <span>You are working in a {mode === 'stg' ? 'staging' : 'development'} environment.</span>
      <a href={productionHref}>Go to production</a>
    </div>
  )
}

// React Router normally keeps the same component instance alive when only the
// :id changes. Remount Audit for a new ID so its selected-audit detail request
// runs again, while the compact report list and lookup caches remain reusable.
const AuditRoute = () => {
  const { id } = useParams()
  return <Audit key={id || 'latest'} />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <AppMetadata />
      <BackendAvailability>
      <AppEnvironmentBanner />
      <AppBootstrapGate>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss={false}
          draggable
          pauseOnHover={false}
        />
        <Navbar />
        <Suspense fallback={<LoadingPage />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/audit" element={<AuditRoute />} />
            <Route path="/audit/:id" element={<AuditRoute />} />
            <Route path="/myaudits" element={<AllReports />} />
            <Route path="/audit-reports" element={<AuditReports />} />
            <Route path="/reports" element={<ThirtySixtyNinety />} />
            <Route path="/entry" element={<Entry />} />
            <Route path="/approve/:scheduleId" element={<Approval />} />
            <Route path="/email-outbox" element={<EmailOutbox />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/planning" element={<Planning />} />
            <Route path="/results" element={<Results />} />
            <Route path="/nonconformaties" element={<Nonconformities />} />
            <Route path="/nonconformities" element={<Nonconformities />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/metrics" element={<Metrics />} />
            <Route path="/risk-analysis" element={<RiskAnalysis />} />
            <Route path="/risk-analysis/edit" element={<RiskAnalysisEdit />} />
            <Route path="/risk-analysis/view" element={<RiskAnalysisView />} />
            <Route path="/foe" element={<FOE />} />
            <Route path="/foe/admin" element={<FoeAdminMenu />} />
            <Route path="/info-support" element={<InfoSupport />} />
            <Route path="/version-history" element={<VersionHistory />} />
            <Route path="/request-auditor-access" element={<RequestAuditorAccess />} />
            <Route path="/submit-improvement" element={<ImprovementRequest />} />
            <Route path="/audit-statuses" element={<AuditStatuses />} />
            <Route path="/admin" element={<AdminMenu />} />
            <Route path="/tabletest" element={<TableTest />} />
          </Routes>
        </Suspense>
      </AppBootstrapGate>
      </BackendAvailability>
    </HashRouter>
  </StrictMode>,
)
