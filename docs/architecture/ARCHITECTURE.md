# ARCHITECTURE.md — 미니다이어리

> 마지막 갱신: 2026-09-16 (v1 + v1.1 날짜 이동·달력 반영)
> 이 문서는 "지금 구조가 어떤가"의 스냅샷이다. 왜 이렇게 결정했는지는 `docs/adr/`, 제품 요구사항은 `docs/prd/mini-diary.md` 참고.

## 1. 개요

- **목적**: 한 화면에서 오늘 상태를 바로 확인하는 개인용 가벼운 다이어리.
- **기술 스택**: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + `tailwind-merge` + `clsx`.
- **주요 진입점**: `app/page.tsx` (클라이언트 컴포넌트, 루트 상태 보유).
- **실행**: `pnpm dev` → `http://localhost:3001` (`dev`/`build`/`start` 모두 포트 3001 고정 — 기존 계산기 프로젝트와 포트 충돌 회피).
- 상태관리·날짜·UUID 전용 라이브러리는 쓰지 않는다(`crypto.randomUUID()`, 네이티브 `Date`).

### 의존성

- `tailwind-merge` = 충돌하는 Tailwind 클래스 정리, `clsx` = 조건에 따라 클래스 켜고 끄기. 이 둘을 `cn()` 헬퍼로 묶는다.

```ts
// app/lib/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
```

| 구분 | 패키지 |
|---|---|
| dependencies | `next` `react` `react-dom` `tailwind-merge` `clsx` |
| devDependencies | `typescript` `@types/node` `@types/react` `@types/react-dom` `tailwindcss` `@tailwindcss/postcss` `postcss` |

## 2. 데이터 모델

```ts
type Category = 'longterm' | 'donow' | 'dont' | 'extra';

// longterm / donow / extra : 'open' ↔ 'done'
// dont                     : 'open'(지킴) ↔ 'broken'(어김)
type ItemStatus = 'open' | 'done' | 'broken';

interface DiaryItem {
  id: string;              // crypto.randomUUID()
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

### localStorage 키

| 키 | 값 |
|---|---|
| `mini-diary:v1:items` | `DiaryItem[]` |
| `mini-diary:v1:feedback` | `Record<string, DayFeedback>` (날짜 → 피드백) |
| `mini-diary:v1:theme` | `ThemeMode` |

- 모든 저장소 접근은 `app/lib/storage.ts` 한 곳에 모은다. 왜 localStorage인지는 [[0001-storage-strategy]] 참고.
- `storage.ts`의 모든 함수는 `Promise`를 반환한다(내부는 아직 localStorage 동기 구현). 나중에 MongoDB 등으로 바꿀 때 호출부(`useDiary.ts`, `useTheme.ts`)를 거의 안 건드리기 위한 의도적 설계 — 자세한 배경은 `docs/rfcs/mini-diary-v2-async-storage-prep.md` 참고. 첫 페인트 전 테마만 예외로 `app/layout.tsx`에서 `localStorage`를 동기 직접 접근한다(FOUC 방지).

### 다크 모드 구현

- Tailwind `dark:` 클래스 전략. 루트 `<html>`에 `dark` 클래스를 토글한다.
- Tailwind v4: `globals.css`에 `@custom-variant dark (&:where(.dark, .dark *));`
- `system` 모드일 때는 `prefers-color-scheme`으로 `dark` 클래스를 자동 부여한다.

## 3. 컴포넌트 / 파일 구조

- `app/page.tsx` — 페이지 조립, 자정 롤오버 처리
  - `Header` — 날짜, 이전/다음 이동, `DiaryDatePopupTrigger`, `AddButton`, `ThemeToggle`
  - `AddItemModal` — 내용 입력 + 카테고리 세그먼트
  - `DiaryDatePopup` — 월 달력 기반 날짜 선택
    - `MonthCalendar` — 6주×7일 격자, 기록/어김/피드백 점 표시
  - `Board`
    - `QuadrantCard` ×4 — props: `title`, `category`, `items`, `readOnly`, 요약
      - `ItemRow` — 상태 토글, 텍스트(인라인 편집), 수정/삭제
      - `CarryForwardPrompt` — 비어 있을 때 [지난 항목 불러오기] / [직접 적기]
  - `DailyFeedback` — textarea + 메모 저장 버튼(읽기 전용 지원)
  - `SettingsMenu` — JSON 내보내기 / 가져오기

| 역할 | 파일 |
|---|---|
| 타입·상수(카테고리, 10개 제한, 80자) | `app/lib/types.ts` |
| `cn()` 헬퍼 (clsx + tailwind-merge) | `app/lib/cn.ts` |
| 날짜 유틸(`YYYY-MM-DD`, 한국어 포맷, `addDays`, `isFuture`, `monthMatrix`, `monthLabel`, `WEEKDAYS`) | `app/lib/date.ts` |
| localStorage 읽기/쓰기 + JSON 백업 파싱 | `app/lib/storage.ts` |
| 다이어리 상태 훅(항목 CRUD, 토글, carry-forward, 피드백, export/import, `dayMeta`) | `app/lib/useDiary.ts` |
| 테마 훅(system→light→dark, OS 설정 반영) | `app/lib/useTheme.ts` |
| 가로 스와이프 제스처 훅 | `app/lib/useSwipe.ts` |
| 첫 페인트 전 테마 적용(깜빡임 방지) | `app/layout.tsx` |
| 헤더(날짜, 📖 다이어리, + 입력, 테마, ⚙️ 설정) | `app/components/Header.tsx` |
| 테마 토글 버튼 | `app/components/ThemeToggle.tsx` |
| JSON 내보내기/가져오기 메뉴 | `app/components/SettingsMenu.tsx` |
| 4분면 배치(flex 2×2 / 모바일 1열) | `app/components/Board.tsx` |
| 카드(제목, 요약, 10개 제한, 이어가기 프롬프트) | `app/components/QuadrantCard.tsx` |
| 항목 행(체크박스 / Don't 지킴·어김 토글, 인라인 수정, 삭제) | `app/components/ItemRow.tsx` |
| 입력 모달(카테고리 세그먼트 + 내용) | `app/components/AddItemModal.tsx` |
| 날짜 선택 팝업(월 달력) | `app/components/DiaryDatePopup.tsx` |
| 월 달력 격자 | `app/components/MonthCalendar.tsx` |
| 하루의 피드백 메모 | `app/components/DailyFeedback.tsx` |

## 4. 구현상 확정된 세부 규칙

- 테마 아이콘: system `🖥️` / light `☀️` / dark `🌙`.
- 과거 날짜: 헤더에 `지난 기록 · 읽기 전용` 배지, `+ 입력`·카드 추가 버튼·상태 토글·수정/삭제 모두 비활성.
- carry-forward 대상: `Longterm`, `Don't` 만(`CARRYABLE`). 기준 날짜 = 해당 카테고리에 항목이 있는 가장 최근 과거 날짜.
- 10개 초과 시: 입력 모달에서 해당 카테고리 버튼 비활성 + 안내, 카드 하단 추가 버튼도 `카드당 최대 10개`로 비활성.
- 피드백: `key={selectedDate}` 로 날짜 전환 시 재마운트, `메모` 버튼 클릭 시 저장 + `저장됨` 2초 표시.
- 날짜 이동: 스와이프는 세로 스크롤보다 가로 이동이 클 때만 인식, 방향키는 입력 중/팝업 열림 시 비활성, 미래 날짜 이동 차단.
- 날짜 전환 시 `day-enter` 페이드, `prefers-reduced-motion` 존중.
- `AGENTS.md`는 `next dev`가 자동 생성/재생성하는 보일러플레이트라 `.gitignore` 처리, 커밋하지 않는다. `CLAUDE.md`는 프로젝트 문서 규칙을 직접 작성해 넣은 파일이라 추적·커밋 대상이다.

## 5. 현재 미구현 / 다음 후보

- Do Now / Extra 이어가기(미완료 항목 다음날로).
- 드래그 앤 드롭 재정렬·카테고리 이동.
- 통계, 스트릭(연속 지킴 일수), 리마인더/알림.
- 계정, 클라우드 동기화.
- 태그, 우선순위, 마감일.
- 미래 날짜 계획.

## 6. 검증 상태

- 빌드/타입체크 통과 확인됨 (v1, v1.1 각 반영 시점 기준).
