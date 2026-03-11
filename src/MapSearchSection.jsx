import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Custom Icon for the Search Marker
const searchIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

function MapSearchSection() {
  const [alumni, setAlumni] = useState([]);
  const [companySearch, setCompanySearch] = useState('');
  const [searchPos, setSearchPos] = useState(null); // The red marker
  const [isPicking, setIsPicking] = useState(false);
  const [closest, setClosest] = useState(null);

  // Helper: Map click listener
  function MapEvents() {
    useMapEvents({
      click(e) {
        if (isPicking) {
          setSearchPos(e.latlng);
          findClosest(e.latlng.lat, e.latlng.lng);
          setIsPicking(false);
        }
      },
    });
    return null;
  }

  useEffect(() => {
    fetch('/api/get-alumni')
      .then(res => res.json())
      .then(data => setAlumni(data.filter(a => a.location?.coordinates)));
  }, []);

  const findClosest = (lat, lng) => {
    let nearest = null;
    let minD = Infinity;
    alumni.forEach(a => {
      const coords = a.location.coordinates;
     // Haversine function (same as before)
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};
    });
    setClosest(nearest);
  };

  const useCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setSearchPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      findClosest(pos.coords.latitude, pos.coords.longitude);
    });
  };

  return (
    <div className="map-page-wrapper">
      <div className="map-fancy-container">
        <MapContainer center={[26.2389, 73.0243]} zoom={5} style={{ height: '400px', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapEvents />
          {searchPos && <Marker position={searchPos} icon={searchIcon} />}
          
          {alumni.filter(a => a.company?.toLowerCase().includes(companySearch.toLowerCase())).map(user => (
            <Marker key={user._id} position={[user.location.coordinates[1], user.location.coordinates[0]]}>
              <Popup><strong>{user.name}</strong><br/>{user.company}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="search-panel">
        <div className="input-group">
          <input placeholder="Search Company..." onChange={e => setCompanySearch(e.target.value)} />
          <button className="search-btn">🔍</button>
        </div>
        
        <div className="location-controls">
          <button onClick={() => setIsPicking(!isPicking)} style={{ backgroundColor: isPicking ? '#e67e22' : '#2ecc71' }}>
            {isPicking ? 'Click map to place marker...' : '📍 Pick Location'}
          </button>
          <button onClick={useCurrentLocation}>🎯 Use My Location</button>
        </div>

        {closest && <div className="result-card">Nearest: <strong>{closest.name}</strong> ({closest.dist} km away)</div>}
      </div>
    </div>
  );
}
export default MapSearchSection;