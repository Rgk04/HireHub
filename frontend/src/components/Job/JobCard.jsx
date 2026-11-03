import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiBookmark,
  FiBriefcase,
  FiClock,
  FiMapPin,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useApp } from "../../context/AppContext";
import { ROLE } from "../../utils/constants";
import { formatSalary, initials, timeAgo } from "../../utils/format";

const JobCard = ({ job, onToggleSave, saved = false }) => {
  const { user, isAuthorized } = useApp();
  const navigate = useNavigate();

  const companyName =
    job.companyName ||
    job.company ||
    job.postedBy?.profile?.companyName ||
    job.postedBy?.name ||
    "Company";
  const logoSrc = job.postedBy?.avatar?.url;
  const isNew =
    new Date(job.jobPostedOn || job.createdAt).getTime() >
    Date.now() - 3 * 24 * 60 * 60 * 1000;
  const canSave = !user || user.role === ROLE.SEEKER;

  const handleSave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isAuthorized) {
      toast("Log in as a job seeker to save jobs.");
      navigate("/login");
      return;
    }
    if (user.role !== ROLE.SEEKER) {
      toast.error("Only job seekers can save jobs.");
      return;
    }
    onToggleSave?.(job);
  };

  return (
    <article className="job-card">
      {isNew && <span className="job-new-badge">New</span>}
      <div className="job-card-top">
        <div className="company-avatar">
          {logoSrc ? (
            <img src={logoSrc} alt="" />
          ) : (
            <span>{initials(companyName)}</span>
          )}
        </div>
        <div className="job-card-heading">
          <Link to={`/jobs/${job._id}`} className="job-title">
            {job.title}
          </Link>
          <p className="job-company">{companyName}</p>
        </div>
        {canSave && (
          <button
            type="button"
            className={`save-btn ${saved ? "is-saved" : ""}`}
            onClick={handleSave}
            aria-label={saved ? "Remove from saved jobs" : "Save job"}
            title={saved ? "Remove from saved jobs" : "Save job"}
          >
            <FiBookmark />
          </button>
        )}
      </div>

      <div className="job-meta">
        <span>
          <FiMapPin />
          {[job.city, job.country].filter(Boolean).join(", ")}
        </span>
        <span>
          <FiBriefcase />
          {job.employmentType || "Full-time"}
        </span>
        <span>
          <FiClock />
          {job.experienceLevel || "Entry Level"}
        </span>
      </div>

      {job.skills?.length > 0 && (
        <div className="job-tags">
          {job.skills.slice(0, 3).map((skill) => (
            <span className="tag" key={skill}>
              {skill}
            </span>
          ))}
          {job.skills.length > 3 && (
            <span className="tag tag-muted">+{job.skills.length - 3}</span>
          )}
        </div>
      )}

      <div className="job-card-footer">
        <div>
          <p className="job-salary">{formatSalary(job)}</p>
          <span className="job-posted">
            Posted {timeAgo(job.jobPostedOn || job.createdAt)}
          </span>
        </div>
        <Link className="job-view-link" to={`/jobs/${job._id}`}>
          View details <FiArrowRight />
        </Link>
      </div>
    </article>
  );
};

export default JobCard;
