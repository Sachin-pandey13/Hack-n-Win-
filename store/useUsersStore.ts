import { create } from "zustand";

interface UsersState {
  user: any | null;
  classLevel: string | null;
  stream: string | null;
  goal: string | null;
  setupComplete: boolean;

  setUser: (user: any) => void;
  setClass: (classLevel: string) => void;
  setStream: (stream: string) => void;
  setGoal: (goal: string) => void;
  completeSetup: () => void;
  logout: () => void;
}

export const useUsersStore = create<UsersState>((set) => ({
  user: null,

  classLevel: null,
  stream: null,
  goal: null,

  setupComplete: false,

  setUser: (user) =>
    set(() => ({
      user,
    })),

  setClass: (classLevel) =>
    set(() => ({
      classLevel,
    })),

  setStream: (stream) =>
    set(() => ({
      stream,
    })),

  setGoal: (goal) =>
    set(() => ({
      goal,
    })),

  completeSetup: () =>
    set(() => ({
      setupComplete: true,
    })),

  logout: () =>
    set(() => ({
      user: null,
      classLevel: null,
      stream: null,
      goal: null,
      setupComplete: false,
    })),
}));