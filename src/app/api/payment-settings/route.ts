import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('💳 Frontend: Loading public payment settings...');
    
    // เรียก API จาก admin backend
    const adminApiUrl = process.env.ADMIN_API_URL || 'http://localhost:3001';
    const apiUrl = `${adminApiUrl}/api/admin/payment-settings`;
    
    console.log('📡 Calling admin API:', apiUrl);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      console.error('❌ Admin API response not ok:', response.status, response.statusText);
      throw new Error(`Failed to fetch payment settings: ${response.status}`);
    }
    
    const adminData = await response.json();
    console.log('📄 Admin API response:', adminData);
    
    if (!adminData.success) {
      throw new Error(adminData.message || 'Failed to load payment settings');
    }
    
    console.log('📋 Bank accounts from admin:', adminData.data?.bank_accounts);
    
    let bankAccounts = [];
    if (adminData.data?.bank_accounts) {
      if (typeof adminData.data.bank_accounts === 'string') {
        try {
          bankAccounts = JSON.parse(adminData.data.bank_accounts);
        } catch (error) {
          console.error('❌ Error parsing bank_accounts in frontend:', error);
          bankAccounts = [];
        }
      } else if (Array.isArray(adminData.data.bank_accounts)) {
        bankAccounts = adminData.data.bank_accounts;
      }
    }
    
    console.log('🏦 Processed bank accounts:', bankAccounts);
    
    // ส่งเฉพาะข้อมูลที่จำเป็นสำหรับหน้าบ้าน (ไม่รวมข้อมูลลับ)
    const publicSettings = {
      bank_transfer_enabled: adminData.data?.bank_transfer_enabled || false,
      credit_card_enabled: adminData.data?.credit_card_enabled || false,
      cod_enabled: adminData.data?.cod_enabled || false,
      cod_fee: Number(adminData.data?.cod_fee || 0),
      cod_maximum: Number(adminData.data?.cod_maximum || 0),
      payment_timeout_hours: adminData.data?.payment_timeout_hours || 24,
      require_payment_proof: adminData.data?.require_payment_proof ?? true,
      currency: adminData.data?.currency || 'THB',
      payment_instructions: adminData.data?.payment_instructions,
      bank_accounts: bankAccounts.map((account: any) => ({
        bank_name: account.bank_name,
        account_name: account.account_name,
        account_number: account.account_number,
        bank_icon: account.bank_icon,      // ✅ เพิ่มบรรทัดนี้
        branch: account.branch ?? null     // (optional) เพิ่ม branch ด้วยถ้าต้องการ
      }))
    };

    console.log('📤 Final public settings:', publicSettings);

    return NextResponse.json({
      success: true,
      data: publicSettings
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