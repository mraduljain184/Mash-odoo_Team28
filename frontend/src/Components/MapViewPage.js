import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { useEffect, useRef } from "react";

const REACT_APP_MAP_API_KEY = process.env.REACT_APP_MAP_API_KEY;

const containerStyle = {
  width: "100%",
  height: "520px",
  borderRadius: "12px",
};

// Default center (fallback)
const defaultCenter = {
  lat: 30.6811,
  lng: 76.6058,
};

// SVG data URLs for icons (no dependency on google.maps constructors)
const workshopPinUrl = (() => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns='http://www.w3.org/2000/svg' width='32' height='48' viewBox='0 0 32 48'>
  <path fill='#EA4335' d='M16 0C8.28 0 2 6.28 2 14c0 10.5 14 34 14 34s14-23.5 14-34C30 6.28 23.72 0 16 0z'/>
  <circle fill='#ffffff' cx='16' cy='14' r='6'/>
</svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
})();

const userDotUrl = (() => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 18 18'>
  <circle cx='9' cy='9' r='7' fill='#1e90ff' stroke='#ffffff' stroke-width='2'/>
</svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
})();

const MapSection = ({ workshops = [], userLocation }) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: REACT_APP_MAP_API_KEY,
  });

  const mapRef = useRef(null);

  // Build markers from workshops with location.coordinates [lng, lat]
  const points = (workshops || [])
    .map(w => Array.isArray(w?.location?.coordinates) ? { lat: w.location.coordinates[1], lng: w.location.coordinates[0], id: w._id, title: w.name } : null)
    .filter(Boolean);

  const onLoad = (map) => {
    mapRef.current = map;
    try {
      const hasUser = !!(userLocation && typeof userLocation.lat === 'number' && typeof userLocation.lng === 'number');
      if (hasUser) {
        map.setCenter(userLocation);
        map.setZoom(16);
        return;
      }
      if (points.length > 1) {
        const bounds = new window.google.maps.LatLngBounds();
        points.forEach(p => bounds.extend(p));
        map.fitBounds(bounds, 64);
      } else if (points.length === 1) {
        map.setCenter({ lat: points[0].lat, lng: points[0].lng });
        map.setZoom(14);
      } else {
        map.setCenter(defaultCenter);
        map.setZoom(4);
      }
    } catch {}
  };

  // When userLocation arrives after map mount, center and zoom in
  useEffect(() => {
    if (!mapRef.current) return;
    if (userLocation && typeof userLocation.lat === 'number' && typeof userLocation.lng === 'number') {
      mapRef.current.panTo(userLocation);
      mapRef.current.setZoom(16);
    }
  }, [userLocation]);

  const center = userLocation || (points[0] ? { lat: points[0].lat, lng: points[0].lng } : defaultCenter);
  const mapKey = userLocation ? `user-${userLocation.lat?.toFixed(4)}-${userLocation.lng?.toFixed(4)}` : (points.length ? 'points' : 'default');

  return (
    <div className="mapview-map-container">
      {isLoaded ? (
        <GoogleMap key={mapKey} mapContainerStyle={containerStyle} onLoad={onLoad} center={center}>
          {userLocation && (
            <Marker position={userLocation} title="You are here" icon={{ url: userDotUrl }} />
          )}
          {points.map(p => (
            <Marker key={p.id} position={{ lat: p.lat, lng: p.lng }} title={p.title} icon={{ url: workshopPinUrl }} />
          ))}
          {!userLocation && points.length === 0 && (
            <Marker position={defaultCenter} />
          )}
        </GoogleMap>
      ) : (
        <div className="map-placeholder">
          <span>Loading map...</span>
          <div style={{ marginTop: "10px", fontSize: "0.95rem", color: "#aaa" }}>
            Map API Key: {process.env.REACT_APP_MAP_API_KEY ? "Loaded" : "Not Set"}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapSection;