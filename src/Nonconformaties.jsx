import { React, useEffect, useMemo, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import Select from "react-select"
import { Box, Typography } from '@mui/material';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
  getSeverities,
  getRoster,
  getCurrentUser
} from './assets/data/apiData';


function Nonconformities({ selectedAuditId, allAudits = [] }) {

  const [userInfo, setUserInfo] = useState(null);

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
  const [severitiesList, setSeveritiesList] = useState([]);
  const [rosterList, setRosterList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load all lookup data from API on mount
  useEffect(() => {
    async function loadLookupData() {
      try {
        const userData = await getCurrentUser();
        setUserInfo(userData?.name && userData.name !== 'User' ? userData : null);
        const [programs, divisions, sectors, sites, businessUnits, operatingUnits, auditors, auditTypes, statuses, functions, intExt, standards, severities, roster] = await Promise.all([
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
          getSeverities(),
          getRoster()
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
        setSeveritiesList(severities);
        setRosterList(roster);
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

  const normalizeIdArray = (value) => {
    if (Array.isArray(value)) return value;
    if (value === null || value === undefined) return [];
    return [value];
  };

  // Helper function to get division name(s) from divisionId(s)
  const getDivisionName = (divisionId) => {
    const ids = normalizeIdArray(divisionId);
    if (ids.length === 0) return '';
    return ids
      .map(id => {
        const division = divisionsList.find(d => d.divisionId === id);
        return division ? division.divisionName : id;
      })
      .join('; ');
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

  // Helper function to get function name(s) from functionId(s)
  const getFunctionName = (functionId) => {
    const ids = normalizeIdArray(functionId);
    if (ids.length === 0) return '';
    return ids
      .map(id => {
        const func = functionsList.find(f => f.functionId === id);
        return func ? func.functionName : id;
      })
      .join('; ');
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

  const getQuestionTypeLabel = (typeValue) => {
    if (!typeValue && typeValue !== 0) return 'No response provided';
    if (typeValue === 'PEQ' || typeValue === 'ETQ') return typeValue;
    const parsed = Number(typeValue);
    if (Number.isFinite(parsed)) {
      const standard = standardsList.find((s) => s.standardId === parsed);
      return standard ? standard.standardName : `Standard ${parsed}`;
    }
    return typeValue;
  };

  const [selectedAudit, setSelectedAudit] = useState(null);
  const [rowSelectionModel, setRowSelectionModel] = useState({
    type: 'include',
    ids: new Set()
  });
  const entryAudits = useMemo(() => {
    return allAudits.filter((audit) => Number(audit?.stage) !== -1);
  }, [allAudits]);
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
  const [schedule, setSchedule] = useState(null);
  const [locked, setLocked] = useState(false);
  const [newCARs, setNewCARs] = useState([]);
  const [carCounter, setCarCounter] = useState(0);
  const [loadedAuditData, setLoadedAuditData] = useState(null);
  const [loadedCARs, setLoadedCARs] = useState([]);
  const [nonconformances, setNonconformances] = useState([]);

  // Find selected audit from URL or from user selection
  useEffect(() => {
    if (selectedAuditId && entryAudits.length > 0) {
      const audit = entryAudits.find(a => a.scheduleId === selectedAuditId);
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
  }, [selectedAuditId, entryAudits]);

  const { register, handleSubmit,
    setError,
    formState: { errors, isSubmitting },
    control,
    getValues,
    reset,
    clearErrors,
    setValue,
    watch
  } = useForm(
    {
      defaultValues: {}
    }
  )

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10
  });

  const columns = useMemo(() => [
    { field: 'scheduleId', headerName: 'Schedule ID', width: 150 },
    { field: 'title', headerName: 'Title', width: 300 },
    { field: 'leadAuditor', headerName: 'Lead Auditor', width: 150 },
    { field: 'division', headerName: 'Division', width: 150 },
    { field: 'programs', headerName: 'Program(s)', width: 150 },
  ], []);

  const sortedAudits = useMemo(() => {
    return [...entryAudits].sort((a, b) => Number(b.scheduleId) - Number(a.scheduleId));
  }, [entryAudits]);

  const schedules = sortedAudits.map(audit => ({
    id: audit.scheduleId,
    scheduleId: audit.scheduleId,
    title: audit.title,
    leadAuditor: getLeadAuditorName(audit.leadAuditorId),
    division: getDivisionName(audit.divisionId),
    programs: getProgramNames(audit.programIds)
  }));

  // Map nonconformances from API to display format
  const nonconformaties = nonconformances
    .filter(nc => nc.findingType === 1) // Only show actual nonconformities (findingType = 1)
    .map((nc, idx) => ({
      id: idx + 1,
      NCID: nc.ncId,
      Question: nc.question,
      Type: getQuestionTypeLabel(nc.type),
      Severity: 'N/A'
    }));

  const standardBasedGroups = useMemo(() => {
    const standardNcs = nonconformaties
      .filter((nc) => nc.Type !== 'PEQ' && nc.Type !== 'ETQ')
      .slice()
      .sort((a, b) => {
        const labelA = getQuestionTypeLabel(a.Type);
        const labelB = getQuestionTypeLabel(b.Type);
        if (labelA !== labelB) {
          return (labelA || '').localeCompare(labelB || '');
        }
        const sectionA = Number(a.Section ?? a.section ?? 0);
        const sectionB = Number(b.Section ?? b.section ?? 0);
        if (sectionA !== sectionB) return sectionA - sectionB;
        const subA = Number(a.Subsection ?? a.subsection ?? 0);
        const subB = Number(b.Subsection ?? b.subsection ?? 0);
        if (subA !== subB) return subA - subB;
        return Number(a.NCID ?? 0) - Number(b.NCID ?? 0);
      });

    const grouped = new Map();
    standardNcs.forEach((nc) => {
      const label = getQuestionTypeLabel(nc.Type) || 'Standard';
      if (!grouped.has(label)) {
        grouped.set(label, []);
      }
      grouped.get(label).push(nc);
    });

    return Array.from(grouped.entries()).map(([label, items]) => ({
      label,
      items
    }));
  }, [nonconformaties, standardsList]);

  const severityOptions = useMemo(() => {
    return [...severitiesList]
      .sort((a, b) => (a.severityId ?? 0) - (b.severityId ?? 0))
      .map(severity => ({
        value: severity.severityId,
        label: severity.severity
      }));
  }, [severitiesList]);

  // Generate options from API data
  const reviewerOptions = useMemo(() => {
    return [...rosterList]
      .sort((a, b) => (a.rosterName || '').localeCompare(b.rosterName || ''))
      .map(person => ({
        value: person.myId,
        label: person.rosterName
      }));
  }, [rosterList]);

  const approverOptions = useMemo(() => {
    return [...rosterList]
      .sort((a, b) => (a.rosterName || '').localeCompare(b.rosterName || ''))
      .map(person => ({
        value: person.myId,
        label: person.rosterName
      }));
  }, [rosterList]);

  const leadAuditorOptions = useMemo(() => {
    return [...auditorsList]
      .sort((a, b) => (a.auditorName || '').localeCompare(b.auditorName || ''))
      .map(auditor => ({
        value: auditor.auditorId,
        label: auditor.auditorName
      }));
  }, [auditorsList]);

  const additionalApproversOptions = useMemo(() => {
    return [...rosterList]
      .sort((a, b) => (a.rosterName || '').localeCompare(b.rosterName || ''))
      .map(person => ({
        value: person.myId,
        label: person.rosterName
      }));
  }, [rosterList]);

  function addCAR() {
    const newCarId = carCounter;
    setNewCARs([...newCARs, newCarId]);
    setCarCounter(carCounter + 1);
  }

  function deleteCAR(carId) {
    setNewCARs(newCARs.filter(id => id !== carId));
  }

  useEffect(() => {
    async function loadAuditData() {
      if (schedule?.scheduleId) {
        try {
          // First reset the form to clear all previous data
          reset();
          setNewCARs([]);
          setCarCounter(0);

          // Fetch audit data
          const auditResponse = await fetch(`http://localhost:3001/api/audits/${schedule.scheduleId}`);
          const auditData = await auditResponse.json();
          setLoadedAuditData(auditData);

          // Fetch CARs for this audit
          const carsResponse = await fetch(`http://localhost:3001/api/cars/${schedule.scheduleId}`);
          const carsData = await carsResponse.json();
          setLoadedCARs(carsData);

          // Fetch nonconformances for this audit
          const ncResponse = await fetch(`http://localhost:3001/api/nonconformances/${schedule.scheduleId}`);
          const ncData = await ncResponse.json();
          setNonconformances(ncData);

          // Populate nonconformance form fields
          ncData.forEach(nc => {
            if (nc.details) setValue(`ncDetails${nc.ncId}`, nc.details);
            if (nc.severity) setValue(`ncSeverity${nc.ncId}`, nc.severity);
            if (nc.ncDetails) setValue(`ncNCDetails${nc.ncId}`, nc.ncDetails);
            if (nc.AIN) setValue(`ncActionItemNumber${nc.ncId}`, nc.AIN);
          });

          // Populate form with saved data
          if (auditData.auditorstime !== null && auditData.auditorstime !== undefined) {
            setValue('auditorsTime', auditData.auditorstime);
          }
          if (auditData.previouscarseffective !== null && auditData.previouscarseffective !== undefined) {
            setValue('carEffective', String(auditData.previouscarseffective));
          }
          if (auditData.approver !== null && auditData.approver !== undefined) {
            setValue('approver', auditData.approver);
          }
          if (auditData.leadAuditorId !== null && auditData.leadAuditorId !== undefined) {
            setValue('leadAuditor', auditData.leadAuditorId);
          }
          const existingAdditionalApprovers = Array.isArray(auditData.additionalApprovers)
            ? auditData.additionalApprovers
            : [];
          if (existingAdditionalApprovers.length > 0) {
            setValue('additionalApprovers', existingAdditionalApprovers);
          } else {
            setValue('additionalApprovers', []);
          }

          // Populate CARs
          if (carsData && carsData.length > 0) {
            const carIds = [];
            carsData.forEach((car, idx) => {
              const carId = idx;
              carIds.push(carId);
              setValue(`car${carId}`, car.car);
              setValue(`carReviewer${carId}`, car.reviewer);
            });
            setNewCARs(carIds);
            setCarCounter(carsData.length);
          }
        } catch (error) {
          console.error('Error loading audit data:', error);
        }
      } else {
        reset();
        setNewCARs([]);
        setCarCounter(0);
        setLoadedAuditData(null);
        setLoadedCARs([]);
        setNonconformances([]);
      }
    }
    loadAuditData();
  }, [schedule, setValue, reset]);

  async function onSubmit(data, lockedValue = false) {
    try {
      if (!selectedAudit?.scheduleId) {
        throw new Error('No audit selected');
      }

      // Prepare audit data update
      const auditUpdate = {
        scheduleId: selectedAudit.scheduleId,
        auditorsTime: data.auditorsTime ? parseInt(data.auditorsTime) : null,
        previousCarsEffective: data.carEffective ? parseInt(data.carEffective) : null,
        approver: data.approver || null,
        leadAuditor: data.leadAuditor || null,
        additionalApprovers: data.additionalApprovers || [],
        locked: lockedValue ? 1 : 0,
        stage: 4
      };

      // Prepare CARs data
      const carsData = newCARs.map(carId => ({
        scheduleId: selectedAudit.scheduleId,
        car: data[`car${carId}`] || '',
        reviewer: data[`carReviewer${carId}`] || null
      })).filter(car => car.car); // Only include CARs with actual data

      // Prepare nonconformance updates
      const ncUpdates = nonconformances.map(nc => ({
        ncId: nc.ncId,
        details: data[`ncDetails${nc.ncId}`] || '',
        severity: data[`ncSeverity${nc.ncId}`] || null,
        ncDetails: data[`ncNCDetails${nc.ncId}`] || '',
        actionItemNumber: data[`ncActionItemNumber${nc.ncId}`] || ''
      }));

      console.log('Submitting audit data:', auditUpdate);
      console.log('Submitting CARs data:', carsData);
      console.log('Submitting nonconformance updates:', ncUpdates);

      // Save to database
      const response = await fetch('http://localhost:3001/api/save-nonconformities-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audit: auditUpdate,
          cars: carsData
        })
      });

      const result = await response.json();
      console.log('Server response:', result);

      if (result.success) {
        // Update nonconformance details
        for (const ncUpdate of ncUpdates) {
          const ncResponse = await fetch('http://localhost:3001/api/update-nonconformance-details', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(ncUpdate)
          });
          const ncResult = await ncResponse.json();
          if (!ncResult.success) {
            console.error('Failed to update nonconformance:', ncUpdate.ncId, ncResult.error);
          }
        }

        toast.success(lockedValue ? 'Nonconformities submitted successfully!' : 'Changes saved successfully!');

        // Reload the audit data to refresh the form
        const auditResponse = await fetch(`http://localhost:3001/api/audits/${selectedAudit.scheduleId}`);
        const auditData = await auditResponse.json();
        setLoadedAuditData(auditData);

        const carsResponse = await fetch(`http://localhost:3001/api/cars/${selectedAudit.scheduleId}`);
        const carsDataReloaded = await carsResponse.json();
        setLoadedCARs(carsDataReloaded);
      } else {
        throw new Error(result.error || 'Failed to save data');
      }
    }
    catch (error) {
      setError("root",
        { message: error.message }
      )
    }
  }

  const handleSaveWithoutSubmitting = async () => {
    clearErrors();
    const data = getValues();
    await onSubmit(data, false);
  };

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
        // Reload the audit data to reflect the change
        const auditResponse = await fetch(`http://localhost:3001/api/audits/${schedule.scheduleId}`);
        const auditData = await auditResponse.json();
        setLoadedAuditData(auditData);
      } else {
        throw new Error(result.error || 'Failed to unlock audit');
      }
    } catch (error) {
      toast.error('Failed to unlock audit: ' + error.message);
    }
  }

  function handleReset() {
    if (loadedAuditData && schedule?.scheduleId) {
      // Restore form to saved state
      if (loadedAuditData.auditorstime !== null && loadedAuditData.auditorstime !== undefined) {
        setValue('auditorsTime', loadedAuditData.auditorstime);
      } else {
        setValue('auditorsTime', '');
      }

      if (loadedAuditData.previouscarseffective !== null && loadedAuditData.previouscarseffective !== undefined) {
        setValue('carEffective', String(loadedAuditData.previouscarseffective));
      } else {
        setValue('carEffective', '');
      }

      if (loadedAuditData.approver !== null && loadedAuditData.approver !== undefined) {
        setValue('approver', loadedAuditData.approver);
      } else {
        setValue('approver', null);
      }

      if (loadedAuditData.leadAuditorId !== null && loadedAuditData.leadAuditorId !== undefined) {
        setValue('leadAuditor', loadedAuditData.leadAuditorId);
      } else {
        setValue('leadAuditor', null);
      }

      const existingAdditionalApprovers = Array.isArray(loadedAuditData.additionalApprovers)
        ? loadedAuditData.additionalApprovers
        : [];
      if (existingAdditionalApprovers.length > 0) {
        setValue('additionalApprovers', existingAdditionalApprovers);
      } else {
        setValue('additionalApprovers', []);
      }

      // Restore CARs
      if (loadedCARs && loadedCARs.length > 0) {
        const carIds = [];
        loadedCARs.forEach((car, idx) => {
          const carId = idx;
          carIds.push(carId);
          setValue(`car${carId}`, car.car);
          setValue(`carReviewer${carId}`, car.reviewer);
        });
        setNewCARs(carIds);
        setCarCounter(loadedCARs.length);
      } else {
        setNewCARs([]);
        setCarCounter(0);
      }

      // Restore nonconformance fields
      nonconformances.forEach(nc => {
        setValue(`ncDetails${nc.ncId}`, nc.details || '');
        setValue(`ncSeverity${nc.ncId}`, nc.severity || null);
        setValue(`ncNCDetails${nc.ncId}`, nc.ncDetails || '');
        setValue(`ncActionItemNumber${nc.ncId}`, nc.AIN || '');
      });
    } else {
      // No saved state, clear everything
      reset();
      setNewCARs([]);
      setCarCounter(0);
    }
  }

  const stageGateMessage = (() => {
    if (!loadedAuditData || loadedAuditData.locked === 1) return null;
    const stage = Number(loadedAuditData.stage);
    if (Number.isNaN(stage)) return null;
    if (stage < 3) {
      const scheduleId = loadedAuditData.scheduleId ?? loadedAuditData.scheduleid ?? 'Unknown';
      return {
        title: `Audit ${scheduleId} is not ready for Nonconformaties yet.`,
        note: 'Please complete ' + (stage === 1 ? 'Planning' : stage === 2 ? 'Conduct Audit' : 'previous steps') + ' before entering findings.'
      };
    }
    return null;
  })();

  if (loading) {
    return <div className="entry-message">Loading nonconformaties data...</div>;
  }

  return (
    <>
      <div style={{ width: '100%', textAlign: 'left' }}>
        <h1>Enter Nonconformaties</h1>
        {userInfo?.name && (
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
        )}
        <h4 style={{ marginBottom: 0 }}>Use the checkboxes on the left side of the table below to select your audit.</h4>
      </div>
      {/* If the page has encountered an error not tied to a field display it instead of the form */}
      {errors.root ? <p className='error'>{errors.root.message}</p> :
        <>
          {/* Form that has certain built in properties like submit and reset */}
          <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
            <Box sx={{ height: 400, width: '100%', marginTop: '10px' }}>
              <DataGrid
                key={selectedAuditId || 'no-selection'}
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
                    setSchedule(selectedSchedule);
                    setSelectedAudit(selectedSchedule);
                  } else {
                    //No row selected, clearing schedule
                    setSchedule(null);
                    setSelectedAudit(null);
                  }
                }}
                //sx is used to style MUI components; the & symbol targets nested elements; the rows of the grid are called MuiDataGrid-rows;
                sx={{ // We set the style to a function that checks the theme mode and applies different background colors for light and dark modes
                  '& .MuiDataGrid-row': { //Greys come from mui; maybe replace with custom colors later
                    bgcolor: (theme) => theme.palette.mode === 'light' ? grey[200] : grey[900],
                  },
                }}
              />

            </Box>
            {schedule && loadedAuditData?.locked === 1 ?
              (
                <>
                  <h2 style={{ marginTop: '30px', marginBottom: '20px', color: '#d32f2f' }}>
                    Audit {loadedAuditData.scheduleid} has been submitted for final approval and cannot be edited.
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
              ) : stageGateMessage ? (
                <>
                  <h2 style={{ marginTop: '30px', marginBottom: '20px', color: '#d32f2f' }}>
                    {stageGateMessage.title}
                  </h2>
                  <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                    {stageGateMessage.note}
                  </p>
                </>
              ) : schedule ? (
                <>
                  <h2 style={{ marginTop: '5px' }}>Currently Entering Nonconformaties for Schedule: {schedule.scheduleId}</h2>
                  <div className='section'>
                    <label className='sectiontitle'>Overview</label>
                    <div className='sectionrow'>
                      <div className="fieldboxwhole">
                        <label>Auditor's Time</label>
                        <input
                          type="number"
                          {...register("auditorsTime", {
                            validate: {
                              isInteger: (value) => {
                                if (value === '' || value === null) return true; // Allow empty
                                return Number.isInteger(Number(value)) || "Please enter a whole number";
                              },
                              isNonNegative: (value) => {
                                if (value === '' || value === null) return true; // Allow empty
                                return Number(value) >= 0 || "Please enter a non-negative number";
                              }
                            }
                          })}
                          id='auditorsTime'
                          className='textfield'
                          placeholder='Enter a whole number here'
                          min="0"
                          step="1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* PEQs */}
                  {nonconformaties.filter(nc => nc.Type === 'PEQ').length > 0 && (
                    <>
                      <h3 className='sectiontitle'>Process Evaluation Responses</h3>
                      {nonconformaties.filter(nc => nc.Type === 'PEQ').map((nc, index) => (
                        <div className='section' key={nc.NCID}>
                          <div className='sectionrow'>
                            <div className="fieldboxwhole">
                              <h4 style={{ margin: '0 0 10px 0' }}>{nc.Question}</h4>
                            </div>
                          </div>
                          <div className='sectionrow'>
                            <div className="fieldboxwhole">
                              <label>Details</label>
                              <textarea
                                {...register(`ncDetails${nc.NCID}`)}
                                style={{ width: '100%', height: '100px', resize: 'vertical' }}
                                id={`ncDetails${nc.NCID}`}
                                className='textfield'
                              />
                            </div>
                          </div>
                          <div className='sectionrow'>
                            <div className="fieldboxthird">
                              <label>Severity</label>
                              <Controller
                                name={`ncSeverity${nc.NCID}`}
                                control={control}
                                render={({ field }) => (
                                  <Select
                                    isClearable
                                    options={severityOptions}
                                    styles={customStyles}
                                    placeholder="Severity"
                                    value={severityOptions.find(s => s.value === field.value) || null}
                                    onChange={(selectedOption) => field.onChange(selectedOption ? selectedOption.value : null)}
                                  />
                                )}
                              />
                            </div>
                            <div className="fieldboxthird">
                              <label>NC Details</label>
                              <input
                                type="text"
                                {...register(`ncNCDetails${nc.NCID}`)}
                                id={`ncNCDetails${nc.NCID}`}
                                className='textfield'
                              />
                            </div>
                            <div className="fieldboxthird">
                              <label>Action Item Number</label>
                              <input
                                type="text"
                                {...register(`ncActionItemNumber${nc.NCID}`)}
                                id={`ncActionItemNumber${nc.NCID}`}
                                className='textfield'
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {/* ETQs */}
                  {nonconformaties.filter(nc => nc.Type === 'ETQ').length > 0 && (
                    <>
                      <h3 className='sectiontitle'>Every Time Question Responses</h3>
                      {nonconformaties.filter(nc => nc.Type === 'ETQ').map((nc, index) => (
                        <div className='section' key={nc.NCID}>
                          <div className='sectionrow'>
                            <div className="fieldboxwhole">
                              <h4 style={{ margin: '0 0 10px 0' }}>{nc.Question}</h4>
                            </div>
                          </div>
                          <div className='sectionrow'>
                            <div className="fieldboxwhole">
                              <label>Details</label>
                              <textarea
                                {...register(`ncDetails${nc.NCID}`)}
                                style={{ width: '100%', height: '100px', resize: 'vertical' }}
                                id={`ncDetails${nc.NCID}`}
                                className='textfield'
                              />
                            </div>
                          </div>
                          <div className='sectionrow'>
                            <div className="fieldboxthird">
                              <label>Severity</label>
                              <Controller
                                name={`ncSeverity${nc.NCID}`}
                                control={control}
                                render={({ field }) => (
                                  <Select
                                    isClearable
                                    options={severityOptions}
                                    styles={customStyles}
                                    placeholder="Severity"
                                    value={severityOptions.find(s => s.value === field.value) || null}
                                    onChange={(selectedOption) => field.onChange(selectedOption ? selectedOption.value : null)}
                                  />
                                )}
                              />
                            </div>
                            <div className="fieldboxthird">
                              <label>NC Details</label>
                              <input
                                type="text"
                                {...register(`ncNCDetails${nc.NCID}`)}
                                id={`ncNCDetails${nc.NCID}`}
                                className='textfield'
                              />
                            </div>
                            <div className="fieldboxthird">
                              <label>Action Item Number</label>
                              <input
                                type="text"
                                {...register(`ncActionItemNumber${nc.NCID}`)}
                                id={`ncActionItemNumber${nc.NCID}`}
                                className='textfield'
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}


                  {/* Standard-based Questions */}
                  {standardBasedGroups.length > 0 && (
                    <>
                      <h3 className='sectiontitle'>{selectedAudit?.standardIds ? getStandardNames(selectedAudit.standardIds).split(', ').join('; ') + ' Responses' : 'Standard Responses'}</h3>
                      {standardBasedGroups.map((group) => (
                        <div key={group.label}>
                          <h4 style={{ margin: '12px 0 6px', fontSize: '0.95rem', fontWeight: 600 }}>{group.label}</h4>
                          {group.items.map((nc) => (
                            <div className='section' key={nc.NCID}>
                              <div className='sectionrow'>
                                <div className="fieldboxwhole">
                                  <div style={{ margin: '0 0 10px 0' }}>
                                    <ReactMarkdown>{nc.Question || ''}</ReactMarkdown>
                                  </div>
                                </div>
                              </div>
                              <div className='sectionrow'>
                                <div className="fieldboxwhole">
                                  <label>Details</label>
                                  <textarea
                                    {...register(`ncDetails${nc.NCID}`)}
                                    style={{ width: '100%', height: '100px', resize: 'vertical' }}
                                    id={`ncDetails${nc.NCID}`}
                                    className='textfield'
                                  />
                                </div>
                              </div>
                              <div className='sectionrow'>
                                <div className="fieldboxthird">
                                  <label>Severity</label>
                                  <Controller
                                    name={`ncSeverity${nc.NCID}`}
                                    control={control}
                                    render={({ field }) => (
                                      <Select
                                        isClearable
                                        options={severityOptions}
                                        styles={customStyles}
                                        placeholder="Severity"
                                        value={severityOptions.find(s => s.value === field.value) || null}
                                        onChange={(selectedOption) => field.onChange(selectedOption ? selectedOption.value : null)}
                                      />
                                    )}
                                  />
                                </div>
                                <div className="fieldboxthird">
                                  <label>NC Details</label>
                                  <input
                                    type="text"
                                    {...register(`ncNCDetails${nc.NCID}`)}
                                    id={`ncNCDetails${nc.NCID}`}
                                    className='textfield'
                                  />
                                </div>
                                <div className="fieldboxthird">
                                  <label>Action Item Number</label>
                                  <input
                                    type="text"
                                    {...register(`ncActionItemNumber${nc.NCID}`)}
                                    id={`ncActionItemNumber${nc.NCID}`}
                                    className='textfield'
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </>
                  )}

                  <div className='section'>
                    <label className='sectiontitle'>CARs</label>
                    <label>Previous CARs</label>
                    <div className='sectionrow' style={{ flexDirection: 'column' }}>
                      <button type='button' onClick={addCAR} className='button' style={{ backgroundColor: 'white', color: 'black', border: '1px solid black' }}>Add New</button>
                    </div>
                    {newCARs.map((carId, index) => (
                      <div className='sectionrow' key={carId} style={{ border: '1px solid #ccc', borderRadius: '8px', marginBottom: '10px', padding: '10px', boxSizing: 'border-box' }}>
                        <div className="fieldboxthird">
                          <label>CAR {index + 1}</label>
                          <input
                            type="text"
                            {...register(`car${carId}`)}
                            id={`car${carId}`}
                            className='textfield'
                          />
                        </div>
                        <div className="fieldboxthird">
                          <label>Reviewer</label>
                          <Controller
                            name={`carReviewer${carId}`}
                            control={control}
                            render={({ field }) => (
                              <Select
                                isClearable
                                options={reviewerOptions}
                                styles={customStyles}
                                placeholder="Reviewer"
                                value={reviewerOptions.find(r => r.value === field.value) || null}
                                onChange={(selectedOption) => field.onChange(selectedOption ? selectedOption.value : null)}
                              />
                            )}
                          />
                        </div>
                        <div className="fieldboxthird">
                          <button type='button' onClick={() => deleteCAR(carId)} className='button' style={{ backgroundColor: 'red', marginTop: '20px', width: 'auto', padding: '8px 16px' }}>
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className='sectionrow'>
                      <div className="fieldboxwhole">
                        <label>Was previous CAR(s) deemed effective?</label>
                        <Controller
                          name="carEffective"
                          control={control}
                          render={({ field }) => (
                            <ToggleButtonGroup
                              {...field}
                              exclusive
                              onChange={(event, newValue) => {
                                if (newValue !== null) {
                                  field.onChange(newValue);
                                }
                              }}
                            >
                              <ToggleButton value="0" sx={{ textTransform: 'none' }}>
                                Yes
                              </ToggleButton>
                              <ToggleButton value="1" sx={{ textTransform: 'none' }}>
                                No
                              </ToggleButton>
                              <ToggleButton value="2" sx={{ textTransform: 'none' }}>
                                Unknown
                              </ToggleButton>
                            </ToggleButtonGroup>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div className='section'>
                    <label className='sectiontitle'>Approvers</label>
                    <div className='sectionrow'>
                      <div className="fieldboxthird">
                        <label>Approver<label style={{ color: 'red' }}>*</label></label>
                        <Controller
                          name="approver"
                          control={control}
                          rules={{ required: "Approver is required" }}
                          render={({ field }) => (
                            <Select
                              isClearable
                              options={approverOptions}
                              styles={customStyles}
                              placeholder="Approver"
                              value={approverOptions.find(a => a.value === field.value) || null}
                              onChange={(selectedOption) => field.onChange(selectedOption ? selectedOption.value : null)}
                            />
                          )}
                        />
                        {errors.approver && <p className='fielderror'>{errors.approver.message}</p>}
                      </div>
                      <div className="fieldboxthird">
                        <label>Lead Auditor<label style={{ color: 'red' }}>*</label></label>
                        <Controller
                          name="leadAuditor"
                          control={control}
                          rules={{ required: "Lead Auditor is required" }}
                          render={({ field }) => (
                            <Select
                              isClearable
                              options={leadAuditorOptions}
                              styles={customStyles}
                              placeholder="Lead Auditor"
                              value={leadAuditorOptions.find(l => l.value === field.value) || null}
                              onChange={(selectedOption) => field.onChange(selectedOption ? selectedOption.value : null)}
                            />
                          )}
                        />
                        {errors.leadAuditor && <p className='fielderror'>{errors.leadAuditor.message}</p>}
                      </div>
                      <div className="fieldboxthird">
                        <label>Additional Approvers</label>
                        <Controller
                          name="additionalApprovers"
                          control={control}
                          render={({ field }) => (
                            <Select
                              isClearable
                              isMulti
                              options={additionalApproversOptions}
                              styles={customStyles}
                              placeholder="Additional Approvers"
                              value={field.value ? additionalApproversOptions.filter(a => field.value.includes(a.value)) : []}
                              onChange={(selectedOptions) => field.onChange(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{
                    width: '100%', display: 'flex', justifyContent: 'space-between', boxSizing: 'border-box',
                    padding: '2px', marginTop: '10px'
                  }}>
                    <button type="button" disabled={isSubmitting} onClick={handleSubmit((data) => onSubmit(data, true))} className='button' style={{ backgroundColor: 'green', width: '32%' }}>
                      {isSubmitting ? "Submitting..." : "Submit"}
                    </button>
                    <button type="button" disabled={isSubmitting} onClick={handleSaveWithoutSubmitting} className='button' style={{ backgroundColor: 'blue', width: '32%' }}>
                      {isSubmitting ? "Saving..." : "Save Changes Without Submitting"}
                    </button>
                    <button type="button" onClick={handleReset} disabled={isSubmitting} className='button' style={{ backgroundColor: 'white', color: 'black', border: '1px solid black', width: '32%' }}>
                      Reset
                    </button>
                  </div>
                </>
              ) : null}
          </ form>
        </>
      }
    </>
  )
}

export default Nonconformities;
