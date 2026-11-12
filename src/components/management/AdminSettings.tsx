import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, useCategories, type Role } from "@/lib/api";

export function AdminSettings() {
  const categories = useCategories();
  const query = useQueryClient();
  const [categoryId, setCategoryId] = useState("");
  const [category, setCategory] = useState({ name: "", description: "", color: "#174478" });
  const [assignment, setAssignment] = useState<{ email: string; role: Role }>({ email: "", role: "moderator" });
  const [busy, setBusy] = useState(false);

  async function apply(path: string, method: string, data?: unknown) {
    setBusy(true);
    try {
      await api(path, method, data);
      if (path.startsWith("/admin/categories")) void query.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Cambios guardados");
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  function pick(id: string) {
    const selected = categories.data?.find((item) => item.id === id);
    setCategoryId(id);
    setCategory(selected ? { name: selected.name, description: selected.description, color: selected.color }
      : { name: "", description: "", color: "#174478" });
  }

  return (
    <details className="rounded-lg border bg-card p-5">
      <summary className="cursor-pointer font-semibold">Administrar roles y categorías</summary>
      <div className="mt-5 grid gap-7 md:grid-cols-2">
        <form className="space-y-3" onSubmit={(event) => {
          event.preventDefault();
          void apply("/admin/roles", "PATCH", assignment);
        }}>
          <h2 className="text-lg font-semibold">Asignar rol</h2>
          <div>
            <Label htmlFor="role-email">Correo de la cuenta</Label>
            <Input id="role-email" className="mt-1" type="email" required value={assignment.email}
              onChange={(event) => setAssignment({ ...assignment, email: event.target.value })} />
          </div>
          <div>
            <Label htmlFor="role">Rol</Label>
            <select id="role" className="form-select mt-1" value={assignment.role}
              onChange={(event) => setAssignment({ ...assignment, role: event.target.value as Role })}>
              <option value="user">Ciudadano</option>
              <option value="moderator">Moderador</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <Button disabled={busy}>Asignar rol</Button>
        </form>
        <form className="space-y-3" onSubmit={async (event) => {
          event.preventDefault();
          if (await apply(categoryId ? `/admin/categories/${categoryId}` : "/admin/categories", categoryId ? "PUT" : "POST", category)) pick("");
        }}>
          <h2 className="text-lg font-semibold">Categorías</h2>
          <div>
            <Label htmlFor="category-id">Categoría para gestionar</Label>
            <select id="category-id" className="form-select mt-1" value={categoryId} onChange={(event) => pick(event.target.value)}>
              <option value="">Crear categoría</option>
              {categories.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="category-name">Nombre</Label>
            <Input id="category-name" className="mt-1" required minLength={2} maxLength={100} value={category.name}
              onChange={(event) => setCategory({ ...category, name: event.target.value })} />
          </div>
          <div>
            <Label htmlFor="category-description">Descripción de la categoría</Label>
            <Input id="category-description" className="mt-1" maxLength={200} value={category.description}
              onChange={(event) => setCategory({ ...category, description: event.target.value })} />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="category-color">Color</Label>
            <Input id="category-color" className="w-14 p-1" type="color" value={category.color}
              onChange={(event) => setCategory({ ...category, color: event.target.value })} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy}>Guardar categoría</Button>
            {categoryId && <Button type="button" variant="outline" disabled={busy} onClick={async () => {
              if (window.confirm("¿Eliminar la categoría seleccionada?") && await apply(`/admin/categories/${categoryId}`, "DELETE")) pick("");
            }}>Eliminar categoría</Button>}
          </div>
        </form>
      </div>
    </details>
  );
}
