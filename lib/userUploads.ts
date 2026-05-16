// lib/userUploads.ts
import { Playlist } from "./playlists";

// Keys for local storage
const UPLOADS_KEY = "elysium_tutor_uploads";

export type TutorUpload = Playlist & {
  upvotes: number;
  isTutorUpload: true;
  uploaderName: string;
};

export function getTutorUploads(): TutorUpload[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(UPLOADS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error("Failed to parse tutor uploads", err);
    return [];
  }
}

export function saveTutorUpload(upload: Omit<TutorUpload, "id" | "upvotes" | "isTutorUpload">) {
  if (typeof window === "undefined") return;
  const current = getTutorUploads();
  
  const newUpload: TutorUpload = {
    ...upload,
    id: `tutor_upload_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    upvotes: 0,
    isTutorUpload: true,
  };

  current.unshift(newUpload); // Add to beginning
  localStorage.setItem(UPLOADS_KEY, JSON.stringify(current));
  return newUpload;
}

export function upvoteTutorUpload(id: string) {
  if (typeof window === "undefined") return;
  const current = getTutorUploads();
  const updated = current.map((item) => {
    if (item.id === id) {
      return { ...item, upvotes: item.upvotes + 1 };
    }
    return item;
  });
  localStorage.setItem(UPLOADS_KEY, JSON.stringify(updated));
  return updated;
}
