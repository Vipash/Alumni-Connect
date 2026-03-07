import { useState, useEffect } from 'react';

function AdminDashboard({ setView }) {
  const [pendingUsers, setPendingUsers] = useState([]);

  // Fetch pending alumni
  const fetchPending = () => {
    fetch('/api/admin/pending/alumni')
      .then(res => res.json())
      .then(data => setPendingUsers(data))
      .catch(err => console.error("Error fetching pending:", err));
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (id, action) => {
    const url = action === 'approve' ? `/api/verify-user/${id}` : `/api/delete-user/${id}`;
    const method = action === 'approve' ? 'PATCH' : 'DELETE';

    const response = await fetch(url, { method });
    
    if (response.ok) {
      alert(`User ${action}d successfully!`);
      fetchPending(); // Refresh list
    } else {
      alert("Action failed.");
    }
  };

  return (
    <div className="admin-container">
      <h2>Admin: Pending Alumni</h2>
      <button onClick={() => setView('home')}>Back to Home</button>
      
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
            {pendingUsers.length > 0 ? (
              pendingUsers.map(user => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.branch}</td>
                  <td>
                    <button onClick={() => handleAction(user._id, 'approve')}>Approve</button>
                    <button onClick={() => handleAction(user._id, 'reject')}>Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4">No pending registrations.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminDashboard;