import {
  CheckCircle2,
  Loader2,
  LocateFixed,
  Mail,
  MapPin,
  Paperclip,
  Phone,
  RefreshCw,
  Send,
  ThumbsDown,
  ThumbsUp,
  X,
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

type ConfirmedLocation = {
  address: string;
  latitude?: number;
  longitude?: number;
  source: "manual" | "browser_geolocation";
};

export type QuickReply = { label: string; value: string };

const conversationStorageKey = (widgetKey: string) => `zunftecho_chat_${widgetKey}`;
const transcriptStorageKey = (widgetKey: string) => `zunftecho_chat_messages_${widgetKey}`;

async function compressChatImage(file: File): Promise<File> {
  if (file.size > 10 * 1024 * 1024) throw new Error("original_too_large");
  if (!file.type.startsWith("image/")) throw new Error("invalid_image");

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("compression_failed");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.8),
  );
  if (!blob || blob.size > 1_500_000) throw new Error("compressed_too_large");
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "kundenfoto"}.webp`, {
    type: "image/webp",
  });
}

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
          ...(quickReplies ? { quick_replies: quickReplies } : {}),
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
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationAddress, setLocationAddress] = useState("");
  const [confirmedLocation, setConfirmedLocation] = useState<ConfirmedLocation | null>(null);
  const [locationPending, setLocationPending] = useState(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const [photoCount, setPhotoCount] = useState(0);
  const [photoPending, setPhotoPending] = useState(false);
  const [photoNotice, setPhotoNotice] = useState<string | null>(null);
  const conversationId = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedConversationId = sessionStorage.getItem(conversationStorageKey(widgetKey));
    conversationId.current = storedConversationId;
    setActiveConversationId(storedConversationId);
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

  useEffect(() => {
    if (!activeConversationId) return;
    let cancelled = false;

    const loadStaffReplies = async () => {
      try {
        const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/chat-transcript`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ widget_key: widgetKey, conversation_id: activeConversationId }),
        });
        if (!response.ok) return;
        const payload = (await response.json()) as {
          messages?: { id?: unknown; content?: unknown; source_channel?: unknown }[];
        };
        if (cancelled || !Array.isArray(payload.messages)) return;
        const incoming = payload.messages.flatMap((item): ChatMessage[] => {
          if (typeof item.id !== "string" || typeof item.content !== "string") return [];
          return [
            {
              role: "assistant",
              content: item.content,
              assistant_message_id: item.id,
              rating: null,
            },
          ];
        });
        setMessages((current) => {
          const existing = new Set(
            current.map((message) => message.assistant_message_id).filter(Boolean),
          );
          const missing = incoming.filter((message) => !existing.has(message.assistant_message_id));
          return missing.length ? [...current, ...missing] : current;
        });
      } catch {
        // Polling is best-effort; the regular chat remains fully usable.
      }
    };

    void loadStaffReplies();
    const interval = window.setInterval(() => void loadStaffReplies(), 8_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [activeConversationId, widgetKey]);

  const handleSend = async (
    suggestedText?: string,
    appendUser = true,
    location: ConfirmedLocation | null = confirmedLocation,
  ) => {
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
        ...(location ? { location } : {}),
      });

      if (result.conversation_id) {
        conversationId.current = result.conversation_id;
        setActiveConversationId(result.conversation_id);
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

  const requestBrowserLocation = () => {
    setLocationNotice(null);
    if (!("geolocation" in navigator)) {
      setLocationNotice(
        "Ihr Browser unterstützt die Standortfreigabe nicht. Bitte Adresse eingeben.",
      );
      setLocationOpen(true);
      return;
    }

    setLocationPending(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/reverse-geocode`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              widget_key: widgetKey,
              latitude: coords.latitude,
              longitude: coords.longitude,
            }),
          });
          const payload = (await response.json()) as { ok?: boolean; address?: unknown };
          if (!response.ok || payload.ok !== true || typeof payload.address !== "string") {
            throw new Error("reverse_failed");
          }
          setLocationAddress(payload.address);
          setConfirmedLocation({
            address: payload.address,
            latitude: coords.latitude,
            longitude: coords.longitude,
            source: "browser_geolocation",
          });
          setLocationOpen(true);
          setLocationNotice("Standort gefunden. Bitte prüfen und anschließend bestätigen.");
        } catch {
          setLocationOpen(true);
          setLocationNotice(
            "Der Standort konnte nicht in eine Adresse umgewandelt werden. Bitte Adresse eingeben.",
          );
        } finally {
          setLocationPending(false);
        }
      },
      () => {
        setLocationPending(false);
        setLocationOpen(true);
        setLocationNotice(
          "Keine Standortfreigabe erfolgt. Sie können die Adresse stattdessen manuell eingeben.",
        );
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  };

  const confirmManualLocation = () => {
    const address = locationAddress.trim();
    if (address.length < 5) {
      setLocationNotice("Bitte geben Sie eine vollständige Adresse ein.");
      return;
    }
    const location: ConfirmedLocation =
      confirmedLocation?.source === "browser_geolocation" && confirmedLocation.address === address
        ? confirmedLocation
        : { address, source: "manual" };
    setLocationOpen(false);
    setConfirmedLocation(null);
    setLocationAddress("");
    setLocationNotice("Adresse bestätigt und wird mit Ihrer Anfrage übermittelt.");
    void handleSend(`Adresse bestätigt: ${address}`, true, location);
  };

  const closeLocationEditor = () => {
    setLocationOpen(false);
    setLocationAddress("");
    setConfirmedLocation(null);
    setLocationNotice(null);
  };

  const uploadPhoto = async (file: File) => {
    if (!conversationId.current) {
      setPhotoNotice(
        "Bitte senden Sie zuerst eine kurze Nachricht, damit das Foto Ihrer Anfrage zugeordnet werden kann.",
      );
      return;
    }
    if (photoCount >= 3) {
      setPhotoNotice("Maximal drei optionale Fotos pro Anfrage.");
      return;
    }
    setPhotoPending(true);
    setPhotoNotice(null);
    try {
      const compressed = await compressChatImage(file);
      const form = new FormData();
      form.set("widget_key", widgetKey);
      form.set("conversation_id", conversationId.current);
      form.set("file", compressed);
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/chat-attachment`, {
        method: "POST",
        body: form,
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        remaining?: unknown;
        code?: unknown;
      };
      if (!response.ok || payload.ok !== true)
        throw new Error(String(payload.code ?? "upload_failed"));
      const remaining =
        typeof payload.remaining === "number" && Number.isFinite(payload.remaining)
          ? Math.max(0, Math.min(2, Math.floor(payload.remaining)))
          : null;
      setPhotoCount(remaining === null ? (current) => current + 1 : 3 - remaining);
      setPhotoNotice("Foto sicher hochgeladen und Ihrer Anfrage zugeordnet.");
      setMessages((current) => [
        ...current,
        { role: "user", content: "📎 Optionales Foto hochgeladen" },
      ]);
    } catch (uploadError) {
      const code = uploadError instanceof Error ? uploadError.message : "";
      setPhotoNotice(
        code === "original_too_large"
          ? "Das Originalfoto darf höchstens 10 MB groß sein."
          : code === "compressed_too_large"
            ? "Das Foto ist nach der Komprimierung noch zu groß. Bitte wählen Sie ein anderes Bild."
            : code === "image_limit_reached"
              ? "Für diese Anfrage wurden bereits drei Fotos hochgeladen."
              : code === "invalid_image" || code === "file_type_mismatch"
                ? "Die Datei ist kein gültiges JPEG-, PNG- oder WebP-Bild."
                : "Das Foto konnte nicht hochgeladen werden. Bitte versuchen Sie es erneut.",
      );
    } finally {
      setPhotoPending(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={requestBrowserLocation}
            disabled={pending || locationPending}
          >
            {locationPending ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <LocateFixed className="mr-1.5 size-3.5" />
            )}
            Meinen Standort teilen
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setLocationOpen((open) => !open)}
            disabled={pending}
          >
            <MapPin className="mr-1.5 size-3.5" /> Adresse eingeben
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadPhoto(file);
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={pending || photoPending || photoCount >= 3}
          >
            {photoPending ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <Paperclip className="mr-1.5 size-3.5" />
            )}
            Foto anhängen (optional)
          </Button>
        </div>
        {locationOpen ? (
          <div
            className="mb-2 rounded-md border bg-muted/30 p-2"
            role="region"
            aria-label="Adresse bestätigen"
          >
            <div className="mb-1.5 flex items-start justify-between gap-2">
              <p className="text-[11px] text-muted-foreground">
                Der Browser fragt nur nach Ihrer ausdrücklichen Zustimmung. Prüfen Sie die Adresse
                vor dem Senden.
              </p>
              <button
                type="button"
                onClick={closeLocationEditor}
                className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Adresseingabe schließen"
              >
                <X className="size-3.5" />
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <input
                value={locationAddress}
                onChange={(event) => {
                  setLocationAddress(event.target.value);
                  if (confirmedLocation?.address !== event.target.value) setConfirmedLocation(null);
                }}
                placeholder="Straße, Hausnummer, PLZ und Ort"
                className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-xs"
              />
              <Button type="button" size="sm" onClick={confirmManualLocation}>
                Bestätigen
              </Button>
            </div>
            <button
              type="button"
              onClick={closeLocationEditor}
              className="mt-2 text-[11px] font-medium text-muted-foreground underline underline-offset-2"
            >
              Abbrechen
            </button>
            {confirmedLocation?.source === "browser_geolocation" ? (
              <p className="mt-1 text-[10px] text-muted-foreground">
                Kartendaten © OpenStreetMap-Mitwirkende
              </p>
            ) : null}
          </div>
        ) : null}
        {locationNotice ? (
          <p className="mb-2 text-[11px] text-muted-foreground">{locationNotice}</p>
        ) : null}
        {photoNotice ? (
          <p className="mb-2 text-[11px] text-muted-foreground">{photoNotice}</p>
        ) : null}
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
