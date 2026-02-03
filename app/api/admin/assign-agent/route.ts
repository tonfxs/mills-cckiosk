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
        const { orderNumber, agent } = body;

        // Validate input
        if (!orderNumber || !agent) {
            return NextResponse.json(
                { success: false, error: "Missing orderNumber or agent" },
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

        // Read the entire sheet to find the order
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

        // Column positions (0-indexed):
        // A=0: Timestamp
        // B=1: Full Name
        // C=2: Phone
        // D=3: Order Number
        // E=4: Credit Card
        // F=5: Valid ID
        // G=6: Payment Method
        // H=7: Car Park Bay
        // I=8: Status
        // J=9: Agent
        // K=10: Type
        // L=11: Notes
        const orderNumberColIndex = 3; // Column D
        const agentColIndex = 9;       // Column J

        // Find the row with matching order number (start from row 0)
        let rowIndex = -1;
        for (let i = 0; i < rows.length; i++) {
            const cellValue = rows[i][orderNumberColIndex]?.toString().trim();
            if (cellValue === orderNumber.trim()) {
                rowIndex = i;
                break;
            }
        }

        if (rowIndex === -1) {
            return NextResponse.json(
                { success: false, error: `Order ${orderNumber} not found in sheet` },
                { status: 404 }
            );
        }

        // Column J = 9, so J in A1 notation
        const agentColLetter = "J";
        const updateRange = `MASTER LIST!${agentColLetter}${rowIndex + 1}`;

        // Update the agent cell
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: updateRange,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [[agent]],
            },
        });

        return NextResponse.json({
            success: true,
            message: `Agent assigned to "${agent}" for order ${orderNumber}`,
            data: {
                orderNumber,
                agent,
                rowIndex: rowIndex + 1,
                column: agentColLetter,
            },
        });
    } catch (error: any) {
        console.error("Error assigning agent:", error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || "Failed to assign agent",
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}