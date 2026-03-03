import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './index.css'
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
import RequestAuditorAccess from './RequestAuditorAccess.jsx'
import TableTest from './TableTest.jsx'
import Headers from './Headers.jsx'
import Metrics from './Metrics.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
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
        <Route path="/reports" element={<AllReports />} />
        <Route path="/reports-30-60-90" element={<ThirtySixtyNinety />} />
        <Route path="/entry" element={<Entry />} />
        <Route path="/approve/:scheduleId" element={<Approval />} />
        <Route path="/email-outbox" element={<EmailOutbox />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/planning" element={<Planning />} />
        <Route path="/results" element={<Results />} />
        <Route path="/nonconformaties" element={<Nonconformaties />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/metrics" element={<Metrics />} />
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
