import { Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiShield,
  FiTrendingUp,
  FiUserCheck,
} from "react-icons/fi";

const AuthLayout = ({ children, title, subtitle }) => (
  <div className="auth-page">
    <section className="auth-panel">
      <Link to="/" className="brand brand-light">
        <img src="/hirehub-logo.svg" alt="HireHub" className="brand-logo" />
        <span className="brand-name">
          Hire<span>Hub</span>
        </span>
      </Link>

      <div className="auth-panel-content">
        <span className="eyebrow eyebrow-light">
          <FiTrendingUp /> Built for modern hiring
        </span>
        <h1>Where good people meet great teams.</h1>
        <p>
          HireHub brings job discovery, applications and hiring decisions into
          one calm, transparent experience.
        </p>

        <ul className="auth-benefits">
          <li>
            <FiShield />
            <div>
              <strong>Verified employers</strong>
              <span>Every job is posted by a registered employer account.</span>
            </div>
          </li>
          <li>
            <FiUserCheck />
            <div>
              <strong>Resume-based applications</strong>
              <span>Upload once, then apply to roles in a few clicks.</span>
            </div>
          </li>
          <li>
            <FiCheckCircle />
            <div>
              <strong>Transparent status tracking</strong>
              <span>Know when you are shortlisted, hired or need to retry.</span>
            </div>
          </li>
        </ul>
      </div>

      <p className="auth-panel-footer">
        © {new Date().getFullYear()} HireHub. A MERN stack portfolio project.
      </p>
    </section>

    <section className="auth-form-side">
      <div className="auth-form-wrap">
        <Link to="/" className="auth-back">
          <FiArrowLeft /> Back to home
        </Link>
        <div className="auth-form-head">
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {children}
      </div>
    </section>
  </div>
);

export default AuthLayout;
