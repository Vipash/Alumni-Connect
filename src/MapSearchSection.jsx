import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Utility for Zooming
function FlyToMarker({ position }) {
  const map = useMap();
  useEffect(() => { 
    if (position) {
      map.flyTo(position, 13);
      // Force an internal invalidateSize when flying to a marker
      setTimeout(() => map.invalidateSize(), 100);
    } 
  }, [position, map]);
  return null;
}

// Internal component to handle map sizing
function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    // This ensures that as soon as the map component mounts, 
    // it recalculates its own bounds.
    setTimeout(() => {
      map.invalidateSize();
    }, 400);
  }, [map]);
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

function MapClickHandler({ isPicking, onPick }) {
  useMapEvents({
    click(e) {
      if (isPicking) onPick(e.latlng);
    },
  });
  return null;
}

function MapSearchSection({ setSidebarContent }) {
  const [alumni, setAlumni] = useState([]);
  const [companySearch, setCompanySearch] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchPos, setSearchPos] = useState(null);
  const [closest, setClosest] = useState(null);
  const [isPicking, setIsPicking] = useState(false);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [bookmarkedAlumni, setBookmarkedAlumni] = useState([]);
  const [visibleContactId, setVisibleContactId] = useState(null);

  // Trigger a global resize event when this component mounts 
  // to help the App.jsx layout settle.
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // --- Logic Functions ---
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
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

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        setSearchPos([latitude, longitude]);
        findClosest(latitude, longitude);
      });
    } else {
      alert("Geolocation is not supported.");
    }
  };

  const handleCompanySearch = () => {
    const matches = alumni.filter(a => a.company?.toLowerCase().includes(companySearch.toLowerCase()));
    if (matches.length > 0) {
      const coords = [matches[0].location.coordinates[1], matches[0].location.coordinates[0]];
      setSearchPos(coords);
    }
  };

  const fetchSuggestions = async (q) => {
    setCityQuery(q);
    if (q.length < 3) {
      setSuggestions([]);
      return;
    }
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}`);
    setSuggestions(await res.json());
  };

  const toggleBookmark = async (alumniId) => {
    if (!user._id) return;
    try {
      const res = await fetch('/api/bookmarks/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, alumniId })
      });
      if (res.ok) {
        const updatedBookmarks = await res.json();
        const updatedUser = { ...user, bookmarks: updatedBookmarks };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (err) { console.error(err); }
  };

  const handleViewContact = async (alumnus) => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (window.confirm("NOTICE: This request will be logged for security. Continue?")) {
      try {
        const response = await fetch('/api/log-interaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alumniId: alumnus._id,
            alumniName: alumnus.name,
            studentId: storedUser._id,
            studentName: storedUser.name || "Student"
          })
        });
        if (response.ok) setVisibleContactId(alumnus._id);
      } catch (error) { alert("Network error."); }
    }
  };

  useEffect(() => {
    fetch('/api/get-alumni').then(res => res.json()).then(setAlumni);
  }, []);

  useEffect(() => {
    if (showBookmarks && user.bookmarks?.length > 0) {
      fetch('/api/bookmarks/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: user.bookmarks })
      })
      .then(res => res.json())
      .then(setBookmarkedAlumni);
    }
  }, [showBookmarks, user.bookmarks]);

  useEffect(() => {
    if (!setSidebarContent) return;
    setSidebarContent(
      <div className="search-sidebar-container" style={{ padding: '20px' }}>
        <h3 style={{ color: 'var(--mbm-blue)', marginBottom: '20px' }}>Alumni Explorer</h3>
        <div style={{ marginBottom: '25px' }}>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Company</label>
          <input className="partition-input" placeholder="Search Company..." value={companySearch} onChange={e => setCompanySearch(e.target.value)} />
          <button className="nav-btn" style={{ width: '100%', marginTop: '10px' }} onClick={handleCompanySearch}>Search Company</button>
        </div>
        <div className="location-search-container">
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Location</label>
          <input className="partition-input" value={cityQuery} placeholder="Search City..." onChange={(e) => fetchSuggestions(e.target.value)} />
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
          <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
            <button className="nav-btn" style={{ flex: 1 }} onClick={useCurrentLocation}>📍 Current</button>
            <button className={isPicking ? 'admin-btn' : 'nav-btn'} style={{ flex: 1 }} onClick={() => setIsPicking(!isPicking)}>
              {isPicking ? 'Cancel' : '📍 Pick'}
            </button>
          </div>
        </div>
      </div>
    );
  }, [companySearch, cityQuery, suggestions, isPicking, setSidebarContent]);

  return (
    <div className="map-page-wrapper">
      <button className="bookmark-toggle-btn" onClick={() => setShowBookmarks(!showBookmarks)}>
        🔖 {user.bookmarks?.length || 0} Saved
      </button>

      <div className={`bookmark-sidebar ${showBookmarks ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>My Bookmarks</h3>
          <button className="close-sidebar" onClick={() => setShowBookmarks(false)}>×</button>
        </div>
        <div className="sidebar-content">
          {bookmarkedAlumni.length > 0 ? (
            bookmarkedAlumni.map(alumnus => (
              <div key={alumnus._id} className="bookmark-item" onClick={() => {
                setSearchPos([alumnus.location.coordinates[1], alumnus.location.coordinates[0]]);
                setShowBookmarks(false);
              }}>
                <strong>{alumnus.name}</strong>
                <p>{alumnus.company}</p>
                <button className="delete-bookmark-small" onClick={(e) => { e.stopPropagation(); toggleBookmark(alumnus._id); }}>×</button>
              </div>
            ))
          ) : <p className="empty-msg">No bookmarks yet!</p>}
        </div>
      </div>

      {/* Main Map Container with Forced Height and Width */}
      <div className="map-fancy-container" style={{ height: '500px', flexShrink: 0 }}>
        <MapContainer 
          center={[26.2389, 73.0243]} 
          zoom={5} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapResizeHandler />
          {searchPos && <FlyToMarker position={searchPos} />}
          <MapClickHandler isPicking={isPicking} onPick={(ll) => {
            setSearchPos([ll.lat, ll.lng]);
            findClosest(ll.lat, ll.lng);
            setIsPicking(false);
          }} />
          
          {searchPos && <Marker position={searchPos} icon={searchIcon}><Popup>Search Point</Popup></Marker>}
          
          {alumni.map(item => (
            <Marker key={item._id} position={[item.location.coordinates[1], item.location.coordinates[0]]}>
              <Popup maxWidth={300} minWidth={250}>
                <div style={{ textAlign: 'center', padding: '5px' }}>
                  <img src={item.photo || '/default-avatar.png'} alt="Profile" style={{ width: '50px', height: '50px', borderRadius: '50%', marginBottom: '5px' }} />
                  <h3 style={{ margin: '0' }}>{item.name}</h3>
                  <p style={{ margin: '5px 0', color: '#666' }}>{item.company}</p>
                  
                  {visibleContactId === item._id ? (
                    <div style={{ padding: '8px', background: '#e8f5e9', borderRadius: '4px', fontSize: '0.8rem' }}>
                      <p>📧 {item.email}</p>
                      <p>📞 {item.mobile || 'N/A'}</p>
                    </div>
                  ) : (
                    <button className="nav-btn" style={{ fontSize: '0.75rem', width: '100%' }} onClick={() => handleViewContact(item)}>🔓 View Contact</button>
                  )}
                  <button className="admin-btn" style={{ fontSize: '0.75rem', width: '100%', marginTop: '5px' }} onClick={() => toggleBookmark(item._id)}>
                    {user.bookmarks?.includes(item._id) ? '🔖 Saved' : '🔖 Bookmark'}
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {closest && (
        <div className="alumni-results-section" style={{ marginTop: '20px' }}>
          <h4>Nearby Alumni</h4>
          <div className="table-wrapper">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: '10px' }}>Name</th>
                  <th style={{ padding: '10px' }}>Company</th>
                  <th style={{ padding: '10px' }}>Dist</th>
                  <th style={{ padding: '10px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {closest.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}>{item.name}</td>
                    <td style={{ padding: '10px' }}>{item.company}</td>
                    <td style={{ padding: '10px' }}>{item.dist.toFixed(1)} km</td>
                    <td style={{ padding: '10px' }}>
                      <button className="nav-btn" style={{ padding: '4px 8px', fontSize: '0.7rem' }} onClick={() => setSearchPos([item.location.coordinates[1], item.location.coordinates[0]])}>Locate</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default MapSearchSection;