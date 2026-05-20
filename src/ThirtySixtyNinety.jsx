import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Select from 'react-select';
import { DataGrid } from '@mui/x-data-grid';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './AllReports.css';
import { customStyles, formatDateForInput, formatMonthValue, parseCalendarDate } from './Utilities.jsx';
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
  getCauses,
  getSafetyEquipment,
  getTrainingRequirements,
  getSeverities,
  getProps,
  getNonconformances
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
  const [searchParams] = useSearchParams();
  const exportToastOptions = {
    progressStyle: { backgroundColor: '#2196f3' },
    style: { borderLeft: '4px solid #2196f3' }
  };
  const reportType = searchParams.get('type') || '30-60-90';
  const [loading, setLoading] = useState(true);
  const [audits, setAudits] = useState([]);
  const [nonconformances, setNonconformances] = useState([]);
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
  const [propsList, setPropsList] = useState([]);

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
  const [submittedFrom, setSubmittedFrom] = useState('');
  const [submittedTo, setSubmittedTo] = useState('');
  const [approvedFrom, setApprovedFrom] = useState('');
  const [approvedTo, setApprovedTo] = useState('');
  const [showAllFilters, setShowAllFilters] = useState(false);

  const reportConfigs = useMemo(() => ({
    '30-60-90': {
      title: '30/60/90 Report',
      description: 'Filter audits below and export the 30/60/90 schedule report.',
      ready: true
    },
    'planned-vs-completed': {
      title: 'Planned vs Completed',
      description: 'Summary counts of audits by stage and finding type across organizational groupings.',
      ready: true
    },
    'rollup-results': { title: 'Rollup Audit Results', description: '', ready: true },
    'rollup-findings': { title: 'Rollup Audit Findings', description: '', ready: false },
    'rollup-schedule': { title: 'Rollup Audit Schedule', description: '', ready: true },
    'clauses-audited': { title: 'Clauses Audited', description: '', ready: true },
    'processes-audited': { title: 'Processes Audited', description: '', ready: true },
    'schedule-comments': { title: 'Schedule Comments', description: '', ready: true }
  }), []);

  const activeReport = reportConfigs[reportType] || {
    title: 'Audit Report',
    description: '',
    ready: false
  };

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
          safetyEquipment,
          trainingRequirements,
          severities,
          causes,
          nonconformancesData,
          props
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
          getSafetyEquipment(),
          getTrainingRequirements(),
          getSeverities(),
          getCauses(),
          getNonconformances(),
          getProps()
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
        setSafetyEquipmentList(safetyEquipment);
        setTrainingRequirementsList(trainingRequirements);
        setSeveritiesList(severities);
        setCausesList(causes);
        setNonconformances(nonconformancesData);
        setPropsList(props);
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

  const getPropName = (propId) => {
    if (propId === null || propId === undefined) return '';
    const prop = propsList.find((item) => item.propId === propId);
    return prop ? prop.PrOP : propId;
  };

  const getAuditNonconformances = (scheduleId) => {
    const targetId = Number(scheduleId);
    return nonconformances.filter((nc) => {
      const ncScheduleId = Number(nc.scheduleId ?? nc.scheduleid);
      return Number.isFinite(ncScheduleId) && ncScheduleId === targetId;
    });
  };

  const getPropDocumentsListForAudit = (scheduleId) => {
    const propIds = new Set();
    getAuditNonconformances(scheduleId).forEach((nc) => {
      ['division', 'sector', 'qma', 'other'].forEach((field) => {
        const entries = Array.isArray(nc[field]) ? nc[field] : [];
        entries.forEach((value) => {
          if (value !== null && value !== undefined && value !== '') {
            propIds.add(Number(value));
          }
        });
      });
    });
    const names = Array.from(propIds)
      .map((id) => getPropName(id))
      .filter(Boolean);
    return [...new Set(names)];
  };

  const getStandardClausesForAudit = (scheduleId) => {
    const clauseMap = new Map();
    getAuditNonconformances(scheduleId).forEach((nc) => {
      if (!nc.section) return;
      const section = nc.section;
      const subsection = nc.subsection;
      const question = nc.question;
      const key = `${section}-${subsection || ''}`;
      if (clauseMap.has(key)) return;
      const label = `Clause ${section}${subsection ? `.${subsection}` : ''}${question ? ` - ${question}` : ''}`;
      clauseMap.set(key, label);
    });
    return Array.from(clauseMap.values());
  };

  const getPrOpsForAudit = (scheduleId) => {
    const propDocs = getPropDocumentsListForAudit(scheduleId);
    const clauses = getStandardClausesForAudit(scheduleId);
    const combined = [...propDocs, ...clauses].filter(Boolean);
    return [...new Set(combined)];
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

  const getStageLabel = (audit) => {
    const stage = Number(audit?.stage);
    if (stage === -1) return 'Historical';
    if (audit?.approvedAt) return 'Approved';
    if (Number(audit?.locked) === 1) return 'Pending Approval';
    switch (stage) {
      case 1:
        return 'Planning';
      case 2:
        return 'Conduct Audit';
      case 3:
      case 4:
        return 'Nonconformities';
      default:
        return 'Unknown';
    }
  };

  const severityLabelById = useMemo(() => {
    return new Map(severitiesList.map((item) => [Number(item.severityId), String(item.severity || '')]));
  }, [severitiesList]);

  const formatMonth = (value) => {
    return formatMonthValue(value);
  };

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
      if ((submittedFrom || submittedTo) && !matchesDateRange(audit.submittedAt, submittedFrom, submittedTo)) {
        return false;
      }
      if ((approvedFrom || approvedTo) && !matchesDateRange(audit.approvedAt, approvedFrom, approvedTo)) {
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
    expectedCompletionTo,
    submittedFrom,
    submittedTo,
    approvedFrom,
    approvedTo
  ]);

  const sortedFilteredAudits = useMemo(() => {
    return [...filteredAudits].sort((a, b) => Number(b.scheduleId) - Number(a.scheduleId));
  }, [filteredAudits]);

  const stageColumns = [
    { key: 'stagePlanning', label: 'Planning' },
    { key: 'stageConduct', label: 'Conduct Audit' },
    { key: 'stageNonconformities', label: 'Nonconformities' },
    { key: 'stagePending', label: 'Pending Approval' },
    { key: 'stageApproved', label: 'Approved' },
    { key: 'stageHistorical', label: 'Historical' }
  ];

  const findingColumns = [
    { key: 'findingNonconformities', label: 'Nonconformities' },
    { key: 'findingConformities', label: 'Conformities' },
    { key: 'findingOfis', label: 'OFIs' },
    { key: 'findingObservations', label: 'Observations' }
  ];

  const findingsBySchedule = useMemo(() => {
    const map = new Map();
    nonconformances.forEach((nc) => {
      const scheduleId = nc.scheduleId ?? nc.scheduleid;
      if (!scheduleId) return;
      if (!map.has(scheduleId)) {
        map.set(scheduleId, {
          nonconformities: 0,
          conformities: 0,
          ofis: 0,
          observations: 0
        });
      }
      const bucket = map.get(scheduleId);
      const type = Number(nc.findingType ?? nc.findingtype);
      if (type === 1) bucket.nonconformities += 1;
      else if (type === 2) bucket.conformities += 1;
      else if (type === 3) bucket.ofis += 1;
      else if (type === 4) bucket.observations += 1;
    });
    return map;
  }, [nonconformances]);

  const rollupFindingSummary = useMemo(() => {
    const map = new Map();
    nonconformances.forEach((nc) => {
      const scheduleId = nc.scheduleId ?? nc.scheduleid;
      if (!scheduleId) return;
      if (!map.has(scheduleId)) {
        map.set(scheduleId, { major: 0, minor: 0, obs: 0, ofi: 0 });
      }
      const summary = map.get(scheduleId);
      const type = Number(nc.findingType ?? nc.findingtype);
      if (type === 3) summary.ofi += 1;
      if (type === 4) summary.obs += 1;
      if (type === 1) {
        const severityId = Number(nc.severity ?? nc.severityid);
        const severityLabel = severityLabelById.get(severityId) || '';
        const normalized = severityLabel.toLowerCase();
        if (normalized.includes('major')) {
          summary.major += 1;
        } else if (normalized.includes('minor')) {
          summary.minor += 1;
        }
      }
    });
    return map;
  }, [nonconformances, severityLabelById]);

  const groupedReportRows = useMemo(() => {
    if (reportType !== 'planned-vs-completed') {
      return [];
    }

    const groups = new Map();
    const auditsToGroup = sortedFilteredAudits;

    auditsToGroup.forEach((audit) => {
      const intExtLabel = formatSingle(audit.intExtId, intExtList, 'intExtId', 'intExtName') || 'Unassigned';
      const divisionIds = normalizeIdArray(audit.divisionId);
      const businessUnitIds = normalizeIdArray(audit.businessUnitIds);
      const operatingUnitIds = normalizeIdArray(audit.operatingUnitIds);
      const programIds = normalizeIdArray(audit.programIds);
      const stageLabel = getStageLabel(audit);
      const findingCounts = findingsBySchedule.get(audit.scheduleId) || {
        nonconformities: 0,
        conformities: 0,
        ofis: 0,
        observations: 0
      };

      const divisions = divisionIds.length > 0 ? divisionIds : [null];
      const businessUnits = businessUnitIds.length > 0 ? businessUnitIds : [null];
      const operatingUnits = operatingUnitIds.length > 0 ? operatingUnitIds : [null];
      const programs = programIds.length > 0 ? programIds : [null];

      divisions.forEach((divisionId) => {
        const divisionLabel = divisionId
          ? formatSingle(divisionId, divisionsList, 'divisionId', 'divisionName')
          : 'Unassigned';
        businessUnits.forEach((businessUnitId) => {
          const businessUnitLabel = businessUnitId
            ? formatSingle(businessUnitId, businessUnitsList, 'businessUnitId', 'businessUnitName')
            : 'Unassigned';
          operatingUnits.forEach((operatingUnitId) => {
            const operatingUnitLabel = operatingUnitId
              ? formatSingle(operatingUnitId, operatingUnitsList, 'operatingUnitId', 'operatingUnitName')
              : 'Unassigned';
            programs.forEach((programId) => {
              const programLabel = programId
                ? formatSingle(programId, programsList, 'programId', 'programName')
                : 'Unassigned';

              const key = [
                intExtLabel,
                divisionLabel,
                businessUnitLabel,
                operatingUnitLabel,
                programLabel
              ].join('||');

              if (!groups.has(key)) {
                groups.set(key, {
                  id: key,
                  intExt: intExtLabel,
                  division: divisionLabel,
                  businessUnit: businessUnitLabel,
                  operatingUnit: operatingUnitLabel,
                  program: programLabel,
                  stagePlanning: 0,
                  stageConduct: 0,
                  stageNonconformities: 0,
                  stagePending: 0,
                  stageApproved: 0,
                  stageHistorical: 0,
                  findingNonconformities: 0,
                  findingConformities: 0,
                  findingOfis: 0,
                  findingObservations: 0
                });
              }

              const group = groups.get(key);
              if (stageLabel === 'Planning') group.stagePlanning += 1;
              else if (stageLabel === 'Conduct Audit') group.stageConduct += 1;
              else if (stageLabel === 'Nonconformities') group.stageNonconformities += 1;
              else if (stageLabel === 'Pending Approval') group.stagePending += 1;
              else if (stageLabel === 'Approved') group.stageApproved += 1;
              else if (stageLabel === 'Historical') group.stageHistorical += 1;

              group.findingNonconformities += findingCounts.nonconformities;
              group.findingConformities += findingCounts.conformities;
              group.findingOfis += findingCounts.ofis;
              group.findingObservations += findingCounts.observations;
            });
          });
        });
      });
    });

    return Array.from(groups.values()).map((group, index) => ({
      ...group,
      id: `${group.id}-${index}`
    }));
  }, [
    reportType,
    sortedFilteredAudits,
    intExtList,
    divisionsList,
    businessUnitsList,
    operatingUnitsList,
    programsList,
    findingsBySchedule
  ]);

  const defaultRows = sortedFilteredAudits.map((audit) => ({
    id: audit.scheduleId,
    scheduleId: audit.scheduleId,
    title: audit.title,
    division: formatArray(audit.divisionId, divisionsList, 'divisionId', 'divisionName'),
    programs: formatArray(audit.programIds, programsList, 'programId', 'programName'),
    auditType: formatSingle(audit.auditTypeId, auditTypesList, 'auditTypeId', 'auditTypeName'),
    status: formatSingle(audit.statusId, statusesList, 'statusId', 'statusName'),
    expectedStartDate: formatDateForInput(audit.expectedStartDate),
    expectedCompletionDate: formatDateForInput(audit.expectedCompletionDate)
  }));

  const defaultColumns = [
    { field: 'scheduleId', headerName: 'Schedule ID', width: 130 },
    { field: 'title', headerName: 'Title', width: 260 },
    { field: 'division', headerName: 'Division', width: 160 },
    { field: 'programs', headerName: 'Program(s)', width: 200 },
    { field: 'auditType', headerName: 'Audit Type', width: 140 },
    { field: 'status', headerName: 'Status', width: 140 },
    { field: 'expectedStartDate', headerName: 'Expected Start', width: 140 },
    { field: 'expectedCompletionDate', headerName: 'Expected Completion', width: 170 }
  ];

  const plannedCompletedColumns = [
    { field: 'intExt', headerName: 'Int/Ext', width: 140 },
    { field: 'division', headerName: 'Division', width: 180 },
    { field: 'businessUnit', headerName: 'Business Unit', width: 180 },
    { field: 'operatingUnit', headerName: 'Operating Unit', width: 180 },
    { field: 'program', headerName: 'Program', width: 200 },
    ...stageColumns.map((col) => ({ field: col.key, headerName: col.label, width: 150 })),
    ...findingColumns.map((col) => ({ field: col.key, headerName: col.label, width: 150 }))
  ];

  const rollupResultsRows = useMemo(() => {
    if (reportType !== 'rollup-results') {
      return [];
    }
    return sortedFilteredAudits.map((audit) => {
      const summary = rollupFindingSummary.get(audit.scheduleId) || { major: 0, minor: 0, obs: 0, ofi: 0 };
      return {
        id: audit.scheduleId,
        scheduleId: audit.scheduleId,
        intExt: formatSingle(audit.intExtId, intExtList, 'intExtId', 'intExtName'),
        divisions: formatArray(audit.divisionId, divisionsList, 'divisionId', 'divisionName'),
        businessUnits: formatArray(audit.businessUnitIds, businessUnitsList, 'businessUnitId', 'businessUnitName'),
        operatingUnits: formatArray(audit.operatingUnitIds, operatingUnitsList, 'operatingUnitId', 'operatingUnitName'),
        programs: formatArray(audit.programIds, programsList, 'programId', 'programName'),
        standards: formatArray(audit.standardIds, standardsList, 'standardId', 'standardName'),
        plannedStartMonth: formatMonth(audit.expectedStartDate),
        actualStartMonth: formatMonth(audit.startDate),
        major: summary.major,
        minor: summary.minor,
        obs: summary.obs,
        ofi: summary.ofi
      };
    });
  }, [
    reportType,
    sortedFilteredAudits,
    rollupFindingSummary,
    intExtList,
    divisionsList,
    businessUnitsList,
    operatingUnitsList,
    programsList,
    standardsList
  ]);

  const rollupScheduleRows = useMemo(() => {
    if (reportType !== 'rollup-schedule') {
      return [];
    }
    return sortedFilteredAudits.map((audit) => {
      const leadAuditor = formatSingle(audit.leadAuditorId, auditorsList, 'auditorId', 'auditorName');
      const additionalAuditors = normalizeIdArray(audit.additionalAuditorIds)
        .map((id) => {
          const auditor = auditorsList.find((entry) => entry.auditorId === id);
          return auditor ? auditor.auditorName : id;
        })
        .filter(Boolean)
        .join('; ');
      const auditors = [leadAuditor, additionalAuditors].filter(Boolean).join('; ');
      const prOpsList = getPrOpsForAudit(audit.scheduleId);
      return {
        id: audit.scheduleId,
        scheduleId: audit.scheduleId,
        divisions: formatArray(audit.divisionId, divisionsList, 'divisionId', 'divisionName'),
        businessUnits: formatArray(audit.businessUnitIds, businessUnitsList, 'businessUnitId', 'businessUnitName'),
        operatingUnits: formatArray(audit.operatingUnitIds, operatingUnitsList, 'operatingUnitId', 'operatingUnitName'),
        programs: formatArray(audit.programIds, programsList, 'programId', 'programName'),
        props: prOpsList.join('; '),
        auditType: formatSingle(audit.auditTypeId, auditTypesList, 'auditTypeId', 'auditTypeName'),
        intExt: formatSingle(audit.intExtId, intExtList, 'intExtId', 'intExtName'),
        stage: getStageLabel(audit),
        scheduledMonth: formatMonth(audit.expectedStartDate),
        auditors
      };
    });
  }, [
    reportType,
    sortedFilteredAudits,
    auditorsList,
    divisionsList,
    businessUnitsList,
    operatingUnitsList,
    programsList,
    auditTypesList,
    intExtList,
    nonconformances,
    propsList
  ]);

  const formatClauseLabel = (section, subsection) => {
    if (section === null || section === undefined || section === '') {
      return '';
    }
    return subsection === null || subsection === undefined || subsection === ''
      ? String(section)
      : `${section}.${subsection}`;
  };

  const clausesAuditedRows = useMemo(() => {
    if (reportType !== 'clauses-audited') {
      return [];
    }

    const clauseRows = [];

    sortedFilteredAudits.forEach((audit) => {
      const auditStandardIds = new Set(normalizeIdArray(audit.standardIds).map((id) => Number(id)));
      const matchingStandardFindings = getAuditNonconformances(audit.scheduleId)
        .filter((nc) => {
          const standardId = Number(nc.type);
          const section = nc.section;
          if (!Number.isFinite(standardId)) return false;
          if (section === null || section === undefined || section === '') return false;
          if (auditStandardIds.size > 0 && !auditStandardIds.has(standardId)) return false;
          return true;
        })
        .sort((a, b) => {
          const standardDiff = Number(a.type) - Number(b.type);
          if (standardDiff !== 0) return standardDiff;
          const sectionDiff = Number(a.section) - Number(b.section);
          if (sectionDiff !== 0) return sectionDiff;
          return Number(a.subsection ?? 0) - Number(b.subsection ?? 0);
        });

      matchingStandardFindings.forEach((nc) => {
        const standardId = Number(nc.type);
        clauseRows.push({
          id: nc.ncId ?? `${audit.scheduleId}-${standardId}-${nc.section}-${nc.subsection ?? 'na'}-${clauseRows.length}`,
          scheduleId: audit.scheduleId,
          standard: formatSingle(standardId, standardsList, 'standardId', 'standardName') || `Standard ${standardId}`,
          clause: formatClauseLabel(nc.section, nc.subsection),
          divisions: formatArray(audit.divisionId, divisionsList, 'divisionId', 'divisionName'),
          businessUnits: formatArray(audit.businessUnitIds, businessUnitsList, 'businessUnitId', 'businessUnitName'),
          operatingUnits: formatArray(audit.operatingUnitIds, operatingUnitsList, 'operatingUnitId', 'operatingUnitName'),
          programs: formatArray(audit.programIds, programsList, 'programId', 'programName'),
          auditType: formatSingle(audit.auditTypeId, auditTypesList, 'auditTypeId', 'auditTypeName'),
          stage: getStageLabel(audit),
          scheduledMonth: formatMonth(audit.expectedStartDate)
        });
      });
    });

    return clauseRows;
  }, [
    reportType,
    sortedFilteredAudits,
    nonconformances,
    standardsList,
    divisionsList,
    businessUnitsList,
    operatingUnitsList,
    programsList,
    auditTypesList
  ]);

  const processesAuditedRows = useMemo(() => {
    if (reportType !== 'processes-audited') {
      return [];
    }

    const processRows = [];

    sortedFilteredAudits.forEach((audit) => {
      const auditProcessIds = new Set();
      getAuditNonconformances(audit.scheduleId).forEach((nc) => {
        ['qma', 'sector', 'division', 'other'].forEach((field) => {
          const values = Array.isArray(nc[field]) ? nc[field] : [];
          values.forEach((value) => {
            const parsed = Number(value);
            if (Number.isFinite(parsed)) {
              auditProcessIds.add(parsed);
            }
          });
        });
      });

      Array.from(auditProcessIds)
        .sort((a, b) => getPropName(a).toString().localeCompare(getPropName(b).toString()))
        .forEach((propId) => {
          processRows.push({
            id: `${audit.scheduleId}-${propId}`,
            process: getPropName(propId),
            scheduleId: audit.scheduleId,
            divisions: formatArray(audit.divisionId, divisionsList, 'divisionId', 'divisionName'),
            businessUnits: formatArray(audit.businessUnitIds, businessUnitsList, 'businessUnitId', 'businessUnitName'),
            operatingUnits: formatArray(audit.operatingUnitIds, operatingUnitsList, 'operatingUnitId', 'operatingUnitName'),
            programs: formatArray(audit.programIds, programsList, 'programId', 'programName'),
            auditType: formatSingle(audit.auditTypeId, auditTypesList, 'auditTypeId', 'auditTypeName'),
            stage: getStageLabel(audit),
            scheduledMonth: formatMonth(audit.expectedStartDate),
            auditTime: audit.auditorsTime ?? audit.auditorstime ?? ''
          });
        });
    });

    return processRows;
  }, [
    reportType,
    sortedFilteredAudits,
    nonconformances,
    propsList,
    divisionsList,
    businessUnitsList,
    operatingUnitsList,
    programsList,
    auditTypesList
  ]);

  const scheduleCommentsRows = useMemo(() => {
    if (reportType !== 'schedule-comments') {
      return [];
    }

    return sortedFilteredAudits.map((audit) => ({
      id: audit.scheduleId,
      scheduleId: audit.scheduleId,
      divisions: formatArray(audit.divisionId, divisionsList, 'divisionId', 'divisionName'),
      businessUnits: formatArray(audit.businessUnitIds, businessUnitsList, 'businessUnitId', 'businessUnitName'),
      operatingUnits: formatArray(audit.operatingUnitIds, operatingUnitsList, 'operatingUnitId', 'operatingUnitName'),
      programs: formatArray(audit.programIds, programsList, 'programId', 'programName'),
      processes: getPrOpsForAudit(audit.scheduleId).join('; '),
      stage: getStageLabel(audit),
      startDate: formatDateForInput(audit.expectedStartDate),
      comment: audit.comment || ''
    }));
  }, [
    reportType,
    sortedFilteredAudits,
    divisionsList,
    businessUnitsList,
    operatingUnitsList,
    programsList,
    nonconformances,
    propsList
  ]);

  const rollupResultsColumns = [
    { field: 'scheduleId', headerName: 'Schedule ID', width: 130 },
    { field: 'intExt', headerName: 'Int/Ext', width: 140 },
    { field: 'divisions', headerName: 'Division(s)', width: 180 },
    { field: 'businessUnits', headerName: 'BU(s)', width: 180 },
    { field: 'operatingUnits', headerName: 'OU(s)', width: 180 },
    { field: 'programs', headerName: 'Program(s)', width: 200 },
    { field: 'standards', headerName: 'Standard(s)', width: 200 },
    { field: 'plannedStartMonth', headerName: 'Planned Start Month', width: 170 },
    { field: 'actualStartMonth', headerName: 'Actual Start Month', width: 170 },
    { field: 'major', headerName: 'Major NCs', width: 130 },
    { field: 'minor', headerName: 'Minor NCs', width: 130 },
    { field: 'obs', headerName: 'Observations', width: 130 },
    { field: 'ofi', headerName: 'OFIs', width: 110 }
  ];

  const rollupScheduleColumns = [
    { field: 'scheduleId', headerName: 'Schedule ID', width: 130 },
    { field: 'divisions', headerName: 'Division(s)', width: 180 },
    { field: 'businessUnits', headerName: 'BU(s)', width: 180 },
    { field: 'operatingUnits', headerName: 'OU(s)', width: 180 },
    { field: 'programs', headerName: 'Program(s)', width: 200 },
    { field: 'props', headerName: 'PrOPs', width: 260 },
    { field: 'auditType', headerName: 'Audit Type', width: 160 },
    { field: 'intExt', headerName: 'Int/Ext', width: 140 },
    { field: 'stage', headerName: 'Stage', width: 170 },
    { field: 'scheduledMonth', headerName: 'Scheduled Month', width: 170 },
    { field: 'auditors', headerName: 'Auditors', width: 220 }
  ];

  const clausesAuditedColumns = [
    { field: 'standard', headerName: 'Standard', width: 180 },
    { field: 'clause', headerName: 'Clause', width: 140 },
    { field: 'scheduleId', headerName: 'Schedule ID', width: 130 },
    { field: 'divisions', headerName: 'Div', width: 180 },
    { field: 'businessUnits', headerName: 'BU', width: 180 },
    { field: 'operatingUnits', headerName: 'OU', width: 180 },
    { field: 'programs', headerName: 'Program', width: 200 },
    { field: 'auditType', headerName: 'Audit Type', width: 160 },
    { field: 'stage', headerName: 'Stage', width: 170 },
    { field: 'scheduledMonth', headerName: 'Scheduled Month', width: 170 }
  ];

  const processesAuditedColumns = [
    { field: 'process', headerName: 'Process', width: 220 },
    { field: 'scheduleId', headerName: 'Schedule ID', width: 130 },
    { field: 'divisions', headerName: 'Division', width: 180 },
    { field: 'businessUnits', headerName: 'BU', width: 180 },
    { field: 'operatingUnits', headerName: 'OU', width: 180 },
    { field: 'programs', headerName: 'Program', width: 200 },
    { field: 'auditType', headerName: 'Audit Type', width: 160 },
    { field: 'stage', headerName: 'Stage', width: 170 },
    { field: 'scheduledMonth', headerName: 'Scheduled Month', width: 170 },
    { field: 'auditTime', headerName: 'Audit Time (hrs)', width: 150 }
  ];

  const scheduleCommentsColumns = [
    { field: 'scheduleId', headerName: 'Schedule ID', width: 130 },
    { field: 'divisions', headerName: 'Division', width: 180 },
    { field: 'businessUnits', headerName: 'BU', width: 180 },
    { field: 'operatingUnits', headerName: 'OU', width: 180 },
    { field: 'programs', headerName: 'Program', width: 200 },
    { field: 'processes', headerName: 'Processes', width: 260 },
    { field: 'stage', headerName: 'Stage', width: 170 },
    { field: 'startDate', headerName: 'Start Date', width: 140 },
    { field: 'comment', headerName: 'Comment', width: 320 }
  ];

  const rows = reportType === 'planned-vs-completed'
    ? groupedReportRows
    : reportType === 'rollup-results'
      ? rollupResultsRows
      : reportType === 'rollup-schedule'
        ? rollupScheduleRows
        : reportType === 'clauses-audited'
          ? clausesAuditedRows
          : reportType === 'processes-audited'
            ? processesAuditedRows
            : reportType === 'schedule-comments'
              ? scheduleCommentsRows
          : defaultRows;
  const columns = reportType === 'planned-vs-completed'
    ? plannedCompletedColumns
    : reportType === 'rollup-results'
      ? rollupResultsColumns
      : reportType === 'rollup-schedule'
        ? rollupScheduleColumns
        : reportType === 'clauses-audited'
          ? clausesAuditedColumns
          : reportType === 'processes-audited'
            ? processesAuditedColumns
            : reportType === 'schedule-comments'
              ? scheduleCommentsColumns
          : defaultColumns;

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

  const handleExport = () => {
    const notifyExportStarting = () => {
      toast.info('Now exporting...', exportToastOptions);
    };

    if (!activeReport.ready) {
      toast.info('This report is not configured yet.');
      return;
    }

    if (reportType === 'planned-vs-completed') {
      if (rows.length === 0) {
        toast.error('No audits match the selected filters.');
        return;
      }

      const headers = [
        'Int/Ext',
        'Division',
        'Business Unit',
        'Operating Unit',
        'Program',
        ...stageColumns.map((col) => col.label),
        ...findingColumns.map((col) => col.label)
      ];

      const exportRows = rows.map((row) => ([
        row.intExt,
        row.division,
        row.businessUnit,
        row.operatingUnit,
        row.program,
        ...stageColumns.map((col) => row[col.key] ?? 0),
        ...findingColumns.map((col) => row[col.key] ?? 0)
      ]));

      const wb = XLSX.utils.book_new();
      const sheet = XLSX.utils.aoa_to_sheet([headers, ...exportRows]);
      headers.forEach((_, idx) => {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: idx });
        if (sheet[cellAddress]) {
          sheet[cellAddress].s = { font: { bold: true } };
        }
      });
      const colWidths = headers.map((header, idx) => {
        const maxCell = exportRows.reduce((max, row) => {
          const cell = row[idx] ?? '';
          return Math.max(max, cell.toString().length);
        }, header.length);
        return { wch: maxCell + 2 };
      });
      sheet['!cols'] = colWidths;
      XLSX.utils.book_append_sheet(wb, sheet, 'Planned vs Completed');
      notifyExportStarting();
      XLSX.writeFile(wb, 'planned-vs-completed-report.xlsx');
      return;
    }

    if (reportType === 'rollup-results') {
      if (rows.length === 0) {
        toast.error('No audits match the selected filters.');
        return;
      }

      const headers = [
        'Schedule ID',
        'Int/Ext',
        'Division(s)',
        'BU(s)',
        'OU(s)',
        'Program(s)',
        'Standard(s)',
        'Planned Start Month',
        'Actual Start Month',
        'Major NCs',
        'Minor NCs',
        'Observations',
        'OFIs'
      ];

      const exportRows = rows.map((row) => ([
        row.scheduleId,
        row.intExt,
        row.divisions,
        row.businessUnits,
        row.operatingUnits,
        row.programs,
        row.standards,
        row.plannedStartMonth,
        row.actualStartMonth,
        row.major,
        row.minor,
        row.obs,
        row.ofi
      ]));

      const wb = XLSX.utils.book_new();
      const sheet = XLSX.utils.aoa_to_sheet([headers, ...exportRows]);
      headers.forEach((_, idx) => {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: idx });
        if (sheet[cellAddress]) {
          sheet[cellAddress].s = { font: { bold: true } };
        }
      });
      const colWidths = headers.map((header, idx) => {
        const maxCell = exportRows.reduce((max, row) => {
          const cell = row[idx] ?? '';
          return Math.max(max, cell.toString().length);
        }, header.length);
        return { wch: maxCell + 2 };
      });
      sheet['!cols'] = colWidths;
      XLSX.utils.book_append_sheet(wb, sheet, 'Rollup Audit Results');
      notifyExportStarting();
      XLSX.writeFile(wb, 'rollup-audit-results.xlsx');
      return;
    }

    if (reportType === 'rollup-schedule') {
      if (rows.length === 0) {
        toast.error('No audits match the selected filters.');
        return;
      }

      const headers = [
        'Schedule ID',
        'Division(s)',
        'BU(s)',
        'OU(s)',
        'Program(s)',
        'PrOPs',
        'Audit Type',
        'Int/Ext',
        'Stage',
        'Scheduled Month',
        'Auditors'
      ];

      const exportRows = rows.map((row) => ([
        row.scheduleId,
        row.divisions,
        row.businessUnits,
        row.operatingUnits,
        row.programs,
        row.props,
        row.auditType,
        row.intExt,
        row.stage,
        row.scheduledMonth,
        row.auditors
      ]));

      const wb = XLSX.utils.book_new();
      const sheet = XLSX.utils.aoa_to_sheet([headers, ...exportRows]);
      headers.forEach((_, idx) => {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: idx });
        if (sheet[cellAddress]) {
          sheet[cellAddress].s = { font: { bold: true } };
        }
      });
      const colWidths = headers.map((header, idx) => {
        const maxCell = exportRows.reduce((max, row) => {
          const cell = row[idx] ?? '';
          return Math.max(max, cell.toString().length);
        }, header.length);
        return { wch: maxCell + 2 };
      });
      sheet['!cols'] = colWidths;
      XLSX.utils.book_append_sheet(wb, sheet, 'Rollup Audit Schedule');
      notifyExportStarting();
      XLSX.writeFile(wb, 'rollup-audit-schedule.xlsx');
      return;
    }

    if (reportType === 'clauses-audited') {
      if (rows.length === 0) {
        toast.error('No audits match the selected filters.');
        return;
      }

      const headers = [
        'Standard',
        'Clause',
        'Schedule ID',
        'Div',
        'BU',
        'OU',
        'Program',
        'Audit Type',
        'Stage',
        'Scheduled Month'
      ];

      const exportRows = rows.map((row) => ([
        row.standard,
        row.clause,
        row.scheduleId,
        row.divisions,
        row.businessUnits,
        row.operatingUnits,
        row.programs,
        row.auditType,
        row.stage,
        row.scheduledMonth
      ]));

      const wb = XLSX.utils.book_new();
      const sheet = XLSX.utils.aoa_to_sheet([headers, ...exportRows]);
      headers.forEach((_, idx) => {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: idx });
        if (sheet[cellAddress]) {
          sheet[cellAddress].s = { font: { bold: true } };
        }
      });
      const colWidths = headers.map((header, idx) => {
        const maxCell = exportRows.reduce((max, row) => {
          const cell = row[idx] ?? '';
          return Math.max(max, cell.toString().length);
        }, header.length);
        return { wch: maxCell + 2 };
      });
      sheet['!cols'] = colWidths;
      XLSX.utils.book_append_sheet(wb, sheet, 'Clauses Audited');
      notifyExportStarting();
      XLSX.writeFile(wb, 'clauses-audited-report.xlsx');
      return;
    }

    if (reportType === 'processes-audited') {
      if (rows.length === 0) {
        toast.error('No audits match the selected filters.');
        return;
      }

      const headers = [
        'Process',
        'Schedule ID',
        'Division',
        'BU',
        'OU',
        'Program',
        'Audit Type',
        'Stage',
        'Scheduled Month',
        'Audit Time (hrs)'
      ];

      const exportRows = rows.map((row) => ([
        row.process,
        row.scheduleId,
        row.divisions,
        row.businessUnits,
        row.operatingUnits,
        row.programs,
        row.auditType,
        row.stage,
        row.scheduledMonth,
        row.auditTime
      ]));

      const wb = XLSX.utils.book_new();
      const sheet = XLSX.utils.aoa_to_sheet([headers, ...exportRows]);
      headers.forEach((_, idx) => {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: idx });
        if (sheet[cellAddress]) {
          sheet[cellAddress].s = { font: { bold: true } };
        }
      });
      const colWidths = headers.map((header, idx) => {
        const maxCell = exportRows.reduce((max, row) => {
          const cell = row[idx] ?? '';
          return Math.max(max, cell.toString().length);
        }, header.length);
        return { wch: maxCell + 2 };
      });
      sheet['!cols'] = colWidths;
      XLSX.utils.book_append_sheet(wb, sheet, 'Processes Audited');
      notifyExportStarting();
      XLSX.writeFile(wb, 'processes-audited-report.xlsx');
      return;
    }

    if (reportType === 'schedule-comments') {
      if (rows.length === 0) {
        toast.error('No audits match the selected filters.');
        return;
      }

      const headers = [
        'Schedule ID',
        'Division',
        'BU',
        'OU',
        'Program',
        'Processes',
        'Stage',
        'Start Date',
        'Comment'
      ];

      const exportRows = rows.map((row) => ([
        row.scheduleId,
        row.divisions,
        row.businessUnits,
        row.operatingUnits,
        row.programs,
        row.processes,
        row.stage,
        row.startDate,
        row.comment
      ]));

      const wb = XLSX.utils.book_new();
      const sheet = XLSX.utils.aoa_to_sheet([headers, ...exportRows]);
      headers.forEach((_, idx) => {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: idx });
        if (sheet[cellAddress]) {
          sheet[cellAddress].s = { font: { bold: true } };
        }
      });
      const colWidths = headers.map((header, idx) => {
        const maxCell = exportRows.reduce((max, row) => {
          const cell = row[idx] ?? '';
          return Math.max(max, cell.toString().length);
        }, header.length);
        return { wch: maxCell + 2 };
      });
      sheet['!cols'] = colWidths;
      XLSX.utils.book_append_sheet(wb, sheet, 'Schedule Comments');
      notifyExportStarting();
      XLSX.writeFile(wb, 'schedule-comments-report.xlsx');
      return;
    }

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
            formatDateForInput(audit.expectedStartDate),
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

    notifyExportStarting();
    XLSX.writeFile(wb, '30-60-90-report.xlsx');
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
            <h1>{activeReport.title}</h1>
            {!activeReport.ready && <p>This report is coming soon.</p>}
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

                <div className="filter-field">
                  <label>Submission Date (From)</label>
                  <input
                    type="date"
                    className="datefield"
                    value={submittedFrom}
                    onChange={(event) => setSubmittedFrom(event.target.value)}
                  />
                </div>

                <div className="filter-field">
                  <label>Submission Date (To)</label>
                  <input
                    type="date"
                    className="datefield"
                    value={submittedTo}
                    onChange={(event) => setSubmittedTo(event.target.value)}
                  />
                </div>

                <div className="filter-field">
                  <label>Approval Date (From)</label>
                  <input
                    type="date"
                    className="datefield"
                    value={approvedFrom}
                    onChange={(event) => setApprovedFrom(event.target.value)}
                  />
                </div>

                <div className="filter-field">
                  <label>Approval Date (To)</label>
                  <input
                    type="date"
                    className="datefield"
                    value={approvedTo}
                    onChange={(event) => setApprovedTo(event.target.value)}
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
          <h2>
            {`Report Preview (${rows.length})`}
          </h2>
          <DataGrid
            rows={rows}
            columns={columns}
            pageSizeOptions={[5, 10, 20]}
            initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
            getRowId={(row) => row.scheduleId ?? row.id}
            sx={{ width: '100%' }}
          />
        </div>

        <div className="reports-actions" />
      </div>
    </div>
  );
};

export default ThirtySixtyNinety;
