import { useMapEvents, Marker, useMap } from 'react-leaflet';
import { useState } from 'react';

export default function LocationPicker({ setCoords, onConfirm }) {
  const [marker, setMarker] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const map = useMap(); // Access the map instance

  // Handler for searching locations via OpenStreetMap Nominatim
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newPos = { lat: parseFloat(lat), lng: parseFloat(lon) };
        
        setMarker(newPos);
        setCoords([newPos.lat, newPos.lng]);
        map.flyTo(newPos, 14); // Moves the map smoothly to the search result
      } else {
        alert("Location not found. Try adding a city or state.");
      }
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  useMapEvents({
    click(e) {
      setMarker(e.latlng);
      setCoords([e.latlng.lat, e.latlng.lng]);
    },
  });

  return (
    <>
      {/* Search Input UI - Positioned at top-center of map */}
      <div className="map-search-overlay">
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '5px' }}>
          <input
            type="text"
            placeholder="Search city or area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()} // Prevents map dragging while typing
          />
          <button type="submit">Search</button>
        </form>
      </div>

      {marker && (
        <>
          <Marker position={marker} />
          <div className="picker-info-box">
            <p>Selected: {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}</p>
            {/* Keeping the confirm button here as well for easy access */}
            <button onClick={onConfirm}>Confirm This Spot</button>
          </div>
        </>
      )}
    </>
  );
}