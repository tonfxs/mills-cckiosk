"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function LogoutButton({ className }: { className?: string }) {
  const { logOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logOut();
    // Clear the session cookie
    document.cookie = "session=; path=/; max-age=0";
    router.push("/login");
  };

  return (
    <button onClick={handleLogout} className={className}>
      Sign Out
    </button>
  );
}