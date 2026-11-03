import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FiBell,
  FiBookmark,
  FiBriefcase,
  FiFileText,
  FiGrid,
  FiLogOut,
  FiPlusCircle,
  FiSearch,
  FiShield,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import toast from "react-hot-toast";
import Navbar from "./Navbar";
import Avatar from "../UI/Avatar";
import { useApp } from "../../context/AppContext";
import { ROLE } from "../../utils/constants";

const SEEKER_NAV = [
  { to: "/dashboard", label: "Overview", icon: <FiGrid />, end: true },
  { to: "/applications", label: "My applications", icon: <FiFileText /> },
  { to: "/saved-jobs", label: "Saved jobs", icon: <FiBookmark /> },
  { to: "/jobs", label: "Find jobs", icon: <FiSearch /> },
  { to: "/profile", label: "Profile", icon: <FiUser /> },
  { to: "/notifications", label: "Notifications", icon: <FiBell />, badge: true },
];

const EMPLOYER_NAV = [
  { to: "/dashboard", label: "Overview", icon: <FiGrid />, end: true },
  { to: "/employer/jobs", label: "My jobs", icon: <FiBriefcase /> },
  { to: "/employer/jobs/new", label: "Post a job", icon: <FiPlusCircle /> },
  { to: "/employer/applicants", label: "Applicants", icon: <FiUsers /> },
  { to: "/jobs", label: "Browse jobs", icon: <FiSearch /> },
  { to: "/profile", label: "Profile", icon: <FiUser /> },
  { to: "/notifications", label: "Notifications", icon: <FiBell />, badge: true },
];

const ADMIN_NAV = [
  { to: "/admin", label: "Overview", icon: <FiShield />, end: true },
  { to: "/admin/users", label: "Users", icon: <FiUsers /> },
  { to: "/admin/jobs", label: "Job listings", icon: <FiBriefcase /> },
  { to: "/jobs", label: "Browse jobs", icon: <FiSearch /> },
  { to: "/notifications", label: "Notifications", icon: <FiBell />, badge: true },
];

const DashboardLayout = () => {
  const { user, unreadCount, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems =
    user?.role === ROLE.ADMIN
      ? ADMIN_NAV
      : user?.role === ROLE.EMPLOYER
      ? EMPLOYER_NAV
      : SEEKER_NAV;

  const handleLogout = async () => {
    await logout();
    toast.success("You have been logged out.");
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <Navbar />
      <div className="dashboard-body container">
        <aside className="dashboard-sidebar">
          <div className="sidebar-profile">
            <Avatar src={user?.avatar?.url} name={user?.name} size="md" />
            <div>
              <strong>{user?.name}</strong>
              <span>{user?.role}</span>
            </div>
          </div>
          <nav className="sidebar-nav" aria-label="Dashboard navigation">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `side-link ${isActive ? "is-active" : ""}`.trim()
                }
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && unreadCount > 0 && (
                  <span className="side-badge">{unreadCount}</span>
                )}
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            className="side-link side-logout"
            onClick={handleLogout}
          >
            <FiLogOut />
            <span>Log out</span>
          </button>
        </aside>
        <main className="dashboard-main">
          <div className="page-transition" key={location.pathname}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
