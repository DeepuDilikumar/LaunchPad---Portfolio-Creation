"use client";

import { useState } from "react";
import { IconPlay } from "@/components/ui/icons";

/** 16:9 card; the video loads only after the visitor clicks Play. */
export function VideoCard({ src, poster, captions, title }: { src: string; poster: string; captions: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="relative aspect-video overflow-hidden rounded-[24px] border border-line bg-surface-1">
      {playing ? (
        <video className="h-full w-full" src={src} poster={poster} controls autoPlay playsInline>
          {captions ? <track kind="captions" src={captions} srcLang="en" label="English" default /> : null}
        </video>
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 flex items-center justify-center bg-cover bg-center"
          style={{ backgroundImage: `url(${poster})` }}
          aria-label={`Play video: ${title}`}
        >
          <span className="inline-flex h-12 items-center gap-2 rounded-full bg-invert px-5 text-[15px] font-medium text-invert-text transition-transform duration-200 group-hover:scale-[1.03]">
            <IconPlay size={14} /> Play
          </span>
        </button>
      )}
    </div>
  );
}
