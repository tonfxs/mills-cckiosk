"use client";

import React from "react";

export function TabButton(props: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={`px-4 py-2 rounded-xl border text-sm font-semibold transition ${
        props.active
          ? "bg-slate-900 text-white border-slate-900"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
      }`}
    >
      {props.children}
    </button>
  );
}
