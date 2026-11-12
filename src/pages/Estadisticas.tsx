import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { StatsCharts } from "@/components/stats/StatsCharts";
import { StatsKPIs } from "@/components/stats/StatsKPIs";
import { useStats } from "@/lib/api";

export default function Estadisticas() {
  const stats = useStats();
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="contenido" className="container mx-auto flex-1 space-y-5 px-4 py-8">
        <header>
          <h1 className="text-3xl font-bold md:text-4xl">Estadísticas de incidentes</h1>
          <p className="mt-2 text-muted-foreground">Datos de los reportes registrados en Prometeo.</p>
        </header>
        {stats.isPending && <p role="status">Cargando estadísticas…</p>}
        {stats.isError && <p role="alert" className="text-destructive">No se pudieron cargar las estadísticas.</p>}
        {stats.data && <><StatsKPIs stats={stats.data} /><StatsCharts stats={stats.data} /></>}
      </main>
      <Footer />
    </div>
  );
}
