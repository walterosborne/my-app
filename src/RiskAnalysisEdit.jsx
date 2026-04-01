import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import Box from '@mui/material/Box';
import { grey } from '@mui/material/colors';
import { DataGrid } from '@mui/x-data-grid';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import './Entry.css';
import './AdminMenu.css';
import { customStyles } from './Utilities.jsx';
import RiskFactorAssignment from './RiskFactorAssignment.jsx';
import {
  getCurrentUser,
  deleteRiskRatings,
  getRiskRatings,
  getSectors,
  getDivisions,
  getSites,
  getBusinessUnits,
  getOperatingUnits,
  getPrograms,
  saveRiskRatings
} from './assets/data/apiData';
import { ORG_GROUP_OPTIONS, buildOrgTargetOptions, getOrgGroupLabel, getOrgTargetLabel } from './riskAnalysisUtils.js';

const TOAST_OPTIONS = {
  progressStyle: { backgroundColor: '#f44336' },
  style: { borderLeft: '4px solid #f44336' }
};

const SUCCESS_TOAST_OPTIONS = {
  progressStyle: { backgroundColor: '#2e7d32' },
  style: { borderLeft: '4px solid #2e7d32' }
};

const EMPTY_RISK_SELECTION = {
  selectedRiskFactors: [],
  riskRatings: {},
  ratingsPayload: []
};

function RiskAnalysisEdit() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedAction, setSelectedAction] = useState('New');
  const [savedRiskRecords, setSavedRiskRecords] = useState([]);
  const [editingRecordKey, setEditingRecordKey] = useState(null);
  const [rowSelectionModel, setRowSelectionModel] = useState({
    type: 'include',
    ids: new Set()
  });
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10
  });
  const [sectorsList, setSectorsList] = useState([]);
  const [divisionsList, setDivisionsList] = useState([]);
  const [sitesList, setSitesList] = useState([]);
  const [businessUnitsList, setBusinessUnitsList] = useState([]);
  const [operatingUnitsList, setOperatingUnitsList] = useState([]);
  const [programsList, setProgramsList] = useState([]);
  const [riskTypeId, setRiskTypeId] = useState(null);
  const [targetId, setTargetId] = useState(null);
  const [processArea, setProcessArea] = useState('');
  const [selectedYear, setSelectedYear] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [riskSelection, setRiskSelection] = useState(EMPTY_RISK_SELECTION);
  const [submitting, setSubmitting] = useState(false);
  const [assignmentResetKey, setAssignmentResetKey] = useState(0);

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

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const [userData, riskRatingsData, sectors, divisions, sites, businessUnits, operatingUnits, programs] = await Promise.all([
          getCurrentUser(),
          getRiskRatings(),
          getSectors(),
          getDivisions(),
          getSites(),
          getBusinessUnits(),
          getOperatingUnits(),
          getPrograms()
        ]);

        if (!mounted) return;
        setCurrentUser(userData?.name && userData.name !== 'User' ? userData : userData);
        setSavedRiskRecords(riskRatingsData);
        setSectorsList(sectors);
        setDivisionsList(divisions);
        setSitesList(sites);
        setBusinessUnitsList(businessUnits);
        setOperatingUnitsList(operatingUnits);
        setProgramsList(programs);
      } catch (error) {
        console.error('Error loading risk analysis data:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const reloadSavedRiskRecords = async () => {
    try {
      const riskRatingsData = await getRiskRatings();
      setSavedRiskRecords(riskRatingsData);
    } catch (error) {
      console.error('Error reloading risk analysis records:', error);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (currentUser?.isAdmin) return;
    const timeout = setTimeout(() => {
      navigate('/audit');
    }, 1200);
    return () => clearTimeout(timeout);
  }, [loading, currentUser, navigate]);

  const selectedOrgGroup = useMemo(
    () => ORG_GROUP_OPTIONS.find((option) => option.value === Number(riskTypeId)) || null,
    [riskTypeId]
  );

  const editableYears = useMemo(
    () => [currentYear - 1, currentYear, currentYear + 1],
    [currentYear]
  );

  const yearOptions = useMemo(
    () => editableYears.map((year) => ({ value: year, label: String(year) })),
    [editableYears]
  );

  const savedEntries = useMemo(() => {
    const grouped = new Map();

    savedRiskRecords.forEach((row) => {
      const targetIdForRow =
        Number(row.risktypeid) === 2 ? row.sectorid
          : Number(row.risktypeid) === 3 ? row.divisionid
            : Number(row.risktypeid) === 4 ? row.siteid
              : Number(row.risktypeid) === 5 ? row.buid
                : Number(row.risktypeid) === 6 ? row.ouid
                  : Number(row.risktypeid) === 7 ? row.programid
                    : null;
      const normalizedProcessArea = String(row.processarea || '').trim();
      const rowYear = Number(row.year);
      const key = `${row.risktypeid}-${targetIdForRow}-${normalizedProcessArea}-${rowYear}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          id: key,
          riskTypeId: Number(row.risktypeid),
          targetId: Number(targetIdForRow),
          processArea: normalizedProcessArea,
          year: rowYear,
          orgGroupLabel: getOrgGroupLabel(row.risktypeid),
          orgTargetLabel: getOrgTargetLabel({
            riskTypeId: row.risktypeid,
            sectorId: row.sectorid,
            divisionId: row.divisionid,
            siteId: row.siteid,
            buId: row.buid,
            ouId: row.ouid,
            programId: row.programid,
            sectorsList,
            divisionsList,
            sitesList,
            businessUnitsList,
            operatingUnitsList,
            programsList
          }),
          ratingsCount: 0
        });
      }
      grouped.get(key).ratingsCount += 1;
    });

    return Array.from(grouped.values()).sort((a, b) => {
      if (Number(a.year) !== Number(b.year)) return Number(b.year) - Number(a.year);
      const groupCompare = a.orgGroupLabel.localeCompare(b.orgGroupLabel);
      if (groupCompare !== 0) return groupCompare;
      const targetCompare = (a.orgTargetLabel || '').localeCompare(b.orgTargetLabel || '');
      if (targetCompare !== 0) return targetCompare;
      return (a.processArea || '').localeCompare(b.processArea || '');
    });
  }, [savedRiskRecords, sectorsList, divisionsList, sitesList, businessUnitsList, operatingUnitsList, programsList]);

  const editingRecord = useMemo(
    () => savedEntries.find((entry) => entry.id === editingRecordKey) || null,
    [savedEntries, editingRecordKey]
  );

  const editColumns = useMemo(() => ([
    { field: 'orgGroupLabel', headerName: 'Org Group Level', flex: 1, minWidth: 180 },
    { field: 'orgTargetLabel', headerName: 'Org Group', flex: 1.4, minWidth: 220 },
    { field: 'processArea', headerName: 'Process Area', flex: 1.3, minWidth: 220 },
    { field: 'year', headerName: 'Year', width: 110, type: 'number' }
  ]), []);

  const duplicateProcessAreaInNewMode = useMemo(() => {
    if (selectedAction !== 'New') return false;
    if (!riskTypeId || !targetId || !processArea.trim() || !selectedYear) return false;
    const normalizedProcessArea = processArea.trim().toLowerCase();
    return savedEntries.some((entry) =>
      Number(entry.riskTypeId) === Number(riskTypeId)
      && Number(entry.targetId) === Number(targetId)
      && Number(entry.year) === Number(selectedYear)
      && String(entry.processArea || '').trim().toLowerCase() === normalizedProcessArea
    );
  }, [selectedAction, riskTypeId, targetId, processArea, selectedYear, savedEntries]);

  const duplicateProcessAreaInEditMode = useMemo(() => {
    if (selectedAction !== 'Edit' || !editingRecord) return false;
    if (!riskTypeId || !targetId || !processArea.trim() || !selectedYear) return false;
    const normalizedProcessArea = processArea.trim().toLowerCase();
    return savedEntries.some((entry) =>
      entry.id !== editingRecord.id
      && Number(entry.riskTypeId) === Number(riskTypeId)
      && Number(entry.targetId) === Number(targetId)
      && Number(entry.year) === Number(selectedYear)
      && String(entry.processArea || '').trim().toLowerCase() === normalizedProcessArea
    );
  }, [selectedAction, editingRecord, riskTypeId, targetId, processArea, selectedYear, savedEntries]);

  const selectedYearTooOld = useMemo(() => {
    if (selectedAction !== 'Edit' || !editingRecord) return false;
    const parsedYear = Number(selectedYear);
    return Number.isInteger(parsedYear) && !editableYears.includes(parsedYear);
  }, [selectedAction, editingRecord, selectedYear, editableYears]);

  const targetOptions = useMemo(() => buildOrgTargetOptions({
    riskTypeId,
    sectorsList,
    divisionsList,
    sitesList,
    businessUnitsList,
    operatingUnitsList,
    programsList
  }), [riskTypeId, sectorsList, divisionsList, sitesList, businessUnitsList, operatingUnitsList, programsList]);

  const mailto = `mailto:walter.osborne@ngc.com?subject=${encodeURIComponent(
    currentUser?.myId ? `NGAT user verification (${currentUser.myId})` : 'NGAT user verification'
  )}&body=${encodeURIComponent(
    currentUser?.myId
      ? `Hi Walter, NGAT is registering me with the MyID ${currentUser.myId}, which is incorrect.`
      : 'Hi Walter, NGAT is not registering my MyID correctly.'
  )}`;

  useEffect(() => {
    if (selectedAction === 'New') {
      setEditingRecordKey(null);
      setRowSelectionModel({ type: 'include', ids: new Set() });
      setRiskTypeId(null);
      setTargetId(null);
      setProcessArea('');
      setSelectedYear(null);
      setFieldErrors({});
      setRiskSelection(EMPTY_RISK_SELECTION);
      setAssignmentResetKey((value) => value + 1);
      return;
    }

    if (selectedAction === 'Edit' && editingRecord) {
      setRiskTypeId(editingRecord.riskTypeId);
      setTargetId(editingRecord.targetId);
      setProcessArea(editingRecord.processArea);
      setSelectedYear(editingRecord.year);
      setFieldErrors({});
      setRiskSelection(EMPTY_RISK_SELECTION);
      setAssignmentResetKey((value) => value + 1);
      return;
    }

    if (selectedAction === 'Edit') {
      setRiskTypeId(null);
      setTargetId(null);
      setProcessArea('');
      setSelectedYear(null);
      setFieldErrors({});
      setRiskSelection(EMPTY_RISK_SELECTION);
      setAssignmentResetKey((value) => value + 1);
    }
  }, [selectedAction, editingRecord]);

  useEffect(() => {
    if (selectedAction !== 'Edit') return;
    const nextModel = editingRecordKey
      ? { type: 'include', ids: new Set([editingRecordKey]) }
      : { type: 'include', ids: new Set() };
    setRowSelectionModel((prev) => (isSameSelectionModel(nextModel, prev) ? prev : nextModel));
  }, [selectedAction, editingRecordKey]);

  const resetForm = () => {
    setFieldErrors({});
    if (selectedAction === 'Edit' && editingRecord) {
      setRiskTypeId(editingRecord.riskTypeId);
      setTargetId(editingRecord.targetId);
      setProcessArea(editingRecord.processArea);
      setSelectedYear(editingRecord.year);
    } else {
      setRiskTypeId(null);
      setTargetId(null);
      setProcessArea('');
      setSelectedYear(null);
    }
    setRiskSelection(EMPTY_RISK_SELECTION);
    setAssignmentResetKey((value) => value + 1);
  };

  const handleSubmit = async () => {
    const errors = {};
    if (!riskTypeId) errors.riskTypeId = 'Org group is required.';
    if (!targetId) errors.targetId = 'Specific org group is required.';
    if (!processArea.trim()) errors.processArea = 'Process area is required.';
    if (!selectedYear) errors.year = 'Year is required.';
    if (duplicateProcessAreaInNewMode) {
      errors.processArea = 'That process area already exists for the selected org group and year.';
    }
    if (duplicateProcessAreaInEditMode) {
      errors.processArea = 'That process area already exists for the selected org group and year.';
    }
    if (selectedYearTooOld) {
      errors.year = 'This saved risk analysis is too old to edit.';
    }

    const incompleteRatings = Object.values(riskSelection.riskRatings || {}).filter((value) => value === '');
    if (incompleteRatings.length > 0) {
      errors.ratings = 'Select a rating for each checked process area.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error('Please fill out all required fields.', TOAST_OPTIONS);
      return;
    }

    setSubmitting(true);
    setFieldErrors({});

    try {
      const yearChangedInEditMode = selectedAction === 'Edit'
        && editingRecord
        && Number(editingRecord.year) !== Number(selectedYear);

      await saveRiskRatings({
        riskTypeId: Number(riskTypeId),
        targetId: Number(targetId),
        processArea: processArea.trim(),
        year: Number(selectedYear),
        ratings: riskSelection.ratingsPayload || []
      });

      if (yearChangedInEditMode) {
        await deleteRiskRatings({
          riskTypeId: Number(editingRecord.riskTypeId),
          targetId: Number(editingRecord.targetId),
          processArea: editingRecord.processArea,
          year: Number(editingRecord.year)
        });
      }

      await reloadSavedRiskRecords();
      toast.success('Submitted!', SUCCESS_TOAST_OPTIONS);
      if (selectedAction === 'New') {
        resetForm();
      } else {
        setEditingRecordKey(`${riskTypeId}-${targetId}-${processArea.trim()}-${Number(selectedYear)}`);
        setRiskSelection(EMPTY_RISK_SELECTION);
        setAssignmentResetKey((value) => value + 1);
      }
    } catch (error) {
      const message = error.message || 'Failed to save risk analysis.';
      toast.error(message, TOAST_OPTIONS);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingRecord) return;

    setSubmitting(true);
    setFieldErrors({});
    try {
      await deleteRiskRatings({
        riskTypeId: Number(editingRecord.riskTypeId),
        targetId: Number(editingRecord.targetId),
        processArea: editingRecord.processArea,
        year: Number(editingRecord.year)
      });
      await reloadSavedRiskRecords();
      setEditingRecordKey(null);
      setRiskTypeId(null);
      setTargetId(null);
      setProcessArea('');
      setSelectedYear(null);
      setRiskSelection(EMPTY_RISK_SELECTION);
      setAssignmentResetKey((value) => value + 1);
      toast.success('Deleted!', SUCCESS_TOAST_OPTIONS);
    } catch (error) {
      toast.error(error.message || 'Failed to delete risk analysis.', TOAST_OPTIONS);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="entry-page">
        <div className="entry-container">
          <div className="entry-message">Loading risk analysis...</div>
        </div>
      </div>
    );
  }

  if (!currentUser.isAdmin) {
    return (
      <div className="entry-page">
        <div className="entry-container">
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            You do not have admin access. Redirecting...
            <div style={{ marginTop: '1rem' }}>
              <button
                type="button"
                className="button"
                style={{ backgroundColor: '#0066cc', width: '200px' }}
                onClick={() => navigate('/audit')}
              >
                View My Audits
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="entry-page">
      <div className="entry-container">
        <div className="tool-page-header">
          <p className="tool-page-subtitle">Tools · Risk Analysis</p>
          <h1 className="tool-page-title">Edit Risk Analysis</h1>
          {currentUser?.name && currentUser.name !== 'User' && (
            <h2 style={{ marginTop: '3px' }}>
              Welcome {currentUser.name}.{' '}
              <a href={mailto} target="_blank" rel="noreferrer">
                Not you?
              </a>
            </h2>
          )}
          <button
            type="button"
            className="admin-secondary"
            style={{ position: 'absolute', top: '0', right: '0', minWidth: '180px' }}
            onClick={() => navigate('/risk-analysis/view')}
          >
            View Previous Responses
          </button>
        </div>

        <div className="section" style={{ marginTop: '0px' }}>
          <div className="sectionrow" style={{ gap: '16px', alignItems: 'flex-end' }}>
            <div className="fieldboxwhole">
              <label className="sectiontitle" style={{ marginLeft: '0px', marginTop: '0px' }}>Action</label>
              <select
                className="textfield"
                value={selectedAction}
                onChange={(event) => setSelectedAction(event.target.value)}
              >
                <option value="New">New</option>
                <option value="Edit">Edit</option>
              </select>
            </div>
          </div>
        </div>

        {selectedAction === 'Edit' && (
          <div className="admin-edit-table-wrapper" style={{ marginTop: '10px' }}>
            <p className="admin-editing-label">Select a saved process area to edit</p>
            <Box sx={{ height: 420, width: '100%' }}>
              <DataGrid
                rows={savedEntries}
                columns={editColumns}
                checkboxSelection
                disableMultipleRowSelection
                disableColumnSelector
                disableDensitySelector
                rowSelectionModel={rowSelectionModel}
                pageSizeOptions={[5, 10, 20]}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                showToolbar
                slotProps={{
                  toolbar: {
                    showQuickFilter: true,
                    csvOptions: { disableToolbarButton: true },
                    printOptions: { disableToolbarButton: true },
                    excelOptions: { disableToolbarButton: true }
                  }
                }}
                getRowSpacing={(params) => ({
                  top: params.isFirstVisible ? 0 : 5,
                  bottom: params.isLastVisible ? 0 : 5,
                })}
                onRowSelectionModelChange={(selectionModel) => {
                  if (!selectionModel?.ids) return;
                  if (isSameSelectionModel(selectionModel, rowSelectionModel)) return;
                  setRowSelectionModel(selectionModel);
                  if (selectionModel.ids.size > 0) {
                    setEditingRecordKey(Array.from(selectionModel.ids)[0]);
                  } else {
                    setEditingRecordKey(null);
                  }
                }}
                sx={{
                  '& .MuiDataGrid-row': {
                    bgcolor: (theme) => theme.palette.mode === 'light' ? grey[200] : grey[900],
                  },
                }}
              />
            </Box>
          </div>
        )}

        {selectedAction === 'Edit' && editingRecord && (
          <p className="admin-editing-tag">
            Currently editing: {editingRecord.orgTargetLabel} - {editingRecord.processArea} ({editingRecord.year})
          </p>
        )}

        {(selectedAction === 'New' || editingRecord) && (
          <>
        <div className="section">
          <label className="sectiontitle" style={{ marginLeft: '0px' }}>Organization</label>
          <div className="sectionrow" style={{ gap: '16px' }}>
            <div className="fieldboxquarter">
              <label>
                Org Group<span style={{ color: 'red' }}>*</span>
              </label>
              <Select
                value={selectedOrgGroup}
                onChange={(selectedOption) => {
                  setRiskTypeId(selectedOption ? selectedOption.value : null);
                  setTargetId(null);
                  setFieldErrors((prev) => ({ ...prev, riskTypeId: '', targetId: '' }));
                }}
                options={ORG_GROUP_OPTIONS}
                styles={customStyles}
                placeholder="Select Org Group"
                isClearable
                isDisabled={selectedAction === 'Edit'}
              />
              {fieldErrors.riskTypeId && <p className="fielderror">{fieldErrors.riskTypeId}</p>}
            </div>

            <div className="fieldboxquarter">
              <label>
                Specific Org Group<span style={{ color: 'red' }}>*</span>
              </label>
              <Select
                value={targetOptions.find((option) => Number(option.value) === Number(targetId)) || null}
                onChange={(selectedOption) => {
                  setTargetId(selectedOption ? selectedOption.value : null);
                  setFieldErrors((prev) => ({ ...prev, targetId: '' }));
                }}
                options={targetOptions}
                styles={customStyles}
                placeholder={selectedOrgGroup ? `Select ${selectedOrgGroup.label}` : 'Select Org Group First'}
                isClearable
                isDisabled={!riskTypeId || selectedAction === 'Edit'}
              />
              {fieldErrors.targetId && <p className="fielderror">{fieldErrors.targetId}</p>}
            </div>

            <div className="fieldboxquarter">
              <label>
                Process Area<span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                className="textfield"
                placeholder="Enter process area"
                value={processArea}
                onChange={(event) => {
                  setProcessArea(event.target.value);
                  setFieldErrors((prev) => ({ ...prev, processArea: '' }));
                }}
                disabled={selectedAction === 'Edit'}
              />
              {(fieldErrors.processArea || duplicateProcessAreaInNewMode || duplicateProcessAreaInEditMode) && (
                <p className="fielderror">
                  {fieldErrors.processArea || 'That process area already exists for the selected org group and year.'}
                </p>
              )}
            </div>

            <div className="fieldboxquarter">
              <label>
                Year<span style={{ color: 'red' }}>*</span>
              </label>
              <Select
                value={selectedYear !== null && selectedYear !== undefined
                  ? { value: Number(selectedYear), label: String(selectedYear) }
                  : null}
                onChange={(selectedOption) => {
                  setSelectedYear(selectedOption ? selectedOption.value : null);
                  setFieldErrors((prev) => ({ ...prev, year: '' }));
                }}
                options={yearOptions}
                styles={customStyles}
                placeholder="Select Year"
                isClearable
                isDisabled={selectedAction === 'Edit' && selectedYearTooOld}
              />
              {(fieldErrors.year || selectedYearTooOld) && (
                <p className="fielderror">
                  {fieldErrors.year || 'This saved risk analysis is too old to edit.'}
                </p>
              )}
            </div>
          </div>
        </div>

        {riskTypeId && targetId && processArea.trim() && selectedYear && !duplicateProcessAreaInNewMode && !duplicateProcessAreaInEditMode && !selectedYearTooOld && (
          <>
            <RiskFactorAssignment
              key={assignmentResetKey}
              riskTypeId={riskTypeId}
              targetId={targetId}
              processArea={processArea.trim()}
              year={selectedYear}
              onChange={setRiskSelection}
              title="Risk Factors"
            />
            {fieldErrors.ratings && <p className="fielderror">{fieldErrors.ratings}</p>}
            <div className="admin-button-row" style={{ width: '100%', marginTop: '16px' }}>
              <button
                type="button"
                className="admin-primary"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting
                  ? selectedAction === 'Edit'
                    ? 'Submitting Changes...'
                    : 'Submitting...'
                  : selectedAction === 'Edit'
                    ? 'Submit Changes'
                    : 'Submit'}
              </button>
              {selectedAction === 'Edit' && (
                <button
                  type="button"
                  className="admin-info"
                  onClick={handleDelete}
                  disabled={submitting}
                >
                  Delete
                </button>
              )}
              <button
                type="button"
                className="admin-secondary"
                onClick={resetForm}
                disabled={submitting}
              >
                Reset
              </button>
            </div>
          </>
        )}
        {selectedAction === 'Edit' && editingRecord && selectedYearTooOld && (
          <div className="admin-button-row" style={{ width: '100%', marginTop: '16px' }}>
            <button
              type="button"
              className="admin-info"
              onClick={handleDelete}
              disabled={submitting}
            >
              Delete
            </button>
            <button
              type="button"
              className="admin-secondary"
              onClick={resetForm}
              disabled={submitting}
            >
              Reset
            </button>
          </div>
        )}
        {selectedAction === 'New' && riskTypeId && targetId && processArea.trim() && selectedYear && duplicateProcessAreaInNewMode && (
          <div className="admin-button-row" style={{ width: '100%', marginTop: '16px' }}>
            <button
              type="button"
              className="admin-secondary"
              onClick={resetForm}
              disabled={submitting}
            >
              Reset
            </button>
          </div>
        )}
        {selectedAction === 'Edit' && riskTypeId && targetId && processArea.trim() && selectedYear && duplicateProcessAreaInEditMode && !selectedYearTooOld && (
          <div className="admin-button-row" style={{ width: '100%', marginTop: '16px' }}>
            <button
              type="button"
              className="admin-info"
              onClick={handleDelete}
              disabled={submitting}
            >
              Delete
            </button>
            <button
              type="button"
              className="admin-secondary"
              onClick={resetForm}
              disabled={submitting}
            >
              Reset
            </button>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}

export default RiskAnalysisEdit;
