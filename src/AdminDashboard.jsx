// AdminDashboard.jsx
import { useState, useEffect } from 'react';
import PortalOverview from './PortalOverview';

function AdminDashboard({ admin, setView, onLogout }) {
  // 1. STATE
  const [activeTab, setActiveTab] = useState('overview');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [listData, setListData] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [feedbackFilter, setFeedbackFilter] = useState('registered');
  const [loading, setLoading] = useState(false);
  const [audience, setAudience] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [allAdmins, setAllAdmins] = useState([]);
  const [adminSubTab, setAdminSubTab] = useState('list');
  const [announcementSearch, setAnnouncementSearch] = useState('');

  // Announcements primary mode + subviews
  const [announcementMode, setAnnouncementMode] = useState('announcements'); // 'announcements' | 'tickers'
  const [subView, setSubView] = useState('post'); // 'post' | 'history'

  // Tickers
  const [tickers, setTickers] = useState([]);
  const [editingTicker, setEditingTicker] = useState(null);

  // Media & Magazine Management
  const [existingMedia, setExistingMedia] = useState({ gallery: [], magazine: null });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [mediaTab, setMediaTab] = useState('gallery');
  const [magazineUpload, setMagazineUpload] = useState({
    pdf: null,
    cover: null,
    p1: null,
    p2: null,
  });
  const MAX_IMAGES = 12;

  const [newsList, setNewsList] = useState([]);
  const [newsInput, setNewsInput] = useState({ headline: '', content: '', image: null });
  const [newsUpload, setNewsUpload] = useState({ headline: '', content: '', image: null });
  const [editableNews, setEditableNews] = useState([]);

  // Tab permissions config
  const AVAILABLE_TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'announcements', label: 'Announcements & Tickers' },
    { id: 'alumni', label: 'Alumni Verification' },
    { id: 'students', label: 'Student Verification' },
    { id: 'feedback', label: 'Issues & Feedback' },
    { id: 'logs', label: 'Security Logs' },
    { id: 'media', label: 'Media Management' },
  ];

  const [selectedPerms, setSelectedPerms] = useState(['overview']);

  const togglePermission = (tabId) => {
    setSelectedPerms((prev) =>
      prev.includes(tabId)
        ? prev.filter((p) => p !== tabId)
        : [...prev, tabId]
    );
  };

  const adminData = JSON.parse(localStorage.getItem('admin'));
  const adminId = adminData?._id;

  // 2. HELPERS & API
  const fetchStats = async () => {
    try {
      const res = await fetch('https://alumni-connect-fegi.onrender.com/api/admin/stats', {
        headers: { 'admin-id': adminId }
      });
      if (res.ok) setStats(await res.json());
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  const getApiUrl = () => {
    if (activeTab === 'logs') return '/api/admin/logs';
    if (activeTab === 'announcements' && announcementMode === 'announcements' && subView === 'history') {
      return '/api/announcements';
    }
    const role = activeTab === 'alumni' ? 'alumni' : 'student';
    return `/api/admin/${statusFilter}/${role}`;
  };

  const fetchCurrentList = async () => {
    if (['overview', 'manage-admins', 'feedback', 'media'].includes(activeTab)) return;
    if (activeTab === 'announcements' && !(announcementMode === 'announcements' && subView === 'history')) return;

    setLoading(true);
    try {
      const res = await fetch(getApiUrl(), { headers: { 'admin-id': adminId } });
      const data = await res.json();
      setListData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('List fetch error:', err);
      setListData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingMedia = async () => {
  try {
    const res = await fetch('/api/media/home-data');
    const data = await res.json();
    // Update to store the whole object which contains both 'gallery' and 'magazine'
    setExistingMedia({
      gallery: data.gallery || [],
      magazine: data.magazine || null,
      news: data.news || []
    });
  } catch (err) {
    console.error("Fetch failed", err);
  }
};

  const [editableGallery, setEditableGallery] = useState([]);
  useEffect(() => {
    if (existingMedia.gallery) {
      const sorted = [...existingMedia.gallery].sort((a, b) => (a.order || 0) - (b.order || 0));
    setEditableGallery(sorted);
    }
    if (existingMedia.news) {
    setEditableNews([...existingMedia.news].sort((a, b) => (a.order || 0) - (b.order || 0)));
  }
  }, [existingMedia.gallery]);

  const moveItem = (index, direction) => {
  const newItems = [...editableGallery];
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= newItems.length) return;

  // Swap items
  [newItems[index], newItems[nextIndex]] = [newItems[nextIndex], newItems[index]];
  
  // Re-assign order values based on new index
  const updatedWithOrder = newItems.map((item, idx) => ({ ...item, order: idx }));
  setEditableGallery(updatedWithOrder);
};

const handleGalleryTextChange = (id, field, value) => {
  setEditableGallery(prev => 
    prev.map(item => item._id === id ? { ...item, [field]: value } : item)
  );
};

const saveGalleryChanges = async () => {
  setLoading(true);
  try {
    const res = await fetch('/api/media/gallery/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: editableGallery }),
    });
    if (res.ok) {
      alert("Gallery changes saved!");
      fetchExistingMedia();
    }
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};

  const handleBulkUpload = async () => {
    if (selectedFiles.length === 0) return alert("Select images first");
    if (existingMedia.length + selectedFiles.length > MAX_IMAGES) {
      return alert(`Limit reached. Max ${MAX_IMAGES} images allowed.`);
    }

    setLoading(true);
    try {
      const uploadPromises = Array.from(selectedFiles).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'profile');
        formData.append('cloud_name', 'duoofmsri');

        const cloudRes = await fetch('https://api.cloudinary.com/v1_1/duoofmsri/auto/upload', {
          method: 'POST',
          body: formData,
        });
        const cloudData = await cloudRes.json();

        return fetch('/api/media/gallery-update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: "New Highlight",
            desc: "Campus event",
            imageUrl: cloudData.secure_url,
          }),
        });
      });
      await Promise.all(uploadPromises);
      alert("Gallery Updated!");
      setSelectedFiles([]);
      fetchExistingMedia();
    } catch (err) {
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file) => {
      if (!file) return null;
      const data = new FormData();
      data.append('file', file);
      data.append('upload_preset', 'profile'); // Using your existing preset 
      const res = await fetch('https://api.cloudinary.com/v1_1/duoofmsri/auto/upload', {
        method: 'POST',
        body: data
      });
      const json = await res.json();
      return json.secure_url;
    };

  const handleMagazineSubmit = async () => {
  setLoading(true);
  try {
    // Upload all files first to get their Cloudinary URLs
    const pdfUrl = await uploadFile(magazineUpload.pdf);
    const coverUrl = await uploadFile(magazineUpload.cover);
    const p1Url = await uploadFile(magazineUpload.p1);
    const p2Url = await uploadFile(magazineUpload.p2);

    // Send only the URLs to your backend
    const res = await fetch('/api/media/magazine-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdfUrl, coverUrl, p1Url, p2Url }),
    });

    if (res.ok) alert("Success!");
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};

  const handleDeleteMagazine = async () => {
  if (!window.confirm("Are you sure you want to delete the current magazine issue?")) return;
  try {
    const res = await fetch('/api/media/magazine-delete', { method: 'DELETE' });
    if (res.ok) {
      alert("Magazine issue deleted");
      fetchExistingMedia();
    }
  } catch (err) {
    console.error("Delete failed", err);
  }
};

  const updateMediaData = async (id, fields) => {
    await fetch(`/api/media/gallery/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
  };

  const handleDeleteMedia = async (id) => {
  if (!window.confirm("Are you sure you want to remove this image from the gallery?")) return;

  try {
    const res = await fetch(`/api/media/gallery/${id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      // Update the local state so the image disappears immediately
      setExistingMedia(prev => ({
        ...prev,
        gallery: prev.gallery.filter(item => item._id !== id)
      }));
      alert("Image removed from gallery");
    } else {
      alert("Failed to delete image");
    }
  } catch (err) {
    console.error("Gallery delete error:", err);
  }
};

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/admin/support-tickets');
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Tickets fetch error:', err);
    }
  };

// 1. Upload new news item
const handleNewsSubmit = async () => {
  if (!newsUpload.headline || !newsUpload.image) {
    alert('Headline and Image required');
    return;
  }

  setLoading(true);
  try {
    // Reuse your existing Cloudinary helper, or implement it if missing
    const imageUrl = await uploadFile(newsUpload.image);

    const res = await fetch('/api/media/news-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        headline: newsUpload.headline,
        content: newsUpload.content,
        imageUrl,
      }),
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || 'News publish failed');
    }

    alert('News Published!');
    setNewsUpload({ headline: '', content: '', image: null });
    fetchExistingMedia(); // refresh gallery + news + magazine
  } catch (err) {
    console.error('News upload error:', err);
    alert('Failed to publish news');
  } finally {
    setLoading(false);
  }
};

// 2. Local Reorder for News
const moveNewsItem = (index, direction) => {
  const newItems = [...editableNews];
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= newItems.length) return;

  [newItems[index], newItems[nextIndex]] = [
    newItems[nextIndex],
    newItems[index],
  ];

  // Update local order field so backend can persist it
  setEditableNews(
    newItems.map((item, idx) => ({
      ...item,
      order: idx,
    }))
  );
};

// 3. Save News changes (Titles/Order)
const saveNewsChanges = async () => {
  if (!editableNews.length) {
    alert('No news items to save');
    return;
  }

  setLoading(true);
  try {
    const res = await fetch('/api/media/news/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: editableNews }),
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || 'Reorder failed');
    }

    alert('News sequence saved!');
    fetchExistingMedia();
  } catch (err) {
    console.error('Save news changes error:', err);
    alert('Failed to save news changes');
  } finally {
    setLoading(false);
  }
};

const deleteNewsItem = async (id) => {
  if (!window.confirm("Are you sure you want to delete this news item?")) return;
  
  try {
    const res = await fetch(`/api/media/news/${id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      alert("News item deleted");
      // Refresh the list locally
      setEditableNews(prev => prev.filter(item => item._id !== id));
    } else {
      const errorData = await res.json();
      alert(`Error: ${errorData.error}`);
    }
  } catch (err) {
    console.error("Delete error:", err);
    alert("Failed to delete news item");
  }
};

  const fetchAllAdmins = async () => {
    try {
      const res = await fetch('/api/admin/list', { headers: { 'admin-id': adminId } });
      if (res.ok) setAllAdmins(await res.json());
    } catch (err) {
      console.error('Admin list fetch error:', err);
    }
  };

  const deleteAdmin = async (id) => {
    if (!window.confirm("Remove this admin?")) return;
    const res = await fetch(`/api/admin/delete/${id}`, {
      method: 'DELETE',
      headers: { 'admin-id': adminId },
    });
    if (res.ok) fetchAllAdmins();
  };

  const fetchTickers = async () => {
    try {
      const res = await fetch('https://alumni-connect-fegi.onrender.com/api/admin/tickers', {
        headers: { 'admin-id': adminId }
      });
      if (res.ok) {
        const data = await res.json();
        setTickers(data.sort((a, b) => b.priority - a.priority));
      }
    } catch (err) {
      console.error('Ticker fetch error:', err);
    }
  };

  const handleEditClick = (ticker) => {
    setEditingTicker(ticker);
    setAnnouncementMode('tickers');
    setSubView('post');
  };

  const handleTickerSubmit = async (e) => {
    e.preventDefault();
    if (!editingTicker?.text?.trim()) return alert('Enter ticker text.');

    const url = editingTicker._id
      ? `https://alumni-connect-fegi.onrender.com/api/admin/tickers/${editingTicker._id}`
      : `https://alumni-connect-fegi.onrender.com/api/admin/tickers`;
    const method = editingTicker._id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'admin-id': adminId },
      body: JSON.stringify(editingTicker),
    });

    if (res.ok) {
      alert('Ticker saved!');
      setEditingTicker(null);
      setSubView('history');
      fetchTickers();
    }
  };

  const handleTickerDelete = async (id) => {
    if (!window.confirm('Delete this ticker?')) return;
    const res = await fetch(`https://alumni-connect-fegi.onrender.com/api/admin/tickers/${id}`, {
      method: 'DELETE',
      headers: { 'admin-id': adminId },
    });
    if (res.ok) fetchTickers();
  };

  const handleAction = async (id, action) => {
    if (action === 'delete-announcement') {
      if (!window.confirm('Delete this announcement?')) return;
      const res = await fetch(`/api/admin/announcement/${id}`, { method: 'DELETE' });
      if (res.ok) fetchCurrentList();
      return;
    }
    const confirmMsg = action === 'approve' ? 'Approve user?' : 'Permanently delete?';
    if (!window.confirm(confirmMsg)) return;
    const url = action === 'approve' ? `/api/verify-user/${id}` : `/api/delete-user/${id}`;
    const method = action === 'approve' ? 'PATCH' : 'DELETE';
    const response = await fetch(url, { method });
    if (response.ok) {
      fetchCurrentList();
      fetchStats();
    }
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    const formData = {
      title: e.target.title.value,
      subject: e.target.subject.value,
      content: e.target.content.value,
      targetAudience: audience,
    };
    const response = await fetch('/api/admin/announcement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (response.ok) {
      alert('Posted!');
      e.target.reset();
      setSubView('history');
      fetchCurrentList();
    }
  };

  // 3. DERIVED DATA
  const filteredData = listData.filter((item) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      item.name?.toLowerCase().includes(search) ||
      item.email?.toLowerCase().includes(search) ||
      item.displayName?.toLowerCase().includes(search) ||
      item.alumniName?.toLowerCase().includes(search) ||
      item.title?.toLowerCase().includes(search)
    );
  });

  const filteredAnnouncements = listData.filter((item) => {
    const search = (announcementSearch || '').toLowerCase();
    if (!search) return true;
    return (
      item.title?.toLowerCase().includes(search) ||
      item.subject?.toLowerCase().includes(search)
    );
  });

  const filteredTickets = tickets.filter((t) =>
    feedbackFilter === 'registered' ? t.isRegistered : !t.isRegistered
  );

  // 4. EFFECTS
  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { if (activeTab === 'feedback') fetchTickets(); }, [activeTab]);
  useEffect(() => { fetchCurrentList(); }, [activeTab, statusFilter, announcementMode, subView]);
  useEffect(() => { if (activeTab === 'manage-admins') fetchAllAdmins(); }, [activeTab]);
  useEffect(() => {
    if (activeTab === 'announcements' && announcementMode === 'tickers' && subView === 'history') {
      fetchTickers();
    }
  }, [activeTab, announcementMode, subView]);
  useEffect(() => { if (activeTab === 'media') fetchExistingMedia(); }, [activeTab]);

  const FeedbackView = () => (
    <div className="admin-support-container">
      <div className="content-toolbar">
        <div className="filter-group">
          <button className={feedbackFilter === 'registered' ? 'sel' : ''} onClick={() => setFeedbackFilter('registered')}>Registered</button>
          <button className={feedbackFilter === 'public' ? 'sel' : ''} onClick={() => setFeedbackFilter('public')}>Guest</button>
        </div>
      </div>
      <div className="data-table-container">
        <table className="admin-table">
          <thead><tr><th>Type</th><th>Sender</th><th>Time</th></tr></thead>
          <tbody>
            {filteredTickets.map((t) => (
              <tr key={t._id} onClick={() => setSelectedTicket(t)} style={{ cursor: 'pointer' }} className="hover-row">
                <td><span className={`badge-pill status-${t.type?.toLowerCase() || 'other'}`}>{t.type}</span></td>
                <td><strong>{t.userName || 'Guest'}</strong><br /><small>{t.senderEmail}</small></td>
                <td>{t.createdAt ? new Date(t.createdAt).toLocaleString() : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedTicket && (
        <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Feedback Detail</h3>
            <p><strong>From:</strong> {selectedTicket.userName} ({selectedTicket.senderEmail})</p>
            <div className="message-box"><p>{selectedTicket.message}</p></div>
            <button onClick={() => setSelectedTicket(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );

  const ManageAdmins = () => {
    const [formData, setFormData] = useState({ username: '', password: '', role: 'Moderator' });
    const handleCreate = async (e) => {
      e.preventDefault();
      const res = await fetch('/api/admin/create-new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, creatorRole: admin.role, permissions: selectedPerms }),
      });
      if (res.ok) {
        alert('Admin Created!');
        setFormData({ username: '', password: '', role: 'Moderator' });
        setSelectedPerms(['overview']);
        fetchAllAdmins();
      }
    };

    return (
      <div className="admin-access-container">
        <div className="content-toolbar">
          <div className="filter-group">
            <button
              className={adminSubTab === 'list' ? 'sel' : ''}
              onClick={() => setAdminSubTab('list')}
            >
              Current Admins
            </button>
            <button
              className={adminSubTab === 'create' ? 'sel' : ''}
              onClick={() => setAdminSubTab('create')}
            >
              Add New Admin
            </button>
          </div>
        </div>

        <div className="tab-content-area" style={{ marginTop: '20px' }}>
          {adminSubTab === 'list' ? (
            <div className="data-table-container">
              <h3>System Administrators</h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allAdmins.map((a) => (
                    <tr key={a._id}>
                      <td>{a.username}</td>
                      <td>{a.role}</td>
                      <td>
                        {a.role !== 'GodMode' ? (
                          <button
                            className="delete-btn"
                            onClick={() => deleteAdmin(a._id)}
                          >
                            Revoke Access
                          </button>
                        ) : (
                          <small>Master Account</small>
                        )}
                      </td>
                    </tr>
                  ))}
                  {allAdmins.length === 0 && (
                    <tr>
                      <td
                        colSpan="3"
                        style={{ textAlign: 'center', padding: 16 }}
                      >
                        No admins found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="admin-card-simple">
              <h3>Add New Administrator</h3>
              <form onSubmit={handleCreate} className="admin-form-clean">
                <input
                  required
                  placeholder="Username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                />
                <input
                  required
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                >
                  <option value="Moderator">Moderator</option>
                  <option value="Admin">Admin</option>
                  <option value="GodMode">GodMode</option>
                </select>

                <div className="permissions-container">
                  <h4>Grant Tab Access</h4>
                  <div className="permissions-grid">
                    {AVAILABLE_TABS.map((tab) => (
                      <label
                        key={tab.id}
                        className={`checkbox-label ${
                          selectedPerms.includes(tab.id) ? 'checked' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPerms.includes(tab.id)}
                          onChange={() => togglePermission(tab.id)}
                        />
                        {tab.label}
                      </label>
                    ))}
                  </div>
                </div>

                <button type="submit" className="approve-btn">
                  Create Account
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  };

  // PERMISSIONS
  const canSeeTab = (permissionKey) => {
    if (admin?.role === 'GodMode') return true;
    const perms = admin?.permissions;
    if (!Array.isArray(perms)) return true;
    return perms.includes(permissionKey);
  };

  // 6. RETURN
  return (
    <div className="admin-dashboard-page">
      <nav className="admin-navbar">
        <div className="nav-left">
          <img src="/MBM_Logo.png" alt="Portal Logo" className="nav-logo" />
          <div className="nav-brand">
            <h1>Admin Dashboard</h1>
            <span>MBM Alumni Connect</span>
          </div>
        </div>

        <div className="nav-center">
          {canSeeTab('dashboard') && (
            <button
              className={activeTab === 'overview' ? 'active' : ''}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
          )}

          {canSeeTab('alumni') && (
            <button
              className={activeTab === 'alumni' ? 'active' : ''}
              onClick={() => {
                setActiveTab('alumni');
                setStatusFilter('pending');
              }}
            >
              Alumni
            </button>
          )}

          {canSeeTab('students') && (
            <button
              className={activeTab === 'students' ? 'active' : ''}
              onClick={() => {
                setActiveTab('students');
                setStatusFilter('pending');
              }}
            >
              Students
            </button>
          )}

          {canSeeTab('announcements') && (
            <button
              className={activeTab === 'announcements' ? 'active' : ''}
              onClick={() => {
                setActiveTab('announcements');
                setAnnouncementMode('announcements');
                setSubView('post');
              }}
            >
              Announcements
            </button>
          )}

          {/* Media tab (no permission key yet; add if needed) */}
          <button
            className={activeTab === 'media' ? 'active' : ''}
            onClick={() => setActiveTab('media')}
          >
            Media
          </button>

          {canSeeTab('logs') && (
            <button
              className={activeTab === 'logs' ? 'active' : ''}
              onClick={() => setActiveTab('logs')}
            >
              Security Logs
            </button>
          )}

          {admin?.role === 'GodMode' && (
            <button
              className={activeTab === 'manage-admins' ? 'active' : ''}
              onClick={() => setActiveTab('manage-admins')}
            >
              Admin Access
            </button>
          )}

          {canSeeTab('support') && (
            <button
              className={activeTab === 'feedback' ? 'active' : ''}
              onClick={() => setActiveTab('feedback')}
            >
              Issues & Feedback
            </button>
          )}
        </div>

        <div className="nav-right">
          <div className="admin-user-info">
            <p className="u-name">{admin?.username || 'Admin'}</p>
            <p className="u-role">{admin?.role}</p>
          </div>
          <button className="nav-logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </nav>

      <main className="admin-content-wrapper">
        {/* Toolbar for search + status filters */}
        {['alumni', 'students', 'logs'].includes(activeTab) && (
          <div className="content-toolbar">
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-search-input"
            />
            {['alumni', 'students'].includes(activeTab) && (
              <div className="filter-group">
                <button
                  className={statusFilter === 'pending' ? 'sel' : ''}
                  onClick={() => setStatusFilter('pending')}
                >
                  Pending
                </button>
                <button
                  className={statusFilter === 'verified' ? 'sel' : ''}
                  onClick={() => setStatusFilter('verified')}
                >
                  Verified
                </button>
              </div>
            )}
          </div>
        )}

        {/* Announcements & Tickers */}
        {activeTab === 'announcements' && (
          <div className="nested-tabs-container">
            <div className="content-toolbar main-subtabs">
              <button
                className={announcementMode === 'announcements' ? 'sel' : ''}
                onClick={() => {
                  setAnnouncementMode('announcements');
                  setSubView('post');
                }}
              >
                📣 Announcements System
              </button>
              <button
                className={announcementMode === 'tickers' ? 'sel' : ''}
                onClick={() => {
                  setAnnouncementMode('tickers');
                  setSubView('post');
                }}
              >
                📢 Home Ticker System
              </button>
            </div>

            <div
              className="content-toolbar secondary-subtabs"
              style={{ marginTop: '10px', background: '#f0f0f0' }}
            >
              <button
                className={subView === 'post' ? 'sel' : ''}
                onClick={() => setSubView('post')}
              >
                {announcementMode === 'tickers'
                  ? 'Add New Ticker'
                  : 'Create Post'}
              </button>
              <button
                className={subView === 'history' ? 'sel' : ''}
                onClick={() => {
                  setSubView('history');
                  announcementMode === 'tickers'
                    ? fetchTickers()
                    : fetchCurrentList();
                }}
              >
                {announcementMode === 'tickers'
                  ? 'View & Edit Tickers'
                  : 'Post History'}
              </button>

              {announcementMode === 'announcements' && subView === 'history' && (
                <div className="filter-group">
                  <input
                    type="text"
                    placeholder="Search announcements..."
                    value={announcementSearch}
                    onChange={(e) => setAnnouncementSearch(e.target.value)}
                    className="search-input"
                  />
                </div>
              )}
            </div>

            <div className="tab-content-area" style={{ marginTop: '20px' }}>
              {announcementMode === 'announcements' && subView === 'post' && (
                <div className="admin-card-simple">
                  <form
                    onSubmit={handlePostAnnouncement}
                    className="admin-form-clean"
                  >
                    <input name="title" placeholder="Title" required />
                    <input name="subject" placeholder="Subject" required />
                    <textarea
                      name="content"
                      placeholder="Announcement Content..."
                      rows="4"
                      required
                    />
                    <select
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                    >
                      <option value="all">Everyone</option>
                      <option value="alumni">Alumni Only</option>
                      <option value="students">Students Only</option>
                    </select>
                    <button type="submit" className="approve-btn">
                      Publish
                    </button>
                  </form>
                </div>
              )}

              {announcementMode === 'announcements' && subView === 'history' && (
                <div className="data-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Title</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAnnouncements.map((item) => (
                        <tr key={item._id}>
                          <td>
                            {item.date
                              ? new Date(item.date).toLocaleDateString()
                              : ''}
                          </td>
                          <td>{item.title}</td>
                          <td>
                            <button
                              className="delete-btn"
                              onClick={() =>
                                handleAction(
                                  item._id,
                                  'delete-announcement'
                                )
                              }
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!loading && filteredAnnouncements.length === 0 && (
                        <tr>
                          <td
                            colSpan={3}
                            style={{ textAlign: 'center', padding: '20px' }}
                          >
                            No records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {announcementMode === 'tickers' && subView === 'post' && (
                <div className="admin-card-simple">
                  <h3>
                    {editingTicker?._id
                      ? 'Edit Ticker Message'
                      : 'Add Ticker Message'}
                  </h3>
                  <form
                    onSubmit={handleTickerSubmit}
                    className="admin-form-clean"
                  >
                    <input
                      required
                      placeholder="Ticker Text..."
                      value={editingTicker?.text || ''}
                      onChange={(e) =>
                        setEditingTicker({
                          ...(editingTicker || {}),
                          text: e.target.value,
                          isActive: editingTicker?.isActive ?? true,
                          priority: editingTicker?.priority ?? 0,
                        })
                      }
                    />
                    <div
                      style={{
                        display: 'flex',
                        gap: '15px',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                      }}
                    >
                      <input
                        type="number"
                        placeholder="Priority"
                        style={{ width: '120px' }}
                        value={editingTicker?.priority ?? ''}
                        onChange={(e) =>
                          setEditingTicker({
                            ...(editingTicker || {}),
                            priority: parseInt(e.target.value || '0', 10),
                            text: editingTicker?.text || '',
                            isActive: editingTicker?.isActive ?? true,
                          })
                        }
                      />
                      <label>
                        <input
                          type="checkbox"
                          checked={editingTicker?.isActive ?? true}
                          onChange={(e) =>
                            setEditingTicker({
                              ...(editingTicker || {}),
                              isActive: e.target.checked,
                              text: editingTicker?.text || '',
                              priority: editingTicker?.priority ?? 0,
                            })
                          }
                        />{' '}
                        Show on Home Page
                      </label>
                      <button type="submit" className="approve-btn">
                        {editingTicker?._id ? 'Update Ticker' : 'Add Ticker'}
                      </button>
                      {editingTicker && (
                        <button
                          type="button"
                          onClick={() => setEditingTicker(null)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              )}

              {announcementMode === 'tickers' && subView === 'history' && (
                <div className="data-table-container">
                  <h3>Active Tickers</h3>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Ticker Message</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickers.map((t) => (
                        <tr key={t._id}>
                          <td>
                            <strong>#{t.priority}</strong>
                          </td>
                          <td>{t.text}</td>
                          <td>
                            <span
                              className={`badge-pill ${
                                t.isActive
                                  ? 'status-verified'
                                  : 'status-pending'
                              }`}
                            >
                              {t.isActive ? 'Active' : 'Hidden'}
                            </span>
                          </td>
                          <td>
                            <button
                              className="edit-btn-sm"
                              onClick={() => handleEditClick(t)}
                            >
                              Edit
                            </button>
                            <button
                              className="delete-btn"
                              onClick={() => handleTickerDelete(t._id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {tickers.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            style={{ textAlign: 'center', padding: 16 }}
                          >
                            No tickers found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main table area */}
        <div className="tab-render-area">
          {activeTab === 'overview' && <PortalOverview stats={stats} />}
          {activeTab === 'manage-admins' && <ManageAdmins />}
          {activeTab === 'feedback' && <FeedbackView />}

          {/* Media Management Tab */}
        {activeTab === 'media' && (
  <div className="media-mgmt-container">
    {/* Sub-navigation for Media Types */}
    <div className="tab-header-actions" style={{ marginBottom: '20px' }}>
      <div className="sub-tab-nav">
        <button
          className={mediaTab === 'gallery' ? 'active' : ''}
          onClick={() => setMediaTab('gallery')}
        >
          Campus Gallery
        </button>
        <button
          className={mediaTab === 'magazine' ? 'active' : ''}
          onClick={() => setMediaTab('magazine')}
        >
          E-Magazine
        </button>
        <button
          className={mediaTab === 'news' ? 'active' : ''}
          onClick={() => setMediaTab('news')}
        >
          Campus News
        </button>
      </div>
    </div>

    {/* --- GALLERY TAB --- */}
    {mediaTab === 'gallery' && (
      <div className="management-suite">
        {/* 1. Bulk Upload Card */}
        <div
          className="post-announcement-card"
          style={{ maxWidth: '100%', marginBottom: '30px' }}
        >
          <h3>Bulk Gallery Upload</h3>
          <p
            className="limit-text"
            style={{ fontSize: '0.85rem', color: '#666' }}
          >
            Manage the landing page carousel. Current:{' '}
            {existingMedia.gallery?.length || 0} / {MAX_IMAGES} images
          </p>
          <div
            className="bulk-actions"
            style={{
              display: 'flex',
              gap: '15px',
              alignItems: 'center',
              marginTop: '15px',
            }}
          >
            <input
              type="file"
              id="multi-file"
              multiple
              accept="image/*"
              hidden
              onChange={(e) => setSelectedFiles(e.target.files)}
            />
            <label
              htmlFor="multi-file"
              className="mbm-btn-outline"
              style={{ cursor: 'pointer' }}
            >
              {selectedFiles.length > 0
                ? `${selectedFiles.length} Selected`
                : 'Select Images'}
            </label>
            <button
              className="mbm-btn-primary"
              onClick={handleBulkUpload}
              disabled={loading || selectedFiles.length === 0}
            >
              {loading ? 'Uploading...' : 'Publish to Homepage'}
            </button>
          </div>
        </div>

        {/* 2. Gallery Management Header with Save Button */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h3 style={{ margin: 0 }}>Arrange & Edit Gallery</h3>
          <button
            className="mbm-btn-primary"
            onClick={saveGalleryChanges}
            disabled={loading || !editableGallery.length}
            style={{
              width: 'auto',
              padding: '10px 25px',
              backgroundColor: '#28a745',
            }}
          >
            {loading ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>

        {/* 3. Gallery Grid Management */}
        <div
          className="media-management-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          {editableGallery.map((item, index) => (
            <div
              key={item._id}
              className="media-item-card"
              style={{
                background: '#fff',
                borderRadius: '8px',
                border: '1px solid #eee',
                overflow: 'hidden',
              }}
            >
              <div className="media-preview" style={{ position: 'relative' }}>
                <img
                  src={item.imageUrl}
                  alt="Gallery"
                  style={{
                    width: '100%',
                    height: '160px',
                    objectFit: 'cover',
                  }}
                />
                <button
                  className="media-delete-overlay"
                  onClick={() => handleDeleteMedia(item._id)}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'rgba(220, 53, 69, 0.9)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '25px',
                    height: '25px',
                    cursor: 'pointer',
                  }}
                >
                  ×
                </button>
              </div>

              <div className="media-details" style={{ padding: '15px' }}>
                <input
                  type="text"
                  value={item.title || ''}
                  onChange={(e) =>
                    handleGalleryTextChange(
                      item._id,
                      'title',
                      e.target.value
                    )
                  }
                  placeholder="Event Title"
                  className="grid-input"
                  style={{
                    width: '100%',
                    marginBottom: '10px',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                  }}
                />
                <textarea
                  value={item.desc || ''}
                  onChange={(e) =>
                    handleGalleryTextChange(item._id, 'desc', e.target.value)
                  }
                  placeholder="Short description..."
                  className="grid-textarea"
                  style={{
                    width: '100%',
                    marginBottom: '10px',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    minHeight: '60px',
                  }}
                />

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                      className="mbm-btn-outline"
                      style={{ padding: '2px 10px', fontSize: '14px' }}
                      onClick={() => moveItem(index, -1)}
                      disabled={index === 0}
                    >
                      ▲
                    </button>
                    <button
                      className="mbm-btn-outline"
                      style={{ padding: '2px 10px', fontSize: '14px' }}
                      onClick={() => moveItem(index, 1)}
                      disabled={index === editableGallery.length - 1}
                    >
                      ▼
                    </button>
                  </div>
                  <span style={{ fontSize: '12px', color: '#999' }}>
                    Pos: {index + 1}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* --- NEWS TAB --- */}
{mediaTab === 'news' && (
  <div className="management-suite">
    {/* 1. Upload Form */}
    <div
      className="post-announcement-card"
      style={{ maxWidth: '100%', marginBottom: '30px' }}
    >
      <h3>Post Campus News</h3>
      <div
        className="news-form-grid"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          marginTop: '15px',
        }}
      >
        <input
          type="text"
          placeholder="News Headline"
          className="partition-input"
          value={newsUpload.headline}
          onChange={(e) =>
            setNewsUpload({
              ...newsUpload,
              headline: e.target.value,
            })
          }
        />
        <textarea
          placeholder="Full News Content..."
          className="partition-input"
          style={{ minHeight: '120px' }}
          value={newsUpload.content}
          onChange={(e) =>
            setNewsUpload({
              ...newsUpload,
              content: e.target.value,
            })
          }
        />

        {/* PREVIEW BLOCK GOES HERE */}
        {newsUpload.image && (
          <div style={{ marginBottom: '15px', textAlign: 'center' }}>
            <p
              style={{
                fontSize: '0.8rem',
                color: '#666',
                marginBottom: '5px',
              }}
            >
              Banner Preview:
            </p>
            <img
              src={URL.createObjectURL(newsUpload.image)}
              alt="Preview"
              style={{
                width: '100%',
                maxHeight: '200px',
                objectFit: 'cover',
                borderRadius: '8px',
                border: '1px solid #ddd',
              }}
            />
          </div>
        )}

        {/* FILE INPUT + BUTTON ROW */}
        <div
          style={{
            display: 'flex',
            gap: '15px',
            alignItems: 'center',
          }}
        >
          <input
            type="file"
            accept="image/*"
            id="news-img"
            hidden
            onChange={(e) =>
              setNewsUpload({
                ...newsUpload,
                image: e.target.files[0],
              })
            }
          />
          <label
            htmlFor="news-img"
            className="mbm-btn-outline"
            style={{ cursor: 'pointer' }}
          >
            {newsUpload.image
              ? 'Image Selected'
              : 'Select Banner Image'}
          </label>
          <button
            className="mbm-btn-primary"
            onClick={handleNewsSubmit}
            disabled={loading}
          >
            {loading ? 'Publishing...' : 'Publish News'}
          </button>
        </div>
      </div>
    </div>

    {/* 2. Management List */}
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
      }}
    >
      <h3 style={{ margin: 0 }}>Manage Existing News</h3>
      <button
        className="mbm-btn-primary"
        onClick={saveNewsChanges}
        style={{ backgroundColor: '#28a745' }}
      >
        Save Order & Edits
      </button>
    </div>

    <div
      className="news-admin-list"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
      }}
    >
      {editableNews.map((item, index) => (
  <div key={item._id} className="news-admin-card" style={{ display: 'flex', gap: '20px', background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #eee' }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
      <img
        src={item.imageUrl} // Strict naming
        style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '4px' }}
        alt=""
      />
      {/* ADDED: Change image for existing item */}
      <input 
        type="file" 
        accept="image/*" 
        id={`update-img-${index}`} 
        hidden 
        onChange={async (e) => {
          const file = e.target.files[0];
          if (file) {
            const url = await uploadFile(file);
            const updated = [...editableNews];
            updated[index].imageUrl = url;
            setEditableNews(updated);
          }
        }}
      />
      <label htmlFor={`update-img-${index}`} className="mbm-btn-outline" style={{ fontSize: '10px', padding: '2px 5px', cursor: 'pointer' }}>
        Change Image
      </label>
    </div>

    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <input
        type="text"
        className="grid-input"
        placeholder="Headline"
        value={item.headline}
        onChange={(e) => {
          const updated = [...editableNews];
          updated[index].headline = e.target.value;
          setEditableNews(updated);
        }}
      />
      {/* ADDED: Description editor for existing news */}
      <textarea
        className="grid-input"
        style={{ minHeight: '60px', fontSize: '0.85rem', padding: '8px' }}
        placeholder="News Content"
        value={item.content}
        onChange={(e) => {
          const updated = [...editableNews];
          updated[index].content = e.target.value;
          setEditableNews(updated);
        }}
      />
      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="mbm-btn-outline" onClick={() => moveNewsItem(index, -1)} disabled={index === 0}>▲</button>
        <button className="mbm-btn-outline" onClick={() => moveNewsItem(index, 1)} disabled={index === editableNews.length - 1}>▼</button>
        <button className="delete-btn" onClick={() => deleteNewsItem(item._id)}>Delete</button>
      </div>
    </div>
  </div>
))}
    </div>
  </div>
)}

    {/* --- MAGAZINE TAB --- */}
    {mediaTab === 'magazine' && (
      <div className="magazine-manager">
        {/* 1. ACTIVE MAGAZINE PREVIEW SECTION */}
        {existingMedia.magazine && (
          <div
            className="post-announcement-card"
            style={{
              maxWidth: '800px',
              marginBottom: '30px',
              borderLeft: '4px solid #007bff',
            }}
          >
            <h3>Current Active Magazine</h3>
            <div
              className="mag-preview-grid"
              style={{
                display: 'flex',
                gap: '20px',
                margin: '20px 0',
                overflowX: 'auto',
                paddingBottom: '10px',
              }}
            >
              <div
                className="mag-preview-item"
                style={{ textAlign: 'center' }}
              >
                <p
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    marginBottom: '5px',
                  }}
                >
                  COVER
                </p>
                <img
                  src={existingMedia.magazine.coverUrl}
                  alt="Cover"
                  style={{
                    height: '120px',
                    borderRadius: '4px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  }}
                />
              </div>
              <div
                className="mag-preview-item"
                style={{ textAlign: 'center' }}
              >
                <p
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    marginBottom: '5px',
                  }}
                >
                  PAGE 1
                </p>
                <img
                  src={
                    existingMedia.magazine.p1Url || '/no-image.jpg'
                  }
                  alt="P1"
                  style={{
                    height: '120px',
                    borderRadius: '4px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  }}
                />
              </div>
              <div
                className="mag-preview-item"
                style={{ textAlign: 'center' }}
              >
                <p
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    marginBottom: '5px',
                  }}
                >
                  PAGE 2
                </p>
                <img
                  src={
                    existingMedia.magazine.p2Url || '/no-image.jpg'
                  }
                  alt="P2"
                  style={{
                    height: '120px',
                    borderRadius: '4px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <a
                href={existingMedia.magazine.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="mbm-btn-outline"
                style={{
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                }}
              >
                View Current PDF
              </a>
              <button
                onClick={handleDeleteMagazine}
                className="mbm-btn-outline"
                style={{
                  color: '#dc3545',
                  borderColor: '#dc3545',
                  fontSize: '0.85rem',
                }}
              >
                Delete Issue
              </button>
            </div>
          </div>
        )}

        {/* 2. UPLOAD/UPDATE FORM */}
        <div
          className="post-announcement-card"
          style={{ maxWidth: '600px' }}
        >
          <h3>
            {existingMedia.magazine
              ? 'Replace Magazine Issue'
              : 'Upload New Magazine'}
          </h3>
          <p
            style={{
              fontSize: '0.85rem',
              color: '#666',
              marginBottom: '15px',
            }}
          >
            Upload the PDF and preview images. Page 1 and 2 are used for
            the "stack" effect on the landing page.
          </p>
          <div
            className="form-grid"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '15px',
            }}
          >
            <div className="file-input-group">
              <label
                style={{
                  display: 'block',
                  fontWeight: '600',
                  marginBottom: '5px',
                }}
              >
                1. Main Magazine PDF{' '}
                {existingMedia.magazine?.pdfUrl &&
                  '(Optional - Select to Replace)'}
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) =>
                  setMagazineUpload({
                    ...magazineUpload,
                    pdf: e.target.files[0],
                  })
                }
              />
            </div>

            <div className="file-input-group">
              <label
                style={{
                  display: 'block',
                  fontWeight: '600',
                  marginBottom: '5px',
                }}
              >
                2. Cover Preview Image{' '}
                {existingMedia.magazine?.coverUrl &&
                  '(Optional - Select to Replace)'}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setMagazineUpload({
                    ...magazineUpload,
                    cover: e.target.files[0],
                  })
                }
              />
            </div>

            <div
              className="flex-row"
              style={{ display: 'flex', gap: '15px' }}
            >
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: '600',
                    marginBottom: '5px',
                  }}
                >
                  Page 1 Preview
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setMagazineUpload({
                      ...magazineUpload,
                      p1: e.target.files[0],
                    })
                  }
                />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: '600',
                    marginBottom: '5px',
                  }}
                >
                  Page 2 Preview
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setMagazineUpload({
                      ...magazineUpload,
                      p2: e.target.files[0],
                    })
                  }
                />
              </div>
            </div>

            <button
              className="mbm-btn-primary"
              onClick={handleMagazineSubmit}
              disabled={loading}
              style={{ marginTop: '10px' }}
            >
              {loading ? 'Publishing...' : 'Publish Magazine'}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
)}

          {['alumni', 'students', 'logs'].includes(activeTab) && (
            <div className="data-table-container">
              {loading ? (
                <p>Loading...</p>
              ) : (
                <table className="admin-table">
                  <thead>
                    {activeTab === 'logs' ? (
                      <tr>
                        <th>Viewer</th>
                        <th>Alumni</th>
                        <th>IP</th>
                        <th>Time</th>
                      </tr>
                    ) : (
                      <tr>
                        <th>Name</th>
                        <th>Contact</th>
                        <th>Details</th>
                        <th>
                          {activeTab === 'alumni' ? 'Company' : 'Roll No'}
                        </th>
                        <th>Actions</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {filteredData.map((item) => (
                      <tr key={item._id}>
                        {activeTab === 'logs' ? (
                          <>
                            <td>{item.viewerName}</td>
                            <td>{item.alumniName}</td>
                            <td>{item.ipAddress}</td>
                            <td>
                              {item.timestamp
                                ? new Date(item.timestamp).toLocaleString()
                                : ''}
                            </td>
                          </>
                        ) : (
                          <>
                            <td>{item.name}</td>
                            <td>{item.email}</td>
                            <td>{item.branch}</td>
                            <td>
                              {activeTab === 'alumni'
                                ? item.company
                                : item.rollNumber}
                            </td>
                            <td>
                              {statusFilter === 'pending' && (
                                <button
                                  className="approve-btn"
                                  onClick={() =>
                                    handleAction(item._id, 'approve')
                                  }
                                >
                                  Approve
                                </button>
                              )}
                              <button
                                className="delete-btn"
                                onClick={() =>
                                  handleAction(item._id, 'reject')
                                }
                              >
                                Delete
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                    {!loading && filteredData.length === 0 && (
                      <tr>
                        <td
                          colSpan={activeTab === 'logs' ? 4 : 5}
                          style={{ textAlign: 'center', padding: '20px' }}
                        >
                          No records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;