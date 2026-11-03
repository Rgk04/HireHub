import { Link } from "react-router-dom";
import { FiArrowLeft, FiCompass } from "react-icons/fi";

const NotFound = () => (
  <div className="notfound-page container">
    <div className="notfound-code">404</div>
    <h1>This page took a different job.</h1>
    <p>
      The page you are looking for does not exist, or it may have been moved.
      Let us get you back to something useful.
    </p>
    <div className="notfound-actions">
      <Link to="/" className="btn btn-primary">
        <FiArrowLeft /> Back to home
      </Link>
      <Link to="/jobs" className="btn btn-secondary">
        <FiCompass /> Browse jobs
      </Link>
    </div>
  </div>
);

export default NotFound;
