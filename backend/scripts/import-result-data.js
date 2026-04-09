const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function importResultData() {
  console.log('🚀 开始导入产量数据...\n');
  
  const sqlPath = 'D:/2026/报表管理和服务器优化改造/试运行/data20260302/niegu.sql';
  const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
  
  // 导入任务结果（产量）数据
  const taskJgMatches = sqlContent.match(/INSERT INTO `in_product_task_jg` VALUES[^;]+;/gi);
  
  if (taskJgMatches) {
    console.log(`📊 找到 ${taskJgMatches.length} 条任务结果记录`);
    let successCount = 0;
    
    for (const match of taskJgMatches) {
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
          
          const exists = await prisma.inProductTaskJg.findUnique({ where: { id } });
          if (exists) continue;
          
          await prisma.inProductTaskJg.create({
            data: {
              id,
              task_id: parseInt(fields[1]) || null,
              equip_type: parseInt(fields[2]) || null,
              level: parseInt(fields[3]) || null,
              size: parseInt(fields[4]) || null,
              weight: parseFloat(fields[5]) || null,
              product_name: parseInt(fields[6]) || null,
              create_time: parseDate(fields[7]),
              create_user: parseInt(fields[8]) || null,
              update_user: parseInt(fields[9]) || null,
              update_time: parseDate(fields[10]),
              is_del: parseInt(fields[11]) || 0,
            }
          });
          
          successCount++;
        } catch (error) {
          // 忽略错误
        }
      }
    }
    
    console.log(`✅ 任务结果数据导入完成：${successCount} 条\n`);
  }
  
  // 导入任务交账数据
  const taskJzMatches = sqlContent.match(/INSERT INTO `in_product_task_jz` VALUES[^;]+;/gi);
  
  if (taskJzMatches) {
    console.log(`📋 找到 ${taskJzMatches.length} 条任务交账记录`);
    let successCount = 0;
    
    for (const match of taskJzMatches) {
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
          
          const exists = await prisma.inProductTaskJz.findUnique({ where: { id } });
          if (exists) continue;
          
          await prisma.inProductTaskJz.create({
            data: {
              id,
              task_id: parseInt(fields[1]) || null,
              product_name: parseInt(fields[2]) || null,
              weight: parseFloat(fields[3]) || null,
              create_time: parseDate(fields[4]),
              create_user: parseInt(fields[5]) || null,
              update_user: parseInt(fields[6]) || null,
              update_time: parseDate(fields[7]),
              is_del: parseInt(fields[8]) || 0,
            }
          });
          
          successCount++;
        } catch (error) {
          // 忽略错误
        }
      }
    }
    
    console.log(`✅ 任务交账数据导入完成：${successCount} 条\n`);
  }
  
  console.log('🎉 产量数据导入完成！');
}

function parseDate(field) {
  if (!field || field.trim() === 'NULL') return null;
  const dateStr = field.trim().replace(/^'/, '').replace(/'$/, '');
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

importResultData()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
