import { useState, useEffect } from 'react';

function ConnectHub({ user, setSidebarContent }) {
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
  
  const getDeadlineStatus = (deadline) => {
    const now = new Date();
    const target = new Date(deadline);
    const diffTime = target - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffTime < 0) return { label: 'Expired', class: 'expired' };
    if (diffDays <= 2) return { label: 'Closing Soon', class: 'urgent' };
    return { label: `${diffDays} days left`, class: 'active' };
  };

  const hasContacted = (noticeId) => {
    return history.some(h => (h.notice?._id || h.notice) === noticeId);
  };

  const handleToggleFilled = async (noticeId, currentStatus) => {
    try {
      const res = await fetch(`/api/notices/${noticeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFilled: !currentStatus })
      });
      if (res.ok) {
        setNotices(notices.map(n => n._id === noticeId ? { ...n, isFilled: !currentStatus } : n));
      }
    } catch (err) { console.error(err); }
  };

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
    if (notice.isFilled || new Date(notice.deadline) < new Date()) {
      alert("This notice is no longer accepting inquiries.");
      return;
    }
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

  useEffect(() => {
    if (!setSidebarContent) return;
    if (activeSubTab === 'bulletin' && !selectedNotice) {
      setSidebarContent(
        <div className="search-sidebar-container" style={{ padding: '20px' }}>
          <h3 style={{ color: 'var(--mbm-blue)', marginBottom: '20px' }}>Connect Hub</h3>
          <div style={{ marginBottom: '25px' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Search</label>
            <input 
              className="partition-input" 
              type="text" 
              placeholder="Role or Company..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
          <div style={{ marginBottom: '25px' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Opportunity Type</label>
            <select 
              className="partition-input"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ width: '100%', cursor: 'pointer' }}
            >
              <option value="All">All Types</option>
              <option value="Internship">Internship</option>
              <option value="Full-time">Full-time</option>
              <option value="Referral">Referral</option>
              <option value="Project">Project</option>
              <option value="Scholarship">Scholarship</option>
            </select>
          </div>
          <button className="nav-btn" style={{ width: '100%', marginTop: '10px' }} onClick={() => { setSearchQuery(''); setFilterType('All'); }}>Clear Filters</button>
        </div>
      );
    } else {
      setSidebarContent(
        <div style={{ padding: '20px' }}>
          <h3 style={{ color: 'var(--mbm-blue)' }}>Connect Hub</h3>
          <p style={{ fontSize: '0.9rem', color: '#666' }}>
            {activeSubTab === 'history' ? "Viewing your connection history." : 
             activeSubTab === 'myposts' ? "Managing your posted opportunities." : 
             "Viewing opportunity details."}
          </p>
        </div>
      );
    }
    return () => setSidebarContent(null);
  }, [searchQuery, filterType, activeSubTab, selectedNotice, setSidebarContent]);

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

      <div className="hub-content-body" style={{ marginTop: '20px' }}>
        {activeSubTab === 'bulletin' && (
          <>
            {!selectedNotice ? (
              <div className="notice-grid">
                {filteredNotices.map(n => {
                  const deadline = getDeadlineStatus(n.deadline);
                  const contacted = hasContacted(n._id);
                  return (
                    <div key={n._id} className={`notice-card glance ${n.isFilled ? 'filled-status' : ''}`} onClick={() => setSelectedNotice(n)}>
                      <div className="card-top-row">
                        <div className="notice-badge">{n.opportunityType}</div>
                        <div className={`deadline-badge ${deadline.class}`}>{deadline.label}</div>
                      </div>
                      <h4>{n.title}</h4>
                      <p className="company-tag">🏢 {n.company}</p>
                      <div className="card-footer-tags">
                        <span className="posted-at">📅 {new Date(n.createdAt).toLocaleDateString()}</span>
                        {contacted && <span className="contacted-tag">✓ Contacted</span>}
                        {n.isFilled && <span className="filled-tag">Filled</span>}
                      </div>
                    </div>
                  );
                })}
                {filteredNotices.length === 0 && <p style={{gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#888'}}>No matches found.</p>}
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
                    <button className="nav-btn" style={{width: 'auto', fontSize: '0.8rem'}} onClick={() => setViewProfile(selectedNotice.postedBy)}>View Profile</button>
                  </div>
                  <div className="action-row" style={{marginTop: '20px', display: 'flex', gap: '10px'}}>
                    <button 
                      className="submit-btn" 
                      disabled={selectedNotice.isFilled || new Date(selectedNotice.deadline) < new Date()}
                      style={{ backgroundColor: (selectedNotice.isFilled || new Date(selectedNotice.deadline) < new Date()) ? '#ccc' : '' }}
                      onClick={() => handleConnect(selectedNotice)}
                    >
                      {selectedNotice.isFilled ? "Position Filled" : (new Date(selectedNotice.deadline) < new Date() ? "Expired" : "Connect Now")}
                    </button>
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
                  <tr><td colSpan="4" style={{textAlign: 'center', padding: '20px', color: '#888'}}>No connection history found.</td></tr>
                )}
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
                  <div className="action-row" style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                    <button 
                      className="nav-btn" 
                      style={{backgroundColor: n.isFilled ? '#6c757d' : '#2ecc71', fontSize: '0.8rem'}}
                      onClick={() => handleToggleFilled(n._id, n.isFilled)}
                    >
                      {n.isFilled ? "Re-open" : "Mark as Filled"}
                    </button>
                    <button className="delete-btn" style={{backgroundColor: '#ff3f52', fontSize: '0.8rem'}} onClick={() => handleDelete(n._id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {viewProfile && (
        <div className="modal-overlay">
          <div className="modal-box mini-profile-box">
            <div className="profile-header-mini">
              {viewProfile.profilePhoto ? (
                <img src={viewProfile.profilePhoto.startsWith('http') ? viewProfile.profilePhoto : `/${viewProfile.profilePhoto}`} alt="Profile" className="profile-avatar-mini" onError={(e) => { e.target.src = '/default-avatar.png'; }} />
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