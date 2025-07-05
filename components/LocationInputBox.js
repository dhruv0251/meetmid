import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const GoogleMapPicker = dynamic(() => import("./GoogleMapPicker"), { ssr: false });

export default function LocationInputBox({ label, onLocationSelect }) {
  const [showMap, setShowMap] = useState(false);
  const [text, setText] = useState("");
  const [marker, setMarker] = useState(null);
  const [debouncedText, setDebouncedText] = useState("");

  // Debounce the input by 600ms
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedText(text), 600);
    return () => clearTimeout(handler);
  }, [text]);

  // Geocode the address when debounced text changes
  useEffect(() => {
    if (!debouncedText) return;

    const fetchCoordinates = async () => {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(debouncedText)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
        );
        const data = await response.json();

        if (data.status === "OK") {
          const coords = data.results[0].geometry.location;
          setMarker(coords);
          onLocationSelect(coords);
          setShowMap(true); // show map when address is typed
        } else {
          console.warn("⚠️ No coordinates found for input:", debouncedText);
        }
      } catch (err) {
        console.error("❌ Geocoding error:", err);
      }
    };

    fetchCoordinates();
  }, [debouncedText, onLocationSelect]);

  // Get current location and optionally reverse geocode
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setMarker(coords);
        onLocationSelect(coords);
        setShowMap(true);

        try {
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.lat},${coords.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
          );
          const data = await res.json();
          if (data.status === "OK") {
            const address = data.results[0].formatted_address;
            setText(address); // fill input box with location
          }
        } catch {
          console.warn("⚠️ Could not reverse geocode.");
        }
      },
      (error) => {
        console.error("❌ Geolocation error:", error);
        alert("Unable to retrieve your location.");
      }
    );
  };

  return (
    <div style={{ marginBottom: "2rem", textAlign: "left" }}>
      <h3 style={{ marginBottom: "0.5rem", color:"black",fontWeight: "900",
    fontSize: "1.1rem"}}>{label}</h3>

      <input
        type="text"
        placeholder="Enter address"
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{
          width: "100%",
          color: "#000",
          padding: "0.6rem",
          borderRadius: "6px",
          border: "1px solid #ccc",
          marginBottom: "0.5rem",
        }}
      />

      <div style={{ display: "flex", gap: "1rem", marginBottom: "0.5rem" }}>
        <button
          type="button"
          onClick={() => setShowMap(true)}
          style={{ ...buttonStyle, flex: 1 }}
        >
          Select on Map
        </button>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          style={{ ...buttonStyle2, backgroundColor: "#fff", flex: 1 }}
        >
          Use My Location
        </button>
      </div>

      {showMap && (
        <GoogleMapPicker
          marker={marker}
          onSelect={(coords) => {
            setMarker(coords);
            onLocationSelect(coords);
          }}
        />
      )}
    </div>
  );
}

const buttonStyle = {
  padding: "1rem",
  color: "#fff", // Black text for high contrast
  backgroundColor: "#ff2d03", // Flat red
  border: "3px solid #000", // Thick black border
  borderRadius: "0px", // Brutalism prefers sharp corners
  fontWeight: "900",
  fontSize: "1rem",
  fontFamily: '"Courier New", Courier, monospace', // Brutalist font
  textTransform: "uppercase",
  cursor: "pointer",
  boxShadow: "4px 4px 0px #000", // Blocky shadow
  transition: "none"
};
const buttonStyle2 = {
  padding: "1rem",
  color: "#000", // Black text for high contrast
  backgroundColor: "#ff621f", // Flat red
  border: "3px solid #000", // Thick black border
  borderRadius: "0px", // Brutalism prefers sharp corners
  fontWeight: "900",
  fontSize: "1rem",
  fontFamily: '"Courier New", Courier, monospace', // Brutalist font
  textTransform: "uppercase",
  cursor: "pointer",
  boxShadow: "4px 4px 0px #000", // Blocky shadow
  transition: "none"
};