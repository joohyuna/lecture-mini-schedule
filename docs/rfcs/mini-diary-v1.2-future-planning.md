# RFC: 미니다이어리 v1.2 — 미래 날짜 계획

> 상태: 완료
> 관련 PRD: `docs/prd/mini-diary.md` §5, §14 / 관련 이슈: [#6 미래 날짜 계획 지원](https://github.com/joohyuna/lecture-mini-schedule/issues/6)

## 목표

지금까지는 다음 날 이동이 오늘에서 막혀 있어서, 일정을 미리 적어두고 싶어도 방법이 없었다. 과거 날짜처럼 완전 읽기 전용은 아니고, 항목을 미리 적고 고칠 수 있는 "계획 모드"로 미래 날짜를 열어준다.

## 범위

### Scope
- 날짜 이동(헤더 버튼/스와이프/방향키)과 월 달력에서 미래 제한 제거
- 미래 날짜: 항목 추가/수정/삭제 가능
- 미래 날짜: 상태 토글(완료 체크, Don't 어김)은 불가 — 아직 일어나지 않은 일이라 "완료"가 성립하지 않음
- 미래 날짜: carry-forward(지난 항목 불러오기)도 그대로 지원
- 헤더에 미래 날짜 전용 배지("예정 · 계획 모드")

### Non-scope
- 하루의 피드백(회고)을 미래 날짜에 쓰는 것 — 회고는 여전히 당일에만(아직 일어나지 않은 하루를 회고할 수 없음)
- 미래 날짜 이동에 상한(몇 년 뒤까지 등) — 과거처럼 제한 없음

## 접근 방식

- `page.tsx`의 `readOnly`를 "과거만"을 뜻하도록 좁히고(`selectedDate < today`), 별도로 `isFuture`(`lib/date.ts`의 기존 `isFuture` 유틸 재사용) 플래그를 추가해 두 상태를 섞지 않는다.
- `DailyFeedback`에는 기존과 동일한 의미(`selectedDate !== today`)를 `feedbackReadOnly`라는 별도 변수로 전달 — 회고는 과거·미래 모두 읽기 전용이어야 하므로 `readOnly`(과거만)와는 다른 조건이 필요했다.
- `ItemRow`에 `statusLocked` prop을 추가해 상태 토글 버튼만 잠그고, 텍스트 수정·삭제 버튼은 `readOnly`(과거 여부)로만 제어 — 두 잠금을 분리해서 "계획은 되지만 완료 체크는 안 되는" 상태를 표현했다.
- `Board` → `QuadrantCard` → `CardDetailModal`/`ItemRow`로 `isFuture`를 그대로 흘려보내고, 각 단계에서 `statusLocked={isFuture}`로 변환해 전달.
- `MonthCalendar`의 미래 날짜 `disabled`/dimming 스타일 제거.
- `latestPriorDate`(이미 "현재 날짜보다 이전"으로 일반화돼 있던 로직)는 손대지 않음 — 미래 날짜에서도 자동으로 과거/오늘 중 최근 기록을 찾아온다.

## 작업 단계

- [x] `page.tsx`: `readOnly`(과거만) / `isFuture` / `feedbackReadOnly` 분리, `goRelative` 미래 제한 제거
- [x] `Header.tsx`: `canGoNext` 제거(다음 버튼 항상 활성), `isFuture` prop과 "예정 · 계획 모드" 배지 추가
- [x] `Board.tsx`, `QuadrantCard.tsx`, `CardDetailModal.tsx`: `isFuture` prop 전달
- [x] `ItemRow.tsx`: `statusLocked` prop 추가, 토글 버튼에만 적용(`toggleDisabled = readOnly || statusLocked`)
- [x] `MonthCalendar.tsx`: 미래 날짜 `disabled`/흐림 스타일 제거
- [x] PRD §5(표를 과거/오늘/미래 3열로), §7, §10, §12, 새 §14 반영. ARCHITECTURE.md §4, §5 반영.

## 변경 파일 목록

- `app/page.tsx`
- `app/components/Header.tsx`
- `app/components/Board.tsx`
- `app/components/QuadrantCard.tsx`
- `app/components/CardDetailModal.tsx`
- `app/components/ItemRow.tsx`
- `app/components/MonthCalendar.tsx`

## 리스크

- `readOnly`의 의미를 "오늘이 아님" → "과거만"으로 좁히는 변경이라, 이 prop을 쓰는 모든 곳(Board/QuadrantCard/CardDetailModal/ItemRow)에서 의도대로 갱신됐는지 빠짐없이 확인 필요 — 하나라도 놓치면 미래 날짜에서 과거처럼 완전 잠기거나, 반대로 과거 날짜에서 편집이 풀릴 위험.
- `DailyFeedback`은 `readOnly`가 아니라 별도 `feedbackReadOnly`를 받아야 하는데, 실수로 같은 값을 넘기면 미래 날짜에 회고를 쓸 수 있게 되는 버그가 생김.

## 검증 방법

- `pnpm build` 타입체크·빌드 통과
- Playwright(데스크탑 900px)로: 다음 날 이동 → "예정 · 계획 모드" 배지 확인 → 미래 날짜에 항목 추가 → 체크박스 `disabled` 속성 확인 → 비어있는 Longterm 카드에서 "지난 항목 불러오기"로 오늘 항목이 복제되는지 확인
- 과거 날짜 회귀 확인: "지난 기록 · 읽기 전용" 배지, 추가 버튼 없음
