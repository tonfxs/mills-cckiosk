"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(email, password);
      const idToken = await user.getIdToken();
      const cookieOpts = `path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;

      // Set session cookie (for middleware auth check)
      document.cookie = `session=${idToken}; ${cookieOpts}`;

      // Set role cookie (for middleware role check)
      // profile is already fetched inside login() in AuthContext
      // We read it from the AuthContext after login via a small delay
      // OR we can fetch it inline here:
      const { getUserProfile } = await import("../../services/userService");
      const profile = await getUserProfile(user.uid);
      if (profile?.role) {
        document.cookie = `userRole=${profile.role}; ${cookieOpts}`;
      }

      const callbackUrl = searchParams.get("callbackUrl") ?? "/admin/dashboard";
      router.push(callbackUrl);
    } catch (err: any) {
      setError(getFriendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div>
        <header className="flex flex-col items-center gap-4 sm:gap-6">
          <Image
            src="/images/Mills Brand/Mills Brand_logo (registered)-01.png"
            alt="Mills Brands logo"
            width={250}
            height={100}
            className="w-[300px] sm:w-[450px] md:w-[550px] lg:w-[650px] h-auto cursor-pointer"
            priority
          />
        </header>
      </div>

      <div className="my-10 px-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-slate-300 text-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-slate-300 text-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* <p className="text-center text-slate-400 text-sm mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-blue-600 font-medium hover:underline">
            Sign up
          </Link>
        </p> */}
      </div>
    </>
  );
}

function getFriendlyError(code: string) {
  switch (code) {
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    default:
      return "Something went wrong. Please try again.";
  }
}