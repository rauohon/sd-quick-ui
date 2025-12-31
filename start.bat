chcp 65001 >nul
@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================
echo   SD Quick UI - 시작
echo ========================================
echo.

REM ========================================
REM WebUI 경로 탐지
REM ========================================

set "WEBUI_PATH="
set "CURRENT_DIR=%CD%"
set "PARENT_DIR=%CD%\.."

REM 1. 부모 디렉토리에서 찾기
if exist "%PARENT_DIR%\stable-diffusion-webui\webui.bat" (
    set "WEBUI_PATH=%PARENT_DIR%\stable-diffusion-webui"
)

REM 2. 같은 디렉토리에서 찾기
if "%WEBUI_PATH%"=="" (
    if exist "%CURRENT_DIR%\stable-diffusion-webui\webui.bat" (
        set "WEBUI_PATH=%CURRENT_DIR%\stable-diffusion-webui"
    )
)

REM 3. WebUI를 찾을 수 없음
if "%WEBUI_PATH%"=="" (
    echo [X] Stable Diffusion WebUI를 찾을 수 없습니다!
    echo.
    echo install.bat을 먼저 실행하여 설치하세요.
    echo.
    pause
    exit /b 1
)

echo [확인] WebUI 경로: %WEBUI_PATH%
echo.

REM ========================================
REM 서버 시작
REM ========================================

echo 두 개의 서버를 시작합니다:
echo  1. WebUI API 서버 (포트 7860)
echo  2. Vue UI 서버 (포트 5173)
echo.
echo 두 창을 모두 열어두세요!
echo.
pause

echo.
echo [1/2] WebUI API 서버 시작 중...

REM webui-api.bat 생성 (없는 경우)
cd "%WEBUI_PATH%"
if not exist "webui-api.bat" (
    echo [생성] webui-api.bat 생성 중...
    (
        echo @echo off
        echo set PYTHON=
        echo set GIT=
        echo set VENV_DIR=
        echo set "COMMANDLINE_ARGS=--api --nowebui --port 7860 --cors-allow-origins=http://localhost:5173"
        echo call webui.bat
    ) > webui-api.bat
    echo [✓] webui-api.bat 생성 완료
)

REM 임시 배치 파일 생성
(
    echo chcp 65001 ^>nul
    echo @echo off
    echo cd /d "%WEBUI_PATH%"
    echo echo *** WebUI API 실행 중...
    echo call webui-api.bat
) > "%TEMP%\start-webui-api.bat"

start "SD WebUI API" cmd /k "%TEMP%\start-webui-api.bat"

echo [✓] API 서버 시작됨
echo.
echo [대기] API 서버 초기화 중... ^(약 30초^)
echo      처음 실행 시 더 오래 걸릴 수 있습니다.
timeout /t 30 /nobreak >nul

echo.
echo [2/2] Vue UI 서버 시작 중...
cd "%CURRENT_DIR%"

REM dist 폴더 확인 (배포 버전)
if exist "dist\index.html" (
    echo [모드] 프로덕션 빌드 사용 ^(dist/^)

    REM npx 확인
    call npx --version >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo [X] Node.js/npx가 설치되어 있지 않습니다!
        echo.
        echo Node.js를 설치하세요:
        echo https://nodejs.org/
        echo.
        start https://nodejs.org/
        pause
        exit /b 1
    )

    echo [✓] Node.js 확인됨
    echo [서버] dist 폴더 서빙 중...

    REM 임시 배치 파일 생성
    (
        echo chcp 65001 ^>nul
        echo @echo off
        echo cd /d ^"%CURRENT_DIR%^"
        echo echo *** Vue UI 서버 실행 중...
        echo npx serve dist -l 5173
    ) > "%TEMP%\start-vue-ui.bat"

    echo [실행] 새 창에서 Vue 서버 시작...
    echo [경로] %TEMP%\start-vue-ui.bat
    start "SD Quick UI" cmd /k "%TEMP%\start-vue-ui.bat"

    if %ERRORLEVEL% NEQ 0 (
        echo [X] Vue 서버 창 열기 실패!
        echo.
        echo 수동 실행: %TEMP%\start-vue-ui.bat
        pause
    ) else (
        echo [✓] Vue 서버 창 열림
    )

) else (
    REM 개발 모드 (소스코드 있을 때)
    echo [모드] 개발 모드 사용 ^(npm run dev^)

    REM npm 확인
    npm --version >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo [X] Node.js/npm이 설치되어 있지 않습니다!
        echo.
        echo Node.js를 설치하세요:
        echo https://nodejs.org/
        echo.
        start https://nodejs.org/
        pause
        exit /b 1
    )

    echo [✓] Node.js 확인됨

    REM node_modules 확인
    if not exist "node_modules\" (
        echo.
        echo [설치] 의존성 패키지 설치 중... ^(최초 1회, 1-2분 소요^)
        call npm install
        if %ERRORLEVEL% NEQ 0 (
            echo [X] npm install 실패!
            pause
            exit /b 1
        )
        echo [✓] 설치 완료
    )

    echo [✓] 의존성 확인됨

    REM 임시 배치 파일 생성
    (
        echo chcp 65001 ^>nul
        echo @echo off
        echo cd /d ^"%CURRENT_DIR%^"
        echo echo *** Vue 개발 서버 실행 중...
        echo npm run dev
    ) > "%TEMP%\start-vue-dev.bat"

    start "SD Quick UI" cmd /k "%TEMP%\start-vue-dev.bat"
)

echo.
echo [대기] Vue 서버 시작 중... ^(약 5초^)
timeout /t 5 /nobreak >nul

echo.
echo [완료] 브라우저 열기...
start http://localhost:5173

echo.
echo ========================================
echo   서버 시작 완료!
echo ========================================
echo.
echo   Vue UI: http://localhost:5173
echo   API:    http://localhost:7860/docs
echo.
echo   [사용 방법]
echo   - 브라우저에서 프롬프트 입력 후 생성
echo   - 두 서버 창은 닫지 마세요
echo.
echo   [종료 방법]
echo   - "SD WebUI API" 창 닫기
echo   - "SD Quick UI" 창 닫기
echo.
echo   이 창은 닫아도 됩니다.
echo ========================================
echo.
pause
