import { useState } from "react";
import { ExternalLink, Play, ShieldCheck } from "lucide-react";

const youtubeVideoId = "IG5tb2o-ASY";

export function YouTubeVideoLite() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-[0_28px_70px_-38px_rgba(2,8,23,0.7)]">
      <div className="relative aspect-video bg-slate-950">
        {isPlaying ? (
          <iframe
            className="absolute inset-0 size-full"
            src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?autoplay=1&rel=0`}
            title="ZunftEcho in 65 Sekunden erklärt"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            className="group absolute inset-0 size-full cursor-pointer overflow-hidden text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-500"
            onClick={() => setIsPlaying(true)}
            aria-label="ZunftEcho Video abspielen. YouTube wird erst nach dem Klick geladen."
          >
            <img
              src="/zunftecho-video-preview.webp"
              alt="Vorschau des ZunftEcho Erklärvideos"
              width="1280"
              height="720"
              loading="lazy"
              decoding="async"
              className="size-full object-cover transition duration-500 group-hover:scale-[1.015] group-focus-visible:scale-[1.015] motion-reduce:transition-none"
            />
            <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_48%,rgba(2,6,23,0.7))]" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex size-16 items-center justify-center rounded-full border border-white/50 bg-white/90 text-primary shadow-2xl backdrop-blur-sm transition duration-300 group-hover:scale-105 group-focus-visible:scale-105 motion-reduce:transition-none sm:size-20">
                <Play className="ml-1 size-7 fill-current sm:size-8" aria-hidden="true" />
              </span>
            </span>
            <span className="absolute right-4 bottom-4 left-4 flex items-center justify-between gap-3 text-white">
              <span className="text-sm font-semibold sm:text-base">Video ansehen · 1:05 Min.</span>
              <span className="hidden items-center gap-1.5 text-xs text-slate-200 sm:flex">
                <ShieldCheck className="size-4" aria-hidden="true" /> Erst nach Klick geladen
              </span>
            </span>
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-3 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <span className="flex items-center gap-2">
          <ShieldCheck className="size-4 shrink-0 text-emerald-400" aria-hidden="true" />
          Ohne Tracking-Verbindung vor Ihrer Zustimmung
        </span>
        <a
          href={`https://youtu.be/${youtubeVideoId}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 font-medium text-slate-300 hover:text-white"
        >
          Direkt auf YouTube öffnen <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
