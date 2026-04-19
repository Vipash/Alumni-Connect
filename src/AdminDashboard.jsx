// AdminDashboard.jsx
import { useState, useEffect } from 'react';

function AdminDashboard({ admin, setView, onLogout }) {
  // 1. All States at the top
  const [activeTab, setActiveTab] = useState('overview');
  const [statusFilter, setStatusFilter] = useState('pending'); // pending | verified | post | history
  const [listData, setListData] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [feedbackFilter, setFeedbackFilter] = useState('registered'); // 'registered' | 'public'
  const [loading, setLoading] = useState(false);
  const [audience, setAudience] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [allAdmins, setAllAdmins] = useState([]);
  const [adminSubTab, setAdminSubTab] = useState('list');

  // NEW: announcements sub-tabs and ticker state
  const [announcementSubTab, setAnnouncementSubTab] = useState('post'); // post | history | tickers
  const [tickers, setTickers] = useState([]);
  const [editingTicker, setEditingTicker] = useState(null);

  // NEW: tab permissions configuration
  const AVAILABLE_TABS = [
    { id: 'overview', label: 'Overview / Stats' },
    { id: 'announcements', label: 'Announcements & Tickers' },
    { id: 'alumni', label: 'Alumni Verification' },
    { id: 'students', label: 'Student Verification' },
    { id: 'feedback', label: 'Issues & Feedback' },
    { id: 'logs', label: 'Security Logs' },
  ];

  // Default selection for new admins
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

  // 2. Helper Functions & API Calls
  const fetchStats = async () => {
    try {
      const res = await fetch(
        'https://alumni-connect-fegi.onrender.com/api/admin/stats',
        {
          headers: { 'admin-id': adminId },
        }
      );
      if (res.ok) setStats(await res.json());
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  const getApiUrl = () => {
    if (activeTab === 'logs') return '/api/admin/logs';
    // Only fetch announcements list when in history mode
    if (activeTab === 'announcements' && statusFilter === 'history')
      return '/api/announcements';
    const role = activeTab === 'alumni' ? 'alumni' : 'student';
    return `/api/admin/${statusFilter}/${role}`;
  };

  const fetchCurrentList = async () => {
    // Do not fetch list for overview, manage-admins, or feedback
    if (
      activeTab === 'overview' ||
      activeTab === 'manage-admins' ||
      activeTab === 'feedback'
    )
      return;

    setLoading(true);
    try {
      const res = await fetch(getApiUrl(), {
        headers: { 'admin-id': adminId },
      });
      const data = await res.json();
      setListData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('List fetch error:', err);
      setListData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/admin/support-tickets');
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Tickets fetch error:', err);
      setTickets([]);
    }
  };

  const fetchAllAdmins = async () => {
    try {
      const res = await fetch('/api/admin/list', {
        headers: { 'admin-id': adminId },
      });
      if (res.ok) setAllAdmins(await res.json());
    } catch (err) {
      console.error('Admin list fetch error:', err);
      setAllAdmins([]);
    }
  };

  const deleteAdmin = async (id) => {
    if (!window.confirm("Remove this admin's access?")) return;
    const res = await fetch(`/api/admin/delete/${id}`, {
      method: 'DELETE',
      headers: { 'admin-id': adminId },
    });
    if (res.ok) fetchAllAdmins();
  };

  // NEW: ticker helpers
  const fetchTickers = async () => {
    try {
      const res = await fetch(
        'https://alumni-connect-fegi.onrender.com/api/admin/tickers',
        {
          headers: { 'admin-id': adminId },
        }
      );
      if (res.ok) {
        const data = await res.json();
        // Sort by priority (higher first)
        setTickers(data.sort((a, b) => b.priority - a.priority));
      }
    } catch (err) {
      console.error('Ticker fetch error:', err);
      setTickers([]);
    }
  };

  const handleTickerSubmit = async (e) => {
    e.preventDefault();
    if (!editingTicker) return;

    const method = editingTicker?._id ? 'PUT' : 'POST';
    const url = editingTicker?._id
      ? `/api/admin/tickers/${editingTicker._id}`
      : '/api/admin/tickers';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'admin-id': adminId },
      body: JSON.stringify(editingTicker),
    });

    if (res.ok) {
      alert('Ticker updated!');
      setEditingTicker(null);
      fetchTickers();
    }
  };

  const handleTickerDelete = async (id) => {
    if (!window.confirm('Delete this ticker?')) return;
    const res = await fetch(`/api/admin/tickers/${id}`, {
      method: 'DELETE',
      headers: { 'admin-id': adminId },
    });
    if (res.ok) fetchTickers();
  };

  // 3. Derived Data
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

  const filteredTickets = tickets.filter((t) =>
    feedbackFilter === 'registered' ? t.isRegistered : !t.isRegistered
  );

  // 4. UseEffects

  // Stats: once on mount
  useEffect(() => {
    fetchStats();
  }, []);

  // Feedback tickets: only when switching into the feedback tab
  useEffect(() => {
    if (activeTab === 'feedback') {
      fetchTickets();
    }
  }, [activeTab]);

  // Lists for other tabs: when tab or statusFilter changes
  useEffect(() => {
    if (
      activeTab !== 'overview' &&
      activeTab !== 'manage-admins' &&
      activeTab !== 'feedback'
    ) {
      fetchCurrentList();
    }
  }, [activeTab, statusFilter]);

  // Fetch admins when the tab is active
  useEffect(() => {
    if (activeTab === 'manage-admins') fetchAllAdmins();
  }, [activeTab]);

  // NEW: fetch tickers when announcements → tickers tab active
  useEffect(() => {
    if (activeTab === 'announcements' && announcementSubTab === 'tickers') {
      fetchTickers();
    }
  }, [activeTab, announcementSubTab]);

  // 5. Action Handlers
  const handleAction = async (id, action) => {
    if (action === 'delete-announcement') {
      if (!window.confirm('Delete this announcement?')) return;
      const res = await fetch(`/api/admin/announcement/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        alert('Deleted!');
        fetchCurrentList();
      }
      return;
    }

    const confirmMsg =
      action === 'approve' ? 'Approve user?' : 'Permanently delete?';
    if (!window.confirm(confirmMsg)) return;
    const url =
      action === 'approve'
        ? `/api/verify-user/${id}`
        : `/api/delete-user/${id}`;
    const method = action === 'approve' ? 'PATCH' : 'DELETE';

    const response = await fetch(url, { method });
    if (response.ok) {
      alert('Action successful!');
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
      setStatusFilter('history');
      setAnnouncementSubTab('history');
      fetchCurrentList();
    }
  };

  // 6. Sub-Components
  const PortalOverview = () => (
    <div className="admin-overview-container">
      <div className="overview-header">
        <h2>Portal Overview</h2>
        <p>Live system status and user distribution.</p>
      </div>
      <div className="admin-stats-grid">
        <div className="stat-card">
          <h4>Alumni</h4>
          <p>
            Verified: <strong>{stats?.alumni?.verified || 0}</strong>
          </p>
          <p className="pending-text">
            Pending: {stats?.alumni?.pending || 0}
          </p>
        </div>
        <div className="stat-card">
          <h4>Students</h4>
          <p>
            Verified: <strong>{stats?.students?.verified || 0}</strong>
          </p>
          <p className="pending-text">
            Pending: {stats?.students?.pending || 0}
          </p>
        </div>
        <div className="stat-card">
          <h4>Security</h4>
          <p>
            Today&apos;s Traffic: <strong>Online</strong>
          </p>
          <p>
            Server Status:{' '}
            <span style={{ color: 'green' }}>Healthy</span>
          </p>
        </div>
      </div>
    </div>
  );

  const FeedbackView = () => (
    <div className="admin-support-container">
      <div className="content-toolbar">
        <div className="filter-group">
          <button
            className={feedbackFilter === 'registered' ? 'sel' : ''}
            onClick={() => setFeedbackFilter('registered')}
          >
            Registered Users
          </button>
          <button
            className={feedbackFilter === 'public' ? 'sel' : ''}
            onClick={() => setFeedbackFilter('public')}
          >
            Guest Reports
          </button>
        </div>
      </div>

      <div className="data-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Sender</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map((t) => (
              <tr
                key={t._id}
                onClick={() => setSelectedTicket(t)}
                style={{ cursor: 'pointer' }}
                className="hover-row"
              >
                <td>
                  <span
                    className={`badge-pill status-${
                      t.type?.toLowerCase() || 'other'
                    }`}
                  >
                    {t.type}
                  </span>
                </td>
                <td>
                  <strong>{t.userName || 'Guest User'}</strong>
                  <br />
                  <small>{t.senderEmail}</small>
                </td>
                <td>
                  {t.createdAt
                    ? new Date(t.createdAt).toLocaleString()
                    : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Feedback Detail</h3>
            <hr />
            <p>
              <strong>From:</strong> {selectedTicket.userName || 'Guest'} (
              {selectedTicket.senderEmail || 'N/A'})
            </p>
            <p>
              <strong>Type:</strong> {selectedTicket.type}
            </p>
            <p>
              <strong>Sent At:</strong>{' '}
              {selectedTicket.createdAt
                ? new Date(selectedTicket.createdAt).toLocaleString()
                : 'N/A'}
            </p>
            <div className="message-box">
              <strong>Message:</strong>
              <p>{selectedTicket.message}</p>
            </div>
            <button onClick={() => setSelectedTicket(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );

  const ManageAdmins = () => {
    const [formData, setFormData] = useState({
      username: '',
      password: '',
      role: 'Moderator',
    });

    const handleCreate = async (e) => {
      e.preventDefault();
      const response = await fetch('/api/admin/create-new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          creatorRole: admin.role,
          permissions: selectedPerms,
        }),
      });
      if (response.ok) {
        alert('Admin Created!');
        e.target.reset();
        setFormData({ username: '', password: '', role: 'Moderator' });
        setSelectedPerms(['overview']);
        fetchAllAdmins();
      }
    };

    return (
      <div className="admin-access-container">
        {/* Sub-Tabs Navigation */}
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

  // Helper: who can see which tab
  const canSeeTab = (permissionKey) => {
    if (admin?.role === 'GodMode') return true;
    const perms = admin?.permissions;
    // If no permissions field yet (old accounts), show everything
    if (!Array.isArray(perms)) return true;
    return perms.includes(permissionKey);
  };

  // 7. FINAL RETURN STATEMENT
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
          {canSeeTab('overview') && (
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
                setStatusFilter('post');
                setAnnouncementSubTab('post');
              }}
            >
              Announcements
            </button>
          )}

          {canSeeTab('logs') && (
            <button
              className={activeTab === 'logs' ? 'active' : ''}
              onClick={() => setActiveTab('logs')}
            >
              Security Logs
            </button>
          )}

          {/* ONLY GodMode sees Admin Access */}
          {admin?.role === 'GodMode' && (
            <button
              className={activeTab === 'manage-admins' ? 'active' : ''}
              onClick={() => setActiveTab('manage-admins')}
            >
              Admin Access
            </button>
          )}

          {canSeeTab('feedback') && (
            <button
              className={activeTab === 'feedback' ? 'active' : ''}
              onClick={() => setActiveTab('feedback')}
            >
              Issues &amp; Feedback
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
        {/* Toolbar for search + status filters for user/logs/announcement views */}
        {['alumni', 'students', 'logs', 'announcements'].includes(
          activeTab
        ) && (
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

            {/* UPDATED: announcements toolbar uses sub-tabs */}
            {activeTab === 'announcements' && (
              <div className="filter-group">
                <button
                  className={announcementSubTab === 'post' ? 'sel' : ''}
                  onClick={() => {
                    setAnnouncementSubTab('post');
                    setStatusFilter('post');
                  }}
                >
                  Post New
                </button>
                <button
                  className={announcementSubTab === 'history' ? 'sel' : ''}
                  onClick={() => {
                    setAnnouncementSubTab('history');
                    setStatusFilter('history');
                    fetchCurrentList();
                  }}
                >
                  History
                </button>
                <button
                  className={
                    announcementSubTab === 'tickers' ? 'sel' : ''
                  }
                  onClick={() => setAnnouncementSubTab('tickers')}
                >
                  Manage Tickers
                </button>
              </div>
            )}
          </div>
        )}

        <div className="tab-render-area">
          {activeTab === 'overview' && <PortalOverview />}
          {activeTab === 'manage-admins' && <ManageAdmins />}
          {activeTab === 'feedback' && <FeedbackView />}

          {/* Announcement post form */}
          {activeTab === 'announcements' &&
            announcementSubTab === 'post' && (
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

          {/* NEW: Ticker management UI */}
          {activeTab === 'announcements' &&
            announcementSubTab === 'tickers' && (
              <div className="ticker-management-section">
                <div className="admin-card-simple">
                  <h3>
                    {editingTicker
                      ? 'Edit Ticker'
                      : 'Add New Ticker Item'}
                  </h3>
                  <form
                    onSubmit={handleTickerSubmit}
                    className="admin-form-clean"
                  >
                    <input
                      required
                      placeholder="Ticker Text (e.g., 'Final Year Exams starting from May 5th...')"
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
                        placeholder="Priority (e.g. 10)"
                        style={{ width: '120px' }}
                        value={
                          editingTicker?.priority === 0
                            ? ''
                            : editingTicker?.priority ?? ''
                        }
                        onChange={(e) =>
                          setEditingTicker({
                            ...(editingTicker || {}),
                            priority: parseInt(
                              e.target.value || '0',
                              10
                            ),
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
                        {editingTicker ? 'Update Ticker' : 'Add Ticker'}
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

                <div
                  className="data-table-container"
                  style={{ marginTop: '20px' }}
                >
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
                              onClick={() => setEditingTicker(t)}
                            >
                              Edit
                            </button>
                            <button
                              className="delete-btn"
                              onClick={() =>
                                handleTickerDelete(t._id)
                              }
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {tickers.length === 0 && (
                        <tr>
                          <td
                            colSpan="4"
                            style={{
                              textAlign: 'center',
                              padding: 16,
                            }}
                          >
                            No tickers found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          {/* Main Table for Users / Logs / Announcement History */}
          {((['alumni', 'students', 'logs'].includes(activeTab)) ||
            (activeTab === 'announcements' &&
              announcementSubTab === 'history')) && (
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
                    ) : activeTab === 'announcements' ? (
                      <tr>
                        <th>Date</th>
                        <th>Title</th>
                        <th>Action</th>
                      </tr>
                    ) : (
                      <tr>
                        <th>Name</th>
                        <th>Contact</th>
                        <th>Details</th>
                        <th>
                          {activeTab === 'alumni'
                            ? 'Company'
                            : 'Roll No'}
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
                                ? new Date(
                                    item.timestamp
                                  ).toLocaleString()
                                : ''}
                            </td>
                          </>
                        ) : activeTab === 'announcements' ? (
                          <>
                            <td>
                              {item.date
                                ? new Date(
                                    item.date
                                  ).toLocaleDateString()
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
                          colSpan={
                            activeTab === 'logs'
                              ? 4
                              : activeTab === 'announcements'
                              ? 3
                              : 5
                          }
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