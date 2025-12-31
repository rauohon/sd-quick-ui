chcp 65001 >nul
@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================
echo   SD Quick UI - 자동 설치 스크립트
echo ========================================
echo.
echo 이 스크립트는 다음을 수행합니다:
echo  1. Stable Diffusion WebUI 확인/설치
echo  2. API 패치 적용 (LoRA 지원)
echo  3. 실행 스크립트 생성
echo.
echo 예상 소요 시간: 5-30분 (WebUI 설치 여부에 따라)
echo 필요 공간: 약 10-15GB
echo.
pause

REM ========================================
REM 환경 체크
REM ========================================

echo.
echo [단계 1/5] 환경 체크...
echo.

REM Git 체크
echo [확인] Git 설치 확인 중...
git --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [X] Git이 설치되어 있지 않습니다!
    echo.
    echo Git을 먼저 설치해주세요:
    echo https://git-scm.com/download/win
    echo.
    echo 설치 후 이 스크립트를 다시 실행하세요.
    echo.
    start https://git-scm.com/download/win
    pause
    exit /b 1
)
echo [✓] Git 설치됨:
git --version

REM Python 체크 (선택사항 - WebUI가 자동 설치)
echo.
echo [확인] Python 설치 확인 중...
python --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [✓] Python 설치됨:
    python --version
) else (
    echo [!] Python이 설치되어 있지 않습니다.
    echo     걱정하지 마세요! WebUI가 자동으로 Python을 설치합니다.
)

REM ========================================
REM SD WebUI 설치 또는 확인
REM ========================================

echo.
echo [단계 2/5] Stable Diffusion WebUI 확인...
echo.

REM 현재 디렉토리 확인
set "CURRENT_DIR=%CD%"
set "PARENT_DIR=%CD%\.."

REM WebUI 경로 탐지
set "WEBUI_PATH="

REM 1. 부모 디렉토리에서 찾기
if exist "%PARENT_DIR%\stable-diffusion-webui\webui.bat" (
    set "WEBUI_PATH=%PARENT_DIR%\stable-diffusion-webui"
    echo [✓] WebUI 발견: !WEBUI_PATH!
    goto :webui_found
)

REM 2. 같은 디렉토리에서 찾기
if exist "%CURRENT_DIR%\stable-diffusion-webui\webui.bat" (
    set "WEBUI_PATH=%CURRENT_DIR%\stable-diffusion-webui"
    echo [✓] WebUI 발견: !WEBUI_PATH!
    goto :webui_found
)

REM 3. WebUI 없음 - 설치 필요
echo [!] Stable Diffusion WebUI를 찾을 수 없습니다.
echo.
echo WebUI를 설치하시겠습니까?
echo.
echo [옵션 1] 자동 설치 (추천)
echo    - 부모 폴더에 자동 설치
echo    - 경로: %PARENT_DIR%\stable-diffusion-webui
echo.
echo [옵션 2] 수동 지정
echo    - 이미 설치된 WebUI 경로 입력
echo.
echo [옵션 3] 취소
echo.
choice /C 123 /M "선택하세요 (1=자동설치, 2=경로지정, 3=취소)"

if errorlevel 3 exit /b
if errorlevel 2 goto :manual_path
if errorlevel 1 goto :auto_install

:auto_install
echo.
echo [설치 중] Stable Diffusion WebUI 다운로드 중...
echo 경로: %PARENT_DIR%\stable-diffusion-webui
echo.
echo 이 작업은 10-20분 소요될 수 있습니다.
echo.

cd "%PARENT_DIR%"
git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui.git

if %ERRORLEVEL% NEQ 0 (
    echo [X] WebUI 설치 실패!
    pause
    exit /b 1
)

set "WEBUI_PATH=%PARENT_DIR%\stable-diffusion-webui"
cd "%CURRENT_DIR%"
echo [✓] WebUI 설치 완료!
goto :webui_found

:manual_path
echo.
set /p "WEBUI_PATH=WebUI 경로를 입력하세요 (예: C:\stable-diffusion-webui): "

if not exist "%WEBUI_PATH%\webui.bat" (
    echo [X] 해당 경로에 WebUI가 없습니다!
    echo     webui.bat 파일을 찾을 수 없습니다.
    pause
    exit /b 1
)

echo [✓] WebUI 확인됨: %WEBUI_PATH%

:webui_found

REM ========================================
REM 백업 및 패치 적용
REM ========================================

echo.
echo [단계 3/5] API 패치 적용...
echo.

REM 백업 폴더 생성
if not exist "%WEBUI_PATH%\modules\api\backup" (
    mkdir "%WEBUI_PATH%\modules\api\backup"
)

REM 원본 백업 (아직 백업 안 했을 경우만)
if not exist "%WEBUI_PATH%\modules\api\backup\api.py.original" (
    echo [백업] 원본 파일 백업 중...
    copy "%WEBUI_PATH%\modules\api\api.py" "%WEBUI_PATH%\modules\api\backup\api.py.original" >nul
    copy "%WEBUI_PATH%\modules\api\models.py" "%WEBUI_PATH%\modules\api\backup\models.py.original" >nul
    echo [✓] 백업 완료: %WEBUI_PATH%\modules\api\backup\
)

REM 패치 적용
echo [패치] API 파일 패치 중...

cd "%WEBUI_PATH%"
git apply --check "%CURRENT_DIR%\patches\webui-api.patch" >nul 2>&1

if %ERRORLEVEL% EQU 0 (
    REM 패치 적용 가능
    git apply "%CURRENT_DIR%\patches\webui-api.patch"
    if %ERRORLEVEL% EQU 0 (
        echo [✓] 패치 적용 완료!
    ) else (
        echo [X] 패치 적용 실패!
        echo     수동으로 패치를 적용해야 할 수 있습니다.
        echo     자세한 내용은 docs/manual-patch-guide.md를 참고하세요.
    )
) else (
    echo [!] 패치를 적용할 수 없습니다.
    echo.
    echo 가능한 원인:
    echo  - WebUI 버전이 다름
    echo  - 이미 패치가 적용됨
    echo  - 파일이 수정됨
    echo.
    echo 계속 진행하시겠습니까? (이미 패치됐을 수 있습니다)
    choice /C YN /M "계속"
    if errorlevel 2 exit /b
)

cd "%CURRENT_DIR%"

REM ========================================
REM 모델 확인
REM ========================================

echo.
echo [단계 4/5] AI 모델 확인...
echo.

set "MODEL_COUNT=0"
for %%F in ("%WEBUI_PATH%\models\Stable-diffusion\*.safetensors") do (
    set /a MODEL_COUNT+=1
)

if %MODEL_COUNT% GTR 0 (
    echo [✓] 모델 발견: %MODEL_COUNT%개
) else (
    echo [!] AI 모델이 설치되어 있지 않습니다.
    echo.
    echo AI 이미지를 생성하려면 모델 파일이 필요합니다.
    echo.
    echo [추천 모델]
    echo  - Stable Diffusion v1.5 (약 4GB)
    echo  - https://huggingface.co/runwayml/stable-diffusion-v1-5
    echo.
    echo 다운로드한 .safetensors 파일을 이 폴더에 넣으세요:
    echo %WEBUI_PATH%\models\Stable-diffusion\
    echo.

    choice /C YN /M "모델 다운로드 페이지를 여시겠습니까?"
    if errorlevel 1 (
        start explorer "%WEBUI_PATH%\models\Stable-diffusion"
        start https://huggingface.co/runwayml/stable-diffusion-v1-5/tree/main
        echo.
        echo 모델 다운로드 후 아무 키나 누르세요...
        pause >nul
    )
)

REM ========================================
REM 실행 스크립트 생성
REM ========================================

echo.
echo [단계 5/5] 실행 스크립트 생성...
echo.

REM start.bat 생성
(
echo chcp 65001 ^>nul
echo @echo off
echo.
echo echo ========================================
echo echo   SD Quick UI - 시작
echo echo ========================================
echo echo.
echo echo 두 개의 서버를 시작합니다:
echo echo  1. WebUI API 서버 ^(포트 7860^)
echo echo  2. Vue UI 서버 ^(포트 5173^)
echo echo.
echo echo 두 창을 모두 열어두세요!
echo echo.
echo pause
echo.
echo REM WebUI API 서버 시작
echo cd "%WEBUI_PATH%"
echo if not exist "webui-api.bat" ^(
echo     echo [생성] webui-api.bat 생성 중...
echo     ^(
echo     echo @echo off
echo     echo set PYTHON=
echo     echo set GIT=
echo     echo set VENV_DIR=
echo     echo set "COMMANDLINE_ARGS=--api --nowebui --port 7860 --cors-allow-origins=http://localhost:5173"
echo     echo call webui.bat
echo     ^) ^> webui-api.bat
echo ^)
echo.
echo echo [1/2] WebUI API 서버 시작 중...
echo start "SD WebUI API" cmd /k webui-api.bat
echo.
echo echo [대기] API 서버 초기화 중... ^(약 30초^)
echo timeout /t 30 /nobreak ^>nul
echo.
echo REM Vue UI 서버 시작
echo cd "%CURRENT_DIR%"
echo echo [2/2] Vue UI 서버 시작 중...
echo.
echo REM npm이 설치되어 있는지 확인
echo npm --version ^>nul 2^>^&1
echo if %%ERRORLEVEL%% NEQ 0 ^(
echo     echo [!] Node.js/npm이 설치되어 있지 않습니다.
echo     echo     https://nodejs.org/ 에서 설치 후 다시 실행하세요.
echo     pause
echo     exit /b 1
echo ^)
echo.
echo REM node_modules 확인
echo if not exist "node_modules\" ^(
echo     echo [설치] 의존성 패키지 설치 중... ^(최초 1회^)
echo     call npm install
echo ^)
echo.
echo start "SD Quick UI" cmd /k npm run dev
echo.
echo echo.
echo echo [대기] Vue 서버 시작 중... ^(약 5초^)
echo timeout /t 5 /nobreak ^>nul
echo.
echo echo [완료] 브라우저 열기...
echo start http://localhost:5173
echo.
echo echo.
echo echo ========================================
echo echo   서버 시작 완료!
echo echo.
echo echo   Vue UI: http://localhost:5173
echo echo   API:    http://localhost:7860
echo echo.
echo echo   이 창은 닫아도 됩니다.
echo echo   종료: 서버 창 2개 모두 닫기
echo echo ========================================
echo pause
) > start.bat

echo [✓] start.bat 생성 완료!

REM ========================================
REM 완료
REM ========================================

echo.
echo ========================================
echo   설치 완료!
echo ========================================
echo.
echo [다음 단계]
echo.
echo 1. start.bat을 더블클릭하여 실행
echo    (첫 실행 시 npm install이 자동으로 실행됩니다)
echo.
echo 2. 브라우저가 자동으로 열립니다
echo    http://localhost:5173
echo.
echo 3. 이미지 생성을 시작하세요!
echo.
echo [참고]
echo  - WebUI 경로: %WEBUI_PATH%
echo  - 백업 위치: %WEBUI_PATH%\modules\api\backup\
echo  - 모델 폴더: %WEBUI_PATH%\models\Stable-diffusion\
echo.
echo [문제 해결]
echo  - docs/troubleshooting.md 참고
echo  - GitHub Issues: https://github.com/yourusername/sd-quick-ui/issues
echo.
echo ========================================
echo.
pause
