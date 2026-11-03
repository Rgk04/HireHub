import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { PageLoader } from "../UI/Loader";

const ProtectedRoute = () => {
  const { isAuthorized, authLoading } = useApp();
  const location = useLocation();

  if (authLoading) return <PageLoader />;
  if (!isAuthorized) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
