import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export default function Privacidad() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="contenido" className="mx-auto w-full max-w-3xl flex-1 space-y-5 px-4 py-12">
        <h1 className="text-3xl font-bold">Privacidad de los reportes</h1>
        <p>El mapa muestra el título, la descripción, la categoría, el estado y la ubicación de cada reporte. Evita incluir nombres, teléfonos, placas u otros datos personales en el texto.</p>
        <p>El correo y el nombre de tu cuenta se mantienen fuera del mapa público. Si eliges un reporte anónimo, el sistema guarda el reporte sin asociarlo a tu cuenta.</p>
        <p>La ubicación aproximada reduce la precisión de las coordenadas y omite la referencia exacta. La ubicación precisa puede mostrar el punto y la referencia que indiques.</p>
        <p>La opción de recibir actualizaciones registra tu preferencia. Puedes consultar el estado y los seguimientos desde la aplicación.</p>
      </main>
      <Footer />
    </div>
  );
}
