import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiBriefcase,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiPhone,
  FiUser,
} from "react-icons/fi";
import api, { getErrorMessage } from "../api/axios";
import { useApp } from "../context/AppContext";
import AuthLayout from "../components/Auth/AuthLayout";
import Spinner from "../components/UI/Loader";

const Register = () => {
  const { isAuthorized, authLoading, user, setUser, refreshNotifications } =
    useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    role: "Job Seeker",
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!authLoading && isAuthorized) {
    return (
      <Navigate to={user?.role === "Admin" ? "/admin" : "/dashboard"} replace />
    );
  }

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error("Please complete all fields.");
      return;
    }
    if (form.name.trim().length < 3) {
      toast.error("Name must contain at least 3 characters.");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password must contain at least 8 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/user/register", {
        role: form.role,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      setUser(data.user);
      await refreshNotifications();
      toast.success(data.message);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to create your account."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Choose how you want to use HireHub and get started in minutes."
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="role-cards">
          <button
            type="button"
            className={`role-card ${form.role === "Job Seeker" ? "is-active" : ""}`}
            onClick={() => update({ role: "Job Seeker" })}
          >
            <FiUser />
            <strong>Job Seeker</strong>
            <span>Find and apply for roles</span>
          </button>
          <button
            type="button"
            className={`role-card ${form.role === "Employer" ? "is-active" : ""}`}
            onClick={() => update({ role: "Employer" })}
          >
            <FiBriefcase />
            <strong>Employer</strong>
            <span>Post jobs and hire talent</span>
          </button>
        </div>

        <div className="field">
          <label htmlFor="register-name">Full name</label>
          <div className="input-wrap">
            <FiUser className="input-icon" />
            <input
              id="register-name"
              type="text"
              autoComplete="name"
              placeholder="Your full name"
              value={form.name}
              onChange={(event) => update({ name: event.target.value })}
              required
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="register-email">Email address</label>
          <div className="input-wrap">
            <FiMail className="input-icon" />
            <input
              id="register-email"
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
          <label htmlFor="register-phone">Phone number</label>
          <div className="input-wrap">
            <FiPhone className="input-icon" />
            <input
              id="register-phone"
              type="tel"
              autoComplete="tel"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={(event) => update({ phone: event.target.value })}
              required
            />
          </div>
        </div>

        <div className="form-grid form-grid-tight">
          <div className="field">
            <label htmlFor="register-password">Password</label>
            <div className="input-wrap">
              <FiLock className="input-icon" />
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 8 characters"
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
          <div className="field">
            <label htmlFor="register-confirm">Confirm password</label>
            <div className="input-wrap">
              <FiLock className="input-icon" />
              <input
                id="register-confirm"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={(event) =>
                  update({ confirmPassword: event.target.value })
                }
                required
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={loading}
        >
          {loading && <Spinner size="sm" />}
          {loading ? "Creating account…" : "Create account"}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Register;
