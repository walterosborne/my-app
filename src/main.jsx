import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './index.css'
import ngFavicon from './assets/NG.png'
import Navbar from './Navbar.jsx'
import Home from './Home.jsx'
import Audit from './Audit.jsx'
import AllReports from './AllReports.jsx'
import ThirtySixtyNinety from './ThirtySixtyNinety.jsx'
import Entry from './Entry.jsx'
import Approval from './Approval.jsx'
import EmailOutbox from './EmailOutbox.jsx'
import Schedule from './Schedule.jsx'
import Planning from './Planning.jsx'
import Results from './Results.jsx'
import Nonconformaties from './Nonconformaties.jsx'
import Calendar from './Calendar.jsx'
import AdminMenu from './AdminMenu.jsx'
import FOE from './FOE.jsx'
import InfoSupport from './InfoSupport.jsx'
import AuditStatuses from './AuditStatuses.jsx'
import AuditReports from './AuditReports.jsx'
import RequestAuditorAccess from './RequestAuditorAccess.jsx'
import TableTest from './TableTest.jsx'
import Headers from './Headers.jsx'
import Metrics from './Metrics.jsx'
import RiskAnalysis from './RiskAnalysis.jsx'
import RiskAnalysisEdit from './RiskAnalysisEdit.jsx'
import RiskAnalysisView from './RiskAnalysisView.jsx'
import { installIisAuthFetchShim } from './iisAuthClient.js'

installIisAuthFetchShim();

const getEntryTitle = (searchParams) => {
  const type = searchParams.get('type');
  if (type === 'schedule') return 'Schedule Entry';
  if (type === 'planning') return 'Audit Planning';
  if (type === 'results') return 'Conduct Audit';
  if (type === 'nonconformaties') return 'Nonconformaties';
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
      return 'Nonconformaties';
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
    case '/info-support':
      return 'Info and Support';
    case '/request-auditor-access':
      return 'Request Auditor Access';
    case '/audit-statuses':
      return 'Audit Statuses';
    case '/admin':
      return 'Admin Menu';
    case '/tabletest':
      return 'Table Test';
    case '/headers':
      return 'Headers';
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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AppMetadata />
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
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/audit" element={<Audit />} />
        <Route path="/audit/:id" element={<Audit />} />
        <Route path="/myaudits" element={<AllReports />} />
        <Route path="/audit-reports" element={<AuditReports />} />
        <Route path="/reports" element={<ThirtySixtyNinety />} />
        <Route path="/entry" element={<Entry />} />
        <Route path="/approve/:scheduleId" element={<Approval />} />
        <Route path="/email-outbox" element={<EmailOutbox />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/planning" element={<Planning />} />
        <Route path="/results" element={<Results />} />
        <Route path="/nonconformaties" element={<Nonconformaties />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/metrics" element={<Metrics />} />
        <Route path="/risk-analysis" element={<RiskAnalysis />} />
        <Route path="/risk-analysis/edit" element={<RiskAnalysisEdit />} />
        <Route path="/risk-analysis/view" element={<RiskAnalysisView />} />
        <Route path="/foe" element={<FOE />} />
        <Route path="/info-support" element={<InfoSupport />} />
        <Route path="/request-auditor-access" element={<RequestAuditorAccess />} />
        <Route path="/audit-statuses" element={<AuditStatuses />} />
        <Route path="/admin" element={<AdminMenu />} />
        <Route path="/tabletest" element={<TableTest />} />
        <Route path="/headers" element={<Headers />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
