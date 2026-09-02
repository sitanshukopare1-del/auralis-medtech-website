# Auralis Med Tech - Dual Server PowerShell Launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " Starting Auralis Med Tech Dual-Port Web Server..." -ForegroundColor Cyan
Write-Host " All files hosted in the SAME main folder" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Set-Location -Path $PSScriptRoot
py server.py
