'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Moon, Sun } from 'lucide-react';
import { Sidebar } from '@/app/components/(admin)/Sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const hideSidebar = pathname?.includes('/admin/login');

  // useEffect(() => {
  //   const saved = localStorage.getItem("darkMode");
  //   if (saved === "true") {
  //     setDarkMode(true);
  //     document.documentElement.classList.add("dark");
  //   }
  // }, []);

  // function toggleDarkMode() {
  //   const next = !darkMode;
  //   setDarkMode(next);
  //   localStorage.setItem("darkMode", String(next));
  //   document.documentElement.classList.toggle("dark", next);
  // }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {!hideSidebar && (
        <Sidebar
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed((v) => !v)}
        />
      )}

      <main className="flex-1 min-w-0">

        {/* Toggle — top-right of every page */}
        {/* <div className="flex justify-end px-6 pt-4">
          <button
            onClick={toggleDarkMode}
            className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm hover:shadow transition"
          >
            {darkMode
              ? <Sun size={15} className="text-yellow-400" />
              : <Moon size={15} className="text-slate-500" />
            }
            {darkMode ? "Light" : "Dark"}
          </button>
        </div> */}

        {children}

      </main>
    </div>
  );
}