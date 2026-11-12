import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Activity, Users, MapPin } from "lucide-react";

export const ExampleReports = () => {
  const examples = [
    {
      id: 1,
      title: "Semáforo averiado en Av. Principal",
      category: "Daños Viales",
      severity: "4",
      location: "Av. Principal con Calle 15",
      neighborhood: "Centro",
      status: "en_verificacion",
      icon: AlertTriangle,
      color: "text-red-500"
    },
    {
      id: 2,
      title: "Robo a persona en el Parque",
      category: "Hurtos y Seguridad",
      severity: "5",
      location: "Parque La Iguana",
      neighborhood: "La Libertad",
      status: "nuevo",
      icon: Activity,
      color: "text-red-600"
    },
    {
      id: 3,
      title: "Basura acumulada en esquina",
      category: "Ambiente",
      severity: "2",
      location: "Barrio El Recreo",
      neighborhood: "El Recreo",
      status: "cerrado",
      icon: Users,
      color: "text-yellow-500"
    }
  ];

  const severityColors = {
    "1": "bg-green-100 text-green-700 border-green-300",
    "2": "bg-yellow-100 text-yellow-700 border-yellow-300",
    "3": "bg-orange-100 text-orange-700 border-orange-300",
    "4": "bg-red-100 text-red-700 border-red-300",
    "5": "bg-red-200 text-red-900 border-red-400"
  };

  const severityLabels = {
    "1": "Leve",
    "2": "Moderado",
    "3": "Importante",
    "4": "Crítico",
    "5": "Emergencia"
  };

  const statusLabels = {
    nuevo: "Nuevo",
    en_verificacion: "En Verificación",
    remitido: "Remitido",
    cerrado: "Cerrado"
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <MapPin className="w-5 h-5 text-primary" />
        Reportes de Ejemplo
      </h3>
      {examples.map((report) => {
        const Icon = report.icon;
        return (
          <Card key={report.id} className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg bg-muted ${report.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-2">{report.title}</h4>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="outline">{report.category}</Badge>
                  <Badge className={severityColors[report.severity as keyof typeof severityColors]}>
                    Nivel {report.severity} - {severityLabels[report.severity as keyof typeof severityLabels]}
                  </Badge>
                  <Badge variant="secondary">{statusLabels[report.status as keyof typeof statusLabels]}</Badge>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {report.location} - {report.neighborhood}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
