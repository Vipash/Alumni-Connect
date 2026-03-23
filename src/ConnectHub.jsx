import { useState, useEffect } from 'react';

function ConnectHub({ user }) {
  const [activeSubTab, setActiveSubTab] = useState('bulletin');
  const [notices, setNotices] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedNotice, setSelectedNotice] = useState(null); 
  const [viewProfile, setViewProfile] = useState(null); // State for Mini Profile
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch('/api/notices').then(res => res.json()).then(setNotices);
    // Fetch history for BOTH roles now
    const endpoint = user.role === 'student' ? `/api/connections/student/${user._id}` : `/api/connections/alumni/${user._id}`;
    fetch(endpoint).then(res => res.json()).then(setHistory);
  }, [user]);

  const handleConnect = async (notice) => {
    const message = `Hi ${notice.postedBy?.name}, I'm ${user.name} from MBM...`;
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

  const myPosts = notices.filter(n => (n.postedBy?._id || n.postedBy) === user._id);

  return (
    <div className="connect-hub-container">
      <div className="hub-header">
        <div className="hub-tabs">
          <button className={activeSubTab === 'bulletin' ? 'active' : ''} onClick={() => {setActiveSubTab('bulletin'); setSelectedNotice(null);}}>Bulletin Board</button>
          <button className={activeSubTab === 'history' ? 'active' : ''} onClick={() => setActiveSubTab('history')}>Connection History</button>
          {user.role === 'alumni' && (
            <button className={activeSubTab === 'myposts' ? 'active' : ''} onClick={() => setActiveSubTab('myposts')}>My Posts</button>
          )}
        </div>
        {user.role === 'alumni' && <button className="add-notice-btn" onClick={() => setShowForm(true)}>+ Post Opportunity</button>}
      </div>

      {activeSubTab === 'bulletin' && (
        !selectedNotice ? (
          <div className="notice-grid">
            {notices.map(n => (
              <div key={n._id} className="notice-card glance" onClick={() => setSelectedNotice(n)}>
                <div className="notice-badge">{n.opportunityType}</div>
                <h4>{n.title}</h4>
                <p className="company-tag">🏢 {n.company}</p>
                <span className="posted-at">📅 {new Date(n.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="notice-detail-view">
            <button className="admin-btn" style={{width: 'auto', marginBottom: '15px'}} onClick={() => setSelectedNotice(null)}>← Back</button>
            <div className="detail-content">
              <span className="badge-pill">{selectedNotice.opportunityType}</span>
              <h2>{selectedNotice.title}</h2>
              <div className="details-text">{selectedNotice.details}</div>
              
              <div className="alumni-mini-card">
                <p>Posted by: <strong>{selectedNotice.postedBy?.name}</strong></p>
                <button className="nav-btn" style={{width: 'auto', fontSize: '0.8rem'}} onClick={() => setViewProfile(selectedNotice.postedBy)}>View Mini Profile</button>
              </div>

              <div className="action-row" style={{marginTop: '20px', display: 'flex', gap: '10px'}}>
                <button className="submit-btn" onClick={() => handleConnect(selectedNotice)}>Connect Now</button>
              </div>
            </div>
          </div>
        )
      )}

      {activeSubTab === 'history' && (
        <div className="history-section">
          <table className="admin-table">
            <thead>
              <tr><th>Date</th><th>{user.role === 'student' ? 'Alumni' : 'Student'}</th><th>Opportunity</th><th>Method</th></tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h._id}>
                  <td>{new Date(h.connectedAt).toLocaleDateString()}</td>
                  <td>{user.role === 'student' ? h.alumni?.name : h.student?.name}</td>
                  <td>{h.notice?.title}</td>
                  <td><span className="badge-pill">{h.contactMethod}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeSubTab === 'myposts' && (
        <div className="history-section">
          <h3>Your Active Listings</h3>
          <div className="notice-grid">
            {myPosts.map(n => (
              <div key={n._id} className="notice-card">
                <h4>{n.title}</h4>
                <p>{n.company}</p>
                <button className="delete-btn" onClick={() => handleDelete(n._id)}>Delete Post</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MINI PROFILE MODAL */}
      {viewProfile && (
        <div className="modal-overlay">
          <div className="modal-box mini-profile-box">
            <div className="profile-header-mini">
               {/* Replace with actual avatar logic if available */}
               <div className="avatar-placeholder">{viewProfile.name?.[0]}</div>
               <h3>{viewProfile.name}</h3>
               <p className="branch-text">{viewProfile.branch} | {viewProfile.passoutYear}</p>
            </div>
            <hr />
            <div className="profile-details-mini">
              <p>🏢 <strong>Company:</strong> {viewProfile.company || 'Not Specified'}</p>
              <p>📍 <strong>Location:</strong> {viewProfile.location?.city || 'Remote/N/A'}</p>
            </div>
            <button className="admin-btn" onClick={() => setViewProfile(null)}>Close</button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-box notice-form-modal">
            <h3>Post Notice</h3>
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
                    <option>Internship</option><option>Full-time</option><option>Referral</option><option>Project</option><option>Scholarship</option>
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