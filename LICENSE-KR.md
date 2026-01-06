# 라이선스 (한국어)

> 이 문서는 [LICENSE](LICENSE) 파일의 한국어 번역본입니다.
> 영문 원본과 충돌이 있는 경우 **영문 원본(LICENSE)이 우선**합니다.

---

## MIT 라이선스

Copyright (c) 2025 SD Quick UI Contributors

이 소프트웨어와 관련 문서 파일("소프트웨어")의 사본을 취득하는 모든 사람에게
무료로 다음의 권한을 부여합니다: 소프트웨어를 제한 없이 사용, 복사, 수정, 병합,
게시, 배포, 서브라이선스 부여, 판매할 수 있으며, 소프트웨어를 제공받는 사람에게도
동일한 권한을 부여할 수 있습니다. 단, 다음 조건을 따라야 합니다:

위의 저작권 표시와 본 허가 표시가 소프트웨어의 모든 사본 또는
상당 부분에 포함되어야 합니다.

소프트웨어는 "있는 그대로" 제공되며, 상품성, 특정 목적에의 적합성,
비침해에 대한 보증을 포함하되 이에 국한되지 않는 어떠한 종류의
명시적 또는 묵시적 보증도 제공하지 않습니다. 저작자 또는 저작권자는
소프트웨어 또는 소프트웨어의 사용이나 기타 거래로 인해 발생하는
어떠한 청구, 손해 또는 기타 책임에 대해서도 책임을 지지 않습니다.

---

## 서드파티 라이선스 및 고지

### 의존성

이 프로젝트는 다음의 오픈소스 패키지를 사용하며, 모두 MIT 호환 라이선스입니다:

- Vue.js (MIT 라이선스) - https://github.com/vuejs/core
- vue-i18n (MIT 라이선스) - https://github.com/intlify/vue-i18n
- Vite (MIT 라이선스) - https://github.com/vitejs/vite

### Stable Diffusion WebUI

이 프로젝트는 Stable Diffusion WebUI (AUTOMATIC1111)와 API를 통해 통신하는
**프론트엔드 클라이언트**입니다. SD WebUI의 코드를 포함하거나 재배포하지 않습니다.

- Stable Diffusion WebUI: https://github.com/AUTOMATIC1111/stable-diffusion-webui
- SD WebUI 라이선스: AGPL-3.0

### 패치 파일

`patches/` 디렉토리에는 Stable Diffusion WebUI에 추가 API 엔드포인트를 제공하기 위한
패치 파일이 포함되어 있습니다. 이 패치는 AGPL-3.0 라이선스 코드를 수정하며,
SD WebUI에 적용 시 AGPL-3.0 라이선스 조건을 따릅니다.

패치 파일은 편의를 위해 제공되며, 이 애플리케이션 실행에 필수가 아닙니다
(LoRA 브라우저 기능에만 필요).

### 면책 조항

이 프로젝트는 Stability AI, AUTOMATIC1111 또는 관련 단체와 제휴, 보증,
후원 관계가 없습니다. "Stable Diffusion"은 Stability AI의 상표입니다.
