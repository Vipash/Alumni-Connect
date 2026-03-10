import { useState, useEffect } from 'react';

function AdminDashboard({ setView }) {
  const [activeTab, setActiveTab] = useState('alumni'); 
  const [statusFilter, setStatusFilter] = useState('pending'); 
  const [listData, setListData] = useState([]);
  const [loading, setLoading] = useState(false);

  const getApiUrl = () => {
    if (activeTab === 'logs') return '/api/admin/logs';
    const role = activeTab === 'alumni' ? 'alumni' : 'student';
    if (statusFilter === 'pending') return `/api/admin/pending/${role}`;
    return activeTab === 'alumni' ? '/api/get-alumni' : '/api/admin/approved/student';
  };

  const fetchCurrentList = async () => {
    setLoading(true);
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

  const handleAction = async (id, action) => {
    const confirmMsg = action === 'approve' ? "Approve this user?" : "Permanently delete this user?";
    if(!window.confirm(confirmMsg)) return;

    const url = action === 'approve' ? `/api/verify-user/${id}` : `/api/delete-user/${id}`;
    const method = action === 'approve' ? 'PATCH' : 'DELETE';
    
    const response = await fetch(url, { method });
    if (response.ok) {
      alert(`User ${action === 'approve' ? 'approved' : 'deleted'}!`);
      fetchCurrentList();
    }
  };
  
const postAnnouncement = async (e) => {
  e.preventDefault();
  const formData = { title: e.target.title.value, subject: e.target.subject.value, content: e.target.content.value };
  await fetch('/api/admin/announcement', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  alert("Posted!");
};

// Add this to your render() inside AdminDashboard
<form onSubmit={postAnnouncement} className="admin-form">
  <input name="title" placeholder="Title" required />
  <input name="subject" placeholder="Subject" required />
  <textarea name="content" placeholder="Full message..." required />
  <button type="submit">Publish Announcement</button>
</form>

  return (
    <div className="admin-modal-content">
      <div className="admin-header">
        <h2>Admin Control Panel</h2>
        <button type="button" className="back-btn" onClick={() => setView('home')}>Close Dashboard</button>
      </div>

      <div className="admin-tabs">
        <button className={activeTab === 'alumni' ? 'active' : ''} onClick={() => { setActiveTab('alumni'); setStatusFilter('pending'); }}>Alumni</button>
        <button className={activeTab === 'students' ? 'active' : ''} onClick={() => { setActiveTab('students'); setStatusFilter('pending'); }}>Students</button>
        <button className={activeTab === 'logs' ? 'active' : ''} onClick={() => setActiveTab('logs')}>Security Logs</button>
      </div>

      {activeTab !== 'logs' && (
        <div className="status-filters">
          <button className={statusFilter === 'pending' ? 'selected' : ''} onClick={() => setStatusFilter('pending')}>Pending Approval</button>
          <button className={statusFilter === 'verified' ? 'selected' : ''} onClick={() => setStatusFilter('verified')}>Verified Users</button>
        </div>
      )}

      <div className="tab-content">
        {loading ? (
          <p className="loading-text">Fetching latest records...</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                {activeTab === 'logs' ? (
                  <tr><th>Viewer</th><th>Viewed Alumni</th><th>Timestamp</th></tr>
                ) : (
                  <tr>
                    <th>Name / Display Name</th>
                    <th>Contact Info</th>
                    <th>Branch / Year</th>
                    <th>{activeTab === 'alumni' ? 'Company' : 'Roll Number'}</th>
                    <th>Actions</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {listData.length > 0 ? (
                  listData.map((item) => (
                    <tr key={item._id}>
                      {activeTab === 'logs' ? (
                        <>
                          <td>{item.viewerName}</td>
                          <td>{item.alumniName}</td>
                          <td>{new Date(item.timestamp).toLocaleString()}</td>
                        </>
                      ) : (
                        <>
                          <td>
                            <strong>{item.name}</strong><br/>
                            <small style={{color: '#666'}}>@{item.displayName || 'no-handle'}</small>
                          </td>
                          <td>
                            {item.email || <span style={{color:'red'}}>Missing Email</span>}<br/>
                            <small>{item.mobile || 'No Phone'}</small>
                          </td>
                          <td>{item.branch}<br/>Class of {item.passoutYear}</td>
                          <td>{activeTab === 'alumni' ? (item.company || 'N/A') : (item.rollNumber || 'N/A')}</td>
                          <td>
                            <div className="admin-action-btns">
                              {statusFilter === 'pending' && (
                                <button className="approve-btn" onClick={() => handleAction(item._id, 'approve')}>Approve</button>
                              )}
                              <button className="delete-btn" onClick={() => handleAction(item._id, 'reject')}>Delete</button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" style={{textAlign: 'center', padding: '40px'}}>No records found in this category.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;