import { useMapEvents, Marker, useMap } from 'react-leaflet';
import { useState } from 'react';

export default function LocationPicker({ setCoords, onConfirm }) {
  const [marker, setMarker] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const map = useMap();

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
        map.flyTo(newPos, 14);
      } else {
        alert("Location not found.");
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
      {/* Sleeker Search Overlay */}
      <div className="map-search-wrapper">
        <form onSubmit={handleSearch} className="map-search-form">
          <input
            type="text"
            placeholder="Search city, area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()} 
          />
          <button type="submit" className="map-search-btn">Search</button>
        </form>
      </div>

      {marker && <Marker position={marker} />}
    </>
  );
}