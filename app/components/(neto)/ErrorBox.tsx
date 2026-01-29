"use client";

import React from "react";

export function ErrorBox(props: { text: string }) {
  return (
    <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 text-sm">
      {props.text}
    </div>
  );
}
