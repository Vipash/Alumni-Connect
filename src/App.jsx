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

function App() {
  const [view, setView] = useState('home'); 
  const [user, setUser] = useState(null);
  const [alumniList, setAlumniList] = useState([]);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [loginStatus, setLoginStatus] = useState(null); 
  const [loggedInUser, setLoggedInUser] = useState(null); 
  const [formData, setFormData] = useState({ 
    name: '', email: '', role: '', branch: '', passoutYear: '', 
    rollNumber: '', degree: '', company: '', bio: '', mobile: '', password: '', displayName: ''
  });
  const [activeTab, setActiveTab] = useState('profile');
  
  useEffect(() => { 
    fetch('/api/get-alumni').then(res => res.json()).then(setAlumniList); 
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      passoutYear: parseInt(formData.passoutYear, 10),
      rollNumber: formData.rollNumber || undefined,
      bio: formData.bio || "No bio provided",
      mobile: formData.mobile || "0000000000",
      location: selectedCoords ? { type: "Point", coordinates: [selectedCoords[1], selectedCoords[0]] } : null 
    };

    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) { 
      alert("Registration submitted!"); 
      setView('home'); 
      setFormData({ name: '', email: '', role: '', branch: '', passoutYear: '', rollNumber: '', degree: '', company: '', bio: '', mobile: '', password: '', displayName: '' });
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
      const errorText = await res.text();
      alert(errorText || "Login failed.");
    }
  };

  const handleAdminLogin = async () => {
    const pass = prompt("Admin Password:");
    if (pass === "admin123") { setUser({ role: 'admin' }); setView('admin-dash'); }
  };

  return (
    <div className="app-root">
      {/* --- SECTION 1: VISITOR VIEW (Not Logged In) --- */}
      {loginStatus !== 'approved' && view !== 'admin-dash' ? (
        <>
          {view === 'home' && <div className="landing-bg"></div>}
          
          <div className={`map-layer ${view === 'picker' ? 'active' : ''}`}>
            <MapContainer center={[26.2389, 73.0243]} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {view === 'picker' && (
                <LocationPicker setCoords={setSelectedCoords} onConfirm={() => setView('reg-alumni')} />
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
                        <h2>Verification Pending</h2>
                        <p>Welcome, {loggedInUser.name}. Your account is awaiting admin approval.</p>
                        <button className="back-btn" onClick={() => { setLoginStatus(null); setView('home'); }}>Back to Home</button>
                      </div>
                    )}
                  </div>
                )}

                {(view === 'reg-alumni' || view === 'reg-student') && (
  <form onSubmit={handleSubmit} className="registration-form">
    <button type="button" className="back-btn" onClick={() => setView('home')}>← Back</button>
    <h2>{view === 'reg-alumni' ? 'Alumni' : 'Student'} Registration</h2>

    <h3>Personal Information</h3>
    <label>Full Name</label>
    <input placeholder="Full Name" value={formData.name} required onChange={e => setFormData({...formData, name: e.target.value})} />
    
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
    <h3>Contact & Account</h3>
    <label>Email Address</label>
    <input placeholder="example@mbm.edu" type="email" value={formData.email} required onChange={e => setFormData({...formData, email: e.target.value})} />
    <label>Mobile Number</label>
    <input placeholder="10-digit number" type="tel" value={formData.mobile} required onChange={e => setFormData({...formData, mobile: e.target.value})} />
    <label>Display Name</label>
    <input placeholder="Public name on profile" value={formData.displayName} required onChange={e => setFormData({...formData, displayName: e.target.value})} />
    <label>Password</label>
    <input placeholder="Secure Password" type="password" value={formData.password} required onChange={e => setFormData({...formData, password: e.target.value})} />
    <button type="submit" className="submit-btn">Complete Registration</button>
  </form>
                )}
              </div>
            </div>
          )}
        </>
      ) : loginStatus === 'approved' ? (
        /* --- SECTION 2: APPROVED USER DASHBOARD --- */
        <div className="workspace-layout">
          <aside className="sidebar">
            <div className="sidebar-header">
              <h2>Alumni Connect</h2>
              <p>Welcome, <strong>{loggedInUser?.name}</strong></p>
            </div>
            <nav className="sidebar-nav">
              <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>My Profile</button>
              <button className={activeTab === 'map' ? 'active' : ''} onClick={() => setActiveTab('map')}>Map Search</button>
              <button className={activeTab === 'chats' ? 'active' : ''} onClick={() => setActiveTab('chats')}>Connections & Chats</button>
              <button className={activeTab === 'inbox' ? 'active' : ''} onClick={() => setActiveTab('inbox')}>Inbox</button>
              <button className={activeTab === 'announcements' ? 'active' : ''} onClick={() => setActiveTab('announcements')}>Announcements</button>
            </nav>
            <button className="logout-btn" onClick={() => window.location.reload()}>Logout</button>
          </aside>

          <main className="dashboard-content">
            {activeTab === 'profile' && <div className="tab-pane"><h2>User Profile Section</h2></div>}
            {activeTab === 'map' && <div className="tab-pane"><h2>Map Search Section</h2></div>}
            {activeTab === 'chats' && <div className="tab-pane"><h2>Chats Section</h2></div>}
            {activeTab === 'inbox' && <div className="tab-pane"><h2>Inbox Section</h2></div>}
            {activeTab === 'announcements' && <div className="tab-pane"><h2>Announcements Section</h2></div>}
          </main>
        </div>
      ) : (
        /* --- SECTION 3: ADMIN DASHBOARD --- */
        <div className="modal-overlay">
          <div className="modal-box admin-modal">
            <AdminDashboard setView={setView} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;