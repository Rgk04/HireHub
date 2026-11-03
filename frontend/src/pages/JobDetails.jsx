import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiBookmark,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiEdit3,
  FiExternalLink,
  FiGlobe,
  FiMapPin,
  FiUsers,
} from "react-icons/fi";
import api, { getErrorMessage } from "../api/axios";
import { useApp } from "../context/AppContext";
import { ROLE } from "../utils/constants";
import {
  formatDate,
  formatSalary,
  initials,
  jobStatus,
  timeAgo,
} from "../utils/format";
import JobCard from "../components/Job/JobCard";
import StatusBadge from "../components/UI/StatusBadge";
import EmptyState from "../components/UI/EmptyState";
import { PageLoader } from "../components/UI/Loader";

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthorized, savedJobIds, toggleSavedJob } = useApp();
  const [job, setJob] = useState(null);
  const [related, setRelated] = useState([]);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    Promise.all([
      api.get(`/job/${id}`),
      api.get(`/job/${id}/related`).catch(() => ({ data: { jobs: [] } })),
    ])
      .then(([jobRes, relatedRes]) => {
        if (!active) return;
        setJob(jobRes.data.job);
        setRelated(relatedRes.data.jobs || []);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, "This job could not be found."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!isAuthorized || user?.role !== ROLE.SEEKER) return;
    let active = true;
    api
      .get(`/application/check/${id}`)
      .then(({ data }) => {
        if (active) setApplication(data.applied ? data.application : null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [id, isAuthorized, user?.role]);

  if (loading) return <PageLoader label="Loading job details…" />;

  if (error || !job) {
    return (
      <div className="container section">
        <EmptyState
          icon={<FiBriefcase />}
          title="Job not found"
          message={error || "This job listing may have been removed."}
          action={
            <Link to="/jobs" className="btn btn-primary">
              Browse all jobs
            </Link>
          }
        />
      </div>
    );
  }

  const status = jobStatus(job);
  const isExpired = status === "expired";
  const isOwner =
    user?._id && job.postedBy?._id && String(user._id) === String(job.postedBy._id);
  const isSaved = savedJobIds.has(String(job._id));
  const companyName =
    job.companyName ||
    job.company ||
    job.postedBy?.profile?.companyName ||
    job.postedBy?.name;
  const companyLogo = job.postedBy?.avatar?.url;
  const employerProfile = job.postedBy?.profile || {};

  const handleToggleSave = async () => {
    if (!isAuthorized) {
      toast("Log in as a job seeker to save jobs.");
      navigate("/login", { state: { from: location } });
      return;
    }
    if (user.role !== ROLE.SEEKER) {
      toast.error("Only job seekers can save jobs.");
      return;
    }
    setSaving(true);
    try {
      await api[isSaved ? "delete" : "post"](`/job/save/${job._id}`);
      toggleSavedJob(job._id, !isSaved);
      toast.success(isSaved ? "Removed from saved jobs." : "Job saved.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const canSave = !user || user.role === ROLE.SEEKER;

  const renderApplyAction = () => {
    if (!isAuthorized) {
      return (
        <button
          type="button"
          className="btn btn-primary btn-block btn-lg"
          onClick={() => navigate("/login", { state: { from: location } })}
        >
          Log in to apply
        </button>
      );
    }
    if (user.role === ROLE.SEEKER) {
      if (application) {
        return (
          <>
            <div className="applied-note">
              <FiCheckCircle />
              <div>
                <strong>You have applied</strong>
                <span>
                  Current status: <StatusBadge status={application.status} />
                </span>
              </div>
            </div>
            <Link to="/applications" className="btn btn-secondary btn-block">
              Track my application
            </Link>
          </>
        );
      }
      if (isExpired) {
        return (
          <button type="button" className="btn btn-secondary btn-block" disabled>
            Applications closed
          </button>
        );
      }
      return (
        <Link to={`/apply/${job._id}`} className="btn btn-primary btn-block btn-lg">
          Apply for this job
        </Link>
      );
    }
    if (user.role === ROLE.EMPLOYER) {
      if (isOwner) {
        return (
          <>
            <Link
              to={`/employer/applicants?jobId=${job._id}`}
              className="btn btn-primary btn-block"
            >
              <FiUsers /> View applicants
            </Link>
            <Link
              to={`/employer/jobs/${job._id}/edit`}
              className="btn btn-secondary btn-block"
            >
              <FiEdit3 /> Edit job
            </Link>
          </>
        );
      }
      return (
        <p className="muted small center">
          You are signed in as an employer. Only job seekers can apply.
        </p>
      );
    }
    return (
      <Link to="/admin?tab=jobs" className="btn btn-secondary btn-block">
        Manage in admin dashboard
      </Link>
    );
  };

  return (
    <div className="job-details-page">
      <div className="container">
        <Link to="/jobs" className="back-link">
          <FiArrowLeft /> Back to jobs
        </Link>

        {isExpired && (
          <div className="alert alert-warning">
            This listing is closed and is no longer accepting applications.
          </div>
        )}

        <div className="job-details-layout">
          <div className="job-details-main">
            <section className="panel job-detail-head">
              <div className="job-detail-top">
                <div className="company-avatar company-avatar-lg">
                  {companyLogo ? (
                    <img src={companyLogo} alt="" />
                  ) : (
                    <span>{initials(companyName)}</span>
                  )}
                </div>
                <div className="job-detail-title">
                  <div className="job-detail-badges">
                    <StatusBadge status={status} />
                    <span className="badge badge-neutral">{job.category}</span>
                  </div>
                  <h1>{job.title}</h1>
                  <p className="job-detail-company">
                    {companyName}
                    {job.postedBy?.profile?.industry && (
                      <span> · {job.postedBy.profile.industry}</span>
                    )}
                  </p>
                  <div className="job-detail-meta">
                    <span>
                      <FiMapPin /> {job.location}
                    </span>
                    <span>
                      <FiBriefcase /> {job.employmentType}
                    </span>
                    <span>
                      <FiClock /> {job.experienceLevel}
                    </span>
                    <span>
                      <FiCalendar /> Posted {timeAgo(job.jobPostedOn)}
                    </span>
                  </div>
                </div>
                {canSave && (
                  <button
                    type="button"
                    className={`btn btn-secondary save-detail-btn ${
                      isSaved ? "is-saved" : ""
                    }`}
                    onClick={handleToggleSave}
                    disabled={saving}
                  >
                    <FiBookmark />
                    {isSaved ? "Saved" : "Save job"}
                  </button>
                )}
              </div>
              <div className="job-detail-highlights">
                <div>
                  <span>Salary</span>
                  <strong>{formatSalary(job)}</strong>
                </div>
                <div>
                  <span>Openings</span>
                  <strong>{job.vacancies || 1}</strong>
                </div>
                <div>
                  <span>Apply before</span>
                  <strong>{job.deadline ? formatDate(job.deadline) : "Open"}</strong>
                </div>
                <div>
                  <span>Applicants</span>
                  <strong>{job.applicationsCount || 0}</strong>
                </div>
              </div>
            </section>

            <section className="panel">
              <h2 className="panel-title">About the role</h2>
              <p className="job-description-text">{job.description}</p>
            </section>

            {job.skills?.length > 0 && (
              <section className="panel">
                <h2 className="panel-title">Skills &amp; requirements</h2>
                <div className="tags tags-lg">
                  {job.skills.map((skill) => (
                    <span className="tag" key={skill}>
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <section className="panel">
              <h2 className="panel-title">Job overview</h2>
              <div className="overview-grid">
                <div>
                  <span className="overview-label">Category</span>
                  <strong>{job.category}</strong>
                </div>
                <div>
                  <span className="overview-label">Employment type</span>
                  <strong>{job.employmentType}</strong>
                </div>
                <div>
                  <span className="overview-label">Experience</span>
                  <strong>{job.experienceLevel}</strong>
                </div>
                <div>
                  <span className="overview-label">Location</span>
                  <strong>
                    {job.city}, {job.country}
                  </strong>
                </div>
                <div>
                  <span className="overview-label">Currency</span>
                  <strong>{job.currency}</strong>
                </div>
                <div>
                  <span className="overview-label">Posted on</span>
                  <strong>{formatDate(job.jobPostedOn)}</strong>
                </div>
              </div>
            </section>
          </div>

          <aside className="job-details-sidebar">
            <section className="panel apply-card">
              <h2 className="panel-title">Ready to apply?</h2>
              <p className="apply-salary">{formatSalary(job)}</p>
              <p className="muted small">
                {job.deadline
                  ? `Applications close on ${formatDate(job.deadline)}.`
                  : "Applications are open until the role is filled."}
              </p>
              <div className="apply-actions">{renderApplyAction()}</div>
            </section>

            <section className="panel company-card">
              <h2 className="panel-title">About the company</h2>
              <div className="company-card-head">
                <div className="company-avatar">
                  {companyLogo ? (
                    <img src={companyLogo} alt="" />
                  ) : (
                    <span>{initials(companyName)}</span>
                  )}
                </div>
                <div>
                  <strong>{companyName}</strong>
                  <span className="muted small">
                    {employerProfile.industry || "Hiring on HireHub"}
                  </span>
                </div>
              </div>
              {employerProfile.companyDescription && (
                <p className="company-description">
                  {employerProfile.companyDescription}
                </p>
              )}
              <ul className="company-facts">
                {employerProfile.companySize && (
                  <li>
                    <FiUsers /> {employerProfile.companySize}
                  </li>
                )}
                {[job.city, job.country].filter(Boolean).length > 0 && (
                  <li>
                    <FiMapPin /> {[job.city, job.country].join(", ")}
                  </li>
                )}
                {employerProfile.companyWebsite && (
                  <li>
                    <FiGlobe />
                    <a
                      href={employerProfile.companyWebsite}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Visit website <FiExternalLink />
                    </a>
                  </li>
                )}
              </ul>
            </section>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="related-jobs">
            <div className="section-head">
              <div>
                <span className="eyebrow">Keep exploring</span>
                <h2>Similar jobs</h2>
              </div>
            </div>
            <div className="jobs-grid jobs-grid-3">
              {related.map((item) => (
                <JobCard
                  key={item._id}
                  job={item}
                  saved={savedJobIds.has(String(item._id))}
                  onToggleSave={async (target) => {
                    const saved = savedJobIds.has(String(target._id));
                    try {
                      await api[saved ? "delete" : "post"](
                        `/job/save/${target._id}`
                      );
                      toggleSavedJob(target._id, !saved);
                      toast.success(saved ? "Removed from saved jobs." : "Job saved.");
                    } catch (err) {
                      toast.error(getErrorMessage(err));
                    }
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default JobDetails;
