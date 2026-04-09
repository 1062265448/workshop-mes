const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedSampleData() {
  console.log('🌱 开始生成测试数据...\n');
  
  try {
    // 1. 获取车间和产品列表
    console.log('📦 获取基础数据...');
    const workshops = await prisma.workshop.findMany();
    const products = await prisma.productSpec.findMany();
    
    console.log(`✅ 车间数量：${workshops.length}`);
    console.log(`✅ 产品数量：${products.length}\n`);
    
    // 2. 生成入库记录
    console.log('📥 生成入库记录...');
    const inboundData = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const workshop = workshops[Math.floor(Math.random() * workshops.length)];
      const product = products[Math.floor(Math.random() * products.length)];
      
      const totalWeight = (Math.random() * 100 + 10).toFixed(3);
      const exportWeight = (Math.random() * Number(totalWeight)).toFixed(3);
      const domesticWeight = (Number(totalWeight) - Number(exportWeight)).toFixed(3);
      
      inboundData.push({
        recordDate: date,
        workshopId: workshop.id,
        productSpecId: product.id,
        totalPackageCount: Math.floor(Math.random() * 50 + 10),
        totalWeight: Number(totalWeight),
        exportPackageCount: Math.floor(Math.random() * 30),
        exportWeight: Number(exportWeight),
        domesticPackageCount: Math.floor(Math.random() * 30),
        domesticWeight: Number(domesticWeight),
        remark: `测试数据 ${i + 1}`,
      });
    }
    
    const inboundResult = await prisma.inboundRecord.createMany({
      data: inboundData,
    });
    console.log(`✅ 入库记录：${inboundResult.count} 条\n`);
    
    // 3. 生成发运记录
    console.log('📤 生成发运记录...');
    const shippingData = [];
    
    for (let i = 0; i < 20; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const workshop = workshops[Math.floor(Math.random() * workshops.length)];
      const product = products[Math.floor(Math.random() * products.length)];
      
      const totalWeight = (Math.random() * 80 + 5).toFixed(3);
      const exportWeight = (Math.random() * Number(totalWeight)).toFixed(3);
      const domesticWeight = (Number(totalWeight) - Number(exportWeight)).toFixed(3);
      
      shippingData.push({
        shipDate: date,
        workshopId: workshop.id,
        productSpecId: product.id,
        totalPackageCount: Math.floor(Math.random() * 40 + 5),
        totalWeight: Number(totalWeight),
        exportPackageCount: Math.floor(Math.random() * 20),
        exportWeight: Number(exportWeight),
        domesticPackageCount: Math.floor(Math.random() * 20),
        domesticWeight: Number(domesticWeight),
        trainSectionCount: Math.floor(Math.random() * 5),
        containerCount: Math.floor(Math.random() * 10),
        truckCount: Math.floor(Math.random() * 8),
        remark: `测试发运 ${i + 1}`,
      });
    }
    
    const shippingResult = await prisma.shippingRecord.createMany({
      data: shippingData,
    });
    console.log(`✅ 发运记录：${shippingResult.count} 条\n`);
    
    // 4. 生成库存记录
    console.log('📦 生成库存记录...');
    const inventoryData = [];
    
    // 为每个车间和产品组合生成库存
    for (const workshop of workshops) {
      for (const product of products.slice(0, 10)) { // 只生成前 10 个产品
        const totalWeight = (Math.random() * 200 + 50).toFixed(3);
        const exportWeight = (Math.random() * Number(totalWeight)).toFixed(3);
        const domesticWeight = (Number(totalWeight) - Number(exportWeight)).toFixed(3);
        
        inventoryData.push({
          inventoryDate: today,
          workshopId: workshop.id,
          productSpecId: product.id,
          totalPackageCount: Math.floor(Math.random() * 100 + 20),
          totalWeight: Number(totalWeight),
          exportPackageCount: Math.floor(Math.random() * 50),
          exportWeight: Number(exportWeight),
          domesticPackageCount: Math.floor(Math.random() * 50),
          domesticWeight: Number(domesticWeight),
        });
      }
    }
    
    const inventoryResult = await prisma.inventory.createMany({
      data: inventoryData,
    });
    console.log(`✅ 库存记录：${inventoryResult.count} 条\n`);
    
    // 5. 生成专用镍统计
    console.log('📊 生成专用镍统计...');
    const specialTypes = ['加压电镀专用镍 (大板)', '9996 小块镍 100*100', '高温合金镍', '含硫镍块'];
    const specialData = [];
    
    for (let i = 0; i < 15; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const productType = specialTypes[Math.floor(Math.random() * specialTypes.length)];
      const inboundWeight = (Math.random() * 50 + 10).toFixed(3);
      const shippingWeight = (Math.random() * 30 + 5).toFixed(3);
      const inventoryWeight = (Math.random() * 100 + 50).toFixed(3);
      
      specialData.push({
        statDate: date,
        productType: productType,
        inboundWeight: Number(inboundWeight),
        shippingWeight: Number(shippingWeight),
        inventoryWeight: Number(inventoryWeight),
        remark: `测试统计 ${i + 1}`,
      });
    }
    
    const specialResult = await prisma.specialNickelStat.createMany({
      data: specialData,
    });
    console.log(`✅ 专用镍统计：${specialResult.count} 条\n`);
    
    console.log('🎉 测试数据生成完成！\n');
    console.log('📊 数据汇总:');
    console.log(`   - 入库记录：${inboundResult.count} 条`);
    console.log(`   - 发运记录：${shippingResult.count} 条`);
    console.log(`   - 库存记录：${inventoryResult.count} 条`);
    console.log(`   - 专用镍统计：${specialResult.count} 条`);
    console.log('\n✅ 现在可以刷新页面查看数据了！\n');
    
  } catch (error) {
    console.error('❌ 生成数据失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedSampleData();
