import { Navigate, useNavigate } from "react-router-dom";
import ControlLogin from "@/components/control/ControlLogin";
import { getStoredToken } from "@/lib/adminApi";

export default function ControlLoginPage() {
  const navigate = useNavigate();

  if (getStoredToken()) return <Navigate to="/control" replace />;

  return <ControlLogin onSuccess={() => navigate("/control", { replace: true })} />;
}