import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  // ...existing code...
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  // ...existing code...
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  // ...existing code...
}