import { useEffect, useState } from "react";
import { divIcon } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { MAP_CENTER, TILE_ATTRIBUTION, TILE_URL } from "@/lib/map";
import { incidentSeverity, SEVERITY_LABELS, STATUS_LABELS, type Category, type Incident } from "@/lib/api";
import "leaflet/dist/leaflet.css";

function FocusReport({ incident }: { incident?: Incident }) {
  const map = useMap();
  const latitude = incident?.latitude;
  const longitude = incident?.longitude;
  useEffect(() => {
    if (latitude !== undefined && longitude !== undefined) map.setView([latitude, longitude], 15, { animate: false });
  }, [map, latitude, longitude]);
  return null;
}

const icons = new Map<string, ReturnType<typeof divIcon>>();
function markerIcon(severity: number, color: string) {
  const safeColor = /^#[0-9a-f]{6}$/i.test(color) ? color : "#174478";
  const key = `${severity}${safeColor}`;
  if (!icons.has(key)) {
    icons.set(key, divIcon({
      className: "incident-map-marker",
      html: `<span style="--marker-color:${safeColor}" aria-hidden="true">${severity}</span>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    }));
  }
  return icons.get(key);
}

export function OpenStreetMap({ incidents, categories, focused }: {
  incidents: Incident[]; categories: Category[]; focused?: Incident;
}) {
  const [tileError, setTileError] = useState(false);
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  return (
    <div className="relative isolate overflow-hidden rounded-xl border bg-muted">
      <MapContainer className="h-[48dvh] min-h-[18rem] md:h-[55dvh]" center={MAP_CENTER} zoom={13} zoomAnimation={false} scrollWheelZoom={false}>
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} eventHandlers={{ tileerror: () => setTileError(true) }} />
        <FocusReport incident={focused} />
        {incidents.map((incident) => {
          const severity = incidentSeverity(incident);
          const category = categoryById.get(incident.category_id);
          return (
            <Marker key={incident.id} position={[incident.latitude, incident.longitude]}
              title={incident.title} alt={incident.title} icon={markerIcon(severity, category?.color ?? "#174478")}>
              <Popup>
                <div className="space-y-1">
                  <strong>{incident.title}</strong>
                  <p>{category?.name} · Nivel {severity} ({SEVERITY_LABELS[severity]}) · {STATUS_LABELS[incident.status]}</p>
                  <p>{incident.description}</p>
                  {incident.neighborhood && <p>Barrio {incident.neighborhood}</p>}
                  {incident.location_name && <p>{incident.location_name}</p>}
                  <time dateTime={incident.created_at}>{new Date(incident.created_at).toLocaleDateString("es-CO")}</time>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      {tileError && <p className="bg-card px-3 py-2 text-sm text-muted-foreground" role="status">Algunas imágenes del mapa no están disponibles. Puedes consultar la lista de reportes.</p>}
    </div>
  );
}
