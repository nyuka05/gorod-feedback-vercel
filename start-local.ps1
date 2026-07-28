$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Node.js was not found. Install Node.js 22.13 or newer: https://nodejs.org/" -ForegroundColor Red
  exit 1
}

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  Write-Host "Enabling pnpm through Corepack..." -ForegroundColor Cyan
  corepack enable
  corepack prepare pnpm@latest --activate
}

if (-not (Test-Path ".env.local")) {
  $localPassword = "Admin-" + [guid]::NewGuid().ToString("N").Substring(0, 12)
  $localSecret = [guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N")
  @(
    "ADMIN_PASSWORD=`"$localPassword`""
    "ADMIN_SESSION_SECRET=`"$localSecret`""
  ) | Set-Content -Path ".env.local" -Encoding UTF8
  Write-Host "Local admin password: $localPassword" -ForegroundColor Yellow
  Write-Host "Save this password now. It will not be printed again." -ForegroundColor Yellow
}

Write-Host "Installing dependencies..." -ForegroundColor Cyan
pnpm install

$localAddress = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } |
  Select-Object -First 1 -ExpandProperty IPAddress

Write-Host ""
Write-Host "This computer: http://localhost:3000" -ForegroundColor Green
if ($localAddress) {
  $networkUrl = "http://" + $localAddress + ":3000"
  Write-Host ("Same Wi-Fi network: " + $networkUrl) -ForegroundColor Green
}
Write-Host "Admin panel: add /admin to the address." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server." -ForegroundColor DarkGray
Write-Host ""

pnpm dev -- --host 0.0.0.0 --port 3000
