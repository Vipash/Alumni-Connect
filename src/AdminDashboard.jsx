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
    if (activeTab === 'announcements') return '/api/announcements';
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
    const data = await res.json();
    setTickets(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error('Tickets fetch error:', err);
    setTickets([]);
  }
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
              <th>Message</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map((t) => (
              <tr key={t._id}>
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
                  <strong>{t.name || 'N/A'}</strong>
                  {!t.isRegistered && (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        color: 'orange',
                        marginLeft: '5px',
                      }}
                    >
                      (GUEST)
                    </span>
                  )}
                  <br />
                  <small style={{ color: '#666' }}>
                    {t.email || 'N/A'}
                  </small>
                </td>
                <td style={{ maxWidth: '300px', fontSize: '0.9rem' }}>
                  {t.message}
                </td>
                <td>
                  {t.createdAt
                    ? new Date(t.createdAt).toLocaleDateString()
                    : ''}
                </td>
              </tr>
            ))}
            {filteredTickets.length === 0 && (
              <tr>
                <td
                  colSpan="4"
                  style={{ textAlign: 'center', padding: '20px' }}
                >
                  No feedback found in this category.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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
        body: JSON.stringify({ ...formData, creatorRole: admin.role }),
      });
      if (response.ok) {
        alert('Admin Created!');
        e.target.reset();
        setFormData({ username: '', password: '', role: 'Moderator' });
      }
    };

    return (
      <div className="admin-card-simple">
        <h3>Add New Administrator</h3>
        <form onSubmit={handleCreate} className="admin-form-clean">
          <input
            required
            placeholder="Username"
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
          />
          <input
            required
            type="password"
            placeholder="Password"
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
          <button type="submit" className="approve-btn">
            Create Account
          </button>
        </form>
      </div>
    );
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
          <button
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={activeTab === 'alumni' ? 'active' : ''}
            onClick={() => {
              setActiveTab('alumni');
              setStatusFilter('pending');
            }}
          >
            Alumni
          </button>
          <button
            className={activeTab === 'students' ? 'active' : ''}
            onClick={() => {
              setActiveTab('students');
              setStatusFilter('pending');
            }}
          >
            Students
          </button>
          <button
            className={activeTab === 'announcements' ? 'active' : ''}
            onClick={() => {
              setActiveTab('announcements');
              setStatusFilter('post');
            }}
          >
            Announcements
          </button>
          <button
            className={activeTab === 'logs' ? 'active' : ''}
            onClick={() => setActiveTab('logs')}
          >
            Security Logs
          </button>
          {admin?.role === 'GodMode' && (
            <button
              className={activeTab === 'manage-admins' ? 'active' : ''}
              onClick={() => setActiveTab('manage-admins')}
            >
              Admin Access
            </button>
          )}
          <button
            className={activeTab === 'feedback' ? 'active' : ''}
            onClick={() => setActiveTab('feedback')}
          >
            Issues &amp; Feedback
          </button>
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

            {activeTab === 'announcements' && (
              <div className="filter-group">
                <button
                  className={statusFilter === 'post' ? 'sel' : ''}
                  onClick={() => setStatusFilter('post')}
                >
                  Post New
                </button>
                <button
                  className={statusFilter === 'history' ? 'sel' : ''}
                  onClick={() => setStatusFilter('history')}
                >
                  History
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
          {activeTab === 'announcements' && statusFilter === 'post' && (
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

          {/* Main Table for Users / Logs / Announcement History */}
          {((['alumni', 'students', 'logs'].includes(activeTab)) ||
            (activeTab === 'announcements' && statusFilter === 'history')) && (
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