@echo off
cd /d "%~dp0"
if not exist node_modules call npm.cmd ci
if errorlevel 1 exit /b 1
echo Open http://localhost:3000 when Next.js is ready.
call npm.cmd run dev
pause
