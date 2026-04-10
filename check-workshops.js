const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkWorkshops() {
  const workshops = await prisma.workshop.findMany();
  console.log('车间数量:', workshops.length);
  console.log('\n车间列表:');
  workshops.forEach(w => console.log(`  ${w.id}: ${w.workshopName} (${w.workshopCode})`));
  
  // 检查重复
  const seen = new Map();
  const duplicates = [];
  workshops.forEach(w => {
    if (seen.has(w.id)) {
      duplicates.push(w);
    }
    seen.set(w.id, w);
  });
  
  if (duplicates.length > 0) {
    console.log('\n⚠️ 发现重复车间:');
    duplicates.forEach(w => console.log(`  ${w.id}: ${w.workshopName}`));
  } else {
    console.log('\n✅ 没有重复的车间 ID');
  }
  
  await prisma.$disconnect();
}

checkWorkshops();
