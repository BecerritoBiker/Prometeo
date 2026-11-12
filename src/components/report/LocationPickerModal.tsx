import { useState } from "react";
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAP_CENTER, TILE_ATTRIBUTION, TILE_URL } from "@/lib/map";
import "leaflet/dist/leaflet.css";

export type Coordinates = { latitude: number; longitude: number };

function MapSelection({ point, onSelect }: { point: LatLngTuple | null; onSelect: (point: LatLngTuple) => void }) {
  const map = useMap();
  useMapEvents({ click: ({ latlng }) => onSelect([latlng.lat, latlng.lng]) });
  return (
    <>
      {point && <CircleMarker center={point} radius={9} pathOptions={{ color: "#164e91" }} />}
      <Button type="button" size="sm" variant="secondary" className="absolute bottom-5 left-2 z-[401]"
        onClick={(event) => {
          event.stopPropagation();
          const center = map.getCenter();
          onSelect([center.lat, center.lng]);
        }}>Usar centro del mapa</Button>
    </>
  );
}

type Props = { coordinates: Coordinates | null; onClose: () => void; onConfirm: (value: Coordinates) => void };

export function LocationPickerModal({ coordinates, onClose, onConfirm }: Props) {
  const [lat, setLat] = useState(coordinates?.latitude.toString() ?? "");
  const [lng, setLng] = useState(coordinates?.longitude.toString() ?? "");
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(false);
  const latitude = Number(lat);
  const longitude = Number(lng);
  const valid = Boolean(lat.trim() && lng.trim() && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180);
  const point: LatLngTuple | null = valid ? [latitude, longitude] : null;

  function select([newLat, newLng]: LatLngTuple) {
    setLat(newLat.toFixed(6));
    setLng(newLng.toFixed(6));
    setError("");
  }

  function locate() {
    if (!navigator.geolocation) return setError("Puedes elegir el punto en el mapa o escribir las coordenadas.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        select([position.coords.latitude, position.coords.longitude]);
        setLocating(false);
      },
      () => {
        setError("No se pudo obtener la ubicación. Marca el punto en el mapa o escribe las coordenadas.");
        setLocating(false);
      },
      { timeout: 8000, maximumAge: 30000 },
    );
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[95dvh] w-[calc(100%-1.5rem)] max-w-xl overflow-auto rounded-xl">
        <DialogHeader>
          <DialogTitle>Ubicación del incidente</DialogTitle>
          <DialogDescription>Marca un punto, usa tu ubicación actual o escribe las coordenadas.</DialogDescription>
        </DialogHeader>
        <div className="relative isolate h-48 overflow-hidden rounded-lg border sm:h-64">
          <MapContainer className="h-full" center={point ?? MAP_CENTER} zoom={13} zoomAnimation={false} scrollWheelZoom={false}>
            <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
            <MapSelection point={point} onSelect={select} />
          </MapContainer>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="latitude">Latitud</Label>
            <Input id="latitude" type="number" step="any" min={-90} max={90} value={lat} onChange={(event) => setLat(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="longitude">Longitud</Label>
            <Input id="longitude" type="number" step="any" min={-180} max={180} value={lng} onChange={(event) => setLng(event.target.value)} />
          </div>
        </div>
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <div className="flex flex-wrap justify-between gap-2">
          <Button type="button" variant="outline" onClick={locate} disabled={locating}>
            {locating ? "Buscando ubicación…" : "Usar mi ubicación"}
          </Button>
          <Button type="button" disabled={!valid} onClick={() => onConfirm({ latitude, longitude })}>Confirmar ubicación</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
