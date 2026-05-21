"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getBrowserClient, supabaseConfigured } from "@/lib/supabase";
import { loadProfilFromStorage } from "./ProfilBearbeiten";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;

const HAUPTACCOUNT_ID = process.env.NEXT_PUBLIC_SUPABASE_HAUPTACCOUNT_ID ?? "";
const UNREAD_LS_KEY = "claaro-chat-unread";

interface ChatMessage {
  id: string;
  hauptaccount_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar_url: string | null;
  nachricht: string;
  created_at: string;
  geloescht: boolean;
}

interface Todo {
  id: string;
  hauptaccount_id: string;
  erstellt_von: string;
  erstellt_von_name: string;
  titel: string;
  beschreibung: string | null;
  faellig_am: string | null;
  erledigt: boolean;
  erledigt_von: string | null;
  erledigt_am: string | null;
  created_at: string;
}

function getDateLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Heute";
  if (date.toDateString() === yesterday.toDateString()) return "Gestern";
  return date.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function isOverdue(faellig_am: string | null): boolean {
  if (!faellig_am) return false;
  return new Date(faellig_am) < new Date(new Date().toDateString());
}

function Avatar({ name, url, size = 32 }: { name: string; url?: string | null; size?: number }) {
  const initials = name.slice(0, 2).toUpperCase();
  if (url) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src={url} alt={name} width={size} height={size}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }} />
    );
  }
  return (
    <div className="rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.35, backgroundColor: "rgba(var(--c-accent-rgb),0.3)" }}>
      {initials}
    </div>
  );
}

export function dispatchChatUnread(count: number) {
  localStorage.setItem(UNREAD_LS_KEY, String(count));
  window.dispatchEvent(new CustomEvent("claaro:chat-unread", { detail: { count } }));
}

export default function FirmenChat() {
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState("Ich");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // Todos
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loadingTodos, setLoadingTodos] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newFaellig, setNewFaellig] = useState("");
  const [savingTodo, setSavingTodo] = useState(false);
  const [todoError, setTodoError] = useState<string | null>(null);

  // Tab
  const [activeTab, setActiveTab] = useState<"chat" | "todos">("chat");

  const messagesRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const presenceChannel = useRef<any>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => { userIdRef.current = userId; }, [userId]);

  function isNearBottom(): boolean {
    const el = messagesRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 150;
  }

  function scrollToBottom(smooth = false) {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }


  // --- Chat load ---
  const loadMessages = useCallback(async () => {
    if (!HAUPTACCOUNT_ID || !supabaseConfigured) { setLoadingMsgs(false); return; }
    const supabase = getBrowserClient()!;
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("hauptaccount_id", HAUPTACCOUNT_ID)
      .eq("geloescht", false)
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) {
      console.error("[FirmenChat] loadMessages Fehler:", error);
    }
    setMessages((data as ChatMessage[]) ?? []);
    setLoadingMsgs(false);
    setTimeout(() => scrollToBottom(false), 50);
    dispatchChatUnread(0);
    if (userIdRef.current) {
      getBrowserClient()!.from("chat_read_status").upsert(
        { user_id: userIdRef.current, hauptaccount_id: HAUPTACCOUNT_ID, letzte_gelesen_at: new Date().toISOString() },
        { onConflict: "user_id,hauptaccount_id" }
      ).then(({ error }) => {
        if (error) console.error("[FirmenChat] chat_read_status upsert Fehler:", error);
      });
    }
  }, []);

  // --- Todo load ---
  const loadTodos = useCallback(async () => {
    if (!HAUPTACCOUNT_ID || !supabaseConfigured) { setLoadingTodos(false); return; }
    const { data, error } = await getBrowserClient()!
      .from("team_todos")
      .select("*")
      .eq("hauptaccount_id", HAUPTACCOUNT_ID)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[FirmenChat] loadTodos Fehler:", error);
      setTodoError("Aufgaben konnten nicht geladen werden.");
    }
    setTodos((data as Todo[]) ?? []);
    setLoadingTodos(false);
  }, []);

  // --- User identity ---
  useEffect(() => {
    const stored = loadProfilFromStorage();
    if (stored.username) { setUsername(stored.username); setAvatarUrl(stored.avatarUrl); }
    if (supabaseConfigured) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getBrowserClient()!.auth.getUser().then((res: any) => {
        if (res.data?.user) setUserId(res.data.user.id);
      });
    }
    function onProfilUpdate(e: Event) {
      const d = (e as CustomEvent).detail;
      if (d.username) setUsername(d.username);
      setAvatarUrl(d.avatarUrl ?? null);
    }
    window.addEventListener("claaro:profil-updated", onProfilUpdate);
    return () => window.removeEventListener("claaro:profil-updated", onProfilUpdate);
  }, []);

  useEffect(() => { loadMessages(); }, [loadMessages]);
  useEffect(() => { loadTodos(); }, [loadTodos]);

  // --- Realtime: chat ---
  useEffect(() => {
    if (!HAUPTACCOUNT_ID || !supabaseConfigured) return;
    const supabase = getBrowserClient()!;
    const channel = supabase
      .channel(`chat-${HAUPTACCOUNT_ID}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "chat_messages",
        filter: `hauptaccount_id=eq.${HAUPTACCOUNT_ID}`,
      }, (payload: { new: ChatMessage }) => {
        const msg = payload.new;
        if (msg.geloescht) return;
        const wasNearBottom = isNearBottom();
        setMessages((prev) => prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]);
        if (wasNearBottom) setTimeout(() => scrollToBottom(true), 50);
        if (msg.sender_id !== userIdRef.current) {
          const cur = parseInt(localStorage.getItem(UNREAD_LS_KEY) ?? "0", 10);
          dispatchChatUnread(cur + 1);
        }
      })
      .subscribe((status) => {
        console.log("Realtime channel status:", status);
      });
    return () => { supabase.removeChannel(channel); };
  }, []);

  // --- Realtime: todos ---
  useEffect(() => {
    if (!HAUPTACCOUNT_ID || !supabaseConfigured) return;
    const supabase = getBrowserClient()!;
    const channel = supabase
      .channel(`todos-${HAUPTACCOUNT_ID}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "team_todos",
        filter: `hauptaccount_id=eq.${HAUPTACCOUNT_ID}`,
      }, () => loadTodos())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadTodos]);

  // --- Presence ---
  useEffect(() => {
    if (!HAUPTACCOUNT_ID || !userId || !supabaseConfigured) return;
    const supabase = getBrowserClient()!;
    const ch = supabase.channel(`presence-${HAUPTACCOUNT_ID}`, {
      config: { presence: { key: userId } },
    });
    ch.on("presence", { event: "sync" }, () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const state = ch.presenceState() as Record<string, any[]>;
      const typers = Object.entries(state)
        .filter(([key, vals]) => key !== userId && vals[0]?.typing)
        .map(([, vals]) => vals[0].name as string);
      setTypingUsers(typers);
    }).subscribe();
    presenceChannel.current = ch;
    ch.track({ typing: false, name: username }).then(() => {});
    return () => { supabase.removeChannel(ch); };
  }, [userId, username]);

  function handleTextareaChange(val: string) {
    setNewMsg(val);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
    if (presenceChannel.current) {
      presenceChannel.current.track({ typing: true, name: username }).then(() => {});
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        presenceChannel.current?.track({ typing: false, name: username }).then(() => {});
      }, 2000);
    }
  }

  async function sendMessage() {
    const text = newMsg.trim();
    if (!text || sending || !HAUPTACCOUNT_ID || !supabaseConfigured) return;
    setSending(true);
    setSendError(null);
    setNewMsg("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    presenceChannel.current?.track({ typing: false, name: username }).then(() => {});
    const result = await getBrowserClient()!.from("chat_messages").insert({
      hauptaccount_id: HAUPTACCOUNT_ID,
      sender_id: userId ?? "00000000-0000-0000-0000-000000000000",
      sender_name: username,
      sender_avatar_url: avatarUrl,
      nachricht: text,
    });
    console.log("INSERT RESULT:", JSON.stringify(result));
    const { error } = result;
    if (error) {
      console.error("[FirmenChat] sendMessage Fehler:", error);
      setNewMsg(text);
      setSendError("Nachricht konnte nicht gesendet werden. Bitte erneut versuchen.");
    }
    setSending(false);
    scrollToBottom(true);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  async function createTodo() {
    const title = newTitle.trim();
    if (!title || savingTodo || !HAUPTACCOUNT_ID || !supabaseConfigured) return;
    setSavingTodo(true);
    setTodoError(null);
    const { error } = await getBrowserClient()!.from("team_todos").insert({
      hauptaccount_id: HAUPTACCOUNT_ID,
      erstellt_von: userId ?? "00000000-0000-0000-0000-000000000000",
      erstellt_von_name: username,
      titel: title,
      beschreibung: newDesc.trim() || null,
      faellig_am: newFaellig || null,
    });
    if (error) {
      console.error("[FirmenChat] createTodo Fehler:", error);
      setTodoError("Aufgabe konnte nicht erstellt werden.");
    } else {
      setNewTitle(""); setNewDesc(""); setNewFaellig("");
      setShowCreate(false);
    }
    setSavingTodo(false);
  }

  async function toggleTodo(todo: Todo) {
    if (!supabaseConfigured) return;
    setTodoError(null);
    const done = !todo.erledigt;
    const { error } = await getBrowserClient()!.from("team_todos").update({
      erledigt: done,
      erledigt_von: done ? (userId ?? null) : null,
      erledigt_am: done ? new Date().toISOString() : null,
    }).eq("id", todo.id);
    if (error) {
      console.error("[FirmenChat] toggleTodo Fehler:", error);
      setTodoError("Status konnte nicht aktualisiert werden.");
    }
  }

  async function deleteTodo(id: string) {
    if (!supabaseConfigured) return;
    setTodoError(null);
    const { error } = await getBrowserClient()!.from("team_todos").delete().eq("id", id);
    if (error) {
      console.error("[FirmenChat] deleteTodo Fehler:", error);
      setTodoError("Aufgabe konnte nicht gelöscht werden.");
    }
  }

  const noSupabase = !HAUPTACCOUNT_ID || !supabaseConfigured;
  const openTodos = todos.filter((t) => !t.erledigt);
  const doneTodos = todos.filter((t) => t.erledigt);

  // Build date-separated chat items
  type Item = { type: "sep"; label: string } | { type: "msg"; msg: ChatMessage };
  const items: Item[] = [];
  let lastLabel = "";
  for (const msg of messages) {
    const label = getDateLabel(msg.created_at);
    if (label !== lastLabel) { items.push({ type: "sep", label }); lastLabel = label; }
    items.push({ type: "msg", msg });
  }

  return (
    <div className="flex flex-col" style={{ ...sans, height: "clamp(380px, 60vh, 540px)" }}>
      <style>{`
        .chat-scroll::-webkit-scrollbar { display: none; }
        .chat-scroll { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>


      {noSupabase ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-white/30 text-center">Supabase konfigurieren um den Team-Chat zu nutzen.</p>
        </div>
      ) : (
        <>
          {/* Tab bar */}
          <div className="flex gap-1.5 mb-3 flex-shrink-0">
            <button
              onClick={() => setActiveTab("chat")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={activeTab === "chat"
                ? { backgroundColor: "rgba(255,255,255,0.1)", color: "white", borderBottom: "1px solid rgba(255,255,255,0.15)" }
                : { backgroundColor: "transparent", color: "rgba(255,255,255,0.4)" }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16">
                <path d="M14 2H2a1 1 0 00-1 1v9a1 1 0 001 1h2v2l3-2h7a1 1 0 001-1V3a1 1 0 00-1-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
              </svg>
              Team-Chat
            </button>
            <button
              onClick={() => setActiveTab("todos")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={activeTab === "todos"
                ? { backgroundColor: "rgba(255,255,255,0.1)", color: "white" }
                : { backgroundColor: "transparent", color: "rgba(255,255,255,0.4)" }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16">
                <path d="M2 4h1.5M2 8h1.5M2 12h1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                <path d="M5 4h9M5 8h9M5 12h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              To-Do
              {openTodos.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] leading-none"
                  style={{ backgroundColor: "rgba(var(--c-accent-rgb),0.35)", color: "var(--c-accent)" }}>
                  {openTodos.length}
                </span>
              )}
            </button>
          </div>

          {/* ── CHAT TAB ── */}
          {activeTab === "chat" && (
            <>
              <div ref={messagesRef} className="chat-scroll flex-1 overflow-y-auto space-y-1">
                {loadingMsgs ? (
                  <div className="flex items-center justify-center h-full">
                    <svg className="w-5 h-5 animate-spin text-white/30" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
                    <svg className="w-10 h-10 text-white/15" fill="none" viewBox="0 0 24 24">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                    </svg>
                    <p className="text-sm text-white/30">Noch keine Nachrichten.</p>
                    <p className="text-xs text-white/20">Schreib deinem Team etwas!</p>
                  </div>
                ) : (
                  items.map((item, idx) => {
                    if (item.type === "sep") {
                      return (
                        <div key={`sep-${idx}`} className="flex items-center gap-3 py-3">
                          <div className="flex-1 h-px bg-white/8" />
                          <span className="text-xs text-white/25 flex-shrink-0">{item.label}</span>
                          <div className="flex-1 h-px bg-white/8" />
                        </div>
                      );
                    }
                    const msg = item.msg;
                    const isOwn = msg.sender_id === userId;
                    return (
                      <div key={msg.id} className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                        {!isOwn && <Avatar name={msg.sender_name} url={msg.sender_avatar_url} size={28} />}
                        <div className={`max-w-[72%] space-y-0.5 ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                          <span className="text-[10px] text-white/30 px-1">{msg.sender_name}</span>
                          <div className="px-3 py-2 rounded-2xl text-sm leading-relaxed break-words"
                            style={isOwn
                              ? { backgroundColor: "rgba(var(--c-accent-rgb),0.2)", color: "rgba(255,255,255,0.9)", borderBottomRightRadius: 4 }
                              : { backgroundColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.75)", borderBottomLeftRadius: 4 }}>
                            {msg.nachricht}
                          </div>
                          <span className="text-[10px] text-white/20 px-1">{formatTime(msg.created_at)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              <div className="h-5 flex items-center flex-shrink-0">
                {typingUsers.length > 0 && (
                  <p className="text-xs text-white/30 italic">
                    {typingUsers.join(", ")} {typingUsers.length === 1 ? "tippt" : "tippen"} gerade…
                  </p>
                )}
              </div>

              {sendError && (
                <p className="text-xs flex-shrink-0 mb-1" style={{ color: "var(--c-accent)" }}>{sendError}</p>
              )}

              <div className="flex items-end gap-2 border-t border-white/10 pt-3 flex-shrink-0">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={newMsg}
                    onChange={(e) => handleTextareaChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Nachricht schreiben…"
                    maxLength={2000}
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors resize-none"
                    style={{ minHeight: 40, maxHeight: 120 }}
                  />
                  {newMsg.length >= 1800 && (
                    <p className="absolute bottom-1 right-2 text-[10px] text-white/25">{newMsg.length}/2000</p>
                  )}
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!newMsg.trim() || sending}
                  className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                  style={{ backgroundColor: "var(--c-accent)" }}
                >
                  {sending ? (
                    <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 16 16">
                      <path d="M14 2L2 7l5 2 2 5 5-12z" fill="currentColor" />
                    </svg>
                  )}
                </button>
              </div>
            </>
          )}

          {/* ── TODO TAB ── */}
          {activeTab === "todos" && (
            <div className="flex flex-col flex-1 min-h-0">
              {/* Create form */}
              {showCreate ? (
                <div className="flex-shrink-0 mb-3 p-4 rounded-xl border border-white/15 bg-white/4 space-y-2.5">
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Neue Aufgabe</p>
                  <input
                    autoFocus
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") createTodo(); if (e.key === "Escape") setShowCreate(false); }}
                    placeholder="Aufgabe…"
                    maxLength={120}
                    className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors"
                  />
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Beschreibung (optional)"
                    rows={2}
                    className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 flex-1">
                      <svg className="w-3.5 h-3.5 text-white/30 flex-shrink-0" fill="none" viewBox="0 0 16 16">
                        <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3" />
                        <path d="M5 8h6M8 5v6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                      <input
                        type="date"
                        value={newFaellig}
                        onChange={(e) => setNewFaellig(e.target.value)}
                        className="bg-transparent text-xs text-white/50 focus:outline-none focus:text-white/80 transition-colors"
                        style={{ colorScheme: "dark" }}
                      />
                    </div>
                    <button
                      onClick={() => { setShowCreate(false); setNewTitle(""); setNewDesc(""); setNewFaellig(""); }}
                      className="text-xs text-white/30 hover:text-white/60 transition-colors px-2 py-1"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={createTodo}
                      disabled={!newTitle.trim() || savingTodo}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
                      style={{ backgroundColor: "var(--c-accent)", color: "white" }}
                    >
                      {savingTodo ? "…" : "Hinzufügen"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCreate(true)}
                  className="flex-shrink-0 flex items-center gap-2 mb-3 px-3 py-2 rounded-xl border border-dashed border-white/15 text-white/35 hover:text-white/60 hover:border-white/25 transition-all text-sm w-full"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Neue Aufgabe
                </button>
              )}

              {todoError && (
                <p className="flex-shrink-0 text-xs px-3 py-2 rounded-lg mb-2" style={{ backgroundColor: "rgba(var(--c-accent-rgb),0.12)", color: "var(--c-accent)" }}>
                  {todoError}
                </p>
              )}

              {/* Todo list */}
              <div className="chat-scroll flex-1 overflow-y-auto space-y-1.5">
                {loadingTodos ? (
                  <div className="flex items-center justify-center py-8">
                    <svg className="w-5 h-5 animate-spin text-white/30" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  </div>
                ) : todos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                    <svg className="w-10 h-10 text-white/15" fill="none" viewBox="0 0 24 24">
                      <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-sm text-white/30">Keine offenen Aufgaben.</p>
                  </div>
                ) : (
                  <>
                    {/* Open todos */}
                    {openTodos.map((todo) => (
                      <TodoItem
                        key={todo.id}
                        todo={todo}
                        userId={userId}
                        onToggle={() => toggleTodo(todo)}
                        onDelete={() => deleteTodo(todo.id)}
                      />
                    ))}

                    {/* Completed todos */}
                    {doneTodos.length > 0 && (
                      <>
                        <div className="flex items-center gap-3 py-2 mt-1">
                          <div className="flex-1 h-px bg-white/8" />
                          <span className="text-[10px] text-white/20 uppercase tracking-widest flex-shrink-0">Erledigt ({doneTodos.length})</span>
                          <div className="flex-1 h-px bg-white/8" />
                        </div>
                        {doneTodos.map((todo) => (
                          <TodoItem
                            key={todo.id}
                            todo={todo}
                            userId={userId}
                            onToggle={() => toggleTodo(todo)}
                            onDelete={() => deleteTodo(todo.id)}
                          />
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TodoItem({
  todo, userId, onToggle, onDelete,
}: {
  todo: Todo;
  userId: string | null;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const overdue = isOverdue(todo.faellig_am) && !todo.erledigt;
  const isOwn = todo.erstellt_von === userId;

  return (
    <div
      className="flex items-start gap-3 px-3 py-2.5 rounded-xl border transition-all"
      style={{
        borderColor: todo.erledigt ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.1)",
        backgroundColor: todo.erledigt ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
        opacity: todo.erledigt ? 0.6 : 1,
      }}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className="flex-shrink-0 mt-0.5 w-4 h-4 rounded border transition-all flex items-center justify-center"
        style={{
          borderColor: todo.erledigt ? "var(--c-teal)" : "rgba(255,255,255,0.25)",
          backgroundColor: todo.erledigt ? "rgba(var(--c-teal-rgb),0.25)" : "transparent",
        }}
      >
        {todo.erledigt && (
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 10 10" style={{ color: "var(--c-teal)" }}>
            <path d="M1.5 5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/85 leading-snug"
          style={{ textDecoration: todo.erledigt ? "line-through" : "none", color: todo.erledigt ? "rgba(255,255,255,0.35)" : undefined }}>
          {todo.titel}
        </p>
        {todo.beschreibung && (
          <p className="text-xs text-white/35 mt-0.5 leading-snug">{todo.beschreibung}</p>
        )}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-[10px] text-white/25">{todo.erstellt_von_name}</span>
          {todo.faellig_am && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: overdue ? "rgba(var(--c-accent-rgb),0.2)" : "rgba(255,255,255,0.06)",
                color: overdue ? "var(--c-accent)" : "rgba(255,255,255,0.3)",
              }}>
              {overdue ? "⚠ " : ""}{formatDate(todo.faellig_am)}
            </span>
          )}
        </div>
      </div>

      {/* Delete (only own todos) */}
      {isOwn && (
        <button
          onClick={onDelete}
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-white/20 hover:text-white/50 transition-colors mt-0.5"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
            <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
