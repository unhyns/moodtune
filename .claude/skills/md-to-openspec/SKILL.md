---
name: md-to-openspec
description: planning/md-design 문서를 읽어 Must 요구사항을 추출하고, OpenSpec change 초안(목적/proposal/spec/design/tasks)을 정리해 /opsx:propose에 넘길 입력 파일을 만듭니다. 사용자가 "OpenSpec으로 변환해줘", "md-to-openspec 실행해줘", "/opsx:propose 입력 만들어줘"처럼 명시적으로 요청했을 때만 사용하세요.
---

# MD to OpenSpec

## 역할
`planning/md-design/`의 설계 문서를 OpenSpec 워크플로우의 change 제안으로 옮기기 위한 **중간 산출물**을 만든다. `openspec/` 디렉토리를 직접 만들거나 수정하지 않고, `/opsx:propose`에 그대로 넘길 수 있는 입력 문서 한 개를 준비하는 것까지가 이 Skill의 역할이다. `/opsx:propose` 실행 자체는 이 Skill의 범위 밖이며, 준비가 끝나면 사용자가 별도로 호출한다.

## 언제 사용하는가
- 사용자가 명시적으로 요청했을 때만 실행한다 (예: "OpenSpec으로 변환해줘", "md-to-openspec 실행해줘", "/opsx:propose 입력 만들어줘").
- 다른 작업 도중 자동으로 제안하거나 실행하지 않는다.

## 실행 절차

### 1. MD 설계 문서 읽기
`planning/md-design/01_PRODUCT_BRIEF.md` → `02_REQUIREMENTS_SPEC.md` → `03_UX_UI_SPEC.md` → `04_TECHNICAL_DESIGN.md` → `05_DELIVERY_PLAN.md` 순서로 5개 파일을 모두 읽는다. 이 5개 외 문서(`docs/`, `CLAUDE.md` 등)는 참고하지 않는다.

### 2. Must 요구사항 추출
`02_REQUIREMENTS_SPEC.md`의 기능 요구사항 표에서 우선순위가 **Must**인 FR만 추출한다. Should/Could 항목은 본문에 넣지 않고 "이번 change에서 제외" 목록으로만 별도 표기한다.
- Must 항목이 6개를 넘으면, 산출물 맨 위에 `⚠️ Must 항목이 N개로 많음 — change 분리를 고려하세요`라는 경고 한 줄을 남긴다. 경고는 진행을 막지 않는다.

### 3. Change의 목적 정리
`01_PRODUCT_BRIEF.md`의 문제 정의·핵심 가치를 근거로, 추출된 Must 요구사항이 왜 필요한지 2~3문장으로 정리한다 (OpenSpec proposal의 **Why**에 해당).

### 4. Proposal 후보 정리
목적 + Must 요구사항을 바탕으로 **Why / What Changes / Impact** 형식의 proposal 후보를 정리한다. `Impact`에는 `04_TECHNICAL_DESIGN.md` 기준으로 영향받는 라우트·컴포넌트·데이터 모델을 나열한다.

### 5. Spec 요구사항 정리
Must FR 각각을 OpenSpec spec delta 형식으로 변환한다 (`### Requirement: ...` + `#### Scenario: ...`). `02`의 인수조건을 Scenario의 근거로 사용한다. 신규 capability이므로 전부 **ADDED Requirements**로 표기한다.

### 6. Design 결정사항 정리
`04_TECHNICAL_DESIGN.md`에서 **이미 확정된** 결정사항만 뽑는다 (Route, Data Model, State, Storage, FR-12 검증 로직 등). 문서에 TODO/Open Question으로 남아있는 항목은 design 후보에 포함하지 않고, "미정 — 착수 전 확정 필요" 목록으로 따로 표기한다.

### 7. Tasks 단위 제안
`05_DELIVERY_PLAN.md`의 작업 체크리스트를 참고해 Must 요구사항 구현에 필요한 작업을 OpenSpec `tasks.md` 스타일 체크리스트(`- [ ] 1.1 ...`)로 재구성한다. 이미 완료 표시된 작업은 제외하고 남은 작업만 포함한다.

### 8. `/opsx:propose`용 입력 생성
2~7단계 결과를 하나의 마크다운 문서로 합쳐 `planning/openspec-input/<change-slug>.md`에 저장한다.
- `<change-slug>` 기본값: `moodtune-mvp-must`
- 동일 이름 파일이 이미 있으면 덮어쓸지 새 이름을 쓸지 사용자에게 확인한다.
- 이 파일이 `/opsx:propose`에 전달할 최종 입력이다.

## 출력 형식
```
# OpenSpec Change 입력 초안: <change-slug>

(⚠️ Must 항목 과다 경고 — 해당 시에만)

## 1. 목적 (Why)
...

## 2. Proposal 후보
### Why
### What Changes
### Impact

## 3. Spec 요구사항 (ADDED Requirements)
### Requirement: ...
#### Scenario: ...

## 4. Design 결정사항
(확정된 것만)

### 미정 — 착수 전 확정 필요
(TODO/Open Question 목록)

## 5. Tasks 제안
- [ ] 1.1 ...

## 이번 change에서 제외 (Should/Could)
(FR 목록)
```

## 하지 말아야 할 행동
- `openspec/` 디렉토리의 어떤 파일도 만들거나 수정하지 않는다 — 그건 `/opsx:propose`의 역할이다.
- `/opsx:propose`를 대신 실행하지 않는다 — 입력 파일 생성까지만 한다.
- `planning/md-design/` 원본 문서를 수정하지 않는다.
- Should/Could 요구사항을 임의로 Must에 끼워 넣지 않는다 — 02에 명시된 우선순위를 그대로 따른다.
- 04에서 TODO/Open Question으로 남은 항목을 확정된 design 결정처럼 서술하지 않는다.
- 사용자의 명시적 요청 없이 자동으로 실행하지 않는다.
