import { useState, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import LocationPicker from './LocationPicker';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import AdminDashboard from './AdminDashboard';
import Profile from './Profile';
import MapSearchSection from './MapSearchSection';
import AnnouncementsSection from './AnnouncementsSection';
import Inbox from './Inbox';
import ConnectHub from './ConnectHub';
import AuthHome from './AuthHome';

// Fix for Leaflet Icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

function App() {
  const [view, setView] = useState('home'); 
  const [loggedInUser, setLoggedInUser] = useState(() => {
  const saved = localStorage.getItem('user');
  return saved ? JSON.parse(saved) : null;
});
const [loginStatus, setLoginStatus] = useState(() => {
  const saved = localStorage.getItem('user');
  if (!saved) return null;
  const parsed = JSON.parse(saved);
  return parsed.isVerified ? 'approved' : 'pending';
}); 
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({ 
    name: '', email: '', role: '', branch: '', passoutYear: '', 
    rollNumber: '', company: '', mobile: '', password: '', displayName: ''
  });
  const handleLogout = () => {
  localStorage.removeItem('user'); // 1. Clear the data
  setLoggedInUser(null);           // 2. Clear state
  setLoginStatus(null);           // 3. Reset status
  setView('home');                // 4. Go back to home
  // window.location.reload();    // Optional, but the states above handle it
};
  
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
      localStorage.setItem('user', JSON.stringify(data));
      setLoggedInUser(data);
      setLoginStatus(data.isVerified ? 'approved' : 'pending');
      setActiveTab('profile');
    } else { alert("Login failed."); }
  };

  const handleAdminLogin = () => {
  setView('admin-dash');
};

  const [unreadCount, setUnreadCount] = useState(0);

// Fetch unread count on load and periodically
useEffect(() => {
  if (loggedInUser) { // Changed from 'user' to 'loggedInUser'
    fetch(`/api/notifications/${loggedInUser._id}`) // Changed from 'user' to 'loggedInUser'
      .then(res => res.json())
      .then(data => {
        const unread = data.filter(n => !n.read).length;
        setUnreadCount(unread);
      });
  }
}, [loggedInUser, activeTab]); // Changed from 'user' to 'loggedInUser'

const handleInboxClick = () => {
  setActiveTab('inbox');
  setUnreadCount(0); 
  if (loggedInUser) {
    fetch(`/api/notifications/${loggedInUser._id}/mark-all-read`, { method: 'PATCH' });
  }
};

const [isMapOpen, setIsMapOpen] = useState(false);

useEffect(() => {
  if (isMapOpen) {
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 200);
  }
}, [isMapOpen]);

const downloadMagazine = () => {
    const link = document.createElement('a');
    link.href = '/sfdsj.pdf'; 
    link.download = 'MBM_Alumni_Connect_Magazine.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    case 'connect':
      content = <ConnectHub user={loggedInUser} />;
      break;
    case 'inbox':
        return <Inbox user={loggedInUser} setUser={setLoggedInUser} />;
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
      {/* 1. DASHBOARD VIEW (Logged In) */}
      {loginStatus === 'approved' ? (
        <div className="workspace-layout">
          <aside className="sidebar">
            <div className="sidebar-header-brand">
              <img src="/MBM_Logo.png" alt="University Logo" className="sidebar-logo" />
              <h2 className="brand-text">Alumni Connect</h2>
              <p>Welcome, <strong>{loggedInUser?.name}</strong></p>
            </div>
            {loggedInUser?.isProfileComplete ? (
              <nav className="sidebar-nav">
                <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>My Profile</button>
                <button className={activeTab === 'map' ? 'active' : ''} onClick={() => setActiveTab('map')}>Alumni Search</button>
                <button className={activeTab === 'connect' ? 'active' : ''} onClick={() => setActiveTab('connect')}>Connect Hub</button>
                <button className={activeTab === 'inbox' ? 'active' : ''} onClick={handleInboxClick}>Inbox</button>
                <button className={activeTab === 'announcements' ? 'active' : ''} onClick={() => setActiveTab('announcements')}>Announcements</button>
              </nav>
            ) : (
              <div className="onboarding-notice">
                <p>Please complete your profile setup.</p>
              </div>
            )}
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </aside>

          <main className="dashboard-content">
            {!loggedInUser?.isProfileComplete ? (
              <Profile user={loggedInUser} setUser={setLoggedInUser} forceSetup={true} />
            ) : (
              renderTabContent()
            )}
          </main>
        </div>
      ) : view === 'admin-dash' ? (
        <div className="modal-overlay">
          <div className="admin-fullscreen-wrapper">
            <AdminDashboard setView={setView} />
          </div>
        </div>
      ) : view === 'about' || view === 'manual' ? (
          <div className="placeholder-view">
            <nav className="portal-navbar">...</nav> {/* Keep your navbar here so you can go back */}
            <div style={{padding: '100px', textAlign: 'center'}}>
                <h1>{view === 'about' ? 'About Us' : 'Instruction Manual'}</h1>
                <p>This page is currently under construction. Please check back soon!</p>
                <button onClick={() => setView('home')} style={{width: 'auto'}}>Back to Home</button>
            </div>
          </div>
        ) : (
        /* 2. PUBLIC LANDING PAGE (Logged Out) */
      <div className="landing-page-container">
        
        {/* FIXED HEADER: Stays visible for Home, About, and Manual */}
        <div className="fixed-header-group">
          <nav className="portal-navbar">
            <div className="nav-logo">
              <img src="/MBM_Logo.png" alt="Logo" />
              <span>MBM University</span>
            </div>
            <div className="nav-links">
              <button onClick={() => setView('home')}>Home</button>
              <button onClick={() => setView('manual')}>Instruction Manual</button>
              <button onClick={() => setView('about')}>About Us</button>
              <button className="portal-access-btn" onClick={() => setView('login-choice')}>
                Access Portal
              </button>
            </div>
          </nav>

          <div className="news-ticker">
            <div className="ticker-wrap">
              <div className="ticker-item">📢 Next Alumni Meet: December 2026</div>
              <div className="ticker-item">🎓 New Research Wing Inaugurated</div>
              <div className="ticker-item">📰 Latest E-Magazine "MBM Connect" Out Now!</div>
              <div className="ticker-item">✨ 500+ New Placements in Computer Science</div>
            </div>
          </div>
        </div>

        <main className="content-body">
          {view === 'home' && (
            <>
              {/* STATIC HERO: Background, Title, and Logo stay behind */}
              <header className="hero-section fixed-hero">
                <div className="hero-content">
                  <img src="/MBM_Logo.png" alt="Floating Logo" className="floating-logo" />
                  <h1 className="hero-title">MBM ALUMNI CONNECT</h1>
                  <p className="hero-subtitle">Bridging Generations of Excellence</p>
                </div>
                
                {/* EXPLORE SECTION: Now perfectly centered and gold */}
                <div className="explore-container">
                  <p className="explore-text">Explore MBM Alumni Connect</p>
                  <div className="scroll-hint">↓</div>
                </div>
              </header>

              {/* SCROLLING CONTENT: Slides OVER the hero */}
              <section className="portal-info-section">
                <div className="activity-card">
                  <h3>Recent University Activities</h3>
                  <p>Explore the latest updates from the campus...</p>
                  <button className="secondary-btn" style={{width: 'auto'}}>View Gallery</button>
                </div>
                <div className="magazine-outlet">
                  <h3>Alumni E-Magazine</h3>
                  <div className="mag-preview">
                    <p>The "Alumni Association e-Magazine" March 2026 Edition is now live.</p>
                    <button className="primary-btn" onClick={downloadMagazine} style={{width: 'auto'}}>Download PDF</button>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* Placeholder Views with Proper Header context */}
          {(view === 'about' || view === 'manual') && (
            <div className="placeholder-view-container">
              <div className="placeholder-card">
                <h1>{view === 'about' ? 'About Us' : 'Instruction Manual'}</h1>
                <p>This page is currently under construction. Information will be added soon.</p>
                <button className="primary-btn" onClick={() => setView('home')} style={{width: 'auto'}}>Return to Home</button>
              </div>
            </div>
          )}

          {/* AUTH MODAL (POPS UP ON CLICK) */}
          {(view === 'login-choice' || view.startsWith('login-') || view.startsWith('reg-')) && (
            <div className="modal-overlay">
              <div className="modal-box">
                <button className="close-x" onClick={() => setView('home')}>×</button>
                
                {/* Logo shown inside modal only for login/reg steps */}
                {view !== 'home' && (
                   <div className="logo-section" style={{textAlign:'center', marginBottom:'10px'}}>
                     <img src="/MBM_Logo.png" alt="Logo" style={{width:'80px'}} />
                   </div>
                )}

                {view === 'login-choice' && (
                  <AuthHome 
                    onLogin={(role) => setView(`login-${role}`)} 
                    onRegister={(role) => { 
                        setFormData({ ...formData, role: role }); 
                        setView(`reg-${role}`); 
                    }}
                    onAdminLogin={handleAdminLogin}
                  />
                )}

                {(view === 'login-student' || view === 'login-alumni') && (
                  <form onSubmit={handleLogin} className="login-container">
                    <button type="button" onClick={() => setView('login-choice')}>← Back</button>
                    <h2>{view.includes('student') ? 'Student' : 'Alumni'} Sign In</h2>
                    <label>Email</label>
                    <input name="email" type="email" required />
                    <label>Password</label>
                    <input name="password" type="password" required />
                    <button type="submit" className="primary-btn">Sign In</button>
                  </form>
                )}
                {(view === 'reg-alumni' || view === 'reg-student') && (
                  /* Keep your existing registration form code here */
                  <form onSubmit={handleSubmit} className="registration-form">
                    <button type="button" onClick={() => setView('login-choice')}>← Back</button>
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
        <button type="button" className="location-btn" onClick={() => setIsMapOpen(true)}>
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
    <label>Username</label>
    <input placeholder="e.g. Vipss" value={formData.displayName} required onChange={e => setFormData({...formData, displayName: e.target.value})} />

    <label>Password</label>
    <input placeholder="Create a secure password" type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />

    <button type="submit" className="submit-btn">Complete Registration</button>
                  </form>
                )}
                {isMapOpen && (
          <div className="modal-overlay" style={{zIndex: 5000, background: 'rgba(0,0,0,0.7)'}}>
            <div className="modal-box" style={{maxWidth: '800px', width: '90%', height: '500px'}}>
              <button className="close-x" onClick={() => setIsMapOpen(false)}>×</button>
              <h3>Pin Your Location</h3>
              <div style={{height: '100%', marginTop: '10px'}}>
                <MapContainer center={[26.2389, 73.0243]} zoom={13} style={{ height: '350px', borderRadius: '12px' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationPicker 
                    setCoords={setSelectedCoords} 
                    onConfirm={() => setIsMapOpen(false)} 
                  />
                </MapContainer>
                <button className="primary-btn" style={{marginTop: '15px'}} onClick={() => setIsMapOpen(false)}>
                  Confirm Location
                </button>
              </div>
            </div>
          </div>
        )}
              </div>
            </div>
          )}
          </main>
        </div>
      )}
    </div>
  );
}

export default App;