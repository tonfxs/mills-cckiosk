// export default function DashboardStatCard({
//   title,
//   value,
//   subtitle,
//   icon,
// }: {
//   title: string;
//   value: string | number;
//   subtitle?: string;
//   icon?: React.ReactNode;
// }) {
//   return (
//     <div className="rounded-2xl border bg-white p-4 sm:p-5 shadow-sm">
//       <div className="flex items-start justify-between gap-3 sm:gap-4">
//         <div className="min-w-0">
//           <div className="text-xs sm:text-sm text-gray-500">{title}</div>
//           <div className="mt-1 text-2xl sm:text-3xl font-semibold text-gray-900">
//             {value}
//           </div>
//           {subtitle ? (
//             <div className="mt-1 text-xs sm:text-sm text-gray-500">{subtitle}</div>
//           ) : null}
//         </div>

//         <div className="shrink-0 rounded-xl bg-gray-100 p-2.5 sm:p-3 text-gray-700">
//           {icon}
//         </div>
//       </div>
//     </div>
//   );
// }

import React from "react";

type DashboardStatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;

  /** Optional extras */
  trend?: string;
  color?: string; // tailwind class e.g. "bg-green-500"
};

export default function DashboardStatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = "bg-gray-100",
}: DashboardStatCardProps) {
  return (
    <div className="rounded-2xl border bg-white p-4 sm:p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <div className="text-xs sm:text-sm text-gray-500">{title}</div>

          <div className="mt-1 text-2xl sm:text-3xl font-semibold text-gray-900">
            {value}
          </div>

          {subtitle ? (
            <div className="mt-1 text-xs sm:text-sm text-gray-500">
              {subtitle}
            </div>
          ) : null}

          {trend ? (
            <div className="mt-2 text-xs font-medium text-gray-600">
              {trend}
            </div>
          ) : null}
        </div>

        <div
          className={`shrink-0 rounded-xl p-2.5 sm:p-3 text-gray-800 ${color}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
