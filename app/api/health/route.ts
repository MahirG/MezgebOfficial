import { NextResponse } from 'next/server';
export function GET(){ return NextResponse.json({ status: 'ok', service: 'mezgeb-official', time: new Date().toISOString() }); }
