import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CheckCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LocationPickerModal, type Coordinates } from "./LocationPickerModal";
import { api, SEVERITY_LABELS, useCategories, useSession } from "@/lib/api";

const defaults = {
  title: "", description: "", category_id: "", subcategory: "", severity: 3,
  location_name: "", neighborhood: "", is_precise_location: false, consent_updates: false,
};

export function ReportForm() {
  const [form, setForm] = useState(defaults);
  const [anonymous, setAnonymous] = useState<boolean>();
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [picker, setPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<{ id: string; title: string } | null>(null);
  const session = useSession();
  const categories = useCategories();
  const user = session.data?.user;
  const isAnonymous = anonymous ?? !user;
  const query = useQueryClient();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved(null);
    if (!coordinates) return setError("Selecciona la ubicación del incidente.");
    if (!isAnonymous && !user) return setError("Inicia sesión para asociar el reporte a tu cuenta.");
    setSubmitting(true);
    try {
      const result = await api<{ id: string }>("/incidents", "POST", {
        ...form, ...coordinates, is_anonymous: isAnonymous,
        consent_updates: !isAnonymous && form.consent_updates,
        location_name: form.is_precise_location ? form.location_name : null,
      });
      setSaved({ id: result.id, title: form.title });
      setForm(defaults);
      setCoordinates(null);
      void query.invalidateQueries({ queryKey: ["incidents"] });
      void query.invalidateQueries({ queryKey: ["stats"] });
    } catch (problem) {
      setError(problem.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="glass-card">
      <CardContent className="p-5 md:p-8">
        {saved && (
          <div role="status" className="mb-6 rounded-lg border border-primary/30 bg-primary/10 p-4">
            <p className="flex items-center gap-2 font-semibold"><CheckCircle size={18} /> Reporte registrado</p>
            <p className="mt-1 text-sm">{saved.title} · Estado inicial Nuevo</p>
            <Link className="mt-2 inline-block text-sm font-semibold text-primary underline" to={`/mapa?reporte=${saved.id}`}>Ver reporte en el mapa</Link>
          </div>
        )}
        <form className="space-y-5" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="report-title">Título del incidente</Label>
            <Input id="report-title" required minLength={5} maxLength={120}
              value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="report-description">Descripción</Label>
            <Textarea id="report-description" required minLength={10} maxLength={1000} rows={4}
              aria-describedby="description-help" value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })} />
            <p className="text-xs text-muted-foreground" id="description-help">Escribe entre 10 y 1.000 caracteres. Evita incluir datos personales.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="category">Categoría</Label>
              <select id="category" className="form-select" required value={form.category_id}
                onChange={(event) => setForm({ ...form, category_id: event.target.value })}>
                <option value="">Selecciona una categoría</option>
                {categories.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              {categories.isError && <p role="alert" className="text-sm text-destructive">No pudimos cargar las categorías.</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subcategory">Subcategoría (opcional)</Label>
              <Input id="subcategory" maxLength={100} value={form.subcategory} placeholder="Ej. semáforo dañado"
                onChange={(event) => setForm({ ...form, subcategory: event.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="severity">Severidad</Label>
              <select id="severity" className="form-select" value={form.severity}
                onChange={(event) => setForm({ ...form, severity: Number(event.target.value) })}>
                {SEVERITY_LABELS.slice(1).map((name, index) => <option key={name} value={index + 1}>{index + 1} · {name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="neighborhood">Barrio (opcional)</Label>
              <Input id="neighborhood" maxLength={100} value={form.neighborhood}
                onChange={(event) => setForm({ ...form, neighborhood: event.target.value })} />
            </div>
          </div>
          <fieldset className="space-y-3 rounded-lg border p-4">
            <legend className="px-1 text-sm font-semibold">Ubicación</legend>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm" role="status">
                <MapPin size={17} className="text-primary" />
                {coordinates ? "Ubicación seleccionada" : "Selecciona el punto del incidente"}
              </p>
              <Button type="button" variant="outline" onClick={() => setPicker(true)}>
                {coordinates ? "Cambiar ubicación" : "Seleccionar ubicación"}
              </Button>
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" checked={form.is_precise_location}
                onChange={(event) => setForm({ ...form, is_precise_location: event.target.checked })} />
              Publicar la ubicación precisa
            </label>
            {form.is_precise_location && (
              <div className="space-y-1.5">
                <Label htmlFor="reference">Referencia de ubicación (opcional)</Label>
                <Input id="reference" maxLength={150} value={form.location_name}
                  onChange={(event) => setForm({ ...form, location_name: event.target.value })} />
              </div>
            )}
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-semibold">Privacidad</legend>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" checked={isAnonymous}
                onChange={(event) => setAnonymous(event.target.checked)} />
              Enviar como reporte anónimo
            </label>
            {!isAnonymous && !user && (
              <Link className="text-sm font-medium text-primary underline" to="/auth?next=reportar">Inicia sesión para guardar el reporte en tu cuenta</Link>
            )}
            {!isAnonymous && user && (
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" checked={form.consent_updates}
                  onChange={(event) => setForm({ ...form, consent_updates: event.target.checked })} />
                Doy mi consentimiento para recibir actualizaciones de este reporte.
              </label>
            )}
          </fieldset>
          {error && <p role="alert" className="rounded-lg border border-destructive p-3 text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={submitting || !categories.data}>
            {submitting ? "Enviando…" : "Enviar reporte"}
          </Button>
        </form>
        {picker && <LocationPickerModal coordinates={coordinates} onClose={() => setPicker(false)}
          onConfirm={(value) => { setCoordinates(value); setPicker(false); }} />}
      </CardContent>
    </Card>
  );
}
