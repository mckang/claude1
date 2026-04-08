# ES-S6 — 리스트 뷰 상태 Badge 표시

| 항목 | 내용 |
|---|---|
| ID | ES-S6 |
| 유형 | Story |
| 에픽 | [Epic S — 투두 상태 관리 & 칸반 보드](../epic-todo-status.md) |
| 상태 | ✅ 완료 |
| 선행 조건 | ES-T2 완료 |
| 후행 스토리 | 없음 |

---

## 사용자 스토리

> 리스트 뷰의 각 투두 아이템에 현재 상태(대기/진행/중지/종료)가 Badge로 표시된다.

---

## 구현 세부사항

**Badge 위치**  
긴급도·중요도 Badge와 동일한 영역 (투두 텍스트 하단, 왼쪽 정렬)  
상태 Badge를 가장 앞에 배치.

**Badge 색상 (`statusColor` 반환값)**

| 상태 | 라벨 | 클래스 |
|---|---|---|
| `waiting` | 대기 | `bg-zinc-100 text-zinc-600` |
| `active` | 진행 | `bg-blue-100 text-blue-700` |
| `paused` | 중지 | `bg-amber-100 text-amber-700` |
| `done` | 종료 | `bg-green-100 text-green-700` |

**렌더링 예시**
```tsx
<span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(todo.status)}`}>
  {statusLabel(todo.status)}
</span>
```

**낙관적 업데이트 연동**  
체크박스 토글(ES-S4) 또는 칸반 드래그(ES-S3)로 상태 변경 시  
Badge가 즉시 반영되어야 함 → `todo.status` prop 의존이므로 별도 처리 불필요.

---

## 완료 기준

- 리스트 뷰 각 투두 아이템에 상태 Badge가 표시된다
- Badge 색상이 상태에 따라 올바르게 적용된다
- 상태 변경(체크박스, 칸반 드래그) 후 Badge가 즉시 반영된다

---

## 체크리스트

- [x] `statusLabel` / `statusColor` 유틸 사용 준비 확인 (ES-T2 의존)
- [x] `TodoItem` 컴포넌트에 상태 Badge 렌더링 추가
- [x] Badge 색상 4개 상태 전체 확인
- [x] 상태 변경 후 Badge 즉시 반영 확인
