import { useState, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import LocationPicker from './LocationPicker';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

// Fix for Leaflet Icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

function App() { // <--- Added the missing opening brace here
  const [view, setView] = useState('home'); 
  const [user, setUser] = useState(null);
  const [alumniList, setAlumniList] = useState([]);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', email: '', role: '', branch: '', passoutYear: '', 
    rollNumber: '', degree: '', company: '', bio: '', mobile: '', password: '' 
  });

  useEffect(() => { fetch('/api/get-alumni').then(res => res.json()).then(setAlumniList); }, []);

  const handleSubmit = async (e) => { // <--- Cleaned up duplicate definition
    e.preventDefault();
    console.log("Submitting this payload:", JSON.stringify(formData));

    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
          ...formData, 
          location: selectedCoords ? { type: "Point", coordinates: [selectedCoords[1], selectedCoords[0]] } : null 
      })
    });
    if (response.ok) { alert("Registration submitted!"); setView('home'); }
    else { const res = await response.text(); alert("Error: " + res); }
  };

  const handleAdminLogin = async () => {
    const pass = prompt("Admin Password:");
    if (pass === "admin123") { setUser({ role: 'admin' }); setView('admin-dash'); }
  };

  return (
    <div className="app-root">
      {view === 'home' && <div className="landing-bg"></div>}
      
      <div className={`map-layer ${view === 'picker' ? 'active' : ''}`}>
        <MapContainer center={[26.2389, 73.0243]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {view === 'picker' && (
            <LocationPicker 
              setCoords={setSelectedCoords} 
              onConfirm={() => setView('reg-alumni')} 
            />
          )}
        </MapContainer>
      </div>

      {view !== 'picker' && (
        <div className="modal-overlay">
          <div className="modal-box">
            {view === 'home' && (
              <>
                <h1>MBM Alumni Connect</h1>
                <h3>Student</h3>
                <button onClick={() => setView('login-student')}>Sign In</button>
                <button onClick={() => { setFormData({...formData, role: 'student'}); setView('reg-student'); }}>Register as Student</button>
                <h3>Alumnus</h3>
                <button onClick={() => setView('login-alumni')}>Sign In</button>
                <button onClick={() => { setFormData({...formData, role: 'alumni'}); setView('reg-alumni'); }}>Register as Alumnus</button>
                <button className="admin-btn" onClick={handleAdminLogin}>Admin Sign In</button>
              </>
            )}

            {(view === 'reg-alumni' || view === 'reg-student') && (
              <form onSubmit={handleSubmit}>
                <button className="back-btn" onClick={() => setView('home')}>← Back</button>
                <h2>{view === 'reg-alumni' ? 'Alumni' : 'Student'} Registration</h2>
                <input placeholder="Name" value={formData.name} required onChange={e => setFormData({...formData, name: e.target.value})} />
                <input placeholder="Email" value={formData.email} type="email" required onChange={e => setFormData({...formData, email: e.target.value})} />
                <input placeholder="Password" value={formData.password} type="password" required onChange={e => setFormData({...formData, password: e.target.value})} />
                <input placeholder="Branch" value={formData.branch} required onChange={e => setFormData({...formData, branch: e.target.value})} />
                <input placeholder="Passout Year" type="number" value={formData.passoutYear} required onChange={e => setFormData({...formData, passoutYear: e.target.value})} />
                
                {view === 'reg-alumni' && (
                  <>
                    <input placeholder="Company" value={formData.company} required onChange={e => setFormData({...formData, company: e.target.value})} />
                    <button type="button" onClick={() => setView('picker')}>Pick Location</button>
                  </>
                )}
                <button type="submit" className="submit-btn">Register</button>
              </form>
            )}
            {view === 'admin-dash' && <h2>Admin Dashboard Active</h2>}
          </div>
        </div>
      )}
    </div>
  );
} // <--- Added the missing closing brace for App()

export default App;