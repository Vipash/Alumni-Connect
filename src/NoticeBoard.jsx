import { useState, useEffect } from 'react';

function NoticeBoard({ user, searchQuery }) {
  const [notices, setNotices] = useState([]);
  const [filter, setFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);

  const query = searchQuery?.toLowerCase() || "";
  const filteredNotices = notices
    .filter(n => filter === 'All' || n.opportunityType === filter)
    .filter(n => 
      n.title?.toLowerCase().includes(query) || 
      n.company?.toLowerCase().includes(query) ||
      n.details?.toLowerCase().includes(query)
    );

  // 1. Fetch notices from backend when component loads
  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const res = await fetch('/api/notices');
        const data = await res.json();
        if (res.ok) setNotices(data);
      } catch (err) {
        console.error("Failed to fetch notices:", err);
      }
    };
    fetchNotices();
  }, []);

  // 2. Handle the "Connect" action
  /* --- Inside NoticeBoard.jsx --- */
const handleConnect = async (notice) => {
    // Safety check
    if (!notice.postedBy) {
      alert("Contact information no longer available.");
      return;
    }

    const message = `Hi ${notice.postedBy.name}, I'm ${user.name} from MBM. I saw your post regarding ${notice.title} at ${notice.company} and would love to connect.`;
  
  // 1. Log to Database
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
  } catch (err) { console.error("Log error", err); }

  // 2. Open WhatsApp/Email
  let url = "";
    if (notice.contactMethod === 'WhatsApp') {
       url = `https://wa.me/${notice.postedBy.mobile}?text=${encodeURIComponent(message)}`;
    } else if (notice.contactMethod === 'Email') {
       url = `mailto:${notice.postedBy.email}?subject=Inquiry: ${notice.title}&body=${encodeURIComponent(message)}`;
    } else {
       // Fallback for LinkedIn or others
       url = notice.postedBy.linkedin || "#";
    }
    window.open(url, '_blank');
  };
  
  // 3. Handle Form Submission
  const handleSubmitNotice = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const noticeData = {
      title: formData.get('title'),
      company: formData.get('company'),
      location: formData.get('location'),
      opportunityType: formData.get('opportunityType'),
      deadline: formData.get('deadline'),
      contactMethod: formData.get('contactMethod'),
      details: formData.get('details'),
      postedBy: user._id // Link to current user
    };

    try {
      const res = await fetch('/api/notices/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noticeData)
      });

      if (res.ok) {
        const newNotice = await res.json();
        setNotices([newNotice, ...notices]); // Add to list immediately
        setShowForm(false);
      } else {
        alert("Failed to post notice.");
      }
    } catch (err) {
      console.error("Error posting notice:", err);
    }
  };

  const handleDelete = async (noticeId) => {
  if (!window.confirm("Are you sure you want to remove this opportunity?")) return;

  try {
    const res = await fetch(`/api/notices/${noticeId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      // Update UI by filtering out the deleted notice
      setNotices(notices.filter(n => n._id !== noticeId));
    } else {
      alert("Failed to delete notice.");
    }
  } catch (err) {
    console.error("Delete error:", err);
  }
};

  return (
    <div className="notice-board-container">
      <div className="board-header">
        <div className="header-left">
          <h2>Opportunity Bulletin 📋</h2>
          <div className="filter-tabs">
            {['All', 'Internship', 'Full-time', 'Project', 'Referral'].map(tab => (
              <button 
                key={tab} 
                className={filter === tab ? 'active' : ''} 
                onClick={() => setFilter(tab)}
              >{tab}</button>
            ))}
          </div>
        </div>
        
        {/* ALUMNI ONLY BUTTON */}
        {user.role === 'alumni' && (
          <button className="add-notice-btn" onClick={() => setShowForm(true)}>
            + Post Opportunity
          </button>
        )}
      </div>

      {/* MODAL FORM */}
      {showForm && (
        <div className="modal-overlay">
          <form className="modal-box notice-form" onSubmit={handleSubmitNotice}>
            <h3>Post New Opportunity</h3>
            <p className="security-notice">
              By posting, you agree to share contact details with students.
            </p>

            <input name="title" placeholder="Job/Internship Title" required />
            <div className="input-group">
              <input name="company" placeholder="Company" required />
              <input name="location" placeholder="Location" required />
            </div>

            <label>Type & Deadline</label>
            <div className="input-group">
              <select name="opportunityType">
                <option value="Internship">Internship</option>
                <option value="Full-time">Full-time</option>
                <option value="Project">Project</option>
                <option value="Referral">Referral</option>
              </select>
              <input type="date" name="deadline" required />
            </div>

            <label>Preferred Contact via:</label>
            <select name="contactMethod">
              <option value="WhatsApp">WhatsApp</option>
              <option value="Email">Email</option>
              <option value="LinkedIn">LinkedIn</option>
            </select>

            <textarea name="details" placeholder="Brief description & requirements..." rows="4" required />

            <div className="button-row">
              <button type="submit" className="submit-btn">Post to Board</button>
              <button type="button" className="admin-btn" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* FEED GRID */}
      <div className="notice-grid">
        {notices
          .filter(n => filter === 'All' || n.opportunityType === filter)
          .map(notice => (
            <div key={notice._id} className="notice-card">
              <div className="notice-badge">{notice.opportunityType}</div>
              <h4>{notice.title}</h4>
              <p className="company-tag">🏢 {notice.company} • {notice.location}</p>
              
              <div className="notice-details">
                <p><strong>Details:</strong> {notice.details}</p>
                <p className="deadline-text">⏳ Deadline: {new Date(notice.deadline).toLocaleDateString()}</p>
              </div>

              <div className="notice-footer">
                <span className="posted-by">By: {notice.postedBy?.name || "Alumni"}</span>
                <div className="action-group" style={{ display: 'flex', gap: '10px' }}>
                    {user._id === notice.postedBy?._id && (
                    <button className="delete-btn-small" onClick={() => handleDelete(notice._id)}>
                        🗑️
                    </button>
                    )}
                <button className="connect-btn" onClick={() => handleConnect(notice)}>
                  Connect via {notice.contactMethod}
                </button>
              </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default NoticeBoard;