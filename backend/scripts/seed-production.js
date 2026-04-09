const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 开始初始化生产模块数据...\n');
  
  try {
    // 1. 插入车间数据
    console.log('📦 插入车间数据...');
    const workshops = await prisma.workshop.createMany({
      data: [
        { workshopCode: 'DY1', workshopName: '电解一车间', workshopType: '电解', sortOrder: 1 },
        { workshopCode: 'DY2', workshopName: '电解二车间', workshopType: '电解', sortOrder: 2 },
        { workshopCode: 'DY3', workshopName: '电解三车间', workshopType: '电解', sortOrder: 3 },
        { workshopCode: 'DY3_DJ', workshopName: '电解三车间电积', workshopType: '电积', sortOrder: 4 },
        { workshopCode: 'DJ1', workshopName: '电积一车间', workshopType: '电积', sortOrder: 5 },
        { workshopCode: 'DJ2', workshopName: '电积二车间', workshopType: '电积', sortOrder: 6 },
        { workshopCode: 'DJ1_128', workshopName: '电积一车间 (128)', workshopType: '电积', sortOrder: 7 },
      ],
      skipDuplicates: true,
    });
    console.log(`✅ 插入 ${workshops.count} 条车间记录\n`);
    
    // 2. 插入产品规格数据
    console.log('📦 插入产品规格数据...');
    const products = await prisma.productSpec.createMany({
      data: [
        // 9996 产品
        { productCode: '9996', productName: '电解镍 9996', specType: '正板', category: '普通', needExportDomestic: 1, sortOrder: 1 },
        { productCode: '9996', productName: '电解镍 9996', specType: '镍条', category: '普通', needExportDomestic: 1, sortOrder: 2 },
        { productCode: '9996', productName: '电解镍 9996', specType: '小块镍', specDetail: '100*100', category: '普通', needExportDomestic: 1, needSizeBreakdown: 1, sortOrder: 3 },
        { productCode: '9996', productName: '电解镍 9996', specType: '小块镍', specDetail: '50*50', category: '普通', needExportDomestic: 1, needSizeBreakdown: 1, sortOrder: 4 },
        { productCode: '9996', productName: '电解镍 9996', specType: '小块镍', specDetail: '20*20', category: '普通', needExportDomestic: 1, needSizeBreakdown: 1, sortOrder: 5 },
        { productCode: '9996', productName: '电解镍 9996', specType: '小块镍', specDetail: '15*15', category: '普通', needExportDomestic: 1, needSizeBreakdown: 1, sortOrder: 6 },
        // 9997 产品
        { productCode: '9997', productName: '电镀专用镍', specType: '正板', category: '电镀专用', needExportDomestic: 1, sortOrder: 7 },
        { productCode: '9997', productName: '电镀专用镍', specType: '镍条', category: '电镀专用', needExportDomestic: 1, sortOrder: 8 },
        { productCode: '9997', productName: '电镀专用镍', specType: '大板', subCategory: '二镍', category: '电镀专用', sortOrder: 9 },
        { productCode: '9997', productName: '电镀专用镍', specType: '大板', subCategory: '一镍', category: '电镀专用', sortOrder: 10 },
        { productCode: '9997', productName: '电镀专用镍', specType: '大板', subCategory: '加压', category: '电镀专用', sortOrder: 11 },
        { productCode: '9997', productName: '电镀专用镍', specType: '小块镍', specDetail: '100*10', category: '电镀专用', sortOrder: 12 },
        // 9990 产品
        { productCode: '9990', productName: '电解镍 9990', specType: '正板', category: '普通', needExportDomestic: 1, sortOrder: 13 },
        { productCode: '9990', productName: '电解镍 9990', specType: '镍条', category: '普通', needExportDomestic: 1, sortOrder: 14 },
        // 9950 产品
        { productCode: '9950', productName: '电解镍 9950', specType: '正板', category: '普通', needExportDomestic: 1, sortOrder: 15 },
        { productCode: '9950', productName: '电解镍 9950', specType: '镍条', category: '普通', needExportDomestic: 1, sortOrder: 16 },
        // 9920 产品
        { productCode: '9920', productName: '电解镍 9920', specType: '正板', category: '普通', needExportDomestic: 1, sortOrder: 17 },
        { productCode: '9920', productName: '电解镍 9920', specType: '镍条', category: '普通', needExportDomestic: 1, sortOrder: 18 },
        // 高合金产品
        { productCode: '高合金', productName: '高温合金镍', specType: '块状', category: '高合金', sortOrder: 19 },
        { productCode: '高合金', productName: '高温合金 100*100 小块镍', specType: '小块镍', specDetail: '100*100', category: '高合金', sortOrder: 20 },
        // 含硫产品
        { productCode: '含硫', productName: '含硫镍块', specType: '块状', category: '含硫', sortOrder: 21 },
        // 镍扣
        { productCode: '镍扣', productName: '镍扣', specType: '镍扣', category: '普通', sortOrder: 22 },
      ],
      skipDuplicates: true,
    });
    console.log(`✅ 插入 ${products.count} 条产品规格记录\n`);
    
    // 3. 插入专用镍产品类型
    console.log('📦 插入专用镍产品类型...');
    const today = new Date();
    const specialTypes = await prisma.specialNickelStat.createMany({
      data: [
        { productType: '加压电镀专用镍 (大板)', statDate: today },
        { productType: '9996 小块镍 100*100', statDate: today },
        { productType: '9996 小块镍 50*50', statDate: today },
        { productType: '9996 小块镍 20*20', statDate: today },
        { productType: '9996 小块镍 15*15', statDate: today },
        { productType: '高温合金镍', statDate: today },
        { productType: '15*15 小块镍', statDate: today },
        { productType: '含硫镍块', statDate: today },
        { productType: '镍扣', statDate: today },
        { productType: '高温合金 100*100 小块镍', statDate: today },
      ],
      skipDuplicates: true,
    });
    console.log(`✅ 插入 ${specialTypes.count} 条专用镍类型记录\n`);
    
    console.log('🎉 数据初始化完成！\n');
    
  } catch (error) {
    console.error('❌ 初始化失败:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
