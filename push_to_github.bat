@echo off
title Push to GitHub - Auralis Med Tech
echo ========================================================
echo  Pushing Auralis Med Tech codebase to GitHub...
echo  Repository: https://github.com/sitanshukopare1-del/auralis-medtech-website
echo ========================================================
echo.
cd /d "%~dp0"
"C:\Users\Shree\AppData\Local\Programs\MinGit\cmd\git.exe" push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Code successfully pushed to GitHub!
) else (
    echo [NOTE] If prompted above, please complete the GitHub sign-in in your browser or enter your token.
)
echo.
pause
