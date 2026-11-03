import { useEffect, useState } from "react";
import { FiRotateCcw, FiX } from "react-icons/fi";
import {
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  JOB_CATEGORIES,
} from "../../utils/constants";

const emptyFilters = {
  category: "",
  location: "",
  employmentType: [],
  experienceLevel: "",
  minSalary: "",
  maxSalary: "",
};

const JobFilters = ({ filters, onChange, onClear, onClose }) => {
  const [local, setLocal] = useState({ ...emptyFilters });

  useEffect(() => {
    setLocal({
      category: filters.category || "",
      location: filters.location || "",
      employmentType: filters.employmentType || [],
      experienceLevel: filters.experienceLevel || "",
      minSalary: filters.minSalary || "",
      maxSalary: filters.maxSalary || "",
    });
  }, [filters]);

  const update = (patch) => setLocal((prev) => ({ ...prev, ...patch }));

  const toggleEmployment = (type) => {
    const selected = local.employmentType || [];
    update({
      employmentType: selected.includes(type)
        ? selected.filter((item) => item !== type)
        : [...selected, type],
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onChange(local);
    onClose?.();
  };

  const handleClear = () => {
    const reset = { ...emptyFilters, employmentType: [] };
    setLocal(reset);
    onClear();
    onClose?.();
  };

  const activeCount =
    (local.category ? 1 : 0) +
    (local.location ? 1 : 0) +
    (local.employmentType?.length || 0) +
    (local.experienceLevel ? 1 : 0) +
    (local.minSalary ? 1 : 0) +
    (local.maxSalary ? 1 : 0);

  return (
    <aside className="filters-panel">
      <div className="filters-head">
        <div>
          <h3>Filters</h3>
          <span className="filters-count">
            {activeCount ? `${activeCount} active` : "Refine your search"}
          </span>
        </div>
        <button
          type="button"
          className="icon-btn filters-close"
          onClick={onClose}
          aria-label="Close filters"
        >
          <FiX />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="filters-form">
        <div className="field">
          <label htmlFor="filter-category">Category</label>
          <select
            id="filter-category"
            value={local.category}
            onChange={(event) => update({ category: event.target.value })}
          >
            <option value="">All categories</option>
            {JOB_CATEGORIES.map((category) => (
              <option value={category} key={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="filter-location">Location</label>
          <input
            id="filter-location"
            type="text"
            placeholder="City or country"
            value={local.location}
            onChange={(event) => update({ location: event.target.value })}
          />
        </div>

        <fieldset className="filter-group">
          <legend>Employment type</legend>
          <div className="filter-checks">
            {EMPLOYMENT_TYPES.map((type) => (
              <label className="check-row" key={type}>
                <input
                  type="checkbox"
                  checked={local.employmentType.includes(type)}
                  onChange={() => toggleEmployment(type)}
                />
                <span>{type}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="field">
          <label htmlFor="filter-experience">Experience level</label>
          <select
            id="filter-experience"
            value={local.experienceLevel}
            onChange={(event) => update({ experienceLevel: event.target.value })}
          >
            <option value="">Any experience</option>
            {EXPERIENCE_LEVELS.map((level) => (
              <option value={level} key={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="filter-group">
          <legend>Expected salary (per year)</legend>
          <div className="salary-inputs">
            <input
              type="number"
              min="0"
              placeholder="Min"
              value={local.minSalary}
              onChange={(event) => update({ minSalary: event.target.value })}
              aria-label="Minimum salary"
            />
            <span>to</span>
            <input
              type="number"
              min="0"
              placeholder="Max"
              value={local.maxSalary}
              onChange={(event) => update({ maxSalary: event.target.value })}
              aria-label="Maximum salary"
            />
          </div>
        </fieldset>

        <div className="filters-actions">
          <button type="submit" className="btn btn-primary btn-block">
            Apply filters
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-block clear-btn"
            onClick={handleClear}
          >
            <FiRotateCcw /> Clear all
          </button>
        </div>
      </form>
    </aside>
  );
};

export default JobFilters;
