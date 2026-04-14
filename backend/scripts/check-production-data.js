const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  console.log('📊 检查生产管理数据...\n');
  
  const inboundCount = await prisma.inboundRecord.count();
  const shippingCount = await prisma.shippingRecord.count();
  const inventoryCount = await prisma.inventory.count();
  const specialCount = await prisma.specialNickelStat.count();
  
  console.log('📥 入库记录:', inboundCount, '条');
  console.log('📤 发运记录:', shippingCount, '条');
  console.log('📦 库存记录:', inventoryCount, '条');
  console.log('📊 专用镍统计:', specialCount, '条');
  
  if (inboundCount > 0) {
    console.log('\n最近 5 条入库记录:');
    const recent = await prisma.inboundRecord.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        workshop: true,
        productSpec: true,
      },
    });
    recent.forEach(item => {
      console.log(`  - ${item.workshop.workshopName} | ${item.productSpec.productName} | ${item.totalWeight} 吨 | ${new Date(item.recordDate).toLocaleDateString()}`);
    });
  }
  
  if (inventoryCount > 0) {
    console.log('\n最近 5 条库存记录:');
    const recent = await prisma.inventory.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        workshop: true,
        productSpec: true,
      },
    });
    recent.forEach(item => {
      console.log(`  - ${item.workshop.workshopName} | ${item.productSpec.productName} | ${item.totalWeight} 吨 | ${new Date(item.inventoryDate).toLocaleDateString()}`);
    });
  }
  
  await prisma.$disconnect();
}

checkData();
