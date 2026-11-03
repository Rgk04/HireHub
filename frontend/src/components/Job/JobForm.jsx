import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Spinner from "../UI/Loader";
import {
  CURRENCIES,
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  JOB_CATEGORIES,
} from "../../utils/constants";

const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const buildInitialState = (job = {}) => ({
  title: job.title || "",
  category: job.category || "",
  country: job.country || "",
  city: job.city || "",
  location: job.location || "",
  employmentType: job.employmentType || "Full-time",
  experienceLevel: job.experienceLevel || "Entry Level",
  salaryType: job.fixedSalary ? "fixed" : job.salaryFrom || job.salaryTo ? "range" : "fixed",
  fixedSalary: job.fixedSalary ?? "",
  salaryFrom: job.salaryFrom ?? "",
  salaryTo: job.salaryTo ?? "",
  currency: job.currency || "INR",
  vacancies: job.vacancies ?? 1,
  deadline: toDateInput(job.deadline),
  skills: (job.skills || []).join(", "),
  description: job.description || "",
});

const JobForm = ({
  initialValues,
  onSubmit,
  submitting = false,
  submitLabel = "Publish job",
  cancelTo = "/employer/jobs",
}) => {
  const [form, setForm] = useState(() => buildInitialState(initialValues));

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = (event) => {
    event.preventDefault();

    if (
      !form.title.trim() ||
      !form.category ||
      !form.country.trim() ||
      !form.city.trim() ||
      !form.location.trim() ||
      !form.description.trim()
    ) {
      toast.error("Please complete all required job details.");
      return;
    }
    if (form.description.trim().length < 30) {
      toast.error("Description must contain at least 30 characters.");
      return;
    }
    if (form.salaryType === "fixed" && !form.fixedSalary) {
      toast.error("Please enter a fixed salary.");
      return;
    }
    if (
      form.salaryType === "range" &&
      (!form.salaryFrom || !form.salaryTo)
    ) {
      toast.error("Please enter both minimum and maximum salary.");
      return;
    }
    if (
      form.salaryType === "range" &&
      Number(form.salaryFrom) > Number(form.salaryTo)
    ) {
      toast.error("Minimum salary cannot be greater than maximum salary.");
      return;
    }
    if (form.deadline) {
      const deadline = new Date(`${form.deadline}T23:59:59`);
      if (deadline.getTime() < Date.now()) {
        toast.error("Application deadline must be in the future.");
        return;
      }
    }

    const payload = {
      title: form.title.trim(),
      category: form.category,
      country: form.country.trim(),
      city: form.city.trim(),
      location: form.location.trim(),
      employmentType: form.employmentType,
      experienceLevel: form.experienceLevel,
      currency: form.currency,
      vacancies: Number(form.vacancies) || 1,
      deadline: form.deadline || "",
      skills: form.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
      description: form.description.trim(),
      fixedSalary: form.salaryType === "fixed" ? Number(form.fixedSalary) : "",
      salaryFrom: form.salaryType === "range" ? Number(form.salaryFrom) : "",
      salaryTo: form.salaryType === "range" ? Number(form.salaryTo) : "",
    };

    onSubmit(payload);
  };

  return (
    <form className="job-form" onSubmit={handleSubmit}>
      <section className="panel">
        <div className="panel-head">
          <h2>Job details</h2>
          <p>Basic information candidates will see first.</p>
        </div>
        <div className="form-grid">
          <div className="field field-span-2">
            <label htmlFor="job-title">Job title *</label>
            <input
              id="job-title"
              type="text"
              placeholder="e.g. React Frontend Developer"
              value={form.title}
              onChange={(event) => update({ title: event.target.value })}
              maxLength={120}
            />
          </div>
          <div className="field">
            <label htmlFor="job-category">Category *</label>
            <select
              id="job-category"
              value={form.category}
              onChange={(event) => update({ category: event.target.value })}
            >
              <option value="">Select category</option>
              {JOB_CATEGORIES.map((category) => (
                <option value={category} key={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="job-employment">Employment type *</label>
            <select
              id="job-employment"
              value={form.employmentType}
              onChange={(event) => update({ employmentType: event.target.value })}
            >
              {EMPLOYMENT_TYPES.map((type) => (
                <option value={type} key={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="job-country">Country *</label>
            <input
              id="job-country"
              type="text"
              placeholder="e.g. India"
              value={form.country}
              onChange={(event) => update({ country: event.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="job-city">City *</label>
            <input
              id="job-city"
              type="text"
              placeholder="e.g. Bengaluru"
              value={form.city}
              onChange={(event) => update({ city: event.target.value })}
            />
          </div>
          <div className="field field-span-2">
            <label htmlFor="job-location">Work location *</label>
            <input
              id="job-location"
              type="text"
              placeholder="e.g. Hebbal, Bengaluru (Hybrid)"
              value={form.location}
              onChange={(event) => update({ location: event.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="job-experience">Experience level *</label>
            <select
              id="job-experience"
              value={form.experienceLevel}
              onChange={(event) => update({ experienceLevel: event.target.value })}
            >
              {EXPERIENCE_LEVELS.map((level) => (
                <option value={level} key={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="job-vacancies">Openings</label>
            <input
              id="job-vacancies"
              type="number"
              min="1"
              max="10000"
              value={form.vacancies}
              onChange={(event) => update({ vacancies: event.target.value })}
            />
          </div>
          <div className="field field-span-2">
            <label htmlFor="job-skills">Skills</label>
            <input
              id="job-skills"
              type="text"
              placeholder="React, JavaScript, CSS (comma separated)"
              value={form.skills}
              onChange={(event) => update({ skills: event.target.value })}
            />
            <span className="field-hint">
              Separate skills with commas. Up to 20 skills.
            </span>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Compensation &amp; timeline</h2>
          <p>Set a salary and an optional application deadline.</p>
        </div>

        <div className="salary-toggle" role="group" aria-label="Salary type">
          <button
            type="button"
            className={form.salaryType === "fixed" ? "is-active" : ""}
            onClick={() => update({ salaryType: "fixed" })}
          >
            Fixed salary
          </button>
          <button
            type="button"
            className={form.salaryType === "range" ? "is-active" : ""}
            onClick={() => update({ salaryType: "range" })}
          >
            Salary range
          </button>
        </div>

        <div className="form-grid">
          {form.salaryType === "fixed" ? (
            <div className="field">
              <label htmlFor="job-fixed-salary">Annual salary *</label>
              <input
                id="job-fixed-salary"
                type="number"
                min="0"
                placeholder="e.g. 900000"
                value={form.fixedSalary}
                onChange={(event) => update({ fixedSalary: event.target.value })}
              />
            </div>
          ) : (
            <>
              <div className="field">
                <label htmlFor="job-salary-from">Minimum salary *</label>
                <input
                  id="job-salary-from"
                  type="number"
                  min="0"
                  placeholder="e.g. 600000"
                  value={form.salaryFrom}
                  onChange={(event) => update({ salaryFrom: event.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="job-salary-to">Maximum salary *</label>
                <input
                  id="job-salary-to"
                  type="number"
                  min="0"
                  placeholder="e.g. 1000000"
                  value={form.salaryTo}
                  onChange={(event) => update({ salaryTo: event.target.value })}
                />
              </div>
            </>
          )}
          <div className="field">
            <label htmlFor="job-currency">Currency</label>
            <select
              id="job-currency"
              value={form.currency}
              onChange={(event) => update({ currency: event.target.value })}
            >
              {CURRENCIES.map((currency) => (
                <option value={currency} key={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="job-deadline">Application deadline</label>
            <input
              id="job-deadline"
              type="date"
              value={form.deadline}
              onChange={(event) => update({ deadline: event.target.value })}
            />
            <span className="field-hint">Leave blank for no deadline.</span>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Job description</h2>
          <p>Describe the role, responsibilities and what you are looking for.</p>
        </div>
        <div className="field">
          <label htmlFor="job-description">Description *</label>
          <textarea
            id="job-description"
            rows={10}
            maxLength={5000}
            placeholder="Write a clear description of the role, responsibilities, requirements and benefits…"
            value={form.description}
            onChange={(event) => update({ description: event.target.value })}
          />
          <span className="field-hint">
            {form.description.length} / 5000 characters (minimum 30)
          </span>
        </div>
      </section>

      <div className="form-actions">
        <Link to={cancelTo} className="btn btn-secondary">
          Cancel
        </Link>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting && <Spinner size="sm" />}
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default JobForm;
