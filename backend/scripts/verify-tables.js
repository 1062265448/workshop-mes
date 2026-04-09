const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  console.log('🔍 验证数据库表结构...\n');
  
  try {
    // 验证车间表
    const workshopCount = await prisma.workshop.count();
    console.log(`✅ workshop (车间表): ${workshopCount} 条记录`);
    const workshops = await prisma.workshop.findMany({ take: 3 });
    workshops.forEach(w => console.log(`   - ${w.workshopName} (${w.workshopCode})`));
    
    // 验证产品规格表
    const productCount = await prisma.productSpec.count();
    console.log(`\n✅ product_spec (产品规格表): ${productCount} 条记录`);
    const products = await prisma.productSpec.findMany({ take: 5 });
    products.forEach(p => console.log(`   - ${p.productName} ${p.specType || ''} ${p.specDetail || ''} (${p.productCode})`));
    
    // 验证专用镍统计表
    const specialCount = await prisma.specialNickelStat.count();
    console.log(`\n✅ special_nickel_stat (专用镍统计表): ${specialCount} 条记录`);
    
    console.log('\n✅ 数据库初始化完成！\n');
    console.log('📋 核心表清单:');
    console.log('   - workshop (车间)');
    console.log('   - product_spec (产品规格)');
    console.log('   - inbound_record (入库记录)');
    console.log('   - shipping_record (发运记录)');
    console.log('   - inventory (库存)');
    console.log('   - special_nickel_stat (专用镍统计)');
    console.log('   - cutting_rate_stat (裁剪率统计)');
    console.log('   - loading_detail (装车明细)');
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
