import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiBriefcase,
  FiEdit3,
  FiPlusCircle,
  FiSearch,
  FiTrash2,
  FiUsers,
  FiX,
} from "react-icons/fi";
import api, { getErrorMessage } from "../api/axios";
import {
  formatDate,
  formatSalary,
  jobStatus,
  pluralize,
  timeAgo,
} from "../utils/format";
import StatusBadge from "../components/UI/StatusBadge";
import EmptyState from "../components/UI/EmptyState";
import Pagination from "../components/UI/Pagination";
import ConfirmDialog from "../components/UI/ConfirmDialog";
import { TableSkeleton } from "../components/UI/Loader";

const STATUS_TABS = [
  { value: "all", label: "All jobs" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
];

const EmployerJobs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get("status") || "all";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const query = searchParams.get("q") || "";

  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, expired: 0 });
  const [pagination, setPagination] = useState({
    totalJobs: 0,
    totalPages: 1,
    currentPage: 1,
  });
  const [searchInput, setSearchInput] = useState(query);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: 8 };
      if (status !== "all") params.status = status;
      if (query) params.q = query;
      const { data } = await api.get("/job/getmyjobs", { params });
      setJobs(data.jobs || []);
      setStats(data.stats || { total: 0, active: 0, expired: 0 });
      setPagination({
        totalJobs: data.totalJobs || 0,
        totalPages: data.totalPages || 1,
        currentPage: data.currentPage || 1,
      });
    } catch (err) {
      setError(getErrorMessage(err, "Could not load your job listings."));
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [page, status, query]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  const updateParams = (patch, resetPage = true) => {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(patch)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    if (resetPage) params.delete("page");
    setSearchParams(params);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    updateParams({ q: searchInput.trim() });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { data } = await api.delete(`/job/delete/${deleteTarget._id}`);
      toast.success(data.message);
      setDeleteTarget(null);
      await fetchJobs();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="employer-jobs-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            <FiBriefcase /> Hiring workspace
          </span>
          <h1>My job listings</h1>
          <p>Manage openings, track applicants and keep listings current.</p>
        </div>
        <Link to="/employer/jobs/new" className="btn btn-primary">
          <FiPlusCircle /> Post a job
        </Link>
      </div>

      <div className="mini-stats">
        <div>
          <span>All listings</span>
          <strong>{stats.total || 0}</strong>
        </div>
        <div>
          <span>Active</span>
          <strong>{stats.active || 0}</strong>
        </div>
        <div>
          <span>Expired</span>
          <strong>{stats.expired || 0}</strong>
        </div>
      </div>

      <div className="toolbar">
        <div className="tabs tabs-inline" role="tablist" aria-label="Filter jobs">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={status === tab.value}
              className={`tab ${status === tab.value ? "is-active" : ""}`}
              onClick={() => updateParams({ status: tab.value === "all" ? "" : tab.value })}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <form className="toolbar-search" onSubmit={handleSearch}>
          <FiSearch />
          <input
            type="search"
            placeholder="Search by title, category or city"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            aria-label="Search your jobs"
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
        </form>
      </div>

      {loading ? (
        <TableSkeleton rows={5} />
      ) : error ? (
        <EmptyState
          icon={<FiBriefcase />}
          title="Could not load job listings"
          message={error}
          action={
            <button type="button" className="btn btn-primary" onClick={fetchJobs}>
              Try again
            </button>
          }
        />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={<FiBriefcase />}
          title={
            query || status !== "all"
              ? "No listings match this view"
              : "You have not posted a job yet"
          }
          message={
            query || status !== "all"
              ? "Try a different search or status filter."
              : "Create your first listing to start receiving applications."
          }
          action={
            query || status !== "all" ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSearchParams({})}
              >
                Clear filters
              </button>
            ) : (
              <Link to="/employer/jobs/new" className="btn btn-primary">
                Post your first job
              </Link>
            )
          }
        />
      ) : (
        <>
          <div className="employer-job-list">
            {jobs.map((job) => {
              const jobState = jobStatus(job);
              return (
                <article className="employer-job-row" key={job._id}>
                  <div className="employer-job-main">
                    <div className="employer-job-title">
                      <Link to={`/jobs/${job._id}`}>{job.title}</Link>
                      <StatusBadge status={jobState} />
                    </div>
                    <div className="application-meta">
                      <span>{job.category}</span>
                      <span>
                        {job.city}, {job.country}
                      </span>
                      <span>{formatSalary(job)}</span>
                      <span>Posted {timeAgo(job.jobPostedOn)}</span>
                    </div>
                  </div>

                  <div className="employer-job-metrics">
                    <div>
                      <strong>{job.applicantsCount ?? job.applicationsCount ?? 0}</strong>
                      <span>Applicants</span>
                    </div>
                    <div>
                      <strong>{job.pendingCount || 0}</strong>
                      <span>Pending</span>
                    </div>
                    <div>
                      <strong>{job.hiredCount || 0}</strong>
                      <span>Hired</span>
                    </div>
                  </div>

                  <div className="employer-job-actions">
                    <Link
                      to={`/employer/applicants?jobId=${job._id}`}
                      className="btn btn-secondary btn-sm"
                      title={`${pluralize(job.applicantsCount || 0, "applicant")}`}
                    >
                      <FiUsers /> Applicants
                    </Link>
                    <Link
                      to={`/employer/jobs/${job._id}/edit`}
                      className="btn btn-ghost btn-sm"
                    >
                      <FiEdit3 /> Edit
                    </Link>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm text-danger"
                      onClick={() => setDeleteTarget(job)}
                    >
                      <FiTrash2 /> Delete
                    </button>
                  </div>

                  {job.deadline && (
                    <span className="employer-job-deadline">
                      Applications close {formatDate(job.deadline)}
                    </span>
                  )}
                </article>
              );
            })}
          </div>
          <Pagination
            page={pagination.currentPage}
            totalPages={pagination.totalPages}
            onChange={(value) =>
              updateParams({ page: value > 1 ? String(value) : "" }, false)
            }
          />
        </>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this job listing?"
        message={`Deleting "${deleteTarget?.title}" will also permanently remove all ${
          deleteTarget?.applicantsCount || 0
        } associated application(s). This action cannot be undone.`}
        confirmLabel="Delete job"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default EmployerJobs;
