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
        <div className="notice-grid">
          {notices.map(n => (
            <div key={n._id} className="notice-card">
              <div className="notice-badge">{n.opportunityType}</div>
              <h4>{n.title}</h4>
              <p><strong>{n.company}</strong> • {n.location}</p>
              <p className="notice-details">{n.details}</p>
              <div className="notice-footer">
                <span>By: {n.postedBy?.name}</span>
                <button className="connect-btn" onClick={() => handleConnect(n)}>Connect</button>
              </div>
            </div>
          ))}
        </div>
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
                  <td>{h.notice?.title} @ {h.notice?.company}</td>
                  <td>{h.contactMethod}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* FORM MODAL LOGIC */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-box notice-form-modal">
            <h3>Post New Opportunity</h3>
            <form onSubmit={handleSubmitNotice}>
              <input name="title" placeholder="Job/Internship Title" required />
              <div className="input-group">
                <input name="company" placeholder="Company" required />
                <input name="location" placeholder="Location" required />
              </div>
              <div className="input-group">
                <select name="opportunityType">
                  <option value="Internship">Internship</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Project">Project</option>
                  <option value="Referral">Referral</option>
                </select>
                <input type="date" name="deadline" required />
              </div>
              <select name="contactMethod">
                <option value="WhatsApp">WhatsApp</option>
                <option value="Email">Email</option>
              </select>
              <textarea name="details" placeholder="Brief requirements..." rows="4" required />
              <div className="button-row">
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