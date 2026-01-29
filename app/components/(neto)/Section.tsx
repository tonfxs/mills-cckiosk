"use client";

import React from "react";

export function Section(props: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="text-xl font-bold text-slate-900">{props.title}</div>
      {props.subtitle && (
        <div className="mt-1 text-sm text-slate-600">{props.subtitle}</div>
      )}
      <div className="mt-6">{props.children}</div>
    </div>
  );
}
