import { useState, useEffect } from 'react';

function ConnectHub({ user }) {
  const [activeSubTab, setActiveSubTab] = useState('bulletin');
  const [notices, setNotices] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedNotice, setSelectedNotice] = useState(null); 
  const [showForm, setShowForm] = useState(false);

  // 1. Fetch Data
  useEffect(() => {
    fetch('/api/notices').then(res => res.json()).then(setNotices);
    if (user.role === 'student') {
      fetch(`/api/connections/student/${user._id}`).then(res => res.json()).then(setHistory);
    }
  }, [user]);

  // 2. Handle Connecting
  const handleConnect = async (notice) => {
    const message = `Hi ${notice.postedBy?.name}, I'm ${user.name} from MBM. I'm interested in the ${notice.title} role at ${notice.company}.`;
    try {
      await fetch('/api/connections/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user._id,
          alumniId: notice.postedBy?._id || notice.postedBy,
          noticeId: notice._id,
          contactMethod: notice.contactMethod
        })
      });
    } catch (err) { console.error(err); }

    let url = notice.contactMethod === 'WhatsApp' 
      ? `https://wa.me/${notice.postedBy?.mobile}?text=${encodeURIComponent(message)}`
      : `mailto:${notice.postedBy?.email}?subject=Inquiry&body=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // 3. Handle Posting Notice
  const handleSubmitNotice = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    data.postedBy = user._id;

    const res = await fetch('/api/notices/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      const newNotice = await res.json();
      setNotices([newNotice, ...notices]);
      setShowForm(false);
      e.target.reset();
    }
  };

  // 4. Handle Deleting Notice
  const handleDelete = async (noticeId) => {
    if (!window.confirm("Remove this post permanently?")) return;
    try {
      const res = await fetch(`/api/notices/${noticeId}`, { method: 'DELETE' });
      if (res.ok) {
        setNotices(notices.filter(n => n._id !== noticeId));
        setSelectedNotice(null); // Return to board
      }
    } catch (err) { console.error(err); }
  };

  // Helper: Check Ownership
  const isOwner = (notice) => {
    const ownerId = notice.postedBy?._id || notice.postedBy;
    return user._id === ownerId;
  };

  return (
    <div className="connect-hub-container">
      <div className="hub-header">
        <div className="hub-tabs">
          <button className={activeSubTab === 'bulletin' ? 'active' : ''} onClick={() => {setActiveSubTab('bulletin'); setSelectedNotice(null);}}>Bulletin Board</button>
          <button className={activeSubTab === 'history' ? 'active' : ''} onClick={() => setActiveSubTab('history')}>My History</button>
        </div>
        {user.role === 'alumni' && <button className="add-notice-btn" onClick={() => setShowForm(true)}>+ Post Opportunity</button>}
      </div>

      {activeSubTab === 'bulletin' ? (
        <>
          {!selectedNotice ? (
            <div className="notice-grid">
              {notices.map(n => (
                <div key={n._id} className="notice-card glance" onClick={() => setSelectedNotice(n)}>
                  <div className="notice-badge">{n.opportunityType}</div>
                  <h4>{n.title}</h4>
                  <p className="company-tag">🏢 {n.company}</p>
                  <span className="posted-at">📅 {new Date(n.createdAt).toLocaleDateString()}</span>
                  <p className="click-hint">Click for full details →</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="notice-detail-view">
              <button className="admin-btn" style={{width: 'auto', marginBottom: '20px'}} onClick={() => setSelectedNotice(null)}>← Back to Board</button>
              <div className="detail-content">
                <span className="badge-pill">{selectedNotice.opportunityType}</span>
                <h2>{selectedNotice.title}</h2>
                <p><strong>{selectedNotice.company}</strong> • {selectedNotice.location}</p>
                <div className="details-text">{selectedNotice.details}</div>
                <p className="deadline-text">⏳ Apply by: {new Date(selectedNotice.deadline).toLocaleDateString()}</p>
                <div className="detail-footer">
                  <p>Posted by: <strong>{selectedNotice.postedBy?.name || "Alumni"}</strong></p>
                  <div className="action-row" style={{display: 'flex', gap: '10px'}}>
                    <button className="submit-btn" onClick={() => handleConnect(selectedNotice)}>Connect Now</button>
                    {isOwner(selectedNotice) && <button className="delete-btn" style={{width: 'auto'}} onClick={() => handleDelete(selectedNotice._id)}>Delete</button>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="history-section">
          <table className="admin-table">
            <thead>
              <tr><th>Date</th><th>Alumni</th><th>Opportunity</th><th>Method</th></tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h._id}>
                  <td>{new Date(h.connectedAt).toLocaleDateString()}</td>
                  <td>{h.alumni?.name}</td>
                  <td>{h.notice?.title}</td>
                  <td><span className="badge-pill">{h.contactMethod}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-box notice-form-modal">
            <h3>Post Opportunity</h3>
            <form onSubmit={handleSubmitNotice} style={{textAlign: 'left'}}>
              <label>Role Title</label>
              <input name="title" required />
              <div className="input-group">
                <div><label>Company</label><input name="company" required /></div>
                <div><label>Location</label><input name="location" required /></div>
              </div>
              <div className="input-group">
                <div><label>Type</label>
                  <select name="opportunityType">
                    <option>Internship</option><option>Full-time</option><option>Referral</option>
                  </select>
                </div>
                <div><label>Deadline</label><input type="date" name="deadline" required /></div>
              </div>
              <label>Contact Method</label>
              <select name="contactMethod"><option>WhatsApp</option><option>Email</option></select>
              <label>Details</label>
              <textarea name="details" rows="4" required />
              <div className="button-row" style={{display: 'flex', gap: '10px'}}>
                <button type="submit" className="submit-btn">Post</button>
                <button type="button" className="admin-btn" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConnectHub;