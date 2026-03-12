import { useState, useEffect } from 'react';

function AdminDashboard({ setView }) {
  const [activeTab, setActiveTab] = useState('alumni'); 
  const [statusFilter, setStatusFilter] = useState('pending'); 
  const [listData, setListData] = useState([]);
  const [loading, setLoading] = useState(false);

 const getApiUrl = () => {
    if (activeTab === 'logs') return '/api/admin/logs';
    if (activeTab === 'announcements') return '/api/announcements'; // This is the fix

    const role = activeTab === 'alumni' ? 'alumni' : 'student';
    // Only return 'pending' or 'verified' for users, otherwise default to pending
    const filter = ['pending', 'verified'].includes(statusFilter) ? statusFilter : 'pending';
    return `/api/admin/${filter}/${role}`;
  };

  const fetchCurrentList = async () => {
  setLoading(true);
  try {
    const res = await fetch(getApiUrl());
    if (!res.ok) throw new Error("Network response was not ok");
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
    // 1. Handle Announcement Deletion
    if (action === 'delete-announcement') {
      if (!window.confirm("Delete this announcement?")) return;
      const res = await fetch(`/api/admin/announcement/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert("Announcement deleted!");
        fetchCurrentList(); // Refresh the list
      }
      return; // Exit early
    }

    // 2. Existing User Approval/Deletion logic
    const confirmMsg = action === 'approve' ? "Approve this user?" : "Permanently delete this user?";
    if (!window.confirm(confirmMsg)) return;

    const url = action === 'approve' ? `/api/verify-user/${id}` : `/api/delete-user/${id}`;
    const method = action === 'approve' ? 'PATCH' : 'DELETE';
    
    const response = await fetch(url, { method });
    if (response.ok) {
      alert(`User ${action === 'approve' ? 'approved' : 'deleted'}!`);
      fetchCurrentList();
    }
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    const formData = { 
      title: e.target.title.value, 
      subject: e.target.subject.value, 
      content: e.target.content.value 
    };

    try {
      const response = await fetch('/api/admin/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert("Announcement posted successfully!");
        e.target.reset();
      } else {
        alert("Failed to post.");
      }
    } catch (err) {
      console.error("Post error:", err);
    }
  };

  return (
    <div className="admin-modal-content">
      <div className="admin-header">
        <h2>Admin Control Panel</h2>
        <button type="button" className="back-btn" onClick={() => setView('home')}>Close Dashboard</button>
      </div>

      <div className="admin-tabs">
        <button className={activeTab === 'alumni' ? 'active' : ''} onClick={() => { setActiveTab('alumni'); setStatusFilter('pending'); }}>Alumni</button>
        <button className={activeTab === 'students' ? 'active' : ''} onClick={() => { setActiveTab('students'); setStatusFilter('pending'); }}>Students</button>
        <button className={activeTab === 'announcements' ? 'active' : ''} onClick={() => setActiveTab('announcements')}>Announcements</button>
        <button className={activeTab === 'logs' ? 'active' : ''} onClick={() => setActiveTab('logs')}>Security Logs</button>
      </div>

      {/* Hide status filters if in Announcements or Logs */}
      {['alumni', 'students'].includes(activeTab) && (
        <div className="status-filters">
          <button className={statusFilter === 'pending' ? 'selected' : ''} onClick={() => setStatusFilter('pending')}>Pending Approval</button>
          <button className={statusFilter === 'verified' ? 'selected' : ''} onClick={() => setStatusFilter('verified')}>Verified Users</button>
        </div>
      )}

      <div className="tab-content">
        {activeTab === 'announcements' ? (
  <div className="admin-announcement-container">
    {/* 1. Sub-Tabs Navigation */}
    <div className="sub-tabs">
      <button 
        className={['post', ''].includes(statusFilter) ? 'active-sub-tab' : ''} 
        onClick={() => setStatusFilter('post')}
      >
        Post New
      </button>
      <button 
  className={statusFilter === 'history' ? 'active-sub-tab' : ''} 
  onClick={() => { 
    setStatusFilter('history'); 
    fetchCurrentList(); // Force a refresh when clicking this tab
  }}
>
  Announcement History
</button>
    </div>

    {/* 2. Tab Content */}
    {statusFilter === 'post' ? (
      <form onSubmit={handlePostAnnouncement} className="admin-announcement-form">
        <h3>Create New Announcement</h3>
        <input name="title" placeholder="Announcement Title" required />
        <input name="subject" placeholder="Subject" required />
        <textarea name="content" placeholder="Write full content here..." rows="5" required />
        <button type="submit" className="approve-btn">Publish to All Users</button>
      </form>
    ) : (
      <div className="announcement-history-table">
        <h3>Previous Announcements</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Title</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {listData.length > 0 ? (
              listData.map((item) => (
                <tr key={item._id}>
                  <td>{new Date(item.date).toLocaleDateString()}</td>
                  <td>{item.title}</td>
                  <td>
                    <button className="delete-btn" onClick={() => handleAction(item._id, 'delete-announcement')}>Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="3">No history found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    )}
  </div>
) : loading ? (
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
                          <td><strong>{item.name}</strong><br/><small>@{item.displayName}</small></td>
                          <td>{item.email}<br/><small>{item.mobile}</small></td>
                          <td>{item.branch}<br/>{item.passoutYear}</td>
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
                  <tr><td colSpan="5" style={{textAlign: 'center', padding: '40px'}}>No records found.</td></tr>
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