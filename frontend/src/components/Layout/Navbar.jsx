import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FiBell,
  FiBookmark,
  FiChevronDown,
  FiGrid,
  FiLogOut,
  FiMenu,
  FiMoon,
  FiPlusCircle,
  FiSun,
  FiUser,
  FiX,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../hooks/useTheme";
import Avatar from "../UI/Avatar";
import { ROLE } from "../../utils/constants";

const Navbar = () => {
  const {
    user,
    isAuthorized,
    authLoading,
    unreadCount,
    logout,
  } = useApp();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const themeLabel = isDark ? "Switch to light mode" : "Switch to dark mode";
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleClick = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const dashboardPath = user?.role === ROLE.ADMIN ? "/admin" : "/dashboard";

  const handleLogout = async () => {
    await logout();
    toast.success("You have been logged out.");
    navigate("/login");
  };

  const navLinkClass = ({ isActive }) =>
    `nav-link ${isActive ? "is-active" : ""}`.trim();

  const primaryLinks = (
    <>
      <NavLink to="/" end className={navLinkClass}>
        Home
      </NavLink>
      <NavLink to="/jobs" className={navLinkClass}>
        Find jobs
      </NavLink>
      <Link to="/#companies" className="nav-link">
        Companies
      </Link>
      {isAuthorized && (
        <NavLink to={dashboardPath} className={navLinkClass}>
          Dashboard
        </NavLink>
      )}
      {isAuthorized && user?.role === ROLE.EMPLOYER && (
        <NavLink to="/employer/jobs" className={navLinkClass}>
          My jobs
        </NavLink>
      )}
    </>
  );

  return (
    <header className="navbar">
      <div className="navbar-inner container">
        <Link to={isAuthorized ? dashboardPath : "/"} className="brand">
          <img src="/hirehub-logo.svg" alt="HireHub" className="brand-logo" />
          <span className="brand-name">
            Hire<span>Hub</span>
          </span>
        </Link>

        <nav className="nav-links" aria-label="Main navigation">
          {primaryLinks}
        </nav>

        <div className="nav-actions">
          <button
            type="button"
            className="icon-btn theme-toggle"
            onClick={toggleTheme}
            aria-label={themeLabel}
            aria-pressed={isDark}
            title={themeLabel}
          >
            {isDark ? <FiSun /> : <FiMoon />}
          </button>
          {isAuthorized && user?.role === ROLE.SEEKER && (
            <Link
              to="/saved-jobs"
              className="icon-btn nav-icon-btn"
              aria-label="Saved jobs"
              title="Saved jobs"
            >
              <FiBookmark />
            </Link>
          )}
          {isAuthorized && (
            <Link
              to="/notifications"
              className="icon-btn nav-icon-btn notification-btn"
              aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
              title="Notifications"
            >
              <FiBell />
              {unreadCount > 0 && (
                <span className="notification-dot">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          )}

          {!isAuthorized && !authLoading && (
            <>
              <Link to="/login" className="btn btn-ghost nav-auth-btn">
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm nav-auth-btn">
                Get started
              </Link>
            </>
          )}

          {isAuthorized && (
            <div className="user-menu" ref={userMenuRef}>
              <button
                type="button"
                className="user-menu-trigger"
                onClick={() => setUserMenuOpen((open) => !open)}
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
              >
                <Avatar
                  src={user?.avatar?.url}
                  name={user?.name}
                  size="sm"
                />
                <span className="user-menu-name">{user?.name?.split(" ")[0]}</span>
                <FiChevronDown className={userMenuOpen ? "rotate" : ""} />
              </button>
              {userMenuOpen && (
                <div className="user-menu-dropdown" role="menu">
                  <div className="user-menu-head">
                    <strong>{user?.name}</strong>
                    <span>{user?.role}</span>
                  </div>
                  <Link to={dashboardPath} role="menuitem">
                    <FiGrid /> Dashboard
                  </Link>
                  <Link to="/profile" role="menuitem">
                    <FiUser /> My profile
                  </Link>
                  <Link to="/notifications" role="menuitem">
                    <FiBell /> Notifications
                    {unreadCount > 0 && (
                      <span className="menu-count">{unreadCount}</span>
                    )}
                  </Link>
                  {user?.role === ROLE.EMPLOYER && (
                    <Link to="/employer/jobs/new" role="menuitem">
                      <FiPlusCircle /> Post a job
                    </Link>
                  )}
                  <button
                    type="button"
                    className="menu-danger"
                    onClick={handleLogout}
                    role="menuitem"
                  >
                    <FiLogOut /> Log out
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            className="icon-btn nav-burger"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="mobile-nav">
          <div className="mobile-nav-links">{primaryLinks}</div>
          <div className="mobile-nav-actions">
            {isAuthorized ? (
              <>
                <Link to="/profile" className="btn btn-secondary btn-block">
                  My profile
                </Link>
                <Link to="/notifications" className="btn btn-secondary btn-block">
                  Notifications {unreadCount > 0 ? `(${unreadCount})` : ""}
                </Link>
                {user?.role === ROLE.EMPLOYER && (
                  <Link
                    to="/employer/jobs/new"
                    className="btn btn-primary btn-block"
                  >
                    Post a job
                  </Link>
                )}
                <button
                  type="button"
                  className="btn btn-danger btn-block"
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary btn-block">
                  Log in
                </Link>
                <Link to="/register" className="btn btn-primary btn-block">
                  Create an account
                </Link>
              </>
            )}
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-block mobile-theme-btn"
            onClick={toggleTheme}
            aria-pressed={isDark}
          >
            {isDark ? <FiSun /> : <FiMoon />} {themeLabel}
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
