import { useState, useEffect } from 'react';

function AdminDashboard({ admin, setView, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [listData, setListData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [audience, setAudience] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const adminData = JSON.parse(localStorage.getItem('admin'));
  const adminId = adminData?._id;

  const fetchStats = async () => {
    try {
      const res = await fetch('https://alumni-connect-fegi.onrender.com/api/admin/stats', {
        headers: { 'admin-id': adminId }
      });
      if (res.ok) setStats(await res.json());
    } catch (err) { console.error("Stats error:", err); }
  };

  const getApiUrl = () => {
    if (activeTab === 'logs') return '/api/admin/logs';
    if (activeTab === 'announcements') return '/api/announcements';
    const role = activeTab === 'alumni' ? 'alumni' : 'student';
    return `/api/admin/${statusFilter}/${role}`;
  };

  const fetchCurrentList = async () => {
    if (activeTab === 'overview' || activeTab === 'manage-admins') return;
    setLoading(true);
    try {
      const res = await fetch(getApiUrl(), {
        headers: { 'admin-id': adminId }
      });
      const data = await res.json();
      setListData(Array.isArray(data) ? data : []);
    } catch (err) {
      setListData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchCurrentList();
  }, [activeTab, statusFilter]);

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

  const handleAction = async (id, action) => {
    if (action === 'delete-announcement') {
      if (!window.confirm("Delete this announcement?")) return;
      const res = await fetch(`/api/admin/announcement/${id}`, { method: 'DELETE' });
      if (res.ok) { alert("Deleted!"); fetchCurrentList(); }
      return;
    }

    const confirmMsg = action === 'approve' ? "Approve user?" : "Permanently delete?";
    if (!window.confirm(confirmMsg)) return;
    const url = action === 'approve' ? `/api/verify-user/${id}` : `/api/delete-user/${id}`;
    const method = action === 'approve' ? 'PATCH' : 'DELETE';

    const response = await fetch(url, { method });
    if (response.ok) {
      alert("Action successful!");
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
      targetAudience: audience
    };
    const response = await fetch('/api/admin/announcement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (response.ok) {
      alert("Posted!");
      e.target.reset();
      setStatusFilter('history');
    }
  };

  // --- SUB-COMPONENTS ---
  const PortalOverview = () => (
    <div className="admin-overview-container">
      <div className="overview-header">
        <h2>Portal Overview</h2>
        <p>Live system status and user distribution.</p>
      </div>
      <div className="admin-stats-grid">
        <div className="stat-card">
          <h4>Alumni</h4>
          <p>Verified: <strong>{stats?.alumni?.verified || 0}</strong></p>
          <p className="pending-text">Pending: {stats?.alumni?.pending || 0}</p>
        </div>
        <div className="stat-card">
          <h4>Students</h4>
          <p>Verified: <strong>{stats?.students?.verified || 0}</strong></p>
          <p className="pending-text">Pending: {stats?.students?.pending || 0}</p>
        </div>
        <div className="stat-card">
          <h4>Security</h4>
          <p>Today's Traffic: <strong>Online</strong></p>
          <p>Server Status: <span style={{color: 'green'}}>Healthy</span></p>
        </div>
      </div>
    </div>
  );

  // Inside AdminDashboard.jsx
const [tickets, setTickets] = useState([]);

useEffect(() => {
  fetch('/api/admin/support')
    .then(res => res.json())
    .then(data => setTickets(data));
}, []);

// In your JSX (Table view)
<section className="admin-section">
  <h3>User Queries & Feedback</h3>
  <table className="admin-table">
    <thead>
      <tr>
        <th>Type</th>
        <th>User</th>
        <th>Message</th>
        <th>Date</th>
      </tr>
    </thead>
    <tbody>
      {tickets.map(t => (
        <tr key={t._id}>
          <td><span className={`badge-${t.type.toLowerCase()}`}>{t.type}</span></td>
          <td>{t.userName} <br/><small>{t.sender}</small></td>
          <td>{t.message}</td>
          <td>{new Date(t.timestamp).toLocaleDateString()}</td>
        </tr>
      ))}
    </tbody>
  </table>
</section>

  const ManageAdmins = () => {
    const [formData, setFormData] = useState({ username: '', password: '', role: 'Moderator' });
    const handleCreate = async (e) => {
      e.preventDefault();
      const response = await fetch('/api/admin/create-new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, creatorRole: admin.role })
      });
      if (response.ok) { alert("Admin Created!"); e.target.reset(); }
    };
    return (
      <div className="admin-card-simple">
        <h3>Add New Administrator</h3>
        <form onSubmit={handleCreate} className="admin-form-clean">
          <input required placeholder="Username" onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
          <input required type="password" placeholder="Password" onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
          <select onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
            <option value="Moderator">Moderator</option>
            <option value="Admin">Admin</option>
            <option value="GodMode">GodMode</option>
          </select>
          <button type="submit" className="approve-btn">Create Account</button>
        </form>
      </div>
    );
  };

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
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>Overview</button>
          <button className={activeTab === 'alumni' ? 'active' : ''} onClick={() => {setActiveTab('alumni'); setStatusFilter('pending');}}>Alumni</button>
          <button className={activeTab === 'students' ? 'active' : ''} onClick={() => {setActiveTab('students'); setStatusFilter('pending');}}>Students</button>
          <button className={activeTab === 'announcements' ? 'active' : ''} onClick={() => {setActiveTab('announcements'); setStatusFilter('post');}}>Announcements</button>
          <button className={activeTab === 'logs' ? 'active' : ''} onClick={() => setActiveTab('logs')}>Security Logs</button>
          {admin?.role === 'GodMode' && (
            <button className={activeTab === 'manage-admins' ? 'active' : ''} onClick={() => setActiveTab('manage-admins')}>Admin Access</button>
          )}
        </div>
        <div className="nav-right">
          <div className="admin-user-info">
            <p className="u-name">{admin?.username || 'Admin'}</p>
            <p className="u-role">{admin?.role}</p>
          </div>
          <button className="nav-logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </nav>

      <main className="admin-content-wrapper">
        {['alumni', 'students', 'logs', 'announcements'].includes(activeTab) && (
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
                <button className={statusFilter === 'pending' ? 'sel' : ''} onClick={() => setStatusFilter('pending')}>Pending</button>
                <button className={statusFilter === 'verified' ? 'sel' : ''} onClick={() => setStatusFilter('verified')}>Verified</button>
              </div>
            )}
            {activeTab === 'announcements' && (
              <div className="filter-group">
                <button className={statusFilter === 'post' ? 'sel' : ''} onClick={() => setStatusFilter('post')}>Post New</button>
                <button className={statusFilter === 'history' ? 'sel' : ''} onClick={() => setStatusFilter('history')}>History</button>
              </div>
            )}
          </div>
        )}

        <div className="tab-render-area">
          {activeTab === 'overview' && <PortalOverview />}
          {activeTab === 'manage-admins' && <ManageAdmins />}
          
          {activeTab === 'announcements' && statusFilter === 'post' && (
             <div className="admin-card-simple">
               <form onSubmit={handlePostAnnouncement} className="admin-form-clean">
                 <input name="title" placeholder="Title" required />
                 <input name="subject" placeholder="Subject" required />
                 <textarea name="content" placeholder="Announcement Content..." rows="4" required />
                 <select onChange={(e) => setAudience(e.target.value)}>
                   <option value="all">Everyone</option>
                   <option value="alumni">Alumni Only</option>
                   <option value="students">Students Only</option>
                 </select>
                 <button type="submit" className="approve-btn">Publish</button>
               </form>
             </div>
          )}

          {/* TABLE VIEW FOR ALUMNI, STUDENTS, LOGS, and ANNOUNCEMENT HISTORY */}
          {((activeTab !== 'overview' && activeTab !== 'manage-admins' && activeTab !== 'announcements') || (activeTab === 'announcements' && statusFilter === 'history')) && (
            <div className="data-table-container">
              {loading ? <p>Loading...</p> : (
                <table className="admin-table">
                  <thead>
                    {activeTab === 'logs' ? (
                      <tr><th>Viewer</th><th>Alumni</th><th>IP</th><th>Time</th></tr>
                    ) : activeTab === 'announcements' ? (
                      <tr><th>Date</th><th>Title</th><th>Action</th></tr>
                    ) : (
                      <tr><th>Name</th><th>Contact</th><th>Details</th><th>{activeTab === 'alumni' ? 'Company' : 'Roll No'}</th><th>Actions</th></tr>
                    )}
                  </thead>
                  <tbody>
                    {filteredData.map(item => (
                      <tr key={item._id}>
                        {activeTab === 'logs' ? (
                          <><td>{item.viewerName}</td><td>{item.alumniName}</td><td>{item.ipAddress}</td><td>{new Date(item.timestamp).toLocaleString()}</td></>
                        ) : activeTab === 'announcements' ? (
                          <><td>{new Date(item.date).toLocaleDateString()}</td><td>{item.title}</td><td><button className="delete-btn" onClick={() => handleAction(item._id, 'delete-announcement')}>Delete</button></td></>
                        ) : (
                          <>
                            <td>{item.name}</td><td>{item.email}</td><td>{item.branch}</td><td>{activeTab === 'alumni' ? item.company : item.rollNumber}</td>
                            <td>
                              {statusFilter === 'pending' && <button className="approve-btn" onClick={() => handleAction(item._id, 'approve')}>Approve</button>}
                              <button className="delete-btn" onClick={() => handleAction(item._id, 'reject')}>Delete</button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
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