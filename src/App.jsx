import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import LocationPicker from './LocationPicker';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

// Fix for Leaflet Icons in Production
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

function App() {
  const [view, setView] = useState('landing');
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [alumniList, setAlumniList] = useState([]);
  const [formData, setFormData] = useState({ name: '', company: '' });
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [pendingList, setPendingList] = useState([]);

  const fetchAlumni = async () => {
    try {
      const response = await fetch('/api/get-alumni');
      const data = await response.json();
      setAlumniList(data);
    } catch (error) { console.error("Error:", error); }
  };

  useEffect(() => { fetchAlumni(); }, []);

  const handleAdminLogin = async () => {
    const pass = prompt("Admin Password:");
    if (pass === "admin123") {
      const res = await fetch('/api/get-pending');
      setPendingList(await res.json());
      setUser({ role: 'admin' });
      setView('app'); // Switch to app view
    } else if (pass !== null) { alert("Incorrect password."); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCoords) return alert("Select location on map!");
    await fetch('/api/add-alumni', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: formData.name, company: formData.company, location: { type: "Point", coordinates: [selectedCoords[1], selectedCoords[0]] } })
    });
    alert("Submitted for approval!");
    setView('landing'); // Return to landing
  };

 return (
    <div className="main-wrapper">
      {view === 'landing' ? (
        <div className="landing-overlay">
          <div className="floating-card">
            <img src="/MBM_Logo.png" alt="Logo" style={{ width: '120px', margin: '0 auto 20px' }} />
            <h1>Alumni Connect</h1>
            <button className="nav-btn" onClick={() => { setView('app'); setUser({ role: 'student' }); }}>Student (Search)</button>
            <button className="nav-btn" onClick={() => { setView('app'); setUser({ role: 'alumni' }); }}>Alumni (Register)</button>
            <button className="admin-btn-link" onClick={handleAdminLogin}>Admin Login</button>
          </div>
        </div>
      ) : (
        <div className="app-container" style={{ display: 'flex', height: '100vh', width: '100vw' }}>
          <div className="sidebar" style={{ width: '350px', padding: '20px', overflowY: 'auto' }}>
            <button onClick={() => { setView('landing'); setUser(null); }}>← Back to Home</button>
            
            {/* ADMIN VIEW */}
            {user?.role === 'admin' && (
              <div>
                <h3>Pending Approvals</h3>
                {pendingList.map(item => (
                  <div key={item._id} className="admin-card">
                    <strong>{item.name}</strong><br/>{item.company}<br/>
                    <button className="approve-btn" onClick={async () => { await fetch(`/api/approve-alumni/${item._id}`, { method: 'PATCH' }); setPendingList(pendingList.filter(p => p._id !== item._id)); fetchAlumni(); }}>Approve</button>
                  </div>
                ))}
                <h3>Manage Alumni</h3>
                {alumniList.map(item => (
                  <div key={item._id} className="admin-card" style={{borderColor: '#d90429'}}>
                    <strong>{item.name}</strong><br/>{item.company}<br/>
                    <button className="approve-btn" style={{ background: '#d90429', color: 'white' }} 
  onClick={async () => {
    if(window.confirm("Are you sure you want to delete this pin?")) {
      const res = await fetch(`/api/delete-alumni/${item._id}`, { method: 'DELETE' });
      if (res.ok) {
        // Update the list immediately in the UI without needing a full page reload
        setAlumniList(alumniList.filter(a => a._id !== item._id));
      } else {
        alert("Failed to delete.");
      }
    }
  }}>
  Delete Pin
</button>
                  </div>
                ))}
              </div>
            )}
            
            {/* STUDENT VIEW */}
            {user?.role === 'student' && (
              <div>
                <h3>Search Directory</h3>
                <input placeholder="Search name or company..." onChange={e => setSearchTerm(e.target.value)} />
                {alumniList.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase())).map(a => (
                  <div key={a._id} className="admin-card"><strong>{a.name}</strong><br/>{a.company}</div>
                ))}
              </div>
            )}
            
            {/* ALUMNI VIEW */}
            {user?.role === 'alumni' && (
              <form onSubmit={handleSubmit}>
                <input required placeholder="Name" onChange={e => setFormData({...formData, name: e.target.value})} />
                <input required placeholder="Company" onChange={e => setFormData({...formData, company: e.target.value})} />
                <button type="submit" className="submit-btn">Submit</button>
              </form>
            )}
          </div>
        {/* Map Section */}
          <div style={{ flexGrow: 1, position: 'relative' }}>
            <MapContainer center={[26.2389, 73.0243]} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {user?.role === 'alumni' && <LocationPicker setCoords={setSelectedCoords} />}
              {selectedCoords && <Marker position={selectedCoords}><Popup>Selected Location</Popup></Marker>}
              {alumniList.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase())).map(a => (
                <Marker key={a._id} position={[a.location.coordinates[1], a.location.coordinates[0]]}>
                  <Popup><strong>{a.name}</strong><br/>{a.company}</Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div> // This closes the app-container
      )}
    </div> // This closes the main-wrapper
  );
}

export default App;