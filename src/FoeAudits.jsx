import React, { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import { Box } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { grey } from '@mui/material/colors';
import { toast } from 'react-toastify';
import './App.css';
import './Entry.css';
import './FoeAudit.css';
import { customStyles, formatDateForInput } from './Utilities.jsx';
import {
  deleteFoeAudit,
  getFoeAuditWorkspace,
  saveFoeAudit
} from './assets/data/apiData';

const EMPTY_FORM = {
  siteId: '',
  auditAreaId: '',
  divisionId: '',
  manager: '',
  shift: '',
  customer: '',
  foeCategory: '',
  onProduct: '',
  auditDate: '',
  auditorName: '',
  toolBoxNumber: '',
  model: '',
  type: '',
  effectivity: '',
  auditNote: ''
};

const FOE_CATEGORY_OPTIONS = ['None', '1', '2', '3'];
const ON_PRODUCT_OPTIONS = ['NA', 'No', 'Yes'];
const GROUP_LABELS = {
  '1': 'FO In / On Assembly',
  '2': 'Product Protection',
  '3': 'Tool Accountability',
  '4': 'Housekeeping',
  '5': 'Hardware and Consumables'
};

const uniqueSorted = (values = []) => (
  [...new Set(values.filter((value) => value !== null && value !== undefined && String(value).trim() !== ''))]
    .sort((left, right) => String(left).localeCompare(String(right)))
);

const toDateInput = (value) => {
  if (!value) return '';
  try {
    return formatDateForInput(value);
  } catch {
    return String(value).slice(0, 10);
  }
};

const FoeAudits = () => {
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('New Audit');
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [rowSelectionModel, setRowSelectionModel] = useState({ type: 'include', ids: new Set() });
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [findingValues, setFindingValues] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const [reviewFilters, setReviewFilters] = useState({
    auditor: '',
    auditArea: '',
    team: '',
    site: ''
  });

  const loadWorkspace = async () => {
    setLoading(true);
    try {
      const data = await getFoeAuditWorkspace();
      setWorkspace(data);
      if (data?.currentUser) {
        setForm((current) => ({
          ...current,
          auditorName: data.currentUser.name || '',
          auditDate: current.auditDate || toDateInput(new Date())
        }));
      }
    } catch (error) {
      toast.error(error.message || 'Unable to load FOE audit data.');
      setWorkspace(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, []);

  const currentUser = workspace?.currentUser || null;
  const isLead = Boolean(currentUser?.leadSiteIds?.length);
  const modes = useMemo(
    () => ['New Audit', 'Edit Drafts', isLead ? 'Review and/or Edit Audits' : 'Review Audits'],
    [isLead]
  );

  useEffect(() => {
    if (!modes.includes(mode)) {
      setMode('New Audit');
    }
  }, [modes, mode]);

  const resetForm = (keepMode = true) => {
    setSelectedAudit(null);
    setRowSelectionModel({ type: 'include', ids: new Set() });
    setFindingValues({});
    setMissingFields([]);
    setForm({
      ...EMPTY_FORM,
      auditorName: currentUser?.name || '',
      auditDate: toDateInput(new Date())
    });
    if (!keepMode) {
      setMode('New Audit');
    }
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    resetForm(true);
    setReviewFilters({ auditor: '', auditArea: '', team: '', site: '' });
  };

  const accessibleSiteIds = useMemo(() => {
    const ids = [
      ...(currentUser?.approvedSiteIds || []),
      ...(currentUser?.leadSiteIds || [])
    ].map(Number);
    return new Set(ids);
  }, [currentUser]);

  const siteOptions = useMemo(() => {
    return (workspace?.sites || [])
      .filter((site) => {
        if (!accessibleSiteIds.has(Number(site.siteId))) return false;
        if (mode !== 'New Audit') return true;
        return Number(site.active) === 1;
      })
      .map((site) => ({
        value: Number(site.siteId),
        label: site.siteName || String(site.siteId)
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [workspace, accessibleSiteIds, mode]);

  const auditAreaOptions = useMemo(() => {
    return (workspace?.auditAreas || [])
      .filter((area) => !form.siteId || Number(area.parentSiteId) === Number(form.siteId))
      .filter((area) => mode !== 'New Audit' || Number(area.active) === 1)
      .map((area) => ({
        value: Number(area.auditAreaId),
        label: area.name || String(area.auditAreaId)
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [workspace, form.siteId, mode]);

  const divisionName = useMemo(() => {
    const division = (workspace?.divisions || []).find(
      (item) => Number(item.divisionId) === Number(form.divisionId)
    );
    return division?.divisionName || '';
  }, [workspace, form.divisionId]);

  const shiftOptions = useMemo(() => {
    return (workspace?.shifts || [])
      .filter((shift) => mode !== 'New Audit' || Number(shift.active) === 1)
      .map((shift) => ({ value: shift.shiftName, label: shift.shiftName }))
      .filter((option) => option.value)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [workspace, mode]);

  const customerOptions = useMemo(() => {
    return (workspace?.customers || [])
      .filter((customer) => mode !== 'New Audit' || Number(customer.active) === 1)
      .map((customer) => ({ value: customer.customerName, label: customer.customerName }))
      .filter((option) => option.value)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [workspace, mode]);

  const baseModeAudits = useMemo(() => {
    if (!workspace) return [];
    if (mode === 'Edit Drafts') return workspace.drafts || [];
    if (mode === 'Review and/or Edit Audits') return workspace.reviewAudits || [];
    if (mode === 'Review Audits') return workspace.myAudits || [];
    return [];
  }, [workspace, mode]);

  const filteredModeAudits = useMemo(() => {
    if (!mode.startsWith('Review')) return baseModeAudits;
    return baseModeAudits.filter((audit) => {
      if (reviewFilters.auditor && audit.auditorName !== reviewFilters.auditor) return false;
      if (reviewFilters.auditArea && audit.auditAreaName !== reviewFilters.auditArea) return false;
      if (reviewFilters.team && audit.auditAreaTeam !== reviewFilters.team) return false;
      if (reviewFilters.site && audit.siteName !== reviewFilters.site) return false;
      return true;
    });
  }, [baseModeAudits, mode, reviewFilters]);

  const reviewFilterOptions = useMemo(() => ({
    auditor: uniqueSorted(baseModeAudits.map((audit) => audit.auditorName)),
    auditArea: uniqueSorted(baseModeAudits.map((audit) => audit.auditAreaName)),
    team: uniqueSorted(baseModeAudits.map((audit) => audit.auditAreaTeam)),
    site: uniqueSorted(baseModeAudits.map((audit) => audit.siteName))
  }), [baseModeAudits]);

  const readOnly = mode === 'Review Audits';

  const loadSelectedAudit = (audit) => {
    if (!audit) {
      resetForm(true);
      return;
    }

    setSelectedAudit(audit);
    setMissingFields([]);
    setForm({
      siteId: audit.siteId ?? '',
      auditAreaId: audit.auditAreaId ?? '',
      divisionId: audit.divisionId ?? '',
      manager: audit.auditAreaManager || '',
      shift: audit.shift || '',
      customer: audit.customer || '',
      foeCategory: audit.foeCategory ?? '',
      onProduct: audit.onProduct || '',
      auditDate: toDateInput(audit.auditDate),
      auditorName: audit.auditorName || '',
      toolBoxNumber: audit.toolBoxNumber || '',
      model: audit.model || '',
      type: audit.type || '',
      effectivity: audit.effectivity || '',
      auditNote: audit.auditNote || ''
    });

    const nextFindings = {};
    (audit.findings || []).forEach((finding) => {
      nextFindings[String(finding.number)] = {
        quantity: Number(finding.quantity || 0),
        comment: finding.comment || ''
      };
    });
    setFindingValues(nextFindings);
  };

  const auditColumns = [
    { field: 'created', headerName: 'Created', minWidth: 165, flex: 0.8 },
    { field: 'title', headerName: 'Title', minWidth: 90, flex: 0.5 },
    { field: 'auditDate', headerName: 'Audit Date', minWidth: 120, flex: 0.7, valueGetter: (_value, row) => toDateInput(row.auditDate) },
    { field: 'auditorName', headerName: 'Auditor', minWidth: 160, flex: 1 },
    { field: 'siteName', headerName: 'Site', minWidth: 160, flex: 1 },
    { field: 'auditAreaName', headerName: 'Audit Area', minWidth: 180, flex: 1 },
    { field: 'auditAreaTeam', headerName: 'Team', minWidth: 150, flex: 0.9 },
    { field: 'auditNote', headerName: 'Audit Note', minWidth: 220, flex: 1.5 }
  ];

  const discrepancyGroups = useMemo(() => {
    const all = workspace?.discrepancyTypes || [];
    const groups = Object.keys(GROUP_LABELS).map((key) => ({
      key,
      label: GROUP_LABELS[key],
      rows: all.filter((row) => String(row.number || '').slice(0, 1) === key)
    }));
    const otherRows = all.filter((row) => String(row.number || '') === 'Undefined');
    return [...groups, { key: 'other', label: 'Other', rows: otherRows }];
  }, [workspace]);

  const changeFinding = (number, field, value) => {
    const key = String(number);
    setFindingValues((current) => ({
      ...current,
      [key]: {
        quantity: Number(current[key]?.quantity || 0),
        comment: current[key]?.comment || '',
        [field]: field === 'quantity' ? Math.max(0, Math.trunc(Number(value) || 0)) : value
      }
    }));
  };

  const changeSite = (selectedOption) => {
    const siteId = selectedOption?.value ?? '';
    const site = (workspace?.sites || []).find((item) => Number(item.siteId) === Number(siteId));
    setForm((current) => ({
      ...current,
      siteId,
      auditAreaId: '',
      divisionId: site?.parentDivisionId ?? '',
      manager: ''
    }));
  };

  const changeAuditArea = (selectedOption) => {
    const auditAreaId = selectedOption?.value ?? '';
    const area = (workspace?.auditAreas || []).find(
      (item) => Number(item.auditAreaId) === Number(auditAreaId)
    );
    setForm((current) => ({
      ...current,
      auditAreaId,
      manager: area?.manager || ''
    }));
  };

  useEffect(() => {
    if (mode !== 'New Audit' || form.siteId || siteOptions.length !== 1) return;
    const siteId = siteOptions[0].value;
    const site = (workspace?.sites || []).find(
      (item) => Number(item.siteId) === Number(siteId)
    );
    setForm((current) => ({
      ...current,
      siteId,
      auditAreaId: '',
      divisionId: site?.parentDivisionId ?? '',
      manager: ''
    }));
  }, [mode, form.siteId, siteOptions, workspace]);

  useEffect(() => {
    if (mode !== 'New Audit' || form.auditAreaId || auditAreaOptions.length !== 1) return;
    if (!form.siteId && siteOptions.length === 1) return;
    const auditAreaId = auditAreaOptions[0].value;
    const area = (workspace?.auditAreas || []).find(
      (item) => Number(item.auditAreaId) === Number(auditAreaId)
    );
    setForm((current) => ({
      ...current,
      auditAreaId,
      manager: area?.manager || ''
    }));
  }, [mode, form.auditAreaId, form.siteId, auditAreaOptions, siteOptions, workspace]);

  const validate = () => {
    const required = [
      ['Site', form.siteId],
      ['Audit Area', form.auditAreaId],
      ['Division', form.divisionId],
      ['FOE Category', form.foeCategory],
      ['Audit Date', form.auditDate]
    ];
    const missing = required
      .filter(([, value]) => value === null || value === undefined || value === '')
      .map(([label]) => label);
    if (!currentUser?.userId) missing.push('UserID');
    if ((form.auditNote || '').length > 350) missing.push('Audit Note (max 350 characters)');
    return missing;
  };

  const submitAudit = async (draft) => {
    if (readOnly || submitting) return;
    const validationErrors = draft ? [] : validate();
    setMissingFields(validationErrors);
    if (validationErrors.length > 0) {
      toast.error('Missing Required Fields: ' + validationErrors.join(', '));
      return;
    }

    const findings = (workspace?.discrepancyTypes || [])
      .map((definition) => {
        const entry = findingValues[String(definition.number)] || {};
        return {
          number: String(definition.number),
          quantity: Math.max(0, Number(entry.quantity || 0)),
          comment: entry.comment || '',
          foeElement: definition.foeElement ?? null,
          riskCategory: definition.riskCategory ?? null
        };
      })
      .filter((finding) => finding.quantity > 0);

    setSubmitting(true);
    try {
      const result = await saveFoeAudit({
        title: selectedAudit?.title ?? null,
        draft,
        siteId: form.siteId === '' ? null : Number(form.siteId),
        auditAreaId: form.auditAreaId === '' ? null : Number(form.auditAreaId),
        foeCategory: form.foeCategory,
        auditDate: form.auditDate,
        customer: form.customer || null,
        onProduct: form.onProduct || null,
        toolBoxNumber: form.toolBoxNumber || null,
        model: form.model || null,
        type: form.type || null,
        effectivity: form.effectivity || null,
        shift: form.shift || null,
        auditNote: form.auditNote || null,
        findings
      });

      toast.success(draft
        ? `You've saved draft audit ${result.title}`
        : `You've submitted audit ${result.title}`
      );
      await loadWorkspace();
      resetForm(true);
    } catch (error) {
      toast.error(error.message || 'Unable to save FOE audit.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAudit?.title || readOnly || submitting) return;
    setSubmitting(true);
    try {
      await deleteFoeAudit(selectedAudit.title);
      toast.success(`You've deleted ${selectedAudit.draft ? 'draft audit' : 'audit'} ${selectedAudit.title}`);
      await loadWorkspace();
      resetForm(true);
    } catch (error) {
      toast.error(error.message || 'Unable to delete FOE audit.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="entry-message">Loading FOE audit data...</div>;
  }

  if (!workspace?.currentUser) {
    return (
      <div className="entry-message">
        <h2>FOE Auditor Access Required</h2>
        <p>You are not listed as an active FOE auditor.</p>
      </div>
    );
  }

  const showSelectionGrid = mode !== 'New Audit';
  const showForm = mode === 'New Audit' || Boolean(selectedAudit);
  const activeSiteOption = siteOptions.find((option) => Number(option.value) === Number(form.siteId)) || null;
  const activeAuditAreaOption = auditAreaOptions.find((option) => Number(option.value) === Number(form.auditAreaId)) || null;

  return (
    <div className="foe-audit-page" style={{ width: '100%' }}>
      <div style={{ width: '100%', textAlign: 'left' }}>
        <h1>FOE/FA Audit Entry Tool</h1>
        <h2 style={{ marginTop: '3px' }}>
          Welcome {currentUser.name}.{' '}
          <a href={`mailto:walter.osborne@ngc.com?subject=${encodeURIComponent(`NGAT FOE user verification (${currentUser.myId || ''})`)}`}>
            Not you?
          </a>
        </h2>
      </div>

      <div className="section" style={{ border: '1px solid transparent', marginTop: 0, padding: 0 }}>
        <label className="sectiontitle" style={{ marginLeft: 0, marginTop: '10px' }}>Select Mode</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {modes.map((modeOption) => (
            <label key={modeOption} className="foe-mode-option">
              <input
                type="radio"
                name="foe-mode"
                value={modeOption}
                checked={mode === modeOption}
                onChange={() => handleModeChange(modeOption)}
              />
              <span>{modeOption}</span>
            </label>
          ))}
        </div>
        <p className="foe-mode-caption">Editing of completed audits only available to lead auditors.</p>
      </div>

      {mode.startsWith('Review') && (
        <div className="section">
          <label className="sectiontitle">Filters</label>
          <p className="foe-mode-caption">These filters narrow the audits available for review and are not part of the audit itself.</p>
          <div className="sectionrow">
            {[
              ['auditor', 'Auditor'],
              ['auditArea', 'Audit Area'],
              ['team', 'Team'],
              ['site', 'Site']
            ].map(([key, label]) => (
              <div className="fieldboxquarter" key={key}>
                <label>{label}</label>
                <Select
                  isClearable
                  options={(reviewFilterOptions[key] || []).map((value) => ({ value, label: value }))}
                  styles={customStyles}
                  value={reviewFilters[key] ? { value: reviewFilters[key], label: reviewFilters[key] } : null}
                  onChange={(option) => setReviewFilters((current) => ({ ...current, [key]: option?.value || '' }))}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {showSelectionGrid && (
        filteredModeAudits.length === 0 ? (
          <div className="entry-message" style={{ marginTop: '10px' }}>
            {mode === 'Edit Drafts'
              ? 'You do not have any audit drafts.'
              : 'No audits matched your search criteria.'}
          </div>
        ) : (
          <Box sx={{ height: 400, width: '100%', marginTop: '10px' }}>
            <DataGrid
              rows={filteredModeAudits}
              columns={auditColumns}
              checkboxSelection
              disableMultipleRowSelection
              getRowId={(row) => String(row.title)}
              rowSelectionModel={rowSelectionModel}
              pageSizeOptions={[5, 10, 20]}
              initialState={{ pagination: { paginationModel: { pageSize: 5, page: 0 } } }}
              onRowSelectionModelChange={(selectionModel) => {
                setRowSelectionModel(selectionModel);
                const ids = selectionModel?.ids ? Array.from(selectionModel.ids) : [];
                const selectedTitle = ids[0];
                const audit = filteredModeAudits.find((row) => String(row.title) === String(selectedTitle));
                if (audit) loadSelectedAudit(audit);
                else if (ids.length === 0) resetForm(true);
              }}
              sx={{
                '& .MuiDataGrid-row': {
                  bgcolor: (theme) => theme.palette.mode === 'light' ? grey[200] : grey[900]
                }
              }}
            />
          </Box>
        )
      )}

      {showSelectionGrid && selectedAudit && (
        <h2 style={{ marginTop: '8px' }}>Currently Editing Audit: {selectedAudit.title}</h2>
      )}

      {showForm && (
        <div className={readOnly ? 'foe-readonly-form' : ''}>
          <div className="section">
            <label className="sectiontitle">Audit Location</label>
            <div className="sectionrow">
              <div className="fieldboxquarter">
                <label>Site<span className="foe-required">*</span></label>
                <Select
                  isClearable
                  isDisabled={readOnly || (mode === 'New Audit' && siteOptions.length === 1)}
                  options={siteOptions}
                  styles={customStyles}
                  value={activeSiteOption}
                  onChange={changeSite}
                  placeholder="Site"
                />
              </div>
              <div className="fieldboxquarter">
                <label>Audit Area<span className="foe-required">*</span></label>
                <Select
                  isClearable
                  isDisabled={readOnly || (mode === 'New Audit' && auditAreaOptions.length === 1)}
                  options={auditAreaOptions}
                  styles={customStyles}
                  value={activeAuditAreaOption}
                  onChange={changeAuditArea}
                  placeholder="Audit Area"
                />
              </div>
              <div className="fieldboxquarter">
                <label>Division<span className="foe-required">*</span></label>
                <input className="textfield" value={divisionName} disabled />
              </div>
              <div className="fieldboxquarter">
                <label>Manager</label>
                <input className="textfield" value={form.manager || ''} disabled />
              </div>
            </div>
          </div>

          <div className="section">
            <label className="sectiontitle">Audit Details</label>
            <div className="sectionrow">
              <div className="fieldboxthird">
                <label>Shift</label>
                <Select
                  isClearable
                  isDisabled={readOnly}
                  options={shiftOptions}
                  styles={customStyles}
                  value={form.shift ? { value: form.shift, label: form.shift } : null}
                  onChange={(option) => setForm((current) => ({ ...current, shift: option?.value || '' }))}
                />
              </div>
              <div className="fieldboxthird">
                <label>Customer</label>
                <Select
                  isClearable
                  isDisabled={readOnly}
                  options={customerOptions}
                  styles={customStyles}
                  value={form.customer ? { value: form.customer, label: form.customer } : null}
                  onChange={(option) => setForm((current) => ({ ...current, customer: option?.value || '' }))}
                />
              </div>
              <div className="fieldboxthird">
                <label>FOE Category<span className="foe-required">*</span></label>
                <Select
                  isClearable
                  isDisabled={readOnly}
                  options={FOE_CATEGORY_OPTIONS.map((value) => ({ value, label: value }))}
                  styles={customStyles}
                  value={form.foeCategory ? { value: form.foeCategory, label: form.foeCategory } : null}
                  onChange={(option) => setForm((current) => ({ ...current, foeCategory: option?.value || '' }))}
                />
              </div>
            </div>
            <div className="sectionrow">
              <div className="fieldboxthird">
                <label>On Product</label>
                <Select
                  isClearable
                  isDisabled={readOnly}
                  options={ON_PRODUCT_OPTIONS.map((value) => ({ value, label: value }))}
                  styles={customStyles}
                  value={form.onProduct ? { value: form.onProduct, label: form.onProduct } : null}
                  onChange={(option) => setForm((current) => ({ ...current, onProduct: option?.value || '' }))}
                />
              </div>
              <div className="fieldboxthird">
                <label>Audit Date<span className="foe-required">*</span></label>
                <input
                  type="date"
                  className="datefield"
                  value={form.auditDate}
                  disabled={readOnly}
                  onChange={(event) => setForm((current) => ({ ...current, auditDate: event.target.value }))}
                />
              </div>
              <div className="fieldboxthird">
                <label>Auditor<span className="foe-required">*</span></label>
                <input className="textfield" value={form.auditorName || ''} disabled />
              </div>
            </div>
          </div>

          <div className="section">
            <label className="sectiontitle">Product Information</label>
            <div className="sectionrow">
              <div className="fieldboxhalf">
                <label>Tool Box Number</label>
                <input
                  className="textfield"
                  value={form.toolBoxNumber}
                  disabled={readOnly}
                  onChange={(event) => setForm((current) => ({ ...current, toolBoxNumber: event.target.value }))}
                />
              </div>
              <div className="fieldboxhalf">
                <label>Model</label>
                <input
                  className="textfield"
                  value={form.model}
                  disabled={readOnly}
                  onChange={(event) => setForm((current) => ({ ...current, model: event.target.value }))}
                />
              </div>
            </div>
            <div className="sectionrow">
              <div className="fieldboxhalf">
                <label>Type</label>
                <input
                  className="textfield"
                  value={form.type}
                  disabled={readOnly}
                  onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                />
              </div>
              <div className="fieldboxhalf">
                <label>Effectivity</label>
                <input
                  className="textfield"
                  value={form.effectivity}
                  disabled={readOnly}
                  onChange={(event) => setForm((current) => ({ ...current, effectivity: event.target.value }))}
                />
              </div>
            </div>
            <div className="sectionrow">
              <div className="fieldboxwhole">
                <label>Audit Note (350 Char. Max)</label>
                <textarea
                  className="foe-textarea"
                  value={form.auditNote}
                  disabled={readOnly}
                  maxLength={350}
                  onChange={(event) => setForm((current) => ({ ...current, auditNote: event.target.value }))}
                />
                <span className="foe-character-count">{(form.auditNote || '').length}/350</span>
              </div>
            </div>
          </div>

          {selectedAudit && (selectedAudit.findings || []).length > 0 && (
            <div className="section">
              <label className="sectiontitle">Finding Summary</label>
              <Box sx={{ height: 280, width: '100%' }}>
                <DataGrid
                  rows={(selectedAudit.findings || []).map((finding, index) => ({
                    ...finding,
                    id: finding.id || `${selectedAudit.title}-${index}`
                  }))}
                  columns={[
                    { field: 'id', headerName: 'ID', minWidth: 90, flex: 0.45 },
                    { field: 'title', headerName: 'Title', minWidth: 90, flex: 0.45 },
                    { field: 'number', headerName: 'Discrepancy Type Number', minWidth: 190, flex: 0.8 },
                    { field: 'quantity', headerName: 'Discrepancy Type Quantity', minWidth: 190, flex: 0.8 },
                    { field: 'comment', headerName: 'Discrepancy Type Comment', minWidth: 260, flex: 1.4 },
                    { field: 'foeElement', headerName: 'Discrepancy Type FOE Element', minWidth: 210, flex: 1 },
                    { field: 'riskCategory', headerName: 'Discrepancy Type Risk Category', minWidth: 220, flex: 1 }
                  ]}
                  pageSizeOptions={[5, 10, 20]}
                  initialState={{ pagination: { paginationModel: { pageSize: 5, page: 0 } } }}
                  disableRowSelectionOnClick
                />
              </Box>
            </div>
          )}

          <div className="section">
            <label className="sectiontitle">Discrepancy Types</label>
            {discrepancyGroups.map((group) => (
              <div key={group.key} className="foe-discrepancy-group">
                <h2>{group.key === 'other' ? 'Other' : `${group.key}: ${group.label}`}</h2>
                {group.rows.length === 0 ? (
                  <p className="foe-mode-caption">No discrepancy types configured.</p>
                ) : group.rows.map((row) => {
                  const key = String(row.number);
                  const entry = findingValues[key] || { quantity: 0, comment: '' };
                  return (
                    <div key={key} className="foe-discrepancy-card">
                      <div className="foe-discrepancy-description">{row.number} - {row.description}</div>
                      <label>Qty</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="textfield"
                        value={entry.quantity || 0}
                        disabled={readOnly}
                        onChange={(event) => changeFinding(key, 'quantity', event.target.value)}
                      />
                      {Number(entry.quantity || 0) > 0 && (
                        <>
                          <label>Comment</label>
                          <textarea
                            className="foe-textarea foe-comment"
                            value={entry.comment || ''}
                            disabled={readOnly}
                            onChange={(event) => changeFinding(key, 'comment', event.target.value)}
                          />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {missingFields.length > 0 && (
            <p className="fielderror">Missing Required Fields: {missingFields.join(', ')}</p>
          )}

          {!readOnly && (
            <div className="foe-action-row">
              <button
                type="button"
                className="button"
                style={{ backgroundColor: '#169c2f' }}
                disabled={submitting}
                onClick={() => submitAudit(false)}
              >
                Submit
              </button>

              {(mode === 'New Audit' || mode === 'Edit Drafts') && (
                <button
                  type="button"
                  className="button"
                  style={{ backgroundColor: '#0000d8' }}
                  disabled={submitting}
                  onClick={() => submitAudit(true)}
                >
                  Save Draft
                </button>
              )}

              {selectedAudit && (mode === 'Edit Drafts' || mode === 'Review and/or Edit Audits') && (
                <button
                  type="button"
                  className="button"
                  style={{ backgroundColor: '#c62828' }}
                  disabled={submitting}
                  onClick={handleDelete}
                >
                  Delete {mode === 'Edit Drafts' ? 'Draft' : 'Audit'}
                </button>
              )}

              <button
                type="button"
                className="button"
                style={{ backgroundColor: '#e79200' }}
                disabled={submitting}
                onClick={() => resetForm(true)}
              >
                Reset fields
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FoeAudits;
