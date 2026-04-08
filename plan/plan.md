# 스크럼 플랜 — 한국어 Todo 앱 v2.0

## 프로젝트 개요

| 항목 | 내용 |
|---|---|
| 버전 목표 | v2.0 |
| 기준 문서 | [PRD](../doc/prd.md) · [Architecture](../doc/architecture.md) |
| 최종 수정 | 2026-04-08 |

---

## 스프린트 구성

스프린트 기간은 별도 지정 시까지 유연하게 운영.  
각 스프린트 완료 기준: 기능 동작 확인 + 관련 단위 테스트 통과 + 문서 반영.

---

## 백로그

### Epic 1 — 투두 텍스트 인라인 편집

> DB 스키마 변경 없음. 가장 빠르게 제공 가능한 기능.

| ID | 스토리 | 완료 기준 |
|---|---|---|
| E1-S1 | 투두 텍스트를 더블클릭하면 인라인 편집 모드로 진입한다 | 편집 input 포커스 |
| E1-S2 | Enter 또는 blur 시 변경 내용이 저장된다 | Supabase update + 낙관적 업데이트 |
| E1-S3 | Escape 키를 누르면 편집이 취소되고 원래 텍스트로 돌아간다 | 원문 복원 확인 |
| E1-S4 | 빈 텍스트로 저장 시 경고 메시지를 표시하고 저장하지 않는다 | validation 처리 |
| E1-T1 | `todo-utils.ts`에 `updateTodoText` 순수 함수 추가 및 테스트 작성 | 테스트 통과 |

---

### Epic 2 — 마크다운 & 첨부 파일

> 투두 본문을 마크다운으로 작성하고 파일을 첨부할 수 있다.

| ID | 스토리 | 완료 기준 |
|---|---|---|
| E2-S1 | 투두 본문에 마크다운 문법을 사용할 수 있고 렌더링된 형태로 표시된다 | react-markdown 렌더링 |
| E2-S2 | 편집 모드와 미리보기 모드를 전환할 수 있다 | 토글 UI |
| E2-S3 | 파일·이미지를 첨부할 수 있다 (투두당 최대 5개) | Supabase Storage 업로드 |
| E2-S4 | 이미지 첨부 시 인라인 미리보기가 표시된다 | Signed URL 이미지 |
| E2-S5 | 이미지 외 파일은 다운로드 링크로 표시된다 | Signed URL 링크 |
| E2-S6 | 투두 삭제 시 첨부 파일도 Storage에서 삭제된다 | cascade 삭제 확인 |
| E2-T1 | `todo_attachments` 테이블 마이그레이션 적용 | Supabase 스키마 반영 |
| E2-T2 | `todo-attachments` Storage 버킷 생성 및 RLS 정책 설정 | private 버킷 |
| E2-T3 | `/api/attachments` Route Handler 구현 (Signed URL 발급) | 서버 사이드 |

---

### Epic 3 — 마감일 · 긴급도 · 중요도

> 아이젠하워 매트릭스를 위한 데이터 기반 마련.

| ID | 스토리 | 완료 기준 |
|---|---|---|
| E3-S1 | 투두에 마감일을 설정하거나 해제할 수 있다 | 날짜 피커 UI |
| E3-S2 | 마감일이 지난 투두는 빨간 강조 표시된다 | 오늘 날짜 비교 |
| E3-S3 | 투두에 긴급도(높음/보통/낮음)를 설정할 수 있다 | Badge 표시 |
| E3-S4 | 투두에 중요도(높음/보통/낮음)를 설정할 수 있다 | Badge 표시 |
| E3-S5 | 긴급도·중요도 미설정도 허용된다 (null) | 기본값 없음 |
| E3-T1 | `todos` 테이블에 `due_date`, `urgency`, `importance` 컬럼 마이그레이션 | Supabase 반영 |
| E3-T2 | `todo-utils.ts`에 긴급도·중요도 관련 유틸 함수 추가 및 테스트 | 테스트 통과 |

---

### Epic 4 — 아이젠하워 매트릭스 뷰

> 긴급도(X축) × 중요도(Y축) 2×2 그리드로 투두를 시각화.

| ID | 스토리 | 완료 기준 |
|---|---|---|
| E4-S1 | 목록 뷰 ↔ 매트릭스 뷰를 전환할 수 있다 | 뷰 전환 버튼 |
| E4-S2 | 매트릭스 뷰에서 4개 사분면에 투두가 배치된다 | 긴급+중요 / 긴급+비중요 / 비긴급+중요 / 비긴급+비중요 |
| E4-S3 | 긴급도·중요도 미설정 투두는 "미분류" 영역에 표시된다 | 별도 섹션 |
| E4-S4 | 매트릭스 뷰에서도 완료 토글·삭제가 동작한다 | CRUD 동일 |
| E4-T1 | `todo-matrix.tsx` 컴포넌트 구현 | 반응형 그리드 |

---

### Epic 5 — Google Calendar 양방향 연동

> Google OAuth 사용자 전용. 마감일이 있는 투두를 캘린더와 동기화.

| ID | 스토리 | 완료 기준 |
|---|---|---|
| E5-S1 | Google OAuth scope에 `calendar.events` 권한을 추가한다 | Supabase provider 설정 |
| E5-S2 | 마감일 있는 투두에 "캘린더 연동" 버튼이 표시된다 (Google 로그인 시만) | 조건부 렌더링 |
| E5-S3 | "캘린더 연동" 클릭 시 Google Calendar에 이벤트가 생성된다 | Calendar API 확인 |
| E5-S4 | 연동된 투두에 캘린더 아이콘이 표시된다 | `calendar_event_id` 존재 여부 |
| E5-S5 | 앱에서 투두 삭제 시 연동된 캘린더 이벤트도 삭제된다 | Calendar API 확인 |
| E5-S6 | 캘린더에서 이벤트 삭제 시 앱의 투두도 삭제된다 (웹훅) | Pub/Sub 수신 확인 |
| E5-T1 | `google-calendar.ts` 래퍼 구현 (create / delete) | 서버 사이드 전용 |
| E5-T2 | `/api/calendar/events` Route Handler 구현 | POST / DELETE |
| E5-T3 | `/api/calendar/webhook` Route Handler 구현 (Pub/Sub 검증 + 삭제 처리) | 웹훅 수신 |
| E5-T4 | Google Pub/Sub 구독 설정 (캘린더 채널 등록) | 인프라 작업 |
| E5-POC | Supabase provider_token으로 Calendar API 호출 가능 여부 검증 | POC 완료 |

---

## 스프린트 현황

| 스프린트 | 에픽 | 상태 |
|---|---|---|
| Sprint 1 | Epic 1 — 텍스트 인라인 편집 | 대기 |
| Sprint 2 | Epic 2 — 마크다운 & 첨부 파일 | 대기 |
| Sprint 3 | Epic 3 — 마감일·긴급도·중요도 | 대기 |
| Sprint 4 | Epic 4 — 아이젠하워 매트릭스 뷰 | 대기 |
| Sprint 5 | Epic 5 — Google Calendar 연동 | 대기 |

---

## 완료 기준 (Definition of Done)

- [ ] 기능이 로컬(`npm run dev`)에서 정상 동작
- [ ] 관련 단위 테스트 작성 및 통과 (`npm test`)
- [ ] ESLint 경고 없음 (`npm run lint`)
- [ ] Vercel 프리뷰 배포 정상 확인
- [ ] PRD / Architecture 문서 해당 항목 반영
