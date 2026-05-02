/**
 * PromptPay QR Code Generator
 * ใช้มาตรฐาน EMVCo สำหรับ Thai PromptPay
 */

/**
 * แปลงเบอร์โทรศัพท์เป็นรูปแบบที่ใช้ใน PromptPay
 * @param phoneNumber - เบอร์โทรศัพท์ (เช่น "0812345678")
 * @returns เบอร์โทรที่แปลงแล้ว (เช่น "0066812345678")
 */
function formatPhoneNumber(phoneNumber: string): string {
  // ลบอักขระพิเศษทั้งหมด
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // ถ้าขึ้นต้นด้วย 0 ให้เปลี่ยนเป็น 66
  if (cleaned.startsWith('0')) {
    cleaned = '66' + cleaned.substring(1);
  }
  
  // เพิ่ม 00 ข้างหน้า
  if (!cleaned.startsWith('00')) {
    cleaned = '00' + cleaned;
  }
  
  return cleaned;
}

/**
 * แปลงหมายเลขประจำตัวผู้เสียภาษีเป็นรูปแบบที่ใช้ใน PromptPay
 * @param taxId - หมายเลขประจำตัวผู้เสียภาษี (13 หลัก)
 * @returns Tax ID ที่แปลงแล้ว
 */
function formatTaxId(taxId: string): string {
  // ลบอักขระพิเศษทั้งหมด
  const cleaned = taxId.replace(/\D/g, '');
  
  if (cleaned.length !== 13) {
    throw new Error('Tax ID must be 13 digits');
  }
  
  return cleaned;
}

/**
 * สร้าง CRC16-CCITT Checksum
 * @param data - ข้อมูลที่จะคำนวณ CRC
 * @returns CRC checksum (4 หลัก hex)
 */
function crc16(data: string): string {
  let crc = 0xFFFF;
  
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  
  crc = crc & 0xFFFF;
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * สร้าง TLV (Tag-Length-Value) format
 * @param tag - Tag ID (2 หลัก)
 * @param value - ค่าข้อมูล
 * @returns TLV string
 */
function createTLV(tag: string, value: string): string {
  const length = value.length.toString().padStart(2, '0');
  return tag + length + value;
}

export interface PromptPayConfig {
  /** เบอร์โทรศัพท์หรือหมายเลขประจำตัวผู้เสียภาษี */
  id: string;
  /** ประเภทของ ID: 'phone' หรือ 'tax_id' */
  type: 'phone' | 'tax_id';
  /** จำนวนเงิน (ถ้าไม่ระบุจะเป็น QR แบบ open amount) */
  amount?: number;
}

/**
 * สร้าง PromptPay QR Code payload ตามมาตรฐาน EMVCo
 * @param config - การตั้งค่า PromptPay
 * @returns Payload string สำหรับ QR code
 */
export function generatePromptPayPayload(config: PromptPayConfig): string {
  const { id, type, amount } = config;
  
  // แปลง ID ตามประเภท
  let formattedId: string;
  let aidTag: string;
  
  if (type === 'phone') {
    formattedId = formatPhoneNumber(id);
    aidTag = '01'; // Mobile number
  } else if (type === 'tax_id') {
    formattedId = formatTaxId(id);
    aidTag = '02'; // Tax ID
  } else {
    throw new Error('Invalid type. Must be "phone" or "tax_id"');
  }
  
  // สร้าง payload ตามมาตรฐาน EMVCo
  let payload = '';
  
  // 00: Payload Format Indicator
  payload += createTLV('00', '01');
  
  // 01: Point of Initiation Method (11 = Static QR, 12 = Dynamic QR)
  payload += createTLV('01', amount ? '12' : '11');
  
  // 29: Merchant Account Information - PromptPay
  const applicationId = 'A000000677010111'; // PromptPay AID
  const merchantInfo = 
    createTLV('00', applicationId) + 
    createTLV(aidTag, formattedId);
  payload += createTLV('29', merchantInfo);
  
  // 52: Merchant Category Code
  payload += createTLV('52', '0000');
  
  // 53: Transaction Currency (764 = THB)
  payload += createTLV('53', '764');
  
  // 54: Transaction Amount (ถ้ามี)
  if (amount && amount > 0) {
    payload += createTLV('54', amount.toFixed(2));
  }
  
  // 58: Country Code
  payload += createTLV('58', 'TH');
  
  // 63: CRC (จะคำนวณทีหลัง)
  payload += '6304';
  
  // คำนวณ CRC และแทนที่
  const crcValue = crc16(payload);
  payload += crcValue;
  
  return payload;
}

/**
 * สร้าง Data URL ของ QR code สำหรับ PromptPay
 * @param config - การตั้งค่า PromptPay
 * @returns Promise ที่ resolve เป็น Data URL ของ QR code
 */
export async function generatePromptPayQR(config: PromptPayConfig): Promise<string> {
  // ใช้ dynamic import เพื่อหลีกเลี่ยง SSR issues
  const QRCode = (await import('qrcode')).default;
  
  const payload = generatePromptPayPayload(config);
  
  // สร้าง QR code เป็น Data URL
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    width: 300,
    margin: 1,
  });
}
