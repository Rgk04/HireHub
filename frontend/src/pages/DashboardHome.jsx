import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiArrowRight,
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiPlusCircle,
  FiTrendingUp,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import api, { getErrorMessage } from "../api/axios";
import { useApp } from "../context/AppContext";
import { ROLE } from "../utils/constants";
import { profileCompletion, timeAgo } from "../utils/format";
import StatCard from "../components/UI/StatCard";
import DonutChart from "../components/UI/DonutChart";
import BarChart from "../components/UI/BarChart";
import StatusBadge from "../components/UI/StatusBadge";
import EmptyState from "../components/UI/EmptyState";
import { PageLoader } from "../components/UI/Loader";

const STATUS_COLORS = [
  { key: "pending", label: "Pending", color: "#f59e0b" },
  { key: "shortlisted", label: "Shortlisted", color: "#3b82f6" },
  { key: "hired", label: "Hired", color: "#10b981" },
  { key: "rejected", label: "Rejected", color: "#ef4444" },
  { key: "withdrawn", label: "Withdrawn", color: "#94a3b8" },
];

const buildDonutData = (stats = {}) =>
  STATUS_COLORS.map((item) => ({
    label: item.label,
    value: stats[item.key] || 0,
    color: item.color,
  }));

const RecentApplications = ({ applications = [], employerView = false }) => (
  <div className="panel">
    <div className="panel-head panel-head-row">
      <div>
        <h2>{employerView ? "Recent applicants" : "Recent applications"}</h2>
        <p>
          {employerView
            ? "The latest people who applied to your roles."
            : "Your latest applications and their current status."}
        </p>
      </div>
      <Link
        to={employerView ? "/employer/applicants" : "/applications"}
        className="section-link"
      >
        View all <FiArrowRight />
      </Link>
    </div>

    {applications.length === 0 ? (
      <EmptyState
        compact
        icon={<FiFileText />}
        title="Nothing here yet"
        message={
          employerView
            ? "Applications will appear as soon as candidates apply."
            : "Apply for a job and track its progress here."
        }
      />
    ) : (
      <ul className="activity-list">
        {applications.map((application) => (
          <li key={application._id}>
            <span className="activity-icon">
              <FiFileText />
            </span>
            <div className="activity-main">
              <strong>
                {employerView
                  ? `${application.name} applied for`
                  : "Applied for"}{" "}
                {application.jobId?.title || "a job"}
              </strong>
              <span>
                {employerView
                  ? application.email
                  : application.jobId?.company ||
                    application.employerID?.profile?.companyName ||
                    application.employerID?.name ||
                    "Company"}{" "}
                · {timeAgo(application.createdAt)}
              </span>
            </div>
            <StatusBadge status={application.status} />
          </li>
        ))}
      </ul>
    )}
  </div>
);

const SeekerDashboard = ({ stats, loading }) => {
  const { user } = useApp();
  const [recommended, setRecommended] = useState([]);
  const [recommendedLoading, setRecommendedLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get("/job/recommended")
      .then(({ data }) => {
        if (active) setRecommended(data.jobs || []);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setRecommendedLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const completion = profileCompletion(user);

  if (loading) return <PageLoader label="Loading your dashboard…" />;

  const data = stats || {};

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            <FiTrendingUp /> Job seeker dashboard
          </span>
          <h1>Welcome back, {user?.name?.split(" ")[0]}</h1>
          <p>Here is what is happening with your job search.</p>
        </div>
        <Link to="/jobs" className="btn btn-primary">
          Find jobs <FiArrowRight />
        </Link>
      </div>

      <div className="stats-grid">
        <StatCard
          icon={<FiFileText />}
          label="Applications"
          value={data.totalApplications || 0}
          hint="Total submitted"
          tone="blue"
          to="/applications"
        />
        <StatCard
          icon={<FiClock />}
          label="Pending"
          value={data.pending || 0}
          hint="Awaiting review"
          tone="amber"
          to="/applications?status=pending"
        />
        <StatCard
          icon={<FiUsers />}
          label="Shortlisted"
          value={data.shortlisted || 0}
          hint="Moving forward"
          tone="indigo"
          to="/applications?status=shortlisted"
        />
        <StatCard
          icon={<FiCheckCircle />}
          label="Hired"
          value={data.hired || 0}
          hint="Offers received"
          tone="green"
          to="/applications?status=hired"
        />
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-head">
            <h2>Application status</h2>
            <p>A breakdown of every application you have made.</p>
          </div>
          <DonutChart
            data={buildDonutData(data)}
            total={data.totalApplications || 0}
            centerLabel="Applications"
          />
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Activity · last 6 months</h2>
            <p>How many applications you submitted each month.</p>
          </div>
          <BarChart data={data.monthly || []} emptyLabel="No applications in the last six months." />
        </div>
      </div>

      <div className="dashboard-grid dashboard-grid-2-1">
        <RecentApplications applications={data.recentApplications || []} />

        <div className="panel profile-progress-card">
          <div className="panel-head">
            <h2>Profile strength</h2>
            <p>Complete your profile to stand out to employers.</p>
          </div>
          <div className="progress-ring-wrap">
            <div
              className="progress-ring"
              style={{ "--progress": `${completion * 3.6}deg` }}
            >
              <span>{completion}%</span>
            </div>
            <p className="muted small">Profile completion</p>
          </div>
          <ul className="checklist">
            <li className={user?.avatar?.url ? "is-done" : ""}>
              <FiCheckCircle /> Profile photo
            </li>
            <li className={user?.profile?.headline ? "is-done" : ""}>
              <FiCheckCircle /> Headline and bio
            </li>
            <li className={user?.skills?.length ? "is-done" : ""}>
              <FiCheckCircle /> Skills
            </li>
            <li className={user?.resume?.url ? "is-done" : ""}>
              <FiCheckCircle /> Resume uploaded
            </li>
          </ul>
          <Link to="/profile" className="btn btn-secondary btn-block">
            <FiUser /> Update profile
          </Link>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head panel-head-row">
          <div>
            <h2>Recommended for you</h2>
            <p>Open roles that match your skills and activity.</p>
          </div>
          <Link to="/jobs" className="section-link">
            Browse all <FiArrowRight />
          </Link>
        </div>
        {recommendedLoading ? (
          <p className="muted">Loading recommendations…</p>
        ) : recommended.length === 0 ? (
          <EmptyState
            compact
            icon={<FiBriefcase />}
            title="No recommendations yet"
            message="Add skills to your profile to get personalised job suggestions."
            action={
              <Link to="/profile" className="btn btn-secondary btn-sm">
                Add skills
              </Link>
            }
          />
        ) : (
          <ul className="recommendation-list">
            {recommended.slice(0, 4).map((job) => (
              <li key={job._id}>
                <div>
                  <Link to={`/jobs/${job._id}`} className="recommendation-title">
                    {job.title}
                  </Link>
                  <span>
                    {job.companyName || job.company} · {job.city}, {job.country}
                  </span>
                </div>
                <span className="badge badge-neutral">{job.employmentType}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};

const EmployerDashboard = ({ stats, loading }) => {
  const { user } = useApp();

  if (loading) return <PageLoader label="Loading your dashboard…" />;

  const data = stats || {};
  const donutData = buildDonutData(data);

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            <FiBriefcase /> Employer dashboard
          </span>
          <h1>Welcome back, {user?.name?.split(" ")[0]}</h1>
          <p>Review your hiring pipeline and keep your roles moving.</p>
        </div>
        <Link to="/employer/jobs/new" className="btn btn-primary">
          <FiPlusCircle /> Post a job
        </Link>
      </div>

      <div className="stats-grid">
        <StatCard
          icon={<FiBriefcase />}
          label="Job listings"
          value={data.totalJobs || 0}
          hint={`${data.activeJobs || 0} active`}
          tone="blue"
          to="/employer/jobs"
        />
        <StatCard
          icon={<FiUsers />}
          label="Applicants"
          value={data.totalApplicants || 0}
          hint="All applications"
          tone="indigo"
          to="/employer/applicants"
        />
        <StatCard
          icon={<FiFileText />}
          label="Pending review"
          value={data.pending || 0}
          hint="Need a decision"
          tone="amber"
          to="/employer/applicants?status=pending"
        />
        <StatCard
          icon={<FiCheckCircle />}
          label="Hired"
          value={data.hired || 0}
          hint="Successful hires"
          tone="green"
          to="/employer/applicants?status=hired"
        />
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-head">
            <h2>Applications by status</h2>
            <p>Your entire pipeline at a glance.</p>
          </div>
          <DonutChart
            data={donutData}
            total={data.totalApplicants || 0}
            centerLabel="Applicants"
          />
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Applications · last 6 months</h2>
            <p>Monthly application volume across all roles.</p>
          </div>
          <BarChart
            data={data.monthly || []}
            emptyLabel="No applications in the last six months."
          />
        </div>
      </div>

      <div className="dashboard-grid dashboard-grid-2-1">
        <RecentApplications
          applications={data.recentApplications || []}
          employerView
        />

        <div className="panel">
          <div className="panel-head">
            <h2>Top hiring roles</h2>
            <p>Jobs receiving the most attention.</p>
          </div>
          {data.topJobs?.length ? (
            <ul className="top-jobs-list">
              {data.topJobs.map((job, index) => (
                <li key={job.jobId || index}>
                  <span className="rank">{index + 1}</span>
                  <div className="top-job-main">
                    <Link
                      to={`/employer/applicants?jobId=${job.jobId}`}
                      className="recommendation-title"
                    >
                      {job.title || "Deleted job"}
                    </Link>
                    <span>
                      {job.applications} applicants · {job.shortlisted}{" "}
                      shortlisted
                    </span>
                  </div>
                  <span className="badge badge-success">{job.hired} hired</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              compact
              icon={<FiBriefcase />}
              title="No applicants yet"
              message="Once candidates apply, your strongest roles will show up here."
              action={
                <Link to="/employer/jobs/new" className="btn btn-secondary btn-sm">
                  Post a job
                </Link>
              }
            />
          )}
        </div>
      </div>
    </>
  );
};

const DashboardHome = () => {
  const { user } = useApp();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role === ROLE.ADMIN) return undefined;
    let active = true;
    setLoading(true);
    api
      .get("/application/stats")
      .then(({ data }) => {
        if (active) setStats(data.stats || {});
      })
      .catch((err) => {
        if (active) toast.error(getErrorMessage(err, "Could not load your stats."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  if (user?.role === ROLE.ADMIN) {
    return <Navigate to="/admin" replace />;
  }

  if (user?.role === ROLE.EMPLOYER) {
    return <EmployerDashboard stats={stats} loading={loading} />;
  }

  return <SeekerDashboard stats={stats} loading={loading} />;
};

export default DashboardHome;
