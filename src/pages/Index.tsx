import { Hero } from "@/components/landing/Hero";
import { KPICards } from "@/components/landing/KPICards";
import { Features } from "@/components/landing/Features";
import { CTASection } from "@/components/landing/CTASection";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="contenido">
        <Hero />
        <KPICards />
        <Features />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
