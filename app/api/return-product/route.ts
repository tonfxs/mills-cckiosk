import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

// ----------------------------
// Types
// ----------------------------
interface ReturnData {
    fullName: string;
    phone: string;
    rmaID: string;
    carParkBay: string;
    confirmed: boolean;
}

// ----------------------------
// Google Auth Helper (Sheets only)
// ----------------------------
async function getGoogleAuth() {
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

    if (!clientEmail || !privateKey) {
        throw new Error("Missing GOOGLE credentials");
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
async function saveToSheet(returnData: ReturnData) {
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

    const returnsSheet = sheetMetadata.data.sheets?.find(
        (sheet) => sheet.properties?.title === "Returns"
    );

    if (!returnsSheet || !returnsSheet.properties?.sheetId) {
        throw new Error("Returns sheet not found");
    }

    const sheetId = returnsSheet.properties.sheetId;

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
        range: "Returns!A2:J2", // Row 2 (first data row after header)
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: [
                [
                    timestamp,
                    returnData.fullName,
                    returnData.phone,
                    returnData.rmaID,
                    returnData.carParkBay,
                    returnData.confirmed ? "Yes" : "No",
                    "Pending Pickup",
                    "", // Column H (empty)
                    "", // Column I (empty)
                    "", // Column J (Agent - empty, to be filled manually)
                ],
            ],
        },
    });
}


// ----------------------------
// POST — Handle Return Form Submit
// ----------------------------
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        const returnData: ReturnData = {
            fullName: (formData.get("fullName") || "").toString().trim(),
            phone: (formData.get("phone") || "").toString().trim(),
            rmaID: (formData.get("rmaID") || "").toString().trim(),
            carParkBay: (formData.get("carParkBay") || "").toString().trim(),
            confirmed: formData.get("confirmed") === "true",
        };

        // Validation
        const errors: { [key: string]: string } = {};
        if (!returnData.fullName) errors.fullName = "Full name is required";
        if (!returnData.phone) errors.phone = "Phone number is required";
        if (!returnData.rmaID) errors.rmaID = "RMA ID is required";
        // if (!returnData.carParkBay) errors.carParkBay = "Car park bay is required";
        if (!returnData.confirmed) errors.confirmed = "You must confirm the data";

        if (Object.keys(errors).length > 0) {
            return NextResponse.json(
                { success: false, errors },
                { status: 400 }
            );
        }

        // Save to Google Sheets
        await saveToSheet(returnData);

        return NextResponse.json({
            success: true,
            message: "Return request submitted successfully",
            rmaID: returnData.rmaID,
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
// GET — Fetch Return Order by RMA ID
// ----------------------------
export async function GET(request: NextRequest) {
    try {
        const rmaID = request.nextUrl.searchParams.get("rmaID");
        if (!rmaID) {
            return NextResponse.json(
                { success: false, error: "rmaID required" },
                { status: 400 }
            );
        }

        const auth = await getGoogleAuth();
        const sheets = google.sheets({ version: "v4", auth });

        const spreadsheetId = process.env.GOOGLE_SHEET_ID;

        const resp = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "Returns!A:J", // Extended to include Agent column
        });

        const rows = resp.data.values || [];
        const match = rows.find((row) => row[3] === rmaID);

        if (!match) {
            return NextResponse.json(
                { success: false, error: "Return order not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                timestamp: match[0],
                fullName: match[1],
                phone: match[2],
                rmaID: match[3],
                carParkBay: match[4],
                confirmed: match[5] === "Yes",
                status: match[6],
                agent: match[9] || "", // Column J - Agent
            },
        });
    } catch (err: any) {
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    }
}