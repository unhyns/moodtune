## Context

`add-moodtune-mvp`(별도 change)가 정의한 Spotify 인증(stateless 서명 쿠키)과 AI 추천 흐름 위에 얹히는 기능이다. 현재 프로젝트는 영구 데이터베이스가 없고(`planning/md-design/04_TECHNICAL_DESIGN.md` §6), 별도의 앱 자체 사용자 테이블·로그인 시스템도 두지 않는다(같은 문서 §9, "커스텀 인증 시스템 없음"). 동기는 proposal.md - Why 참고.

## Goals / Non-Goals

**Goals:**
- 기존 "커스텀 인증 시스템 없음" 원칙을 지키면서, 사용자별로 히스토리를 안전하게 구분해 저장한다.
- 기분·날짜 필터링이 자연스러운 저장 구조를 선택한다.

**Non-Goals:**
- 히스토리 데이터의 내보내기·백업·삭제 정책은 다루지 않는다.
- 여러 기기 간 실시간 동기화는 다루지 않는다.
- `add-moodtune-mvp`의 인증·추천 로직 자체를 수정하지 않는다 — 그 change가 만드는 `/api/recommend` 흐름에서 이 change의 히스토리 생성 로직을 호출하는 연동 지점만 추가한다.

## Decisions

### 1. 저장소: 호스팅형 관계형 DB(예: Vercel Postgres) 신규 도입
`04_TECHNICAL_DESIGN.md`의 "DB 없음" 결정을 이 기능을 위해 뒤집는다. 기분·날짜 범위로 필터링하는 쿼리는 관계형 DB에서 자연스럽고, `add-moodtune-mvp`가 가정한 Vercel 배포와 바로 통합된다. 대안으로 Vercel KV(키-값 저장소)를 검토했으나 다중 필드 필터링(기분 AND 날짜 범위)에 부적합해 기각했다. Firebase 등 외부 문서 DB도 검토했으나, 이번 학생 프로젝트 범위에서 새 벤더를 늘리기보다 이미 가정된 배포 플랫폼(Vercel)과 통합되는 선택을 우선했다.

### 2. 사용자 식별: 별도 사용자 테이블 없이 Spotify user ID를 소유자 키로 사용
새 사용자 테이블·로그인 시스템을 만들면 "커스텀 인증 시스템 없음" 원칙에 위배된다. 대신 로그인 시 Spotify `/me` API로 얻은 Spotify user ID를 세션 쿠키에 함께 저장해두고, 이를 히스토리 항목의 소유자 키로 사용한다.

### 3. 히스토리 상태 값: `recorded`(기본) → `played` | `saved` | `dismissed`
추천이 생성되는 시점에는 사용자가 아직 아무 행동도 하지 않았으므로 중립적인 기본 상태(`recorded`)를 두고, 이후 사용자가 played/saved/dismissed 중 하나로 전환한다. 생성 시점에 3가지 상태 중 하나를 강제하는 방법도 검토했으나, 추천 생성과 사용자 행동을 같은 이벤트로 취급하게 되어 부정확하다고 판단해 기각했다.

### 4. API 형태
- `GET /api/history?mood=<mood>&from=<date>&to=<date>`: 목록 조회 + 필터
- `POST /api/history`: 히스토리 항목 생성 (내부적으로 `add-moodtune-mvp`의 `/api/recommend` 성공 시 호출)
- `PATCH /api/history/:id`: 상태 변경

## Risks / Trade-offs

- [신규 DB 도입] → 배포·환경 변수·마이그레이션 관리가 새로 필요해져 운영 복잡도가 늘어난다. **Mitigation**: 테이블 하나(단일 `history_entries`)로 스키마를 최소화한다.
- [`add-moodtune-mvp`와의 구현 순서 의존] → "추천 생성 시 히스토리 기록" 요구사항은 `add-moodtune-mvp`의 `/api/recommend`가 실제로 존재해야 연동할 수 있다. **Mitigation**: tasks.md에서 `add-moodtune-mvp`의 `/api/recommend` 완료를 선행 조건으로 명시한다.
- [Spotify user ID를 소유자 키로 사용] → Spotify 계정을 재연동하거나 토큰 구조가 바뀌면 소유자 식별에 영향을 줄 수 있다. **Mitigation**: user ID는 Spotify가 발급하는 안정적인 식별자이므로 토큰 갱신과 무관하게 유지된다.

## Migration Plan

그린필드 기능이므로 기존 데이터 마이그레이션은 없다. 신규 DB와 `history_entries` 테이블을 새로 생성하는 것으로 시작한다.

## Open Questions

- 히스토리 보관 기간(무기한 보관 vs 일정 기간 후 삭제)은 스펙·접근 방식·작업 분해를 바꾸지 않으므로 이후에 정해도 안전하다.
