@echo off
cd /d "%~dp0"
if not exist ".next\BUILD_ID" (
	call npm run build
	if errorlevel 1 exit /b %errorlevel%
)
npm start
