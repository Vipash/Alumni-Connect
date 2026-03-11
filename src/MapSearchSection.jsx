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
const [isPicking, setIsPicking] = useState(false);

  const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const findClosest = (lat, lng) => {
  let nearest = null;
  let minD = Infinity;
  alumni.forEach(a => {
    if (a.location?.coordinates) {
      const d = getDistance(lat, lng, a.location.coordinates[1], a.location.coordinates[0]);
      if (d < minD) {
        minD = d;
        nearest = { ...a, dist: d.toFixed(1) };
      }
    }
  });
  setClosest(nearest);
};

function MapClickHandler({ isPicking, onPick }) {
  useMapEvents({
    click(e) {
      if (isPicking) {
        onPick(e.latlng);
      }
    },
  });
  return null;
}

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
          <MapClickHandler isPicking={isPicking} onPick={(ll) => {
    setSearchPos([ll.lat, ll.lng]);
    findClosest(ll.lat, ll.lng);
    setIsPicking(false);
  }} />
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
  
  <button onClick={() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      setSearchPos([latitude, longitude]);
      findClosest(latitude, longitude);
    });
  }}>📍 My Loc</button>

<button onClick={() => { 
  setIsPicking(true); 
  alert("Click anywhere on the map to set your search point!"); 
}}>📍 Pick on Map</button>
</div>

{/* Result Display */}
{closest && (
  <div className="result-card" style={{ marginTop: '10px', padding: '10px', background: '#e8f4fd' }}>
    Nearest Alumnus: <strong>{closest.name}</strong> ({closest.dist} km away at {closest.company})
  </div>
)}

        {/* City Suggestions */}
        {suggestions.length > 0 && (
  <ul className="suggestions-list">
    {suggestions.map(s => (
      <li key={s.place_id} onClick={() => { 
        const lat = parseFloat(s.lat);
        const lon = parseFloat(s.lon);
        setSearchPos([lat, lon]); 
        findClosest(lat, lon); 
        setSuggestions([]); 
        setCityQuery(s.display_name); // Update the input field text
      }}>
        {s.display_name}
      </li>
    ))}
  </ul>
)}
      </div>
    </div>
  );
}
export default MapSearchSection;