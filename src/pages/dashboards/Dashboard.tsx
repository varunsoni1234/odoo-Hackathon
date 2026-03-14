import { useAuth } from "../../providers/AuthProvider";
import { ManagerDashboard } from "./ManagerDashboard";
import { StaffDashboard } from "./StaffDashboard";
import { Loader2 } from "lucide-react";

export function Dashboard() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (profile?.role === "manager") {
    return <ManagerDashboard />;
  }

  return <StaffDashboard />;
}
