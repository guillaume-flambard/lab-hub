export interface Project {
  name: string;
  status: string;
  visibility: string;
  url: string | null;
  repo: string | null;
  description: string;
  language: string | null;
  lab_candidate: boolean;
  last_push_days: number | null;
  notes: { fr: string; en: string } | null;
}

export async function loadProjects(): Promise<Project[]> {
  // chemin absolu : les pages sont servies sous /fr/ et /en/
  const res = await fetch("/projects.json", { cache: "no-cache" });
  if (!res.ok) throw new Error(`failed to load projects.json (${res.status})`);
  return res.json();
}
