import { Shield, MapPin, BarChart3, Bell, Users, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Features = () => {
  const features = [
    {
      icon: Shield,
      title: "Reportes Anónimos",
      description: "Protege tu identidad mientras contribuyes a la seguridad de tu comunidad.",
      color: "text-primary",
    },
    {
      icon: MapPin,
      title: "Geolocalización Precisa",
      description: "Ubicación exacta de incidentes con mapas interactivos con actualización automática.",
      color: "text-celeste",
    },
    {
      icon: BarChart3,
      title: "Estadísticas Avanzadas",
      description: "Análisis detallado de tendencias y patrones de incidentes por zona.",
      color: "text-accent",
    },
    {
      icon: Bell,
      title: "Notificaciones Inteligentes",
      description: "Alertas personalizadas sobre incidentes en tu zona de interés.",
      color: "text-destructive",
    },
    {
      icon: Users,
      title: "Gestión Colaborativa",
      description: "Coordinación eficiente entre ciudadanos, moderadores y autoridades.",
      color: "text-primary",
    },
    {
      icon: Eye,
      title: "Seguimiento en Tiempo Real",
      description: "Monitorea el estado de tus reportes desde inicio hasta resolución.",
      color: "text-celeste",
    },
  ];

  return (
    <section className="container mx-auto px-4 py-20">
      <div className="text-center mb-16 animate-fade-in">
        <h2 className="text-3xl md:text-5xl font-bold mb-4">
          Características <span className="text-gradient">Poderosas</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          PROMETEO integra tecnología de punta para ofrecer una experiencia 
          completa en la gestión de incidentes comunitarios.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Card
              key={index}
              className="smooth-transition hover:scale-105 hover:shadow-lg animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <div className={`inline-flex p-3 rounded-lg bg-primary/10 mb-4 w-fit`}>
                  <Icon className={`h-8 w-8 ${feature.color}`} />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
};
