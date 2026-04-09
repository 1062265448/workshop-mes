# 清理前端端口占用脚本
Write-Host "🔍 检查端口占用..." -ForegroundColor Cyan

$ports = @(5173, 5174, 5175)

foreach ($port in $ports) {
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | 
               Select-Object -ExpandProperty OwningProcess -First 1
    
    if ($process) {
        Write-Host "⚠️  端口 $port 被进程 $process 占用" -ForegroundColor Yellow
        try {
            Stop-Process -Id $process -Force -ErrorAction Stop
            Write-Host "✅ 已停止进程 $process" -ForegroundColor Green
        } catch {
            Write-Host "❌ 无法停止进程 $process" -ForegroundColor Red
        }
    } else {
        Write-Host "✓ 端口 $port 空闲" -ForegroundColor Green
    }
}

Write-Host "`n🎉 清理完成！" -ForegroundColor Cyan
Write-Host "现在可以运行：npm run dev" -ForegroundColor White
