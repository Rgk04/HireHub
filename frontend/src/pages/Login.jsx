import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiEye, FiEyeOff, FiLock, FiMail, FiUser } from "react-icons/fi";
import api, { getErrorMessage } from "../api/axios";
import { useApp } from "../context/AppContext";
import AuthLayout from "../components/Auth/AuthLayout";
import Spinner from "../components/UI/Loader";

const Login = () => {
  const { user, isAuthorized, authLoading, setUser, refreshNotifications } =
    useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "", role: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!authLoading && isAuthorized) {
    return (
      <Navigate
        to={user?.role === "Admin" ? "/admin" : "/dashboard"}
        replace
      />
    );
  }

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/user/login", form);
      setUser(data.user);
      await refreshNotifications();
      toast.success(data.message);
      const destination =
        location.state?.from?.pathname ||
        (data.user.role === "Admin" ? "/admin" : "/dashboard");
      navigate(destination, { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to log in."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to manage your applications or hiring pipeline."
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="login-role">Log in as</label>
          <div className="input-wrap">
            <FiUser className="input-icon" />
            <select
              id="login-role"
              value={form.role}
              onChange={(event) => update({ role: event.target.value })}
            >
              <option value="">Any role</option>
              <option value="Job Seeker">Job Seeker</option>
              <option value="Employer">Employer</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="login-email">Email address</label>
          <div className="input-wrap">
            <FiMail className="input-icon" />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(event) => update({ email: event.target.value })}
              required
            />
          </div>
        </div>

        <div className="field">
          <div className="field-label-row">
            <label htmlFor="login-password">Password</label>
            <Link to="/forgot-password" className="field-link">
              Forgot password?
            </Link>
          </div>
          <div className="input-wrap">
            <FiLock className="input-icon" />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(event) => update({ password: event.target.value })}
              required
            />
            <button
              type="button"
              className="input-action"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={loading}
        >
          {loading && <Spinner size="sm" />}
          {loading ? "Logging in…" : "Log in"}
        </button>

        <p className="auth-switch">
          New to HireHub? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Login;
