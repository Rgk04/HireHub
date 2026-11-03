import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiAlertTriangle,
  FiBriefcase,
  FiCheckCircle,
  FiSearch,
  FiShield,
  FiTrash2,
  FiUserCheck,
  FiUserX,
  FiUsers,
  FiX,
} from "react-icons/fi";
import api, { getErrorMessage } from "../api/axios";
import { ROLE } from "../utils/constants";
import { formatDate, jobStatus, timeAgo } from "../utils/format";
import StatCard from "../components/UI/StatCard";
import DonutChart from "../components/UI/DonutChart";
import StatusBadge from "../components/UI/StatusBadge";
import Avatar from "../components/UI/Avatar";
import EmptyState from "../components/UI/EmptyState";
import Pagination from "../components/UI/Pagination";
import ConfirmDialog from "../components/UI/ConfirmDialog";
import { PageLoader, TableSkeleton } from "../components/UI/Loader";

const STATUS_COLORS = [
  { key: "pending", label: "Pending", color: "#f59e0b" },
  { key: "shortlisted", label: "Shortlisted", color: "#3b82f6" },
  { key: "hired", label: "Hired", color: "#10b981" },
  { key: "rejected", label: "Rejected", color: "#ef4444" },
  { key: "withdrawn", label: "Withdrawn", color: "#94a3b8" },
];

const USER_TABS = [
  { value: "all", label: "All users" },
  { value: "Job Seeker", label: "Job seekers" },
  { value: "Employer", label: "Employers" },
  { value: "Admin", label: "Admins" },
];

const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/admin/stats");
      setStats(data.stats);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load platform statistics."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <PageLoader label="Loading platform stats…" />;

  if (error) {
    return (
      <EmptyState
        icon={<FiShield />}
        title="Could not load admin statistics"
        message={error}
        action={
          <button type="button" className="btn btn-primary" onClick={load}>
            Try again
          </button>
        }
      />
    );
  }

  const data = stats || {};
  const statusData = STATUS_COLORS.map((item) => ({
    label: item.label,
    value: data.applicationStatuses?.[item.key] || 0,
    color: item.color,
  }));

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            <FiShield /> Platform administration
          </span>
          <h1>Admin overview</h1>
          <p>Monitor activity, manage accounts and keep listings healthy.</p>
        </div>
        <div className="heading-actions">
          <Link to="/admin/users" className="btn btn-secondary">
            Manage users
          </Link>
          <Link to="/admin/jobs" className="btn btn-primary">
            Review jobs
          </Link>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          icon={<FiUsers />}
          label="Total users"
          value={data.totalUsers || 0}
          hint={`${data.seekers || 0} seekers · ${data.employers || 0} employers`}
          tone="blue"
          to="/admin/users"
        />
        <StatCard
          icon={<FiBriefcase />}
          label="Job listings"
          value={data.totalJobs || 0}
          hint={`${data.activeJobs || 0} active`}
          tone="indigo"
          to="/admin/jobs"
        />
        <StatCard
          icon={<FiCheckCircle />}
          label="Applications"
          value={data.totalApplications || 0}
          hint={`${data.hiredApplications || 0} hired`}
          tone="green"
        />
        <StatCard
          icon={<FiAlertTriangle />}
          label="Blocked accounts"
          value={data.blockedUsers || 0}
          hint={`${data.pendingApplications || 0} pending applications`}
          tone="amber"
          to="/admin/users?status=blocked"
        />
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-head">
            <h2>Applications by status</h2>
            <p>Platform-wide hiring funnel.</p>
          </div>
          <DonutChart
            data={statusData}
            total={data.totalApplications || 0}
            centerLabel="Applications"
          />
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Recently joined</h2>
            <p>The newest accounts on HireHub.</p>
          </div>
          {data.recentUsers?.length ? (
            <ul className="activity-list">
              {data.recentUsers.map((account) => (
                <li key={account._id}>
                  <Avatar
                    src={account.avatar?.url}
                    name={account.name}
                    size="sm"
                  />
                  <div className="activity-main">
                    <strong>{account.name}</strong>
                    <span>
                      {account.email} · {account.role}
                    </span>
                  </div>
                  <span className="muted small">{timeAgo(account.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState compact icon={<FiUsers />} title="No users yet" />
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head panel-head-row">
          <div>
            <h2>Latest job listings</h2>
            <p>Newest roles posted across the platform.</p>
          </div>
          <Link to="/admin/jobs" className="section-link">
            Manage all jobs
          </Link>
        </div>
        {data.recentJobs?.length ? (
          <div className="admin-job-list">
            {data.recentJobs.map((job) => (
              <div className="admin-job-row" key={job._id}>
                <div className="admin-job-main">
                  <Link to={`/jobs/${job._id}`} className="recommendation-title">
                    {job.title}
                  </Link>
                  <span>
                    {job.company} · {[job.city, job.country].filter(Boolean).join(", ")}
                  </span>
                </div>
                <StatusBadge status={jobStatus(job)} />
                <span className="muted small">{timeAgo(job.createdAt)}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState compact icon={<FiBriefcase />} title="No jobs posted yet" />
        )}
      </div>
    </>
  );
};

const AdminUsers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const role = searchParams.get("role") || "all";
  const status = searchParams.get("status") || "all";
  const query = searchParams.get("q") || "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    totalUsers: 0,
    totalPages: 1,
    currentPage: 1,
  });
  const [searchInput, setSearchInput] = useState(query);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [blockTarget, setBlockTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [working, setWorking] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: 10 };
      if (role !== "all") params.role = role;
      if (status !== "all") params.status = status;
      if (query) params.q = query;
      const { data } = await api.get("/admin/users", { params });
      setUsers(data.users || []);
      setPagination({
        totalUsers: data.totalUsers || 0,
        totalPages: data.totalPages || 1,
        currentPage: data.currentPage || 1,
      });
    } catch (err) {
      setError(getErrorMessage(err, "Could not load users."));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, role, status, query]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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

  const toggleBlock = async () => {
    if (!blockTarget) return;
    setWorking(true);
    try {
      const { data } = await api.put(`/admin/user/${blockTarget._id}/block`);
      toast.success(data.message);
      setBlockTarget(null);
      await fetchUsers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setWorking(false);
    }
  };

  const deleteUser = async () => {
    if (!deleteTarget) return;
    setWorking(true);
    try {
      const { data } = await api.delete(`/admin/user/${deleteTarget._id}`);
      toast.success(data.message);
      setDeleteTarget(null);
      await fetchUsers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setWorking(false);
    }
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            <FiUsers /> Account management
          </span>
          <h1>Users</h1>
          <p>Review accounts, block misuse and remove spam accounts.</p>
        </div>
      </div>

      <div className="toolbar toolbar-wrap">
        <div className="tabs tabs-inline" role="tablist" aria-label="Filter users">
          {USER_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={role === tab.value}
              className={`tab ${role === tab.value ? "is-active" : ""}`}
              onClick={() => updateParams({ role: tab.value === "all" ? "" : tab.value })}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="toolbar-controls">
          <label className="select-inline">
            <span>Status</span>
            <select
              value={status}
              onChange={(event) => updateParams({ status: event.target.value })}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
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
              placeholder="Search name, email, phone or company"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              aria-label="Search users"
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
        <TableSkeleton rows={6} />
      ) : error ? (
        <EmptyState
          icon={<FiUsers />}
          title="Could not load users"
          message={error}
          action={
            <button type="button" className="btn btn-primary" onClick={fetchUsers}>
              Try again
            </button>
          }
        />
      ) : users.length === 0 ? (
        <EmptyState
          icon={<FiUsers />}
          title="No users match this view"
          message="Try clearing the search or changing the filters."
          action={
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSearchParams({})}
            >
              Clear filters
            </button>
          }
        />
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th className="align-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((account) => (
                  <tr key={account._id}>
                    <td>
                      <div className="table-user">
                        <Avatar
                          src={account.avatar?.url}
                          name={account.name}
                          size="sm"
                        />
                        <div>
                          <strong>{account.name}</strong>
                          <span>{account.email}</span>
                          {account.profile?.companyName && (
                            <span className="muted small">
                              {account.profile.companyName}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{account.role}</span>
                    </td>
                    <td>{formatDate(account.createdAt)}</td>
                    <td>
                      <StatusBadge
                        status={account.isBlocked ? "blocked" : "active"}
                        label={account.isBlocked ? "Blocked" : "Active"}
                      />
                    </td>
                    <td>
                      <div className="table-actions">
                        {account.role !== ROLE.ADMIN && (
                          <>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => setBlockTarget(account)}
                            >
                              {account.isBlocked ? (
                                <>
                                  <FiUserCheck /> Unblock
                                </>
                              ) : (
                                <>
                                  <FiUserX /> Block
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm text-danger"
                              onClick={() => setDeleteTarget(account)}
                            >
                              <FiTrash2 /> Delete
                            </button>
                          </>
                        )}
                        {account.role === ROLE.ADMIN && (
                          <span className="muted small">Protected</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
        open={Boolean(blockTarget)}
        title={
          blockTarget?.isBlocked ? "Unblock this account?" : "Block this account?"
        }
        message={
          blockTarget?.isBlocked
            ? `${blockTarget?.name} will be able to log in and use HireHub again.`
            : `${blockTarget?.name} will be signed out and unable to log in until unblocked. Their listings and applications are preserved.`
        }
        confirmLabel={blockTarget?.isBlocked ? "Unblock account" : "Block account"}
        tone={blockTarget?.isBlocked ? "primary" : "danger"}
        loading={working}
        onConfirm={toggleBlock}
        onClose={() => setBlockTarget(null)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Permanently delete this account?"
        message={`This will remove ${deleteTarget?.name}'s account and all related data${
          deleteTarget?.role === ROLE.EMPLOYER
            ? ", including their job listings and applications"
            : ", including their applications"
        }. This cannot be undone.`}
        confirmLabel="Delete account"
        loading={working}
        onConfirm={deleteUser}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
};

const AdminJobs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get("status") || "all";
  const query = searchParams.get("q") || "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const [jobs, setJobs] = useState([]);
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
      const params = { page, limit: 10 };
      if (status !== "all") params.status = status;
      if (query) params.q = query;
      const { data } = await api.get("/admin/jobs", { params });
      setJobs(data.jobs || []);
      setPagination({
        totalJobs: data.totalJobs || 0,
        totalPages: data.totalPages || 1,
        currentPage: data.currentPage || 1,
      });
    } catch (err) {
      setError(getErrorMessage(err, "Could not load job listings."));
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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { data } = await api.delete(`/admin/job/${deleteTarget._id}`);
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
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            <FiBriefcase /> Moderation
          </span>
          <h1>Job listings</h1>
          <p>Review every listing and remove inappropriate or spam jobs.</p>
        </div>
      </div>

      <div className="toolbar toolbar-wrap">
        <div className="tabs tabs-inline" role="tablist" aria-label="Filter jobs">
          {["all", "active", "expired"].map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={status === option}
              className={`tab ${status === option ? "is-active" : ""}`}
              onClick={() =>
                updateParams({ status: option === "all" ? "" : option })
              }
            >
              {option === "all"
                ? "All jobs"
                : option === "active"
                ? "Active"
                : "Expired"}
            </button>
          ))}
        </div>

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
            placeholder="Search title, company, city or category"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            aria-label="Search job listings"
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
        <TableSkeleton rows={6} />
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
          title="No jobs match this view"
          message="Try clearing the search or changing the status filter."
          action={
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSearchParams({})}
            >
              Clear filters
            </button>
          }
        />
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Employer</th>
                  <th>Status</th>
                  <th>Posted</th>
                  <th className="align-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job._id}>
                    <td>
                      <div className="table-job">
                        <Link to={`/jobs/${job._id}`}>
                          <strong>{job.title}</strong>
                        </Link>
                        <span>
                          {job.category} · {[job.city, job.country]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="table-job">
                        <span className="table-company">
                          {job.company}
                        </span>
                        <span className="muted small">
                          {job.postedBy?.email || "—"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={jobStatus(job)} />
                    </td>
                    <td>{timeAgo(job.createdAt)}</td>
                    <td>
                      <div className="table-actions">
                        <Link
                          to={`/jobs/${job._id}`}
                          className="btn btn-ghost btn-sm"
                        >
                          View
                        </Link>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm text-danger"
                          onClick={() => setDeleteTarget(job)}
                        >
                          <FiTrash2 /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
        title="Remove this job listing?"
        message={`"${deleteTarget?.title}" by ${deleteTarget?.company} will be deleted along with all of its applications. This action cannot be undone.`}
        confirmLabel="Delete listing"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
};

const AdminDashboard = () => {
  const location = useLocation();

  if (location.pathname.startsWith("/admin/users")) return <AdminUsers />;
  if (location.pathname.startsWith("/admin/jobs")) return <AdminJobs />;
  return <AdminOverview />;
};

export default AdminDashboard;
