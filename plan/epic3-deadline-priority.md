# Epic 3 — 마감일 · 긴급도 · 중요도

| 항목 | 내용 |
|---|---|
| 브랜치 | `feature/epic3-deadline-priority` |
| 스프린트 | Sprint 3 |
| 상태 | ✅ 완료 |
| 최종 수정 | 2026-04-08 |

---

## 태스크 목록

| # | ID | 제목 | 유형 | 상태 |
|---|---|---|---|---|
| 1 | E3-T1 | `todos` 테이블에 `due_date`, `urgency`, `importance` 컬럼 마이그레이션 | Task | ✅ 완료 |
| 2 | E3-T2 | `todo-utils.ts`에 긴급도·중요도 유틸 함수 추가 및 테스트 작성 | Task | ✅ 완료 |
| 3 | E3-S1 | 마감일 설정 및 해제 | Story | ✅ 완료 |
| 4 | E3-S2 | 마감일 초과 투두 빨간 강조 표시 | Story | ✅ 완료 |
| 5 | E3-S3 | 긴급도 설정 (높음/보통/낮음) | Story | ✅ 완료 |
| 6 | E3-S4 | 중요도 설정 (높음/보통/낮음) | Story | ✅ 완료 |
| 7 | E3-S5 | 긴급도·중요도 미설정 허용 (null) | Story | ✅ 완료 |

> 상태 범례: 🔲 대기 · 🟡 진행 중 · ✅ 완료

---

## 태스크 상세

### E3-T1 — `todos` 테이블 마이그레이션
> 상태: ✅ 완료

- `todos` 테이블에 3개 컬럼 추가
  - `due_date DATE NULL` — 마감일 (날짜만, 시간 없음)
  - `urgency SMALLINT NULL CHECK (urgency IN (1,2,3))` — 긴급도 (1=낮음, 2=보통, 3=높음)
  - `importance SMALLINT NULL CHECK (importance IN (1,2,3))` — 중요도 (1=낮음, 2=보통, 3=높음)
- 기존 투두 레코드는 세 컬럼 모두 `NULL`로 유지
- RLS 정책 변경 없음 (기존 `todos` 테이블 정책 그대로 적용)

**체크리스트**
- [x] `due_date` 컬럼 추가
- [x] `urgency` 컬럼 추가 (CHECK 제약)
- [x] `importance` 컬럼 추가 (CHECK 제약)
- [x] Supabase 마이그레이션 적용 확인
- [x] `Todo` 타입에 새 컬럼 반영 (`todo-utils.ts`)

---

### E3-T2 — `todo-utils.ts` 유틸 함수 추가 및 테스트
> 상태: ✅ 완료

- `isOverdue(dueDate: string | null): boolean` — 오늘 날짜와 비교하여 초과 여부 반환
- `formatDueDate(dueDate: string | null): string` — `YYYY-MM-DD` → `M월 D일` 형식 변환
- `urgencyLabel(urgency: number | null): string` — 1/2/3 → '낮음'/'보통'/'높음' 변환
- `importanceLabel(importance: number | null): string` — 1/2/3 → '낮음'/'보통'/'높음' 변환
- `urgencyColor(urgency: number | null): string` — Badge 색상 클래스 반환
- `importanceColor(importance: number | null): string` — Badge 색상 클래스 반환
- 각 함수에 대한 단위 테스트 작성 (`todo-utils.test.ts`)

**체크리스트**
- [x] `isOverdue` 구현 및 테스트 (경계값: 오늘, 어제, 내일, null)
- [x] `formatDueDate` 구현 및 테스트
- [x] `urgencyLabel` / `importanceLabel` 구현 및 테스트
- [x] `urgencyColor` / `importanceColor` 구현 및 테스트
- [x] `npm test` 전체 통과 확인 — 72 / 72

---

### E3-S1 — 마감일 설정 및 해제
> 상태: ✅ 완료

**사용자 스토리**  
투두 편집 모달에서 날짜 피커로 마감일을 설정하거나 해제할 수 있다.

**구현 세부사항**
- `TodoFormModal` 편집 모달에 날짜 피커(`<input type="date">`) 추가
- 마감일 선택 시 `due_date` 필드 업데이트 (Supabase + 낙관적 업데이트)
- "해제" 버튼 또는 날짜 클리어로 `due_date = null` 저장
- 투두 목록 아이템에 마감일 표시 (예: `5월 3일`)

**완료 기준**
- 편집 모달에서 날짜 선택 → 저장 후 목록에 마감일 표시 확인
- 마감일 해제 후 저장 → 목록에서 마감일 미표시 확인
- Supabase DB `due_date` 컬럼 값 반영 확인

**체크리스트**
- [x] `TodoFormModal`에 날짜 피커 UI 추가
- [x] 날짜 저장 (`updateTodo` Supabase 호출) 연동
- [x] 마감일 해제 처리 (null 저장)
- [x] 투두 목록 아이템에 마감일 표시

---

### E3-S2 — 마감일 초과 투두 빨간 강조 표시
> 상태: ✅ 완료

**사용자 스토리**  
마감일이 오늘보다 이전인 투두는 마감일 텍스트 및 아이템이 빨간색으로 강조 표시된다.

**구현 세부사항**
- `isOverdue()` 유틸 함수 사용
- 투두 아이템에서 `due_date`가 오늘 날짜보다 이전이면 마감일 텍스트에 `text-red-500` 적용
- 완료된 투두(`done=true`)는 초과 표시 제외

**완료 기준**
- 마감일이 어제인 투두 → 빨간 강조 표시 확인
- 마감일이 오늘인 투두 → 강조 표시 없음 확인
- 완료 투두는 마감일 초과 표시 없음 확인

**체크리스트**
- [x] `TodoItem` 컴포넌트에 초과 여부 판별 로직 적용
- [x] 초과 시 마감일 텍스트 빨간색 스타일 적용
- [x] 완료 투두 예외 처리

---

### E3-S3 — 긴급도 설정 (높음/보통/낮음)
> 상태: ✅ 완료

**사용자 스토리**  
투두 편집 모달에서 긴급도(높음/보통/낮음)를 선택할 수 있고, 투두 아이템에 Badge로 표시된다.

**구현 세부사항**
- 편집 모달에 긴급도 선택 UI 추가 (세그먼트 버튼 또는 Select)
  - 높음 (3) / 보통 (2) / 낮음 (1) / 미설정
- 선택 값을 `urgency` 컬럼에 저장 (Supabase + 낙관적 업데이트)
- 투두 목록 아이템에 긴급도 Badge 표시
  - 높음: `bg-red-100 text-red-700`
  - 보통: `bg-yellow-100 text-yellow-700`
  - 낮음: `bg-green-100 text-green-700`

**완료 기준**
- 긴급도 선택 → 저장 후 목록 Badge 표시 확인
- Supabase DB `urgency` 컬럼 값 반영 확인

**체크리스트**
- [x] 편집 모달에 긴급도 선택 UI 추가
- [x] `urgency` 저장 연동
- [x] 투두 아이템 긴급도 Badge 렌더링
- [x] Badge 색상 적용 확인

---

### E3-S4 — 중요도 설정 (높음/보통/낮음)
> 상태: ✅ 완료

**사용자 스토리**  
투두 편집 모달에서 중요도(높음/보통/낮음)를 선택할 수 있고, 투두 아이템에 Badge로 표시된다.

**구현 세부사항**
- 편집 모달에 중요도 선택 UI 추가 (긴급도와 동일한 패턴)
  - 높음 (3) / 보통 (2) / 낮음 (1) / 미설정
- 선택 값을 `importance` 컬럼에 저장 (Supabase + 낙관적 업데이트)
- 투두 목록 아이템에 중요도 Badge 표시
  - 높음: `bg-purple-100 text-purple-700`
  - 보통: `bg-blue-100 text-blue-700`
  - 낮음: `bg-gray-100 text-gray-700`

**완료 기준**
- 중요도 선택 → 저장 후 목록 Badge 표시 확인
- Supabase DB `importance` 컬럼 값 반영 확인

**체크리스트**
- [x] 편집 모달에 중요도 선택 UI 추가
- [x] `importance` 저장 연동
- [x] 투두 아이템 중요도 Badge 렌더링
- [x] Badge 색상 적용 확인

---

### E3-S5 — 긴급도·중요도 미설정 허용
> 상태: ✅ 완료

**사용자 스토리**  
긴급도와 중요도는 반드시 설정하지 않아도 된다. 미설정 시 Badge가 표시되지 않는다.

**구현 세부사항**
- 긴급도/중요도 선택 UI에 "미설정" 옵션 기본값으로 제공
- `urgency = null`, `importance = null` 저장 허용
- 미설정 투두는 해당 Badge 미렌더링
- 투두 추가 시 기본값 `null` (선택 강요 없음)

**완료 기준**
- 새 투두 추가 시 긴급도·중요도 Badge 미표시 확인
- 설정 후 미설정으로 변경 → Badge 사라짐 확인
- Supabase DB `urgency`, `importance` = `NULL` 저장 확인

**체크리스트**
- [x] 선택 UI 기본값 "미설정" 처리
- [x] null 값 Supabase 저장 확인
- [x] 미설정 시 Badge 미렌더링 확인

---

## 완료 기준 (Definition of Done)

- [x] 기능이 로컬(`npm run dev`)에서 정상 동작
- [x] 관련 단위 테스트 작성 및 통과 (`npm test`) — 72 / 72
- [x] ESLint 경고 없음 (`npm run lint`)
- [ ] Vercel 프리뷰 배포 정상 확인
- [x] `plan.md` 스프린트 현황 업데이트
