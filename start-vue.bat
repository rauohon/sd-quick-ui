chcp 65001
@echo off

REM ========================================
REM  SD Quick UI - Vue Development Server
REM ========================================

echo.
echo ========================================
echo  SD Quick UI - Starting...
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please download and install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js found:
node --version
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed!
    echo Please reinstall Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] npm found:
npm --version
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [INFO] node_modules not found. Installing dependencies...
    echo This may take a few minutes on first run...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ERROR] npm install failed!
        echo Please check your internet connection and try again.
        echo.
        pause
        exit /b 1
    )
    echo.
    echo [OK] Dependencies installed successfully!
    echo.
)

echo ========================================
echo  Starting Vue Development Server...
echo ========================================
echo.
echo  Vue UI will open at: http://localhost:5173
echo  Browser will open automatically in 5 seconds...
echo  Press Ctrl+C in the server window to stop
echo.
echo  IMPORTANT: Make sure WebUI API is running!
echo  Run webui-api.bat in the stable-diffusion-webui folder
echo ========================================
echo.

REM Start Vue dev server in a new window
start "SD Quick UI - Vue Server" npm run dev

REM Wait for Vite to start (usually takes 2-3 seconds)
echo Waiting for Vue server to start...
timeout /t 5 /nobreak >nul

REM Open browser
echo Opening browser...
start http://localhost:5173

echo.
echo ========================================
echo  Browser opened!
echo  Keep the "Vue Server" window open.
echo  This window can be closed.
echo ========================================
echo.

pause
