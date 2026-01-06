# SD Quick UI

[English](README.md)

> Stable Diffusion WebUI (AUTOMATIC1111)용 Vue 3 프론트엔드

txt2img, img2img, inpaint/outpaint, ControlNet, 워크플로 파이프라인을 지원하는 대체 UI.

![SD Quick UI - txt2img](screenshots/tabs_txt2img.png)

## 기능

### 생성 모드

| 모드 | 설명 |
|------|------|
| txt2img | 텍스트를 이미지로 생성 |
| img2img | 이미지를 이미지로 변환 |
| Inpaint/Outpaint | 마스크 기반 편집 및 캔버스 확장 |
| Workflow | 다단계 파이프라인 (txt2img → img2img → inpaint) |

### 주요 기능

- **프롬프트 슬롯** - 탭별 3개의 설정 슬롯 (프롬프트 + 파라미터)
- **ControlNet** - OpenPose, Canny, Depth, Lineart, Tile 프리셋
- **ADetailer** - 최대 4개 디테일러, 개별 프롬프트 지원
- **Hires Fix** - 업스케일러 지원
- **무한 모드** - 랜덤 시드로 연속 생성
- **큐 시스템** - 배치 생성 관리
- **북마크 & 프리셋** - 프롬프트와 파라미터 저장/불러오기

### 기타 기능

- 진행률 표시 및 미리보기
- 히스토리 패널
- PNG Info (드래그 앤 드롭)
- LoRA 브라우저
- 다크/라이트 모드
- 한국어/영어 지원
- 키보드 단축키

## 스크린샷

### 생성 탭

| txt2img | img2img | inpaint | workflow |
|---------|---------|---------|----------|
| ![txt2img](screenshots/tabs_txt2img.png) | ![img2img](screenshots/tabs_img2img.png) | ![inpaint](screenshots/tabs_inpaint.png) | ![workflow](screenshots/tabs_workflow.png) |

### ControlNet

![ControlNet 패널](screenshots/controlnet.png)

### Inpaint 캔버스

![마스크가 있는 Inpaint](screenshots/inpaint.png)

### 워크플로 파이프라인

![워크플로 편집기](screenshots/workflow.png)

### 다크 모드

![다크 모드](screenshots/dark-mode.png)

## 설치

### 요구 사항

- [Stable Diffusion WebUI](https://github.com/AUTOMATIC1111/stable-diffusion-webui) (AUTOMATIC1111) v1.7.0+
- [Node.js](https://nodejs.org/) v18+

### 설치 방법

```bash
git clone https://github.com/rauohon/sd-quick-ui.git
cd sd-quick-ui
npm install
npm run dev
```

### WebUI 설정

API를 활성화하여 WebUI 실행:

```bash
# Windows (webui-user.bat)
set COMMANDLINE_ARGS=--api --cors-allow-origins=http://localhost:5173

# Linux/Mac
./webui.sh --api --cors-allow-origins=http://localhost:5173
```

브라우저에서 http://localhost:5173 열기

## 사용법

### 프롬프트 슬롯

각 슬롯에 저장되는 항목:
- 프롬프트 (긍정/부정)
- 파라미터 (steps, CFG, sampler, 크기, 시드)
- Hires Fix 설정
- ADetailer 설정
- 배치 설정

클릭 또는 Ctrl+1/2/3으로 슬롯 전환.

### 워크플로 파이프라인

생성 단계 연결:

```
txt2img → img2img → inpaint
```

각 단계에서 파라미터 오버라이드 가능.

### 키보드 단축키

| 단축키 | 동작 |
|--------|------|
| `Ctrl+Enter` | 생성 |
| `Ctrl+1/2/3` | 슬롯 전환 |
| `Ctrl+/` | 프롬프트 포커스 |
| `ESC` | 모달 닫기 |
| `B` | 브러시 (inpaint) |
| `E` | 지우개 (inpaint) |

## 개발

```bash
npm run dev        # 개발 서버
npm run dev:mock   # Mock API (WebUI 불필요)
npm run build      # 프로덕션 빌드
```

## 기술 스택

- Vue 3 (Composition API)
- Vite
- vue-i18n

## 프로젝트 구조

```
src/
├── views/           # 메인 뷰
├── components/      # UI 컴포넌트
├── composables/     # 상태 & 로직
├── config/          # 상수
├── i18n/            # 번역
└── utils/           # 유틸리티
```

## 기여

버그 수정 환영. Fork 후 PR 제출.

## 라이선스

[MIT](LICENSE)

## 감사의 말

- [AUTOMATIC1111/stable-diffusion-webui](https://github.com/AUTOMATIC1111/stable-diffusion-webui)
- [Stability AI](https://stability.ai/)
- [Vue.js](https://vuejs.org/)
