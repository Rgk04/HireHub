import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { FiBriefcase, FiFilter, FiSearch, FiX } from "react-icons/fi";
import api, { getErrorMessage } from "../api/axios";
import { useApp } from "../context/AppContext";
import { ROLE, SORT_OPTIONS } from "../utils/constants";
import JobCard from "../components/Job/JobCard";
import JobFilters from "../components/Job/JobFilters";
import Pagination from "../components/UI/Pagination";
import EmptyState from "../components/UI/EmptyState";
import { JobGridSkeleton } from "../components/UI/Loader";

const Jobs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, savedJobIds, toggleSavedJob } = useApp();
  const resultsRef = useRef(null);
  const [data, setData] = useState({
    jobs: [],
    totalJobs: 0,
    totalPages: 1,
    currentPage: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const q = searchParams.get("q") || "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const sort = searchParams.get("sort") || "newest";
  const [searchInput, setSearchInput] = useState(q);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  const filters = useMemo(
    () => ({
      category: searchParams.get("category") || "",
      location: searchParams.get("location") || "",
      employmentType: (searchParams.get("employmentType") || "")
        .split(",")
        .filter(Boolean),
      experienceLevel: searchParams.get("experienceLevel") || "",
      minSalary: searchParams.get("minSalary") || "",
      maxSalary: searchParams.get("maxSalary") || "",
    }),
    [searchParams]
  );

  const paramsKey = searchParams.toString();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    const params = {
      page,
      limit: 9,
      sort,
    };
    if (q) params.q = q;
    if (filters.category) params.category = filters.category;
    if (filters.location) params.location = filters.location;
    if (filters.employmentType.length) {
      params.employmentType = filters.employmentType.join(",");
    }
    if (filters.experienceLevel) params.experienceLevel = filters.experienceLevel;
    if (filters.minSalary) params.minSalary = filters.minSalary;
    if (filters.maxSalary) params.maxSalary = filters.maxSalary;

    api
      .get("/job/getall", { params })
      .then(({ data: response }) => {
        if (active) {
          setData({
            jobs: response.jobs || [],
            totalJobs: response.totalJobs || 0,
            totalPages: response.totalPages || 1,
            currentPage: response.currentPage || page,
          });
        }
      })
      .catch((err) => {
        if (active) {
          setError(getErrorMessage(err, "Could not load jobs."));
          setData({ jobs: [], totalJobs: 0, totalPages: 1, currentPage: 1 });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  const updateParams = (patch, { resetPage = true } = {}) => {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(patch)) {
      const empty =
        value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0);
      if (empty) params.delete(key);
      else params.set(key, Array.isArray(value) ? value.join(",") : value);
    }
    if (resetPage) params.delete("page");
    setSearchParams(params);
    if (resetPage) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSearch = (event) => {
    event.preventDefault();
    updateParams({ q: searchInput.trim() });
  };

  const handleFilters = (next) => {
    updateParams({
      category: next.category,
      location: next.location,
      employmentType: next.employmentType,
      experienceLevel: next.experienceLevel,
      minSalary: next.minSalary,
      maxSalary: next.maxSalary,
    });
  };

  const handleClear = () => {
    updateParams({
      category: "",
      location: "",
      employmentType: [],
      experienceLevel: "",
      minSalary: "",
      maxSalary: "",
    });
  };

  const handleToggleSave = async (job) => {
    const saved = savedJobIds.has(String(job._id));
    try {
      await api[saved ? "delete" : "post"](`/job/save/${job._id}`);
      toggleSavedJob(job._id, !saved);
      toast.success(saved ? "Removed from saved jobs." : "Job saved.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handlePage = (nextPage) => {
    updateParams({ page: nextPage > 1 ? nextPage : "" }, { resetPage: false });
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const activeFilterCount =
    (filters.category ? 1 : 0) +
    (filters.location ? 1 : 0) +
    filters.employmentType.length +
    (filters.experienceLevel ? 1 : 0) +
    (filters.minSalary ? 1 : 0) +
    (filters.maxSalary ? 1 : 0);

  const canShowSaved = !user || user.role === ROLE.SEEKER;

  return (
    <div className="jobs-page">
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">
            <FiBriefcase /> {data.totalJobs || 0} opportunities available
          </span>
          <h1>Find your next role</h1>
          <p>
            Search by title, skill or company, then refine with filters to find
            the right fit.
          </p>

          <form className="jobs-search" onSubmit={handleSearch}>
            <div className="input-wrap">
              <FiSearch className="input-icon" />
              <input
                type="search"
                placeholder="Search job title, skill or company"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                aria-label="Search jobs"
              />
              {searchInput && (
                <button
                  type="button"
                  className="input-action"
                  onClick={() => {
                    setSearchInput("");
                    updateParams({ q: "" });
                  }}
                  aria-label="Clear search"
                >
                  <FiX />
                </button>
              )}
            </div>
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="section jobs-section">
        <div className="container">
          <div className="jobs-toolbar">
            <div className="jobs-toolbar-info">
              <h2>
                {loading
                  ? "Searching…"
                  : `${data.totalJobs} ${data.totalJobs === 1 ? "job" : "jobs"} found`}
              </h2>
              {q && <span>for “{q}”</span>}
            </div>
            <div className="jobs-toolbar-actions">
              <button
                type="button"
                className="btn btn-secondary filters-toggle"
                onClick={() => setFiltersOpen(true)}
              >
                <FiFilter /> Filters
                {activeFilterCount > 0 && (
                  <span className="filter-pill">{activeFilterCount}</span>
                )}
              </button>
              <label className="sort-select">
                <span>Sort by</span>
                <select
                  value={sort}
                  onChange={(event) =>
                    updateParams({ sort: event.target.value })
                  }
                >
                  {SORT_OPTIONS.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="jobs-layout">
            <div className={`filters-overlay ${filtersOpen ? "is-open" : ""}`}>
              <div
                className="filters-backdrop"
                onClick={() => setFiltersOpen(false)}
              />
              <div className={`filters-drawer ${filtersOpen ? "is-open" : ""}`}>
                <JobFilters
                  filters={filters}
                  onChange={handleFilters}
                  onClear={handleClear}
                  onClose={() => setFiltersOpen(false)}
                />
              </div>
            </div>

            <div className="jobs-sidebar-desktop">
              <JobFilters
                filters={filters}
                onChange={handleFilters}
                onClear={handleClear}
              />
            </div>

            <div className="jobs-results" ref={resultsRef}>
              {loading ? (
                <JobGridSkeleton count={6} />
              ) : error ? (
                <EmptyState
                  icon={<FiBriefcase />}
                  title="Could not load jobs"
                  message={error}
                  action={
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setSearchParams(new URLSearchParams(searchParams))}
                    >
                      Try again
                    </button>
                  }
                />
              ) : data.jobs.length === 0 ? (
                <EmptyState
                  icon={<FiSearch />}
                  title="No jobs match your search"
                  message="Try removing a filter, searching a broader keyword or checking back soon."
                  action={
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setSearchInput("");
                        setSearchParams({});
                      }}
                    >
                      Clear search and filters
                    </button>
                  }
                />
              ) : (
                <>
                  <div className="jobs-grid">
                    {data.jobs.map((job) => (
                      <JobCard
                        key={job._id}
                        job={job}
                        saved={canShowSaved && savedJobIds.has(String(job._id))}
                        onToggleSave={handleToggleSave}
                      />
                    ))}
                  </div>
                  <Pagination
                    page={data.currentPage}
                    totalPages={data.totalPages}
                    onChange={handlePage}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Jobs;
