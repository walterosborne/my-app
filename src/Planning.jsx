import { React, useEffect, useMemo, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import Select from "react-select"
import { Box, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import './App.css'
import { grey } from '@mui/material/colors';
import { customStyles } from './Utilities.jsx';
import { programs as programsList } from './assets/data/programs';
import { divisions as divisionsList } from './assets/data/divisions';
import { sectors as sectorsList } from './assets/data/sectors';
import { sites as sitesList } from './assets/data/sites';
import { businessUnits as businessUnitsList } from './assets/data/businessUnits';
import { operatingUnits as operatingUnitsList } from './assets/data/operatingUnits';
import { auditors as auditorsList } from './assets/data/auditors';
import { auditTypes as auditTypesList } from './assets/data/auditTypes';
import { statuses as statusesList } from './assets/data/statuses';
import { functions as functionsList } from './assets/data/functions';
import { intExt as intExtList } from './assets/data/intExt';
import { standards as standardsList } from './assets/data/standards';
import { safetyEquipmentList } from './assets/data/safetyEquipment';
import { trainingRequirementsList } from './assets/data/trainingRequirements';
import { rosterList } from './assets/data/roster';


function Planning({ selectedAuditId, allAudits = [] }) {

  console.log("Planning component loaded with selectedAuditId:", selectedAuditId);

  const userInfo = { name: "Walter Osborne" };

  const [schedule, setSchedule] = useState(null);

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

  // Helper function to get site name from siteId
  const getSiteName = (siteId) => {
    const site = sitesList.find(s => s.siteId === siteId);
    return site ? site.siteName : siteId;
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

  // Find selected audit from URL or from user selection
  useEffect(() => {
    if (selectedAuditId && allAudits.length > 0) {
      const audit = allAudits.find(a => a.scheduleId === selectedAuditId);
      if (audit) {
        setSelectedAudit(audit);
        setRowSelectionModel({
          type: 'include',
          ids: new Set([selectedAuditId])
        });
        // Convert to schedule format that matches DataGrid rows
        const scheduleFormat = {
          id: audit.scheduleId,
          scheduleId: audit.scheduleId,
          title: audit.title,
          leadAuditor: audit.leadAuditor,
          division: getDivisionName(audit.divisionId),
          programs: getProgramNames(audit.programIds)
        };
        setSchedule(scheduleFormat);
      }
    }
  }, [selectedAuditId, allAudits]);

  const { register, handleSubmit,
    setError,
    formState: { errors, isSubmitting },
    control,
    reset,
    setValue,
    watch
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
      }
      // Set safety considerations if available
      if (selectedAudit.safetyConsiderations) {
        setValue('safetyConsiderations', selectedAudit.safetyConsiderations);
      }
      // Set special equipment if available
      if (selectedAudit.specialEquipment) {
        setValue('specialEquipment', selectedAudit.specialEquipment);
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
      }
    } else {
      // Reset form when no schedule selected
      reset();
    }
  }, [schedule, selectedAudit, setValue, reset]);

  const mode = watch('mode');
  const safety = watch('safety');
  const [tableSize, setTableSize] = useState(10)

  const columns = useMemo(() => [
    { field: 'scheduleId', headerName: 'Schedule ID', width: 150 },
    { field: 'title', headerName: 'Title', width: 300 },
    { field: 'leadAuditor', headerName: 'Lead Auditor', width: 150 },
    { field: 'division', headerName: 'Division', width: 150 },
    { field: 'programs', headerName: 'Program(s)', width: 150 },
  ], []);

  const schedules = allAudits.map(audit => ({
    id: audit.scheduleId,
    scheduleId: audit.scheduleId,
    title: audit.title,
    leadAuditor: audit.leadAuditor,
    division: getDivisionName(audit.divisionId),
    programs: getProgramNames(audit.programIds)
  }));

  const famaOptions = rosterList.map(r => ({
    value: r.rosterId,
    label: r.rosterName
  }));

  const safetyEquipmentOptions = safetyEquipmentList.map(se => ({
    value: se.safetyEquipmentId,
    label: se.safetyEquipmentName
  }));

  const trainingRequirementsOptions = trainingRequirementsList.map(tr => ({
    value: tr.trainingRequirementId,
    label: tr.trainingRequirementName
  }));


  async function onSubmit(data) {
    try {
      //Waits 1000 ms to simulate async code
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log(data)
    }
    catch (error) {
      //The root error is a form-level error not tied to a specific field
      setError("root",
        { message: error.message }
      )
    }

  }

  function handleReset() {
    reset();
  }

  return (
    <>
      <div style={{ width: '100%', textAlign: 'left' }}>
        <h1>Planning Tool</h1>
        <h2 style={{ marginTop: '3px' }}>Welcome {userInfo.name}. <a href="mailto:walter.osborne@ngc.com" target='_blank'>Not you?</a></h2>
        <h4 style={{ marginBottom: 0 }}>Use the checkboxes on the left side of the table below to select your audit.</h4>
      </div>
      {/* If the page has encountered an error not tied to a field display it instead of the form */}
      {errors.root ? <p className='error'>{errors.root.message}</p> :
        <>
          {/* Form that has certain built in properties like submit and reset */}
          <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
            <Box sx={{ height: 400, width: '100%', marginTop: '10px' }}>
              <DataGrid
                rows={schedules}
                columns={columns}
                checkboxSelection
                disableMultipleRowSelection
                getRowId={(row) => row.scheduleId}
                rowSelectionModel={rowSelectionModel}
                pageSizeOptions={[5, 10, 20]}
                paginationModel={{ pageSize: tableSize, page: 0 }}
                getRowSpacing={(params) => ({
                  top: params.isFirstVisible ? 0 : 5,
                  bottom: params.isLastVisible ? 0 : 5,
                })}
                onRowSelectionModelChange={(selectionModel) => {
                  setRowSelectionModel(selectionModel);
                  // selectionModel.ids is a Set of selected row IDs
                  if (selectionModel.ids.size > 0) {
                    const scheduleID = Array.from(selectionModel.ids)[0];
                    const selectedSchedule = schedules.find(s => s.scheduleId === scheduleID);
                    // Find the original audit object with full details
                    const originalAudit = allAudits.find(a => a.scheduleId === scheduleID);
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
            {schedule &&
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
                          rules={{ required: "Required Equipment is required if Safety Equipment Required is Yes" }}
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
            }


          </ form>
        </>
      }
    </>
  )
}

export default Planning
