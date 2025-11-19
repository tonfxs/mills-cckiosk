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
// Save to Google Sheets
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

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Pickupsv1!A:I",
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: [
                [
                    timestamp,
                    orderData.fullName,
                    orderData.phone,
                    orderData.orderNumber,
                    "'" + orderData.creditCard, // <-- FIX HERE
                    orderData.validId,
                    orderData.paymentMethod,
                    orderData.carParkBay,
                    "Pending Verification",
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
            creditCard: String(form.get("creditCard") || ""),
            validId: String(form.get("validId") || ""),
            paymentMethod: String(form.get("paymentMethod") || ""),
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
            range: "Pickupsv1A:I",
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
                confirmed: match[8],
                status: match[9],
            },
        });
    } catch (err: any) {
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    }
}
