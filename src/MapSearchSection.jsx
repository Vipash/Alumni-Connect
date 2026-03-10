import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapSearchSection() {
  const [alumni, setAlumni] = useState([]);

  useEffect(() => {
    fetch('/api/get-alumni')
      .then(res => res.json())
      .then(data => setAlumni(data))
      .catch(err => console.error("Map fetch error:", err));
  }, []);

  return (
    <div style={{ height: '500px', width: '100%' }}>
      <MapContainer center={[26.2389, 73.0243]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {alumni.map((user) => {
          // Only show markers if the user actually has location data
          if (user.location?.coordinates) {
            return (
              <Marker key={user._id} position={[user.location.coordinates[1], user.location.coordinates[0]]}>
                <Popup>
                  <strong>{user.name}</strong><br />
                  {user.company}<br />
                  <button onClick={() => alert("Open chat with " + user.name)}>Message</button>
                </Popup>
              </Marker>
            );
          }
          return null;
        })}
      </MapContainer>
    </div>
  );
}

export default MapSearchSection;