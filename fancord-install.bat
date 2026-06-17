@echo off
:: Wrapper .bat pour lancer fancord-install.ps1 facilement (double-clic)
title Fancord — Installation
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0fancord-install.ps1"
if %errorlevel% neq 0 pause
