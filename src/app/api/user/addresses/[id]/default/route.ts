import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(req: Request, context: { params: Record<string, string | string[]> }) {
  const p = context.params?.id;
  const id = Array.isArray(p) ? p[0] : p;
  // ...existing code...
}

export async function PUT(req: Request, context: { params: Record<string, string | string[]> }) {
  const p = context.params?.id;
  const id = Array.isArray(p) ? p[0] : p;
  // ...existing code...
}

export async function DELETE(req: Request, context: { params: Record<string, string | string[]> }) {
  const p = context.params?.id;
  const id = Array.isArray(p) ? p[0] : p;
  // ...existing code...
}