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

export const registerReferenceDataRoutes = ({ app, pool }) => {
    // High-traffic pages previously issued a dozen-plus independent lookup
    // requests at once. That repeated HTTP/auth overhead even though the data is
    // small and changes infrequently. Fetch the same lookup tables in parallel
    // behind one authenticated request and let the browser cache the bundle.
    app.get('/api/reference-data', async (_req, res) => {
        const startedAt = Date.now();
        try {
            const [
                programs,
                divisions,
                sectors,
                sites,
                businessUnits,
                operatingUnits,
                auditors,
                auditTypes,
                functions,
                intExt,
                standards,
                severities,
                safetyEquipment,
                trainingRequirements,
                props,
                causes,
                riskFactors,
                subcategories
            ] = await Promise.all([
                pool.query(`
                    SELECT
                        p.*,
                        ISNULL((
                            SELECT CONCAT('[', STRING_AGG(CAST(apa.auditorid AS NVARCHAR(MAX)), ','), ']')
                            FROM auditor_program_assignments_r apa
                            WHERE apa.programid = p.programid
                        ), '[]') AS auditorids
                    FROM programs_r p
                    ORDER BY p.programid
                `),
                pool.query('SELECT * FROM divisions_r ORDER BY divisionId'),
                pool.query('SELECT * FROM sectors_r ORDER BY sectorId'),
                pool.query('SELECT * FROM sites_r ORDER BY siteId'),
                pool.query('SELECT * FROM business_units_r ORDER BY businessUnitId'),
                pool.query('SELECT * FROM operating_units_r ORDER BY operatingUnitId'),
                pool.query(`
                    SELECT
                        a.*,
                        ISNULL((
                            SELECT CONCAT('[', STRING_AGG(CAST(apa.programid AS NVARCHAR(MAX)), ','), ']')
                            FROM auditor_program_assignments_r apa
                            WHERE apa.auditorid = a.auditorid
                        ), '[]') AS programids
                    FROM auditors_r a
                    ORDER BY a.auditorid
                `),
                pool.query('SELECT * FROM audit_types_r ORDER BY auditTypeId'),
                pool.query('SELECT * FROM functions_r ORDER BY functionId'),
                pool.query('SELECT * FROM int_ext_r ORDER BY intExtId'),
                pool.query('SELECT * FROM standards_r ORDER BY standardId'),
                pool.query('SELECT * FROM severities_r ORDER BY severityId'),
                pool.query('SELECT * FROM safety_equipment_r ORDER BY safetyEquipmentId'),
                pool.query('SELECT * FROM training_requirements_r ORDER BY trainingRequirementId'),
                pool.query('SELECT * FROM props_r ORDER BY propId'),
                pool.query('SELECT * FROM causes_r ORDER BY causeId'),
                pool.query('SELECT * FROM RiskFactors_r ORDER BY RiskFactorID'),
                pool.query('SELECT * FROM Subcategories_r ORDER BY RiskFactorID, SubcategoryID')
            ]);

            res.set('Server-Timing', `reference-data;dur=${Date.now() - startedAt}`);
            res.json({
                programs: programs.rows.map(mapProgram),
                divisions: divisions.rows.map(mapDivision),
                sectors: sectors.rows.map(mapSector),
                sites: sites.rows.map(mapSite),
                businessUnits: businessUnits.rows.map(mapBusinessUnit),
                operatingUnits: operatingUnits.rows.map(mapOperatingUnit),
                auditors: auditors.rows.map(mapAuditor),
                auditTypes: auditTypes.rows.map(mapAuditType),
                functions: functions.rows.map(mapFunction),
                intExt: intExt.rows.map(mapIntExt),
                standards: standards.rows.map(mapStandard),
                severities: severities.rows.map(mapSeverity),
                safetyEquipment: safetyEquipment.rows.map(mapSafetyEquipment),
                trainingRequirements: trainingRequirements.rows.map(mapTrainingRequirement),
                props: props.rows.map(mapProp),
                causes: causes.rows.map(mapCause),
                riskFactors: riskFactors.rows,
                subcategories: subcategories.rows
            });
        } catch (error) {
            console.error('Error fetching reference data bundle:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
};
