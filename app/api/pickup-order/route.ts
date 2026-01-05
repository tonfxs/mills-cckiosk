// import { NextRequest, NextResponse } from "next/server";
// import { google } from "googleapis";

// // ----------------------------
// // Types
// // ----------------------------
// interface OrderData {
//     // fullName: string;
//     firstName: string;
//     lastName: string;
//     phone: string;
//     orderNumber: string;
//     creditCard: string;
//     validId: string;
//     paymentMethod: string;
//     carParkBay: string;
//     confirmed: boolean;
// }

// // ----------------------------
// // Google Auth
// // ----------------------------
// async function getGoogleAuth() {
//     const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
//     const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

//     if (!clientEmail || !privateKey) {
//         throw new Error("Missing Google credentials");
//     }

//     return new google.auth.GoogleAuth({
//         credentials: {
//             client_email: clientEmail,
//             private_key: privateKey,
//         },
//         scopes: ["https://www.googleapis.com/auth/spreadsheets"],
//     });
// }

// // ----------------------------
// // Save to Google Sheets (Append at Bottom)
// // ----------------------------
// async function saveToSheet(orderData: OrderData) {
//     const spreadsheetId = process.env.GOOGLE_SHEET_ID;
//     if (!spreadsheetId) throw new Error("GOOGLE_SHEET_ID missing");

//     const auth = await getGoogleAuth();
//     const sheets = google.sheets({ version: "v4", auth });
    


//     function getAustraliaTimestamp() {
//         const now = new Date();
//         const australiaTime = new Intl.DateTimeFormat("en-AU", {
//             timeZone: "Australia/Sydney",
//             year: "numeric",
//             month: "2-digit",
//             day: "2-digit",
//             hour: "2-digit",
//             minute: "2-digit",
//             second: "2-digit",
//             hour12: false,
//         }).format(now);

//         return australiaTime.replace(",", "");
//     }

//     const timestamp = getAustraliaTimestamp();

//     // Save to Pickupsv1 sheet
//     const respPickups = await sheets.spreadsheets.values.get({
//         spreadsheetId,
//         range: "Pickupsv1!A:A",
//     });

//     const rowsPickups = respPickups.data.values || [];
//     const lastRowPickups = rowsPickups.length + 1;
//     const fullName = `${orderData.firstName} ${orderData.lastName}`.trim().replace(/\s+/g, " ");

    

//     await sheets.spreadsheets.values.update({
//         spreadsheetId,
//         range: `Pickupsv1!A${lastRowPickups}:J${lastRowPickups}`,
//         valueInputOption: "USER_ENTERED",
//         requestBody: {
//             values: [
//                 [
//                     timestamp,
//                     orderData.fullName,
//                     // orderData.firstName,
//                     // orderData.lastName,
//                     orderData.phone,
//                     orderData.orderNumber,
//                     "'" + orderData.creditCard,
//                     orderData.validId,
//                     orderData.paymentMethod,
//                     orderData.carParkBay,
//                     "Pending Verification",
//                     "",
//                 ],
//             ],
//         },
//     });

//     // Save to MASTERLIST sheet
//     const respMaster = await sheets.spreadsheets.values.get({
//         spreadsheetId,
//         range: "MASTER LIST!A:A",
//     });

//     const rowsMaster = respMaster.data.values || [];
//     const lastRowMaster = rowsMaster.length + 1;

//     await sheets.spreadsheets.values.update({
//         spreadsheetId,
//         range: `MASTER LIST!A${lastRowMaster}:K${lastRowMaster}`,
//         valueInputOption: "USER_ENTERED",
//         requestBody: {
//             values: [
//                 [
//                     timestamp,
//                     orderData.fullName,
//                     // orderData.firstName,
//                     // orderData.lastName,
//                     orderData.phone,
//                     orderData.orderNumber,
//                     "'" + orderData.creditCard,
//                     orderData.validId,
//                     orderData.paymentMethod,
//                     orderData.carParkBay,
//                     "Pending Verification",
//                     "",
//                     "Order Pickup", // Transaction Type
//                 ],
//             ],
//         },
//     });
// }

// // ----------------------------
// // POST — Save Multiple Orders
// // ----------------------------
// export async function POST(request: NextRequest) {
//     try {
//         const form = await request.formData();

//         const orderData: OrderData = {
//             firstName: String(form.get("firstName") || ""),
//             lastName: String(form.get("lastName") || ""),
//             phone: String(form.get("phone") || ""),
//             orderNumber: String(form.get("orderNumber") || ""),
//             creditCard: String(form.get("creditCard") || ""),
//             validId: String(form.get("validId") || ""),
//             paymentMethod: String(form.get("paymentMethod") || ""),
//             carParkBay: String(form.get("carParkBay") || ""),
//             confirmed: form.get("confirmed") === "true",
//         };

//         // Split order numbers by comma and trim whitespace
//         const orderNumbers = orderData.orderNumber
//             .split(",")
//             .map(num => num.trim())
//             .filter(num => num.length > 0);

//         // Save each order separately with the same customer info
//         for (const orderNum of orderNumbers) {
//             const singleOrderData = {
//                 ...orderData,
//                 orderNumber: orderNum
//             };
//             await saveToSheet(singleOrderData);
//         }

//         return NextResponse.json({
//             success: true,
//             message: `${orderNumbers.length} order${orderNumbers.length > 1 ? 's' : ''} saved successfully`,
//             orderCount: orderNumbers.length,
//             orders: orderNumbers
//         });
//     } catch (err: any) {
//         console.error("❌ ERROR:", err);
//         return NextResponse.json(
//             { success: false, error: err.message },
//             { status: 500 }
//         );
//     }
// }

// // ----------------------------
// // GET — Fetch by Order Number
// // ----------------------------
// export async function GET(request: NextRequest) {
//     try {
//         const orderNumber = request.nextUrl.searchParams.get("orderNumber");
//         if (!orderNumber) {
//             return NextResponse.json(
//                 { success: false, error: "orderNumber required" },
//                 { status: 400 }
//             );
//         }

//         const auth = await getGoogleAuth();
//         const sheets = google.sheets({ version: "v4", auth });

//         const spreadsheetId = process.env.GOOGLE_SHEET_ID;

//         const resp = await sheets.spreadsheets.values.get({
//             spreadsheetId,
//             range: "Pickupsv1!A:J",
//         });

//         const rows = resp.data.values || [];
//         const match = rows.find((row) => row[3] === orderNumber);

//         if (!match) {
//             return NextResponse.json(
//                 { success: false, error: "Order not found" },
//                 { status: 404 }
//             );
//         }

//         return NextResponse.json({
//             success: true,
//             data: {
//                 timestamp: match[0],
//                 fullName: match[1],
//                 phone: match[2],
//                 orderNumber: match[3],
//                 creditCard: match[4],
//                 validId: match[5],
//                 paymentMethod: match[6],
//                 carParkBay: match[7],
//                 status: match[8],
//                 agent: match[9] || "",
//             },
//         });
//     } catch (err: any) {
//         return NextResponse.json(
//             { success: false, error: err.message },
//             { status: 500 }
//         );
//     }
// }

import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

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
// Google Auth
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
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
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

async function getSheetIdByTitle(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  title: string
) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetId = meta.data.sheets?.find((s) => s.properties?.title === title)?.properties?.sheetId;
  if (sheetId == null) throw new Error(`Sheet "${title}" not found`);
  return sheetId;
}

async function addNoteToCell(params: {
  sheets: ReturnType<typeof google.sheets>;
  spreadsheetId: string;
  sheetId: number;
  rowIndex0: number; // 0-based
  colIndex0: number; // 0-based
  note: string;
}) {
  const { sheets, spreadsheetId, sheetId, rowIndex0, colIndex0, note } = params;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          updateCells: {
            start: {
              sheetId,
              rowIndex: rowIndex0,
              columnIndex: colIndex0,
            },
            rows: [{ values: [{ note }] }],
            fields: "note",
          },
        },
      ],
    },
  });
}

// ----------------------------
// Save to Google Sheets (Append at Bottom)
// - Writes FullName as "First Last"
// - Adds a NOTE to the FullName cell showing firstName/lastName sources
// ----------------------------
async function saveToSheet(orderData: OrderData) {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) throw new Error("GOOGLE_SHEET_ID missing");

  const auth = await getGoogleAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const timestamp = getAustraliaTimestamp();
  const fullName = buildFullName(orderData.firstName, orderData.lastName);
  const fullNameNote = `firstName: ${orderData.firstName}\nlastName: ${orderData.lastName}`;

  // Resolve sheet IDs once per save (safe + simple)
  const pickupSheetId = await getSheetIdByTitle(sheets, spreadsheetId, "Pickupsv1");
  const masterSheetId = await getSheetIdByTitle(sheets, spreadsheetId, "MASTER LIST");

  // ----------------------------
  // Pickupsv1: find next row via column A
  // ----------------------------
  const respPickups = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Pickupsv1!A:A",
  });

  const rowsPickups = respPickups.data.values || [];
  const lastRowPickups = rowsPickups.length + 1; // 1-based row number

  // A:J = 10 columns -> write EXACTLY 10 values
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Pickupsv1!A${lastRowPickups}:J${lastRowPickups}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          timestamp, // A
          fullName, // B (FullName)
          orderData.phone, // C
          orderData.orderNumber, // D
          "'" + orderData.creditCard, // E (force string)
          orderData.validId, // F
          orderData.paymentMethod, // G
          orderData.carParkBay, // H
          "Pending Verification", // I
          "", // J (Agent/blank)
        ],
      ],
    },
  });

  // Add note on FullName cell (B) => colIndex 1, rowIndex0 = lastRowPickups - 1
  await addNoteToCell({
    sheets,
    spreadsheetId,
    sheetId: pickupSheetId,
    rowIndex0: lastRowPickups - 1,
    colIndex0: 1,
    note: fullNameNote,
  });

  // ----------------------------
  // MASTER LIST: find next row via column A
  // ----------------------------
  const respMaster = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "MASTER LIST!A:A",
  });

  const rowsMaster = respMaster.data.values || [];
  const lastRowMaster = rowsMaster.length + 1; // 1-based row number

  // A:K = 11 columns -> write EXACTLY 11 values
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `MASTER LIST!A${lastRowMaster}:K${lastRowMaster}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          timestamp, // A
          fullName, // B (FullName)
          orderData.phone, // C
          orderData.orderNumber, // D
          "'" + orderData.creditCard, // E (force string)
          orderData.validId, // F
          orderData.paymentMethod, // G
          orderData.carParkBay, // H
          "Pending Verification", // I
          "", // J
          "Order Pickup", // K (Transaction Type)
        ],
      ],
    },
  });

  // Add note on FullName cell (B)
  await addNoteToCell({
    sheets,
    spreadsheetId,
    sheetId: masterSheetId,
    rowIndex0: lastRowMaster - 1,
    colIndex0: 1,
    note: fullNameNote,
  });
}

// ----------------------------
// POST — Save Multiple Orders
// ----------------------------
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();

    const orderData: OrderData = {
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

    // Split order numbers by comma and trim whitespace
    const orderNumbers = orderData.orderNumber
      .split(",")
      .map((num) => num.trim())
      .filter((num) => num.length > 0);

    // Save each order separately with the same customer info
    for (const orderNum of orderNumbers) {
      const singleOrderData: OrderData = {
        ...orderData,
        orderNumber: orderNum,
      };
      await saveToSheet(singleOrderData);
    }

    return NextResponse.json({
      success: true,
      message: `${orderNumbers.length} order${orderNumbers.length > 1 ? "s" : ""} saved successfully`,
      orderCount: orderNumbers.length,
      orders: orderNumbers,
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

    const auth = await getGoogleAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error("GOOGLE_SHEET_ID missing");

    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Pickupsv1!A:J",
    });

    const rows = resp.data.values || [];
    const match = rows.find((row) => String(row[3] || "") === orderNumber);

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
      },
    });
  } catch (err: any) {
    console.error("❌ ERROR:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
