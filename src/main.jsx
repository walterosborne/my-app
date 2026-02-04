import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Navbar from './Navbar.jsx'
import Home from './Home.jsx'
import Audit from './Audit.jsx'
import Entry from './Entry.jsx'
import Schedule from './Schedule.jsx'
import Planning from './Planning.jsx'
import Results from './Results.jsx'
import Nonconformaties from './Nonconformaties.jsx'
import TableTest from './TableTest.jsx'
import Headers from './Headers.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/audit" element={<Audit />} />
        <Route path="/audit/:id" element={<Audit />} />
        <Route path="/entry" element={<Entry />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/planning" element={<Planning />} />
        <Route path="/results" element={<Results />} />
        <Route path="/nonconformaties" element={<Nonconformaties />} />
        <Route path="/tabletest" element={<TableTest />} />
        <Route path="/headers" element={<Headers />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
