import { useState, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import LocationPicker from './LocationPicker';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import AdminDashboard from './AdminDashboard';
import Profile from './Profile';
import MapSearchSection from './MapSearchSection';
import ChatSection from './ChatSection';
import AnnouncementsSection from './AnnouncementsSection';
import InboxSection from './InboxSection';

// Fix for Leaflet Icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

function App() {
  const [view, setView] = useState('home'); 
  const [loginStatus, setLoginStatus] = useState(null); 
  const [loggedInUser, setLoggedInUser] = useState(null); 
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({ 
    name: '', email: '', role: '', branch: '', passoutYear: '', 
    rollNumber: '', company: '', mobile: '', password: '', displayName: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      passoutYear: parseInt(formData.passoutYear, 10),
      rollNumber: formData.rollNumber || undefined,
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
    } else { alert("Error: " + await response.text()); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: e.target.email.value, password: e.target.password.value })
    });

    if (res.ok) {
      const data = await res.json();
      setLoggedInUser(data);
      setLoginStatus(data.isVerified ? 'approved' : 'pending');
    } else { alert("Login failed."); }
  };

  const handleAdminLogin = () => {
    const pass = prompt("Admin Password:");
    if (pass === "admin123") setView('admin-dash');
  };

const renderTabContent = () => {
  let content; 
  switch (activeTab) {
    case 'profile':
  content = <Profile user={loggedInUser} setUser={setLoggedInUser} />;
  break;
    case 'map':
      content = <MapSearchSection />;
      break;
    case 'chats':
      content = <ChatSection />;
      break;
    case 'inbox':
      content = <InboxSection />; // Ensure this component exists!
      break;
    case 'announcements':
      content = <AnnouncementsSection />;
      break;
    default:
      content = <h2>Select a section</h2>;
  }

  return <div className="tab-pane">{content}</div>;
};
  
  return (
    <div className="app-root">
      {/* 1. DASHBOARD VIEW */}
      {loginStatus === 'approved' ? (
        <div className="workspace-layout">
          <aside className="sidebar">
            <div className="sidebar-header">
              <h2>Alumni Connect</h2>
              <p>Welcome, <strong>{loggedInUser?.name}</strong></p>
            </div>
            <nav className="sidebar-nav">
              <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>My Profile</button>
              <button className={activeTab === 'map' ? 'active' : ''} onClick={() => setActiveTab('map')}>Map Search</button>
              <button className={activeTab === 'chats' ? 'active' : ''} onClick={() => setActiveTab('chats')}>Chats</button>
              <button className={activeTab === 'inbox' ? 'active' : ''} onClick={() => setActiveTab('inbox')}>Inbox</button>
              <button className={activeTab === 'announcements' ? 'active' : ''} onClick={() => setActiveTab('announcements')}>Announcements</button>
            </nav>
            <button className="logout-btn" onClick={() => window.location.reload()}>Logout</button>
          </aside>
          <main className="dashboard-content">
            {renderTabContent()}
          </main>
        </div>
      ) : view === 'admin-dash' ? (
        <div className="modal-overlay">
          <div className="admin-fullscreen-wrapper">
          <AdminDashboard setView={setView} />
          </div>
        </div>
      ) : (
        <>
        <div className="auth-page-wrapper"></div>
          <div className={`map-layer ${view === 'picker' ? 'active' : ''}`}>
            <MapContainer center={[26.2389, 73.0243]} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {view === 'picker' && <LocationPicker setCoords={setSelectedCoords} onConfirm={() => setView('reg-alumni')} />}
            </MapContainer>
          </div>

          {view !== 'picker' && (
            <div className="modal-overlay">
              <div className="modal-box">
                <div className="logo-section" style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <img 
                  src="/MBM_Logo.png"
                  alt="MBM Logo" 
                  style={{ width: '200px', height: 'auto', marginBottom: '5px' }} />
                  </div>
                  {view === 'home' && (
                  <>
                    <h1>MBM Alumni Connect</h1>
                    <h3>Student</h3>
                    <button onClick={() => setView('login-student')}>Sign In</button>
                    <button onClick={() => { setFormData({...formData, role: 'student'}); setView('reg-student'); }}>Register as Student</button>
                    <h3>Alumnus</h3>
                    <button onClick={() => setView('login-alumni')}>Sign In</button>
                    <button onClick={() => { setFormData({...formData, role: 'alumni'}); setView('reg-alumni'); }}>Register as Alumnus</button>
                    <hr />
                    <button className="admin-btn" onClick={handleAdminLogin}>Admin Sign In</button>
                  </>
                )}
                {(view === 'login-student' || view === 'login-alumni') && (
                  <form onSubmit={handleLogin} className="login-container">
                    <button type="button" onClick={() => setView('home')}>← Back</button>
                    <h2>{view === 'login-student' ? 'Student' : 'Alumni'} Sign In</h2>
                    <label>Email</label>
                    <input name="email" type="email" required />
                    <label>Password</label>
                    <input name="password" type="password" required />
                    <button type="submit">Sign In</button>
                  </form>
                )}
                {(view === 'reg-alumni' || view === 'reg-student') && (
                  <form onSubmit={handleSubmit} className="registration-form">
                    <button type="button" onClick={() => setView('home')}>← Back</button>
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

    <button type="submit" className="submit-btn">Complete Registration</button>
                  </form>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;