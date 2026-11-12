import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, Moon, Sun, X } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { api, sessionKey, useSession } from "@/lib/api";

const links = [
  ["/", "Inicio"], ["/mapa", "Mapa"], ["/estadisticas", "Estadísticas"], ["/reportar", "Reportar"],
];

export function Navbar() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme") === "dark");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const navigate = useNavigate();
  const query = useQueryClient();
  const { data } = useSession();
  const user = data?.user;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  async function handleLogout() {
    setLogoutError("");
    try {
      await api("/auth/logout", "POST");
      query.setQueryData(sessionKey, { user: null });
      query.removeQueries({ queryKey: ["incidents", "mine"] });
      navigate("/");
    } catch (error) {
      setLogoutError(error.message);
    }
  }

  const navigation = (
    <>
      {links.map(([to, label]) => (
        <NavLink key={to} to={to} end onClick={() => setIsMenuOpen(false)}
          className={({ isActive }) => `block py-2 text-sm font-medium hover:text-primary ${isActive ? "text-primary" : "text-foreground"}`}>
          {label}
        </NavLink>
      ))}
      {user ? (
        <>
          <NavLink to="/gestion" onClick={() => setIsMenuOpen(false)} className="block py-2 text-sm font-medium text-primary">
            {user.role === "user" ? "Mis reportes" : "Gestión"}
          </NavLink>
          <span className="max-w-32 truncate text-sm font-semibold" title={user.full_name}>{user.full_name}</span>
          <Button variant="outline" size="sm" onClick={handleLogout}>Salir</Button>
        </>
      ) : (
        <Button size="sm" asChild><Link to="/auth" onClick={() => setIsMenuOpen(false)}>Ingresar</Link></Button>
      )}
    </>
  );

  return (
    <nav aria-label="Navegación principal" className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4">
        <div className="flex min-h-16 items-center justify-between gap-4">
          <Link to="/" className="flex shrink-0 items-center gap-3">
            <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-lg bg-[#174478] font-serif text-xl font-bold text-white">P</span>
            <span className="flex flex-col">
              <span className="font-serif text-xl font-bold text-primary">PROMETEO</span>
              <span className="text-xs text-muted-foreground">by SERAFY</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="mr-2 hidden items-center gap-4 lg:flex">{navigation}</div>
            <Button variant="ghost" size="icon" aria-label={isDark ? "Activar tema claro" : "Activar tema oscuro"} onClick={() => setIsDark(!isDark)}>
              {isDark ? <Sun size={19} /> : <Moon size={19} />}
            </Button>
            <Button variant="ghost" size="icon" className="lg:hidden"
              aria-expanded={isMenuOpen} aria-controls="menu-movil"
              aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
              onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
          </div>
        </div>
        {logoutError && <p role="alert" className="pb-3 text-sm text-destructive">{logoutError}</p>}
        <div id="menu-movil" hidden={!isMenuOpen} className="space-y-2 pb-4 lg:hidden">{navigation}</div>
      </div>
    </nav>
  );
}
