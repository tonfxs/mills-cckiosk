// import { NextRequest, NextResponse } from "next/server";

// const ALLOWED_IPS = process.env.ALLOWED_IPS?.split(",").map(ip => ip.trim()) || [];

// export default function proxy(req: NextRequest) {
//   const ip =
//     req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
//     req.headers.get("x-real-ip") ||
//     "";

//   if (!ALLOWED_IPS.includes(ip)) {
//     return new NextResponse(
//       `<html><body style="font-family:sans-serif;text-align:center;padding:100px">
//         <h1>Access Denied</h1>
//         <p>This kiosk is only available in-store.</p>
//       </body></html>`,
//       { status: 403, headers: { "Content-Type": "text/html" } }
//     );
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/((?!_next|favicon.ico).*)"],
// };
