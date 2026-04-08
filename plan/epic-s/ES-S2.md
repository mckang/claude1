# ES-S2 — 칸반 보드 4컬럼 렌더링

| 항목 | 내용 |
|---|---|
| ID | ES-S2 |
| 유형 | Story |
| 에픽 | [Epic S — 투두 상태 관리 & 칸반 보드](../epic-todo-status.md) |
| 상태 | ✅ 완료 |
| 선행 조건 | ES-S1 완료 |
| 후행 스토리 | ES-S3 |

---

## 사용자 스토리

> 칸반 보드 뷰에서 대기/진행/중지/종료 4개 컬럼이 나란히 표시되고,  
> 각 컬럼에 해당 상태의 투두 카드가 배치된다.

---

## 구현 세부사항

**컴포넌트 구조**  
`todo-app.tsx` 내부에 정의 (별도 파일 분리 없음)

```
KanbanBoard
└── KanbanColumn × 4  (대기 / 진행 / 중지 / 종료)
    └── KanbanCard × n
```

**KanbanBoard**
- `todos`와 `filter`를 props로 받아 상태별로 그룹핑
- 레이아웃: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`
- 전체 높이 내 스크롤: 각 컬럼 독립 스크롤
- **카드 정렬**: 긴급도 내림차순 → (동률 시) 중요도 내림차순.  
  `null`(미설정)은 0으로 취급되어 맨 뒤로 정렬된다.

**KanbanColumn**

| Props | 타입 | 설명 |
|---|---|---|
| `status` | `TodoStatus` | 컬럼 상태 |
| `todos` | `Todo[]` | 해당 상태 투두 목록 |
| `...handlers` | — | 편집·삭제·상태변경 콜백 |

- 컬럼 헤더: 상태 라벨 + 투두 수 Badge (`statusColor` 사용)
- 컬럼 배경: `bg-zinc-900 rounded-xl p-3`
- 빈 컬럼: "없음" 안내 텍스트 표시

**KanbanCard**
- 리스트 뷰 `TodoItem`과 동일한 데이터 표시
  - 투두 텍스트 (마크다운 렌더링 없이 plain text, 최대 2줄)
  - 마감일 Badge (있을 경우)
  - 긴급도 · 중요도 Badge
- 액션 버튼: 편집(연필), 삭제(휴지통) — hover 시 노출
- 클릭 시 `TodoDetailModal` 열기
- 카드 스타일: `bg-zinc-800 rounded-lg p-3 border border-zinc-700`

---

## 완료 기준

- 4개 컬럼이 정상 렌더링된다
- 각 컬럼에 올바른 상태의 투두 카드가 배치된다
- 편집·삭제 버튼이 동작한다
- 모바일(1열), 태블릿(2열), 데스크탑(4열) 반응형 레이아웃이 동작한다
- 빈 컬럼에 안내 텍스트가 표시된다

---

## 체크리스트

- [x] `KanbanBoard` 컴포넌트 구현
- [x] `KanbanColumn` 컴포넌트 구현 (헤더 + 카드 목록)
- [x] `KanbanCard` 컴포넌트 구현 (편집·삭제 연동)
- [x] 컬럼 헤더 상태 Badge 렌더링
- [x] 빈 컬럼 안내 텍스트
- [x] 반응형 레이아웃 확인 (1열 / 2열 / 4열)
- [x] 각 컬럼 카드가 긴급도(내림차순) → 중요도(내림차순) 순으로 정렬됨
