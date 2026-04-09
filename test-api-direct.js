const http = require('http');

console.log('测试后端 API...\n');

http.get('http://localhost:3001/production/inbound?page=1&limit=20', (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('状态码:', res.statusCode);
    console.log('响应内容:', data);
  });
}).on('error', (err) => {
  console.error('错误:', err.message);
});
