import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Shield } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, sessionKey, useSession, type User } from "@/lib/api";

export default function Auth() {
  const [register, setRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "", full_name: "", confirm: "" });
  const { data } = useSession();
  const query = useQueryClient();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const destination = params.get("next") === "reportar" ? "/reportar" : "/gestion";

  useEffect(() => {
    if (data?.user) navigate(destination, { replace: true });
  }, [data?.user, destination, navigate]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (register && form.password !== form.confirm) {
      setError("Las contraseñas deben coincidir.");
      return;
    }
    setSubmitting(true);
    try {
      const credentials = { email: form.email, password: form.password };
      const session = register
        ? await api<{ user: User }>("/auth/register", "POST", { ...credentials, full_name: form.full_name })
        : await api<{ user: User }>("/auth/login", "POST", credentials);
      query.removeQueries({ queryKey: ["incidents", "mine"] });
      query.setQueryData(sessionKey, session);
    } catch (problem) {
      setError(problem.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="contenido" className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Shield className="mx-auto mb-3 h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold">{register ? "Crear cuenta" : "Iniciar sesión"}</h1>
            <p className="mt-2 text-muted-foreground">Consulta y gestiona tus reportes en Prometeo.</p>
          </div>
          <Card className="glass-card">
            <CardHeader><p className="text-sm text-muted-foreground">Completa todos los campos.</p></CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={submit}>
                {register && (
                  <div className="space-y-1.5">
                    <Label htmlFor="full_name">Nombre completo</Label>
                    <Input id="full_name" autoComplete="name" required minLength={2} maxLength={100}
                      value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input id="email" type="email" autoComplete="email" required maxLength={254}
                    value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} required
                      minLength={register ? 12 : 1} maxLength={128} className="pr-12"
                      autoComplete={register ? "new-password" : "current-password"}
                      aria-describedby={register ? "password-help" : undefined}
                      value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                    <Button type="button" size="icon" variant="ghost" className="absolute right-0 top-0"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </Button>
                  </div>
                  {register && <p id="password-help" className="text-xs text-muted-foreground">Usa al menos 12 caracteres.</p>}
                </div>
                {register && (
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmation">Confirmar contraseña</Label>
                    <Input id="confirmation" type={showPassword ? "text" : "password"} autoComplete="new-password"
                      required minLength={12} maxLength={128} value={form.confirm}
                      onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
                  </div>
                )}
                {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Procesando…" : register ? "Registrarme" : "Entrar"}
                </Button>
              </form>
              <Button type="button" variant="link" className="mt-3 h-auto px-0 py-2"
                onClick={() => { setRegister(!register); setError(""); }}>
                {register ? "Ya tengo cuenta" : "Crear una cuenta"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
