"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { fetchLinkPreview } from "@/features/chat/linkPreview";
import type { OGData } from "@/features/chat/linkPreview";

// Extensions that render inline — no OG card needed
const MEDIA_EXTENSIONS = /\.(jpe?g|png|gif|webp|svg|mp4|webm|ogg|mov|mp3|wav|flac|aac|pdf)(\?.*)?$/i;

function isDirectMediaUrl(url: string): boolean {
  try {
    const { pathname } = new URL(url);
    return MEDIA_EXTENSIONS.test(pathname);
  } catch {
    return false;
  }
}

interface LinkPreviewProps {
  url: string;
}

export function LinkPreview({ url }: LinkPreviewProps): React.ReactNode {
  const [data, setData] = useState<OGData | null>(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Suppress preview for direct media URLs — they render inline already
  if (isDirectMediaUrl(url)) return null;

  // Only start fetching once the container scrolls into view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;
    setLoading(true);

    fetchLinkPreview({ url }).then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [visible, url]);

  return (
    <div ref={containerRef} className="mt-1">
      {loading && (
        <div className="flex animate-pulse gap-2 rounded-md border border-[#1e1f22] bg-[#2b2d31] p-3">
          <div className="h-3 w-full rounded bg-[#3f4147]" />
        </div>
      )}

      {!loading && data && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex max-w-sm overflow-hidden rounded-md border border-[#1e1f22] bg-[#2b2d31] transition-colors hover:bg-[#35373c]"
        >
          <div className="w-1 shrink-0 bg-[#1d9bd1]" />
          <div className="flex min-w-0 flex-1 flex-col gap-1 p-3">
            {data.siteName && (
              <span className="text-[11px] font-medium text-[#1d9bd1]">
                {data.siteName}
              </span>
            )}
            {data.title && (
              <span className="line-clamp-2 text-sm font-semibold text-white">
                {data.title}
              </span>
            )}
            {data.description && (
              <span className="line-clamp-3 text-xs leading-relaxed text-[#b5bac1]">
                {data.description}
              </span>
            )}
          </div>
          {data.image && (
            <div className="relative h-full min-h-[72px] w-20 shrink-0 overflow-hidden">
              <Image
                src={data.image}
                alt={data.title ?? "Link preview"}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
        </a>
      )}
    </div>
  );
}
