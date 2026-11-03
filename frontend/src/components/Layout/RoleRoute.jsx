import { Navigate, useLocation } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { PageLoader } from "../UI/Loader";

const RoleRoute = ({ roles, children }) => {
  const { user, isAuthorized, authLoading } = useApp();
  const location = useLocation();

  if (authLoading) return <PageLoader />;
  if (!isAuthorized) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (!roles.includes(user.role)) {
    return <Navigate to={user.role === "Admin" ? "/admin" : "/dashboard"} replace />;
  }
  return children;
};

export default RoleRoute;
