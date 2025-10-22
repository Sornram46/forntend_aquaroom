export function resolveBackendBase() {
  const raw =
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.BACKEND_URL ||
    '';

  const base = (raw || '').trim().replace(/\/+$/, '');

  // กันความผิดพลาด เช่น ใส่ postgres:// หรือ localhost:5432
  if (!base || /^postgres:/i.test(base) || /:5432(\/|$)/.test(base) || /localhost/i.test(base)) {
    throw new Error('API_BASE_URL is invalid or points to localhost. Set a https:// backend URL in Vercel ENV.');
  }

  return base.startsWith('http') ? base : `https://${base}`;
}

export function logStart(rid: string, path: string, url: string, method = 'GET') {
  console.log(`[${rid}] ${method} ${path} -> ${url}`);
}
export function logEnd(rid: string, url: string, status: number, ms: number) {
  console.log(`[${rid}] <- ${status} from ${url} in ${ms}ms`);
}