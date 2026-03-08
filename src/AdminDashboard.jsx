import { useState, useEffect } from 'react';

function AdminDashboard({ setView }) {
  const [activeTab, setActiveTab] = useState('alumni'); // 'alumni', 'students', 'logs'
  const [data, setData] = useState({
    pendingAlumni: [],
    approvedAlumni: [],
    pendingStudents: [],
    approvedStudents: [],
    logs: []
  });

  const fetchData = async () => {
    try {
      // Fetching multiple endpoints at once
      const [pAlumni, aAlumni, pStudents, aStudents, logs] = await Promise.all([
        fetch('/api/admin/pending/alumni').then(res => res.json()),
        fetch('/api/get-alumni').then(res => res.json()), // Your existing map route
        fetch('/api/admin/pending/student').then(res => res.json()),
        fetch('/api/admin/approved/student').then(res => res.json()), // You'll need this route
        fetch('/api/admin/logs').then(res => res.json())
      ]);

      setData({
        pendingAlumni: pAlumni,
        approvedAlumni: aAlumni,
        pendingStudents: pStudents,
        approvedStudents: aStudents,
        logs: logs
      });
    } catch (err) {
      console.error("Data fetch error:", err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (id, action) => {
    const url = action === 'approve' ? `/api/verify-user/${id}` : `/api/delete-user/${id}`;
    const method = action === 'approve' ? 'PATCH' : 'DELETE';
    const response = await fetch(url, { method });
    if (response.ok) {
      alert(`User ${action}d!`);
      fetchData();
    }
  };

  const Table = ({ title, list, isPending }) => (
    <div className="admin-section">
      <h3>{title} ({list.length})</h3>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Branch</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map(u => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.branch}</td>
                <td>
                  {isPending && <button className="approve-btn" onClick={() => handleAction(u._id, 'approve')}>Approve</button>}
                  <button className="delete-btn" onClick={() => handleAction(u._id, 'reject')}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="admin-modal-content">
      <div className="admin-header">
        <h2>Admin Control Panel</h2>
        <button type="button" className="back-btn" onClick={() => setView('home')}>Close Dashboard</button>
      </div>

      <div className="admin-tabs">
        <button className={activeTab === 'alumni' ? 'active' : ''} onClick={() => setActiveTab('alumni')}>Alumni</button>
        <button className={activeTab === 'students' ? 'active' : ''} onClick={() => setActiveTab('students')}>Students</button>
        <button className={activeTab === 'logs' ? 'active' : ''} onClick={() => setActiveTab('logs')}>Security Logs</button>
      </div>

      <div className="tab-content">
        {activeTab === 'alumni' && (
          <>
            <Table title="Pending Alumni" list={data.pendingAlumni} isPending={true} />
            <Table title="Verified Alumni" list={data.approvedAlumni} isPending={false} />
          </>
        )}

        {activeTab === 'students' && (
          <>
            <Table title="Pending Students" list={data.pendingStudents} isPending={true} />
            <Table title="Verified Students" list={data.approvedStudents} isPending={false} />
          </>
        )}

        {activeTab === 'logs' && (
          <div className="admin-section">
            <h3>Contact View History</h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Viewer</th>
                    <th>Viewed Alumni</th>
                    <th>Date/Time</th>
                  </tr>
                </thead>
                <tbody>
                  {data.logs.map(log => (
                    <tr key={log._id}>
                      <td>{log.viewerName}</td>
                      <td>{log.alumniName}</td>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;