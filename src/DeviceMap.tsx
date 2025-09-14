import React, { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import type {
  Marker as LeafletMarker,
  DivIcon,
  LatLngExpression,
  LeafletMouseEvent,
  DragEndEvent,
} from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import devicesData from "./devices.json";

export interface IDevice {
  id: string;
  name: string;
  lat: number;
  lon: number;
  model: "basic" | "advanced" | "special";
  status: "on" | "off";
}

function makeModelIcon(
  model: IDevice["model"],
  color: string,
  size = 28,
  isDraggable = false
): DivIcon {
  const s = size;
  const pad = 2;
  const half = s / 2;

  const shape =
    model === "basic"
      ? `<circle cx="${half}" cy="${half}" r="${half - pad}" fill="${color}" stroke="#0f172a" stroke-width="2" />`
      : model === "advanced"
      ? `<rect x="${pad}" y="${pad}" width="${s - pad * 2}" height="${s - pad * 2}" rx="6" ry="6" fill="${color}" stroke="#0f172a" stroke-width="2" />`
      : `<polygon points="${half},${pad} ${s - pad},${half} ${half},${s - pad} ${pad},${half}" fill="${color}" stroke="#0f172a" stroke-width="2" />`;

  const svg = `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">${shape}</svg>`;

  const ring = isDraggable ? `<span class="drag-ring"></span>` : "";

  const html = `
    <div class="device-icon-wrap${isDraggable ? " is-draggable" : ""}" style="--ring:#f59e0b;width:${s}px;height:${s}px">
      ${svg}
      ${ring}
    </div>
  `;

  return L.divIcon({
    className: "device-icon",
    html,
    iconSize: [s, s],
    iconAnchor: [s / 2, s / 2],
  });
}

function iconFor(model: IDevice["model"], isDraggable: boolean): DivIcon {
  const palette: Record<IDevice["model"], string> = {
    basic: "#60a5fa",
    advanced: "#34d399",
    special: "#f472b6",
  };
  return makeModelIcon(model, palette[model], 28, isDraggable);
}


const CHILD_ICON: DivIcon = (() => {
  const size = 14;
  const pad = 2;
  const half = size / 2;
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${half}" cy="${half}" r="${half - pad}" fill="#94a3b8" stroke="#334155" stroke-width="2" />
  </svg>`;
  return L.divIcon({
    className: "device-icon",
    html: `<div style="width:${size}px;height:${size}px">${svg}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
})();

const StatusChip: React.FC<{ status: IDevice["status"] }> = ({ status }) => (
  <span
    style={{
      padding: "2px 8px",
      borderRadius: 999,
      background: status === "on" ? "#dcfce7" : "#fee2e2",
      color: status === "on" ? "#166534" : "#991b1b",
      fontSize: 12,
      fontWeight: 600,
      border: `1px solid ${status === "on" ? "#86efac" : "#fecaca"}`,
    }}
  >
    {status.toUpperCase()}
  </span>
);

const ChildMarkers: React.FC<{ device: IDevice }> = ({ device }) => {
  const positions: LatLngExpression[] = useMemo(() => {
    if (device.model === "basic") return [];
    const dLat = 0.0007;
    const dLon = 0.001;
    return [
      [device.lat + dLat, device.lon + dLon],
      [device.lat - dLat, device.lon - dLon],
      [device.lat + dLat, device.lon - dLon],
    ];
  }, [device]);

  return (
    <>
      {positions.map((p, i) => (
        <Marker key={`${device.id}-child-${i}`} position={p} icon={CHILD_ICON} />
      ))}
    </>
  );
};

const DeviceMarker: React.FC<{ device: IDevice; draggableId?: string }> = ({
  device,
  draggableId,
}) => {
  const map = useMap();
  const isDraggable = device.id === draggableId;
  const markerRef = useRef<LeafletMarker | null>(null);

  const onDragEnd = (e: DragEndEvent) => {
    const m = e.target as LeafletMarker;
    const pos = m.getLatLng();
    console.log(
      `[dragend] ${device.name} → { lat: ${pos.lat.toFixed(
        6
      )}, lon: ${pos.lng.toFixed(6)} }`
    );
  };

  const onDblClick = (e: LeafletMouseEvent) => {
    map.setView(e.latlng, Math.max(map.getZoom(), 15), { animate: true });
  };

  useEffect(() => {
    if (markerRef.current) markerRef.current.setIcon(iconFor(device.model, isDraggable));
  }, [device.model, isDraggable]);

  return (
    <Marker
      position={[device.lat, device.lon]}
      icon={iconFor(device.model, isDraggable)}
      draggable={isDraggable}
      title={isDraggable ? "Drag me" : device.name}
      ref={markerRef}
      eventHandlers={{ dragend: onDragEnd, dblclick: onDblClick }}
    >
      <Popup>
        <div style={{ minWidth: 200 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{device.name}</div>
          <div style={{ fontSize: 13, marginBottom: 6 }}>
            Model: <strong>{device.model}</strong>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            Status: <StatusChip status={device.status} />
          </div>
        </div>
      </Popup>
      <ChildMarkers device={device} />
    </Marker>
  );
};

const InvalidateOnMount: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 0);
  }, [map]);
  return null;
};

const DeviceMap: React.FC<{ devices?: IDevice[] }> = ({
  devices = devicesData as IDevice[],
}) => {
  const center: LatLngExpression = [
    devices[0]?.lat ?? 51.505,
    devices[0]?.lon ?? -0.09,
  ];
  const draggableId = devices[0]?.id;

  return (
    <div style={{ height: "100vh", width: "100%", background: "#fff" }}>
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        doubleClickZoom={false}
      >
        <InvalidateOnMount />
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {devices.map((d) => (
          <DeviceMarker key={d.id} device={d} draggableId={draggableId} />
        ))}
      </MapContainer>
    </div>
  );
};

export default DeviceMap;
