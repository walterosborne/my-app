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


function Results({ selectedAuditId, allAudits = [] }) {

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

  const [newPEQs, setNewPEQs] = useState(0);
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

  function addPEQ() {
    setNewPEQs(newPEQs + 1);
  }
  function removePEQ() {
    if (newPEQs > 0) {
      setNewPEQs(newPEQs - 1);
    }
  }

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
    if (selectedAudit?.processElements?.[0]) {
      setValue('peIntroduction', selectedAudit.peIntroduction);
      selectedAudit.processElements.forEach((pe, idx) => {
        setValue(`pe${idx}_question`, pe.question);
        setValue(`pe${idx}_standard`, pe.standard);
        setValue(`pe${idx}_response`, pe.response);
        setValue(`pe${idx}_evidence`, pe.evidence);
        setValue(`pe${idx}_interviewees`, pe.interviewees?.join('; '));
      });
    }
  }, [selectedAudit, setValue]);

  const standards = [
    { value: "Standard 1", label: "Standard 1" },
    { value: "Standard 2", label: "Standard 2" },
    { value: "Standard 3", label: "Standard 3" },
  ];

  const interviewees = [
    { value: "John Doe", label: "John Doe" },
    { value: "Jane Smith", label: "Jane Smith" },
    { value: "Mike Johnson", label: "Mike Johnson" },
  ];

  const programs = [
    { value: "Program 1", label: "Program 1" },
    { value: "Program 2", label: "Program 2" },
    { value: "Program 3", label: "Program 3" },
  ];

  const prOPOptions = [
    { value: "PrOP 1", label: "PrOP 1" },
    { value: "PrOP 2", label: "PrOP 2" },
    { value: "PrOP 3", label: "PrOP 3" },
  ];

  const everyTimeQuestions = [
    "Are the audit criteria clearly defined and understood?",
    "Are records maintained and accessible?",
    "Is there evidence of continuous improvement?",
    "Are corrective actions from previous audits closed?",
  ];

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

  const as9100text = [
    { section: 4, subsection: 1, text: "### 4.1 Understanding the organization and its context\n\nThe organization shall determine external and internal issues that are relevant to its purpose and strategic direction and that affect its ability to achieve the intended results of its quality management system." },
    { section: 4, subsection: 2, text: "### 4.2 Understanding the needs and expectations of interested parties\n\nThe organization shall determine the interested parties that are relevant to the quality management system and the requirements of these interested parties." },
    { section: 4, subsection: 3, text: "### 4.3 Determining the scope of the quality management system\n\nThe organization shall determine the boundaries and applicability of the quality management system to establish its scope." },
    // ... More sections and subsections
  ]

  const [schedule, setSchedule] = useState(null);

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
        <h1>Conduct Audit</h1>
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
                <h2 style={{ marginTop: '5px' }}>Currently Conducting Schedule: {schedule.scheduleId}</h2>
                <div className='section'>
                  <label className='sectiontitle'>Overview</label>
                  <div className='sectionrow'>
                    <div className="fieldboxwhole">
                      <label>Record what occurred during your audit.</label>
                      <textarea
                        {...register("overview")}
                        style={{ width: '100%', height: '100px', resize: 'vertical' }}
                        id='overview'
                        className='textfield'
                      />
                    </div>
                  </div>
                </div>
                <div className='section'>
                  <label className='sectiontitle'>Process Evaluation (PE) Introduction</label>

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
                            options={standards}
                            styles={customStyles}
                            placeholder="Standard(s)"
                            value={field.value ? standards.filter(s => field.value.includes(s.value)) : []}
                            onChange={(selectedOptions) => field.onChange(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                          />
                        )}
                      />
                      {errors.standards && <p className='fielderror'>{errors.standards.message}</p>}
                    </div>
                    <div className="fieldboxthird">
                      <label>Interviewees</label>
                      <Controller
                        name="interviewees"
                        control={control}
                        render={({ field }) => (
                          <Select
                            isClearable
                            isMulti
                            options={interviewees}
                            styles={customStyles}
                            placeholder="Interviewees"
                            value={field.value ? interviewees.filter(i => field.value.includes(i.value)) : []}
                            onChange={(selectedOptions) => field.onChange(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                          />
                        )}
                      />
                    </div>
                    <div className="fieldboxthird">
                      <label>Audit Date</label>
                      <input
                        type="date"
                        {...register("auditDate")}
                        id='auditDate'
                        className='datefield'
                      />
                    </div>
                  </div>
                  <div className='sectionrow'>
                    <div className="fieldboxthird">
                      <label>Program(s)</label>
                      <Controller
                        name="programs"
                        control={control}
                        render={({ field }) => (
                          <Select
                            isClearable
                            isMulti
                            options={programs}
                            styles={customStyles}
                            placeholder="Program(s)"
                            value={field.value ? programs.filter(p => field.value.includes(p.value)) : []}
                            onChange={(selectedOptions) => field.onChange(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                          />
                        )}
                      />
                    </div>
                    <div className="fieldboxthird">
                      <label>Evaluator</label>
                      <input
                        type="text"
                        {...register("evaluator")}
                        id='evaluator'
                        className='textfield'
                      />
                    </div>
                    <div className="fieldboxthird">
                      <label>Related Items</label>
                      <input
                        type="text"
                        {...register("relatedItems")}
                        id='relatedItems'
                        className='textfield'
                      />
                    </div>
                  </div>
                  <div className='sectionrow'>
                    <div className="fieldboxhalf">
                      <label>Program Manager</label>
                      <input
                        type="text"
                        {...register("programManager")}
                        id='programManager'
                        className='textfield'
                      />
                    </div>
                    <div className="fieldboxhalf">
                      <label>MA Lead/Manager</label>
                      <input
                        type="text"
                        {...register("maLeadManager")}
                        id='maLeadManager'
                        className='textfield'
                      />
                    </div>
                  </div>

                </div>
                <div className='section'>
                  <div className='sectionrow'>
                    <label className='sectiontitle'>Process Evaluation Questions</label>
                    {newPEQs > 0 &&
                      <button type='button' onClick={addPEQ} className='button' style={{ backgroundColor: 'green' }}>Add Question</button>}
                  </div>
                  {Array.from({ length: newPEQs }, (_, index) => (
                    <div className='peq' key={index}>
                      <div className="fieldboxwhole">
                        <label>Process Evaluation Question {index + 1}</label>
                        <textarea
                          {...register(`peq${index}`)}
                          style={{ width: '100%', height: '100px', resize: 'vertical' }}
                          id={`peq${index}`}
                          className='textfield'
                        />
                      </div>
                      <div className="fieldboxwhole">
                        <label>Finding Type</label>
                        <Controller
                          name={`findingType${index}`}
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
                              aria-label="finding type"
                            >
                              <ToggleButton value="Nonconformity" aria-label="nonconformity" sx={{ textTransform: 'none' }}>
                                Nonconformity
                              </ToggleButton>
                              <ToggleButton value="Conformity" aria-label="conformity" sx={{ textTransform: 'none' }}>
                                Conformity
                              </ToggleButton>
                              <ToggleButton value="OFI" aria-label="OFI" sx={{ textTransform: 'none' }}>
                                OFI
                              </ToggleButton>
                              <ToggleButton value="OBS" aria-label="OBS" sx={{ textTransform: 'none' }}>
                                OBS
                              </ToggleButton>
                            </ToggleButtonGroup>
                          )}
                        />
                      </div>
                      <div className='sectionrow'>
                        <div className="fieldboxhalf">
                          <label>Auditor Comment</label>
                          <textarea
                            {...register(`auditorComment${index}`)}
                            style={{ width: '100%', height: '100px', resize: 'vertical' }}
                            id={`auditorComment${index}`}
                            className='textfield'
                          />
                        </div>
                        <div className="fieldboxhalf">
                          <label>Auditee Response</label>
                          <textarea
                            {...register(`auditeeResponse${index}`)}
                            style={{ width: '100%', height: '100px', resize: 'vertical' }}
                            id={`auditeeResponse${index}`}
                            className='textfield'
                          />
                        </div>
                      </div>
                      <div className='sectionrow'>
                        <div className="fieldboxquarter">
                          <label>Corporate PrOP</label>
                          <Controller
                            name={`prOPCorporate${index}`}
                            control={control}
                            render={({ field }) => (
                              <Select
                                isClearable
                                isMulti
                                options={prOPOptions}
                                styles={customStyles}
                                placeholder="Corporate"
                                value={field.value ? prOPOptions.filter(p => field.value.includes(p.value)) : []}
                                onChange={(selectedOptions) => field.onChange(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                              />
                            )}
                          />
                        </div>
                        <div className="fieldboxquarter">
                          <label>Sector PrOP</label>
                          <Controller
                            name={`prOPSector${index}`}
                            control={control}
                            render={({ field }) => (
                              <Select
                                isClearable
                                isMulti
                                options={prOPOptions}
                                styles={customStyles}
                                placeholder="Sector"
                                value={field.value ? prOPOptions.filter(p => field.value.includes(p.value)) : []}
                                onChange={(selectedOptions) => field.onChange(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                              />
                            )}
                          />
                        </div>
                        <div className="fieldboxquarter">
                          <label>Division PrOP</label>
                          <Controller
                            name={`prOPDivision${index}`}
                            control={control}
                            render={({ field }) => (
                              <Select
                                isClearable
                                isMulti
                                options={prOPOptions}
                                styles={customStyles}
                                placeholder="Division"
                                value={field.value ? prOPOptions.filter(p => field.value.includes(p.value)) : []}
                                onChange={(selectedOptions) => field.onChange(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                              />
                            )}
                          />
                        </div>
                        <div className="fieldboxquarter">
                          <label>Other PrOP</label>
                          <Controller
                            name={`prOPOther${index}`}
                            control={control}
                            render={({ field }) => (
                              <Select
                                isClearable
                                isMulti
                                options={prOPOptions}
                                styles={customStyles}
                                placeholder="Other"
                                value={field.value ? prOPOptions.filter(p => field.value.includes(p.value)) : []}
                                onChange={(selectedOptions) => field.onChange(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                              />
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className='sectionrow'>
                    <button type='button' onClick={addPEQ} className='button' style={{ backgroundColor: 'green', width: (newPEQs === 0) ? '100%' : '48%' }}>Add Question</button>
                    {newPEQs > 0 &&
                      <button type='button' onClick={removePEQ} className='button' style={{ backgroundColor: 'red' }}>Remove Latest Question</button>}
                  </div>
                </div>
                <div className='section'>
                  <label className='sectiontitle'>Every Time Questions</label>
                  {everyTimeQuestions.map((question, index) => (
                    <div className='peq' key={index}>
                      <div className="fieldboxwhole">
                        <label>Every Time Question {index + 1}</label>
                        <label style={{ fontSize: '18px', marginTop: '10px', marginBottom: '15px' }}>{question}</label>
                      </div>
                      <div className="fieldboxwhole">
                        <label>Finding Type</label>
                        <Controller
                          name={`etqFindingType${index}`}
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
                              aria-label="finding type"
                            >
                              <ToggleButton value="Nonconformity" aria-label="nonconformity" sx={{ textTransform: 'none' }}>
                                Nonconformity
                              </ToggleButton>
                              <ToggleButton value="Conformity" aria-label="conformity" sx={{ textTransform: 'none' }}>
                                Conformity
                              </ToggleButton>
                              <ToggleButton value="OFI" aria-label="OFI" sx={{ textTransform: 'none' }}>
                                OFI
                              </ToggleButton>
                              <ToggleButton value="OBS" aria-label="OBS" sx={{ textTransform: 'none' }}>
                                OBS
                              </ToggleButton>
                            </ToggleButtonGroup>
                          )}
                        />
                      </div>
                      <div className='sectionrow'>
                        <div className="fieldboxhalf">
                          <label>Auditor Comment</label>
                          <textarea
                            {...register(`etqAuditorComment${index}`)}
                            style={{ width: '100%', height: '100px', resize: 'vertical' }}
                            id={`etqAuditorComment${index}`}
                            className='textfield'
                          />
                        </div>
                        <div className="fieldboxhalf">
                          <label>Auditee Response</label>
                          <textarea
                            {...register(`etqAuditeeResponse${index}`)}
                            style={{ width: '100%', height: '100px', resize: 'vertical' }}
                            id={`etqAuditeeResponse${index}`}
                            className='textfield'
                          />
                        </div>
                      </div>
                      <div className='sectionrow'>
                        <div className="fieldboxquarter">
                          <label>PrOP - Corporate</label>
                          <Controller
                            name={`etqPrOPCorporate${index}`}
                            control={control}
                            render={({ field }) => (
                              <Select
                                isClearable
                                isMulti
                                options={prOPOptions}
                                styles={customStyles}
                                placeholder="Corporate"
                                value={field.value ? prOPOptions.filter(p => field.value.includes(p.value)) : []}
                                onChange={(selectedOptions) => field.onChange(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                              />
                            )}
                          />
                        </div>
                        <div className="fieldboxquarter">
                          <label>PrOP - Sector</label>
                          <Controller
                            name={`etqPrOPSector${index}`}
                            control={control}
                            render={({ field }) => (
                              <Select
                                isClearable
                                isMulti
                                options={prOPOptions}
                                styles={customStyles}
                                placeholder="Sector"
                                value={field.value ? prOPOptions.filter(p => field.value.includes(p.value)) : []}
                                onChange={(selectedOptions) => field.onChange(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                              />
                            )}
                          />
                        </div>
                        <div className="fieldboxquarter">
                          <label>PrOP - Division</label>
                          <Controller
                            name={`etqPrOPDivision${index}`}
                            control={control}
                            render={({ field }) => (
                              <Select
                                isClearable
                                isMulti
                                options={prOPOptions}
                                styles={customStyles}
                                placeholder="Division"
                                value={field.value ? prOPOptions.filter(p => field.value.includes(p.value)) : []}
                                onChange={(selectedOptions) => field.onChange(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                              />
                            )}
                          />
                        </div>
                        <div className="fieldboxquarter">
                          <label>PrOP - Other</label>
                          <Controller
                            name={`etqPrOPOther${index}`}
                            control={control}
                            render={({ field }) => (
                              <Select
                                isClearable
                                isMulti
                                options={prOPOptions}
                                styles={customStyles}
                                placeholder="Other"
                                value={field.value ? prOPOptions.filter(p => field.value.includes(p.value)) : []}
                                onChange={(selectedOptions) => field.onChange(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                              />
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className='section'>
                  <label className='sectiontitle'>AS9100 Requirements</label>
                  {Object.entries(
                    as9100text.reduce((acc, item) => {
                      if (!acc[item.section]) acc[item.section] = [];
                      acc[item.section].push(item);
                      return acc;
                    }, {})
                  ).map(([sectionNum, questions]) => (
                    <div key={sectionNum} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <label className='sectiontitle' style={{ fontSize: '16px', marginTop: '10px', width: '96%' }}>Standard Section {sectionNum}</label>
                      {questions.map((question, qIndex) => (
                        <div className="peq" key={qIndex} style={{ width: '96%' }}>
                          <div className="fieldboxwhole">
                            <div style={{
                              width: '100%',
                              minHeight: '100px',
                            }}>
                              <ReactMarkdown>{question.text}</ReactMarkdown>
                            </div>
                          </div>
                          <div className="fieldboxwhole">
                            <label>Finding Type</label>
                            <Controller
                              name={`as9100FindingType_${sectionNum}_${question.subsection}`}
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
                                  aria-label="finding type"
                                >
                                  <ToggleButton value="Nonconformity" aria-label="nonconformity" sx={{ textTransform: 'none' }}>
                                    Nonconformity
                                  </ToggleButton>
                                  <ToggleButton value="Conformity" aria-label="conformity" sx={{ textTransform: 'none' }}>
                                    Conformity
                                  </ToggleButton>
                                  <ToggleButton value="OFI" aria-label="OFI" sx={{ textTransform: 'none' }}>
                                    OFI
                                  </ToggleButton>
                                  <ToggleButton value="OBS" aria-label="OBS" sx={{ textTransform: 'none' }}>
                                    OBS
                                  </ToggleButton>
                                </ToggleButtonGroup>
                              )}
                            />
                          </div>
                          <div className='sectionrow'>
                            <div className="fieldboxhalf">
                              <label>Auditor Comment</label>
                              <textarea
                                {...register(`as9100AuditorComment_${sectionNum}_${question.subsection}`)}
                                style={{ width: '100%', height: '100px', resize: 'vertical' }}
                                className='textfield'
                              />
                            </div>
                            <div className="fieldboxhalf">
                              <label>Auditee Response</label>
                              <textarea
                                {...register(`as9100AuditeeResponse_${sectionNum}_${question.subsection}`)}
                                style={{ width: '100%', height: '100px', resize: 'vertical' }}
                                className='textfield'
                              />
                            </div>
                          </div>
                          <div className='sectionrow'>
                            <div className="fieldboxquarter">
                              <label>PrOP - Corporate</label>
                              <Controller
                                name={`as9100PrOPCorporate_${sectionNum}_${question.subsection}`}
                                control={control}
                                render={({ field }) => (
                                  <Select
                                    isClearable
                                    isMulti
                                    options={prOPOptions}
                                    styles={customStyles}
                                    placeholder="Corporate"
                                    value={field.value ? prOPOptions.filter(p => field.value.includes(p.value)) : []}
                                    onChange={(selectedOptions) => field.onChange(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                                  />
                                )}
                              />
                            </div>
                            <div className="fieldboxquarter">
                              <label>PrOP - Sector</label>
                              <Controller
                                name={`as9100PrOPSector_${sectionNum}_${question.subsection}`}
                                control={control}
                                render={({ field }) => (
                                  <Select
                                    isClearable
                                    isMulti
                                    options={prOPOptions}
                                    styles={customStyles}
                                    placeholder="Sector"
                                    value={field.value ? prOPOptions.filter(p => field.value.includes(p.value)) : []}
                                    onChange={(selectedOptions) => field.onChange(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                                  />
                                )}
                              />
                            </div>
                            <div className="fieldboxquarter">
                              <label>PrOP - Division</label>
                              <Controller
                                name={`as9100PrOPDivision_${sectionNum}_${question.subsection}`}
                                control={control}
                                render={({ field }) => (
                                  <Select
                                    isClearable
                                    isMulti
                                    options={prOPOptions}
                                    styles={customStyles}
                                    placeholder="Division"
                                    value={field.value ? prOPOptions.filter(p => field.value.includes(p.value)) : []}
                                    onChange={(selectedOptions) => field.onChange(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                                  />
                                )}
                              />
                            </div>
                            <div className="fieldboxquarter">
                              <label>PrOP - Other</label>
                              <Controller
                                name={`as9100PrOPOther_${sectionNum}_${question.subsection}`}
                                control={control}
                                render={({ field }) => (
                                  <Select
                                    isClearable
                                    isMulti
                                    options={prOPOptions}
                                    styles={customStyles}
                                    placeholder="Other"
                                    value={field.value ? prOPOptions.filter(p => field.value.includes(p.value)) : []}
                                    onChange={(selectedOptions) => field.onChange(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                                  />
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                {Object.keys(errors).length > 0 && (
                  <div className='section' style={{ backgroundColor: '#ffebee', border: '1px solid #f44336', borderRadius: '4px' }}>
                    <p style={{ color: '#d32f2f', margin: 0, fontWeight: 'bold' }}>
                      Please fill out all required fields before submitting.
                    </p>
                    <p style={{ color: '#d32f2f', marginTop: '10px', marginBottom: 0 }}>
                      Missing fields: {Object.keys(errors).map(key =>
                        key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                      ).join(', ')}
                    </p>
                  </div>
                )}
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

export default Results;
