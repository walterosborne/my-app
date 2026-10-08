// API data loader:
// - during local Vite dev, /api is proxied to the backend on port 3001
// - behind the OpenShift reverse proxy, /api is handled by the backend service
export const API_BASE = '/api';

export const buildApiUrl = (path = '') => `${API_BASE}/${String(path).replace(/^\/+/, '')}`;

// Cache for data to avoid repeated fetches. Keep in-flight reads too so two
// components asking for the same endpoint at once share one request.
const cache = {};
const inFlight = {};
let headerDiagnosticsCache = null;
let headerDiagnosticsPromise = null;

const getHashRouteContext = () => {
    if (typeof window === 'undefined') {
        return { pathname: '', searchParams: new URLSearchParams() };
    }

    const hash = String(window.location.hash || '').replace(/^#/, '');
    const queryIndex = hash.indexOf('?');
    const pathname = queryIndex >= 0 ? hash.slice(0, queryIndex) : hash;
    const queryString = queryIndex >= 0 ? hash.slice(queryIndex + 1) : '';
    return {
        pathname,
        searchParams: new URLSearchParams(queryString)
    };
};

const isMetricsRoute = () => getHashRouteContext().pathname === '/metrics';

const getAuditReportRouteId = () => {
    const { pathname } = getHashRouteContext();
    const match = pathname.match(/^\/audit\/(\d+)\/?$/);
    if (!match) return null;
    const parsed = Number(match[1]);
    return Number.isFinite(parsed) ? parsed : null;
};

const getYearFromDateValue = (value) => {
    if (!value) return null;
    const text = String(value);
    const leadingYear = text.match(/^(\d{4})/);
    if (leadingYear) return Number(leadingYear[1]);
    const parsed = new Date(value);
    const year = parsed.getFullYear();
    return Number.isFinite(year) ? year : null;
};

async function fetchData(endpoint, skipCache = false) {
    if (cache[endpoint] && !skipCache) {
        return cache[endpoint];
    }
    if (inFlight[endpoint] && !skipCache) {
        return await inFlight[endpoint];
    }

    const request = (async () => {
        try {
            const response = await fetch(buildApiUrl(endpoint));
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            cache[endpoint] = data;
            return data;
        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            return [];
        }
    })();

    if (!skipCache) {
        inFlight[endpoint] = request;
    }

    try {
        return await request;
    } finally {
        if (!skipCache) {
            delete inFlight[endpoint];
        }
    }
}

// Export async functions for each data type
export async function getAudits(skipCache = false) {
    const { pathname, searchParams } = getHashRouteContext();
    if (pathname === '/entry') {
        const entryType = searchParams.get('type') || 'summary';
        return await fetchData(`entry-audits?type=${encodeURIComponent(entryType)}`, skipCache);
    }
    return await fetchData('audits', skipCache);
}

export async function getAuditsAll(skipCache = false) {
    // Metrics only needs a narrow subset of the audit record. The dedicated
    // endpoint avoids downloading the much wider general audit payload.
    const endpoint = isMetricsRoute() ? 'metrics/audits' : 'audits?all=true';
    return await fetchData(endpoint, skipCache);
}

const mergeSelectedAuditDetail = (summaries, selectedId, detail) => {
    if (!Array.isArray(summaries)) return [];
    if (!detail || Array.isArray(detail) || typeof detail !== 'object') {
        return summaries;
    }
    return summaries.map((audit) => (
        Number(audit?.scheduleId) === Number(selectedId)
            ? { ...audit, ...detail }
            : audit
    ));
};

export async function getAuditsReport(skipCache = false) {
    const { pathname } = getHashRouteContext();
    const isIndividualReport = pathname === '/audit' || pathname.startsWith('/audit/');
    if (!isIndividualReport) {
        return await fetchData('audits?report=true', skipCache);
    }

    // For an explicit /audit/:id URL we already know which full record is
    // needed, so request it in parallel with the compact dropdown list.
    const explicitSelectedId = getAuditReportRouteId();
    if (explicitSelectedId) {
        const [summaries, detail] = await Promise.all([
            fetchData('report-audits', skipCache),
            fetchData(`audits/${explicitSelectedId}?report=true`, skipCache)
        ]);
        return mergeSelectedAuditDetail(summaries, explicitSelectedId, detail);
    }

    // /audit without an ID keeps the historical behavior of opening the newest
    // accessible audit. We need the compact list first to identify that ID.
    const summaries = await fetchData('report-audits', skipCache);
    if (!Array.isArray(summaries) || summaries.length === 0) {
        return [];
    }

    const selectedId = summaries.reduce((highest, audit) => {
        const scheduleId = Number(audit?.scheduleId);
        return Number.isFinite(scheduleId) && scheduleId > highest ? scheduleId : highest;
    }, 0) || null;

    if (!selectedId) return summaries;
    const detail = await fetchData(`audits/${selectedId}?report=true`, skipCache);
    return mergeSelectedAuditDetail(summaries, selectedId, detail);
}

export async function getCurrentUser(skipCache = false) {
    // AppBootstrapGate already resolves the user before routed pages render.
    // Reuse that result unless a caller explicitly requests a refresh.
    return await fetchData('current-user', skipCache);
}

export async function getHeaderDiagnostics(skipCache = false) {
    // Header diagnostics are warmed at app bootstrap. Reuse both the completed
    // value and an in-flight request instead of every page repeating the call.
    if (headerDiagnosticsCache && !skipCache) {
        return headerDiagnosticsCache;
    }
    if (headerDiagnosticsPromise && !skipCache) {
        return await headerDiagnosticsPromise;
    }

    const request = (async () => {
        const response = await fetch(buildApiUrl('testheaders?format=json'), {
            cache: 'no-store'
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        headerDiagnosticsCache = data;
        return data;
    })();

    if (!skipCache) {
        headerDiagnosticsPromise = request;
    }

    try {
        return await request;
    } finally {
        if (!skipCache) {
            headerDiagnosticsPromise = null;
        }
    }
}

export async function getPrograms() {
    return await fetchData('programs');
}

export async function getDivisions() {
    return await fetchData('divisions');
}

export async function getSectors() {
    return await fetchData('sectors');
}

export async function getSites() {
    return await fetchData('sites');
}

export async function getFoeSites(skipCache = false) {
    return await fetchData('foe-sites', skipCache);
}

export async function getFoeAuditAreas(skipCache = false) {
    return await fetchData('foe-audit-areas', skipCache);
}

export async function getFoeAuditors(skipCache = false) {
    return await fetchData('foe-auditors', skipCache);
}

export async function getFoeCustomers(skipCache = false) {
    return await fetchData('foe-customers', skipCache);
}

export async function getFoeDivisions(skipCache = false) {
    return await fetchData('foe-divisions', skipCache);
}

export async function getFoeShifts(skipCache = false) {
    return await fetchData('foe-shifts', skipCache);
}

async function parseFoeResponse(response, fallbackMessage) {
    let data = null;
    try {
        data = await response.json();
    } catch {
        data = null;
    }
    if (!response.ok) {
        throw new Error(data?.error || fallbackMessage || `HTTP error! status: ${response.status}`);
    }
    return data;
}

export async function getFoeAuditWorkspace() {
    const response = await fetch(buildApiUrl('foe-audit-workspace'), { cache: 'no-store' });
    return await parseFoeResponse(response, 'Unable to load FOE audit workspace.');
}

export async function saveFoeAudit(payload) {
    const response = await fetch(buildApiUrl('foe-audits'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    return await parseFoeResponse(response, 'Unable to save FOE audit.');
}

export async function deleteFoeAudit(title) {
    const response = await fetch(buildApiUrl(`foe-audits/${encodeURIComponent(title)}`), {
        method: 'DELETE'
    });
    return await parseFoeResponse(response, 'Unable to delete FOE audit.');
}

export async function getFoeReportData() {
    const response = await fetch(buildApiUrl('foe-report-data'), { cache: 'no-store' });
    return await parseFoeResponse(response, 'Unable to load FOE report data.');
}

export async function getBusinessUnits() {
    return await fetchData('business-units');
}

export async function getOperatingUnits() {
    return await fetchData('operating-units');
}

export async function getAuditors() {
    return await fetchData('auditors');
}

export async function getAuditTypes() {
    return await fetchData('audit-types');
}

export async function getFunctions() {
    return await fetchData('functions');
}

export async function getIntExt() {
    return await fetchData('int-ext');
}

export async function getStandards() {
    return await fetchData('standards');
}

export async function getStandardTexts() {
    return await fetchData('standard-texts');
}

export async function getAuditorFiles(skipCache = false) {
    return await fetchData('auditor-files', skipCache);
}

export async function setAuditorFileActive(fileId, active) {
    const response = await fetch(`${API_BASE}/auditor-files/${fileId}/active`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ active })
    });
    if (!response.ok) {
        let errorMessage = 'Failed to update file status.';
        try {
            const errorData = await response.json();
            if (errorData?.error) {
                errorMessage = errorData.error;
            }
        } catch {
            // ignore JSON parse errors
        }
        throw new Error(errorMessage);
    }
    delete cache['auditor-files'];
    return await response.json();
}

export async function uploadAuditorFile(fileInput) {
    const files = (Array.isArray(fileInput) ? fileInput : [fileInput]).filter(Boolean);
    const formData = new FormData();
    files.forEach((file) => {
        formData.append(files.length === 1 ? 'file' : 'files', file);
    });
    let response;
    try {
        response = await fetch(`${API_BASE}/auditor-files`, {
            method: 'POST',
            body: formData
        });
    } catch (error) {
        if (error instanceof TypeError && /Failed to fetch/i.test(error.message || '')) {
            const enhancedError = new Error(
                "NGAT couldn't upload this file. NGAT can't access non-local locations yet, including SharePoint, OneDrive, and other shared-drive locations. Save the file to a folder on your computer, then try again."
            );
            enhancedError.persistToast = true;
            throw enhancedError;
        }
        throw error;
    }
    if (!response.ok) {
        let errorMessage = 'Failed to upload file.';
        try {
            const errorText = await response.text();
            if (errorText) {
                try {
                    const errorData = JSON.parse(errorText);
                    if (errorData?.error) {
                        errorMessage = errorData.error;
                    }
                } catch {
                    if (!/<[a-z][\s\S]*>/i.test(errorText)) {
                        errorMessage = errorText;
                    }
                }
            }
        } catch {
            // ignore response body parsing errors
        }
        if (errorMessage === 'Failed to upload file.') {
            if (response.status === 413) {
                errorMessage = 'File exceeds the NGAT upload limit. Please choose a file smaller than 50MB and try again.';
            } else {
                errorMessage = `Failed to upload file (HTTP ${response.status}).`;
            }
        }
        const uploadError = new Error(errorMessage);
        if (response.status === 413) {
            uploadError.persistToast = true;
        }
        throw uploadError;
    }
    delete cache['auditor-files'];
    return await response.json();
}

export const getAuditorFileDownloadUrl = (fileId) => {
    return `${API_BASE}/auditor-files/${fileId}/download`;
};

export async function getSafetyEquipment() {
    return await fetchData('safety-equipment');
}

export async function getTrainingRequirements() {
    return await fetchData('training-requirements');
}

export async function getSeverities() {
    return await fetchData('severities');
}

export async function getRoster() {
    return await fetchData('roster');
}

export async function searchRoster(query, limit = 50) {
    const trimmedQuery = String(query || '').trim();
    if (!trimmedQuery) {
        return [];
    }
    const params = new URLSearchParams({
        q: trimmedQuery,
        limit: String(limit)
    });
    const response = await fetch(`${API_BASE}/roster?${params.toString()}`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
}

export async function getRosterByIds(ids = []) {
    const normalizedIds = [...new Set(
        (Array.isArray(ids) ? ids : [ids])
            .map((id) => String(id ?? '').trim())
            .filter(Boolean)
    )];
    if (normalizedIds.length === 0) {
        return [];
    }
    const params = new URLSearchParams({
        ids: normalizedIds.join(',')
    });
    const response = await fetch(`${API_BASE}/roster?${params.toString()}`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
}

export async function getProps() {
    return await fetchData('props');
}

export async function getNonconformances(scheduleId) {
    if (scheduleId) {
        // Don't cache schedule-specific queries. The endpoint is a flattened
        // finding view: one row per response, with questionId/responseNumber.
        const response = await fetch(`${API_BASE}/nonconformances/${scheduleId}`);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data?.error || `HTTP error! status: ${response.status}`);
        }
        return Array.isArray(data) ? data : [];
    }
    // Metrics only needs schedule/type/clause/finding type/severity, not the
    // full response text and evidence metadata returned by the legacy endpoint.
    const endpoint = isMetricsRoute() ? 'metrics/findings' : 'nonconformances';
    // Findings change throughout Conduct Audit/Nonconformities, so a global
    // results read must not reuse stale session cache data.
    const data = await fetchData(endpoint, true);
    return Array.isArray(data) ? data : [];
}

export async function getRiskFactors() {
    return await fetchData('risk-factors');
}

export async function getSubcategories() {
    return await fetchData('subcategories');
}

export async function getRiskRatings(riskTypeId, targetId = null, processArea = null, year = null) {
    const params = new URLSearchParams();
    if (riskTypeId !== null && riskTypeId !== undefined && riskTypeId !== '') {
        params.set('riskTypeId', String(riskTypeId));
    }
    if (targetId !== null && targetId !== undefined && targetId !== '') {
        params.set('targetId', String(targetId));
    }
    if (processArea !== null && processArea !== undefined && String(processArea).trim() !== '') {
        params.set('processArea', String(processArea).trim());
    }

    let effectiveYear = year;
    // Individual Audit Report only displays ratings for the audit's year. Use
    // the already-small report summary to avoid downloading every year's risk
    // rows when the caller did not explicitly request another scope/year.
    if (
        effectiveYear === null
        && (riskTypeId === null || riskTypeId === undefined || riskTypeId === '')
        && targetId === null
        && processArea === null
    ) {
        const auditId = getAuditReportRouteId();
        if (auditId) {
            const summaries = await fetchData('report-audits');
            const summary = Array.isArray(summaries)
                ? summaries.find((audit) => Number(audit?.scheduleId) === Number(auditId))
                : null;
            effectiveYear = getYearFromDateValue(
                summary?.expectedStartDate || summary?.expectedCompletionDate
            );
        }
    }

    if (effectiveYear !== null && effectiveYear !== undefined && effectiveYear !== '') {
        params.set('year', String(effectiveYear));
    }

    const queryString = params.toString();
    const response = await fetch(`${API_BASE}/risk-ratings${queryString ? `?${queryString}` : ''}`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
}

export async function saveRiskRatings(payload) {
    const response = await fetch(`${API_BASE}/risk-ratings`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to save risk ratings.');
    }
    return await response.json();
}

export async function deleteRiskRatings(payload) {
    const response = await fetch(`${API_BASE}/risk-ratings`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to delete risk ratings.');
    }
    return await response.json();
}

export async function getCauses() {
    return await fetchData('causes');
}

export async function getEveryTimeQuestions(divisionId) {
    const endpoint = divisionId ? `everytime-questions?divisionId=${divisionId}` : 'everytime-questions';
    return await fetchData(endpoint);
}

// Clear cache (useful for refreshing data)
export function clearCache() {
    Object.keys(cache).forEach(key => delete cache[key]);
    Object.keys(inFlight).forEach(key => delete inFlight[key]);
    headerDiagnosticsCache = null;
    headerDiagnosticsPromise = null;
}
