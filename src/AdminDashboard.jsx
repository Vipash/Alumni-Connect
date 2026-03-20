import { useState, useEffect } from 'react';

function AdminDashboard({ setView }) {
  const [activeTab, setActiveTab] = useState('alumni');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [listData, setListData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [audience, setAudience] = useState('all');
  const [searchTerm, setSearchTerm] = useState(''); // New Search State

  const getApiUrl = () => {
    if (activeTab === 'logs') return '/api/admin/logs';
    if (activeTab === 'announcements') return '/api/announcements';
    // Match the role names used in your server.js logic
    const role = activeTab === 'alumni' ? 'alumni' : 'student';
    return `/api/admin/${statusFilter}/${role}`;
  };

  const fetchCurrentList = async () => {
    setLoading(true);
    setSearchTerm(''); // Reset search when switching tabs
    try {
      const res = await fetch(getApiUrl());
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
      setActiveTab('announcements');
    }
  };

  return (
    <div className="admin-modal-content">
      <div className="admin-header">
        <h2>Admin Control Panel</h2>
        <button className="back-btn" onClick={() => setView('home')}>Close Dashboard</button>
      </div>

  {stats && (
        <div className="admin-stats-grid">
          <div className="stat-card">
            <h4>Alumni</h4>
            <p>Verified: <strong>{stats.alumni.verified}</strong></p>
            <p className="pending-text">Pending: {stats.alumni.pending}</p>
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
        {activeTab === 'announcements' ? (
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