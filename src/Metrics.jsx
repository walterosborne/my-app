import React, { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart, MarkElement } from '@mui/x-charts/LineChart';
import {
  ChartsTooltipContainer,
  ChartsTooltipTable,
  ChartsTooltipRow,
  ChartsTooltipCell,
  ChartsTooltipPaper,
  chartsTooltipClasses,
  useAxesTooltip
} from '@mui/x-charts/ChartsTooltip';
import { ChartsLabelMark } from '@mui/x-charts/ChartsLabel';
import Typography from '@mui/material/Typography';
import { getValueToPositionMapper, useXScale, useYScale } from '@mui/x-charts/hooks';
import 'react-toastify/dist/ReactToastify.css';
import './Entry.css';
import './Metrics.css';
import { customStyles, parseCalendarDate } from './Utilities.jsx';
import {
  getAuditsAll,
  getAuditors,
  getBusinessUnits,
  getCauses,
  getCurrentUser,
  getDivisions,
  getFunctions,
  getHeaderDiagnostics,
  getNonconformances,
  getIntExt,
  getOperatingUnits,
  getPrograms,
  getSectors,
  getSeverities,
  getStandards,
  getSites
} from './assets/data/apiData';

const METRICS_STACKED_LAYOUT_QUERY = '(max-width: 1100px)';
const METRICS_PRIMARY_BAR_COLOR = '#1d4ed8';
const STAGE_LABELS = [
  'Planning',
  'Conduct Audit',
  'Nonconformities',
  'Pending Approval',
  'Approved',
  'Historical',
  'Unknown Stage'
];

const Metrics = () => {
  const exportToastOptions = {
    progressStyle: { backgroundColor: '#2196f3' },
    style: { borderLeft: '4px solid #2196f3' }
  };
  const [audits, setAudits] = useState([]);
  const [auditorsList, setAuditorsList] = useState([]);
  const [businessUnitsList, setBusinessUnitsList] = useState([]);
  const [causesList, setCausesList] = useState([]);
  const [divisionsList, setDivisionsList] = useState([]);
  const [intExtList, setIntExtList] = useState([]);
  const [operatingUnitsList, setOperatingUnitsList] = useState([]);
  const [sectorsList, setSectorsList] = useState([]);
  const [severitiesList, setSeveritiesList] = useState([]);
  const [standardsList, setStandardsList] = useState([]);
  const [sitesList, setSitesList] = useState([]);
  const [programsList, setProgramsList] = useState([]);
  const [functionsList, setFunctionsList] = useState([]);
  const [nonconformances, setNonconformances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [isStackedLayout, setIsStackedLayout] = useState(() => (
    typeof window !== 'undefined' ? window.matchMedia(METRICS_STACKED_LAYOUT_QUERY).matches : false
  ));
  const [filtersCollapsed, setFiltersCollapsed] = useState(() => (
    typeof window !== 'undefined' ? window.matchMedia(METRICS_STACKED_LAYOUT_QUERY).matches : false
  ));
  const [activeTab, setActiveTab] = useState('All');
  const [metricsViewMode, setMetricsViewMode] = useState('compact');
  const [stageCategoryBy, setStageCategoryBy] = useState('stage');
  const [colorBy, setColorBy] = useState('division');
  const [timelineGranularity, setTimelineGranularity] = useState('Monthly');
  const [severityTimelineGranularity, setSeverityTimelineGranularity] = useState('Monthly');
  const [monthlyMetrics, setMonthlyMetrics] = useState(['Audit Count']);
  const [findingsIntExtId, setFindingsIntExtId] = useState(null);
  const [findingsClauseStandardKey, setFindingsClauseStandardKey] = useState(null);
  const [dateField, setDateField] = useState('expectedStartDate');
  const [includeHistorical, setIncludeHistorical] = useState(false);
  const stageChartApiRef = React.useRef(null);
  const monthlyChartApiRef = React.useRef(null);
  const findingsChartApiRef = React.useRef(null);
  const findingsClauseChartApiRef = React.useRef(null);
  const delayChartApiRef = React.useRef(null);
  const severityChartApiRef = React.useRef(null);
  const stageChartWrapperRef = React.useRef(null);
  const monthlyChartWrapperRef = React.useRef(null);
  const findingsChartWrapperRef = React.useRef(null);
  const findingsClauseChartWrapperRef = React.useRef(null);
  const delayChartWrapperRef = React.useRef(null);
  const severityChartWrapperRef = React.useRef(null);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    auditorIds: [],
    divisionIds: [],
    intExtIds: [],
    siteIds: [],
    programIds: [],
    functionIds: []
  });

  useEffect(() => {
    async function warmAuthContext() {
      try {
        console.log('NGAT auth diagnostics effect started on Metrics.');
        try {
          const diagnosticsPayload = await getHeaderDiagnostics();
          const authCandidates = diagnosticsPayload?.diagnostics?.authCandidates ?? {};
          const fallbackSource = authCandidates.x_client_auth_user ? 'iis-auth fallback' : 'none';
          const authUser = authCandidates.auth_user ?? null;
          const likelyAuthUser =
            authCandidates.auth_user
            || authCandidates.remote_user
            || authCandidates.x_auth_user
            || authCandidates.x_client_auth_user
            || authCandidates.x_logon_user
            || authCandidates.x_remote_user
            || authCandidates.x_iis_windowsauthuserid
            || authCandidates.x_iisnode_auth_user
            || authCandidates.x_forwarded_user
            || authCandidates.x_auth_header
            || null;

          console.log('NGAT AUTH_USER header on Metrics:', authUser);
          console.log('NGAT likely auth user on Metrics:', likelyAuthUser);
          console.log('NGAT auth fallback source on Metrics:', fallbackSource);
          console.log('NGAT auth candidates on Metrics:', authCandidates);
        } catch (error) {
          console.log('NGAT AUTH_USER on Metrics: unavailable because /api/testheaders failed.');
          console.error('NGAT failed to load auth diagnostics on Metrics:', error);
        }

        try {
          await getCurrentUser();
        } catch (error) {
          console.error('Error loading current user on Metrics:', error);
        }
      } catch (error) {
        console.error('Error warming auth on Metrics:', error);
      } finally {
        setAuthReady(true);
      }
    }

    warmAuthContext();
  }, []);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    async function loadData() {
      try {
        const [
          auditsData,
          auditorsData,
          businessUnitsData,
          causesData,
          divisionsData,
          operatingUnitsData,
          sectorsData,
          sitesData,
          programsData,
          functionsData,
          standardsData,
          nonconformancesData,
          intExtData,
          severitiesData
        ] = await Promise.all([
          getAuditsAll(true),
          getAuditors(),
          getBusinessUnits(),
          getCauses(),
          getDivisions(),
          getOperatingUnits(),
          getSectors(),
          getSites(),
          getPrograms(),
          getFunctions(),
          getStandards(),
          getNonconformances(),
          getIntExt(),
          getSeverities()
        ]);
        setAudits(auditsData);
        setAuditorsList(auditorsData);
        setBusinessUnitsList(businessUnitsData);
        setCausesList(causesData);
        setDivisionsList(divisionsData);
        setIntExtList(intExtData);
        setOperatingUnitsList(operatingUnitsData);
        setSectorsList(sectorsData);
        setSeveritiesList(severitiesData);
        setSitesList(sitesData);
        setProgramsList(programsData);
        setFunctionsList(functionsData);
        setStandardsList(standardsData);
        setNonconformances(nonconformancesData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading metrics data:', error);
        setLoading(false);
      }
    }

    loadData();
  }, [authReady]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia(METRICS_STACKED_LAYOUT_QUERY);
    const handleLayoutChange = (event) => {
      const matches = event.matches;
      setIsStackedLayout(matches);
      setFiltersCollapsed(matches);
    };

    setIsStackedLayout(mediaQuery.matches);
    setFiltersCollapsed(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleLayoutChange);
      return () => mediaQuery.removeEventListener('change', handleLayoutChange);
    }

    mediaQuery.addListener(handleLayoutChange);
    return () => mediaQuery.removeListener(handleLayoutChange);
  }, []);

  const normalizeIdArray = (value) => {
    if (Array.isArray(value)) return value;
    if (value === null || value === undefined) return [];
    return [value];
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

  const colorByOptions = useMemo(() => {
    return [
      { value: 'stage', label: 'Stage' },
      { value: 'businessUnit', label: 'Business Unit' },
      { value: 'division', label: 'Division' },
      { value: 'function', label: 'Function' },
      { value: 'operatingUnit', label: 'Operating Unit' },
      { value: 'program', label: 'Program' },
      { value: 'sector', label: 'Sector' },
      { value: 'site', label: 'Site' }
    ].sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  const intExtOptions = useMemo(() => {
    return intExtList
      .map((option) => ({ value: option.intExtId, label: option.intExtName }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [intExtList]);

  const monthlyMetricOptions = useMemo(() => {
    return [
      { value: 'Audit Count', label: 'Audit Count' },
      { value: 'Nonconformities', label: 'Nonconformities' },
      { value: 'Conformities', label: 'Conformities' },
      { value: 'OFIs', label: 'OFIs' },
      { value: 'Observations', label: 'Observations' }
    ];
  }, []);

  const timelineOptions = useMemo(() => ([
    { value: 'Annual', label: 'Annual' },
    { value: 'Quarterly', label: 'Quarterly' },
    { value: 'Monthly', label: 'Monthly' },
    { value: 'This Week', label: 'This Week' }
  ]), []);

  const dateFieldOptions = useMemo(() => ([
    { value: 'expectedStartDate', label: 'Expected Start Date' },
    { value: 'expectedCompletionDate', label: 'Expected Completion Date' },
    { value: 'actualStartDate', label: 'Audit Start Date' },
    { value: 'submittedAt', label: 'Submitted Date' },
    { value: 'approvedAt', label: 'Approval Date' }
  ]), []);

  const auditorOptions = useMemo(() => {
    return auditorsList
      .map((auditor) => {
        const name = auditor.auditorName || `${auditor.lName || ''}, ${auditor.fName || ''}`.trim().replace(/^,/, '').trim();
        return { value: auditor.auditorId, label: name || `Auditor ${auditor.auditorId}` };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [auditorsList]);

  const divisionOptions = useMemo(() => {
    return divisionsList
      .map((division) => ({ value: division.divisionId, label: division.divisionName }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [divisionsList]);

  const siteOptions = useMemo(() => {
    return sitesList
      .map((site) => ({ value: site.siteId, label: getSiteLabel(site) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [sitesList]);

  const programOptions = useMemo(() => {
    return programsList
      .map((program) => ({ value: program.programId, label: program.programName }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [programsList]);

  const functionOptions = useMemo(() => {
    return functionsList
      .map((func) => ({ value: func.functionId, label: func.functionName }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [functionsList]);

  useEffect(() => {
    if (!findingsIntExtId && intExtOptions.length > 0) {
      const defaultOption = intExtOptions.find((option) => /internal/i.test(option.label)) || intExtOptions[0];
      setFindingsIntExtId(defaultOption.value);
    }
  }, [findingsIntExtId, intExtOptions]);

  const parseClauseSortPart = (value) => {
    if (value === null || value === undefined || value === '') {
      return { numeric: Number.POSITIVE_INFINITY, text: '' };
    }
    const asNumber = Number(value);
    if (Number.isFinite(asNumber)) {
      return { numeric: asNumber, text: String(value) };
    }
    return { numeric: Number.POSITIVE_INFINITY, text: String(value) };
  };

  const getCurrentWeekRange = () => {
    const now = new Date();
    const start = new Date(now);
    const day = start.getDay();
    const diff = (day + 6) % 7;
    start.setDate(start.getDate() - diff);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  const getTimelineKeyAndLabel = (dateValue, granularity) => {
    const date = parseCalendarDate(dateValue);
    if (!date || Number.isNaN(date.getTime())) return null;

    if (granularity === 'Annual') {
      return {
        key: `${date.getFullYear()}`,
        label: `${date.getFullYear()}`
      };
    }

    if (granularity === 'Quarterly') {
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return {
        key: `${date.getFullYear()}-Q${quarter}`,
        label: `Q${quarter} ${date.getFullYear()}`
      };
    }

    if (granularity === 'This Week') {
      return {
        key: date.toDateString(),
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
    }

    const month = String(date.getMonth() + 1).padStart(2, '0');
    return {
      key: `${date.getFullYear()}-${month}`,
      label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    };
  };

  const getStandardToggleOption = (typeValue) => {
    const rawType = String(typeValue ?? '').trim();
    if (!rawType) {
      return null;
    }

    const normalized = rawType.toUpperCase();
    if (normalized === 'PEQ' || normalized === 'ETQ') {
      return null;
    }

    const parsed = Number(rawType);
    if (Number.isFinite(parsed)) {
      const standard = standardsList.find((entry) => Number(entry.standardId) === parsed);
      return {
        key: `id:${parsed}`,
        label: standard?.standardName || `Standard ${parsed}`
      };
    }

    return {
      key: `raw:${rawType}`,
      label: rawType
    };
  };

  const getBarChartPeakValue = (series = []) => {
    const normalizedSeries = Array.isArray(series) ? series : [];
    if (normalizedSeries.length === 0) {
      return 0;
    }

    const maxDataLength = normalizedSeries.reduce(
      (max, entry) => Math.max(max, Array.isArray(entry?.data) ? entry.data.length : 0),
      0
    );
    const isStacked = normalizedSeries.some((entry) => entry?.stack);

    if (isStacked) {
      let stackedPeak = 0;
      for (let index = 0; index < maxDataLength; index += 1) {
        const total = normalizedSeries.reduce((sum, entry) => sum + (Number(entry?.data?.[index]) || 0), 0);
        stackedPeak = Math.max(stackedPeak, total);
      }
      return stackedPeak;
    }

    return normalizedSeries.reduce((seriesMax, entry) => {
      const entryMax = Array.isArray(entry?.data)
        ? entry.data.reduce((max, value) => Math.max(max, Number(value) || 0), 0)
        : 0;
      return Math.max(seriesMax, entryMax);
    }, 0);
  };

  const getBarAxisRoundingUnit = (maxValue) => {
    if (maxValue <= 10) return 1;
    if (maxValue <= 50) return 5;
    if (maxValue <= 100) return 10;
    if (maxValue <= 250) return 20;
    if (maxValue <= 500) return 25;
    if (maxValue <= 1000) return 50;
    if (maxValue <= 2500) return 100;
    if (maxValue <= 5000) return 250;
    return 500;
  };

  const buildTightBarYAxis = (series = []) => {
    const peakValue = getBarChartPeakValue(series);
    if (peakValue <= 0) {
      return [{ min: 0, max: 5, tickMinStep: 1, domainLimit: 'strict' }];
    }

    const roundingUnit = getBarAxisRoundingUnit(peakValue);
    const paddedMax = peakValue * 1.08;
    const roundedMax = Math.ceil(paddedMax / roundingUnit) * roundingUnit;

    return [{
      min: 0,
      max: Math.max(roundingUnit, roundedMax),
      tickMinStep: 1,
      domainLimit: 'strict'
    }];
  };

  const formatIntegerMetricValue = (value) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return '';
    }
    return `${Math.round(numericValue)}`;
  };

  const nonconformanceBySchedule = useMemo(() => {
    return nonconformances.reduce((acc, nc) => {
      const scheduleId = Number(nc.scheduleId ?? nc.scheduleid);
      if (!scheduleId) return acc;
      if (!acc[scheduleId]) {
        acc[scheduleId] = {
          Nonconformities: 0,
          Conformities: 0,
          OFIs: 0,
          Observations: 0
        };
      }
      switch (Number(nc.findingType)) {
        case 1:
          acc[scheduleId].Nonconformities += 1;
          break;
        case 2:
          acc[scheduleId].Conformities += 1;
          break;
        case 3:
          acc[scheduleId].OFIs += 1;
          break;
        case 4:
          acc[scheduleId].Observations += 1;
          break;
        default:
          break;
      }
      return acc;
    }, {});
  }, [nonconformances]);

  const getStageLabel = (audit) => {
    const approved = Boolean(audit?.approvedAt ?? audit?.approvedat);
    const locked = Number(audit?.locked) === 1;
    const stage = Number(audit?.stage);
    if (stage === -1) return 'Historical';
    if (approved) return 'Approved';
    if (locked) return 'Pending Approval';
    switch (stage) {
      case 1:
        return 'Planning';
      case 2:
        return 'Conduct Audit';
      case 3:
        return 'Nonconformities';
      case 4:
        return 'Nonconformities';
      default:
        return 'Unknown Stage';
    }
  };

  const sortDimensionLabels = (labels, dimension) => {
    const normalizedLabels = Array.from(new Set(labels.filter(Boolean)));
    if (dimension === 'stage') {
      return STAGE_LABELS.filter((label) => normalizedLabels.includes(label));
    }
    return normalizedLabels.sort((a, b) => a.localeCompare(b));
  };

  const resolveDimensionEntityLabel = (value, list, idKey, nameKey) => {
    if (!value) return null;
    const match = list.find((item) => Number(item[idKey]) === Number(value));
    return match ? match[nameKey] : `${value}`;
  };

  const resolveAuditDimensionLabels = (audit, dimension) => {
    switch (dimension) {
      case 'stage':
        return [getStageLabel(audit)];
      case 'businessUnit': {
        const ids = Array.isArray(audit.businessUnitIds) ? audit.businessUnitIds : [];
        return ids.map((id) => resolveDimensionEntityLabel(id, businessUnitsList, 'businessUnitId', 'businessUnitName')).filter(Boolean);
      }
      case 'operatingUnit': {
        const ids = Array.isArray(audit.operatingUnitIds) ? audit.operatingUnitIds : [];
        return ids.map((id) => resolveDimensionEntityLabel(id, operatingUnitsList, 'operatingUnitId', 'operatingUnitName')).filter(Boolean);
      }
      case 'division': {
        const ids = normalizeIdArray(audit.divisionId);
        return ids
          .map((id) => resolveDimensionEntityLabel(id, divisionsList, 'divisionId', 'divisionName'))
          .filter(Boolean);
      }
      case 'sector': {
        const label = resolveDimensionEntityLabel(audit.sectorId, sectorsList, 'sectorId', 'sectorName');
        return label ? [label] : [];
      }
      case 'program': {
        const ids = Array.isArray(audit.programIds) ? audit.programIds : [];
        return ids.map((id) => resolveDimensionEntityLabel(id, programsList, 'programId', 'programName')).filter(Boolean);
      }
      case 'site': {
        const ids = Array.isArray(audit.siteIds) ? audit.siteIds : [];
        return ids.map((id) => {
          const site = sitesList.find((entry) => Number(entry.siteId) === Number(id));
          return site ? getSiteLabel(site) : `${id}`;
        }).filter(Boolean);
      }
      case 'function': {
        const ids = normalizeIdArray(audit.functionId);
        return ids
          .map((id) => resolveDimensionEntityLabel(id, functionsList, 'functionId', 'functionName'))
          .filter(Boolean);
      }
      default:
        return [];
    }
  };

  const filteredAudits = useMemo(() => {
    const resolveAuditDate = (audit) => {
      switch (dateField) {
        case 'expectedCompletionDate':
          return audit.expectedCompletionDate;
        case 'actualStartDate':
          return audit.startDate;
        case 'submittedAt':
          return audit.submittedAt;
        case 'approvedAt':
          return audit.approvedAt;
        case 'expectedStartDate':
        default:
          return audit.expectedStartDate;
      }
    };

    return audits.filter((audit) => {
      const stageValue = Number(audit?.stage);
      if (!includeHistorical && stageValue === -1) {
        return false;
      }
      if (filters.auditorIds.length > 0) {
        const selectedAuditorIds = filters.auditorIds.map((id) => Number(id));
        const auditAuditorIds = [
          Number(audit.leadAuditorId),
          ...(Array.isArray(audit.additionalAuditorIds) ? audit.additionalAuditorIds.map(Number) : [])
        ];
        const matchesAuditor = selectedAuditorIds.some((id) => auditAuditorIds.includes(id));
        if (!matchesAuditor) {
          return false;
        }
      }

      if (filters.divisionIds.length > 0) {
        const auditDivisionIds = normalizeIdArray(audit.divisionId).map((id) => Number(id));
        const matchesDivision = filters.divisionIds.some((id) => auditDivisionIds.includes(Number(id)));
        if (!matchesDivision) {
          return false;
        }
      }

      if (filters.siteIds.length > 0) {
        const auditSiteIds = (Array.isArray(audit.siteIds) ? audit.siteIds : []).map(Number);
        const matchesSite = filters.siteIds.some((id) => auditSiteIds.includes(Number(id)));
        if (!matchesSite) {
          return false;
        }
      }

      if (filters.programIds.length > 0) {
        const auditProgramIds = (Array.isArray(audit.programIds) ? audit.programIds : []).map(Number);
        const matchesProgram = filters.programIds.some((id) => auditProgramIds.includes(Number(id)));
        if (!matchesProgram) {
          return false;
        }
      }

      if (filters.intExtIds.length > 0) {
        const matchesIntExt = filters.intExtIds.some((id) => Number(audit.intExtId) === Number(id));
        if (!matchesIntExt) {
          return false;
        }
      }

      if (filters.functionIds.length > 0) {
        const auditFunctionIds = normalizeIdArray(audit.functionId).map((id) => Number(id));
        const matchesFunction = filters.functionIds.some((id) => auditFunctionIds.includes(Number(id)));
        if (!matchesFunction) {
          return false;
        }
      }

      if (dateField === 'actualStartDate' && Number(audit.stage) < 3 && Number(audit.stage) !== -1) {
        return false;
      }

      if (dateField === 'submittedAt') {
        if (Number(audit.locked) !== 1 || audit.approvedAt) {
          return false;
        }
      }

      if (dateField === 'approvedAt' && !audit.approvedAt) {
        return false;
      }

      if (filters.dateFrom || filters.dateTo) {
        const dateValue = resolveAuditDate(audit);
        if (!dateValue) {
          return false;
        }
        const auditDate = parseCalendarDate(dateValue);
        if (!auditDate || Number.isNaN(auditDate.getTime())) {
          return false;
        }
        if (filters.dateFrom) {
          const fromDate = parseCalendarDate(filters.dateFrom);
          if (fromDate && auditDate < fromDate) {
            return false;
          }
        }
        if (filters.dateTo) {
          const toDate = parseCalendarDate(filters.dateTo);
          if (toDate && auditDate > toDate) {
            return false;
          }
        }
      }

      return true;
    });
  }, [audits, filters, dateField, includeHistorical]);

  const stageChartData = useMemo(() => {
    const categoryMap = new Map();
    filteredAudits.forEach((audit) => {
      const categoryLabels = resolveAuditDimensionLabels(audit, stageCategoryBy);
      const seriesLabels = resolveAuditDimensionLabels(audit, colorBy);
      const normalizedCategoryLabels = categoryLabels.length > 0 ? categoryLabels : ['Unspecified'];
      const normalizedSeriesLabels = seriesLabels.length > 0 ? seriesLabels : ['Unspecified'];

      if (stageCategoryBy === colorBy) {
        normalizedCategoryLabels.forEach((label) => {
          if (!categoryMap.has(label)) {
            categoryMap.set(label, {});
          }
          const bucket = categoryMap.get(label);
          bucket[label] = (bucket[label] || 0) + 1;
        });
        return;
      }

      normalizedCategoryLabels.forEach((categoryLabel) => {
        if (!categoryMap.has(categoryLabel)) {
          categoryMap.set(categoryLabel, {});
        }
        const bucket = categoryMap.get(categoryLabel);
        normalizedSeriesLabels.forEach((seriesLabel) => {
          bucket[seriesLabel] = (bucket[seriesLabel] || 0) + 1;
        });
      });
    });

    const labels = sortDimensionLabels(Array.from(categoryMap.keys()), stageCategoryBy);
    const colorPalette = ['#1d4ed8', '#0ea5e9', '#14b8a6', '#22c55e', '#f97316', '#a855f7', '#e11d48', '#64748b'];
    const seriesLabels = sortDimensionLabels(
      Array.from(
        new Set(labels.flatMap((label) => Object.keys(categoryMap.get(label) || {})))
      ),
      colorBy
    );

    const series = seriesLabels.map((seriesLabel, idx) => ({
      id: seriesLabel,
      label: seriesLabel,
      data: labels.map((categoryLabel) => categoryMap.get(categoryLabel)?.[seriesLabel] || 0),
      stack: 'total',
      color: colorPalette[idx % colorPalette.length],
      valueFormatter: (value) => (value ? `${value}` : null),
      barLabel: (item) => (item.value ? `${item.value}` : null),
      barLabelPlacement: 'center'
    }));

    const totals = labels.map((_, index) => (
      series.reduce((sum, entry) => sum + (Number(entry.data[index]) || 0), 0)
    ));

    return {
      labels,
      series,
      totals
    };
  }, [
    filteredAudits,
    stageCategoryBy,
    colorBy,
    businessUnitsList,
    divisionsList,
    operatingUnitsList,
    sectorsList,
    programsList,
    sitesList,
    functionsList
  ]);

  const stageCategoryOption = colorByOptions.find((option) => option.value === stageCategoryBy) || { label: 'Stage' };

  const delayChartData = useMemo(() => {
    const causeLookup = new Map(
      causesList.map((cause) => [Number(cause.causeId), cause.cause])
    );
    let onTime = 0;
    const delayCounts = {};
    let total = 0;

    filteredAudits.forEach((audit) => {
      if (!audit.expectedStartDate || !audit.startDate) return;
      const expected = parseCalendarDate(audit.expectedStartDate);
      const actual = parseCalendarDate(audit.startDate);
      if (!expected || !actual || Number.isNaN(expected.getTime()) || Number.isNaN(actual.getTime())) return;
      total += 1;
      if (actual <= expected) {
        onTime += 1;
        return;
      }
      const causeId = Number(audit.delayCause ?? audit.delaycause);
      const label = causeLookup.get(causeId) || 'No Cause Provided';
      delayCounts[label] = (delayCounts[label] || 0) + 1;
    });

    const delayLabels = Object.keys(delayCounts).sort((a, b) => a.localeCompare(b));
    const labels = ['On Time', ...delayLabels];
    const data = labels.map((label) => (label === 'On Time' ? onTime : delayCounts[label] || 0));

    return {
      labels,
      series: [
        {
          id: 'Audits',
          label: 'Audits',
          data,
          color: METRICS_PRIMARY_BAR_COLOR,
          barLabel: (item) => (item.value ? `${item.value}` : null),
          barLabelPlacement: 'center'
        }
      ],
      total
    };
  }, [filteredAudits, causesList]);

  const severityTrendData = useMemo(() => {
    const auditBySchedule = new Map(filteredAudits.map((audit) => [Number(audit.scheduleId), audit]));
    const severityOptions = [...severitiesList]
      .map((severity) => ({
        id: Number(severity.severityId),
        label: severity.severity
      }))
      .sort((a, b) => a.id - b.id);
    const specialFindingLabels = ['OFIs', 'Observations'];

    const resolveAuditDate = (audit) => {
      switch (dateField) {
        case 'expectedCompletionDate':
          return audit.expectedCompletionDate;
        case 'actualStartDate':
          return audit.startDate;
        case 'submittedAt':
          return audit.submittedAt;
        case 'approvedAt':
          return audit.approvedAt;
        case 'expectedStartDate':
        default:
          return audit.expectedStartDate;
      }
    };

    const weekRange = severityTimelineGranularity === 'This Week' ? getCurrentWeekRange() : null;

    const severityLabels = severityOptions.map((entry) => entry.label);
    const countsBySeverity = {};
    const keyLabelMap = new Map();
    const usedSeverities = new Set();

    nonconformances.forEach((nc) => {
      const findingType = Number(nc.findingType);
      if (![1, 3, 4].includes(findingType)) return;
      const scheduleId = Number(nc.scheduleId ?? nc.scheduleid);
      const audit = auditBySchedule.get(scheduleId);
      if (!audit) return;
      const dateValue = resolveAuditDate(audit);
      if (!dateValue) return;
      const keyData = getTimelineKeyAndLabel(dateValue, severityTimelineGranularity);
      if (!keyData) return;
      if (severityTimelineGranularity === 'This Week' && weekRange) {
        const date = parseCalendarDate(dateValue);
        if (!date || Number.isNaN(date.getTime()) || date < weekRange.start || date > weekRange.end) {
          return;
        }
      }
      keyLabelMap.set(keyData.key, keyData.label);
      const severityLabel = findingType === 1
        ? (severityOptions.find((entry) => entry.id === Number(nc.severity))?.label || 'Unspecified')
        : (findingType === 3 ? 'OFIs' : 'Observations');
      usedSeverities.add(severityLabel);
      if (!countsBySeverity[severityLabel]) {
        countsBySeverity[severityLabel] = {};
      }
      countsBySeverity[severityLabel][keyData.key] = (countsBySeverity[severityLabel][keyData.key] || 0) + 1;
    });

    const activeSeverityLabels = [
      ...severityLabels.filter((label) => usedSeverities.has(label)),
      ...specialFindingLabels.filter((label) => usedSeverities.has(label))
    ];
    if (usedSeverities.has('Unspecified') && !activeSeverityLabels.includes('Unspecified')) {
      activeSeverityLabels.push('Unspecified');
    }

    if (activeSeverityLabels.length === 0) {
      return { labels: [], series: [] };
    }

    let keys = Array.from(keyLabelMap.keys()).sort();
    if (severityTimelineGranularity === 'This Week' && weekRange) {
      keys = Array.from({ length: 7 }).map((_, idx) => {
        const date = new Date(weekRange.start);
        date.setDate(weekRange.start.getDate() + idx);
        return date.toDateString();
      });
    }

    const formattedLabels = keys.map((key) => keyLabelMap.get(key) || key);
    const colorPalette = ['#1d4ed8', '#0ea5e9', '#14b8a6', '#22c55e', '#f97316', '#a855f7', '#e11d48', '#64748b'];

    const series = activeSeverityLabels.map((label, idx) => ({
      id: label,
      label,
      data: keys.map((key) => countsBySeverity[label]?.[key] || 0),
      stack: 'total',
      color: colorPalette[idx % colorPalette.length]
    }));

    return {
      labels: formattedLabels,
      series
    };
  }, [filteredAudits, nonconformances, severitiesList, severityTimelineGranularity, dateField]);

  const findingsChartData = useMemo(() => {
    const functionLookup = new Map(functionsList.map((func) => [Number(func.functionId), func.functionName]));
    const severityLookup = new Map(severitiesList.map((severity) => [Number(severity.severityId), severity.severity]));

    const auditsForFindings = filteredAudits.filter((audit) => {
      if (!findingsIntExtId) return true;
      return Number(audit.intExtId) === Number(findingsIntExtId);
    });
    const auditBySchedule = new Map(auditsForFindings.map((audit) => [Number(audit.scheduleId), audit]));

    const functionLabels = Array.from(
      new Set(
        auditsForFindings.flatMap((audit) =>
          normalizeIdArray(audit.functionId).map((id) => Number(id))
        )
      )
    )
      .filter((id) => Number.isFinite(id))
      .map((id) => ({ id, label: functionLookup.get(id) || `Function ${id}` }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const functionSet = new Set(functionLabels.map((entry) => entry.id));
    const severityLabels = new Set();
    const countsByFunction = {};

    functionLabels.forEach((entry) => {
      countsByFunction[entry.label] = {
        Conformities: 0,
        Observations: 0,
        OFIs: 0
      };
    });

    nonconformances.forEach((nc) => {
      const audit = auditBySchedule.get(Number(nc.scheduleId ?? nc.scheduleid));
      if (!audit) return;
      const functionIds = normalizeIdArray(audit.functionId)
        .map((id) => Number(id))
        .filter((id) => functionSet.has(id));
      if (functionIds.length === 0) {
        return;
      }

      functionIds.forEach((functionId) => {
        const functionLabel = functionLookup.get(functionId) || `Function ${functionId}`;
        if (!countsByFunction[functionLabel]) {
          countsByFunction[functionLabel] = {
            Conformities: 0,
            Observations: 0,
            OFIs: 0
          };
        }

        const findingType = Number(nc.findingType);
        if (findingType === 1) {
          const severityName = severityLookup.get(Number(nc.severity)) || 'Unspecified';
          const label = `NC ${severityName}`;
          severityLabels.add(label);
          countsByFunction[functionLabel][label] = (countsByFunction[functionLabel][label] || 0) + 1;
        } else if (findingType === 2) {
          countsByFunction[functionLabel].Conformities += 1;
        } else if (findingType === 3) {
          countsByFunction[functionLabel].OFIs += 1;
        } else if (findingType === 4) {
          countsByFunction[functionLabel].Observations += 1;
        }
      });
    });

    const severityList = Array.from(severityLabels).sort((a, b) => a.localeCompare(b));
    const seriesLabels = ['Conformities', 'Observations', 'OFIs', ...severityList];
    const colorPalette = ['#1d4ed8', '#0ea5e9', '#14b8a6', '#22c55e', '#f97316', '#a855f7', '#e11d48', '#64748b'];

    const series = seriesLabels.map((label, idx) => ({
      id: label,
      label,
      data: functionLabels.map((entry) => countsByFunction[entry.label]?.[label] || 0),
      stack: 'total',
      color: colorPalette[idx % colorPalette.length]
    }));

    const totals = functionLabels.map((_, index) => (
      series.reduce((sum, entry) => sum + (Number(entry.data[index]) || 0), 0)
    ));

    return {
      labels: functionLabels.map((entry) => entry.label),
      series,
      totals
    };
  }, [
    filteredAudits,
    nonconformances,
    functionsList,
    findingsIntExtId,
    severitiesList
  ]);

  const findingsByClauseData = useMemo(() => {
    const auditBySchedule = new Map(filteredAudits.map((audit) => [Number(audit.scheduleId), audit]));
    const countsByStandard = new Map();
    const availableStandardsMap = new Map();

    nonconformances.forEach((nc) => {
      const standardOption = getStandardToggleOption(nc.type);
      if (!standardOption) {
        return;
      }

      const audit = auditBySchedule.get(Number(nc.scheduleId ?? nc.scheduleid));
      if (!audit) {
        return;
      }

      const section = nc.section ?? nc.Section;
      if (section === null || section === undefined || section === '') {
        return;
      }

      const subsection = nc.subsection ?? nc.Subsection;
      const clauseLabel = subsection === null || subsection === undefined || subsection === ''
        ? String(section)
        : `${section}.${subsection}`;

      if (!countsByStandard.has(standardOption.key)) {
        countsByStandard.set(standardOption.key, new Map());
      }
      const standardCounts = countsByStandard.get(standardOption.key);
      standardCounts.set(clauseLabel, (standardCounts.get(clauseLabel) || 0) + 1);

      if (!availableStandardsMap.has(standardOption.key)) {
        availableStandardsMap.set(standardOption.key, standardOption.label);
      }
    });

    const availableStandards = Array.from(availableStandardsMap.entries())
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const selectedStandard = availableStandards.find((option) => option.key === findingsClauseStandardKey)
      || availableStandards[0]
      || null;

    const selectedCounts = selectedStandard ? countsByStandard.get(selectedStandard.key) : null;
    const rows = Array.from(selectedCounts?.entries() || [])
      .map(([label, count]) => {
        const [sectionPart, subsectionPart = ''] = String(label).split('.');
        return {
          label,
          count,
          sectionSort: parseClauseSortPart(sectionPart),
          subsectionSort: parseClauseSortPart(subsectionPart)
        };
      })
      .sort((a, b) => {
        if (a.sectionSort.numeric !== b.sectionSort.numeric) {
          return a.sectionSort.numeric - b.sectionSort.numeric;
        }
        if (a.sectionSort.text !== b.sectionSort.text) {
          return a.sectionSort.text.localeCompare(b.sectionSort.text);
        }
        if (a.subsectionSort.numeric !== b.subsectionSort.numeric) {
          return a.subsectionSort.numeric - b.subsectionSort.numeric;
        }
        return a.subsectionSort.text.localeCompare(b.subsectionSort.text);
      });

    return {
      labels: rows.map((row) => row.label),
      series: [
        {
          id: 'Findings',
          label: 'Findings',
          data: rows.map((row) => row.count),
          color: METRICS_PRIMARY_BAR_COLOR,
          barLabel: (item) => (item.value ? `${item.value}` : null),
          barLabelPlacement: 'center'
        }
      ],
      availableStandards,
      selectedStandardKey: selectedStandard?.key ?? null,
      selectedStandardLabel: selectedStandard?.label ?? '',
      total: rows.reduce((sum, row) => sum + row.count, 0)
    };
  }, [filteredAudits, nonconformances, standardsList, findingsClauseStandardKey]);

  useEffect(() => {
    const availableStandards = findingsByClauseData.availableStandards;
    if (availableStandards.length === 0) {
      if (findingsClauseStandardKey !== null) {
        setFindingsClauseStandardKey(null);
      }
      return;
    }

    const hasCurrent = availableStandards.some((option) => option.key === findingsClauseStandardKey);
    if (!hasCurrent) {
      setFindingsClauseStandardKey(availableStandards[0].key);
    }
  }, [findingsByClauseData.availableStandards, findingsClauseStandardKey]);

  const monthlyChartData = useMemo(() => {
    const resolveAuditDate = (audit) => {
      switch (dateField) {
        case 'expectedCompletionDate':
          return audit.expectedCompletionDate;
        case 'actualStartDate':
          return audit.startDate;
        case 'submittedAt':
          return audit.submittedAt;
        case 'approvedAt':
          return audit.approvedAt;
        case 'expectedStartDate':
        default:
          return audit.expectedStartDate;
      }
    };

    const auditsWithDates = filteredAudits.filter((audit) => resolveAuditDate(audit));

    const weekRange = timelineGranularity === 'This Week' ? getCurrentWeekRange() : null;

    const filteredByGranularity = timelineGranularity === 'This Week'
      ? auditsWithDates.filter((audit) => {
        const dateValue = resolveAuditDate(audit);
        if (!dateValue) return false;
        const date = parseCalendarDate(dateValue);
        if (!date || Number.isNaN(date.getTime())) return false;
        return weekRange && date >= weekRange.start && date <= weekRange.end;
      })
      : auditsWithDates;

    const monthMap = new Map();
    filteredByGranularity.forEach((audit) => {
      const dateValue = resolveAuditDate(audit);
      const keyData = dateValue ? getTimelineKeyAndLabel(dateValue, timelineGranularity) : null;
      if (!keyData) return;
      if (!monthMap.has(keyData.key)) {
        monthMap.set(keyData.key, { label: keyData.label, audits: [] });
      }
      monthMap.get(keyData.key).audits.push(audit);
    });

    let keys = Array.from(monthMap.keys()).sort();
    if (timelineGranularity === 'This Week' && weekRange) {
      keys = Array.from({ length: 7 }).map((_, idx) => {
        const date = new Date(weekRange.start);
        date.setDate(weekRange.start.getDate() + idx);
        return date.toDateString();
      });
    }

    const countsByMetric = {};
    monthlyMetrics.forEach((metric) => {
      countsByMetric[metric] = {};
      keys.forEach((key) => {
        countsByMetric[metric][key] = 0;
      });
    });

    filteredByGranularity.forEach((audit) => {
      const dateValue = resolveAuditDate(audit);
      const keyData = dateValue ? getTimelineKeyAndLabel(dateValue, timelineGranularity) : null;
      if (!keyData) return;
      const key = keyData.key;
      if (monthlyMetrics.includes('Audit Count')) {
        countsByMetric['Audit Count'][key] = (countsByMetric['Audit Count'][key] || 0) + 1;
      }
      const scheduleCounts = nonconformanceBySchedule[Number(audit.scheduleId)] || null;
      if (scheduleCounts) {
        monthlyMetrics.forEach((metric) => {
          if (metric === 'Audit Count') return;
          countsByMetric[metric][key] = (countsByMetric[metric][key] || 0) + (scheduleCounts[metric] || 0);
        });
      }
    });

    const colorPalette = ['#1d4ed8', '#0ea5e9', '#14b8a6', '#22c55e', '#f97316', '#a855f7', '#e11d48', '#64748b'];
    const series = monthlyMetrics.map((metric, idx) => ({
      id: metric,
      label: metric,
      data: keys.map((key) => countsByMetric[metric]?.[key] || 0),
      color: colorPalette[idx % colorPalette.length],
      curve: 'linear',
      showMark: true,
      valueFormatter: (value) => (Number(value) > 0 ? formatIntegerMetricValue(value) : null)
    }));

    const formattedMonths = keys.map((key) => {
      const entry = monthMap.get(key);
      if (entry?.label) {
        return entry.label;
      }
      return key;
    });

    return { labels: formattedMonths, series };
  }, [filteredAudits, monthlyMetrics, nonconformanceBySchedule, timelineGranularity, dateField]);

  const sanitizeWorksheetName = (value = 'Metrics') => {
    const cleaned = String(value || 'Metrics')
      .replace(/[\\/*?:[\]]/g, ' ')
      .trim();
    return (cleaned || 'Metrics').slice(0, 31);
  };

  const buildMetricExportRows = ({ labels = [], series = [], labelKey = 'Label', totals = null }) => {
    return labels.map((label, index) => {
      const row = { [labelKey]: label };

      series.forEach((entry, seriesIndex) => {
        const columnName = entry?.label || entry?.id || `Series ${seriesIndex + 1}`;
        row[columnName] = Number(entry?.data?.[index]) || 0;
      });

      if (Array.isArray(totals)) {
        row.Total = Number(totals[index]) || 0;
      }

      return row;
    });
  };

  const handleExport = ({ filenameBase, sheetName, labelKey, labels, series, totals = null }) => {
    const rows = buildMetricExportRows({ labels, series, labelKey, totals });

    if (rows.length === 0) {
      toast.info('No metric data is currently displayed to export.', exportToastOptions);
      return;
    }

    const toastId = toast.info('Now exporting metric data...', {
      ...exportToastOptions,
      autoClose: false,
      closeButton: false
    });

    try {
      const workbook = XLSX.utils.book_new();
      const sheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, sheet, sanitizeWorksheetName(sheetName));
      XLSX.writeFile(workbook, `${filenameBase}.xlsx`);

      toast.update(toastId, {
        render: 'Metric data exported.',
        type: 'success',
        autoClose: 2000,
        closeButton: true
      });
    } catch (error) {
      console.error('Metric export failed:', error);
      toast.update(toastId, {
        render: 'Metric export failed.',
        type: 'error',
        autoClose: 4000,
        closeButton: true
      });
    }
  };

  const MetricsTooltip = (props) => {
    const tooltipData = useAxesTooltip();
    if (!tooltipData) return null;
    const filteredAxes = tooltipData.map((axis) => {
      const nonZeroItems = axis.seriesItems.filter((item) => Number(item.value) > 0);
      if (nonZeroItems.length === 0) {
        return null;
      }
      const total = nonZeroItems.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
      return { ...axis, nonZeroItems, total };
    }).filter(Boolean);

    if (filteredAxes.length === 0) {
      return null;
    }

    return (
      <ChartsTooltipContainer {...props}>
        <ChartsTooltipPaper className={chartsTooltipClasses.paper}>
          {filteredAxes.map((axis) => (
            <ChartsTooltipTable key={axis.axisId} className={chartsTooltipClasses.table}>
              {axis.axisFormattedValue != null && (
                <caption>
                  <Typography component="span">{axis.axisFormattedValue}</Typography>
                </caption>
              )}
              <tbody>
                {axis.nonZeroItems.map((item) => (
                  <ChartsTooltipRow key={item.seriesId} className={chartsTooltipClasses.row}>
                    <ChartsTooltipCell
                      className={`${chartsTooltipClasses.labelCell} ${chartsTooltipClasses.cell}`}
                      component="th"
                    >
                      <span className={chartsTooltipClasses.markContainer}>
                        <ChartsLabelMark type={item.markType} color={item.color} className={chartsTooltipClasses.mark} />
                      </span>
                      {item.formattedLabel || item.seriesId}
                    </ChartsTooltipCell>
                    <ChartsTooltipCell
                      className={`${chartsTooltipClasses.valueCell} ${chartsTooltipClasses.cell}`}
                      component="td"
                    >
                      {item.formattedValue}
                    </ChartsTooltipCell>
                  </ChartsTooltipRow>
                ))}
                <ChartsTooltipRow className={`metrics-tooltip-total ${chartsTooltipClasses.row}`}>
                  <ChartsTooltipCell
                    className={`${chartsTooltipClasses.labelCell} ${chartsTooltipClasses.cell}`}
                    component="th"
                  >
                    Total
                  </ChartsTooltipCell>
                  <ChartsTooltipCell
                    className={`${chartsTooltipClasses.valueCell} ${chartsTooltipClasses.cell}`}
                    component="td"
                  >
                    {axis.total}
                  </ChartsTooltipCell>
                </ChartsTooltipRow>
              </tbody>
            </ChartsTooltipTable>
          ))}
        </ChartsTooltipPaper>
      </ChartsTooltipContainer>
    );
  };

  const StageTotalsOverlay = ({ labels, totals }) => {
    const xScale = useXScale();
    const yScale = useYScale();
    const xMapper = getValueToPositionMapper(xScale);
    const yMapper = getValueToPositionMapper(yScale);

    return (
      <g>
        {labels.map((label, index) => {
          const total = totals[index];
          if (!total) return null;
          const x = xMapper(label);
          const y = yMapper(total);
          if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
          return (
            <text
              key={`${label}-total`}
              x={x}
              y={y - 12}
              textAnchor="middle"
              fontSize="13"
              fontWeight="700"
              fill="#1f2937"
              pointerEvents="none"
            >
              {total}
            </text>
          );
        })}
      </g>
    );
  };

  const LabeledMark = (props) => {
    const value = monthlyChartData.series.find((series) => series.id === props.id)?.data?.[props.dataIndex];
    return (
      <g>
        <MarkElement {...props} />
        {value ? (
          <text
            x={props.x}
            y={props.y - 10}
            textAnchor="middle"
            fontSize="10"
            fill="#1f2937"
          >
            {formatIntegerMetricValue(value)}
          </text>
        ) : null}
      </g>
    );
  };

  const showStageMetric = activeTab === 'All' || activeTab === 'PCAB';
  const showDelayMetric = activeTab === 'All' || activeTab === 'Other';
  const showMonthlyMetric = activeTab === 'All' || activeTab === 'Finding Analysis';
  const showSeverityMetric = activeTab === 'All' || activeTab === 'Finding Analysis';
  const showFindingsMetric = activeTab === 'All' || activeTab === 'Finding Analysis';
  const showFindingsByClauseMetric = activeTab === 'All' || activeTab === 'Finding Analysis';
  const hasSeverityData = severityTrendData.series.length > 0 && severityTrendData.labels.length > 0;
  const hasFindingsByClauseData = findingsByClauseData.labels.length > 0;

  const handleMultiFilterChange = (key) => (selectedOptions) => {
    setFilters((prev) => ({
      ...prev,
      [key]: selectedOptions ? selectedOptions.map((option) => option.value) : []
    }));
  };

  if (loading) {
    return (
      <div className="entry-page">
        <div className="entry-container">
          <div className="entry-message">Loading metrics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="entry-page">
      <div className="entry-container">
        <div className="metrics-header tool-page-header">
          <p className="tool-page-subtitle">Tools · Metrics</p>
          <h2 className="tool-page-title">Metrics</h2>
        </div>
        <div className="metrics-layout">
          <div className="metrics-filters">
            {isStackedLayout && (
              <div className="metrics-filters-header">
                <div className="metrics-filters-title-group">
                  <span className="metrics-filters-eyebrow">Filters</span>
                  <h3 className="metrics-filters-title">Metrics Filters</h3>
                </div>
                <button
                  type="button"
                  className="metrics-filters-toggle-button"
                  onClick={() => setFiltersCollapsed((prev) => !prev)}
                  aria-expanded={!filtersCollapsed}
                >
                  {filtersCollapsed ? 'Show Filters' : 'Hide Filters'}
                </button>
              </div>
            )}
            {(!isStackedLayout || !filtersCollapsed) && (
              <>
                <div className="metrics-filter">
                  <label>Date Field</label>
                  <Select
                    isClearable={false}
                    options={dateFieldOptions}
                    styles={customStyles}
                    placeholder="Select Date Field"
                    value={dateFieldOptions.find((option) => option.value === dateField) || null}
                    onChange={(option) => setDateField(option?.value || 'expectedStartDate')}
                  />
                  <p className="metrics-filter-note">
                    Selecting later-stage dates will filter out audits that have not reached that stage
                    (Approval Date requires approved audits, Submitted Date requires submitted audits, and Audit Start Date
                    requires results completion).
                    Historical audits are excluded unless you enable the toggle below.
                  </p>
                </div>
                <div className="metrics-filter">
                  <label>Date Range</label>
                  <div className="metrics-date-range">
                    <div className="metrics-date-field">
                      <span className="metrics-date-label">From</span>
                      <input
                        type="date"
                        className="metrics-date"
                        value={filters.dateFrom}
                        onChange={(event) => setFilters((prev) => ({ ...prev, dateFrom: event.target.value }))}
                      />
                    </div>
                    <div className="metrics-date-field">
                      <span className="metrics-date-label">To</span>
                      <input
                        type="date"
                        className="metrics-date"
                        value={filters.dateTo}
                        onChange={(event) => setFilters((prev) => ({ ...prev, dateTo: event.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                <div className="metrics-filter metrics-toggle">
                  <label>Historical Audits</label>
                  <div className="metrics-toggle-row">
                    <input
                      type="checkbox"
                      checked={includeHistorical}
                      onChange={(event) => setIncludeHistorical(event.target.checked)}
                    />
                    <span>Include historical audits</span>
                  </div>
                </div>
                <div className="metrics-filter">
                  <label>Auditors</label>
                  <Select
                    isMulti
                    closeMenuOnSelect={false}
                    options={auditorOptions}
                    styles={customStyles}
                    placeholder="Select Auditors"
                    value={auditorOptions.filter((option) => filters.auditorIds.includes(option.value))}
                    onChange={handleMultiFilterChange('auditorIds')}
                  />
                </div>
                <div className="metrics-filter">
                  <label>Division</label>
                  <Select
                    isMulti
                    options={divisionOptions}
                    styles={customStyles}
                    placeholder="Select Division"
                    value={divisionOptions.filter((option) => filters.divisionIds.includes(option.value))}
                    onChange={(selected) => setFilters((prev) => ({
                      ...prev,
                      divisionIds: selected ? selected.map((option) => option.value) : []
                    }))}
                  />
                </div>
                <div className="metrics-filter">
                  <label>Function</label>
                  <Select
                    isMulti
                    options={functionOptions}
                    styles={customStyles}
                    placeholder="Select Function"
                    value={functionOptions.filter((option) => filters.functionIds.includes(option.value))}
                    onChange={(selected) => setFilters((prev) => ({
                      ...prev,
                      functionIds: selected ? selected.map((option) => option.value) : []
                    }))}
                  />
                </div>
                <div className="metrics-filter">
                  <label>Internal / External</label>
                  <Select
                    isMulti
                    closeMenuOnSelect={false}
                    options={intExtOptions}
                    styles={customStyles}
                    placeholder="Select Audit Types"
                    value={intExtOptions.filter((option) => filters.intExtIds.includes(option.value))}
                    onChange={handleMultiFilterChange('intExtIds')}
                  />
                </div>
                <div className="metrics-filter">
                  <label>Program</label>
                  <Select
                    isMulti
                    closeMenuOnSelect={false}
                    options={programOptions}
                    styles={customStyles}
                    placeholder="Select Programs"
                    value={programOptions.filter((option) => filters.programIds.includes(option.value))}
                    onChange={handleMultiFilterChange('programIds')}
                  />
                </div>
                <div className="metrics-filter">
                  <label>Sites</label>
                  <Select
                    isMulti
                    closeMenuOnSelect={false}
                    options={siteOptions}
                    styles={customStyles}
                    placeholder="Select Sites"
                    value={siteOptions.filter((option) => filters.siteIds.includes(option.value))}
                    onChange={handleMultiFilterChange('siteIds')}
                  />
                </div>
              </>
            )}
          </div>
          <div className="metrics-panel">
            <div className="metrics-tabs">
              <div className="metrics-tabs-group">
                {['All', 'Finding Analysis', 'PCAB', 'Other'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`metrics-tab ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={`metrics-view-chip ${metricsViewMode === 'expanded' ? 'is-expanded' : ''}`}
                onClick={() => setMetricsViewMode((prev) => prev === 'compact' ? 'expanded' : 'compact')}
                aria-pressed={metricsViewMode === 'expanded'}
              >
                {metricsViewMode === 'expanded' ? 'Expanded View' : 'Compact View'}
              </button>
            </div>
            <div className="metrics-panel-body">
              <div className={`metrics-grid ${metricsViewMode === 'expanded' ? 'metrics-grid--expanded' : ''}`}>
                {showStageMetric && (
                  <div className="metrics-card">
                    <div className="metrics-card-header">
                      <div className="metrics-card-title">
                        <span>{`Audits by ${stageCategoryOption.label}`}</span>
                      </div>
                      <button
                        type="button"
                        className="metrics-export-button"
                        onClick={() => handleExport({
                          filenameBase: 'audits-by-stage',
                          sheetName: `Audits by ${stageCategoryOption.label}`,
                          labelKey: stageCategoryOption.label,
                          labels: stageChartData.labels,
                          series: stageChartData.series,
                          totals: stageChartData.totals
                        })}
                      >
                        Export
                      </button>
                    </div>
                    <div className="metrics-card-body" ref={stageChartWrapperRef}>
                      <BarChart
                        apiRef={stageChartApiRef}
                        xAxis={[{ scaleType: 'band', data: stageChartData.labels }]}
                        yAxis={buildTightBarYAxis(stageChartData.series)}
                        series={stageChartData.series}
                        slots={{ tooltip: MetricsTooltip }}
                        slotProps={{
                          barLabel: { style: { fontSize: 10, fontWeight: 500 } },
                          tooltip: { trigger: 'axis' }
                        }}
                        height={260}
                        margin={{ top: 20, bottom: 30, left: 40, right: 10 }}
                      >
                        <StageTotalsOverlay labels={stageChartData.labels} totals={stageChartData.totals} />
                      </BarChart>
                    </div>
                    <div className="metrics-card-footer metrics-card-footer--paired">
                      <div className="metrics-control-group">
                        <label>Categories</label>
                        <Select
                          isClearable={false}
                          options={colorByOptions}
                          styles={customStyles}
                          placeholder="Select"
                          value={colorByOptions.find((option) => option.value === stageCategoryBy) || null}
                          onChange={(option) => setStageCategoryBy(option?.value || 'stage')}
                        />
                      </div>
                      <div className="metrics-control-group">
                        <label>Color by</label>
                        <Select
                          isClearable={false}
                          options={colorByOptions}
                          styles={customStyles}
                          placeholder="Select"
                          value={colorByOptions.find((option) => option.value === colorBy) || null}
                          onChange={(option) => setColorBy(option?.value || 'division')}
                        />
                      </div>
                    </div>
                  </div>
                )}
                {showDelayMetric && (
                  <div className="metrics-card">
                    <div className="metrics-card-header">
                      <div className="metrics-card-title">
                        <span>Delay Causes</span>
                        <span className="metrics-card-total">
                          {delayChartData.total > 0
                            ? `${delayChartData.total} audits with dates`
                            : 'No audits with dates'}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="metrics-export-button"
                        onClick={() => handleExport({
                          filenameBase: 'delay-causes',
                          sheetName: 'Delay Causes',
                          labelKey: 'Delay Cause',
                          labels: delayChartData.labels,
                          series: delayChartData.series
                        })}
                      >
                        Export
                      </button>
                    </div>
                    <div className="metrics-card-body" ref={delayChartWrapperRef}>
                      <BarChart
                        apiRef={delayChartApiRef}
                        xAxis={[{ scaleType: 'band', data: delayChartData.labels }]}
                        yAxis={buildTightBarYAxis(delayChartData.series)}
                        series={delayChartData.series}
                        slots={{ tooltip: MetricsTooltip }}
                        slotProps={{
                          barLabel: { style: { fontSize: 10, fontWeight: 500 } },
                          tooltip: { trigger: 'axis' }
                        }}
                        height={260}
                        margin={{ top: 20, bottom: 30, left: 40, right: 10 }}
                      />
                    </div>
                  </div>
                )}
                {showMonthlyMetric && (
                  <div className="metrics-card">
                    <div className="metrics-card-header">
                      <span>Audits Over Time</span>
                      <button
                        type="button"
                        className="metrics-export-button"
                        onClick={() => handleExport({
                          filenameBase: 'audits-over-time',
                          sheetName: 'Audits Over Time',
                          labelKey: 'Period',
                          labels: monthlyChartData.labels,
                          series: monthlyChartData.series
                        })}
                      >
                        Export
                      </button>
                    </div>
                    <div className="metrics-card-body" ref={monthlyChartWrapperRef}>
                      <LineChart
                        apiRef={monthlyChartApiRef}
                        xAxis={[{ scaleType: 'point', data: monthlyChartData.labels }]}
                        yAxis={[{
                          tickMinStep: 1,
                          valueFormatter: (value) => formatIntegerMetricValue(value)
                        }]}
                        series={monthlyChartData.series}
                        slots={{ tooltip: MetricsTooltip, mark: LabeledMark }}
                        slotProps={{ tooltip: { trigger: 'axis' } }}
                        height={260}
                        margin={{ top: 20, bottom: 30, left: 40, right: 10 }}
                      />
                    </div>
                    <div className="metrics-card-footer metrics-card-footer--paired">
                      <div className="metrics-control-group">
                        <label>Timeline</label>
                        <Select
                          isClearable={false}
                          options={timelineOptions}
                          styles={customStyles}
                          placeholder="Select"
                          value={{ value: timelineGranularity, label: timelineGranularity }}
                          onChange={(option) => setTimelineGranularity(option?.value || 'Monthly')}
                        />
                      </div>
                      <div className="metrics-control-group">
                        <label>Metrics</label>
                        <Select
                          isMulti
                          closeMenuOnSelect={false}
                          options={monthlyMetricOptions}
                          styles={customStyles}
                          placeholder="Select metrics"
                          value={monthlyMetricOptions.filter((option) => monthlyMetrics.includes(option.value))}
                          onChange={(options) => {
                            const values = Array.isArray(options) ? options.map((opt) => opt.value) : [];
                            setMonthlyMetrics(values.length > 0 ? values : ['Audit Count']);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                {showSeverityMetric && (
                  <div className="metrics-card">
                    <div className="metrics-card-header">
                      <div className="metrics-card-title">
                        <span>Finding Severities</span>
                      </div>
                      <button
                        type="button"
                        className="metrics-export-button"
                        onClick={() => handleExport({
                          filenameBase: 'finding-severities',
                          sheetName: 'Finding Severities',
                          labelKey: 'Period',
                          labels: severityTrendData.labels,
                          series: severityTrendData.series
                        })}
                      >
                        Export
                      </button>
                    </div>
                    <div className="metrics-card-body" ref={severityChartWrapperRef}>
                      {hasSeverityData ? (
                        <BarChart
                          apiRef={severityChartApiRef}
                          xAxis={[{ scaleType: 'band', data: severityTrendData.labels }]}
                          yAxis={buildTightBarYAxis(severityTrendData.series)}
                          series={severityTrendData.series}
                          slots={{ tooltip: MetricsTooltip }}
                          slotProps={{ tooltip: { trigger: 'axis' } }}
                          height={260}
                          margin={{ top: 20, bottom: 30, left: 40, right: 10 }}
                        />
                      ) : (
                        <div className="metrics-empty">No findings found for the selected filters.</div>
                      )}
                    </div>
                    <div className="metrics-card-footer">
                      <label>Timeline</label>
                      <Select
                        isClearable={false}
                        options={timelineOptions}
                        styles={customStyles}
                        placeholder="Select"
                        value={{ value: severityTimelineGranularity, label: severityTimelineGranularity }}
                        onChange={(option) => setSeverityTimelineGranularity(option?.value || 'Monthly')}
                      />
                    </div>
                  </div>
                )}
                {showFindingsMetric && (
                  <div className="metrics-card">
                    <div className="metrics-card-header">
                      <div className="metrics-card-title">
                        <span>Findings by Function</span>
                      </div>
                      <button
                        type="button"
                        className="metrics-export-button"
                        onClick={() => handleExport({
                          filenameBase: 'findings-by-function',
                          sheetName: 'Findings by Function',
                          labelKey: 'Function',
                          labels: findingsChartData.labels,
                          series: findingsChartData.series,
                          totals: findingsChartData.totals
                        })}
                      >
                        Export
                      </button>
                    </div>
                    <div className="metrics-card-body" ref={findingsChartWrapperRef}>
                      <BarChart
                        apiRef={findingsChartApiRef}
                        xAxis={[{ scaleType: 'band', data: findingsChartData.labels }]}
                        yAxis={buildTightBarYAxis(findingsChartData.series)}
                        series={findingsChartData.series}
                        slots={{ tooltip: MetricsTooltip }}
                        slotProps={{ tooltip: { trigger: 'axis' } }}
                        height={260}
                        margin={{ top: 20, bottom: 30, left: 40, right: 10 }}
                      >
                        <StageTotalsOverlay labels={findingsChartData.labels} totals={findingsChartData.totals} />
                      </BarChart>
                    </div>
                    <div className="metrics-card-footer">
                    <label>Audit Type</label>
                    <Select
                      isClearable={false}
                      options={intExtOptions}
                      styles={customStyles}
                      placeholder="Select"
                      value={intExtOptions.find((option) => option.value === findingsIntExtId) || null}
                      onChange={(option) => setFindingsIntExtId(option?.value || null)}
                    />
                  </div>
                </div>
                )}
                {showFindingsByClauseMetric && (
                  <div className="metrics-card">
                    <div className="metrics-card-header">
                      <div className="metrics-card-title">
                        <span>Findings by Clause</span>
                        <span className="metrics-card-total">
                          {findingsByClauseData.selectedStandardLabel
                            ? `${findingsByClauseData.selectedStandardLabel} · ${findingsByClauseData.total} findings`
                            : 'No standard findings for the selected filters'}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="metrics-export-button"
                        onClick={() => handleExport({
                          filenameBase: 'findings-by-clause',
                          sheetName: findingsByClauseData.selectedStandardLabel
                            ? `Clause ${findingsByClauseData.selectedStandardLabel}`
                            : 'Findings by Clause',
                          labelKey: 'Clause',
                          labels: findingsByClauseData.labels,
                          series: findingsByClauseData.series
                        })}
                      >
                        Export
                      </button>
                    </div>
                    <div className="metrics-card-body" ref={findingsClauseChartWrapperRef}>
                      {hasFindingsByClauseData ? (
                        <BarChart
                          apiRef={findingsClauseChartApiRef}
                          xAxis={[{ scaleType: 'band', data: findingsByClauseData.labels }]}
                          yAxis={buildTightBarYAxis(findingsByClauseData.series)}
                          series={findingsByClauseData.series}
                          slots={{ tooltip: MetricsTooltip }}
                          slotProps={{ tooltip: { trigger: 'axis' } }}
                          height={260}
                          margin={{ top: 20, bottom: 30, left: 40, right: 10 }}
                        />
                      ) : (
                        <div className="metrics-empty">No standard-based findings found for the selected filters.</div>
                      )}
                    </div>
                    <div className="metrics-card-footer">
                      <label>Standard</label>
                      <Select
                        isClearable={false}
                        options={findingsByClauseData.availableStandards.map((option) => ({
                          value: option.key,
                          label: option.label
                        }))}
                        styles={customStyles}
                        placeholder="Select Standard"
                        value={findingsByClauseData.availableStandards
                          .map((option) => ({ value: option.key, label: option.label }))
                          .find((option) => option.value === findingsClauseStandardKey) || null}
                        onChange={(option) => setFindingsClauseStandardKey(option?.value || null)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Metrics;
