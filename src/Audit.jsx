import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Audit.css';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
    buildApiUrl,
    getAuditsReport,
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
    getSeverities,
    getRosterByIds,
    getSafetyEquipment,
    getTrainingRequirements,
    getCauses,
    getProps,
    getCurrentUser,
    getRiskFactors,
    getSubcategories,
    getRiskRatings
} from './assets/data/apiData';
import { getOrgGroupLabel, getRiskToneLabel, getOrgTargetLabel } from './riskAnalysisUtils.js';
import { formatDateForDisplay, formatRosterLabel, getDateParts } from './Utilities.jsx';

const Audit = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // State for all data from API
    const [audits, setAudits] = React.useState([]);
    const [programsList, setProgramsList] = React.useState([]);
    const [divisionsList, setDivisionsList] = React.useState([]);
    const [sectorsList, setSectorsList] = React.useState([]);
    const [sitesList, setSitesList] = React.useState([]);
    const [businessUnitsList, setBusinessUnitsList] = React.useState([]);
    const [operatingUnitsList, setOperatingUnitsList] = React.useState([]);
    const [auditorsList, setAuditorsList] = React.useState([]);
    const [auditTypesList, setAuditTypesList] = React.useState([]);
    const [statusesList, setStatusesList] = React.useState([]);
    const [functionsList, setFunctionsList] = React.useState([]);
    const [intExtList, setIntExtList] = React.useState([]);
    const [standardsList, setStandardsList] = React.useState([]);
    const [severitiesList, setSeveritiesList] = React.useState([]);
    const [rosterList, setRosterList] = React.useState([]);
    const [safetyEquipmentList, setSafetyEquipmentList] = React.useState([]);
    const [trainingRequirementsList, setTrainingRequirementsList] = React.useState([]);
    const [nonconformances, setNonconformances] = React.useState([]);
    const [cars, setCars] = React.useState([]);
    const [causesList, setCausesList] = React.useState([]);
    const [approvals, setApprovals] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [propsList, setPropsList] = React.useState([]);
    const [riskFactorsList, setRiskFactorsList] = React.useState([]);
    const [riskSubcategoriesList, setRiskSubcategoriesList] = React.useState([]);
    const [riskRatingsList, setRiskRatingsList] = React.useState([]);
    const [accessErrorShown, setAccessErrorShown] = React.useState(false);
    const [currentUser, setCurrentUser] = React.useState(null);
    const [nudgingApprovers, setNudgingApprovers] = React.useState(false);

    // Load all data from API on mount
    React.useEffect(() => {
        async function loadAllData() {
            try {
                const [auditsData, programs, divisions, sectors, sites, businessUnits, operatingUnits, auditors, auditTypes, statuses, functions, intExt, standards, severities, safetyEquipment, trainingRequirements, props, causes, riskFactors, riskSubcategories, riskRatings, userData] = await Promise.all([
                    getAuditsReport(true),
                    getPrograms(),
                    getDivisions(),
                    getSectors(),
                    getSites(),
                    getBusinessUnits(),
                    getOperatingUnits(),
                    getAuditors(),
                    getAuditTypes(),
                    getStatuses(),
                    getFunctions(),
                    getIntExt(),
                    getStandards(),
                    getSeverities(),
                    getSafetyEquipment(),
                    getTrainingRequirements(),
                    getProps(),
                    getCauses(),
                    getRiskFactors(),
                    getSubcategories(),
                    getRiskRatings(),
                    getCurrentUser()
                ]);

                setAudits(auditsData);
                setCurrentUser(userData);
                setProgramsList(programs);
                setDivisionsList(divisions);
                setSectorsList(sectors);
                setSitesList(sites);
                setBusinessUnitsList(businessUnits);
                setOperatingUnitsList(operatingUnits);
                setAuditorsList(auditors);
                setAuditTypesList(auditTypes);
                setStatusesList(statuses);
                setFunctionsList(functions);
                setIntExtList(intExt);
                setStandardsList(standards);
                setSeveritiesList(severities);
                setSafetyEquipmentList(safetyEquipment);
                setTrainingRequirementsList(trainingRequirements);
                setCausesList(causes);
                setRiskFactorsList(riskFactors);
                setRiskSubcategoriesList(riskSubcategories);
                setRiskRatingsList(riskRatings);
                setLoading(false);
                setPropsList(props);
            } catch (error) {
                console.error('Error loading data:', error);
                setLoading(false);
            }
        }
        loadAllData();
    }, []);

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

    // Helper function to get sector name from sectorId
    const getSectorName = (sectorId) => {
        const sector = sectorsList.find(s => s.sectorId === sectorId);
        return sector ? sector.sectorName : sectorId;
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

    // Helper function to get site label from siteId
    const getSiteName = (siteId) => {
        const site = sitesList.find(s => s.siteId === siteId);
        return site ? getSiteLabel(site) : siteId;
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
        }).join('; ');
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

    // Helper function to get function name(s) from functionId(s)
    const getFunctionName = (functionId) => {
        const ids = normalizeIdArray(functionId);
        if (ids.length === 0) return '';
        return ids
            .map(id => {
                const func = functionsList.find(f => f.functionId === id);
                return func ? func.functionName : id;
            })
            .join('; ');
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

    const getStandardTypeLabel = (typeValue) => {
        if (!typeValue && typeValue !== 0) return '';
        if (typeValue === 'PEQ' || typeValue === 'ETQ') return typeValue;
        const parsed = Number(typeValue);
        if (Number.isFinite(parsed)) {
            const standard = standardsList.find((s) => s.standardId === parsed);
            return standard ? standard.standardName : `Standard ${parsed}`;
        }
        return String(typeValue);
    };

    const standardFindingsSorted = React.useMemo(() => {
        const order = { 1: 1, 3: 2, 4: 3, 2: 4 };
        return nonconformances
            .filter((nc) => nc.type !== 'PEQ' && nc.type !== 'ETQ')
            .slice()
            .sort((a, b) => {
                const labelA = getStandardTypeLabel(a.type);
                const labelB = getStandardTypeLabel(b.type);
                if (labelA !== labelB) {
                    return (labelA || '').localeCompare(labelB || '');
                }
                const sectionA = Number(a.section ?? 0);
                const sectionB = Number(b.section ?? 0);
                if (sectionA !== sectionB) return sectionA - sectionB;
                const subA = Number(a.subsection ?? 0);
                const subB = Number(b.subsection ?? 0);
                if (subA !== subB) return subA - subB;
                return (order[a.findingType] || 999) - (order[b.findingType] || 999);
            });
    }, [nonconformances, standardsList]);

    const rosterLookup = React.useMemo(() => {
        const next = new Map();
        rosterList.forEach((entry) => {
            const myId = entry?.myId ?? entry?.myid;
            if (!myId) return;
            next.set(String(myId), entry);
        });
        return next;
    }, [rosterList]);

    // Helper function to get roster names from MyIDs
    const getRosterNames = (myIds) => {
        return normalizeIdArray(myIds)
            .map((myId) => {
                const rosterMember = rosterLookup.get(String(myId));
                return rosterMember ? formatRosterLabel(rosterMember) : String(myId);
            })
            .join(', ');
    };

    const getRosterName = (myId) => {
        if (myId === null || myId === undefined) return '';
        const rosterMember = rosterLookup.get(String(myId));
        return rosterMember ? formatRosterLabel(rosterMember) : String(myId);
    };

    const getPropName = (propId) => {
        if (propId === null || propId === undefined) return '';
        const prop = propsList.find(p => p.propId === propId);
        return prop ? prop.PrOP : propId;
    };

    const getPropNames = (propIds) => {
        const ids = normalizeIdArray(propIds);
        if (ids.length === 0) return '';
        return ids
            .map((id) => getPropName(id))
            .filter(Boolean)
            .join('; ');
    };

    const getPropGroupLabel = (prop) => {
        const typeId = Number(prop?.propTypeId);
        if (typeId === 1) return 'Corporate';
        if (typeId === 2) return 'Sector';
        if (typeId === 3) return 'Division';
        if (typeId === 4) return 'Site';
        if (typeId === 5) return 'Business Unit';
        if (typeId === 6) return 'Operating Unit';
        if (typeId === 7) return 'Program';
        return 'Other';
    };

    const getPropDisplayName = (propId) => {
        if (propId === null || propId === undefined) return '';
        const prop = propsList.find((item) => Number(item.propId) === Number(propId));
        if (!prop) return String(propId);
        return `${prop.PrOP} (${getPropGroupLabel(prop)})`;
    };

    const getFindingPropSummary = (finding) => {
        const orderedIds = [
            ...normalizeIdArray(finding.qma),
            ...normalizeIdArray(finding.sector),
            ...normalizeIdArray(finding.division),
            ...normalizeIdArray(finding.other)
        ];
        const seen = new Set();
        const values = [];

        orderedIds.forEach((id) => {
            const numericId = Number(id);
            const key = Number.isFinite(numericId) ? numericId : id;
            if (seen.has(key)) return;
            seen.add(key);
            const display = getPropDisplayName(id);
            if (display) values.push(display);
        });

        return values.join('; ');
    };

    const getPropDocumentsList = () => {
        const propIds = new Set();
        nonconformances.forEach(nc => {
            ['division', 'sector', 'qma', 'other'].forEach((field) => {
                const entries = Array.isArray(nc[field]) ? nc[field] : [];
                entries.forEach((value) => {
                    if (value !== null && value !== undefined && value !== '') {
                        propIds.add(Number(value));
                    }
                });
            });
        });
        const names = Array.from(propIds)
            .map((id) => getPropName(id))
            .filter(Boolean);
        return [...new Set(names)];
    };

    const getStandardClauses = () => {
        const clauseMap = new Map();
        nonconformances.forEach(nc => {
            if (!nc.section) return;
            const section = nc.section;
            const subsection = nc.subsection;
            const question = nc.question;
            const key = `${section}-${subsection || ''}`;
            if (clauseMap.has(key)) return;
            const label = `Clause ${section}${subsection ? '.' + subsection : ''}${question ? ` - ${question}` : ''}`;
            clauseMap.set(key, label);
        });
        return Array.from(clauseMap.values());
    };

    const escapeHtml = (unsafe) => {
        if (unsafe === null || unsafe === undefined) return '';
        return String(unsafe)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };

    const getLocationsText = () => {
        if (!auditData?.siteIds || auditData.siteIds.length === 0) {
            return '<span class="muted">No response provided.</span>';
        }
        const names = auditData.siteIds
            .map(siteId => escapeHtml(getSiteName(siteId)))
            .filter(Boolean);
        return names.length > 0 ? names.join('; ') : '<span class="muted">No response provided.</span>';
    };

    const getCarLines = () => {
        if (!cars || cars.length === 0) {
            return ['No CARs reviewed.'];
        }
        return cars.map(car => {
            const reviewer = car.reviewer ? ` (Reviewer: ${getRosterName(car.reviewer)})` : '';
            const effective = car.effective !== null && car.effective !== undefined
                ? ` - Effective: ${getPreviousCarsEffectiveLabel(car.effective)}`
                : ' - Effective: No response provided';
            return `${car.car}${reviewer}${effective}`;
        });
    };

    const getApproverList = () => {
        const entries = getApprovalEntries();
        if (entries.length === 0) return ['No approvers assigned.'];
        return entries.map((entry) => {
            const name = getRosterName(entry.approvermyid);
            const status = entry.approvedat ? 'Approved' : 'Pending';
            return `${name} - ${status}`;
        });
    };

    const getLeadAuditorMyId = () => {
        const auditor = auditorsList.find(a => a.auditorId === auditData?.leadAuditorId);
        if (!auditor) return null;
        return auditor.myId || null;
    };

    const getApprovalEntries = () => {
        const approvalMap = new Map();
        approvals.forEach((approval) => {
            approvalMap.set(approval.approvermyid, approval);
        });

        const approverIds = auditData?.approver ? [auditData.approver] : [];
        const additionalApproverIds = Array.isArray(auditData?.additionalApprovers)
            ? auditData.additionalApprovers.filter(Boolean)
            : [];
        const leadMyId = getLeadAuditorMyId();
        const requiredIds = [...new Set([
            ...approverIds,
            ...(leadMyId ? [leadMyId] : []),
            ...additionalApproverIds
        ])];

        if (requiredIds.length === 0 && approvalMap.size === 0) {
            return [];
        }

        const entries = [];
        const allIds = new Set([...requiredIds, ...approvalMap.keys()]);
        allIds.forEach((myId) => {
            const approval = approvalMap.get(myId);
            entries.push({
                approvermyid: myId,
                approvedat: approval?.approvedat || (isApproved ? new Date().toISOString() : null),
                approvalid: approval?.approvalid || `fallback-${myId}`
            });
        });
        return entries;
    };

    const getCauseName = (causeId) => {
        if (causeId === null || causeId === undefined) return '';
        const cause = causesList.find(c => c.causeId === causeId);
        return cause ? cause.cause : causeId;
    };

    // Helper function to get safety equipment names from safetyEquipmentIds
    const getSafetyEquipmentNames = (safetyEquipmentIds) => {
        return safetyEquipmentIds.map(seId => {
            const equipment = safetyEquipmentList.find(se => se.safetyEquipmentId === seId);
            return equipment ? equipment.safetyEquipmentName : seId;
        }).join(', ');
    };

    // Helper function to get training requirement names from trainingRequirementIds
    const getTrainingRequirementNames = (trainingRequirementIds) => {
        return trainingRequirementIds.map(trId => {
            const training = trainingRequirementsList.find(tr => tr.trainingRequirementId === trId);
            return training ? training.trainingRequirementName : trId;
        }).join(', ');
    };

    // Helper function to get severity label from severity integer
    const getSeverityLabel = (severity) => {
        if (severity == null) return 'N/A';
        const match = severitiesList.find((item) => item.severityId === severity);
        return match ? match.severity : 'N/A';
    };

    // Helper function to format date as MM-DD-YYYY
    const formatDate = (dateString) => formatDateForDisplay(dateString);


    // Find the audit based on URL param or default to highest numbered
    const getAuditData = () => {
        if (id) {
            const audit = audits.find(a => a.scheduleId === parseInt(id));
            return audit || null;
        }
        // Default to highest numbered audit (sort by scheduleId numerically)
        const sorted = [...audits].sort((a, b) => b.scheduleId - a.scheduleId);
        return sorted[0] || null;
    };

    const auditData = getAuditData();
    const stageValue = Number(auditData?.stage);
    const isLocked = auditData?.locked === 1;
    const isApproved = Boolean(auditData?.approvedAt);
    const showNcDetailFallbacks = Boolean(isLocked || auditData?.submittedAt || stageValue >= 4);
    const auditNotFound = Boolean(id) && !auditData;
    const isCuiAccessDenied = Boolean(
        auditData
        && Number(auditData?.cui) === 1
        && Number(currentUser?.cuiApproved ?? currentUser?.cuiapproved ?? 0) !== 1
    );
    const additionalAuditorIdsForPage = Array.isArray(auditData?.additionalAuditorIds)
        ? auditData.additionalAuditorIds
        : [];
    const additionalAuditorNamesForPage = getAdditionalAuditorNames(additionalAuditorIdsForPage);
    const isRosterNonAuditor = currentUser?.myId && !currentUser?.auditorId;
    const additionalApproverIds = Array.isArray(auditData?.additionalApprovers)
        ? auditData.additionalApprovers
        : [];
    const currentUserProgramIds = normalizeIdArray(currentUser?.programIds).map(Number).filter(Number.isFinite);
    const auditProgramIdsForPage = normalizeIdArray(auditData?.programIds).map(Number).filter(Number.isFinite);
    const auditDivisionIdsForPage = normalizeIdArray(auditData?.divisionId).map(Number).filter(Number.isFinite);
    const isLeadAuditor = currentUser?.auditorId && auditData?.leadAuditorId === currentUser.auditorId;
    const isAdditionalAuditor = Boolean(
        currentUser?.auditorId
        && additionalAuditorIdsForPage.map(Number).includes(Number(currentUser.auditorId))
    );
    const isApprover = currentUser?.myId && auditData?.approver === currentUser.myId;
    const isAdditionalApprover = currentUser?.myId && additionalApproverIds.includes(currentUser.myId);
    const canApprove = isLeadAuditor || isApprover || isAdditionalApprover;
    const isProgramAuditor = Boolean(
        currentUser?.auditorId
        && currentUserProgramIds.some((programId) => auditProgramIdsForPage.includes(programId))
    );
    const isDivisionAdmin = Boolean(
        currentUser?.isAdmin
        && currentUser?.divisionId
        && auditDivisionIdsForPage.includes(Number(currentUser.divisionId))
    );
    const canNudgeApprovers = Boolean(
        isLocked
        && !isApproved
        && (isLeadAuditor || isAdditionalAuditor || isProgramAuditor || isDivisionAdmin)
    );

    React.useEffect(() => {
        let cancelled = false;

        const rosterIds = [
            ...normalizeIdArray(auditData?.famaIds),
            ...normalizeIdArray(auditData?.intervieweeIds),
            ...approvals.map((entry) => entry?.approvermyid).filter(Boolean),
            ...cars.map((car) => car?.reviewer).filter(Boolean)
        ];

        if (currentUser?.myId) {
            rosterIds.push(currentUser.myId);
        }

        const normalizedIds = [...new Set(
            rosterIds
                .map((value) => String(value ?? '').trim())
                .filter(Boolean)
        )];

        if (normalizedIds.length === 0) {
            setRosterList([]);
            return () => {
                cancelled = true;
            };
        }

        async function loadRosterEntries() {
            try {
                const rosterData = await getRosterByIds(normalizedIds);
                if (!cancelled) {
                    setRosterList(rosterData);
                }
            } catch (error) {
                console.error('Error loading roster entries:', error);
                if (!cancelled) {
                    setRosterList([]);
                }
            }
        }

        loadRosterEntries();

        return () => {
            cancelled = true;
        };
    }, [auditData?.famaIds, auditData?.intervieweeIds, approvals, cars, currentUser?.myId]);

    const getStageLabel = (stage, locked, approved) => {
        if (stage === -1) return 'Historical';
        if (approved) return 'Approved';
        if (locked) return 'Pending Approval';
        switch (stage) {
            case 1:
                return 'Planning';
            case 2:
                return 'Conduct Audit';
            case 3:
                return 'Nonconformities';
            case 4:
                return 'Nonconformities';
            default:
                return 'Unknown Stage';
        }
    };

    const getAuditRiskYear = React.useMemo(() => {
        const candidateDate = auditData?.expectedStartDate || auditData?.actualStartDate || auditData?.expectedCompletionDate;
        if (!candidateDate) return new Date().getFullYear();
        const parsedYear = getDateParts(candidateDate)?.year;
        return Number.isFinite(parsedYear) ? parsedYear : new Date().getFullYear();
    }, [auditData?.expectedStartDate, auditData?.actualStartDate, auditData?.expectedCompletionDate]);

    const auditRiskGroups = React.useMemo(() => {
        if (!auditData) return [];

        const divisionIds = normalizeIdArray(auditData.divisionId).map(Number).filter(Number.isFinite);
        const siteIds = normalizeIdArray(auditData.siteIds).map(Number).filter(Number.isFinite);
        const businessUnitIds = normalizeIdArray(auditData.businessUnitIds).map(Number).filter(Number.isFinite);
        const operatingUnitIds = normalizeIdArray(auditData.operatingUnitIds).map(Number).filter(Number.isFinite);
        const programIds = normalizeIdArray(auditData.programIds).map(Number).filter(Number.isFinite);
        const sectorIds = normalizeIdArray(auditData.sectorId).map(Number).filter(Number.isFinite);

        const matchesAuditScope = (row) => {
            const typeId = Number(row.risktypeid);
            if (Number(row.year) !== Number(getAuditRiskYear)) return false;
            switch (typeId) {
                case 2:
                    return sectorIds.includes(Number(row.sectorid));
                case 3:
                    return divisionIds.includes(Number(row.divisionid));
                case 4:
                    return siteIds.includes(Number(row.siteid));
                case 5:
                    return businessUnitIds.includes(Number(row.buid));
                case 6:
                    return operatingUnitIds.includes(Number(row.ouid));
                case 7:
                    return programIds.includes(Number(row.programid));
                default:
                    return false;
            }
        };

        const grouped = new Map();

        riskRatingsList.filter(matchesAuditScope).forEach((row) => {
            const subcategory = riskSubcategoriesList.find((item) => Number(item.subcategoryid) === Number(row.subcategoryid));
            const riskFactor = riskFactorsList.find((item) => Number(item.riskfactorid) === Number(subcategory?.riskfactorid));
            const groupKey = `${row.risktypeid}-${row.sectorid || ''}-${row.divisionid || ''}-${row.siteid || ''}-${row.buid || ''}-${row.ouid || ''}-${row.programid || ''}-${row.processarea}-${row.year}`;
            if (!grouped.has(groupKey)) {
                grouped.set(groupKey, {
                    key: groupKey,
                    processArea: row.processarea || 'Unknown Process Area',
                    year: Number(row.year),
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
                    factors: new Map()
                });
            }

            const group = grouped.get(groupKey);
            const factorName = riskFactor?.riskfactor || 'Unassigned Risk Factor';
            if (!group.factors.has(factorName)) {
                group.factors.set(factorName, []);
            }
            group.factors.get(factorName).push({
                subcategoryName: subcategory?.subcategory || subcategory?.subCategory || 'Unknown Subcategory',
                rating: Number(row.rating)
            });
        });

        return Array.from(grouped.values())
            .map((group) => ({
                ...group,
                factorGroups: Array.from(group.factors.entries())
                    .map(([factorName, items]) => ({
                        factorName,
                        items: [...items].sort((a, b) => a.subcategoryName.localeCompare(b.subcategoryName))
                    }))
                    .sort((a, b) => a.factorName.localeCompare(b.factorName))
            }))
            .sort((a, b) => {
                const orgCompare = (a.orgGroupLabel || '').localeCompare(b.orgGroupLabel || '');
                if (orgCompare !== 0) return orgCompare;
                const targetCompare = (a.orgTargetLabel || '').localeCompare(b.orgTargetLabel || '');
                if (targetCompare !== 0) return targetCompare;
                return (a.processArea || '').localeCompare(b.processArea || '');
            });
    }, [
        auditData,
        getAuditRiskYear,
        riskRatingsList,
        riskSubcategoriesList,
        riskFactorsList,
        sectorsList,
        divisionsList,
        sitesList,
        businessUnitsList,
        operatingUnitsList,
        programsList
    ]);

    // Load nonconformances for the selected audit
    React.useEffect(() => {
        async function loadNonconformances() {
            if (isCuiAccessDenied) {
                setNonconformances([]);
                return;
            }
            if (auditData?.scheduleId) {
                try {
                    const response = await fetch(buildApiUrl(`nonconformances/${auditData.scheduleId}`));
                    const data = await response.json();
                    setNonconformances(data);
                } catch (error) {
                    console.error('Error loading nonconformances:', error);
                    setNonconformances([]);
                }
            }
        }
        loadNonconformances();
    }, [auditData?.scheduleId, isCuiAccessDenied]);

    const hasObjectiveEvidence = React.useMemo(() => {
        return nonconformances.some((nc) => {
            if (Array.isArray(nc?.files)) {
                return nc.files.length > 0;
            }
            if (typeof nc?.files === 'string') {
                return nc.files.trim().length > 0 && nc.files.trim() !== '[]';
            }
            return false;
        });
    }, [nonconformances]);

    React.useEffect(() => {
        async function loadApprovals() {
            if (isCuiAccessDenied) {
                setApprovals([]);
                return;
            }
            if (!auditData?.scheduleId) {
                setApprovals([]);
                return;
            }
            try {
                const response = await fetch(buildApiUrl(`approvals/${auditData.scheduleId}`));
                if (!response.ok) {
                    setApprovals([]);
                    return;
                }
                const data = await response.json();
                setApprovals(data.approvals || []);
            } catch (error) {
                console.error('Error loading approvals:', error);
                setApprovals([]);
            }
        }
        loadApprovals();
    }, [auditData?.scheduleId, isCuiAccessDenied]);

    // Load CARs for the selected audit
    React.useEffect(() => {
        async function loadCars() {
            if (isCuiAccessDenied) {
                setCars([]);
                return;
            }
            if (auditData?.scheduleId) {
                try {
                    const response = await fetch(buildApiUrl(`cars/${auditData.scheduleId}`));
                    const data = await response.json();
                    setCars(data);
                } catch (error) {
                    console.error('Error loading CARs:', error);
                    setCars([]);
                }
            }
        }
        loadCars();
    }, [auditData?.scheduleId, isCuiAccessDenied]);

    React.useEffect(() => {
        if (loading) return;
        if (isCuiAccessDenied && !accessErrorShown) {
            toast.error('This audit is marked CUI. You are not CUI approved and cannot view it.');
            setAccessErrorShown(true);
            return;
        }
        if (!id) return;
        if (auditNotFound && !accessErrorShown) {
            toast.error('You either do not have access to this audit or it does not exist.');
            setAccessErrorShown(true);
        }
    }, [auditNotFound, accessErrorShown, id, isCuiAccessDenied, loading]);

    // Show loading state while data is being fetched
    if (loading) {
        return (
            <div className="audit-page">
                <div className="audit-container">
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                        Loading audit data...
                    </div>
                </div>
            </div>
        );
    }

    if (auditNotFound) {
        return (
            <div className="audit-page">
                <div className="audit-container">
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                        {isRosterNonAuditor ? 'You are not listed as an auditor, approver, or auditee on any audits, and are not an NGAT auditor. You may request NGAT auditor access below, otherwise contact your auditor.' : 'You either do not have access to this audit or it does not exist.'}
                        <div style={{ marginTop: '1rem' }}>
                            {isRosterNonAuditor ? (
                                <button
                                    type="button"
                                    className="button"
                                    style={{ backgroundColor: '#0066cc', width: '220px' }}
                                    onClick={() => navigate('/request-auditor-access')}
                                >
                                    Request Access
                                </button>
                            ) : (
                                <button
                                    className="button"
                                    onClick={() => navigate('/audit')}
                                    style={{ backgroundColor: '#0066cc', width: '220px' }}
                                >
                                    Return to My Audits
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isCuiAccessDenied) {
        return (
            <div className="audit-page">
                <div className="audit-container">
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                        This audit is marked CUI. You are not CUI approved and cannot view its details.
                        <div style={{ marginTop: '1rem' }}>
                            <button
                                className="button"
                                onClick={() => navigate('/audit')}
                                style={{ backgroundColor: '#0066cc', width: '220px' }}
                            >
                                Return to My Audits
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isRosterNonAuditor && audits.length === 0) {
        return (
            <div className="audit-page">
                <div className="audit-container">
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                        You are not listed as an auditor, approver, or auditee on any audits, and are not an NGAT auditor. You may request NGAT auditor access below, otherwise contact your auditor.                        <div style={{ marginTop: '1rem' }}>
                            <button
                                type="button"
                                className="button"
                                style={{ backgroundColor: '#0066cc', width: '220px' }}
                                onClick={() => navigate('/request-auditor-access')}
                            >
                                Request Access
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (audits.length === 0) {
        return (
            <div className="audit-page">
                <div className="audit-container">
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                        You do not have any audits yet. Create one to get started.
                        <div style={{ marginTop: '1rem' }}>
                            <button
                                className="button"
                                onClick={() => navigate('/entry?type=schedule')}
                                style={{ backgroundColor: '#0066cc', width: '220px' }}
                            >
                                Create an Audit
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const handleAuditChange = (event) => {
        const selectedId = event.target.value;
        navigate(`/audit/${selectedId}`);
    };

    const getPreviousCarsEffectiveLabel = (value) => {
        const parsed = Number(value);
        if (parsed === 0) return 'Yes';
        if (parsed === 1) return 'No';
        if (parsed === 2) return 'Unknown';
        return 'No response provided';
    };

    const getCarReviewerLabel = (car) => {
        return car?.reviewer ? getRosterName(car.reviewer) : 'No reviewer';
    };

    const getFindingTypeLabel = (findingType) => {
        switch (findingType) {
            case 1:
                return 'Nonconformity';
            case 2:
                return 'Conformity';
            case 3:
                return 'OFI';
            case 4:
                return 'Observation';
            default:
                return 'No finding type listed';
        }
    };

    const getFindingChipMeta = (findingType) => {
        if (findingType === 1) return { label: 'Nonconformity', className: 'nonconformity' };
        if (findingType === 2) return { label: 'Conformity', className: 'conformity' };
        if (findingType === 3) return { label: 'OFI', className: 'ofi' };
        if (findingType === 4) return { label: 'Observation', className: 'observation' };
        return null;
    };

    const handleExportXlsx = () => {
        const formatArray = (ids, list, idKey, nameKey) => {
            if (!ids || ids.length === 0) return '';
            return ids.map((id) => {
                const item = list.find((entry) => entry[idKey] === id);
                return item ? item[nameKey] : id;
            }).join(', ');
        };
        const formatSiteArray = (ids) => {
            if (!ids || ids.length === 0) return '';
            return ids.map((id) => {
                const site = sitesList.find((entry) => entry.siteId === id);
                return site ? getSiteLabel(site) : id;
            }).join(', ');
        };

        const formatSingle = (id, list, idKey, nameKey) => {
            if (!id) return '';
            const item = list.find((entry) => entry[idKey] === id);
            return item ? item[nameKey] : id;
        };

        const applyHeaderStyle = (worksheet, headerCount) => {
            for (let col = 0; col < headerCount; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
                if (!worksheet[cellAddress]) continue;
                worksheet[cellAddress].s = { font: { bold: true } };
            }
        };

        const setColumnWidths = (worksheet, headers, rows) => {
            const widths = headers.map((header, idx) => {
                const maxCell = rows.reduce((max, row) => {
                    const cell = row[idx] ?? '';
                    return Math.max(max, cell.toString().length);
                }, header.length);
                return { wch: maxCell + 2 };
            });
            worksheet['!cols'] = widths;
        };

        const addSheet = (workbook, name, headers, rows) => {
            const data = [headers, ...rows];
            const sheet = XLSX.utils.aoa_to_sheet(data);
            applyHeaderStyle(sheet, headers.length);
            setColumnWidths(sheet, headers, rows);
            XLSX.utils.book_append_sheet(workbook, sheet, name);
        };

        const auditorsTimeValue = auditData.auditorsTime ?? auditData.auditorstime;

        const wb = XLSX.utils.book_new();

        // Schedule sheet (match Schedule export)
        const scheduleHeaders = [
            'Schedule ID', 'Title', 'Sector', 'Division', 'Program(s)', 'Site(s)',
            'Business Unit(s)', 'Operating Unit(s)', 'Audit Type',
            'Lead Auditor', 'Additional Auditors', 'Expected Start Date',
            'Expected Completion Date', 'Int/Ext Audit', 'Standard(s)',
            'Status', 'Function', 'Comment'
        ];
        const scheduleValues = [
            auditData.scheduleId || '',
            auditData.title || '',
            formatSingle(auditData.sectorId, sectorsList, 'sectorId', 'sectorName'),
            formatArray(auditData.divisionId, divisionsList, 'divisionId', 'divisionName'),
            formatArray(auditData.programIds, programsList, 'programId', 'programName'),
            formatSiteArray(auditData.siteIds),
            formatArray(auditData.businessUnitIds, businessUnitsList, 'businessUnitId', 'businessUnitName'),
            formatArray(auditData.operatingUnitIds, operatingUnitsList, 'operatingUnitId', 'operatingUnitName'),
            formatSingle(auditData.auditTypeId, auditTypesList, 'auditTypeId', 'auditTypeName'),
            formatSingle(auditData.leadAuditorId, auditorsList, 'auditorId', 'auditorName'),
            formatArray(auditData.additionalAuditorIds, auditorsList, 'auditorId', 'auditorName'),
            formatDate(auditData.expectedStartDate),
            formatDate(auditData.expectedCompletionDate),
            formatSingle(auditData.intExtId, intExtList, 'intExtId', 'intExtName'),
            formatArray(auditData.standardIds, standardsList, 'standardId', 'standardName'),
            formatSingle(auditData.statusId, statusesList, 'statusId', 'statusName'),
            formatArray(auditData.functionId, functionsList, 'functionId', 'functionName'),
            auditData.comment || ''
        ];
        addSheet(wb, 'Schedule', scheduleHeaders, [scheduleValues]);

        // Planning sheet
        const planningHeaders = [
            'Scope',
            'Functional Area Managers/Auditees',
            'Safety Equipment Required',
            'Required Equipment',
            'Clearance Required',
            'Training Requirements',
            'Special Considerations'
        ];
        const planningValues = [
            auditData.scope || '',
            auditData.famaIds ? getRosterNames(auditData.famaIds) : '',
            auditData.safety === 0 ? 'Yes' : auditData.safety === 1 ? 'No' : 'Unknown',
            auditData.safety === 0 ? getSafetyEquipmentNames(auditData.safetyEquipmentIds || []) : '',
            auditData.clearance === 0 ? 'Yes' : auditData.clearance === 1 ? 'No' : 'Unknown',
            getTrainingRequirementNames(auditData.trainingRequirementIds || []),
            auditData.specialConsiderations || ''
        ];
        addSheet(wb, 'Planning', planningHeaders, [planningValues]);

        // Results sheet (background info only)
        const resultsHeaders = [
            'Actual Start Date',
            'Interviewees',
            'Audit Overview',
            'Evaluator',
            'Program Manager',
            'MA Lead Manager',
            'Related Items',
            'Auditor\'s Time (Hours)',
            'Delay Cause'
        ];
        const resultsValues = [
            formatDate(auditData.startDate),
            auditData.intervieweeIds ? getRosterNames(auditData.intervieweeIds) : '',
            auditData.overview || '',
            auditData.evaluator || '',
            auditData.programManager || '',
            auditData.maLeadManager || '',
            auditData.relatedItems || '',
            auditorsTimeValue ?? '',
            auditData.delayCause != null ? getCauseName(auditData.delayCause) : ''
        ];
        addSheet(wb, 'Results', resultsHeaders, [resultsValues]);

        // PEQs sheet
        const peqHeaders = ['NC ID', 'Finding Type', 'Severity', 'Question', 'Auditee Response', 'Auditor Comment', 'PrOP - Corporate', 'PrOP - Sector', 'PrOP - Division', 'PrOP - Other', 'Details', 'Action Item Number'];
        const peqRows = nonconformances
            .filter((nc) => nc.type === 'PEQ')
            .map((nc) => [
                nc.ncId,
                getFindingTypeLabel(nc.findingType),
                getSeverityLabel(nc.severity),
                nc.question || '',
                nc.response || '',
                nc.auditorComment || '',
                getPropNames(nc.qma),
                getPropNames(nc.sector),
                getPropNames(nc.division),
                getPropNames(nc.other),
                nc.details || '',
                nc.AIN || ''
            ]);
        addSheet(wb, 'PEQs', peqHeaders, peqRows);

        // ETQs sheet
        const etqHeaders = ['NC ID', 'Finding Type', 'Severity', 'Question', 'Auditee Response', 'Auditor Comment', 'PrOP - Corporate', 'PrOP - Sector', 'PrOP - Division', 'PrOP - Other', 'Details', 'Action Item Number'];
        const etqRows = nonconformances
            .filter((nc) => nc.type === 'ETQ')
            .map((nc) => [
                nc.ncId,
                getFindingTypeLabel(nc.findingType),
                getSeverityLabel(nc.severity),
                nc.question || '',
                nc.response || '',
                nc.auditorComment || '',
                getPropNames(nc.qma),
                getPropNames(nc.sector),
                getPropNames(nc.division),
                getPropNames(nc.other),
                nc.details || '',
                nc.AIN || ''
            ]);
        addSheet(wb, 'ETQs', etqHeaders, etqRows);

        // Standard-based questions sheet
        const standardHeaders = ['NC ID', 'Standard', 'Section', 'Subclause', 'Finding Type', 'Severity', 'Question', 'Auditee Response', 'Auditor Comment', 'PrOP - Corporate', 'PrOP - Sector', 'PrOP - Division', 'PrOP - Other', 'Cause', 'Action Item Number'];
        const standardRows = nonconformances
            .filter((nc) => nc.type !== 'PEQ' && nc.type !== 'ETQ')
            .map((nc) => [
                nc.ncId,
                getStandardTypeLabel(nc.type),
                nc.section ?? '',
                nc.subsection ?? '',
                getFindingTypeLabel(nc.findingType),
                getSeverityLabel(nc.severity),
                nc.question || '',
                nc.response || '',
                nc.auditorComment || '',
                getPropNames(nc.qma),
                getPropNames(nc.sector),
                getPropNames(nc.division),
                getPropNames(nc.other),
                nc.details || '',
                nc.AIN || ''
            ]);
        addSheet(wb, 'Standard Questions', standardHeaders, standardRows);

        // CARs sheet
        const carHeaders = ['CAR', 'Reviewer', 'Effective'];
        const carRows = cars.map((car) => [
            car.car || '',
            car.reviewer ? getRosterName(car.reviewer) : '',
            getPreviousCarsEffectiveLabel(car.effective)
        ]);
        addSheet(wb, 'CARs', carHeaders, carRows);

        XLSX.writeFile(wb, `Audit ${auditData.scheduleId}.xlsx`);
    };

    const handleExportPdf = () => {
        if (!auditData) return;

        const additionalAuditorIds = Array.isArray(auditData.additionalAuditorIds)
            ? auditData.additionalAuditorIds
            : [];

        const additionalAuditorNames = additionalAuditorIds
            .map((id) => {
                const auditor = auditorsList.find((a) => a.auditorId === id);
                return auditor ? auditor.auditorName : id;
            })
            .filter(Boolean);

        const auditorNamesList = [
            getLeadAuditorName(auditData.leadAuditorId),
            ...additionalAuditorNames
        ].filter((name) => name && name !== '');

        const auditorsText = auditorNamesList.length
            ? auditorNamesList.map((name) => escapeHtml(name)).join('; ')
            : '<span class="muted">No response provided.</span>';

        const propDocs = getPropDocumentsList();
        const propDocsHtml = propDocs.length
            ? propDocs.map((doc) => escapeHtml(doc)).join('; ')
            : '<span class="muted">No response provided.</span>';

        const clauseEntries = getStandardClauses();
        const clauseHtml = clauseEntries.length
            ? clauseEntries.map((entry) => escapeHtml(entry)).join('<br>')
            : '<span class="muted">No response provided.</span>';

        const programsText = auditData.programIds && auditData.programIds.length > 0
            ? escapeHtml(getProgramNames(auditData.programIds))
            : '<span class="muted">No response provided.</span>';

        const expectedStartHtml = auditData.expectedStartDate
            ? escapeHtml(formatDate(auditData.expectedStartDate))
            : '<span class="muted">No response provided.</span>';

        const actualStartValue = auditData.startDate ?? auditData.startdate;
        const actualStartHtml = actualStartValue
            ? escapeHtml(formatDate(actualStartValue))
            : '<span class="muted">No response provided.</span>';
        const submittedHtml = auditData.submittedAt
            ? escapeHtml(formatDate(auditData.submittedAt))
            : '';
        const approvedHtml = auditData.approvedAt
            ? escapeHtml(formatDate(auditData.approvedAt))
            : '';
        const submissionRowHtml = (() => {
            if (!submittedHtml && !approvedHtml) return '';
            if (submittedHtml && approvedHtml) {
                return `
        <tr>
          <td><strong>Submitted Date:</strong> ${submittedHtml}</td>
          <td><strong>Approval Date:</strong> ${approvedHtml}</td>
        </tr>`;
            }
            if (submittedHtml) {
                return `
        <tr>
          <td colspan="2"><strong>Submitted Date:</strong> ${submittedHtml}</td>
        </tr>`;
            }
            return `
        <tr>
          <td colspan="2"><strong>Approval Date:</strong> ${approvedHtml}</td>
        </tr>`;
        })();

        const delayCauseHtml = auditData.delayCause != null
            ? escapeHtml(getCauseName(auditData.delayCause))
            : '';
        const delayCauseSuffix = auditData.delayCause != null
            ? ` (Delay cause: ${delayCauseHtml})`
            : ' (No delay cause provided.)';

        const carLines = getCarLines();
        const carLinesHtml = carLines.map((line) => `<p>${escapeHtml(line)}</p>`).join('');

        const counts = {
            total: nonconformances.length,
            nonconformities: nonconformances.filter((nc) => nc.findingType === 1).length,
            ofis: nonconformances.filter((nc) => nc.findingType === 3).length,
            observations: nonconformances.filter((nc) => nc.findingType === 4).length,
            conformities: nonconformances.filter((nc) => nc.findingType === 2).length
        };

        const summaryHtml = auditData.overview
            ? escapeHtml(auditData.overview)
            : '<span class="muted">No response provided.</span>';

        const preparedByRoster = currentUser?.myId ? rosterLookup.get(String(currentUser.myId)) : null;
        const preparedByName = preparedByRoster
            ? formatRosterLabel(preparedByRoster)
            : formatRosterLabel(currentUser?.name || 'Unknown Auditor', currentUser?.myId);
        const preparedOnValue = formatDate(new Date().toISOString()) || new Date().toLocaleDateString();

        const approvalEntries = getApprovalEntries();
        const leadMyId = getLeadAuditorMyId();
        const approverRoleMap = new Map();
        if (leadMyId) approverRoleMap.set(leadMyId, 'Lead Auditor');
        if (auditData.approver) approverRoleMap.set(auditData.approver, 'Approver');
        additionalApproverIds.forEach((id) => approverRoleMap.set(id, 'Additional Approver'));
        const approvalCards = approvalEntries.map((entry) => {
            const name = getRosterName(entry.approvermyid) || 'Unnamed Approver';
            const statusLabel = entry.approvedat ? 'Approved' : 'Pending';
            const role = approverRoleMap.get(entry.approvermyid) || 'Approver';
            const statusClass = entry.approvedat ? 'status-approved' : 'status-pending';
            const approvedOn = entry.approvedat ? formatDate(entry.approvedat) : 'Pending';
            return `
                <div class="approver-row">
                    <div class="approver-cell role-cell">
                        <div class="approver-cell-label">Role</div>
                        <span>${escapeHtml(role)}</span>
                    </div>
                    <div class="approver-cell name-cell">
                        <div class="approver-cell-label">Approver</div>
                        <span>${escapeHtml(name)}</span>
                    </div>
                    <div class="approver-cell status-cell">
                        <div class="approver-cell-label">Status</div>
                        <span class="approver-status ${statusClass}">${statusLabel}</span>
                    </div>
                    <div class="approver-cell date-cell">
                        <div class="approver-cell-label">Approved On</div>
                        <span>${entry.approvedat ? escapeHtml(approvedOn) : '<span class="muted">Pending approval</span>'}</span>
                    </div>
                </div>
            `;
        }).join('');
        const approvalsHtml = approvalEntries.length
            ? `<div class="approver-rows">${approvalCards}</div>`
            : '<p class="muted">No approvers assigned.</p>';

        const peqNcs = nonconformances.filter((nc) => nc.type === 'PEQ' && nc.findingType === 1);
        const etqNcs = nonconformances.filter((nc) => nc.type === 'ETQ' && nc.findingType === 1);
        const standardNcs = nonconformances.filter(
            (nc) => nc.type !== 'PEQ' && nc.type !== 'ETQ' && nc.findingType === 1
        );

        const renderNcEntry = (nc) => {
            const clauseLabel = nc.section
                ? `Clause ${nc.section}${nc.subsection ? `.${nc.subsection}` : ''}`
                : '';
            const severityHtml = (nc.severity !== null && nc.severity !== undefined && nc.severity !== '')
                ? escapeHtml(getSeverityLabel(nc.severity))
                : '';
            const questionHtml = nc.question ? escapeHtml(nc.question) : '<span class="muted">No response provided.</span>';
            const responseHtml = nc.response ? escapeHtml(nc.response) : '<span class="muted">No response provided.</span>';
            const auditorCommentHtml = nc.auditorComment
                ? escapeHtml(nc.auditorComment)
                : '<span class="muted">No response provided.</span>';
            const findingPropSummary = getFindingPropSummary(nc);
            const propRowsHtml = `
                <div class="nc-field"><strong>PrOPs:</strong> ${findingPropSummary ? escapeHtml(findingPropSummary) : '<span class="muted">No response provided.</span>'}</div>
            `;
            const hasNcDetailContent = Boolean(nc.details || nc.AIN);
            const detailsHtml = nc.details
                ? escapeHtml(nc.details)
                : (showNcDetailFallbacks ? '<span class="muted">No response provided.</span>' : '');
            const ainHtml = nc.AIN
                ? escapeHtml(nc.AIN)
                : (showNcDetailFallbacks ? '<span class="muted">No response provided.</span>' : '');
            return `
                <div class="nc-card">
                    <div class="nc-card-header">
                        <span class="nc-id">NC-${nc.ncId}</span>
                        ${clauseLabel ? `<span class="nc-clause">${escapeHtml(clauseLabel)}</span>` : ''}
                    </div>
                    ${severityHtml ? `<div class="nc-field"><strong>Severity:</strong> ${severityHtml}</div>` : ''}
                    <div class="nc-field"><strong>Question:</strong> ${questionHtml}</div>
                    <div class="nc-field"><strong>Auditee Response:</strong> ${responseHtml}</div>
                    <div class="nc-field"><strong>Auditor Comment:</strong> ${auditorCommentHtml}</div>
                    ${propRowsHtml}
                    ${(showNcDetailFallbacks || hasNcDetailContent) ? `
                    <div class="nc-field"><strong>Details:</strong> ${detailsHtml}</div>
                    <div class="nc-field"><strong>Action Item Number:</strong> ${ainHtml}</div>
                    ` : ''}
                </div>
            `;
        };

        const renderNcSection = (heading, entries) => {
            if (entries.length === 0) {
                return `
                    <div class="nc-section">
                        <h3>${escapeHtml(heading)}</h3>
                        <p class="muted">No nonconformities recorded.</p>
                    </div>
                `;
            }
            return `
                <div class="nc-section">
                    <h3>${escapeHtml(heading)}</h3>
                    ${entries.map((nc) => renderNcEntry(nc)).join('')}
                </div>
            `;
        };

        const renderStandardNcGroups = (entries) => {
            if (entries.length === 0) {
                return '<p class="muted">No nonconformities recorded.</p>';
            }

            const order = { 1: 1, 3: 2, 4: 3, 2: 4 };
            const sorted = entries.slice().sort((a, b) => {
                const labelA = getStandardTypeLabel(a.type);
                const labelB = getStandardTypeLabel(b.type);
                if (labelA !== labelB) {
                    return (labelA || '').localeCompare(labelB || '');
                }
                const sectionA = Number(a.section ?? 0);
                const sectionB = Number(b.section ?? 0);
                if (sectionA !== sectionB) return sectionA - sectionB;
                const subA = Number(a.subsection ?? 0);
                const subB = Number(b.subsection ?? 0);
                if (subA !== subB) return subA - subB;
                return (order[a.findingType] || 999) - (order[b.findingType] || 999);
            });

            const grouped = new Map();
            sorted.forEach((nc) => {
                const label = getStandardTypeLabel(nc.type) || 'Standard';
                if (!grouped.has(label)) {
                    grouped.set(label, []);
                }
                grouped.get(label).push(nc);
            });

            return Array.from(grouped.entries())
                .map(([label, items]) => `
                    <div class="nc-standard-group">
                        <div class="nc-standard-label">${escapeHtml(label)}</div>
                        ${items.map((nc) => renderNcEntry(nc)).join('')}
                    </div>
                `)
                .join('');
        };

        const standardSectionHtml = `
            <div class="nc-section">
                <h3>Standard-Based Questions</h3>
                ${renderStandardNcGroups(standardNcs)}
            </div>
        `;

        const ncSectionsHtml = [
            renderNcSection('Process Evaluation Questions (PEQs)', peqNcs),
            renderNcSection('Every Time Questions (ETQs)', etqNcs),
            standardSectionHtml
        ].join('');

        const html = `
<!DOCTYPE html>
<html>
<head>
<title>Internal Audit Report ${escapeHtml(auditData.scheduleId)}</title>
<style>
  body { font-family: "Times New Roman", serif; margin: 0; padding: 0; }
  .pdf-page { page-break-after: always; }
  .pdf-page:last-child { page-break-after: auto; }
  .report-container { width: 800px; margin: 0 auto; padding: 20px; box-sizing: border-box; }
  .report-header h1, .report-header h2 { text-align: center; margin: 0 0 12px; }
  .info-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  .info-table td { border: 1px solid #000; padding: 8px; vertical-align: top; font-size: 14px; }
  .info-table td strong { font-weight: 700; }
  .section-box { border: 1px solid #000; padding: 12px; margin-bottom: 12px; font-size: 13px; }
  .section-box, .nc-card, .counts-card, .approver-row, .nc-section, .nc-standard-group { page-break-inside: avoid; break-inside: avoid; }
  .section-box strong { display: block; font-size: 14px; margin-bottom: 6px; }
  .counts-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(140px,1fr)); gap: 10px; margin-bottom: 12px; }
  .counts-card { border: 1px solid #000; padding: 8px; text-align: center; }
  .counts-number { font-size: 20px; font-weight: 700; }
  .counts-label { font-size: 12px; }
  .prepared-row { display: flex; gap: 20px; margin-bottom: 12px; flex-wrap: wrap; }
  .prepared-row .prep-column { flex: 1 1 200px; }
  .prepared-row .prep-column strong { display: block; margin-bottom: 4px; }
  .approver-rows { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
  .approver-row { border: 1px solid #000; padding: 8px; display: grid; grid-template-columns: 120px 1fr 110px 120px; gap: 12px; align-items: center; font-size: 13px; }
  .approver-cell-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
  .approver-status { padding: 4px 6px; border-radius: 3px; font-size: 12px; font-weight: 700; display: inline-block; }
  .status-approved { background: #0f9d58; color: #fff; }
  .status-pending { background: #f9a825; color: #000; }
  .nc-section { margin-bottom: 10px; }
  .nc-section h3 { margin: 0 0 6px; font-size: 16px; }
  .nc-standard-label { font-size: 13px; font-weight: 600; margin: 8px 0 4px; }
  .nc-card { border: 1px solid #000; padding: 10px; margin-bottom: 8px; font-size: 13px; }
  .nc-card-header { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
  .nc-id { font-weight: 700; }
  .nc-field { margin-bottom: 4px; }
  .muted { color: #6b7280; font-style: italic; }
</style>
</head>
<body>
  <div class="pdf-page">
    <div class="report-container">
      <div class="report-header">
        <h1>Internal Audit Report</h1>
      </div>
      <table class="info-table">
        <tr>
          <td><strong>Schedule ID:</strong> ${escapeHtml(auditData.scheduleId)}</td>
          <td><strong>Title:</strong> ${escapeHtml(auditData.title)}</td>
        </tr>
        <tr>
          <td><strong>Lead:</strong> ${escapeHtml(getLeadAuditorName(auditData.leadAuditorId))}</td>
          <td><strong>Audit Type:</strong> ${escapeHtml(getAuditTypeName(auditData.auditTypeId))}</td>
        </tr>
        <tr>
          <td colspan="2"><strong>Auditor(s):</strong> ${auditorsText}</td>
        </tr>
        <tr>
          <td colspan="2"><strong>Scope:</strong> ${auditData.scope ? escapeHtml(auditData.scope) : '<span class="muted">No response provided.</span>'}</td>
        </tr>
        <tr>
          <td colspan="2"><strong>Program(s):</strong> ${programsText}</td>
        </tr>
        <tr>
          <td><strong>Audit Start Date:</strong> ${expectedStartHtml}</td>
          <td><strong>Actual Start Date:</strong> ${actualStartHtml}${delayCauseSuffix}</td>
        </tr>
        ${submissionRowHtml}
      </table>

      <div class="section-box">
        <strong>Functional Area Managers/Auditees:</strong>
        <p>${auditData.famaIds && auditData.famaIds.length > 0 ? escapeHtml(getRosterNames(auditData.famaIds)) : '<span class="muted">No response provided.</span>'}</p>
      </div>

      <div class="section-box">
        <strong>Locations/Areas visited during the audit:</strong>
        <p>${getLocationsText()}</p>
      </div>

      <div class="section-box">
        <strong>PrOP criteria/documents reviewed during audit (including revision):</strong>
        <p>${propDocsHtml}</p>
      </div>

      <div class="section-box">
        <strong>${escapeHtml(getStandardNames(auditData.standardIds) || 'Standards not listed')} criteria/requirements reviewed:</strong>
        <p>${clauseHtml}</p>
      </div>

      <div class="section-box">
        <strong>CARs Reviewed:</strong>
        ${carLinesHtml}
      </div>
    </div>
  </div>

  <div class="pdf-page">
    <div class="report-container">
      <div class="report-header">
        <h2>Audit Results</h2>
      </div>
      <div class="section-box">
        <strong>Overall Observations</strong>
        <p>${summaryHtml}</p>
      </div>
      <div class="counts-grid">
        <div class="counts-card">
          <div class="counts-number">${counts.total}</div>
          <div class="counts-label">Total Findings</div>
        </div>
        <div class="counts-card">
          <div class="counts-number">${counts.nonconformities}</div>
          <div class="counts-label">Nonconformities</div>
        </div>
        <div class="counts-card">
          <div class="counts-number">${counts.ofis}</div>
          <div class="counts-label">OFIs</div>
        </div>
        <div class="counts-card">
          <div class="counts-number">${counts.observations}</div>
          <div class="counts-label">Observations</div>
        </div>
        <div class="counts-card">
          <div class="counts-number">${counts.conformities}</div>
          <div class="counts-label">Conformities</div>
        </div>
      </div>
      ${ncSectionsHtml}
      <div class="section-box">
        <strong>Approvers</strong>
        ${approvalsHtml}
      </div>
      <div class="section-box prepared-row">
        <div class="prep-column">
          <strong>Report Prepared By</strong>
          <p>${escapeHtml(preparedByName)}</p>
        </div>
        <div class="prep-column">
          <strong>Report Prepared On</strong>
          <p>${escapeHtml(preparedOnValue)}</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

        const printIframe = document.createElement('iframe');
        printIframe.style.position = 'fixed';
        printIframe.style.right = '0';
        printIframe.style.bottom = '0';
        printIframe.style.width = '0';
        printIframe.style.height = '0';
        printIframe.style.border = '0';
        printIframe.setAttribute('aria-hidden', 'true');
        printIframe.srcdoc = html;
        document.body.appendChild(printIframe);
        printIframe.onload = () => {
            const printWindow = printIframe.contentWindow;
            printWindow.focus();
            printWindow.print();
            setTimeout(() => {
                document.body.removeChild(printIframe);
            }, 500);
        };
    };

    const handleNudgeApprovers = async () => {
        if (!auditData?.scheduleId || nudgingApprovers) {
            return;
        }

        setNudgingApprovers(true);
        try {
            const response = await fetch(buildApiUrl(`approvals/${auditData.scheduleId}/remind`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const result = await response.json();
            if (!response.ok || result.success === false) {
                throw new Error(result.error || 'Failed to send approval reminders.');
            }

            if (result.sentCount > 0) {
                toast.success(result.message || `Sent ${result.sentCount} approval reminder email${result.sentCount === 1 ? '' : 's'}.`);
            } else {
                toast.info(result.message || 'No reminder emails were sent.');
            }

            if (result.emailWarning) {
                toast.error(result.emailWarning);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to send approval reminders.');
        } finally {
            setNudgingApprovers(false);
        }
    };

    const handleDownloadObjectiveEvidence = () => {
        if (!auditData?.scheduleId) {
            toast.error('No audit selected.');
            return;
        }
        const downloadUrl = buildApiUrl(`audits/${auditData.scheduleId}/objective-evidence.zip`);
        window.location.href = downloadUrl;
    };

    const stageLabel = getStageLabel(stageValue, isLocked, isApproved);
    const stageBadgeText = (stageLabel === 'Approved' || stageLabel === 'Historical')
        ? stageLabel
        : `Next step: ${stageLabel}`;

    return (
        <div className="audit-page">
            <div className="audit-container">
                {/* Audit Selector */}
                <div className="audit-selector">
                    <label htmlFor="audit-select">Select Audit:</label>
                    <select
                        id="audit-select"
                        value={auditData.scheduleId}
                        onChange={handleAuditChange}
                        className="audit-select-dropdown"
                    >
                        {audits.map((audit) => (
                            <option key={audit.scheduleId} value={audit.scheduleId}>
                                {audit.scheduleId} - {audit.title}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Header Section */}
                <div className="audit-header">
                    <div className="audit-id">Schedule ID: {auditData.scheduleId}</div>
                    <h1 className="audit-title">{auditData.title}</h1>
                    <div
                        style={(stageLabel === 'Approved'
                            ? { backgroundColor: 'green', color: 'white' }
                            : stageLabel === 'Historical'
                                ? { backgroundColor: '#9ca3af', color: '#ffffff' }
                                : {})}
                        className="audit-status-badge"
                    >
                        {stageBadgeText}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="action-buttons">
                    {/* Always show Export XLSX */}
                    <button className="action-btn export-xlsx" onClick={handleExportXlsx}>Export XLSX</button>

                    {/* Stage-specific buttons */}
                    {!isLocked && stageValue === 1 && (
                        <>
                            <button
                                className="action-btn"
                                onClick={() => navigate(`/entry?type=schedule&audit=${auditData.scheduleId}`)}
                            >
                                Edit Schedule
                            </button>
                            <button
                                className="action-btn"
                                onClick={() => navigate(`/entry?type=planning&audit=${auditData.scheduleId}`)}
                            >
                                Edit Planning
                            </button>
                        </>
                    )}

                    {!isLocked && stageValue === 2 && (
                        <>
                            <button
                                className="action-btn"
                                onClick={() => navigate(`/entry?type=schedule&audit=${auditData.scheduleId}`)}
                            >
                                Edit Schedule
                            </button>
                            <button
                                className="action-btn"
                                onClick={() => navigate(`/entry?type=planning&audit=${auditData.scheduleId}`)}
                            >
                                Edit Planning
                            </button>
                            <button
                                className="action-btn"
                                onClick={() => navigate(`/entry?type=results&audit=${auditData.scheduleId}`)}
                            >
                                Conduct Audit
                            </button>
                        </>
                    )}

                    {!isLocked && (stageValue === 3 || stageValue === 4) && (
                        <>
                            <button
                                className="action-btn"
                                onClick={() => navigate(`/entry?type=schedule&audit=${auditData.scheduleId}`)}
                            >
                                Edit Schedule
                            </button>
                            <button
                                className="action-btn"
                                onClick={() => navigate(`/entry?type=planning&audit=${auditData.scheduleId}`)}
                            >
                                Edit Planning
                            </button>
                            <button
                                className="action-btn"
                                onClick={() => navigate(`/entry?type=results&audit=${auditData.scheduleId}`)}
                            >
                                Conduct Audit
                            </button>
                            <button
                                className="action-btn"
                                onClick={() => navigate(`/entry?type=nonconformities&audit=${auditData.scheduleId}`)}
                            >
                                Enter Nonconformities
                            </button>
                        </>
                    )}

                    {isLocked && canApprove && (
                        <a
                            className="action-btn"
                            href={`/approve/${auditData.scheduleId}`}
                            style={{ textDecoration: 'none', textAlign: 'center', fontSize: '18px', color: 'white' }}
                        >
                            Approve Audit
                        </a>
                    )}

                    {canNudgeApprovers && (
                        <button
                            className="action-btn"
                            onClick={handleNudgeApprovers}
                            disabled={nudgingApprovers}
                            style={{ backgroundColor: '#d97706' }}
                        >
                            {nudgingApprovers ? 'Sending Reminder...' : 'Nudge Approvers'}
                        </button>
                    )}

                    {isLocked && (
                        <button className="action-btn export-pdf" onClick={handleExportPdf}>Export PDF</button>
                    )}
                </div>

                {(isLocked || isApproved) && (
                    <div className="audit-section">
                        <h2 className="section-title">Approval Status</h2>
                        {getApprovalEntries().length === 0 ? (
                            <p>No approvers assigned.</p>
                        ) : (
                            <div className="approval-grid">
                                {getApprovalEntries().map((approval) => {
                                    const approverName = getRosterName(approval.approvermyid);
                                    const approvedLabel = approval.approvedat ? 'Approved' : 'Pending';
                                    return (
                                        <div className="approval-card" key={approval.approvalid}>
                                            <span className="approval-name">{approverName}</span>
                                            <span className={`finding-type ${approval.approvedat ? 'approved' : 'pending'}`}>
                                                {approvedLabel}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Two Column Layout for Basic Info */}
                <div className="audit-section-row">
                    <div className="audit-section">
                        <h2 className="section-title">Audit Information</h2>
                        <div className="info-grid-two">
                            {getAuditTypeName(auditData.auditTypeId) && (
                                <div className="info-item">
                                    <label>Audit Type:</label>
                                    <span>{getAuditTypeName(auditData.auditTypeId)}</span>
                                </div>
                            )}
                            {getStatusName(auditData.statusId) && (
                                <div className="info-item">
                                    <label>Status:</label>
                                    <span>{getStatusName(auditData.statusId)}</span>
                                </div>
                            )}
                            {getFunctionName(auditData.functionId) && (
                                <div className="info-item">
                                    <label>Function:</label>
                                    <span>{getFunctionName(auditData.functionId)}</span>
                                </div>
                            )}
                            {getIntExtName(auditData.intExtId) && (
                                <div className="info-item">
                                    <label>Internal/External:</label>
                                    <span>{getIntExtName(auditData.intExtId)}</span>
                                </div>
                            )}
                            {getStandardNames(auditData.standardIds || []) && (
                                <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                                    <label>Standards:</label>
                                    <span>{getStandardNames(auditData.standardIds || [])}</span>
                                </div>
                            )}
                            {auditData.comment && (
                                <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                                    <label>Comment:</label>
                                    <span>{auditData.comment}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="audit-section">
                        <h2 className="section-title">Schedule & Dates</h2>
                        <div className="info-grid-two">
                            <div className="info-item">
                                <label>Created At:</label>
                                <span>{formatDate(auditData.createdAt)}</span>
                            </div>
                            <div className="info-item">
                                <label>Expected Start Date:</label>
                                <span>{formatDate(auditData.expectedStartDate)}</span>
                            </div>
                            <div className="info-item">
                                <label>Expected Completion Date:</label>
                                <span>{formatDate(auditData.expectedCompletionDate)}</span>
                            </div>
                            {auditData.stage > 2 && (<div className="info-item">
                                <label>Actual Start Date:</label>
                                <span>{formatDate(auditData.startDate)}</span>
                            </div>)}
                            {auditData.submittedAt && (
                                <div className="info-item">
                                    <label>Submitted Date:</label>
                                    <span>{formatDate(auditData.submittedAt)}</span>
                                </div>
                            )}
                            {auditData.approvedAt && (
                                <div className="info-item">
                                    <label>Approval Date:</label>
                                    <span>{formatDate(auditData.approvedAt)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Organization Section */}
                <div className="audit-section">
                    <h2 className="section-title">Organization</h2>
                    <div className="info-grid-three">
                        <div className="info-item">
                            <label>Sector:</label>
                            <span>{getSectorName(auditData.sectorId)}</span>
                        </div>
                        <div className="info-item">
                            <label>Division:</label>
                            <span>{getDivisionName(auditData.divisionId)}</span>
                        </div>
                        <div className="info-item">
                            <label>Site:</label>
                            <span>{auditData.siteIds.map(siteId => getSiteName(siteId)).join(', ')}</span>
                        </div>
                        <div className="info-item">
                            <label>Business Unit:</label>
                            <span>
                                {getBusinessUnitNames(auditData.businessUnitIds)
                                    || <span className="no-response">No response provided</span>}
                            </span>
                        </div>
                        <div className="info-item">
                            <label>Operating Unit:</label>
                            <span>
                                {getOperatingUnitNames(auditData.operatingUnitIds)
                                    || <span className="no-response">No response provided</span>}
                            </span>
                        </div>
                        <div className="info-item">
                            <label>Programs:</label>
                            <span>
                                {getProgramNames(auditData.programIds)
                                    || <span className="no-response">No response provided</span>}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Auditors Section */}
                <div className="audit-section">
                    <h2 className="section-title">Audit Team</h2>
                    <div className="info-item">
                        <label>Lead Auditor:</label>
                        <span className="lead-auditor">{getLeadAuditorName(auditData.leadAuditorId)}</span>
                    </div>
                    {additionalAuditorNamesForPage && (
                        <div style={{ marginTop: '1rem' }} className="info-item">
                            <label>Additional Auditors:</label>
                            <span>{additionalAuditorNamesForPage}</span>
                        </div>
                    )}
                </div>

                {/* Planning Details */}
                {auditRiskGroups.length > 0 && (
                    <div className="audit-section">
                        <h2 className="section-title">Risk Factors</h2>
                        <div className="risk-factors">
                            {auditRiskGroups.map((group) => (
                                <div key={group.key} className="risk-factor-group">
                                    <h3>{group.processArea}</h3>
                                    <p className="risk-factor-source">
                                        Source Org Group: {group.orgGroupLabel} - {group.orgTargetLabel || 'Unknown'} ({group.year})
                                    </p>
                                    {group.factorGroups.map((factorGroup) => (
                                        <div key={factorGroup.factorName} className="risk-factor-cluster">
                                            <h4>{factorGroup.factorName}</h4>
                                            <div className="risk-subcategories">
                                                {factorGroup.items.map((item) => (
                                                    <div key={`${group.key}-${factorGroup.factorName}-${item.subcategoryName}`} className="risk-subcategory">
                                                        <span className="risk-subcategory-name">{item.subcategoryName}</span>
                                                        <span className={`risk-rating risk-rating-${item.rating}`}>
                                                            {getRiskToneLabel(item.rating)} Risk
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {auditData.stage > 1 && (
                    <div className="audit-section">
                        <h2 className="section-title">Planning Details</h2>
                        <div className="planning-content">
                            <div className="planning-item">
                                <h3>Scope</h3>
                                <p>{auditData.scope || <span className="no-response">No response provided</span>}</p>
                            </div>

                            <div className="planning-item">
                                <h3>Functional Area Managers/Auditees</h3>
                                <p>{auditData.famaIds && auditData.famaIds.length > 0 ? getRosterNames(auditData.famaIds) : <span className="no-response">No response provided</span>}</p>
                            </div>

                            <div className="planning-item">
                                <h3>Safety Equipment Required</h3>
                                <p>{auditData.safety === 0 ? auditData.safetyEquipmentIds && auditData.safetyEquipmentIds.length > 0 ? getSafetyEquipmentNames(auditData.safetyEquipmentIds) : <span className="no-response">No response provided</span> : (auditData.safety === 1 ? 'No' : (auditData.safety === 2 ? 'Unknown' : 'No response provided'))}</p>
                            </div>

                            <div className="planning-item">
                                <h3>Clearance Required</h3>
                                <p>{auditData.clearance === 0 ? 'Yes' : auditData.clearance === 1 ? 'No' : (auditData.clearance === 2 ? 'Unknown' : 'No response provided')}</p>
                            </div>

                            <div className="planning-item">
                                <h3>Training Requirements</h3>
                                <p>{auditData.trainingRequirementIds && auditData.trainingRequirementIds.length > 0 ? getTrainingRequirementNames(auditData.trainingRequirementIds) : <span className="no-response">No response provided</span>}</p>
                            </div>

                            <div className="planning-item">
                                <h3>Special Considerations</h3>
                                <p>{auditData.specialConsiderations || <span className="no-response">No response provided</span>}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Results/Conduct Information */}
                {auditData.stage > 2 && (
                    <div className="audit-section">
                        <h2 className="section-title">Conduct Audit Details</h2>
                        <div className="planning-item">
                            <h3>Audit Overview</h3>
                            <p>{auditData.overview || <span className="no-response">No response provided</span>}</p>
                        </div>
                        <div className="planning-content">
                            <div className="planning-item">
                                <h3>Interviewees</h3>
                                <p>{auditData.intervieweeIds && auditData.intervieweeIds.length > 0 ? getRosterNames(auditData.intervieweeIds) : <span className="no-response">No response provided</span>}</p>
                            </div>

                            <div className="planning-item">
                                <h3>Evaluator</h3>
                                <p>{auditData.evaluator || <span className="no-response">No response provided</span>}</p>
                            </div>

                            <div className="planning-item">
                                <h3>Program Manager</h3>
                                <p>{auditData.programManager || <span className="no-response">No response provided</span>}</p>
                            </div>

                            <div className="planning-item">
                                <h3>MA Lead Manager</h3>
                                <p>{auditData.maLeadManager || <span className="no-response">No response provided</span>}</p>
                            </div>

                            <div className="planning-item">
                                <h3>Related Items</h3>
                                <p>{auditData.relatedItems || <span className="no-response">No response provided</span>}</p>
                            </div>

                            <div className="planning-item">
                                <h3>Auditor's Time (Hours)</h3>
                                <p>{auditData.auditorsTime != null || auditData.auditorstime != null ? (auditData.auditorsTime ?? auditData.auditorstime) : <span className="no-response">No response provided</span>}</p>
                            </div>

                            <div className="planning-item">
                                <h3>Delay Cause</h3>
                                <p>{auditData.delayCause != null ? getCauseName(auditData.delayCause) : <span className="no-response">No response provided</span>}</p>
                            </div>
                        </div>
                    </div>

                )}

                {/* CARs Section */}
                {cars.length > 0 && (
                    <div className="audit-section">
                        <h2 className="section-title">Corrective Action Requests (CARs)</h2>
                        <div className="risk-factors">
                            <div className="risk-factor-group">
                                <h3>Associated CARs</h3>
                                <div className="risk-subcategories">
                                    {cars.map((car, index) => (
                                        <div key={car.carid || index} className="risk-subcategory">
                                            <span className="risk-subcategory-name">{car.car || `CAR ${index + 1}`}</span>
                                            <span className="risk-rating">
                                                Reviewer: {getCarReviewerLabel(car)} | Effective: {getPreviousCarsEffectiveLabel(car.effective)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Results Summary */}
                {nonconformances.length > 0 && (
                    <div className="audit-section summary-section">
                        <h2 className="section-title">Findings Summary</h2>
                        <div className="summary-grid">
                            <div className="summary-card">
                                <div className="summary-number">{nonconformances.length}</div>
                                <div className="summary-label">Total Findings</div>
                            </div>
                            <div className="summary-card major-nc">
                                <div className="summary-number">{nonconformances.filter(nc => nc.findingType === 1).length}</div>
                                <div className="summary-label">Nonconformities</div>
                            </div>
                            <div className="summary-card partial">
                                <div className="summary-number">{nonconformances.filter(nc => nc.findingType === 3).length}</div>
                                <div className="summary-label">OFIs</div>
                            </div>
                            <div className="summary-card observation">
                                <div className="summary-number">{nonconformances.filter(nc => nc.findingType === 4).length}</div>
                                <div className="summary-label">Observations</div>
                            </div>
                            <div className="summary-card compliant">
                                <div className="summary-number">{nonconformances.filter(nc => nc.findingType === 2).length}</div>
                                <div className="summary-label">Conformities</div>
                            </div>
                        </div>
                    </div>
                )}

                {hasObjectiveEvidence && (
                    <button
                        type="button"
                        onClick={handleDownloadObjectiveEvidence}
                        style={{
                            width: '100%',
                            backgroundColor: '#1976d2',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px 16px',
                            fontSize: '16px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            marginBottom: '36px'
                        }}
                    >
                        Download Objective Evidence (ZIP)
                    </button>
                )}

                {/* Process Evaluation Questions (PEQs) */}
                {nonconformances.filter(nc => nc.type === 'PEQ').length > 0 && (
                    <div className="audit-section">
                        <h2 className="section-title">Process Evaluation Questions (PEQs)</h2>
                        {nonconformances
                            .filter(nc => nc.type === 'PEQ')
                            .sort((a, b) => {
                                // Sort by finding type: NC(1) -> OFI(3) -> OBS(4) -> Conformity(2)
                                const order = { 1: 1, 3: 2, 4: 3, 2: 4 };
                                return (order[a.findingType] || 999) - (order[b.findingType] || 999);
                            })
                            .map((finding, index) => {
                                const chipMeta = getFindingChipMeta(finding.findingType);
                                return (
                                <div key={index} className={`finding-card${chipMeta ? ` ${chipMeta.className}` : ''}`}>
                                    <div className="finding-header">
                                        <div className="finding-id-type">
                                            {chipMeta && (
                                                <span className="finding-type">{chipMeta.label}</span>
                                            )}
                                            {finding.findingType === 1 && (
                                                <>
                                                    <span className="finding-id">NCID: {finding.ncId}</span>
                                                    {finding.severity && (
                                                        <span className={`finding-type ${getSeverityLabel(finding.severity).toLowerCase()}`}>
                                                            Severity: {getSeverityLabel(finding.severity)}
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="finding-item">
                                        <strong>Question:</strong>
                                        <p>{finding.question || <span className="no-response">No response provided</span>}</p>
                                    </div>

                                    <div className="finding-item">
                                        <strong>Auditee Response:</strong>
                                        <p>{finding.response || <span className="no-response">No response provided</span>}</p>
                                    </div>

                                    <div className="finding-item">
                                        <strong>Auditor Comment:</strong>
                                        <p>{finding.auditorComment || <span className="no-response">No response provided</span>}</p>
                                    </div>

                                    <div className="finding-item">
                                        <strong>PrOPs:</strong>
                                        <p>{getFindingPropSummary(finding) || <span className="no-response">No response provided</span>}</p>
                                    </div>

                                    {finding.findingType === 1 && (
                                        <>
                                            {(showNcDetailFallbacks || finding.details || finding.AIN) && (
                                                <>
                                                    <div className="finding-item">
                                                        <strong>Details:</strong>
                                                        <p>
                                                            {finding.details
                                                                || (showNcDetailFallbacks ? <span className="no-response">No response provided</span> : null)}
                                                        </p>
                                                    </div>

                                                    <div className="finding-item">
                                                        <strong>Action Item Number:</strong>
                                                        <p>
                                                            {finding.AIN
                                                                || (showNcDetailFallbacks ? <span className="no-response">No response provided</span> : null)}
                                                        </p>
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            )})}
                    </div>
                )}

                {/* Every Time Questions (ETQs) */}
                {nonconformances.filter(nc => nc.type === 'ETQ').length > 0 && (
                    <div className="audit-section">
                        <h2 className="section-title">Every Time Questions (ETQs)</h2>
                        {nonconformances
                            .filter(nc => nc.type === 'ETQ')
                            .sort((a, b) => {
                                // Sort by finding type: NC(1) -> OFI(3) -> OBS(4) -> Conformity(2)
                                const order = { 1: 1, 3: 2, 4: 3, 2: 4 };
                                return (order[a.findingType] || 999) - (order[b.findingType] || 999);
                            })
                            .map((finding, index) => {
                                const chipMeta = getFindingChipMeta(finding.findingType);
                                return (
                                <div key={index} className={`finding-card${chipMeta ? ` ${chipMeta.className}` : ''}`}>
                                    <div className="finding-header">
                                        <div className="finding-id-type">
                                            {chipMeta && (
                                                <span className="finding-type">{chipMeta.label}</span>
                                            )}
                                            {finding.findingType === 1 && (
                                                <>
                                                    <span className="finding-id">NCID: {finding.ncId}</span>
                                                    {finding.severity && (
                                                        <span className={`finding-type ${getSeverityLabel(finding.severity).toLowerCase()}`}>
                                                            Severity: {getSeverityLabel(finding.severity)}
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="finding-item">
                                        <strong>Question:</strong>
                                        <p>{finding.question || <span className="no-response">No response provided</span>}</p>
                                    </div>

                                    <div className="finding-item">
                                        <strong>Auditee Response:</strong>
                                        <p>{finding.response || <span className="no-response">No response provided</span>}</p>
                                    </div>

                                    <div className="finding-item">
                                        <strong>Auditor Comment:</strong>
                                        <p>{finding.auditorComment || <span className="no-response">No response provided</span>}</p>
                                    </div>

                                    <div className="finding-item">
                                        <strong>PrOPs:</strong>
                                        <p>{getFindingPropSummary(finding) || <span className="no-response">No response provided</span>}</p>
                                    </div>

                                    {finding.findingType === 1 && (
                                        <>
                                            {(showNcDetailFallbacks || finding.details || finding.AIN) && (
                                                <>
                                                    <div className="finding-item">
                                                        <strong>Details:</strong>
                                                        <p>
                                                            {finding.details
                                                                || (showNcDetailFallbacks ? <span className="no-response">No response provided</span> : null)}
                                                        </p>
                                                    </div>

                                                    <div className="finding-item">
                                                        <strong>Action Item Number:</strong>
                                                        <p>
                                                            {finding.AIN
                                                                || (showNcDetailFallbacks ? <span className="no-response">No response provided</span> : null)}
                                                        </p>
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            )})}
                    </div>
                )}

                {/* Standard-Based Questions */}
                {standardFindingsSorted.length > 0 && (
                    <div className="audit-section">
                        <h2 className="section-title">Standard-Based Questions</h2>
                        {standardFindingsSorted.map((finding, index) => {
                            const standardLabel = getStandardTypeLabel(finding.type);
                            const sectionLabel = finding.section !== null && finding.section !== undefined
                                ? `${finding.section}${finding.subsection !== null && finding.subsection !== undefined ? `.${finding.subsection}` : ''}`
                                : null;
                            const chipMeta = getFindingChipMeta(finding.findingType);

                            return (
                                <div key={finding.ncId || index} className={`finding-card${chipMeta ? ` ${chipMeta.className}` : ''}`}>
                                    <div className="finding-header">
                                        <div className="finding-id-type">
                                            {chipMeta && (
                                                <span className="finding-type">{chipMeta.label}</span>
                                            )}
                                            {finding.findingType === 1 && (
                                                <>
                                                    <span className="finding-id">NCID: {finding.ncId}</span>
                                                    {standardLabel && (
                                                        <span className="finding-type">{standardLabel}</span>
                                                    )}
                                                    {finding.severity && (
                                                        <span className={`finding-type ${getSeverityLabel(finding.severity).toLowerCase()}`}>
                                                            Severity: {getSeverityLabel(finding.severity)}
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {sectionLabel && (
                                        <div className="finding-item">
                                            <strong>Standard Section:</strong>
                                            <p>{sectionLabel}</p>
                                        </div>
                                    )}

                                    <div className="finding-item">
                                        <strong>Question:</strong>
                                        <p>{finding.question || <span className="no-response">No response provided</span>}</p>
                                    </div>

                                    <div className="finding-item">
                                        <strong>Auditee Response:</strong>
                                        <p>{finding.response || <span className="no-response">No response provided</span>}</p>
                                    </div>

                                    <div className="finding-item">
                                        <strong>Auditor Comment:</strong>
                                        <p>{finding.auditorComment || <span className="no-response">No response provided</span>}</p>
                                    </div>

                                    <div className="finding-item">
                                        <strong>PrOPs:</strong>
                                        <p>{getFindingPropSummary(finding) || <span className="no-response">No response provided</span>}</p>
                                    </div>

                                    {finding.findingType === 1 && (
                                        <>
                                            {(showNcDetailFallbacks || finding.details || finding.AIN) && (
                                                <>
                                                    <div className="finding-item">
                                                        <strong>Details:</strong>
                                                        <p>
                                                            {finding.details
                                                                || (showNcDetailFallbacks ? <span className="no-response">No response provided</span> : null)}
                                                        </p>
                                                    </div>

                                                    <div className="finding-item">
                                                        <strong>Action Item Number:</strong>
                                                        <p>
                                                            {finding.AIN
                                                                || (showNcDetailFallbacks ? <span className="no-response">No response provided</span> : null)}
                                                        </p>
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Audit;
