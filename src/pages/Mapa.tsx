import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { OpenStreetMap } from "@/components/map/OpenStreetMap";
import { MapFilters, type Filters } from "@/components/map/MapFilters";
import { ExampleReports } from "@/components/map/ExampleReports";
import { api, incidentSeverity, SEVERITY_LABELS, STATUS_LABELS, useCategories, useIncidents, type Incident, type Update } from "@/lib/api";

function ReportDetails({ id }: { id: string }) {
  const detail = useQuery({
    queryKey: ["incident", id], queryFn: () => api<Incident & { updates: Update[] }>(`/incidents/${id}`),
    refetchInterval: 10000,
  });
  if (detail.isPending) return <p role="status">Consultando el reporte…</p>;
  if (detail.isError) return <p role="alert" className="text-destructive">{detail.error.message}</p>;
  const { updates } = detail.data;
  return (
    <div className="mt-3 border-t pt-3">
      <h3 className="font-semibold">Historial</h3>
      {!updates.length && <p className="text-muted-foreground">Aún no hay seguimientos.</p>}
      <ol className="mt-2 space-y-2">
        {updates.map((update) => (
          <li key={update.id}>
            <strong>{STATUS_LABELS[update.status]}</strong>{" · "}
            <time dateTime={update.created_at}>{new Date(update.created_at).toLocaleString("es-CO")}</time>
            {update.comment && <p>{update.comment}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function Mapa() {
  const [filters, setFilters] = useState<Filters>({ category: "", severity: "", status: "" });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();
  const { data: incidents, isPending, isError } = useIncidents();
  const { data: categories = [] } = useCategories();
  const filtered = (incidents ?? []).filter((item) =>
    (!filters.category || item.category_id === filters.category)
    && (!filters.severity || String(incidentSeverity(item)) === filters.severity)
    && (!filters.status || item.status === filters.status),
  );
  const currentId = params.get("reporte");
  const focused = filtered.find((item) => item.id === currentId);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="contenido" className="container mx-auto flex-1 space-y-5 px-4 py-8">
        <header>
          <h1 className="text-3xl font-bold md:text-4xl">Mapa de incidentes</h1>
          <p className="mt-2 text-muted-foreground">Consulta y filtra los reportes ciudadanos de Yopal.</p>
        </header>
        <MapFilters categories={categories} value={filters} onChange={setFilters} />
        <OpenStreetMap incidents={filtered} categories={categories} focused={focused} />
        <p className="text-xs text-muted-foreground">Niveles de severidad · 1 Leve · 2 Moderado · 3 Importante · 4 Crítico · 5 Emergencia</p>
        <section aria-labelledby="report-list" className="space-y-3">
          <h2 id="report-list" className="text-2xl font-bold">Reportes {filtered.length > 0 && `(${filtered.length})`}</h2>
          {isPending && <p role="status">Cargando reportes…</p>}
          {isError && <p role="alert" className="text-destructive">No se pudieron cargar los reportes.</p>}
          {incidents && !filtered.length && <p className="text-muted-foreground">No hay reportes con esos filtros.</p>}
          <ul className="grid gap-3 md:grid-cols-2">
            {filtered.map((incident) => (
              <li key={incident.id} className={`rounded-lg border bg-card p-4 ${currentId === incident.id ? "border-primary" : ""}`}>
                <button type="button" className="text-left font-semibold text-primary hover:underline"
                  onClick={() => {
                    setExpanded(expanded === incident.id ? null : incident.id);
                    setParams({ reporte: incident.id }, { replace: true });
                  }}
                  aria-expanded={expanded === incident.id}>
                  {incident.title}
                </button>
                <p className="mt-1 text-sm text-muted-foreground">
                  {STATUS_LABELS[incident.status]} · Nivel {incidentSeverity(incident)}
                  {incident.neighborhood && ` · ${incident.neighborhood}`}
                </p>
                {expanded === incident.id && (
                  <div className="mt-2 space-y-2 text-sm">
                    <p>{incident.description}</p>
                    <ReportDetails id={incident.id} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
        <details className="rounded-lg border bg-card p-4">
          <summary className="cursor-pointer font-medium">Ejemplos ficticios de reportes</summary>
          <div className="mt-4"><ExampleReports /></div>
        </details>
      </main>
      <Footer />
    </div>
  );
}
