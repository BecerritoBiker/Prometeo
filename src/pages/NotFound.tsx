import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main id="contenido" className="container mx-auto px-4 py-14">
        <h1 className="text-3xl font-bold">Página no encontrada</h1>
        <Link to="/" className="mt-5 inline-block text-primary underline">Volver al inicio</Link>
      </main>
    </div>
  );
}
