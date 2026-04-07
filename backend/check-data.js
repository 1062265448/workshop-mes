const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    // 检查总数
    const count = await prisma.nickelInventory.count();
    console.log('📊 总记录数:', count);
    
    // 检查前 5 条
    const data = await prisma.nickelInventory.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('\n📋 前 5 条记录:');
    data.forEach((item, i) => {
      console.log(`\n${i + 1}. ID=${item.id}`);
      console.log(`   tankNo: ${item.tankNo}`);
      console.log(`   batchNo: ${item.batchNo}`);
      console.log(`   grade: ${item.grade}`);
      console.log(`   weight: ${item.weight}`);
      console.log(`   pieceCount: ${item.pieceCount}`);
      console.log(`   status: ${item.status}`);
    });
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
