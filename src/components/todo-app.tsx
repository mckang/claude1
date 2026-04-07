"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Plus, Trash2, ClipboardList, Sparkles, Menu, X, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  type Todo,
  type Filter,
  toggleTodo,
  removeTodo,
  clearDoneTodos,
  filterTodos,
  getActiveCount,
  getDoneCount,
} from "@/lib/todo-utils"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "active", label: "진행중" },
  { key: "done", label: "완료" },
]

export function TodoApp({ userEmail, userId }: { userEmail: string; userId: string }) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [input, setInput] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  // Supabase에서 투두 불러오기
  useEffect(() => {
    supabase
      .from("todos")
      .select("id, text, done")
      .order("id", { ascending: true })
      .then(({ data }) => {
        if (data) setTodos(data as Todo[])
      })
  }, [supabase])

  async function handleAdd() {
    const trimmed = input.trim()
    if (!trimmed) return

    const tempId = Date.now()
    setTodos((prev) => [...prev, { id: tempId, text: trimmed, done: false }])
    setInput("")
    inputRef.current?.focus()

    const { data } = await supabase
      .from("todos")
      .insert({ text: trimmed, done: false, user_id: userId })
      .select("id")
      .single()

    if (data) {
      setTodos((prev) =>
        prev.map((t) => (t.id === tempId ? { ...t, id: data.id } : t))
      )
    }
  }

  async function handleToggle(id: number) {
    const todo = todos.find((t) => t.id === id)
    if (!todo) return
    setTodos((prev) => toggleTodo(prev, id))
    await supabase.from("todos").update({ done: !todo.done }).eq("id", id)
  }

  async function handleRemove(id: number) {
    setTodos((prev) => removeTodo(prev, id))
    await supabase.from("todos").delete().eq("id", id)
  }

  async function handleClearDone() {
    setTodos((prev) => clearDoneTodos(prev))
    setSidebarOpen(false)
    await supabase.from("todos").delete().eq("done", true)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/auth")
    router.refresh()
  }

  const filtered = filterTodos(todos, filter)
  const activeCount = getActiveCount(todos)
  const doneCount = getDoneCount(todos)
  const total = todos.length
  const progress = total === 0 ? 0 : Math.round((doneCount / total) * 100)

  const sidebarContent = (
    <>
      {/* 로고 */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
            <ClipboardList className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-base tracking-tight">할 일 목록</span>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden rounded-md p-1 text-zinc-400 hover:text-zinc-100"
          aria-label="사이드바 닫기"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 진행도 */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between text-xs text-zinc-400">
          <span>오늘의 진행도</span>
          <span className="font-medium text-zinc-200">{progress}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="남은 일" value={activeCount} accent={false} />
        <StatCard label="완료" value={doneCount} accent />
      </div>

      {/* 필터 */}
      <nav className="flex flex-col gap-1">
        <p className="mb-1 px-2 text-[11px] font-medium uppercase tracking-widest text-zinc-500">
          필터
        </p>
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => {
              setFilter(key)
              setSidebarOpen(false)
            }}
            className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              filter === key
                ? "bg-indigo-500/15 text-indigo-400"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            <span>{label}</span>
            <span
              className={`text-xs tabular-nums ${filter === key ? "text-indigo-400" : "text-zinc-600"}`}
            >
              {key === "all" ? total : key === "active" ? activeCount : doneCount}
            </span>
          </button>
        ))}
      </nav>

      {/* 완료 항목 지우기 */}
      {doneCount > 0 && (
        <button
          onClick={handleClearDone}
          className="mt-auto flex items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
          완료 항목 지우기
        </button>
      )}
    </>
  )

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* 모바일 오버레이 백드롭 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-64 flex flex-col border-r border-zinc-800 bg-zinc-900 p-6 gap-8
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:relative lg:translate-x-0 lg:shrink-0
        `}
      >
        {sidebarContent}
      </aside>

      {/* 메인 */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* 헤더 */}
        <header className="flex items-center gap-4 border-b border-zinc-800 px-6 py-5">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden rounded-md p-1 text-zinc-400 hover:text-zinc-100 transition-colors"
            aria-label="메뉴 열기"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex flex-1 items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">
                {filter === "all" ? "전체" : filter === "active" ? "진행중" : "완료된"} 할 일
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">{filtered.length}개의 항목</p>
            </div>

            <div className="flex items-center gap-3">
              {todos.length === 0 && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>할 일을 추가해보세요</span>
                </div>
              )}
              {/* 사용자 정보 + 로그아웃 */}
              <div className="flex items-center gap-2">
                <span className="hidden sm:block text-xs text-zinc-500 max-w-[120px] truncate">
                  {userEmail}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                  aria-label="로그아웃"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:block">로그아웃</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* 투두 목록 */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {filtered.length === 0 ? (
            <EmptyState filter={filter} />
          ) : (
            <ul className="space-y-2">
              {filtered.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={() => handleToggle(todo.id)}
                  onRemove={() => handleRemove(todo.id)}
                />
              ))}
            </ul>
          )}
        </div>

        {/* 입력창 */}
        <div className="border-t border-zinc-800 bg-zinc-900/50 px-8 py-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleAdd()
            }}
            className="flex items-center gap-3"
          >
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-zinc-700" />
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="새 할 일 추가…"
              className="flex-1 border-0 bg-transparent p-0 text-sm text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim()}
              className="h-7 w-7 shrink-0 rounded-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-30"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}

function TodoItem({
  todo,
  onToggle,
  onRemove,
}: {
  todo: Todo
  onToggle: () => void
  onRemove: () => void
}) {
  return (
    <li className="group flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 transition-colors hover:border-zinc-700 hover:bg-zinc-800/60">
      <Checkbox
        checked={todo.done}
        onCheckedChange={onToggle}
        id={`todo-${todo.id}`}
        className="border-zinc-600 data-[state=checked]:border-indigo-500 data-[state=checked]:bg-indigo-500"
      />
      <label
        htmlFor={`todo-${todo.id}`}
        className={`flex-1 cursor-pointer select-none text-sm transition-colors ${
          todo.done ? "text-zinc-600 line-through" : "text-zinc-200"
        }`}
      >
        {todo.text}
      </label>
      <button
        onClick={onRemove}
        aria-label="삭제"
        className="opacity-0 transition-opacity group-hover:opacity-100 text-zinc-600 hover:text-red-400"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  )
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: boolean }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 px-3 py-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold tabular-nums ${accent ? "text-indigo-400" : "text-zinc-100"}`}
      >
        {value}
      </p>
    </div>
  )
}

function EmptyState({ filter }: { filter: Filter }) {
  const messages: Record<Filter, { title: string; desc: string }> = {
    all: { title: "할 일이 없어요", desc: "아래 입력창에서 새 할 일을 추가해보세요." },
    active: { title: "모두 완료!", desc: "진행 중인 할 일이 없습니다." },
    done: { title: "아직 완료 없음", desc: "체크박스를 눌러 완료 처리해보세요." },
  }
  const { title, desc } = messages[filter]
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center opacity-50">
      <ClipboardList className="h-10 w-10 text-zinc-600" />
      <p className="text-sm font-medium text-zinc-400">{title}</p>
      <p className="text-xs text-zinc-600">{desc}</p>
    </div>
  )
}
