import { React, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import Select from 'react-select'
import AsyncSelect from 'react-select/async'
import { Box } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { toast } from 'react-toastify'
import './App.css'
import { grey } from '@mui/material/colors'
import { customStyles, normalizeDisplayLabel } from './Utilities.jsx'
import {
  buildApiUrl,
  getPrograms,
  getDivisions,
  getAuditors,
  getSafetyEquipment,
  getTrainingRequirements,
  getRosterByIds,
  getCurrentUser,
  searchRoster
} from './assets/data/apiData'

function Planning({ selectedAuditId, allAudits = [], reloadAudits }) {
  const [userInfo, setUserInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [auditLocked, setAuditLocked] = useState(false)
  const readOnlyToastRef = useRef(null)

  const [programsList, setProgramsList] = useState([])
  const [divisionsList, setDivisionsList] = useState([])
  const [auditorsList, setAuditorsList] = useState([])
  const [safetyEquipmentList, setSafetyEquipmentList] = useState([])
  const [trainingRequirementsList, setTrainingRequirementsList] = useState([])
  const [rosterOptionsById, setRosterOptionsById] = useState({})
  const [planningCars, setPlanningCars] = useState([])
  const [loadedCars, setLoadedCars] = useState([])
  const [carCounter, setCarCounter] = useState(0)

  useEffect(() => {
    async function loadLookupData() {
      try {
        const userData = await getCurrentUser()
        setUserInfo(userData?.name && userData.name !== 'User' ? userData : null)
        const [programs, divisions, auditors, safetyEquipment, trainingRequirements] = await Promise.all([
          getPrograms(),
          getDivisions(),
          getAuditors(),
          getSafetyEquipment(),
          getTrainingRequirements()
        ])

        setProgramsList(programs)
        setDivisionsList(divisions)
        setAuditorsList(auditors)
        setSafetyEquipmentList(safetyEquipment)
        setTrainingRequirementsList(trainingRequirements)
      } catch (error) {
        console.error('Error loading lookup data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadLookupData()
  }, [])

  const getProgramNames = (programIds = []) => {
    return programIds.map((programId) => {
      const program = programsList.find((p) => p.programId === programId)
      return normalizeDisplayLabel(program ? program.programName : programId)
    }).join(', ')
  }

  const normalizeIdArray = (value) => {
    if (Array.isArray(value)) return value
    if (value === null || value === undefined) return []
    return [value]
  }

  const getDivisionName = (divisionId) => {
    const ids = normalizeIdArray(divisionId)
    if (ids.length === 0) return ''
    return ids
      .map((id) => {
        const division = divisionsList.find((d) => d.divisionId === id)
        return normalizeDisplayLabel(division ? division.divisionName : id)
      })
      .join('; ')
  }

  const getLeadAuditorName = (leadAuditorId) => {
    const auditor = auditorsList.find((a) => a.auditorId === leadAuditorId)
    return auditor ? auditor.auditorName : leadAuditorId
  }

  const mergeRosterOptions = useCallback((people = []) => {
    const options = people
      .map((person) => ({
        value: person.myId,
        label: person.rosterName
          ? `${person.rosterName} (${person.myId})`
          : String(person.myId)
      }))
      .filter((option) => option.value)

    if (options.length > 0) {
      setRosterOptionsById((current) => {
        const next = { ...current }
        options.forEach((option) => {
          next[String(option.value)] = option
        })
        return next
      })
    }

    return options
  }, [])

  const getRosterOption = useCallback((myId) => {
    if (!myId) return null
    return rosterOptionsById[String(myId)] || {
      value: myId,
      label: String(myId)
    }
  }, [rosterOptionsById])

  const loadRosterOptions = useCallback(async (inputValue) => {
    const trimmedInput = String(inputValue || '').trim()
    if (trimmedInput.length < 3) {
      return []
    }

    const matches = await searchRoster(trimmedInput, 50)
    return mergeRosterOptions(matches)
  }, [mergeRosterOptions])

  const buildPlanningDefaultValues = useCallback((audit) => ({
    title: audit?.title || '',
    scope: audit?.scope || '',
    safety: audit?.safety !== undefined && audit?.safety !== null ? String(audit.safety) : '',
    clearance: audit?.clearance !== undefined && audit?.clearance !== null ? String(audit.clearance) : '',
    safetyEquipmentIds: audit?.safetyEquipmentIds || [],
    trainingRequirementIds: audit?.trainingRequirementIds || [],
    fama: audit?.famaIds || [],
    SpecCon: audit?.specialConsiderations || ''
  }), [])

  const [selectedAudit, setSelectedAudit] = useState(null)
  const isViewOnly = Boolean(selectedAudit?.scheduleId && selectedAudit?.canEdit === false)
  const readOnlyStyle = isViewOnly ? { pointerEvents: 'none', opacity: 0.65 } : undefined
  const [rowSelectionModel, setRowSelectionModel] = useState({
    type: 'include',
    ids: new Set()
  })

  const entryAudits = useMemo(() => {
    return allAudits.filter((audit) => Number(audit?.stage) !== -1)
  }, [allAudits])

  const selectedSchedule = selectedAudit ? {
    id: selectedAudit.scheduleId,
    scheduleId: selectedAudit.scheduleId,
    title: selectedAudit.title,
    leadAuditor: getLeadAuditorName(selectedAudit.leadAuditorId),
    division: getDivisionName(selectedAudit.divisionId),
    programs: getProgramNames(selectedAudit.programIds)
  } : null

  const isSameSelectionModel = (nextModel, currentModel) => {
    if (!nextModel || !currentModel) return false
    if (nextModel.type !== currentModel.type) return false
    if (!nextModel.ids || !currentModel.ids) return false
    if (nextModel.ids.size !== currentModel.ids.size) return false
    for (const id of nextModel.ids) {
      if (!currentModel.ids.has(id)) return false
    }
    return true
  }

  useEffect(() => {
    if (!isViewOnly || !selectedAudit?.scheduleId) {
      readOnlyToastRef.current = null
      return
    }
    if (readOnlyToastRef.current === selectedAudit.scheduleId) return
    toast.info(`You are not assigned as an auditor on audit ${selectedAudit.scheduleId}. Entry fields are view-only.`)
    readOnlyToastRef.current = selectedAudit.scheduleId
  }, [isViewOnly, selectedAudit])

  useEffect(() => {
    if (selectedAuditId && entryAudits.length > 0) {
      const audit = entryAudits.find((a) => a.scheduleId === selectedAuditId)
      if (audit) {
        setSelectedAudit(audit)
        setRowSelectionModel((prev) => {
          const nextModel = { type: 'include', ids: new Set([selectedAuditId]) }
          return isSameSelectionModel(nextModel, prev) ? prev : nextModel
        })
      }
    }
  }, [selectedAuditId, entryAudits])

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
    control,
    reset,
    setValue,
    watch,
    clearErrors
  } = useForm({ defaultValues: {} })

  useEffect(() => {
    let isCancelled = false

    const loadAuditDetails = async () => {
      if (!selectedAudit?.scheduleId) {
        reset({})
        setAuditLocked(false)
        setPlanningCars([])
        setLoadedCars([])
        setCarCounter(0)
        setRosterOptionsById({})
        return
      }

      reset(buildPlanningDefaultValues(selectedAudit))
      setPlanningCars([])
      setLoadedCars([])
      setCarCounter(0)
      clearErrors()

      try {
        const [carsData, auditData] = await Promise.all([
          fetch(buildApiUrl(`cars/${selectedAudit.scheduleId}`)).then((res) => res.json()),
          fetch(buildApiUrl(`audits/${selectedAudit.scheduleId}`)).then((res) => res.json())
        ])

        if (isCancelled) return

        const normalizedCars = Array.isArray(carsData)
          ? carsData.map((car, index) => ({
            id: car.carid ?? `existing-${index}`,
            carId: car.carid ?? null,
            car: car.car || '',
            reviewer: car.reviewer || null,
            effective: car.effective ?? null
          }))
          : []

        const rosterIds = [
          ...(selectedAudit.famaIds || []),
          ...normalizedCars.map((car) => car.reviewer).filter(Boolean)
        ]

        if (rosterIds.length > 0) {
          try {
            const rosterMatches = await getRosterByIds(rosterIds)
            if (!isCancelled) {
              mergeRosterOptions(rosterMatches)
            }
          } catch (rosterError) {
            console.error('Error loading selected roster entries:', rosterError)
          }
        }

        normalizedCars.forEach((car) => {
          setValue(`car${car.id}`, car.car)
          setValue(`carReviewer${car.id}`, car.reviewer)
        })

        setPlanningCars(normalizedCars)
        setLoadedCars(normalizedCars)
        setCarCounter(normalizedCars.length)
        setAuditLocked(Number(auditData.locked) === 1)
      } catch (error) {
        console.error('Error loading planning audit data:', error)
      }
    }

    loadAuditDetails()

    return () => {
      isCancelled = true
    }
  }, [selectedAudit, reset, setValue, clearErrors, buildPlanningDefaultValues, mergeRosterOptions])

  const safety = watch('safety')
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10
  })

  const columns = useMemo(() => [
    { field: 'scheduleId', headerName: 'Schedule ID', width: 150 },
    { field: 'title', headerName: 'Title', width: 300 },
    { field: 'leadAuditor', headerName: 'Lead Auditor', width: 150 },
    { field: 'division', headerName: 'Division', width: 150 },
    { field: 'programs', headerName: 'Program(s)', width: 150 }
  ], [])

  const sortedAudits = useMemo(() => {
    return [...entryAudits].sort((a, b) => Number(b.scheduleId) - Number(a.scheduleId))
  }, [entryAudits])

  const schedules = useMemo(() => sortedAudits.map((audit) => ({
    id: audit.scheduleId,
    scheduleId: audit.scheduleId,
    title: audit.title,
    leadAuditor: getLeadAuditorName(audit.leadAuditorId),
    division: getDivisionName(audit.divisionId),
    programs: getProgramNames(audit.programIds)
  })), [sortedAudits, auditorsList, divisionsList, programsList])

  const safetyEquipmentOptions = useMemo(() => {
    return [...safetyEquipmentList]
      .filter((equipment) => (equipment.active ?? 1) === 1)
      .sort((a, b) => (a.safetyEquipmentName || '').localeCompare(b.safetyEquipmentName || ''))
      .map((se) => ({
        value: se.safetyEquipmentId,
        label: se.safetyEquipmentName
      }))
  }, [safetyEquipmentList])

  const trainingRequirementsOptions = useMemo(() => {
    return [...trainingRequirementsList]
      .filter((requirement) => (requirement.active ?? 1) === 1)
      .sort((a, b) => (a.trainingRequirementName || '').localeCompare(b.trainingRequirementName || ''))
      .map((tr) => ({
        value: tr.trainingRequirementId,
        label: tr.trainingRequirementName
      }))
  }, [trainingRequirementsList])

  function addCAR() {
    const nextId = `new-${carCounter}`
    setPlanningCars((current) => [...current, { id: nextId, effective: null }])
    setCarCounter((current) => current + 1)
  }

  function deleteCAR(carId) {
    setPlanningCars((current) => current.filter((car) => car.id !== carId))
    setValue(`car${carId}`, '')
    setValue(`carReviewer${carId}`, null)
  }

  async function unlockAudit() {
    if (isViewOnly) {
      toast.error(`Audit ${selectedAudit?.scheduleId} is view-only because you are not assigned as an auditor.`)
      return
    }
    try {
      if (!selectedAudit?.scheduleId) {
        throw new Error('No audit selected')
      }

      const response = await fetch(buildApiUrl('unlock-audit'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scheduleId: selectedAudit.scheduleId
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Audit unlocked successfully!')
        setAuditLocked(false)
      } else {
        throw new Error(result.error || 'Failed to unlock audit')
      }
    } catch (error) {
      toast.error(`Failed to unlock audit: ${error.message}`)
    }
  }

  async function onSubmit(data) {
    if (isViewOnly) {
      toast.error(`Audit ${selectedAudit?.scheduleId} is view-only because you are not assigned as an auditor.`)
      return
    }
    try {
      if (!selectedAudit?.scheduleId) {
        toast.error('Please select an audit from the table')
        return
      }

      const computeStage = (fallbackStage) => {
        const currentStage = selectedAudit?.stage ?? 0
        return Math.max(currentStage, fallbackStage)
      }

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
      }

      const response = await fetch(buildApiUrl(`audits/${selectedAudit.scheduleId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(planningData)
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to save planning data')
      }

      const carsPayload = planningCars
        .map((car) => ({
          carId: car.carId ?? null,
          car: data[`car${car.id}`] || '',
          reviewer: data[`carReviewer${car.id}`] || null,
          effective: car.effective ?? null
        }))
        .filter((car) => car.car)

      const carsResponse = await fetch(buildApiUrl(`cars/${selectedAudit.scheduleId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cars: carsPayload })
      })

      const carsResult = await carsResponse.json()
      if (!carsResult.success) {
        throw new Error(carsResult.error || 'Failed to save CAR data')
      }

      toast.success('Submitted!')

      const refreshedCarsResponse = await fetch(buildApiUrl(`cars/${selectedAudit.scheduleId}`))
      const refreshedCarsData = await refreshedCarsResponse.json()
      const normalizedCars = Array.isArray(refreshedCarsData)
        ? refreshedCarsData.map((car, index) => ({
          id: car.carid ?? `existing-${index}`,
          carId: car.carid ?? null,
          car: car.car || '',
          reviewer: car.reviewer || null,
          effective: car.effective ?? null
        }))
        : []

      const rosterIds = [
        ...(data.fama || []),
        ...normalizedCars.map((car) => car.reviewer).filter(Boolean)
      ]
      if (rosterIds.length > 0) {
        try {
          const rosterMatches = await getRosterByIds(rosterIds)
          mergeRosterOptions(rosterMatches)
        } catch (rosterError) {
          console.error('Error loading selected roster entries:', rosterError)
        }
      }

      normalizedCars.forEach((car) => {
        setValue(`car${car.id}`, car.car)
        setValue(`carReviewer${car.id}`, car.reviewer)
      })

      setLoadedCars(normalizedCars)
      setPlanningCars(normalizedCars)
      setCarCounter(normalizedCars.length)

      if (reloadAudits) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        await reloadAudits()
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`)
      setError('root', { message: error.message })
    }
  }

  function handleReset() {
    if (selectedAudit) {
      reset(buildPlanningDefaultValues(selectedAudit))
      loadedCars.forEach((car) => {
        setValue(`car${car.id}`, car.car || '')
        setValue(`carReviewer${car.id}`, car.reviewer || null)
      })
      setPlanningCars(loadedCars.map((car) => ({ ...car })))
    }
  }

  function onValidationError(formErrors) {
    const errorArray = Object.values(formErrors)
      .map((error) => error.message)
      .filter((msg) => msg)

    const errorMessage = errorArray.length > 3
      ? 'Please complete all required fields'
      : errorArray.join(', ') || 'Please fill in all required fields'

    toast.error(errorMessage, {
      progressStyle: { backgroundColor: '#f44336' },
      style: { borderLeft: '4px solid #f44336' }
    })
  }

  if (loading) {
    return <div className="entry-message">Loading planning data...</div>
  }

  return (
    <>
      <div style={{ width: '100%', textAlign: 'left' }}>
        <h1>Planning Tool</h1>
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
      {errors.root ? <p className='error'>{errors.root.message}</p> : (
        <>
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
                  bottom: params.isLastVisible ? 0 : 5
                })}
                onRowSelectionModelChange={(selectionModel) => {
                  if (!selectionModel?.ids) return
                  if (isSameSelectionModel(selectionModel, rowSelectionModel)) return
                  setRowSelectionModel(selectionModel)
                  if (selectionModel.ids.size > 0) {
                    const scheduleID = Array.from(selectionModel.ids)[0]
                    const originalAudit = entryAudits.find((a) => a.scheduleId === scheduleID)
                    setSelectedAudit(originalAudit || null)
                  } else {
                    setSelectedAudit(null)
                  }
                }}
                sx={{
                  '& .MuiDataGrid-row': {
                    bgcolor: (theme) => theme.palette.mode === 'light' ? grey[200] : grey[900]
                  }
                }}
              />
            </Box>
            {selectedSchedule && auditLocked ? (
              <>
                <h2 style={{ marginTop: '30px', marginBottom: '20px', color: '#d32f2f' }}>
                  Audit {selectedSchedule.scheduleId} has been submitted for final approval and cannot be edited.
                </h2>
                {!isViewOnly && (
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
                )}
                <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                  Note: Undoing submission will revoke approvers' ability to approve the audit and clear previous approvals.
                </p>
              </>
            ) : selectedSchedule ? (
              <>
                <h2 style={{ marginTop: '5px' }}>Currently Planning Schedule: {selectedSchedule.scheduleId}</h2>
                {isViewOnly && (
                  <p style={{ marginTop: '6px', color: '#666' }}>
                    You are not assigned as an auditor on this audit. Fields are view-only.
                  </p>
                )}
                <div style={readOnlyStyle}>
                  <div className='section'>
                    <div className='sectionrow'>
                      <div className="fieldboxwhole">
                        <label>Functional Area Manager/Auditees<label style={{ color: 'red' }}>*</label></label>
                        <Controller
                          name="fama"
                          control={control}
                          rules={{ required: 'Functional Area Manager/Auditees is required' }}
                          render={({ field }) => (
                            <AsyncSelect
                              isClearable
                              isMulti
                              cacheOptions
                              defaultOptions={false}
                              loadOptions={loadRosterOptions}
                              styles={customStyles}
                              placeholder="Functional Area Manager/Auditees"
                              noOptionsMessage={({ inputValue }) => inputValue.trim().length < 3 ? 'Type at least 3 characters' : 'No matches found'}
                              value={Array.isArray(field.value) ? field.value.map((id) => getRosterOption(id)).filter(Boolean) : []}
                              onChange={(selectedOptions) => field.onChange(selectedOptions ? selectedOptions.map((option) => option.value) : [])}
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
                              {...register('safety', { required: 'Safety Equipment Required is required' })}
                              type="radio"
                              value={0}
                            />
                            Yes
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <input
                              {...register('safety', { required: 'Safety Equipment Required is required' })}
                              type="radio"
                              value={1}
                            />
                            No
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <input
                              {...register('safety', { required: 'Safety Equipment Required is required' })}
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
                              {...register('clearance', { required: 'Clearance Required is required' })}
                              type="radio"
                              value={0}
                            />
                            Yes
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <input
                              {...register('clearance', { required: 'Clearance Required is required' })}
                              type="radio"
                              value={1}
                            />
                            No
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <input
                              {...register('clearance', { required: 'Clearance Required is required' })}
                              type="radio"
                              value={2}
                            />
                            Unknown
                          </label>
                        </div>
                        {errors.clearance && <p className='fielderror'>{errors.clearance.message}</p>}
                      </div>
                    </div>
                    {safety === '0' && (
                      <div className='sectionrow'>
                        <div className="fieldboxwhole">
                          <label>Required Equipment<label style={{ color: 'red' }}>*</label></label>
                          <Controller
                            name="safetyEquipmentIds"
                            control={control}
                            rules={{ required: 'Required Equipment is required' }}
                            render={({ field }) => (
                              <Select
                                isClearable
                                isMulti
                                options={safetyEquipmentOptions}
                                styles={customStyles}
                                placeholder="Required Equipment"
                                value={field.value ? safetyEquipmentOptions.filter((s) => field.value.includes(s.value)) : []}
                                onChange={(selectedOptions) => field.onChange(selectedOptions ? selectedOptions.map((opt) => opt.value) : [])}
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
                              value={field.value ? trainingRequirementsOptions.filter((tr) => field.value.includes(tr.value)) : []}
                              onChange={(selectedOptions) => field.onChange(selectedOptions ? selectedOptions.map((opt) => opt.value) : [])}
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
                          {...register('scope', { required: 'Scope is required' })}
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
                          {...register('SpecCon')}
                          style={{ width: '100%', height: '100px', resize: 'vertical' }}
                          id='SpecCon'
                          className='textfield'
                        />
                      </div>
                    </div>
                    <div className='sectionrow'>
                      <div className="fieldboxwhole">
                        <label>Previous CARs</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                          <button
                            type='button'
                            onClick={addCAR}
                            className='button'
                            style={{ backgroundColor: 'white', color: 'black', border: '1px solid black', alignSelf: 'flex-start' }}
                          >
                            Add New
                          </button>
                          {planningCars.length === 0 && (
                            <p style={{ margin: 0, color: '#666' }}>No previous CARs entered.</p>
                          )}
                          {planningCars.map((car, index) => (
                            <div
                              key={car.id}
                              className='sectionrow'
                              style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '10px', boxSizing: 'border-box' }}
                            >
                              <div className="fieldboxthird">
                                <label>CAR {index + 1}</label>
                                <input
                                  type="text"
                                  {...register(`car${car.id}`)}
                                  id={`car${car.id}`}
                                  className='textfield'
                                />
                              </div>
                              <div className="fieldboxthird">
                                <label>Reviewer</label>
                                <Controller
                                  name={`carReviewer${car.id}`}
                                  control={control}
                                  render={({ field }) => (
                                    <AsyncSelect
                                      isClearable
                                      cacheOptions
                                      defaultOptions={false}
                                      loadOptions={loadRosterOptions}
                                      styles={customStyles}
                                      placeholder="Reviewer"
                                      noOptionsMessage={({ inputValue }) => inputValue.trim().length < 3 ? 'Type at least 3 characters' : 'No matches found'}
                                      value={getRosterOption(field.value)}
                                      onChange={(selectedOption) => field.onChange(selectedOption ? selectedOption.value : null)}
                                    />
                                  )}
                                />
                              </div>
                              <div className="fieldboxthird">
                                <button
                                  type='button'
                                  onClick={() => deleteCAR(car.id)}
                                  className='button'
                                  style={{ backgroundColor: 'red', marginTop: '20px', width: 'auto', padding: '8px 16px' }}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    width: '100%', display: 'flex', justifyContent: 'space-between', boxSizing: 'border-box',
                    padding: '2px', marginTop: '10px'
                  }}>
                    <button type="submit" disabled={isSubmitting} className='button' style={{ backgroundColor: 'green' }}>
                      {isSubmitting ? 'Submitting...' : 'Submit'}
                    </button>
                    <button type="button" onClick={handleReset} disabled={isSubmitting} className='button' style={{ backgroundColor: 'white', color: 'black', border: '1px solid black' }}>
                      Reset
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </form>
        </>
      )}
    </>
  )
}

export default Planning
