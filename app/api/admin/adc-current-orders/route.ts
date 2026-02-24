import { NextResponse } from "next/server";
import { google } from "googleapis";

async function getGoogleAuth() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  if (!clientEmail || !privateKey) {
    throw new Error("Missing Google credentials");
  }

  return new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("📥 Body received:", JSON.stringify(body, null, 2));

    const {
      bayNumber,
      agent,
      status,
      orderNumber,
      externalSku,
      name,
      itemName,
      notes,
      salesChannel,
      location,
    } = body;

    const timeWithAgent = `${new Intl.DateTimeFormat("en-AU", {
      timeZone: "Australia/Sydney",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date())} - ${String(agent).trim().toUpperCase()}`;

    console.log("🕐 timeWithAgent:", timeWithAgent);

    const completeValue = status === "Completed";
    console.log("☑️ completeValue:", completeValue);

    const spreadsheetId = process.env.GOOGLE_SHEET_ID_ADC;
    if (!spreadsheetId) throw new Error("GOOGLE_SHEET_ID_ADC missing");

    const auth = await getGoogleAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const colA = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'Current Orders'!A:A",
    });

    const nextRow = (colA.data.values?.length ?? 0) + 1;
    const targetRange = `'Current Orders'!A${nextRow}`;
    console.log(`📍 Writing to: ${targetRange}`);

    const newRow = [
      timeWithAgent,  // A - Time
      bayNumber,      // B - Bay #
      completeValue,  // C - Complete (checkbox)
      orderNumber,    // D - Order ID
      externalSku,    // E - SKU
      name,           // F - Customer Name
      itemName,       // G - Item Description
      notes,          // H - NOTES
      salesChannel,   // I - Type
      location,       // J - LOCATION
    ];

    console.log("📝 Row to write:", newRow);

    const result = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: targetRange,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [newRow] },
    });

    console.log("✅ Written to:", result.data.updatedRange);

    return NextResponse.json({
      success: true,
      updatedRange: result.data.updatedRange,
    });
  } catch (err: any) {
    console.error("❌ POST error:", err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { orderNumber } = body;

    console.log("🗑️ DELETE request for orderNumber:", orderNumber);
    if (!orderNumber) throw new Error("orderNumber is required");

    const spreadsheetId = process.env.GOOGLE_SHEET_ID_ADC;
    if (!spreadsheetId) throw new Error("GOOGLE_SHEET_ID_ADC missing");

    const auth = await getGoogleAuth();
    const sheets = google.sheets({ version: "v4", auth });

    // Search column D (Order Number) in source sheet
    const colD = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'Completed ADC orders'!D:D",
    });

    const rows = colD.data.values ?? [];
    console.log("🔍 Searching col D for:", orderNumber, "— total rows:", rows.length);

    const rowIndex = rows.findIndex(
      (row) => String(row[0]).trim() === String(orderNumber).trim()
    );

    if (rowIndex === -1) {
      console.warn("⚠️ Order not found:", orderNumber);
      return NextResponse.json(
        { success: false, error: "Order not found in Completed ADC orders" },
        { status: 404 }
      );
    }

    const sheetRow = rowIndex + 1;

    // Clear from column A to Z (entire row)
    const clearRange = `'Completed ADC orders'!A${sheetRow}:Z${sheetRow}`;
    console.log(`🗑️ Clearing range: ${clearRange}`);

    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: clearRange,
    });

    console.log("✅ Cleared:", clearRange);
    return NextResponse.json({ success: true, clearedRange: clearRange });
  } catch (err: any) {
    console.error("❌ DELETE error:", err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}