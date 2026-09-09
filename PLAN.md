# 미니다이어리 기획서 (확정본)

> 상태: 확정 → **v1 구현 완료** (18번 구현 현황 참고).
> 갱신일: 2026-09-09

---

## 1. 배경 & 기획 의도

- 기존 다이어리 앱은 기능이 많고 복잡해서 매일 쓰기 부담스럽다.
- 한 화면에서 오늘의 상태를 바로 확인할 수 있는 **나만의 가벼운 다이어리**가 목표.
- 단순 할 일(To‑do) 목록이 아니라 **"해야 할 일"과 "하지 말아야 할 일"을 함께** 관리한다.

## 2. 핵심 원칙

- 한 화면(스크롤 최소)에서 전체 파악.
- 입력은 버튼 하나 → 카테고리 선택 → 저장. 3스텝 이내.
- 서버/DB 없음. 브라우저 `localStorage`에 저장(→ 9번 근거).
- 의존성 최소: Tailwind CSS + tailwind-merge + clsx 만.

## 3. 화면 구성 (단일 페이지)

```
┌───────────────────────────────────────────────────────┐
│  2026년 9월 9일 (화)   [📖 다이어리]      [+ 입력] [🌙] │  ← 헤더
├──────────────────────────┬────────────────────────────┤
│  Longterm                │  Do Now                    │  ← 상단 2 카드
│  (장기 목표)              │  (오늘 집중할 일)            │
│  ☐ ...                   │  ☐ ...                     │
├──────────────────────────┼────────────────────────────┤
│  Don't                   │  Extra                     │  ← 하단 2 카드
│  (하지 말 일)             │  (기타 · 갑자기 생긴 일)      │
│  · ...   3 지킴 · 1 어김  │  ☐ ...                     │
├───────────────────────────────────────────────────────┤
│  하루의 피드백                                 [ 메모 ] │  ← 하단 회고 메모
│  (오늘 하루 회고 한 줄~여러 줄)                          │
└───────────────────────────────────────────────────────┘
```

- **헤더**: 왼쪽에 선택된 날짜(기본=오늘), 그 옆 `📖 다이어리` 버튼(→ 날짜 선택 팝업), 오른쪽에 `+ 입력` 버튼과 테마 토글.
- 4개 카드는 `flex flex-row flex-wrap`, 각 카드 `basis-1/2` 로 2 × 2 배치.
- 하단에 "하루의 피드백" 메모 영역.

## 4. 카테고리 정의 (확정)

| 라벨 | 뜻 | 상태 토글 |
|---|---|---|
| **Longterm** | 계속 염두에 둘 장기 목표·할 일 | 완료 체크 |
| **Do Now** | 오늘·지금 집중해서 할 일 | 완료 체크 |
| **Don't** | 습관처럼 하지만 하지 말아야 할 일 | "오늘 어김" 토글 |
| **Extra** | 기타 · 예정에 없이 갑자기 생긴 일 | 완료 체크 |

- 4개 카드 **모두 날짜별**로 기록된다. (상시 목록 개념 없음)

## 5. 날짜 구조 (확정)

### 기본 동작
- 첫 진입 시 헤더에 **오늘 날짜**가 표시되고, 보드는 **오늘 날짜**의 항목을 보여준다.
- `📖 다이어리` 버튼 → **날짜 선택 팝업**(기록이 있는 날짜 목록 / 간단 달력). 날짜를 고르면 그 날의 다이어리를 본다.
- 자정을 넘겨 날짜가 바뀌면(재방문·창 포커스 시 재계산) 보드는 새 "오늘"로 이동.

### 오늘 vs 과거 날짜
| | 오늘 | 과거 날짜 |
|---|---|---|
| 항목 추가 | O | X |
| 상태 토글(완료 / 어김) | O | X |
| 항목 수정 | O | X |
| 항목 삭제 | O | X |
| 보기 | O | O (**읽기 전용**) |
| 오늘로 불러오기 | – | O |

- **과거 날짜는 읽기 전용.** 지난 기록은 고치지 않고 그대로 남긴다.

### 항목 이어가기 (carry-forward)
- 새 날에 `Longterm` / `Don't` 카드가 비어 있으면, 카드 안에 선택지를 보여준다:
  - **[지난 항목 불러오기]** — 가장 최근에 기록된 날의 해당 카테고리 항목을 오늘로 복제(내용만 복사, 상태는 초기화, 새 id, date=오늘).
  - **[직접 적기]** — `+ 입력`으로 새로 작성.
- 과거 날짜를 팝업으로 열어보는 중에도 **[이 날의 Longterm · Don't 오늘로 불러오기]** 버튼 제공.
- `Do Now` / `Extra` 는 성격상 매일 새로 시작(불러오기 없음). 필요 시 다음 버전에서 추가.

## 6. 완료 / 상태 표시 (확정)

### 해야 할 일: Longterm / Do Now / Extra
- 항목 왼쪽에 **체크박스**.
- 빈 상태 = 미완료. 체크 = 완료 → 텍스트 취소선 + 회색, 카드 안에서 아래로 정렬.

### 하지 말아야 할 일: Don't
- 체크박스 대신 **상태 토글 1개**.
- 기본값 = "지킴"(아무 표시 없음, 깔끔한 상태).
- 탭하면 = **"오늘 어김"** → 빨간 배지 + 텍스트 빨강.
- 어겼을 때만 한 번 누른다 → 조작 최소, 빨간 표시가 없는 날 = 잘 지킨 날(한눈에).
- Don't 카드 헤더 요약: `N 지킴 · M 어김`.

## 7. 데이터 모델 (확정)

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
```

### localStorage 키

| 키 | 값 |
|---|---|
| `mini-diary:v1:items` | `DiaryItem[]` |
| `mini-diary:v1:feedback` | `Record<string, DayFeedback>` (날짜 → 피드백) |
| `mini-diary:v1:theme` | `ThemeMode` |

- 모든 저장소 접근은 `app/lib/storage.ts` 한 곳에 모은다 → 나중에 다른 저장 방식으로 교체가 쉬움.

## 8. 인터랙션

- **+ 입력 버튼** → 모달 오픈. (오늘 날짜에서만 활성)
  - 입력값: 내용(text, 1~80자) + 카테고리 선택(Longterm / Do Now / Don't / Extra — 세그먼트 버튼 4개).
  - 저장 → 해당 카드에 오늘 날짜로 항목 추가. Enter 저장, Esc 닫기.
- **항목 상태 토글**: 6번 규칙대로. (오늘만)
- **항목 수정 / 삭제**: 항목에 마우스 올리면(모바일은 항상) 우측에 ✎ / ✕. 수정은 인라인 편집. (오늘만)
- **지난 항목 불러오기**: 5번 carry-forward 규칙대로.
- **메모 버튼**: 하단 피드백을 오늘 날짜 기준으로 저장. (과거 날짜는 읽기 전용)
- **📖 다이어리 버튼**: 날짜 선택 팝업. 과거 날짜 선택 시 보드 읽기 전용 전환.
- **테마 토글**: `system → light → dark → system` 순환, `localStorage` 저장. 최초엔 `system`(OS 설정 따름).

## 9. 저장소: 왜 localStorage 인가 (질문 답변)

**결론: v1은 localStorage가 맞다.**

| 근거 | 설명 |
|---|---|
| 데이터가 아주 작다 | 텍스트뿐. 하루 40개(4카드×10) × 수년치여도 브라우저 한도(~5MB) 대비 극히 일부. |
| 사용 형태가 단순 | 개인용, 로그인 없음, 주로 한 기기. 요구사항("복잡하지 않게", "DB 안 붙임")과 일치. |
| 설정 0 | 서버·계정·네트워크 불필요. 오프라인 동작. 비용 없음. |

**단점과 보완**
- 단점: 브라우저 데이터 삭제 시 유실, 기기 간 동기화 안 됨.
- 보완: **JSON 내보내기/가져오기 버튼**을 넣는다(설정 영역). 파일 1개로 백업·이사 가능. → MVP 포함.
- 저장소 접근을 `storage.ts` 한 파일로 격리 → 나중에 클라우드(예: 계정+동기화가 필요해질 때)로 바꿔도 화면 코드는 그대로.

**localStorage를 재검토할 시점**
- 폰과 노트북에서 같은 다이어리를 봐야 할 때 → 가벼운 클라우드 저장소(예: Supabase) 또는 JSON을 클라우드 드라이브에 동기화.
- 확실한 자동 백업이 필요할 때.

> IndexedDB는 이 데이터 규모에선 과함(비동기·구조 복잡). 채택하지 않음.

## 10. 항목 개수 제한 (확정)

- **날짜별 · 카테고리별 최대 10개.**
- 10개가 차면 그 카테고리는 입력 폼에서 비활성 + 안내 문구("카드당 최대 10개").

## 11. 테마 (다크 / 라이트)

- Tailwind `dark:` **클래스 전략**. 루트 `<html>`에 `dark` 클래스 토글.
- Tailwind v4: `globals.css`에 `@custom-variant dark (&:where(.dark, .dark *));`
- 팔레트(초안)
  - light: 배경 `neutral-50` / 카드 `white` / 테두리 `neutral-200` / 글자 `neutral-800`
  - dark: 배경 `neutral-950` / 카드 `neutral-900` / 테두리 `neutral-800` / 글자 `neutral-100`
  - 상태 색: 완료 `neutral-400`(취소선) / Don't 어김 `rose-500`
  - 카테고리 포인트(선택): Longterm `sky` / Do Now `emerald` / Don't `rose` / Extra `amber`
- `system` 모드일 때는 `prefers-color-scheme` 로 `dark` 클래스 자동 부여.

## 12. 반응형 (확정)

- 데스크탑/태블릿: 2 × 2 카드.
- 모바일(좁은 화면): 세로 1열 스택 순서
  **Longterm → Do Now → Don't → Extra → 하루의 피드백**
- 헤더도 좁아지면 날짜 아래로 버튼 줄바꿈.

## 13. 기술 스택 & 의존성 (확정)

- **프레임워크**: Next.js 16 (App Router) + TypeScript.
- **스타일**: Tailwind CSS v4 + `tailwind-merge`.
- **추가 라이브러리**: `clsx` 1개만.
  - `tailwind-merge` = "충돌하는 Tailwind 클래스 정리", `clsx` = "조건에 따라 클래스 켜고 끄기". 이 둘을 `cn()` 헬퍼로 묶는 게 표준.
  - 상태관리·날짜·UUID 라이브러리는 안 씀(`crypto.randomUUID()`, 네이티브 `Date`).

```ts
// app/lib/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
```

### 패키지 목록(예정)

| 구분 | 패키지 |
|---|---|
| dependencies | `next` `react` `react-dom` `tailwind-merge` `clsx` |
| devDependencies | `typescript` `@types/node` `@types/react` `@types/react-dom` `tailwindcss` `@tailwindcss/postcss` `postcss` |

## 14. 컴포넌트 구조 (예상)

- `app/page.tsx` (클라이언트 컴포넌트, 루트 상태 보유)
  - `Header` — 날짜, `DiaryDatePopupTrigger`, `AddButton`, `ThemeToggle`
  - `AddItemModal` — 내용 입력 + 카테고리 세그먼트
  - `DiaryDatePopup` — 날짜 선택(달력/리스트)
  - `Board`
    - `QuadrantCard` ×4 — props: `title`, `category`, `items`, `readOnly`, 요약
      - `ItemRow` — 상태 토글, 텍스트(인라인 편집), 수정/삭제
      - `CarryForwardPrompt` — 비어 있을 때 [지난 항목 불러오기] / [직접 적기]
  - `DailyFeedback` — textarea + 메모 저장 버튼(읽기 전용 지원)
  - `SettingsMenu` — JSON 내보내기 / 가져오기
- `app/lib/` — `types.ts`, `cn.ts`, `storage.ts`, `useDiary.ts`(상태 훅), `date.ts`

## 15. 스코프

### MVP 포함
- 4분면 카드(모두 날짜별) + 항목 추가/수정/삭제 + 상태 토글
- 카테고리 선택 입력(모달)
- 날짜 선택 팝업 + 과거 날짜 읽기 전용 보기
- Longterm / Don't "지난 항목 불러오기"
- 하루 피드백 메모
- 다크/라이트/시스템 테마 + 토글
- localStorage 저장 + **JSON 내보내기/가져오기**
- 날짜·카테고리별 10개 제한
- 반응형(모바일 1열)

### 이번 버전 제외 (다음 후보)
- Do Now / Extra 이어가기(미완료 항목 다음날로)
- 드래그 앤 드롭 재정렬·카테고리 이동
- 통계, 스트릭(연속 지킴 일수), 리마인더/알림
- 계정, 클라우드 동기화
- 태그, 우선순위, 마감일
- 미래 날짜 계획

## 16. 리스크 / 검토 포인트

- "한눈에 확인" 목표와 항목 누적 → 카드당 10개 제한으로 완화.
- 과거 날짜 읽기 전용 상태를 화면 곳곳(토글/버튼/입력)에서 일관되게 비활성화해야 함 → `readOnly` prop 하나로 통제.
- `localStorage` 유실 위험 → JSON 내보내기로 보완(9번).
- 자정 넘어가며 날짜 바뀔 때 화면 자동 갱신(재방문/포커스 시 오늘 날짜 재계산).
- carry-forward 시 "가장 최근 기록된 날" 판정 로직 필요(어제가 비어 있을 수 있음).

## 17. 부록 — 확정 로그

- 카테고리명 `Delete` → `Don't`.
- `Extra` = 기타 · 갑자기 생긴 일.
- 4개 카드 모두 날짜별. 상시 목록 개념 폐기.
- Longterm / Don't 는 새 날에 "지난 항목 불러오기 / 직접 적기" 선택.
- 과거 날짜 = 읽기 전용, "오늘로 불러오기"만 가능. 오늘 = 추가·수정·삭제 가능.
- 저장소 = localStorage + JSON 백업. 접근은 `storage.ts` 로 격리.
- 스택 = Next.js 16 + TS + Tailwind v4 + tailwind-merge + clsx.

---

## 18. 구현 현황 (v1 완료)

- 빌드/타입체크 통과, dev 서버 `npm run dev` → `http://localhost:3001`.
- 스크립트: `dev` / `build` / `start` 모두 포트 3001 (기존 계산기 프로젝트와 충돌 회피).

### 기획 → 파일 매핑

| 기획 항목 | 파일 |
|---|---|
| 타입·상수(카테고리, 10개 제한, 80자) | `app/lib/types.ts` |
| `cn()` 헬퍼 (clsx + tailwind-merge) | `app/lib/cn.ts` |
| 날짜 유틸(`YYYY-MM-DD`, 한국어 포맷) | `app/lib/date.ts` |
| localStorage 읽기/쓰기 + JSON 백업 파싱 | `app/lib/storage.ts` |
| 다이어리 상태 훅(항목 CRUD, 토글, carry-forward, 피드백, export/import) | `app/lib/useDiary.ts` |
| 테마 훅(system→light→dark, OS 설정 반영) | `app/lib/useTheme.ts` |
| 첫 페인트 전 테마 적용(깜빡임 방지) | `app/layout.tsx` |
| 헤더(날짜, 📖 다이어리, + 입력, 테마, ⚙️ 설정) | `app/components/Header.tsx` |
| 테마 토글 버튼 | `app/components/ThemeToggle.tsx` |
| JSON 내보내기/가져오기 메뉴 | `app/components/SettingsMenu.tsx` |
| 4분면 배치(flex 2×2 / 모바일 1열) | `app/components/Board.tsx` |
| 카드(제목, 요약, 10개 제한, 이어가기 프롬프트) | `app/components/QuadrantCard.tsx` |
| 항목 행(체크박스 / Don't 지킴·어김 토글, 인라인 수정, 삭제) | `app/components/ItemRow.tsx` |
| 입력 모달(카테고리 세그먼트 + 내용) | `app/components/AddItemModal.tsx` |
| 날짜 선택 팝업(달력 입력 + 기록 있는 날 목록) | `app/components/DiaryDatePopup.tsx` |
| 하루의 피드백 메모 | `app/components/DailyFeedback.tsx` |
| 페이지 조립 + 자정 롤오버 처리 | `app/page.tsx` |

### 구현 중 확정한 세부

- 테마 아이콘: system `🖥️` / light `☀️` / dark `🌙`.
- 과거 날짜: 헤더에 `지난 기록 · 읽기 전용` 배지, `+ 입력`·카드 추가 버튼·상태 토글·수정/삭제 모두 비활성.
- carry-forward 대상: `Longterm`, `Don't` 만 (`CARRYABLE`). 기준 날짜 = 해당 카테고리에 항목이 있는 가장 최근 과거 날짜.
- 10개 초과 시: 입력 모달에서 해당 카테고리 버튼 비활성 + 안내, 카드 하단 추가 버튼 `카드당 최대 10개` 로 비활성.
- 피드백: `key={selectedDate}` 로 날짜 전환 시 재마운트, `메모` 버튼 클릭 시 저장 + `저장됨` 2초 표시.
- `next dev` 가 자동 생성하는 `AGENTS.md` / `CLAUDE.md` 는 `.gitignore` 처리.

### 남은 것(다음 후보)

- Do Now / Extra 이어가기, 드래그 재정렬, 통계·스트릭, 클라우드 동기화, 태그/우선순위/마감일.

---

## 19. v1.1 추가 (날짜 이동 · 달력)

### 1) 이전/다음 날 이동
- 헤더 날짜 양옆에 `‹` `›` 버튼. `›`(다음 날)는 오늘이면 비활성(미래 차단).
- 본문 **가로 스와이프**: 왼쪽 = 다음 날, 오른쪽 = 이전 날. 세로 스크롤과 겹치지 않게 가로 이동이 세로보다 클 때만 인식.
- **← → 방향키**로도 이동 (입력 중 / 팝업 열림 시 제외).
- 날짜가 바뀌면 본문에 짧은 페이드(`day-enter`, `prefers-reduced-motion` 존중).
- 파일: `app/lib/useSwipe.ts`, `app/lib/date.ts`(`addDays`, `isFuture`), `app/components/Header.tsx`, `app/page.tsx`, `app/globals.css`.

### 2) 한 달 달력
- `📖 다이어리` 팝업을 네이티브 date input + 목록 → **월 달력 격자**(6주 × 7일)로 교체.
- 달 이동 `‹ 2026년 9월 ›`, 오늘 테두리, 선택일 채움, 미래 날짜 비활성.
- 날짜별 점 표시: `기록`(회색) · `어김`(빨강) · `피드백`(주황). 하단 범례.
- 데이터: `useDiary.dayMeta` (`Record<date, { total, open, broken, feedback }>`), 타입 `DayMeta`.
- 파일: `app/components/MonthCalendar.tsx`, `app/components/DiaryDatePopup.tsx`, `app/lib/date.ts`(`monthMatrix`, `monthLabel`, `WEEKDAYS`), `app/lib/useDiary.ts`.
