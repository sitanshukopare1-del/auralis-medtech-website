@echo off
title Auralis Med Tech - SAFE VAC Server
echo ========================================================
echo  Starting Auralis Med Tech Local Server (Port 8000)...
echo  Opening: http://localhost:8000
echo ========================================================
echo.
cd /d "%~dp0"
py server.py
pause
