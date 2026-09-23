# ARCHITECTURE.md — 미니다이어리

> 마지막 갱신: 2026-09-23 (v1 + v1.1 날짜 이동·달력 + v1.2 미래 날짜 계획 + v1.3 계정·클라우드 동기화 + v1.4 하단 탭·통계·개인정보 관리 반영)
> 이 문서는 "지금 구조가 어떤가"의 스냅샷이다. 왜 이렇게 결정했는지는 `docs/adr/`, 제품 요구사항은 `docs/prd/mini-diary.md` 참고.

## 1. 개요

- **목적**: 한 화면에서 오늘 상태를 바로 확인하는 개인용 가벼운 다이어리. 로그인한 계정별로 데이터가 저장되어 여러 기기에서 같은 다이어리를 볼 수 있다. 홈(오늘 하루 보기)·통계·개인정보 관리를 하단 탭으로 오간다.
- **기술 스택**: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + `tailwind-merge` + `clsx` + Prisma 6.19.3 + MongoDB Atlas + Auth.js v5(Credentials + JWT 세션) + `bcryptjs` + `zod`.
- **주요 진입점**: `app/(app)/page.tsx` (홈, 클라이언트 컴포넌트), `app/(app)/layout.tsx` (`DiaryProvider` + 하단 탭 바), `proxy.ts` (로그인 게이트), `app/lib/auth.ts` / `app/lib/prisma.ts` (인증·DB 핵심 설정 싱글턴).
- **실행**: `.env.example`을 `.env`로 복사해 `DATABASE_URL`/`AUTH_SECRET`을 채운 뒤 `pnpm dev` → `http://localhost:3001` (`dev`/`build`/`start` 모두 포트 3001 고정 — 기존 계산기 프로젝트와 포트 충돌 회피).
- 상태관리·날짜·UUID 전용 라이브러리는 쓰지 않는다(`crypto.randomUUID()`, 네이티브 `Date`). 로그인/가입 폼도 `react-hook-form` 없이 기존 컴포넌트와 같은 `useState` 컨트롤드 방식.

### 의존성

- `tailwind-merge` = 충돌하는 Tailwind 클래스 정리, `clsx` = 조건에 따라 클래스 켜고 끄기. 이 둘을 `cn()` 헬퍼로 묶는다.

```ts
// app/lib/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
```

- `prisma` + `@prisma/client` **6.19.3에 고정** — 7.x는 아직 MongoDB provider를 지원하지 않는다([[0002-mongodb-atlas-credentials-auth]]).
- `next-auth` 5.0.0-beta.32(Credentials + JWT), `bcryptjs`(비밀번호 해시), `zod`(클라이언트 폼·API 공용 검증 스키마, `app/lib/schemas.ts`).
- `pnpm-workspace.yaml`의 `allowBuilds`로 `@prisma/client`/`@prisma/engines`/`prisma`의 postinstall 빌드 스크립트를 허용(pnpm 10+ 기본 차단 대응) — 없으면 `prisma generate`가 조용히 안 돈다.

| 구분 | 패키지 |
|---|---|
| dependencies | `next` `react` `react-dom` `tailwind-merge` `clsx` `@prisma/client` `next-auth` `bcryptjs` `zod` |
| devDependencies | `typescript` `@types/node` `@types/react` `@types/react-dom` `tailwindcss` `@tailwindcss/postcss` `postcss` `prisma` |

## 2. 데이터 모델

```ts
type Category = 'longterm' | 'donow' | 'dont' | 'extra';

// longterm / donow / extra : 'open' ↔ 'done'
// dont                     : 'open'(지킴) ↔ 'broken'(어김)
type ItemStatus = 'open' | 'done' | 'broken';

interface DiaryItem {
  id: string;              // crypto.randomUUID() — MongoDB에서도 그대로 _id로 사용(ObjectId 아님)
  date: string;            // 'YYYY-MM-DD' — 이 항목이 속한 날짜
  category: Category;
  text: string;            // 1~80자
  status: ItemStatus;
  createdAt: number;
  updatedAt: number;
}

interface DayFeedback {
  date: string;            // 'YYYY-MM-DD'
  text: string;
  updatedAt: number;
}

type ThemeMode = 'light' | 'dark' | 'system';

// v1.1: MonthCalendar 점 표시용 날짜별 요약 (useDiary.dayMeta)
type DayMeta = Record<string, { total: number; open: number; broken: number; feedback: boolean }>;
```

### MongoDB 컬렉션 (Prisma, `prisma/schema.prisma`)

| 컬렉션 | 필드 | 비고 |
|---|---|---|
| `User` | `id`(ObjectId) `email`(unique) `passwordHash` `items[]` `feedback[]` `createdAt` `updatedAt` | 서버 생성 id — 클라이언트가 참조하지 않음 |
| `DiaryItem` | `id`(클라이언트 UUID 문자열, `_id`) `userId`(ObjectId) `date` `category` `text` `status` `createdAt`(Float) `updatedAt`(Float) | `date`는 `DateTime`이 아니라 문자열(타임존 버그 회피), `createdAt`/`updatedAt`도 epoch ms 숫자 그대로(정렬 로직 유지). `@@index([userId, date])` |
| `DayFeedback` | `id`(서버가 `${userId}:${date}`로 조립, `_id`) `userId`(ObjectId) `date` `text` `updatedAt`(Float) | 클라이언트엔 별도 id 없음(`Record<string, DayFeedback>`) — API 라우트가 id를 조립. `@@unique([userId, date])` |

- 이유·대안 비교는 [[0002-mongodb-atlas-credentials-auth]] 참고. `docs/adr/0001-storage-strategy.md`(localStorage 채택)는 이 ADR로 대체됨(append-only 원칙에 따라 0001 자체는 수정하지 않음).
- `todo` 프로젝트와 같은 Atlas 클러스터를 재사용, `DATABASE_URL`의 DB 이름만 `mini-diary`로 분리.
- 저장 방식은 "전체 로드 / 전체 교체" — `GET`은 사용자의 전체 items/feedback을, `PUT`은 `$transaction([deleteMany, createMany])`로 전체를 교체한다. Atlas M0는 3-노드 레플리카셋이라 이 멀티 도큐먼트 트랜잭션이 별도 설정 없이 동작한다(로컬 standalone MongoDB는 안 됨).

### localStorage 키 (테마만 남음)

| 키 | 값 |
|---|---|
| `mini-diary:v1:theme` | `ThemeMode` |

- items/feedback은 v1.3(계정·클라우드 동기화)부터 MongoDB로 이전됐다. 테마는 기기별 UI 설정이라 계속 localStorage에 둔다.
- 모든 저장소 접근은 `app/lib/storage.ts` 한 곳에 모은다.
- `storage.ts`의 모든 함수는 `Promise`를 반환한다. items/feedback 4개 함수(`loadItems`/`saveItems`/`loadFeedback`/`saveFeedback`)는 내부가 `/api/diary/*`로의 `fetch` 호출이고, `loadTheme`/`saveTheme`는 여전히 localStorage 동기 구현을 Promise로 감싼 것뿐이다. 이 async 인터페이스 덕분에 MongoDB 전환 시 호출부(`useDiary.ts`)를 한 줄도 안 건드렸다 — 자세한 배경은 `docs/rfcs/mini-diary-v2-async-storage-prep.md`(설계) / `docs/rfcs/mini-diary-v3-account-cloud-sync.md`(실제 구현) 참고. 첫 페인트 전 테마만 예외로 `app/layout.tsx`에서 `localStorage`를 동기 직접 접근한다(FOUC 방지).
- items/feedback 저장 실패 시 `storage.ts`가 `window` `CustomEvent("mini-diary:sync-error")`를 던지고, `app/(app)/layout.tsx`에 항상 떠 있는 `SyncErrorToast`가 알린다(`useDiary.ts`의 `void saveItems(...)` fire-and-forget 패턴은 그대로라 완전한 실패 처리는 아니고, 최소한의 알림만). 탭이 바뀌어도 하나의 `DiaryProvider`가 살아있으므로 어느 탭에서든 저장이 실패하면 이 토스트가 뜬다.

### 다크 모드 구현

- Tailwind `dark:` 클래스 전략. 루트 `<html>`에 `dark` 클래스를 토글한다.
- Tailwind v4: `globals.css`에 `@custom-variant dark (&:where(.dark, .dark *));`
- `system` 모드일 때는 `prefers-color-scheme`으로 `dark` 클래스를 자동 부여한다.

## 3. 컴포넌트 / 파일 구조

- `proxy.ts`(루트) — 로그인 게이트. Next.js 16에서 `middleware.ts`가 `proxy.ts`로 이름이 바뀌었다. `/login`·`/register`·`/api/*`·정적 자산을 제외한 모든 경로를 보호한다(루트 `/`, `/stats`, `/account` 포함). route group(`(app)`)은 URL에 영향이 없으므로 이 matcher는 그대로 유지된다.
- `app/login/page.tsx`, `app/register/page.tsx` — 공개 로그인/회원가입 페이지, 둘 다 `AuthForm` 재사용. `(app)` route group 밖에 있어 하단 탭 바가 안 뜬다.
  - `AuthForm` — 로그인/가입 공용 폼(`useState` 컨트롤드, `zod` 스키마로 직접 검증, 폼 라이브러리 없음)
- `app/(app)/`(route group, URL엔 안 남음) — 로그인 후 화면. `layout.tsx`가 `DiaryProvider`(→`useDiary()`를 한 번만 호출해 세 탭이 공유) + `{children}` + `BottomNav` + `SyncErrorToast`로 감싼다.
  - `app/(app)/page.tsx`("/") — 홈. 페이지 조립, 자정 롤오버 처리, `useDiaryContext()` + `useTheme()`
    - `Header` — 날짜, 이전/다음 이동, `DiaryDatePopupTrigger`, `ThemeToggle`(⚙️ 설정 드롭다운은 v1.4에서 제거, 개인정보 관리 탭으로 이전)
    - `AddItemModal` — 내용 입력 + 카테고리 세그먼트 (`Sheet` 기반)
    - `DiaryDatePopup` — 월 달력 기반 날짜 선택 (`Sheet` 기반, `align="start"`)
      - `MonthCalendar` — 6주×7일 격자, 기록/어김/피드백 점 표시
    - `Board`
      - `QuadrantCard` ×4 — props: `title`, `category`, `items`, `readOnly`, 요약
        - `ItemRow` — 상태 토글, 텍스트(인라인 편집), 수정/삭제
        - `CarryForwardPrompt` — 비어 있을 때 [지난 항목 불러오기] / [직접 적기]
        - `CarryForwardPicker` — "지난 항목 불러오기" 클릭 시 뜨는 선택 팝업(`Sheet` 기반), 전체 선택 기본값에서 원하는 항목만 체크
        - `CardDetailModal` — "더보기" 팝업, 카드의 전체 항목(체크/수정/삭제 포함) (`Sheet` 기반)
    - `DailyFeedback` — textarea + 메모 저장 버튼(읽기 전용 지원)
  - `app/(app)/stats/page.tsx`("/stats") — 통계. `useDiaryContext()`의 `items`로 이번 달 카테고리별 완료율 + Don't 지킴/어김 + 연속 지킴일수(스트릭)를 클라이언트에서 계산(새 API 없음).
  - `app/(app)/account/page.tsx`("/account") — 개인정보 관리. 서버 컴포넌트로 `auth()`에서 이메일/닉네임 초기값을 읽어 `AccountForm`에 넘긴다.
    - `AccountForm` — 닉네임 변경, 비밀번호 변경, JSON 내보내기/가져오기, 로그아웃을 모은 클라이언트 폼(옛 `SettingsMenu`의 내용을 흡수)
  - `BottomNav` — 🏠 홈 · 📊 통계 · 👤 계정 3탭, `usePathname()`으로 활성 탭 표시, `fixed bottom-0` + `env(safe-area-inset-bottom)`
  - `SyncErrorToast` — `mini-diary:sync-error` 이벤트를 전역에서 듣고 토스트로 알림
- `Sheet` — 네 팝업(`AddItemModal`/`DiaryDatePopup`/`CardDetailModal`/`CarryForwardPicker`)이 공유하는 래퍼. 모바일은 하단 바텀시트, `md:`부터는 중앙(또는 상단) 모달. 배경 클릭·Esc 닫기, `document.body`로의 포털 렌더링을 여기서 전담.

| 역할 | 파일 |
|---|---|
| 타입·상수(카테고리, 10개 제한, 80자) | `app/lib/types.ts` |
| `cn()` 헬퍼 (clsx + tailwind-merge) | `app/lib/cn.ts` |
| 날짜 유틸(`YYYY-MM-DD`, 한국어 포맷, `addDays`, `isFuture`, `monthMatrix`, `monthLabel`, `WEEKDAYS`, `daysBetween`(스트릭 계산용)) | `app/lib/date.ts` |
| items/feedback은 `/api/diary/*` fetch, 테마는 localStorage, JSON 백업 파싱 | `app/lib/storage.ts` |
| 다이어리 상태 훅(항목 CRUD, 토글, carry-forward, 피드백, export/import, `dayMeta`) | `app/lib/useDiary.ts` |
| `useDiary()`를 세 탭(홈/통계/계정)이 공유하도록 감싸는 Context | `app/lib/DiaryContext.tsx` |
| 테마 훅(system→light→dark, OS 설정 반영) | `app/lib/useTheme.ts` |
| 가로 스와이프 제스처 훅 | `app/lib/useSwipe.ts` |
| 날짜 유틸에 `daysBetween`(스트릭 계산용) 추가 | `app/lib/date.ts` |
| Prisma Client 싱글턴(HMR 커넥션 캐싱) | `app/lib/prisma.ts` |
| Auth.js Credentials 설정(provider, JWT/session 콜백) | `app/lib/auth.ts` |
| Edge-safe 인증 설정(`proxy.ts`가 참조, `PUBLIC_PATHS` 화이트리스트) | `app/lib/auth.config.ts` |
| zod 스키마(로그인/가입, 닉네임/비밀번호 변경, items/feedback payload 검증) | `app/lib/schemas.ts` |
| next-auth 세션 타입 보강(`session.user.id`) | `app/lib/next-auth.d.ts` |
| NextAuth 라우트 핸들러 | `app/api/auth/[...nextauth]/route.ts` |
| 회원가입 API | `app/api/register/route.ts` |
| 항목 전체 로드/교체 API | `app/api/diary/items/route.ts` |
| 피드백 전체 로드/교체 API | `app/api/diary/feedback/route.ts` |
| 닉네임 변경 API | `app/api/account/nickname/route.ts` |
| 비밀번호 변경 API(현재 비밀번호 확인 포함) | `app/api/account/password/route.ts` |
| 첫 페인트 전 테마 적용(깜빡임 방지) | `app/layout.tsx` |
| 하단 탭 바(🏠 홈 · 📊 통계 · 👤 계정) | `app/components/BottomNav.tsx` |
| 저장 실패 전역 토스트(`mini-diary:sync-error` 리스너) | `app/components/SyncErrorToast.tsx` |
| 닉네임/비밀번호 변경 + JSON 내보내기/가져오기 + 로그아웃 폼 | `app/components/AccountForm.tsx` |
| 헤더(1행: 앱 이름 + 📅/테마, 2행: 날짜 이동+날짜 텍스트) | `app/components/Header.tsx` |
| 테마 토글 버튼 | `app/components/ThemeToggle.tsx` |
| 4분면 배치(항상 2열 그리드, 데스크탑·모바일 동일) | `app/components/Board.tsx` |
| 카드(제목, 요약, 10개 제한, 최신 5개/모바일 1개 표시, 이어가기 프롬프트) | `app/components/QuadrantCard.tsx` |
| "더보기" 팝업(카드 전체 항목) | `app/components/CardDetailModal.tsx` |
| "지난 항목 불러오기" 선택 팝업 | `app/components/CarryForwardPicker.tsx` |
| 항목 행(체크박스 / Don't 지킴·어김 토글, 인라인 수정, 삭제) | `app/components/ItemRow.tsx` |
| 입력 모달(카테고리 세그먼트 + 내용) | `app/components/AddItemModal.tsx` |
| 날짜 선택 팝업(월 달력) | `app/components/DiaryDatePopup.tsx` |
| 월 달력 격자 | `app/components/MonthCalendar.tsx` |
| 하루의 피드백 메모 | `app/components/DailyFeedback.tsx` |
| 팝업 공통 래퍼(바텀시트/모달, 배경·Esc 닫기, 포털) | `app/components/Sheet.tsx` |

## 4. 구현상 확정된 세부 규칙

- 테마 아이콘: system `🖥️` / light `☀️` / dark `🌙`.
- 과거 날짜: 헤더에 `지난 기록 · 읽기 전용` 배지, 카드 추가 버튼·상태 토글·수정/삭제 모두 비활성(`readOnly`).
- 미래 날짜(v1.2): 헤더에 `예정 · 계획 모드` 배지. 추가/수정/삭제는 되지만(`readOnly=false`) 상태 토글(완료 체크/어김)만 잠금(`ItemRow`의 `statusLocked` prop, `readOnly`와 별개). `page.tsx`의 `readOnly`는 "과거만", `isFuture`는 별도 플래그로 관리 — 하나의 불리언으로 합치지 않는다. `DailyFeedback`은 이 둘과 무관하게 "오늘이 아니면" 읽기 전용(`feedbackReadOnly = selectedDate !== today`, 회고는 당일에만).
- 헤더에는 전역 항목 추가 버튼이 없다(중복이라 제거). 항목 추가는 항상 각 `QuadrantCard`의 "+ 추가"로 시작하고, 그 카드의 카테고리가 `AddItemModal`에 기본 선택된다.
- carry-forward 대상: `Longterm`, `Don't` 만(`CARRYABLE`). 기준 날짜 = 해당 카테고리에 항목이 있는, 현재 보고 있는 날짜보다 이전인 가장 최근 날짜(`latestPriorDate`) — 오늘·미래 날짜 모두에서 동작. "지난 항목 불러오기"는 전부 자동 복사하지 않고 `CarryForwardPicker`로 어떤 항목을 가져올지 고르게 한다(기본 전체 선택, 카드 여유 개수만큼만 선택 가능). `useDiary.carryForward(fromDate, targetDate, category, ids)`가 `ids`로 받은 항목만 복제한다.
- 10개 초과 시: 입력 모달에서 해당 카테고리 버튼 비활성 + 안내, 카드 하단 추가 버튼도 `카드당 최대 10개`로 비활성.
- 피드백: `key={selectedDate}` 로 날짜 전환 시 재마운트, `메모` 버튼 클릭 시 저장 + `저장됨` 2초 표시.
- 날짜 이동: 스와이프는 세로 스크롤보다 가로 이동이 클 때만 인식, 방향키는 입력 중/팝업 열림 시 비활성. 미래 날짜 제한은 v1.2에서 없앴다(`goRelative`, `MonthCalendar`).
- 날짜 전환 시 `day-enter` 페이드, `prefers-reduced-motion` 존중.
- 카드 표시: 데스크탑은 `CARD_VISIBLE_LIMIT`(5)개, 모바일은 `CARD_MOBILE_VISIBLE_LIMIT`(1)개까지만 카드에 인라인 표시(최신순, `createdAt` 내림차순). JS 값 자체는 5개짜리(`visibleItems`) 하나만 계산하고, 모바일에서 추가로 숨길 항목(`idx >= CARD_MOBILE_VISIBLE_LIMIT`)은 `ItemRow`의 `hiddenOnMobile` prop으로 `hidden md:flex` 처리 — breakpoint별로 다른 개수를 보여주면서도 matchMedia 없이 순수 CSS로 처리. "더보기" 버튼은 숫자 없이 라벨 고정(카드 헤더에 이미 `N/10` 개수가 있어 중복이라 뺌). 항목이 1개 이상이면 항상 "더보기" 버튼을 두고 `CardDetailModal`로 전체 목록을 보여준다(팝업 안에서도 체크/수정/삭제 가능). `Board`는 데스크탑·모바일 구분 없이 항상 2열 그리드(`flex-row flex-wrap`), 좁은 화면에서 한글이 음절 단위로 끊기지 않도록 카드 제목/항목 텍스트에 `break-keep` 적용.
- 모바일 `ItemRow`: 1줄(체크박스+텍스트) / 2줄(수정·삭제, 오른쪽 정렬)로 세로 스택, `md:`부터는 기존처럼 한 줄. 단, `CardDetailModal`(팝업) 안에서는 `wide` prop으로 모바일에서도 항상 한 줄 — 카드보다 팝업 폭이 넉넉해서 굳이 두 줄로 쪼갤 필요가 없음. 수정/삭제 아이콘은 모바일에서 항상 노출(호버가 없어서), 데스크탑은 그대로 호버 시에만 노출. 삭제 아이콘은 팝업 닫기(✕)와 헷갈리지 않도록 쓰레기통 모양. "더보기"와 "+ 추가"(항목 추가 버튼 라벨을 축약)는 한 줄에 나란한 버튼 쌍으로 표시(모바일·데스크탑 공통). `CardDetailModal` 헤더에는 카드에서 숨긴 부제(예: "장기 목표")를 항상 표시.
- `AGENTS.md`는 `next dev`가 자동 생성/재생성하는 보일러플레이트라 `.gitignore` 처리, 커밋하지 않는다. `CLAUDE.md`는 프로젝트 문서 규칙을 직접 작성해 넣은 파일이라 추적·커밋 대상이다.
- 팝업(`Sheet`): 모바일은 하단 바텀시트(슬라이드업, 위쪽 모서리만 둥글게, 화면 가장자리까지 붙음), `md:`부터는 기존처럼 중앙(`DiaryDatePopup`만 상단) 모달. 드래그로 끌어내려 닫는 제스처는 넣지 않음(가벼운 버전). `document.body`에 React Portal로 렌더링한다 — `day-enter`처럼 `transform`이 걸린 조상 안에서 `position: fixed`를 쓰면 그 조상이 컨테이닝 블록이 되어버려 뷰포트 기준으로 고정되지 않는 CSS 문제가 있었음(배경 클릭으로 안 닫히는 버그로 발견). 세 팝업 모두 이 컴포넌트를 통해서만 열고 닫는다.

## 5. 현재 미구현 / 다음 후보

- Do Now / Extra 이어가기(미완료 항목 다음날로).
- 드래그 앤 드롭 재정렬·카테고리 이동.
- 리마인더/알림.
- 태그, 우선순위, 마감일.
- 회원탈퇴(계정 삭제) — 되돌릴 수 없는 기능이라 v1.4에서 의도적으로 제외.
- (v1.3에서 계정·클라우드 동기화, v1.4에서 통계·스트릭·하단 탭·개인정보 관리는 구현 완료)

## 6. 검증 상태

- 빌드/타입체크 통과 확인됨 (v1, v1.1 각 반영 시점 기준).

## 7. 알려진 이슈 / 확인 필요

- **모바일 키보드 + `Sheet` 바텀시트 상호작용 미검증.** `AddItemModal`은 `Sheet`(하단 고정, `position: fixed`) 안에 텍스트 입력창이 있는데, 모바일에서 입력창에 포커스가 가서 온스크린 키보드가 뜰 때 시트가 가려지거나 잘릴 위험이 있다.
  - 특히 iOS Safari는 키보드가 뜬 뒤 `fixed` 요소가 "보이는 화면(visual viewport)" 기준이 아니라 원래 레이아웃 기준으로 남아있는 경우가 있어 취약하다고 알려져 있음. 안드로이드 크롬은 상대적으로 덜함.
  - **Playwright 헤드리스 테스트로는 검증이 안 됨** — 실제 온스크린 키보드가 뜨는 걸 시뮬레이션하지 않기 때문에, 지금까지의 자동 검증은 이 시나리오를 커버하지 못했다.
  - 실제 모바일 기기(특히 iOS Safari)에서 카드의 "+ 추가"로 입력 모달을 열고 텍스트 입력창을 눌러 확인 필요.
  - 문제가 확인되면 후보 해결책: `VisualViewport` API로 키보드 높이만큼 시트 위치/높이 보정, 또는 시트 `max-height`를 줄여서 여유를 두는 방법.
