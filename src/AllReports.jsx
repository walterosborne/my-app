import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { DataGrid } from '@mui/x-data-grid';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './AllReports.css';
import { customStyles, formatDateForInput, formatRosterLabel, parseCalendarDate } from './Utilities.jsx';
import {
  buildApiUrl,
  getAudits,
  getCurrentUser,
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
  getCauses,
  getSafetyEquipment,
  getTrainingRequirements,
  getSeverities,
  getRosterByIds
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

const formatNcIdentifier = (value) => {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  return `NCID - ${value}`;
};

const AllReports = () => {
  const navigate = useNavigate();
  const exportToastOptions = {
    progressStyle: { backgroundColor: '#2196f3' },
    style: { borderLeft: '4px solid #2196f3' }
  };
  const [loading, setLoading] = useState(true);
  const [audits, setAudits] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
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
  const [safetyEquipmentList, setSafetyEquipmentList] = useState([]);
  const [trainingRequirementsList, setTrainingRequirementsList] = useState([]);
  const [severitiesList, setSeveritiesList] = useState([]);
  const [causesList, setCausesList] = useState([]);

  const [titleFilter, setTitleFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState(null);
  const [divisionFilter, setDivisionFilter] = useState([]);
  const [programFilter, setProgramFilter] = useState([]);
  const [siteFilter, setSiteFilter] = useState([]);
  const [businessUnitFilter, setBusinessUnitFilter] = useState([]);
  const [operatingUnitFilter, setOperatingUnitFilter] = useState([]);
  const [auditTypeFilter, setAuditTypeFilter] = useState(null);
  const [leadAuditorFilter, setLeadAuditorFilter] = useState(null);
  const [additionalAuditorsFilter, setAdditionalAuditorsFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState(null);
  const [functionFilter, setFunctionFilter] = useState([]);
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
          userData,
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
          safetyEquipment,
          trainingRequirements,
          severities,
          causes
        ] = await Promise.all([
          getAudits(true),
          getCurrentUser(),
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
          getSafetyEquipment(),
          getTrainingRequirements(),
          getSeverities(),
          getCauses()
        ]);

        setAudits(auditsData);
        setCurrentUser(userData);
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
        setSafetyEquipmentList(safetyEquipment);
        setTrainingRequirementsList(trainingRequirements);
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

  const normalizeIdArray = (value) => {
    if (Array.isArray(value)) return value;
    if (value === null || value === undefined) return [];
    return [value];
  };

  const formatSiteArray = (ids) => {
    if (!ids || ids.length === 0) return '';
    return ids.map((id) => {
      const site = sitesList.find((entry) => entry.siteId === id);
      return site ? getSiteLabel(site) : id;
    }).join(', ');
  };

  const parseDate = (value) => {
    return parseCalendarDate(value);
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
      if (divisionFilter.length > 0) {
        const auditDivisionIds = normalizeIdArray(audit.divisionId).map((id) => Number(id));
        const matchesDivision = divisionFilter.some((option) => auditDivisionIds.includes(Number(option.value)));
        if (!matchesDivision) return false;
      }
      if (auditTypeFilter && audit.auditTypeId !== auditTypeFilter.value) return false;
      if (statusFilter && audit.statusId !== statusFilter.value) return false;
      if (functionFilter.length > 0) {
        const auditFunctionIds = normalizeIdArray(audit.functionId).map((id) => Number(id));
        const matchesFunction = functionFilter.some((option) => auditFunctionIds.includes(Number(option.value)));
        if (!matchesFunction) return false;
      }
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
    division: formatArray(audit.divisionId, divisionsList, 'divisionId', 'divisionName'),
    programs: formatArray(audit.programIds, programsList, 'programId', 'programName'),
    auditType: formatSingle(audit.auditTypeId, auditTypesList, 'auditTypeId', 'auditTypeName'),
    status: formatSingle(audit.statusId, statusesList, 'statusId', 'statusName'),
    expectedStartDate: formatDateForInput(audit.expectedStartDate),
    expectedCompletionDate: formatDateForInput(audit.expectedCompletionDate),
    submittedDate: formatDateForInput(audit.submittedAt),
    approvalDate: formatDateForInput(audit.approvedAt)
  }));

  const columns = [
    { field: 'scheduleId', headerName: 'Schedule ID', width: 130 },
    { field: 'title', headerName: 'Title', width: 260 },
    { field: 'division', headerName: 'Division', width: 160 },
    { field: 'programs', headerName: 'Program(s)', width: 200 },
    { field: 'auditType', headerName: 'Audit Type', width: 140 },
    { field: 'status', headerName: 'Status', width: 140 },
    { field: 'expectedStartDate', headerName: 'Expected Start', width: 140 },
    { field: 'expectedCompletionDate', headerName: 'Expected Completion', width: 170 },
    { field: 'submittedDate', headerName: 'Submitted Date', width: 150 },
    { field: 'approvalDate', headerName: 'Approval Date', width: 150 }
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
        return 'No finding type listed';
    }
  };

  const getStandardTypeLabel = (typeValue) => {
    if (!typeValue && typeValue !== 0) return '';
    if (typeValue === 'PEQ' || typeValue === 'ETQ') return typeValue;
    const parsed = Number(typeValue);
    if (Number.isFinite(parsed)) {
      const standard = standardsList.find((s) => s.standardId === parsed);
      return standard ? standard.standardName : `Standard ${parsed}`;
    }
    return String(typeValue);
  };

  const handleExport = async () => {
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

    const auditIds = exportAudits.map((audit) => audit.scheduleId);
    const [nonconformanceSets, carSets] = await Promise.all([
      Promise.all(auditIds.map((scheduleId) =>
        fetch(buildApiUrl(`nonconformances/${scheduleId}`)).then((res) => res.json())
      )),
      Promise.all(auditIds.map((scheduleId) =>
        fetch(buildApiUrl(`cars/${scheduleId}`)).then((res) => res.json())
      ))
    ]);

    const rosterIds = [...new Set([
      ...exportAudits.flatMap((audit) => normalizeIdArray(audit.famaIds)),
      ...exportAudits.flatMap((audit) => normalizeIdArray(audit.intervieweeIds)),
      ...carSets.flatMap((auditCars) => (Array.isArray(auditCars) ? auditCars : []).map((car) => car?.reviewer))
    ].map((value) => String(value ?? '').trim()).filter(Boolean))];

    const rosterRows = rosterIds.length > 0 ? await getRosterByIds(rosterIds) : [];
    const rosterLookup = new Map(
      rosterRows
        .filter((entry) => entry?.myId)
        .map((entry) => [String(entry.myId), entry])
    );

    const formatRosterSingle = (myId) => {
      if (!myId) return '';
      const match = rosterLookup.get(String(myId));
      return match ? formatRosterLabel(match) : String(myId);
    };

    const formatRosterArray = (myIds) => {
      const ids = normalizeIdArray(myIds);
      if (ids.length === 0) return '';
      return ids.map((myId) => formatRosterSingle(myId)).join(', ');
    };

    const wb = XLSX.utils.book_new();

    // Schedule sheet
    const scheduleHeaders = [
      'Schedule ID', 'Title', 'Sector', 'Division', 'Program(s)', 'Site(s)',
      'Business Unit(s)', 'Operating Unit(s)', 'Audit Type',
      'Lead Auditor', 'Additional Auditors', 'Expected Start Date',
      'Expected Completion Date', 'Int/Ext Audit', 'Standard(s)',
      'Status', 'Function', 'Comment',
      'Submission Date', 'Approval Date'
    ];
    const scheduleRows = exportAudits.map((audit) => ([
      audit.scheduleId || '',
      audit.title || '',
      formatSingle(audit.sectorId, sectorsList, 'sectorId', 'sectorName'),
      formatArray(audit.divisionId, divisionsList, 'divisionId', 'divisionName'),
      formatArray(audit.programIds, programsList, 'programId', 'programName'),
      formatSiteArray(audit.siteIds),
      formatArray(audit.businessUnitIds, businessUnitsList, 'businessUnitId', 'businessUnitName'),
      formatArray(audit.operatingUnitIds, operatingUnitsList, 'operatingUnitId', 'operatingUnitName'),
      formatSingle(audit.auditTypeId, auditTypesList, 'auditTypeId', 'auditTypeName'),
      formatSingle(audit.leadAuditorId, auditorsList, 'auditorId', 'auditorName'),
      formatArray(audit.additionalAuditorIds, auditorsList, 'auditorId', 'auditorName'),
      formatDateForInput(audit.expectedStartDate),
      formatDateForInput(audit.expectedCompletionDate),
      formatSingle(audit.intExtId, intExtList, 'intExtId', 'intExtName'),
      formatArray(audit.standardIds, standardsList, 'standardId', 'standardName'),
      formatSingle(audit.statusId, statusesList, 'statusId', 'statusName'),
      formatArray(audit.functionId, functionsList, 'functionId', 'functionName'),
      audit.comment || '',
      formatDateForInput(audit.submittedAt),
      formatDateForInput(audit.approvedAt)
    ]));
    addSheet(wb, 'Schedule', scheduleHeaders, scheduleRows);

    // Planning sheet
    const planningHeaders = [
      'Schedule ID',
      'Scope',
      'Functional Area Managers/Auditees',
      'Safety Equipment Required',
      'Required Equipment',
      'Clearance Required',
      'Training Requirements',
      'Special Considerations'
    ];
    const planningRows = exportAudits
      .filter((audit) => getStageValue(audit) >= 2)
      .map((audit) => ([
        audit.scheduleId || '',
        audit.scope || '',
        formatRosterArray(audit.famaIds),
        audit.safety === 0 ? 'Yes' : audit.safety === 1 ? 'No' : 'Unknown',
        audit.safety === 0 ? formatArray(audit.safetyEquipmentIds, safetyEquipmentList, 'safetyEquipmentId', 'safetyEquipmentName') : '',
        audit.clearance === 0 ? 'Yes' : audit.clearance === 1 ? 'No' : 'Unknown',
        formatArray(audit.trainingRequirementIds, trainingRequirementsList, 'trainingRequirementId', 'trainingRequirementName'),
        audit.specialConsiderations || ''
      ]));
    addSheet(wb, 'Planning', planningHeaders, planningRows);

    // Results sheet
    const resultsHeaders = [
      'Schedule ID',
      'Actual Start Date',
      'Interviewees',
      'Audit Overview',
      'Evaluator',
      'Program Manager',
      'MA Lead Manager',
      'Related Items',
      'Auditor\'s Time (Hours)',
      'Delay Cause'
    ];
    const resultsRows = exportAudits
      .filter((audit) => getStageValue(audit) >= 3)
      .map((audit) => ([
        audit.scheduleId || '',
        formatDateForInput(audit.startDate),
        formatRosterArray(audit.intervieweeIds),
        audit.overview || '',
        audit.evaluator || '',
        audit.programManager || '',
        audit.maLeadManager || '',
        audit.relatedItems || '',
        audit.auditorsTime ?? '',
        audit.delayCause != null ? formatSingle(audit.delayCause, causesList, 'causeId', 'cause') : ''
      ]));
    addSheet(wb, 'Results', resultsHeaders, resultsRows);

    // PEQs sheet
    const peqHeaders = ['Schedule ID', 'NGAT Nonconformity Identifier', 'Finding Type', 'Severity', 'Question', 'Auditee Response', 'Auditor Comment', 'Details', 'Corrective Action Record Number'];
    const peqRows = [];
    exportAudits.forEach((audit, idx) => {
      if (getStageValue(audit) < 3) return;
      (nonconformanceSets[idx] || [])
        .filter((nc) => nc.type === 'PEQ')
        .forEach((nc) => {
          peqRows.push([
            audit.scheduleId,
            formatNcIdentifier(nc.ncId),
            getFindingTypeLabel(nc.findingType),
            getSeverityLabel(nc.severity),
            nc.question || '',
            nc.response || '',
            nc.auditorComment || '',
            nc.details || '',
            nc.AIN || ''
          ]);
        });
    });
    addSheet(wb, 'PEQs', peqHeaders, peqRows);

    // ETQs sheet
    const etqHeaders = ['Schedule ID', 'NGAT Nonconformity Identifier', 'Finding Type', 'Severity', 'Question', 'Auditee Response', 'Auditor Comment', 'Details', 'Corrective Action Record Number'];
    const etqRows = [];
    exportAudits.forEach((audit, idx) => {
      if (getStageValue(audit) < 3) return;
      (nonconformanceSets[idx] || [])
        .filter((nc) => nc.type === 'ETQ')
        .forEach((nc) => {
          etqRows.push([
            audit.scheduleId,
            formatNcIdentifier(nc.ncId),
            getFindingTypeLabel(nc.findingType),
            getSeverityLabel(nc.severity),
            nc.question || '',
            nc.response || '',
            nc.auditorComment || '',
            nc.details || '',
            nc.AIN || ''
          ]);
        });
    });
    addSheet(wb, 'ETQs', etqHeaders, etqRows);

    // Standard-based questions sheet
    const standardHeaders = ['Schedule ID', 'NGAT Nonconformity Identifier', 'Standard', 'Section', 'Subclause', 'Finding Type', 'Severity', 'Question', 'Auditee Response', 'Auditor Comment', 'Cause', 'Corrective Action Record Number'];
    const standardRows = [];
    exportAudits.forEach((audit, idx) => {
      if (getStageValue(audit) < 3) return;
      (nonconformanceSets[idx] || [])
        .filter((nc) => nc.type !== 'PEQ' && nc.type !== 'ETQ')
        .forEach((nc) => {
          standardRows.push([
            audit.scheduleId,
            formatNcIdentifier(nc.ncId),
            getStandardTypeLabel(nc.type),
            nc.section ?? '',
            nc.subsection ?? '',
            getFindingTypeLabel(nc.findingType),
            getSeverityLabel(nc.severity),
            nc.question || '',
            nc.response || '',
            nc.auditorComment || '',
            nc.details || '',
            nc.AIN || ''
          ]);
        });
    });
    addSheet(wb, 'Standard Questions', standardHeaders, standardRows);

    // CARs sheet
    const carHeaders = ['Schedule ID', 'CAR', 'Reviewer', 'Effective'];
    const carRows = [];
    exportAudits.forEach((audit, idx) => {
      if (getStageValue(audit) < 4) return;
      const cars = carSets[idx] || [];
      if (cars.length === 0) {
        carRows.push([
          audit.scheduleId,
          '',
          '',
          ''
        ]);
        return;
      }
      cars.forEach((car) => {
        carRows.push([
          audit.scheduleId,
          car.car || '',
          formatRosterSingle(car.reviewer),
          getPreviousCarsEffectiveLabel(car.effective)
        ]);
      });
    });
    addSheet(wb, 'CARs', carHeaders, carRows);

    toast.info('Now exporting...', exportToastOptions);
    XLSX.writeFile(wb, 'all-audit-reports.xlsx');
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

  const isRosterNonAuditor = currentUser?.myId && !currentUser?.auditorId;

  if (isRosterNonAuditor) {
    return (
      <div className="reports-page">
        <div className="reports-container">
          <div className="reports-loading">
            You are not listed as an auditor. Request access to continue.
            <div style={{ marginTop: '1rem' }}>
              <button
                type="button"
                className="button"
                style={{ backgroundColor: '#0066cc', width: '220px' }}
                onClick={() => navigate('/request-auditor-access')}
              >
                Request Access
              </button>
            </div>
          </div>
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
            <h1>All Reports</h1>
            <p>Filter audits below and export a consolidated Excel report.</p>
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
                isMulti
                className="reports-select"
                classNamePrefix="reports-select"
                options={divisionOptions}
                styles={customStyles}
                value={divisionFilter}
                onChange={(value) => setDivisionFilter(value || [])}
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
                isMulti
                className="reports-select"
                classNamePrefix="reports-select"
                options={functionOptions}
                styles={customStyles}
                value={functionFilter}
                onChange={(value) => setFunctionFilter(value || [])}
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

export default AllReports;
