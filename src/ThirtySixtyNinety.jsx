import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { DataGrid } from '@mui/x-data-grid';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './AllReports.css';
import { customStyles } from './Utilities.jsx';
import {
  getAuditsAll,
  getPrograms,
  getDivisions,
  getSectors,
  getSites,
  getBusinessUnits,
  getOperatingUnits,
  getAuditors,
  getAuditTypes,
  getStatuses,
  getFunctions,
  getIntExt,
  getStandards,
  getRiskFactors,
  getSubcategories,
  getRiskRatings,
  getCauses,
  getSafetyEquipment,
  getTrainingRequirements,
  getSeverities,
  getRoster
} from './assets/data/apiData';

const buildSortedOptions = (list = [], valueKey, labelKey) => {
  return [...list]
    .sort((a, b) => (a[labelKey] || '').localeCompare(b[labelKey] || ''))
    .map(item => ({
      value: item[valueKey],
      label: item[labelKey]
    }));
};

const getSiteLabel = (site) => {
  if (!site) return '';
  const city = site.city || '';
  const address = site.address || '';
  if (city && address) {
    return `${city} (${address})`;
  }
  if (city) {
    return city;
  }
  return address || site.siteId;
};

const ThirtySixtyNinety = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [audits, setAudits] = useState([]);
  const [programsList, setProgramsList] = useState([]);
  const [divisionsList, setDivisionsList] = useState([]);
  const [sectorsList, setSectorsList] = useState([]);
  const [sitesList, setSitesList] = useState([]);
  const [businessUnitsList, setBusinessUnitsList] = useState([]);
  const [operatingUnitsList, setOperatingUnitsList] = useState([]);
  const [auditorsList, setAuditorsList] = useState([]);
  const [auditTypesList, setAuditTypesList] = useState([]);
  const [statusesList, setStatusesList] = useState([]);
  const [functionsList, setFunctionsList] = useState([]);
  const [intExtList, setIntExtList] = useState([]);
  const [standardsList, setStandardsList] = useState([]);
  const [riskFactorsList, setRiskFactorsList] = useState([]);
  const [subcategoriesList, setSubcategoriesList] = useState([]);
  const [safetyEquipmentList, setSafetyEquipmentList] = useState([]);
  const [trainingRequirementsList, setTrainingRequirementsList] = useState([]);
  const [severitiesList, setSeveritiesList] = useState([]);
  const [rosterList, setRosterList] = useState([]);
  const [causesList, setCausesList] = useState([]);

  const [titleFilter, setTitleFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState(null);
  const [divisionFilter, setDivisionFilter] = useState(null);
  const [programFilter, setProgramFilter] = useState([]);
  const [siteFilter, setSiteFilter] = useState([]);
  const [businessUnitFilter, setBusinessUnitFilter] = useState([]);
  const [operatingUnitFilter, setOperatingUnitFilter] = useState([]);
  const [auditTypeFilter, setAuditTypeFilter] = useState(null);
  const [leadAuditorFilter, setLeadAuditorFilter] = useState(null);
  const [additionalAuditorsFilter, setAdditionalAuditorsFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState(null);
  const [functionFilter, setFunctionFilter] = useState(null);
  const [intExtFilter, setIntExtFilter] = useState(null);
  const [standardsFilter, setStandardsFilter] = useState([]);
  const [expectedStartFrom, setExpectedStartFrom] = useState('');
  const [expectedStartTo, setExpectedStartTo] = useState('');
  const [expectedCompletionFrom, setExpectedCompletionFrom] = useState('');
  const [expectedCompletionTo, setExpectedCompletionTo] = useState('');
  const [showAllFilters, setShowAllFilters] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [
          auditsData,
          programs,
          divisions,
          sectors,
          sites,
          businessUnits,
          operatingUnits,
          auditors,
          auditTypes,
          statuses,
          functions,
          intExt,
          standards,
          riskFactors,
          subcategories,
          safetyEquipment,
          trainingRequirements,
          roster,
          severities,
          causes
        ] = await Promise.all([
          getAuditsAll(true),
          getPrograms(),
          getDivisions(),
          getSectors(),
          getSites(),
          getBusinessUnits(),
          getOperatingUnits(),
          getAuditors(),
          getAuditTypes(),
          getStatuses(),
          getFunctions(),
          getIntExt(),
          getStandards(),
          getRiskFactors(),
          getSubcategories(),
          getSafetyEquipment(),
          getTrainingRequirements(),
          getRoster(),
          getSeverities(),
          getCauses()
        ]);

        setAudits(auditsData);
        setProgramsList(programs);
        setDivisionsList(divisions);
        setSectorsList(sectors);
        setSitesList(sites);
        setBusinessUnitsList(businessUnits);
        setOperatingUnitsList(operatingUnits);
        setAuditorsList(auditors);
        setAuditTypesList(auditTypes);
        setStatusesList(statuses);
        setFunctionsList(functions);
        setIntExtList(intExt);
        setStandardsList(standards);
        setRiskFactorsList(riskFactors);
        setSubcategoriesList(subcategories);
        setSafetyEquipmentList(safetyEquipment);
        setTrainingRequirementsList(trainingRequirements);
        setRosterList(roster);
        setSeveritiesList(severities);
        setCausesList(causes);
        setLoading(false);
      } catch (error) {
        console.error('Error loading report data:', error);
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const formatSingle = (id, lookupList, idKey, nameKey) => {
    if (!id) return '';
    const item = lookupList.find((entry) => entry[idKey] === id);
    return item ? item[nameKey] : id;
  };

  const formatArray = (ids, lookupList, idKey, nameKey) => {
    if (!ids || ids.length === 0) return '';
    return ids.map((id) => {
      const item = lookupList.find((entry) => entry[idKey] === id);
      return item ? item[nameKey] : id;
    }).join(', ');
  };

  const formatSiteArray = (ids) => {
    if (!ids || ids.length === 0) return '';
    return ids.map((id) => {
      const site = sitesList.find((entry) => entry.siteId === id);
      return site ? getSiteLabel(site) : id;
    }).join(', ');
  };

  const parseDate = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const matchesDateRange = (value, start, end) => {
    const dateValue = parseDate(value);
    if (!dateValue) return false;
    const startDate = parseDate(start);
    const endDate = parseDate(end);
    if (startDate && dateValue < startDate) return false;
    if (endDate && dateValue > endDate) return false;
    return true;
  };

  const sectorOptions = useMemo(() => buildSortedOptions(sectorsList, 'sectorId', 'sectorName'), [sectorsList]);
  const divisionOptions = useMemo(() => buildSortedOptions(divisionsList, 'divisionId', 'divisionName'), [divisionsList]);
  const programOptions = useMemo(() => buildSortedOptions(programsList, 'programId', 'programName'), [programsList]);
  const siteOptions = useMemo(() => {
    return [...sitesList]
      .map((site) => ({
        value: site.siteId,
        label: getSiteLabel(site)
      }))
      .sort((a, b) => (a.label || '').localeCompare(b.label || ''));
  }, [sitesList]);
  const auditTypeOptions = useMemo(() => buildSortedOptions(auditTypesList, 'auditTypeId', 'auditTypeName'), [auditTypesList]);
  const statusOptions = useMemo(() => buildSortedOptions(statusesList, 'statusId', 'statusName'), [statusesList]);
  const functionOptions = useMemo(() => buildSortedOptions(functionsList, 'functionId', 'functionName'), [functionsList]);
  const businessUnitOptions = useMemo(() => buildSortedOptions(businessUnitsList, 'businessUnitId', 'businessUnitName'), [businessUnitsList]);
  const operatingUnitOptions = useMemo(() => buildSortedOptions(operatingUnitsList, 'operatingUnitId', 'operatingUnitName'), [operatingUnitsList]);
  const auditorOptions = useMemo(() => buildSortedOptions(auditorsList, 'auditorId', 'auditorName'), [auditorsList]);
  const intExtOptions = useMemo(() => buildSortedOptions(intExtList, 'intExtId', 'intExtName'), [intExtList]);
  const standardsOptions = useMemo(() => buildSortedOptions(standardsList, 'standardId', 'standardName'), [standardsList]);

  const getStageValue = (audit) => {
    const stage = Number(audit?.stage);
    return Number.isNaN(stage) ? 0 : stage;
  };

  const filteredAudits = useMemo(() => {
    return audits.filter((audit) => {
      if (titleFilter && !audit.title?.toLowerCase().includes(titleFilter.toLowerCase())) {
        return false;
      }
      if (sectorFilter && audit.sectorId !== sectorFilter.value) return false;
      if (divisionFilter && audit.divisionId !== divisionFilter.value) return false;
      if (auditTypeFilter && audit.auditTypeId !== auditTypeFilter.value) return false;
      if (statusFilter && audit.statusId !== statusFilter.value) return false;
      if (functionFilter && audit.functionId !== functionFilter.value) return false;
      if (intExtFilter && audit.intExtId !== intExtFilter.value) return false;
      if (leadAuditorFilter && audit.leadAuditorId !== leadAuditorFilter.value) return false;

      if (programFilter.length > 0 && !programFilter.some((p) => audit.programIds?.includes(p.value))) {
        return false;
      }
      if (siteFilter.length > 0 && !siteFilter.some((s) => audit.siteIds?.includes(s.value))) {
        return false;
      }
      if (businessUnitFilter.length > 0 && !businessUnitFilter.some((bu) => audit.businessUnitIds?.includes(bu.value))) {
        return false;
      }
      if (operatingUnitFilter.length > 0 && !operatingUnitFilter.some((ou) => audit.operatingUnitIds?.includes(ou.value))) {
        return false;
      }
      if (standardsFilter.length > 0 && !standardsFilter.some((s) => audit.standardIds?.includes(s.value))) {
        return false;
      }
      if (additionalAuditorsFilter.length > 0 && !additionalAuditorsFilter.some((a) => audit.additionalAuditorIds?.includes(a.value))) {
        return false;
      }

      if ((expectedStartFrom || expectedStartTo) && !matchesDateRange(audit.expectedStartDate, expectedStartFrom, expectedStartTo)) {
        return false;
      }
      if ((expectedCompletionFrom || expectedCompletionTo) && !matchesDateRange(audit.expectedCompletionDate, expectedCompletionFrom, expectedCompletionTo)) {
        return false;
      }
      return true;
    });
  }, [
    audits,
    titleFilter,
    sectorFilter,
    divisionFilter,
    programFilter,
    siteFilter,
    businessUnitFilter,
    operatingUnitFilter,
    auditTypeFilter,
    leadAuditorFilter,
    additionalAuditorsFilter,
    statusFilter,
    functionFilter,
    intExtFilter,
    standardsFilter,
    expectedStartFrom,
    expectedStartTo,
    expectedCompletionFrom,
    expectedCompletionTo
  ]);

  const sortedFilteredAudits = useMemo(() => {
    return [...filteredAudits].sort((a, b) => Number(b.scheduleId) - Number(a.scheduleId));
  }, [filteredAudits]);

  const rows = sortedFilteredAudits.map((audit) => ({
    id: audit.scheduleId,
    scheduleId: audit.scheduleId,
    title: audit.title,
    division: formatSingle(audit.divisionId, divisionsList, 'divisionId', 'divisionName'),
    programs: formatArray(audit.programIds, programsList, 'programId', 'programName'),
    auditType: formatSingle(audit.auditTypeId, auditTypesList, 'auditTypeId', 'auditTypeName'),
    status: formatSingle(audit.statusId, statusesList, 'statusId', 'statusName'),
    expectedStartDate: audit.expectedStartDate ? audit.expectedStartDate.split('T')[0] : '',
    expectedCompletionDate: audit.expectedCompletionDate ? audit.expectedCompletionDate.split('T')[0] : ''
  }));

  const columns = [
    { field: 'scheduleId', headerName: 'Schedule ID', width: 130 },
    { field: 'title', headerName: 'Title', width: 260 },
    { field: 'division', headerName: 'Division', width: 160 },
    { field: 'programs', headerName: 'Program(s)', width: 200 },
    { field: 'auditType', headerName: 'Audit Type', width: 140 },
    { field: 'status', headerName: 'Status', width: 140 },
    { field: 'expectedStartDate', headerName: 'Expected Start', width: 140 },
    { field: 'expectedCompletionDate', headerName: 'Expected Completion', width: 170 }
  ];

  const getPreviousCarsEffectiveLabel = (value) => {
    const parsed = Number(value);
    if (parsed === 0) return 'Yes';
    if (parsed === 1) return 'No';
    if (parsed === 2) return 'Unknown';
    return 'No response provided';
  };

  const getSeverityLabel = (severity) => {
    if (severity == null) return 'N/A';
    const match = severitiesList.find((item) => item.severityId === severity);
    return match ? match.severity : 'N/A';
  };

  const getFindingTypeLabel = (findingType) => {
    switch (findingType) {
      case 1:
        return 'Nonconformity';
      case 2:
        return 'Conformity';
      case 3:
        return 'OFI';
      case 4:
        return 'Observation';
      default:
        return 'Unknown';
    }
  };

  const handleExport = () => {
    const exportAudits = sortedFilteredAudits;
    if (exportAudits.length === 0) {
      toast.error('No audits match the selected filters.');
      return;
    }

    const addSheet = (workbook, name, headers, rows) => {
      const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      for (let col = 0; col < headers.length; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!sheet[cellAddress]) continue;
        sheet[cellAddress].s = { font: { bold: true } };
      }

      const colWidths = headers.map((header, idx) => {
        const maxCell = rows.reduce((max, row) => {
          const cell = row[idx] ?? '';
          return Math.max(max, cell.toString().length);
        }, header.length);
        return { wch: maxCell + 2 };
      });
      sheet['!cols'] = colWidths;
      XLSX.utils.book_append_sheet(workbook, sheet, name);
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const msPerDay = 24 * 60 * 60 * 1000;

    const buildRows = (maxDays) => {
      return exportAudits
        .filter((audit) => {
          const plannedStart = parseDate(audit.expectedStartDate);
          if (!plannedStart) return false;
          plannedStart.setHours(0, 0, 0, 0);
          const diffDays = Math.floor((plannedStart.getTime() - today.getTime()) / msPerDay);
          return diffDays >= 0 && diffDays <= maxDays;
        })
        .map((audit) => {
          const leadAuditor = formatSingle(audit.leadAuditorId, auditorsList, 'auditorId', 'auditorName');
          const additionalAuditors = formatArray(audit.additionalAuditorIds, auditorsList, 'auditorId', 'auditorName');
          const auditors = [leadAuditor, additionalAuditors].filter(Boolean).join(', ');
          return [
            audit.scheduleId || '',
            auditors,
            audit.expectedStartDate ? audit.expectedStartDate.split('T')[0] : '',
            audit.scope || '',
            formatArray(audit.programIds, programsList, 'programId', 'programName'),
            formatSiteArray(audit.siteIds)
          ];
        });
    };

    const headers = [
      'Schedule ID',
      'Auditors',
      'Planned Start Date',
      'Scope',
      'Program',
      'Sites'
    ];

    const wb = XLSX.utils.book_new();
    addSheet(wb, 'Next 30 Days', headers, buildRows(30));
    addSheet(wb, 'Next 60 Days', headers, buildRows(60));
    addSheet(wb, 'Next 90 Days', headers, buildRows(90));

    XLSX.writeFile(wb, '30-60-90-report.xlsx');
    toast.success('Exported 30/60/90 report.');
  };

  if (loading) {
    return (
      <div className="reports-page">
        <div className="reports-container">
          <div className="reports-loading">Loading report data...</div>
        </div>
      </div>
    );
  }

  if (audits.length === 0) {
    return (
      <div className="reports-page">
        <div className="reports-container">
          <div className="reports-loading">
            You do not have any audits yet. Create one to get started.
            <div style={{ marginTop: '1rem' }}>
              <button
                className="button"
                onClick={() => navigate('/entry?type=schedule')}
                style={{ backgroundColor: '#0066cc', width: '220px' }}
              >
                Create an Audit
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-page">
      <div className="reports-container">
        <div className="reports-header">
          <div>
            <h1>30/60/90 Report</h1>
            <p>Filter audits below and export the 30/60/90 schedule report.</p>
          </div>
          <button className="button export-button" onClick={handleExport}>
            Export Excel
          </button>
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
              <label>Sector</label>
              <Select
                isClearable
                className="reports-select"
                classNamePrefix="reports-select"
                options={sectorOptions}
                styles={customStyles}
                value={sectorFilter}
                onChange={setSectorFilter}
              />
            </div>

            <div className="filter-field">
              <label>Division</label>
              <Select
                isClearable
                className="reports-select"
                classNamePrefix="reports-select"
                options={divisionOptions}
                styles={customStyles}
                value={divisionFilter}
                onChange={setDivisionFilter}
              />
            </div>

            <div className="filter-field">
              <label>Program(s)</label>
              <Select
                isMulti
                className="reports-select"
                classNamePrefix="reports-select"
                options={programOptions}
                styles={customStyles}
                value={programFilter}
                onChange={(value) => setProgramFilter(value || [])}
              />
            </div>

            <div className="filter-field">
              <label>Site(s)</label>
              <Select
                isMulti
                className="reports-select"
                classNamePrefix="reports-select"
                options={siteOptions}
                styles={customStyles}
                value={siteFilter}
                onChange={(value) => setSiteFilter(value || [])}
              />
            </div>

            <div className="filter-field">
              <label>Audit Type</label>
              <Select
                isClearable
                className="reports-select"
                classNamePrefix="reports-select"
                options={auditTypeOptions}
                styles={customStyles}
                value={auditTypeFilter}
                onChange={setAuditTypeFilter}
              />
            </div>

            <div className="filter-field">
              <label>Status</label>
              <Select
                isClearable
                className="reports-select"
                classNamePrefix="reports-select"
                options={statusOptions}
                styles={customStyles}
                value={statusFilter}
                onChange={setStatusFilter}
              />
            </div>

            <div className="filter-field">
              <label>Function</label>
              <Select
                isClearable
                className="reports-select"
                classNamePrefix="reports-select"
                options={functionOptions}
                styles={customStyles}
                value={functionFilter}
                onChange={setFunctionFilter}
              />
            </div>

            {showAllFilters && (
              <>
                <div className="filter-field">
                  <label>Business Unit(s)</label>
                  <Select
                    isMulti
                className="reports-select"
                classNamePrefix="reports-select"
                options={businessUnitOptions}
                styles={customStyles}
                value={businessUnitFilter}
                onChange={(value) => setBusinessUnitFilter(value || [])}
              />
                </div>

                <div className="filter-field">
                  <label>Operating Unit(s)</label>
                  <Select
                    isMulti
                className="reports-select"
                classNamePrefix="reports-select"
                options={operatingUnitOptions}
                styles={customStyles}
                value={operatingUnitFilter}
                onChange={(value) => setOperatingUnitFilter(value || [])}
              />
                </div>

                <div className="filter-field">
                  <label>Lead Auditor</label>
                  <Select
                    isClearable
                className="reports-select"
                classNamePrefix="reports-select"
                options={auditorOptions}
                styles={customStyles}
                value={leadAuditorFilter}
                onChange={setLeadAuditorFilter}
              />
                </div>

                <div className="filter-field">
                  <label>Additional Auditors</label>
                  <Select
                    isMulti
                className="reports-select"
                classNamePrefix="reports-select"
                options={auditorOptions}
                styles={customStyles}
                value={additionalAuditorsFilter}
                onChange={(value) => setAdditionalAuditorsFilter(value || [])}
              />
                </div>

                <div className="filter-field">
                  <label>Int/Ext</label>
                  <Select
                    isClearable
                className="reports-select"
                classNamePrefix="reports-select"
                options={intExtOptions}
                styles={customStyles}
                value={intExtFilter}
                onChange={setIntExtFilter}
              />
                </div>

                <div className="filter-field">
                  <label>Standard(s)</label>
                  <Select
                    isMulti
                className="reports-select"
                classNamePrefix="reports-select"
                options={standardsOptions}
                styles={customStyles}
                value={standardsFilter}
                onChange={(value) => setStandardsFilter(value || [])}
              />
                </div>

                <div className="filter-field">
                  <label>Expected Start (From)</label>
                  <input
                    type="date"
                    className="datefield"
                    value={expectedStartFrom}
                    onChange={(event) => setExpectedStartFrom(event.target.value)}
                  />
                </div>

                <div className="filter-field">
                  <label>Expected Start (To)</label>
                  <input
                    type="date"
                    className="datefield"
                    value={expectedStartTo}
                    onChange={(event) => setExpectedStartTo(event.target.value)}
                  />
                </div>

                <div className="filter-field">
                  <label>Expected Completion (From)</label>
                  <input
                    type="date"
                    className="datefield"
                    value={expectedCompletionFrom}
                    onChange={(event) => setExpectedCompletionFrom(event.target.value)}
                  />
                </div>

                <div className="filter-field">
                  <label>Expected Completion (To)</label>
                  <input
                    type="date"
                    className="datefield"
                    value={expectedCompletionTo}
                    onChange={(event) => setExpectedCompletionTo(event.target.value)}
                  />
                </div>
              </>
            )}
          </div>
          <div className="filters-toggle">
            <button
              className="button toggle-button"
              onClick={() => setShowAllFilters((value) => !value)}
              type="button"
            >
              {showAllFilters ? 'Hide All Filters' : 'Show All Filters'}
            </button>
          </div>
        </div>

        <div className="reports-table">
          <h2>Audits to Export ({filteredAudits.length})</h2>
          <DataGrid
            rows={rows}
            columns={columns}
            pageSizeOptions={[5, 10, 20]}
            initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
            getRowId={(row) => row.scheduleId}
            sx={{ width: '100%' }}
          />
        </div>

        <div className="reports-actions" />
      </div>
    </div>
  );
};

export default ThirtySixtyNinety;
