# CLAUDE.md

이 파일은 Claude Code가 이 프로젝트에서 작업할 때 따라야 하는 규칙과 문서 구조를 정의합니다.

---

## 1. 프로젝트 개요

<!-- 한두 문단으로 이 프로젝트가 뭘 하는지, 핵심 기술 스택이 뭔지 적어주세요 -->

- **목적**:
- **기술 스택**:
- **주요 진입점**: (예: `src/main.ts`, `app/main.py`)

---

## 2. 문서 구조 (Documentation Structure)

작업 성격에 따라 아래 위치에 문서를 만들고 참조합니다.

```
docs/
├── prd/            # 제품 요구사항 (Why / What) — 기능 작업 전 확인
├── architecture/
│   └── ARCHITECTURE.md   # 현재 시스템 구조 스냅샷 — 최신 상태 유지
├── adr/            # 개별 기술 결정 기록 (append-only)
└── rfcs/           # 기능별 구현 계획 (Plan 모드 산출물)
```

| 문서 | 질문 | 갱신 빈도 |
|---|---|---|
| PRD | 무엇을/왜 만드는가 (제품 관점) | 기능 시작 시 1회 |
| ARCHITECTURE.md | 전체 구조가 지금 어떤가 | 구조 변경 시마다 |
| ADR | 이 결정을 왜 이렇게 내렸나 | append-only, 결정마다 새 파일 |
| RFC/Plan | 이번 작업을 어떻게 구현하나 | 작업 단위마다 |

---

## 3. 워크플로우 (신규 기능 작업 시)

1. `docs/prd/`에 관련 PRD가 있는지 먼저 확인한다. 없으면 요구사항을 먼저 명확히 한다.
2. Plan 모드로 기술 접근 방식을 논의하고, 결과를 `docs/rfcs/<기능명>.md`로 정리한다.
    - RFC에는 목표, 범위(Scope/Non-scope), 접근 방식, 체크박스 작업 단계, 변경 파일 목록, 리스크, 검증 방법을 포함한다.
3. RFC 안에서 중요한 기술적 갈림길(A vs B 선택 등)이 있으면 `docs/adr/000X-제목.md`로 별도 분리한다.
    - ADR 포맷: Status / Context / Decision / Consequences
    - 결정이 바뀌면 새 ADR을 만들고 이전 ADR의 Status를 `Superseded by ADR-00XX`로 변경한다. 기존 ADR은 수정하지 않는다.
4. 작업이 전체 구조에 영향을 준다면 `docs/architecture/ARCHITECTURE.md`를 갱신한다.
5. 작업 완료 후 관련 GitHub Issue 상태를 갱신한다 (아래 4번 참고).

---

## 4. GitHub Issue 워크플로우

- 작업 시작 전: `gh issue list`로 관련 이슈가 이미 있는지 확인한다.
- RFC 완료 후: 작업을 단위별로 쪼개서 `gh issue create`로 등록한다.
- 커밋/PR에는 관련 이슈를 `Closes #N` 형식으로 연결한다.
- 라벨 규칙: `bug` / `feature` / `refactor` / `chore` 중 최소 하나를 지정한다.

---

## 5. 코드 스타일 / 컨벤션

<!-- 프로젝트에 맞게 채워주세요 -->

- 커밋 메시지 규칙: (예: Conventional Commits — `feat:`, `fix:`, `refactor:`)
- 브랜치 전략: (예: `feature/`, `fix/` 프리픽스 + PR 필수)
- 테스트: (예: 새 기능은 반드시 단위 테스트 동반, `npm test`로 확인)
- 린트/포맷: (예: 커밋 전 `npm run lint` 통과 필수)

---

## 6. 하지 말아야 할 것 (Guardrails)

<!-- 프로젝트 특성에 맞게 채워주세요. 예시: -->

- `docs/adr/`에 있는 파일은 직접 수정하지 않는다 (append-only).
- 사람 확인 없이 `main`/`master` 브랜치에 직접 푸시하지 않는다.
- 프로덕션 환경변수나 시크릿이 포함된 파일은 커밋하지 않는다.
- 스코프 밖(RFC의 Non-scope에 명시된) 작업은 별도 이슈로 분리하고, 현재 작업에 포함하지 않는다.

---

## 7. 참고 링크

- 아키텍처 현황: `docs/architecture/ARCHITECTURE.md`
- 진행 중인 ADR 목록: `docs/adr/`
- 이슈 트래커: (GitHub Issues URL)