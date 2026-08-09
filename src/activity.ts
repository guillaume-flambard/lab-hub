export type WorkerActivity = {
  ts: string;
  repo: string;
  status: string;
  detail: string;
  thinking?: string;
  order?: string[];
};

export type WorkerLearned = {
  total_learned: number;
  patterns: Record<string, number>;
  last: string;
};

const BASE = "https://activity.memolabs.dev";

export type WorkerState = {
  activity: WorkerActivity | null;
  learned: WorkerLearned | null;
};

export async function fetchState(): Promise<WorkerState> {
  try {
    const res = await fetch(`${BASE}/state`, { cache: "no-store" });
    if (!res.ok) return { activity: null, learned: null };
    return res.json();
  } catch {
    return { activity: null, learned: null };
  }
}

export function subscribe(cb: (state: WorkerState) => void): () => void {
  let es: EventSource | null = null;
  if (typeof EventSource !== "undefined") {
    try {
      es = new EventSource(`${BASE}/events`);
      es.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data);
          if (d.type === "activity") {
            cb({ activity: d.activity ?? null, learned: d.learned ?? null });
          }
        } catch {}
      };
    } catch {}
  }
  return () => es?.close();
}
