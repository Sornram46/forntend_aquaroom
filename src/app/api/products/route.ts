import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

const BACKEND_URL = 'https://backend-aquaroom.vercel.app';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams.toString();
    const backendUrl = `${BACKEND_URL}/api/products${searchParams ? `?${searchParams}` : ''}`;
    
    const response = await fetch(backendUrl);
    const data = await response.json();
    
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy error:', error);
    return Response.json({ error: 'Failed to fetch from backend' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${BACKEND_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy error:', error);
    return Response.json({ error: 'Failed to create product' }, { status: 500 });
  }
}