import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/layout/Navbar";
import { AdminSettings } from "@/components/management/AdminSettings";
import { ManageIncident } from "@/components/management/ManageIncident";
import { STATUS_LABELS, useIncidents, useSession, type User } from "@/lib/api";

const roleLabels = { user: "Ciudadano", moderator: "Moderador", admin: "Administrador" };

function Dashboard({ user }: { user: User }) {
  const [selected, setSelected] = useState("");
  const { data, isPending, isError } = useIncidents(user.role === "user" ? "mine" : "public");
  const current = data?.find((item) => item.id === selected);

  return (
    <div className="space-y-5">
      <header>
        <p className="mb-1 text-sm font-semibold text-primary">Rol · {roleLabels[user.role]}</p>
        <h1 className="text-3xl font-bold">{user.role === "user" ? "Mis reportes" : "Gestión de reportes"}</h1>
        <p className="mt-2 text-muted-foreground">
          {user.role === "user" ? "Consulta o edita los reportes que guardaste con tu cuenta." : "Revisa los reportes y registra sus seguimientos."}
        </p>
      </header>
      {user.role === "admin" && <AdminSettings />}
      {isPending && <p role="status">Cargando reportes…</p>}
      {isError && <p role="alert" className="text-destructive">No se pudieron cargar los reportes.</p>}
      {data?.length === 0 && <p className="rounded-lg border bg-card p-4">Aún no hay reportes aquí. <Link to="/reportar" className="text-primary underline">Crear un reporte</Link></p>}
      {data && data.length > 0 && (
        <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <ul className="max-h-[34rem] space-y-2 overflow-auto">
            {data.map((item) => (
              <li key={item.id}>
                <button type="button" aria-pressed={selected === item.id} onClick={() => setSelected(item.id)}
                  className={`w-full break-words rounded-lg border bg-card p-3 text-left hover:border-primary ${selected === item.id ? "border-primary" : ""}`}>
                  <span className="block font-semibold">{item.title}</span>
                  <span className="text-sm text-muted-foreground">{STATUS_LABELS[item.status]}</span>
                </button>
              </li>
            ))}
          </ul>
          {current ? <ManageIncident key={current.id} incident={current} role={user.role} onDelete={() => setSelected("")} />
            : <p className="rounded-lg border bg-card p-5 text-muted-foreground">Selecciona un reporte para ver sus acciones.</p>}
        </div>
      )}
    </div>
  );
}

export default function Gestion() {
  const { data, isPending, isError } = useSession();
  if (data && !data.user) return <Navigate to="/auth" replace />;
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {import.meta.env.MODE !== "baseline" && data?.user?.role === "admin" && <Toaster />}
      <main id="contenido" className="container mx-auto flex-1 px-4 py-8">
        {isPending && <p role="status">Verificando sesión…</p>}
        {isError && <p role="alert" className="text-destructive">No se pudo verificar la sesión. Recarga la página para reintentar.</p>}
        {data?.user && <Dashboard key={data.user.id} user={data.user} />}
      </main>
      <Footer />
    </div>
  );
}
