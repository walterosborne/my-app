import { errorToast } from './errorToast.js';
import { React, useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import Select from "react-select"
import AsyncSelect from 'react-select/async'
import { Box } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { micromark } from 'micromark';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import './App.css'
import './AdminMenu.css';
import { grey } from '@mui/material/colors';
import { buildRosterOption, customStyles, formatDateForInput, parseCalendarDate } from './Utilities.jsx';
import FindingResponseFields, { getFindingFieldName } from './components/FindingResponseFields.jsx';
import {
  buildApiUrl,
  getPrograms,
  getDivisions,
  getSectors,
  getSites,
  getBusinessUnits,
  getOperatingUnits,
  getAuditors,
  getAuditTypes,
  getFunctions,
  getIntExt,
  getStandards,
  getStandardTexts,
  getProps,
  getCauses,
  getCurrentUser,
  getEveryTimeQuestions,
  getAuditorFiles,
  setAuditorFileActive,
  uploadAuditorFile,
  getAuditorFileDownloadUrl,
  getRosterByIds,
  searchRoster
} from './assets/data/apiData';

const findingTypeReverseMap = {
  1: 'Nonconformity',
  2: 'Conformity',
  3: 'OFI',
  4: 'OBS'
};

const flattenAuditQuestionFindings = (questions) => (questions || []).flatMap((question) =>
  (question.findings || []).map((finding, index) => ({
    ...finding,
    ncId: finding.findingId ?? finding.ncId,
    findingId: finding.findingId ?? finding.ncId,
    questionId: question.questionId,
    scheduleId: question.scheduleId,
    type: question.type,
    sourceId: question.sourceId,
    section: question.section,
    subsection: question.subsection,
    question: question.question,
    questionSortOrder: question.sortOrder,
    findingSortOrder: finding.sortOrder,
    responseNumber: index + 1
  }))
);

const normalizeMarkdownText = (value) => {
  const text = String(value || '');
  return text
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '    ')
    .replace(/\u2028|\u2029/g, '\n')
    .replace(/&nbsp;/g, ' ');
};

const escapeHtml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const renderInlineMarkdown = (value) => {
  let html = escapeHtml(value);

  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  html = html.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>');
  html = html.replace(/(^|[^_])_([^_]+)_(?!_)/g, '$1<em>$2</em>');

  return html;
};

const splitMarkdownTableRow = (line) =>
  line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());

const isMarkdownTableSeparator = (line) => {
  const cells = splitMarkdownTableRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
};

const isMarkdownTableRow = (line) => line.includes('|');

const convertMarkdownTablesToHtml = (markdown) => {
  const lines = markdown.split('\n');
  const output = [];

  for (let index = 0; index < lines.length; index += 1) {
    const currentLine = lines[index];
    const nextLine = lines[index + 1];

    if (
      currentLine &&
      nextLine &&
      isMarkdownTableRow(currentLine) &&
      isMarkdownTableSeparator(nextLine)
    ) {
      const headerCells = splitMarkdownTableRow(currentLine);
      const bodyRows = [];
      index += 2;

      while (index < lines.length && lines[index] && isMarkdownTableRow(lines[index])) {
        bodyRows.push(splitMarkdownTableRow(lines[index]));
        index += 1;
      }

      index -= 1;

      const headerHtml = headerCells
        .map((cell) => `<th>${renderInlineMarkdown(cell)}</th>`)
        .join('');

      const bodyHtml = bodyRows
        .map((row) => `<tr>${row.map((cell) => `<td>${renderInlineMarkdown(cell)}</td>`).join('')}</tr>`)
        .join('');

      output.push(`<table><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`);
      continue;
    }

    output.push(currentLine);
  }

  return output.join('\n');
};

const renderStandardMarkdown = (value) => micromark(convertMarkdownTablesToHtml(normalizeMarkdownText(value)), {
  allowDangerousHtml: true
});


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
    return value || 'No finding type listed';
  };

  const [newPEQs, setNewPEQs] = useState(0);
  const [deletedPEQs, setDeletedPEQs] = useState(new Set());
  const [selectedAudit, setSelectedAudit] = useState(null);
  const isViewOnly = Boolean(selectedAudit?.scheduleId && selectedAudit?.canEdit === false);
  const [accessBlock, setAccessBlock] = useState(null);
  const [standardAdditional, setStandardAdditional] = useState({});
  const [deletedStandardQuestions, setDeletedStandardQuestions] = useState({});
  const [collapsedPEQs, setCollapsedPEQs] = useState({});
  const [collapsedSections, setCollapsedSections] = useState({});
  const [collapsedSubsections, setCollapsedSubsections] = useState({});
  const [collapsedEveryTimeQuestions, setCollapsedEveryTimeQuestions] = useState({});
  const [expandedTexts, setExpandedTexts] = useState({});
  const [schedule, setSchedule] = useState(null);
  const [auditLocked, setAuditLocked] = useState(false);
  const [auditQuestions, setAuditQuestions] = useState([]);
  const [nonconformances, setNonconformances] = useState([]);
  const [findingCountsByQuestion, setFindingCountsByQuestion] = useState({});
  const [deletedFindingSlots, setDeletedFindingSlots] = useState({});
  const [loadedNonconformancesScheduleId, setLoadedNonconformancesScheduleId] = useState(null);
  const [auditorFiles, setAuditorFiles] = useState([]);
  const [showArchivedAuditorFiles, setShowArchivedAuditorFiles] = useState(false);
  const [objectiveEvidenceCollapsed, setObjectiveEvidenceCollapsed] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [archivingFileId, setArchivingFileId] = useState(null);
  const fileInputRef = useRef(null);
  const lastSelectedScheduleRef = useRef(null);
  const readOnlyToastRef = useRef(null);
  const accessErrorToastRef = useRef(null);
  const uploadErrorToastIdRef = useRef('auditor-file-upload-error');
  const submitIntentRef = useRef('save');
  const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
  const oversizedUploadFiles = uploadFiles.filter((file) => file.size > MAX_UPLOAD_BYTES);
  const isUploadTooLarge = oversizedUploadFiles.length > 0;
  const isCuiQuestionsBlocked = accessBlock?.kind === 'cui';
  const readOnlyStyle = (isViewOnly || isCuiQuestionsBlocked) ? { pointerEvents: 'none', opacity: 0.65 } : undefined;
  const [rowSelectionModel, setRowSelectionModel] = useState({
    type: 'include',
    ids: new Set()
  });
  const entryAudits = useMemo(() => {
    return allAudits.filter((audit) => ![-1, -2].includes(Number(audit?.stage)));
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

  useEffect(() => {
    if (!isViewOnly || !selectedAudit?.scheduleId) {
      readOnlyToastRef.current = null;
      return;
    }
    if (readOnlyToastRef.current === selectedAudit.scheduleId) return;
    toast.info(`You are not assigned as an auditor on audit ${selectedAudit.scheduleId}. Entry fields are view-only.`);
    readOnlyToastRef.current = selectedAudit.scheduleId;
  }, [isViewOnly, selectedAudit]);

  useEffect(() => {
    const accessKey = accessBlock && selectedAudit?.scheduleId
      ? `${selectedAudit.scheduleId}:${accessBlock.kind}`
      : null;

    if (!accessKey) {
      accessErrorToastRef.current = null;
      return;
    }

    if (accessErrorToastRef.current === accessKey) return;

    errorToast(accessBlock.message || 'You do not have access to this audit.', {
      progressStyle: { backgroundColor: '#f44336' },
      style: { borderLeft: '4px solid #f44336' }
    });

    accessErrorToastRef.current = accessKey;
  }, [accessBlock, selectedAudit?.scheduleId]);

  // State for lookup data from API
  const [programsList, setProgramsList] = useState([]);
  const [divisionsList, setDivisionsList] = useState([]);
  const [standardsList, setStandardsList] = useState([]);
  const [standardTextsList, setStandardTextsList] = useState([]);
  const [propsList, setPropsList] = useState([]);
  const [rosterOptionsById, setRosterOptionsById] = useState({});
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
      responseNumber: nc.responseNumber ?? 1,
      type: getQuestionTypeLabel(nc.type),
      findingType: getFindingTypeLabel(nc.findingType),
      comment: nc.auditorComment || nc.comment || 'No response provided'
    }));
    return rows.sort((a, b) => Number(a.id) - Number(b.id));
  }, [nonconformances, getQuestionTypeLabel, getFindingTypeLabel]);

  const isAuditorFileActive = useCallback((file) => {
    const value = file?.active;
    if (value === null || value === undefined || value === '') {
      return true;
    }
    return value === true || value === 1 || value === '1';
  }, []);

  const isAuditorFileArchived = useCallback((file) => {
    return !isAuditorFileActive(file);
  }, [isAuditorFileActive]);

  const visibleAuditorFiles = useMemo(() => {
    return showArchivedAuditorFiles
      ? auditorFiles
      : auditorFiles.filter((file) => !isAuditorFileArchived(file));
  }, [auditorFiles, showArchivedAuditorFiles, isAuditorFileArchived]);

  const getAuditorFileOptionLabel = useCallback((file) => {
    if (!file) return '';
    return isAuditorFileArchived(file)
      ? `${file.fileName} (archived)`
      : file.fileName;
  }, [isAuditorFileArchived]);

  const fileOptions = useMemo(() => {
    return [...visibleAuditorFiles]
      .sort((a, b) => (a.fileName || '').localeCompare(b.fileName || ''))
      .map((file) => ({
        value: file.fileId,
        label: getAuditorFileOptionLabel(file)
      }));
  }, [visibleAuditorFiles, getAuditorFileOptionLabel]);

  const allAuditorFileOptionsById = useMemo(() => {
    const optionsById = new Map();
    [...auditorFiles]
      .sort((a, b) => (a.fileName || '').localeCompare(b.fileName || ''))
      .forEach((file) => {
        optionsById.set(String(file.fileId), {
          value: file.fileId,
          label: getAuditorFileOptionLabel(file)
        });
      });
    return optionsById;
  }, [auditorFiles, getAuditorFileOptionLabel]);

  const refreshAuditorFiles = useCallback(async () => {
    try {
      const files = await getAuditorFiles(true);
      setAuditorFiles(files);
    } catch (error) {
      console.error('Error loading auditor files:', error);
    }
  }, []);

  const handleToggleAuditorFileArchived = useCallback(async (file) => {
    if (isViewOnly) {
      errorToast(`Audit ${selectedAudit?.scheduleId} is view-only because you are not assigned as an auditor.`);
      return;
    }

    const nextActive = !isAuditorFileActive(file);
    setArchivingFileId(file.fileId);
    try {
      await setAuditorFileActive(file.fileId, nextActive);
      await refreshAuditorFiles();
      toast.success(nextActive ? 'File restored.' : 'File archived.');
    } catch (error) {
      errorToast(error.message || 'Failed to update file status.');
    } finally {
      setArchivingFileId(null);
    }
  }, [isAuditorFileActive, isViewOnly, refreshAuditorFiles, selectedAudit?.scheduleId]);

  const mergeRosterOptions = useCallback((people = []) => {
    const options = people
      .map((person) => buildRosterOption(person))
      .filter(Boolean);

    if (options.length > 0) {
      setRosterOptionsById((current) => {
        const next = { ...current };
        options.forEach((option) => {
          next[String(option.value)] = option;
        });
        return next;
      });
    }

    return options;
  }, []);

  const getRosterOption = useCallback((myId) => {
    if (!myId) return null;
    return rosterOptionsById[String(myId)] || { value: myId, label: String(myId) };
  }, [rosterOptionsById]);

  const loadRosterOptions = useCallback(async (inputValue) => {
    const trimmedInput = String(inputValue || '').trim();
    if (trimmedInput.length < 3) {
      return [];
    }

    const matches = await searchRoster(trimmedInput, 50);
    return mergeRosterOptions(matches);
  }, [mergeRosterOptions]);

  const handleFileUpload = async () => {
    if (isViewOnly) {
      errorToast(`Audit ${selectedAudit?.scheduleId} is view-only because you are not assigned as an auditor.`);
      return;
    }
    if (uploadFiles.length === 0) {
      errorToast('Please select at least one file to upload.');
      return;
    }
    const selectedNameCounts = uploadFiles.reduce((counts, file) => {
      const normalizedName = String(file?.name || '').trim().toLowerCase();
      if (normalizedName) {
        counts.set(normalizedName, (counts.get(normalizedName) || 0) + 1);
      }
      return counts;
    }, new Map());
    const duplicateSelectedNames = [...selectedNameCounts.entries()]
      .filter(([, count]) => count > 1)
      .map(([name]) => name);
    if (duplicateSelectedNames.length > 0) {
      errorToast(`Duplicate file names were selected: ${duplicateSelectedNames.join(', ')}.`);
      return;
    }
    const existingFileNames = new Set(
      auditorFiles.map((file) => String(file.fileName || '').trim().toLowerCase()).filter(Boolean)
    );
    const duplicateExistingNames = uploadFiles
      .map((file) => file.name)
      .filter((name) => existingFileNames.has(String(name || '').trim().toLowerCase()));
    if (duplicateExistingNames.length > 0) {
      errorToast(`A file with that name already exists: ${duplicateExistingNames.join(', ')}.`);
      return;
    }
    if (isUploadTooLarge) {
      const oversizedNames = oversizedUploadFiles.map((file) => file.name);
      const oversizedMessage = oversizedNames.length === 1
        ? `"${oversizedNames[0]}" exceeds the NGAT upload limit. Please choose a file smaller than 50MB and try again.`
        : `${oversizedNames.length} selected files exceed the NGAT upload limit. Please choose files smaller than 50MB and try again.`;
      errorToast(oversizedMessage, {
        autoClose: false,
        closeOnClick: true,
        closeButton: true,
        draggable: false,
        toastId: uploadErrorToastIdRef.current,
        progressStyle: { backgroundColor: '#d32f2f' },
        style: { borderLeft: '4px solid #d32f2f' }
      });
      return;
    }

    setUploadingFile(true);
    try {
      const savedFiles = await uploadAuditorFile(uploadFiles);
      const uploadedCount = Array.isArray(savedFiles) ? savedFiles.length : 1;
      toast.success(uploadedCount === 1 ? '1 file uploaded.' : `${uploadedCount} files uploaded.`);
      setUploadFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await refreshAuditorFiles();
    } catch (error) {
      if (error?.persistToast) {
        errorToast(error.message || 'Failed to upload file.', {
          autoClose: false,
          closeOnClick: true,
          closeButton: true,
          draggable: false,
          toastId: uploadErrorToastIdRef.current,
          progressStyle: { backgroundColor: '#d32f2f' },
          style: { borderLeft: '4px solid #d32f2f' }
        });
      } else {
        errorToast(error.message || 'Failed to upload file.');
      }
    } finally {
      setUploadingFile(false);
    }
  };

  const handleUploadFileSelection = useCallback((event) => {
    const selectedFiles = Array.from(event.target.files || []);
    setUploadFiles(selectedFiles);

    if (selectedFiles.length > 0 && !isViewOnly) {
      const fileLabel = selectedFiles.length === 1 ? 'file' : 'files';
      const pronoun = selectedFiles.length === 1 ? 'it' : 'them';
      toast.info(`${selectedFiles.length} ${fileLabel} selected. Hit "Save to my Files" to finish adding ${pronoun} to your saved files.`, {
        progressStyle: { backgroundColor: '#2196f3' },
        style: { borderLeft: '4px solid #2196f3' }
      });
    }
  }, [isViewOnly]);

  const normalizeFileIds = useCallback((value) => {
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
  }, []);

  const hasFieldValue = useCallback((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    return true;
  }, []);

  const hasSavedFindingMetadata = useCallback((nc) => {
    if (!nc) return false;
    return hasFieldValue(nc.findingType)
      || hasFieldValue(nc.response)
      || hasFieldValue(nc.auditorComment)
      || hasFieldValue(nc.qma)
      || hasFieldValue(nc.sector)
      || hasFieldValue(nc.division)
      || hasFieldValue(nc.other)
      || hasFieldValue(nc.details)
      || hasFieldValue(nc.AIN ?? nc.ain)
      || hasFieldValue(nc.severity)
      || normalizeFileIds(nc.files).length > 0;
  }, [hasFieldValue, normalizeFileIds]);

  const getEveryTimeQuestionCollapseKey = useCallback((question, index) => {
    return `etq_${question?.etqId ?? index}`;
  }, []);

  const getObjectiveEvidenceOptions = useCallback((selectedIds) => {
    const mergedOptions = new Map(fileOptions.map((option) => [String(option.value), option]));
    normalizeFileIds(selectedIds).forEach((fileId) => {
      const archivedSelectedOption = allAuditorFileOptionsById.get(String(fileId));
      if (archivedSelectedOption) {
        mergedOptions.set(String(archivedSelectedOption.value), archivedSelectedOption);
      }
    });

    return [...mergedOptions.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [allAuditorFileOptionsById, fileOptions, normalizeFileIds]);

  // Load all lookup data from API on mount
  useEffect(() => {
    async function loadLookupData() {
      try {
        const userData = await getCurrentUser();
        if (userData?.name) {
        setUserInfo(userData?.name && userData.name !== 'User' ? userData : null);
        }
        const [programs, divisions, auditors, standards, standardTexts, props, causes, files] = await Promise.all([
          getPrograms(),
          getDivisions(),
          getAuditors(),
          getStandards(),
          getStandardTexts(),
          getProps(),
          getCauses(),
          getAuditorFiles()
        ]);

        setProgramsList(programs);
        setDivisionsList(divisions);
        setAuditorsList(auditors);
        setStandardsList(standards);
        setStandardTextsList(standardTexts);
        setPropsList(props);
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

  useEffect(() => {
    const intervieweeIds = Array.isArray(selectedAudit?.intervieweeIds)
      ? selectedAudit.intervieweeIds.filter(Boolean)
      : [];
    if (intervieweeIds.length === 0) return;

    getRosterByIds(intervieweeIds)
      .then((people) => mergeRosterOptions(people))
      .catch((error) => console.error('Error loading selected interviewees:', error));
  }, [selectedAudit?.intervieweeIds, mergeRosterOptions]);

  // Fetch normalized questions/findings from database when schedule changes.
  useEffect(() => {
    let cancelled = false;

    async function fetchAuditQuestions() {
      if (!selectedAudit?.scheduleId) {
        setAccessBlock(null);
        setEveryTimeQuestionsList([]);
        setAuditQuestions([]);
        setNonconformances([]);
        setLoadedNonconformancesScheduleId(null);
        return;
      }

      setAccessBlock(null);
      setEveryTimeQuestionsList([]);
      setAuditQuestions([]);
      setNonconformances([]);
      setLoadedNonconformancesScheduleId(null);

      try {
        const divisionIds = normalizeIdArray(selectedAudit?.divisionId);
        const divisionFilter = divisionIds.length === 1 ? divisionIds[0] : null;
        const [questionsResponse, everyTimeQuestions] = await Promise.all([
          fetch(buildApiUrl(`audit-questions/${selectedAudit.scheduleId}`)),
          getEveryTimeQuestions(divisionFilter)
        ]);
        if (cancelled) return;

        const etqList = Array.isArray(everyTimeQuestions)
          ? everyTimeQuestions.filter((question) => (question.active ?? 1) === 1)
          : [];
        setEveryTimeQuestionsList(etqList);

        const responseText = await questionsResponse.text();
        let data;
        try {
          data = responseText ? JSON.parse(responseText) : [];
        } catch {
          throw new Error('Audit questions response was not valid JSON.');
        }

        if (!questionsResponse.ok) {
          const isCuiDenied = questionsResponse.status === 403 && data?.code === 'CUI_ACCESS_DENIED';
          if (questionsResponse.status === 403 || questionsResponse.status === 404) {
            setAccessBlock({
              kind: isCuiDenied ? 'cui' : 'forbidden',
              message: data?.error || 'You do not have access to this audit.'
            });
          }
          throw new Error(data?.error || `Failed to load audit questions (HTTP ${questionsResponse.status}).`);
        }

        if (!Array.isArray(data)) {
          throw new Error('Audit questions response was not an array.');
        }

        setAccessBlock(null);
        const etqById = new Map(
          etqList
            .map((question) => [Number(question.etqId), question])
            .filter(([id]) => Number.isFinite(id))
        );
        const etqByText = new Map(etqList.map((question) => [question.question, question]));
        const claimedEtqs = new Set();
        let convertedCount = 0;
        const converted = data.map((question) => {
          if (question.type !== 'ETQ') return question;

          const sourceId = Number(question.sourceId);
          const definition = (Number.isFinite(sourceId) ? etqById.get(sourceId) : null)
            || etqByText.get(question.question);
          const definitionKey = definition
            ? String(definition.etqId ?? definition.question)
            : null;

          // A configured ETQ appears once in the form. If legacy data happens
          // to contain duplicate ETQ question rows, keep the first as the ETQ
          // and expose the extras as PEQs instead of hiding or deleting them.
          if (!definition || claimedEtqs.has(definitionKey)) {
            convertedCount += 1;
            return { ...question, type: 'PEQ', sourceId: null };
          }

          claimedEtqs.add(definitionKey);
          return {
            ...question,
            sourceId: definition.etqId ?? question.sourceId,
            question: definition.question || question.question
          };
        });

        if (convertedCount > 0 && selectedAudit?.scheduleId) {
          if (!etqConversionNotifiedRef.current.has(selectedAudit.scheduleId)) {
            toast.info('ETQ converted to PEQ');
            etqConversionNotifiedRef.current.add(selectedAudit.scheduleId);
          }
        }

        setAuditQuestions(converted);
        setNonconformances(flattenAuditQuestionFindings(converted));
        setLoadedNonconformancesScheduleId(Number(selectedAudit.scheduleId));
      } catch (error) {
        if (cancelled) return;
        console.error('Error fetching audit questions:', error);
        setAuditQuestions([]);
        setNonconformances([]);
        setLoadedNonconformancesScheduleId(Number(selectedAudit.scheduleId));
      }
    }

    fetchAuditQuestions();
    return () => {
      cancelled = true;
    };
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
    const index = newPEQs;
    setCollapsedPEQs((current) => ({ ...current, [index]: false }));
    setFindingCountsByQuestion((current) => ({ ...current, [`peq_${index}`]: 1 }));
    setDeletedFindingSlots((current) => ({ ...current, [`peq_${index}`]: new Set() }));
    setNewPEQs((current) => current + 1);
  }

  function deletePEQ(index) {
    setDeletedPEQs((prev) => new Set([...prev, index]));
  }

  function addStandardQuestion(standardId, section, subsection) {
    const key = `${standardId}_${section}_${subsection}`;
    const questionIndex = standardAdditional[key] || 0;
    const questionKey = `std_${standardId}_${section}_${subsection}_${questionIndex}`;
    setFindingCountsByQuestion((current) => ({ ...current, [questionKey]: 1 }));
    setDeletedFindingSlots((current) => ({ ...current, [questionKey]: new Set() }));
    setStandardAdditional((prev) => ({
      ...prev,
      [key]: (prev[key] || 0) + 1
    }));
  }

  function deleteStandardQuestion(standardId, section, subsection, index) {
    const key = `${standardId}_${section}_${subsection}`;
    setDeletedStandardQuestions((prev) => ({
      ...prev,
      [key]: new Set([...(prev[key] || []), index])
    }));
  }

  const { register, handleSubmit,
    setError,
    formState: { errors, isSubmitting },
    control,
    reset,
    setValue
  } = useForm(
    {
      defaultValues: {}
    }
  )

  const getQuestionIdFieldName = useCallback((questionKey) => `question_${questionKey}_id`, []);

  const addFindingResponse = useCallback((questionKey) => {
    setFindingCountsByQuestion((current) => ({
      ...current,
      [questionKey]: (current[questionKey] || 0) + 1
    }));
  }, []);

  const deleteFindingResponse = useCallback((questionKey, findingIndex) => {
    setDeletedFindingSlots((current) => ({
      ...current,
      [questionKey]: new Set([...(current[questionKey] || []), findingIndex])
    }));
  }, []);

  const getVisibleFindingIndexes = useCallback((questionKey) => {
    const count = findingCountsByQuestion[questionKey] || 0;
    const deleted = deletedFindingSlots[questionKey] || new Set();
    return Array.from({ length: count }, (_, index) => index)
      .filter((index) => !deleted.has(index));
  }, [findingCountsByQuestion, deletedFindingSlots]);

  const collectFindingPayload = useCallback((data, questionKey) => {
    const count = findingCountsByQuestion[questionKey] || 0;
    const deleted = deletedFindingSlots[questionKey] || new Set();
    const findings = [];

    for (let index = 0; index < count; index += 1) {
      if (deleted.has(index)) continue;

      const findingId = data[getFindingFieldName(questionKey, index, 'id')] || null;
      const findingType = data[getFindingFieldName(questionKey, index, 'findingType')] || null;
      const response = data[getFindingFieldName(questionKey, index, 'response')] || '';
      const auditorComment = data[getFindingFieldName(questionKey, index, 'auditorComment')] || '';
      const qma = data[getFindingFieldName(questionKey, index, 'qma')] || [];
      const sector = data[getFindingFieldName(questionKey, index, 'sector')] || [];
      const division = data[getFindingFieldName(questionKey, index, 'division')] || [];
      const other = data[getFindingFieldName(questionKey, index, 'other')] || [];
      const files = data[getFindingFieldName(questionKey, index, 'files')] || [];
      const hasContent = Boolean(
        findingId
        || findingType
        || String(response).trim()
        || String(auditorComment).trim()
        || qma.length
        || sector.length
        || division.length
        || other.length
        || files.length
      );

      if (!hasContent) continue;
      findings.push({
        findingId,
        findingType,
        response,
        auditorComment,
        qma,
        sector,
        division,
        other,
        files,
        sortOrder: findings.length + 1
      });
    }

    return findings;
  }, [findingCountsByQuestion, deletedFindingSlots]);

  const clearAuditQuestionUiState = useCallback(() => {
    setNewPEQs(0);
    setDeletedPEQs(new Set());
    setStandardAdditional({});
    setDeletedStandardQuestions({});
    setFindingCountsByQuestion({});
    setDeletedFindingSlots({});
    setCollapsedPEQs({});
    setCollapsedSections({});
    setCollapsedSubsections({});
    setCollapsedEveryTimeQuestions({});
    setExpandedTexts({});
  }, []);

  const buildResultsFormValues = useCallback((audit, auditQuestionGroups, etqQuestions) => {
    const values = {
      overview: audit?.overview || '',
      auditorsTime: audit?.auditorsTime ?? audit?.auditorstime ?? '',
      cui: audit?.cui ?? null,
      standards: audit?.standardIds || [],
      programs: audit?.programIds || [],
      evaluator: audit?.evaluator || '',
      relatedItems: audit?.relatedItems || '',
      interviewees: audit?.intervieweeIds || [],
      auditDate: audit?.startDate ? formatDateForInput(audit.startDate) : '',
      delayCause: audit?.delayCause ?? null,
      programManager: audit?.programManager || '',
      maLeadManager: audit?.maLeadManager || '',
      peIntroduction: audit?.peIntroduction || ''
    };

    if (Array.isArray(audit?.processElements)) {
      audit.processElements.forEach((pe, idx) => {
        values[`pe${idx}_question`] = pe?.question || '';
        values[`pe${idx}_standard`] = pe?.standard || '';
        values[`pe${idx}_response`] = pe?.response || '';
        values[`pe${idx}_evidence`] = pe?.evidence || '';
        values[`pe${idx}_interviewees`] = Array.isArray(pe?.interviewees) ? pe.interviewees.join('; ') : '';
      });
    }

    const findingCountsTemp = {};
    const setFindingValues = (questionKey, findingIndex, finding = {}) => {
      values[getFindingFieldName(questionKey, findingIndex, 'id')] = finding.findingId ?? finding.ncId ?? null;
      values[getFindingFieldName(questionKey, findingIndex, 'findingType')] =
        findingTypeReverseMap[finding.findingType] || null;
      values[getFindingFieldName(questionKey, findingIndex, 'response')] = finding.response || '';
      values[getFindingFieldName(questionKey, findingIndex, 'auditorComment')] = finding.auditorComment || '';
      values[getFindingFieldName(questionKey, findingIndex, 'qma')] = finding.qma || [];
      values[getFindingFieldName(questionKey, findingIndex, 'sector')] = finding.sector || [];
      values[getFindingFieldName(questionKey, findingIndex, 'division')] = finding.division || [];
      values[getFindingFieldName(questionKey, findingIndex, 'other')] = finding.other || [];
      values[getFindingFieldName(questionKey, findingIndex, 'files')] = normalizeFileIds(finding.files);
    };

    const normalizedQuestions = [...(auditQuestionGroups || [])].sort((a, b) =>
      Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0)
      || Number(a.questionId ?? 0) - Number(b.questionId ?? 0)
    );

    const peqGroups = normalizedQuestions.filter((question) => question.type === 'PEQ');
    peqGroups.forEach((question, idx) => {
      const questionKey = `peq_${idx}`;
      values[getQuestionIdFieldName(questionKey)] = question.questionId || null;
      values[`peqQuestion${idx}`] = question.question || '';
      const findings = Array.isArray(question.findings) ? question.findings : [];
      findingCountsTemp[questionKey] = Math.max(findings.length, 1);
      findings.forEach((finding, findingIndex) => setFindingValues(questionKey, findingIndex, finding));
    });

    const usedEtqQuestionIds = new Set();
    (etqQuestions || []).forEach((definition, idx) => {
      const definitionId = Number(definition.etqId);
      const savedQuestion = normalizedQuestions.find((question) => {
        if (question.type !== 'ETQ' || usedEtqQuestionIds.has(question.questionId)) return false;
        const sourceMatches = Number.isFinite(definitionId)
          && Number(question.sourceId) === definitionId;
        return sourceMatches || question.question === definition.question;
      });
      if (savedQuestion?.questionId) usedEtqQuestionIds.add(savedQuestion.questionId);

      const questionKey = `etq_${idx}`;
      values[getQuestionIdFieldName(questionKey)] = savedQuestion?.questionId || null;
      const findings = Array.isArray(savedQuestion?.findings) ? savedQuestion.findings : [];
      findingCountsTemp[questionKey] = Math.max(findings.length, 1);
      findings.forEach((finding, findingIndex) => setFindingValues(questionKey, findingIndex, finding));
    });

    const standardAdditionalTemp = {};
    const activeStandardSet = new Set((audit?.standardIds || []).map((id) => Number(id)));

    normalizedQuestions.forEach((question) => {
      const standardId = Number(question.type);
      if (!Number.isFinite(standardId) || !activeStandardSet.has(standardId)) return;
      if (question.section === null || question.section === undefined
          || question.subsection === null || question.subsection === undefined) return;

      const additionalKey = `${standardId}_${question.section}_${question.subsection}`;
      const questionIndex = standardAdditionalTemp[additionalKey] || 0;
      standardAdditionalTemp[additionalKey] = questionIndex + 1;
      const questionKey = `std_${standardId}_${question.section}_${question.subsection}_${questionIndex}`;

      values[getQuestionIdFieldName(questionKey)] = question.questionId || null;
      values[`standardAdditionalQuestion_${standardId}_${question.section}_${question.subsection}_${questionIndex}`] =
        question.question || '';

      const findings = Array.isArray(question.findings) ? question.findings : [];
      findingCountsTemp[questionKey] = Math.max(findings.length, 1);
      findings.forEach((finding, findingIndex) => setFindingValues(questionKey, findingIndex, finding));
    });

    return {
      values,
      combinedPeqs: peqGroups,
      standardAdditionalTemp,
      findingCountsTemp
    };
  }, [normalizeFileIds, getQuestionIdFieldName]);

  const watchedStandards = useWatch({ control, name: 'standards' });
  const selectedStandardIds = useMemo(() => {
    if (Array.isArray(watchedStandards) && watchedStandards.length > 0) {
      return watchedStandards;
    }
    return selectedAudit?.standardIds || [];
  }, [watchedStandards, selectedAudit]);

  const buildStandardTextsByStandard = useCallback((standardIds) => {
    const ids = new Set((standardIds || []).map((id) => Number(id)));
    if (ids.size === 0) return {};
    const standardTextsForAudit = standardTextsList.filter((item) => ids.has(Number(item.standardId)));
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
  }, [standardTextsList]);

  const standardTextsByStandard = useMemo(() => {
    return buildStandardTextsByStandard(selectedStandardIds);
  }, [buildStandardTextsByStandard, selectedStandardIds]);

  const buildAuditQuestionCollapseDefaults = useCallback((audit, auditQuestionGroups, etqQuestions, groupedStandardTexts) => {
    const sectionDefaults = {};
    const subsectionDefaults = {};
    const everyTimeQuestionDefaults = {};
    const peqDefaults = {};
    const questionsForAudit = (auditQuestionGroups || []).filter(
      (question) => Number(question.scheduleId) === Number(audit?.scheduleId)
    );
    const questionHasSavedContent = (question) => Boolean(
      question
      && (
        hasFieldValue(question.question)
        || (question.findings || []).some((finding) => hasSavedFindingMetadata(finding))
      )
    );

    Object.entries(groupedStandardTexts).forEach(([standardIdValue, sections]) => {
      const standardId = Number(standardIdValue);
      Object.entries(sections).forEach(([sectionNumValue, standardTextRows]) => {
        const sectionNum = Number(sectionNumValue);
        const sectionKey = `section_${standardId}_${sectionNum}`;

        standardTextRows.forEach((standardText) => {
          const subsectionKey = `subsection_${standardId}_${sectionNum}_${standardText.subsection}`;
          const subsectionHasSavedContent = questionsForAudit.some((question) =>
            Number(question.type) === standardId
            && Number(question.section) === sectionNum
            && Number(question.subsection) === Number(standardText.subsection)
            && questionHasSavedContent(question)
          );
          subsectionDefaults[subsectionKey] = !subsectionHasSavedContent;
        });

        sectionDefaults[sectionKey] = false;
      });
    });

    (etqQuestions || []).forEach((definition, index) => {
      const savedQuestion = questionsForAudit.find((question) =>
        question.type === 'ETQ'
        && (
          (Number.isFinite(Number(definition.etqId)) && Number(question.sourceId) === Number(definition.etqId))
          || question.question === definition.question
        )
      );
      everyTimeQuestionDefaults[getEveryTimeQuestionCollapseKey(definition, index)] =
        !questionHasSavedContent(savedQuestion);
    });

    questionsForAudit
      .filter((question) => question.type === 'PEQ')
      .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
      .forEach((question, index) => {
        peqDefaults[index] = !questionHasSavedContent(question);
      });

    return {
      peqDefaults,
      sectionDefaults,
      subsectionDefaults,
      everyTimeQuestionDefaults
    };
  }, [getEveryTimeQuestionCollapseKey, hasSavedFindingMetadata, hasFieldValue]);

  useEffect(() => {
    const nextSectionDefaults = {};
    const nextSubsectionDefaults = {};

    Object.entries(standardTextsByStandard).forEach(([standardIdValue, sections]) => {
      const standardId = Number(standardIdValue);
      Object.entries(sections).forEach(([sectionNumValue, questions]) => {
        const sectionNum = Number(sectionNumValue);
        nextSectionDefaults[`section_${standardId}_${sectionNum}`] = false;

        questions.forEach((question) => {
          nextSubsectionDefaults[`subsection_${standardId}_${sectionNum}_${question.subsection}`] = true;
        });
      });
    });

    setCollapsedSections((current) => {
      let changed = false;
      const next = { ...current };
      Object.entries(nextSectionDefaults).forEach(([key, value]) => {
        if (!(key in next)) {
          next[key] = value;
          changed = true;
        }
      });
      return changed ? next : current;
    });

    setCollapsedSubsections((current) => {
      let changed = false;
      const next = { ...current };
      Object.entries(nextSubsectionDefaults).forEach(([key, value]) => {
        if (!(key in next)) {
          next[key] = value;
          changed = true;
        }
      });
      return changed ? next : current;
    });
  }, [standardTextsByStandard]);

  useEffect(() => {
    setCollapsedEveryTimeQuestions((current) => {
      let changed = false;
      const next = { ...current };
      filteredEveryTimeQuestions.forEach((question, index) => {
        const key = getEveryTimeQuestionCollapseKey(question, index);
        if (!(key in next)) {
          next[key] = true;
          changed = true;
        }
      });
      return changed ? next : current;
    });
  }, [filteredEveryTimeQuestions, getEveryTimeQuestionCollapseKey]);

  const auditDate = useWatch({ control, name: 'auditDate' });
  const expectedStartDate = selectedAudit?.expectedStartDate
    ? formatDateForInput(selectedAudit.expectedStartDate)
    : '';
  const isDelayed = Boolean(
    auditDate &&
    expectedStartDate &&
    parseCalendarDate(auditDate) > parseCalendarDate(expectedStartDate)
  );

  // Update form when audit is selected
  useEffect(() => {
    if (loading) {
      return;
    }
    // Wait for this audit's saved questions before choosing initial expansion.
    // An empty in-flight response must not make previously answered standards appear empty.
    if (schedule && selectedAudit
      && loadedNonconformancesScheduleId !== Number(selectedAudit.scheduleId)) {
      return;
    }
    if (schedule && selectedAudit) {
      const scheduleId = Number(selectedAudit.scheduleId);
      const auditQuestionGroups = auditQuestions.filter(
        (question) => Number(question.scheduleId) === scheduleId
      );
      const {
        values,
        combinedPeqs,
        standardAdditionalTemp,
        findingCountsTemp
      } = buildResultsFormValues(selectedAudit, auditQuestionGroups, filteredEveryTimeQuestions);
      const groupedStandardTexts = buildStandardTextsByStandard(selectedAudit?.standardIds || []);
      const {
        peqDefaults,
        sectionDefaults,
        subsectionDefaults,
        everyTimeQuestionDefaults
      } = buildAuditQuestionCollapseDefaults(
        selectedAudit,
        auditQuestionGroups,
        filteredEveryTimeQuestions,
        groupedStandardTexts
      );

      setNewPEQs(combinedPeqs.length);
      setDeletedPEQs(new Set());
      setStandardAdditional(standardAdditionalTemp);
      setDeletedStandardQuestions({});
      setFindingCountsByQuestion(findingCountsTemp);
      setDeletedFindingSlots({});
      setCollapsedPEQs(peqDefaults);
      setCollapsedSections(sectionDefaults);
      setCollapsedSubsections(subsectionDefaults);
      setCollapsedEveryTimeQuestions(everyTimeQuestionDefaults);
      reset(values);
    } else {
      clearAuditQuestionUiState();
      reset();
    }
  }, [schedule, selectedAudit, auditQuestions, loadedNonconformancesScheduleId, reset, filteredEveryTimeQuestions, loading, buildResultsFormValues, buildAuditQuestionCollapseDefaults, clearAuditQuestionUiState, buildStandardTextsByStandard]);

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

  const renderFindingResponses = (questionKey) => {
    const findingIndexes = getVisibleFindingIndexes(questionKey);
    return (
      <>
        {findingIndexes.map((findingIndex, visibleIndex) => (
          <FindingResponseFields
            key={`${questionKey}-finding-${findingIndex}`}
            questionKey={questionKey}
            findingIndex={findingIndex}
            responseNumber={visibleIndex + 1}
            control={control}
            register={register}
            corporatePrOPOptions={corporatePrOPOptions}
            sectorPrOPOptions={sectorPrOPOptions}
            divisionPrOPOptions={divisionPrOPOptions}
            otherPrOPOptions={otherPrOPOptions}
            getObjectiveEvidenceOptions={getObjectiveEvidenceOptions}
            normalizeFileIds={normalizeFileIds}
            onDelete={() => deleteFindingResponse(questionKey, findingIndex)}
          />
        ))}
        <button
          type="button"
          className="add-response-button"
          onClick={() => addFindingResponse(questionKey)}
        >
          + Add Response
        </button>
      </>
    );
  };

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
      if (isViewOnly) {
        errorToast(`Audit ${selectedAudit?.scheduleId} is view-only because you are not assigned as an auditor.`);
        return;
      }
      if (!selectedAudit) {
        alert('Please select an audit first');
        return;
      }

      const computeStage = (fallbackStage) => {
        const currentStage = selectedAudit?.stage ?? 0;
        return Math.max(currentStage, fallbackStage);
      };
      const nextStage = computeStage(3);

      // Map finding type strings to integers for database
      const findingTypeMap = {
        'Nonconformity': 1,
        'Conformity': 2,
        'OFI': 3,
        'OBS': 4
      };

      const scheduleId = Number(selectedAudit.scheduleId);
      const questionsPayload = [];
      const deletedQuestionIds = [];

      deletedPEQs.forEach((index) => {
        const questionId = Number(data[getQuestionIdFieldName(`peq_${index}`)]);
        if (Number.isSafeInteger(questionId) && questionId > 0) {
          deletedQuestionIds.push(questionId);
        }
      });

      Object.entries(deletedStandardQuestions).forEach(([key, deletedIndexes]) => {
        const [standardId, sectionNum, subsection] = key.split('_').map(Number);
        (deletedIndexes || new Set()).forEach((questionIndex) => {
          const questionKey = `std_${standardId}_${sectionNum}_${subsection}_${questionIndex}`;
          const questionId = Number(data[getQuestionIdFieldName(questionKey)]);
          if (Number.isSafeInteger(questionId) && questionId > 0) {
            deletedQuestionIds.push(questionId);
          }
        });
      });

      let questionSortOrder = 0;
      const mapFindingsForSave = (questionKey) => collectFindingPayload(data, questionKey).map((finding) => ({
        ...finding,
        findingType: finding.findingType ? (findingTypeMap[finding.findingType] || null) : null
      }));

      // Process Evaluation Questions: the question is stored once and owns any
      // number of independently classified responses/findings.
      for (let index = 0; index < newPEQs; index += 1) {
        if (deletedPEQs.has(index)) continue;
        const questionKey = `peq_${index}`;
        const questionText = String(data[`peqQuestion${index}`] || '');
        const questionId = data[getQuestionIdFieldName(questionKey)] || null;
        const findings = mapFindingsForSave(questionKey);

        if (!questionText.trim() && findings.length > 0) {
          setError(`peqQuestion${index}`, { type: 'required', message: 'Question text is required when responses are present.' });
          throw new Error(`Process Evaluation Question ${index + 1} needs question text.`);
        }
        if (!questionId && !questionText.trim() && findings.length === 0) continue;

        questionsPayload.push({
          questionId,
          scheduleId,
          type: 'PEQ',
          sourceId: null,
          section: null,
          subsection: null,
          question: questionText,
          sortOrder: ++questionSortOrder,
          findings
        });
      }

      // Every Time Questions use the configured ETQ as the question and can
      // now own zero, one, or many response/findings.
      filteredEveryTimeQuestions.forEach((etq, index) => {
        const questionKey = `etq_${index}`;
        const questionId = data[getQuestionIdFieldName(questionKey)] || null;
        const findings = mapFindingsForSave(questionKey);
        if (!questionId && findings.length === 0) return;

        questionsPayload.push({
          questionId,
          scheduleId,
          type: 'ETQ',
          sourceId: etq.etqId ?? null,
          section: null,
          subsection: null,
          question: etq.question || '',
          sortOrder: ++questionSortOrder,
          findings
        });
      });

      // Standard-based questions remain user-entered under a standard clause,
      // but each question can own multiple findings.
      Object.keys(standardAdditional).forEach((key) => {
        const [standardId, sectionNum, subsection] = key.split('_').map(Number);
        const count = standardAdditional[key];
        for (let questionIndex = 0; questionIndex < count; questionIndex += 1) {
          if (deletedStandardQuestions[key]?.has(questionIndex)) continue;

          const questionKey = `std_${standardId}_${sectionNum}_${subsection}_${questionIndex}`;
          const questionText = String(
            data[`standardAdditionalQuestion_${standardId}_${sectionNum}_${subsection}_${questionIndex}`] || ''
          );
          const questionId = data[getQuestionIdFieldName(questionKey)] || null;
          const findings = mapFindingsForSave(questionKey);

          if (!questionText.trim() && findings.length > 0) {
            const fieldName = `standardAdditionalQuestion_${standardId}_${sectionNum}_${subsection}_${questionIndex}`;
            setError(fieldName, { type: 'required', message: 'Question text is required when responses are present.' });
            throw new Error('A standard-based question with responses is missing its question text.');
          }
          if (!questionId && !questionText.trim() && findings.length === 0) continue;

          questionsPayload.push({
            questionId,
            scheduleId,
            type: standardId,
            sourceId: null,
            section: sectionNum,
            subsection,
            question: questionText,
            sortOrder: ++questionSortOrder,
            findings
          });
        }
      });

      // Save audit record with updated fields
      const auditResponse = await fetch(buildApiUrl('audits'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...selectedAudit,
          overview: data.overview,
          auditorsTime: data.auditorsTime === '' || data.auditorsTime == null ? null : Number(data.auditorsTime),
          cui: data.cui === null || data.cui === undefined || data.cui === '' ? null : Number(data.cui),
          standardIds: data.standards || [],
          programIds: data.programs || [],
          intervieweeIds: data.interviewees || [],
          startDate: data.auditDate || null,
          evaluator: data.evaluator,
          relatedItems: data.relatedItems,
          programManager: data.programManager,
          maLeadManager: data.maLeadManager,
          delayCause: isDelayed ? (data.delayCause || null) : null,
          stage: nextStage,
          targetStage: 3
        })
      });

      const auditResult = await auditResponse.json();

      if (!auditResult.success) {
        throw new Error(auditResult.error || 'Failed to save audit');
      }

      // Save the normalized question -> findings graph. Existing IDs are
      // preserved so Nonconformities, CARs, evidence links, and reports keep
      // referring to the same finding across edits.
      const response = await fetch(buildApiUrl('save-audit-questions'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduleId: selectedAudit.scheduleId,
          questions: questionsPayload,
          deletedQuestionIds
        })
      });

      const result = await response.json();

      if (result.success) {
        const isProceeding = submitIntentRef.current === 'proceed';
        toast.success(isProceeding ? 'Results saved!' : 'Results saved.');
        const savedQuestions = Array.isArray(result.questions) ? result.questions : questionsPayload;

        setSelectedAudit((current) => {
          if (!current || Number(current.scheduleId) !== scheduleId) {
            return current;
          }

          return {
            ...current,
            overview: data.overview,
            auditorsTime: data.auditorsTime === '' || data.auditorsTime == null ? null : Number(data.auditorsTime),
            auditorstime: data.auditorsTime === '' || data.auditorsTime == null ? null : Number(data.auditorsTime),
            cui: data.cui === null || data.cui === undefined || data.cui === '' ? null : Number(data.cui),
            standardIds: data.standards || [],
            programIds: data.programs || [],
            intervieweeIds: data.interviewees || [],
            startDate: data.auditDate || null,
            evaluator: data.evaluator,
            relatedItems: data.relatedItems,
            programManager: data.programManager,
            maLeadManager: data.maLeadManager,
            delayCause: isDelayed ? (data.delayCause || null) : null,
            stage: nextStage
          };
        });

        setAuditQuestions(savedQuestions);
        setNonconformances(flattenAuditQuestionFindings(savedQuestions));

        if (isProceeding) {
          if (reloadAudits) {
            await reloadAudits();
          }
          navigate(`/entry?type=nonconformities&audit=${selectedAudit.scheduleId}`);
        }
      } else {
        throw new Error(result.error || 'Failed to save audit questions and findings');
      }

      console.log(data);
    }
    catch (error) {
      //The root error is a form-level error not tied to a specific field
      setError("root",
        { message: error.message }
      )
    }
    finally {
      submitIntentRef.current = 'save';
    }

  }

  function onValidationError(validationErrors) {
    submitIntentRef.current = 'save';
    const errorArray = Object.values(validationErrors)
      .map((error) => error?.message)
      .filter(Boolean);

    const errorMessage = errorArray.length > 3
      ? 'Please complete all required fields'
      : errorArray.join(', ') || 'Please fill in all required fields';

    errorToast(errorMessage, {
      progressStyle: { backgroundColor: '#f44336' },
      style: { borderLeft: '4px solid #f44336' }
    });
  }

  function handleObjectiveEvidenceDownload() {
    toast.info('Now downloading...', {
      progressStyle: { backgroundColor: '#2196f3' },
      style: { borderLeft: '4px solid #2196f3' }
    });
  }


  async function unlockAudit() {
    try {
      if (isViewOnly) {
        errorToast(`Audit ${selectedAudit?.scheduleId} is view-only because you are not assigned as an auditor.`);
        return;
      }
      if (!schedule?.scheduleId) {
        throw new Error('No audit selected');
      }

      const response = await fetch(buildApiUrl('unlock-audit'), {
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
      errorToast('Failed to unlock audit: ' + error.message);
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
      {errors.root && <p className='error'>{errors.root.message}</p>}
        <>
          {/* Form that has certain built in properties like submit and reset */}
          <form id='results-form' onSubmit={handleSubmit(onSubmit, onValidationError)} style={{ width: '100%' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div
                  onClick={() => setObjectiveEvidenceCollapsed((current) => !current)}
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span style={{ fontSize: '18px' }}>
                    {objectiveEvidenceCollapsed ? '▶' : '▼'}
                  </span>
                  <label className='sectiontitle' style={{ margin: 0, cursor: 'pointer' }}>My Objective Evidence</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
                  <label className="admin-include-archived">
                    <input
                      type="checkbox"
                      checked={showArchivedAuditorFiles}
                      onChange={(event) => setShowArchivedAuditorFiles(event.target.checked)}
                    />
                    Show archived files?
                  </label>
                </div>
              </div>
              {!objectiveEvidenceCollapsed && (
                <>
                  <p className="admin-editing-label">Your files can be used in any of your audits, and an audit's files can be downloaded by all associated auditors on the audit's report page.</p>
                  <div className="admin-edit-table-wrapper" style={{ width: '100%' }}>
                    <div className="admin-edit-table-scroll">
                      <table className="admin-edit-table objective-evidence-table" style={{ width: '100%', tableLayout: 'fixed', textAlign: 'left' }}>
                        <colgroup>
                          <col style={{ width: '42%' }} />
                          <col style={{ width: '28%' }} />
                          <col style={{ width: '30%' }} />
                        </colgroup>
                        <thead>
                          <tr>
                            <th className="objective-evidence-header">File Name</th>
                            <th className="objective-evidence-header">File Type</th>
                            <th className="objective-evidence-header"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleAuditorFiles.length === 0 ? (
                            <tr>
                              <td colSpan={3} style={{ textAlign: 'center', padding: '12px' }}>
                                {auditorFiles.length === 0
                                  ? 'No files uploaded yet.'
                                  : 'No active files to show. Turn on "Show archived files?" to view archived files.'}
                              </td>
                            </tr>
                          ) : (
                            visibleAuditorFiles.map((file) => {
                              const isArchived = isAuditorFileArchived(file);
                              const isArchivingThisFile = archivingFileId === file.fileId;
                              return (
                                <tr key={file.fileId} className={isArchived ? 'archived' : ''}>
                                  <td style={{ textAlign: 'left' }}>{file.fileName}</td>
                                  <td style={{ textAlign: 'left' }}>{file.mimeType || 'Unknown'}</td>
                                  <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'inline-flex', gap: '8px', flexWrap: 'nowrap', justifyContent: 'flex-end', whiteSpace: 'nowrap' }}>
                                      <a
                                        href={getAuditorFileDownloadUrl(file.fileId)}
                                        onClick={handleObjectiveEvidenceDownload}
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
                                      <button
                                        type="button"
                                        className="button"
                                        disabled={isArchivingThisFile || isViewOnly}
                                        onClick={() => handleToggleAuditorFileArchived(file)}
                                        style={{
                                          backgroundColor: isArchived ? '#2e7d32' : '#ed6c02',
                                          color: 'white',
                                          padding: '6px 12px',
                                          minWidth: '88px'
                                        }}
                                      >
                                        {isArchivingThisFile ? 'Saving...' : (isArchived ? 'Restore' : 'Archive')}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className='sectionrow' style={{ marginTop: '12px', alignItems: 'center' }}>
                    <div className="fieldboxhalf">
                      {uploadFiles.length === 0 && <label>Upload Files</label>}
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        disabled={isViewOnly || uploadingFile}
                        onChange={handleUploadFileSelection}
                        className="textfield"
                      />
                      {uploadFiles.length > 0 && (
                        <p style={{ marginTop: '8px', marginBottom: 0, fontSize: '14px', color: '#555' }}>
                          {uploadFiles.length === 1
                            ? `Selected: ${uploadFiles[0].name}`
                            : `${uploadFiles.length} files selected`}
                        </p>
                      )}
                    </div>
                    <div className="fieldboxhalf" style={{ display: 'flex', alignItems: 'center' }}>
                      {uploadFiles.length > 0 && !isUploadTooLarge && !isViewOnly && (
                        <button
                          type="button"
                          className="button"
                          onClick={handleFileUpload}
                          disabled={uploadingFile}
                          style={{ backgroundColor: '#1976d2', width: '100%' }}
                        >
                          {uploadingFile
                            ? 'Uploading...'
                            : (uploadFiles.length === 1 ? 'Save 1 File to My Files' : `Save ${uploadFiles.length} Files to My Files`)}
                        </button>
                      )}
                    </div>
                  </div>
                  {uploadFiles.length > 0 && isUploadTooLarge && (
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
                        {oversizedUploadFiles.length === 1
                          ? `${oversizedUploadFiles[0].name} exceeds the 50MB limit. Please choose a smaller file.`
                          : `${oversizedUploadFiles.length} selected files exceed the 50MB limit. Please choose smaller files.`}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
            {schedule && accessBlock && accessBlock.kind !== 'cui' ? (
              <>
                <h2 style={{ marginTop: '30px', marginBottom: '20px', color: '#d32f2f' }}>
                  {accessBlock.message || 'You do not have access to this audit.'}
                </h2>
              </>
            ) : schedule && (auditLocked ?
              <>
                <h2 style={{ marginTop: '30px', marginBottom: '20px', color: '#d32f2f' }}>
                  Audit {schedule.scheduleId} has been submitted for final approval and cannot be edited.
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
                  {isViewOnly && (
                    <p style={{ marginTop: '6px', color: '#666' }}>
                      You are not assigned as an auditor on this audit. Fields are view-only.
                    </p>
                  )}
                  <div style={readOnlyStyle}>
                  {!isCuiQuestionsBlocked && (
                    <div className="admin-edit-table-wrapper" style={{ marginTop: '12px' }}>
                      <p className="admin-editing-label">Existing Findings and Nonconformities</p>
                      <div className="admin-edit-table-scroll">
                        <table className="admin-edit-table">
                          <thead>
                            <tr>
                              <th>Question</th>
                              <th>Response</th>
                              <th>Type</th>
                              <th>Finding Type</th>
                              <th>Comment</th>
                            </tr>
                          </thead>
                          <tbody>
                            {existingFindingsRows.length === 0 ? (
                              <tr>
                                <td colSpan={5}>No findings recorded yet.</td>
                              </tr>
                            ) : (
                              existingFindingsRows.map((row) => (
                                <tr key={row.id}>
                                  <td>{row.question}</td>
                                  <td>{row.responseNumber}</td>
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
                  )}
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
                      <div className={isDelayed ? "fieldboxthird" : "fieldboxquarter"}>
                        <label>Standard(s)<label style={{ color: 'red' }}>*</label></label>
                        <Controller
                          name="standards"
                          control={control}
                          rules={{ required: "Standard(s) is required" }}
                          render={({ field }) => (
                            <Select
                              isClearable
                              isMulti
                              closeMenuOnSelect={false}
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
                      <div className={isDelayed ? "fieldboxthird" : "fieldboxquarter"}>
                        <label>Interviewees</label>
                        <Controller
                          name="interviewees"
                          control={control}
                          render={({ field }) => (
                            <AsyncSelect
                              isClearable
                              isMulti
                              closeMenuOnSelect={false}
                              cacheOptions
                              defaultOptions={false}
                              loadOptions={loadRosterOptions}
                              styles={customStyles}
                              placeholder="Interviewees"
                              noOptionsMessage={({ inputValue }) => inputValue.trim().length < 3 ? 'Type at least 3 characters' : 'No matches found'}
                              value={Array.isArray(field.value) ? field.value.map((id) => getRosterOption(id)).filter(Boolean) : []}
                              onChange={(selectedOptions) => field.onChange(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                            />
                          )}
                        />
                      </div>
                      <div className={isDelayed ? "fieldboxthird" : "fieldboxquarter"}>
                        <label>Does this audit contain CUI?<label style={{ color: 'red' }}>*</label></label>
                        <Controller
                          name="cui"
                          control={control}
                          rules={{ required: "CUI selection is required" }}
                          render={({ field }) => (
                            <Select
                              isClearable
                              options={[
                                { value: 0, label: 'No' },
                                { value: 1, label: 'Yes' }
                              ]}
                              styles={customStyles}
                              placeholder="Select One"
                              value={field.value === 0 || field.value === 1
                                ? { value: field.value, label: field.value === 1 ? 'Yes' : 'No' }
                                : null}
                              onChange={(selectedOption) => field.onChange(selectedOption ? selectedOption.value : null)}
                            />
                          )}
                        />
                        {errors.cui && <p className='fielderror'>{errors.cui.message}</p>}
                      </div>
                      {!isDelayed && (
                        <div className="fieldboxquarter">
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
                              closeMenuOnSelect={false}
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
                    <div className='sectionrow'>
                      <div className="fieldboxwhole">
                        <label>Auditor's Time to Complete Audit (hours)</label>
                        <input
                          type="number"
                          {...register("auditorsTime", {
                            validate: {
                              isInteger: (value) => {
                                if (value === '' || value === null) return true;
                                return Number.isInteger(Number(value)) || "Please enter a whole number";
                              },
                              isNonNegative: (value) => {
                                if (value === '' || value === null) return true;
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
                        {errors.auditorsTime && <p className='fielderror'>{errors.auditorsTime.message}</p>}
                      </div>
                    </div>

                  </div>
                  {isCuiQuestionsBlocked ? (
                    <>
                      <h2 style={{ marginTop: '30px', marginBottom: '20px', color: '#d32f2f' }}>
                        {accessBlock.message || 'This audit is marked CUI. You are not CUI approved and cannot view its questions.'}
                      </h2>
                      <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                        You can view the Overview and Process Evaluation (PE) Introduction above, but the audit questions are hidden until you are CUI approved.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className='section'>
                        <label className='sectiontitle'>Process Evaluation Questions</label>
                        {Array.from({ length: newPEQs }, (_, index) => {
                          if (deletedPEQs.has(index)) return null;
                          const questionKey = `peq_${index}`;
                          const isCollapsed = collapsedPEQs[index] ?? true;

                          return (
                            <div key={index} style={{ width: '100%' }}>
                              <button
                                type="button"
                                aria-expanded={!isCollapsed}
                                onClick={() => setCollapsedPEQs((current) => ({
                                  ...current,
                                  [index]: !(current[index] ?? true)
                                }))}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  width: '100%',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  backgroundColor: '#f5f5f5',
                                  color: '#000',
                                  border: 0,
                                  borderRadius: '4px',
                                  padding: '8px',
                                  marginBottom: '8px',
                                  fontWeight: 'bold'
                                }}
                              >
                                <span aria-hidden="true">{isCollapsed ? '▶' : '▼'}</span>
                                <span>Process Evaluation Question {index + 1}</span>
                              </button>

                              {!isCollapsed && (
                                <div className="peq">
                                  <input
                                    type="hidden"
                                    {...register(getQuestionIdFieldName(questionKey))}
                                  />
                                  <div className="fieldboxwhole">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                      <label style={{ margin: 0, alignSelf: 'center' }}>
                                        Process Evaluation Question {index + 1}
                                      </label>
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
                                        × Delete Question
                                      </button>
                                    </div>
                                    <textarea
                                      {...register(`peqQuestion${index}`)}
                                      style={{ width: '100%', height: '80px', resize: 'vertical' }}
                                      id={`peqQuestion${index}`}
                                      className="textfield"
                                      placeholder="Enter your question here..."
                                    />
                                    {errors[`peqQuestion${index}`] && (
                                      <span className="fielderror">{errors[`peqQuestion${index}`].message}</span>
                                    )}
                                  </div>

                                  {renderFindingResponses(questionKey)}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        <div className='sectionrow'>
                          <button type='button' onClick={addPEQ} className='button' style={{ backgroundColor: 'green', width: '100%' }}>Add Question</button>
                        </div>
                      </div>
                      <div className='section'>
                        <label className='sectiontitle'>Every Time Questions</label>
                        {filteredEveryTimeQuestions.map((question, index) => {
                          const etqCollapseKey = getEveryTimeQuestionCollapseKey(question, index);
                          const isEtqCollapsed = collapsedEveryTimeQuestions[etqCollapseKey];
                          const questionKey = `etq_${index}`;

                          return (
                            <div className="peq" key={etqCollapseKey}>
                              <input
                                type="hidden"
                                {...register(getQuestionIdFieldName(questionKey))}
                              />
                              <div
                                onClick={() => setCollapsedEveryTimeQuestions((prev) => ({
                                  ...prev,
                                  [etqCollapseKey]: !prev[etqCollapseKey]
                                }))}
                                style={{
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '8px',
                                  padding: '8px',
                                  backgroundColor: '#f5f5f5',
                                  borderRadius: '4px',
                                  marginBottom: isEtqCollapsed ? 0 : '12px',
                                  width: '100%',
                                  boxSizing: 'border-box'
                                }}
                              >
                                <span style={{ fontSize: '14px', marginTop: '2px' }}>
                                  {isEtqCollapsed ? '▶' : '▼'}
                                </span>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <label style={{ margin: 0, fontWeight: 'bold', cursor: 'pointer' }}>
                                    Every Time Question {index + 1}
                                  </label>
                                  <label style={{ fontSize: '18px', marginTop: '10px', marginBottom: 0, cursor: 'pointer' }}>
                                    {question.question}
                                  </label>
                                </div>
                              </div>

                              {!isEtqCollapsed && renderFindingResponses(questionKey)}
                            </div>
                          );
                        })}
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
                              const isSectionCollapsed = collapsedSections[sectionKey] ?? false;

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
                                    const isSubsectionCollapsed = collapsedSubsections[subsectionKey] ?? true;
                                    const textKey = `text_${standardId}_${sectionNum}_${question.subsection}`;
                                    const isTextExpanded = expandedTexts[textKey];
                                    const maxLength = 200;
                                    const requiresTruncation = question.text.length > maxLength;
                                    const markdownHtml = renderStandardMarkdown(question.text);
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
                                              marginBottom: '15px',
                                              overflowWrap: 'anywhere',
                                              wordBreak: 'break-word',
                                              maxHeight: !isTextExpanded && requiresTruncation ? '220px' : 'none',
                                              overflow: !isTextExpanded && requiresTruncation ? 'hidden' : 'visible'
                                            }}>
                                              <div
                                                className="standard-markdown-rendered"
                                                dangerouslySetInnerHTML={{ __html: markdownHtml }}
                                              />
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
                                              const questionKey = `std_${standardId}_${sectionNum}_${question.subsection}_${addIdx}`;
                                              const questionFieldName = `standardAdditionalQuestion_${standardId}_${sectionNum}_${question.subsection}_${addIdx}`;

                                              return (
                                                <div key={`${additionalKey}_add_${addIdx}`} style={{ width: '100%', marginBottom: '10px' }}>
                                                  <div className="peq">
                                                    <input
                                                      type="hidden"
                                                      {...register(getQuestionIdFieldName(questionKey))}
                                                    />
                                                    <div className="fieldboxwhole">
                                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                                        <label style={{ margin: 0, alignSelf: 'center' }}>
                                                          Standard Question {addIdx + 1}
                                                        </label>
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
                                                          × Delete Question
                                                        </button>
                                                      </div>
                                                      <textarea
                                                        {...register(questionFieldName)}
                                                        style={{ width: '100%', height: '80px', resize: 'vertical' }}
                                                        className="textfield"
                                                        placeholder="Enter your question here..."
                                                      />
                                                      {errors[questionFieldName] && (
                                                        <span className="fielderror">{errors[questionFieldName].message}</span>
                                                      )}
                                                    </div>

                                                    {renderFindingResponses(questionKey)}
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
                    </>
                  )}
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
                  </div>
                </>)
            }


          </ form>
          {/* Fixed position buttons at bottom right */}
          {(selectedAudit && !auditLocked && !isViewOnly && !accessBlock) && (
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
                  type="submit"
                  form='results-form'
                  onClick={() => {
                    submitIntentRef.current = 'proceed';
                  }}
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: '#2196f3',
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
                  {isSubmitting ? 'Saving...' : 'Save and Proceed'}
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
                onClick={() => {
                  submitIntentRef.current = 'save';
                }}
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
    </>
  )
}

export default Results;
