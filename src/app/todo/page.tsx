"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/context/LocaleContext";

type Status = "todo" | "doing" | "done";

interface Todo {
  id: string;
  title: string;
  status: Status;
  created_at: string;
}

const DEFAULT_LABELS: Record<Status, string> = {
  todo: "TODO",
  doing: "進行中",
  done: "完了",
};

export default function TodoPage() {
  const { t } = useLocale();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [labels, setLabels] = useState<Record<Status, string>>(DEFAULT_LABELS);
  const [editingLabel, setEditingLabel] = useState<Status | null>(null);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingTodoTitle, setEditingTodoTitle] = useState("");

  const getDeviceId = () =>
    typeof window !== "undefined" ? localStorage.getItem("musu_device_id") : null;

  // Load labels from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("musu_todo_labels");
    if (saved) try { setLabels(JSON.parse(saved)); } catch { /* ignore */ }
  }, []);

  const saveLabels = (newLabels: Record<Status, string>) => {
    setLabels(newLabels);
    localStorage.setItem("musu_todo_labels", JSON.stringify(newLabels));
  };

  const fetchTodos = useCallback(async () => {
    const deviceId = getDeviceId();
    if (!deviceId) { setLoading(false); return; }
    const { data } = await supabase
      .from("todos")
      .select("id, title, status, created_at")
      .eq("device_id", deviceId)
      .order("created_at", { ascending: true });
    setTodos(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTodos(); }, [fetchTodos]);

  const addTodo = async () => {
    const title = newTitle.trim();
    if (!title) return;
    const deviceId = getDeviceId();
    if (!deviceId) return;
    setNewTitle("");
    const { data } = await supabase
      .from("todos")
      .insert({ device_id: deviceId, user_id: deviceId, title, status: "todo" as Status })
      .select("id, title, status, created_at")
      .single();
    if (data) setTodos((prev) => [...prev, data]);
  };

  const moveTodo = async (id: string, direction: "left" | "right") => {
    const order: Status[] = ["todo", "doing", "done"];
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
    const idx = order.indexOf(todo.status);
    const newIdx = direction === "left" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx > 2) return;
    const newStatus = order[newIdx];
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
    await supabase.from("todos").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", id);
  };

  const updateTodoTitle = async (id: string, title: string) => {
    if (!title.trim()) return;
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, title: title.trim() } : t)));
    await supabase.from("todos").update({ title: title.trim(), updated_at: new Date().toISOString() }).eq("id", id);
    setEditingTodoId(null);
  };

  const deleteTodo = async (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    await supabase.from("todos").delete().eq("id", id);
  };

  const clearDone = async () => {
    const doneTodos = todos.filter((t) => t.status === "done");
    if (doneTodos.length === 0) return;
    setTodos((prev) => prev.filter((t) => t.status !== "done"));
    await Promise.all(doneTodos.map((t) => supabase.from("todos").delete().eq("id", t.id)));
  };

  const columnTodos = (status: Status) => todos.filter((t) => t.status === status);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="text-[var(--muted)]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-5xl mx-auto px-4 py-8 pb-24 md:pb-8 w-full">
      <h1 className="text-2xl font-bold mb-6">{t("nav.todo")}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(["todo", "doing", "done"] as Status[]).map((colKey) => (
          <div
            key={colKey}
            className="bg-[var(--search-bg)] rounded-2xl p-4 min-h-[300px] flex flex-col"
          >
            <div className="flex items-center justify-between mb-3">
              {editingLabel === colKey ? (
                <input
                  autoFocus
                  value={labels[colKey]}
                  onChange={(e) => saveLabels({ ...labels, [colKey]: e.target.value })}
                  onBlur={() => setEditingLabel(null)}
                  onKeyDown={(e) => { if (e.key === "Enter") setEditingLabel(null); }}
                  className="font-bold text-sm bg-transparent border-b border-[var(--accent)] outline-none w-full"
                />
              ) : (
                <h2
                  onClick={() => setEditingLabel(colKey)}
                  className="font-bold text-sm text-[var(--muted)] uppercase tracking-wide cursor-pointer hover:text-[var(--foreground)]"
                >
                  {labels[colKey]}
                  <span className="ml-2 text-xs font-normal">({columnTodos(colKey).length})</span>
                </h2>
              )}
              {colKey === "done" && columnTodos("done").length > 0 && (
                <button
                  onClick={clearDone}
                  className="text-[11px] text-[var(--muted)] hover:text-[var(--danger)] transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {colKey === "todo" && (
              <form
                onSubmit={(e) => { e.preventDefault(); addTodo(); }}
                className="flex gap-2 mb-3"
              >
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={t("todo.addPlaceholder")}
                  className="flex-1 bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                />
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="bg-[var(--accent)] text-white rounded-xl px-3 py-2 text-sm font-bold disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                  +
                </button>
              </form>
            )}

            <div className="flex flex-col gap-2 flex-1">
              {columnTodos(colKey).map((todo) => (
                <div
                  key={todo.id}
                  className="bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-3 py-2 flex items-center gap-2 group"
                >
                  {editingTodoId === todo.id ? (
                    <input
                      autoFocus
                      value={editingTodoTitle}
                      onChange={(e) => setEditingTodoTitle(e.target.value)}
                      onBlur={() => updateTodoTitle(todo.id, editingTodoTitle)}
                      onKeyDown={(e) => { if (e.key === "Enter") updateTodoTitle(todo.id, editingTodoTitle); if (e.key === "Escape") setEditingTodoId(null); }}
                      className="flex-1 text-sm bg-transparent border-b border-[var(--accent)] outline-none"
                    />
                  ) : (
                    <span
                      onClick={() => { setEditingTodoId(todo.id); setEditingTodoTitle(todo.title); }}
                      className={`flex-1 text-sm break-all cursor-pointer ${colKey === "done" ? "line-through text-[var(--muted)]" : ""}`}
                    >
                      {todo.title}
                    </span>
                  )}
                  <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                    {colKey !== "todo" && (
                      <button onClick={() => moveTodo(todo.id, "left")} className="text-[var(--muted)] hover:text-[var(--foreground)] text-xs px-1">←</button>
                    )}
                    {colKey !== "done" && (
                      <button onClick={() => moveTodo(todo.id, "right")} className="text-[var(--muted)] hover:text-[var(--foreground)] text-xs px-1">→</button>
                    )}
                    <button onClick={() => deleteTodo(todo.id)} className="text-[var(--muted)] hover:text-red-500 text-xs px-1">×</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
