import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="container mx-auto px-4 pb-16">
      <div className="rounded-3xl bg-gradient-to-br from-[#102f54] to-[#164e85] px-6 py-14 text-center text-white md:px-14">
        <h2 className="text-3xl font-bold md:text-4xl">¿Viste un problema en tu barrio?</h2>
        <p className="mx-auto mt-4 max-w-xl text-blue-100">Ubícalo en el mapa y comparte lo que pasó para que la comunidad pueda seguir el reporte.</p>
        <Button size="lg" className="mt-7 bg-white text-[#174478] hover:bg-blue-50" asChild>
          <Link to="/reportar">Reportar ahora <ArrowRight className="ml-2 h-5 w-5" /></Link>
        </Button>
      </div>
    </section>
  );
}
