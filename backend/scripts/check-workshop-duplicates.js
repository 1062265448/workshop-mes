const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDuplicates() {
  console.log('🔍 检查车间数据...\n');
  
  const workshops = await prisma.workshop.findMany({
    orderBy: { id: 'asc' },
  });
  
  console.log(`📊 总记录数：${workshops.length}`);
  console.log('\n所有车间:');
  workshops.forEach(w => {
    console.log(`  [${w.id}] ${w.workshopName} (${w.workshopCode}) - 激活：${w.isActive}`);
  });
  
  // 检查重复
  console.log('\n🔍 检查重复...');
  const nameCount = new Map();
  workshops.forEach(w => {
    const count = nameCount.get(w.workshopName) || 0;
    nameCount.set(w.workshopName, count + 1);
  });
  
  let hasDuplicates = false;
  nameCount.forEach((count, name) => {
    if (count > 1) {
      console.log(`⚠️  重复：${name} (${count}次)`);
      hasDuplicates = true;
    }
  });
  
  if (!hasDuplicates) {
    console.log('✅ 没有发现重复的车间名称');
  }
  
  await prisma.$disconnect();
}

checkDuplicates();
