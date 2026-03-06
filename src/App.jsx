import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import LocationPicker from './LocationPicker';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

// --- FIX FOR BROKEN MARKER ICONS IN PRODUCTION ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});
L.Marker.prototype.options.icon = DefaultIcon;
// -------------------------------------------------

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [alumniList, setAlumniList] = useState([]);
  const [formData, setFormData] = useState({ name: '', company: '' });
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [user, setUser] = useState(null); 
  const [pendingList, setPendingList] = useState([]);

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
    if (!selectedCoords) return alert("Please click on the map to select your location!");

    try {
      const res = await fetch('/api/add-alumni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          company: formData.company,
          location: { type: "Point", coordinates: [selectedCoords[1], selectedCoords[0]] } 
        })
      });
      if(res.ok) {
        alert("Registration submitted for approval!");
        setSelectedCoords(null);
        setFormData({ name: '', company: '' });
        setUser(null); // Return to home
      }
    } catch (err) { alert("Error submitting form"); }
  };

  const filteredAlumni = alumniList.filter(alumni => 
    alumni.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alumni.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      
      {/* SIDEBAR */}
      <div className="sidebar" style={{ width: '350px', padding: '20px', background: 'white', overflowY: 'auto', boxShadow: '2px 0 5px rgba(0,0,0,0.1)', zIndex: 1000 }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <img src="/MBM_Logo.png" alt="Logo" style={{ width: '80px' }} />
            <h2 style={{ color: '#d90429' }}>Alumni Connect</h2>
        </div>
        
        {!user ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="nav-btn" onClick={() => setUser({ role: 'junior' })}>I am a Junior (Search)</button>
            <button className="nav-btn" onClick={() => setUser({ role: 'alumni' })}>I am an Alumnus (Register)</button>
            <button className="admin-btn-link" style={{ marginTop: '20px', background: 'none', border: 'none', color: 'gray', cursor: 'pointer' }} 
              onClick={async () => {
                const pass = prompt("Admin Password:");
                if (pass === "admin123") {
                  const res = await fetch('/api/get-pending');
                  setPendingList(await res.json());
                  setUser({ role: 'admin' });
                }
            }}>Admin Login</button>
          </div>
        ) : (
          <div>
            <button onClick={() => { setUser(null); setSelectedCoords(null); }} style={{ marginBottom: '20px' }}>← Back</button>
            
            {/* ADMIN VIEW */}
            {user.role === 'admin' && (
              <div>
                <h3>Pending Approvals</h3>
                {pendingList.length === 0 ? <p>No pending requests.</p> : 
                  pendingList.map(item => (
                    <div key={item._id} style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '10px', borderRadius: '8px' }}>
                      <strong>Name:</strong> {item.name}<br/>
                      <strong>Company:</strong> {item.company}<br/>
                      <button className="approve-btn" onClick={async () => {
                        await fetch(`/api/approve-alumni/${item._id}`, { method: 'PATCH' });
                        setPendingList(pendingList.filter(p => p._id !== item._id));
                        fetchAlumni(); // Refresh the map
                      }}>Approve User</button>
                    </div>
                  ))
                }
              </div>
            )}

            {/* JUNIOR VIEW */}
            {user.role === 'junior' && (
              <div>
                <h3>Search Directory</h3>
                <input 
                  className="search-input"
                  placeholder="Search by name or company..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  style={{ width: '100%', padding: '10px', marginBottom: '20px' }}
                />
                <div className="alumni-list">
                    {filteredAlumni.map(a => (
                        <div key={a._id} style={{ padding: '5px 0', borderBottom: '1px solid #eee' }}>
                            <strong>{a.name}</strong> - {a.company}
                        </div>
                    ))}
                </div>
              </div>
            )}

            {/* ALUMNI VIEW */}
            {user.role === 'alumni' && (
              <div>
                <h3>Register as Alumni</h3>
                <p style={{ fontSize: '0.8rem', color: '#666' }}>1. Fill details<br/>2. Click your location on the map</p>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input required placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  <input required placeholder="Current Company" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
                  <div style={{ padding: '10px', background: selectedCoords ? '#e6fffa' : '#fff5f5', borderRadius: '5px', fontSize: '0.9rem' }}>
                    {selectedCoords ? `📍 Location Selected: ${selectedCoords[0].toFixed(4)}, ${selectedCoords[1].toFixed(4)}` : "❌ No location selected"}
                  </div>
                  <button type="submit" className="submit-btn" disabled={!selectedCoords}>Submit Registration</button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MAP SECTION */}
      <div style={{ flexGrow: 1, position: 'relative' }}>
        <MapContainer center={[26.2389, 73.0243]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {/* Only show picker when in Alumni registration mode */}
          {user?.role === 'alumni' && <LocationPicker setCoords={setSelectedCoords} />}
          
          {/* Show a temporary marker for the newly picked location */}
          {selectedCoords && (
            <Marker position={selectedCoords}>
              <Popup>Your Selected Location</Popup>
            </Marker>
          )}

          {/* Show all verified alumni */}
          {filteredAlumni.map(alumni => (
            <Marker key={alumni._id} position={[alumni.location.coordinates[1], alumni.location.coordinates[0]]}>
              <Popup>
                <div style={{ textAlign: 'center' }}>
                    <strong>{alumni.name}</strong><br/>
                    <span>{alumni.company}</span>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

export default App;