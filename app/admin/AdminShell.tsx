// "use client";

// import { useState } from "react";
// import { Sidebar } from "../components/(admin)/Sidebar";

// export default function AdminShell({ children }: { children: React.ReactNode }) {
//   const [isCollapsed, setIsCollapsed] = useState(false);

//   return (
//     // ✅ Locks the viewport; prevents BODY scroll
//     <div className="h-screen overflow-hidden bg-gray-50">
//       <div className="flex h-full min-w-0">
//         {/* Sidebar column (does NOT scroll) */}
//         <div className="shrink-0">
//           <Sidebar
//             isCollapsed={isCollapsed}
//             onToggle={() => setIsCollapsed((v) => !v)}
//           />
//         </div>

//         {/* ✅ Only MAIN scrolls */}
//         <main className="flex-1 min-w-0 overflow-y-auto">
//           {children}
//         </main>
//       </div>
//     </div>
//   );
// }
