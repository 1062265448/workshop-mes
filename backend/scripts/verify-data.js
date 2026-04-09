const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyData() {
  console.log('🔍 验证数据库数据...\n');
  
  // 查询批次分析数据
  const batchCount = await prisma.inBatchAnalysis.count();
  console.log(`📊 批次分析表 (in_batch_analys): ${batchCount} 条记录`);
  
  // 查询前 5 条批次数据
  const batches = await prisma.inBatchAnalysis.findMany({
    take: 5,
    orderBy: { create_time: 'desc' },
    select: {
      id: true,
      batch_no: true,
      workshop: true,
      productline: true,
      level: true,
      analys_user: true,
      nico: true,
      day: true,
    }
  });
  
  console.log('\n📋 最近 5 条批次分析数据:');
  batches.forEach(b => {
    console.log(`   #${b.id} | 批号：${b.batch_no} | 车间：${b.workshop} | 产线：${b.productline} | 品级：${b.level} | Ni: ${b.nico} | 日期：${b.day}`);
  });
  
  // 查询生产计划数据
  const planCount = await prisma.inProductPlan.count();
  console.log(`\n📋 生产计划表 (in_product_plan): ${planCount} 条记录`);
  
  const plans = await prisma.inProductPlan.findMany({
    take: 5,
    select: {
      id: true,
      plan_month: true,
      workshop: true,
      productline: true,
      plan_weight: true,
    }
  });
  
  console.log('\n📋 生产计划数据:');
  plans.forEach(p => {
    console.log(`   #${p.id} | 月份：${p.plan_month} | 车间：${p.workshop} | 产线：${p.productline} | 计划重量：${p.plan_weight} kg`);
  });
  
  // 查询生产任务数据
  const taskCount = await prisma.inProductTask.count();
  console.log(`\n📝 生产任务表 (in_product_task): ${taskCount} 条记录`);
  
  const tasks = await prisma.inProductTask.findMany({
    take: 5,
    select: {
      id: true,
      day: true,
      team: true,
      distribute_user: true,
      task_user: true,
    }
  });
  
  console.log('\n📋 生产任务数据:');
  tasks.forEach(t => {
    console.log(`   #${t.id} | 日期：${t.day} | 班组：${t.team} | 签发人：${t.distribute_user} | 任务人：${t.task_user}`);
  });
  
  console.log('\n✅ 数据验证完成！\n');
}

verifyData()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
