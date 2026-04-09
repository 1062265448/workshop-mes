const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function importData() {
  console.log('🚀 开始导入 niegu 数据库数据...');
  
  // 读取 SQL 文件
  const sqlPath = 'D:/2026/报表管理和服务器优化改造/试运行/data20260302/niegu.sql';
  console.log(`📂 读取文件：${sqlPath}`);
  
  const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
  
  // 提取 in_batch_analys 表的 INSERT 语句
  const batchAnalysisMatches = sqlContent.match(/INSERT INTO `in_batch_analys` VALUES[^;]+;/gi);
  
  if (!batchAnalysisMatches || batchAnalysisMatches.length === 0) {
    console.log('⚠️ 未找到 in_batch_analys 表数据');
    return;
  }
  
  console.log(`📊 找到 ${batchAnalysisMatches.length} 条批次分析记录`);
  
  // 提取 in_product_plan 表的 INSERT 语句
  const productPlanMatches = sqlContent.match(/INSERT INTO `in_product_plan` VALUES[^;]+;/gi);
  console.log(`📋 找到 ${productPlanMatches ? productPlanMatches.length : 0} 条生产计划记录`);
  
  // 提取 in_product_task 表的 INSERT 语句
  const productTaskMatches = sqlContent.match(/INSERT INTO `in_product_task` VALUES[^;]+;/gi);
  console.log(`📝 找到 ${productTaskMatches ? productTaskMatches.length : 0} 条生产任务记录`);
  
  // 解析并导入批次分析数据
  if (batchAnalysisMatches) {
    console.log('\n🔬 开始导入批次分析数据...');
    let successCount = 0;
    let errorCount = 0;
    
    for (const match of batchAnalysisMatches) {
      // 提取 VALUES 后面的数据
      const valuesMatch = match.match(/VALUES\s*(.+)$/i);
      if (!valuesMatch) continue;
      
      const valuesStr = valuesMatch[1].replace(/;$/, '');
      
      // 解析每一行数据（简化处理，只导入前几条）
      const rows = valuesStr.split('),(');
      
      for (const row of rows) {
        try {
          // 清理数据
          let cleanRow = row.replace(/^\(/, '').replace(/\)$/, '');
          
          // 分割字段（处理引号和 NULL）
          const fields = cleanRow.split(/,(?=(?:(?:[^']*'){2})*[^']*$)/);
          
          // 跳过已存在的数据（根据 id）
          const id = parseInt(fields[0]);
          if (isNaN(id)) continue;
          
          // 检查是否已存在
          const exists = await prisma.inBatchAnalysis.findUnique({
            where: { id }
          });
          
          if (exists) {
            continue;
          }
          
          // 创建记录
          await prisma.inBatchAnalysis.create({
            data: {
              id,
              day: parseField(fields[1]),
              day_time: parseDate(fields[2]),
              workshop: parseInt(fields[3]) || null,
              productline: parseInt(fields[4]) || null,
              batch_no: parseField(fields[5]),
              level: parseInt(fields[6]) || null,
              product_name: parseInt(fields[7]) || null,
              analys_user: parseField(fields[8]),
              analys_no: parseField(fields[9]),
              analys_result: parseInt(fields[10]) || null,
              down_batch_no: parseField(fields[11]),
              batch_create_time: parseDate(fields[12]),
              no: parseInt(fields[13]) || null,
              remark: parseField(fields[14]),
              create_user: parseInt(fields[15]) || null,
              create_time: parseDate(fields[16]),
              update_user: parseInt(fields[17]) || null,
              update_time: parseDate(fields[18]),
              is_del: parseInt(fields[19]) || 0,
              cu: parseField(fields[20]),
              co: parseField(fields[21]),
              s: parseField(fields[22]),
              pb: parseField(fields[23]),
              zn: parseField(fields[24]),
              ass: parseField(fields[25]),
              bi: parseField(fields[26]),
              sb: parseField(fields[27]),
              mn: parseField(fields[28]),
              cd: parseField(fields[29]),
              fe: parseField(fields[30]),
              mg: parseField(fields[31]),
              al: parseField(fields[32]),
              si: parseField(fields[33]),
              c: parseField(fields[34]),
              p: parseField(fields[35]),
              sn: parseField(fields[36]),
              other: parseField(fields[37]),
              nico: parseField(fields[38]),
            }
          });
          
          successCount++;
          if (successCount % 100 === 0) {
            console.log(`  ✅ 已导入 ${successCount} 条记录`);
          }
        } catch (error) {
          errorCount++;
          // 忽略单个错误，继续导入
        }
      }
    }
    
    console.log(`\n✅ 批次分析数据导入完成！`);
    console.log(`   成功：${successCount} 条`);
    console.log(`   失败：${errorCount} 条`);
  }
  
  // 导入生产计划数据
  if (productPlanMatches) {
    console.log('\n📋 开始导入生产计划数据...');
    let successCount = 0;
    
    for (const match of productPlanMatches) {
      const valuesMatch = match.match(/VALUES\s*(.+)$/i);
      if (!valuesMatch) continue;
      
      const valuesStr = valuesMatch[1].replace(/;$/, '');
      const rows = valuesStr.split('),(');
      
      for (const row of rows) {
        try {
          let cleanRow = row.replace(/^\(/, '').replace(/\)$/, '');
          const fields = cleanRow.split(/,(?=(?:(?:[^']*'){2})*[^']*$)/);
          
          const id = parseInt(fields[0]);
          if (isNaN(id)) continue;
          
          const exists = await prisma.inProductPlan.findUnique({
            where: { id }
          });
          
          if (exists) continue;
          
          await prisma.inProductPlan.create({
            data: {
              id,
              is_workshop: parseInt(fields[1]) || null,
              workshop: parseInt(fields[2]) || null,
              productline: parseInt(fields[3]) || null,
              plan_month: parseField(fields[4]),
              plan_month_time: parseDate(fields[5]),
              plan_weight: parseFloat(fields[6]) || null,
              category: parseInt(fields[7]) || null,
              create_user: parseInt(fields[8]) || null,
              create_time: parseDate(fields[9]),
              update_user: parseInt(fields[10]) || null,
              update_time: parseDate(fields[11]),
              is_del: parseInt(fields[12]) || 0,
            }
          });
          
          successCount++;
        } catch (error) {
          // 忽略错误
        }
      }
    }
    
    console.log(`✅ 生产计划数据导入完成：${successCount} 条`);
  }
  
  // 导入生产任务数据
  if (productTaskMatches) {
    console.log('\n📝 开始导入生产任务数据...');
    let successCount = 0;
    
    for (const match of productTaskMatches) {
      const valuesMatch = match.match(/VALUES\s*(.+)$/i);
      if (!valuesMatch) continue;
      
      const valuesStr = valuesMatch[1].replace(/;$/, '');
      const rows = valuesStr.split('),(');
      
      for (const row of rows) {
        try {
          let cleanRow = row.replace(/^\(/, '').replace(/\)$/, '');
          const fields = cleanRow.split(/,(?=(?:(?:[^']*'){2})*[^']*$)/);
          
          const id = parseInt(fields[0]);
          if (isNaN(id)) continue;
          
          const exists = await prisma.inProductTask.findUnique({
            where: { id }
          });
          
          if (exists) continue;
          
          await prisma.inProductTask.create({
            data: {
              id,
              day: parseField(fields[1]),
              day_time: parseDate(fields[2]),
              team: parseInt(fields[3]) || null,
              plan_time: parseDate(fields[4]),
              finish_time: parseDate(fields[5]),
              distribute_user: parseField(fields[6]),
              distribute_time: parseDate(fields[7]),
              task_user: parseField(fields[8]),
              task_time: parseDate(fields[9]),
              remark: parseField(fields[10]),
              create_user: parseInt(fields[11]) || null,
              create_time: parseDate(fields[12]),
              update_user: parseInt(fields[13]) || null,
              update_time: parseDate(fields[14]),
              is_del: parseInt(fields[15]) || 0,
            }
          });
          
          successCount++;
        } catch (error) {
          // 忽略错误
        }
      }
    }
    
    console.log(`✅ 生产任务数据导入完成：${successCount} 条`);
  }
  
  console.log('\n🎉 所有数据导入完成！');
}

// 辅助函数：解析字段
function parseField(field) {
  if (!field || field.trim() === 'NULL') return null;
  // 移除引号
  return field.trim().replace(/^'/, '').replace(/'$/, '');
}

// 辅助函数：解析日期
function parseDate(field) {
  if (!field || field.trim() === 'NULL') return null;
  const dateStr = parseField(field);
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

// 执行导入
importData()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
