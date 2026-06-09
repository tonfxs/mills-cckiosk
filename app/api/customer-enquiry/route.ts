import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

// ----------------------------
// Types
// ----------------------------
interface EnquiryData {
  firstName: string;
  lastName: string;
  phone: string;
  enquiryCategory: string;
  carParkBay: string;
  notes: string;
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
// Helpers
// ----------------------------
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

function buildFullName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim().replace(/\s+/g, " ");
}

function formatCategory(raw: string) {
  // e.g. "stock-check" → "Stock Check"
  return raw
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ----------------------------
// Save to Google Sheets
// ----------------------------
async function saveToSheet(data: EnquiryData) {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) throw new Error("GOOGLE_SHEET_ID missing");

  const auth = await getGoogleAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const timestamp = getAustraliaTimestamp();
  const fullName = buildFullName(data.firstName, data.lastName);
  const category = formatCategory(data.enquiryCategory);

  // ----------------------------
  // Customer Enquiry tab (A:H)
  // Columns: Timestamp | Full Name | Phone | Enquiry Category | Bay | Notes | Status | Agent
  // ----------------------------
  const enquiryResp = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Customer Enquiry!A:A",
  });

  const enquiryRows = enquiryResp.data.values || [];
  const enquiryRow = enquiryRows.length + 1;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Customer Enquiry!A${enquiryRow}:H${enquiryRow}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          timestamp,   // A - Timestamp
          fullName,    // B - Full Name
          data.phone,  // C - Phone
          category,    // D - Enquiry Category
          data.carParkBay, // E - Bay
          data.notes || "", // F - Notes
          "Pending Verification",   // G - Status
          "",          // H - Agent
        ],
      ],
    },
  });

  // ----------------------------
  // MASTER LIST (A:L)
  // Mirrors pickup-order pattern — K column = form type
  // ----------------------------
  const masterResp = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "MASTER LIST!A:A",
  });

  const masterRows = masterResp.data.values || [];
  const masterRow = masterRows.length + 1;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `MASTER LIST!A${masterRow}:M${masterRow}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          timestamp,        // A - Timestamp
          fullName,         // B - Full Name
          data.phone,       // C - Phone
          category,         // D - Enquiry Category (replaces Order Number)
          "",               // E - (N/A for enquiry)
          "",               // F - (N/A for enquiry)
          "",               // G - (N/A for enquiry)
          data.carParkBay,  // H - Bay
          "Pending Verification",        // I - Status
          "",               // J - Agent
          "Customer Enquiry",// K - Form Type
          "",               // L - (N/A for enquiry)
          data.notes || "", // M- Notes
        ],
      ],
    },
  });
}

// ----------------------------
// Send SMS via ClickSend
// ----------------------------
async function sendSms(phone: string, firstName: string) {
  const username = process.env.CLICKSEND_USERNAME;
  const apiKey = process.env.CLICKSEND_API_KEY;
  const sender = process.env.CLICKSEND_SENDER || "MillsBrands";

  if (!username || !apiKey) {
    console.warn("ClickSend credentials missing — SMS not sent");
    return;
  }

  // Normalize phone: strip spaces, convert 04XXXXXXXX → +614XXXXXXXX
  const digits = phone.replace(/\D/g, "");
  const e164 = digits.startsWith("0") ? "+61" + digits.slice(1) : "+" + digits;

  // const message =
  //   "Thank you. Our team will contact you within the next 5 minutes to assist with your enquiry using the number provided.";

  const message = `Hi ${firstName}, thank you for your enquiry. Our team has received your request and will contact you on the number provided within the next 5 minutes to assist you further. Thank you!`;





  const payload = {
    messages: [
      {
        source: "nextjs-kiosk",
        from: sender,
        body: message,
        to: e164,
      },
    ],
  };

  const credentials = Buffer.from(`${username}:${apiKey}`).toString("base64");

  const res = await fetch("https://rest.clicksend.com/v3/sms/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await res.json();

  if (!res.ok) {
    console.error("ClickSend error:", result);
  } else {
    console.log("SMS sent to", e164, "| Status:", result?.data?.messages?.[0]?.status);
  }
}

// ----------------------------
// POST — Save Enquiry
// ----------------------------
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const enquiryData: EnquiryData = {
      firstName: String(body.firstName || ""),
      lastName: String(body.lastName || ""),
      phone: String(body.phone || ""),
      enquiryCategory: String(body.enquiryCategory || ""),
      carParkBay: String(body.carParkBay || ""),
      notes: String(body.notes || ""),
    };

    // Save to Google Sheets
    await saveToSheet(enquiryData);

    // Send SMS to customer (non-blocking — won't fail the submission if SMS fails)
    sendSms(enquiryData.phone, enquiryData.firstName).catch((err) =>
      console.error("SMS send error:", err)
    );

    return NextResponse.json({
      success: true,
      message: "Customer enquiry saved successfully",
    });
  } catch (err: any) {
    console.error("Customer Enquiry ERROR:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}