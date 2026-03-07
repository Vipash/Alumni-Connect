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
  const [pendingList, setPendingList] = useState([]);
  const [formData, setFormData] = useState({ 
    name: '', email: '', role: '', branch: '', passoutYear: '', 
    rollNumber: '', degree: '', company: '', bio: '', mobile: '' 
  });
  const [selectedCoords, setSelectedCoords] = useState(null);

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
      setUser({ role: 'admin' });
      setView('app');
    } else if (pass !== null) { alert("Incorrect password."); }
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Debug: See exactly what we are sending
  console.log("Sending Data:", JSON.stringify({
    ...formData,
    location: selectedCoords ? { type: "Point", coordinates: [selectedCoords[1], selectedCoords[0]] } : null
  }, null, 2));

  if (formData.role === 'alumni' && !selectedCoords) return alert("Pick a location!");
  
  const response = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...formData,
      location: selectedCoords ? { type: "Point", coordinates: [selectedCoords[1], selectedCoords[0]] } : null
    })
  });

  const result = await response.text();
  if (response.ok) {
    alert("Success!");
    setView('landing');
  } else {
    alert("Error: " + result); // This will tell you exactly what the server hates
  }
};

  return (
    <div className="main-wrapper">
      {view === 'landing' ? (
        <div className="landing-overlay">
          <div className="floating-card">
            <h1>MBM Alumni Connect</h1>
            <button className="nav-btn" onClick={() => { setView('app'); setUser({ role: 'register' }); }}>Register / Login</button>
            <button className="admin-btn-link" onClick={handleAdminLogin}>Admin Login</button>
          </div>
        </div>
      ) : (
        <div className="app-container" style={{ display: 'flex', height: '100vh', width: '100vw' }}>
          <div className="sidebar" style={{ width: '350px', padding: '20px', overflowY: 'auto' }}>
            <button onClick={() => { setView('landing'); setUser(null); }}>← Back to Home</button>

            {/* Registration Form */}
            {user?.role === 'register' && (
              <form onSubmit={handleSubmit} className="reg-form">
                <h3>Create Account</h3>
                <select onChange={(e) => setFormData({...formData, role: e.target.value})} required>
                  <option value="">Select Role</option>
                  <option value="student">Student</option>
                  <option value="alumni">Alumnus</option>
                </select>
                <input placeholder="Name" required onChange={e => setFormData({...formData, name: e.target.value})} />
                <input placeholder="Email" type="email" required onChange={e => setFormData({...formData, email: e.target.value})} />
                <input placeholder="Branch" required onChange={e => setFormData({...formData, branch: e.target.value})} />
                <input placeholder="Passout/Expected Year" type="number" required onChange={e => setFormData({...formData, passoutYear: e.target.value})} />
                <input 
  placeholder="Password" 
  type="password" 
  required 
  onChange={e => setFormData({...formData, password: e.target.value})} 
/>
                {formData.role === 'student' && (
                  <>
                    <input placeholder="Roll Number" required onChange={e => setFormData({...formData, rollNumber: e.target.value})} />
                    <input placeholder="Degree" required onChange={e => setFormData({...formData, degree: e.target.value})} />
                  </>
                )}
                {formData.role === 'alumni' && (
                  <>
                    <input placeholder="Company" required onChange={e => setFormData({...formData, company: e.target.value})} />
                    <input placeholder="Mobile" required onChange={e => setFormData({...formData, mobile: e.target.value})} />
                  </>
                )}
                <button type="submit" className="submit-btn">Register</button>
              </form>
            )}

            {/* Admin Dashboard Placeholder */}
            {user?.role === 'admin' && <h3>Admin Dashboard Active</h3>}
          </div>

          {/* Locked Map Logic */}
          {/* Locked Map Logic - Updated to allow registrants to see the map to pick a location */}
<div style={{ flexGrow: 1, position: 'relative' }}>
  {user?.isVerified || user?.role === 'admin' || user?.role === 'register' ? (
    <MapContainer center={[26.2389, 73.0243]} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
      {/* Show picker ONLY if user is in register mode as alumni */}
      {user?.role === 'register' && formData.role === 'alumni' && <LocationPicker setCoords={setSelectedCoords} />}
      
      {/* Show markers ONLY if user is verified or admin */}
      {(user?.isVerified || user?.role === 'admin') && alumniList.map(a => (
        <Marker key={a._id} position={[a.location.coordinates[1], a.location.coordinates[0]]}>
          <Popup>{a.name} - {a.company}</Popup>
        </Marker>
      ))}
    </MapContainer>
  ) : (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h2>Account Pending Verification 🔒</h2>
    </div>
  )}
</div>
        </div>
      )}
    </div>
  );
}

export default App;