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
    if (matches.length > 0) {
    const coords = [matches[0].location.coordinates[1], matches[0].location.coordinates[0]];
    setSearchPos(coords);
  }
  };

  // 3. City Search (Nominatim)
  const fetchSuggestions = async (q) => {
    setCityQuery(q);
    if (q.length < 3) return;
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}`);
    setSuggestions(await res.json());
  };

const [selectedAlumni, setSelectedAlumni] = useState(null); // For the details pop-up
const [showContact, setShowContact] = useState(false); // To toggle phone/email

const handleViewContact = async (alumni) => {
  // 1. Get user from storage (now that App.jsx is saving it)
  const storedUser = JSON.parse(localStorage.getItem('user'));

  if (!storedUser || !storedUser._id) {
    alert("Session expired. Please log in again.");
    return;
  }

  const confirmMsg = "NOTICE: Your request to view contact details will be logged for security purposes. Continue?";
  
  if (window.confirm(confirmMsg)) {
    try {
      const response = await fetch('/api/log-interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alumniId: alumni._id,
          alumniName: alumni.name,
          studentId: storedUser._id, 
          studentName: storedUser.name || storedUser.displayName || "Student" // Match server.js key
        })
      });

      if (response.ok) {
        setShowContact(true);
      } else {
        alert("Server error logging interaction.");
      }
    } catch (error) {
      alert("Network error. Please try again.");
    }
  }
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
           {searchPos && !companySearch && (
    <Marker position={searchPos} icon={searchIcon}>
      <Popup>Search Location</Popup>
    </Marker>
  )}
           {alumni.map(user => (
  <Marker key={user._id} position={[user.location.coordinates[1], user.location.coordinates[0]]}>
    <Popup>
      <div style={{ textAlign: 'center' }}>
        <strong style={{ fontSize: '1.1rem' }}>{user.name}</strong>
        <p style={{ margin: '5px 0', color: '#666' }}>{user.company}</p>
        
        <div className="popup-btn-group">
          <button className="nav-btn" onClick={() => {
            setSelectedAlumni(user);
            setShowContact(false); // Reset contact view for new selection
          }}>
            View Full Profile
          </button>
          <button className="admin-btn" style={{ borderColor: '#d4af37', color: '#d4af37' }}>
            🔖 Bookmark
          </button>
        </div>
      </div>
    </Popup>
  </Marker>
))}
        </MapContainer>
      </div>

      {/* SEARCH PANEL */}
      <div className="search-panel">
        
        {/* 1. Company Search: Label ON TOP */}
        <div className="company-search-container">
          <label htmlFor="company-input">Company Search</label>
          <input 
            id="company-input" // Associates with the label
            name="company-name" // Helps browser autofill
            autoComplete="organization" // Tells browser this is a company field
            placeholder="Input Company Name... eg. GulGul" 
            onChange={e => setCompanySearch(e.target.value)} 
          />
          <button className="nav-btn" onClick={handleCompanySearch}>Search Company</button>
        </div>

        {/* 2. City Search */}
        <div className="location-search-container">
          <label htmlFor="city-input">Location Search</label>
          <div className="location-search-wrapper">
            <input 
              id="city-input"
              name="city-query"
              autoComplete="address-level2"
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
            <button className="nav-btn" onClick={useCurrentLocation}>📍 Use My Current Location</button>
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
            <h4>Nearby Alumni</h4>
            {closest.map((item, index) => (
              <div key={index} className="nearby-item">
                <strong>{item.name}</strong> - {item.company} 
                <span style={{float: 'right'}}>{item.dist.toFixed(1)} km</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {selectedAlumni && (
  <div className="modal-overlay" style={{ zIndex: 1000 }}>
    <div className="modal-box" style={{ textAlign: 'left', maxWidth: '400px' }}>
      <h2 style={{ borderBottom: `2px solid var(--mbm-gold)`, paddingBottom: '10px' }}>
        Alumni Profile
      </h2>
      <div style={{ margin: '15px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', textAlign: 'left' }}>
        <img 
  /* 1. Try 'photo', then 'profilePic', then the local default-avatar */
  src={selectedAlumni.photo || selectedAlumni.profilePic || '/default-avatar.png'} 
  alt="Profile" 
  style={{ 
    width: '80px', 
    height: '80px', 
    borderRadius: '50%', 
    objectFit: 'cover', 
    border: '2px solid var(--mbm-gold)',
    backgroundColor: '#f0f0f0' 
  }}
  /* 2. Emergency fallback if the URL exists but is a 404/broken link */
  onError={(e) => { 
    e.target.onerror = null; 
    e.target.src = '/default-avatar.png'; 
  }}
/>
        <div>
          <h2 style={{ margin: 0, color: 'var(--mbm-blue)' }}>{selectedAlumni.name}</h2>
          <p style={{ margin: 0, color: '#666' }}>{selectedAlumni.company}</p>
        </div>
      </div>
      <div style={{ textAlign: 'left', marginBottom: '20px' }}>
        <p><strong>Role:</strong> {selectedAlumni.role || 'Senior Consultant'}</p>
        <p><strong>Batch:</strong> {selectedAlumni.batch || '2020'}</p>
      </div>
      </div>

      <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
        {!showContact ? (
          <button className="nav-btn" onClick={() => handleViewContact(selectedAlumni)}>
            🔓 Display Contact Details
          </button>
        ) : (
          <div className="loading" style={{ animation: 'none' }}>
            <p style={{ margin: '0', color: 'var(--mbm-blue)' }}><strong>Email:</strong> {selectedAlumni.email}</p>
            <p style={{ margin: '5px 0 0 0', color: 'var(--mbm-blue)' }}><strong>Phone:</strong> {selectedAlumni.phone || '+91 XXXXX XXXXX'}</p>
          </div>
        )}
      </div>

      <button className="admin-btn" onClick={() => setSelectedAlumni(null)}>Close Window</button>
    </div>
  </div>
)}
    </div>
  );
}
export default MapSearchSection;