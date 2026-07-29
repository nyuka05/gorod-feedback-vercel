$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Node.js не найден. Установите Node.js 22.13 или новее: https://nodejs.org/" -ForegroundColor Red
  exit 1
}

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  Write-Host "Включаем pnpm через Corepack..." -ForegroundColor Cyan
  corepack enable
  corepack prepare pnpm@latest --activate
}

if (-not (Test-Path ".env.local")) {
  Write-Host "Не найден файл .env.local." -ForegroundColor Red
  Write-Host "Сначала подключите проект к Vercel и выполните:" -ForegroundColor Yellow
  Write-Host "  pnpm dlx vercel link"
  Write-Host "  pnpm dlx vercel env pull .env.local"
  Write-Host "Подробности находятся в VERCEL_DEPLOYMENT.md."
  exit 1
}

$environmentText = Get-Content -Raw ".env.local"
$requiredNames = @("TURSO_DATABASE_URL", "TURSO_AUTH_TOKEN", "BLOB_READ_WRITE_TOKEN", "ADMIN_PASSWORD", "ADMIN_SESSION_SECRET")
$missingNames = $requiredNames | Where-Object { $environmentText -notmatch "(?m)^$($_)=" }
if ($missingNames.Count -gt 0) {
  Write-Host ("В .env.local отсутствуют переменные: " + ($missingNames -join ", ")) -ForegroundColor Red
  Write-Host "Добавьте их по инструкции VERCEL_DEPLOYMENT.md."
  exit 1
}

Write-Host "Устанавливаем зависимости..." -ForegroundColor Cyan
pnpm install --frozen-lockfile

$localAddress = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } |
  Select-Object -First 1 -ExpandProperty IPAddress

Write-Host ""
Write-Host "На этом компьютере: http://localhost:3000" -ForegroundColor Green
if ($localAddress) {
  Write-Host ("В той же сети Wi-Fi: http://" + $localAddress + ":3000") -ForegroundColor Green
}
Write-Host "Панель администратора: добавьте /admin к адресу." -ForegroundColor Green
Write-Host "Для остановки нажмите Ctrl+C." -ForegroundColor DarkGray
Write-Host ""

pnpm dev -- --hostname 0.0.0.0 --port 3000
