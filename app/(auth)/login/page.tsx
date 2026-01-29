"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: hook to auth API / NextAuth
    console.log({ email, password });
  };
  


  return (
    <>
        <div>
          {/* Logo Section */}
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
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
              // href="admin/dashboard"
            >
              Sign In
            </button>
          </form>
          <p className="text-center text-slate-400 text-sm mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-blue-600 font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
    </>
  );
}