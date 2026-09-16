# RFC: 저장소 레이어 async 전환 (MongoDB 이전 준비)

> 상태: 완료
> 관련 ADR: `docs/adr/0001-storage-strategy.md` / 관련 이슈: [#4 계정 · 클라우드 동기화](https://github.com/joohyuna/lecture-mini-schedule/issues/4)

## 목표

나중에 MongoDB(무료 티어)로 옮길 계획이 있지만, 로그인·서버·DB는 아직 만들지 않는다. 대신 지금 로컬(localStorage) 동작은 100% 그대로 유지하면서, **저장소 인터페이스만 미리 async로 바꿔서** 나중에 내부 구현만 API 호출로 갈아끼우면 되게 만든다.

## 범위

### Scope
- `app/lib/storage.ts`의 `loadItems` / `saveItems` / `loadFeedback` / `saveFeedback` / `loadTheme` / `saveTheme`를 `Promise`를 반환하는 함수로 전환
- `app/lib/useDiary.ts`, `app/lib/useTheme.ts`에서 위 함수들을 `await`하도록 수정
- 화면 동작(기능·UX)은 변경 없음 — 순수 리팩터

### Non-scope
- 실제 MongoDB 연결, API 라우트, 인증(로그인) — 착수 시 별도 RFC + ADR(0001을 Superseded 처리)
- `app/layout.tsx`의 첫 페인트 전 테마 적용 인라인 스크립트는 그대로 둠. FOUC 방지를 위해 React 하이드레이션 이전에 동기적으로 실행돼야 해서, storage.ts 추상화 대상이 아니고 순수 `localStorage` 직접 접근을 유지한다.
- 데이터 모델에 `userId` 등 계정 관련 필드 추가 — 아직 인증 방식이 정해지지 않아 지금 추가하면 죽은 필드가 됨. 실제 인증 도입 시점에 함께 설계.

## 접근 방식

- `storage.ts`의 각 함수를 `async function`으로 바꾸고, 내부 구현은 지금과 동일한 `localStorage` 동기 읽기/쓰기를 그대로 쓴다(그냥 `Promise`로 감싸는 것뿐).
- 호출부는 `useEffect` 안에서 `await`하도록 IIFE(`(async () => { ... })()`)로 감싸고, cleanup에서 `cancelled` 플래그로 언마운트 후 setState를 막는다.
- 저장(`save*`) 호출은 결과를 기다릴 필요가 없어 `void saveItems(...)` 형태로 fire-and-forget 유지(기존 동작과 동일).
- `buildBackup` / `parseBackup`(JSON export/import)은 저장소 I/O가 아니라 순수 변환 함수라 그대로 동기로 둠.

## 작업 단계

- [x] `app/lib/storage.ts`: 6개 함수를 async로 전환
- [x] `app/lib/useDiary.ts`: 초기 로드 effect를 async IIFE로 전환, save effect들을 `void`로 감쌈
- [x] `app/lib/useTheme.ts`: 초기 로드 effect를 async IIFE로 전환, `cycle`의 저장 호출을 `void`로 감쌈
- [x] `pnpm build` 통과 확인

## 변경 파일 목록

- `app/lib/storage.ts`
- `app/lib/useDiary.ts`
- `app/lib/useTheme.ts`

## 나중에 MongoDB를 실제로 붙일 때 할 일 (메모)

1. 인증 방식 결정 (NextAuth + OAuth vs 직접 구현 vs 매직링크) → ADR 새로 작성, `docs/adr/0001-storage-strategy.md`를 Superseded 처리
2. Next.js API Route(또는 Server Action)로 MongoDB 접근 레이어 추가 — 브라우저에서 MongoDB에 직접 접근 불가
3. `storage.ts`의 각 함수 내부만 `fetch('/api/...')` 호출로 교체. 시그니처(async, 같은 인자/반환 타입)는 그대로 유지되므로 `useDiary.ts` / `useTheme.ts`는 거의 안 건드려도 됨
4. 데이터 모델에 사용자 구분 필드 추가, 기존 localStorage 데이터를 DB로 마이그레이션하는 1회성 로직 필요
5. `.env.local`에 DB 연결 문자열/OAuth 시크릿 저장 (커밋 금지, `.gitignore`에 이미 `.env*` 포함되어 있음)

## 검증 방법

- `pnpm build` 타입체크·빌드 통과
- `pnpm dev`에서 기존처럼 항목 추가/토글/테마 전환이 새로고침 후에도 유지되는지 수동 확인
