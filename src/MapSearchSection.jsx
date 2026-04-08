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
  const [selectedAlumni, setSelectedAlumni] = useState(null);
  const [showContact, setShowContact] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [bookmarkedAlumni, setBookmarkedAlumni] = useState([]);
  const [visibleContactId, setVisibleContactId] = useState(null);

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
      alert("Geolocation is not supported by this browser.");
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
    if (!user._id) return alert("Please log in to bookmark alumni.");
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
    } catch (err) {
      console.error("Bookmark error:", err);
    }
  };

  const handleViewContact = async (alumnus) => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser?._id) return alert("Session expired. Please log in.");

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
        
        if (response.ok) {
          // FIX 2: Set the specific ID to unlock the UI
          setVisibleContactId(alumnus._id); 
        } else {
          alert("Server error logging interaction.");
        }
      } catch (error) {
        alert("Network error.");
      }
    }
  };

  // --- Effects ---

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
      .then(data => setBookmarkedAlumni(data));
    }
  }, [showBookmarks, user.bookmarks]);

  // Inject Search UI into the Shared Sidebar
  useEffect(() => {
    if (!setSidebarContent) return;
    setSidebarContent(
      <div className="search-sidebar-container" style={{ padding: '20px' }}>
        <h3 style={{ color: 'var(--mbm-blue)', marginBottom: '20px' }}>Alumni Explorer</h3>
        
        <div style={{ marginBottom: '25px' }}>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Company</label>
          <input 
            className="partition-input" 
            placeholder="Search Company..." 
            value={companySearch}
            onChange={e => setCompanySearch(e.target.value)} 
          />
          <button className="nav-btn" style={{ width: '100%', marginTop: '10px' }} onClick={handleCompanySearch}>
            Search Company
          </button>
        </div>

        <div className="location-search-container">
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Location</label>
          <input 
            className="partition-input"
            value={cityQuery} 
            placeholder="Search City..." 
            onChange={(e) => fetchSuggestions(e.target.value)} 
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
          <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
            <button className="nav-btn" style={{ flex: 1 }} onClick={useCurrentLocation}>📍 Current</button>
            <button className={isPicking ? 'admin-btn' : 'nav-btn'} style={{ flex: 1 }} onClick={() => setIsPicking(!isPicking)}>
              {isPicking ? 'Cancel' : '📍 Pick'}
            </button>
          </div>
        </div>
      </div>
    );
    return () => setSidebarContent(null);
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
              <div key={alumnus._id} className="bookmark-item">
                <div onClick={() => {
                  setSearchPos([alumnus.location.coordinates[1], alumnus.location.coordinates[0]]);
                  setSelectedAlumni(alumnus);
                  setShowBookmarks(false);
                }}>
                  <strong>{alumnus.name}</strong>
                  <p>{alumnus.company}</p>
                </div>
                <button className="delete-bookmark-small" onClick={() => toggleBookmark(alumnus._id)}>×</button>
              </div>
            ))
          ) : <p className="empty-msg">No bookmarks yet!</p>}
        </div>
      </div>

      <div className="map-fancy-container">
        <MapContainer center={[26.2389, 73.0243]} zoom={5} style={{ height: '500px', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
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
                <div style={{ textAlign: 'center', padding: '10px' }}>
                  <img 
                    src={item.photo || '/default-avatar.png'} 
                    alt="Profile" 
                    style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', marginBottom: '10px', border: '2px solid var(--mbm-gold)' }} 
                  />
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>{item.name}</h3>
                  <p style={{ margin: '0 0 10px 0', color: '#666' }}>{item.company}</p>
                  
                  <div style={{ background: '#f0f0f0', padding: '10px', borderRadius: '5px', fontSize: '0.8rem', marginBottom: '10px' }}>
                    <p><strong>Role:</strong> {item.role || 'Alumni'}</p>
                    <p><strong>Batch:</strong> {item.batch || 'N/A'}</p>
                  </div>

                  {/* FIX 3: Conditionally render contact info or button based on visibleContactId */}
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {visibleContactId === item._id ? (
                      <div style={{ padding: '10px', background: '#e8f5e9', borderRadius: '5px', fontSize: '0.85rem', border: '1px solid #4caf50' }}>
                        <p><strong>📧</strong> {item.email}</p>
                        <p><strong>📞</strong> {item.mobile || 'N/A'}</p>
                      </div>
                    ) : (
                      <button className="nav-btn" style={{ fontSize: '0.8rem' }} onClick={() => handleViewContact(item)}>
                        🔓 View Contact
                      </button>
                    )}
                    
                    <button className="admin-btn" style={{ fontSize: '0.8rem' }} onClick={() => toggleBookmark(item._id)}>
                      {user.bookmarks?.includes(item._id) ? '🔖 Saved' : '🔖 Bookmark'}
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* RESULTS SECTION - Moved OUTSIDE the map-fancy-container */}
      {closest && (
        <div className="alumni-results-section" style={{ marginTop: '30px', animation: 'fadeIn 0.5s ease' }}>
          <h3 style={{ color: 'var(--mbm-blue)', borderBottom: '2px solid var(--mbm-gold)', display: 'inline-block', paddingBottom: '5px', marginBottom: '20px' }}>
            Nearest Alumni Results
          </h3>
          <div className="table-wrapper">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>Name</th>
                  <th style={{ padding: '12px' }}>Company</th>
                  <th style={{ padding: '12px' }}>Batch</th>
                  <th style={{ padding: '12px' }}>Distance</th>
                  <th style={{ padding: '12px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {closest.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}><strong>{item.name}</strong></td>
                    <td style={{ padding: '12px' }}>{item.company}</td>
                    <td style={{ padding: '12px' }}>{item.batch || 'N/A'}</td>
                    <td style={{ padding: '12px' }}>
                      <span className="badge-pill" style={{ background: '#e3f2fd', color: '#1976d2' }}>
                        {item.dist.toFixed(1)} km
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button 
                        className="nav-btn" 
                        style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                        onClick={() => setSearchPos([item.location.coordinates[1], item.location.coordinates[0]])}
                      >
                        View on Map
                      </button>
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