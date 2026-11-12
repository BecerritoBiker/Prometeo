import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ReportForm } from "@/components/report/ReportForm";

const Reportar = () => {

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main id="contenido" className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Reportar <span className="text-gradient">Incidente</span>
            </h1>
            <p className="text-muted-foreground">
              Ayuda a mejorar la seguridad en Yopal, Casanare
            </p>
          </div>

          <ReportForm />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Reportar;
