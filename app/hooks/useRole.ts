import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types/user";

export function useRole() {
  const { role, loading } = useAuth();

  return {
    role,
    loading,
    isSuperAdmin: role === "superadmin",
    isAdmin: role === "superadmin" || role === "admin",
    isStaff: role === "superadmin" || role === "admin" || role === "staff",
    hasRole: (r: UserRole) => role === r,
  };
}