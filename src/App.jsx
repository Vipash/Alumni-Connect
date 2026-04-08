import { useState, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import LocationPicker from './LocationPicker';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './index.css';
import './App.css';
import './Portal.css';
import AdminDashboard from './AdminDashboard';
import Profile from './Profile';
import MapSearchSection from './MapSearchSection';
import AnnouncementsSection from './AnnouncementsSection';
import Inbox from './Inbox';
import ConnectHub from './ConnectHub';
import AuthHome from './AuthHome';
import InstructionManual from './InstructionManual';
import AboutUs from './AboutUs';

// Fix for Leaflet Icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

function App() {
  // --- CORE STATE ---
  const [view, setView] = useState('home');
  const [portalStep, setPortalStep] = useState('login-choice');
  const [activeTab, setActiveTab] = useState('profile');
  const [sidebarContent, setSidebarContent] = useState(null);

  // --- AUTH STATE ---
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

  const [adminUser, setAdminUser] = useState(() => {
    const savedAdmin = localStorage.getItem('admin');
    return savedAdmin ? JSON.parse(savedAdmin) : null;
  });

  // --- FEATURE STATES ---
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hubSearch, setHubSearch] = useState('');
  const [hubCategory, setHubCategory] = useState('All');
  const [announcementSearch, setAnnouncementSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '', email: '', role: '', branch: '', passoutYear: '',
    rollNumber: '', company: '', mobile: '', password: '', displayName: '',
  });

  // --- AUTH HANDLERS ---
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    const username = e.target.adminUsername?.value;
    const password = e.target.adminPassword?.value;
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      const data = await res.json(); 
      localStorage.setItem('admin', JSON.stringify(data));
      setAdminUser(data);
      setView('admin-dash');
    } else {
      alert('Invalid Admin Credentials');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: e.target.email.value,
        password: e.target.password.value,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('user', JSON.stringify(data));
      setLoggedInUser(data);
      setLoginStatus(data.isVerified ? 'approved' : 'pending');
      setActiveTab('profile');
    } else {
      alert('Login failed.');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setLoggedInUser(null);
    setAdminUser(null); 
    setLoginStatus(null);
    setView('home');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      passoutYear: parseInt(formData.passoutYear, 10),
      mobile: formData.mobile || '0000000000',
      location: selectedCoords
        ? { type: 'Point', coordinates: [selectedCoords[1], selectedCoords[0]] }
        : null,
    };
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      alert('Registration submitted!');
      setView('home');
    } else {
      alert('Error: ' + (await response.text()));
    }
  };

  // --- UTILS ---
  const downloadMagazine = () => {
    const link = document.createElement('a');
    link.href = '/sfdsj.pdf';
    link.download = 'MBM_Alumni_Connect_Magazine.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleInboxClick = () => {
    setActiveTab('inbox');
    setSidebarContent(null);
    setUnreadCount(0);
    if (loggedInUser) {
      fetch(`/api/notifications/${loggedInUser._id}/mark-all-read`, { method: 'PATCH' });
    }
  };

  // --- EFFECTS ---
  useEffect(() => {
    if (activeTab === 'map' || isMapOpen) {
      const timer = setTimeout(() => window.dispatchEvent(new Event('resize')), 400);
      return () => clearTimeout(timer);
    }
  }, [activeTab, isMapOpen, loginStatus]);

  useEffect(() => {
    if (loggedInUser) {
      fetch(`/api/notifications/${loggedInUser._id}`)
        .then((res) => res.json())
        .then((data) => {
          const unread = data.filter((n) => !n.read).length;
          setUnreadCount(unread);
        });
    }
  }, [loggedInUser, activeTab]);

  // --- DYNAMIC RENDERING LOGIC ---
  const renderLeftPartition = () => {
    // 1. If a component (like Profile or Map) has pushed specific sidebar UI via setSidebarContent
    if (sidebarContent) return sidebarContent;

    // 2. Fallback logic for tabs with standard sidebar fields
    switch (activeTab) {
      case 'connect':
        return (
          <div className="search-box-group">
            <div className="partition-header">
              <h2>Connect Hub</h2>
              <p className="subtitle">Filters & Tools</p>
            </div>
            <label>Job Search</label>
            <input 
              type="text" 
              placeholder="Keywords..." 
              className="partition-input" 
              value={hubSearch}
              onChange={(e) => setHubSearch(e.target.value)}
            />
            <label>Category</label>
            <select 
              className="partition-input"
              value={hubCategory}
              onChange={(e) => setHubCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Full-Time">Full-Time</option>
              <option value="Internship">Internship</option>
              <option value="Project">Project</option>
              <option value="Scholarship">Scholarship</option>
              <option value="Referral">Referral</option>
            </select>
            <button className="apply-filter-btn">Filter Hub</button>
          </div>
        );

      case 'inbox':
        return (
          <div className="alerts-controls">
            <div className="partition-header">
              <h2>My Alerts</h2>
              <span className="badge-pill" style={{ 
                background: unreadCount > 0 ? '#ff3f52' : '#eee', 
                color: unreadCount > 0 ? 'white' : '#666',
                padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem'
              }}>
                {unreadCount} New
              </span>
            </div>
            <p style={{fontSize: '0.85rem', color: '#666', marginTop: '15px'}}>
              Stay updated with messages and portal notifications.
            </p>
            <button 
              className="apply-filter-btn" 
              style={{ width: '100%', marginTop: '20px' }} 
              onClick={handleInboxClick}
              disabled={unreadCount === 0}
            >
              Mark All as Read
            </button>
          </div>
        );

      case 'announcements':
        return (
          <div className="search-box-group">
            <div className="partition-header"><h2>Notices</h2></div>
            <label style={{marginTop: '20px'}}>Search Announcements</label>
            <input 
              type="text" 
              placeholder="Keyword or company..." 
              className="partition-input"
              value={announcementSearch}
              onChange={(e) => setAnnouncementSearch(e.target.value)}
            />
          </div>
        );

      default:
        return (
          <div className="sidebar-hint-box">
            <div className="partition-header"><h2>Information</h2></div>
            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '10px' }}>
              Select a tab to see specific tools and filters.
            </p>
          </div>
        );
    }
  };

  const renderTabContent = () => {
    const commonProps = { user: loggedInUser, setUser: setLoggedInUser, setSidebarContent };
    
    switch (activeTab) {
      case 'profile':
        return <Profile {...commonProps} />;
      case 'map':
        return <MapSearchSection setSidebarContent={setSidebarContent} />;
      case 'connect':
        return (
          <ConnectHub 
            {...commonProps}
            searchQuery={hubSearch}
            setSearchQuery={setHubSearch}
            filterType={hubCategory} 
            setFilterType={setHubCategory} 
          />
        );
      case 'inbox':
        return <Inbox user={loggedInUser} setUser={setLoggedInUser} />;
      case 'announcements':
        return <AnnouncementsSection searchQuery={announcementSearch} />;
      default:
        return <h2>Select a section</h2>;
    }
  };

  return (
    <div className="app-root">
      {loginStatus === 'approved' ? (
        <div className="portal-layout-root">
          <header className="admin-navbar">
            <div className="nav-left">
              <img src="/MBM_Logo.png" alt="Logo" className="nav-logo" />
              <div className="nav-brand">
                <h1>MBM PORTAL</h1>
                <span>{loggedInUser?.role === 'alumni' ? 'Alumni Edition' : 'Student Edition'}</span>
              </div>
            </div>
            <div className="nav-right">
              <div className="admin-user-info">
                <p className="u-name">{loggedInUser?.name}</p>
                <p className="u-role">{loggedInUser?.branch}</p>
              </div>
              <button className="nav-logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </header>

          {loggedInUser?.isProfileComplete && (
            <nav className="sub-nav-tabs">
              <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => {setActiveTab('profile'); setSidebarContent(null);}}>My Profile</button>
              <button className={activeTab === 'map' ? 'active' : ''} onClick={() => {setActiveTab('map'); setSidebarContent(null);}}>Alumni Search</button>
              <button className={activeTab === 'connect' ? 'active' : ''} onClick={() => {setActiveTab('connect'); setSidebarContent(null);}}>Connect Hub</button>
              <button className={activeTab === 'inbox' ? 'active' : ''} onClick={handleInboxClick}>
                Inbox {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
              </button>
              <button className={activeTab === 'announcements' ? 'active' : ''} onClick={() => {setActiveTab('announcements'); setSidebarContent(null);}}>Notice Board</button>
            </nav>
          )}

          <div className="portal-main-partition">
            <aside className="partition-left">
              {renderLeftPartition()}
            </aside>

            <main className="partition-right">
              <div className="tab-render-container">
                {!loggedInUser?.isProfileComplete ? (
                  <Profile user={loggedInUser} setUser={setLoggedInUser} setSidebarContent={setSidebarContent} forceSetup={true} />
                ) : (
                  renderTabContent()
                )}
              </div>
            </main>
          </div>
        </div>
      ) : view === 'admin-dash' ? (
        <AdminDashboard admin={adminUser} setView={setView} onLogout={handleLogout} />
      ) : (
        /* PUBLIC LANDING PAGE */
        <div className="landing-page-container">
          <div className="fixed-header-group">
            <nav className="portal-navbar">
              <div className="nav-logo">
                <img src="/MBM_Logo.png" alt="Logo" />
                <span>MBM University</span>
              </div>
              <div className="nav-links">
                <button className={view === 'home' ? 'active-nav' : ''} onClick={() => setView('home')}>Home</button>
                <button className={view === 'manual' ? 'active-nav' : ''} onClick={() => setView('manual')}>Instruction Manual</button>
                <button className={view === 'about' ? 'active-nav' : ''} onClick={() => setView('about')}>About Us</button>
                <button className="portal-access-btn" onClick={() => { setPortalStep('login-choice'); setView('login-choice'); }}>Access Portal</button>
              </div>
            </nav>
            <div className="news-ticker">
              <div className="ticker-wrap">
                <div className="ticker-item">📢 Next Alumni Meet: December 2026</div>
                <div className="ticker-item">🎓 New Research Wing Inaugurated</div>
                <div className="ticker-item">📰 Latest E-Magazine "MBM Connect" Out Now!</div>
              </div>
            </div>
          </div>

          <main className="content-body">
            {(view === 'home' || view === 'login-choice' || view.startsWith('login-') || view.startsWith('reg-')) && (
              <>
                <header className="hero-section">
                  <div className="hero-content">
                    <img src="/MBM_Logo.png" alt="Floating Logo" className="floating-logo" />
                    <h1 className="hero-title">MBM ALUMNI CONNECT</h1>
                    <p className="hero-subtitle">Bridging Generations of Excellence</p>
                  </div>
                </header>
                <section className="portal-info-section">
                  <div className="activity-card">
                    <h3>Recent University Activities</h3>
                    <p>Explore the latest updates from the campus...</p>
                    <button className="secondary-btn" style={{ width: 'auto' }}>View Gallery</button>
                  </div>
                  <div className="magazine-outlet">
                    <h3>Alumni E-Magazine</h3>
                    <div className="mag-preview">
                      <p>The "Alumni Association e-Magazine" March 2026 Edition is now live.</p>
                      <button className="primary-btn" onClick={downloadMagazine} style={{ width: 'auto' }}>Download PDF</button>
                    </div>
                  </div>
                  <footer className="landing-footer">© 2026 MBM University Alumni Association</footer>
                </section>
              </>
            )}

            {view === 'manual' && <InstructionManual setView={setView} />}
            {view === 'about' && <AboutUs setView={setView} />}

            {/* AUTH MODAL */}
            {(view === 'login-choice' || view.startsWith('login-') || view.startsWith('reg-')) && (
              <div className="modal-overlay">
                <div className="modal-box">
                  <button className="close-x" onClick={() => { setView(['about', 'manual'].includes(view) ? view : 'home'); setPortalStep('login-choice'); }}>×</button>
                  <div className="logo-section" style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <img src="/MBM_Logo.png" alt="Logo" style={{ width: '80px' }} />
                  </div>

                  {portalStep === 'login-choice' && (
                    <AuthHome 
                      onLogin={(role) => setPortalStep(`login-${role}`)} 
                      onRegister={(role) => { setFormData({ ...formData, role: role }); setPortalStep(`reg-${role}`); }} 
                      onAdminLogin={handleAdminLogin} 
                    />
                  )}

                  {portalStep.startsWith('login-') && portalStep !== 'login-choice' && (
                    <form onSubmit={handleLogin} className="login-container">
                      <button type="button" onClick={() => setPortalStep('login-choice')}>← Back</button>
                      <h2>{portalStep.includes('student') ? 'Student' : 'Alumni'} Sign In</h2>
                      <label>Email</label><input name="email" type="email" required />
                      <label>Password</label><input name="password" type="password" required />
                      <button type="submit" className="primary-btn">Sign In</button>
                    </form>
                  )}

                  {portalStep.startsWith('reg-') && (
                    <form onSubmit={handleSubmit} className="registration-form">
                      <button type="button" onClick={() => setPortalStep('login-choice')}>← Back</button>
                      <h2>{portalStep === 'reg-alumni' ? 'Alumni' : 'Student'} Registration</h2>
                      <label>Full Name</label><input value={formData.name} required onChange={(e) => setFormData({...formData, name: e.target.value})} />
                      <label>Branch</label><input value={formData.branch} required onChange={(e) => setFormData({...formData, branch: e.target.value})} />
                      <label>Passout Year</label><input type="number" value={formData.passoutYear} required onChange={(e) => setFormData({...formData, passoutYear: e.target.value})} />
                      {portalStep === 'reg-student' && (
                        <><label>Roll Number</label><input value={formData.rollNumber} required onChange={(e) => setFormData({...formData, rollNumber: e.target.value})} /></>
                      )}
                      {portalStep === 'reg-alumni' && (
                        <>
                          <label>Current Company</label><input value={formData.company} required onChange={(e) => setFormData({...formData, company: e.target.value})} />
                          <label>Location</label>
                          <button type="button" className="location-btn" onClick={() => setIsMapOpen(true)}>
                            {selectedCoords ? 'Location Picked ✅' : 'Click to Pin Location on Map'}
                          </button>
                        </>
                      )}
                      <hr />
                      <h3>Contact Details</h3>
                      <label>Email Address</label><input type="email" value={formData.email} required onChange={(e) => setFormData({...formData, email: e.target.value})} />
                      <label>Mobile Number</label><input type="tel" pattern="[0-9]{10}" value={formData.mobile} required onChange={(e) => setFormData({...formData, mobile: e.target.value})} />
                      <hr />
                      <h3>Account Information</h3>
                      <label>Username</label><input value={formData.displayName} required onChange={(e) => setFormData({...formData, displayName: e.target.value})} />
                      <label>Password</label><input type="password" value={formData.password} required onChange={(e) => setFormData({...formData, password: e.target.value})} />
                      <button type="submit" className="submit-btn">Complete Registration</button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* LOCATION PICKER MODAL */}
            {isMapOpen && (
              <div className="modal-overlay" style={{ zIndex: 5000, background: 'rgba(0,0,0,0.7)' }}>
                <div className="modal-box" style={{ maxWidth: '800px', width: '90%', height: '500px' }}>
                  <button className="close-x" onClick={() => setIsMapOpen(false)}>×</button>
                  <h3>Pin Your Location</h3>
                  <div style={{ height: '100%', marginTop: '10px' }}>
                    <MapContainer center={[26.2389, 73.0243]} zoom={13} style={{ height: '350px', borderRadius: '12px' }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <LocationPicker setCoords={setSelectedCoords} onConfirm={() => setIsMapOpen(false)} />
                    </MapContainer>
                    <button className="primary-btn" style={{ marginTop: '15px' }} onClick={() => setIsMapOpen(false)}>Confirm Location</button>
                  </div>
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