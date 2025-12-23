import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

// ----------------------------
// Types
// ----------------------------
interface OrderData {
    fullName: string;
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
// Save to Google Sheets (Append at Bottom)
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

    // Save to Pickupsv1 sheet
    const respPickups = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Pickupsv1!A:A",
    });

    const rowsPickups = respPickups.data.values || [];
    const lastRowPickups = rowsPickups.length + 1;

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Pickupsv1!A${lastRowPickups}:J${lastRowPickups}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: [
                [
                    timestamp,
                    orderData.fullName,
                    orderData.phone,
                    orderData.orderNumber,
                    "'" + orderData.creditCard,
                    orderData.validId,
                    orderData.paymentMethod,
                    orderData.carParkBay,
                    "Pending Verification",
                    "",
                ],
            ],
        },
    });

    // Save to MASTERLIST sheet
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
                    orderData.fullName,
                    orderData.phone,
                    orderData.orderNumber,
                    "'" + orderData.creditCard,
                    orderData.validId,
                    orderData.paymentMethod,
                    orderData.carParkBay,
                    "Pending Verification",
                    "",
                    "Order Pickup", // Transaction Type
                ],
            ],
        },
    });
}

// ----------------------------
// POST — Save Multiple Orders
// ----------------------------
export async function POST(request: NextRequest) {
    try {
        const form = await request.formData();

        const orderData: OrderData = {
            fullName: String(form.get("fullName") || ""),
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
            .map(num => num.trim())
            .filter(num => num.length > 0);

        // Save each order separately with the same customer info
        for (const orderNum of orderNumbers) {
            const singleOrderData = {
                ...orderData,
                orderNumber: orderNum
            };
            await saveToSheet(singleOrderData);
        }

        return NextResponse.json({
            success: true,
            message: `${orderNumbers.length} order${orderNumbers.length > 1 ? 's' : ''} saved successfully`,
            orderCount: orderNumbers.length,
            orders: orderNumbers
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
            range: "Pickupsv1!A:J",
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
                creditCard: match[4],
                validId: match[5],
                paymentMethod: match[6],
                carParkBay: match[7],
                status: match[8],
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