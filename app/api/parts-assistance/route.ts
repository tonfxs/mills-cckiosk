import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

// ----------------------------
// Types
// ----------------------------
interface OrderData {
    fullName: string;
    phone: string;
    orderNumber: string;
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
// Save to Google Sheets (Insert at Top)
// ----------------------------
async function saveToSheet(orderData: OrderData) {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error("GOOGLE_SHEET_ID missing");

    const auth = await getGoogleAuth();
    const sheets = google.sheets({ version: "v4", auth });

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

    const timestamp = getAustraliaTimestamp();

    // Step 1: Get the sheet ID
    const sheetMetadata = await sheets.spreadsheets.get({
        spreadsheetId,
    });

    const partsOrdersSheet = sheetMetadata.data.sheets?.find(
        (sheet) => sheet.properties?.title === "PartsOrders"
    );

    if (!partsOrdersSheet || !partsOrdersSheet.properties?.sheetId) {
        throw new Error("PartsOrders sheet not found");
    }

    const sheetId = partsOrdersSheet.properties.sheetId;

    // Step 2: Insert a new row at position 1 (right after header)
    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
            requests: [
                {
                    insertDimension: {
                        range: {
                            sheetId: sheetId,
                            dimension: "ROWS",
                            startIndex: 1, // Row 2 (index 1, after header)
                            endIndex: 2,   // Insert 1 row
                        },
                        inheritFromBefore: false,
                    },
                },
            ],
        },
    });

    // Step 3: Write data to the newly inserted row
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "PartsOrders!A2:G2", // Row 2 (first data row after header)
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: [
                [
                    timestamp,
                    orderData.fullName,
                    orderData.phone,
                    orderData.orderNumber,
                    orderData.carParkBay,
                    "Pending Verification",
                    "", // Column G (Agent - empty, to be filled manually)
                ],
            ],
        },
    });
}



// ----------------------------
// POST — Save Order
// ----------------------------
export async function POST(request: NextRequest) {
    try {
        const form = await request.formData();

        const orderData: OrderData = {
            fullName: String(form.get("fullName") || ""),
            phone: String(form.get("phone") || ""),
            orderNumber: String(form.get("orderNumber") || ""),
            carParkBay: String(form.get("carParkBay") || ""),
            confirmed: form.get("confirmed") === "true",
        };

        await saveToSheet(orderData);

        return NextResponse.json({
            success: true,
            message: "Order saved",
        });
    } catch (err: any) {
        console.error("❌ ERROR:", err);
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    }
}

// ----------------------------
// GET — Fetch by Order Number
// ----------------------------
export async function GET(request: NextRequest) {
    try {
        const orderNumber = request.nextUrl.searchParams.get("orderNumber");
        if (!orderNumber) {
            return NextResponse.json(
                { success: false, error: "orderNumber required" },
                { status: 400 }
            );
        }

        const auth = await getGoogleAuth();
        const sheets = google.sheets({ version: "v4", auth });

        const spreadsheetId = process.env.GOOGLE_SHEET_ID;

        const resp = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "PartsOrders!A:G", // Extended to include Agent column
        });

        const rows = resp.data.values || [];
        const match = rows.find((row) => row[3] === orderNumber);

        if (!match) {
            return NextResponse.json(
                { success: false, error: "Order not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                timestamp: match[0],
                fullName: match[1],
                phone: match[2],
                orderNumber: match[3],
                carParkBay: match[4],
                status: match[5],
                agent: match[6] || "", // Column G - Agent
            },
        });
    } catch (err: any) {
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    }
}