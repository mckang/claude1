# ES-T1 — `todos` 테이블 `done` → `status` 마이그레이션

| 항목 | 내용 |
|---|---|
| ID | ES-T1 |
| 유형 | Task |
| 에픽 | [Epic S — 투두 상태 관리 & 칸반 보드](../epic-todo-status.md) |
| 상태 | ✅ 완료 |
| 선행 조건 | 없음 |
| 후행 태스크 | ES-T2 |

---

## 목적

현재 `done: boolean`으로 관리되는 투두 완료 여부를  
`status: text`로 교체해 4단계 상태(`waiting / active / paused / done`)를 지원한다.

---

## 마이그레이션 SQL

```sql
-- 1. status 컬럼 추가 (기존 행 기본값 'active')
ALTER TABLE todos
  ADD COLUMN status TEXT NOT NULL DEFAULT 'active'
  CHECK (status IN ('waiting', 'active', 'paused', 'done'));

-- 2. 기존 done=true 행 → 'done' 으로 전환
UPDATE todos SET status = 'done' WHERE done = true;
-- done=false 행은 DEFAULT 'active' 그대로 유지

-- 3. 신규 투두 기본값을 'waiting' 으로 변경
ALTER TABLE todos ALTER COLUMN status SET DEFAULT 'waiting';

-- 4. done 컬럼 제거
ALTER TABLE todos DROP COLUMN done;
```

---

## 체크리스트

- [x] Supabase SQL Editor에서 마이그레이션 실행
- [x] 기존 투두 데이터 상태 확인 (`done=true` → `'done'`, `done=false` → `'active'`)
- [x] 신규 투두 삽입 시 `status = 'waiting'` 기본값 확인
- [x] CHECK 제약 조건 동작 확인 (잘못된 값 삽입 시 오류)
- [x] Architecture 문서 DB 스키마 섹션 업데이트
