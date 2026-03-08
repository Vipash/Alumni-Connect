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
  const [loginStatus, setLoginStatus] = useState(null); // null, 'pending', 'approved'
  const [loggedInUser, setLoggedInUser] = useState(null); // Stores { name: '...' }
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

const handleLogin = async (e) => {
  e.preventDefault();
  const email = e.target.email.value;
  const password = e.target.password.value;

  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (res.ok) {
    const data = await res.json();
    setLoggedInUser(data);
    setLoginStatus(data.isVerified ? 'approved' : 'pending');
  } else {
    // Better user feedback
    const errorText = await res.text();
    alert(errorText || "Login failed. Check your credentials.");
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
  {/* 1. HOME VIEW */}
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

  {/* 2. LOGIN VIEW */}
  {(view === 'login-student' || view === 'login-alumni') && (
    <div className="login-container">
      {loginStatus === null ? (
        <form onSubmit={handleLogin}>
          <button type="button" className="back-btn" onClick={() => setView('home')}>← Back</button>
          <h2>{view === 'login-student' ? 'Student' : 'Alumni'} Sign In</h2>
          <label>Email</label>
          <input name="email" type="email" required />
          <label>Password</label>
          <input name="password" type="password" required />
          <button type="submit" className="submit-btn">Sign In</button>
        </form>
      ) : (
        <div className="status-message">
          <h2>{loginStatus === 'pending' ? 'Verification Pending' : `Welcome, ${loggedInUser.name}!`}</h2>
          <button className="back-btn" onClick={() => { setLoginStatus(null); setView('home'); }}>Back to Home</button>
        </div>
      )}
    </div>
  )}
  
{/* 3. REGISTRATION VIEW */}
  {(view === 'reg-alumni' || view === 'reg-student') && (
    <form onSubmit={handleSubmit} className="registration-form">
      <button type="button" className="back-btn" onClick={() => setView('home')}>← Back</button>
      <h2>{view === 'reg-alumni' ? 'Alumni' : 'Student'} Registration</h2>

    {/* --- SECTION 1: PERSONAL INFORMATION --- */}
    <h3>Personal Information</h3>
    <label>Full Name</label>
    <input placeholder="Enter your full name" value={formData.name} required onChange={e => setFormData({...formData, name: e.target.value})} />

    <label>Branch</label>
    <input placeholder="e.g. Computer Science" value={formData.branch} required onChange={e => setFormData({...formData, branch: e.target.value})} />

    <label>Passout Year</label>
    <input placeholder="e.g. 2026" type="number" value={formData.passoutYear} required onChange={e => setFormData({...formData, passoutYear: e.target.value})} />

    {view === 'reg-student' && (
      <>
        <label>Roll Number</label>
        <input placeholder="e.g. 23UCSE4050" value={formData.rollNumber} required onChange={e => setFormData({...formData, rollNumber: e.target.value})} />
      </>
    )}

    {view === 'reg-alumni' && (
      <>
        <label>Current Company</label>
        <input placeholder="Where do you work?" value={formData.company} required onChange={e => setFormData({...formData, company: e.target.value})} />
        <label>Location</label>
        <button type="button" className="location-btn" onClick={() => setView('picker')}>
          {selectedCoords ? "Location Picked ✅" : "Click to Pin Location on Map"}
        </button>
      </>
    )}

    <hr />

    {/* --- SECTION 2: CONTACT DETAILS --- */}
    <h3>Contact Details</h3>
    <p className="privacy-note">* Contact details are private and only viewable by verified users.</p>
    
    <label>Email Address</label>
    <input placeholder="example@mbm.edu" value={formData.email} type="email" required onChange={e => setFormData({...formData, email: e.target.value})} />

    <label>Mobile Number</label>
    <input placeholder="e.g. 8824299517" type="tel" pattern="[0-9]{10}" required value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />

    <hr />

    {/* --- SECTION 3: ACCOUNT INFORMATION --- */}
    <h3>Account Information</h3>
    <label>Display Name</label>
    <input placeholder="e.g. Vipss" value={formData.displayName} required onChange={e => setFormData({...formData, displayName: e.target.value})} />

    <label>Password</label>
    <input placeholder="Create a secure password" type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />

    {/* The button is now at the very bottom, inside the flow of the form */}
    <button type="submit" className="submit-btn">Complete Registration</button>
  </form>
)}

{/* Admin Dashboard (Separate Modal) */}
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