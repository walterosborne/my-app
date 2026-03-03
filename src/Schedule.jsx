import { React, useEffect, useMemo, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import Select from "react-select"
import { Box, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import './App.css'
import { grey } from '@mui/material/colors';
import { customStyles } from './Utilities.jsx';
import {
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
  getCurrentUser
} from './assets/data/apiData';


function Schedule({ selectedAuditId, allAudits = [], reloadAudits }) {

  const [userInfo, setUserInfo] = useState({ name: 'User', myId: null });

  // State for lookup data from API
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
  const [selectedRiskFactors, setSelectedRiskFactors] = useState([]);
  const [riskRatings, setRiskRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submittedScheduleId, setSubmittedScheduleId] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [auditLocked, setAuditLocked] = useState(false);
  const navigate = useNavigate();

  // Load all lookup data from API on mount
  useEffect(() => {
    async function loadLookupData() {
      try {
        const userData = await getCurrentUser();
        if (userData?.name) {
          setUserInfo(userData);
        }
        const [programs, divisions, sectors, sites, businessUnits, operatingUnits, auditors, auditTypes, statuses, functions, intExt, standards, riskFactors, subcategories] = await Promise.all([
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
          getSubcategories()
        ]);

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
        setLoading(false);
      } catch (error) {
        console.error('Error loading lookup data:', error);
        setLoading(false);
      }
    }
    loadLookupData();
  }, []);

  // Helper function to get program names from programIds
  const getProgramNames = (programIds) => {
    return programIds.map(programId => {
      const program = programsList.find(p => p.programId === programId);
      return program ? program.programName : programId;
    }).join(', ');
  };

  // Helper function to get division name from divisionId
  const getDivisionName = (divisionId) => {
    const division = divisionsList.find(d => d.divisionId === divisionId);
    return division ? division.divisionName : divisionId;
  };

  // Helper function to get sector name from sectorId
  const getSectorName = (sectorId) => {
    const sector = sectorsList.find(s => s.sectorId === sectorId);
    return sector ? sector.sectorName : sectorId;
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

  // Helper function to get site label from siteId
  const getSiteName = (siteId) => {
    const site = sitesList.find(s => s.siteId === siteId);
    return site ? getSiteLabel(site) : siteId;
  };

  // Helper function to get business unit names from businessUnitIds
  const getBusinessUnitNames = (businessUnitIds) => {
    return businessUnitIds.map(businessUnitId => {
      const businessUnit = businessUnitsList.find(bu => bu.businessUnitId === businessUnitId);
      return businessUnit ? businessUnit.businessUnitName : businessUnitId;
    }).join(', ');
  };

  // Helper function to get operating unit names from operatingUnitIds
  const getOperatingUnitNames = (operatingUnitIds) => {
    return operatingUnitIds.map(operatingUnitId => {
      const operatingUnit = operatingUnitsList.find(ou => ou.operatingUnitId === operatingUnitId);
      return operatingUnit ? operatingUnit.operatingUnitName : operatingUnitId;
    }).join(', ');
  };

  // Helper function to get lead auditor name from leadAuditorId
  const getLeadAuditorName = (leadAuditorId) => {
    const auditor = auditorsList.find(a => a.auditorId === leadAuditorId);
    return auditor ? auditor.auditorName : leadAuditorId;
  };

  // Helper function to get additional auditor names from additionalAuditorIds
  const getAdditionalAuditorNames = (additionalAuditorIds) => {
    return additionalAuditorIds.map(auditorId => {
      const auditor = auditorsList.find(a => a.auditorId === auditorId);
      return auditor ? auditor.auditorName : auditorId;
    }).join(', ');
  };

  // Helper function to get audit type name from auditTypeId
  const getAuditTypeName = (auditTypeId) => {
    const auditType = auditTypesList.find(at => at.auditTypeId === auditTypeId);
    return auditType ? auditType.auditTypeName : auditTypeId;
  };

  // Helper function to get status name from statusId
  const getStatusName = (statusId) => {
    const status = statusesList.find(s => s.statusId === statusId);
    return status ? status.statusName : statusId;
  };

  // Helper function to get function name from functionId
  const getFunctionName = (functionId) => {
    const func = functionsList.find(f => f.functionId === functionId);
    return func ? func.functionName : functionId;
  };

  // Helper function to get int/ext name from intExtId
  const getIntExtName = (intExtId) => {
    const intExtItem = intExtList.find(ie => ie.intExtId === intExtId);
    return intExtItem ? intExtItem.intExtName : intExtId;
  };

  // Helper function to get standard names from standardIds
  const getStandardNames = (standardIds) => {
    return standardIds.map(standardId => {
      const standard = standardsList.find(s => s.standardId === standardId);
      return standard ? standard.standardName : standardId;
    }).join(', ');
  };

  const [selectedAudit, setSelectedAudit] = useState(null);
  const [rowSelectionModel, setRowSelectionModel] = useState({
    type: 'include',
    ids: new Set()
  });
  const isSameSelectionModel = (nextModel, currentModel) => {
    if (!nextModel || !currentModel) return false;
    if (nextModel.type !== currentModel.type) return false;
    if (!nextModel.ids || !currentModel.ids) return false;
    if (nextModel.ids.size !== currentModel.ids.size) return false;
    for (const id of nextModel.ids) {
      if (!currentModel.ids.has(id)) return false;
    }
    return true;
  };
  const { register, handleSubmit,
    setError,
    formState: { errors, isSubmitting },
    control,
    reset,
    setValue,
    watch,
    clearErrors
  } = useForm(
    {
      defaultValues: {
      }
    }
  )

  // Find selected audit from URL or from user selection
  useEffect(() => {
    if (selectedAuditId && allAudits.length > 0) {
      const audit = allAudits.find(a => a.scheduleId === selectedAuditId);
      if (audit) {
        setSelectedAudit(audit);
        setRowSelectionModel((prev) => {
          const nextModel = { type: 'include', ids: new Set([selectedAuditId]) };
          return isSameSelectionModel(nextModel, prev) ? prev : nextModel;
        });
        // Convert to schedule format that matches DataGrid rows
        const scheduleFormat = {
          id: audit.scheduleId,
          scheduleId: audit.scheduleId,
          title: audit.title,
          leadAuditor: getLeadAuditorName(audit.leadAuditorId),
          division: getDivisionName(audit.divisionId),
          programs: getProgramNames(audit.programIds)
        };
        setSchedule(scheduleFormat);
      }
    }
  }, [selectedAuditId, allAudits, setValue]);

  // Update selectedAudit when allAudits changes (e.g., after submission)
  useEffect(() => {
    if (schedule && schedule.scheduleId && allAudits.length > 0) {
      const updatedAudit = allAudits.find(a => a.scheduleId === schedule.scheduleId);
      if (updatedAudit) {
        setSelectedAudit(updatedAudit);
      }
    }
  }, [allAudits, schedule]);


  const mode = watch('mode');
  const startDate = watch('StartDate');
  const completionDate = watch('ExpCompDate');
  const selectedSectorId = watch('sector');
  const selectedDivisionId = watch('division');
  const parsedSectorId = selectedSectorId ? Number(selectedSectorId) : null;
  const parsedDivisionId = selectedDivisionId ? Number(selectedDivisionId) : null;
  const selectedPrograms = watch('program') || [];
  const selectedSites = watch('site') || [];
  const selectedBusinessUnits = watch('businessUnit') || [];
  const selectedOperatingUnits = watch('operatingUnit') || [];

  // Clear completion date if start date is set later than completion date
  useEffect(() => {
    if (startDate && completionDate && new Date(startDate) > new Date(completionDate)) {
      setValue('ExpCompDate', '');
    }
  }, [startDate, completionDate, setValue]);

  const areArraysEqual = (left, right) => {
    if (left.length !== right.length) {
      return false;
    }
    return left.every((value, index) => value === right[index]);
  };

  useEffect(() => {
    const parsedSectorId = selectedSectorId ? Number(selectedSectorId) : null;
    const parsedDivisionId = selectedDivisionId ? Number(selectedDivisionId) : null;
    if (!parsedSectorId || !parsedDivisionId) {
      return;
    }
    const division = divisionsList.find(d => d.divisionId === parsedDivisionId);
    if (division && division.sectorId !== parsedSectorId) {
      setValue('division', null);
      setValue('program', []);
      setValue('site', []);
      setValue('businessUnit', []);
      setValue('operatingUnit', []);
    }
  }, [selectedSectorId, selectedDivisionId, divisionsList, setValue]);

  useEffect(() => {
    const parsedDivisionId = selectedDivisionId ? Number(selectedDivisionId) : null;
    if (!parsedDivisionId) {
      return;
    }

    const filterByDivision = (ids, list, idKey) => {
      const filtered = [];
      ids.forEach(id => {
        const normalizedId = Number(id);
        const item = list.find(entry => entry[idKey] === normalizedId);
        if (!item) {
          return;
        }
        if (item.divisionId === parsedDivisionId || item.divisionId == null) {
          filtered.push(normalizedId);
        }
      });
      return filtered;
    };

    if (activeProgramsList.length > 0) {
      const nextPrograms = filterByDivision(selectedPrograms, activeProgramsList, 'programId');
      if (!areArraysEqual(selectedPrograms, nextPrograms)) {
        setValue('program', nextPrograms);
      }
    }

    const activeSitesList = sitesList.filter(s => (s.active ?? 1) === 1);
    if (activeSitesList.length > 0) {
      const nextSites = filterByDivision(selectedSites, activeSitesList, 'siteId');
      if (!areArraysEqual(selectedSites, nextSites)) {
        setValue('site', nextSites);
      }
    }

    if (businessUnitsList.length > 0) {
      const nextBusinessUnits = filterByDivision(selectedBusinessUnits, businessUnitsList, 'businessUnitId');
      if (!areArraysEqual(selectedBusinessUnits, nextBusinessUnits)) {
        setValue('businessUnit', nextBusinessUnits);
      }
    }

    if (operatingUnitsList.length > 0) {
      const nextOperatingUnits = filterByDivision(selectedOperatingUnits, operatingUnitsList, 'operatingUnitId');
      if (!areArraysEqual(selectedOperatingUnits, nextOperatingUnits)) {
        setValue('operatingUnit', nextOperatingUnits);
      }
    }
  }, [
    selectedDivisionId,
    selectedPrograms,
    selectedSites,
    selectedBusinessUnits,
    selectedOperatingUnits,
    programsList,
    sitesList,
    businessUnitsList,
    operatingUnitsList,
    setValue
  ]);

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10
  });

  const columns = useMemo(() => [
    { field: 'scheduleId', headerName: 'Schedule ID', width: 150 },
    { field: 'title', headerName: 'Title', width: 300 },
    { field: 'leadAuditor', headerName: 'Lead Auditor', width: 150 },
    { field: 'division', headerName: 'Division', width: 200 },
    { field: 'programs', headerName: 'Program(s)', width: 200 },
  ], []);

  // Use real audit data from auditData.js
  const sortedAudits = useMemo(() => {
    return [...allAudits].sort((a, b) => Number(b.scheduleId) - Number(a.scheduleId));
  }, [allAudits]);

  const schedules = sortedAudits.map(audit => ({
    id: audit.scheduleId,
    scheduleId: audit.scheduleId,
    title: audit.title,
    leadAuditor: getLeadAuditorName(audit.leadAuditorId),
    division: getDivisionName(audit.divisionId),
    programs: getProgramNames(audit.programIds)
  }));

  const filteredDivisionsList = parsedSectorId
    ? divisionsList.filter(d => d.sectorId === parsedSectorId)
    : divisionsList;

  const activeProgramsList = programsList.filter(p => (p.active ?? 1) === 1);

  const filteredProgramsList = parsedDivisionId
    ? activeProgramsList.filter(p => p.divisionId === parsedDivisionId || p.divisionId == null)
    : activeProgramsList;

  const activeSitesList = sitesList.filter(s => (s.active ?? 1) === 1);

  const filteredSitesList = parsedDivisionId
    ? activeSitesList.filter(s => s.divisionId === parsedDivisionId || s.divisionId == null)
    : activeSitesList;

  const filteredBusinessUnitsList = parsedDivisionId
    ? businessUnitsList.filter(bu => bu.divisionId === parsedDivisionId || bu.divisionId == null)
    : businessUnitsList;

  const filteredOperatingUnitsList = parsedDivisionId
    ? operatingUnitsList.filter(ou => ou.divisionId === parsedDivisionId || ou.divisionId == null)
    : operatingUnitsList;

  // Convert programsList to react-select format
  const programOptions = filteredProgramsList.map(p => ({
    value: p.programId,
    label: p.programName
  })).sort((a, b) => a.label.localeCompare(b.label));

  const programs = programOptions;

  // Convert divisionsList to react-select format
  const divisionOptions = filteredDivisionsList.map(d => ({
    value: d.divisionId,
    label: d.divisionName
  })).sort((a, b) => a.label.localeCompare(b.label));

  const divisions = divisionOptions;

  // Convert sectorsList to react-select format
  const sectorOptions = sectorsList.map(s => ({
    value: s.sectorId,
    label: s.sectorName
  })).sort((a, b) => a.label.localeCompare(b.label));

  const sectors = sectorOptions;

  // Convert sitesList to react-select format
  const siteOptions = filteredSitesList.map(s => ({
    value: s.siteId,
    label: getSiteLabel(s)
  })).sort((a, b) => a.label.localeCompare(b.label));

  const sites = siteOptions;

  const activeBusinessUnits = filteredBusinessUnitsList.filter(bu => (bu.active ?? 1) === 1);

  const businessUnits = activeBusinessUnits.map(bu => ({
    value: bu.businessUnitId,
    label: bu.businessUnitName
  })).sort((a, b) => a.label.localeCompare(b.label));

  const activeOperatingUnits = filteredOperatingUnitsList.filter(ou => (ou.active ?? 1) === 1);

  const operatingUnits = activeOperatingUnits.map(ou => ({
    value: ou.operatingUnitId,
    label: ou.operatingUnitName
  })).sort((a, b) => a.label.localeCompare(b.label));

  const activeAuditTypes = auditTypesList.filter(at => (at.active ?? 1) === 1);

  const auditTypes = activeAuditTypes.map(at => ({
    value: at.auditTypeId,
    label: at.auditTypeName
  })).sort((a, b) => a.label.localeCompare(b.label));

  const activeAuditors = auditorsList.filter(a => (a.active ?? 1) === 1);

  const leadAuditors = activeAuditors.map(a => ({
    value: a.auditorId,
    label: a.auditorName
  })).sort((a, b) => a.label.localeCompare(b.label));

  // Watch the selected lead auditor to filter it out from additional auditors
  const selectedLeadAuditor = watch('leadAuditor');

  const additionalAuditors = activeAuditors
    .filter(a => a.auditorId !== selectedLeadAuditor) // Exclude selected lead auditor
    .map(a => ({
      value: a.auditorId,
      label: a.auditorName
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const standards = [
    { value: "Standard 1", label: "Standard 1" },
    { value: "Standard 2", label: "Standard 2" },
    { value: "Standard 3", label: "Standard 3" },
  ];

  const statuses = statusesList.map(s => ({
    value: s.statusId,
    label: s.statusName
  })).sort((a, b) => a.label.localeCompare(b.label));

  const activeFunctions = functionsList.filter(f => (f.active ?? 1) === 1);

  const functions = activeFunctions.map(f => ({
    value: f.functionId,
    label: f.functionName
  })).sort((a, b) => a.label.localeCompare(b.label));

  const intExtOptions = intExtList.map(ie => ({
    value: ie.intExtId,
    label: ie.intExtName
  })).sort((a, b) => a.label.localeCompare(b.label));

  const standardsOptions = standardsList.map(s => ({
    value: s.standardId,
    label: s.standardName
  })).sort((a, b) => a.label.localeCompare(b.label));

  // Load risk ratings when an audit is selected
  useEffect(() => {
    async function loadRiskRatings() {
      if (selectedAudit?.scheduleId) {
        try {
          const ratings = await getRiskRatings(selectedAudit.scheduleId);

          // Convert ratings array to object for easier lookup
          const ratingsMap = {};
          const selectedFactors = new Set();

          ratings.forEach(rating => {
            ratingsMap[rating.subcategoryid] = rating.rating;
            // Find which risk factor this subcategory belongs to
            const subcategory = subcategoriesList.find(s => s.subcategoryid === rating.subcategoryid);
            if (subcategory) {
              selectedFactors.add(subcategory.riskfactorid);
            }
          });

          setRiskRatings(ratingsMap);
          setSelectedRiskFactors(Array.from(selectedFactors));
        } catch (error) {
          console.error('Error loading risk ratings:', error);
        }
      } else {
        // Clear when no audit selected
        setRiskRatings({});
        setSelectedRiskFactors([]);
      }
    }

    if (subcategoriesList.length > 0) {
      loadRiskRatings();
    }
  }, [selectedAudit?.scheduleId, subcategoriesList]);


  useEffect(() => {
    if (mode === 'New') {
      setSchedule(null);
      setSelectedAudit(null);
      setRowSelectionModel({
        type: 'include',
        ids: new Set()
      });
      // Clear risk factors when switching to New mode
      setRiskRatings({});
      setSelectedRiskFactors([]);
    }
  }, [mode]);

  useEffect(() => {
    console.log("Selected schedule changed:", schedule);
    console.log("Selected audit:", selectedAudit);
    console.log("Selected audit title:", selectedAudit?.title);
    console.log("Selected audit comment:", selectedAudit?.comment);
    if (schedule) {
      // Automatically set mode to Edit when a schedule is set
      setValue("mode", "Edit");
      // Clear any validation errors when loading audit data
      clearErrors();

      // Check locked status
      if (selectedAudit?.locked !== undefined) {
        console.log("Setting auditLocked - selectedAudit.locked:", selectedAudit.locked, "Type:", typeof selectedAudit.locked);
        setAuditLocked(selectedAudit.locked === 1);
        console.log("auditLocked will be set to:", selectedAudit.locked === 1);
      } else {
        console.log("selectedAudit.locked is undefined");
      }

      // Set title if available
      if (selectedAudit && selectedAudit.title) {
        console.log("Setting title to:", selectedAudit.title);
        setValue("title", selectedAudit.title);
      }
      // Set sector if available
      if (selectedAudit && selectedAudit.sectorId) {
        setValue("sector", selectedAudit.sectorId);
      }
      // Set division if available
      if (selectedAudit && selectedAudit.divisionId) {
        setValue("division", selectedAudit.divisionId);
      }
      // Set site if available
      if (selectedAudit && selectedAudit.siteIds) {
        setValue("site", selectedAudit.siteIds);
      }
      // Set programs if available
      if (selectedAudit && selectedAudit.programIds) {
        console.log("Setting programs to:", selectedAudit.programIds);
        setValue("program", selectedAudit.programIds);
      }
      // Set business units if available
      if (selectedAudit && selectedAudit.businessUnitIds) {
        setValue("businessUnit", selectedAudit.businessUnitIds);
      }
      // Set operating units if available
      if (selectedAudit && selectedAudit.operatingUnitIds) {
        setValue("operatingUnit", selectedAudit.operatingUnitIds);
      }
      // Set lead auditor if available
      if (selectedAudit && selectedAudit.leadAuditorId) {
        setValue("leadAuditor", selectedAudit.leadAuditorId);
      }
      // Set additional auditors if available
      if (selectedAudit && selectedAudit.additionalAuditorIds) {
        setValue("additionalAuditors", selectedAudit.additionalAuditorIds);
      }
      // Set audit type if available
      if (selectedAudit && selectedAudit.auditTypeId) {
        setValue("auditType", selectedAudit.auditTypeId);
      }
      // Set function if available
      if (selectedAudit && selectedAudit.functionId) {
        setValue("function", selectedAudit.functionId);
      }
      // Set status if available
      if (selectedAudit && selectedAudit.statusId) {
        setValue("status", selectedAudit.statusId);
      }
      // Set int/ext if available
      if (selectedAudit && selectedAudit.intExtId) {
        setValue("IntExt", selectedAudit.intExtId);
      }
      // Set standards if available
      if (selectedAudit && selectedAudit.standardIds) {
        setValue("standards", selectedAudit.standardIds);
      }
      // Set expected start date if available
      if (selectedAudit && selectedAudit.expectedStartDate) {
        const startDate = selectedAudit.expectedStartDate.split('T')[0]; // Extract YYYY-MM-DD
        setValue("StartDate", startDate);
      }
      // Set expected completion date if available
      if (selectedAudit && selectedAudit.expectedCompletionDate) {
        const compDate = selectedAudit.expectedCompletionDate.split('T')[0]; // Extract YYYY-MM-DD
        setValue("ExpCompDate", compDate);
      }
      // Set comment if available
      if (selectedAudit && selectedAudit.comment) {
        setValue("comment", selectedAudit.comment);
      }
    } else {
      // Reset form but keep the mode value
      const currentMode = mode;
      reset();
      if (currentMode) {
        setValue("mode", currentMode);
      }
    }
  }, [schedule, selectedAudit]); // Runs effect whenever schedule or selectedAudit changes

  async function onSubmit(data) {
    try {
      // Validate risk ratings - check if any subcategory is checked but has no rating selected
      const incompleteRatings = Object.entries(riskRatings).filter(([_, rating]) => rating === '');
      if (incompleteRatings.length > 0) {
        toast.error('Please select a rating for all checked subcategories');
        return;
      }

      // Generate a unique hash for tracking new records
      const hash = Math.random().toString(36).substring(2, 22);

      console.log("Submitting data - comment:", data.comment);

      const computeStage = (fallbackStage) => {
        const currentStage = selectedAudit?.stage ?? 0;
        return Math.max(currentStage, fallbackStage);
      };


      // Prepare audit data
      const auditData = {
        scheduleId: selectedAudit?.scheduleId || null,
        title: data.title,
        auditTypeId: data.auditType,
        intExtId: data.IntExt,
        functionId: data.function,
        standardIds: data.standards || [],
        statusId: data.status,
        stage: computeStage(1),
        expectedStartDate: data.StartDate ? new Date(data.StartDate).toISOString() : null,
        expectedCompletionDate: data.ExpCompDate ? new Date(data.ExpCompDate).toISOString() : null,
        divisionId: data.division,
        programIds: data.program || [],
        sectorId: data.sector,
        siteIds: data.site || [],
        businessUnitIds: data.businessUnit || [],
        operatingUnitIds: data.operatingUnit || [],
        leadAuditorId: data.leadAuditor,
        additionalAuditorIds: data.additionalAuditors || [],
        comment: data.comment || '',
        hash: hash
        ,
        targetStage: 1
      };

      console.log("Audit data being sent:", auditData);

      // Save to database
      const response = await fetch('http://localhost:3001/api/audits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(auditData)
      });

      const result = await response.json();

      if (result.success) {
        let finalScheduleId = selectedAudit?.scheduleId;

        // If this was a new record, retrieve the assigned scheduleId using the hash
        if (!selectedAudit?.scheduleId) {
          const idResponse = await fetch(`http://localhost:3001/api/audits?hash=${hash}`);
          const audits = await idResponse.json();
          if (audits && audits.length > 0) {
            finalScheduleId = audits[0].scheduleId;
          }
        }

        toast.success('Submitted!');
        setSubmitted(true);
        setSubmittedScheduleId(finalScheduleId);

        // Save risk ratings if any exist
        const ratingsToSave = Object.entries(riskRatings)
          .filter(([_, rating]) => rating !== null && rating !== '')
          .map(([subcategoryId, rating]) => ({
            subcategoryId: parseInt(subcategoryId),
            rating: parseInt(rating)
          }));

        if (ratingsToSave.length > 0) {
          const ratingsResponse = await fetch('http://localhost:3001/api/risk-ratings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              scheduleId: finalScheduleId,
              ratings: ratingsToSave
            })
          });

          const ratingsResult = await ratingsResponse.json();
          if (!ratingsResult.success) {
            console.error('Failed to save risk ratings:', ratingsResult.error);
          }
        }

        // Reload all audit data - add small delay to ensure DB transaction completes
        if (reloadAudits) {
          console.log('Reloading audits after submission...');
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
          await reloadAudits();
          console.log('Audits reloaded successfully');
        }
      } else {
        throw new Error(result.error || 'Failed to save audit');
      }
    }
    catch (error) {
      toast.error(`Error: ${error.message}`);
      setError("root",
        { message: error.message }
      )
    }
  }
  async function unlockAudit() {
    try {
      if (!schedule?.scheduleId) {
        throw new Error('No audit selected');
      }

      const response = await fetch('http://localhost:3001/api/unlock-audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduleId: schedule.scheduleId
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Audit unlocked successfully!');
        setAuditLocked(false);
        // Reload all audit data to refresh the state
        if (reloadAudits) {
          await reloadAudits();
        }
      } else {
        throw new Error(result.error || 'Failed to unlock audit');
      }
    } catch (error) {
      toast.error('Failed to unlock audit: ' + error.message);
    }
  }
  function handleReset() {
    const currentMode = mode;
    setSubmitted(false);
    setSubmittedScheduleId(null);

    if (currentMode === 'New') {
      // In New mode, clear everything
      reset();
      setSelectedAudit(null);
      setSchedule(null);
      setRowSelectionModel({
        type: 'include',
        ids: new Set()
      });
      setValue("mode", "New");
      // Clear risk factors
      setRiskRatings({});
      setSelectedRiskFactors([]);
    } else if (currentMode === 'Edit' && selectedAudit) {
      // In Edit mode, restore the saved data
      setSchedule({
        id: selectedAudit.scheduleId,
        scheduleId: selectedAudit.scheduleId,
        title: selectedAudit.title,
        leadAuditor: selectedAudit.leadAuditor,
        division: getDivisionName(selectedAudit.divisionId),
        programs: getProgramNames(selectedAudit.programIds)
      });

      // Reload risk ratings from the saved audit
      async function reloadRiskRatings() {
        try {
          const ratings = await getRiskRatings(selectedAudit.scheduleId);

          const ratingsMap = {};
          const selectedFactors = new Set();

          ratings.forEach(rating => {
            ratingsMap[rating.subcategoryid] = rating.rating;
            const subcategory = subcategoriesList.find(s => s.subcategoryid === rating.subcategoryid);
            if (subcategory) {
              selectedFactors.add(subcategory.riskfactorid);
            }
          });

          setRiskRatings(ratingsMap);
          setSelectedRiskFactors(Array.from(selectedFactors));
        } catch (error) {
          console.error('Error reloading risk ratings:', error);
        }
      }

      if (subcategoriesList.length > 0) {
        reloadRiskRatings();
      }

      // The useEffect will repopulate the form from selectedAudit
    }
  }

  function onValidationError(errors) {
    // Show toast with all validation errors
    const errorArray = Object.values(errors)
      .map(error => error.message)
      .filter(msg => msg);

    const errorMessage = errorArray.length > 3
      ? 'Please complete all required fields'
      : errorArray.join(', ') || 'Please fill in all required fields';

    toast.error(errorMessage, {
      progressStyle: { backgroundColor: '#f44336' },
      style: { borderLeft: '4px solid #f44336' }
    });
  }

  function handleExport() {
    // Get current form values
    const formData = watch();

    // Determine filename and sheet name
    const fileName = mode === 'New' ? 'New Schedule' : `Schedule ${selectedAudit?.scheduleId || ''}`;
    const sheetName = fileName;

    // Helper function to format arrays as semicolon-separated strings
    const formatArray = (arr, lookupList, idKey, nameKey) => {
      if (!arr || arr.length === 0) return '';
      return arr.map(id => {
        const item = lookupList.find(l => l[idKey] === id);
        return item ? item[nameKey] : id;
      }).join('; ');
    };

    // Helper function to format single value
    const formatSingle = (id, lookupList, idKey, nameKey) => {
      if (!id) return '';
      const item = lookupList.find(l => l[idKey] === id);
      return item ? item[nameKey] : id;
    };
    const formatSiteArray = (arr) => {
      if (!arr || arr.length === 0) return '';
      return arr.map(id => {
        const item = sitesList.find(site => site.siteId === id);
        return item ? getSiteLabel(item) : id;
      }).join('; ');
    };

    // Prepare field names (headers) and values as separate arrays
    const headers = [
      'Schedule ID', 'Title', 'Sector', 'Division', 'Program(s)', 'Site(s)',
      'Business Unit(s)', 'Operating Unit(s)', 'Audit Type',
      'Lead Auditor', 'Additional Auditors', 'Expected Start Date',
      'Expected Completion Date', 'Int/Ext Audit', 'Standard(s)',
      'Status', 'Function', 'Comment'
    ];

    const values = [
      selectedAudit?.scheduleId || 'New',
      formData.title || '',
      formatSingle(formData.sector, sectorsList, 'sectorId', 'sectorName'),
      formatSingle(formData.division, divisionsList, 'divisionId', 'divisionName'),
      formatArray(formData.program, programsList, 'programId', 'programName'),
      formatSiteArray(formData.site),
      formatArray(formData.businessUnit, businessUnitsList, 'businessUnitId', 'businessUnitName'),
      formatArray(formData.operatingUnit, operatingUnitsList, 'operatingUnitId', 'operatingUnitName'),
      formatSingle(formData.auditType, auditTypesList, 'auditTypeId', 'auditTypeName'),
      formatSingle(formData.leadAuditor, auditorsList, 'auditorId', 'auditorName'),
      formatArray(formData.additionalAuditors, auditorsList, 'auditorId', 'auditorName'),
      formData.StartDate || '',
      formData.ExpCompDate || '',
      formatSingle(formData.IntExt, intExtList, 'intExtId', 'intExtName'),
      formatArray(formData.standards, standardsList, 'standardId', 'standardName'),
      formatSingle(formData.status, statusesList, 'statusId', 'statusName'),
      formatSingle(formData.function, functionsList, 'functionId', 'functionName'),
      formData.comment || ''
    ];

    // Create export data with headers in first row, values in second row
    const exportData = [headers, values];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(exportData);

    // Make header row bold
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellAddress]) continue;
      ws[cellAddress].s = {
        font: { bold: true }
      };
    }

    // Set column widths based on content
    const colWidths = headers.map((header, i) => ({
      wch: Math.max(header.length, values[i]?.toString().length || 0) + 2
    }));
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Generate and download file
    XLSX.writeFile(wb, `${fileName}.xlsx`);

    toast.info('Schedule exported successfully!', {
      progressStyle: { backgroundColor: '#2196f3' },
      style: { borderLeft: '4px solid #2196f3' }
    });
  }

  return (
    <>
      <div style={{ width: '100%', textAlign: 'left' }}>
        <h1>Schedule Entry Tool</h1>
        <h2 style={{ marginTop: '3px' }}>
          Welcome {userInfo.name}.{' '}
          <a
            href={`mailto:walter.osborne@ngc.com?subject=${encodeURIComponent(
              userInfo.myId ? `NGAT user verification (${userInfo.myId})` : 'NGAT user verification'
            )}&body=${encodeURIComponent(
              userInfo.myId ? `Hi Walter, NGAT is registering me with the MyID  ${userInfo.myId}, which is incorrect.` : 'Hi Walter, NGAT is not registering my MyID correctly.'
            )}`}
            target="_blank"
            rel="noreferrer"
          >
            Not you?
          </a>
        </h2>
      </div>
      {/* If the page has encountered an error not tied to a field display it instead of the form */}
      {errors.root ? <p className='error'>{errors.root.message}</p> :
        <>
          {/* Form that has certain built in properties like submit and reset */}
          <form onSubmit={handleSubmit(onSubmit, onValidationError)} style={{ width: '100%' }}>
            <div className='section' style={{ border: '1px solid transparent', marginTop: '0px', padding: '0px' }}>
              <label className='sectiontitle' style={{ marginLeft: '0px', marginTop: '10px' }}>Select Mode</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                  <input
                    {...register("mode", {
                      required: 'Mode is required'
                    })} type="radio" name='mode' value={'New'} />
                  <label htmlFor='' style={{ marginLeft: '3px' }}>New Entry</label>
                </div>
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                  <input
                    {...register("mode", {
                      required: 'Mode is required'
                    })} type="radio" name='mode' value={'Edit'} />
                  <label style={{ marginLeft: '3px' }}>Edit Entry</label>
                </div>
              </div>
            </div>
            {mode && <>
              {mode === 'Edit' && <Box sx={{ height: 400, width: '100%', marginTop: '10px' }}>
                <DataGrid
                  rows={schedules}
                  columns={columns}
                  checkboxSelection
                  disableMultipleRowSelection
                  getRowId={(row) => row.scheduleId}
                  rowSelectionModel={rowSelectionModel}
                  pageSizeOptions={[5, 10, 20]}
                  paginationModel={paginationModel}
                  onPaginationModelChange={setPaginationModel}
                  getRowSpacing={(params) => ({
                    top: params.isFirstVisible ? 0 : 5,
                    bottom: params.isLastVisible ? 0 : 5,
                  })}
                  onRowSelectionModelChange={(selectionModel) => {
                    if (!selectionModel?.ids) return;
                    if (isSameSelectionModel(selectionModel, rowSelectionModel)) return;
                    setRowSelectionModel(selectionModel);
                    if (selectionModel.ids.size > 0) {
                      const scheduleID = Array.from(selectionModel.ids)[0];
                      const selectedSchedule = schedules.find(s => s.scheduleId === scheduleID);
                      // Find the original audit object with programIds - always use current allAudits
                      const originalAudit = allAudits.find(a => a.scheduleId === scheduleID);
                      console.log("Row selected - Schedule ID:", scheduleID);
                      console.log("Row selected - Audit title:", originalAudit?.title);
                      console.log("Row selected - Audit comment:", originalAudit?.comment);
                      console.log("Row selected - Full audit object:", originalAudit);
                      if (originalAudit) {
                        setSelectedAudit(originalAudit);
                        setSchedule(selectedSchedule);
                      }
                    } else {
                      //No row selected, clearing schedule
                      setSelectedAudit(null);
                      setSchedule(null);
                    }
                  }}
                  //sx is used to style MUI components; the & symbol targets nested elements; the rows of the grid are called MuiDataGrid-rows;
                  sx={{ // We set the style to a function that checks the theme mode and applies different background colors for light and dark modes
                    '& .MuiDataGrid-row': { //Greys come from mui; maybe replace with custom colors later
                      bgcolor: (theme) => theme.palette.mode === 'light' ? grey[200] : grey[900],
                    },
                  }}
                />

              </Box>}
              {schedule && <h2 style={{ marginTop: '5px' }}>Currently Editing Schedule: {schedule.scheduleId}</h2>}
              {/* Sections mimic the old streamlit containers with borders */}
              {(mode !== 'Edit' || schedule) && (
                <>
                  {(mode !== 'Edit' || !auditLocked) ?
                    (
                      <>
                        <div className='section'>
                          <label className='sectiontitle' htmlFor="title">Audit Title<label style={{ color: 'red' }}>*</label></label>
                          {/* Field box quarter is a quarter width field */}
                          <div className='sectionrow'>
                            <div className="fieldboxwhole">
                              <input
                                // Text input field that sets title field of form data using register, and the required message is sent to title error if not filled out
                                {...register("title", {
                                  required: 'Title is required'
                                })}
                                type="text"
                                placeholder="Title"
                                id='title'
                                className='textfield'
                              />
                            </div>
                          </div>
                          {errors.title && <p className='fielderror'>{errors.title.message}</p>}
                        </div>
                        <div className='section'>
                          <label className='sectiontitle'>Audit Location</label>
                          <div className='sectionrow'>
                            <div className="fieldboxquarter">
                              <label>Sector<label style={{ color: 'red' }}>*</label></label>
                              <Controller
                                name="sector"
                                control={control}
                                rules={{ required: "Sector is required" }}
                                render={({ field }) => (
                                  <Select
                                    isClearable
                                    options={sectors}
                                    styles={customStyles}
                                    placeholder="Sector"
                                    value={field.value ? sectors.find(s => s.value === field.value) : null}
                                    onChange={(selectedOption) => field.onChange(selectedOption ? selectedOption.value : null)}
                                  />
                                )}
                              />
                              {errors.sector && <p className='fielderror'>{errors.sector.message}</p>}
                            </div>

                            <div className="fieldboxquarter">
                              <label>Division<label style={{ color: 'red' }}>*</label></label>
                              <Controller
                                name="division"
                                control={control}
                                rules={{ required: "Division is required" }}
                                render={({ field }) => (
                                  <Select
                                    isClearable
                                    options={divisions}
                                    styles={customStyles}
                                    placeholder="Division"
                                    value={field.value ? divisions.find(d => d.value === field.value) : null}
                                    onChange={(selectedOption) => field.onChange(selectedOption ? selectedOption.value : null)}
                                  />
                                )}
                              />
                              {errors.division && <p className='fielderror'>{errors.division.message}</p>}
                            </div>

                            <div className="fieldboxquarter">
                              <label>Program(s)</label>
                              <Controller
                                name="program"
                                control={control}
                                render={({ field }) => (
                                  <Select
                                    isClearable
                                    isMulti
                                    options={programs}
                                    styles={customStyles}
                                    placeholder="Program"
                                    value={field.value ? programs.filter(p => field.value.includes(p.value)) : []}
                                    onChange={(selectedOptions) => field.onChange(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                                  />
                                )}
                              />
                              {errors.program && <p className='fielderror'>{errors.program.message}</p>}
                            </div>

                            <div className="fieldboxquarter">
                              <label>Site(s)<label style={{ color: 'red' }}>*</label></label>
                              <Controller
                                name="site"
                                control={control}
                                rules={{ required: "Site is required" }}
                                render={({ field }) => (
                                  <Select
                                    isClearable
                                    isMulti
                                    options={sites}
                                    styles={customStyles}
                                    placeholder="Site"
                                    value={field.value ? sites.filter(s => field.value.includes(s.value)) : []}
                                    onChange={(selectedOptions) => field.onChange(selectedOptions && selectedOptions.length > 0 ? selectedOptions.map(opt => opt.value) : [])}
                                  />
                                )}
                              />
                              {errors.site && <p className='fielderror'>{errors.site.message}</p>}
                            </div>
                          </div>
                          <div className='sectionrow'>
                            <div className="fieldboxthird">
                              <label>Business Unit</label>
                              <Controller
                                name="businessUnit"
                                control={control}
                                render={({ field }) => (
                                  <Select
                                    isMulti
                                    isClearable
                                    options={businessUnits}
                                    styles={customStyles}
                                    placeholder="Business Unit"
                                    value={field.value ? businessUnits.filter(b => field.value.includes(b.value)) : []}
                                    onChange={(selectedOptions) => field.onChange(selectedOptions ? selectedOptions.map(option => option.value) : [])}
                                  />
                                )}
                              />
                              {errors.businessUnit && <p className='fielderror'>{errors.businessUnit.message}</p>}
                            </div>

                            <div className="fieldboxthird">
                              <label>Operating Unit</label>
                              <Controller
                                name="operatingUnit"
                                control={control}
                                render={({ field }) => (
                                  <Select
                                    isMulti
                                    isClearable
                                    options={operatingUnits}
                                    styles={customStyles}
                                    placeholder="Operating Unit"
                                    value={field.value ? operatingUnits.filter(o => field.value.includes(o.value)) : []}
                                    onChange={(selectedOptions) => field.onChange(selectedOptions ? selectedOptions.map(option => option.value) : [])}
                                  />
                                )}
                              />
                              {errors.operatingUnit && <p className='fielderror'>{errors.operatingUnit.message}</p>}
                            </div>

                            <div className="fieldboxthird">
                              <label>Audit Type<label style={{ color: 'red' }}>*</label></label>
                              <Controller
                                name="auditType"
                                control={control}
                                rules={{ required: "Audit Type is required" }}
                                render={({ field }) => (
                                  <Select
                                    isClearable
                                    options={auditTypes}
                                    styles={customStyles}
                                    placeholder="Audit Type"
                                    value={field.value ? auditTypes.find(a => a.value === field.value) : null}
                                    onChange={(selectedOption) => field.onChange(selectedOption ? selectedOption.value : null)}
                                  />
                                )}
                              />
                              {errors.auditType && <p className='fielderror'>{errors.auditType.message}</p>}
                            </div>
                          </div>
                        </div>
                        <div className='section'>
                          <label className='sectiontitle'>Auditors</label>
                          <div className='sectionrow'>
                            <div className="fieldboxhalf">
                              <label>Lead Auditor<label style={{ color: 'red' }}>*</label></label>
                              <Controller
                                name="leadAuditor"
                                control={control}
                                rules={{ required: "Lead Auditor is required" }}
                                render={({ field }) => (
                                  <Select
                                    isClearable
                                    options={leadAuditors}
                                    styles={customStyles}
                                    placeholder="Lead Auditor"
                                    value={field.value ? leadAuditors.find(l => l.value === field.value) : null}
                                    onChange={(selectedOption) => field.onChange(selectedOption ? selectedOption.value : null)}
                                  />
                                )}
                              />
                              {errors.leadAuditor && <p className='fielderror'>{errors.leadAuditor.message}</p>}
                            </div>

                            <div className="fieldboxhalf">
                              <label>Additional Auditors</label>
                              <Controller
                                name="additionalAuditors"
                                control={control}
                                render={({ field }) => (
                                  <Select
                                    isClearable
                                    isMulti
                                    options={additionalAuditors}
                                    styles={customStyles}
                                    placeholder="Additional Auditors"
                                    value={field.value ? additionalAuditors.filter(a => field.value.includes(a.value)) : []}
                                    onChange={(selectedOptions) => field.onChange(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                                  />
                                )}
                              />
                              {errors.additionalAuditors && <p className='fielderror'>{errors.additionalAuditors.message}</p>}
                            </div>
                          </div>
                        </div>
                        <div className='section'>
                          <label className='sectiontitle'>Audit Requirements</label>
                          <div className='sectionrow'>
                            <div className="fieldboxthird">
                              <label>Expected Start Date<label style={{ color: 'red' }}>*</label></label>
                              <input className='datefield'
                                {...register("StartDate", {
                                  required: 'Expected Start Date is required'
                                })}
                                type="date"
                                placeholder="Expected Start Date"
                                id='StartDate'
                              />
                              {errors.StartDate && <p className='fielderror'>{errors.StartDate.message}</p>}
                            </div>
                            <div className="fieldboxthird">
                              <label>Expected Completion Date<label style={{ color: 'red' }}>*</label></label>
                              <input className='datefield'
                                {...register("ExpCompDate", {
                                  required: 'Expected Completion Date is required'
                                })}
                                type="date"
                                placeholder="Expected Completion Date"
                                id='ExpCompDate'
                                min={watch('StartDate') || ''}
                              />
                              {errors.ExpCompDate && <p className='fielderror'>{errors.ExpCompDate.message}</p>}
                            </div>
                            <div className="fieldboxthird">
                              <label>Int/Ext Audit<label style={{ color: 'red' }}>*</label></label>
                              <Controller
                                name="IntExt"
                                control={control}
                                rules={{ required: "Int/Ext Audit is required" }}
                                render={({ field }) => (
                                  <Select
                                    isClearable
                                    options={intExtOptions}
                                    styles={customStyles}
                                    placeholder="Int/Ext Audit"
                                    value={field.value ? intExtOptions.find(i => i.value === field.value) : null}
                                    onChange={(selectedOption) => field.onChange(selectedOption ? selectedOption.value : null)}
                                  />
                                )} />
                              {errors.IntExt && <p className='fielderror'>{errors.IntExt.message}</p>}
                            </div>

                          </div>
                          <div className='sectionrow'>
                            <div className="fieldboxthird">
                              <label>Standard(s)<label style={{ color: 'red' }}>*</label></label>
                              <Controller
                                name="standards"
                                control={control}
                                rules={{ required: "Standard(s) is required" }}
                                render={({ field }) => (
                                  <Select
                                    isClearable
                                    isMulti
                                    options={standardsOptions}
                                    styles={customStyles}
                                    placeholder="Standard(s)"
                                    value={field.value ? standardsOptions.filter(s => field.value.includes(s.value)) : []}
                                    onChange={(selectedOptions) => field.onChange(selectedOptions && selectedOptions.length > 0 ? selectedOptions.map(opt => opt.value) : [])}
                                  />
                                )}
                              />
                              {errors.standards && <p className='fielderror'>{errors.standards.message}</p>}
                            </div>

                            <div className="fieldboxthird">
                              <label>Status<label style={{ color: 'red' }}>*</label></label>
                              <Controller
                                name="status"
                                control={control}
                                rules={{ required: "Status is required" }}
                                render={({ field }) => (
                                  <Select
                                    isClearable
                                    options={statuses}
                                    styles={customStyles}
                                    placeholder="Status"
                                    value={field.value ? statuses.find(s => s.value === field.value) : null}
                                    onChange={(selectedOption) => field.onChange(selectedOption ? selectedOption.value : null)}
                                  />
                                )}
                              />
                              {errors.status && <p className='fielderror'>{errors.status.message}</p>}
                            </div>

                            <div className="fieldboxthird">
                              <label>Function<label style={{ color: 'red' }}>*</label></label>
                              <Controller
                                name="function"
                                control={control}
                                rules={{ required: "Function is required" }}
                                render={({ field }) => (
                                  <Select
                                    isClearable
                                    options={functions}
                                    styles={customStyles}
                                    placeholder="Function"
                                    value={field.value ? functions.find(f => f.value === field.value) : null}
                                    onChange={(selectedOption) => field.onChange(selectedOption ? selectedOption.value : null)}
                                  />
                                )}
                              />
                              {errors.function && <p className='fielderror'>{errors.function.message}</p>}
                            </div>
                          </div>
                        </div>
                        <div className='section'>
                          <div className='sectionrow' style={{ display: 'flex', gap: '20px' }}>
                            {/* Left column - Risk Factor Checkboxes (1/3 width) */}
                            <div style={{ flex: '0 0 30%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <label className='sectiontitle'>Risk Factors</label>
                              {riskFactorsList.map(factor => (
                                <div key={factor.riskfactorid} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <input
                                    type="checkbox"
                                    id={`risk-factor-${factor.riskfactorid}`}
                                    checked={selectedRiskFactors.includes(factor.riskfactorid)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedRiskFactors([...selectedRiskFactors, factor.riskfactorid]);
                                      } else {
                                        setSelectedRiskFactors(selectedRiskFactors.filter(id => id !== factor.riskfactorid));
                                        // Clear ratings for subcategories of this factor
                                        const subcatsToRemove = subcategoriesList
                                          .filter(s => s.riskfactorid === factor.riskfactorid)
                                          .map(s => s.subcategoryid);
                                        const newRatings = { ...riskRatings };
                                        subcatsToRemove.forEach(id => delete newRatings[id]);
                                        setRiskRatings(newRatings);
                                      }
                                    }}
                                    style={{ cursor: 'pointer' }}
                                  />
                                  <label
                                    htmlFor={`risk-factor-${factor.riskfactorid}`}
                                    style={{ cursor: 'pointer', margin: 0 }}
                                  >
                                    {factor.riskfactor}
                                  </label>
                                </div>
                              ))}
                            </div>

                            {/* Right column - Subcategory Dropdowns (2/3 width) */}
                            <div style={{ flex: '0 0 65%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                              <label className='sectiontitle' style={{ marginLeft: '0px' }}>Ratings</label>
                              {selectedRiskFactors.length === 0 ? (
                                <p style={{ color: '#666', fontStyle: 'italic' }}>
                                  Select one or more risk factors to rate their subcategories
                                </p>
                              ) : (
                                selectedRiskFactors.map(factorId => {
                                  const factor = riskFactorsList.find(f => f.riskfactorid === factorId);
                                  const subcategories = subcategoriesList.filter(s => s.riskfactorid === factorId);

                                  return (
                                    <div key={factorId} style={{ marginBottom: '10px' }}>
                                      <h4 style={{ margin: '0 0 10px 0' }}>{factor.riskfactor}</h4>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {subcategories.map(subcat => {
                                          const isChecked = riskRatings[subcat.subcategoryid] !== undefined && riskRatings[subcat.subcategoryid] !== null;

                                          return (
                                            <div key={subcat.subcategoryid} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                              <input
                                                type="checkbox"
                                                id={`subcat-${subcat.subcategoryid}`}
                                                checked={isChecked}
                                                onChange={(e) => {
                                                  if (e.target.checked) {
                                                    // When checked, set to empty string to show dropdown
                                                    setRiskRatings({
                                                      ...riskRatings,
                                                      [subcat.subcategoryid]: ''
                                                    });
                                                  } else {
                                                    // When unchecked, remove from ratings
                                                    const newRatings = { ...riskRatings };
                                                    delete newRatings[subcat.subcategoryid];
                                                    setRiskRatings(newRatings);
                                                  }
                                                }}
                                                style={{ cursor: 'pointer' }}
                                              />
                                              <label
                                                htmlFor={`subcat-${subcat.subcategoryid}`}
                                                style={{ flex: '1', margin: 0, cursor: 'pointer' }}
                                              >
                                                {subcat.subcategory}
                                              </label>
                                              {isChecked && (
                                                <div style={{ display: 'flex', flexDirection: 'column', minWidth: '200px' }}>
                                                  <label style={{ fontSize: '0.85em', marginBottom: '3px' }}>
                                                    Rating<span style={{ color: 'red' }}>*</span>
                                                  </label>
                                                  <Select
                                                    value={riskRatings[subcat.subcategoryid] ?
                                                      { value: riskRatings[subcat.subcategoryid], label: riskRatings[subcat.subcategoryid] === 1 ? 'Low Risk' : riskRatings[subcat.subcategoryid] === 2 ? 'Medium Risk' : 'High Risk' }
                                                      : null}
                                                    onChange={(selectedOption) => {
                                                      setRiskRatings({
                                                        ...riskRatings,
                                                        [subcat.subcategoryid]: selectedOption ? selectedOption.value : ''
                                                      });
                                                    }}
                                                    options={[
                                                      { value: 1, label: 'Low Risk' },
                                                      { value: 2, label: 'Medium Risk' },
                                                      { value: 3, label: 'High Risk' }
                                                    ]}
                                                    styles={customStyles}
                                                    placeholder="Select Rating"
                                                    isClearable
                                                  />
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>
                        <div className='section'>
                          <label className='sectiontitle' htmlFor="comment">Comment</label>
                          <div className='sectionrow'>
                            <div className="fieldboxwhole">
                              <textarea
                                {...register("comment")}
                                style={{ width: '100%', height: '100px', resize: 'vertical' }}
                                id='comment'
                                className='textfield'
                              />
                            </div>
                          </div>
                        </div>
                        {submitted ? (
                          <>
                            <div style={{
                              width: '100%',
                              backgroundColor: '#d4edda',
                              border: '1px solid #28a745',
                              borderRadius: '4px',
                              padding: '15px',
                              marginTop: '10px',
                              textAlign: 'center'
                            }}>
                              <p style={{ margin: 0, color: '#155724', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                Submitted! Your ScheduleID is {submittedScheduleId}. Please record this for easy access.
                              </p>
                            </div>
                            <div style={{
                              width: '100%',
                              display: 'flex',
                              justifyContent: 'space-between',
                              boxSizing: 'border-box',
                              padding: '2px',
                              marginTop: '10px'
                            }}>
                              <button
                                type="button"
                                onClick={() => navigate(`/entry?type=planning&audit=${submittedScheduleId}`)}
                                className='button'
                                style={{ backgroundColor: 'blue', width: '48%' }}
                              >
                                Proceed to Planning →
                              </button>
                              <button
                                type="button"
                                onClick={handleReset}
                                className='button'
                                style={{ backgroundColor: 'white', color: 'black', border: '1px solid black', width: '48%' }}
                              >
                                Reset Form
                              </button>
                            </div>
                          </>
                        ) : (
                          <div style={{
                            width: '100%', display: 'flex', justifyContent: 'space-between', boxSizing: 'border-box',
                            padding: '2px', marginTop: '10px'
                          }}>
                            <button type="submit" disabled={isSubmitting} className='button' style={{ backgroundColor: 'green', width: '32%' }}>
                              {isSubmitting ? "Submitting..." : "Submit"}
                            </button>
                            <button type="button" onClick={handleExport} disabled={isSubmitting} className='button' style={{ backgroundColor: 'blue', width: '32%' }}>
                              Export(.xlsx)
                            </button>
                            <button type="button" onClick={handleReset} disabled={isSubmitting} className='button' style={{ backgroundColor: 'white', color: 'black', border: '1px solid black', width: '32%' }}>
                              {mode === 'New' ? 'Clear' : 'Reset'}
                            </button>
                          </div>
                        )}
                      </>
                    ) :
                    (<>
                      <h2 style={{ marginTop: '30px', marginBottom: '20px', color: '#d32f2f' }}>
                        This audit has been submitted for final approval and cannot be edited.
                      </h2>
                      <button
                        type="button"
                        onClick={unlockAudit}
                        style={{
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          padding: '12px 24px',
                          fontSize: '16px',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          fontWeight: 'bold',
                          marginBottom: '10px'
                        }}
                      >
                        Undo Submission
                      </button>
                      <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                        Note: Undoing submission will revoke approvers' ability to approve the audit and clear previous approvals.
                      </p>
                    </>
                    )

                  }
                </>
              )}
            </>}

          </ form>
        </>
      }
    </>
  )
}

export default Schedule
