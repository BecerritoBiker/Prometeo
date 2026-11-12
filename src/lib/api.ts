import { useQuery } from "@tanstack/react-query";

export type Role = "user" | "moderator" | "admin";
export type User = { id: string; email: string; full_name: string; role: Role };
export type Category = { id: string; name: string; description: string; color: string };
export const STATUSES = ["nuevo", "en_verificacion", "remitido", "cerrado"] as const;
export type Status = (typeof STATUSES)[number];
export const STATUS_LABELS: Record<Status, string> = {
  nuevo: "Nuevo", en_verificacion: "En verificación", remitido: "Remitido", cerrado: "Cerrado",
};
export const SEVERITY_LABELS = ["", "Leve", "Moderado", "Importante", "Crítico", "Emergencia"];
export type Incident = {
  id: string;
  category_id: string;
  title: string;
  description: string;
  subcategory: string | null;
  severity: number;
  recalibrated_severity: number | null;
  status: Status;
  latitude: number;
  longitude: number;
  location_name: string | null;
  neighborhood: string | null;
  is_anonymous: boolean;
  is_precise_location: boolean;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};
export type Update = {
  id: string; status: Status; comment: string | null; created_at: string; recalibrated_severity: number | null;
};
export type Stats = {
  total: number; active: number; closed: number; closed_this_week: number; this_month: number;
  critical_areas: number; average_close_hours: number | null;
  by_month: { month: string; reported: number; closed: number }[];
  by_category: { name: string; color: string; count: number }[];
  by_status: { status: Status; count: number }[];
  by_severity: { severity: number; count: number }[];
  by_neighborhood: { neighborhood: string; count: number }[];
};

export async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method, credentials: "same-origin",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new Error("No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.");
  }
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error ?? "El servicio no está disponible en este momento.");
  return data as T;
}

export const sessionKey = ["session"];
export function useSession() {
  return useQuery({
    queryKey: sessionKey, queryFn: () => api<{ user: User | null }>("/auth/session"), staleTime: 30000,
  });
}

export function useCategories() {
  return useQuery({ queryKey: ["categories"], queryFn: () => api<Category[]>("/categories"), staleTime: 60000 });
}

export function useIncidents(scope: "public" | "mine" = "public", enabled = true) {
  return useQuery({
    queryKey: ["incidents", scope], queryFn: () => api<Incident[]>(`/incidents?scope=${scope}`),
    refetchInterval: 10000, enabled,
  });
}

export function useStats() {
  return useQuery({ queryKey: ["stats"], queryFn: () => api<Stats>("/stats"), refetchInterval: 10000 });
}

export function incidentSeverity(incident: Incident) {
  return incident.recalibrated_severity ?? incident.severity;
}
