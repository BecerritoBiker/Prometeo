import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, incidentSeverity, SEVERITY_LABELS, STATUS_LABELS, STATUSES, type Incident, type Role } from "@/lib/api";

export function ManageIncident({ incident, role, onDelete }: { incident: Incident; role: Role; onDelete: () => void }) {
  const [title, setTitle] = useState(incident.title);
  const [description, setDescription] = useState(incident.description);
  const [advance, setAdvance] = useState(false);
  const [severity, setSeverity] = useState("");
  const [comment, setComment] = useState("");
  const [result, setResult] = useState({ text: "", error: false });
  const [busy, setBusy] = useState(false);
  const query = useQueryClient();
  const next = STATUSES[STATUSES.indexOf(incident.status) + 1];
  const path = `/incidents/${incident.id}`;

  async function save(method: string, data?: unknown) {
    setBusy(true);
    setResult({ text: "", error: false });
    try {
      await api(method === "POST" ? `${path}/updates` : path, method, data);
      setAdvance(false);
      setSeverity("");
      setComment("");
      void query.invalidateQueries({ queryKey: ["incidents"] });
      void query.invalidateQueries({ queryKey: ["stats"] });
      void query.invalidateQueries({ queryKey: ["incident", incident.id] });
      if (method === "DELETE") onDelete();
      else setResult({ text: method === "POST" ? "Seguimiento guardado" : "Reporte actualizado", error: false });
    } catch (error) {
      setResult({ text: error.message, error: true });
      void query.invalidateQueries({ queryKey: ["incidents"] });
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="rounded-lg border bg-card p-5">
      <h2 className="text-xl font-semibold">{incident.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">Estado actual · {STATUS_LABELS[incident.status]} · Severidad {incidentSeverity(incident)}</p>
      <Link className="mt-2 inline-block text-sm font-medium text-primary underline" to={`/mapa?reporte=${incident.id}`}>Ver en el mapa</Link>
      {role === "user" ? (
        <form className="mt-5 space-y-3" onSubmit={(event) => {
          event.preventDefault();
          void save("PATCH", { title, description });
        }}>
          <div>
            <Label htmlFor="edit-title">Título del incidente</Label>
            <Input id="edit-title" className="mt-1" required minLength={5} maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div>
            <Label htmlFor="edit-description">Descripción</Label>
            <Textarea id="edit-description" className="mt-1" required minLength={10} maxLength={1000} value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>
          <Button disabled={busy}>Guardar cambios</Button>
        </form>
      ) : (
        <form className="mt-5 space-y-3" onSubmit={(event) => {
          event.preventDefault();
          void save("POST", {
            status: advance ? next : undefined,
            comment,
            recalibrated_severity: severity ? Number(severity) : undefined,
          });
        }}>
          <p className="break-words text-sm">{incident.description}</p>
          {next && (
            <label className="flex items-center gap-2 text-sm font-medium">
              <input className="h-4 w-4 accent-primary" type="checkbox" checked={advance} onChange={(event) => setAdvance(event.target.checked)} />
              Avanzar a {STATUS_LABELS[next]}
            </label>
          )}
          <div>
            <Label htmlFor="updated-severity">Ajustar severidad</Label>
            <select id="updated-severity" className="form-select mt-1" value={severity} onChange={(event) => setSeverity(event.target.value)}>
              <option value="">Conservar severidad</option>
              {SEVERITY_LABELS.slice(1).map((name, index) => <option key={name} value={index + 1}>{index + 1} · {name}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="public-comment">Comentario público</Label>
            <Textarea id="public-comment" className="mt-1" maxLength={500} value={comment} onChange={(event) => setComment(event.target.value)} />
          </div>
          <Button disabled={busy || (!advance && !severity && !comment.trim())}>Guardar seguimiento</Button>
        </form>
      )}
      {role === "admin" && <Button type="button" variant="destructive" className="mt-4" disabled={busy} onClick={() => {
        if (window.confirm("¿Eliminar definitivamente este reporte y su historial?")) void save("DELETE");
      }}>Eliminar reporte</Button>}
      {result.text && <p className={`mt-3 text-sm ${result.error ? "text-destructive" : "text-primary"}`}
        role={result.error ? "alert" : "status"}>{result.text}</p>}
    </article>
  );
}
