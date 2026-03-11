import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Haversine formula for distance
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

function MapSearchSection() {
  const [alumni, setAlumni] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [targetLoc, setTargetLoc] = useState({ lat: 26.2389, lng: 73.0243 });
  const [closestAlumni, setClosestAlumni] = useState(null);

  useEffect(() => {
    fetch('/api/get-alumni')
      .then(res => res.json())
      .then(data => setAlumni(data.filter(a => a.location?.coordinates)));
  }, []);

  // Filter logic for search bar
  const filteredAlumni = alumni.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const findClosest = () => {
    let minD = Infinity;
    let found = null;
    alumni.forEach(a => {
      const d = getDistance(targetLoc.lat, targetLoc.lng, a.location.coordinates[1], a.location.coordinates[0]);
      if (d < minD) { minD = d; found = { ...a, dist: d.toFixed(2) }; }
    });
    setClosestAlumni(found);
  };

  return (
    <div style={{ display: 'flex', height: '600px', gap: '10px' }}>
      {/* Search Sidebar */}
      <div style={{ width: '300px', padding: '10px', background: '#f4f4f4' }}>
        <input placeholder="Search Name/Company..." onChange={(e) => setSearchTerm(e.target.value)} />
        <hr />
        <h4>Location Search</h4>
        <input type="number" placeholder="Lat" onChange={(e) => setTargetLoc({...targetLoc, lat: parseFloat(e.target.value)})} />
        <input type="number" placeholder="Lng" onChange={(e) => setTargetLoc({...targetLoc, lng: parseFloat(e.target.value)})} />
        <button onClick={findClosest}>Find Closest</button>
        
        {closestAlumni && (
          <div style={{ marginTop: '10px', padding: '10px', border: '1px solid #ccc' }}>
            <strong>Closest: {closestAlumni.name}</strong><br/>
            {closestAlumni.dist} km away
          </div>
        )}
      </div>

      {/* Map Area */}
      <div style={{ flexGrow: 1 }}>
        <MapContainer center={[targetLoc.lat, targetLoc.lng]} zoom={10} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {filteredAlumni.map((user) => (
            <Marker key={user._id} position={[user.location.coordinates[1], user.location.coordinates[0]]}>
              <Popup>{user.name} - {user.company}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

export default MapSearchSection;