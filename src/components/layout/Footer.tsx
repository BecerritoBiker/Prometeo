import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm">
        <p className="text-muted-foreground"><strong className="text-foreground">PROMETEO · SERAFY</strong> · Yopal, Casanare</p>
        <nav aria-label="Enlaces del pie de página" className="flex flex-wrap gap-4">
          <Link to="/mapa" className="text-primary hover:underline">Mapa</Link>
          <Link to="/reportar" className="text-primary hover:underline">Reportar</Link>
          <Link to="/privacidad" className="text-primary hover:underline">Privacidad</Link>
        </nav>
      </div>
    </footer>
  );
}
