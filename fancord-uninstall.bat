@echo off
:: Wrapper .bat pour lancer fancord-uninstall.ps1 facilement (double-clic)
title Fancord — Désinstallation
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0fancord-uninstall.ps1"
if %errorlevel% neq 0 pause
