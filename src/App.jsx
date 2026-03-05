import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import LocationPicker from './LocationPicker';
import 'leaflet/dist/leaflet.css';
import './App.css';

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [alumniList, setAlumniList] = useState([]);
  const [formData, setFormData] = useState({ name: '', company: '' });
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [user, setUser] = useState(null); 
  const [pendingList, setPendingList] = useState([]);

  // Note: API calls updated to use /api/ prefix
  const fetchAlumni = async () => {
    try {
      const response = await fetch('/api/get-alumni');
      const data = await response.json();
      setAlumniList(data);
    } catch (error) { console.error("Error:", error); }
  };

  useEffect(() => { fetchAlumni(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCoords) return alert("Select location!");

    await fetch('/api/add-alumni', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.name,
        company: formData.company,
        location: { type: "Point", coordinates: [selectedCoords[1], selectedCoords[0]] } 
      })
    });
    alert("Registered!");
    setSelectedCoords(null);
    setFormData({ name: '', company: '' });
  };

  const filteredAlumni = alumniList.filter(alumni => 
    alumni.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alumni.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <div style={{ width: '350px', padding: '20px', background: 'white', overflowY: 'auto' }}>
        <h2>Alumni Connect</h2>
        <img src="/MBM_Logo.png" alt="Logo" style={{ width: '100px' }} />
        
        {!user ? (
          <div>
            <button onClick={() => setUser({ role: 'junior' })}>Junior</button>
            <button onClick={() => setUser({ role: 'alumni' })}>Alumni</button>
            <button onClick={async () => {
              const pass = prompt("Password:");
              if (pass === "admin123") {
                const res = await fetch('/api/get-pending');
                setPendingList(await res.json());
                setUser({ role: 'admin' });
              }
            }}>Admin</button>
          </div>
        ) : (
          <div>
            <button onClick={() => setUser(null)}>Logout</button>
            {user.role === 'admin' ? (
              pendingList.map(item => (
                <div key={item._id} style={{ border: '2px solid #d90479', background: '#fffaf0', padding: '10px', marginBottom: '10px' }}>
                  <strong>{item.name}</strong><br/>{item.company}
                  <button onClick={async () => {
                    await fetch(`/api/approve-alumni/${item._id}`, { method: 'PATCH' });
                    setPendingList(pendingList.filter(p => p._id !== item._id));
                  }}>Approve</button>
                </div>
              ))
            ) : (
              <form onSubmit={handleSubmit}>
                <input placeholder="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <input placeholder="Company" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
                <button type="submit">Submit</button>
              </form>
            )}
          </div>
        )}
      </div>

      <div style={{ flexGrow: 1 }}>
        <MapContainer center={[26.2389, 73.0243]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {user?.role === 'alumni' && <LocationPicker setCoords={setSelectedCoords} />}
          {filteredAlumni.map(alumni => (
            <Marker key={alumni._id} position={[alumni.location.coordinates[1], alumni.location.coordinates[0]]}>
              <Popup>{alumni.name}<br/>{alumni.company}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

export default App;