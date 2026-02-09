import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

// Initialize Google Sheets API
function getGoogleSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rmaNumber, status } = body;

    // Validate input
    if (!rmaNumber || !status) {
      return NextResponse.json(
        { success: false, error: "Missing rmaNumber or status" },
        { status: 400 }
      );
    }

    // Check environment variables
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json(
        { success: false, error: "Google Sheet ID not configured" },
        { status: 500 }
      );
    }

    const sheets = getGoogleSheets();

    // Read the entire sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "MASTER LIST!A:M",
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Sheet is empty" },
        { status: 404 }
      );
    }

    // ✅ Column positions matching your returns-datatable:
    // A=0: Timestamp
    // B=1: FullName
    // C=2: Phone
    // D=3: RMA ID / Order Number
    // H=7: Car Park Bay
    // I=8: K1 Status
    // J=9: Agent
    // K=10: Transaction Type (ORDER PICKUP vs RETURN PRODUCT)

    const orderNumberColIndex = 3;   // Column D (RMA ID)
    const statusColIndex = 8;        // Column I (K1 Status)
    const typeColIndex = 10;         // Column K (Transaction Type)

    // Find row with matching order AND type = "return product"
    let rowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      const cellValue = rows[i][orderNumberColIndex]?.toString().trim();
      const typeValue = rows[i][typeColIndex]?.toString().trim().toLowerCase();

      // Extract just the numbers from both the cell and the search term
      const cellNumbers = cellValue?.replace(/\D/g, '') || ''; // Remove all non-digits
      const searchNumbers = rmaNumber.trim().replace(/\D/g, ''); // Remove all non-digits

      console.log(`[UPDATE-STATUS] Row ${i}: Cell="${cellValue}" (numbers: "${cellNumbers}"), Type="${typeValue}", Looking for="${rmaNumber}" (numbers: "${searchNumbers}")`);

      // Match if the numeric parts are the same
      const isMatch = cellNumbers && searchNumbers && cellNumbers === searchNumbers;
      const isReturn = typeValue === "return product";

      if (isMatch && isReturn) {
        rowIndex = i;
        console.log(`[UPDATE-STATUS] ✅ Found return order at row ${i}`);
        break;
      }
    }

    if (rowIndex === -1) {
      console.log(`[UPDATE-STATUS] ❌ No match found for "${rmaNumber}"`);
      return NextResponse.json(
        { success: false, error: `Return order "${rmaNumber}" not found in sheet. Searched for numeric match: ${rmaNumber.replace(/\D/g, '')}` },
        { status: 404 }
      );
    }

    // Update K1 Status column (Column I)
    const statusColLetter = "I";
    const updateRange = `MASTER LIST!${statusColLetter}${rowIndex + 1}`;

    // Update the status cell
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: updateRange,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[status]],
      },
    });

    console.log(`[UPDATE-STATUS] ✅ Updated status to "${status}" for RMA ${rmaNumber}`);

    return NextResponse.json({
      success: true,
      message: `K1 Status updated to "${status}" for RMA ${rmaNumber}`,
      data: {
        rmaNumber,
        status,
        rowIndex: rowIndex + 1,
        column: statusColLetter,
      },
    });
  } catch (error: any) {
    console.error("[UPDATE-STATUS] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update RMA status",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}