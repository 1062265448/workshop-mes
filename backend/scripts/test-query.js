const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testQuery() {
  console.log('🔍 测试数据库查询...\n');
  
  try {
    // 测试 1: 查询入库记录
    console.log('测试 1: 查询 inbound_record 表...');
    const inbound = await prisma.inboundRecord.findMany({
      take: 5,
      include: {
        workshop: true,
        productSpec: true,
      },
      orderBy: { id: 'desc' },
    });
    console.log('✅ 成功！记录数:', inbound.length);
    if (inbound.length > 0) {
      console.log('示例数据:', JSON.stringify(inbound[0], null, 2));
    }
    
    // 测试 2: 查询发运记录
    console.log('\n测试 2: 查询 shipping_record 表...');
    const shipping = await prisma.shippingRecord.findMany({
      take: 5,
      include: {
        workshop: true,
        productSpec: true,
      },
      orderBy: { id: 'desc' },
    });
    console.log('✅ 成功！记录数:', shipping.length);
    
    // 测试 3: 查询库存
    console.log('\n测试 3: 查询 inventory 表...');
    const inventory = await prisma.inventory.findMany({
      take: 5,
      include: {
        workshop: true,
        productSpec: true,
      },
      orderBy: { id: 'desc' },
    });
    console.log('✅ 成功！记录数:', inventory.length);
    
    console.log('\n✅ 所有查询测试通过！\n');
    
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
    console.error('详细错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testQuery();
