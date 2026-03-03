import { React, useEffect, useMemo, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import Select from "react-select"
import { Box } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { toast } from 'react-toastify';
import './App.css'
import { grey } from '@mui/material/colors';
import { customStyles } from './Utilities.jsx';
import {
  getPrograms,
  getDivisions,
  getAuditors,
  getSafetyEquipment,
  getTrainingRequirements,
  getRoster,
  getCurrentUser
} from './assets/data/apiData';


function Planning({ selectedAuditId, allAudits = [], reloadAudits }) {

  console.log("Planning component loaded with selectedAuditId:", selectedAuditId);

  const [userInfo, setUserInfo] = useState({ name: 'User', myId: null });

  const [schedule, setSchedule] = useState(null);
  const [auditLocked, setAuditLocked] = useState(false);

  // State for lookup data from API
  const [programsList, setProgramsList] = useState([]);
  const [divisionsList, setDivisionsList] = useState([]);
  const [auditorsList, setAuditorsList] = useState([]);
  const [safetyEquipmentList, setSafetyEquipmentList] = useState([]);
  const [trainingRequirementsList, setTrainingRequirementsList] = useState([]);
  const [rosterList, setRosterList] = useState([]);

  // Load all lookup data from API on mount
  useEffect(() => {
    async function loadLookupData() {
      try {
        const userData = await getCurrentUser();
        if (userData?.name) {
          setUserInfo(userData);
        }
        const [programs, divisions, auditors, safetyEquipment, trainingRequirements, roster] = await Promise.all([
          getPrograms(),
          getDivisions(),
          getAuditors(),
          getSafetyEquipment(),
          getTrainingRequirements(),
          getRoster()
        ]);

        setProgramsList(programs);
        setDivisionsList(divisions);
        setAuditorsList(auditors);
        setSafetyEquipmentList(safetyEquipment);
        setTrainingRequirementsList(trainingRequirements);
        setRosterList(roster);
      } catch (error) {
        console.error('Error loading lookup data:', error);
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

  const getLeadAuditorName = (leadAuditorId) => {
    const auditor = auditorsList.find(a => a.auditorId === leadAuditorId);
    return auditor ? auditor.auditorName : leadAuditorId;
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
    reset,
    setValue,
    watch,
    clearErrors
  } = useForm(
    {
      defaultValues: {}
    }
  )

  // Update form when audit is selected
  useEffect(() => {
    if (schedule && selectedAudit) {
      // Set title if available
      if (selectedAudit.title) {
        setValue('title', selectedAudit.title);
      }
      // Set scope if available
      if (selectedAudit.scope) {
        setValue('scope', selectedAudit.scope);
      } else {
        setValue('scope', '');
      }
      // Set safety if available
      if (selectedAudit.safety !== undefined) {
        setValue('safety', String(selectedAudit.safety));
      }
      // Set clearance if available
      if (selectedAudit.clearance !== undefined) {
        setValue('clearance', String(selectedAudit.clearance));
      }
      // Set safety equipment IDs if available
      if (selectedAudit.safetyEquipmentIds) {
        setValue('safetyEquipmentIds', selectedAudit.safetyEquipmentIds);
      }
      // Set training requirement IDs if available
      if (selectedAudit.trainingRequirementIds) {
        setValue('trainingRequirementIds', selectedAudit.trainingRequirementIds);
      }
      // Set FAMA IDs if available
      if (selectedAudit.famaIds) {
        setValue('fama', selectedAudit.famaIds);
      }
      // Set special considerations if available
      if (selectedAudit.specialConsiderations) {
        setValue('SpecCon', selectedAudit.specialConsiderations);
      } else {
        setValue('SpecCon', '');
      }
      // Clear any validation errors when loading saved data
      clearErrors();

      // Check locked status
      if (selectedAudit?.scheduleId) {
        fetch(`http://localhost:3001/api/audits/${selectedAudit.scheduleId}`)
          .then(res => res.json())
          .then(auditData => setAuditLocked(auditData.locked === 1))
          .catch(err => console.error('Error checking locked status:', err));
      }
    } else {
      // Reset form when no schedule selected
      reset();
      setAuditLocked(false);
    }
  }, [schedule, selectedAudit, setValue, reset, clearErrors]);

  const mode = watch('mode');
  const safety = watch('safety');
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

  const famaOptions = useMemo(() => {
    return [...rosterList]
      .sort((a, b) => (a.rosterName || '').localeCompare(b.rosterName || ''))
      .map(r => ({
        value: r.myId,
        label: r.rosterName
      }));
  }, [rosterList]);

  const safetyEquipmentOptions = useMemo(() => {
    return [...safetyEquipmentList]
      .filter((equipment) => (equipment.active ?? 1) === 1)
      .sort((a, b) => (a.safetyEquipmentName || '').localeCompare(b.safetyEquipmentName || ''))
      .map(se => ({
        value: se.safetyEquipmentId,
        label: se.safetyEquipmentName
      }));
  }, [safetyEquipmentList]);

  const trainingRequirementsOptions = useMemo(() => {
    return [...trainingRequirementsList]
      .filter((requirement) => (requirement.active ?? 1) === 1)
      .sort((a, b) => (a.trainingRequirementName || '').localeCompare(b.trainingRequirementName || ''))
      .map(tr => ({
        value: tr.trainingRequirementId,
        label: tr.trainingRequirementName
      }));
  }, [trainingRequirementsList]);


  async function unlockAudit() {
    try {
      if (!selectedAudit?.scheduleId) {
        throw new Error('No audit selected');
      }

      const response = await fetch('http://localhost:3001/api/unlock-audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduleId: selectedAudit.scheduleId
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Audit unlocked successfully!');
        setAuditLocked(false);
      } else {
        throw new Error(result.error || 'Failed to unlock audit');
      }
    } catch (error) {
      toast.error('Failed to unlock audit: ' + error.message);
    }
  }

  async function onSubmit(data) {
    try {
      if (!selectedAudit?.scheduleId) {
        toast.error('Please select an audit from the table');
        return;
      }

      // Prepare planning data
      const computeStage = (fallbackStage) => {
        const currentStage = selectedAudit?.stage ?? 0;
        return Math.max(currentStage, fallbackStage);
      };

      const planningData = {
        scheduleId: selectedAudit.scheduleId,
        famaIds: data.fama || [],
        safety: parseInt(data.safety),
        clearance: parseInt(data.clearance),
        safetyEquipmentIds: parseInt(data.safety) === 0 ? (data.safetyEquipmentIds || []) : [],
        trainingRequirementIds: data.trainingRequirementIds || [],
        scope: data.scope || '',
        specialConsiderations: data.SpecCon || '',
        stage: computeStage(2),
        targetStage: 2
      };

      console.log("Planning data being sent:", planningData);

      // Update audit in database
      const response = await fetch(`http://localhost:3001/api/audits/${selectedAudit.scheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planningData)
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Submitted!');

        // Reload audit data if reloadAudits function is available
        if (reloadAudits) {
          await new Promise(resolve => setTimeout(resolve, 500));
          await reloadAudits();
        }
      } else {
        throw new Error(result.error || 'Failed to save planning data');
      }
    }
    catch (error) {
      toast.error(`Error: ${error.message}`);
      setError("root",
        { message: error.message }
      )
    }
  }

  function handleReset() {
    if (selectedAudit) {
      // Restore the saved data by re-triggering setSchedule
      setSchedule({
        id: selectedAudit.scheduleId,
        scheduleId: selectedAudit.scheduleId,
        title: selectedAudit.title,
        leadAuditor: getLeadAuditorName(selectedAudit.leadAuditorId),
        division: getDivisionName(selectedAudit.divisionId),
        programs: getProgramNames(selectedAudit.programIds)
      });
      // The useEffect will repopulate the form from selectedAudit
    }
  }

  function onValidationError(errors) {
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

  return (
    <>
      <div style={{ width: '100%', textAlign: 'left' }}>
        <h1>Planning Tool</h1>
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
        <h4 style={{ marginBottom: 0 }}>Use the checkboxes on the left side of the table below to select your audit.</h4>
      </div>
      {/* If the page has encountered an error not tied to a field display it instead of the form */}
      {errors.root ? <p className='error'>{errors.root.message}</p> :
        <>
          {/* Form that has certain built in properties like submit and reset */}
          <form onSubmit={handleSubmit(onSubmit, onValidationError)} style={{ width: '100%' }}>
            <Box sx={{ height: 400, width: '100%', marginTop: '10px' }}>
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
                    // Find the original audit object with full details
                    const originalAudit = entryAudits.find(a => a.scheduleId === scheduleID);
                    setSchedule(selectedSchedule);
                    setSelectedAudit(originalAudit);
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
            {schedule && auditLocked ? (
              <>
                <h2 style={{ marginTop: '30px', marginBottom: '20px', color: '#d32f2f' }}>
                  Audit {schedule.scheduleId} has been submitted for final approval and cannot be edited.
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
            ) : schedule ? (
              <>
                <h2 style={{ marginTop: '5px' }}>Currently Planning Schedule: {schedule.scheduleId}</h2>
                <div className='section'>
                  <div className='sectionrow'>
                    <div className="fieldboxwhole">
                      <label>Functional Area Manager/Auditees<label style={{ color: 'red' }}>*</label></label>
                      <Controller
                        name="fama"
                        control={control}
                        rules={{ required: "Functional Area Manager/Auditees is required" }}
                        render={({ field }) => (
                          <Select
                            isClearable
                            isMulti
                            options={famaOptions}
                            styles={customStyles}
                            placeholder="Functional Area Manager/Auditees"
                            value={field.value ? famaOptions.filter(f => field.value.includes(f.value)) : []}
                            onChange={(selectedOptions) => field.onChange(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                          />
                        )}
                      />
                      {errors.fama && <p className='fielderror'>{errors.fama.message}</p>}
                    </div>
                  </div>
                  <div className='sectionrow'>
                    <div className="fieldboxhalf">
                      <label>Safety Equipment Required?<label style={{ color: 'red' }}>*</label></label>
                      <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <input
                            {...register("safety", { required: "Safety Equipment Required is required" })}
                            type="radio"
                            value={0}
                          />
                          Yes
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <input
                            {...register("safety", { required: "Safety Equipment Required is required" })}
                            type="radio"
                            value={1}
                          />
                          No
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <input
                            {...register("safety", { required: "Safety Equipment Required is required" })}
                            type="radio"
                            value={2}
                          />
                          Unknown
                        </label>
                      </div>
                      {errors.safety && <p className='fielderror'>{errors.safety.message}</p>}
                    </div>

                    <div className="fieldboxhalf">
                      <label>Clearance Required?<label style={{ color: 'red' }}>*</label></label>
                      <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <input
                            {...register("clearance", { required: "Clearance Required is required" })}
                            type="radio"
                            value={0}
                          />
                          Yes
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <input
                            {...register("clearance", { required: "Clearance Required is required" })}
                            type="radio"
                            value={1}
                          />
                          No
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <input
                            {...register("clearance", { required: "Clearance Required is required" })}
                            type="radio"
                            value={2}
                          />
                          Unknown
                        </label>
                      </div>
                      {errors.clearance && <p className='fielderror'>{errors.clearance.message}</p>}
                    </div>
                  </div>
                  {safety === "0" && (
                    <div className='sectionrow'>
                      <div className="fieldboxwhole">
                        <label>Required Equipment<label style={{ color: 'red' }}>*</label></label>
                        <Controller
                          name="safetyEquipmentIds"
                          control={control}
                          rules={{ required: "Required Equipment is required" }}
                          render={({ field }) => (
                            <Select
                              isClearable
                              isMulti
                              options={safetyEquipmentOptions}
                              styles={customStyles}
                              placeholder="Required Equipment"
                              value={field.value ? safetyEquipmentOptions.filter(s => field.value.includes(s.value)) : []}
                              onChange={(selectedOptions) => field.onChange(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                            />
                          )}
                        />
                        {errors.safetyEquipmentIds && <p className='fielderror'>{errors.safetyEquipmentIds.message}</p>}
                      </div>
                    </div>
                  )}
                  <div className='sectionrow'>
                    <div className="fieldboxwhole">
                      <label>Training Requirements</label>
                      <Controller
                        name="trainingRequirementIds"
                        control={control}
                        render={({ field }) => (
                          <Select
                            isClearable
                            isMulti
                            options={trainingRequirementsOptions}
                            styles={customStyles}
                            placeholder="Training Requirements"
                            value={field.value ? trainingRequirementsOptions.filter(tr => field.value.includes(tr.value)) : []}
                            onChange={(selectedOptions) => field.onChange(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                          />
                        )}
                      />
                      {errors.trainingRequirementIds && <p className='fielderror'>{errors.trainingRequirementIds.message}</p>}
                    </div>
                  </div>
                  <div className='sectionrow'>
                    <div className="fieldboxwhole">
                      <label>Scope<label style={{ color: 'red' }}>*</label></label>
                      <textarea
                        {...register("scope", {
                          required: 'Scope is required'
                        })}
                        style={{ width: '100%', height: '100px', resize: 'vertical' }}
                        id='scope'
                        className='textfield'
                      />
                      {errors.scope && <p className='fielderror'>{errors.scope.message}</p>}
                    </div>
                  </div>
                  <div className='sectionrow'>
                    <div className="fieldboxwhole">
                      <label>Special Considerations</label>
                      <textarea
                        {...register("SpecCon")}
                        style={{ width: '100%', height: '100px', resize: 'vertical' }}
                        id='SpecCon'
                        className='textfield'
                      />
                    </div>
                  </div>
                </div>

                <div style={{
                  width: '100%', display: 'flex', justifyContent: 'space-between', boxSizing: 'border-box',
                  padding: '2px', marginTop: '10px'
                }}>
                  <button type="submit" disabled={isSubmitting} className='button' style={{ backgroundColor: 'green' }}>
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </button>
                  <button type="button" onClick={handleReset} disabled={isSubmitting} className='button' style={{ backgroundColor: 'white', color: 'black', border: '1px solid black' }}>
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

export default Planning
