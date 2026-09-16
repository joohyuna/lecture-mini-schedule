# RFC: 미니다이어리 v1 구현

> 상태: 완료 (v1 구현 완료, 빌드/타입체크 통과)
> 관련 PRD: `docs/prd/mini-diary.md` / 관련 ADR: [[0001-storage-strategy]]

## 목표

한 화면에서 오늘의 "해야 할 일 / 하지 말아야 할 일"을 4분면 카드로 바로 확인·기록하는 개인용 다이어리를 만든다. 서버 없이 브라우저에만 저장하고, 3스텝 이내 입력을 지킨다.

## 범위

### Scope
- 4분면 카드(Longterm / Do Now / Don't / Extra), 모두 날짜별 기록
- 항목 추가/수정/삭제 + 상태 토글(완료 체크, Don't는 지킴/어김 토글)
- 카테고리 선택 입력 모달
- 날짜 선택 팝업 + 과거 날짜 읽기 전용 보기
- Longterm / Don't "지난 항목 불러오기" (carry-forward)
- 하루 피드백 메모
- 다크/라이트/시스템 테마 토글
- localStorage 저장 + JSON 내보내기/가져오기
- 날짜·카테고리별 10개 제한
- 반응형(모바일 1열)

### Non-scope (다음 후보로 이월)
- Do Now / Extra 이어가기
- 드래그 앤 드롭 재정렬·카테고리 이동
- 통계, 스트릭, 리마인더/알림
- 계정, 클라우드 동기화
- 태그, 우선순위, 마감일
- 미래 날짜 계획

## 접근 방식

- Next.js 16 (App Router) + TypeScript, Tailwind CSS v4 + `tailwind-merge` + `clsx`만 의존성으로 추가.
- 상태관리·날짜·UUID 전용 라이브러리 없이 `crypto.randomUUID()` / 네이티브 `Date` 사용.
- 저장소는 `app/lib/storage.ts`로 격리(근거: [[0001-storage-strategy]]).
- `readOnly` prop 하나로 과거 날짜의 추가/수정/삭제/토글 비활성을 화면 전역에서 일관되게 통제.
- 자세한 화면 구성/인터랙션/카테고리 정의는 PRD 참고.

## 작업 단계

- [x] 타입·상수 정의 (`app/lib/types.ts`)
- [x] `cn()` 헬퍼 (`app/lib/cn.ts`)
- [x] 날짜 유틸 (`app/lib/date.ts`)
- [x] localStorage 읽기/쓰기 + JSON 백업 파싱 (`app/lib/storage.ts`)
- [x] 다이어리 상태 훅: CRUD, 토글, carry-forward, 피드백, export/import (`app/lib/useDiary.ts`)
- [x] 테마 훅 (`app/lib/useTheme.ts`) + 첫 페인트 전 테마 적용 (`app/layout.tsx`)
- [x] 헤더, 테마 토글, 설정 메뉴 컴포넌트
- [x] 4분면 배치(Board) + 카드(QuadrantCard) + 항목 행(ItemRow)
- [x] 입력 모달(AddItemModal)
- [x] 날짜 선택 팝업(DiaryDatePopup, 초기 버전)
- [x] 하루의 피드백(DailyFeedback)
- [x] 페이지 조립 + 자정 롤오버 처리 (`app/page.tsx`)

## 변경 파일 목록

세부 파일 매핑은 `docs/architecture/ARCHITECTURE.md` §3 표 참고.

## 리스크

- "한눈에 확인" 목표와 항목 누적이 상충 → 카드당 10개 제한으로 완화.
- 과거 날짜 읽기 전용 상태를 화면 곳곳(토글/버튼/입력)에서 일관되게 비활성화해야 함 → `readOnly` prop 하나로 통제.
- `localStorage` 유실 위험 → JSON 내보내기로 보완.
- 자정 넘어가며 날짜 바뀔 때 화면 자동 갱신 필요(재방문/포커스 시 오늘 날짜 재계산).
- carry-forward 시 "가장 최근 기록된 날" 판정 로직 필요(어제가 비어 있을 수 있음).

## 검증 방법

- `npm run build` / 타입체크 통과.
- `npm run dev` → `http://localhost:3001`에서 수동 확인.
