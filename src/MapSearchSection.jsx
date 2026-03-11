import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Haversine function (same as before)
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
};

function MapSearchSection() {
  const [alumni, setAlumni] = useState([]);
  const [companySearch, setCompanySearch] = useState('');
  const [locationName, setLocationName] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [closest, setClosest] = useState(null);

  useEffect(() => {
    fetch('/api/get-alumni')
      .then(res => res.json())
      .then(data => setAlumni(data.filter(a => a.location?.coordinates)));
  }, []);

  // 1. Geocoding: Fetch city suggestions
  const fetchSuggestions = async (query) => {
    if (query.length < 3) return;
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
    const data = await res.json();
    setSuggestions(data);
  };

  // 2. Select Location and find closest
  const selectLocation = (loc) => {
    const lat = parseFloat(loc.lat);
    const lng = parseFloat(loc.lon);
    findClosest(lat, lng);
    setSuggestions([]);
  };

  // 3. Current Location
  const useCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      findClosest(pos.coords.latitude, pos.coords.longitude);
    });
  };

  const findClosest = (lat, lng) => {
    let nearest = null;
    let minD = Infinity;
    alumni.forEach(a => {
      const d = getDistance(lat, lng, a.location.coordinates[1], a.location.coordinates[0]);
      if (d < minD) { minD = d; nearest = { ...a, dist: d.toFixed(1) }; }
    });
    setClosest(nearest);
  };

  return (
    <div className="map-page-wrapper">
      <div className="map-fancy-container">
        <MapContainer center={[26.2389, 73.0243]} zoom={5} style={{ height: '400px', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {alumni.filter(a => a.company?.toLowerCase().includes(companySearch.toLowerCase())).map(user => (
            <Marker key={user._id} position={[user.location.coordinates[1], user.location.coordinates[0]]} />
          ))}
        </MapContainer>
      </div>

      <div className="search-panel">
        <input placeholder="Search by Company Name..." onChange={e => setCompanySearch(e.target.value)} />
        
        <div className="location-controls">
          <input placeholder="Enter City/Place..." onChange={e => { setLocationName(e.target.value); fetchSuggestions(e.target.value); }} />
          <button onClick={useCurrentLocation}>📍 Use My Location</button>
        </div>

        {suggestions.length > 0 && (
          <ul className="suggestions-list">
            {suggestions.map(s => <li key={s.place_id} onClick={() => selectLocation(s)}>{s.display_name}</li>)}
          </ul>
        )}

        {closest && <div className="result-card">Nearest Alumnus: <strong>{closest.name}</strong> ({closest.dist} km away at {closest.company})</div>}
      </div>
    </div>
  );
}

export default MapSearchSection;