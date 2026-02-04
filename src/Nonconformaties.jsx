import { React, useEffect, useMemo, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import Select from "react-select"
import { Box, Typography } from '@mui/material';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import ReactMarkdown from 'react-markdown';
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


function Nonconformities({ selectedAuditId, allAudits = [] }) {

  const userInfo = { name: "Walter Osborne" };

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
    if (selectedAudit?.findings?.[0]) {
      selectedAudit.findings.forEach((finding, idx) => {
        setValue(`nc${idx}_id`, finding.id);
        setValue(`nc${idx}_type`, finding.type);
        setValue(`nc${idx}_severity`, finding.severity);
        setValue(`nc${idx}_description`, finding.description);
        setValue(`nc${idx}_rootCause`, finding.rootCause);
        setValue(`nc${idx}_correctiveAction`, finding.correctiveAction);
        setValue(`nc${idx}_responsible`, finding.responsiblePerson);
        setValue(`nc${idx}_targetDate`, finding.targetCloseDate);
      });
    }
  }, [selectedAudit, setValue]);

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

  // Use real findings data from selected audit
  const nonconformaties = selectedAudit?.findings?.map((finding, idx) => ({
    id: idx + 1,
    NCID: finding.id,
    Question: finding.question || finding.description,
    Type: finding.type,
    Severity: finding.severity || 'N/A'
  })) || [];

  const severityOptions = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
    { value: 'Critical', label: 'Critical' },
  ];

  const reviewerOptions = [
    { value: 'Reviewer 1', label: 'Reviewer 1' },
    { value: 'Reviewer 2', label: 'Reviewer 2' },
    { value: 'Reviewer 3', label: 'Reviewer 3' },
  ];

  const approverOptions = [
    { value: 'Approver 1', label: 'Approver 1' },
    { value: 'Approver 2', label: 'Approver 2' },
    { value: 'Approver 3', label: 'Approver 3' },
  ];

  const leadAuditorOptions = [
    { value: 'Lead Auditor 1', label: 'Lead Auditor 1' },
    { value: 'Lead Auditor 2', label: 'Lead Auditor 2' },
    { value: 'Lead Auditor 3', label: 'Lead Auditor 3' },
  ];

  const additionalAuditorsOptions = [
    { value: 'Auditor A', label: 'Auditor A' },
    { value: 'Auditor B', label: 'Auditor B' },
    { value: 'Auditor C', label: 'Auditor C' },
  ];


  const [schedule, setSchedule] = useState(null);
  const [locked, setLocked] = useState(false);
  const [newCARs, setNewCARs] = useState([]);
  const [carCounter, setCarCounter] = useState(0);

  function addCAR() {
    const newCarId = carCounter;
    setNewCARs([...newCARs, newCarId]);
    setCarCounter(carCounter + 1);
  }

  function deleteCAR(carId) {
    setNewCARs(newCARs.filter(id => id !== carId));
  }

  useEffect(() => {
    if (schedule) {
    } else {
      reset()
    }
  }, [schedule]); // Runs effect whenever schedule changes

  async function onSubmit(data) {
    try {
      //Waits 1000 ms to simulate async code
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const submissionData = { ...data, locked };
      console.log(submissionData)
    }
    catch (error) {
      //The root error is a form-level error not tied to a specific field
      setError("root",
        { message: error.message }
      )
    }

  }

  function handleReset() {
    setNewCARs(0)
    reset();
  }

  return (
    <>
      <div style={{ width: '100%', textAlign: 'left' }}>
        <h1>Enter Nonconformaties</h1>
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
                key={selectedAuditId || 'no-selection'}
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
            {schedule &&
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
                    <h3 className='sectiontitle'>Process Evaluation Questions</h3>
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
                    <h3 className='sectiontitle'>Every Time Questions</h3>
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
                {nonconformaties.filter(nc => nc.Type !== 'PEQ' && nc.Type !== 'ETQ').length > 0 && (
                  <>
                    <h3 className='sectiontitle'>Standard-Based Questions</h3>
                    {nonconformaties.filter(nc => nc.Type !== 'PEQ' && nc.Type !== 'ETQ').map((nc, index) => (
                      <div className='section' key={nc.NCID}>
                        <div className='sectionrow'>
                          <div className="fieldboxwhole">
                            <h3></h3> <h4 style={{ margin: '0 0 10px 0' }}>{nc.Question}</h4>
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
                            <ToggleButton value="Yes" sx={{ textTransform: 'none' }}>
                              Yes
                            </ToggleButton>
                            <ToggleButton value="No" sx={{ textTransform: 'none' }}>
                              No
                            </ToggleButton>
                            <ToggleButton value="N/A" sx={{ textTransform: 'none' }}>
                              N/A
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
                      <label>Additional Auditors</label>
                      <Controller
                        name="additionalAuditors"
                        control={control}
                        render={({ field }) => (
                          <Select
                            isClearable
                            isMulti
                            options={additionalAuditorsOptions}
                            styles={customStyles}
                            placeholder="Additional Auditors"
                            value={field.value ? additionalAuditorsOptions.filter(a => field.value.includes(a.value)) : []}
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
                  <button type="submit" disabled={isSubmitting} onClick={() => setLocked(true)} className='button' style={{ backgroundColor: 'green', width: '32%' }}>
                    {isSubmitting ? (locked ? "Submitting..." : "Submit") : "Submit"}
                  </button>
                  <button type="submit" disabled={isSubmitting} onClick={() => setLocked(false)} className='button' style={{ backgroundColor: 'blue', width: '32%' }}>
                    {isSubmitting ? (locked ? "Save Changes Without Submitting" : "Saving...") : "Save Changes Without Submitting"}
                  </button>
                  <button type="button" onClick={handleReset} disabled={isSubmitting} className='button' style={{ backgroundColor: 'white', color: 'black', border: '1px solid black', width: '32%' }}>
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

export default Nonconformities;
