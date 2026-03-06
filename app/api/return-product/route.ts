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
// Save to Google Sheets (Append at Bottom)
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

    // Save to Returns sheet
    const respReturns = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Returns!A:A",
    });

    const rowsReturns = respReturns.data.values || [];
    const lastRowReturns = rowsReturns.length + 1;

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Returns!A${lastRowReturns}:J${lastRowReturns}`,
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
                    "",
                    "",
                    "",
                ],
            ],
        },
    });

    // Save to MASTER LIST sheet
    const respMaster = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "MASTER LIST!A:A",
    });

    const rowsMaster = respMaster.data.values || [];
    const lastRowMaster = rowsMaster.length + 1;

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `MASTER LIST!A${lastRowMaster}:K${lastRowMaster}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: [
                [
                    timestamp,
                    returnData.fullName,
                    returnData.phone,
                    returnData.rmaID,
                    "",
                    "",
                    "",
                    returnData.carParkBay,
                    "Pending Pickup",
                    "",
                    "Return Product", // Transaction Type
                ],
            ],
        },
    });
}

// ----------------------------
// POST — Handle Multiple Return Form Submit
// ----------------------------
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const firstName = (formData.get("firstName") || "").toString().trim();
        const lastName = (formData.get("lastName") || "").toString().trim();

        const returnData: ReturnData = {
            fullName: `${firstName} ${lastName}`.trim(),
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
        if (!returnData.confirmed) errors.confirmed = "You must confirm the data";

        if (Object.keys(errors).length > 0) {
            return NextResponse.json(
                { success: false, errors },
                { status: 400 }
            );
        }

        // Split RMA IDs by comma and trim whitespace
        const rmaIDs = returnData.rmaID
            .split(",")
            .map(id => id.trim())
            .filter(id => id.length > 0);

        // Save each RMA ID separately with the same customer info
        for (const rmaId of rmaIDs) {
            const singleReturnData = {
                ...returnData,
                rmaID: rmaId
            };
            await saveToSheet(singleReturnData);
        }

        return NextResponse.json({
            success: true,
            message: `${rmaIDs.length} return request${rmaIDs.length > 1 ? 's' : ''} submitted successfully`,
            rmaCount: rmaIDs.length,
            rmaIDs: rmaIDs
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
            range: "Returns!A:J",
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
                agent: match[9] || "",
            },
        });
    } catch (err: any) {
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    }
}