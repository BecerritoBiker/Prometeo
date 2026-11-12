import { Label } from "@/components/ui/label";
import { SEVERITY_LABELS, STATUS_LABELS, STATUSES, type Category } from "@/lib/api";

export type Filters = { category: string; severity: string; status: string };

export function MapFilters({ categories, value, onChange }: {
  categories: Category[]; value: Filters; onChange: (value: Filters) => void;
}) {
  return (
    <fieldset className="grid gap-3 sm:grid-cols-3">
      <legend className="mb-2 font-semibold">Filtrar reportes</legend>
      <div>
        <Label htmlFor="filter-category">Categoría</Label>
        <select id="filter-category" className="form-select mt-1" value={value.category}
          onChange={(event) => onChange({ ...value, category: event.target.value })}>
          <option value="">Todas</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </div>
      <div>
        <Label htmlFor="filter-severity">Severidad</Label>
        <select id="filter-severity" className="form-select mt-1" value={value.severity}
          onChange={(event) => onChange({ ...value, severity: event.target.value })}>
          <option value="">Todas</option>
          {SEVERITY_LABELS.slice(1).map((name, index) => <option key={name} value={index + 1}>{index + 1} · {name}</option>)}
        </select>
      </div>
      <div>
        <Label htmlFor="filter-status">Estado</Label>
        <select id="filter-status" className="form-select mt-1" value={value.status}
          onChange={(event) => onChange({ ...value, status: event.target.value })}>
          <option value="">Todos</option>
          {STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
        </select>
      </div>
    </fieldset>
  );
}
