"use client"

import type { ReactNode } from "react"
import { categorizeTodos, type MatrixQuadrant, type Todo } from "@/lib/todo-utils"

// ── 사분면 메타데이터 ──────────────────────────────────────────────────────────

type QuadrantMeta = {
  id: MatrixQuadrant
  title: string
  subtitle: string
  tone: string
  order: string // lg 이상 2x2 그리드 배치
}

const QUADRANTS: QuadrantMeta[] = [
  { id: "q2", title: "계획",     subtitle: "비긴급 · 중요",   tone: "border-blue-500/40   bg-blue-500/5",   order: "lg:order-1" },
  { id: "q1", title: "지금 당장", subtitle: "긴급 · 중요",     tone: "border-red-500/40    bg-red-500/5",    order: "lg:order-2" },
  { id: "q4", title: "제거",     subtitle: "비긴급 · 비중요", tone: "border-zinc-600/40   bg-zinc-600/5",   order: "lg:order-3" },
  { id: "q3", title: "위임",     subtitle: "긴급 · 비중요",   tone: "border-amber-500/40  bg-amber-500/5",  order: "lg:order-4" },
]

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────

type TodoMatrixProps = {
  todos: Todo[]
  renderItem: (todo: Todo) => ReactNode
}

export function TodoMatrix({ todos, renderItem }: TodoMatrixProps) {
  const categorized = categorizeTodos(todos)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {QUADRANTS.map((q) => (
          <QuadrantSection
            key={q.id}
            meta={q}
            todos={categorized[q.id]}
            renderItem={renderItem}
          />
        ))}
      </div>

      {categorized.unclassified.length > 0 && (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <header className="mb-3 flex items-baseline gap-2">
            <h3 className="text-sm font-semibold text-zinc-200">미분류</h3>
            <span className="text-xs text-zinc-500">긴급도·중요도 미설정</span>
            <span className="ml-auto rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
              {categorized.unclassified.length}
            </span>
          </header>
          <ul className="flex flex-col gap-2">
            {categorized.unclassified.map((todo) => renderItem(todo))}
          </ul>
        </section>
      )}
    </div>
  )
}

function QuadrantSection({
  meta,
  todos,
  renderItem,
}: {
  meta: QuadrantMeta
  todos: Todo[]
  renderItem: (todo: Todo) => ReactNode
}) {
  return (
    <section
      className={`flex min-h-[12rem] flex-col rounded-xl border p-4 ${meta.tone} ${meta.order}`}
    >
      <header className="mb-3 flex items-baseline gap-2">
        <h3 className="text-sm font-semibold text-zinc-100">{meta.title}</h3>
        <span className="text-xs text-zinc-400">{meta.subtitle}</span>
        <span className="ml-auto rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
          {todos.length}
        </span>
      </header>
      {todos.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-xs text-zinc-500">
          이 사분면에 해당하는 할 일이 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {todos.map((todo) => renderItem(todo))}
        </ul>
      )}
    </section>
  )
}
