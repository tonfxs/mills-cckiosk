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

// ── Audit log ──────────────────────────────────────────────────────────────────
// Appends one row to the "Edit History" sheet tab (best-effort, never throws).
// Columns: Timestamp | Action | Order # | Agent | Bay # | Customer | Item | SKU | Channel | Location | Notes
async function appendAuditLog(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  action: "MOVED_TO_CURRENT" | "DELETED",
  fields: {
    orderNumber: string;
    agent?: string;
    bayNumber?: string;
    name?: string;
    itemName?: string;
    externalSku?: string;
    salesChannel?: string;
    location?: string;
    notes?: string;
  }
) {
  const timestamp = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(new Date());

  const auditRow = [
    timestamp,                  // A - When
    action,                     // B - What happened
    fields.orderNumber ?? "",   // C - Order #
    fields.agent ?? "",         // D - Agent who acted
    fields.bayNumber ?? "",     // E - Bay #
    fields.name ?? "",          // F - Customer name
    fields.itemName ?? "",      // G - Item
    fields.externalSku ?? "",   // H - SKU
    fields.salesChannel ?? "",  // I - Channel
    fields.location ?? "",      // J - Location
    fields.notes ?? "",         // K - Notes
  ];

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "'Edit History'!A1",
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [auditRow] },
    });
    console.log(`✅ Audit log written: ${action} — ${fields.orderNumber}`);
  } catch (auditErr: any) {
    // Non-fatal — log the warning but never let this break the main operation
    console.warn("⚠️ Audit log write failed (non-fatal):", auditErr.message);
  }
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

    console.log(`📥 POST /adc-current-orders — Order: ${orderNumber} | Agent: ${agent} | Bay: ${bayNumber}`);

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

    console.log(`✅ Order ${orderNumber} appended to 'Copy of Current Orders' — Range: ${result.data.updates?.updatedRange}`);

    await appendAuditLog(sheets, spreadsheetId, "MOVED_TO_CURRENT", {
      orderNumber,
      agent,
      bayNumber,
      name,
      itemName,
      externalSku,
      salesChannel,
      location,
      notes,
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

    console.log(`🗑️ DELETE /adc-current-orders — Order: ${orderNumber}`);

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
      console.warn(`⚠️ DELETE — Order ${orderNumber} not found in 'Completed ADC orders'`);
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const sheetRow = rowIndex + 1;
    console.log(`🔍 Order ${orderNumber} found at row ${sheetRow} — clearing...`);

    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `'Copy of Completed ADC orders'!A${sheetRow}:Z${sheetRow}`,
    });

    console.log(`✅ Order ${orderNumber} cleared from row ${sheetRow}`);

    await appendAuditLog(sheets, spreadsheetId, "DELETED", { orderNumber });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ DELETE error:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}