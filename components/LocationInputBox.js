import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const GoogleMapPicker = dynamic(() => import('./GoogleMapPicker'), { ssr: false });

export default function LocationInputBox({ label, onLocationSelect, showMap, setShowMap }) {
  const [text, setText] = useState("");
  const [marker, setMarker] = useState(null);
  const [debouncedText, setDebouncedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Debounce text input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedText(text);
    }, 500);
    return () => clearTimeout(timer);
  }, [text]);

  // Geocoding effect
  useEffect(() => {
    if (!debouncedText.trim()) return;

    const geocodeAddress = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            debouncedText
          )}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
        );
        const data = await response.json();

        if (data.results && data.results.length > 0) {
          const location = data.results[0].geometry.location;
          const coords = { lat: location.lat, lng: location.lng };
          setMarker(coords);
          onLocationSelect(coords);
        }
      } catch (error) {
        console.error("Geocoding error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    geocodeAddress();
  }, [debouncedText, onLocationSelect]);

  const handleMapSelect = (coords) => {
    setMarker(coords);
    onLocationSelect(coords);
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setMarker(coords);
        onLocationSelect(coords);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to retrieve your location.");
        setIsLoading(false);
      }
    );
  };

  return (
    <div style={{
      background: 'var(--bg-primary)',
      border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-6)',
      transition: 'all var(--transition-normal)'
    }}>
      {/* Label */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        marginBottom: 'var(--space-4)'
      }}>
        <div style={{
          width: '20px',
          height: '20px',
          background: 'var(--accent-primary)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--bg-primary)'
        }}>
          📍
        </div>
        <label style={{
          fontSize: 'var(--font-size-base)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--text-primary)'
        }}>
          {label}
        </label>
      </div>

      {/* Input Field */}
      <div style={{ position: 'relative', marginBottom: 'var(--space-4)' }}>
        <input
          type="text"
          placeholder="Enter address or search..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="input"
          style={{
            paddingRight: isLoading ? 'var(--space-10)' : 'var(--space-4)'
          }}
        />
        {isLoading && (
          <div style={{
            position: 'absolute',
            right: 'var(--space-4)',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '20px',
            height: '20px',
            border: '2px solid var(--text-muted)',
            borderTop: '2px solid var(--accent-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        )}
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-3)',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setShowMap(!showMap)}
          className="btn btn-secondary btn-sm"
          style={{ flex: '1', minWidth: '140px' }}
        >
          🗺️ {showMap ? 'Hide Map' : 'Select on Map'}
        </button>

        <button
          onClick={handleMyLocation}
          disabled={isLoading}
          className="btn btn-secondary btn-sm"
          style={{ flex: '1', minWidth: '140px' }}
        >
          📍 Use My Location
        </button>
      </div>

      {/* Map */}
      {showMap && (
        <div style={{
          marginTop: 'var(--space-6)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          border: '1px solid var(--border-light)'
        }}>
          <GoogleMapPicker
            marker={marker}
            onSelect={handleMapSelect}
          />
        </div>
      )}
    </div>
  );
}