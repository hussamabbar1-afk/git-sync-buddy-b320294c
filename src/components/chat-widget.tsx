import {
  CheckCircle2,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Send,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { SUPABASE_FUNCTIONS_URL } from "@/lib/supabase-urls";
import { sendChatMessage } from "@/lib/chat.functions";

export type ChatMetadata = {
  client_id?: string;
  origin?: string;
  page_url?: string;
  page_title?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  assistant_message_id?: string | null;
  language?: string | null;
  rating?: 1 | -1 | null;
  quick_replies?: QuickReply[];
  progress_percent?: number | null;
  summary?: string | null;
};

export type QuickReply = { label: string; value: string };

const conversationStorageKey = (widgetKey: string) => `zunftecho_chat_${widgetKey}`;
const transcriptStorageKey = (widgetKey: string) => `zunftecho_chat_messages_${widgetKey}`;

function restoreMessages(widgetKey: string): ChatMessage[] {
  try {
    const stored = sessionStorage.getItem(transcriptStorageKey(widgetKey));
    if (!stored) return [];
    const parsed = JSON.parse(stored) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.slice(-40).flatMap((item): ChatMessage[] => {
      if (!item || typeof item !== "object") return [];
      const value = item as Record<string, unknown>;
      const role = value["role"];
      const content = value["content"];
      if ((role !== "user" && role !== "assistant") || typeof content !== "string") return [];

      const quickReplies = Array.isArray(value["quick_replies"])
        ? value["quick_replies"]
            .flatMap((reply): QuickReply[] => {
              if (!reply || typeof reply !== "object") return [];
              const candidate = reply as Record<string, unknown>;
              const label = candidate["label"];
              const replyValue = candidate["value"];
              if (typeof label !== "string" || typeof replyValue !== "string") return [];
              return [{ label: label.slice(0, 120), value: replyValue.slice(0, 500) }];
            })
            .slice(0, 6)
        : undefined;
      const rawProgress = value["progress_percent"];

      return [
        {
          role,
          content: content.slice(0, 20_000),
          assistant_message_id:
            typeof value["assistant_message_id"] === "string"
              ? value["assistant_message_id"]
              : null,
          language: typeof value["language"] === "string" ? value["language"].slice(0, 20) : null,
          rating: value["rating"] === 1 || value["rating"] === -1 ? value["rating"] : null,
          quick_replies: quickReplies,
          progress_percent:
            typeof rawProgress === "number" && Number.isFinite(rawProgress)
              ? Math.max(0, Math.min(100, Math.round(rawProgress)))
              : null,
          summary: typeof value["summary"] === "string" ? value["summary"].slice(0, 2000) : null,
        },
      ];
    });
  } catch {
    return [];
  }
}

export function ChatWidget({
  widgetKey,
  welcomeMessage,
  metadata,
  maxMessageLength = 4000,
  initialQuickReplies = [],
  fallbackMessage,
  contactPhone,
  contactEmail,
}: {
  widgetKey: string;
  welcomeMessage?: string | null;
  metadata?: ChatMetadata;
  maxMessageLength?: number;
  initialQuickReplies?: QuickReply[];
  fallbackMessage?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryText, setRetryText] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const conversationId = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    conversationId.current = sessionStorage.getItem(conversationStorageKey(widgetKey));
    setMessages(restoreMessages(widgetKey));
    setRestored(true);
  }, [widgetKey]);

  useEffect(() => {
    if (typeof window === "undefined" || !restored) return;
    sessionStorage.setItem(transcriptStorageKey(widgetKey), JSON.stringify(messages.slice(-40)));
  }, [messages, restored, widgetKey]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, pending]);

  const handleSend = async (suggestedText?: string, appendUser = true) => {
    const text = (suggestedText ?? input).trim();
    if (!text || pending) return;
    if (text.length > maxMessageLength) {
      setError(
        `Die Nachricht darf höchstens ${maxMessageLength.toLocaleString("de-DE")} Zeichen enthalten.`,
      );
      return;
    }

    setError(null);
    setRetryText(null);
    setPending(true);
    setInput("");
    if (appendUser) setMessages((m) => [...m, { role: "user", content: text }]);

    try {
      const result = await sendChatMessage({
        widget_key: widgetKey,
        message: text,
        ...(conversationId.current ? { conversation_id: conversationId.current } : {}),
        ...(metadata ?? {}),
      });

      if (result.conversation_id) {
        conversationId.current = result.conversation_id;
        sessionStorage.setItem(conversationStorageKey(widgetKey), result.conversation_id);
      }

      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: result.message || "…",
          assistant_message_id: result.assistant_message_id,
          language: result.language,
          rating: null,
          quick_replies: result.quick_replies,
          progress_percent: result.progress_percent,
          summary: result.summary,
        },
      ]);
    } catch {
      setRetryText(text);
      setError(
        fallbackMessage?.trim() ||
          "Die Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es erneut.",
      );
    } finally {
      setPending(false);
    }
  };

  const rate = async (index: number, rating: 1 | -1) => {
    const message = messages[index];
    if (!message?.assistant_message_id || !conversationId.current) return;

    const previous = message.rating ?? null;
    setMessages((m) => m.map((item, i) => (i === index ? { ...item, rating } : item)));

    try {
      const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/chat-feedback`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          widget_key: widgetKey,
          conversation_id: conversationId.current,
          message_id: message.assistant_message_id,
          rating,
        }),
      });
      if (!res.ok) throw new Error("feedback failed");
      if (rating === -1 && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("zunftecho:knowledge-gap-updated"));
      }
    } catch {
      setMessages((m) => m.map((item, i) => (i === index ? { ...item, rating: previous } : item)));
    }
  };

  return (
    <div className="flex h-80 flex-col rounded-md border">
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-3">
        {welcomeMessage ? (
          <div className="max-w-[85%] rounded-lg bg-muted px-3 py-2 text-xs">{welcomeMessage}</div>
        ) : null}
        {messages.map((message, index) => (
          <div key={index} className="space-y-1">
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                message.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              {message.content}
            </div>
            {message.role === "assistant" && message.assistant_message_id ? (
              <div className="flex items-center gap-2 pl-1">
                {message.rating ? (
                  <span className="text-[10px] text-muted-foreground">
                    Danke für Ihre Rückmeldung.
                  </span>
                ) : null}
                <button
                  type="button"
                  aria-label="Hilfreich"
                  onClick={() => void rate(index, 1)}
                  className={`rounded p-1 transition-colors hover:bg-muted ${
                    message.rating === 1 ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <ThumbsUp className="size-3" />
                </button>
                <button
                  type="button"
                  aria-label="Nicht hilfreich"
                  onClick={() => void rate(index, -1)}
                  className={`rounded p-1 transition-colors hover:bg-muted ${
                    message.rating === -1 ? "text-destructive" : "text-muted-foreground"
                  }`}
                >
                  <ThumbsDown className="size-3" />
                </button>
              </div>
            ) : null}
            {message.role === "assistant" &&
            message.progress_percent !== null &&
            message.progress_percent !== undefined ? (
              <div className="max-w-[85%] space-y-1 px-1">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Anfragefortschritt</span>
                  <span>{message.progress_percent}%</span>
                </div>
                <Progress value={message.progress_percent} className="h-1.5" />
              </div>
            ) : null}
            {message.role === "assistant" && message.summary ? (
              <div className="max-w-[90%] rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-950">
                <p className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="size-3.5" /> Zusammenfassung
                </p>
                <p className="mt-1 whitespace-pre-line leading-5">{message.summary}</p>
              </div>
            ) : null}
            {message.role === "assistant" &&
            index === messages.length - 1 &&
            message.quick_replies?.length ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {message.quick_replies.map((reply) => (
                  <button
                    key={`${reply.label}-${reply.value}`}
                    type="button"
                    onClick={() => void handleSend(reply.value)}
                    disabled={pending}
                    className="rounded-full border border-primary/30 bg-background px-3 py-1.5 text-left text-[11px] font-medium text-primary transition-colors hover:bg-primary/5 disabled:opacity-50"
                  >
                    {reply.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ))}
        {!messages.length && initialQuickReplies.length ? (
          <div className="grid gap-1.5 sm:grid-cols-2">
            {initialQuickReplies.map((reply) => (
              <button
                key={`${reply.label}-${reply.value}`}
                type="button"
                onClick={() => void handleSend(reply.value)}
                disabled={pending}
                className="rounded-lg border bg-background px-3 py-2 text-left text-xs font-medium transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50"
              >
                {reply.label}
              </button>
            ))}
          </div>
        ) : null}
        {pending ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" /> Antwort wird geladen …
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="space-y-2 border-t px-3 py-2 text-xs text-destructive" role="alert">
          <p>{error}</p>
          <div className="flex flex-wrap items-center gap-2">
            {retryText ? (
              <button
                type="button"
                onClick={() => void handleSend(retryText, false)}
                className="inline-flex items-center gap-1 rounded border border-destructive/30 px-2 py-1 font-medium"
              >
                <RefreshCw className="size-3" /> Erneut senden
              </button>
            ) : null}
            {contactPhone ? (
              <a className="inline-flex items-center gap-1 underline" href={`tel:${contactPhone}`}>
                <Phone className="size-3" /> Anrufen
              </a>
            ) : null}
            {contactEmail ? (
              <a
                className="inline-flex items-center gap-1 underline"
                href={`mailto:${contactEmail}`}
              >
                <Mail className="size-3" /> E-Mail
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="border-t p-2">
        <div className="flex items-end gap-2">
          <Textarea
            rows={2}
            maxLength={maxMessageLength}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Nachricht schreiben"
            disabled={pending}
            aria-describedby="chat-character-count"
          />
          <Button
            aria-label="Nachricht senden"
            onClick={() => void handleSend()}
            disabled={pending || !input.trim()}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
        <p id="chat-character-count" className="mt-1 text-right text-[10px] text-muted-foreground">
          {input.length.toLocaleString("de-DE")} / {maxMessageLength.toLocaleString("de-DE")}
        </p>
      </div>
    </div>
  );
}
