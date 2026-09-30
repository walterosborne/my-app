import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { customStyles } from './Utilities.jsx';
import { getRiskFactors, getRiskRatings, getSubcategories } from './assets/data/apiData';

const getProcessAreaLabel = (subcategory) => {
  return subcategory?.subcategory
    || subcategory?.subCategory
    || subcategory?.subcategoryname
    || subcategory?.name
    || subcategory?.label
    || '';
};

export const buildRiskRatingsPayload = (riskRatings, riskComments = {}) => {
  return Object.entries(riskRatings)
    .filter(([_, rating]) => rating !== null && rating !== undefined && rating !== '')
    .map(([subcategoryId, rating]) => ({
      subcategoryId: Number(subcategoryId),
      rating: Number(rating),
      comments: String(riskComments[subcategoryId] || '')
    }));
};

function RiskFactorAssignment({ riskTypeId = null, targetId = null, processArea = '', year = null, onChange, title = 'Risk Factors' }) {
  const [loading, setLoading] = useState(true);
  const [riskFactorsList, setRiskFactorsList] = useState([]);
  const [subcategoriesList, setSubcategoriesList] = useState([]);
  const [selectedRiskFactors, setSelectedRiskFactors] = useState([]);
  const [riskRatings, setRiskRatings] = useState({});
  const [riskComments, setRiskComments] = useState({});

  useEffect(() => {
    async function loadLookupData() {
      try {
        const [riskFactors, subcategories] = await Promise.all([
          getRiskFactors(),
          getSubcategories()
        ]);
        setRiskFactorsList(riskFactors);
        setSubcategoriesList(subcategories);
      } catch (error) {
        console.error('Error loading risk factor data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadLookupData();
  }, []);

  useEffect(() => {
    async function loadExistingRatings() {
      if (!riskTypeId || (Number(riskTypeId) !== 1 && !targetId) || !String(processArea || '').trim() || !year || subcategoriesList.length === 0) {
        setRiskRatings({});
        setRiskComments({});
        setSelectedRiskFactors([]);
        return;
      }

      try {
        const ratings = await getRiskRatings(riskTypeId, targetId, processArea, year);
        const ratingsMap = {};
        const commentsMap = {};
        const selectedFactors = new Set();

        ratings.forEach((rating) => {
          ratingsMap[rating.subcategoryid] = rating.rating;
          commentsMap[rating.subcategoryid] = rating.comments || '';
          const subcategory = subcategoriesList.find((item) => item.subcategoryid === rating.subcategoryid);
          if (subcategory) {
            selectedFactors.add(subcategory.riskfactorid);
          }
        });

        setRiskRatings(ratingsMap);
        setRiskComments(commentsMap);
        setSelectedRiskFactors(Array.from(selectedFactors));
      } catch (error) {
        console.error('Error loading risk ratings:', error);
      }
    }

    loadExistingRatings();
  }, [riskTypeId, targetId, processArea, year, subcategoriesList]);

  useEffect(() => {
    if (!onChange) return;
    onChange({
      selectedRiskFactors,
      riskRatings,
      riskComments,
      ratingsPayload: buildRiskRatingsPayload(riskRatings, riskComments)
    });
  }, [selectedRiskFactors, riskRatings, riskComments, onChange]);

  if (loading) {
    return (
      <div className="section">
        <label className="sectiontitle">{title}</label>
        <p style={{ color: '#666', fontStyle: 'italic' }}>Loading risk factors...</p>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="sectionrow" style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: '0 0 30%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label className="sectiontitle">{title}</label>
          {riskFactorsList.map((factor) => (
            <div key={factor.riskfactorid} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id={`risk-factor-${factor.riskfactorid}`}
                checked={selectedRiskFactors.includes(factor.riskfactorid)}
                onChange={(event) => {
                  if (event.target.checked) {
                    setSelectedRiskFactors([...selectedRiskFactors, factor.riskfactorid]);
                    return;
                  }

                  setSelectedRiskFactors(selectedRiskFactors.filter((id) => id !== factor.riskfactorid));
                  const subcatsToRemove = subcategoriesList
                    .filter((item) => item.riskfactorid === factor.riskfactorid)
                    .map((item) => item.subcategoryid);
                  const nextRatings = { ...riskRatings };
                  const nextComments = { ...riskComments };
                  subcatsToRemove.forEach((id) => {
                    delete nextRatings[id];
                    delete nextComments[id];
                  });
                  setRiskRatings(nextRatings);
                  setRiskComments(nextComments);
                }}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor={`risk-factor-${factor.riskfactorid}`} style={{ cursor: 'pointer', margin: 0 }}>
                {factor.riskfactor}
              </label>
            </div>
          ))}
        </div>

        <div style={{ flex: '0 0 65%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <label className="sectiontitle" style={{ marginLeft: '0px' }}>Ratings</label>
          {selectedRiskFactors.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>
              Select one or more risk factors to rate their subcategories
            </p>
          ) : (
            selectedRiskFactors.map((factorId) => {
              const factor = riskFactorsList.find((item) => item.riskfactorid === factorId);
              const subcategories = subcategoriesList.filter((item) => item.riskfactorid === factorId);

              return (
                <div key={factorId} style={{ marginBottom: '10px' }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>{factor?.riskfactor || 'Risk Factor'}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {subcategories.map((subcategory) => {
                      const isChecked = riskRatings[subcategory.subcategoryid] !== undefined && riskRatings[subcategory.subcategoryid] !== null;

                      return (
                        <div key={subcategory.subcategoryid} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input
                            type="checkbox"
                            id={`subcat-${subcategory.subcategoryid}`}
                            checked={isChecked}
                            onChange={(event) => {
                              if (event.target.checked) {
                                setRiskRatings({
                                  ...riskRatings,
                                  [subcategory.subcategoryid]: ''
                                });
                                setRiskComments({
                                  ...riskComments,
                                  [subcategory.subcategoryid]: ''
                                });
                                return;
                              }

                              const nextRatings = { ...riskRatings };
                              const nextComments = { ...riskComments };
                              delete nextRatings[subcategory.subcategoryid];
                              delete nextComments[subcategory.subcategoryid];
                              setRiskRatings(nextRatings);
                              setRiskComments(nextComments);
                            }}
                            style={{ cursor: 'pointer' }}
                          />
                          <label
                            htmlFor={`subcat-${subcategory.subcategoryid}`}
                            style={{ flex: '1', margin: 0, cursor: 'pointer' }}
                          >
                            {getProcessAreaLabel(subcategory)}
                          </label>
                          {isChecked && (
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flex: '0 0 62%' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', minWidth: '200px', flex: '0 0 200px' }}>
                                <label style={{ fontSize: '0.85em', marginBottom: '3px' }}>
                                  Rating<span style={{ color: 'red' }}>*</span>
                                </label>
                                <Select
                                  value={riskRatings[subcategory.subcategoryid]
                                    ? {
                                        value: riskRatings[subcategory.subcategoryid],
                                        label: riskRatings[subcategory.subcategoryid] === 1
                                          ? 'Low Risk'
                                          : riskRatings[subcategory.subcategoryid] === 2
                                            ? 'Medium Risk'
                                            : 'High Risk'
                                      }
                                    : null}
                                  onChange={(selectedOption) => {
                                    setRiskRatings({
                                      ...riskRatings,
                                      [subcategory.subcategoryid]: selectedOption ? selectedOption.value : ''
                                    });
                                  }}
                                  options={[
                                    { value: 1, label: 'Low Risk' },
                                    { value: 2, label: 'Medium Risk' },
                                    { value: 3, label: 'High Risk' }
                                  ]}
                                  styles={customStyles}
                                  placeholder="Select Rating"
                                  isClearable
                                />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: '220px' }}>
                                <label style={{ fontSize: '0.85em', marginBottom: '3px' }}>Comments</label>
                                <textarea
                                  className="textfield"
                                  value={riskComments[subcategory.subcategoryid] || ''}
                                  onChange={(event) => {
                                    setRiskComments({
                                      ...riskComments,
                                      [subcategory.subcategoryid]: event.target.value
                                    });
                                  }}
                                  placeholder="Add comments for this rating"
                                  rows={3}
                                  style={{ width: '100%', resize: 'vertical' }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default RiskFactorAssignment;
