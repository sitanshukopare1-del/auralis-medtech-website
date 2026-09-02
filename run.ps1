# Auralis Med Tech - Local Server PowerShell Launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " Starting Auralis Med Tech Server on Port 8000..." -ForegroundColor Cyan
Write-Host " Local URL: http://localhost:8000" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Set-Location -Path $PSScriptRoot
py server.py
