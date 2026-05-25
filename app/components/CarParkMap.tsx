// "use client";

// import React, { JSX, useMemo } from "react";

// export type CarParkMapProps = {
//   value: string;
//   onChange: (value: string) => void;
// };

// type BaySpec = {
//   label: string;
//   value: string;
//   x: number;
//   y: number;
//   w: number;
//   h: number;
// };

// export default function CarParkMap({ value, onChange }: CarParkMapProps): JSX.Element {
//   const VB_W = 1200;
//   const VB_H = 720;

//   const {
//     oppositeBays,
//     bayBays,
//     sideBays,
//     wall,
//     fence,
//     reception, //add
//     here, // add
//     oppLabelX,
//     oppLabelY,
//     sideLabelY,
//     sideBaseY,
//     sideBaseX,
//     sideBaseW,
//     sideBaseH,
//     rampPoints,
//   } = useMemo(() => {
//     const bw = 52;
//     const bh = 92;
//     const gap = 14;

//     const sideW = 82;
//     const sideH = 150;
//     const sideGap = 24;

//     // =============== Fence (far left) ===============
//     const fence = {
//       labelX: 4,
//       labelY: 160,
//       x: 1,
//       y: 180,
//       w: 70,
//       h: 340,
//     };

//     // =============== Reception Stairs (custom button) ===============
//     const reception = {
//       x: VB_W - 600,   // top-right-ish
//       y: 550,
//       w: 300,
//       h: 74,
//       labelX: VB_W - 195,
//       labelY: 70,
//       value: "Reception-Stairs",
//       label: "Reception Stairs",
//     };

//     // =============== You are here (custom button) ===============
//     const here = {
//       x: VB_W - 520,   // top-right-ish
//       y: 650,
//       w: 350,
//       h: 350,
//       labelX: VB_W - 195,
//       labelY: 70,
//       label: "You are standing here!",
//     };


//     // Opposite Bays: 7–17 (display 17..7)
//     const oppositeNums = [17, 16, 15, 14, 13, 12, 11, 10, 9, 8] as const;
//     // Bay: 1–17 (display 17..1)
//     const bayNums = [17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1] as const;

//     const oppRowWidth = oppositeNums.length * bw + (oppositeNums.length - 1) * gap;
//     const bayRowWidth = bayNums.length * bw + (bayNums.length - 1) * gap;

//     // ✅ whitespace between Fence and center group
//     const centerX = VB_W / 2 + 40;

//     const bayX0 = Math.round(centerX - bayRowWidth / 2);
//     const oppX0 = bayX0; // Opp-7 aligns above Bay-7

//     // =============== SIDE anchored to bottom ===============
//     const sideBaseH = 14;
//     const sideGapToLine = 12;

//     const sideBaseY = VB_H - 24;
//     const sideY = sideBaseY - sideGapToLine - sideH;
//     const sideLabelY = sideY - 16;

//     const sideBaseX = 140;
//     const sideBlockW = 3 * sideW + 2 * sideGap;
//     const sideBaseW = Math.max(360, sideBlockW + 80);

//     const sideBays: BaySpec[] = [26, 25, 24].map((n, i) => ({
//       label: String(n),
//       value: `Side-${n}`,
//       x: sideBaseX + 40 + i * (sideW + sideGap),
//       y: sideY,
//       w: sideW,
//       h: sideH,
//     }));

//     // ✅ GUARANTEE NO OVERLAP between Bay and Side
//     const bayToSideGap = 40;
//     const bayY = Math.min(280, sideY - bh - bayToSideGap);

//     // =============== Opposite + Wall spacing ===============
//     const oppToBayGap = 10;
//     const oppY = bayY - bh - oppToBayGap;

//     const oppLabelY = oppY - 18;

//     const wallW = 300;
//     const wallH = 74;
//     const oppCenterX = oppX0 + oppRowWidth / 2;

//     const wallToOppGap = 80;
//     const wallY = Math.max(18, oppLabelY - wallH - wallToOppGap);

//     const wall = {
//       x: Math.round(oppCenterX - wallW / 2),
//       y: wallY,
//       w: wallW,
//       h: wallH,
//       labelX: oppCenterX,
//       labelY: wallY + 48,
//     };

//     // =============== Build Opposite + Bay ===============
//     const oppositeBays: BaySpec[] = oppositeNums.map((n, i) => ({
//       label: String(n),
//       value: `Opp-${n}`,
//       x: oppX0 + i * (bw + gap),
//       y: oppY,
//       w: bw,
//       h: bh,
//     }));

//     const bayBays: BaySpec[] = bayNums.map((n, i) => ({
//       label: String(n),
//       value: `Bay-${n}`,
//       x: bayX0 + i * (bw + gap),
//       y: bayY,
//       w: bw,
//       h: bh,
//     }));

//     // =============== ✅ RAMP TRIANGLE (your corrected requirement) ===============
//     // Start point: top of Bay-6, beside Opp-7 (i.e., the boundary between Bay-7 and Bay-6 columns)
//     // Then slope down to the top of Bay-1.
//     //
//     // Bay indices (bayNums = 17..1):
//     // Bay-6 => index 11
//     // Bay-1 => index 16
//     const idxBay7 = 10;
//     const idxBay1 = 16;

//     // xStart: "beside Opp-7" = the vertical line between Bay-7 and Bay-6
//     const xStart = bayX0 + idxBay7 * (bw + gap) - gap / 6; // slightly to the left edge of Bay-6 gap boundary

//     // yStart: top of Bay-6 (use bayY), but lift a bit so it looks like it's on top
//     const yTop = bayY - 6;

//     // Give it height at the start (like your screenshot wedge)
//     const rampHeight = 100;
//     const yStartTop = yTop - rampHeight;

//     // xEnd: end at Bay-1 right edge
//     const xEnd = bayX0 + idxBay1 * (bw + gap) + bw;

//     // yEnd: same baseline as yTop
//     const yEnd = yTop;

//     // Triangle polygon points (right triangle wedge)
//     // (xStart,yEnd) -> (xStart,yStartTop) -> (xEnd,yEnd)
//     const rampPoints = `${xStart},${yEnd} ${xStart},${yStartTop} ${xEnd},${yEnd}`;

//     return {
//       oppositeBays,
//       bayBays,
//       sideBays,
//       wall,
//       fence,
//       reception, // ✅ add
//       here, //add
//       oppLabelX: oppCenterX,
//       oppLabelY,
//       sideLabelY,
//       sideBaseY,
//       sideBaseX,
//       sideBaseW,
//       sideBaseH,
//       rampPoints,
//     };
//   }, []);

//   const isSelected = (v: string) => v === value;

//   return (
//     <div className="w-full h-full">
//       <svg className="w-full h-full block" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid meet">
//         {/* Fence */}
//         <text x={fence.labelX} y={fence.labelY} fill="#2563eb" fontSize="22" fontWeight="700">
//           Fence
//         </text>

//         <g
//           onClick={() => onChange("Fence")}
//           style={{ cursor: "pointer" }}
//         >
//           <rect
//             x={fence.x}
//             y={fence.y}
//             width={fence.w}
//             height={fence.h}
//             rx="6"
//             fill={isSelected("Fence") ? "#16a34a" : "#ffffff"}
//             stroke={isSelected("Fence") ? "#14532d" : "#9ca3af"}
//             strokeWidth="4"
//           />

//           <text
//             x={fence.x + fence.w / 2}
//             y={fence.y + fence.h / 2}
//             textAnchor="middle"
//             dominantBaseline="middle"
//             fontSize="26"
//             fontWeight="800"
//             fill={isSelected("Fence") ? "#ffffff" : "#6b7280"}
//             writingMode="vertical-lr"
//             orientation="upright"
//             pointerEvents="none"
//           >
//             Fence Park
//           </text>
//         </g>



//         {/* Wall */}
//         <g onClick={() => onChange("Wall")} style={{ cursor: "pointer" }}>
//           <rect
//             x={wall.x}
//             y={wall.y}
//             width={wall.w}
//             height={wall.h}
//             rx="8"
//             fill={isSelected("Wall") ? "#16a34a" : "#ffffff"}
//             stroke={isSelected("Wall") ? "#14532d" : "#9ca3af"}
//             strokeWidth="4"
//           />
//           <text
//             x={wall.labelX}
//             y={wall.labelY}
//             textAnchor="middle"
//             fontSize="28"
//             fontWeight="800"
//             fill={isSelected("Wall") ? "#ffffff" : "#6b7280"}
//           >
//             Wall Park
//           </text>
//         </g>

//         {/* Reception Stairs */}
//         <g onClick={() => onChange(reception.value)} style={{ cursor: "pointer" }}>
//           <rect
//             x={reception.x}
//             y={reception.y}
//             width={reception.w}
//             height={reception.h}
//             rx="8"
//             fill={isSelected(reception.value) ? "#16a34a" : "#ffffff"}
//             stroke={isSelected(reception.value) ? "#14532d" : "#9ca3af"}
//             strokeWidth="4"
//           />
//           <text
//             x={reception.x + reception.w / 2}
//             y={reception.y + reception.h / 2}
//             textAnchor="middle"
//             dominantBaseline="middle"
//             fontSize="26"
//             fontWeight="800"
//             fill={isSelected(reception.value) ? "#ffffff" : "#6b7280"}
//           >
//             Reception Stairs
//           </text>

//         </g>

//         {/* <g pointerEvents="none">
//           <rect
//             x={here.x}
//             y={here.y}
//             width={here.w}
//             height={here.h}
//             rx="10"
//             fill="#fef3c7"        // amber background
//             stroke="#f59e0b"
//             strokeWidth="4"
//           />
//           <text
//             x={here.x + here.w / 2}
//             y={here.y + here.h / 2}
//             textAnchor="middle"
//             dominantBaseline="middle"
//             fontSize="26"
//             fontWeight="900"
//              fill="#92400e"
//           >
//             YOU ARE HERE! 
//           </text>

//         </g> */}

//         {/* You Are Here – Person + Speech Bubble */}
//         <g
//           transform={`translate(${here.x}, ${here.y})`}
//           pointerEvents="none"
//         >
//           {/* Speech bubble */}
//           <g transform="translate(60, -10)">
//             <rect
//               x="0"
//               y="0"
//               rx="12"
//               ry="12"
//               width="220"
//               height="70"
//               fill="#fef3c7"
//               stroke="#f59e0b"
//               strokeWidth="4"
//             />

//             {/* Bubble tail */}
//             <polygon
//               points="40,70 55,70 30,95"
//               fill="#fef3c7"
//               stroke="#f59e0b"
//               strokeWidth="4"
//             />

//             <text
//               x="110"
//               y="44"
//               textAnchor="middle"
//               fontSize="24"
//               fontWeight="900"
//               fill="#92400e"
//             >
//               YOU ARE HERE!
//             </text>
//           </g>

//           {/* Person icon */}
//           <g transform="translate(40, 80)">
//             {/* Head */}
//             <circle cx="0" cy="-22" r="16" fill="#2563eb" />

//             {/* Body */}
//             <rect
//               x="-14"
//               y="-4"
//               width="28"
//               height="40"
//               rx="12"
//               fill="#2563eb"
//             />

//             {/* Legs */}
//             <line x1="-8" y1="36" x2="-8" y2="56" stroke="#2563eb" strokeWidth="6" />
//             <line x1="8" y1="36" x2="8" y2="56" stroke="#2563eb" strokeWidth="6" />
//           </g>
//         </g>



//         {/* Opposite label */}
//         <text x={oppLabelX} y={oppLabelY} fill="#2563eb" fontSize="26" fontWeight="700" textAnchor="middle">
//           Opposite Bays
//         </text>

//         {/* Opposite Bays */}
//         {oppositeBays.map((b) => (
//           <BayRect key={b.value} b={b} active={isSelected(b.value)} onChange={onChange} />
//         ))}

//         {/* ✅ Ramp triangle above Bay 6 → 1 (behind Bay buttons) */}
//         <polygon points={rampPoints} fill="#2f6b1b" opacity={0.95} />

//         {/* Bay Row */}
//         {bayBays.map((b) => (
//           <BayRect key={b.value} b={b} active={isSelected(b.value)} onChange={onChange} />
//         ))}

//         {/* Side label */}
//         <text x={sideBaseX} y={sideLabelY} fill="#2563eb" fontSize="26" fontWeight="700">
//           Side
//         </text>

//         {/* Side green line */}
//         <rect x={sideBaseX} y={sideBaseY} width={sideBaseW} height={sideBaseH} rx="3" fill="#0f6a2a" />

//         {/* Side Bays */}
//         {sideBays.map((b) => (
//           <BayRect key={b.value} b={b} active={isSelected(b.value)} onChange={onChange} />
//         ))}
//       </svg>
//     </div>
//   );
// }

// function BayRect({
//   b,
//   active,
//   onChange,
// }: {
//   b: BaySpec;
//   active: boolean;
//   onChange: (v: string) => void;
// }) {
//   return (
//     <g onClick={() => onChange(b.value)} style={{ cursor: "pointer" }}>
//       <rect
//         x={b.x}
//         y={b.y}
//         width={b.w}
//         height={b.h}
//         rx="6"
//         fill={active ? "#16a34a" : "#ffffff"}
//         stroke={active ? "#14532d" : "#9ca3af"}
//         strokeWidth="4"
//       />
//       <text
//         x={b.x + b.w / 2}
//         y={b.y + b.h / 2 + 10}
//         textAnchor="middle"
//         fontSize={active ? 26 : 22}
//         fontWeight="800"
//         fill={active ? "#ffffff" : "#6b7280"}
//       >
//         {b.label}
//       </text>
//     </g>
//   );
// }





"use client";

import React, { JSX, useMemo } from "react";

export type CarParkMapProps = {
  value: string;
  onChange: (value: string) => void;
};

type BaySpec = {
  label: string;
  value: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export default function CarParkMap({ value, onChange }: CarParkMapProps): JSX.Element {
  const VB_W = 1200;
  const VB_H = 720;

  const {
    oppositeBays,
    bayBays,
    sideBays,
    wall,
    fence,
    reception,
    here,
    oppLabelX,
    oppLabelY,
    sideLabelY,
    sideBaseY,
    sideBaseX,
    sideBaseW,
    sideBaseH,
    rampPoints,
  } = useMemo(() => {
    const bw = 52;
    const bh = 92;
    const gap = 14;

    const sideW = 82;
    const sideH = 150;
    const sideGap = 24;

    // =============== Fence (far left) ===============
    const fence = {
      labelX: 1120,
      labelY: 160,
      x: 1120,
      y: 180,
      w: 70,
      h: 340,
    };

    // =============== SIDE anchored to TOP (with breathing room) ===============
    const sideBaseH = 14;
    const sideGapToLine = 16;

    const sideBaseY = 100; // pushed down from top edge
    const sideY = sideBaseY + sideGapToLine + sideBaseH;
    const sideLabelY = sideBaseY - 30; // label just above the green line

    const sideBaseX = 600;
    const sideBlockW = 3 * sideW + 2 * sideGap;
    const sideBaseW = Math.max(360, sideBlockW + 80);

    const sideBays: BaySpec[] = [24, 25, 26].map((n, i) => ({
      label: String(n),
      value: `Side-${n}`,
      x: sideBaseX + 40 + i * (sideW + sideGap),
      y: sideY,
      w: sideW,
      h: sideH,
    }));

    // // =============== Reception Stairs (top-right, aligned with green line) ===============
    // const reception = {
    //   x: VB_W - 300,
    //   y: sideBaseY - 140, // vertically centred near the green line
    //   w: 300,
    //   h: 74,
    //   labelX: VB_W - 195,
    //   labelY: 70,
    //   value: "Reception-Stairs",
    //   label: "Reception Stairs",
    // };

    // // =============== You are here (top-right, below reception with gap) ===============
    // const here = {
    //   x: VB_W - 300,
    //   y: reception.y + reception.h + 30, // 30px gap below reception button
    //   w: 350,
    //   h: 350,
    //   labelX: VB_W - 195,
    //   labelY: 70,
    //   label: "You are standing here!",
    // };

    // =============== Reception Stairs (left side) ===============
    const reception = {
      x: 220,
      y: sideBaseY - 140,
      w: 300,
      h: 74,
      labelX: VB_W - 195,
      labelY: 70,
      value: "Reception-Stairs",
      label: "Reception Stairs",
    };
 
    // =============== You are here (left side, below reception) ===============
    const here = {
      x: 240,
      y: reception.y + reception.h + 30,
      w: 350,
      h: 350,
      labelX: VB_W - 195,
      labelY: 70,
      label: "You are standing here!",
    };

    // =============== Opposite Bays — anchored at the bottom ===============
    const bayToBottomMargin = 200;
    const oppY = VB_H - bh - bayToBottomMargin;

    // =============== Bay Row — above Opposite Bays ===============
    const oppToBayGap = 10;
    const bayY = oppY - bh - oppToBayGap;

    // const oppositeNums = [17, 16, 15, 14, 13, 12, 11, 10, 9, 8] as const;
    // const bayNums = [17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1] as const;

    const oppositeNums = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17] as const;
    const bayNums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17] as const;

    const oppRowWidth = oppositeNums.length * bw + (oppositeNums.length - 1) * gap;
    const bayRowWidth = bayNums.length * bw + (bayNums.length - 1) * gap;

    // const centerX = VB_W / 2 + 40;
    const centerX = VB_W / 2 - 44;
    const bayX0 = Math.round(centerX - bayRowWidth / 2);
    const triangleSpace = 7 * (bw + gap);

    const oppX0 = bayX0 + triangleSpace;

    const oppLabelY = oppY + bh + 42;

    // =============== Wall — above Opposite label ===============
    const wallW = 300;
    const wallH = 74;
    const oppCenterX = oppX0 + oppRowWidth / 2;
    const wallToOppGap = -180;
    const wallY = Math.max(18, oppLabelY - wallH - wallToOppGap);

    const wall = {
      x: Math.round(oppCenterX - wallW / 2),
      y: wallY,
      w: wallW,
      h: wallH,
      labelX: oppCenterX,
      labelY: wallY + 48,
    };

    // =============== Build Opposite + Bay ===============
    const oppositeBays: BaySpec[] = oppositeNums.map((n, i) => ({
      label: String(n),
      value: `Opp-${n}`,
      x: oppX0 + i * (bw + gap),
      y: oppY,
      w: bw,
      h: bh,
    }));

    const bayBays: BaySpec[] = bayNums.map((n, i) => ({
      label: String(n),
      value: `Bay-${n}`,
      x: bayX0 + i * (bw + gap),
      y: bayY,
      w: bw,
      h: bh,
    }));

    // // =============== RAMP TRIANGLE — back wall at Bay-8, point at Bay-1 ===============
    // // Opposite Bays row ends at Bay-8 (rightmost, index 9 in bayNums)
    // // bayNums = [17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1]
    // // Bay-8 => index 9, Bay-7 => index 10, Bay-1 => index 16

    // // xBack: left edge of Bay-8 column in the bay row (where Opp row ends)
    // const idxBay8 = 10;
    // const idxBay1 = 16;
    // const xBack = bayX0 + idxBay8 * (bw + gap);
    // // xPoint: right edge of Bay-1
    // const xPoint = bayX0 + idxBay1 * (bw + gap) + bw;

    // // Triangle is the same height as the Bay row, sitting inline with bays 17–8
    // const yTop = oppY;          // top of Opposite Bays row (triangle top, in line with bay row)
    // const yBottom = oppY + bh;  // bottom of Opposite Bays row (triangle bottom)

    // // Back wall at Bay-8 (right side, full height), tip at bottom-right of Bay-1
    // // Top-left at Bay-8, bottom-left at Bay-8, tip at top-right Bay-1
    // const rampPoints = `${xBack},${yTop} ${xBack},${yBottom} ${xPoint},${yTop}`;

    // =============== RAMP TRIANGLE — LEFT SIDE ===============

    // Bay-8 position
    const idxBay8 = 7;    

    // Gap between Bay-8 and triangle
    const triangleGap = 12;   

    // Vertical back of triangle slightly LEFT of Bay-8
    const xBack =
      bayX0 + idxBay8 * (bw + gap) - triangleGap;   

    // Point/tip aligned toward Bay-1
    const xPoint = bayX0;   

    // Same vertical alignment as rows
    const yTop = oppY;
    const yBottom = oppY + bh;    

    // Back on left side near Bay-8, point toward Bay-1
    const rampPoints = `${xBack},${yTop} ${xBack},${yBottom} ${xPoint},${yTop}`;
    
    return {
      oppositeBays,
      bayBays,
      sideBays,
      wall,
      fence,
      reception,
      here,
      oppLabelX: oppCenterX,
      oppLabelY,
      sideLabelY,
      sideBaseY,
      sideBaseX,
      sideBaseW,
      sideBaseH,
      rampPoints,
    };
  }, []);

  const isSelected = (v: string) => v === value;

  return (
    <div className="w-full h-full">
      <svg className="w-full h-full block" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid meet">

        {/* ── TOP SECTION: Side green line, Side bays, Reception Stairs, You Are Here ── */}

        {/* Side label */}
        <text x={sideBaseX} y={sideLabelY + 18} fill="#2563eb" fontSize="26" fontWeight="700">
          Side
        </text>

        {/* Side green line */}
        <rect x={sideBaseX} y={sideBaseY} width={sideBaseW} height={sideBaseH} rx="3" fill="#0f6a2a" />

        {/* Side Bays */}
        {sideBays.map((b) => (
          <BayRect key={b.value} b={b} active={isSelected(b.value)} onChange={onChange} />
        ))}

        {/* Reception Stairs */}
        <g onClick={() => onChange(reception.value)} style={{ cursor: "pointer" }}>
          <rect
            x={reception.x}
            y={reception.y}
            width={reception.w}
            height={reception.h}
            rx="8"
            fill={isSelected(reception.value) ? "#16a34a" : "#ffffff"}
            stroke={isSelected(reception.value) ? "#14532d" : "#9ca3af"}
            strokeWidth="4"
          />
          <text
            x={reception.x + reception.w / 2}
            y={reception.y + reception.h / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="26"
            fontWeight="800"
            fill={isSelected(reception.value) ? "#ffffff" : "#6b7280"}
          >
            Reception Stairs
          </text>
        </g>

        {/* You Are Here – Person + Speech Bubble */}
        <g transform={`translate(${here.x}, ${here.y})`} pointerEvents="none">
          {/* Speech bubble */}
          <g transform="translate(60, -10)">
            <rect x="0" y="0" rx="12" ry="12" width="220" height="70" fill="#fef3c7" stroke="#f59e0b" strokeWidth="4" />
            {/* Bubble tail */}
            <polygon points="40,70 55,70 30,95" fill="#fef3c7" stroke="#f59e0b" strokeWidth="4" />
            <text x="110" y="44" textAnchor="middle" fontSize="24" fontWeight="900" fill="#92400e">
              YOU ARE HERE!
            </text>
          </g>
          {/* Person icon */}
          <g transform="translate(40, 80)">
            <circle cx="0" cy="-22" r="16" fill="#2563eb" />
            <rect x="-14" y="-4" width="28" height="40" rx="12" fill="#2563eb" />
            <line x1="-8" y1="36" x2="-8" y2="56" stroke="#2563eb" strokeWidth="6" />
            <line x1="8" y1="36" x2="8" y2="56" stroke="#2563eb" strokeWidth="6" />
          </g>
        </g>

        {/* ── BOTTOM SECTION: Wall, Opposite Bays, Bay row, Ramp, Fence ── */}

        {/* Fence */}
        <text x={fence.labelX} y={fence.labelY} fill="#2563eb" fontSize="22" fontWeight="700">
          Fence
        </text>
        <g onClick={() => onChange("Fence")} style={{ cursor: "pointer" }}>
          <rect
            x={fence.x}
            y={fence.y}
            width={fence.w}
            height={fence.h}
            rx="6"
            fill={isSelected("Fence") ? "#16a34a" : "#ffffff"}
            stroke={isSelected("Fence") ? "#14532d" : "#9ca3af"}
            strokeWidth="4"
          />
          <text
            x={fence.x + fence.w / 2}
            y={fence.y + fence.h / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="26"
            fontWeight="800"
            fill={isSelected("Fence") ? "#ffffff" : "#6b7280"}
            writingMode="vertical-lr"
            orientation="upright"
            pointerEvents="none"
          >
            Fence Park
          </text>
        </g>

        {/* Wall */}
        <g onClick={() => onChange("Wall")} style={{ cursor: "pointer" }}>
          <rect
            x={wall.x}
            y={wall.y}
            width={wall.w}
            height={wall.h}
            rx="8"
            fill={isSelected("Wall") ? "#16a34a" : "#ffffff"}
            stroke={isSelected("Wall") ? "#14532d" : "#9ca3af"}
            strokeWidth="4"
          />
          <text
            x={wall.labelX}
            y={wall.labelY}
            textAnchor="middle"
            fontSize="28"
            fontWeight="800"
            fill={isSelected("Wall") ? "#ffffff" : "#6b7280"}
          >
            Wall Park
          </text>
        </g>

        {/* Opposite label */}
        <text x={oppLabelX} y={oppLabelY} fill="#2563eb" fontSize="26" fontWeight="700" textAnchor="middle">
          Opposite Bays
        </text>

        {/* Bay Row (upper of the two bottom rows) */}
        {bayBays.map((b) => (
          <BayRect key={b.value} b={b} active={isSelected(b.value)} onChange={onChange} />
        ))}

        {/* Ramp triangle — sits between Bay row and Opposite Bays, back at Bay-8, point at Bay-1 */}
        <polygon points={rampPoints} fill="#2f6b1b" opacity={0.95} />

        {/* Opposite Bays (lower of the two bottom rows) */}
        {oppositeBays.map((b) => (
          <BayRect key={b.value} b={b} active={isSelected(b.value)} onChange={onChange} />
        ))}

      </svg>
    </div>
  );
}

function BayRect({
  b,
  active,
  onChange,
}: {
  b: BaySpec;
  active: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <g onClick={() => onChange(b.value)} style={{ cursor: "pointer" }}>
      <rect
        x={b.x}
        y={b.y}
        width={b.w}
        height={b.h}
        rx="6"
        fill={active ? "#16a34a" : "#ffffff"}
        stroke={active ? "#14532d" : "#9ca3af"}
        strokeWidth="4"
      />
      <text
        x={b.x + b.w / 2}
        y={b.y + b.h / 2 + 10}
        textAnchor="middle"
        fontSize={active ? 26 : 22}
        fontWeight="800"
        fill={active ? "#ffffff" : "#6b7280"}
      >
        {b.label}
      </text>
    </g>
  );
}