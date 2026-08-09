export type WorkerActivity = {
  ts: string;
  repo: string;
  status: string;
  detail: string;
};

export type WorkerLearned = {
  total_learned: number;
  patterns: Record<string, number>;
  last: string;
};

const BASE = "https://activity.memolabs.dev";

export async function fetchState(): Promise<{
  activity: WorkerActivity | null;
  learned: WorkerLearned | null;
}> {
  try {
    const res = await fetch(`${BASE}/state`, { cache: "no-store" });
    if (!res.ok) return { activity: null, learned: null };
    return res.json();
  } catch {
    return { activity: null, learned: null };
  }
}

export function subscribe(cb: (activity: WorkerActivity) => void): () => void {
  let es: EventSource | null = null;
  if (typeof EventSource !== "undefined") {
    try {
      es = new EventSource(`${BASE}/events`);
      es.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data);
          if (d.type === "activity") cb(d);
        } catch {}
      };
    } catch {}
  }
  return () => es?.close();
}
