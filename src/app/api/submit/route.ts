import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { CATEGORIES } from '@/lib/data';

export async function POST(req: NextRequest) {
  const { goals, explanation, slots, userId, userName } = await req.json();

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const categoryColumns = CATEGORIES.map(cat =>
    (slots?.[cat.id] ?? [])
      .filter(Boolean)
      .map((c: { text: string }) => c.text)
      .join(', ')
  );

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'A:G',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[new Date().toISOString(), userId ?? '', userName ?? '', goals, explanation, ...categoryColumns]],
    },
  });

  return NextResponse.json({ ok: true });
}
