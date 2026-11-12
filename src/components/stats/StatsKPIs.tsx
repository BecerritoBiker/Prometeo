import { Card, CardContent } from "@/components/ui/card";
import type { Stats } from "@/lib/api";

export function StatsKPIs({ stats }: { stats: Stats }) {
  const closure = stats.total ? Math.round(stats.closed * 100 / stats.total) : 0;
  const kpis = [
    { label: "Total de incidentes", value: stats.total },
    { label: "Tasa de cierre", value: `${closure}%` },
    { label: "Cerrados esta semana", value: stats.closed_this_week },
    { label: "Tiempo promedio de cierre", value: stats.average_close_hours === null ? "—" : `${stats.average_close_hours.toFixed(1)} h` },
  ];
  return (
    <section aria-label="Indicadores" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {kpis.map((item) => (
        <Card key={item.label} className="glass-card">
          <CardContent className="p-4">
            <p className="font-serif text-3xl font-bold">{item.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.label}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
