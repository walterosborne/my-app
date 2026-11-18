// Report reads must fail visibly: an empty list is not a substitute for a
// failed request, and a dropdown summary is not a complete audit record.
export async function requestReportJson(path, { signal, timeoutMs = 20000, label = 'report data' } = {}) {
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal?.aborted) throw new DOMException('Request cancelled', 'AbortError');
    signal?.addEventListener('abort', abort, { once: true });
    let timedOut = false;
    const timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
    }, timeoutMs);
    try {
        const response = await fetch(`/api/${path}`, { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) {
            const message = response.status === 403
                ? 'You do not have permission to view this audit or its data.'
                : response.status === 404
                    ? 'This audit is unavailable or you do not have access to it.'
                    : `Unable to load ${label} (HTTP ${response.status}). Please try again.`;
            throw new Error(message);
        }
        const data = await response.json();
        if (data?.success === false || data?.error) throw new Error(`Unable to load ${label}. Please try again.`);
        return data;
    } catch (error) {
        if (signal?.aborted) throw new DOMException('Request cancelled', 'AbortError');
        if (timedOut) throw new Error(`Loading ${label} timed out. Please try again.`);
        if (error instanceof SyntaxError) throw new Error(`NGAT returned invalid ${label}. Please reload or try again.`);
        throw error;
    } finally {
        clearTimeout(timer);
        signal?.removeEventListener('abort', abort);
    }
}

export const requireReportArray = (value, label) => {
    if (!Array.isArray(value)) throw new Error(`NGAT returned invalid ${label}. Please try again.`);
    return value;
};

export async function loadReportAudits(selectedId = null, options = {}) {
    const rows = requireReportArray(
        await requestReportJson('report-audits', { ...options, label: 'the audit list' }), 'audit list'
    );
    // Use the same eligibility rules for both the default selection and dropdown.
    const summaries = rows.filter((audit) => ![-2, -3].includes(Number(audit?.stage)));
    const explicitId = selectedId !== null && selectedId !== undefined && selectedId !== '';
    const selected = explicitId
        ? summaries.find((audit) => Number(audit.scheduleId) === Number(selectedId))
        : summaries.reduce((latest, audit) => Number(audit.scheduleId) > Number(latest?.scheduleId || 0) ? audit : latest, null);
    if (!selected) {
        if (explicitId) throw new Error('This audit is unavailable or you do not have access to it.');
        return [];
    }
    const auditId = Number(selected.scheduleId);
    if (!Number.isSafeInteger(auditId) || auditId <= 0) throw new Error('NGAT returned an invalid audit ID.');
    const detail = await requestReportJson(`audits/${auditId}?report=true`, { ...options, label: 'the audit details' });
    if (!detail || Array.isArray(detail) || Number(detail.scheduleId) !== auditId
        || [-2, -3].includes(Number(detail.stage))) {
        throw new Error('The selected audit is unavailable. Please retry to refresh the audit list.');
    }
    // These fields distinguish a full record from a summary and are required by
    // the report renderer. Do not turn malformed/missing details into blank data.
    for (const key of ['siteIds', 'businessUnitIds', 'operatingUnitIds', 'programIds', 'additionalAuditorIds']) {
        requireReportArray(detail[key], 'audit details');
    }
    return summaries.map((audit) => Number(audit.scheduleId) === auditId ? { ...audit, ...detail } : audit);
}

export const REPORT_REFERENCE_KEYS = [
    'programs', 'divisions', 'sectors', 'sites', 'businessUnits', 'operatingUnits',
    'auditors', 'auditTypes', 'functions', 'intExt', 'customers', 'standards', 'severities',
    'safetyEquipment', 'trainingRequirements', 'props', 'causes', 'riskFactors', 'subcategories'
];

export async function loadReportPage(selectedId = null, options = {}) {
    const [audits, references, user] = await Promise.all([
        loadReportAudits(selectedId, options),
        requestReportJson('reference-data?profile=audit', { ...options, label: 'report reference data' }),
        requestReportJson('current-user', { ...options, label: 'your user information' })
    ]);
    for (const key of REPORT_REFERENCE_KEYS) requireReportArray(references?.[key], 'report reference data');
    if (!user || Array.isArray(user) || typeof user !== 'object' || !('myId' in user)) {
        throw new Error('Unable to load your user information. Please try again.');
    }
    return { audits, references, user };
}

export async function loadReportRiskRatings(year, options = {}) {
    if (!Number.isInteger(year) || year < 1) throw new Error('Unable to determine the audit year.');
    return requireReportArray(
        await requestReportJson(`risk-ratings?year=${year}`, { ...options, label: 'risk ratings' }), 'risk ratings'
    );
}
