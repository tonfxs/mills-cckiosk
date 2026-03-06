// // import { NextRequest, NextResponse } from "next/server";
// // import { google } from "googleapis";

// // // ----------------------------
// // // Types
// // // ----------------------------
// // interface OrderData {
// //   firstName: string;
// //   lastName: string;
// //   phone: string;
// //   orderNumber: string;
// //   creditCard: string;
// //   validId: string;
// //   paymentMethod: string;
// //   carParkBay: string;
// //   confirmed: boolean;
// // }

// // // ----------------------------
// // // Google Auth
// // // ----------------------------
// // async function getGoogleAuth() {
// //   const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
// //   const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

// //   if (!clientEmail || !privateKey) {
// //     throw new Error("Missing Google credentials");
// //   }

// //   return new google.auth.GoogleAuth({
// //     credentials: {
// //       client_email: clientEmail,
// //       private_key: privateKey,
// //     },
// //     scopes: ["https://www.googleapis.com/auth/spreadsheets"],
// //   });
// // }

// // // ----------------------------
// // // Helpers
// // // ----------------------------
// // function getAustraliaTimestamp() {
// //   const now = new Date();
// //   const australiaTime = new Intl.DateTimeFormat("en-AU", {
// //     timeZone: "Australia/Sydney",
// //     year: "numeric",
// //     month: "2-digit",
// //     day: "2-digit",
// //     hour: "2-digit",
// //     minute: "2-digit",
// //     second: "2-digit",
// //     hour12: false,
// //   }).format(now);

// //   return australiaTime.replace(",", "");
// // }

// // function buildFullName(firstName: string, lastName: string) {
// //   return `${firstName} ${lastName}`.trim().replace(/\s+/g, " ");
// // }

// // // ----------------------------
// // // Save to Google Sheets
// // // ----------------------------
// // async function saveToSheet(orderData: OrderData) {
// //   const spreadsheetId = process.env.GOOGLE_SHEET_ID;
// //   if (!spreadsheetId) throw new Error("GOOGLE_SHEET_ID missing");

// //   const auth = await getGoogleAuth();
// //   const sheets = google.sheets({ version: "v4", auth });

// //   const timestamp = getAustraliaTimestamp();
// //   const fullName = buildFullName(orderData.firstName, orderData.lastName);

// //   // ----------------------------
// //   // Pickupsv1
// //   // ----------------------------
// //   const pickupResp = await sheets.spreadsheets.values.get({
// //     spreadsheetId,
// //     range: "Pickupsv1!A:A",
// //   });

// //   const pickupRows = pickupResp.data.values || [];
// //   const pickupRow = pickupRows.length + 1;

// //   await sheets.spreadsheets.values.update({
// //     spreadsheetId,
// //     range: `Pickupsv1!A${pickupRow}:J${pickupRow}`,
// //     valueInputOption: "USER_ENTERED",
// //     requestBody: {
// //       values: [
// //         [
// //           timestamp,                  // A
// //           fullName,                   // B (Full Name)
// //           orderData.phone,            // C
// //           orderData.orderNumber,      // D
// //           "'" + orderData.creditCard, // E
// //           orderData.validId,          // F
// //           orderData.paymentMethod,    // G
// //           orderData.carParkBay,       // H
// //           "Pending Verification",     // I
// //           "",                         // J
// //         ],
// //       ],
// //     },
// //   });

// //   // ----------------------------
// //   // MASTER LIST
// //   // ----------------------------
// //   const masterResp = await sheets.spreadsheets.values.get({
// //     spreadsheetId,
// //     range: "MASTER LIST!A:A",
// //   });

// //   const masterRows = masterResp.data.values || [];
// //   const masterRow = masterRows.length + 1;

// //   await sheets.spreadsheets.values.update({
// //     spreadsheetId,
// //     range: `MASTER LIST!A${masterRow}:K${masterRow}`,
// //     valueInputOption: "USER_ENTERED",
// //     requestBody: {
// //       values: [
// //         [
// //           timestamp,                  // A
// //           fullName,                   // B (Full Name)
// //           orderData.phone,            // C
// //           orderData.orderNumber,      // D
// //           "'" + orderData.creditCard, // E
// //           orderData.validId,          // F
// //           orderData.paymentMethod,    // G
// //           orderData.carParkBay,       // H
// //           "Pending Verification",     // I
// //           "",                         // J
// //           "Order Pickup",             // K
// //         ],
// //       ],
// //     },
// //   });
// // }

// // // ----------------------------
// // // POST — Save Orders
// // // ----------------------------
// // export async function POST(request: NextRequest) {
// //   try {
// //     const form = await request.formData();

// //     const baseOrderData: OrderData = {
// //       firstName: String(form.get("firstName") || ""),
// //       lastName: String(form.get("lastName") || ""),
// //       phone: String(form.get("phone") || ""),
// //       orderNumber: String(form.get("orderNumber") || ""),
// //       creditCard: String(form.get("creditCard") || ""),
// //       validId: String(form.get("validId") || ""),
// //       paymentMethod: String(form.get("paymentMethod") || ""),
// //       carParkBay: String(form.get("carParkBay") || ""),
// //       confirmed: form.get("confirmed") === "true",
// //     };

// //     const orderNumbers = baseOrderData.orderNumber
// //       .split(",")
// //       .map(n => n.trim())
// //       .filter(Boolean);

// //     for (const orderNumber of orderNumbers) {
// //       await saveToSheet({
// //         ...baseOrderData,
// //         orderNumber,
// //       });
// //     }

// //     return NextResponse.json({
// //       success: true,
// //       message: `${orderNumbers.length} order(s) saved successfully`,
// //     });
// //   } catch (err: any) {
// //     console.error("❌ ERROR:", err);
// //     return NextResponse.json(
// //       { success: false, error: err.message },
// //       { status: 500 }
// //     );
// //   }
// // }

// // // ----------------------------
// // // GET — Fetch by Order Number
// // // ----------------------------
// // export async function GET(request: NextRequest) {
// //   try {
// //     const orderNumber = request.nextUrl.searchParams.get("orderNumber");
// //     if (!orderNumber) {
// //       return NextResponse.json(
// //         { success: false, error: "orderNumber required" },
// //         { status: 400 }
// //       );
// //     }

// //     const auth = await getGoogleAuth();
// //     const sheets = google.sheets({ version: "v4", auth });

// //     const spreadsheetId = process.env.GOOGLE_SHEET_ID;

// //     const resp = await sheets.spreadsheets.values.get({
// //       spreadsheetId,
// //       range: "Pickupsv1!A:J",
// //     });

// //     const rows = resp.data.values || [];
// //     const match = rows.find(row => String(row[3]) === orderNumber);

// //     if (!match) {
// //       return NextResponse.json(
// //         { success: false, error: "Order not found" },
// //         { status: 404 }
// //       );
// //     }

// //     return NextResponse.json({
// //       success: true,
// //       data: {
// //         timestamp: match[0],
// //         fullName: match[1],
// //         phone: match[2],
// //         orderNumber: match[3],
// //         creditCard: match[4],
// //         validId: match[5],
// //         paymentMethod: match[6],
// //         carParkBay: match[7],
// //         status: match[8],
// //         agent: match[9] || "",
// //       },
// //     });
// //   } catch (err: any) {
// //     return NextResponse.json(
// //       { success: false, error: err.message },
// //       { status: 500 }
// //     );
// //   }
// // }


// // app/api/pickup-order/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { google } from "googleapis";

// // ----------------------------
// // Types
// // ----------------------------
// interface OrderData {
//   firstName: string;
//   lastName: string;
//   phone: string;
//   orderNumber: string;
//   creditCard: string;
//   validId: string;
//   paymentMethod: string;
//   carParkBay: string;
//   confirmed: boolean;
// }

// // ----------------------------
// // Google Auth
// // ----------------------------
// async function getGoogleAuth() {
//   const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
//   const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

//   if (!clientEmail || !privateKey) {
//     throw new Error("Missing Google credentials");
//   }

//   return new google.auth.GoogleAuth({
//     credentials: {
//       client_email: clientEmail,
//       private_key: privateKey,
//     },
//     scopes: ["https://www.googleapis.com/auth/spreadsheets"],
//   });
// }

// // ----------------------------
// // Helpers
// // ----------------------------
// function getAustraliaTimestamp() {
//   const now = new Date();
//   const australiaTime = new Intl.DateTimeFormat("en-AU", {
//     timeZone: "Australia/Sydney",
//     year: "numeric",
//     month: "2-digit",
//     day: "2-digit",
//     hour: "2-digit",
//     minute: "2-digit",
//     second: "2-digit",
//     hour12: false,
//   }).format(now);

//   return australiaTime.replace(",", "");
// }

// function buildFullName(firstName: string, lastName: string) {
//   return `${firstName} ${lastName}`.trim().replace(/\s+/g, " ");
// }

// // ----------------------------
// // Save to Google Sheets
// // ----------------------------
// async function saveToSheet(orderData: OrderData) {
//   const spreadsheetId = process.env.GOOGLE_SHEET_ID;
//   if (!spreadsheetId) throw new Error("GOOGLE_SHEET_ID missing");

//   const auth = await getGoogleAuth();
//   const sheets = google.sheets({ version: "v4", auth });

//   const timestamp = getAustraliaTimestamp();
//   const fullName = buildFullName(orderData.firstName, orderData.lastName);

//   // ----------------------------
//   // Pickupsv1 (A:K)
//   // ----------------------------
//   const pickupResp = await sheets.spreadsheets.values.get({
//     spreadsheetId,
//     range: "Copy of Pickupsv1!A:A",
//   });

//   const pickupRows = pickupResp.data.values || [];
//   const pickupRow = pickupRows.length + 1;

//   await sheets.spreadsheets.values.update({
//     spreadsheetId,
//     range: `Copy of Pickupsv1!A${pickupRow}:K${pickupRow}`,
//     valueInputOption: "USER_ENTERED",
//     requestBody: {
//       values: [
//         [
//           timestamp,                  // A
//           fullName,                   // B
//           orderData.phone,            // C
//           orderData.orderNumber,      // D
//           "'" + orderData.creditCard, // E
//           orderData.validId,          // F
//           orderData.paymentMethod,    // G
//           orderData.carParkBay,       // H
//           "Pending Verification",     // I
//           "",                         // J (Agent)
//           "",                         // K (Notes)
//         ],
//       ],
//     },
//   });

//   // ----------------------------
//   // MASTER LIST (A:L)
//   // ----------------------------
//   const masterResp = await sheets.spreadsheets.values.get({
//     spreadsheetId,
//     range: "MASTER LIST!A:A",
//   });

//   const masterRows = masterResp.data.values || [];
//   const masterRow = masterRows.length + 1;

//   await sheets.spreadsheets.values.update({
//     spreadsheetId,
//     range: `MASTER LIST!A${masterRow}:L${masterRow}`,
//     valueInputOption: "USER_ENTERED",
//     requestBody: {
//       values: [
//         [
//           timestamp,                  // A
//           fullName,                   // B
//           orderData.phone,            // C
//           orderData.orderNumber,      // D
//           "'" + orderData.creditCard, // E
//           orderData.validId,          // F
//           orderData.paymentMethod,    // G
//           orderData.carParkBay,       // H
//           "Pending Verification",     // I
//           "",                         // J
//           "Order Pickup",             // K
//           "",                         // L (Notes)
//         ],
//       ],
//     },
//   });
// }

// // ----------------------------
// // POST — Save Orders
// // ----------------------------
// export async function POST(request: NextRequest) {
//   try {
//     const form = await request.formData();

//     const baseOrderData: OrderData = {
//       firstName: String(form.get("firstName") || ""),
//       lastName: String(form.get("lastName") || ""),
//       phone: String(form.get("phone") || ""),
//       orderNumber: String(form.get("orderNumber") || ""),
//       creditCard: String(form.get("creditCard") || ""),
//       validId: String(form.get("validId") || ""),
//       paymentMethod: String(form.get("paymentMethod") || ""),
//       carParkBay: String(form.get("carParkBay") || ""),
//       confirmed: form.get("confirmed") === "true",
//     };

//     const orderNumbers = baseOrderData.orderNumber
//       .split(",")
//       .map((n) => n.trim())
//       .filter(Boolean);

//     for (const orderNumber of orderNumbers) {
//       await saveToSheet({
//         ...baseOrderData,
//         orderNumber,
//       });
//     }

//     return NextResponse.json({
//       success: true,
//       message: `${orderNumbers.length} order(s) saved successfully`,
//     });
//   } catch (err: any) {
//     console.error("❌ ERROR:", err);
//     return NextResponse.json({ success: false, error: err.message }, { status: 500 });
//   }
// }

// // ----------------------------
// // GET — Fetch by Order Number
// // ----------------------------
// export async function GET(request: NextRequest) {
//   try {
//     const orderNumber = request.nextUrl.searchParams.get("orderNumber");
//     if (!orderNumber) {
//       return NextResponse.json({ success: false, error: "orderNumber required" }, { status: 400 });
//     }

//     const spreadsheetId = process.env.GOOGLE_SHEET_ID;
//     if (!spreadsheetId) throw new Error("GOOGLE_SHEET_ID missing");

//     const auth = await getGoogleAuth();
//     const sheets = google.sheets({ version: "v4", auth });

//     const resp = await sheets.spreadsheets.values.get({
//       spreadsheetId,
//       range: "Pickupsv1!A:K",
//     });

//     const rows = resp.data.values || [];
//     const match = rows.find((row) => String(row[3]) === orderNumber);

//     if (!match) {
//       return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
//     }

//     return NextResponse.json({
//       success: true,
//       data: {
//         timestamp: match[0],
//         fullName: match[1],
//         phone: match[2],
//         orderNumber: match[3],
//         creditCard: match[4],
//         validId: match[5],
//         paymentMethod: match[6],
//         carParkBay: match[7],
//         status: match[8],
//         agent: match[9] || "",
//         notes: match[10] || "",
//       },
//     });
//   } catch (err: any) {
//     return NextResponse.json({ success: false, error: err.message }, { status: 500 });
//   }
// }
// app/api/pickup-order/route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";
import { Buffer } from "buffer";

// ----------------------------
// Types
// ----------------------------
interface OrderData {
  firstName: string;
  lastName: string;
  phone: string;
  orderNumber: string;
  creditCard: string;
  validId: string;
  paymentMethod: string;
  carParkBay: string;
  confirmed: boolean;
}

// ----------------------------
// Google Auth — Sheets
// ----------------------------
async function getGoogleAuth() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  if (!clientEmail || !privateKey) {
    throw new Error("Missing Google credentials");
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });
}

// ----------------------------
// Helpers
// ----------------------------
function getAustraliaTimestamp() {
  const now = new Date();
  const australiaTime = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);

  return australiaTime.replace(",", "");
}

function buildFullName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim().replace(/\s+/g, " ");
}

// ----------------------------
// Upload Signature to Drive
// ----------------------------
async function uploadSignatureToDrive(
  auth: any,
  orderNumber: string,
  signatureBase64: string
) {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) throw new Error("GOOGLE_DRIVE_FOLDER_ID missing");

  const drive = google.drive({ version: "v3", auth });
  const imageBuffer = Buffer.from(signatureBase64, "base64");
  const imageStream = Readable.from([imageBuffer]);

  const timestamp = Date.now();
  const fileName = `Signature_${orderNumber}_${timestamp}.png`;

  const file = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType: "image/png",
      parents: [folderId],
    },
    media: {
      mimeType: "image/png",
      body: imageStream,
    },
    fields: "id, webViewLink",
  });

  return file.data.webViewLink || "";
}

// ----------------------------
// Save to Google Sheets
// ----------------------------
async function saveToSheet(orderData: OrderData, signatureUrl: string, auth: any) {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) throw new Error("GOOGLE_SHEET_ID missing");

  const sheets = google.sheets({ version: "v4", auth });

  const timestamp = getAustraliaTimestamp();
  const fullName = buildFullName(orderData.firstName, orderData.lastName);

  // ----------------------------
  // Copy of Pickupsv1 (A:L)
  // ----------------------------
  const pickupResp = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Copy of Pickupsv1!A:A",
  });

  const pickupRows = pickupResp.data.values || [];
  const pickupRow = pickupRows.length + 1;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Copy of Pickupsv1!A${pickupRow}:L${pickupRow}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          timestamp,                  // A
          fullName,                   // B
          orderData.phone,            // C
          orderData.orderNumber,      // D
          "'" + orderData.creditCard, // E
          orderData.validId,          // F
          orderData.paymentMethod,    // G
          orderData.carParkBay,       // H
          "Pending Verification",     // I
          "",                         // J (Agent)
          "",                         // K (Notes)
          signatureUrl,               // L (Signature)
        ],
      ],
    },
  });

  // ----------------------------
  // MASTER LIST (A:M)
  // ----------------------------
  const masterResp = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "MASTER LIST!A:A",
  });

  const masterRows = masterResp.data.values || [];
  const masterRow = masterRows.length + 1;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `MASTER LIST!A${masterRow}:M${masterRow}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          timestamp,                  // A
          fullName,                   // B
          orderData.phone,            // C
          orderData.orderNumber,      // D
          "'" + orderData.creditCard, // E
          orderData.validId,          // F
          orderData.paymentMethod,    // G
          orderData.carParkBay,       // H
          "Pending Verification",     // I
          "",                         // J
          "Order Pickup",             // K
          "",                         // L (Notes)
          signatureUrl,               // M (Signature)
        ],
      ],
    },
  });
}

// ----------------------------
// POST — Save Orders
// ----------------------------
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();

    const baseOrderData: OrderData = {
      firstName: String(form.get("firstName") || ""),
      lastName: String(form.get("lastName") || ""),
      phone: String(form.get("phone") || ""),
      orderNumber: String(form.get("orderNumber") || ""),
      creditCard: String(form.get("creditCard") || ""),
      validId: String(form.get("validId") || ""),
      paymentMethod: String(form.get("paymentMethod") || ""),
      carParkBay: String(form.get("carParkBay") || ""),
      confirmed: form.get("confirmed") === "true",
    };

    const signatureBase64 = String(form.get("signature") || "");

    const auth = await getGoogleAuth();

    // Upload signature once, reuse URL for all order numbers
    let signatureUrl = "";
    if (signatureBase64) {
      signatureUrl = await uploadSignatureToDrive(
        auth,
        baseOrderData.orderNumber,
        signatureBase64
      );
    }

    const orderNumbers = baseOrderData.orderNumber
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);

    for (const orderNumber of orderNumbers) {
      await saveToSheet(
        { ...baseOrderData, orderNumber },
        signatureUrl,
        auth
      );
    }

    return NextResponse.json({
      success: true,
      message: `${orderNumbers.length} order(s) saved successfully`,
    });
  } catch (err: any) {
    console.error("❌ ERROR:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ----------------------------
// GET — Fetch by Order Number
// ----------------------------
export async function GET(request: NextRequest) {
  try {
    const orderNumber = request.nextUrl.searchParams.get("orderNumber");
    if (!orderNumber) {
      return NextResponse.json({ success: false, error: "orderNumber required" }, { status: 400 });
    }

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error("GOOGLE_SHEET_ID missing");

    const auth = await getGoogleAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Pickupsv1!A:L",
    });

    const rows = resp.data.values || [];
    const match = rows.find((row) => String(row[3]) === orderNumber);

    if (!match) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        timestamp: match[0],
        fullName: match[1],
        phone: match[2],
        orderNumber: match[3],
        creditCard: match[4],
        validId: match[5],
        paymentMethod: match[6],
        carParkBay: match[7],
        status: match[8],
        agent: match[9] || "",
        notes: match[10] || "",
        signature: match[11] || "",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}