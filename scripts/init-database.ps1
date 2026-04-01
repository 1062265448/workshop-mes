# Workshop MES - 数据库初始化脚本
Write-Host "🦞 Workshop MES - 数据库初始化" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# 1. 停止并删除旧容器
Write-Host "`n📌 步骤 1: 清理旧容器..." -ForegroundColor Yellow

$containers = docker ps -a --format "{{.Names}}"

if ($containers -match "workshop-mysql") {
    Write-Host "  停止 workshop-mysql..."
    docker stop workshop-mysql | Out-Null
    docker rm workshop-mysql | Out-Null
    Write-Host "  ✅ workshop-mysql 已删除" -ForegroundColor Green
} else {
    Write-Host "  ⚪ workshop-mysql 不存在" -ForegroundColor Gray
}

if ($containers -match "workshop-mysql-new") {
    Write-Host "  停止 workshop-mysql-new..."
    docker stop workshop-mysql-new | Out-Null
    docker rm workshop-mysql-new | Out-Null
    Write-Host "  ✅ workshop-mysql-new 已删除" -ForegroundColor Green
} else {
    Write-Host "  ⚪ workshop-mysql-new 不存在" -ForegroundColor Gray
}

# 2. 删除旧数据卷
Write-Host "`n📌 步骤 2: 清理旧数据卷..." -ForegroundColor Yellow

$volumes = docker volume ls --format "{{.Name}}"

if ($volumes -match "workshop-mysql-data") {
    Write-Host "  删除 workshop-mysql-data..."
    docker volume rm workshop-mysql-data | Out-Null
    Write-Host "  ✅ workshop-mysql-data 已删除" -ForegroundColor Green
}

# 3. 创建新 MySQL 容器
Write-Host "`n📌 步骤 3: 创建 MySQL 8.0 容器..." -ForegroundColor Yellow

docker run -d --name workshop-mysql -e MYSQL_ROOT_PASSWORD=workshop123 -e MYSQL_DATABASE=workshop_mes -e MYSQL_USER=workshop -e MYSQL_PASSWORD=workshop456 -p 3306:3306 -v workshop-mysql-data:/var/lib/mysql mysql:8.0 --default-authentication-plugin=mysql_native_password

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ MySQL 容器创建成功！" -ForegroundColor Green
} else {
    Write-Host "  ❌ 创建失败，请检查 Docker 是否运行" -ForegroundColor Red
    exit 1
}

# 4. 等待 MySQL 启动
Write-Host "`n📌 步骤 4: 等待 MySQL 启动 (10 秒)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 5. 验证连接
Write-Host "`n📌 步骤 5: 验证数据库连接..." -ForegroundColor Yellow
docker exec workshop-mysql mysql -uroot -pworkshop123 -e "SHOW DATABASES;"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ 数据库初始化完成！" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  MySQL 可能还在启动中，请稍后再试" -ForegroundColor Yellow
}

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "连接信息:" -ForegroundColor Cyan
Write-Host "  主机：localhost" -ForegroundColor Gray
Write-Host "  端口：3306" -ForegroundColor Gray
Write-Host "  数据库：workshop_mes" -ForegroundColor Gray
Write-Host "  Root 密码：workshop123" -ForegroundColor Gray
Write-Host "  用户：workshop / 密码：workshop456" -ForegroundColor Gray
