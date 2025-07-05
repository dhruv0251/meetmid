import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";
import { useState, useCallback, useEffect, useRef } from "react";

const containerStyle = {
  width: "100%",
  height: "300px"
};

const defaultCenter = {
  lat: 28.6139,
  lng: 77.2090
};

export default function GoogleMapPicker({ onSelect, marker }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  });

  const [localMarker, setLocalMarker] = useState(marker || null);
  const mapRef = useRef(null);

  const handleClick = useCallback((event) => {
    const coords = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    };
    setLocalMarker(coords);
    onSelect(coords);
  }, [onSelect]);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    if (marker) {
      map.panTo(marker);
    }
  }, [marker]);

  // Update map when marker changes from parent (e.g., geolocation)
  useEffect(() => {
    if (marker) {
      setLocalMarker(marker);
      if (mapRef.current) {
        mapRef.current.panTo(marker);
      }
    }
  }, [marker]);

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={localMarker || defaultCenter}
      zoom={14}
      onClick={handleClick}
      onLoad={onMapLoad}
    >
      {localMarker && <Marker position={localMarker} />}
    </GoogleMap>
  );
}
