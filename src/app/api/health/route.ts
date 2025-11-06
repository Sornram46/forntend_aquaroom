export const runtime = 'nodejs';
export async function GET() {
  return Response.json({
    ok: true,
    backend: process.env.NEXT_PUBLIC_BACKEND_URL || null,
    node: process.version,
    env: process.env.VERCEL_ENV || process.env.NODE_ENV,
  });
}