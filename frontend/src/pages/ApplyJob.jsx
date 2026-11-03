import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiBriefcase,
  FiCheckCircle,
  FiFileText,
  FiMapPin,
  FiUploadCloud,
  FiX,
} from "react-icons/fi";
import api, { getErrorMessage, multipartConfig } from "../api/axios";
import { useApp } from "../context/AppContext";
import { formatSalary, initials, jobStatus } from "../utils/format";
import EmptyState from "../components/UI/EmptyState";
import Spinner, { PageLoader } from "../components/UI/Loader";
import StatusBadge from "../components/UI/StatusBadge";

const RESUME_EXTENSIONS = [".pdf", ".doc", ".docx"];
const MAX_RESUME_SIZE = 5 * 1024 * 1024;

const ApplyJob = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser, refreshNotifications } = useApp();
  const fileInputRef = useRef(null);

  const [job, setJob] = useState(null);
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    coverLetter: "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.profile?.location || "",
        coverLetter: "",
      });
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      api.get(`/job/${id}`),
      api.get(`/application/check/${id}`),
    ])
      .then(([jobRes, checkRes]) => {
        if (!active) return;
        setJob(jobRes.data.job);
        setExisting(checkRes.data.applied ? checkRes.data.application : null);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, "This job could not be loaded."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0];
    if (!selected) {
      setFile(null);
      return;
    }
    const extension = selected.name
      .slice(selected.name.lastIndexOf("."))
      .toLowerCase();
    if (!RESUME_EXTENSIONS.includes(extension)) {
      toast.error("Please upload a PDF, DOC or DOCX file.");
      event.target.value = "";
      return;
    }
    if (selected.size > MAX_RESUME_SIZE) {
      toast.error("Resume must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }
    setFile(selected);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error("Please complete your contact details.");
      return;
    }
    if (!form.address.trim()) {
      toast.error("Please provide your address.");
      return;
    }
    if (form.coverLetter.trim().length < 20) {
      toast.error("Cover letter must contain at least 20 characters.");
      return;
    }
    if (!file && !user?.resume?.url) {
      toast.error("Please upload a resume before applying.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("jobId", id);
      payload.append("name", form.name.trim());
      payload.append("email", form.email.trim());
      payload.append("phone", form.phone.trim());
      payload.append("address", form.address.trim());
      payload.append("coverLetter", form.coverLetter.trim());
      if (file) payload.append("resume", file);

      const { data } = await api.post(
        "/application/post",
        payload,
        multipartConfig
      );
      toast.success(data.message || "Application submitted.");
      await Promise.all([refreshUser(), refreshNotifications()]);
      navigate("/applications", { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not submit your application."));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader label="Preparing your application…" />;

  if (error || !job) {
    return (
      <EmptyState
        icon={<FiBriefcase />}
        title="Job not available"
        message={error || "This job listing may have been removed."}
        action={
          <Link to="/jobs" className="btn btn-primary">
            Browse jobs
          </Link>
        }
      />
    );
  }

  const companyName =
    job.companyName || job.company || job.postedBy?.name || "Company";
  const expired = jobStatus(job) === "expired";

  return (
    <div className="apply-page">
      <Link to={`/jobs/${job._id}`} className="back-link">
        <FiArrowLeft /> Back to job
      </Link>

      <div className="page-heading">
        <div>
          <span className="eyebrow">
            <FiFileText /> Job application
          </span>
          <h1>Apply for {job.title}</h1>
          <p>
            {companyName} · {[job.city, job.country].filter(Boolean).join(", ")}
          </p>
        </div>
      </div>

      {existing ? (
        <EmptyState
          icon={<FiCheckCircle />}
          title="You have already applied"
          message="Your application is already in the employer's pipeline. You can follow its progress from your applications page."
          action={
            <>
              <StatusBadge status={existing.status} />
              <Link to="/applications" className="btn btn-primary">
                Track application
              </Link>
            </>
          }
        />
      ) : expired ? (
        <EmptyState
          icon={<FiBriefcase />}
          title="Applications are closed"
          message="This role is no longer accepting new applications, but similar jobs are still open."
          action={
            <Link to="/jobs" className="btn btn-primary">
              Find similar jobs
            </Link>
          }
        />
      ) : (
        <div className="apply-layout">
          <form className="panel application-form" onSubmit={handleSubmit}>
            <div className="panel-head">
              <h2>Contact details</h2>
              <p>These details are shared with the employer for this role.</p>
            </div>

            <div className="form-grid">
              <div className="field">
                <label htmlFor="apply-name">Full name *</label>
                <input
                  id="apply-name"
                  type="text"
                  value={form.name}
                  onChange={(event) => update({ name: event.target.value })}
                  maxLength={60}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="apply-email">Email address *</label>
                <input
                  id="apply-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => update({ email: event.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="apply-phone">Phone number *</label>
                <input
                  id="apply-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(event) => update({ phone: event.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="apply-address">Address *</label>
                <input
                  id="apply-address"
                  type="text"
                  placeholder="City, state, country"
                  value={form.address}
                  onChange={(event) => update({ address: event.target.value })}
                  maxLength={250}
                  required
                />
              </div>
            </div>

            <div className="panel-head form-section-head">
              <h2>Resume</h2>
              <p>Upload a fresh resume or use the one saved on your profile.</p>
            </div>

            {user?.resume?.url && !file && (
              <div className="resume-current">
                <FiFileText />
                <div>
                  <strong>{user.resume.originalName || "Saved resume"}</strong>
                  <span>Saved on your profile</span>
                </div>
                <a
                  href={user.resume.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost btn-sm"
                >
                  Preview
                </a>
              </div>
            )}

            <div className="upload-box">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                hidden
              />
              {file ? (
                <div className="upload-file">
                  <FiFileText />
                  <div>
                    <strong>{file.name}</strong>
                    <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => {
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    aria-label="Remove selected resume"
                  >
                    <FiX />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="upload-drop"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FiUploadCloud />
                  <strong>Upload a resume</strong>
                  <span>PDF, DOC or DOCX · up to 5 MB</span>
                </button>
              )}
            </div>

            <div className="panel-head form-section-head">
              <h2>Cover letter</h2>
              <p>Tell the employer why you are a strong fit for this role.</p>
            </div>
            <div className="field">
              <textarea
                rows={8}
                maxLength={4000}
                placeholder="Introduce yourself, highlight relevant experience and explain why you want this role…"
                value={form.coverLetter}
                onChange={(event) =>
                  update({ coverLetter: event.target.value })
                }
                required
              />
              <span className="field-hint">
                {form.coverLetter.length} / 4000 characters (minimum 20)
              </span>
            </div>

            <div className="form-actions">
              <Link to={`/jobs/${job._id}`} className="btn btn-secondary">
                Cancel
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting && <Spinner size="sm" />}
                {submitting ? "Submitting…" : "Submit application"}
              </button>
            </div>
          </form>

          <aside className="apply-summary">
            <div className="panel">
              <div className="apply-company">
                <div className="company-avatar">
                  {job.postedBy?.avatar?.url ? (
                    <img src={job.postedBy.avatar.url} alt="" />
                  ) : (
                    <span>{initials(companyName)}</span>
                  )}
                </div>
                <div>
                  <strong>{job.title}</strong>
                  <span className="muted small">{companyName}</span>
                </div>
              </div>
              <ul className="summary-list">
                <li>
                  <FiMapPin /> {job.location}
                </li>
                <li>
                  <FiBriefcase /> {job.employmentType} · {job.experienceLevel}
                </li>
                <li>
                  <FiFileText /> {formatSalary(job)}
                </li>
              </ul>
              <p className="muted small">
                Your application, resume and cover letter will be visible to the
                hiring team at {companyName}.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default ApplyJob;
