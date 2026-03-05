// lib/gamification.ts
import { get, set } from "idb-keyval";

export type Progress = {
  xp: number;
  level: number;
  badges: string[];
  streak: number;
  lastActive: string | null;
};

const defaultProgress: Progress = {
  xp: 0,
  level: 1,
  badges: [],
  streak: 0,
  lastActive: null,
};

export async function getProgress(): Promise<Progress> {
  try {
    const p = await get("progress");
    return p ?? defaultProgress;
  } catch {
    return defaultProgress;
  }
}

export async function updateProgress(deltaXp: number): Promise<Progress> {
  const progress = await getProgress();
  progress.xp += deltaXp;

  // Level up
  progress.level = Math.floor(progress.xp / 100) + 1;

  // Badge unlocks
  if (progress.xp >= 50 && !progress.badges.includes("Bronze Explorer")) {
    progress.badges.push("Bronze Explorer");
  }
  if (progress.xp >= 100 && !progress.badges.includes("Silver Explorer")) {
    progress.badges.push("Silver Explorer");
  }
  if (progress.xp >= 200 && !progress.badges.includes("Gold Explorer")) {
    progress.badges.push("Gold Explorer");
  }

  // Streak tracking
  const today = new Date().toDateString();
  if (progress.lastActive === today) {
    // already active today
  } else if (
    progress.lastActive &&
    new Date(progress.lastActive).getTime() + 86400000 ===
      new Date(today).getTime()
  ) {
    progress.streak += 1;
    progress.lastActive = today;
  } else {
    progress.streak = 1;
    progress.lastActive = today;
  }

  await set("progress", progress);
  return progress;
}
