import Tesseract from 'tesseract.js';

export interface SlipValidationResult {
  isValid: boolean;
  message: string;
  confidence: number;
  detectedText?: string;
  foundKeywords?: string[];
}

export const validateSlipWithOCR = async (file: File): Promise<SlipValidationResult> => {
  try {
    console.log('🔍 Starting OCR validation for slip...');
    
    // ใช้ Tesseract.js อ่านข้อความจากรูปภาพ
    const result = await Tesseract.recognize(file, 'tha+eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`📖 OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    
    const detectedText = result.data.text.toLowerCase();
    console.log('📄 Detected text:', detectedText.substring(0, 200));
    
    // คำสำคัญที่บ่งบอกว่าเป็นสลิปโอนเงิน
    const bankKeywords = [
      // ภาษาไทย
      'โอนเงิน', 'โอน', 'transfer', 'จำนวนเงิน', 'จำนวน', 'amount',
      'ธนาคาร', 'bank', 'บัญชี', 'account', 'บัญชีปลายทาง',
      'ยอดเงิน', 'balance', 'สำเร็จ', 'successful', 'complete',
      'วันที่', 'date', 'เวลา', 'time', 'ref', 'reference',
      'atm', 'mobile banking', 'internet banking',
      'กสิกรไทย', 'kasikorn', 'กรุงเทพ', 'bangkok bank',
      'ไทยพาณิชย์', 'scb', 'กรุงไทย', 'ktb', 'tmb',
      'อาคารสงเคราะห์', 'gsb', 'ออมสิน',
      'baht', 'บาท', 'thb'
    ];
    
    // หาคำสำคัญที่พบในข้อความ
    const foundKeywords = bankKeywords.filter(keyword => {
      const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      return regex.test(detectedText);
    });
    
    console.log('🔍 Found keywords:', foundKeywords);
    
    // ตรวจสอบรูปแบบเลขบัญชี (ตัวเลข 10-12 หลัก)
    const accountNumberPattern = /\b\d{10,12}\b/g;
    const accountNumbers = detectedText.match(accountNumberPattern) || [];
    
    // ตรวจสอบรูปแบบจำนวนเงิน
    const amountPattern = /(?:\d{1,3}(?:,\d{3})*|\d+)(?:\.\d{2})?\s*(?:บาท|baht|thb)/gi;
    const amounts = detectedText.match(amountPattern) || [];
    
    // ตรวจสอบรูปแบบวันที่เวลา
    const dateTimePattern = /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}:\d{2}/g;
    const dateTime = detectedText.match(dateTimePattern) || [];
    
    // คำนวณคะแนนความน่าเชื่อถือ
    let confidence = 0;
    confidence += Math.min(foundKeywords.length * 15, 60); // สูงสุด 60 คะแนน
    confidence += Math.min(accountNumbers.length * 10, 20); // สูงสุด 20 คะแนน
    confidence += Math.min(amounts.length * 10, 10); // สูงสุด 10 คะแนน
    confidence += Math.min(dateTime.length * 5, 10); // สูงสุด 10 คะแนน
    
    const isValid = confidence >= 40; // ต้องได้คะแนนอย่างน้อย 40%
    
    console.log(`✅ Validation result: ${isValid ? 'VALID' : 'INVALID'} (${confidence}%)`);
    
    return {
      isValid,
      confidence,
      message: isValid 
        ? `ตรวจสอบแล้ว: เป็นสลิปโอนเงิน (ความมั่นใจ ${confidence}%)`
        : `อาจไม่ใช่สลิปโอนเงิน (ความมั่นใจ ${confidence}%) กรุณาตรวจสอบอีกครั้ง`,
      detectedText: detectedText.substring(0, 300),
      foundKeywords
    };
    
  } catch (error) {
    console.error('❌ Error in OCR validation:', error);
    return {
      isValid: true, // ให้ผ่านไปถ้าตรวจสอบไม่ได้
      confidence: 0,
      message: 'ไม่สามารถตรวจสอบความถูกต้องได้ จะดำเนินการต่อ',
      detectedText: ''
    };
  }
};

// ฟังก์ชันตรวจสอบแบบเร็ว (ไม่ใช้ OCR)
export const validateSlipQuick = (file: File): SlipValidationResult => {
  // ตรวจสอบเฉพาะขนาดและชื่อไฟล์
  const fileName = file.name.toLowerCase();
  const suspiciousNames = ['screenshot', 'img', 'photo', 'pic'];
  const goodNames = ['slip', 'transfer', 'payment', 'bank'];
  
  let confidence = 50; // เริ่มต้น 50%
  
  if (suspiciousNames.some(name => fileName.includes(name))) {
    confidence -= 20;
  }
  
  if (goodNames.some(name => fileName.includes(name))) {
    confidence += 30;
  }
  
  // ตรวจสอบขนาดไฟล์ (สลิปมักมีขนาดไม่ใหญ่มาก)
  if (file.size > 2 * 1024 * 1024) { // มากกว่า 2MB
    confidence -= 10;
  }
  
  const isValid = confidence >= 40;
  
  return {
    isValid,
    confidence,
    message: isValid 
      ? `การตรวจสอบเบื้องต้น: น่าจะเป็นสลิปโอนเงิน (${confidence}%)`
      : `การตรวจสอบเบื้องต้น: อาจไม่ใช่สลิปโอนเงิน (${confidence}%)`
  };
};