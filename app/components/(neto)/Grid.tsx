"use client";

import React from "react";

export function Grid(props: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{props.children}</div>;
}
