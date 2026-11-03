import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiCalendar,
  FiChevronRight,
  FiDownload,
  FiMail,
  FiMapPin,
  FiPhone,
  FiSearch,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";
import api, { getErrorMessage, resumeDownloadUrl } from "../api/axios";
import { APPLICATION_STATUS_FILTERS } from "../utils/constants";
import {
  formatDate,
  statusLabel,
  timeAgo,
} from "../utils/format";
import Avatar from "../components/UI/Avatar";
import StatusBadge from "../components/UI/StatusBadge";
import EmptyState from "../components/UI/EmptyState";
import Pagination from "../components/UI/Pagination";
import Modal from "../components/UI/Modal";
import Spinner, { TableSkeleton } from "../components/UI/Loader";
import CandidateProfileModal from "../components/Application/CandidateProfileModal";

const STATUS_OPTIONS = ["pending", "shortlisted", "rejected", "hired"];

const Applicants = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get("status") || "all";
  const jobId = searchParams.get("jobId") || "";
  const query = searchParams.get("q") || "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({
    totalApplications: 0,
    totalPages: 1,
    currentPage: 1,
  });
  const [searchInput, setSearchInput] = useState(query);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [candidateId, setCandidateId] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: "pending", note: "" });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    api
      .get("/job/getmyjobs", { params: { limit: 50 } })
      .then(({ data }) => setJobs(data.jobs || []))
      .catch(() => {});
  }, []);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: 8 };
      if (status !== "all") params.status = status;
      if (jobId) params.jobId = jobId;
      if (query) params.q = query;
      const { data } = await api.get("/application/employer/getall", {
        params,
      });
      setApplications(data.applications || []);
      setStats(data.stats || null);
      setPagination({
        totalApplications: data.totalApplications || 0,
        totalPages: data.totalPages || 1,
        currentPage: data.currentPage || 1,
      });
    } catch (err) {
      setError(getErrorMessage(err, "Could not load applicants."));
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [page, status, jobId, query]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

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

  const openApplication = (application) => {
    setSelected(application);
    setStatusForm({
      status: STATUS_OPTIONS.includes(application.status)
        ? application.status
        : "pending",
      note: "",
    });
  };

  const handleStatusUpdate = async () => {
    if (!selected) return;
    if (statusForm.status === selected.status) {
      toast.error("Please choose a different status.");
      return;
    }
    setUpdating(true);
    try {
      const { data } = await api.put(`/application/status/${selected._id}`, {
        status: statusForm.status,
        note: statusForm.note.trim(),
      });
      toast.success(data.message);
      setSelected(null);
      await fetchApplications();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUpdating(false);
    }
  };

  const summary = stats || {
    total: 0,
    pending: 0,
    shortlisted: 0,
    hired: 0,
    rejected: 0,
    withdrawn: 0,
  };

  return (
    <div className="applicants-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            <FiUsers /> Candidate pipeline
          </span>
          <h1>Applicants</h1>
          <p>Review candidates, download resumes and move them forward.</p>
        </div>
      </div>

      <div className="mini-stats">
        <div>
          <span>Total</span>
          <strong>{summary.total}</strong>
        </div>
        <div>
          <span>Pending</span>
          <strong>{summary.pending}</strong>
        </div>
        <div>
          <span>Shortlisted</span>
          <strong>{summary.shortlisted}</strong>
        </div>
        <div>
          <span>Hired</span>
          <strong>{summary.hired}</strong>
        </div>
        <div>
          <span>Rejected</span>
          <strong>{summary.rejected}</strong>
        </div>
        <div>
          <span>Withdrawn</span>
          <strong>{summary.withdrawn}</strong>
        </div>
      </div>

      <div className="toolbar toolbar-wrap">
        <div className="tabs tabs-inline" role="tablist" aria-label="Filter applicants">
          {APPLICATION_STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              role="tab"
              aria-selected={status === filter.value}
              className={`tab ${status === filter.value ? "is-active" : ""}`}
              onClick={() =>
                updateParams({
                  status: filter.value === "all" ? "" : filter.value,
                })
              }
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="toolbar-controls">
          <label className="select-inline">
            <span>Job</span>
            <select
              value={jobId}
              onChange={(event) => updateParams({ jobId: event.target.value })}
            >
              <option value="">All jobs</option>
              {jobs.map((job) => (
                <option value={job._id} key={job._id}>
                  {job.title}
                </option>
              ))}
            </select>
          </label>
          <form
            className="toolbar-search"
            onSubmit={(event) => {
              event.preventDefault();
              updateParams({ q: searchInput.trim() });
            }}
          >
            <FiSearch />
            <input
              type="search"
              placeholder="Search name, email or cover letter"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              aria-label="Search applicants"
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
      </div>

      {loading ? (
        <TableSkeleton rows={5} />
      ) : error ? (
        <EmptyState
          icon={<FiUsers />}
          title="Could not load applicants"
          message={error}
          action={
            <button
              type="button"
              className="btn btn-primary"
              onClick={fetchApplications}
            >
              Try again
            </button>
          }
        />
      ) : applications.length === 0 ? (
        <EmptyState
          icon={<FiUsers />}
          title={
            jobId || status !== "all" || query
              ? "No applicants match this view"
              : "No applicants yet"
          }
          message={
            jobId || status !== "all" || query
              ? "Try another job, status or search term."
              : "As soon as candidates apply to your jobs, they will appear here."
          }
          action={
            jobId || status !== "all" || query ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSearchParams({})}
              >
                Clear filters
              </button>
            ) : null
          }
        />
      ) : (
        <>
          <div className="applicant-list">
            {applications.map((application) => (
              <article className="applicant-card" key={application._id}>
                <Avatar
                  src={application.applicantID?.avatar?.url}
                  name={application.name}
                  size="md"
                />
                <div className="applicant-main">
                  <div className="applicant-title">
                    <strong>{application.name}</strong>
                    <StatusBadge status={application.status} />
                  </div>
                  <p className="applicant-role">
                    {application.jobId?.title || "Job listing removed"}
                  </p>
                  <div className="application-meta">
                    <span>
                      <FiMail /> {application.email}
                    </span>
                    <span>
                      <FiPhone /> {application.phone}
                    </span>
                    <span>
                      <FiCalendar /> Applied {timeAgo(application.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="applicant-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => openApplication(application)}
                  >
                    Review <FiChevronRight />
                  </button>
                  <a
                    href={resumeDownloadUrl(application._id)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost btn-sm"
                  >
                    <FiDownload /> Resume
                  </a>
                </div>
              </article>
            ))}
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

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name || "Applicant"}
        subtitle={selected?.jobId?.title}
        size="lg"
        footer={
          selected && selected.status !== "withdrawn" ? (
            <div className="status-update">
              <div className="status-update-fields">
                <label className="select-inline">
                  <span>Status</span>
                  <select
                    value={statusForm.status}
                    onChange={(event) =>
                      setStatusForm((prev) => ({
                        ...prev,
                        status: event.target.value,
                      }))
                    }
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option value={option} key={option}>
                        {statusLabel(option)}
                      </option>
                    ))}
                  </select>
                </label>
                <input
                  type="text"
                  placeholder="Optional note for the candidate"
                  value={statusForm.note}
                  onChange={(event) =>
                    setStatusForm((prev) => ({
                      ...prev,
                      note: event.target.value,
                    }))
                  }
                  maxLength={1000}
                />
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleStatusUpdate}
                disabled={updating}
              >
                {updating && <Spinner size="sm" />}
                {updating ? "Updating…" : "Update status"}
              </button>
            </div>
          ) : null
        }
      >
        {selected && (
          <div className="application-details">
            <div className="detail-head">
              <StatusBadge status={selected.status} />
              <span className="muted small">
                Applied{" "}
                {formatDate(selected.createdAt, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <div className="candidate-quick">
              <Avatar
                src={selected.applicantID?.avatar?.url}
                name={selected.name}
                size="lg"
              />
              <div>
                <strong>{selected.name}</strong>
                <span>{selected.email}</span>
                <span>{selected.phone}</span>
              </div>
              <div className="candidate-quick-actions">
                {selected.applicantID?._id && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setCandidateId(selected.applicantID._id)}
                  >
                    <FiUser /> Profile
                  </button>
                )}
                <a
                  href={resumeDownloadUrl(selected._id)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                >
                  <FiDownload /> Resume
                </a>
              </div>
            </div>

            <div className="detail-grid">
              <div>
                <span className="overview-label">Address</span>
                <strong>
                  <FiMapPin /> {selected.address}
                </strong>
              </div>
              <div>
                <span className="overview-label">Job applied for</span>
                <strong>{selected.jobId?.title || "—"}</strong>
              </div>
              <div>
                <span className="overview-label">Resume file</span>
                <strong>{selected.resume?.originalName || "Resume"}</strong>
              </div>
              <div>
                <span className="overview-label">Current status</span>
                <strong>{statusLabel(selected.status)}</strong>
              </div>
            </div>

            <div className="detail-section">
              <h4>Cover letter</h4>
              <p className="detail-text">{selected.coverLetter}</p>
            </div>

            {selected.employerNote && (
              <div className="detail-section">
                <h4>Your latest note</h4>
                <p className="detail-text">{selected.employerNote}</p>
              </div>
            )}

            <div className="detail-section">
              <h4>Status history</h4>
              <ul className="timeline-list">
                {(selected.statusHistory || []).map((entry, index) => (
                  <li key={`${entry.status}-${index}`}>
                    <div className="timeline-dot" />
                    <div>
                      <strong>{statusLabel(entry.status)}</strong>
                      <span className="timeline-date">
                        {formatDate(entry.changedAt, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {entry.note && <p>{entry.note}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Modal>

      <CandidateProfileModal
        candidateId={candidateId}
        open={Boolean(candidateId)}
        onClose={() => setCandidateId(null)}
      />
    </div>
  );
};

export default Applicants;
