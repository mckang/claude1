# Epic 2 — 마크다운 & 첨부 파일

| 항목 | 내용 |
|---|---|
| 브랜치 | `feature/epic2-markdown-attachments` |
| 스프린트 | Sprint 2 |
| 상태 | ✅ 완료 |
| 최종 수정 | 2026-04-08 |

---

## 태스크 목록

| # | ID | 제목 | 유형 | 상태 |
|---|---|---|---|---|
| 1 | E2-T1 | `todo_attachments` 테이블 마이그레이션 적용 | Task | ✅ 완료 |
| 2 | E2-T2 | `todo-attachments` Storage 버킷 생성 및 RLS 정책 설정 | Task | ✅ 완료 |
| 3 | E2-T3 | `/api/attachments` Route Handler 구현 (Signed URL 발급) | Task | ✅ 완료 |
| 4 | E2-S1 | 투두 본문 마크다운 렌더링 | Story | ✅ 완료 |
| 5 | E2-S2 | 편집 모드 / 미리보기 모드 전환 | Story | ✅ 완료 |
| 6 | E2-S3 | 파일·이미지 첨부 (투두당 최대 5개) | Story | ✅ 완료 |
| 7 | E2-S4 | 이미지 첨부 인라인 미리보기 | Story | ✅ 완료 |
| 8 | E2-S5 | 이미지 외 파일 다운로드 링크 표시 | Story | ✅ 완료 |
| 9 | E2-S6 | 투두 삭제 시 첨부 파일 cascade 삭제 | Story | ✅ 완료 |
| 10 | E2-S7 | 투두 추가 모달 입력창 (+ 버튼 → 모달) | Story | ✅ 완료 |

> 상태 범례: 🔲 대기 · 🟡 진행 중 · ✅ 완료

---

## 태스크 상세

### E2-T1 — `todo_attachments` 테이블 마이그레이션 적용
> 상태: ✅ 완료

- Supabase에 `todo_attachments` 테이블 생성
- 컬럼: `id`, `todo_id` (FK → `todos.id`), `file_name`, `file_path`, `file_type`, `file_size`, `created_at`
- `todo_id`에 cascade 삭제 설정
- RLS 정책: 본인 투두의 첨부 파일만 조회·삽입·삭제 가능

**체크리스트**
- [x] `todo_attachments` 테이블 생성
- [x] cascade 삭제 설정
- [x] RLS 정책 적용
- [x] Supabase 스키마 반영 확인

---

### E2-T2 — `todo-attachments` Storage 버킷 생성 및 RLS 정책 설정
> 상태: ✅ 완료

- Supabase Storage에 `todo-attachments` private 버킷 생성
- 경로 규칙: `{user_id}/{todo_id}/{file_name}`
- RLS 정책: 본인 경로(`user_id` 일치)만 업로드·삭제 허용

**체크리스트**
- [x] private 버킷 생성
- [x] RLS 업로드 정책 적용
- [x] RLS 삭제 정책 적용
- [x] 정책 정상 동작 확인

---

### E2-T3 — `/api/attachments` Route Handler 구현 (Signed URL 발급)
> 상태: ✅ 완료

- `GET /api/attachments?path=...` — Supabase Signed URL 발급 (서버 사이드)
- `DELETE /api/attachments?path=...` — Storage 파일 삭제
- 인증된 사용자만 접근 가능 (세션 검증)

**체크리스트**
- [x] `GET` Signed URL 발급 구현
- [x] `DELETE` 파일 삭제 구현
- [x] 세션 인증 검증
- [x] 서버 사이드 동작 확인

---

### E2-S1 — 투두 본문 마크다운 렌더링
> 상태: ✅ 완료

- `react-markdown` 라이브러리 도입
- 투두 본문을 마크다운으로 파싱하여 렌더링
- 지원 문법: 볼드, 이탤릭, 인라인 코드, 링크, 목록

**체크리스트**
- [x] `react-markdown` 패키지 설치
- [x] 마크다운 렌더링 컴포넌트 적용
- [x] 지원 문법 렌더링 확인

---

### E2-S2 — 편집 모드 / 미리보기 모드 전환
> 상태: ✅ 완료

- 편집 모드: textarea로 마크다운 원문 편집
- 미리보기 모드: 렌더링된 마크다운 표시
- 편집 영역 상단에 "편집" / "미리보기" 탭 UI 제공

**체크리스트**
- [x] 탭 UI 구현
- [x] 편집 모드 ↔ 미리보기 모드 전환 동작 확인

---

### E2-S3 — 파일·이미지 첨부 (투두당 최대 5개)
> 상태: ✅ 완료

- 편집 모드에서 파일 첨부 버튼 노출
- 파일 선택 시 Supabase Storage 업로드 (`{user_id}/{todo_id}/{file_name}`)
- 투두당 최대 5개 제한; 초과 시 경고 메시지 표시
- 업로드 진행 중 로딩 인디케이터 표시

**체크리스트**
- [x] 파일 첨부 버튼 UI 구현
- [x] Supabase Storage 업로드 연동
- [x] 최대 5개 제한 및 경고 메시지
- [x] 업로드 로딩 인디케이터

---

### E2-S4 — 이미지 첨부 인라인 미리보기
> 상태: ✅ 완료

- 첨부 파일 중 이미지 타입(`image/*`)은 Signed URL로 인라인 `<img>` 표시
- 미리보기 모드와 편집 모드 양쪽에서 표시

**체크리스트**
- [x] 이미지 타입 판별 로직
- [x] Signed URL 기반 `<img>` 렌더링
- [x] 편집·미리보기 양쪽 표시 확인

---

### E2-S5 — 이미지 외 파일 다운로드 링크 표시
> 상태: ✅ 완료

- 이미지가 아닌 첨부 파일은 파일명을 클릭 가능한 다운로드 링크로 표시
- Signed URL 사용 (클라이언트 Supabase Storage에서 직접 발급)

**체크리스트**
- [x] 비이미지 파일 다운로드 링크 렌더링
- [x] Signed URL 링크 클릭 시 파일 다운로드 확인

---

### E2-S6 — 투두 삭제 시 첨부 파일 cascade 삭제
> 상태: ✅ 완료

- 투두 삭제 시 `todo_attachments` 레코드와 Storage 파일 모두 삭제
- DB cascade로 레코드 삭제, Storage 삭제는 `handleRemove`에서 처리

**체크리스트**
- [x] 투두 삭제 시 Storage 파일 삭제 로직 구현
- [x] DB 레코드 cascade 삭제 확인
- [x] Storage 파일 삭제 확인

---

### E2-S7 — 투두 추가 모달 입력창
> 상태: ✅ 완료

- 헤더 우측에 `+` 버튼 배치
- 클릭 시 shadcn Dialog 모달 오픈
- 모달 내 textarea로 다중 줄 입력 지원 (마크다운 작성 가능)
- 기존 하단 고정 입력바 제거

**체크리스트**
- [x] `+` 버튼 헤더 이동
- [x] Dialog 모달 구현
- [x] textarea 입력 처리
- [x] 기존 하단 입력바 제거

---

---

## 추가 개선 (Sprint 2 완료 후)

| # | 제목 | 상태 |
|---|---|---|
| 1 | TodoFormModal 컴포넌트화 (추가/편집 통합) | ✅ 완료 |
| 2 | TodoDetailModal — 상세 조회 (마크다운 + 첨부파일 다운로드) | ✅ 완료 |
| 3 | 목록 클릭 → 상세 조회 모달 오픈 | ✅ 완료 |
| 4 | 편집 모달에서 첨부 이미지 본문 삽입 (`/api/attachments?redirect=true`) | ✅ 완료 |
| 5 | 목록 레이아웃 — 첨부 유무별 높이 일관성 (첨부 있음: 1줄+h-10 / 없음: 마크다운 3줄) | ✅ 완료 |
| 6 | 편집 모달에서 기존 첨부파일 표시 및 삭제 | ✅ 완료 |

---

## 완료 기준 (Definition of Done)

- [x] 기능이 로컬(`npm run dev`)에서 정상 동작
- [x] 관련 단위 테스트 작성 및 통과 (`npm test`) — 47 / 47 통과 (todo-utils 전 함수 커버)
- [x] ESLint 경고 없음 (`npm run lint`)
- [ ] Vercel 프리뷰 배포 정상 확인
- [x] `plan.md` 스프린트 현황 업데이트
