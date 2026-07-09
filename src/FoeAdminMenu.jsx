import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { API_BASE, getCurrentUser, getFoeAuditAreas, getFoeAuditors, getFoeCustomers, getFoeDivisions, getFoeShifts, getFoeSites } from './assets/data/apiData';
import './Entry.css';
import './AdminMenu.css';
import FoeAuditAreasSection from './components/admin/FoeAuditAreasSection';
import FoeAuditorsSection from './components/admin/FoeAuditorsSection';
import FoeCustomersSection from './components/admin/FoeCustomersSection';
import FoeDivisionsSection from './components/admin/FoeDivisionsSection';
import FoeShiftsSection from './components/admin/FoeShiftsSection';
import FoeSitesSection from './components/admin/FoeSitesSection';

const DROPDOWN_OPTIONS = ['Edit Audit Areas', 'Edit Auditors', 'Edit Customers', 'Edit Divisions', 'Edit Shifts', 'Edit Sites'];
const ACTION_OPTIONS = ['New', 'Edit'];
const CUSTOMER_ACTION_OPTIONS = ['New', 'Edit'];
const DIVISION_ACTION_OPTIONS = ['New', 'Edit'];
const SHIFT_ACTION_OPTIONS = ['New', 'Edit'];
const TOAST_OPTIONS = {
    progressStyle: { backgroundColor: '#f44336' },
    style: { borderLeft: '4px solid #f44336' }
};
const SUCCESS_TOAST_OPTIONS = {
    progressStyle: { backgroundColor: '#1f8a3f' },
    style: { borderLeft: '4px solid #16663d' }
};

const FoeAdminMenu = () => {
    const [currentUser, setCurrentUser] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [selectedOption, setSelectedOption] = React.useState('');
    const [selectedAction, setSelectedAction] = React.useState(ACTION_OPTIONS[0]);
    const [foeSitesList, setFoeSitesList] = React.useState([]);
    const [auditAreasList, setAuditAreasList] = React.useState([]);
    const [editingAuditArea, setEditingAuditArea] = React.useState(null);
    const [nameInput, setNameInput] = React.useState('');
    const [parentSiteId, setParentSiteId] = React.useState('');
    const [teamInput, setTeamInput] = React.useState('');
    const [managerInput, setManagerInput] = React.useState('');
    const [includeArchivedAuditAreas, setIncludeArchivedAuditAreas] = React.useState(false);
    const [submissionMessage, setSubmissionMessage] = React.useState('');
    const [submissionError, setSubmissionError] = React.useState('');
    const [fieldErrors, setFieldErrors] = React.useState({});
    const [submitting, setSubmitting] = React.useState(false);
    const [foeAuditorsList, setFoeAuditorsList] = React.useState([]);
    const [editingFoeAuditor, setEditingFoeAuditor] = React.useState(null);
    const [auditorMyIdInput, setAuditorMyIdInput] = React.useState('');
    const [auditorNameInput, setAuditorNameInput] = React.useState('');
    const [approvedSiteIds, setApprovedSiteIds] = React.useState([]);
    const [includeArchivedFoeAuditors, setIncludeArchivedFoeAuditors] = React.useState(false);
    const [auditorSubmissionMessage, setAuditorSubmissionMessage] = React.useState('');
    const [auditorSubmissionError, setAuditorSubmissionError] = React.useState('');
    const [auditorFieldErrors, setAuditorFieldErrors] = React.useState({});
    const [auditorSubmitting, setAuditorSubmitting] = React.useState(false);
    const [foeCustomersList, setFoeCustomersList] = React.useState([]);
    const [selectedCustomerAction, setSelectedCustomerAction] = React.useState(CUSTOMER_ACTION_OPTIONS[0]);
    const [selectedFoeCustomer, setSelectedFoeCustomer] = React.useState(null);
    const [includeArchivedFoeCustomers, setIncludeArchivedFoeCustomers] = React.useState(false);
    const [customerInput, setCustomerInput] = React.useState('');
    const [customerSubmissionMessage, setCustomerSubmissionMessage] = React.useState('');
    const [customerSubmissionError, setCustomerSubmissionError] = React.useState('');
    const [customerFieldErrors, setCustomerFieldErrors] = React.useState({});
    const [customerSubmitting, setCustomerSubmitting] = React.useState(false);
    const [foeDivisionsList, setFoeDivisionsList] = React.useState([]);
    const [selectedDivisionAction, setSelectedDivisionAction] = React.useState(DIVISION_ACTION_OPTIONS[0]);
    const [selectedFoeDivision, setSelectedFoeDivision] = React.useState(null);
    const [includeArchivedFoeDivisions, setIncludeArchivedFoeDivisions] = React.useState(false);
    const [divisionInput, setDivisionInput] = React.useState('');
    const [divisionSubmissionMessage, setDivisionSubmissionMessage] = React.useState('');
    const [divisionSubmissionError, setDivisionSubmissionError] = React.useState('');
    const [divisionFieldErrors, setDivisionFieldErrors] = React.useState({});
    const [divisionSubmitting, setDivisionSubmitting] = React.useState(false);
    const [foeShiftsList, setFoeShiftsList] = React.useState([]);
    const [selectedShiftAction, setSelectedShiftAction] = React.useState(SHIFT_ACTION_OPTIONS[0]);
    const [selectedFoeShift, setSelectedFoeShift] = React.useState(null);
    const [includeArchivedFoeShifts, setIncludeArchivedFoeShifts] = React.useState(false);
    const [shiftInput, setShiftInput] = React.useState('');
    const [shiftSubmissionMessage, setShiftSubmissionMessage] = React.useState('');
    const [shiftSubmissionError, setShiftSubmissionError] = React.useState('');
    const [shiftFieldErrors, setShiftFieldErrors] = React.useState({});
    const [shiftSubmitting, setShiftSubmitting] = React.useState(false);
    const [editingFoeSite, setEditingFoeSite] = React.useState(null);
    const [siteInput, setSiteInput] = React.useState('');
    const [siteParentDivisionId, setSiteParentDivisionId] = React.useState('');
    const [siteLeadAuditorIds, setSiteLeadAuditorIds] = React.useState([]);
    const [siteAuditorIds, setSiteAuditorIds] = React.useState([]);
    const [includeArchivedFoeSites, setIncludeArchivedFoeSites] = React.useState(false);
    const [siteSubmissionMessage, setSiteSubmissionMessage] = React.useState('');
    const [siteSubmissionError, setSiteSubmissionError] = React.useState('');
    const [siteFieldErrors, setSiteFieldErrors] = React.useState({});
    const [siteSubmitting, setSiteSubmitting] = React.useState(false);
    const navigate = useNavigate();

    React.useEffect(() => {
        let cancelled = false;

        async function loadCurrentUser() {
            try {
                const [userData, siteData, auditAreaData, auditorData, customerData, divisionData, shiftData] = await Promise.all([
                    getCurrentUser(),
                    getFoeSites(),
                    getFoeAuditAreas(),
                    getFoeAuditors(),
                    getFoeCustomers(),
                    getFoeDivisions(),
                    getFoeShifts()
                ]);
                if (!cancelled) {
                    setCurrentUser(Array.isArray(userData) ? null : userData);
                    setFoeSitesList(Array.isArray(siteData) ? siteData : []);
                    setAuditAreasList(Array.isArray(auditAreaData) ? auditAreaData : []);
                    setFoeAuditorsList(Array.isArray(auditorData) ? auditorData : []);
                    setFoeCustomersList(Array.isArray(customerData) ? customerData : []);
                    setFoeDivisionsList(Array.isArray(divisionData) ? divisionData : []);
                    setFoeShiftsList(Array.isArray(shiftData) ? shiftData : []);
                }
            } catch {
                if (!cancelled) {
                    setCurrentUser(null);
                    setFoeSitesList([]);
                    setAuditAreasList([]);
                    setFoeAuditorsList([]);
                    setFoeCustomersList([]);
                    setFoeDivisionsList([]);
                    setFoeShiftsList([]);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadCurrentUser();

        return () => {
            cancelled = true;
        };
    }, []);

    const resetAuditAreaForm = React.useCallback(() => {
        setEditingAuditArea(null);
        setNameInput('');
        setParentSiteId('');
        setTeamInput('');
        setManagerInput('');
        setFieldErrors({});
        setSubmissionMessage('');
        setSubmissionError('');
    }, []);

    const resetFoeAuditorForm = React.useCallback(() => {
        setEditingFoeAuditor(null);
        setAuditorMyIdInput('');
        setAuditorNameInput('');
        setApprovedSiteIds([]);
        setAuditorFieldErrors({});
        setAuditorSubmissionMessage('');
        setAuditorSubmissionError('');
    }, []);

    const resetFoeCustomerForm = React.useCallback(() => {
        setSelectedFoeCustomer(null);
        setCustomerInput('');
        setCustomerFieldErrors({});
        setCustomerSubmissionMessage('');
        setCustomerSubmissionError('');
    }, []);

    const resetFoeDivisionForm = React.useCallback(() => {
        setSelectedFoeDivision(null);
        setDivisionInput('');
        setDivisionFieldErrors({});
        setDivisionSubmissionMessage('');
        setDivisionSubmissionError('');
    }, []);

    const resetFoeSiteForm = React.useCallback(() => {
        setEditingFoeSite(null);
        setSiteInput('');
        setSiteParentDivisionId('');
        setSiteLeadAuditorIds([]);
        setSiteAuditorIds([]);
        setSiteFieldErrors({});
        setSiteSubmissionMessage('');
        setSiteSubmissionError('');
    }, []);

    const resetFoeShiftForm = React.useCallback(() => {
        setSelectedFoeShift(null);
        setShiftInput('');
        setShiftFieldErrors({});
        setShiftSubmissionMessage('');
        setShiftSubmissionError('');
    }, []);

    React.useEffect(() => {
        resetAuditAreaForm();
        resetFoeAuditorForm();
        resetFoeCustomerForm();
        resetFoeDivisionForm();
        resetFoeSiteForm();
        resetFoeShiftForm();
    }, [selectedAction, selectedOption, selectedCustomerAction, selectedDivisionAction, selectedShiftAction, resetAuditAreaForm, resetFoeAuditorForm, resetFoeCustomerForm, resetFoeDivisionForm, resetFoeSiteForm, resetFoeShiftForm]);

    const sortedSites = React.useMemo(() => {
        return [...foeSitesList].sort((a, b) => (a.siteName || '').localeCompare(b.siteName || ''));
    }, [foeSitesList]);

    const getSiteLabelById = React.useCallback((siteId) => {
        const site = foeSitesList.find((item) => String(item.siteId) === String(siteId));
        return site?.siteName || '';
    }, [foeSitesList]);

    const visibleAuditAreas = React.useMemo(() => {
        const sortedAuditAreas = [...auditAreasList].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        if (!includeArchivedAuditAreas && selectedAction === 'Edit') {
            return sortedAuditAreas.filter((auditArea) => (auditArea.active ?? 1) === 1);
        }
        return sortedAuditAreas;
    }, [auditAreasList, includeArchivedAuditAreas, selectedAction]);

    const visibleFoeAuditors = React.useMemo(() => {
        const sortedAuditors = [...foeAuditorsList].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        if (!includeArchivedFoeAuditors && selectedAction === 'Edit') {
            return sortedAuditors.filter((auditor) => (auditor.active ?? 1) === 1);
        }
        return sortedAuditors;
    }, [foeAuditorsList, includeArchivedFoeAuditors, selectedAction]);

    const approvedSiteOptions = React.useMemo(() => {
        return sortedSites.map((site) => ({
            value: Number(site.siteId),
            label: site.siteName
        }));
    }, [sortedSites]);

    const visibleFoeCustomers = React.useMemo(() => {
        const sortedCustomers = [...foeCustomersList].sort((a, b) => (a.customerName || '').localeCompare(b.customerName || ''));
        if (!includeArchivedFoeCustomers && selectedCustomerAction === 'Edit') {
            return sortedCustomers.filter((customer) => (customer.active ?? 1) === 1);
        }
        return sortedCustomers;
    }, [foeCustomersList, includeArchivedFoeCustomers, selectedCustomerAction]);

    const visibleFoeDivisions = React.useMemo(() => {
        const sortedDivisions = [...foeDivisionsList].sort((a, b) => (a.divisionName || '').localeCompare(b.divisionName || ''));
        if (!includeArchivedFoeDivisions && selectedDivisionAction === 'Edit') {
            return sortedDivisions.filter((division) => (division.active ?? 1) === 1);
        }
        return sortedDivisions;
    }, [foeDivisionsList, includeArchivedFoeDivisions, selectedDivisionAction]);

    const visibleFoeShifts = React.useMemo(() => {
        const sortedShifts = [...foeShiftsList].sort((a, b) => (a.shiftName || '').localeCompare(b.shiftName || ''));
        if (!includeArchivedFoeShifts && selectedShiftAction === 'Edit') {
            return sortedShifts.filter((shift) => (shift.active ?? 1) === 1);
        }
        return sortedShifts;
    }, [foeShiftsList, includeArchivedFoeShifts, selectedShiftAction]);

    const visibleFoeSites = React.useMemo(() => {
        const sortedVisibleSites = [...foeSitesList].sort((a, b) => (a.siteName || '').localeCompare(b.siteName || ''));
        if (!includeArchivedFoeSites && selectedAction === 'Edit') {
            return sortedVisibleSites.filter((site) => (site.active ?? 1) === 1);
        }
        return sortedVisibleSites;
    }, [foeSitesList, includeArchivedFoeSites, selectedAction]);

    const foeDivisionOptions = React.useMemo(() => {
        return [...foeDivisionsList]
            .filter((division) => (division.active ?? 1) === 1)
            .sort((a, b) => (a.divisionName || '').localeCompare(b.divisionName || ''))
            .map((division) => ({
                value: Number(division.divisionId),
                label: division.divisionName
            }));
    }, [foeDivisionsList]);

    const foeAuditorOptions = React.useMemo(() => {
        return [...foeAuditorsList]
            .filter((auditor) => (auditor.active ?? 1) === 1)
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
            .map((auditor) => ({
                value: Number(auditor.auditorId),
                label: auditor.myId
                    ? `${auditor.myId} - ${auditor.name || ''}`.trim()
                    : (auditor.name || `User ${auditor.auditorId}`)
            }));
    }, [foeAuditorsList]);

    const isNewMode = selectedAction === 'New';
    const isEditMode = selectedAction === 'Edit';
    const isCustomerNewMode = selectedCustomerAction === 'New';
    const isCustomerEditMode = selectedCustomerAction === 'Edit';
    const isDivisionNewMode = selectedDivisionAction === 'New';
    const isDivisionEditMode = selectedDivisionAction === 'Edit';
    const isShiftNewMode = selectedShiftAction === 'New';
    const isShiftEditMode = selectedShiftAction === 'Edit';

    const validateAuditAreaForm = React.useCallback(() => {
        const errors = {};
        if (!nameInput.trim()) {
            errors.name = 'Audit area name is required.';
        }
        if (!String(parentSiteId).trim()) {
            errors.parentSiteId = 'Parent site is required.';
        }
        return errors;
    }, [nameInput, parentSiteId]);

    const validateFoeAuditorForm = React.useCallback(() => {
        const errors = {};
        if (!auditorMyIdInput.trim()) {
            errors.myId = 'MyID is required.';
        }
        if (!auditorNameInput.trim()) {
            errors.name = 'Name is required.';
        }
        return errors;
    }, [auditorMyIdInput, auditorNameInput]);

    const validateFoeCustomerForm = React.useCallback(() => {
        const errors = {};
        if (!customerInput.trim()) {
            errors.customer = 'Customer is required.';
        }
        return errors;
    }, [customerInput]);

    const validateFoeDivisionForm = React.useCallback(() => {
        const errors = {};
        if (!divisionInput.trim()) {
            errors.division = 'Division is required.';
        }
        return errors;
    }, [divisionInput]);

    const validateFoeShiftForm = React.useCallback(() => {
        const errors = {};
        if (!shiftInput.trim()) {
            errors.shift = 'Shift is required.';
        }
        return errors;
    }, [shiftInput]);

    const validateFoeSiteForm = React.useCallback(() => {
        const errors = {};
        if (!siteInput.trim()) {
            errors.site = 'Site is required.';
        }
        if (!String(siteParentDivisionId).trim()) {
            errors.parentDivisionId = 'Parent division is required.';
        }
        return errors;
    }, [siteInput, siteParentDivisionId]);

    const handleSelectAuditArea = React.useCallback((auditArea) => {
        setEditingAuditArea(auditArea);
        setNameInput(auditArea.name ?? '');
        setParentSiteId(auditArea.parentSiteId ?? '');
        setTeamInput(auditArea.team ?? '');
        setManagerInput(auditArea.manager ?? '');
        setFieldErrors({});
        setSubmissionMessage('');
        setSubmissionError('');
    }, []);

    const handleSubmitAuditArea = React.useCallback(() => {
        const submitAuditArea = async () => {
            const errors = validateAuditAreaForm();
            setFieldErrors(errors);
            setSubmissionMessage('');
            if (Object.keys(errors).length > 0) {
                setSubmissionError('');
                return;
            }

            setSubmitting(true);
            setSubmissionError('');
            try {
                const payload = {
                    name: nameInput.trim(),
                    parentSiteId: Number(parentSiteId),
                    team: teamInput.trim(),
                    manager: managerInput.trim(),
                    active: editingAuditArea?.active ?? 1
                };
                const endpoint = isEditMode && editingAuditArea
                    ? `${API_BASE}/foe-audit-areas/${editingAuditArea.auditAreaId}`
                    : `${API_BASE}/foe-audit-areas`;
                const method = isEditMode && editingAuditArea ? 'PUT' : 'POST';
                const response = await fetch(endpoint, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) {
                    const errorBody = await response.json().catch(() => null);
                    throw new Error(errorBody?.error || 'Failed to save audit area.');
                }

                const refreshedAuditAreas = await getFoeAuditAreas(true);
                setAuditAreasList(Array.isArray(refreshedAuditAreas) ? refreshedAuditAreas : []);
                const successMessage = isEditMode && editingAuditArea
                    ? 'Audit area updated successfully.'
                    : 'Audit area added successfully.';
                setSubmissionMessage(
                    isEditMode && editingAuditArea
                        ? 'Audit area updated successfully.'
                        : 'Audit area added successfully.'
                );
                toast.success(successMessage, SUCCESS_TOAST_OPTIONS);
                setEditingAuditArea(null);
                setNameInput('');
                setParentSiteId('');
                setTeamInput('');
                setManagerInput('');
            } catch (error) {
                const errorMessage = error.message || 'Failed to save audit area.';
                toast.error(errorMessage, TOAST_OPTIONS);
                setSubmissionError(errorMessage);
                setSubmissionMessage('');
            } finally {
                setSubmitting(false);
            }
        };

        submitAuditArea();
    }, [
        editingAuditArea,
        isEditMode,
        managerInput,
        nameInput,
        parentSiteId,
        teamInput,
        validateAuditAreaForm
    ]);

    const handleAuditAreaArchiveToggle = React.useCallback(async () => {
        if (!editingAuditArea) return;
        setSubmitting(true);
        setSubmissionError('');
        setSubmissionMessage('');
        try {
            const payload = {
                name: (nameInput.trim() || editingAuditArea.name || '').trim(),
                parentSiteId: Number(parentSiteId || editingAuditArea.parentSiteId),
                team: (teamInput.trim() || editingAuditArea.team || '').trim(),
                manager: (managerInput.trim() || editingAuditArea.manager || '').trim(),
                active: editingAuditArea.active === 1 ? 0 : 1
            };
            const response = await fetch(`${API_BASE}/foe-audit-areas/${editingAuditArea.auditAreaId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || 'Failed to update audit area.');
            }

            const refreshedAuditAreas = await getFoeAuditAreas(true);
            const normalizedAuditAreas = Array.isArray(refreshedAuditAreas) ? refreshedAuditAreas : [];
            setAuditAreasList(normalizedAuditAreas);
            const refreshedAuditArea = normalizedAuditAreas.find(
                (auditArea) => String(auditArea.auditAreaId) === String(editingAuditArea.auditAreaId)
            );
            if (refreshedAuditArea) {
                setEditingAuditArea(refreshedAuditArea);
                setNameInput(refreshedAuditArea.name ?? '');
                setParentSiteId(refreshedAuditArea.parentSiteId ?? '');
                setTeamInput(refreshedAuditArea.team ?? '');
                setManagerInput(refreshedAuditArea.manager ?? '');
                const successMessage = refreshedAuditArea.active === 1
                    ? 'Audit area reactivated.'
                    : 'Audit area archived.';
                setSubmissionMessage(successMessage);
                toast.success(successMessage, SUCCESS_TOAST_OPTIONS);
            }
        } catch (error) {
            const errorMessage = error.message || 'Failed to update audit area.';
            toast.error(errorMessage, TOAST_OPTIONS);
            setSubmissionError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    }, [editingAuditArea, managerInput, nameInput, parentSiteId, teamInput]);

    const getSiteNames = React.useCallback((siteIds = []) => {
        if (!Array.isArray(siteIds) || siteIds.length === 0) {
            return '';
        }
        return siteIds
            .map((siteId) => getSiteLabelById(siteId))
            .filter(Boolean)
            .join(', ');
    }, [getSiteLabelById]);

    const handleSelectFoeAuditor = React.useCallback((auditor) => {
        setEditingFoeAuditor(auditor);
        setAuditorMyIdInput(auditor.myId ?? '');
        setAuditorNameInput(auditor.name ?? '');
        setApprovedSiteIds(Array.isArray(auditor.approvedSiteIds) ? auditor.approvedSiteIds.map(Number) : []);
        setAuditorFieldErrors({});
        setAuditorSubmissionMessage('');
        setAuditorSubmissionError('');
    }, []);

    const handleSelectFoeCustomer = React.useCallback((customer) => {
        setSelectedFoeCustomer(customer);
        setCustomerInput(customer.customerName ?? '');
        setCustomerFieldErrors({});
        setCustomerSubmissionMessage('');
        setCustomerSubmissionError('');
    }, []);

    const handleSelectFoeDivision = React.useCallback((division) => {
        setSelectedFoeDivision(division);
        setDivisionInput(division.divisionName ?? '');
        setDivisionFieldErrors({});
        setDivisionSubmissionMessage('');
        setDivisionSubmissionError('');
    }, []);

    const handleSelectFoeShift = React.useCallback((shift) => {
        setSelectedFoeShift(shift);
        setShiftInput(shift.shiftName ?? '');
        setShiftFieldErrors({});
        setShiftSubmissionMessage('');
        setShiftSubmissionError('');
    }, []);

    const handleSelectFoeSite = React.useCallback((site) => {
        setEditingFoeSite(site);
        setSiteInput(site.siteName ?? '');
        setSiteParentDivisionId(site.parentDivisionId ?? '');
        setSiteLeadAuditorIds(Array.isArray(site.leadAuditorIds) ? site.leadAuditorIds.map(Number) : []);
        setSiteAuditorIds(Array.isArray(site.auditorIds) ? site.auditorIds.map(Number) : []);
        setSiteFieldErrors({});
        setSiteSubmissionMessage('');
        setSiteSubmissionError('');
    }, []);

    const handleSubmitFoeAuditor = React.useCallback(() => {
        const submitFoeAuditor = async () => {
            const errors = validateFoeAuditorForm();
            setAuditorFieldErrors(errors);
            setAuditorSubmissionMessage('');
            if (Object.keys(errors).length > 0) {
                setAuditorSubmissionError('');
                return;
            }

            setAuditorSubmitting(true);
            setAuditorSubmissionError('');
            try {
                const payload = {
                    myId: auditorMyIdInput.trim(),
                    name: auditorNameInput.trim(),
                    approvedSiteIds,
                    active: editingFoeAuditor?.active ?? 1
                };
                const endpoint = isEditMode && editingFoeAuditor
                    ? `${API_BASE}/foe-auditors/${editingFoeAuditor.auditorId}`
                    : `${API_BASE}/foe-auditors`;
                const method = isEditMode && editingFoeAuditor ? 'PUT' : 'POST';
                const response = await fetch(endpoint, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) {
                    const errorBody = await response.json().catch(() => null);
                    throw new Error(errorBody?.error || 'Failed to save FOE auditor.');
                }

                const refreshedAuditors = await getFoeAuditors(true);
                setFoeAuditorsList(Array.isArray(refreshedAuditors) ? refreshedAuditors : []);
                const successMessage = isEditMode && editingFoeAuditor
                    ? 'Auditor updated successfully.'
                    : 'Auditor added successfully.';
                setAuditorSubmissionMessage(successMessage);
                toast.success(successMessage, SUCCESS_TOAST_OPTIONS);
                setEditingFoeAuditor(null);
                setAuditorMyIdInput('');
                setAuditorNameInput('');
                setApprovedSiteIds([]);
            } catch (error) {
                const errorMessage = error.message || 'Failed to save FOE auditor.';
                toast.error(errorMessage, TOAST_OPTIONS);
                setAuditorSubmissionError(errorMessage);
                setAuditorSubmissionMessage('');
                if (/already exists/i.test(errorMessage)) {
                    setAuditorFieldErrors((prev) => ({
                        ...prev,
                        myId: errorMessage
                    }));
                }
            } finally {
                setAuditorSubmitting(false);
            }
        };

        submitFoeAuditor();
    }, [
        approvedSiteIds,
        auditorMyIdInput,
        auditorNameInput,
        editingFoeAuditor,
        isEditMode,
        validateFoeAuditorForm
    ]);

    const handleFoeAuditorArchiveToggle = React.useCallback(async () => {
        if (!editingFoeAuditor) return;
        setAuditorSubmitting(true);
        setAuditorSubmissionError('');
        setAuditorSubmissionMessage('');
        try {
            const payload = {
                myId: (auditorMyIdInput.trim() || editingFoeAuditor.myId || '').trim(),
                name: (auditorNameInput.trim() || editingFoeAuditor.name || '').trim(),
                approvedSiteIds,
                active: editingFoeAuditor.active === 1 ? 0 : 1
            };
            const response = await fetch(`${API_BASE}/foe-auditors/${editingFoeAuditor.auditorId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || 'Failed to update FOE auditor.');
            }

            const refreshedAuditors = await getFoeAuditors(true);
            const normalizedAuditors = Array.isArray(refreshedAuditors) ? refreshedAuditors : [];
            setFoeAuditorsList(normalizedAuditors);
            const refreshedAuditor = normalizedAuditors.find(
                (auditor) => String(auditor.auditorId) === String(editingFoeAuditor.auditorId)
            );
            if (refreshedAuditor) {
                setEditingFoeAuditor(refreshedAuditor);
                setAuditorMyIdInput(refreshedAuditor.myId ?? '');
                setAuditorNameInput(refreshedAuditor.name ?? '');
                setApprovedSiteIds(Array.isArray(refreshedAuditor.approvedSiteIds) ? refreshedAuditor.approvedSiteIds.map(Number) : []);
                const successMessage = refreshedAuditor.active === 1
                    ? 'Auditor reactivated.'
                    : 'Auditor archived.';
                setAuditorSubmissionMessage(successMessage);
                toast.success(successMessage, SUCCESS_TOAST_OPTIONS);
            }
        } catch (error) {
            const errorMessage = error.message || 'Failed to update FOE auditor.';
            toast.error(errorMessage, TOAST_OPTIONS);
            setAuditorSubmissionError(errorMessage);
            if (/already exists/i.test(errorMessage)) {
                setAuditorFieldErrors((prev) => ({
                    ...prev,
                    myId: errorMessage
                }));
            }
        } finally {
            setAuditorSubmitting(false);
        }
    }, [approvedSiteIds, auditorMyIdInput, auditorNameInput, editingFoeAuditor]);

    const handleSubmitFoeCustomer = React.useCallback(() => {
        const submitFoeCustomer = async () => {
            const errors = validateFoeCustomerForm();
            setCustomerFieldErrors(errors);
            setCustomerSubmissionMessage('');
            if (Object.keys(errors).length > 0) {
                setCustomerSubmissionError('');
                return;
            }

            setCustomerSubmitting(true);
            setCustomerSubmissionError('');
            try {
                const endpoint = isCustomerEditMode && selectedFoeCustomer
                    ? `${API_BASE}/foe-customers/${selectedFoeCustomer.customerId}`
                    : `${API_BASE}/foe-customers`;
                const method = isCustomerEditMode && selectedFoeCustomer ? 'PUT' : 'POST';
                const response = await fetch(endpoint, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        customer: customerInput.trim(),
                        active: selectedFoeCustomer?.active ?? 1
                    })
                });
                if (!response.ok) {
                    const errorBody = await response.json().catch(() => null);
                    throw new Error(errorBody?.error || 'Failed to save FOE customer.');
                }

                const refreshedCustomers = await getFoeCustomers(true);
                setFoeCustomersList(Array.isArray(refreshedCustomers) ? refreshedCustomers : []);
                const successMessage = isCustomerEditMode && selectedFoeCustomer
                    ? 'Customer updated successfully.'
                    : 'Customer added successfully.';
                setCustomerSubmissionMessage(successMessage);
                toast.success(successMessage, SUCCESS_TOAST_OPTIONS);
                setSelectedFoeCustomer(null);
                setCustomerInput('');
            } catch (error) {
                const errorMessage = error.message || 'Failed to save FOE customer.';
                toast.error(errorMessage, TOAST_OPTIONS);
                setCustomerSubmissionError(errorMessage);
                setCustomerSubmissionMessage('');
            } finally {
                setCustomerSubmitting(false);
            }
        };

        submitFoeCustomer();
    }, [customerInput, isCustomerEditMode, selectedFoeCustomer, validateFoeCustomerForm]);

    const handleFoeCustomerArchiveToggle = React.useCallback(async () => {
        if (!selectedFoeCustomer) return;
        setCustomerSubmitting(true);
        setCustomerSubmissionError('');
        setCustomerSubmissionMessage('');
        try {
            const response = await fetch(`${API_BASE}/foe-customers/${selectedFoeCustomer.customerId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer: (customerInput.trim() || selectedFoeCustomer.customerName || '').trim(),
                    active: selectedFoeCustomer.active === 1 ? 0 : 1
                })
            });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || 'Failed to update FOE customer.');
            }

            const refreshedCustomers = await getFoeCustomers(true);
            const normalizedCustomers = Array.isArray(refreshedCustomers) ? refreshedCustomers : [];
            setFoeCustomersList(normalizedCustomers);
            const refreshedCustomer = normalizedCustomers.find(
                (customer) => String(customer.customerId) === String(selectedFoeCustomer.customerId)
            );
            if (refreshedCustomer) {
                setSelectedFoeCustomer(refreshedCustomer);
                setCustomerInput(refreshedCustomer.customerName ?? '');
                const successMessage = refreshedCustomer.active === 1
                    ? 'Customer reactivated.'
                    : 'Customer archived.';
                setCustomerSubmissionMessage(successMessage);
                toast.success(successMessage, SUCCESS_TOAST_OPTIONS);
            }
        } catch (error) {
            const errorMessage = error.message || 'Failed to update FOE customer.';
            toast.error(errorMessage, TOAST_OPTIONS);
            setCustomerSubmissionError(errorMessage);
        } finally {
            setCustomerSubmitting(false);
        }
    }, [customerInput, selectedFoeCustomer]);

    const handleSubmitFoeDivision = React.useCallback(() => {
        const submitFoeDivision = async () => {
            const errors = validateFoeDivisionForm();
            setDivisionFieldErrors(errors);
            setDivisionSubmissionMessage('');
            if (Object.keys(errors).length > 0) {
                setDivisionSubmissionError('');
                return;
            }

            setDivisionSubmitting(true);
            setDivisionSubmissionError('');
            try {
                const endpoint = isDivisionEditMode && selectedFoeDivision
                    ? `${API_BASE}/foe-divisions/${selectedFoeDivision.divisionId}`
                    : `${API_BASE}/foe-divisions`;
                const method = isDivisionEditMode && selectedFoeDivision ? 'PUT' : 'POST';
                const response = await fetch(endpoint, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        division: divisionInput.trim(),
                        active: selectedFoeDivision?.active ?? 1
                    })
                });
                if (!response.ok) {
                    const errorBody = await response.json().catch(() => null);
                    throw new Error(errorBody?.error || 'Failed to save FOE division.');
                }

                const refreshedDivisions = await getFoeDivisions(true);
                setFoeDivisionsList(Array.isArray(refreshedDivisions) ? refreshedDivisions : []);
                const successMessage = isDivisionEditMode && selectedFoeDivision
                    ? 'Division updated successfully.'
                    : 'Division added successfully.';
                setDivisionSubmissionMessage(successMessage);
                toast.success(successMessage, SUCCESS_TOAST_OPTIONS);
                setSelectedFoeDivision(null);
                setDivisionInput('');
            } catch (error) {
                const errorMessage = error.message || 'Failed to save FOE division.';
                toast.error(errorMessage, TOAST_OPTIONS);
                setDivisionSubmissionError(errorMessage);
                setDivisionSubmissionMessage('');
            } finally {
                setDivisionSubmitting(false);
            }
        };

        submitFoeDivision();
    }, [divisionInput, isDivisionEditMode, selectedFoeDivision, validateFoeDivisionForm]);

    const handleFoeDivisionArchiveToggle = React.useCallback(async () => {
        if (!selectedFoeDivision) return;
        setDivisionSubmitting(true);
        setDivisionSubmissionError('');
        setDivisionSubmissionMessage('');
        try {
            const response = await fetch(`${API_BASE}/foe-divisions/${selectedFoeDivision.divisionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    division: (divisionInput.trim() || selectedFoeDivision.divisionName || '').trim(),
                    active: selectedFoeDivision.active === 1 ? 0 : 1
                })
            });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || 'Failed to update FOE division.');
            }

            const refreshedDivisions = await getFoeDivisions(true);
            const normalizedDivisions = Array.isArray(refreshedDivisions) ? refreshedDivisions : [];
            setFoeDivisionsList(normalizedDivisions);
            const refreshedDivision = normalizedDivisions.find(
                (division) => String(division.divisionId) === String(selectedFoeDivision.divisionId)
            );
            if (refreshedDivision) {
                setSelectedFoeDivision(refreshedDivision);
                setDivisionInput(refreshedDivision.divisionName ?? '');
                const successMessage = refreshedDivision.active === 1
                    ? 'Division reactivated.'
                    : 'Division archived.';
                setDivisionSubmissionMessage(successMessage);
                toast.success(successMessage, SUCCESS_TOAST_OPTIONS);
            }
        } catch (error) {
            const errorMessage = error.message || 'Failed to update FOE division.';
            toast.error(errorMessage, TOAST_OPTIONS);
            setDivisionSubmissionError(errorMessage);
        } finally {
            setDivisionSubmitting(false);
        }
    }, [divisionInput, selectedFoeDivision]);

    const handleSubmitFoeShift = React.useCallback(() => {
        const submitFoeShift = async () => {
            const errors = validateFoeShiftForm();
            setShiftFieldErrors(errors);
            setShiftSubmissionMessage('');
            if (Object.keys(errors).length > 0) {
                setShiftSubmissionError('');
                return;
            }

            setShiftSubmitting(true);
            setShiftSubmissionError('');
            try {
                const endpoint = isShiftEditMode && selectedFoeShift
                    ? `${API_BASE}/foe-shifts/${selectedFoeShift.shiftId}`
                    : `${API_BASE}/foe-shifts`;
                const method = isShiftEditMode && selectedFoeShift ? 'PUT' : 'POST';
                const response = await fetch(endpoint, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        shift: shiftInput.trim(),
                        active: selectedFoeShift?.active ?? 1
                    })
                });
                if (!response.ok) {
                    const errorBody = await response.json().catch(() => null);
                    throw new Error(errorBody?.error || 'Failed to save FOE shift.');
                }

                const refreshedShifts = await getFoeShifts(true);
                setFoeShiftsList(Array.isArray(refreshedShifts) ? refreshedShifts : []);
                const successMessage = isShiftEditMode && selectedFoeShift
                    ? 'Shift updated successfully.'
                    : 'Shift added successfully.';
                setShiftSubmissionMessage(successMessage);
                toast.success(successMessage, SUCCESS_TOAST_OPTIONS);
                setSelectedFoeShift(null);
                setShiftInput('');
            } catch (error) {
                const errorMessage = error.message || 'Failed to save FOE shift.';
                toast.error(errorMessage, TOAST_OPTIONS);
                setShiftSubmissionError(errorMessage);
                setShiftSubmissionMessage('');
            } finally {
                setShiftSubmitting(false);
            }
        };

        submitFoeShift();
    }, [isShiftEditMode, selectedFoeShift, shiftInput, validateFoeShiftForm]);

    const handleFoeShiftArchiveToggle = React.useCallback(async () => {
        if (!selectedFoeShift) return;
        setShiftSubmitting(true);
        setShiftSubmissionError('');
        setShiftSubmissionMessage('');
        try {
            const response = await fetch(`${API_BASE}/foe-shifts/${selectedFoeShift.shiftId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shift: (shiftInput.trim() || selectedFoeShift.shiftName || '').trim(),
                    active: selectedFoeShift.active === 1 ? 0 : 1
                })
            });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || 'Failed to update FOE shift.');
            }

            const refreshedShifts = await getFoeShifts(true);
            const normalizedShifts = Array.isArray(refreshedShifts) ? refreshedShifts : [];
            setFoeShiftsList(normalizedShifts);
            const refreshedShift = normalizedShifts.find(
                (shift) => String(shift.shiftId) === String(selectedFoeShift.shiftId)
            );
            if (refreshedShift) {
                setSelectedFoeShift(refreshedShift);
                setShiftInput(refreshedShift.shiftName ?? '');
                const successMessage = refreshedShift.active === 1
                    ? 'Shift reactivated.'
                    : 'Shift archived.';
                setShiftSubmissionMessage(successMessage);
                toast.success(successMessage, SUCCESS_TOAST_OPTIONS);
            }
        } catch (error) {
            const errorMessage = error.message || 'Failed to update FOE shift.';
            toast.error(errorMessage, TOAST_OPTIONS);
            setShiftSubmissionError(errorMessage);
        } finally {
            setShiftSubmitting(false);
        }
    }, [selectedFoeShift, shiftInput]);

    const handleSubmitFoeSite = React.useCallback(() => {
        const submitFoeSite = async () => {
            const errors = validateFoeSiteForm();
            setSiteFieldErrors(errors);
            setSiteSubmissionMessage('');
            if (Object.keys(errors).length > 0) {
                setSiteSubmissionError('');
                return;
            }

            setSiteSubmitting(true);
            setSiteSubmissionError('');
            try {
                const payload = {
                    site: siteInput.trim(),
                    parentDivisionId: siteParentDivisionId ? Number(siteParentDivisionId) : null,
                    leadAuditorIds: siteLeadAuditorIds,
                    auditorIds: siteAuditorIds,
                    active: editingFoeSite?.active ?? 1
                };
                const endpoint = isEditMode && editingFoeSite
                    ? `${API_BASE}/foe-sites/${editingFoeSite.siteId}`
                    : `${API_BASE}/foe-sites`;
                const method = isEditMode && editingFoeSite ? 'PUT' : 'POST';
                const response = await fetch(endpoint, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) {
                    const errorBody = await response.json().catch(() => null);
                    throw new Error(errorBody?.error || 'Failed to save FOE site.');
                }

                const [refreshedSites, refreshedAuditors] = await Promise.all([
                    getFoeSites(true),
                    getFoeAuditors(true)
                ]);
                setFoeSitesList(Array.isArray(refreshedSites) ? refreshedSites : []);
                setFoeAuditorsList(Array.isArray(refreshedAuditors) ? refreshedAuditors : []);
                const successMessage = isEditMode && editingFoeSite
                    ? 'Site updated successfully.'
                    : 'Site added successfully.';
                setSiteSubmissionMessage(successMessage);
                toast.success(successMessage, SUCCESS_TOAST_OPTIONS);
                setEditingFoeSite(null);
                setSiteInput('');
                setSiteParentDivisionId('');
                setSiteLeadAuditorIds([]);
                setSiteAuditorIds([]);
            } catch (error) {
                const errorMessage = error.message || 'Failed to save FOE site.';
                toast.error(errorMessage, TOAST_OPTIONS);
                setSiteSubmissionError(errorMessage);
                setSiteSubmissionMessage('');
            } finally {
                setSiteSubmitting(false);
            }
        };

        submitFoeSite();
    }, [
        editingFoeSite,
        isEditMode,
        siteAuditorIds,
        siteInput,
        siteLeadAuditorIds,
        siteParentDivisionId,
        validateFoeSiteForm
    ]);

    const handleFoeSiteArchiveToggle = React.useCallback(async () => {
        if (!editingFoeSite) return;
        setSiteSubmitting(true);
        setSiteSubmissionError('');
        setSiteSubmissionMessage('');
        try {
            const payload = {
                site: (siteInput.trim() || editingFoeSite.siteName || '').trim(),
                parentDivisionId: siteParentDivisionId ? Number(siteParentDivisionId) : null,
                leadAuditorIds: siteLeadAuditorIds,
                auditorIds: siteAuditorIds,
                active: editingFoeSite.active === 1 ? 0 : 1
            };
            const response = await fetch(`${API_BASE}/foe-sites/${editingFoeSite.siteId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || 'Failed to update FOE site.');
            }

            const [refreshedSites, refreshedAuditors] = await Promise.all([
                getFoeSites(true),
                getFoeAuditors(true)
            ]);
            const normalizedSites = Array.isArray(refreshedSites) ? refreshedSites : [];
            setFoeSitesList(normalizedSites);
            setFoeAuditorsList(Array.isArray(refreshedAuditors) ? refreshedAuditors : []);
            const refreshedSite = normalizedSites.find(
                (site) => String(site.siteId) === String(editingFoeSite.siteId)
            );
            if (refreshedSite) {
                setEditingFoeSite(refreshedSite);
                setSiteInput(refreshedSite.siteName ?? '');
                setSiteParentDivisionId(refreshedSite.parentDivisionId ?? '');
                setSiteLeadAuditorIds(Array.isArray(refreshedSite.leadAuditorIds) ? refreshedSite.leadAuditorIds.map(Number) : []);
                setSiteAuditorIds(Array.isArray(refreshedSite.auditorIds) ? refreshedSite.auditorIds.map(Number) : []);
                const successMessage = refreshedSite.active === 1
                    ? 'Site reactivated.'
                    : 'Site archived.';
                setSiteSubmissionMessage(successMessage);
                toast.success(successMessage, SUCCESS_TOAST_OPTIONS);
            }
        } catch (error) {
            const errorMessage = error.message || 'Failed to update FOE site.';
            toast.error(errorMessage, TOAST_OPTIONS);
            setSiteSubmissionError(errorMessage);
        } finally {
            setSiteSubmitting(false);
        }
    }, [editingFoeSite, siteAuditorIds, siteInput, siteLeadAuditorIds, siteParentDivisionId]);

    const mailto = `mailto:walter.osborne@ngc.com?subject=${encodeURIComponent(
        currentUser?.myId ? `NGAT user verification (${currentUser.myId})` : 'NGAT user verification'
    )}&body=${encodeURIComponent(
        currentUser?.myId
            ? `Hi Walter, NGAT is registering me with the MyID ${currentUser.myId}, which is incorrect.`
            : 'Hi Walter, NGAT is not registering my MyID correctly.'
    )}`;

    if (loading || !currentUser) {
        return (
            <div className="entry-page">
                <div className="entry-container admin-card" style={{ justifyContent: 'center', display: 'flex', textAlign: 'center' }}>
                    Loading...
                </div>
            </div>
        );
    }

    if (!currentUser.isAdmin) {
        return (
            <div className="entry-page">
                <div className="entry-container admin-card">
                    <p className="admin-subtitle">Restricted</p>
                    <p>You do not have admin access. Redirecting...</p>
                    <button className="admin-primary" type="button" onClick={() => navigate('/foe')}>
                        Return to FOE
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="entry-page">
            <div className="entry-container admin-card">
                <header className="admin-header">
                    <div>
                        <p className="admin-subtitle">FOE · Admin menu</p>
                        <h1>Admin Menu</h1>
                        {!loading && currentUser?.name && currentUser.name !== 'User' && (
                            <p className="admin-welcome">
                                Welcome {currentUser.name}.{' '}
                                <a href={mailto} target="_blank" rel="noreferrer">
                                    Not you?
                                </a>
                            </p>
                        )}
                    </div>
                </header>
                <div className="admin-action-bar">
                    <div>
                        <label htmlFor="foe-admin-dropdown" className="admin-label">
                            Select a list to manage
                        </label>
                        <select
                            id="foe-admin-dropdown"
                            value={selectedOption}
                            onChange={(event) => setSelectedOption(event.target.value)}
                            className="admin-select"
                        >
                            <option value="" disabled hidden>
                                Select a list
                            </option>
                            {DROPDOWN_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                {selectedOption === 'Edit Audit Areas' && (
                    <FoeAuditAreasSection
                        actionOptions={ACTION_OPTIONS}
                        selectedAction={selectedAction}
                        onActionChange={(event) => setSelectedAction(event.target.value)}
                        isEditMode={isEditMode}
                        isNewMode={isNewMode}
                        includeArchived={includeArchivedAuditAreas}
                        onIncludeArchivedChange={(event) => setIncludeArchivedAuditAreas(event.target.checked)}
                        auditAreas={visibleAuditAreas}
                        editingAuditArea={editingAuditArea}
                        onSelectAuditArea={handleSelectAuditArea}
                        getSiteLabelById={getSiteLabelById}
                        nameInput={nameInput}
                        parentSiteId={parentSiteId}
                        teamInput={teamInput}
                        managerInput={managerInput}
                        onNameChange={(event) => {
                            setNameInput(event.target.value);
                            setFieldErrors((prev) => ({ ...prev, name: '' }));
                        }}
                        onParentSiteChange={(event) => {
                            setParentSiteId(event.target.value);
                            setFieldErrors((prev) => ({ ...prev, parentSiteId: '' }));
                        }}
                        onClearParentSite={() => {
                            setParentSiteId('');
                            setFieldErrors((prev) => ({ ...prev, parentSiteId: '' }));
                        }}
                        onTeamChange={(event) => setTeamInput(event.target.value)}
                        onManagerChange={(event) => setManagerInput(event.target.value)}
                        sortedSites={sortedSites}
                        fieldErrors={fieldErrors}
                        onSubmit={handleSubmitAuditArea}
                        onArchiveToggle={handleAuditAreaArchiveToggle}
                        onReset={resetAuditAreaForm}
                        submitting={submitting}
                        message={submissionMessage}
                        error={submissionError}
                    />
                )}
                {selectedOption === 'Edit Auditors' && (
                    <FoeAuditorsSection
                        actionOptions={ACTION_OPTIONS}
                        selectedAction={selectedAction}
                        onActionChange={(event) => setSelectedAction(event.target.value)}
                        isEditMode={isEditMode}
                        isNewMode={isNewMode}
                        includeArchived={includeArchivedFoeAuditors}
                        onIncludeArchivedChange={(event) => setIncludeArchivedFoeAuditors(event.target.checked)}
                        auditors={visibleFoeAuditors}
                        editingAuditor={editingFoeAuditor}
                        onSelectAuditor={handleSelectFoeAuditor}
                        getSiteNames={getSiteNames}
                        myIdInput={auditorMyIdInput}
                        nameInput={auditorNameInput}
                        approvedSiteIds={approvedSiteIds}
                        approvedSiteOptions={approvedSiteOptions}
                        onMyIdChange={(event) => {
                            setAuditorMyIdInput(event.target.value);
                            setAuditorFieldErrors((prev) => ({ ...prev, myId: '' }));
                        }}
                        onNameChange={(event) => {
                            setAuditorNameInput(event.target.value);
                            setAuditorFieldErrors((prev) => ({ ...prev, name: '' }));
                        }}
                        onApprovedSitesChange={(selectedOptions) => {
                            setApprovedSiteIds(Array.isArray(selectedOptions) ? selectedOptions.map((option) => Number(option.value)) : []);
                        }}
                        fieldErrors={auditorFieldErrors}
                        onSubmit={handleSubmitFoeAuditor}
                        onArchiveToggle={handleFoeAuditorArchiveToggle}
                        onReset={resetFoeAuditorForm}
                        submitting={auditorSubmitting}
                        message={auditorSubmissionMessage}
                        error={auditorSubmissionError}
                    />
                )}
                {selectedOption === 'Edit Customers' && (
                    <FoeCustomersSection
                        actionOptions={CUSTOMER_ACTION_OPTIONS}
                        selectedAction={selectedCustomerAction}
                        onActionChange={(event) => setSelectedCustomerAction(event.target.value)}
                        isEditMode={isCustomerEditMode}
                        isNewMode={isCustomerNewMode}
                        includeArchived={includeArchivedFoeCustomers}
                        onIncludeArchivedChange={(event) => setIncludeArchivedFoeCustomers(event.target.checked)}
                        customers={visibleFoeCustomers}
                        editingCustomer={selectedFoeCustomer}
                        onSelectCustomer={handleSelectFoeCustomer}
                        customerInput={customerInput}
                        onCustomerChange={(event) => {
                            setCustomerInput(event.target.value);
                            setCustomerFieldErrors((prev) => ({ ...prev, customer: '' }));
                        }}
                        fieldErrors={customerFieldErrors}
                        onSubmit={handleSubmitFoeCustomer}
                        onArchiveToggle={handleFoeCustomerArchiveToggle}
                        onReset={resetFoeCustomerForm}
                        submitting={customerSubmitting}
                        message={customerSubmissionMessage}
                        error={customerSubmissionError}
                    />
                )}
                {selectedOption === 'Edit Divisions' && (
                    <FoeDivisionsSection
                        actionOptions={DIVISION_ACTION_OPTIONS}
                        selectedAction={selectedDivisionAction}
                        onActionChange={(event) => setSelectedDivisionAction(event.target.value)}
                        isEditMode={isDivisionEditMode}
                        isNewMode={isDivisionNewMode}
                        includeArchived={includeArchivedFoeDivisions}
                        onIncludeArchivedChange={(event) => setIncludeArchivedFoeDivisions(event.target.checked)}
                        divisions={visibleFoeDivisions}
                        editingDivision={selectedFoeDivision}
                        onSelectDivision={handleSelectFoeDivision}
                        divisionInput={divisionInput}
                        onDivisionChange={(event) => {
                            setDivisionInput(event.target.value);
                            setDivisionFieldErrors((prev) => ({ ...prev, division: '' }));
                        }}
                        fieldErrors={divisionFieldErrors}
                        onSubmit={handleSubmitFoeDivision}
                        onArchiveToggle={handleFoeDivisionArchiveToggle}
                        onReset={resetFoeDivisionForm}
                        submitting={divisionSubmitting}
                        message={divisionSubmissionMessage}
                        error={divisionSubmissionError}
                    />
                )}
                {selectedOption === 'Edit Shifts' && (
                    <FoeShiftsSection
                        actionOptions={SHIFT_ACTION_OPTIONS}
                        selectedAction={selectedShiftAction}
                        onActionChange={(event) => setSelectedShiftAction(event.target.value)}
                        isEditMode={isShiftEditMode}
                        isNewMode={isShiftNewMode}
                        includeArchived={includeArchivedFoeShifts}
                        onIncludeArchivedChange={(event) => setIncludeArchivedFoeShifts(event.target.checked)}
                        shifts={visibleFoeShifts}
                        editingShift={selectedFoeShift}
                        onSelectShift={handleSelectFoeShift}
                        shiftInput={shiftInput}
                        onShiftChange={(event) => {
                            setShiftInput(event.target.value);
                            setShiftFieldErrors((prev) => ({ ...prev, shift: '' }));
                        }}
                        fieldErrors={shiftFieldErrors}
                        onSubmit={handleSubmitFoeShift}
                        onArchiveToggle={handleFoeShiftArchiveToggle}
                        onReset={resetFoeShiftForm}
                        submitting={shiftSubmitting}
                        message={shiftSubmissionMessage}
                        error={shiftSubmissionError}
                    />
                )}
                {selectedOption === 'Edit Sites' && (
                    <FoeSitesSection
                        actionOptions={ACTION_OPTIONS}
                        selectedAction={selectedAction}
                        onActionChange={(event) => setSelectedAction(event.target.value)}
                        isEditMode={isEditMode}
                        isNewMode={isNewMode}
                        includeArchived={includeArchivedFoeSites}
                        onIncludeArchivedChange={(event) => setIncludeArchivedFoeSites(event.target.checked)}
                        sites={visibleFoeSites}
                        editingSite={editingFoeSite}
                        onSelectSite={handleSelectFoeSite}
                        siteInput={siteInput}
                        parentDivisionId={siteParentDivisionId}
                        leadAuditorIds={siteLeadAuditorIds}
                        auditorIds={siteAuditorIds}
                        divisionOptions={foeDivisionOptions}
                        auditorOptions={foeAuditorOptions}
                        onSiteChange={(event) => {
                            setSiteInput(event.target.value);
                            setSiteFieldErrors((prev) => ({ ...prev, site: '' }));
                        }}
                        onParentDivisionChange={(selectedOption) => {
                            setSiteParentDivisionId(selectedOption?.value ?? '');
                            setSiteFieldErrors((prev) => ({ ...prev, parentDivisionId: '' }));
                        }}
                        onLeadAuditorsChange={(selectedOptions) => {
                            setSiteLeadAuditorIds(Array.isArray(selectedOptions) ? selectedOptions.map((option) => Number(option.value)) : []);
                        }}
                        onAuditorsChange={(selectedOptions) => {
                            setSiteAuditorIds(Array.isArray(selectedOptions) ? selectedOptions.map((option) => Number(option.value)) : []);
                        }}
                        fieldErrors={siteFieldErrors}
                        onSubmit={handleSubmitFoeSite}
                        onArchiveToggle={handleFoeSiteArchiveToggle}
                        onReset={resetFoeSiteForm}
                        submitting={siteSubmitting}
                        message={siteSubmissionMessage}
                        error={siteSubmissionError}
                    />
                )}
            </div>
        </div>
    );
};

export default FoeAdminMenu;
