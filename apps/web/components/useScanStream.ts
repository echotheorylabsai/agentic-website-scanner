"use client";

import { useEffect, useRef, useState } from "react";

/** Subscribes to /api/scan/stream for a target; replays + live frames. */
export function useScanStream(target: string) {
  const [events, setEvents] = useState<Record<string, unknown>[]>([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    setEvents([]); setDone(false); setError(null);
    // EventSource can't set headers but our stream route only needs the query param
    const es = new EventSource(`/api/scan/stream?target=${encodeURIComponent(target)}`);
    esRef.current = es;
    es.onmessage = (m) => {
      try {
        const ev = JSON.parse(m.data) as Record<string, unknown>;
        setEvents((prev) => [...prev.slice(-500), ev]);
        if (ev.type === "scan_archived" || ev.type === "error") {
          if (ev.type === "error") setError(String(ev.message));
          setDone(true);
          es.close();
        }
      } catch { /* ignore malformed */ }
    };
    es.onerror = () => {
      // stream closed by server after completion — treat as done
      setDone(true);
      es.close();
    };
    return () => es.close();
  }, [target]);

  return { events, done, error };
}
