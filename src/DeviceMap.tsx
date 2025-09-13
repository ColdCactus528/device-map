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

function makeCircleIcon(color: string, size = 28, border = "#0f172a"): DivIcon {
  const html = `
    <div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:2px solid ${border};
      box-shadow:0 2px 8px rgba(0,0,0,.25);
    "></div>`;
  return L.divIcon({
    className: "device-icon",
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const ICONS: Record<IDevice["model"], DivIcon> = {
  basic: makeCircleIcon("#60a5fa"),
  advanced: makeCircleIcon("#34d399"),
  special: makeCircleIcon("#f472b6"),
};

const CHILD_ICON = makeCircleIcon("#94a3b8", 14, "#334155");

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
    if (markerRef.current) markerRef.current.setIcon(ICONS[device.model]);
  }, [device.model]);

  return (
    <Marker
      position={[device.lat, device.lon]}
      icon={ICONS[device.model]}
      draggable={isDraggable}
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
    <div
      style={{
        height: "100vh",
        width: "100%",
        background: "#fff"
      }}
    >
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
