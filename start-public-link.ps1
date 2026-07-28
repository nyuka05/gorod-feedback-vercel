$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
  Write-Host "cloudflared не найден." -ForegroundColor Red
  Write-Host "Установите его по инструкции: https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/downloads/"
  exit 1
}

Write-Host "Убедитесь, что start-local.ps1 уже запущен в другом окне." -ForegroundColor Cyan
Write-Host "Сейчас появится временная публичная ссылка вида https://...trycloudflare.com" -ForegroundColor Green
Write-Host "Не закрывайте это окно, пока идёт голосование." -ForegroundColor Yellow

cloudflared tunnel --url http://localhost:3000
