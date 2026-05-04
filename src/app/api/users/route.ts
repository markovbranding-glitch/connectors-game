import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

export async function GET() {
  const filePath = path.join(process.cwd(), 'Tochka_rosta.xlsx');
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: [string | number, string][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const users = rows
    .slice(1)
    .filter(([id, name]) => id !== undefined && name !== undefined)
    .map(([id, name]) => ({ id: String(id), name: String(name) }));

  return NextResponse.json(users);
}
