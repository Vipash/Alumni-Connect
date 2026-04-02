import { useState, useEffect } from 'react';

function AdminDashboard({ admin, setView }) {
  const [activeTab, setActiveTab] = useState('alumni');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [listData, setListData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [audience, setAudience] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const adminData = JSON.parse(localStorage.getItem('admin')); 
  const fetchStats = async () => {
    try {
      const res = await fetch('https://alumni-connect-fegi.onrender.com/api/admin/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'admin-id': adminData?._id // <--- THIS IS THE KEY CHANGE
        }
      });
      
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Stats error:", err);
    }
  };

  const fetchLogs = async () => {
  try {
   const res = await fetch('https://alumni-connect-fegi.onrender.com/api/admin/logs', {
        method: 'GET',
        headers: {
          'admin-id': adminData?._id // <--- ADD THIS HERE TOO
        }
      });
      const data = await res.json();
      setListData(data);
    } catch (err) {
      console.error("Logs error:", err);
    }
  };

  const getApiUrl = () => {
    if (activeTab === 'logs') return '/api/admin/logs';
    if (activeTab === 'announcements') return '/api/announcements';
    // Match the role names used in your server.js logic
    const role = activeTab === 'alumni' ? 'alumni' : 'student';
    return `/api/admin/${statusFilter}/${role}`;
  };

  const fetchCurrentList = async () => {
  setLoading(true);
  setSearchTerm('');
  try {
    const res = await fetch(getApiUrl(), {
      method: 'GET',
      headers: {
        'admin-id': adminData?._id
      }
    });
    const data = await res.json();
    setListData(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("Fetch error:", err);
    setListData([]);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchCurrentList();
    fetchStats();
  }, [activeTab, statusFilter]);

  // Logic to filter the list based on search term
  const filteredData = listData.filter((item) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    // Search by Name, Email, or DisplayName
    return (
      item.name?.toLowerCase().includes(search) ||
      item.email?.toLowerCase().includes(search) ||
      item.displayName?.toLowerCase().includes(search) ||
      item.alumniName?.toLowerCase().includes(search) // For Logs
    );
  });

  const handleAction = async (id, action) => {
    if (action === 'delete-announcement') {
      if (!window.confirm("Delete this announcement?")) return;
      const res = await fetch(`/api/admin/announcement/${id}`, { method: 'DELETE' });
      if (res.ok) { alert("Deleted!"); fetchCurrentList(); }
      return;
    }

    const confirmMsg = action === 'approve' ? "Approve user?" : "Permanently delete this user?";
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

  const ManageAdmins = () => {
    const [formData, setFormData] = useState({ username: '', password: '', role: 'Moderator' });

    const handleCreate = async (e) => {
      e.preventDefault();
      const response = await fetch('/api/admin/create-new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Pass creatorRole so server knows if we are GodMode
        body: JSON.stringify({ ...formData, creatorRole: admin.role })
      });
      
      if (response.ok) {
        alert("New Administrator Added!");
        e.target.reset();
      } else {
        const err = await response.json();
        alert(err.message || "Failed to add admin");
      }
    };

  return (
    <div className="admin-card">
      <h3>Add New Administrator</h3>
      <p><small>Only accessible by GodMode accounts.</small></p>
     <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input required placeholder="Username" onChange={(e) => setFormData({...formData, username: e.target.value})} />
          <input required type="password" placeholder="Temp Password" onChange={(e) => setFormData({...formData, password: e.target.value})} />
          <select onChange={(e) => setFormData({...formData, role: e.target.value})}>
            <option value="Moderator">Moderator</option>
            <option value="Admin">Admin</option>
            <option value="GodMode">GodMode</option>
          </select>
          <button type="submit" className="approve-btn">Create Account</button>
        </form>
    </div>
  );
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
      setActiveTab('announcements');
    }
  };

  return (
    <div className="admin-modal-content">
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Admin Control Panel</h2>
          {/* NEW: Identity Display */}
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
            Logged in as: <span style={{ fontWeight: 'bold', color: '#2c3e50' }}>
              {admin?.username || admin?.email || 'System Admin'}
            </span>
          </p>
        </div>
        <button className="back-btn" onClick={() => setView('home')}>Close Dashboard</button>
      </div>
      
  {stats && (
        <div className="admin-stats-grid">
          <div className="stat-card">
            <h4>Alumni</h4>
            {stats ? (
              <>
                <p>Verified: <strong>{stats.alumni.verified}</strong></p>
                <p className="pending-text">Pending: {stats.alumni.pending}</p>
              </>
            ) : <p>Loading stats...</p>}
          </div>
          <div className="stat-card">
            <h4>Students</h4>
            <p>Verified: <strong>{stats.students.verified}</strong></p>
            <p className="pending-text">Pending: {stats.students.pending}</p>
          </div>
          <div className="stat-card">
            <h4>Security</h4>
            <p>Today's Views: <strong>{listData.length && activeTab === 'logs' ? listData.length : '-'}</strong></p>
          </div>
        </div>
        
      )}
      <div className="admin-tabs">
        <button className={activeTab === 'alumni' ? 'active' : ''} onClick={() => { setActiveTab('alumni'); setStatusFilter('pending'); }}>Alumni</button>
        <button className={activeTab === 'students' ? 'active' : ''} onClick={() => { setActiveTab('students'); setStatusFilter('pending'); }}>Students</button>
        <button className={activeTab === 'announcements' ? 'active' : ''} onClick={() => { setActiveTab('announcements'); setStatusFilter('post'); }}>Announcements</button>
        <button className={activeTab === 'logs' ? 'active' : ''} onClick={() => setActiveTab('logs')}>Security Logs</button>
        {admin?.role === 'GodMode' && (
        <button className={activeTab === 'manage-admins' ? 'active' : ''} onClick={() => setActiveTab('manage-admins')}>Manage Admins</button>
        )}
      </div>

      {/* SEARCH BAR (Visible for User and Log tabs) */}
      {['alumni', 'students', 'logs'].includes(activeTab) && (
        <div className="admin-search-container" style={{ padding: '10px 20px' }}>
          <input 
            type="text" 
            placeholder={`Search ${activeTab}...`} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
          />
        </div>
      )}

      {['alumni', 'students'].includes(activeTab) && (
        <div className="status-filters">
          <button className={statusFilter === 'pending' ? 'selected' : ''} onClick={() => setStatusFilter('pending')}>Pending Approval</button>
          <button className={statusFilter === 'verified' ? 'selected' : ''} onClick={() => setStatusFilter('verified')}>Verified Users</button>
        </div>
      )}

      <div className="tab-content">
  {/* 1. MANAGE ADMINS TAB */}
  {activeTab === 'manage-admins' ? (
    <ManageAdmins />
  ) : 
  /* 2. ANNOUNCEMENTS TAB */
  activeTab === 'announcements' ? (
    <div className="admin-announcement-container">
      <div className="sub-tabs">
        <button className={statusFilter === 'post' ? 'active-sub-tab' : ''} onClick={() => setStatusFilter('post')}>Post New</button>
        <button className={statusFilter === 'history' ? 'active-sub-tab' : ''} onClick={() => setStatusFilter('history')}>History</button>
      </div>

      {statusFilter === 'post' ? (
        <form onSubmit={handlePostAnnouncement} className="admin-announcement-form">
          <input name="title" placeholder="Title" required />
          <input name="subject" placeholder="Subject" required />
          <textarea name="content" placeholder="Content..." rows="5" required />
          <label>Audience:</label>
          <select value={audience} onChange={(e) => setAudience(e.target.value)}>
            <option value="all">Everyone</option>
            <option value="students">Students Only</option>
            <option value="alumni">Alumni Only</option>
          </select>
          <button type="submit" className="approve-btn">Publish Announcement</button>
        </form>
      ) : (
        <table>
          <thead><tr><th>Date</th><th>Title</th><th>Actions</th></tr></thead>
          <tbody>
            {listData.map(item => (
              <tr key={item._id}>
                <td>{new Date(item.date).toLocaleDateString()}</td>
                <td>{item.title}</td>
                <td><button className="delete-btn" onClick={() => handleAction(item._id, 'delete-announcement')}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  ) : (
    /* 3. ALL OTHER TABS (Alumni, Students, Logs) */
    <div className="table-wrapper">
      {loading ? <p style={{textAlign: 'center', padding: '20px'}}>Loading...</p> : (
        <table>
          <thead>
            {activeTab === 'logs' ? (
              <tr><th>Viewer</th><th>Alumni Viewed</th><th>IP Address</th><th>Time</th></tr>
            ) : (
              <tr><th>Name</th><th>Contact</th><th>Branch/Year</th><th>{activeTab === 'alumni' ? 'Company' : 'Roll No'}</th><th>Actions</th></tr>
            )}
          </thead>
          <tbody>
            {filteredData.length > 0 ? filteredData.map((item) => (
              <tr key={item._id}>
                {activeTab === 'logs' ? (
                  <>
                    <td>{item.viewerName || "Unknown"}</td>
                    <td>{item.alumniName}</td>
                    <td style={{ fontSize: '0.8rem', color: '#666' }}>{item.ipAddress || 'N/A'}</td>
                    <td>{new Date(item.timestamp).toLocaleString('en-IN')}</td>
                  </>
                ) : (
                  <>
                    <td><strong>{item.name}</strong><br/><small>@{item.displayName}</small></td>
                    <td>{item.email}<br/><small>{item.mobile}</small></td>
                    <td>{item.branch}<br/>{item.passoutYear}</td>
                    <td>{activeTab === 'alumni' ? (item.company || 'N/A') : (item.rollNumber || 'N/A')}</td>
                    <td>
                      <div className="admin-action-btns">
                        {statusFilter === 'pending' && <button className="approve-btn" onClick={() => handleAction(item._id, 'approve')}>Approve</button>}
                        <button className="delete-btn" onClick={() => handleAction(item._id, 'reject')}>Delete</button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            )) : <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>No matches found.</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  )}
</div>
    </div>
  );
}

export default AdminDashboard;