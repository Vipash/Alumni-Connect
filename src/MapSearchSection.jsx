import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Utility for Zooming
function FlyToMarker({ position }) {
  const map = useMap();
  useEffect(() => { if (position) map.flyTo(position, 13); }, [position]);
  return null;
}

function MapSearchSection() {
  const [alumni, setAlumni] = useState([]);
  const [companySearch, setCompanySearch] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchPos, setSearchPos] = useState(null);
  const [closest, setClosest] = useState(null);
  const [filtered, setFiltered] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 1. Fetch data
  useEffect(() => {
    fetch('/api/get-alumni').then(res => res.json()).then(setAlumni);
  }, []);

  // 2. Company Search logic
  const handleCompanySearch = () => {
    const matches = alumni.filter(a => a.company?.toLowerCase().includes(companySearch.toLowerCase()));
    setFiltered(matches);
    setCurrentIndex(0);
    if (matches.length > 0) setSearchPos([matches[0].location.coordinates[1], matches[0].location.coordinates[0]]);
  };

  // 3. City Search (Nominatim)
  const fetchSuggestions = async (q) => {
    setCityQuery(q);
    if (q.length < 3) return;
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}`);
    setSuggestions(await res.json());
  };

  return (
    <div className="map-page-wrapper">
      <div className="map-fancy-container">
        <MapContainer center={[26.2389, 73.0243]} zoom={5} style={{ height: '400px', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {searchPos && <FlyToMarker position={searchPos} />}
          
          {/* Markers */}
          {alumni.map(user => (
            <Marker key={user._id} position={[user.location.coordinates[1], user.location.coordinates[0]]}>
              <Popup><strong>{user.name}</strong><br/>{user.company}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* SEARCH PANEL */}
      <div className="search-panel">
        {/* Company Search */}
        <div className="input-group">
          <input placeholder="Search Company..." onChange={e => setCompanySearch(e.target.value)} />
          <button onClick={handleCompanySearch}>Search Company</button>
          {filtered.length > 1 && (
            <button onClick={() => { 
                const next = (currentIndex + 1) % filtered.length; 
                setCurrentIndex(next); 
                setSearchPos([filtered[next].location.coordinates[1], filtered[next].location.coordinates[0]]); 
            }}>Next Match ({currentIndex + 1}/{filtered.length})</button>
          )}
        </div>

        {/* Location Controls */}
        <div className="input-group">
          <input value={cityQuery} placeholder="City Name..." onChange={e => fetchSuggestions(e.target.value)} />
          <button onClick={() => { /* logic to use current location */ }}>Use Current Loc</button>
          <button onClick={() => { /* toggle pick marker mode */ }}>Pick on Map</button>
        </div>

        {/* City Suggestions */}
        {suggestions.length > 0 && (
          <ul className="suggestions-list">
            {suggestions.map(s => <li key={s.place_id} onClick={() => { 
                setSearchPos([parseFloat(s.lat), parseFloat(s.lon)]); 
                setSuggestions([]); 
            }}>{s.display_name}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}
export default MapSearchSection;