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
      date, // existing date from the sheet row
    } = body;

    // Use the date already in the sheet row, just append the agent
    const dateWithAgent = `${String(date ?? "").trim()} - ${String(agent).trim().toUpperCase()}`;

    const completeValue = status === "Completed";
    const spreadsheetId = process.env.GOOGLE_SHEET_ID_ADC;
    if (!spreadsheetId) throw new Error("GOOGLE_SHEET_ID_ADC missing");

    const auth = await getGoogleAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const newRow = [
      dateWithAgent,  // A - Date - Agent
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

    const result = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "'Copy of Current Orders'!A1",
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [newRow] },
    });

    return NextResponse.json({
      success: true,
      updatedRange: result.data.updates?.updatedRange,
    });
  } catch (err: any) {
    console.error("❌ POST error:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { orderNumber } = body;

    if (!orderNumber) throw new Error("orderNumber is required");

    const spreadsheetId = process.env.GOOGLE_SHEET_ID_ADC;
    if (!spreadsheetId) throw new Error("GOOGLE_SHEET_ID_ADC missing");

    const auth = await getGoogleAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const colD = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'Completed ADC orders'!D:D",
    });

    const rows = colD.data.values ?? [];
    const rowIndex = rows.findIndex(
      (row) => String(row[0]).trim() === String(orderNumber).trim()
    );

    if (rowIndex === -1) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const sheetRow = rowIndex + 1;
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `'Copy of Completed ADC orders'!A${sheetRow}:Z${sheetRow}`,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}