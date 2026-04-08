"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { Plus, Trash2, ClipboardList, Menu, X, LogOut, Pencil, Paperclip, Loader2, FileText, FileImage, FileVideo, FileAudio, FileArchive, FileCode, FileSpreadsheet, File as FileIcon, List, Columns, LayoutGrid } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  type Todo,
  type Filter,
  type TodoStatus,
  setTodoStatus,
  removeTodo,
  clearDoneTodos,
  filterTodos,
  getActiveCount,
  getDoneCount,
  formatDueDate,
  isOverdue,
  urgencyLabel,
  urgencyColor,
  importanceLabel,
  importanceColor,
  statusLabel,
  statusColor,
} from "@/lib/todo-utils"
import { TodoMatrix } from "@/components/todo-matrix"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"

type Attachment = {
  id: number
  name: string
  storage_path: string
  mime_type: string
  size_bytes: number
}

const MAX_ATTACHMENTS = 5

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "waiting", label: "대기" },
  { key: "active", label: "진행" },
  { key: "paused", label: "중지" },
  { key: "done", label: "종료" },
]

const FILTER_TITLE: Record<Filter, string> = {
  all: "전체",
  waiting: "대기",
  active: "진행",
  paused: "중지",
  done: "종료",
}

export function TodoApp({ userEmail, userId }: { userEmail: string; userId: string }) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [filter, setFilter] = useState<Filter>("all")
  const [view, setView] = useState<"list" | "kanban" | "matrix">("list")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  // Supabase에서 투두 불러오기
  useEffect(() => {
    supabase
      .from("todos")
      .select("id, text, status, due_date, urgency, importance")
      .order("id", { ascending: true })
      .then(({ data }) => {
        if (data) setTodos(data as Todo[])
      })
  }, [supabase])

  async function handleToggle(id: number) {
    const todo = todos.find((t) => t.id === id)
    if (!todo) return
    const nextStatus: TodoStatus = todo.status === "done" ? "waiting" : "done"
    setTodos((prev) => setTodoStatus(prev, id, nextStatus))
    await supabase.from("todos").update({ status: nextStatus }).eq("id", id)
  }

  async function handleStatusChange(id: number, nextStatus: TodoStatus) {
    setTodos((prev) => setTodoStatus(prev, id, nextStatus))
    await supabase.from("todos").update({ status: nextStatus }).eq("id", id)
  }

  async function handleRemove(id: number) {
    const { data: attachments } = await supabase
      .from("todo_attachments")
      .select("storage_path")
      .eq("todo_id", id)

    setTodos((prev) => removeTodo(prev, id))
    await supabase.from("todos").delete().eq("id", id)

    if (attachments?.length) {
      const paths = (attachments as { storage_path: string }[]).map((a) => a.storage_path)
      await supabase.storage.from("todo-attachments").remove(paths)
    }
  }

  async function handleClearDone() {
    setTodos((prev) => clearDoneTodos(prev))
    setSidebarOpen(false)
    await supabase.from("todos").delete().eq("status", "done")
  }

  const handleEdit = useCallback((id: number, updates: { text: string; due_date: string | null; urgency: 1 | 2 | 3 | null; importance: 1 | 2 | 3 | null }) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)))
  }, [])

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
              {key === "all" ? total : todos.filter((t) => t.status === key).length}
            </span>
          </button>
        ))}
      </nav>

      {/* 하단: 완료 삭제 + 사용자 정보 */}
      <div className="mt-auto flex flex-col gap-1">
        {doneCount > 0 && (
          <button
            onClick={handleClearDone}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
            완료 항목 지우기
          </button>
        )}
        <div className="flex items-center justify-between rounded-md px-3 py-2">
          <span className="text-xs text-zinc-500 truncate max-w-[120px]">{userEmail}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 rounded-md p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            aria-label="로그아웃"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
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
                {FILTER_TITLE[filter]} 할 일
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">{filtered.length}개의 항목</p>
            </div>

            <div className="flex items-center gap-3">
              {/* 뷰 전환 버튼 (리스트 ↔ 칸반) */}
              <div
                role="group"
                aria-label="뷰 전환"
                className="flex items-center rounded-md border border-zinc-800 bg-zinc-900 p-0.5"
              >
                <button
                  type="button"
                  onClick={() => setView("list")}
                  aria-label="리스트 뷰"
                  aria-pressed={view === "list"}
                  className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
                    view === "list"
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setView("kanban")}
                  aria-label="칸반 뷰"
                  aria-pressed={view === "kanban"}
                  className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
                    view === "kanban"
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Columns className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setView("matrix")}
                  aria-label="매트릭스 뷰"
                  aria-pressed={view === "matrix"}
                  className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
                    view === "matrix"
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* 할 일 추가 버튼 */}
              <Button
                onClick={() => setAddModalOpen(true)}
                size="sm"
                className="h-8 gap-1.5 rounded-full bg-indigo-500 px-3 text-xs hover:bg-indigo-400"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:block">새 할 일</span>
              </Button>

            </div>
          </div>
        </header>

        {/* 투두 목록 / 칸반 보드 */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {view === "list" && (
            filtered.length === 0 ? (
              <EmptyState filter={filter} />
            ) : (
              <ul className="space-y-2">
                {filtered.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    userId={userId}
                    supabase={supabase}
                    onToggle={() => handleToggle(todo.id)}
                    onRemove={() => handleRemove(todo.id)}
                    onEdit={handleEdit}
                  />
                ))}
              </ul>
            )
          )}
          {view === "kanban" && (
            <KanbanBoard
              todos={filtered}
              filter={filter}
              userId={userId}
              supabase={supabase}
              onRemove={handleRemove}
              onEdit={handleEdit}
              onStatusChange={handleStatusChange}
            />
          )}
          {view === "matrix" && (
            filtered.length === 0 ? (
              <EmptyState filter={filter} />
            ) : (
              <TodoMatrix
                todos={filtered}
                renderItem={(todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    userId={userId}
                    supabase={supabase}
                    onToggle={() => handleToggle(todo.id)}
                    onRemove={() => handleRemove(todo.id)}
                    onEdit={handleEdit}
                  />
                )}
              />
            )
          )}
        </div>

      </main>

      {/* 투두 추가 모달 */}
      <TodoFormModal
        mode="add"
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        userId={userId}
        supabase={supabase}
        onAdded={(newTodo) => setTodos((prev) => [...prev, newTodo])}
      />
    </div>
  )
}

function TodoItem({
  todo,
  userId,
  supabase,
  onToggle,
  onRemove,
  onEdit,
}: {
  todo: Todo
  userId: string
  supabase: ReturnType<typeof createClient>
  onToggle: () => void
  onRemove: () => void
  onEdit: (id: number, updates: { text: string; due_date: string | null; urgency: 1 | 2 | 3 | null; importance: 1 | 2 | 3 | null }) => void
}) {
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [signedUrls, setSignedUrls] = useState<Record<number, string>>({})

  async function fetchAttachments() {
    const { data } = await supabase
      .from("todo_attachments")
      .select("id, name, storage_path, mime_type, size_bytes")
      .eq("todo_id", todo.id)
      .order("id", { ascending: true })
    if (!data) return
    setAttachments(data as Attachment[])
    const entries = await Promise.all(
      (data as Attachment[]).map(async (a) => {
        const { data: s } = await supabase.storage.from("todo-attachments").createSignedUrl(a.storage_path, 3600)
        return s ? ([a.id, s.signedUrl] as [number, string]) : null
      })
    )
    setSignedUrls(Object.fromEntries(entries.filter(Boolean) as [number, string][]))
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchAttachments() }, [todo.id])

  return (
    <li className="group flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 hover:border-zinc-700 hover:bg-zinc-800/60 transition-colors">
      <Checkbox
        checked={todo.status === "done"}
        onCheckedChange={onToggle}
        id={`todo-${todo.id}`}
        className="mt-0.5 border-zinc-600 data-[state=checked]:border-indigo-500 data-[state=checked]:bg-indigo-500"
      />
      <div
        className="flex flex-1 flex-col min-w-0 cursor-pointer"
        onClick={() => setDetailModalOpen(true)}
      >
        {/* 텍스트: 첨부 없으면 전체 공간, 있으면 1줄 */}
        <div className={`select-none text-sm transition-colors overflow-hidden ${
          attachments.length > 0 ? "truncate" : "max-h-16"
        } ${todo.status === "done" ? "text-zinc-600 line-through opacity-60" : "text-zinc-200"}`}>
          {attachments.length > 0 ? (
            <MarkdownContent inline>
              {todo.text.split("\n").find((l) => l.trim()) ?? ""}
            </MarkdownContent>
          ) : (
            <MarkdownContent>{todo.text}</MarkdownContent>
          )}
        </div>

        {/* 상태 + 마감일 + 긴급도 + 중요도 */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor(todo.status)}`}
          >
            {statusLabel(todo.status)}
          </span>
          {todo.due_date && (
              <span className={`text-[10px] ${isOverdue(todo.due_date) && todo.status !== "done" ? "text-red-500" : "text-zinc-500"}`}>
                {formatDueDate(todo.due_date)}
              </span>
            )}
            {todo.urgency && (
              <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${urgencyColor(todo.urgency)}`}>
                긴급 {urgencyLabel(todo.urgency)}
              </span>
            )}
            {todo.importance && (
              <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${importanceColor(todo.importance)}`}>
                중요 {importanceLabel(todo.importance)}
              </span>
            )}
        </div>

        {/* 첨부 영역: 항상 h-10, 없으면 빈 공간 */}
        <div className="flex h-10 shrink-0 flex-wrap gap-1.5 items-center overflow-hidden" onClick={(e) => e.stopPropagation()}>
          {attachments.map((att) => {
            const isImage = att.mime_type.startsWith("image/")
            const url = signedUrls[att.id]
            if (isImage && url) {
              return (
                <a key={att.id} href={url} target="_blank" rel="noopener noreferrer" title={att.name}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={att.name}
                    className="h-10 w-10 rounded object-cover border border-zinc-700 hover:opacity-80 transition-opacity" />
                </a>
              )
            }
            return url ? (
              <a key={att.id} href={url} download={att.name}
                title={`${att.name} (${formatBytes(att.size_bytes)})`}
                className="flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400 hover:text-indigo-400 transition-colors">
                <FileTypeIcon mimeType={att.mime_type} className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-20">{att.name}</span>
              </a>
            ) : null
          })}
        </div>
      </div>
      <div className="mt-0.5 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {todo.status !== "done" && (
          <button
            onClick={() => setEditModalOpen(true)}
            aria-label="편집"
            className="text-zinc-600 hover:text-indigo-400"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={onRemove}
          aria-label="삭제"
          className="text-zinc-600 hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <TodoDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        todo={todo}
        attachments={attachments}
        signedUrls={signedUrls}
      />
      <TodoFormModal
        mode="edit"
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        userId={userId}
        supabase={supabase}
        todo={todo}
        onEdited={(id, updates) => {
          onEdit(id, updates)
          fetchAttachments()
        }}
      />
    </li>
  )
}

function TodoDetailModal({
  open,
  onOpenChange,
  todo,
  attachments,
  signedUrls,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  todo: Todo
  attachments: Attachment[]
  signedUrls: Record<number, string>
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-medium">할 일 상세</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {/* 메타 정보: 마감일 / 긴급도 / 중요도 */}
          {(todo.due_date || todo.urgency || todo.importance) && (
            <div className="flex flex-wrap items-center gap-2">
              {todo.due_date && (
                <span
                  className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                    isOverdue(todo.due_date) && todo.status !== "done"
                      ? "bg-red-500/15 text-red-400"
                      : "bg-zinc-800 text-zinc-300"
                  }`}
                >
                  마감 {formatDueDate(todo.due_date)}
                </span>
              )}
              {todo.urgency && (
                <span
                  className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${urgencyColor(todo.urgency)}`}
                >
                  긴급 {urgencyLabel(todo.urgency)}
                </span>
              )}
              {todo.importance && (
                <span
                  className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${importanceColor(todo.importance)}`}
                >
                  중요 {importanceLabel(todo.importance)}
                </span>
              )}
            </div>
          )}

          {/* 본문 마크다운 */}
          <div className="min-h-24 rounded-md border border-input bg-background p-3 text-sm text-foreground overflow-y-auto max-h-64">
            <MarkdownContent>{todo.text}</MarkdownContent>
          </div>

          {/* 첨부파일 */}
          {attachments.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground">첨부파일 ({attachments.length})</p>
              <div className="flex flex-col gap-1.5">
                {attachments.map((att) => {
                  const isImage = att.mime_type.startsWith("image/")
                  const url = signedUrls[att.id]
                  return (
                    <a
                      key={att.id}
                      href={url}
                      download={!isImage ? att.name : undefined}
                      target={isImage ? "_blank" : undefined}
                      rel={isImage ? "noopener noreferrer" : undefined}
                      title={`${att.name} (${formatBytes(att.size_bytes)})`}
                      className="flex items-center gap-2.5 rounded-md border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-300 hover:border-indigo-500/50 hover:text-indigo-400 transition-colors"
                    >
                      <FileTypeIcon mimeType={att.mime_type} className="h-4 w-4 shrink-0 text-zinc-400" />
                      <span className="flex-1 truncate text-xs">{att.name}</span>
                      <span className="text-[10px] text-zinc-500 shrink-0">{formatBytes(att.size_bytes)}</span>
                    </a>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

type TodoFormModalProps =
  | {
      mode: "add"
      open: boolean
      onOpenChange: (open: boolean) => void
      userId: string
      supabase: ReturnType<typeof createClient>
      onAdded: (todo: Todo) => void
    }
  | {
      mode: "edit"
      open: boolean
      onOpenChange: (open: boolean) => void
      userId: string
      supabase: ReturnType<typeof createClient>
      todo: Todo
      onEdited: (id: number, updates: { text: string; due_date: string | null; urgency: 1 | 2 | 3 | null; importance: 1 | 2 | 3 | null }) => void
    }

function TodoFormModal(props: TodoFormModalProps) {
  const { mode, open, onOpenChange, userId, supabase } = props
  const [text, setText] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [urgency, setUrgency] = useState<1 | 2 | 3 | null>(null)
  const [importance, setImportance] = useState<1 | 2 | 3 | null>(null)
  const [tab, setTab] = useState<"edit" | "preview">("edit")
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([])
  const [existingSignedUrls, setExistingSignedUrls] = useState<Record<number, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 모달이 열릴 때 상태 초기화
  const prevOpenRef = useRef(false)
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setText(mode === "edit" ? props.todo.text : "")
      setDueDate(mode === "edit" ? (props.todo.due_date ?? "") : "")
      setUrgency(mode === "edit" ? props.todo.urgency : null)
      setImportance(mode === "edit" ? props.todo.importance : null)
      setTab("edit")
      setPendingFiles([])
      if (mode === "edit") {
        loadExistingAttachments(props.todo.id)
      } else {
        setExistingAttachments([])
        setExistingSignedUrls({})
      }
    }
    prevOpenRef.current = open
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function loadExistingAttachments(todoId: number) {
    const { data } = await supabase
      .from("todo_attachments")
      .select("id, name, storage_path, mime_type, size_bytes")
      .eq("todo_id", todoId)
      .order("id", { ascending: true })
    if (!data) return
    setExistingAttachments(data as Attachment[])
    const entries = await Promise.all(
      (data as Attachment[]).map(async (a) => {
        const { data: s } = await supabase.storage.from("todo-attachments").createSignedUrl(a.storage_path, 3600)
        return s ? ([a.id, s.signedUrl] as [number, string]) : null
      })
    )
    setExistingSignedUrls(Object.fromEntries(entries.filter(Boolean) as [number, string][]))
  }

  function insertImageMarkdown(att: Attachment) {
    const url = `/api/attachments?path=${encodeURIComponent(att.storage_path)}&redirect=true`
    const markdown = `![${att.name}](${url})`
    const el = textareaRef.current
    if (!el) {
      setText((prev) => prev + (prev.endsWith("\n") || prev === "" ? "" : "\n") + markdown)
      return
    }
    const start = el.selectionStart
    const end = el.selectionEnd
    const before = text.slice(0, start)
    const after = text.slice(end)
    const prefix = before.length > 0 && !before.endsWith("\n") ? "\n" : ""
    const newText = before + prefix + markdown + "\n" + after
    setText(newText)
    // 삽입 후 커서를 마크다운 끝으로 이동
    const newCursor = start + prefix.length + markdown.length + 1
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(newCursor, newCursor)
    })
    setTab("edit")
  }

  async function removeExistingAttachment(att: Attachment) {
    await supabase.storage.from("todo-attachments").remove([att.storage_path])
    await supabase.from("todo_attachments").delete().eq("id", att.id)
    setExistingAttachments((prev) => prev.filter((a) => a.id !== att.id))
    setExistingSignedUrls((prev) => { const n = { ...prev }; delete n[att.id]; return n })
  }

  function stageFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ""
    if (!files.length) return
    setPendingFiles((prev) => [...prev, ...files].slice(0, MAX_ATTACHMENTS))
  }

  async function uploadFiles(todoId: number, files: File[]) {
    for (const file of files) {
      const storagePath = `${userId}/${todoId}/${Date.now()}_${file.name}`
      const { error } = await supabase.storage.from("todo-attachments").upload(storagePath, file)
      if (!error) {
        await supabase.from("todo_attachments").insert({
          todo_id: todoId,
          user_id: userId,
          name: file.name,
          storage_path: storagePath,
          mime_type: file.type || "application/octet-stream",
          size_bytes: file.size,
        })
      }
    }
  }

  async function handleSubmit() {
    const trimmed = text.trim()
    if (!trimmed) return
    setUploading(true)

    const dueDateValue = dueDate || null

    if (mode === "add") {
      const { data } = await supabase
        .from("todos")
        .insert({ text: trimmed, status: "waiting", user_id: userId, due_date: dueDateValue, urgency, importance })
        .select("id")
        .single()
      if (data) {
        await uploadFiles(data.id, pendingFiles)
        props.onAdded({ id: data.id, text: trimmed, status: "waiting", due_date: dueDateValue, urgency, importance })
      }
    } else {
      await supabase.from("todos").update({ text: trimmed, due_date: dueDateValue, urgency, importance }).eq("id", props.todo.id)
      if (pendingFiles.length) await uploadFiles(props.todo.id, pendingFiles)
      props.onEdited(props.todo.id, { text: trimmed, due_date: dueDateValue, urgency, importance })
    }

    setUploading(false)
    onOpenChange(false)
  }

  const submitLabel = mode === "add" ? "추가" : "저장"
  const title = mode === "add" ? "새 할 일 추가" : "할 일 편집"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="flex flex-col gap-3">
          {/* 편집 / 미리보기 탭 */}
          <div className="flex gap-1 rounded-md bg-muted p-0.5 text-xs w-fit">
            {(["edit", "preview"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded px-2.5 py-1 font-medium transition-colors ${
                  tab === t
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "edit" ? "편집" : "미리보기"}
              </button>
            ))}
          </div>

          {tab === "edit" ? (
            <textarea
              ref={textareaRef}
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSubmit() }
              }}
              placeholder={"할 일을 입력하세요…\n마크다운 문법을 사용할 수 있어요 (Ctrl+Enter로 저장)"}
              className="h-30 resize-none rounded-md border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          ) : (
            <div className="h-30 overflow-y-auto rounded-md border border-input bg-background p-3 text-sm text-foreground">
              {text.trim() ? (
                <MarkdownContent onChange={setText}>{text}</MarkdownContent>
              ) : (
                <span className="text-muted-foreground">미리보기할 내용이 없습니다.</span>
              )}
            </div>
          )}

          {/* 마감일 */}
          <div className="flex items-center gap-2">
            <label htmlFor="due-date" className="text-xs text-muted-foreground whitespace-nowrap">마감일</label>
            <input
              id="due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
            {dueDate && (
              <button
                type="button"
                onClick={() => setDueDate("")}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                해제
              </button>
            )}
          </div>

          {/* 긴급도 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">긴급도</span>
            <div className="flex gap-1 rounded-md bg-muted p-0.5 text-xs">
              {([null, 1, 2, 3] as const).map((v) => {
                const label = v === null ? "미설정" : v === 1 ? "낮음" : v === 2 ? "보통" : "높음"
                const active = urgency === v
                return (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => setUrgency(v)}
                    className={`rounded px-2.5 py-1 font-medium transition-colors ${
                      active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 중요도 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">중요도</span>
            <div className="flex gap-1 rounded-md bg-muted p-0.5 text-xs">
              {([null, 1, 2, 3] as const).map((v) => {
                const label = v === null ? "미설정" : v === 1 ? "낮음" : v === 2 ? "보통" : "높음"
                const active = importance === v
                return (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => setImportance(v)}
                    className={`rounded px-2.5 py-1 font-medium transition-colors ${
                      active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 파일 첨부 */}
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || existingAttachments.length + pendingFiles.length >= MAX_ATTACHMENTS}
              className="flex w-fit items-center gap-1.5 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
            >
              <Paperclip className="h-3.5 w-3.5" />
              {`파일 첨부 (${existingAttachments.length + pendingFiles.length}/${MAX_ATTACHMENTS})`}
            </button>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={stageFiles} />
            {(existingAttachments.length > 0 || pendingFiles.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {existingAttachments.map((att) => {
                  const isImage = att.mime_type.startsWith("image/")
                  const url = existingSignedUrls[att.id]
                  const ext = att.name.split(".").pop()?.toUpperCase() ?? "FILE"
                  return (
                    <div key={att.id} title={att.name}
                      className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800"
                    >
                      {isImage && url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={url} alt={att.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-0.5">
                          <FileTypeIcon mimeType={att.mime_type} className="h-6 w-6 text-zinc-400" />
                          <span className="font-mono text-[9px] text-zinc-500">{ext}</span>
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-zinc-900/80 px-1 py-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <p className="truncate text-[9px] text-zinc-300">{att.name}</p>
                      </div>
                      {isImage && (
                        <button
                          type="button"
                          onClick={() => insertImageMarkdown(att)}
                          className="absolute left-0.5 top-0.5 rounded-full bg-zinc-900/80 p-0.5 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-indigo-400"
                          aria-label="본문에 삽입"
                          title="본문에 삽입"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeExistingAttachment(att)}
                        className="absolute right-0.5 top-0.5 rounded-full bg-zinc-900/80 p-0.5 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
                        aria-label="파일 제거"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )
                })}
                {pendingFiles.map((file, i) => (
                  <PendingFilePreview key={i} file={file} onRemove={() => setPendingFiles((prev) => prev.filter((_, j) => j !== i))} />
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={uploading}>
              취소
            </Button>
            <Button type="submit" disabled={!text.trim() || uploading}>
              {uploading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> 저장 중…</> : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// inline=true: label 안 인라인 렌더링 (p → span), inline=false: 미리보기 블록
// onChange: 체크박스 클릭 시 원문 텍스트 업데이트 콜백
function MarkdownContent({
  children,
  inline = false,
  onChange,
}: {
  children: string
  inline?: boolean
  onChange?: (newText: string) => void
}) {
  // 렌더링마다 초기화되는 체크박스 인덱스 카운터
  let checkboxIndex = 0

  function toggleCheckbox(idx: number) {
    if (!onChange) return
    let count = 0
    const updated = children.replace(/- \[([ xX])\]/g, (match, state) => {
      if (count++ === idx) return state.trim() === "" ? "- [x]" : "- [ ]"
      return match
    })
    onChange(updated)
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) =>
          inline ? <span>{children}</span> : <p className="mb-1.5 last:mb-0">{children}</p>,
        h1: ({ children }) => <h1 className="text-base font-bold mb-1 mt-2 first:mt-0">{children}</h1>,
        h2: ({ children }) => <h2 className="text-sm font-bold mb-1 mt-2 first:mt-0">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-1.5 first:mt-0">{children}</h3>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </a>
        ),
        ul: ({ children, className }) => (
          <ul className={`my-1 space-y-0.5 ${className?.includes("contains-task-list") ? "ml-0 list-none" : "ml-4 list-disc"}`}>
            {children}
          </ul>
        ),
        ol: ({ children }) => <ol className="my-1 ml-4 list-decimal space-y-0.5">{children}</ol>,
        li: ({ children, className }) => (
          <li className={`leading-snug ${className?.includes("task-list-item") ? "flex items-start gap-1.5" : ""}`}>
            {children}
          </li>
        ),
        input: ({ type, checked }) => {
          if (type !== "checkbox") return null
          const idx = checkboxIndex++
          return (
            <input
              type="checkbox"
              checked={checked}
              readOnly={!onChange}
              onChange={() => toggleCheckbox(idx)}
              className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-pointer accent-indigo-500 disabled:cursor-default"
              disabled={!onChange}
            />
          )
        },
        blockquote: ({ children }) => (
          <blockquote className="my-1 border-l-2 border-zinc-600 pl-3 text-zinc-400 italic">
            {children}
          </blockquote>
        ),
        code: ({ children, className }) => {
          const isBlock = !!className
          return isBlock ? (
            <code className="block w-full font-mono text-xs text-zinc-300">{children}</code>
          ) : (
            <code className="rounded bg-zinc-800 px-1 py-0.5 font-mono text-xs text-zinc-300">
              {children}
            </code>
          )
        },
        pre: ({ children }) => (
          <pre className="my-1.5 overflow-x-auto rounded-md bg-zinc-800 p-3 text-xs">{children}</pre>
        ),
        hr: () => <hr className="my-2 border-zinc-700" />,
      }}
    >
      {children}
    </ReactMarkdown>
  )
}

function FileTypeIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  if (mimeType.startsWith("image/")) return <FileImage className={className} />
  if (mimeType.startsWith("video/")) return <FileVideo className={className} />
  if (mimeType.startsWith("audio/")) return <FileAudio className={className} />
  if (mimeType === "application/pdf" || mimeType.startsWith("text/")) return <FileText className={className} />
  if (mimeType.includes("zip") || mimeType.includes("tar") || mimeType.includes("rar") || mimeType.includes("7z")) return <FileArchive className={className} />
  if (mimeType.includes("javascript") || mimeType.includes("typescript") || mimeType.includes("html") || mimeType.includes("css") || mimeType.includes("json")) return <FileCode className={className} />
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("csv")) return <FileSpreadsheet className={className} />
  return <FileIcon className={className} />
}

function PendingFilePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const isImage = file.type.startsWith("image/")
  const ext = file.name.split(".").pop()?.toUpperCase() ?? "FILE"

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!isImage) return
    const url = URL.createObjectURL(file)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreviewUrl(url)
    return () => { URL.revokeObjectURL(url) }
  }, [file, isImage])

  return (
    <div className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800">
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt={file.name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-0.5">
          <FileTypeIcon mimeType={file.type} className="h-6 w-6 text-zinc-400" />
          <span className="font-mono text-[9px] text-zinc-500">{ext}</span>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-zinc-900/80 px-1 py-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <p className="truncate text-[9px] text-zinc-300">{file.name}</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-0.5 top-0.5 rounded-full bg-zinc-900/80 p-0.5 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
        aria-label="파일 제거"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
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

const KANBAN_COLUMNS: TodoStatus[] = ["waiting", "active", "paused", "done"]

type EditUpdates = {
  text: string
  due_date: string | null
  urgency: 1 | 2 | 3 | null
  importance: 1 | 2 | 3 | null
}

function KanbanBoard({
  todos,
  filter,
  userId,
  supabase,
  onRemove,
  onEdit,
  onStatusChange,
}: {
  todos: Todo[]
  filter: Filter
  userId: string
  supabase: ReturnType<typeof createClient>
  onRemove: (id: number) => void
  onEdit: (id: number, updates: EditUpdates) => void
  onStatusChange: (id: number, nextStatus: TodoStatus) => void
}) {
  const visibleColumns: TodoStatus[] =
    filter === "all" ? KANBAN_COLUMNS : KANBAN_COLUMNS.filter((s) => s === filter)
  const gridCols =
    visibleColumns.length === 1
      ? "grid-cols-1"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
  const [activeId, setActiveId] = useState<number | null>(null)
  // 버튼 클릭과 드래그를 구분하기 위해 4px 이동 후 드래그 시작
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const activeTodo = activeId !== null ? todos.find((t) => t.id === activeId) ?? null : null

  function handleDragStart(event: DragStartEvent) {
    setActiveId(Number(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over) return
    const id = Number(active.id)
    const nextStatus = over.id as TodoStatus
    const current = todos.find((t) => t.id === id)
    if (!current || current.status === nextStatus) return
    onStatusChange(id, nextStatus)
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className={`grid h-full gap-4 ${gridCols}`}>
        {visibleColumns.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            todos={todos
              .filter((t) => t.status === status)
              .slice()
              .sort((a, b) => (b.urgency ?? 0) - (a.urgency ?? 0) || (b.importance ?? 0) - (a.importance ?? 0))}
            userId={userId}
            supabase={supabase}
            onRemove={onRemove}
            onEdit={onEdit}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeTodo ? (
          <div className="pointer-events-none rotate-1 rounded-lg border border-zinc-600 bg-zinc-800 p-3 text-xs text-zinc-200 shadow-xl">
            {activeTodo.text.split("\n").find((l) => l.trim()) ?? ""}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

function KanbanColumn({
  status,
  todos,
  userId,
  supabase,
  onRemove,
  onEdit,
}: {
  status: TodoStatus
  todos: Todo[]
  userId: string
  supabase: ReturnType<typeof createClient>
  onRemove: (id: number) => void
  onEdit: (id: number, updates: EditUpdates) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-0 flex-col rounded-xl bg-zinc-900 p-3 transition-colors ${
        isOver ? "bg-zinc-800/80 ring-2 ring-indigo-500" : ""
      }`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <span
          className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium ${statusColor(status)}`}
        >
          {statusLabel(status)}
        </span>
        <span className="text-xs tabular-nums text-zinc-500">{todos.length}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {todos.length === 0 ? (
          <p className="py-6 text-center text-[11px] text-zinc-600">없음</p>
        ) : (
          todos.map((todo) => (
            <KanbanCard
              key={todo.id}
              todo={todo}
              userId={userId}
              supabase={supabase}
              onRemove={() => onRemove(todo.id)}
              onEdit={onEdit}
            />
          ))
        )}
      </div>
    </div>
  )
}

function KanbanCard({
  todo,
  userId,
  supabase,
  onRemove,
  onEdit,
}: {
  todo: Todo
  userId: string
  supabase: ReturnType<typeof createClient>
  onRemove: () => void
  onEdit: (id: number, updates: EditUpdates) => void
}) {
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [signedUrls, setSignedUrls] = useState<Record<number, string>>({})
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: todo.id })

  const fetchAttachments = useCallback(async () => {
    const { data } = await supabase
      .from("todo_attachments")
      .select("id, name, storage_path, mime_type, size_bytes")
      .eq("todo_id", todo.id)
      .order("id", { ascending: true })
    if (!data) return
    const list = data as Attachment[]
    setAttachments(list)
    const entries = await Promise.all(
      list.map(async (a) => {
        const { data: s } = await supabase.storage
          .from("todo-attachments")
          .createSignedUrl(a.storage_path, 3600)
        return s ? ([a.id, s.signedUrl] as [number, string]) : null
      })
    )
    setSignedUrls(Object.fromEntries(entries.filter(Boolean) as [number, string][]))
  }, [supabase, todo.id])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchAttachments() }, [todo.id])

  // 첫 2줄만 plain text 로 표시
  const previewText = todo.text
    .split("\n")
    .filter((l) => l.trim())
    .slice(0, 2)
    .join("\n")

  return (
    <>
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`group relative cursor-grab touch-none rounded-lg border border-zinc-700 bg-zinc-800 p-3 transition-colors hover:border-zinc-600 active:cursor-grabbing ${
        isDragging ? "opacity-40" : ""
      }`}
      onClick={() => setDetailModalOpen(true)}
    >
      <p
        className={`whitespace-pre-wrap break-words text-xs leading-relaxed ${
          todo.status === "done" ? "text-zinc-500 line-through" : "text-zinc-200"
        }`}
      >
        {previewText}
      </p>

      {(todo.due_date || todo.urgency || todo.importance) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {todo.due_date && (
            <span
              className={`text-[10px] ${
                isOverdue(todo.due_date) && todo.status !== "done"
                  ? "text-red-500"
                  : "text-zinc-500"
              }`}
            >
              {formatDueDate(todo.due_date)}
            </span>
          )}
          {todo.urgency && (
            <span
              className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${urgencyColor(todo.urgency)}`}
            >
              긴급 {urgencyLabel(todo.urgency)}
            </span>
          )}
          {todo.importance && (
            <span
              className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${importanceColor(todo.importance)}`}
            >
              중요 {importanceLabel(todo.importance)}
            </span>
          )}
        </div>
      )}

      <div
        className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {todo.status !== "done" && (
          <button
            onClick={() => setEditModalOpen(true)}
            aria-label="편집"
            className="text-zinc-500 hover:text-indigo-400"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={onRemove}
          aria-label="삭제"
          className="text-zinc-500 hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>

    {/* 모달은 카드 외부에 렌더링해 포털 내부 클릭이 카드 onClick으로 버블링되지 않게 한다 */}
    <TodoDetailModal
      open={detailModalOpen}
      onOpenChange={setDetailModalOpen}
      todo={todo}
      attachments={attachments}
      signedUrls={signedUrls}
    />
    <TodoFormModal
      mode="edit"
      open={editModalOpen}
      onOpenChange={setEditModalOpen}
      userId={userId}
      supabase={supabase}
      todo={todo}
      onEdited={(id, updates) => {
        onEdit(id, updates)
        fetchAttachments()
      }}
    />
    </>
  )
}

function EmptyState({ filter }: { filter: Filter }) {
  const messages: Record<Filter, { title: string; desc: string }> = {
    all: { title: "할 일이 없어요", desc: "아래 입력창에서 새 할 일을 추가해보세요." },
    waiting: { title: "대기 중인 항목 없음", desc: "새 할 일을 추가해보세요." },
    active: { title: "진행 중인 항목 없음", desc: "대기 항목을 진행 상태로 옮겨보세요." },
    paused: { title: "중지된 항목 없음", desc: "일시 중지한 할 일이 여기 표시됩니다." },
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
