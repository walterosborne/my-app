import React from 'react';
import { Controller } from 'react-hook-form';
import Select from 'react-select';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { customStyles } from '../Utilities.jsx';

const fieldName = (questionKey, findingIndex, field) =>
  `finding_${questionKey}_${findingIndex}_${field}`;

function FindingResponseFields({
  questionKey,
  findingIndex,
  responseNumber,
  control,
  register,
  corporatePrOPOptions,
  sectorPrOPOptions,
  divisionPrOPOptions,
  otherPrOPOptions,
  getObjectiveEvidenceOptions,
  normalizeFileIds,
  onDelete
}) {
  return (
    <div className="finding-response-editor">
      <input type="hidden" {...register(fieldName(questionKey, findingIndex, 'id'))} />
      <div className="finding-response-editor__header">
        <strong>Response {responseNumber}</strong>
        <button
          type="button"
          className="finding-response-editor__delete"
          onClick={onDelete}
        >
          × Delete Response
        </button>
      </div>

      <div className="fieldboxwhole">
        <label>Finding Type</label>
        <Controller
          name={fieldName(questionKey, findingIndex, 'findingType')}
          control={control}
          render={({ field }) => (
            <ToggleButtonGroup
              {...field}
              exclusive
              onChange={(event, newValue) => {
                if (newValue !== null) field.onChange(newValue);
              }}
              aria-label="finding type"
            >
              <ToggleButton value="Nonconformity" aria-label="nonconformity" sx={{ textTransform: 'none' }}>
                Nonconformity
              </ToggleButton>
              <ToggleButton value="Conformity" aria-label="conformity" sx={{ textTransform: 'none' }}>
                Conformity
              </ToggleButton>
              <ToggleButton value="OFI" aria-label="OFI" sx={{ textTransform: 'none' }}>
                OFI
              </ToggleButton>
              <ToggleButton value="OBS" aria-label="OBS" sx={{ textTransform: 'none' }}>
                OBS
              </ToggleButton>
            </ToggleButtonGroup>
          )}
        />
      </div>

      <div className="sectionrow">
        <div className="fieldboxhalf">
          <label>Auditor Comment</label>
          <textarea
            {...register(fieldName(questionKey, findingIndex, 'auditorComment'))}
            style={{ width: '100%', height: '100px', resize: 'vertical' }}
            className="textfield"
          />
        </div>
        <div className="fieldboxhalf">
          <label>Auditee Response</label>
          <textarea
            {...register(fieldName(questionKey, findingIndex, 'response'))}
            style={{ width: '100%', height: '100px', resize: 'vertical' }}
            className="textfield"
          />
        </div>
      </div>

      <div className="sectionrow">
        <div className="fieldboxquarter">
          <label>PrOP - Corporate</label>
          <Controller
            name={fieldName(questionKey, findingIndex, 'qma')}
            control={control}
            render={({ field }) => (
              <Select
                isClearable
                isMulti
                closeMenuOnSelect={false}
                options={corporatePrOPOptions}
                styles={customStyles}
                placeholder="Corporate"
                value={field.value ? corporatePrOPOptions.filter((p) => field.value.includes(p.value)) : []}
                onChange={(selected) => field.onChange(selected ? selected.map((option) => option.value) : [])}
              />
            )}
          />
        </div>

        <div className="fieldboxquarter">
          <label>PrOP - Sector</label>
          <Controller
            name={fieldName(questionKey, findingIndex, 'sector')}
            control={control}
            render={({ field }) => (
              <Select
                isClearable
                isMulti
                closeMenuOnSelect={false}
                options={sectorPrOPOptions}
                styles={customStyles}
                placeholder="Sector"
                value={field.value ? sectorPrOPOptions.filter((p) => field.value.includes(p.value)) : []}
                onChange={(selected) => field.onChange(selected ? selected.map((option) => option.value) : [])}
              />
            )}
          />
        </div>

        <div className="fieldboxquarter">
          <label>PrOP - Division</label>
          <Controller
            name={fieldName(questionKey, findingIndex, 'division')}
            control={control}
            render={({ field }) => (
              <Select
                isClearable
                isMulti
                closeMenuOnSelect={false}
                options={divisionPrOPOptions}
                styles={customStyles}
                placeholder="Division"
                value={field.value ? divisionPrOPOptions.filter((p) => field.value.includes(p.value)) : []}
                onChange={(selected) => field.onChange(selected ? selected.map((option) => option.value) : [])}
              />
            )}
          />
        </div>

        <div className="fieldboxquarter">
          <label>PrOP - Other</label>
          <Controller
            name={fieldName(questionKey, findingIndex, 'other')}
            control={control}
            render={({ field }) => (
              <Select
                isClearable
                isMulti
                closeMenuOnSelect={false}
                options={otherPrOPOptions}
                styles={customStyles}
                placeholder="Other"
                value={field.value ? otherPrOPOptions.filter((p) => field.value.includes(p.value)) : []}
                onChange={(selected) => field.onChange(selected ? selected.map((option) => option.value) : [])}
              />
            )}
          />
        </div>
      </div>

      <div className="sectionrow">
        <div className="fieldboxwhole">
          <label>Objective Evidence</label>
          <Controller
            name={fieldName(questionKey, findingIndex, 'files')}
            control={control}
            render={({ field }) => {
              const options = getObjectiveEvidenceOptions(field.value);
              const selectedFileIds = normalizeFileIds(field.value);
              return (
                <Select
                  isClearable
                  isMulti
                  closeMenuOnSelect={false}
                  options={options}
                  styles={customStyles}
                  placeholder="Select files"
                  value={selectedFileIds.length > 0
                    ? options.filter((file) => selectedFileIds.includes(file.value))
                    : []}
                  onChange={(selected) => field.onChange(selected ? selected.map((option) => option.value) : [])}
                />
              );
            }}
          />
        </div>
      </div>
    </div>
  );
}

export { fieldName as getFindingFieldName };
export default FindingResponseFields;
