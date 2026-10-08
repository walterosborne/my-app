const parseNumberArray = (value) => {
    if (Array.isArray(value)) {
        return value.map(Number).filter(Number.isFinite);
    }
    if (value === null || value === undefined || value === '') return [];
    if (typeof value === 'number') return Number.isFinite(value) ? [value] : [];

    const text = String(value).trim();
    if (!text) return [];
    try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
            return parsed.map(Number).filter(Number.isFinite);
        }
    } catch {
        // Fall back to legacy comma-delimited values.
    }
    return text
        .replace(/^\[|\]$/g, '')
        .split(',')
        .map((item) => Number(String(item).trim()))
        .filter(Number.isFinite);
};

const formatAuditorName = (firstName, lastName) => {
    const first = String(firstName ?? '').trim();
    const last = String(lastName ?? '').trim();
    if (last && first) return `${last}, ${first}`;
    return last || first || '';
};

const mapProgram = (row) => ({
    programId: row.programid,
    programName: row.programname,
    divisionId: row.divisionid,
    businessUnitId: row.businessunitid,
    operatingUnitId: row.operatingunitid,
    auditorIds: parseNumberArray(row.auditorids),
    active: row.active
});

const mapDivision = (row) => ({
    divisionId: row.divisionid,
    divisionName: row.divisionname,
    sectorId: row.sectorid,
    active: row.active
});

const mapSector = (row) => ({
    sectorId: row.sectorid,
    sectorName: row.sectorname
});

const mapSite = (row) => ({
    siteId: row.siteid,
    address: row.address,
    city: row.city,
    state: row.state,
    country: row.country,
    divisionId: row.divisionid,
    active: row.active
});

const mapBusinessUnit = (row) => ({
    businessUnitId: row.businessunitid,
    businessUnitName: row.businessunitname,
    divisionId: row.divisionid,
    active: row.active
});

const mapOperatingUnit = (row) => ({
    operatingUnitId: row.operatingunitid,
    operatingUnitName: row.operatingunitname,
    divisionId: row.divisionid,
    businessUnitId: row.businessunitid,
    active: row.active
});

const mapAuditor = (row) => ({
    auditorId: row.auditorid,
    firstName: row.fname ?? row.firstname ?? '',
    lastName: row.lname ?? row.lastname ?? '',
    auditorName: formatAuditorName(row.fname ?? row.firstname, row.lname ?? row.lastname),
    myId: row.myid,
    divisionId: row.divisionid,
    programIds: parseNumberArray(row.programids),
    cuiApproved: Number(row.cuiapproved) === 1 ? 1 : 0,
    active: row.active
});

const mapAuditType = (row) => ({
    auditTypeId: row.audittypeid,
    auditTypeName: row.audittypename,
    active: row.active
});

const mapFunction = (row) => ({
    functionId: row.functionid,
    functionName: row.functionname,
    active: row.active
});

const mapIntExt = (row) => ({
    intExtId: row.intextid,
    intExtName: row.intextname
});

const mapStandard = (row) => ({
    standardId: row.standardid,
    standardName: row.standardname
});

const mapSeverity = (row) => ({
    severityId: row.severityid,
    severity: row.severity
});

const mapSafetyEquipment = (row) => ({
    safetyEquipmentId: row.safetyequipmentid,
    safetyEquipmentName: row.safetyequipmentname,
    active: row.active
});

const mapTrainingRequirement = (row) => ({
    trainingRequirementId: row.trainingrequirementid,
    trainingRequirementName: row.trainingrequirementname,
    active: row.active
});

const mapProp = (row) => ({
    propId: row.propid,
    PrOP: row.prop,
    sectorId: row.sectorid,
    divisionId: row.divisionid,
    siteId: row.siteid,
    buId: row.buid,
    ouId: row.ouid,
    programId: row.programid,
    propTypeId: row.proptypeid,
    active: row.active
});

const mapCause = (row) => ({
    causeId: row.causeid,
    cause: row.cause,
    active: row.active
});

const REFERENCE_SPECS = {
    programs: {
        query: `
            SELECT
                p.*,
                ISNULL((
                    SELECT CONCAT('[', STRING_AGG(CAST(apa.auditorid AS NVARCHAR(MAX)), ','), ']')
                    FROM auditor_program_assignments_r apa
                    WHERE apa.programid = p.programid
                ), '[]') AS auditorids
            FROM programs_r p
            ORDER BY p.programid
        `,
        map: (rows) => rows.map(mapProgram)
    },
    divisions: {
        query: 'SELECT * FROM divisions_r ORDER BY divisionId',
        map: (rows) => rows.map(mapDivision)
    },
    sectors: {
        query: 'SELECT * FROM sectors_r ORDER BY sectorId',
        map: (rows) => rows.map(mapSector)
    },
    sites: {
        query: 'SELECT * FROM sites_r ORDER BY siteId',
        map: (rows) => rows.map(mapSite)
    },
    businessUnits: {
        query: 'SELECT * FROM business_units_r ORDER BY businessUnitId',
        map: (rows) => rows.map(mapBusinessUnit)
    },
    operatingUnits: {
        query: 'SELECT * FROM operating_units_r ORDER BY operatingUnitId',
        map: (rows) => rows.map(mapOperatingUnit)
    },
    auditors: {
        query: `
            SELECT
                a.*,
                ISNULL((
                    SELECT CONCAT('[', STRING_AGG(CAST(apa.programid AS NVARCHAR(MAX)), ','), ']')
                    FROM auditor_program_assignments_r apa
                    WHERE apa.auditorid = a.auditorid
                ), '[]') AS programids
            FROM auditors_r a
            ORDER BY a.auditorid
        `,
        map: (rows) => rows.map(mapAuditor)
    },
    auditTypes: {
        query: 'SELECT * FROM audit_types_r ORDER BY auditTypeId',
        map: (rows) => rows.map(mapAuditType)
    },
    functions: {
        query: 'SELECT * FROM functions_r ORDER BY functionId',
        map: (rows) => rows.map(mapFunction)
    },
    intExt: {
        query: 'SELECT * FROM int_ext_r ORDER BY intExtId',
        map: (rows) => rows.map(mapIntExt)
    },
    standards: {
        query: 'SELECT * FROM standards_r ORDER BY standardId',
        map: (rows) => rows.map(mapStandard)
    },
    severities: {
        query: 'SELECT * FROM severities_r ORDER BY severityId',
        map: (rows) => rows.map(mapSeverity)
    },
    safetyEquipment: {
        query: 'SELECT * FROM safety_equipment_r ORDER BY safetyEquipmentId',
        map: (rows) => rows.map(mapSafetyEquipment)
    },
    trainingRequirements: {
        query: 'SELECT * FROM training_requirements_r ORDER BY trainingRequirementId',
        map: (rows) => rows.map(mapTrainingRequirement)
    },
    props: {
        query: 'SELECT * FROM props_r ORDER BY propId',
        map: (rows) => rows.map(mapProp)
    },
    causes: {
        query: 'SELECT * FROM causes_r ORDER BY causeId',
        map: (rows) => rows.map(mapCause)
    },
    riskFactors: {
        query: 'SELECT * FROM RiskFactors_r ORDER BY RiskFactorID',
        map: (rows) => rows
    },
    subcategories: {
        query: 'SELECT * FROM Subcategories_r ORDER BY RiskFactorID, SubcategoryID',
        map: (rows) => rows
    }
};

const ALL_REFERENCE_KEYS = Object.keys(REFERENCE_SPECS);
const REFERENCE_KEYS_BY_PROFILE = {
    audit: ALL_REFERENCE_KEYS,
    metrics: [
        'auditors', 'businessUnits', 'causes', 'divisions', 'operatingUnits',
        'sectors', 'sites', 'programs', 'functions', 'standards', 'intExt', 'severities'
    ],
    schedule: [
        'programs', 'divisions', 'sectors', 'sites', 'businessUnits',
        'operatingUnits', 'auditors', 'auditTypes', 'functions', 'intExt', 'standards'
    ],
    planning: ['programs', 'divisions', 'auditors', 'safetyEquipment', 'trainingRequirements'],
    results: ['programs', 'divisions', 'auditors', 'standards', 'props', 'causes'],
    nonconformities: [
        'programs', 'divisions', 'sectors', 'sites', 'businessUnits',
        'operatingUnits', 'auditors', 'auditTypes', 'functions', 'intExt', 'standards', 'severities'
    ]
};

const normalizeProfile = (value) => {
    const profile = String(value || '').trim().toLowerCase();
    return Object.prototype.hasOwnProperty.call(REFERENCE_KEYS_BY_PROFILE, profile)
        ? profile
        : 'audit';
};

export const registerReferenceDataRoutes = ({ app, pool }) => {
    // High-traffic pages previously issued a dozen-plus independent lookup
    // requests at once. Each profile bundles exactly the lookup tables that page
    // normally requests, preserving the same data while removing repeated
    // HTTP/auth overhead and avoiding unnecessary over-fetching.
    app.get('/api/reference-data', async (req, res) => {
        const startedAt = Date.now();
        try {
            const profile = normalizeProfile(req.query.profile);
            const keys = REFERENCE_KEYS_BY_PROFILE[profile];
            const results = await Promise.all(
                keys.map((key) => pool.query(REFERENCE_SPECS[key].query))
            );

            const payload = {};
            keys.forEach((key, index) => {
                payload[key] = REFERENCE_SPECS[key].map(results[index].rows);
            });

            res.set('Server-Timing', `reference-data;dur=${Date.now() - startedAt}`);
            res.json(payload);
        } catch (error) {
            console.error('Error fetching reference data bundle:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
};
