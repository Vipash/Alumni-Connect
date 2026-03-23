import { useState, useEffect } from 'react';

function ConnectHub({ user }) {
  const [activeSubTab, setActiveSubTab] = useState('bulletin');
  const [notices, setNotices] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedNotice, setSelectedNotice] = useState(null); 
  const [viewProfile, setViewProfile] = useState(null); 
  const [showForm, setShowForm] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');

  useEffect(() => {
    fetch('/api/notices').then(res => res.json()).then(setNotices);
    
    const endpoint = user.role === 'student' 
      ? `/api/connections/student/${user._id}` 
      : `/api/connections/alumni/${user._id}`;
      
    fetch(endpoint).then(res => res.json()).then(setHistory);
  }, [user, activeSubTab]);

  // Filtering Logic
  const filteredNotices = notices.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || n.opportunityType === filterType;
    return matchesSearch && matchesType;
  });
  
  const handleSubmitNotice = async (e) => {
    e.preventDefault(); 
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    data.postedBy = user._id;

    try {
      const res = await fetch('/api/notices/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        const newNotice = await res.json();
        setNotices([newNotice, ...notices]);
        setShowForm(false);
        setActiveSubTab('myposts'); 
      }
    } catch (err) { console.error("Post failed:", err); }
  };

  const handleDelete = async (noticeId) => {
    if (!window.confirm("Delete this notice?")) return;
    try {
      const res = await fetch(`/api/notices/${noticeId}`, { method: 'DELETE' });
      if (res.ok) {
        setNotices(notices.filter(n => n._id !== noticeId));
      }
    } catch (err) { console.error(err); }
  };

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
        {user.role === 'alumni' && <button className="add-notice-btn" onClick={() => setShowForm(true)}>+ Post Notice</button>}
      </div>

      {activeSubTab === 'bulletin' && (
        <>
          {!selectedNotice ? (
            <>
              <div className="search-bar-container">
                <input 
                  type="text" 
                  placeholder="Search by Role or Company..." 
                  className="hub-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select 
                  className="hub-filter-select"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="All">All Types</option>
                  <option value="Internship">Internship</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Referral">Referral</option>
                  <option value="Project">Project</option>
                  <option value="Scholarship">Scholarship</option>
                </select>
              </div>

              <div className="notice-grid">
                {/* Use filteredNotices here instead of notices */}
                {filteredNotices.map(n => (
                  <div key={n._id} className="notice-card glance" onClick={() => setSelectedNotice(n)}>
                    <div className="notice-badge">{n.opportunityType}</div>
                    <h4>{n.title}</h4>
                    <p className="company-tag">🏢 {n.company}</p>
                    <span className="posted-at">📅 {new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
                {filteredNotices.length === 0 && <p style={{gridColumn: '1/-1', textAlign: 'center', color: '#888'}}>No matches found.</p>}
              </div>
            </>
          ) : (
            <div className="notice-detail-view">
              <button className="admin-btn" style={{width: 'auto', marginBottom: '15px'}} onClick={() => setSelectedNotice(null)}>← Back</button>
              <div className="detail-content">
                <span className="badge-pill">{selectedNotice.opportunityType}</span>
                <h2>{selectedNotice.title}</h2>
                <div className="details-text">{selectedNotice.details}</div>
                
                <div className="alumni-mini-card">
                  <p>Posted by: <strong>{selectedNotice.postedBy?.name}</strong></p>
                  <button className="nav-btn" style={{width: 'auto', fontSize: '0.8rem'}} onClick={() => setViewProfile(selectedNotice.postedBy)}>View Profile</button>
                </div>

                <div className="action-row" style={{marginTop: '20px', display: 'flex', gap: '10px'}}>
                  <button className="submit-btn" onClick={() => handleConnect(selectedNotice)}>Connect Now</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeSubTab === 'history' && (
        <div className="history-section">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Contacted Alumni</th>
                <th>Role</th>
                <th>Method</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? history.map(h => (
                <tr key={h._id}>
                  <td>{new Date(h.connectedAt).toLocaleDateString()}</td>
                  <td>{h.alumni?.name || "Unknown Alumni"}</td>
                  <td>{h.notice?.title || "General Inquiry"}</td>
                  <td><span className="badge-pill">{h.contactMethod}</span></td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" style={{textAlign: 'center', padding: '20px', color: '#888'}}>
                    No connection history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeSubTab === 'myposts' && (
        <div className="history-section">
          <h3>Your Active Listings</h3>
          <div className="notice-grid">
            {myPosts.length > 0 ? myPosts.map(n => (
              <div key={n._id} className="notice-card">
                <h4>{n.title}</h4>
                <p>{n.company}</p>
                <button className="delete-btn" style={{backgroundColor: '#ff3f52'}} onClick={() => handleDelete(n._id)}>Delete Post</button>
              </div>
            )) : <p>You haven't posted any notices yet.</p>}
          </div>
        </div>
      )}

      {viewProfile && (
        <div className="modal-overlay">
          <div className="modal-box mini-profile-box">
            <div className="profile-header-mini">
               {viewProfile.profilePhoto ? (
                <img 
                  src={viewProfile.profilePhoto.startsWith('http') 
                    ? viewProfile.profilePhoto 
                    : `/${viewProfile.profilePhoto}`}
                  alt="Profile" 
                  className="profile-avatar-mini" 
                  onError={(e) => { e.target.src = '/default-avatar.png'; }}
                />
              ) : (
                <div className="avatar-placeholder">{viewProfile.name?.[0]}</div>
              )}
               <h3>{viewProfile.name}</h3>
               <p className="branch-text">{viewProfile.branch} | Class of {viewProfile.passoutYear}</p>
            </div>
            <hr />
            <div className="profile-details-mini" style={{textAlign: 'left'}}>
              <p>🏢 <strong>Company:</strong> {viewProfile.company || 'Not Specified'}</p>
              {viewProfile.bio && <p style={{fontStyle: 'italic', fontSize: '0.9rem', marginTop: '10px'}}>"{viewProfile.bio}"</p>}
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
              <div className="input-group" style={{display: 'flex', gap: '10px'}}>
                <div style={{flex:1}}><label>Company</label><input name="company" required /></div>
                <div style={{flex:1}}><label>Location</label><input name="location" required /></div>
              </div>
              <div className="input-group" style={{display: 'flex', gap: '10px'}}>
                <div style={{flex:1}}><label>Type</label>
                  <select name="opportunityType">
                    <option>Internship</option><option>Full-time</option><option>Referral</option><option>Project</option><option>Scholarship</option>
                  </select>
                </div>
                <div style={{flex:1}}><label>Deadline</label><input type="date" name="deadline" required /></div>
              </div>
              <label>Contact Method</label>
              <select name="contactMethod"><option>WhatsApp</option><option>Email</option></select>
              <label>Details</label>
              <textarea name="details" rows="4" required />
              <div className="button-row" style={{display: 'flex', gap: '10px'}}>
                <button type="submit" className="submit-btn">Post Now</button>
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