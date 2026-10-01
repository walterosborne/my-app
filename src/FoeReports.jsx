import React, { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import { DataGrid } from '@mui/x-data-grid';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import './AllReports.css';
import './App.css';
import { customStyles, formatDateForInput } from './Utilities.jsx';
import { getFoeReportData } from './assets/data/apiData';

const uniqueOptions = (values = []) => (
  [...new Set(values.filter((value) => value !== null && value !== undefined && String(value).trim() !== ''))]
    .sort((left, right) => String(left).localeCompare(String(right)))
    .map((value) => ({ value, label: String(value) }))
);

const selectedOptionValues = (options = []) => new Set(options.map((option) => option.value));

const normalizeDate = (value) => {
  if (!value) return '';
  try {
    return formatDateForInput(value);
  } catch {
    return String(value).slice(0, 10);
  }
};

const matchDateRange = (value, from, to) => {
  const normalized = normalizeDate(value);
  if (!normalized) return false;
  if (from && normalized < from) return false;
  if (to && normalized > to) return false;
  return true;
};

const autofitWorksheet = (worksheet, rows) => {
  const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0);
  worksheet['!cols'] = Array.from({ length: columnCount }, (_, columnIndex) => {
    const width = rows.reduce((max, row) => {
      const value = row[columnIndex];
      return Math.max(max, String(value ?? '').length);
    }, 10);
    return { wch: Math.min(60, width + 2) };
  });
};

const FoeReports = () => {
  const [loading, setLoading] = useState(true);
  const [audits, setAudits] = useState([]);
  const [findings, setFindings] = useState([]);
  const [titleFilter, setTitleFilter] = useState('');
  const [includeDrafts, setIncludeDrafts] = useState(false);
  const [auditorFilter, setAuditorFilter] = useState([]);
  const [siteFilter, setSiteFilter] = useState([]);
  const [divisionFilter, setDivisionFilter] = useState([]);
  const [programFilter, setProgramFilter] = useState([]);
  const [auditAreaFilter, setAuditAreaFilter] = useState([]);
  const [auditDateFrom, setAuditDateFrom] = useState('');
  const [auditDateTo, setAuditDateTo] = useState('');

  const loadData = async (showToast = false) => {
    setLoading(true);
    try {
      const data = await getFoeReportData();
      setAudits(Array.isArray(data?.audits) ? data.audits : []);
      setFindings(Array.isArray(data?.findings) ? data.findings : []);
      if (showToast) {
        toast.success('Data refreshed!');
      }
    } catch (error) {
      toast.error(error.message || 'Unable to load FOE report data.');
      setAudits([]);
      setFindings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(false);
  }, []);

  const auditorOptions = useMemo(() => uniqueOptions(audits.map((audit) => audit.auditorName)), [audits]);
  const siteOptions = useMemo(() => uniqueOptions(audits.map((audit) => audit.siteName)), [audits]);
  const divisionOptions = useMemo(() => uniqueOptions(audits.map((audit) => audit.divisionName)), [audits]);
  const programOptions = useMemo(() => uniqueOptions(audits.map((audit) => audit.program)), [audits]);
  const auditAreaOptions = useMemo(() => uniqueOptions(audits.map((audit) => audit.auditAreaName)), [audits]);

  const filteredAudits = useMemo(() => {
    const auditors = selectedOptionValues(auditorFilter);
    const sites = selectedOptionValues(siteFilter);
    const divisions = selectedOptionValues(divisionFilter);
    const programs = selectedOptionValues(programFilter);
    const auditAreas = selectedOptionValues(auditAreaFilter);
    const normalizedTitle = titleFilter.trim().toLowerCase();

    return audits.filter((audit) => {
      if (!includeDrafts && audit.draft) return false;
      if (normalizedTitle && !String(audit.title ?? '').toLowerCase().includes(normalizedTitle)) return false;
      if (auditors.size > 0 && !auditors.has(audit.auditorName)) return false;
      if (sites.size > 0 && !sites.has(audit.siteName)) return false;
      if (divisions.size > 0 && !divisions.has(audit.divisionName)) return false;
      if (programs.size > 0 && !programs.has(audit.program)) return false;
      if (auditAreas.size > 0 && !auditAreas.has(audit.auditAreaName)) return false;
      if ((auditDateFrom || auditDateTo) && !matchDateRange(audit.auditDate, auditDateFrom, auditDateTo)) return false;
      return true;
    });
  }, [
    audits,
    includeDrafts,
    titleFilter,
    auditorFilter,
    siteFilter,
    divisionFilter,
    programFilter,
    auditAreaFilter,
    auditDateFrom,
    auditDateTo
  ]);

  const filteredTitleSet = useMemo(
    () => new Set(filteredAudits.map((audit) => String(audit.title))),
    [filteredAudits]
  );

  const filteredFindings = useMemo(
    () => findings.filter((finding) => filteredTitleSet.has(String(finding.title))),
    [findings, filteredTitleSet]
  );

  const rows = useMemo(() => filteredAudits.map((audit) => ({
    ...audit,
    id: String(audit.title),
    auditDateDisplay: normalizeDate(audit.auditDate),
    draftDisplay: audit.draft ? 'Draft' : ''
  })), [filteredAudits]);

  const columns = [
    { field: 'title', headerName: 'Title', minWidth: 90, flex: 0.45 },
    { field: 'auditorName', headerName: 'Auditor', minWidth: 160, flex: 0.9 },
    { field: 'auditDateDisplay', headerName: 'Audit Date', minWidth: 120, flex: 0.7 },
    { field: 'siteName', headerName: 'Site', minWidth: 160, flex: 0.9 },
    { field: 'divisionName', headerName: 'Division', minWidth: 160, flex: 0.9 },
    { field: 'auditAreaName', headerName: 'Audit Area', minWidth: 180, flex: 1 },
    { field: 'program', headerName: 'Program', minWidth: 140, flex: 0.8 },
    { field: 'customer', headerName: 'Customer', minWidth: 140, flex: 0.8 },
    { field: 'foeCategory', headerName: 'FOE Category', minWidth: 120, flex: 0.7 },
    { field: 'draftDisplay', headerName: 'Status', minWidth: 90, flex: 0.55 },
    { field: 'auditNote', headerName: 'Audit Note', minWidth: 220, flex: 1.4 }
  ];

  const handleExport = () => {
    const workbook = XLSX.utils.book_new();

    const auditHeaders = [
      'Title',
      'FOE Category',
      'Audit Date',
      'Auditor',
      'Site',
      'Division',
      'Program',
      'Audit Area',
      'Customer',
      'On Product',
      'Tool Box Number',
      'Model',
      'Type',
      'Effectivity',
      'Shift',
      'Audit Note',
      'Team',
      'Created',
      'Draft'
    ];
    const auditRows = filteredAudits.map((audit) => [
      audit.title,
      audit.foeCategory || '',
      normalizeDate(audit.auditDate),
      audit.auditorName || '',
      audit.siteName || '',
      audit.divisionName || '',
      audit.program || '',
      audit.auditAreaName || '',
      audit.customer || '',
      audit.onProduct || '',
      audit.toolBoxNumber || '',
      audit.model || '',
      audit.type || '',
      audit.effectivity || '',
      audit.shift || '',
      audit.auditNote || '',
      audit.auditAreaTeam || '',
      audit.created ? String(audit.created) : '',
      audit.draft ? 'Yes' : 'No'
    ]);
    const auditSheetRows = [auditHeaders, ...auditRows];
    const auditsSheet = XLSX.utils.aoa_to_sheet(auditSheetRows);
    autofitWorksheet(auditsSheet, auditSheetRows);
    XLSX.utils.book_append_sheet(workbook, auditsSheet, 'Audits');

    const findingHeaders = [
      'ID',
      'Title',
      'Discrepancy Type Number',
      'Discrepancy Type Quantity',
      'Discrepancy Type Comment',
      'Discrepancy Type FOE Element',
      'Discrepancy Type Risk Category',
      'Description'
    ];
    const findingRows = filteredFindings.map((finding) => [
      finding.id || '',
      finding.title,
      finding.number || '',
      finding.quantity ?? '',
      finding.comment || '',
      finding.foeElement || '',
      finding.riskCategory || '',
      finding.description || ''
    ]);
    const findingSheetRows = [findingHeaders, ...findingRows];
    const findingsSheet = XLSX.utils.aoa_to_sheet(findingSheetRows);
    autofitWorksheet(findingsSheet, findingSheetRows);
    XLSX.utils.book_append_sheet(workbook, findingsSheet, 'Findings');

    toast.info('Now exporting...', {
      progressStyle: { backgroundColor: '#2196f3' },
      style: { borderLeft: '4px solid #2196f3' }
    });
    XLSX.writeFile(workbook, `FOE Audits ${normalizeDate(new Date())}.xlsx`);
  };

  if (loading) {
    return (
      <div className="reports-page">
        <div className="reports-container">
          <div className="reports-loading">Loading FOE report data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-page">
      <div className="reports-container">
        <div className="reports-header">
          <div className="reports-heading">
            <div className="reports-title-row">
              <h1>FOE Audit Reports</h1>
              <label className="reports-title-checkbox">
                <input
                  type="checkbox"
                  checked={includeDrafts}
                  onChange={(event) => setIncludeDrafts(event.target.checked)}
                />
                <span>Include Drafts</span>
              </label>
            </div>
            <p>Filter FOE audits below and export the audit and finding data to Excel.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="button export-button"
              onClick={() => loadData(true)}
              style={{ backgroundColor: '#666' }}
            >
              Refresh Data
            </button>
            <button type="button" className="button export-button" onClick={handleExport}>
              Export Excel
            </button>
          </div>
        </div>

        <div className="reports-filters">
          <div className="filters-grid">
            <div className="filter-field">
              <label>Title</label>
              <input
                type="text"
                className="textfield"
                value={titleFilter}
                onChange={(event) => setTitleFilter(event.target.value)}
              />
            </div>

            <div className="filter-field">
              <label>Auditor</label>
              <Select
                isMulti
                closeMenuOnSelect={false}
                className="reports-select"
                classNamePrefix="reports-select"
                options={auditorOptions}
                styles={customStyles}
                value={auditorFilter}
                onChange={(value) => setAuditorFilter(value || [])}
              />
            </div>

            <div className="filter-field">
              <label>Site</label>
              <Select
                isMulti
                closeMenuOnSelect={false}
                className="reports-select"
                classNamePrefix="reports-select"
                options={siteOptions}
                styles={customStyles}
                value={siteFilter}
                onChange={(value) => setSiteFilter(value || [])}
              />
            </div>

            <div className="filter-field">
              <label>Division</label>
              <Select
                isMulti
                closeMenuOnSelect={false}
                className="reports-select"
                classNamePrefix="reports-select"
                options={divisionOptions}
                styles={customStyles}
                value={divisionFilter}
                onChange={(value) => setDivisionFilter(value || [])}
              />
            </div>

            <div className="filter-field">
              <label>Program</label>
              <Select
                isMulti
                closeMenuOnSelect={false}
                className="reports-select"
                classNamePrefix="reports-select"
                options={programOptions}
                styles={customStyles}
                value={programFilter}
                onChange={(value) => setProgramFilter(value || [])}
              />
            </div>

            <div className="filter-field">
              <label>Audit Area</label>
              <Select
                isMulti
                closeMenuOnSelect={false}
                className="reports-select"
                classNamePrefix="reports-select"
                options={auditAreaOptions}
                styles={customStyles}
                value={auditAreaFilter}
                onChange={(value) => setAuditAreaFilter(value || [])}
              />
            </div>

            <div className="filter-field">
              <label>Audit Date (From)</label>
              <input
                type="date"
                className="datefield"
                value={auditDateFrom}
                onChange={(event) => setAuditDateFrom(event.target.value)}
              />
            </div>

            <div className="filter-field">
              <label>Audit Date (To)</label>
              <input
                type="date"
                className="datefield"
                value={auditDateTo}
                onChange={(event) => setAuditDateTo(event.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="reports-table">
          <h2>Audits to Export ({filteredAudits.length})</h2>
          <DataGrid
            rows={rows}
            columns={columns}
            pageSizeOptions={[5, 10, 20]}
            initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
            getRowId={(row) => row.id}
            sx={{ width: '100%' }}
          />
        </div>

        <div className="reports-actions" />
      </div>
    </div>
  );
};

export default FoeReports;
