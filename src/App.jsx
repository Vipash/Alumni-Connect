import { useState, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import LocationPicker from './LocationPicker';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './index.css';
import './App.css';
import './Portal.css';
import './FeatureStrip.css';
import AdminDashboard from './AdminDashboard';
import Profile from './Profile';
import MapSearchSection from './MapSearchSection';
import AnnouncementsSection from './AnnouncementsSection';
import Inbox from './Inbox';
import ConnectHub from './ConnectHub';
import AuthHome from './AuthHome';
import InstructionManual from './InstructionManual';
import AboutUs from './AboutUs';
import SupportModal from './Support';

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

// Public ticker section on landing page
const TickerSection = () => {
  const [liveTickers, setLiveTickers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getTickers = async () => {
      try {
        const response = await fetch('/api/tickers');
        const data = await response.json();
        setLiveTickers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load tickers:', err);
      } finally {
        setLoading(false);
      }
    };

    getTickers();
  }, []);

  if (loading) {
    return (
      <div className="news-ticker">
        <div className="ticker-wrap">
          <div className="ticker-item ticker-placeholder">
            Loading updates...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="news-ticker">
      <div className="ticker-wrap">
        {liveTickers.length > 0 ? (
          liveTickers.map((t) => (
            <div key={t._id} className="ticker-item">
              {t.text}
            </div>
          ))
        ) : (
          <div className="ticker-item">
            Welcome to MBM Alumni Connect!
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  // --- CORE STATE ---
  const [view, setView] = useState('home');
  const [portalStep, setPortalStep] = useState('login-choice');
  const [activeTab, setActiveTab] = useState('profile');
  const [sidebarContent, setSidebarContent] = useState(null);

  const [mapSearchQuery, setMapSearchQuery] = useState('');

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
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hubSearch, setHubSearch] = useState('');
  const [hubCategory, setHubCategory] = useState('All');
  const [announcementSearch, setAnnouncementSearch] = useState('');
  const [announcementSubTab, setAnnouncementSubTab] = useState('post');
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [currentMagPage, setCurrentMagPage] = useState(0); // 0: cover, 1: p1, 2: p2 [cite: 290]
  const [newsData, setNewsData] = useState([]); 
  const [selectedNews, setSelectedNews] = useState(null);

  // Optional: these are not used in App itself; safe to remove if unused
  const [tickers, setTickers] = useState([]);
  const [editingTicker, setEditingTicker] = useState(null);

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

  const [scrollOpacity, setScrollOpacity] = useState(1);
const [hasPopped, setHasPopped] = useState(false);

useEffect(() => {
  const handleScroll = () => {
    const scrollY = window.scrollY;
    const threshold = 500; // Point where hero is fully gone

    // Calculate opacity (1 at top, 0 at threshold)
    const newOpacity = Math.max(0, 1 - scrollY / threshold);
    setScrollOpacity(newOpacity);

    // Trigger the "Pop" when the lower part is fully up
    if (scrollY > threshold && !hasPopped) {
      setHasPopped(true);
    } else if (scrollY < threshold && hasPopped) {
      setHasPopped(false);
    }
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, [hasPopped]);

  // --- MAP SEARCH HANDLER ---
  const handleMapSearch = async () => {
    if (!mapSearchQuery) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          mapSearchQuery
        )}`
      );
      const data = await res.json();
      if (data.length > 0) {
        const { lat, lon } = data[0];
        setSelectedCoords([parseFloat(lat), parseFloat(lon)]);
      } else {
        alert('Location not found.');
      }
    } catch (err) {
      console.error('Search error:', err);
    }
  };

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
      setView('admin-dashboard');
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

    const currentYear = new Date().getFullYear();
    const passoutYear = parseInt(formData.passoutYear, 10);

    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.branch
    ) {
      alert('Please fill in all required fields.');
      return;
    }

    if (
      isNaN(passoutYear) ||
      passoutYear < 1951 ||
      passoutYear > currentYear + 6
    ) {
      alert('Please enter a valid Passout Year (e.g., 1951 - 2030).');
      return;
    }

    if (formData.mobile && !/^\d{10}$/.test(formData.mobile)) {
      alert('Mobile number must be exactly 10 digits.');
      return;
    }

    const payload = {
      ...formData,
      passoutYear,
      mobile: formData.mobile || '0000000000',
      location: selectedCoords
        ? {
            type: 'Point',
            coordinates: [selectedCoords[1], selectedCoords[0]],
          }
        : null,
    };

    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      alert('Registration submitted! Please wait for admin approval.');
      setView('home');
    } else {
      const errorText = await response.text();
      alert('Error: ' + errorText);
    }
  };

const [galleryItems, setGalleryItems] = useState([
  { img: "/assets/campus1.jpg", text: "Welcome to the Historic MBM University Campus." },
  { img: "/assets/event1.jpg", text: "Connecting generations: Highlights from our last Alumni Meet." },
  { img: "/assets/lab1.jpg", text: "Our newly renovated digital library and research wing." }
]);
const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
const [magazineData, setMagazineData] = useState(null); // To store DB magazine URLs

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const response = await fetch('/api/media/home-data');
        const data = await response.json();

        if (Array.isArray(data.gallery) && data.gallery.length > 0) {
          const mapped = data.gallery.map((item) => ({
            img: item.imageUrl,
            title: item.title || '', 
            desc: item.desc || '',
            text: item.desc || item.title || '', 
          }));
          setGalleryItems(mapped);
        }
        
        if (data.magazine) {
          setMagazineData(data.magazine);
        }

        if (Array.isArray(data.news)) {
          setNewsData(data.news);
        }
        
      } catch (err) {
        console.error("Failed to fetch media, using fallbacks.", err);
      }
    };
    fetchMedia();
  }, []);

useEffect(() => {
  if (galleryItems.length <= 1) return; // Don't rotate if only 1 image
  const interval = setInterval(() => {
    setCurrentGalleryIndex((prev) =>
      prev === galleryItems.length - 1 ? 0 : prev + 1
    );
  }, 5000);
  return () => clearInterval(interval);
}, [galleryItems.length]);

  // 1. Add this state at the top with your other states
const [isMagOpen, setIsMagOpen] = useState(false);

// 2. Updated Download Function
const downloadMagazine = () => {
  // Use the Cloudinary URL from the database if it exists, otherwise fallback to local
  const pdfUrl = magazineData?.pdfUrl || '/magazine.pdf';
  
  const link = document.createElement('a');
  link.href = pdfUrl; 
  link.download = 'MBM_Alumni_Connect_Magazine.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  const handleInboxClick = () => {
    setActiveTab('inbox');
    setSidebarContent(null);
    if (!loggedInUser?._id) return;
    fetch(`/api/notifications/${loggedInUser._id}/mark-all-read`, {
      method: 'PATCH',
    }).then(() => setUnreadCount(0));
  };

  // --- EFFECTS ---
  useEffect(() => {
    if (activeTab === 'map' || isMapOpen) {
      const intervals = [50, 200, 500].map((delay) =>
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, delay)
      );
      return () => intervals.forEach((t) => clearTimeout(t));
    }
  }, [activeTab, isMapOpen]);

  useEffect(() => {
    if (loggedInUser?._id) {
      const fetchUnread = () => {
        fetch(`/api/notifications/${loggedInUser._id}`)
          .then((res) => res.json())
          .then((data) => {
            const unread = data.filter((n) => !n.read).length;
            setUnreadCount(unread);
          });
      };
      fetchUnread();
      const interval = setInterval(fetchUnread, 60000);
      return () => clearInterval(interval);
    }
  }, [loggedInUser, activeTab]);

  const handleNext = () => {
    setCurrentGalleryIndex((prev) => (prev === galleryItems.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setCurrentGalleryIndex((prev) => (prev === 0 ? galleryItems.length - 1 : prev - 1));
  };

  // --- DYNAMIC RENDERING LOGIC ---
  const renderLeftPartition = () => {
    if (sidebarContent) return sidebarContent;

    switch (activeTab) {
      case 'connect':
        return null;
      case 'inbox':
        return (
          <div className="alerts-controls">
            <div className="partition-header">
              <h2>My Alerts</h2>
              <span
                className="badge-pill"
                style={{
                  background: unreadCount > 0 ? '#ff3f52' : '#eee',
                  color: unreadCount > 0 ? 'white' : '#666',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                }}
              >
                {unreadCount} New
              </span>
            </div>
            <p
              style={{
                fontSize: '0.85rem',
                color: '#666',
                marginTop: '15px',
              }}
            >
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
            <div className="partition-header">
              <h2>Notices</h2>
            </div>
            <label style={{ marginTop: '20px' }}>Search Announcements</label>
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
            <div className="partition-header">
              <h2>Information</h2>
            </div>
            <p
              style={{
                fontSize: '0.85rem',
                color: '#666',
                marginTop: '10px',
              }}
            >
              Select a tab to see specific tools and filters.
            </p>
          </div>
        );
    }
  };

  const renderTabContent = () => {
    const commonProps = {
      user: loggedInUser,
      setUser: setLoggedInUser,
      setSidebarContent,
    };

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
      case 'support':
        return <SupportModal user={loggedInUser} isTabMode={true} />;
      case 'inbox':
        return (
          <Inbox
            user={loggedInUser}
            setUser={setLoggedInUser}
            searchQuery={hubSearch}
            onNavigateToNotice={(noticeId) => {
              setHubSearch(noticeId);
              setActiveTab('connect');
              setSidebarContent(null);
            }}
          />
        );
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
                <span>
                  {loggedInUser?.role === 'alumni'
                    ? 'Alumni Edition'
                    : 'Student Edition'}
                </span>
              </div>
            </div>
            <div className="nav-right">
              <div className="admin-user-info">
                <p className="u-name">{loggedInUser?.name}</p>
                <p className="u-role">{loggedInUser?.branch}</p>
              </div>
              <button className="nav-logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </header>

          {loggedInUser?.isProfileComplete && (
            <nav className="sub-nav-tabs">
              <button
                className={activeTab === 'profile' ? 'active' : ''}
                onClick={() => {
                  setActiveTab('profile');
                  setSidebarContent(null);
                }}
              >
                My Profile
              </button>
              <button
                className={activeTab === 'map' ? 'active' : ''}
                onClick={() => {
                  setActiveTab('map');
                  setSidebarContent(null);
                }}
              >
                Alumni Search
              </button>
              <button
                className={activeTab === 'connect' ? 'active' : ''}
                onClick={() => {
                  setActiveTab('connect');
                  setHubSearch('');
                  setSidebarContent(null);
                }}
              >
                Connect Hub
              </button>
              <button
                className={activeTab === 'inbox' ? 'active' : ''}
                onClick={handleInboxClick}
              >
                Inbox{' '}
                {unreadCount > 0 && (
                  <span className="unread-badge">{unreadCount}</span>
                )}
              </button>
              <button
                className={activeTab === 'announcements' ? 'active' : ''}
                onClick={() => {
                  setActiveTab('announcements');
                  setSidebarContent(null);
                }}
              >
                Notice Board
              </button>
              <button
                className={activeTab === 'support' ? 'active' : ''}
                onClick={() => {
                  setActiveTab('support');
                  setSidebarContent(null);
                }}
              >
                🛠 Support
              </button>
            </nav>
          )}

          <div className="portal-main-partition">
            <aside className="partition-left">{renderLeftPartition()}</aside>

            <main className="partition-right">
              <div className="tab-render-container">
                {!loggedInUser?.isProfileComplete ? (
                  <Profile
                    user={loggedInUser}
                    setUser={setLoggedInUser}
                    setSidebarContent={setSidebarContent}
                    forceSetup={true}
                  />
                ) : (
                  renderTabContent()
                )}
              </div>
            </main>
          </div>
        </div>
      ) : view === 'admin-dashboard' ? (
        <AdminDashboard
          admin={adminUser}
          setView={setView}
          onLogout={handleLogout}
        />
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
                <button
                  className={view === 'home' ? 'active-nav' : ''}
                  onClick={() => setView('home')}
                >
                  Home
                </button>
                <button
                  className={view === 'manual' ? 'active-nav' : ''}
                  onClick={() => setView('manual')}
                >
                  Instruction Manual
                </button>
                <button
                  className={view === 'about' ? 'active-nav' : ''}
                  onClick={() => setView('about')}
                >
                  About Us
                </button>
                <button
                  className="portal-access-btn"
                  onClick={() => {
                    setPortalStep('login-choice');
                    setView('login-choice');
                  }}
                >
                  Access Portal
                </button>
              </div>
            </nav>

            {/* Dynamic ticker */}
            <TickerSection />
          </div>

          <main className="content-body">
  {(view === 'home' ||
    view === 'login-choice' ||
    view.startsWith('login-') ||
    view.startsWith('reg-')) && (
    <>

      {/* FIXED HERO as background */}
<header
  className="hero-section"
  style={{
    opacity: 0.4 + (scrollOpacity * 0.6),
    position: 'fixed',
    zIndex: 1,
    pointerEvents: scrollOpacity < 0.1 ? 'none' : 'auto',
    top: 0,
    left: 0,
    right: 0,
    height: '100vh',
    backgroundColor: '#000',
    transition: 'opacity 0.1s ease-out'
  }}
>
  {/* Wrap content in a div to scale the logo/text WITHOUT scaling the background image */}
  <div 
    className="hero-content" 
    style={{ 
      textAlign: 'center',
      transform: `scale(${0.95 + (scrollOpacity * 0.05)})`, // Very subtle scale (95% to 100%)
      transition: 'transform 0.1s ease-out'
    }}
  >
    <img
      src="/MBM_Logo.png"
      alt="Logo"
      className="floating-logo"
      style={{ margin: '0 auto 20px auto', display: 'block' }}
    />
    <h1 className="hero-title" style={{ color: '#4c2882', margin: 0 }}>
      MBM ALUMNI CONNECT
    </h1>
    <p className="hero-subtitle" style={{ color: '#333', fontWeight: '500' }}>
      Bridging Generations of Excellence
    </p>
  </div>
</header>

      {/* EVERYTHING that scrolls goes inside this wrapper */}
      <div
        className="scrollable-content-wrapper"
        style={{
          position: 'relative',
          zIndex: 2,
          marginTop: '100vh',
        }}
      >
        <section className={`portal-info-section ${hasPopped ? 'content-pop' : ''}`}>

{/* --- STRIP 1: CAMPUS GALLERY (Updated Alignment) --- */}
<section className="campus-hero-full-width compact">
  {galleryItems.length > 0 ? (
    <div className="campus-hero-stack-container gallery-left-aligned">
      {/* Visual Area (kept on the left, constrained width) */}
      <div className="stack-visual-wrapper" style={{ flex: '0 0 40%' }}>
        <div className="stack-visual-area compact-height">
          {galleryItems.map((item, index) => {
            let position = 'stack-hidden';
            if (index === currentGalleryIndex) position = 'stack-active';
            else if (
              index ===
              (currentGalleryIndex - 1 + galleryItems.length) %
                galleryItems.length
            )
              position = 'stack-prev';
            else if (
              index === (currentGalleryIndex + 1) % galleryItems.length
            )
              position = 'stack-next';

            return (
              <div key={index} className={`stack-card ${position}`}>
                <img src={item.img} alt="Campus" />
              </div>
            );
          })}
        </div>

        <div className="stack-nav-cluster">
          <button onClick={handlePrev} className="stack-icon-btn">
            ❮
          </button>
          <button
            className="view-gallery-btn"
            onClick={() => setIsGalleryOpen(true)}
          >
            View Gallery
          </button>
          <button onClick={handleNext} className="stack-icon-btn">
            ❯
          </button>
        </div>

        <div className="stack-dots">
          {galleryItems.map((_, index) => (
            <span
              key={index}
              className={`stack-dot ${
                index === currentGalleryIndex ? 'active' : ''
              }`}
            />
          ))}
        </div>
      </div>

      {/* Text Area: takes remaining width, left-aligned */}
      <div
        className="stack-text-side"
        style={{ flex: '1', textAlign: 'left', paddingLeft: '5%' }}
      >
        <div
          className="text-content-wrapper"
          style={{ maxWidth: '800px' }}
        >
          <h3 className="section-subtitle">
            {galleryItems[currentGalleryIndex]?.title || 'Highlights'}
          </h3>
          <p className="hero-text-display">
            {galleryItems[currentGalleryIndex]?.desc ||
              galleryItems[currentGalleryIndex]?.text ||
              'Loading Details...'}
          </p>
        </div>
      </div>
    </div>
  ) : (
    <div
      className="loading-placeholder"
      style={{
        color: 'white',
        textAlign: 'center',
        padding: '50px',
      }}
    >
      <p>Loading Campus Highlights...</p>
    </div>
  )}

  {/* MODAL VIEW: Opens when View Gallery is clicked */}
  {isGalleryOpen && (
    <div className="gallery-modal-overlay">
      <div className="gallery-modal-content">
        <button
          className="close-modal"
          onClick={() => setIsGalleryOpen(false)}
        >
          ×
        </button>
        <h2>Campus Gallery</h2>
        <div className="gallery-grid-full">
          {galleryData.map((item, index) => (
            <img
              key={index}
              src={item.imageUrl}
              alt={item.title}
            />
          ))}
        </div>
      </div>
    </div>
  )}
</section>

{/* --- STRIP 2: ALUMNI MAGAZINE (Static Stack Layout) --- */}
<section
  className="campus-hero-full-width magazine-strip"
  style={{ backgroundColor: '#3d2069', padding: '80px 5%' }}
>
  <div className="campus-hero-stack-container reverse-layout">
    {/* Text Area */}
    <div className="stack-text-side">
      <div className="text-content-wrapper">
        <h3
          className="section-subtitle"
          style={{ color: '#d4af37' }}
        >
          E-MAGAZINE
        </h3>
        <h2 style={{ color: '#fff', margin: '10px 0' }}>
          The Alumni Connect
        </h2>
        <p
          className="hero-text-display"
          style={{ color: 'rgba(255,255,255,0.9)' }}
        >
          Explore the latest breakthroughs in research, campus life,
          and student achievements in our monthly digital edition.
        </p>
        <div
          style={{
            marginTop: '30px',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <button
            className="view-gallery-btn"
            style={{
              background: '#d4af37',
              color: '#1a1a1a',
              border: 'none',
            }}
            onClick={() => setIsMagOpen(true)}
          >
            View Online
          </button>
          <button
            className="view-gallery-btn"
            style={{
              background: '#ffffff',
              color: '#3d2069',
              border: 'none',
            }}
            onClick={downloadMagazine}
          >
            Download PDF
          </button>
        </div>
      </div>
    </div>

    {/* Visual Area: Animated Page Stack */}
    <div className="stack-visual-wrapper magazine-preview-wrapper">
      <div className="magazine-visual-stack">
        {[
          magazineData?.coverUrl || '/mag-cover.jpg',
          magazineData?.p1Url || '/mag-page1.jpg',
          magazineData?.p2Url || '/mag-page2.jpg',
        ].map((imgUrl, index) => {
          let stackPosition = 'mag-page-hidden';
          if (index === currentMagPage) {
            stackPosition = 'mag-page page-1';
          } else if (index === (currentMagPage + 1) % 3) {
            stackPosition = 'mag-page page-2';
          } else if (index === (currentMagPage + 2) % 3) {
            stackPosition = 'mag-page page-3';
          }

          return (
            <div key={index} className={stackPosition}>
              <img src={imgUrl} alt={`Page ${index + 1}`} />
              {index === 0 && (
                <div className="mag-badge">New Issue</div>
              )}
            </div>
          );
        })}
      </div>

      {/* FIXED NAVIGATION CONTAINER: outside the stack for visibility */}
      <div className="mag-stack-nav-container">
        <button
          className="stack-icon-btn"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setCurrentMagPage((prev) => (prev === 0 ? 2 : prev - 1));
          }}
        >
          ❮
        </button>
        <button
          className="stack-icon-btn"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setCurrentMagPage((prev) =>
              prev === 2 ? 0 : prev + 1
            );
          }}
        >
          ❯
        </button>
      </div>
    </div>
  </div>

  {/* PDF Viewer Modal */}
  {isMagOpen && (
    <div
      className="mag-modal-overlay"
      onClick={() => setIsMagOpen(false)}
    >
      <div
        className="mag-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="close-mag"
          onClick={() => setIsMagOpen(false)}
        >
          ×
        </button>
        <iframe
          src={`${magazineData?.pdfUrl || '/magazine.pdf'}#toolbar=0`}
          title="Magazine Viewer"
          width="100%"
          height="100%"
        ></iframe>
      </div>
    </div>
  )}
</section>
          {/* --- STRIP 3: CAMPUS NEWS (New Polished Strip) --- */}
<section className="news-strip-wrapper" style={{ backgroundColor: '#2d1a4d', padding: '80px 0' }}>
  <section className="campus-news-section polished">
    <div className="section-header-centered">
      <h3 className="section-subtitle" style={{ color: '#d4af37', textAlign: 'center' }}>LATEST UPDATES</h3>
      <h2 className="section-title" style={{ color: '#fff', textAlign: 'center', marginBottom: '50px' }}>Campus News</h2>
    </div>

    <div className="news-grid-container">
      {newsData.map((item) => {
        // Logic: If content is short, mark it as 'compact' for the grid
        const isShort = item.content.length < 150; 
        
        return (
          <div
            key={item._id}
            className={`news-card-refined ${isShort ? 'compact-news' : 'full-news'}`}
            onClick={() => setSelectedNews(item)}
          >
            <div className="news-img-wrapper-refined">
              <img src={item.imageUrl} alt={item.headline} />
              <div className="news-date-tag">News</div>
            </div>
            <div className="news-info-refined">
              <h4 className="news-headline-refined">{item.headline}</h4>
              <p className="news-excerpt-refined">
                {item.content.substring(0, 120)}...
              </p>
              <span className="read-more-refined">
                Read Full Story <span>→</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>

    {/* Modal logic remains identical but uses updated "refined" classes for UI */}
    {selectedNews && (
      <div className="news-modal-overlay" onClick={() => setSelectedNews(null)}>
        <div className="news-modal-content refined" onClick={(e) => e.stopPropagation()}>
          <button className="close-modal" onClick={() => setSelectedNews(null)}>×</button>
          <img src={selectedNews.imageUrl} alt="News" className="modal-banner" />
          <h2>{selectedNews.headline}</h2>
          <div className="modal-body"><p>{selectedNews.content}</p></div>
        </div>
      </div>
    )}
  </section>
</section>

          <footer className="landing-footer">
            © 2026 MBM University Alumni Association |
            <span
              onClick={() => setIsSupportOpen(true)}
              style={{
                cursor: 'pointer',
                marginLeft: '10px',
                color: '#3498db',
              }}
            >
              Support & Feedback
            </span>
          </footer>
        </section>
      </div>
    </>
  )}

  {view === 'manual' && <InstructionManual setView={setView} />}
  {view === 'about' && <AboutUs setView={setView} />}

  {/* AUTH MODAL */}
  {(view === 'login-choice' ||
    view.startsWith('login-') ||
    view.startsWith('reg-')) && (
    <div className="modal-overlay">
                <div className="modal-box">
                  <button
                    className="close-x"
                    onClick={() => {
                      setView(
                        ['about', 'manual'].includes(view) ? view : 'home'
                      );
                      setPortalStep('login-choice');
                    }}
                  >
                    ×
                  </button>
                  <div
                    className="logo-section"
                    style={{
                      textAlign: 'center',
                      marginBottom: '10px',
                    }}
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
                        setFormData({
                          name: '',
                          email: '',
                          role: role,
                          branch: '',
                          passoutYear: '',
                          rollNumber: '',
                          company: '',
                          mobile: '',
                          password: '',
                          displayName: '',
                        });
                        setSelectedCoords(null);
                        setPortalStep(`reg-${role}`);
                      }}
                      onAdminLogin={handleAdminLogin}
                    />
                  )}

                  {portalStep.startsWith('login-') &&
                    portalStep !== 'login-choice' && (
                      <form
                        onSubmit={handleLogin}
                        className="login-container"
                      >
                        <button
                          type="button"
                          className="back-link-btn"
                          onClick={() => setPortalStep('login-choice')}
                        >
                          ← Back to Selection
                        </button>
                        <h2>
                          {portalStep.includes('student')
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
                    <form
                      onSubmit={handleSubmit}
                      className="registration-form"
                    >
                      <button
                        type="button"
                        className="back-link-btn"
                        onClick={() => setPortalStep('login-choice')}
                      >
                        ← Back
                      </button>
                      <div className="form-header">
                        <h2>
                          {portalStep === 'reg-alumni'
                            ? 'Alumni'
                            : 'Student'}{' '}
                          Registration
                        </h2>
                        <p className="form-subtitle">
                          Please fill in your details to request portal
                          access.
                        </p>
                      </div>

                      <div className="form-group">
                        <label>Full Name</label>
                        <input
                          placeholder="e.g. John Doe"
                          value={formData.name}
                          required
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              name: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
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
                        </div>
                        <div className="form-group">
                          <label>
                            Passout Year{' '}
                            <span style={{ color: 'red' }}>*</span>
                          </label>
                          <input
                            type="number"
                            min="1950"
                            max="2100"
                            placeholder="YYYY"
                            value={formData.passoutYear}
                            required
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                passoutYear: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      {portalStep === 'reg-student' && (
                        <div className="form-group">
                          <label>Roll Number</label>
                          <input
                            placeholder="e.g. 21BECEC001"
                            value={formData.rollNumber}
                            required
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                rollNumber: e.target.value,
                              })
                            }
                          />
                        </div>
                      )}

                      {portalStep === 'reg-alumni' && (
                        <>
                          <div className="form-group">
                            <label>Current Company</label>
                            <input
                              placeholder="e.g. Google, TCS"
                              value={formData.company}
                              required
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  company: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="form-group">
                            <label>Work Location</label>
                            <span className="field-desc">
                              Pin your current city to help students find alumni
                              in their area.
                            </span>
                            <button
                              type="button"
                              className="location-btn"
                              onClick={() => setIsMapOpen(true)}
                            >
                              {selectedCoords
                                ? 'Location Picked ✅'
                                : 'Click to Pin Location on Map'}
                            </button>
                          </div>
                        </>
                      )}

                      <div className="section-divider">
                        <h3>Contact Details</h3>
                        <p className="section-desc">
                          Only verified MBM individuals can view your contact
                          info.
                        </p>
                      </div>

                      <div className="form-group">
                        <label>Email Address</label>
                        <input
                          type="email"
                          placeholder="email@example.com"
                          value={formData.email}
                          required
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              email: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="form-group">
                        <label>Mobile Number</label>
                        <input
                          type="tel"
                          pattern="[0-9]{10}"
                          placeholder="10-digit mobile number"
                          value={formData.mobile}
                          required
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              mobile: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="section-divider">
                        <h3>Account Information</h3>
                        <p className="section-desc">
                          These details will be used for your future logins.
                        </p>
                      </div>

                      <div className="form-group">
                        <label>Username</label>
                        <input
                          placeholder="Choose a display name"
                          value={formData.displayName}
                          required
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              displayName: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="form-group">
                        <label>Password</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={formData.password}
                          required
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              password: e.target.value,
                            })
                          }
                        />
                      </div>

                      <button type="submit" className="submit-btn">
                        Submit for Verification
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* LOCATION PICKER MODAL */}
            {isMapOpen && (
              <div className="location-picker-overlay">
                <div
                  className="modal-box"
                  style={{
                    maxWidth: '800px',
                    width: '95%',
                    height: '650px',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '20px',
                  }}
                >
                  <button
                    className="close-x"
                    onClick={() => setIsMapOpen(false)}
                  >
                    ×
                  </button>
                  <h3 style={{ marginBottom: '15px' }}>
                    Pin Your Current Work Location
                  </h3>

                  <div
                    style={{
                      flex: 1,
                      position: 'relative',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1px solid #eee',
                    }}
                  >
                    <MapContainer
                      center={[26.2389, 73.0243]}
                      zoom={13}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <LocationPicker
                        setCoords={setSelectedCoords}
                        externalCoords={selectedCoords}
                      />
                    </MapContainer>
                  </div>

                  <div
                    className="map-search-footer"
                    style={{
                      marginTop: '15px',
                      display: 'flex',
                      gap: '10px',
                    }}
                  >
                    <input
                      type="text"
                      className="partition-input"
                      style={{ flex: 1, margin: 0 }}
                      placeholder="Search for your city..."
                      value={mapSearchQuery}
                      onChange={(e) => setMapSearchQuery(e.target.value)}
                    />
                    <button
                      type="button"
                      className="primary-btn"
                      style={{ width: 'auto', padding: '0 20px' }}
                      onClick={handleMapSearch}
                    >
                      Search
                    </button>
                  </div>

                  <button
                    className="map-confirm-btn"
                    style={{ marginTop: '10px' }}
                    onClick={() => setIsMapOpen(false)}
                  >
                    Confirm Selected Location
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      )}
      {isSupportOpen && (
        <SupportModal
          user={loggedInUser}
          onClose={() => setIsSupportOpen(false)}
        />
      )}
    </div>
  );
}

export default App;