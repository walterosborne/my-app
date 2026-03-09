import { React, useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import Select from "react-select"
import { Box } from '@mui/material';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import './App.css'
import './AdminMenu.css';
import { grey } from '@mui/material/colors';
import { customStyles } from './Utilities.jsx';
import {
  getPrograms,
  getDivisions,
  getSectors,
  getSites,
  getBusinessUnits,
  getOperatingUnits,
  getAuditors,
  getAuditTypes,
  getStatuses,
  getFunctions,
  getIntExt,
  getStandards,
  getStandardTexts,
  getProps,
  getRoster,
  getCauses,
  getCurrentUser,
  getEveryTimeQuestions,
  getAuditorFiles,
  uploadAuditorFile,
  getAuditorFileDownloadUrl
} from './assets/data/apiData';


function Results({ selectedAuditId, allAudits = [], reloadAudits }) {

  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  // Helper function to get program names from programIds
  const getProgramNames = (programIds) => {
    return programIds.map(programId => {
      const program = programsList.find(p => p.programId === programId);
      return program ? program.programName : programId;
    }).join(', ');
  };

  const normalizeIdArray = (value) => {
    if (Array.isArray(value)) return value;
    if (value === null || value === undefined) return [];
    return [value];
  };

  // Helper function to get division name(s) from divisionId(s)
  const getDivisionName = (divisionId) => {
    const ids = normalizeIdArray(divisionId);
    if (ids.length === 0) return '';
    return ids
      .map(id => {
        const division = divisionsList.find(d => d.divisionId === id);
        return division ? division.divisionName : id;
      })
      .join('; ');
  };

  const getLeadAuditorName = (leadAuditorId) => {
    const auditor = auditorsList.find(a => a.auditorId === leadAuditorId);
    return auditor ? auditor.auditorName : leadAuditorId;
  };

  const getFindingTypeLabel = (value) => {
    const parsed = Number(value);
    if (parsed === 1) return 'Nonconformity';
    if (parsed === 2) return 'Conformity';
    if (parsed === 3) return 'OFI';
    if (parsed === 4) return 'Observation';
    return value || 'No response provided';
  };

  const [newPEQs, setNewPEQs] = useState(0);
  const [deletedPEQs, setDeletedPEQs] = useState(new Set());
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [standardAdditional, setStandardAdditional] = useState({});
  const [deletedStandardQuestions, setDeletedStandardQuestions] = useState({});
  const [collapsedSections, setCollapsedSections] = useState({});
  const [collapsedSubsections, setCollapsedSubsections] = useState({});
  const [expandedTexts, setExpandedTexts] = useState({});
  const [schedule, setSchedule] = useState(null);
  const [auditLocked, setAuditLocked] = useState(false);
  const [nonconformances, setNonconformances] = useState([]);
  const [auditorFiles, setAuditorFiles] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);
  const lastSelectedScheduleRef = useRef(null);
  const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
  const isUploadTooLarge = Boolean(uploadFile && uploadFile.size > MAX_UPLOAD_BYTES);
  const [rowSelectionModel, setRowSelectionModel] = useState({
    type: 'include',
    ids: new Set()
  });
  const entryAudits = useMemo(() => {
    return allAudits.filter((audit) => Number(audit?.stage) !== -1);
  }, [allAudits]);
  const rowSelectionModelRef = useRef({
    type: 'include',
    ids: new Set()
  });
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
  const cloneSelectionModel = (model) => ({
    type: model?.type || 'include',
    ids: new Set(model?.ids ? Array.from(model.ids) : [])
  });

  useEffect(() => {
    rowSelectionModelRef.current = rowSelectionModel;
  }, [rowSelectionModel]);

  // State for lookup data from API
  const [programsList, setProgramsList] = useState([]);
  const [divisionsList, setDivisionsList] = useState([]);
  const [standardsList, setStandardsList] = useState([]);
  const [standardTextsList, setStandardTextsList] = useState([]);
  const [propsList, setPropsList] = useState([]);
  const [rosterList, setRosterList] = useState([]);
  const [causesList, setCausesList] = useState([]);
  const [everyTimeQuestionsList, setEveryTimeQuestionsList] = useState([]);
  const [auditorsList, setAuditorsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const etqConversionNotifiedRef = useRef(new Set());

  const filteredEveryTimeQuestions = useMemo(() => {
    const targetDivisionIds = normalizeIdArray(selectedAudit?.divisionId)
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id));
    if (targetDivisionIds.length === 0) return [];
    return everyTimeQuestionsList.filter((question) => targetDivisionIds.includes(Number(question.divisionId)));
  }, [everyTimeQuestionsList, selectedAudit]);

  const standardNameMap = useMemo(() => {
    return new Map(
      standardsList.map((standard) => [Number(standard.standardId), standard.standardName])
    );
  }, [standardsList]);

  const etqQuestionSet = useMemo(() => {
    return new Set(filteredEveryTimeQuestions.map((question) => question.question));
  }, [filteredEveryTimeQuestions]);

  const getQuestionTypeLabel = useCallback(
    (typeValue) => {
      if (!typeValue && typeValue !== 0) return 'No response provided';
      if (typeValue === 'PEQ' || typeValue === 'ETQ') {
        return typeValue;
      }
      const parsed = Number(typeValue);
      if (Number.isFinite(parsed)) {
        return standardNameMap.get(parsed) || `Standard ${parsed}`;
      }
      return String(typeValue).toUpperCase();
    },
    [standardNameMap]
  );

  const existingFindingsRows = useMemo(() => {
    const rows = (nonconformances || []).map((nc, index) => ({
      id: nc.ncId ?? `nc-${index}`,
      question: nc.question || 'No response provided',
      type: getQuestionTypeLabel(nc.type),
      findingType: getFindingTypeLabel(nc.findingType),
      comment: nc.auditorComment || nc.comment || nc.ncDetails || 'No response provided'
    }));
    return rows.sort((a, b) => Number(a.id) - Number(b.id));
  }, [nonconformances, getQuestionTypeLabel, getFindingTypeLabel]);

  const fileOptions = useMemo(() => {
    return [...auditorFiles]
      .sort((a, b) => (a.fileName || '').localeCompare(b.fileName || ''))
      .map((file) => ({
        value: file.fileId,
        label: file.fileName
      }));
  }, [auditorFiles]);

  const refreshAuditorFiles = useCallback(async () => {
    try {
      const files = await getAuditorFiles(true);
      setAuditorFiles(files);
    } catch (error) {
      console.error('Error loading auditor files:', error);
    }
  }, []);

  const handleFileUpload = async () => {
    if (!uploadFile) {
      toast.error('Please select a file to upload.');
      return;
    }
    const duplicateName = auditorFiles.some(
      (file) => file.fileName?.toLowerCase() === uploadFile.name.toLowerCase()
    );
    if (duplicateName) {
      toast.error('A file with that name already exists.');
      return;
    }

    setUploadingFile(true);
    try {
      await uploadAuditorFile(uploadFile);
      toast.success('File uploaded.');
      setUploadFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await refreshAuditorFiles();
    } catch (error) {
      toast.error(error.message || 'Failed to upload file.');
    } finally {
      setUploadingFile(false);
    }
  };

  const normalizeFileIds = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  // Load all lookup data from API on mount
  useEffect(() => {
    async function loadLookupData() {
      try {
        const userData = await getCurrentUser();
        if (userData?.name) {
        setUserInfo(userData?.name && userData.name !== 'User' ? userData : null);
        }
        const [programs, divisions, auditors, standards, standardTexts, props, roster, causes, files] = await Promise.all([
          getPrograms(),
          getDivisions(),
          getAuditors(),
          getStandards(),
          getStandardTexts(),
          getProps(),
          getRoster(),
          getCauses(),
          getAuditorFiles()
        ]);

        setProgramsList(programs);
        setDivisionsList(divisions);
        setAuditorsList(auditors);
        setStandardsList(standards);
        setStandardTextsList(standardTexts);
        setPropsList(props);
        setRosterList(roster);
        setCausesList(causes);
        setAuditorFiles(files);
        setLoading(false);
      } catch (error) {
        console.error('Error loading lookup data:', error);
        setLoading(false);
      }
    }
    loadLookupData();
  }, []);

  // Fetch nonconformances from database when schedule changes
  useEffect(() => {
    async function fetchNonconformances() {
      if (!selectedAudit?.scheduleId) {
        setNonconformances([]);
        return;
      }

      try {
        const divisionIds = normalizeIdArray(selectedAudit?.divisionId);
        const divisionFilter = divisionIds.length === 1 ? divisionIds[0] : null;
        const [ncResponse, everyTimeQuestions] = await Promise.all([
          fetch(`http://localhost:3001/api/nonconformances/${selectedAudit.scheduleId}`),
          getEveryTimeQuestions(divisionFilter)
        ]);
        const data = await ncResponse.json();
        const etqList = Array.isArray(everyTimeQuestions)
          ? everyTimeQuestions.filter((question) => (question.active ?? 1) === 1)
          : [];
        setEveryTimeQuestionsList(etqList);

        const validEtqQuestions = new Set(etqList.map((question) => question.question));
        const convertedCount = data.filter(
          (nc) => nc.type === 'ETQ' && !validEtqQuestions.has(nc.question)
        ).length;
        const converted = data.map((nc) => {
          if (nc.type === 'ETQ' && !validEtqQuestions.has(nc.question)) {
            return { ...nc, type: 'PEQ' };
          }
          return nc;
        });

        if (convertedCount > 0 && selectedAudit?.scheduleId) {
          if (!etqConversionNotifiedRef.current.has(selectedAudit.scheduleId)) {
            toast.info('ETQ converted to PEQ');
            etqConversionNotifiedRef.current.add(selectedAudit.scheduleId);
          }
        }

        setNonconformances(converted);
      } catch (error) {
        console.error('Error fetching nonconformances:', error);
        setNonconformances([]);
      }
    }
    fetchNonconformances();
  }, [selectedAudit?.scheduleId, selectedAudit?.divisionId]);

  // Find selected audit from URL or from user selection
  useEffect(() => {
    if (selectedAuditId && entryAudits.length > 0) {
      const audit = entryAudits.find(a => a.scheduleId === selectedAuditId);
      if (audit) {
        setSelectedAudit(audit);
        const nextModel = { type: 'include', ids: new Set([selectedAuditId]) };
        if (!isSameSelectionModel(nextModel, rowSelectionModelRef.current)) {
          rowSelectionModelRef.current = nextModel;
          setRowSelectionModel(nextModel);
        }
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

        // Check and save locked status
        setAuditLocked(audit.locked === 1);
      }
    }
  }, [selectedAuditId, entryAudits]);

  function addPEQ() {
    setNewPEQs(newPEQs + 1);
  }
  function deletePEQ(index) {
    setDeletedPEQs(prev => new Set([...prev, index]));
  }
  function addStandardQuestion(standardId, section, subsection) {
    const key = `${standardId}_${section}_${subsection}`;
    setStandardAdditional(prev => ({
      ...prev,
      [key]: (prev[key] || 0) + 1
    }));
  }
  function deleteStandardQuestion(standardId, section, subsection, index) {
    const key = `${standardId}_${section}_${subsection}`;
    setDeletedStandardQuestions(prev => ({
      ...prev,
      [key]: new Set([...(prev[key] || []), index])
    }));
  }

  const { register, handleSubmit,
    setError,
    formState: { errors, isSubmitting },
    control,
    reset,
    setValue,
    getValues,
    watch
  } = useForm(
    {
      defaultValues: {}
    }
  )

  const watchedStandards = watch('standards');
  const selectedStandardIds = useMemo(() => {
    if (Array.isArray(watchedStandards) && watchedStandards.length > 0) {
      return watchedStandards;
    }
    return selectedAudit?.standardIds || [];
  }, [watchedStandards, selectedAudit]);

  const standardTextsForAudit = useMemo(() => {
    const ids = new Set((selectedStandardIds || []).map((id) => Number(id)));
    if (ids.size === 0) return [];
    return standardTextsList.filter((item) => ids.has(Number(item.standardId)));
  }, [standardTextsList, selectedStandardIds]);

  const standardTextsByStandard = useMemo(() => {
    const grouped = {};
    standardTextsForAudit.forEach((item) => {
      const standardId = Number(item.standardId);
      if (!grouped[standardId]) {
        grouped[standardId] = {};
      }
      const sectionKey = String(item.section);
      if (!grouped[standardId][sectionKey]) {
        grouped[standardId][sectionKey] = [];
      }
      grouped[standardId][sectionKey].push(item);
    });

    Object.values(grouped).forEach((sections) => {
      Object.values(sections).forEach((items) => {
        items.sort((a, b) => {
          const sectionDiff = Number(a.section) - Number(b.section);
          if (sectionDiff !== 0) return sectionDiff;
          return Number(a.subsection) - Number(b.subsection);
        });
      });
    });

    return grouped;
  }, [standardTextsForAudit]);

  const auditDate = watch('auditDate');
  const expectedStartDate = selectedAudit?.expectedStartDate
    ? selectedAudit.expectedStartDate.split('T')[0]
    : '';
  const isDelayed = Boolean(
    auditDate &&
    expectedStartDate &&
    new Date(auditDate) > new Date(expectedStartDate)
  );

  const areArrayValuesEqual = (left = [], right = []) => {
    if (left === right) return true;
    if (!Array.isArray(left) || !Array.isArray(right)) return false;
    if (left.length !== right.length) return false;
    for (let i = 0; i < left.length; i += 1) {
      if (left[i] !== right[i]) return false;
    }
    return true;
  };

  // Update form when audit is selected
  useEffect(() => {
    if (loading) {
      return;
    }
    if (schedule && selectedAudit) {
      // Map finding type integers to strings for UI
      const findingTypeReverseMap = {
        1: 'Nonconformity',
        2: 'Conformity',
        3: 'OFI',
        4: 'OBS'
      };

      // Set overview (always, even if empty)
      setValue('overview', selectedAudit.overview || '');

      // Set standards if available
      if (selectedAudit.standardIds) {
        const currentStandards = getValues('standards') || [];
        const nextStandards = selectedAudit.standardIds || [];
        if (!areArrayValuesEqual(currentStandards, nextStandards)) {
          setValue('standards', nextStandards);
        }
      }

      // Set programs if available
      if (selectedAudit.programIds) {
        setValue('programs', selectedAudit.programIds);
      }

      // Set evaluator if available
      if (selectedAudit.evaluator) {
        setValue('evaluator', selectedAudit.evaluator);
      }

      // Set related items if available
      if (selectedAudit.relatedItems) {
        setValue('relatedItems', selectedAudit.relatedItems);
      }

      // Set interviewees if available
      if (selectedAudit.intervieweeIds) {
        setValue('interviewees', selectedAudit.intervieweeIds);
      }

      // Set start date if available
      if (selectedAudit.startDate) {
        const startDate = selectedAudit.startDate.split('T')[0]; // Extract YYYY-MM-DD
        setValue('auditDate', startDate);
      }

      if (selectedAudit.delayCause !== null && selectedAudit.delayCause !== undefined) {
        setValue('delayCause', selectedAudit.delayCause);
      }

      // Set program manager if available
      if (selectedAudit.programManager) {
        setValue('programManager', selectedAudit.programManager);
      }

      // Set MA lead/manager if available
      if (selectedAudit.maLeadManager) {
        setValue('maLeadManager', selectedAudit.maLeadManager);
      }

      // Set process elements if available
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

      const scheduleId = Number(selectedAudit.scheduleId);
      // Filter nonconformances for this audit
      const auditNCs = nonconformances.filter(nc => Number(nc.scheduleId) === scheduleId);

      // Populate PEQ responses from nonconformances
      const peqNCs = auditNCs.filter(nc => nc.type === 'PEQ');
      const etqNCs = auditNCs.filter(nc => nc.type === 'ETQ');
      const validEtqNCs = etqNCs.filter(nc => etqQuestionSet.has(nc.question));
      const convertedEtqNCs = etqNCs.filter(nc => !etqQuestionSet.has(nc.question));
      const combinedPeqs = [
        ...peqNCs,
        ...convertedEtqNCs.map(nc => ({ ...nc, type: 'PEQ' }))
      ];

      if (convertedEtqNCs.length > 0 && selectedAudit?.scheduleId) {
        if (!etqConversionNotifiedRef.current.has(selectedAudit.scheduleId)) {
          toast.info('ETQ converted to PEQ');
          etqConversionNotifiedRef.current.add(selectedAudit.scheduleId);
        }
      }

      setNewPEQs(combinedPeqs.length); // Set the number of PEQ boxes to display
      setDeletedPEQs(new Set()); // Reset deleted PEQs
      combinedPeqs.forEach((nc, idx) => {
        setValue(`peqQuestion${idx}`, nc.question || '');
        setValue(`peq${idx}`, nc.response || '');
        setValue(`auditorComment${idx}`, nc.auditorComment || '');
        setValue(`auditeeResponse${idx}`, nc.response || '');
        setValue(`findingType${idx}`, findingTypeReverseMap[nc.findingType] || 'Nonconformity');
        setValue(`prOPCorporate${idx}`, nc.qma || []); // QMA goes in corporate
        setValue(`prOPSector${idx}`, nc.sector || []);
        setValue(`prOPDivision${idx}`, nc.division || []);
        setValue(`prOPOther${idx}`, nc.other || []);
        setValue(`peqFiles${idx}`, normalizeFileIds(nc.files));
      });

      // Clear all ETQ fields first
      filteredEveryTimeQuestions.forEach((question, idx) => {
        setValue(`etqAuditeeResponse${idx}`, '');
        setValue(`etqAuditorComment${idx}`, '');
        setValue(`etqPrOPCorporate${idx}`, []);
        setValue(`etqPrOPSector${idx}`, []);
        setValue(`etqPrOPDivision${idx}`, []);
        setValue(`etqPrOPOther${idx}`, []);
        setValue(`etqFiles${idx}`, []);
      });

      // Populate ETQ responses from nonconformances
      filteredEveryTimeQuestions.forEach((question, idx) => {
        const etqNc = validEtqNCs.find(nc => nc.question === question.question); // Match by question text
        if (etqNc) {
          setValue(`etqAuditeeResponse${idx}`, etqNc.response || '');
          setValue(`etqAuditorComment${idx}`, etqNc.auditorComment || '');
          setValue(`etqFindingType${idx}`, findingTypeReverseMap[etqNc.findingType] || 'Nonconformity');
          setValue(`etqPrOPCorporate${idx}`, etqNc.qma || []); // QMA goes in corporate
          setValue(`etqPrOPSector${idx}`, etqNc.sector || []);
          setValue(`etqPrOPDivision${idx}`, etqNc.division || []);
          setValue(`etqPrOPOther${idx}`, etqNc.other || []);
          setValue(`etqFiles${idx}`, normalizeFileIds(etqNc.files));
        }
      });

      // Clear all standard-based fields first
      setStandardAdditional({});
      setDeletedStandardQuestions({});

      // Populate standard-based responses from nonconformances
      const standardAdditionalTemp = {};
      const activeStandardSet = new Set((selectedAudit?.standardIds || []).map((id) => Number(id)));

      auditNCs.forEach(nc => {
        const standardId = Number(nc.type);
        if (!Number.isFinite(standardId)) {
          return;
        }
        if (!activeStandardSet.has(standardId)) {
          return;
        }
        if (nc.section === null || nc.subsection === null) {
          return;
        }

        const key = `${standardId}_${nc.section}_${nc.subsection}`;
        if (!standardAdditionalTemp[key]) {
          standardAdditionalTemp[key] = 0;
        }
        const addIdx = standardAdditionalTemp[key];
        standardAdditionalTemp[key] += 1;

        setValue(`standardAdditionalQuestion_${standardId}_${nc.section}_${nc.subsection}_${addIdx}`, nc.question || '');
        setValue(`standardAdditionalAuditeeResponse_${standardId}_${nc.section}_${nc.subsection}_${addIdx}`, nc.response || '');
        setValue(`standardAdditionalFindingType_${standardId}_${nc.section}_${nc.subsection}_${addIdx}`, findingTypeReverseMap[nc.findingType] || 'Nonconformity');
        setValue(`standardAdditionalAuditorComment_${standardId}_${nc.section}_${nc.subsection}_${addIdx}`, nc.auditorComment || '');
        setValue(`standardAdditionalPrOPCorporate_${standardId}_${nc.section}_${nc.subsection}_${addIdx}`, nc.qma || []);
        setValue(`standardAdditionalPrOPSector_${standardId}_${nc.section}_${nc.subsection}_${addIdx}`, nc.sector || []);
        setValue(`standardAdditionalPrOPDivision_${standardId}_${nc.section}_${nc.subsection}_${addIdx}`, nc.division || []);
        setValue(`standardAdditionalPrOPOther_${standardId}_${nc.section}_${nc.subsection}_${addIdx}`, nc.other || []);
        setValue(`standardAdditionalFiles_${standardId}_${nc.section}_${nc.subsection}_${addIdx}`, normalizeFileIds(nc.files));
      });

      setStandardAdditional(standardAdditionalTemp);
    } else {
      // Reset form when no schedule selected
      setStandardAdditional({});
      setDeletedStandardQuestions({});
      reset();
    }
  }, [schedule, selectedAudit, nonconformances, setValue, reset, filteredEveryTimeQuestions, etqQuestionSet, loading, getValues]);

  useEffect(() => {
    if (!isDelayed) {
      setValue('delayCause', null);
    }
  }, [isDelayed, setValue]);

  const standards = useMemo(() => {
    return [...standardsList]
      .sort((a, b) => (a.standardName || '').localeCompare(b.standardName || ''))
      .map(s => ({
        value: s.standardId,
        label: s.standardName
      }));
  }, [standardsList]);

  const interviewees = useMemo(() => {
    return [...rosterList]
      .sort((a, b) => (a.rosterName || '').localeCompare(b.rosterName || ''))
      .map(r => ({
        value: r.myId,
        label: r.rosterName
      }));
  }, [rosterList]);

  const delayCauses = useMemo(() => {
    return [...causesList]
      .filter((cause) => (cause.active ?? 1) === 1)
      .sort((a, b) => (a.cause || '').localeCompare(b.cause || ''))
      .map(c => ({
        value: c.causeId,
        label: c.cause
      }));
  }, [causesList]);

  const programs = useMemo(() => {
    return [...programsList]
      .sort((a, b) => (a.programName || '').localeCompare(b.programName || ''))
      .map(p => ({
        value: p.programId,
        label: p.programName
      }));
  }, [programsList]);

  // Corporate PrOP options - always all corporate props (propTypeId 1)
  const corporatePrOPOptions = useMemo(() => {
    return propsList
      .filter(prop => prop.propTypeId === 1 && prop.active === 1)
      .map(prop => ({
        value: prop.propId,
        label: prop.PrOP
      }))
      .sort((a, b) => (a.label || '').localeCompare(b.label || ''));
  }, [propsList]);

  // Sector PrOP options - props matching the audit's sectorId
  const sectorPrOPOptions = useMemo(() => {
    if (!selectedAudit?.sectorId) return [];
    return propsList
      .filter(prop => prop.propTypeId === 2 && prop.sectorId === selectedAudit.sectorId && prop.active === 1)
      .map(prop => ({
        value: prop.propId,
        label: prop.PrOP
      }))
      .sort((a, b) => (a.label || '').localeCompare(b.label || ''));
  }, [selectedAudit, propsList]);

  // Division PrOP options - props matching the audit's divisionId(s)
  const divisionPrOPOptions = useMemo(() => {
    const divisionIds = normalizeIdArray(selectedAudit?.divisionId)
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id));
    if (divisionIds.length === 0) return [];
    return propsList
      .filter(prop => prop.propTypeId === 3 && divisionIds.includes(Number(prop.divisionId)) && prop.active === 1)
      .map(prop => ({
        value: prop.propId,
        label: prop.PrOP
      }))
      .sort((a, b) => (a.label || '').localeCompare(b.label || ''));
  }, [selectedAudit, propsList]);

  // Other PrOP options - props matching the audit's sites, businessUnits, operatingUnits, or programs
  const otherPrOPOptions = useMemo(() => {
    if (!selectedAudit) return [];

    const matchingSiteProps = propsList.filter(prop =>
      prop.propTypeId === 4 &&
      prop.siteId &&
      selectedAudit.siteIds?.includes(prop.siteId) &&
      prop.active === 1
    );

    const matchingBUProps = propsList.filter(prop =>
      prop.propTypeId === 5 &&
      prop.buId &&
      selectedAudit.businessUnitIds?.includes(prop.buId) &&
      prop.active === 1
    );

    const matchingOUProps = propsList.filter(prop =>
      prop.propTypeId === 6 &&
      prop.ouId &&
      selectedAudit.operatingUnitIds?.includes(prop.ouId) &&
      prop.active === 1
    );

    const matchingProgramProps = propsList.filter(prop =>
      prop.propTypeId === 7 &&
      prop.programId &&
      selectedAudit.programIds?.includes(prop.programId) &&
      prop.active === 1
    );

    // Combine all matching props
    const allOtherProps = [
      ...matchingSiteProps,
      ...matchingBUProps,
      ...matchingOUProps,
      ...matchingProgramProps
    ];

    return allOtherProps
      .map(prop => ({
        value: prop.propId,
        label: prop.PrOP
      }))
      .sort((a, b) => (a.label || '').localeCompare(b.label || ''));
  }, [selectedAudit, propsList]);

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

  useEffect(() => {
    if (schedule) {
    } else {
      reset()
    }
  }, [schedule]); // Runs effect whenever schedule changes

  async function onSubmit(data) {
    try {
      if (!selectedAudit) {
        alert('Please select an audit first');
        return;
      }

      const computeStage = (fallbackStage) => {
        const currentStage = selectedAudit?.stage ?? 0;
        return Math.max(currentStage, fallbackStage);
      };

      // Map finding type strings to integers for database
      const findingTypeMap = {
        'Nonconformity': 1,
        'Conformity': 2,
        'OFI': 3,
        'OBS': 4
      };

      // Get existing nonconformances not related to this audit
      const scheduleId = Number(selectedAudit.scheduleId);
      const otherNCs = nonconformances.filter(nc => Number(nc.scheduleId) !== scheduleId);

      // Collect new/updated nonconformances from form
      const updatedNCs = [];

      // Get max ncId for new records
      let maxNcId = Math.max(...nonconformances.map(nc => nc.ncId), 0);

      // Process PEQs
      for (let i = 0; i < newPEQs; i++) {
        // Skip deleted PEQs
        if (deletedPEQs.has(i)) continue;

        const question = data[`peqQuestion${i}`];
        const response = data[`auditeeResponse${i}`];
        const auditorComment = data[`auditorComment${i}`];

        // Only save if there's actual content
        if (question || response || auditorComment) {
          // Find existing NC by matching question text
          const existingNC = nonconformances.find(nc =>
            Number(nc.scheduleId) === scheduleId &&
            nc.type === 'PEQ' &&
            nc.question === question
          );
          const existingConvertedEtq = !existingNC && !etqQuestionSet.has(question)
            ? nonconformances.find(nc =>
              Number(nc.scheduleId) === scheduleId &&
              nc.type === 'ETQ' &&
              nc.question === question
            )
            : null;
          const resolvedNC = existingNC || existingConvertedEtq;

          updatedNCs.push({
            ncId: resolvedNC?.ncId || ++maxNcId,
            scheduleId,
            type: 'PEQ',
            findingType: data[`findingType${i}`] ? findingTypeMap[data[`findingType${i}`]] : null,
            section: null,
            subsection: null,
            question: question || '',
            response: response || '',
            auditorComment: auditorComment || '',
            details: '',
            ncDetails: '',
            AIN: '',
            division: data[`prOPDivision${i}`] || [],
            sector: data[`prOPSector${i}`] || [],
            qma: data[`prOPCorporate${i}`] || [],
            other: data[`prOPOther${i}`] || [],
            files: data[`peqFiles${i}`] || []
          });
        }
      }

      // Process ETQs
      filteredEveryTimeQuestions.forEach((etq, idx) => {
        const question = etq.question;
        const response = data[`etqAuditeeResponse${idx}`];
        const auditorComment = data[`etqAuditorComment${idx}`];

        if (response || auditorComment) {
          const existingNC = nonconformances.find(nc =>
            Number(nc.scheduleId) === scheduleId &&
            nc.type === 'ETQ' &&
            nc.question === question
          );

          updatedNCs.push({
            ncId: existingNC?.ncId || ++maxNcId,
            scheduleId,
            type: 'ETQ',
            findingType: data[`etqFindingType${idx}`] ? findingTypeMap[data[`etqFindingType${idx}`]] : null,
            section: null,
            subsection: null,
            question: question,
            response: response || '',
            auditorComment: auditorComment || '',
            details: '',
            ncDetails: '',
            AIN: '',
            division: data[`etqPrOPDivision${idx}`] || [],
            sector: data[`etqPrOPSector${idx}`] || [],
            qma: data[`etqPrOPCorporate${idx}`] || [],
            other: data[`etqPrOPOther${idx}`] || [],
            files: data[`etqFiles${idx}`] || []
          });
        }
      });

      // Process standard-based questions
      Object.keys(standardAdditional).forEach(key => {
        const [standardId, sectionNum, subsection] = key.split('_').map(Number);
        const count = standardAdditional[key];
        for (let addIdx = 0; addIdx < count; addIdx++) {
          if (deletedStandardQuestions[key]?.has(addIdx)) continue;

          const question = data[`standardAdditionalQuestion_${standardId}_${sectionNum}_${subsection}_${addIdx}`];
          const response = data[`standardAdditionalAuditeeResponse_${standardId}_${sectionNum}_${subsection}_${addIdx}`];
          const auditorComment = data[`standardAdditionalAuditorComment_${standardId}_${sectionNum}_${subsection}_${addIdx}`];

          if (question || response || auditorComment) {
            const existingNC = nonconformances.find(nc =>
              Number(nc.scheduleId) === scheduleId &&
              Number(nc.type) === standardId &&
              nc.section === sectionNum &&
              nc.subsection === subsection &&
              nc.question === question
            );

            updatedNCs.push({
              ncId: existingNC?.ncId || ++maxNcId,
              scheduleId,
              type: standardId,
              findingType: data[`standardAdditionalFindingType_${standardId}_${sectionNum}_${subsection}_${addIdx}`] ? findingTypeMap[data[`standardAdditionalFindingType_${standardId}_${sectionNum}_${subsection}_${addIdx}`]] : null,
              section: sectionNum,
              subsection: subsection,
              question: question || '',
              response: response || '',
              auditorComment: auditorComment || '',
              details: '',
              ncDetails: '',
              AIN: '',
              division: data[`standardAdditionalPrOPDivision_${standardId}_${sectionNum}_${subsection}_${addIdx}`] || [],
              sector: data[`standardAdditionalPrOPSector_${standardId}_${sectionNum}_${subsection}_${addIdx}`] || [],
              qma: data[`standardAdditionalPrOPCorporate_${standardId}_${sectionNum}_${subsection}_${addIdx}`] || [],
              other: data[`standardAdditionalPrOPOther_${standardId}_${sectionNum}_${subsection}_${addIdx}`] || [],
              files: data[`standardAdditionalFiles_${standardId}_${sectionNum}_${subsection}_${addIdx}`] || []
            });
          }
        }
      });

      // Combine and sort
      const allNCs = [...updatedNCs].sort((a, b) => a.ncId - b.ncId);

      // Save audit record with updated fields
      const auditResponse = await fetch('http://localhost:3001/api/audits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...selectedAudit,
          overview: data.overview,
          standardIds: data.standards || [],
          programIds: data.programs || [],
          intervieweeIds: data.interviewees || [],
          startDate: data.auditDate || null,
          evaluator: data.evaluator,
          relatedItems: data.relatedItems,
          programManager: data.programManager,
          maLeadManager: data.maLeadManager,
          delayCause: isDelayed ? (data.delayCause || null) : null,
          stage: computeStage(3),
          targetStage: 3
        })
      });

      const auditResult = await auditResponse.json();

      if (!auditResult.success) {
        throw new Error(auditResult.error || 'Failed to save audit');
      }

      // Save nonconformances to backend
      const response = await fetch('http://localhost:3001/api/save-nonconformances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduleId: selectedAudit.scheduleId,
          nonconformances: allNCs
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Results submitted!');

        // Reload nonconformances from database to get fresh data
        const ncResponse = await fetch(`http://localhost:3001/api/nonconformances/${selectedAudit.scheduleId}`);
        const freshNCs = await ncResponse.json();
        setNonconformances(freshNCs);

        // Reload audit data if reloadAudits function is available
        if (reloadAudits) {
          await reloadAudits();
        }
      } else {
        throw new Error(result.error || 'Failed to save nonconformances');
      }

      console.log(data);
    }
    catch (error) {
      //The root error is a form-level error not tied to a specific field
      setError("root",
        { message: error.message }
      )
    }

  }


  async function unlockAudit() {
    try {
      if (!schedule?.scheduleId) {
        throw new Error('No audit selected');
      }

      const response = await fetch('http://localhost:3001/api/unlock-audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduleId: schedule.scheduleId
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Audit unlocked successfully!');
        setAuditLocked(false);
        // Reload all audit data to refresh the state
        if (reloadAudits) {
          await reloadAudits();
        }
      } else {
        throw new Error(result.error || 'Failed to unlock audit');
      }
    } catch (error) {
      toast.error('Failed to unlock audit: ' + error.message);
    }
  }

  function handleReset() {
    if (selectedAudit) {
      // Clear additional standard-based questions
      setStandardAdditional({});
      setDeletedStandardQuestions({});

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

  const stageGateMessage = (() => {
    if (!selectedAudit || auditLocked) return null;
    const stage = Number(selectedAudit.stage);
    if (Number.isNaN(stage)) return null;
    if (stage < 2) {
      const scheduleId = selectedAudit.scheduleId ?? 'Unknown';
      return {
        title: `Audit ${scheduleId} cannot be conducted yet.`,
        note: 'Please complete Planning before conducting the audit.'
      };
    }
    return null;
  })();
  const showNonconformatiesButton = selectedAudit && Number(selectedAudit.stage) >= 3;

  if (loading) {
    return <div className="entry-message">Loading conduct audit data...</div>;
  }

  return (
    <>
      <div style={{ width: '100%', textAlign: 'left' }}>
        <h1>Conduct Audit</h1>
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
      {/* If the page has encountered an error not tied to a field display it instead of the form */}
      {errors.root ? <p className='error'>{errors.root.message}</p> :
        <>
          {/* Form that has certain built in properties like submit and reset */}
          <form id='results-form' onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
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
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                getRowSpacing={(params) => ({
                  top: params.isFirstVisible ? 0 : 5,
                  bottom: params.isLastVisible ? 0 : 5,
                })}
                onRowSelectionModelChange={(selectionModel) => {
                  if (!selectionModel?.ids) return;
                  const nextModel = cloneSelectionModel(selectionModel);
                  if (isSameSelectionModel(nextModel, rowSelectionModelRef.current)) return;
                  rowSelectionModelRef.current = nextModel;
                  setRowSelectionModel(nextModel);
                  if (nextModel.ids.size > 0) {
                    const scheduleID = Array.from(nextModel.ids)[0];
                    const selectedSchedule = schedules.find(s => s.scheduleId === scheduleID);
                    const originalAudit = entryAudits.find(a => a.scheduleId === scheduleID);
                    setSchedule(selectedSchedule);
                    setSelectedAudit(originalAudit);
                    // Update locked status when selecting from table
                    setAuditLocked(originalAudit?.locked === 1);
                    if (scheduleID && lastSelectedScheduleRef.current !== scheduleID) {
                      toast.success(`Audit ${scheduleID} has populated below.`);
                      lastSelectedScheduleRef.current = scheduleID;
                    }
                  } else {
                    //No row selected, clearing schedule
                    setSchedule(null);
                    setSelectedAudit(null);
                    setAuditLocked(false);
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
            <div className='section'>
              <label className='sectiontitle'>My Objective Evidence</label>
              <p className="admin-editing-label">Your files can be used in any of your audits, and an audit's files can be downloaded by all associated auditors on the audit's report page.</p>
              <div className="admin-edit-table-wrapper" style={{ width: '100%' }}>
                <div className="admin-edit-table-scroll">
                  <table className="admin-edit-table objective-evidence-table" style={{ width: '100%', tableLayout: 'fixed', textAlign: 'left' }}>
                    <colgroup>
                      <col style={{ width: '45%' }} />
                      <col style={{ width: '35%' }} />
                      <col style={{ width: '20%' }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="objective-evidence-header">File Name</th>
                        <th className="objective-evidence-header">File Type</th>
                        <th className="objective-evidence-header objective-evidence-header--center"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditorFiles.length === 0 ? (
                        <tr>
                          <td colSpan={3} style={{ textAlign: 'center', padding: '12px' }}>
                            No files uploaded yet.
                          </td>
                        </tr>
                      ) : (
                        auditorFiles.map((file) => (
                          <tr key={file.fileId}>
                            <td style={{ textAlign: 'left' }}>{file.fileName}</td>
                            <td style={{ textAlign: 'left' }}>{file.mimeType || 'Unknown'}</td>
                            <td style={{ textAlign: 'center' }}>
                              <a
                                href={getAuditorFileDownloadUrl(file.fileId)}
                                className="button"
                                style={{
                                  backgroundColor: '#1976d2',
                                  color: 'white',
                                  padding: '6px 12px',
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  minWidth: '88px'
                                }}
                              >
                                Download
                              </a>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className='sectionrow' style={{ marginTop: '12px', alignItems: 'center' }}>
                <div className="fieldboxhalf">
                  {!uploadFile && <label>Upload File</label>}
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
                    className="textfield"
                  />
                </div>
                <div className="fieldboxhalf" style={{ display: 'flex', alignItems: 'center' }}>
                  {uploadFile && !isUploadTooLarge && (
                    <button
                      type="button"
                      className="button"
                      onClick={handleFileUpload}
                      disabled={uploadingFile}
                      style={{ backgroundColor: '#1976d2', width: '100%' }}
                    >
                      {uploadingFile ? 'Uploading...' : 'Save to my Files'}
                    </button>
                  )}
                </div>
              </div>
              {uploadFile && isUploadTooLarge && (
                <div
                  className="section"
                  style={{
                    backgroundColor: '#ffebee',
                    border: '1px solid #f44336',
                    borderRadius: '4px',
                    marginTop: '12px'
                  }}
                >
                  <p style={{ color: '#d32f2f', margin: 0, fontWeight: 'bold' }}>
                    File exceeds the 50MB limit. Please choose a smaller file.
                  </p>
                </div>
              )}
            </div>
            {schedule && (auditLocked ?
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

              : stageGateMessage ?
                <>
                  <h2 style={{ marginTop: '30px', marginBottom: '20px', color: '#d32f2f' }}>
                    {stageGateMessage.title}
                  </h2>
                  <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                    {stageGateMessage.note}
                  </p>
                </>
                :
                <>
                  <h2 style={{ marginTop: '5px' }}>Currently Conducting Schedule: {schedule.scheduleId}</h2>
                  <div className="admin-edit-table-wrapper" style={{ marginTop: '12px' }}>
                    <p className="admin-editing-label">Existing Findings and Nonconformaties</p>
                    <div className="admin-edit-table-scroll">
                      <table className="admin-edit-table">
                        <thead>
                          <tr>
                            <th>Question</th>
                            <th>Type</th>
                            <th>Finding Type</th>
                            <th>Comment</th>
                          </tr>
                        </thead>
                        <tbody>
                          {existingFindingsRows.length === 0 ? (
                            <tr>
                              <td colSpan={4}>No findings recorded yet.</td>
                            </tr>
                          ) : (
                            existingFindingsRows.map((row) => (
                              <tr key={row.id}>
                                <td>{row.question}</td>
                                <td>{row.type}</td>
                                <td>{row.findingType}</td>
                                <td>{row.comment}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
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
                      <div className={isDelayed ? "fieldboxhalf" : "fieldboxthird"}>
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
                      <div className={isDelayed ? "fieldboxhalf" : "fieldboxthird"}>
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
                      {!isDelayed && (
                        <div className="fieldboxthird">
                          <label>Actual Audit Start Date</label>
                          <input
                            type="date"
                            {...register("auditDate")}
                            id='auditDate'
                            className='datefield'
                          />
                        </div>
                      )}
                    </div>
                    {isDelayed && (
                      <>
                        <div className='sectionrow'>
                          <div className="fieldboxhalf">
                            <label>Actual Audit Start Date</label>
                            <input
                              type="date"
                              {...register("auditDate")}
                              id='auditDate'
                              className='datefield'
                            />
                          </div>
                          <div className="fieldboxhalf">
                            <label>Delay Cause</label>
                            <p style={{ fontSize: '14px', color: '#666', margin: '0' }}>
                              Your audit start date is later than the expected start date ({expectedStartDate}).
                            </p>
                            <Controller
                              name="delayCause"
                              control={control}
                              render={({ field }) => (
                                <Select
                                  isClearable
                                  options={delayCauses}
                                  styles={customStyles}
                                  placeholder="Delay Cause"
                                  value={delayCauses.find(c => c.value === field.value) || null}
                                  onChange={(selectedOption) => field.onChange(selectedOption ? selectedOption.value : null)}
                                />
                              )}
                            />
                          </div>
                        </div>
                      </>
                    )}
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
                    <label className='sectiontitle'>Process Evaluation Questions</label>
                    {Array.from({ length: newPEQs }, (_, index) => {
                      // Don't render deleted PEQs
                      if (deletedPEQs.has(index)) return null;

                      return (
                        <div key={index} style={{ width: '100%' }}>
                          <div className='peq'>
                            <div className="fieldboxwhole">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                <label style={{ margin: 0, alignSelf: 'center' }}>Process Evaluation Question {index + 1}</label>
                                <button
                                  type="button"
                                  onClick={() => deletePEQ(index)}
                                  style={{
                                    background: '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '6px 16px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  × Delete
                                </button>
                              </div>
                              <textarea
                                {...register(`peqQuestion${index}`)}
                                style={{ width: '100%', height: '80px', resize: 'vertical' }}
                                id={`peqQuestion${index}`}
                                className='textfield'
                                placeholder="Enter your question here..."
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
                                      options={corporatePrOPOptions}
                                      styles={customStyles}
                                      placeholder="Corporate"
                                      value={field.value ? corporatePrOPOptions.filter(p => field.value.includes(p.value)) : []}
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
                                      options={sectorPrOPOptions}
                                      styles={customStyles}
                                      placeholder="Sector"
                                      value={field.value ? sectorPrOPOptions.filter(p => field.value.includes(p.value)) : []}
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
                                      options={divisionPrOPOptions}
                                      styles={customStyles}
                                      placeholder="Division"
                                      value={field.value ? divisionPrOPOptions.filter(p => field.value.includes(p.value)) : []}
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
                                      options={otherPrOPOptions}
                                      styles={customStyles}
                                      placeholder="Other"
                                      value={field.value ? otherPrOPOptions.filter(p => field.value.includes(p.value)) : []}
                                      onChange={(selectedOptions) => field.onChange(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                                    />
                                  )}
                                />
                              </div>
                            </div>
                            <div className='sectionrow'>
                              <div className="fieldboxwhole">
                                <label>Objective Evidence</label>
                                <Controller
                                  name={`peqFiles${index}`}
                                  control={control}
                                  render={({ field }) => (
                                    <Select
                                      isClearable
                                      isMulti
                                      options={fileOptions}
                                      styles={customStyles}
                                      placeholder="Select files"
                                      value={field.value ? fileOptions.filter(f => field.value.includes(f.value)) : []}
                                      onChange={(selectedOptions) => field.onChange(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                                    />
                                  )}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div className='sectionrow'>
                      <button type='button' onClick={addPEQ} className='button' style={{ backgroundColor: 'green', width: '100%' }}>Add Question</button>
                    </div>
                  </div>
                  <div className='section'>
                    <label className='sectiontitle'>Every Time Questions</label>
                    {filteredEveryTimeQuestions.map((question, index) => (
                      <div className='peq' key={index}>
                        <div className="fieldboxwhole">
                          <label>Every Time Question {index + 1}</label>
                          <label style={{ fontSize: '18px', marginTop: '10px', marginBottom: '15px' }}>{question.question}</label>
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
                                  options={corporatePrOPOptions}
                                  styles={customStyles}
                                  placeholder="Corporate"
                                  value={field.value ? corporatePrOPOptions.filter(p => field.value.includes(p.value)) : []}
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
                                  options={sectorPrOPOptions}
                                  styles={customStyles}
                                  placeholder="Sector"
                                  value={field.value ? sectorPrOPOptions.filter(p => field.value.includes(p.value)) : []}
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
                                  options={divisionPrOPOptions}
                                  styles={customStyles}
                                  placeholder="Division"
                                  value={field.value ? divisionPrOPOptions.filter(p => field.value.includes(p.value)) : []}
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
                                  options={otherPrOPOptions}
                                  styles={customStyles}
                                  placeholder="Other"
                                  value={field.value ? otherPrOPOptions.filter(p => field.value.includes(p.value)) : []}
                                  onChange={(selectedOptions) => field.onChange(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                                />
                              )}
                            />
                          </div>
                        </div>
                        <div className='sectionrow'>
                          <div className="fieldboxwhole">
                            <label>Objective Evidence</label>
                            <Controller
                              name={`etqFiles${index}`}
                              control={control}
                              render={({ field }) => (
                                <Select
                                  isClearable
                                  isMulti
                                  options={fileOptions}
                                  styles={customStyles}
                                  placeholder="Select files"
                                  value={field.value ? fileOptions.filter(f => field.value.includes(f.value)) : []}
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
                    {Object.keys(standardTextsByStandard).length === 0 ? (
                      <>
                        <label className='sectiontitle'>Standard Requirements</label>
                        <p style={{ marginTop: '8px' }}>No standard requirements available for this audit.</p>
                      </>
                    ) : (
                      Object.entries(standardTextsByStandard).map(([standardIdValue, sections]) => {
                        const standardId = Number(standardIdValue);
                        const standardName = standardNameMap.get(standardId) || `Standard ${standardId}`;

                        return (
                          <div
                            key={`standard-${standardId}`}
                            style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                          >
                            <label className='sectiontitle' style={{ alignSelf: 'flex-start' }}>
                              {standardName} Requirements
                            </label>
                            {Object.entries(sections).map(([sectionNumValue, questions]) => {
                              const sectionNum = Number(sectionNumValue);
                              const sectionKey = `section_${standardId}_${sectionNum}`;
                              const isSectionCollapsed = collapsedSections[sectionKey];

                              return (
                                <div key={`${standardId}_${sectionNum}`} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <div
                                    onClick={() => setCollapsedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }))}
                                    style={{
                                      cursor: 'pointer',
                                      width: '96%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      marginTop: '10px'
                                    }}
                                  >
                                    <span style={{ marginRight: '8px', fontSize: '18px' }}>
                                      {isSectionCollapsed ? '▶' : '▼'}
                                    </span>
                                    <label className='sectiontitle' style={{ fontSize: '16px', margin: 0, cursor: 'pointer' }}>
                                      Standard Section {sectionNum}
                                    </label>
                                  </div>
                                  {!isSectionCollapsed && questions.map((question, qIndex) => {
                                    const subsectionKey = `subsection_${standardId}_${sectionNum}_${question.subsection}`;
                                    const isSubsectionCollapsed = collapsedSubsections[subsectionKey];
                                    const textKey = `text_${standardId}_${sectionNum}_${question.subsection}`;
                                    const isTextExpanded = expandedTexts[textKey];
                                    const maxLength = 200;
                                    const requiresTruncation = question.text.length > maxLength;
                                    const displayText = (!isTextExpanded && requiresTruncation) ? question.text.substring(0, maxLength) + '...' : question.text;
                                    const additionalKey = `${standardId}_${sectionNum}_${question.subsection}`;
                                    const additionalCount = standardAdditional[additionalKey] || 0;

                                    return (
                                      <div key={`${standardId}_${sectionNum}_${qIndex}`} style={{ width: '96%', marginTop: '10px' }}>
                                        <div
                                          onClick={() => setCollapsedSubsections(prev => ({ ...prev, [subsectionKey]: !prev[subsectionKey] }))}
                                          style={{
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '8px',
                                            backgroundColor: '#f5f5f5',
                                            borderRadius: '4px'
                                          }}
                                        >
                                          <span style={{ marginRight: '8px', fontSize: '14px' }}>
                                            {isSubsectionCollapsed ? '▶' : '▼'}
                                          </span>
                                          <label style={{ margin: 0, fontWeight: 'bold', cursor: 'pointer' }}>
                                            Subsection {sectionNum}.{question.subsection}
                                          </label>
                                        </div>
                                        {!isSubsectionCollapsed && (
                                          <div style={{ width: '100%', padding: '10px 0' }}>
                                            <div style={{
                                              width: '100%',
                                              minHeight: '50px',
                                              padding: '10px',
                                              backgroundColor: '#f9f9f9',
                                              borderRadius: '4px',
                                              marginBottom: '15px'
                                            }}>
                                              <ReactMarkdown>{displayText}</ReactMarkdown>
                                              {requiresTruncation && (
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setExpandedTexts(prev => ({ ...prev, [textKey]: !prev[textKey] }));
                                                  }}
                                                  style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#1976d2',
                                                    cursor: 'pointer',
                                                    textDecoration: 'underline',
                                                    padding: 0,
                                                    marginTop: '5px',
                                                    fontSize: '14px'
                                                  }}
                                                >
                                                  {isTextExpanded ? 'Read less' : 'Read more'}
                                                </button>
                                              )}
                                            </div>
                                            {additionalCount > 0 && Array.from({ length: additionalCount }, (_, addIdx) => {
                                              if (deletedStandardQuestions[additionalKey]?.has(addIdx)) return null;

                                              return (
                                                <div key={`${additionalKey}_add_${addIdx}`} style={{ width: '100%', marginBottom: '10px' }}>
                                                  <div className='peq'>
                                                    <div className="fieldboxwhole">
                                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                                        <label style={{ margin: 0, alignSelf: 'center' }}>Standard Question {addIdx + 1}</label>
                                                        <button
                                                          type="button"
                                                          onClick={() => deleteStandardQuestion(standardId, sectionNum, question.subsection, addIdx)}
                                                          style={{
                                                            background: '#f44336',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            padding: '6px 16px',
                                                            cursor: 'pointer',
                                                            fontSize: '12px',
                                                            fontWeight: 'bold',
                                                            whiteSpace: 'nowrap'
                                                          }}
                                                        >
                                                          × Delete
                                                        </button>
                                                      </div>
                                                      <textarea
                                                        {...register(`standardAdditionalQuestion_${standardId}_${sectionNum}_${question.subsection}_${addIdx}`)}
                                                        style={{ width: '100%', height: '80px', resize: 'vertical' }}
                                                        className='textfield'
                                                        placeholder="Enter your question here..."
                                                      />
                                                    </div>
                                                    <div className="fieldboxwhole">
                                                      <label>Finding Type</label>
                                                      <Controller
                                                        name={`standardAdditionalFindingType_${standardId}_${sectionNum}_${question.subsection}_${addIdx}`}
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
                                                          {...register(`standardAdditionalAuditorComment_${standardId}_${sectionNum}_${question.subsection}_${addIdx}`)}
                                                          style={{ width: '100%', height: '100px', resize: 'vertical' }}
                                                          className='textfield'
                                                        />
                                                      </div>
                                                      <div className="fieldboxhalf">
                                                        <label>Auditee Response</label>
                                                        <textarea
                                                          {...register(`standardAdditionalAuditeeResponse_${standardId}_${sectionNum}_${question.subsection}_${addIdx}`)}
                                                          style={{ width: '100%', height: '100px', resize: 'vertical' }}
                                                          className='textfield'
                                                        />
                                                      </div>
                                                    </div>
                                                    <div className='sectionrow'>
                                                      <div className="fieldboxquarter">
                                                        <label>Corporate PrOP</label>
                                                        <Controller
                                                          name={`standardAdditionalPrOPCorporate_${standardId}_${sectionNum}_${question.subsection}_${addIdx}`}
                                                          control={control}
                                                          render={({ field }) => (
                                                            <Select
                                                              isClearable
                                                              isMulti
                                                              options={corporatePrOPOptions}
                                                              styles={customStyles}
                                                              placeholder="Corporate"
                                                              value={field.value ? corporatePrOPOptions.filter(p => field.value.includes(p.value)) : []}
                                                              onChange={(selectedOptions) => field.onChange(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                                                            />
                                                          )}
                                                        />
                                                      </div>
                                                      <div className="fieldboxquarter">
                                                        <label>Sector PrOP</label>
                                                        <Controller
                                                          name={`standardAdditionalPrOPSector_${standardId}_${sectionNum}_${question.subsection}_${addIdx}`}
                                                          control={control}
                                                          render={({ field }) => (
                                                            <Select
                                                              isClearable
                                                              isMulti
                                                              options={sectorPrOPOptions}
                                                              styles={customStyles}
                                                              placeholder="Sector"
                                                              value={field.value ? sectorPrOPOptions.filter(p => field.value.includes(p.value)) : []}
                                                              onChange={(selectedOptions) => field.onChange(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                                                            />
                                                          )}
                                                        />
                                                      </div>
                                                      <div className="fieldboxquarter">
                                                        <label>Division PrOP</label>
                                                        <Controller
                                                          name={`standardAdditionalPrOPDivision_${standardId}_${sectionNum}_${question.subsection}_${addIdx}`}
                                                          control={control}
                                                          render={({ field }) => (
                                                            <Select
                                                              isClearable
                                                              isMulti
                                                              options={divisionPrOPOptions}
                                                              styles={customStyles}
                                                              placeholder="Division"
                                                              value={field.value ? divisionPrOPOptions.filter(p => field.value.includes(p.value)) : []}
                                                              onChange={(selectedOptions) => field.onChange(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                                                            />
                                                          )}
                                                        />
                                                      </div>
                                                      <div className="fieldboxquarter">
                                                        <label>Other PrOP</label>
                                                        <Controller
                                                          name={`standardAdditionalPrOPOther_${standardId}_${sectionNum}_${question.subsection}_${addIdx}`}
                                                          control={control}
                                                          render={({ field }) => (
                                                            <Select
                                                              isClearable
                                                              isMulti
                                                              options={otherPrOPOptions}
                                                              styles={customStyles}
                                                              placeholder="Other"
                                                              value={field.value ? otherPrOPOptions.filter(p => field.value.includes(p.value)) : []}
                                                              onChange={(selectedOptions) => field.onChange(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                                                            />
                                                          )}
                                                        />
                                                      </div>
                                                    </div>
                                                    <div className='sectionrow'>
                                                      <div className="fieldboxwhole">
                                                        <label>Objective Evidence</label>
                                                        <Controller
                                                          name={`standardAdditionalFiles_${standardId}_${sectionNum}_${question.subsection}_${addIdx}`}
                                                          control={control}
                                                          render={({ field }) => (
                                                            <Select
                                                              isClearable
                                                              isMulti
                                                              options={fileOptions}
                                                              styles={customStyles}
                                                              placeholder="Select files"
                                                              value={field.value ? fileOptions.filter(f => field.value.includes(f.value)) : []}
                                                              onChange={(selectedOptions) => field.onChange(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                                                            />
                                                          )}
                                                        />
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                            <div className='sectionrow'>
                                              <button
                                                type='button'
                                                onClick={() => addStandardQuestion(standardId, sectionNum, question.subsection)}
                                                className='button'
                                                style={{ backgroundColor: 'green', width: '100%' }}
                                              >
                                                Add Question
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })
                    )}
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

                </>)
            }


          </ form>
          {/* Fixed position buttons at bottom right */}
          {(selectedAudit && !auditLocked) && (
            <div style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              display: 'flex',
              gap: '10px',
              zIndex: 1000
            }}>
              {showNonconformatiesButton && (
                <button
                  type="button"
                  onClick={() => navigate(`/entry?type=nonconformaties&audit=${selectedAudit.scheduleId}`)}
                  style={{
                    backgroundColor: '#2196f3',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    borderRadius: '50px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                  }}
                >
                  Proceed to Nonconformaties
                </button>
              )}
              <button
                type='button'
                onClick={handleReset}
                style={{
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  borderRadius: '50px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                }}
              >
                Reset
              </button>
              <button
                type='submit'
                form='results-form'
                disabled={isSubmitting}
                style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  fontSize: '16px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  borderRadius: '50px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                }}
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </>
      }
    </>
  )
}

export default Results;
