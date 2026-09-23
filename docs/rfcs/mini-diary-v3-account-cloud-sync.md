# RFC: 계정 로그인 + MongoDB Atlas 클라우드 동기화

> 상태: 완료
> 관련 ADR: `docs/adr/0002-mongodb-atlas-credentials-auth.md` (`docs/adr/0001-storage-strategy.md`를 Supersede)
> 관련 이슈: [#4 계정 · 클라우드 동기화](https://github.com/joohyuna/lecture-mini-schedule/issues/4)
> 이어받는 문서: `docs/rfcs/mini-diary-v2-async-storage-prep.md`의 "나중에 MongoDB를 실제로 붙일 때 할 일" 메모

## 목표

브라우저 `localStorage`에만 있던 다이어리 데이터를 로그인 기반 MongoDB Atlas 저장소로 옮겨, 집/회사 등 여러 기기에서 같은 계정으로 로그인하면 같은 다이어리를 볼 수 있게 한다.

## 범위 (Scope)

- 이메일/비밀번호 로그인 + 공개 회원가입 (Auth.js v5 Credentials + bcryptjs, JWT 세션)
- Prisma + MongoDB Atlas로 `User` / `DiaryItem` / `DayFeedback` 저장
- `app/lib/storage.ts`의 items/feedback 4개 함수 내부를 `fetch` 호출로 교체 (시그니처 불변)
- 전체 앱을 로그인 게이트로 보호 (`proxy.ts`, Next.js 16의 `middleware→proxy` 이름 변경 반영)
- `SettingsMenu`에 로그아웃 버튼 + 저장 실패 시 최소 토스트 알림

### Non-scope
- 새 Atlas 클러스터/프로젝트 생성 — 이미 있는 `todo` 프로젝트의 클러스터를 그대로 재사용하고 DB 이름만 `mini-diary`로 분리했다.
- 기존 localStorage 데이터의 자동 1회성 마이그레이션 코드 — 이미 있는 JSON 내보내기/가져오기(`SettingsMenu`)로 충분해 새로 만들지 않았다. 배포 전 "JSON 내보내기"로 백업하고, 로그인 후 "JSON 가져오기"로 복원하면 `importJSON`이 그대로 DB에 저장한다.
- `react-hook-form` 등 폼 라이브러리 — 기존 컴포넌트(`AddItemModal`, `SettingsMenu`)처럼 `useState` 컨트롤드 폼으로 통일.
- `nickname` 등 화면에 쓰이지 않는 사용자 필드.
- 테마(`ThemeMode`)의 DB 이전 — 기기별 UI 설정이라 localStorage에 그대로 둔다.

## 접근 방식

같은 스택(Next.js 16 + Prisma + MongoDB Atlas + Auth.js v5)으로 이미 동작 중인 형제 프로젝트 `todo`(`../todo`)의 검증된 패턴을 그대로 재사용했다 — 새로 설계하지 않았다.

- **저장 방식은 "전체 로드 / 전체 교체" 유지.** `loadItems()`는 로그인한 사용자의 전체 항목을, `saveItems(items)`는 전체를 교체 저장한다(feedback도 동일). 이 덕분에 `app/lib/useDiary.ts`는 한 줄도 바뀌지 않았다 — 이미 `storage.ts`의 4개 async 함수만 호출하는 구조였기 때문. `PUT` 라우트는 Prisma `$transaction([deleteMany, createMany])`로 구현했다. **MongoDB Atlas M0는 기본적으로 3-노드 레플리카셋이라 멀티 도큐먼트 트랜잭션이 바로 동작한다** — 로컬 standalone MongoDB로 테스트하면 이 트랜잭션이 실패하므로 반드시 Atlas를 대상으로 검증해야 한다.
- **id는 계속 클라이언트가 생성한 `crypto.randomUUID()` 문자열**을 그대로 쓴다. Prisma 스키마에서 `DiaryItem`/`DayFeedback`의 `id` 필드는 `@db.ObjectId`를 붙이지 않아 임의 문자열도 `_id`로 허용한다. `User.id`만 서버 생성 ObjectId(클라이언트가 참조하지 않음).
- **`DayFeedback`은 클라이언트에 별도 id가 없다**(날짜를 키로 쓰는 `Record<string, DayFeedback>`). API 라우트가 저장 시 `_id = "${userId}:${date}"`를 서버에서 조립한다 — `useDiary.ts`는 이 사실을 몰라도 된다.
- **`date`/`createdAt`/`updatedAt`은 타입을 바꾸지 않았다.** `date`는 계속 `"YYYY-MM-DD"` 문자열(Prisma `DateTime`이 아님, 타임존 버그 회피), `createdAt`/`updatedAt`은 계속 epoch ms 숫자(Prisma `Float`, `DateTime`이 아님)로 저장해 기존 정렬 로직을 그대로 유지한다.
- **`proxy.ts`의 matcher는 `/api/*`를 반드시 제외**한다. API 라우트를 matcher에 포함시키면 미인증 요청이 307로 `/login` HTML을 반환하고, `fetch()`가 그 리다이렉트를 따라가 `res.ok`가 true인 채로 `res.json()`이 깨지는 혼란스러운 실패가 난다 — 각 API 라우트가 `auth()`로 자체 401 처리를 한다.
- **저장 실패는 완전히 무시하지 않는다.** `useDiary.ts`는 `void saveItems(...)` fire-and-forget 패턴이라 그대로 두되(변경 범위 밖), `storage.ts`가 실패 시 `window` `CustomEvent("mini-diary:sync-error")`를 던지고, `SettingsMenu`가 기존 토스트(`msg` state)로 "저장 실패 · 다시 시도해 주세요"를 보여준다. 새 UI 컴포넌트를 만들지 않고 이미 있는 토스트를 재사용했다.
- **pnpm 10+의 postinstall 빌드 스크립트 차단 대응**으로 `pnpm-workspace.yaml`에 `allowBuilds`(`@prisma/client`, `@prisma/engines`, `prisma`)를 추가했다 — 없으면 `prisma generate`가 조용히 안 돌아 타입 에러로 이어질 수 있다.

## 작업 단계

- [x] `prisma/schema.prisma` 작성 — `User` / `DiaryItem` / `DayFeedback`
- [x] `package.json`에 의존성 추가(`@prisma/client`, `prisma`, `next-auth`, `bcryptjs`, `zod`) + `build`/`postinstall` 스크립트
- [x] `pnpm-workspace.yaml`(`allowBuilds`), `.env.example`, `.gitignore`(`!.env.example` 예외 추가)
- [x] `app/lib/{prisma,auth.config,auth,schemas}.ts`, `app/lib/next-auth.d.ts`(세션 타입 보강)
- [x] `proxy.ts`(루트) — 전체 앱 보호, `/api/*` 제외
- [x] `app/api/auth/[...nextauth]/route.ts`, `app/api/register/route.ts`
- [x] `app/api/diary/items/route.ts`, `app/api/diary/feedback/route.ts` — GET/PUT 전체 로드·교체
- [x] `app/lib/storage.ts`의 items/feedback 4개 함수를 `fetch` 호출로 교체 (theme/backup 함수는 그대로)
- [x] `app/login/page.tsx`, `app/register/page.tsx`, `app/components/AuthForm.tsx`
- [x] `app/components/SettingsMenu.tsx` — 로그아웃 버튼 + `mini-diary:sync-error` 토스트
- [x] `pnpm build` 통과 확인
- [x] `pnpm exec prisma db push`로 Atlas(`mini-diary` DB) 연결 확인
- [x] curl 스모크 테스트: 회원가입 → 중복 이메일 409 → 무인증 401 → 로그인(credentials 콜백) → 세션 확인 → items/feedback PUT→GET 라운드트립(한글 UTF-8 포함) → `/` 무인증 시 `/login` 307 리다이렉트 → `/login`·`/register`는 무인증에도 200
- [x] 테스트 계정/데이터 정리
- [x] 문서화(RFC 본 문서, ADR-0002, ARCHITECTURE.md, PRD)
- [ ] 브라우저 수동 확인(회원가입→로그인→항목 추가→새로고침→JSON 내보내기/가져오기→로그아웃) — 사용자 직접 확인 예정
- [ ] GitHub 이슈 #4에 완료 코멘트 남기고 닫기

## 변경 파일 목록

**신규**: `prisma/schema.prisma`, `proxy.ts`, `pnpm-workspace.yaml`, `.env.example`, `app/lib/prisma.ts`, `app/lib/auth.config.ts`, `app/lib/auth.ts`, `app/lib/schemas.ts`, `app/lib/next-auth.d.ts`, `app/api/auth/[...nextauth]/route.ts`, `app/api/register/route.ts`, `app/api/diary/items/route.ts`, `app/api/diary/feedback/route.ts`, `app/login/page.tsx`, `app/register/page.tsx`, `app/components/AuthForm.tsx`

**수정**: `app/lib/storage.ts`, `app/components/SettingsMenu.tsx`, `package.json`, `.gitignore`

**변경 없음(의도적으로)**: `app/page.tsx`, `app/lib/useDiary.ts`, `app/layout.tsx`, `app/components/Header.tsx`

## 리스크

1. pnpm 10+가 `postinstall`을 차단할 수 있음 — `pnpm-workspace.yaml`의 `allowBuilds`로 해결.
2. 로컬 `.env`의 `DATABASE_URL`은 `todo`와 클러스터는 같지만 DB 이름이 `mini-diary`여야 함.
3. 로컬 standalone MongoDB로 테스트 시 `$transaction`이 실패함(레플리카셋 아님) — 반드시 Atlas로 검증.
4. `AUTH_SECRET`은 `todo`와 공유하지 않고 새로 생성함(재사용은 나쁜 습관).
5. 기존 localStorage 데이터는 자동 이전되지 않음 — 배포 전 JSON 내보내기, 로그인 후 가져오기가 필수 수동 단계.

## 검증 방법

- `pnpm build` 타입체크·빌드 통과
- `pnpm exec prisma db push`로 Atlas 연결·스키마 반영 확인
- curl로 register/login/session/items/feedback API 라운드트립 확인 (완료, 위 작업 단계 참고)
- 브라우저에서 회원가입 → 로그인 → 오늘 카드에 항목 추가 → 새로고침 후 유지 확인 → JSON 내보내기/가져오기로 복원 확인 → `SettingsMenu`에서 로그아웃 → `/` 접근 시 `/login`으로 리다이렉트 확인
