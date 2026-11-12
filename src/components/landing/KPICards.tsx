import { AlertCircle, CheckCircle, MapPin, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useStats } from "@/lib/api";

export function KPICards() {
  const { data, isError } = useStats();
  const closure = data?.total ? Math.round(data.closed * 100 / data.total) : 0;
  const kpis = [
    { icon: AlertCircle, label: "Incidentes activos", value: data?.active },
    { icon: CheckCircle, label: "Casos cerrados", value: data && `${closure}%` },
    { icon: MapPin, label: "Barrios con reportes críticos", value: data?.critical_areas },
    { icon: TrendingUp, label: "Reportes del mes", value: data?.this_month },
  ];

  return (
    <section aria-label="Indicadores de Yopal" className="container relative z-20 mx-auto -mt-12 px-4">
      {isError && <p role="status" className="mb-3 rounded-lg bg-card p-3 text-muted-foreground">Los indicadores están temporalmente indisponibles.</p>}
      <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
        {kpis.map(({ icon: Icon, label, value }) => (
          <Card key={label} className="glass-card">
            <CardContent className="p-4 md:p-6">
              <Icon aria-hidden="true" className="mb-3 h-6 w-6 text-primary" />
              <p className="font-serif text-3xl font-bold">{value ?? "—"}</p>
              <p className="mt-1 text-sm text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
