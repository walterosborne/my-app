import React from 'react';
import { toast } from 'react-toastify';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE, getCurrentUser, getRoster, getAuditors, getDivisions, getAuditTypes, getBusinessUnits, getOperatingUnits, getCauses, getEveryTimeQuestions, getFunctions, getPrograms, getSites, getProps, getSectors, getTrainingRequirements, getSafetyEquipment } from './assets/data/apiData';
import './Entry.css';
import './AdminMenu.css';
import AuditorsSection from './components/admin/AuditorsSection';
import AuditTypesSection from './components/admin/AuditTypesSection';
import BusinessUnitsSection from './components/admin/BusinessUnitsSection';
import OperatingUnitsSection from './components/admin/OperatingUnitsSection';
import DelayCausesSection from './components/admin/DelayCausesSection';
import EveryTimeQuestionsSection from './components/admin/EveryTimeQuestionsSection';
import FunctionsSection from './components/admin/FunctionsSection';
import ProgramsSection from './components/admin/ProgramsSection';
import DivisionsSection from './components/admin/DivisionsSection';
import SitesSection from './components/admin/SitesSection';
import PropsSection from './components/admin/PropsSection';
import TrainingRequirementsSection from './components/admin/TrainingRequirementsSection';
import SafetyEquipmentSection from './components/admin/SafetyEquipmentSection';

const DROPDOWN_OPTIONS = [
    'Auditors',
    'Audit Types',
    'Business Units',
    'Delay Causes',
    'Divisions',
    'Every Time Questions',
    'Functions',
    'Operating Units',
    'Programs',
    'PrOP',
    'Safety Equipment',
    'Severity',
    'Sites',
    'Training Requirements'
];

const ACTION_OPTIONS = ['New', 'Edit'];
const DUPLICATE_MYID_MESSAGE = 'This MyID is already assigned to an auditor.';
const PROP_TYPE_OPTIONS = [
    { value: 1, label: 'Corporate' },
    { value: 2, label: 'Sector' },
    { value: 3, label: 'Division' },
    { value: 4, label: 'Site' },
    { value: 5, label: 'Business Unit' },
    { value: 6, label: 'Operating Unit' },
    { value: 7, label: 'Program' }
];

const TOAST_OPTIONS = {
    progressStyle: { backgroundColor: '#f44336' },
    style: { borderLeft: '4px solid #f44336' }
};
const SUCCESS_TOAST_OPTIONS = {
    progressStyle: { backgroundColor: '#1f8a3f' },
    style: { borderLeft: '4px solid #16663d' }
};

const AdminMenu = () => {
    const [searchParams] = useSearchParams();
    const [currentUser, setCurrentUser] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [selectedOption, setSelectedOption] = React.useState('');
    const [selectedAction, setSelectedAction] = React.useState(ACTION_OPTIONS[0]);
    const [manualEntry, setManualEntry] = React.useState(false);
    const [myIdInput, setMyIdInput] = React.useState('');
    const [firstName, setFirstName] = React.useState('');
    const [lastName, setLastName] = React.useState('');
    const [divisionId, setDivisionId] = React.useState('');
    const [submissionMessage, setSubmissionMessage] = React.useState('');
    const [submissionError, setSubmissionError] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);
    const [fieldErrors, setFieldErrors] = React.useState({});
    const [editingAuditor, setEditingAuditor] = React.useState(null);
    const [rosterList, setRosterList] = React.useState([]);
    const [auditorList, setAuditorList] = React.useState([]);
    const [divisionsList, setDivisionsList] = React.useState([]);
    const [includeArchived, setIncludeArchived] = React.useState(false);
    const [auditTypesList, setAuditTypesList] = React.useState([]);
    const [auditTypeInput, setAuditTypeInput] = React.useState('');
    const [editingAuditType, setEditingAuditType] = React.useState(null);
    const [includeArchivedAuditTypes, setIncludeArchivedAuditTypes] = React.useState(false);
    const [auditTypeMessage, setAuditTypeMessage] = React.useState('');
    const [auditTypeError, setAuditTypeError] = React.useState('');
    const [auditTypeSubmitting, setAuditTypeSubmitting] = React.useState(false);
    const [auditTypeFieldErrors, setAuditTypeFieldErrors] = React.useState({});
    const [businessUnitsList, setBusinessUnitsList] = React.useState([]);
    const [businessUnitInput, setBusinessUnitInput] = React.useState('');
    const [businessUnitDivisionId, setBusinessUnitDivisionId] = React.useState('');
    const [editingBusinessUnit, setEditingBusinessUnit] = React.useState(null);
    const [includeArchivedBusinessUnits, setIncludeArchivedBusinessUnits] = React.useState(false);
    const [businessUnitMessage, setBusinessUnitMessage] = React.useState('');
    const [businessUnitError, setBusinessUnitError] = React.useState('');
    const [businessUnitSubmitting, setBusinessUnitSubmitting] = React.useState(false);
    const [businessUnitFieldErrors, setBusinessUnitFieldErrors] = React.useState({});
    const [operatingUnitsList, setOperatingUnitsList] = React.useState([]);
    const [operatingUnitInput, setOperatingUnitInput] = React.useState('');
    const [operatingUnitDivisionId, setOperatingUnitDivisionId] = React.useState('');
    const [editingOperatingUnit, setEditingOperatingUnit] = React.useState(null);
    const [includeArchivedOperatingUnits, setIncludeArchivedOperatingUnits] = React.useState(false);
    const [operatingUnitMessage, setOperatingUnitMessage] = React.useState('');
    const [operatingUnitError, setOperatingUnitError] = React.useState('');
    const [operatingUnitSubmitting, setOperatingUnitSubmitting] = React.useState(false);
    const [operatingUnitFieldErrors, setOperatingUnitFieldErrors] = React.useState({});
    const [delayCausesList, setDelayCausesList] = React.useState([]);
    const [delayCauseInput, setDelayCauseInput] = React.useState('');
    const [editingDelayCause, setEditingDelayCause] = React.useState(null);
    const [includeArchivedDelayCauses, setIncludeArchivedDelayCauses] = React.useState(false);
    const [delayCauseMessage, setDelayCauseMessage] = React.useState('');
    const [delayCauseError, setDelayCauseError] = React.useState('');
    const [delayCauseSubmitting, setDelayCauseSubmitting] = React.useState(false);
    const [delayCauseFieldErrors, setDelayCauseFieldErrors] = React.useState({});
    const [everyTimeQuestionsList, setEveryTimeQuestionsList] = React.useState([]);
    const [everyTimeQuestionInput, setEveryTimeQuestionInput] = React.useState('');
    const [everyTimeQuestionDivisionId, setEveryTimeQuestionDivisionId] = React.useState('');
    const [editingEveryTimeQuestion, setEditingEveryTimeQuestion] = React.useState(null);
    const [includeArchivedEveryTimeQuestions, setIncludeArchivedEveryTimeQuestions] = React.useState(false);
    const [everyTimeQuestionMessage, setEveryTimeQuestionMessage] = React.useState('');
    const [everyTimeQuestionError, setEveryTimeQuestionError] = React.useState('');
    const [everyTimeQuestionSubmitting, setEveryTimeQuestionSubmitting] = React.useState(false);
    const [everyTimeQuestionFieldErrors, setEveryTimeQuestionFieldErrors] = React.useState({});
    const [functionsList, setFunctionsList] = React.useState([]);
    const [functionInput, setFunctionInput] = React.useState('');
    const [editingFunction, setEditingFunction] = React.useState(null);
    const [includeArchivedFunctions, setIncludeArchivedFunctions] = React.useState(false);
    const [functionMessage, setFunctionMessage] = React.useState('');
    const [functionError, setFunctionError] = React.useState('');
    const [functionSubmitting, setFunctionSubmitting] = React.useState(false);
    const [functionFieldErrors, setFunctionFieldErrors] = React.useState({});
    const [programsList, setProgramsList] = React.useState([]);
    const [programInput, setProgramInput] = React.useState('');
    const [programDivisionId, setProgramDivisionId] = React.useState('');
    const [editingProgram, setEditingProgram] = React.useState(null);
    const [includeArchivedPrograms, setIncludeArchivedPrograms] = React.useState(false);
    const [programMessage, setProgramMessage] = React.useState('');
    const [programError, setProgramError] = React.useState('');
    const [programSubmitting, setProgramSubmitting] = React.useState(false);
    const [programFieldErrors, setProgramFieldErrors] = React.useState({});
    const [divisionNameInput, setDivisionNameInput] = React.useState('');
    const [divisionSectorId, setDivisionSectorId] = React.useState('');
    const [editingDivision, setEditingDivision] = React.useState(null);
    const [includeArchivedDivisions, setIncludeArchivedDivisions] = React.useState(false);
    const [divisionMessage, setDivisionMessage] = React.useState('');
    const [divisionError, setDivisionError] = React.useState('');
    const [divisionSubmitting, setDivisionSubmitting] = React.useState(false);
    const [divisionFieldErrors, setDivisionFieldErrors] = React.useState({});
    const [sitesList, setSitesList] = React.useState([]);
    const [siteAddressInput, setSiteAddressInput] = React.useState('');
    const [siteCityInput, setSiteCityInput] = React.useState('');
    const [siteStateInput, setSiteStateInput] = React.useState('');
    const [siteCountryInput, setSiteCountryInput] = React.useState('');
    const [siteDivisionId, setSiteDivisionId] = React.useState('');
    const [editingSite, setEditingSite] = React.useState(null);
    const [includeArchivedSites, setIncludeArchivedSites] = React.useState(false);
    const [siteMessage, setSiteMessage] = React.useState('');
    const [siteError, setSiteError] = React.useState('');
    const [siteSubmitting, setSiteSubmitting] = React.useState(false);
    const [siteFieldErrors, setSiteFieldErrors] = React.useState({});
    const [sectorsList, setSectorsList] = React.useState([]);
    const [propsList, setPropsList] = React.useState([]);
    const [propInput, setPropInput] = React.useState('');
    const [propTypeId, setPropTypeId] = React.useState('');
    const [propTargetId, setPropTargetId] = React.useState('');
    const [editingProp, setEditingProp] = React.useState(null);
    const [includeArchivedProps, setIncludeArchivedProps] = React.useState(false);
    const [propMessage, setPropMessage] = React.useState('');
    const [propError, setPropError] = React.useState('');
    const [propSubmitting, setPropSubmitting] = React.useState(false);
    const [propFieldErrors, setPropFieldErrors] = React.useState({});
    const [trainingRequirementsList, setTrainingRequirementsList] = React.useState([]);
    const [trainingRequirementInput, setTrainingRequirementInput] = React.useState('');
    const [editingTrainingRequirement, setEditingTrainingRequirement] = React.useState(null);
    const [includeArchivedTrainingRequirements, setIncludeArchivedTrainingRequirements] = React.useState(false);
    const [trainingRequirementMessage, setTrainingRequirementMessage] = React.useState('');
    const [trainingRequirementError, setTrainingRequirementError] = React.useState('');
    const [trainingRequirementSubmitting, setTrainingRequirementSubmitting] = React.useState(false);
    const [trainingRequirementFieldErrors, setTrainingRequirementFieldErrors] = React.useState({});
    const [safetyEquipmentList, setSafetyEquipmentList] = React.useState([]);
    const [safetyEquipmentInput, setSafetyEquipmentInput] = React.useState('');
    const [editingSafetyEquipment, setEditingSafetyEquipment] = React.useState(null);
    const [includeArchivedSafetyEquipment, setIncludeArchivedSafetyEquipment] = React.useState(false);
    const [safetyEquipmentMessage, setSafetyEquipmentMessage] = React.useState('');
    const [safetyEquipmentError, setSafetyEquipmentError] = React.useState('');
    const [safetyEquipmentSubmitting, setSafetyEquipmentSubmitting] = React.useState(false);
    const [safetyEquipmentFieldErrors, setSafetyEquipmentFieldErrors] = React.useState({});
    const [autoFilledMyId, setAutoFilledMyId] = React.useState(false);
    const requestedMyId = (searchParams.get('myid') || '').trim();
    const [sortField, setSortField] = React.useState('lastName');
    const [sortDirection, setSortDirection] = React.useState('asc');
    const navigate = useNavigate();

    const normalizeAuditorRow = React.useCallback((row) => {
        const firstName = row.firstName ?? row.firstname ?? row.fname ?? '';
        const lastName = row.lastName ?? row.lastname ?? row.lname ?? '';
        const auditorName = row.auditorName ?? row.auditorname
            ?? (lastName || firstName ? `${lastName}${lastName && firstName ? ', ' : ''}${firstName}` : '');
        return {
            auditorId: row.auditorId ?? row.auditorid ?? row.id,
            firstName,
            lastName,
            auditorName,
            myId: row.myId ?? row.myid,
            divisionId: row.divisionId ?? row.divisionid,
            active: typeof row.active === 'number' ? row.active : row.active ?? 1
        };
    }, []);

    const normalizeAuditTypeRow = React.useCallback((row) => ({
        auditTypeId: row.auditTypeId ?? row.audittypeid ?? row.id,
        auditTypeName: row.auditTypeName ?? row.audittypename ?? '',
        active: typeof row.active === 'number' ? row.active : row.active ?? 1
    }), []);

    const normalizeBusinessUnitRow = React.useCallback((row) => ({
        businessUnitId: row.businessUnitId ?? row.businessunitid ?? row.id,
        businessUnitName: row.businessUnitName ?? row.businessunitname ?? '',
        divisionId: row.divisionId ?? row.divisionid ?? null,
        active: typeof row.active === 'number' ? row.active : row.active ?? 1
    }), []);

    const normalizeOperatingUnitRow = React.useCallback((row) => ({
        operatingUnitId: row.operatingUnitId ?? row.operatingunitid ?? row.id,
        operatingUnitName: row.operatingUnitName ?? row.operatingunitname ?? '',
        divisionId: row.divisionId ?? row.divisionid ?? null,
        active: typeof row.active === 'number' ? row.active : row.active ?? 1
    }), []);

    const normalizeDelayCauseRow = React.useCallback((row) => ({
        causeId: row.causeId ?? row.causeid ?? row.id,
        cause: row.cause ?? '',
        active: typeof row.active === 'number' ? row.active : row.active ?? 1
    }), []);

    const normalizeEveryTimeQuestionRow = React.useCallback((row) => ({
        etqId: row.etqId ?? row.etqid ?? row.id,
        question: row.question ?? '',
        divisionId: row.divisionId ?? row.divisionid ?? null,
        active: typeof row.active === 'number' ? row.active : row.active ?? 1
    }), []);

    const normalizeFunctionRow = React.useCallback((row) => ({
        functionId: row.functionId ?? row.functionid ?? row.id,
        functionName: row.functionName ?? row.functionname ?? '',
        active: typeof row.active === 'number' ? row.active : row.active ?? 1
    }), []);

    const normalizeProgramRow = React.useCallback((row) => ({
        programId: row.programId ?? row.programid ?? row.id,
        programName: row.programName ?? row.programname ?? '',
        divisionId: row.divisionId ?? row.divisionid ?? null,
        active: typeof row.active === 'number' ? row.active : row.active ?? 1
    }), []);

    const normalizeDivisionRow = React.useCallback((row) => ({
        divisionId: row.divisionId ?? row.divisionid ?? row.id,
        divisionName: row.divisionName ?? row.divisionname ?? '',
        sectorId: row.sectorId ?? row.sectorid ?? null,
        active: typeof row.active === 'number' ? row.active : row.active ?? 1
    }), []);

    const normalizeSiteRow = React.useCallback((row) => ({
        siteId: row.siteId ?? row.siteid ?? row.id,
        address: row.address ?? row.addressline ?? '',
        city: row.city ?? '',
        state: row.state ?? '',
        country: row.country ?? '',
        divisionId: row.divisionId ?? row.divisionid ?? null,
        active: typeof row.active === 'number' ? row.active : row.active ?? 1
    }), []);

    const normalizePropRow = React.useCallback((row) => ({
        propId: row.propId ?? row.propid ?? row.id,
        PrOP: row.PrOP ?? row.prOP ?? row.prop ?? '',
        sectorId: row.sectorId ?? row.sectorid ?? null,
        divisionId: row.divisionId ?? row.divisionid ?? null,
        siteId: row.siteId ?? row.siteid ?? null,
        buId: row.buId ?? row.buid ?? null,
        ouId: row.ouId ?? row.ouid ?? null,
        programId: row.programId ?? row.programid ?? null,
        propTypeId: row.propTypeId ?? row.proptypeid ?? null,
        active: typeof row.active === 'number' ? row.active : row.active ?? 1
    }), []);

    const normalizeTrainingRequirementRow = React.useCallback((row) => ({
        trainingRequirementId: row.trainingRequirementId ?? row.trainingrequirementid ?? row.id,
        trainingRequirementName: row.trainingRequirementName ?? row.trainingrequirementname ?? '',
        active: typeof row.active === 'number' ? row.active : row.active ?? 1
    }), []);

    const normalizeSafetyEquipmentRow = React.useCallback((row) => ({
        safetyEquipmentId: row.safetyEquipmentId ?? row.safetyequipmentid ?? row.id,
        safetyEquipmentName: row.safetyEquipmentName ?? row.safetyequipmentname ?? '',
        active: typeof row.active === 'number' ? row.active : row.active ?? 1
    }), []);

    React.useEffect(() => {
        let mounted = true;
        const loadUser = async () => {
            try {
                const [userData, rosterData, auditorsData, divisionsData, auditTypesData, businessUnitsData, operatingUnitsData, causesData, everyTimeQuestionsData, functionsData, programsData, sitesData, propsData, trainingRequirementsData, safetyEquipmentData, sectorsData] = await Promise.all([
                    getCurrentUser(),
                    getRoster(true),
                    getAuditors(),
                    getDivisions(),
                    getAuditTypes(),
                    getBusinessUnits(),
                    getOperatingUnits(),
                    getCauses(),
                    getEveryTimeQuestions(),
                    getFunctions(),
                    getPrograms(),
                    getSites(),
                    getProps(),
                    getTrainingRequirements(),
                    getSafetyEquipment(),
                    getSectors()
                ]);
                if (mounted) {
                    setCurrentUser(userData);
                    setRosterList(rosterData);
                    setAuditorList(auditorsData.map(normalizeAuditorRow));
                    setDivisionsList(divisionsData.map(normalizeDivisionRow));
                    setAuditTypesList(auditTypesData.map(normalizeAuditTypeRow));
                    setBusinessUnitsList(businessUnitsData.map(normalizeBusinessUnitRow));
                    setOperatingUnitsList(operatingUnitsData.map(normalizeOperatingUnitRow));
                    setDelayCausesList(causesData.map(normalizeDelayCauseRow));
                    setEveryTimeQuestionsList(everyTimeQuestionsData.map(normalizeEveryTimeQuestionRow));
                    setFunctionsList(functionsData.map(normalizeFunctionRow));
                    setProgramsList(programsData.map(normalizeProgramRow));
                    setSitesList(sitesData.map(normalizeSiteRow));
                    setPropsList(propsData.map(normalizePropRow));
                    setTrainingRequirementsList(trainingRequirementsData.map(normalizeTrainingRequirementRow));
                    setSafetyEquipmentList(safetyEquipmentData.map(normalizeSafetyEquipmentRow));
                    setSectorsList(sectorsData);
                }
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        loadUser();
        return () => {
            mounted = false;
        };
    }, [normalizeAuditorRow, normalizeAuditTypeRow, normalizeBusinessUnitRow, normalizeOperatingUnitRow, normalizeDelayCauseRow, normalizeEveryTimeQuestionRow, normalizeFunctionRow, normalizeProgramRow, normalizeDivisionRow, normalizeSiteRow, normalizePropRow, normalizeTrainingRequirementRow, normalizeSafetyEquipmentRow]);

    React.useEffect(() => {
        if (loading) return;
        if (currentUser?.isAdmin) return;
        const timeout = setTimeout(() => {
            navigate('/audit');
        }, 1200);
        return () => clearTimeout(timeout);
    }, [loading, currentUser, navigate]);

    React.useEffect(() => {
        if (selectedAction === 'New') {
            setEditingAuditor(null);
            setMyIdInput('');
            setFirstName('');
            setLastName('');
            setDivisionId('');
            setManualEntry(false);
            setSubmissionError('');
            setSubmissionMessage('');
            setFieldErrors({});
            setEditingAuditType(null);
            setAuditTypeInput('');
            setAuditTypeError('');
            setAuditTypeMessage('');
            setAuditTypeFieldErrors({});
            setEditingBusinessUnit(null);
            setBusinessUnitInput('');
            setBusinessUnitDivisionId('');
            setBusinessUnitError('');
            setBusinessUnitMessage('');
            setBusinessUnitFieldErrors({});
            setEditingOperatingUnit(null);
            setOperatingUnitInput('');
            setOperatingUnitDivisionId('');
            setOperatingUnitError('');
            setOperatingUnitMessage('');
            setOperatingUnitFieldErrors({});
            setEditingDelayCause(null);
            setDelayCauseInput('');
            setDelayCauseError('');
            setDelayCauseMessage('');
            setDelayCauseFieldErrors({});
            setEditingEveryTimeQuestion(null);
            setEveryTimeQuestionInput('');
            setEveryTimeQuestionDivisionId('');
            setEveryTimeQuestionError('');
            setEveryTimeQuestionMessage('');
            setEveryTimeQuestionFieldErrors({});
            setEditingFunction(null);
            setFunctionInput('');
            setFunctionError('');
            setFunctionMessage('');
            setFunctionFieldErrors({});
            setEditingProgram(null);
            setProgramInput('');
            setProgramDivisionId('');
            setProgramError('');
            setProgramMessage('');
            setProgramFieldErrors({});
            setEditingDivision(null);
            setDivisionNameInput('');
            setDivisionSectorId('');
            setDivisionError('');
            setDivisionMessage('');
            setDivisionFieldErrors({});
            setEditingSite(null);
            setSiteAddressInput('');
            setSiteCityInput('');
            setSiteStateInput('');
            setSiteCountryInput('');
            setSiteDivisionId('');
            setSiteError('');
            setSiteMessage('');
            setSiteFieldErrors({});
            setEditingProp(null);
            setPropInput('');
            setPropTypeId('');
            setPropTargetId('');
            setPropError('');
            setPropMessage('');
            setPropFieldErrors({});
            setEditingTrainingRequirement(null);
            setTrainingRequirementInput('');
            setTrainingRequirementError('');
            setTrainingRequirementMessage('');
            setTrainingRequirementFieldErrors({});
            setEditingSafetyEquipment(null);
            setSafetyEquipmentInput('');
            setSafetyEquipmentError('');
            setSafetyEquipmentMessage('');
            setSafetyEquipmentFieldErrors({});
        }
    }, [selectedAction]);

    React.useEffect(() => {
        if (loading || autoFilledMyId) return;
        if (!requestedMyId) return;
        if (selectedOption !== 'Auditors') {
            setSelectedOption('Auditors');
        }
        if (selectedAction !== 'New') {
            setSelectedAction('New');
        }
        setEditingAuditor(null);
        setManualEntry(false);
    }, [loading, autoFilledMyId, requestedMyId, selectedOption, selectedAction]);

    React.useEffect(() => {
        if (loading || autoFilledMyId) return;
        if (!requestedMyId) return;
        if (selectedOption !== 'Auditors' || selectedAction !== 'New') return;
        setMyIdInput(requestedMyId);
        setSubmissionError('');
        setSubmissionMessage('');
        setFieldErrors({});
        setAutoFilledMyId(true);
    }, [loading, autoFilledMyId, requestedMyId, selectedOption, selectedAction]);

    const getDivisionName = (divisionId) => {
        const division = divisionsList.find((division) => division.divisionId === divisionId);
        return division ? division.divisionName : divisionId;
    };

    const getSectorName = (sectorId) => {
        const sector = sectorsList.find((item) => item.sectorId === sectorId);
        return sector ? sector.sectorName : sectorId;
    };

    const getProgramName = (programId) => {
        const program = programsList.find((item) => item.programId === programId);
        return program ? program.programName : programId;
    };

    const getBusinessUnitName = (buId) => {
        const unit = businessUnitsList.find((item) => item.businessUnitId === buId);
        return unit ? unit.businessUnitName : buId;
    };

    const getOperatingUnitName = (ouId) => {
        const unit = operatingUnitsList.find((item) => item.operatingUnitId === ouId);
        return unit ? unit.operatingUnitName : ouId;
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

    const getSiteName = (siteId) => {
        const site = sitesList.find((item) => item.siteId === siteId);
        return site ? getSiteLabel(site) : siteId;
    };

    const parseAuditorName = React.useCallback((auditor) => {
        if (auditor?.firstName || auditor?.lastName) {
            return {
                firstName: auditor.firstName ?? '',
                lastName: auditor.lastName ?? ''
            };
        }
        const [rawLast = '', rawFirst = ''] = (auditor?.auditorName || '').split(',');
        return {
            firstName: rawFirst.trim(),
            lastName: rawLast.trim()
        };
    }, []);

    const sortedDivisions = React.useMemo(() => {
        if (!divisionsList.length) return [];
        return [...divisionsList].sort((a, b) => {
            const nameA = (a.divisionName || '').toLowerCase();
            const nameB = (b.divisionName || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });
    }, [divisionsList]);

    const sortedSectors = React.useMemo(() => {
        if (!sectorsList.length) return [];
        return [...sectorsList].sort((a, b) => {
            const nameA = (a.sectorName || '').toLowerCase();
            const nameB = (b.sectorName || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });
    }, [sectorsList]);

    const sortedAuditors = React.useMemo(() => {
        const list = [...auditorList];
        const direction = sortDirection === 'asc' ? 1 : -1;
        return list.sort((a, b) => {
            let valueA;
            let valueB;
            switch (sortField) {
                case 'myId':
                    valueA = (a.myId ?? '').toLowerCase();
                    valueB = (b.myId ?? '').toLowerCase();
                    break;
                case 'firstName':
                    valueA = (parseAuditorName(a).firstName ?? '').toLowerCase();
                    valueB = (parseAuditorName(b).firstName ?? '').toLowerCase();
                    break;
                case 'lastName':
                    valueA = (parseAuditorName(a).lastName ?? '').toLowerCase();
                    valueB = (parseAuditorName(b).lastName ?? '').toLowerCase();
                    break;
                case 'division':
                    valueA = (getDivisionName(a.divisionId) ?? '').toLowerCase();
                    valueB = (getDivisionName(b.divisionId) ?? '').toLowerCase();
                    break;
                default:
                    valueA = (parseAuditorName(a).lastName ?? '').toLowerCase();
                    valueB = (parseAuditorName(b).lastName ?? '').toLowerCase();
            }
            if (valueA < valueB) return -1 * direction;
            if (valueA > valueB) return 1 * direction;
            return 0;
        });
    }, [auditorList, sortDirection, sortField, getDivisionName, parseAuditorName]);

    const sortedAuditTypes = React.useMemo(() => {
        return [...auditTypesList].sort((a, b) => {
            const nameA = (a.auditTypeName || '').toLowerCase();
            const nameB = (b.auditTypeName || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });
    }, [auditTypesList]);

    const sortedBusinessUnits = React.useMemo(() => {
        return [...businessUnitsList].sort((a, b) => {
            const nameA = (a.businessUnitName || '').toLowerCase();
            const nameB = (b.businessUnitName || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });
    }, [businessUnitsList]);

    const sortedOperatingUnits = React.useMemo(() => {
        return [...operatingUnitsList].sort((a, b) => {
            const nameA = (a.operatingUnitName || '').toLowerCase();
            const nameB = (b.operatingUnitName || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });
    }, [operatingUnitsList]);

    const sortedDelayCauses = React.useMemo(() => {
        return [...delayCausesList].sort((a, b) => {
            const nameA = (a.cause || '').toLowerCase();
            const nameB = (b.cause || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });
    }, [delayCausesList]);

    const sortedEveryTimeQuestions = React.useMemo(() => {
        return [...everyTimeQuestionsList].sort((a, b) => {
            const nameA = (a.question || '').toLowerCase();
            const nameB = (b.question || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });
    }, [everyTimeQuestionsList]);

    const sortedFunctions = React.useMemo(() => {
        return [...functionsList].sort((a, b) => {
            const nameA = (a.functionName || '').toLowerCase();
            const nameB = (b.functionName || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });
    }, [functionsList]);

    const sortedPrograms = React.useMemo(() => {
        return [...programsList].sort((a, b) => {
            const nameA = (a.programName || '').toLowerCase();
            const nameB = (b.programName || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });
    }, [programsList]);

    const sortedSites = React.useMemo(() => {
        return [...sitesList].sort((a, b) => {
            const nameA = (a.address || '').toLowerCase();
            const nameB = (b.address || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });
    }, [sitesList]);

    const sortedProps = React.useMemo(() => {
        return [...propsList].sort((a, b) => {
            const nameA = (a.PrOP || '').toLowerCase();
            const nameB = (b.PrOP || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });
    }, [propsList]);

    const sortedTrainingRequirements = React.useMemo(() => {
        return [...trainingRequirementsList].sort((a, b) => {
            const nameA = (a.trainingRequirementName || '').toLowerCase();
            const nameB = (b.trainingRequirementName || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });
    }, [trainingRequirementsList]);

    const sortedSafetyEquipment = React.useMemo(() => {
        return [...safetyEquipmentList].sort((a, b) => {
            const nameA = (a.safetyEquipmentName || '').toLowerCase();
            const nameB = (b.safetyEquipmentName || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });
    }, [safetyEquipmentList]);

    const propTypeLabelMap = React.useMemo(() => {
        return PROP_TYPE_OPTIONS.reduce((acc, option) => {
            acc[option.value] = option.label;
            return acc;
        }, {});
    }, []);

    const getPropTypeLabel = React.useCallback((value) => {
        return propTypeLabelMap[value] || 'Unknown';
    }, [propTypeLabelMap]);

    const rosterMatch = React.useMemo(() => {
        if (!myIdInput.trim()) return null;
        const normalized = myIdInput.trim().toLowerCase();
        return rosterList.find((entry) => {
            const candidate = entry.myId ?? entry.myid;
            return candidate?.toLowerCase() === normalized;
        }) ?? null;
    }, [myIdInput, rosterList]);

    const auditorMatch = React.useMemo(() => {
        if (!myIdInput.trim()) return null;
        const normalized = myIdInput.trim().toLowerCase();
        return auditorList.find((audit) => {
            const candidate = audit.myId ?? audit.myid;
            return candidate?.toLowerCase() === normalized;
        }) ?? null;
    }, [myIdInput, auditorList]);

    const duplicateAuditor = React.useMemo(() => {
        if (!auditorMatch) return null;
        if (!editingAuditor) return auditorMatch;
        return auditorMatch.auditorId === editingAuditor.auditorId ? null : auditorMatch;
    }, [auditorMatch, editingAuditor]);

    React.useEffect(() => {
        if (editingAuditor) {
            const parsed = parseAuditorName(editingAuditor);
            setFirstName(parsed.firstName || '');
            setLastName(parsed.lastName || '');
            setDivisionId(editingAuditor.divisionId ?? '');
            setMyIdInput(editingAuditor.myId ?? editingAuditor.myid ?? '');
            return;
        }
        if (manualEntry) return;
        if (!rosterMatch) {
            setFirstName('');
            setLastName('');
            setDivisionId('');
            return;
        }
        const [last, first] = (rosterMatch.rosterName || '').split(',').map((part) => part?.trim() || '');
        setFirstName(first || '');
        setLastName(last || '');
        setDivisionId(auditorMatch?.divisionId ?? '');
    }, [manualEntry, rosterMatch, auditorMatch, editingAuditor, rosterList, parseAuditorName]);

    React.useEffect(() => {
        setFieldErrors((prev) => {
            if (duplicateAuditor) {
                if (prev.myId === DUPLICATE_MYID_MESSAGE) return prev;
                return { ...prev, myId: DUPLICATE_MYID_MESSAGE };
            }
            if (prev.myId === DUPLICATE_MYID_MESSAGE) {
                const { myId, ...rest } = prev;
                return rest;
            }
            return prev;
        });
    }, [duplicateAuditor]);

    const isNewMode = selectedAction === 'New' && selectedOption === 'Auditors';
    const isEditMode = selectedAction === 'Edit' && selectedOption === 'Auditors';
    const isAuditTypeNewMode = selectedAction === 'New' && selectedOption === 'Audit Types';
    const isAuditTypeEditMode = selectedAction === 'Edit' && selectedOption === 'Audit Types';
    const isBusinessUnitNewMode = selectedAction === 'New' && selectedOption === 'Business Units';
    const isBusinessUnitEditMode = selectedAction === 'Edit' && selectedOption === 'Business Units';
    const isOperatingUnitNewMode = selectedAction === 'New' && selectedOption === 'Operating Units';
    const isOperatingUnitEditMode = selectedAction === 'Edit' && selectedOption === 'Operating Units';
    const isDelayCauseNewMode = selectedAction === 'New' && selectedOption === 'Delay Causes';
    const isDelayCauseEditMode = selectedAction === 'Edit' && selectedOption === 'Delay Causes';
    const isEveryTimeQuestionNewMode = selectedAction === 'New' && selectedOption === 'Every Time Questions';
    const isEveryTimeQuestionEditMode = selectedAction === 'Edit' && selectedOption === 'Every Time Questions';
    const isFunctionNewMode = selectedAction === 'New' && selectedOption === 'Functions';
    const isFunctionEditMode = selectedAction === 'Edit' && selectedOption === 'Functions';
    const isProgramNewMode = selectedAction === 'New' && selectedOption === 'Programs';
    const isProgramEditMode = selectedAction === 'Edit' && selectedOption === 'Programs';
    const isDivisionNewMode = selectedAction === 'New' && selectedOption === 'Divisions';
    const isDivisionEditMode = selectedAction === 'Edit' && selectedOption === 'Divisions';
    const isSiteNewMode = selectedAction === 'New' && selectedOption === 'Sites';
    const isSiteEditMode = selectedAction === 'Edit' && selectedOption === 'Sites';
    const showFields = isEditMode ? Boolean(editingAuditor) : manualEntry || (isNewMode && rosterMatch && !auditorMatch);
    const isActiveEditMode = isEditMode;
    const visibleAuditors = React.useMemo(() => {
        if (isActiveEditMode && !includeArchived) {
            return sortedAuditors.filter((auditor) => (auditor.active ?? 1) === 1);
        }
        return sortedAuditors;
    }, [sortedAuditors, includeArchived, isActiveEditMode]);

    const visibleAuditTypes = React.useMemo(() => {
        if (isAuditTypeEditMode && !includeArchivedAuditTypes) {
            return sortedAuditTypes.filter((type) => (type.active ?? 1) === 1);
        }
        return sortedAuditTypes;
    }, [sortedAuditTypes, includeArchivedAuditTypes, isAuditTypeEditMode]);

    const visibleBusinessUnits = React.useMemo(() => {
        if (isBusinessUnitEditMode && !includeArchivedBusinessUnits) {
            return sortedBusinessUnits.filter((unit) => (unit.active ?? 1) === 1);
        }
        return sortedBusinessUnits;
    }, [sortedBusinessUnits, includeArchivedBusinessUnits, isBusinessUnitEditMode]);

    const visibleOperatingUnits = React.useMemo(() => {
        if (isOperatingUnitEditMode && !includeArchivedOperatingUnits) {
            return sortedOperatingUnits.filter((unit) => (unit.active ?? 1) === 1);
        }
        return sortedOperatingUnits;
    }, [sortedOperatingUnits, includeArchivedOperatingUnits, isOperatingUnitEditMode]);

    const visibleDelayCauses = React.useMemo(() => {
        if (isDelayCauseEditMode && !includeArchivedDelayCauses) {
            return sortedDelayCauses.filter((cause) => (cause.active ?? 1) === 1);
        }
        return sortedDelayCauses;
    }, [sortedDelayCauses, includeArchivedDelayCauses, isDelayCauseEditMode]);

    const visibleEveryTimeQuestions = React.useMemo(() => {
        if (isEveryTimeQuestionEditMode && !includeArchivedEveryTimeQuestions) {
            return sortedEveryTimeQuestions.filter((question) => (question.active ?? 1) === 1);
        }
        return sortedEveryTimeQuestions;
    }, [sortedEveryTimeQuestions, includeArchivedEveryTimeQuestions, isEveryTimeQuestionEditMode]);

    const visibleFunctions = React.useMemo(() => {
        if (isFunctionEditMode && !includeArchivedFunctions) {
            return sortedFunctions.filter((fn) => (fn.active ?? 1) === 1);
        }
        return sortedFunctions;
    }, [sortedFunctions, includeArchivedFunctions, isFunctionEditMode]);

    const visiblePrograms = React.useMemo(() => {
        if (isProgramEditMode && !includeArchivedPrograms) {
            return sortedPrograms.filter((program) => (program.active ?? 1) === 1);
        }
        return sortedPrograms;
    }, [sortedPrograms, includeArchivedPrograms, isProgramEditMode]);

    const visibleDivisions = React.useMemo(() => {
        if (isDivisionEditMode && !includeArchivedDivisions) {
            return sortedDivisions.filter((division) => (division.active ?? 1) === 1);
        }
        return sortedDivisions;
    }, [sortedDivisions, includeArchivedDivisions, isDivisionEditMode]);

    const visibleSites = React.useMemo(() => {
        if (isSiteEditMode && !includeArchivedSites) {
            return sortedSites.filter((site) => (site.active ?? 1) === 1);
        }
        return sortedSites;
    }, [sortedSites, includeArchivedSites, isSiteEditMode]);

    const isPropNewMode = selectedAction === 'New' && selectedOption === 'PrOP';
    const isPropEditMode = selectedAction === 'Edit' && selectedOption === 'PrOP';
    const isTrainingRequirementNewMode = selectedAction === 'New' && selectedOption === 'Training Requirements';
    const isTrainingRequirementEditMode = selectedAction === 'Edit' && selectedOption === 'Training Requirements';
    const isSafetyEquipmentNewMode = selectedAction === 'New' && selectedOption === 'Safety Equipment';
    const isSafetyEquipmentEditMode = selectedAction === 'Edit' && selectedOption === 'Safety Equipment';

    const visibleProps = React.useMemo(() => {
        if (isPropEditMode && !includeArchivedProps) {
            return sortedProps.filter((prop) => (prop.active ?? 1) === 1);
        }
        return sortedProps;
    }, [sortedProps, includeArchivedProps, isPropEditMode]);

    const visibleTrainingRequirements = React.useMemo(() => {
        if (isTrainingRequirementEditMode && !includeArchivedTrainingRequirements) {
            return sortedTrainingRequirements.filter((requirement) => (requirement.active ?? 1) === 1);
        }
        return sortedTrainingRequirements;
    }, [sortedTrainingRequirements, includeArchivedTrainingRequirements, isTrainingRequirementEditMode]);

    const visibleSafetyEquipment = React.useMemo(() => {
        if (isSafetyEquipmentEditMode && !includeArchivedSafetyEquipment) {
            return sortedSafetyEquipment.filter((equipment) => (equipment.active ?? 1) === 1);
        }
        return sortedSafetyEquipment;
    }, [sortedSafetyEquipment, includeArchivedSafetyEquipment, isSafetyEquipmentEditMode]);


    React.useEffect(() => {
        if (!isActiveEditMode) {
            setIncludeArchived(false);
        }
    }, [isActiveEditMode]);

    React.useEffect(() => {
        if (!isAuditTypeEditMode) {
            setIncludeArchivedAuditTypes(false);
        }
    }, [isAuditTypeEditMode]);

    React.useEffect(() => {
        if (!isBusinessUnitEditMode) {
            setIncludeArchivedBusinessUnits(false);
        }
    }, [isBusinessUnitEditMode]);

    React.useEffect(() => {
        if (!isOperatingUnitEditMode) {
            setIncludeArchivedOperatingUnits(false);
        }
    }, [isOperatingUnitEditMode]);

    React.useEffect(() => {
        if (!isDelayCauseEditMode) {
            setIncludeArchivedDelayCauses(false);
        }
    }, [isDelayCauseEditMode]);

    React.useEffect(() => {
        if (!isEveryTimeQuestionEditMode) {
            setIncludeArchivedEveryTimeQuestions(false);
        }
    }, [isEveryTimeQuestionEditMode]);

    React.useEffect(() => {
        if (!isFunctionEditMode) {
            setIncludeArchivedFunctions(false);
        }
    }, [isFunctionEditMode]);

    React.useEffect(() => {
        if (!isProgramEditMode) {
            setIncludeArchivedPrograms(false);
        }
    }, [isProgramEditMode]);

    React.useEffect(() => {
        if (!isDivisionEditMode) {
            setIncludeArchivedDivisions(false);
        }
    }, [isDivisionEditMode]);

    React.useEffect(() => {
        if (!isSiteEditMode) {
            setIncludeArchivedSites(false);
        }
    }, [isSiteEditMode]);

    React.useEffect(() => {
        if (!isPropEditMode) {
            setIncludeArchivedProps(false);
        }
    }, [isPropEditMode]);

    React.useEffect(() => {
        if (!isTrainingRequirementEditMode) {
            setIncludeArchivedTrainingRequirements(false);
        }
    }, [isTrainingRequirementEditMode]);

    React.useEffect(() => {
        if (!isSafetyEquipmentEditMode) {
            setIncludeArchivedSafetyEquipment(false);
        }
    }, [isSafetyEquipmentEditMode]);

    const handleSort = React.useCallback((field) => {
        setSortDirection((prev) => {
            if (field === sortField) {
                return prev === 'asc' ? 'desc' : 'asc';
            }
            return 'asc';
        });
        setSortField(field);
    }, [sortField]);

    const clearFieldError = React.useCallback((field) => {
        setFieldErrors((prev) => {
            if (!prev[field]) return prev;
            const { [field]: _, ...rest } = prev;
            return rest;
        });
    }, []);

    const sectionMessage = React.useMemo(() => {
        if (selectedAction !== 'New' || selectedOption !== 'Auditors') return '';
        if (!myIdInput.trim()) return '';
        if (duplicateAuditor) return DUPLICATE_MYID_MESSAGE;
        if (!manualEntry && !rosterMatch) return 'MyID not found in the roster.';
        return '';
    }, [selectedAction, selectedOption, myIdInput, rosterMatch, duplicateAuditor, manualEntry]);

    const myIdWarning = React.useMemo(() => {
        if (!isNewMode) return '';
        if (manualEntry) return '';
        const normalized = myIdInput.trim();
        if (normalized.length === 6 && !rosterMatch && !duplicateAuditor) {
            return 'MyID not found in the roster.';
        }
        return '';
    }, [isNewMode, manualEntry, myIdInput, rosterMatch, duplicateAuditor]);

    const handleSubmit = React.useCallback(async () => {
        const errors = {};
        if (!myIdInput.trim()) errors.myId = 'MyID is required.';
        if (!firstName.trim()) errors.firstName = 'First name is required.';
        if (!lastName.trim()) errors.lastName = 'Last name is required.';
        if (!divisionId) errors.divisionId = 'Division is required.';
        if (!manualEntry && !rosterMatch && isNewMode) {
            errors.myId = errors.myId || 'MyID must match a roster entry.';
        }
        if (duplicateAuditor) {
            errors.myId = DUPLICATE_MYID_MESSAGE;
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            const msg = 'Please fill out all required fields.';
            toast.error(msg, TOAST_OPTIONS);
            setSubmissionError(msg);
            setSubmissionMessage('');
            return;
        }

        if (sectionMessage) {
            toast.error(sectionMessage, TOAST_OPTIONS);
            setSubmissionError(sectionMessage);
            setSubmissionMessage('');
            return;
        }

        setSubmitting(true);
        setSubmissionError('');
        setSubmissionMessage('');
        setFieldErrors({});

        const payload = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            myId: myIdInput.trim(),
            divisionId: Number(divisionId),
            active: editingAuditor?.active ?? 1
        };

        try {
            const targetAuditorId = isEditMode ? editingAuditor?.auditorId ?? editingAuditor?.auditorid : null;
            if (isEditMode && !targetAuditorId) {
                throw new Error('Unable to determine which auditor to update.');
            }
            const endpoint = isEditMode && targetAuditorId
                ? `${API_BASE}/auditors/${targetAuditorId}`
                : `${API_BASE}/auditors`;
            const method = isEditMode && editingAuditor ? 'PUT' : 'POST';
            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || 'Failed to save auditor.');
            }

            const saved = normalizeAuditorRow(await response.json());
            const successMsg = isEditMode && editingAuditor ? 'Auditor updated successfully.' : 'Auditor added successfully.';

            if (isEditMode && editingAuditor) {
                setAuditorList((prev) =>
                    prev.map((auditor) =>
                        auditor.auditorId === editingAuditor.auditorId ? saved : auditor
                    )
                );
            } else {
                setAuditorList((prev) => [...prev, saved]);
            }

            setSubmissionMessage(successMsg);
            toast.success('Submitted!', SUCCESS_TOAST_OPTIONS);

            setMyIdInput('');
            setFirstName('');
            setLastName('');
            setDivisionId('');
            setManualEntry(false);
            setEditingAuditor(null);
        } catch (error) {
            const errMsg = error.message || 'Failed to save auditor.';
            toast.error(errMsg, TOAST_OPTIONS);
            setSubmissionError(errMsg);
            setSubmissionMessage('');
        } finally {
            setSubmitting(false);
        }
    }, [
        auditorMatch,
        duplicateAuditor,
        divisionId,
        editingAuditor,
        firstName,
        isEditMode,
        isNewMode,
        lastName,
        manualEntry,
        myIdInput,
        rosterMatch,
        sectionMessage,
        selectedAction,
        selectedOption
    ]);

    const handleArchiveToggle = React.useCallback(async () => {
        if (!editingAuditor) return;
        const newActive = editingAuditor.active === 1 ? 0 : 1;
        setSubmitting(true);
        try {
            const payload = {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                myId: myIdInput.trim(),
                divisionId: Number(divisionId),
                active: newActive
            };
            const response = await fetch(`${API_BASE}/auditors/${editingAuditor.auditorId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || 'Failed to update auditor.');
            }
            const saved = normalizeAuditorRow(await response.json());
            setAuditorList((prev) =>
                prev.map((auditor) =>
                    auditor.auditorId === saved.auditorId ? saved : auditor
                )
            );
            setEditingAuditor(saved);
            const successMsg = saved.active === 1 ? 'Auditor reactivated.' : 'Auditor archived.';
            setSubmissionMessage(successMsg);
            toast.success(successMsg, SUCCESS_TOAST_OPTIONS);
        } catch (error) {
            const errMsg = error.message || 'Failed to update auditor.';
            toast.error(errMsg, TOAST_OPTIONS);
            setSubmissionError(errMsg);
            setSubmissionMessage('');
        } finally {
            setSubmitting(false);
        }
    }, [editingAuditor, firstName, lastName, myIdInput, divisionId, normalizeAuditorRow]);

    const handleAuditTypeSubmit = React.useCallback(async () => {
        const errors = {};
        if (!auditTypeInput.trim()) {
            errors.auditTypeName = 'Audit type is required.';
        }
        if (Object.keys(errors).length > 0) {
            setAuditTypeFieldErrors(errors);
            const msg = 'Please fill out all required fields.';
            toast.error(msg, TOAST_OPTIONS);
            setAuditTypeError(msg);
            setAuditTypeMessage('');
            return;
        }

        const payload = {
            auditTypeName: auditTypeInput.trim(),
            active: editingAuditType?.active ?? 1
        };

        setAuditTypeSubmitting(true);
        setAuditTypeError('');
        setAuditTypeMessage('');
        setAuditTypeFieldErrors({});

        try {
            const endpoint = isAuditTypeEditMode && editingAuditType
                ? `${API_BASE}/audit-types/${editingAuditType.auditTypeId}`
                : `${API_BASE}/audit-types`;
            const method = isAuditTypeEditMode && editingAuditType ? 'PUT' : 'POST';
            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || 'Failed to save audit type.');
            }
            const saved = normalizeAuditTypeRow(await response.json());
            const successMsg = isAuditTypeEditMode && editingAuditType
                ? 'Audit type updated successfully.'
                : 'Audit type added successfully.';
            if (isAuditTypeEditMode && editingAuditType) {
                setAuditTypesList((prev) =>
                    prev.map((type) =>
                        type.auditTypeId === editingAuditType.auditTypeId ? saved : type
                    )
                );
            } else {
                setAuditTypesList((prev) => [...prev, saved]);
            }
            setAuditTypeMessage(successMsg);
            toast.success('Submitted!', SUCCESS_TOAST_OPTIONS);
            setAuditTypeInput('');
            setEditingAuditType(null);
        } catch (error) {
            const errMsg = error.message || 'Failed to save audit type.';
            toast.error(errMsg, TOAST_OPTIONS);
            setAuditTypeError(errMsg);
            setAuditTypeMessage('');
        } finally {
            setAuditTypeSubmitting(false);
        }
    }, [auditTypeInput, editingAuditType, isAuditTypeEditMode, normalizeAuditTypeRow]);

    const handleAuditTypeArchive = React.useCallback(async () => {
        if (!editingAuditType) return;
        const newActive = editingAuditType.active === 1 ? 0 : 1;
        setAuditTypeSubmitting(true);
        try {
            const payload = {
                auditTypeName: auditTypeInput.trim() || editingAuditType.auditTypeName,
                active: newActive
            };
            const response = await fetch(`${API_BASE}/audit-types/${editingAuditType.auditTypeId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || 'Failed to update audit type.');
            }
            const saved = normalizeAuditTypeRow(await response.json());
            setAuditTypesList((prev) =>
                prev.map((type) =>
                    type.auditTypeId === saved.auditTypeId ? saved : type
                )
            );
            setEditingAuditType(saved);
            setAuditTypeInput(saved.auditTypeName || '');
            const successMsg = saved.active === 1 ? 'Audit type reactivated.' : 'Audit type archived.';
            setAuditTypeMessage(successMsg);
            toast.success(successMsg, SUCCESS_TOAST_OPTIONS);
        } catch (error) {
            const errMsg = error.message || 'Failed to update audit type.';
            toast.error(errMsg, TOAST_OPTIONS);
            setAuditTypeError(errMsg);
            setAuditTypeMessage('');
        } finally {
            setAuditTypeSubmitting(false);
        }
    }, [auditTypeInput, editingAuditType, normalizeAuditTypeRow]);

    const handleBusinessUnitSubmit = React.useCallback(async () => {
        const errors = {};
        if (!businessUnitInput.trim()) {
            errors.businessUnitName = 'Business unit is required.';
        }
        if (!businessUnitDivisionId) {
            errors.divisionId = 'Division is required.';
        }
        if (Object.keys(errors).length > 0) {
            setBusinessUnitFieldErrors(errors);
            const msg = 'Please fill out all required fields.';
            toast.error(msg, TOAST_OPTIONS);
            setBusinessUnitError(msg);
            setBusinessUnitMessage('');
            return;
        }

        const payload = {
            businessUnitName: businessUnitInput.trim(),
            divisionId: Number(businessUnitDivisionId),
            active: editingBusinessUnit?.active ?? 1
        };

        setBusinessUnitSubmitting(true);
        setBusinessUnitError('');
        setBusinessUnitMessage('');
        setBusinessUnitFieldErrors({});

        try {
            const endpoint = isBusinessUnitEditMode && editingBusinessUnit
                ? `${API_BASE}/business-units/${editingBusinessUnit.businessUnitId}`
                : `${API_BASE}/business-units`;
            const method = isBusinessUnitEditMode && editingBusinessUnit ? 'PUT' : 'POST';
            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || 'Failed to save business unit.');
            }
            const saved = normalizeBusinessUnitRow(await response.json());
            const successMsg = isBusinessUnitEditMode && editingBusinessUnit
                ? 'Business unit updated successfully.'
                : 'Business unit added successfully.';
            if (isBusinessUnitEditMode && editingBusinessUnit) {
                setBusinessUnitsList((prev) =>
                    prev.map((unit) =>
                        unit.businessUnitId === editingBusinessUnit.businessUnitId ? saved : unit
                    )
                );
            } else {
                setBusinessUnitsList((prev) => [...prev, saved]);
            }
            setBusinessUnitMessage(successMsg);
            toast.success('Submitted!', SUCCESS_TOAST_OPTIONS);
            setBusinessUnitInput('');
            setBusinessUnitDivisionId('');
            setEditingBusinessUnit(null);
        } catch (error) {
            const errMsg = error.message || 'Failed to save business unit.';
            toast.error(errMsg, TOAST_OPTIONS);
            setBusinessUnitError(errMsg);
            setBusinessUnitMessage('');
        } finally {
            setBusinessUnitSubmitting(false);
        }
    }, [businessUnitInput, businessUnitDivisionId, editingBusinessUnit, isBusinessUnitEditMode, normalizeBusinessUnitRow]);

    const handleBusinessUnitArchive = React.useCallback(async () => {
        if (!editingBusinessUnit) return;
        const newActive = editingBusinessUnit.active === 1 ? 0 : 1;
        setBusinessUnitSubmitting(true);
        try {
            const payload = {
                businessUnitName: businessUnitInput.trim() || editingBusinessUnit.businessUnitName,
                divisionId: Number(businessUnitDivisionId || editingBusinessUnit.divisionId),
                active: newActive
            };
            const response = await fetch(`${API_BASE}/business-units/${editingBusinessUnit.businessUnitId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || 'Failed to update business unit.');
            }
            const saved = normalizeBusinessUnitRow(await response.json());
            setBusinessUnitsList((prev) =>
                prev.map((unit) =>
                    unit.businessUnitId === saved.businessUnitId ? saved : unit
                )
            );
            setEditingBusinessUnit(saved);
            setBusinessUnitInput(saved.businessUnitName || '');
            setBusinessUnitDivisionId(saved.divisionId ?? '');
            const successMsg = saved.active === 1 ? 'Business unit reactivated.' : 'Business unit archived.';
            setBusinessUnitMessage(successMsg);
            toast.success(successMsg, SUCCESS_TOAST_OPTIONS);
        } catch (error) {
            const errMsg = error.message || 'Failed to update business unit.';
            toast.error(errMsg, TOAST_OPTIONS);
            setBusinessUnitError(errMsg);
            setBusinessUnitMessage('');
        } finally {
            setBusinessUnitSubmitting(false);
        }
    }, [businessUnitInput, businessUnitDivisionId, editingBusinessUnit, normalizeBusinessUnitRow]);

    const handleOperatingUnitSubmit = React.useCallback(async () => {
        const errors = {};
        if (!operatingUnitInput.trim()) {
            errors.operatingUnitName = 'Operating unit is required.';
        }
        if (!operatingUnitDivisionId) {
            errors.divisionId = 'Division is required.';
        }
        if (Object.keys(errors).length > 0) {
            setOperatingUnitFieldErrors(errors);
            const msg = 'Please fill out all required fields.';
            toast.error(msg, TOAST_OPTIONS);
            setOperatingUnitError(msg);
            setOperatingUnitMessage('');
            return;
        }

        const payload = {
            operatingUnitName: operatingUnitInput.trim(),
            divisionId: Number(operatingUnitDivisionId),
            active: editingOperatingUnit?.active ?? 1
        };

        setOperatingUnitSubmitting(true);
        setOperatingUnitError('');
        setOperatingUnitMessage('');
        setOperatingUnitFieldErrors({});

        try {
            const endpoint = isOperatingUnitEditMode && editingOperatingUnit
                ? `${API_BASE}/operating-units/${editingOperatingUnit.operatingUnitId}`
                : `${API_BASE}/operating-units`;
            const method = isOperatingUnitEditMode && editingOperatingUnit ? 'PUT' : 'POST';
            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || 'Failed to save operating unit.');
            }
            const saved = normalizeOperatingUnitRow(await response.json());
            const successMsg = isOperatingUnitEditMode && editingOperatingUnit
                ? 'Operating unit updated successfully.'
                : 'Operating unit added successfully.';
            if (isOperatingUnitEditMode && editingOperatingUnit) {
                setOperatingUnitsList((prev) =>
                    prev.map((unit) =>
                        unit.operatingUnitId === editingOperatingUnit.operatingUnitId ? saved : unit
                    )
                );
            } else {
                setOperatingUnitsList((prev) => [...prev, saved]);
            }
            setOperatingUnitMessage(successMsg);
            toast.success('Submitted!', SUCCESS_TOAST_OPTIONS);
            setOperatingUnitInput('');
            setOperatingUnitDivisionId('');
            setEditingOperatingUnit(null);
        } catch (error) {
            const errMsg = error.message || 'Failed to save operating unit.';
            toast.error(errMsg, TOAST_OPTIONS);
            setOperatingUnitError(errMsg);
            setOperatingUnitMessage('');
        } finally {
            setOperatingUnitSubmitting(false);
        }
    }, [operatingUnitInput, operatingUnitDivisionId, editingOperatingUnit, isOperatingUnitEditMode, normalizeOperatingUnitRow]);

    const handleOperatingUnitArchive = React.useCallback(async () => {
        if (!editingOperatingUnit) return;
        const newActive = editingOperatingUnit.active === 1 ? 0 : 1;
        setOperatingUnitSubmitting(true);
        try {
            const payload = {
                operatingUnitName: operatingUnitInput.trim() || editingOperatingUnit.operatingUnitName,
                divisionId: Number(operatingUnitDivisionId || editingOperatingUnit.divisionId),
                active: newActive
            };
            const response = await fetch(`${API_BASE}/operating-units/${editingOperatingUnit.operatingUnitId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || 'Failed to update operating unit.');
            }
            const saved = normalizeOperatingUnitRow(await response.json());
            setOperatingUnitsList((prev) =>
                prev.map((unit) =>
                    unit.operatingUnitId === saved.operatingUnitId ? saved : unit
                )
            );
            setEditingOperatingUnit(saved);
            setOperatingUnitInput(saved.operatingUnitName || '');
            setOperatingUnitDivisionId(saved.divisionId ?? '');
            const successMsg = saved.active === 1 ? 'Operating unit reactivated.' : 'Operating unit archived.';
            setOperatingUnitMessage(successMsg);
            toast.success(successMsg, SUCCESS_TOAST_OPTIONS);
        } catch (error) {
            const errMsg = error.message || 'Failed to update operating unit.';
            toast.error(errMsg, TOAST_OPTIONS);
            setOperatingUnitError(errMsg);
            setOperatingUnitMessage('');
        } finally {
            setOperatingUnitSubmitting(false);
        }
    }, [operatingUnitInput, operatingUnitDivisionId, editingOperatingUnit, normalizeOperatingUnitRow]);

    const handleDelayCauseSubmit = React.useCallback(async () => {
        const errors = {};
        if (!delayCauseInput.trim()) {
            errors.cause = 'Delay cause is required.';
        }
        if (Object.keys(errors).length > 0) {
            setDelayCauseFieldErrors(errors);
            const msg = 'Please fill out all required fields.';
            toast.error(msg, TOAST_OPTIONS);
            setDelayCauseError(msg);
            setDelayCauseMessage('');
            return;
        }

        const payload = {
            cause: delayCauseInput.trim(),
            active: editingDelayCause?.active ?? 1
        };

        setDelayCauseSubmitting(true);
        setDelayCauseError('');
        setDelayCauseMessage('');
        setDelayCauseFieldErrors({});

        try {
            const endpoint = isDelayCauseEditMode && editingDelayCause
                ? `${API_BASE}/causes/${editingDelayCause.causeId}`
                : `${API_BASE}/causes`;
            const method = isDelayCauseEditMode && editingDelayCause ? 'PUT' : 'POST';
            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || 'Failed to save delay cause.');
            }
            const saved = normalizeDelayCauseRow(await response.json());
            const successMsg = isDelayCauseEditMode && editingDelayCause
                ? 'Delay cause updated successfully.'
                : 'Delay cause added successfully.';
            if (isDelayCauseEditMode && editingDelayCause) {
                setDelayCausesList((prev) =>
                    prev.map((cause) =>
                        cause.causeId === editingDelayCause.causeId ? saved : cause
                    )
                );
            } else {
                setDelayCausesList((prev) => [...prev, saved]);
            }
            setDelayCauseMessage(successMsg);
            toast.success('Submitted!', SUCCESS_TOAST_OPTIONS);
            setDelayCauseInput('');
            setEditingDelayCause(null);
        } catch (error) {
            const errMsg = error.message || 'Failed to save delay cause.';
            toast.error(errMsg, TOAST_OPTIONS);
            setDelayCauseError(errMsg);
            setDelayCauseMessage('');
        } finally {
            setDelayCauseSubmitting(false);
        }
    }, [delayCauseInput, editingDelayCause, isDelayCauseEditMode, normalizeDelayCauseRow]);

    const handleDelayCauseArchive = React.useCallback(async () => {
        if (!editingDelayCause) return;
        const newActive = editingDelayCause.active === 1 ? 0 : 1;
        setDelayCauseSubmitting(true);
        try {
            const payload = {
                cause: delayCauseInput.trim() || editingDelayCause.cause,
                active: newActive
            };
            const response = await fetch(`${API_BASE}/causes/${editingDelayCause.causeId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || 'Failed to update delay cause.');
            }
            const saved = normalizeDelayCauseRow(await response.json());
            setDelayCausesList((prev) =>
                prev.map((cause) =>
                    cause.causeId === saved.causeId ? saved : cause
                )
            );
            setEditingDelayCause(saved);
            setDelayCauseInput(saved.cause || '');
            const successMsg = saved.active === 1 ? 'Delay cause reactivated.' : 'Delay cause archived.';
            setDelayCauseMessage(successMsg);
            toast.success(successMsg, SUCCESS_TOAST_OPTIONS);
        } catch (error) {
            const errMsg = error.message || 'Failed to update delay cause.';
            toast.error(errMsg, TOAST_OPTIONS);
            setDelayCauseError(errMsg);
            setDelayCauseMessage('');
        } finally {
            setDelayCauseSubmitting(false);
        }
    }, [delayCauseInput, editingDelayCause, normalizeDelayCauseRow]);

    const handleEveryTimeQuestionSubmit = React.useCallback(async () => {
        const errors = {};
        if (!everyTimeQuestionInput.trim()) {
            errors.question = 'Question is required.';
        }
        if (!everyTimeQuestionDivisionId) {
            errors.divisionId = 'Division is required.';
        }
        if (Object.keys(errors).length > 0) {
            setEveryTimeQuestionFieldErrors(errors);
            const msg = 'Please fill out all required fields.';
            toast.error(msg, TOAST_OPTIONS);
            setEveryTimeQuestionError(msg);
            setEveryTimeQuestionMessage('');
            return;
        }

        const payload = {
            question: everyTimeQuestionInput.trim(),
            divisionId: Number(everyTimeQuestionDivisionId),
            active: editingEveryTimeQuestion?.active ?? 1
        };

        setEveryTimeQuestionSubmitting(true);
        setEveryTimeQuestionError('');
        setEveryTimeQuestionMessage('');
        setEveryTimeQuestionFieldErrors({});

        try {
            const endpoint = isEveryTimeQuestionEditMode && editingEveryTimeQuestion
                ? `${API_BASE}/everytime-questions/${editingEveryTimeQuestion.etqId}`
                : `${API_BASE}/everytime-questions`;
            const method = isEveryTimeQuestionEditMode && editingEveryTimeQuestion ? 'PUT' : 'POST';
            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || 'Failed to save question.');
            }
            const saved = normalizeEveryTimeQuestionRow(await response.json());
            const successMsg = isEveryTimeQuestionEditMode && editingEveryTimeQuestion
                ? 'Question updated successfully.'
                : 'Question added successfully.';
            if (isEveryTimeQuestionEditMode && editingEveryTimeQuestion) {
                setEveryTimeQuestionsList((prev) =>
                    prev.map((question) =>
                        question.etqId === editingEveryTimeQuestion.etqId ? saved : question
                    )
                );
            } else {
                setEveryTimeQuestionsList((prev) => [...prev, saved]);
            }
            setEveryTimeQuestionMessage(successMsg);
            toast.success('Submitted!', SUCCESS_TOAST_OPTIONS);
            setEveryTimeQuestionInput('');
            setEveryTimeQuestionDivisionId('');
            setEditingEveryTimeQuestion(null);
        } catch (error) {
            const errMsg = error.message || 'Failed to save question.';
            toast.error(errMsg, TOAST_OPTIONS);
            setEveryTimeQuestionError(errMsg);
            setEveryTimeQuestionMessage('');
        } finally {
            setEveryTimeQuestionSubmitting(false);
        }
    }, [everyTimeQuestionInput, everyTimeQuestionDivisionId, editingEveryTimeQuestion, isEveryTimeQuestionEditMode, normalizeEveryTimeQuestionRow]);

    const handleEveryTimeQuestionArchive = React.useCallback(async () => {
        if (!editingEveryTimeQuestion) return;
        const newActive = editingEveryTimeQuestion.active === 1 ? 0 : 1;
        setEveryTimeQuestionSubmitting(true);
        try {
            const payload = {
                question: everyTimeQuestionInput.trim() || editingEveryTimeQuestion.question,
                divisionId: Number(everyTimeQuestionDivisionId || editingEveryTimeQuestion.divisionId),
                active: newActive
            };
            const response = await fetch(`${API_BASE}/everytime-questions/${editingEveryTimeQuestion.etqId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || 'Failed to update question.');
            }
            const saved = normalizeEveryTimeQuestionRow(await response.json());
            setEveryTimeQuestionsList((prev) =>
                prev.map((question) =>
                    question.etqId === saved.etqId ? saved : question
                )
            );
            setEditingEveryTimeQuestion(saved);
            setEveryTimeQuestionInput(saved.question || '');
            setEveryTimeQuestionDivisionId(saved.divisionId ?? '');
            const successMsg = saved.active === 1 ? 'Question reactivated.' : 'Question archived.';
            setEveryTimeQuestionMessage(successMsg);
            toast.success(successMsg, SUCCESS_TOAST_OPTIONS);
        } catch (error) {
            const errMsg = error.message || 'Failed to update question.';
            toast.error(errMsg, TOAST_OPTIONS);
            setEveryTimeQuestionError(errMsg);
            setEveryTimeQuestionMessage('');
        } finally {
            setEveryTimeQuestionSubmitting(false);
        }
    }, [everyTimeQuestionInput, everyTimeQuestionDivisionId, editingEveryTimeQuestion, normalizeEveryTimeQuestionRow]);

    const handleFunctionSubmit = React.useCallback(async () => {
        const errors = {};
        if (!functionInput.trim()) {
            errors.functionName = 'Function is required.';
        }
        if (Object.keys(errors).length > 0) {
            setFunctionFieldErrors(errors);
            const msg = 'Please fill out all required fields.';
            toast.error(msg, TOAST_OPTIONS);
            setFunctionError(msg);
            setFunctionMessage('');
            return;
        }

        const payload = {
            functionName: functionInput.trim(),
            active: editingFunction?.active ?? 1
        };

        setFunctionSubmitting(true);
        setFunctionError('');
        setFunctionMessage('');
        setFunctionFieldErrors({});

        try {
            const endpoint = isFunctionEditMode && editingFunction
                ? `${API_BASE}/functions/${editingFunction.functionId}`
                : `${API_BASE}/functions`;
            const method = isFunctionEditMode && editingFunction ? 'PUT' : 'POST';
            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || 'Failed to save function.');
            }
            const saved = normalizeFunctionRow(await response.json());
            const successMsg = isFunctionEditMode && editingFunction
                ? 'Function updated successfully.'
                : 'Function added successfully.';
            if (isFunctionEditMode && editingFunction) {
                setFunctionsList((prev) =>
                    prev.map((fn) =>
                        fn.functionId === editingFunction.functionId ? saved : fn
                    )
                );
            } else {
                setFunctionsList((prev) => [...prev, saved]);
            }
            setFunctionMessage(successMsg);
            toast.success('Submitted!', SUCCESS_TOAST_OPTIONS);
            setFunctionInput('');
            setEditingFunction(null);
        } catch (error) {
            const errMsg = error.message || 'Failed to save function.';
            toast.error(errMsg, TOAST_OPTIONS);
            setFunctionError(errMsg);
            setFunctionMessage('');
        } finally {
            setFunctionSubmitting(false);
        }
    }, [functionInput, editingFunction, isFunctionEditMode, normalizeFunctionRow]);

    const handleFunctionArchive = React.useCallback(async () => {
        if (!editingFunction) return;
        const newActive = editingFunction.active === 1 ? 0 : 1;
        setFunctionSubmitting(true);
        try {
            const payload = {
                functionName: functionInput.trim() || editingFunction.functionName,
                active: newActive
            };
            const response = await fetch(`${API_BASE}/functions/${editingFunction.functionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || 'Failed to update function.');
            }
            const saved = normalizeFunctionRow(await response.json());
            setFunctionsList((prev) =>
                prev.map((fn) =>
                    fn.functionId === saved.functionId ? saved : fn
                )
            );
            setEditingFunction(saved);
            setFunctionInput(saved.functionName || '');
            const successMsg = saved.active === 1 ? 'Function reactivated.' : 'Function archived.';
            setFunctionMessage(successMsg);
            toast.success(successMsg, SUCCESS_TOAST_OPTIONS);
        } catch (error) {
            const errMsg = error.message || 'Failed to update function.';
            toast.error(errMsg, TOAST_OPTIONS);
            setFunctionError(errMsg);
            setFunctionMessage('');
        } finally {
            setFunctionSubmitting(false);
        }
    }, [functionInput, editingFunction, normalizeFunctionRow]);

    const handleProgramSubmit = React.useCallback(async () => {
        const errors = {};
        if (!programInput.trim()) {
            errors.programName = 'Program is required.';
        }
        if (!programDivisionId) {
            errors.divisionId = 'Division is required.';
        }
        if (Object.keys(errors).length > 0) {
            setProgramFieldErrors(errors);
            const msg = 'Please fill out all required fields.';
            toast.error(msg, TOAST_OPTIONS);
            setProgramError(msg);
            setProgramMessage('');
            return;
        }

        const payload = {
            programName: programInput.trim(),
            divisionId: Number(programDivisionId),
            active: editingProgram?.active ?? 1
        };

        setProgramSubmitting(true);
        setProgramError('');
        setProgramMessage('');
        setProgramFieldErrors({});

        try {
            const endpoint = isProgramEditMode && editingProgram
                ? `${API_BASE}/programs/${editingProgram.programId}`
                : `${API_BASE}/programs`;
            const method = isProgramEditMode && editingProgram ? 'PUT' : 'POST';
            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || 'Failed to save program.');
            }
            const saved = normalizeProgramRow(await response.json());
            const successMsg = isProgramEditMode && editingProgram
                ? 'Program updated successfully.'
                : 'Program added successfully.';
            if (isProgramEditMode && editingProgram) {
                setProgramsList((prev) =>
                    prev.map((program) =>
                        program.programId === editingProgram.programId ? saved : program
                    )
                );
            } else {
                setProgramsList((prev) => [...prev, saved]);
            }
            setProgramMessage(successMsg);
            toast.success('Submitted!', SUCCESS_TOAST_OPTIONS);
            setProgramInput('');
            setProgramDivisionId('');
            setEditingProgram(null);
        } catch (error) {
            const errMsg = error.message || 'Failed to save program.';
            toast.error(errMsg, TOAST_OPTIONS);
            setProgramError(errMsg);
            setProgramMessage('');
        } finally {
            setProgramSubmitting(false);
        }
    }, [programInput, programDivisionId, editingProgram, isProgramEditMode, normalizeProgramRow]);

    const handleProgramArchive = React.useCallback(async () => {
        if (!editingProgram) return;
        const newActive = editingProgram.active === 1 ? 0 : 1;
        setProgramSubmitting(true);
        try {
            const payload = {
                programName: programInput.trim() || editingProgram.programName,
                divisionId: Number(programDivisionId || editingProgram.divisionId),
                active: newActive
            };
            const response = await fetch(`${API_BASE}/programs/${editingProgram.programId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || 'Failed to update program.');
            }
            const saved = normalizeProgramRow(await response.json());
            setProgramsList((prev) =>
                prev.map((program) =>
                    program.programId === saved.programId ? saved : program
                )
            );
            setEditingProgram(saved);
            setProgramInput(saved.programName || '');
            setProgramDivisionId(saved.divisionId ?? '');
            const successMsg = saved.active === 1 ? 'Program reactivated.' : 'Program archived.';
            setProgramMessage(successMsg);
            toast.success(successMsg, SUCCESS_TOAST_OPTIONS);
        } catch (error) {
            const errMsg = error.message || 'Failed to update program.';
            toast.error(errMsg, TOAST_OPTIONS);
            setProgramError(errMsg);
            setProgramMessage('');
        } finally {
            setProgramSubmitting(false);
        }
    }, [programInput, programDivisionId, editingProgram, normalizeProgramRow]);

    const handleDivisionSubmit = React.useCallback(async () => {
        const errors = {};
        if (!divisionNameInput.trim()) {
            errors.divisionName = 'Division is required.';
        }
        if (!divisionSectorId) {
            errors.sectorId = 'Sector is required.';
        }
        if (Object.keys(errors).length > 0) {
            setDivisionFieldErrors(errors);
            const msg = 'Please fill out all required fields.';
            toast.error(msg, TOAST_OPTIONS);
            setDivisionError(msg);
            setDivisionMessage('');
            return;
        }

        const payload = {
            divisionName: divisionNameInput.trim(),
            sectorId: Number(divisionSectorId),
            active: editingDivision?.active ?? 1
        };

        setDivisionSubmitting(true);
        setDivisionError('');
        setDivisionMessage('');
        setDivisionFieldErrors({});

        try {
            const endpoint = isDivisionEditMode && editingDivision
                ? `${API_BASE}/divisions/${editingDivision.divisionId}`
                : `${API_BASE}/divisions`;
            const method = isDivisionEditMode && editingDivision ? 'PUT' : 'POST';
            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || 'Failed to save division.');
            }
            const saved = normalizeDivisionRow(await response.json());
            const successMsg = isDivisionEditMode && editingDivision
                ? 'Division updated successfully.'
                : 'Division added successfully.';
            if (isDivisionEditMode && editingDivision) {
                setDivisionsList((prev) =>
                    prev.map((division) =>
                        division.divisionId === editingDivision.divisionId ? saved : division
                    )
                );
            } else {
                setDivisionsList((prev) => [...prev, saved]);
            }
            setDivisionMessage(successMsg);
            toast.success('Submitted!', SUCCESS_TOAST_OPTIONS);
            setDivisionNameInput('');
            setDivisionSectorId('');
            setEditingDivision(null);
        } catch (error) {
            const errMsg = error.message || 'Failed to save division.';
            toast.error(errMsg, TOAST_OPTIONS);
            setDivisionError(errMsg);
            setDivisionMessage('');
        } finally {
            setDivisionSubmitting(false);
        }
    }, [divisionNameInput, divisionSectorId, editingDivision, isDivisionEditMode, normalizeDivisionRow]);

    const handleDivisionArchive = React.useCallback(async () => {
        if (!editingDivision) return;
        const newActive = editingDivision.active === 1 ? 0 : 1;
        setDivisionSubmitting(true);
        try {
            const payload = {
                divisionName: divisionNameInput.trim() || editingDivision.divisionName,
                sectorId: Number(divisionSectorId || editingDivision.sectorId),
                active: newActive
            };
            const response = await fetch(`${API_BASE}/divisions/${editingDivision.divisionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || 'Failed to update division.');
            }
            const saved = normalizeDivisionRow(await response.json());
            setDivisionsList((prev) =>
                prev.map((division) =>
                    division.divisionId === saved.divisionId ? saved : division
                )
            );
            setEditingDivision(saved);
            setDivisionNameInput(saved.divisionName || '');
            setDivisionSectorId(saved.sectorId ?? '');
            const successMsg = saved.active === 1 ? 'Division reactivated.' : 'Division archived.';
            setDivisionMessage(successMsg);
            toast.success(successMsg, SUCCESS_TOAST_OPTIONS);
        } catch (error) {
            const errMsg = error.message || 'Failed to update division.';
            toast.error(errMsg, TOAST_OPTIONS);
            setDivisionError(errMsg);
            setDivisionMessage('');
        } finally {
            setDivisionSubmitting(false);
        }
    }, [divisionNameInput, divisionSectorId, editingDivision, normalizeDivisionRow]);

    const handleSiteSubmit = React.useCallback(async () => {
        const errors = {};
        if (!siteAddressInput.trim()) {
            errors.address = 'Address is required.';
        }
        if (!siteCityInput.trim()) {
            errors.city = 'City is required.';
        }
        if (!siteStateInput.trim()) {
            errors.state = 'State is required.';
        }
        if (!siteCountryInput.trim()) {
            errors.country = 'Country is required.';
        }
        if (!siteDivisionId) {
            errors.divisionId = 'Division is required.';
        }
        if (Object.keys(errors).length > 0) {
            setSiteFieldErrors(errors);
            const msg = 'Please fill out all required fields.';
            toast.error(msg, TOAST_OPTIONS);
            setSiteError(msg);
            setSiteMessage('');
            return;
        }

        const payload = {
            address: siteAddressInput.trim(),
            city: siteCityInput.trim(),
            state: siteStateInput.trim(),
            country: siteCountryInput.trim(),
            divisionId: Number(siteDivisionId),
            active: editingSite?.active ?? 1
        };

        setSiteSubmitting(true);
        setSiteError('');
        setSiteMessage('');
        setSiteFieldErrors({});

        try {
            const endpoint = isSiteEditMode && editingSite
                ? `${API_BASE}/sites/${editingSite.siteId}`
                : `${API_BASE}/sites`;
            const method = isSiteEditMode && editingSite ? 'PUT' : 'POST';
            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || 'Failed to save site.');
            }
            const saved = normalizeSiteRow(await response.json());
            const successMsg = isSiteEditMode && editingSite
                ? 'Site updated successfully.'
                : 'Site added successfully.';
            if (isSiteEditMode && editingSite) {
                setSitesList((prev) =>
                    prev.map((site) =>
                        site.siteId === editingSite.siteId ? saved : site
                    )
                );
            } else {
                setSitesList((prev) => [...prev, saved]);
            }
            setSiteMessage(successMsg);
            toast.success('Submitted!', SUCCESS_TOAST_OPTIONS);
            setSiteAddressInput('');
            setSiteCityInput('');
            setSiteStateInput('');
            setSiteCountryInput('');
            setSiteDivisionId('');
            setEditingSite(null);
        } catch (error) {
            const errMsg = error.message || 'Failed to save site.';
            toast.error(errMsg, TOAST_OPTIONS);
            setSiteError(errMsg);
            setSiteMessage('');
        } finally {
            setSiteSubmitting(false);
        }
    }, [siteAddressInput, siteCityInput, siteStateInput, siteCountryInput, siteDivisionId, editingSite, isSiteEditMode, normalizeSiteRow]);

    const handleSiteArchive = React.useCallback(async () => {
        if (!editingSite) return;
        const newActive = editingSite.active === 1 ? 0 : 1;
        setSiteSubmitting(true);
        try {
            const payload = {
                address: siteAddressInput.trim() || editingSite.address,
                city: siteCityInput.trim() || editingSite.city,
                state: siteStateInput.trim() || editingSite.state,
                country: siteCountryInput.trim() || editingSite.country,
                divisionId: Number(siteDivisionId || editingSite.divisionId),
                active: newActive
            };
            const response = await fetch(`${API_BASE}/sites/${editingSite.siteId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || 'Failed to update site.');
            }
            const saved = normalizeSiteRow(await response.json());
            setSitesList((prev) =>
                prev.map((site) =>
                    site.siteId === saved.siteId ? saved : site
                )
            );
            setEditingSite(saved);
            setSiteAddressInput(saved.address || '');
            setSiteCityInput(saved.city || '');
            setSiteStateInput(saved.state || '');
            setSiteCountryInput(saved.country || '');
            setSiteDivisionId(saved.divisionId ?? '');
            const successMsg = saved.active === 1 ? 'Site reactivated.' : 'Site archived.';
            setSiteMessage(successMsg);
            toast.success(successMsg, SUCCESS_TOAST_OPTIONS);
        } catch (error) {
            const errMsg = error.message || 'Failed to update site.';
            toast.error(errMsg, TOAST_OPTIONS);
            setSiteError(errMsg);
            setSiteMessage('');
        } finally {
            setSiteSubmitting(false);
        }
    }, [siteAddressInput, siteCityInput, siteStateInput, siteCountryInput, siteDivisionId, editingSite, normalizeSiteRow]);

    const getPropTargetLabel = React.useCallback((prop) => {
        if (!prop) return '';
        switch (Number(prop.propTypeId)) {
            case 1:
                return 'Corporate';
            case 2:
                return getSectorName(prop.sectorId);
            case 3:
                return getDivisionName(prop.divisionId);
            case 4:
                return getSiteName(prop.siteId);
            case 5:
                return getBusinessUnitName(prop.buId);
            case 6:
                return getOperatingUnitName(prop.ouId);
            case 7:
                return getProgramName(prop.programId);
            default:
                return '';
        }
    }, [getSectorName, getDivisionName, getSiteName, getBusinessUnitName, getOperatingUnitName, getProgramName]);

    const getPropTargetOptions = React.useCallback(() => {
        switch (Number(propTypeId)) {
            case 2:
                return sectorsList.map((sector) => ({
                    value: sector.sectorId,
                    label: sector.sectorName
                }));
            case 3:
                return sortedDivisions.map((division) => ({
                    value: division.divisionId,
                    label: division.divisionName
                }));
            case 4:
                return sitesList
                    .filter((site) => (site.active ?? 1) === 1)
                    .map((site) => ({
                        value: site.siteId,
                        label: getSiteLabel(site)
                    }));
            case 5:
                return businessUnitsList
                    .filter((bu) => (bu.active ?? 1) === 1)
                    .map((bu) => ({
                        value: bu.businessUnitId,
                        label: bu.businessUnitName
                    }));
            case 6:
                return operatingUnitsList
                    .filter((ou) => (ou.active ?? 1) === 1)
                    .map((ou) => ({
                        value: ou.operatingUnitId,
                        label: ou.operatingUnitName
                    }));
            case 7:
                return programsList
                    .filter((program) => (program.active ?? 1) === 1)
                    .map((program) => ({
                        value: program.programId,
                        label: program.programName
                    }));
            default:
                return [];
        }
    }, [propTypeId, sectorsList, sortedDivisions, sitesList, businessUnitsList, operatingUnitsList, programsList, getSiteLabel]);

    const getPropTargetLabelText = React.useCallback(() => {
        switch (Number(propTypeId)) {
            case 2:
                return 'Sector';
            case 3:
                return 'Division';
            case 4:
                return 'Site';
            case 5:
                return 'Business Unit';
            case 6:
                return 'Operating Unit';
            case 7:
                return 'Program';
            default:
                return '';
        }
    }, [propTypeId]);

    const propTargetOptions = React.useMemo(() => {
        const options = getPropTargetOptions();
        return [...options].sort((a, b) => (a.label || '').localeCompare(b.label || ''));
    }, [getPropTargetOptions]);

    const propTargetLabel = React.useMemo(() => getPropTargetLabelText(), [getPropTargetLabelText]);

    const clearPropTarget = React.useCallback(() => {
        setPropTargetId('');
        if (propFieldErrors.targetId) {
            setPropFieldErrors((prev) => {
                const { targetId, ...rest } = prev;
                return rest;
            });
        }
    }, [propFieldErrors.targetId]);

    const handlePropSubmit = React.useCallback(async () => {
        const errors = {};
        if (!propInput.trim()) {
            errors.PrOP = 'PrOP name is required.';
        }
        if (!propTypeId) {
            errors.propTypeId = 'PrOP type is required.';
        }
        if ([2, 3, 4, 5, 6, 7].includes(Number(propTypeId)) && !propTargetId) {
            errors.targetId = 'Selection is required for this type.';
        }
        if (Object.keys(errors).length > 0) {
            setPropFieldErrors(errors);
            const msg = 'Please fill out all required fields.';
            toast.error(msg, TOAST_OPTIONS);
            setPropError(msg);
            setPropMessage('');
            return;
        }

        const typeValue = Number(propTypeId);
        const payload = {
            PrOP: propInput.trim(),
            propTypeId: typeValue,
            sectorId: null,
            divisionId: null,
            siteId: null,
            buId: null,
            ouId: null,
            programId: null,
            active: editingProp?.active ?? 1
        };

        if (typeValue === 2) payload.sectorId = Number(propTargetId);
        if (typeValue === 3) payload.divisionId = Number(propTargetId);
        if (typeValue === 4) payload.siteId = Number(propTargetId);
        if (typeValue === 5) payload.buId = Number(propTargetId);
        if (typeValue === 6) payload.ouId = Number(propTargetId);
        if (typeValue === 7) payload.programId = Number(propTargetId);

        setPropSubmitting(true);
        setPropError('');
        setPropMessage('');
        setPropFieldErrors({});

        try {
            const endpoint = isPropEditMode && editingProp
                ? `${API_BASE}/props/${editingProp.propId}`
                : `${API_BASE}/props`;
            const method = isPropEditMode && editingProp ? 'PUT' : 'POST';
            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || 'Failed to save PrOP.');
            }
            const saved = normalizePropRow(await response.json());
            const successMsg = isPropEditMode && editingProp
                ? 'PrOP updated successfully.'
                : 'PrOP added successfully.';
            if (isPropEditMode && editingProp) {
                setPropsList((prev) =>
                    prev.map((prop) =>
                        prop.propId === editingProp.propId ? saved : prop
                    )
                );
            } else {
                setPropsList((prev) => [...prev, saved]);
            }
            setPropMessage(successMsg);
            toast.success('Submitted!', SUCCESS_TOAST_OPTIONS);
            setPropInput('');
            setPropTypeId('');
            setPropTargetId('');
            setEditingProp(null);
        } catch (error) {
            const errMsg = error.message || 'Failed to save PrOP.';
            toast.error(errMsg, TOAST_OPTIONS);
            setPropError(errMsg);
            setPropMessage('');
        } finally {
            setPropSubmitting(false);
        }
    }, [propInput, propTypeId, propTargetId, editingProp, isPropEditMode, normalizePropRow]);

    const handlePropArchive = React.useCallback(async () => {
        if (!editingProp) return;
        const newActive = editingProp.active === 1 ? 0 : 1;
        setPropSubmitting(true);
        try {
            const typeValue = Number(propTypeId || editingProp.propTypeId);
            const payload = {
                PrOP: propInput.trim() || editingProp.PrOP,
                propTypeId: typeValue,
                sectorId: null,
                divisionId: null,
                siteId: null,
                buId: null,
                ouId: null,
                programId: null,
                active: newActive
            };
            const targetValue = propTargetId || (() => {
                switch (typeValue) {
                    case 2:
                        return editingProp.sectorId;
                    case 3:
                        return editingProp.divisionId;
                    case 4:
                        return editingProp.siteId;
                    case 5:
                        return editingProp.buId;
                    case 6:
                        return editingProp.ouId;
                    case 7:
                        return editingProp.programId;
                    default:
                        return null;
                }
            })();
            if (typeValue === 2) payload.sectorId = Number(targetValue);
            if (typeValue === 3) payload.divisionId = Number(targetValue);
            if (typeValue === 4) payload.siteId = Number(targetValue);
            if (typeValue === 5) payload.buId = Number(targetValue);
            if (typeValue === 6) payload.ouId = Number(targetValue);
            if (typeValue === 7) payload.programId = Number(targetValue);

            const response = await fetch(`${API_BASE}/props/${editingProp.propId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || 'Failed to update PrOP.');
            }
            const saved = normalizePropRow(await response.json());
            setPropsList((prev) =>
                prev.map((prop) =>
                    prop.propId === saved.propId ? saved : prop
                )
            );
            setEditingProp(saved);
            setPropInput(saved.PrOP || '');
            setPropTypeId(saved.propTypeId ? String(saved.propTypeId) : '');
            setPropTargetId(() => {
                switch (Number(saved.propTypeId)) {
                    case 2:
                        return saved.sectorId != null ? String(saved.sectorId) : '';
                    case 3:
                        return saved.divisionId != null ? String(saved.divisionId) : '';
                    case 4:
                        return saved.siteId != null ? String(saved.siteId) : '';
                    case 5:
                        return saved.buId != null ? String(saved.buId) : '';
                    case 6:
                        return saved.ouId != null ? String(saved.ouId) : '';
                    case 7:
                        return saved.programId != null ? String(saved.programId) : '';
                    default:
                        return '';
                }
            });
            const successMsg = saved.active === 1 ? 'PrOP reactivated.' : 'PrOP archived.';
            setPropMessage(successMsg);
            toast.success(successMsg, SUCCESS_TOAST_OPTIONS);
        } catch (error) {
            const errMsg = error.message || 'Failed to update PrOP.';
            toast.error(errMsg, TOAST_OPTIONS);
            setPropError(errMsg);
            setPropMessage('');
        } finally {
            setPropSubmitting(false);
        }
    }, [propInput, propTypeId, propTargetId, editingProp, normalizePropRow]);

    const handleTrainingRequirementSubmit = React.useCallback(async () => {
        const errors = {};
        if (!trainingRequirementInput.trim()) {
            errors.trainingRequirementName = 'Training requirement is required.';
        }
        if (Object.keys(errors).length > 0) {
            setTrainingRequirementFieldErrors(errors);
            const msg = 'Please fill out all required fields.';
            toast.error(msg, TOAST_OPTIONS);
            setTrainingRequirementError(msg);
            setTrainingRequirementMessage('');
            return;
        }

        const payload = {
            trainingRequirementName: trainingRequirementInput.trim(),
            active: editingTrainingRequirement?.active ?? 1
        };

        setTrainingRequirementSubmitting(true);
        setTrainingRequirementError('');
        setTrainingRequirementMessage('');
        setTrainingRequirementFieldErrors({});

        try {
            const endpoint = isTrainingRequirementEditMode && editingTrainingRequirement
                ? `${API_BASE}/training-requirements/${editingTrainingRequirement.trainingRequirementId}`
                : `${API_BASE}/training-requirements`;
            const method = isTrainingRequirementEditMode && editingTrainingRequirement ? 'PUT' : 'POST';
            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || 'Failed to save training requirement.');
            }
            const saved = normalizeTrainingRequirementRow(await response.json());
            const successMsg = isTrainingRequirementEditMode && editingTrainingRequirement
                ? 'Training requirement updated successfully.'
                : 'Training requirement added successfully.';
            if (isTrainingRequirementEditMode && editingTrainingRequirement) {
                setTrainingRequirementsList((prev) =>
                    prev.map((requirement) =>
                        requirement.trainingRequirementId === editingTrainingRequirement.trainingRequirementId
                            ? saved
                            : requirement
                    )
                );
            } else {
                setTrainingRequirementsList((prev) => [...prev, saved]);
            }
            setTrainingRequirementMessage(successMsg);
            toast.success('Submitted!', SUCCESS_TOAST_OPTIONS);
            setTrainingRequirementInput('');
            setEditingTrainingRequirement(null);
        } catch (error) {
            const errMsg = error.message || 'Failed to save training requirement.';
            toast.error(errMsg, TOAST_OPTIONS);
            setTrainingRequirementError(errMsg);
            setTrainingRequirementMessage('');
        } finally {
            setTrainingRequirementSubmitting(false);
        }
    }, [trainingRequirementInput, editingTrainingRequirement, isTrainingRequirementEditMode, normalizeTrainingRequirementRow]);

    const handleTrainingRequirementArchive = React.useCallback(async () => {
        if (!editingTrainingRequirement) return;
        const newActive = editingTrainingRequirement.active === 1 ? 0 : 1;
        setTrainingRequirementSubmitting(true);
        try {
            const payload = {
                trainingRequirementName: trainingRequirementInput.trim() || editingTrainingRequirement.trainingRequirementName,
                active: newActive
            };
            const response = await fetch(`${API_BASE}/training-requirements/${editingTrainingRequirement.trainingRequirementId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || 'Failed to update training requirement.');
            }
            const saved = normalizeTrainingRequirementRow(await response.json());
            setTrainingRequirementsList((prev) =>
                prev.map((requirement) =>
                    requirement.trainingRequirementId === saved.trainingRequirementId ? saved : requirement
                )
            );
            setEditingTrainingRequirement(saved);
            setTrainingRequirementInput(saved.trainingRequirementName || '');
            const successMsg = saved.active === 1 ? 'Training requirement reactivated.' : 'Training requirement archived.';
            setTrainingRequirementMessage(successMsg);
            toast.success(successMsg, SUCCESS_TOAST_OPTIONS);
        } catch (error) {
            const errMsg = error.message || 'Failed to update training requirement.';
            toast.error(errMsg, TOAST_OPTIONS);
            setTrainingRequirementError(errMsg);
            setTrainingRequirementMessage('');
        } finally {
            setTrainingRequirementSubmitting(false);
        }
    }, [trainingRequirementInput, editingTrainingRequirement, normalizeTrainingRequirementRow]);

    const handleSafetyEquipmentSubmit = React.useCallback(async () => {
        const errors = {};
        if (!safetyEquipmentInput.trim()) {
            errors.safetyEquipmentName = 'Safety equipment is required.';
        }
        if (Object.keys(errors).length > 0) {
            setSafetyEquipmentFieldErrors(errors);
            const msg = 'Please fill out all required fields.';
            toast.error(msg, TOAST_OPTIONS);
            setSafetyEquipmentError(msg);
            setSafetyEquipmentMessage('');
            return;
        }

        const payload = {
            safetyEquipmentName: safetyEquipmentInput.trim(),
            active: editingSafetyEquipment?.active ?? 1
        };

        setSafetyEquipmentSubmitting(true);
        setSafetyEquipmentError('');
        setSafetyEquipmentMessage('');
        setSafetyEquipmentFieldErrors({});

        try {
            const endpoint = isSafetyEquipmentEditMode && editingSafetyEquipment
                ? `${API_BASE}/safety-equipment/${editingSafetyEquipment.safetyEquipmentId}`
                : `${API_BASE}/safety-equipment`;
            const method = isSafetyEquipmentEditMode && editingSafetyEquipment ? 'PUT' : 'POST';
            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || 'Failed to save safety equipment.');
            }
            const saved = normalizeSafetyEquipmentRow(await response.json());
            const successMsg = isSafetyEquipmentEditMode && editingSafetyEquipment
                ? 'Safety equipment updated successfully.'
                : 'Safety equipment added successfully.';
            if (isSafetyEquipmentEditMode && editingSafetyEquipment) {
                setSafetyEquipmentList((prev) =>
                    prev.map((equipment) =>
                        equipment.safetyEquipmentId === editingSafetyEquipment.safetyEquipmentId
                            ? saved
                            : equipment
                    )
                );
            } else {
                setSafetyEquipmentList((prev) => [...prev, saved]);
            }
            setSafetyEquipmentMessage(successMsg);
            toast.success('Submitted!', SUCCESS_TOAST_OPTIONS);
            setSafetyEquipmentInput('');
            setEditingSafetyEquipment(null);
        } catch (error) {
            const errMsg = error.message || 'Failed to save safety equipment.';
            toast.error(errMsg, TOAST_OPTIONS);
            setSafetyEquipmentError(errMsg);
            setSafetyEquipmentMessage('');
        } finally {
            setSafetyEquipmentSubmitting(false);
        }
    }, [safetyEquipmentInput, editingSafetyEquipment, isSafetyEquipmentEditMode, normalizeSafetyEquipmentRow]);

    const handleSafetyEquipmentArchive = React.useCallback(async () => {
        if (!editingSafetyEquipment) return;
        const newActive = editingSafetyEquipment.active === 1 ? 0 : 1;
        setSafetyEquipmentSubmitting(true);
        try {
            const payload = {
                safetyEquipmentName: safetyEquipmentInput.trim() || editingSafetyEquipment.safetyEquipmentName,
                active: newActive
            };
            const response = await fetch(`${API_BASE}/safety-equipment/${editingSafetyEquipment.safetyEquipmentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || 'Failed to update safety equipment.');
            }
            const saved = normalizeSafetyEquipmentRow(await response.json());
            setSafetyEquipmentList((prev) =>
                prev.map((equipment) =>
                    equipment.safetyEquipmentId === saved.safetyEquipmentId ? saved : equipment
                )
            );
            setEditingSafetyEquipment(saved);
            setSafetyEquipmentInput(saved.safetyEquipmentName || '');
            const successMsg = saved.active === 1 ? 'Safety equipment reactivated.' : 'Safety equipment archived.';
            setSafetyEquipmentMessage(successMsg);
            toast.success(successMsg, SUCCESS_TOAST_OPTIONS);
        } catch (error) {
            const errMsg = error.message || 'Failed to update safety equipment.';
            toast.error(errMsg, TOAST_OPTIONS);
            setSafetyEquipmentError(errMsg);
            setSafetyEquipmentMessage('');
        } finally {
            setSafetyEquipmentSubmitting(false);
        }
    }, [safetyEquipmentInput, editingSafetyEquipment, normalizeSafetyEquipmentRow]);

    if (loading || !currentUser) {
        return (
            <div className="admin-shell">
                <div className="admin-card" style={{ justifyContent: 'center', display: 'flex', textAlign: 'center' }}>
                    Loading...
                </div>
            </div>
        );
    }

    if (!currentUser.isAdmin) {
        return (
            <div className="admin-shell">
                <div className="admin-card">
                    <p className="admin-subtitle">Restricted</p>
                    <p>You do not have admin access. Redirecting...</p>
                    <button className="admin-primary" type="button" onClick={() => navigate('/audit')}>
                        View My Audits
                    </button>
                </div>
            </div>
        );
    }

    const mailto = `mailto:walter.osborne@ngc.com?subject=${encodeURIComponent(
        currentUser.myId ? `NGAT user verification (${currentUser.myId})` : 'NGAT user verification'
    )}&body=${encodeURIComponent(
        currentUser.myId
            ? `Hi Walter, NGAT is registering me with the MyID ${currentUser.myId}, which is incorrect.`
            : 'Hi Walter, NGAT is not registering my MyID correctly.'
    )}`;

    return (
        <div className="admin-shell">
            <div className="admin-card">
                <header className="admin-header">
                    <div>
                        <p className="admin-subtitle">Tools · Admin menu</p>
                        <h1>Admin Menu</h1>
                        <p className="admin-welcome">
                            Welcome {currentUser.name}.{' '}
                            <a href={mailto} target="_blank" rel="noreferrer">
                                Not you?
                            </a>
                        </p>
                    </div>
                </header>
                <div className="admin-action-bar">
                    <div>
                        <label htmlFor="admin-dropdown" className="admin-label">
                            Select a list to manage
                        </label>
                        <select
                            id="admin-dropdown"
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
                {selectedOption === 'Auditors' && (
                    <AuditorsSection
                        actionOptions={ACTION_OPTIONS}
                        selectedAction={selectedAction}
                        onActionChange={(event) => setSelectedAction(event.target.value)}
                        isActiveEditMode={isActiveEditMode}
                        includeArchived={includeArchived}
                        onIncludeArchivedChange={(event) => setIncludeArchived(event.target.checked)}
                        isEditMode={isEditMode}
                        visibleAuditors={visibleAuditors}
                        editingAuditor={editingAuditor}
                        onSelectAuditor={(auditor) => {
                            setEditingAuditor(normalizeAuditorRow(auditor));
                            setManualEntry(false);
                            setSubmissionMessage('');
                            setSubmissionError('');
                        }}
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        getDivisionName={getDivisionName}
                        isNewMode={isNewMode}
                        showFields={showFields}
                        myIdInput={myIdInput}
                        onMyIdChange={(event) => {
                            setMyIdInput(event.target.value);
                            clearFieldError('myId');
                        }}
                        fieldErrors={fieldErrors}
                        myIdWarning={myIdWarning}
                        manualEntry={manualEntry}
                        onManualEntryChange={(event) => setManualEntry(event.target.checked)}
                        firstName={firstName}
                        lastName={lastName}
                        divisionId={divisionId}
                        sortedDivisions={sortedDivisions}
                        onFirstNameChange={(event) => {
                            setFirstName(event.target.value);
                            clearFieldError('firstName');
                        }}
                        onLastNameChange={(event) => {
                            setLastName(event.target.value);
                            clearFieldError('lastName');
                        }}
                        onDivisionChange={(event) => {
                            setDivisionId(event.target.value);
                            clearFieldError('divisionId');
                        }}
                        onClearDivision={() => {
                            setDivisionId('');
                            clearFieldError('divisionId');
                        }}
                        onSubmit={handleSubmit}
                        submitting={submitting}
                        onArchiveToggle={handleArchiveToggle}
                        onReset={() => {
                            setMyIdInput('');
                            setFirstName('');
                            setLastName('');
                            setDivisionId('');
                            setManualEntry(false);
                            setSubmissionError('');
                            setSubmissionMessage('');
                            setFieldErrors({});
                            setEditingAuditor(null);
                        }}
                        submissionMessage={submissionMessage}
                        submissionError={submissionError}
                    />
                )}
                {selectedOption === 'Audit Types' && (
                    <AuditTypesSection
                        actionOptions={ACTION_OPTIONS}
                        selectedAction={selectedAction}
                        onActionChange={(event) => setSelectedAction(event.target.value)}
                        isAuditTypeEditMode={isAuditTypeEditMode}
                        isAuditTypeNewMode={isAuditTypeNewMode}
                        includeArchived={includeArchivedAuditTypes}
                        onIncludeArchivedChange={(event) => setIncludeArchivedAuditTypes(event.target.checked)}
                        visibleAuditTypes={visibleAuditTypes}
                        editingAuditType={editingAuditType}
                        onSelectAuditType={(type) => {
                            setEditingAuditType(type);
                            setAuditTypeInput(type.auditTypeName || '');
                            setAuditTypeMessage('');
                            setAuditTypeError('');
                        }}
                        auditTypeInput={auditTypeInput}
                        onAuditTypeInputChange={(event) => {
                            setAuditTypeInput(event.target.value);
                            if (auditTypeFieldErrors.auditTypeName) {
                                setAuditTypeFieldErrors((prev) => {
                                    const { auditTypeName, ...rest } = prev;
                                    return rest;
                                });
                            }
                        }}
                        auditTypeFieldErrors={auditTypeFieldErrors}
                        onSubmit={handleAuditTypeSubmit}
                        onArchiveToggle={handleAuditTypeArchive}
                        onReset={() => {
                            setAuditTypeInput('');
                            setEditingAuditType(null);
                            setAuditTypeError('');
                            setAuditTypeMessage('');
                            setAuditTypeFieldErrors({});
                        }}
                        submitting={auditTypeSubmitting}
                        auditTypeMessage={auditTypeMessage}
                        auditTypeError={auditTypeError}
                    />
                )}
                {selectedOption === 'Delay Causes' && (
                    <DelayCausesSection
                        actionOptions={ACTION_OPTIONS}
                        selectedAction={selectedAction}
                        onActionChange={(event) => setSelectedAction(event.target.value)}
                        isDelayCauseEditMode={isDelayCauseEditMode}
                        isDelayCauseNewMode={isDelayCauseNewMode}
                        includeArchived={includeArchivedDelayCauses}
                        onIncludeArchivedChange={(event) => setIncludeArchivedDelayCauses(event.target.checked)}
                        visibleDelayCauses={visibleDelayCauses}
                        editingDelayCause={editingDelayCause}
                        onSelectDelayCause={(cause) => {
                            setEditingDelayCause(cause);
                            setDelayCauseInput(cause.cause || '');
                            setDelayCauseMessage('');
                            setDelayCauseError('');
                        }}
                        delayCauseInput={delayCauseInput}
                        onDelayCauseInputChange={(event) => {
                            setDelayCauseInput(event.target.value);
                            if (delayCauseFieldErrors.cause) {
                                setDelayCauseFieldErrors((prev) => {
                                    const { cause, ...rest } = prev;
                                    return rest;
                                });
                            }
                        }}
                        delayCauseFieldErrors={delayCauseFieldErrors}
                        onSubmit={handleDelayCauseSubmit}
                        onArchiveToggle={handleDelayCauseArchive}
                        onReset={() => {
                            setDelayCauseInput('');
                            setEditingDelayCause(null);
                            setDelayCauseError('');
                            setDelayCauseMessage('');
                            setDelayCauseFieldErrors({});
                        }}
                        submitting={delayCauseSubmitting}
                        delayCauseMessage={delayCauseMessage}
                        delayCauseError={delayCauseError}
                    />
                )}
                {selectedOption === 'Every Time Questions' && (
                    <EveryTimeQuestionsSection
                        actionOptions={ACTION_OPTIONS}
                        selectedAction={selectedAction}
                        onActionChange={(event) => setSelectedAction(event.target.value)}
                        isEditMode={isEveryTimeQuestionEditMode}
                        isNewMode={isEveryTimeQuestionNewMode}
                        includeArchived={includeArchivedEveryTimeQuestions}
                        onIncludeArchivedChange={(event) => setIncludeArchivedEveryTimeQuestions(event.target.checked)}
                        visibleQuestions={visibleEveryTimeQuestions}
                        editingQuestion={editingEveryTimeQuestion}
                        onSelectQuestion={(question) => {
                            setEditingEveryTimeQuestion(question);
                            setEveryTimeQuestionInput(question.question || '');
                            setEveryTimeQuestionDivisionId(question.divisionId ?? '');
                            setEveryTimeQuestionMessage('');
                            setEveryTimeQuestionError('');
                        }}
                        getDivisionName={getDivisionName}
                        questionInput={everyTimeQuestionInput}
                        onQuestionInputChange={(event) => {
                            setEveryTimeQuestionInput(event.target.value);
                            if (everyTimeQuestionFieldErrors.question) {
                                setEveryTimeQuestionFieldErrors((prev) => {
                                    const { question, ...rest } = prev;
                                    return rest;
                                });
                            }
                        }}
                        divisionId={everyTimeQuestionDivisionId}
                        onDivisionChange={(event) => {
                            setEveryTimeQuestionDivisionId(event.target.value);
                            if (everyTimeQuestionFieldErrors.divisionId) {
                                setEveryTimeQuestionFieldErrors((prev) => {
                                    const { divisionId, ...rest } = prev;
                                    return rest;
                                });
                            }
                        }}
                        sortedDivisions={sortedDivisions}
                        onClearDivision={() => {
                            setEveryTimeQuestionDivisionId('');
                            if (everyTimeQuestionFieldErrors.divisionId) {
                                setEveryTimeQuestionFieldErrors((prev) => {
                                    const { divisionId, ...rest } = prev;
                                    return rest;
                                });
                            }
                        }}
                        fieldErrors={everyTimeQuestionFieldErrors}
                        onSubmit={handleEveryTimeQuestionSubmit}
                        onArchiveToggle={handleEveryTimeQuestionArchive}
                        onReset={() => {
                            setEveryTimeQuestionInput('');
                            setEveryTimeQuestionDivisionId('');
                            setEditingEveryTimeQuestion(null);
                            setEveryTimeQuestionError('');
                            setEveryTimeQuestionMessage('');
                            setEveryTimeQuestionFieldErrors({});
                        }}
                        submitting={everyTimeQuestionSubmitting}
                        message={everyTimeQuestionMessage}
                        error={everyTimeQuestionError}
                    />
                )}
                {selectedOption === 'Functions' && (
                    <FunctionsSection
                        actionOptions={ACTION_OPTIONS}
                        selectedAction={selectedAction}
                        onActionChange={(event) => setSelectedAction(event.target.value)}
                        isEditMode={isFunctionEditMode}
                        isNewMode={isFunctionNewMode}
                        includeArchived={includeArchivedFunctions}
                        onIncludeArchivedChange={(event) => setIncludeArchivedFunctions(event.target.checked)}
                        visibleFunctions={visibleFunctions}
                        editingFunction={editingFunction}
                        onSelectFunction={(fn) => {
                            setEditingFunction(fn);
                            setFunctionInput(fn.functionName || '');
                            setFunctionMessage('');
                            setFunctionError('');
                        }}
                        functionInput={functionInput}
                        onFunctionInputChange={(event) => {
                            setFunctionInput(event.target.value);
                            if (functionFieldErrors.functionName) {
                                setFunctionFieldErrors((prev) => {
                                    const { functionName, ...rest } = prev;
                                    return rest;
                                });
                            }
                        }}
                        fieldErrors={functionFieldErrors}
                        onSubmit={handleFunctionSubmit}
                        onArchiveToggle={handleFunctionArchive}
                        onReset={() => {
                            setFunctionInput('');
                            setEditingFunction(null);
                            setFunctionError('');
                            setFunctionMessage('');
                            setFunctionFieldErrors({});
                        }}
                        submitting={functionSubmitting}
                        message={functionMessage}
                        error={functionError}
                    />
                )}
                {selectedOption === 'Programs' && (
                    <ProgramsSection
                        actionOptions={ACTION_OPTIONS}
                        selectedAction={selectedAction}
                        onActionChange={(event) => setSelectedAction(event.target.value)}
                        isProgramEditMode={isProgramEditMode}
                        isProgramNewMode={isProgramNewMode}
                        includeArchived={includeArchivedPrograms}
                        onIncludeArchivedChange={(event) => setIncludeArchivedPrograms(event.target.checked)}
                        visiblePrograms={visiblePrograms}
                        editingProgram={editingProgram}
                        onSelectProgram={(program) => {
                            setEditingProgram(program);
                            setProgramInput(program.programName || '');
                            setProgramDivisionId(program.divisionId ?? '');
                            setProgramMessage('');
                            setProgramError('');
                        }}
                        getDivisionName={getDivisionName}
                        programInput={programInput}
                        onProgramInputChange={(event) => {
                            setProgramInput(event.target.value);
                            if (programFieldErrors.programName) {
                                setProgramFieldErrors((prev) => {
                                    const { programName, ...rest } = prev;
                                    return rest;
                                });
                            }
                        }}
                        programDivisionId={programDivisionId}
                        onDivisionChange={(event) => {
                            setProgramDivisionId(event.target.value);
                            if (programFieldErrors.divisionId) {
                                setProgramFieldErrors((prev) => {
                                    const { divisionId, ...rest } = prev;
                                    return rest;
                                });
                            }
                        }}
                        sortedDivisions={sortedDivisions}
                        onClearDivision={() => {
                            setProgramDivisionId('');
                            if (programFieldErrors.divisionId) {
                                setProgramFieldErrors((prev) => {
                                    const { divisionId, ...rest } = prev;
                                    return rest;
                                });
                            }
                        }}
                        programFieldErrors={programFieldErrors}
                        onSubmit={handleProgramSubmit}
                        onArchiveToggle={handleProgramArchive}
                        onReset={() => {
                            setProgramInput('');
                            setProgramDivisionId('');
                            setEditingProgram(null);
                            setProgramError('');
                            setProgramMessage('');
                            setProgramFieldErrors({});
                        }}
                        submitting={programSubmitting}
                        programMessage={programMessage}
                        programError={programError}
                    />
                )}
                {selectedOption === 'Divisions' && (
                    <DivisionsSection
                        actionOptions={ACTION_OPTIONS}
                        selectedAction={selectedAction}
                        onActionChange={(event) => setSelectedAction(event.target.value)}
                        isDivisionEditMode={isDivisionEditMode}
                        isDivisionNewMode={isDivisionNewMode}
                        includeArchived={includeArchivedDivisions}
                        onIncludeArchivedChange={(event) => setIncludeArchivedDivisions(event.target.checked)}
                        visibleDivisions={visibleDivisions}
                        editingDivision={editingDivision}
                        onSelectDivision={(division) => {
                            setEditingDivision(division);
                            setDivisionNameInput(division.divisionName || '');
                            setDivisionSectorId(division.sectorId ?? '');
                            setDivisionMessage('');
                            setDivisionError('');
                        }}
                        getSectorName={getSectorName}
                        divisionInput={divisionNameInput}
                        onDivisionInputChange={(event) => {
                            setDivisionNameInput(event.target.value);
                            if (divisionFieldErrors.divisionName) {
                                setDivisionFieldErrors((prev) => {
                                    const { divisionName, ...rest } = prev;
                                    return rest;
                                });
                            }
                        }}
                        divisionSectorId={divisionSectorId}
                        onSectorChange={(event) => {
                            setDivisionSectorId(event.target.value);
                            if (divisionFieldErrors.sectorId) {
                                setDivisionFieldErrors((prev) => {
                                    const { sectorId, ...rest } = prev;
                                    return rest;
                                });
                            }
                        }}
                        sortedSectors={sortedSectors}
                        onClearSector={() => {
                            setDivisionSectorId('');
                            if (divisionFieldErrors.sectorId) {
                                setDivisionFieldErrors((prev) => {
                                    const { sectorId, ...rest } = prev;
                                    return rest;
                                });
                            }
                        }}
                        divisionFieldErrors={divisionFieldErrors}
                        onSubmit={handleDivisionSubmit}
                        onArchiveToggle={handleDivisionArchive}
                        onReset={() => {
                            setDivisionNameInput('');
                            setDivisionSectorId('');
                            setEditingDivision(null);
                            setDivisionError('');
                            setDivisionMessage('');
                            setDivisionFieldErrors({});
                        }}
                        submitting={divisionSubmitting}
                        divisionMessage={divisionMessage}
                        divisionError={divisionError}
                    />
                )}
                {selectedOption === 'Sites' && (
                    <SitesSection
                        actionOptions={ACTION_OPTIONS}
                        selectedAction={selectedAction}
                        onActionChange={(event) => setSelectedAction(event.target.value)}
                        isSiteEditMode={isSiteEditMode}
                        isSiteNewMode={isSiteNewMode}
                        includeArchived={includeArchivedSites}
                        onIncludeArchivedChange={(event) => setIncludeArchivedSites(event.target.checked)}
                        visibleSites={visibleSites}
                        editingSite={editingSite}
                        onSelectSite={(site) => {
                            setEditingSite(site);
                            setSiteAddressInput(site.address || '');
                            setSiteCityInput(site.city || '');
                            setSiteStateInput(site.state || '');
                            setSiteCountryInput(site.country || '');
                            setSiteDivisionId(site.divisionId ?? '');
                            setSiteMessage('');
                            setSiteError('');
                        }}
                        getDivisionName={getDivisionName}
                        addressInput={siteAddressInput}
                        cityInput={siteCityInput}
                        stateInput={siteStateInput}
                        countryInput={siteCountryInput}
                        divisionId={siteDivisionId}
                        onAddressChange={(event) => {
                            setSiteAddressInput(event.target.value);
                            if (siteFieldErrors.address) {
                                setSiteFieldErrors((prev) => {
                                    const { address, ...rest } = prev;
                                    return rest;
                                });
                            }
                        }}
                        onCityChange={(event) => {
                            setSiteCityInput(event.target.value);
                            if (siteFieldErrors.city) {
                                setSiteFieldErrors((prev) => {
                                    const { city, ...rest } = prev;
                                    return rest;
                                });
                            }
                        }}
                        onStateChange={(event) => {
                            setSiteStateInput(event.target.value);
                            if (siteFieldErrors.state) {
                                setSiteFieldErrors((prev) => {
                                    const { state, ...rest } = prev;
                                    return rest;
                                });
                            }
                        }}
                        onCountryChange={(event) => {
                            setSiteCountryInput(event.target.value);
                            if (siteFieldErrors.country) {
                                setSiteFieldErrors((prev) => {
                                    const { country, ...rest } = prev;
                                    return rest;
                                });
                            }
                        }}
                        onDivisionChange={(event) => {
                            setSiteDivisionId(event.target.value);
                            if (siteFieldErrors.divisionId) {
                                setSiteFieldErrors((prev) => {
                                    const { divisionId, ...rest } = prev;
                                    return rest;
                                });
                            }
                        }}
                        sortedDivisions={sortedDivisions}
                        onClearDivision={() => {
                            setSiteDivisionId('');
                            if (siteFieldErrors.divisionId) {
                                setSiteFieldErrors((prev) => {
                                    const { divisionId, ...rest } = prev;
                                    return rest;
                                });
                            }
                        }}
                        fieldErrors={siteFieldErrors}
                        onSubmit={handleSiteSubmit}
                        onArchiveToggle={handleSiteArchive}
                        onReset={() => {
                            setSiteAddressInput('');
                            setSiteCityInput('');
                            setSiteStateInput('');
                            setSiteCountryInput('');
                            setSiteDivisionId('');
                            setEditingSite(null);
                            setSiteError('');
                            setSiteMessage('');
                            setSiteFieldErrors({});
                        }}
                        submitting={siteSubmitting}
                        message={siteMessage}
                        error={siteError}
                    />
                )}
                {selectedOption === 'PrOP' && (
                    <PropsSection
                        actionOptions={ACTION_OPTIONS}
                        selectedAction={selectedAction}
                        onActionChange={(event) => setSelectedAction(event.target.value)}
                        isPropEditMode={isPropEditMode}
                        isPropNewMode={isPropNewMode}
                        includeArchived={includeArchivedProps}
                        onIncludeArchivedChange={(event) => setIncludeArchivedProps(event.target.checked)}
                        visibleProps={visibleProps}
                        editingProp={editingProp}
                        onSelectProp={(prop) => {
                            setEditingProp(prop);
                            setPropInput(prop.PrOP || '');
                            setPropTypeId(prop.propTypeId ? String(prop.propTypeId) : '');
                            const nextTarget = (() => {
                                switch (Number(prop.propTypeId)) {
                                    case 2:
                                        return prop.sectorId != null ? String(prop.sectorId) : '';
                                    case 3:
                                        return prop.divisionId != null ? String(prop.divisionId) : '';
                                    case 4:
                                        return prop.siteId != null ? String(prop.siteId) : '';
                                    case 5:
                                        return prop.buId != null ? String(prop.buId) : '';
                                    case 6:
                                        return prop.ouId != null ? String(prop.ouId) : '';
                                    case 7:
                                        return prop.programId != null ? String(prop.programId) : '';
                                    default:
                                        return '';
                                }
                            })();
                            setPropTargetId(nextTarget);
                            setPropMessage('');
                            setPropError('');
                        }}
                        propTypeOptions={PROP_TYPE_OPTIONS}
                        propTypeId={propTypeId}
                        onPropTypeChange={(event) => {
                            setPropTypeId(event.target.value);
                            clearPropTarget();
                            if (propFieldErrors.propTypeId) {
                                setPropFieldErrors((prev) => {
                                    const { propTypeId, ...rest } = prev;
                                    return rest;
                                });
                            }
                        }}
                        propTargetOptions={propTargetOptions}
                        propTargetId={propTargetId}
                        propTargetLabel={propTargetLabel}
                        onPropTargetChange={(event) => {
                            setPropTargetId(event.target.value);
                            if (propFieldErrors.targetId) {
                                setPropFieldErrors((prev) => {
                                    const { targetId, ...rest } = prev;
                                    return rest;
                                });
                            }
                        }}
                        propInput={propInput}
                        onPropInputChange={(event) => {
                            setPropInput(event.target.value);
                            if (propFieldErrors.PrOP) {
                                setPropFieldErrors((prev) => {
                                    const { PrOP, ...rest } = prev;
                                    return rest;
                                });
                            }
                        }}
                        fieldErrors={propFieldErrors}
                        onSubmit={handlePropSubmit}
                        onArchiveToggle={handlePropArchive}
                        onReset={() => {
                            setPropInput('');
                            setPropTypeId('');
                            setPropTargetId('');
                            setEditingProp(null);
                            setPropError('');
                            setPropMessage('');
                            setPropFieldErrors({});
                        }}
                        submitting={propSubmitting}
                        message={propMessage}
                        error={propError}
                        getPropTypeLabel={getPropTypeLabel}
                        getPropTargetLabel={getPropTargetLabel}
                    />
                )}
                {selectedOption === 'Training Requirements' && (
                    <TrainingRequirementsSection
                        actionOptions={ACTION_OPTIONS}
                        selectedAction={selectedAction}
                        onActionChange={(event) => setSelectedAction(event.target.value)}
                        isTrainingRequirementEditMode={isTrainingRequirementEditMode}
                        isTrainingRequirementNewMode={isTrainingRequirementNewMode}
                        includeArchived={includeArchivedTrainingRequirements}
                        onIncludeArchivedChange={(event) => setIncludeArchivedTrainingRequirements(event.target.checked)}
                        visibleTrainingRequirements={visibleTrainingRequirements}
                        editingTrainingRequirement={editingTrainingRequirement}
                        onSelectTrainingRequirement={(requirement) => {
                            setEditingTrainingRequirement(requirement);
                            setTrainingRequirementInput(requirement.trainingRequirementName || '');
                            setTrainingRequirementMessage('');
                            setTrainingRequirementError('');
                        }}
                        trainingRequirementInput={trainingRequirementInput}
                        onTrainingRequirementInputChange={(event) => {
                            setTrainingRequirementInput(event.target.value);
                            if (trainingRequirementFieldErrors.trainingRequirementName) {
                                setTrainingRequirementFieldErrors((prev) => {
                                    const { trainingRequirementName, ...rest } = prev;
                                    return rest;
                                });
                            }
                        }}
                        trainingRequirementFieldErrors={trainingRequirementFieldErrors}
                        onSubmit={handleTrainingRequirementSubmit}
                        onArchiveToggle={handleTrainingRequirementArchive}
                        onReset={() => {
                            setTrainingRequirementInput('');
                            setEditingTrainingRequirement(null);
                            setTrainingRequirementError('');
                            setTrainingRequirementMessage('');
                            setTrainingRequirementFieldErrors({});
                        }}
                        submitting={trainingRequirementSubmitting}
                        trainingRequirementMessage={trainingRequirementMessage}
                        trainingRequirementError={trainingRequirementError}
                    />
                )}
                {selectedOption === 'Safety Equipment' && (
                    <SafetyEquipmentSection
                        actionOptions={ACTION_OPTIONS}
                        selectedAction={selectedAction}
                        onActionChange={(event) => setSelectedAction(event.target.value)}
                        isSafetyEquipmentEditMode={isSafetyEquipmentEditMode}
                        isSafetyEquipmentNewMode={isSafetyEquipmentNewMode}
                        includeArchived={includeArchivedSafetyEquipment}
                        onIncludeArchivedChange={(event) => setIncludeArchivedSafetyEquipment(event.target.checked)}
                        visibleSafetyEquipment={visibleSafetyEquipment}
                        editingSafetyEquipment={editingSafetyEquipment}
                        onSelectSafetyEquipment={(equipment) => {
                            setEditingSafetyEquipment(equipment);
                            setSafetyEquipmentInput(equipment.safetyEquipmentName || '');
                            setSafetyEquipmentMessage('');
                            setSafetyEquipmentError('');
                        }}
                        safetyEquipmentInput={safetyEquipmentInput}
                        onSafetyEquipmentInputChange={(event) => {
                            setSafetyEquipmentInput(event.target.value);
                            if (safetyEquipmentFieldErrors.safetyEquipmentName) {
                                setSafetyEquipmentFieldErrors((prev) => {
                                    const { safetyEquipmentName, ...rest } = prev;
                                    return rest;
                                });
                            }
                        }}
                        safetyEquipmentFieldErrors={safetyEquipmentFieldErrors}
                        onSubmit={handleSafetyEquipmentSubmit}
                        onArchiveToggle={handleSafetyEquipmentArchive}
                        onReset={() => {
                            setSafetyEquipmentInput('');
                            setEditingSafetyEquipment(null);
                            setSafetyEquipmentError('');
                            setSafetyEquipmentMessage('');
                            setSafetyEquipmentFieldErrors({});
                        }}
                        submitting={safetyEquipmentSubmitting}
                        safetyEquipmentMessage={safetyEquipmentMessage}
                        safetyEquipmentError={safetyEquipmentError}
                    />
                )}
                {selectedOption === 'Business Units' && (
                    <BusinessUnitsSection
                        actionOptions={ACTION_OPTIONS}
                        selectedAction={selectedAction}
                        onActionChange={(event) => setSelectedAction(event.target.value)}
                        isBusinessUnitEditMode={isBusinessUnitEditMode}
                        isBusinessUnitNewMode={isBusinessUnitNewMode}
                        includeArchived={includeArchivedBusinessUnits}
                        onIncludeArchivedChange={(event) => setIncludeArchivedBusinessUnits(event.target.checked)}
                        visibleBusinessUnits={visibleBusinessUnits}
                        editingBusinessUnit={editingBusinessUnit}
                        onSelectBusinessUnit={(unit) => {
                            setEditingBusinessUnit(unit);
                            setBusinessUnitInput(unit.businessUnitName || '');
                            setBusinessUnitDivisionId(unit.divisionId ?? '');
                            setBusinessUnitMessage('');
                            setBusinessUnitError('');
                        }}
                        getDivisionName={getDivisionName}
                        businessUnitInput={businessUnitInput}
                        onBusinessUnitInputChange={(event) => {
                            setBusinessUnitInput(event.target.value);
                            if (businessUnitFieldErrors.businessUnitName) {
                                setBusinessUnitFieldErrors((prev) => {
                                    const { businessUnitName, ...rest } = prev;
                                    return rest;
                                });
                            }
                        }}
                        businessUnitDivisionId={businessUnitDivisionId}
                        onDivisionChange={(event) => {
                            setBusinessUnitDivisionId(event.target.value);
                            if (businessUnitFieldErrors.divisionId) {
                                setBusinessUnitFieldErrors((prev) => {
                                    const { divisionId, ...rest } = prev;
                                    return rest;
                                });
                            }
                        }}
                        sortedDivisions={sortedDivisions}
                        onClearDivision={() => {
                            setBusinessUnitDivisionId('');
                            if (businessUnitFieldErrors.divisionId) {
                                setBusinessUnitFieldErrors((prev) => {
                                    const { divisionId, ...rest } = prev;
                                    return rest;
                                });
                            }
                        }}
                        businessUnitFieldErrors={businessUnitFieldErrors}
                        onSubmit={handleBusinessUnitSubmit}
                        onArchiveToggle={handleBusinessUnitArchive}
                        onReset={() => {
                            setBusinessUnitInput('');
                            setBusinessUnitDivisionId('');
                            setEditingBusinessUnit(null);
                            setBusinessUnitError('');
                            setBusinessUnitMessage('');
                            setBusinessUnitFieldErrors({});
                        }}
                        submitting={businessUnitSubmitting}
                        businessUnitMessage={businessUnitMessage}
                        businessUnitError={businessUnitError}
                    />
                )}
                {selectedOption === 'Operating Units' && (
                    <OperatingUnitsSection
                        actionOptions={ACTION_OPTIONS}
                        selectedAction={selectedAction}
                        onActionChange={(event) => setSelectedAction(event.target.value)}
                        isOperatingUnitEditMode={isOperatingUnitEditMode}
                        isOperatingUnitNewMode={isOperatingUnitNewMode}
                        includeArchived={includeArchivedOperatingUnits}
                        onIncludeArchivedChange={(event) => setIncludeArchivedOperatingUnits(event.target.checked)}
                        visibleOperatingUnits={visibleOperatingUnits}
                        editingOperatingUnit={editingOperatingUnit}
                        onSelectOperatingUnit={(unit) => {
                            setEditingOperatingUnit(unit);
                            setOperatingUnitInput(unit.operatingUnitName || '');
                            setOperatingUnitDivisionId(unit.divisionId ?? '');
                            setOperatingUnitMessage('');
                            setOperatingUnitError('');
                        }}
                        getDivisionName={getDivisionName}
                        operatingUnitInput={operatingUnitInput}
                        onOperatingUnitInputChange={(event) => {
                            setOperatingUnitInput(event.target.value);
                            if (operatingUnitFieldErrors.operatingUnitName) {
                                setOperatingUnitFieldErrors((prev) => {
                                    const { operatingUnitName, ...rest } = prev;
                                    return rest;
                                });
                            }
                        }}
                        operatingUnitDivisionId={operatingUnitDivisionId}
                        onDivisionChange={(event) => {
                            setOperatingUnitDivisionId(event.target.value);
                            if (operatingUnitFieldErrors.divisionId) {
                                setOperatingUnitFieldErrors((prev) => {
                                    const { divisionId, ...rest } = prev;
                                    return rest;
                                });
                            }
                        }}
                        sortedDivisions={sortedDivisions}
                        onClearDivision={() => {
                            setOperatingUnitDivisionId('');
                            if (operatingUnitFieldErrors.divisionId) {
                                setOperatingUnitFieldErrors((prev) => {
                                    const { divisionId, ...rest } = prev;
                                    return rest;
                                });
                            }
                        }}
                        operatingUnitFieldErrors={operatingUnitFieldErrors}
                        onSubmit={handleOperatingUnitSubmit}
                        onArchiveToggle={handleOperatingUnitArchive}
                        onReset={() => {
                            setOperatingUnitInput('');
                            setOperatingUnitDivisionId('');
                            setEditingOperatingUnit(null);
                            setOperatingUnitError('');
                            setOperatingUnitMessage('');
                            setOperatingUnitFieldErrors({});
                        }}
                        submitting={operatingUnitSubmitting}
                        operatingUnitMessage={operatingUnitMessage}
                        operatingUnitError={operatingUnitError}
                    />
                )}
            </div>
        </div>
    );
};

export default AdminMenu;
