import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Select from 'react-select';
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
import { toPng } from 'html-to-image';
import './Entry.css';
import './Metrics.css';
import { customStyles, parseCalendarDate } from './Utilities.jsx';
import {
  getAuditsAll,
  getAuditors,
  getBusinessUnits,
  getCauses,
  getDivisions,
  getFunctions,
  getNonconformances,
  getIntExt,
  getOperatingUnits,
  getPrograms,
  getSectors,
  getSeverities,
  getSites
} from './assets/data/apiData';

const Metrics = () => {
  const [audits, setAudits] = useState([]);
  const [auditorsList, setAuditorsList] = useState([]);
  const [businessUnitsList, setBusinessUnitsList] = useState([]);
  const [causesList, setCausesList] = useState([]);
  const [divisionsList, setDivisionsList] = useState([]);
  const [intExtList, setIntExtList] = useState([]);
  const [operatingUnitsList, setOperatingUnitsList] = useState([]);
  const [sectorsList, setSectorsList] = useState([]);
  const [severitiesList, setSeveritiesList] = useState([]);
  const [sitesList, setSitesList] = useState([]);
  const [programsList, setProgramsList] = useState([]);
  const [functionsList, setFunctionsList] = useState([]);
  const [nonconformances, setNonconformances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [colorBy, setColorBy] = useState('division');
  const [timelineGranularity, setTimelineGranularity] = useState('Monthly');
  const [severityTimelineGranularity, setSeverityTimelineGranularity] = useState('Monthly');
  const [monthlyMetrics, setMonthlyMetrics] = useState(['Audit Count']);
  const [findingsIntExtId, setFindingsIntExtId] = useState(null);
  const [dateField, setDateField] = useState('expectedStartDate');
  const [includeHistorical, setIncludeHistorical] = useState(false);
  const stageChartApiRef = React.useRef(null);
  const monthlyChartApiRef = React.useRef(null);
  const findingsChartApiRef = React.useRef(null);
  const delayChartApiRef = React.useRef(null);
  const severityChartApiRef = React.useRef(null);
  const stageChartWrapperRef = React.useRef(null);
  const monthlyChartWrapperRef = React.useRef(null);
  const findingsChartWrapperRef = React.useRef(null);
  const delayChartWrapperRef = React.useRef(null);
  const severityChartWrapperRef = React.useRef(null);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    auditorId: null,
    divisionIds: [],
    siteId: null,
    programId: null,
    functionIds: []
  });

  useEffect(() => {
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
        setNonconformances(nonconformancesData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading metrics data:', error);
        setLoading(false);
      }
    }
    loadData();
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
      setFindingsIntExtId(intExtOptions[0].value);
    }
  }, [findingsIntExtId, intExtOptions]);

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
        return 'Nonconformaties';
      case 4:
        return 'Nonconformaties';
      default:
        return 'Unknown Stage';
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
      if (filters.auditorId) {
        const auditorId = Number(filters.auditorId);
        const additional = Array.isArray(audit.additionalAuditorIds) ? audit.additionalAuditorIds : [];
        if (Number(audit.leadAuditorId) !== auditorId && !additional.map(Number).includes(auditorId)) {
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

      if (filters.siteId) {
        const sites = Array.isArray(audit.siteIds) ? audit.siteIds : [];
        if (!sites.map(Number).includes(Number(filters.siteId))) {
          return false;
        }
      }

      if (filters.programId) {
        const programs = Array.isArray(audit.programIds) ? audit.programIds : [];
        if (!programs.map(Number).includes(Number(filters.programId))) {
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
    const stageLabels = [
      'Planning',
      'Conduct Audit',
      'Nonconformaties',
      'Pending Approval',
      'Approved',
      'Historical',
      'Unknown Stage'
    ];

    const resolveLabel = (value, list, idKey, nameKey) => {
      if (!value) return null;
      const match = list.find((item) => Number(item[idKey]) === Number(value));
      return match ? match[nameKey] : `${value}`;
    };

    const resolveGroupLabels = (audit) => {
      switch (colorBy) {
        case 'businessUnit': {
          const ids = Array.isArray(audit.businessUnitIds) ? audit.businessUnitIds : [];
          return ids.map((id) => resolveLabel(id, businessUnitsList, 'businessUnitId', 'businessUnitName')).filter(Boolean);
        }
        case 'operatingUnit': {
          const ids = Array.isArray(audit.operatingUnitIds) ? audit.operatingUnitIds : [];
          return ids.map((id) => resolveLabel(id, operatingUnitsList, 'operatingUnitId', 'operatingUnitName')).filter(Boolean);
        }
        case 'division': {
          const ids = normalizeIdArray(audit.divisionId);
          return ids
            .map((id) => resolveLabel(id, divisionsList, 'divisionId', 'divisionName'))
            .filter(Boolean);
        }
        case 'sector': {
          const label = resolveLabel(audit.sectorId, sectorsList, 'sectorId', 'sectorName');
          return label ? [label] : [];
        }
        case 'program': {
          const ids = Array.isArray(audit.programIds) ? audit.programIds : [];
          return ids.map((id) => resolveLabel(id, programsList, 'programId', 'programName')).filter(Boolean);
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
            .map((id) => resolveLabel(id, functionsList, 'functionId', 'functionName'))
            .filter(Boolean);
        }
        default:
          return [];
      }
    };

    const groupMap = new Map();
    filteredAudits.forEach((audit) => {
      const stage = getStageLabel(audit);
      const groups = resolveGroupLabels(audit);
      const groupLabels = groups.length > 0 ? groups : ['Unspecified'];
      groupLabels.forEach((label) => {
        if (!groupMap.has(label)) {
          groupMap.set(label, stageLabels.reduce((acc, stageLabel) => {
            acc[stageLabel] = 0;
            return acc;
          }, {}));
        }
        const stageCounts = groupMap.get(label);
        stageCounts[stage] = (stageCounts[stage] || 0) + 1;
      });
    });

    const labels = stageLabels.filter((label) => {
      return Array.from(groupMap.values()).some((counts) => counts[label] > 0);
    });

    const colorPalette = ['#1d4ed8', '#0ea5e9', '#14b8a6', '#22c55e', '#f97316', '#a855f7', '#e11d48', '#64748b'];
    const groupLabels = Array.from(groupMap.keys()).sort((a, b) => a.localeCompare(b));

    const series = groupLabels.map((label, idx) => ({
      id: label,
      label,
      data: labels.map((stage) => groupMap.get(label)?.[stage] || 0),
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
    colorBy,
    businessUnitsList,
    divisionsList,
    operatingUnitsList,
    sectorsList,
    programsList,
    sitesList,
    functionsList
  ]);

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
          color: '#0ea5e9',
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

    const getKeyAndLabel = (dateValue) => {
      const date = parseCalendarDate(dateValue);
      if (!date || Number.isNaN(date.getTime())) return null;
      if (severityTimelineGranularity === 'Annual') {
        return {
          key: `${date.getFullYear()}`,
          label: `${date.getFullYear()}`
        };
      }
      if (severityTimelineGranularity === 'This Week') {
        return {
          key: date.toDateString(),
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        };
      }
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const key = `${date.getFullYear()}-${month}`;
      return {
        key,
        label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      };
    };

    const weekRange = (() => {
      if (severityTimelineGranularity !== 'This Week') return null;
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
    })();

    const severityLabels = severityOptions.map((entry) => entry.label);
    const countsBySeverity = {};
    const keyLabelMap = new Map();
    const usedSeverities = new Set();

    nonconformances.forEach((nc) => {
      if (Number(nc.findingType) !== 1) return;
      const scheduleId = Number(nc.scheduleId ?? nc.scheduleid);
      const audit = auditBySchedule.get(scheduleId);
      if (!audit) return;
      const dateValue = resolveAuditDate(audit);
      if (!dateValue) return;
      const keyData = getKeyAndLabel(dateValue);
      if (!keyData) return;
      if (severityTimelineGranularity === 'This Week' && weekRange) {
        const date = parseCalendarDate(dateValue);
        if (!date || Number.isNaN(date.getTime()) || date < weekRange.start || date > weekRange.end) {
          return;
        }
      }
      keyLabelMap.set(keyData.key, keyData.label);
      const severityLabel = severityOptions.find((entry) => entry.id === Number(nc.severity))?.label || 'Unspecified';
      usedSeverities.add(severityLabel);
      if (!countsBySeverity[severityLabel]) {
        countsBySeverity[severityLabel] = {};
      }
      countsBySeverity[severityLabel][keyData.key] = (countsBySeverity[severityLabel][keyData.key] || 0) + 1;
    });

    const activeSeverityLabels = severityLabels.filter((label) => usedSeverities.has(label));
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
    const auditBySchedule = new Map(filteredAudits.map((audit) => [Number(audit.scheduleId), audit]));
    const functionLookup = new Map(functionsList.map((func) => [Number(func.functionId), func.functionName]));
    const severityLookup = new Map(severitiesList.map((severity) => [Number(severity.severityId), severity.severity]));

    const auditsForFindings = filteredAudits.filter((audit) => {
      if (!findingsIntExtId) return true;
      return Number(audit.intExtId) === Number(findingsIntExtId);
    });

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

    const getKeyAndLabel = (dateValue) => {
      const date = parseCalendarDate(dateValue);
      if (!date || Number.isNaN(date.getTime())) return null;
      if (timelineGranularity === 'Annual') {
        return {
          key: `${date.getFullYear()}`,
          label: `${date.getFullYear()}`
        };
      }
      if (timelineGranularity === 'This Week') {
        return {
          key: date.toDateString(),
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        };
      }
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const key = `${date.getFullYear()}-${month}`;
      return {
        key,
        label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      };
    };

    const weekRange = (() => {
      if (timelineGranularity !== 'This Week') return null;
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
    })();

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
      const keyData = dateValue ? getKeyAndLabel(dateValue) : null;
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
      const keyData = dateValue ? getKeyAndLabel(dateValue) : null;
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
      valueFormatter: (value) => (value ? `${value}` : null)
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

  const EXPORT_IMAGE_WIDTH = 1600;
  const EXPORT_IMAGE_HEIGHT = 900;

  const inlineSvgStyles = (source, target) => {
    if (!source || !target) return;
    const computed = window.getComputedStyle(source);
    const styleText = Array.from(computed)
      .map((prop) => `${prop}:${computed.getPropertyValue(prop)};`)
      .join('');
    if (styleText) {
      target.setAttribute('style', styleText);
    }
    const sourceChildren = source.children || [];
    const targetChildren = target.children || [];
    for (let i = 0; i < sourceChildren.length; i += 1) {
      if (targetChildren[i]) {
        inlineSvgStyles(sourceChildren[i], targetChildren[i]);
      }
    }
  };

  const waitForSvg = async (container, timeoutMs = 2500) => {
    const start = performance.now();
    while (performance.now() - start < timeoutMs) {
      const svg = container?.querySelector?.('svg');
      if (svg) {
        return svg;
      }
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    return null;
  };

  const exportSvgToPng = async (svg, filenameBase, width = EXPORT_IMAGE_WIDTH, height = EXPORT_IMAGE_HEIGHT) => {
    if (!svg) return false;

    const clone = svg.cloneNode(true);
    inlineSvgStyles(svg, clone);

    const existingViewBox = clone.getAttribute('viewBox');
    if (!existingViewBox) {
      try {
        const bbox = svg.getBBox();
        clone.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
      } catch (error) {
        clone.setAttribute('viewBox', `0 0 ${width} ${height}`);
      }
    }

    clone.setAttribute('width', `${width}`);
    clone.setAttribute('height', `${height}`);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

    const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    background.setAttribute('x', '0');
    background.setAttribute('y', '0');
    background.setAttribute('width', '100%');
    background.setAttribute('height', '100%');
    background.setAttribute('fill', '#ffffff');
    clone.insertBefore(background, clone.firstChild);

    const svgString = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    try {
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Canvas context unavailable.'));
              return;
            }
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((pngBlob) => {
              if (!pngBlob) {
                reject(new Error('Failed to render PNG blob.'));
                return;
              }
              const pngUrl = URL.createObjectURL(pngBlob);
              const link = document.createElement('a');
              link.href = pngUrl;
              link.download = `${filenameBase}.png`;
              document.body.appendChild(link);
              link.click();
              link.remove();
              URL.revokeObjectURL(pngUrl);
              resolve();
            }, 'image/png');
          } catch (error) {
            reject(error);
          }
        };
        img.onerror = () => reject(new Error('Failed to load SVG export image.'));
        img.src = url;
      });
      return true;
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const exportChartFallback = async (wrapperRef, filenameBase) => {
    const wrapper = wrapperRef?.current;
    if (!wrapper) return false;
    try {
      const dataUrl = await toPng(wrapper, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${filenameBase}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      return true;
    } catch (error) {
      console.warn('html-to-image export failed, falling back to SVG:', error);
    }
    const svg = wrapper.querySelector('svg');
    return exportSvgToPng(svg, filenameBase);
  };

  const exportChartWithRender = async (renderChart, filenameBase) => {
    if (!renderChart) return false;
    const container = document.createElement('div');
    container.style.width = `${EXPORT_IMAGE_WIDTH}px`;
    container.style.height = `${EXPORT_IMAGE_HEIGHT}px`;
    container.style.background = '#ffffff';
    container.style.position = 'fixed';
    container.style.left = '-10000px';
    container.style.top = '0';
    container.style.zIndex = '-1';
    container.style.overflow = 'hidden';
    document.body.appendChild(container);
    const root = createRoot(container);
    root.render(renderChart(EXPORT_IMAGE_WIDTH, EXPORT_IMAGE_HEIGHT));
    try {
      const svg = await waitForSvg(container);
      if (!svg) {
        throw new Error('Rendered chart SVG not found.');
      }
      return await exportSvgToPng(svg, filenameBase);
    } catch (error) {
      console.warn('Chart export render failed:', error);
      return false;
    } finally {
      root.unmount();
      container.remove();
    }
  };

  const handleExport = async (apiRef, wrapperRef, filenameBase, renderChart) => {
    const toastId = toast.info('Exporting metric image...', {
      autoClose: false,
      closeButton: false
    });
    const api = apiRef?.current;
    try {
      if (api?.exportAsImage) {
        api.exportAsImage();
        toast.update(toastId, {
          render: 'Metric export started.',
          type: 'success',
          autoClose: 2000,
          closeButton: true
        });
        return;
      }
      if (api?.exportAsPrint) {
        api.exportAsPrint();
        toast.update(toastId, {
          render: 'Metric export started.',
          type: 'success',
          autoClose: 2000,
          closeButton: true
        });
        return;
      }
      const rendered = await exportChartWithRender(renderChart, filenameBase);
      if (rendered) {
        toast.update(toastId, {
          render: 'Metric exported.',
          type: 'success',
          autoClose: 2000,
          closeButton: true
        });
        return;
      }
      const fallbackWorked = await exportChartFallback(wrapperRef, filenameBase);
      if (fallbackWorked) {
        toast.update(toastId, {
          render: 'Metric exported.',
          type: 'success',
          autoClose: 2000,
          closeButton: true
        });
        return;
      }
      console.warn('Chart export is not available with the current MUI X Charts build.');
      toast.update(toastId, {
        render: 'Metric export failed.',
        type: 'error',
        autoClose: 4000,
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
            {value}
          </text>
        ) : null}
      </g>
    );
  };

  const renderStageChart = (width, height) => (
    <BarChart
      xAxis={[{ scaleType: 'band', data: stageChartData.labels }]}
      yAxis={[{ tickMinStep: 1 }]}
      series={stageChartData.series}
      slots={{ tooltip: MetricsTooltip }}
      slotProps={{
        barLabel: { style: { fontSize: 12, fontWeight: 600 } },
        tooltip: { trigger: 'axis' }
      }}
      width={width}
      height={height}
      margin={{ top: 40, bottom: 50, left: 60, right: 20 }}
    >
      <StageTotalsOverlay labels={stageChartData.labels} totals={stageChartData.totals} />
    </BarChart>
  );

  const renderDelayChart = (width, height) => (
    <BarChart
      xAxis={[{ scaleType: 'band', data: delayChartData.labels }]}
      yAxis={[{ tickMinStep: 1 }]}
      series={delayChartData.series}
      slots={{ tooltip: MetricsTooltip }}
      slotProps={{
        barLabel: { style: { fontSize: 12, fontWeight: 600 } },
        tooltip: { trigger: 'axis' }
      }}
      width={width}
      height={height}
      margin={{ top: 40, bottom: 50, left: 60, right: 20 }}
    />
  );

  const renderMonthlyChart = (width, height) => (
    <LineChart
      xAxis={[{ scaleType: 'point', data: monthlyChartData.labels }]}
      yAxis={[{ tickMinStep: 1 }]}
      series={monthlyChartData.series}
      slots={{ tooltip: MetricsTooltip, mark: LabeledMark }}
      slotProps={{ tooltip: { trigger: 'axis' } }}
      width={width}
      height={height}
      margin={{ top: 40, bottom: 50, left: 60, right: 20 }}
    />
  );

  const renderSeverityChart = (width, height) => (
    <LineChart
      xAxis={[{ scaleType: 'point', data: severityTrendData.labels }]}
      yAxis={[{ tickMinStep: 1 }]}
      series={severityTrendData.series}
      slots={{ tooltip: MetricsTooltip, mark: LabeledMark }}
      slotProps={{ tooltip: { trigger: 'axis' } }}
      width={width}
      height={height}
      margin={{ top: 40, bottom: 50, left: 60, right: 20 }}
    />
  );

  const renderFindingsChart = (width, height) => (
    <BarChart
      xAxis={[{ scaleType: 'band', data: findingsChartData.labels }]}
      yAxis={[{ tickMinStep: 1 }]}
      series={findingsChartData.series}
      slots={{ tooltip: MetricsTooltip }}
      slotProps={{
        barLabel: { style: { fontSize: 12, fontWeight: 600 } },
        tooltip: { trigger: 'axis' }
      }}
      width={width}
      height={height}
      margin={{ top: 40, bottom: 50, left: 60, right: 20 }}
    >
      <StageTotalsOverlay labels={findingsChartData.labels} totals={findingsChartData.totals} />
    </BarChart>
  );

  const showStageMetric = activeTab === 'All' || activeTab === 'PCAB';
  const showDelayMetric = activeTab === 'All' || activeTab === 'Other';
  const showMonthlyMetric = activeTab === 'All' || activeTab === 'Finding Analysis';
  const showSeverityMetric = activeTab === 'All' || activeTab === 'Finding Analysis';
  const showFindingsMetric = activeTab === 'All' || activeTab === 'Finding Analysis';
  const hasSeverityData = severityTrendData.series.length > 0 && severityTrendData.labels.length > 0;

  const handleFilterChange = (key) => (selectedOption) => {
    setFilters((prev) => ({
      ...prev,
      [key]: selectedOption ? selectedOption.value : null
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
                isClearable
                options={auditorOptions}
                styles={customStyles}
                placeholder="Select Auditor"
                value={filters.auditorId ? auditorOptions.find((option) => option.value === filters.auditorId) : null}
                onChange={handleFilterChange('auditorId')}
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
              <label>Program</label>
              <Select
                isClearable
                options={programOptions}
                styles={customStyles}
                placeholder="Select Program"
                value={filters.programId ? programOptions.find((option) => option.value === filters.programId) : null}
                onChange={handleFilterChange('programId')}
              />
            </div>
            <div className="metrics-filter">
              <label>Sites</label>
              <Select
                isClearable
                options={siteOptions}
                styles={customStyles}
                placeholder="Select Site"
                value={filters.siteId ? siteOptions.find((option) => option.value === filters.siteId) : null}
                onChange={handleFilterChange('siteId')}
              />
            </div>
          </div>
          <div className="metrics-panel">
            <div className="metrics-tabs">
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
            <div className="metrics-panel-body">
              <div className="metrics-grid">
                {showStageMetric && (
                  <div className="metrics-card">
                    <div className="metrics-card-header">
                      <div className="metrics-card-title">
                        <span>Audits by Stage</span>
                      </div>
                      <button
                        type="button"
                        className="metrics-export-button"
                        onClick={() => handleExport(stageChartApiRef, stageChartWrapperRef, 'audits-by-stage', renderStageChart)}
                    >
                      Export
                    </button>
                  </div>
                  <div className="metrics-card-body" ref={stageChartWrapperRef}>
                    <BarChart
                      apiRef={stageChartApiRef}
                      xAxis={[{ scaleType: 'band', data: stageChartData.labels }]}
                      yAxis={[{ tickMinStep: 1 }]}
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
                    <div className="metrics-card-footer">
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
                        onClick={() => handleExport(delayChartApiRef, delayChartWrapperRef, 'delay-causes', renderDelayChart)}
                      >
                        Export
                      </button>
                    </div>
                    <div className="metrics-card-body" ref={delayChartWrapperRef}>
                      <BarChart
                        apiRef={delayChartApiRef}
                        xAxis={[{ scaleType: 'band', data: delayChartData.labels }]}
                        yAxis={[{ tickMinStep: 1 }]}
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
                    <span>Audits Conducted per Month</span>
                    <button
                      type="button"
                      className="metrics-export-button"
                      onClick={() => handleExport(monthlyChartApiRef, monthlyChartWrapperRef, 'audits-by-month', renderMonthlyChart)}
                    >
                      Export
                    </button>
                  </div>
                  <div className="metrics-card-body" ref={monthlyChartWrapperRef}>
                    <LineChart
                      apiRef={monthlyChartApiRef}
                      xAxis={[{ scaleType: 'point', data: monthlyChartData.labels }]}
                      yAxis={[{ tickMinStep: 1 }]}
                      series={monthlyChartData.series}
                      slots={{ tooltip: MetricsTooltip, mark: LabeledMark }}
                      slotProps={{ tooltip: { trigger: 'axis' } }}
                      height={260}
                      margin={{ top: 20, bottom: 30, left: 40, right: 10 }}
                    />
                  </div>
                  <div className="metrics-card-footer">
                    <label>Timeline</label>
                    <Select
                      isClearable={false}
                      options={[
                        { value: 'Annual', label: 'Annual' },
                        { value: 'Monthly', label: 'Monthly' },
                        { value: 'This Week', label: 'This Week' }
                      ]}
                      styles={customStyles}
                      placeholder="Select"
                      value={{ value: timelineGranularity, label: timelineGranularity }}
                      onChange={(option) => setTimelineGranularity(option?.value || 'Monthly')}
                    />
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
                )}
                {showSeverityMetric && (
                  <div className="metrics-card">
                    <div className="metrics-card-header">
                      <div className="metrics-card-title">
                        <span>NC Severity Mix Over Time</span>
                      </div>
                      <button
                        type="button"
                        className="metrics-export-button"
                        onClick={() => handleExport(severityChartApiRef, severityChartWrapperRef, 'nc-severity-mix', renderSeverityChart)}
                      >
                        Export
                      </button>
                    </div>
                    <div className="metrics-card-body" ref={severityChartWrapperRef}>
                      {hasSeverityData ? (
                        <BarChart
                          apiRef={severityChartApiRef}
                          xAxis={[{ scaleType: 'band', data: severityTrendData.labels }]}
                          yAxis={[{ tickMinStep: 1 }]}
                          series={severityTrendData.series}
                          slots={{ tooltip: MetricsTooltip }}
                          slotProps={{ tooltip: { trigger: 'axis' } }}
                          height={260}
                          margin={{ top: 20, bottom: 30, left: 40, right: 10 }}
                        />
                      ) : (
                        <div className="metrics-empty">No nonconformities found for the selected filters.</div>
                      )}
                    </div>
                    <div className="metrics-card-footer">
                      <label>Timeline</label>
                      <Select
                        isClearable={false}
                        options={[
                          { value: 'Annual', label: 'Annual' },
                          { value: 'Monthly', label: 'Monthly' },
                          { value: 'This Week', label: 'This Week' }
                        ]}
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
                        onClick={() => handleExport(findingsChartApiRef, findingsChartWrapperRef, 'findings-by-function', renderFindingsChart)}
                      >
                        Export
                      </button>
                    </div>
                    <div className="metrics-card-body" ref={findingsChartWrapperRef}>
                      <BarChart
                        apiRef={findingsChartApiRef}
                        xAxis={[{ scaleType: 'band', data: findingsChartData.labels }]}
                        yAxis={[{ tickMinStep: 1 }]}
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Metrics;
