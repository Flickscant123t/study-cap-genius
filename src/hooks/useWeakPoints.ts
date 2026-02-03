import { useState, useEffect, useCallback } from "react";

export interface WeakPoint {
  topic: string;
  count: number;
  lastFailed: string;
}

const STORAGE_KEY = "studycap_weak_points";

export function useWeakPoints() {
  const [weakPoints, setWeakPoints] = useState<WeakPoint[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setWeakPoints(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse weak points:", e);
        localStorage.setItem(STORAGE_KEY, "[]");
      }
    }
  }, []);

  // Save to localStorage whenever weakPoints changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(weakPoints));
  }, [weakPoints]);

  const addWeakPoint = useCallback((topic: string) => {
    setWeakPoints((prev) => {
      const existing = prev.find((wp) => wp.topic.toLowerCase() === topic.toLowerCase());
      if (existing) {
        return prev.map((wp) =>
          wp.topic.toLowerCase() === topic.toLowerCase()
            ? { ...wp, count: wp.count + 1, lastFailed: new Date().toISOString() }
            : wp
        );
      }
      return [...prev, { topic, count: 1, lastFailed: new Date().toISOString() }];
    });
  }, []);

  const removeWeakPoint = useCallback((topic: string) => {
    setWeakPoints((prev) => prev.filter((wp) => wp.topic.toLowerCase() !== topic.toLowerCase()));
  }, []);

  const decrementWeakPoint = useCallback((topic: string) => {
    setWeakPoints((prev) => {
      return prev
        .map((wp) =>
          wp.topic.toLowerCase() === topic.toLowerCase()
            ? { ...wp, count: wp.count - 1 }
            : wp
        )
        .filter((wp) => wp.count > 0);
    });
  }, []);

  const getTopWeakPoints = useCallback(
    (limit: number = 5) => {
      return [...weakPoints].sort((a, b) => b.count - a.count).slice(0, limit);
    },
    [weakPoints]
  );

  const isWeakPoint = useCallback(
    (topic: string) => {
      return weakPoints.some((wp) => wp.topic.toLowerCase() === topic.toLowerCase());
    },
    [weakPoints]
  );

  const clearAll = useCallback(() => {
    setWeakPoints([]);
    localStorage.setItem(STORAGE_KEY, "[]");
  }, []);

  return {
    weakPoints,
    addWeakPoint,
    removeWeakPoint,
    decrementWeakPoint,
    getTopWeakPoints,
    isWeakPoint,
    clearAll,
  };
}
