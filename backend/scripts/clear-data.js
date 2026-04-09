const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearData() {
  console.log('🗑️  开始清空生产模块数据...\n');
  
  try {
    // 按依赖顺序删除（先删除子表，再删除主表）
    
    // 1. 删除任务交账数据
    const jzCount = await prisma.inProductTaskJz.deleteMany({});
    console.log(`✅ 删除任务交账数据：${jzCount.count} 条`);
    
    // 2. 删除任务结果（产量）数据
    const jgCount = await prisma.inProductTaskJg.deleteMany({});
    console.log(`✅ 删除任务结果数据：${jgCount.count} 条`);
    
    // 3. 删除生产任务数据
    const taskCount = await prisma.inProductTask.deleteMany({});
    console.log(`✅ 删除生产任务数据：${taskCount.count} 条`);
    
    // 4. 删除生产计划数据
    const planCount = await prisma.inProductPlan.deleteMany({});
    console.log(`✅ 删除生产计划数据：${planCount.count} 条`);
    
    // 5. 删除批次分析数据
    const batchCount = await prisma.inBatchAnalysis.deleteMany({});
    console.log(`✅ 删除批次分析数据：${batchCount.count} 条`);
    
    console.log('\n🎉 所有数据已清空！\n');
    console.log('📝 现在可以：');
    console.log('   1. 在 Navicat 中重新设计表结构');
    console.log('   2. 通过前端页面录入新数据');
    console.log('   3. 或导入新的 SQL 文件\n');
    
  } catch (error) {
    console.error('❌ 删除失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearData();
