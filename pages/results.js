import { useEffect, useState } from "react";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "300px"
};

const copyToClipboard = (text) => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      alert("📍 Location copied to clipboard!");
    }).catch(err => {
      alert("❌ Failed to copy.");
    });
  } else {
    // fallback
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      alert("📍 Location copied to clipboard!");
    } catch (err) {
      alert("❌ Copy not supported");
    }
    document.body.removeChild(textarea);
  }
};


const getDistance = (loc1, loc2) => {
  if (!loc1 || !loc2) return 0;
  const toRad = val => (val * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(loc2.lat - loc1.lat);
  const dLng = toRad(loc2.lng - loc1.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(loc1.lat)) *
      Math.cos(toRad(loc2.lat)) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(2); // in km
};

export default function ResultsPage() {
  const [data, setData] = useState(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  });

  useEffect(() => {
    const stored = sessionStorage.getItem("meetmid-results");
    if (stored) {
      setData(JSON.parse(stored));
    }
  }, []);

  if (!data || !isLoaded) return <div style={{ padding: "2rem" }}>Loading results...</div>;

  const { location1, location2 } = data;

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>📍 Best Places to Meet</h2>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={data.midpoint}
        zoom={12}
      >
        <Marker position={data.midpoint} />
        {data.places.map((place, index) => (
          <Marker key={index} position={{ lat: place.location.lat, lng: place.location.lng }} />
        ))}
      </GoogleMap>

      <div style={styles.list}>
        {data.places.map((place, index) => (
          <div key={index} style={styles.card}>
            <h3 style={styles.placeName}>{place.name}</h3>
            <p style={styles.address}>{place.address}</p>
            <div style={styles.meta}>
              <span style={styles.rating}>⭐ {place.rating || "N/A"}</span>
              
            </div>

            <p style={{ marginTop: "0.8rem", fontWeight: "bold" , color: "#fc2671" }}>
              Distance: {getDistance(location1, place.location).toString()} km from you,{" "}
              {getDistance(location2, place.location).toString()} km from friend
            </p>

            <div style={styles.buttonGroup}>
  <button
    style={styles.shareButton}
    onClick={() =>
      copyToClipboard(
        `https://www.google.com/maps/search/?api=1&query=${place.location.lat},${place.location.lng}`
      )
    }
  >
    📤 Share Location
  </button>

  <a
    href={`https://www.google.com/maps/search/?api=1&query=${place.location.lat},${place.location.lng}`}
    target="_blank"
    rel="noopener noreferrer"
    style={{ ...styles.shareButton, backgroundColor: "#fff", color: "#000" }}
  >
    🗺 Open in Map
  </a>
</div>

          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    fontFamily: "'Courier New', monospace",
    background: "#fefefe",
    minHeight: "100vh",
    borderTop: "6px solid black"
  },
  heading: {
    fontSize: "2rem",
    marginBottom: "1.5rem",
    color: "#000",
    fontWeight: "900",
    borderBottom: "3px solid black",
    paddingBottom: "0.5rem",
    textTransform: "uppercase"
  },
  list: {
    marginTop: "2rem"
  },
  card: {
    background: "#fff",
    padding: "1.5rem",
    border: "3px solid black",
    marginBottom: "1.5rem",
    boxShadow: "5px 5px 0px black",
    borderRadius: "0"
  },
  placeName: {
    fontSize: "1.4rem",
    margin: 0,
    color: "#000",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "1px"
  },
  address: {
    fontSize: "1rem",
    color: "#111",
    marginTop: "0.5rem"
  },
  meta: {
    marginTop: "1rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    borderTop: "2px solid black",
    paddingTop: "1rem"
  },
  rating: {
    backgroundColor: "#ffff00",
    color: "#000",
    padding: "0.4rem 0.8rem",
    fontWeight: "900",
    border: "2px solid black",
    fontSize: "1rem"
  },
  tags: {
    display: "flex",
    gap: "0.6rem",
    marginTop: "0.8rem",
    flexWrap: "wrap"
  },
  tag: {
    backgroundColor: "#eee",
    color: "#000",
    padding: "0.3rem 0.7rem",
    fontSize: "0.9rem",
    border: "2px solid black",
    fontWeight: "bold",
    textTransform: "uppercase"
  },
  shareButton: {
    marginTop: "1rem",
    padding: "0.6rem 1rem",
    backgroundColor: "#000",
    color: "#fff",
    border: "2px solid black",
    fontWeight: "bold",
    cursor: "pointer"
  },
  buttonGroup: {
  display: "flex",
  gap: "1rem",
  marginTop: "1rem",
  flexWrap: "wrap"
  }

};
