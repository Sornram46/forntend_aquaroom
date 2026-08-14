import { NextRequest, NextResponse } from 'next/server';

const RATE_LIMIT_WINDOW_MS = 60_000;
const BLOCKED_IPS = new Set<string>();
const RATE_BUCKETS = new Map<string, { count: number; resetAt: number }>();

const SENSITIVE_PATHS = [
  '/api/orders',
  '/api/checkout',
  '/api/payment-settings',
  '/api/validate-slip',
  '/api/user',
  '/api/auth/refresh',
  '/api/contact',
];

const BROWSER_USER_AGENTS = /mozilla|chrome|safari|firefox|edge/i;
const SUSPICIOUS_USER_AGENTS = /curl|wget|python-requests|postman|insomnia|httpie|scrapy|go-http-client|okhttp|aiohttp|headless|puppeteer/i;

function normalizeOrigin(value: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return null;
  }
}

function getAllowedOrigins(): string[] {
  const values = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.APP_URL,
    process.env.FRONTEND_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://aquaroom-shop.com',
    'https://www.aquaroom-shop.com',
  ].filter(Boolean) as string[];

  return Array.from(new Set(values.map((value) => normalizeOrigin(value)).filter(Boolean) as string[]));
}

export function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return 'unknown';
}

function isSensitiveRoute(pathname: string) {
  return SENSITIVE_PATHS.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isAllowedOrigin(origin: string | null) {
  if (!origin) return true;

  const allowedOrigins = getAllowedOrigins();
  const normalizedOrigin = normalizeOrigin(origin);

  if (!normalizedOrigin) return false;
  return allowedOrigins.includes(normalizedOrigin);
}

function isAllowedReferer(referer: string | null) {
  if (!referer) return true;

  try {
    const url = new URL(referer);
    const allowedOrigins = getAllowedOrigins();
    return allowedOrigins.includes(url.origin);
  } catch {
    return false;
  }
}

function shouldRateLimit(pathname: string) {
  return pathname.startsWith('/api/');
}

function checkBucket(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = RATE_BUCKETS.get(key);

  if (!current || current.resetAt <= now) {
    RATE_BUCKETS.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  current.count += 1;
  return { allowed: true, remaining: limit - current.count };
}

async function compareConstantTime(a: string, b: string) {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);

  const length = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length ^ bBytes.length;

  for (let i = 0; i < length; i += 1) {
    const aChar = aBytes[i] ?? 0;
    const bChar = bBytes[i] ?? 0;
    diff |= aChar ^ bChar;
  }

  return diff === 0;
}

async function createHmacHex(value: string) {
  const secret = process.env.API_GUARD_SECRET || 'change-me-dev-secret';
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function verifySignature(request: NextRequest) {
  const ts = request.headers.get('x-request-ts');
  const signature = request.headers.get('x-request-signature');

  if (!ts || !signature) return false;

  const payload = `${request.nextUrl.pathname}|${getClientIp(request)}|${ts}`;
  const expected = await createHmacHex(payload);

  const incomingTs = Number(ts);
  const now = Date.now();
  if (!Number.isFinite(incomingTs)) return false;
  if (incomingTs < now - 60_000 || incomingTs > now + 60_000) return false;

  return compareConstantTime(signature, expected);
}

export async function apiGuard(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!pathname.startsWith('/api/')) {
    return null;
  }

  if (pathname === '/api/health') {
    return null;
  }

  const ip = getClientIp(request);
  if (BLOCKED_IPS.has(ip)) {
    return NextResponse.json({ error: 'blocked_ip' }, { status: 403 });
  }

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  if (origin && !isAllowedOrigin(origin)) {
    BLOCKED_IPS.add(ip);
    return NextResponse.json({ error: 'forbidden_origin' }, { status: 403 });
  }

  if (referer && !isAllowedReferer(referer)) {
    BLOCKED_IPS.add(ip);
    return NextResponse.json({ error: 'forbidden_referer' }, { status: 403 });
  }

  const userAgent = request.headers.get('user-agent') || '';
  const isBrowserLike = BROWSER_USER_AGENTS.test(userAgent);
  const isSuspiciousBot = SUSPICIOUS_USER_AGENTS.test(userAgent) || userAgent.trim().length === 0;

  if (isSensitiveRoute(pathname) && isSuspiciousBot && !isBrowserLike) {
    const result = checkBucket(`${ip}:${pathname}:bot`, 10, RATE_LIMIT_WINDOW_MS);
    if (!result.allowed) {
      BLOCKED_IPS.add(ip);
      return NextResponse.json({ error: 'bot_detected' }, { status: 403 });
    }
  }

  if (isSensitiveRoute(pathname) && request.headers.get('x-request-signature')) {
    if (!verifySignature(request)) {
      BLOCKED_IPS.add(ip);
      return NextResponse.json({ error: 'invalid_signature' }, { status: 403 });
    }
  }

  if (shouldRateLimit(pathname)) {
    const limit = isSensitiveRoute(pathname) ? 20 : 80;
    const result = checkBucket(`${ip}:${pathname}`, limit, RATE_LIMIT_WINDOW_MS);
    if (!result.allowed) {
      BLOCKED_IPS.add(ip);
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    }
  }

  return null;
}
