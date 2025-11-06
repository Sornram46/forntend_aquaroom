export function resolveBackendBase(): string {
  const raw =
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.BACKEND_URL ||
    '';

  const base = raw.trim().replace(/\/+$/, '');

  // กันค่าผิดพลาด
  if (!base || /^postgres:/i.test(base) || /:5432(\/|$)/.test(base)) {
    if (process.env.NODE_ENV === 'production') {
      return 'https://backend-aquaroom.vercel.app';
    }
    return 'http://localhost:5000';
  }

  return base.startsWith('http') ? base : `https://${base}`;
}

export function resolveFrontendBase(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.SITE_URL) {
    return process.env.SITE_URL.replace(/\/+$/, '');
  }
  if (process.env.NODE_ENV === 'production') {
    return 'https://forntend-aquaroom.vercel.app';
  }
  return 'http://localhost:3000';
}

export function logStart(rid: string, path: string, url: string, method = 'GET') {
  console.log(`[${rid}] ${method} ${path} -> ${url}`);
}

export function logEnd(rid: string, url: string, status: number, ms: number) {
  console.log(`[${rid}] <- ${status} from ${url} in ${ms}ms`);
}

export function backendBase() {
  const env =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.BACKEND_URL ||
    'https://backend-aquaroom.vercel.app';
  return env.replace(/\/+$/, '');
}