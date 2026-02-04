"use client";

import { useSyncExternalStore } from "react";

// Custom hook for hydration-safe mounting detection
// Using useSyncExternalStore avoids react-hooks/set-state-in-effect warnings
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function useIsMounted(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
