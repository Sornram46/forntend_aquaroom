import { NextRequest } from 'next/server';

const BACKEND_URL = 'https://backend-aquaroom.vercel.app';

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/categories`);
    const data = await response.json();
    
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy error:', error);
    return Response.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
