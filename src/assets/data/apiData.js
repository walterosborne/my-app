// API data loader:
// - during local Vite dev, /api is proxied to the backend on port 3001
// - behind IIS/reverse proxy, /api is handled by the web.config rewrite
export const API_BASE = '/api';

export const buildApiUrl = (path = '') => `${API_BASE}/${String(path).replace(/^\/+/, '')}`;

// Cache for data to avoid repeated fetches
const cache = {};

async function fetchData(endpoint, skipCache = false) {
    if (cache[endpoint] && !skipCache) {
        return cache[endpoint];
    }

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
}

// Export async functions for each data type
export async function getAudits(skipCache = false) {
    return await fetchData('audits', skipCache);
}

export async function getAuditsAll(skipCache = false) {
    return await fetchData('audits?all=true', skipCache);
}

export async function getAuditsReport(skipCache = false) {
    return await fetchData('audits?report=true', skipCache);
}

export async function getCurrentUser() {
    return await fetchData('current-user', true);
}

export async function getHeaderDiagnostics() {
    const response = await fetch(buildApiUrl('testheaders?format=json'), {
        cache: 'no-store'
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
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

export async function getStatuses() {
    return await fetchData('statuses');
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

export async function uploadAuditorFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE}/auditor-files`, {
        method: 'POST',
        body: formData
    });
    if (!response.ok) {
        let errorMessage = 'Failed to upload file.';
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
        // Don't cache schedule-specific queries
        const response = await fetch(`${API_BASE}/nonconformances/${scheduleId}`);
        return await response.json();
    }
    return await fetchData('nonconformances');
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
    if (year !== null && year !== undefined && year !== '') {
        params.set('year', String(year));
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
}
