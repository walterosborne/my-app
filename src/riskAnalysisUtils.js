export const ORG_GROUP_OPTIONS = [
  { value: 2, label: 'Sector' },
  { value: 3, label: 'Division' },
  { value: 4, label: 'Site' },
  { value: 5, label: 'Business Unit' },
  { value: 6, label: 'Operating Unit' },
  { value: 7, label: 'Program' }
];

export const getSiteLabel = (site) => {
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

export const buildOrgTargetOptions = ({
  riskTypeId,
  sectorsList = [],
  divisionsList = [],
  sitesList = [],
  businessUnitsList = [],
  operatingUnitsList = [],
  programsList = []
}) => {
  switch (Number(riskTypeId)) {
    case 2:
      return [...sectorsList]
        .filter((item) => (item.active ?? 1) === 1)
        .sort((a, b) => (a.sectorName || '').localeCompare(b.sectorName || ''))
        .map((item) => ({ value: item.sectorId, label: item.sectorName }));
    case 3:
      return [...divisionsList]
        .filter((item) => (item.active ?? 1) === 1)
        .sort((a, b) => (a.divisionName || '').localeCompare(b.divisionName || ''))
        .map((item) => ({ value: item.divisionId, label: item.divisionName }));
    case 4:
      return [...sitesList]
        .filter((item) => (item.active ?? 1) === 1)
        .sort((a, b) => getSiteLabel(a).localeCompare(getSiteLabel(b)))
        .map((item) => ({ value: item.siteId, label: getSiteLabel(item) }));
    case 5:
      return [...businessUnitsList]
        .filter((item) => (item.active ?? 1) === 1)
        .sort((a, b) => (a.businessUnitName || '').localeCompare(b.businessUnitName || ''))
        .map((item) => ({ value: item.businessUnitId, label: item.businessUnitName }));
    case 6:
      return [...operatingUnitsList]
        .filter((item) => (item.active ?? 1) === 1)
        .sort((a, b) => (a.operatingUnitName || '').localeCompare(b.operatingUnitName || ''))
        .map((item) => ({ value: item.operatingUnitId, label: item.operatingUnitName }));
    case 7:
      return [...programsList]
        .filter((item) => (item.active ?? 1) === 1)
        .sort((a, b) => (a.programName || '').localeCompare(b.programName || ''))
        .map((item) => ({ value: item.programId, label: item.programName }));
    default:
      return [];
  }
};

export const getOrgGroupLabel = (riskTypeId) => {
  return ORG_GROUP_OPTIONS.find((option) => Number(option.value) === Number(riskTypeId))?.label || 'Unknown';
};

export const getOrgTargetLabel = ({
  riskTypeId,
  sectorId,
  divisionId,
  siteId,
  buId,
  ouId,
  programId,
  sectorsList = [],
  divisionsList = [],
  sitesList = [],
  businessUnitsList = [],
  operatingUnitsList = [],
  programsList = []
}) => {
  switch (Number(riskTypeId)) {
    case 2:
      return sectorsList.find((item) => Number(item.sectorId) === Number(sectorId))?.sectorName || sectorId || '';
    case 3:
      return divisionsList.find((item) => Number(item.divisionId) === Number(divisionId))?.divisionName || divisionId || '';
    case 4: {
      const site = sitesList.find((item) => Number(item.siteId) === Number(siteId));
      return site ? getSiteLabel(site) : siteId || '';
    }
    case 5:
      return businessUnitsList.find((item) => Number(item.businessUnitId) === Number(buId))?.businessUnitName || buId || '';
    case 6:
      return operatingUnitsList.find((item) => Number(item.operatingUnitId) === Number(ouId))?.operatingUnitName || ouId || '';
    case 7:
      return programsList.find((item) => Number(item.programId) === Number(programId))?.programName || programId || '';
    default:
      return '';
  }
};

export const getRiskToneLabel = (rating) => {
  switch (Number(rating)) {
    case 1:
      return 'Low';
    case 2:
      return 'Medium';
    case 3:
      return 'High';
    default:
      return 'Unknown';
  }
};
