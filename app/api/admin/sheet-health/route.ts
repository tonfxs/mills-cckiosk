// /api/admin/sheet-health/route.ts

import { NextResponse } from 'next/server';
import { google } from 'googleapis';

async function getGoogleAuth() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  if (!clientEmail || !privateKey) throw new Error('Missing Google credentials');
  return new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    // ⚠️ Changed from spreadsheets.readonly to spreadsheets to allow writes
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

const TARGET_SHEETS = ['MASTER LIST', 'Copy of Pickupsv1', 'Copy of Returns'];

// ── GET: Fetch health for all target sheets ────────────────────────────────────
export async function GET() {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error('GOOGLE_SHEET_ID missing');

    const auth = await getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const meta = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets(properties(title,gridProperties))',
    });

    const sheetDataResults = await Promise.all(
      TARGET_SHEETS.map(async (sheetName) => {
        const sheetMeta = meta.data.sheets?.find(
          (s) => s.properties?.title === sheetName
        );

        if (!sheetMeta?.properties) {
          return { sheetName, error: 'Sheet not found' };
        }

        const totalRows = sheetMeta.properties.gridProperties?.rowCount ?? 0;

        const valRes = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `'${sheetName}'!A:A`,
        });

        const colA = valRes.data.values ?? [];
        let lastUsedRow = 0;

        for (let i = colA.length - 1; i >= 0; i--) {
          const cell = colA[i]?.[0];
          if (cell !== undefined && cell !== null && String(cell).trim() !== '') {
            lastUsedRow = i + 1;
            break;
          }
        }

        const usedRows = lastUsedRow;
        const availableRows = Math.max(0, totalRows - usedRows);
        const availablePct = totalRows > 0 ? (availableRows / totalRows) * 100 : 0;

        return {
          sheetName,
          usedRows,
          totalRows,
          availableRows,
          availablePct: Math.round(availablePct * 10) / 10,
        };
      })
    );

    return NextResponse.json({ success: true, data: sheetDataResults });
  } catch (err: any) {
    console.error('[sheet-health GET] error:', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ── POST: Expand row count for a given sheet ───────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sheetName, additionalRows = 1000 } = body as {
      sheetName: string;
      additionalRows?: number;
    };

    if (!sheetName) {
      return NextResponse.json({ success: false, error: 'sheetName is required' }, { status: 400 });
    }
    if (!TARGET_SHEETS.includes(sheetName)) {
      return NextResponse.json({ success: false, error: `Sheet "${sheetName}" is not a monitored sheet` }, { status: 400 });
    }
    if (typeof additionalRows !== 'number' || additionalRows < 1 || additionalRows > 100_000) {
      return NextResponse.json({ success: false, error: 'additionalRows must be between 1 and 100,000' }, { status: 400 });
    }

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error('GOOGLE_SHEET_ID missing');

    const auth = await getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // Get numeric sheetId and current row count
    const meta = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets(properties(sheetId,title,gridProperties))',
    });

    const sheetMeta = meta.data.sheets?.find(
      (s) => s.properties?.title === sheetName
    );
    if (!sheetMeta?.properties) {
      return NextResponse.json({ success: false, error: `Sheet "${sheetName}" not found` }, { status: 404 });
    }

    const sheetId = sheetMeta.properties.sheetId!;
    const previousRows = sheetMeta.properties.gridProperties?.rowCount ?? 0;
    const newRows = previousRows + additionalRows;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            updateSheetProperties: {
              properties: {
                sheetId,
                gridProperties: { rowCount: newRows },
              },
              fields: 'gridProperties.rowCount',
            },
          },
        ],
      },
    });

    console.log(`[sheet-health POST] Expanded "${sheetName}" from ${previousRows} to ${newRows} rows`);

    return NextResponse.json({
      success: true,
      sheetName,
      previousRows,
      newRows,
      addedRows: additionalRows,
    });
  } catch (err: any) {
    console.error('[sheet-health POST] error:', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}