# RFC: 미니다이어리 v1.1 — 날짜 이동 · 달력

> 상태: 완료
> 관련 PRD: `docs/prd/mini-diary.md` §11 / 관련 아키텍처: `docs/architecture/ARCHITECTURE.md`

## 목표

v1의 날짜 선택(네이티브 date input + 목록) 방식이 불편해, (1) 오늘 기준 전/후 날짜로 빠르게 이동하고 (2) 한 달 단위로 기록 현황을 한눈에 보는 UX를 추가한다.

## 범위

### Scope
- 헤더 `‹` `›` 버튼으로 이전/다음 날 이동(미래 차단)
- 본문 가로 스와이프 이동
- ← → 방향키 이동(입력 중/팝업 열림 시 제외)
- 날짜 전환 페이드 애니메이션(`prefers-reduced-motion` 존중)
- `📖 다이어리` 팝업을 월 달력 격자(6주×7일)로 교체
- 달 이동, 오늘 테두리, 선택일 채움, 미래 날짜 비활성
- 날짜별 점 표시(기록/어김/피드백) + 범례

### Non-scope
- 연 단위 뷰, 주간 뷰 등 다른 캘린더 뷰
- 날짜 범위 선택/멀티 선택

## 작업 단계

- [x] `useSwipe` 훅 추가 (`app/lib/useSwipe.ts`)
- [x] 날짜 유틸 확장: `addDays`, `isFuture`, `monthMatrix`, `monthLabel`, `WEEKDAYS` (`app/lib/date.ts`)
- [x] 헤더에 이전/다음 버튼 + 스와이프/방향키 이동 연결 (`app/components/Header.tsx`, `app/page.tsx`)
- [x] `day-enter` 페이드 스타일 추가 (`app/globals.css`)
- [x] `MonthCalendar` 컴포넌트 신규 작성
- [x] `DiaryDatePopup`을 월 달력 기반으로 교체
- [x] `useDiary`에 `dayMeta`(날짜별 기록/어김/피드백 요약, 타입 `DayMeta`) 추가

## 변경 파일 목록

- `app/lib/useSwipe.ts` (신규)
- `app/lib/date.ts` (확장)
- `app/components/Header.tsx`
- `app/page.tsx`
- `app/globals.css`
- `app/components/MonthCalendar.tsx` (신규)
- `app/components/DiaryDatePopup.tsx`
- `app/lib/useDiary.ts`

## 리스크

- 스와이프 제스처가 세로 스크롤과 충돌할 수 있음 → 가로 이동량이 세로보다 클 때만 인식하도록 처리.
- 방향키 이동이 텍스트 입력/모달과 충돌 → 입력 중이거나 팝업이 열려 있을 때는 비활성화.

## 검증 방법

- `pnpm build` / 타입체크 통과.
- `pnpm dev`에서 스와이프, 방향키, 달력 점 표시 수동 확인.
