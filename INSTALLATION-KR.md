# SD Quick UI - 설치 가이드

## 📋 목차
- [시작하기 전에](#시작하기-전에)
- [빠른 설치 (초보자용)](#빠른-설치-초보자용)
- [수동 설치 (고급 사용자용)](#수동-설치-고급-사용자용)
- [문제 해결](#문제-해결)

---

## 시작하기 전에

### 💻 최소 사양
- **운영체제**: Windows 10/11 (64bit)
- **여유 공간**: 50GB 이상 권장
- **메모리**: 8GB RAM 이상 (16GB 권장)
- **그래픽카드**: NVIDIA GPU (GTX 1060 6GB 이상 권장)
  - CPU로도 실행 가능하지만 매우 느립니다
- **인터넷**: 설치 시 필요 (약 10-15GB 다운로드)

### 📦 필요한 프로그램
설치하기 전에 다음 프로그램이 필요합니다:

1. **Git** (필수)
   - 다운로드: https://git-scm.com/download/win
   - 설치 시 모든 옵션은 기본값으로 두고 "Next" 클릭

2. **Node.js** (필수)
   - 다운로드: https://nodejs.org/
   - LTS 버전 다운로드 (v18 이상)
   - 설치 시 "Automatically install necessary tools" 체크

3. **Python** (선택 - WebUI가 자동 설치)
   - SD WebUI가 자동으로 설치하므로 별도 설치 불필요

---

## 빠른 설치 (초보자용)

### 1단계: SD Quick UI 다운로드

GitHub Releases에서 최신 버전 다운로드:
```
https://github.com/rauohon/sd-quick-ui/releases
```

**다운로드 파일**: `sd-quick-ui-v1.0.0.zip` (약 10MB)

### 2단계: 압축 해제

다운로드한 파일을 원하는 위치에 압축 해제:
```
예시: D:\AI\sd-quick-ui\
```

⚠️ **중요**: 경로에 한글이 없는 것이 좋습니다!

### 3단계: 설치 스크립트 실행

압축 해제한 폴더에서 `install.bat`을 더블클릭

스크립트가 자동으로:
1. Git, Node.js 확인
2. SD WebUI 다운로드 (없는 경우)
3. API 패치 적용
4. 실행 스크립트 생성

**예상 소요 시간**: 10-30분 (인터넷 속도에 따라)

### 4단계: AI 모델 다운로드

AI 이미지를 생성하려면 모델 파일이 필요합니다.

**추천 모델**: Stable Diffusion v1.5
- 다운로드: https://huggingface.co/stable-diffusion-v1-5/stable-diffusion-v1-5
- 파일: `v1-5-pruned-emaonly.safetensors` (약 4GB)

다운로드한 파일을 이 폴더에 넣으세요:
```
stable-diffusion-webui\models\Stable-diffusion\
```

**다른 모델 사용 가능**:
- Civitai: https://civitai.com/
- HuggingFace: https://huggingface.co/models?pipeline_tag=text-to-image

### 5단계: 실행

`start.bat`을 더블클릭!

- 두 개의 검은 창이 열립니다 (닫지 마세요!)
- 브라우저가 자동으로 열립니다: http://localhost:5173
- 첫 실행은 1-2분 소요됩니다

### 6단계: 이미지 생성

1. 프롬프트 입력 (원하는 그림 설명)
2. "Generate" 버튼 클릭
3. 잠시 기다리면 이미지가 생성됩니다!

---

## 수동 설치 (고급 사용자용)

이미 SD WebUI가 설치되어 있는 경우:

### 폴더 구조

```
parent-folder/
├── stable-diffusion-webui/    # 기존 SD WebUI
└── sd-quick-ui/                # 여기에 클론
```

### 1단계: 클론

```bash
cd parent-folder
git clone https://github.com/rauohon/sd-quick-ui.git
cd sd-quick-ui
```

### 2단계: API 패치 적용

```bash
cd ../stable-diffusion-webui
git apply ../sd-quick-ui/patches/webui-api.patch
```

패치 내용:
- LoRA 목록 조회 API 추가
- LoRA 썸네일 API 추가
- API 로그 레벨 조정

### 3단계: 의존성 설치

```bash
cd ../sd-quick-ui
npm install
```

### 4단계: 빌드 (선택)

개발 모드로 실행:
```bash
npm run dev
```

프로덕션 빌드:
```bash
npm run build
npm run preview
```

### 5단계: WebUI API 실행

```bash
cd ../stable-diffusion-webui
python webui.py --api --nowebui --cors-allow-origins=http://localhost:5173
```

또는 `webui-api.bat`:
```batch
set COMMANDLINE_ARGS=--api --nowebui --cors-allow-origins=http://localhost:5173
call webui.bat
```

### 6단계: 브라우저 접속

```
http://localhost:5173
```

---

## 문제 해결

### ❌ "Git이 설치되어 있지 않습니다"

**해결책**:
1. https://git-scm.com/download/win 에서 Git 다운로드
2. 설치 후 컴퓨터 재시작
3. `install.bat` 다시 실행

**확인 방법**:
```bash
git --version
```

---

### ❌ "WebUI를 찾을 수 없습니다"

**해결책 1**: 자동 설치
- `install.bat` 실행 시 "자동 설치" 선택

**해결책 2**: 경로 지정
- 이미 설치된 WebUI 폴더 경로 입력
- 예: `D:\stable-diffusion-webui`

**해결책 3**: 수동 설치
```bash
git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui.git
```

---

### ❌ "패치 적용 실패"

**원인**:
- WebUI 버전이 다름
- 이미 패치가 적용됨
- 파일이 수정됨

**해결책 1**: 버전 확인
```bash
cd stable-diffusion-webui
git log --oneline -1
```

호환 버전: `82a973c04` 이상

**해결책 2**: 수동 패치
`docs/manual-patch-guide.md` 참고

**해결책 3**: WebUI 재설치
```bash
# 백업 후
git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui.git
```

---

### ❌ "모델을 찾을 수 없습니다"

**해결책**:
1. 모델 다운로드: https://huggingface.co/stable-diffusion-v1-5/stable-diffusion-v1-5
2. `.safetensors` 파일을 이 폴더에 넣기:
   ```
   stable-diffusion-webui\models\Stable-diffusion\
   ```
3. `start.bat` 다시 실행

---

### ❌ "포트가 이미 사용 중입니다"

**해결책 1**: 다른 프로그램 종료
- 7860 포트를 사용하는 프로그램 종료
- WebUI가 이미 실행 중일 수 있음

**해결책 2**: 포트 변경
`webui-api.bat` 수정:
```batch
set COMMANDLINE_ARGS=--api --nowebui --port 7861 --cors-allow-origins=http://localhost:5173
```

---

### ❌ "npm install 실패"

**원인**: 네트워크 오류, 권한 부족

**해결책 1**: 관리자 권한으로 실행
- `install.bat` 우클릭 → "관리자 권한으로 실행"

**해결책 2**: npm 캐시 삭제
```bash
npm cache clean --force
npm install
```

**해결책 3**: Node.js 재설치
- https://nodejs.org/ 에서 LTS 버전 다운로드

---

### ❌ "API 연결 실패"

**증상**: 브라우저에서 "API 서버에 연결할 수 없습니다"

**해결책**:
1. WebUI API 서버 확인
   - "SD WebUI API" 창이 열려 있는지 확인
   - `http://localhost:7860/docs` 접속 확인

2. CORS 설정 확인
   - `webui-api.bat`에 `--cors-allow-origins=http://localhost:5173` 포함 확인

3. 방화벽 확인
   - Windows 방화벽에서 Python 허용

---

### ❌ 이미지 생성 실패

**증상**: "생성 실패" 또는 검은 화면

**해결책 1**: GPU 메모리 부족
- 이미지 크기 줄이기 (512x512)
- Batch size 1로 설정
- Hires fix 비활성화

**해결책 2**: 모델 문제
- 다른 모델로 변경
- WebUI에서 직접 테스트

**해결책 3**: 로그 확인
- "SD WebUI API" 창에서 에러 메시지 확인

---

### 💡 더 많은 도움말

- **GitHub Issues**: https://github.com/rauohon/sd-quick-ui/issues
- **WebUI 공식 문서**: https://github.com/AUTOMATIC1111/stable-diffusion-webui

---

## 📞 지원

문제가 해결되지 않으면:

1. GitHub Issues에 버그 리포트 작성
   - OS 버전
   - 에러 메시지
   - 실행 로그

2. WebUI 버전 확인
   ```bash
   cd stable-diffusion-webui
   git log --oneline -1
   ```

---

**즐거운 이미지 생성 되세요! 🎨**
