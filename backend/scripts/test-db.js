const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔍 测试数据库连接...\n');
    
    // 测试连接
    await prisma.$connect();
    console.log('✅ 数据库连接成功！');
    
    // 查询各表数据量
    const batchCount = await prisma.inBatchAnalysis.count();
    const planCount = await prisma.inProductPlan.count();
    const taskCount = await prisma.inProductTask.count();
    const resultCount = await prisma.inProductTaskJg.count();
    const jzCount = await prisma.inProductTaskJz.count();
    
    console.log('\n📊 数据库表数据量:');
    console.log(`   in_batch_analys: ${batchCount} 条`);
    console.log(`   in_product_plan: ${planCount} 条`);
    console.log(`   in_product_task: ${taskCount} 条`);
    console.log(`   in_product_task_jg: ${resultCount} 条`);
    console.log(`   in_product_task_jz: ${jzCount} 条`);
    
    console.log('\n✅ 数据库正常！\n');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
