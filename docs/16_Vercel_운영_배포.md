# Vercel 운영 배포

배포일: 2026-09-21

## 접속 주소

- 서비스: https://hangeoreum-admissions.vercel.app
- Vercel 프로젝트: `hangeoreum-admissions`
- 운영 배포 ID: `dpl_E1wynaXmCoAawiLyDnW4RKr4tjUZ`
- 상태: `READY`, production 별칭 연결 완료

## 배포한 기능

재현 맞춤 추천, 학교별 전략, 점수 시뮬레이터, 서울·수도권 일반 대학 선택지, 치대·의대 선택지, 기기 시나리오 저장, 2026 입결 현황을 배포했다. 화면 이름은 재현으로 표시한다.

Cloudflare Worker·D1과 GitHub 운영자 OAuth는 아직 원격 연결 전이다. 현재 클라우드 저장·로그인은 사용할 수 없으며 기기 저장을 사용한다. 기존 localhost의 기기 저장 기록은 별도 출처의 브라우저 저장소이므로 배포 주소로 자동 이전되지 않는다.

## 배포 설정

- Root Directory: `apps/web`
- Framework: Next.js, Node.js `24.x`
- 루트 밖 소스 포함: 활성화 (`packages/core`, 루트 lockfile 사용)
- Build Command: `npm run build`
- Install Command: `npm ci --include=dev --workspaces --include-workspace-root`
- 설치 명령은 `apps/web/vercel.json`에 저장했다. workspace에서 기본 `npm ci`만 실행하면 루트의 TypeScript 개발 도구가 빠져 빌드가 실패하므로 루트 개발 의존성을 명시적으로 포함한다.
- 루트 `.vercelignore`로 `.env*`, `.dev.vars*`, 로컬 DB·캐시, 조사 원문과 문서를 제외했다. 업로드 대상 64개 파일을 사전 검사했다.
- 개발용 환경변수나 비밀키를 운영 서버에 복사하지 않았다. Cloudflare 연동 시 운영 전용 환경변수를 따로 등록한다.

이 폴더는 `.vercel/project.json`으로 위 프로젝트에 연결되어 있다. 이후 수정은 저장소 루트에서 `vercel deploy --prod`로 재배포한다. Git 자동 배포는 연결하지 않았다.

## 실제 운영 주소 검증

- Vercel 운영 빌드·TypeScript 검사 성공.
- 로그인 없는 HTTP 요청으로 첫 페이지 200, 재현 이름과 보안 헤더 확인.
- `/api/session` 200: 클라우드·GitHub·개발 로그인 모두 비활성 상태 확인.
- `/api/simulate` 200: 국98·수99·세지98·한지98·영어1·한국사1·검정고시 감점0 입력 시 가천98.3, 대전994.8, 우석409.7, 상지991 확인.
- 운영 `/api/auth/local` 403, 비로그인 `/api/scenarios` 401 확인.
- 브라우저에서 맞춤 추천·시뮬레이터·일반 대학·치대·의대·2026 입결 화면 확인. 마지막 대시보드의 31개 전형 표시 확인.

입시 자료 확인일·계산 규칙 버전은 이번 배포일과 별개다. 배포 과정에서 입시 수치나 판정 기준을 변경하지 않았다.
