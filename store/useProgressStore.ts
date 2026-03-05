import { create } from "zustand";
import { addDays, format } from "date-fns";

interface ProgressState {
  favorites: Set<string>;
  solved: Set<string>;
  activity: Record<string, number>; // "yyyy-MM-dd" -> count
  toggleFavorite(id: string): void;
  markSolved(id: string): void;
  todayTick(): void;
}

function todayKey() {
  return format(new Date(), "yyyy-MM-dd");
}

export const useProgressStore = create<ProgressState>((set,get)=>({
  favorites: new Set(),
  solved: new Set(),
  activity: {},
  toggleFavorite: (id)=> set(s=>{
    const f = new Set(s.favorites);
    f.has(id) ? f.delete(id) : f.add(id);
    return { favorites: f };
  }),
  markSolved: (id)=> set(s=>{
    const solved = new Set(s.solved); solved.add(id);
    const key = todayKey();
    const activity = { ...s.activity, [key]: (s.activity[key]||0) + 1 };
    return { solved, activity };
  }),
  todayTick: ()=> set(s=>{
    const key = todayKey();
    const activity = { ...s.activity, [key]: (s.activity[key]||0) + 1 };
    return { activity };
  })
}));
