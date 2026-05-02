@echo off
setlocal
cd /d "%~dp0.."
node scripts\run_pork_daily.mjs %*
