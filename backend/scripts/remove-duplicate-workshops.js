const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removeDuplicates() {
  console.log('🗑️  删除重复的车间数据...\n');
  
  // 删除 ID 8-14 的重复记录
  const duplicateIds = [8, 9, 10, 11, 12, 13, 14];
  
  console.log('准备停用以下重复记录:');
  const toDelete = await prisma.workshop.findMany({
    where: { id: { in: duplicateIds } },
  });
  toDelete.forEach(w => {
    console.log(`  ❌ [${w.id}] ${w.workshopName} (${w.workshopCode})`);
  });
  
  // 改为标记为不激活，而不是删除（避免外键约束）
  const result = await prisma.workshop.updateMany({
    where: { id: { in: duplicateIds } },
    data: { isActive: 0 },
  });
  
  console.log(`\n✅ 已停用 ${result.count} 条重复记录\n`);
  
  // 验证结果
  const remaining = await prisma.workshop.findMany({
    orderBy: { id: 'asc' },
  });
  
  console.log('📊 剩余车间:');
  remaining.forEach(w => {
    console.log(`  ✅ [${w.id}] ${w.workshopName} (${w.workshopCode})`);
  });
  
  console.log(`\n✅ 清理完成！共 ${remaining.length} 个车间\n`);
  
  await prisma.$disconnect();
}

removeDuplicates().catch(console.error);
