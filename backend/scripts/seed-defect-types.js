const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 缺陷类型数据（根据样本库文件夹命名）
const defectTypesData = [
  {
    name: '9950 板 (2#)',
    code: 'DEFECT-9950',
    category: '形状缺陷',
    color: '#ff6b6b',
    description: '9950 纯度的 2# 大板镍',
  },
  {
    name: '不规则镍板 (缺角，不规则)',
    code: 'DEFECT-IRREGULAR',
    category: '形状缺陷',
    color: '#feca57',
    description: '形状不规则、有缺角的镍板',
  },
  {
    name: '不锈钢专用镍 (3#)',
    code: 'DEFECT-SS-3',
    category: '材质缺陷',
    color: '#3b82f6',
    description: '不锈钢生产专用的 3# 镍板',
  },
  {
    name: '不锈钢专用镍 (边部结瘤)',
    code: 'DEFECT-SS-EDGE',
    category: '表面缺陷',
    color: '#5f27cd',
    description: '边部有结瘤缺陷的不锈钢专用镍',
  },
  {
    name: '不锈钢专用镍 (电击板)',
    code: 'DEFECT-SS-ELEC',
    category: '表面缺陷',
    color: '#ff9ff3',
    description: '受电击影响的不锈钢专用镍',
  },
  {
    name: '不锈钢专用镍 (绿色结晶)',
    code: 'DEFECT-SS-GREEN',
    category: '颜色缺陷',
    color: '#f97316',
    description: '表面有绿色结晶的不锈钢专用镍',
  },
  {
    name: '不锈钢专用镍 (氢氧化镍)',
    code: 'DEFECT-SS-HYDRO',
    category: '表面缺陷',
    color: '#fdcb6e',
    description: '含有氢氧化镍的不锈钢专用镍',
  },
    category: '表面缺陷',
    color: '#10ac84',
    description: '含有氢氧化镍的不锈钢专用镍',
  },
  {
    name: '不锈钢专用镍 (烧板)',
    code: 'DEFECT-SS-BURN',
    category: '表面缺陷',
    color: '#ee5a24',
    description: '烧板缺陷的不锈钢专用镍',
  },
  {
    name: '目前不确定的',
    code: 'DEFECT-UNKNOWN',
    category: '其他缺陷',
    color: '#8395a7',
    description: '缺陷类型暂时无法确定的样本',
  },
];

async function seedDefectTypes() {
  try {
    console.log('🌱 开始导入缺陷类型数据...');
    console.log(`📊 共 ${defectTypesData.length} 种缺陷类型`);

    let created = 0;
    let skipped = 0;

    for (const data of defectTypesData) {
      try {
        // 检查是否已存在
        const existing = await prisma.defectType.findFirst({
          where: {
            OR: [
              { code: data.code },
              { name: data.name },
            ],
          },
        });

        if (existing) {
          console.log(`⏭️  跳过（已存在）: ${data.name}`);
          skipped++;
          continue;
        }

        // 创建缺陷类型
        const defectType = await prisma.defectType.create({
          data: {
            code: data.code,
            name: data.name,
            category: data.category,
            color: data.color,
            description: data.description,
          },
        });

        console.log(`✅ 创建成功：${data.name} (ID: ${defectType.id})`);
        created++;
      } catch (error) {
        console.error(`❌ 创建失败：${data.name}`, error.message);
      }
    }

    console.log('\n📊 导入完成！');
    console.log(`✅ 成功创建：${created} 个`);
    console.log(`⏭️  跳过：${skipped} 个`);
    console.log(`📝 总计：${defectTypesData.length} 个`);

    // 显示所有缺陷类型
    console.log('\n📋 当前数据库中的所有缺陷类型：');
    const allTypes = await prisma.defectType.findMany({
      orderBy: { createdAt: 'desc' },
    });

    allTypes.forEach((type, index) => {
      console.log(`  ${index + 1}. [${type.code}] ${type.name} - ${type.category}`);
    });

  } catch (error) {
    console.error('❌ 导入过程出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行
seedDefectTypes();
