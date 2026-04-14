const http = require('http');

console.log('🧪 测试后端 API...\n');

http.get('http://localhost:3001/production/inbound?page=1&limit=10', (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('状态码:', res.statusCode);
    if (res.statusCode === 200) {
      const json = JSON.parse(data);
      console.log('✅ API 正常！');
      console.log('返回数据:', json.total, '条记录');
      if (json.data && json.data.length > 0) {
        console.log('\n前 3 条数据:');
        json.data.slice(0, 3).forEach(item => {
          console.log(`  - ${item.workshop?.workshopName} | ${item.productSpec?.productName} | ${item.totalWeight} 吨`);
        });
      }
    } else {
      console.log('❌ API 返回错误:', data);
    }
  });
}).on('error', (err) => {
  console.error('❌ 请求失败:', err.message);
});
