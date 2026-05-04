import { NextResponse } from 'next/server';
import users from '@/lib/users.json';

export async function GET() {
  return NextResponse.json(users);
}
