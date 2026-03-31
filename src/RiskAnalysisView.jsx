import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import './Entry.css';
import './AdminMenu.css';
import './RiskAnalysisView.css';
import { customStyles } from './Utilities.jsx';
import {
  getCurrentUser,
  getRiskRatings,
  getRiskFactors,
  getSubcategories,
  getSectors,
  getDivisions,
  getSites,
  getBusinessUnits,
  getOperatingUnits,
  getPrograms
} from './assets/data/apiData';
import {
  ORG_GROUP_OPTIONS,
  buildOrgTargetOptions,
  getOrgGroupLabel,
  getOrgTargetLabel,
  getRiskToneLabel
} from './riskAnalysisUtils.js';

const RiskAnalysisView = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [riskRatings, setRiskRatings] = useState([]);
  const [riskFactorsList, setRiskFactorsList] = useState([]);
  const [subcategoriesList, setSubcategoriesList] = useState([]);
  const [sectorsList, setSectorsList] = useState([]);
  const [divisionsList, setDivisionsList] = useState([]);
  const [sitesList, setSitesList] = useState([]);
  const [businessUnitsList, setBusinessUnitsList] = useState([]);
  const [operatingUnitsList, setOperatingUnitsList] = useState([]);
  const [programsList, setProgramsList] = useState([]);
  const [riskTypeId, setRiskTypeId] = useState(null);
  const [targetId, setTargetId] = useState(null);
  const [processAreaFilter, setProcessAreaFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const [
          userData,
          riskRatingsData,
          riskFactors,
          subcategories,
          sectors,
          divisions,
          sites,
          businessUnits,
          operatingUnits,
          programs
        ] = await Promise.all([
          getCurrentUser(),
          getRiskRatings(),
          getRiskFactors(),
          getSubcategories(),
          getSectors(),
          getDivisions(),
          getSites(),
          getBusinessUnits(),
          getOperatingUnits(),
          getPrograms()
        ]);

        if (!mounted) return;
        setCurrentUser(userData);
        setRiskRatings(riskRatingsData);
        setRiskFactorsList(riskFactors);
        setSubcategoriesList(subcategories);
        setSectorsList(sectors);
        setDivisionsList(divisions);
        setSitesList(sites);
        setBusinessUnitsList(businessUnits);
        setOperatingUnitsList(operatingUnits);
        setProgramsList(programs);
      } catch (error) {
        console.error('Error loading risk analysis view:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    if (currentUser?.isAdmin) return;
    const timeout = setTimeout(() => {
      navigate('/audit');
    }, 1200);
    return () => clearTimeout(timeout);
  }, [loading, currentUser, navigate]);

  const selectedOrgGroup = useMemo(
    () => ORG_GROUP_OPTIONS.find((option) => Number(option.value) === Number(riskTypeId)) || null,
    [riskTypeId]
  );

  const targetOptions = useMemo(() => buildOrgTargetOptions({
    riskTypeId,
    sectorsList,
    divisionsList,
    sitesList,
    businessUnitsList,
    operatingUnitsList,
    programsList
  }), [riskTypeId, sectorsList, divisionsList, sitesList, businessUnitsList, operatingUnitsList, programsList]);

  const enrichedRatings = useMemo(() => {
    return riskRatings.map((row) => {
      const subcategory = subcategoriesList.find((item) => Number(item.subcategoryid) === Number(row.subcategoryid));
      const riskFactor = riskFactorsList.find((item) => Number(item.riskfactorid) === Number(subcategory?.riskfactorid));
      return {
        ...row,
        riskFactorName: riskFactor?.riskfactor || 'Unassigned Risk Factor',
        processAreaName: row.processarea || 'Unknown Process Area',
        subcategoryName: subcategory?.subcategory || subcategory?.subCategory || 'Unknown Subcategory',
        year: Number(row.year),
        targetId:
          Number(row.risktypeid) === 2 ? row.sectorid
            : Number(row.risktypeid) === 3 ? row.divisionid
              : Number(row.risktypeid) === 4 ? row.siteid
                : Number(row.risktypeid) === 5 ? row.buid
                  : Number(row.risktypeid) === 6 ? row.ouid
                    : Number(row.risktypeid) === 7 ? row.programid
                      : null,
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
        })
      };
    });
  }, [
    riskRatings,
    subcategoriesList,
    riskFactorsList,
    sectorsList,
    divisionsList,
    sitesList,
    businessUnitsList,
    operatingUnitsList,
    programsList
  ]);

  const filteredRatings = useMemo(() => {
    return enrichedRatings.filter((row) => {
      if (riskTypeId && Number(row.risktypeid) !== Number(riskTypeId)) return false;
      if (targetId && Number(row.targetId) !== Number(targetId)) return false;
      if (processAreaFilter && row.processAreaName !== processAreaFilter) return false;
      if (yearFilter && Number(row.year) !== Number(yearFilter)) return false;
      return true;
    });
  }, [enrichedRatings, riskTypeId, targetId, processAreaFilter, yearFilter]);

  const processAreaOptions = useMemo(() => {
    const sourceRows = enrichedRatings.filter((row) => {
      if (riskTypeId && Number(row.risktypeid) !== Number(riskTypeId)) return false;
      if (targetId && Number(row.targetId) !== Number(targetId)) return false;
      return true;
    });

    return Array.from(new Set(sourceRows.map((row) => row.processAreaName)))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ value, label: value }));
  }, [enrichedRatings, riskTypeId, targetId]);

  const yearOptions = useMemo(() => {
    const sourceRows = enrichedRatings.filter((row) => {
      if (riskTypeId && Number(row.risktypeid) !== Number(riskTypeId)) return false;
      if (targetId && Number(row.targetId) !== Number(targetId)) return false;
      if (processAreaFilter && row.processAreaName !== processAreaFilter) return false;
      return true;
    });

    return Array.from(new Set(sourceRows.map((row) => Number(row.year))))
      .filter((value) => Number.isInteger(value))
      .sort((a, b) => b - a)
      .map((value) => ({ value, label: String(value) }));
  }, [enrichedRatings, riskTypeId, targetId, processAreaFilter]);

  const groupedResults = useMemo(() => {
    const groups = new Map();

    filteredRatings.forEach((row) => {
      const groupKey = `${row.risktypeid}-${row.targetId}-${row.processAreaName}-${row.year}`;
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          key: groupKey,
          orgGroupLabel: row.orgGroupLabel,
          orgTargetLabel: row.orgTargetLabel || 'Unknown',
          processAreaName: row.processAreaName,
          year: row.year,
          items: []
        });
      }
      groups.get(groupKey).items.push(row);
    });

    return Array.from(groups.values())
      .map((group) => {
        const riskFactorGroups = Array.from(
          group.items.reduce((acc, item) => {
            if (!acc.has(item.riskFactorName)) {
              acc.set(item.riskFactorName, []);
            }
            acc.get(item.riskFactorName).push(item);
            return acc;
          }, new Map())
        )
          .map(([riskFactorName, items]) => ({
            riskFactorName,
            items: [...items].sort((a, b) => a.subcategoryName.localeCompare(b.subcategoryName))
          }))
          .sort((a, b) => a.riskFactorName.localeCompare(b.riskFactorName));

        return {
          ...group,
          count: group.items.length,
          riskFactorGroups
        };
      })
      .sort((a, b) => {
        const groupCompare = a.orgGroupLabel.localeCompare(b.orgGroupLabel);
        if (groupCompare !== 0) return groupCompare;
        const targetCompare = a.orgTargetLabel.localeCompare(b.orgTargetLabel);
        if (targetCompare !== 0) return targetCompare;
        if (Number(a.year) !== Number(b.year)) return Number(b.year) - Number(a.year);
        return a.processAreaName.localeCompare(b.processAreaName);
      });
  }, [filteredRatings]);

  if (loading || !currentUser) {
    return (
      <div className="entry-page">
        <div className="entry-container">
          <div className="entry-message">Loading risk analysis...</div>
        </div>
      </div>
    );
  }

  if (!currentUser.isAdmin) {
    return (
      <div className="entry-page">
        <div className="entry-container">
          <div className="entry-message">You do not have admin access. Redirecting...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="entry-page">
      <div className="entry-container">
        <div className="tool-page-header">
          <p className="tool-page-subtitle">Tools · Risk Analysis</p>
          <h1 className="tool-page-title">View Risk Analysis</h1>
          <p className="risk-analysis-view-subtitle">
            Review saved risk selections by organization, risk factor, and process area.
          </p>
          <button
            type="button"
            className="admin-secondary"
            style={{ position: 'absolute', top: '0', right: '0', minWidth: '180px' }}
            onClick={() => navigate('/risk-analysis/edit')}
          >
            Edit Risk Analysis
          </button>
        </div>

        <div className="section">
          <label className="sectiontitle" style={{ marginLeft: '0px' }}>Filters</label>
          <div className="sectionrow" style={{ gap: '16px' }}>
            <div className="fieldboxquarter">
              <label>Org Group</label>
              <Select
                value={selectedOrgGroup}
                onChange={(selectedOption) => {
                  setRiskTypeId(selectedOption ? selectedOption.value : null);
                  setTargetId(null);
                  setProcessAreaFilter('');
                }}
                options={ORG_GROUP_OPTIONS}
                styles={customStyles}
                placeholder="All Org Groups"
                isClearable
              />
            </div>
            <div className="fieldboxquarter">
              <label>Specific Org Group</label>
              <Select
                value={targetOptions.find((option) => Number(option.value) === Number(targetId)) || null}
                onChange={(selectedOption) => {
                  setTargetId(selectedOption ? selectedOption.value : null);
                  setProcessAreaFilter('');
                  setYearFilter('');
                }}
                options={targetOptions}
                styles={customStyles}
                placeholder={selectedOrgGroup ? `All ${selectedOrgGroup.label} Records` : 'Select Org Group First'}
                isClearable
                isDisabled={!riskTypeId}
              />
            </div>
            <div className="fieldboxquarter">
              <label>Process Area</label>
              <Select
                value={processAreaOptions.find((option) => option.value === processAreaFilter) || null}
                onChange={(selectedOption) => {
                  setProcessAreaFilter(selectedOption ? selectedOption.value : '');
                  setYearFilter('');
                }}
                options={processAreaOptions}
                styles={customStyles}
                placeholder="All Process Areas"
                isClearable
              />
            </div>
            <div className="fieldboxquarter">
              <label>Year</label>
              <Select
                value={yearOptions.find((option) => Number(option.value) === Number(yearFilter)) || null}
                onChange={(selectedOption) => setYearFilter(selectedOption ? selectedOption.value : '')}
                options={yearOptions}
                styles={customStyles}
                placeholder="All Years"
                isClearable
              />
            </div>
          </div>
        </div>

        {groupedResults.length === 0 ? (
          <div className="entry-message">No saved risk analysis records match the selected filters.</div>
        ) : (
          <div className="risk-analysis-view-grid">
            {groupedResults.map((group) => (
              <section key={group.key} className="risk-analysis-view-card">
                <div className="risk-analysis-view-card-header">
                  <div>
                    <p className="risk-analysis-view-kicker">{group.orgGroupLabel}</p>
                    <h3>{group.orgTargetLabel}</h3>
                    <div className="risk-analysis-view-meta">
                      <p className="risk-analysis-view-process-area">{group.processAreaName}</p>
                      <span className="risk-analysis-view-year">{group.year}</span>
                    </div>
                  </div>
                  <span className="risk-analysis-view-count">{group.count} ratings</span>
                </div>

                <div className="risk-analysis-view-groups">
                  {group.riskFactorGroups.map((factorGroup) => (
                    <div key={factorGroup.riskFactorName} className="risk-analysis-view-factor">
                      <h4>{factorGroup.riskFactorName}</h4>
                      <div className="risk-analysis-view-items">
                        {factorGroup.items.map((item) => (
                          <div key={`${item.riskratingid}-${item.subcategoryid}`} className="risk-analysis-view-item">
                            <span className="risk-analysis-view-process">{item.subcategoryName}</span>
                            <span className={`risk-analysis-view-chip rating-${getRiskToneLabel(item.rating).toLowerCase()}`}>
                              {getRiskToneLabel(item.rating)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskAnalysisView;
