// import type { ReactNode } from "react";
// import AdminShell from "./AdminShell";

// export default function AdminLayout({ children }: { children: ReactNode }) {
//   return <AdminShell>{children}</AdminShell>;
// }

// import { redirect } from "next/navigation";
// import { getServerSession } from "next-auth";

// export default async function AdminLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const session = await getServerSession();

//   // if (!session) {
//   //   redirect("/login");
//   // }

//   return (
//     <>
//       {/* AdminShell, Sidebar, Header */}
//       {children}
//     </>
//   );
// }

'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/app/components/(admin)/Sidebar'; // adjust path if needed

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Optional: if you want to hide sidebar on login page under /admin (if you have one)
  const hideSidebar = pathname?.includes('/admin/login');

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {!hideSidebar && (
        <Sidebar
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed((v) => !v)}
        />
      )}

      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}

