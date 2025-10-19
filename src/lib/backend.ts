export function resolveBackendBase() {
  const raw =
    process.env.API_BASE_URL ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    '';
  const base = raw.replace(/\/+$/, '');
  if (!base || /localhost/i.test(base)) {
    throw new Error('API_BASE_URL is not set for production');
  }
  return base.startsWith('http') ? base : `https://${base}`;
}