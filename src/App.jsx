import { useState, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import LocationPicker from './LocationPicker';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import AdminDashboard from './AdminDashboard';

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prepare data: convert year to number and clean up empty strings
    const payload = {
      ...formData,
      passoutYear: parseInt(formData.passoutYear, 10),
      // If your backend schema makes these fields required, 
      // ensure they are not sent as "" (empty string)
      rollNumber: formData.rollNumber || undefined,
      bio: formData.bio || "No bio provided",
      mobile: formData.mobile || "0000000000",
      location: selectedCoords ? { type: "Point", coordinates: [selectedCoords[1], selectedCoords[0]] } : null 
    };

    console.log("Sending payload:", payload);

    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) { 
      alert("Registration submitted!"); 
      setView('home'); 
      // Reset form after success
      setFormData({ 
        name: '', email: '', role: '', branch: '', passoutYear: '', 
        rollNumber: '', degree: '', company: '', bio: '', mobile: '', password: '' 
      });
      setSelectedCoords(null);
    } else { 
      const res = await response.text(); 
      alert("Error: " + res); 
    }
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

    {/* Name */}
    <label>Full Name</label>
    <input placeholder="Enter your full name" value={formData.name} required onChange={e => setFormData({...formData, name: e.target.value})} />

    {/* Email */}
    <label>Email Address</label>
    <input placeholder="example@mbm.edu" value={formData.email} type="email" required onChange={e => setFormData({...formData, email: e.target.value})} />

    {/* Password */}
    <label>Password</label>
    <input placeholder="Create a secure password" value={formData.password} type="password" required onChange={e => setFormData({...formData, password: e.target.value})} />

    {/* Branch */}
    <label>Branch</label>
    <input placeholder="e.g. Computer Science" value={formData.branch} required onChange={e => setFormData({...formData, branch: e.target.value})} />

    {/* Passout Year (FIXED: Added this missing field) */}
    <label>Passout / Expected Year</label>
    <input placeholder="e.g. 2026" type="number" value={formData.passoutYear} required onChange={e => setFormData({...formData, passoutYear: e.target.value})} />
    
    {view === 'reg-alumni' && (
      <>
        {/* Company */}
        <label>Current Company</label>
        <input placeholder="Where do you work?" value={formData.company} required onChange={e => setFormData({...formData, company: e.target.value})} />
        
        <label>Location</label>
        <button type="button" onClick={() => setView('picker')}>
          {selectedCoords ? "Location Picked ✅" : "Click to Pin Location on Map"}
        </button>
      </>
    )}
    
    <button type="submit" className="submit-btn">Complete Registration</button>
  </form>
)}
{view === 'admin-dash' && (
  <div className="modal-overlay">
    <div className="modal-box">
      <AdminDashboard setView={setView} />
    </div>
  </div>
)}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;