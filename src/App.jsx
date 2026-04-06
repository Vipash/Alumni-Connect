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
  const [view, setView] = useState('home');
  const [isPortalOpen, setIsPortalOpen] = useState(false);
  const [portalStep, setPortalStep] = useState('login-choice');
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

const handleAdminLogin = async (e) => {
  e.preventDefault();
  const username = e.target.adminUsername?.value; // Note: Ensure your AuthHome input has name="adminUsername"
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

  const [selectedCoords, setSelectedCoords] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    branch: '',
    passoutYear: '',
    rollNumber: '',
    company: '',
    mobile: '',
    password: '',
    displayName: '',
  });

  const handleLogout = () => {
  localStorage.clear(); // Safest way to ensure no old IDs stay behind
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
      rollNumber: formData.rollNumber || undefined,
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

  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarContent, setSidebarContent] = useState(null);

  useEffect(() => {
  if (activeTab === 'map') {
    // Small delay to ensure the DOM has updated and flexbox has calculated
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300); 
    return () => clearTimeout(timer);
  }
}, [activeTab]);

  // Fetch unread count on load and periodically
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

  const handleInboxClick = () => {
    setActiveTab('inbox');
    setUnreadCount(0);
    if (loggedInUser) {
      fetch(`/api/notifications/${loggedInUser._id}/mark-all-read`, {
        method: 'PATCH',
      });
    }
  };

  const [isMapOpen, setIsMapOpen] = useState(false);

 useEffect(() => {
  if (activeTab === 'map' || isMapOpen) {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 400);
    return () => clearTimeout(timer);
  }
}, [activeTab, isMapOpen, loginStatus]);

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
        content = <Profile user={loggedInUser} setUser={setLoggedInUser} setSidebarContent={setSidebarContent} />;
        break;
      case 'map':
        content = <MapSearchSection setSidebarContent={setSidebarContent} />;
        break;
      case 'connect':
        content = <ConnectHub user={loggedInUser} />;
        break;
      case 'inbox':
        content = <Inbox user={loggedInUser} setUser={setLoggedInUser} />;
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
      {/* 1. DASHBOARD VIEW (Logged In) */}
{loginStatus === 'approved' ? (
  <div className="portal-layout-root">
    {/* --- ROW 1: TOP BRANDING BAR --- */}
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

    {/* --- ROW 2: SUB-NAV TAB BAR --- */}
    {loggedInUser?.isProfileComplete && (
      <nav className="sub-nav-tabs">
        <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>My Profile</button>
        <button className={activeTab === 'map' ? 'active' : ''} onClick={() => setActiveTab('map')}>Alumni Search</button>
        <button className={activeTab === 'connect' ? 'active' : ''} onClick={() => setActiveTab('connect')}>Connect Hub</button>
        <button className={activeTab === 'inbox' ? 'active' : ''} onClick={handleInboxClick}>
          Inbox {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
        </button>
        <button className={activeTab === 'announcements' ? 'active' : ''} onClick={() => setActiveTab('announcements')}>Notice Board</button>
      </nav>
    )}

    {/* --- MAIN BODY: THE TWO-PART PARTITION --- */}
    <div className="portal-main-partition">
      
      {/* LEFT PARTITION: Integrated Search & Controls */}
      <aside className="partition-left">
  {/* If Profile (or any other tab) has sent custom content, show it. 
      Otherwise, show the standard headers and filters. */}
  {sidebarContent ? (
    sidebarContent
  ) : (
    <>
      <div className="partition-header">
        <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
        <p className="subtitle">Filters & Tools</p>
      </div>

      <div className="partition-controls">
        {activeTab === 'map' && (
          <div className="search-box-group">
            <label>Name or Company</label>
            <input type="text" placeholder="Search..." className="partition-input" />
            <label>Branch</label>
            <select className="partition-input"><option>All Branches</option></select>
            <label>Batch Year</label>
            <input type="number" placeholder="2024" className="partition-input" />
            <button className="apply-filter-btn">Search Map</button>
          </div>
        )}

        {activeTab === 'connect' && (
          <div className="search-box-group">
            <label>Job Search</label>
            <input type="text" placeholder="Keywords..." className="partition-input" />
            <label>Category</label>
            <select className="partition-input">
              <option>Full-Time</option>
              <option>Internship</option>
            </select>
            <button className="apply-filter-btn">Filter Hub</button>
          </div>
        )}

        {/* Note: I removed the static 'profile' hint box from here 
            because Profile.jsx will now handle its own sidebar via state */}

        {activeTab === 'inbox' && (
          <div className="sidebar-hint-box">
            <p>You have {unreadCount} new messages.</p>
          </div>
        )}
      </div>
    </>
  )}
</aside>

      {/* RIGHT PARTITION: The View (Map/Content) */}
      <main className="partition-right">
  <div className="tab-render-container">
    {!loggedInUser?.isProfileComplete ? (
      <Profile 
        user={loggedInUser} 
        setUser={setLoggedInUser} 
        setSidebarContent={setSidebarContent} // Add this
        forceSetup={true} 
      />
    ) : (
      renderTabContent()
    )}
  </div>
</main>
    </div>
  </div>
) : view === 'admin-dash' ? (
      <AdminDashboard 
        admin={adminUser} 
        setView={setView} 
        onLogout={handleLogout}
      />
    ) : (
        /* 2. PUBLIC LANDING PAGE (Logged Out) */
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
        
        {/* Update: Just open the portal, don't change the main 'view' */}
        <button 
          className="portal-access-btn" 
          onClick={() => {
            setPortalStep('login-choice'); 
            setView('login-choice'); // This triggers the modal visibility in your JSX logic
          }}
        >
          Access Portal
        </button>
      </div>
    </nav>

            <div className="news-ticker">
              <div className="ticker-wrap">
                <div className="ticker-item">
                  📢 Next Alumni Meet: December 2026
                </div>
                <div className="ticker-item">
                  🎓 New Research Wing Inaugurated
                </div>
                <div className="ticker-item">
                  📰 Latest E-Magazine "MBM Connect" Out Now!
                </div>
                <div className="ticker-item">
                  ✨ 500+ New Placements in Computer Science
                </div>
              </div>
            </div>
          </div>

          <main className="content-body">
            {/* VIEW: HOME */}
            {(view === 'home' || view === 'login-choice' || view.startsWith('login-') || view.startsWith('reg-')) && (
              <>
                <header className="hero-section">
                  <div className="hero-content">
                    <img
                      src="/MBM_Logo.png"
                      alt="Floating Logo"
                      className="floating-logo"
                    />
                    <h1 className="hero-title">MBM ALUMNI CONNECT</h1>
                    <p className="hero-subtitle">
                      Bridging Generations of Excellence
                    </p>
                  </div>
                  <div className="explore-container">
                    <div className="scroll-hint">
                      ↓ Explore MBM Alumni Connect ↓
                    </div>
                  </div>
                </header>

                <section className="portal-info-section">
                  <div className="activity-card">
                    <h3>Recent University Activities</h3>
                    <p>Explore the latest updates from the campus...</p>
                    <button
                      className="secondary-btn"
                      style={{ width: 'auto' }}
                    >
                      View Gallery
                    </button>
                  </div>
                  <div className="magazine-outlet">
                    <h3>Alumni E-Magazine</h3>
                    <div className="mag-preview">
                      <p>
                        The "Alumni Association e-Magazine" March 2026 Edition
                        is now live.
                      </p>
                      <button
                        className="primary-btn"
                        onClick={downloadMagazine}
                        style={{ width: 'auto' }}
                      >
                        Download PDF
                      </button>
                    </div>
                  </div>
                  <footer className="landing-footer">
                    © 2026 MBM University Alumni Association
                  </footer>
                </section>
              </>
            )}

            {view === 'manual' && <InstructionManual setView={setView} />}
            {view === 'about' && <AboutUs setView={setView} />}

            {/* VIEW: AUTH MODAL (Now sits ON TOP of home content instead of replacing it) */}
            {(view === 'login-choice' ||
              view.startsWith('login-') ||
              view.startsWith('reg-')) && (
              <div className="modal-overlay">
                <div className="modal-box">
                  <button
                    className="close-x"
                    onClick={() => {
                      // If the background was 'about', stay on 'about', otherwise go 'home'
                      if (['about', 'manual'].includes(view)) {
                          setView(view); 
                      } else {
                          setView('home');
                      }
                      setPortalStep('login-choice'); // reset for next time
                    }}
                    >
                    ×
                  </button>
                  <div
                    className="logo-section"
                    style={{ textAlign: 'center', marginBottom: '10px' }}
                  >
                    <img
                      src="/MBM_Logo.png"
                      alt="Logo"
                      style={{ width: '80px' }}
                    />
                  </div>

                  {portalStep === 'login-choice' && (
                    <AuthHome
                      onLogin={(role) => setPortalStep(`login-${role}`)}
                      onRegister={(role) => {
                        setFormData({ ...formData, role: role });
                        setPortalStep(`reg-${role}`);
                      }}
                      onAdminLogin={handleAdminLogin}
                    />
                  )}

                  {portalStep.startsWith('login-') && portalStep !== 'login-choice' && (
                    <form onSubmit={handleLogin} className="login-container">
                      <button type="button" onClick={() => setPortalStep('login-choice')}>
                        ← Back
                      </button>
                      <h2>
                        {view.includes('student')
                          ? 'Student'
                          : 'Alumni'}{' '}
                        Sign In
                      </h2>
                      <label>Email</label>
                      <input name="email" type="email" required />
                      <label>Password</label>
                      <input name="password" type="password" required />
                      <button type="submit" className="primary-btn">
                        Sign In
                      </button>
                    </form>
                  )}

                  {portalStep.startsWith('reg-') && (
                    <form onSubmit={handleSubmit} className="registration-form">
                      <button type="button" onClick={() => setPortalStep('login-choice')}>
                        ← Back
                      </button>
                      <h2>
                        {view === 'reg-alumni'
                          ? 'Alumni'
                          : 'Student'}{' '}
                        Registration
                      </h2>

                      {/* --- SECTION 1: PERSONAL INFORMATION --- */}
                      <h3>Personal Information</h3>
                      <label>Full Name</label>
                      <input
                        placeholder="Enter your full name"
                        value={formData.name}
                        required
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            name: e.target.value,
                          })
                        }
                      />

                      <label>Branch</label>
                      <input
                        placeholder="e.g. Computer Science"
                        value={formData.branch}
                        required
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            branch: e.target.value,
                          })
                        }
                      />

                      <label>Passout Year</label>
                      <input
                        placeholder="e.g. 2026"
                        type="number"
                        value={formData.passoutYear}
                        required
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            passoutYear: e.target.value,
                          })
                        }
                      />

                      {view === 'reg-student' && (
                        <>
                          <label>Roll Number</label>
                          <input
                            placeholder="e.g. 23UCSE4050"
                            value={formData.rollNumber}
                            required
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                rollNumber: e.target.value,
                              })
                            }
                          />
                        </>
                      )}

                      {view === 'reg-alumni' && (
                        <>
                          <label>Current Company</label>
                          <input
                            placeholder="Where do you work?"
                            value={formData.company}
                            required
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                company: e.target.value,
                              })
                            }
                          />
                          <label>Location</label>
                          <button
                            type="button"
                            className="location-btn"
                            onClick={() => setIsMapOpen(true)}
                          >
                            {selectedCoords
                              ? 'Location Picked ✅'
                              : 'Click to Pin Location on Map'}
                          </button>
                        </>
                      )}

                      <hr />

                      {/* --- SECTION 2: CONTACT DETAILS --- */}
                      <h3>Contact Details</h3>
                      <p className="privacy-note">
                        * Contact details are private and only viewable by
                        verified users.
                      </p>

                      <label>Email Address</label>
                      <input
                        placeholder="example@mbm.edu"
                        value={formData.email}
                        type="email"
                        required
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            email: e.target.value,
                          })
                        }
                      />

                      <label>Mobile Number</label>
                      <input
                        placeholder="e.g. 8824299517"
                        type="tel"
                        pattern="[0-9]{10}"
                        required
                        value={formData.mobile}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            mobile: e.target.value,
                          })
                        }
                      />

                      <hr />

                      {/* --- SECTION 3: ACCOUNT INFORMATION --- */}
                      <h3>Account Information</h3>
                      <label>Username</label>
                      <input
                        placeholder="e.g. Vipss"
                        value={formData.displayName}
                        required
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            displayName: e.target.value,
                          })
                        }
                      />

                      <label>Password</label>
                      <input
                        placeholder="Create a secure password"
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            password: e.target.value,
                          })
                        }
                      />

                      <button type="submit" className="submit-btn">
                        Complete Registration
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* LOCATION PICKER MODAL */}
            {isMapOpen && (
              <div
                className="modal-overlay"
                style={{ zIndex: 5000, background: 'rgba(0,0,0,0.7)' }}
              >
                <div
                  className="modal-box"
                  style={{
                    maxWidth: '800px',
                    width: '90%',
                    height: '500px',
                  }}
                >
                  <button
                    className="close-x"
                    onClick={() => setIsMapOpen(false)}
                  >
                    ×
                  </button>
                  <h3>Pin Your Location</h3>
                  <div style={{ height: '100%', marginTop: '10px' }}>
                    <MapContainer
                      center={[26.2389, 73.0243]}
                      zoom={13}
                      style={{
                        height: '350px',
                        borderRadius: '12px',
                      }}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <LocationPicker
                        setCoords={setSelectedCoords}
                        onConfirm={() => setIsMapOpen(false)}
                      />
                    </MapContainer>
                    <button
                      className="primary-btn"
                      style={{ marginTop: '15px' }}
                      onClick={() => setIsMapOpen(false)}
                    >
                      Confirm Location
                    </button>
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