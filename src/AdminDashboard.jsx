import { useState, useEffect } from 'react';

function AdminDashboard({ setView }) {
  const [activeTab, setActiveTab] = useState('alumni'); // 'alumni', 'students', 'logs'
  const [statusFilter, setStatusFilter] = useState('pending'); // 'pending', 'verified'
  const [listData, setListData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Helper to determine the correct API URL based on Tab and Filter
  const getApiUrl = () => {
    if (activeTab === 'logs') return '/api/admin/logs';
    
    // Logic for Alumni vs Students
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

  // Refresh whenever the tab or the status filter changes
  useEffect(() => {
    fetchCurrentList();
  }, [activeTab, statusFilter]);

  const handleAction = async (id, action) => {
    const url = action === 'approve' ? `/api/verify-user/${id}` : `/api/delete-user/${id}`;
    const method = action === 'approve' ? 'PATCH' : 'DELETE';
    const response = await fetch(url, { method });
    if (response.ok) {
      alert(`User ${action}d!`);
      fetchCurrentList();
    }
  };

  return (
    <div className="admin-modal-content">
      <div className="admin-header">
        <h2>Admin Control Panel</h2>
        <button type="button" className="back-btn" onClick={() => setView('home')}>Close Dashboard</button>
      </div>

      {/* Primary Tabs (Roles) */}
      <div className="admin-tabs">
        <button className={activeTab === 'alumni' ? 'active' : ''} onClick={() => { setActiveTab('alumni'); setStatusFilter('pending'); }}>Alumni</button>
        <button className={activeTab === 'students' ? 'active' : ''} onClick={() => { setActiveTab('students'); setStatusFilter('pending'); }}>Students</button>
        <button className={activeTab === 'logs' ? 'active' : ''} onClick={() => setActiveTab('logs')}>Security Logs</button>
      </div>

      {/* Sub-Filters (Status) - Hidden if viewing Logs */}
      {activeTab !== 'logs' && (
        <div className="status-filters">
          <button className={statusFilter === 'pending' ? 'selected' : ''} onClick={() => setStatusFilter('pending')}>
            Pending List
          </button>
          <button className={statusFilter === 'verified' ? 'selected' : ''} onClick={() => setStatusFilter('verified')}>
            Registered List
          </button>
        </div>
      )}

      <div className="tab-content">
        {loading ? (
          <p className="loading-text">Loading data...</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                {activeTab === 'logs' ? (
                  <tr><th>Viewer</th><th>Viewed Alumni</th><th>Timestamp</th></tr>
                ) : (
                  <tr><th>Name</th><th>Email</th><th>Branch</th><th>Actions</th></tr>
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
                          <td>{item.name}</td>
                          <td>{item.email}</td>
                          <td>{item.branch}</td>
                          <td>
                            {statusFilter === 'pending' && (
                              <button className="approve-btn" onClick={() => handleAction(item._id, 'approve')}>Approve</button>
                            )}
                            <button className="delete-btn" onClick={() => handleAction(item._id, 'reject')}>Delete</button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4" style={{textAlign: 'center', padding: '20px'}}>No records found.</td></tr>
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