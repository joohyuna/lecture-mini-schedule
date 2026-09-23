# ADR-0002: MongoDB Atlas + Auth.js Credentials 로그인 채택

- Status: Accepted
- Date: 2026-09-23
- Supersedes: `docs/adr/0001-storage-strategy.md`

## Context

`docs/adr/0001-storage-strategy.md`는 v1 시점에 "개인용·단일 기기"라는 전제로 localStorage를 채택했고, "재검토 시점: 여러 기기에서 같은 다이어리를 봐야 할 때"를 명시해뒀다. 이제 그 조건이 실제로 발생했다 — 집/회사 등 여러 기기를 오가며 같은 다이어리를 보고 싶다는 요구(GitHub 이슈 #4)가 생겼다.

`docs/rfcs/mini-diary-v2-async-storage-prep.md`가 이미 저장소 레이어를 async 인터페이스로 바꿔뒀고, "나중에 MongoDB를 실제로 붙일 때 할 일"로 인증 방식 결정을 남겨뒀다. 마침 같은 개발자가 거의 동일한 스택(Next.js 16 + Prisma + MongoDB Atlas + Auth.js v5)으로 구축해 실제 운영 중인 형제 프로젝트 `todo`가 있어, 그 프로젝트에서 이미 검증된 결정을 그대로 재사용하기로 했다.

## Decision

**MongoDB Atlas(Prisma 경유) + Auth.js v5 Credentials 로그인을 채택한다.**

- **DB**: MongoDB Atlas. `todo` 프로젝트와 **같은 Atlas 클러스터**를 재사용하고, `DATABASE_URL`의 DB 이름만 `mini-diary`로 분리한다. 클러스터(서버) 하나 안에 여러 DB를 두는 것은 완전히 격리되므로 새 클러스터를 만들 이유가 없다.
- **ORM**: Prisma **6.19.3에 고정**(devDependency `prisma`, dependency `@prisma/client` 모두). Prisma 7.x는 이 작업 시점에 아직 MongoDB provider를 지원하지 않는다 — `todo` 프로젝트에서 이미 겪은 문제라 버전을 검증 없이 올리지 않는다.
- **인증**: Auth.js v5(`next-auth` 5.0.0-beta.32)의 Credentials provider + `bcryptjs` 해시, JWT 세션 전략. OAuth(Google 등)는 도입하지 않는다 — 이메일/비밀번호만으로 충분하고 외부 공급자 연동은 이 시점에 불필요한 복잡도다.
- **회원가입은 공개 `/register` 페이지로 둔다.** 지금은 사용자 본인만 쓰지만, 데이터가 계정별로 완전히 분리되므로 공개 가입 자체는 안전하고, 나중에 다른 사용자가 필요해져도 바로 쓸 수 있다.
- **날짜는 계속 `"YYYY-MM-DD"` 문자열로 저장한다(Prisma `DateTime` 아님).** 서버(UTC)·클라이언트(로컬 타임존) 간 날짜 계산 불일치로 인한 버그를 피하기 위함 — `todo` 프로젝트가 같은 이유로 이미 내린 결론과 동일하다.
- **`DiaryItem`/`DayFeedback`의 id는 MongoDB 네이티브 ObjectId를 쓰지 않는다.** 클라이언트가 생성한 `crypto.randomUUID()` 문자열을 그대로 `_id`로 받아들이도록 Prisma 스키마에서 `@db.ObjectId`를 뺐다. `app/lib/useDiary.ts`가 이 id로 항목을 참조(toggle/edit/delete)하는데, 서버가 id를 재발급하면 이 훅을 손대야 해서다. `User.id`는 클라이언트가 참조하지 않으므로 서버 생성 ObjectId를 그대로 쓴다.
- **저장 방식은 "전체 로드 / 전체 교체"를 유지한다.** 항목 단위 REST(POST/PATCH/DELETE)가 아니라, `GET`은 사용자의 전체 데이터를, `PUT`은 전체 교체를 한다 — localStorage 시절의 시맨틱을 그대로 유지해 `useDiary.ts`를 한 줄도 바꾸지 않기 위해서다. `PUT`은 Prisma `$transaction([deleteMany, createMany])`로 구현한다. 이건 멀티 도큐먼트 트랜잭션이라 MongoDB가 레플리카셋이어야 동작하는데, **Atlas M0(무료 티어)는 기본적으로 3-노드 레플리카셋**이라 별도 설정 없이 바로 된다.

## Consequences

- 장점: 여러 기기에서 같은 계정으로 로그인하면 같은 다이어리를 볼 수 있다. 이미 검증된 패턴(`todo` 프로젝트)을 재사용해 리스크가 낮다. `useDiary.ts`/`app/page.tsx`/`app/layout.tsx`를 건드리지 않아 기존 UI 로직을 재검증할 필요가 없다.
- 단점: 서버/DB/인증이 생기면서 v1의 "설정 0, 오프라인 동작" 장점을 잃는다. 로그인 세션이 없으면 앱을 아예 못 쓴다(오프라인 우선이 아님). `AUTH_SECRET`/`DATABASE_URL` 같은 시크릿 관리가 새로 필요해졌다.
- "전체 로드/전체 교체" 방식은 항목이 많아지거나 여러 탭/기기에서 동시에 편집하면 마지막에 저장한 쪽이 이전 편집을 덮어쓸 수 있다(localStorage 시절부터 있던 한계이며 이번에 새로 생긴 문제는 아니다). 실사용에서 문제가 되면 항목 단위 REST로 재설계 — 그때 이 ADR을 Superseded 처리.
- 기존 localStorage 데이터는 자동으로 옮겨지지 않는다. 사용자가 배포 전 "JSON 내보내기"로 백업하고, 로그인 후 "JSON 가져오기"로 복원해야 한다(수동 1회성 단계).
- `docs/adr/0001-storage-strategy.md`는 이 ADR로 대체된다. 0001 자체는 append-only 원칙에 따라 수정하지 않고 그대로 남긴다 — 당시엔 맞는 결정이었다는 기록으로서의 가치가 있다.
- 재검토 시점: 다중 사용자 동시 편집이 실제로 필요해지거나, MongoDB Atlas 요금이 부담되거나, Prisma 7.x의 MongoDB provider가 안정화되면 다시 검토한다.
