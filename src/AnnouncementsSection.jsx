import { useState, useEffect } from 'react';

function AnnouncementsSection() {
  const [list, setList] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user')); 
const userRole = user ? user.role : 'all';

  useEffect(() => {
  // Pass the role as a query parameter
  fetch(`/api/announcements?role=${userRole}`)
    .then(res => {
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    })
    .then(data => {
      setList(Array.isArray(data) ? data : []);
      setLoading(false);
    })
    .catch(err => {
      console.error("Announcements error:", err);
      setList([]);
      setLoading(false);
    });
}, [userRole]);

  if (loading) return <div className="tab-pane"><p>Loading announcements...</p></div>;

  return (
    <div className="announcement-container">
      <h2>Announcements</h2>
      {list.length === 0 ? (
        <p>No announcements at this time.</p>
      ) : (
        list.map(item => (
          <div key={item._id} className="announcement-item">
            <div className="announcement-header" onClick={() => setExpandedId(expandedId === item._id ? null : item._id)}>
              <strong>{item.title}</strong> — <span>{item.subject}</span>
            </div>
            {expandedId === item._id && (
              <div className="announcement-body">
                <p>{item.content}</p>
                <small>{new Date(item.date).toLocaleDateString()}</small>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default AnnouncementsSection;