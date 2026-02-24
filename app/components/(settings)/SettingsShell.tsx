"use client";

import { useState } from "react";
import { Archive, Database, Calendar, Trash2, RefreshCw } from "lucide-react";

export default function KioskSettingsPage() {
  const [selectedRange, setSelectedRange] = useState("last7days");

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow">
          <RefreshCw size={16} />
          Sync Google Sheet
        </button>
      </div>

      {/* Archive Section */}
      <div className="bg-white rounded-2xl shadow p-6 border border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <Archive className="text-blue-600" />
          <h2 className="text-lg font-semibold text-slate-800">
            Archive Data
          </h2>
        </div>

        <p className="text-sm text-slate-500 mb-6">
          Archive kiosk records from Google Sheets to keep your dashboard fast
          and organized.
        </p>

        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-slate-400" />

            <select
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
              className="border border-slate-300 rounded-xl px-3 py-2 text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="last7days">Last 7 days</option>
              <option value="last30days">Last 30 days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          <button className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl shadow">
            <Archive size={16} />
            Archive Selected Data
          </button>
        </div>
      </div>
      
      {/* Archive History */}
      <div className="bg-white rounded-2xl shadow border border-slate-200">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-slate-800">
            Archive History
          </h2>
        </div>

        <div className="overflow-x-auto ">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left text-slate-600 p-4">Date</th>
                <th className="text-left text-slate-600 p-4">Range</th>
                <th className="text-left text-slate-600 p-4">Records</th>
                <th className="text-left text-slate-600 p-4">Archived By</th>
                <th className="text-left text-slate-600 p-4">Action</th>
              </tr>
            </thead>

            <tbody>
              <tr className="border-t">
                <td className="text-slate-600 p-4">Feb 20, 2026</td>
                <td className="text-slate-600 p-4">Last 30 days</td>
                <td className="text-slate-600 p-4">3,200</td>
                <td className="text-slate-600 p-4">Admin</td>
                <td className="text-slate-600 p-4">
                  <button className="text-red-600 hover:text-red-800 flex items-center gap-1">
                    <Trash2 size={16} />
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}