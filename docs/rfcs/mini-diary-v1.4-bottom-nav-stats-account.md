# RFC: 하단 탭 바 + 통계 · 개인정보 관리 페이지

> 상태: 완료

## 목표

미니다이어리를 사실상 한 페이지짜리 앱에서, 홈(오늘 하루)·통계·개인정보 관리를 하단 탭으로 오갈 수 있는 구조로 확장한다. 메인 다이어리 화면은 PRD의 "한 화면에서 오늘 상태 파악" 원칙을 계속 지키고, 성격이 다른 기능만 별도 탭으로 분리한다.

## 범위 (Scope)

- 하단 탭 바(🏠 홈 · 📊 통계 · 👤 계정) — `/`, `/stats`, `/account`에서만 보임
- 통계 페이지: 이번 달 카테고리별 완료율(Longterm/Do Now/Extra) + Don't 지킴·어김 집계 + 현재 연속 지킴일수(스트릭). 새 API 없이 기존 `useDiary()`의 클라이언트 데이터로 계산.
- 개인정보 관리 페이지: 닉네임 변경, 비밀번호 변경, JSON 내보내기/가져오기(기존 헤더 ⚙️에서 이전), 로그아웃(기존 헤더 ⚙️에서 이전)
- 헤더 `⚙️` `SettingsMenu` 드롭다운 제거 — 헤더는 📅 날짜 선택 + 테마 토글만 남음
- `useDiary()` 상태를 세 페이지가 공유하도록 React Context(`DiaryProvider`/`useDiaryContext`)로 승격

### Non-scope
- 회원탈퇴(계정 삭제) — 되돌릴 수 없는 기능이라 이번엔 만들지 않는다.
- 테마 토글을 통계/계정 페이지에도 노출 — 이번엔 홈 페이지에만 유지.
- 통계 항목 확장(주간/연간 뷰, 그래프, 카테고리별 상세 이력 등) — 이번엔 "이번 달 요약" 하나만.

## 접근 방식

- **페이지 구조**: Next.js route group `app/(app)/`으로 `/`(홈)·`/stats`·`/account`를 묶고, 공유 `layout.tsx`가 `DiaryProvider` + `{children}` + `BottomNav` + `SyncErrorToast`를 감싼다. `/login`·`/register`는 group 밖이라 탭 바가 안 뜬다. route group은 URL에 영향이 없어 `proxy.ts`의 matcher는 수정 불필요.
- **상태 공유**: `app/lib/DiaryContext.tsx`가 `useDiary()`를 한 번만 호출해 Context로 내려준다. 탭을 전환해도 `/api/diary/*`를 다시 불러오지 않는다. `useTheme()`은 테마 토글이 홈에만 있어 Context로 승격하지 않고 홈 페이지 안에서만 호출.
- **하단 탭 바**: `usePathname()`으로 활성 탭 표시, 이모지 아이콘(기존 앱 전체 컨벤션, 아이콘 라이브러리 추가 안 함), `Sheet.tsx`가 쓰던 `env(safe-area-inset-bottom)` 패턴 재사용.
- **통계 계산**: 완료율은 `done / 전체`, Don't는 지킴/어김 개수. 스트릭은 "가장 최근에 어긴 날짜 다음날부터 오늘까지"(어긴 적이 없으면 Don't 최초 기록일부터, 그날 포함)로 계산 — `app/lib/date.ts`에 추가한 `daysBetween` 유틸 사용.
- **개인정보 관리**: `/account`는 서버 컴포넌트로 `auth()`에서 이메일/닉네임 초기값을 읽어 클라이언트 폼(`AccountForm`)에 넘긴다 — `useSession()`/`SessionProvider` 도입 없이 기존 `auth()` 헬퍼만 재사용. 닉네임/비밀번호 변경은 각각 `PATCH /api/account/nickname`, `PATCH /api/account/password`(현재 비밀번호 `bcrypt.compare` 확인 후 교체). 닉네임 변경 후 세션(JWT)의 `name`은 다음 로그인 전까지 자동 갱신되지 않아, 화면엔 로컬 상태로 즉시 반영하고 안내 문구를 덧붙인다.
- **저장 실패 알림**: 기존 `SettingsMenu`에 있던 `mini-diary:sync-error` 리스너를 `app/(app)/layout.tsx`의 `SyncErrorToast`로 옮겨, 어느 탭에서 저장이 실패해도(홈에서 항목 저장 실패 포함) 알림이 뜨게 한다.

## 작업 단계

- [x] `app/lib/schemas.ts`에 `updateNicknameSchema`/`updatePasswordSchema` 추가(`nicknameSchema`/`passwordSchema` 공통 규칙으로 `registerSchema`와 공유)
- [x] `app/lib/DiaryContext.tsx` — `DiaryProvider`/`useDiaryContext`
- [x] `app/lib/date.ts`에 `daysBetween` 추가
- [x] `app/components/BottomNav.tsx`, `app/components/SyncErrorToast.tsx`
- [x] `app/page.tsx` → `app/(app)/page.tsx` 이동, `useDiary()` → `useDiaryContext()`로 전환, `Header`에 넘기던 `onExport`/`onImport` 제거
- [x] `app/(app)/layout.tsx` — `DiaryProvider` + `BottomNav` + `SyncErrorToast`
- [x] `app/(app)/stats/page.tsx` — 완료율/Don't 집계/스트릭
- [x] `app/(app)/account/page.tsx`(서버 컴포넌트) + `app/components/AccountForm.tsx`(닉네임/비밀번호 변경 + JSON export/import + 로그아웃)
- [x] `app/api/account/nickname/route.ts`, `app/api/account/password/route.ts`
- [x] `app/components/Header.tsx`에서 `SettingsMenu` 제거, `app/components/SettingsMenu.tsx` 삭제
- [x] `pnpm build` 통과 확인(스테일 `.next` 캐시로 인한 `app/page.js` 참조 에러 → `.next` 삭제 후 재빌드로 해결)
- [x] curl 스모크 테스트: 회원가입 → 로그인 → `/`·`/stats`·`/account` 200 확인 → 계정 페이지 HTML에 이메일 노출 확인 → 닉네임 변경 200 → 잘못된 현재 비밀번호로 비밀번호 변경 시도 400(`WRONG_PASSWORD`) → 올바른 현재 비밀번호로 변경 200 → 무인증 `/stats`·`/account` 접근 시 `/login` 307 리다이렉트 확인 → 새 비밀번호로 재로그인 성공 + 세션에 닉네임(`name`) 반영 확인
- [x] 테스트 계정/데이터 정리
- [x] 문서화(RFC 본 문서, PRD, ARCHITECTURE.md)
- [ ] 브라우저 수동 확인(탭 전환, 통계 숫자, 계정 폼) — 사용자 직접 확인 예정

## 변경 파일 목록

**신규**: `app/(app)/layout.tsx`, `app/(app)/page.tsx`(이동), `app/(app)/stats/page.tsx`, `app/(app)/account/page.tsx`, `app/components/BottomNav.tsx`, `app/components/AccountForm.tsx`, `app/components/SyncErrorToast.tsx`, `app/lib/DiaryContext.tsx`, `app/api/account/nickname/route.ts`, `app/api/account/password/route.ts`

**수정**: `app/components/Header.tsx`(SettingsMenu 제거), `app/lib/schemas.ts`(닉네임/비밀번호 변경 스키마), `app/lib/date.ts`(`daysBetween` 추가)

**삭제**: `app/page.tsx`(이동), `app/components/SettingsMenu.tsx`(AccountForm으로 흡수)

**변경 없음**: `proxy.ts`, `app/lib/useDiary.ts`, `app/lib/storage.ts`, `app/layout.tsx`(루트), `app/login/`, `app/register/`

## 리스크

- `app/page.tsx` → `app/(app)/page.tsx` 이동으로 상대 import 경로가 한 단계 얕아짐(`./components/X` → `../components/X`) — 빌드 타입체크로 검증됨.
- 닉네임 변경 후 세션의 `name`이 즉시 안 바뀌는 문제 — 화면 로컬 상태로 즉시 반영, 다음 로그인 시 세션도 갱신됨을 UI 문구로 안내.
- 스테일 `.next` 타입 캐시가 삭제된 `app/page.tsx`를 계속 참조해 `tsc --noEmit`이 실패하는 문제 발생 — `.next` 삭제 후 재빌드로 해결(향후 큰 파일 이동 시 재발 가능, 같은 방법으로 대응).

## 검증 방법

- `pnpm build` 타입체크·빌드 통과 (완료)
- curl로 register/login/nickname/password/route-protection 라운드트립 확인 (완료, 작업 단계 참고)
- 브라우저: 로그인 → 하단 탭 바로 홈/통계/계정 전환(탭 전환 시 재요청 없이 즉시 전환) → 통계 탭 숫자 확인 → 계정 탭에서 닉네임/비밀번호 변경, JSON 내보내기/가져오기 → 로그아웃 → `/login` 리다이렉트 확인 → `/login`·`/register`에는 탭 바 없음 확인
