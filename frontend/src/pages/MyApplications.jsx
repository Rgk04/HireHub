import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiBriefcase,
  FiCalendar,
  FiChevronRight,
  FiFileText,
  FiMapPin,
  FiXCircle,
} from "react-icons/fi";
import api, { getErrorMessage } from "../api/axios";
import {
  APPLICATION_STATUS_FILTERS,
} from "../utils/constants";
import {
  formatDate,
  formatSalary,
  initials,
  statusLabel,
  timeAgo,
} from "../utils/format";
import StatusBadge from "../components/UI/StatusBadge";
import EmptyState from "../components/UI/EmptyState";
import Pagination from "../components/UI/Pagination";
import ConfirmDialog from "../components/UI/ConfirmDialog";
import Modal from "../components/UI/Modal";
import { TableSkeleton } from "../components/UI/Loader";

const MyApplications = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get("status") || "all";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({
    totalApplications: 0,
    totalPages: 1,
    currentPage: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [withdrawTarget, setWithdrawTarget] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/application/jobseeker/getall", {
        params: { status, page, limit: 8 },
      });
      setApplications(data.applications || []);
      setStats(data.stats || null);
      setPagination({
        totalApplications: data.totalApplications || 0,
        totalPages: data.totalPages || 1,
        currentPage: data.currentPage || 1,
      });
    } catch (err) {
      setError(getErrorMessage(err, "Could not load your applications."));
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const setFilter = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") params.delete("status");
    else params.set("status", value);
    params.delete("page");
    setSearchParams(params);
  };

  const setPage = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value <= 1) params.delete("page");
    else params.set("page", value);
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleWithdraw = async () => {
    if (!withdrawTarget) return;
    setWithdrawing(true);
    try {
      await api.put(`/application/withdraw/${withdrawTarget._id}`);
      toast.success("Application withdrawn.");
      setWithdrawTarget(null);
      setSelected(null);
      await fetchApplications();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setWithdrawing(false);
    }
  };

  const canWithdraw = (application) =>
    ["pending", "shortlisted"].includes(application.status);

  const summary = stats || {
    total: 0,
    pending: 0,
    shortlisted: 0,
    hired: 0,
    rejected: 0,
    withdrawn: 0,
  };

  return (
    <div className="applications-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            <FiFileText /> Application tracker
          </span>
          <h1>My applications</h1>
          <p>Follow every application from submission to hiring decision.</p>
        </div>
        <Link to="/jobs" className="btn btn-primary">
          Find more jobs
        </Link>
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

      <div className="tabs" role="tablist" aria-label="Filter applications">
        {APPLICATION_STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            role="tab"
            aria-selected={status === filter.value}
            className={`tab ${status === filter.value ? "is-active" : ""}`}
            onClick={() => setFilter(filter.value)}
          >
            {filter.label}
            {filter.value !== "all" && (
              <span className="tab-count">{summary[filter.value] || 0}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <TableSkeleton rows={5} />
      ) : error ? (
        <EmptyState
          icon={<FiBriefcase />}
          title="Could not load applications"
          message={error}
          action={
            <button type="button" className="btn btn-primary" onClick={fetchApplications}>
              Try again
            </button>
          }
        />
      ) : applications.length === 0 ? (
        <EmptyState
          icon={<FiFileText />}
          title={
            status === "all"
              ? "No applications yet"
              : `No ${statusLabel(status).toLowerCase()} applications`
          }
          message={
            status === "all"
              ? "When you apply for a job, it will appear here with live status updates."
              : "Try a different filter to see your other applications."
          }
          action={
            status === "all" ? (
              <Link to="/jobs" className="btn btn-primary">
                Browse jobs
              </Link>
            ) : (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setFilter("all")}
              >
                Show all applications
              </button>
            )
          }
        />
      ) : (
        <>
          <div className="application-list">
            {applications.map((application) => {
              const job = application.jobId || {};
              const employer = application.employerID || {};
              const companyName =
                job.company ||
                employer.profile?.companyName ||
                employer.name ||
                "Company";
              return (
                <article className="application-row" key={application._id}>
                  <div className="company-avatar">
                    {employer.avatar?.url ? (
                      <img src={employer.avatar.url} alt="" />
                    ) : (
                      <span>{initials(companyName)}</span>
                    )}
                  </div>
                  <div className="application-main">
                    <div className="application-title">
                      <Link to={`/jobs/${job._id}`} className="application-job">
                        {job.title || "Job listing removed"}
                      </Link>
                      <StatusBadge status={application.status} />
                    </div>
                    <p className="application-company">{companyName}</p>
                    <div className="application-meta">
                      <span>
                        <FiMapPin />
                        {[job.city, job.country].filter(Boolean).join(", ") ||
                          "Location not specified"}
                      </span>
                      <span>
                        <FiCalendar /> Applied {timeAgo(application.createdAt)}
                      </span>
                      {job.fixedSalary || job.salaryFrom ? (
                        <span>
                          <FiBriefcase /> {formatSalary(job)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="application-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelected(application)}
                    >
                      View details <FiChevronRight />
                    </button>
                    {canWithdraw(application) && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm text-danger"
                        onClick={() => setWithdrawTarget(application)}
                      >
                        Withdraw
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          <Pagination
            page={pagination.currentPage}
            totalPages={pagination.totalPages}
            onChange={setPage}
          />
        </>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.jobId?.title || "Application details"}
        subtitle={selected?.jobId?.company || selected?.employerID?.name}
        size="lg"
        footer={
          selected && canWithdraw(selected) ? (
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => setWithdrawTarget(selected)}
              >
                <FiXCircle /> Withdraw application
              </button>
            </div>
          ) : (
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
          )
        }
      >
        {selected && (
          <div className="application-details">
            <div className="detail-head">
              <StatusBadge status={selected.status} />
              <span className="muted small">
                Submitted {formatDate(selected.createdAt, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <div className="detail-grid">
              <div>
                <span className="overview-label">Applied for</span>
                <strong>{selected.jobId?.title || "—"}</strong>
              </div>
              <div>
                <span className="overview-label">Company</span>
                <strong>
                  {selected.jobId?.company ||
                    selected.employerID?.profile?.companyName ||
                    selected.employerID?.name ||
                    "—"}
                </strong>
              </div>
              <div>
                <span className="overview-label">Contact email</span>
                <strong>{selected.email}</strong>
              </div>
              <div>
                <span className="overview-label">Contact phone</span>
                <strong>{selected.phone}</strong>
              </div>
            </div>

            <div className="detail-section">
              <h4>Cover letter</h4>
              <p className="detail-text">{selected.coverLetter}</p>
            </div>

            {selected.employerNote && (
              <div className="detail-section">
                <h4>Note from the employer</h4>
                <p className="detail-text">{selected.employerNote}</p>
              </div>
            )}

            <div className="detail-section">
              <h4>Status timeline</h4>
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

      <ConfirmDialog
        open={Boolean(withdrawTarget)}
        title="Withdraw this application?"
        message="The employer will be notified and you will not be able to reinstate this application. You can apply again only if the job is still open."
        confirmLabel="Withdraw application"
        loading={withdrawing}
        onConfirm={handleWithdraw}
        onClose={() => setWithdrawTarget(null)}
      />
    </div>
  );
};

export default MyApplications;
