export interface Project {
  name: string;
  tier: string;
  status: string;
  visibility: string;
  url: string | null;
  repo: string | null;
  description: string;
  language: string | null;
  last_push_days: number | null;
  family: string | null;
  manifest_status: string | null;
  stack: string | null;
  vault_note: string | null;
  lab_candidate: boolean;
  show_on_hub: boolean;
}

export async function loadProjects(): Promise<Project[]> {
  // chemin absolu : les pages sont servies sous /fr/ et /en/
  const res = await fetch("/projects.json", { cache: "no-cache" });
  if (!res.ok) throw new Error(`failed to load projects.json (${res.status})`);
  return res.json();
}
