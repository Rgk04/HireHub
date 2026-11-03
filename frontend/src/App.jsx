import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import PublicLayout from "./components/Layout/PublicLayout";
import DashboardLayout from "./components/Layout/DashboardLayout";
import ProtectedRoute from "./components/Layout/ProtectedRoute";
import RoleRoute from "./components/Layout/RoleRoute";
import ScrollToTop from "./components/Layout/ScrollToTop";
import { ROLE } from "./utils/constants";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PasswordRecovery from "./pages/PasswordRecovery";
import Jobs from "./pages/Jobs";
import JobDetails from "./pages/JobDetails";
import ApplyJob from "./pages/ApplyJob";
import DashboardHome from "./pages/DashboardHome";
import Profile from "./pages/Profile";
import SavedJobs from "./pages/SavedJobs";
import MyApplications from "./pages/MyApplications";
import EmployerJobs from "./pages/EmployerJobs";
import PostJob from "./pages/PostJob";
import EditJob from "./pages/EditJob";
import Applicants from "./pages/Applicants";
import AdminDashboard from "./pages/AdminDashboard";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";

const App = () => (
  <>
    <ScrollToTop />
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/forgot-password"
        element={<PasswordRecovery variant="forgot" />}
      />
      <Route
        path="/reset-password"
        element={<PasswordRecovery variant="reset" />}
      />

      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetails />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />

          <Route
            path="/applications"
            element={
              <RoleRoute roles={[ROLE.SEEKER]}>
                <MyApplications />
              </RoleRoute>
            }
          />
          <Route
            path="/saved-jobs"
            element={
              <RoleRoute roles={[ROLE.SEEKER]}>
                <SavedJobs />
              </RoleRoute>
            }
          />
          <Route
            path="/apply/:id"
            element={
              <RoleRoute roles={[ROLE.SEEKER]}>
                <ApplyJob />
              </RoleRoute>
            }
          />

          <Route
            path="/employer/jobs"
            element={
              <RoleRoute roles={[ROLE.EMPLOYER]}>
                <EmployerJobs />
              </RoleRoute>
            }
          />
          <Route
            path="/employer/jobs/new"
            element={
              <RoleRoute roles={[ROLE.EMPLOYER]}>
                <PostJob />
              </RoleRoute>
            }
          />
          <Route
            path="/employer/jobs/:id/edit"
            element={
              <RoleRoute roles={[ROLE.EMPLOYER]}>
                <EditJob />
              </RoleRoute>
            }
          />
          <Route
            path="/employer/applicants"
            element={
              <RoleRoute roles={[ROLE.EMPLOYER]}>
                <Applicants />
              </RoleRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <RoleRoute roles={[ROLE.ADMIN]}>
                <AdminDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RoleRoute roles={[ROLE.ADMIN]}>
                <AdminDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/jobs"
            element={
              <RoleRoute roles={[ROLE.ADMIN]}>
                <AdminDashboard />
              </RoleRoute>
            }
          />
        </Route>
      </Route>
    </Routes>

    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3800,
        style: {
          background: "#0f172a",
          color: "#f8fafc",
          borderRadius: "12px",
          fontSize: "14px",
          padding: "12px 16px",
          boxShadow: "0 18px 40px rgba(15, 23, 42, 0.25)",
        },
        success: { iconTheme: { primary: "#22c55e", secondary: "#0f172a" } },
        error: { iconTheme: { primary: "#ef4444", secondary: "#0f172a" } },
      }}
    />
  </>
);

export default App;
