# ES-S5 — 사이드바 필터 5개로 확장

| 항목 | 내용 |
|---|---|
| ID | ES-S5 |
| 유형 | Story |
| 에픽 | [Epic S — 투두 상태 관리 & 칸반 보드](../epic-todo-status.md) |
| 상태 | ✅ 완료 |
| 선행 조건 | ES-T2 완료, ES-S1 완료 |
| 후행 스토리 | 없음 |

---

## 사용자 스토리

> 사이드바에서 전체 / 대기 / 진행 / 중지 / 종료 5가지 필터로 투두 목록을 필터링할 수 있다.

---

## 구현 세부사항

**`FILTERS` 배열 변경**
```ts
// 기존 (3개)
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',    label: '전체' },
  { key: 'active', label: '진행중' },
  { key: 'done',   label: '완료' },
]

// 변경 (5개)
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',     label: '전체' },
  { key: 'waiting', label: '대기' },
  { key: 'active',  label: '진행' },
  { key: 'paused',  label: '중지' },
  { key: 'done',    label: '종료' },
]
```

**필터별 카운트 계산**
```ts
function getCountByFilter(todos: Todo[], key: Filter): number {
  if (key === 'all') return todos.length
  return todos.filter((t) => t.status === key).length
}
```

**헤더 타이틀 변경**
```ts
const FILTER_TITLE: Record<Filter, string> = {
  all:     '전체',
  waiting: '대기',
  active:  '진행',
  paused:  '중지',
  done:    '종료',
}
// h1: `${FILTER_TITLE[filter]} 할 일`
```

**칸반 뷰 필터 연동**  
칸반 뷰에서 `filter !== 'all'`이면 해당 상태 컬럼만 표시 (나머지 컬럼 숨김).  
`filter === 'all'`이면 4개 컬럼 모두 표시.

---

## 완료 기준

- 사이드바에 5개 필터 버튼이 렌더링된다
- 각 필터 버튼 우측에 해당 상태 투두 수가 표시된다
- 필터 선택 시 리스트 뷰에서 해당 상태 투두만 표시된다
- 필터 선택 시 칸반 뷰에서 해당 컬럼만 표시된다 (`all`은 4개 모두)
- 헤더 타이틀이 선택된 필터에 맞게 변경된다

---

## 체크리스트

- [x] `FILTERS` 배열 5개로 수정
- [x] 필터별 카운트 계산 로직 추가
- [x] 헤더 타이틀 필터 연동
- [x] 칸반 뷰 필터 연동 (해당 컬럼만 표시)
- [x] 리스트 뷰 필터 동작 확인
