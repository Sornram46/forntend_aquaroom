import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // ล้างข้อมูลเก่า (ถ้าต้องการ)
  await prisma.product.deleteMany({});

  // เพิ่มข้อมูลสินค้าตัวอย่าง
  const products = await prisma.product.createMany({
    data: [
      {
        name: 'เสื้อยืดคอกลม',
        description: 'เสื้อยืดคอกลมผ้าคอตตอน 100% นุ่มสบาย',
        price: 350,
        category: 'เสื้อผ้า',
        stock: 50,
        popular: true
      },
      {
        name: 'กางเกงยีนส์',
        description: 'กางเกงยีนส์ทรงสลิม สีเข้ม',
        price: 990,
        category: 'เสื้อผ้า',
        stock: 30,
        popular: true
      },
      {
        name: 'รองเท้าผ้าใบ',
        description: 'รองเท้าผ้าใบสไตล์สปอร์ต ใส่สบาย',
        price: 1590,
        category: 'รองเท้า',
        stock: 15,
        popular: true
      },
      {
        name: 'หมวกแก๊ป',
        description: 'หมวกแก๊ปสีพื้น ปรับขนาดได้',
        price: 450,
        category: 'เครื่องประดับ',
        stock: 25,
        popular: true
      },
      {
        name: 'กระเป๋าสะพาย',
        description: 'กระเป๋าสะพายข้างหนังแท้ ทนทาน',
        price: 1990,
        category: 'กระเป๋า',
        stock: 10,
        popular: false
      },
      {
        name: 'เสื้อเชิ้ต',
        description: 'เสื้อเชิ้ตแขนยาว ผ้าเนื้อดี ทรงสวย',
        price: 790,
        category: 'เสื้อผ้า',
        stock: 20,
        popular: false
      },
    ]
  });

  console.log(`เพิ่มข้อมูลสินค้าทั้งหมด ${products.count} รายการ`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });