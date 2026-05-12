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
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.35, backgroundColor: "rgba(200,75,47,0.3)" }}
    >
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const messagesRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const presenceChannel = useRef<any>(null);
  const userIdRef = useRef<string | null>(null);

  // Keep ref in sync for use inside closures
  useEffect(() => { userIdRef.current = userId; }, [userId]);

  function isNearBottom(): boolean {
    const el = messagesRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 150;
  }

  function scrollToBottom(smooth = false) {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }

  const loadMessages = useCallback(async () => {
    if (!HAUPTACCOUNT_ID || !supabaseConfigured) { setLoading(false); return; }
    const supabase = getBrowserClient()!;
    const result = await supabase
      .from("chat_messages")
      .select("*")
      .eq("hauptaccount_id", HAUPTACCOUNT_ID)
      .eq("geloescht", false)
      .order("created_at", { ascending: true })
      .limit(200);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setMessages(((result as any).data as ChatMessage[]) ?? []);
    setLoading(false);
    setTimeout(() => scrollToBottom(false), 50);

    // Mark as read
    dispatchChatUnread(0);
    if (userIdRef.current) {
      supabase.from("chat_read_status").upsert(
        { user_id: userIdRef.current, hauptaccount_id: HAUPTACCOUNT_ID, letzte_gelesen_at: new Date().toISOString() },
        { onConflict: "user_id,hauptaccount_id" }
      ).then(() => {});
    }
  }, []);

  // Load user identity
  useEffect(() => {
    const stored = loadProfilFromStorage();
    if (stored.username) { setUsername(stored.username); setAvatarUrl(stored.avatarUrl); }

    if (supabaseConfigured) {
      const supabase = getBrowserClient()!;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase.auth.getUser().then((res: any) => {
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

  // Load messages
  useEffect(() => { loadMessages(); }, [loadMessages]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!HAUPTACCOUNT_ID || !supabaseConfigured) return;
    const supabase = getBrowserClient()!;
    const channel = supabase
      .channel(`chat-${HAUPTACCOUNT_ID}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `hauptaccount_id=eq.${HAUPTACCOUNT_ID}`,
        },
        (payload: { new: ChatMessage }) => {
          const msg = payload.new;
          if (msg.geloescht) return;
          const wasNearBottom = isNearBottom();
          setMessages((prev) => {
            if (prev.find((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          if (wasNearBottom) setTimeout(() => scrollToBottom(true), 50);
          if (msg.sender_id !== userIdRef.current) {
            const current = parseInt(localStorage.getItem(UNREAD_LS_KEY) ?? "0", 10);
            dispatchChatUnread(current + 1);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Presence for typing indicators
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
    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
    // Typing presence
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
    if (!text || sending || !HAUPTACCOUNT_ID) return;
    setSending(true);
    setNewMsg("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    presenceChannel.current?.track({ typing: false, name: username }).then(() => {});

    if (!supabaseConfigured) { setSending(false); return; }
    const supabase = getBrowserClient()!;
    await supabase.from("chat_messages").insert({
      hauptaccount_id: HAUPTACCOUNT_ID,
      sender_id: userId ?? "00000000-0000-0000-0000-000000000000",
      sender_name: username,
      sender_avatar_url: avatarUrl,
      nachricht: text,
    });
    setSending(false);
    scrollToBottom(true);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const noSupabase = !HAUPTACCOUNT_ID || !supabaseConfigured;

  // Build display items with date separators
  type Item = { type: "sep"; label: string } | { type: "msg"; msg: ChatMessage };
  const items: Item[] = [];
  let lastLabel = "";
  for (const msg of messages) {
    const label = getDateLabel(msg.created_at);
    if (label !== lastLabel) { items.push({ type: "sep", label }); lastLabel = label; }
    items.push({ type: "msg", msg });
  }

  return (
    <div className="flex flex-col" style={{ ...sans, height: "520px" }}>
      {noSupabase ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-white/30 text-center">
            Supabase konfigurieren um den Team-Chat zu nutzen.
          </p>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div ref={messagesRef} className="flex-1 overflow-y-auto space-y-1 pr-1" style={{ scrollbarWidth: "thin" }}>
            {loading ? (
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
                      {!isOwn && (
                        <span className="text-[10px] text-white/30 px-1">{msg.sender_name}</span>
                      )}
                      <div
                        className="px-3 py-2 rounded-2xl text-sm leading-relaxed break-words"
                        style={
                          isOwn
                            ? { backgroundColor: "rgba(200,75,47,0.2)", color: "rgba(255,255,255,0.9)", borderBottomRightRadius: 4 }
                            : { backgroundColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.75)", borderBottomLeftRadius: 4 }
                        }
                      >
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

          {/* Typing indicator */}
          <div className="h-5 flex items-center px-1">
            {typingUsers.length > 0 && (
              <p className="text-xs text-white/30 italic">
                {typingUsers.join(", ")} {typingUsers.length === 1 ? "tippt" : "tippen"} gerade…
              </p>
            )}
          </div>

          {/* Input */}
          <div
            className="flex items-end gap-2 border-t border-white/10 pt-3 mt-1"
          >
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
                <p className="absolute bottom-1 right-2 text-[10px] text-white/25">
                  {newMsg.length}/2000
                </p>
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
    </div>
  );
}
