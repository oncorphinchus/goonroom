"use server";

import { z } from "zod";

export interface OGData {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  url: string;
}

const previewCache = new Map<string, OGData | null>();
const CACHE_MAX = 500;

function setCacheEntry(url: string, value: OGData | null): void {
  if (previewCache.size >= CACHE_MAX) {
    previewCache.delete(previewCache.keys().next().value!);
  }
  previewCache.set(url, value);
}

const fetchPreviewSchema = z.object({
  url: z.string().url("Invalid URL"),
});

function extractMeta(html: string, property: string): string | undefined {
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return undefined;
}

function extractTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1]?.trim();
}

export async function fetchLinkPreview(input: {
  url: string;
}): Promise<OGData | null> {
  const parsed = fetchPreviewSchema.safeParse(input);
  if (!parsed.success) return null;

  const { url } = parsed.data;

  if (previewCache.has(url)) {
    return previewCache.get(url) ?? null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "GoonRoom/1.0 (link preview bot)",
        Accept: "text/html",
      },
    });

    clearTimeout(timeout);

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      setCacheEntry(url, null);
      return null;
    }

    const html = await response.text();

    const ogTitle = extractMeta(html, "og:title");
    const ogDescription = extractMeta(html, "og:description");
    const ogImage = extractMeta(html, "og:image");
    const ogSiteName = extractMeta(html, "og:site_name");
    const twitterTitle = extractMeta(html, "twitter:title");
    const twitterDescription = extractMeta(html, "twitter:description");
    const twitterImage = extractMeta(html, "twitter:image");
    const metaDescription = extractMeta(html, "description");
    const pageTitle = extractTitle(html);

    const title = ogTitle ?? twitterTitle ?? pageTitle;
    const description = ogDescription ?? twitterDescription ?? metaDescription;
    const rawImage = ogImage ?? twitterImage;
    const image = rawImage
      ? rawImage.startsWith("http")
        ? rawImage
        : new URL(rawImage, url).href
      : undefined;
    const siteName = ogSiteName ?? new URL(url).hostname.replace(/^www\./, "");

    if (!title && !description && !image) {
      setCacheEntry(url, null);
      return null;
    }

    const result: OGData = {
      title,
      description,
      image,
      siteName,
      url,
    };

    setCacheEntry(url, result);
    return result;
  } catch {
    setCacheEntry(url, null);
    return null;
  }
}
