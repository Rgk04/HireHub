import { Link } from "react-router-dom";
import { FiGithub, FiLinkedin, FiMail } from "react-icons/fi";

const Footer = () => (
  <footer className="footer">
    <div className="container footer-inner">
      <div className="footer-brand">
        <Link to="/" className="brand brand-footer">
          <img src="/hirehub-logo.svg" alt="HireHub" className="brand-logo" />
          <span className="brand-name">
            Hire<span>Hub</span>
          </span>
        </Link>
        <p>
          A modern job portal connecting talented people with teams that are
          building what comes next.
        </p>
        <div className="footer-social">
          <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub">
            <FiGithub />
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
            <FiLinkedin />
          </a>
          <a href="mailto:hello@hirehub.local" aria-label="Email HireHub">
            <FiMail />
          </a>
        </div>
      </div>

      <div className="footer-column">
        <h4>For candidates</h4>
        <Link to="/jobs">Browse jobs</Link>
        <Link to="/saved-jobs">Saved jobs</Link>
        <Link to="/dashboard">My dashboard</Link>
        <Link to="/register">Create an account</Link>
      </div>

      <div className="footer-column">
        <h4>For employers</h4>
        <Link to="/register">Start hiring</Link>
        <Link to="/employer/jobs/new">Post a job</Link>
        <Link to="/employer/jobs">Manage jobs</Link>
        <Link to="/employer/applicants">View applicants</Link>
      </div>

      <div className="footer-column">
        <h4>Platform</h4>
        <Link to="/">Home</Link>
        <Link to="/login">Log in</Link>
        <Link to="/notifications">Notifications</Link>
        <Link to="/profile">Profile</Link>
      </div>
    </div>
    <div className="container footer-bottom">
      <span>© {new Date().getFullYear()} HireHub. All rights reserved.</span>
      <span>Built with the MERN stack.</span>
    </div>
  </footer>
);

export default Footer;
