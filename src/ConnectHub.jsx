import { useState, useEffect } from 'react';

function ConnectHub({ user }) {
  const [activeSubTab, setActiveSubTab] = useState('bulletin');
  const [notices, setNotices] = useState([]);
  const [history, setHistory] = useState([]);
  const [showForm, setShowForm] = useState(false);

  // Fetch data on load
  useEffect(() => {
    fetch('/api/notices').then(res => res.json()).then(setNotices);
    if (user.role === 'student') {
      fetch(`/api/connections/student/${user._id}`).then(res => res.json()).then(setHistory);
    }
  }, [user]);

  // Logic to handle connecting
  const handleConnect = async (notice) => {
    const message = `Hi ${notice.postedBy.name}, I'm ${user.name} from MBM. I'm interested in the ${notice.title} role at ${notice.company}.`;
  
    const isOwner = (notice) => {
    const ownerId = notice.postedBy?._id || notice.postedBy;
    return user._id === ownerId;
  };

    // Log connection to DB
    try {
      await fetch('/api/connections/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user._id,
          alumniId: notice.postedBy._id,
          noticeId: notice._id,
          contactMethod: notice.contactMethod
        })
      });
    } catch (err) { console.error(err); }

    let url = notice.contactMethod === 'WhatsApp' 
      ? `https://wa.me/${notice.postedBy.mobile}?text=${encodeURIComponent(message)}`
      : `mailto:${notice.postedBy.email}?subject=Inquiry&body=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Logic to post new notice
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
    }
  };

  return (
    <div className="connect-hub-container">
      <div className="hub-header">
        <div className="hub-tabs">
          <button className={activeSubTab === 'bulletin' ? 'active' : ''} onClick={() => setActiveSubTab('bulletin')}>Bulletin Board</button>
          <button className={activeSubTab === 'history' ? 'active' : ''} onClick={() => setActiveSubTab('history')}>My History</button>
        </div>
        {user.role === 'alumni' && <button className="add-notice-btn" onClick={() => setShowForm(true)}>+ Post Opportunity</button>}
      </div>

      {activeSubTab === 'bulletin' ? (
        <>
          {/* GLANCE VIEW (The Grid) */}
          {!selectedNotice ? (
            <div className="notice-grid">
              {notices.map(n => (
                <div key={n._id} className="notice-card glance" onClick={() => setSelectedNotice(n)}>
                  <div className="notice-badge">{n.opportunityType}</div>
                  <h4>{n.title}</h4>
                  <p className="company-tag">🏢 {n.company}</p>
                  <span className="posted-at">Posted: {new Date(n.createdAt).toLocaleDateString()}</span>
                  <p className="click-hint">Click to view details →</p>
                </div>
              ))}
            </div>
          ) : (
            /* FULL DETAIL VIEW */
            <div className="notice-detail-view">
              <button className="back-btn" onClick={() => setSelectedNotice(null)}>← Back to Board</button>
              
              <div className="detail-content">
                <div className="detail-header">
                  <span className="notice-badge-large">{selectedNotice.opportunityType}</span>
                  <h2>{selectedNotice.title}</h2>
                  <h3>{selectedNotice.company} • {selectedNotice.location}</h3>
                  <p className="timestamp">Published on: {new Date(selectedNotice.createdAt).toLocaleString()}</p>
                </div>

                <div className="detail-body">
                  <label>Description & Requirements:</label>
                  <div className="details-text">{selectedNotice.details}</div>
                  
                  <p className="deadline-text">⏳ Application Deadline: {new Date(selectedNotice.deadline).toLocaleDateString()}</p>
                </div>

                <div className="detail-footer">
                  <div className="author-info">Posted by: <strong>{selectedNotice.postedBy?.name || "Alumni"}</strong></div>
                  
                  <div className="action-row">
                    <button className="connect-btn-large" onClick={() => handleConnect(selectedNotice)}>
                      Connect via {selectedNotice.contactMethod}
                    </button>

                    {/* FIXED DELETE LOGIC */}
                    {isOwner(selectedNotice) && (
                      <button className="delete-btn-large" onClick={() => handleDelete(selectedNotice._id)}>
                        Remove Post
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <ConnectionHistory user={user} />
      )}

      {/* MODAL FORM (Updated with labels) */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-box notice-form-modal">
            <h3>Post New Opportunity</h3>
            <form onSubmit={handleSubmitNotice}>
              <div className="form-field">
                <label>Job/Internship Title</label>
                <input name="title" required placeholder="e.g. Software Engineering Intern" />
              </div>
              
              <div className="input-group">
                <div className="form-field">
                  <label>Company Name</label>
                  <input name="company" required />
                </div>
                <div className="form-field">
                  <label>Location</label>
                  <input name="location" required />
                </div>
              </div>

              <div className="input-group">
                <div className="form-field">
                  <label>Opportunity Type</label>
                  <select name="opportunityType">
                    <option value="Internship">Internship</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Project">Project</option>
                    <option value="Referral">Referral</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Deadline Date</label>
                  <input type="date" name="deadline" required />
                </div>
              </div>

              <div className="form-field">
                <label>Preferred Contact Channel</label>
                <select name="contactMethod">
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Email">Email</option>
                </select>
              </div>

              <div className="form-field">
                <label>Details & Link</label>
                <textarea name="details" rows="5" required />
              </div>

              <div className="button-row">
                <button type="submit" className="submit-btn">Post Opportunity</button>
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