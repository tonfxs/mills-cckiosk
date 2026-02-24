import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req: Request) {
  const body = await req.json();
  const { dateFrom, dateTo } = body;
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email:
        process.env.GOOGLE_CLIENT_EMAIL,
      private_key:
        process.env.GOOGLE_PRIVATE_KEY?.replace(
          /\\n/g,
          "\n"
        ),
    },

    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
    ],

  });
  const sheets = google.sheets({
    version: "v4",
    auth,
  });


  const spreadsheetId =
    process.env.GOOGLE_SHEET_ID!;


  const activeSheet = "ActiveData";
  const archiveSheet = "ArchivedData";
  const response =
    await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: activeSheet,
    });


  const rows = response.data.values || [];
  const header = rows[0];
  const data = rows.slice(1);
  const archiveRows = data.filter(
    (row) => {
      const rowDate = new Date(row[0]);
      return (
        rowDate >= new Date(dateFrom) &&
        rowDate <= new Date(dateTo)
      );
    }
  );


  if (archiveRows.length === 0) {
    return NextResponse.json({
      archivedCount: 0,
    });

  }


  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: archiveSheet,
    valueInputOption: "RAW",
    requestBody: {
      values: archiveRows,
    },
  });


  return NextResponse.json({
    archivedCount: archiveRows.length,
  });
}