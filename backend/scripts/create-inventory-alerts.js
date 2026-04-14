const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createInventoryAlerts() {
  console.log('📦 开始创建库存预警模拟数据...\n');
  
  try {
    // 获取车间和产品列表
    const workshops = await prisma.workshop.findMany({
      where: { isActive: 1 },
    });
    
    const products = await prisma.productSpec.findMany({
      where: { isActive: 1 },
      take: 10,
    });
    
    console.log(`✅ 获取到 ${workshops.length} 个车间，${products.length} 个产品\n`);
    
    // 创建正常库存数据（用于计算平均值）- 确保车间 + 产品组合不重复
    const used = new Set();
    const normalInventory = [];
    
    for (let i = 0; i < Math.min(20, workshops.length * products.length); i++) {
      let workshop, product, key;
      do {
        workshop = workshops[Math.floor(Math.random() * workshops.length)];
        product = products[Math.floor(Math.random() * products.length)];
        key = `${workshop.id}-${product.id}`;
      } while (used.has(key));
      
      used.add(key);
      
      normalInventory.push({
        inventoryDate: new Date(),
        workshopId: workshop.id,
        productSpecId: product.id,
        totalPackageCount: Math.floor(Math.random() * 50 + 20),
        totalWeight: (Math.random() * 100 + 50).toFixed(3),
        exportPackageCount: Math.floor(Math.random() * 30),
        exportWeight: (Math.random() * 50).toFixed(3),
        domesticPackageCount: Math.floor(Math.random() * 30),
        domesticWeight: (Math.random() * 50).toFixed(3),
      });
    }
    
    // 创建高库存预警数据（> 平均重量 * 2）- 使用不同的车间 + 产品组合
    const highInventory = [];
    for (let i = 0; i < 3; i++) {
      let workshop, product, key;
      do {
        workshop = workshops[Math.floor(Math.random() * workshops.length)];
        product = products[Math.floor(Math.random() * products.length)];
        key = `${workshop.id}-${product.id}`;
      } while (used.has(key));
      
      used.add(key);
      
      highInventory.push({
        inventoryDate: new Date(),
        workshopId: workshop.id,
        productSpecId: product.id,
        totalPackageCount: Math.floor(Math.random() * 100 + 80),
        totalWeight: (Math.random() * 200 + 250).toFixed(3), // 250-450 吨（远高于平均）
        exportPackageCount: Math.floor(Math.random() * 50),
        exportWeight: (Math.random() * 100).toFixed(3),
        domesticPackageCount: Math.floor(Math.random() * 50),
        domesticWeight: (Math.random() * 100).toFixed(3),
      });
    }
    
    // 创建低库存预警数据（< 平均重量 * 0.3）- 使用不同的车间 + 产品组合
    const lowInventory = [];
    for (let i = 0; i < 3; i++) {
      let workshop, product, key;
      do {
        workshop = workshops[Math.floor(Math.random() * workshops.length)];
        product = products[Math.floor(Math.random() * products.length)];
        key = `${workshop.id}-${product.id}`;
      } while (used.has(key));
      
      used.add(key);
      
      lowInventory.push({
        inventoryDate: new Date(),
        workshopId: workshop.id,
        productSpecId: product.id,
        totalPackageCount: Math.floor(Math.random() * 5 + 1),
        totalWeight: (Math.random() * 10 + 1).toFixed(3), // 1-11 吨（远低于平均）
        exportPackageCount: Math.floor(Math.random() * 3),
        exportWeight: (Math.random() * 5).toFixed(3),
        domesticPackageCount: Math.floor(Math.random() * 3),
        domesticWeight: (Math.random() * 5).toFixed(3),
      });
    }
    
    // 先清理今天的库存数据（避免唯一约束冲突）
    console.log('🗑️  清理今天的库存数据...');
    await prisma.inventory.deleteMany({
      where: {
        inventoryDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });
    console.log('✅ 清理完成\n');
    
    // 批量插入数据
    console.log('📥 插入正常库存数据...');
    const normalResult = await prisma.inventory.createMany({
      data: normalInventory,
    });
    console.log(`✅ 插入 ${normalResult.count} 条正常库存记录\n`);
    
    console.log('🔴 插入高库存预警数据...');
    const highResult = await prisma.inventory.createMany({
      data: highInventory,
    });
    console.log(`✅ 插入 ${highResult.count} 条高库存记录\n`);
    
    console.log('🟡 插入低库存预警数据...');
    const lowResult = await prisma.inventory.createMany({
      data: lowInventory,
    });
    console.log(`✅ 插入 ${lowResult.count} 条低库存记录\n`);
    
    // 显示创建的预警数据
    console.log('📊 库存预警数据汇总:');
    console.log('');
    console.log('🔴 高库存预警 (>250 吨):');
    highInventory.forEach((item, index) => {
      const workshop = workshops.find(w => w.id === item.workshopId);
      const product = products.find(p => p.id === item.productSpecId);
      console.log(`  ${index + 1}. ${workshop?.workshopName} - ${product?.productName} ${product?.specType}: ${item.totalWeight} 吨`);
    });
    
    console.log('');
    console.log('🟡 低库存预警 (<15 吨):');
    lowInventory.forEach((item, index) => {
      const workshop = workshops.find(w => w.id === item.workshopId);
      const product = products.find(p => p.id === item.productSpecId);
      console.log(`  ${index + 1}. ${workshop?.workshopName} - ${product?.productName} ${product?.specType}: ${item.totalWeight} 吨`);
    });
    
    console.log('\n🎉 库存预警模拟数据创建完成！\n');
    console.log('💡 提示：刷新数据看板页面即可查看库存预警效果\n');
    
  } catch (error) {
    console.error('❌ 创建失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createInventoryAlerts();
