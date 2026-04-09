Write-Host "测试后端 API..."
try {
  $response = Invoke-RestMethod -Uri "http://localhost:3001/production/inbound?page=1&limit=20" -Method GET
  Write-Host "✅ 成功！"
  Write-Host "响应:" ($response | ConvertTo-Json -Depth 3)
} catch {
  Write-Host "❌ 失败！"
  Write-Host "状态码:" $_.Exception.Response.StatusCode
  Write-Host "错误详情:" $_.ErrorDetails.Message
}
