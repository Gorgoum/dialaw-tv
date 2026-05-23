@echo off
title Dialaw TV - Demarrage
echo.
echo ================================================
echo    DIALAW TV - Systeme de Gestion Comptable
echo ================================================
echo.

echo [1/2] Demarrage du backend (port 5050)...
start "Backend Dialaw TV" cmd /k "cd /d "%~dp0backend" && node server.js"

timeout /t 3 /nobreak >nul

echo [2/2] Demarrage du frontend (port 3000)...
start "Frontend Dialaw TV" cmd /k "cd /d "%~dp0frontend" && npm start"

echo.
echo  Backend  : http://localhost:5050
echo  Frontend : http://localhost:3000
echo.
echo  Admin      : admin@dialawtv.sn / admin2024
echo  Comptable  : comptable@dialawtv.sn / comptable2024
echo.
echo Le navigateur s'ouvrira automatiquement...
echo.
pause
