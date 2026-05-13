"use client";

import { create } from "zustand";

export interface SessionHistory {
  assignmentIds: string[];
  lastPlayId?: string;
}

interface GameSessionState {
  sessionId: string;
  recentAssignmentIds: string[];
  pushAssignment: (id: string) => void;
  resetSession: () => void;
}

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `sess-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const useGameSessionStore = create<GameSessionState>((set, get) => ({
  sessionId: makeId(),
  recentAssignmentIds: [],
  pushAssignment: (id) =>
    set({
      recentAssignmentIds: [...get().recentAssignmentIds, id].slice(-6),
    }),
  resetSession: () =>
    set({
      sessionId: makeId(),
      recentAssignmentIds: [],
    }),
}));
