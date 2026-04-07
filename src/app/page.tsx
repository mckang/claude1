import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TodoApp } from "@/components/todo-app"

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth")
  }

  return <TodoApp userEmail={user.email!} userId={user.id} />
}
