import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Utility for Zooming
function FlyToMarker({ position }) {
  const map = useMap();
  useEffect(() => { if (position) map.flyTo(position, 13); }, [position]);
  return null;
}
const searchIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

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
const useCurrentLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      setSearchPos([latitude, longitude]);
      findClosest(latitude, longitude);
    });
  } else {
    alert("Geolocation is not supported by this browser.");
  }
};

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
  const withDistances = alumni
    .filter(a => a.location?.coordinates)
    .map(a => ({
      ...a,
      dist: getDistance(lat, lng, a.location.coordinates[1], a.location.coordinates[0])
    }))
    .sort((a, b) => a.dist - b.dist);

  setClosest(withDistances.slice(0, 3));
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
        {/* ... MapContainer remains exactly the same ... */}
        <MapContainer center={[26.2389, 73.0243]} zoom={5} style={{ height: '400px', width: '100%' }}>
           <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
           {searchPos && <FlyToMarker position={searchPos} />}
           <MapClickHandler isPicking={isPicking} onPick={(ll) => {
             setSearchPos([ll.lat, ll.lng]);
             findClosest(ll.lat, ll.lng);
             setIsPicking(false);
           }} />
           {searchPos && <Marker position={searchPos} icon={searchIcon}><Popup>Search Location</Popup></Marker>}
           {alumni.map(user => (
             <Marker key={user._id} position={[user.location.coordinates[1], user.location.coordinates[0]]}>
               <Popup><strong>{user.name}</strong><br/>{user.company}</Popup>
             </Marker>
           ))}
        </MapContainer>
      </div>

      {/* SEARCH PANEL */}
      <div className="search-panel">
        
        {/* 1. Company Search: Label ON TOP */}
        <div className="company-search-container">
          <label>Company Search</label>
          <input 
            placeholder="Input Company Name... eg. GulGul" 
            onChange={e => setCompanySearch(e.target.value)} 
          />
          <button className="nav-btn" onClick={handleCompanySearch}>Search Company</button>
        </div>

        {/* 2. City Search */}
        <div className="location-search-container">
          <label>Location Search</label>
          <div className="location-search-wrapper">
            <input 
              value={cityQuery} 
              placeholder="Type City Name... eg. Narayanpur Tatwara" 
              onChange={(e) => {
                const val = e.target.value;
                setCityQuery(val);
                if (val.length >= 3) fetchSuggestions(val);
                else setSuggestions([]);
              }} 
            />
            {suggestions.length > 0 && (
              <ul className="suggestions-list">
                {suggestions.map(s => (
                  <li key={s.place_id} onClick={() => { 
                    const lat = parseFloat(s.lat);
                    const lon = parseFloat(s.lon);
                    setSearchPos([lat, lon]); 
                    findClosest(lat, lon); 
                    setSuggestions([]); 
                    setCityQuery(s.display_name);
                  }}>{s.display_name}</li>
                ))}
              </ul>
            )}
          </div>

          {/* 3. Location Buttons: 50/50 Split */}
          <div className="button-row">
            <button className="nav-btn" onClick={useCurrentLocation}>📍 Current Location</button>
            <button 
              className={isPicking ? 'admin-btn' : 'nav-btn'}
              onClick={() => setIsPicking(!isPicking)} 
            >
              {isPicking ? 'Click map to place...' : '📍 Pick on Map'}
            </button>
          </div>
        </div>

        {/* 4. Nearby Alumni List */}
        {closest && closest.length > 0 && (
          <div className="nearby-list">
            <h4>Nearby Alumni List (Top 3)</h4>
            {closest.map((item, index) => (
              <div key={index} className="nearby-item">
                <strong>{item.name}</strong> - {item.company} 
                <span style={{float: 'right'}}>{item.dist.toFixed(1)} km</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export default MapSearchSection;