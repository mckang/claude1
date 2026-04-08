# UI 표준 — 한국어 Todo 앱

## 1. 디자인 원칙

1. **다크 테마 우선** — 기본 배경 `zinc-950`, 서피스 `zinc-900` 계열
2. **shadcn/ui 컴포넌트 재사용** — 직접 스타일링 전 shadcn 컴포넌트 먼저 검토
3. **반응형** — 모바일(`base`) → 데스크톱(`lg`) 순서로 작성
4. **접근성** — aria 속성, 키보드 네비게이션, 포커스 링 유지

---

## 2. 색상 시스템

Tailwind v4 + shadcn CSS 변수 (`globals.css`). oklch 색 공간 사용.

### 핵심 변수

| 변수 | 용도 |
|---|---|
| `--background` | 페이지 배경 |
| `--foreground` | 기본 텍스트 |
| `--card` | 카드·패널 배경 |
| `--primary` | 주요 액션 버튼, 강조 색 |
| `--secondary` | 보조 버튼 |
| `--muted` | 비활성 텍스트, 플레이스홀더 |
| `--destructive` | 삭제·오류 상태 |
| `--border` | 구분선, 인풋 테두리 |
| `--ring` | 포커스 링 |
| `--sidebar-background` | 사이드바 배경 |
| `--sidebar-foreground` | 사이드바 텍스트 |

### 사용 방법

```tsx
// CSS 변수 직접 사용 (권장)
<div className="bg-background text-foreground" />

// 절대 색상값 하드코딩 금지
<div className="bg-[#1a1a1a]" />  // X
```

---

## 3. 타이포그래피

| 레벨 | Tailwind 클래스 | 용도 |
|---|---|---|
| 제목 | `text-lg font-semibold` | 사이드바 앱 제목 |
| 소제목 | `text-sm font-medium` | 섹션 레이블 |
| 본문 | `text-sm` | 투두 텍스트, 설명 |
| 캡션 | `text-xs text-muted-foreground` | 보조 정보, 이메일 |

---

## 4. 컴포넌트 사용 가이드

### Button

```tsx
import { Button } from "@/components/ui/button";

// 주요 액션
<Button>추가</Button>

// 보조 액션
<Button variant="secondary">필터</Button>

// 파괴적 액션
<Button variant="destructive">삭제</Button>

// 아이콘 전용 버튼
<Button variant="ghost" size="icon">
  <X className="h-4 w-4" />
</Button>
```

**variant 목록**: `default` | `outline` | `secondary` | `ghost` | `destructive` | `link`  
**size 목록**: `default` | `xs` | `sm` | `lg` | `icon` | `icon-xs` | `icon-sm` | `icon-lg`

### Input

```tsx
import { Input } from "@/components/ui/input";

<Input
  type="text"
  placeholder="할 일을 입력하세요"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
/>
```

### Checkbox

```tsx
import { Checkbox } from "@/components/ui/checkbox";

<Checkbox
  checked={todo.done}
  onCheckedChange={() => handleToggle(todo.id)}
  aria-label={`완료: ${todo.text}`}
/>
```

### Card

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>제목</CardTitle>
  </CardHeader>
  <CardContent>내용</CardContent>
</Card>
```

### Badge

```tsx
import { Badge } from "@/components/ui/badge";

<Badge variant="secondary">완료</Badge>
```

---

## 5. 레이아웃 시스템

### 전체 구조

```
<body> h-screen flex
├── <aside> 사이드바 (w-64, 고정)   — lg 이상
└── <main>  콘텐츠 영역 (flex-1)
    ├── <header>  (sticky top)
    ├── <section> 스크롤 영역 (flex-1 overflow-y-auto)
    └── <footer>  입력창 (sticky bottom)
```

### 반응형 사이드바

- `lg` 이상: 사이드바 항상 표시 (`block`)
- `lg` 미만: 기본 숨김 (`hidden`), 햄버거 버튼 클릭 시 오버레이 표시
- 오버레이: `fixed inset-0 z-50` + 반투명 배경 (`bg-black/50`)

```tsx
// 햄버거 버튼 — lg 미만에서만 표시
<Button
  variant="ghost"
  size="icon"
  className="lg:hidden"
  onClick={() => setSidebarOpen(true)}
>
  <Menu className="h-5 w-5" />
</Button>
```

---

## 6. 간격 & 크기

| 목적 | 값 |
|---|---|
| 섹션 간 여백 | `gap-4` / `space-y-4` |
| 카드 내부 패딩 | `p-4` |
| 아이콘 크기 (기본) | `h-4 w-4` |
| 아이콘 크기 (헤더) | `h-5 w-5` |
| 투두 아이템 높이 | `py-3` |

---

## 7. 상태 표현

| 상태 | 표현 방법 |
|---|---|
| 완료된 투두 | `line-through text-muted-foreground` |
| 로딩 중 | `disabled` + `opacity-50` |
| 빈 목록 | 중앙 정렬 안내 텍스트 (`EmptyState`) |
| 오류 | `text-destructive text-sm` |
| 성공 메시지 | `text-green-500 text-sm` |

---

## 8. 아이콘

lucide-react 사용. 일관된 크기 유지.

```tsx
import { Plus, Trash2, Menu, X, LogOut, CheckCircle } from "lucide-react";

// 인라인 아이콘
<Plus className="h-4 w-4" />

// 버튼 내 아이콘 + 텍스트
<Button>
  <Plus className="h-4 w-4 mr-2" />
  추가
</Button>
```

---

## 9. 진행률 바

```tsx
// 0~100 퍼센트 값으로 width 제어
<div className="h-2 rounded-full bg-muted">
  <div
    className="h-2 rounded-full bg-primary transition-all duration-300"
    style={{ width: `${progress}%` }}
  />
</div>
```

---

## 10. 금지 사항

- 인라인 `style` 속성에 색상값 직접 지정 금지 (CSS 변수 사용)
- shadcn 컴포넌트 내부 DOM 구조 직접 수정 금지
- `!important` 사용 금지
- `px`/`em` 고정값 하드코딩 금지 — Tailwind 스케일 사용
