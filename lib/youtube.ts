// lib/youtube.ts

export type YTSource =
  | { kind: "playlist"; playlistId: string } // can be a raw ID or any YouTube URL with ?list=
  | { kind: "video"; videoId: string };      // can be a raw ID or any YouTube URL

/** Extract playlist ID from any YouTube URL or return the input if it already looks like an ID. */
export function getPlaylistId(input: string): string {
  try {
    // If it's already an ID (most playlist IDs start with "PL" or "UU" etc.)
    if (/^[A-Za-z0-9_-]{10,}$/.test(input) && !input.includes("http")) {
      return input;
    }
    const url = new URL(input);
    // playlist URL: https://www.youtube.com/playlist?list=XXXX
    const list = url.searchParams.get("list");
    if (list) return list;
    // some video URLs carry &list=XXXX
    const listFromVideo = url.searchParams.get("list");
    if (listFromVideo) return listFromVideo;
  } catch {
    /* fall through */
  }
  return input;
}

/** Extract video ID from any YouTube URL or return the input if it already looks like an ID. */
export function getVideoId(input: string): string {
  try {
    if (/^[A-Za-z0-9_-]{10,}$/.test(input) && !input.includes("http")) {
      return input;
    }
    const url = new URL(input);
    // https://www.youtube.com/watch?v=XXXX
    const v = url.searchParams.get("v");
    if (v) return v;
    // youtu.be short links
    if (url.hostname.includes("youtu.be")) {
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length) return parts[0];
    }
    // /embed/XXXX
    const p = url.pathname.split("/").filter(Boolean);
    const i = p.indexOf("embed");
    if (i >= 0 && p[i + 1]) return p[i + 1];
  } catch {
    /* fall through */
  }
  return input;
}

/** Build a robust embed URL from arbitrary input. */
export function buildEmbedSrc(
  src: YTSource,
  origin?: string
): string {
  const o = origin ?? (typeof window !== "undefined" ? window.location.origin : "http://localhost");
  if (src.kind === "playlist") {
    const list = getPlaylistId(src.playlistId);
    // use nocookie domain + basic hygiene params
    return `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(
      list
    )}&rel=0&modestbranding=1&origin=${encodeURIComponent(o)}`;
  } else {
    const id = getVideoId(src.videoId);
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(
      id
    )}?rel=0&modestbranding=1&origin=${encodeURIComponent(o)}`;
  }
}

/** Build the external (non-embed) URL to open on YouTube. */
export function buildExternalUrl(src: YTSource): string {
  if (src.kind === "playlist") {
    const list = getPlaylistId(src.playlistId);
    return `https://www.youtube.com/playlist?list=${encodeURIComponent(list)}`;
  } else {
    const id = getVideoId(src.videoId);
    return `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
  }
}
