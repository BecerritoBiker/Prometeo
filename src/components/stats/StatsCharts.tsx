import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend,
} from "chart.js";
import { SEVERITY_LABELS, STATUS_LABELS, STATUSES, type Stats } from "@/lib/api";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

type Count = { label: string; value: number; color?: string };
function Distribution({ title, counts }: { title: string; counts: Count[] }) {
  const max = Math.max(1, ...counts.map((item) => item.value));
  return (
    <Card className="glass-card">
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        {counts.length ? (
          <ul className="space-y-3 text-sm">
            {counts.map((item) => (
              <li key={item.label}>
                <p className="flex justify-between gap-2"><span>{item.label}</span><strong>{item.value}</strong></p>
                <div aria-hidden="true" className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${100 * item.value / max}%`, backgroundColor: item.color }} />
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted-foreground">Sin registros.</p>}
      </CardContent>
    </Card>
  );
}

export function StatsCharts({ stats }: { stats: Stats }) {
  const labels = stats.by_month.map(({ month }) =>
    new Intl.DateTimeFormat("es-CO", { month: "short", year: "numeric", timeZone: "UTC" })
      .format(new Date(`${month}-01T00:00:00Z`)));
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="glass-card md:col-span-2">
        <CardHeader><CardTitle>Tendencia de los últimos seis meses</CardTitle></CardHeader>
        <CardContent>
          <div className="h-60">
            <Line aria-label="Reportes creados y cerrados por mes" role="img" data={{
              labels,
              datasets: [
                { label: "Creados", data: stats.by_month.map((month) => month.reported), borderColor: "#327ccb", tension: 0.2 },
                { label: "Cerrados", data: stats.by_month.map((month) => month.closed), borderColor: "#27846d", tension: 0.2 },
              ],
            }} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { ticks: { precision: 0 }, beginAtZero: true } } }} />
          </div>
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer text-primary">Consultar los datos de la gráfica</summary>
            <table className="mt-2 w-full text-left">
              <thead><tr><th scope="col">Mes</th><th scope="col">Creados</th><th scope="col">Cerrados</th></tr></thead>
              <tbody>
                {stats.by_month.map((month, index) => (
                  <tr key={month.month} className="border-t"><th scope="row" className="font-normal">{labels[index]}</th><td>{month.reported}</td><td>{month.closed}</td></tr>
                ))}
              </tbody>
            </table>
          </details>
        </CardContent>
      </Card>
      <Distribution title="Por categoría" counts={stats.by_category.map((item) => ({ label: item.name, value: item.count, color: item.color }))} />
      <div className="grid gap-4">
        <Distribution title="Por estado" counts={STATUSES.map((status) => ({
          label: STATUS_LABELS[status], value: stats.by_status.find((item) => item.status === status)?.count ?? 0,
        }))} />
        <Distribution title="Por severidad" counts={SEVERITY_LABELS.slice(1).map((label, index) => ({
          label, value: stats.by_severity.find((item) => item.severity === index + 1)?.count ?? 0,
        }))} />
      </div>
      <Distribution title="Por barrio" counts={stats.by_neighborhood.map((item) => ({ label: item.neighborhood, value: item.count }))} />
    </div>
  );
}
