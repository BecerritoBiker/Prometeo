import { Button } from "@/components/ui/button";
import { ArrowRight, AlertTriangle, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "var(--gradient-hero)",
          opacity: 0.1,
        }}
      />
      
      <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
        <div className={`max-w-4xl mx-auto text-center space-y-8${import.meta.env.MODE === "baseline" ? " animate-fade-in" : ""}`}>
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <AlertTriangle className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Sistema Inteligente de Reportes
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            <span className="text-gradient">PROMETEO</span>
            <br />
            <span className="text-foreground">Tu Comunidad Más Segura</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Reporta, visualiza y gestiona incidentes en Yopal. 
            PROMETEO facilita la comunicación entre ciudadanos y autoridades 
            para crear entornos más seguros y protegidos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button size="lg" className="glow-effect smooth-transition group" asChild>
              <Link to="/reportar">
                Reportar Incidente
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 smooth-transition" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="smooth-transition" asChild>
              <Link to="/mapa">
                <MapPin className="mr-2 h-5 w-5" />
                Ver Mapa
              </Link>
            </Button>
          </div>

          <div className="pt-8 flex flex-wrap justify-center gap-8 text-sm">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="text-muted-foreground">Reportes actualizados</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="text-muted-foreground">Opción de reporte anónimo</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="text-muted-foreground">Geolocalización precisa</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
