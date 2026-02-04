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


function Schedule({ selectedAuditId, allAudits = [] }) {

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
  const { register, handleSubmit,
    setError,
    formState: { errors, isSubmitting },
    control,
    reset,
    setValue,
    watch
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
  }, [selectedAuditId, allAudits, setValue]);


  const mode = watch('mode');
  const schedulesct = watch('schedule');
  const [tableSize, setTableSize] = useState(10)

  const columns = useMemo(() => [
    { field: 'scheduleId', headerName: 'Schedule ID', width: 150 },
    { field: 'title', headerName: 'Title', width: 300 },
    { field: 'leadAuditor', headerName: 'Lead Auditor', width: 150 },
    { field: 'division', headerName: 'Division', width: 200 },
    { field: 'programs', headerName: 'Program(s)', width: 200 },
  ], []);

  // Use real audit data from auditData.js
  const schedules = allAudits.map(audit => ({
    id: audit.scheduleId,
    scheduleId: audit.scheduleId,
    title: audit.title,
    leadAuditor: audit.leadAuditor,
    division: getDivisionName(audit.divisionId),
    programs: getProgramNames(audit.programIds)
  }));

  // Convert programsList to react-select format
  const programOptions = programsList.map(p => ({
    value: p.programId,
    label: p.programName
  }));

  const programs = programOptions;

  // Convert divisionsList to react-select format
  const divisionOptions = divisionsList.map(d => ({
    value: d.divisionId,
    label: d.divisionName
  }));

  const divisions = divisionOptions;

  // Convert sectorsList to react-select format
  const sectorOptions = sectorsList.map(s => ({
    value: s.sectorId,
    label: s.sectorName
  }));

  const sectors = sectorOptions;

  // Convert sitesList to react-select format
  const siteOptions = sitesList.map(s => ({
    value: s.siteId,
    label: s.siteName
  }));

  const sites = siteOptions;

  const businessUnits = businessUnitsList.map(bu => ({
    value: bu.businessUnitId,
    label: bu.businessUnitName
  }));

  const operatingUnits = operatingUnitsList.map(ou => ({
    value: ou.operatingUnitId,
    label: ou.operatingUnitName
  }));

  const auditTypes = auditTypesList.map(at => ({
    value: at.auditTypeId,
    label: at.auditTypeName
  }));

  const leadAuditors = auditorsList.map(a => ({
    value: a.auditorId,
    label: a.auditorName
  }));

  const additionalAuditors = auditorsList.map(a => ({
    value: a.auditorId,
    label: a.auditorName
  }));

  const standards = [
    { value: "Standard 1", label: "Standard 1" },
    { value: "Standard 2", label: "Standard 2" },
    { value: "Standard 3", label: "Standard 3" },
  ];

  const statuses = statusesList.map(s => ({
    value: s.statusId,
    label: s.statusName
  }));

  const functions = functionsList.map(f => ({
    value: f.functionId,
    label: f.functionName
  }));

  const intExtOptions = intExtList.map(ie => ({
    value: ie.intExtId,
    label: ie.intExtName
  }));

  const standardsOptions = standardsList.map(s => ({
    value: s.standardId,
    label: s.standardName
  }));


  const [schedule, setSchedule] = useState(null);

  useEffect(() => {
    if (mode === 'New') {
      setSchedule(null);
    }
  }, [mode]);

  useEffect(() => {
    console.log("Selected schedule changed:", schedule);
    console.log("Selected audit:", selectedAudit);
    if (schedule) {
      // Automatically set mode to Edit when a schedule is set
      setValue("mode", "Edit");
      // Set title if available
      if (selectedAudit && selectedAudit.title) {
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
        setValue("StartDate", selectedAudit.expectedStartDate);
      }
      // Set expected completion date if available
      if (selectedAudit && selectedAudit.expectedCompletionDate) {
        setValue("ExpCompDate", selectedAudit.expectedCompletionDate);
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
    const currentMode = mode;
    reset();
    if (currentMode) {
      setValue("mode", currentMode);
    }
  }

  return (
    <>
      <div style={{ width: '100%', textAlign: 'left' }}>
        <h1>Schedule Entry Tool</h1>
        <h2 style={{ marginTop: '3px' }}>Welcome {userInfo.name}. <a href="mailto:walter.osborne@ngc.com" target='_blank'>Not you?</a></h2>
      </div>
      {/* If the page has encountered an error not tied to a field display it instead of the form */}
      {errors.root ? <p className='error'>{errors.root.message}</p> :
        <>
          {/* Form that has certain built in properties like submit and reset */}
          <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
            <div className='section' style={{ border: '1px solid transparent', marginTop: '0px', padding: '0px' }}>
              <label className='sectiontitle'>Mode</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', padding: '5px' }}>
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                  <input
                    {...register("mode", {
                      required: 'Mode is required'
                    })} type="radio" name='mode' value={'New'} />
                  <label htmlFor=''>New Entry</label>
                </div>
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                  <input
                    {...register("mode", {
                      required: 'Mode is required'
                    })} type="radio" name='mode' value={'Edit'} />
                  <label>Edit Entry</label>
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
                      // Find the original audit object with programIds
                      const originalAudit = allAudits.find(a => a.scheduleId === scheduleID);
                      console.log("Found schedule:", selectedSchedule);
                      console.log("Found original audit:", originalAudit);
                      setSelectedAudit(originalAudit);
                      setSchedule(selectedSchedule);
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
                  <div style={{
                    width: '100%', display: 'flex', justifyContent: 'space-between', boxSizing: 'border-box',
                    padding: '2px', marginTop: '10px'
                  }}>
                    <button type="submit" disabled={isSubmitting} className='button' style={{ backgroundColor: 'green', width: '32%' }}>
                      {isSubmitting ? "Submitting..." : "Submit"}
                    </button>
                    <button type="download" disabled={isSubmitting} className='button' style={{ backgroundColor: 'blue', width: '32%' }}>
                      Export(.xlsx)
                    </button>
                    <button type="button" onClick={handleReset} disabled={isSubmitting} className='button' style={{ backgroundColor: 'white', color: 'black', border: '1px solid black', width: '32%' }}>
                      Reset
                    </button>
                  </div>
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
