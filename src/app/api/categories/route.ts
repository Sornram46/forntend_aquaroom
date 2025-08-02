import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // ดึงข้อมูลจาก Admin API
    const adminApiUrl = process.env.ADMIN_API_URL || 'http://localhost:5000';
    
    console.log(`Fetching categories from: ${adminApiUrl}/api/categories`);
    
    const response = await fetch(`${adminApiUrl}/api/categories`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.error(`Admin API responded with status: ${response.status}`);
      return NextResponse.json(null);
    }
    
    const categories = await response.json();
    console.log(`Fetched ${categories.length} categories from admin API:`, categories);
    
    // ถ้าไม่มีข้อมูล ส่ง mock data
    if (!categories || categories.length === 0) {
      return NextResponse.json(null);
    }
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(null);
  }
}
