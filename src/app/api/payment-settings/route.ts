import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('💳 Frontend: Loading payment settings (with failover)...');

    const baseCandidates = [
      process.env.API_BASE_URL,
      process.env.NEXT_PUBLIC_BACKEND_URL,
      process.env.ADMIN_API_URL,
      process.env.BACKEND_URL,
      'http://localhost:5000',
      'https://backend-aquaroom.vercel.app',
    ].filter(Boolean) as string[];

    const bases = baseCandidates.map((b) => (b.startsWith('http') ? b : `https://${b}`));
    const endpoints: string[] = [];
    for (const b of bases) {
      // public endpoint มาก่อน
      endpoints.push(`${b}/api/payment-settings`);
      // admin endpoint เผื่อสำรอง
      endpoints.push(`${b}/api/admin/payment-settings`);
    }

    const headers = {
      'Content-Type': 'application/json',
      Authorization: request.headers.get('authorization') ?? '',
      Cookie: request.headers.get('cookie') ?? '',
    } as Record<string, string>;

    const controller = new AbortController();
    const TIMEOUT_MS = 6000;
    let lastErr: any = null;

    for (const url of endpoints) {
      try {
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
        const response = await fetch(url, { method: 'GET', headers, cache: 'no-store', signal: controller.signal });
        clearTimeout(timeout);
        if (!response.ok) {
          console.error('❌ Payment settings upstream not ok:', response.status, response.statusText, 'url:', url);
          if (response.status === 404) continue;
          // ลองตัวถัดไป
          continue;
        }
        const data = await response.json();
        if (!data?.success) {
          console.warn('⚠️ Payment settings success=false, trying next endpoint. url:', url);
          continue;
        }

        // รวมรูปแบบข้อมูลให้เป็น publicSettings เดียวกัน
        const src = data.data ?? data;
        let bankAccounts: any[] = [];
        if (src?.bank_accounts) {
          if (typeof src.bank_accounts === 'string') {
            try { bankAccounts = JSON.parse(src.bank_accounts); } catch { bankAccounts = []; }
          } else if (Array.isArray(src.bank_accounts)) {
            bankAccounts = src.bank_accounts;
          }
        }

        const publicSettings = {
          bank_transfer_enabled: !!src?.bank_transfer_enabled,
          credit_card_enabled: !!src?.credit_card_enabled,
          cod_enabled: !!src?.cod_enabled,
          cod_fee: Number(src?.cod_fee ?? 0),
          cod_maximum: Number(src?.cod_maximum ?? src?.cod_max_amount ?? 0),
          payment_timeout_hours: src?.payment_timeout_hours ?? 24,
          require_payment_proof: src?.require_payment_proof ?? true,
          currency: src?.currency ?? 'THB',
          payment_instructions: src?.payment_instructions,
          bank_accounts: bankAccounts.map((account: any) => ({
            bank_name: account.bank_name,
            account_name: account.account_name,
            account_number: account.account_number,
            bank_icon: account.bank_icon,
            branch: account.branch ?? null,
          })),
        };

        return NextResponse.json({ success: true, data: publicSettings });
      } catch (err) {
        lastErr = err;
        continue;
      }
    }

    console.error('❌ Error loading payment settings fallbacks exhausted:', lastErr?.message || lastErr);

    // ส่งค่าเริ่มต้นกรณี error
    return NextResponse.json({
      success: true,
      data: {
        bank_transfer_enabled: true,
        credit_card_enabled: false,
        cod_enabled: true,
        cod_fee: 30,
        cod_maximum: 0,
        payment_timeout_hours: 24,
        require_payment_proof: true,
        currency: 'THB',
        bank_accounts: []
      }
    });

  } catch (error) {
  console.error('❌ Error loading payment settings:', error);
    
    // ส่งค่าเริ่มต้นกรณี error
    return NextResponse.json({
      success: true,
      data: {
        bank_transfer_enabled: true,
        credit_card_enabled: false,
        cod_enabled: true,
        cod_fee: 30,
        cod_maximum: 0,
        payment_timeout_hours: 24,
        require_payment_proof: true,
        currency: 'THB',
        bank_accounts: []
      }
    });
  }
}