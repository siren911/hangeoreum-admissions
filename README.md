# 한걸음 — 재현의 2027 입시 워크스페이스

대학별 전형과 가산점을 비교하고, 가상 점수로 지원 준비 목표를 살펴보는 웹앱입니다.

**[운영 사이트 열기](https://hangeoreum-admissions.vercel.app)**

## 주요 기능

- 재현 맞춤 추천: 화법과 작문·미적분·세계지리·한국지리 조합의 대학별 지원 조건, 모집군·인원, 공식 요강 링크.
- 점수 시뮬레이터: 대학별 환산점수와 가산·감점 계산 과정, 목표 대비 변화.
- 서울·수도권 일반 대학과 의대·치대 선택지.
- 2026 입결 대시보드: 한의대·치대·의대 31개 전형의 공개 결과와 출처, 평균·70%·80% 통계 구분.
- 가상 시나리오 기기 저장·불러오기·비교·JSON 내보내기.
- Cloudflare Worker·D1 저장 API와 GitHub 운영자 로그인 구현.

Vercel 웹앱은 배포되어 있습니다. Cloudflare 원격 DB와 GitHub 로그인은 연결 전이며, 현재 서비스에서는 기기 저장을 사용합니다. [운영 배포 기록](docs/16_Vercel_운영_배포.md).

신호등은 학습 계획용 목표와의 차이를 표시합니다. 합격확률이나 합격 보장이 아닙니다. 입시 자료 확인일과 앱 배포일은 구분하며, 자료가 부족하거나 2027 변환표가 필요한 전형은 대기 상태로 표시합니다.

## 기술 구성

Next.js 16 · React 19 · TypeScript · npm workspaces · Vitest · Cloudflare Workers/D1

```text
apps/web/             화면·Next.js 서버 API·Vercel 설정
apps/data-api/        Cloudflare Worker·D1 SQL 마이그레이션
packages/core/        대학 데이터·점수 계산·입력 검증·요청 서명
tests/                계산·인증·자료 계약·저장 통합 검증
scripts/              로컬 환경 생성·Wrangler 실행 도우미
docs/                 운영 배포 기록
```

개인 상담 초안, 수집한 입시 원문, 로컬 데이터·비밀값은 저장소에서 제외합니다. 앱에 필요한 카탈로그와 공식 출처 링크는 `packages/core/src`에 포함합니다.

## 로컬 실행

Node.js 24 권장(최소 22), npm이 필요합니다.

```sh
git clone https://github.com/siren911/hangeoreum-admissions.git
cd hangeoreum-admissions
npm ci --include=dev --workspaces --include-workspace-root
npm run setup:local
npm run db:local
```

터미널 두 개에서 각각 실행합니다.

```sh
npm run dev:api
```

```sh
npm run dev
```

웹앱은 `http://127.0.0.1:3000`, 로컬 Worker는 `http://127.0.0.1:8787`입니다. 로컬 D1에는 Cloudflare 계정 로그인이 필요하지 않습니다.

`setup:local`은 `.env.local`과 `.dev.vars`가 없을 때 무작위 비밀값을 생성합니다. 기존 설정은 덮어쓰지 않습니다. `.env.example`·`.dev.vars.example`에는 값의 양식만 들어 있습니다.

## 검증

```sh
npm test
npm run typecheck
npm run build
npm run worker:check
```

로컬 Worker 실행 후 저장 통합 검증:

```sh
npm run test:storage
```

## Vercel 배포

- 프로젝트 Root Directory: `apps/web`
- Framework: Next.js, Node.js `24.x`
- 루트 밖 소스 포함 활성화: `packages/core`와 루트 lockfile 필요
- 설치: `npm ci --include=dev --workspaces --include-workspace-root`
- 빌드: `npm run build`

설치 명령은 `apps/web/vercel.json`에 있습니다. Vercel CLI를 사용할 때는 저장소 루트에서 프로젝트 연결 후 `vercel deploy --prod`로 배포합니다. GitHub push에 따른 자동 배포는 별도 연결 전입니다.

## Cloudflare 저장 연결

`apps/data-api/wrangler.jsonc`의 환경별 D1 ID는 자리표시자입니다. 실제 DB 생성 후 ID를 입력하고 해당 환경의 마이그레이션을 적용해야 합니다. Worker에는 `SERVICE_SECRET`을 secret으로 등록합니다.

웹 서버 환경변수:

| 변수 | 용도 |
| --- | --- |
| `APP_ORIGIN` | 해당 환경의 웹앱 주소 |
| `DATA_API_URL` | 해당 환경 Worker HTTPS 주소 |
| `SERVICE_SECRET` | Worker와 공유하는 요청 서명 비밀값, 32자 이상 |
| `SESSION_SECRET` | 별도의 세션 서명 비밀값, 32자 이상 |
| `ENABLE_LOCAL_LOGIN` | 운영에서는 `false` |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth App 설정 |
| `GITHUB_ALLOWED_IDS` | 로그인을 허용할 GitHub 숫자 사용자 ID |

GitHub OAuth callback: `https://실제웹주소/api/auth/github/callback`. 로그인 범위는 `read:user`입니다. Preview와 Production은 DB·Worker·비밀값을 분리합니다. 비밀값에 `NEXT_PUBLIC_` 접두사를 사용하지 않습니다.
