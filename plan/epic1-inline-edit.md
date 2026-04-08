# Epic 1 — 투두 텍스트 인라인 편집

| 항목 | 내용 |
|---|---|
| 브랜치 | `feature/epic1-inline-edit` |
| 스프린트 | Sprint 1 |
| 상태 | ✅ 완료 |
| 최종 수정 | 2026-04-08 |

---

## 태스크 목록

| # | ID | 제목 | 유형 | 상태 |
|---|---|---|---|---|
| 1 | E1-T1 | updateTodoText 순수 함수 추가 및 테스트 작성 | Task | ✅ 완료 |
| 2 | E1-S1 | 연필 아이콘 버튼으로 인라인 편집 모드 진입 | Story | ✅ 완료 |
| 3 | E1-S2 | Enter/blur 시 저장 처리 | Story | ✅ 완료 |
| 4 | E1-S3 | Escape 키로 편집 취소 | Story | ✅ 완료 |
| 5 | E1-S4 | 빈 텍스트 저장 방지 validation | Story | ✅ 완료 |

---

## 태스크 상세

### E1-T1 — updateTodoText 순수 함수 추가 및 테스트 작성
- `todo-utils.ts`에 `updateTodoText(todos, id, newText)` 순수 함수 추가
- `todo-utils.test.ts`에 단위 테스트 작성 및 통과 확인
- **완료 기준**: `npm test` 통과

### E1-S1 — 연필 아이콘 버튼으로 인라인 편집 모드 진입
- `TodoItem` 호버 시 연필(Pencil) 아이콘 버튼 노출
- 버튼 클릭 시 편집 `input`으로 전환, 기존 텍스트 채워짐 및 포커스
- 완료된 투두(`done`)는 편집 버튼 미노출
- **완료 기준**: 편집 input 포커스 확인

### E1-S2 — Enter/blur 시 저장 처리
- 편집 중 Enter 키 또는 input blur 시 Supabase `update` 호출
- 낙관적 업데이트 적용 (UI 즉시 반영 → 서버 동기화)
- **완료 기준**: Supabase DB 반영 확인

### E1-S3 — Escape 키로 편집 취소
- 편집 중 Escape 키를 누르면 편집 모드 종료
- 원래 텍스트로 복원 (저장하지 않음)
- **완료 기준**: 원문 복원 확인

### E1-S4 — 빈 텍스트 저장 방지 validation
- 편집 내용이 빈 문자열 또는 공백만인 경우 저장하지 않음
- Enter 시 에러 메시지 표시, blur 시 조용히 원문 복원
- **완료 기준**: 빈 값 저장 차단 및 메시지 노출 확인

---

## 완료 평가 (2026-04-08)

### 태스크별 판정

| ID | 판정 | 비고 |
|---|---|---|
| E1-T1 | ✅ | `updateTodoText` 구현, 8개 단위 테스트 통과 |
| E1-S1 | ✅ | 호버 시 연필 아이콘 노출, `done` 투두 편집 버튼 미노출 |
| E1-S2 | ✅ | Supabase `update` 호출 + 낙관적 업데이트 적용 |
| E1-S3 | ✅ | `cancelEdit()` 원문 복원, `committedRef`로 이중 실행 방지 |
| E1-S4 | ✅ | Enter 시 에러 메시지, blur 시 조용히 복원 |

### 테스트 / Lint

- 단위 테스트: **47 / 47 통과** (`npm test`)
- ESLint: **경고 없음** (`npm run lint`)

### 코드 품질

- `committedRef`로 Enter/blur 이중 커밋 방지 — 엣지 케이스 명확히 처리
- `aria-invalid`, `aria-describedby` 접근성 속성 적용
- `handleEdit` `useCallback` 메모이제이션

### DoD 체크리스트

- [x] 기능이 로컬(`npm run dev`)에서 정상 동작
- [x] 관련 단위 테스트 작성 및 통과 (`npm test`)
- [x] ESLint 경고 없음 (`npm run lint`)
- [ ] Vercel 프리뷰 배포 정상 확인 — 미확인
- [x] `plan.md` 스프린트 현황 업데이트

---

## 완료 기준 (Definition of Done)

- [x] 기능이 로컬(`npm run dev`)에서 정상 동작
- [x] 관련 단위 테스트 작성 및 통과 (`npm test`)
- [x] ESLint 경고 없음 (`npm run lint`)
- [ ] Vercel 프리뷰 배포 정상 확인
- [x] `plan.md` 스프린트 현황 업데이트
